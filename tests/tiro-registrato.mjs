import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import dati from '../src/grafica/dati/tiro-plask-01.js';
import {campionaPosaRegistrata,preparaTiroRegistrato,applicaTiroRegistrato} from '../src/grafica/tiro-plask-vista.js';
const raw=fs.readFileSync(new URL('../src/grafica/modelli/pallanuotista.glb',import.meta.url));
assert.equal(createHash('sha256').update(raw).digest('hex'),'8fd658a8a89ad0dd242100133daf920eb6cfa492af8f39e95f6ff92124ba6745','modello, rig e pesi originali invariati');
assert.equal(dati.bones.length,52,'intero scheletro registrato, comprese mani e piedi');
assert.ok(dati.source.start<=1/60&&Math.abs(dati.source.end-dati.source.fullDuration)<1e-6,'tutta la clip, esclusa soltanto la T-pose artificiale');
assert.ok(dati.frames>=415,'nessun taglio della preparazione registrata');
assert.equal(dati.source.sha256,'41c8bebc664fa2f5afd0d2c1e6488051686132ab98cbc0b73fb91468b037ab98');
const len=raw.readUInt32LE(12),g=JSON.parse(raw.toString('utf8',20,20+len));
function model(){
 const nodes=g.nodes.map(n=>{const o=new THREE.Object3D();o.name=n.name||'';if(n.matrix)new THREE.Matrix4().fromArray(n.matrix).decompose(o.position,o.quaternion,o.scale);else{o.position.fromArray(n.translation||[0,0,0]);o.quaternion.fromArray(n.rotation||[0,0,0,1]);o.scale.fromArray(n.scale||[1,1,1]);}return o;});
 g.nodes.forEach((n,i)=>n.children?.forEach(c=>nodes[i].add(nodes[c])));const radice=new THREE.Group();g.scenes[g.scene||0].nodes.forEach(i=>radice.add(nodes[i]));radice.rotation.y=Math.PI/2;
 const get=n=>radice.getObjectByName(n),R={g:new THREE.Group()};R.g.scale.setScalar(1.1);R.g.add(radice);R.g.updateMatrixWorld(true);
 const C={radice,scala:1,ossa:{},schiena:[get('spine_01'),get('spine_02'),get('spine_03')]};
 const names={bacino:'pelvis',testa:'head',collo:'neck_01',bracD:'upperarm_r',bracS:'upperarm_l',avamD:'lowerarm_r',avamS:'lowerarm_l',manoD:'hand_r',manoS:'hand_l',cosciaD:'thigh_r',cosciaS:'thigh_l',gambaD:'calf_r',gambaS:'calf_l',piedeD:'foot_r',piedeS:'foot_l',puntaD:'ball_r',puntaS:'ball_l'};
 for(const [n,v]of Object.entries(names))C.ossa[n]=get(v);R.corpo=C;C.tiroRegistrato=preparaTiroRegistrato(R,C);return R;
}
const pose=dati.bones.map(()=>new THREE.Quaternion());let maxFootError=0,maxPalmError=0;
// La frusta parte dalla vera carica del file, non dal fotogramma ancora disteso.
campionaPosaRegistrata(dati.source.loadEnd,pose);
const ua=pose[dati.bones.findIndex(n=>n.target==='upperarm_r')],fa=pose[dati.bones.findIndex(n=>n.target==='lowerarm_r')];
const upper=new THREE.Vector3(1,0,0).applyQuaternion(ua),fore=new THREE.Vector3(1,0,0).applyQuaternion(fa);
const gomitoCarica=Math.acos(Math.max(-1,Math.min(1,-upper.dot(fore))))*180/Math.PI;
assert.ok(gomitoCarica>=55&&gomitoCarica<=115,'fine carica coerente col gomito della clip: '+gomitoCarica);
for(const manoS of [false,true])for(const carica of [0,.3,.7,1]){
 const R=model(),C=R.corpo,s=C.tiroRegistrato;
 const front=new THREE.Vector3(1,0,0),palmLocal={};
 for(const side of ['D','S'])palmLocal[side]=front.clone().applyQuaternion(C.ossa['mano'+side].getWorldQuaternion(new THREE.Quaternion()).invert());
 const p={uid:1,num:5,scheda:{},charging:true,act:null,isGK:false},T={manoS,oriz:0,alzataTiro:1};
 const J=Object.fromEntries(['hip','chest','head','sR','sL','eR','eL','hR','hL','kR','kL','fR','fL'].map(n=>[n,[0,0,0]]));J.sR=[0,.45,.2];J.sL=[0,.45,-.2];
 assert.equal(applicaTiroRegistrato(R,p,T,J,{gameTime:1,carica,caricaIngresso:1},.2),true);
 campionaPosaRegistrata(s.tempo,pose);
 for(const [side,targetFoot,targetToe,targetHand]of [['D','foot_r','ball_r','hand_r'],['S','foot_l','ball_l','hand_l']]){
  const index=dati.bones.findIndex(n=>n.target===targetFoot),handIndex=dati.bones.findIndex(n=>n.target===targetHand);
  const get=n=>C.radice.getObjectByName(n),v=new THREE.Vector3();
  const actual=get(targetToe).getWorldPosition(v).sub(get(targetFoot).getWorldPosition(new THREE.Vector3())).normalize();
  const q=pose[manoS?s.nodi[index].mirror:index].clone();if(manoS)q.set(-q.x,-q.y,q.z,q.w);
  // v0.90: il bacino tiene solo PLASK_ANCHE.quota della sua rotazione attorno alla verticale e le gambe lo seguono: i piedi sono quelli
  // della clip girati della stessa rotazione (s.giroAnche), nient'altro
  const desired=new THREE.Vector3(1,0,0).applyQuaternion(q).applyAxisAngle(new THREE.Vector3(0,1,0),s.giroAnche||0);maxFootError=Math.max(maxFootError,1-actual.dot(desired));
  assert.ok(actual.dot(desired)>.99999,'caviglia e punta seguono la clip (con la rotazione del bacino ridotta), senza posa a martello aggiunta');
  const hq=pose[manoS?s.nodi[handIndex].mirror:handIndex].clone();if(manoS)hq.set(-hq.x,-hq.y,hq.z,hq.w);
  const normal=palmLocal[side].clone().applyQuaternion(get(targetHand).getWorldQuaternion(new THREE.Quaternion())).normalize(),expected=new THREE.Vector3(0,1,0).applyQuaternion(hq);
  maxPalmError=Math.max(maxPalmError,1-normal.dot(expected));assert.ok(normal.dot(expected)>.995,'palmo calibrato sul modello, senza inversioni');
 }
}
for(let f=0;f<1000;f++){campionaPosaRegistrata(dati.source.start+(dati.source.end-dati.source.start)*f/999,pose);for(const q of pose)assert.ok(Number.isFinite(q.w)&&Math.abs(q.length()-1)<1e-6);}
console.log('PASS tiro completo: 52 ossa, modello intatto, piedi e palmi D/S fedeli alle pose; errori '+JSON.stringify({maxFootError,maxPalmError}));
