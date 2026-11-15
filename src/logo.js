// Marchio C «Flusso», scelto da Ale il 15/11/2026. Tracciati SVG senza font esterni.
import marchio from './immagini/logo-flusso.svg?raw';
let n=0;
// Ogni copia ha maschera e riferimenti accessibili propri, anche se le altre sono nascoste.
export const LOGO=()=>{
  const k=++n;
  let svg=marchio.replace('<svg ', '<svg class="logo" ');
  for(const id of ['title','desc','mark','flow-cut']) svg=svg.replaceAll(`id="${id}"`,`id="${id}-${k}"`).replaceAll(`#${id}`,`#${id}-${k}`);
  return svg.replace('aria-labelledby="title desc"',`aria-labelledby="title-${k} desc-${k}"`);
};
