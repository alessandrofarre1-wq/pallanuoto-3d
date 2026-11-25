// Rigore v0.84 (Ale: «rigore: la palla deve partire dall'acqua e il movimento deve essere continuo, altrimenti controfallo»).
// 1. Prima del gesto la palla disegnata sta in acqua davanti a chi tira; caricando la pesca dall'acqua e la alza.
// 2. Carica e rilascio senza fermarsi: il tiro parte.
// 3. Fermo a braccio carico oltre mezzo secondo: controfallo, palla al portiere avversario.
// 4. Il computer tira sempre con un movimento continuo.
// Uso: node tests/rigore-v084.mjs [--no-build] [--foto]   (--foto salva due immagini in docs/immagini/, dalla v0.88 v088-rigore-*.png)
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4342, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 41; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer, d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = d; };
  window.__conDisegno = () => { now += 1000 / 60; window.__raf(now); };      // un fotogramma disegnato (per le foto con H.vista)
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); document.getElementById('goBtn').click(); window.__salta(420); });

const rigore = (squadra, umano) => pg.evaluate(({ squadra, umano }) => {
  const H = window.__pallanuoto, t = H.teams[squadra], g = H.game;
  H.replay?.interrompiReplay?.();
  g.autoplay = !umano; H.teams[0].human = umano; H.teams[1].human = false;
  Object.assign(g, { state: 'play', after: null, penalty: null });
  for (const q of H.allPlayers) Object.assign(q, { act: null, excluded: false, charging: false, chargeT: 0 });
  H.regole.setupPenalty(t, t.players[4]);
  g.state = 'play'; g.timer = 0; g.after = null;
  window.__salta(30);
  const s = g.penalty;
  // v0.88: la palla è dietro (prodotto con la direzione del tiratore negativo) e il braccio dietro la schiena
  const dietro = s ? +((s.ballVistaW[0] - s.x) * s.fx + (s.ballVistaW[2] - s.z) * s.fz).toFixed(2) : null;
  return { ok: !!s, ballY: s ? +s.ballVistaW[1].toFixed(2) : null, davanti: s ? s.davantiVista : null, dietro };
}, { squadra, umano });
const tasto = (tipo) => pg.evaluate(tipo => window.dispatchEvent(new KeyboardEvent(tipo, { code: 'KeyK' })), tipo);
const foto = async nome => {
  const dati = await pg.evaluate(() => { const H = window.__pallanuoto, s = H.game.penalty || H.ball.shooter;
    if (s) { const d = s.team.dir; H.vista = { pos: [s.x + d * 0.4, 0.45, s.z + 2.6], look: [s.x + d * 0.4, 0.25, s.z], fov: 38 }; }      // di lato, a pelo d'acqua
    window.__conDisegno(); const u = document.querySelector('canvas').toDataURL('image/png'); H.vista = null; return u; });
  fs.writeFileSync(path.join(ROOT, 'docs/immagini', nome), Buffer.from(dati.split(',')[1], 'base64'));
};

// 1-2. Italia (giocatore): palla in acqua, poi carica e rilascio continuo
const a = await rigore(0, true);
prova(a.ok && a.ballY !== null && a.ballY < 0.3 && a.davanti === 1 && a.dietro < -0.15, `v0.88: prima del gesto la palla è in acqua dietro chi tira, con il braccio dietro la schiena (altezza ${a.ballY} m, ${a.dietro} m dietro)`);
if (process.argv.includes('--foto')) await foto('v088-rigore-palla-dietro.png');
await tasto('keydown');
const pesca = await pg.evaluate(() => { const H = window.__pallanuoto, s = H.game.penalty, y = []; for (let i = 0; i < 30; i++) { window.__salta(1); y.push(+s.ballVistaW[1].toFixed(2)); } return y; });
if (process.argv.includes('--foto')) await foto('v088-rigore-carica.png');
prova(pesca[0] < 0.35 && Math.max(...pesca) > 0.6, `caricando la palla viene pescata dall'acqua e alzata (da ${pesca[0]} a ${Math.max(...pesca)} m)`);
await pg.evaluate(() => window.__salta(10));
await tasto('keyup');
const tiro = await pg.evaluate(() => { const H = window.__pallanuoto; window.__salta(2); return { gesto: H.ball.shooter?.act?.kind || H.game.penalty?.act?.kind || null, volo: H.ball.state, kind: H.ball.kind }; });
prova(tiro.gesto === 'shot' || (tiro.volo === 'flight' && tiro.kind === 'shot'), `carica e rilascio in un solo movimento: il tiro parte (${tiro.gesto || tiro.kind})`);
await pg.evaluate(() => { window.__salta(120); window.__pallanuoto.replay?.interrompiReplay?.(); });

// 3. fermo a braccio carico: controfallo
await rigore(0, true);
await tasto('keydown');
const fermo = await pg.evaluate(() => { const H = window.__pallanuoto, s = H.game.penalty, gk = H.teams[1].players[0];
  for (let i = 0; i < 60 * 1.6 && H.game.penalty; i++) window.__salta(1);
  return { controfallo: !H.game.penalty && H.ball.holder === gk, tiroLibero: !!gk.freeThrow, tiro: !!s.act }; });
await tasto('keyup');
prova(fermo.controfallo && fermo.tiroLibero && !fermo.tiro, `fermo a braccio carico oltre mezzo secondo: controfallo, palla al portiere avversario (${fermo.controfallo})`);
await pg.evaluate(() => { window.__salta(60); });

// 4. il computer tira con un movimento continuo
await rigore(1, false);
const cpu = await pg.evaluate(() => { const H = window.__pallanuoto, s = H.game.penalty; let tiro = false;
  for (let i = 0; i < 60 * 3 && !tiro; i++) { window.__salta(1); tiro = H.ball.shooter === s && H.ball.kind === 'shot'; }
  return { tiro, controfallo: H.ball.holder === H.teams[0].players[0] && !tiro }; });
prova(cpu.tiro && !cpu.controfallo, `il rigore del computer parte con un movimento continuo (${cpu.tiro})`);

prova(!errori.length, 'nessun errore nella pagina' + (errori.length ? ': ' + errori.slice(0, 2).join(' | ') : ''));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nRigore v0.84: tutte le prove superate' : '\nRigore v0.84: prove NON superate');
process.exit(ok ? 0 : 1);
