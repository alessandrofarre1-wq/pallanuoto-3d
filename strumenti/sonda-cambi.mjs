// Sonda (v0.82, Ale: «cambi volanti: non quando l'attacco è già impostato; il sostituto deve entrare da metà campo con il cinque;
// niente passaggi a un giocatore appena entrato a 20 m»). In partite computer contro computer (ITA–HUN, tempi da 8 minuti) misura
// i cambi volanti: in che momento cominciano (la squadra attacca o difende, da quanti secondi ha la palla, attacco già impostato o
// transizione), dove avviene il cinque, quanto resta fuori chi esce, e i passaggi a chi è appena entrato (entro 10 s) con la
// distanza del passaggio e dalla porta.
// Uso: node strumenti/sonda-cambi.mjs [--dist=dist] [--porta=4694] [--partite=2] [--paralleli=2]
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => process.argv.find(x => x.startsWith('--' + k + '='))?.slice(k.length + 3);
const dist = arg('dist') || 'dist', porta = +(arg('porta') || 4694), partite = +(arg('partite') || 2), paralleli = +(arg('paralleli') || 2);
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
    const o = { cambi: [], passaggi: [], sotto20: 0, sotto35: 0, minima: 1, campioni: 0, somma: 0 };
    const stato = H.teams.map(() => ({ cambio: null, inizio: 0, entrato: null, entratoT: -99 }));
    let giro = B.revisioneTiro, conta = 0; const schede = new Map(H.allPlayers.map(q => [q, q.scheda]));
    for (let i = 0; i < 60 * 60 * 40 && g.state !== 'over'; i++) {
      window.__passo();
      for (const q of H.allPlayers) { if (schede.get(q) !== q.scheda) { if (schede.get(q)) conta++; schede.set(q, q.scheda); } }
      if (i % 60 === 0 && g.state === 'play') for (const q of H.allPlayers) {      // energia di chi è in acqua, ogni secondo
        if (q.isGK || q.excluded) continue;
        o.campioni++; o.somma += q.stamina; o.minima = Math.min(o.minima, q.stamina);
        if (q.stamina < 0.2) o.sotto20++; if (q.stamina < 0.35) o.sotto35++;
      }
      H.teams.forEach((t, k) => {
        const s = stato[k], C = t.cambio;
        if (C && C !== s.cambio && C.fase === 'esce') {      // comincia un cambio volante (chi esce nuota verso la zona)
          s.cambio = C; s.inizio = g.time;
          const gx = t.dir * 12.5, attacca = g.possTeam === t, eta = g.time - (g.possT || 0);
          const palla = Math.abs(gx - B.x), impostato = attacca && eta > 8 && palla < 10;
          o.cambi.push({ attacca, eta: +eta.toFixed(1), palla: +palla.toFixed(1), impostato, distZona: +Math.hypot(C.esce.x - (-t.dir * 12.5 + t.dir * 3.2), C.esce.z).toFixed(1), fuori: null, xCinque: null, stato: g.state });
        }
        if (s.cambio && C === s.cambio && C.fase === 'uscita' && s.entrato !== C.esce) {      // il cinque è fatto: entra il sostituto
          const ultimo = o.cambi[o.cambi.length - 1]; if (ultimo) { ultimo.fuori = +(g.time - s.inizio).toFixed(1); ultimo.xCinque = +(Math.abs(C.esce.x - (-t.dir * 12.5))).toFixed(1); }
          s.entrato = C.esce; s.entratoT = g.time;
        }
        if (!C) s.cambio = null;
      });
      if (B.revisioneTiro !== giro) {
        giro = B.revisioneTiro;
        if (B.kind === 'pass' && B.shooter && B.target) {
          const k = H.teams.indexOf(B.shooter.team), s = stato[k];
          if (B.target === s.entrato && g.time - s.entratoT < 10) {
            const m = B.target, gx = m.team.dir * 12.5;
            o.passaggi.push({ distanza: +Math.hypot(m.x - B.shooter.x, m.z - B.shooter.z).toFixed(1), dallaPorta: +Math.hypot(gx - m.x, m.z).toFixed(1), dopo: +(g.time - s.entratoT).toFixed(1) });
          }
        }
      }
    }
    o.totali = conta;      // tutti i cambi, anche a gioco fermo e dal pozzetto (chi è in acqua cambia scheda)
    return o;
  });
  await pg.close(); return r;
}
const cambi = [], passaggi = [], energia = { sotto20: 0, sotto35: 0, minima: 1, campioni: 0, somma: 0 }; let totali = 0;
for (let k = 0; k < partite; k += paralleli) {
  const giro = []; for (let j = k; j < Math.min(partite, k + paralleli); j++) giro.push(partita(j));
  for (const r of await Promise.all(giro)) {
    cambi.push(...r.cambi); passaggi.push(...r.passaggi); totali += r.totali || 0;
    for (const c of ['sotto20', 'sotto35', 'campioni', 'somma']) energia[c] += r[c]; energia.minima = Math.min(energia.minima, r.minima);
  }
}
await browser.close(); server.httpServer.close();
const n = cambi.length, pc = (x, d) => (100 * x / Math.max(1, d)).toFixed(0) + '%', media = (a, f) => a.length ? (a.reduce((s, x) => s + f(x), 0) / a.length).toFixed(1) : '-';
console.log(`${partite} partite · cambi volanti: ${(n / partite / 2).toFixed(1)} per squadra a partita · tutti i cambi (anche a gioco fermo e dal pozzetto): ${(totali / partite / 2).toFixed(1)}`);
console.log(`quando cominciano: in attacco ${pc(cambi.filter(c => c.attacca).length, n)} (attacco già impostato ${pc(cambi.filter(c => c.impostato).length, n)}), in difesa ${pc(cambi.filter(c => !c.attacca).length, n)}`);
console.log(`secondi di possesso all'inizio (in attacco): ${media(cambi.filter(c => c.attacca), c => c.eta)} s · palla a ${media(cambi, c => c.palla)} m dalla porta d'attacco`);
const fatti = cambi.filter(c => c.fuori != null);
console.log(`chi esce resta fuori in media ${media(fatti, c => c.fuori)} s; il cinque avviene a ${media(fatti, c => c.xCinque)} m dalla propria linea di porta`);
console.log(`passaggi a chi è appena entrato (entro 10 s): ${passaggi.length} in ${partite} partite; lunghi oltre 12 m: ${passaggi.filter(p => p.distanza > 12).length}; distanza media ${media(passaggi, p => p.distanza)} m, dalla porta ${media(passaggi, p => p.dallaPorta)} m`);
console.log(`energia in acqua: media ${(100 * energia.somma / Math.max(1, energia.campioni)).toFixed(0)}%, minima ${(100 * energia.minima).toFixed(0)}%; sotto il 35% per ${(100 * energia.sotto35 / Math.max(1, energia.campioni)).toFixed(1)}% del tempo, sotto il 20% per ${(100 * energia.sotto20 / Math.max(1, energia.campioni)).toFixed(1)}%`);
for (const p of passaggi.filter(x => x.distanza > 12).slice(0, 8)) console.log(`  passaggio di ${p.distanza} m a ${p.dopo} s dall'ingresso, ricevente a ${p.dallaPorta} m dalla porta`);
