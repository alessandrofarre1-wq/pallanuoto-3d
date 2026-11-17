// Diagnosi v0.50 (video di Ale): allo sprint iniziale i corpi nuotano con i piedi avanti sul telefono.
// Misura, nei primi secondi dopo il «Via!», quanti giocatori distesi hanno il fronte (fx,fz) contro la velocità,
// con fotogrammi di durata diversa (--ms=16.7, 8.3, 33, oppure «variabile» 8-40 ms).
// Uso: node strumenti/diagnosi-sprint.mjs [--ms=16.7|variabile] [--dist=cartella]
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => process.argv.find(x => x.startsWith('--' + k + '='))?.slice(k.length + 3);
const ms = arg('ms') || '16.7', dist = arg('dist');
const server = await preview({ root: ROOT, logLevel: 'warn', build: { outDir: dist || 'dist' }, preview: { port: 4416, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 640, height: 300 } });
await pg.addInitScript((ms) => {
  let a = 33; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0, k = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__passo = () => { k++; now += ms === 'variabile' ? 8 + 32 * Math.abs(Math.sin(k * 12.9898) % 1) : +ms; window.__raf(now); };
}, ms);
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 120000, polling: 100 });
const r = await pg.evaluate(() => {
  const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '180'); document.getElementById('goBtn').click();
  H.teams[1].human = false;
  const R = H.renderer; R.render = () => {};
  let n = 0, indietro = 0, t0 = null; const es = [];
  for (let k = 0; k < 4000; k++) {
    window.__passo();
    if (H.game.state !== 'play') continue;
    if (t0 === null) t0 = H.game.time;
    if (H.game.time - t0 > 3) break;
    for (const p of H.allPlayers) {
      if (p.isGK) continue; const sp = Math.hypot(p.vx, p.vz); if (sp < 0.5 || (p.oriz || 0) < 0.5) continue;
      n++; const O = p.mesh.corpo.ossa, V = O.testa.position.constructor, h = O.testa.getWorldPosition(new V()), b = O.bacino.getWorldPosition(new V()), L = Math.hypot(h.x - b.x, h.z - b.z) || 1; const c = Math.min((p.fx * p.vx + p.fz * p.vz) / sp, ((h.x - b.x) * p.vx + (h.z - b.z) * p.vz) / (L * sp)); if (c < 0) { indietro++; if (es.length < 4) es.push({ t: +(H.game.time - t0).toFixed(2), sq: p.team.short, num: p.num, c: +c.toFixed(2), oriz: +p.oriz.toFixed(2) }); }
    }
  }
  return { n, indietro, es };
});
console.log(ms, JSON.stringify(r));
await browser.close(); server.httpServer.close();
