// Sonda delle finte (v0.85, Ale: «davanti alla porta finta veloce ma non troppo»; «ora quelle vicino alla porta sono troppo veloci,
// vanno rallentate»). In partite computer contro computer (ITA–HUN, tempi da 8 minuti) misura ogni finta di chi ha la palla:
// - la distanza dalla porta (fasce: entro 5 m, 5-7 m, 7-9 m, oltre 9 m) e lo stile personale (finte.js);
// - l'accenno (preparazione + gesto in avanti, act.wind + act.frusta) e il recupero previsto (FINTA_MOVIMENTO.recupero);
// - dopo quanto tempo dall'inizio della finta parte il gesto successivo (un'altra finta, il tiro o il passaggio) e quante volte
//   parte prima che il braccio sia tornato alla carica (recupero interrotto);
// - quante finte di fila e come finisce la serie.
// Uso: node strumenti/sonda-finte.mjs [--dist=dist] [--porta=4683] [--partite=2] [--paralleli=2]
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => process.argv.find(x => x.startsWith('--' + k + '='))?.slice(k.length + 3);
const dist = arg('dist') || 'dist', porta = +(arg('porta') || 4683), partite = +(arg('partite') || 2), paralleli = +(arg('paralleli') || 2);
const server = await preview({ root, logLevel: 'warn', build: { outDir: dist }, preview: { port: porta, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function partita(k) {
  const pg = await browser.newPage({ viewport: { width: 844, height: 390 } });
  await pg.addInitScript(seme => {
    let s = seme; window.__rnd = () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
    window.__passo = () => { now += 1000 / 60; window.__raf(now); };
  }, 33 + k * 7);
  await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 120000, polling: 100 });
  const r = await pg.evaluate(() => {
    const H = window.__pallanuoto, B = H.ball, g = H.game;
    H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click();
    g.autoplay = true; for (const t of H.teams) t.human = false; H.renderer.render = () => {};
    const finte = [];      // una riga per finta
    let aperta = null;     // la finta di cui si aspetta il gesto successivo
    const ultimoAtto = new Map();
    const fascia = d => d < 5 ? 'entro 5 m' : d < 7 ? '5-7 m' : d < 9 ? '7-9 m' : 'oltre 9 m';
    for (let i = 0; i < 60 * 60 * 40 && g.state !== 'over'; i++) {
      window.__passo();
      const h = B.state === 'held' ? B.holder : null;
      // la finta aperta finisce quando chi la fa perde la palla o fa il gesto successivo
      if (aperta && (B.holder !== aperta.p || g.state !== 'play')) {
        if (!aperta.dopo) { aperta.r.dopo = B.state === 'flight' && B.shooter === aperta.p ? B.kind : 'persa o fischio'; aperta.r.dopoT = +(g.time - aperta.t0).toFixed(3); }
        aperta = null;
      }
      if (!h || h.isGK) continue;
      const a = h.act;
      if (a && a !== ultimoAtto.get(h)) {
        ultimoAtto.set(h, a);
        if (aperta && aperta.p === h) {
          const dt = g.time - aperta.t0;
          aperta.r.dopo = a.kind; aperta.r.dopoT = +dt.toFixed(3); aperta.r.interrotto = dt < aperta.fine - 1e-6; aperta = null;
        }
        if (a.kind === 'fake') {
          const gx = 12.5 * h.team.dir, d = Math.hypot(gx - h.x, h.z);
          // v0.87: verso della finta rispetto al braccio (attraverso il corpo = da destra verso sinistra per un destro) e larghezza
          const traverso = (h.mano === 'S' ? 1 : -1) * h.team.dir, lato = h.fintaLatoGesto || 0;
          const r = { d: +d.toFixed(2), fascia: fascia(d), stile: h.scheda?.finta || '?', accenno: +(a.wind + a.frusta).toFixed(3), serie: (h.fakeCount || 0) + 1,
            verso: lato === traverso ? 'traverso' : lato ? 'fuori' : 'avanti', largo: a.largo ?? null, chi: h.scheda?.id ?? h.name,
            superiorita: h.team.players.length > 0 && H.teams.find(t => t !== h.team).players.some(q => q.excluded), dopo: null, dopoT: null, interrotto: false };
          finte.push(r); aperta = { p: h, t0: g.time, fine: a.wind + a.frusta + 0.36, r };
        }
      }
    }
    return { finte, gol: H.teams.map(t => t.score) };
  });
  await pg.close();
  return r;
}
const risultati = [];
for (let k = 0; k < partite; k += paralleli) {
  const blocco = await Promise.all(Array.from({ length: Math.min(paralleli, partite - k) }, (_, j) => partita(k + j)));
  risultati.push(...blocco);
}
await browser.close(); await new Promise(r => server.httpServer.close(r));
if (risultati.some(r => r.errore)) { console.log(risultati.find(r => r.errore).errore); process.exit(1); }
const tutte = risultati.flatMap(r => r.finte);
const n = partite * 2;
const media = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const f2 = x => Number.isFinite(x) ? x.toFixed(2) : '-';
console.log(`Finte del computer: ${tutte.length} in ${partite} partite (${f2(tutte.length / n)} per squadra a partita)`);
console.log('\nPer distanza dalla porta:');
console.log('fascia       finte  accenno  gesto dopo (s)  recupero interrotto  poi tiro  poi finta  poi passaggio');
for (const fa of ['entro 5 m', '5-7 m', '7-9 m', 'oltre 9 m']) {
  const q = tutte.filter(r => r.fascia === fa); if (!q.length) continue;
  const conDopo = q.filter(r => r.dopoT !== null && r.dopo !== 'persa o fischio');
  const tiro = q.filter(r => ['shot', 'polso', 'torsione', 'lob', 'beduina', 'sciarpa', 'colonnello', 'schizzo'].includes(r.dopo)).length;
  console.log(`${fa.padEnd(12)} ${String(q.length).padStart(5)}  ${f2(media(q.map(r => r.accenno))).padStart(7)}  ${f2(media(conDopo.map(r => r.dopoT))).padStart(14)}  ${(100 * q.filter(r => r.interrotto).length / q.length).toFixed(0).padStart(18)}%  ${(100 * tiro / q.length).toFixed(0).padStart(7)}%  ${(100 * q.filter(r => r.dopo === 'fake').length / q.length).toFixed(0).padStart(8)}%  ${(100 * q.filter(r => r.dopo === 'pass').length / q.length).toFixed(0).padStart(12)}%`);
}
console.log('\nPer stile:');
for (const st of [...new Set(tutte.map(r => r.stile))].sort()) {
  const q = tutte.filter(r => r.stile === st), conDopo = q.filter(r => r.dopoT !== null && r.dopo !== 'persa o fischio');
  console.log(`${st.padEnd(8)} ${String(q.length).padStart(4)} finte, accenno ${f2(media(q.map(r => r.accenno)))} s, gesto dopo ${f2(media(conDopo.map(r => r.dopoT)))} s, recupero interrotto ${(100 * q.filter(r => r.interrotto).length / q.length).toFixed(0)}%`);
}
const gaps = tutte.filter(r => r.dopoT !== null && r.dopo !== 'persa o fischio').map(r => r.dopoT).sort((a, b) => a - b);
const quant = p => gaps.length ? gaps[Math.min(gaps.length - 1, Math.floor(p * gaps.length))] : NaN;
console.log(`\nDall'inizio della finta al gesto successivo: 10% ${f2(quant(0.1))} s, metà ${f2(quant(0.5))} s, 90% ${f2(quant(0.9))} s`);
console.log(`Serie: ${['1', '2', '3+'].map((s, i) => `${s} finta ${(100 * tutte.filter(r => i < 2 ? r.serie === i + 1 : r.serie >= 3).length / Math.max(1, tutte.length)).toFixed(0)}%`).join(', ')}`);
{ const v = k => (100 * tutte.filter(r => r.verso === k).length / Math.max(1, tutte.length)).toFixed(0);
  console.log(`Verso (v0.87): da destra verso sinistra (attraverso il corpo) ${v('traverso')}%, da sinistra verso destra ${v('fuori')}%, avanti e indietro ${v('avanti')}%`);
  const lg = tutte.filter(r => r.largo != null), vic = lg.filter(r => r.d < 5), lon = lg.filter(r => r.d >= 7);
  console.log(`Larghezza (0 stretta, 1 ampia): media ${f2(media(lg.map(r => r.largo)))}, entro 5 m ${f2(media(vic.map(r => r.largo)))}, oltre 7 m ${f2(media(lon.map(r => r.largo)))}`);
  // marchio di fabbrica: per chi ha fatto almeno 6 finte, quante nel suo verso più frequente
  const per = new Map(); for (const r of tutte) { const m = per.get(r.chi) || []; m.push(r); per.set(r.chi, m); }
  const fedeli = [...per.values()].filter(m => m.length >= 6).map(m => Math.max(...['traverso', 'fuori', 'avanti'].map(k => m.filter(r => r.verso === k).length)) / m.length);
  console.log(`Marchio di fabbrica: ${fedeli.length} giocatori con almeno 6 finte, in media ${(100 * media(fedeli)).toFixed(0)}% nel loro verso più frequente`); }
console.log(`Gol: ${risultati.map(r => r.gol.join('-')).join(', ')}`);
