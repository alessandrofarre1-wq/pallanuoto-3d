// Prove della sezione 2 (v0.29): sprint a tocchi ripetuti e contrasto a tre livelli (disturbo, pressione, fallo).
// Uso: node tests/sezione2.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4331, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage();
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 13; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = window.__dis; };
  window.__tasto = (code, giu) => window.dispatchEvent(new KeyboardEvent(giu ? 'keydown' : 'keyup', { code }));
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'USA'); H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(400); });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };

// ---------- 2.1 sprint ----------
const sprint = await pg.evaluate(() => {
  const H = window.__pallanuoto, quota = (fn, frame) => { let on = 0; for (let i = 0; i < frame; i++) { fn(i); window.__salta(1); if (H.inp.sprint) on++; } return on / frame; };
  H.ctrl.stamina = 1;
  const tenuto = quota(i => { if (i === 0) window.__tasto('ShiftLeft', true); }, 120); window.__tasto('ShiftLeft', false); window.__salta(60);
  H.ctrl.stamina = 1;
  const lenti = quota(i => { if (i % 40 === 0) window.__tasto('ShiftLeft', true); if (i % 40 === 2) window.__tasto('ShiftLeft', false); }, 120); window.__salta(60);
  H.ctrl.stamina = 1;
  const veloci = quota(i => { if (i % 10 === 0) window.__tasto('ShiftLeft', true); if (i % 10 === 2) window.__tasto('ShiftLeft', false); }, 120); window.__salta(60);
  return { tenuto, lenti, veloci };
});
prova(sprint.tenuto < 0.3, `tenendo premuto: scatto solo per il ${Math.round(sprint.tenuto * 100)}% dei 2 secondi (poi velocità normale)`);
prova(sprint.lenti > 0.2 && sprint.lenti < 0.7, `un tocco ogni 0,66 s: scatto per il ${Math.round(sprint.lenti * 100)}% del tempo`);
prova(sprint.veloci > 0.9, `un tocco ogni 0,16 s: scatto per il ${Math.round(sprint.veloci * 100)}% del tempo`);

// ---------- 2.2 contrasto: difende il giocatore ----------
const dif = await pg.evaluate(() => {
  const H = window.__pallanuoto, R = H.regole, out = {};
  const prepara = () => { H.game.state = 'play'; H.game.after = null; for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.stunUntil = 0; q.colpi = []; q.tackleCD = 0; q.pressatoUntil = 0; }
    const c = H.teams[1].players[3], d = H.teams[0].players[3]; R.giveBall(c); c.x = 0; c.z = 0; c.fx = -1; c.fz = 0; c.vx = c.vz = 0; d.x = -0.9; d.z = 0; d.vx = d.vz = 0; d.fx = 1; d.fz = 0;
    window.__pallanuoto.__setCtrl(d); return { c, d }; };
  const tocco = () => { window.__tasto('Space', true); window.__salta(1); window.__tasto('Space', false); window.__salta(1); };
  let { c } = prepara(); const r0 = H.cronaca.registro.length;
  tocco(); window.__salta(2);
  out.pressato = c.pressatoUntil > H.game.time; out.puoTirare = H.prova.startAct(c, 'shot', 0.1, () => {}) !== false;
  out.falli1 = H.cronaca.registro.slice(r0).filter(e => /Fallo|Espulsione|Rigore/.test(e.testo)).length;
  out.girato = (() => { window.__salta(20); const d = H.teams[0].players[3]; return (c.fx * (c.x - d.x) + c.fz * (c.z - d.z)) > 0; })();
  ({ c } = prepara()); const r1 = H.cronaca.registro.length;
  const d0 = H.teams[0].players[3];
  for (let k = 0; k < 3; k++) { // l'attaccante resta lì (altrimenti passa e la prova perde il bersaglio)
    c.decideT = 9; c.x = 0; c.z = 0; c.vx = c.vz = 0; d0.x = -0.9; d0.z = 0; tocco(); window.__salta(28); }
  out.falli3 = H.cronaca.registro.slice(r1).filter(e => /Fallo|Espulsione|Rigore/.test(e.testo)).map(e => e.testo);
  return out;
});
prova(dif.pressato && !dif.puoTirare, `1 tocco: l'attaccante è sotto pressione e non può tirare (pressione ${dif.pressato}, tiro ${dif.puoTirare ? 'permesso' : 'bloccato'})`);
prova(dif.falli1 === 0, `1 tocco: nessun fallo (${dif.falli1})`);
prova(dif.girato, "l'attaccante si gira di spalle al difensore a proteggere la palla");
prova(dif.falli3.length >= 1, `3 tocchi in 1,5 s: ${dif.falli3.join(', ') || 'nessun fallo'}`);

// ---------- 2.2 contrasto: difende il computer (stessa regola) ----------
const ia = await pg.evaluate(() => {
  const H = window.__pallanuoto, R = H.regole; let pressioni = 0, falli = 0, prove = 30;
  for (let k = 0; k < prove; k++) {
    H.game.state = 'play'; H.game.after = null; for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.stunUntil = 0; q.colpi = []; q.tackleCD = 0; q.pressatoUntil = 0; }
    const c = H.teams[0].players[3]; R.giveBall(c); c.x = 2; c.z = 0; c.vx = c.vz = 0; c.fx = 1; c.fz = 0;
    const d = H.teams[1].players[H.teams[1].players.findIndex(q => q.i === 3)]; d.x = 2.8; d.z = 0;
    const r0 = H.cronaca.registro.length; let visto = false;
    for (let i = 0; i < 90; i++) { window.__salta(1); if (c.pressatoUntil > H.game.time) visto = true; if (H.ball.holder !== c) break; }
    if (visto) pressioni++; falli += H.cronaca.registro.slice(r0).filter(e => /Fallo|Espulsione|Rigore/.test(e.testo)).length ? 1 : 0;
    window.__salta(60);
  }
  return { pressioni, falli, prove };
});
prova(ia.pressioni >= ia.prove * 0.3, `il computer in difesa mette sotto pressione chi ha palla: ${ia.pressioni} volte su ${ia.prove}`);
prova(ia.falli <= ia.prove * 0.5, `il computer insiste fino al fallo di rado: ${ia.falli} falli su ${ia.prove} prove`);
if (errori.length) prova(false, 'errori: ' + errori.slice(0, 2).join(' | '));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nSezione 2: tutte le prove superate' : '\nSezione 2: prove NON superate');
process.exit(ok ? 0 : 1);
