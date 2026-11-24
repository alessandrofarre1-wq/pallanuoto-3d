// Cambi di marcatura nei rientri (v0.80, Ale: «non funzionano molto i cambi di marcatura in difesa. Sembra che ogni giocatore
// guardi solo il proprio giocatore. Così facendo però si generano diverse controfughe che in realtà non esisterebbero»).
// 1. Rientro: un attaccante è scappato verso la porta e il suo marcatore è indietro; un altro difensore è più avanti, dalla parte
//    della porta: è lui a prenderlo (l'uomo assegnato cambia) e l'attaccante non resta libero davanti alla porta.
// 2. Chi marca già bene il suo uomo lo tiene (nessuno scambio inutile).
// 3. Con la palla vicina alla porta (difesa schierata) i rientri non scambiano più: decidono i tagli dell'attacco schierato.
// 4. Il difensore comandato dal giocatore non riceve l'attaccante scappato (lo muove il giocatore): lo prende un compagno del computer.
// Uso: node tests/cambi-marcatura.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4337, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 23; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer, d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = d; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); document.getElementById('goBtn').click(); window.__salta(420);
  H.game.autoplay = true; for (const t of H.teams) t.human = false; });

// L'Italia (attacco) ha palla a centro vasca; l'Ungheria (difesa, computer) rientra verso la sua porta.
const scena = (opzioni) => pg.evaluate(o => {
  // di solito attacca l'Italia e difende l'Ungheria (computer); con «comandato» difende l'Italia, la squadra del giocatore
  const H = window.__pallanuoto, R = H.regole, A = o.comandato ? H.teams[1] : H.teams[0], D = o.comandato ? H.teams[0] : H.teams[1], uomoDi = H.v046.uomoDi;
  H.replay?.interrompiReplay?.(); Object.assign(H.game, { state: 'play', after: null, penalty: null, shot: 26 });
  for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.uscendo = false; q.stunUntil = 0; q.vx = q.vz = 0; q.cut = null; q.charging = false; q.tackleCD = 9; q.colpi = []; }
  const gx = Math.sign(A.dir || 1) * 12.5, sx = Math.sign(gx);      // porta attaccata dall'Italia (difesa dall'Ungheria)
  D.accoppiamenti = null; uomoDi(D.players[1]);                     // marcature di partenza (ruoli)
  const portatore = A.players[6], scappato = A.players[2];
  // palla a 2 m dalla metà campo (o vicina alla porta, per la difesa schierata)
  const xPalla = o.schierata ? gx - sx * 5.5 : sx * -1;
  for (let i = 1; i <= 6; i++) { const p = A.players[i]; p.x = xPalla - sx * 1.5; p.z = -5 + i * 1.6; }
  portatore.x = xPalla; portatore.z = 0;
  scappato.x = gx - sx * 4.5; scappato.z = 3.5;                     // l'ala destra è scappata verso la porta
  for (let i = 1; i <= 6; i++) { const d = D.players[i], a = uomoDi(d); d.x = a.x + sx * 1.2; d.z = a.z * 0.9; }
  const marcatore = D.players.find(d => uomoDi(d) === scappato);
  marcatore.x = xPalla - sx * 2; marcatore.z = 3;                    // il suo marcatore è rimasto indietro
  const vicino = D.players.find(d => d !== marcatore && !d.isGK && uomoDi(d) !== portatore && uomoDi(d) !== scappato);
  vicino.x = gx - sx * 3.2; vicino.z = 2.4;                           // un altro difensore è già vicino alla porta
  if (o.comandato) { H.teams[0].human = true; H.teams[1].human = false; H.game.autoplay = false; }
  R.giveBall(portatore); H.game.possT = H.game.time - 1; H.game.possTeam = A;
  // dopo giveBall: quando la palla va agli avversari il gioco passa da solo il comando al difensore più vicino
  if (o.comandato) H.__setCtrl(o.comandato === 'marcatore' ? marcatore : vicino);
  const prima = { marcatore: uomoDi(marcatore) === scappato, vicino: uomoDi(vicino) === scappato }, umanoPrima = o.comandato ? uomoDi(vicino) : null;
  let liberoT = 0;
  for (let f = 0; f < 120; f++) {
    for (const p of A.players) { p.decideT = 9; p.reazioneT = 9; }
    portatore.x = xPalla; portatore.z = 0; portatore.vx = portatore.vz = 0; scappato.vx = scappato.vz = 0; scappato.x = gx - sx * 4.5; scappato.z = 3.5;
    window.__salta(1);
    const dq = Math.hypot(gx - scappato.x, scappato.z);
    const coperto = D.players.some(d => !d.isGK && Math.hypot(d.x - scappato.x, d.z - scappato.z) < 2 && Math.hypot(gx - d.x, d.z) <= dq + 0.3);
    if (!coperto && f > 60) liberoT += 1 / 60;
  }
  const dopo = { marcatore: uomoDi(marcatore) === scappato, vicino: uomoDi(vicino) === scappato };
  const umanoStesso = o.comandato ? uomoDi(vicino) === umanoPrima : null, comandato = o.comandato ? H.ctrl === vicino : null;
  for (const t of H.teams) t.human = false; H.game.autoplay = true;
  return { prima, dopo, liberoT, umanoStesso, comandato, scambi: D.scambiRientro || 0 };
}, opzioni);

const r1 = await scena({});
prova(r1.prima.marcatore && !r1.prima.vicino, 'all\'inizio l\'attaccante scappato è del suo marcatore (rimasto indietro)');
prova(r1.dopo.vicino && !r1.dopo.marcatore, 'nel rientro lo prende il difensore vicino alla porta (scambio di marcatura)');
prova(r1.liberoT < 0.2, `l'attaccante non resta libero davanti alla porta (${r1.liberoT.toFixed(2)} s nell'ultimo secondo)`);
const r2 = await scena({ schierata: true });
prova(r2.dopo.marcatore && !r2.dopo.vicino, 'con la palla vicina alla porta (difesa schierata) i rientri non scambiano');
const r3 = await scena({ comandato: 'vicino' });
prova(r3.comandato && !r3.dopo.vicino && r3.liberoT < 0.5, `l'attaccante scappato non va al difensore comandato dal giocatore (che si muove da sé): lo prende un compagno del computer (libero ${r3.liberoT.toFixed(2)} s)`);
prova(!errori.length, 'nessun errore nella pagina' + (errori.length ? ': ' + errori.slice(0, 2).join(' | ') : ''));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nCambi di marcatura: tutte le prove superate' : '\nCambi di marcatura: prove NON superate');
process.exit(ok ? 0 : 1);
