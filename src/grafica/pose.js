// Pose e animazioni: nuotata, posizione verticale, gesti di tiro e passaggio
import { VIS, clamp, dist, rnd } from '../costanti.js';
import { aggiornaNumero, muoviCorpo } from './corpo.js';
import { setSeg } from './modello.js';
import { spawnFoam } from './scena.js';
import { ball, fight, game } from '../stato.js';
import { shotKind } from '../tiri.js';
//<POSE>
export const L1=0.30, L2=0.29;
export function ik(S,H,l1,l2,hint){
  let dx=H[0]-S[0], dy=H[1]-S[1], dz=H[2]-S[2];
  let d=Math.hypot(dx,dy,dz)||0.001; dx/=d; dy/=d; dz/=d;
  d=clamp(d,Math.abs(l1-l2)+0.02,l1+l2-0.004);
  const a=(l1*l1-l2*l2+d*d)/(2*d), h=Math.sqrt(Math.max(0,l1*l1-a*a));
  const k=hint[0]*dx+hint[1]*dy+hint[2]*dz;
  let px=hint[0]-dx*k, py=hint[1]-dy*k, pz=hint[2]-dz*k, pl=Math.hypot(px,py,pz);
  if(pl<0.001){ px=0; py=-1; pz=0; pl=1; }
  return [[S[0]+dx*a+px/pl*h, S[1]+dy*a+py/pl*h, S[2]+dz*a+pz/pl*h],[S[0]+dx*d,S[1]+dy*d,S[2]+dz*d]];
}
export const add3=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const mix3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
export const ease=k=>k*k*(3-2*k);
// traiettorie della mano (rispetto alla spalla) per i diversi gesti: K = caricamento, R = rilascio, F = chiusura
export const HOLD=[0.05,0.40,0.12];
export const THROW={
  shot:{K:[-0.30,0.40,0.10],R:[0.40,0.52,-0.02],F:[0.45,-0.05,-0.25],lift:0.24,tw0:-0.8,tw1:0.5},     // tiro classico: busto ruotato, elevazione
  pass:{K:[-0.12,0.42,0.08],R:[0.38,0.42,0.0],F:[0.42,0.10,-0.10],lift:0.08,tw0:-0.35,tw1:0.3},
  lob:{K:[-0.10,0.38,0.10],R:[0.25,0.62,0.02],F:[0.35,0.40,0.0],lift:0.15,tw0:-0.3,tw1:0.2},          // palombella
  fake:{K:[-0.30,0.40,0.10],R:[0.12,0.58,0.06],F:[0.05,0.40,0.12],lift:0.2,tw0:-0.8,tw1:-0.1},      // finta: il braccio parte e si ferma
  beduina:{K:[0.30,0.0,0.20],R:[-0.35,0.45,0.25],F:[-0.45,0.10,-0.05],lift:0.15,tw0:0.3,tw1:-1.0},    // spalle alla porta
  colonnello:{K:[-0.25,0.25,0.10],R:[0.50,0.30,0.0],F:[0.55,-0.10,-0.05],lift:0,tw0:0,tw1:0}         // tiro in nuotata
};
export function computePose(p,dt,t){
  const sp=Math.hypot(p.vx,p.vz), hold=ball.holder===p, act=p.act, J={ball:null,ballHand:false,swim:false,brD:0,brS:0};   // brD/brS: quanto il braccio destro/sinistro segue il gesto calcolato qui (0 = animazione registrata)
  let th=null,c=0,w=0,f=0;
  if(act){ th=THROW[act.kind]||THROW.shot; c=act.wind>0?clamp(act.t/act.wind,0,1):1; w=ease(clamp((act.t-act.wind)/0.09,0,1)); f=clamp((act.t-act.wind-0.09)/0.3,0,1); }
  else if(p.charging){ th=THROW[shotKind(p)==='beduina'?'beduina':'shot']; c=clamp(p.chargeT/0.5,0,1); }
  const swim = sp>0.9 && !p.excluded && (!th || (act&&act.kind==='colonnello'));
  let hR,hL,hintR,hintL;
  if(swim){
    // crawl a testa alta: corpo orizzontale, bracciata alternata con recupero fuori dall'acqua, battuta di gambe
    J.swim=true; p.phase+=dt*(3+sp*1.8);
    const ph=p.phase, roll=Math.sin(ph)*0.05;
    J.hip=[-0.5,-0.15,0]; J.chest=[0,-0.07,0]; J.head=[0.17,0.09,0];
    J.sR=[0,-0.07+roll,0.2]; J.sL=[0,-0.07-roll,-0.2];
    const arm=(S,a,side)=>{ const cs=Math.cos(a), sn=Math.sin(a); return [add3(S,[0.54*cs, sn>0?-0.36*sn:-0.24*sn, side*(sn>0?0.02:0.12)]), sn>0?[0,-0.4,side]:[-0.3,1,side*0.35]]; };
    [hR,hintR]=arm(J.sR,ph,1); [hL,hintL]=arm(J.sL,ph+Math.PI,-1);
    const ps=ph*3;
    J.kR=add3(J.hip,[-0.38,-0.02+0.05*Math.sin(ps),0.1]);  J.fR=add3(J.kR,[-0.38,0.08*Math.sin(ps+1),0.02]);
    J.kL=add3(J.hip,[-0.38,-0.02-0.05*Math.sin(ps),-0.1]); J.fL=add3(J.kL,[-0.38,-0.08*Math.sin(ps+1),-0.02]);
    if(hold) J.ball=[0.6,0.1,0];      // palla portata davanti alla testa, tra le braccia
    if(th) J.brD=1;
  } else {
    // posizione verticale: gambe a bicicletta, mani che remano
    const bob=Math.sin(t*2.2+p.uid)*0.025, eg=t*5.5+p.uid;
    let lift=bob, tw=0, lean=0;
    const gkSave = p.isGK && ball.state==='flight' && ball.kind==='shot' && ball.shooter && ball.shooter.team!==p.team;
    const defUp = !hold && !p.isGK && ball.holder && ball.holder.team!==p.team && dist(p,ball.holder)<1.7;
    if(th){ lift+=th.lift*c*(1-0.8*f); tw=(th.tw0*c*(1-w)+th.tw1*w)*(1-f); }
    else if(gkSave){ lift+=0.38; lean=clamp((ball.crossZ-p.z)*Math.sign(p.fx||1),-1,1); }
    else if(p.isGK) lift+=0.1;
    else if(hold||defUp) lift+=0.07;
    if(p.biteUntil>game.time) lift+=0.28;      // ha abboccato alla finta: salta a murare a vuoto
    J.hip=[-0.06,-0.6+lift,lean*0.05]; J.chest=[0.02,-0.06+lift,lean*0.3]; J.head=[0.05,0.16+lift,lean*0.36];
    const sx=0.2*Math.sin(tw), sz=0.2*Math.cos(tw);
    J.sR=add3(J.chest,[sx,0,sz]); J.sL=add3(J.chest,[-sx,0,-sz]);
    hR=add3(J.sR,[0.28+0.05*Math.sin(eg),-0.05-lift*0.6,0.14+0.08*Math.cos(eg)]); hintR=[0,-1,0.6];
    hL=add3(J.sL,[0.28-0.05*Math.sin(eg),-0.05-lift*0.6,-0.14-0.08*Math.cos(eg)]); hintL=[0,-1,-0.6];
    J.brD=J.brS=0.5;      // da fermi: metà animazione registrata (braccia larghe che remano), metà remata raccolta davanti al petto
    if(gkSave){ hR=add3(J.chest,[0.2,0.5,lean*0.6+0.14]); hL=add3(J.chest,[0.2,0.5,lean*0.6-0.14]); hintR=[0,-0.3,1]; hintL=[0,-0.3,-1]; J.brD=J.brS=1; }
    else if(p.isGK&&!hold){ hR=add3(J.sR,[0.15,0.05,0.42]); hL=add3(J.sL,[0.15,0.05,-0.42]); J.brD=J.brS=1; }
    else if(defUp||p.biteUntil>game.time){ hR=add3(J.sR,[0.22,0.52,-0.05]); hintR=[0,-0.2,1]; J.brD=1; }
    else if(hold&&!th){ hR=add3(J.sR,HOLD); hintR=[-0.3,-0.6,1]; J.ballHand=true; J.brD=1; }
    if(th){ hL=add3(J.sL,[0.34,-0.04-lift*0.6,-0.08]); J.brD=1; J.brS=0.7; }      // il braccio libero fa appoggio sull'acqua
    if(fight.active && !th){
      if(p===fight.def){ J.brD=J.brS=1; hR=add3(J.sR,[0.36,0.14,-0.08]); hL=add3(J.sL,[0.36,0.14,0.08]); hintR=[0,-1,0.5]; hintL=[0,-1,-0.5]; J.hip[1]+=0.06; J.chest[0]+=0.06; }
      else if(p===fight.boa){ J.brS=1; if(!hold) J.brD=1; hL=add3(J.sL,[-0.28,-0.05,-0.12]); hintL=[0.3,-1,-0.6]; if(!hold) hR=add3(J.sR,[-0.26,-0.05,0.12]); J.hip[0]-=0.08; }
    }
    // dorso di attesa: semi-seduti sul dorso, braccia che remano ai lati, sguardo alla palla.
    // Lo usa chi arretra piano e chi, sul perimetro, aspetta il passaggio da un compagno lontano.
    const libero = !th && !hold && !p.isGK && !defUp && !(p.biteUntil>game.time) && !p.excluded && !(fight.active&&(p===fight.def||p===fight.boa));
    let vuoleDorso=false;
    if(libero){
      const h=ball.holder, indietro = sp>0.22 && (p.vx*p.fx+p.vz*p.fz) < -0.3*sp;
      vuoleDorso = indietro || (!!h && h.team===p.team && p.i>=4 && sp<0.4 && dist(p,h)>3);
    }
    p.dorsoK=(p.dorsoK||0)+((vuoleDorso?1:0)-(p.dorsoK||0))*Math.min(1,dt*3.5);
    const d=libero?ease(p.dorsoK):0;
    if(d>0.01){
      J.hip=mix3(J.hip,[0.20,-0.40+bob,0],d); J.chest=mix3(J.chest,[-0.16,-0.12+bob,0],d); J.head=mix3(J.head,[-0.30,0.10+bob,0],d);
      J.sR=add3(J.chest,[0,0,0.2]); J.sL=add3(J.chest,[0,0,-0.2]);
      hR=mix3(hR,add3(J.sR,[0.10+0.05*Math.sin(eg),-0.10,0.40+0.08*Math.cos(eg)]),d); hL=mix3(hL,add3(J.sL,[0.10-0.05*Math.sin(eg),-0.10,-0.40-0.08*Math.cos(eg)]),d);
      hintR=[-0.4,-0.5,1]; hintL=[-0.4,-0.5,-1]; J.brD=J.brS=d; J.dorso=d;
    }
    for(const side of [1,-1]){
      const a=eg+(side>0?0:Math.PI);
      const k=add3(J.hip,[0.2,-0.2,side*0.24]), ft=add3(k,[0.04+0.13*Math.cos(a),-0.36,side*0.06+0.13*Math.sin(a)]);
      if(side>0){ J.kR=k; J.fR=ft; } else { J.kL=k; J.fL=ft; }
    }
  }
  if(th){
    let off=mix3(HOLD,th.K,c); off=mix3(off,th.R,w); off=mix3(off,th.F,f);
    hR=add3(J.sR,off); hintR=[-0.4,-0.6,1];
    if(hold && !(act&&act.done&&act.kind!=='fake')){ J.ballHand=true; J.ball=null; }
  }
  [J.eR,J.hR]=ik(J.sR,hR,L1,L2,hintR); [J.eL,J.hL]=ik(J.sL,hL,L1,L2,hintL);
  return J;
}
//</POSE>
export const JK=['hip','chest','head','sL','sR','eL','eR','hL','hR','kL','kR','fL','fR'];
export function updateRig(p,dt,t){
  const R=p.mesh, T=computePose(p,dt,t);
  if(!p.J){ p.J={}; for(const k of JK) p.J[k]=T[k].slice(); }
  const J=p.J, k=1-Math.exp(-dt*(p.act?34:16));
  for(const key of JK){ const a=J[key], b=T[key]; a[0]+=(b[0]-a[0])*k; a[1]+=(b[1]-a[1])*k; a[2]+=(b[2]-a[2])*k; }
  R.g.position.set(p.x,0,p.z); R.g.rotation.y=Math.atan2(-p.fz,p.fx);
  if(R.corpo){ aggiornaNumero(R,p.num); if(!(window.__pallanuoto&&window.__pallanuoto.senzaCorpi)) muoviCorpo(R,J,T,dt,Math.hypot(p.vx,p.vz)); }
  else {
    setSeg(R.torso,J.hip,J.chest); R.chest.position.set(J.chest[0],J.chest[1],J.chest[2]); R.pelvis.position.set(J.hip[0],J.hip[1],J.hip[2]);
    setSeg(R.bar,J.sL,J.sR); R.shR.position.set(J.sR[0],J.sR[1],J.sR[2]); R.shL.position.set(J.sL[0],J.sL[1],J.sL[2]);
    setSeg(R.uaR,J.sR,J.eR); setSeg(R.faR,J.eR,J.hR); setSeg(R.uaL,J.sL,J.eL); setSeg(R.faL,J.eL,J.hL);
    R.haR.position.set(J.hR[0],J.hR[1],J.hR[2]); R.haL.position.set(J.hL[0],J.hL[1],J.hL[2]);
    setSeg(R.thR,J.hip,J.kR); setSeg(R.snR,J.kR,J.fR); setSeg(R.thL,J.hip,J.kL); setSeg(R.snL,J.kL,J.fL);
    R.head.position.set(J.head[0],J.head[1],J.head[2]);
  }
  R.spr.position.set(J.head[0],J.head[1]+0.3,J.head[2]);
  // posizione della palla in mano / davanti al nuotatore (coordinate mondo)
  let l=null;
  if(T.ballHand) l=[J.hR[0]+0.02,J.hR[1]+0.13,J.hR[2]]; else if(T.ball) l=T.ball;
  if(l){ const c=p.fx, sn=-p.fz; p.ballW=[p.x+VIS*(l[0]*c+l[2]*sn), VIS*l[1], p.z+VIS*(-l[0]*sn+l[2]*c)]; } else p.ballW=null;
  // schiuma: battuta di gambe e bracciata
  if(T.swim){ p.foamT=(p.foamT||0)-dt; if(p.foamT<=0){ p.foamT=0.09;
    spawnFoam(p.x-p.fx*VIS*1.15+(rnd()-0.5)*0.2,p.z-p.fz*VIS*1.15+(rnd()-0.5)*0.2,0.2+rnd()*0.1,0.8);
    spawnFoam(p.x+p.fx*VIS*0.5+(rnd()-0.5)*0.5,p.z+p.fz*VIS*0.5+(rnd()-0.5)*0.5,0.12,0.5); } }
  else if(p.act&&p.act.kind!=='pass'&&p.act.kind!=='fake'&&!p.act.foam&&p.act.done){ p.act.foam=true; for(let i=0;i<4;i++) spawnFoam(p.x+(rnd()-0.5)*0.7,p.z+(rnd()-0.5)*0.7,0.25,0.9); }
}
