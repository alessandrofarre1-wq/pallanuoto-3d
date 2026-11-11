// Punto d'ingresso: carica i moduli nell'ordine giusto e fa girare il ciclo di gioco
import './stile.css';
import './grafica/scena.js';
import './giocatori.js';
import './hud.js';
import './input.js';
import './menu.js';
import { SPEED } from './costanti.js';
import { render } from './grafica/render.js';
import { dpr, livelloAcqua, renderer, ridimensionaAcqua, setDpr, setLivelloAcqua } from './grafica/scena.js';
import { acquaAuto } from './menu.js';
import { tickFps, tickMsg, updateHUD } from './hud.js';
import { update } from './partita.js';
import { kickoff } from './regole.js';
import { allPlayers, ball, ctrl, fight, game, teams } from './stato.js';

let last=performance.now(), frameMs=16, qT=0, hudT=1;
function loop(now){
  const raw=Math.min(0.1,(now-last)/1000); last=now;
  const dt=raw*SPEED;
  // un aggiornamento per fotogramma (suddiviso solo se il fotogramma è lungo): movimento continuo, senza scatti
  const n=Math.max(1,Math.ceil(dt/0.02));
  try{ for(let i=0;i<n;i++) update(dt/n); }catch(e){ console.error(e); }
  // qualità adattiva: se il dispositivo fatica si abbassa la risoluzione di disegno
  frameMs+=(raw*1000-frameMs)*0.05; qT+=raw;
  // ordine dei tagli: prima il riflesso dell'acqua, poi la risoluzione, per ultima l'acqua semplice
  if(qT>2){ qT=0; if(frameMs>21){
    if(acquaAuto&&livelloAcqua===2) setLivelloAcqua(1);
    else if(dpr>1){ setDpr(Math.max(1,dpr-0.25)); renderer.setPixelRatio(dpr); ridimensionaAcqua(); }
    else if(acquaAuto&&livelloAcqua===1) setLivelloAcqua(0);
    frameMs=16;
  } }
  tickMsg(dt);
  hudT+=raw; if(hudT>0.05){ hudT=0; updateHUD(); }
  render(dt,now);
  tickFps(now);
  requestAnimationFrame(loop);
}
// accesso per le verifiche automatiche (tests/verifica.mjs) e per il debug dalla console
window.__pallanuoto = { game, teams, ball, allPlayers, fight, renderer, get ctrl(){ return ctrl; } };
// scena iniziale dietro al menu
kickoff(); game.state='menu';
requestAnimationFrame(loop);
