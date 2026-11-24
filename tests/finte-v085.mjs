// Finte v0.85 (Ale: «davanti alla porta finta veloce ma non troppo»; «ora quelle vicino alla porta sono troppo veloci, vanno
// rallentate»; «avanti-indietro ma più spesso destra-sinistra, larghe o strette, braccio piegato o dritto»).
// 1. Computer: dopo una finta il gesto successivo (finta, tiro o passaggio) parte solo a braccio tornato carico più
//    FINTA_RITMO.attesa (prima partiva alla fine dell'accenno, a metà del ritorno).
// 2. Giocatore che tiene TIRO: una finta dopo l'altra a braccio tornato carico più la stessa attesa (almeno 0,9 s).
// 3. Le finte vanno di lato da destra verso sinistra circa due volte su tre (FINTA_LATO.quota), le altre avanti e indietro; strette
//    e veloci o ampie e lente (FINTA_AMPIEZZA), più strette davanti alla porta.
// 4. Disegno: finte a braccio dritto e a braccio piegato, larghe e strette.
// Uso: node tests/finte-v085.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4343, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 43; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer, d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = d; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); document.getElementById('goBtn').click(); window.__salta(420); });

// scena comune: chi attacca a 6 m dalla porta, difensori lontani e fermi, nessun contrasto
const prepara = (squadra, umano, stile) => pg.evaluate(({ squadra, umano, stile }) => {
  const H = window.__pallanuoto, g = H.game, t = H.teams[squadra], d = H.teams[1 - squadra];
  H.replay?.interrompiReplay?.();
  g.autoplay = !umano; H.teams[0].human = umano; H.teams[1].human = false;
  Object.assign(g, { state: 'play', after: null, penalty: null, shot: 20 }); H.fight.active = false;
  for (const q of H.allPlayers) Object.assign(q, { act: null, excluded: false, uscendo: false, charging: false, chargeT: 0, stunUntil: 0, tackleCD: 99, colpi: [], cut: null,
    pressatoUntil: 0, freeThrow: false, oriz: 0, fakeCount: 0, ultimoLatoFinta: 0, fintaLatoGesto: 0, fintaLatoVoluto: 0, fintaLato: null, fintaPronto: 0, qte: null, qteDopo: g.time + 99 });
  const gx = 12.5 * t.dir, p = t.players[4];
  for (const q of d.players) if (!q.isGK) { q.x = -gx * 0.5; q.z = (q.i - 3) * 2.5; q.vx = q.vz = 0; q.stunUntil = g.time + 99; }
  for (const q of t.players) if (!q.isGK && q !== p) { q.x = -gx * 0.2; q.z = (q.i - 3) * 2.5; q.vx = q.vz = 0; }
  p.x = gx - t.dir * 6; p.z = 1; p.vx = p.vz = 0; p.fx = t.dir; p.fz = 0; p.mano = 'D';
  if (stile) p.scheda = { ...p.scheda, finta: stile };
  H.regole.giveBall(p); if (umano) H.__setCtrl(p);
  Object.assign(H.ball, { kind: null, shooter: null, afterShot: false, inRete: false, vx: 0, vy: 0, vz: 0 });
  window.__salta(2);
}, { squadra, umano, stile });

// 1. computer: il gesto dopo la finta aspetta il ritorno del braccio e l'attesa
const ritmo = [];
for (let k = 0; k < 6; k++) {
  await prepara(1, false, null);
  ritmo.push(await pg.evaluate(() => {
    const H = window.__pallanuoto, g = H.game, p = H.teams[1].players[4];
    // decisione già pronta (tiro dopo la finta, nessuna pausa personale): senza la regola v0.85 il gesto dopo partirebbe a fine accenno
    Object.assign(p, { shootNext: true, decideT: 0, scaricoDopoFinta: false });
    H.prova.startAct(p, 'fake', 0.16, () => {});
    const a = p.act, t0 = g.time, attesa = a.wind + a.frusta + a.recupero + 0.2;
    let dopo = null;
    for (let i = 0; i < 150 && !dopo; i++) {
      window.__salta(1);
      if (H.ball.holder !== p) dopo = { kind: 'palla partita', t: g.time - t0 };
      else if (p.act && p.act !== a) dopo = { kind: p.act.kind, t: g.time - t0 };
    }
    return { attesa: +attesa.toFixed(3), dopo: dopo && { kind: dopo.kind, t: +dopo.t.toFixed(3) } };
  }));
}
const conDopo = ritmo.filter(r => r.dopo);
prova(conDopo.length >= 5 && conDopo.every(r => r.dopo.t >= r.attesa - 1 / 60 - 1e-6),
  `computer: dopo la finta il gesto successivo parte a braccio tornato carico più l'attesa (${conDopo.map(r => `${r.dopo.kind} a ${r.dopo.t} s, minimo ${r.attesa}`).join('; ')})`);
prova(conDopo.every(r => r.dopo.t <= r.attesa + 0.6), `computer: il gesto dopo la finta arriva comunque (entro ${Math.max(...conDopo.map(r => r.dopo.t)).toFixed(2)} s)`);

// 2. giocatore: tenendo TIRO una finta ogni accenno + ritorno + attesa
await prepara(0, true, 'raffica');
await pg.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' })));
const umano = await pg.evaluate(() => {
  const H = window.__pallanuoto, g = H.game, p = H.teams[0].players[4], inizi = [];
  let ultimo = null;
  for (let i = 0; i < 60 * 4 && inizi.length < 3; i++) { window.__salta(1); if (p.act && p.act !== ultimo && p.act.kind === 'fake') { ultimo = p.act; inizi.push({ t: g.time, durata: p.act.wind + p.act.frusta + p.act.recupero }); } }
  return { tiene: H.ball.holder === p, inizi: inizi.map(x => ({ t: +x.t.toFixed(3), durata: +x.durata.toFixed(3) })) };
});
await pg.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyK' })));
const intervalli = umano.inizi.slice(1).map((x, i) => +(x.t - umano.inizi[i].t).toFixed(3));
prova(umano.inizi.length === 3 && intervalli.every((d, i) => d >= umano.inizi[i].durata + 0.2 - 1 / 60 - 1e-6 && d >= 0.9 - 1 / 60),
  `giocatore che tiene TIRO: una finta ogni ${intervalli.join(' e ')} s (accenno + ritorno + attesa, almeno 0,9 s)`);

// 3. di lato da destra verso sinistra (attraverso il corpo) circa due volte su tre, le altre avanti e indietro
await prepara(1, false, null);
const lati = await pg.evaluate(() => {
  const H = window.__pallanuoto, p = H.teams[1].players[4], attraverso = (p.mano === 'S' ? 1 : -1) * p.team.dir; let laterali = 0, giuste = 0;
  for (let k = 0; k < 80; k++) { Object.assign(p, { act: null, fakeCount: 0, fintaLatoVoluto: 0 }); H.prova.startAct(p, 'fake', 0.16, () => {}); if (p.fintaLatoGesto) { laterali++; if (p.fintaLatoGesto === attraverso) giuste++; } }
  p.act = null; return { quota: laterali / 80, giuste, laterali };
});
prova(lati.quota > 0.5 && lati.quota < 0.8 && lati.giuste === lati.laterali,
  `finte di lato ${Math.round(lati.quota * 100)} volte su 100 (FINTA_LATO.quota 65), tutte da destra verso sinistra attraverso il corpo (${lati.giuste} su ${lati.laterali})`);

// 3b. stretta e veloce, ampia e lenta: lo stile a raffica (stretto) contro lo stile largo, e la stessa finta vicino e lontano dalla porta
const tempi = async (stile, metri) => { await prepara(1, false, stile); return pg.evaluate(metri => {
  const H = window.__pallanuoto, p = H.teams[1].players[4], gx = 12.5 * p.team.dir, out = { accenno: 0, ritorno: 0, largo: 0 };
  p.x = gx - p.team.dir * metri; p.z = 0;
  for (let k = 0; k < 60; k++) { Object.assign(p, { act: null, fakeCount: 0, oriz: 0 }); H.prova.startAct(p, 'fake', 0.04, () => {}); const a = p.act; out.accenno += (a.wind + a.frusta) / 60; out.ritorno += a.recupero / 60; out.largo += a.largo / 60; }
  p.act = null; for (const k in out) out[k] = +out[k].toFixed(3); return out;
}, metri); };
const stretta = await tempi('raffica', 8), ampia = await tempi('larga', 8), vicinoPorta = await tempi('larga', 3.5);
prova(ampia.accenno >= stretta.accenno + 0.08 && ampia.ritorno >= stretta.ritorno + 0.05 && stretta.accenno <= 0.4,
  `stretta e veloce, ampia e lenta: accenno ${stretta.accenno} contro ${ampia.accenno} s, ritorno ${stretta.ritorno} contro ${ampia.ritorno} s`);
prova(vicinoPorta.largo <= ampia.largo - 0.15 && vicinoPorta.accenno < ampia.accenno,
  `davanti alla porta più strette e veloci: larghezza ${vicinoPorta.largo} a 3,5 m contro ${ampia.largo} a 8 m (accenno ${vicinoPorta.accenno} s)`);

// 4. disegno (giocatore che tiene TIRO, stile a raffica). Si misura l'angolo del gomito disegnato al culmine di ogni finta (180° =
// braccio disteso) e quanto la mano va di lato: le quattro forme scelte a mano (window.__formaFinta, come nel foglio delle foto),
// tutte di lato con la levetta, poi dodici finte con le forme scelte dal gioco.
const FORME = [{ largo: 0.9, piegato: false }, { largo: 0.1, piegato: true }, { largo: 0.1, piegato: false }, { largo: 0.9, piegato: true }];
const misuraFinte = (forme, quante) => pg.evaluate(({ forme, quante }) => {
  const H = window.__pallanuoto, p = H.teams[0].players[4], out = []; let ultimo = null, cur = null;
  const gomito = V => { const u = [0, 1, 2].map(k => V.eR[k] - V.sR[k]), w = [0, 1, 2].map(k => V.hR[k] - V.eR[k]);
    const c = (u[0] * w[0] + u[1] * w[1] + u[2] * w[2]) / Math.hypot(...u) / Math.hypot(...w); return 180 - Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI; };
  if (forme) window.__formaFinta = forme[0];
  for (let i = 0; i < 60 * 16 && out.length < quante; i++) {
    window.__salta(1);
    const a = p.act, V = p.giuntiVista;
    if (a?.kind === 'fake' && a !== ultimo) { if (cur) out.push(cur); ultimo = a; cur = { gomito: 0, lato: 0, lato0: null, diLato: !!p.fintaLatoGesto }; if (forme) window.__formaFinta = forme[(out.length + 1) % forme.length]; }
    if (cur && a === ultimo && V) {
      const g = gomito(V), dx = V.hR[0] - V.sR[0], dz = V.hR[2] - V.sR[2], l = -dx * p.fz + dz * p.fx;
      if (cur.lato0 === null) cur.lato0 = l;
      cur.gomito = Math.max(cur.gomito, g); cur.lato = Math.max(cur.lato, Math.abs(l - cur.lato0));      // quanto la mano va di lato dalla carica
    }
  }
  window.__formaFinta = null;
  return out.map(f => ({ gomito: Math.round(f.gomito), lato: +f.lato.toFixed(2), diLato: f.diLato }));
}, { forme, quante });
await prepara(0, true, 'raffica');
await pg.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' })); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' })); });
const forzate = await misuraFinte(FORME, 4);
await pg.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyK' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowDown' })); });
const [dl, ps, ds, pl] = forzate;
prova(forzate.length === 4 && Math.min(dl.gomito, ds.gomito) >= Math.max(ps.gomito, pl.gomito) + 20,
  `disegno: braccio dritto disteso, piegato raccolto (gomito: dritto ${dl.gomito}° e ${ds.gomito}°, piegato ${ps.gomito}° e ${pl.gomito}°)`);
prova(forzate.length === 4 && forzate.every(f => f.diLato) && dl.lato >= ds.lato + 0.04 && pl.lato >= ps.lato + 0.04,
  `disegno: la finta di lato larga va più verso il palo della stretta (mano di lato: dritto ${dl.lato} contro ${ds.lato} m, piegato ${pl.lato} contro ${ps.lato} m)`);
await prepara(0, true, 'raffica');
await pg.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' })));
const scelte = await misuraFinte(null, 12);
await pg.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyK' })));
const gomiti = scelte.map(f => f.gomito);
prova(scelte.length >= 10 && gomiti.some(g => g >= 125) && gomiti.some(g => g <= 112),
  `disegno: nelle finte scelte dal gioco ci sono braccio dritto e piegato (gomito ${gomiti.join(', ')}°)`);

prova(!errori.length, 'nessun errore nella pagina' + (errori.length ? ': ' + errori.slice(0, 2).join(' | ') : ''));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nFinte v0.85: tutte le prove superate' : '\nFinte v0.85: prove NON superate');
process.exit(ok ? 0 : 1);
