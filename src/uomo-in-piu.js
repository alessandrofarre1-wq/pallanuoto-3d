// SCHEMI DELL'UOMO IN PIÙ (6 contro 5) — v0.44, richiesta di Ale (15/11/2026).
// Uno schema è una sequenza di 1-4 FASI: ogni fase ha i 6 posti dei giocatori di movimento, una durata e (facoltativo) il ruolo a cui
// cercare di dare la palla. I compagni nuotano verso i posti della fase in corso; finita la durata si passa alla fase dopo, l'ultima
// resta fino alla fine della superiorità. Così si descrivono le rotazioni dei documenti tecnici (4-2 che diventa 3-3, ritorno al 4-2
// dall'altro lato, uscita del palo...). Nessun numero casuale qui dentro: il computer sceglie lo schema in `ia.js` con `rnd`.
//
// Coordinate come nel resto del gioco (costanti.js, FORM_UP): [distanza dalla porta avversaria, lato (+ = destra di chi attacca)].
// Ruoli (indice 1-6, come ROLES senza il portiere): 1 centroboa, 2 ala destra, 3 ala sinistra, 4 mezzo destro, 5 mezzo sinistro, 6 punto.
// Nei documenti (Mistrangelo, «Pali in superiorità numerica», Rari Nantes Savona) le posizioni sono numerate 1-5 da destra a sinistra
// sul perimetro e i pali sono P1 (destra) e P5 (sinistra): 1 = nostra ala destra (2), 5 = ala sinistra (3), 2 = mezzo destro (4),
// 4 = mezzo sinistro (5), P1 = centroboa (1), P5 = punto (6).
import { FORM_UP } from './costanti.js';

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
    descrizione: 'Quattro sui 2 metri (due esterni e due pali) e due tiratori ai 5 metri. La palla gira in fretta fino al tiro libero.',
    fasi: [fase(P42, 5)] },
  { id: 'u33', sigla: '3-3', nome: '3-3', fonte: 'Mistrangelo, fig. 2',
    descrizione: 'Tre sui 2 metri e tre fuori: più tiratori da lontano, il centro libera lo spazio per chi è al centro.',
    fasi: [fase(P33, 5)] },
  { id: 'u33-42', sigla: '3-3›4-2', nome: '3-3 che diventa 4-2', fonte: 'Mistrangelo, fig. 3',
    descrizione: 'Si parte in 3-3; il mezzo sinistro entra sul palo, il centro scivola a destra e il punto scende ai 5 metri.',
    fasi: [fase(P33, 2.5), fase([[2.1, 1.75], [2.0, 5.4], [2.0, -5.4], [5.2, 2.5], [2.1, -1.75], [5.2, -2.5]], 5, 4)] },
  { id: 'u42-33', sigla: '4-2›3-3', nome: '4-2 che diventa 3-3', fonte: 'Mistrangelo, fig. 4',
    descrizione: 'Dal 4-2 l’ala sinistra esce ai 5 metri, i pali scivolano a sinistra e il mezzo sinistro diventa punto.',
    fasi: [fase(P42, 2.5), fase([[2.1, 0], [2.0, 4.4], [4.6, -3.4], [4.6, 3.4], [6.5, 0], [2.0, -4.4]], 5, 3)] },
  { id: 'urot1', sigla: 'Rotaz. 1', nome: 'Rotazione verso 1', fonte: 'Mistrangelo, fig. 5',
    descrizione: 'Come il 4-2 che diventa 3-3, ma lo scivolamento del palo sinistro è corto: si apre la linea per il palo destro.',
    fasi: [fase(P42, 2.5), fase([[2.1, 0.6], [2.0, 5.4], [4.4, -4.0], [4.6, 3.6], [6.4, -0.5], [2.0, -3.9]], 5, 1)] },
  { id: 'u42-33-42', sigla: 'Doppio lato', nome: '4-2 → 3-3 → 4-2 dall’altro lato', fonte: 'Mistrangelo, fig. 6',
    descrizione: 'Il palo sinistro esce, il centro si sposta, poi il mezzo destro entra sul palo: la difesa deve cambiare lato due volte.',
    fasi: [fase(P42, 2),
      fase([[2.1, 0], [2.0, 4.6], [2.0, -4.6], [4.6, 3.4], [6.5, 0], [4.6, -3.4]], 2.5),
      fase([[2.1, -1.75], [2.0, 5.4], [2.0, -5.4], [2.1, 1.75], [5.2, 2.5], [5.2, -2.5]], 5, 4)] },
  { id: 'uscivola5', sigla: 'Uscita 5', nome: 'Uscita del 5 e scivolamento del palo', fonte: 'Mistrangelo, terza puntata, fig. 20-21',
    descrizione: 'L’esterno sinistro esce dai 2 metri per tirare; il palo sinistro scivola sulla linea senza uscire e obbliga il centrale a scegliere.',
    fasi: [fase(P42, 2), fase([[2.1, 1.75], [2.0, 5.4], [3.6, -5.0], [4.8, 3.2], [5.0, -1.2], [2.0, -3.7]], 5, 3)] },
];
export const SCELTI_BASE = ['u42', 'u33-42', 'u42-33-42'];

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
  if (u.fase < f.length - 1 && passato >= dur && (arrivati || passato >= dur + 3)) { u.fase++; u.tf = ora; }
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
