// Cambi volanti v0.82 (Ale: «cambi volanti: non quando l'attacco è già impostato; il sostituto deve entrare da metà campo con il
// cinque; niente passaggi a un giocatore appena entrato a 20 m»).
// 1. Il momento utile è la transizione: in attacco nei primi secondi del possesso o con la palla nella propria metà; mai ad attacco
//    impostato né in difesa. Vale anche per il computer, che prima cambiava in qualunque momento.
// 2. La zona dei cambi è vicino alla metà campo, dentro la propria metà (regole World Aquatics 2025, art. 18).
// 3. Il sostituto appena entrato non riceve la palla finché non arriva in attacco.
// 4. A gioco fermo con i cambi liberi il computer cambia subito chi è stanco.
// Uso: node tests/cambi-volanti-v082.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4339, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 31; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer, d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = d; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); document.getElementById('goBtn').click(); window.__salta(420);
  H.game.autoplay = true; for (const t of H.teams) t.human = false; });

// 1. momento utile: transizione sì, attacco impostato no, difesa no
const momenti = await pg.evaluate(() => {
  const H = window.__pallanuoto, P = H.panchina, t = H.teams[1], O = H.teams[0], g = H.game, gx = 12.5 * t.dir;
  H.replay?.interrompiReplay?.(); Object.assign(g, { state: 'play', after: null, penalty: null, cambiLiberi: false });
  const p = t.players[3], h = t.players[5];
  const metti = (xPalla, eta, nostra) => {
    const portatore = nostra ? h : O.players[5];
    portatore.x = xPalla; portatore.z = 1; H.regole.giveBall(portatore); H.ball.x = portatore.x; H.ball.z = portatore.z;
    g.possTeam = portatore.team; g.possT = g.time - eta;
    const r = { palla: +((H.ball.x - (-gx)) * t.dir).toFixed(1) };
    p.x = xPalla + t.dir * (xPalla * t.dir < 0 ? 9 : -9); p.z = -5;      // lontano dalla palla, dentro la vasca
    r.ok = P.momentoUtile(t, p); r.d = +Math.hypot(p.x - H.ball.x, p.z - H.ball.z).toFixed(1); return r;
  };
  return {
    transizione: metti(gx - t.dir * 15, 2, true),            // palla appena recuperata
    propriaMeta: metti(-gx + t.dir * 6, 12, true),           // palla ancora nella propria metà
    impostato: metti(gx - t.dir * 7, 14, true),              // attacco impostato a 7 m dalla porta
    difesa: metti(gx - t.dir * 15, 2, false),                // gli avversari hanno la palla
  };
});
prova(momenti.transizione.ok && momenti.propriaMeta.ok, `il cambio volante si fa in transizione (palla appena recuperata: ${momenti.transizione.ok}, palla nella propria metà: ${momenti.propriaMeta.ok}, a ${momenti.propriaMeta.palla} m dalla propria porta)`);
prova(!momenti.impostato.ok, `ad attacco impostato non si cambia (${momenti.impostato.ok})`);
prova(!momenti.difesa.ok, `in difesa non si cambia (${momenti.difesa.ok})`);

// 2. il computer aspetta il momento utile e il cinque avviene vicino alla metà campo
const volante = await pg.evaluate(() => {
  const H = window.__pallanuoto, P = H.panchina, t = H.teams[1], g = H.game, gx = 12.5 * t.dir;
  Object.assign(g, { state: 'play', after: null, penalty: null, cambiLiberi: false }); t.coda = []; t.cambio = null;
  const p = t.players[3], h = t.players[5], esce = p.num;
  p.x = gx - t.dir * 12; p.z = -5;      // lontano dalla palla
  for (const q of t.players) if (!q.isGK) q.stamina = 0.9;
  p.stamina = 0.2; t.prossimoControllo = 0;
  // attacco impostato: palla al 5 a 7 m dalla porta da 14 s, il 3 lontano dalla palla
  const impostato = () => { h.x = gx - t.dir * 7; h.z = 1; h.vx = h.vz = 0; if (H.ball.holder !== h) H.regole.giveBall(h); H.ball.x = h.x; H.ball.z = h.z; h.decideT = 99; h.reazioneT = 99; h.act = null; H.ball.holdTime = 0; g.possTeam = t; g.possT = g.time - 14; g.shot = 20; };
  for (let i = 0; i < 180; i++) { impostato(); window.__salta(1); }
  const r = { inCoda: (t.coda || []).some(x => x.esce === p), partitoImpostato: !!t.cambio };
  // la palla torna al portiere: transizione, il cambio parte
  const gk = t.players[0];
  const transizione = () => { if (H.ball.holder !== gk) H.regole.giveBall(gk); gk.decideT = 99; gk.reazioneT = 99; gk.act = null; H.ball.holdTime = 0; g.possTeam = t; };
  g.possT = g.time;
  let xCinque = null, fasi = [];
  for (let i = 0; i < 60 * 20 && p.num === esce; i++) {
    transizione(); window.__salta(1);
    if (t.cambio && !fasi.includes(t.cambio.fase)) fasi.push(t.cambio.fase);
    if (t.cambio && t.cambio.fase === 'cinque' && xCinque === null) xCinque = Math.abs(p.x - (-gx));
  }
  r.fasi = fasi; r.fatto = p.num !== esce; r.xCinque = xCinque; r.zona = P.PANCHINA.distZona;
  // 3. appena entrato e lontano dalla porta d'attacco: non è un appoggio
  const portatore = t.players[5]; portatore.x = gx - t.dir * 7; portatore.z = -2; H.regole.giveBall(portatore); g.possTeam = t;
  const scelte = new Set(); for (let k = 0; k < 30; k++) { const m = H.prova.bestPassTarget(portatore, true); if (m) scelte.add(m); }
  r.distanzaEntrato = Math.hypot(gx - p.x, p.z); r.servitoEntrato = scelte.has(p);
  return r;
});
prova(volante.inCoda && !volante.partitoImpostato, `ad attacco impostato il computer mette in coda il cambio del giocatore stanco e aspetta (in coda: ${volante.inCoda}, partito: ${volante.partitoImpostato})`);
prova(volante.fatto && volante.fasi.includes('cinque'), `in transizione il cambio parte, con il cinque (${volante.fasi.join(' → ')})`);
prova(volante.xCinque !== null && volante.xCinque > 9.5 && volante.xCinque < 12.5, `il cinque avviene vicino alla metà campo, nella propria metà: a ${volante.xCinque == null ? '-' : volante.xCinque.toFixed(1)} m dalla propria linea di porta (zona a ${volante.zona} m)`);
prova(volante.distanzaEntrato > 10.5 && !volante.servitoEntrato, `chi è appena entrato a ${volante.distanzaEntrato.toFixed(1)} m dalla porta non riceve la palla (scelto: ${volante.servitoEntrato})`);

// 4. dopo un gol (cambi liberi) il computer cambia subito chi è stanco
const liberi = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.teams[1], g = H.game;
  t.coda = []; t.cambio = null;
  for (const q of t.players) if (!q.isGK) q.stamina = 0.9;
  const stanchi = [t.players[2], t.players[4]]; for (const q of stanchi) q.stamina = 0.3;
  const prima = stanchi.map(q => q.num);
  g.state = 'stop'; g.timer = 1; g.after = null; g.cambiLiberi = true;
  window.__salta(3);
  return { prima, dopo: stanchi.map(q => q.num), stamine: stanchi.map(q => +q.stamina.toFixed(2)) };
});
prova(liberi.dopo.every((n, i) => n !== liberi.prima[i]) && liberi.stamine.every(s => s >= 0.7), `a gioco fermo con i cambi liberi il computer cambia subito i due stanchi (#${liberi.prima.join(', #')} → #${liberi.dopo.join(', #')})`);

prova(!errori.length, 'nessun errore nella pagina' + (errori.length ? ': ' + errori.slice(0, 2).join(' | ') : ''));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nCambi volanti v0.82: tutte le prove superate' : '\nCambi volanti v0.82: prove NON superate');
process.exit(ok ? 0 : 1);
