// Attacco del computer v0.91 (Ale dopo il primo Mondiale: «a volte ci sono palesi occasioni da gol e passano la palla a un compagno e
// ricominciano l'azione, soprattutto quando partono in controfuga dovrebbero andare in porta»; «a volte partono degli schemi e passano
// la palla dall'altra rispetto all'uomo libero»). Scene con il computer in attacco:
// 1. libero davanti alla porta (4,6 m, nessuno entro 2,2 m) a metà azione: tira subito;
// 1b. libero a 6,2 m nella costruzione (primi 18 s): niente passaggio indietro, finta e tiro;
// 2. il portatore marcato a 8,5 m, un compagno libero a 4,7 m dall'altra parte e uno vicino marcato: la palla va al libero;
// 3. controfuga 2 contro 1 appena recuperata la palla: niente passaggi indietro, l'azione finisce con un tiro;
// 4. controfuga 1 contro 0: si va in porta e si tira da vicino (o di palombella se il portiere esce, v0.88);
// 5. ripartenza ordinata dopo una zona: nessuno attraversa la vasca, niente coppie affiancate, il punto fa l'appoggio centrale.
// Uso: node tests/attacco-v091.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4477, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 844, height: 390 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 11; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__logTiri = []; window.__salta = n => {
    // Questa prova legge decisioni e coordinate, non pixel. Conserva RAF e rig
    // a ogni passo; evita migliaia di disegni GPU che non vengono verificati.
    const R=window.__pallanuoto.renderer,disegna=R.render;R.render=()=>{};
    try{for(let i=0;i<n;i++){window.__tieni?.();now+=1000/60;window.__raf(now);}}
    finally{R.render=disegna;}
  };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(200); });

// scena: squadra del computer in attacco (HUN), posti dati in metri dalla porta d'attacco [d, z]; chi non è nominato va lontano, fermo
const scena = (posti, appenaRecuperata, eta = 20) => pg.evaluate(([posti, appena, eta]) => {
  const H = window.__pallanuoto, g = H.game, b = H.ball, att = H.teams[1], dif = H.teams[0], gx = 12.5 * att.dir;
  H.replay?.interrompiReplay?.(); g.state = 'play'; g.after = null; g.penalty = null; g.autoplay = true; H.fight.active = false;
  for (const t of H.teams) t.human = false;
  for (const q of H.allPlayers) Object.assign(q, { act: null, charging: false, tackleCD: 99, colpi: [], excluded: false, cut: null, fintaPronto: 0, fakeUsed: false, fakeCount: 0, shootNext: false, stunUntil: 0, vx: 0, vz: 0, oriz: 0, freeThrow: false, pressatoUntil: 0 });
  const metti = (q, [d, z], ferma) => { q.x = gx - att.dir * d; q.z = z; if (ferma) q.stunUntil = g.time + 99; };
  for (const q of att.players) if (!q.isGK) metti(q, posti.att[q.i] || [18, (q.i - 3) * 2.5], !posti.att[q.i]);
  for (const q of dif.players) if (!q.isGK) metti(q, posti.dif[q.i] || [20, (q.i - 3) * 2.5], !posti.dif[q.i]);
  const gk = dif.players[0]; gk.x = gx - att.dir * 0.7; gk.z = 0;
  const p = att.players[posti.palla]; H.regole.giveBall(p); p.fx = att.dir; p.fz = 0;
  g.possTeam = att; g.possT = appena ? g.time : g.time - eta; g.shot = appena ? 28 : Math.max(5, 28 - eta - 2); g.passaggi = 3; att.contro = null; att.entrataAzione = null;
  const out = { passaggi: [], tiro: null };
  const dG = q => Math.hypot(gx - q.x, q.z);
  let inVolo = false;
  for (let k = 0; k < 240; k++) {
    window.__salta(1);
    const passa = b.state === 'flight' && b.kind === 'pass' && b.shooter?.team === att;
    if (passa && !inVolo) out.passaggi.push({ da: b.shooter.i, a: b.target?.i, dDa: +dG(b.shooter).toFixed(1), dA: b.target ? +dG(b.target).toFixed(1) : null, t: +(k / 60).toFixed(2) });
    inVolo = passa;
    if (b.state === 'flight' && b.kind === 'shot' && b.shooter?.team === att) { out.tiro = { da: b.shooter.i, t: +(k / 60).toFixed(2), motivo: window.__logTiri.at(-1)?.m || '-', d: +dG(b.shooter).toFixed(1) }; break; }
    if (b.holder && b.holder.team !== att) break;
  }
  return out;
}, [posti, !!appenaRecuperata, eta]);

// 1. libero davanti alla porta a metà azione
const s1 = await scena({ palla: 4, att: { 4: [4.5, 1] }, dif: {} });
prova(s1.tiro && s1.tiro.da === 4 && s1.tiro.t <= 0.8 && !s1.passaggi.length, `libero a 4,6 m, nessuno entro 2 m: tira subito (${s1.tiro ? s1.tiro.t + ' s, ' + s1.tiro.motivo : 'nessun tiro'}; passaggi ${s1.passaggi.length})`);

// 1b. libero a 6 m nei primi secondi dell'azione (costruzione): niente passaggio indietro al compagno marcato, finta e tiro
const s1b = await scena({ palla: 4, att: { 4: [6, 1.5], 2: [8.5, -3] }, dif: { 2: [7.9, -2.5] } }, false, 5);
prova(s1b.tiro && s1b.tiro.da === 4 && !s1b.passaggi.length && s1b.tiro.t <= 4, `libero a 6,2 m dopo 5 s d'azione: niente passaggio indietro, tira (${s1b.tiro ? s1b.tiro.motivo + ' dopo ' + s1b.tiro.t + ' s' : 'nessun tiro'}; passaggi ${s1b.passaggi.map(x => x.da + '→' + x.a).join(', ') || 0})`);

// 2. compagno libero dall'altra parte: il portatore (Pos. 3 a 8,5 m) marcato di lato, il mezzo vicino marcato, l'ala opposta libera a 4,7 m
const s2 = await scena({ palla: 6, att: { 6: [8.5, 0.5], 4: [7.5, 3.5], 3: [4.2, -2.2] }, dif: { 6: [7.8, 1.6], 4: [6.6, 3.3] } });
const p2 = s2.passaggi[0];
prova(p2 && p2.a === 3 && p2.t <= 1.0, `il compagno libero dall'altra parte riceve per primo (${p2 ? 'passaggio a ' + p2.a + ' dopo ' + p2.t + ' s' : 'nessun passaggio'}${s2.tiro ? ', poi tiro di ' + s2.tiro.da : ''})`);
prova(s2.tiro && s2.tiro.da === 3, `e tira lui (${s2.tiro ? s2.tiro.motivo + ' da ' + s2.tiro.d + ' m' : 'nessun tiro'})`);

// 3. controfuga 2 contro 1 appena recuperata la palla
const s3 = await scena({ palla: 4, att: { 4: [8.6, -1.5], 2: [6.2, 2.5] }, dif: { 4: [6.6, -0.6] } }, true);
const indietro = s3.passaggi.filter(x => x.dA !== null && x.dA > x.dDa - 0.5);
prova(s3.tiro && indietro.length === 0, `controfuga 2 contro 1: nessun passaggio indietro, finisce con un tiro (${s3.passaggi.map(x => x.da + '→' + x.a + ' ' + x.dDa + '→' + x.dA + ' m').join(', ') || 'nessun passaggio'}; ${s3.tiro ? 'tiro di ' + s3.tiro.da + ' da ' + s3.tiro.d + ' m dopo ' + s3.tiro.t + ' s' : 'nessun tiro'})`);

// 4. controfuga 1 contro 0
const s4 = await scena({ palla: 5, att: { 5: [9, 0.8] }, dif: {} }, true);
prova(s4.tiro && s4.tiro.da === 5 && !s4.passaggi.length && s4.tiro.t <= 3.5 && (s4.tiro.d <= 5.6 || s4.tiro.motivo === 'palombella'), `controfuga 1 contro 0: va in porta e tira da vicino, o di palombella se il portiere esce (${s4.tiro ? s4.tiro.motivo + ' da ' + s4.tiro.d + ' m dopo ' + s4.tiro.t + ' s' : 'nessun tiro'})`);

// 5. TRANSIZIONE ORDINATA (Ale: «in transizione i giocatori si ammassano, ma nelle partite gli uomini sanno dove devono andare»):
// l'Ungheria recupera palla vicino alla propria porta con l'ala destra (Pos. 1) a sinistra e l'ala sinistra (Pos. 5) a destra, come dopo
// una zona: nessuno attraversa la vasca, i posti vanno a chi è già dalla parte giusta, ali e mezzi non nuotano affiancati e nessuno
// resta intorno a chi porta palla (decisione di Ale della v0.58)
const tr = await pg.evaluate(() => {
  const H = window.__pallanuoto, g = H.game, b = H.ball, att = H.teams[1], dif = H.teams[0], gx = 12.5 * att.dir;
  H.replay?.interrompiReplay?.(); g.state = 'play'; g.after = null; g.penalty = null; g.autoplay = true; H.fight.active = false;
  for (const t of H.teams) t.human = false;
  for (const q of H.allPlayers) Object.assign(q, { act: null, charging: false, tackleCD: 99, colpi: [], excluded: false, uscendo: false, cut: null, fintaPronto: 0, fakeUsed: false, fakeCount: 0, shootNext: false, stunUntil: 0, vx: 0, vz: 0, freeThrow: false, pressatoUntil: 0 });
  const metti = (q, [d, z]) => { q.x = gx - att.dir * d; q.z = z * att.dir; };
  // posti in metri dalla porta da attaccare [d, z], z positivo = destra guardando quella porta
  const A = { 1: [17, 0.3], 2: [21, -5], 3: [21, 5], 4: [20, 2], 5: [19.5, -2.4], 6: [22.6, 0.4] };
  const D = { 1: [16, -0.2], 2: [20, 4.6], 3: [20, -4.4], 4: [18.6, -2.2], 5: [17.6, 4.4], 6: [21.4, 0] };
  for (const q of att.players) if (!q.isGK) metti(q, A[q.i]);
  for (const q of dif.players) if (!q.isGK) metti(q, D[q.i]);
  att.players[0].x = -gx + att.dir * 0.7; att.players[0].z = 0; dif.players[0].x = gx - att.dir * 0.7; dif.players[0].z = 0;
  att.occupantiAttacco = null;
  g.possTeam = dif; H.regole.giveBall(att.players[4]);
  const zDi = q => q.z * att.dir;
  const out = { minCoppia: 99, attraversa: [], intorno: 0, campioni: 0, posti: null, contro: !!att.contro };
  const z0 = Object.fromEntries(att.players.map(q => [q.i, zDi(q)]));
  for (let k = 0; k < 60 * 4; k++) {
    window.__salta(1);
    if (b.holder && b.holder.team !== att) break;
    if (k === 30) out.posti = att.players.filter(q => !q.isGK).map(q => [q.i, att.occupantiAttacco ? att.occupantiAttacco.indexOf(q) : q.i]);
    if (k >= 90) {
      const v = att.players.filter(q => !q.isGK && q !== b.holder);
      for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) out.minCoppia = Math.min(out.minCoppia, Math.hypot(v[i].x - v[j].x, v[i].z - v[j].z));
      const h = b.holder; const bd = Math.abs(gx - b.x);
      if (h && h.team === att && bd > 12) { out.campioni++; if (v.some(q => Math.hypot(q.x - h.x, q.z - h.z) < 2.5)) out.intorno++; }
    }
  }
  for (const q of att.players) if (!q.isGK && Math.sign(z0[q.i]) !== 0 && Math.abs(z0[q.i]) > 3 && Math.sign(zDi(q)) !== Math.sign(z0[q.i])) out.attraversa.push(q.i);
  out.minCoppia = +out.minCoppia.toFixed(2);
  return out;
});
prova(tr.contro && tr.attraversa.length === 0, `ripartenza dopo una zona: nessuno attraversa la vasca (${tr.attraversa.length ? 'attraversano gli atleti ' + tr.attraversa.join(', ') : 'ognuno resta dalla sua parte'}; posti dopo 0,5 s ${JSON.stringify(tr.posti)})`);
prova(tr.minCoppia > 1.6, `in viaggio nessuna coppia di compagni affiancata (distanza minima tra due compagni senza palla dopo 1,5 s: ${tr.minCoppia} m)`);
prova(tr.campioni > 0 && tr.intorno / tr.campioni < 0.2, `nessuno resta intorno a chi porta palla (un compagno entro 2,5 m in ${tr.intorno} istanti su ${tr.campioni})`);

prova(errori.length === 0, `nessun errore nella pagina${errori.length ? ': ' + errori.join(' | ') : ''}`);
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nAttacco v0.91: tutte le prove superate' : '\nAttacco v0.91: PROVE FALLITE');
process.exit(ok ? 0 : 1);
