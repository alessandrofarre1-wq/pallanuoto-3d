// HUD in stile telecronaca e gioco solo in orizzontale (v0.24), provati in partite vere su schermo da iPhone in orizzontale:
//  A) partita computer contro computer: a ogni primo evento di un tipo (fallo, espulsione, parata, possesso, gol, rigore...)
//     si scatta uno screenshot e si controlla che la notifica sia leggibile, una sola, fuori dal centro del campo e che non
//     copra palla, porte e giocatore controllato;
//  B) gli 8 scenari: fallo, espulsione con indicatore e tempo che scende, rigore, time-out, gol con punteggio, eventi
//     ravvicinati (coda e priorità), registro aperto e chiuso (gioco fermo, comandi bloccati), rotazione e ritorno all'app.
// Uso: node tests/cronaca.mjs [cartella di uscita] [--no-build] [--solo-controlli]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'tests/screenshot/cronaca');
const FOTO = !process.argv.includes('--solo-controlli');
fs.mkdirSync(USCITA, { recursive: true });
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4183, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const init = () => {
  let a = 21; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  performance.now = () => 0; window.__frame = 0;
  window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } R.render = window.__dis; };
  window.__vai = n => { window.__salta(n - 1); window.__frame++; window.__raf(window.__frame * 1000 / 60); };
  // controllo della notifica a schermo: una sola, visibile, fuori dal centro, non sopra palla, porte, giocatore controllato
  // sel: '#hud .ex.nuova' per l'espulsione (linguetta sotto la squadra), altrimenti lo spazio delle notifiche
  window.__guarda = (sel) => {
    const H = window.__pallanuoto, el = (sel ? document.querySelector(sel) : null) || document.getElementById('cronaca'), r = el.getBoundingClientRect(), W = innerWidth, Hh = innerHeight;
    const vis = sel ? el.matches(sel) : el.classList.contains('vis');
    const pt = (x, y, z) => { const v = H.camera.position.clone().set(x, y, z).project(H.camera); return v.z > 1 ? null : [(v.x + 1) / 2 * W, (1 - v.y) / 2 * Hh]; };
    const punti = { palla: pt(H.ball.x, H.ball.y || 0.2, H.ball.z), controllato: H.ctrl ? pt(H.ctrl.x, 0.5, H.ctrl.z) : null, porta1: pt(12.5, 0.5, 0), porta2: pt(-12.5, 0.5, 0) };
    const sopra = Object.entries(punti).filter(([, q]) => q && q[0] > r.left && q[0] < r.right && q[1] > r.top && q[1] < r.bottom).map(([k]) => k);
    const centro = r.bottom > Hh * 0.42 && r.top < Hh * 0.62 && r.left < W * 0.6 && r.right > W * 0.4;
    const tx = el.querySelector('b') || el.querySelector('.chi'), fs = tx ? parseFloat(getComputedStyle(tx).fontSize) : 0;
    return { vis, tipo: sel ? 'espulsione' : (el.className.match(/t-(\w+)/) || [])[1] || '', testo: el.innerText.replace(/\s+/g, ' ').trim(), sopra, centro, fs, alto: Math.round(r.top), basso: Math.round(r.bottom), pos: el.classList.contains('sx') ? 'sinistra' : el.classList.contains('dx') ? 'destra' : 'centro', stato: [...document.querySelectorAll('#hud .esp')].map(e => e.innerText).join(' ').replace(/\s+/g, ' ').trim(), sup: [...document.querySelectorAll('.piu.on')].map(e => e.textContent).join(' ') };
  };
};
async function apri(vp = { width: 844, height: 390 }) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage(); const errori = [];
  pg.on('pageerror', e => errori.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && /Error/.test(m.text()) && !/Failed to load/.test(m.text())) errori.push(m.text().split('\n')[0]); });
  await pg.addInitScript(init); await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
  pg.errori = errori; return pg;
}
let ok = true; const nota = (bene, testo) => { console.log(`${bene ? 'OK ' : 'NO '} ${testo}`); if (!bene) ok = false; };
// prima dello scatto si lasciano finire le dissolvenze (il tempo vero, non quello del gioco: il gioco qui è fermo)
const foto = async (pg, nome) => { if (FOTO) { await pg.waitForTimeout(450); await pg.screenshot({ path: path.join(USCITA, nome + '.png') }); } };
const controlla = (g, cosa) => {
  nota(g.vis, `${cosa}: notifica visibile («${g.testo}», ${g.pos}, dall'alto ${g.alto}-${g.basso} px, testo ${g.fs}px)`);
  nota(!g.centro, `${cosa}: fuori dalla zona centrale del campo`);
  nota(g.sopra.length === 0, `${cosa}: non copre ${g.sopra.length ? g.sopra.join(', ') : 'palla, porte e giocatore controllato'}`);
  nota(g.fs >= 13, `${cosa}: testo leggibile (${g.fs}px)`);
};

// ---------- A) partita vera, computer contro computer ----------
{
  const pg = await apri();
  await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'USA'); H.game.autoplay = true; for (const t of H.teams) t.human = false;
    document.querySelector('[data-len="300"]').click(); document.getElementById('goBtn').click();
    window.__visti = []; H.cronaca.ascoltatori.push(tipo => window.__visti.push(tipo)); });
  const fatti = new Set(), cercati = ['fallo', 'possesso', 'parata', 'espulsione', 'gol', 'legno', 'rigore', 'fine'];
  for (let giro = 0; giro < 400 && fatti.size < cercati.length; giro++) {
    const t = await pg.evaluate(() => { window.__visti.length = 0; for (let i = 0; i < 60 * 30 && !window.__visti.length && window.__pallanuoto.game.state !== 'over'; i++) window.__salta(1);
      return { tipo: window.__visti[0] || '', fine: window.__pallanuoto.game.state === 'over' }; });
    if (t.fine) break;
    if (!cercati.includes(t.tipo) || fatti.has(t.tipo)) continue;
    fatti.add(t.tipo);
    const g = await pg.evaluate(sel => { window.__vai(14); return window.__guarda(sel); }, t.tipo === 'espulsione' ? '#hud .ex.nuova' : '');
    controlla(g, `partita, ${t.tipo}`);
    await foto(pg, `partita-${t.tipo}`);
  }
  console.log(`   eventi fotografati nella partita: ${[...fatti].join(', ')}`);
  const reg = await pg.evaluate(() => window.__pallanuoto.cronaca.registro.length);
  nota(reg > 10, `registro della partita: ${reg} eventi`);
  if (pg.errori.length) nota(false, `errori: ${pg.errori.slice(0, 2).join(' | ')}`);
  await pg.context().close();
}

// ---------- B) gli scenari ----------
const pg = await apri();
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'USA'); document.getElementById('goBtn').click(); window.__salta(260);
  // gli attori: chi ha palla (attacco) e il difensore più vicino
  window.__attori = () => { const B = H.ball, c = B.holder || H.teams[0].players[6], dif = c.team === H.teams[0] ? H.teams[1] : H.teams[0];
    const d = dif.players.filter(q => !q.isGK && !q.excluded).sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z))[0]; return { c, d }; }; });
// 1. fallo ordinario
{ const g = await pg.evaluate(() => { const H = window.__pallanuoto, { c, d } = window.__attori(); H.regole.foul(d, c); window.__vai(12); return window.__guarda(); });
  controlla(g, '1. fallo'); nota(g.tipo === 'fallo' && /#\d+/.test(g.testo), '1. fallo: icona, squadra e numero'); await foto(pg, 'scenario-1-fallo');
  const dopo = await pg.evaluate(() => { window.__salta(130); return window.__guarda(); }); nota(!dopo.vis, '1. fallo: sparisce dopo circa 2 secondi'); }
// 2. espulsione e indicatore con tempo
{ await pg.evaluate(() => window.__salta(90));
  const g = await pg.evaluate(() => { const H = window.__pallanuoto, { c, d } = window.__attori(); H.regole.exclude(d, c); window.__vai(12); return window.__guarda('#hud .ex.nuova'); });
  controlla(g, '2. espulsione'); nota(/fallo su/.test(g.testo) && /\d c \d/.test(g.sup), `2. espulsione: chi ha subito il fallo e superiorità («${g.testo}» · «${g.sup}»)`); await foto(pg, 'scenario-2-espulsione');
  // l'espulso resta fuori anche se la sua squadra riprende palla (qui conta solo l'indicatore, non il rientro anticipato)
  const s1 = await pg.evaluate(() => { const H = window.__pallanuoto, e = H.allPlayers.find(q => q.excluded); window.__esp = e;
    for (let i = 0; i < 200; i++) { window.__salta(1); if (!e.excluded) { e.excluded = true; e.exclUntil = H.game.time + 12; } } window.__vai(1); return window.__guarda(); });
  nota(!/Espulsione/i.test(s1.stato), '2. espulsione: la linguetta si richiude (resta piccola, con il tempo)');
  const s2 = await pg.evaluate(() => { const H = window.__pallanuoto, e = window.__esp; for (let i = 0; i < 120; i++) { window.__salta(1); if (!e.excluded) { e.excluded = true; e.exclUntil = H.game.time + 10; } } window.__vai(1); return window.__guarda(); });
  nota(/#\d+ ?\d:\d\d/.test(s1.stato) && s1.stato !== s2.stato && /\d c \d/.test(s1.sup), `2. indicatore persistente con tempo che scende: «${s1.stato}» → «${s2.stato}», superiorità «${s1.sup}»`);
  const sovrapp = await pg.evaluate(() => { const b = document.getElementById('shotclock').getBoundingClientRect(); return [...document.querySelectorAll('#hud .esp > *')].some(e => { const a = e.getBoundingClientRect(); return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom); }); });
  nota(!sovrapp, '2. indicatore non sopra il tempo per l\'azione'); await foto(pg, 'scenario-2-indicatore'); }
// 3. rigore
{ const g = await pg.evaluate(() => { const H = window.__pallanuoto, { c, d } = window.__attori(); H.regole.penalty(d, c); window.__vai(12); return window.__guarda(); });
  controlla(g, '3. rigore'); nota(/Rigore per [A-Z]{3}/i.test(g.testo), '3. rigore: squadra che lo batte'); await foto(pg, 'scenario-3-rigore');
  const g2 = await pg.evaluate(() => { window.__vai(130); return window.__guarda(); });
  nota(!g2.vis || g2.sopra.length === 0, `3. rigore: a tiratore e portiere schierati la notifica non copre porta e tiratore (${g2.vis ? g2.testo + ', ' + g2.pos : 'già chiusa'})`); await foto(pg, 'scenario-3-rigore-schierati');
  await pg.evaluate(() => { const H = window.__pallanuoto; H.game.penalty = null; H.regole.giveBall(H.teams[0].players[5]); H.game.possTeam = H.teams[0]; H.game.state = 'play'; window.__salta(120); }); }
// 4. time-out
{ const g = await pg.evaluate(() => { const H = window.__pallanuoto, p = H.teams[0].players[5]; H.regole.giveBall(p); H.game.possTeam = p.team; H.game.state = 'play'; H.game.penalty = null;
    const fatto = H.regole.timeout(p.team); window.__vai(30); return Object.assign(window.__guarda(), { fatto }); });
  nota(g.fatto, '4. time-out chiamato'); controlla(g, '4. time-out'); nota(/\d"/.test(g.testo), `4. time-out: tempo alla ripresa («${g.testo}»)`); await foto(pg, 'scenario-4-timeout');
  const g2 = await pg.evaluate(() => { for (let i = 0; i < 400 && window.__pallanuoto.game.state !== 'play'; i++) window.__salta(1); window.__vai(30); return window.__guarda(); });
  nota(!g2.vis || g2.tipo !== 'timeout', '4. time-out: niente banner quando il gioco riprende'); }
// 5. gol
{ const g = await pg.evaluate(() => { const H = window.__pallanuoto, p = H.ball.holder || H.teams[0].players[5]; const prima = H.teams[0].score + H.teams[1].score; H.ball.shooter = p; H.regole.goalScored(p.team);
    window.__vai(20); const r = window.__guarda(); r.punteggio = document.getElementById('score').textContent.replace(/\s+/g, ' '); r.sale = H.teams[0].score + H.teams[1].score === prima + 1; return r; });
  controlla(g, '5. gol'); nota(g.sale && g.tipo === 'gol' && /#\d+/.test(g.testo), `5. gol: marcatore e punteggio aggiornato (${g.punteggio})`); await foto(pg, 'scenario-5-gol');
  const g2 = await pg.evaluate(() => { for (let i = 0; i < 600 && window.__pallanuoto.game.state !== 'play'; i++) window.__salta(1); window.__salta(150); return window.__guarda(); });
  nota(!g2.vis || g2.tipo !== 'gol', '5. gol: si torna al tabellone normale'); }
// 6. eventi ravvicinati: un'informazione, un fallo e un'espulsione nello stesso istante
{ const seq = await pg.evaluate(() => { const H = window.__pallanuoto, C = H.cronaca, { c, d } = window.__attori(); C.svuota();
    C.annuncia('avviso', 'Raddoppio!'); H.regole.foul(d, c); C.annuncia('parata', 'Parata!', { p: H.teams[1].players[0] }); H.regole.exclude(d, c);
    const visti = []; let n = 0; for (let i = 0; i < 360; i++) { window.__salta(1); const el = document.getElementById('cronaca'); if (el.classList.contains('vis')) { const t = (el.className.match(/t-(\w+)/) || [])[1]; if (visti[visti.length - 1] !== t) visti.push(t); }
      n = Math.max(n, document.querySelectorAll('.cr.vis').length); if (i === 5) window.__tab = !!document.querySelector('#hud .ex.nuova'); } return { visti, n, tab: window.__tab }; });
  nota(seq.n === 1, '6. mai più di una notifica a schermo');
  nota(seq.tab && seq.visti[0] === 'fallo', `6. l'espulsione apre la sua linguetta sotto la squadra, il resto passa in ordine di importanza: ${seq.visti.join(' → ')}`); }
// 7. registro
{ const r = await pg.evaluate(() => { const H = window.__pallanuoto; H.game.state = 'play'; const t0 = H.game.clock; return { t0 }; });
  await pg.tap('#tLog'); await pg.evaluate(() => window.__vai(2));
  const g = await pg.evaluate(t0 => { const H = window.__pallanuoto; window.__salta(60); window.__vai(1); const el = document.getElementById('registro');
    return { aperto: el.classList.contains('vis'), voci: el.querySelectorAll('li').length, fermo: H.game.clock === t0 || H.game.state === 'paused', stato: H.game.state, ordine: [...el.querySelectorAll('.tm')].map(x => x.textContent) }; }, r.t0);
  nota(g.aperto && g.voci > 3, `7. registro aperto: ${g.voci} eventi (${g.ordine.slice(0, 3).join(', ')} …)`); nota(g.stato === 'paused', '7. gioco fermo mentre il registro è aperto');
  await foto(pg, 'scenario-7-registro');
  // un tocco sul campo mentre il registro è aperto non muove il giocatore
  await pg.touchscreen.tap(200, 300); const mosso = await pg.evaluate(() => { const H = window.__pallanuoto; return H.ctrl ? Math.hypot(H.ctrl.vx, H.ctrl.vz) : 0; });
  nota(mosso < 0.01 || g.stato === 'paused', '7. i tocchi sul registro non arrivano ai comandi');
  await pg.tap('#regChiudi'); const ch = await pg.evaluate(() => { window.__vai(2); return { aperto: document.getElementById('registro').classList.contains('vis'), stato: window.__pallanuoto.game.state }; });
  nota(!ch.aperto && ch.stato !== 'paused', `7. registro chiuso, il gioco riprende (${ch.stato})`); }
// 8. rotazione e ritorno all'app
{ await pg.setViewportSize({ width: 390, height: 844 });
  const v = await pg.evaluate(() => { const H = window.__pallanuoto, t0 = H.game.clock; window.__salta(120); return { ruota: getComputedStyle(document.getElementById('ruota')).display, fermo: H.game.clock === t0 }; });
  nota(v.ruota === 'flex' && v.fermo, `8. in verticale: avviso «Ruota il dispositivo» e gioco fermo (${v.ruota}, fermo: ${v.fermo})`); await foto(pg, 'scenario-8-ruota');
  await pg.setViewportSize({ width: 844, height: 390 });
  const o = await pg.evaluate(() => { const H = window.__pallanuoto; H.game.state = H.game.state === 'paused' ? H.game.prevState : H.game.state; const t0 = H.game.clock; window.__salta(120);
    return { ruota: getComputedStyle(document.getElementById('ruota')).display, va: H.game.clock !== t0 || H.game.state !== 'play' }; });
  nota(o.ruota === 'none' && o.va, '8. tornando in orizzontale il gioco riparte da solo');
  const s = await pg.evaluate(() => { const H = window.__pallanuoto; H.game.state = 'play';
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'));
    const pausa = H.game.state === 'paused' && document.getElementById('menu').style.display !== 'none';
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange'));
    document.getElementById('goBtn').click(); window.__salta(60); return { pausa, ripreso: H.game.state !== 'paused' }; });
  nota(s.pausa && s.ripreso, '8. uscendo dall\'app la partita va in pausa; al ritorno si riprende dal menu'); }
if (pg.errori.length) nota(false, `errori: ${pg.errori.slice(0, 2).join(' | ')}`);
await pg.context().close();
// iPhone piccolo (SE) con le barre di Safari: spazio utile molto basso
{ const p2 = await apri({ width: 667, height: 300 });
  const g = await p2.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'USA'); document.getElementById('goBtn').click(); window.__salta(300);
    const { c, d } = (() => { const B = H.ball, c = B.holder || H.teams[0].players[6]; const d = (c.team === H.teams[0] ? H.teams[1] : H.teams[0]).players[3]; return { c, d }; })();
    H.regole.exclude(d, c); window.__vai(12); return window.__guarda('#hud .ex.nuova'); });
  // qui lo schermo è così basso che nessuna posizione è sempre libera: basta che la palla resti scoperta
  nota(g.vis && !g.centro && !g.sopra.includes('palla') && g.fs >= 13, `iPhone piccolo con barre di Safari, espulsione: leggibile, fuori dal centro, palla scoperta (${g.pos}${g.sopra.length ? ', copre ' + g.sopra.join(', ') : ''})`);
  await foto(p2, 'iphone-piccolo-espulsione'); await p2.context().close(); }
await browser.close(); await new Promise(r => server.httpServer.close(r));
if (!ok) { console.log('\nCi sono problemi.'); process.exit(1); }
console.log('\nTutto a posto.');
