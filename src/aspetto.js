// ASPETTO DEI GIOCATORI (solo disegno: non tocca mai statistiche, valutazioni o fisica; non usa i numeri casuali del gioco).
// Ogni giocatore ha un profilo visivo stabile, ricavato:
//  - dai dati DOCUMENTATI quando ci sono (rose-db.json: altezza e peso dal database e dal file di Ale; capelli e barba osservati
//    da foto ufficiali, con la fonte) → tipo 'verified';
//  - da calcoli sui dati documentati (corporatura dall'indice peso/altezza, scala dall'altezza) → tipo 'derived';
//  - altrimenti da un generatore con seme = id stabile del giocatore + versione del sistema (mai dall'ordine di caricamento, dal
//    numero di calottina o dalla squadra in cui gioca) → tipo 'generated'. Pelle e colore dei capelli mancanti sono scelti con
//    probabilità per nazionalità (decisione di Ale): sono una scelta per il disegno, NON un dato sul giocatore vero.
// Stesso giocatore = stesso aspetto in ogni partita e sessione. Cambia solo se cambiano i dati o VERSIONE_ASPETTO.
// Vedi docs/aspetto-giocatori.md.
export const VERSIONE_ASPETTO = 1;
export const MODELLO_BASE = 'pallanuotista-v2';

// toni della pelle (moltiplicano il colore dell'immagine solo sulla pelle): dal più chiaro al più scuro
export const PELLI = ['molto chiara', 'chiara', 'chiara calda', 'olivastra', 'ambrata', 'scura', 'molto scura'];
export const TONI_PELLE = [[1.06, 1.0, 0.96], [1, 1, 1], [0.97, 0.91, 0.85], [0.9, 0.8, 0.68], [0.78, 0.63, 0.49], [0.6, 0.46, 0.35], [0.42, 0.3, 0.23]];
// colori dei capelli (si vedono nelle sopracciglia e nella barba: sotto la cuffia i capelli non si vedono)
export const CAPELLI = { nero: [0.06, 0.045, 0.035], castano_scuro: [0.15, 0.095, 0.06], castano: [0.26, 0.165, 0.095], castano_chiaro: [0.4, 0.28, 0.16],
  biondo_scuro: [0.52, 0.39, 0.23], biondo: [0.72, 0.57, 0.36], rosso: [0.5, 0.22, 0.1], grigio: [0.45, 0.44, 0.42] };
export const BARBE = ['nessuna', 'barba_leggera', 'barba_corta', 'barba_piena'];
export const CORPORATURE = ['snello', 'atletico', 'robusto'];
export const OCCHI = ['marroni', 'nocciola', 'verdi', 'azzurri', 'grigi'];

// probabilità per nazionalità (solo per i valori mancanti)
const GRUPPO = { ITA: 'med', ESP: 'med', GRE: 'med', HUN: 'est', ROU: 'est', SRB: 'est', CRO: 'est', MNE: 'est',
  USA: 'mista', CAN: 'mista', AUS: 'mista', RSA: 'mista', BRA: 'bra', JPN: 'asia', CHN: 'asia', SGP: 'asia' };
const P_PELLE = { med: [5, 25, 35, 30, 5, 0, 0], est: [15, 45, 30, 10, 0, 0, 0], mista: [12, 35, 25, 12, 8, 5, 3], bra: [3, 15, 25, 25, 17, 10, 5],
  asia: [0, 25, 45, 25, 5, 0, 0] };
const P_CAPELLI = { med: { nero: 35, castano_scuro: 40, castano: 17, castano_chiaro: 6, biondo_scuro: 2 },
  est: { nero: 20, castano_scuro: 35, castano: 25, castano_chiaro: 10, biondo_scuro: 7, biondo: 3 },
  mista: { nero: 12, castano_scuro: 22, castano: 24, castano_chiaro: 18, biondo_scuro: 12, biondo: 9, rosso: 3 },
  bra: { nero: 45, castano_scuro: 35, castano: 15, castano_chiaro: 5 }, asia: { nero: 90, castano_scuro: 10 } };
const P_OCCHI = { med: [70, 15, 8, 5, 2], est: [40, 15, 15, 20, 10], mista: [45, 15, 12, 20, 8], bra: [75, 15, 5, 4, 1], asia: [95, 5, 0, 0, 0] };
const P_BARBA = [50, 30, 15, 5], P_CORPO = [25, 50, 25];

// generatore deterministico (stesso seme = stessi numeri), separato da quello del gioco
function hash(t) { let h = 2166136261; for (const ch of t) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function generatore(seme) { let a = hash(seme); return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function pesca(r, pesi) { const tot = pesi.reduce((a, b) => a + b, 0); let x = r() * tot; for (let i = 0; i < pesi.length; i++) { x -= pesi[i]; if (x < 0) return i; } return pesi.length - 1; }
function pescaChiave(r, tab) { const k = Object.keys(tab); return k[pesca(r, k.map(q => tab[q]))]; }
const CAPELLI_DOC = { nero: 'nero', castano_scuro: 'castano_scuro', castano: 'castano', castano_chiaro: 'castano_chiaro', biondo_scuro: 'biondo_scuro',
  biondo: 'biondo', rosso: 'rosso', grigio: 'grigio', brizzolato: 'grigio', calvo: 'castano' };

// profilo visivo di una scheda della rosa. tentativo > 0 = rigenerare i soli valori generati (per evitare doppioni nella squadra)
export function profiloVisivo(g, codice, tentativo = 0) {
  const id = g.id || `${codice}-${g.num}-${g.nomeCompleto || g.nome}`;
  const r = generatore(`${id}|aspetto|v${VERSIONE_ASPETTO}|${tentativo}`);
  const gr = GRUPPO[codice] || 'mista', D = g.aspetto || {}, fonte = D.fonte || 'documentato';
  const meta = {};
  // altezza → scala del corpo (±5%: si vede la differenza senza rompere pose e immersione)
  let alt = g.altezza;
  if (alt) meta.heightScale = { tipo: 'verified', da: 'altezza', valore: alt };
  else { alt = Math.round(192 + (r() + r() + r() - 1.5) * 8); meta.heightScale = { tipo: 'generated' }; }
  const heightScale = Math.max(0.95, Math.min(1.05, 1 + (alt - 192) / 192 * 0.6));
  // corporatura: dall'indice peso/altezza se c'è il peso, altrimenti generata
  let bodyBuild;
  if (g.peso && g.altezza) { const bmi = g.peso / (g.altezza / 100) ** 2; bodyBuild = bmi < 25.5 ? 'snello' : bmi > 28.5 ? 'robusto' : 'atletico'; meta.bodyBuild = { tipo: 'derived', da: ['altezza', 'peso'], indice: Math.round(bmi * 10) / 10 }; }
  else { bodyBuild = CORPORATURE[pesca(r, P_CORPO)]; meta.bodyBuild = { tipo: 'generated' }; }
  // pelle
  let skinTone;
  if (D.pelle && PELLI.includes(D.pelle)) { skinTone = PELLI.indexOf(D.pelle); meta.skinTone = { tipo: 'verified', fonte }; }
  else { skinTone = pesca(r, P_PELLE[gr]); meta.skinTone = { tipo: 'generated', da: 'nazionalità' }; }
  // capelli (colore e taglio)
  let hairColor;
  if (D.capelli && CAPELLI_DOC[D.capelli]) { hairColor = CAPELLI_DOC[D.capelli]; meta.hairColor = { tipo: 'verified', fonte }; }
  else { hairColor = pescaChiave(r, P_CAPELLI[gr]); meta.hairColor = { tipo: 'generated', da: 'nazionalità' }; }
  const hairStyle = D.taglio || 'corto'; meta.hairStyle = D.taglio ? { tipo: 'verified', fonte } : { tipo: 'generated' };
  // barba
  let beardStyle;
  if (D.barba && BARBE.includes(D.barba)) { beardStyle = D.barba; meta.beardStyle = { tipo: 'verified', fonte }; }
  else { beardStyle = BARBE[pesca(r, P_BARBA)]; meta.beardStyle = { tipo: 'generated' }; }
  // occhi (salvati per i primi piani futuri; in partita non si vedono)
  let eyeColor;
  if (D.occhi) { eyeColor = D.occhi; meta.eyeColor = { tipo: 'verified', fonte }; }
  else { eyeColor = OCCHI[pesca(r, P_OCCHI[gr])]; meta.eyeColor = { tipo: 'generated', da: 'nazionalità' }; }
  return { playerId: id, modelBaseId: MODELLO_BASE, appearanceVersion: VERSIONE_ASPETTO, heightScale, bodyBuild, skinTone, eyeColor, hairColor, hairStyle, beardStyle,
    sourceMetadata: meta };
}

// profili di una squadra: niente doppioni evidenti (stessa pelle, capelli, barba e corporatura). Si cambiano solo i valori
// generati, in ordine di id (non di caricamento); i valori documentati non si toccano mai.
export function profiliSquadra(rosa, codice) {
  const visti = new Set();
  for (const g of [...rosa].sort((a, b) => String(a.id || a.num).localeCompare(String(b.id || b.num)))) {
    let p = profiloVisivo(g, codice), k = 0;
    const firma = q => `${q.skinTone}|${q.hairColor}|${q.beardStyle}|${q.bodyBuild}`;
    while (visti.has(firma(p)) && k < 8) p = profiloVisivo(g, codice, ++k);
    visti.add(firma(p)); g.profilo = p;
  }
  return rosa;
}

// valori per il disegno (corpo.js)
export function valoriDisegno(p) {
  return { tono: TONI_PELLE[p.skinTone], capelli: CAPELLI[p.hairColor] || CAPELLI.castano, barba: BARBE.indexOf(p.beardStyle),
    gonfia: { snello: -0.006, atletico: 0, robusto: 0.010 }[p.bodyBuild] || 0, scala: p.heightScale };
}
