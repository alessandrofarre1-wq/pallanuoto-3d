// Un solo gesto per touch, tastiera e controller. Nessuna finestra da inseguire.
export const TIRO_COMANDO=Object.freeze({
  tocco:.16, polso:.36, carica:.9, primaFinta:.45, pausaFinta:.75
});
export function prontezzaTiro(p){
  return p?.charging?Math.max(0,Math.min(1,(p.chargeT||0)/TIRO_COMANDO.carica)):0;
}
