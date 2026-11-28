// Ritocchi v0.90 (Ale, 26/11/2026):
// 1. rigore: «se il giocatore tiene il braccio in quel modo deve ruotare un po' il busto e le spalle verso la palla»;
// 2. «all'inizio del movimento di finta continua a esserci questo avvitamento veloce e innaturale»;
// 3. «quando il portiere recupera palla un giocatore va verso la porta entrandoci dentro»;
// 4. rigore: «a fianco al tiratore rimangono 2 uomini della squadra avversaria e al massimo altri due della squadra che sta attaccando,
//    gli altri giocatori stanno in mezzo al campo rispettando le posizioni».
// Uso: node tests/ritocchi-v090.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GIUNTI_GESTO_VISTA, RACCORDO_VISTA, conservaGestoVista, preparaGestoVista, raccordaGestoVista } from '../src/grafica/gesto-vista.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4476, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 844, height: 390 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 7; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => {
    // Le verifiche leggono ossa, giunture e coordinate, non pixel: mantieni
    // tutti gli aggiornamenti RAF/rig evitando disegni GPU non utilizzati.
    const R=window.__pallanuoto.renderer,disegna=R.render;R.render=()=>{};
    try{for(let i=0;i<n;i++){window.__tieni?.();now+=1000/60;window.__raf(now);}}
    finally{R.render=disegna;}
  };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };

// 5. video di Ale (26/11): «parte quel movimento molto veloce che sembra quasi uno spasmo; o va rallentato o va tolto».
// Raccordo del disegno tra due pose: dura quanto serve a non superare RACCORDO_VISTA.velocita (prima sempre 0,08 s)
{
  const posa = v => Object.fromEntries(GIUNTI_GESTO_VISTA.map(k => [k, [v, 0.3, 0.2]]));
  const durata = (spostamento, atto) => {
    const p = { num: 9, scheda: {}, x: 0, z: 0, chargeT: 0, charging: false }, T = { torsioneVista: 0, polsoR: 0, polsoL: 0 };
    let s = preparaGestoVista(p, null, true, 1, 1 / 60, 1); conservaGestoVista(s, posa(0), T);
    s = preparaGestoVista(p, atto || null, true, 1.02, 1 / 60, 1.02);
    if (!atto) { s.gesto = 'finto'; s = preparaGestoVista(p, null, true, 1.03, 1 / 60, 1.03); }
    raccordaGestoVista(s, posa(spostamento), T); return s.raccordoD;
  };
  const grande = durata(1), piccolo = durata(0.1), gesto = durata(1, { wind: 0.2, frusta: 0.15, t: 0 });
  prova(grande >= 0.3 && grande <= RACCORDO_VISTA.massimo, `raccordo di una posa che si sposta di 1 unità del corpo: ${grande.toFixed(2)} s (prima 0,08 s)`);
  prova(Math.abs(piccolo - 0.08) < 1e-9, `raccordo di un piccolo spostamento invariato: ${piccolo.toFixed(2)} s`);
  prova(gesto <= 0.55 * 0.35 + 1e-9, `l'ingresso in un gesto finisce prima del rilascio: ${gesto.toFixed(3)} s`);
  // la presa raccorda la posa (prima la azzerava: il corpo scattava nel fotogramma della presa)
  const p = { num: 9, scheda: {}, x: 0, z: 0, chargeT: 0, charging: false }, T = { torsioneVista: 0, polsoR: 0, polsoL: 0 };
  let s = preparaGestoVista(p, null, false, 1, 1 / 60, 1); conservaGestoVista(s, posa(0), T);
  s = preparaGestoVista(p, null, true, 1.02, 1 / 60, 1.02); const W = posa(0.8); raccordaGestoVista(s, W, T);
  prova(W.hR[0] === 0 && s.raccordoD > 0.2, `alla presa il corpo parte dalla posa di prima (raccordo di ${s.raccordoD.toFixed(2)} s)`);
}
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(200); });

// 4. schieramento del rigore: due difensori e al massimo due attaccanti vicino al tiratore, gli altri a metà campo
const schiera = await pg.evaluate(() => {
  const H = window.__pallanuoto, g = H.game, t = H.teams[0], ot = H.teams[1], gx = 12.5 * t.dir;
  H.replay?.interrompiReplay?.(); g.state = 'play'; g.after = null; g.rigoriFinali = null;
  for (const q of H.allPlayers) q.excluded = false;
  const s = t.players[4]; H.regole.setupPenalty(t, s);
  const vicino = q => Math.abs(q.x - (gx - t.dir * 6)) < 0.2 && Math.abs(q.z) < 5;
  const campo = q => !q.isGK && q !== s;
  const dif = ot.players.filter(campo), att = t.players.filter(campo);
  return { difVicini: dif.filter(vicino).length, attVicini: att.filter(vicino).length,
    distanza: Math.min(...[...dif, ...att].filter(vicino).map(q => Math.hypot(q.x - s.x, q.z - s.z))),
    aMetaCampo: [...dif, ...att].filter(q => !vicino(q)).every(q => Math.abs(q.x) < 1.5), altri: [...dif, ...att].filter(q => !vicino(q)).length };
});
prova(schiera.difVicini === 2 && schiera.attVicini <= 2 && schiera.attVicini >= 1, `rigore: vicino al tiratore ${schiera.difVicini} difensori e ${schiera.attVicini} attaccanti (Ale: 2 e al massimo 2)`);
prova(schiera.distanza >= 3 - 1e-6, `chi sta vicino è sulla linea dei 6 metri ad almeno 3 m dal tiratore (${schiera.distanza.toFixed(2)} m)`);
prova(schiera.aMetaCampo && schiera.altri === 7, `gli altri ${schiera.altri} giocatori di movimento sono a metà campo (${schiera.aMetaCampo})`);

// 1. posizione iniziale: spalle e busto girati verso la palla (la spalla del braccio che tira va indietro), testa verso la porta
const posa = await pg.evaluate(() => {
  const H = window.__pallanuoto, s = H.game.penalty; s.mano = 'D'; window.__salta(30);
  const V = s.giuntiVista; return { dx: +(V.sR[0] - V.sL[0]).toFixed(3), palla: s.davantiVista, ballY: +s.ballVistaW[1].toFixed(2) };
});
prova(posa.dx < -0.08, `rigore: la spalla destra (braccio che tira) è indietro rispetto alla sinistra di ${(-posa.dx).toFixed(2)} (busto girato verso la palla)`);
prova(posa.ballY < 0.3, `la palla resta in acqua prima del gesto (${posa.ballY} m)`);

// nella serie finale nessuno vicino al tiratore
const serie = await pg.evaluate(() => {
  const H = window.__pallanuoto, g = H.game, t = H.teams[0], gx = 12.5 * t.dir;
  g.rigoriFinali = { finto: true }; const s = t.players[4]; H.regole.setupPenalty(t, s);
  const n = H.allPlayers.filter(q => !q.isGK && q !== s && Math.hypot(q.x - s.x, q.z - s.z) < 6).length;
  g.rigoriFinali = null; g.penalty = null; return n;
});
prova(serie === 0, `serie finale dei rigori: nessuno vicino al tiratore (${serie})`);

// 2. avvio della tenuta di TIRO: il bacino non si avvita (prima 56° in 0,7 s, fino a 126°/s)
const avvio = await pg.evaluate(() => {
  const H = window.__pallanuoto, g = H.game, it = H.teams[0], p = it.players[4], gx = 12.5 * it.dir;
  for (const t of H.teams) t.human = t === it; g.autoplay = false; g.state = 'play'; g.after = null; g.penalty = null; H.fight.active = false;
  for (const q of H.allPlayers) Object.assign(q, { act: null, charging: false, stunUntil: g.time + 99, tackleCD: 99, colpi: [], decideT: 99, reazioneT: 99 });
  for (const q of H.teams[1].players) if (!q.isGK) { q.x = -gx * 0.6; q.z = (q.i - 3) * 2; }
  const tieni = () => { p.x = gx - it.dir * 7; p.z = 0; p.vx = p.vz = 0; p.fx = it.dir; p.fz = 0; p.oriz = 0; p.stunUntil = 0; p.pressatoUntil = 0; };
  tieni(); H.regole.giveBall(p); H.__setCtrl(p); g.possTeam = it; g.possT = g.time - 20; window.__tieni = tieni; window.__salta(60);
  const R = p.mesh, O = R.corpo.ossa, V = new (R.g.position.constructor)();
  const lin = (a, b) => { const A = a.getWorldPosition(V.clone()), B = b.getWorldPosition(V.clone()); R.g.worldToLocal(A); R.g.worldToLocal(B); return Math.atan2(B.x - A.x, B.z - A.z) * 180 / Math.PI; };
  const a0 = lin(O.cosciaS, O.cosciaD), s0 = lin(O.bracS, O.bracD); let anche = 0, spalle = 0, prima = a0, vel = 0;
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' }));
  for (let i = 0; i < 48; i++) { window.__salta(1); const a = lin(O.cosciaS, O.cosciaD); anche = Math.max(anche, Math.abs(a - a0)); spalle = Math.max(spalle, Math.abs(lin(O.bracS, O.bracD) - s0)); vel = Math.max(vel, Math.abs(a - prima) * 60); prima = a; }
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyK' })); window.__tieni = null;
  return { anche: +anche.toFixed(1), spalle: +spalle.toFixed(1), vel: +vel.toFixed(0) };
});
prova(avvio.anche < 25 && avvio.vel < 70, `avvio della finta: il bacino gira al massimo di ${avvio.anche}° (prima 56°), a ${avvio.vel}°/s (prima 126°/s)`);
prova(avvio.spalle > avvio.anche, `le spalle caricano più delle anche (${avvio.spalle}° contro ${avvio.anche}°)`);

// 3. palla al portiere della squadra del giocatore, tenuta a lungo: nessun compagno entra nella porta
const porta = await pg.evaluate(() => {
  const H = window.__pallanuoto, g = H.game, it = H.teams[0], gk = it.players[0], og = -12.5 * it.dir;
  H.replay?.interrompiReplay?.(); g.state = 'play'; g.after = null; g.penalty = null; g.autoplay = false;
  for (const t of H.teams) t.human = t === it;
  for (const q of H.allPlayers) Object.assign(q, { act: null, charging: false, stunUntil: 0, tackleCD: 99, colpi: [], excluded: false });
  gk.x = og + it.dir * 0.7; gk.z = 0; H.regole.giveBall(gk); H.__setCtrl(gk); g.possTeam = it; g.possT = g.time;
  it.contro = { schema: 'apertura2', fino: g.time + 12 };
  let dentro = 0; window.__tieni = () => { gk.x = og + it.dir * 0.7; gk.z = 0; if (H.ball.holder !== gk) H.regole.giveBall(gk); };
  for (let i = 0; i < 480; i++) { window.__salta(1); for (const q of it.players) if (!q.isGK && Math.abs(q.x - og) < 1.2 && Math.abs(q.z) < 1.6) dentro++; }
  window.__tieni = null; return dentro;
});
prova(porta === 0, `portiere con la palla per 8 s (apertura del 2): nessun compagno entra nella propria porta (${porta} fotogrammi dentro)`);

// 6. dopo la finta il computer non si distende a nuotare verso il suo posto finché non parte il gesto dopo (FINTA_RITMO.scivolo)
const dopoFinta = await pg.evaluate(() => {
  const H = window.__pallanuoto, g = H.game, t = H.teams[1], p = t.players[4], gx = 12.5 * t.dir;
  H.replay?.interrompiReplay?.(); g.state = 'play'; g.after = null; g.penalty = null; g.autoplay = true;
  for (const q of H.teams) q.human = false;
  for (const q of H.allPlayers) Object.assign(q, { act: null, charging: false, stunUntil: 0, tackleCD: 99, colpi: [], excluded: false, cut: null, fintaPronto: 0 });
  for (const q of H.teams[0].players) if (!q.isGK) { q.x = -gx * 0.8; q.z = (q.i - 3) * 2.4; q.stunUntil = g.time + 99; }
  p.x = gx - t.dir * 15; p.z = -6; p.vx = p.vz = 0; p.oriz = 0; H.regole.giveBall(p); g.possTeam = t; g.possT = g.time - 10; g.shot = 25;
  window.__salta(2); const lontano = Math.hypot(p.target.x - p.x, p.target.z - p.z);
  H.prova.startAct(p, 'fake', 0.25, () => {}); const fino = p.fintaPronto; let oriz = 0, scivolo = 0;
  while (g.time < fino - 0.02 && H.ball.holder === p) { window.__salta(1); oriz = Math.max(oriz, p.oriz || 0); scivolo = Math.max(scivolo, Math.hypot(p.target.x - p.x, p.target.z - p.z)); }
  return { lontano: +lontano.toFixed(1), oriz: +oriz.toFixed(2), scivolo: +scivolo.toFixed(2), durata: +(fino - g.time).toFixed(2) };
});
prova(dopoFinta.lontano > 4 && dopoFinta.oriz < 0.1 && dopoFinta.scivolo <= 1.2 + 1e-6, `dopo la finta, con il posto a ${dopoFinta.lontano} m, chi ha la palla resta dritto fino al gesto dopo (assetto massimo ${dopoFinta.oriz}, spostamento ${dopoFinta.scivolo} m alla volta)`);

prova(errori.length === 0, `nessun errore nella pagina${errori.length ? ': ' + errori.join(' | ') : ''}`);
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nRitocchi v0.90: tutte le prove superate' : '\nRitocchi v0.90: PROVE FALLITE');
process.exit(ok ? 0 : 1);
