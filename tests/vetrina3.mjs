// Sequenze e screenshot delle correzioni della v0.18. Uso: node tests/vetrina3.mjs [cartella] [--no-build] [--dist=build già fatta] [--solo=rientro,curva,...]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'tests/screenshot/vetrina');
const DIST = arg('dist', ''), SOLO = arg('solo', '').split(',').filter(Boolean), fare = k => !SOLO.length || SOLO.includes(k);
fs.mkdirSync(USCITA, { recursive: true });
if (!DIST && !process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: DIST ? { outDir: DIST } : {}, preview: { port: +arg('porta', 4174), host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const TELEFONO = { orizzontale: { width: 844, height: 390 }, verticale: { width: 390, height: 844 } };
const init = () => {
  let a = 21; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  performance.now = () => 0; window.__frame = 0;
  window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } R.render = window.__dis; };
  window.__vai = n => { window.__salta(n - 1); window.__frame++; window.__raf(window.__frame * 1000 / 60); };
  window.__tasti = t => { window.__premuti = window.__premuti || []; for (const k of window.__premuti) if (!t.includes(k)) window.dispatchEvent(new KeyboardEvent('keyup', { code: k })); for (const k of t) if (!window.__premuti.includes(k)) window.dispatchEvent(new KeyboardEvent('keydown', { code: k })); window.__premuti = t; };
};
async function apri(viewport, telefono) {
  const ctx = await browser.newContext(telefono ? { viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport, deviceScaleFactor: 1 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('errore nella pagina:', e.message));
  await pg.addInitScript(init); await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
  return pg;
}
const NASCONDI = '#hud,#tac,#player,#msg,#excl,#fight,#touch,#fps{display:none!important}';
async function foglio(nome, file, titoli, colonne, larg) {
  const p2 = await browser.newPage({ viewport: { width: 1800, height: 900 } });
  await p2.setContent(`<body style="margin:0;background:#111"><div id="c" style="display:grid;grid-template-columns:repeat(${colonne},${larg}px);gap:3px;padding:3px;width:max-content">${file.map((f, i) => `<div style="position:relative"><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}" style="display:block;width:${larg}px"><b style="position:absolute;left:6px;top:4px;color:#fff;font:700 14px system-ui;text-shadow:0 1px 3px #000">${titoli[i]}</b></div>`).join('')}</div></body>`);
  await p2.waitForFunction('[...document.images].every(i => i.complete)', null, { polling: 100 });
  await p2.locator('#c').screenshot({ path: path.join(USCITA, nome + '.png') }); await p2.close();
  for (const f of file) fs.unlinkSync(f);
}

// ---------- 1. rientro difensivo: sprint iniziale perso, vista dall'alto, 6 immagini ----------
if (fare('rientro')) {
  const pg = await apri({ width: 900, height: 470 }, false);
  await pg.addStyleTag({ content: NASCONDI });
  const chi = await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'USA'); H.game.autoplay = true; for (const t of H.teams) t.human = false;
    document.getElementById('goBtn').click(); for (let i = 0; i < 3000 && !(H.game.state === 'play' && H.ball.holder); i++) window.__salta(1);
    return H.ball.holder.team.short; });
  const file = [], titoli = [];
  for (const [k, s] of [0.3, 1.8, 3.3, 4.8, 6.3, 8].entries()) {
    const r = await pg.evaluate(({ n }) => { const H = window.__pallanuoto; if (n > 1) window.__salta(n - 1);
      H.vista = { pos: [0, 31, 0.01], look: [0, 0, 0], fov: 44 }; window.__vai(1); H.vista = null;
      const h = H.ball.holder, T = H.teams.find(t => t !== H.game.possTeam), ogx = -12.5 * T.dir, bd = Math.abs(H.ball.x - ogx);
      return { dietro: T.players.filter(q => !q.isGK && !q.excluded && Math.abs(q.x - ogx) > bd + 0.3).length, palla: bd.toFixed(1), h: h ? h.team.short : '-' }; }, { n: Math.round((s - (k ? [0.3, 1.8, 3.3, 4.8, 6.3, 8][k - 1] : 0)) * 60) });
    const f = path.join(USCITA, `_r${k}.png`); await pg.screenshot({ path: f }); file.push(f);
    titoli.push(`${s.toFixed(1)} s dopo la palla presa · palla a ${r.palla} m dalla porta · difensori superati: ${r.dietro}`);
    console.log('rientro', titoli[k]);
  }
  await foglio('rientro-sprint-perso', file, titoli, 3, 560);
  console.log('rientro: palla presa da', chi);
  await pg.context().close();
}
await browser.close(); await new Promise(r => server.httpServer.close(r));
