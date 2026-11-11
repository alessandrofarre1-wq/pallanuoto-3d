// Prove della fisica della palla, fuori dalla partita: si lancia la palla in situazioni precise e si controlla cosa fa.
// Uso: node tests/fisica-palla.mjs [--no-build]     (esce con errore se una prova fallisce)
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4177, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage();
pg.on('pageerror', e => console.log('errore nella pagina:', e.message));
await pg.addInitScript(() => { window.requestAnimationFrame = () => 1; });
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__pallanuoto.palla', null, { timeout: 60000, polling: 100 });
const esiti = await pg.evaluate(() => {
  const { passoPalla, velocitaDiLancio } = window.__pallanuoto.palla, HL = 12.5, GW = 1.5, GH = 0.9, dt = 1 / 60, out = [];
  // lancia da "da" verso "a" in t secondi e segue la palla per "durata" secondi
  const lancia = (da, a, t, giri, durata, ogni) => {
    const L = velocitaDiLancio(...da, ...a, t, giri), B = { x: da[0], y: da[1], z: da[2], ...L }, storia = [], fatti = { urti: [], acqua: [] };
    const v0 = Math.hypot(L.vx, L.vy, L.vz);
    for (let i = 0; i < Math.round(durata / dt); i++) {
      const e = passoPalla(B, dt, null);
      for (const u of e.urti) fatti.urti.push(u);
      if (e.acqua) fatti.acqua.push(e.acqua.tipo);
      storia.push({ t: (i + 1) * dt, x: B.x, y: B.y, z: B.z, vx: B.vx, vy: B.vy, vz: B.vz });
      if (ogni) ogni(B, (i + 1) * dt);
    }
    return { B, storia, fatti, v0 };
  };
  const r = x => +x.toFixed(2), prova = (nome, ok, dettagli) => out.push({ nome, ok: !!ok, dettagli });
  const disegni = [], disegna = (nome, colore, storia) => disegni.push({ nome, colore, punti: storia.filter((p, i) => i % 2 === 0).map(p => [p.x, p.y]) });
  const al = (s, t) => s.reduce((a, p) => Math.abs(p.t - t) < Math.abs(a.t - t) ? p : a);

  // 1. mira: la palla arriva dove si è mirato, nonostante aria ed effetto
  { const { storia, v0 } = lancia([4, 1.1, 0.5], [HL - 1, 0.5, 1.0], 0.45, 20, 0.45), p = al(storia, 0.45), err = Math.hypot(p.x - (HL - 1), p.y - 0.5, p.z - 1);
    prova('Mira del tiro', err < 0.06, `errore ${r(err * 100)} cm · partenza ${r(v0)} m/s, arrivo ${r(Math.hypot(p.vx, p.vy, p.vz))} m/s (l'aria la frena)`); }
  { const { storia } = lancia([0, 1.0, 0], [6, 0.45, 3], 0.6, 9, 0.6), p = al(storia, 0.6), err = Math.hypot(p.x - 6, p.y - 0.45, p.z - 3);
    prova('Mira del passaggio', err < 0.06, `errore ${r(err * 100)} cm`); }
  // 2. palo: il tiro sul palo torna in campo
  { const { B, fatti, storia } = lancia([6, 1.1, 0], [HL, 0.45, GW + 0.045], 0.36, 20, 0.8), vmax = Math.min(...storia.map(p => p.vx));
    disegna('Palo: torna in campo', '#ef4444', storia);
    prova('Palo pieno: torna in campo', fatti.urti.includes('palo') && vmax < -3 && B.x < HL, `urti: ${fatti.urti.join(', ')} · velocità di ritorno ${r(-vmax)} m/s · finisce a x=${r(B.x)}`); }
  // 3. palo interno: tocca il palo ed entra
  { const { B, fatti } = lancia([6, 1.1, 0.6], [HL, 0.45, GW - 0.065], 0.36, 20, 1.2);
    prova('Palo interno: entra', fatti.urti.includes('palo') && B.x > HL && Math.abs(B.z) < GW + 0.1, `urti: ${fatti.urti.join(', ')} · finisce a x=${r(B.x)}, z=${r(B.z)}`); }
  // 4. traversa: sotto entra, sopra esce verso l'alto
  { const { fatti, storia } = lancia([6, 1.1, 0], [HL, GH + 0.045, 0.3], 0.36, 20, 0.6), dopo = storia.find(p => p.t > 0.4);
    prova('Traversa piena: rimbalza', fatti.urti.includes('traversa') && dopo.vx < 0, `urti: ${fatti.urti.join(', ')} · dopo l'urto vx=${r(dopo.vx)}, vy=${r(dopo.vy)}`); }
  // 5. gol: la palla resta in fondo alla rete
  { const { B, fatti, storia } = lancia([6, 1.1, 0], [HL, 0.4, 0.5], 0.33, 20, 2.5, B => { if (B.x > HL) { B.vx *= Math.exp(-3 * dt); B.vz *= Math.exp(-3 * dt); } });      // come in partita: la rete smorza
    disegna('Gol: si ferma in rete', '#60a5fa', storia.filter(p => p.t < 1.5));
    prova('Gol: la palla resta nella rete', B.x > HL && B.x < HL + 0.8 && Math.abs(B.z) < GW && fatti.urti.includes('rete') && Math.hypot(B.vx, B.vz) < 0.5, `urti: ${[...new Set(fatti.urti)].join(', ')} · ferma a x=${r(B.x)} (linea ${HL}, fondo rete ${HL + 0.8}), velocità ${r(Math.hypot(B.vx, B.vz))} m/s`); }
  // 6. tiro a schizzo: teso e veloce, rimbalza sull'acqua e prosegue
  { const { fatti, storia } = lancia([4, 1.0, 0], [HL - 1.6, 0.15, 0.6], 0.36, 20, 0.7), dopo = storia.find(p => p.t > 0.42);
    disegna('Tiro a schizzo', '#facc15', storia);
    prova('Tiro a schizzo: rimbalza sull\'acqua', fatti.acqua[0] === 'schizzo' && dopo.vy > 0 && dopo.vx > 8, `acqua: ${fatti.acqua.join(', ')} · dopo lo schizzo sale a ${r(dopo.vy)} m/s e avanza a ${r(dopo.vx)} m/s`); }
  // 7. palombella: cade dall'alto, fa il tonfo e si ferma a galleggiare
  { const { B, fatti, storia } = lancia([2, 1.0, 0], [7, 0.15, 0], 1.3, 34, 6), alta = Math.max(...storia.map(p => p.y));
    disegna('Palombella', '#4ade80', storia.filter(p => p.t < 2.2));
    prova('Palombella: tonfo e galleggia', fatti.acqua[0] === 'tonfo' && Math.abs(B.y - 0.05) < 0.02 && Math.hypot(B.vx, B.vz) < 0.2, `punto più alto ${r(alta)} m · acqua: ${fatti.acqua[0]} · alla fine quota ${r(B.y)} m, velocità ${r(Math.hypot(B.vx, B.vz))} m/s`); }
  // 8. effetto: a parità di lancio, la palla che gira all'indietro arriva più in alto di quella che non gira
  { const L = velocitaDiLancio(0, 1, 0, 9, 0.5, 0, 0.6, 0), vola = w => { const B = { x: 0, y: 1, z: 0, vx: L.vx, vy: L.vy, vz: L.vz, wx: 0, wy: 0, wz: w }; for (let i = 0; i < 36; i++) passoPalla(B, dt, null); return B.y; };
    const senza = vola(0), con = vola(30);
    prova('Effetto: la rotazione all\'indietro sostiene la palla', con > senza + 0.05, `dopo 0,6 s: senza rotazione ${r(senza)} m, con rotazione ${r(con)} m di altezza`); }
  // 9. corpo: la palla vagante rimbalza sulla testa di un giocatore
  { const B = { x: 0, y: 0.25, z: 0, vx: 4, vy: 0.5, vz: 0, wx: 0, wy: 0, wz: 0 }, g = [{ x: 0.9, z: 0, attivo: true }]; let urto = false;
    for (let i = 0; i < 40; i++) { const e = passoPalla(B, dt, g); if (e.urti.includes('giocatore')) urto = true; }
    prova('Corpi: la palla vagante rimbalza su un giocatore', urto && B.x < 0.9, `urto ${urto ? 'sì' : 'no'} · la palla finisce a x=${r(B.x)} (giocatore a 0.9)`); }
  return { out, disegni };
});
// disegno delle traiettorie viste di lato (x = distanza lungo il campo, y = altezza sull'acqua)
{
  const USCITA = path.join(ROOT, 'tests/screenshot/fisica-palla.png');
  await pg.setViewportSize({ width: 1100, height: 430 });
  await pg.setContent('<body style="margin:0;background:#0b1d33"><canvas id="c" width="1100" height="430"></canvas></body>');
  await pg.evaluate(({ disegni }) => {
    const c = document.getElementById('c'), x = c.getContext('2d'), X0 = 1.5, X1 = 13.8, sx = v => 40 + (v - X0) / (X1 - X0) * 1020, sy = v => 330 - v * 105;
    x.fillStyle = '#16324f'; x.fillRect(0, 0, 1100, sy(0)); x.fillStyle = '#1f86d2'; x.fillRect(0, sy(0), 1100, 430);
    x.strokeStyle = 'rgba(255,255,255,.15)'; x.fillStyle = 'rgba(255,255,255,.6)'; x.font = '12px system-ui';
    for (let h = 1; h <= 2; h++) { x.beginPath(); x.moveTo(0, sy(h)); x.lineTo(1100, sy(h)); x.stroke(); x.fillText(h + ' m', 6, sy(h) - 4); }
    for (let d = 2; d <= 12; d += 2) x.fillText(d + ' m', sx(d) - 10, 424);
    // porta di lato: palo, traversa e rete
    x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.moveTo(sx(12.5), sy(-0.3)); x.lineTo(sx(12.5), sy(0.94)); x.stroke();
    x.lineWidth = 1.5; x.strokeStyle = 'rgba(255,255,255,.7)'; x.strokeRect(sx(12.5), sy(0.94), sx(13.3) - sx(12.5), sy(-0.3) - sy(0.94));
    x.fillStyle = '#fff'; x.fillText('porta', sx(12.55), sy(1.02));
    disegni.forEach((d, i) => { x.strokeStyle = d.colore; x.fillStyle = d.colore; x.lineWidth = 2.5; x.beginPath(); d.punti.forEach(([px, py], k) => k ? x.lineTo(sx(px), sy(py)) : x.moveTo(sx(px), sy(py))); x.stroke();
      for (const [px, py] of d.punti.filter((p, k) => k % 3 === 0)) { x.beginPath(); x.arc(sx(px), sy(py), 3.5, 0, 7); x.fill(); }
      x.font = 'bold 15px system-ui'; x.fillText('● ' + d.nome, 60 + i * 250, 28); });
  }, esiti);
  await pg.locator('#c').screenshot({ path: USCITA });
}
await browser.close(); await new Promise(r => server.httpServer.close(r));
let ok = true;
for (const e of esiti.out) { if (!e.ok) ok = false; console.log(`${e.ok ? '✓' : '✗'} ${e.nome}\n    ${e.dettagli}`); }
console.log(ok ? '\n✓ Fisica della palla: tutte le prove superate' : '\n✗ Fisica della palla: prove NON superate');
process.exit(ok ? 0 : 1);
