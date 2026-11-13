// Effetti d'acqua e visibilità del gioco: 10 scene di una partita vera (computer contro computer), fotografate con la telecamera
// di gioco su iPhone in orizzontale. Per ogni scena: screenshot, numero di gocce e schiuma attive, oggetti disegnati e quanta parte
// della palla e della testa del giocatore più vicino resta visibile (stesso fotogramma disegnato con e senza effetti d'acqua).
// Soglie (rapporto https://claude.ai/artifact/1k9M3FJbkdVyGzd7ihFWLz): palla visibile ≥ 90%, testa ≥ 80%, gocce ≤ 96.
// Uso: node tests/acqua-effetti.mjs [cartella] [--no-build] [--dist=build] [--porta=4320]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'tests/screenshot/acqua-effetti');
const DIST = arg('dist', '');
fs.mkdirSync(USCITA, { recursive: true });
if (!DIST && !process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: DIST ? { outDir: DIST } : {}, preview: { port: +arg('porta', 4320), host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await (await browser.newContext({ viewport: { width: 852, height: 393 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true })).newPage();
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 77; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = window.__dis; };
  window.__vai = n => { for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
await pg.addStyleTag({ content: '#fps{display:none!important}' });
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'USA'); H.game.autoplay = true; for (const t of H.teams) t.human = false; H.imposta('len', '300'); document.getElementById('goBtn').click(); window.__salta(200); });

// condizioni delle 10 scene (si cerca la prima volta che succedono, poi si avanzano pochi fotogrammi perché l'effetto si veda)
const SCENE = [
  ['1-fermo', 'p => !p.isGK && Math.hypot(p.vx,p.vz)<0.15 && (p.oriz||0)<0.05 && !p.act', 4],
  ['2-nuoto-lento', 'p => (p.oriz||0)>0.85 && Math.hypot(p.vx,p.vz)>0.5 && Math.hypot(p.vx,p.vz)<1.2', 4],
  ['3-sprint', 'p => (p.oriz||0)>0.85 && Math.hypot(p.vx,p.vz)>1.9', 4],
  ['4-cambio-direzione', 'p => (p.oriz||0)>0.6 && Math.abs(p.curva||0)>0.5', 4],
  ['5-elevazione', 'p => p.act && p.act.kind==="shot" && p.act.t>p.act.wind*0.6 && p.act.t<p.act.wind', 2],
  ['6-ricaduta', 'p => p.act && p.act.kind==="shot" && p.act.t>p.act.wind+p.act.frusta+0.12', 3],
  ['7-parata', 'p => p.isGK && p.parataFatta', 2],
  ['8-contrasto', 'p => window.__pallanuoto.fight.active && p===window.__pallanuoto.fight.boa', 6],
  ['9-tiro-a-schizzo', 'p => window.__pallanuoto.ball.skipped && window.__pallanuoto.ball.state==="flight" && p===window.__pallanuoto.ball.shooter', 2],
  ['10-affollata', 'p => Math.abs(window.__pallanuoto.ball.x)>9 && window.__pallanuoto.allPlayers.filter(q=>Math.hypot(q.x-window.__pallanuoto.ball.x,q.z-window.__pallanuoto.ball.z)<3).length>=5 && p===window.__pallanuoto.allPlayers.reduce((a,b)=>Math.hypot(b.x-window.__pallanuoto.ball.x,b.z-window.__pallanuoto.ball.z)<Math.hypot(a.x-window.__pallanuoto.ball.x,a.z-window.__pallanuoto.ball.z)?b:a)', 1],
];
const report = [];
let ok = true;
for (const [nome, cond, dopo] of SCENE) {
  const trovato = await pg.evaluate(({ cond, dopo }) => {
    const H = window.__pallanuoto, f = new Function('return ' + cond)();
    for (let i = 0; i < 60 * 60 * 6; i++) {
      window.__salta(1);
      if (H.game.state === 'over') break;
      const p = H.allPlayers.find(q => !q.excluded && f(q));
      if (p) { window.__salta(dopo); window.__chi = p; return true; }
    }
    return false;
  }, { cond, dopo });
  if (!trovato) { console.log(`${nome}: non trovata nella partita`); report.push({ nome, trovato: false }); continue; }
  // telecamera di gioco, poi un fotogramma disegnato con e senza effetti d'acqua; si misura sulla palla e sulla testa
  const dati = await pg.evaluate(() => {
    const H = window.__pallanuoto, E = H.effetti, p = window.__chi;
    window.__vai(1);
    const W = innerWidth, Hh = innerHeight, cam = H.camera;
    const pt = (x, y, z) => { const v = cam.position.clone().set(x, y, z).project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * Hh]; };
    const bp = pt(H.ball.x, Math.max(0.05, H.ball.y), H.ball.z), bq = pt(H.ball.x, Math.max(0.05, H.ball.y) + 0.19, H.ball.z);
    const hp = pt(p.x, 0.45, p.z), hq = pt(p.x, 0.65, p.z);
    const inf = H.renderer.info.render;
    return { palla: [bp[0], bp[1], Math.hypot(bq[0] - bp[0], bq[1] - bp[1])], testa: [hp[0], hp[1], Math.hypot(hq[0] - hp[0], hq[1] - hp[1])], gocce: E.gocceAttive(),
      oggetti: inf.calls, triangoli: inf.triangles };
  });
  await pg.waitForTimeout(150);
  const con = await pg.screenshot({ path: path.join(USCITA, nome + '.png') });
  await pg.evaluate(() => { const E = window.__pallanuoto.effetti; for (const m of [E.gocce, E.schiuma, E.contatti]) m.visible = false; });
  // ridisegno dello stesso istante senza effetti (render del gioco senza avanzare il tempo)
  await pg.evaluate(() => { window.__pallanuoto.__ridisegna(); });
  await pg.waitForTimeout(150);
  const senza = await pg.screenshot();
  await pg.evaluate(() => { const E = window.__pallanuoto.effetti; for (const m of [E.gocce, E.schiuma, E.contatti]) m.visible = true; });
  const vis = await pg.evaluate(async ({ a, b, palla, testa }) => {
    const img = async s => { const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob()); const c = new OffscreenCanvas(bm.width, bm.height), x = c.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height); };
    const A = await img(a), B = await img(b), sc = A.width / innerWidth;
    const frazione = ([cx, cy, r]) => { let tot = 0, uguali = 0; r = Math.max(2, r);
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
        const X = Math.round(x * sc), Y = Math.round(y * sc); if (X < 0 || Y < 0 || X >= A.width || Y >= A.height) continue; tot++;
        const i = (Y * A.width + X) * 4, d = Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]);
        if (d < 60) uguali++; }
      return tot ? uguali / tot : 1; };
    return { palla: frazione(palla), testa: frazione(testa) };
  }, { a: con.toString('base64'), b: senza.toString('base64'), palla: dati.palla, testa: dati.testa });
  const r = { nome, trovato: true, pallaVisibile: vis.palla, testaVisibile: vis.testa, gocce: dati.gocce, oggetti: dati.oggetti, triangoli: dati.triangoli };
  report.push(r);
  const bene = vis.palla >= 0.9 && vis.testa >= 0.8 && dati.gocce <= 96;
  if (!bene) ok = false;
  console.log(`${bene ? 'OK ' : 'NO '} ${nome.padEnd(20)} palla visibile ${(vis.palla * 100).toFixed(0)}% · testa ${(vis.testa * 100).toFixed(0)}% · gocce ${dati.gocce} · ${dati.oggetti} oggetti, ${Math.round(dati.triangoli / 1000)} mila triangoli`);
}
fs.writeFileSync(path.join(USCITA, 'misure.json'), JSON.stringify(report, null, 1));
if (errori.length) { ok = false; console.log('errori:', errori.slice(0, 2).join(' | ')); }
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nTutto a posto.' : '\nCi sono problemi.');
process.exit(ok ? 0 : 1);
