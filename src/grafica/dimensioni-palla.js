// Il disegno usa il diametro regolamentare già usato dagli urti.
// BRV e VIS appartengono alla posa/alle quote storiche del gioco e non cambiano.
import { P } from '../fisica-palla/parametri.js';

export const raggioVistaPalla=P.raggioUrti;
// Centro della sfera quando il volume immerso sostiene la massa della palla.
// Stessa relazione di Archimede del motore, senza importare o inizializzare Rapier.
export const quotaGalleggiamentoVistaPalla=(()=>{
  let lo=0,hi=2*raggioVistaPalla;
  for(let i=0;i<50;i++){
    const h=(lo+hi)/2,volume=Math.PI*h*h*(3*raggioVistaPalla-h)/3;
    if(P.densitaAcqua*volume<P.massa)lo=h;else hi=h;
  }
  return raggioVistaPalla-(lo+hi)/2;
})();
