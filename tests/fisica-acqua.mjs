// Scena di prova della palla con l'acqua, separata dalla partita e senza browser (gira in Node con Rapier).
// I 10 scenari del rapporto docs/fisica-palla.md: per ognuno stampa i numeri misurati accanto al riferimento
// (de Mestre 2004, tesi Patumi) quando esiste, e disegna le traiettorie viste di lato in tests/screenshot/fisica-acqua.svg.
//
// Esce con errore solo per comportamenti impossibili: numeri non validi, palla che attraversa palo o traversa,
// energia che cresce in aria, due giri uguali con risultati diversi. Il confronto con i riferimenti è una MISURA:
// la palla di oggi è lontana da alcuni (è il motivo del nuovo modello) e lo dice, senza fallire.
// Uso: node tests/fisica-acqua.mjs [--json=file]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.window = globalThis;            // costanti.js legge window.__rnd
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { passoPalla, velocitaDiLancio, energia, RAGGIO, QUOTA_GALLEGGIA } = await import('../src/palla.js');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };

let ok = true; const errore = t => { console.log('ERRORE ' + t); ok = false; };
const r = RAGGIO;
const { BRV } = await import('../src/costanti.js');
const ARIA_DA = Math.max(r, BRV);           // sopra questa quota del centro il gioco non applica forze dell'acqua
// segue la palla per "durata" secondi a "fps" passi al secondo; registra traiettoria, contatti con l'acqua e uscite
function segui(B0, durata, fps = 60, giocatori = null) {
  const B = { wx: 0, wy: 0, wz: 0, ...B0 }, dt = 1 / fps, storia = [], urti = [], eventi = [];
  let primoContatto = null, uscita = null, hMax = 0, energiaAriaMax = -Infinity, cresciuta = 0, ePrec = energia(B), sotto = B.y < r;
  for (let i = 0; i < Math.round(durata * fps); i++) {
    const B0y = B.y, t = (i + 1) * dt, eraInAria = B.y >= r, vPrima = [Math.hypot(B.vx, B.vz), -B.vy];
    const e = passoPalla(B, dt, giocatori);
    for (const u of e.urti) urti.push({ t, u });
    if (e.acqua) eventi.push({ t, tipo: e.acqua.tipo });
    for (const k of ['x', 'y', 'z', 'vx', 'vy', 'vz', 'wx', 'wy', 'wz']) if (!Number.isFinite(B[k])) { errore(`valore non valido (${k}) a ${t.toFixed(2)} s`); return null; }
    const h = Math.max(0, r - B.y); if (primoContatto) hMax = Math.max(hMax, h);
    // primo contatto: la palla tocca il pelo dell'acqua o scatta una regola d'impatto; velocità di arrivo = quella prima del passo
    if (!primoContatto && (h > 0 || e.acqua) && !sotto) primoContatto = { t, vOrizz: vPrima[0], vVert: vPrima[1] };
    // uscita: la palla lascia l'acqua salendo; la regola «schizzo» di oggi la rimanda su prima che tocchi il pelo
    if (primoContatto && !uscita && e.acqua && e.acqua.tipo === 'schizzo') uscita = { t, vOrizz: Math.hypot(B.vx, B.vz), vVert: B.vy, contatto: 0 };
    if (primoContatto && !uscita && h === 0 && B.vy > 0 && !eraInAria) uscita = { t, vOrizz: Math.hypot(B.vx, B.vz), vVert: B.vy, contatto: t - primoContatto.t };
    // in aria (prima di toccare l'acqua e senza urti) l'energia non può crescere
    const en = energia(B);
    if (B0y >= ARIA_DA && B.y >= ARIA_DA && !e.urti.length && !e.acqua && en > ePrec * 1.0001 + 1e-6) cresciuta = Math.max(cresciuta, en / ePrec - 1);
    energiaAriaMax = Math.max(energiaAriaMax, en); ePrec = en;
    storia.push([t, B.x, B.y, B.z, Math.hypot(B.vx, B.vy, B.vz)]);
  }
  if (cresciuta > 0.001) errore(`energia cresciuta in aria del ${(cresciuta * 100).toFixed(2)}%`);
  return { B, storia, urti, eventi, primoContatto, uscita, hMax };
}
const f = (x, c = 2) => (x == null || !Number.isFinite(x) ? '–' : x.toFixed(c));
const righe = [], disegni = [];
const riga = (n, nome, misura, riferimento, vicino) => { righe.push({ n, nome, misura, riferimento, vicino });
  console.log(`${String(n).padStart(2)}. ${nome}\n    misurato:    ${misura}\n    riferimento: ${riferimento}${vicino == null ? '' : vicino ? '   → vicino' : '   → LONTANO'}`); };

// 1. caduta verticale da 1,5 m (de Mestre: arrivo 5,34 m/s, affonda 14 cm, esce a 1,4 m/s, contatto 0,145 s)
{ const s = segui({ x: 0, y: 1.5 + r, z: -6, vx: 0, vy: 0, vz: 0 }, 2.5);
  const pc = s.primoContatto, u = s.uscita;
  riga(1, 'Caduta verticale da 1,5 m', `arrivo ${f(pc && pc.vVert)} m/s, affonda ${f(s.hMax * 100, 1)} cm, ${u ? `esce a ${f(u.vVert)} m/s dopo ${f(u.contatto, 3)} s` : 'non riesce'}, evento ${s.eventi.map(e => e.tipo).join(',') || '–'}`,
    'arrivo 5,34 m/s, affonda 14 cm, esce a 1,4 m/s dopo 0,145 s (de Mestre 2004)', !!u && Math.abs(s.hMax - 0.14) < 0.03 && Math.abs(u.vVert - 1.4) < 0.3);
  disegni.push({ n: 1, nome: 'Caduta da 1,5 m', s, asse: 't' }); }
// 2. palla ferma che galleggia (de Mestre: 3,7 cm sott'acqua, cioè centro a a − 0,037 m)
{ const s = segui({ x: 0, y: QUOTA_GALLEGGIA, z: -6, vx: 0, vy: 0, vz: 0 }, 4);
  const imm = r - s.B.y, deriva = Math.hypot(s.B.x, s.B.z + 6);
  riga(2, 'Palla ferma che galleggia', `${f(imm * 100, 1)} cm sott'acqua dopo 4 s (raggio ${r} m), spostamento ${f(deriva * 100, 1)} cm`, '3,7 cm sott\'acqua con raggio 0,11 m (de Mestre 2004, verificato in vasca)', Math.abs(imm - 0.037) < 0.005);
  if (deriva > 0.01) errore('la palla ferma si sposta da sola'); disegni.push({ n: 2, nome: 'Galleggia', s, asse: 't' }); }
// 3. spinta orizzontale a 3 m/s in superficie
{ const s = segui({ x: 0, y: QUOTA_GALLEGGIA, z: -6, vx: 3, vy: 0, vz: 0 }, 5);
  const ys = s.storia.map(q => q[2]), salto = Math.max(...ys) - Math.min(...ys);
  riga(3, 'Spinta orizzontale a 3 m/s', `percorre ${f(s.B.x)} m in 5 s, finisce a ${f(Math.hypot(s.B.vx, s.B.vz), 3)} m/s, sale e scende di ${f(salto * 100, 1)} cm`, 'nessuna misura (da confrontare con video)', null);
  disegni.push({ n: 3, nome: 'Spinta a 3 m/s', s, asse: 'x' }); }
// 4. palombella: da 7 m dalla porta, a 1 m d'altezza, verso l'incrocio
{ const da = [5.5, 1.0, 0], a = [12.4, 0.8, 1.2], t = 1.2, L = velocitaDiLancio(...da, ...a, t, 34);
  const s = segui({ x: da[0], y: da[1], z: da[2], ...L }, t + 0.001, 600);
  let best = Infinity; for (const q of s.storia) if (Math.abs(q[0] - t) < 0.0017) best = Math.hypot(q[1] - a[0], q[2] - a[1], q[3] - a[2]);
  riga(4, 'Palombella', `arriva a ${f(best * 100, 1)} cm dal punto mirato (partenza ${f(Math.hypot(L.vx, L.vy, L.vz))} m/s)`, 'entro 5 cm', best < 0.05);
  disegni.push({ n: 4, nome: 'Palombella', s, asse: 'x' }); }
// 5. tiro teso: la situazione della tesi Patumi (13,3 m/s in valore assoluto, da 1,2 m, 3,4° in su → 12,2 m/s dopo 5 m)
{ const v0 = 13.3, s = segui({ x: 0, y: 1.2, z: -6, vx: v0 * Math.cos(0.06), vy: v0 * Math.sin(0.06), vz: 0 }, 0.6, 600);
  const q = s.storia.find(p => p[1] >= 5);
  riga(5, 'Tiro teso (situazione della tesi)', `dopo 5 m va a ${f(q[4])} m/s`, '12,2 ± 0,25 m/s (tesi Patumi)', Math.abs(q[4] - 12.2) < 0.25);
  disegni.push({ n: 5, nome: 'Tiro teso', s, asse: 'x' }); }
// 6. schizzo radente: 18 m/s a 10°
const impatto = (v, gradi, w = 0) => { const a = gradi * Math.PI / 180, vx = v * Math.cos(a), vy = -v * Math.sin(a), y0 = r + 0.25;
  return { x: 0, y: y0, z: -6, vx, vy, vz: 0, wx: 0, wy: 0, wz: -w }; };
{ const s = segui(impatto(18, 10), 1.5);
  const pc = s.primoContatto, u = s.uscita;
  riga(6, 'Schizzo radente (18 m/s, 10°)', `${s.eventi.map(e => e.tipo).join(', ') || 'nessun evento'}; ${u ? `esce a ${f(u.vOrizz)} avanti e ${f(u.vVert)} su (tiene il ${f(u.vOrizz / pc.vOrizz * 100, 0)}% della velocità orizzontale)` : 'non esce'}`,
    'esce verso l\'alto tenendo il 50–80% della velocità orizzontale (da confermare con video)', !!u && u.vOrizz / pc.vOrizz > 0.5 && u.vOrizz / pc.vOrizz < 0.8);
  disegni.push({ n: 6, nome: 'Schizzo 10°', s, asse: 'x' }); }
// 7. angolo alto: il caso misurato da de Mestre (10,7 avanti, 6,2 giù = 30°) e 50°
{ const s = segui({ x: 0, y: r + 0.1, z: -6, vx: 10.7, vy: -6.2, vz: 0 }, 1.5), u = s.uscita;
  const s50 = segui(impatto(12, 50), 2);
  riga(7, 'Schizzo ad angolo alto (30° e 50°)', `30°: ${s.eventi.map(e => e.tipo).join(',')}, ${u ? `esce a ${f(u.vOrizz)} avanti e ${f(u.vVert)} su` : 'non esce'}; 50°: ${s50.eventi.map(e => e.tipo).join(',')}, ${s50.uscita ? 'esce' : 'resta in acqua'}, affonda ${f(s50.hMax * 100, 1)} cm`,
    '30°: esce a 6,6 ± 1 avanti e 1,8 ± 0,7 su (misura di de Mestre 2004)', !!u && Math.abs(u.vOrizz - 6.6) < 1 && Math.abs(u.vVert - 1.8) < 0.7);
  disegni.push({ n: 7, nome: 'Impatto a 30°', s, asse: 'x' }); }
// 8. impatto con rotazione: in avanti, nessuna, all'indietro (30 rad/s), stesso impatto a 12°, 16 m/s
{ const esiti = [['in avanti', 30], ['nessuna', 0], ["all'indietro", -30]].map(([n, w]) => { const s = segui(impatto(16, 12, w), 1.2); return [n, s.uscita ? s.uscita.vOrizz : null]; });
  const ordine = esiti[0][1] != null && esiti[2][1] != null && esiti[0][1] > esiti[1][1] && esiti[1][1] > esiti[2][1];
  riga(8, 'Impatto con rotazione', esiti.map(([n, v]) => `${n}: esce a ${f(v)} m/s`).join('; '), 'velocità di uscita in calo da «in avanti» a «all\'indietro» (comportamento atteso, senza misure)', ordine); }
// 9. palo e traversa: energia dopo l'urto e nessun attraversamento a 30 m/s
{ const PZ = 1.5 + 0.04, colpo = (z, y, v = 30) => segui({ x: 9, y, z, vx: v, vy: 0, vz: 0 }, 0.35, 60);
  const s = colpo(PZ, 0.45, 20); const prima = 0.5 * 0.43 * 400; let dopo = null;
  for (let i = 1; i < s.storia.length; i++) if (s.storia[i][1] < s.storia[i - 1][1]) { dopo = 0.5 * 0.43 * s.storia[i][4] ** 2; break; }
  let passate = 0; let seme = 7; const caso = () => (seme = (seme * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 1000; i++) { const palo = i % 2 === 0, dz = (caso() - 0.5) * 0.07;
    const q = palo ? colpo(PZ + dz, 0.4, 30) : colpo(dz * 10, 0.94 + dz, 30); if (!q) continue;
    const fine = q.B; if (fine.x > 12.5 + 0.08 && (palo ? Math.abs(fine.z - PZ) < 0.06 : Math.abs(fine.y - 0.94) < 0.06) && q.urti.length === 0) passate++; }
  if (passate) errore(`${passate} tiri su 1000 hanno attraversato palo o traversa`);
  riga(9, 'Palo e traversa', `energia dopo l'urto ${dopo ? f(dopo / prima * 100, 0) + '%' : '–'} di quella prima (rimbalzo combinato ${((0.6 + 0.62) / 2).toFixed(2)} → atteso ${f(((0.6 + 0.62) / 2) ** 2 * 100, 0)}%); attraversamenti a 30 m/s: ${passate} su 1000`,
    'energia = rimbalzo² ± 5%; nessun attraversamento', passate === 0 && dopo != null && Math.abs(dopo / prima - ((0.6 + 0.62) / 2) ** 2) < 0.05);
  disegni.push({ n: 9, nome: 'Palo a 20 m/s', s, asse: 'x' }); }
// 10. palla tutta sott'acqua che risale
{ const s = segui({ x: 0, y: -0.3, z: -6, vx: 0, vy: 0, vz: 0 }, 5);
  // «ferma» si giudica dalla posizione (entro 2 mm da quella finale): a riposo la velocità segnata dal gioco non va a zero
  const ys = s.storia.map(q => q[2]), su = Math.max(...ys); let ferma = null;
  for (const q of s.storia) { if (Math.abs(q[2] - s.B.y) < 0.002) { if (ferma == null) ferma = q[0]; } else ferma = null; }
  const vFantasma = Math.abs(s.B.vy);
  if (vFantasma > 0.01) console.log(`    nota: a palla ferma la velocità verticale segnata resta ${f(vFantasma, 3)} m/s (gravità e galleggiamento si alternano a ogni passo)`);
  riga(10, 'Palla sott\'acqua che risale', `sale fino a ${f(su, 3)} m (centro), ${su - r > 0 ? `salta ${f((su - r) * 100, 1)} cm fuori` : 'non esce dall\'acqua'}, ferma dopo ${f(ferma, 2)} s a ${f(s.B.y, 3)} m`, 'torna in superficie, salta fuori al massimo di qualche centimetro, si ferma al galleggiamento', ferma != null && su - r < 0.05);
  disegni.push({ n: 10, nome: 'Risale da −0,3 m', s, asse: 't' }); }

// 11. energia persa e angolo d'impatto (Lyu, Yun e Wei 2021: l'energia persa cresce con l'angolo; sfera d'acciaio, solo la forma)
{ const angoli = [5, 10, 20, 30, 45], perse = angoli.map(g => { const s = segui(impatto(14, g), 1.2), pc = s.primoContatto, u = s.uscita;
    if (!pc || !u) return null; const prima = pc.vOrizz ** 2 + pc.vVert ** 2, dopo = u.vOrizz ** 2 + u.vVert ** 2; return 1 - dopo / prima; });
  const cresce = perse.every((x, i) => x != null && (i === 0 || x >= perse[i - 1]));
  riga(11, "Energia persa e angolo (14 m/s)", angoli.map((g, i) => `${g}°: ${perse[i] == null ? 'non esce' : f(perse[i] * 100, 0) + '%'}`).join(', '),
    "l'energia persa cresce con l'angolo (Lyu 2021, forma; θc = 18°/√SG)", cresce); }

// ---------- controlli generali ----------
// stesso passo ripetuto due volte = stessi numeri; scarto tra 30, 60 e 120 passi al secondo
{ const a = segui(impatto(18, 10), 1.5), b = segui(impatto(18, 10), 1.5);
  if (JSON.stringify(a.storia) !== JSON.stringify(b.storia)) errore('due giri uguali danno risultati diversi');
  const fine = fps => { const s = segui({ x: 0, y: 1.5 + r, z: -6, vx: 4, vy: 0, vz: 0 }, 3, fps); return s.B; };
  const b30 = fine(30), b60 = fine(60), b120 = fine(120);
  const scarto = Math.max(Math.abs(b30.x - b120.x), Math.abs(b60.x - b120.x)) / Math.abs(b120.x);
  console.log(`\nControlli: due giri uguali → stessi numeri. Caduta con spinta, distanza dopo 3 s: ${f(b30.x)} / ${f(b60.x)} / ${f(b120.x)} m a 30 / 60 / 120 passi al secondo (scarto ${f(scarto * 100, 1)}%; obiettivo del nuovo modello: sotto il 2%)`);
  righe.push({ n: 'passo', nome: 'Dipendenza dal passo di calcolo', misura: `${f(scarto * 100, 1)}%`, riferimento: 'sotto il 2%', vicino: scarto < 0.02 }); }

// ---------- disegno delle traiettorie (SVG, di lato) ----------
{ const W = 300, H = 170, col = 3, righeN = Math.ceil(disegni.length / col), parti = [];
  disegni.forEach((d, i) => { const ox = (i % col) * (W + 20) + 10, oy = Math.floor(i / col) * (H + 34) + 24, pts = d.s.storia;
    const X = d.asse === 't' ? pts.map(p => p[0]) : pts.map(p => p[1]), Y = pts.map(p => p[2]);
    const x0 = Math.min(...X), x1 = Math.max(...X) || 1, y0 = Math.min(-0.3, ...Y), y1 = Math.max(0.3, ...Y);
    const sx = x => ox + (x - x0) / ((x1 - x0) || 1) * W, sy = y => oy + H - (y - y0) / (y1 - y0) * H;
    parti.push(`<text x="${ox}" y="${oy - 6}" font-size="12" fill="#10202f">${d.n}. ${d.nome} (${d.asse === 't' ? 'tempo' : 'distanza'} → , altezza ↑)</text>`,
      `<rect x="${ox}" y="${sy(0)}" width="${W}" height="${oy + H - sy(0)}" fill="#cfe6f7"/>`, `<line x1="${ox}" x2="${ox + W}" y1="${sy(0)}" y2="${sy(0)}" stroke="#0b6fb8"/>`,
      `<rect x="${ox}" y="${oy}" width="${W}" height="${H}" fill="none" stroke="#9ab"/>`,
      `<polyline fill="none" stroke="#c0392b" stroke-width="1.5" points="${pts.filter((_, k) => k % 2 === 0).map((p, k) => `${sx(X[k * 2]).toFixed(1)},${sy(Y[k * 2]).toFixed(1)}`).join(' ')}"/>`); });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${col * (W + 20)}" height="${righeN * (H + 34) + 20}" font-family="sans-serif"><rect width="100%" height="100%" fill="#fff"/>${parti.join('')}</svg>`;
  const out = path.join(ROOT, 'tests/screenshot/fisica-acqua.svg'); fs.writeFileSync(out, svg); console.log(`Traiettorie: ${path.relative(ROOT, out)}`); }
const json = arg('json', ''); if (json) fs.writeFileSync(json, JSON.stringify(righe, null, 1));
const lontani = righe.filter(x => x.vicino === false).length;
console.log(`\nRiferimenti: ${righe.filter(x => x.vicino).length} vicini, ${lontani} lontani, ${righe.filter(x => x.vicino == null).length} senza riferimento.`);
if (!ok) { console.log('Ci sono comportamenti impossibili.'); process.exit(1); }
console.log('Nessun comportamento impossibile.');
