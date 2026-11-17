// v0.55 (scelta di Ale): sul telefono un tocco su TIRO è una finta, tenuto e lasciato è un tiro; un tocco mentre arriva un passaggio
// è un tiro al volo; i passaggi sono più tesi e arrivano alla mano alzata. Uso: node tests/finta-v055.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4474, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 11; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; const d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = d; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
// i pulsanti touch si premono con il DOM vero
const tocco = async (ms) => {
  await pg.evaluate(() => { const b = document.querySelector('[data-b="shoot"]'), r = b.getBoundingClientRect();
    const t = new Touch({ identifier: 7, target: b, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 });
    b.dispatchEvent(new TouchEvent('touchstart', { touches: [t], targetTouches: [t], changedTouches: [t], bubbles: true, cancelable: true })); });
  await pg.evaluate(n => window.__salta(n), Math.round(ms / 1000 * 60));
  await pg.evaluate(() => { const b = document.querySelector('[data-b="shoot"]'), r = b.getBoundingClientRect();
    const t = new Touch({ identifier: 7, target: b, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 });
    b.dispatchEvent(new TouchEvent('touchend', { touches: [], targetTouches: [], changedTouches: [t], bubbles: true, cancelable: true })); });
};
const prepara = () => pg.evaluate(() => {
  const H = window.__pallanuoto, it = H.teams[0], hu = H.teams[1], gx = 12.5 * it.dir;
  H.game.state = 'play'; H.game.after = null; H.game.penalty = null; H.fight.active = false; H.game.shot = 28;
  for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.charging = false; q.chargeT = 0; q.pressatoUntil = 0; q.freeThrow = false; q.vx = q.vz = 0; q.fakeCount = 0; }
  for (const q of hu.players) { if (q.isGK) continue; q.x = -gx * 0.6; q.z = (q.i - 3) * 2; q.stunUntil = H.game.time + 99; q.tackleCD = 99; }
  const p = it.players[4]; p.x = gx - it.dir * 8; p.z = 2; H.regole.giveBall(p); H.__setCtrl(p); p.decideT = 99;
  window.__salta(5);
});
const stato = () => pg.evaluate(() => { const H = window.__pallanuoto, p = H.teams[0].players[4];
  return { tiene: H.ball.holder === p, finte: p.fakeCount || 0, palla: H.ball.state, tipo: H.ball.kind, gesto: p.act && p.act.kind }; });

await prepara(); await tocco(80); await pg.evaluate(() => window.__salta(30)); const a = await stato();
prova(a.tiene && a.finte === 1, `un tocco su TIRO = una finta, palla ancora in mano (finte ${a.finte}, palla ${a.tiene ? 'in mano' : a.palla})`);
await prepara(); for (let k = 0; k < 3; k++) { await tocco(80); await pg.evaluate(() => window.__salta(28)); } const b = await stato();
prova(b.tiene && b.finte === 3, `tre tocchi = tre finte di fila (${b.finte})`);
await prepara(); await tocco(250); await pg.evaluate(() => window.__salta(30)); const c = await stato();
prova(!c.tiene && c.tipo === 'shot', `tenuto 0,25 s e lasciato = tiro di polso (palla ${c.palla}, ${c.tipo})`);
await prepara(); await tocco(900); await pg.evaluate(() => window.__salta(40)); const d = await stato();
prova(!d.tiene && d.tipo === 'shot', `tenuto 0,9 s e lasciato = tiro caricato (palla ${d.palla}, ${d.tipo})`);
// tiro al volo: passaggio a un compagno vicino alla porta, un tocco su TIRO mentre la palla vola
await pg.evaluate(() => { const H = window.__pallanuoto, it = H.teams[0], gx = 12.5 * it.dir, p = it.players[4], m = it.players[2];
  H.game.state = 'play'; H.game.after = null; H.game.penalty = null;
  m.x = gx - it.dir * 5; m.z = -3; m.vx = m.vz = 0; m.decideT = 99; p.x = gx - it.dir * 9; p.z = 3; H.regole.giveBall(p); H.__setCtrl(p); p.act = null;
  H.prova.doPass(p, m); window.__vPass = Math.hypot(H.ball.vx, H.ball.vz); window.__salta(3); });
await tocco(60);
// si guarda il primo secondo dopo il tocco: il tiro al volo parte appena arriva la palla (poi il portiere può già averla parata)
const v = await pg.evaluate(() => { const H = window.__pallanuoto, m = H.teams[0].players[2]; let tipo = null, stato = null, tiratore = false;
  for (let i = 0; i < 60 && !tiratore; i++) { window.__salta(1); if (H.ball.kind === 'shot' && H.ball.shooter === m) { tipo = 'shot'; stato = H.ball.state; tiratore = true; } }
  return { velocita: window.__vPass, tipo, stato, tiratore }; });
prova(v.velocita >= 11, `passaggio teso: ${v.velocita.toFixed(1)} m/s alla partenza (prima 8,5-12)`);
prova(v.tipo === 'shot' && v.tiratore, `un tocco su TIRO mentre arriva il passaggio = tiro al volo di chi riceve (${v.tipo}, ${v.stato})`);
prova(errori.length === 0, `nessun errore nella pagina${errori.length ? ': ' + errori.join(' | ') : ''}`);
console.log(ok ? '\nFinta e tiro al volo: tutte le prove superate' : '\nFinta e tiro al volo: prove NON superate');
await browser.close(); server.httpServer.close(); process.exit(ok ? 0 : 1);
