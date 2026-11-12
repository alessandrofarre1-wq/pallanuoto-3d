// Carica un .glb nella versione di Three.js del gioco, ne stampa i dati e salva un'immagine di prova (originale + due ricolorazioni).
// Uso: node strumenti/prova-glb.mjs <file.glb> <uscita.png>
import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const QUI = path.dirname(fileURLToPath(import.meta.url)), [GLB, USCITA] = process.argv.slice(2);
const server = await createServer({ root: path.join(QUI, 'converti'), logLevel: 'warn', server: { port: 4196, host: '127.0.0.1' } }); await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 1500, height: 800 } }); const errori = [];
pg.on('pageerror', e => errori.push(e.message)); pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errori.push(m.text().slice(0, 200)); });
await pg.goto(server.resolvedUrls.local[0] + 'prova-glb.html'); await pg.waitForFunction('window.pronto', null, { polling: 100 });
const info = await pg.evaluate(a => window.prova(a), { glb: fs.readFileSync(GLB).toString('base64'), largo: 1500, alto: 800 });
await pg.locator('#c').screenshot({ path: USCITA });
console.log(JSON.stringify({ file: path.basename(GLB), kB: Math.round(fs.statSync(GLB).size / 1024), ...info, errori_o_avvisi: errori }));
await browser.close(); await server.close();
