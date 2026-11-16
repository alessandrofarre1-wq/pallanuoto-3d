// Scatti di orientamento in una partita vera computer contro computer (v0.50).
// Per ogni giocatore in campo e ogni fotogramma misura di quanto cambia la direzione del corpo (fx,fz).
// Una rotazione normale arriva al massimo a 16 rad/s (gesti) cioè 0,27 rad per fotogramma a 60 Hz:
// i salti oltre 0,35 rad in un fotogramma sono scatti visibili. Conta anche il corpo disteso che va
// all'indietro (velocità e fronte opposti, oltre 90°) mentre nuota.
// Uso: node strumenti/misura-rotazioni-v050.mjs [--dist=cartella] [--secondi=240] [--porta=4411]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => process.argv.find(x => x.startsWith('--' + k + '='))?.slice(k.length + 3);
const dist = arg('dist'), secondi = +(arg('secondi') || 240), porta = +(arg('porta') || 4411);
if (!dist && !process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: { outDir: dist || 'dist' }, preview: { port: porta, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 844, height: 390 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 33; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__passo = () => { now += 1000 / 60; window.__raf(now); };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 120000, polling: 100 });
const r = await pg.evaluate(async (secondi) => {
  const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click();
  H.game.autoplay = true; for (const t of H.teams) t.human = false;
  const R = H.renderer; R.render = () => {};
  const prima = new Map(); let campioni = 0, nuoto = 0, scatti = 0, scattiNuoto = 0, indietro = 0, max = 0, fotogrammi = 0;
  const istogramma = [0, 0, 0, 0]; // >0,35 · >0,6 · >1,0 · >2,0 rad
  for (let k = 0; k < secondi * 60; k++) {
    window.__passo(); fotogrammi++;
    if (H.game.state !== 'play') { prima.clear(); continue; }
    for (const p of H.allPlayers) {
      if (p.excluded || p.uscendo) { prima.delete(p); continue; }
      const a = Math.atan2(p.fz, p.fx), v = prima.get(p); prima.set(p, a);
      if (v == null) continue;
      const d = Math.abs(Math.atan2(Math.sin(a - v), Math.cos(a - v))); campioni++;
      const disteso = (p.oriz || 0) > 0.5; if (disteso) nuoto++;
      if (d > max) max = d;
      if (d > 0.35) { scatti++; if (disteso) scattiNuoto++; }
      [0.35, 0.6, 1.0, 2.0].forEach((s, i) => { if (d > s) istogramma[i]++; });
      const sp = Math.hypot(p.vx, p.vz);
      if (disteso && sp > 0.5 && (p.fx * p.vx + p.fz * p.vz) / sp < 0) indietro++;
    }
  }
  return { fotogrammi, campioni, nuoto, scatti, scattiNuoto, indietro, max: +max.toFixed(3), istogramma, gol: H.teams.map(t => t.score) };
}, secondi);
console.log(JSON.stringify({ build: dist || 'attuale', secondi, ...r, errori: errori.slice(0, 3) }));
await browser.close(); server.httpServer.close();
