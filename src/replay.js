// Regia del replay: osserva il gol, senza cambiare tiri, probabilità o cronometri.
import { ball, game, teams } from './stato.js';

export const TEMPI_REPLAY=Object.freeze({diretta:0.6,clip:2,attesaGol:2.6});
const FIRME={beduina:'BEDUINA',schizzo:'SCHIZZO',colonnello:'COLONNELLO',rovesciata:'ROVESCIATA',sciarpa:'SCIARPA'};
let sessione=null, progressivo=0, salto=false;
export let generazioneReplay=0;

export function registraTiroReplay(p,{tipo,distanza,rigore=false}={}){
  ball.tiroReplay=Object.freeze({uid:p.uid,numero:p.num,nome:p.name,squadra:p.team.short,
    dir:p.team.dir,tipo:tipo||'shot',distanza,rigore,tiroX:p.x,tiroZ:p.z});
}

export function datiGolReplay(t){
  const s=ball.shooter,tiro=ball.tiroReplay;
  const valido=s?.team===t&&tiro?.uid===s.uid&&tiro.squadra===t.short;
  return Object.freeze({squadra:t.short,avversaria:teams[1-t.idx].short,
    finePeriodo:game.clock<=0,periodo:game.period,casa:teams[0].short,ospite:teams[1].short,punteggio:`${teams[0].score} – ${teams[1].score}`,
    numero:valido?tiro.numero:s?.team===t?s.num:null,
    nome:valido?tiro.nome:s?.team===t?s.name:'',
    firma:valido?(tiro.rigore?'RIGORE':FIRME[tiro.tipo]||(tiro.distanza>=6?'TIRO DA FUORI':'GOL')):'GOL',
    dir:t.dir,tiroX:valido?tiro.tiroX:ball.x-t.dir*4,tiroZ:valido?tiro.tiroZ:ball.z,
    xGol:ball.x,zGol:ball.z});
}

export function segnalaGolReplay(info,riprendi){
  sessione={id:++progressivo,info,riprendi,consumato:false,eta:0}; salto=false;
}

export function avanzaTempoReplay(dt){
  if(sessione&&!sessione.consumato&&!['menu','paused'].includes(game.state)) sessione.eta+=dt;
}

export function statoReplay(){
  if(!sessione||sessione.consumato) return null;
  if(game.state==='paused') return null;
  const normale=game.after===sessione.riprendi&&game.state==='stop';
  const sirena=sessione.info.finePeriodo&&['stop','countdown','over'].includes(game.state);
  if(game.rigoriFinali||(!normale&&!sirena)){
    sessione=null; salto=false; return null;
  }
  const eta=normale?TEMPI_REPLAY.attesaGol-Math.max(0,game.timer):sessione.eta;
  if(eta>=TEMPI_REPLAY.attesaGol){ sessione.consumato=true; return null; }
  return {id:sessione.id,info:sessione.info,fase:eta<TEMPI_REPLAY.diretta?'diretta':'replay',
    progresso:Math.max(0,Math.min(1,(eta-TEMPI_REPLAY.diretta)/TEMPI_REPLAY.clip))};
}

export function interrompiReplay(){ if(sessione) sessione.consumato=true; salto=false; }
export function richiediSaltoReplay(){ if(statoReplay()?.fase==='replay') salto=true; }

// Salta solo il resto dell'attesa del gol: la callback originale prepara la
// rimessa UNA volta e rimangono gli 1,2 s di ripresa. Recupero e cambi avanzano
// degli stessi secondi non giocati; nessun comando premuto viene conservato.
export function eseguiSaltoReplay(avanza){
  if(!salto) return 0;
  salto=false;
  const s=sessione;
  if(!s||s.consumato) return 0;
  s.consumato=true;
  if(game.state!=='stop'||game.after!==s.riprendi) return 0;
  let tempo=0;
  for(let i=0;i<180&&game.state==='stop'&&game.after===s.riprendi;i++){
    const dt=Math.min(1/60,Math.max(0,game.timer));
    if(!dt) break;
    avanza(dt); tempo+=dt;
  }
  return tempo;
}

export function azzeraReplay(){ sessione=null; salto=false; ball.tiroReplay=null; generazioneReplay++; }
