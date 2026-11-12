// Corpo dei giocatori: modello con scheletro mosso interamente da noi, osso per osso (nessuna animazione registrata).
// pose.js decide dove stanno le giunture (bacino, petto, spalle, gomiti, mani, ginocchia, piedi); qui le si applica
// alle ossa di un modello qualsiasi descritto in modelli/*.js, e si aggiungono le gambe a bicicletta.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as clonaConScheletro } from 'three/addons/utils/SkeletonUtils.js';
import MODELLO from './modelli/atleta.js';
import { STRATO_CORPI, STRATO_SOLO_VISTA, STRATO_SOTTO } from './acqua.js';
import { alCambioStile, cartoon } from './stile.js';
import { calottinaGeo, disegnaCalottina } from './calottina.js';

const SPALLE=0.40;                       // distanza tra le spalle nel sistema di pose.js: da qui si ricava la scala del modello
const basi={};                           // per ogni corporatura: { scena, scala, testa }
let pelli=[];                            // immagini della pelle (una per variante)
const inAttesa=[];
export let modelloPronto=false;
{
  const carica=u=>new Promise((ok,ko)=>new GLTFLoader().load(u,ok,undefined,ko));
  const immagine=u=>new Promise((ok,ko)=>new THREE.TextureLoader().load(u,t=>{ t.colorSpace=THREE.SRGBColorSpace; t.flipY=false; t.anisotropy=4; ok(t); },undefined,ko));
  const nomi=Object.keys(MODELLO.corporature);
  Promise.all([Promise.all(nomi.map(n=>Promise.all([carica(MODELLO.corporature[n].url),carica(MODELLO.corporature[n].urlLontano)]))),
               Promise.all(MODELLO.pelli.map(p=>immagine(p.url)))]).then(([modelli,immagini])=>{
    const maglia=s=>{ let m=null; s.traverse(o=>{ if(o.isSkinnedMesh) m=o; }); return m; };
    nomi.forEach((n,i)=>{
      const [vicino,lontano]=modelli[i], mv=maglia(vicino.scene), ml=maglia(lontano.scene);
      mv.name='corpo';
      // versione leggera (vista sott'acqua): stessa ossatura della versione dettagliata
      const leggera=new THREE.SkinnedMesh(ml.geometry,mv.material); leggera.name='corpoLontano';
      mv.parent.add(leggera); leggera.bind(mv.skeleton,mv.bindMatrix);
      vicino.scene.updateMatrixWorld(true);
      const a=new THREE.Vector3(), b=new THREE.Vector3();
      vicino.scene.getObjectByName(MODELLO.ossa.bracD).getWorldPosition(a); vicino.scene.getObjectByName(MODELLO.ossa.bracS).getWorldPosition(b);
      basi[n]={ scena:vicino.scene, scala:SPALLE/a.distanceTo(b)*MODELLO.proporzione, testa:MODELLO.corporature[n].testa };
    });
    pelli=immagini;
    for(const f of inAttesa) f();
    inAttesa.length=0; modelloPronto=true;
  }).catch(e=>console.error('Modello dei giocatori non caricato: restano i manichini semplici',e));
}

const geoCalottine={};
const calottinaPer=nome=>geoCalottine[nome]||(geoCalottine[nome]=calottinaGeo(basi[nome].testa));
const hex=n=>'#'+n.toString(16).padStart(6,'0');
// ---------- stile cartoon ----------
// luce a tre gradini per i colori pieni
const GRADINI=(()=>{ const t=new THREE.DataTexture(new Uint8Array([120,120,120,255, 200,200,200,255, 255,255,255,255]),3,1,THREE.RGBAFormat); t.minFilter=t.magFilter=THREE.NearestFilter; t.needsUpdate=true; return t; })();
const corpi=[];
// tinta piatta di ogni pelle: il colore medio della sua immagine (un po' ravvivato); sotto una certa luminosità l'immagine
// diventa "tratto scuro" (occhi, sopracciglia, barba, ombre dei muscoli), così il volto resta leggibile anche a colori pieni
const _toni=[];
function tonoPelle(i){
  if(_toni[i]) return _toni[i];
  const c=document.createElement('canvas'); c.width=c.height=32; const x=c.getContext('2d',{willReadFrequently:true});
  x.drawImage(pelli[i].image,0,0,32,32); const d=x.getImageData(0,0,32,32).data; let r=0,g=0,b=0;
  for(let k=0;k<d.length;k+=4){ r+=d[k]; g+=d[k+1]; b+=d[k+2]; }
  const n=d.length/4, col=new THREE.Color().setRGB(r/n/255,g/n/255,b/n/255,THREE.SRGBColorSpace), lum=col.r*0.3+col.g*0.6+col.b*0.1;
  const tono=col.clone().multiplyScalar(1.18);
  return _toni[i]={ tono, scuro:lum*0.5 };
}
// proporzioni semplificate e un po' esagerate: testa (con calottina e numero) e mani più grandi, spalle più larghe.
// Sono solo scale delle ossa: pose e posizione della palla non cambiano.
function vestiStile(C,c){
  for(const m of C.maglie) m.material=c?C.fumetto:C.pelle;
  C.calottina.material=c?C.calPiatta:C.calVera;
  const O=C.ossa;
  O.testa.scale.setScalar(c?1.3:1);
  for(const k of ['manoD','manoS']) if(O[k]) O[k].scale.setScalar(c?1.45:1);
  for(const [o] of C.azzera) if(/^clavicle/.test(o.name)) o.scale.setScalar(c?1.14:1);      // spalle più larghe…
  for(const k of ['bracD','bracS']) O[k].scale.setScalar(c?1/1.14:1);                           // …ma braccia lunghe uguali (la mano resta sulla palla)
  C.num=-1;      // la calottina va ridisegnata (in cartoon il numero è più grande)
}
alCambioStile(c=>{ for(const C of corpi) vestiStile(C,c); });

// R = "manichino" del giocatore creato in modello.js; colori = { costume, calottina, paraorecchie, testo }
export function attaccaCorpo(R,colori,num,seme){
  const crea=()=>{
    const variante=seme%pelli.length, nome=MODELLO.pelli[variante].corporatura, base=basi[nome];
    const radice=clonaConScheletro(base.scena);
    radice.scale.setScalar(base.scala); radice.rotation.y=Math.PI/2;      // il modello guarda +Z, il giocatore +X
    const C={ radice, scala:base.scala, ossa:{}, riposo:{}, azzera:[], schiena:[], fase:seme*1.7, num:-1, colori:R.coloriVoluti||colori };
    // pelle con il suo disegno (volto, muscoli), lucida perché bagnata; costume nella zona segnata nel modello
    const pelle=new THREE.MeshPhongMaterial({map:pelli[variante],shininess:70,specular:0x6a6660});
    const u={ uCostume:{value:new THREE.Color(C.colori.costume)}, uFascia:{value:new THREE.Vector2(base.testa.costume[0],base.testa.costume[1])} };
    pelle.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,u);
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float _costume; varying float vCostume; varying float vQuota;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nvCostume=_costume; vQuota=position.y;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uCostume; uniform vec2 uFascia; varying float vCostume; varying float vQuota;')
        .replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,uCostume,smoothstep(0.3,0.7,vCostume)*smoothstep(uFascia.x,uFascia.x+0.05,vQuota)*(1.0-smoothstep(uFascia.y-0.05,uFascia.y,vQuota)));'); };
    // versione cartoon: colori pieni a poche tonalità (luce a gradini e immagine della pelle "appiattita"), bordo scuro lungo il
    // profilo del corpo; stesso costume. Nessun oggetto in più da disegnare: cambia solo il materiale.
    const fumetto=new THREE.MeshToonMaterial({map:pelli[variante],gradientMap:GRADINI});
    const T=tonoPelle(variante);
    fumetto.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,u,{ uTono:{value:T.tono}, uScuro:{value:T.scuro} });
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float _costume; varying float vCostume; varying float vQuota;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nvCostume=_costume; vQuota=position.y;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uCostume; uniform vec2 uFascia; uniform vec3 uTono; uniform float uScuro; varying float vCostume; varying float vQuota;')
        .replace('#include <map_fragment>','#include <map_fragment>\n{ float lum=dot(diffuseColor.rgb,vec3(0.3,0.6,0.1)); diffuseColor.rgb=uTono*(lum<uScuro?0.42:lum<uScuro*1.35?0.8:1.0); }\ndiffuseColor.rgb=mix(diffuseColor.rgb,uCostume,step(0.5,vCostume)*step(uFascia.x,vQuota)*(1.0-step(uFascia.y,vQuota)));')
        .replace('#include <opaque_fragment>','if(abs(dot(normalize(vViewPosition),normal))<0.4) outgoingLight=vec3(0.05,0.07,0.13);\n#include <opaque_fragment>'); };
    C.pelle=pelle; C.fumetto=fumetto; C.maglie=[];
    const nomi=Object.entries(MODELLO.ossa);
    radice.traverse(o=>{
      for(const [k,n] of nomi) if(o.name===n){ C.ossa[k]=o; C.riposo[k]=o.quaternion.clone(); }
      if(MODELLO.daAzzerare.includes(o.name)) C.azzera.push([o,o.quaternion.clone()]);
      if(/^spine_0[123]$/.test(o.name)) C.schiena.push(o);
      o.layers.set(STRATO_CORPI);
      if(o.isSkinnedMesh){ o.material=pelle; C.maglie.push(o); o.frustumCulled=false; o.layers.set(o.name==='corpoLontano'?STRATO_SOTTO:STRATO_SOLO_VISTA); }
    });
    const tex=new THREE.CanvasTexture(Object.assign(document.createElement('canvas'),{width:256,height:128})); tex.colorSpace=THREE.SRGBColorSpace;
    C.texCal=tex;
    C.calottina=new THREE.Mesh(calottinaPer(nome),new THREE.MeshPhongMaterial({map:tex,shininess:60,specular:0x555555,side:THREE.DoubleSide}));
    C.calVera=C.calottina.material; C.calPiatta=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});
    C.calottina.layers.set(STRATO_SOLO_VISTA);      // la testa sta fuori dall'acqua: inutile ridisegnarla nella vista sott'acqua
    C.ossa.testa.add(C.calottina);
    C.uCostume=u.uCostume;
    R.g.add(radice); R.corpo=C;
    corpi.push(C); vestiStile(C,cartoon());
    for(const k of R.vecchi) k.visible=false;                          // spariscono cilindri e sfere
    aggiornaNumero(R,R.numVoluto??num);
  };
  if(modelloPronto) crea(); else inAttesa.push(crea);
}
// cambia colori e numero (anche prima che il modello sia caricato: li trova pronti)
export function aggiornaColori(R,colori,num){
  R.coloriVoluti=colori; R.numVoluto=num;
  const C=R.corpo; if(!C) return;
  C.colori=colori; C.uCostume.value.setHex(colori.costume); C.num=-1; aggiornaNumero(R,num);
}
export function aggiornaNumero(R,num){
  const C=R.corpo; if(!C||C.num===num) return;
  C.num=num; disegnaCalottina(C.texCal,num,hex(C.colori.calottina),hex(C.colori.paraorecchie),C.colori.testo,cartoon());
}

// ---------- movimento ----------
const _a=new THREE.Vector3(), _b=new THREE.Vector3(), _d=new THREE.Vector3(), _d2=new THREE.Vector3(), _v=new THREE.Vector3();
const _q=new THREE.Quaternion(), _qp=new THREE.Quaternion(), _qd=new THREE.Quaternion(), _qg=new THREE.Quaternion(), _qr=new THREE.Quaternion();
const _su=new THREE.Vector3(), _av=new THREE.Vector3(), _de=new THREE.Vector3(), _m=new THREE.Matrix4(), _inv=new THREE.Matrix4();
const SU=new THREE.Vector3(0,1,0), _qy=new THREE.Quaternion(), _qg2=new THREE.Quaternion(), PIEGA0={petto:0,bacino:0,gambe:0};
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
  const O=C.ossa, P=C.riposo, s=C.scala, e=T.oriz||0;
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
  // colonna che si piega: il bacino resta indietro rispetto alle spalle (ruota attorno alla verticale del ritardo calcolato da
  // pose.js) e le tre ossa della schiena recuperano la differenza un po' ciascuna, fino al petto; le spalle restano dove le
  // vuole la posa, quindi il corpo gira attorno a testa e spalle e il bacino descrive l'arco più largo
  const pg=T.piega||PIEGA0;
  if(Math.abs(pg.bacino)>0.002) _qr.premultiply(_qy.setFromAxisAngle(SU,pg.bacino));
  O.bacino.parent.getWorldQuaternion(_qp); O.bacino.quaternion.copy(_qr).premultiply(_qp.invert());
  if(Math.abs(pg.bacino)>0.002 && C.schiena.length){
    const passo=(pg.petto-pg.bacino)/C.schiena.length; _qy.setFromAxisAngle(SU,passo);
    for(const o of C.schiena){ o.getWorldQuaternion(_q); o.parent.getWorldQuaternion(_qp); o.quaternion.copy(_q.premultiply(_qy).premultiply(_qp.invert())); }
  }
  // le gambe seguono con un ritardo ancora maggiore
  const qGambe=Math.abs(pg.gambe)>0.002 ? _qg2.setFromAxisAngle(SU,pg.gambe) : null, curva=Math.abs(T.curva||0);
  // posizione: le spalle del modello vanno dove le vuole pose.js
  const pv=O.bacino.position; pv.set(0,0,0);
  _inv.copy(C.radice.matrixWorld).invert();
  O.bracD.getWorldPosition(_a); O.bracS.getWorldPosition(_b); _a.add(_b).multiplyScalar(0.5).applyMatrix4(_inv);
  pv.set(-(J.sL[2]+J.sR[2])/2/s-_a.x, (J.sL[1]+J.sR[1])/2/s-_a.y, (J.sL[0]+J.sR[0])/2/s-_a.z);
  // --- gambe: bicicletta (calcio a rana alternato) da verticali, battuta a gambe unite da distesi, con passaggio continuo ---
  const sforzo=Math.min(1,Math.max(0,(J.chest[1]+0.06)/0.26))*(1-e);
  // girandosi da verticali le gambe cambiano ritmo e ampiezza (è la bicicletta che fa ruotare il corpo)
  C.fase+=dt*(5.2+6.5*sforzo)*(1+0.6*curva*(1-e));
  const amp=(0.85+0.45*sforzo)*(1+0.3*curva*(1-e));
  for(const lato of [1,-1]){
    const f=C.fase+(lato>0?0:Math.PI), cs=Math.cos(f), sn=Math.sin(f);
    const coscia=lato>0?O.cosciaD:O.cosciaS, gamba=lato>0?O.gambaD:O.gambaS, piede=lato>0?O.piedeD:O.piedeS, puntaP=lato>0?O.puntaD:O.puntaS;
    const gin=lato>0?J.kR:J.kL, pie=lato>0?J.fR:J.fL;
    // coscia: da verticali avanti e in fuori, quasi seduti, con il ginocchio che disegna un piccolo cerchio
    _d.copy(_av).multiplyScalar(0.70).addScaledVector(_de,lato*(0.50+0.10*sn)).addScaledVector(_su,-0.48-0.09*cs).normalize();
    if(e>0.001){ dirMondo(J.hip,gin,_d2); _d.lerp(_d2,e).normalize(); }
    if(qGambe) _d.applyQuaternion(qGambe);
    punta(coscia,gamba,_d);
    // sotto il ginocchio: il piede gira in cerchio (verso opposto tra destra e sinistra, mezzo giro di ritardo)
    _d.copy(_su).multiplyScalar(-0.80).addScaledVector(_de,lato*0.55*cs*amp).addScaledVector(_av,-0.15+0.5*sn*amp).normalize();
    if(e>0.001){ dirMondo(gin,pie,_d2); _d.lerp(_d2,e).normalize(); }
    if(qGambe) _d.applyQuaternion(_qy.setFromAxisAngle(SU,pg.gambe*1.25));      // la gamba sotto il ginocchio resta ancora un po' più indietro: coda leggermente piegata
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
