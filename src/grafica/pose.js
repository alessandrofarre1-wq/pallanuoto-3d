import * as THREE from 'three';
// Pose e animazioni: nuotata, posizione verticale, gesti di tiro e passaggio
import { VIS, clamp, dist, rndGrafica } from '../costanti.js';
import { aggiornaNumero, muoviCorpo } from './corpo.js';
import { setSeg } from './modello.js';
import { contatto, spawnFoam } from './scena.js';
import { evento } from './acqua-eventi.js';
import { allPlayers, ball, fight, game } from '../stato.js';
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
// traiettorie della mano (rispetto alla spalla) per i diversi gesti: K = caricamento, R = rilascio, F = chiusura.
// lift = quanto la bicicletta alza il corpo; tw0/tw1 = rotazione del busto al caricamento e al rilascio;
// ind = quanto il busto va indietro caricando e avanti rilasciando (fasi del tiro, tesi Patumi)
export const HOLD=[0.05,0.40,0.12];
export const THROW={
  shot:{K:[-0.34,0.44,0.06],R:[0.42,0.54,-0.02],F:[0.46,-0.04,-0.26],lift:0.30,tw0:-0.9,tw1:0.55,ind:1},   // tiro: corpo fuori fino al petto, busto ruotato, frustata
  pass:{K:[-0.08,0.44,0.10],R:[0.36,0.44,0.02],F:[0.40,0.14,-0.08],lift:0.10,tw0:-0.12,tw1:0.12,ind:0.25},  // passaggio: gesto corto, busto quasi fermo
  lob:{K:[-0.12,0.36,0.10],R:[0.22,0.66,0.02],F:[0.34,0.44,0.0],lift:0.16,tw0:-0.3,tw1:0.2,ind:0.4},       // palombella: spinta dal basso verso l'alto
  fake:{K:[-0.34,0.44,0.06],R:[0.12,0.58,0.06],F:[0.05,0.40,0.12],lift:0.24,tw0:-0.9,tw1:-0.15,ind:0.6},  // finta: il braccio parte e si ferma
  beduina:{K:[0.30,0.0,0.20],R:[-0.35,0.45,0.25],F:[-0.45,0.10,-0.05],lift:0.16,tw0:0.3,tw1:-1.0,ind:0},   // spalle alla porta: busto e spalla ruotano all'esterno
  sciarpa:{K:[0.30,0.02,0.18],R:[-0.16,0.36,-0.30],F:[-0.34,0.22,-0.34],lift:0.16,tw0:-0.25,tw1:0.95,ind:0}, // spalle alla porta: il braccio attraversa il corpo, colpo di polso
  polso:{K:[0.02,0.46,0.10],R:[0.30,0.52,0.02],F:[0.36,0.30,-0.10],lift:0.14,tw0:-0.12,tw1:0.18,ind:0.15},     // tiro di solo polso: quasi senza caricare
  torsione:{K:[-0.34,0.44,0.06],R:[0.36,0.50,-0.20],F:[0.36,-0.02,-0.38],lift:0.30,tw0:-1.05,tw1:0.95,ind:1},   // busto verso il primo palo, chiusura in diagonale
  colonnello:{K:[-0.25,0.25,0.10],R:[0.50,0.30,0.0],F:[0.55,-0.10,-0.05],lift:0,tw0:0,tw1:0,ind:0}        // tiro in nuotata
};
const PALLA_DAVANTI=[0.62,0.08,0];     // in nuotata la palla si spinge davanti alla testa, tra le braccia
export function computePose(p,dt,t){
  const sp=Math.hypot(p.vx,p.vz), hold=ball.holder===p, act=p.act, J={ballHand:false,ballDavanti:0,swim:false,oriz:0,dorso:0};
  let th=null,c=0,w=0,f=0;
  let wb=0;      // wb = rotazione del busto, w = braccio: il busto parte prima e il braccio segue (catena cinetica)
  if(act){ th=THROW[act.kind]||THROW.shot; c=act.wind>0?clamp(act.t/act.wind,0,1):1;
    const fr=act.frusta||0.09, tt=act.t-act.wind;
    wb=ease(clamp(tt/Math.min(fr,0.125),0,1));                 // il busto ruota in circa 125 ms (dato riportato nella tesi)
    w=ease(clamp((tt-0.25*fr)/(0.75*fr),0,1)); f=clamp((tt-fr)/0.3,0,1); }
  else if(p.charging){ const k=shotKind(p); th=THROW[k==='beduina'||k==='sciarpa'?k:'shot']; c=clamp(p.chargeT/0.5,0,1); }
  // quanto il corpo è disteso (lo decide la fisica: fisica.js): 0 verticale, 1 orizzontale. Tutto sfuma tra le due pose.
  const o=p.excluded?0:(p.oriz||0), e=ease(o);
  const frena=(p.orizPrec||0)>o+1e-6 ? Math.sin(Math.PI*o) : 0; p.orizPrec=o;      // sta tornando verticale: remata di freno
  if(o>0.02) p.phase+=dt*(3.2+sp*1.9);
  const bob=Math.sin(t*2.2+p.uid)*0.02, eg=t*5.5+p.uid;

  // ================= POSA VERTICALE: bicicletta, acqua alle spalle =================
  let lift=bob, tw=0, lean=0;
  const h=ball.holder;
  // quanto la palla è vicina alla porta di questo portiere: 0 oltre metà campo, 1 dentro i 7 metri
  const vicinaGK = p.isGK ? ease(clamp((13-Math.abs(ball.x-(-12.5*p.team.dir)))/6,0,1)) : 0;
  const gkSave = p.isGK && ball.state==='flight' && ball.kind==='shot' && ball.shooter && ball.shooter.team!==p.team;
  p.parataIn=gkSave;      // per l'evento «parata» (solo disegno)
  const defUp = !hold && !p.isGK && h && h.team!==p.team && dist(p,h)<1.7;
  const muro = defUp && (h.charging || (h.act && !h.act.done && h.act.kind!=='pass'));      // l'avversario sta tirando: braccio alto a murare
  const abbocca = p.biteUntil>game.time;
  let lz=0, ly=0, arrivo=0;
  if(th){ lift+=th.lift*(0.8+0.2*p.stamina)*c*(1-0.8*f); tw=(th.tw0*c*(1-wb)+th.tw1*wb)*(1-f); }      // chi è stanco esce meno dall'acqua
  else if(gkSave){
    lz=clamp((ball.crossZ-p.z)*Math.sign(p.fx||1),-1.25,1.25)/VIS; ly=clamp(ball.y,0.25,1.5)/VIS;      // mani fino a 1,5 m (salto con la mano tesa: 1,56 ± 0,09 m, Zinner 2015)      // dove passerà la palla, nel sistema del portiere
    arrivo=ease(clamp(ball.flightT/0.22,0,1)); lean=clamp(lz/0.7,-1,1); lift+=0.34;
  }
  else if(p.isGK) lift+=0.10*vicinaGK-0.03*(1-vicinaGK);      // palla lontana: basso, rema e guarda; palla vicina: alto, pronto
  else if(muro) lift+=0.2;
  else if(hold||defUp) lift+=0.06;
  if(abbocca) lift+=0.28;      // ha abboccato alla finta: salta a murare a vuoto
  // passaggio in arrivo: ci si alza e si allunga la mano verso la palla
  let presa=0, pallaL=null;
  if(!th && !hold && ball.state==='flight' && ball.kind==='pass' && ball.target===p){
    const bx=ball.x-p.x, bz=ball.z-p.z, vel=Math.hypot(ball.vx,ball.vz)||1;
    presa=ease(clamp(1-Math.hypot(bx,bz)/(vel*0.45),0,1)); lift+=0.12*presa;
    pallaL=[(bx*p.fx+bz*p.fz)/VIS, ball.y/VIS, (-bx*p.fz+bz*p.fx)/VIS];
  }
  let vHip=[-0.06,-0.6+lift,lean*0.05], vChest=[0.02,-0.06+lift,lean*0.38], vHead=[0.05,0.16+lift,lean*0.44];
  if(th&&th.ind){ const ind=(-0.08*c*(1-w)+0.10*w)*(1-f)*th.ind; vChest[0]+=ind; vHead[0]+=ind*1.3; }      // busto indietro caricando, avanti rilasciando
  let sx=0.2*Math.sin(tw), sz=0.2*Math.cos(tw);
  let vSR=add3(vChest,[sx,0,sz]), vSL=add3(vChest,[-sx,0,-sz]);
  // mani che remano sott'acqua davanti al petto
  let hR=add3(vSR,[0.27+0.06*Math.sin(eg),-0.14-lift*0.6,0.07+0.09*Math.cos(eg)]), hintR=[0,-1,0.6];
  let hL=add3(vSL,[0.27-0.06*Math.sin(eg),-0.14-lift*0.6,-0.07-0.09*Math.cos(eg)]), hintL=[0,-1,-0.6];
  if(gkSave){
    // braccia larghe e alte, poi ci si allunga verso la palla: due mani se arriva vicino al corpo, una se è laterale
    // parata alta (palla sopra 1 m): due braccia sopra la testa anche se è un po' laterale
    const due=Math.abs(lz)<0.3||(ly*VIS>1.0&&Math.abs(lz)<0.6), lR=add3(vSR,[0.14,0.34,0.36]), lL=add3(vSL,[0.14,0.34,-0.36]);
    hR = lz>=0||due ? mix3(lR,[0.24,ly,lz+(due?0.09:0)],arrivo) : lR;
    hL = lz<0||due ? mix3(lL,[0.24,ly,lz-(due?0.09:0)],arrivo) : lL;
    hintR=[0,-0.3,1]; hintL=[0,-0.3,-1];
  }
  else if(p.isGK&&!hold&&vicinaGK>0.02){ hR=mix3(hR,add3(vSR,[0.15,0.05,0.42]),vicinaGK); hL=mix3(hL,add3(vSL,[0.15,0.05,-0.42]),vicinaGK); }      // palla vicina: braccia larghe a pelo d'acqua, pronte a uscire
  else if(p.fintaC>game.time&&!hold){ hR=add3(vSR,[0.50,0.04,-0.04]); hintR=[0,-0.6,1]; }      // contrasto di disturbo: la mano parte verso la palla
  else if(muro||abbocca){ hR=add3(vSR,[0.20,0.56,-0.04]); hintR=[0,-0.2,1]; }
  else if(defUp){ hR=add3(vSR,[0.28,0.30,-0.02]); hintR=[0,-0.4,1]; }
  else if(hold&&!th){ hR=add3(vSR,HOLD); hintR=[-0.3,-0.6,1]; J.ballHand=true; }
  if(presa>0.01){ const v=[pallaL[0]-vSR[0],pallaL[1]-vSR[1],pallaL[2]-vSR[2]], l=Math.hypot(v[0],v[1],v[2])||1, m=Math.min(1,0.55/l); hR=mix3(hR,add3(vSR,[v[0]*m,Math.max(0.1,v[1]*m),v[2]*m]),presa); hintR=[0,-0.4,1]; }
  if(th){ hL=[vSL[0]+0.36,-0.03,vSL[2]-0.10]; hintL=[0,-1,-0.4]; }      // il braccio libero fa appoggio sull'acqua (a pelo d'acqua)
  if(fight.active && !th){
    // braccia vive nella lotta: il difensore spinge a mani alterne sulla schiena e sul fianco del centroboa; il centroboa rema
    // dietro di sé per tenere la posizione (la mano con la palla non cambia: da lì parte il tiro)
    const wl=t*5.2+p.uid*1.3, a1=Math.sin(wl), a2=Math.sin(wl+Math.PI);
    if(p===fight.def){ hR=hold?add3(vSR,[0.36,0.14,-0.08]):add3(vSR,[0.34+0.05*a1,0.12+0.04*a1,-0.07]); hL=add3(vSL,[0.31+0.05*a2,0.02+0.05*a2,0.09]); hintR=[0,-1,0.5]; hintL=[0,-1,-0.5]; vHip[1]+=0.06; vChest[0]+=0.06; }
    else if(p===fight.boa){ hL=add3(vSL,[-0.27+0.04*a1,-0.06+0.03*a2,-0.13-0.03*a1]); hintL=[0.3,-1,-0.6]; if(!hold) hR=add3(vSR,[-0.25+0.04*a2,-0.06+0.03*a1,0.13+0.03*a2]); vHip[0]-=0.08; }
  }
  // dorso di attesa: semi-seduti sul dorso, gambe a bicicletta, braccia larghe che remano ai lati, sguardo alla palla.
  // Lo usa chi arretra piano e chi, sul perimetro, aspetta il passaggio da un compagno lontano.
  const libero = !th && !hold && !p.isGK && !defUp && !abbocca && !p.excluded && o<0.05 && !(fight.active&&(p===fight.def||p===fight.boa));
  let vuoleDorso=false;
  if(libero){
    const indietro = sp>0.22 && (p.vx*p.fx+p.vz*p.fz) < -0.3*sp;
    vuoleDorso = indietro || (!!h && h.team===p.team && p.i>=4 && sp<0.4 && dist(p,h)>3);
  }
  p.dorsoK=(p.dorsoK||0)+((vuoleDorso?1:0)-(p.dorsoK||0))*Math.min(1,dt*3);
  const d=libero?ease(p.dorsoK):0;
  if(d>0.01){
    vHip=mix3(vHip,[0.30,-0.34+bob,0],d); vChest=mix3(vChest,[-0.12,-0.09+bob,0],d); vHead=mix3(vHead,[-0.26,0.10+bob,0],d);
    vSR=add3(vChest,[0,0,0.2]); vSL=add3(vChest,[0,0,-0.2]);
    hR=mix3(hR,add3(vSR,[0.04+0.10*Math.sin(eg),-0.03,0.50+0.04*Math.cos(eg)]),d); hL=mix3(hL,add3(vSL,[0.04-0.10*Math.sin(eg),-0.03,-0.50-0.04*Math.cos(eg)]),d);
    hintR=[-0.3,-0.4,1]; hintL=[-0.3,-0.4,-1]; J.dorso=d;
  }
  // frenata: mentre il busto si raddrizza le mani spingono l'acqua in avanti
  if(frena>0.01 && !th && !hold){ hR=mix3(hR,add3(vSR,[0.44,-0.06,0.14]),frena); hL=mix3(hL,add3(vSL,[0.44,-0.06,-0.14]),frena); }

  // ================= POSA ORIZZONTALE: stile libero da pallanuoto =================
  // corpo disteso appena sotto la superficie (schiena a pelo d'acqua), testa alta, bracciata corta e frequente con
  // recupero fuori dall'acqua a gomito alto, gambe unite con battuta veloce
  const cur=p.curva||0, ph=p.phase, rollio=Math.sin(ph)*0.06+cur*0.05;      // in curva il corpo rolla verso l'interno
  // ogni tanto, nuotando, la testa si alza un attimo per guardare l'azione
  const guarda=hold?0:ease(clamp((Math.sin(t*1.7+p.uid*2.3)-0.72)/0.2,0,1));
  const oHip=[-0.50,-0.21-0.02*guarda,0], oChest=[0,-0.07+0.03*guarda,0], oHead=[0.17-0.04*guarda,0.09+0.10*guarda,0];
  const oSR=[0,-0.07-rollio,0.19], oSL=[0,-0.07+rollio,-0.19];      // la spalla del braccio in recupero sale
  // in curva la bracciata esterna è più lunga e ampia, quella interna più corta (una remata che fa da perno)
  const bracciata=(S,a,lato)=>{ const cs=Math.cos(a), sn=Math.sin(a), corta=(hold?0.8:1)*(1-0.42*clamp(cur*lato,-0.6,1));
    return sn>0 ? [add3(S,[0.10+0.42*cs*corta,-0.34*sn,lato*0.05]),[0,-0.5,lato]]                 // trazione sott'acqua
                : [add3(S,[0.10+0.42*cs*corta,-0.16*sn,lato*(0.14+(hold?0.10:0))]),[-0.25,1,lato*0.8]]; };      // recupero fuori dall'acqua, gomito alto
  const [oHR,oHintR]=bracciata(oSR,ph,1), [oHL,oHintL]=bracciata(oSL,ph+Math.PI,-1);
  const ps=ph*3;
  J.kR=add3(oHip,[-0.40,-0.03+0.05*Math.sin(ps),0.07]);  J.fR=add3(J.kR,[-0.40,0.02+0.09*Math.sin(ps+1),0]);
  J.kL=add3(oHip,[-0.40,-0.03-0.05*Math.sin(ps),-0.07]); J.fL=add3(J.kL,[-0.40,0.02-0.09*Math.sin(ps+1),0]);

  // ================= PASSAGGIO CONTINUO TRA LE DUE =================
  J.hip=mix3(vHip,oHip,e); J.chest=mix3(vChest,oChest,e); J.head=mix3(vHead,oHead,e);
  J.sR=mix3(vSR,oSR,e); J.sL=mix3(vSL,oSL,e);
  hR=mix3(hR,oHR,e); hL=mix3(hL,oHL,e);
  if(e>0.5){ hintR=oHintR; hintL=oHintL; }
  J.oriz=e; J.swim=o>0.5;
  if(hold&&!th){ J.ballHand=true; J.ballDavanti=e; }
  if(th){
    // al rilascio del tiro classico il gomito non è del tutto disteso: circa 147° nei semi-professionisti, 157° nei
    // professionisti (dati riportati nella tesi); nella tesi a gomito più disteso corrisponde palla più veloce
    let R=th.R;
    if(th===THROW.shot){ const ang=(146.7+10.8*clamp((p.st.sht-0.7)/0.3,0,1))*Math.PI/180, d=Math.sqrt(L1*L1+L2*L2-2*L1*L2*Math.cos(ang))/Math.hypot(R[0],R[1],R[2]); R=[R[0]*d,R[1]*d,R[2]*d]; }
    let off=mix3(HOLD,th.K,c); off=mix3(off,R,w); off=mix3(off,th.F,f);
    hR=add3(J.sR,off); hintR=[-0.4,-0.6,1];
    if(hold && !(act&&act.done&&act.kind!=='fake')) J.ballHand=true;
  }
  [J.eR,J.hR]=ik(J.sR,hR,L1,L2,hintR); [J.eL,J.hL]=ik(J.sL,hL,L1,L2,hintL);
  return J;
}
//</POSE>
export const JK=['hip','chest','head','sL','sR','eL','eR','hL','hR','kL','kR','fL','fR'];
const _mano=new THREE.Vector3();
// POSTURA DISEGNATA IN NUOTATA (solo disegno: le giunture del gioco, da cui parte la palla, restano quelle di computePose).
// Nel crawl da pallanuoto la testa e le spalle stanno fuori dall'acqua e il corpo è inclinato: bacino e gambe scendono.
// Le giunture del corpo disegnato vengono quindi alzate di SU_NUOTO (testa e spalle a pelo d'acqua) e la parte bassa
// (bacino, ginocchia, piedi) ruota verso il basso di INCLINA_NUOTO attorno alle spalle; tutto in proporzione a quanto il
// corpo è disteso, quindi da verticale non cambia nulla e il passaggio resta continuo.
const SU_NUOTO=0.09, INCLINA_NUOTO=0.42, BASSI=['hip','kL','kR','fL','fR'];
function posturaVista(p,J,e){
  if(e<0.001) return J;
  const V=p.Jv||(p.Jv={}), su=SU_NUOTO*e, a=INCLINA_NUOTO*e, ca=Math.cos(a), sa=Math.sin(a);
  const cx=(J.sL[0]+J.sR[0])/2, cy=(J.sL[1]+J.sR[1])/2;
  for(const k of JK){ const q=J[k], v=V[k]||(V[k]=[0,0,0]); v[0]=q[0]; v[1]=q[1]+su; v[2]=q[2]; }
  for(const k of BASSI){ const q=J[k], v=V[k], dx=q[0]-cx, dy=q[1]-cy; v[0]=cx+dx*ca-dy*sa; v[1]=cy+dx*sa+dy*ca+su; }
  return V;
}
export function updateRig(p,dt,t){
  const R=p.mesh;
  // CORPO CHE SI PIEGA. La direzione del giocatore (p.fx, p.fz) è quella di testa e spalle; petto, bacino e gambe la seguono
  // ciascuno con un piccolo ritardo, così in curva la colonna si piega verso l'interno e le gambe vengono dietro come una coda.
  // In linea retta i ritardi si annullano e il corpo resta disteso. Più la curva è stretta e veloce, più il corpo si piega.
  const ry=Math.atan2(-p.fz,p.fx), S=p.spina||(p.spina={petto:ry,bacino:ry,gambe:ry});
  const segui=(k,tau,max)=>{ let d=S[k]-ry; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI;
    if(Math.abs(d)>2.2) d=0;                                   // spostamento improvviso (ripresa del gioco): niente piega
    d*=Math.exp(-dt/tau); d=clamp(d,-max,max); S[k]=ry+d; return d; };
  const disteso=p.excluded?0:(p.oriz||0), forza=0.45+0.55*clamp(Math.hypot(p.vx,p.vz)/1.4,0,1);
  const dPet=segui('petto',0.07,0.3), dBac=segui('bacino',0.17+0.05*disteso,0.42+0.3*disteso), dGam=segui('gambe',0.3+0.1*disteso,0.6+0.5*disteso);
  p.piega={ petto:dPet*forza, bacino:dBac*forza, gambe:dGam*forza };
  p.curva=clamp(dBac*forza/0.5,-1,1);                          // > 0 = sta girando a destra
  const T=computePose(p,dt,t); T.piega=p.piega; T.curva=p.curva;
  if(!p.J){ p.J={}; for(const k of JK) p.J[k]=T[k].slice(); }
  const J=p.J, k=1-Math.exp(-dt*(p.act?34:16));
  for(const key of JK){ const a=J[key], b=T[key]; a[0]+=(b[0]-a[0])*k; a[1]+=(b[1]-a[1])*k; a[2]+=(b[2]-a[2])*k; }
  R.g.position.set(p.x,0,p.z); R.g.rotation.y=Math.atan2(-p.fz,p.fx);
  const Jv=posturaVista(p,J,T.oriz||0);
  if(R.corpo){ aggiornaNumero(R,p.num); if(!(window.__pallanuoto&&window.__pallanuoto.senzaCorpi)) muoviCorpo(R,Jv,T,dt); }
  else {
    setSeg(R.torso,J.hip,J.chest); R.chest.position.set(J.chest[0],J.chest[1],J.chest[2]); R.pelvis.position.set(J.hip[0],J.hip[1],J.hip[2]);
    setSeg(R.bar,J.sL,J.sR); R.shR.position.set(J.sR[0],J.sR[1],J.sR[2]); R.shL.position.set(J.sL[0],J.sL[1],J.sL[2]);
    setSeg(R.uaR,J.sR,J.eR); setSeg(R.faR,J.eR,J.hR); setSeg(R.uaL,J.sL,J.eL); setSeg(R.faL,J.eL,J.hL);
    R.haR.position.set(J.hR[0],J.hR[1],J.hR[2]); R.haL.position.set(J.hL[0],J.hL[1],J.hL[2]);
    setSeg(R.thR,J.hip,J.kR); setSeg(R.snR,J.kR,J.fR); setSeg(R.thL,J.hip,J.kL); setSeg(R.snL,J.kL,J.fL);
    R.head.position.set(J.head[0],J.head[1],J.head[2]);
  }
  R.spr.position.set(Jv.head[0],Jv.head[1]+0.3,Jv.head[2]);
  // posizione della palla in mano / davanti al nuotatore (coordinate mondo)
  let l=null;
  if(T.ballHand){ l=[J.hR[0]+0.02,J.hR[1]+0.13,J.hR[2]]; if(T.ballDavanti>0) l=mix3(l,PALLA_DAVANTI,T.ballDavanti); }
  if(l){ const c=p.fx, sn=-p.fz; p.ballW=[p.x+VIS*(l[0]*c+l[2]*sn), VIS*l[1], p.z+VIS*(-l[0]*sn+l[2]*c)]; } else p.ballW=null;
  // solo per il disegno: il pallanuotista ha braccia di lunghezza diversa da quelle di pose.js, quindi la palla tenuta in
  // mano viene spostata di quanto la sua mano vera dista da quella prevista. p.ballW (usato dal gioco per i lanci) non cambia:
  // il gioco non dipende dal disegno.
  p.ballVistaW=null;
  if(l && R.corpo && R.corpo.ossa.manoD && !(window.__pallanuoto&&window.__pallanuoto.senzaCorpi)){
    const c=p.fx, sn=-p.fz, h=Jv.hR, k=1-(T.ballDavanti||0);
    R.corpo.ossa.manoD.getWorldPosition(_mano);
    const hx=p.x+VIS*(h[0]*c+h[2]*sn), hy=VIS*h[1], hz=p.z+VIS*(-h[0]*sn+h[2]*c);
    p.ballVistaW=[p.ballW[0]+(_mano.x-hx)*k, p.ballW[1]+(_mano.y-hy)*k, p.ballW[2]+(_mano.z-hz)*k];
    // in nuotata con palla la si disegna appena davanti al viso, appoggiata sull'acqua tra le braccia (nel gioco resta più avanti)
    const dv=T.ballDavanti||0;
    if(dv>0){ const ox=Jv.head[0]+0.30-PALLA_DAVANTI[0], oy=0.05-PALLA_DAVANTI[1], oz=Jv.head[2];
      p.ballVistaW[0]+=dv*VIS*(ox*c+oz*sn); p.ballVistaW[1]+=dv*VIS*oy; p.ballVistaW[2]+=dv*VIS*(-ox*sn+oz*c); }
  }
  // contatto con l'acqua (scena.js), dove il corpo disegnato attraversa la superficie: attorno alle spalle da fermi, attorno a
  // testa e spalle in nuotata (il resto del corpo è sotto). Più forte quanto più ci si muove: da fermi, con la sola bicicletta,
  // resta un bordo leggero; cresce quando ci si alza (tiro, parata, lotta) e con la velocità; onda davanti a chi nuota veloce.
  const sp=Math.hypot(p.vx,p.vz), vel=clamp(sp/1.6,0,1), e=T.oriz||0, c=p.fx, sn=-p.fz;
  { const mx=(Jv.sL[0]+Jv.sR[0])/2*(1-e)+(Jv.head[0]+Jv.chest[0])/2*e, mz=(Jv.sL[2]+Jv.sR[2])/2*(1-e)+(Jv.head[2]+Jv.chest[2])/2*e;
    const i=p.iContatto??(p.iContatto=allPlayers.indexOf(p)), sforzo=clamp((J.chest[1]+0.06)/0.26,0,1);
    const forza=(1-e)*(0.22+0.5*sforzo+0.3*vel)+e*(0.3+0.6*vel);
    contatto(i,p.x+VIS*(mx*c+mz*sn),p.z+VIS*(-mx*sn+mz*c),R.g.rotation.y,0.5+0.12*e,0.5-0.08*e,R.g.visible?forza:0,R.g.visible?e*vel:0); }
  // spruzzo quando una mano rientra in acqua (bracciata, appoggio del braccio libero nel tiro): solo disegno, niente caso
  if(R.corpo && R.corpo.ossa.manoD && !(window.__pallanuoto&&window.__pallanuoto.senzaCorpi)){
    const Y=p.maniY||(p.maniY=[0,0]);
    [R.corpo.ossa.manoD,R.corpo.ossa.manoS].forEach((o,k)=>{ o.getWorldPosition(_mano);
      if(Y[k]>0.04&&_mano.y<=0.04) evento(T.swim?'bracciata':'appoggio',_mano.x,0,_mano.z,T.swim?clamp(0.3+sp/2.4,0.3,1):0.4,p.vx,p.vz);
      Y[k]=_mano.y; });
  }
  // scia: nasce ogni 0,28 m percorsi (non a tempo), dietro il corpo e allungata nel verso in cui ci si sposta davvero; più grande
  // se si va veloci; ogni due scie, oltre metà velocità, due scie laterali che si aprono a V dai fianchi. L'onda davanti la fa il
  // contatto (scena.js). Solo disegno: rndGrafica.
  if(T.swim && sp>0.3){ p.sciaD=(p.sciaD||0)+sp*dt; if(p.sciaD>=0.28){ p.sciaD=0;
    const f=0.45+0.75*vel, ux=p.vx/sp, uz=p.vz/sp;
    spawnFoam(p.x-ux*VIS*1.0+(rndGrafica()-0.5)*0.2,p.z-uz*VIS*1.0+(rndGrafica()-0.5)*0.2,(0.2+rndGrafica()*0.1)*f,0.8,ux,uz);
    p.sciaV=!p.sciaV;
    if(p.sciaV&&vel>0.5) for(const l of [1,-1]){ const a=0.45*l, dx=ux*Math.cos(a)-uz*Math.sin(a), dz=ux*Math.sin(a)+uz*Math.cos(a);
      spawnFoam(p.x-ux*VIS*0.4-uz*l*0.22,p.z-uz*VIS*0.4+ux*l*0.22,0.11*f,0.8,dx,dz); } } }
  // elevazione e ricaduta del busto (tiro, parata, muro): dalla velocità con cui il petto sale o scende
  { const yP=VIS*J.chest[1], vy=p.pettoY===undefined?0:(yP-p.pettoY)/Math.max(dt,1e-3); p.pettoY=yP;
    if(vy>0.9&&!p.salito){ p.salito=true; evento('elevazione',p.x,0,p.z,clamp(vy/2.2,0.2,1)); }
    else if(vy<-0.9&&p.salito){ p.salito=false; evento('ricaduta',p.x+p.fx*0.2,0,p.z+p.fz*0.2,clamp(-vy/2,0.2,1)); }
    else if(Math.abs(vy)<0.1&&yP<0.05) p.salito=false; }
  // lotta al centro: acqua mossa tra i due corpi
  if(fight.active&&p===fight.boa){ p.lottaT=(p.lottaT||0)-dt; if(p.lottaT<=0){ p.lottaT=0.35; const d=fight.def;
    evento('lotta',(p.x+d.x)/2,0,(p.z+d.z)/2,0.6); } }
  // parata: quando la palla arriva al portiere che si è allungato, nel punto delle sue mani
  if(p.isGK&&p.parataIn&&!p.parataFatta&&ball.state==='flight'&&ball.kind==='shot'&&Math.hypot(ball.x-p.x,ball.z-p.z)<1.4){ p.parataFatta=true;
    const m=R.corpo&&R.corpo.ossa.manoD?R.corpo.ossa.manoD.getWorldPosition(_mano):_mano.set(p.x,0.6,p.z); evento('parata',m.x,m.y,m.z,1); }
  if(!p.parataIn) p.parataFatta=false;
}
