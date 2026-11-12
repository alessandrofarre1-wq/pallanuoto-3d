// Bilanciamento: partite "computer contro computer" a durata vera (4 tempi da 8 minuti) e tabella dei numeri per squadra.
// Uso: node tests/bilancio.mjs [--partite=20] [--squadre=ITA,HUN] [--tempo=480] [--no-build] [--salva=file.json]
// Obiettivi (docs/tattica.md): 7-13 espulsioni per squadra, superiorità trasformate 30-60%, 1-2 rigori per squadra,
// circa 40% dei tiri in gol, gol soprattutto dal perimetro e in superiorità.
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const N = +arg('partite', 20), DURATA = arg('tempo', '480'), OPZ = arg('opzioni', ''), SQ = arg('squadre', 'ITA,HUN'), ARB = arg('arbitro', '');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4175, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errori = [], partite = [];
for (let n = 1; n <= N; n++) {
  const pg = await browser.newPage();
  pg.on('console', m => { const t = m.text(); if (m.type() === 'error' && /Error/.test(t) && !/Failed to load resource/.test(t)) { const e = t.split('\n')[0]; if (!errori.includes(e)) { errori.push(e); console.log('  errore nel gioco:', t.slice(0, 300)); } } });
  pg.on('pageerror', e => { errori.push(e.message); console.log('  errore nella pagina:', e.message, (e.stack || '').split('\n').slice(1, 4).join(' ')); });
  await pg.addInitScript(seed => {
    let a = seed; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    performance.now = () => 0; window.__frame = 0;
    window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
    window.__step = n => { for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } };
  }, n * 7919);
  await pg.goto(server.resolvedUrls.local[0] + (OPZ ? '?' + OPZ : ''));
  try { await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 }); }
  catch (e) { console.log('  la pagina non parte:', await pg.evaluate(() => JSON.stringify([!!window.__pallanuoto, !!window.__raf, window.__pallanuoto && window.__pallanuoto.modelloPronto, document.readyState, performance.getEntriesByType('resource').map(r => r.name.split('/').pop() + ':' + Math.round(r.responseEnd))]))); throw e; }
  const r = await pg.evaluate(({ durata, sq, arb }) => {
    const H = window.__pallanuoto; H.renderer.render = () => {}; H.senzaCorpi = true;
    if (sq) H.scegliSquadre(...sq.split(','));
    H.game.autoplay = true; for (const t of H.teams) t.human = false;
    const b = document.querySelector(`[data-len="${durata}"]`); if (b) b.click();
    if (arb) document.querySelector(`[data-arb="${arb}"]`).click();
    document.getElementById('goBtn').click();
    // palla vagante: quanto resta ferma in acqua senza che nessuno ci vada (nessuno entro un metro e mezzo né in nuotata verso di lei)
    let f = 0, sola = 0, solaMax = 0, vag = 0, vagMax = 0; const B = H.ball;
    for (; f < 60 * 60 * 90 && H.game.state !== 'over'; f++) {
      window.__step(1);
      if (H.game.state === 'play' && B.state === 'free') {
        vag++; if (vag > vagMax) vagMax = vag;
        const va = H.allPlayers.some(p => { if (p.excluded) return false; const dx = B.x - p.x, dz = B.z - p.z, d = Math.hypot(dx, dz), v = Math.hypot(p.vx, p.vz); return d < 1.5 || (v > 0.25 && (p.vx * dx + p.vz * dz) / (v * d) > 0.6); });
        sola = va ? 0 : sola + 1; if (sola > solaMax) solaMax = sola;
      } else { vag = 0; sola = 0; }
    }
    return { finita: H.game.state === 'over', secondi: Math.round(f / 60), squadre: H.statistiche, pallaSola: solaMax / 60, pallaVagante: vagMax / 60 };
  }, { durata: DURATA, sq: SQ, arb: ARB });
  await pg.close();
  partite.push(r);
  console.log(`  partita ${n}: ${r.squadre.map(s => `${s.nome} ${s.gol}`).join(' - ')}${r.finita ? '' : '  (NON finita)'}`);
}
await browser.close(); await new Promise(r => server.httpServer.close(r));
// medie per squadra a partita
const tutte = partite.flatMap(p => p.squadre), M = k => tutte.reduce((s, x) => s + x[k], 0) / tutte.length, S = k => tutte.reduce((s, x) => s + x[k], 0);
const tipi = Object.keys(tutte[0].golTipo), golTot = S('gol');
const sintesi = { partite: N, tempo: +DURATA, gol: M('gol'), tiri: M('tiri'), conversione: 100 * S('gol') / S('tiri'), inPorta: 100 * S('inPorta') / S('tiri'), parate: M('parate'),
  espulsioni: M('espulsioni'), superiorita: M('superiorita'), superioritaTrasformate: 100 * S('superioritaGol') / Math.max(1, S('superiorita')), rigori: M('rigori'), rigoriSegnati: 100 * S('rigoriGol') / Math.max(1, S('rigori')),
  palleRubate: M('palleRubate'), falli: M('falli'), timeout: M('timeout'),
  golTipo: Object.fromEntries(tipi.map(t => [t, 100 * tutte.reduce((s, x) => s + x.golTipo[t], 0) / Math.max(1, golTot)])),
  vittorie: [0, 1].map(i => partite.filter(p => p.squadre[i].gol > p.squadre[1 - i].gol).length), nomi: partite[0].squadre.map(s => s.nome),
  golPerSquadra: [0, 1].map(i => partite.reduce((s, p) => s + p.squadre[i].gol, 0) / N), espulsioniPerSquadra: [0, 1].map(i => partite.reduce((s, p) => s + p.squadre[i].espulsioni, 0) / N) };
const r1 = x => x.toFixed(1);
console.log(`\nMedie per squadra a partita (${N} partite, tempi da ${DURATA / 60} minuti) — ${sintesi.nomi.join(' contro ')}: vittorie ${sintesi.vittorie.join(' - ')}`);
console.log(`  gol ${r1(sintesi.gol)} · tiri ${r1(sintesi.tiri)} · tiri in gol ${r1(sintesi.conversione)}% · tiri nello specchio ${r1(sintesi.inPorta)}% · parate ${r1(sintesi.parate)}`);
console.log(`  espulsioni ${r1(sintesi.espulsioni)} · superiorità trasformate ${r1(sintesi.superioritaTrasformate)}% · rigori ${r1(sintesi.rigori)} (segnati ${r1(sintesi.rigoriSegnati)}%) · palle rubate ${r1(sintesi.palleRubate)} · falli ${r1(sintesi.falli)} · time-out ${r1(sintesi.timeout)}`);
{ const g = {}; for (const x of tutte) for (const k in x.gesti) g[k] = (g[k] || 0) + x.gesti[k]; const tt = S('tiri');
  console.log('  tiri per tipo di azione: ' + tipi.map(t => `${t} ${r1(100 * tutte.reduce((s, x) => s + x.tiriTipo[t], 0) / tt)}%`).join(' · '));
  console.log(`  tiro dopo ${r1(S('etaPossesso') / tt)} s di possesso in media · gesti: ` + Object.entries(g).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${r1(100 * v / tt)}%`).join(' · ')); }
console.log('  gol per tipo: ' + tipi.map(t => `${t} ${r1(sintesi.golTipo[t])}%`).join(' · '));
if (errori.length) console.log('ERRORI nella pagina:\n  ' + [...new Set(errori)].slice(0, 10).join('\n  '));
sintesi.pallaSola = Math.max(...partite.map(p => p.pallaSola)); sintesi.pallaVagante = Math.max(...partite.map(p => p.pallaVagante));
console.log(`  palla vagante: al massimo ${r1(sintesi.pallaSola)} s ferma senza che nessuno ci vada (limite 2 s) · al massimo ${r1(sintesi.pallaVagante)} s prima che qualcuno la prenda`);
const salva = arg('salva', ''); if (salva) fs.writeFileSync(salva, JSON.stringify(sintesi, null, 1));
process.exit(errori.length || partite.some(p => !p.finita) || sintesi.pallaSola > 2 ? 1 : 0);
