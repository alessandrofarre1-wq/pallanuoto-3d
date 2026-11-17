// Misura della «fetta di gioco» (v0.53): l'azione d'attacco in parità, computer contro computer.
// - circolazione: passaggi per azione in parità, secondi di palla in mano prima di passare, tiri per squadra;
// - marcature: distanza del difensore dal suo uomo, separata tra attaccanti VICINI alla palla (entro 5 m) e LONTANI
//   (oltre 7 m); quota del tempo «incollato» (entro 1,2 m) per gli attaccanti lontani dalla palla;
// - movimento senza palla: quota del tempo in cui un attaccante in parità si muove (oltre 0,3 m/s);
// - scivolamento in verticale: tra i movimenti brevi (0,3-1,3 m/s) quota fatta restando verticali (oriz < 0,3).
// Uso: node strumenti/misura-azione-v053.mjs [--dist=cartella] [--partite=2] [--porta=4422]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => process.argv.find(x => x.startsWith('--' + k + '='))?.slice(k.length + 3);
const dist = arg('dist'), partite = +(arg('partite') || 2), porta = +(arg('porta') || 4422);
if (!dist && !process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: { outDir: dist || 'dist' }, preview: { port: porta, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const tot = [];
for (let g = 0; g < partite; g++) {
  const pg = await browser.newPage({ viewport: { width: 640, height: 300 } });
  await pg.addInitScript(seme => {
    let a = seme; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
    window.__passo = () => { now += 1000 / 60; window.__raf(now); };
  }, 33 + g * 101);
  await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 120000, polling: 100 });
  tot.push(await pg.evaluate(() => {
    const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click();
    H.game.autoplay = true; for (const t of H.teams) t.human = false; H.renderer.render = () => {};
    const m = { passaggi: 0, azioni: 0, tenuta: 0, nTenuta: 0, vicinoD: 0, vicinoN: 0, lontanoD: 0, lontanoN: 0, incollati: 0,
      fermi: 0, muove: 0, breviVert: 0, brevi: 0 };
    let azione = null, holder = null, tHold = 0;
    const manUp = t => H.teams.find(x => x !== t).players.some(q => q.excluded);
    for (let k = 0; k < 60 * 60 * 40 && H.game.state !== 'over'; k++) {
      window.__passo();
      if (H.game.state !== 'play') continue;
      const h = H.ball.holder, t = H.game.possTeam;
      // azioni in parità: dal possesso al cambio di squadra
      if (t && !manUp(t)) { if (!azione || azione.t !== t) { if (azione) m.azioni++; azione = { t }; } } else if (azione && (!t || manUp(t))) { m.azioni++; azione = null; }
      // passaggio = la palla passa da un giocatore di movimento a un compagno (in mezzo vola: nessuno la tiene)
      if (h && h !== holder) {
        if (holder && h.team === holder.team && !h.isGK && !holder.isGK && t && !manUp(t)) m.passaggi++;
        holder = h; tHold = H.game.time; holder.__tenuta = true;
      } else if (!h && holder && holder.__tenuta) {
        holder.__tenuta = false; if (!holder.isGK) { m.tenuta += H.game.time - tHold; m.nTenuta++; }
      }
      if (!h || h.isGK || !t || manUp(t)) continue;
      const dif = H.teams.find(x => x !== t);
      for (const a of t.players) {
        if (a.isGK || a.excluded || a === h || a.uscendo) continue;
        const sp = Math.hypot(a.vx, a.vz); if (sp > 0.3) m.muove++; else m.fermi++;
        const marc = dif.players.filter(q => !q.excluded && !q.isGK).sort((x, y) => Math.hypot(x.x - a.x, x.z - a.z) - Math.hypot(y.x - a.x, y.z - a.z))[0];
        if (!marc) continue;
        const dm = Math.hypot(marc.x - a.x, marc.z - a.z), dp = Math.hypot(h.x - a.x, h.z - a.z);
        if (dp < 5) { m.vicinoD += dm; m.vicinoN++; } else if (dp > 7) { m.lontanoD += dm; m.lontanoN++; if (dm < 1.2) m.incollati++; }
      }
      for (const q of H.allPlayers) { if (q.isGK || q.excluded) continue; const sp = Math.hypot(q.vx, q.vz); if (sp > 0.3 && sp < 1.3) { m.brevi++; if ((q.oriz || 0) < 0.3) m.breviVert++; } }
    }
    const st = H.statistiche; return { m, tiri: st ? st.map(s => s.tiri) : null, gol: H.teams.map(t => t.score), tempo: H.game.time };
  }));
  await pg.close();
}
const s = k => tot.reduce((a, r) => a + r.m[k], 0);
const r1 = x => +x.toFixed(2), pc = x => +(100 * x).toFixed(1);
const ris = {
  build: dist || 'attuale', partite,
  passaggiPerAzioneParita: r1(s('passaggi') / Math.max(1, s('azioni'))),
  secondiPrimaDelPassaggio: r1(s('tenuta') / Math.max(1, s('nTenuta'))),
  distanzaMarcatoreVicinoPalla: r1(s('vicinoD') / Math.max(1, s('vicinoN'))),
  distanzaMarcatoreLontanoPalla: r1(s('lontanoD') / Math.max(1, s('lontanoN'))),
  incollatiLontanoPalla_pc: pc(s('incollati') / Math.max(1, s('lontanoN'))),
  attaccantiInMovimento_pc: pc(s('muove') / Math.max(1, s('muove') + s('fermi'))),
  movimentiBreviInVerticale_pc: pc(s('breviVert') / Math.max(1, s('brevi'))),
  gol: tot.map(r => r.gol.join('-')).join(' '), tiri: tot.map(r => JSON.stringify(r.tiri)).join(' ')
};
console.log(JSON.stringify(ris));
await browser.close(); server.httpServer.close();
