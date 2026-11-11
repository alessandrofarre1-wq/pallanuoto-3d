// Verifica automatica di Pallanuoto 3D.
//   npm run verifica             partite simulate + screenshot confrontati con quelli di riferimento
//   npm run verifica:aggiorna    come sopra, e gli screenshot nuovi diventano il riferimento
// Opzioni: --screenshot-non-bloccanti (differenze negli screenshot = solo avviso), --no-legacy (non confrontare le partite con la v0.9 in legacy/), --riferimento-da-legacy
// (rifà gli screenshot di riferimento dalla v0.9), --partite=N (quante partite per tipo, predefinito 3).
//
// Come funziona: il caso (Math.random) e l'orologio sono sostituiti con versioni fisse, così la stessa
// partita si ripete identica. Finché le regole non cambiano, la versione nuova deve giocare le STESSE
// partite della v0.9 (stessi punteggi, stesse posizioni fotogramma per fotogramma).
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = k => args.includes('--' + k);
const N_PARTITE = +(args.find(a => a.startsWith('--partite=')) || '--partite=3').split('=')[1];
const DIR = path.join(ROOT, 'tests/screenshot');
const LEGACY = path.join(ROOT, 'legacy/index.html');
// la v0.9 caricava Three.js r128 da internet: qui le si dà la copia locale, con il generatore di codici degli oggetti
// (funzione interna "ct") sostituito da un contatore, così non consuma il caso del gioco
const UUID_R128 = 'function ct(){';
let THREE_R128 = fs.readFileSync(path.join(ROOT, 'legacy/three-r128.min.js'), 'utf8');
if (THREE_R128.split(UUID_R128).length !== 2) throw new Error('three-r128.min.js: generatore di codici non trovato');
THREE_R128 = THREE_R128.replace(UUID_R128, UUID_R128 + 'return "u"+(window.__u=(window.__u||0)+1);') + ';window.__riparti();';

// ---------- codice eseguito dentro la pagina ----------
function initPagina({ seed, legacy }) {
  let a = seed >>> 0;
  const caso = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  // Il caso ripetibile deve servire SOLO al gioco, non a Three.js (che pesca numeri casuali per dare un codice a ogni
  // oggetto, in quantità diversa da versione a versione). Versione nuova: il gioco usa window.__rnd. v0.9: gioco e
  // Three.js usano entrambi Math.random, quindi lì il generatore di codici di Three.js viene sostituito (vedi apri()).
  if (legacy) { Math.random = caso; window.__riparti = () => { a = seed >>> 0; }; }
  else window.__rnd = caso;
  performance.now = () => 0;
  window.__raf = null; window.__frame = 0;
  window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__step = n => { for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } };
}
function giocaPartita({ bot, seed, maxFrames }) {
  const H = window.__H; H.renderer.render = () => {};
  // eventi: ogni messaggio a schermo viene contato
  const eventi = {}, msg = document.getElementById('msg');
  const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  Object.defineProperty(msg, 'innerHTML', { get() { return d.get.call(this); }, set(v) {
    const k = String(v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().replace(/#\d+.*/, '').replace(/\d+° tempo \d/, 'conto alla rovescia').slice(0, 40);
    eventi[k] = (eventi[k] || 0) + 1; d.set.call(this, v); } });
  // giocatore finto: preme tasti a caso (con un suo generatore, per non toccare il caso del gioco)
  let b = seed >>> 0; const r = () => { b = Math.imul(b ^ b >>> 15, 0x2c1b3c6d) + 0x9e3779b9 | 0; return ((b ^ b >>> 13) >>> 0) / 4294967296; };
  const TASTI = [['KeyW', .02, 90], ['KeyS', .02, 90], ['KeyA', .02, 90], ['KeyD', .03, 120], ['ShiftLeft', .01, 150], ['Space', .012, 6], ['KeyK', .012, 70],
    ['KeyL', .002, 5], ['KeyQ', .004, 5], ['KeyE', .006, 5], ['Digit1', .001, 5], ['Digit2', .001, 5], ['Digit3', .001, 5], ['Digit4', .001, 5], ['KeyT', .0003, 5], ['KeyC', .0003, 5]];
  const giu = {};
  const tasto = (tipo, code) => window.dispatchEvent(new KeyboardEvent(tipo, { code }));
  const impronte = []; let h = 0x811c9dc5, tiri = 0, inVolo = false, voloT = 0, f = 0;
  const n5 = v => v == null ? 'x' : v;
  document.getElementById('goBtn').click();
  for (; f < maxFrames && H.game.state !== 'over'; f++) {
    if (bot) for (const [code, p, durata] of TASTI) {
      if (giu[code]) { if (--giu[code] === 0) tasto('keyup', code); }
      else if (r() < p) { giu[code] = 1 + Math.floor(r() * durata); tasto('keydown', code); }
    }
    window.__step(1);
    const B = H.ball, volo = B.state === 'flight' && B.kind === 'shot';
    if (volo && (!inVolo || B.flightT < voloT)) tiri++;
    inVolo = volo; voloT = B.flightT;
    if (f % 30 === 0) {
      let s = [H.game.state, H.game.period, H.game.clock, H.game.shot, H.game.time, B.state, B.x, B.y, B.z, H.teams[0].score, H.teams[1].score, n5(H.ctrl && H.ctrl.uid), H.fight.v].join(',');
      for (const p of H.allPlayers) s += '|' + [p.x, p.z, p.vx, p.vz, p.fx, p.fz, p.stamina, p.excluded, p.pf, p.num].join(',');
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
      impronte.push(h >>> 0);
    }
  }
  for (const code in giu) if (giu[code]) tasto('keyup', code);
  return { impronte, fotogrammi: f, finita: H.game.state === 'over', punteggio: H.teams[0].score + '-' + H.teams[1].score, tiri, gol: H.teams[0].score + H.teams[1].score, eventi };
}
function confrontaImmagini([a, b]) {
  const carica = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
  return Promise.all([carica(a), carica(b)]).then(([ia, ib]) => {
    if (ia.width !== ib.width || ia.height !== ib.height) return { diversi: 1, max: 255, nota: 'dimensioni diverse' };
    const px = i => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
    const A = px(ia), B = px(ib); let n = 0, max = 0;
    for (let i = 0; i < A.length; i += 4) { const m = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])); if (m > max) max = m; if (m > 12) n++; }
    return { diversi: n / (A.length / 4), max };
  });
}

// ---------- apertura delle due versioni ----------
const VISTE = {
  desktop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  'iphone-verticale': { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true },
  'iphone-orizzontale': { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true },
};
const SCENE = [   // nome, vista, fotogrammi dopo aver premuto GIOCA (0 = resta nel menu)
  ['1-menu', 'desktop', 0], ['2-sprint-iniziale', 'desktop', 420], ['3-azione', 'desktop', 1500],
  ['4-iphone-verticale', 'iphone-verticale', 700], ['5-iphone-orizzontale', 'iphone-orizzontale', 700],
];
let browser, server, urlNuova;
const errori = [];
async function apri(versione, vista, seed) {
  const ctx = await browser.newContext(VISTE[vista]);
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errori.push(`[${versione}] ${e.message}`));
  pg.on('console', m => { if (m.type() === 'error') errori.push(`[${versione}] console: ${m.text()}`); });
  await pg.addInitScript(initPagina, { seed, legacy: versione === 'legacy' });
  if (versione === 'legacy') {
    await pg.route('**/three.min.js', r => r.fulfill({ body: THREE_R128, contentType: 'application/javascript' }));
    await pg.goto('file://' + LEGACY);
    await pg.evaluate('window.__H = { game, teams, ball, allPlayers, fight, renderer, get ctrl(){ return ctrl; } }');
  } else {
    await pg.goto(urlNuova);
    await pg.waitForFunction('window.__pallanuoto && window.__raf');
    await pg.evaluate('window.__H = window.__pallanuoto');
  }
  return pg;
}
async function scatta(versione, [nome, vista, frames]) {
  const pg = await apri(versione, vista, 7);
  // si disegna davvero solo l'ultimo fotogramma (disegnarli tutti senza scheda grafica richiederebbe minuti)
  await pg.evaluate(n => {
    const R = window.__H.renderer, disegna = R.render; R.render = () => {};
    if (n) document.getElementById('goBtn').click();
    window.__step((n || 30) - 1); R.render = disegna; window.__step(1);
  }, frames);
  const png = await pg.screenshot();
  await pg.context().close();
  return png;
}
const dataUrl = buf => 'data:image/png;base64,' + buf.toString('base64');

// ---------- esecuzione ----------
let ok = true;
const fallito = t => { ok = false; console.log('  ✗ ' + t); };
console.log('Costruzione del gioco (vite build)…');
await build({ root: ROOT, logLevel: 'warn' });
server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4179, strictPort: false, host: '127.0.0.1' } });
urlNuova = server.resolvedUrls.local[0];
browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const conLegacy = !opt('no-legacy') && fs.existsSync(LEGACY);

console.log(`\nPartite simulate (${N_PARTITE} senza comandi + ${N_PARTITE} con un giocatore finto che preme tasti a caso)`);
let totTiri = 0, totGol = 0; const totEventi = {};
for (const bot of [false, true]) for (let s = 1; s <= N_PARTITE; s++) {
  const gioca = async v => { const pg = await apri(v, 'desktop', s * 1000 + (bot ? 1 : 0)); const r = await pg.evaluate(giocaPartita, { bot, seed: s * 77 + 5, maxFrames: 60 * 60 * 25 }); await pg.context().close(); return r; };
  const n = await gioca('nuova');
  totTiri += n.tiri; totGol += n.gol; for (const k in n.eventi) totEventi[k] = (totEventi[k] || 0) + n.eventi[k];
  let esito = '';
  if (conLegacy) {
    const l = await gioca('legacy');
    let i = 0; while (i < n.impronte.length && n.impronte[i] === l.impronte[i]) i++;
    const uguali = i === n.impronte.length && l.impronte.length === n.impronte.length && l.punteggio === n.punteggio && l.tiri === n.tiri;
    esito = uguali ? ' · identica alla v0.9' : ` · DIVERSA dalla v0.9 dal secondo ${(i / 2).toFixed(1)} (v0.9: ${l.punteggio}, ${l.tiri} tiri)`;
    if (!uguali) fallito(`partita ${s}${bot ? ' con comandi' : ''} diversa dalla v0.9`);
  }
  if (!n.finita) fallito(`partita ${s} non arrivata alla fine`);
  console.log(`  partita ${s}${bot ? ' con comandi' : '            '}: ${n.punteggio}, ${n.tiri} tiri, ${Math.round(n.fotogrammi / 60)} s${esito}`);
}
console.log(`  totale: ${totGol} gol su ${totTiri} tiri = ${(100 * totGol / totTiri).toFixed(0)}% di conversione`);
console.log('  eventi: ' + Object.entries(totEventi).filter(([k]) => k !== 'conto alla rovescia').sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));

console.log('\nScreenshot');
for (const d of ['riferimento', 'attuale', 'confronto']) fs.mkdirSync(path.join(DIR, d), { recursive: true });
const pgCfr = await browser.newPage({ viewport: { width: 1300, height: 800 } });
for (const scena of SCENE) {
  const nome = scena[0] + '.png', fRif = path.join(DIR, 'riferimento', nome);
  if (opt('riferimento-da-legacy')) fs.writeFileSync(fRif, await scatta('legacy', scena));
  const nuovo = await scatta('nuova', scena);
  fs.writeFileSync(path.join(DIR, 'attuale', nome), nuovo);
  if (!fs.existsSync(fRif) || opt('aggiorna')) { fs.writeFileSync(fRif, nuovo); console.log(`  ${nome}: salvato come riferimento`); continue; }
  const rif = fs.readFileSync(fRif);
  const c = await pgCfr.evaluate(confrontaImmagini, [dataUrl(rif), dataUrl(nuovo)]);
  const perc = (c.diversi * 100).toFixed(2);
  if (c.diversi > 0.005 && opt('screenshot-non-bloccanti')) console.log(`  ! ${nome}: ${perc}% dei punti diverso dal riferimento (solo avviso)`);
  else if (c.diversi > 0.005) fallito(`${nome}: ${perc}% dei punti diverso dal riferimento${c.nota ? ' (' + c.nota + ')' : ''}`);
  else console.log(`  ✓ ${nome}: ${c.diversi === 0 && c.max === 0 ? 'identico al riferimento' : perc + '% dei punti diverso (entro la tolleranza)'}`);
  // immagine affiancata prima/dopo, da guardare a occhio
  const largo = scena[1] !== 'iphone-verticale';
  await pgCfr.setContent(`<body style="margin:0;background:#111;font:700 20px system-ui;color:#fff"><div id="c" style="display:inline-flex;flex-direction:${largo ? 'column' : 'row'};gap:10px;padding:10px">
    ${[['PRIMA (riferimento)', rif], ['DOPO (versione attuale)', nuovo]].map(([t, b]) => `<div><div style="padding:4px 0 8px">${t}</div><img src="${dataUrl(b)}" style="display:block;width:${largo ? 1000 : 390}px"></div>`).join('')}</div></body>`);
  await pgCfr.waitForFunction('[...document.images].every(i => i.complete)');
  await pgCfr.locator('#c').screenshot({ path: path.join(DIR, 'confronto', nome) });
}
await browser.close(); await new Promise(r => server.httpServer.close(r));
if (errori.length) { ok = false; console.log('\nErrori nella pagina:\n  ' + [...new Set(errori)].slice(0, 20).join('\n  ')); }
console.log(ok ? '\n✓ Verifica superata' : '\n✗ Verifica NON superata');
process.exit(ok ? 0 : 1);
