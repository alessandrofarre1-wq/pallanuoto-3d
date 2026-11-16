// Archivio del disegno: non ricalcola pose, fisica, regole o numeri casuali.
// Il solo intervallo che modifica la scena è protetto da finally, attorno a draw().
import * as THREE from 'three';
import { allPlayers } from '../stato.js';
import { comparsePerReplay } from '../panchina.js';
import { ball3d, camera, contatti, freccia, mirino, passMark, ring, scene, schiuma, shadow } from './scena.js';
import { gocceMesh } from './acqua-eventi.js';
import { tempoAcqua } from './sottacqua.js';

const HZ=30, PASSO=1/HZ, CAPACITA=Math.ceil(3.5*HZ)+1, SECONDI_CLIP=1.8;
const MAX_CLIP=Math.ceil(SECONDI_CLIP*HZ)+3, MAX_TEXTURE=32, TRASFORMA=11;
const corpi=[...allPlayers,...comparsePerReplay];
const tempi=new Float64Array(CAPACITA), tempiClip=new Float64Array(MAX_CLIP);
const qA=new THREE.Quaternion(), qB=new THREE.Quaternion(), mira=new THREE.Vector3();
const cameraExtra=new Float64Array(48);
let nodi=[], numerici=[], materiali=[], scheletri=[], skinned=[], derivati=[], riferimenti=[], effetti=[], istanze=[];
let dati=new Float32Array(0), clip=new Float32Array(0), attuale=new Float64Array(0);
let matrici=new Float64Array(0), flags=new Uint8Array(0), visEffetti=new Uint8Array(0);
let matriciDisegno=new Float64Array(0);
let mappe=[], mappeClip=[], mappeAttuali=[];
let stride=0, testa=0, count=0, countClip=0, tempo=0, accumulo=PASSO, inDisegno=false;
const textureCongelate=[];

function liberaMappe(a){
  for(let i=0;i<a.length;i++){
    const tex=a[i];
    if(tex){ const record=textureCongelate.find(r=>r.tex===tex); if(record) record.usi--; }
    a[i]=null;
  }
}
function pulisciTexture(tutte=false){
  for(let i=textureCongelate.length-1;i>=0;i--){
    const r=textureCongelate[i];
    if(tutte||r.usi===0){ r.tex.dispose(); textureCongelate.splice(i,1); }
  }
}
function svuotaArchivio(){
  liberaMappe(mappe); testa=0; count=0; accumulo=PASSO;
}
export function azzeraArchivioReplay(){
  svuotaArchivio(); liberaMappe(mappeClip); countClip=0; tempo=0;
  pulisciTexture(true);
}

function aggiungiNumerico(oggetto,chiavi){
  numerici.push({oggetto,chiavi,offset:stride}); stride+=chiavi.length;
}
function aggiungiValore(oggetto,chiave){
  const v=oggetto[chiave];
  if(typeof v==='number') aggiungiNumerico(oggetto,[chiave]);
  else if(v?.isColor) aggiungiNumerico(v,['r','g','b']);
  else if(v?.isVector4) aggiungiNumerico(v,['x','y','z','w']);
  else if(v?.isVector3) aggiungiNumerico(v,['x','y','z']);
  else if(v?.isVector2) aggiungiNumerico(v,['x','y']);
}
function strutturaCambiata(){
  if(!nodi.length) return true;
  for(let i=0;i<corpi.length;i++){
    const R=corpi[i].mesh, r=riferimenti[i];
    if(R.g!==r.g||R.corpo!==r.corpo||R.g.children.length!==r.figli) return true;
  }
  return false;
}
function preparaStruttura(){
  azzeraArchivioReplay();
  nodi=[]; numerici=[]; materiali=[]; scheletri=[]; skinned=[]; riferimenti=[]; istanze=[]; stride=0;
  const visti=new Set(), matVisti=new Set(), scheletriVisti=new Set();
  const aggiungi=o=>{
    if(visti.has(o)) return; visti.add(o);
    nodi.push({oggetto:o,offset:stride}); stride+=TRASFORMA;
    if(o.morphTargetInfluences?.length) aggiungiNumerico(o.morphTargetInfluences,Array.from(o.morphTargetInfluences,(_,i)=>i));
    if(o.skeleton&&!scheletriVisti.has(o.skeleton)){
      scheletriVisti.add(o.skeleton);
      scheletri.push({scheletro:o.skeleton,salvati:new Float32Array(o.skeleton.boneMatrices.length)});
    }
    if(o.isSkinnedMesh) skinned.push({oggetto:o,salvate:new Float64Array(32)});
    const mats=Array.isArray(o.material)?o.material:[o.material];
    for(const mat of mats){
      if(!mat||matVisti.has(mat)) continue; matVisti.add(mat);
      aggiungiValore(mat,'color'); aggiungiValore(mat,'emissive'); aggiungiValore(mat,'opacity');
      if('map' in mat) materiali.push({mat,mutable:null});
    }
  };
  for(const p of corpi){
    const R=p.mesh;
    riferimenti.push({g:R.g,corpo:R.corpo,figli:R.g.children.length});
    R.g.traverse(aggiungi);
    if(R.corpo?.u) for(const u of Object.values(R.corpo.u)) aggiungiValore(u,'value');
    if(R.corpo?.texNum) for(const m of materiali) if(m.mat.map===R.corpo.texNum) m.mutable=R.corpo.texNum;
  }
  ball3d.traverse(aggiungi); shadow.traverse(aggiungi); aggiungi(camera);
  aggiungiValore(tempoAcqua,'value');
  // Schiuma, gocce, contatti e ombre restano gli stessi oggetti: registriamo i loro buffer reali.
  const ombre=scene.children.filter(o=>o.isInstancedMesh&&(/ombr/i.test(o.name)||o.material?.fragmentShader?.includes('0.005,0.075,0.10')));
  effetti=[freccia,mirino,passMark,ring];
  for(const oggetto of new Set([schiuma,contatti,gocceMesh,...ombre])){
    const istanza={oggetto,offset:stride,blocchi:[]}; stride+=2;
    const attributi=new Set([oggetto.instanceMatrix,oggetto.instanceColor,...Object.values(oggetto.geometry.attributes).filter(a=>a.isInstancedBufferAttribute)]);
    for(const attributo of attributi){
      if(!attributo) continue;
      istanza.blocchi.push({attributo,offset:stride,salvati:new Float32Array(attributo.array.length)}); stride+=attributo.array.length;
    }
    istanze.push(istanza);
  }
  derivati=[]; scene.traverse(o=>derivati.push(o)); if(!derivati.includes(camera)) derivati.push(camera);
  dati=new Float32Array(CAPACITA*stride); clip=new Float32Array(MAX_CLIP*stride); attuale=new Float64Array(stride);
  matrici=new Float64Array(nodi.length*32); flags=new Uint8Array(nodi.length);
  matriciDisegno=new Float64Array(derivati.length*25);
  visEffetti=new Uint8Array(effetti.length);
  mappe=new Array(CAPACITA*materiali.length).fill(null);
  mappeClip=new Array(MAX_CLIP*materiali.length).fill(null);
  mappeAttuali=new Array(materiali.length).fill(null);
}

function textureFissa(tex){
  const trovata=textureCongelate.find(r=>r.originale===tex&&r.versione===tex.version);
  if(trovata) return trovata.tex;
  if(textureCongelate.length>=MAX_TEXTURE) pulisciTexture();
  if(textureCongelate.length>=MAX_TEXTURE) return null;
  const tela=document.createElement('canvas'); tela.width=tex.image.width; tela.height=tex.image.height;
  tela.getContext('2d').drawImage(tex.image,0,0);
  const copia=new THREE.CanvasTexture(tela);
  // Texture.copy condivide Source e ne aggiorna la versione: lascia intatta la fonte live.
  for(const chiave of ['colorSpace','anisotropy','flipY','wrapS','wrapT','magFilter','minFilter','premultiplyAlpha','generateMipmaps']) copia[chiave]=tex[chiave];
  copia.offset.copy(tex.offset); copia.repeat.copy(tex.repeat); copia.center.copy(tex.center); copia.rotation=tex.rotation;
  copia.updateMatrix(); copia.needsUpdate=true;
  textureCongelate.push({originale:tex,versione:tex.version,tex:copia,usi:0});
  return copia;
}
function assegnaMappa(a,i,tex){
  const prima=a[i];
  if(prima===tex) return;
  const vecchio=textureCongelate.find(r=>r.tex===prima); if(vecchio) vecchio.usi--;
  const nuovo=textureCongelate.find(r=>r.tex===tex); if(nuovo) nuovo.usi++;
  a[i]=tex;
}
function cattura(dest,base){
  for(const n of nodi){
    const o=n.oggetto, k=base+n.offset;
    o.position.toArray(dest,k); o.quaternion.toArray(dest,k+3); o.scale.toArray(dest,k+7); dest[k+10]=o.visible?1:0;
  }
  for(const n of numerici) for(let j=0;j<n.chiavi.length;j++) dest[base+n.offset+j]=n.oggetto[n.chiavi[j]];
  for(const i of istanze){
    dest[base+i.offset]=i.oggetto.count; dest[base+i.offset+1]=i.oggetto.visible?1:0;
    for(const b of i.blocchi){
      if(dest===attuale) b.salvati.set(b.attributo.array);
      else dest.set(b.attributo.array,base+b.offset);
    }
  }
}

// Chiamata dopo il rig, la palla e la camera live. Un campione al massimo per fotogramma.
export function registraFotogrammaReplay(dt){
  if(inDisegno||!Number.isFinite(dt)||dt<0) return;
  if(strutturaCambiata()) preparaStruttura();
  tempo+=dt; accumulo+=dt;
  if(accumulo+1e-9<PASSO) return;
  accumulo%=PASSO;
  let pronto=false;
  // Se identità molto frequenti esauriscono il tetto, conserva la clip e ricomincia l'archivio.
  for(let tentativo=0;tentativo<2&&!pronto;tentativo++){
    const destinazione=testa*materiali.length;
    pronto=true;
    for(let i=0;i<materiali.length;i++){
      const m=materiali[i], tex=m.mutable&&m.mat.map===m.mutable?textureFissa(m.mutable):m.mat.map;
      if(m.mutable&&m.mat.map===m.mutable&&!tex){ pronto=false; break; }
      assegnaMappa(mappe,destinazione+i,tex);
    }
    if(!pronto){ svuotaArchivio(); pulisciTexture(); }
  }
  if(!pronto) return;
  cattura(dati,testa*stride); tempi[testa]=tempo;
  testa=(testa+1)%CAPACITA; count=Math.min(count+1,CAPACITA);
}

// Il buffer della clip è indipendente dal circolare: la diretta può continuare a registrare.
export function preparaClipReplay(){
  liberaMappe(mappeClip); countClip=0; pulisciTexture();
  if(count<2||strutturaCambiata()) return false;
  // I primi 0,6 s restano in diretta. Della rete bastano gli ultimi0,3 s:
  // recuperiamo così più ricezione/preparazione senza allungare il replay.
  let ultimo=(testa-1+CAPACITA)%CAPACITA, quanti=count;
  const fine=tempi[ultimo]-0.3;
  while(quanti>2&&tempi[ultimo]>fine+1e-9){ ultimo=(ultimo-1+CAPACITA)%CAPACITA; quanti--; }
  const limite=tempi[ultimo]-SECONDI_CLIP;
  let inizio=(testa-count+CAPACITA)%CAPACITA;
  while(quanti>2&&tempi[(inizio+1)%CAPACITA]<limite){ inizio=(inizio+1)%CAPACITA; quanti--; }
  if(quanti>MAX_CLIP){ inizio=(inizio+quanti-MAX_CLIP)%CAPACITA; quanti=MAX_CLIP; }
  for(let i=0;i<quanti;i++){
    const sorgente=(inizio+i)%CAPACITA;
    clip.set(dati.subarray(sorgente*stride,(sorgente+1)*stride),i*stride); tempiClip[i]=tempi[sorgente];
    for(let j=0;j<materiali.length;j++) assegnaMappa(mappeClip,i*materiali.length+j,mappe[sorgente*materiali.length+j]);
  }
  countClip=quanti;
  if(tempiClip[countClip-1]-tempiClip[0]<0.45){ liberaMappe(mappeClip); countClip=0; pulisciTexture(); return false; }
  return true;
}

function applica(a,b,k){
  const pa=a*stride, pb=b*stride, scelta=k<0.5?pa:pb;
  for(const n of nodi){
    const o=n.oggetto, ia=pa+n.offset, ib=pb+n.offset;
    o.position.set(THREE.MathUtils.lerp(clip[ia],clip[ib],k),THREE.MathUtils.lerp(clip[ia+1],clip[ib+1],k),THREE.MathUtils.lerp(clip[ia+2],clip[ib+2],k));
    qA.fromArray(clip,ia+3); qB.fromArray(clip,ib+3); o.quaternion.copy(qA.slerp(qB,k));
    o.scale.set(THREE.MathUtils.lerp(clip[ia+7],clip[ib+7],k),THREE.MathUtils.lerp(clip[ia+8],clip[ib+8],k),THREE.MathUtils.lerp(clip[ia+9],clip[ib+9],k));
    o.visible=!!clip[scelta+n.offset+10];
  }
  for(const n of numerici) for(let j=0;j<n.chiavi.length;j++) n.oggetto[n.chiavi[j]]=clip[scelta+n.offset+j];
  const mbase=(k<0.5?a:b)*materiali.length;
  for(let i=0;i<materiali.length;i++) materiali[i].mat.map=mappeClip[mbase+i];
  // Campione vicino per particelle: interpolare gli indici di un pool unirebbe gocce diverse.
  for(const i of istanze){
    i.oggetto.count=clip[scelta+i.offset]; i.oggetto.visible=!!clip[scelta+i.offset+1];
    for(const b of i.blocchi){
      b.attributo.array.set(clip.subarray(scelta+b.offset,scelta+b.offset+b.attributo.array.length));
      b.attributo.needsUpdate=true;
    }
  }
}

function cameraReplay(info,progresso){
  const dir=Math.sign(info?.dir)||1;
  const gx=Number.isFinite(info?.xGol)?info.xGol:dir*12.5, gz=Number.isFinite(info?.zGol)?info.zGol:0;
  const sx=Number.isFinite(info?.tiroX)?info.tiroX:gx-dir*5, sz=Number.isFinite(info?.tiroZ)?info.tiroZ:0;
  let xmin=Math.min(gx,sx)-1.2, xmax=Math.max(gx,sx)+1.2, zmin=Math.min(gz,sz,-1.7), zmax=Math.max(gz,sz,1.7);
  const distanza=Math.max(6,Math.abs(gx-sx)+1);
  for(const r of riferimenti){
    const p=r.g.position;
    if(r.g.visible&&Math.abs(p.x-gx)<distanza&&Math.abs(p.z)<5){ xmin=Math.min(xmin,p.x-0.5); xmax=Math.max(xmax,p.x+0.5); zmin=Math.min(zmin,p.z-0.5); zmax=Math.max(zmax,p.z+0.5); }
  }
  mira.set((xmin+xmax)/2,0.5,(zmin+zmax)/2);
  const vfov=THREE.MathUtils.degToRad(camera.fov), hfov=2*Math.atan(Math.tan(vfov/2)*camera.aspect);
  const raggio=Math.hypot((xmax-xmin)/2,(zmax-zmin)/2,1.5);
  const distanzaCam=raggio/Math.sin(Math.min(vfov,hfov)/2)*(1.12-0.02*progresso);
  camera.position.set(mira.x-dir*distanzaCam*0.40,mira.y+distanzaCam*0.57,mira.z+distanzaCam*0.72);
  camera.lookAt(mira); camera.updateMatrixWorld(true);
}

// La callback esegue l'unico render. La scena torna al presente anche se la callback lancia un errore.
export function disegnaClipReplay(progresso,info,draw){
  if(countClip<2||inDisegno||strutturaCambiata()) return false;
  const p=THREE.MathUtils.clamp(Number.isFinite(progresso)?progresso:0,0,1);
  const sorgente=p<=0.55?p/0.55*0.7:0.7+(p-0.55)/0.45*0.3;
  const t=THREE.MathUtils.lerp(tempiClip[0],tempiClip[countClip-1],sorgente);
  let a=0; while(a<countClip-2&&tempiClip[a+1]<t) a++;
  const b=a+1, k=THREE.MathUtils.clamp((t-tempiClip[a])/Math.max(1e-9,tempiClip[b]-tempiClip[a]),0,1);
  cattura(attuale,0);
  for(let i=0;i<nodi.length;i++){
    const o=nodi[i].oggetto; o.matrix.toArray(matrici,i*32); o.matrixWorld.toArray(matrici,i*32+16); flags[i]=o.matrixWorldNeedsUpdate?1:0;
  }
  for(let i=0;i<derivati.length;i++){
    derivati[i].modelViewMatrix.toArray(matriciDisegno,i*25); derivati[i].normalMatrix.toArray(matriciDisegno,i*25+16);
  }
  camera.matrixWorldInverse.toArray(cameraExtra,0); camera.projectionMatrix.toArray(cameraExtra,16); camera.projectionMatrixInverse.toArray(cameraExtra,32);
  for(let i=0;i<materiali.length;i++) mappeAttuali[i]=materiali[i].mat.map;
  for(let i=0;i<effetti.length;i++) visEffetti[i]=effetti[i].visible?1:0;
  for(const s of scheletri){
    // Three allarga il buffer al primo render GPU, anche quando una comparsa diventa visibile.
    if(s.salvati.length!==s.scheletro.boneMatrices.length) s.salvati=new Float32Array(s.scheletro.boneMatrices.length);
    s.matriciVive=s.scheletro.boneMatrices; s.textureViva=s.scheletro.boneTexture;
    s.salvati.set(s.scheletro.boneMatrices);
  }
  for(const s of skinned){ s.oggetto.bindMatrix.toArray(s.salvate,0); s.oggetto.bindMatrixInverse.toArray(s.salvate,16); }
  inDisegno=true;
  try{
    applica(a,b,k);
    for(const e of effetti) e.visible=false;
    cameraReplay(info,p);
    scene.updateMatrixWorld(true);
    draw();
    return true;
  }finally{
    for(let i=0;i<nodi.length;i++){
      const n=nodi[i], o=n.oggetto, j=n.offset;
      o.position.fromArray(attuale,j); o.quaternion.fromArray(attuale,j+3); o.scale.fromArray(attuale,j+7); o.visible=!!attuale[j+10];
      o.matrix.fromArray(matrici,i*32); o.matrixWorld.fromArray(matrici,i*32+16); o.matrixWorldNeedsUpdate=!!flags[i];
    }
    for(const n of numerici) for(let j=0;j<n.chiavi.length;j++) n.oggetto[n.chiavi[j]]=attuale[n.offset+j];
    for(let i=0;i<materiali.length;i++) materiali[i].mat.map=mappeAttuali[i];
    for(let i=0;i<effetti.length;i++) effetti[i].visible=!!visEffetti[i];
    for(const i of istanze){
      i.oggetto.count=attuale[i.offset]; i.oggetto.visible=!!attuale[i.offset+1];
      for(const b of i.blocchi){ b.attributo.array.set(b.salvati); b.attributo.needsUpdate=true; }
    }
    for(const s of scheletri){
      if(s.scheletro.boneTexture!==s.textureViva){ s.scheletro.boneTexture?.dispose(); s.scheletro.boneTexture=s.textureViva; }
      s.scheletro.boneMatrices=s.matriciVive; s.scheletro.boneMatrices.set(s.salvati);
    }
    for(const s of skinned){ s.oggetto.bindMatrix.fromArray(s.salvate,0); s.oggetto.bindMatrixInverse.fromArray(s.salvate,16); }
    camera.matrixWorldInverse.fromArray(cameraExtra,0); camera.projectionMatrix.fromArray(cameraExtra,16); camera.projectionMatrixInverse.fromArray(cameraExtra,32);
    for(let i=0;i<derivati.length;i++){
      derivati[i].modelViewMatrix.fromArray(matriciDisegno,i*25); derivati[i].normalMatrix.fromArray(matriciDisegno,i*25+16);
    }
    inDisegno=false;
  }
}

export function diagnosticaReplay(){
  return {
    count, fotogrammi:count, clip:countClip, nodi:nodi.length, textures:textureCongelate.length,
    strideFloats:stride, effettiRegistrati:istanze.length,
    durata:count>1?tempi[(testa-1+CAPACITA)%CAPACITA]-tempi[(testa-count+CAPACITA)%CAPACITA]:0,
    durataClip:countClip>1?tempiClip[countClip-1]-tempiClip[0]:0,
    bytes:dati.byteLength+clip.byteLength+attuale.byteLength+matrici.byteLength+matriciDisegno.byteLength+tempi.byteLength+tempiClip.byteLength+istanze.reduce((n,i)=>n+i.blocchi.reduce((s,b)=>s+b.salvati.byteLength,0),0)+textureCongelate.reduce((n,r)=>n+r.tex.image.width*r.tex.image.height*4,0),
  };
}
