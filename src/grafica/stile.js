// Stile grafico: "realistica" (predefinita) oppure "cartoon". Si cambia dal menu (anche in pausa, a partita in corso) e la scelta
// si ricorda. Cambia SOLO come si disegna: stessi scheletri, stessi movimenti, stesse regole; qui non si usa mai il caso del gioco,
// così le partite simulate danno gli stessi risultati nei due stili.
let stile='realistica';
try{ if(localStorage.getItem('pallanuoto-stile')==='cartoon') stile='cartoon'; }catch(e){}
const ascoltatori=[];
export const cartoon=()=>stile==='cartoon';
export const stileAttuale=()=>stile;
// f(cartoon) viene chiamata subito e poi a ogni cambio di stile
export function alCambioStile(f){ ascoltatori.push(f); f(cartoon()); }
export function setStile(v){
  stile=v==='cartoon'?'cartoon':'realistica';
  try{ localStorage.setItem('pallanuoto-stile',stile); }catch(e){}
  for(const f of ascoltatori) f(cartoon());
}
