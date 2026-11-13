// Immagine del giocatore per la home (come nel concept): node strumenti/eroe.mjs <uscita.png> ['{"parametro":valore}']
// Usa il modello del gioco (src/grafica/modelli/pallanuotista.glb); la posa e l'inquadratura stanno in POSA qui sotto.
import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const QUI = path.dirname(fileURLToPath(import.meta.url)), [USCITA, extra] = process.argv.slice(2);
const POSA = {
  busto: -18, piega: 4, testa: -22, mento: -4,
  bracD: [-0.82, 0.5, 0.05], avamD: [-0.08, 0.95, -0.22], manoD: [0, 0.9, -0.35], palla: [0, 0.05, -0.1],
  bracS: [0.42, -0.5, 0.78], avamS: [0.1, -0.25, 1],
  pelo: 0.32, gocce: 70,
  vista: [-0.62, 0.12, 1], distanza: 3.35, fov: 30, mira: [0, 0, 0]
};
const P = { ...POSA, ...(extra ? JSON.parse(extra) : {}) };
const server = await createServer({ root: path.join(QUI, 'converti'), logLevel: 'warn', server: { port: 4198, host: '127.0.0.1', fs: { allow: [path.join(QUI, '..')] } } }); await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 1300, height: 1100 } }); const errori = [];
pg.on('pageerror', e => errori.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errori.push(m.text().slice(0, 200)); });
await pg.goto(server.resolvedUrls.local[0] + 'eroe.html'); await pg.waitForFunction('window.pronto', null, { polling: 100 });
const glb = fs.readFileSync(path.join(QUI, '../src/grafica/modelli/pallanuotista.glb')).toString('base64');
const info = await pg.evaluate(a => window.disegna(a), { glb, largo: 1300, alto: 1100, P });
await pg.locator('#c').screenshot({ path: USCITA, omitBackground: true, timeout: 120000 });
console.log(JSON.stringify({ ...info, errori }));
await browser.close(); await server.close();
