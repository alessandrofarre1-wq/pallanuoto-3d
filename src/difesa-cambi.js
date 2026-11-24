// Copertura temporanea del cambio volante avversario. La marcatura resta assegnata allo stesso oggetto p:
// la panchina ne cambia scheda/numero dopo il cinque, senza cambiare indice o uid.
import { clamp, dist } from './costanti.js';
import { ball, ctrl, game, goalX, ownGoalX } from './stato.js';
import { PANCHINA } from './taratura.js';      // numeri del bilanciamento

const rientri=new WeakMap();
export function resetEntrantiCambio(t){ for(const p of t.players) rientri.delete(p); }
// Solo il cambio volante ha un tragitto di ritorno dal bordo; cambi liberi e pozzetto conservano i loro compiti.
// v0.82 (Ale: «niente passaggi a un giocatore appena entrato a 20 m»): per PANCHINA.appena secondi dopo il cinque il sostituto non è
// un appoggio finché non arriva a PANCHINA.zona metri dalla porta d'attacco
export function sostitutoLontano(p){
  const r=rientri.get(p);
  return !!r&&r.scheda===p.scheda&&game.time>=r.inizio&&game.time-r.inizio<PANCHINA.appena&&(goalX(p.team)-p.x)*p.team.dir>PANCHINA.zona;
}
export function registraEntranteCambio(p){
  rientri.set(p,{scheda:p.scheda,inizio:game.time});
}
function indisponibile(a){
  if(!a||a.isGK||a.excluded||game.possTeam!==a.team)return false;
  // Se riceve palla mentre sta ancora uscendo, torna una minaccia da difendere.
  if(a.uscendo)return ball.holder!==a;
  const r=rientri.get(a);if(!r)return false;
  // Il sostituto torna pericoloso quando arriva davvero nella metà d'attacco, a 10,5 m dalla porta.
  // Conta la posizione reale: lagX/Z continua a seguire l'uomo al bordo e non decide quando far uscire il difensore.
  if(r.scheda!==a.scheda||game.time<r.inizio||(goalX(a.team)-a.x)*a.team.dir<=10.5){rientri.delete(a);return false;}
  return true;
}

export function coperturaCambio(p,att,boa,h,uomoDi){
  if(p===ctrl||p.isGK||p.excluded||p.uscendo||!indisponibile(att))return null;
  const t=p.team,gx=ownGoalX(t),centro=boa&&!boa.excluded&&!boa.uscendo&&Math.abs(gx-boa.x)<5.5;
  const riferimento=h&&h.team!==t?h:ball;
  let x,z;
  if(centro){
    // Una spalla sulla linea di servizio al centro, lasciando al marcatore del boa il corpo a corpo.
    const dx=riferimento.x-boa.x,dz=riferimento.z-boa.z,l=Math.hypot(dx,dz)||1;
    x=boa.x+dx/l*1.55;z=boa.z+dz/l*1.55;
    if(l<.1){x=boa.x+t.dir*.5;z=boa.z+Math.sign(att.z||riferimento.z||1)*1.4;}
  }else{
    // Se il boa esce a sua volta, chiudere il corridoio palla-porta: nessun posto fisso sul bordo dei cambi.
    x=gx+(riferimento.x-gx)*.52;z=riferimento.z*.5;
  }
  let profondita=clamp((x-gx)*t.dir,2.2,7.8);z=clamp(z,-6.5,6.5);
  const base={x:gx+t.dir*profondita,z};
  const liberi=t.players.filter(q=>q!==ctrl&&!q.isGK&&!q.excluded&&!q.uscendo&&indisponibile(uomoDi(q)))
    .sort((a,b)=>dist(a,base)-dist(b,base)||a.i-b.i);
  const ordine=liberi.indexOf(p);
  if(ordine>0){
    // Due cambi ravvicinati: il più vicino aiuta sul boa, il secondo copre il lato debole, senza sovrapporsi.
    const lato=-Math.sign(riferimento.z||z||1);
    z=clamp(z+lato*(1.8+1.5*(ordine-1)),-6.5,6.5);profondita=Math.min(7.8,profondita+.8);
  }
  const target={x:gx+t.dir*profondita,z,sprint:false};
  return {target};
}
