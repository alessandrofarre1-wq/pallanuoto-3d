// ================= LOTTA AL CENTRO (centroboa contro il suo marcatore) =================
import { ARBITRO } from './costanti.js';
import { whistle } from './audio.js';
import { BRV, DIFF, MARK, clamp, dist, gauss, rnd } from './costanti.js';
import { spawnFoam } from './grafica/scena.js';
import { showMsg } from './hud.js';
import { aiPass, aiShoot, closestTo } from './ia.js';
import { inp } from './input.js';
import { deadBall, exclude, foul, giveBall, penalty } from './regole.js';
import { ball, ctrl, fight, game, goalX, other } from './stato.js';
import { bestPassTarget, doShoot, startAct } from './tiri.js';
export const boaDef = t => other(t).players.find(q=>MARK[q.i]===1);
export function fightOn(a,b){ return fight.active && ((fight.boa===a&&fight.def===b)||(fight.boa===b&&fight.def===a)); }
export function updateFight(dt){
  const at=game.possTeam;
  fight.active=false;
  if(!at||game.penalty) return;
  const boa=at.players[1], def=boaDef(at);
  if(!boa||!def||boa.excluded||def.excluded||game.time<def.stunUntil) return;
  const gx=goalX(at);
  if(Math.abs(gx-boa.x)>4.6||Math.abs(boa.z)>3.2||dist(boa,def)>1.35) return;
  if(ball.holder&&ball.holder!==boa&&Math.abs(gx-ball.x)<1.5) return;
  if(fight.boa!==boa){ fight.v=0; fight.holdT=0; }
  fight.active=true; fight.boa=boa; fight.def=def;
  // chi è più forte e più fresco guadagna posizione; il giocatore può spingere tenendo premuto SPRINT
  let push=(boa.st.frz*(0.5+0.5*boa.stamina)-def.st.frz*(0.5+0.5*def.stamina))*1.4 + gauss()*0.5 - fight.v*0.25;
  if(ctrl===boa&&inp.sprint) push+=1.1; else if(!boa.team.human&&rnd()<0.5) push+=0.4;
  if(ctrl===def&&inp.sprint) push-=1.1; else if(!def.team.human&&rnd()<0.5) push-=0.4*DIFF();
  fight.v=clamp(fight.v+push*dt*0.8,-1,1);
  boa.stamina=Math.max(0,boa.stamina-dt*(ctrl===boa&&inp.sprint?0.05:0.02));
  def.stamina=Math.max(0,def.stamina-dt*(ctrl===def&&inp.sprint?0.05:0.02));
  boa.contactT=def.contactT=0.25;
  fight.foamT-=dt; if(fight.foamT<=0){ fight.foamT=0.18; spawnFoam((boa.x+def.x)/2+(rnd()-0.5)*0.6,(boa.z+def.z)/2+(rnd()-0.5)*0.6,0.18+rnd()*0.12,0.7); }
  if(ball.holder===boa) boaHold(boa,def,dt); else fight.holdT=0;
}
export function boaHold(b,d,dt){
  fight.holdT+=dt;
  if(b.act) return;
  if(b.turnedUntil>game.time) return;
  const v=fight.v, gx=goalX(b.team);
  // aggressività del marcatore: il giocatore la alza premendo CONTRASTO
  let ag = d===ctrl ? (d.aggrT>game.time?1.6:0.35) : (d.team.defPlay===2?1.3:1)*(0.85+0.3*DIFF());
  // ai 2 metri l'arbitro pesa di più: un arbitro fiscale fischia molte più espulsioni (e rigori) al marcatore del centroboa
  const sev=Math.pow(ARBITRO,1.5), rP=(v>0.15?0.07:0.02)*sev*(1.5-(d.s.dis-40)/59);
  const rE=Math.max(0.12,0.42+0.5*v)*ag*(1.5-(d.s.dis-40)/59)*sev, rF=0.5*ag, rO=0.14+0.3*Math.max(0,-v), rS=(0.08+0.25*Math.max(0,-v))*(d===ctrl&&d.aggrT>game.time?1.5:1);
  if(fight.holdT>0.35){
    const r=rnd();
    if(r>1-rP*dt){ showMsg('<span style="font-size:26px">Centroboa affondato: rigore</span>',1.2); penalty(d,b); return; }
    if(r<rE*dt){ showMsg('<span style="font-size:26px">Espulsione guadagnata dal centroboa!</span>',1.2); exclude(d); return; }
    if(r<(rE+rF)*dt){ foul(d,b); return; }
    if(r<(rE+rF+rO)*dt){ offFoul(b); return; }
    if(r<(rE+rF+rO+rS)*dt){ giveBall(d); showMsg(`Palla rubata al centroboa! ${d.team.short} #${d.num}`,1); return; }
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
  const ok = rnd() < clamp(0.38+0.4*fight.v+0.3*(b.st.frz-d.st.frz),0.1,0.85);
  if(!ok){
    const r=rnd();
    if(r<0.35){ giveBall(d); showMsg('<span style="font-size:24px">Girata fallita: palla persa</span>',1); }
    else if(r<0.6) offFoul(b);
    else { fight.v=Math.max(-1,fight.v-0.3); showMsg('<span style="font-size:24px">Girata respinta</span>',0.7); }
    return;
  }
  b.turnedUntil=game.time+1.1;
  b.fx=Math.sign(goalX(b.team)-b.x); b.fz=0;
  // il marcatore che trattiene un centroboa ormai girato fronte porta commette fallo da rigore (art. 11.1)
  if(rnd()<0.45*(d===ctrl?(d.aggrT>game.time?1.4:0.6):1)){ showMsg('<span style="font-size:26px">Girata! Trattenuto: rigore</span>',1.2); penalty(d,b); return; }
  showMsg('<span style="font-size:26px">Girata! Fronte alla porta</span>',0.9);
  if(b!==ctrl) startAct(b,'shot',0.1,()=>doShoot(b,0.75+rnd()*0.25,false,null));
}
export function offFoul(b){       // fallo in attacco del centroboa (spinta sul difensore): palla alla difesa
  whistle(0.22);
  const t=other(b.team);
  showMsg(`Fallo in attacco<span style="font-size:20px;display:block">${b.team.short} #${b.num} spinge il difensore</span>`,1.1);
  ball.state='dead'; ball.holder=null; ball.vx=ball.vy=ball.vz=0; ball.y=BRV;
  deadBall(0.9,()=>{ const r=boaDef(b.team)||closestTo(t,b); giveBall(r); r.freeThrow=true; });
}
