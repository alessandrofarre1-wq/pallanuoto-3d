// Time-out v0.83 (Ale: «time-out chiamato quando si subisce un break, o negli ultimi minuti per preparare un attacco; i giocatori si
// schierano nella metà campo avversaria; l'arbitro dà la palla al portiere a metà campo, che la passa al compagno libero e torna in
// porta nuotando»).
// 1. Alla ripresa la palla è al portiere a metà campo; i compagni sono nella metà campo avversaria, i difensori sul loro uomo.
// 2. Il portiere del computer passa a un compagno e torna verso la porta nuotando.
// 3. Il computer pari nell'ultimo minuto e mezzo chiama il time-out appena riprende la palla.
// Uso: node tests/timeout-v083.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4340, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 37; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer, d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = d; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); document.getElementById('goBtn').click(); window.__salta(420);
  H.game.autoplay = true; for (const t of H.teams) t.human = false; });

// 1-2. L'Ungheria (computer) ha la palla nella sua metà e chiama il time-out
const ripresa = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.teams[1], d = H.teams[0], g = H.game;
  H.replay?.interrompiReplay?.(); Object.assign(g, { state: 'play', after: null, penalty: null, shot: 20 });
  for (const q of H.allPlayers) Object.assign(q, { act: null, excluded: false, uscendo: false, stunUntil: 0, tackleCD: 9, colpi: [], cut: null });
  t.timeouts = 2; t.cambio = null; t.coda = []; t.prossimoControllo = Infinity; d.cambio = null; d.coda = []; d.prossimoControllo = Infinity;
  const h = t.players[4]; h.x = -t.dir * 4; h.z = 1; H.regole.giveBall(h); g.possTeam = t;
  const fatto = H.regole.timeout(t);
  let ripreso = false;
  for (let i = 0; i < 60 * 6 && !ripreso; i++) { window.__salta(1); ripreso = g.state === 'play' && !!H.ball.holder; }
  const gk = t.players[0], holder = H.ball.holder, uomoDi = H.v046.uomoDi;
  const r = { fatto, ripreso, alPortiere: holder === gk, xPortiere: +(gk.x * t.dir).toFixed(2), zPortiere: +gk.z.toFixed(2) };
  // i compagni: tutti oltre la metà campo, verso la porta d'attacco
  r.compagni = t.players.filter(q => !q.isGK).map(q => +(q.x * t.dir).toFixed(1));
  // i difensori: ognuno vicino al suo uomo
  r.difensori = d.players.filter(q => !q.isGK).map(q => { const a = uomoDi(q); return +Math.hypot(q.x - a.x, q.z - a.z).toFixed(1); });
  // il portiere passa e torna verso la porta
  const porta = -t.dir * 12.5, prima = Math.abs(gk.x - porta);
  let passato = false;
  for (let i = 0; i < 60 * 4; i++) { window.__salta(1); if (H.ball.state === 'flight' && H.ball.kind === 'pass' && H.ball.shooter === gk) passato = true; }
  r.passato = passato; r.avvicinamento = +(prima - Math.abs(gk.x - porta)).toFixed(1);
  return r;
});
prova(ripresa.fatto && ripresa.ripreso, `time-out chiamato e gioco ripreso (${ripresa.fatto}, ${ripresa.ripreso})`);
prova(ripresa.alPortiere && ripresa.xPortiere <= 0 && ripresa.xPortiere > -1.5, `alla ripresa la palla è al portiere a metà campo, nella sua metà (a ${ripresa.xPortiere} m dalla metà campo)`);
prova(ripresa.compagni.every(x => x > 0), `i compagni sono schierati nella metà campo avversaria (${ripresa.compagni.join(', ')} m oltre la metà campo)`);
prova(ripresa.difensori.every(x => x < 3), `i difensori sono sul loro uomo (distanze ${ripresa.difensori.join(', ')} m)`);
prova(ripresa.passato && ripresa.avvicinamento > 2, `il portiere passa a un compagno e torna verso la porta nuotando (${ripresa.avvicinamento} m più vicino in 4 s)`);

// 3. ultimo minuto e mezzo, pari: il computer chiama il time-out appena riprende la palla
const finale = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.teams[1], d = H.teams[0], g = H.game;
  H.replay?.interrompiReplay?.(); Object.assign(g, { state: 'play', after: null, penalty: null, shot: 28, period: 4, clock: 60 });
  for (const q of H.allPlayers) Object.assign(q, { act: null, excluded: false, uscendo: false, stunUntil: 0, tackleCD: 9, colpi: [], cut: null });
  t.timeouts = 2; t.timeoutFinale = false; t.vuoleTimeout = false; t.score = 9; d.score = 9;
  const h = t.players[4]; h.x = t.dir * 2; h.z = 2; H.regole.giveBall(d.players[4]); H.regole.giveBall(h);      // palla appena ripresa
  let chiamato = false;
  for (let i = 0; i < 60 * 3 && !chiamato; i++) { window.__salta(1); chiamato = t.timeouts === 1; }
  return { chiamato, finale: !!t.timeoutFinale };
});
prova(finale.chiamato && finale.finale, `pari nell'ultimo minuto e mezzo il computer chiama il time-out appena riprende la palla (${finale.chiamato})`);

prova(!errori.length, 'nessun errore nella pagina' + (errori.length ? ': ' + errori.slice(0, 2).join(' | ') : ''));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nTime-out v0.83: tutte le prove superate' : '\nTime-out v0.83: prove NON superate');
process.exit(ok ? 0 : 1);
