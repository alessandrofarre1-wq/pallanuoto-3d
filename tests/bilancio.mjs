// Bilanciamento: partite "computer contro computer" a durata vera (4 tempi da 8 minuti) e tabella dei numeri per squadra.
// Uso: node tests/bilancio.mjs [--partite=20] [--no-build] [--salva=file.json] [--url=...opzioni dell'indirizzo]
// Obiettivi (docs/tattica.md): 7-13 espulsioni per squadra, superiorità trasformate 30-60%, 1-2 rigori per squadra,
// circa 40% dei tiri in gol, gol soprattutto dal perimetro e in superiorità.
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const N = +arg('partite', 20), DURATA = arg('tempo', '480'), OPZ = arg('opzioni', '');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4175, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errori = [], partite = [];
for (let n = 1; n <= N; n++) {
  const pg = await browser.newPage();
  pg.on('pageerror', e => errori.push(e.message));
  await pg.addInitScript(seed => {
    let a = seed; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    performance.now = () => 0; window.__frame = 0;
    window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
    window.__step = n => { for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } };
  }, n * 7919);
  await pg.goto(server.resolvedUrls.local[0] + (OPZ ? '?' + OPZ : ''));
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto');
  const r = await pg.evaluate(({ durata, opz }) => {
    const H = window.__pallanuoto; H.renderer.render = () => {}; H.senzaCorpi = true;
    if (H.preparaProva) H.preparaProva(opz);
    H.game.autoplay = true; for (const t of H.teams) t.human = false;
    const b = document.querySelector(`[data-len="${durata}"]`); if (b) b.click();
    document.getElementById('goBtn').click();
    let f = 0; for (; f < 60 * 60 * 80 && H.game.state !== 'over'; f++) window.__step(1);
    return { finita: H.game.state === 'over', secondi: Math.round(f / 60), squadre: H.statistiche };
  }, { durata: DURATA, opz: OPZ });
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
  palleRubate: M('palleRubate'), timeout: M('timeout'),
  golTipo: Object.fromEntries(tipi.map(t => [t, 100 * tutte.reduce((s, x) => s + x.golTipo[t], 0) / Math.max(1, golTot)])),
  vittorie: [0, 1].map(i => partite.filter(p => p.squadre[i].gol > p.squadre[1 - i].gol).length), nomi: partite[0].squadre.map(s => s.nome),
  golPerSquadra: [0, 1].map(i => partite.reduce((s, p) => s + p.squadre[i].gol, 0) / N), espulsioniPerSquadra: [0, 1].map(i => partite.reduce((s, p) => s + p.squadre[i].espulsioni, 0) / N) };
const r1 = x => x.toFixed(1);
console.log(`\nMedie per squadra a partita (${N} partite, tempi da ${DURATA / 60} minuti) — ${sintesi.nomi.join(' contro ')}: vittorie ${sintesi.vittorie.join(' - ')}`);
console.log(`  gol ${r1(sintesi.gol)} · tiri ${r1(sintesi.tiri)} · tiri in gol ${r1(sintesi.conversione)}% · tiri nello specchio ${r1(sintesi.inPorta)}% · parate ${r1(sintesi.parate)}`);
console.log(`  espulsioni ${r1(sintesi.espulsioni)} · superiorità trasformate ${r1(sintesi.superioritaTrasformate)}% · rigori ${r1(sintesi.rigori)} (segnati ${r1(sintesi.rigoriSegnati)}%) · palle rubate ${r1(sintesi.palleRubate)} · time-out ${r1(sintesi.timeout)}`);
console.log('  gol per tipo: ' + tipi.map(t => `${t} ${r1(sintesi.golTipo[t])}%`).join(' · '));
if (errori.length) console.log('ERRORI nella pagina:\n  ' + [...new Set(errori)].slice(0, 10).join('\n  '));
const salva = arg('salva', ''); if (salva) fs.writeFileSync(salva, JSON.stringify(sintesi, null, 1));
process.exit(errori.length || partite.some(p => !p.finita) ? 1 : 0);
