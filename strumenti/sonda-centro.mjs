// Sonda (v0.81, Ale: «troppi tiri a schizzo e colonnello, poche beduine e pochi passaggi al centroboa»). In partite computer contro
// computer (ITA–HUN, tempi da 8 minuti) misura il gioco del centroboa nelle azioni in parità:
// - quante azioni passano dal centroboa (la palla gli arriva almeno una volta) e quanti palloni riceve a partita;
// - come riceve: spalle alla porta con il marcatore dietro, già girato verso la porta, oppure libero;
// - come finisce il suo possesso: tiro (con il gesto: beduina, sciarpa, tiro dopo la girata...), espulsione o rigore procurati,
//   fallo semplice, fallo in attacco, palla rubata, scarico al perimetro;
// - i gol del centroboa (tiro suo seguito da un gol entro 4 s);
// - i passaggi verso il centroboa e quanti finiscono agli avversari (il «passaggio sbagliato al centro» dello studio).
// Confronto reale: studio su 11 partite d'élite maschili (7 di campionato italiano, 4 di Champions League), «Elite water polo: a
// technical and tactical analysis of the centre forward role»: delle azioni del centroboa, gol 6,7%, tiro senza gol 7,2%,
// espulsione procurata 41,4%, fallo in attacco 17,9%, palla rubata 16,6%, passaggio sbagliato al centro 10,1%.
// Uso: node strumenti/sonda-centro.mjs [--dist=dist] [--porta=4681] [--partite=2] [--paralleli=2]
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => process.argv.find(x => x.startsWith('--' + k + '='))?.slice(k.length + 3);
const dist = arg('dist') || 'dist', porta = +(arg('porta') || 4681), partite = +(arg('partite') || 2), paralleli = +(arg('paralleli') || 2);
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
    const H = window.__pallanuoto, B = H.ball, g = H.game, P = H.prova;
    if (!P.centroAttacco) return { errore: 'questa build non espone centroAttacco (prova)' };
    H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click();
    g.autoplay = true; for (const t of H.teams) t.human = false; H.renderer.render = () => {};
    const o = { azioniParita: 0, azioniConCentro: 0, ricezioni: 0, ricevute: {}, marcatore: {}, duello: {}, esiti: {}, gesti: {}, motivi: {}, tiri: 0, gol: 0, girate: 0, falliSemplici: 0, durata: 0, passaggi: 0, passaggiPersi: 0, espulsioniSulPassaggio: 0 };
    const conta = (m, k) => { m[k] = (m[k] || 0) + 1; };
    let az = null, azConCentro = false, rec = null, tiroAperto = null, prev = null, giro = B.revisioneTiro, inArrivo = null;
    const espulsi = t => t.players.filter(q => q.excluded).length;
    for (let i = 0; i < 60 * 60 * 40 && g.state !== 'over'; i++) {
      window.__passo();
      const a = H.v046.azioneAperta();
      if (a !== az) { if (az && az.tipo === 'parita') { o.azioniParita++; if (azConCentro) o.azioniConCentro++; } az = a; azConCentro = false; }
      if (tiroAperto && g.time - tiroAperto.t > 4) tiroAperto = null;
      if (tiroAperto && tiroAperto.team.score > tiroAperto.score) { o.gol++; conta(o.gesti, tiroAperto.gesto + ' (gol)'); tiroAperto = null; }
      const h = B.state === 'held' ? B.holder : null;
      // passaggi verso il centroboa (parità)
      if (B.revisioneTiro !== giro) {
        giro = B.revisioneTiro; inArrivo = null;
        const da = B.shooter;
        if (B.kind === 'pass' && da && !da.isGK && a && a.tipo === 'parita' && B.target && B.target === P.centroAttacco(da.team) && B.target !== da) {
          o.passaggi++; inArrivo = { team: da.team, target: B.target, espulsi: espulsi(H.teams.find(t => t !== da.team)) };
        }
      }
      if (inArrivo) {
        const dif = H.teams.find(t => t !== inArrivo.team);
        if (espulsi(dif) > inArrivo.espulsi) { o.espulsioniSulPassaggio++; inArrivo = null; }
        else if (h) { if (h.team !== inArrivo.team) o.passaggiPersi++; inArrivo = null; }
      }
      // fine del possesso del centroboa
      if (rec && h !== rec.c) {
        const c = rec.c, dif = H.teams.find(t => t !== c.team);
        let esito;
        if (espulsi(dif) > rec.espulsi) esito = g.penalty ? 'rigore procurato' : 'espulsione procurata';
        else if (g.penalty && g.penalty.team === c.team) esito = 'rigore procurato';
        else if (B.shooter === c && B.kind === 'shot') { esito = 'tiro'; o.tiri++; const gesto = rec.gesto || 'shot'; conta(o.gesti, gesto); conta(o.motivi, rec.motivo || '?'); tiroAperto = { t: g.time, team: c.team, score: c.team.score, gesto }; }
        else if (B.shooter === c && B.kind === 'pass') esito = 'scarico';
        else if (h && h.team !== c.team) esito = h.freeThrow ? 'fallo in attacco' : 'palla rubata';
        else if (h && h.team === c.team) esito = 'altro (compagno)';
        else esito = 'altro';
        conta(o.esiti, esito); o.durata += g.time - rec.t0; rec = null;
      }
      // il duello mentre la palla è sul perimetro (un compagno del centroboa la tiene, parità, centroboa entro 5 m): ogni 0,25 s
      if (h && !h.isGK && a && a.tipo === 'parita' && i % 15 === 0) {
        const c = P.centroAttacco(h.team), gx = h.team.dir * 12.5, dif = H.teams.find(t => t !== h.team);
        if (c && c !== h && Math.hypot(gx - c.x, c.z) < 5 && !dif.players.some(q => q.excluded)) {
          const def = P.difensoreCentro(c), l = P.leggiCentro(c, def, B);
          conta(o.duello, l.tipo + (l.ricevibile ? ' (servibile)' : ''));
        }
      }
      // inizio di un possesso del centroboa (parità, entro 5 m dalla porta)
      if (h && !rec && a && a.tipo === 'parita' && !h.isGK) {
        const c = P.centroAttacco(h.team), dif = H.teams.find(t => t !== h.team), gx = h.team.dir * 12.5;
        if (c === h && Math.hypot(gx - h.x, h.z) < 5 && !dif.players.some(q => q.excluded)) {
          rec = { c, t0: g.time, espulsi: espulsi(dif), gesto: null, tipo: null };
          o.ricezioni++; azConCentro = true;
        }
      }
      if (rec && B.holder === rec.c) {
        const c = rec.c;
        if (!rec.tipo && B.holdTime >= 0.12) {
          const def = P.difensoreCentro(c), l = P.leggiCentro(c, def, c);
          rec.tipo = P.boaFrontePorta(c) ? 'già girato verso la porta' : l.tipo === 'libero' ? 'libero' : l.spalle ? 'spalle alla porta, marcatore dietro' : 'marcatore ' + l.tipo;
          conta(o.ricevute, rec.tipo);
          // dove sta il marcatore (anche quando è già girato): tipo di lettura e distanza
          const dm = def ? Math.hypot(def.x - c.x, def.z - c.z) : 99, fascia = dm < 1.3 ? 'sotto 1,3 m' : dm < 1.8 ? '1,3-1,8 m' : 'oltre 1,8 m';
          conta(o.marcatore, (rec.tipo === 'già girato verso la porta' ? 'girato · ' : 'non girato · ') + l.tipo + ' ' + fascia);
        }
        if (c.act && c.act.kind) rec.gesto = c.act.kind;
        if (c.motivoTiro) rec.motivo = c.motivoTiro;      // doShoot lo cancella al rilascio
        if (c.girata && !rec.girata) { rec.girata = true; o.girate++; }
        if (c.freeThrow && !rec.fallo) { rec.fallo = true; o.falliSemplici++; }
      }
      prev = h;
    }
    return o;
  });
  await pg.close(); return r;
}
const tot = { azioniParita: 0, azioniConCentro: 0, ricezioni: 0, ricevute: {}, marcatore: {}, duello: {}, esiti: {}, gesti: {}, motivi: {}, tiri: 0, gol: 0, girate: 0, falliSemplici: 0, durata: 0, passaggi: 0, passaggiPersi: 0, espulsioniSulPassaggio: 0 };
for (let k = 0; k < partite; k += paralleli) {
  const giro = []; for (let j = k; j < Math.min(partite, k + paralleli); j++) giro.push(partita(j));
  for (const r of await Promise.all(giro)) {
    if (r.errore) { console.log(r.errore); process.exit(1); }
    for (const c of ['azioniParita', 'azioniConCentro', 'ricezioni', 'tiri', 'gol', 'girate', 'falliSemplici', 'durata', 'passaggi', 'passaggiPersi', 'espulsioniSulPassaggio']) tot[c] += r[c];
    for (const c of ['ricevute', 'marcatore', 'duello', 'esiti', 'gesti', 'motivi']) for (const [k2, v] of Object.entries(r[c])) tot[c][k2] = (tot[c][k2] || 0) + v;
  }
}
await browser.close(); server.httpServer.close();
const sq = x => (x / partite / 2).toFixed(1), pc = (x, n) => (100 * x / Math.max(1, n)).toFixed(1) + '%';
const elenco = (m, n) => Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v} (${pc(v, n)})`).join(' · ');
console.log(`${partite} partite · azioni in parità ${sq(tot.azioniParita)} per squadra a partita, con la palla al centroboa ${pc(tot.azioniConCentro, tot.azioniParita)}`);
console.log(`palloni al centroboa (entro 5 m, parità): ${sq(tot.ricezioni)} per squadra a partita · tenuti in media ${(tot.durata / Math.max(1, tot.ricezioni)).toFixed(2)} s`);
console.log(`passaggi verso il centroboa: ${sq(tot.passaggi)} per squadra a partita, presi dagli avversari ${pc(tot.passaggiPersi, tot.passaggi)}, espulsioni sul passaggio ${tot.espulsioniSulPassaggio}`);
console.log(`come riceve: ${elenco(tot.ricevute, tot.ricezioni)}`);
console.log(`dove sta il marcatore alla ricezione: ${elenco(tot.marcatore, tot.ricezioni)}`);
{ const n = Object.values(tot.duello).reduce((x, y) => x + y, 0); console.log(`il duello mentre la palla è sul perimetro (campioni ogni 0,25 s): ${elenco(tot.duello, n)}`); }
console.log(`come finisce: ${elenco(tot.esiti, tot.ricezioni)}`);
{ const e = tot.esiti, golC = tot.gol, tiroNo = (e.tiro || 0) - tot.gol, esp = (e['espulsione procurata'] || 0) + (e['rigore procurato'] || 0) + tot.espulsioniSulPassaggio;
  const voci = { 'gol': golC, 'tiro senza gol': tiroNo, 'espulsione o rigore procurati': esp, 'fallo in attacco': e['fallo in attacco'] || 0, 'palla rubata': e['palla rubata'] || 0, 'passaggio sbagliato al centro': tot.passaggiPersi };
  const n = Object.values(voci).reduce((x, y) => x + y, 0), reale = { 'gol': 6.7, 'tiro senza gol': 7.2, 'espulsione o rigore procurati': 41.4, 'fallo in attacco': 17.9, 'palla rubata': 16.6, 'passaggio sbagliato al centro': 10.1 };
  console.log('confronto con lo studio (senza scarichi e falli semplici): ' + Object.entries(voci).map(([k, v]) => `${k} ${pc(v, n)} (vero ${reale[k]}%)`).join(' · ')); }
console.log(`girate cominciate ${tot.girate}, falli semplici subiti ${tot.falliSemplici}`);
console.log(`tiri del centroboa: ${sq(tot.tiri)} per squadra a partita, gol ${sq(tot.gol)} (${pc(tot.gol, tot.tiri)} dei tiri)`);
console.log(`gesti: ${elenco(tot.gesti, tot.tiri)}`);
console.log(`motivi: ${elenco(tot.motivi, tot.tiri)}`);
