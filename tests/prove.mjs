// PROVE IN LOCALE (v0.62): gli stessi passi della CI (.github/workflows/pages.yml), letti da lì, uno dopo l'altro, con il riepilogo
// PASS/FAIL e il tempo di ognuno. Il gioco si costruisce una volta all'inizio: i passi con --no-build usano quella build.
// `npm run verifica` (sei partite e cinque immagini) resta a parte come chiede la memoria; con --con-verifica si fa anche qui, con i
// confronti delle immagini bloccanti (in CI non lo sono perché i caratteri del server sono diversi).
// Uso: npm run prove [-- --con-verifica] [--solo=gameplay,replay] [--da=replay] [--elenco] [--tempo-max=1200]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => process.argv.find(x => x.startsWith('--' + k + '='))?.slice(k.length + 3);
const conVerifica = process.argv.includes('--con-verifica'), tempoMax = +(arg('tempo-max') || 1200);

// passi della CI: le righe «- run: npm run …» del file della CI, nell'ordine
const ci = fs.readFileSync(path.join(ROOT, '.github/workflows/pages.yml'), 'utf8');
let passi = [...ci.matchAll(/^\s*- run: (npm run .+?)\s*$/gm)].map(m => {
  const parti = m[1].split(/\s+/), nome = parti[2];
  // la verifica in locale si fa con le immagini bloccanti (i riferimenti sono stati fatti con questi caratteri)
  const args = nome === 'verifica' ? parti.slice(1, 3) : parti.slice(1);
  return { nome, comando: 'npm ' + args.join(' '), args };
});
if (!passi.length) { console.log('nessun passo «npm run» trovato in .github/workflows/pages.yml'); process.exit(1); }
if (!conVerifica) passi = passi.filter(p => p.nome !== 'verifica');
if (arg('solo')) { const s = arg('solo').split(','); passi = passi.filter(p => s.includes(p.nome)); }
if (arg('da')) { const i = passi.findIndex(p => p.nome === arg('da')); if (i < 0) { console.log('passo non trovato: ' + arg('da')); process.exit(1); } passi = passi.slice(i); }
if (process.argv.includes('--elenco')) { passi.forEach((p, i) => console.log(`${String(i + 1).padStart(2)}. ${p.comando}`)); process.exit(0); }

const cartellaLog = fs.mkdtempSync(path.join(os.tmpdir(), 'prove-'));
const esegui = (nome, comando, args) => new Promise(fatto => {
  const t0 = Date.now(), log = fs.createWriteStream(path.join(cartellaLog, nome + '.log'));
  const figlio = spawn(comando, args, { cwd: ROOT, env: { ...process.env, FORCE_COLOR: '0' } });
  let coda = '';
  const scrivi = d => { log.write(d); coda = (coda + d).slice(-4000); };
  figlio.stdout.on('data', scrivi); figlio.stderr.on('data', scrivi);
  const ferma = setTimeout(() => { scrivi(`\n[fermato dopo ${tempoMax} s]\n`); figlio.kill('SIGKILL'); }, tempoMax * 1000);
  figlio.on('close', codice => { clearTimeout(ferma); log.end(); fatto({ ok: codice === 0, secondi: (Date.now() - t0) / 1000, coda }); });
});

console.log(`costruisco il gioco, poi ${passi.length} passi della CI${conVerifica ? ' (con la verifica)' : ' (la verifica a parte: npm run verifica)'}`);
const build = await esegui('build', 'npx', ['vite', 'build']);
if (!build.ok) { console.log('FAIL build\n' + build.coda); process.exit(1); }
const esiti = [];
for (const [i, p] of passi.entries()) {
  process.stdout.write(`${String(i + 1).padStart(2)}/${passi.length} ${p.comando} ... `);
  const r = await esegui(p.nome, 'npm', p.args);
  esiti.push({ ...p, ...r });
  console.log(`${r.ok ? 'PASS' : 'FAIL'} (${Math.round(r.secondi)} s)`);
  if (!r.ok) console.log('   ultime righe:\n' + r.coda.trim().split('\n').slice(-15).map(x => '   | ' + x).join('\n'));
}
const falliti = esiti.filter(e => !e.ok), minuti = esiti.reduce((s, e) => s + e.secondi, build.secondi) / 60;
console.log(`\nRIEPILOGO: ${esiti.length - falliti.length} PASS, ${falliti.length} FAIL su ${esiti.length} passi in ${minuti.toFixed(1)} minuti`);
if (falliti.length) console.log('falliti: ' + falliti.map(e => e.nome).join(', '));
console.log('registri completi: ' + cartellaLog);
process.exit(falliti.length ? 1 : 0);
