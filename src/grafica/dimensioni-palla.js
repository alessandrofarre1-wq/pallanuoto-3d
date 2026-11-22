// Palla in metri regolamentari, come campo e porta. La proporzione con gli
// atleti viene dalla loro altezza corretta, non da una sfera ingrandita.
import { P } from '../fisica-palla/parametri.js';

export const raggioVistaPalla=P.raggioUrti;
// Centro della sfera quando il volume immerso sostiene la massa della palla.
// Stessa relazione di Archimede del motore, senza importare o inizializzare Rapier.
export const quotaGalleggiamentoFisica=(()=>{
  const r=P.raggioUrti;
  let lo=0,hi=2*r;
  for(let i=0;i<50;i++){
    const h=(lo+hi)/2,volume=Math.PI*h*h*(3*r-h)/3;
    if(P.densitaAcqua*volume<P.massa)lo=h;else hi=h;
  }
  return r-(lo+hi)/2;
})();
export const quotaGalleggiamentoVistaPalla=quotaGalleggiamentoFisica;
