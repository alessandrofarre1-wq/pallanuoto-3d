// Prove della sezione 5 (v0.32): panchina, stamina delle riserve, schermata Panchina in pausa, cambi volanti con il cinque,
// cambi a gioco fermo, cambi del computer.
// Uso: node tests/sezione5.mjs [--no-build] [--foto]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4338, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 852, height: 393 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 23; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = window.__dis; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(300); });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };

// ---------- rosa e recupero in panchina ----------
const rec = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.teams[0], ris = t.rosa.filter(g => !g.inAcqua);
  ris[0].stamina = 0.3; window.__salta(600);
  return { inAcqua: t.rosa.filter(g => g.inAcqua).length, riserve: ris.length, stamina: ris[0].stamina };
});
prova(rec.inAcqua === 7 && rec.riserve === 6, `rosa: ${rec.inAcqua} in acqua e ${rec.riserve} in panchina`);
prova(rec.stamina > 0.45, `in panchina si recupera: da 30% a ${Math.round(rec.stamina * 100)}% in 10 s`);

// ---------- schermata Panchina in pausa, suggerimento, cambio programmato ----------
const vista = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.teams[0], p = t.players[4];
  if (H.ball.holder && H.ball.holder.team === t) H.regole.giveBall(H.teams[1].players[6]);
  p.stamina = 0.2; window.__salta(1);
  H.pausa();
  window.__salta(2);
  document.getElementById('vaiPanchina').click();
  const box = document.getElementById('panchinaBox');
  const r = { righe: box.querySelectorAll('.pc-g').length, sugg: !!box.querySelector('.pc-cons'), testoSugg: (box.querySelector('.pc-cons') || {}).textContent || '', visibile: document.getElementById('vPanchina').classList.contains('on') };
  const b = box.querySelector('.pc-cons'); if (b) b.click();
  r.coda = (t.coda || []).map(x => `${x.esce.num}->${x.entra.num}`);
  r.esce = p.num;
  return r;
});
prova(vista.visibile && vista.righe === 13, `schermata Panchina dalla pausa: ${vista.righe} giocatori (7 in acqua, 6 riserve)`);
prova(vista.sugg, `suggerimento per chi è stanco: «${vista.testoSugg.trim()}»`);
prova(vista.coda.length === 1, `cambio programmato con un tocco: ${vista.coda.join(', ')}`);

// ---------- cambio volante: chi esce va alla zona, cinque, scambio, il gioco non si ferma ----------
const volante = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.teams[0], p = t.players[4], entra = t.coda[0].entra.num, esce = p.num;
  document.getElementById('riprendi').click(); H.game.cambiLiberi = false;
  const gkO = H.teams[1].players[0], ferma = () => { if (H.ball.holder !== gkO) H.regole.giveBall(gkO); H.ball.holdTime = 0; gkO.decideT = 99; gkO.act = null; };      // niente gol durante la prova
  for (let i = 0; i < 200; i++) { ferma(); window.__salta(1); }
  const r = { fermato: false, comparsaVista: false, cinque: false, fasi: [], tempo: 0 };
  for (let i = 0; i < 60 * 25 && (t.cambio || (t.coda && t.coda.length)); i++) {
    if (H.game.state !== 'play' && H.game.state !== 'stop') r.fermato = true;
    if (t.cambio) { if (!r.fasi.includes(t.cambio.fase)) r.fasi.push(t.cambio.fase); }
    if (p.cinqueUntil > H.game.time) r.cinque = true;
    ferma(); window.__salta(1); r.tempo = i / 60;
  }
  window.__salta(240);
  r.ora = p.num; r.entra = entra; r.esce = esce; r.vecchioInAcqua = t.rosa.find(g => g.num === esce).inAcqua; r.nuovoInAcqua = t.rosa.find(g => g.num === entra).inAcqua;
  r.statoFine = H.game.state;
  return r;
});
prova(volante.ora === volante.entra && !volante.vecchioInAcqua && volante.nuovoInAcqua, `cambio fatto: esce #${volante.esce}, entra #${volante.entra} (ora in campo #${volante.ora}) in ${volante.tempo.toFixed(1)} s`);
prova(volante.fasi.join(',').startsWith('esce') && volante.fasi.includes('cinque') && volante.cinque, `fasi del cambio: ${volante.fasi.join(' → ')} (con il cinque)`);
prova(!volante.fermato, 'il gioco non si è mai fermato per il cambio');

// ---------- a gioco fermo il cambio è immediato; falli personali seguono il giocatore ----------
const fermo = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.teams[0], p = t.players[5], esce = p.num; p.pf = 2;
  const g = t.rosa.find(x => !x.inAcqua && !x.fuori && x.ruolo !== 0);
  H.game.state = 'stop'; H.game.timer = 1; H.game.after = null; H.game.cambiLiberi = true;      // come dopo un gol
  t.coda = [{ esce: p, entra: g }]; window.__salta(2);
  const r = { ora: p.num, entra: g.num, pfNuovo: p.pf, pfVecchio: t.rosa.find(x => x.num === esce).pf };
  window.__salta(120); return r;
});
prova(fermo.ora === fermo.entra, `dopo un gol (o nel time-out) il cambio è immediato (in campo #${fermo.ora})`);
prova(fermo.pfVecchio === 2 && fermo.pfNuovo === 0, `i falli gravi restano a chi li ha fatti (uscito: ${fermo.pfVecchio}, entrato: ${fermo.pfNuovo})`);

// ---------- portiere solo con portiere ----------
const gk = await pg.evaluate(() => { const H = window.__pallanuoto, t = H.teams[0], g = t.rosa.find(x => !x.inAcqua && x.ruolo !== 0); return H.panchina.chiediCambio(t, t.players[0], g); });
prova(gk === false, 'il portiere non si cambia con un giocatore di movimento');

// ---------- il computer fa i suoi cambi ----------
const ai = await pg.evaluate(() => {
  const H = window.__pallanuoto; H.game.autoplay = true; for (const t of H.teams) t.human = false;
  const prima = H.cronaca.registro.filter(e => e.testo === 'Cambio').length;
  for (let k = 0; k < 360; k++) window.__salta(60);
  const cambi = H.cronaca.registro.filter(e => e.testo === 'Cambio').length - prima;
  const stam = H.allPlayers.filter(p => !p.isGK).map(p => p.stamina);
  return { cambi, minima: Math.min(...stam), media: stam.reduce((a, b) => a + b, 0) / stam.length };
});
prova(ai.cambi >= 2, `il computer cambia chi è stanco: ${ai.cambi} cambi in 6 minuti di gioco (stamina media in acqua ${Math.round(ai.media * 100)}%, minima ${Math.round(ai.minima * 100)}%)`);

// ---------- in partita: il pulsante CAMBI mostra il cambio consigliato e lo fa partire con un tocco ----------
const live = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.teams[0];
  H.game.autoplay = false; t.human = true; H.teams[1].human = false; H.game.state = 'play'; H.game.after = null; H.game.clock = 300; H.game.penalty = null; H.game.cambiLiberi = false;
  t.coda = []; t.cambio = null; H.__setCtrl(t.players[1]);
  for (const g of t.rosa) if (!g.inAcqua) g.stamina = 1;
  for (const p of t.players) p.stamina = 1;
  for (const g of t.rosa) { g.pf = 0; g.tiriP = 0; g.gol = 0; }
  for (const p of t.players) { if (p.scheda) { p.scheda.pf = 0; p.scheda.tiriP = 0; } p.pf = 0; }
  const gk = t.players[0], tieni = () => { if (H.ball.holder !== gk) H.regole.giveBall(gk); gk.decideT = 99; gk.act = null; H.ball.holdTime = 0; };
  for (let i = 0; i < 40; i++) { tieni(); window.__salta(1); }
  const b = document.getElementById('tCambi'), r = { vuoto: b.dataset.stato, testoVuoto: b.textContent.trim() };
  t.players[5].stamina = 0.2; for (let i = 0; i < 40; i++) { tieni(); window.__salta(1); }
  r.stato = b.dataset.stato; r.testo = b.textContent.trim().replace(/\s+/g, ' ');
  const prima = t.players.map(p => p.num).join(','), esce = t.players[5].num; b.click(); tieni(); window.__salta(2);
  r.partito = !!t.cambio || (t.coda || []).some(x => !x.attesa); r.esce = esce; r.dopo = b.dataset.stato; r.statoGioco = H.game.state;
  r.barra = !!document.getElementById('cambiBox');
  for (let i = 0; i < 60 * 20 && (t.cambio || (t.coda && t.coda.length)); i++) { tieni(); window.__salta(1); }
  r.fase = t.cambio && t.cambio.fase; r.pos = t.cambio && [t.cambio.esce.x, t.cambio.esce.z, t.cambio.esce.num, H.ball.holder && H.ball.holder.num, H.game.state, H.game.time, H.ctrl && H.ctrl.num, t.cambio.esce.uscendo]; r.coda = (t.coda||[]).length; r.inCorso = !!t.cambio; r.cambiato = t.players.map(p => p.num).join(',') !== prima; r.eraLui = t.players[5].num !== esce;
  return r;
});
prova(live.stato === "consiglio" && /stanco/.test(live.testo), `pulsante CAMBI: mostra il cambio consigliato per chi è stanco («${live.testo}»)`);
prova(live.partito && live.statoGioco === 'play' && live.cambiato && live.eraLui && !live.barra, `un tocco e il cambio volante parte subito, senza elenchi e senza fermare il gioco (stato ${live.dopo})`);

// ---------- cambi scelti in pausa: partono al primo momento utile ----------
const attesa = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.teams[0], O = H.teams[1], p = t.players[4];
  H.game.state = 'play'; H.game.after = null; H.game.cambiLiberi = false; t.coda = []; t.cambio = null;
  const g = t.rosa.find(x => !x.inAcqua && !x.fuori && x.ruolo !== 0); const esce = p.num;
  // l'avversario attacca vicino alla nostra porta e chi deve uscire è vicino alla palla: non è il momento
  const h = O.players[4], gx = -12.5 * t.dir;
  const tieni = () => { h.x = gx + t.dir * 5; h.z = 1; h.vx = h.vz = 0; if (H.ball.holder !== h) H.regole.giveBall(h); h.decideT = 99; h.act = null; H.ball.holdTime = 0; p.x = h.x + t.dir * 1.5; p.z = 1; };
  H.pausa(); H.panchina.chiediCambio(t, p, g); H.pausa();
  for (let i = 0; i < 120; i++) { tieni(); window.__salta(1); }
  const r = { aspetta: !t.cambio && (t.coda || []).length === 1 && p.num === esce };
  // l'azione si sposta: la palla passa a noi (momento utile)
  H.regole.giveBall(t.players[0]);
  let partito = false; for (let i = 0; i < 60 * 20 && p.num === esce; i++) { if (t.cambio) partito = true; const gk = t.players[0]; if (H.ball.holder !== gk) H.regole.giveBall(gk); gk.decideT = 99; H.ball.holdTime = 0; window.__salta(1); }
  r.partito = partito; r.fatto = p.num === g.num;
  return r;
});
prova(attesa.aspetta, 'cambio scelto in pausa: con la squadra in difesa vicino alla porta e il giocatore vicino alla palla aspetta');
prova(attesa.partito && attesa.fatto, 'appena è il momento utile (palla nostra, lui lontano dall\'azione) il cambio volante parte');

// ---------- formazione scelta nella schermata Squadre ----------
const form = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.teams[0];
  H.game.state = 'menu'; H.scegliSquadre('ITA', 'HUN');
  document.querySelector('[data-va="squadre"]') && document.querySelector('[data-va="squadre"]').click();
  const box = document.getElementById('rosaBox'); box.open = true;
  const prima = t.players[2].num;
  document.querySelector('#rosa [data-posto="2"]').click();
  const ris = [...document.querySelectorAll('#rosa [data-riserva]')].find(b => b.classList.contains('puo'));
  const scelto = +ris.dataset.riserva; ris.click();
  const dopo = t.players[2].num;
  H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(5);
  return { prima, scelto, dopo, inPartita: t.players[2].num, postiInAcqua: document.querySelectorAll('#rosa [data-posto]').length };
});
prova(form.postiInAcqua === 7, 'schermata Squadre: i 7 posti in acqua con la panchina sotto');
prova(form.dopo === form.scelto && form.inPartita === form.scelto, `formazione scelta: all'ala destra #${form.scelto} al posto di #${form.prima}, ed è lui a partire in acqua`);

if (process.argv.includes('--foto')) {
  const foto = await pg.evaluate(async () => {
    const H = window.__pallanuoto, t = H.teams[1], p = t.players[3];
    H.game.state = 'play'; H.game.after = null; H.game.clock = 300; H.game.penalty = null; t.cambio = null; t.coda = [];
    const g = t.rosa.find(x => !x.inAcqua && !x.fuori && x.ruolo !== 0);
    p.stamina = 0.3; t.coda = [{ esce: p, entra: g }];
    const log = [`entra ${g.num} esce ${p.num}`]; for (let i = 0; i < 60 * 25 && !(t.cambio && t.cambio.fase === 'cinque'); i++) { window.__salta(1); const f = (t.cambio ? t.cambio.fase : '-') + '/' + H.game.state; if (log[log.length - 1] !== f) log.push(f); }
    window.__salta(8);
    H.vista = { pos: [p.x - 1.2, 1.9, p.z + 3.6], look: [p.x, 0.35, p.z], fov: 45 };
    window.__salta(1); H.__ridisegna(); H.vista = null; return JSON.stringify({ log, fase: t.cambio && t.cambio.fase, p: [p.x.toFixed(1), p.z.toFixed(1), p.num], st: H.game.state, h: H.ball.holder === p });
  });
  if (!foto.includes('cinque')) console.log('foto del cinque non riuscita: ' + foto);
  await pg.locator('canvas').first().screenshot({ path: path.join(ROOT, 'docs/immagini/cambio-cinque.png') });
  await pg.evaluate(() => { const H = window.__pallanuoto; H.game.autoplay = false; H.teams[0].human = true; H.pausa(); window.__salta(2); H.teams[0].players[2].stamina = 0.25; document.getElementById('vaiPanchina').click(); });
  await pg.waitForTimeout(600);
  await pg.screenshot({ path: path.join(ROOT, 'docs/immagini/panchina.png'), fullPage: true });
}
if (errori.length) prova(false, 'errori: ' + errori.slice(0, 2).join(' | '));
await browser.close(); await new Promise(res => server.httpServer.close(res));
console.log(ok ? '\nSezione 5: tutte le prove superate' : '\nSezione 5: prove NON superate');
process.exit(ok ? 0 : 1);
