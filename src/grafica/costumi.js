// Un solo atlante locale per le bandiere sui costumi: stessi SVG del menu, nessun oggetto 3D aggiunto.
import * as THREE from 'three';
import { bandiera } from '../dati/bandiere.js';
import dati from '../dati/squadre.json';

const LATO=768, COLONNE=4, RIGHE=6, LARGHEZZA=192, ALTEZZA=128;
const tela=document.createElement('canvas'); tela.width=tela.height=LATO;
const ctx=tela.getContext('2d');
ctx.fillStyle='#fff'; ctx.fillRect(0,0,LATO,LATO);
export const atlanteCostumi=new THREE.CanvasTexture(tela);
atlanteCostumi.colorSpace=THREE.SRGBColorSpace; atlanteCostumi.anisotropy=4;
const profili=new Map(dati.squadre.map((s,i)=>[s.codice,Object.freeze({
  codice:s.codice, base:parseInt(s.costume.slice(1),16),
  // Il piccolo margine evita di pescare la bandiera adiacente con il filtro della texture.
  rettangolo:Object.freeze([(i%COLONNE*LARGHEZZA+6)/LATO,1-(Math.floor(i/COLONNE)*ALTEZZA+124)/LATO,180/LATO,120/LATO]),
})]));
export function profiloCostume(codice){
  const p=profili.get(codice);
  if(!p) throw new Error(`Costume della nazionale non disponibile: ${codice}`);
  return p;
}
// Si può attendere nei controlli e nelle fotografie: la creazione dei corpi non dipende dal caricamento degli SVG.
export const costumiPronti=Promise.all(dati.squadre.map((s,i)=>new Promise((resolve,reject)=>{
  const img=new Image();
  img.onload=()=>{
    ctx.drawImage(img,i%COLONNE*LARGHEZZA+6,Math.floor(i/COLONNE)*ALTEZZA+4,180,120);
    atlanteCostumi.needsUpdate=true; resolve(s.codice);
  };
  img.onerror=()=>reject(new Error(`Bandiera sul costume non caricata: ${s.codice}`));
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(bandiera(s.codice).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '));
}))).then(()=>Object.freeze({ nazionali:profili.size, larghezza:LATO, altezza:LATO, colonne:COLONNE, righe:RIGHE }));
