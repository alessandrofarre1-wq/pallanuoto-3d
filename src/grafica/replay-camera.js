// Una sola direzione di vista per tutta l'azione. Il fit usa le proiezioni,
// non la distanza approssimata da una sfera, e non modifica fov o qualità.
import * as THREE from 'three';

export const FASCIA_REPLAY=Object.freeze({left:0.06,right:0.94,top:0.16,bottom:0.78});
const su=new THREE.Vector3(0,1,0), centro=new THREE.Vector3();

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

export function preparaCameraReplay(punti,n,puntiReazione,nReazione,dir,laterale=0.12){
  const indietro=new THREE.Vector3(-dir*laterale,0.62,1).normalize();
  const destra=new THREE.Vector3().crossVectors(su,indietro).normalize();
  const alto=new THREE.Vector3().crossVectors(indietro,destra).normalize();
  return {punti,n,puntiReazione,nReazione,indietro,destra,alto,
    centro:centroPunti(punti,n),centroReazione:nReazione?centroPunti(puntiReazione,nReazione):null,
    aspect:0,fov:0,zoom:0,near:0,height:0,width:0,stile:null,fascia:FASCIA_REPLAY,distanza:0,distanzaReazione:0,reazionePossibile:false};
}

function distanzaMinima(camera,piano,punti,n,c){
  const tv=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)/camera.zoom, th=tv*camera.aspect;
  const ymin=1-2*piano.fascia.bottom,ymax=1-2*piano.fascia.top;
  const xmin=2*piano.fascia.left-1,xmax=2*piano.fascia.right-1;
  let distanza=Math.max(2,(0.5-c.z)/piano.indietro.z);
  for(let i=0;i<n*3;i+=3){
    const dx=punti[i]-c.x,dy=punti[i+1]-c.y,dz=punti[i+2]-c.z;
    const x=dx*piano.destra.x+dy*piano.destra.y+dz*piano.destra.z;
    const y=dx*piano.alto.x+dy*piano.alto.y+dz*piano.alto.z;
    const z=dx*piano.indietro.x+dy*piano.indietro.y+dz*piano.indietro.z;
    distanza=Math.max(distanza,z+Math.max(x/(x>=0?xmax*th:xmin*th),y/(y>=0?ymax*tv:ymin*tv),camera.near*2));
  }
  return distanza*1.045;
}

export function applicaCameraReplay(camera,piano,reazione){
  const stile=document.documentElement.getAttribute('style')||'';
  if(piano.aspect!==camera.aspect||piano.fov!==camera.fov||piano.zoom!==camera.zoom||piano.near!==camera.near||piano.height!==innerHeight||piano.width!==innerWidth||piano.stile!==stile){
    piano.aspect=camera.aspect; piano.fov=camera.fov; piano.zoom=camera.zoom; piano.near=camera.near;
    piano.height=innerHeight;piano.width=innerWidth;piano.stile=stile;piano.fascia=fasciaVisibile();
    piano.distanza=distanzaMinima(camera,piano,piano.punti,piano.n,piano.centro);
    const stretta=piano.nReazione?distanzaMinima(camera,piano,piano.puntiReazione,piano.nReazione,piano.centroReazione):piano.distanza;
    piano.distanzaReazione=Math.max(stretta,piano.distanza*0.78);
    piano.reazionePossibile=!!piano.nReazione&&piano.distanzaReazione<piano.distanza*0.985;
  }
  const k=piano.reazionePossibile?THREE.MathUtils.smootherstep(reazione,0,1):0;
  centro.copy(piano.centro);
  if(k) centro.lerp(piano.centroReazione,k);
  const distanza=THREE.MathUtils.lerp(piano.distanza,piano.distanzaReazione,k);
  camera.position.copy(centro).addScaledVector(piano.indietro,distanza);
  camera.lookAt(centro); camera.updateMatrixWorld(true);
  return k;
}
