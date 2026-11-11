// Confronto tra il gioco e i dati della tesi Patumi (Politecnico di Torino, 2018) e degli studi che riporta.
// Uso: node tests/dati-tesi.mjs [--no-build]     (esce con errore se un valore è fuori dalla fascia attesa)
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4176, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage();
pg.on('pageerror', e => console.log('errore nella pagina:', e.message));
await pg.addInitScript(() => {
  let a = 11; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  performance.now = () => 0; window.__frame = 0;
  window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__step = n => { for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto');
const R = await pg.evaluate(() => {
  const H = window.__pallanuoto, out = {};
  H.renderer.render = () => {}; H.senzaCorpi = true;
  // 1. aria: palla che lascia la mano a 13,3 m/s, velocità dopo 5 metri (tesi: 12,2 m/s)
  { const B = { x: 0, y: 1.2, z: 0, vx: 13.3 * Math.cos(0.06), vy: 13.3 * Math.sin(0.06), vz: 0, wx: 0, wy: 0, wz: 0 };
    while (B.x < 5) H.palla.passoPalla(B, 1 / 120, null);
    out.arrivo = Math.hypot(B.vx, B.vy, B.vz); }
  // 2. rigori: il computer ne tira molti contro il portiere dell'altra squadra
  document.getElementById('goBtn').click(); window.__step(200);
  const N = 240, vel = [], tempi = []; let gol = 0;
  for (let n = 0; n < N; n++) {
    const sq = H.teams[1], prima = sq.score;
    for (const p of H.allPlayers) { p.stamina = 1; p.excluded = false; p.stunUntil = 0; p.act = null; }
    H.game.state = 'play'; H.game.after = null; H.game.clock = 100; H.game.shot = 28; H.ball.afterShot = false;
    H.regole.setupPenalty(sq);
    const tiratore = H.ball.holder; let partito = -1, v0 = 0;
    for (let f = 0; f < 420; f++) {
      window.__step(1);
      const B = H.ball;
      if (partito < 0 && B.state === 'flight') { partito = f; v0 = Math.hypot(B.vx, B.vy, B.vz); if (tiratore.act) tempi.push(tiratore.act.frusta); }
      if (sq.score > prima) break;
      if (partito >= 0 && (B.state === 'held' || (H.game.state === 'stop' && f > partito + 2) || f > partito + 150)) break;
    }
    if (partito >= 0) vel.push(v0);
    if (sq.score > prima) gol++;
  }
  const media = a => a.reduce((s, x) => s + x, 0) / a.length, ds = a => { const m = media(a); return Math.sqrt(media(a.map(x => (x - m) ** 2))); };
  out.rigori = { N, gol, velMedia: media(vel), velDs: ds(vel), velMin: Math.min(...vel), velMax: Math.max(...vel), frusta: media(tempi) };
  return out;
});
await browser.close(); await new Promise(r => server.httpServer.close(r));
const r = (x, n = 1) => x.toFixed(n); let ok = true;
const riga = (nome, valore, atteso, dentro) => { if (!dentro) ok = false; console.log(`${dentro ? '✓' : '✗'} ${nome}: ${valore}   (dato: ${atteso})`); };
riga('Velocità della palla dopo 5 m, partendo da 13,3 m/s', r(R.arrivo, 2) + ' m/s', '12,2 m/s misurati nella tesi', Math.abs(R.arrivo - 12.2) < 0.25);
const g = R.rigori, perc = 100 * g.gol / g.N;
riga('Rigori segnati', `${r(perc)}% (${g.gol} su ${g.N})`, '80,1% negli studi citati dalla tesi', Math.abs(perc - 80.1) < 6);
riga('Velocità al rilascio dei rigori', `${r(g.velMedia)} ± ${r(g.velDs)} m/s (da ${r(g.velMin)} a ${r(g.velMax)})`, 'professionisti 22,8 ± 2,4 m/s; semi-professionisti 18,4 ± 1,7', g.velMedia > 18 && g.velMedia < 25.5);
riga('Tempo dal braccio caricato al rilascio', r(g.frusta * 1000, 0) + ' ms', 'professionisti 166 ms, semi-professionisti 189 ms', g.frusta > 0.16 && g.frusta < 0.195);
console.log(ok ? '\n✓ Dati della tesi: il gioco è nella fascia attesa' : '\n✗ Dati della tesi: valori FUORI dalla fascia attesa');
process.exit(ok ? 0 : 1);
