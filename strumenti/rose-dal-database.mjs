// Rose e valutazioni dei giocatori dal database di Ale (waterpolo_database, 13 novembre 2026).
// Uso: node strumenti/rose-dal-database.mjs <waterpolo.json | dati-sorgente/database-giocatori.json> [--output-dir=/tmp/rose]
// Scrive:
//  - dati-sorgente/database-giocatori.json: l'estratto del database che serve (solo le 16 nazionali del gioco), così il calcolo
//    si può rifare senza il file completo;
//  - src/dati/rose-db.json: per ogni nazionale 13 giocatori veri (numero di calottina, nome, ruolo, mano, altezza, nascita)
//    con le statistiche di gioco 40-99 calcolate qui e il riassunto dei dati dei tornei.
//
// METODO (in parole semplici; dettagli in docs/riferimenti/valutazioni.md):
//  1. La forza della squadra resta quella del ranking (src/dati/squadre.json): le statistiche dei tornei NON la cambiano,
//     decidono chi è più forte DENTRO la squadra (ogni voce viene ricentrata sulla media della propria squadra).
//  2. Per ogni giocatore si sommano i tornei con la nazionale (Mondiali 2025, Europei 2026, Coppa del Mondo 2026).
//  3. Ogni dato diventa un «quanto sopra o sotto la media del suo ruolo», con prudenza: chi ha giocato poco viene tirato
//     verso la media (un 2 su 2 al tiro non fa di nessuno un fenomeno).
//  4. Precisione = percentuale al tiro; Potenza = gol e tiri a partita; Visione/Passaggio = assist (e palle perse);
//     Difesa = palle rubate e tiri murati; Disciplina = espulsioni e rigori causati; Velocità = gol in controfuga e sprint
//     vinti; Resistenza = minuti giocati a partita; Forza = gol dal centro e altezza (centroboa e difensori).
//     Portieri: Riflessi e Posizione = percentuale di parate; Rigori = parate sui rigori; Uscita = parate in controfuga.
//  5. Età come in docs/riferimenti/valutazioni.md.
// Il database stesso avverte: sono osservazioni, non misure ufficiali di bravura. Nel gioco sono stime, correggibili da Ale.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listaPartita } from '../src/dati/lista-partita.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2];
if (!src) { console.error('Uso: node strumenti/rose-dal-database.mjs <waterpolo.json> [--output-dir=/tmp/rose]'); process.exit(1); }
const outputArg = process.argv.find(x => x.startsWith('--output-dir='));
const OUTPUT = outputArg ? path.resolve(outputArg.slice('--output-dir='.length)) : ROOT;
const DB = JSON.parse(fs.readFileSync(src, 'utf8'));
const SUPPLEMENTO = JSON.parse(fs.readFileSync(path.join(ROOT, 'dati-sorgente/europei-2026-aggiunte.json'), 'utf8'));
// correzioni dei nomi indicate da Ale (nella fonte nome e cognome sono invertiti)
const NOMI_CORRETTI = { 'KARLO Babic': 'BABIC Karlo' };
for (const t of ['players', 'rosters', 'player_event_statistics']) for (const r of DB[t] || []) if (NOMI_CORRETTI[r.name]) r.name = NOMI_CORRETTI[r.name];
const SQ = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/dati/squadre.json'), 'utf8')).squadre;
// Le aggiunte senza osservazioni individuali non entrano nelle medie dei tornei: i 16 calcoli precedenti restano identici.
// Se in futuro il database comprende una di queste nazionali, si usano le sue osservazioni invece della stima supplementare.
const SQ_DATABASE = SQ.filter(s => DB.rosters.some(r => r.team_code === s.codice));
const CODICI = SQ_DATABASE.map(s => s.codice);
const OGGI = new Date('2026-11-13');

// ---------- estratto (solo le nazionali del gioco) ----------
const estratto = {
  fonte: 'waterpolo_database di Ale, 13 novembre 2026 (World Aquatics, Microplus, Omega). Solo le 16 nazionali del gioco.',
  players: DB.players.filter(p => CODICI.includes(p.national_team)),
  rosters: DB.rosters.filter(r => CODICI.includes(r.team_code)),
  player_event_statistics: DB.player_event_statistics.filter(r => CODICI.includes(r.team_code)),
};
// ---------- utilità ----------
const coppia = s => { const m = /^(\d+)\/(\d+)$/.exec(String(s || '')); return m ? [+m[1], +m[2]] : [0, 0]; };
const num = s => { const v = parseInt(s, 10); return Number.isFinite(v) ? v : 0; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lim = v => Math.max(40, Math.min(99, Math.round(v)));
const eta = d => d ? (OGGI - new Date(d)) / 3.15576e10 : null;
// «DEL LUNGO Marco» → «Del Lungo»; «di FULVIO Francesco» → «Di Fulvio»
function cognome(nome) {
  const t = nome.split(/\s+/), c = [];
  for (const w of t) { if (w === w.toUpperCase() && /[A-ZÀ-Ý]/.test(w)) c.push(w); else if (!c.length && /^[a-z]/.test(w)) c.push(w); else if (c.length) break; }
  return (c.length ? c : [t[0]]).map(w => w.toLowerCase().replace(/(^|[-' ])(\p{L})/gu, (m, a, b) => a + b.toUpperCase())).join(' ');
}
// «DEL LUNGO Marco» → «Marco Del Lungo» (nome e cognome, come lo vuole vedere Ale nei cambi)
function nomeIntero(nome) {
  const c = cognome(nome), propri = nome.split(/\s+/).filter(w => !(w === w.toUpperCase() && /[A-ZÀ-Ý]/.test(w)) && !/^[a-z]/.test(w));
  return (propri.length ? propri.join(' ') + ' ' : '') + c;
}
// ruoli del gioco: 0 portiere, 1 centroboa, 2 ala destra, 3 ala sinistra, 4 mezzo destro, 5 mezzo sinistro, 6 punto
function tipo(pos) {
  if (/Goalkeeper/i.test(pos)) return 'gk';
  if (/Centre Forward/i.test(pos)) return 'boa';
  if (/Centre Back|Defender/i.test(pos)) return 'dif';
  if (/Point/i.test(pos)) return 'punto';
  if (/Right Wing/i.test(pos)) return 'aladx';
  if (/Left Wing/i.test(pos)) return 'alasx';
  if (/Wing/i.test(pos)) return 'ala';
  return 'driver';
}

// ---------- statistiche sommate per giocatore (solo tornei con la nazionale) ----------
const somma = new Map();
for (const r of estratto.player_event_statistics) {
  const S = somma.get(r.player_id) || { eventi: [], kind: r.kind, sec: 0, partite: 0, G: 0, T: 0, C: 0, Ct: 0, X: 0, Xt: 0, CA: 0, PS: 0, PSt: 0, AS: 0, ST: 0, BL: 0, TO: 0, SPv: 0, SPt: 0, ESP: 0, RIG: 0, par: 0, tir: 0, parPS: 0, tirPS: 0, parCA: 0, tirCA: 0 };
  const x = r.raw || {};
  S.eventi.push(r.event_id); S.kind = r.kind;
  S.sec += r.seconds_played || 0; S.partite += r.matches_played || 0;
  if (r.kind === 'gk') {
    const [p, t] = coppia(x.Total); S.par += p; S.tir += t;
    const [a, b] = coppia(x.PS); S.parPS += a; S.tirPS += b; const [c, d] = coppia(x.CA); S.parCA += c; S.tirCA += d;
  } else {
    const [g, t] = coppia(x.Total); S.G += g; S.T += t;
    const [c, ct] = coppia(x.C); S.C += c; S.Ct += ct; const [xm, xt] = coppia(x.X); S.X += xm; S.Xt += xt;
    const [ca] = coppia(x.CA); S.CA += ca; const [ps, pst] = coppia(x.PS); S.PS += ps; S.PSt += pst;
    S.AS += num(x.AS); S.ST += num(x.ST); S.BL += num(x.BL); S.TO += num(x.TF) + num(x.TO);
    const [sv, st] = coppia(x.SP); S.SPv += sv; S.SPt += st;
    // espulsioni causate: 18" dal centro e in campo (Microplus), oppure le sigle del rapporto dei Mondiali 2025
    S.ESP += num(x['18C']) + num(x['18F']) + num(x['2EX']) + num(x.CP) + num(x.FP) + num(x.DS) + num(x.M6) + num(x.CS);
    S.RIG += num(x.P);
  }
  somma.set(r.player_id, S);
}
const anag = new Map(estratto.players.map(p => [p.player_id, p]));

// ---------- rosa del gioco: la convocazione più recente, 2 portieri + 11 di movimento più impiegati ----------
const DATE = { wch2025: '2025-07-26', euro2026: '2026-01-25', wc2026_div1: '2026-04-12', wc2026_div2: '2026-04-12', wc2026_finals: '2026-07-01' };
for (const r of estratto.player_event_statistics) if (r.event_end) DATE[r.event_id] = r.event_end;
const rose = {}, riassunto = [];
// medie per tipo di giocatore (su tutto il campione delle 16 nazionali), per il «sopra o sotto la media»
const per32 = (S, k) => S.sec > 0 ? S[k] / (S.sec / 60) * 32 : null;
function scegli(cod) {
  const conv = estratto.rosters.filter(r => r.team_code === cod);
  const eventi = [...new Set(conv.map(r => r.event_id))].sort((a, b) => (DATE[b] || '').localeCompare(DATE[a] || ''));
  const ev = eventi.find(e => conv.filter(r => r.event_id === e).length >= 13) || eventi[0];
  return { ev, lista: conv.filter(r => r.event_id === ev) };
}
// DATI FISICI E ASPETTO dal file di Ale (dati-sorgente/aspetto-giocatori.json, 239 giocatori con fonti): altezza, peso, mano,
// capelli e barba osservati da foto ufficiali. Collegati per nazionale + nome (normalizzato); i valori nulli restano sconosciuti.
const FIS = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'dati-sorgente/aspetto-giocatori.json'), 'utf8')).records; } catch { return []; } })();
const norm = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
const FISi = new Map(FIS.map(r => [r.nazionale + '|' + norm(r.nome), r]));
const collegati = { trovati: 0, mani: 0, disaccordi: [], altezze: 0, pesi: 0, aspetto: 0, mancanti: [], doppioni: [] };
function datiFisici(cod, nomeDb) {
  const intero = norm(nomeIntero(nomeDb)); let r = FISi.get(cod + '|' + intero);
  if (!r) {      // stesso cognome (unico nella nazionale) e stessa iniziale del nome
    const cog = norm(cognome(nomeDb)), np = intero.split(' ')[0] || '';
    const c = FIS.filter(x => x.nazionale === cod && norm(x.nome).includes(cog) && norm(x.nome)[0] === np[0]);
    if (c.length === 1) r = c[0];
  }
  return r || null;
}
// una riga per giocatore: statistiche sommate, anagrafica, mano (database o file di Ale), dati fisici
function riga(cod, ev, r, conta = true) {
  const S = somma.get(r.player_id) || null, A = anag.get(r.player_id) || {};
  const pos = (A.roles && A.roles[0]) || r.position || '';
  let mano = r.hand || A.dominant_hand || null, manoFonte = mano ? 'database' : null;
  const F = datiFisici(cod, r.name);
  if (F) {
    if (conta) collegati.trovati++;
    const mf = F.manoDominante === 'sinistra' ? 'L' : F.manoDominante === 'destra' ? 'R' : null;
    if (mf && !mano) { mano = mf; manoFonte = 'file di Ale'; if (conta) collegati.mani++; }
    else if (mf && mano && mf !== mano && conta) collegati.disaccordi.push(`${cod} ${r.name}: database ${mano}, file ${mf}`);
  } else if (conta) collegati.mancanti.push(cod + ' ' + r.name);
  const altezza = r.height_cm || (F && F.altezzaCm) || null, peso = (F && F.pesoKg) || null;
  if (conta && !r.height_cm && F && F.altezzaCm) collegati.altezze++;
  if (conta && peso) collegati.pesi++;
  return { cod, ev, r, S, pos, t: tipo(r.position || pos), mano, manoFonte, F, altezza, peso, min: S ? S.sec / 60 : 0, ruoliDb: A.roles || [] };
}
const tutti = [];
for (const cod of CODICI) {
  const { ev, lista } = scegli(cod);
  for (const r of lista) tutti.push(riga(cod, ev, r));
}
// TUTTI I DISPONIBILI (v0.86, Ale: «mettimi tutti e poi scelgo io all'inizio della competizione chi convocare; non farlo solo per
// l'Italia ma per tutte le nazionali; non so chi si è ritirato quindi considerali tutti»): chi è stato convocato dalla nazionale in
// almeno un torneo del database (Mondiali 2025, Europei 2026, Coppa del Mondo 2026). Numero, ruolo e mano dalla convocazione più
// recente; chi era nella convocazione usata finora tiene la sua riga, quindi i suoi numeri non cambiano.
const DISPONIBILI = {};
for (const cod of CODICI) {
  const perGiocatore = new Map();
  for (const r of estratto.rosters.filter(r => r.team_code === cod)) { const g = perGiocatore.get(r.player_id) || []; g.push(r); perGiocatore.set(r.player_id, g); }
  DISPONIBILI[cod] = [...perGiocatore.values()].map(righe => {
    righe.sort((a, b) => (DATE[b.event_id] || '').localeCompare(DATE[a.event_id] || ''));
    const x = tutti.find(y => y.cod === cod && y.r.player_id === righe[0].player_id) || riga(cod, righe[0].event_id, righe[0], false);
    x.convocazioni = [...new Set(righe.map(r => r.event_id))];
    return x;
  });
  // DOPPIONI: nel database lo stesso giocatore compare a volte con due schede, con il nome scritto in due modi («TAHULL Roger» e
  // «TAHULL COMPTE Roger», «LAZIC Dorde» e «LAZIC Djordje»). Stessa nazionale, stessa data di nascita e stesso nome (o stessa iniziale e
  // un cognome in comune) = stessa persona; i gemelli (stessa data, nomi diversi: HESSELS Sebastian e Benjamin) restano due. Si tiene la
  // scheda della rosa usata finora o, altrimenti, la più recente, con tutte le convocazioni; le statistiche dell'altra scheda non si
  // sommano (le valutazioni dei 13 restano quelle di prima).
  const parole = n => String(n || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);
  const nomeProprio = n => (parole(n).find(w => w !== w.toUpperCase()) || '').split('-')[0].toLowerCase();
  const cognomi = n => parole(n).filter(w => w === w.toUpperCase() && /[A-Z]/.test(w)).map(w => w.toLowerCase());
  const stessaPersona = (a, b) => a.r.birth_date && a.r.birth_date === b.r.birth_date && (nomeProprio(a.r.name) === nomeProprio(b.r.name) ||
    (nomeProprio(a.r.name)[0] === nomeProprio(b.r.name)[0] && cognomi(a.r.name).some(c => cognomi(b.r.name).includes(c))));
  const unici = [];
  for (const x of DISPONIBILI[cod].sort((a, b) => (tutti.includes(b) - tutti.includes(a)) || (DATE[b.r.event_id] || '').localeCompare(DATE[a.r.event_id] || ''))) {
    const gia = unici.find(y => stessaPersona(x, y));
    if (gia) { gia.convocazioni = [...new Set([...gia.convocazioni, ...x.convocazioni])].sort((a, b) => (DATE[b] || '').localeCompare(DATE[a] || '')); gia.doppione = x.r.name; collegati.doppioni.push(`${cod} ${gia.r.name} = ${x.r.name}`); }
    else unici.push(x);
  }
  DISPONIBILI[cod] = unici;
}
// medie e dispersioni per gruppo (portieri / movimento) sulle sole righe con almeno 60 minuti
function stat(arr) { const m = arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length); const s = Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, arr.length)) || 1; return { m, s }; }
const campo = tutti.filter(x => x.S && x.t !== 'gk' && x.min >= 60), porte = tutti.filter(x => x.S && x.t === 'gk' && x.S.tir >= 10);
const M = {};
for (const k of ['G', 'T', 'AS', 'ST', 'BL', 'TO', 'ESP', 'RIG', 'CA', 'C']) M[k] = stat(campo.map(x => per32(x.S, k)));
M.conv = stat(campo.filter(x => x.S.T >= 5).map(x => x.S.G / x.S.T));
M.minPartita = stat(campo.filter(x => x.S.partite > 0).map(x => x.min / x.S.partite));
M.parate = stat(porte.map(x => x.S.par / x.S.tir));
// «z» prudente: il valore del giocatore viene mescolato con la media secondo quanto ha giocato (k = minuti di prudenza)
const zRate = (x, k, kMin = 96) => { if (!x.S || x.S.sec <= 0) return 0; const m = x.min, r = per32(x.S, k), w = m / (m + kMin); return clamp((r * w + M[k].m * (1 - w) - M[k].m) / M[k].s, -2.5, 2.5); };
const zConv = x => { if (!x.S) return 0; const n = x.S.T, p = (x.S.G + M.conv.m * 12) / (n + 12); return clamp((p - M.conv.m) / M.conv.s * Math.min(1, n / 20 + 0.3), -2.5, 2.5); };
const zMin = x => { if (!x.S || !x.S.partite) return 0; return clamp((x.min / x.S.partite - M.minPartita.m) / M.minPartita.s, -2, 2) * Math.min(1, x.S.partite / 5); };
const zPar = x => { if (!x.S || !x.S.tir) return 0; const p = (x.S.par + M.parate.m * 20) / (x.S.tir + 20); return clamp((p - M.parate.m) / M.parate.s, -2.5, 2.5); };
const zPS = x => { if (!x.S || !x.S.tirPS) return 0; const p = (x.S.parPS + 0.2 * 4) / (x.S.tirPS + 4); return clamp((p - 0.2) / 0.15, -2, 2); };
const zSprint = x => { if (!x.S || x.S.SPt < 2) return 0; return clamp((x.S.SPv / x.S.SPt - 0.5) / 0.25, -1.5, 1.5) * Math.min(1, x.S.SPt / 6); };

const PROFILO = [
  { vel: -10, res: -4, pot: -8, pre: -10, pas: 2, vis: 2, dif: -6, dis: 6, frz: 0 },
  { vel: -9, res: 1, pot: 3, pre: 2, pas: -3, vis: -1, dif: -2, dis: -3, frz: 10 },
  { vel: 8, res: 3, pot: -2, pre: 5, pas: 2, vis: 0, dif: 0, dis: 1, frz: -6 },
  { vel: 8, res: 3, pot: -2, pre: 5, pas: 2, vis: 0, dif: 0, dis: 1, frz: -6 },
  { vel: 0, res: 0, pot: 8, pre: 2, pas: 0, vis: 1, dif: -1, dis: 0, frz: 1 },
  { vel: 0, res: 0, pot: 8, pre: 2, pas: 0, vis: 1, dif: -1, dis: 0, frz: 1 },
  { vel: -2, res: 2, pot: 0, pre: -1, pas: 7, vis: 8, dif: 6, dis: 1, frz: 5 },
];
const PESI = [
  { rif: 4, pos: 4, usc: 1.5, rig: 1, pas: 1 }, { frz: 4, pot: 2, pre: 2, res: 1, dif: 1 }, { vel: 3, pre: 3, pas: 2, res: 1, dif: 1 }, { vel: 3, pre: 3, pas: 2, res: 1, dif: 1 },
  { pot: 3, pre: 3, vis: 1.5, pas: 1.5, vel: 1 }, { pot: 3, pre: 3, vis: 1.5, pas: 1.5, vel: 1 }, { vis: 3, pas: 3, dif: 2, frz: 1.5, pre: 1 },
];
const ovr = (s, ruolo) => { const w = PESI[ruolo]; let a = 0, b = 0; for (const k in w) { a += s[k] * w[k]; b += w[k]; } return Math.round(a / b); };
// ruolo del gioco per un tipo di giocatore (la mano decide il lato quando il ruolo vero non lo dice)
const ruoloDi = (t, mano) => t === 'gk' ? 0 : t === 'boa' ? 1 : t === 'dif' || t === 'punto' ? 6 : t === 'aladx' ? 2 : t === 'alasx' ? 3 : t === 'ala' ? (mano === 'L' ? 2 : 3) : (mano === 'L' ? 4 : 5);
// tutti i ruoli che sa fare (v0.86, Ale: «se ci sono doppi ruoli (molto probabile) scegli i secondi più forti dando variabilità ai
// cambi per coprire il più possibile più ruoli»): il ruolo del gioco più quelli dell'anagrafica del database (per esempio «Centre
// Forward, Driver»: centroboa e mezzo); i portieri solo in porta
const ruoliDi = (x, ruolo) => ruolo === 0 ? [0] : [...new Set([ruolo, ...(x.ruoliDb || []).map(pos => ruoloDi(tipo(pos), x.mano)).filter(r => r !== 0)])];

// FORZA DELLA SQUADRA AL RANKING (v0.86). La lista dei 14 scelta dal gioco tra tutti i disponibili (src/dati/lista-partita.js) è un po'
// più forte dei 13 usati finora, e di più dove i disponibili sono tanti (la Croazia ne ha 34, il Giappone 15). Perché la forza di ogni
// nazionale resti quella del ranking (docs/riferimenti/valutazioni.md, punto 1), tutte le voci dei suoi disponibili scendono di quanto la
// valutazione media dei 14 supera quella dei 13 di prima (portieri e movimento a parte; la valutazione è una media pesata delle voci,
// quindi scende della stessa quantità): chi è più forte resta più forte, e i 14 valgono quanto i 13 di prima.
function riportaAlRanking(pool) {
  const L = listaPartita(pool, 14, ovr), vecchi = pool.filter(g => g.inRosa13), scarti = {};
  const media = q => q.reduce((x, g) => x + g.ovr, 0) / q.length;
  for (const portiere of [true, false]) {
    const a = L.filter(g => (g.ruolo === 0) === portiere), b = vecchi.filter(g => (g.ruolo === 0) === portiere);
    if (!a.length || !b.length) continue;
    const c = media(a) - media(b);
    for (const g of pool) if ((g.ruolo === 0) === portiere && g._grezzo) { for (const k in g.s) g.s[k] = lim(g._grezzo[k] - c); g.ovr = ovr(g.s, g.ruolo); }
    scarti[portiere ? 'portieri' : 'movimento'] = +c.toFixed(2);
  }
  return scarti;
}
const scartiRanking = {};
for (const sq of SQ_DATABASE) {
  const cod = sq.codice, base = 57 + (sq.forza - 60) * 0.72;
  const gioc = tutti.filter(x => x.cod === cod);
  const gk = gioc.filter(x => x.t === 'gk').sort((a, b) => b.min - a.min || (b.S ? b.S.tir : 0) - (a.S ? a.S.tir : 0)).slice(0, 2);
  const mov = gioc.filter(x => x.t !== 'gk').sort((a, b) => b.min - a.min).slice(0, 11);
  // differenze individuali (prima di ricentrarle sulla squadra)
  const diff = x => {
    if (x.t === 'gk') { const zp = zPar(x); return { rif: zp * 6, pos: zp * 4, rig: zPS(x) * 5, usc: (x.S && x.S.tirCA ? clamp((x.S.parCA / x.S.tirCA - 0.2) / 0.2, -1, 1) * 3 : 0) }; }
    const zG = zRate(x, 'G'), zT = zRate(x, 'T'), zA = zRate(x, 'AS'), zS = zRate(x, 'ST'), zB = zRate(x, 'BL'), zTO = zRate(x, 'TO'), zE = zRate(x, 'ESP'), zR = zRate(x, 'RIG'), zCA = zRate(x, 'CA'), zC = zRate(x, 'C');
    const alto = x.altezza ? clamp((x.altezza - 192) / 6, -1.5, 1.5) : 0;
    const pesante = x.peso ? clamp((x.peso - 95) / 9, -1.5, 1.5) : 0;      // peso dal file di Ale (dove c'è): conta nella lotta al centro
    const centrale = x.t === 'boa' || x.t === 'dif';
    return { pre: zConv(x) * 5, pot: zG * 3 + zT * 1.5, vis: zA * 3.5, pas: zA * 2.5 - zTO * 1.5, dif: zS * 2.5 + zB * 2.5, dis: -(zE * 2.5 + zR * 1.5),
      vel: zCA * 2 + zSprint(x) * 3, res: zMin(x) * 3, frz: (centrale ? zC * 2.5 + alto * 2 + pesante * 2 : alto * 1 + pesante * 1) };
  };
  const tutti13 = [...gk, ...mov];
  const D = tutti13.map(diff);
  // ricentrare ogni voce sulla media della squadra (la forza della squadra resta quella del ranking)
  const medie = { gk: {}, campo: {} };      // le stesse medie valgono per gli altri disponibili (v0.86): le valutazioni dei 13 non cambiano
  for (const [nomeGrp, grp] of [['gk', tutti13.map((x, i) => i).filter(i => tutti13[i].t === 'gk')], ['campo', tutti13.map((x, i) => i).filter(i => tutti13[i].t !== 'gk')]]) {
    const chiavi = new Set(grp.flatMap(i => Object.keys(D[i])));
    for (const k of chiavi) { const m = grp.reduce((a, i) => a + (D[i][k] || 0), 0) / Math.max(1, grp.length); medie[nomeGrp][k] = m; for (const i of grp) D[i][k] = (D[i][k] || 0) - m; }
  }
  const scheda = (x, Di) => {
    const ruolo = ruoloDi(x.t, x.mano), P = PROFILO[ruolo], s = {};
    for (const st of ['vel', 'res', 'pot', 'pre', 'pas', 'vis', 'dif', 'dis', 'frz']) s[st] = base + P[st] + (Di[st] || 0);
    const gkb = ruolo === 0 ? base + 3 : base - 28;
    for (const st of ['rif', 'pos', 'usc', 'rig']) s[st] = gkb + (Di[st] || 0);
    // età (docs/riferimenti/valutazioni.md, punto 5)
    const e = eta(x.r.birth_date);
    if (e != null) {
      if (e <= 21) { s.vel += 2; s.vis -= 4; s.dis -= 3; }
      else if (e >= 35) { s.vel -= 6; s.res -= 4; s.vis += 5; s.dis += 2; }
      else if (e >= 31) { s.vel -= 3; s.res -= 2; s.vis += 3; }
    }
    if (x.r.captain) { s.vis += 1; s.dis += 1; }
    const grezzo = { ...s };      // con i decimali: serve a riportare la forza al ranking prima di arrotondare (v0.86)
    for (const k in s) s[k] = lim(s[k]);
    const S = x.S, dati = S ? (x.t === 'gk' ? { tornei: new Set(S.eventi).size, partite: S.partite, parate: S.par, tiriSubiti: S.tir, minuti: Math.round(x.min) }
      : { tornei: new Set(S.eventi).size, partite: S.partite, minuti: Math.round(x.min), gol: S.G, tiri: S.T, assist: S.AS, rubate: S.ST, murati: S.BL, espulsioni: S.ESP }) : null;
    // aspetto DOCUMENTATO (solo valori verificati, con la fonte); quelli mancanti si generano nel gioco (src/aspetto.js)
    const F = x.F, aspetto = {};
    if (F) for (const [k, q] of [['capelliColore', 'capelli'], ['capelliTaglio', 'taglio'], ['barba', 'barba'], ['carnagione', 'pelle'], ['occhi', 'occhi']])
      if (F[k]) aspetto[q] = F[k];
    if (Object.keys(aspetto).length) { aspetto.fonte = (F.verificaFotografica && F.verificaFotografica.stato) || 'file di Ale'; collegati.aspetto++; }
    return { id: x.r.player_id, num: x.r.cap_number, nome: cognome(x.r.name), nomeIntero: nomeIntero(x.r.name), nomeCompleto: x.r.name, ruolo, ruoloVero: x.r.position || x.pos || null,
      mano: x.mano === 'L' ? 'S' : 'D', manoNota: x.mano ? (x.manoFonte === 'database' ? null : x.manoFonte) : 'sconosciuta', altezza: x.altezza || null, peso: x.peso || null,
      ...(Object.keys(aspetto).length ? { aspetto } : {}), nascita: x.r.birth_date || null, capitano: !!x.r.captain,
      s, ovr: ovr(s, ruolo), dati, convocazione: x.ev, convocazioni: x.convocazioni || [x.ev], ruoli: ruoliDi(x, ruolo), _grezzo: grezzo };
  };
  const schede = tutti13.map((x, i) => scheda(x, D[i]));
  // titolari: il miglior portiere e, posto per posto, il più forte disponibile del ruolo giusto (poi chi gli somiglia di più)
  const PREF = { 1: [1, 6, 5, 4], 2: [2, 3, 4, 5], 3: [3, 2, 5, 4], 4: [4, 5, 2, 3, 6], 5: [5, 4, 3, 2, 6], 6: [6, 1, 4, 5] };
  const liberi = new Set(schede.map((_, i) => i)), titolari = [];
  const migliore = (filtro) => [...liberi].filter(i => filtro(schede[i])).sort((a, b) => schede[b].ovr - schede[a].ovr)[0];
  titolari[0] = migliore(g => g.ruolo === 0); liberi.delete(titolari[0]);
  for (const posto of [1, 6, 2, 3, 4, 5]) {
    let i; for (const r of PREF[posto]) { i = migliore(g => g.ruolo === r); if (i !== undefined) break; }
    if (i === undefined) i = migliore(g => g.ruolo !== 0);
    titolari[posto] = i; liberi.delete(i);
  }
  // panchina: prima i giocatori di movimento (per OVR), il secondo portiere in fondo
  const panchina = [...liberi].sort((a, b) => (schede[a].ruolo === 0) - (schede[b].ruolo === 0) || schede[b].ovr - schede[a].ovr);
  const ordine = [...titolari, ...panchina].map((i, k) => ({ ...schede[i], titolare: k < 7, posto: k < 7 ? k : null }));
  // numeri di calottina mancanti (0) o ripetuti: si assegnano i primi liberi (portieri 1 e 13 se possibile)
  const usati = new Set(), dup = new Set();
  for (const g of ordine) { if (g.num > 0 && !usati.has(g.num)) usati.add(g.num); else dup.add(g); }
  for (const g of dup) { const pref = g.ruolo === 0 ? [1, 13, 15] : []; let n = pref.find(v => !usati.has(v)); for (let v = 1; n === undefined; v++) if (!usati.has(v)) n = v; g.num = n; usati.add(n); g.numStimato = true; }
  // gli altri disponibili (v0.86): stesse statistiche, stesse medie della squadra (ricentrate come i 13), dal più forte
  const altri = DISPONIBILI[cod].filter(x => !tutti13.includes(x)).map(x => {
    const Dx = diff(x), m = x.t === 'gk' ? medie.gk : medie.campo;
    for (const k in Dx) Dx[k] -= m[k] || 0;
    return scheda(x, Dx);
  }).sort((a, b) => b.ovr - a.ovr);
  // inRosa13 = nella rosa di 13 del gioco fino alla v0.85 (la convocazione più recente): serve solo a tenere uguale l'aspetto e, a parità
  // di forza, la scelta della partita
  const pool = [...ordine.map(({ titolare, posto, ...g }) => ({ ...g, inRosa13: true })), ...altri];
  // cognomi uguali nella stessa squadra: si aggiunge l'iniziale del nome («Nagy A.», «Nagy Á.»)
  const doppi = new Set(pool.map(g => g.nome).filter((n, i, a) => a.indexOf(n) !== i));
  for (const g of pool) if (doppi.has(g.nome)) { const nomeProprio = g.nomeCompleto.split(/\s+/).find(w => w !== w.toUpperCase()); if (nomeProprio) g.nome += ' ' + nomeProprio[0] + '.'; }
  { const ancora = new Set(pool.map(g => g.nome).filter((n, i, a) => a.indexOf(n) !== i));      // stessa iniziale: nome intero
    for (const g of pool) if (ancora.has(g.nome)) { const np = g.nomeCompleto.split(/\s+/).find(w => w !== w.toUpperCase()); if (np) g.nome = g.nome.replace(/ \S+\.$/, ' ' + np); } }
  // il migliore della squadra (o i due migliori se staccati) sono i «campioni» della rosa
  const top = [...pool].sort((a, b) => b.ovr - a.ovr); top[0].campione = true; if (top[1].ovr >= top[0].ovr - 2) top[1].campione = true;
  scartiRanking[cod] = riportaAlRanking(pool);
  for (const g of pool) delete g._grezzo;
  rose[cod] = pool;
  riassunto.push(`${cod} (${ordine[0].convocazione}): ` + ordine.slice(0, 7).map(g => `${g.num} ${g.nome} ${g.ovr}`).join(', '));
}
// ---------- convocazioni ufficiali supplementari, senza statistiche individuali ----------
// Stesso livello di base e stessi profili di ruolo del gioco; nessuna prestazione o differenza individuale inventata.
// Il ruolo generale resta quello ufficiale, mentre i sette posti sono la proposta esplicita contenuta nella fonte.
function rosaSupplementare(sq, fonte) {
  const cod = sq.codice, posizioni = { GK: 'Goalkeeper', CF: 'Centre Forward', DF: 'Defender', W: 'Wing' };
  const selezionati = fonte.numeriSelezionati.map(n => fonte.convocati.find(p => p.numero === n));
  const gk = p => p && p.posizioneFonte === 'GK', F = fonte.formazioneGioco;
  if (selezionati.length !== 13 || selezionati.some(p => !p || !p.nomeFonte || !posizioni[p.posizioneFonte]) ||
      new Set(selezionati.map(p => p.numero)).size !== 13 || selezionati.filter(gk).length !== 2 ||
      !Array.isArray(F) || F.length !== 7 || new Set(F).size !== 7 ||
      !F.every((n, i) => { const p = selezionati.find(q => q.numero === n); return p && gk(p) === (i === 0); })) {
    throw new Error(`Convocazione supplementare non valida: ${cod}`);
  }
  const ordine = [...F, ...selezionati.filter(p => !F.includes(p.numero) && !gk(p)).map(p => p.numero),
    ...selezionati.filter(p => !F.includes(p.numero) && gk(p)).map(p => p.numero)];
  const base = 57 + (sq.forza - 60) * 0.72;
  // v0.86: tutti i convocati ufficiali, prima i 13 selezionati per il gioco (inRosa13), poi gli altri
  const tuttiNumeri = [...ordine, ...fonte.convocati.map(p => p.numero).filter(n => !ordine.includes(n))];
  const schede = tuttiNumeri.map((n, k) => {
    const p = fonte.convocati.find(q => q.numero === n), ruolo = ruoloDi(tipo(posizioni[p.posizioneFonte]), p.manoFonte), s = {};
    for (const st of ['vel', 'res', 'pot', 'pre', 'pas', 'vis', 'dif', 'dis', 'frz']) s[st] = lim(base + PROFILO[ruolo][st]);
    for (const st of ['rif', 'pos', 'usc', 'rig']) s[st] = lim(base + (ruolo === 0 ? 3 : -28));
    return { id: `euro2026_${cod}_${n}`, num: n, nome: cognome(p.nomeFonte), nomeIntero: nomeIntero(p.nomeFonte), nomeCompleto: p.nomeFonte,
      ruolo, ruoloVero: posizioni[p.posizioneFonte], mano: p.manoFonte === 'L' ? 'S' : 'D',
      manoNota: 'rapporto ufficiale European Aquatics / Microplus, 9 gennaio 2026', altezza: null, peso: null,
      nascita: p.nascita || null, capitano: !!p.capitano, s, ovr: ovr(s, ruolo), dati: null, convocazione: 'euro2026',
      convocazioni: ['euro2026'], ruoli: [ruolo], campione: false, statisticheStimate: true, ...(k < 13 ? { inRosa13: true } : {}),
      fonte: SUPPLEMENTO.fonte.url, fontePagina: fonte.pagina };
  });
  const doppi = new Set(schede.map(g => g.nome).filter((n, i, a) => a.indexOf(n) !== i));
  for (const g of schede) if (doppi.has(g.nome)) g.nome += ' ' + g.nomeIntero[0] + '.';
  const stessaIniziale = new Set(schede.map(g => g.nome).filter((n, i, a) => a.indexOf(n) !== i));
  for (const g of schede) if (stessaIniziale.has(g.nome)) {
    const proprio = g.nomeCompleto.split(/\s+/).find(w => w !== w.toUpperCase());
    if (proprio) g.nome = g.nome.replace(/ \S+\.$/, ' ' + proprio);
  }
  return schede;
}
for (const sq of SQ) {
  if (rose[sq.codice]) continue;
  const fonte = SUPPLEMENTO.squadre[sq.codice];
  if (!fonte) throw new Error(`Nessuna convocazione verificata per ${sq.codice}`);
  rose[sq.codice] = rosaSupplementare(sq, fonte);      // statistiche stimate uguali per ruolo: i 14 valgono già quanto i 13
  riassunto.push(`${sq.codice} (euro2026, statistiche STIMATE per squadra/ruolo, ${rose[sq.codice].length} convocati): ` + rose[sq.codice].slice(0, 7).map(g => `${g.num} ${g.nome} ${g.ovr}`).join(', '));
}
const risultato = {
  fonte: 'waterpolo_database di Ale, 13 novembre 2026 (World Aquatics, Microplus, Omega), per le 16 nazionali originali; rapporto ufficiale European Aquatics / Microplus del 9 gennaio 2026 per le 8 aggiunte europee.',
  metodo: '16 rose originali: strumenti/rose-dal-database.mjs; docs/riferimenti/valutazioni.md. 8 aggiunte europee: dati-sorgente/europei-2026-aggiunte.json; statistiche stimate per squadra e ruolo, senza dati individuali di prestazione.',
  // v0.86: per ogni nazionale tutti i disponibili (prima i 13 della rosa usata fino alla v0.85, inRosa13); la lista dei 14 della partita
  // la sceglie il gioco (src/dati/rose.js, listaPartita)
  tutti: rose,
  aggiunteEuropei2026: { fonte: SUPPLEMENTO.fonte.url, metodo: 'dati-sorgente/europei-2026-aggiunte.json: identita ufficiali di tutti i convocati (13 selezionati per il gioco fino alla v0.85); statistiche e formazione STIMATE. Le rose precedenti dal database di Ale non sono state ricalcolate.' },
};
// Scrivere soltanto dopo aver validato tutte le nazionali, anche quando l'output sostituisce i file del gioco.
fs.mkdirSync(path.join(OUTPUT, 'dati-sorgente'), { recursive: true });
fs.mkdirSync(path.join(OUTPUT, 'src/dati'), { recursive: true });
fs.writeFileSync(path.join(OUTPUT, 'dati-sorgente/database-giocatori.json'), JSON.stringify(estratto));
fs.writeFileSync(path.join(OUTPUT, 'src/dati/rose-db.json'), JSON.stringify(risultato, null, 1));
console.log(riassunto.join('\n'));
console.log('\nfile di Ale: ' + collegati.trovati + ' giocatori collegati; mani prese dal file ' + collegati.mani + '; altezze ' + collegati.altezze + '; pesi ' + collegati.pesi + '; con aspetto documentato ' + collegati.aspetto + '\n  disaccordi sulla mano (resta il database): ' + (collegati.disaccordi.join('; ') || 'nessuno') + '\n  non trovati nel file: ' + collegati.mancanti.length);
console.log(`\ngiocatori con due schede nel database, uniti (v0.86): ${collegati.doppioni.length}\n  ` + collegati.doppioni.join('\n  '));
console.log('\nforza riportata al ranking (v0.86), media delle voci tolte per nazionale: ' + Object.entries(scartiRanking).map(([c, v]) => `${c} ${v.movimento ?? 0}/${v.portieri ?? 0}`).join(', '));
console.log('\nmani: ' + Object.values(rose).flat().filter(g => g.mano === 'S').length + ' mancini, ' + Object.values(rose).flat().filter(g => g.manoNota === 'sconosciuta').length + ' sconosciute su ' + Object.values(rose).flat().length);
