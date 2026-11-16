// Presentazione visuale: il mondo continua soltanto nella pausa regolamentare.
import { game } from './stato.js';
import { resetInput } from './input.js';
import { attivaRiproduzioneReplay, generazioneReplay, interrompiReplay, richiediSaltoReplay, statoReplay } from './replay.js';
import { aggiornaReplay, mostraReplay, nascondiReplay, registraSalto } from './replay-ui.js';
import { azzeraArchivioReplay, disegnaClipReplay, preparaClipReplay, registraFotogrammaReplay } from './grafica/replay.js';

let generazione=-1, clipId=0, ultimoCampione=null;
registraSalto(richiediSaltoReplay);

export function chiudiPresentazioneReplay(){
  if(clipId||document.body.classList.contains('replay')){ nascondiReplay(); resetInput(); }
  clipId=0; document.body.classList.remove('replay-attesa-fine');
}

export function presentaReplay(draw,now){
  if(generazione!==generazioneReplay){
    azzeraArchivioReplay(); generazione=generazioneReplay; ultimoCampione=null;
    chiudiPresentazioneReplay();
  }
  if(['menu','paused'].includes(game.state)||document.hidden){
    interrompiReplay(); chiudiPresentazioneReplay(); return false;
  }
  const s=statoReplay();
  if(s?.fase!=='replay'){
    chiudiPresentazioneReplay();
    document.body.classList.toggle('replay-attesa-fine',!!s&&game.state==='over');
    return false;
  }
  if(clipId!==s.id){
    if(ultimoCampione===null||now-ultimoCampione>120||!preparaClipReplay(s.info)){ interrompiReplay(); chiudiPresentazioneReplay(); return false; }
    clipId=s.id; attivaRiproduzioneReplay(); resetInput(); mostraReplay(s.info);
  }
  aggiornaReplay(s.progresso);
  if(disegnaClipReplay(s.progresso,s.info,draw)) return true;
  interrompiReplay(); chiudiPresentazioneReplay(); return false;
}

export function registraDirettaReplay(dt,now,disegnato){
  if(!disegnato||!(['play','stop'].includes(game.state)||(game.state==='over'&&statoReplay()?.fase==='diretta'))||game.rigoriFinali) return;
  // Le simulazioni senza GPU non sono filmati: un buco non deve unire due azioni.
  if(ultimoCampione!==null&&(now-ultimoCampione>120||now<ultimoCampione)) azzeraArchivioReplay();
  ultimoCampione=now;
  registraFotogrammaReplay(dt);
}
