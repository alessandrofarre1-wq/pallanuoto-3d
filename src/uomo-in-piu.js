// SCHEMI DELL'UOMO IN PIÙ (6 contro 5) — v0.44, richiesta di Ale (15/11/2026).
// Uno schema è una sequenza di 1-4 FASI: ogni fase ha i 6 posti dei giocatori di movimento, una durata e (facoltativo) il ruolo a cui
// cercare di dare la palla. I compagni nuotano verso i posti della fase in corso; finita la durata si passa alla fase dopo, l'ultima
// resta fino alla fine della superiorità. Così si descrivono le rotazioni dei documenti tecnici (4-2 che diventa 3-3, ritorno al 4-2
// dall'altro lato, uscita del palo...). Nessun numero casuale qui dentro: il computer sceglie lo schema in `ia.js` con `rnd`.
//
// Coordinate come nel resto del gioco (costanti.js, FORM_UP): [distanza dalla porta avversaria, lato (+ = destra di chi attacca)].
// Ruoli (indice 1-6, come ROLES senza il portiere): 1 centroboa, 2 ala destra, 3 ala sinistra, 4 mezzo destro, 5 mezzo sinistro, 6 punto.
// I numeri mostrati sono quelli del 4-2 iniziale scelti da Ale: interni 1..6 → Pos. 5, 1, 4, 2, 3, 6.
// Seguono il giocatore nelle rotazioni, non sono numeri di calottina. Indici, coordinate e palla restano interni.
// Le fonti Mistrangelo usano una numerazione diversa (perimetro 1-5 e pali P1/P5): i titoli qui usano quella di Ale.
import { FORM_UP } from './costanti.js';
import { pesata } from './taratura.js';

export const MAX_SCELTI = 3, MAX_FASI = 4, MAX_PERSONALI = 24, MAX_SIGLA = 10;
export const DURATE = [1.5, 2.5, 3.5, 5];      // secondi per fase (l'ultima resta comunque fino alla fine dell'uomo in più)
export const RUOLI_UP = ['Centroboa', 'Ala destra', 'Ala sinistra', 'Mezzo destro', 'Mezzo sinistro', 'Punto'];
const KEY = 'pallanuoto-uomo-v044';

const P42 = FORM_UP.slice(1).map(p => [...p]);                                   // 4-2 classico (il posto base del gioco)
const fase = (posti, durata = 2.5, palla = 0) => ({ posti, durata, palla });
// 3-3: tre sui 2 metri (esterni e centro), due ai 5 metri, il punto a 6,5
const P33 = [[2.1, 0], [2.0, 4.4], [2.0, -4.4], [4.6, 3.4], [4.6, -3.4], [6.5, 0]];

export const LIBRERIA = [
  { id: 'u42', sigla: '4-2', nome: '4-2 classico', fonte: 'Mistrangelo, fig. 1',
    descrizione: 'Sui 2 metri: Pos. 1 e 4 larghe, Pos. 5 e 6 ai pali. Pos. 2 e 3 tirano dai 5 metri. La palla gira fino al compagno libero.',
    fasi: [fase(P42, 5)] },
  { id: 'u33', sigla: '3-3', nome: '3-3', fonte: 'Mistrangelo, fig. 2',
    descrizione: 'Pos. 1, 4 e 5 sui 2 metri; Pos. 2, 3 e 6 fuori. Più appoggi per il tiro da lontano, con la Pos. 5 davanti alla porta.',
    fasi: [fase(P33, 5)] },
  { id: 'u33-42', sigla: '3-3›4-2', nome: '3-3 che diventa 4-2', fonte: 'Mistrangelo, fig. 3',
    descrizione: 'Si parte in 3-3: la Pos. 3 entra sul palo sinistro, la Pos. 5 scivola a destra e la Pos. 6 scende ai 5 metri.',
    fasi: [fase(P33, 2.5), fase([[2.1, 1.75], [2.0, 5.4], [2.0, -5.4], [5.2, 2.5], [2.1, -1.75], [5.2, -2.5]], 5, 4)] },
  { id: 'u42-33', sigla: '4-2›3-3', nome: '4-2 che diventa 3-3', fonte: 'Mistrangelo, fig. 4',
    descrizione: 'Dal 4-2 la Pos. 4 esce ai 5 metri, le Pos. 5 e 6 scivolano a sinistra e la Pos. 3 sale al centro, fuori.',
    fasi: [fase(P42, 2.5), fase([[2.1, 0], [2.0, 4.4], [4.6, -3.4], [4.6, 3.4], [6.5, 0], [2.0, -4.4]], 5, 3)] },
  { id: 'urot1', sigla: 'Rotaz. 5', nome: 'Rotazione verso Pos. 5', fonte: 'Mistrangelo, fig. 5',
    descrizione: 'Dal 4-2 verso il 3-3: la Pos. 6 scivola sul lato sinistro e la Pos. 5 si offre al passaggio vicino alla porta.',
    fasi: [fase(P42, 2.5), fase([[2.1, 0.6], [2.0, 5.4], [4.4, -4.0], [4.6, 3.6], [6.4, -0.5], [2.0, -3.9]], 5, 1)] },
  { id: 'u42-33-42', sigla: 'Doppio lato', nome: '4-2 → 3-3 → 4-2 dall’altro lato', fonte: 'Mistrangelo, fig. 6',
    descrizione: 'La Pos. 6 esce ai 5 metri, la Pos. 5 scivola dall’altro lato e la Pos. 2 entra sul palo destro: due cambi di lato per la difesa.',
    fasi: [fase(P42, 2),
      fase([[2.1, 0], [2.0, 4.6], [2.0, -4.6], [4.6, 3.4], [6.5, 0], [4.6, -3.4]], 2.5),
      fase([[2.1, -1.75], [2.0, 5.4], [2.0, -5.4], [2.1, 1.75], [5.2, 2.5], [5.2, -2.5]], 5, 4)] },
  { id: 'uscivola5', sigla: 'Uscita 4', nome: 'Uscita del 4', fonte: 'Mistrangelo, terza puntata, fig. 20-21',
    descrizione: 'Nel 6 contro 5 la Pos. 4, esterno sinistro sui 2 metri, esce per tirare; la Pos. 6 scivola sulla linea senza uscire e obbliga il difensore centrale a scegliere.',
    fasi: [fase(P42, 2), fase([[2.1, 1.75], [2.0, 5.4], [3.6, -5.0], [4.8, 3.2], [5.0, -1.2], [2.0, -3.7]], 5, 3)] },
  { id: 'utasca', sigla: 'Tasca dx', nome: 'Rotazione con la tasca', fonte: 'Manuale USA Water Polo 2021, 6x5 «4-2»',
    descrizione: 'Dal 4-2 si ruota a destra: la Pos. 3 va al centro, la Pos. 2 si allarga e la Pos. 1 sale «in tasca» tra i 2 e i 5 metri per tirare.',
    fasi: [fase(P42, 2.5), fase([[2.1, 1.75], [3.4, 4.6], [2.0, -5.4], [4.8, 5.4], [5.6, 0], [2.1, -1.75]], 5, 2)] },
  { id: 'u33-entra', sigla: '3-3 entra', nome: '3-3 con entrata della Pos. 1', fonte: 'Manuale USA Water Polo 2021, 6x5 «1 in, 2 down»',
    descrizione: 'Dal 3-3 la palla va alla Pos. 6; la Pos. 1 entra sul palo destro, la Pos. 5 scivola sul sinistro e la Pos. 2 scende larga: due 2 contro 1 in alto.',
    fasi: [fase(P33, 2.5, 6), fase([[2.1, -1.8], [2.1, 1.8], [2.0, -4.6], [2.4, 4.9], [5.2, -2.5], [5.6, 1.0]], 5)] },
  // v0.58, dal video di Ale (finale olimpica Parigi 2024, Serbia–Croazia, gol croato a 7:14 del 2° tempo): dal 4-2 la Pos. 6 esce al
  // centro dei 5 metri e la Pos. 5 si sposta al centro della porta; palla 4 → 1 attraverso la porta («rischioso, ma a quei livelli si
  // fa spesso», Ale), poi 1 → 2 e passaggio lungo che scavalca il 6 fino alla Pos. 3, lasciata libera dalla difesa: tiro sul primo palo
  { id: 'u6esce', sigla: 'Esce il 6', nome: 'Uscita del 6 (4-2 › 3-3)', fonte: 'Finale olimpica 2024, Serbia–Croazia (video di Ale)',
    descrizione: 'Dal 4-2 la Pos. 6 esce al centro dei 5 metri e la Pos. 5 va al centro della porta. La palla attraversa: 4 → 1 → 2 e poi il passaggio lungo alla Pos. 3, che tira subito.',
    fasi: [fase(P42, 1.5, 2),
      fase([[2.1, 0], [2.0, 4.6], [2.0, -4.6], [4.8, 3.4], [4.8, -3.4], [5.6, 0]], 2.5, 4),
      fase([[2.1, 0], [2.0, 4.6], [2.0, -4.6], [4.8, 3.4], [4.8, -3.4], [5.6, 0]], 5, 5)] },
];
export const SCELTI_BASE = ['u42', 'u33-42', 'u42-33-42'];
// schemi tra cui sceglie il computer: quelli di partenza più l'uscita del 6 vista nella finale olimpica (v0.58)
export const SCELTI_COMPUTER = [...SCELTI_BASE, 'u6esce'];

// ---------------------------------------------------------------- validazione
// Ogni posto resta in vasca e fuori dall'area di porta (dentro i 3,58 m dal centro non si sta sotto i 2,1 m: art. 8.2.8,
// stessa regola dell'editor delle strategie). Le durate sono quelle ammesse, la palla è un ruolo 1-6 oppure 0 (libera).
function posto(p) {
  if (!Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite)) return null;
  const z = Math.max(-8.8, Math.min(8.8, p[1]));
  const d = Math.max(Math.abs(z) < 3.58 ? 2.1 : 1.6, Math.min(10, p[0]));
  return [Math.round(d * 100) / 100, Math.round(z * 100) / 100];
}
export function validaUomo(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.fasi)) return null;
  if (input.fasi.length < 1 || input.fasi.length > MAX_FASI) return null;
  const fasi = [];
  for (const f of input.fasi) {
    if (!f || !Array.isArray(f.posti) || f.posti.length !== 6) return null;
    const posti = f.posti.map(posto); if (posti.some(p => !p)) return null;
    const durata = DURATE.includes(f.durata) ? f.durata : 2.5;
    const palla = Number.isInteger(f.palla) && f.palla >= 0 && f.palla <= 6 ? f.palla : 0;
    fasi.push({ posti, durata, palla });
  }
  const nome = typeof input.nome === 'string' ? input.nome.trim().slice(0, 36) : '';
  if (!nome) return null;
  const id = typeof input.id === 'string' && input.id ? input.id.slice(0, 40) : null;
  if (!id) return null;
  const sigla = typeof input.sigla === 'string' ? input.sigla.trim().slice(0, MAX_SIGLA) : '';
  return { id, nome, sigla, descrizione: typeof input.descrizione === 'string' ? input.descrizione.slice(0, 240) : '',
    fonte: typeof input.fonte === 'string' ? input.fonte.slice(0, 80) : '', personale: !!input.personale, fasi };
}

// ---------------------------------------------------------------- memoria (scelti e schemi personali)
function leggi() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && typeof v === 'object') return v; } catch { /* memoria non disponibile */ }
  return null;
}
function scrivi(stato) { try { localStorage.setItem(KEY, JSON.stringify(stato)); return true; } catch { return false; } }
export function personali() {
  const v = leggi(); if (!v || !Array.isArray(v.personali)) return [];
  return v.personali.map(s => validaUomo({ ...s, personale: true })).filter(Boolean).slice(0, MAX_PERSONALI);
}
export function tutti() { return [...LIBRERIA, ...personali()]; }
// nome breve da mostrare in partita (barra in alto, annuncio): la sigla scelta, altrimenti l'inizio del nome
export const siglaUomo = s => !s ? '4-2' : (s.sigla || (s.nome.length <= MAX_SIGLA ? s.nome : s.nome.slice(0, MAX_SIGLA - 1).trimEnd() + '…'));
export const trova = id => tutti().find(s => s.id === id) || null;
export function scelti() {
  const v = leggi(), ids = v && Array.isArray(v.scelti) ? v.scelti : SCELTI_BASE;
  const out = []; for (const id of ids) { const s = trova(id); if (s && !out.includes(s)) out.push(s); if (out.length >= MAX_SCELTI) break; }
  return out;
}
export function salvaScelti(ids) {
  const validi = [...new Set(ids)].filter(id => trova(id)).slice(0, MAX_SCELTI);
  return scrivi({ ...(leggi() || {}), scelti: validi, personali: personali() });
}
export function salvaPersonale(schema) {
  const s = validaUomo({ ...schema, personale: true }); if (!s) return null;
  const lista = personali().filter(x => x.id !== s.id);
  if (lista.length >= MAX_PERSONALI) return null;
  lista.push(s);
  const v = leggi() || {};
  return scrivi({ ...v, scelti: Array.isArray(v.scelti) ? v.scelti : SCELTI_BASE, personali: lista }) ? s : null;
}
export function eliminaPersonale(id) {
  const v = leggi() || {};
  const lista = personali().filter(x => x.id !== id);
  const sc = (Array.isArray(v.scelti) ? v.scelti : SCELTI_BASE).filter(x => x !== id);
  return scrivi({ ...v, scelti: sc, personali: lista });
}
export const nuovoId = () => 'p' + Date.now().toString(36);

// ---------------------------------------------------------------- esecuzione in partita
// team.uomo = { schema, fase, tf } : schema chiamato, fase in corso, istante in cui è iniziata
export function avviaUomo(team, schema, ora) { team.uomo = schema ? { schema, fase: 0, tf: ora } : null; }
// la fase passa alla successiva quando è finita la sua durata E i compagni sono arrivati ai posti (o comunque dopo 3 s in più)
export function avanzaUomo(team, ora, arrivati = true) {
  const u = team.uomo; if (!u) return;
  // conta solo il tempo di gioco: se la partita si è fermata (fallo, palla fuori) la fase non avanza intanto
  if (u.visto != null && ora - u.visto > 0.1) u.tf += ora - u.visto;
  u.visto = ora;
  const f = u.schema.fasi;
  const passato = ora - u.tf, dur = f[u.fase].durata;
  if (u.fase < f.length - 1 && passato >= dur && (arrivati || passato >= dur + 3)) { if (!arrivati) u.saltato = true; u.fase++; u.tf = ora; }
}
export const faseUomo = team => team.uomo ? team.uomo.schema.fasi[team.uomo.fase] : null;
// posti in uso con l'uomo in più: la fase dello schema chiamato, altrimenti il 4-2 della strategia
export function postiUomo(team, base) { const f = faseUomo(team); return f ? f.posti : base; }
// un posto è «palo» quando è davanti alla porta, sulla linea dei 2-3 metri: lì valgono ricezione e conclusione da palo
export const ePalo = p => p[0] <= 2.7 && Math.abs(p[1]) < 3.2;
// perimetro: chi non è palo, ordinato da destra a sinistra (per i passaggi «vicini»)
export function perimetroUomo(posti) {
  return [1, 2, 3, 4, 5, 6].filter(r => !ePalo(posti[r - 1])).sort((a, b) => posti[b - 1][1] - posti[a - 1][1]);
}

// RISPETTO DELLO SCHEMA (v0.45, Napolitano et al. 2013: gli schemi eseguiti bene rendono di più). Chi ha meno Visione e Disciplina
// parte in ritardo verso il posto della nuova fase (fino a 1,6 s per chi ha 45 di media), chi le ha alte parte subito.
export const ritardoSchema = p => 1.6 * Math.max(0, Math.min(1, (80 - pesata(((p.s?.vis ?? 70) + (p.s?.dis ?? 70)) / 2)) / 35));
export function postiUomoDi(team, p, base, ora) {
  const u = team.uomo; if (!u) return base;
  const f = u.schema.fasi; if (u.fase > 0 && ora - u.tf < ritardoSchema(p)) return f[u.fase - 1].posti;
  return f[u.fase].posti;
}
