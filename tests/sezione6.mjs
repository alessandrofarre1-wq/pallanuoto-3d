// Prove della sezione 6 (v0.33): l'espulso nuota al pozzetto mentre si gioca, lì recupera, rientra solo dal pozzetto,
// si può cambiare dal pozzetto senza cinque, al rientro il computer sceglie tra controfuga e difesa sul portatore.
// Uso: node tests/sezione6.mjs [--no-build] [--foto]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4340, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 852, height: 393 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 29; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = window.__dis; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click(); H.game.autoplay = true; for (const t of H.teams) t.human = false; window.__salta(300); });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };

// prepara un'espulsione del giocatore n. i della squadra k (lontano dal pozzetto), con la palla all'altra squadra
const espelli = (k, i, x) => pg.evaluate(({ k, i, x }) => {
  const H = window.__pallanuoto, T = H.teams[k], O = H.teams[1 - k], d = T.players[i];
  H.game.state = 'play'; H.game.after = null; H.game.penalty = null; H.game.clock = 400;
  for (const q of H.allPlayers) { q.excluded = false; q.alPozzetto = false; q.puoRientrare = false; q.rientro = null; }
  for (const t of H.teams) { t.coda = []; }
  d.x = x; d.z = 4; d.vx = d.vz = 0; d.pf = 0;
  H.regole.giveBall(O.players[6]);
  H.regole.exclude(d, O.players[6]);
  return { pf: d.pf };
}, { k, i, x });

// ---------- verso il pozzetto mentre si gioca ----------
await espelli(0, 4, 2);
const viaggio = await pg.evaluate(() => {
  const H = window.__pallanuoto, T = H.teams[0], d = T.players[4], P = { x: -12.5 * T.dir + T.dir * 0.6, z: -11 };
  const d0 = Math.hypot(d.x - P.x, d.z - P.z), stati = new Set(); let t = 0;
  const r = { inizio: d0 };
  for (let i = 0; i < 60 * 17 && !d.alPozzetto; i++) { window.__salta(1); stati.add(H.game.state); t = i / 60; d.exclUntil = H.game.time + 30; }
  r.dopo = Math.hypot(d.x - P.x, d.z - P.z); r.arrivato = d.alPozzetto; r.tempo = t; r.z = d.z; r.visibile = d.mesh.g.visible; r.stati = [...stati];
  // recupero nel pozzetto
  H.game.autoplay = false; T.human = true;      // qui niente cambi automatici: si misura solo il recupero
  d.stamina = 0.3; const st = {}; const gk = H.teams[1].players[0]; for (let i = 0; i < 300; i++) { if (H.ball.holder !== gk) H.regole.giveBall(gk); H.ball.holdTime = 0; gk.decideT = 99; window.__salta(1); st[H.game.state] = (st[H.game.state] || 0) + 1; } r.stamina = d.stamina; r.ancoraEspulso = d.excluded;
  H.game.autoplay = true; T.human = false;
  return r;
});
prova(viaggio.arrivato && viaggio.dopo < 0.6, `l'espulso nuota al pozzetto: da ${viaggio.inizio.toFixed(1)} m a ${viaggio.dopo.toFixed(2)} m in ${viaggio.tempo.toFixed(1)} s`);
prova(viaggio.z < -10 && viaggio.visibile, `nel pozzetto è fuori dal campo di gioco (z ${viaggio.z.toFixed(1)}) e si vede`);
prova(viaggio.stati.every(s => s === 'play' || s === 'stop'), `intanto la partita va avanti (${viaggio.stati.join(', ')})`);
prova(viaggio.stamina > 0.45 && viaggio.ancoraEspulso, `nel pozzetto recupera in fretta: da 30% a ${Math.round(viaggio.stamina * 100)}% in 5 s`);

// ---------- rientra solo dal pozzetto ----------
await espelli(0, 3, 6);
const rientro = await pg.evaluate(() => {
  const H = window.__pallanuoto, T = H.teams[0], d = T.players[3];
  d.exclUntil = H.game.time + 0.5; window.__salta(60);
  const r = { primaDiArrivare: d.excluded };
  for (let i = 0; i < 60 * 20 && d.excluded; i++) window.__salta(1);
  r.rientrato = !d.excluded; r.z = d.z; r.x = d.x;
  return r;
});
prova(rientro.primaDiArrivare, 'a tempo scaduto ma lontano dal pozzetto non rientra ancora');
prova(rientro.rientrato && rientro.z < -9, `rientra appena arriva al pozzetto, dal bordo (z ${rientro.z.toFixed(1)})`);

// ---------- al rientro il computer sceglie: controfuga o difesa sul portatore ----------
// (l'espulso è messo direttamente nel pozzetto, così la prova non dipende da come va l'azione mentre nuota)
const rientroDa = (conPalla) => pg.evaluate((conPalla) => {
  const H = window.__pallanuoto, T = H.teams[0], O = H.teams[1], d = T.players[2], gx = -12.5 * T.dir;
  H.game.state = 'play'; H.game.after = null; H.game.penalty = null; H.game.clock = 400;
  for (const q of H.allPlayers) { q.excluded = false; q.rientro = null; }
  H.__setCtrl(T.players[6]);
  const h = conPalla ? T.players[6] : O.players[4];
  if (!conPalla) { h.x = gx + T.dir * 6; h.z = -3; }
  H.regole.giveBall(h);
  d.excluded = true; d.alPozzetto = true; d.puoRientrare = false; d.x = gx + T.dir * 0.6; d.z = -11; d.vx = d.vz = 0; d.stamina = 1; d.exclUntil = H.game.time + 0.05;
  for (let i = 0; i < 10 && d.excluded; i++) { if (H.ball.holder !== h) H.regole.giveBall(h); h.decideT = 99; h.act = null; window.__salta(1); }
  const r = { rientrato: !d.excluded, modo: d.rientro && d.rientro.modo, x0: d.x, d0: Math.hypot(d.x - h.x, d.z - h.z) };
  for (let i = 0; i < 90; i++) { if (!conPalla) { h.x = gx + T.dir * 6; h.z = -3; h.vx = h.vz = 0; } if (H.ball.holder !== h) H.regole.giveBall(h); h.decideT = 99; h.act = null; window.__salta(1); }
  r.avanti = (d.x - r.x0) * T.dir; r.d1 = Math.hypot(d.x - h.x, d.z - h.z);
  return r;
}, conPalla);
const fuga = await rientroDa(true);
prova(fuga.rientrato && fuga.modo === 'fuga' && fuga.avanti > 1.5, `al rientro, con la palla, riparte in controfuga (${fuga.modo}, ${fuga.avanti.toFixed(1)} m avanti in 1,5 s)`);
const difesa = await rientroDa(false);
prova(difesa.rientrato && difesa.modo === 'difesa' && difesa.d1 < difesa.d0 - 1, `al rientro, palla avversaria vicino alla porta: va su chi ha la palla (${difesa.modo}, da ${difesa.d0.toFixed(1)} a ${difesa.d1.toFixed(1)} m)`);
// palla riconquistata mentre l'espulso è nel pozzetto: rientra subito
await espelli(0, 3, -9);
const anticipo = await pg.evaluate(() => {
  const H = window.__pallanuoto, T = H.teams[0], d = T.players[3];
  for (let i = 0; i < 60 * 20 && !d.alPozzetto && d.excluded; i++) { d.exclUntil = H.game.time + 30; window.__salta(1); }
  if (!d.excluded) return { rientrato: true, gia: true };
  H.regole.giveBall(T.players[6]); window.__salta(2);
  return { rientrato: !d.excluded };
});
prova(anticipo.rientrato, 'palla riconquistata: l\'espulso nel pozzetto rientra subito');

// ---------- cambio dal pozzetto senza cinque ----------
await espelli(1, 4, 0);
const cambio = await pg.evaluate(() => {
  const H = window.__pallanuoto, T = H.teams[1], d = T.players[4], esce = d.num;
  T.human = true; H.game.autoplay = false;      // niente cambi automatici: lo chiede «il giocatore»
  const g = T.rosa.find(x => !x.inAcqua && !x.fuori && x.ruolo !== 0);
  H.panchina.chiediCambio(T, d, g);
  let cinque = false, prima = null;
  for (let i = 0; i < 60 * 20 && d.num === esce; i++) { d.exclUntil = H.game.time + 30; if (d.cinqueUntil > H.game.time) cinque = true; if (!d.alPozzetto) prima = d.num; window.__salta(1); }
  const r = { esce, entra: g.num, ora: d.num, ancoraEspulso: d.excluded, cinque, cambiatoPrimaDelPozzetto: prima !== null && prima !== esce };
  const ev = H.cronaca.registro.filter(e => e.testo === 'Cambio').slice(-1)[0]; r.testo = ev ? ev.dettaglio : '';
  T.human = false; H.game.autoplay = true;
  return r;
});
prova(cambio.ora === cambio.entra && cambio.ancoraEspulso, `cambio dal pozzetto: esce #${cambio.esce}, entra #${cambio.entra}; l'espulsione continua («${cambio.testo}»)`);
prova(!cambio.cinque && !cambio.cambiatoPrimaDelPozzetto, 'senza cinque, e solo dopo essere arrivato al pozzetto');

// ---------- il computer cambia dal pozzetto chi è stanco ----------
await espelli(1, 5, 3);
const ai = await pg.evaluate(() => {
  const H = window.__pallanuoto, T = H.teams[1], d = T.players[5], esce = d.num;
  for (const g of T.rosa) if (!g.inAcqua) g.stamina = 1;
  d.stamina = 0.5; T.prossimoControllo = H.game.time + 999;      // anche se ha appena fatto un altro cambio
  let arrivato = -1;
  for (let i = 0; i < 60 * 20 && d.num === esce; i++) { d.exclUntil = H.game.time + 30; if (d.alPozzetto && arrivato < 0) arrivato = i; window.__salta(1); }
  return { esce, ora: d.num, dopo: arrivato };
});
prova(ai.ora !== ai.esce, `il computer cambia dal pozzetto l'espulso stanco (esce #${ai.esce}, entra #${ai.ora})`);

if (process.argv.includes('--foto')) {
  await espelli(1, 4, -2);
  await pg.evaluate(() => {
    const H = window.__pallanuoto, T = H.teams[1], d = T.players[4];
    for (let i = 0; i < 60 * 20 && !d.alPozzetto; i++) { d.exclUntil = H.game.time + 30; window.__salta(1); }
    window.__salta(30);
    H.vista = { pos: [d.x - T.dir * 2.5, 2.4, d.z + 5.0], look: [d.x - T.dir * 1.0, 0.2, d.z + 1.2], fov: 50 };
    window.__salta(1); H.__ridisegna(); H.vista = null;
  });
  await pg.locator('canvas').first().screenshot({ path: path.join(ROOT, 'docs/immagini/pozzetto.png') });
}
if (errori.length) prova(false, 'errori: ' + errori.slice(0, 2).join(' | '));
await browser.close(); await new Promise(res => server.httpServer.close(res));
console.log(ok ? '\nSezione 6: tutte le prove superate' : '\nSezione 6: prove NON superate');
process.exit(ok ? 0 : 1);
