import assert from 'node:assert/strict';
import { creaQualitaAdattiva } from '../src/grafica/qualita.js';
const q=creaQualitaAdattiva(1.5);
let dpr=1.5;
function frame(ms,attiva=true){ dpr=q.aggiorna(ms,attiva,dpr); }
function secondi(n,ms=1000/60){ for(let i=0;i<Math.ceil(n*1000/ms);i++) frame(ms); }
secondi(5); assert.equal(dpr,1.5,'60 fps conserva il dettaglio');
frame(40); secondi(3); assert.equal(dpr,1.5,'uno scatto isolato non riduce la qualità');
for(let i=0;i<180;i++) frame(i%6===0?30:16.67);
assert.ok(dpr<1.5,'gli scatti ripetuti attivano la riduzione');
secondi(30,33.33); assert.equal(dpr,1,'limite inferiore');
secondi(13); assert.equal(dpr,1.125,'recupero graduale dopo stabilità');
for(let i=0;i<180;i++) frame(33.33,false);
assert.equal(dpr,1.125,'il menu non cambia la qualità');
q.reset(); frame(5000); secondi(1); assert.equal(dpr,1.125,'ritorno da altra app escluso');
secondi(65); assert.equal(dpr,1.5,'recupero fino al dettaglio iniziale');
const piccolo=creaQualitaAdattiva(0.8);
assert.equal(piccolo.aggiorna(16,true,0.8),0.8,'rispetta dispositivi sotto DPR 1');
console.log('Qualità adattiva: 8 controlli superati');
