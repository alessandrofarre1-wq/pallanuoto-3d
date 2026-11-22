// Trasferimento del gesto completo sul modello esistente. Nessuna mesh o peso modificati.
import * as THREE from 'three';
import dati from './dati/tiro-plask-01.js';
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
    return {osso,tail,index,mirror:mirror<0?index:mirror};
  });
  return {nodi,pose:nodi.map(()=>new THREE.Quaternion()),peso:0,eta:0,attivo:false,tempo:dati.source.start,velocita:0,flight:null,
    uid:null,numero:null,scheda:null,ultimaPartita:null,footD:new THREE.Quaternion(),toeD:new THREE.Quaternion(),footS:new THREE.Quaternion(),toeS:new THREE.Quaternion(),correzioniGambe:0};
}
// La posa attraversa carica, rilascio e recupero senza azzerare la velocità al lancio.
function hermite(A,B,u,D,v0,v1){u=clamp(u);const u2=u*u,u3=u2*u;return (2*u3-3*u2+1)*A+(u3-2*u2+u)*D*v0+(-2*u3+3*u2)*B+(u3-u2)*D*v1;}
function tempoDelGesto(s,p,memoria){
  const atto=p.act,S=dati.source;
  if(!atto||atto.t<atto.wind)return S.start+(S.loadEnd-S.start)*clamp(memoria.carica);
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
export function applicaTiroRegistrato(R,p,T,J,memoria,dt){
  const C=R.corpo,s=C?.tiroRegistrato;if(!s)return false;
  const reset=s.uid!==p.uid||s.numero!==p.num||s.scheda!==p.scheda||s.ultimaPartita!==null&&(memoria.gameTime<s.ultimaPartita||memoria.gameTime-s.ultimaPartita>.25);
  if(reset){s.peso=s.eta=0;s.attivo=false;s.flight=null;s.tempo=dati.source.start;s.velocita=0;}
  s.uid=p.uid;s.numero=p.num;s.scheda=p.scheda;s.ultimaPartita=memoria.gameTime;
  const kind=p.act?.kind||(p.charging?'shot':null),atto=p.act;
  const attivo=(kind==='shot'||kind==='torsione')&&!p.isGK&&(p.charging||atto&&(atto.wind>=.06||memoria.caricaIngresso>.4));
  if(attivo){
    if(!s.attivo)s.eta=0;s.eta+=Math.max(0,dt);s.peso=ease(s.eta/.10);
    const precedente=s.tempo;s.tempo=Math.max(dati.source.start,Math.min(dati.source.end,tempoDelGesto(s,p,memoria)));
    if(dt>0)s.velocita=(s.tempo-precedente)/dt;
  }else{
    if(s.attivo){s.eta=0;s.daPeso=s.peso;}
    s.eta+=Math.max(0,dt);s.peso=(s.daPeso||0)*(1-ease(s.eta/.12));s.flight=null;
  }
  s.attivo=attivo;const peso=s.peso*(1-ease(T.oriz||0));if(peso<1e-6)return false;
  campionaPosaRegistrata(s.tempo,s.pose);R.g.getWorldQuaternion(qg);
  for(const n of s.nodi){
    qa.copy(s.pose[T.manoS?n.mirror:n.index]);if(T.manoS)qa.set(-qa.x,-qa.y,qa.z,qa.w);
    qa.multiply(n.tail).premultiply(qg);n.osso.parent.getWorldQuaternion(qp).invert();qa.premultiply(qp).normalize();n.osso.quaternion.slerp(qa,peso);
  }
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
  return true;
}
