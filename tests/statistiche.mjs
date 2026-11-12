// Verifica degli "effetti minimi" delle statistiche dei giocatori (CLAUDE.md, sezione "Statistiche dei giocatori").
// Uso: node tests/statistiche.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4173, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage();
pg.on('pageerror', e => console.log('errore nella pagina:', e.message)); pg.on('console', m => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 300)); });
await pg.addInitScript(() => {
  let a = 5; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  performance.now = () => 0; window.__frame = 0;
  window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__step = n => { for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
const R = await pg.evaluate(() => {
  const H = window.__pallanuoto, P = H.prova, out = {}, dt = 1 / 60;
  H.renderer.render = () => {}; H.senzaCorpi = true;
  document.getElementById('goBtn').click(); window.__step(200);
  const p = H.teams[0].players[4], base = { ...p.s };
  const con = s => { p.s = { ...base, ...s }; p.st = P.valoriMotore(p.s); };
  const lontani = () => { for (const q of H.allPlayers) if (q !== p) { q.x = -11 + q.i * 0.2; q.z = 9 * (q.team.idx ? 1 : -1); q.vx = q.vz = 0; } };
  H.game.state = 'stop'; H.game.timer = 1e9;      // partita ferma: si muove solo il giocatore di prova
  // 1. Velocità: sprint a regime, da fresco
  const sprint = vel => { con({ vel }); lontani(); p.x = -8; p.z = 0; p.vx = p.vz = 0; p.fx = 1; p.fz = 0; p.oriz = 1; let v = 0;
    for (let i = 0; i < 360; i++) { p.stamina = 1; p.x = 0; P.movePlayer(p, 1, 0, true, dt); v = Math.hypot(p.vx, p.vz); } return v; };
  out.vel60 = sprint(60); out.vel90 = sprint(90);
  // 2. Resistenza: vasche di sprint di fila (22 metri l'una) con Resistenza media
  const vasche = res => { con({ res, vel: 75 }); lontani(); p.stamina = 1; p.vx = p.vz = 0; p.oriz = 1; const st = [], vel = [];
    for (let k = 0; k < 8; k++) { let fatti = 0, v = 0; const dir = k % 2 ? -1 : 1; p.fx = dir; p.fz = 0;
      while (fatti < 22) { p.x = 0; P.movePlayer(p, dir, 0, true, dt); v = Math.hypot(p.vx, p.vz); fatti += v * dt; }
      st.push(p.stamina); vel.push(v); }
    return { st, vel }; };
  out.res75 = vasche(75); out.res90 = vasche(90); out.res60 = vasche(60);
  // 3. Precisione: stesso tiro dallo stesso punto, senza portiere né difensori: quanti finiscono nello specchio
  const tiri = pre => { con({ pre, pot: 80 }); let dentro = 0; const N = 1500, gx = 12.5;
    for (let n = 0; n < N; n++) { lontani(); p.x = gx - 7.5; p.z = 3; p.vx = p.vz = 0; p.fx = 1; p.fz = 0; p.stamina = 0.85; p.act = null; p.ballW = [p.x + 0.2, 1.1, p.z]; p.fakeUntil = 0; p.turnedUntil = 0;
      H.ball.state = 'held'; H.ball.holder = p; H.game.penalty = null;
      P.doShoot(p, 0.8, false, -1);      // mira all'angolo
      const B = H.ball; let px = B.x, pz = B.z, py = B.y;
      for (let i = 0; i < 200 && B.x < gx; i++) { px = B.x; pz = B.z; py = B.y; H.palla.passoPalla(B, dt, null); }
      const k = (gx - px) / ((B.x - px) || 1), z = pz + (B.z - pz) * k, y = py + (B.y - py) * k;
      if (B.x >= gx && Math.abs(z) < 1.5 - 0.12 && y < 0.9 - 0.12 && y > -0.05) dentro++; }
    return 100 * dentro / N; };
  out.pre60 = tiri(60); out.pre90 = tiri(90); out.pre75 = tiri(75);
  // 4. Potenza: velocità al rilascio a tutta forza
  const pot = v => { con({ pot: v }); lontani(); p.x = 5; p.z = 0; p.stamina = 1; p.act = null; p.ballW = [5.2, 1.1, 0]; H.ball.state = 'held'; H.ball.holder = p; P.doShoot(p, 1, false, 0); return Math.hypot(H.ball.vx, H.ball.vy, H.ball.vz); };
  out.pot60 = pot(60); out.pot90 = pot(90);
  return out;
});
await browser.close(); await new Promise(r => server.httpServer.close(r));
const r = (x, n = 1) => x.toFixed(n); let ok = true;
const riga = (nome, valore, atteso, dentro) => { if (!dentro) ok = false; console.log(`${dentro ? '✓' : '✗'} ${nome}: ${valore}   (obiettivo: ${atteso})`); };
const dv = 100 * (R.vel90 / R.vel60 - 1);
riga('Velocità 90 contro 60, in sprint', `${r(R.vel90, 2)} contro ${r(R.vel60, 2)} m/s = +${r(dv)}%`, '15-20%', dv >= 15 && dv <= 20);
const rp = R.pre90 / R.pre60;
riga('Precisione 90 contro 60, tiri nello specchio dallo stesso punto', `${r(R.pre90)}% contro ${r(R.pre60)}% = ${r(rp, 2)} volte (con 75: ${r(R.pre75)}%)`, 'circa il doppio', rp >= 1.7 && rp <= 2.4);
riga('Potenza 90 contro 60, velocità al rilascio', `${r(R.pot90)} contro ${r(R.pot60)} m/s`, 'da circa 20 a 25 m/s', R.pot90 - R.pot60 > 3.5);
const s = R.res75.st, calo = 100 * (1 - R.res75.vel[6] / R.res75.vel[0]);
riga('Resistenza 75: dopo 7 vasche di sprint di fila', `barra al ${r(s[6] * 100, 0)}% (dopo 3: ${r(s[2] * 100, 0)}%), velocità -${r(calo, 0)}%`, 'visibilmente stanco: barra sotto il 40%', s[6] < 0.4 && s[6] > 0.1);
riga('Resistenza 90 contro 60 dopo 7 vasche', `barra al ${r(R.res90.st[6] * 100, 0)}% contro ${r(R.res60.st[6] * 100, 0)}%`, 'chi ne ha di più è più fresco', R.res90.st[6] > R.res60.st[6] + 0.15);
console.log(ok ? '\n✓ Statistiche: effetti minimi rispettati' : '\n✗ Statistiche: effetti minimi NON rispettati');
process.exit(ok ? 0 : 1);
