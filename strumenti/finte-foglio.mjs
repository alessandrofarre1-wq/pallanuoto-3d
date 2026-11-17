// Foglio delle sei finte personali (v0.55, src/finte.js): lo stesso giocatore al culmine di ciascuna finta, stessa camera.
// Uso: node strumenti/finte-foglio.mjs [uscita.png] [--no-build] [--dist=<build>] [--porta=4339]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'docs/immagini/v055-finte.png');
if (!process.argv.includes('--no-build') && !arg('dist', '')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: arg('dist', '') ? { outDir: arg('dist', '') } : {}, preview: { port: +arg('porta', 4339), host: '127.0.0.1' } });
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
const STILI = [['larga','lenta e larga, braccio teso'],['raffica','a raffica, stretta e rapida'],['polso','di polso, da destra a sinistra'],['mezza','mezza finta, si alza'],['bomba','di bomba, carica da tiro potente'],['spalla','di spalla, braccio quasi fermo']];
const scatti = [];
for (const [stile] of STILI) {
  for (const fase of [0.5, 1]) {
    await pg.evaluate(({ stile, fase }) => {
      const H = window.__pallanuoto, B = H.ball, A = H.teams[0];
      H.game.state = 'play'; H.game.after = null; H.fight.active = false;
      for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.charging = false; q.decideT = 99; q.reazioneT = 99; q.x = -6 + q.i; q.z = (q.team === A ? 6 : -6); q.vx = q.vz = 0; q.oriz = 0; }
      const p = A.players[4]; p.scheda.finta = stile;
      for (let i = 0; i < 70; i++) {
        p.x = 0; p.z = 0; p.fx = A.dir; p.fz = 0; p.vx = p.vz = 0; p.oriz = 0; if (B.holder !== p) H.regole.giveBall(p);
        const w = { larga: 0.2, raffica: 0.04, polso: 0.09, mezza: 0.05, bomba: 0.17, spalla: 0.06 }[stile];
        p.act = { kind: 'fake', t: w * fase, wind: w, frusta: 0.09, done: false, fn: () => {} };
        for (const q of H.allPlayers) { q.vx = q.vz = 0; }
        window.__salta(1);
      }
      H.vista = { pos: [A.dir * 2.4, 1.15, 1.9], look: [0, 0.55, 0], fov: 42 }; window.__salta(1); H.__ridisegna(); H.vista = null;
    }, { stile, fase });
    scatti.push((await pg.locator('canvas').first().screenshot()).toString('base64'));
  }
}
const pf = await browser.newPage({ viewport: { width: 1280, height: 1500 } });
await pf.setContent(`<body style="margin:0;background:#111;color:#fff;font:600 16px system-ui;display:grid;grid-template-columns:repeat(2,1fr);gap:4px">${scatti.map((f, i) => `<div style="position:relative"><img style="width:100%;display:block" src="data:image/png;base64,${f}"><b style="position:absolute;left:8px;top:6px;text-shadow:0 1px 3px #000">Finta ${STILI[i >> 1][1]} · ${i % 2 ? 'culmine' : 'a metà'}</b></div>`).join('')}</body>`);
await pf.screenshot({ path: USCITA, fullPage: true });
if (errori.length) console.log('errori: ' + errori.slice(0, 2).join(' | '));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log('foglio: ' + USCITA);
