// Corpo dei giocatori: modello con scheletro (manichino Mixamo alleggerito) mosso in parte da animazioni
// registrate (braccia e spalle da fermo, nuotata) e in parte da noi osso per osso (gambe a bicicletta,
// dorso, tiro, parata, lotta). Le posizioni delle giunture arrivano da pose.js, come per il vecchio manichino.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as clonaConScheletro } from 'three/addons/utils/SkeletonUtils.js';
import urlModello from './modelli/giocatore.glb?url';
import { STRATO_CORPI } from './acqua.js';

const SCALA=0.0108;                      // da centimetri del modello alle unità del manichino di pose.js
const OSSA={ bacino:'Hips', schiena:'Spine', petto:'Spine2', collo:'Neck', testa:'Head',
  bracD:'RightArm', avamD:'RightForeArm', manoD:'RightHand', bracS:'LeftArm', avamS:'LeftForeArm', manoS:'LeftHand',
  cosciaD:'RightUpLeg', gambaD:'RightLeg', piedeD:'RightFoot', cosciaS:'LeftUpLeg', gambaS:'LeftLeg', piedeS:'LeftFoot' };
const PARTE_ALTA=/Spine|Neck|Head|Shoulder|Arm|Hand/;

let base=null;                           // modello caricato: { scena, fermo, nuoto, y0, y1 }
const inAttesa=[];
export let modelloPronto=false;
new GLTFLoader().load(urlModello, gltf=>{
  const clip=n=>gltf.animations.find(c=>c.name===n);
  // da fermo si usa solo la parte alta dell'animazione (braccia che remano, spalle): le gambe le muoviamo noi
  const fermo=clip('fermo').clone(); fermo.tracks=fermo.tracks.filter(t=>PARTE_ALTA.test(t.name));
  let maglia=null; gltf.scene.traverse(o=>{ if(o.isSkinnedMesh) maglia=o; });
  maglia.geometry.computeVertexNormals();      // superficie liscia anche dopo la riduzione dei triangoli
  maglia.geometry.computeBoundingBox();
  const bb=maglia.geometry.boundingBox;
  // quota media del bacino nell'animazione di nuoto: serve a mettere il corpo al pelo dell'acqua
  const tb=clip('nuoto').tracks.find(t=>t.name.endsWith('Hips.position')); let ym=0; for(let i=1;i<tb.values.length;i+=3) ym+=tb.values[i]; ym/=tb.values.length/3;
  base={ scena:gltf.scene, fermo, nuoto:clip('nuoto'), y0:bb.min.y, y1:bb.max.y, yBacinoNuoto:ym };
  for(const f of inAttesa) f();
  inAttesa.length=0; modelloPronto=true;
}, undefined, e=>console.error('Modello dei giocatori non caricato: restano i manichini semplici',e));

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
  const cal=new THREE.SphereGeometry(11.9,18,9,0,Math.PI*2,0,Math.PI*0.6);
  const parti=[cal];
  for(const lato of [-1,1]){ const o=new THREE.SphereGeometry(3.4,8,6); o.scale(0.55,1,1); o.translate(lato*11.2,-3.2,0.5);
    const uv=o.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,0.5,0.02); parti.push(o); }
  // unione a mano (stessi attributi: position, normal, uv)
  const g=new THREE.BufferGeometry(), att={position:[],normal:[],uv:[]}, ind=[]; let off=0;
  for(const p of parti){ for(const n in att) att[n].push(...p.attributes[n].array); for(const i of p.index.array) ind.push(i+off); off+=p.attributes.position.count; }
  g.setAttribute('position',new THREE.Float32BufferAttribute(att.position,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(att.normal,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(att.uv,2)); g.setIndex(ind);
  g.rotateX(-0.12); g.translate(0,9.5,2.2);
  return geoCalottina=g;
}

const hex=n=>'#'+n.toString(16).padStart(6,'0');
// R = "manichino" del giocatore creato in modello.js; colori = { pelle, costume, calottina, testo }
export function attaccaCorpo(R,colori,num,seme){
  const crea=()=>{
    const radice=clonaConScheletro(base.scena);
    radice.scale.setScalar(SCALA); radice.rotation.y=Math.PI/2;      // il modello guarda +Z, il giocatore +X
    const C={ radice, ossa:{}, wN:0, bD:0, bS:0, fase:seme*1.7, num:-1, colori };
    radice.traverse(o=>{
      for(const k in OSSA) if(o.name==='mixamorig'+OSSA[k]) C.ossa[k]=o;
      if(o.isSkinnedMesh){
        C.maglia=o; o.frustumCulled=false;
        const m=new THREE.MeshPhongMaterial({color:0xffffff,shininess:55,specular:0x444444});
        const u={ uPelle:{value:new THREE.Color(colori.pelle)}, uCostume:{value:new THREE.Color(colori.costume)}, uY:{value:new THREE.Vector2(base.y0,base.y1)} };
        m.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,u);
          sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform vec2 uY; varying float vQuota;')
            .replace('#include <begin_vertex>','#include <begin_vertex>\nvQuota=(position.y-uY.x)/(uY.y-uY.x);');
          // costume: la fascia del bacino (frazione dell'altezza del corpo in posa a T)
          sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uPelle, uCostume; varying float vQuota;')
            .replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(uPelle,uCostume,smoothstep(0.455,0.465,vQuota)*(1.0-smoothstep(0.572,0.582,vQuota)));'); };
        o.material=m;
      }
    });
    const tex=new THREE.CanvasTexture(Object.assign(document.createElement('canvas'),{width:256,height:96})); tex.colorSpace=THREE.SRGBColorSpace;
    C.texCal=tex;
    C.calottina=new THREE.Mesh(calottinaGeo(),new THREE.MeshPhongMaterial({map:tex,shininess:35}));
    C.ossa.testa.add(C.calottina);
    radice.traverse(o=>o.layers.set(STRATO_CORPI));
    // animazioni registrate: sempre attive, cambia solo quanto pesano
    C.mixer=new THREE.AnimationMixer(radice);
    C.aF=C.mixer.clipAction(base.fermo); C.aN=C.mixer.clipAction(base.nuoto);
    C.aF.play(); C.aN.play(); C.aF.time=(seme*0.37)%base.fermo.duration; C.aN.time=(seme*0.61)%base.nuoto.duration;
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
const _a=new THREE.Vector3(), _b=new THREE.Vector3(), _d=new THREE.Vector3(), _v=new THREE.Vector3();
const _q=new THREE.Quaternion(), _qp=new THREE.Quaternion(), _qd=new THREE.Quaternion(), _qg=new THREE.Quaternion(), _qr=new THREE.Quaternion();
const _su=new THREE.Vector3(), _av=new THREE.Vector3(), _de=new THREE.Vector3(), _m=new THREE.Matrix4(), _inv=new THREE.Matrix4();
const ROT_MODELLO=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);
// gira l'osso in modo che punti (verso il figlio) nella direzione data, in coordinate del mondo
function punta(osso,figlio,dir,peso){
  if(peso<=0.001) return;
  osso.getWorldPosition(_a); figlio.getWorldPosition(_b); _b.sub(_a).normalize();
  _qd.setFromUnitVectors(_b,dir);
  osso.getWorldQuaternion(_q); osso.parent.getWorldQuaternion(_qp);
  _q.premultiply(_qd).premultiply(_qp.invert());
  if(peso>=0.999) osso.quaternion.copy(_q); else osso.quaternion.slerp(_q,peso);
}
// porta l'orientamento dell'osso verso quello dato (nel mondo)
function orienta(osso,qMondo,peso){
  osso.parent.getWorldQuaternion(_qp); _q.copy(qMondo).premultiply(_qp.invert());
  osso.quaternion.slerp(_q,peso);
}
// J = giunture (smussate) nel sistema del giocatore: x avanti, y su, z a destra. T = posa richiesta in questo istante.
export function muoviCorpo(R,J,T,dt,velocita){
  const C=R.corpo; if(!C) return;
  const O=C.ossa, k=1-Math.exp(-dt*7);
  C.wN+=((T.swim?1:0)-C.wN)*k;
  C.bD+=((T.brD||0)-C.bD)*(1-Math.exp(-dt*14)); C.bS+=((T.brS||0)-C.bS)*(1-Math.exp(-dt*14));
  const wN=C.wN<0.002?0:C.wN>0.998?1:C.wN, wV=1-wN;
  C.aN.setEffectiveWeight(wN); C.aF.setEffectiveWeight(wV);
  // stile libero da pallanuoto: bracciata più frequente quanto più si va veloci
  // (nell'animazione originale un ciclo di bracciata dura 4,2 secondi: qui va da circa 1,3 a 0,95 secondi)
  C.aN.timeScale=2.5+velocita*0.75;
  C.mixer.update(dt);
  // matrici aggiornate a mano e una volta sola (rifarle per tutto lo scheletro a ogni passaggio costa troppo con 14 giocatori)
  R.g.updateMatrix(); R.g.matrixWorld.copy(R.g.matrix); C.radice.updateMatrix(); C.radice.matrixWorld.multiplyMatrices(R.g.matrixWorld,C.radice.matrix);
  _qg.copy(R.g.quaternion);                                 // orientamento del giocatore nel mondo
  const dirMondo=(a,b,out)=>out.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize().applyQuaternion(_qg);
  // --- bacino: da fermo segue il busto calcolato da pose.js, in nuotata l'animazione ---
  dirMondo(J.hip,J.chest,_su);                              // asse del busto
  dirMondo(J.sL,J.sR,_de); _av.crossVectors(_su,_de).normalize(); _de.crossVectors(_av,_su).normalize();
  // assi del modello: X = sinistra del corpo, Y = su, Z = avanti
  _m.makeBasis(_v.copy(_de).negate(),_su,_av); _qr.setFromRotationMatrix(_m);
  if(wV>0){ O.bacino.parent.getWorldQuaternion(_qp); _q.copy(_qr).premultiply(_qp.invert()); O.bacino.quaternion.slerp(_q,wV); }
  // posizione: da fermo le spalle stanno dove dice pose.js; in nuotata il bacino sta appena sotto il pelo dell'acqua
  const pv=O.bacino.position; const yNuoto=pv.y;
  pv.set(0,0,0);
  _inv.copy(C.radice.matrixWorld).invert();
  O.bracD.getWorldPosition(_a); O.bracS.getWorldPosition(_b); _a.add(_b).multiplyScalar(0.5).applyMatrix4(_inv);
  // bersaglio delle spalle in coordinate del modello (X = -z, Y = y, Z = x), in centimetri
  const sx=-(J.sL[2]+J.sR[2])/2/SCALA, sy=(J.sL[1]+J.sR[1])/2/SCALA, sz=(J.sL[0]+J.sR[0])/2/SCALA;
  pv.set((sx-_a.x)*wV, (sy-_a.y)*wV+(yNuoto-base.yBacinoNuoto+QUOTA_NUOTO)*wN, (sz-_a.z)*wV+AVANTI_NUOTO*wN);
  // --- gambe a bicicletta (calcio a rana alternato), nel sistema del busto: più ampie e veloci quando ci si alza ---
  if(wV>0){
    const sforzo=Math.min(1,Math.max(0,(J.chest[1]+0.06)/0.26));
    C.fase+=dt*(5.2+6.5*sforzo);
    const amp=0.85+0.4*sforzo;
    for(const lato of [1,-1]){
      const f=C.fase+(lato>0?0:Math.PI), cs=Math.cos(f), sn=Math.sin(f);
      const coscia=lato>0?O.cosciaD:O.cosciaS, gamba=lato>0?O.gambaD:O.gambaS, piede=lato>0?O.piedeD:O.piedeS;
      // coscia: avanti e in fuori, quasi seduti; il ginocchio disegna un piccolo cerchio
      _d.copy(_av).multiplyScalar(0.70).addScaledVector(_de,lato*(0.50+0.10*sn)).addScaledVector(_su,-0.48-0.09*cs).normalize();
      punta(coscia,gamba,_d,wV);
      // gamba sotto il ginocchio: il piede gira in cerchio (verso opposto tra destra e sinistra, mezzo giro di ritardo)
      _d.copy(_su).multiplyScalar(-0.80).addScaledVector(_de,lato*0.55*cs*amp).addScaledVector(_av,-0.15+0.5*sn*amp).normalize();
      punta(gamba,piede,_d,wV);
    }
  }
  // --- braccia: quando pose.js chiede un gesto preciso (tiro, parata, palla in mano, lotta, dorso) ---
  if(C.bD>0.001){ punta(O.bracD,O.avamD,dirMondo(J.sR,J.eR,_d),C.bD); punta(O.avamD,O.manoD,dirMondo(J.eR,J.hR,_d),C.bD); }
  if(C.bS>0.001){ punta(O.bracS,O.avamS,dirMondo(J.sL,J.eL,_d),C.bS); punta(O.avamS,O.manoS,dirMondo(J.eL,J.hL,_d),C.bS); }
  // --- testa alta e ferma, che guarda avanti: sia da fermi sia in nuotata ---
  _q.copy(_qg).multiply(ROT_MODELLO); _qr.copy(_q);
  orienta(O.collo,_qr,0.45); orienta(O.testa,_qr,0.85);
}
// regolazioni della nuotata (centimetri del modello)
const QUOTA_NUOTO=-21, AVANTI_NUOTO=-20;
