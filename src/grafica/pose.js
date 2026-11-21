import { FINTA_LATO, fintaDi } from '../finte.js';
import * as THREE from 'three';
// Pose e animazioni: nuotata, posizione verticale, gesti di tiro e passaggio
import { BRV, VIS, clamp, dist, rndGrafica } from '../costanti.js';
import { aggiornaNumero, muoviCorpo } from './corpo.js';
import { setSeg } from './modello.js';
import { contatto, spawnFoam } from './scena.js';
import { evento } from './acqua-eventi.js';
import { allPlayers, ball, fight, game, goalX } from '../stato.js';
import { shotKind } from '../tiri.js';
import { braccioMuro, braccioVerso } from '../muro.js';
import { visoGiocatore } from './espressioni.js';
import { puoMuoversiSuFallo } from '../gioco-fermo.js';
import { conservaGestoVista, frustaVista, preparaGestoVista, raccordaGestoVista, smussoGestoVista } from './gesto-vista.js';
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
  rovesciata:{K:[0.28,0.12,0.30],R:[-0.30,0.30,0.34],F:[-0.46,0.12,0.30],lift:0.12,tw0:0.45,tw1:-0.6,ind:0}, // rovesciata (v0.45): palla di lato, braccio teso che frusta all'indietro verso la porta
  polso:{K:[0.02,0.46,0.10],R:[0.30,0.52,0.02],F:[0.36,0.30,-0.10],lift:0.14,tw0:-0.12,tw1:0.18,ind:0.15},     // tiro di solo polso: quasi senza caricare
  torsione:{K:[-0.34,0.44,0.06],R:[0.36,0.50,-0.20],F:[0.36,-0.02,-0.38],lift:0.30,tw0:-1.05,tw1:0.95,ind:1},   // busto verso il primo palo, chiusura in diagonale
  // controfuga (sezione 4). Colonnello: la mano forte prende la palla dall'acqua, la porta vicino alla spalla e la spinge avanti.
  colonnello:{K:[0.06,0.30,0.16],R:[0.52,0.34,0.04],F:[0.58,0.16,-0.04],lift:0.04,tw0:-0.2,tw1:0.1,ind:0},
  // Schizzo (gesto di Ale): disteso, la mano forte parte indietro a pelo d'acqua e colpisce la palla di schiaffo
  schizzo:{K:[-0.26,0.02,0.34],R:[0.46,-0.04,0.04],F:[0.56,0.02,-0.18],lift:0,tw0:-0.35,tw1:0.25,ind:0}
};
const PALLA_DAVANTI=[0.62,0.08,0];     // in nuotata la palla si spinge davanti alla testa, tra le braccia
export function computePose(p,dt,t){
  const sp=Math.hypot(p.vx,p.vz), hold=ball.holder===p;
  // Una nuova ricezione interrompe il recupero del gesto precedente: il pallone
  // torna nella mano o davanti alla testa appena il giocatore riparte a nuotare.
  const act=hold&&p.act?.done?null:p.act, J={ballHand:false,ballDavanti:0,swim:false,oriz:0,dorso:0};
  let th=null,c=0,w=0,f=0;
  let wb=0;      // wb = rotazione del busto, w = braccio: il busto parte prima e il braccio segue (catena cinetica)
  if(act){ th=THROW[act.kind]||THROW.shot; c=act.wind>0?clamp(act.t/act.wind,0,1):1;
    const fr=act.frusta||0.09, tt=act.t-act.wind;
    wb=ease(clamp(tt/Math.min(fr,0.125),0,1));                 // il busto ruota in circa 125 ms (dato riportato nella tesi)
    w=ease(clamp((tt-0.25*fr)/(0.75*fr),0,1)); f=clamp((tt-fr)/0.3,0,1); }
  else if(p.charging){ const k=shotKind(p); th=THROW[k==='beduina'||k==='sciarpa'||k==='rovesciata'?k:'shot']; c=clamp(p.chargeT/0.5,0,1); }
  // quanto il corpo è disteso (lo decide la fisica: fisica.js): 0 verticale, 1 orizzontale. Tutto sfuma tra le due pose.
  const o=p.excluded&&p.alPozzetto?0:(p.oriz||0), e=ease(o);      // l'espulso nuota fino al pozzetto, poi aspetta in verticale
  const frena=(p.orizPrec||0)>o+1e-6 ? Math.sin(Math.PI*o) : 0; p.orizPrec=o;      // sta tornando verticale: remata di freno
  if(o>0.02&&(p.comparsa||game.state==='play'||game.state==='paused'||puoMuoversiSuFallo(p))) p.phase+=dt*(3.2+sp*1.9);
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
  // il centrale tra i pali con l'uomo in meno (v0.56, ia.js postiInferiorita): copre il palo lungo con il braccio di quella parte
  const cl=p.copreLungo, copre = !hold && !p.isGK && !defUp && cl && game.time-cl.t<0.3 && h && h.team!==p.team && game.state==='play';
  const copreAlto = copre && (h.charging || (h.act && !h.act.done && h.act.kind!=='pass'));
  J.alzato=muro||abbocca||copreAlto; J.marca=defUp||copre;      // per l'inclinazione disegnata (posturaVista, v0.55)
  // SALTO DI PREPARAZIONE del portiere (v0.61, replay del tiro di Mandić alle Olimpiadi): mentre l'avversario carica il tiro
  // il portiere sale fuori dall'acqua con le braccia spalancate e alte, poi si allunga sulla palla. Solo disegno.
  const gkPrep = p.isGK && !hold && !gkSave && h && h.team!==p.team && game.state==='play' &&
    (h.charging || (h.act && !h.act.done && PREPARA_GK.tiri.includes(h.act.kind))) && Math.abs(h.x+12.5*p.team.dir)<PREPARA_GK.entro;
  let lz=0, ly=0, arrivo=0;
  if(th){ lift+=th.lift*(0.8+0.2*p.stamina)*c*(1-0.8*f); tw=(th.tw0*c*(1-wb)+th.tw1*wb)*(1-f); }      // chi è stanco esce meno dall'acqua
  else if(gkSave){
    lz=clamp((ball.crossZ-p.z)*Math.sign(p.fx||1),-1.25,1.25)/VIS; ly=clamp(ball.y,0.25,1.5)/VIS;      // mani fino a 1,5 m (salto con la mano tesa: 1,56 ± 0,09 m, Zinner 2015)      // dove passerà la palla, nel sistema del portiere
    arrivo=ease(clamp(ball.flightT/0.22,0,1)); lean=clamp(lz/0.7,-1,1); lift+=0.34;
  }
  else if(gkPrep) lift+=PREPARA_GK.su;
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
  // dove guardano i palmi (solo disegno, corpo.js ruota avambraccio e polso): di base remano a pelo d'acqua, palmo in giù
  let nR=[0.1*Math.cos(eg),-1,0.25], nL=[-0.1*Math.cos(eg),-1,-0.25];
  if(gkSave){
    // braccia larghe e alte, poi ci si allunga verso la palla: due mani se arriva vicino al corpo, una se è laterale
    // parata alta (palla sopra 1 m): due braccia sopra la testa anche se è un po' laterale
    const due=Math.abs(lz)<0.3||(ly*VIS>1.0&&Math.abs(lz)<0.6), lR=add3(vSR,[0.14,0.34,0.36]), lL=add3(vSL,[0.14,0.34,-0.36]);
    hR = lz>=0||due ? mix3(lR,[0.24,ly,lz+(due?0.09:0)],arrivo) : lR;
    hL = lz<0||due ? mix3(lL,[0.24,ly,lz-(due?0.09:0)],arrivo) : lL;
    hintR=[0,-0.3,1]; hintL=[0,-0.3,-1];
    nR=[1,0.15,0.2]; nL=[1,0.15,-0.2];      // palmi verso la palla
  }
  else if(gkPrep){ hR=add3(vSR,PREPARA_GK.mano); hL=add3(vSL,[PREPARA_GK.mano[0],PREPARA_GK.mano[1],-PREPARA_GK.mano[2]]);
    hintR=[0,-0.3,1]; hintL=[0,-0.3,-1]; nR=[1,0.15,0.25]; nL=[1,0.15,-0.25]; }      // palmi verso il tiratore
  // palla vicina: portiere pronto, gomiti piegati e larghi, mani avanti all'altezza delle spalle con i palmi verso il tiratore
  else if(p.isGK&&!hold&&vicinaGK>0.02){ hR=mix3(hR,add3(vSR,[0.24,0.10,0.24]),vicinaGK); hL=mix3(hL,add3(vSL,[0.24,0.10,-0.24]),vicinaGK);
    hintR=[-0.2,-1,0.7]; hintL=[-0.2,-1,-0.7]; nR=mix3(nR,[1,-0.1,0.15],vicinaGK); nL=mix3(nL,[1,-0.1,-0.15],vicinaGK); }
  else if(p.cinqueUntil>game.time){ hR=add3(vSR,[0.30,0.52,0.06]); hintR=[0,-0.3,1]; nR=[1,0.1,0]; lift+=0.05; }      // cambio: il «cinque» con il compagno
  else if(muro||abbocca||(defUp&&!(p.fintaC>game.time))){
    // braccio dalla parte del palo da coprire (muro.js); alto a murare quando l'avversario tira, a metà quando lo marca
    const alto=muro||abbocca, su=alto?[0.16,0.74,0.08]:[0.28,0.34,0.05];
    if(!h||h.team===p.team||braccioMuro(p,h)==='D'){ hR=add3(vSR,[su[0],su[1],su[2]]); hintR=[0,-0.3,1]; nR=[1,0.1,0]; }
    else { hL=add3(vSL,[su[0],su[1],-su[2]]); hintL=[0,-0.3,-1]; nL=[1,0.1,0]; }
  }
  else if(copre){
    const su=copreAlto?[0.16,0.74,0.10]:[0.24,0.46,0.08];
    if(braccioVerso(p,cl.lato,h.team.dir||1)==='D'){ hR=add3(vSR,su); hintR=[0,-0.3,1]; nR=[1,0.1,0]; }
    else { hL=add3(vSL,[su[0],su[1],-su[2]]); hintL=[0,-0.3,-1]; nL=[1,0.1,0]; }
  }
  else if(p.fintaC>game.time&&!hold){ hR=add3(vSR,[0.50,0.04,-0.04]); hintR=[0,-0.6,1]; nR=[0.3,-1,0]; }      // contrasto di disturbo: la mano parte verso la palla
  // v0.55 (Ale: «tengono la palla come un vassoio»): mano DIETRO la palla, palmo rivolto in avanti e un po' in su, dita aperte;
  // la palla disegnata si appoggia sul palmo (ballVistaW), la posizione di gioco p.ballW non cambia
  else if(hold&&!th){ hR=add3(vSR,HOLD); hintR=[-0.3,-0.6,1]; J.ballHand=true; nR=[0.85,0.5,0.12]; }
  if(presa>0.01){ const v=[pallaL[0]-vSR[0],pallaL[1]-vSR[1],pallaL[2]-vSR[2]], l=Math.hypot(v[0],v[1],v[2])||1, m=Math.min(1,0.55/l); hR=mix3(hR,add3(vSR,[v[0]*m,Math.max(0.1,v[1]*m),v[2]*m]),presa); hintR=[0,-0.4,1]; }
  if(presa>0.01) nR=mix3(nR,[pallaL[0]-vSR[0],pallaL[1]-vSR[1],pallaL[2]-vSR[2]],presa);      // palmo verso la palla in arrivo
  if(th){ hL=[vSL[0]+0.36,-0.03,vSL[2]-0.10]; hintL=[0,-1,-0.4]; nL=[0,-1,-0.2]; }      // il braccio libero fa appoggio sull'acqua (a pelo d'acqua)
  const schizzo=th===THROW.schizzo;
  if(fight.active && !th){
    // braccia vive nella lotta: il difensore spinge a mani alterne sulla schiena e sul fianco del centroboa; il centroboa rema
    // dietro di sé per tenere la posizione (la mano con la palla non cambia: da lì parte il tiro)
    const wl=t*5.2+p.uid*1.3, a1=Math.sin(wl), a2=Math.sin(wl+Math.PI);
    if(p===fight.def){ hR=hold?add3(vSR,[0.36,0.14,-0.08]):add3(vSR,[0.34+0.05*a1,0.12+0.04*a1,-0.07]); hL=add3(vSL,[0.31+0.05*a2,0.02+0.05*a2,0.09]); hintR=[0,-1,0.5]; hintL=[0,-1,-0.5]; vHip[1]+=0.06; vChest[0]+=0.06; if(!hold) nR=[1,0,-0.2]; nL=[1,0,0.2]; }      // spinge con i palmi
    else if(p===fight.boa){ hL=add3(vSL,[-0.27+0.04*a1,-0.06+0.03*a2,-0.13-0.03*a1]); hintL=[0.3,-1,-0.6]; nL=[-1,-0.4,0]; if(!hold){ hR=add3(vSR,[-0.25+0.04*a2,-0.06+0.03*a1,0.13+0.03*a2]); nR=[-1,-0.4,0]; } vHip[0]-=0.08; }      // rema all'indietro
  }
  // dorso di attesa: semi-seduti sul dorso, gambe a bicicletta, braccia larghe che remano ai lati, sguardo alla palla.
  // Lo usa chi arretra piano e chi, sul perimetro, aspetta il passaggio da un compagno lontano.
  const libero = !th && !hold && !p.isGK && !defUp && !copre && !abbocca && !p.excluded && o<0.05 && !(fight.active&&(p===fight.def||p===fight.boa));
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
    hintR=[-0.3,-0.4,1]; hintL=[-0.3,-0.4,-1]; J.dorso=d; nR=mix3(nR,[0.2*Math.sin(eg),-1,0.5],d); nL=mix3(nL,[-0.2*Math.sin(eg),-1,-0.5],d);
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
  // nuoto: in trazione il palmo spinge l'acqua indietro, nel recupero esce dall'acqua di taglio, rivolto indietro e in fuori
  const palmoNuoto=(a,lato)=>Math.sin(a)>0?[-1,-0.5,lato*0.1]:[-0.6,0.25,lato*0.75];
  if(e>0.01){ nR=mix3(nR,hold?[0.2,-1,0.1]:palmoNuoto(ph,1),e); nL=mix3(nL,hold?[0.2,-1,-0.1]:palmoNuoto(ph+Math.PI,-1),e); }
  J.oriz=e; J.swim=o>0.5;
  if(hold&&!th){ J.ballHand=true; J.ballDavanti=e; }
  if(th){
    // al rilascio del tiro classico il gomito non è del tutto disteso: circa 147° nei semi-professionisti, 157° nei
    // professionisti (dati riportati nella tesi); nella tesi a gomito più disteso corrisponde palla più veloce
    let R=th.R;
    if(th===THROW.shot){ const ang=(146.7+10.8*clamp((p.st.sht-0.7)/0.3,0,1))*Math.PI/180, d=Math.sqrt(L1*L1+L2*L2-2*L1*L2*Math.cos(ang))/Math.hypot(R[0],R[1],R[2]); R=[R[0]*d,R[1]*d,R[2]*d]; }
    let off=mix3(HOLD,th.K,c); off=mix3(off,R,w); off=mix3(off,th.F,f);
    hR=add3(J.sR,off); hintR=[-0.4,-0.6,1];
    // palmo: sotto la palla caricando, verso la porta al rilascio, in giù nella chiusura
    nR=mix3(mix3([0.85,0.5,0.1],[1,0.15,0],w),[0.3,-0.9,0],f);      // v0.55: palmo dietro la palla, non sotto
    // FIN pp.14–16: il corpo minaccia la porta, il solo braccio indirizza il passaggio.
    // La posa del mancino sarà specchiata sotto: invertiamo prima l'angolo locale.
    if(th===THROW.pass && act?.aim){
      const dx=act.aim[0]-p.x,dz=act.aim[1]-p.z;
      const avanti=dx*p.fx+dz*p.fz,lato=(-dx*p.fz+dz*p.fx)*(p.mano==='S'?-1:1);
      const ang=Math.atan2(lato,avanti)*c*(1-f),ca=Math.cos(ang),sa=Math.sin(ang);
      const ruota=v=>[v[0]*ca-v[2]*sa,v[1],v[0]*sa+v[2]*ca];
      hR=add3(J.sR,ruota(off)); nR=ruota(nR); hintR=ruota(hintR);
    }
    if(th===THROW.schizzo) nR=[1,-0.3,0];      // schiaffo: palmo dritto contro la palla
    // schizzo: la mano debole tiene la palla a pelo d'acqua davanti al corpo finché la mano forte non la colpisce
    if(schizzo&&w<1){ hL=add3(J.sL,[0.44,-0.10,0.22]); hintL=[0,-1,-0.4]; nL=[0,1,0]; }      // palmo in su, sotto la palla
    if(hold && !(act&&act.done&&act.kind!=='fake')) J.ballHand=true;
  }
  // Reazione reale al gol, registrata insieme alla diretta: il marcatore alza
  // la mano soltanto a palla in rete. Nessuna modifica a nuoto, tiro o gambe.
  if(ball.inRete&&ball.shooter===p&&game.state==='stop'&&!p.excluded&&!p.isGK&&o<0.4&&
    ball.tiroReplay?.uid===p.uid&&ball.tiroReplay.numero===p.num){
    const esulta=ease(clamp((2.6-game.timer-0.06)/0.24,0,1));
    hR=mix3(hR,add3(J.sR,[0.06,0.55,0.16]),esulta);
    hintR=mix3(hintR,[-0.4,0.1,1],esulta); nR=mix3(nR,[0.2,0.8,0.3],esulta);
  }
  [J.eR,J.hR]=ik(J.sR,hR,L1,L2,hintR); [J.eL,J.hL]=ik(J.sL,hL,L1,L2,hintL);
  J.nR=nR; J.nL=nL;
  // MANCINI (sezione 4): con la palla e nei gesti la posa è quella del destro vista allo specchio (destra e sinistra
  // scambiate), quindi la palla sta e parte dalla mano sinistra
  if(p.mano==='S' && (hold||th)) specchia(J);
  return J;
}
const COPPIE=[['sR','sL'],['eR','eL'],['hR','hL'],['kR','kL'],['fR','fL'],['nR','nL']];
function specchia(J){
  for(const [a,b] of COPPIE){ const t=J[a]; J[a]=J[b]; J[b]=t; }
  for(const k of ['hip','chest','head','sL','sR','eL','eR','hL','hR','kL','kR','fL','fR','nR','nL']) if(J[k]) J[k]=[J[k][0],J[k][1],-J[k][2]];
  J.manoS=true;
}
//</POSE>
export const JK=['hip','chest','head','sL','sR','eL','eR','hL','hR','kL','kR','fL','fR'];
const _mano=new THREE.Vector3();
const _normalePresa=new THREE.Vector3(), _scalaPresa=new THREE.Vector3(), _quaternionePresa=new THREE.Quaternion();
// POSTURA DISEGNATA IN NUOTATA (solo disegno: le giunture del gioco, da cui parte la palla, restano quelle di computePose).
// Nel crawl da pallanuoto la testa e le spalle stanno fuori dall'acqua e il corpo è inclinato: bacino e gambe scendono.
// Le giunture del corpo disegnato vengono quindi alzate di SU_NUOTO (testa e spalle a pelo d'acqua) e la parte bassa
// (bacino, ginocchia, piedi) ruota verso il basso di INCLINA_NUOTO attorno alle spalle; tutto in proporzione a quanto il
// corpo è disteso, quindi da verticale non cambia nulla e il passaggio resta continuo.
const SU_NUOTO=0.09, INCLINA_NUOTO=0.42, BASSI=['hip','kL','kR','fL','fR'];
// CORPO INCLINATO ANCHE DA VERTICALI (v0.55, Ale: «chi sta dritto in acqua è un corpo inerme, non riesce a muoversi; sei sempre
// mezzo inclinato per coprire più spazio con gambe e mani, come un polpo»): bacino e gambe vanno indietro rispetto alle spalle,
// di più per chi difende sull'uomo; quasi dritti solo per tirare, murare o parare. Smussato nel tempo. Solo disegno.
export const INCLINA_VERT={ base:0.42, marca:0.62, gesto:0.12, portiere:0.12 };
// LOTTA AL CENTRO (v0.55, Ale: «l'attaccante è di spalle alla porta e si appoggia al petto del difensore; i due spingono in direzioni
// opposte, l'attaccante all'indietro e il difensore in avanti»): con il difensore DIETRO il centroboa, il centroboa si inclina
// all'indietro verso di lui e il difensore in avanti verso il centroboa, e i busti si avvicinano fino al contatto (spostamento
// della sola parte alta verso l'avversario, LOTTA.contatto). In anticipo (difensore davanti) entrambi si inclinano l'uno verso
// l'altro. Solo disegno: posizioni e lotta del gioco invariate.
// I corpi non si compenetrano (v0.55, Ale: «va bene stare vicini ma non ci si può fondere»): la parte alta si avvicina solo fino a
// LOTTA.schiena tra i centri se l'avversario è dietro (petto contro schiena) e LOTTA.faccia se è davanti (teste e visi in mezzo).
export const PALLA_FUORI=0.36;
export const LOTTA={ indietro:0.5, avanti:0.7, contatto:0.17, schiena:0.5, faccia:0.7 };
function lottaVista(p){
  if(!fight.active||(p!==fight.boa&&p!==fight.def)) return null;
  const o=p===fight.boa?fight.def:fight.boa; if(!o) return null;
  const dx=o.x-p.x,dz=o.z-p.z,l=Math.hypot(dx,dz)||1, av=(dx*p.fx+dz*p.fz)/l, la=(-dx*p.fz+dz*p.fx)/l;
  // ciascuno fa metà della strada fino alla distanza minima (mai oltre LOTTA.contatto): petto contro schiena se uno dei due ha
  // l'altro alle spalle, altrimenti faccia a faccia
  const dietroUno=av<0||((o.fx*-dx+o.fz*-dz)/l)<0, minimo=dietroUno?LOTTA.schiena:LOTTA.faccia;
  // chi è già mezzo disteso (difensore di traverso) ha la testa in avanti: la spinta di contatto cala con l'assetto
  const spinta=Math.min(LOTTA.contatto,Math.max(0,(l-minimo)/2))*(1-Math.max(p.oriz||0,o.oriz||0));
  // inclinazione verso l'avversario: se è davanti ci si inclina in avanti (iv positivo), se è dietro all'indietro (iv negativo)
  const verso=av>=0?1:-1, iv=verso>0?(p===fight.def?LOTTA.avanti:INCLINA_VERT.marca):-LOTTA.indietro;
  return { iv:iv*Math.abs(av)+INCLINA_VERT.base*(1-Math.abs(av)), sx:av*spinta, sz:la*spinta };
}
// regola generale: due giocatori più vicini di CORPI_MIN (centro a centro) allontanano ciascuno la propria parte alta di metà della
// differenza, nel sistema del giocatore. Così testa, spalle e braccia non si fondono anche quando il gioco li mette molto vicini.
export const CORPI_MIN=0.56;
function separaVista(p){
  let sx=0, sz=0;
  for(const q of allPlayers){ if(q===p||q.excluded) continue;
    const dx=p.x-q.x, dz=p.z-q.z, d=Math.hypot(dx,dz); if(d>=CORPI_MIN) continue;
    const u=d>1e-3?[dx/d,dz/d]:[p.fz,-p.fx], m=(CORPI_MIN-d)/2;
    sx+=(u[0]*p.fx+u[1]*p.fz)*m; sz+=(-u[0]*p.fz+u[1]*p.fx)*m; }
  return sx||sz?[sx,sz]:null;
}
function inclinazioneVerticale(p,T,dt){
  const L=lottaVista(p), sep=separaVista(p);
  p.lottaSpinta=L||sep?[(L?L.sx:0)+(sep?sep[0]:0),(L?L.sz:0)+(sep?sep[1]:0)]:null;
  // Al fischio si alzano soltanto gli attori del fallo; gli altri conservano l'assetto utile al movimento.
  const tiro=ball.holder===p&&(p.charging||(p.act&&!p.act.done)), voluta=game.state!=='play'&&!puoMuoversiSuFallo(p)?0:L&&!tiro?L.iv:p.isGK?INCLINA_VERT.portiere:(T.alzato||tiro)?INCLINA_VERT.gesto:T.marca?INCLINA_VERT.marca:INCLINA_VERT.base;
  const k=1-Math.exp(-dt*6); p.inclVert=(p.inclVert??voluta)+(voluta-(p.inclVert??voluta))*k; return p.inclVert;
}
function posturaVista(p,J,e,iv=0){
  if(e<0.001&&Math.abs(iv)<0.001&&!p.lottaSpinta) return J;
  const V=p.Jv||(p.Jv={}), su=SU_NUOTO*e, a=INCLINA_NUOTO*e-iv*(1-e), ca=Math.cos(a), sa=Math.sin(a);
  const cx=(J.sL[0]+J.sR[0])/2, cy=(J.sL[1]+J.sR[1])/2;
  for(const k of JK){ const q=J[k], v=V[k]||(V[k]=[0,0,0]); v[0]=q[0]; v[1]=q[1]+su; v[2]=q[2]; }
  for(const k of BASSI){ const q=J[k], v=V[k], dx=q[0]-cx, dy=q[1]-cy; v[0]=cx+dx*ca-dy*sa; v[1]=cy+dx*sa+dy*ca+su; }
  // lotta al centro: la parte alta va verso l'avversario fino al contatto (spalle, testa, braccia; il bacino la metà)
  const S=p.lottaSpinta;
  if(S){ for(const k of JK){ const f=k==='hip'?0.5:BASSI.includes(k)?0:1, v=V[k]; v[0]+=S[0]*f; v[2]+=S[1]*f; } }
  return V;
}
// Layer soltanto visuale: J e p.ballW conservano la posa fisica e gli stessi
// istanti di rilascio. Il gomito caricato è piegato, poi busto, braccio e polso
// accelerano in successione senza aggiungere un'attesa al comando.
export const PALMO_PALLA=[0.85,0.5,0.1];
// v0.61: alzata del tiro da fuori (unità del corpo, ×1,45 = metri: 0,12 = 17 cm in più) da ALZATA_TIRO.da metri dalla porta,
// piena dopo altri ALZATA_TIRO.rampa metri; salto di preparazione del portiere (su, mani rispetto alle spalle, entro quanti metri)
export const ALZATA_TIRO={ su:0.12, da:5, rampa:2 };
export const PREPARA_GK={ su:0.2, mano:[0.12,0.36,0.40], entro:10, tiri:['shot','torsione','polso','lob','beduina','sciarpa','rovesciata','colonnello','schizzo'] };
// ACCOMPAGNAMENTO dopo il rilascio (v0.55, Ale: «non gli sta dando uno schiaffo, è un accompagnamento»): la mano continua verso il
// bersaglio con il braccio quasi disteso, all'altezza del petto, palmo verso la porta e dita che puntano dove va la palla; poi
// scende piano (rientra). Prima la mano finiva sotto la spalla e attraverso il corpo con il palmo in giù. Solo disegno.
// v0.63: palombella con il gomito appena piegato (circa 155°) nell'accompagnamento; prima il braccio restava teso come un bastone
export const ACCOMPAGNA={ shot:[0.54,0.20,-0.08], torsione:[0.50,0.18,-0.20], polso:[0.46,0.30,-0.04], pass:[0.48,0.26,-0.02], lob:[0.38,0.43,0.0] };
// passaggio di lato (v0.63): quota dell'angolo verso il compagno fatta girando il busto (opposto = dalla parte opposta al braccio che
// passa, stesso = dalla sua parte), giro massimo del busto e della testa (rad)
export const PASSAGGIO_VISTA={ opposto:0.7, stesso:0.35, max:1.1, testa:1.3 };
// ricezione (v0.63): chi aspetta un passaggio gira la testa verso la palla in volo, fino a RICEZIONE_TESTA rad
export const RICEZIONE_TESTA=1.2;
// fine di passaggio e palombella (v0.63): dove torna la mano, rispetto alla spalla (in acqua, di lato, come per remare)
export const FINE_LEGGERO=[0.18,-0.12,0.38];
// PESCA DELLA PALLA DALL'ACQUA (v0.63, punto 9: Mandić nel video di Ale): durata massima (s, al massimo 0,8 della carica del gesto),
// fasi (la mano arriva sulla palla, ci passa sotto, la porta su) e dove la porta: di lato, all'altezza della spalla
export const PESCA={ durata:0.32, arriva:0.32, sotto:0.52, spalla:[0.06,0.16,0.27] };
// ESULTANZA (v0.63, punto 10): quanto si alza il corpo (unità del corpo, ×1,45 = metri), altezza della mano sopra la spalla, ampiezza
// e ritmo (colpi al secondo) del pugno agitato
export const ESULTA={ su:0.08, alto:0.48, pugno:0.07, ritmo:2.2 };
export const PALMO_ACCOMPAGNA=[0.85,-0.35,-0.1];
// palla tenuta alta (solo disegno): mano sopra il gomito, gomito in fuori all'altezza della spalla (angolo di circa 90°)
export const BRACCIA_SMUSSO={ base:14, gesto:40 };      // velocità di smussamento delle braccia disegnate (1/s)
export const BOA_ACQUA=[0.40,-0.06,0.08];
export const HOLD_VISTA=[-0.02,0.42,0.21], GOMITO_FUORI=[-0.1,-0.1,1], PROTEGGI_DIST=1.8, PROTEGGI_GIRO=1.2, TESTA_GIRO=1.1;
// onda del corpo in nuotata (rad): ampiezza a piena velocità, in più quando si è trattenuti, ritardo tra spalle, bacino e gambe
export const ONDA={ nuoto:0.11, presa:0.16, ritardo:0.95 };
const CARICA_VISTA={
  shot:[-0.20,0.36,0.08],torsione:[-0.22,0.34,0.10],fake:[-0.20,0.36,0.08],
  pass:[-0.12,0.37,0.12],lob:[-0.16,0.36,0.12],polso:[0.04,0.40,0.10],
  beduina:[0.29,0.08,0.28],sciarpa:[0.27,0.09,0.30],rovesciata:[0.27,0.14,0.27],
  colonnello:[0.05,0.30,0.22],schizzo:[-0.22,0.02,0.28]
};
function articolaVista(p,J,T,t,gestoVista){
  const V=p.giuntiVista||(p.giuntiVista={});
  for(const key of JK){ const q=J[key],v=V[key]||(V[key]=[0,0,0]); v[0]=q[0]; v[1]=q[1]; v[2]=q[2]; }
  // Copie: i palmi smussati della posa originale non diventano stato della nuova animazione.
  T.nR=T.nR.slice(); T.nL=T.nL.slice();
  const e=T.oriz||0, hold=ball.holder===p, lato=T.manoS?-1:1;
  T.polsoR=0.16+0.06*Math.sin(t*5.5+p.uid); T.polsoL=0.16-0.06*Math.sin(t*5.5+p.uid);
  // braccia morbide e distese (corpo.js, BRACCIO_MORBIDO): meno nella bracciata del crawl, che vuole il gomito alto
  T.morbidoR=T.morbidoL=1-0.75*(T.oriz||0);
  T.torsioneVista=Math.sin(p.phase)*0.06*e;
  T.alzataTiro=0;
  const braccio=(s,mano,hint,n,polso,k=1)=>{
    const suff=s>0?'R':'L', spalla=V['s'+suff];
    const h=mix3(V['h'+suff],mano,k), piega=ik(spalla,h,L1,L2,hint);
    V['e'+suff]=piega[0]; V['h'+suff]=piega[1];
    T['n'+suff]=mix3(T['n'+suff],n,k); T['polso'+suff]=T['polso'+suff]*(1-k)+polso*k;
  };
  if(e>0.001){
    // Recupero a gomito alto: la mano resta più bassa del gomito e rientra di
    // taglio; sott'acqua il palmo prende e spinge, anche quando si palleggia.
    for(const s of [1,-1]){
      const a=p.phase+(s>0?0:Math.PI), sn=Math.sin(a), cs=Math.cos(a), recupera=sn<0;
      const corta=(hold?0.8:1)*(1-0.42*clamp((p.curva||0)*s,-0.6,1));
      const spalla=V[s>0?'sR':'sL'];
      spalla[0]+=e*0.018*cs; spalla[1]+=e*0.025*Math.max(0,-sn)+e*0.03*cs;      // v0.55: rollio delle spalle con la bracciata
      const ingresso=hold?0:0.035*Math.pow(Math.max(0,cs),6);
      const mano=add3(spalla,[0.10+(hold?0.40:0.44)*cs*corta+ingresso,recupera?-0.08*sn:-0.28*sn,s*(0.04+(recupera?-0.14*sn:0.04*sn))]);
      const alto=ease(clamp((-sn+0.12)/0.3,0,1));
      const hint=mix3([-0.1,0.1,s],[-0.45,1,s*0.65],alto);
      const palmo=recupera?[-0.35,-0.05,s*0.9]:[-0.75,-0.65,s*0.08];
      braccio(s,mano,hint,palmo,recupera?-0.10+0.12*(-sn):0.12+0.22*sn,e);
    }
  }
  const a=hold&&p.act?.done?null:p.act;
  const kind=a?.kind||(p.charging?shotKind(p):null), th=kind?(THROW[kind]||THROW.shot):null;
  const suff=lato>0?'R':'L', locale=v=>[v[0],v[1],v[2]*lato];
  if(th) T['morbido'+suff]=0.2; else if(hold) T['morbido'+suff]=Math.min(T['morbido'+suff],0.45);
  if(!th&&p.ricevutoPassaggio&&hold){
    const eta=game.time-p.ricevutoT;
    if(eta>=0&&eta<0.18){
      // La presa cede verso il corpo e torna disponibile. Un nuovo gesto o il
      // ritorno al nuoto interrompe questo accompagnamento nello stesso frame.
      const da=p.daChi, dx=da?da.x-p.x:p.fx, dz=da?da.z-p.z:p.fz, len=Math.hypot(dx,dz)||1;
      const avanti=(dx*p.fx+dz*p.fz)/len, fianco=(-dx*p.fz+dz*p.fx)/len;
      const q=eta/0.18, assorbi=Math.sin(Math.PI*q)*(1-e);
      const spalla=V['s'+suff], mano=add3(spalla,[avanti*0.31,0.30,fianco*0.25]);
      braccio(lato,mano,locale([-0.4,0.35,1]),[avanti,0.6,fianco],-0.16,assorbi);
    }
  }
  if(!th){
    // Nel taglio coordinato il collo segue il portatore o la palla in volo;
    // busto e direzione fisica del nuoto restano quelli dell'avanzamento.
    if(!hold&&p.cut?.coordinata&&p.cut.guarda&&(game.state==='play'||puoMuoversiSuFallo(p))){
      const riferimento=ball.state==='flight'?ball:p.cut.guarda;
      const dx=riferimento.x-p.x,dz=riferimento.z-p.z;
      T.testaGiro=clamp(-Math.atan2(-dx*p.fz+dz*p.fx,dx*p.fx+dz*p.fz),-1.1,1.1);
    }
    // RICEZIONE (v0.63, foglio a tre lati): chi aspetta il passaggio guarda la palla che arriva (prima guardava dritto davanti a sé)
    if(!hold&&ball.state==='flight'&&ball.kind==='pass'&&ball.target===p){
      const dx=ball.x-p.x, dz=ball.z-p.z;
      T.testaGiro=clamp(-Math.atan2(-dx*p.fz+dz*p.fx,dx*p.fx+dz*p.fz),-RICEZIONE_TESTA,RICEZIONE_TESTA)*(1-e);
    }
    // ESULTANZA (v0.63, punto 10): dopo il gol chi ha segnato si alza con la bicicletta e agita il pugno con il braccio alzato
    // (prima alzava solo il braccio). È quello che il replay mostra nel primo piano. Solo disegno, a gioco fermo.
    if(!hold&&ball.inRete&&ball.shooter===p&&game.state==='stop'&&!p.excluded&&!p.isGK&&e<0.4&&ball.tiroReplay?.uid===p.uid&&ball.tiroReplay.numero===p.num){
      const te=2.6-game.timer, k=ease(clamp((te-0.06)/0.3,0,1))*(1-e), pugno=ease(clamp((te-0.35)/0.25,0,1));
      for(const j of JK) V[j][1]+=ESULTA.su*k;
      const batte=Math.sin(Math.max(0,te-0.35)*2*Math.PI*ESULTA.ritmo)*pugno;
      braccio(1,add3(V.sR,[0.08,ESULTA.alto+ESULTA.pugno*batte,0.14]),[-0.4,0.1,1],[0.2,0.8,0.3],0.1,k);
    }
    if(hold&&e<0.7){
      // v0.55 (Ale: «tengono la palla come un vassoio», «gomito girato al contrario»): palla alta come un pallanuotista, gomito
      // in fuori all'altezza della spalla, avambraccio dritto, mano DIETRO la palla con il palmo in avanti e il polso piegato
      // all'indietro (prima: palmo al cielo e gomito basso attaccato al fianco). Solo disegno: p.ballW non cambia.
      // PALLA PROTETTA (Ale: «terrei il braccio e la palla dietro la mia testa»): con un avversario vicino la palla va a braccio
      // teso dietro la testa, dalla parte opposta all'avversario (resta sul lato del braccio che la tiene)
      let o=null,od=PROTEGGI_DIST;
      for(const q of allPlayers){ if(q.team===p.team||q.excluded||q.isGK) continue; const d=Math.hypot(q.x-p.x,q.z-p.z); if(d<od){ od=d; o=q; } }
      // v0.55 (Ale: «posizione del braccio totalmente innaturale; il corpo e la testa devono essere girati»): per proteggere la
      // palla NON si stende il braccio dietro la schiena a busto fermo; si GIRANO spalle, busto e testa, mettendo la spalla libera
      // verso l'avversario e la palla dall'altra parte, con il braccio di lato e in alto (rotazione fino a PROTEGGI_GIRO rad)
      let k=0, giro=0;
      if(o){ const dx=o.x-p.x,dz=o.z-p.z,l=Math.hypot(dx,dz)||1, av=(dx*p.fx+dz*p.fz)/l, la=(-dx*p.fz+dz*p.fx)/l;
        k=clamp((PROTEGGI_DIST-od)/0.6,0,1);
        // la spalla della palla (z = lato) ruota verso la direzione opposta all'avversario
        let d=Math.atan2(-la,-av)-Math.atan2(lato,0); while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI;
        giro=clamp(d,-PROTEGGI_GIRO,PROTEGGI_GIRO)*k*(1-e);
        if(Math.abs(giro)>0.01){ const c=mix3(V.sL,V.sR,0.5), cs=Math.cos(giro), sn=Math.sin(giro);
          const ruota=v=>{ const x=v[0]-c[0], z=v[2]-c[2]; v[0]=c[0]+x*cs-z*sn; v[2]=c[2]+x*sn+z*cs; };
          for(const key of ['sR','sL','eR','eL','hR','hL']) ruota(V[key]); ruota(V.head);
          T.torsioneVista=(T.torsioneVista||0)+giro; }
        // testa e viso verso la porta (almeno di un quarto), non verso l'avversario: il collo gira fino a TESTA_GIRO oltre il busto
        { const g=[goalX(p.team)-p.x,-p.z], gl=Math.hypot(g[0],g[1])||1, ga=(g[0]*p.fx+g[1]*p.fz)/gl, gz=(-g[0]*p.fz+g[1]*p.fx)/gl;
          const versoPorta=clamp(Math.atan2(gz,ga),giro-TESTA_GIRO,giro+TESTA_GIRO);
          T.testaGiro=-versoPorta*k*(1-e); } }
      // CENTROBOA CON IL DIFENSORE DIETRO (v0.55, Ale: «la palla non può stare nel dorso della mano: o sta in acqua oppure il
      // giocatore per tenerla in mano si deve girare o tirare una beduina o una sciarpa»): finché non fa un gesto, la palla resta in
      // acqua davanti a lui, con la mano sopra (palmo in giù); girata, beduina e sciarpa sono i gesti che la alzano
      if(fight.active&&fight.boa===p&&fight.def){ const q=fight.def, dx=q.x-p.x, dz=q.z-p.z, l=Math.hypot(dx,dz)||1;
        if((dx*p.fx+dz*p.fz)/l<-0.3){
          braccio(lato,add3(V['s'+suff],locale(BOA_ACQUA)),locale([-0.2,-0.6,1]),locale([0.12,-1,0.05]),0.15,1-e);
          T.pallaInAcqua=1-e; return V; } }
      const R2=v=>{ const cs=Math.cos(giro), sn=Math.sin(giro); return [v[0]*cs-v[2]*sn,v[1],v[0]*sn+v[2]*cs]; };
      const mano=R2(locale(mix3(HOLD_VISTA,[-0.06,0.38,0.30],k))), n=R2(locale(mix3(PALMO_PALLA,[0.25,0.85,0.25],k)));
      braccio(lato,add3(V['s'+suff],mano),R2(locale(GOMITO_FUORI)),n,-0.28*(1-k)+0.1*k,1-e);
    }
    // BRACCIA «A POLPO» (v0.55): da verticali, senza palla e senza gesti, le mani remano larghe ai lati per coprire spazio
    if(!hold&&e<0.7&&!p.isGK){
      for(const s of [1,-1]){ const sf=s>0?'R':'L', sp=V['s'+sf], h=V['h'+sf];
        if(h[1]>sp[1]-0.02) continue;      // braccio già alzato (muro, marcatura, cinque): lo lascia com'è
        const g=Math.sin(t*3.2+p.uid+(s>0?0:1.3));
        braccio(s,add3(sp,[0.16+0.05*g,-0.13,s*(0.40+0.04*g)]),[0,-1,s*0.8],[0.1*g,-1,s*0.3],0.18,(1-e)*0.85);
      }
    }
    return V;
  }
  const fr=a?.frusta||0.18, tt=a?a.t-a.wind:0;
  const carica=gestoVista.carica;
  const volo=a?clamp(tt/fr,0,1):0, busto=ease(clamp((volo-0.02)/0.70,0,1));
  const braccioK=ease(clamp((volo-0.14)/0.86,0,1)), polso=ease(clamp((volo-0.62)/0.38,0,1));
  const chiude=a?clamp((tt-fr)/0.36,0,1):0, rientra=ease(clamp((chiude-0.55)/0.45,0,1));
  const base0=kind==='fake'?-0.84*(fintaDi(p).torsione):kind==='shot'||kind==='torsione'?-0.84:kind==='beduina'||kind==='rovesciata'?0.72:kind==='sciarpa'?-0.72:th.tw0;
  const base1=kind==='shot'?0.48:kind==='torsione'?0.72:th.tw1;
  // PASSAGGIO DI LATO (v0.63, foglio a tre lati): verso il compagno il busto gira (di più se il passaggio va dalla parte opposta al
  // braccio, dove prima l'avambraccio passava davanti al viso e la mano finiva sulla faccia), la testa lo guarda e la mano lo segue
  // anche nell'accompagnamento. Le gambe e il bacino restano verso la porta. Solo disegno.
  let angPass=0, giroPass=0;
  if(kind==='pass'&&a?.aim){
    const dx=a.aim[0]-p.x, dz=a.aim[1]-p.z, av=dx*p.fx+dz*p.fz, laM=-dx*p.fz+dz*p.fx;
    angPass=Math.atan2(laM*lato,av);      // nel sistema del destro: positivo = dalla parte del braccio che passa
    const k=(angPass<0?PASSAGGIO_VISTA.opposto:PASSAGGIO_VISTA.stesso)*carica*(1-rientra);
    giroPass=clamp(-angPass*k,-PASSAGGIO_VISTA.max,PASSAGGIO_VISTA.max);
    T.testaGiro=clamp(-Math.atan2(laM,av),-PASSAGGIO_VISTA.testa,PASSAGGIO_VISTA.testa)*carica*(1-rientra);
  }
  const twist=((base0*carica*(1-busto)+base1*busto)*(1-ease(chiude))+giroPass)*lato;
  const centro=mix3(V.sL,V.sR,0.5), mezzo=Math.hypot(V.sR[0]-V.sL[0],V.sR[2]-V.sL[2])/2;
  for(const s of [1,-1]){
    const spalla=V[s>0?'sR':'sL'];
    spalla[0]=centro[0]+s*mezzo*Math.sin(twist); spalla[2]=centro[2]+s*mezzo*Math.cos(twist);
    spalla[1]+=0.018*carica*(1-chiude)*(s===lato?1:-0.3);
  }
  T.torsioneVista=twist*(1-e*0.6);
  const avanti=(-0.025*carica*(1-busto)+0.035*busto)*(1-chiude);
  V.chest[0]+=avanti; V.head[0]+=avanti*0.6;
  let rilascio=th.R;
  if(kind==='shot'){
    const ang=(146.7+10.8*clamp((p.st.sht-0.7)/0.3,0,1))*Math.PI/180;
    const d=Math.sqrt(L1*L1+L2*L2-2*L1*L2*Math.cos(ang))/Math.hypot(...rilascio);
    rilascio=rilascio.map(v=>v*d);
  }
  // finta personale (finte.js): ogni giocatore ha il suo gesto (larga, a raffica, di polso, mezza, di bomba, di spalla)
  const fp=kind==='fake'?fintaDi(p):null;
  if(fp&&fp.alza){ const su=fp.alza*carica*(1-chiude); for(const k of ['head','chest','sR','sL']) V[k][1]+=su; }
  // TIRO DA FUORI (v0.61, Mandić e Varga nei video di Ale): chi tira forte da lontano esce dall'acqua molto di più, quasi fino ai
  // fianchi, in circa 0,4 s. Solo il corpo disegnato: la palla parte sempre da p.ballW (il raccordo di render.js unisce i due).
  if((kind==='shot'||kind==='torsione')&&a){
    const lontano=clamp((Math.hypot(12.5*p.team.dir-p.x,p.z)-ALZATA_TIRO.da)/ALZATA_TIRO.rampa,0,1);
    const k=lontano*carica*(1-0.7*chiude), su=ALZATA_TIRO.su*k;
    if(su>0) for(const j of JK) V[j][1]+=su;
    T.alzataTiro=k;      // corpo.js lascia salire il bacino fin quasi al pelo dell'acqua (le gambe restano sotto)
  }
  const caricata=mix3(HOLD_VISTA,fp?fp.vista:CARICA_VISTA[kind]||CARICA_VISTA.shot,carica);
  let off=tt>=0&&a&&kind!=='fake'
    ? frustaVista(gestoVista.off,caricata,rilascio,ACCOMPAGNA[kind]||th.F,tt,fr)
    : mix3(caricata,rilascio,braccioK);
  if(kind==='fake')off=mix3(off,ACCOMPAGNA[kind]||th.F,ease(clamp(chiude/0.55,0,1)));
  // gomito in fuori e un po' indietro durante la carica (prima indietro e in alto: con la mano davanti il braccio si girava
  // «ad ala di pollo», gomito sotto e dietro la spalla)
  let hint=mix3(mix3(GOMITO_FUORI,[-0.3,0.15,1],carica),[-0.08,0.05,1],braccioK);
  hint=mix3(hint,[0.15,-0.7,0.8],ease(chiude));
  // palmo: dietro la palla, in avanti e un po' in su durante la carica (prima rivolto al cielo, «a vassoio»), verso il bersaglio
  // al rilascio, in giù nella chiusura
  let n=mix3(PALMO_PALLA,kind==='beduina'||kind==='sciarpa'||kind==='rovesciata'?[-1,0.15,0.1]:[1,0.1,0],polso);
  n=mix3(n,ACCOMPAGNA[kind]?PALMO_ACCOMPAGNA:[0.15,-0.9,-0.2],ease(chiude));
  // finta di lato (v0.59, Varga): il braccio va verso il palo scelto, non dritto alla porta
  if(kind==='fake'&&p.fintaLatoGesto){
    const la=p.fintaLatoGesto*p.fx*lato, ang=Math.sign(la)*FINTA_LATO.gesto*carica*(1-chiude), c=Math.cos(ang),s=Math.sin(ang);
    const ruota=v=>[v[0]*c-v[2]*s,v[1],v[0]*s+v[2]*c];
    off=ruota(off); hint=ruota(hint); n=ruota(n);
  }
  if(kind==='pass'&&a?.aim){
    // il braccio punta al compagno fino al rientro (prima tornava dritto già nell'accompagnamento e attraversava la faccia)
    const ang=angPass*carica*(1-rientra), c=Math.cos(ang),s=Math.sin(ang);
    const ruota=v=>[v[0]*c-v[2]*s,v[1],v[0]*s+v[2]*c];
    off=ruota(off); hint=ruota(hint); n=ruota(n);
  }
  const spalla=V['s'+suff], target=add3(spalla,locale(off));
  // v0.63: dopo passaggio e palombella la mano rientra in acqua di lato (FINE_LEGGERO) invece di tornare davanti al mento
  const fine=kind==='pass'||kind==='lob'?add3(spalla,locale(FINE_LEGGERO)):V['h'+suff];
  let mano=mix3(target,fine,rientra), hintM=locale(hint), nM=locale(n);
  let flex=(-0.46*carica*(1-polso)+0.54*polso)*(1-ease(chiude))+(ACCOMPAGNA[kind]?0.38:0.20)*ease(chiude);
  // PESCA (v0.63, punto 9: Mandić nel video di Ale). Chi tira, passa o finta mentre nuota con la palla davanti alla testa prima la
  // prende dall'acqua: la mano arriva sulla palla, ci passa sotto e la porta di lato all'altezza della spalla, poi la carica di
  // sempre. La palla disegnata resta in acqua finché la mano non la raccoglie (prima saltava di colpo nella mano). Solo disegno: la
  // palla del gioco (p.ballW) e i tempi del gesto non cambiano; la pesca dura al massimo 0,8 della carica.
  const gestoId=a||(p.charging?'carica':null);
  if(gestoId!==p.pescaDi){ p.pescaDi=gestoId;
    // una pesca già cominciata continua anche se la carica del giocatore diventa un gesto (tocco breve di TIRO)
    const inCorso=p.pesca&&game.time-p.pesca.t0<p.pesca.D*1.35;
    if(!inCorso) p.pesca=gestoId&&kind!=='colonnello'&&kind!=='schizzo'&&hold&&(p.davantiVista||0)>0.5&&p.pallaDavantiLocale
      ? { t0:game.time, D:a?Math.min(PESCA.durata,0.8*Math.max(0.05,a.wind)):PESCA.durata, Pl:p.pallaDavantiLocale.slice() } : null; }
  if(p.pesca){
    const pe=p.pesca, u=(game.time-pe.t0)/pe.D;
    if(u<1.35&&hold){
      const sopra=add3(pe.Pl,[-0.03,0.07,0.03*lato]), sotto=add3(pe.Pl,[-0.07,-0.05,0.04*lato]), su=add3(V['s'+suff],locale(PESCA.spalla));
      const giu=[0.3,-1,0], palmoSu=[0.2,1,0.1*lato];
      let h, nn;
      if(u<PESCA.arriva){ h=sopra; nn=giu; }
      else if(u<PESCA.sotto){ const k=ease((u-PESCA.arriva)/(PESCA.sotto-PESCA.arriva)); h=mix3(sopra,sotto,k); nn=mix3(giu,palmoSu,k); }
      else { const k=ease(clamp((u-PESCA.sotto)/(1-PESCA.sotto),0,1)); h=mix3(sotto,su,k); nn=mix3(palmoSu,[0.5,0.7,0.2*lato],k); }
      const w=1-ease(clamp((u-1)/0.35,0,1));      // finita la pesca si passa con gradualità alla carica di sempre
      mano=mix3(mano,h,w); nM=mix3(nM,nn,w); hintM=mix3(hintM,[-0.1,0.2,lato],w); flex=flex*(1-w)+0.1*w;
      T.pescaPalla=u<PESCA.arriva?1:u<PESCA.sotto?1-ease((u-PESCA.arriva)/(PESCA.sotto-PESCA.arriva)):0; T.pescaPl=pe.Pl;
    } else p.pesca=null;
  }
  braccio(lato,mano,hintM,nM,flex);
  // Il braccio libero sostiene il sollevamento, senza duplicare il gesto di tiro.
  if(kind!=='schizzo'){
    const libero=-lato, sl=V[libero>0?'sR':'sL'];
    const appoggio=add3(sl,[0.31,-0.14-0.035*busto,libero*0.14]);
    braccio(libero,appoggio,[0,-1,libero*0.65],[0,-1,libero*0.1],0.28,(1-e*0.7)*carica*(1-rientra));
  }
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
  const disteso=p.excluded&&p.alPozzetto?0:(p.oriz||0), forza=0.45+0.55*clamp(Math.hypot(p.vx,p.vz)/1.4,0,1);
  const dPet=segui('petto',0.07,0.3), dBac=segui('bacino',0.17+0.05*disteso,0.42+0.3*disteso), dGam=segui('gambe',0.3+0.1*disteso,0.6+0.5*disteso);
  p.piega={ petto:dPet*forza, bacino:dBac*forza, gambe:dGam*forza };
  p.curva=clamp(dBac*forza/0.5,-1,1);                          // > 0 = sta girando a destra
  const T=computePose(p,dt,t); T.curva=p.curva;
  // NUOTO A SERPENTE (v0.55, Ale: «il nuoto di un pallanuotista è simile a un serpente, fluido anche perché deve divincolarsi
  // dalla presa»): a ogni bracciata un'onda scorre dalle spalle al bacino e alle gambe, ciascuno un po' in ritardo; più ampia
  // quando un avversario è addosso (contatto), anche da verticali con la bicicletta. Solo disegno: niente caso, gioco invariato.
  { const vel=clamp(Math.hypot(p.vx,p.vz)/1.4,0,1), presa=p.contactT>0?1:0, ph=p.phase||0;
    const A=disteso*(ONDA.nuoto*vel+ONDA.presa*presa), Av=(1-disteso)*ONDA.presa*0.6*presa, pv=t*9+p.uid;
    const o=k=>A*Math.sin(ph-ONDA.ritardo*k)+Av*Math.sin(pv-1.1*k);
    T.piega={ petto:p.piega.petto+o(0)*0.35, bacino:p.piega.bacino+o(1), gambe:p.piega.gambe+o(2)*1.45 }; }
  if(!p.J){ p.J={}; for(const k of JK) p.J[k]=T[k].slice(); }
  const J=p.J, k=1-Math.exp(-dt*(p.act?34:16));
  for(const key of JK){ const a=J[key], b=T[key]; a[0]+=(b[0]-a[0])*k; a[1]+=(b[1]-a[1])*k; a[2]+=(b[2]-a[2])*k; }
  // palmi (solo disegno): anche loro cambiano direzione con gradualità, poi corpo.js ruota avambraccio e polso
  { const N=p.palmi||(p.palmi={nR:T.nR.slice(),nL:T.nL.slice()}), kp=1-Math.exp(-dt*(p.act?24:10));
    for(const key of ['nR','nL']){ const a=N[key], b=T[key]; a[0]+=(b[0]-a[0])*kp; a[1]+=(b[1]-a[1])*kp; a[2]+=(b[2]-a[2])*kp; }
    T.nR=N.nR; T.nL=N.nL; }
  // Tutti e tre gli angoli: il ripristino dopo il replay passa dal quaternione e Three.js lo riscrive come
  // Euler; con la direzione oltre ±90° diventa (π, π-y, π). Impostando solo .y il corpo restava capovolto
  // e girato (v0.51, video e diagnosi di Ale su iPhone: corpo contro moto fino al 35% dopo i replay).
  R.g.position.set(p.x,0,p.z); R.g.rotation.set(0,Math.atan2(-p.fz,p.fx),0);
  const resetVista=!p.giuntiVista||game.state==='countdown'||(!p.act&&!p.charging&&game.state!=='play'&&!puoMuoversiSuFallo(p));
  const gestoVista=preparaGestoVista(p,ball.holder===p&&p.act?.done?null:p.act,ball.holder===p,game.time,dt,t,resetVista);
  const Jv=raccordaGestoVista(gestoVista,articolaVista(p,posturaVista(p,J,T.oriz||0,inclinazioneVerticale(p,T,dt)),T,t,gestoVista),T);
  // BRACCIA SENZA SCATTI (v0.56, Ale: «i passaggi sembrano calamitati»): le pose aggiunte solo nel disegno (palla protetta, palla in
  // acqua del centroboa, accompagnamento) cambiavano di colpo quando cambiava la situazione, e la palla in mano saltava fino a
  // 1,4 m in un fotogramma subito dopo la presa. Gomiti e mani disegnati seguono la posa con un breve smussamento (più rapido
  // durante un gesto); anche la palla che scende in acqua sotto la mano arriva con gradualità.
  // (non in nuotata: la bracciata del crawl è rapida e va lasciata intera)
  { const B=p.bracciaVista||(p.bracciaVista={}), k0=1-Math.exp(-dt*smussoGestoVista(p.act,BRACCIA_SMUSSO.base,BRACCIA_SMUSSO.gesto)), kb=k0+(1-k0)*clamp((T.oriz||0)*2,0,1);
    for(const key of ['eR','eL','hR','hL']){ const v=Jv[key]; if(!v) continue; const a=B[key];
      if(!a||Math.hypot(a[0]-v[0],a[1]-v[1],a[2]-v[2])>3){ B[key]=v.slice(); continue; }
      a[0]+=(v[0]-a[0])*kb; a[1]+=(v[1]-a[1])*kb; a[2]+=(v[2]-a[2])*kb; v[0]=a[0]; v[1]=a[1]; v[2]=a[2]; }
    p.pallaAcquaVista=(p.pallaAcquaVista||0)+((T.pallaInAcqua||0)-(p.pallaAcquaVista||0))*kb; T.pallaInAcqua=p.pallaAcquaVista; }
  { const k=1-Math.exp(-dt*7); p.testaGiro=(p.testaGiro||0)+((T.testaGiro||0)-(p.testaGiro||0))*k; T.testaGiro=p.testaGiro; }
  conservaGestoVista(gestoVista,Jv,T);
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
  const mh=T.manoS?J.hL:J.hR;      // mancino: palla nella mano sinistra
  if(T.ballHand){ l=[mh[0]+0.02,mh[1]+0.13,mh[2]]; if(T.ballDavanti>0) l=mix3(l,PALLA_DAVANTI,T.ballDavanti); }
  if(l){ const c=p.fx, sn=-p.fz; p.ballW=[p.x+VIS*(l[0]*c+l[2]*sn), VIS*l[1], p.z+VIS*(-l[0]*sn+l[2]*c)]; } else p.ballW=null;
  // La palla disegnata tocca il palmo reale del modello, non un offset verticale
  // dal polso. La posizione fisica p.ballW usata dal lancio resta identica.
  p.ballVistaW=null;
  if(l && R.corpo && R.corpo.ossa.manoD && !(window.__pallanuoto&&window.__pallanuoto.senzaCorpi)){
    const C=R.corpo, lato=T.manoS?'S':'D', presa=C.prese?.[lato]||(T.manoS?C.ossa.manoS:C.ossa.manoD);
    presa.getWorldPosition(_mano);
    if(C.normaliPrese?.[lato]){
      presa.getWorldQuaternion(_quaternionePresa); _normalePresa.copy(C.normaliPrese[lato]).applyQuaternion(_quaternionePresa).normalize();
    }else _normalePresa.set(...(T.manoS?T.nL:T.nR)).applyQuaternion(R.g.quaternion).normalize();
    presa.getWorldScale(_scalaPresa);
    const giaFuori=(C.distanzeSuperficiePrese?.[lato]||0)*Math.abs(_scalaPresa.x);
    _mano.addScaledVector(_normalePresa,Math.max(0,BRV*1.3-giaFuori));
    const dv=T.ballDavanti||0, c=p.fx, sn=-p.fz;
    const avanti=Jv.head[0]+0.30, fianco=Jv.head[2];
    p.ballVistaW=[_mano.x*(1-dv)+(p.x+VIS*(avanti*c+fianco*sn))*dv,
      _mano.y*(1-dv)+VIS*0.05*dv,_mano.z*(1-dv)+(p.z+VIS*(-avanti*sn+fianco*c))*dv];
    // palla in acqua sotto la mano (centroboa con il difensore dietro): galleggia, un terzo sotto il pelo
    if(T.pallaInAcqua>0){ const a=p.ballVistaW; a[1]+=(Math.max(a[1],BRV*0.35)-a[1])*T.pallaInAcqua; }
    // pesca (v0.63): finché la mano non l'ha raccolta la palla resta dov'era, in acqua davanti alla testa
    if(T.pescaPalla>0&&T.pescaPl){ const P=T.pescaPl, a=p.ballVistaW, w=[p.x+VIS*(P[0]*c+P[2]*sn),VIS*P[1],p.z+VIS*(-P[0]*sn+P[2]*c)];
      for(let i=0;i<3;i++) a[i]+=(w[i]-a[i])*T.pescaPalla; }
  }
  // per la pesca (v0.63): quanto la palla è in acqua davanti alla testa e dove, nel sistema del giocatore
  p.davantiVista=T.ballHand?(T.ballDavanti||0):0;
  if(p.davantiVista>0) p.pallaDavantiLocale=[Jv.head[0]+0.30,0.05,Jv.head[2]];
  // LA PALLA NON ENTRA NEGLI ALTRI CORPI (v0.55): se la palla disegnata finisce dentro la testa o il busto di un altro giocatore
  // vicino viene spinta fuori, in orizzontale, fino a toccarlo appena (raggio PALLA_FUORI dal suo asse). Solo disegno.
  if(p.ballVistaW){ const b=p.ballVistaW;
    for(const q of allPlayers){ if(q===p||q.excluded) continue;
      // asse del corpo e testa disegnata dell'altro (dal fotogramma più recente): la palla resta fuori da entrambi
      const h=q.Jv?.head||q.J?.head, c=q.fx, sn=-q.fz, hx=h?q.x+VIS*(h[0]*c+h[2]*sn):q.x, hz=h?q.z+VIS*(-h[0]*sn+h[2]*c):q.z, hy=h?VIS*h[1]:0.35;
      for(const [cx,cz,r,alto] of [[q.x,q.z,PALLA_FUORI,b[1]<0.75&&b[1]>-0.3],[hx,hz,PALLA_FUORI*0.9,Math.abs(b[1]-hy)<0.3]]){
        const dx=b[0]-cx, dz=b[2]-cz, d=Math.hypot(dx,dz); if(!alto||d>=r) continue;
        const ux=d>1e-3?dx:p.x-cx, uz=d>1e-3?dz:p.z-cz, ul=Math.hypot(ux,uz)||1; b[0]=cx+ux/ul*r; b[2]=cz+uz/ul*r; } } }
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
  // espressione del viso (solo se il modello ha le forme del viso: vedi espressioni.js)
  visoGiocatore(p,dt);
}
