// Corpo dei giocatori: modello con scheletro mosso interamente da noi, osso per osso (nessuna animazione registrata).
// pose.js decide dove stanno le giunture (bacino, petto, spalle, gomiti, mani, ginocchia, piedi); qui le si applica
// alle ossa di un modello qualsiasi descritto in modelli/*.js, e si aggiungono le gambe a bicicletta.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as clonaConScheletro } from 'three/addons/utils/SkeletonUtils.js';
import MODELLO from './modelli/ybot.js';
import { STRATO_CORPI, STRATO_SOLO_VISTA, STRATO_SOTTO } from './acqua.js';

const SPALLE=0.40;                       // distanza tra le spalle nel sistema di pose.js: da qui si ricava la scala del modello
let base=null;                           // { scena, scala, y0, y1 }
const inAttesa=[];
export let modelloPronto=false;
{
  const carica=u=>new Promise((ok,ko)=>new GLTFLoader().load(u,ok,undefined,ko));
  Promise.all([carica(MODELLO.url),carica(MODELLO.urlLontano)]).then(([vicino,lontano])=>{
    const maglia=s=>{ let m=null; s.traverse(o=>{ if(o.isSkinnedMesh) m=o; }); return m; };
    const mv=maglia(vicino.scene), ml=maglia(lontano.scene);
    mv.name='corpo'; mv.geometry.computeBoundingBox();
    // versione leggera (vista sott'acqua): stessa ossatura della versione dettagliata
    const leggera=new THREE.SkinnedMesh(ml.geometry,mv.material); leggera.name='corpoLontano';
    mv.parent.add(leggera); leggera.bind(mv.skeleton,mv.bindMatrix);
    vicino.scene.updateMatrixWorld(true);
    const a=new THREE.Vector3(), b=new THREE.Vector3();
    vicino.scene.getObjectByName(MODELLO.ossa.bracD).getWorldPosition(a); vicino.scene.getObjectByName(MODELLO.ossa.bracS).getWorldPosition(b);
    const bb=mv.geometry.boundingBox;
    base={ scena:vicino.scene, scala:SPALLE/a.distanceTo(b)*MODELLO.proporzione, y0:bb.min.y, y1:bb.max.y };
    for(const f of inAttesa) f();
    inAttesa.length=0; modelloPronto=true;
  }).catch(e=>console.error('Modello dei giocatori non caricato: restano i manichini semplici',e));
}

// calottina con paraorecchie e numero sui lati e dietro (un solo oggetto, attaccato all'osso della testa)
function disegnaCalottina(tex,num,colore,paraorecchie,testo){
  const c=tex.image, x=c.getContext('2d'), w=c.width, h=c.height;
  x.fillStyle=colore; x.fillRect(0,0,w,h);
  x.fillStyle=paraorecchie; x.fillRect(0,h-12,w,12);                    // striscia usata dai paraorecchie
  x.fillStyle=testo; x.font='bold 30px sans-serif'; x.textAlign='center'; x.textBaseline='middle';
  for(const u of [0,0.5,0.75,1]) x.fillText(String(num),u*w,h*0.36);    // lati (0 e 0,5) e nuca (0,75)
  tex.needsUpdate=true;
}
let geoCalottina=null;
function calottinaGeo(){
  if(geoCalottina) return geoCalottina;
  const M=MODELLO.calottina, r=M.raggio;
  const parti=[new THREE.SphereGeometry(r,20,10,0,Math.PI*2,0,Math.PI*0.6)];
  for(const lato of [-1,1]){ const o=new THREE.SphereGeometry(r*0.29,8,6); o.scale(0.55,1,1); o.translate(lato*M.paraorecchie[0],M.paraorecchie[1],M.paraorecchie[2]);
    const uv=o.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,0.5,0.02); parti.push(o); }
  const g=new THREE.BufferGeometry(), att={position:[],normal:[],uv:[]}, ind=[]; let off=0;
  for(const p of parti){ for(const n in att) att[n].push(...p.attributes[n].array); for(const i of p.index.array) ind.push(i+off); off+=p.attributes.position.count; }
  g.setAttribute('position',new THREE.Float32BufferAttribute(att.position,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(att.normal,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(att.uv,2)); g.setIndex(ind);
  g.rotateX(-0.12); g.translate(0,M.su,M.avanti);
  return geoCalottina=g;
}

const hex=n=>'#'+n.toString(16).padStart(6,'0');
// R = "manichino" del giocatore creato in modello.js; colori = { pelle, costume, calottina, paraorecchie, testo }
export function attaccaCorpo(R,colori,num,seme){
  const crea=()=>{
    const radice=clonaConScheletro(base.scena);
    radice.scale.setScalar(base.scala); radice.rotation.y=Math.PI/2;      // il modello guarda +Z, il giocatore +X
    const C={ radice, ossa:{}, riposo:{}, azzera:[], fase:seme*1.7, num:-1, colori };
    // pelle: colore del giocatore, un po' lucida perché bagnata; costume nella fascia del bacino
    const pelle=new THREE.MeshPhongMaterial({color:0xffffff,shininess:38,specular:0x3a3530,emissive:new THREE.Color(colori.pelle).multiplyScalar(0.07)});
    const u={ uPelle:{value:new THREE.Color(colori.pelle)}, uCostume:{value:new THREE.Color(colori.costume)}, uY:{value:new THREE.Vector2(base.y0,base.y1)},
      uFascia:{value:new THREE.Vector2(MODELLO.costume[0],MODELLO.costume[1])} };
    pelle.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,u);
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform vec2 uY; varying float vQuota;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nvQuota=(position.y-uY.x)/(uY.y-uY.x);');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uPelle, uCostume; uniform vec2 uFascia; varying float vQuota;')
        .replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(uPelle,uCostume,smoothstep(uFascia.x,uFascia.x+0.01,vQuota)*(1.0-smoothstep(uFascia.y-0.01,uFascia.y,vQuota)));'); };
    const nomi=Object.entries(MODELLO.ossa);
    radice.traverse(o=>{
      for(const [k,n] of nomi) if(o.name===n){ C.ossa[k]=o; C.riposo[k]=o.quaternion.clone(); }
      if(MODELLO.daAzzerare.includes(o.name)) C.azzera.push([o,o.quaternion.clone()]);
      o.layers.set(STRATO_CORPI);
      if(o.isSkinnedMesh){ o.material=pelle; o.frustumCulled=false; o.layers.set(o.name==='corpoLontano'?STRATO_SOTTO:STRATO_SOLO_VISTA); }
    });
    const tex=new THREE.CanvasTexture(Object.assign(document.createElement('canvas'),{width:256,height:96})); tex.colorSpace=THREE.SRGBColorSpace;
    C.texCal=tex;
    C.calottina=new THREE.Mesh(calottinaGeo(),new THREE.MeshPhongMaterial({map:tex,shininess:35}));
    C.calottina.layers.set(STRATO_SOLO_VISTA);      // la testa sta fuori dall'acqua: inutile ridisegnarla nella vista sott'acqua
    C.ossa.testa.add(C.calottina);
    R.g.add(radice); R.corpo=C;
    for(const k of R.vecchi) k.visible=false;                          // spariscono cilindri e sfere
    aggiornaNumero(R,num);
  };
  if(base) crea(); else inAttesa.push(crea);
}
export function aggiornaNumero(R,num){
  const C=R.corpo; if(!C||C.num===num) return;
  C.num=num; disegnaCalottina(C.texCal,num,hex(C.colori.calottina),hex(C.colori.paraorecchie),C.colori.testo);
}

// ---------- movimento ----------
const _a=new THREE.Vector3(), _b=new THREE.Vector3(), _d=new THREE.Vector3(), _d2=new THREE.Vector3(), _v=new THREE.Vector3();
const _q=new THREE.Quaternion(), _qp=new THREE.Quaternion(), _qd=new THREE.Quaternion(), _qg=new THREE.Quaternion(), _qr=new THREE.Quaternion();
const _su=new THREE.Vector3(), _av=new THREE.Vector3(), _de=new THREE.Vector3(), _m=new THREE.Matrix4(), _inv=new THREE.Matrix4();
const ROT_MODELLO=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);
// gira l'osso in modo che punti (verso il figlio) nella direzione data, in coordinate del mondo
function punta(osso,figlio,dir,peso){
  osso.getWorldPosition(_a); figlio.getWorldPosition(_b); _b.sub(_a).normalize();
  _qd.setFromUnitVectors(_b,dir);
  osso.getWorldQuaternion(_q); osso.parent.getWorldQuaternion(_qp);
  _q.premultiply(_qd).premultiply(_qp.invert());
  if(peso===undefined||peso>=0.999) osso.quaternion.copy(_q); else osso.quaternion.slerp(_q,peso);
}
// porta l'orientamento dell'osso verso quello dato (nel mondo)
function orienta(osso,qMondo,peso){
  osso.parent.getWorldQuaternion(_qp); _q.copy(qMondo).premultiply(_qp.invert());
  osso.quaternion.slerp(_q,peso);
}
// J = giunture (smussate) nel sistema del giocatore: x avanti, y su, z a destra.
// T = posa richiesta: T.oriz dice quanto il corpo è disteso (0 = verticale, 1 = orizzontale in nuotata).
export function muoviCorpo(R,J,T,dt){
  const C=R.corpo; if(!C) return;
  const O=C.ossa, P=C.riposo, s=base.scala, e=T.oriz||0;
  // si riparte ogni volta dalla posa di riposo: il risultato dipende solo dalle giunture di questo istante
  for(const k in O) O[k].quaternion.copy(P[k]);
  for(const [o,q] of C.azzera) o.quaternion.copy(q);
  R.g.updateMatrix(); R.g.matrixWorld.copy(R.g.matrix); C.radice.updateMatrix(); C.radice.matrixWorld.multiplyMatrices(R.g.matrixWorld,C.radice.matrix);
  _qg.copy(R.g.quaternion);                                 // orientamento del giocatore nel mondo
  const dirMondo=(a,b,out)=>out.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize().applyQuaternion(_qg);
  // --- busto: asse bacino→petto e linea delle spalle danno inclinazione, rotazione e rollio ---
  dirMondo(J.hip,J.chest,_su);
  dirMondo(J.sL,J.sR,_de); _av.crossVectors(_su,_de).normalize(); _de.crossVectors(_av,_su).normalize();
  _m.makeBasis(_v.copy(_de).negate(),_su,_av); _qr.setFromRotationMatrix(_m);      // assi del modello: X = sinistra, Y = su, Z = avanti
  O.bacino.parent.getWorldQuaternion(_qp); O.bacino.quaternion.copy(_qr).premultiply(_qp.invert());
  // posizione: le spalle del modello vanno dove le vuole pose.js
  const pv=O.bacino.position; pv.set(0,0,0);
  _inv.copy(C.radice.matrixWorld).invert();
  O.bracD.getWorldPosition(_a); O.bracS.getWorldPosition(_b); _a.add(_b).multiplyScalar(0.5).applyMatrix4(_inv);
  pv.set(-(J.sL[2]+J.sR[2])/2/s-_a.x, (J.sL[1]+J.sR[1])/2/s-_a.y, (J.sL[0]+J.sR[0])/2/s-_a.z);
  // --- gambe: bicicletta (calcio a rana alternato) da verticali, battuta a gambe unite da distesi, con passaggio continuo ---
  const sforzo=Math.min(1,Math.max(0,(J.chest[1]+0.06)/0.26))*(1-e);
  C.fase+=dt*(5.2+6.5*sforzo);
  const amp=0.85+0.45*sforzo;
  for(const lato of [1,-1]){
    const f=C.fase+(lato>0?0:Math.PI), cs=Math.cos(f), sn=Math.sin(f);
    const coscia=lato>0?O.cosciaD:O.cosciaS, gamba=lato>0?O.gambaD:O.gambaS, piede=lato>0?O.piedeD:O.piedeS, puntaP=lato>0?O.puntaD:O.puntaS;
    const gin=lato>0?J.kR:J.kL, pie=lato>0?J.fR:J.fL;
    // coscia: da verticali avanti e in fuori, quasi seduti, con il ginocchio che disegna un piccolo cerchio
    _d.copy(_av).multiplyScalar(0.70).addScaledVector(_de,lato*(0.50+0.10*sn)).addScaledVector(_su,-0.48-0.09*cs).normalize();
    if(e>0.001){ dirMondo(J.hip,gin,_d2); _d.lerp(_d2,e).normalize(); }
    punta(coscia,gamba,_d);
    // sotto il ginocchio: il piede gira in cerchio (verso opposto tra destra e sinistra, mezzo giro di ritardo)
    _d.copy(_su).multiplyScalar(-0.80).addScaledVector(_de,lato*0.55*cs*amp).addScaledVector(_av,-0.15+0.5*sn*amp).normalize();
    if(e>0.001){ dirMondo(gin,pie,_d2); _d.lerp(_d2,e).normalize(); }
    punta(gamba,piede,_d);
    // in battuta il piede si distende in linea con la gamba
    if(puntaP&&e>0.05) punta(piede,puntaP,_d,e*0.8);
  }
  // --- braccia: gomito e mano dove li mette pose.js ---
  punta(O.bracD,O.avamD,dirMondo(J.sR,J.eR,_d)); punta(O.avamD,O.manoD,dirMondo(J.eR,J.hR,_d));
  punta(O.bracS,O.avamS,dirMondo(J.sL,J.eL,_d)); punta(O.avamS,O.manoS,dirMondo(J.eL,J.hL,_d));
  // --- testa alta e ferma, che guarda avanti: sia da fermi sia in nuotata ---
  _qr.copy(_qg).multiply(ROT_MODELLO);
  orienta(O.collo,_qr,0.5); orienta(O.testa,_qr,0.9);
}
