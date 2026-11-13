// Tempo per l'azione: 28 secondi al primo possesso, 18 dopo espulsione, tiro d'angolo o rimbalzo ripreso dall'attacco;
// allo scadere la palla passa agli avversari. Uso: node tests/azione.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4180, host: '127.0.0.1' } });
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
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
const esiti = await pg.evaluate(() => {
  const H = window.__pallanuoto, G = H.game, B = H.ball, R = H.regole, out = [];
  H.renderer.render = () => {}; H.senzaCorpi = true; G.autoplay = true; for (const t of H.teams) t.human = false;
  window.__pallanuoto.imposta('len', '480'); document.getElementById('goBtn').click();
  const gioca = (max, fine) => { for (let i = 0; i < max && !fine(); i++) window.__step(1); return fine(); };
  const A = H.teams[0], Bq = H.teams[1];
  const fermi = () => { for (const p of H.allPlayers) { p.tackleCD = 9; p.decideT = 9; } };      // nessuno tira, passa o contrasta: si guarda solo il cronometro
  // 1) primo possesso: 28 secondi
  gioca(60 * 30, () => G.state === 'play' && B.holder);
  out.push(['primo possesso: 28 secondi', Math.abs(G.shot - 28) < 0.6, G.shot.toFixed(1)]);
  // 2) cambio di possesso: di nuovo 28
  G.shot = 9; R.giveBall(A.players[4]); G.shot = 9; R.giveBall(Bq.players[4]); out.push(['palla agli avversari: 28 secondi', G.shot === 28, G.shot.toFixed(1)]);
  // 3) espulsione di un difensore con meno di 18 secondi: si torna a 18 (con più di 18 non cambia)
  G.shot = 7; R.exclude(A.players[3]); out.push(['espulsione con 7 secondi rimasti: 18 secondi', G.shot === 18, G.shot.toFixed(1)]);
  G.shot = 23; R.exclude(A.players[4]); out.push(['espulsione con 23 secondi rimasti: restano 23', G.shot === 23, G.shot.toFixed(1)]);
  for (const p of A.players) p.excluded = false;
  // 4) tiro d'angolo: 18 secondi
  G.shot = 5; B.state = 'free'; B.holder = null; B.z = 3; R.cornerThrow(Bq); gioca(60 * 4, () => G.state === 'play' && B.holder);
  out.push(["tiro d'angolo: 18 secondi", B.holder && B.holder.team === Bq && Math.abs(G.shot - 18) < 0.3, G.shot.toFixed(1)]);
  // 5) tiro respinto e ripreso dall'attacco: 18 secondi; ripreso dalla difesa: 28
  G.shot = 4; B.state = 'free'; B.holder = null; B.afterShot = true; R.giveBall(Bq.players[5]);
  out.push(["rimbalzo ripreso dall'attacco: 18 secondi", G.shot === 18, G.shot.toFixed(1)]);
  G.shot = 4; B.afterShot = true; R.giveBall(A.players[5]); out.push(['rimbalzo ripreso dalla difesa: 28 secondi', G.shot === 28, G.shot.toFixed(1)]);
  // 6) il tempo scende di un secondo al secondo mentre si tiene palla
  { const p = A.players[6]; p.x = 0; p.z = 0; R.giveBall(p); G.shot = 20; fermi(); const t0 = G.shot; for (let i = 0; i < 120; i++) { fermi(); window.__step(1); }
    out.push(['due secondi di gioco tolgono due secondi', Math.abs((t0 - G.shot) - 2) < 0.1 && B.holder === p, (t0 - G.shot).toFixed(2)]); }
  // 7) allo scadere la palla passa agli avversari, che ripartono con 28
  { const p = B.holder; G.shot = 0.4; let fischio = false; for (let i = 0; i < 60 * 4; i++) { fermi(); window.__step(1); if (G.state === 'stop') fischio = true; if (fischio && G.state === 'play' && B.holder) break; }
    out.push(['allo scadere palla agli avversari con 28 secondi', fischio && B.holder && B.holder.team !== p.team && G.shot > 27, `${B.holder ? B.holder.team.short : '-'} ${G.shot.toFixed(1)}`]); }
  // 8) negli ultimi 5 secondi il numero lampeggia
  { R.giveBall(A.players[6]); G.shot = 4.2; fermi(); for (let i = 0; i < 6; i++) { fermi(); window.__step(1); }
    const el = document.getElementById('shotclock'); out.push(['ultimi 5 secondi: numero in evidenza', el.classList.contains('urg') && el.textContent === '5', el.textContent]); }
  return out;
});
await browser.close(); await new Promise(r => server.httpServer.close(r));
let ok = true;
for (const [nome, bene, valore] of esiti) { console.log(`${bene ? 'OK ' : 'NO '} ${nome}  (${valore})`); if (!bene) ok = false; }
console.log(ok ? '\nTempo per l\'azione: tutte le prove superate' : '\nTempo per l\'azione: PROVE FALLITE');
process.exit(ok ? 0 : 1);
