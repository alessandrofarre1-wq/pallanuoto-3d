// Sonda (v0.79, Ale: «troppi passaggi sbagliati»; «i passaggi possono essere di due modi: morbido sull'acqua vicino al compagno
// oppure alto e teso»): in partite computer contro computer (ITA–HUN, tempi da 8 minuti) registra ogni passaggio con il suo tipo
// (morbido, teso; «—» nelle versioni senza tipi), la situazione (uomo in più, ultimi secondi del possesso, transizione, lunghezza)
// e come finisce: preso dal compagno, da un altro compagno, da un avversario (in volo o sull'acqua), o altro.
// Uso: node strumenti/sonda-tipi-passaggio.mjs [--dist=dist] [--porta=4631] [--partite=2] [--paralleli=2]
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => process.argv.find(x => x.startsWith('--' + k + '='))?.slice(k.length + 3);
const dist = arg('dist') || 'dist', porta = +(arg('porta') || 4631), partite = +(arg('partite') || 2), paralleli = +(arg('paralleli') || 2);
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
    const righe = []; let cur = null;
    for (let i = 0; i < 60 * 60 * 40 && g.state !== 'over'; i++) {
      const st0 = B.state;
      window.__passo();
      if (g.state !== 'play') { cur = null; continue; }
      if (B.state === 'flight' && B.kind === 'pass' && B.flightT < 0.05 && (!cur || cur.tg !== B.target || cur.t0 < g.time - 0.2)) {
        const p = B.shooter, m = B.target, sup = H.teams.some(t => t !== p.team && t.players.some(q => q.excluded));
        cur = { tg: m, team: p.team, t0: g.time, tipo: B.tipoPassaggio || '—', lungo: Math.hypot(B.tx - p.x, B.tz - p.z), sup, ultimi: g.shot <= 8,
          trans: Math.abs(p.team.dir * 12.5 - p.x) > 10, centro: m.i === 1, esito: null };
      }
      if (cur && !cur.esito) {
        if (B.state === 'held') { cur.esito = B.holder === cur.tg ? 'preso' : B.holder.team === cur.team ? 'altro compagno' : 'avversario'; cur.tempo = g.time - cur.t0; righe.push(cur); cur = null; }
        else if (B.state === 'free' && st0 === 'flight') cur.acqua = true;
        else if (B.state !== 'flight' && B.state !== 'free') { cur.esito = 'altro'; righe.push(cur); cur = null; }
      }
    }
    return righe.map(({ tg, team, ...x }) => x);
  });
  await pg.close(); return r;
}
const tutte = [];
for (let k = 0; k < partite; k += paralleli) {
  const giro = []; for (let j = k; j < Math.min(partite, k + paralleli); j++) giro.push(partita(j));
  for (const r of await Promise.all(giro)) tutte.push(...r);
}
await browser.close(); server.httpServer.close();
const pc = (n, d) => d ? (100 * n / d).toFixed(1) + '%' : '—';
const riga = (nome, el) => {
  const n = el.length, c = e => el.filter(r => r.esito === e).length, acqua = el.filter(r => r.acqua).length;
  const lungo = n ? (el.reduce((s, r) => s + r.lungo, 0) / n).toFixed(1) : '—', tempo = el.filter(r => r.tempo).length ? (el.filter(r => r.tempo).reduce((s, r) => s + r.tempo, 0) / el.filter(r => r.tempo).length).toFixed(2) : '—';
  console.log(`${nome.padEnd(30)} ${String(n).padStart(5)} ${(n / partite / 2).toFixed(1).padStart(7)}  preso ${pc(c('preso'), n).padStart(6)}  altro comp. ${pc(c('altro compagno'), n).padStart(6)}  avversario ${pc(c('avversario'), n).padStart(6)}  passa dall'acqua ${pc(acqua, n).padStart(6)}  ${lungo} m  ${tempo} s`);
};
console.log(`${partite} partite · passaggi (per squadra a partita) · esito · lunghezza media · tempo fino alla presa`);
riga('tutti', tutte);
for (const t of [...new Set(tutte.map(r => r.tipo))]) riga('tipo ' + t, tutte.filter(r => r.tipo === t));
riga('uomo in più', tutte.filter(r => r.sup)); riga('ultimi 8 s del possesso', tutte.filter(r => r.ultimi && !r.sup));
riga('transizione', tutte.filter(r => r.trans && !r.sup)); riga('al centroboa', tutte.filter(r => r.centro && !r.sup));
riga('attacco schierato, parità', tutte.filter(r => !r.trans && !r.sup && !r.ultimi && !r.centro));
