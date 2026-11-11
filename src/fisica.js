// ================= FISICA GIOCATORI =================
import { scala } from './dati/rose.js';
import { registraParata } from './statistiche.js';
import { whistle } from './audio.js';
import { BRV, DIFF, DIFF_GK, GH, GW, HL, HW, clamp, dist, rnd } from './costanti.js';
import { showMsg } from './hud.js';
import { QUOTA_GALLEGGIA, passoPalla } from './palla.js';
import { blockR } from './ia.js';
import { cornerThrow, giveBall, goalScored, goalThrow, sideOut } from './regole.js';
import { active, allPlayers, ball, game, goalX, other, ownGoalX, teams } from './stato.js';
import { diSchiena, shotKind } from './tiri.js';
export function movePlayer(p,dx,dz,sprint,dt){
  const mag=Math.hypot(dx,dz), moving=mag>0.05, swimming=mag>0.5;
  const hold=ball.holder===p, sp=Math.hypot(p.vx,p.vz);
  // Velocità: tra 60 e 90 di Velocità ci sono circa il 19% di differenza
  let base=1.45*1.08*(0.82+(p.s.vel-40)/59*0.36);    // andatura normale ~1.6 m/s
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
  // Resistenza: un giocatore medio è visibilmente stanco dopo 6-7 vasche di sprint di fila (docs/tecnica.md);
  // chi ha più Resistenza si stanca meno e recupera prima
  const fRes=(p.s.res-40)/59;
  if(canSprint) p.stamina-=dt*0.0092*(1.6-fRes); else p.stamina+=dt*(moving?0.006:0.02)*(0.6+0.8*fRes);
  if(p.contactT>0) p.stamina-=dt*0.02;
  p.stamina=clamp(p.stamina,0,1);
  p.x+=p.vx*dt; p.z+=p.vz*dt;
  p.x=clamp(p.x,-HL+0.25,HL-0.25); p.z=clamp(p.z,-HW+0.25,HW-0.25);
  if(p.isGK){ const og=ownGoalX(p.team); p.x = p.team.dir>0 ? clamp(p.x,og+0.3,0) : clamp(p.x,0,og-0.3); }
  let tfx=p.fx, tfz=p.fz;
  if(p.act&&p.act.aim){ tfx=p.act.aim[0]-p.x; tfz=p.act.aim[1]-p.z; }
  else if(p.turnedUntil>game.time){ tfx=goalX(p.team)-p.x; tfz=-p.z; }
  else if(p.charging){ tfx=goalX(p.team)-p.x; tfz=-p.z; if(diSchiena(shotKind(p))){ tfx=-tfx; tfz=-tfz; } }
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
// La palla si muove con la fisica di palla.js; qui si applicano le regole: parata, muro, intercetto, ricezione, gol, fuori.
const _giocatori=[];
function passo(dt,corpiAttivi){
  // i corpi dei giocatori fanno rimbalzare solo la palla vagante (su tiri e passaggi decidono parata, muro e intercetto)
  for(let i=0;i<allPlayers.length;i++){ const p=allPlayers[i], g=_giocatori[i]||(_giocatori[i]={x:0,z:0,attivo:false});
    g.x=p.x; g.z=p.z; g.attivo=corpiAttivi&&!p.excluded&&p!==ball.shooter; }
  const e=passoPalla(ball,dt,_giocatori);
  if(e.acqua) ball.spruzzo={ forza:e.acqua.forza, schizzo:e.acqua.tipo==='schizzo' };      // lo disegna render.js
  return e;
}
// la palla ha passato la linea di porta in questo passo? (px = posizione prima del passo)
function lineaDiPorta(px){
  for(const t of teams){
    const gx=goalX(t);
    if((px-gx)*(ball.x-gx)>0 || px===ball.x || Math.abs(px)>HL) continue;      // conta solo se arriva dal campo
    const dentro=Math.abs(ball.z)<GW+0.04 && ball.y<GH+0.04 && ball.y>-0.3;
    return { att:t, dentro };
  }
  return null;
}
export function updateBall(dt){
  if(ball.state==='held'){
    const p=ball.holder; ball.holdTime+=dt; ball.x=p.x; ball.z=p.z; ball.y=BRV;
    ball.vx=ball.vy=ball.vz=0; ball.wx=ball.wy=ball.wz=0; ball.inRete=false;
    return;
  }
  if(ball.state==='dead'){
    if(ball.inRete){ const f=Math.exp(-3*dt); ball.vx*=f; ball.vz*=f; passo(dt,false); return; }      // la rete smorza la palla      // dopo il gol la palla finisce davvero in fondo alla rete
    ball.x+=ball.vx*dt; ball.z+=ball.vz*dt; ball.vx*=Math.exp(-2*dt); ball.vz*=Math.exp(-2*dt);
    ball.y+=(QUOTA_GALLEGGIA-ball.y)*Math.min(1,dt*6); return;      // palla ferma: galleggia
  }
  ball.pickupCD-=dt;
  if(ball.state==='flight'){
    const px=ball.x;
    const e=passo(dt,ball.kind==='rebound'); ball.flightT+=dt;
    // pali e traversa: l'urto è vero, qui si annuncia soltanto
    if(ball.daTiro){
      const legno=e.urti.find(u=>u==='palo'||u==='traversa');
      if(legno && Math.abs(Math.abs(ball.x)-HL)<0.5){ ball.kind='rebound'; ball.afterShot=true; showMsg(legno==='palo'?'Palo!':'Traversa!',1); }
    }
    if(ball.kind==='shot'){
      const att=ball.shooter.team, def=other(att), gk=def.players[0];
      // parata
      if(!ball.saveChecked && (px-gk.x)*(ball.x-gk.x)<=0){
        ball.saveChecked=true;
        const reach=0.58+0.42*scala(gk.s.rif), dz=Math.abs(ball.z-gk.z);
        if(dz<reach && ball.y<1.9){
          let prob=(1.0-0.36*ball.shotPower-dz*0.35-(ball.lob?0.2:0)-(gk.fakedUntil>game.time?0.25:0)-(ball.skipped?0.12:0))*(def.human?1:DIFF_GK())
            *(ball.rigore?0.45:1);      // sul rigore il portiere para molto meno: negli studi citati dalla tesi ne entra l'80%
          if(rnd()<prob){
            whistle(0.12); const r=rnd(); ball.afterShot=true; registraParata(att,def);
            if(ball.shotPower>0.55&&r<0.25){ cornerThrow(att); }
            else if(ball.shotPower>0.7&&r<0.65){
              // respinta: la palla schizza via dalle mani del portiere, verso il campo e verso l'alto
              ball.kind='rebound'; ball.vx=-ball.vx*0.22; ball.vz=ball.vz*0.3+(rnd()-0.5)*4; ball.vy=1.5+rnd()*2; ball.wx*=0.3; ball.wz*=0.3; ball.pickupCD=0.25;
              showMsg('Parata! <span style="font-size:20px;display:block">respinta</span>',1);
            } else { giveBall(gk); showMsg('Parata!',1); }
            return;
          }
        }
      }
    }
    // linea di porta: gol se passa tra i pali e sotto la traversa (anche dopo aver toccato un legno), altrimenti fuori
    if(ball.daTiro){
      const l=lineaDiPorta(px);
      if(l){
        if(l.dentro){ ball.inRete=true; goalScored(l.att); return; }
        goalThrow(other(l.att),'Fuori! Rimessa dal portiere'); return;
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
            if(ball.kind==='shot'){
              // muro: la palla rimbalza sul braccio alzato e resta in gioco
              ball.kind='rebound'; ball.vx*=-0.2; ball.vz=ball.vz*0.3+(rnd()-0.5)*3; ball.vy=1+rnd()*1.5; ball.wx*=0.3; ball.wz*=0.3; ball.pickupCD=0.2; showMsg('Muro!',0.8); ball.afterShot=true;
            }
            else { giveBall(p); showMsg('Intercetto!',0.8); }
            return;
          }
        }
        if(ball.kind==='pass' && p===ball.target && hd<0.85 && ball.flightT>0.15){ giveBall(p); return; }
      }
    }
    // acqua: lo schizzo tiene la palla in volo (il portiere la legge peggio), il tonfo la lascia a galleggiare
    if(e.acqua){
      if(e.acqua.tipo==='schizzo' && (ball.schizzi=(ball.schizzi||0)+1)<=2){ if(ball.kind==='shot') ball.skipped=true; }
      else { ball.state='free'; ball.pickupCD=0.1; }
    } else if(ball.y<BRV && ball.vy<=0.5 && ball.flightT>0.1){ ball.state='free'; ball.pickupCD=0.1; }
    if(ball.state==='flight' && Math.abs(ball.z)>HW+0.2){ sideOut(); return; }
    if(ball.state==='flight' && Math.abs(ball.x)>HL+1.2){ ball.state='free'; ball.vx*=0.2; ball.vz*=0.2; }
  }
  if(ball.state==='free'){
    const px=ball.x;
    passo(dt,true);
    if(Math.abs(ball.z)>HW+0.2){ sideOut(); return; }
    // una palla vagante che rotola in porta dopo un tiro è gol; se esce dal fondo è rimessa
    if(ball.daTiro){ const l=lineaDiPorta(px); if(l&&l.dentro){ ball.inRete=true; goalScored(l.att); return; } }
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
