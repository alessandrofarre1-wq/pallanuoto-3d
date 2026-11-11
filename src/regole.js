// ================= REGOLE / FASI =================
import { scegliDifesa, setteControSei } from './ia.js';
import { elevazione } from './tiri.js';
import { riservaPer, vesti } from './giocatori.js';
import { registraEspulsione, registraFallo, registraGol, registraPallaRubata, registraRigore, registraTimeout } from './statistiche.js';
import { whistle } from './audio.js';
import { autoSwitch, resetTap } from './controllo.js';
import { ARBITRO, ATK, BRV, DEFN, DIFF, EXCL_TIME, FORM, HL, HW, KICK_Z, SHOT_CLOCK, SHOT_RESET, clamp, dist, rnd } from './costanti.js';
import { showMsg } from './hud.js';
import { closestTo } from './ia.js';
import { rumble } from './input.js';
import { allPlayers, ball, ctrl, game, goalX, other, ownGoalX, setCtrl, teams } from './stato.js';
export function deadBall(t,fn){ game.state='stop'; game.timer=t; game.after=fn||null; }
export function kickoff(){
  // sprint d'inizio tempo: tutti sulla propria linea di porta, palla a metà campo
  for(const t of teams) for(const p of t.players){
    if(p.excluded&&p.pf>=3) substitute(p);
    p.excluded=false; p.vx=p.vz=0; p.charging=false; p.cut=null; p.act=null;
    p.x=ownGoalX(t)+t.dir*(p.isGK?0.6:0.3); p.z=KICK_Z[p.i]*t.dir; p.fx=t.dir; p.fz=0;
  }
  ball.state='free'; ball.holder=null; ball.x=0; ball.z=0; ball.y=BRV; ball.vx=ball.vy=ball.vz=0; ball.pickupCD=0; ball.lastTeam=null;
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
  const changed = game.possTeam!==p.team;
  ball.state='held'; ball.holder=p; ball.holdTime=0; ball.kind=null; ball.target=null; ball.lastTeam=p.team;
  p.decideT=0.4+rnd()*0.4; p.alVolo=rnd()<0.45; p.cut=null; p.act=null; p.fakeCount=0; p.fakeUsed=false; p.shootNext=false; p.fakeUntil=0;
  for(const q of allPlayers) q.freeThrow=false;
  resetTap();
  if(changed){
    game.possTeam=p.team; game.shot=SHOT_CLOCK;
    for(const q of allPlayers) q.cut=null;
    for(const q of p.team.players) if(q.excluded) reenter(q);          // art. 9.3c
    game.possT=game.time;
    // le squadre guidate dal computer scelgono lo schema a ogni cambio di possesso
    const att=p.team, dif=other(att);
    if(!att.human){ att.atkPlay=[0,0,1,1,3][Math.floor(rnd()*5)]; att.cross=rnd()<0.2; att.nextDrive=game.time+3+rnd()*4; }
    if(!dif.human) dif.defPlay=scegliDifesa(dif,att);
    if(att.defPlay===3) att.fugaFino=game.time+5;                      // dalla zona a M si riparte subito in controfuga
    // 7 contro 6 nell'ultimo minuto: prima il time-out per prepararlo
    if(setteControSei(att)&&!att.setteAnnunciato){ att.setteAnnunciato=true; att.vuoleTimeout=true; showMsg(`<span style="font-size:26px">${att.name}: 7 contro 6 con il portiere in attacco</span>`,1.6); }
    if(att.human) att.nextDrive=game.time+6+rnd()*4;
  } else if(ball.afterShot){ game.shot=SHOT_RESET; }                  // art. 8.12a
  ball.afterShot=false;
  if(p.team!==teams[0]) autoSwitch(p);
}
export function reenter(p,keepPos){
  p.excluded=false;
  if(p.pf>=3) substitute(p);
  if(!keepPos){ p.x=ownGoalX(p.team)+p.team.dir*0.8; p.z=-HW+0.5; p.vx=p.vz=0; }
  p.lagX=p.x; p.lagZ=p.z;
}
export function substitute(p){   // terzo fallo personale: entra un cambio dalla panchina (art. 16.2)
  const t=p.team, g=riservaPer(p); t.subs++;
  p.pf=0; p.stamina=1;
  if(g) vesti(p,g);
}
export function cornerThrow(att){   // art. 13
  whistle(0.25); showMsg("Tiro d'angolo",1.1);
  const side=ball.z>=0?1:-1;
  ball.state='dead'; ball.vx=ball.vy=ball.vz=0; ball.y=BRV; ball.afterShot=false;
  deadBall(1.1,()=>{
    const wi = side*att.dir>0 ? 2 : 3;
    const w = att.players.find(q=>!q.excluded&&q.i===wi) || closestTo(att,ball);
    w.x=goalX(att)-att.dir*2; w.z=side*(HW-0.5); w.vx=w.vz=0;
    giveBall(w); game.possTeam=att; game.shot=SHOT_RESET;
  });
}
export function penalty(d,c){       // art. 10.2
  whistle(0.6); d.pf++; registraRigore(c.team);
  showMsg(`Rigore! <span style="font-size:22px;display:block">fallo di ${d.team.short} #${d.num} nei 6 metri</span>`,1.7);
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
  if(t.human){ setCtrl(s); showMsg('<span style="font-size:24px">Rigore: tieni premuto TIRO e rilascia</span>',1.6); }
}
export function sideOut(){        // art. 12: palla uscita lateralmente, tiro libero agli avversari di chi l'ha toccata per ultimo
  const t = ball.lastTeam ? other(ball.lastTeam) : teams[0], side=ball.z>=0?1:-1, x=clamp(ball.x,-HL+1,HL-1);
  whistle(0.22); showMsg(`Palla fuori<span style="font-size:20px;display:block">rimessa ${t.short}</span>`,0.9);
  ball.state='dead'; ball.holder=null; ball.vx=ball.vy=ball.vz=0; ball.x=x; ball.z=side*(HW-0.3); ball.y=BRV; ball.afterShot=false;
  deadBall(0.9,()=>{ const r=closestTo(t,ball)||t.players[6]; r.x=x; r.z=side*(HW-0.7); r.vx=r.vz=0; giveBall(r); r.freeThrow=true; });
}
export function areaFoul(q){      // art. 8.2.8: attaccante nell'area di porta davanti alla linea della palla
  const def=other(q.team);
  whistle(0.25); showMsg(`Fallo in attacco<span style="font-size:20px;display:block">${q.team.short} #${q.num} nell'area di porta davanti alla palla</span>`,1.3);
  ball.state='dead'; ball.holder=null; ball.vx=ball.vy=ball.vz=0; ball.y=BRV;
  deadBall(1.1,()=>giveBall(def.players[0]));
}
export function timeout(t){       // art. 5: due time-out a squadra, solo in possesso di palla; si riparte da metà campo
  if(t.timeouts<=0||game.state!=='play'||game.penalty||game.possTeam!==t||!ball.holder||ball.holder.team!==t) return false;
  t.timeouts--; whistle(0.7); registraTimeout(t);
  showMsg(`Time-out ${t.name}<span style="font-size:20px;display:block">ne resta${t.timeouts===1?'':'no'} ${t.timeouts} · le squadre recuperano fiato</span>`,2.4);
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
    showMsg(`<span style="font-size:24px">Schema: ${ATK[t.atkPlay]}</span>`,0.8);
  } else if(i<4){ t.defPlay=i; showMsg(`<span style="font-size:24px">Difesa: ${DEFN[i]}</span>`,0.8); }
}
export function goalScored(t){
  t.score++; whistle(0.6); rumble(350,1); registraGol(t,ball);
  // parziale: tre gol subiti di fila fanno chiamare il time-out all'allenatore del computer
  { const sub=other(t); t.parzialeSubito=0; sub.parzialeSubito=(sub.parzialeSubito||0)+1; if(sub.parzialeSubito>=3) sub.vuoleTimeout=true; }
  showMsg(`GOL! <span style="font-size:22px;display:block">${t.short} · #${ball.shooter.num} ${ball.shooter.name}</span>`,2.4);
  ball.state='dead';      // la palla prosegue fino in fondo alla rete (fisica.js)
  const conceding=other(t);
  deadBall(2.6,()=>{
    placeHalves();
    for(const p of allPlayers) if(p.excluded) reenter(p);        // art. 9.3b
    const r=conceding.players[6]; r.x=-conceding.dir*0.4; r.z=0;
    giveBall(r); game.possTeam=conceding; game.shot=SHOT_CLOCK;
    showMsg('Ripresa dal centro',1);
    deadBall(1.2,null);
  });
}
export function goalThrow(defTeam,text){
  whistle(0.25); showMsg(text||'Rimessa dal portiere',1);
  ball.state='dead'; ball.vx=ball.vy=ball.vz=0; ball.y=BRV; ball.x=clamp(ball.x,-HL-0.5,HL+0.5);
  deadBall(1.0,()=>{ giveBall(defTeam.players[0]); });
}
export function exclude(d){
  whistle(0.5); d.pf++; rumble(220,0.8); registraEspulsione(d);
  // tre espulsioni subite in due minuti: time-out per ridare calma e attenzione in marcatura
  { const T=d.team; T.espulsioniT=(T.espulsioniT||[]).filter(x=>game.time-x<120); T.espulsioniT.push(game.time); if(T.espulsioniT.length>=3){ T.vuoleTimeout=true; T.espulsioniT=[]; } }
  d.excluded=true; d.exclUntil=game.time+EXCL_TIME; d.vx=d.vz=0; d.charging=false; d.cut=null;
  d.x=ownGoalX(d.team)+d.team.dir*0.6; d.z=-HW-1.0;
  showMsg(`Espulsione! <span style="font-size:22px;display:block">${d.team.short} #${d.num} ${d.name} — ${EXCL_TIME}" · ${d.pf}° fallo grave${d.pf>=3?' (definitiva)':''}</span>`,1.9);
  game.shot=Math.max(game.shot,SHOT_RESET);                           // art. 8.12c
  if(d.team.doubleP===d) d.team.doubleP=null;
  if(ctrl===d) autoSwitch(ball.holder||ball);
}
export function foul(d,c){     // fallo semplice: il gioco si ferma e l'attacco batte il tiro libero (artt. 8, 11)
  whistle(0.22); rumble(120,0.5); registraFallo(d.team);
  d.stunUntil=game.time+0.9;
  const dx=d.x-c.x, dz=d.z-c.z, l=Math.hypot(dx,dz)||1; d.x+=dx/l*0.9; d.z+=dz/l*0.9; d.vx=d.vz=0;
  c.act=null; c.charging=false; c.chargeT=0; c.freeThrow=true; c.decideT=0.25;
  showMsg(`Fallo di ${d.team.short} #${d.num}<span style="font-size:20px;display:block">tiro libero ${c.team.short}</span>`,0.9);
  deadBall(0.8,null);
}
export function tackle(d,c,o){
  o=o||{};
  if(d.tackleCD>0||d.excluded||game.time<d.stunUntil) return false;
  const press=d.team.defPlay===2;
  d.tackleCD = d===ctrl ? 0.35 : 0.9+rnd()*0.8;
  if(dist(d,c)>(o.force?1.35:1.15)) return false;
  const dG=Math.hypot(ownGoalX(d.team)-c.x,c.z), lineD=Math.abs(ownGoalX(d.team)-c.x);
  const skill = d.st.def*(d.team.human?1:DIFF());
  const pSteal = clamp(0.45*(0.1+0.2*skill-0.06*c.st.pas)*(press?1.15+0.4*(d.s.dif-40)/59:1)*(o.stealMul||1),0.05,0.6);
  // Disciplina: chi ne ha poca commette più falli gravi (espulsione o rigore)
  const fDis=1.5-(d.s.dis-40)/59;
  const pPen = ((lineD<5&&Math.abs(c.z)<4)?0.11:0)*fDis*ARBITRO;
  const pExcl = (lineD<6?0.2:0.05)*(press?1.3+0.5*(fDis-0.5):1)*fDis*ARBITRO;
  const pFoul = 0.42;
  const r=rnd();
  if(r<pSteal){ registraPallaRubata(d.team); giveBall(d); showMsg(`Palla rubata! ${d.team.short} #${d.num}`,1); return true; }
  if(r<pSteal+pPen){ penalty(d,c); return true; }
  if(r<pSteal+pPen+pExcl){ exclude(d); return true; }
  if(o.force || r<pSteal+pPen+pExcl+pFoul){ foul(d,c); return true; }   // il contrasto del giocatore finisce sempre almeno in fallo
  return false;
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
  showMsg(`<span style="font-size:24px">${bit?'Finta riuscita!':'Finta'}</span>`,0.6);
}
