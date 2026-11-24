// MANO NELLA FINTA (v0.87, Ale: «se la palla sta dietro la testa il palmo della mano deve essere rivolto verso l'alto (come se il
// giocatore tenesse la palla su un vassoio). Se la finta supera la testa e va in avanti l'unico modo per tenere la palla è ruotare il
// polso e mettere il palmo della mano rivolto verso il basso con la palla attaccata»).
// Il palmo segue la mano rispetto alla testa, nel verso della finta (unità del corpo, × 1,10 = metri):
//   - mano dietro la testa di «dietro» o più: palmo al cielo («vassoio») e polso piegato all'indietro;
//   - mano sopra la testa: palmo in avanti, dietro la palla (come la palla tenuta della v0.55, PALMO_PALLA in pose.js);
//   - mano davanti alla testa di «davanti» o più: polso girato, palmo in giù e palla attaccata sotto la mano.
// In mezzo il polso gira con continuità. Solo disegno: la palla disegnata sta sempre sul lato del palmo (pose.js, p.ballVistaW);
// la palla del gioco (p.ballW) e i tempi della finta non cambiano.
//   vassoio, avanti, giu: direzione del palmo nel sistema del giocatore (x avanti, y su, z verso il braccio che tiene la palla);
//   polsoVassoio, polsoAvanti, polsoGiu: piega del polso (rad; negativo = all'indietro, positivo = verso il palmo);
//   ritorno: parte del ritorno della finta (a.recupero) in cui il braccio rifà la strada fino alla carica;
//   plask: quanto la tenuta del giocatore (posa Plask, tiro-plask-vista.js) si corregge verso questo palmo.
export const MANO_FINTA={ dietro:0.16, davanti:0.12, vassoio:[0.2,1,0.05], avanti:[0.85,0.5,0.1], giu:[0.3,-1,0.05],
  polsoVassoio:-0.75, polsoAvanti:-0.28, polsoGiu:0.45, ritorno:0.8, plask:0.8 };
const clamp=x=>Math.max(0,Math.min(1,x)), ease=x=>{ x=clamp(x); return x*x*(3-2*x); };
const mix=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
// u = quanto la mano sta davanti (+) o dietro (−) alla testa, nel verso della finta (unità del corpo)
export function palmoFinta(u){
  const M=MANO_FINTA, dietro=ease(-u/M.dietro), davanti=ease(u/M.davanti);
  return { n:mix(mix(M.avanti,M.vassoio,dietro),M.giu,davanti),
    polso:(M.polsoAvanti*(1-dietro)+M.polsoVassoio*dietro)*(1-davanti)+M.polsoGiu*davanti, dietro, davanti };
}
