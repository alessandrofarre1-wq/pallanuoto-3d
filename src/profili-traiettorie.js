// Mira nominale: nessun caso e nessuna modifica allo stato della partita.
// Rapier applica poi aria, rotazione, acqua e urti al lancio risultante.
import { TRAIETTORIE_TIRO as T } from './taratura.js';
import { P } from './fisica-palla/parametri.js';

export function profiloTraiettoria({x,y,z,gx,ay,az,velocita,lob=false,rimbalzo=false,gkX}){
  const dx=gx-x,d=Math.hypot(dx,az-z),dir=Math.sign(dx)||1;
  if(lob)return {tx:gx,ty:ay,tz:az,t:Math.min(T.palombellaMax,Math.max(T.palombellaMin,d/T.palombellaVelocita)),giri:P.giriPalombella,rimbalzo:false};
  // Si mira il primo contatto con l'acqua, non la linea di porta. Il raggio
  // della palla e la penetrazione iniziano la portanza già prima del bersaglio.
  // Da troppo vicino manca lo spazio per scendere senza un angolo eccessivo.
  const portiere=Number.isFinite(gkX)?gkX:gx-dir*T.portiereDallaPorta;
  const spazio=(portiere-x)*dir;
  if(rimbalzo&&Math.abs(dx)>=T.rimbalzoDistanzaMin&&spazio>T.rimbalzoPrimaPortiere+T.rimbalzoTrattoMin){
    const prima=Math.min(T.rimbalzoPrimaPortiere,Math.max(T.rimbalzoPrimaMin,(Math.abs(dx)-T.rimbalzoDistanzaMin)*T.rimbalzoPrimaPendenza+T.rimbalzoPrimaMin));
    const tx=portiere-dir*prima,u=(tx-x)/(dx||1),tz=z+(az-z)*u;
    return {tx,ty:ay,tz,t:Math.hypot(tx-x,tz-z)/velocita,giri:P.giriTiro,rimbalzo:true};
  }
  return {tx:gx,ty:rimbalzo?Math.max(P.raggioUrti,ay):ay,tz:az,t:d/velocita,giri:P.giriTiro,rimbalzo:false};
}
