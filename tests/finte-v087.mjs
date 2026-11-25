// Finte v0.87 (Ale: «se la palla sta dietro la testa il palmo della mano deve essere rivolto verso l'alto, come se il giocatore tenesse
// la palla su un vassoio; se la finta supera la testa e va in avanti l'unico modo per tenere la palla è ruotare il polso e mettere il
// palmo rivolto verso il basso con la palla attaccata»; «le finte possono essere da destra verso sinistra e da sinistra verso destra,
// oppure in avanti e poi indietro, più veloci o più lente, con il braccio teso o piegato, per tutte le finte»; «la finta è quasi un
// marchio di fabbrica dei giocatori, ognuno ce l'ha diversa»).
// 1. Mano (solo disegno, grafica/mano-finta.js): nella finta del computer e in quella di chi tiene TIRO (posa Plask) il palmo è al
//    cielo con la palla dietro la testa e in giù con la mano davanti alla testa; la palla disegnata sta sempre sul palmo.
// 2. La finta del computer torna alla carica (avanti e indietro) e il braccio resta carico finché non parte il gesto dopo.
// 3. Marchio di fabbrica (finte.js firmaFinta, FINTA_FIRMA): uguale per lo stesso giocatore anche con un altro numero di calottina;
//    versi preferiti, larghezze e braccia diversi tra i giocatori; nel complesso più finte da destra verso sinistra.
// 4. La scheda del giocatore (schermata Squadre) mostra verso e braccio della sua finta.
// Uso: node tests/finte-v087.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4346, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 17; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__pad = { buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0] };
  Object.defineProperty(navigator, 'getGamepads', { value: () => [window.__pad] });
  window.__salta = n => { const R = window.__pallanuoto.renderer; const d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = d; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.game.autoplay = true; for (const t of H.teams) t.human = false; H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(200); });

// una finta, fotogramma per fotogramma: palla rispetto alla testa e direzione del palmo nel sistema del giocatore (avanti = verso la porta)
const finta = (umano, forma) => pg.evaluate(({ umano, forma }) => {
  const H = window.__pallanuoto, B = H.ball, A = H.teams[0], g = H.game;
  H.replay?.interrompiReplay?.();
  window.__pad.buttons.forEach(b => { b.pressed = false; b.value = 0; }); window.__pad.axes = [0, 0];
  g.state = 'play'; g.after = null; g.penalty = null; H.fight.active = false;
  for (const t of H.teams) t.human = umano && t === A;
  g.autoplay = !umano; if (umano) { window.dispatchEvent(new Event('blur')); document.activeElement?.blur(); }
  for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.charging = false; q.chargeT = 0; q.decideT = 99; q.reazioneT = 99; q.x = -6 + q.i; q.z = (q.team === A ? 6 : -6); q.vx = q.vz = 0; q.oriz = 0; q.stunUntil = g.time + 99; q.tackleCD = 99; q.colpi = []; }
  const p = A.players[4], gx = 12.5 * A.dir; p.scheda = { ...p.scheda, finta: 'larga' }; p.mano = 'D';
  const tieni = () => { p.x = gx - A.dir * 6; p.z = 0; p.fx = A.dir; p.fz = 0; p.vx = p.vz = 0; p.oriz = 0; p.decideT = 99; p.stunUntil = 0; if (B.holder !== p) H.regole.giveBall(p); };
  tieni(); p.fintaPronto = 0; if (umano) H.__setCtrl(p); for (let i = 0; i < 40; i++) { tieni(); window.__salta(1); }
  window.__formaFinta = forma; Object.assign(p, { fakeCount: 0, ultimoLatoFinta: 0 });
  const C = p.mesh.corpo, presa = C.prese.D, testa = C.ossa.testa, q = presa.quaternion.clone(), vp = presa.position.clone(), vt = presa.position.clone();
  const misura = fase => {
    presa.getWorldPosition(vp); testa.getWorldPosition(vt); presa.getWorldQuaternion(q);
    const n = C.normaliPrese.D.clone().applyQuaternion(q).normalize(), b = p.ballVistaW, av = (x, z) => x * p.fx + z * p.fz;
    return { fase, palmoSu: n.y, manoAvanti: av(vp.x - vt.x, vp.z - vt.z), pallaAvanti: b ? av(b[0] - vt.x, b[2] - vt.z) : null,
      sulPalmo: b ? (b[0] - vp.x) * n.x + (b[1] - vp.y) * n.y + (b[2] - vp.z) * n.z : null };
  };
  const serie = [];
  if (!umano) {
    H.prova.startAct(p, 'fake', 0.16, () => {}); if (!forma.lato) p.fintaLatoGesto = 0;
    const a = p.act, pronto = p.fintaPronto;
    for (let f = 0; f < 120 && g.time < pronto + 0.25; f++) {
      tieni(); if (p.act === null || p.act === a) { /* nessun gesto nuovo: si guarda il ritorno e l'attesa */ } else p.act = null;
      window.__salta(1);
      serie.push(misura(p.act === a ? (a.t < a.wind ? 'preparazione' : a.t < a.wind + a.frusta ? 'accenno' : 'ritorno') : g.time < pronto ? 'attesa' : 'dopo'));
    }
  } else {
    window.__pad.buttons[2] = { pressed: true, value: 1 };
    for (let f = 0; f < 150; f++) { tieni(); window.__salta(1); const a = p.act; serie.push(misura(a?.kind === 'fake' ? 'finta' : 'carica')); }
    window.__pad.buttons[2] = { pressed: false, value: 0 };
    for (const t of H.teams) t.human = false;
    g.autoplay = true; p.act = null; p.charging = false; p.chargeT = 0;
  }
  window.__formaFinta = null;
  return serie;
}, { umano, forma });

const controlla = (nome, serie, davantiMin) => {
  const dietro = serie.filter(s => s.pallaAvanti != null && s.pallaAvanti < -0.10), davanti = serie.filter(s => s.manoAvanti > davantiMin);
  const media = dietro.reduce((t, s) => t + s.palmoSu, 0) / Math.max(1, dietro.length), minimo = Math.min(...dietro.map(s => s.palmoSu));
  prova(dietro.length >= 20 && minimo > 0.5 && media > 0.85,
    `${nome}: palla dietro la testa = palmo al cielo, a vassoio (${dietro.length} fotogrammi, palmo in su ${media.toFixed(2)} in media, minimo ${minimo.toFixed(2)})`);
  const massimo = Math.max(...davanti.map(s => s.palmoSu));
  prova(davanti.length >= 2 && massimo < -0.5,
    `${nome}: mano davanti alla testa = polso girato, palmo in giù (${davanti.length} fotogrammi, palmo in su al massimo ${massimo.toFixed(2)})`);
  const sul = serie.map(s => s.sulPalmo).filter(v => v != null);
  prova(Math.min(...sul) > 0.09 && Math.max(...sul) < 0.13,
    `${nome}: la palla resta attaccata al palmo (centro a ${Math.min(...sul).toFixed(3)}-${Math.max(...sul).toFixed(3)} m dal palmo)`);
};
// 1. computer, finta ampia a braccio teso, avanti e indietro
const cpu = await finta(false, { largo: 0.9, piegato: false, lato: 0 });
controlla('computer', cpu, 0.10);
// 2. il ritorno porta alla carica e lì resta fino al gesto dopo (prima tornava alla palla tenuta, davanti al viso)
{ const fine = cpu.filter(s => s.fase === 'ritorno').slice(-3), attesa = cpu.filter(s => s.fase === 'attesa');
  const dietro = [...fine, ...attesa].every(s => s.pallaAvanti < -0.10);
  prova(fine.length === 3 && attesa.length >= 6 && dietro,
    `computer: la finta torna alla carica e il braccio resta carico nell'attesa (palla ${Math.max(...[...fine, ...attesa].map(s => s.pallaAvanti)).toFixed(2)} m dietro la testa al massimo, ${attesa.length} fotogrammi di attesa)`); }
// 3. giocatore che tiene TIRO (posa Plask con la finta sovrapposta)
controlla('giocatore che tiene TIRO', await finta(true, { largo: 0.9, piegato: false, lato: 0 }), 0.08);

// 4. marchio di fabbrica
const firma = await pg.evaluate(() => {
  const H = window.__pallanuoto, F = H.finte, tutti = [];
  for (const t of ['ITA', 'HUN', 'ESP', 'SRB', 'GRE', 'CRO', 'MNE', 'USA', 'AUS', 'FRA', 'NED', 'JPN']) for (const g of H.rose.tutti(t)) if (g.ruolo !== 0) tutti.push(g);
  // lo stesso giocatore con un altro numero (dalla v0.86 il numero cambia da una lista all'altra) ha la stessa finta
  const stabile = tutti.every(g => { const a = F.firmaFinta(g), c = { ...g, num: 99, finta: undefined }, b = F.firmaFinta(c);
    return a.verso === b.verso && a.largo === b.largo && a.piegato === b.piegato && F.stileFinta(c) === F.stileFinta(g); });
  const versi = { traverso: 0, avanti: 0, fuori: 0 }; let piegati = 0, larghi = 0, stretti = 0;
  for (const g of tutti) { const f = F.firmaFinta(g); versi[f.verso]++; if (f.piegato) piegati++; if (f.largo > 0.6) larghi++; if (f.largo < 0.35) stretti++; }
  // ogni finta: il verso del giocatore FINTA_FIRMA.verso volte su 100 (caso uniforme su 40 valori per giocatore)
  const finte = { traverso: 0, avanti: 0, fuori: 0 }; let mie = 0, totale = 0;
  for (const g of tutti) for (let k = 0; k < 40; k++) { const v = F.versoFinta(g, (k + 0.5) / 40); finte[v]++; totale++; if (v === F.firmaFinta(g).verso) mie++; }
  const quota = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +(v / Object.values(o).reduce((a, b) => a + b, 0)).toFixed(3)]));
  return { n: tutti.length, stabile, versi: quota(versi), finte: quota(finte), mie: +(mie / totale).toFixed(3), piegati: +(piegati / tutti.length).toFixed(3), larghi, stretti, verso: F.FINTA_FIRMA.verso };
});
prova(firma.stabile, `marchio di fabbrica: lo stesso giocatore con un altro numero di calottina ha la stessa finta (${firma.n} giocatori di movimento)`);
prova(firma.versi.traverso > 0.4 && firma.versi.traverso < 0.6 && firma.versi.avanti > 0.2 && firma.versi.avanti < 0.4 && firma.versi.fuori > 0.12 && firma.versi.fuori < 0.28,
  `versi preferiti tra i giocatori: da destra verso sinistra ${firma.versi.traverso}, avanti e indietro ${firma.versi.avanti}, da sinistra verso destra ${firma.versi.fuori} (pesi 0,5, 0,3 e 0,2)`);
prova(Math.abs(firma.mie - firma.verso) < 0.03 && firma.finte.traverso > firma.finte.fuori && firma.finte.fuori > 0.15 && firma.finte.avanti > 0.2,
  `ogni finta nel verso del giocatore ${Math.round(firma.mie * 100)} volte su 100; nel complesso da destra verso sinistra ${firma.finte.traverso}, da sinistra verso destra ${firma.finte.fuori}, avanti e indietro ${firma.finte.avanti}`);
prova(firma.piegati > 0.2 && firma.piegati < 0.8 && firma.larghi > 20 && firma.stretti > 20,
  `finte diverse tra i giocatori: braccio piegato per ${Math.round(firma.piegati * 100)} su 100, ${firma.larghi} giocatori con la finta ampia e ${firma.stretti} con la stretta`);

// 5. scheda del giocatore: verso e braccio della sua finta
await pg.evaluate(() => { document.querySelector('[data-va="squadre"]')?.click(); const b = document.getElementById('rosaBox'); if (b) b.open = true; });
const testi = await pg.evaluate(() => [...document.querySelectorAll('#rosa .fm-finta')].map(e => e.textContent));
prova(testi.length >= 10 && testi.every(t => /^Finta .+ · (da destra a sinistra|da sinistra a destra|avanti e indietro) · braccio (teso|piegato)$/.test(t)),
  `scheda: la finta di ognuno con verso e braccio (${testi.length} schede, per esempio «${testi[0]}»)`);
prova(errori.length === 0, `nessun errore nella pagina${errori.length ? ': ' + errori.join(' | ') : ''}`);
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nFinte v0.87: tutte le prove superate' : '\nFinte v0.87: PROVE FALLITE');
process.exit(ok ? 0 : 1);
