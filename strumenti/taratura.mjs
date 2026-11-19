// GIOCO CONTRO REALTÀ (v0.62): gioca le partite del bilancio (tests/bilancio.mjs: computer contro computer, tempi da 8 minuti, caso
// bloccato) e mette ogni numero accanto al riferimento delle partite vere (REALE in src/taratura.js), con lo stato (basso, a posto,
// alto) e i numeri del bilanciamento da guardare per quella voce, con i valori di oggi.
// Uso: npm run taratura                               8 partite ITA–HUN
//      npm run taratura -- --partite=4 --squadre=ESP,CRO --dist=cartella --porta=4190 --paralleli=2
//      npm run taratura -- --salva=prima.json         salva il riassunto delle partite per un confronto successivo
//      npm run taratura -- --confronta=prima.json     aggiunge la colonna «prima» (riassunto salvato con --salva)
//      npm run taratura -- --da=riassunto.json        non gioca: legge un riassunto salvato (anche `npm run bilancio -- --salva=`)
//      --dettagli                                      stampa anche tutta la tabella del bilancio
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as T from '../src/taratura.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => process.argv.find(x => x.startsWith('--' + k + '='))?.slice(k.length + 3);
const dettagli = process.argv.includes('--dettagli');

let sintesi, uscita = 0;
if (arg('da')) sintesi = JSON.parse(fs.readFileSync(arg('da'), 'utf8'));
else {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'taratura-')), file = path.join(tmp, 'riassunto.json');
  // più partite insieme (una pagina ciascuna): stessi risultati, meno attesa
  const paralleli = arg('paralleli') || Math.max(1, Math.min(3, os.cpus().length - 1));
  const opz = [`--partite=${arg('partite') || 8}`, `--squadre=${arg('squadre') || 'ITA,HUN'}`, `--salva=${file}`, `--paralleli=${paralleli}`];
  for (const k of ['dist', 'porta', 'tempo', 'arbitro']) if (arg(k)) opz.push(`--${k}=${arg(k)}`);
  console.log(`gioco ${arg('partite') || 8} partite (${(arg('squadre') || 'ITA,HUN').replace(',', '–')}), ${paralleli} alla volta...`);
  uscita = await new Promise(fatto => {
    const figlio = spawn(process.execPath, [path.join(ROOT, 'tests/bilancio.mjs'), ...opz], { cwd: ROOT });
    let resto = '';
    const riga = r => { if (dettagli || /^ {2}partita \d|errore|ERRORI|NON finita/.test(r)) console.log(r); };
    figlio.stdout.on('data', d => { const righe = (resto + d).split('\n'); resto = righe.pop(); righe.forEach(riga); });
    figlio.stderr.on('data', d => process.stderr.write(d));
    figlio.on('close', codice => { if (resto) riga(resto); fatto(codice); });
  });
  if (!fs.existsSync(file)) { console.log('il bilancio non ha salvato il riassunto: niente confronto'); process.exit(1); }
  sintesi = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.rmSync(tmp, { recursive: true, force: true });
}
if (arg('salva')) fs.writeFileSync(arg('salva'), JSON.stringify(sintesi, null, 1));
const prima = arg('confronta') ? JSON.parse(fs.readFileSync(arg('confronta'), 'utf8')) : null;

const leggi = (s, dato) => dato.split('.').reduce((o, k) => (o == null ? undefined : o[k]), s);
const num = (x, dec) => (x == null || !Number.isFinite(x) ? '—' : x.toFixed(dec).replace('.', ','));
const conUnita = (testo, u) => (testo === '—' || !u ? testo : u === '%' ? testo + '%' : `${testo} ${u}`);
const decimali = v => (v.unita === 's' && v.reale && (Array.isArray(v.reale) ? v.reale[1] : v.reale) < 3 ? 2 : 1);
const reale = v => conUnita(Array.isArray(v.reale) ? v.reale.map(x => num(x, decimali(v) === 2 ? 1 : 0).replace(/,0$/, '')).join('-') : num(v.reale, 1).replace(/,0$/, ''), v.unita);
const stato = (x, [lo, hi]) => (x == null || !Number.isFinite(x) ? '—' : x < lo ? 'BASSO' : x > hi ? 'ALTO' : 'ok');

const minuti = sintesi.tempo ? `, tempi da ${num(sintesi.tempo / 60, 0)} minuti` : '';
console.log(`\nGIOCO CONTRO REALTÀ · ${sintesi.partite} partite ${(sintesi.nomi || []).join('–')}${minuti} · per squadra a partita`);
const col = [36, 10, ...(prima ? [10] : []), 12, 7];
const testa = ['voce', 'gioco', ...(prima ? ['prima'] : []), 'reale', 'stato', 'numeri da guardare (src/taratura.js)'];
console.log(testa.map((t, i) => (i < col.length ? t.padEnd(col[i]) : t)).join(''));
const daGuardare = [], usati = new Set();
for (const v of T.REALE) {
  const g = leggi(sintesi, v.dato), d = decimali(v), st = stato(g, v.banda);
  const celle = [v.voce, conUnita(num(g, d), v.unita), ...(prima ? [conUnita(num(leggi(prima, v.dato), d), v.unita)] : []), reale(v), st];
  console.log(celle.map((c, i) => c.padEnd(col[i])).join('') + v.numeri.join(', '));
  if (st === 'ALTO' || st === 'BASSO') { daGuardare.push(`${v.voce} (${st.toLowerCase()})`); v.numeri.forEach(n => usati.add(n)); }
}
const aPosto = T.REALE.length - daGuardare.length;
console.log(`\na posto ${aPosto} voci su ${T.REALE.length}${daGuardare.length ? '; da guardare: ' + daGuardare.join(', ') : ''}`);
console.log('fonti: ' + [...new Set(T.REALE.map(v => v.fonte))].join(' · '));
if (usati.size) {
  console.log('\nvalori di oggi dei numeri da guardare:');
  const mostra = x => JSON.stringify(x).replace(/"(\w+)":/g, '$1:').replace(/,/g, ', ');
  for (const n of [...usati].sort()) console.log(`  ${n} = ${mostra(T[n])}`);
}
process.exit(uscita || 0);
