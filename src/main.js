import * as replay from './replay.js';
import { diagnosticaReplay } from './grafica/replay.js';
import { chiudiPresentazioneReplay } from './replay-regia.js';
// Punto d'ingresso: carica i moduli nell'ordine giusto e fa girare il ciclo di gioco
import { movePlayer } from './fisica.js';
import { MIRA_PASSAGGIO, bestPassTarget, doPass, doShoot, humanPassTarget, passLaneRisk, shotKind, startAct } from './tiri.js';
import { LISTA, convocati as convocatiRose, listaPartita, liste as listeRose, rosa as rosaPartita, tutti as tuttiRose, valoriMotore } from './dati/rose.js';
import { FINTA_FIRMA, FINTE, firmaFinta, stileFinta, versoFinta } from './finte.js';
import { colora, vesti } from './giocatori.js';
import { atlanteCostumi, costumiPronti, profiloCostume } from './grafica/costumi.js';
import { aggiornaSchemi, aiCarrier, attackTarget, gkTarget, markTarget, paloUomo, schemiUomo } from './ia.js';
import * as UOMO from './uomo-in-piu.js';
import { applicaSchema, copiaSchema, validaSchema } from './schemi.js';
import { squadreStat, stat as statPartita, azioneAperta, ultimaAzioneChiusa } from './statistiche.js';
import { CONTRO, contropiede, riceventeApertura, uomoDi } from './ia.js';
import { simulazione, simultanea } from './lotta.js';
import { boaFrontePorta, difensoreCentro, leggiCentro } from './centroboa.js';
import { centroAttacco } from './entrate.js';
import { occasioneControfuga } from './controfuga.js';
import { controllaInterferenza, ARBITRI } from './regole.js';
import './stile.css';
import './grafica/scena.js';
import './giocatori.js';
import './hud.js';
import * as input from './input.js';
import { braccioMuro, paloCoperto } from './muro.js';
import { PANCHINA, chiediCambio, momentoUtile, suggerimento, zonaCambi } from './panchina.js';
import './menu.js';
import { SPEED } from './costanti.js';
import { render } from './grafica/render.js';
import { ball3d, camera, contatti, dpr, renderer, scene, schiuma, setDpr } from './grafica/scena.js';
import { LIMITI, gocceAttive, gocceMesh } from './grafica/acqua-eventi.js';
import { creaCampagna, continuaTorneo, esportaSalvataggi, imposta, scegliSquadre, togglePause } from './menu.js';
import { modelloPronto } from './grafica/corpo.js';
import { tickFps, updateHUD } from './hud.js';
import { aggiornaDiagnosi } from './diagnosi.js';
import * as cronaca from './cronaca.js';
import { diagnosi, passoPalla, velocitaDiLancio } from './palla.js';
import { aggiornaPannelloFisica } from './fisica-palla/pannello.js';
import { update } from './partita.js';
import { callPlay, cornerThrow, exclude, foul, giveBall, goalScored, kickoff, penalty, setupPenalty, tackle, timeout } from './regole.js';
import { allPlayers, ball, ctrl, fight, game, setCtrl, teams } from './stato.js';

import { creaQualitaAdattiva } from './grafica/qualita.js';
const qualita=creaQualitaAdattiva(dpr);
let last=performance.now(), hudT=1;
// tornando da un'altra app i primi fotogrammi sono lunghi: non devono contare come "dispositivo lento"
// uscendo dall'app (o cambiando scheda) a partita in corso il gioco va in pausa: al ritorno si riprende dal menu
document.addEventListener('visibilitychange',()=>{ qualita.reset(); last=performance.now();
  if(document.hidden){ replay.interrompiReplay(); chiudiPresentazioneReplay(); }
  if(document.hidden && ['play','stop','countdown'].includes(game.state)){ cronaca.chiudiRegistro(); togglePause(); } });
// il gioco è solo in orizzontale: in verticale resta fermo sotto la schermata "Ruota il dispositivo" (stile.css) e riparte da
// solo appena si gira il telefono
// (il menu invece si usa anche in verticale: lì si continua a disegnare la piscina dietro il menu)
const verticale=()=>innerHeight>innerWidth, menuEl=document.getElementById('menu');
function loop(now){
  const frameMs=now-last;
  const raw=Math.min(0.1,frameMs/1000); last=now;
  const inPartita=menuEl.style.display==='none'||!!replay.statoReplay();
  document.body.classList.toggle('gioco',inPartita);
  if(verticale()&&inPartita){ replay.interrompiReplay(); chiudiPresentazioneReplay(); qualita.reset(); requestAnimationFrame(loop); return; }
  replay.avanzaTempoReplay(raw*SPEED);
  const saltati=replay.eseguiSaltoReplay(update);
  if(saltati){ input.resetInput(); cronaca.tick(saltati); }
  const dt=raw*SPEED;
  // un aggiornamento per fotogramma (suddiviso solo se il fotogramma è lungo): movimento continuo, senza scatti
  const n=Math.max(1,Math.ceil(dt/0.02));
  try{
    if(replay.trattieniMondoReplay()) input.pollInput();
    else for(let i=0;i<n;i++) update(dt/n);
  }catch(e){ console.error(e); }
  aggiornaPannelloFisica(raw);
  const nuovoDpr=qualita.aggiorna(frameMs,inPartita&&!document.hidden&&['play','stop','countdown'].includes(game.state),dpr);
  if(nuovoDpr!==dpr){ setDpr(nuovoDpr); renderer.setPixelRatio(dpr); }
  cronaca.tick(dt);
  render(dt,now);
  aggiornaDiagnosi(raw);
  // Le notifiche evitano porte e palla usando la camera del fotogramma corrente.
  hudT+=raw; if(hudT>0.05){ hudT=0; updateHUD(); }
  tickFps(now);
  requestAnimationFrame(loop);
}
// accesso per le verifiche automatiche (tests/verifica.mjs) e per il debug dalla console
// "vista" permette alla verifica di mettere la telecamera dove vuole (primi piani): { pos:[x,y,z], look:[x,y,z], fov };
// "senzaCorpi" ferma l'animazione degli scheletri (serve solo ad accelerare le partite simulate)
window.__pallanuoto = { imposta, ball3d, cronaca, camera, game, teams, ball, allPlayers, fight, renderer, vista:null, senzaCorpi:false, replay:{...replay,diagnostica:diagnosticaReplay,forzaRegistrazione:false}, costumi:{pronti:costumiPronti,profilo:profiloCostume,atlante:atlanteCostumi,colora,vesti}, tornei:{creaCampagna,continuaTorneo,esportaSalvataggi}, rose:{ tutti:tuttiRose, listaPartita, rosa:rosaPartita, liste:listeRose, convocati:convocatiRose, LISTA }, finte:{ FINTA_FIRMA, FINTE, firmaFinta, stileFinta, versoFinta }, palla:{ passoPalla, velocitaDiLancio, diagnosi }, effetti:{ gocce:gocceMesh, schiuma, contatti, LIMITI, gocceAttive }, __ridisegna:()=>renderer.render(scene,camera), regole:{ callPlay, setupPenalty, cornerThrow, exclude, giveBall, tackle, foul, penalty, timeout, goalScored }, scegliSquadre, uomo:UOMO, v046:{ statPartita, azioneAperta, ultimaAzioneChiusa, CONTRO, contropiede, uomoDi, simulazione, simultanea, controllaInterferenza, ARBITRI }, prova:{ centroAttacco, boaFrontePorta, difensoreCentro, leggiCentro, occasioneControfuga, doPass, gkTarget, humanPassTarget, MIRA_PASSAGGIO, riceventeApertura, paloUomo, schemiUomo, movePlayer, doShoot, startAct, valoriMotore, aiCarrier, bestPassTarget, passLaneRisk, shotKind, attackTarget, markTarget, aggiornaSchemi, applicaSchema, copiaSchema, validaSchema }, muro:{ paloCoperto, braccioMuro }, panchina:{ chiediCambio, suggerimento, momentoUtile, zonaCambi, PANCHINA }, pausa:togglePause, __setCtrl:setCtrl, get statistiche(){ return squadreStat(); }, get ctrl(){ return ctrl; }, get inp(){ return input.inp; }, get modelloPronto(){ return modelloPronto; } };
// scena iniziale dietro al menu
kickoff(); game.state='menu';
requestAnimationFrame(loop);
