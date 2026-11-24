// Sonda (v0.80, Ale: «non funzionano molto i cambi di marcatura in difesa. Sembra che ogni giocatore guardi solo il proprio
// giocatore. Così facendo però si generano diverse controfughe che in realtà non esisterebbero»). In partite computer contro
// computer (ITA–HUN, tempi da 8 minuti) misura, per ogni possesso dopo un recupero, quanto restano liberi gli attaccanti mentre la
// difesa rientra: un attaccante è «libero davanti alla porta» se è entro 7 m dalla porta e nessun difensore di movimento è entro
// 2 m da lui dalla parte della porta. Conta anche le occasioni di tiro speciale (portatore che nuota verso la porta senza nessuno
// davanti, entro 2,5-8 m: lo schizzo o il colonnello), le controfughe e i cambi di marcatura fatti. v0.81: conta anche i tasti
// speciali con la regola vera del gioco (occasioneControfuga, solo nella controfuga vera), se la build la espone.
// Uso: node strumenti/sonda-rientri.mjs [--dist=dist] [--porta=4661] [--partite=2] [--paralleli=2]
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => process.argv.find(x => x.startsWith('--' + k + '='))?.slice(k.length + 3);
const dist = arg('dist') || 'dist', porta = +(arg('porta') || 4661), partite = +(arg('partite') || 2), paralleli = +(arg('paralleli') || 2);
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
    const H = window.__pallanuoto, B = H.ball, g = H.game, dt = 1 / 60;
    H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click();
    g.autoplay = true; for (const t of H.teams) t.human = false; H.renderer.render = () => {};
    const o = { possessi: 0, tempoLibero: 0, possessiConLibero: 0, maxLiberi: 0, occasioniSpeciali: 0, occasioniVere: H.prova.occasioneControfuga ? 0 : null, tempoGioco: 0, scambi0: H.teams.map(t => t.scambi || 0) };
    let possT = null, conLibero = false, inOcc = false, inVera = false;
    for (let i = 0; i < 60 * 60 * 40 && g.state !== 'over'; i++) {
      window.__passo();
      if (g.state !== 'play' || !g.possTeam) continue;
      o.tempoGioco += dt;
      const att = g.possTeam, dif = H.teams.find(t => t !== att), gx = att.dir * 12.5;      // gx: la porta che att attacca
      if (g.possT !== possT) { possT = g.possT; o.possessi++; if (conLibero) o.possessiConLibero++; conLibero = false; }
      if (att.players.some(q => q.excluded) || dif.players.some(q => q.excluded)) continue;
      let liberi = 0;
      for (const q of att.players) {
        if (q.isGK || q.excluded || q.uscendo) continue;
        const dq = Math.hypot(gx - q.x, q.z); if (dq > 7) continue;
        const coperto = dif.players.some(d => !d.isGK && !d.excluded && Math.hypot(d.x - q.x, d.z - q.z) < 2 && Math.hypot(gx - d.x, d.z) <= dq + 0.3);
        if (!coperto) liberi++;
      }
      if (liberi) { o.tempoLibero += dt; conLibero = true; o.maxLiberi = Math.max(o.maxLiberi, liberi); }
      // occasione di tiro speciale (come occasioneControfuga): portatore che nuota verso la porta, nessuno davanti, 2,5-8 m
      const h = B.holder; let occ = false;
      if (h && h.team === att && !h.isGK && B.state === 'held') {
        const d = Math.hypot(gx - h.x, h.z), v = Math.hypot(h.vx, h.vz), verso = ((gx - h.x) * h.vx - h.z * h.vz) / (d * v || 1);
        const davanti = dif.players.filter(q => !q.isGK && !q.excluded && (Math.hypot(gx - q.x, q.z) < d + 0.8 || Math.hypot(q.x - h.x, q.z - h.z) < 2)).length;
        occ = d >= 2.5 && d <= 8 && ((h.oriz || 0) > 0.35 || v > 0.9) && verso >= 0.5 && davanti === 0;
      }
      if (occ && !inOcc) o.occasioniSpeciali++;
      inOcc = occ;
      if (o.occasioniVere !== null) { const vera = !!(h && h.team === att && H.prova.occasioneControfuga(h)); if (vera && !inVera) o.occasioniVere++; inVera = vera; }
    }
    o.scambi = H.teams.map((t, i) => (t.scambi || 0) - o.scambi0[i]);
    return o;
  });
  await pg.close(); return r;
}
const tot = { possessi: 0, tempoLibero: 0, possessiConLibero: 0, maxLiberi: 0, occasioniSpeciali: 0, occasioniVere: 0, conVere: false, tempoGioco: 0, scambi: 0 };
for (let k = 0; k < partite; k += paralleli) {
  const giro = []; for (let j = k; j < Math.min(partite, k + paralleli); j++) giro.push(partita(j));
  for (const r of await Promise.all(giro)) {
    for (const c of ['possessi', 'tempoLibero', 'possessiConLibero', 'occasioniSpeciali', 'tempoGioco']) tot[c] += r[c];
    tot.maxLiberi = Math.max(tot.maxLiberi, r.maxLiberi); tot.scambi += r.scambi.reduce((s, x) => s + x, 0);
    if (r.occasioniVere !== null) { tot.occasioniVere += r.occasioniVere; tot.conVere = true; }
  }
}
await browser.close(); server.httpServer.close();
console.log(`${partite} partite · ${(tot.possessi / partite).toFixed(1)} possessi a partita`);
console.log(`attaccante libero davanti alla porta (entro 7 m, nessun difensore entro 2 m dalla parte della porta): ${(100 * tot.tempoLibero / tot.tempoGioco).toFixed(1)}% del tempo di gioco alla pari; possessi con almeno un attaccante libero ${(100 * tot.possessiConLibero / Math.max(1, tot.possessi)).toFixed(1)}%; al massimo ${tot.maxLiberi} insieme`);
console.log(`occasioni di schizzo o colonnello (portatore verso la porta senza nessuno davanti, 2,5-8 m): ${(tot.occasioniSpeciali / partite / 2).toFixed(1)} per squadra a partita`);
if (tot.conVere) console.log(`tasti speciali con la regola del gioco (occasioneControfuga): ${(tot.occasioniVere / partite / 2).toFixed(1)} per squadra a partita`);
console.log(`cambi di marcatura: ${(tot.scambi / partite / 2).toFixed(1)} per squadra a partita`);
