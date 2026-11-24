// Pose Plask sul modello esistente; ingresso della tenuta dalla posa in acqua.
// Nessuna mesh o peso modificati.
import * as THREE from 'three';
import dati from './dati/tiro-plask-01.js';
import { FINTA_MOVIMENTO, impulsoFinta } from '../finta-movimento.js';
import { VIS } from '../scala-grafica.js';
import { MANO_FINTA, palmoFinta } from './mano-finta.js';
const bytes=Uint8Array.from(atob(dati.packed),c=>c.charCodeAt(0)),view=new DataView(bytes.buffer);
const valori=new Float32Array(bytes.length/2);for(let i=0;i<valori.length;i++)valori[i]=view.getInt16(i*2,true)/32767;
const N=dati.bones.length,STRIDE=N*4,CONTROL=dati.frames*STRIDE;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const qa=new THREE.Quaternion(),qb=new THREE.Quaternion(),qc=new THREE.Quaternion(),qd=new THREE.Quaternion(),qe=new THREE.Quaternion(),qp=new THREE.Quaternion(),qg=new THREE.Quaternion();
const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),matrix=new THREE.Matrix4();
const opposite=n=>n.replace(/left|right|_l$|_r$/g,s=>({left:'right',right:'left',_l:'_r',_r:'_l'})[s]);
export function campionaPosaRegistrata(tempo,out){
  const f=Math.max(0,Math.min(dati.frames-1,(tempo-dati.source.start)*dati.fps)),i=Math.min(dati.frames-2,Math.floor(f)),u=f-i;
  for(let j=0;j<N;j++){
    const k=i*STRIDE+j*4;
    qa.fromArray(valori,k).normalize();qb.fromArray(valori,k+STRIDE).normalize();qa.slerp(qb,u);
    qc.fromArray(valori,CONTROL+k).normalize();qd.fromArray(valori,CONTROL+k+STRIDE).normalize();qc.slerp(qd,u);
    out[j].copy(qa.slerp(qc,2*u*(1-u))).normalize();
  }
  return out;
}
function frame(axis,reference){
  a.copy(axis).normalize();b.copy(reference).addScaledVector(a,-reference.dot(a));
  if(b.lengthSq()<1e-5)b.copy(up).addScaledVector(a,-a.y);
  b.normalize();c.crossVectors(a,b).normalize();return new THREE.Quaternion().setFromRotationMatrix(matrix.makeBasis(a,b,c));
}
export function preparaTiroRegistrato(R,C){
  R.g.updateWorldMatrix(true,true);R.g.getWorldQuaternion(qg).invert();
  const punto=o=>R.g.worldToLocal(o.getWorldPosition(new THREE.Vector3()));
  const right=punto(C.ossa.bracD).sub(punto(C.ossa.bracS)).normalize(),front=new THREE.Vector3().crossVectors(up,right).normalize();
  const nodi=dati.bones.map((desc,index)=>{
    const osso=C.radice.getObjectByName(desc.target);if(!osso)throw new Error('Osso richiesto dalla clip mancante: '+desc.target);
    const pos=punto(osso),vicino=C.radice.getObjectByName(desc.child||desc.parent);
    if(!vicino)throw new Error('Riferimento anatomico mancante: '+desc.target);
    const axis=desc.child?punto(vicino).sub(pos):pos.sub(punto(vicino));
    const f=frame(axis,desc.reference==='up'?up:front),bind=osso.getWorldQuaternion(new THREE.Quaternion()).premultiply(qg);
    const tail=f.invert().multiply(bind),mirror=dati.bones.findIndex(x=>x.target===opposite(desc.target));
    const latoFinta=[C.ossa.bracD,C.ossa.avamD,C.ossa.manoD].includes(osso)?1:[C.ossa.bracS,C.ossa.avamS,C.ossa.manoS].includes(osso)?-1:0;
    let latoMano=0;
    for(let o=osso.parent;o;o=o.parent){if(o===C.ossa.manoD){latoMano=1;break;}if(o===C.ossa.manoS){latoMano=-1;break;}}
    return {osso,tail,index,mirror:mirror<0?index:mirror,latoFinta,latoMano,mondoFinta:latoFinta?new THREE.Quaternion():null,
      inizio:new THREE.Quaternion(),ultima:new THREE.Quaternion(),obiettivo:new THREE.Quaternion()};
  });
  for(const n of nodi)n.padre=nodi.findIndex(p=>p.osso===n.osso.parent);
  return {nodi,pose:nodi.map(()=>new THREE.Quaternion()),peso:0,eta:0,attivo:false,tempo:dati.source.start,velocita:0,flight:null,
    uid:null,numero:null,scheda:null,ultimaPartita:null,footD:new THREE.Quaternion(),toeD:new THREE.Quaternion(),footS:new THREE.Quaternion(),toeS:new THREE.Quaternion(),correzioniGambe:0,
    manoFintaD:nodi.find(n=>n.osso===C.ossa.manoD),manoFintaS:nodi.find(n=>n.osso===C.ossa.manoS),deltaMano:new THREE.Quaternion(),
    ingressoTenuta:false,precedenteValida:false};
}
function ricordaPosa(s,valida){
  s.precedenteValida=valida;
  if(valida)for(const n of s.nodi)n.ultima.copy(n.osso.quaternion);
}
// La posa attraversa carica, rilascio e recupero senza azzerare la velocità al lancio.
function hermite(A,B,u,D,v0,v1){u=clamp(u);const u2=u*u,u3=u2*u;return (2*u3-3*u2+1)*A+(u3-2*u2+u)*D*v0+(-2*u3+3*u2)*B+(u3-u2)*D*v1;}
function tempoDelGesto(s,p,memoria){
  const atto=p.act,S=dati.source;
  if(!atto||atto.t<atto.wind)return s.ingressoTenuta?S.loadEnd:S.start+(S.loadEnd-S.start)*clamp(memoria.carica);
  if(s.flight!==atto){s.flight=atto;s.da=s.tempo;s.v0=Math.max(0,s.velocita);}
  const D=atto.frusta||.175,tt=atto.t-atto.wind,A=s.da,B=S.releaseAnchor,C=S.end;
  const v0=Math.min(s.v0,3*(B-A)/D),v1=Math.min(((B-A)/D+(C-B)/.36)/2,3*Math.min((B-A)/D,(C-B)/.36));
  return tt<=D?hermite(A,B,tt/D,D,v0,v1):hermite(B,C,(tt-D)/.36,.36,v1,0);
}
function mondo(osso,q){osso.parent.getWorldQuaternion(qp).invert();osso.quaternion.copy(qe.copy(qp).multiply(q)).normalize();}
function abbassaEstremo(osso,figlio,y){
  osso.getWorldPosition(a);figlio.getWorldPosition(b);if(b.y<=y)return false;
  const L=a.distanceTo(b),old=b.sub(a).normalize(),dy=Math.max(-1,Math.min(1,(y-a.y)/L)),h=Math.hypot(old.x,old.z);
  if(h<1e-6)c.set(0,-1,0);else c.set(old.x*Math.sqrt(1-dy*dy)/h,dy,old.z*Math.sqrt(1-dy*dy)/h);
  qd.setFromUnitVectors(old,c);osso.getWorldQuaternion(qc).premultiply(qd);mondo(osso,qc);return true;
}
const visuali={hip:'bacino',head:'testa',sR:'bracD',sL:'bracS',eR:'avamD',eL:'avamS',hR:'manoD',hL:'manoS',kR:'gambaD',kL:'gambaS',fR:'piedeD',fL:'piedeS'};
// MANO NELLA FINTA (v0.87, mano-finta.js): con la palla caricata dietro la testa (tenuta del giocatore e sue finte, carica del tiro)
// il palmo della posa registrata si corregge verso quello del disegno del computer: al cielo dietro la testa («vassoio»), in avanti
// sopra, in giù davanti con la palla attaccata. Ruota solo l'osso della mano (le dita, figlie, lo seguono); la palla disegnata si
// rimette sul palmo in pose.js. Il peso entra ed esce in circa 0,05 s, anche al rilascio del tiro.
const palmoAttuale=new THREE.Vector3(),palmoVoluto=new THREE.Vector3();
function correggiPalmo(C,p,T,peso){
  const lato=T.manoS?'S':'D',presa=C.prese?.[lato],normale=C.normaliPrese?.[lato],mano=T.manoS?C.ossa.manoS:C.ossa.manoD;
  if(!presa||!normale||!mano||!C.ossa.testa)return;
  presa.getWorldPosition(a);C.ossa.testa.getWorldPosition(b);
  const n=palmoFinta(((a.x-b.x)*p.fx+(a.z-b.z)*p.fz)/VIS).n,z=T.manoS?-1:1;
  palmoVoluto.set(n[0]*p.fx-n[2]*z*p.fz,n[1],n[0]*p.fz+n[2]*z*p.fx).normalize();
  presa.getWorldQuaternion(qc);palmoAttuale.copy(normale).applyQuaternion(qc).normalize();
  qd.setFromUnitVectors(palmoAttuale,palmoVoluto);qb.identity().slerp(qd,peso);
  mano.getWorldQuaternion(qc);mondo(mano,qc.premultiply(qb));
}
function rotazioneRegistrata(n,s,manoS,out){
  out.copy(s.pose[manoS?n.mirror:n.index]);if(manoS)out.set(-out.x,-out.y,out.z,out.w);
  return out.multiply(n.tail).premultiply(qg);
}
export function applicaTiroRegistrato(R,p,T,J,memoria,dt){
  const C=R.corpo,s=C?.tiroRegistrato;if(!s)return false;
  const reset=s.uid!==p.uid||s.numero!==p.num||s.scheda!==p.scheda||s.ultimaPartita!==null&&(memoria.gameTime<s.ultimaPartita||memoria.gameTime-s.ultimaPartita>.25);
  if(reset){s.peso=s.eta=0;s.attivo=false;s.flight=null;s.tempo=dati.source.start;s.velocita=0;s.ingressoTenuta=s.precedenteValida=false;s.pesoPalmo=0;}
  s.uid=p.uid;s.numero=p.num;s.scheda=p.scheda;s.ultimaPartita=memoria.gameTime;
  const kind=p.act?.kind||(p.charging?'shot':null),atto=p.act;
  const finta=kind==='fake'&&p.charging&&memoria.hold;
  const attivo=((kind==='shot'||kind==='torsione')&&(p.charging||atto&&(atto.wind>=.06||memoria.caricaIngresso>.4))||finta)&&!p.isGK;
  if(attivo){
    if(!s.attivo){
      s.eta=0;s.ingressoTenuta=!!(p.charging&&memoria.hold);
      if(s.ingressoTenuta)for(const n of s.nodi)n.inizio.copy(s.precedenteValida?n.ultima:n.osso.quaternion);
    }
    s.eta+=Math.max(0,dt);s.peso=ease(s.eta/(s.ingressoTenuta?FINTA_MOVIMENTO.ingresso:.10));
    const precedente=s.tempo;
    // La finta parte e torna alla medesima carica: il corpo non passa più da
    // Plask al procedurale e viceversa due volte per ciclo.
    if(p.charging&&memoria.hold){s.flight=null;s.tempo=dati.source.loadEnd;}
    else s.tempo=Math.max(dati.source.start,Math.min(dati.source.end,tempoDelGesto(s,p,memoria)));
    if(dt>0)s.velocita=(s.tempo-precedente)/dt;
  }else{
    if(s.attivo){
      s.eta=0;s.daPeso=s.peso;
      if(s.ingressoTenuta)for(const n of s.nodi)n.inizio.copy(n.ultima);
    }
    s.eta+=Math.max(0,dt);s.peso=(s.daPeso||0)*(1-ease(s.eta/.12));s.flight=null;
  }
  s.attivo=attivo;const peso=s.peso*(1-ease(T.oriz||0));
  if(peso<1e-6){ricordaPosa(s,!!memoria.hold);return false;}
  // v0.87: la finta ampia porta il braccio fino al gesto intero del disegno (la mano passa davanti alla testa e il palmo può girarsi
  // in giù, MANO_FINTA); la stretta resta a FINTA_MOVIMENTO.braccio come nella v0.76
  const lato=T.manoS?-1:1,impulso=finta?impulsoFinta(atto):0,ampiezza=impulso*(FINTA_MOVIMENTO.braccio+(1-FINTA_MOVIMENTO.braccio)*(atto?.largo??.5));
  if(finta)for(const n of s.nodi)if(n.latoFinta===lato)n.osso.getWorldQuaternion(n.mondoFinta);
  campionaPosaRegistrata(s.tempo,s.pose);R.g.getWorldQuaternion(qg);
  if(finta){
    const mano=T.manoS?s.manoFintaS:s.manoFintaD;
    rotazioneRegistrata(mano,s,T.manoS,qb);
    s.deltaMano.copy(qb).slerp(mano.mondoFinta,ampiezza).multiply(qb.invert());
  }
  for(const n of s.nodi){
    rotazioneRegistrata(n,s,T.manoS,qa);
    if(finta&&n.latoFinta===lato)qa.slerp(n.mondoFinta,ampiezza);
    // Le dita seguono la mano mantenendo la presa della clip, senza ruotare
    // in senso opposto quando cambia l'orientamento del polso.
    if(finta&&n.latoMano===lato)qa.premultiply(s.deltaMano);
    n.obiettivo.copy(qa);
  }
  for(const n of s.nodi){
    if(s.ingressoTenuta){
      if(attivo){
        // Un solo raccordo dalla posa realmente in acqua. Le rotazioni locali
        // mantengono dita, mano e catene parentali solidali durante l'ingresso.
        if(n.padre>=0)qp.copy(s.nodi[n.padre].obiettivo);else n.osso.parent.getWorldQuaternion(qp);
        qa.copy(n.obiettivo).premultiply(qp.invert()).normalize();
      }else qa.copy(n.osso.quaternion);
      n.osso.quaternion.slerpQuaternions(n.inizio,qa,attivo?peso:ease(s.eta/.12));
    }else{
      n.osso.parent.getWorldQuaternion(qp).invert();qa.copy(n.obiettivo).premultiply(qp).normalize();n.osso.quaternion.slerp(qa,peso);
    }
  }
  if(finta&&C.schiena.length){
    const busto=C.schiena[0],verso=p.fintaLatoGesto?Math.sign(p.fintaLatoGesto*p.fx):-lato;
    busto.getWorldQuaternion(qc);qd.setFromAxisAngle(up,verso*FINTA_MOVIMENTO.torace*impulso);
    mondo(busto,qc.premultiply(qd));
  }
  {const carica=p.charging&&memoria.hold||atto&&!atto.done&&atto.t<atto.wind;
    s.pesoPalmo=(s.pesoPalmo||0)+((carica?MANO_FINTA.plask:0)-(s.pesoPalmo||0))*(1-Math.exp(-Math.max(0,dt)/.05));
    if(s.pesoPalmo>1e-3)correggiPalmo(C,p,T,s.pesoPalmo*peso);}
  // La radice della registrazione non muove il giocatore. Si adatta la quota
  // alla vasca, mantenendo la forma e la coordinazione della posa completa.
  const O=C.ossa,pv=O.bacino.position;pv.set(0,0,0);
  O.bracD.getWorldPosition(a);O.bracS.getWorldPosition(b);a.add(b).multiplyScalar(.5);C.radice.worldToLocal(a);
  pv.set(-(J.sL[2]+J.sR[2])/2/C.scala-a.x,(J.sL[1]+J.sR[1])/2/C.scala-a.y,(J.sL[0]+J.sR[0])/2/C.scala-a.z);
  O.bacino.getWorldPosition(a);const max=-.22+.06*clamp(T.alzataTiro||0);
  if(a.y>max){a.y=max;O.bacino.parent.worldToLocal(a);pv.copy(a);}
  for(const [thigh,knee,foot,toe,fq,tq]of [[O.cosciaD,O.gambaD,O.piedeD,O.puntaD,s.footD,s.toeD],[O.cosciaS,O.gambaS,O.piedeS,O.puntaS,s.footS,s.toeS]]){
    foot.getWorldQuaternion(fq);toe.getWorldQuaternion(tq);
    const c1=abbassaEstremo(thigh,knee,-.10),c2=abbassaEstremo(knee,foot,-.12);
    if(c1||c2){s.correzioniGambe++;mondo(foot,fq);mondo(toe,tq);}
  }
  // Indicatori, scie e replay seguono il modello realmente disegnato, senza
  // modificare J o ballW, che restano le giunture del motore.
  for(const [key,osso]of Object.entries(visuali)){O[osso].getWorldPosition(a);R.g.worldToLocal(a);J[key][0]=a.x;J[key][1]=a.y;J[key][2]=a.z;}
  C.schiena.at(-1).getWorldPosition(a);R.g.worldToLocal(a);J.chest[0]=a.x;J.chest[1]=a.y;J.chest[2]=a.z;
  ricordaPosa(s,!!memoria.hold||attivo||peso>0);
  return true;
}
