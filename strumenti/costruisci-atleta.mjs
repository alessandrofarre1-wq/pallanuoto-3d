// Costruisce gli atleti del gioco a partire dai dati liberi (CC0) di MakeHuman: forma del corpo, muscolatura,
// ossatura con i pesi, pelli con il volto, occhi e sopracciglia. Non usa né MakeHuman né Blender: legge i file e li assembla.
//
//   node strumenti/costruisci-atleta.mjs <dati> <risorse>
//     <dati>    = cartella "data" di MPFB (github.com/makehumancommunity/mpfb2, src/mpfb/data): 3dobjs, targets, rigs
//     <risorse> = pacchetto "makehuman_system_assets_cc0.zip" scompattato (files.makehumancommunity.org/asset_packs/...): skins, eyes, eyebrows
// Produce in src/grafica/modelli/: per ogni corporatura due file .glb (dettagliato e leggero), le pelli .jpg e misure.json.
// I dati originali NON vanno nel repository (sono grandi): si tengono solo i file prodotti.
import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { MeshoptSimplifier } from 'meshoptimizer';

const QUI = path.dirname(fileURLToPath(import.meta.url));
const [DATI, RISORSE] = process.argv.slice(2);
if (!DATI || !RISORSE) { console.error('Uso: node strumenti/costruisci-atleta.mjs <dati MPFB> <risorse MakeHuman>'); process.exit(1); }
const USCITA = path.join(QUI, '../src/grafica/modelli');
// triangoli [testa, resto del corpo]: versione per la scena e versione per la vista sott'acqua.
// La testa ha un suo conto a parte, altrimenti la riduzione le toglie quasi tutto e il viso diventa spigoloso.
const TRI = [[2400, 3000], [450, 1250]];

// corporature (una per gruppo di pelli) e pelli: [cartella della pelle, colore degli occhi, barba corta?]
const CORPORATURE = [
  { nome: 'a', etnia: 'caucasian', pelli: [['young_caucasian_male', 'brown', false], ['young_caucasian_male2', 'blue', true], ['middleage_caucasian_male', 'green', true]] },
  { nome: 'b', etnia: 'african', pelli: [['young_african_male', 'brown', false]] },
  { nome: 'c', etnia: 'asian', pelli: [['young_asian_male', 'brown', false]] },
];
const forma = etnia => [
  ['macrodetails/universal-male-young-averagemuscle-averageweight', 0.3], ['macrodetails/universal-male-young-maxmuscle-averageweight', 0.7],
  [`macrodetails/${etnia}-male-young`, 1],
  ['macrodetails/proportions/male-young-maxmuscle-averageweight-idealproportions', 0.6],
  ['macrodetails/height/male-young-maxmuscle-averageweight-maxheight', 0.3],
];

// ---------- lettura dei file ----------
function leggiObj(file) {
  const v = [], vt = [], facce = []; let g = '';
  for (const l of fs.readFileSync(file, 'utf8').split('\n')) {
    if (l.startsWith('v ')) { const p = l.split(/\s+/); v.push([+p[1], +p[2], +p[3]]); }
    else if (l.startsWith('vt ')) { const p = l.split(/\s+/); vt.push([+p[1], +p[2]]); }
    else if (l.startsWith('g ')) g = l.split(/\s+/)[1];
    else if (l.startsWith('f ')) { const p = l.trim().split(/\s+/).slice(1).map(x => x.split('/')); facce.push({ g, vi: p.map(x => +x[0] - 1), ti: p.map(x => x[1] ? +x[1] - 1 : -1) }); }
  }
  return { v, vt, facce };
}
function leggiTarget(nome) {
  const f = path.join(DATI, 'targets', nome + '.target.gz');
  if (!fs.existsSync(f)) { console.log('  (forma non trovata, saltata: ' + nome + ')'); return []; }
  return zlib.gunzipSync(fs.readFileSync(f)).toString().split('\n').filter(l => l && !l.startsWith('#')).map(l => l.trim().split(/\s+/).map(Number));
}
function leggiMhclo(file) {   // ogni punto dell'accessorio è definito rispetto a punti del corpo
  const righe = fs.readFileSync(file, 'utf8').split('\n'); const scale = {}, punti = []; let inVerts = false, obj = null;
  for (const l of righe) {
    const p = l.trim().split(/\s+/);
    if (p[0] === 'obj_file') obj = p[1];
    else if (/^[xyz]_scale$/.test(p[0])) scale[p[0][0]] = [+p[1], +p[2], +p[3]];
    else if (p[0] === 'verts') inVerts = true;
    else if (inVerts && p[0] !== '' && /^[\d-]/.test(p[0])) { if (p.length === 1) punti.push([+p[0]]); else if (p.length >= 9) punti.push(p.slice(0, 9).map(Number)); else inVerts = false; }
    else if (inVerts && p[0] !== '') inVerts = false;
  }
  return { obj: path.join(path.dirname(file), obj), scale, punti };
}
const adatta = (m, V) => {      // posizioni dell'accessorio sul corpo già modellato
  const s = 'xyz'.split('').map((a, i) => m.scale[a] ? Math.abs(V[m.scale[a][0]][i] - V[m.scale[a][1]][i]) / m.scale[a][2] : 1);
  return m.punti.map(p => p.length === 1 ? V[p[0]].slice() : [0, 1, 2].map(i => V[p[0]][i] * p[3] + V[p[1]][i] * p[4] + V[p[2]][i] * p[5] + p[6 + i] * s[i]));
};

const base = leggiObj(path.join(DATI, '3dobjs/base.obj'));
const rig = JSON.parse(fs.readFileSync(path.join(DATI, 'rigs/standard/rig.game_engine.json'), 'utf8'));
const pesiRig = JSON.parse(fs.readFileSync(path.join(DATI, 'rigs/standard/weights.game_engine.json'), 'utf8')).weights;
const cubi = {}; for (const f of base.facce) if (f.g.startsWith('joint-')) (cubi[f.g] ||= new Set()).forEach || true, f.vi.forEach(i => (cubi[f.g] ||= new Set()).add(i));
const gruppo = nome => { const s = new Set(); for (const f of base.facce) if (f.g === nome) f.vi.forEach(i => s.add(i)); return [...s]; };
const media = (V, idx) => { const m = [0, 0, 0]; for (const i of idx) for (let k = 0; k < 3; k++) m[k] += V[i][k] / idx.length; return m; };

// ossa: le dita confluiscono nella mano (non si muovono e costano)
const DITA = /^(thumb|index|middle|ring|pinky)_/;
const ordine = []; { const fatti = new Set(); const metti = n => { if (fatti.has(n) || DITA.test(n)) return; const p = rig[n].parent; if (p) metti(p); fatti.add(n); ordine.push(n); }; Object.keys(rig).forEach(metti); }
const indiceOsso = Object.fromEntries(ordine.map((n, i) => [n, i]));
const ossoPer = n => DITA.test(n) ? 'hand_' + n.slice(-1) : n;
// pesi per punto del corpo: al massimo 4 ossa
const pesiPunto = base.v.map(() => new Map());
for (const [osso, lista] of Object.entries(pesiRig)) { const o = indiceOsso[ossoPer(osso)]; if (o === undefined) continue; for (const [vi, w] of lista) pesiPunto[vi].set(o, (pesiPunto[vi].get(o) || 0) + w); }
const quattro = m => { const a = [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4); const s = a.reduce((t, x) => t + x[1], 0) || 1; while (a.length < 4) a.push([0, 0]); return a.map(([o, w]) => [o, w / s]); };

// uv del corpo per ogni punto (il primo che compare) e mappa delle zone libere dell'immagine della pelle
const facceCorpo = base.facce.filter(f => f.g === 'body');
const uvPunto = new Map(); for (const f of facceCorpo) f.vi.forEach((vi, k) => { if (!uvPunto.has(vi)) uvPunto.set(vi, base.vt[f.ti[k]]); });
const G = 64, occ = new Uint8Array(G * G);
for (const f of facceCorpo) { let a = 1, b = 0, c = 1, d = 0; for (const t of f.ti) { const [u, v] = base.vt[t]; a = Math.min(a, u); b = Math.max(b, u); c = Math.min(c, v); d = Math.max(d, v); }
  for (let y = Math.max(0, Math.floor(c * G)); y <= Math.min(G - 1, Math.floor(d * G)); y++) for (let x = Math.max(0, Math.floor(a * G)); x <= Math.min(G - 1, Math.floor(b * G)); x++) occ[y * G + x] = 1; }
let libero = null;
cerca: for (let n = 8; n >= 3; n--) for (let y = 0; y + n <= G; y++) for (let x = 0; x + n <= G; x++) { let ok = true; for (let j = 0; j < n && ok; j++) for (let i = 0; i < n; i++) if (occ[(y + j) * G + x + i]) { ok = false; break; } if (ok) { libero = { u: x / G, v: y / G, lato: n / G }; break cerca; } }
if (!libero) throw new Error('nessuna zona libera nella pelle per gli occhi');

const occhi = leggiMhclo(path.join(RISORSE, 'eyes/low-poly/low-poly.mhclo')), occhiObj = leggiObj(occhi.obj);
const sopr = leggiMhclo(path.join(RISORSE, 'eyebrows/eyebrow001/eyebrow001.mhclo'));
// (solo i punti che cadono nella zona del viso dell'immagine della pelle)
const nelViso = ([u, v]) => u > 0.62 && v > 0.15 && v < 0.83;
const uvSopracciglia = sopr.punti.filter(p => p.length > 1).map(p => [0, 1].map(k => uvPunto.get(p[0])[k] * p[3] + uvPunto.get(p[1])[k] * p[4] + uvPunto.get(p[2])[k] * p[5])).filter(nelViso);

// ---------- costruzione di ogni corporatura ----------
const lavori = [], misure = {};
for (const C of CORPORATURE) {
  const V = base.v.map(p => p.slice());
  for (const [nome, peso] of forma(C.etnia)) for (const [i, dx, dy, dz] of leggiTarget(nome)) { V[i][0] += dx * peso; V[i][1] += dy * peso; V[i][2] += dz * peso; }
  const ossa = ordine.map(n => { const cubo = rig[n].head.cube_name; return { nome: n, genitore: rig[n].parent ? indiceOsso[rig[n].parent] : -1, pos: media(V, [...cubi[cubo]]) }; });
  // triangoli del corpo: un punto per ogni coppia posizione/uv, normali lisce calcolate sulla posizione
  const normali = V.map(() => [0, 0, 0]);
  for (const f of facceCorpo) for (let k = 1; k + 1 < f.vi.length; k++) { const [a, b, c] = [V[f.vi[0]], V[f.vi[k]], V[f.vi[k + 1]]];
    const n = [(b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])];
    for (const i of [f.vi[0], f.vi[k], f.vi[k + 1]]) for (let j = 0; j < 3; j++) normali[i][j] += n[j]; }
  const pos = [], nor = [], uv = [], si = [], sw = [], cost = [], ind = [], mappa = new Map();
  const bacino = indiceOsso.pelvis, cosce = [indiceOsso.thigh_l, indiceOsso.thigh_r];
  const yAnca = ossa[indiceOsso.thigh_l].pos[1], yGin = ossa[indiceOsso.calf_l].pos[1], yVita = ossa[indiceOsso.spine_01].pos[1];
  const y0 = yAnca - 0.30 * (yAnca - yGin), y1 = yAnca + 0.55 * (yVita - yAnca) + 0.45;      // fascia del costume
  const punto = (vi, ti) => { const k = vi + '/' + ti; let i = mappa.get(k); if (i !== undefined) return i; i = pos.length / 3; mappa.set(k, i);
    pos.push(...V[vi]); const n = normali[vi], l = Math.hypot(...n) || 1; nor.push(n[0] / l, n[1] / l, n[2] / l); uv.push(base.vt[ti][0], base.vt[ti][1]);
    const q = quattro(pesiPunto[vi]); si.push(...q.map(x => x[0])); sw.push(...q.map(x => x[1]));
    const wb = q.reduce((t, [o, w]) => t + (o === bacino || cosce.includes(o) || o === indiceOsso.spine_01 ? w : 0), 0);
    cost.push(wb > 0.3 ? 1 : 0); return i; };      // zona larga (bacino e cosce, non le mani): il bordo netto lo dà la quota in posa di riposo
  for (const f of facceCorpo) for (let k = 1; k + 1 < f.vi.length; k++) ind.push(punto(f.vi[0], f.ti[0]), punto(f.vi[k], f.ti[k]), punto(f.vi[k + 1], f.ti[k + 1]));
  // occhi: seguono la testa; la loro immagine sta in un riquadro libero della pelle
  const pOcchi = adatta(occhi, V), testa = indiceOsso.head, baseO = pos.length / 3, mo = new Map();
  const puntoO = (vi, ti) => { const k = vi + '/' + ti; let i = mo.get(k); if (i !== undefined) return i; i = pos.length / 3; mo.set(k, i);
    pos.push(...pOcchi[vi]); nor.push(0, 0, 1); const t = occhiObj.vt[ti]; uv.push(libero.u + t[0] * libero.lato, libero.v + t[1] * libero.lato);
    si.push(testa, 0, 0, 0); sw.push(1, 0, 0, 0); cost.push(0); return i; };
  for (const f of occhiObj.facce) for (let k = 1; k + 1 < f.vi.length; k++) ind.push(puntoO(f.vi[0], f.ti[0]), puntoO(f.vi[k], f.ti[k]), puntoO(f.vi[k + 1], f.ti[k + 1]));
  // misure della testa (per la calottina), rispetto all'osso della testa
  const T = ossa[testa].pos, capo = []; pesiPunto.forEach((m, vi) => { if ((m.get(testa) || 0) > 0.85 && uvPunto.has(vi)) capo.push(V[vi]); });
  const estr = (f) => [Math.min(...capo.map(f)), Math.max(...capo.map(f))];
  const [yMin, yMax] = estr(p => p[1]), h = yMax - yMin, cy = yMin + 0.6 * h;
  const sopra = capo.filter(p => p[1] > cy), zS = [Math.min(...sopra.map(p => p[2])), Math.max(...sopra.map(p => p[2]))];
  const alti = capo.filter(p => p[1] > cy + 0.25 * (yMax - cy)), rx = Math.max(...alti.map(p => Math.abs(p[0])));
  const fascia = capo.filter(p => p[1] > yMin + 0.38 * h && p[1] < yMin + 0.6 * h), orecchio = fascia.reduce((a, p) => p[0] > a[0] ? p : a, [-9, 0, 0]);
  const mento = capo.filter(p => p[2] > (zS[0] + zS[1]) / 2).reduce((a, p) => p[1] < a[1] ? p : a, [0, 9e9, 0]);
  const denti = media(V, gruppo('helper-upper-teeth'));
  const rel = p => p.map((x, i) => +(x - T[i]).toFixed(3));
  const tutto = [Math.min(...facceCorpo.flatMap(f => f.vi.map(i => V[i][1]))), Math.max(...facceCorpo.flatMap(f => f.vi.map(i => V[i][1])))];
  // profilo del cranio: per ogni direzione dal centro della testa, quanto sporge (la calottina lo segue da fuori)
  const NA = 16, NP = 8, FINO = 125 * Math.PI / 180, cz = (zS[0] + zS[1]) / 2, profilo = new Float32Array(NA * (NP + 1));
  for (const p of capo) { const d = [p[0], p[1] - cy, p[2] - cz], r = Math.hypot(...d), pol = Math.acos(d[1] / r); if (pol > FINO) continue;
    let az = Math.atan2(d[0], d[2]); if (az < 0) az += Math.PI * 2;
    const a = Math.round(az / (Math.PI * 2) * NA) % NA, k = Math.round(pol / FINO * NP); profilo[a * (NP + 1) + k] = Math.max(profilo[a * (NP + 1) + k], r); }
  for (let giro = 0; giro < 2; giro++) { const q = profilo.slice();      // si allarga un po': niente buchi né rientranze
    for (let a = 0; a < NA; a++) for (let k = 0; k <= NP; k++) for (const [da, dk] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k2 = k + dk; if (k2 < 0 || k2 > NP) continue; q[a * (NP + 1) + k] = Math.max(q[a * (NP + 1) + k], profilo[((a + da + NA) % NA) * (NP + 1) + k2]); }
    profilo.set(q); }
  misure[C.nome] = { profilo: { NA, NP, fino: 125, r: [...profilo].map(x => +x.toFixed(3)) }, costume: [+y0.toFixed(3), +y1.toFixed(3)], centro: rel([0, cy, (zS[0] + zS[1]) / 2]), raggi: [+rx.toFixed(3), +(yMax - cy).toFixed(3), +((zS[1] - zS[0]) / 2).toFixed(3)], orecchio: rel(orecchio), mento: rel(mento), altezza: +(tutto[1] - tutto[0]).toFixed(2) };
  // barba corta: punti della pelle attorno a bocca e mascella
  const uvBarba = []; pesiPunto.forEach((m, vi) => { const p = V[vi]; if ((m.get(testa) || 0) > 0.6 && uvPunto.has(vi) && p[1] < denti[1] + 0.12 && p[1] > mento[1] - 0.25 && p[2] > orecchio[2] + 0.15 && Math.hypot(p[0], (p[1] - denti[1]) * 2.2, p[2] - denti[2] - 0.2) > 0.42 && nelViso(uvPunto.get(vi))) uvBarba.push(uvPunto.get(vi)); });
  lavori.push({ nome: C.nome, pos, nor, uv, si, sw, cost, ind, ossa, testa, collo: indiceOsso.neck_01, pelli: C.pelli.map(([cartella, occhi, barba]) => {
    const mhmat = fs.readFileSync(path.join(RISORSE, 'skins', cartella, cartella + '.mhmat'), 'utf8'), file = /diffuseTexture\s+(\S+)/.exec(mhmat)[1];
    return { nome: cartella, pelle: fs.readFileSync(path.join(RISORSE, 'skins', cartella, file)).toString('base64'), occhi: fs.readFileSync(path.join(RISORSE, 'eyes/materials', occhi + '_eye.png')).toString('base64'), barba: barba ? uvBarba : [] }; }) });
  console.log(`corporatura ${C.nome} (${C.etnia}): ${pos.length / 3} punti, ${ind.length / 3} triangoli, ${ossa.length} ossa, testa`, JSON.stringify(misure[C.nome]));
}

// ---------- nel browser: file .glb e pelli .jpg ----------
const server = await createServer({ root: path.join(QUI, 'converti'), logLevel: 'warn', server: { port: 4191, host: '127.0.0.1' } });
await server.listen();
const browser = await chromium.launch();
const pg = await browser.newPage();
pg.on('pageerror', e => console.error('errore nella pagina:', e.message));
await pg.goto(server.resolvedUrls.local[0] + 'atleta.html');
await pg.waitForFunction('window.pronto');
await MeshoptSimplifier.ready;
fs.mkdirSync(USCITA, { recursive: true });
// riduzione dei triangoli: testa e corpo separatamente, tenendo fermo il bordo tra i due perché combacino
function riduci(L, [triTesta, triCorpo]) {
  const pos = new Float32Array(L.pos), diTesta = i => { let w = 0; for (let k = 0; k < 4; k++) if (L.si[i * 4 + k] === L.testa || L.si[i * 4 + k] === L.collo) w += L.sw[i * 4 + k]; return w > 0.5; };
  const gruppi = [[], []];
  for (let t = 0; t < L.ind.length; t += 3) { const tri = [L.ind[t], L.ind[t + 1], L.ind[t + 2]]; gruppi[tri.filter(diTesta).length >= 2 ? 0 : 1].push(...tri); }
  const fuori = [];
  gruppi.forEach((g, k) => { const voluti = [triTesta, triCorpo][k] * 3; const [r] = MeshoptSimplifier.simplify(new Uint32Array(g), pos, 3, Math.min(g.length, voluti), 0.05, ['LockBorder']); fuori.push(...r); });
  // si tengono solo i punti rimasti
  const nuovo = new Map(), tieni = []; const ind = fuori.map(i => { let j = nuovo.get(i); if (j === undefined) { j = tieni.length; nuovo.set(i, j); tieni.push(i); } return j; });
  const prendi = (a, n) => tieni.flatMap(i => a.slice(i * n, i * n + n));
  return { ...L, pos: prendi(L.pos, 3), nor: prendi(L.nor, 3), uv: prendi(L.uv, 2), si: prendi(L.si, 4), sw: prendi(L.sw, 4), cost: prendi(L.cost, 1), ind, pelli: [] };
}
const elenco = [];
for (const L of lavori) {
  for (const [k, tri] of TRI.entries()) {
    const R = riduci(L, tri);
    const { glb } = await pg.evaluate(a => window.costruisci(a), { ...R, libero, uvSopracciglia, lato: 1024 });
    const f = path.join(USCITA, `atleta-${L.nome}${k ? '-lontano' : ''}.glb`); fs.writeFileSync(f, Buffer.from(glb, 'base64'));
    console.log(`  ${path.basename(f)}: ${L.ind.length / 3} → ${R.ind.length / 3} triangoli, ${(fs.statSync(f).size / 1024).toFixed(0)} kB`);
  }
  const { pelli } = await pg.evaluate(a => window.costruisci(a), { ...L, pos: [], nor: [], uv: [], si: [], sw: [], cost: [], ind: [], soloPelli: true, libero, uvSopracciglia, lato: 1024 });
  for (const p of pelli) { const f = path.join(USCITA, `pelle-${p.nome}.jpg`); fs.writeFileSync(f, Buffer.from(p.jpg, 'base64')); console.log(`  ${path.basename(f)}: ${(fs.statSync(f).size / 1024).toFixed(0)} kB`); elenco.push({ corporatura: L.nome, pelle: p.nome }); }
}
fs.writeFileSync(path.join(USCITA, 'misure.json'), JSON.stringify({ corporature: misure, pelli: elenco, ossa: ordine }, null, 1));
await browser.close(); await server.close();
