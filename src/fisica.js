// ================= FISICA GIOCATORI =================
import { whistle } from './audio.js';
import { BRV, DIFF, DIFF_GK, G, GH, GW, HL, HW, clamp, dist, rnd } from './costanti.js';
import { showMsg } from './hud.js';
import { blockR } from './ia.js';
import { cornerThrow, giveBall, goalScored, goalThrow, sideOut } from './regole.js';
import { active, allPlayers, ball, game, goalX, other, ownGoalX, teams } from './stato.js';
import { shotKind } from './tiri.js';
export function movePlayer(p,dx,dz,sprint,dt){
  const mag=Math.hypot(dx,dz), moving=mag>0.05, swimming=mag>0.5;
  const hold=ball.holder===p, sp=Math.hypot(p.vx,p.vz);
  let base=1.45*(0.85+0.3*p.st.spd);                 // andatura normale ~1.6 m/s
  const canSprint=sprint&&p.stamina>0.05&&swimming;
  if(canSprint) base*=1.65;                          // sprint ~2.6 m/s da fresco
  p.sprinting=canSprint;
  base*=0.6+0.4*p.stamina;
  if(hold) base*=0.85;
  if(p.charging||(p.act&&!p.act.done&&p.act.kind!=='colonnello')) base*=0.35;
  // corpo verticale ↔ orizzontale: ci vuole circa mezzo secondo per distendersi o per tornare in piedi (bicicletta).
  // Finché il corpo non è disteso non si raggiunge la velocità piena.
  const vuoleNuoto=swimming && !p.charging && !(p.act&&!p.act.done&&p.act.kind!=='colonnello');
  p.oriz=clamp((p.oriz||0)+(vuoleNuoto?dt:-dt)/0.5,0,1);
  if(swimming) base*=0.62+0.38*p.oriz;
  if(game.time<p.stunUntil) base*=0.15;
  p.contactT=(p.contactT||0)-dt;
  if(p.contactT>0) base*=0.55;                       // corpo a corpo: si fatica ad avanzare
  const lunging=p.lunge>game.time; if(lunging) base*=1.35;
  // per nuotare bisogna prima girare il corpo nella direzione giusta
  let af=1;
  if(swimming && !p.isGK && !lunging) af=0.3+0.7*Math.max(0,(p.fx*dx+p.fz*dz)/mag);
  const tvx=dx*base*af, tvz=dz*base*af;
  // l'acqua frena subito ma fa partire piano
  const a=Math.min(1,dt*(Math.hypot(tvx,tvz)>sp?1.9:3.2));
  p.vx+=(tvx-p.vx)*a; p.vz+=(tvz-p.vz)*a;
  if(canSprint) p.stamina-=dt*0.085; else p.stamina+=dt*(moving?0.02:0.06);
  if(p.contactT>0) p.stamina-=dt*0.02;
  p.stamina=clamp(p.stamina,0,1);
  p.x+=p.vx*dt; p.z+=p.vz*dt;
  p.x=clamp(p.x,-HL+0.25,HL-0.25); p.z=clamp(p.z,-HW+0.25,HW-0.25);
  if(p.isGK){ const og=ownGoalX(p.team); p.x = p.team.dir>0 ? clamp(p.x,og+0.3,0) : clamp(p.x,0,og-0.3); }
  let tfx=p.fx, tfz=p.fz;
  if(p.act&&p.act.aim){ tfx=p.act.aim[0]-p.x; tfz=p.act.aim[1]-p.z; }
  else if(p.turnedUntil>game.time){ tfx=goalX(p.team)-p.x; tfz=-p.z; }
  else if(p.charging){ tfx=goalX(p.team)-p.x; tfz=-p.z; if(shotKind(p)==='beduina'){ tfx=-tfx; tfz=-tfz; } }
  else if(swimming && !(p.isGK&&ball.state!=='held'&&!sprint)){ tfx=dx; tfz=dz; }
  else if(hold){
    tfx=goalX(p.team)-p.x; tfz=-p.z;
    if(p.i===1 && Math.hypot(tfx,tfz)<4.5 && game.penalty!==p){ tfx=-tfx; tfz=-tfz; }   // il centroboa lavora spalle alla porta
  }
  else { tfx=ball.x-p.x; tfz=ball.z-p.z; }
  const tl=Math.hypot(tfx,tfz)||1; tfx/=tl; tfz/=tl;
  const k=Math.min(1,dt*(p.act?14:sp>1?4:7)); p.fx+=(tfx-p.fx)*k; p.fz+=(tfz-p.fz)*k;
  const fl=Math.hypot(p.fx,p.fz)||1; p.fx/=fl; p.fz/=fl;
}
export function separate(){
  const ps=allPlayers.filter(active);
  for(let i=0;i<ps.length;i++) for(let j=i+1;j<ps.length;j++){
    const a=ps[i], b=ps[j], opp=a.team!==b.team, R=opp?0.78:0.6;
    const dx=b.x-a.x, dz=b.z-a.z, d=Math.hypot(dx,dz);
    if(d>=R||d<0.0001) continue;
    const nx=dx/d, nz=dz/d, push=(R-d)/2;
    a.x-=nx*push; a.z-=nz*push; b.x+=nx*push; b.z+=nz*push;
    if(opp){   // un avversario davanti fa resistenza: si perde la velocità verso di lui e si deve girargli attorno
      const va=a.vx*nx+a.vz*nz; if(va>0){ a.vx-=nx*va*0.9; a.vz-=nz*va*0.9; }
      const vb=-(b.vx*nx+b.vz*nz); if(vb>0){ b.vx+=nx*vb*0.9; b.vz+=nz*vb*0.9; }
      a.contactT=b.contactT=0.25;
    }
  }
}

// ================= PALLA =================
export function updateBall(dt){
  if(ball.state==='held'){
    const p=ball.holder; ball.holdTime+=dt; ball.x=p.x; ball.z=p.z; ball.y=BRV;
    ball.vx=ball.vy=ball.vz=0;
    return;
  }
  if(ball.state==='dead'){
    ball.x+=ball.vx*dt; ball.z+=ball.vz*dt; ball.vx*=Math.exp(-2*dt); ball.vz*=Math.exp(-2*dt); ball.y=BRV; return;
  }
  ball.pickupCD-=dt;
  if(ball.state==='flight'){
    const px=ball.x;
    ball.vy-=G*dt; ball.x+=ball.vx*dt; ball.y+=ball.vy*dt; ball.z+=ball.vz*dt; ball.flightT+=dt;
    if(ball.kind==='shot'){
      const att=ball.shooter.team, def=other(att), gk=def.players[0], gx=goalX(att);
      // parata
      if(!ball.saveChecked && (px-gk.x)*(ball.x-gk.x)<=0){
        ball.saveChecked=true;
        const reach=0.58+0.42*gk.st.def, dz=Math.abs(ball.z-gk.z);
        if(dz<reach && ball.y<1.9){
          let prob=(1.0-0.36*ball.shotPower-dz*0.35-(ball.lob?0.2:0)-(gk.fakedUntil>game.time?0.25:0)-(ball.skipped?0.12:0))*(def.human?1:DIFF_GK());
          if(rnd()<prob){
            whistle(0.12); const r=rnd(); ball.afterShot=true;
            if(ball.shotPower>0.55&&r<0.25){ cornerThrow(att); }
            else if(ball.shotPower>0.7&&r<0.65){
              ball.state='free'; ball.vx=-ball.vx*0.18; ball.vz=(rnd()-0.5)*3; ball.vy=0; ball.y=BRV; ball.pickupCD=0.25;
              showMsg('Parata! <span style="font-size:20px;display:block">respinta</span>',1);
            } else { giveBall(gk); showMsg('Parata!',1); }
            return;
          }
        }
      }
      // linea di porta
      if((px-gx)*(ball.x-gx)<=0 && px!==ball.x){
        const az=Math.abs(ball.z);
        if(az<GW-0.06 && ball.y<GH-0.04 && ball.y>-0.3){ goalScored(att); return; }
        if((Math.abs(az-GW)<0.16 && ball.y<GH+0.1) || (az<GW+0.1 && Math.abs(ball.y-GH)<0.12)){
          ball.vx*=-0.35; ball.vz=(rnd()-0.5)*2; ball.vy=Math.min(ball.vy,0); ball.kind='rebound'; ball.afterShot=true;
          showMsg(Math.abs(ball.y-GH)<0.12&&az<GW?'Traversa!':'Palo!',1); return;
        }
        goalThrow(def,'Fuori! Rimessa dal portiere'); return;
      }
    }
    // intercetti, muri e ricezione
    if(ball.y<1.35){
      for(const p of allPlayers){
        if(p.excluded) continue;
        const hd=Math.hypot(p.x-ball.x,p.z-ball.z);
        if(p.team!==ball.lastTeam && !p.isGK && game.time>=p.stunUntil && hd<blockR(p) && (ball.kind!=='pass'||!ball.target||hd<Math.hypot(ball.target.x-ball.x,ball.target.z-ball.z)) && ball.flightT>0.12 && !ball.intercept.has(p)){
          ball.intercept.add(p);
          const pr=(ball.kind==='shot'?0.3:0.35)*(0.6+0.6*p.st.def)*(p.team.human?1:DIFF());
          if(rnd()<pr){
            if(ball.kind==='shot'){ ball.state='free'; ball.vx*=-0.15; ball.vz=(rnd()-0.5)*2; ball.vy=0; ball.y=BRV; ball.pickupCD=0.2; showMsg('Muro!',0.8); ball.afterShot=true; }
            else { giveBall(p); showMsg('Intercetto!',0.8); }
            return;
          }
        }
        if(ball.kind==='pass' && p===ball.target && hd<0.85 && ball.flightT>0.15){ giveBall(p); return; }
      }
    }
    if(ball.y<=BRV){
      if(ball.kind==='shot'&&ball.skip&&!ball.skipped){ ball.skipped=true; ball.y=BRV+0.01; ball.vy=Math.abs(ball.vy)*0.5; ball.vx*=0.85; ball.vz*=0.85; }
      else { ball.y=BRV; ball.state='free'; ball.vy=0; ball.vx*=0.4; ball.vz*=0.4; ball.pickupCD=0.1; }
    }
    if(ball.state==='flight' && Math.abs(ball.z)>HW+0.2){ sideOut(); return; }
    if(ball.state==='flight' && Math.abs(ball.x)>HL+0.8){ ball.state='free'; ball.vx*=0.2; ball.vz*=0.2; ball.vy=0; ball.y=BRV; }
  }
  if(ball.state==='free'){
    ball.y=BRV; ball.x+=ball.vx*dt; ball.z+=ball.vz*dt;
    const f=Math.exp(-1.6*dt); ball.vx*=f; ball.vz*=f;
    if(Math.abs(ball.z)>HW+0.2){ sideOut(); return; }
    if(Math.abs(ball.x)>HL){
      const defT=teams.find(t=>Math.sign(ownGoalX(t))===Math.sign(ball.x));
      goalThrow(defT); return;
    }
    if(ball.pickupCD<=0){
      let best=null,bd=1e9;
      for(const p of allPlayers){ if(p.excluded||game.time<p.stunUntil) continue; const d=dist(p,ball); const r=p.isGK?0.95:0.6; if(d<r&&d<bd){bd=d;best=p;} }
      if(best) giveBall(best);
    }
  }
}
