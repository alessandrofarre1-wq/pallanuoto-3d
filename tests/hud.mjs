// HUD in partita, su iPhone in orizzontale (piccolo, medio, grande): screenshot reali e misure.
// Stati: gioco normale, espulsione appena fischiata, espulsione in corso con il tempo che scende.
// Per ogni stato misura: quanta parte dello schermo e della zona centrale è coperta dall'interfaccia, quali elementi si
// sovrappongono tra loro, e se palla, giocatore controllato o porte finiscono sotto un elemento dell'interfaccia.
// Uso: node tests/hud.mjs [cartella di uscita] [--no-build] [--dist=build già fatta] [--porta=4185]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'tests/screenshot/hud');
const DIST = arg('dist', '');
fs.mkdirSync(USCITA, { recursive: true });
if (!DIST && !process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: DIST ? { outDir: DIST } : {}, preview: { port: +arg('porta', 4185), host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const TELEFONI = { 'iphone-se': { width: 667, height: 375 }, 'iphone-15': { width: 852, height: 393 }, 'iphone-pro-max': { width: 932, height: 430 } };
const init = () => {
  let a = 21; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  performance.now = () => 0; window.__frame = 0;
  window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } R.render = window.__dis; };
  window.__vai = n => { window.__salta(n - 1); window.__frame++; window.__raf(window.__frame * 1000 / 60); };
  // misure dell'interfaccia: elementi visibili, copertura, sovrapposizioni, cose del gioco coperte
  window.__misura = () => {
    const H = window.__pallanuoto, W = innerWidth, Hh = innerHeight;
    const SEL = ['#hud', '#hud .esp > *', '#cronaca', '#tac', '#player', '#tLog', '#tPause', '.tb', '#joy', '#fight'];
    const el = [];
    for (const s of SEL) for (const e of document.querySelectorAll(s)) {
      const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) continue;
      if (e.id === 'cronaca' && !e.classList.contains('vis')) continue;
      const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > Hh) continue;
      el.push({ nome: e.id ? '#' + e.id : (e.dataset.b ? 'pulsante ' + e.dataset.b : s), r: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] });
    }
    const dentro = (x, y, r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
    let tot = 0, cop = 0, cTot = 0, cCop = 0;
    for (let y = 2; y < Hh; y += 4) for (let x = 2; x < W; x += 4) {
      const c = el.some(e => dentro(x, y, e.r)), centro = x > W * 0.25 && x < W * 0.75 && y > Hh * 0.25 && y < Hh * 0.8;
      tot++; if (c) cop++; if (centro) { cTot++; if (c) cCop++; } }
    const sovrapposti = [];
    for (let i = 0; i < el.length; i++) for (let j = i + 1; j < el.length; j++) { const a = el[i].r, b = el[j].r;
      if (a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3] && !(el[i].nome === '#hud' && el[j].nome.includes('esp'))) sovrapposti.push(el[i].nome + ' + ' + el[j].nome); }
    const pt = (x, y, z) => { const v = H.camera.position.clone().set(x, y, z).project(H.camera); return v.z > 1 ? null : [(v.x + 1) / 2 * W, (1 - v.y) / 2 * Hh]; };
    const cose = { palla: pt(H.ball.x, H.ball.y || 0.2, H.ball.z), 'giocatore controllato': H.ctrl ? pt(H.ctrl.x, 0.6, H.ctrl.z) : null, 'porta destra': pt(12.5, 0.5, 0), 'porta sinistra': pt(-12.5, 0.5, 0) };
    const coperte = Object.entries(cose).filter(([, q]) => q && q[0] > 0 && q[0] < W && q[1] > 0 && q[1] < Hh && el.some(e => dentro(q[0], q[1], e.r))).map(([k]) => k);
    return { elementi: el.length, copertura: Math.round(cop / tot * 100), centro: Math.round(cCop / cTot * 100), sovrapposti, coperte, lista: el };
  };
};
const report = {};
for (const [tel, vp] of Object.entries(TELEFONI)) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage(); const errori = [];
  pg.on('pageerror', e => errori.push(e.message));
  await pg.addInitScript(init); await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
  // partita vera, Italia comandata (senza tocchi: si muovono i compagni e gli avversari), a un istante fisso
  await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'USA'); document.querySelector('[data-len="300"]').click(); document.getElementById('goBtn').click(); window.__salta(520); window.__vai(1); });
  const stati = {};
  const scatta = async nome => { await pg.waitForTimeout(450); await pg.screenshot({ path: path.join(USCITA, `${tel}-${nome}.png`) }); stati[nome] = await pg.evaluate(() => window.__misura()); };
  await scatta('1-gioco-normale');
  // espulsione: il difensore più vicino a chi ha palla, fallo su di lui
  await pg.evaluate(() => { const H = window.__pallanuoto, B = H.ball, c = B.holder || H.teams[0].players[6], dif = c.team === H.teams[0] ? H.teams[1] : H.teams[0];
    const d = dif.players.filter(q => !q.isGK).sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z))[0];
    H.regole.exclude(d, c); window.__esp = d; window.__vai(8); });
  await scatta('2-espulsione-appena');
  // gioco che continua con l'espulso fuori (se la sua squadra riprende palla resta fuori lo stesso: qui conta l'indicatore)
  await pg.evaluate(() => { const H = window.__pallanuoto, e = window.__esp; for (let i = 0; i < 360; i++) { window.__salta(1); if (!e.excluded) { e.excluded = true; e.exclUntil = H.game.time + 12; } } window.__vai(1); });
  await scatta('3-espulsione-countdown');
  report[tel] = { vp, stati, errori };
  await ctx.close();
}
fs.writeFileSync(path.join(USCITA, 'misure.json'), JSON.stringify(report, null, 1));
for (const [tel, r] of Object.entries(report)) {
  console.log(`\n${tel} (${r.vp.width}×${r.vp.height})`);
  for (const [s, m] of Object.entries(r.stati)) console.log(`  ${s.padEnd(24)} interfaccia sul ${String(m.copertura).padStart(2)}% dello schermo, ${String(m.centro).padStart(2)}% della zona centrale · ${m.elementi} elementi`
    + (m.coperte.length ? ` · COPRE: ${m.coperte.join(', ')}` : '') + (m.sovrapposti.length ? ` · sovrapposti: ${m.sovrapposti.join('; ')}` : ''));
  if (r.errori.length) console.log('  errori:', r.errori.slice(0, 2).join(' | '));
}
await browser.close(); await new Promise(r => server.httpServer.close(r));
