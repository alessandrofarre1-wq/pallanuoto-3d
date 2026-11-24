// Rose v0.86 (Ale: «mettimi tutti e poi scelgo io all'inizio della competizione chi convocare; non farlo solo per l'Italia ma per tutte
// le nazionali; in partita singola lasciami tutti i giocatori»; «per le rose su partita singola mettimi tutti i giocatori disponibili
// nella sezione in cui scelgo la squadra. Ma per la partita scegli i più forti nel ruolo. Se ci sono doppi ruoli scegli i secondi più
// forti dando variabilità ai cambi per coprire il più possibile più ruoli»).
// 1. Per ogni nazionale tutti i disponibili (chi è stato convocato in almeno un torneo del database), senza doppioni.
// 2. La lista della partita: 14 (12 di movimento e 2 portieri), titolari i più forti nel ruolo, in panchina una riserva per ogni posto
//    quando c'è qualcuno che sa farlo; numeri di calottina unici.
// 3. Schermata Squadre: in acqua, panchina e gli altri disponibili; panchina ↔ altri si scambiano; «Scelta automatica» torna indietro.
// 4. Tornei: 15 convocati proposti (2-3 portieri), si cambiano prima della prima partita; in partita la lista viene dai convocati; poi
//    in partita veloce di nuovo tutti i disponibili.
// Uso: node tests/rose-v086.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4345, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 47; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  try { localStorage.clear(); } catch (e) { /* niente memoria */ }
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };

// 1-2. disponibili e lista automatica, per tutte le nazionali
const tutte = await pg.evaluate(() => {
  const H = window.__pallanuoto, R = H.rose, out = [];
  for (const q of [...document.querySelectorAll('#elencoSq [data-sq]')].map(b => b.dataset.sq)) {
    const P = R.tutti(q), L = R.listaPartita(P), ids = new Set(P.map(g => g.id));
    const nascite = new Map(); let doppi = 0;
    for (const g of P) { if (!g.nascita) continue; const k = g.nascita + '|' + (g.nomeIntero || '').split(' ')[0]; if (nascite.has(k)) doppi++; nascite.set(k, g); }
    const gk = L.filter(g => g.ruolo === 0).length, sa = (g, r) => (g.ruoli || [g.ruolo]).includes(r);
    // per ogni posto di movimento: c'è una riserva in panchina che sa farlo, se tra chi non è in acqua c'è qualcuno che lo sa fare (in
    // Croazia, quasi tutti destri, l'ala destra la fa un'ala sinistra: l'unico mancino dell'ala è già titolare)
    const scoperti = [1, 2, 3, 4, 5, 6].filter(r => !L.slice(7).some(g => sa(g, r)) && P.some(g => sa(g, r) && !L.slice(0, 7).includes(g)));
    out.push({ q, disponibili: P.length, idsUnici: ids.size === P.length, doppi, lista: L.length, gk, scoperti });
  }
  return out;
});
prova(tutte.length === 24 && tutte.every(t => t.idsUnici && t.disponibili >= 14), `24 nazionali con tutti i disponibili (${tutte.map(t => t.q + ' ' + t.disponibili).join(', ')})`);
prova(tutte.every(t => t.doppi <= 1), `nessun giocatore due volte (stessa data di nascita e stesso nome: ${tutte.filter(t => t.doppi).map(t => t.q + ' ' + t.doppi).join(', ') || 'nessuno'}; i gemelli Hessels restano due)`);
prova(tutte.every(t => t.lista === 14 && t.gk === 2), `in partita 14 per squadra, 12 di movimento e 2 portieri (${[...new Set(tutte.map(t => t.lista + '/' + t.gk))].join(', ')})`);
prova(tutte.every(t => t.scoperti.length === 0), `la panchina copre i ruoli: posti senza riserva ${tutte.filter(t => t.scoperti.length).map(t => t.q + ' ' + t.scoperti.join('+')).join(', ') || 'nessuno'}`);

const italia = await pg.evaluate(() => {
  const H = window.__pallanuoto, R = H.rose; H.scegliSquadre('ITA', 'HUN');
  const P = R.tutti('ITA'), t = H.teams[0], L = t.rosa;
  const titolari = t.players.map(p => p.scheda), sa = (g, r) => (g.ruoli || [g.ruolo]).includes(r);
  // il titolare di ogni posto è il più forte del ruolo tra chi lo sa fare (stesso confronto della scelta: valutazione nel ruolo)
  const piuForte = [1, 2, 3, 4, 5, 6].map(r => { const s = titolari[r]; const altri = P.filter(g => g !== s && g.ruolo !== 0 && sa(g, r) && !titolari.includes(g)); return { posto: r, titolare: s.nome, ok: altri.every(g => g.ovr <= s.ovr + 3) }; });
  return { n: L.length, numeri: new Set(L.map(g => g.num)).size, disponibili: P.length, piuForte, nomi: L.map(g => `#${g.num} ${g.nome}`), diFulvio: P.some(g => g.nome === 'Di Fulvio'), diSomma: P.some(g => g.nome === 'Di Somma') };
});
prova(italia.n === 14 && italia.numeri === 14, `Italia: 14 in lista con numeri diversi (${italia.nomi.join(', ')})`);
prova(italia.diFulvio && italia.diSomma, `Italia: tra i ${italia.disponibili} disponibili ci sono Di Fulvio e Di Somma`);
prova(italia.piuForte.every(x => x.ok), `Italia: i titolari sono i più forti nel ruolo (${italia.piuForte.map(x => x.titolare).join(', ')})`);

// 3. schermata Squadre: in acqua, panchina e altri disponibili; scambio e scelta automatica
await pg.evaluate(() => { document.querySelector('[data-va="squadre"]')?.click(); document.getElementById('rosaBox').open = true; });
const schermata = await pg.evaluate(() => ({ acqua: document.querySelectorAll('#rosa [data-posto]').length, panchina: document.querySelectorAll('#rosa [data-riserva]').length, altri: document.querySelectorAll('#rosa [data-altro]').length }));
prova(schermata.acqua === 7 && schermata.panchina === 7 && schermata.altri === italia.disponibili - 14, `schermata Squadre: 7 in acqua, 7 in panchina, ${schermata.altri} altri disponibili`);
const scambio = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.teams[0];
  const riserva = [...document.querySelectorAll('#rosa [data-riserva]')].map(b => t.rosa.find(g => g.id === b.dataset.riserva)).find(g => g.ruolo !== 0);
  document.querySelector(`#rosa [data-riserva="${riserva.id}"]`).click();
  const altro = [...document.querySelectorAll('#rosa [data-altro]')].map(b => b.dataset.altro).find(id => H.rose.tutti('ITA').find(g => g.id === id).ruolo !== 0);
  document.querySelector(`#rosa [data-altro="${altro}"]`).click();
  const dentro = t.rosa.some(g => g.id === altro), fuori = !t.rosa.some(g => g.id === riserva.id);
  let salvata = null; try { salvata = localStorage.getItem('pallanuoto-lista-ITA'); } catch (e) { /* niente memoria */ }
  const n = t.rosa.length;
  document.getElementById('fmRipristina').click();
  const automatica = H.rose.listaPartita(H.rose.tutti('ITA')).map(g => g.id).join(',') === t.rosa.map(g => g.id).join(',');
  return { dentro, fuori, salvata: !!salvata && salvata.split(',').includes(altro), n, automatica };
});
prova(scambio.dentro && scambio.fuori && scambio.n === 14 && scambio.salvata, `panchina ↔ altri disponibili: lo scambio entra nella lista e viene ricordato`);
prova(scambio.automatica, `«Scelta automatica» torna ai più forti per ruolo`);

// 4. tornei: 15 convocati, si cambiano prima della prima partita, la lista viene dai convocati
const torneo = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.tornei.creaCampagna('mondiali', 'ITA', 12345);
  const P = H.rose.tutti('ITA'), C = P.filter(g => t.convocati.includes(g.id));
  return { n: C.length, gk: C.filter(g => g.ruolo === 0).length, vista: document.getElementById('menu').dataset.vista, riquadro: !!document.getElementById('torneoConvocatiApri') };
});
prova(torneo.n === 15 && torneo.gk >= 2 && torneo.gk <= 3 && torneo.riquadro, `torneo: 15 convocati proposti (${torneo.gk} portieri), riquadro per cambiarli`);
await pg.locator('#torneoConvocatiApri').click();
const conv = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.tornei.esportaSalvataggi().campagne.mondiali, P = H.rose.tutti('ITA');
  const fuori = P.find(g => g.ruolo !== 0 && !t.convocati.includes(g.id)), dentro = P.find(g => g.ruolo !== 0 && t.convocati.includes(g.id));
  document.querySelector(`[data-conv="${dentro.id}"]`).click();
  const primaDiConfermare = document.getElementById('convConferma').disabled;
  document.querySelector(`[data-conv="${fuori.id}"]`).click();
  document.getElementById('convConferma').click();
  const salvato = H.tornei.esportaSalvataggi().campagne.mondiali.convocati;
  return { primaDiConfermare, entra: salvato.includes(fuori.id), esce: !salvato.includes(dentro.id), n: salvato.length, vista: document.getElementById('menu').dataset.vista, fuori: fuori.id };
});
prova(conv.primaDiConfermare && conv.entra && conv.esce && conv.n === 15 && conv.vista === 'torneo', `convocazione: con 14 non si conferma; scambiato un giocatore e confermato, si torna al torneo`);
await pg.locator('#torneoGioca').click();
const garaTorneo = await pg.evaluate(fuori => {
  const H = window.__pallanuoto, t = H.tornei.esportaSalvataggi().campagne.mondiali, L = H.teams[0].rosa;
  return { n: L.length, daiConvocati: L.every(g => t.convocati.includes(g.id)), vista: document.getElementById('menu').dataset.vista, nuovoDisponibile: t.convocati.includes(fuori) };
}, conv.fuori);
prova(garaTorneo.n === 14 && garaTorneo.daiConvocati, `in partita di torneo i 14 vengono dai 15 convocati`);
const singola = await pg.evaluate(() => {
  document.querySelector('#vImpostazioni [data-indietro]')?.click();
  document.querySelector('[data-home]')?.click();
  document.querySelector('[data-va="squadre"]')?.click();
  const H = window.__pallanuoto; return { convocati: Object.keys(H.rose.convocati).length, altri: document.querySelectorAll('#rosa [data-altro]').length, n: H.teams[0].rosa.length };
});
prova(singola.convocati === 0 && singola.n === 14 && singola.altri === italia.disponibili - 14, `di nuovo in partita veloce: tutti i disponibili (${singola.altri} altri)`);

prova(!errori.length, 'nessun errore nella pagina' + (errori.length ? ': ' + errori.slice(0, 2).join(' | ') : ''));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nRose v0.86: tutte le prove superate' : '\nRose v0.86: prove NON superate');
process.exit(ok ? 0 : 1);
