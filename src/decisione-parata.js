import { PARATA_PORTIERE as P } from './taratura.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Decide il tentativo, non il possesso della palla: la parata richiede poi
// un contatto effettivo con la sagoma in movimento del portiere.
export function probabilitaTentativo(o){
  const R=o.riflessi, fresco=.8+.2*o.stamina;
  const tempo=clamp((o.tempoVolo-.28)/.3,0,1), d=o.distanzaTiro;
  const facile=(o.tipoTiro==='perimetro'?.12:0)+.3*tempo+Math.max(0,d-7.5)*.2+
    Math.max(0,.6-o.angolo)*.8+.1*o.marcato+(o.daFermo?.1:0)-(o.dopoCambio?.16:0)-
    (o.liberato?.05:0)-(o.tipoTiro==='superiorita'?o.parataSuperiorita:0);
  const lontano=Math.max(0,Math.abs(o.zPalla-o.zPrima)-.7);
  const portata=(.5+.8*R)*fresco+.7*tempo+Math.max(0,d-7.5)*.3;
  if(lontano>=portata||o.yPalla>=1.9)return 0;
  const vicino=clamp((.26-o.tempoVolo)/.26,0,1)*.42;
  let prob=(1.07-.30*o.forza*(1.25-.5*R)-lontano*(.7-.3*R)-(o.lob?.2:0)-o.finta-
    (o.schizzo?.12:0)-o.sorpresa-vicino+facile)*fresco*o.difficolta*(o.rigore?P.letturaRigore:1);
  if(!o.rigore){
    const contrario=Math.abs(o.vzPrima)>.3&&Math.sign(o.zPalla-o.zPrima)!==Math.sign(o.vzPrima);
    prob-=.15*clamp(o.fuoriPosto-.3,0,1)+(contrario?.12*Math.min(1,Math.abs(o.vzPrima)/1.2):0);
  }
  return clamp(prob,0,1);
}

// Un colpo su torace, testa o braccio è una respinta. Una presa pulita richiede
// la mano sulla palla, velocità compatibile e tempo: anche il polso da vicino
// può essere deviato e non diventa automaticamente una presa.
export function probabilitaPresa({parte,velocita,distanza,tempoVolo}){
  if(parte!=='mano')return 0;
  const k=clamp((velocita-P.velocitaLenta)/(P.velocitaVeloce-P.velocitaLenta),0,1);
  const base=P.presaLenta+(P.presaVeloce-P.presaLenta)*k;
  return distanza<=P.distanzaRavvicinata&&tempoVolo<=P.tempoRavvicinato?Math.min(P.presaRavvicinata,base):base;
}
