// ================= REGOLE / FASI =================
import { chiLasciare, passaAZona, scegliDifesa, setteControSei } from './ia.js';
import { elevazione } from './tiri.js';
import { riservaPer, vesti } from './giocatori.js';
import { annullaCambio } from './panchina.js';
import { sceltaRientro } from './pozzetto.js';
import { registraEspulsione, registraFallo, registraGol, registraPallaRubata, registraRigore, registraTimeout } from './statistiche.js';
import { whistle } from './audio.js';
import { autoSwitch, resetTap } from './controllo.js';
import { ARBITRO, ATK, BRV, DEFN, DIFF, EXCL_TIME, FORM, HL, HW, KICK_Z, SHOT_CLOCK, SHOT_RESET, clamp, dist, rnd } from './costanti.js';
import { annuncia } from './cronaca.js';
import { closestTo } from './ia.js';
import { rumble } from './input.js';
import { allPlayers, ball, ctrl, game, goalX, other, ownGoalX, setCtrl, teams } from './stato.js';
export function deadBall(t,fn){ game.state='stop'; game.timer=t; game.after=fn||null; }
// gioco fermo per palla fuori: se la palla si sta ancora muovendo (tiro fuori, deviazione del portiere, rimbalzo sul palo)
// continua il suo volo con la fisica vera finché non riparte il gioco, così si vede uscire; se è quasi ferma, si ferma
function fermaOVola(){
  ball.state='dead'; ball.inUscita=Math.hypot(ball.vx,ball.vy,ball.vz)>1.5;
  if(!ball.inUscita){ ball.vx=ball.vy=ball.vz=0; }
}
export function kickoff(){
  // sprint d'inizio tempo: tutti sulla propria linea di porta, palla a metà campo
  for(const t of teams) for(const p of t.players){
    if(p.excluded&&p.pf>=3) substitute(p);
    p.excluded=false; p.vx=p.vz=0; p.charging=false; p.cut=null; p.act=null;
    p.x=ownGoalX(t)+t.dir*(p.isGK?0.6:0.3); p.z=KICK_Z[p.i]*t.dir; p.fx=t.dir; p.fz=0;
  }
  ball.state='free'; ball.inUscita=false; ball.holder=null; ball.x=0; ball.z=0; ball.y=BRV; ball.vx=ball.vy=ball.vz=0; ball.pickupCD=0; ball.lastTeam=null;
  game.possTeam=null; game.shot=SHOT_CLOCK; game.penalty=null;
  setCtrl(teams[0].players[6]);
  game.state='countdown'; game.timer=3;
}
export function placeHalves(){
  for(const t of teams) for(const p of t.players){
    if(p.excluded) continue;
    p.vx=p.vz=0; p.charging=false; p.act=null;
    if(p.isGK){ p.x=ownGoalX(t)+t.dir*0.7; p.z=0; }
    else { const f=FORM[p.i]; p.x=-t.dir*(1.5+f[0]*0.9); p.z=f[1]*t.dir; }
    p.fx=t.dir; p.fz=0;
  }
}
export function giveBall(p){
  const changed = game.possTeam!==p.team, daPassaggio = ball.kind==='pass' && ball.state==='flight' && !changed;
  ball.state='held'; ball.inUscita=false; ball.toccoDifesa=null; ball.ignora=null; ball.holder=p; ball.holdTime=0; ball.kind=null; ball.target=null; ball.lastTeam=p.team;
  // quando e come è arrivata la palla: un tiro subito dopo un passaggio che ha cambiato lato trova il portiere fuori posto
  p.ricevutoT=game.time; p.ricevutoCambio=!!ball.cambioLato; p.ricevutoPassaggio=daPassaggio; if(!daPassaggio) p.ricevutoCambio=false;
  p.decideT=0.4+rnd()*0.4; p.alVolo=rnd()<(ball.cambioLato?0.8:0.4); ball.cambioLato=false; p.cut=null; p.act=null; p.fakeCount=0; p.fakeUsed=false; p.shootNext=false; p.fakeUntil=0;
  for(const q of allPlayers) q.freeThrow=false;
  resetTap();
  if(changed){
    game.possTeam=p.team; game.shot=SHOT_CLOCK;
    game.passaggi=0; game.cambiLato=0;      // passaggi e cambi di lato di questa azione (per le statistiche)
    for(const q of allPlayers) q.cut=null;
    for(const q of p.team.players) if(q.excluded){ if(q.alPozzetto) reenter(q); else q.puoRientrare=true; }      // art. 9.3c: rientra dal pozzetto (appena ci arriva)
    game.possT=game.time;
    // le squadre guidate dal computer scelgono lo schema a ogni cambio di possesso
    const att=p.team, dif=other(att);
    if(!att.human){ att.atkPlay=[0,0,1,1,3][Math.floor(rnd()*5)]; att.cross=rnd()<0.2; att.nextDrive=game.time+3+rnd()*4; }
    if(!dif.human) dif.defPlay=scegliDifesa(dif,att);      // il computer riparte sempre dal pressing (la zona arriva a metà azione)
    dif.lasciato=(dif.defPlay===1||dif.defPlay===3)?chiLasciare(dif):null;
    if(att.defPlay===3) att.fugaFino=game.time+5;                      // dalla zona a M si riparte subito in controfuga
    // 7 contro 6 nell'ultimo minuto: prima il time-out per prepararlo
    if(setteControSei(att)&&!att.setteAnnunciato){ att.setteAnnunciato=true; att.vuoleTimeout=true; annuncia('info','7 contro 6',{squadra:att,dettaglio:'portiere in attacco'}); }
    if(att.human) att.nextDrive=game.time+6+rnd()*4;
  } else if(ball.afterShot){ game.shot=SHOT_RESET; }                  // art. 8.12a
  ball.afterShot=false;
  if(p.team!==teams[0]) autoSwitch(p);
}
export function reenter(p,keepPos){
  p.excluded=false; p.alPozzetto=false; p.puoRientrare=false;
  if(p.pf>=3) substitute(p);
  if(!keepPos){ p.x=ownGoalX(p.team)+p.team.dir*0.8; p.z=-HW+0.5; p.vx=p.vz=0; }      // dal pozzetto, appena dentro il campo
  p.lagX=p.x; p.lagZ=p.z;
  sceltaRientro(p);
}
export function substitute(p){   // terzo fallo personale: entra un cambio dalla panchina (art. 16.2)
  const t=p.team, g=riservaPer(p); t.subs++;
  if(t.cambio&&t.cambio.esce===p) annullaCambio(t);
  if(p.scheda){ p.scheda.fuori=true; p.scheda.pf=p.pf; p.scheda.stamina=p.stamina; }
  if(g){ vesti(p,g); p.pf=g.pf||0; p.stamina=g.stamina??1; } else { p.pf=0; p.stamina=1; }
}
export function cornerThrow(att){   // art. 13
  whistle(0.25); annuncia('ripresa',"Tiro d'angolo",{squadra:att});
  const side=ball.z>=0?1:-1;
  fermaOVola(); ball.afterShot=false;
  deadBall(ball.inUscita?1.4:1.1,()=>{
    const wi = side*att.dir>0 ? 2 : 3;
    const w = att.players.find(q=>!q.excluded&&q.i===wi) || closestTo(att,ball);
    w.x=goalX(att)-att.dir*2; w.z=side*(HW-0.5); w.vx=w.vz=0;
    giveBall(w); game.possTeam=att; game.shot=SHOT_RESET;
  });
}
export function penalty(d,c,motivo){       // art. 10.2 (motivo: solo per la notifica)
  whistle(0.6); d.pf++; registraRigore(c.team);
  annuncia('rigore',`Rigore per ${c.team.short}`,{p:c,dettaglio:`fallo di ${d.team.short} #${d.num}${motivo?' · '+motivo:''}`});
  ball.state='dead'; ball.holder=null; ball.x=c.x; ball.z=c.z; ball.y=BRV; ball.vx=ball.vy=ball.vz=0;
  const t=c.team;
  deadBall(1.8,()=>{ if(d.pf>=3) substitute(d); setupPenalty(t); });
}
export function setupPenalty(t){    // tiro dai 5 metri; tutti gli altri sulla linea dei 6 metri, ad almeno 3 metri da chi tira
  const gx=goalX(t), ot=other(t);
  let s=null; for(const q of t.players){ if(q.excluded||q.isGK) continue; if(!s||q.st.sht>s.st.sht) s=q; }
  // posti sulla linea dei 6 metri: a 3 metri di lato da chi tira (cioè a più di 3 metri di distanza) e poi ogni 95 cm,
  // alternando difensori e attaccanti; ognuno va sul lato in cui si trova già
  const fila=[], dif=ot.players.filter(q=>!q.excluded&&!q.isGK), att=t.players.filter(q=>!q.excluded&&!q.isGK&&q!==s);
  for(let i=0;i<Math.max(dif.length,att.length);i++){ if(dif[i]) fila.push(dif[i]); if(att[i]) fila.push(att[i]); }
  const lati={ 1:fila.filter(q=>q.z>=0), [-1]:fila.filter(q=>q.z<0) };
  while(Math.abs(lati[1].length-lati[-1].length)>1){ const piu=lati[1].length>lati[-1].length?1:-1; lati[-piu].push(lati[piu].pop()); }
  for(const q of allPlayers){
    if(q.excluded) continue;
    q.vx=q.vz=0; q.cut=null; q.act=null; q.charging=false; q.chargeT=0;
    if(q===s){ q.x=gx-t.dir*5; q.z=0; q.fx=t.dir; q.fz=0; }
    else if(q===ot.players[0]){ q.x=gx-t.dir*0.4; q.z=0; }
  }
  for(const lato of [1,-1]) lati[lato].forEach((q,k)=>{ q.x=gx-t.dir*6; q.z=lato*(3+0.95*k); q.fx=t.dir; q.fz=0; q.lagX=q.x; q.lagZ=q.z; });
  giveBall(s); game.possTeam=t; game.penalty=s; game.penT=0;
  if(t.human){ setCtrl(s); annuncia('avviso','Rigore: tieni premuto TIRO e rilascia',{p:s,durata:2}); }
}
export function sideOut(){        // art. 12: palla uscita lateralmente, tiro libero agli avversari di chi l'ha toccata per ultimo
  const t = ball.lastTeam ? other(ball.lastTeam) : teams[0], side=ball.z>=0?1:-1, x=clamp(ball.x,-HL+1,HL-1);
  whistle(0.22); annuncia('ripresa','Palla fuori',{squadra:t,dettaglio:`rimessa ${t.short}`});
  ball.holder=null; fermaOVola(); if(!ball.inUscita){ ball.x=x; ball.z=side*(HW-0.3); ball.y=BRV; } ball.afterShot=false;
  deadBall(ball.inUscita?1.3:0.9,()=>{ const r=closestTo(t,ball)||t.players[6]; r.x=x; r.z=side*(HW-0.7); r.vx=r.vz=0; giveBall(r); r.freeThrow=true; });
}
// Sfondamento (fallo in attacco, art. 8): chi ha la palla nuota dritto addosso a un difensore fermo o che arretra.
// Come lo sfondamento del basket: palla alla difesa, tiro libero dal punto del contatto.
export function sfondamento(c,d){
  whistle(0.22); registraFallo(c.team);
  annuncia('fallo','Fallo in attacco',{p:c,dettaglio:'nuota addosso al difensore'});
  c.stunUntil=game.time+0.6; c.vx*=0.2; c.vz*=0.2;
  ball.state='dead'; ball.holder=null; ball.vx=ball.vy=ball.vz=0; ball.y=BRV; ball.x=c.x; ball.z=c.z;
  deadBall(0.9,()=>{ if(d.excluded) d=closestTo(d.team,ball); giveBall(d); d.freeThrow=true; });
}
export function areaFoul(q){      // art. 8.2.8: attaccante nell'area di porta davanti alla linea della palla
  const def=other(q.team);
  whistle(0.25); annuncia('fallo','Fallo in attacco',{p:q,dettaglio:"nell'area di porta davanti alla palla"});
  ball.state='dead'; ball.holder=null; ball.vx=ball.vy=ball.vz=0; ball.y=BRV;
  deadBall(1.1,()=>giveBall(def.players[0]));
}
export function timeout(t){       // art. 5: due time-out a squadra, solo in possesso di palla; si riparte da metà campo
  if(t.timeouts<=0||game.state!=='play'||game.penalty||game.possTeam!==t||!ball.holder||ball.holder.team!==t) return false;
  t.timeouts--; whistle(0.7); registraTimeout(t); game.cambiLiberi=true;      // nel time-out i cambi sono liberi
  annuncia('timeout','Time-out',{squadra:t,dettaglio:`${t.name} · ne resta${t.timeouts===1?'':'no'} ${t.timeouts}`});
  ball.state='dead'; ball.holder=null; ball.vx=ball.vy=ball.vz=0;
  deadBall(2.6,()=>{
    for(const q of allPlayers){ q.stamina=Math.min(1,q.stamina+0.4); q.cut=null; }
    placeHalves();
    const r=t.players[6].excluded ? closestTo(t,{x:0,z:0}) : t.players[6];
    r.x=-t.dir*0.4; r.z=0; giveBall(r); r.freeThrow=true;
  });
  return true;
}
export function callPlay(i){
  const t=teams[0];
  if(game.possTeam===t){
    if(i===0){ t.atkPlay=0; t.cross=false; }
    else if(i===1){ t.atkPlay=1; t.nextDrive=0; }
    else if(i===2){ t.atkPlay=2; t.cross=!t.cross; }
    else t.atkPlay=3;
    annuncia('avviso',`Schema: ${ATK[t.atkPlay]}`);
  } else if(i===1||i===3) passaAZona(t,i,true);
  else if(i<4){ t.defPlay=i; t.lasciato=null; annuncia('avviso',`Difesa: ${DEFN[i]}`); }
}
export function goalScored(t){
  t.score++; whistle(0.6); rumble(350,1); registraGol(t,ball); game.cambiLiberi=true;      // dopo un gol i cambi sono liberi
  if(ball.shooter&&ball.shooter.team===t&&ball.shooter.scheda) ball.shooter.scheda.gol=(ball.shooter.scheda.gol||0)+1;      // gol del giocatore (panchina)
  // parziale: tre gol subiti di fila fanno chiamare il time-out all'allenatore del computer
  { const sub=other(t); t.parzialeSubito=0; sub.parzialeSubito=(sub.parzialeSubito||0)+1; if(sub.parzialeSubito>=3) sub.vuoleTimeout=true; }
  annuncia('gol','Gol',{p:ball.shooter,squadra:t});
  ball.state='dead';      // la palla prosegue fino in fondo alla rete (fisica.js)
  const conceding=other(t);
  deadBall(2.6,()=>{
    placeHalves();
    for(const p of allPlayers) if(p.excluded) reenter(p);        // art. 9.3b
    const r=conceding.players[6]; r.x=-conceding.dir*0.4; r.z=0;
    giveBall(r); game.possTeam=conceding; game.shot=SHOT_CLOCK;
    annuncia('ripresa','Ripresa dal centro',{squadra:conceding,registro:false});
    deadBall(1.2,null);
  });
}
export function goalThrow(defTeam,text){
  whistle(0.25); annuncia('ripresa',text||'Rimessa dal portiere',{squadra:defTeam});
  fermaOVola(); if(!ball.inUscita){ ball.y=BRV; ball.x=clamp(ball.x,-HL-0.5,HL+0.5); }
  deadBall(ball.inUscita?1.4:1.0,()=>{ giveBall(defTeam.players[0]); });
}
export function exclude(d,c,motivo,origine){      // c e motivo: solo per la notifica; origine: «centro» (lotta), «fuga» (fallo tattico), altro
  whistle(0.5); d.pf++; rumble(220,0.8); registraEspulsione(d,origine);
  // tre espulsioni subite in due minuti: time-out per ridare calma e attenzione in marcatura
  { const T=d.team; T.espulsioniT=(T.espulsioniT||[]).filter(x=>game.time-x<120); T.espulsioniT.push(game.time); if(T.espulsioniT.length>=3){ T.vuoleTimeout=true; T.espulsioniT=[]; } }
  // l'espulso non sparisce: nuota fino al pozzetto (angolo lontano dalla giuria, vicino alla propria porta) mentre si gioca;
  // rientra solo da lì (pozzetto.js)
  d.excluded=true; d.exclUntil=game.time+EXCL_TIME; d.charging=false; d.cut=null; d.act=null; d.alPozzetto=false; d.puoRientrare=false; d.valutatoPozzetto=false;
  { const inCampo=t=>t.players.filter(q=>!q.excluded&&!q.isGK).length, a=inCampo(other(d.team)), b=inCampo(d.team);
    annuncia('espulsione','Espulsione',{p:d,dettaglio:[c?`fallo su ${c.team.short} #${c.num}`:motivo||'', a>b?`${other(d.team).short} in superiorità ${a} c ${b}`:'',
      d.pf>=3?'3° fallo grave: definitiva':`${EXCL_TIME}"`].filter(Boolean).join(' · ')}); }
  game.shot=Math.max(game.shot,SHOT_RESET);                           // art. 8.12c
  if(d.team.doubleP===d) d.team.doubleP=null;
  if(ctrl===d) autoSwitch(ball.holder||ball);
}
export function foul(d,c){     // fallo semplice: il gioco si ferma e l'attacco batte il tiro libero (artt. 8, 11)
  whistle(0.22); rumble(120,0.5); registraFallo(d.team);
  d.stunUntil=game.time+0.9;
  const dx=d.x-c.x, dz=d.z-c.z, l=Math.hypot(dx,dz)||1; d.x+=dx/l*0.9; d.z+=dz/l*0.9; d.vx=d.vz=0;
  c.act=null; c.charging=false; c.chargeT=0; c.freeThrow=true; c.decideT=0.25;
  annuncia('fallo','Fallo',{p:d,dettaglio:`tiro libero ${c.team.short}`});
  deadBall(0.8,null);
}
// Contrasto. L'obiettivo del difensore è RUBARE PALLA SENZA FARE FALLO: il fallo è la conseguenza di un contrasto sbagliato.
// Da dove si arriva: davanti o di lato si può mettere la mano sulla palla; da dietro si finisce addosso all'attaccante.
export function latoContrasto(d,c){
  const dx=d.x-c.x, dz=d.z-c.z, l=Math.hypot(dx,dz)||1, cs=(dx*c.fx+dz*c.fz)/l;
  return cs>0.35 ? 'davanti' : cs>-0.45 ? 'lato' : 'dietro';
}
// Com'è tenuta la palla: in palleggio davanti alla testa (nuotando) o appoggiata sull'acqua è esposta; alzata in mano per
// tirare o passare non si può prendere senza toccare il braccio.
export function pallaEsposta(c){
  if(c.charging||(c.act&&!c.act.done)) return 'alzata';
  return (c.oriz||0)>0.5 ? 'palleggio' : 'appoggiata';
}
// l'attaccante avrebbe probabilmente segnato? (dentro i 6 metri, rivolto alla porta, senza altri difensori davanti)
function probabileGol(d,c){
  const gx=ownGoalX(d.team), dxg=gx-c.x;
  if(Math.abs(dxg)>6||Math.abs(c.z)>5) return false;
  const l=Math.hypot(dxg,c.z)||1; if((c.fx*dxg-c.fz*c.z)/l<0.1) return false;
  return !d.team.players.some(q=>q!==d&&!q.isGK&&!q.excluded&&Math.hypot(gx-q.x,q.z)<l+0.5&&dist(q,c)<1.6);
}
// o.voluto = CONTRASTO tenuto premuto: fallo semplice cercato apposta per fermare l'azione (scelta tattica normale)
// Esiti: 'rubata', 'niente' (l'attaccante la protegge), 'fallo', 'espulsione', 'rigore'; false se il contrasto non parte.
// CONTRASTO A TRE LIVELLI (richiesta di Ale, stile NBA 2K), uguale per il giocatore e per il computer:
//  1-2 pressioni = DISTURBO: il difensore finge di entrare; l'attaccante sotto pressione non può tirare per circa un secondo e si
//      gira a proteggere la palla (di spalle al difensore); resta una piccola probabilità di rubarla (contrasto pulito);
//  3 pressioni in 1,5 s = il difensore INSISTE e commette fallo (con il rischio di espulsione o rigore del fallo voluto).
export const CONTRASTO={ finestra:1.5, fallo:3, pressione:1.1 };
export function contrasto(d,c){
  if(d.excluded||game.time<d.stunUntil) return false;
  d.colpi=(d.colpi||[]).filter(t=>game.time-t<CONTRASTO.finestra); d.colpi.push(game.time);
  d.fintaC=game.time+0.35;                                     // la mano parte verso la palla (solo disegno)
  if(d.colpi.length>=CONTRASTO.fallo){ d.colpi=[]; d.tackleCD=0; return tackle(d,c,{fallo:true}); }
  c.pressatoUntil=game.time+CONTRASTO.pressione; c.pressatoDa=d;
  return tackle(d,c,{soloRuba:true});
}
// Da dove nascono le espulsioni (indicazione di Ale, 13/11/2026): circa il 70% dalla lotta tra centroboa e marcatore,
// il resto da falli tattici (fermare una controfuga) o da interventi irruenti. Tarati sui Mondiali 2025 (World Aquatics, uomini):
// circa 11 espulsioni per squadra a partita, 66% dal centroboa. Moltiplicatori della probabilità:
export const ESPULSIONI={ centro:7, contrasto:0.24 };
export function tackle(d,c,o){
  o=o||{};
  if(d.tackleCD>0||d.excluded||game.time<d.stunUntil) return false;
  const press=d.team.defPlay===2;
  d.tackleCD = d===ctrl ? 0.45 : 0.9+rnd()*0.8;
  if(dist(d,c)>(d===ctrl?1.35:1.15)) return false;
  const lato=latoContrasto(d,c), palla=pallaEsposta(c), gol=probabileGol(d,c);
  // Disciplina: chi ne ha poca sbaglia più spesso il contrasto e commette più falli gravi
  const fDis=1.5-(d.s.dis-40)/59, sev=fDis*ARBITRO;
  const grave=()=>{ if(gol&&rnd()<(lato==='dietro'?0.6:0.35)){ penalty(d,c); return 'rigore'; }
    if(rnd()<(lato==='dietro'?0.55:lato==='lato'?0.24:0.12)*(palla==='alzata'?1.3:1)*(press?1:0.85)*sev*ESPULSIONI.contrasto){ exclude(d,c,undefined,o.origine); return 'espulsione'; }
    return null; };
  if(o.voluto){
    // fallo voluto: ferma il gioco; da dietro o su chi è in posizione di tiro si rischia l'espulsione (o il rigore)
    const inTiro=Math.abs(ownGoalX(d.team)-c.x)<7.5&&palla==='alzata';
    if(gol&&rnd()<0.6){ penalty(d,c); return 'rigore'; }
    if(rnd()<(o.origine==='fuga'?(lato==='dietro'?0.8:lato==='lato'?0.5:0.2):(lato==='dietro'?0.42:inTiro?0.36:0.07))*sev){ exclude(d,c,undefined,o.origine); return 'espulsione'; }      // in controfuga il fallo per fermare l'azione è quasi sempre espulsione
    foul(d,c); return 'fallo';
  }
  // Difesa del difensore contro la capacità dell'attaccante di proteggere palla (Forza e Passaggio)
  const diff=(d.s.dif-(c.s.frz+c.s.pas)/2)/59*(d.team.human?1:DIFF());
  // Chi protegge la palla (corpo in mezzo: difensore alle spalle, o palla tenuta lontana) non si deruba quasi mai.
  // Si ruba soprattutto il palleggio preso di lato in controfuga e la palla tenuta troppo a lungo sotto pressione.
  const aLungo=clamp((ball.holdTime-3)/3,0,1);
  const pRuba=clamp(0.021*(lato==='davanti'?1:lato==='lato'?1.1:0.12)*(palla==='palleggio'?(lato==='lato'?2.4:1.5):palla==='appoggiata'?0.8+1.6*aLungo:0.2)
    *clamp(1+1.4*diff,0.45,1.8)*(press?1.2:1)*(o.stealMul||1),0.004,0.4);
  const pFallo=clamp(0.27*(lato==='dietro'?1.9:lato==='lato'?1:0.75)*(palla==='alzata'?1.6:1)*(0.6+0.4*fDis)*(press?1.2:1),0.05,0.7);
  const r=rnd();
  if(r<pRuba){ registraPallaRubata(d.team); giveBall(d); annuncia('possesso','Palla rubata!',{p:d}); return 'rubata'; }
  if(o.soloRuba) return 'disturbo';      // disturbo: niente fallo, solo pressione
  if(o.fallo||r<pRuba+pFallo){ const g=grave(); if(g) return g; foul(d,c); return 'fallo'; }      // fallo: insistendo (contrasto) è sicuro
  // niente: l'attaccante copre la palla con il corpo e il difensore resta un attimo fuori tempo
  d.stunUntil=game.time+0.25;
  if(d===ctrl) annuncia('avviso','Palla protetta',{durata:0.8});
  return null;
}
// finta di tiro: i difensori vicini possono abboccare (e restare fuori tempo) oppure andare addosso al tiratore
export function doFake(p){
  const t=p.team, ot=other(t), dG=Math.hypot(goalX(t)-p.x,p.z);
  // la finta riesce se il tiratore resta alto e stabile sulle gambe
  const q=(0.7+0.3*p.st.sht)*(0.65+0.6*elevazione(p))*Math.pow(0.5,p.fakeCount||0)*(dG<9?1:0.4);
  p.fakeCount=(p.fakeCount||0)+1;
  let bit=0;
  for(const d of ot.players){
    if(d.excluded||d.isGK||d===ctrl) continue;
    const dd=dist(d,p); if(dd>2.4) continue;
    const pb=clamp(0.6*q-(dd<1.0?0.25:0)-0.15*d.st.def*(d.team.human?1:DIFF())+(d.team.defPlay===1?0.1:0),0.05,0.8);
    if(rnd()<pb){ d.stunUntil=game.time+0.9; d.biteUntil=game.time+0.7; bit++; }
    else if(dd<1.5){ d.tackleCD=0; if(tackle(d,p,{stealMul:1.8})) return; }
  }
  const gk=ot.players[0];
  if(dG<9 && !gk.excluded && rnd()<0.45*q){ gk.fakedUntil=game.time+1.1; bit++; }
  if(bit) p.fakeUntil=game.time+1.3;
  annuncia('avviso',bit?'Finta riuscita!':'Finta',{durata:0.8});
}
