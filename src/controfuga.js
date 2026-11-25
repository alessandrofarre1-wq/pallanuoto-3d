// ================= TIRI SPECIALI IN CONTROFUGA (sezione 4, v0.31) E PALOMBELLA (v0.88) =================
// Solo in controfuga: chi porta palla nuotando e non ha più difensori davanti alla porta, entro QTE.eta s dal recupero (v0.81).
// - SCHIZZO (descrizione di Ale): si resta distesi; la mano debole sta sotto la palla a pelo d'acqua e la mano forte la
//   colpisce di schiaffo, in un solo gesto. Palla bassa e tesa, senza caricamento: il portiere la legge male.
// - COLONNELLO: la mano forte prende la palla dall'acqua, la porta vicino alla spalla e la spinge in avanti.
// v0.88 (Ale: «se è in controfuga può scegliere anche lo schizzo (se non è troppo stanco e se ha qualità nel gioco) o il colonnello (se
// è meno stanco e qualità nel gioco)»): niente più tasto a comparsa per lo schizzo e il colonnello. Dentro l'area (PALOMBELLA.area) TIRO
// li sceglie da solo, con l'energia e la Precisione del tiratore (SPECIALI); fuori dall'area si tira normale. Stessa regola per il
// computer.
// PALOMBELLA (v0.88, Ale: «puoi anche togliere il tasto della palomba»): dentro l'area è un tipo di tiro, scelto da TIRO quando il
// portiere è fuori dai pali; fuori area compare il tasto PALOMBELLA (a comparsa) se il portiere è fuori dai pali e il tiratore è in
// buona posizione: va premuto subito e non è detto che sia gol. Il portiere esce dai pali nella controfuga avversaria (ia.js gkTarget,
// USCITA_PORTIERE), nel 7 contro 6 e quando rientra dalla metà campo.
import { clamp, rnd } from './costanti.js';
import { difensoriDavanti } from './statistiche.js';
import { allPlayers, ball, game, goalX, other, ownGoalX } from './stato.js';
import { diSchiena, doShoot, shotKind, startAct } from './tiri.js';
import { PALOMBELLA, QTE, SPECIALI } from './taratura.js';      // numeri del bilanciamento
export { PALOMBELLA, QTE, SPECIALI };
const distanzaPorta = p => Math.hypot(goalX(p.team) - p.x, p.z);
const puoTirare = p => ball.holder === p && !p.isGK && game.penalty !== p && game.state === 'play' &&
  !(p.freeThrow && Math.abs(goalX(p.team) - p.x) < 6) && !(p.pressatoUntil > game.time);
// la controfuga vera (v0.81): in nuotata verso la porta, senza difensori davanti, poco dopo il recupero della palla
export function controfugaVera(p) {
  if (!puoTirare(p) || game.time - (game.possT || 0) > QTE.eta) return false;
  const d = distanzaPorta(p);
  if (d < QTE.min || d > QTE.max) return false;
  const inNuotata = (p.oriz || 0) > 0.35 || Math.hypot(p.vx, p.vz) > 0.9;
  const velocita = Math.hypot(p.vx, p.vz), versoPorta = ((goalX(p.team) - p.x) * p.vx - p.z * p.vz) / (d * velocita || 1);
  // Schizzo e colonnello sono conclusioni in avanzamento verso la porta.
  // Allontanandosi ci si alza per il tiro normale, senza torcere il crawl a 180°.
  return inNuotata && versoPorta >= 0.5 && difensoriDavanti(p) === 0;
}
// che tiro speciale si può fare adesso (o null): dentro l'area, con l'energia e la Precisione che servono (v0.88)
export function occasioneControfuga(p) {
  if (!controfugaVera(p) || distanzaPorta(p) > PALOMBELLA.area || (p.s?.pre ?? 60) < SPECIALI.qualita) return null;
  const energia = p.stamina ?? 1;
  return energia >= SPECIALI.colonnello ? 'colonnello' : energia >= SPECIALI.schizzo ? 'schizzo' : null;
}
// il portiere della squadra che difende è fuori dai pali? (t = squadra che attacca)
export function portiereFuori(t) {
  const gk = other(t).players.find(q => q.isGK && !q.excluded);
  if (!gk) return true;
  return Math.abs(gk.x - ownGoalX(gk.team)) > PALOMBELLA.portiereFuori || Math.abs(gk.z) > PALOMBELLA.fuoriLato;
}
// dentro l'area TIRO sceglie da solo: palombella con il portiere fuori dai pali (se il tiratore non è di spalle alla porta), schizzo o
// colonnello nella controfuga vera, altrimenti null (tiro normale: tocco = polso, tenuto = tiro potente e teso)
export function sceltaTiroArea(p) {
  if (!puoTirare(p) || distanzaPorta(p) > PALOMBELLA.area) return null;
  if (portiereFuori(p.team) && !diSchiena(shotKind(p))) return 'lob';
  return occasioneControfuga(p);
}
// fuori area: c'è l'occasione per la palombella? portiere fuori dai pali e tiratore in buona posizione
export function occasionePalombella(p) {
  if (!puoTirare(p)) return false;
  const gx = goalX(p.team), d = distanzaPorta(p);
  if (d <= PALOMBELLA.area || d > PALOMBELLA.max) return false;
  if (Math.atan2(Math.abs(p.z), Math.abs(gx - p.x)) > PALOMBELLA.angolo) return false;
  if (!portiereFuori(p.team)) return false;
  return !allPlayers.some(q => q.team !== p.team && !q.excluded && !q.isGK && Math.hypot(q.x - p.x, q.z - p.z) < PALOMBELLA.libero);
}
// tasto a comparsa per il giocatore (v0.88: la palombella fuori area): si accende quando nasce l'occasione, si spegne dopo
// PALOMBELLA.durata o se l'occasione finisce
export function aggiornaQte(p) {
  const tipo = occasionePalombella(p) ? 'lob' : null;
  if (!tipo) { p.qte = null; return null; }
  if (p.qte && game.time > p.qte.fino) { p.qte = null; p.qteDopo = game.time + PALOMBELLA.pausa; return null; }
  if (!p.qte && game.time >= (p.qteDopo || 0)) p.qte = { tipo, fino: game.time + PALOMBELLA.durata };
  return p.qte;
}
export function palombella(p, aimZ) {
  p.qte = null; p.qteDopo = game.time + PALOMBELLA.pausa;
  return startAct(p, 'lob', 0.1, () => doShoot(p, 0.4, true, aimZ));
}
export function tiroSpeciale(p, tipo, aimZ) {
  p.qte = null; p.qteDopo = game.time + QTE.pausa;
  return startAct(p, tipo, tipo === 'schizzo' ? 0.05 : 0.08, () => doShoot(p, tipo === 'schizzo' ? 0.85 : 0.75, false, aimZ, { speciale: tipo }));
}
// il computer: si avvicina e, se l'occasione dura, la sfrutta (più spesso chi tira bene)
export function aiControfuga(p, dt) {
  const tipo = occasioneControfuga(p);
  if (!tipo || p.act || distanzaPorta(p) > QTE.maxComputer) return false;      // il computer arriva più vicino
  if (rnd() < dt * (0.5 + 0.7 * clamp((p.s.pre - 60) / 30, 0, 1))) { p.motivoTiro = 'controfuga'; tiroSpeciale(p, tipo, null); return true; }
  return false;
}
// il computer e la palombella (v0.88): fuori area con l'occasione (PALOMBELLA.computer al secondo), dentro l'area appena il portiere è
// fuori dai pali e il tiratore ha deciso di tirare (sceltaTiroArea, in ia.js)
export function aiPalombella(p, dt) {
  if (p.act || !occasionePalombella(p)) return false;
  if (rnd() < dt * PALOMBELLA.computer * (0.6 + 0.6 * clamp(((p.s?.vis ?? 60) - 50) / 40, 0, 1))) { p.motivoTiro = 'palombella'; palombella(p, null); return true; }
  return false;
}
