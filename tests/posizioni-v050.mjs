// Numeri tattici e lavagna: solo Node, senza scena 3D o browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';

globalThis.window={};
const { FORM, FORM_UP, HL }=await import('../src/costanti.js');
const { numeroPosizione, nomePosizione }=await import('../src/schemi.js');
const { LIBRERIA }=await import('../src/uomo-in-piu.js');
const { miniatura, inizializzaUomo }=await import('../src/uomo-editor.js');
const interni=[1,2,3,4,5,6], numeriParita=[6,1,5,2,4,3], numeriSuperiorita=[5,1,4,2,3,6];
for(const [sup,attesi] of [[false,numeriParita],[true,numeriSuperiorita]]){
  assert.deepEqual(interni.map(i=>numeroPosizione(i,sup)),attesi,'numeri distinti per parità e superiorità');
  assert.equal(new Set(attesi).size,6,'ogni posizione ha un solo numero');
  for(const i of interni) assert.ok(nomePosizione(i,sup).startsWith(`Pos. ${attesi[i-1]} · `),'nome e numero concordano');
}
assert.equal(numeroPosizione(0),null,'il portiere non occupa una posizione di movimento');
assert.equal(numeroPosizione(7,true),null,'nessuna posizione inventata per indice assente');

// Contratto dei posti iniziali, espressi per numero visibile guardando la porta.
const parita=[[1.7,6.2],[5.8,4.6],[7.5,0],[5.8,-4.6],[1.7,-6.2],[2.6,0]];
const superiorita=[[2,5.4],[5.2,2.5],[5.2,-2.5],[2,-5.4],[2.1,1.75],[2.1,-1.75]];
for(const [sup,forma,attesi] of [[false,FORM,parita],[true,FORM_UP,superiorita]]){
  for(const i of interni) assert.deepEqual(forma[i],attesi[numeroPosizione(i,sup)-1],'la numerazione non cambia le coordinate');
}

// Legge le espressioni effettive dell'IA, senza importarne motore, DOM o GPU.
const ia=fs.readFileSync(new URL('../src/ia.js',import.meta.url),'utf8');
const formula=ia.match(/const x=([^,]+),z=clamp\((.*),-HW\+0\.5,HW-0\.5\);/);
assert.ok(formula,'trasformazione dei posti di attacco presente nell’IA');
const target=new Function('gx','t','f0','fz','sup',`return [${formula[1]},${formula[2]}];`);
for(const forma of [FORM,FORM_UP]) for(const i of interni){
  const [d,lato]=forma[i];
  for(const dir of [-1,1]){
    const gx=dir*HL,[x,z]=target(gx,{dir},d,lato,true);
    assert.ok(Math.abs((gx-x)*dir-d)<1e-12,'distanza dalla porta conservata dopo cambio campo');
    assert.ok(Math.abs(z*dir-lato)<1e-12,'destra dell’attaccante conservata dopo cambio campo');
  }
}

// Le fasi e i riferimenti palla precedenti alla rinumerazione restano identici.
// (v0.58: l'impronta resta sugli schemi precedenti; l'«Uscita del 6» aggiunta dal video della finale olimpica ha un controllo suo)
const NUOVI=['u6esce'];
const dati=JSON.stringify(LIBRERIA.filter(s=>!NUOVI.includes(s.id)).map(({id,fasi})=>({id,fasi})));
const impronta=createHash('sha256').update(dati).digest('hex');
const tutti=JSON.stringify(LIBRERIA.map(({id,fasi})=>({id,fasi})));
{ const u6=LIBRERIA.find(s=>s.id==='u6esce');
  assert.ok(u6&&u6.fasi.length===3&&u6.fasi[1].posti[5][0]>=5&&Math.abs(u6.fasi[1].posti[5][1])<0.5&&Math.abs(u6.fasi[1].posti[0][1])<0.5,'uscita del 6: il 6 al centro dei 5 metri e il 5 al centro della porta'); }
assert.equal(impronta,'a201d75cc39f33a1c293ec494b1447759b5d038a0894e755169cae1796bbd3e6','nessun cambio di indici, coordinate, durata o destinatario della palla');
for(const schema of LIBRERIA){
  for(const fase of schema.fasi){
    const svg=miniatura({...schema,fasi:[fase]},'prova');
    const testi=[...svg.matchAll(/<text x="([^"]+)" y="([^"]+)"[^>]*>(\d+)<\/text>/g)];
    assert.equal(testi.length,6,'sei giocatori nella miniatura');
    for(const [i,testo] of testi.entries()){
      const [d,z]=fase.posti[i];
      assert.equal(Number(testo[1]),300+z*29.8,'destra del diagramma uguale alla destra dell’attaccante');
      assert.equal(Number(testo[2]),28+d*29+8,'profondità del diagramma invariata');
      assert.equal(Number(testo[3]),numeriSuperiorita[i],'il numero segue lo stesso giocatore in ogni fase');
    }
  }
}
assert.equal(JSON.stringify(LIBRERIA.map(({id,fasi})=>({id,fasi}))),tutti,'il disegno non modifica gli schemi');
assert.equal(LIBRERIA.find(s=>s.id==='uscivola5').nome,'Uscita del 4','ID storico conservato con nome corretto');
assert.equal(LIBRERIA.find(s=>s.id==='urot1').nome,'Rotazione verso Pos. 5','destinatario coerente con la nuova posizione');

// DOM minimo per verificare valori interni del selettore e identità della lavagna.
const nodi=new Map();
globalThis.document={
  querySelector:()=>null,
  getElementById(id){
    if(!nodi.has(id)) nodi.set(id,{innerHTML:'',value:'',addEventListener(){},insertAdjacentHTML(_p,testo){this.innerHTML+=testo;}});
    return nodi.get(id);
  }
};
inizializzaUomo({apri(){},torna(){}});
const opzioni=[...nodi.get('uomoPalla').innerHTML.matchAll(/<option value="(\d+)">([^<]+)<\/option>/g)];
assert.deepEqual(opzioni.map(o=>Number(o[1])),[0,2,4,5,3,1,6],'opzioni ordinate per UI con valori interni conservati');
assert.deepEqual(opzioni.slice(1).map(o=>Number(o[2].match(/^Pos\. (\d+)/)[1])),interni,'selettore da Pos. 1 a Pos. 6');
nodi.get('uomoNuovo').onclick();
const giocatori=[...nodi.get('uomoPiscina').innerHTML.matchAll(/<g data-uomo-ruolo="(\d+)"[^>]*aria-label="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g)];
assert.equal(giocatori.length,6);
for(const g of giocatori){
  const i=Number(g[1]);
  assert.ok(g[2].startsWith(nomePosizione(i,true)),'aria-label usa posizione pubblica');
  assert.equal(Number(g[3].match(/<text[^>]*>(\d+)<\/text>/)[1]),numeriSuperiorita[i-1],'cerchio e aria-label concordano');
}
nodi.get('uomoPalla').value='4';nodi.get('uomoPalla').onchange();
const destinatario=nodi.get('uomoPiscina').innerHTML.match(/<g data-uomo-ruolo="4"[^>]*>([\s\S]*?)<\/g>/)[1];
assert.match(destinatario,/<text[^>]*>2<\/text>/,'Pos. 2 resta il giocatore interno 4');
assert.match(destinatario,/fill="#ffd400"/,'la palla segue il valore interno del selettore');
console.log('Posizioni v0.50: mapping, campo invertito, fasi, miniature e selettore PASS');
