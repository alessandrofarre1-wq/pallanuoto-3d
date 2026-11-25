// Sonda (v0.88, palombella senza tasto): nelle partite computer contro computer (ITA–HUN, tempi da 8 minuti) conta palombelle, schizzi e
// colonnelli (per squadra a partita), da che distanza, quante finiscono in gol, e quanto spesso il portiere è fuori dai pali (oltre
// PALOMBELLA.portiereFuori m dalla linea). Uso: node strumenti/sonda-palombella.mjs [--dist=dist] [--porta=4691] [--partite=2]
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => process.argv.find(x => x.startsWith('--' + k + '='))?.slice(k.length + 3);
const dist = arg('dist') || 'dist', porta = +(arg('porta') || 4691), partite = +(arg('partite') || 2);
const server = await preview({ root, logLevel: 'warn', build: { outDir: dist }, preview: { port: porta, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const partita = async k => {
  const pg = await browser.newPage({ viewport: { width: 844, height: 390 } });
  await pg.addInitScript(seme => {
    let s = seme; window.__rnd = () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
    window.__passo = () => { now += 1000 / 60; window.__raf(now); }; window.__logTiri = [];
  }, 41 + k * 13);
  await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 120000, polling: 100 });
  const r = await pg.evaluate(() => {
    const H = window.__pallanuoto, g = H.game, B = H.ball; H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click();
    g.autoplay = true; for (const t of H.teams) t.human = false; H.renderer.render = () => {};
    const tiri = []; let aperto = null, fuori = 0, campioni = 0, uscite = 0; const prima = new Map();
    for (let i = 0; i < 60 * 60 * 40 && g.state !== 'over'; i++) {
      window.__passo();
      const L = window.__logTiri;
      if (L.length > tiri.length) {
        for (let j = tiri.length; j < L.length; j++) {
          const sq = B.shooter?.team, gk = sq ? H.teams.find(t => t !== sq).players.find(q => q.isGK && !q.excluded) : null;
          tiri.push({ g: L[j].g, d: L[j].d, gol: false, fuori: gk ? Math.abs(gk.x + 12.5 * gk.team.dir) : 99, sq, punti: sq ? sq.score : 0 });
        }
        aperto = tiri[tiri.length - 1];
      }
      if (aperto && aperto.sq && aperto.sq.score > aperto.punti) { aperto.gol = true; aperto = null; }
      if (g.state === 'play') for (const t of H.teams) {
        const gk = t.players.find(q => q.isGK && !q.excluded); if (!gk) continue;
        const f = Math.abs(gk.x + 12.5 * t.dir) > 1.3; campioni++; if (f) fuori++;
        if (f && !prima.get(gk)) uscite++; prima.set(gk, f);
      }
    }
    return { tiri: tiri.map(x => ({ g: x.g, d: +x.d.toFixed(2), gol: x.gol, fuori: +x.fuori.toFixed(2) })), fuori: fuori / Math.max(1, campioni), uscite, gol: H.teams.map(t => t.score) };
  });
  await pg.close(); return r;
};
const risultati = [];
for (let k = 0; k < partite; k += 2) risultati.push(...await Promise.all(Array.from({ length: Math.min(2, partite - k) }, (_, j) => partita(k + j))));
await browser.close(); server.httpServer.close();
const tutti = risultati.flatMap(r => r.tiri), n = partite * 2;
const per = g => tutti.filter(x => x.g === g);
console.log(`${tutti.length} tiri in ${partite} partite (${(tutti.length / n).toFixed(1)} per squadra a partita), gol ${risultati.map(r => r.gol.join('-')).join(', ')}`);
for (const g of ['lob', 'schizzo', 'colonnello']) {
  const v = per(g); if (!v.length) { console.log(`  ${g.padEnd(11)} 0`); continue; }
  const gol = v.filter(x => x.gol).length, fuori = v.filter(x => x.fuori > 1.3).length;
  console.log(`  ${g.padEnd(11)} ${String(v.length).padStart(3)} (${(v.length / n).toFixed(2)} per squadra a partita) · da ${(v.reduce((s, x) => s + x.d, 0) / v.length).toFixed(1)} m · gol ${gol} (${(100 * gol / v.length).toFixed(0)}%) · portiere fuori dai pali al tiro ${fuori}`);
}
const altri = tutti.filter(x => !['lob', 'schizzo', 'colonnello'].includes(x.g)), golAltri = altri.filter(x => x.gol).length;
console.log(`  altri tiri  ${altri.length} · gol ${golAltri} (${(100 * golAltri / Math.max(1, altri.length)).toFixed(0)}%)`);
console.log(`Portiere fuori dai pali: ${(100 * risultati.reduce((s, r) => s + r.fuori, 0) / partite).toFixed(1)}% del tempo di gioco, ${(risultati.reduce((s, r) => s + r.uscite, 0) / n).toFixed(1)} uscite per portiere a partita`);
