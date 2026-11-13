// ================= PANCHINA E CAMBI VOLANTI (sezione 5, v0.32) =================
// Rosa di 13: 7 in acqua e 6 riserve. Ogni giocatore della rosa ha la sua stamina: chi è in panchina recupera, chi entra porta
// in acqua quella che ha. Regole World Aquatics (con le modifiche di giugno 2025):
// - il cambio volante si fa senza fermare il gioco: chi esce raggiunge la zona dei cambi della propria squadra (sul bordo,
//   nella propria metà) e il sostituto entra dopo il «cinque»; nei pozzetti (rientro degli espulsi) il cinque non serve più;
// - durante i time-out, tra i tempi e dopo un gol i cambi sono liberi (qui: immediati).
// Lato della vasca: il tavolo della giuria è sul lato vicino alla telecamera (z positivo); panchine, zona dei cambi e pozzetti
// sono sul lato lontano (z negativo). Si disegnano in 3D solo i due giocatori del cambio, non le riserve sedute.
import { HW, dist } from './costanti.js';
import { annuncia } from './cronaca.js';
import { colora, riservaPer, vesti } from './giocatori.js';
import { makePlayerMesh } from './grafica/modello.js';
import { valoriMotore } from './dati/rose.js';
import { ball, ctrl, game, ownGoalX, setCtrl, teams } from './stato.js';
export const PANCHINA = { recupero: 0.025, stanco: 0.42, fresco: 0.7, controllo: 2, pausaComputer: 55, stancoComputer: 0.34, velBordo: 0.9, cinque: 0.5, distZona: 3.2 };
// punti della propria metà (lato lontano dalla telecamera): A = dietro la linea di porta, dove compare chi entra;
// Z = zona dei cambi lungo il bordo
export const puntoIngresso = t => ({ x: ownGoalX(t) - t.dir * 0.4, z: -HW + 0.35 });
export const zonaCambi = t => ({ x: ownGoalX(t) + t.dir * PANCHINA.distZona, z: -HW + 0.45 });

// chi entra o esce: un corpo in più per squadra, visibile solo durante il cambio
const comparse = teams.map((t, k) => {
  const m = makePlayerMesh(20 + k, t); m.g.visible = false;
  return { uid: 900 + k, team: t, i: 9, isGK: false, mesh: m, x: 0, z: 0, vx: 0, vz: 0, fx: 1, fz: 0, oriz: 0, stamina: 1, phase: 0,
    act: null, excluded: false, pf: 0, mano: 'D', num: 0, s: null, st: null, comparsa: true, visibile: false };
});
export const comparseVisibili = () => comparse.filter(c => c.visibile);
function mostra(c, g, punto) {
  c.num = g.num; c.name = g.nome; c.mano = g.mano; c.s = g.s; c.st = valoriMotore(g.s); c.x = punto.x; c.z = punto.z; c.vx = c.vz = 0;
  colora(c.mesh, c.team, false, g.num); c.visibile = true; c.mesh.g.visible = true; c.J = null; c.palmi = null; c.spina = null;
}
function nascondi(c) { c.visibile = false; c.mesh.g.visible = false; }
// si sposta lungo il bordo in verticale, tenendosi alla parete (niente tuffo)
function vaVerso(c, punto, dt) {
  const dx = punto.x - c.x, dz = punto.z - c.z, d = Math.hypot(dx, dz);
  if (d < 0.05) { c.vx = c.vz = 0; return true; }
  const v = Math.min(PANCHINA.velBordo, d / Math.max(dt, 1e-3));
  c.vx = dx / d * v; c.vz = dz / d * v; c.x += c.vx * dt; c.z += c.vz * dt; c.fx = dx / d; c.fz = dz / d;
  return d < 0.15;
}

// la riserva più adatta per far rifiatare p: stesso ruolo se possibile, la più fresca
export function suggerimento(p, escluse) {
  if (p.isGK || p.excluded || !p.scheda) return null;
  const g = riservaPer(p, escluse);
  return g && (g.stamina ?? 1) >= PANCHINA.fresco && p.stamina < PANCHINA.stanco + 0.08 ? g : null;
}
// chiede un cambio volante (per la squadra del giocatore: dalla schermata Panchina in pausa)
export function chiediCambio(t, p, g) {
  if (!p || !g || g.inAcqua || g.fuori || (g.ruolo === 0) !== p.isGK) return false;
  t.coda = (t.coda || []).filter(x => x.esce !== p && x.entra !== g);
  t.coda.push({ esce: p, entra: g });
  return true;
}
export function annullaRichiesta(t, p) { t.coda = (t.coda || []).filter(x => x.esce !== p); }
export function annullaCambio(t) {
  const C = t.cambio; if (!C) return;
  C.esce.uscendo = false; nascondi(comparse[t.idx]); t.cambio = null;
}
// scambio vero e proprio: chi esce lascia la sua stamina e i suoi falli alla scheda, chi entra prende quelli della sua
function scambia(t, p, g) {
  const vecchio = p.scheda;
  vecchio.stamina = p.stamina; vecchio.pf = p.pf;
  vesti(p, g); p.stamina = g.stamina ?? 1; p.pf = g.pf || 0; p.uscendo = false; p.cut = null; p.act = null; p.charging = false;
  annuncia('info', 'Cambio', { squadra: t, dettaglio: `entra #${g.num} ${g.nome}, esce #${vecchio.num}`, durata: 1.6 });
  return vecchio;
}
function inizia(t, p, g, liberi) {
  if (liberi) { scambia(t, p, g); return; }      // dopo un gol, nel time-out e tra i tempi il cambio è libero e immediato
  t.cambio = { esce: p, entra: g, fase: 'esce', t0: game.time };
  p.uscendo = true;
  if (ctrl === p) { const altro = t.players.filter(q => q !== p && !q.excluded && !q.isGK && !q.uscendo).sort((a, b) => dist(a, ball) - dist(b, ball))[0]; if (altro) setCtrl(altro); }
  mostra(comparse[t.idx], g, puntoIngresso(t));
}
// il computer cambia chi è stanco quando è lontano dalla palla e non la sta giocando
function cambiDelComputer(t) {
  if (t.cambio || (t.coda && t.coda.length) || game.time < (t.prossimoControllo || 0)) return;
  t.prossimoControllo = game.time + PANCHINA.controllo;
  let best = null;
  for (const p of t.players) {
    if (p.isGK || p.excluded || ball.holder === p || dist(p, ball) < 5 || p.stamina > PANCHINA.stancoComputer) continue;
    const g = suggerimento(p); if (!g) continue;
    if (!best || p.stamina < best.p.stamina) best = { p, g };
  }
  // un cambio alla volta, con almeno PANCHINA.pausaComputer secondi tra uno e l'altro (come una panchina vera)
  if (best) { t.coda = [{ esce: best.p, entra: best.g }]; t.prossimoControllo = game.time + PANCHINA.pausaComputer; }
}
// a ogni fotogramma di gioco
export function aggiornaPanchina(dt, liberi = false) {
  for (const t of teams) {
    if (!t.rosa) continue;
    for (const g of t.rosa) if (!g.inAcqua) g.stamina = Math.min(1, (g.stamina ?? 1) + dt * PANCHINA.recupero);
    if (!t.human || game.autoplay) cambiDelComputer(t);
    if (!t.cambio && t.coda && t.coda.length) {
      const r = t.coda.shift();
      if (t.players.includes(r.esce) && !r.esce.excluded && !r.entra.inAcqua && !r.entra.fuori) inizia(t, r.esce, r.entra, liberi);
    }
    const C = t.cambio; if (!C) continue;
    const c = comparse[t.idx], p = C.esce, Z = zonaCambi(t);
    if (p.excluded) { annullaCambio(t); continue; }
    if (liberi && C.fase === 'esce') { scambia(t, p, C.entra); annullaCambio(t); continue; }
    if (C.fase === 'esce') {
      const pronto = vaVerso(c, { x: Z.x - t.dir * 0.5, z: Z.z }, dt);
      if (pronto && ball.holder !== p && dist(p, { x: Z.x, z: Z.z }) < 0.9) { C.fase = 'cinque'; C.t0 = game.time; p.cinqueUntil = c.cinqueUntil = game.time + PANCHINA.cinque; c.fx = t.dir; c.fz = 0; }
    } else if (C.fase === 'cinque') {
      if (game.time - C.t0 >= PANCHINA.cinque) {
        const vecchio = scambia(t, p, C.entra);
        mostra(c, vecchio, { x: c.x, z: c.z }); c.x = p.x; c.z = p.z;      // chi esce prende il posto: ora la comparsa è lui
        p.x = Z.x - t.dir * 0.5; p.z = Z.z + 0.3;
        C.fase = 'uscita';
      }
    } else if (C.fase === 'uscita') {
      if (vaVerso(c, puntoIngresso(t), dt)) { nascondi(c); t.cambio = null; }
    }
  }
}
// dove deve andare chi sta uscendo (al posto del suo compito in campo)
export function obiettivoUscita(p) { const Z = zonaCambi(p.team); return { x: Z.x, z: Z.z, sprint: true }; }
