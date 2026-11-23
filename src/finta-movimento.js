// Una finta completa: accenno, arresto e ritorno alla stessa posizione di carica.
export const FINTA_MOVIMENTO=Object.freeze({anticipazione:.16,frusta:.18,recupero:.36,braccio:.8,torace:.10,ingresso:.70});
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function impulsoFinta(a){
  if(a?.kind!=='fake')return 0;
  const avanti=a.wind+a.frusta;
  return a.t<=avanti?ease(a.t/avanti):1-ease((a.t-avanti)/FINTA_MOVIMENTO.recupero);
}
