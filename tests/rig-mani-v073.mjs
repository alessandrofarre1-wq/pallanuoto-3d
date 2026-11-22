// Verifica indipendente della mesh e del rig delle mani consegnato: usa matrici e pesi del
// GLB, non il builder Blender né le formule dei controller. La resa artistica
// rimane una verifica visiva nel renderer del gioco.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { preparaMani, aggiornaMani } from '../src/grafica/mani.js';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const argomento=nome=>process.argv.find(a=>a.startsWith('--'+nome+'='))?.slice(nome.length+3);
const MODELLO=argomento('modello')?path.resolve(argomento('modello')):path.join(ROOT,'src/grafica/modelli/pallanuotista.glb');
const BASE=path.join(ROOT,'modelli-sorgente/pallanuotista/v073/pallanuotista-v072.glb');
const componenti={5120:['readInt8',1],5121:['readUInt8',1],5122:['readInt16LE',2],5123:['readUInt16LE',2],5125:['readUInt32LE',4],5126:['readFloatLE',4]};
const dimensioni={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const vicino=(a,b,epsilon,messaggio)=>assert.ok(Math.abs(a-b)<=epsilon,`${messaggio}: ${a} / ${b}`);

function leggiGLB(file){
  const raw=fs.readFileSync(file);
  assert.equal(raw.readUInt32LE(0),0x46546c67,'intestazione GLB');
  assert.equal(raw.readUInt32LE(4),2,'versione GLB');
  assert.equal(raw.readUInt32LE(8),raw.length,'lunghezza dichiarata');
  let off=12,json,bin;
  while(off<raw.length){
    const n=raw.readUInt32LE(off),tipo=raw.readUInt32LE(off+4),chunk=raw.subarray(off+8,off+8+n);
    assert.ok(n%4===0&&off+8+n<=raw.length,'chunk completo e allineato');
    if(tipo===0x4e4f534a)json=JSON.parse(chunk.toString());
    if(tipo===0x004e4942)bin=chunk;
    off+=8+n;
  }
  assert.ok(json&&bin,'JSON e BIN incorporati');
  function accessor(index){
    const a=json.accessors[index],c=dimensioni[a.type],[metodo,bytes]=componenti[a.componentType];
    const out=Array.from({length:a.count},()=>Array(c).fill(0));
    if(a.bufferView!==undefined){
      const v=json.bufferViews[a.bufferView],stride=v.byteStride||c*bytes;
      const inizio=(v.byteOffset||0)+(a.byteOffset||0);
      assert.ok((a.byteOffset||0)+Math.max(0,a.count-1)*stride+c*bytes<=v.byteLength,'accessor nei limiti del buffer');
      for(let i=0;i<a.count;i++)for(let k=0;k<c;k++)out[i][k]=bin[metodo](inizio+i*stride+k*bytes);
    }
    if(a.sparse){
      const s=a.sparse,iv=json.bufferViews[s.indices.bufferView],vv=json.bufferViews[s.values.bufferView];
      const [im,ib]=componenti[s.indices.componentType];
      for(let n=0;n<s.count;n++){
        const i=bin[im]((iv.byteOffset||0)+(s.indices.byteOffset||0)+n*ib);
        assert.ok(i<a.count,'indice sparse valido');
        for(let k=0;k<c;k++)out[i][k]=bin[metodo]((vv.byteOffset||0)+(s.values.byteOffset||0)+(n*c+k)*bytes);
      }
    }
    if(a.normalized&&a.componentType!==5126){
      const massimo={5120:127,5121:255,5122:32767,5123:65535,5125:4294967295}[a.componentType];
      for(const row of out)for(let k=0;k<row.length;k++)row[k]=Math.max(-1,row[k]/massimo);
    }
    return out;
  }
  const jointIds=new Set(json.skins.flatMap(s=>s.joints));
  const nodi=json.nodes.map((n,i)=>{
    const o=jointIds.has(i)?new THREE.Bone():new THREE.Object3D();o.name=n.name||String(i);
    if(n.matrix)new THREE.Matrix4().fromArray(n.matrix).decompose(o.position,o.quaternion,o.scale);
    else{
      o.position.fromArray(n.translation||[0,0,0]);o.quaternion.fromArray(n.rotation||[0,0,0,1]);o.scale.fromArray(n.scale||[1,1,1]);
    }
    return o;
  });
  const scene=new THREE.Scene(),parents=new Map();
  for(let i=0;i<json.nodes.length;i++)for(const child of json.nodes[i].children||[]){
    assert.ok(!parents.has(child),'nessun nodo con due genitori');parents.set(child,i);nodi[i].add(nodi[child]);
  }
  for(let i=0;i<nodi.length;i++)if(!parents.has(i))scene.add(nodi[i]);
  scene.updateMatrixWorld(true);
  const byName=new Map(nodi.map((n,i)=>[n.name,{n,id:i}]));
  const rest=nodi.map(o=>({p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()}));
  const meshId=json.nodes.findIndex(n=>n.mesh!==undefined&&n.skin!==undefined);
  assert.ok(meshId>=0,'mesh con skin presente');
  const mesh=json.meshes[json.nodes[meshId].mesh],skin=json.skins[json.nodes[meshId].skin];
  const p=mesh.primitives[0],pos=accessor(p.attributes.POSITION),ji=accessor(p.attributes.JOINTS_0),sw=accessor(p.attributes.WEIGHTS_0);
  const inverses=accessor(skin.inverseBindMatrices).map(a=>new THREE.Matrix4().fromArray(a));
  const skeleton=new THREE.Skeleton(skin.joints.map(i=>nodi[i]),inverses);
  const jointNames=skin.joints.map(i=>nodi[i].name);
  function skinning(){
    scene.updateMatrixWorld(true);skeleton.update();
    const m=skeleton.boneMatrices,out=new Float64Array(pos.length*3);
    for(let i=0;i<pos.length;i++){
      const [x,y,z]=pos[i];
      for(let k=0;k<4;k++){
        const w=sw[i][k],o=ji[i][k]*16;
        out[i*3]+=w*(m[o]*x+m[o+4]*y+m[o+8]*z+m[o+12]);
        out[i*3+1]+=w*(m[o+1]*x+m[o+5]*y+m[o+9]*z+m[o+13]);
        out[i*3+2]+=w*(m[o+2]*x+m[o+6]*y+m[o+10]*z+m[o+14]);
      }
    }
    return out;
  }
  function reset(){
    for(let i=0;i<nodi.length;i++){nodi[i].position.copy(rest[i].p);nodi[i].quaternion.copy(rest[i].q);nodi[i].scale.copy(rest[i].s);}
    scene.updateMatrixWorld(true);skeleton.update();
  }
  const weight=(i,wanted)=>ji[i].reduce((s,j,k)=>s+(wanted.has(jointNames[j])?sw[i][k]:0),0);
  return {raw,json,accessor,nodi,scene,byName,rest,meshId,mesh,skin,p,pos,ji,sw,skeleton,jointNames,skinning,reset,weight};
}

const g=leggiGLB(MODELLO),base=leggiGLB(BASE);
assert.equal(createHash('sha256').update(base.raw).digest('hex'),'7a04a40e9a257cd4c724edabf7b0278eeb4f261a4d6bcc85da0289b0e8892b28','fonte v0.72 immutabile');
assert.equal(g.json.meshes.flatMap(m=>m.primitives).length,1,'un solo invio per il corpo');
assert.equal(g.json.materials.length,1,'un solo materiale condiviso');
assert.ok(!g.json.animations?.length,'nessuna animazione nascosta nel modello');
assert.ok(g.pos.length<=9023,'budget vertici precedente conservato');
const triangles=g.accessor(g.p.indices).length/3;
assert.ok(triangles<=9042,'budget triangoli precedente conservato');
for(const a of ['_ZONA','_NUMERO','_BOCCA','_SCURO'])assert.equal(g.accessor(g.p.attributes[a]).length,g.pos.length,'maschera shader '+a);
assert.equal(g.skin.joints.length,g.skeleton.boneInverses.length,'matrice bind per ogni joint');
assert.equal(new Set(g.jointNames).size,g.jointNames.length,'nomi joint unici');
const oldNames=base.jointNames;
assert.equal(oldNames.length,24,'baseline originale a 24 joint');
for(const name of oldNames){
  const a=base.byName.get(name),b=g.byName.get(name);assert.ok(b,'joint originale presente: '+name);
  for(const field of ['matrix','translation','rotation','scale'])assert.deepEqual(g.json.nodes[b.id][field],base.json.nodes[a.id][field],'riposo originale '+name+' '+field);
  const ai=base.jointNames.indexOf(name),bi=g.jointNames.indexOf(name);
  assert.deepEqual(g.accessor(g.skin.inverseBindMatrices)[bi],base.accessor(base.skin.inverseBindMatrices)[ai],'inverse bind originale '+name);
}
for(let i=0;i<g.pos.length;i++){
  assert.ok(g.pos[i].every(Number.isFinite),'posizione finita');
  assert.equal(g.ji[i].length,4,'quattro canali di indice al massimo');
  assert.equal(g.sw[i].length,4,'quattro canali di peso al massimo');
  assert.ok(g.sw[i].every(w=>Number.isFinite(w)&&w>=0),'pesi validi');
  vicino(g.sw[i].reduce((a,b)=>a+b,0),1,2e-6,'pesi normalizzati');
  assert.ok(g.ji[i].every(j=>Number.isInteger(j)&&j>=0&&j<g.skin.joints.length),'indici skin validi');
}
const rest=g.skinning(),baseRest=base.skinning();
let bindError=0;
for(let i=0;i<g.pos.length;i++){
  const expected=new THREE.Vector3().fromArray(g.pos[i]).applyMatrix4(g.nodi[g.meshId].matrixWorld);
  bindError=Math.max(bindError,Math.hypot(rest[i*3]-expected.x,rest[i*3+1]-expected.y,rest[i*3+2]-expected.z));
}
assert.ok(bindError<2e-5,'nessuna deformazione in bind: '+bindError);
const bounds=points=>Array.from({length:3},(_,k)=>{
  const a=Array.from({length:points.length/3},(_,i)=>points[i*3+k]);return [Math.min(...a),Math.max(...a)];
});
const bb=bounds(rest),bb0=bounds(baseRest);
vicino(bb[1][0],bb0[1][0],1e-5,'piedi alla stessa quota');
vicino(bb[1][1],bb0[1][1],1e-5,'altezza e calottina conservate');

const dita=['Thumb','Index','Middle','Ring','Pinky'];
const fingerNames=['left','right'].flatMap(side=>dita.flatMap(f=>[1,2,3].map(i=>side+'Hand'+f+i)));
const support={};
for(const name of fingerNames){
  assert.ok(g.jointNames.includes(name),'falange reale nella skin: '+name);
  support[name]=g.pos.reduce((n,_,i)=>n+(g.weight(i,new Set([name]))>.01?1:0),0);
  assert.ok(support[name]>0,'falange che deforma vertici: '+name);
}
const qx=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/4);
const v=new THREE.Vector3(),oldWorld=oldNames.map(n=>g.byName.get(n).n.matrixWorld.clone());
const movimenti=[];
function displacement(i,after){return Math.hypot(after[i*3]-rest[i*3],after[i*3+1]-rest[i*3+1],after[i*3+2]-rest[i*3+2]);}
for(const side of ['left','right']){
  g.reset();
  const fingertip=g.byName.get(side+'HandIndex3').n.getWorldPosition(new THREE.Vector3());
  const marker=g.byName.get('palmo_'+(side==='left'?'l':'r'))?.n;
  assert.ok(marker,'marker palmo anatomico '+side);
  const palmBefore=marker.getWorldPosition(new THREE.Vector3());
  g.byName.get(side+'HandIndex2').n.quaternion.multiply(qx);
  const after=g.skinning(),own=new Set([side+'HandIndex2',side+'HandIndex3']);
  const others=new Set(['Middle','Ring','Pinky','Thumb'].flatMap(f=>[1,2,3].map(i=>side+'Hand'+f+i)));
  let ownMax=0,otherMax=0,bodyMax=0;
  for(let i=0;i<g.pos.length;i++){
    if(g.weight(i,own)>.7)ownMax=Math.max(ownMax,displacement(i,after));
    if(g.weight(i,others)>.99)otherMax=Math.max(otherMax,displacement(i,after));
    if(Math.abs(g.pos[i][0])<.60)bodyMax=Math.max(bodyMax,displacement(i,after));
  }
  assert.ok(ownMax>.005,'la falange piega davvero l’indice '+side);
  assert.ok(otherMax<1e-5,'indice indipendente dalle altre dita '+side);
  assert.ok(bodyMax<1e-5,'curl non muove torso o volto '+side);
  for(let i=0;i<oldNames.length;i++){
    const now=g.byName.get(oldNames[i]).n.matrixWorld;
    assert.ok(now.elements.every((n,k)=>Math.abs(n-oldWorld[i].elements[k])<1e-9),'curl non muove la giuntura di gioco '+oldNames[i]);
  }
  assert.ok(marker.getWorldPosition(v).distanceTo(palmBefore)<1e-9,'il punto di appoggio della palla resta sul palmo');
  const delta=g.byName.get(side+'HandIndex3').n.getWorldPosition(v).sub(fingertip).toArray();
  assert.ok(delta[2]>.001,'curl verso il palmo, non verso il dorso '+side);
  movimenti.push({side,ownMax,otherMax,bodyMax,delta});
}
for(const [k,sign] of [[0,-1],[1,1],[2,1]])vicino(movimenti[0].delta[k],movimenti[1].delta[k]*sign,1e-5,'curl speculare componente '+k);
g.reset();

// Le 18 forme preesistenti e ogni loro vertice attivo devono restare uguali.
// Il confronto usa posizione/normale/tipo bocca e l'intero vettore delle 18
// forme: le UV possono essere ripacchettate, ma non il movimento del viso.
// Conserva anche labbra coincidenti che hanno spostamenti morph diversi.
assert.equal(g.jointNames.length,54,'24 joint originali e 30 falangi; nessun nuovo rig facciale');
assert.ok(!g.jointNames.some(n=>/^face[._]/i.test(n)),'il lavoro facciale rimane escluso');
const morphNames=g.mesh.extras?.targetNames||[];
assert.equal(morphNames.length,18,'18 forme originali conservate');
assert.deepEqual(morphNames,base.mesh.extras?.targetNames,'nomi e ordine delle forme originali');
assert.equal(g.p.targets.length,18,'18 target reali');
const normals=g.accessor(g.p.attributes.NORMAL),mouth=g.accessor(g.p.attributes._BOCCA);
const baseNormals=base.accessor(base.p.attributes.NORMAL),baseMouth=base.accessor(base.p.attributes._BOCCA);
const targets=g.p.targets.map(t=>g.accessor(t.POSITION)),baseTargets=base.p.targets.map(t=>base.accessor(t.POSITION));
const key=(p,n,kind)=>[...p.map(x=>x.toFixed(7)),...n.map(x=>x.toFixed(5)),kind.toFixed(4)].join('|');
const source=new Map(),runtime=new Map();
for(let i=0;i<base.pos.length;i++){
  const k=key(base.pos[i],baseNormals[i],baseMouth[i][0]);
  if(!source.has(k))source.set(k,[]);source.get(k).push(i);
}
for(let i=0;i<g.pos.length;i++){
  const k=key(g.pos[i],normals[i],mouth[i][0]);
  if(!runtime.has(k))runtime.set(k,[]);runtime.get(k).push(i);
}
const active=(T,i)=>T.some(t=>t[i].some(x=>Math.abs(x)>1e-9));
const sameMorph=(i,j)=>targets.every((t,k)=>t[i].every((x,c)=>Math.abs(x-baseTargets[k][j][c])<1e-8));
let activeRuntime=0,activeOriginal=0;
for(let i=0;i<g.pos.length;i++)if(active(targets,i)){
  const k=key(g.pos[i],normals[i],mouth[i][0]);
  assert.ok((source.get(k)||[]).some(j=>sameMorph(i,j)),'deformazione originale del viso identica al vertice runtime '+i);
  activeRuntime++;
}
const originalUsed=new Set(base.accessor(base.p.indices).map(row=>row[0]));
for(const j of originalUsed)if(active(baseTargets,j)){
  const k=key(base.pos[j],baseNormals[j],baseMouth[j][0]);
  assert.ok((runtime.get(k)||[]).some(i=>sameMorph(i,j)),'nessun vertice espressivo originale rimosso: '+j);
  activeOriginal++;
}
assert.ok(activeRuntime>100&&activeOriginal>100,'forme preesistenti realmente preservate, non vuote');

// Il controller deve animare solo le falangi: scelta D/S, apertura graduale al
// rilascio e pausa, senza modificare le giunture che determinano il gameplay.
const controller=[];
const physical=Object.freeze({J:Object.freeze({head:Object.freeze([1,2,3])}),ballW:Object.freeze([4,5,6]),isGK:false,act:null});
const physicalBefore=JSON.stringify(physical);
const trasformazioniFisse=new Map(Object.keys(support).map(name=>{
  const o=g.byName.get(name).n;return [name,JSON.stringify([o.position.toArray(),o.scale.toArray(),o.visible])];
}));
const assertBody=()=>{
  // Il replay può registrare soltanto le rotazioni perché questi canali
  // rimangono costanti anche durante presa e rilascio.
  for(const [name,before] of trasformazioniFisse){
    const o=g.byName.get(name).n;
    assert.equal(JSON.stringify([o.position.toArray(),o.scale.toArray(),o.visible]),before,'canali costanti della falange '+name);
  }

  g.scene.updateMatrixWorld(true);
  for(let i=0;i<oldNames.length;i++){
    const now=g.byName.get(oldNames[i]).n.matrixWorld;
    assert.ok(now.elements.every((n,k)=>Math.abs(n-oldWorld[i].elements[k])<1e-9),'il controller non muove '+oldNames[i]);
  }
  assert.equal(JSON.stringify(physical),physicalBefore,'nessuna mutazione della posa o palla fisica');
};
for(const manoS of [false,true]){
  g.reset();const mani=preparaMani(g.scene);assert.ok(mani,'controller trova le 30 falangi');
  const T={manoS,ballHand:false,ballDavanti:0,pescaPalla:0,swim:false};
  for(let i=0;i<90;i++)aggiornaMani(mani,physical,T,1/60);
  const dominant=(manoS?'left':'right')+'HandIndex2',other=(manoS?'right':'left')+'HandIndex2';
  const neutral=g.byName.get(dominant).n.quaternion.clone(),otherNeutral=g.byName.get(other).n.quaternion.clone();
  T.ballHand=true;for(let i=0;i<90;i++)aggiornaMani(mani,physical,T,1/60);
  const held=g.byName.get(dominant).n.quaternion.clone();
  const heldAngle=held.angleTo(neutral);
  assert.ok(heldAngle>.05,'presa reale con la mano dominante '+(manoS?'S':'D'));
  assert.ok(g.byName.get(other).n.quaternion.angleTo(otherNeutral)<1e-6,'la presa non chiude la mano libera');
  assertBody();
  const beforePause=mani.flatMap(m=>m.dita.flatMap(d=>d.ossa.map(o=>o.quaternion.toArray())));
  T.ballHand=false;aggiornaMani(mani,physical,T,0);
  assert.deepEqual(mani.flatMap(m=>m.dita.flatMap(d=>d.ossa.map(o=>o.quaternion.toArray()))),beforePause,'dt zero congela le dita');
  aggiornaMani(mani,physical,T,1/60);
  const firstRelease=g.byName.get(dominant).n.quaternion.clone();
  const firstStep=firstRelease.angleTo(held);
  assert.ok(firstStep>0&&firstStep<heldAngle*.8,'rilascio progressivo, senza salto in un fotogramma');
  for(let i=0;i<90;i++)aggiornaMani(mani,physical,T,1/60);
  const residual=g.byName.get(dominant).n.quaternion.angleTo(neutral);
  assert.ok(residual<1e-6,'dopo il rilascio torna alla mano rilassata');
  assertBody();controller.push({mano:manoS?'S':'D',heldAngle,firstReleaseStep:firstStep,releaseResidual:residual});
}
g.reset();
assert.equal(preparaMani(new THREE.Group()),null,'compatibilità col modello precedente senza falangi');
aggiornaMani(null,physical,{},1/60);

const report={sha256:createHash('sha256').update(g.raw).digest('hex'),triangles,vertices:g.pos.length,joints:g.jointNames.length,bindError,bounds:bb,fingers:support,fingerProbes:movimenti,morphOriginals:{count:18,activeRuntimeVertices:activeRuntime,activeOriginalVertices:activeOriginal},controller,
  limite:'Verifica Node indipendente di mesh/skin e controller mani; nessuna verifica della mimica facciale, nessun rendering o misura FPS.'};
if(argomento('salva'))fs.writeFileSync(path.resolve(argomento('salva')),JSON.stringify(report,null,2)+'\n');
console.log('PASS mani v0.73: budget, 24 giunture originali, skin reale, falangi indipendenti/speculari, 18 morph originali e presa/rilascio D/S');
console.log(JSON.stringify(report,null,2));
