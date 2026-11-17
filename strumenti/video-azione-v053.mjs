// Fotogrammi di un'azione vera computer contro computer (stesso seme), per il video prima/dopo da mostrare ad Ale (v0.53).
// Camera e grafica del gioco, 30 fotogrammi al secondo di tempo di gioco. Non misura FPS: il disegno è in software.
// Uso: node strumenti/video-azione-v053.mjs --uscita=cartella [--dist=cartella] [--da=10] [--a=22] [--porta=4423]
import { chromium } from 'playwright';
import { preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => process.argv.find(x => x.startsWith('--' + k + '='))?.slice(k.length + 3);
const uscita = arg('uscita'), dist = arg('dist'), da = +(arg('da') || 10), a = +(arg('a') || 22), porta = +(arg('porta') || 4423);
fs.mkdirSync(uscita, { recursive: true });
const server = await preview({ root: ROOT, logLevel: 'warn', build: { outDir: dist || 'dist' }, preview: { port: porta, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 960, height: 440 } });
await pg.addInitScript(() => {
  let s = 33; window.__rnd = () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__passo = () => { now += 1000 / 60; window.__raf(now); };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 120000, polling: 100 });
await pg.evaluate(da => {
  const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click();
  H.game.autoplay = true; for (const t of H.teams) t.human = false;
  const R = H.renderer, rendi = R.render.bind(R); R.render = () => {}; window.__rendi = rendi;
  for (let k = 0; k < 60 * 60 && !(H.game.state === 'play' && H.game.time >= da); k++) window.__passo();
  R.render = rendi;
}, da);
let n = 0;
while (true) {
  const url = await pg.evaluate(() => { window.__passo(); window.__passo(); const H = window.__pallanuoto; return { t: H.game.time, img: H.renderer.domElement.toDataURL('image/jpeg', 0.9) }; });
  fs.writeFileSync(path.join(uscita, String(n++).padStart(4, '0') + '.jpg'), Buffer.from(url.img.split(',')[1], 'base64'));
  if (url.t >= a || n > 30 * (a - da) + 60) break;
}
console.log(`${n} fotogrammi in ${uscita}`);
await browser.close(); server.httpServer.close();
