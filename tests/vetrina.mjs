// Vetrina: screenshot su iPhone (orizzontale e verticale) delle novità: menu con squadre e rosa, partita, rigore, zona a M,
// 7 contro 6, e la sequenza di un portiere che segue un passaggio e para.
// Uso: node tests/vetrina.mjs [cartella di uscita] [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'tests/screenshot/vetrina');
fs.mkdirSync(USCITA, { recursive: true });
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4172, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const VISTE = { orizzontale: { width: 844, height: 390 }, verticale: { width: 390, height: 844 } };
const init = () => {
  let a = 21; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  performance.now = () => 0; window.__frame = 0;
  window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  // avanza senza disegnare affatto
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } R.render = window.__dis; };
  // avanza senza disegnare e disegna solo l'ultimo fotogramma
  window.__vai = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n - 1; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } R.render = window.__dis; window.__frame++; window.__raf(window.__frame * 1000 / 60); };
};
async function apri(vista, telefono = true) {
  const ctx = await browser.newContext(telefono ? { viewport: VISTE[vista], deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport: { width: 760, height: 520 } });
  const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('errore nella pagina:', e.message));
  await pg.addInitScript(init); await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
  return pg;
}
for (const vista of Object.keys(VISTE)) {
  const scatta = (pg, nome) => pg.screenshot({ path: path.join(USCITA, `${nome}-${vista}.png`) });
  // menu: squadre e rosa
  let pg = await apri(vista);
  await pg.evaluate(() => { window.__pallanuoto.scegliSquadre('ITA', 'ESP'); document.getElementById('rosaBox').open = true; window.__vai(2); });
  await scatta(pg, '1-menu-squadre');
  await pg.evaluate(() => document.getElementById('rosaBox').scrollIntoView()); await scatta(pg, '2-menu-rosa');
  // partita
  await pg.evaluate(() => { document.getElementById('goBtn').click(); window.__vai(900); }); await scatta(pg, '3-partita');
  // rigore
  await pg.evaluate(() => { const H = window.__pallanuoto; H.game.state = 'play'; H.game.after = null; H.regole.setupPenalty(H.teams[0]); window.__vai(45); }); await scatta(pg, '4-rigore');
  await pg.context().close();
  // zona a M: quando l'avversario attacca schierato, la mia squadra passa alla zona a M
  pg = await apri(vista);
  await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'ESP'); document.getElementById('goBtn').click(); window.__vai(300);
    for (let i = 0; i < 6000; i++) { window.__salta(1); const h = H.ball.holder; if (h && h.team === H.teams[1] && Math.abs(h.x + 12.5) < 8 && H.game.state === 'play' && !H.allPlayers.some(p => p.excluded)) break; }
    H.teams[0].defPlay = 3; window.__vai(170); window.__pallanuoto.cronaca.svuota(); window.__vai(1); });
  await scatta(pg, '5-zona-a-M');
  await pg.context().close();
  // 7 contro 6: ultimo minuto, il computer è sotto di un gol e ha la palla
  pg = await apri(vista);
  await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'ESP'); document.getElementById('goBtn').click(); window.__vai(300);
    H.game.period = 4; H.game.clock = 55; H.teams[0].score = 9; H.teams[1].score = 8; H.teams[1].timeouts = 0;
    for (let i = 0; i < 4000; i++) { window.__salta(1); const gk = H.teams[1].players[0]; if (H.game.possTeam === H.teams[1] && gk.x < 6 && H.game.state === 'play') break; if (H.game.clock < 8) H.game.clock = 40; }
    window.__vai(60); });
  await scatta(pg, '6-sette-contro-sei');
  await pg.context().close();
}
// ---------- sequenza del portiere: segue un passaggio lungo e para ----------
{
  const prepara = () => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'USA'); H.game.autoplay = true; for (const t of H.teams) t.human = false; document.getElementById('goBtn').click(); };
  let pg = await apri('orizzontale', false);
  const mom = await pg.evaluate(prep => { eval('(' + prep + ')')(); const H = window.__pallanuoto; H.renderer.render = () => {}; H.senzaCorpi = true;
    let passo = null, tiro = null;
    for (let i = 0; i < 60 * 600; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); const B = H.ball, f = window.__frame;
      if (B.state === 'flight' && B.kind === 'pass' && B.flightT < 0.03) passo = { f, team: B.shooter.team.idx, dz: Math.abs(B.tz - B.z) };
      if (B.state === 'flight' && B.kind === 'shot' && B.flightT < 0.03) tiro = { f, team: B.shooter.team.idx, passo };
      const s = H.statistiche;
      if (tiro && tiro.passo && tiro.team === tiro.passo.team && tiro.passo.dz > 5 && tiro.f - tiro.passo.f < 130 && f - tiro.f < 40) {
        const dif = s[1 - tiro.team]; if (dif.parate > (window.__par || [0, 0])[1 - tiro.team]) return { passo: tiro.passo.f, tiro: tiro.f, parata: f, dif: 1 - tiro.team }; }
      window.__par = [s[0].parate, s[1].parate]; }
    return null; }, prepara.toString());
  await pg.context().close();
  if (!mom) console.log('sequenza del portiere: non trovata');
  else {
    pg = await apri('orizzontale', false);
    await pg.addStyleTag({ content: '#hud,#tac,#player,#cronaca,#tLog,#fight,#touch,#fps{display:none!important}' });
    await pg.evaluate(prep => { eval('(' + prep + ')')(); }, prepara.toString());
    const quando = [mom.passo + 2, Math.round((mom.passo + mom.tiro) / 2), mom.tiro + 2, mom.parata + 1], file = [];
    for (const [k, f] of quando.entries()) {
      await pg.evaluate(({ f, dif }) => { const H = window.__pallanuoto, gk = H.teams[dif].players[0], d = H.teams[dif].dir;
        const R = H.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; while (window.__frame < f - 1) { window.__frame++; window.__raf(window.__frame * 1000 / 60); }
        const gx = -12.5 * d; H.vista = { pos: [gx + d * 9.5, 5.2, 0], look: [gx + d * 1.5, 0, 0], fov: 34 }; R.render = window.__dis; window.__frame++; window.__raf(window.__frame * 1000 / 60); R.render = () => {}; H.vista = null; return gk.z; }, { f, dif: mom.dif });
      const nome = path.join(USCITA, `7-portiere-${k + 1}.png`); await pg.screenshot({ path: nome }); file.push(nome);
    }
    const titoli = ['1 · parte il passaggio', '2 · il portiere si sposta con la palla', '3 · parte il tiro', '4 · parata'];
    const p2 = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await p2.setContent(`<body style="margin:0;background:#111"><div id="c" style="display:grid;grid-template-columns:repeat(2,640px);gap:4px;padding:4px;width:max-content">${file.map((f, i) => `<div style="position:relative"><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}" style="display:block;width:640px"><b style="position:absolute;left:8px;top:5px;color:#fff;font:700 17px system-ui;text-shadow:0 1px 3px #000">${titoli[i]}</b></div>`).join('')}</div></body>`);
    await p2.waitForFunction('[...document.images].every(i => i.complete)', null, { polling: 100 });
    await p2.locator('#c').screenshot({ path: path.join(USCITA, '7-portiere-sequenza.png') });
    console.log('sequenza del portiere: fotogrammi', quando.join(', '));
  }
}
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log('Vetrina salvata in', USCITA);
