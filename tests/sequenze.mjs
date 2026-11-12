// Sequenze fitte dei movimenti (10 fotogrammi al secondo), messe in scena con i comandi veri del giocatore:
// partenza con palla, frenata e tiro, cambio di direzione, passaggio ricevuto in nuotata.
// Servono a vedere dove il movimento fa uno scatto. Per ogni fotogramma stampa anche velocità, quanto il corpo è disteso
// (0 = verticale, 1 = orizzontale) e direzione del corpo.
// Uso: node tests/sequenze.mjs [cartella di uscita] [--no-build] [--dist=cartella di una build già fatta] [--alzata=0.25]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'tests/screenshot/primi-piani');
const DIST = arg('dist', ''), ALZATA = arg('alzata', '');
fs.mkdirSync(USCITA, { recursive: true });
if (!DIST && !process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: DIST ? { outDir: DIST } : {}, preview: { port: 4179, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

// ogni scena: comandi nel tempo (secondi → tasti premuti) e finestra da fotografare
const SCENE = {
  'partenza-con-palla': { tasti: [[0, []], [0.5, ['KeyD']]], da: 0.4, a: 2.0, palla: true },
  'frenata-e-tiro': { tasti: [[0, ['KeyD']], [2.0, ['KeyK']], [2.5, []]], da: 1.7, a: 3.3, palla: true },
  'cambio-di-direzione': { tasti: [[0, ['KeyD']], [2.0, ['KeyS']]], da: 1.7, a: 3.5, palla: false, alta: true },
  'passaggio-in-nuotata': { tasti: [[0, ['KeyD']], [1.5, ['KeyD', 'Space']], [1.6, ['KeyD']]], da: 1.3, a: 3.1, palla: true, compagno: true }
};
const tabelle = {};
for (const [nome, sc] of Object.entries(SCENE)) {
  const pg = await browser.newPage({ viewport: { width: 560, height: 400 }, deviceScaleFactor: 1 });
  pg.on('pageerror', e => console.log('errore nella pagina:', e.message));
  await pg.addInitScript(() => {
    let a = 7; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    performance.now = () => 0; window.__frame = 0;
    window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
    window.__step = n => { for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } };
  });
  await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
  await pg.addStyleTag({ content: '#hud,#tac,#player,#cronaca,#tLog,#fight,#touch,#fps{display:none!important}' });
  await pg.evaluate(({ sc, alzata }) => {
    const H = window.__pallanuoto; H.disegna = H.renderer.render; H.renderer.render = () => {};
    if (alzata) { const b = document.querySelector(`[data-alz="${alzata}"]`); if (b) b.click(); }
    document.getElementById('goBtn').click();
    window.__step(200);                                                    // conto alla rovescia
    const p = H.teams[0].players[6], m = H.teams[0].players[4], B = H.ball;
    p.x = -4; p.z = 0; p.vx = p.vz = 0; p.fx = 1; p.fz = 0; p.oriz = 0; p.stamina = 1;
    if (sc.compagno) { m.x = -1.5; m.z = 2.2; m.fx = 1; m.fz = 0; m.oriz = 1; m.vx = 1.6; m.vz = 0; m.stamina = 1; }
    window.__sc = { p, m, premuti: [], seguito: p, passato: false };
    // gli altri stanno lontani e fermi; l'azione non scade
    window.__ferma = () => {
      const S = window.__sc; H.game.shot = 28; H.game.clock = 100; H.game.state = 'play';
      for (const q of H.allPlayers) { if (q === p || (sc.compagno && q === m)) continue;
        if (q.isGK) continue; q.x = (q.team.idx ? 11.5 : -11.5); q.z = -8.5 + q.i * 0.8; q.vx = q.vz = 0; q.oriz = 0; }
      if (sc.compagno && B.holder === p && !S.passato) { m.x += 1.6 / 60; m.z = 2.2; m.vx = 1.6; m.vz = 0; m.fx = 1; m.fz = 0; m.oriz = 1; }      // il compagno nuota accanto finché non parte il passaggio
      if (sc.compagno && B.state === 'flight') { S.passato = true; S.seguito = m; }
    };
    if (sc.palla) { B.state = 'held'; B.holder = p; H.game.possTeam = p.team; } else { B.state = 'free'; B.x = -11; B.z = 9.2; B.vx = B.vz = 0; H.game.possTeam = p.team; }
    window.__ferma();
  }, { sc, alzata: ALZATA });
  const righe = [], file = [];
  const F0 = 0, FN = Math.round(sc.a * 60);
  for (let f = F0; f <= FN; f++) {
    const t = f / 60, tasti = [...sc.tasti].reverse().find(x => t >= x[0])[1];
    const scatta = t >= sc.da - 1e-9 && Math.round((t - sc.da) * 60) % 6 === 0;
    const r = await pg.evaluate(({ tasti, scatta, alta }) => {
      const H = window.__pallanuoto, S = window.__sc, R = H.renderer;
      for (const k of S.premuti) if (!tasti.includes(k)) window.dispatchEvent(new KeyboardEvent('keyup', { code: k }));
      for (const k of tasti) if (!S.premuti.includes(k)) window.dispatchEvent(new KeyboardEvent('keydown', { code: k }));
      S.premuti = tasti;
      const q = S.seguito;
      if (scatta) { H.vista = alta ? { pos: [q.x - 0.5, 4.2, q.z + 4.6], look: [q.x, 0, q.z], fov: 30 } : { pos: [q.x + 0.3, 1.0, q.z + 4.6], look: [q.x + 0.3, 0.05, q.z], fov: 30 }; R.render = H.disegna; }
      window.__step(1); R.render = () => {}; H.vista = null; window.__ferma();
      const g = S.seguito;
      return { v: Math.hypot(g.vx, g.vz), o: g.oriz || 0, dir: Math.atan2(g.fz, g.fx) * 180 / Math.PI, testa: g.J ? g.J.head[1] : 0, x: g.x, z: g.z, act: g.act ? g.act.kind : '', palla: H.ball.state, chi: g.i };
    }, { tasti, scatta, alta: !!sc.alta });
    r.t = t; righe.push(r);
    if (scatta) { const n = `${nome}-${String(file.length + 1).padStart(2, '0')}.png`; await pg.screenshot({ path: path.join(USCITA, n) }); file.push({ n, r }); }
  }
  await pg.close();
  tabelle[nome] = righe;
  // foglio: 6 immagini per riga, con tempo, velocità e quanto il corpo è disteso
  const p2 = await browser.newPage({ viewport: { width: 1800, height: 900 } });
  await p2.setContent(`<body style="margin:0;background:#111"><div id="c" style="display:grid;grid-template-columns:repeat(6,280px);gap:3px;padding:3px;width:max-content">${file.map(s => `<div style="position:relative"><img src="data:image/png;base64,${fs.readFileSync(path.join(USCITA, s.n)).toString('base64')}" style="display:block;width:280px"><b style="position:absolute;left:5px;top:3px;color:#fff;font:700 12px system-ui;text-shadow:0 1px 3px #000">${s.r.t.toFixed(1)} s · ${s.r.v.toFixed(1)} m/s · disteso ${Math.round(s.r.o * 100)}%${s.r.act ? ' · ' + s.r.act : ''}</b></div>`).join('')}</div></body>`);
  await p2.waitForFunction('[...document.images].every(i => i.complete)');
  await p2.locator('#c').screenshot({ path: path.join(USCITA, `seq-${nome}.png`) });
  await p2.close();
  for (const s of file) fs.unlinkSync(path.join(USCITA, s.n));
  // tabella a 10 al secondo e scatti: la variazione più brusca di velocità e di direzione tra due fotogrammi di gioco (1/60 s)
  let dvMax = 0, ddMax = 0, tv = 0, td = 0;
  for (let i = 1; i < righe.length; i++) { const a = righe[i - 1], b = righe[i]; if (a.chi !== b.chi) continue;
    const dv = Math.abs(b.v - a.v) * 60; let dd = Math.abs(b.dir - a.dir); if (dd > 180) dd = 360 - dd; dd *= 60;
    if (dv > dvMax) { dvMax = dv; tv = b.t; } if (dd > ddMax) { ddMax = dd; td = b.t; } }
  console.log(`\n${nome}  (accelerazione massima ${dvMax.toFixed(1)} m/s² a ${tv.toFixed(2)} s · rotazione massima ${Math.round(ddMax)}°/s a ${td.toFixed(2)} s)`);
  console.log('  t     vel   disteso  direz  testa  gesto');
  for (const r of righe) if (Math.round(r.t * 60) % 6 === 0 && r.t >= sc.da - 0.31) console.log(`  ${r.t.toFixed(1).padStart(4)}  ${r.v.toFixed(2)}   ${String(Math.round(r.o * 100)).padStart(3)}%   ${String(Math.round(r.dir)).padStart(4)}°  ${r.testa.toFixed(2)}  ${r.act}${r.palla === 'flight' ? ' (palla in volo)' : ''}`);
}
fs.writeFileSync(path.join(USCITA, 'sequenze.json'), JSON.stringify(tabelle));
await browser.close(); await new Promise(r => server.httpServer.close(r));
