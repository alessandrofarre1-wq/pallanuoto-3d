// Prove della sezione 1 (v0.28): palla che vola fuori e ripresa giusta, tasto Cambia, contatto frontale con la palla.
// Uso: node tests/sezione1.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4330, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage();
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 11; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = window.__dis; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'USA'); H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(400); });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };

// ---------- 1.1 palla fuori dal fondo: continua a volare, poi la ripresa giusta ----------
const fuori = await pg.evaluate(() => {
  const H = window.__pallanuoto, B = H.ball, ris = {};
  const tira = (toccoDifesa, z, vy) => {
    const att = H.teams[0], p = att.players[6], gx = 12.5 * att.dir;
    H.game.state = 'play'; H.game.after = null; for (const q of H.allPlayers) { q.act = null; q.excluded = false; }
    B.holder = null; B.state = 'flight'; B.kind = 'rebound'; B.daTiro = true; B.shooter = p; B.intercept = new Set(); B.flightT = 0.5; B.saveChecked = true; B.pickupCD = 9;
    B.lastTeam = att; B.toccoDifesa = toccoDifesa ? H.teams[1] : null; B.ignora = null; B.inRete = false; B.inUscita = false;
    B.x = gx - att.dir * 1.0; B.y = 0.6; B.z = z; B.vx = att.dir * 6; B.vy = vy; B.vz = 0; B.wx = B.wy = B.wz = 0;
    const traccia = []; let annuncio = '';
    const prima = H.cronaca.registro ? H.cronaca.registro.length : 0;
    for (let i = 0; i < 160; i++) { window.__salta(1); traccia.push([B.x, B.y, B.z, B.state]); }
    const r = H.cronaca.registro || []; annuncio = r.slice(prima).map(e => e.testo + ' ' + (e.dettaglio || '')).join(' | ');
    const oltre = Math.max(...traccia.map(q => Math.abs(q[0])));
    return { oltre, annuncio, finale: B.state, chi: B.holder ? (B.holder.isGK ? 'portiere' : 'giocatore') + ' ' + B.holder.team.short : '-' };
  };
  ris.fuori = tira(false, 2.6, 1.0);
  ris.angolo = tira(true, 0.0, 4.5);
  return ris;
});
prova(fuori.fuori.oltre > 13.5, `tiro fuori: la palla vola oltre la linea fino a ${fuori.fuori.oltre.toFixed(1)} m (linea a 12,5)`);
prova(/Rimessa dal portiere/.test(fuori.fuori.annuncio) && fuori.fuori.chi === 'portiere USA', `tiro fuori: ${fuori.fuori.annuncio} → palla al ${fuori.fuori.chi}`);
prova(fuori.angolo.oltre > 13.0 && /angolo/i.test(fuori.angolo.annuncio), `deviata sopra la traversa dal difensore: vola fino a ${fuori.angolo.oltre.toFixed(1)} m · ${fuori.angolo.annuncio}`);

// ---------- 1.2 Cambia: sempre al compagno più vicino alla palla, anche durante un gesto ----------
const cambio = await pg.evaluate(() => {
  const H = window.__pallanuoto, B = H.ball, out = [];
  const premi = () => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyQ' })); window.__salta(1); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyQ' })); window.__salta(1); };
  for (let k = 0; k < 6; k++) {
    window.__salta(90);
    const T = H.teams[0]; if (B.holder && B.holder.team === T) { const o = H.teams[1].players[6]; H.regole.giveBall(o); window.__salta(2); }
    const prima = H.ctrl; if (!prima) continue;
    if (k % 2 === 0) prima.act = { kind: 'pass', t: 0, wind: 0.5, frusta: 0.1, done: false, fn: () => {} };      // durante un gesto
    const atteso = T.players.filter(m => m !== prima && !m.excluded && !m.isGK).sort((a, b) => Math.hypot(a.x - B.x, a.z - B.z) - Math.hypot(b.x - B.x, b.z - B.z))[0];
    premi();
    out.push({ ok: H.ctrl === atteso, gesto: k % 2 === 0, cambiato: H.ctrl !== prima });
    prima.act = null;
  }
  return out;
});
prova(cambio.length >= 5 && cambio.every(c => c.ok && c.cambiato), `Cambia: passa al compagno più vicino alla palla in ${cambio.filter(c => c.ok).length} prove su ${cambio.length} (metà durante un gesto)`);

// ---------- 1.3 portatore che nuota addosso a un difensore fermo ----------
const contatto = await pg.evaluate(() => {
  const H = window.__pallanuoto; let falli = 0, prove = 40, laterali = 0;
  for (let k = 0; k < prove * 2; k++) {
    const frontale = k < prove;
    H.game.state = 'play'; H.game.after = null;
    const c = H.teams[0].players[3], d = H.teams[1].players[3];
    for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.stunUntil = 0; q.sfondaT = 0; }
    H.regole.giveBall(c);
    c.x = 0; c.z = 0; c.fx = 1; c.fz = 0; c.vx = 2.0; c.vz = 0; c.oriz = 1;
    d.x = frontale ? 0.82 : 0.1; d.z = frontale ? 0 : 0.81; d.vx = d.vz = 0;
    const prima = (H.cronaca.registro || []).length;
    window.__salta(3);
    const nuovi = (H.cronaca.registro || []).slice(prima).filter(e => /Fallo in attacco/.test(e.testo)).length;
    if (nuovi) { if (frontale) falli++; else laterali++; }
    window.__salta(80);
  }
  return { falli, laterali, prove };
});
prova(contatto.falli > 0 && contatto.falli < contatto.prove, `contatto frontale a 2 m/s: fallo in attacco ${contatto.falli} volte su ${contatto.prove} (non sempre)`);
prova(contatto.laterali === 0, `contatto di lato: ${contatto.laterali} falli in attacco su ${contatto.prove}`);
if (errori.length) prova(false, 'errori: ' + errori.slice(0, 2).join(' | '));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nSezione 1: tutte le prove superate' : '\nSezione 1: prove NON superate');
process.exit(ok ? 0 : 1);
