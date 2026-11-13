// ================= MURO DEL DIFENSORE (sezione 3, v0.30) =================
// Il difensore va incontro al tiratore e alza UN braccio per coprire un palo; il portiere prende l'altro.
// Quale palo: tiratore spostato di lato (oltre 1,2 m dal centro) = primo palo, quello dalla sua parte;
// tiratore centrale = palo dalla parte del suo braccio di tiro (un destro tira dalla sua destra, un mancino dalla sinistra).
// Quale braccio: quello dalla parte del palo da coprire. Visto dal tiratore: braccio sinistro del difensore = palo destro,
// braccio destro = palo sinistro (il difensore lo guarda in faccia, quindi destra e sinistra si scambiano).
// Funzioni pure: nessun numero casuale, la stessa risposta per il gioco e per il disegno.
export const LATERALE = 1.2;      // metri dal centro oltre i quali il tiratore è "di lato"
// palo coperto (segno della z del mondo: +1 o -1) contro il tiratore h
export function paloCoperto(h){
  if(Math.abs(h.z)>LATERALE) return Math.sign(h.z);
  const dir=h.team.dir||1;      // chi attacca verso +x ha la destra verso +z
  return (h.mano==='S'?-1:1)*dir;
}
// braccio da alzare: 'D' (destro) o 'S' (sinistro), secondo come il difensore d è girato
export function braccioMuro(d,h){
  const palo=paloCoperto(h), fx=d.fx||-(h.team.dir||1);
  const destraZ=fx;      // il lato destro di chi guarda verso (fx,fz) è (-fz, fx): qui conta solo la z
  const lato=Math.abs(destraZ)>0.2?Math.sign(destraZ):-(h.team.dir||1);
  return lato===palo?'D':'S';
}
