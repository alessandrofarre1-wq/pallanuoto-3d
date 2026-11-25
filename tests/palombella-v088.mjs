// Palombella e scelta del tiro (v0.88, Ale: «puoi anche togliere il tasto della palomba e puoi gestirla in questo modo: da fuori area,
// se il giocatore che ha la palla in mano è in buona posizione e il portiere sta fuori dai pali può comparire il tasto palomba, a quel
// punto lo puoi premere con prontezza ma non è detto che sia gol; da dentro l'area la palomba diventa semplicemente un tipo di tiro: se
// il portiere esce dai pali TIRO sceglie la palomba, se non esce un tiro potente e teso, in controfuga anche lo schizzo (se non è troppo
// stanco e ha qualità) o il colonnello (se è meno stanco e ha qualità)»). Schizzo e colonnello con un tocco di TIRO; tenuto, il tiro normale.
// Uso: node tests/palombella-v088.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4475, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 19; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; const d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { window.__tieni?.(); now += 1000 / 60; window.__raf(now); } R.render = d; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(200); });

// scena: il nostro giocatore (players[4]) a «d» metri dalla porta avversaria, il portiere avversario a «fuori» metri dalla sua linea;
// «controfuga»: palla appena recuperata, in nuotata verso la porta e nessun difensore davanti
const scena = o => pg.evaluate(o => {
  const H = window.__pallanuoto, g = H.game, it = H.teams[0], hu = H.teams[1], gx = 12.5 * it.dir;
  H.replay?.interrompiReplay?.(); window.__tieni = null;
  for (const t of H.teams) t.human = t === it;
  g.autoplay = false; g.state = 'play'; g.after = null; g.penalty = null; H.fight.active = false; g.shot = 28;
  for (const q of H.allPlayers) Object.assign(q, { act: null, excluded: false, charging: false, chargeT: 0, pressatoUntil: 0, freeThrow: false, vx: 0, vz: 0,
    fakeCount: 0, qte: null, qteDopo: 0, stunUntil: g.time + 99, tackleCD: 99, colpi: [], decideT: 99, reazioneT: 99, oriz: 0, voloPronto: false });
  for (const q of hu.players) if (!q.isGK) { q.x = -gx * 0.6; q.z = (q.i - 3) * 2; }
  for (const q of it.players) if (!q.isGK) { q.x = -gx * 0.2; q.z = (q.i - 3) * 2; }
  const p = it.players[4], gk = hu.players.find(q => q.isGK);
  p.s = { ...p.s, pre: o.pre ?? 85 }; p.stamina = o.energia ?? 1; p.mano = 'D';
  if (o.usc) gk.s = { ...gk.s, usc: o.usc };
  const tieni = () => {
    p.x = gx - it.dir * o.d; p.z = o.z ?? 0; p.fx = it.dir; p.fz = 0; p.stunUntil = 0; p.decideT = 99; p.stamina = o.energia ?? 1; p.pressatoUntil = 0;
    if (o.controfuga) { p.vx = it.dir * 1.3; p.vz = 0; p.oriz = 0.6; } else { p.vx = p.vz = 0; p.oriz = 0; }
    if (o.fuori != null) { gk.x = gx - it.dir * o.fuori; gk.z = 0; gk.vx = gk.vz = 0; }
  };
  tieni(); H.regole.giveBall(p); H.__setCtrl(p); g.possTeam = it; g.possT = o.controfuga ? g.time : g.time - 20;
  window.__tieni = () => { if (!p.act || p.act.kind === 'fake') tieni(); };
  window.__salta(3);
}, o);
const stato = () => pg.evaluate(() => {
  const H = window.__pallanuoto, p = H.teams[0].players[4], b = document.querySelector('.tb[data-b="lob"]');
  return { qte: p.qte?.tipo || null, palomba: document.body.classList.contains('palomba'), bottone: b ? getComputedStyle(b).display !== 'none' : false,
    scritta: document.querySelector('.tb[data-b="shoot"] small')?.textContent, gesto: p.act?.kind || null, lob: H.ball.state === 'flight' ? !!H.ball.lob : null,
    kind: H.ball.state === 'flight' ? H.ball.kind : null, scelta: H.palombella.sceltaTiroArea(p) };
});
const tocco = async (tasto, fotogrammi = 6) => { await pg.keyboard.down(tasto); await pg.evaluate(n => window.__salta(n), fotogrammi); await pg.keyboard.up(tasto); await pg.evaluate(() => window.__salta(2)); };
const dopo = n => pg.evaluate(n => window.__salta(n), n);

// 1. dentro l'area, portiere sulla linea: TIRO = tiro normale (tocco = polso)
await scena({ d: 4, fuori: 0.7 }); let s = await stato();
prova(s.scelta === null && s.scritta === 'tocco: polso' && !s.bottone, `dentro l'area con il portiere in porta: TIRO tira normale (scritta «${s.scritta}», niente tasto palombella)`);
await tocco('KeyK'); s = await stato();
prova(s.gesto === 'polso' || s.lob === false, `un tocco di TIRO = tiro di polso, non palombella (${s.gesto}, palombella ${s.lob})`);
// 2. dentro l'area, portiere fuori dai pali: TIRO = palombella
await scena({ d: 4, fuori: 2.2 }); s = await stato();
prova(s.scelta === 'lob' && s.scritta === 'palombella', `dentro l'area con il portiere fuori dai pali TIRO sceglie la palombella (scritta «${s.scritta}»)`);
await tocco('KeyK'); const g2 = (await stato()).gesto; await dopo(30); s = await stato();
prova(g2 === 'lob' && s.lob === true, `TIRO fa la palombella (gesto ${g2}, palla in volo a parabola: ${s.lob})`);
// 3. fuori area, buona posizione, portiere fuori dai pali: compare il tasto, premuto = palombella
await scena({ d: 8, fuori: 2.2 }); s = await stato();
prova(s.qte === 'lob' && s.palomba && s.bottone, `fuori area con il portiere fuori dai pali compare il tasto PALOMB. (${s.qte}, visibile ${s.bottone})`);
await tocco('KeyL', 2); const g3 = (await stato()).gesto; await dopo(30); s = await stato();
prova(g3 === 'lob' && s.lob === true, `premuto subito: palombella (gesto ${g3}, palla a parabola: ${s.lob})`);
// 4. il tasto dura poco: se non si preme sparisce
await scena({ d: 8, fuori: 2.2 }); await dopo(90); s = await stato();
prova(!s.qte && !s.bottone, `non premuto entro 1,2 s il tasto sparisce (${s.qte}, visibile ${s.bottone})`);
// 5. fuori area con il portiere in porta, troppo lontano o troppo angolato: niente tasto, L non fa nulla
await scena({ d: 8, fuori: 0.7 }); s = await stato(); await tocco('KeyL', 2); const s5 = await stato();
prova(!s.qte && !s.bottone && !s5.gesto && s5.lob === null, `fuori area con il portiere in porta niente tasto e L non tira (${s.qte}, gesto ${s5.gesto})`);
await scena({ d: 11, fuori: 2.2 }); const lontano = await stato();
await scena({ d: 8, z: 6, fuori: 2.2 }); const angolato = await stato();
prova(!lontano.qte && !angolato.qte, `niente tasto da 11 m o troppo angolati (${lontano.qte}, ${angolato.qte})`);
// 6. controfuga dentro l'area, portiere in porta: schizzo o colonnello secondo energia e Precisione
const speciale = async (o, fotogrammi = 4) => { await scena({ d: 5, fuori: 0.7, controfuga: true, ...o }); const a = await stato(); await tocco('KeyK', fotogrammi); const b = await stato(); return { scelta: a.scelta, scritta: a.scritta, gesto: b.gesto }; };
const fresco = await speciale({ energia: 0.9 }), medio = await speciale({ energia: 0.45 }), stanco = await speciale({ energia: 0.2 }), scarso = await speciale({ energia: 0.9, pre: 60 });
prova(fresco.gesto === 'colonnello' && fresco.scritta === 'tocco: colonnello', `controfuga, fresco e preciso: il tocco fa il colonnello (${fresco.gesto}, scritta «${fresco.scritta}»)`);
prova(medio.gesto === 'schizzo', `controfuga, un po' stanco: schizzo (${medio.gesto})`);
prova(stanco.gesto !== 'schizzo' && stanco.gesto !== 'colonnello' && scarso.gesto !== 'schizzo' && scarso.gesto !== 'colonnello',
  `troppo stanco o poca Precisione: tiro normale (${stanco.gesto}, ${scarso.gesto})`);
const tenuto = await speciale({ energia: 0.9 }, 40);
prova(tenuto.gesto && tenuto.gesto !== 'schizzo' && tenuto.gesto !== 'colonnello', `controfuga, TIRO tenuto: tiro normale (v0.81: ${tenuto.gesto})`);
await scena({ d: 5, fuori: 0.7 }); s = await stato();
prova(s.scelta === null, `nell'attacco schierato niente speciali (${s.scelta})`);
// 7. il portiere del computer esce dai pali nella controfuga avversaria, di più con Uscita alta
const uscita = usc => pg.evaluate(async usc => {
  const H = window.__pallanuoto, g = H.game, it = H.teams[0], hu = H.teams[1], gx = 12.5 * it.dir, gk = hu.players.find(q => q.isGK), p = it.players[4];
  window.__tieni = null; gk.s = { ...gk.s, usc }; gk.x = gx - it.dir * 0.7; gk.z = 0; gk.vx = gk.vz = 0; gk.stunUntil = 0;
  const tieni = () => { p.x = gx - it.dir * 7; p.z = 0; p.vx = it.dir * 1.3; p.oriz = 0.6; p.decideT = 99; p.act = null; };
  tieni(); H.regole.giveBall(p); g.possTeam = it; g.possT = g.time; window.__tieni = tieni; window.__salta(90);
  return +Math.abs(gk.x - gx).toFixed(2);
}, usc);
const alta = await uscita(95), bassa = await uscita(40);
prova(alta > 1.6 && bassa < 1.3, `il portiere esce dai pali nella controfuga: ${alta} m dalla linea con Uscita 95, ${bassa} m con Uscita 40`);
prova(errori.length === 0, `nessun errore nella pagina${errori.length ? ': ' + errori.join(' | ') : ''}`);
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nPalombella v0.88: tutte le prove superate' : '\nPalombella v0.88: PROVE FALLITE');
process.exit(ok ? 0 : 1);
