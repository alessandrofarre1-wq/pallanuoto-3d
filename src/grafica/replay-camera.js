// Regia del replay (v0.61). Ale, con il replay della finale olimpica: «ha senso che l'inquadratura cambi. Non come la stai
// facendo ora che è statica». In TV: ripresa alta che gira attorno all'azione e la segue, poi dissolvenza su un primo piano a
// pelo d'acqua del marcatore che esulta, con il nome in sovrimpressione. Qui due inquadrature:
// 1) AZIONE: camera alta che gira da un lato del campo verso dietro il tiratore e intanto scende. A ogni fotogramma la distanza
//    si ricalcola sulle proiezioni (palla, tiratore, portiere e porta sempre dentro la fascia libera dall'interfaccia); attorno
//    al rilascio la ripresa si stringe sui soli punti del tiro. Resta sempre sul lato della giuria (mai girata di 180°).
// 2) PRIMO PIANO: dopo la rete, taglio su una camera quasi a pelo d'acqua davanti al marcatore (tra più angoli quello con meno
//    corpi in mezzo), con un lento avvicinamento e un piccolo arco laterale.
// Non modifica fov o qualità: si muovono soltanto posizione e direzione della camera.
import * as THREE from 'three';
import { HL, HW } from '../costanti.js';

export const FASCIA_REPLAY=Object.freeze({left:0.06,right:0.94,top:0.16,bottom:0.78});
// angoli in radianti: orbita = angolo dietro il tiratore (0 = ripresa di lato) e altezza della camera sull'orizzonte;
// stretta = secondi prima e dopo il rilascio in cui la ripresa passa ai soli punti del tiro;
// primoPiano: altezza (negativa = camera più bassa della testa, guarda un po' in su), margine all'inizio e alla fine
// (avvicinamento), arco laterale durante l'esultanza, distanza minima e angoli provati attorno alla direzione della porta
export const REGIA_REPLAY=Object.freeze({
  orbita:Object.freeze({giro:0.56,quotaDa:0.72,quotaA:0.46}),
  stretta:Object.freeze({prima:0.35,dopo:0.12}),
  primoPiano:Object.freeze({quota:-0.05,margine:Object.freeze([1.34,1.06]),arco:0.18,minimo:1.5,
    angoli:Object.freeze([0.3,0.65,1.0,-0.3,-0.65,-1.0]),vicino:1.5})
});
const su=new THREE.Vector3(0,1,0), cam=new THREE.Vector3(), camB=new THREE.Vector3(), centro=new THREE.Vector3();
const puntiPrimo=new Float32Array(14*3);

function fasciaVisibile(){
  const fascia={...FASCIA_REPLAY};
  const css=getComputedStyle(document.documentElement),inset=n=>Math.max(0,parseFloat(css.getPropertyValue(n))||0);
  fascia.left=Math.max(fascia.left,(inset('--sl')+12)/innerWidth);
  fascia.right=Math.min(fascia.right,1-(inset('--sr')+12)/innerWidth);
  fascia.top=Math.max(fascia.top,(inset('--st')+12)/innerHeight);
  fascia.bottom=Math.min(fascia.bottom,1-(inset('--sb')+12)/innerHeight);
  if(innerHeight<=320){fascia.top=0.20;fascia.bottom=0.73;}
  const rettangolo=selettore=>{
    const el=document.querySelector(selettore);
    if(!el||!el.getClientRects().length||getComputedStyle(el).visibility==='hidden')return null;
    return el.getBoundingClientRect();
  };
  for(const s of ['.replay-testa','.replay-marchio']){
    const r=rettangolo(s);if(r)fascia.top=Math.max(fascia.top,(r.bottom+7)/innerHeight);
  }
  for(const s of ['.replay-fascia','#replaySalta']){
    const r=rettangolo(s);if(r)fascia.bottom=Math.min(fascia.bottom,(r.top-7)/innerHeight);
  }
  return fascia;
}

function centroPunti(punti,n){
  let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity,zmin=Infinity,zmax=-Infinity;
  for(let i=0;i<n*3;i+=3){
    xmin=Math.min(xmin,punti[i]); xmax=Math.max(xmax,punti[i]);
    ymin=Math.min(ymin,punti[i+1]); ymax=Math.max(ymax,punti[i+1]);
    zmin=Math.min(zmin,punti[i+2]); zmax=Math.max(zmax,punti[i+2]);
  }
  return new THREE.Vector3((xmin+xmax)/2,(ymin+ymax)/2,(zmin+zmax)/2);
}

// indietro = dalla scena verso la camera; destra e alto come li calcola lookAt di three
function orienta(piano,x,y,z){
  piano.indietro.set(x,y,z).normalize();
  piano.destra.crossVectors(su,piano.indietro).normalize();
  piano.alto.crossVectors(piano.indietro,piano.destra).normalize();
}

// punti: posizioni da tenere in vista per tutta l'azione; puntiTiro: solo quelle dal rilascio in poi (con la porta);
// laterale: piccola diagonale iniziale, ridotta per i tiri molto laterali
export function preparaCameraReplay(punti,n,puntiTiro,nTiro,dir,laterale=0.12){
  return {punti,n,puntiTiro,nTiro,dir:Math.sign(dir)||1,giroDa:Math.atan(laterale),
    centro:centroPunti(punti,n),centroTiro:nTiro?centroPunti(puntiTiro,nTiro):null,
    indietro:new THREE.Vector3(),destra:new THREE.Vector3(),alto:new THREE.Vector3(),
    chiave:'',fascia:FASCIA_REPLAY,primo:null};
}

// distanza minima lungo «indietro» perché tutti i punti cadano nella fascia; lato: la camera resta sul lato della giuria
function distanzaMinima(camera,piano,punti,n,c,lato=true,minimo=2){
  const tv=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)/camera.zoom, th=tv*camera.aspect;
  const ymin=1-2*piano.fascia.bottom,ymax=1-2*piano.fascia.top;
  const xmin=2*piano.fascia.left-1,xmax=2*piano.fascia.right-1;
  let distanza=lato?Math.max(minimo,(0.5-c.z)/Math.max(0.05,piano.indietro.z)):minimo;
  for(let i=0;i<n*3;i+=3){
    const dx=punti[i]-c.x,dy=punti[i+1]-c.y,dz=punti[i+2]-c.z;
    const x=dx*piano.destra.x+dy*piano.destra.y+dz*piano.destra.z;
    const y=dx*piano.alto.x+dy*piano.alto.y+dz*piano.alto.z;
    const z=dx*piano.indietro.x+dy*piano.indietro.y+dz*piano.indietro.z;
    distanza=Math.max(distanza,z+Math.max(x/(x>=0?xmax*th:xmin*th),y/(y>=0?ymax*tv:ymin*tv),camera.near*2));
  }
  return distanza*1.045;
}

function aggiornaFascia(camera,piano){
  const chiave=[camera.aspect,camera.fov,camera.zoom,camera.near,innerHeight,innerWidth,document.documentElement.getAttribute('style')||''].join('|');
  if(chiave!==piano.chiave){ piano.chiave=chiave; piano.fascia=fasciaVisibile(); }
}

// PRIMO PIANO: angolo scelto una volta sola, sul fotogramma del taglio. m = [radice, testa, mano destra, mano sinistra] del
// marcatore; altri = teste e radici degli altri corpi visibili; faccia = angolo (nel piano dell'acqua) verso cui guarda il
// marcatore: dopo una beduina dà le spalle alla porta. La camera va davanti al viso, di tre quarti, senza corpi in mezzo né
// attaccati all'obiettivo, dentro la vasca e davanti alla linea di porta.
export function preparaPrimoPiano(piano,m,altri,gx,faccia){
  const P=REGIA_REPLAY.primoPiano;
  const base=Number.isFinite(faccia)?faccia:Math.atan2(-m[2],gx-m[0]);
  let migliore=null;
  for(const a of P.angoli){
    const ang=base+a, ux=Math.cos(ang), uz=Math.sin(ang);
    const cx=m[3]+ux*2.4, cz=m[5]+uz*2.4, cy=m[4]-0.1;
    let costo=0.6*Math.abs(Math.abs(a)-0.65)+(cz<m[5]?0.2:0);
    if(Math.abs(cz)>HW-0.2||Math.sign(gx)*cx>HL-0.4||Math.abs(cx)>HL-0.2) costo+=8;
    for(let i=0;i<altri.length;i+=3){
      const vx=m[3]-cx,vy=m[4]-cy,vz=m[5]-cz,l2=vx*vx+vy*vy+vz*vz;
      const wx=altri[i]-cx,wy=altri[i+1]-cy,wz=altri[i+2]-cz;
      if(wx*wx+wz*wz<P.vicino*P.vicino){ costo+=6; continue; }      // un corpo attaccato alla camera copre tutto
      const t=(wx*vx+wy*vy+wz*vz)/l2;
      if(t<0.05||t>0.92) continue;
      const qx=vx*t-wx,qy=vy*t-wy,qz=vz*t-wz;
      if(qx*qx+qy*qy+qz*qz<0.45*0.45) costo+=3;
    }
    if(!migliore||costo<migliore.costo) migliore={costo,ang,verso:Math.sign(a)||1};
  }
  piano.primo=migliore;
  return migliore;
}

function applicaPrimoPiano(camera,piano,m,k){
  const P=REGIA_REPLAY.primoPiano, pp=piano.primo, e=THREE.MathUtils.smootherstep(k,0,1);
  const ang=pp.ang+pp.verso*P.arco*e;
  // la mano più alta (quella che esulta) e la testa
  const alta=m[7]>=m[10]?6:9;
  let n=0;const metti=(x,y,z)=>{puntiPrimo[n*3]=x;puntiPrimo[n*3+1]=y;puntiPrimo[n*3+2]=z;n++;};
  const r=0.2;
  metti(m[3],m[4],m[5]); metti(m[3]-r,m[4],m[5]); metti(m[3]+r,m[4],m[5]); metti(m[3],m[4]+r,m[5]); metti(m[3],m[4]-r,m[5]);
  metti(m[3],m[4],m[5]-r); metti(m[3],m[4],m[5]+r);
  metti(m[6],m[7],m[8]); metti(m[9],m[10],m[11]); metti(m[0],Math.max(m[1],0),m[2]);
  centro.set(m[3]*0.65+m[alta]*0.35,m[4]*0.65+m[alta+1]*0.35,m[5]*0.65+m[alta+2]*0.35);
  let quota=P.quota;
  for(let giro=0;giro<2;giro++){
    orienta(piano,Math.cos(ang)*Math.cos(quota),Math.sin(quota),Math.sin(ang)*Math.cos(quota));
    const d=distanzaMinima(camera,piano,puntiPrimo,n,centro,false,P.minimo)*THREE.MathUtils.lerp(P.margine[0],P.margine[1],e);
    cam.copy(centro).addScaledVector(piano.indietro,d);
    if(cam.y>=0.22||giro) break;
    quota=Math.asin(THREE.MathUtils.clamp((0.22-centro.y)/d,-0.5,0.5));      // la camera resta sopra l'acqua
  }
  camera.position.copy(cam); camera.lookAt(cam.x-piano.indietro.x,cam.y-piano.indietro.y,cam.z-piano.indietro.z);
  camera.updateMatrixWorld(true);
  return e;
}

// stato: azione 0..1 (avanzamento dell'orbita), tiro 0..1 (quanto stringere sul tiro), primo = null oppure
// {m: 12 numeri del marcatore in questo fotogramma, k 0..1 dentro il primo piano}
export function applicaCameraReplay(camera,piano,stato){
  aggiornaFascia(camera,piano);
  if(stato.primo&&piano.primo) return applicaPrimoPiano(camera,piano,stato.primo.m,stato.primo.k);
  const O=REGIA_REPLAY.orbita, a=THREE.MathUtils.smootherstep(THREE.MathUtils.clamp(stato.azione,0,1),0,1);
  const giro=piano.giroDa+O.giro*a, quota=THREE.MathUtils.lerp(O.quotaDa,O.quotaA,a);
  orienta(piano,-piano.dir*Math.sin(giro)*Math.cos(quota),Math.sin(quota),Math.cos(giro)*Math.cos(quota));
  cam.copy(piano.centro).addScaledVector(piano.indietro,distanzaMinima(camera,piano,piano.punti,piano.n,piano.centro));
  const w=piano.nTiro?THREE.MathUtils.clamp(stato.tiro||0,0,1):0;
  if(w>0){
    // per ogni orientamento le posizioni valide formano un insieme convesso: la media tra due riprese valide resta valida
    camB.copy(piano.centroTiro).addScaledVector(piano.indietro,distanzaMinima(camera,piano,piano.puntiTiro,piano.nTiro,piano.centroTiro));
    cam.lerp(camB,w);
  }
  camera.position.copy(cam); camera.lookAt(cam.x-piano.indietro.x,cam.y-piano.indietro.y,cam.z-piano.indietro.z);
  camera.updateMatrixWorld(true);
  return 0;
}
