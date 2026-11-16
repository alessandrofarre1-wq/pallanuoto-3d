// Corpo dei giocatori: modello con scheletro mosso interamente da noi, osso per osso (nessuna animazione registrata).
// pose.js decide dove stanno le giunture (bacino, petto, spalle, gomiti, mani, ginocchia, piedi); qui le si applica
// alle ossa di un modello qualsiasi descritto in modelli/*.js, e si aggiungono le gambe a bicicletta.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as clonaConScheletro } from 'three/addons/utils/SkeletonUtils.js';
import FUMETTO from './modelli/pallanuotista.js';
import riservaIndici from './modelli/riserva-indici.json';
import { sottAcqua } from './sottacqua.js';
import { preparaViso } from './espressioni.js';
import { valoriDisegno } from '../aspetto.js';
import { atlanteCostumi, profiloCostume } from './costumi.js';

const SPALLE=0.40;                       // distanza tra le spalle nel sistema di pose.js: da qui si ricava la scala del modello
const inAttesa=[];
export let modelloPronto=false;
// Il corpo di tutti i giocatori è il pallanuotista del concept (modelli/pallanuotista.glb): un solo modello, ricolorato per
// squadra, numero e tono della pelle. Se non si carica restano i manichini semplici di modello.js.
let baseF=null;
new GLTFLoader().load(FUMETTO.url,g=>{
  preparaFumetto(g.scene);
  for(const f of inAttesa) f();
  inAttesa.length=0; modelloPronto=true;
},undefined,e=>console.error('Modello dei giocatori non caricato: restano i manichini semplici',e));
// pelle: cinque toni (moltiplicano il colore dell'immagine solo sulla pelle), scelti dal giocatore
const TONI=[[1,1,1],[1.04,0.96,0.9],[0.86,0.72,0.6],[0.62,0.47,0.36],[0.42,0.3,0.23]].map(t=>new THREE.Vector3(...t));
function preparaFumetto(scena){
  let maglia=null; scena.traverse(o=>{ if(o.isSkinnedMesh) maglia=o; });
  scena.updateMatrixWorld(true);
  const a=new THREE.Vector3(), b=new THREE.Vector3();
  scena.getObjectByName(FUMETTO.ossa.bracD).getWorldPosition(a); scena.getObjectByName(FUMETTO.ossa.bracS).getWorldPosition(b);
  // numero sui due lati della cuffia: un pezzetto di superficie che segue la forma vera della cuffia (trovata tirando dei raggi
  // sul modello in posa di riposo), staccato di 3 mm, nel sistema dell'osso della testa. Un solo oggetto per i due lati.
  const testa=scena.getObjectByName(FUMETTO.ossa.testa), invTesta=testa.matrixWorld.clone().invert();
  const rif=new THREE.Mesh(maglia.geometry.clone().applyMatrix4(maglia.matrixWorld)), ray=new THREE.Raycaster();
  const Q=FUMETTO.cuffia, c=new THREE.Vector3(...Q.centro), N=8, P=[], U=[], I=[];
  for(const segno of [1,-1]){
    const d=new THREE.Vector3(Q.lato[0]*segno,Q.lato[1],Q.lato[2]).normalize(), t1=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),d).normalize(), t2=new THREE.Vector3().crossVectors(d,t1);
    const o0=P.length/3;
    for(let j=0;j<=N;j++) for(let i=0;i<=N;i++){
      const u=i/N-0.5, v=j/N-0.5, dir=d.clone().addScaledVector(t1,u*Q.larghezza).addScaledVector(t2,v*Q.altezza).normalize();
      ray.set(c.clone().addScaledVector(dir,0.6),dir.clone().negate()); const h=ray.intersectObject(rif)[0];
      const p=h ? h.point.addScaledVector(h.face.normal,0.003) : c.clone().addScaledVector(dir,0.15);
      p.applyMatrix4(invTesta); P.push(p.x,p.y,p.z); U.push(i/N,j/N);
    }
    for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const k=o0+j*(N+1)+i; I.push(k,k+1,k+N+1, k+1,k+N+2,k+N+1); }
  }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.setIndex(I); g.computeVertexNormals();
  if(maglia.geometry.attributes.position.count!==riservaIndici.vertici || maglia.geometry.index.count/3!==riservaIndici.triangoliOriginali) throw new Error('Rigenerare gli indici della riserva per il nuovo modello');
  const geometriaRiserva=maglia.geometry.clone(); geometriaRiserva.setIndex(riservaIndici.indici);
  baseF={ scena, geometriaRiserva, scala:SPALLE/a.distanceTo(b)*FUMETTO.proporzione, materiale:maglia.material, numeroGeo:g };
}
function numeroCuffia(tex,num,colore){
  const c=tex.image, x=c.getContext('2d'); x.clearRect(0,0,c.width,c.height);
  x.font=`900 ${Math.round(c.height*(String(num).length>1?0.62:0.8))}px sans-serif`; x.textAlign='center'; x.textBaseline='middle';
  x.lineWidth=c.height*0.05; x.strokeStyle='rgba(0,0,0,0.25)'; x.strokeText(String(num),c.width/2,c.height*0.54);
  x.fillStyle=colore; x.fillText(String(num),c.width/2,c.height*0.54); tex.needsUpdate=true;
}
function attaccaFumetto(R,colori,num,seme){
  const radice=clonaConScheletro(baseF.scena);
  radice.scale.setScalar(baseF.scala); radice.rotation.y=Math.PI/2;      // il modello guarda +Z, il giocatore +X
  const K={ radice, scala:baseF.scala, ossa:{}, riposo:{}, azzera:[], schiena:[], fase:seme*1.7, num:-1, colori };
  // colori per giocatore: il blu dell'immagine diventa il colore di cuffia e costume (con le sue luci e ombre); il 7 dipinto
  // viene coperto; la pelle prende il tono del giocatore. Stesso programma per tutti (cambia solo il valore dei colori).
  const mat=new THREE.MeshPhysicalMaterial({
    map:baseF.materiale.map, normalMap:baseF.materiale.normalMap,
    color:baseF.materiale.color, side:baseF.materiale.side,
    roughness:0.45, metalness:0, clearcoat:0.45, clearcoatRoughness:0.27,
    envMapIntensity:0.65,
  });
  const u={ uCal:{value:new THREE.Color()}, uCos:{value:new THREE.Color()}, uCostumi:{value:atlanteCostumi}, uBandiera:{value:new THREE.Vector4()}, uTono:{value:TONI[seme%TONI.length].clone()}, uLuce:{value:FUMETTO.luceBlu},
    uCapelli:{value:new THREE.Vector3(0.15,0.095,0.06)}, uBarba:{value:0}, uGonfia:{value:0} };      // aspetto del giocatore (src/aspetto.js)
  mat.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,u);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 _zona; attribute float _numero; attribute float _bocca; attribute float _scuro; uniform float uGonfia; varying vec3 vZona; varying float vNum; varying float vQuota; varying float vBocca; varying float vScuro; varying vec3 vRiposo;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvZona=_zona; vNum=_numero; vQuota=position.y; vBocca=_bocca; vScuro=_scuro; vRiposo=position;\n'
        // corporatura: busto, braccia e gambe un po\' più pieni o più asciutti (non testa, mani e piedi)
        +'{ float massa=(1.0-smoothstep(1.36,1.44,position.y))*smoothstep(0.08,0.22,position.y)*(1.0-smoothstep(0.55,0.70,abs(position.x))); transformed+=normal*uGonfia*massa; }');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uCal; uniform vec3 uCos; uniform sampler2D uCostumi; uniform vec4 uBandiera; uniform vec3 uTono; uniform float uLuce; uniform vec3 uCapelli; uniform float uBarba; varying vec3 vZona; varying float vNum; varying float vQuota; varying float vBocca; varying float vScuro; varying vec3 vRiposo;')
      .replace('#include <map_fragment>',`#include <map_fragment>
        { vec3 c=diffuseColor.rgb; float lum=dot(c,vec3(0.3,0.5,0.2)), mx=max(c.r,max(c.g,c.b)), mn=min(c.r,min(c.g,c.b));
          // dentro cuffia e costume tutto prende il colore di squadra: il blu tiene le sue luci e ombre, il 7 dipinto (bianco) e il
          // suo bordo vengono coperti a tinta piena
          float blu=smoothstep(0.04,0.15,c.b-max(c.r,c.g)*0.9), num=smoothstep(0.15,0.4,vNum), ombra=mix(1.0,clamp(lum/uLuce,0.3,1.6),blu*(1.0-num));
          float zb=step(0.5,vZona.z), alto=step(1.2,vQuota);
          float zc=max(step(0.5,vZona.x),num*alto), zs=max(step(0.5,vZona.y),num*(1.0-alto));
          c=mix(c,uCal*ombra,zc);
          // Bandiera grande su davanti e dietro, solidale al tessuto mentre bacino e gambe si muovono.
          // Coordinate dalla posa di riposo: non cambiano con altezza, mano dominante, lato o sostituzioni.
          if(zs>0.5){
            vec2 uvCostume=clamp(vec2((vRiposo.x+0.175)/0.35,(vRiposo.y-0.83)/0.19),0.0,1.0);
            uvCostume.x=mix(1.0-uvCostume.x,uvCostume.x,step(-0.015,vRiposo.z));
            vec3 bandieraCostume=texture2D(uCostumi,uBandiera.xy+uvCostume*uBandiera.zw).rgb;
            c=bandieraCostume*ombra;
          }
          float pelle=(1.0-max(zc,zs))*(1.0-zb)*smoothstep(0.25,0.45,(mx-mn)/max(mx,0.001));
          diffuseColor.rgb=mix(c,c*uTono,pelle);
          // sopracciglia del colore dei capelli del giocatore (sotto la cuffia i capelli non si vedono)
          { float sc=smoothstep(0.3,0.7,vScuro); float l=dot(c,vec3(0.3,0.5,0.2)); diffuseColor.rgb=mix(diffuseColor.rgb,uCapelli*(0.55+1.6*l),sc*0.9); }
          // barba (1 leggera, 2 corta, 3 piena): puntini scuri sulla pelle di mento, mascella e baffi, dalla posizione a riposo
          if(uBarba>0.5){ vec3 q=vRiposo; float ax=abs(q.x+0.004);
            float alto=mix(1.574,1.586,smoothstep(0.035,0.06,ax))*step(0.5,uBarba-1.0)+mix(1.571,1.556,smoothstep(0.03,0.05,ax))*(1.0-step(0.5,uBarba-1.0));
            float zona=smoothstep(1.47,1.49,q.y)*(1.0-smoothstep(alto-0.004,alto,q.y))*step(0.0,q.z)*(1.0-smoothstep(0.075,0.09,ax));
            zona*=1.0-(1.0-smoothstep(0.004,0.007,abs(q.y-1.556)))*(1.0-smoothstep(0.036,0.044,ax));      // non sulle labbra
            zona*=1.0-(1.0-smoothstep(0.018,0.026,ax))*smoothstep(1.574,1.58,q.y);                       // non sul naso
            float n=fract(sin(dot(floor(q*1100.0),vec3(12.9898,78.233,37.719)))*43758.5453);
            float dens=uBarba<1.5?0.45:(uBarba<2.5?0.78:0.97), forza=uBarba<1.5?0.35:(uBarba<2.5?0.55:0.75);
            float pelo=step(1.0-dens,n)*zona*pelle;
            diffuseColor.rgb=mix(diffuseColor.rgb,uCapelli*0.7,pelo*forza); }
          // interno della bocca (modello v2, dato _bocca): 1 = cavità scura, 2-3 = denti
          if(vBocca>1.5) diffuseColor.rgb=vec3(0.86,0.84,0.78); else if(vBocca>0.5 || !gl_FrontFacing) diffuseColor.rgb=vec3(0.09,0.02,0.025); }`); };      // l'interno della testa (visto dalla bocca aperta) è scuro
  // sott'acqua il corpo prende il colore dell'acqua secondo la profondità e ondeggia appena; linea bagnata sul pelo dell'acqua
  sottAcqua(mat,{ ondeggia:1, bagnato:1, chiave:'corpo' });
  K.u=u;
  const nomi=Object.entries(FUMETTO.ossa);
  radice.traverse(o=>{
    for(const [k,n] of nomi) if(o.name===n){ K.ossa[k]=o; K.riposo[k]=o.quaternion.clone(); }
    if(FUMETTO.daAzzerare.includes(o.name)) K.azzera.push([o,o.quaternion.clone()]);
    if(/^spine_0[123]$/.test(o.name)) K.schiena.push(o);
    if(o.isSkinnedMesh){ if(R.riserva) o.geometry=baseF.geometriaRiserva; o.material=mat; o.frustumCulled=false; K.viso=preparaViso(o); }      // espressioni, se il modello le ha
  });
  const tex=new THREE.CanvasTexture(Object.assign(document.createElement('canvas'),{width:128,height:128})); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4;
  K.texNum=tex;
  const n=new THREE.Mesh(baseF.numeroGeo,new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:0.55,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false}));
  n.renderOrder=2; K.ossa.testa.add(n);
  R.g.add(radice);
  // Tutti i riferimenti sono intrinseci al bind, prima che bacino e colonna ricevano la prima posa.
  radice.updateWorldMatrix(true,true);
  K.bracci={
    1:preparaBraccio(K,K.ossa.bracD,K.ossa.avamD,K.ossa.manoD),
    '-1':preparaBraccio(K,K.ossa.bracS,K.ossa.avamS,K.ossa.manoS),
  };
  K.prese={};K.normaliPrese={};K.distanzeSuperficiePrese={...FUMETTO.distanzeSuperficiePrese};
  const palmoBind=new THREE.Vector3(...FUMETTO.palmoRiposo).applyQuaternion(radice.getWorldQuaternion(new THREE.Quaternion()));
  for(const lato of ['D','S']){
    const presa=radice.getObjectByName(FUMETTO.prese[lato]);
    if(!presa)continue;
    K.prese[lato]=presa;
    K.normaliPrese[lato]=palmoBind.clone().applyQuaternion(presa.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
  }
  return K;
}
// R = "manichino" del giocatore creato in modello.js; colori = { costume, calottina, paraorecchie, testo }
export function attaccaCorpo(R,colori,num,seme){
  const crea=()=>{
    R.corpo=attaccaFumetto(R,R.coloriVoluti||colori,num,seme);
    for(const k of R.vecchi) k.visible=false;                          // spariscono cilindri e sfere
    aggiornaColori(R,R.coloriVoluti||colori,R.numVoluto??num);
  };
  if(modelloPronto) crea(); else inAttesa.push(crea);
}
// cambia colori e numero (anche prima che il modello sia caricato: li trova pronti)
export function aggiornaColori(R,colori,num,profilo){
  R.coloriVoluti=colori; R.numVoluto=num; if(profilo) R.profiloVoluto=profilo;
  const K=R.corpo; if(!K) return;
  if(R.profiloVoluto) applicaAspetto(K,R.profiloVoluto);
  K.colori=colori; K.u.uCal.value.setHex(colori.calottina); K.u.uCos.value.setHex(colori.costume);
  K.costume=colori.profiloCostume||profiloCostume('ITA'); K.u.uBandiera.value.fromArray(K.costume.rettangolo); K.num=-1;
  aggiornaNumero(R,num);
}
// aspetto del giocatore (src/aspetto.js): pelle, colore di sopracciglia e barba, corporatura, altezza. Solo disegno.
function applicaAspetto(K,profilo){
  const v=valoriDisegno(profilo);
  K.u.uTono.value.set(...v.tono); K.u.uCapelli.value.set(...v.capelli); K.u.uBarba.value=v.barba; K.u.uGonfia.value=v.gonfia;
  K.scala=baseF.scala*v.scala; K.radice.scale.setScalar(K.scala);      // più alto o più basso: le spalle restano dove le vuole pose.js
}
export function aggiornaNumero(R,num){
  const C=R.corpo; if(!C||C.num===num) return;
  C.num=num; numeroCuffia(C.texNum,num,C.colori.testo);
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
// solo per il disegno: se la giuntura in fondo all'osso (ginocchio, caviglia) finirebbe fuori dall'acqua, la direzione si piega
// verso il basso quanto basta a tenerla sotto di "margine" metri. Succede solo al portiere che si allunga per parare (busto
// inclinato e bicicletta con le ginocchia avanti); per gli altri le gambe sono già ben sotto e la direzione non cambia.
function sottoIlPelo(osso,figlio,dir,margine){
  osso.getWorldPosition(_a); figlio.getWorldPosition(_b);
  const L=_a.distanceTo(_b), yMax=-margine-_a.y;
  if(dir.y*L<=yMax) return;
  const dy=Math.max(-1,Math.min(1,yMax/L)), h=Math.hypot(dir.x,dir.z);
  if(h<1e-4){ dir.set(0,-1,0); return; }
  const k=Math.sqrt(Math.max(0,1-dy*dy))/h; dir.set(dir.x*k,dy,dir.z*k);
}
// porta l'orientamento dell'osso verso quello dato (nel mondo)
function orienta(osso,qMondo,peso){
  osso.parent.getWorldQuaternion(_qp); _q.copy(qMondo).premultiply(_qp.invert());
  osso.quaternion.slerp(_q,peso);
}
// ---------- braccia naturali (polso e avambraccio che ruotano) ----------
// Lo scheletro del pallanuotista è in posa a T con le ossa senza rotazioni di riposo; i palmi guardano dove dice il modello
// (FUMETTO.palmoRiposo: in giù nel primo modello, in avanti nel modello v2). Ogni osso del
// braccio si orienta con DUE direzioni, non una: l'asse dell'osso e un riferimento attorno all'asse. Così:
// - braccio e avambraccio tengono il cardine del gomito perpendicolare al piano spalla-gomito-mano (il gomito si piega come
//   un gomito vero, senza torsioni a caso);
// - il palmo guarda dove chiede pose.js (T.nR/T.nL: sotto la palla, verso il tiratore, indietro nella bracciata...): la
//   rotazione si divide a metà tra avambraccio e polso, come nel braccio umano, ed è limitata a ±120°;
// - il polso è appena piegato verso il palmo (mano a coppa, come quando si rema).
const _R=new THREE.Vector3(), _X=new THREE.Vector3(), _ml=new THREE.Matrix4(), _mw=new THREE.Matrix4(), _qa=new THREE.Quaternion();
const _asseLocale=new THREE.Vector3(),_rifLocale=new THREE.Vector3(),_asseMondo=new THREE.Vector3();
const _cg=new THREE.Vector3(), _pn=new THREE.Vector3(), _pt=new THREE.Vector3(), _fd=new THREE.Vector3(), _hw=new THREE.Vector3();
const POLSO_FLEX=0.22, ROT_MAX=2.1;
// orienta l'osso perché il suo asse (aLoc, nel suo sistema) vada su asseW e il riferimento rLoc vada verso rifW (nel mondo)
function allinea(osso,aLoc,rLoc,asseW,rifW){
  _asseMondo.copy(asseW).normalize();
  _R.copy(rifW).addScaledVector(_asseMondo,-rifW.dot(_asseMondo)); if(_R.lengthSq()<1e-8) return; _R.normalize();
  _X.crossVectors(_asseMondo,_R).normalize(); _mw.makeBasis(_asseMondo,_R,_X);
  // La trasposta è l'inversa soltanto per una base ortonormale, anche sul lato locale.
  _asseLocale.copy(aLoc).normalize();
  _rifLocale.copy(rLoc).addScaledVector(_asseLocale,-rLoc.dot(_asseLocale));if(_rifLocale.lengthSq()<1e-8)return;_rifLocale.normalize();
  _ml.makeBasis(_asseLocale,_rifLocale,_X.crossVectors(_asseLocale,_rifLocale).normalize()); _ml.transpose();
  _qa.setFromRotationMatrix(_mw.multiply(_ml)).normalize();
  osso.parent.getWorldQuaternion(_qp); osso.quaternion.copy(_qa).premultiply(_qp.invert()).normalize();
}
// Il primo figlio della mano è la presa: non indica le dita. L'asse anatomico continua l'avambraccio.
function preparaBraccio(C,brac,avam,mano){
  const r=C.radice;r.updateWorldMatrix(true,true);
  const spalla=brac.getWorldPosition(new THREE.Vector3()),gomito=avam.getWorldPosition(new THREE.Vector3()),polso=mano.getWorldPosition(new THREE.Vector3());
  const su=gomito.clone().sub(spalla).normalize(),giu=polso.clone().sub(gomito).normalize();
  const palmo=new THREE.Vector3(...(FUMETTO.palmoRiposo||[0,-1,0])).applyQuaternion(r.getWorldQuaternion(new THREE.Quaternion())).normalize();
  const loc=(osso,v)=>v.clone().applyQuaternion(osso.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
  const riferimenti=(osso,asse,rif)=>{
    const a=loc(osso,asse),v=loc(osso,rif);v.addScaledVector(a,-v.dot(a)).normalize();return {a,r:v};
  };
  const cardineSu=new THREE.Vector3().crossVectors(su,palmo).normalize(),cardineGiu=new THREE.Vector3().crossVectors(giu,palmo).normalize();
  const palmoNeutro=palmo.clone().addScaledVector(giu,-palmo.dot(giu)).normalize();
  const terzo=new THREE.Vector3().crossVectors(giu,cardineGiu).normalize();
  const inv=r.matrixWorld.clone().invert(),a=spalla.clone().applyMatrix4(inv),b=gomito.clone().applyMatrix4(inv),c=polso.clone().applyMatrix4(inv);
  return {brac:riferimenti(brac,su,cardineSu),avam:riferimenti(avam,giu,cardineGiu),mano:riferimenti(mano,giu,palmo),
    neutro:new THREE.Vector3(palmoNeutro.dot(giu),palmoNeutro.dot(cardineGiu),palmoNeutro.dot(terzo)),
    lunghezzaSu:a.distanceTo(b),lunghezzaGiu:b.distanceTo(c),cardine:cardineGiu.clone()};
}
const _braccioSu=new THREE.Vector3(), _braccioGiu=new THREE.Vector3();
const _spallaVera=new THREE.Vector3(),_gomitoVero=new THREE.Vector3(),_manoVera=new THREE.Vector3(),_raggiungi=new THREE.Vector3(),_piegaGomito=new THREE.Vector3(),_scalaCorpo=new THREE.Vector3();
function braccio(C,brac,avam,mano,S,E,H,palmoLoc,lato,dirMondo,flessione=POLSO_FLEX){
  const B=C.bracci[lato];
  brac.getWorldPosition(_spallaVera);C.radice.getWorldScale(_scalaCorpo);
  const l1=B.lunghezzaSu*_scalaCorpo.x,l2=B.lunghezzaGiu*_scalaCorpo.x;
  const distanzaNominale=Math.hypot(H[0]-S[0],H[1]-S[1],H[2]-S[2]);
  const minima=Math.sqrt(l1*l1+l2*l2-2*l1*l2*Math.cos(Math.PI/6));
  const distanza=Math.max(minima,Math.min(l1+l2-0.001,distanzaNominale/0.59*(l1+l2)));
  dirMondo(S,H,_raggiungi);dirMondo(S,E,_piegaGomito);
  _piegaGomito.addScaledVector(_raggiungi,-_piegaGomito.dot(_raggiungi));
  if(_piegaGomito.lengthSq()<1e-8)_piegaGomito.crossVectors(_raggiungi,B.cardine);
  _piegaGomito.normalize();
  const avanti=(l1*l1-l2*l2+distanza*distanza)/(2*distanza),altezza=Math.sqrt(Math.max(0,l1*l1-avanti*avanti));
  _gomitoVero.copy(_spallaVera).addScaledVector(_raggiungi,avanti).addScaledVector(_piegaGomito,altezza);
  _manoVera.copy(_spallaVera).addScaledVector(_raggiungi,distanza);
  const su=_braccioSu.copy(_gomitoVero).sub(_spallaVera).normalize(),giu=_braccioGiu.copy(_manoVera).sub(_gomitoVero).normalize();
  // cardine del gomito: perpendicolare a braccio e avambraccio; a braccio quasi teso si tiene l'ultimo valido
  _cg.crossVectors(su,giu); if(_cg.lengthSq()>4e-3) B.cardine.copy(_cg.normalize()); else _cg.copy(B.cardine);
  allinea(brac,B.brac.a,B.brac.r,su,_cg);
  // palmo «neutro» (senza rotazione dell'avambraccio) e palmo voluto: l'angolo tra i due, attorno all'avambraccio
  _fd.crossVectors(giu,_cg).normalize();
  _pn.copy(giu).multiplyScalar(B.neutro.x).addScaledVector(_cg,B.neutro.y).addScaledVector(_fd,B.neutro.z).normalize();
  if(palmoLoc){ _pt.set(palmoLoc[0],palmoLoc[1],palmoLoc[2]).applyQuaternion(_qg); _pt.addScaledVector(giu,-_pt.dot(giu)); }
  let ang=0;
  if(palmoLoc&&_pt.lengthSq()>1e-4){ _pt.normalize(); ang=Math.atan2(_X.crossVectors(_pn,_pt).dot(giu),_pn.dot(_pt)); ang=Math.max(-ROT_MAX,Math.min(ROT_MAX,ang)); }
  _hw.copy(_cg).applyAxisAngle(giu,ang*0.5); allinea(avam,B.avam.a,B.avam.r,giu,_hw);
  // mano: palmo ruotato dell'angolo intero (l'altra metà la fa il polso); dita appena piegate verso il palmo (mano a coppa)
  _pn.applyAxisAngle(giu,ang);
  const flex=Number.isFinite(flessione)?Math.max(-1.2,Math.min(1.2,flessione)):POLSO_FLEX;
  _fd.copy(giu).multiplyScalar(Math.cos(flex)).addScaledVector(_pn,Math.sin(flex)).normalize();
  allinea(mano,B.mano.a,B.mano.r,_fd,_pn);
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
  const pg=T.piega||PIEGA0,torsione=Number.isFinite(T.torsioneVista)?T.torsioneVista:0;
  const ritardoBacino=pg.bacino-torsione;
  if(Math.abs(ritardoBacino)>0.002) _qr.premultiply(_qy.setFromAxisAngle(SU,ritardoBacino));
  O.bacino.parent.getWorldQuaternion(_qp); O.bacino.quaternion.copy(_qr).premultiply(_qp.invert());
  const recuperoTorace=pg.petto-pg.bacino+torsione;
  if(Math.abs(recuperoTorace)>0.002 && C.schiena.length){
    const passo=recuperoTorace/C.schiena.length; _qy.setFromAxisAngle(SU,passo);
    for(const o of C.schiena){ o.getWorldQuaternion(_q); o.parent.getWorldQuaternion(_qp); o.quaternion.copy(_q.premultiply(_qy).premultiply(_qp.invert())); }
  }
  // le gambe seguono con un ritardo ancora maggiore
  const ritardoGambe=pg.gambe-torsione;
  const qGambe=Math.abs(ritardoGambe)>0.002 ? _qg2.setFromAxisAngle(SU,ritardoGambe) : null, curva=Math.abs(T.curva||0);
  // posizione: le spalle del modello vanno dove le vuole pose.js
  const pv=O.bacino.position; pv.set(0,0,0);
  _inv.copy(C.radice.matrixWorld).invert();
  O.bracD.getWorldPosition(_a); O.bracS.getWorldPosition(_b); _a.add(_b).multiplyScalar(0.5).applyMatrix4(_inv);
  pv.set(-(J.sL[2]+J.sR[2])/2/s-_a.x, (J.sL[1]+J.sR[1])/2/s-_a.y, (J.sL[0]+J.sR[0])/2/s-_a.z);
  // solo per il disegno: il personaggio ha il busto più corto delle giunture di pose.js, quindi quando il portiere si alza tutto
  // per parare il bacino arriverebbe quasi in superficie e le cosce uscirebbero dall'acqua. Il bacino non sale mai sopra i 22 cm
  // sotto il pelo dell'acqua (il corpo si abbassa di quel poco, senza scatti); gli altri giocatori non ci arrivano mai.
  O.bacino.getWorldPosition(_b);
  if(_b.y>-0.22){ _b.y=-0.22; O.bacino.parent.worldToLocal(_b); pv.copy(_b); }
  // --- gambe: bicicletta (calcio a rana alternato) da verticali, battuta a gambe unite da distesi, con passaggio continuo ---
  const sforzo=Math.min(1,Math.max(0,(J.chest[1]+0.06)/0.26))*(1-e);
  // girandosi da verticali le gambe cambiano ritmo e ampiezza (è la bicicletta che fa ruotare il corpo)
  C.fase+=dt*(5.2+6.5*sforzo)*(1+0.6*curva*(1-e));
  const amp=(0.85+0.45*sforzo)*(1+0.3*curva*(1-e));
  for(const lato of [1,-1]){
    // gambe sfasate di mezzo ciclo (Kawai 2026); la spinta in fuori (ginocchio che si estende) è più rapida del rientro:
    // la fase scorre più veloce nella prima metà del giro
    const f0=C.fase+(lato>0?0:Math.PI), f=f0+0.35*Math.sin(f0), cs=Math.cos(f), sn=Math.sin(f);
    const coscia=lato>0?O.cosciaD:O.cosciaS, gamba=lato>0?O.gambaD:O.gambaS, piede=lato>0?O.piedeD:O.piedeS, puntaP=lato>0?O.puntaD:O.puntaS;
    const gin=lato>0?J.kR:J.kL, pie=lato>0?J.fR:J.fL;
    // coscia: da verticali avanti e in fuori, quasi seduti, con il ginocchio che disegna un piccolo cerchio
    // anca flessa e aperta, di più quando serve più spinta (Oliveira 2015: flessione e abduzione dell'anca danno forza verticale)
    _d.copy(_av).multiplyScalar(0.70+0.10*sforzo).addScaledVector(_de,lato*(0.56+0.10*sforzo+0.10*sn)).addScaledVector(_su,-0.48-0.09*cs).normalize();
    if(e>0.001){ dirMondo(J.hip,gin,_d2); _d.lerp(_d2,e).normalize(); }
    if(qGambe) _d.applyQuaternion(qGambe);
    sottoIlPelo(coscia,gamba,_d,0.10);
    punta(coscia,gamba,_d);
    // sotto il ginocchio: il piede gira in cerchio (verso opposto tra destra e sinistra, mezzo giro di ritardo)
    _d.copy(_su).multiplyScalar(-0.80).addScaledVector(_de,lato*0.46*cs*amp).addScaledVector(_av,-0.15+0.42*sn*amp).normalize();
    if(e>0.001){ dirMondo(gin,pie,_d2); _d.lerp(_d2,e).normalize(); }
    if(qGambe) _d.applyQuaternion(_qy.setFromAxisAngle(SU,pg.gambe*1.25-torsione));      // la gamba sotto il ginocchio resta ancora un po' più indietro: coda leggermente piegata
    sottoIlPelo(gamba,piede,_d,0.12);
    punta(gamba,piede,_d);
    // in battuta il piede si distende in linea con la gamba; nella bicicletta il piede resta quasi orizzontale e si inclina
    // durante la spinta in fuori (angolo d'attacco, Kawai 2026), così spinge l'acqua verso il basso
    if(puntaP){
      if(e<0.95){ _d2.copy(_av).multiplyScalar(0.55).addScaledVector(_de,lato*0.55).addScaledVector(_su,-0.18-0.22*Math.max(0,sn)).normalize();
        punta(piede,puntaP,_d2,(1-e)*0.6); }
      if(e>0.05) punta(piede,puntaP,_d,e*0.8);
    }
  }
  // --- braccia: gomito e mano dove li mette pose.js; gomito che si piega come un cardine, avambraccio e polso che ruotano ---
  braccio(C,O.bracD,O.avamD,O.manoD,J.sR,J.eR,J.hR,T.nR,1,dirMondo,T.polsoR);
  braccio(C,O.bracS,O.avamS,O.manoS,J.sL,J.eL,J.hL,T.nL,-1,dirMondo,T.polsoL);
  // --- testa alta e ferma, che guarda avanti: sia da fermi sia in nuotata ---
  _qr.copy(_qg).multiply(ROT_MODELLO);
  orienta(O.collo,_qr,0.5); orienta(O.testa,_qr,0.9);
}
