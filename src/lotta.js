// ================= LOTTA AL CENTRO (centroboa contro il suo marcatore) =================
import { ARBITRO } from './costanti.js';
import { whistle } from './audio.js';
import { BRV, DIFF, MARK, dist, rnd } from './costanti.js';
import { spawnFoam } from './grafica/scena.js';
import { annuncia } from './cronaca.js';
import { aiPass, aiShoot, closestTo } from './ia.js';
import { inp } from './input.js';
import { ESPULSIONI, deadBall, exclude, foul, giveBall, tackle } from './regole.js';
import { ball, ctrl, fight, game, goalX, other } from './stato.js';
import { bestPassTarget } from './tiri.js';
import { avviaGirata, leggiCentro } from './centroboa.js';
export const boaDef = t => other(t).players.find(q=>MARK[q.i]===1);
export function fightOn(a,b){ return fight.active && ((fight.boa===a&&fight.def===b)||(fight.boa===b&&fight.def===a)); }
export function updateFight(dt){
  const at=game.possTeam;
  fight.active=false;
  fight.stato='libero';fight.ricevibile=false;fight.apertura=0;
  if(!at||game.penalty) return;
  // Il boa è un uomo al palo nel 4–2; quel compito non è il duello del 6 contro 6.
  if(other(at).players.some(p=>p.excluded)) return;
  const boa=at.players[1], def=boaDef(at);
  if(!boa||!def||boa.excluded||def.excluded||game.time<def.stunUntil) return;
  const gx=goalX(at);
  if(Math.abs(gx-boa.x)>5||Math.abs(boa.z)>3.2||dist(boa,def)>1.8) return;
  if(ball.holder&&ball.holder!==boa&&Math.abs(gx-ball.x)<1.5) return;
  if(fight.boa!==boa||fight.possT!==game.possT){ fight.holdT=0;fight.decT=0;fight.possT=game.possT; }
  fight.active=true; fight.boa=boa; fight.def=def;
  const lettura=leggiCentro(boa,def,ball.holder===boa?boa:ball);
  fight.v=lettura.vantaggio;fight.apertura=lettura.apertura;fight.ricevibile=lettura.ricevibile;
  fight.stato=boa.girata?'girata':boa.turnedUntil>game.time?'fronte':lettura.tipo;
  fight.lato=lettura.lato;
  boa.stamina=Math.max(0,boa.stamina-dt*(ctrl===boa&&inp.sprint?0.05:0.02));
  def.stamina=Math.max(0,def.stamina-dt*(ctrl===def&&inp.sprint?0.05:0.02));
  if(dist(boa,def)<1.12) boa.contactT=def.contactT=0.25;
  fight.foamT-=dt; if(fight.foamT<=0){ fight.foamT=0.18; spawnFoam((boa.x+def.x)/2+(rnd()-0.5)*0.6,(boa.z+def.z)/2+(rnd()-0.5)*0.6,0.18+rnd()*0.12,0.7); }
  if(ball.holder===boa) boaHold(boa,def,dt); else fight.holdT=0;
}
export function boaHold(b,d,dt){
  fight.holdT+=dt;
  if(b.act) return;
  if(b.girata) return;
  if(b.turnedUntil>game.time&&leggiCentro(b,d,b).spalle) b.turnedUntil=0;
  if(b.turnedUntil>game.time){
    // La finestra nasce dall'aggiramento fisico. Il rigore richiede un contrasto effettivo,
    // con le condizioni regolamentari comuni, non l'esito casuale della girata.
    if(d===ctrl&&d.aggrT>game.time&&dist(b,d)<1.15){ tackle(d,b,{fallo:true,origine:'centro'});return; }
    if(b!==ctrl&&!b.freeThrow) aiShoot(b,0.75,false);
    return;
  }
  const v=fight.v;
  // aggressività del marcatore: il giocatore la alza premendo CONTRASTO
  let ag = d===ctrl ? (d.aggrT>game.time?1.6:0.35) : (d.team.defPlay===2?1.05:0.85)*(0.85+0.3*DIFF());
  // Restano i contatti del duello; un semplice cambio di postura non assegna rigori.
  const sev=Math.pow(ARBITRO,1.5);
  const rE=Math.max(0.12,0.42+0.5*v)*ESPULSIONI.centro*ag*(1.5-(d.s.dis-40)/59)*sev, rF=0.5*ag, rO=0.14+0.3*Math.max(0,-v), rS=(0.08+0.25*Math.max(0,-v))*(d===ctrl&&d.aggrT>game.time?1.5:1);
  if(fight.holdT>0.35&&dist(b,d)<1.15){
    const r=rnd();
    if(r<rE*dt){ exclude(d,b,'guadagnata dal centroboa','centro'); return; }
    if(r<(rE+rF)*dt){ foul(d,b); return; }
    if(r<(rE+rF+rO)*dt){ offFoul(b); return; }
    if(r<(rE+rF+rO+rS)*dt){ giveBall(d); annuncia('possesso','Palla rubata al centroboa',{p:d}); return; }
  }
  if(b===ctrl) return;
  // centroboa gestito dal computer: girata, beduina o scarico
  fight.decT-=dt; if(fight.decT>0) return;
  fight.decT=0.45+rnd()*0.4;
  if(fight.holdT>0.6&&v>-0.1&&rnd()<0.35){ girata(b,d); return; }
  if(fight.holdT>0.8&&rnd()<0.15&&!b.freeThrow){ aiShoot(b,0.6+rnd()*0.3,false); return; }
  if(fight.holdT>1.8||(v<-0.4&&rnd()<0.5)){ const m=bestPassTarget(b); if(m) aiPass(b,m); }
}
export function girata(b,d){
  if(!avviaGirata(b,d)) return false;
  annuncia('info','Girata: cerca lo spazio',{p:b});
  return true;
}
export function offFoul(b){       // fallo in attacco del centroboa (spinta sul difensore): palla alla difesa
  whistle(0.22);
  const t=other(b.team);
  annuncia('fallo','Fallo in attacco',{p:b,dettaglio:'spinge il difensore'});
  ball.state='dead'; ball.holder=null; ball.vx=ball.vy=ball.vz=0; ball.y=BRV;
  deadBall(0.9,()=>{ const r=boaDef(b.team)||closestTo(t,b); giveBall(r); r.freeThrow=true; });
}
