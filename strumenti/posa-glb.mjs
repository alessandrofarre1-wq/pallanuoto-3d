// Mette in posa un .glb con scheletro in Three.js, con la tecnica del gioco, e salva un foglio di immagini.
// Uso: node strumenti/posa-glb.mjs <file.glb> <uscita.png> [--argilla]
import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const QUI = path.dirname(fileURLToPath(import.meta.url)), [GLB, USCITA] = process.argv.slice(2).filter(a => !a.startsWith('--')), argilla = process.argv.includes('--argilla');
const server = await createServer({ root: path.join(QUI, 'converti'), logLevel: 'warn', server: { port: 4197, host: '127.0.0.1' } }); await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errori = [], glb = fs.readFileSync(GLB).toString('base64'), file = []; let info = null;
const apri = async () => { const pg = await browser.newPage({ viewport: { width: 700, height: 700 } }); pg.on('pageerror', e => errori.push(e.message)); pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errori.push(m.text().slice(0, 200)); });
  await pg.goto(server.resolvedUrls.local[0] + 'posa-glb.html'); await pg.waitForFunction('window.pronto', null, { polling: 100 }); return pg; };
let pg = await apri(); const nomi = await pg.evaluate(() => window.pose); await pg.close();
for (const nome of nomi) for (const [k, vista] of [[-0.55, 0.18, 1], [0.75, 0.2, -0.7]].entries()) {
  pg = await apri(); info = await pg.evaluate(a => window.posa(a), { glb, largo: 700, alto: 700, nome, vista, argilla });
  const f = USCITA.replace(/\.png$/, `-${file.length}.png`); await pg.locator('#c').screenshot({ path: f }); file.push([f, nome + (k ? ' · da dietro' : '')]); await pg.close();
}
const p2 = await browser.newPage({ viewport: { width: 1700, height: 900 } });
await p2.setContent(`<body style="margin:0;background:#111"><div id="c" style="display:grid;grid-template-columns:repeat(4,400px);gap:3px;padding:3px;width:max-content">${file.map(([f, t]) => `<div style="position:relative"><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}" style="display:block;width:400px"><b style="position:absolute;left:6px;top:4px;color:#fff;font:700 14px system-ui;text-shadow:0 1px 3px #000,0 0 6px #000">${t}</b></div>`).join('')}</div></body>`);
await p2.waitForFunction('[...document.images].every(i => i.complete)', null, { polling: 100 }); await p2.locator('#c').screenshot({ path: USCITA }); for (const [f] of file) fs.unlinkSync(f);
console.log(JSON.stringify({ file: path.basename(GLB), ...info, errori_o_avvisi: [...new Set(errori)] }));
await browser.close(); await server.close();
