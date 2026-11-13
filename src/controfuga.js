// ================= TIRI SPECIALI IN CONTROFUGA (sezione 4, v0.31) =================
// Solo in controfuga: chi porta palla nuotando e non ha più difensori davanti alla porta.
// - SCHIZZO (descrizione di Ale): si resta distesi; la mano debole sta sotto la palla a pelo d'acqua e la mano forte la
//   colpisce di schiaffo, in un solo gesto. Palla bassa e tesa, senza caricamento: il portiere la legge male. Più lontano.
// - COLONNELLO: la mano forte prende la palla dall'acqua, la porta vicino alla spalla e la spinge in avanti. Da vicino.
// Per il giocatore c'è un tasto a comparsa: compare «Premi TIRO» (sul telefono il pulsante TIRO si illumina con «Premi!»);
// se non lo preme in tempo l'occasione sparisce e il tiro resta quello normale. Il computer li usa con la stessa regola.
import { clamp, rnd } from './costanti.js';
import { difensoriDavanti } from './statistiche.js';
import { ball, game, goalX } from './stato.js';
import { doShoot, startAct } from './tiri.js';
export const QTE = { durata: 1.4, pausa: 2.5, vicino: 5.5, min: 2.5, max: 8, maxComputer: 6.5 };
// che tiro speciale si può fare adesso (o null)
export function occasioneControfuga(p) {
  if (ball.holder !== p || p.isGK || game.penalty === p || game.state !== 'play') return null;
  if (p.freeThrow && Math.abs(goalX(p.team) - p.x) < 6) return null;
  if (p.pressatoUntil > game.time) return null;
  const d = Math.hypot(goalX(p.team) - p.x, p.z);
  if (d < QTE.min || d > QTE.max) return null;
  const inNuotata = (p.oriz || 0) > 0.35 || Math.hypot(p.vx, p.vz) > 0.9;
  if (!inNuotata || difensoriDavanti(p) > 0) return null;
  return d < QTE.vicino ? 'colonnello' : 'schizzo';
}
// tasto a comparsa per il giocatore: si accende quando nasce l'occasione, si spegne dopo QTE.durata o se l'occasione finisce
export function aggiornaQte(p) {
  const tipo = occasioneControfuga(p);
  if (!tipo) { p.qte = null; return null; }
  if (p.qte && game.time > p.qte.fino) { p.qte = null; p.qteDopo = game.time + QTE.pausa; return null; }
  if (!p.qte && game.time >= (p.qteDopo || 0)) p.qte = { tipo, fino: game.time + QTE.durata };
  if (p.qte) p.qte.tipo = tipo;
  return p.qte;
}
export function tiroSpeciale(p, tipo, aimZ) {
  p.qte = null; p.qteDopo = game.time + QTE.pausa;
  return startAct(p, tipo, tipo === 'schizzo' ? 0.05 : 0.08, () => doShoot(p, tipo === 'schizzo' ? 0.85 : 0.75, false, aimZ, { speciale: tipo }));
}
// il computer: si avvicina e, se l'occasione dura, la sfrutta (più spesso chi tira bene)
export function aiControfuga(p, dt) {
  const tipo = occasioneControfuga(p);
  if (!tipo || p.act || Math.hypot(goalX(p.team) - p.x, p.z) > QTE.maxComputer) return false;      // il computer arriva più vicino
  if (rnd() < dt * (0.5 + 0.7 * clamp((p.s.pre - 60) / 30, 0, 1))) { tiroSpeciale(p, tipo, null); return true; }
  return false;
}
