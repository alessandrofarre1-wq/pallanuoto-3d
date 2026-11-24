// v0.75: sul telefono un tocco e rilascio è un polso; tenere TIRO conserva la palla e ripete le finte. Un tocco mentre arriva un passaggio
// è un tiro al volo; i passaggi sono più tesi e arrivano alla mano alzata. Uso: node tests/finta-v055.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4474, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 11; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; const d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = d; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
// i pulsanti touch si premono con il DOM vero
const premi = async () => {
  await pg.evaluate(() => { const b = document.querySelector('[data-b="shoot"]'), r = b.getBoundingClientRect();
    const t = new Touch({ identifier: 7, target: b, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 });
    b.dispatchEvent(new TouchEvent('touchstart', { touches: [t], targetTouches: [t], changedTouches: [t], bubbles: true, cancelable: true })); });
};
const rilascia = async () => {
  await pg.evaluate(() => { const b = document.querySelector('[data-b="shoot"]'), r = b.getBoundingClientRect();
    const t = new Touch({ identifier: 7, target: b, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 });
    b.dispatchEvent(new TouchEvent('touchend', { touches: [], targetTouches: [], changedTouches: [t], bubbles: true, cancelable: true })); });
};
const tocco = async ms => { await premi(); await pg.evaluate(n => window.__salta(n), Math.round(ms / 1000 * 60)); await rilascia(); };
const prepara = () => pg.evaluate(() => {
  const H = window.__pallanuoto, it = H.teams[0], hu = H.teams[1], gx = 12.5 * it.dir;
  H.game.state = 'play'; H.game.after = null; H.game.penalty = null; H.fight.active = false; H.game.shot = 28;
  for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.charging = false; q.chargeT = 0; q.pressatoUntil = 0; q.freeThrow = false; q.vx = q.vz = 0; q.fakeCount = 0; q.fintaLatoGesto = 0; q.ultimoLatoFinta = 0; q.fintaLato = null; }
  for (const q of hu.players) { if (q.isGK) continue; q.x = -gx * 0.6; q.z = (q.i - 3) * 2; q.stunUntil = H.game.time + 99; q.tackleCD = 99; }
  const p = it.players[4]; p.x = gx - it.dir * 8; p.z = 2; H.regole.giveBall(p); H.__setCtrl(p); p.decideT = 99;
  window.__salta(5);
});
const stato = () => pg.evaluate(() => { const H = window.__pallanuoto, p = H.teams[0].players[4];
  return { tiene: H.ball.holder === p, finte: p.fakeCount || 0, palla: H.ball.state, tipo: H.ball.kind, gesto: p.act && p.act.kind }; });

await prepara(); await tocco(80); const a = await pg.evaluate(() => { window.__salta(1); const H=window.__pallanuoto,p=H.teams[0].players[4]; return {gesto:p.act?.kind,finte:p.fakeCount}; });
prova(a.gesto === 'polso' && a.finte === 0, `un tocco e rilascio su TIRO = polso, senza finta (${a.gesto}, finte ${a.finte})`);
await prepara(); await premi(); await pg.evaluate(() => window.__salta(180)); const b = await stato();
prova(b.tiene && b.finte >= 3, `TIRO tenuto = finte continue con la palla in mano (${b.finte})`);
await rilascia();
// v0.59 (video di Dénes Varga; Ale: «sposta sia il difensore che il portiere»): finte di lato verso un palo, alternando; il portiere
// che abbocca alla finta di lato si sposta verso quel palo. v0.85 (Ale: «avanti-indietro ma più spesso destra-sinistra»): anche la
// prima può andare di lato (prima era sempre dritta) e con la levetta inclinata va da quella parte già dalla prima.
await prepara(); await premi();
const lati = await pg.evaluate(() => { const p=window.__pallanuoto.teams[0].players[4],lati=[]; let contate=0;
  for(let i=0;i<300&&lati.length<3;i++){ window.__salta(1); if(p.fakeCount>contate){contate=p.fakeCount;lati.push(p.fintaLatoGesto||0);} } return lati; });
await rilascia();
const laterali = lati.filter(l => l !== 0);
prova(lati.length === 3 && laterali.length >= 2 && lati.slice(1).every(l => l !== 0) && laterali.every((l, i) => i === 0 || l === -laterali[i - 1]),
  `finte: di lato verso un palo, alternando (${lati.join(', ')})`);
await prepara();
await pg.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' })));
await premi();
const conLevetta = await pg.evaluate(() => { const p=window.__pallanuoto.teams[0].players[4];
  for(let i=0;i<120&&!(p.fakeCount>0);i++) window.__salta(1); return p.fakeCount>0 ? p.fintaLatoGesto||0 : null; });
await rilascia();
await pg.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowDown' })));
prova(conLevetta === 1, `con la levetta inclinata la prima finta va già da quella parte (lato ${conLevetta})`);
const gkSposta = await pg.evaluate(() => { const H = window.__pallanuoto, gk = H.teams[1].players[0];
  gk.fintaLato = null; const z0 = H.prova.gkTarget(gk).z; gk.fintaLato = { lato: 1, fino: H.game.time + 1 }; const z1 = H.prova.gkTarget(gk).z; gk.fintaLato = null; return z1 - z0; });
prova(gkSposta > 0.3, `il portiere che abbocca alla finta di lato si sposta verso quel palo (${gkSposta.toFixed(2)} m)`);
// (v0.59) si guarda se il tiro parte dal giocatore nei fotogrammi dopo il rilascio: dopo 30-40 fotogrammi il portiere o il muro
// possono già averlo fermato, e lo stato finale della palla dipendeva dal caso
const partito = n => pg.evaluate(n => { const H = window.__pallanuoto, p = H.teams[0].players[4]; let tiro = false;
  for (let i = 0; i < n && !tiro; i++) { window.__salta(1); if (H.ball.kind === 'shot' && H.ball.shooter === p && H.ball.holder !== p) tiro = true; }
  return { tiro, palla: H.ball.state, tipo: H.ball.kind }; }, n);
await prepara(); await tocco(250); const c = await partito(30);
prova(c.tiro, `tenuto 0,25 s e lasciato = tiro di polso (partito: ${c.tiro ? 'sì' : 'no'}, palla ${c.palla})`);
await prepara(); await tocco(900); const d = await partito(40);
prova(d.tiro, `tenuto 0,9 s e lasciato = tiro caricato (partito: ${d.tiro ? 'sì' : 'no'}, palla ${d.palla})`);
// tiro al volo: passaggio a un compagno vicino alla porta, un tocco su TIRO mentre la palla vola
await pg.evaluate(() => { const H = window.__pallanuoto, it = H.teams[0], gx = 12.5 * it.dir, p = it.players[4], m = it.players[2];
  H.game.state = 'play'; H.game.after = null; H.game.penalty = null;
  m.x = gx - it.dir * 5; m.z = -3; m.vx = m.vz = 0; m.decideT = 99; p.x = gx - it.dir * 9; p.z = 3; H.regole.giveBall(p); H.__setCtrl(p); p.act = null;
  // v0.79: il compagno è libero (nessun avversario entro 1,5 m) in posizione di tiro: il passaggio gli arriva alto e teso, in mano
  for (const o of H.teams[1].players) if (!o.isGK && Math.hypot(o.x - m.x, o.z - m.z) < 2.5) { o.x = gx - it.dir * 8; o.z = 6; o.vx = o.vz = 0; }
  H.prova.doPass(p, m); window.__vPass = Math.hypot(H.ball.vx, H.ball.vz); window.__salta(3); });
await tocco(60);
// si guarda il primo secondo dopo il tocco: il tiro al volo parte appena arriva la palla (poi il portiere può già averla parata)
const v = await pg.evaluate(() => { const H = window.__pallanuoto, m = H.teams[0].players[2]; let tipo = null, stato = null, tiratore = false;
  for (let i = 0; i < 60 && !tiratore; i++) { window.__salta(1); if (H.ball.kind === 'shot' && H.ball.shooter === m) { tipo = 'shot'; stato = H.ball.state; tiratore = true; } }
  return { velocita: window.__vPass, tipo, stato, tiratore }; });
prova(v.velocita >= 11, `passaggio teso al compagno libero vicino alla porta: ${v.velocita.toFixed(1)} m/s alla partenza (v0.79: morbido solo nella circolazione tranquilla)`);
prova(v.tipo === 'shot' && v.tiratore, `un tocco su TIRO mentre arriva il passaggio = tiro al volo di chi riceve (${v.tipo}, ${v.stato})`);
// passaggio (v0.55): in attacco mai al proprio portiere; con la levetta verso la porta il centroboa ha la precedenza
const pas = await pg.evaluate(() => { const H = window.__pallanuoto, it = H.teams[0], gx = 12.5 * it.dir, p = it.players[4];
  H.game.state = 'play'; H.game.after = null;
  for (const q of it.players) { if (q.isGK) continue; q.x = gx - it.dir * (q === p ? 7 : 5); q.z = (q.i - 3) * 2.4; }
  const boa = it.players[1]; boa.x = gx - it.dir * 2.6; boa.z = 0.4; p.x = gx - it.dir * 7; p.z = 2.5; it.players[0].x = -gx + it.dir * 0.6; it.players[0].z = 0;
  const indietro = H.prova.humanPassTarget(p, -it.dir, 0), avanti = H.prova.humanPassTarget(p, it.dir, -0.25);
  return { indietroGK: !!(indietro && indietro.isGK), avantiBoa: !!(avanti && avanti.i === 1) }; });
prova(!pas.indietroGK, `in attacco la levetta verso la propria porta non passa al portiere`);
prova(pas.avantiBoa, `levetta verso la porta avversaria: passaggio al centroboa`);
// Palla al centroboa: marcato → in acqua davanti; libero → alta in mano.
// v0.69: battere l’anticipo senza un intervento falloso non produce rigori o espulsioni.
const boa = await pg.evaluate(() => {
  const H = window.__pallanuoto, it = H.teams[0], hu = H.teams[1], gx = 12.5 * it.dir, p = it.players[4], m = it.players[1], d = hu.players[6];
  const scena = (dove) => {
    H.game.state = 'play'; H.game.after = null; H.game.penalty = null; H.fight.active = false; H.game.shot = 28;
    for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.charging = false; q.vx = q.vz = 0; q.decideT = 99; q.reazioneT = 99; q.stunUntil = 0; q.tackleCD = 99; q.colpi = []; if (!q.isGK) { q.x = -gx * 0.5 + q.i * 0.7; q.z = q.team === it ? 6 : -6; } }
    m.x = gx - it.dir * 3; m.z = 0; m.fx = -it.dir; m.fz = 0; p.x = gx - it.dir * 8; p.z = 3;
    if (dove === 'dietro') { d.x = gx - it.dir * 2.25; d.z = 0; } else if (dove === 'anticipo') { const ux = p.x - m.x, uz = p.z - m.z, l = Math.hypot(ux, uz); d.x = m.x + ux / l * 0.75; d.z = m.z + uz / l * 0.75; d.stunUntil = H.game.time + 0.6; }
    H.regole.giveBall(p); H.__setCtrl(p); p.act = null;
  };
  const arrivo = dove => { scena(dove); H.prova.doPass(p, m); let y = null, esito = '';
    const reg = H.cronaca.registro.length;
    for (let i = 0; i < 90 && !y; i++) { const prima = H.ball.y; window.__salta(1); if (H.ball.holder === m || H.ball.state !== 'flight') y = prima; }
    window.__salta(2); esito = H.cronaca.registro.slice(reg).map(e => e.testo).join(',');
    return { y, esito, tiene: H.ball.holder === m }; };
  const marcato = arrivo('dietro'), libero = arrivo('libero');
  let falli = 0; const prove = 20; for (let k = 0; k < prove; k++) { const r = arrivo('anticipo'); if (/Rigore|Espulsione/.test(r.esito)) falli++; }
  return { marcato, libero, falli, prove };
});
prova(boa.marcato.y != null && boa.marcato.y < 0.45, `al centroboa marcato la palla arriva bassa, in acqua davanti a lui (${boa.marcato.y?.toFixed(2)} m)`);
prova(boa.libero.y != null && boa.libero.y > 0.7, `al centroboa libero arriva alta, in mano (${boa.libero.y?.toFixed(2)} m)`);
prova(boa.falli === 0, `anticipo battuto senza fallo: nessuna sanzione automatica (${boa.falli}/${boa.prove})`);
prova(errori.length === 0, `nessun errore nella pagina${errori.length ? ': ' + errori.join(' | ') : ''}`);
console.log(ok ? '\nFinta e tiro al volo: tutte le prove superate' : '\nFinta e tiro al volo: prove NON superate');
await browser.close(); server.httpServer.close(); process.exit(ok ? 0 : 1);
