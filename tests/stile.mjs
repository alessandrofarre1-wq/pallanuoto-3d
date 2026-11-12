// Grafica Realistica / Cartoon: 1) le partite simulate danno gli stessi risultati nei due stili; 2) screenshot affiancati su iPhone
// (orizzontale e verticale: un'azione d'attacco e un primo piano) con oggetti disegnati e triangoli; 3) cambio a partita in corso.
// Uso: node tests/stile.mjs [cartella di uscita] [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'tests/screenshot/vetrina');
fs.mkdirSync(USCITA, { recursive: true });
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4176, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const init = () => {
  let a = 33; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  performance.now = () => 0; window.__frame = 0;
  window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } R.render = window.__dis; };
  window.__vai = n => { window.__salta(n - 1); window.__frame++; window.__raf(window.__frame * 1000 / 60); };
};
async function apri(viewport, telefono) {
  const ctx = await browser.newContext(telefono ? { viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport, deviceScaleFactor: 1 });
  const pg = await ctx.newPage(); const errori = [];
  pg.on('pageerror', e => errori.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && /Error/.test(m.text()) && !/Failed to load/.test(m.text())) errori.push(m.text().split('\n')[0]); });
  await pg.addInitScript(init); await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
  pg.errori = errori; return pg;
}
let ok = true; const nota = (bene, testo) => { console.log(`${bene ? 'OK ' : 'NO '} ${testo}`); if (!bene) ok = false; };

// ---------- 1. stesse partite nei due stili (computer contro computer, disegnando ogni tanto come in una partita vera) ----------
const esiti = {};
for (const stile of ['realistica', 'cartoon']) {
  const pg = await apri({ width: 640, height: 360 }, false);
  esiti[stile] = await pg.evaluate(stile => { const H = window.__pallanuoto; H.stile.setStile(stile); H.scegliSquadre('ITA', 'USA'); H.game.autoplay = true; for (const t of H.teams) t.human = false;
    document.querySelector('[data-len="120"]').click(); document.getElementById('goBtn').click();
    for (let f = 0; f < 60 * 60 * 30 && H.game.state !== 'over'; f++) { if (f % 240 === 0) window.__vai(1); else window.__salta(1); }
    return JSON.stringify({ fine: H.game.state, st: H.statistiche }); }, stile);
  if (pg.errori.length) nota(false, `errori nello stile ${stile}: ${pg.errori.slice(0, 2).join(' | ')}`);
  await pg.context().close();
}
{ const r = JSON.parse(esiti.realistica); nota(esiti.realistica === esiti.cartoon && r.fine === 'over', `partita simulata identica nei due stili (${r.st.map(s => `${s.nome} ${s.gol}`).join(' - ')}, ${r.st[0].tiri + r.st[1].tiri} tiri)`); }

// ---------- 2. screenshot affiancati su iPhone ----------
const TELEFONO = { orizzontale: { width: 844, height: 390 }, verticale: { width: 390, height: 844 } };
const costi = {};
for (const vista of Object.keys(TELEFONO)) {
  const file = [], titoli = [];
  for (const stile of ['realistica', 'cartoon']) {
    const pg = await apri(TELEFONO[vista], true);
    const info = await pg.evaluate(stile => { const H = window.__pallanuoto; document.querySelector(`[data-stile="${stile}"]`).click(); document.getElementById('goBtn').click(); window.__salta(300);
      for (let i = 0; i < 9000; i++) { window.__salta(1); const h = H.ball.holder; if (h && H.game.state === 'play' && h.team === H.teams[1] && Math.abs(h.x + 12.5) < 7 && !H.allPlayers.some(p => p.excluded)) break; }
      window.__salta(40); document.getElementById('msg').style.opacity = 0; window.__vai(1);
      const r = H.renderer.info.render; return { oggetti: r.calls, triangoli: r.triangles }; }, stile);
    costi[`${vista} ${stile}`] = info;
    let f = path.join(USCITA, `_s-${vista}-${stile}-1.png`); await pg.screenshot({ path: f }); file.push(f); titoli.push(`${stile} · azione · ${info.oggetti} oggetti, ${Math.round(info.triangoli / 1000)} mila triangoli`);
    // primo piano di chi ha la palla
    await pg.addStyleTag({ content: '#hud,#tac,#player,#msg,#excl,#fight,#touch,#fps{display:none!important}' });
    await pg.evaluate(() => { const H = window.__pallanuoto, p = H.ball.holder || H.teams[0].players[6]; H.vista = { pos: [p.x + p.fx * 2.4 - p.fz * 1.6, 1.4, p.z + p.fz * 2.4 + p.fx * 1.6], look: [p.x, 0.15, p.z], fov: 30 }; window.__vai(1); H.vista = null; });
    f = path.join(USCITA, `_s-${vista}-${stile}-2.png`); await pg.screenshot({ path: f }); file.push(f); titoli.push(`${stile} · primo piano`);
    if (pg.errori.length) nota(false, `errori (${vista}, ${stile}): ${pg.errori.slice(0, 2).join(' | ')}`);
    await pg.context().close();
  }
  const larg = vista === 'verticale' ? 300 : 620, colonne = vista === 'verticale' ? 4 : 2;
  const ordine = vista === 'verticale' ? [0, 2, 1, 3] : [0, 2, 1, 3];      // affiancati: realistica | cartoon
  const p2 = await browser.newPage({ viewport: { width: 1800, height: 900 } });
  await p2.setContent(`<body style="margin:0;background:#111"><div id="c" style="display:grid;grid-template-columns:repeat(${colonne},${larg}px);gap:3px;padding:3px;width:max-content">${ordine.map(i => `<div style="position:relative"><img src="data:image/png;base64,${fs.readFileSync(file[i]).toString('base64')}" style="display:block;width:${larg}px"><b style="position:absolute;left:6px;bottom:4px;color:#fff;font:700 13px system-ui;text-shadow:0 1px 3px #000,0 0 5px #000">${titoli[i]}</b></div>`).join('')}</div></body>`);
  await p2.waitForFunction('[...document.images].every(i => i.complete)', null, { polling: 100 });
  await p2.locator('#c').screenshot({ path: path.join(USCITA, `stile-${vista}.png`) }); await p2.close();
  for (const f of file) fs.unlinkSync(f);
  const a = costi[`${vista} realistica`], b = costi[`${vista} cartoon`];
  nota(b.oggetti <= a.oggetti && b.triangoli < a.triangoli, `${vista}: cartoon ${b.oggetti} oggetti e ${Math.round(b.triangoli / 1000)} mila triangoli contro ${a.oggetti} e ${Math.round(a.triangoli / 1000)} mila della realistica`);
}

// ---------- 3. cambio a partita in corso dal menu di pausa, e scelta ricordata ----------
{
  const pg = await apri(TELEFONO.orizzontale, true);
  const r = await pg.evaluate(() => { const H = window.__pallanuoto; document.getElementById('goBtn').click(); window.__vai(400);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyP' }));
    const inPausa = H.game.state === 'paused', tasto = !!document.querySelector('#menu [data-stile="cartoon"]');
    document.querySelector('[data-stile="cartoon"]').click(); document.getElementById('goBtn').click(); window.__vai(30);
    return { inPausa, tasto, stile: H.stile.stileAttuale(), stato: H.game.state, salvato: localStorage.getItem('pallanuoto-stile') }; });
  nota(r.inPausa && r.tasto && r.stile === 'cartoon' && r.stato !== 'paused' && r.salvato === 'cartoon' && !pg.errori.length, `cambio in pausa a partita in corso: stile ${r.stile}, partita ripresa, scelta ricordata`);
  await pg.reload(); await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
  nota(await pg.evaluate(() => window.__pallanuoto.stile.stileAttuale() === 'cartoon' && document.querySelector('[data-stile="cartoon"]').classList.contains('on')), 'alla riapertura il gioco parte in Cartoon');
  await pg.context().close();
}
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nStile grafico: tutte le prove superate' : '\nStile grafico: PROVE FALLITE');
process.exit(ok ? 0 : 1);
