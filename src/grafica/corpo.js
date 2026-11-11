// Corpo dei giocatori: modello con scheletro mosso interamente da noi, osso per osso (nessuna animazione registrata).
// pose.js decide dove stanno le giunture (bacino, petto, spalle, gomiti, mani, ginocchia, piedi); qui le si applica
// alle ossa di un modello qualsiasi descritto in modelli/*.js, e si aggiungono le gambe a bicicletta.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as clonaConScheletro } from 'three/addons/utils/SkeletonUtils.js';
import MODELLO from './modelli/atleta.js';
import { STRATO_CORPI, STRATO_SOLO_VISTA, STRATO_SOTTO } from './acqua.js';

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

// ---------- calottina ----------
// Oggetto a sé, più grande della testa: guscio colorato con bordo bianco e numero su lati e nuca, paraorecchie rigidi
// con i fori, laccetti annodati sotto il mento. Un solo oggetto con una sola immagine, attaccato all'osso della testa.
function disegnaCalottina(tex,num,colore,paraorecchie,testo){
  const c=tex.image, x=c.getContext('2d'), w=c.width, h=c.height, yBordo=h*0.74;
  x.fillStyle=colore; x.fillRect(0,0,w,yBordo);
  // cuciture a spicchi e bordo bianco
  x.strokeStyle='rgba(0,0,0,.16)'; x.lineWidth=1.5; for(let i=0;i<6;i++){ x.beginPath(); x.moveTo((i+0.5)/6*w,0); x.lineTo((i+0.5)/6*w,yBordo); x.stroke(); }
  x.fillStyle='#f4f4f0'; x.fillRect(0,yBordo-h*0.05,w,h*0.05+1);
  x.fillStyle=testo; x.font=`bold ${Math.round(h*0.3)}px sans-serif`; x.textAlign='center'; x.textBaseline='middle';
  for(const u of [0.25,0.5,0.75]) x.fillText(String(num),u*w,h*0.4);                 // lati e nuca
  // riquadro dei paraorecchie (in basso a sinistra): plastica con fori; riquadro dei laccetti (in basso a destra): bianco
  x.fillStyle=paraorecchie; x.fillRect(0,yBordo,w/2,h-yBordo);
  x.fillStyle='rgba(20,20,25,.75)'; const cx=w/4, cy=(yBordo+h)/2, r=(h-yBordo)*0.36;
  for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0.5,0.87],[-0.5,0.87],[0.5,-0.87],[-0.5,-0.87]]){ x.beginPath(); x.arc(cx+dx*r*0.72,cy+dy*r*0.72,r*0.2,0,7); x.fill(); }
  x.fillStyle='#f4f4f0'; x.fillRect(w/2,yBordo,w/2,h-yBordo);
  tex.needsUpdate=true;
}
const geoCalottine={};
function calottinaGeo(nome){
  if(geoCalottine[nome]) return geoCalottine[nome];
  const T=basi[nome].testa, [cx,cy,cz]=T.centro, [rx,ry,rz]=T.raggi, P=[], N=[], U=[], I=[];
  // quanto sporge il cranio in una direzione (misurato sul modello): la calottina sta appena fuori
  const Q=T.profilo, raggio=(az,pol)=>{ const fa=((az/(Math.PI*2))%1+1)%1*Q.NA, a0=Math.floor(fa)%Q.NA, a1=(a0+1)%Q.NA, ta=fa-Math.floor(fa);
    const fk=Math.min(Q.NP,pol/(Q.fino*Math.PI/180)*Q.NP), k0=Math.floor(fk), k1=Math.min(Q.NP,k0+1), tk=fk-k0, v=(a,k)=>Q.r[a*(Q.NP+1)+k];
    return ((v(a0,k0)*(1-ta)+v(a1,k0)*ta)*(1-tk)+(v(a0,k1)*(1-ta)+v(a1,k1)*ta)*tk)*1.025+ry*0.02; };
  const VB=0.26;                                             // sotto questa quota dell'immagine stanno paraorecchie e laccetti
  // guscio: copre dalla fronte alla nuca e scende sulle orecchie
  const NA=32, NP=10;
  for(let a=0;a<=NA;a++){ const az=a/NA*Math.PI*2, fino=(60+25*(1-Math.cos(az))+24*Math.sin(az)**2)*Math.PI/180;
    for(let k=0;k<=NP;k++){ const f=k/NP*fino, sx=Math.sin(f)*Math.sin(az), sy=Math.cos(f), sz=Math.sin(f)*Math.cos(az), r=raggio(az,f);
      P.push(cx+r*sx,cy+r*sy,cz+r*sz); const n=new THREE.Vector3(sx/rx,sy/ry,sz/rz).normalize(); N.push(n.x,n.y,n.z);
      U.push(1-a/NA,VB+(1-VB)*(1-k/NP)); } }
  for(let a=0;a<NA;a++) for(let k=0;k<NP;k++){ const i=a*(NP+1)+k, j=i+NP+1; I.push(i,i+1,j, j,i+1,j+1); }
  const unisci=(g,uv)=>{ const o=P.length/3, p=g.attributes.position, n=g.attributes.normal;
    for(let i=0;i<p.count;i++){ P.push(p.getX(i),p.getY(i),p.getZ(i)); N.push(n.getX(i),n.getY(i),n.getZ(i)); const [u,v]=uv(i); U.push(u,v); }
    const ix=g.index.array; for(let i=0;i<ix.length;i++) I.push(ix[i]+o); };
  for(const lato of [1,-1]){
    // paraorecchie: disco rigido sopra l'orecchio
    const r=ry*0.36, d=new THREE.CylinderGeometry(r,r*0.82,ry*0.16,16); d.rotateZ(Math.PI/2*-lato); d.translate(lato*(T.orecchio[0]+ry*0.10),T.orecchio[1]+ry*0.02,T.orecchio[2]+rz*0.04);
    const pd=d.attributes.position; unisci(d,i=>[0.25+(pd.getZ(i)-T.orecchio[2]-rz*0.04)/r*0.2, VB*0.5+(pd.getY(i)-T.orecchio[1]-ry*0.02)/r*VB*0.42]);
    // laccetto: dal paraorecchie a sotto il mento
    const curva=new THREE.CatmullRomCurve3([ new THREE.Vector3(lato*(T.orecchio[0]+ry*0.06),T.orecchio[1]-r*0.9,T.orecchio[2]+rz*0.06),
      new THREE.Vector3(lato*T.orecchio[0]*0.86,(T.orecchio[1]+T.mento[1])/2,(T.orecchio[2]+T.mento[2])/2+rz*0.10),
      new THREE.Vector3(lato*rx*0.10,T.mento[1]-ry*0.07,T.mento[2]-rz*0.22) ]);
    unisci(new THREE.TubeGeometry(curva,8,ry*0.022,5),()=>[0.75,VB*0.5]);
    // capi del fiocco
    const capo=new THREE.CatmullRomCurve3([ new THREE.Vector3(lato*rx*0.06,T.mento[1]-ry*0.08,T.mento[2]-rz*0.22), new THREE.Vector3(lato*rx*0.24,T.mento[1]-ry*0.22,T.mento[2]-rz*0.12), new THREE.Vector3(lato*rx*0.14,T.mento[1]-ry*0.42,T.mento[2]-rz*0.10) ]);
    unisci(new THREE.TubeGeometry(capo,6,ry*0.02,5),()=>[0.75,VB*0.5]);
  }
  const nodo=new THREE.SphereGeometry(ry*0.05,8,6); nodo.translate(0,T.mento[1]-ry*0.08,T.mento[2]-rz*0.22); unisci(nodo,()=>[0.75,VB*0.5]);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.setIndex(I);
  return geoCalottine[nome]=g;
}

const hex=n=>'#'+n.toString(16).padStart(6,'0');
// R = "manichino" del giocatore creato in modello.js; colori = { costume, calottina, paraorecchie, testo }
export function attaccaCorpo(R,colori,num,seme){
  const crea=()=>{
    const variante=seme%pelli.length, nome=MODELLO.pelli[variante].corporatura, base=basi[nome];
    const radice=clonaConScheletro(base.scena);
    radice.scale.setScalar(base.scala); radice.rotation.y=Math.PI/2;      // il modello guarda +Z, il giocatore +X
    const C={ radice, scala:base.scala, ossa:{}, riposo:{}, azzera:[], fase:seme*1.7, num:-1, colori };
    // pelle con il suo disegno (volto, muscoli), lucida perché bagnata; costume nella zona segnata nel modello
    const pelle=new THREE.MeshPhongMaterial({map:pelli[variante],shininess:70,specular:0x6a6660});
    const u={ uCostume:{value:new THREE.Color(colori.costume)}, uFascia:{value:new THREE.Vector2(base.testa.costume[0],base.testa.costume[1])} };
    pelle.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,u);
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float _costume; varying float vCostume; varying float vQuota;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nvCostume=_costume; vQuota=position.y;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uCostume; uniform vec2 uFascia; varying float vCostume; varying float vQuota;')
        .replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,uCostume,smoothstep(0.3,0.7,vCostume)*smoothstep(uFascia.x,uFascia.x+0.05,vQuota)*(1.0-smoothstep(uFascia.y-0.05,uFascia.y,vQuota)));'); };
    const nomi=Object.entries(MODELLO.ossa);
    radice.traverse(o=>{
      for(const [k,n] of nomi) if(o.name===n){ C.ossa[k]=o; C.riposo[k]=o.quaternion.clone(); }
      if(MODELLO.daAzzerare.includes(o.name)) C.azzera.push([o,o.quaternion.clone()]);
      o.layers.set(STRATO_CORPI);
      if(o.isSkinnedMesh){ o.material=pelle; o.frustumCulled=false; o.layers.set(o.name==='corpoLontano'?STRATO_SOTTO:STRATO_SOLO_VISTA); }
    });
    const tex=new THREE.CanvasTexture(Object.assign(document.createElement('canvas'),{width:256,height:128})); tex.colorSpace=THREE.SRGBColorSpace;
    C.texCal=tex;
    C.calottina=new THREE.Mesh(calottinaGeo(nome),new THREE.MeshPhongMaterial({map:tex,shininess:60,specular:0x555555,side:THREE.DoubleSide}));
    C.calottina.layers.set(STRATO_SOLO_VISTA);      // la testa sta fuori dall'acqua: inutile ridisegnarla nella vista sott'acqua
    C.ossa.testa.add(C.calottina);
    R.g.add(radice); R.corpo=C;
    for(const k of R.vecchi) k.visible=false;                          // spariscono cilindri e sfere
    aggiornaNumero(R,num);
  };
  if(modelloPronto) crea(); else inAttesa.push(crea);
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
