// Converte i file FBX scaricati da Mixamo in un unico GLB leggero per il gioco.
//   node strumenti/converti-modello.mjs <cartella con modello.fbx, fermo.fbx, nuoto.fbx, ...>
// Ogni file diverso da modello.fbx diventa un'animazione con il nome del file.
// Gli FBX originali NON vanno messi nel repository (licenza Mixamo): si tiene solo il GLB prodotto.
import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, prune, dedup, resample, quantize } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

const QUI = path.dirname(fileURLToPath(import.meta.url));
const cartella = process.argv[2];
if (!cartella) { console.error('Uso: node strumenti/converti-modello.mjs <cartella degli FBX>'); process.exit(1); }
const USCITA = path.join(QUI, '../src/grafica/modelli/giocatore.glb');
const TRIANGOLI = +(process.argv[3] || 5000);   // triangoli desiderati per giocatore

const b64 = f => fs.readFileSync(path.join(cartella, f)).toString('base64');
const animazioni = {};
for (const f of fs.readdirSync(cartella).sort()) if (f.endsWith('.fbx') && f !== 'modello.fbx') animazioni[path.basename(f, '.fbx')] = b64(f);

const server = await createServer({ root: path.join(QUI, 'converti'), logLevel: 'warn', server: { port: 4190, host: '127.0.0.1' } });
await server.listen();
const browser = await chromium.launch();
const pg = await browser.newPage();
pg.on('pageerror', e => console.error('errore nella pagina:', e.message));
pg.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.pronto');
const { info, glb } = await pg.evaluate(a => window.converti(a), { modello: b64('modello.fbx'), animazioni });
await browser.close(); await server.close();
console.log(JSON.stringify(info, null, 1).slice(0, 4000));

// alleggerimento: si producono due versioni del corpo con lo stesso scheletro, una dettagliata per la scena
// e una leggera per la vista sott'acqua (dove le increspature nascondono i dettagli)
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const [nome, triangoli] of [['giocatore.glb', +(process.argv[3] || 5500)], ['giocatore-lontano.glb', +(process.argv[4] || 1800)]]) {
  const doc = await io.readBinary(new Uint8Array(Buffer.from(glb, 'base64')));
  const tri = () => doc.getRoot().listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((k, p) => k + p.getIndices().getCount() / 3, 0), 0);
  await doc.transform(weld());
  const prima = tri();
  // niente compressione delle posizioni: le due versioni devono stare nello stesso spazio per condividere lo scheletro
  await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: Math.min(1, triangoli / prima), error: 0.03 }), resample(), dedup(), prune(),
    quantize({ quantizePosition: 16, quantizeNormal: 10, pattern: /^(NORMAL)$/ }));
  const uscita = path.join(path.dirname(USCITA), nome);
  fs.mkdirSync(path.dirname(uscita), { recursive: true });
  fs.writeFileSync(uscita, await io.writeBinary(doc));
  console.log(`${nome}: triangoli ${prima} → ${tri()} · ${(fs.statSync(uscita).size / 1024).toFixed(0)} kB`);
}
