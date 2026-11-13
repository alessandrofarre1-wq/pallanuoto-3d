// ================= ESPULSIONI: POZZETTO E RIENTRO (sezione 6, v0.33) =================
// Regole World Aquatics (con le modifiche di giugno 2025): l'espulso va nella zona di rientro (il «pozzetto», nell'angolo
// della propria metà sul lato opposto al tavolo della giuria) senza ostacolare il gioco, e rientra solo da lì quando finisce
// il tempo o la sua squadra riconquista palla; se ci arriva tardi, rientra appena ci arriva. Dal pozzetto si può fare un
// cambio senza il «cinque» (WP2.6 e 9.2). Qui: nel pozzetto si recupera stamina più in fretta; al rientro il computer sceglie
// se ripartire in controfuga (palla nostra) o difendere su chi ha la palla.
import { HW, dist } from './costanti.js';
import { ball, ctrl, game, goalX, ownGoalX } from './stato.js';
export const POZZETTO = { recupero: 0.05, arrivo: 0.45, sceltaDurata: 4, vicinoPorta: 10 };
export const puntoPozzetto = t => ({ x: ownGoalX(t) + t.dir * 0.6, z: -HW - 1.0 });
// dove nuota l'espulso (o null se è già nel pozzetto)
export function obiettivoEspulso(p) {
  const P = puntoPozzetto(p.team);
  if (!p.alPozzetto && dist(p, P) < POZZETTO.arrivo) { p.alPozzetto = true; p.arrivoPozzetto = game.time; }
  return p.alPozzetto ? null : { x: P.x, z: P.z, sprint: dist(p, P) > 2.5 };      // ci va di corsa: prima arriva, prima può rientrare
}
export function recuperoPozzetto(p, dt) { if (p.alPozzetto) p.stamina = Math.min(1, p.stamina + dt * POZZETTO.recupero); }
// al rientro: palla nostra → controfuga lungo il lato lontano; palla avversaria vicino alla nostra porta → su chi ha la palla
export function sceltaRientro(p) {
  const t = p.team, h = ball.holder;
  if (h && h.team === t) p.rientro = { modo: 'fuga', fino: game.time + POZZETTO.sceltaDurata };
  else if (h && h.team !== t && Math.hypot(ownGoalX(t) - h.x, h.z) < POZZETTO.vicinoPorta) p.rientro = { modo: 'difesa', fino: game.time + POZZETTO.sceltaDurata };
  else p.rientro = { modo: game.possTeam === t ? 'fuga' : 'difesa', fino: game.time + POZZETTO.sceltaDurata * 0.6 };
}
// obiettivo nei primi secondi dopo il rientro (il computer; il giocatore umano decide da sé)
export function obiettivoRientro(p) {
  const R = p.rientro; if (!R || game.time > R.fino || (p === ctrl && p.team.human && !game.autoplay) || ball.holder === p) return null;
  const t = p.team, h = ball.holder;
  if (R.modo === 'fuga') return { x: goalX(t) - t.dir * 4.5, z: -HW + 3, sprint: true };
  if (h && h.team !== t) { const gx = ownGoalX(t), dx = gx - h.x, dz = -h.z, l = Math.hypot(dx, dz) || 1; return { x: h.x + dx / l * 0.9, z: h.z + dz / l * 0.9, sprint: true }; }
  return null;
}
