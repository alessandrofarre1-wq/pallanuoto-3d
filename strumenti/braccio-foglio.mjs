// Foglio del braccio di tiro (v0.55): palla tenuta, carica a metà, carica piena e rilascio, visti da tre lati (davanti, lato,
// dietro), per controllare gomito, polso e palmo. Uso: node strumenti/braccio-foglio.mjs [uscita.png] [--no-build] [--dist=<build>] [--porta=4341]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'docs/immagini/v055-braccio.png');
if (!process.argv.includes('--no-build') && !arg('dist', '')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: arg('dist', '') ? { outDir: arg('dist', '') } : {}, preview: { port: +arg('porta', 4341), host: '127.0.0.1' } });
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
const FASI = [['palla tenuta', null], ['carica a metà', 0.5], ['carica piena', 1], ['rilascio', 1.6], ['accompagnamento', 2.6], ['fine del gesto', 3.6]];
const CAMERE = [['davanti', [2.3, 1.0, 0.9]], ['di lato', [0.2, 1.0, 2.4]], ['da dietro', [-2.0, 1.2, 1.2]]];
const scatti = [];
for (const [, fase] of FASI) for (const [, cam] of CAMERE) {
  await pg.evaluate(({ fase, cam }) => {
    const H = window.__pallanuoto, B = H.ball, A = H.teams[0];
    H.game.state = 'play'; H.game.after = null; H.fight.active = false;
    for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.charging = false; q.decideT = 99; q.reazioneT = 99; q.x = -6 + q.i; q.z = (q.team === A ? 6 : -6); q.vx = q.vz = 0; q.oriz = 0; }
    const p = A.players[4];
    for (let i = 0; i < 70; i++) {
      p.x = 0; p.z = 0; p.fx = A.dir; p.fz = 0; p.vx = p.vz = 0; p.oriz = 0;
      if (fase == null || fase <= 1) { if (B.holder !== p) H.regole.giveBall(p); } else { B.holder = null; B.state = 'flight'; B.kind = 'shot'; B.x = 8 * A.dir; B.y = 1; B.z = 0; B.vx = B.vy = B.vz = 0; }
      p.act = fase == null ? null : { kind: 'shot', t: fase <= 1 ? 0.3 * fase : fase <= 1.6 ? 0.3 + 0.18 * (fase - 1) / 0.6 : 0.48 + 0.36 * (fase - 1.6) / 2, wind: 0.3, frusta: 0.18, done: false, fn: () => {} };
      for (const q of H.allPlayers) { q.vx = q.vz = 0; }
      window.__salta(1);
    }
    H.vista = { pos: [cam[0] * A.dir, cam[1], cam[2]], look: [0, 0.55, 0], fov: 38 }; window.__salta(1); H.__ridisegna(); H.vista = null;
  }, { fase, cam });
  scatti.push((await pg.locator('canvas').first().screenshot()).toString('base64'));
}
const pf = await browser.newPage({ viewport: { width: 1500, height: 1950 } });
await pf.setContent(`<body style="margin:0;background:#111;color:#fff;font:600 15px system-ui;display:grid;grid-template-columns:repeat(3,1fr);gap:4px">${scatti.map((f, i) => `<div style="position:relative"><img style="width:100%;display:block" src="data:image/png;base64,${f}"><b style="position:absolute;left:8px;top:6px;text-shadow:0 1px 3px #000">${FASI[Math.floor(i / 3)][0]} · ${CAMERE[i % 3][0]}</b></div>`).join('')}</body>`);
await pf.screenshot({ path: USCITA, fullPage: true });
if (errori.length) console.log('errori: ' + errori.slice(0, 2).join(' | '));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log('foglio: ' + USCITA);
