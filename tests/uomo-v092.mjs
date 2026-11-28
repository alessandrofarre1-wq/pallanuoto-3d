// Uomo in più che si muove (v0.92, Ale: «sull'uomo in più quasi non fanno schemi e anche l'AI del mio attacco ho notato che lo schema
// non parte o se parte i movimenti sono impercettibili»):
// 1. tutti gli schemi del computer hanno più fasi (niente «4-2 classico» fermo);
// 2. la squadra del giocatore che non chiama niente parte da sola dopo UOMO_SCHEMI.auto s con il primo dei suoi schemi che si muove;
// 3. se il giocatore sceglie la base (tasto 4) lo schema automatico non parte;
// 4. dopo l'ultima fase lo schema ricomincia dalla prima finché dura la superiorità;
// 5. nei cambi di fase chi deve spostarsi di più di 0,8 m nuota deciso invece di scivolare sulle gambe.
// Uso: node tests/uomo-v092.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4475, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 844, height: 390 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 17; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer, d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { window.__tieni?.(); now += 1000 / 60; window.__raf(now); } R.render = d; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };

const r = await pg.evaluate(() => {
  const H = window.__pallanuoto, U = H.uomo, G = H.game, t = H.teams[0], O = H.teams[1], out = {};
  // 1. schemi del computer
  out.computer = U.SCELTI_COMPUTER.map(id => [id, U.trova(id)?.fasi.length || 0]);
  H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(300);
  t.human = true; G.autoplay = false;
  // superiorità per l'Italia: un ungherese escluso, palla ferma al mezzo destro (4) a 5,6 m dalla porta (nessun contrasto, nessun tiro)
  const esp = O.players[3], h = t.players[4];
  const ferma = () => {
    H.replay?.interrompiReplay?.(); G.state = 'play'; G.after = null; G.penalty = null; H.fight.active = false;
    if (H.ball.holder !== h) H.regole.giveBall(h);
    h.x = 12.5 * t.dir - t.dir * 5.6; h.z = 2.5 * t.dir; h.decideT = 99; h.reazioneT = 99; h.act = null; H.ball.holdTime = 0;
    esp.excluded = true; esp.exclUntil = G.time + 999; esp.alPozzetto = false; esp.puoRientrare = false; esp.x = -30;
    for (const q of O.players) { q.tackleCD = 9; q.colpi = []; }
  };
  window.__tieni = ferma;
  const nuovaSuperiorita = () => { esp.excluded = false; window.__tieni = null; window.__salta(3); window.__tieni = ferma; ferma(); };
  // 2. nessuna chiamata: prima di UOMO_SCHEMI.auto s niente, poi parte da solo il primo schema che si muove
  nuovaSuperiorita(); window.__salta(30);
  out.primaAuto = t.uomo ? t.uomo.schema.id : null;
  window.__salta(120);
  out.auto = t.uomo ? { id: t.uomo.schema.id, fasi: t.uomo.schema.fasi.length, auto: !!t.uomo.auto } : null;
  out.atteso = U.scelti().find(s => s.fasi.length > 1)?.id || null;
  // 3. il giocatore sceglie la base (tasto 4): niente schema automatico
  nuovaSuperiorita(); window.__salta(20); H.regole.callPlay(3); window.__salta(200);
  out.base = t.uomo ? t.uomo.schema.id : null;
  // 4 e 5. il giocatore chiama il secondo dei suoi schemi (3-3 che diventa 4-2: 2,5 s e 5 s): fasi in ordine, poi di nuovo la prima;
  // al cambio di fase, chi deve spostarsi di più di 0,8 m: strada fatta in 2 s rispetto a quella richiesta
  nuovaSuperiorita(); window.__salta(10); H.regole.callPlay(1);
  out.chiamato = t.uomo?.schema.id || null;
  const sequenza = [t.uomo?.fase]; const gx = 12.5 * t.dir; let misura = null;
  for (let k = 0; k < 60 * 14 && t.uomo; k++) {
    window.__salta(1);
    const f = t.uomo.fase;
    if (f !== sequenza.at(-1)) {
      sequenza.push(f);
      if (!misura && f === 1) {
        const posti = t.uomo.schema.fasi[1].posti;
        misura = t.players.filter(p => !p.isGK && !p.excluded && p !== h && p !== H.ctrl).map(p => { const [d, z] = posti[p.i - 1]; return { p, x: p.x, z: p.z, richiesto: Math.hypot(p.x - (gx - t.dir * d), p.z - z * t.dir) }; }).filter(e => e.richiesto > 0.8);
        misura.k = k;
      }
    }
    if (misura && misura.fatto == null && k - misura.k >= 120) misura.fatto = misura.reduce((s, e) => s + Math.min(e.richiesto, Math.hypot(e.p.x - e.x, e.p.z - e.z)), 0) / Math.max(0.01, misura.reduce((s, e) => s + e.richiesto, 0));
    if (sequenza.length >= 4) break;
  }
  out.sequenza = sequenza; out.giri = t.uomo?.giri ?? null;
  out.decisi = misura ? { n: misura.length, quota: misura.fatto != null ? +misura.fatto.toFixed(2) : null } : null;
  window.__tieni = null;
  return out;
});
prova(r.computer.every(([, n]) => n > 1), `schemi del computer tutti con più fasi (${r.computer.map(([id, n]) => id + ' ' + n).join(', ')})`);
prova(r.primaAuto === null, 'nei primi secondi il giocatore può chiamare lui: nessuno schema imposto subito');
prova(r.auto && r.auto.auto && r.auto.fasi > 1 && r.auto.id === r.atteso, `senza chiamata dopo 2 s parte da solo il primo schema che si muove (${r.auto ? r.auto.id + ', ' + r.auto.fasi + ' fasi' : 'nessuno'}; atteso ${r.atteso})`);
prova(r.base === null, `scelta la base (tasto 4) lo schema automatico non parte (${r.base || 'nessuno schema'})`);
prova(r.chiamato === 'u33-42' && r.sequenza.slice(0, 4).join('') === '0101' && r.giri >= 1, `dopo l'ultima fase si ricomincia dalla prima (fasi ${r.sequenza.map(f => f + 1).join(' → ')}, ripetizioni ${r.giri})`);
prova(r.decisi && r.decisi.n > 0 && r.decisi.quota >= 0.7, `al cambio di fase chi deve spostarsi nuota deciso: in 2 s ${r.decisi ? Math.round(r.decisi.quota * 100) + '% della strada (' + r.decisi.n + ' giocatori; senza il nuoto deciso 72%)' : '-'}`);
prova(errori.length === 0, `nessun errore nella pagina${errori.length ? ': ' + errori.join(' | ') : ''}`);
await browser.close(); await new Promise(res => server.httpServer.close(res));
console.log(ok ? '\nUomo in più v0.92: tutte le prove superate' : '\nUomo in più v0.92: PROVE FALLITE');
process.exit(ok ? 0 : 1);
