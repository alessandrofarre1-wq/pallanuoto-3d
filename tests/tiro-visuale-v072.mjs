// Catena del tiro standard e contratto del rig: solo Node, nessun renderer.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { catenaTiroVista, raccordaCatenaTiroVista } from '../src/grafica/tiro-vista.js';

const campi=['peso','bacino','gambe','crunch','anticipo','spinta','sweep','pull','gomito','trasferimento'];
const campione=(carica=1,volo=0,chiude=0,lato=1,oriz=0)=>catenaTiroVista({},carica,volo,chiude,lato,oriz);
const vicino=(a,b,messaggio,tolleranza=1e-10)=>assert.ok(Math.abs(a-b)<tolleranza,messaggio+': '+a+' / '+b);

const out={J:Object.freeze({fisico:true}),ballW:Object.freeze([1,2,3])};
assert.equal(catenaTiroVista(out,1,0,0),out,'il calcolo riusa lo stato visuale');
assert.deepEqual(out.J,{fisico:true});assert.deepEqual(out.ballW,[1,2,3]);
const caricata=campione(),rilascio=campione(1,1),anchePronte=campione(1,.54);
assert.ok(caricata.bacino<-.2&&rilascio.bacino>.2,'il bacino carica e ruota verso il bersaglio');
vicino(anchePronte.anticipo,1,'le anche completano la rotazione prima del braccio');
assert.ok(anchePronte.crunch<rilascio.crunch,'il core completa la catena dopo le anche');
assert.ok(caricata.sweep>caricata.pull&&rilascio.pull>rilascio.sweep,'la mano libera spazza e poi tira in basso');
assert.ok(caricata.gomito>0,'il gomito resta alto durante il caricamento');
assert.ok(campione(1,.48).spinta>.99,'la gamba dominante avvia il tiro');

for(const volo of [0,.2,.48,.54,.8,1])for(const chiude of [0,.4,1]){
  const d=campione(1,volo,chiude,1),s=campione(1,volo,chiude,-1);
  for(const k of campi)vicino(s[k],d[k]*(k==='bacino'||k==='gambe'?-1:1),'specchio del tiro '+k);
  for(const assente of [campione(0,volo,chiude),campione(1,volo,1),campione(1,volo,chiude,1,1)]){
    for(const k of ['peso','bacino','gambe','crunch','trasferimento'])vicino(assente[k],0,'nessuna catena aggiunta fuori dal tiro verticale '+k);
  }
}

// Le fasi si agganciano senza salto di posizione o velocità, incluso il recupero.
const eps=1e-6;
function controllaC1(f,punti,etichetta){
  for(const x of punti){
    const prima=f(x-eps),centro=f(x),dopo=f(x+eps);
    for(const k of campi){
      const vl=(centro[k]-prima[k])/eps,vr=(dopo[k]-centro[k])/eps;
      assert.ok(Math.abs(vl-vr)<.002,'raccordo C1 '+etichetta+' '+x+' '+k);
    }
  }
}
controllaC1(v=>campione(1,v),[0,.28,.48,.54,1],'accelerazione');
controllaC1(v=>campione(1,1,v),[0,1],'chiusura');
controllaC1(v=>campione(1,.5,0,1,v),[0,1],'assetto');
for(let i=0;i<=400;i++){
  const t=i/400,a=campione(1,t,t*.5);
  assert.ok(campi.every(k=>Number.isFinite(a[k])),'catena numericamente finita');
  for(const k of ['peso','anticipo','spinta','sweep','pull','gomito'])assert.ok(a[k]>=0&&a[k]<=1,'peso limitato '+k);
}

const memoria={valida:false,gesto:'carica',renderTime:1,raccordoD:.08};
const caricaMemoria=raccordaCatenaTiroVista(memoria,true,.7,0,0,1,0);
const daCarica={...caricaMemoria};
memoria.valida=true;memoria.gesto={kind:'shot'};memoria.renderTime=1.01;
const inizioAtto=raccordaCatenaTiroVista(memoria,true,1,.25,0,1,0);
assert.equal(inizioAtto,caricaMemoria,'carica e atto riusano lo stesso contenitore');
for(const k of campi)vicino(inizioAtto[k],daCarica[k],'il comando prosegue dalla catena caricata '+k);
memoria.renderTime=1.09;
const fineIngresso=raccordaCatenaTiroVista(memoria,true,1,.25,0,1,0),atteso=campione(1,.25);
for(const k of campi)vicino(fineIngresso[k],atteso[k],'fine raccordo senza ritardo ulteriore '+k);
const daAtto={...fineIngresso};memoria.gesto=null;memoria.renderTime=1.1;
const uscita=raccordaCatenaTiroVista(memoria,false,0,1,0,1,0);
for(const k of campi)vicino(uscita[k],daAtto[k],'uscita senza salto '+k);
memoria.renderTime=1.18;raccordaCatenaTiroVista(memoria,false,0,1,0,1,0);
for(const k of ['peso','bacino','gambe','crunch','trasferimento'])vicino(uscita[k],0,'recupero completo '+k);
// Dopo sostituzione/ricollocazione il reset v070 invalida la memoria: niente posa trascinata.
memoria.valida=false;memoria.gesto={kind:'shot'};memoria.renderTime=10;
const azzerata=raccordaCatenaTiroVista(memoria,true,1,0,0,-1,0),mancino=campione(1,0,0,-1);
for(const k of campi)vicino(azzerata[k],mancino[k],'reset identità del tiratore '+k);

const posa=fs.readFileSync(new URL('../src/grafica/pose.js',import.meta.url),'utf8');
const torsioneCarica=Number(posa.match(/kind==='shot'\|\|kind==='torsione'\?(-[\d.]+):/)?.[1]);
assert.ok(Number.isFinite(torsioneCarica),'caricamento effettivo delle spalle del tiro standard');
for(const lato of [1,-1]){
  const bacino=campione(1,0,0,lato).bacino;
  const separazione=Math.abs(torsioneCarica*lato-bacino)*180/Math.PI;
  assert.ok(separazione>=25&&separazione<=35,'carica elastica fra bacino e torace: '+separazione+'°');
}
const fisica=posa.slice(posa.indexOf('//<POSE>'),posa.indexOf('//</POSE>')+'//</POSE>'.length);
assert.equal(createHash('sha256').update(fisica).digest('hex'),'bd1833d84ab7553fcfcf95d21c20c619fdaafab91eb657405ce7b51a6e17c231','posa fisica e traiettorie del lancio conservate');

// Non basta avere nomi di ossa: gomiti, polsi, anche e gambe devono deformare la mesh.
const glb=fs.readFileSync(new URL('../src/grafica/modelli/pallanuotista.glb',import.meta.url));
assert.equal(glb.readUInt32LE(0),0x46546c67);assert.equal(glb.readUInt32LE(4),2);
const lunghezzaJSON=glb.readUInt32LE(12),gltf=JSON.parse(glb.toString('utf8',20,20+lunghezzaJSON));
const bin=glb.subarray(20+lunghezzaJSON+8);
const nodo=gltf.nodes.find(n=>n.skin!==undefined&&n.mesh!==undefined),skin=gltf.skins[nodo.skin];
const primitiva=gltf.meshes[nodo.mesh].primitives[0],attributi=primitiva.attributes;
const vertici=gltf.accessors[attributi.POSITION].count;
assert.ok(vertici<=9023,'budget vertici del modello originale');
assert.ok(gltf.accessors[primitiva.indices].count/3<=9042,'budget triangoli del modello originale');
assert.equal(gltf.accessors[skin.inverseBindMatrices].count,skin.joints.length,'matrice bind per ogni joint');
const componenti={5121:{bytes:1,leggi:'readUInt8'},5123:{bytes:2,leggi:'readUInt16LE'},5126:{bytes:4,leggi:'readFloatLE'}};
function vettore(accessor,i){
  const a=gltf.accessors[accessor],vista=gltf.bufferViews[a.bufferView],c=componenti[a.componentType];
  const inizio=(vista.byteOffset||0)+(a.byteOffset||0)+i*(vista.byteStride||4*c.bytes);
  assert.equal(a.type,'VEC4');assert.equal(a.count,vertici);
  return Array.from({length:4},(_,n)=>bin[c.leggi](inizio+n*c.bytes));
}
const influenze=new Set();
for(let i=0;i<vertici;i++){
  const joints=vettore(attributi.JOINTS_0,i),pesi=vettore(attributi.WEIGHTS_0,i);
  vicino(pesi.reduce((a,b)=>a+b,0),1,'pesi normalizzati',2e-6);
  for(let k=0;k<4;k++)if(pesi[k]>.0001){
    assert.ok(joints[k]<skin.joints.length,'indice joint valido');
    influenze.add(gltf.nodes[skin.joints[joints[k]]].name);
  }
}
for(const nome of ['pelvis','spine_01','spine_02','spine_03',...['l','r'].flatMap(s=>['upperarm','lowerarm','hand','thigh','calf','foot','ball'].map(n=>n+'_'+s))]){
  assert.ok(influenze.has(nome),'osso con influenza reale sulla mesh: '+nome);
}
console.log('PASS tiro visuale v0.72: anche/core/mano libera, specchio, raccordi C1, posa fisica intatta e rig pesato ('+vertici+' vertici)');
