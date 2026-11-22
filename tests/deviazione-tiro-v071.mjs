import assert from 'node:assert/strict';
import { velocitaDeviata } from '../src/deviazione-tiro.js';
for(const s of [1,-1]){
 const dritto=velocitaDeviata([22*s,0,0],[-s,0,0]);
 assert.ok(dritto[0]*s<0,'muro pieno rimanda il tiro verso il campo');
 const sfiorato=velocitaDeviata([22*s,-.3,0],[-.12*s,.1,.98]);
 assert.ok(sfiorato[0]*s>15&&Math.abs(sfiorato[2])>.1,'sfioramento conserva avanzamento e cambia lato');
 assert.ok(Math.hypot(...sfiorato)<Math.hypot(22,.3),'nessuna energia creata dalla deviazione');
}
console.log('PASS deviazione tiro: piena indietro, sfiorata ancora in porta, simmetria ed energia');
