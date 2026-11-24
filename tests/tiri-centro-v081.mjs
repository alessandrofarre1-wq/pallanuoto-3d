// Tiri v0.81 (Ale: «troppi tiri a schizzo e colonnello, poche beduine e pochi passaggi al centroboa»; «le occasioni chiare,
// passaggio con l'uomo davanti alla porta, si tirano indipendentemente dai secondi trascorsi»).
// 1. Centroboa con la palla: con il marcatore dietro o al fianco, nella lotta (entro 1,8 m), resta di spalle alla porta e il suo tiro
//    è una beduina o una sciarpa; con il marcatore in anticipo o lontano si gira verso la porta e tira di fronte.
// 2. Il centroboa del computer, di spalle nella lotta, quando decide di tirare fa una beduina o una sciarpa.
// 3. Chi riceve libero davanti alla porta (entro 5 m) tira subito anche nei primi secondi dell'azione; non con un avversario vicino o
//    da più lontano.
// (Schizzo e colonnello solo nella controfuga vera: npm run sezione4.)
// Uso: node tests/tiri-centro-v081.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4338, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 29; window.__rnd = () => { if (typeof window.__caso === 'number') return window.__caso; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer, d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = d; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); document.getElementById('goBtn').click(); window.__salta(420);
  H.game.autoplay = true; for (const t of H.teams) t.human = false; });

// L'Italia attacca; il suo centroboa (comandato, levetta ferma: decide solo la regola dell'orientamento) ha la palla a 2,4 m dalla
// porta con il marcatore in una posizione scelta.
const centro = posto => pg.evaluate(posto => {
  const H = window.__pallanuoto, P = H.prova, T = H.teams[0], O = H.teams[1], gx = 12.5 * T.dir, s = T.dir;
  H.game.autoplay = false; T.human = true;
  H.replay?.interrompiReplay?.(); Object.assign(H.game, { state: 'play', after: null, penalty: null, shot: 26, possTeam: T });
  for (const q of H.allPlayers) Object.assign(q, { act: null, excluded: false, uscendo: false, stunUntil: 0, pressatoUntil: 0, pressatoDa: null, turnedUntil: 0, girata: null, freeThrow: false, cut: null, qte: null, qteDopo: 0, vx: 0, vz: 0, stamina: 1, tackleCD: 9, colpi: [] });
  const boa = P.centroAttacco(T), def = P.difensoreCentro(boa);
  const metti = () => {
    boa.x = gx - s * 2.4; boa.z = 0.3; boa.vx = boa.vz = 0;
    const o = { dietro: [0.9, 0], fianco: [0.1, 0.95], 'fianco a 1,5 m': [0.1, 1.5], anticipo: [-0.9, 0], lontano: [0.6, 2.4] }[posto];
    def.x = boa.x + s * o[0]; def.z = boa.z + o[1]; def.vx = def.vz = 0;
    let k = 0; for (const q of T.players) if (q !== boa && !q.isGK) { q.x = gx - s * 8; q.z = -6 + 3 * k++; }
    k = 0; for (const q of O.players) if (q !== def && !q.isGK) { q.x = gx - s * 7; q.z = -6 + 3 * k++; }
  };
  metti(); H.regole.giveBall(boa); H.game.possTeam = T; H.__setCtrl(boa);
  for (let f = 0; f < 40; f++) { metti(); H.fight.holdT = 0; if (H.ball.holder !== boa) H.regole.giveBall(boa); window.__salta(1); }
  const dx = gx - boa.x, dz = -boa.z, L = Math.hypot(dx, dz), f = Math.hypot(boa.fx, boa.fz) || 1;
  const fronte = (boa.fx * dx + boa.fz * dz) / (L * f);
  const r = { fronte, gesto: P.shotKind(boa), tiene: H.ball.holder === boa };
  T.human = false; H.game.autoplay = true; H.__setCtrl(null);
  return r;
}, posto);
for (const posto of ['dietro', 'fianco', 'fianco a 1,5 m']) {
  const r = await centro(posto);
  prova(r.tiene && r.fronte < -0.5 && (r.gesto === 'beduina' || r.gesto === 'sciarpa'), `marcatore ${posto}: il centroboa resta di spalle alla porta (orientamento ${r.fronte.toFixed(2)}) e il suo tiro è ${r.gesto}`);
}
for (const posto of ['anticipo', 'lontano']) {
  const r = await centro(posto);
  prova(r.tiene && r.fronte > 0.5 && r.gesto === 'shot', `marcatore ${posto}: il centroboa si gira verso la porta (orientamento ${r.fronte.toFixed(2)}) e tira di fronte (${r.gesto})`);
}

// Il centroboa del computer, di spalle nella lotta, decide di tirare: beduina o sciarpa.
const decide = await pg.evaluate(() => {
  const H = window.__pallanuoto, P = H.prova, T = H.teams[1], gx = 12.5 * T.dir, s = T.dir;
  const boa = P.centroAttacco(T), def = P.difensoreCentro(boa);
  const esiti = [];
  for (let n = 0; n < 4; n++) {
    for (const q of H.allPlayers) Object.assign(q, { act: null, excluded: false, uscendo: false, stunUntil: 0, pressatoUntil: 0, pressatoDa: null, freeThrow: false, girata: null, turnedUntil: 0, vx: 0, vz: 0, tackleCD: 9, colpi: [] });
    Object.assign(H.game, { state: 'play', after: null, penalty: null, shot: 26, possTeam: T });
    // marcatore dietro a 1,4 m: lotta in corso e centroboa di spalle, ma senza i contatti (sotto 1,15 m) che il caso fisso
    // trasformerebbe in un'espulsione (il marcatore si avvicina di qualche centimetro in un fotogramma)
    boa.x = gx - s * 2.4; boa.z = 0.3 + 0.1 * n; def.x = boa.x + s * 1.4; def.z = boa.z;
    if (H.ball.holder !== boa) H.regole.giveBall(boa);
    window.__salta(20);      // orientamento di spalle
    boa.x = gx - s * 2.4; boa.z = 0.3 + 0.1 * n; def.x = boa.x + s * 1.4; def.z = boa.z;
    { const az = H.v046.azioneAperta(); if (az) az.t0 = H.game.time; }      // lotta appena cominciata
    // nessuna girata partita e nessun disturbo del marcatore nei fotogrammi di preparazione: si misura solo la scelta del tiro
    Object.assign(boa, { act: null, girata: null, turnedUntil: 0, pressatoUntil: 0, pressatoDa: null, freeThrow: false });
    H.fight.holdT = 1; H.fight.decT = 0; window.__caso = 0.05;
    window.__salta(1);
    delete window.__caso;
    esiti.push({ gesto: boa.act?.kind || null, motivo: boa.motivoTiro || null, lotta: H.fight.active, tiene: H.ball.holder === boa, stato: H.game.state });
    boa.act = null; boa.motivoTiro = null;
  }
  return esiti;
});
prova(decide.every(e => e.gesto === 'beduina' || e.gesto === 'sciarpa'), `il centroboa del computer nella lotta tira di spalle: ${decide.map(e => e.gesto).join(', ')}`);

// Occasione chiara: chi riceve libero davanti alla porta tira subito, anche a 3 s dall'inizio dell'azione (costruzione).
const chiara = (o) => pg.evaluate(o => {
  const H = window.__pallanuoto, P = H.prova, T = H.teams[1], O = H.teams[0], gx = 12.5 * T.dir, s = T.dir;
  Object.assign(H.game, { state: 'play', after: null, penalty: null, shot: 25, possTeam: T });
  H.fight.active = false;
  for (const q of H.allPlayers) Object.assign(q, { act: null, excluded: false, uscendo: false, stunUntil: 0, pressatoUntil: 0, pressatoDa: null, turnedUntil: 0, girata: null, freeThrow: false, cut: null, qte: null, qteDopo: 0, vx: 0, vz: 0, stamina: 1, motivoTiro: null });
  const boa = P.centroAttacco(T), p = T.players.find(q => !q.isGK && q !== boa);
  let k = 0; for (const q of T.players) if (q !== p && !q.isGK) { q.x = gx - s * 9; q.z = -6 + 3 * k++; }
  k = 0; for (const q of O.players) if (!q.isGK) { q.x = gx - s * 9.5; q.z = -6 + 2.4 * k++; } else { q.x = gx - s * 0.4; q.z = 0; }
  p.x = gx - s * o.d; p.z = 0.6; p.fx = s; p.fz = 0;
  if (o.vicino) { const d = O.players.find(q => !q.isGK); d.x = p.x + s * 1.3; d.z = p.z + 0.4; }
  H.regole.giveBall(p); H.game.possTeam = T; H.game.possT = H.game.time - 3;
  const az = H.v046.azioneAperta(); if (az) az.t0 = H.game.time - 3;
  Object.assign(p, { ricevutoPassaggio: true, ricevutoT: H.game.time - 0.1, decideT: 9, reazioneT: 9, provaLiberato: null });
  H.ball.holdTime = 0.15;
  P.aiCarrier(p, 1 / 60);
  return { gesto: p.act?.kind || null, motivo: p.motivoTiro || null };
}, o);
const c1 = await chiara({ d: 4.5 });
prova(['shot', 'polso', 'torsione'].includes(c1.gesto) && c1.motivo === 'occasione chiara', `libero a 4,5 m davanti alla porta, 3 s dopo l'inizio dell'azione: tira subito (${c1.gesto}, ${c1.motivo})`);
const c2 = await chiara({ d: 4.5, vicino: true });
prova(c2.motivo !== 'occasione chiara', `con un avversario a 1,4 m non è un'occasione chiara (${c2.gesto || 'nessun gesto'}, ${c2.motivo || '-'})`);
const c3 = await chiara({ d: 6.5 });
prova(c3.motivo !== 'occasione chiara', `a 6,5 m non è un'occasione chiara (${c3.gesto || 'nessun gesto'}, ${c3.motivo || '-'})`);

prova(!errori.length, 'nessun errore nella pagina' + (errori.length ? ': ' + errori.slice(0, 2).join(' | ') : ''));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nTiri v0.81: tutte le prove superate' : '\nTiri v0.81: prove NON superate');
process.exit(ok ? 0 : 1);
