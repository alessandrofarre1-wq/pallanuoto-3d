// Foglio delle forme della finta (v0.85, Ale: «avanti-indietro ma più spesso destra-sinistra, larghe o strette, braccio piegato o
// dritto»). Lo stesso giocatore al culmine dell'accenno (fine del gesto in avanti) in otto finte: dritta o di lato, stretta o larga,
// braccio dritto o piegato (grafica/pose.js, FINTA_FORMA). Due viste: di lato e da dietro il tiratore, verso la porta.
// Uso: node strumenti/finte-forme-foglio.mjs [uscita.png] [--no-build] [--dist=<build>] [--porta=4344]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'docs/immagini/v085-finte-forme.png');
if (!process.argv.includes('--no-build') && !arg('dist', '')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: arg('dist', '') ? { outDir: arg('dist', '') } : {}, preview: { port: +arg('porta', 4344), host: '127.0.0.1' } });
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
const FORME = [];
for (const lato of [0, 1]) for (const piegato of [false, true]) for (const largo of [0.1, 0.9]) FORME.push({ lato, piegato, largo });
const scatti = [];
for (const f of FORME) {
  for (const vista of ['lato', 'dietro']) {
    scatti.push(await pg.evaluate(({ f, vista }) => {
      const H = window.__pallanuoto, B = H.ball, A = H.teams[0], g = H.game;
      H.replay?.interrompiReplay?.();
      g.state = 'play'; g.after = null; g.penalty = null; H.fight.active = false;
      for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.charging = false; q.decideT = 99; q.reazioneT = 99; q.x = -6 + q.i; q.z = (q.team === A ? 6 : -6); q.vx = q.vz = 0; q.oriz = 0; q.stunUntil = g.time + 99; q.tackleCD = 99; }
      const p = A.players[4], gx = 12.5 * A.dir; p.scheda = { ...p.scheda, finta: 'raffica' }; p.mano = 'D';
      const tieni = () => { p.x = gx - A.dir * 6; p.z = 0; p.fx = A.dir; p.fz = 0; p.vx = p.vz = 0; p.oriz = 0; p.decideT = 99; p.fintaPronto = g.time + 99; if (B.holder !== p) H.regole.giveBall(p); };
      tieni(); for (let i = 0; i < 40; i++) { tieni(); window.__salta(1); }
      window.__formaFinta = { largo: f.largo, piegato: f.piegato };
      Object.assign(p, { fakeCount: 0, ultimoLatoFinta: 0, fintaLatoVoluto: f.lato });
      H.prova.startAct(p, 'fake', 0.16, () => {}); if (!f.lato) p.fintaLatoGesto = 0;
      const a = p.act;
      while (a.t < a.wind + a.frusta - 1e-6) { tieni(); p.act = a; window.__salta(1); }
      H.vista = vista === 'lato' ? { pos: [p.x - A.dir * 0.3, 1.05, p.z + 2.2], look: [p.x + A.dir * 0.1, 0.75, p.z], fov: 34 }
        : { pos: [p.x - A.dir * 2.1, 1.2, p.z + 0.25], look: [p.x + A.dir * 0.4, 0.8, p.z], fov: 34 };
      window.__salta(1); H.__ridisegna(); const url = H.renderer.domElement.toDataURL('image/png'); H.vista = null; window.__formaFinta = null;
      return url.split(',')[1];
    }, { f, vista }));
  }
}
const nomi = FORME.map(f => `${f.lato ? 'di lato' : 'dritta'} · ${f.largo > 0.5 ? 'larga' : 'stretta'} · braccio ${f.piegato ? 'piegato' : 'dritto'}`);
const pf = await browser.newPage({ viewport: { width: 1280, height: 400 } });
await pf.setContent(`<body style="margin:0;background:#111;color:#fff;font:600 15px system-ui;display:grid;grid-template-columns:repeat(4,1fr);gap:3px;align-content:start">${scatti.map((s, i) => `<div style="position:relative"><img style="width:100%;display:block" src="data:image/png;base64,${s}"><b style="position:absolute;left:6px;top:5px;text-shadow:0 1px 3px #000">${nomi[i >> 1]}<br>${i % 2 ? 'da dietro' : 'di lato'}</b></div>`).join('')}</body>`);
await pf.screenshot({ path: USCITA, fullPage: true });
if (errori.length) console.log('errori: ' + errori.slice(0, 2).join(' | '));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log('foglio: ' + USCITA);
