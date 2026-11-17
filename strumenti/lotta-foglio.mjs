// Foglio della lotta al centro (v0.55): difensore dietro il centroboa (tagliafuori) e in anticipo, con e senza palla, visti di lato
// e dall'alto. Uso: node strumenti/lotta-foglio.mjs [uscita.png] [--no-build] [--dist=<build>] [--porta=4345]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'docs/immagini/v055-lotta.png');
if (!process.argv.includes('--no-build') && !arg('dist', '')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: arg('dist', '') ? { outDir: arg('dist', '') } : {}, preview: { port: +arg('porta', 4345), host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 5; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = window.__dis; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.game.autoplay = true; for (const t of H.teams) t.human = false; H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(200); document.body.classList.add('foto'); });
await pg.addStyleTag({ content: 'body.foto #hud, body.foto #touch, body.foto #player, body.foto #schemi, body.foto #cronaca, body.foto #qte, body.foto #tLog, body.foto #pauseBtn, body.foto .tb, body.foto #fps { display:none !important }' });
const CASI = [['difensore dietro, palla al centroboa', 'dietro', true], ['difensore dietro, senza palla', 'dietro', false], ['difensore in anticipo, palla al centroboa', 'anticipo', true]];
const CAMERE = [['di lato', [0, 1.1, 3.0]], ['dall\u2019alto', [-0.6, 3.2, 1.4]]];
const scatti = [];
for (const [, dove, palla] of CASI) for (const [, cam] of CAMERE) {
  await pg.evaluate(({ dove, palla, cam }) => {
    const H = window.__pallanuoto, B = H.ball, A = H.teams[0], D = H.teams[1], gx = 12.5 * A.dir;
    H.game.state = 'play'; H.game.after = null;
    for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.charging = false; q.decideT = 99; q.reazioneT = 99; q.x = -gx * 0.3 + q.i * 0.8; q.z = (q.team === A ? 7 : -7); q.vx = q.vz = 0; q.oriz = 0; }
    const boa = A.players[1], d = D.players[6], bx = gx - A.dir * 2.6;
    for (let i = 0; i < 80; i++) {
      boa.x = bx; boa.z = 0; boa.fx = -A.dir; boa.fz = 0; boa.vx = boa.vz = 0; boa.oriz = 0;
      if (dove === 'dietro') { d.x = bx + A.dir * 0.85; d.fx = -A.dir; } else { d.x = bx - A.dir * 0.85; d.fx = A.dir; }
      d.z = 0; d.fz = 0; d.vx = d.vz = 0; d.oriz = 0;
      if (palla) { if (B.holder !== boa) H.regole.giveBall(boa); } else { const m = A.players[6]; m.x = bx - A.dir * 6; m.z = 0; if (B.holder !== m) H.regole.giveBall(m); m.decideT = 99; }
      H.fight.active = true; H.fight.boa = boa; H.fight.def = d; H.fight.v = 0; H.fight.decT = 99; H.fight.holdT = 0;
      for (const q of H.allPlayers) { q.excluded = false; q.act = null; q.charging = false; q.tackleCD = 99; q.colpi = []; } H.game.state = 'play'; H.game.after = null; H.game.shot = 28;
      window.__salta(1);
    }
    H.vista = { pos: [bx + cam[0] * A.dir, cam[1], cam[2]], look: [bx, 0.2, 0], fov: 40 }; window.__salta(1); H.__ridisegna(); H.vista = null;
  }, { dove, palla, cam });
  scatti.push((await pg.locator('canvas').first().screenshot()).toString('base64'));
}
const pf = await browser.newPage({ viewport: { width: 1280, height: 1250 } });
await pf.setContent(`<body style="margin:0;background:#111;color:#fff;font:600 15px system-ui;display:grid;grid-template-columns:repeat(2,1fr);gap:4px">${scatti.map((f, i) => `<div style="position:relative"><img style="width:100%;display:block" src="data:image/png;base64,${f}"><b style="position:absolute;left:8px;top:6px;text-shadow:0 1px 3px #000">${CASI[i >> 1][0]} · ${CAMERE[i % 2][0]}</b></div>`).join('')}</body>`);
await pf.screenshot({ path: USCITA, fullPage: true });
if (errori.length) console.log('errori: ' + errori.slice(0, 2).join(' | '));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log('foglio: ' + USCITA);
