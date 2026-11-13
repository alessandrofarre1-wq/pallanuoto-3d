// Primi piani di braccia, polsi e mani (portiere e giocatori) a telecamera fissa: foglio unico per il confronto prima/dopo.
// Uso: node tests/mani.mjs [uscita.png] [--no-build] [--dist=<build>] [--porta=4336]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'docs/immagini/mani.png');
if (!process.argv.includes('--no-build') && !arg('dist', '')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: arg('dist', '') ? { outDir: arg('dist', '') } : {}, preview: { port: +arg('porta', 4336), host: '127.0.0.1' } });
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
const CASI = [
  ['portiere: palla lontana', 'gkLontana'], ['portiere: palla vicina, pronto', 'gkVicina'], ['portiere: parata alta a lato', 'gkParata'],
  ['giocatore fermo', 'fermo'], ['con la palla in mano', 'palla'], ['carica il tiro', 'carica'],
  ['muro', 'muro'], ['nuoto (trazione)', 'nuoto'], ['lotta al centro', 'lotta'],
];
const scatti = [];
for (const [, caso] of CASI) {
  await pg.evaluate(caso => {
    const H = window.__pallanuoto, B = H.ball, A = H.teams[0], D = H.teams[1], gk = D.players[0], gx = 12.5 * A.dir;
    H.game.state = 'play'; H.game.after = null; H.fight.active = false;
    for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.charging = false; q.decideT = 99; q.x = -gx * 0.5 + q.i; q.z = (q.team === A ? 5 : -5); q.vx = q.vz = 0; q.oriz = 0; }
    const att = A.players[4], dif = D.players[MARK(att.i)];
    function MARK(i) { return [0, 6, 3, 2, 5, 4, 1][i]; }
    let cam, fuoco;
    const ferma = () => { for (const q of H.allPlayers) { q.vx = q.vz = 0; } };
    const setta = i => {
      if (caso.startsWith('gk')) {
        gk.x = gx - A.dir * 0.7; gk.z = 0; gk.fx = -A.dir; gk.fz = 0;
        if (caso === 'gkLontana') { att.x = 0; att.z = 0; if (B.holder !== att) H.regole.giveBall(att); }
        if (caso === 'gkVicina') { att.x = gx - A.dir * 6; att.z = 1.5; if (B.holder !== att) H.regole.giveBall(att); att.fx = A.dir; att.fz = 0; }
        if (caso === 'gkParata') { if (i === 0) { att.x = gx - A.dir * 6; att.z = 1.5; B.holder = null; B.state = 'flight'; B.kind = 'shot'; B.shooter = att; B.crossZ = -1.1; B.flightT = 0.3; B.saveChecked = true; B.x = gx - A.dir * 2; B.y = 1.1; B.z = -0.9; B.vx = B.vy = B.vz = 0; }
          B.state = 'flight'; B.flightT = 0.3; B.x = gx - A.dir * 2; B.y = 1.1; B.z = -0.9; B.vx = B.vy = B.vz = 0; }
        cam = [gk.x - gk.fx * -3.4, 1.0, gk.z + 1.4]; fuoco = [gk.x, 0.4, gk.z];
      } else if (caso === 'lotta') {
        const boa = A.players[1], d = D.players[6]; boa.x = gx - A.dir * 2.5; boa.z = 0; boa.fx = -A.dir; boa.fz = 0; d.x = boa.x - A.dir * 0.7; d.z = 0; d.fx = A.dir; d.fz = 0;
        if (B.holder !== boa) H.regole.giveBall(boa); H.fight.active = true; H.fight.boa = boa; H.fight.def = d; H.fight.v = 0;
        cam = [boa.x - A.dir * 0.4, 1.0, 2.6]; fuoco = [boa.x - A.dir * 0.35, 0.3, 0];
      } else {
        const p = att; p.x = 0; p.z = 0; p.fx = A.dir; p.fz = 0;
        if (caso === 'palla' || caso === 'carica' || caso === 'muro') { if (B.holder !== p) H.regole.giveBall(p); }
        else if (B.holder === p) { B.holder = null; B.state = 'free'; B.x = 5; B.z = 8; }
        if (caso === 'carica' || caso === 'muro') { p.act = p.act || { kind: 'shot', t: 0, wind: 99, frusta: 0.17, done: false, fn: () => {} }; p.act.t = Math.min(p.act.t, 0.35); }
        if (caso === 'muro') { dif.x = p.x + A.dir * 0.9; dif.z = 0; dif.fx = -A.dir; dif.fz = 0; cam = [dif.x + A.dir * 1.9, 1.1, 1.7]; fuoco = [dif.x, 0.45, 0]; }
        else if (caso === 'nuoto') { p.vx = A.dir * 1.6; p.oriz = 1; cam = [p.x + 0.2, 1.4, 2.6]; fuoco = [p.x, 0.0, 0]; }
        else { cam = [p.x + A.dir * 2.6, 1.1, 1.6]; fuoco = [p.x, 0.45, 0]; }
      }
    };
    for (let i = 0; i < 70; i++) { setta(i); if (caso !== 'nuoto') ferma(); else { att.x = 0; att.z = 0; att.vx = A.dir * 1.6; att.oriz = 1; } window.__salta(1); }
    H.vista = { pos: cam, look: fuoco, fov: 40 }; window.__salta(1); H.__ridisegna(); H.vista = null;
  }, caso);
  scatti.push((await pg.locator('canvas').first().screenshot()).toString('base64'));
}
const pf = await browser.newPage({ viewport: { width: 1500, height: 900 } });
await pf.setContent(`<body style="margin:0;background:#111;color:#fff;font:600 16px system-ui;display:grid;grid-template-columns:repeat(3,1fr);gap:4px">${scatti.map((f, i) => `<div style="position:relative"><img style="width:100%;display:block" src="data:image/png;base64,${f}"><b style="position:absolute;left:8px;top:6px;text-shadow:0 1px 3px #000">${CASI[i][0]}</b></div>`).join('')}</body>`);
await pf.screenshot({ path: USCITA, fullPage: true });
if (errori.length) console.log('errori: ' + errori.slice(0, 2).join(' | '));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log('foglio: ' + USCITA);
