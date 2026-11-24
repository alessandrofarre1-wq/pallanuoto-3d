// Passaggi (v0.79, richieste di Ale: «troppi passaggi sbagliati»; «i passaggi possono essere di due modi: o morbido sull'acqua
// vicino al compagno oppure alto e teso»).
// 1. Tipo di passaggio: morbido nella circolazione tranquilla con la linea libera e al centroboa marcato (in acqua davanti a lui);
//    teso con l'uomo in più, negli ultimi 8 s del possesso, oltre 8 m, con un avversario vicino alla linea e al compagno libero in
//    posizione di tiro.
// 2. Scelta del compagno con la levetta: va a quello puntato; il centroboa non riceve per sbaglio puntando un'ala.
// 3. Levetta tenuta dopo il passaggio: chi riceve (ora comandato) va incontro alla palla invece di nuotare via, e la prende.
// Uso: node tests/passaggi.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4336, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 17; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer, d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = d; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); document.getElementById('goBtn').click(); window.__salta(420); });

// ---------- 1. tipo di passaggio ----------
const tipi = await pg.evaluate(() => {
  const H = window.__pallanuoto, R = H.regole, B = H.ball, A = H.teams[0], D = H.teams[1];
  const gx = Math.sign(A.dir || 1) * 12.5, sx = Math.sign(gx);
  const scena = ({ uomoInPiu = false, shot = 22, lontano = false, difensoreSullaLinea = false, centro = false, libero = false } = {}) => {
    H.replay?.interrompiReplay?.(); Object.assign(H.game, { state: 'play', after: null, penalty: null, shot });
    for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.stunUntil = 0; q.vx = q.vz = 0; q.cut = null; q.charging = false; q.tackleCD = 9; }
    // attacco schierato: portatore al 5 m a destra, compagno al 5 m a sinistra (4,4 m) o all'ala opposta (lontano)
    const h = A.players[4], m = centro ? A.players[1] : lontano ? A.players[3] : A.players[5];
    for (let i = 1; i <= 6; i++) { const p = A.players[i]; p.x = gx - sx * [0, 2.1, 2.3, 2.3, 5.4, 5.4, 7.0][i]; p.z = [0, 0, 5.4, -5.4, 2.2, -2.2, 0][i]; }
    // difensori lontani dalle linee di passaggio, tranne quello sulla linea (o il marcatore del centro)
    for (let i = 1; i <= 6; i++) { const d = D.players[i]; d.x = gx - sx * 1.0; d.z = -6 + i * 1.6; }
    // il compagno ha il suo marcatore a 1 m, dalla parte della porta (fuori dalla linea del passaggio); con «libero» nessuno vicino
    if (!libero && !centro) { const d = D.players[5]; d.x = m.x + sx * 1.0; d.z = m.z * 0.9; }
    if (difensoreSullaLinea) { const d = D.players[2]; d.x = (h.x + m.x) / 2; d.z = (h.z + m.z) / 2 + 0.4; }
    if (centro) { const d = D.players[6]; d.x = m.x + sx * 0.6; d.z = m.z + 0.3; }
    if (uomoInPiu) D.players[3].excluded = true;
    R.giveBall(h); H.game.possT = H.game.time - 8; H.prova.doPass(h, m);
    return { tipo: B.tipoPassaggio, kind: B.kind, target: B.target === m, vy: B.vy, volo: Math.hypot(B.tx - h.x, B.tz - h.z) };
  };
  return { tranquillo: scena(), uomoInPiu: scena({ uomoInPiu: true }), ultimi: scena({ shot: 6 }), lontano: scena({ lontano: true }), linea: scena({ difensoreSullaLinea: true }), centro: scena({ centro: true }), libero: scena({ libero: true }) };
});
prova(tipi.tranquillo.tipo === 'morbido' && tipi.tranquillo.target, `circolazione tranquilla, linea libera: passaggio morbido (${tipi.tranquillo.tipo})`);
prova(tipi.uomoInPiu.tipo === 'teso', `con l'uomo in più: alto e teso (${tipi.uomoInPiu.tipo})`);
prova(tipi.ultimi.tipo === 'teso', `negli ultimi secondi del possesso: alto e teso (${tipi.ultimi.tipo})`);
prova(tipi.lontano.tipo === 'teso', `cambio di lato lungo (${tipi.lontano.volo.toFixed(1)} m): alto e teso (${tipi.lontano.tipo})`);
prova(tipi.linea.tipo === 'teso', `con un avversario vicino alla linea: alto e teso (${tipi.linea.tipo})`);
prova(tipi.centro.tipo === 'morbido', `al centroboa marcato: morbido in acqua davanti a lui (${tipi.centro.tipo})`);
prova(tipi.libero.tipo === 'teso', `al compagno libero in posizione di tiro: alto e teso, in mano (${tipi.libero.tipo})`);

// ---------- 2. scelta del compagno con la levetta ----------
const mira = await pg.evaluate(() => {
  const H = window.__pallanuoto, A = H.teams[0], D = H.teams[1], gx = Math.sign(A.dir || 1) * 12.5, sx = Math.sign(gx);
  for (const q of H.allPlayers) { q.excluded = false; q.uscendo = false; }
  for (let i = 1; i <= 6; i++) { const p = A.players[i]; p.x = gx - sx * [0, 2.1, 2.3, 2.3, 5.4, 5.4, 7.0][i]; p.z = [0, 0, 5.4, -5.4, 2.2, -2.2, 0][i]; }
  for (let i = 1; i <= 6; i++) { const d = D.players[i], a = A.players[[0, 1, 2, 3, 4, 5, 6][i]]; d.x = a.x + sx * 0.7; d.z = a.z * 0.9; }
  // portatore al 5 m destro: i compagni sono ad almeno 22° l'uno dall'altro (nessuno in fila con un altro)
  const h = A.players[4]; let giusti = 0, tot = 0;
  for (const m of A.players) {
    if (m === h || m.isGK) continue;
    for (const err of [-0.12, 0, 0.12]) {      // ±7° di errore
      const vx = m.x - h.x, vz = m.z - h.z, l = Math.hypot(vx, vz), c = Math.cos(err), s = Math.sin(err);
      tot++; if (H.prova.humanPassTarget(h, (vx * c - vz * s) / l, (vx * s + vz * c) / l) === m) giusti++;
    }
  }
  // puntando l'ala destra (2) dal 5 m sinistro, con il centroboa a circa 30°: deve ricevere l'ala
  const h2 = A.players[5], ala = A.players[2], vx = ala.x - h2.x, vz = ala.z - h2.z, l = Math.hypot(vx, vz);
  const scelto = H.prova.humanPassTarget(h2, vx / l, vz / l), boa = A.players[1];
  const ang = Math.acos(((boa.x - h2.x) * vx + (boa.z - h2.z) * vz) / (Math.hypot(boa.x - h2.x, boa.z - h2.z) * l)) * 180 / Math.PI;
  return { giusti, tot, ala: scelto === ala, ang };
});
prova(mira.giusti === mira.tot, `levetta puntata su ciascun compagno (±7°): riceve quello puntato ${mira.giusti} volte su ${mira.tot}`);
prova(mira.ala, `puntando l'ala con il centroboa a ${mira.ang.toFixed(0)}°: riceve l'ala, non il centroboa`);

// ---------- 3. levetta tenuta dopo il passaggio ----------
const tenuta = await pg.evaluate(() => {
  const H = window.__pallanuoto, R = H.regole, B = H.ball, A = H.teams[0], D = H.teams[1];
  const tasto = (tipo, code) => window.dispatchEvent(new KeyboardEvent(tipo, { code }));
  const FRECCE = [['ArrowUp'], ['ArrowDown'], ['ArrowLeft'], ['ArrowRight']], dir = [];
  for (const f of FRECCE) { for (const k of f) tasto('keydown', k); window.__salta(2); dir.push({ x: H.inp.x, z: H.inp.z }); for (const k of f) tasto('keyup', k); window.__salta(2); }
  const gx = Math.sign(A.dir || 1) * 12.5, sx = Math.sign(gx);
  let presi = 0, prove = 0, versoPalla = 0;
  for (let k = 0; k < 8; k++) {
    H.replay?.interrompiReplay?.(); Object.assign(H.game, { state: 'play', after: null, penalty: null, shot: 22 });
    for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.stunUntil = 0; q.vx = q.vz = 0; q.cut = null; q.charging = false; q.tackleCD = 9; q.colpi = []; }
    for (let i = 1; i <= 6; i++) { const p = A.players[i]; p.x = gx - sx * [0, 2.1, 2.3, 2.3, 5.4, 5.4, 7.0][i]; p.z = [0, 0, 5.4, -5.4, 2.2, -2.2, 0][i]; }
    for (let i = 1; i <= 6; i++) { const d = D.players[i]; d.x = gx - sx * 0.8; d.z = -6 + i * 1.6; }
    // portatore al centro dei 7 m, compagno a lato (a destra o a sinistra, a turno): freccia verso di lui
    const h = A.players[6], m = A.players[k % 2 ? 4 : 5]; h.x = gx - sx * 7; h.z = 0; m.x = gx - sx * 7; m.z = k % 2 ? 4.5 : -4.5;
    R.giveBall(h); H.game.possT = H.game.time - 8; window.__salta(12);
    if (H.ball.holder !== h) continue;
    const vx = m.x - h.x, vz = m.z - h.z; let best = 0, bc = -2;
    dir.forEach((d, i) => { const c = (d.x * vx + d.z * vz) / ((Math.hypot(d.x, d.z) || 1) * Math.hypot(vx, vz)); if (c > bc) { bc = c; best = i; } });
    const freccia = FRECCE[best][0]; tasto('keydown', freccia); window.__salta(4);
    tasto('keydown', 'KeyD'); window.__salta(3); tasto('keyup', 'KeyD');
    let partito = false, d0 = null, dMin = 99; prove++;
    for (let i = 0; i < 120; i++) {
      window.__salta(1);
      if (!partito && B.state === 'flight' && B.kind === 'pass' && B.target === m) { partito = true; d0 = Math.hypot(m.x - B.tx, m.z - B.tz); }
      if (partito) dMin = Math.min(dMin, Math.hypot(m.x - B.tx, m.z - B.tz));
      if (partito && B.state === 'held') { if (B.holder === m) presi++; break; }
    }
    if (partito && dMin <= d0 + 0.05) versoPalla++;
    tasto('keyup', freccia); window.__salta(20);
  }
  return { presi, prove, versoPalla };
});
prova(tenuta.prove >= 6 && tenuta.presi === tenuta.prove, `levetta tenuta verso il compagno anche dopo il passaggio: preso ${tenuta.presi} volte su ${tenuta.prove}`);
prova(tenuta.versoPalla === tenuta.prove, `chi riceve non si allontana dal punto d'arrivo della palla (${tenuta.versoPalla} su ${tenuta.prove})`);

prova(!errori.length, 'nessun errore nella pagina' + (errori.length ? ': ' + errori.slice(0, 2).join(' | ') : ''));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nPassaggi: tutte le prove superate' : '\nPassaggi: prove NON superate');
process.exit(ok ? 0 : 1);
