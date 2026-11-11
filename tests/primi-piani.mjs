// Primi piani dei giocatori (fermo, nuoto, dorso, tiro, portiere) e sequenze di una partenza e di una frenata,
// per controllare a occhio i movimenti. Uso: node tests/primi-piani.mjs [cartella di uscita] [--no-build]
// Come funziona: la partita è ripetibile (caso e orologio fissi). Un primo giro senza disegnare cerca i fotogrammi
// interessanti; un secondo giro identico si ferma su quelli e li fotografa da vicino.
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'tests/screenshot/primi-piani');
fs.mkdirSync(USCITA, { recursive: true });
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4178, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

async function apri() {
  const pg = await browser.newPage({ viewport: { width: 760, height: 520 }, deviceScaleFactor: 1 });
  pg.on('pageerror', e => console.log('errore nella pagina:', e.message));
  await pg.addInitScript(() => {
    let a = 7; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    performance.now = () => 0; window.__frame = 0;
    window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
    window.__step = n => { for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } };
  });
  await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
  await pg.addStyleTag({ content: '#hud,#tac,#player,#msg,#excl,#fight,#touch,#fps{display:none!important}' });
  await pg.evaluate(() => { const H = window.__pallanuoto; H.disegna = H.renderer.render; H.renderer.render = () => {}; document.getElementById('goBtn').click(); });
  return pg;
}

// ---------- primo giro: cerca i momenti ----------
const pg1 = await apri();
const momenti = await pg1.evaluate(() => {
  const H = window.__pallanuoto, out = {}, storia = new Map();
  H.senzaCorpi = true;
  const v = p => Math.hypot(p.vx, p.vz);
  for (let i = 0; i < 60 * 300; i++) {
    window.__step(1); const f = window.__frame, B = H.ball, gioco = H.game.state === 'play';
    for (const p of H.allPlayers) {
      if (p.excluded) continue;
      const o = p.oriz || 0, tiene = B.holder === p, a = p.act;
      let s = storia.get(p); if (!s) storia.set(p, s = { fermoDa: -1, partenza: -1 });
      const nota = (nome, extra) => { if (!out[nome]) out[nome] = Object.assign({ f, uid: p.uid, chi: p.team.short + ' #' + p.num }, extra); };
      if (gioco && !p.isGK && o === 0 && v(p) < 0.15 && !(p.dorsoK > 0.05) && !tiene && !a && f > 240) nota('fermo');
      if (o === 1 && v(p) > 1.7 && !tiene) nota('nuoto');
      if (o === 1 && v(p) > 1.2 && tiene) nota('nuoto-con-palla');
      if (p.dorsoK > 0.97 && o === 0 && v(p) < 0.35) nota('dorso');
      if (a && a.kind === 'shot' && a.wind >= 0.1 && a.t > a.wind * 0.85 && a.t < a.wind + 0.03) nota('tiro');
      for (const k of ['sciarpa', 'beduina']) if (a && a.kind === k && a.t > a.wind + a.frusta * 0.55 && a.t < a.wind + a.frusta * 0.8) nota(k);
      if (a && a.kind === 'shot' && a.t > a.wind + a.frusta - 0.02 && a.t < a.wind + a.frusta) nota('rilascio');
      if (p.isGK && B.state === 'flight' && B.kind === 'shot' && B.shooter.team !== p.team && B.flightT > 0.22 && Math.abs(B.crossZ - p.z) > 0.5) nota('portiere');
      // partenza: aveva la palla da fermo e comincia a distendersi; vale se dopo mezzo secondo nuota ancora con la palla
      if (tiene && o === 0) s.fermoDa = f;
      // (si preferisce una partenza senza avversari addosso, che si vede meglio)
      if (tiene && o > 0 && s.fermoDa === f - 1) s.partenza = H.allPlayers.some(q => q.team !== p.team && !q.excluded && Math.hypot(q.x - p.x, q.z - p.z) < 1.9) && f < 60 * 150 ? -1 : f - 1;
      if (tiene && o === 1 && s.partenza > 0 && f - s.partenza < 40) { nota('partenza', { f: s.partenza }); s.partenza = -1; }
      // frenata: comincia un tiro mentre è ancora disteso
      if (a && a.kind !== 'pass' && a.kind !== 'colonnello' && a.t < 0.02 && o > 0.6) nota('frenata', { rilascio: f + Math.round((a.wind + (a.frusta || 0.09)) * 60) });
    }
    if (['fermo', 'nuoto', 'nuoto-con-palla', 'dorso', 'tiro', 'rilascio', 'beduina', 'sciarpa', 'portiere', 'partenza', 'frenata'].every(k => out[k])) break;
  }
  return out;
});
await pg1.close();
for (const k of ['fermo', 'nuoto', 'nuoto-con-palla', 'dorso', 'tiro', 'rilascio', 'beduina', 'sciarpa', 'portiere', 'partenza', 'frenata']) console.log(`${k}: ${momenti[k] ? momenti[k].chi + ' al fotogramma ' + momenti[k].f : 'NON TROVATO'}`);

// ---------- elenco degli scatti ----------
const scatti = [];   // { f, uid, nome, vista: 'tre-quarti' | 'lato', dir? }
for (const k of ['fermo', 'nuoto', 'nuoto-con-palla', 'dorso', 'tiro', 'rilascio', 'beduina', 'sciarpa', 'portiere']) if (momenti[k]) for (const vista of ['tre-quarti', 'lato']) scatti.push({ f: momenti[k].f + (vista === 'lato' ? 1 : 0), uid: momenti[k].uid, nome: `${k}-${vista}`, vista });
// volto e calottina da vicino (giocatore fermo e portiere), e la palla in mano al tiratore
for (const [k, d] of [['fermo', 2], ['portiere', -2], ['tiro', -1]]) if (momenti[k]) scatti.push({ f: momenti[k].f + d, uid: momenti[k].uid, nome: `volto-${k}`, vista: 'volto' });
if (momenti.partenza) [0, 7, 14, 21, 30, 42].forEach((d, i) => scatti.push({ f: momenti.partenza.f + d, uid: momenti.partenza.uid, nome: `partenza-${i + 1}`, vista: 'seq', seq: 'partenza' }));
if (momenti.frenata) { const m = momenti.frenata, r = m.rilascio; [m.f - 6, m.f + 6, m.f + 14, m.f + 22, r - 4, r + 5].forEach((f, i) => scatti.push({ f, uid: m.uid, nome: `frenata-${i + 1}`, vista: 'seq', seq: 'frenata' })); }
scatti.sort((a, b) => a.f - b.f);

// ---------- secondo giro: fotografa ----------
const pg = await apri(); const dirSeq = {};
// la palla da vicino, ferma a centro vasca prima del via (due distanze)
for (const [nome, d] of [['palla', 0.55], ['palla-da-gioco', 2.2]]) {
  await pg.evaluate(d => { const H = window.__pallanuoto, B = H.ball, R = H.renderer; H.vista = { pos: [B.x + d * 0.75, B.y + d * 0.6, B.z + d], look: [B.x, B.y, B.z], fov: 30 }; R.render = H.disegna; window.__step(1); R.render = () => {}; H.vista = null; }, d);
  await pg.screenshot({ path: path.join(USCITA, nome + '.png') });
}
for (const s of scatti) {
  const info = await pg.evaluate(({ s, dir }) => {
    const H = window.__pallanuoto; if (s.f - 1 > window.__frame) window.__step(s.f - 1 - window.__frame);
    const p = H.allPlayers.find(q => q.uid === s.uid);
    let v;
    if (s.vista === 'volto') { const a = p.mesh.spr.getWorldPosition(new p.mesh.spr.position.constructor()); v = { pos: [a.x + p.fx * 1.15 - p.fz * 0.5, a.y - 0.25, a.z + p.fz * 1.15 + p.fx * 0.5], look: [a.x, a.y - 0.45, a.z], fov: 30 }; }
    else if (s.vista === 'tre-quarti') v = { pos: [p.x + p.fx * 2.5 - p.fz * 2.3, 1.5, p.z + p.fz * 2.5 + p.fx * 2.3], look: [p.x, 0.05, p.z], fov: 30 };
    else {
      // di lato, dalla parte dove non ci sono altri giocatori davanti all'obiettivo
      const libero = d => Math.min(...H.allPlayers.filter(q => q !== p).map(q => Math.hypot(q.x - (p.x + d[0] * 2.4), q.z - (p.z + d[1] * 2.4))));
      const d = dir || [[-p.fz, p.fx], [p.fz, -p.fx]].sort((a, b) => libero(b) - libero(a))[0]; v = { pos: [p.x + d[0] * 3.9, 0.85, p.z + d[1] * 3.9], look: [p.x, -0.12, p.z], fov: 30, dir: d };
    }
    H.vista = v; const R = H.renderer; R.render = H.disegna; window.__step(1);
    R.render = () => {}; H.vista = null;
    return { dir: v.dir, oriz: +(p.oriz || 0).toFixed(2), act: p.act ? p.act.kind : '-' };
  }, { s, dir: s.seq ? dirSeq[s.seq] : null });
  if (s.seq && !dirSeq[s.seq]) dirSeq[s.seq] = info.dir;
  await pg.screenshot({ path: path.join(USCITA, s.nome + '.png') });
}
// galleria dei gesti di tiro, messi in scena su un giocatore a centro vasca: caricamento e momento prima del rilascio
const gesti = [];
{
  const pgG = await apri();
  await pgG.evaluate(() => window.__step(200));
  for (const [kind, fase, quando] of [['shot', 'caricamento', 0], ['shot', 'frustata', 0.72], ['polso', 'frustata', 0.6], ['torsione', 'caricamento', 0], ['torsione', 'frustata', 0.8], ['lob', 'frustata', 0.7], ['beduina', 'frustata', 0.72], ['sciarpa', 'frustata', 0.72], ['fake', 'frustata', 0.9]]) {
    await pgG.evaluate(({ kind, quando }) => {
      const H = window.__pallanuoto, p = H.teams[0].players[6], B = H.ball, R = H.renderer;
      for (const q of H.allPlayers) if (q !== p) { q.x = 9 * (q.team.idx ? 1 : -1); q.z = -8 + q.i * 0.9; q.vx = q.vz = 0; }
      p.x = 0; p.z = 0; p.vx = p.vz = 0; p.oriz = 0; p.stamina = 1; const dietro = kind === 'beduina' || kind === 'sciarpa';
      p.fx = dietro ? -1 : 1; p.fz = 0; B.state = 'held'; B.holder = p; H.game.state = 'play'; H.game.possTeam = p.team; H.game.shot = 28; H.game.clock = 100;
      p.act = { t: 0, kind, wind: 0.25, frusta: kind === 'polso' ? 0.11 : 0.17, fn: () => {}, aim: [dietro ? -12.5 : 12.5, 0], done: false };
      const fino = 0.25 + (kind === 'polso' ? 0.11 : 0.17) * quando;
      for (let i = 0; i < 40 && p.act && p.act.t < fino; i++) { p.x = 0; p.z = 0; window.__step(1); }
      H.vista = { pos: [(dietro ? -1 : 1) * 2.3, 1.15, 2.6], look: [0, 0.25, 0], fov: 30 }; R.render = H.disegna; p.act && (p.act.t -= 1 / 60); window.__step(1); R.render = () => {}; H.vista = null;
    }, { kind, quando });
    const nome = `gesto-${kind}-${fase}`; await pgG.screenshot({ path: path.join(USCITA, nome + '.png') }); gesti.push({ nome, seq: false, vista: 'gesto' });
  }
  await pgG.close();
}
// fogli riassuntivi: le due sequenze e i primi piani, tre immagini per riga
const fogli = { partenza: scatti.filter(s => s.seq === 'partenza'), frenata: scatti.filter(s => s.seq === 'frenata'),
  'primi-piani': scatti.filter(s => s.vista === 'tre-quarti'), volti: scatti.filter(s => s.vista === 'volto'), gesti, 'primi-piani-lato': scatti.filter(s => s.vista === 'lato') };
for (const [nome, lista] of Object.entries(fogli)) {
  if (!lista.length) continue;
  const p2 = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await p2.setContent(`<body style="margin:0;background:#111"><div id="c" style="display:grid;grid-template-columns:repeat(3,500px);gap:4px;padding:4px;width:max-content">${lista.map((s, i) => `<div style="position:relative"><img src="data:image/png;base64,${fs.readFileSync(path.join(USCITA, s.nome + '.png')).toString('base64')}" style="display:block;width:500px"><b style="position:absolute;left:8px;top:5px;color:#fff;font:700 17px system-ui;text-shadow:0 1px 3px #000">${s.seq ? i + 1 : s.nome.replace(/-(tre-quarti|lato)$/, '').replace(/^volto-/, '').replace(/^gesto-/, '').replace('shot', 'tiro classico').replace('lob', 'palombella').replace('fake', 'finta')}</b></div>`).join('')}</div></body>`);
  await p2.waitForFunction('[...document.images].every(i => i.complete)');
  await p2.locator('#c').screenshot({ path: path.join(USCITA, nome + '.png') });
  await p2.close();
}
await browser.close(); await new Promise(r => server.httpServer.close(r));
