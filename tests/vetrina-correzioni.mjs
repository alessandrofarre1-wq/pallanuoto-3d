// Screenshot su iPhone (orizzontale e verticale) delle correzioni della v0.17: menu che parte dall'alto e scorre,
// uomo in più (4-2 contro la difesa a 3+2), contrasto riuscito, tempo per l'azione negli ultimi 5 secondi.
// Uso: node tests/vetrina-correzioni.mjs [cartella di uscita] [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'tests/screenshot/vetrina');
fs.mkdirSync(USCITA, { recursive: true });
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4173, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const VISTE = { orizzontale: { width: 844, height: 390 }, verticale: { width: 390, height: 844 } };
const init = () => {
  let a = 21; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  performance.now = () => 0; window.__frame = 0;
  window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } R.render = window.__dis; };
  window.__vai = n => { window.__salta(n - 1); window.__frame++; window.__raf(window.__frame * 1000 / 60); };
};
async function apri(vista) {
  const ctx = await browser.newContext({ viewport: VISTE[vista], deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('errore nella pagina:', e.message));
  await pg.addInitScript(init); await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
  return pg;
}
let ok = true;
for (const vista of Object.keys(VISTE)) {
  const scatta = (pg, nome) => pg.screenshot({ path: path.join(USCITA, `${nome}-${vista}.png`) });
  // ---- menu: la cima (titolo e scelta della squadra) si vede subito, e scorrendo si arriva in fondo ----
  let pg = await apri(vista);
  await pg.evaluate(() => { window.__pallanuoto.scegliSquadre('ITA', 'ESP'); window.__vai(2); });
  await scatta(pg, 'a-menu-in-alto');
  const m = await pg.evaluate(() => { const M = document.getElementById('menu'), r = id => document.getElementById(id).getBoundingClientRect();
    const cima = M.querySelector('h1').getBoundingClientRect().top, sq = r('sqA'); document.getElementById('ctrlBox').open = true; M.scrollTop = M.scrollHeight;
    return { cima, squadraVisibile: sq.top >= 0 && sq.bottom <= innerHeight, scorre: M.scrollTop > 0, fondo: r('ctrlBox').bottom <= innerHeight + 1, comandiChiusi: true }; });
  await scatta(pg, 'b-menu-in-fondo-comandi-aperti');
  const bene = m.cima >= 0 && m.squadraVisibile && m.scorre && m.fondo; if (!bene) ok = false;
  console.log(`${bene ? 'OK ' : 'NO '} menu ${vista}: titolo a ${Math.round(m.cima)} px dall'alto, scelta della squadra visibile: ${m.squadraVisibile}, scorre fino in fondo: ${m.scorre && m.fondo}`);
  // ---- uomo in più: l'Italia attacca, un difensore avversario viene espulso ----
  await pg.evaluate(() => { const H = window.__pallanuoto, M = document.getElementById('menu'); M.scrollTop = 0; document.getElementById('goBtn').click(); window.__salta(300);
    const A = H.teams[0], p = A.players[6]; for (let i = 0; i < 4000 && !(H.game.state === 'play' && H.ball.holder); i++) window.__salta(1);
    p.x = 5.5; p.z = 0.5; H.regole.giveBall(p); H.regole.exclude(H.teams[1].players[4]);
    for (let i = 0; i < 520; i++) { H.game.shot = 16; for (const q of H.teams[1].players) q.tackleCD = 9; window.__salta(1); }
    p.x = 12.5 - 2.1; p.z = -1.75; H.regole.giveBall(A.players[4]);      // palla a un giocatore dei 5 metri, il punto va al suo palo
    for (let i = 0; i < 50; i++) { H.game.shot = 12; for (const q of H.teams[1].players) q.tackleCD = 9; window.__salta(1); }
    document.getElementById('msg').style.opacity = 0; window.__vai(1); });
  await scatta(pg, 'c-uomo-in-piu');
  if (vista === 'orizzontale') { await pg.evaluate(() => { const H = window.__pallanuoto; H.vista = { pos: [7.2, 21, 0.01], look: [7.2, 0, 0], fov: 40 }; window.__vai(1); H.vista = null; }); await pg.screenshot({ path: path.join(USCITA, 'c-uomo-in-piu-dall-alto.png') }); }
  // ---- tempo per l'azione: ultimi 5 secondi ----
  await pg.evaluate(() => { const H = window.__pallanuoto; H.game.shot = 3.3; for (const q of H.teams[1].players) q.tackleCD = 9; window.__vai(8); });
  await scatta(pg, 'e-ultimi-secondi');
  await pg.context().close();
  // ---- contrasto riuscito: l'avversario nuota con la palla, il mio difensore arriva di lato e la ruba ----
  pg = await apri(vista);
  const esito = await pg.evaluate(() => { const H = window.__pallanuoto; document.getElementById('goBtn').click(); window.__salta(300);
    for (let i = 0; i < 4000 && !(H.game.state === 'play' && H.ball.holder); i++) window.__salta(1);
    const c = H.teams[1].players[5];
    for (let n = 1; n <= 60; n++) {
      const d = H.ctrl || H.teams[0].players[5];
      c.x = -3; c.z = 1.5; c.fx = -1; c.fz = 0; c.vx = -1.4; c.vz = 0; c.oriz = 1; c.act = null; c.charging = false; H.regole.giveBall(c);
      d.x = c.x - 0.3; d.z = c.z + 0.95; d.vx = d.vz = 0; d.tackleCD = 0; d.stunUntil = 0; H.game.state = 'play';
      const r = H.regole.tackle(d, c);
      if (r === 'rubata') { window.__vai(14); return { tentativi: n, chi: d.num }; }
      H.game.state = 'play'; H.game.after = null; for (const q of H.allPlayers) q.excluded = false; H.game.penalty = null;
    }
    return null; });
  console.log(esito ? `contrasto riuscito dopo ${esito.tentativi} tentativi (di lato, palla in palleggio)` : 'contrasto: mai riuscito in 60 tentativi');
  await scatta(pg, 'd-contrasto-riuscito');
  await pg.context().close();
}
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log('Salvati in', USCITA);
process.exit(ok ? 0 : 1);
