// Stessi vertici, ossa, texture e morph target: solo una lista più corta di
// triangoli per i due corpi aggiuntivi dei cambi, mai per chi è in campo.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { NodeIO } from '@gltf-transform/core';
import { MeshoptSimplifier } from 'meshoptimizer';
await MeshoptSimplifier.ready;
const doc=await new NodeIO().read(new URL('../src/grafica/modelli/pallanuotista.glb',import.meta.url).pathname);
const primitive=doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives());
if(primitive.length!==1) throw new Error('Il modello deve avere una sola primitiva');
const p=primitive[0], pos=p.getAttribute('POSITION').getArray(), original=new Uint32Array(p.getIndices().getArray());
const [indices,error]=MeshoptSimplifier.simplify(original,pos,3,8400,0.05,[]);
const sorgente=await fs.readFile(new URL('../src/grafica/modelli/pallanuotista.glb',import.meta.url));
const out={sha256:createHash('sha256').update(sorgente).digest('hex'),vertici:p.getAttribute('POSITION').getCount(),triangoliOriginali:original.length/3,triangoli:indices.length/3,errore:error,indici:Array.from(indices)};
await fs.writeFile(new URL('../src/grafica/modelli/riserva-indici.json',import.meta.url),JSON.stringify(out)+'\n');
console.log(JSON.stringify({vertici:out.vertici,prima:out.triangoliOriginali,dopo:out.triangoli,errore:error}));
