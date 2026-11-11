// ================= IA =================
import { DEF_DOWN, FORM, FORM_UP, GW, HW, KICK_Z, MARK, clamp, dist, rnd } from './costanti.js';
import { doFake, timeout } from './regole.js';
import { allPlayers, ball, fight, game, goalX, other, ownGoalX } from './stato.js';
import { bestPassTarget, doPass, doShoot, laneClear, shotKind, startAct } from './tiri.js';
export function manUp(t){ return other(t).players.some(q=>q.excluded); }
export function startCut(p){
  if(p.isGK||p.excluded||ball.holder===p) return;
  const t=p.team, side=Math.abs(p.z)<0.5?(rnd()<0.5?1:-1):Math.sign(p.z);
  p.cut={t0:game.time,phase:0,x:goalX(t)-t.dir*2.6,z:side*1.7}; p.cutT=game.time;
}
export function attackTarget(p){
  const t=p.team, gx=goalX(t);
  if(p.cut){
    const c=p.cut;
    if(c.phase===0 && (Math.hypot(c.x-p.x,c.z-p.z)<0.7 || game.time-c.t0>4.5)){ c.phase=1; c.t1=game.time; }
    if(c.phase===1 && game.time-c.t1>1.6) p.cut=null;
    else return {x:c.x,z:c.z,sprint:c.phase===0};
  }
  let f;
  if(manUp(t)) f=FORM_UP[p.i];
  else if(p.i===1 && fight.active && fight.boa===p){ f=[FORM[1][0]+Math.max(0,-fight.v)*1.3, FORM[1][1]]; }
  else {
    f=[FORM[p.i][0],FORM[p.i][1]];
    if(t.cross&&(p.i===4||p.i===5)) f[1]=-f[1];
    if(t.atkPlay===3){ if(p.i===1) f[1]=clamp(ball.z*t.dir*0.25,-1.2,1.2); else { f[0]*=1.08; f[1]*=1.1; } }
  }
  // la squadra sale insieme alla palla: nessuno può stare troppo avanti rispetto a chi la porta
  // ognuno sale lungo la propria corsia, scaglionato per ruolo (boa e ali avanti, mezzi a metà, punto in copertura)
  const ballD=Math.abs(gx-ball.x), lead=[0,14,12,12,8,8,4][p.i];
  let f0=f[0], fz=f[1];
  if(ballD-lead>f0) f0=ballD-lead;
  return { x:gx-t.dir*f0, z:clamp(fz*t.dir+Math.sin(game.time*0.6+p.uid)*0.35,-HW+0.5,HW-0.5), sprint:t.atkPlay===2&&(p.i===4||p.i===5) };
}
export function markTarget(p){
  const t=p.team, ogx=ownGoalX(t);
  if(t.players.some(q=>q.excluded)){            // uomo in meno: zona davanti alla porta
    const defs=t.players.filter(q=>!q.excluded&&!q.isGK), s=DEF_DOWN[Math.min(defs.indexOf(p),DEF_DOWN.length-1)];
    return { x:ogx+t.dir*s[0], z:clamp(s[1]+ball.z*0.25,-HW+0.5,HW-0.5) };
  }
  if(t.doubleP===p && game.time<t.doubleUntil && ball.holder && ball.holder.team!==t) return {x:ball.holder.x,z:ball.holder.z,sprint:true};
  const att=other(t).players[MARK[p.i]];
  if(!att||att.excluded) return { x:ogx+t.dir*3.5, z:clamp(ball.z*0.4,-2,2) };
  if(MARK[p.i]===1 && Math.abs(ogx-att.x)<5){
    if(t.defPlay===2 && ball.holder!==att){   // pressing: anticipo sul centroboa, tra lui e la palla
      const bx=ball.x-att.x, bz=ball.z-att.z, bl=Math.hypot(bx,bz)||1;
      return { x:att.x+bx/bl*0.6, z:att.z+bz/bl*0.6 };
    }
    const gx=ogx-att.x, gz=-att.z, gl=Math.hypot(gx,gz)||1;  // a uomo e zona: alle spalle, a contatto
    return { x:att.x+gx/gl*0.55, z:att.z+gz/gl*0.55 };
  }
  // il difensore reagisce con un piccolo ritardo ai movimenti del suo uomo
  const ax=p.lagX, az=p.lagZ, dx=ogx-ax, dz=-az, l=Math.hypot(dx,dz)||1;
  let gap = ball.holder===att ? 0.85 : 1.0;
  if(t.defPlay===1 && p.i!==6) gap = ball.holder===att ? 1.3 : Math.min(2.6,l*0.45);   // zona: ci si stacca verso il centroboa
  if(t.defPlay===2) gap = 0.8;                                                       // pressing
  return { x:ax+dx/l*gap, z:az+dz/l*gap };
}
export function blockR(p){ return ball.kind==='shot' && (p.team.defPlay===1 || p.team.players.some(q=>q.excluded)) ? 0.85 : 0.6; }
// Portiere. L'80% del lavoro è la posizione (docs/tecnica.md): sta sulla linea tra la palla e il centro della porta e la segue
// spostandosi DURANTE i passaggi, non quando sono già arrivati. Quanto in fretta lo capisce e quanto velocemente si sposta
// dipendono dalla statistica Posizione: sulle diagonali lunghe (da 2 a 5, da 4 a 1) un portiere scarso resta indietro.
export const pos01 = gk => (gk.s.pos-40)/59, rif01 = gk => (gk.s.rif-40)/59;
// dove dovrebbe stare il portiere se la palla fosse in (bx,bz): sulla linea palla–centro porta, a 70 cm dalla linea di porta
export function postoPortiere(t,bx,bz){
  const ogx=ownGoalX(t), d=Math.max(1.2,Math.abs(bx-ogx));
  return clamp(bz*0.7/d*1.6,-GW*0.8,GW*0.8);
}
// c'è un difensore a fare muro davanti a chi ha la palla? (allora lui copre il primo palo e il portiere l'angolo lungo)
export function muroSu(h){
  const t=other(h.team), ogx=ownGoalX(t);
  for(const q of t.players){ if(q.isGK||q.excluded) continue;
    if(dist(q,h)<1.7 && Math.abs(q.x-ogx)<Math.abs(h.x-ogx)+0.3) return q; }
  return null;
}
export function gkTarget(p){
  const t=p.team, ogx=ownGoalX(t);
  // tiro in arrivo: ormai conta il tuffo (lo gestisce partita.js con la statistica Riflessi)
  if(ball.state==='flight'&&ball.kind==='shot'&&ball.shooter.team!==t&&ball.flightT>0.08) return { x:ogx+t.dir*0.7, z:clamp(ball.crossZ,-GW-0.2,GW+0.2), gk:true, tuffo:true };
  // la palla "vista" dal portiere: durante un passaggio guarda già dove arriverà, ma lo capisce con un ritardo
  let bx=ball.x, bz=ball.z;
  if(ball.state==='flight'&&ball.kind==='pass'&&ball.target){
    const ritardo=0.42-0.34*pos01(p);                         // da 0,42 s (Posizione 40) a 0,08 s (99)
    if(ball.flightT>ritardo){ bx=ball.tx; bz=ball.tz; }
  }
  let z=postoPortiere(t,bx,bz);
  const h=ball.holder;
  if(h&&h.team!==t&&Math.abs(h.x-ogx)<9){ const m=muroSu(h); if(m) z+=(h.z>=0?-1:1)*0.28; }      // con il muro sul primo palo, mezzo passo verso l'angolo lungo
  return { x:ogx+t.dir*0.7, z:clamp(z,-GW*0.85,GW*0.85), gk:true };
}
// steering behaviors: arrive + separation dai compagni + aggiramento degli avversari sulla traiettoria
export function steer(p,ux,uz,d){
  let ax=ux, az=uz;
  for(const o of allPlayers){
    if(o===p||o.excluded) continue;
    const ox=o.x-p.x, oz=o.z-p.z, od=Math.hypot(ox,oz);
    if(od>1.6||od<0.001) continue;
    if(o.team===p.team){ const w=(1.6-od)/1.6*0.5; ax-=ox/od*w; az-=oz/od*w; }
    else if(od<d-0.4 && o!==ball.holder){
      const fwd=(ox*ux+oz*uz)/od;
      if(fwd>0.45){ const side=(ux*oz-uz*ox)>0?1:-1, w=(1.6-od)/1.6*1.3*fwd; ax+=uz*side*w; az-=ux*side*w; }
    }
  }
  const l=Math.hypot(ax,az)||1;
  return [ax/l,az/l];
}
export function closestTo(team,pt,skipGK=true){
  let best=null,bd=1e9;
  for(const p of team.players){ if(p.excluded||(skipGK&&p.isGK)) continue; const d=dist(p,pt); if(d<bd){bd=d;best=p;} }
  return best;
}
export function aiTarget(p){
  if(p.isGK){
    // palla vagante vicino alla porta: il portiere prova ad andarla a prendere
    if(ball.state==='free' && Math.hypot(ball.x-ownGoalX(p.team),ball.z)<6.5){
      let od=1e9; for(const o of other(p.team).players){ if(!o.excluded) od=Math.min(od,dist(o,ball)); }
      if(dist(p,ball)<od+1.2) return {x:ball.x,z:ball.z,sprint:true};
    }
    return gkTarget(p);
  }
  const t=p.team;
  if(ball.state==='free'){
    if(closestTo(t,ball)===p){ const tt=Math.min(0.7,dist(p,ball)/2.5)*0.6; return {x:ball.x+ball.vx*tt,z:ball.z+ball.vz*tt,sprint:true}; }   // pursuit: si punta dove la palla sta andando
  }
  if(ball.state==='flight'&&ball.kind==='pass'&&ball.target===p) return {x:ball.tx,z:ball.tz,sprint:true};
  const poss = game.possTeam || (ball.lastTeam);
  if(poss===t) return attackTarget(p);
  if(poss===other(t)) return markTarget(p);
  // palla contesa (sprint iniziale): solo il più vicino va sulla palla, gli altri risalgono la propria corsia fino alla posizione di ruolo
  return {x:-t.dir*FORM[p.i][0]*0.8, z:KICK_Z[p.i]*t.dir, sprint:true};   // palla contesa: ci si ferma a metà campo
}
export function aiShoot(p,power,lob){ startAct(p, lob?'lob':shotKind(p), lob?0.1:0.12+rnd()*0.1, ()=>doShoot(p,power,lob,null)); }
export function aiPass(p,m){ startAct(p,'pass',0.08,()=>doPass(p,m),[m.x,m.z]); }
export function aiCarrier(p,dt){
  const t=p.team, gx=goalX(t);
  if(p.isGK){
    p.target={x:p.x,z:p.z};
    if(p.act) return;
    if(ball.holdTime>1.0+rnd()*0.05){ const m=bestPassTarget(p); if(m) aiPass(p,m); }
    return;
  }
  if(fight.active&&fight.boa===p){ p.target={x:p.x,z:p.z}; return; }     // il centroboa in lotta decide in boaHold
  const slot=attackTarget(p);
  const dGoal=Math.hypot(gx-p.x,p.z);
  p.target={x:slot.x+t.dir*0.8, z:slot.z, sprint: Math.abs(p.x-slot.x)>6};
  if(p.act) return;
  p.decideT-=dt;
  if(p.decideT>0) return;
  p.decideT=0.3+rnd()*0.35;
  const ft=p.freeThrow&&Math.abs(gx-p.x)<6;       // tiro libero dentro i 6 metri: non si può tirare direttamente
  if(t.timeouts>0 && !t.human && rnd()<0.25){ let st=0,n=0; for(const q of t.players){ if(!q.isGK&&!q.excluded){ st+=q.stamina; n++; } } if(n&&st/n<0.3&&timeout(t)) return; }
  if(p.shootNext){ p.shootNext=false; if(dGoal<9&&!ft){ aiShoot(p,0.6+rnd()*0.4,false); return; } }
  const gk=other(t).players[0];
  const aim=-Math.sign(gk.z||(rnd()-0.5))*(0.9+rnd()*0.4);
  const lane=laneClear(p,gx,aim,t,0.7);
  let press=99; for(const o of other(t).players){ if(!o.excluded&&!o.isGK) press=Math.min(press,dist(o,p)); }
  if(dGoal<8.5&&!ft){
    const want = game.shot<4 ? 0.9 : game.shot<8 ? 0.45 : (lane?0.25+0.45*(1-dGoal/8.5):0.12)*(press>1.5?1.35:press<0.9?0.6:1);
    if(rnd()<want){
      if(!p.fakeUsed && game.shot>5 && rnd()<0.18){ p.fakeUsed=true; p.shootNext=true; p.decideT=0.5; startAct(p,'fake',0.12,()=>doFake(p)); return; }
      const lob = dGoal>5 && rnd()<0.12; aiShoot(p,0.55+rnd()*0.45,lob); return;
    }
  }
  if(game.shot<2 && dGoal<13 && !ft){ aiShoot(p,0.9,false); return; }
  if(p.freeThrow || (press<1.3&&rnd()<0.55) || ball.holdTime>2.5+rnd()*2.5){
    const m=bestPassTarget(p); if(m){ aiPass(p,m); return; }
  }
}
