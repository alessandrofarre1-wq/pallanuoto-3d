// Prove della sezione 4 (v0.31): mano dal file dei mancini, icona della mano, gesti specchiati, mancini a destra,
// tiro a schizzo e colonnello in controfuga (dalla v0.88 senza tasto a comparsa: dentro l'area il tocco di TIRO li sceglie da solo
// secondo energia e Precisione, controfuga.js).
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
  let a = 17; window.__rnd = () => { if(typeof window.__casoAI==='number') return window.__casoAI; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
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
    for (let i = 0; i < 40; i++) { p.decideT = 99; p.reazioneT = 99; p.vx = p.vz = 0; p.oriz = 0; if (B.holder !== p) H.regole.giveBall(p); window.__salta(1); }
    out[mano] = { ferma: misura() };
    p.act = { kind: 'shot', t: 0, wind: 99, frusta: 0.17, done: false, fn: () => {} };
    for (let i = 0; i < 30; i++) { p.act.t = Math.min(p.act.t, 0.3); window.__salta(1); }
    out[mano].carica = misura(); p.act = null;
  }
  return out;
});
prova(lato.D.ferma > 0 && lato.S.ferma < 0, `palla in mano: destro a destra (${lato.D.ferma.toFixed(2)} m), mancino a sinistra (${lato.S.ferma.toFixed(2)} m)`);
prova(lato.D.carica > 0 && lato.S.carica < 0, `caricando il tiro: destro ${lato.D.carica.toFixed(2)} m, mancino ${lato.S.carica.toFixed(2)} m (gesto specchiato)`);

// ---------- controfuga (v0.88): dentro l'area il tocco di TIRO sceglie schizzo o colonnello, senza tasto a comparsa ----------
const controfuga = async (dGol, o = {}) => pg.evaluate(({ dGol, o }) => {
  const H = window.__pallanuoto, B = H.ball, T = H.teams[0], O = H.teams[1], p = T.players[4], gx = 12.5 * T.dir;
  p.mano = 'D'; H.game.state = 'play'; H.game.after = null; for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.pressatoUntil = 0; q.qte = null; q.qteDopo = 0; }
  p.s = { ...p.s, pre: o.pre ?? 85 }; p.effettoTiro = null;      // la scritta del tiro appena fatto nella scena prima resta 0,65 s
  H.regole.giveBall(p); H.__setCtrl(p);
  H.game.possT = H.game.time - (o.vecchio ? 15 : 0);      // v0.81: palla appena recuperata (controfuga) o attacco schierato
  const gk = O.players.find(q => q.isGK);
  const metti = () => {
    p.x = gx - T.dir * dGol; p.z = 0.5; p.fx = T.dir; p.fz = 0; p.vx = T.dir * 1.5; p.vz = 0; p.oriz = 1; p.stamina = o.energia ?? 1;
    for (const q of O.players) { if (q.isGK) continue; q.x = p.x - T.dir * (3 + q.i); q.z = q.i - 3.5; q.vx = q.vz = 0; }
    if (o.difensore) { const d = O.players[3]; d.x = p.x + T.dir * 1.5; d.z = p.z; }
    gk.x = gx - T.dir * 0.7; gk.z = 0; gk.vx = gk.vz = 0;      // il portiere resta in porta (con il portiere fuori dai pali TIRO sceglie la palombella)
  };
  const r = { comparso: false, scritta: null, gesto: null, quotaPalla: null };
  for (let i = 0; i < 20; i++) { metti(); if (B.holder !== p) H.regole.giveBall(p); window.__salta(1); }
  r.comparso = !!p.qte || document.getElementById('qte').classList.contains('on');
  r.scritta = document.querySelector('.tb[data-b="shoot"] small')?.textContent;
  // un tocco (TIRO premuto per «tieni» fotogrammi e rilasciato); tenuto più a lungo, il tiro normale (v0.81)
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' }));
  for (let i = 0; i < (o.tieni ?? 1); i++) { metti(); window.__salta(1); }
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyK' })); metti(); window.__salta(1);
  r.gesto = p.act && p.act.kind;
  for (let i = 0; i < 30 && B.state === 'held'; i++) { metti(); window.__salta(1); }
  r.quotaPalla = B.state === 'flight' ? B.y : null;
  return r;
}, { dGol, o });
const fresco = await controfuga(5);
prova(!fresco.comparso && fresco.scritta === 'tocco: colonnello' && fresco.gesto === 'colonnello',
  `controfuga a 5 m, fresco e preciso: nessun tasto a comparsa, TIRO dice «${fresco.scritta}» e il tocco fa il colonnello (${fresco.gesto})`);
const medio = await controfuga(5, { energia: 0.45 });
prova(medio.scritta === 'tocco: schizzo' && medio.gesto === 'schizzo' && medio.quotaPalla !== null && medio.quotaPalla < 0.45,
  `un po' stanco: TIRO dice «${medio.scritta}» e il tocco fa lo schizzo (${medio.gesto}), palla in volo a ${medio.quotaPalla == null ? '-' : medio.quotaPalla.toFixed(2)} m dall'acqua`);
const tenuto = await controfuga(5, { tieni: 36 });
prova(tenuto.gesto && tenuto.gesto !== 'schizzo' && tenuto.gesto !== 'colonnello', `v0.81: tenendo premuto TIRO per 0,6 s nella stessa controfuga parte il tiro normale (${tenuto.gesto || 'nessun tiro'})`);
const lontano = await controfuga(7);
prova(lontano.scritta === 'tocco: polso' && lontano.gesto !== 'schizzo' && lontano.gesto !== 'colonnello', `v0.88: fuori dall'area (7 m) niente speciali, il tocco è il polso (${lontano.gesto})`);
const stanco = await controfuga(5, { energia: 0.2 }), scarso = await controfuga(5, { pre: 60 });
prova(![stanco.gesto, scarso.gesto].some(g => g === 'schizzo' || g === 'colonnello'), `troppo stanco o con poca Precisione: niente speciali (${stanco.gesto}, ${scarso.gesto})`);
const marcato = await controfuga(5, { difensore: true });
prova(marcato.gesto !== 'schizzo' && marcato.gesto !== 'colonnello', `con un difensore davanti niente speciali (${marcato.gesto})`);
const schierato = await controfuga(5, { vecchio: true });
prova(schierato.gesto !== 'schizzo' && schierato.gesto !== 'colonnello', `v0.81: nell'attacco schierato (palla presa 15 s prima) niente speciali, solo nella controfuga vera (${schierato.gesto})`);

// ---------- il computer li usa anche quando decide di tirare subito ----------
// Una partita libera non garantisce una controfuga eleggibile in 500 secondi.
// Qui si usa la vera decisione del portatore: la stessa ricezione libera, in
// nuotata, con e senza i vincoli che consentono schizzo e colonnello.
const ai = await pg.evaluate(() => {
  const H=window.__pallanuoto, T=H.teams[1], O=H.teams[0], p=T.players[4], gx=12.5*T.dir;
  H.game.autoplay=true; for(const t of H.teams) t.human=false;
  const esegui=(d,vincolo,caso=.2,energia=1)=>{
    Object.assign(H.game,{state:'play',time:100,after:null,penalty:null,rigoriFinali:null,shot:28,possTeam:T,possT:99});
    H.fight.active=false;
    for(const q of H.allPlayers) Object.assign(q,{act:null,excluded:false,stunUntil:0,pressatoUntil:0,turnedUntil:0,freeThrow:false,cut:null,qte:null,qteDopo:0,appoggio:null,vx:0,vz:0,stamina:1});
    p.x=gx-T.dir*d;p.z=0.1;p.fx=T.dir;p.fz=0;p.oriz=1;p.vx=T.dir*1.5;p.stamina=energia;p.s={...p.s,pre:85};
    for(const q of O.players){q.x=q.isGK?gx:p.x-T.dir*(3+q.i);q.z=q.isGK?0:q.i-3.5;}
    for(const q of T.players) if(q!==p){q.x=p.x-T.dir*(4+q.i);q.z=q.i-3.5;}
    H.regole.giveBall(p);H.ball.holdTime=.3;
    Object.assign(p,{ricevutoPassaggio:true,ricevutoT:99.8,decideT:99,reazioneT:0});
    if(vincolo==='difensore'){O.players[3].x=p.x+T.dir*1.5;O.players[3].z=p.z;}
    if(vincolo==='libero') p.freeThrow=true;
    if(vincolo==='pressione') p.pressatoUntil=101;
    if(vincolo==='vecchio') H.game.possT=85;      // v0.81: attacco schierato, palla presa 15 s prima
    // .2 non attiva l'evento raro per fotogramma: prova la scelta al momento
    // della decisione rapida, senza aspettare né congelare quel percorso AI.
    window.__casoAI=caso;
    H.prova.aiCarrier(p,1/60);
    delete window.__casoAI;
    return p.act?.kind||null;
  };
  // v0.88: speciali solo dentro l'area (6 m), il colonnello con energia almeno 0,6, lo schizzo almeno 0,35 (SPECIALI)
  // (nei primi 18 s di un'azione in parità il tiro subito dopo la ricezione si cerca solo entro COSTRUZIONE.vicino, 4,5 m: la scena
  // apre un'azione in parità, quindi i due speciali si provano a 4,2 m)
  return {schizzo:esegui(4.2,null,.2,.45),colonnello:esegui(4.2),classico:esegui(4.2,null,.8),lontano:esegui(6.8),
    marcato:esegui(4.2,'difensore'),libero:esegui(4.2,'libero'),pressione:esegui(4.2,'pressione'),vecchio:esegui(6.2,'vecchio')};
});
prova(ai.schizzo==='schizzo',`AI su ricezione libera a 4,2 m in nuotata, un po' stanco: ${ai.schizzo}`);
prova(ai.colonnello==='colonnello',`AI su ricezione libera a 4,2 m in nuotata: ${ai.colonnello}`);
prova(ai.classico==='shot',`AI: il tiro classico resta disponibile nella stessa controfuga (${ai.classico})`);
for(const [caso,tipo] of Object.entries({lontano:ai.lontano,marcato:ai.marcato,libero:ai.libero,pressione:ai.pressione,vecchio:ai.vecchio}))
  prova(tipo!=='schizzo'&&tipo!=='colonnello',`AI: nessuno speciale con vincolo ${caso} (${tipo||'nessun tiro'})`);

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
        p.x = gx - T.dir * 7; p.z = 2; p.fx = T.dir; p.fz = 0; p.vx = spec ? T.dir * 1.4 : 0; p.vz = 0; p.decideT = 99; p.reazioneT = 99; if (spec) p.oriz = 1;
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
