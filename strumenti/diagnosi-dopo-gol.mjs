// Diagnosi della segnalazione di Ale (v0.50): «dopo il primo gol i giocatori nuotano al contrario».
// Partita vera computer contro computer con replay del gol: per ogni giocatore disteso che nuota
// confronta la direzione del corpo DISEGNATO (testa meno bacino, ossa vere) e quella della fisica (fx,fz)
// con la velocità, prima e dopo il primo gol.
// Uso: node strumenti/diagnosi-dopo-gol.mjs [--dist=cartella] [--secondi=400] [--porta=4412]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => process.argv.find(x => x.startsWith('--' + k + '='))?.slice(k.length + 3);
const dist = arg('dist'), secondi = +(arg('secondi') || 400), porta = +(arg('porta') || 4412);
if (!dist && !process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: { outDir: dist || 'dist' }, preview: { port: porta, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 640, height: 300 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 33; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__passo = () => { now += 1000 / 60; window.__raf(now); }; window.__umano = location.search.includes('umano');
});
await pg.goto(server.resolvedUrls.local[0] + (process.argv.includes('--umano') ? '?umano' : ''));
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 120000, polling: 100 });
const r = await pg.evaluate(async (secondi) => {
  const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click();
  H.game.autoplay = true; for (const t of H.teams) t.human = false; if (window.__umano) H.teams[0].human = true;
  const R = H.renderer, rendi = R.render.bind(R); let disegni = 0; R.render = (...a) => { disegni++; if (disegni % 30 === 0) rendi(...a); };
  const fasi = [{ nome: 'prima del 1° gol', n: 0, corpoIndietro: 0, fisicaIndietro: 0, esempi: [] }, { nome: 'dopo il 1° gol', n: 0, corpoIndietro: 0, fisicaIndietro: 0, esempi: [] }];
  const gol0 = () => H.teams[0].score + H.teams[1].score;
  let fase = 0, tGol = null; const P = { x: 0, y: 0, z: 0 };
  for (let k = 0; k < secondi * 60; k++) {
    window.__passo();
    if (fase === 0 && gol0() > 0) { fase = 1; tGol = H.game.time; }
    if (H.game.state !== 'play') continue;
    const F = fasi[fase];
    for (const p of H.allPlayers) {
      if (p.excluded || p.uscendo) continue;
      const sp = Math.hypot(p.vx, p.vz); if (sp < 0.5 || (p.oriz || 0) < 0.5) continue;
      const O = p.mesh?.corpo?.ossa; if (!O) continue;
      const h = O.testa.getWorldPosition(new O.testa.position.constructor()), b = O.bacino.getWorldPosition(new O.testa.position.constructor());
      const bx = h.x - b.x, bz = h.z - b.z, L = Math.hypot(bx, bz) || 1;
      const corpo = (bx * p.vx + bz * p.vz) / (L * sp), fisica = (p.fx * p.vx + p.fz * p.vz) / sp;
      F.n++; if (corpo < 0) F.corpoIndietro++; if (fisica < 0) F.fisicaIndietro++;
      if (corpo < 0 && F.esempi.length < 12) F.esempi.push({ gk: p.isGK, sp: +sp.toFixed(2), oriz: +p.oriz.toFixed(2), st: H.game.state, act: p.act?.kind||null, t: +H.game.time.toFixed(2), sq: p.team.short, num: p.num, corpo: +corpo.toFixed(2), fisica: +fisica.toFixed(2), dir: p.team.dir, rotY: +p.mesh.g.rotation.y.toFixed(2), fx: +p.fx.toFixed(2), fz: +p.fz.toFixed(2) });
    }
    if (fase === 1 && H.game.time - tGol > 15) break;
  }
  return { fasi, tGol, gol: H.teams.map(t => t.score) };
}, secondi);
console.log(JSON.stringify({ build: dist || 'attuale', ...r, errori: errori.slice(0, 3) }, null, 1));
await browser.close(); server.httpServer.close();
