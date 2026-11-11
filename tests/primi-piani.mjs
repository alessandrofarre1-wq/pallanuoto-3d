// Primi piani dei giocatori nei quattro atteggiamenti principali (fermo, nuoto, dorso, tiro), per controllare a occhio
// le animazioni. Uso: node tests/primi-piani.mjs [cartella di uscita]   (predefinita: tests/screenshot/primi-piani)
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const USCITA = process.argv[2] || path.join(ROOT, 'tests/screenshot/primi-piani');
fs.mkdirSync(USCITA, { recursive: true });
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4178, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 900, height: 600 }, deviceScaleFactor: 1 });
pg.on('pageerror', e => console.log('errore nella pagina:', e.message));
await pg.addInitScript(() => {
  let a = 7; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  performance.now = () => 0; window.__frame = 0;
  window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__step = n => { for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto');
await pg.evaluate(() => { const H = window.__pallanuoto; H.disegna = H.renderer.render; H.renderer.render = () => {}; document.getElementById('goBtn').click(); document.body.classList.add('primo-piano'); });
await pg.addStyleTag({ content: '#hud,#tac,#player,#msg,#excl,#fight,#touch,#fps{display:none!important}' });

// per ogni atteggiamento: si avanza finché un giocatore lo assume, poi lo si inquadra da vicino
const CERCA = {
  fermo: p => !p.isGK && !p.excluded && !p.act && Math.hypot(p.vx, p.vz) < 0.15 && !(p.dorsoK > 0.05) && window.__pallanuoto.ball.holder !== p && window.__pallanuoto.game.state === 'play',
  nuoto: p => !p.excluded && Math.hypot(p.vx, p.vz) > 1.7 && window.__pallanuoto.ball.holder !== p,
  'nuoto-con-palla': p => Math.hypot(p.vx, p.vz) > 1.2 && window.__pallanuoto.ball.holder === p,
  dorso: p => p.dorsoK > 0.95 && Math.hypot(p.vx, p.vz) < 0.4,
  tiro: p => p.act && p.act.kind === 'shot' && p.act.t > p.act.wind * 0.9 && p.act.t < p.act.wind + 0.06 && p.act.wind > 0.15,
  portiere: p => p.isGK && window.__pallanuoto.ball.state === 'flight' && window.__pallanuoto.ball.kind === 'shot' && window.__pallanuoto.ball.shooter.team !== p.team && window.__pallanuoto.ball.flightT > 0.2,
};
for (const [nome, cond] of Object.entries(CERCA)) {
  const trovato = await pg.evaluate(({ src, lati }) => {
    const H = window.__pallanuoto, cond = eval('(' + src + ')');
    for (let i = 0; i < 60 * 240; i++) {
      window.__step(1);
      const p = H.allPlayers.find(cond);
      if (!p) continue;
      const viste = lati.map(([av, la, su]) => ({ pos: [p.x + p.fx * av - p.fz * la, su, p.z + p.fz * av + p.fx * la], look: [p.x, 0.05, p.z], fov: 30 }));
      return { frame: window.__frame, chi: p.team.short + ' #' + p.num, viste };
    }
    return null;
  }, { src: cond.toString(), lati: [[2.6, 2.4, 1.5], [0.2, 3.6, 0.9]] });
  if (!trovato) { console.log(nome + ': non trovato'); continue; }
  for (const [k, vista] of trovato.viste.entries()) {
    await pg.evaluate(v => { const H = window.__pallanuoto; H.vista = v; const R = H.renderer; R.render = H.disegna; window.__step(1); R.render = () => {}; H.vista = null; }, vista);
    await pg.screenshot({ path: path.join(USCITA, `${nome}-${k ? 'lato' : 'tre-quarti'}.png`) });
  }
  console.log(`${nome}: ${trovato.chi} al fotogramma ${trovato.frame}`);
}
await browser.close(); await new Promise(r => server.httpServer.close(r));
