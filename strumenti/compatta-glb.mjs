// Compatta il contenitore senza cambiare vertici, rig, texture o campi dei nodi.
// I builder conservano i buffer sorgenti per sicurezza; qui si eliminano solo
// accessori e viste non più referenziati dopo la sostituzione delle mani.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const file=process.argv[2];
if(!file)throw new Error('Uso: node strumenti/compatta-glb.mjs modello.glb');
const raw=fs.readFileSync(file);
assert.equal(raw.readUInt32LE(0),0x46546c67);assert.equal(raw.readUInt32LE(4),2);
assert.equal(raw.readUInt32LE(8),raw.length);
const jsonLength=raw.readUInt32LE(12),g=JSON.parse(raw.toString('utf8',20,20+jsonLength));
assert.equal(g.buffers.length,1);
assert.ok(!g.extensionsUsed?.some(e=>/compression|draco/i.test(e)),'buffer non compressi');
const bin=raw.subarray(28+jsonLength);
const accessors=[],views=[],chunks=[],mapA=new Map(),mapV=new Map();
let bytes=0;
function view(id){
  if(mapV.has(id))return mapV.get(id);
  const old=g.bufferViews[id];assert.equal(old.buffer,0);
  const padding=(4-bytes%4)%4;
  if(padding){chunks.push(Buffer.alloc(padding));bytes+=padding;}
  const data=bin.subarray(old.byteOffset||0,(old.byteOffset||0)+old.byteLength);
  assert.equal(data.length,old.byteLength);
  const index=views.length;mapV.set(id,index);
  views.push({...old,byteOffset:bytes});chunks.push(data);bytes+=data.length;
  return index;
}
function accessor(id){
  if(mapA.has(id))return mapA.get(id);
  const a=structuredClone(g.accessors[id]),index=accessors.length;
  mapA.set(id,index);accessors.push(a);
  if(a.bufferView!==undefined)a.bufferView=view(a.bufferView);
  if(a.sparse){a.sparse.indices.bufferView=view(a.sparse.indices.bufferView);a.sparse.values.bufferView=view(a.sparse.values.bufferView);}
  return index;
}
function attributes(a){for(const k of Object.keys(a))a[k]=accessor(a[k]);}
for(const mesh of g.meshes)for(const p of mesh.primitives){
  attributes(p.attributes);
  if(p.indices!==undefined)p.indices=accessor(p.indices);
  for(const target of p.targets||[])attributes(target);
}
for(const skin of g.skins||[])if(skin.inverseBindMatrices!==undefined)skin.inverseBindMatrices=accessor(skin.inverseBindMatrices);
for(const animation of g.animations||[])for(const sampler of animation.samplers){sampler.input=accessor(sampler.input);sampler.output=accessor(sampler.output);}
for(const image of g.images||[])if(image.bufferView!==undefined)image.bufferView=view(image.bufferView);
g.accessors=accessors;g.bufferViews=views;g.buffers[0].byteLength=bytes;
let js=Buffer.from(JSON.stringify(g));js=Buffer.concat([js,Buffer.alloc((4-js.length%4)%4,32)]);
const body=Buffer.concat([...chunks,Buffer.alloc((4-bytes%4)%4)]);
const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+js.length+body.length,8);header.writeUInt32LE(js.length,12);header.writeUInt32LE(0x4e4f534a,16);
const binaryHeader=Buffer.alloc(8);binaryHeader.writeUInt32LE(body.length);binaryHeader.writeUInt32LE(0x004e4942,4);
const result=Buffer.concat([header,js,binaryHeader,body]);
fs.writeFileSync(file,result);
console.log(JSON.stringify({file,prima:raw.length,dopo:result.length,accessors:accessors.length,bufferViews:views.length}));
