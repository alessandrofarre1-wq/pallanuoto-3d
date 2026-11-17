// v0.52: dopo il replay il corpo nuotava al contrario (segnalazione e diagnosi di Ale su iPhone).
// Il ripristino del replay rimette il quaternione del gruppo del giocatore; Three.js lo riscrive come Euler e,
// con la direzione oltre ±90°, ottiene (π, π-y, π). Se il gioco poi imposta solo rotation.y il corpo resta girato.
// Prova: ripristino simulato (quaternione con direzione 150°), poi un fotogramma vero; la matrice del corpo deve
// guardare dove guarda la fisica (fx, fz), per tutti i 14 giocatori e per più direzioni.
// Uso: node tests/orientamento-v052.mjs [--no-build] [--dist=cartella di una build precedente]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = process.argv.find(a => a.startsWith('--dist='))?.slice(7);
if (!dist && !process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: { outDir: dist || 'dist' }, preview: { port: 4421, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 640, height: 300 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 33; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
const r = await pg.evaluate(() => {
  const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); document.getElementById('goBtn').click(); window.__salta(60);
  H.game.autoplay = true; for (const t of H.teams) t.human = false;
  const Q = H.camera.quaternion.constructor, V = H.camera.position.constructor, su = new V(0, 1, 0);
  let casi = 0, sbagliati = 0, peggiore = 1;
  for (const dir of [150, -150, 179, 95, 30]) {
    const q = new Q().setFromAxisAngle(su, dir * Math.PI / 180).toArray();
    // come il ripristino del replay: il quaternione di ogni corpo viene riscritto
    for (const p of H.allPlayers) p.mesh.g.quaternion.fromArray(q);
    window.__salta(1);
    for (const p of H.allPlayers) {
      p.mesh.g.updateWorldMatrix(true, false); const m = p.mesh.g.matrixWorld.elements;
      const c = (m[0] * p.fx + m[2] * p.fz) / (Math.hypot(m[0], m[2]) || 1);
      casi++; if (c < 0.99) sbagliati++; peggiore = Math.min(peggiore, c);
    }
  }
  return { casi, sbagliati, peggiore: +peggiore.toFixed(3) };
});
const ok = r.sbagliati === 0 && errori.length === 0;
console.log(`${ok ? '✓' : '✗'} orientamento dopo ripristino del replay: ${r.casi - r.sbagliati}/${r.casi} corpi nel verso della fisica (peggiore ${r.peggiore})${errori.length ? ' · errori: ' + errori[0] : ''}`);
await browser.close(); server.httpServer.close();
process.exit(ok ? 0 : 1);
