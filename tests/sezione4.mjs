// Prove della sezione 4 (v0.31): mano dal file dei mancini, icona della mano, gesti specchiati, mancini a destra,
// tiro a schizzo e colonnello in controfuga con il tasto a comparsa.
// Uso: node tests/sezione4.mjs [--no-build] [--foto]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4334, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 852, height: 393 }, hasTouch: true });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 17; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = window.__dis; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };

// ---------- mano dal file: nessun mancino a caso ----------
const mani = await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); return H.teams.flatMap(t => t.rosa.map(g => ({ m: g.mano, db: g.manoNota ? null : g.mano }))); });
prova(mani.every(x => x.db === null ? x.m === 'D' : x.m === x.db), `mano dal database (${mani.filter(x => x.m === 'S').length} mancini su ${mani.length}; sconosciuta = destra)`);

// ---------- un mancino titolare a sinistra va a destra; icona nella rosa ----------
const lin = await pg.evaluate(() => {
  const H = window.__pallanuoto, R = H.teams[0].rosa; R[3].mano = 'S'; R[2].mano = 'D';      // l'ala sinistra diventa mancina
  H.scegliSquadre('ITA', 'HUN');
  return { ala: H.teams[0].players[2].num, mano: H.teams[0].players[2].mano, altro: H.teams[0].players[3].num, atteso: R[3].num, attesoAltro: R[2].num };
});
prova(lin.ala === lin.atteso && lin.mano === 'S' && lin.altro === lin.attesoAltro, `mancino all'ala sinistra spostato all'ala destra (al posto 2 c'è il n. ${lin.ala}, al posto 3 il n. ${lin.altro})`);

await pg.evaluate(() => { const H = window.__pallanuoto; H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(400); });

// ---------- pannello del giocatore con l'icona ----------
const pannello = await pg.evaluate(() => {
  const H = window.__pallanuoto, p = H.teams[0].players[2]; H.regole.giveBall(p); H.__setCtrl(p); window.__salta(2);
  return { icona: !!document.querySelector('#pname svg.manc'), testo: document.getElementById('pname').textContent };
});
prova(pannello.icona, `pannello del giocatore: icona della mano accanto al mancino (${pannello.testo.trim()})`);

// ---------- gesti specchiati: la palla sta e parte dalla mano sinistra ----------
const lato = await pg.evaluate(() => {
  const H = window.__pallanuoto, B = H.ball, out = {};
  for (const mano of ['D', 'S']) {
    const p = H.teams[1].players[4]; p.mano = mano; H.regole.giveBall(p); H.game.state = 'play'; H.game.after = null;
    const misura = () => { const w = p.ballW; return w ? (w[0] - p.x) * (-p.fz) + (w[2] - p.z) * p.fx : NaN; };
    for (let i = 0; i < 40; i++) { p.decideT = 99; p.vx = p.vz = 0; p.oriz = 0; if (B.holder !== p) H.regole.giveBall(p); window.__salta(1); }
    out[mano] = { ferma: misura() };
    p.act = { kind: 'shot', t: 0, wind: 99, frusta: 0.17, done: false, fn: () => {} };
    for (let i = 0; i < 30; i++) { p.act.t = Math.min(p.act.t, 0.3); window.__salta(1); }
    out[mano].carica = misura(); p.act = null;
  }
  return out;
});
prova(lato.D.ferma > 0 && lato.S.ferma < 0, `palla in mano: destro a destra (${lato.D.ferma.toFixed(2)} m), mancino a sinistra (${lato.S.ferma.toFixed(2)} m)`);
prova(lato.D.carica > 0 && lato.S.carica < 0, `caricando il tiro: destro ${lato.D.carica.toFixed(2)} m, mancino ${lato.S.carica.toFixed(2)} m (gesto specchiato)`);

// ---------- controfuga: tasto a comparsa ----------
const controfuga = async (dGol, premi, difensoreDavanti) => pg.evaluate(({ dGol, premi, difensoreDavanti }) => {
  const H = window.__pallanuoto, B = H.ball, T = H.teams[0], O = H.teams[1], p = T.players[4], gx = 12.5 * T.dir;
  p.mano = 'D'; H.game.state = 'play'; H.game.after = null; for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.pressatoUntil = 0; q.qte = null; q.qteDopo = 0; }
  H.regole.giveBall(p); H.__setCtrl(p);
  const metti = () => {
    p.x = gx - T.dir * dGol; p.z = 0.5; p.fx = T.dir; p.fz = 0; p.vx = T.dir * 1.5; p.vz = 0; p.oriz = 1;
    for (const q of O.players) { if (q.isGK) continue; q.x = p.x - T.dir * (3 + q.i); q.z = q.i - 3.5; q.vx = q.vz = 0; }
    if (difensoreDavanti) { const d = O.players[3]; d.x = p.x + T.dir * 1.5; d.z = p.z; }
  };
  const r = { comparso: false, pill: false, premi: false, tipo: null, gesto: null, quotaPalla: null, sparito: false };
  for (let i = 0; i < 20; i++) { metti(); if (B.holder !== p) H.regole.giveBall(p); window.__salta(1); }
  r.comparso = !!p.qte; r.tipo = p.qte && p.qte.tipo;
  r.pill = document.getElementById('qte').classList.contains('on');
  const b = document.querySelector('.tb[data-b="shoot"]'); r.premi = b.classList.contains('premi') && /Premi/.test(b.textContent);
  if (premi && p.qte) {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' })); window.__salta(1);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyK' }));
    r.gesto = p.act && p.act.kind;
    for (let i = 0; i < 30 && B.state === 'held'; i++) { metti(); window.__salta(1); }
    r.quotaPalla = B.state === 'flight' ? B.y : null; r.volo = B.state;
  } else if (p.qte) {
    for (let i = 0; i < 110; i++) { metti(); if (B.holder !== p) H.regole.giveBall(p); window.__salta(1); }
    r.sparito = !p.qte && !document.getElementById('qte').classList.contains('on');
  }
  return r;
}, { dGol, premi, difensoreDavanti });
const lontano = await controfuga(7, true, false);
prova(lontano.comparso && lontano.tipo === 'schizzo', `controfuga a 7 m senza difensori davanti: compare il tasto (${lontano.tipo})`);
prova(lontano.premi, 'sul telefono il pulsante TIRO si illumina con «Premi!»');
prova(lontano.gesto === 'schizzo' && lontano.quotaPalla !== null && lontano.quotaPalla < 0.45, `premendo TIRO parte lo schizzo: gesto ${lontano.gesto}, palla in volo a ${lontano.quotaPalla == null ? '-' : lontano.quotaPalla.toFixed(2)} m dall'acqua`);
const vicino = await controfuga(4.2, true, false);
prova(vicino.tipo === 'colonnello' && vicino.gesto === 'colonnello', `controfuga a 4 m: colonnello (${vicino.tipo}, gesto ${vicino.gesto})`);
const attesa = await controfuga(7, false, false);
prova(attesa.sparito, 'senza premere il tasto sparisce dopo un attimo');
const marcato = await controfuga(7, false, true);
prova(!marcato.comparso, `con un difensore davanti nessun tasto (${marcato.comparso ? 'comparso' : 'niente'})`);

// ---------- il computer li usa ----------
const ai = await pg.evaluate(() => {
  const H = window.__pallanuoto; H.game.autoplay = true; for (const t of H.teams) t.human = false;
  const conta = { schizzo: 0, colonnello: 0 }, visti = new Set();
  for (let k = 0; k < 3000; k++) { window.__salta(10); for (const p of H.allPlayers) if (p.act && (p.act.kind === 'schizzo' || p.act.kind === 'colonnello') && !visti.has(p.act)) { visti.add(p.act); conta[p.act.kind]++; } }
  return conta;
});
prova(ai.schizzo + ai.colonnello > 0, `il computer in controfuga: ${ai.schizzo} schizzi e ${ai.colonnello} colonnelli in 500 s di gioco`);

if (process.argv.includes('--foto')) {
  // primi piani: mancino che carica il tiro e schizzo, visti di lato
  const scatti = [];
  for (const caso of ['destro', 'mancino', 'schizzo', 'colonnello']) {
    await pg.evaluate(caso => {
      const H = window.__pallanuoto, B = H.ball, p = H.teams[0].players[4], T = H.teams[0], gx = 12.5 * T.dir;
      H.game.autoplay = true; T.human = false; H.game.state = 'play'; H.game.after = null;
      p.mano = caso === 'mancino' ? 'S' : 'D'; H.regole.giveBall(p);
      const spec = caso === 'schizzo' || caso === 'colonnello';
      for (let i = 0; i < 60; i++) {
        p.x = gx - T.dir * 7; p.z = 2; p.fx = T.dir; p.fz = 0; p.vx = spec ? T.dir * 1.4 : 0; p.vz = 0; p.decideT = 99; if (spec) p.oriz = 1;
        if (B.holder !== p) H.regole.giveBall(p);
        p.act = i < 20 ? null : (p.act || { kind: spec ? caso : 'shot', t: 0, wind: spec ? 0.05 : 99, frusta: 0.17, done: false, fn: () => {} });
        if (p.act) p.act.t = Math.min(p.act.t, spec ? 0.12 : 0.3);
        window.__salta(1);
      }
      H.vista = { pos: [p.x, 1.3, p.z + 3.2], look: [p.x, 0.3, p.z], fov: 45 };
      window.__salta(1); H.__ridisegna(); H.vista = null;
    }, caso);
    scatti.push((await pg.locator('canvas').first().screenshot()).toString('base64'));
  }
  const nomi = ['Destro: carica il tiro con la destra', 'Mancino: stesso gesto allo specchio', 'Schizzo: mano debole sotto la palla, schiaffo della forte', 'Colonnello: palla dall\'acqua alla spalla e spinta avanti'];
  const pf = await browser.newPage({ viewport: { width: 1400, height: 760 } });
  await pf.setContent(`<body style="margin:0;background:#111;color:#fff;font:600 18px system-ui;display:grid;grid-template-columns:1fr 1fr;gap:6px">${scatti.map((f, i) => `<div><div style="padding:6px">${nomi[i]}</div><img style="width:100%" src="data:image/png;base64,${f}"></div>`).join('')}</body>`);
  await pf.screenshot({ path: path.join(ROOT, 'docs/immagini/mano-e-controfuga.png'), fullPage: true });
}
if (errori.length) prova(false, 'errori: ' + errori.slice(0, 2).join(' | '));
await browser.close(); await new Promise(res => server.httpServer.close(res));
console.log(ok ? '\nSezione 4: tutte le prove superate' : '\nSezione 4: prove NON superate');
process.exit(ok ? 0 : 1);
