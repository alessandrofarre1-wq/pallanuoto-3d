// ESPRESSIONI DEL VISO (solo disegno: non tocca mai il gioco e non usa numeri casuali).
// Il modello può avere delle forme alternative del viso (morph target, fatte in Blender: strumenti/blender/scheletro.py,
// funzioni interno_bocca ed espressioni) e una bocca che si apre, con cavità e denti. Qui un piccolo controller mescola le forme
// per ottenere sette espressioni, con passaggi morbidi e ritorno al viso neutro. Se il modello non ha le forme (o ne ha solo
// alcune) si usano solo quelle che il file .glb contiene davvero, lette al caricamento; senza forme non succede nulla.
import { ball, game, fight, teams, goalX } from '../stato.js';

// ricetta di ogni espressione: peso (0-1) di ciascuna forma del viso. Come nel foglio delle espressioni del concept di Ale,
// ogni espressione muove TUTTO il viso (sopracciglia, occhi, guance, naso, bocca, mento), non solo la bocca.
// Forme: _d / _s = lato destro / sinistro del personaggio.
export const ESPRESSIONI = {
  focus:        { sopracciglia_giu: 0.75, sopracciglia_aggrottate: 0.35, occhi_stretti: 0.3, labbra_strette: 0.7, mento_su: 0.6, bocca_giu: 0.25 },     // determinato
  effort:       { sopracciglia_aggrottate: 0.8, sopracciglia_giu: 0.3, occhi_stretti: 0.85, naso_arricciato: 0.6, guance_su: 0.6, labbro_su: 0.55,
                  bocca_larga: 0.9, bocca_aperta: 0.06 },                                                                                         // sforzo: denti stretti
  anger:        { sopracciglia_aggrottate: 1, sopracciglia_giu: 0.5, occhi_stretti: 0.55, naso_arricciato: 1, guance_su: 0.5, bocca_aperta: 1,
                  labbro_su: 1, bocca_larga: 0.35, bocca_giu: 0.35 },                                                                            // rabbia: l'urlo
  euphoria:     { bocca_aperta: 1, labbro_su: 0.7, bocca_larga: 0.55, sorriso_d: 0.85, sorriso_s: 0.85, guance_su: 0.9, sopracciglia_su: 1,
                  occhi_stretti: 0.25 },                                                                                                          // euforia: l'urlo del gol
  celebrate:    { sorriso_d: 1, sorriso_s: 1, guance_su: 0.8, labbro_su: 0.6, bocca_aperta: 0.4, bocca_larga: 0.6, sopracciglia_su: 0.55,
                  occhi_stretti: 0.25 },                                                                                                          // sorriso largo
  wink:         { occhio_chiuso_s: 1, sorriso_d: 1, sorriso_s: 0.25, guance_su: 0.4, sopracciglia_su: 0.3, labbro_su: 0.35, bocca_aperta: 0.1 },  // occhiolino
  disappointed: { sopracciglia_su_interno: 1, bocca_giu: 1, mento_su: 0.6, occhio_chiuso_d: 0.2, occhio_chiuso_s: 0.2 },                         // delusione
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

// MOMENTI: espressioni a tempo, avviate da cambiamenti di stato che il gioco ha già (nessuna regola nuova)
const momento = new WeakMap();      // giocatore → { nome, k, fino }
const segna = (p, nome, k, durata) => { if (p) momento.set(p, { nome, k, fino: game.time + durata }); };
let golPrima = false; const parataPrima = new WeakMap(), esclusoPrima = new WeakMap();
function osserva(p) {
  // gol: palla appena entrata in rete → euforia per chi ha segnato e (un po' meno) per i compagni, delusione per gli altri
  if (ball.inRete && !golPrima) {
    const segnano = teams.find(t => Math.sign(goalX(t)) === Math.sign(ball.x));
    for (const t of teams) for (const q of t.players) {
      if (t === segnano) segna(q, 'euphoria', q === ball.shooter ? 1 : 0.75, 2.8);
      else segna(q, 'disappointed', q.isGK ? 1 : 0.8, 3.2);
    }
  }
  golPrima = ball.inRete;
  // parata: il portiere che si è allungato ed è arrivato sulla palla esulta (parata spettacolare); chi ha tirato è deluso
  if (p.isGK) {
    const ora = !!p.parataFatta;
    if (ora && !parataPrima.get(p) && p.parataIn) { segna(p, 'euphoria', 0.8, 1.6); if (ball.shooter && ball.shooter.team !== p.team) segna(ball.shooter, 'disappointed', 0.9, 1.8); }
    parataPrima.set(p, ora);
  }
  // espulsione appena fischiata: rabbia
  const escl = !!p.excluded;
  if (escl && !esclusoPrima.get(p)) segna(p, 'anger', 1, 3.5);
  esclusoPrima.set(p, escl);
}

// quale espressione adesso: prima i momenti, poi gli stati continui
//  - sforzo: gesto di tiro o passaggio in corso (p.act), tiro in carica (p.charging), lotta al centro (fight), sprint (p.sprinting)
//  - occhiolino: chi ha appena fatto una finta riuscita (p.fakeUntil)
//  - concentrazione (determinato): chi ha la palla, e il portiere quando la palla è a meno di 8 m dalla sua porta
//  - dopo il gol, finché la partita non riprende: esultanza lieve per chi ha segnato, delusione per gli altri
export function espressioneDi(p) {
  if (!p || !p.team) return [null, 0];
  const m = momento.get(p);
  if (m && game.time < m.fino) return [m.nome, m.k];
  if (ball.inRete) {
    const segnano = teams.find(t => Math.sign(goalX(t)) === Math.sign(ball.x));
    if (segnano) return segnano === p.team ? ['celebrate', 1] : ['disappointed', 0.6];
  }
  if (game.state !== 'play') return [null, 0];
  if (p.fakeUntil > game.time) return ['wink', 1];      // finta riuscita (regole.js): occhiolino
  if ((p.act && !p.act.done) || p.charging) return ['effort', 1];
  if (fight.active && (fight.boa === p || fight.def === p)) return ['effort', 0.8];
  if (p.sprinting) return ['effort', 0.6];
  if (ball.holder === p) return ['focus', 1];
  if (p.isGK && Math.abs(ball.x + goalX(p.team)) < 8) return ['focus', 0.8];
  return [null, 0];
}

// per il ciclo di disegno: aggiorna il viso del giocatore secondo il gioco
export function visoGiocatore(p, dt) {
  const V = p.mesh && p.mesh.corpo && p.mesh.corpo.viso; if (!V) return;
  osserva(p);
  const [nome, k] = espressioneDi(p);
  aggiornaViso(V, nome, k, dt);
}
