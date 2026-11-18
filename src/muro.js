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
// UOMO IN MENO (v0.56, Ale: «chi difende sul 3 alza il braccio destro anziché il sinistro; difende il suo palo con una posizione a
// specchio rispetto all'avversario»): in inferiorità chi esce sul tiratore alza il braccio A SPECCHIO del suo braccio di tiro
// (destro → braccio sinistro del difensore, mancino → destro), proprio davanti alla palla; l'incrociato lo copre il centrale
// tra i pali (braccioVerso con il palo lontano). In parità resta la regola v0.30 (braccio dalla parte del palo coperto).
export function braccioMuro(d,h){
  if(d.team&&d.team.players&&d.team.players.some(q=>q.excluded)) return h.mano==='S'?'D':'S';
  return braccioVerso(d,paloCoperto(h),h.team.dir||1);
}
// braccio dalla parte del palo con z di segno «palo», per il difensore d girato come (fx, fz); dirAtt = verso dell'attacco
export function braccioVerso(d,palo,dirAtt=1){
  const destraZ=d.fx||-dirAtt;      // il lato destro di chi guarda verso (fx,fz) è (-fz, fx): qui conta solo la z
  const lato=Math.abs(destraZ)>0.2?Math.sign(destraZ):-dirAtt;
  return lato===palo?'D':'S';
}
