// Archivio del disegno: non ricalcola pose, fisica, regole o numeri casuali.
// Il solo intervallo che modifica la scena è protetto da finally, attorno a draw().
import * as THREE from 'three';
import { allPlayers, ball } from '../stato.js';
import { GH, GW, HL } from '../costanti.js';
import { comparsePerReplay } from '../panchina.js';
import { ball3d, camera, contatti, freccia, mirino, passMark, ring, scene, schiuma, shadow } from './scena.js';
import { gocceMesh } from './acqua-eventi.js';
import { tempoAcqua } from './sottacqua.js';
import { applicaCameraReplay, FASCIA_REPLAY, preparaCameraReplay, preparaPrimoPiano, REGIA_REPLAY } from './replay-camera.js';

// v0.63 (punto 10, esultanza più lunga): archivio di 4,2 s (prima 3,5) e clip fino a 3,6 s (prima 3), perché dopo la rete si
// registra 1,15 s di esultanza invece di 0,56 senza togliere azione prima del gol
const HZ=30, PASSO=1/HZ, CAPACITA=Math.ceil(4.2*HZ)+1, SECONDI_CLIP=3.6;
const MAX_CLIP=Math.ceil(SECONDI_CLIP*HZ)+3, MAX_TEXTURE=32, TRASFORMA=11;
const corpi=[...allPlayers,...comparsePerReplay];
const tempi=new Float64Array(CAPACITA), tempiClip=new Float64Array(MAX_CLIP);
const qA=new THREE.Quaternion(), qB=new THREE.Quaternion(), punto=new THREE.Vector3();
const cameraExtra=new Float64Array(48);
const META=3, POSIZIONI=corpi.length*12;
const metadati=new Int32Array(CAPACITA*META), metaClip=new Int32Array(MAX_CLIP*META);
const numeri=new Uint16Array(CAPACITA*corpi.length), numeriClip=new Uint16Array(MAX_CLIP*corpi.length);
const nomi=new Array(CAPACITA*corpi.length).fill(null),nomiClip=new Array(MAX_CLIP*corpi.length).fill(null);
const posizioni=new Float32Array(CAPACITA*POSIZIONI), posizioniClip=new Float32Array(MAX_CLIP*POSIZIONI);
const tempoSchermo=new Float64Array(MAX_CLIP);
const puntiPrincipali=new Float32Array((MAX_CLIP*32+16)*3), puntiTiro=new Float32Array(puntiPrincipali.length);
const puntiPalla=new Float32Array(MAX_CLIP*3);
// v0.61: il replay è diviso in due inquadrature (replay-camera.js): l'azione fino a poco dopo la rete (TAGLIO s dopo il gol) occupa
// la prima parte dello schermo (QUOTA_AZIONE), il primo piano di chi esulta il resto, al rallentatore.
// v0.63 (Ale: «esultanza più lunga nel replay»): 1,15 s registrati dopo la rete (prima 0,56) e primo piano al 38% del replay
// (prima 30%): circa 2 s di schermo per l'esultanza
const TAGLIO=0.1, QUOTA_AZIONE=0.62, DOPO_GOL=1.15, m12=new Float64Array(12);
const nomiBersagli=['palla','testa','manoDestra','manoSinistra','tiratore','portaBassoSinistra','portaAltoSinistra','portaBassoDestra','portaAltoDestra'];
const bersagliUltimi=new Float64Array(nomiBersagli.length*6), posizioneCameraUltima=new Float64Array(3);
let nodi=[], numerici=[], materiali=[], scheletri=[], skinned=[], derivati=[], riferimenti=[], effetti=[], istanze=[];
let dati=new Float32Array(0), clip=new Float32Array(0), attuale=new Float64Array(0);
let matrici=new Float64Array(0), flags=new Uint8Array(0), visEffetti=new Uint8Array(0);
let matriciDisegno=new Float64Array(0);
let mappe=[], mappeClip=[], mappeAttuali=[];
let stride=0, testa=0, count=0, countClip=0, tempo=0, accumulo=PASSO, inDisegno=false;
const textureCongelate=[];
let eventi={ricezione:null,rilascio:null,gol:null}, infoClip=null, pianoCamera=null, marcatore=-1;
let reazioneIdentificata=false, ultimoDisegno=null, taglio=null;

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
  eventi={ricezione:null,rilascio:null,gol:null}; infoClip=null; pianoCamera=null; marcatore=-1;
  reazioneIdentificata=false; ultimoDisegno=null;
  nomi.fill(null);nomiClip.fill(null);
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
    // Le falangi nuove ruotano su centri fissi: posizione, scala e visibilità
    // locali non cambiano mai. Registrare la sola rotazione conserva la posa
    // completa, senza duplicare sette valori costanti per osso e campione.
    const soloRotazione=o.isBone&&/^(left|right)Hand(Thumb|Index|Middle|Ring|Pinky)[123]$/.test(o.name);
    nodi.push({oggetto:o,offset:stride,soloRotazione}); stride+=soloRotazione?4:TRASFORMA;
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
    riferimenti.push({g:R.g,corpo:R.corpo,figli:R.g.children.length,offset:stride,
      testa:R.corpo?.ossa.testa||R.head,manoD:R.corpo?.ossa.manoD||R.haR,manoS:R.corpo?.ossa.manoS||R.haL});
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
    if(n.soloRotazione){ o.quaternion.toArray(dest,k); continue; }
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

function catturaEventi(fotogramma){
  metadati[fotogramma*META]=ball.holder?.uid??-1;
  metadati[fotogramma*META+1]=ball.shooter?.uid??-1;
  metadati[fotogramma*META+2]=(ball.inRete?1:0)|(ball.daTiro?2:0)|(ball.state==='flight'?4:0)|(ball.state==='free'?8:0)|(ball.state==='held'?16:0);
  for(let i=0;i<corpi.length;i++){
    const r=riferimenti[i], base=fotogramma*POSIZIONI+i*12;
    numeri[fotogramma*corpi.length+i]=corpi[i].num;
    nomi[fotogramma*corpi.length+i]=corpi[i].name;
    r.g.getWorldPosition(punto).toArray(posizioni,base);
    r.testa.getWorldPosition(punto).toArray(posizioni,base+3);
    r.manoD.getWorldPosition(punto).toArray(posizioni,base+6);
    r.manoS.getWorldPosition(punto).toArray(posizioni,base+9);
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
  cattura(dati,testa*stride); catturaEventi(testa); tempi[testa]=tempo;
  testa=(testa+1)%CAPACITA; count=Math.min(count+1,CAPACITA);
}

// Il buffer della clip è indipendente dal circolare: la diretta può continuare a registrare.
export function preparaClipReplay(info={}){
  liberaMappe(mappeClip); countClip=0; ultimoDisegno=null; pulisciTexture();
  if(count<2||strutturaCambiata()) return false;
  const primo=(testa-count+CAPACITA)%CAPACITA, indice=i=>(primo+i)%CAPACITA;
  const uid=Number.isFinite(info.uid)?info.uid:-1;
  let gol=-1,rilascio=-1,ricezione=-1;
  for(let i=count-1;i>=0;i--){
    const f=indice(i), m=f*META;
    if((metadati[m+2]&1)&&(uid<0||metadati[m+1]===uid)) gol=i;
    else if(gol>=0) break;
  }
  if(gol>=0){
    for(let i=gol-1;i>=0;i--){
      const m=indice(i)*META, vola=(metadati[m+2]&2)&&(metadati[m+2]&12);
      if(vola&&(uid<0||metadati[m+1]===uid)) rilascio=i;
      else if(rilascio>=0) break;
    }
    if(rilascio>=0&&uid>=0){
      for(let i=rilascio-1;i>=0;i--){
        const m=indice(i)*META;
        if(metadati[m]===uid&&(metadati[m+2]&16)) ricezione=i;
        else if(ricezione>=0) break;
      }
    }
  }
  // Poco più di un secondo reale dopo il gol (DOPO_GOL) conserva anche l'esultanza, senza inventare pose.
  const fine=gol>=0?tempi[indice(gol)]+DOPO_GOL:tempi[indice(count-1)]-0.1;
  let ultimo=count-1;
  while(ultimo>1&&tempi[indice(ultimo)]>fine+1e-9) ultimo--;
  let limite=tempi[indice(ultimo)]-SECONDI_CLIP;
  // Di un passaggio lungo serve l'arrivo: non allargare la vista fino al portiere che l'ha lanciato.
  if(ricezione>0) limite=Math.max(limite,tempi[indice(ricezione)]-0.55);
  let inizio=0;
  while(inizio<ultimo-1&&tempi[indice(inizio+1)]<limite) inizio++;
  let quanti=ultimo-inizio+1;
  if(quanti>MAX_CLIP){ inizio+=quanti-MAX_CLIP; quanti=MAX_CLIP; }
  for(let i=0;i<quanti;i++){
    const sorgente=indice(inizio+i);
    clip.set(dati.subarray(sorgente*stride,(sorgente+1)*stride),i*stride); tempiClip[i]=tempi[sorgente];
    metaClip.set(metadati.subarray(sorgente*META,(sorgente+1)*META),i*META);
    numeriClip.set(numeri.subarray(sorgente*corpi.length,(sorgente+1)*corpi.length),i*corpi.length);
    for(let j=0;j<corpi.length;j++)nomiClip[i*corpi.length+j]=nomi[sorgente*corpi.length+j];
    posizioniClip.set(posizioni.subarray(sorgente*POSIZIONI,(sorgente+1)*POSIZIONI),i*POSIZIONI);
    for(let j=0;j<materiali.length;j++) assegnaMappa(mappeClip,i*materiali.length+j,mappe[sorgente*materiali.length+j]);
  }
  countClip=quanti;
  if(tempiClip[countClip-1]-tempiClip[0]<0.45){ liberaMappe(mappeClip); countClip=0; pulisciTexture(); return false; }
  const relativo=i=>i>=inizio&&i<=ultimo?tempi[indice(i)]-tempiClip[0]:null;
  eventi={ricezione:relativo(ricezione),rilascio:relativo(rilascio),gol:relativo(gol)};
  preparaRegia(info);
  return true;
}

function applica(a,b,k){
  const pa=a*stride, pb=b*stride, scelta=k<0.5?pa:pb;
  for(const n of nodi){
    const o=n.oggetto, ia=pa+n.offset, ib=pb+n.offset;
    if(n.soloRotazione){ qA.fromArray(clip,ia); qB.fromArray(clip,ib); o.quaternion.copy(qA.slerp(qB,k)); continue; }
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

function preparaRegia(info){
  infoClip=info||{}; marcatore=corpi.findIndex(p=>p.uid===infoClip.uid);
  const dir=Math.sign(infoClip.dir)||1, gx=dir*HL;
  const offsetPalla=nodi.find(n=>n.oggetto===ball3d).offset;
  const portiere=corpi.findIndex(p=>p.isGK&&(marcatore>=0?p.team!==corpi[marcatore].team:p.team.dir===-dir));
  let n=0,nTiro=0,nPalla=0,minDist=Infinity,maxZ=0;
  const aggiungi=(dest,x,y,z)=>{
    let i=dest===puntiPrincipali?n++:nTiro++;
    i*=3;dest[i]=x;dest[i+1]=y;dest[i+2]=z;
  };
  const sfera=(dest,x,y,z,r)=>{
    aggiungi(dest,x,y,z);
    aggiungi(dest,x-r,y,z);aggiungi(dest,x+r,y,z);
    aggiungi(dest,x,y-r,z);aggiungi(dest,x,y+r,z);
    aggiungi(dest,x,y,z-r);aggiungi(dest,x,y,z+r);
  };
  const porta=dest=>{for(const y of [-0.06,GH+0.1])for(const z of [-GW-0.12,GW+0.12])aggiungi(dest,gx,y,z);};
  porta(puntiPrincipali);
  const fineClip=tempiClip[countClip-1]-tempiClip[0];
  taglio=eventi.gol!==null&&eventi.gol+TAGLIO<fineClip-0.15?eventi.gol+TAGLIO:null;
  reazioneIdentificata=marcatore>=0&&taglio!==null;
  const inizioTiro=eventi.rilascio!==null?eventi.rilascio-REGIA_REPLAY.stretta.prima:Infinity;
  for(let f=0;f<countClip;f++){
    const t=tempiClip[f]-tempiClip[0], dopo=taglio!==null&&t>=taglio-PASSO;
    const capGiusto=identitaCorretta(f);
    const visibile=marcatore>=0&&!!clip[f*stride+riferimenti[marcatore].offset+10];
    if(dopo&&(!capGiusto||!visibile)) reazioneIdentificata=false;
    // l'azione si inquadra fino al taglio; la ripresa del tiro solo dal rilascio in poi
    if(taglio!==null&&t>taglio+PASSO) continue;
    const bp=f*stride+offsetPalla;
    puntiPalla.set(clip.subarray(bp,bp+3),nPalla++*3);
    for(const dest of t>=inizioTiro-PASSO?[puntiPrincipali,puntiTiro]:[puntiPrincipali]){
      const b=f*stride+offsetPalla;
      sfera(dest,clip[b],clip[b+1],clip[b+2],0.23);
      if(marcatore>=0){
        const p=f*POSIZIONI+marcatore*12;
        aggiungi(dest,posizioniClip[p],posizioniClip[p+1],posizioniClip[p+2]);
        sfera(dest,posizioniClip[p+3],posizioniClip[p+4],posizioniClip[p+5],0.24);
        aggiungi(dest,posizioniClip[p+6],posizioniClip[p+7],posizioniClip[p+8]);
        aggiungi(dest,posizioniClip[p+9],posizioniClip[p+10],posizioniClip[p+11]);
        minDist=Math.min(minDist,HL-posizioniClip[p]*dir);maxZ=Math.max(maxZ,Math.abs(posizioniClip[p+2]));
      }else{
        const sx=Number.isFinite(infoClip.tiroX)?infoClip.tiroX:gx-dir*5,sz=Number.isFinite(infoClip.tiroZ)?infoClip.tiroZ:0;
        sfera(dest,sx,0.8,sz,0.5);
      }
      if(portiere>=0){const p=f*POSIZIONI+portiere*12+3;sfera(dest,posizioniClip[p],posizioniClip[p+1],posizioniClip[p+2],0.22);}
    }
  }
  if(nTiro) porta(puntiTiro);
  // La piccola diagonale non deve invertire un tiro da posizione molto laterale.
  const laterale=Number.isFinite(minDist)?Math.max(0,Math.min(0.18,minDist*0.3/(maxZ+1))):0.12;
  const raggioPalla=ball3d.geometry.parameters.radius*ball3d.getWorldScale(punto).x;
  pianoCamera=preparaCameraReplay(puntiPrincipali,n,puntiTiro,nTiro,dir,laterale,{punti:puntiPalla,n:nPalla,raggio:raggioPalla});
  if(reazioneIdentificata){
    // angolo del primo piano scelto sul fotogramma del taglio, con le teste e i corpi degli altri come possibili ostacoli
    let f=0;while(f<countClip-1&&tempiClip[f]-tempiClip[0]<taglio)f++;
    const base=f*POSIZIONI, altri=[];
    for(let i=0;i<corpi.length;i++){
      if(i===marcatore||!clip[f*stride+riferimenti[i].offset+10]) continue;
      for(const o of [0,3]) altri.push(posizioniClip[base+i*12+o],Math.max(posizioniClip[base+i*12+o+1],0.15),posizioniClip[base+i*12+o+2]);
    }
    // direzione del corpo registrata: l'asse x locale del gruppo è il fronte del giocatore (updateRig in pose.js)
    const o=f*stride+riferimenti[marcatore].offset+3;
    qA.set(clip[o],clip[o+1],clip[o+2],clip[o+3]); punto.set(1,0,0).applyQuaternion(qA);
    const faccia=Math.hypot(punto.x,punto.z)>0.2?Math.atan2(punto.z,punto.x):undefined;
    if(!preparaPrimoPiano(pianoCamera,posizioniClip.subarray(base+marcatore*12,base+marcatore*12+12),altri,gx,faccia)) reazioneIdentificata=false;
  }
  tempoSchermo[0]=0;
  let indiceTaglio=-1;
  for(let f=1;f<countClip;f++){
    const a=tempiClip[f-1]-tempiClip[0],b=tempiClip[f]-tempiClip[0],m=(a+b)/2;
    let peso=1;
    if(eventi.rilascio!==null&&eventi.gol!==null){
      const entra=THREE.MathUtils.smootherstep(m,eventi.rilascio-0.22,eventi.rilascio+0.03);
      const esce=1-THREE.MathUtils.smootherstep(m,eventi.gol,eventi.gol+0.12);
      peso+=2.4*entra*esce;
    }
    tempoSchermo[f]=tempoSchermo[f-1]+(b-a)*peso;
    if(taglio!==null&&indiceTaglio<0&&b>=taglio-1e-7) indiceTaglio=f;
  }
  const totale=tempoSchermo[countClip-1],pre=indiceTaglio>0?tempoSchermo[indiceTaglio]:0,post=totale-pre;
  for(let f=0;f<countClip;f++){
    // L'azione fino al taglio occupa QUOTA_AZIONE dello schermo; il resto è il primo piano della reazione registrata.
    tempoSchermo[f]=pre>0&&post>0?(f<=indiceTaglio?tempoSchermo[f]/pre*QUOTA_AZIONE:QUOTA_AZIONE+(tempoSchermo[f]-pre)/post*(1-QUOTA_AZIONE)):tempoSchermo[f]/totale;
  }
}

function campioneReplay(progresso){
  const p=THREE.MathUtils.clamp(Number.isFinite(progresso)?progresso:0,0,1);
  let a=0;while(a<countClip-2&&tempoSchermo[a+1]<p)a++;
  const b=a+1,k=THREE.MathUtils.clamp((p-tempoSchermo[a])/Math.max(1e-9,tempoSchermo[b]-tempoSchermo[a]),0,1);
  return {p,a,b,k,t:THREE.MathUtils.lerp(tempiClip[a],tempiClip[b],k)-tempiClip[0]};
}

function identitaCorretta(frame){
  return marcatore>=0&&(!Number.isFinite(infoClip.numero)||numeriClip[frame*corpi.length+marcatore]===infoClip.numero)&&
    (!infoClip.nome||nomiClip[frame*corpi.length+marcatore]===infoClip.nome);
}

function primoPianoAttivo(s){ return reazioneIdentificata&&taglio!==null&&s.t>=taglio; }
function descriviRegia(s,cameraK=0){
  const fase=eventi.gol!==null&&s.t>=eventi.gol?(s.t<eventi.gol+0.06?'gol':'reazione'):
    eventi.rilascio!==null&&s.t>=eventi.rilascio?'tiro':'ricezione';
  const primo=primoPianoAttivo(s);
  return {fase,sorgente:s.t,ricezione:eventi.ricezione,rilascio:eventi.rilascio,gol:eventi.gol,
    taglio:primo,tempoTaglio:taglio,faseCamera:primo?'primoPiano':'principale',avvicinamento:cameraK,
    marcatoreIdentificato:marcatore>=0,durataClip:tempiClip[countClip-1]-tempiClip[0]};
}

// Senza toccare la scena: utile per collocare gli eventi nella barra del replay.
export function descriviFotogrammaReplay(progresso){
  return countClip>1?descriviRegia(campioneReplay(progresso)):null;
}

// Da leggere nel callback draw: le matrici e le pose sono quelle del fotogramma riprodotto.
export function ultimaRegiaReplay(){
  if(!ultimoDisegno)return null;
  return {...ultimoDisegno,posizioneCamera:Array.from(posizioneCameraUltima),fascia:{...(pianoCamera?.fascia||FASCIA_REPLAY)},
    bersagli:nomiBersagli.map((nome,i)=>({nome,posizione:Array.from(bersagliUltimi.subarray(i*6,i*6+3)),
      proiezione:Array.from(bersagliUltimi.subarray(i*6+3,i*6+6))}))};
}

// La callback esegue l'unico render. La scena torna al presente anche se la callback lancia un errore.
export function disegnaClipReplay(progresso,info,draw){
  if(countClip<2||inDisegno||strutturaCambiata()) return false;
  if(!pianoCamera||(marcatore<0&&Number.isFinite(info?.uid)))preparaRegia(info||{});
  const s=campioneReplay(progresso),{a,b,k}=s;
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
    const S=REGIA_REPLAY.stretta;
    const tiro=eventi.rilascio!==null?THREE.MathUtils.smootherstep(s.t,eventi.rilascio-S.prima,eventi.rilascio+S.dopo):0;
    let primo=null;
    if(primoPianoAttivo(s)){
      const pa=a*POSIZIONI+marcatore*12,pb=b*POSIZIONI+marcatore*12;
      for(let j=0;j<12;j++) m12[j]=THREE.MathUtils.lerp(posizioniClip[pa+j],posizioniClip[pb+j],k);
      primo={m:m12,k:THREE.MathUtils.clamp((s.p-QUOTA_AZIONE)/(1-QUOTA_AZIONE),0,1)};
      // da vicino i numeri sopra le teste sarebbero enormi: nel primo piano si leggono quelli sulla cuffia
      // (sono nodi registrati: il finally li riporta come erano)
      for(const p of corpi) if(p.mesh?.spr) p.mesh.spr.visible=false;
    }
    const cameraK=applicaCameraReplay(camera,pianoCamera,{azione:THREE.MathUtils.clamp(s.p/QUOTA_AZIONE,0,1),tiro,primo});
    scene.updateMatrixWorld(true);
    ultimoDisegno=descriviRegia(s,cameraK);
    const frame=k<0.5?a:b;
    ultimoDisegno.marcatoreIdentificato=identitaCorretta(frame);
    camera.position.toArray(posizioneCameraUltima);
    for(let i=0;i<nomiBersagli.length;i++){
      if(i===0)punto.copy(ball3d.position);
      else if(i<5&&marcatore>=0){
        const r=riferimenti[marcatore],o=i===1?r.testa:i===2?r.manoD:i===3?r.manoS:r.g;
        o.getWorldPosition(punto);
      }else if(i>=5)punto.set((Math.sign(infoClip.dir)||1)*HL,i%2===0?GH:0,i<7?-GW:GW);
      else punto.set(NaN,NaN,NaN);
      punto.toArray(bersagliUltimi,i*6);punto.project(camera).toArray(bersagliUltimi,i*6+3);
    }
    draw();
    return true;
  }finally{
    for(let i=0;i<nodi.length;i++){
      const n=nodi[i], o=n.oggetto, j=n.offset;
      if(n.soloRotazione)o.quaternion.fromArray(attuale,j);
      else{ o.position.fromArray(attuale,j); o.quaternion.fromArray(attuale,j+3); o.scale.fromArray(attuale,j+7); o.visible=!!attuale[j+10]; }
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
    strideFloats:stride, falangiCompatte:nodi.filter(n=>n.soloRotazione).length, effettiRegistrati:istanze.length,
    eventi:{...eventi},marcatoreIdentificato:ultimoDisegno?.marcatoreIdentificato??(countClip>0&&identitaCorretta(0)),faseCamera:ultimoDisegno?.faseCamera||null,
    durata:count>1?tempi[(testa-1+CAPACITA)%CAPACITA]-tempi[(testa-count+CAPACITA)%CAPACITA]:0,
    durataClip:countClip>1?tempiClip[countClip-1]-tempiClip[0]:0,
    bytes:dati.byteLength+clip.byteLength+attuale.byteLength+matrici.byteLength+matriciDisegno.byteLength+tempi.byteLength+tempiClip.byteLength+
      metadati.byteLength+metaClip.byteLength+numeri.byteLength+numeriClip.byteLength+posizioni.byteLength+posizioniClip.byteLength+
      tempoSchermo.byteLength+puntiPrincipali.byteLength+puntiTiro.byteLength+puntiPalla.byteLength+bersagliUltimi.byteLength+posizioneCameraUltima.byteLength+(nomi.length+nomiClip.length)*8+
      istanze.reduce((n,i)=>n+i.blocchi.reduce((s,b)=>s+b.salvati.byteLength,0),0)+textureCongelate.reduce((n,r)=>n+r.tex.image.width*r.tex.image.height*4,0),
  };
}
