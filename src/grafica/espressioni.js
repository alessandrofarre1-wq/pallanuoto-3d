// ESPRESSIONI DEL VISO (solo disegno: non tocca mai il gioco e non usa numeri casuali).
// Il modello può avere delle forme alternative del viso (morph target, fatte in Blender: strumenti/blender/scheletro.py,
// funzione espressioni). Qui un piccolo controller le mescola per ottenere quattro espressioni sobrie, con passaggi morbidi e
// ritorno al viso neutro. Se il modello non ha le forme (o ne ha solo alcune) non succede nulla: si usano solo i nomi che il
// file .glb contiene davvero, letti al caricamento.
import { ball, game, fight, teams, goalX } from '../stato.js';

// ricetta di ogni espressione: peso (0-1) di ciascuna forma del viso. Pesi bassi: il concept vuole un viso sobrio.
export const ESPRESSIONI = {
  focus:       { sopracciglia_giu: 0.45, occhi_stretti: 0.35, labbra_strette: 0.2 },      // concentrazione
  effort:      { sopracciglia_giu: 0.7, occhi_stretti: 0.6, labbra_strette: 0.6 },        // sforzo: tiro, sprint, lotta
  celebrate:   { sorriso: 0.8, sopracciglia_su_interno: 0.2 },                           // lieve esultanza
  disappointed:{ bocca_giu: 0.7, sopracciglia_su_interno: 0.6 },                          // delusione contenuta
};
const ENTRA = 7, ESCE = 4;      // velocità dei passaggi (per secondo): si entra un po' più in fretta di quanto si esca

// da chiamare una volta per corpo: trova le forme che il modello ha davvero. null = nessuna espressione disponibile.
export function preparaViso(maglia) {
  const D = maglia && maglia.morphTargetDictionary;
  if (!D || !maglia.morphTargetInfluences) return null;
  const forme = Object.keys(D);
  const ricette = {};
  for (const [nome, r] of Object.entries(ESPRESSIONI)) {
    const usabili = Object.entries(r).filter(([f]) => f in D);
    if (usabili.length) ricette[nome] = usabili.map(([f, w]) => [D[f], Math.min(1, Math.max(0, w))]);
  }
  if (!Object.keys(ricette).length) return null;
  const pesi = maglia.morphTargetInfluences; pesi.fill(0);
  return { pesi, ricette, forme, voluti: new Float32Array(pesi.length), attuale: null };
}

// porta il viso verso l'espressione «nome» (null = neutro) con l'intensità data (0-1), in modo morbido
export function aggiornaViso(V, nome, intensita, dt) {
  if (!V) return;
  V.attuale = nome && V.ricette[nome] ? nome : null;
  V.voluti.fill(0);
  if (V.attuale) { const k = Math.min(1, Math.max(0, intensita)); for (const [i, w] of V.ricette[V.attuale]) V.voluti[i] = w * k; }
  for (let i = 0; i < V.pesi.length; i++) {
    const a = V.pesi[i], b = V.voluti[i], vel = b > a ? ENTRA : ESCE;
    V.pesi[i] = Math.min(1, Math.max(0, a + (b - a) * (1 - Math.exp(-vel * dt))));
  }
}

// quale espressione: solo da stati che il gioco ha già (nessuna regola nuova)
//  - gol: la palla è in fondo alla rete (ball.inRete) → chi ha segnato esulta, chi ha subito è deluso
//  - sforzo: gesto di tiro o passaggio in corso (p.act), tiro in carica (p.charging), sprint (p.sprinting), lotta al centro (fight)
//  - concentrazione: chi ha la palla, e il portiere quando la palla è a meno di 8 m dalla sua porta
export function espressioneDi(p) {
  if (!p || !p.team) return [null, 0];
  if (ball.inRete) {
    const segna = teams.find(t => Math.sign(goalX(t)) === Math.sign(ball.x));
    if (segna) return segna === p.team ? ['celebrate', 1] : ['disappointed', 1];
  }
  if (game.state !== 'play') return [null, 0];
  if ((p.act && !p.act.done) || p.charging) return ['effort', 1];
  if (fight.active && (fight.boa === p || fight.def === p)) return ['effort', 0.8];
  if (p.sprinting) return ['effort', 0.7];
  if (ball.holder === p) return ['focus', 1];
  if (p.isGK && Math.abs(ball.x + goalX(p.team)) < 8) return ['focus', 0.8];
  return [null, 0];
}

// comodo per il ciclo di disegno: aggiorna il viso del giocatore secondo il gioco
export function visoGiocatore(p, dt) {
  const V = p.mesh && p.mesh.corpo && p.mesh.corpo.viso; if (!V) return;
  const [nome, k] = espressioneDi(p);
  aggiornaViso(V, nome, k, dt);
}
