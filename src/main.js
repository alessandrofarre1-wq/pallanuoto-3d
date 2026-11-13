// Punto d'ingresso: carica i moduli nell'ordine giusto e fa girare il ciclo di gioco
import { movePlayer } from './fisica.js';
import { doShoot, startAct } from './tiri.js';
import { valoriMotore } from './dati/rose.js';
import { squadreStat } from './statistiche.js';
import './stile.css';
import './grafica/scena.js';
import './giocatori.js';
import './hud.js';
import * as input from './input.js';
import './menu.js';
import { SPEED } from './costanti.js';
import { render } from './grafica/render.js';
import { camera, contatti, dpr, renderer, scene, schiuma, setDpr } from './grafica/scena.js';
import { LIMITI, gocceAttive, gocceMesh } from './grafica/acqua-eventi.js';
import { imposta, scegliSquadre, togglePause } from './menu.js';
import { modelloPronto } from './grafica/corpo.js';
import { tickFps, updateHUD } from './hud.js';
import * as cronaca from './cronaca.js';
import { diagnosi, passoPalla, velocitaDiLancio } from './palla.js';
import { aggiornaPannelloFisica } from './fisica-palla/pannello.js';
import { update } from './partita.js';
import { cornerThrow, exclude, foul, giveBall, goalScored, kickoff, penalty, setupPenalty, tackle, timeout } from './regole.js';
import { allPlayers, ball, ctrl, fight, game, setCtrl, teams } from './stato.js';

let last=performance.now(), frameMs=16, qT=0, hudT=1, lenti=0;
// tornando da un'altra app i primi fotogrammi sono lunghi: non devono contare come "dispositivo lento"
// uscendo dall'app (o cambiando scheda) a partita in corso il gioco va in pausa: al ritorno si riprende dal menu
document.addEventListener('visibilitychange',()=>{ frameMs=16; qT=0; lenti=0;
  if(document.hidden && ['play','stop','countdown'].includes(game.state)){ cronaca.chiudiRegistro(); togglePause(); } });
// il gioco è solo in orizzontale: in verticale resta fermo sotto la schermata "Ruota il dispositivo" (stile.css) e riparte da
// solo appena si gira il telefono
// (il menu invece si usa anche in verticale: lì si continua a disegnare la piscina dietro il menu)
const verticale=()=>innerHeight>innerWidth, menuEl=document.getElementById('menu');
function loop(now){
  const raw=Math.min(0.1,(now-last)/1000); last=now;
  const inPartita=menuEl.style.display==='none';
  document.body.classList.toggle('gioco',inPartita);
  if(verticale()&&inPartita){ requestAnimationFrame(loop); return; }
  const dt=raw*SPEED;
  // un aggiornamento per fotogramma (suddiviso solo se il fotogramma è lungo): movimento continuo, senza scatti
  const n=Math.max(1,Math.ceil(dt/0.02));
  try{ for(let i=0;i<n;i++) update(dt/n); }catch(e){ console.error(e); }
  aggiornaPannelloFisica(raw);
  // qualità adattiva: se il dispositivo fatica si abbassa la risoluzione di disegno
  frameMs+=(raw*1000-frameMs)*0.05; qT+=raw;
  // si taglia solo dopo due controlli lenti di fila (4 secondi), non per un singolo scatto
  if(qT>2){ qT=0; if(frameMs<=21) lenti=0; else if(++lenti>=2){ lenti=0;
    if(dpr>1){ setDpr(Math.max(1,dpr-0.25)); renderer.setPixelRatio(dpr); }
    frameMs=16;
  } }
  cronaca.tick(dt);
  hudT+=raw; if(hudT>0.05){ hudT=0; updateHUD(); }
  render(dt,now);
  tickFps(now);
  requestAnimationFrame(loop);
}
// accesso per le verifiche automatiche (tests/verifica.mjs) e per il debug dalla console
// "vista" permette alla verifica di mettere la telecamera dove vuole (primi piani): { pos:[x,y,z], look:[x,y,z], fov };
// "senzaCorpi" ferma l'animazione degli scheletri (serve solo ad accelerare le partite simulate)
window.__pallanuoto = { imposta, cronaca, camera, game, teams, ball, allPlayers, fight, renderer, vista:null, senzaCorpi:false, palla:{ passoPalla, velocitaDiLancio, diagnosi }, effetti:{ gocce:gocceMesh, schiuma, contatti, LIMITI, gocceAttive }, __ridisegna:()=>renderer.render(scene,camera), regole:{ setupPenalty, cornerThrow, exclude, giveBall, tackle, foul, penalty, timeout, goalScored }, scegliSquadre, prova:{ movePlayer, doShoot, startAct, valoriMotore }, __setCtrl:setCtrl, get statistiche(){ return squadreStat(); }, get ctrl(){ return ctrl; }, get inp(){ return input.inp; }, get modelloPronto(){ return modelloPronto; } };
// scena iniziale dietro al menu
kickoff(); game.state='menu';
requestAnimationFrame(loop);
