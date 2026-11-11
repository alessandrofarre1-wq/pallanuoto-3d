// ================= CICLO DI GIOCO =================
import { whistle } from './audio.js';
import { humanControl, updateCtrl } from './controllo.js';
import { DIFF, GW, MARK, PERIOD_LEN, clamp, dist, rnd } from './costanti.js';
import { movePlayer, separate, updateBall } from './fisica.js';
import { showMsg } from './hud.js';
import { pos01, rif01, aiCarrier, aiTarget, closestTo, manUp, startCut, steer } from './ia.js';
import { inp, pollInput, pressed, released } from './input.js';
import { fightOn, updateFight } from './lotta.js';
import { endMatch } from './menu.js';
import { areaFoul, callPlay, deadBall, giveBall, kickoff, reenter, tackle, timeout } from './regole.js';
import { allPlayers, ball, ctrl, game, goalX, other, setCtrl, teams } from './stato.js';
import { doShoot, startAct, updateActs } from './tiri.js';
export function update(dt){
  pollInput();
  if(pressed('cam')) game.camMode=1-game.camMode;
  if(game.state==='menu'||game.state==='paused'||game.state==='over') return;
  if(game.state==='countdown'){
    game.timer-=dt;
    const n=Math.ceil(game.timer);
    if(n>0) showMsg(`${game.period}° tempo<span style="font-size:60px;display:block">${n}</span>`,0.3);
    if(game.timer<=0){ game.state='play'; whistle(0.5); showMsg('Via!',0.7); }
    return;
  }
  if(game.state==='stop'){
    for(const p of allPlayers){ p.vx*=0.9; p.vz*=0.9; }
    if(ball.state==='dead') updateBall(dt);
    game.timer-=dt;
    if(game.timer<=0){ const f=game.after; game.after=null; game.state='play'; if(f) f(); }
    return;
  }
  // --- gioco attivo ---
  game.time+=dt;
  for(let i=0;i<4;i++) if(pressed('p'+(i+1))) callPlay(i);
  updateActs(dt);
  if(game.state!=='play') return;
  if(game.penalty){
    const s=game.penalty;
    if(ball.holder!==s) game.penalty=null;
    else {
      game.penT+=dt;
      for(const p of allPlayers) if(!p.excluded) movePlayer(p,0,0,false,dt);
      if(s.team.human){
        setCtrl(s);
        if(inp.shoot){ s.charging=true; s.chargeT+=dt; }
        if(!s.act&&((s.charging&&(released('shoot')||s.chargeT>1.4))||game.penT>7)){
          const pw=clamp(s.chargeT/0.9,0.5,1), az=Math.abs(inp.z)>0.3?inp.z:null;
          startAct(s,'shot',0,()=>doShoot(s,pw,false,az));
        }
      } else if(game.penT>1.3&&!s.act) startAct(s,'shot',0.3,()=>doShoot(s,0.8+rnd()*0.2,false,null));
      updateBall(dt);
      return;
    }
  }
  game.clock-=dt;
  if(game.possTeam && !ball.afterShot) game.shot-=dt;     // dopo un tiro respinto il cronometro riparte solo quando qualcuno riprende palla
  if(pressed('to')) { timeout(teams[0]); if(game.state!=='play') return; }
  // rientro espulsi
  for(const p of allPlayers) if(p.excluded && game.time>=p.exclUntil){ reenter(p); showMsg(`Rientra ${p.team.short} #${p.num}`,0.8); }
  // ritardo di reazione dei marcatori
  for(const p of allPlayers){
    if(p.excluded||game.time<p.stunUntil) continue;      // chi ha abboccato a una finta resta indietro
    const a=other(p.team).players[MARK[p.i]], k=Math.min(1,dt*(2+2*p.st.def*(p.team.human?1:DIFF()))*(p.team.defPlay===3?1.4:1));      // zona a M: scalate più rapide
    p.lagX+=(a.x-p.lagX)*k; p.lagZ+=(a.z-p.lagZ)*k;
  }
  // entrate (tagli) della squadra in attacco
  for(const t of teams){
    const h=ball.holder;
    // palla all'ala: il mezzo dello stesso lato (il "2") attacca lo spazio lasciato dal suo marcatore che si è abbassato
    if(game.possTeam===t&&h&&h.team===t&&(h.i===2||h.i===3)&&t.alaConPalla!==h){ t.alaConPalla=h; const m=t.players[h.i+2]; if(m!==ctrl&&!m.excluded&&!m.cut&&!manUp(t)) startCut(m); }
    if(h&&h.team===t&&h.i!==2&&h.i!==3) t.alaConPalla=null;
    if(game.possTeam!==t||!h||h.team!==t||h.isGK||t.atkPlay===3||manUp(t)) continue;
    if(Math.abs(goalX(t)-h.x)>10||game.time<t.nextDrive) continue;
    let b=null,bd=-1;
    for(const q of t.players){ if(q.i<4||q.excluded||q===h||q===ctrl||q.cut) continue; const d=dist(q,ball); if(d>bd){bd=d;b=q;} }
    if(b) startCut(b);
    t.nextDrive=game.time+(t.atkPlay===1?4.5:10+rnd()*5);
  }
  updateCtrl();
  for(const p of allPlayers){
    if(p.excluded) continue;
    p.tackleCD-=dt;
    if(p===ctrl){
      humanControl(p,dt);
      if(game.state!=='play') return;
      const h=ball.holder;
      if(p.lunge>game.time && h && h.team!==p.team){
        const dx=h.x-p.x, dz=h.z-p.z, d=Math.hypot(dx,dz)||1;
        if(d<=1.3){ p.lunge=0; tackle(p,h,{force:true}); if(game.state!=='play') return; }
        movePlayer(p,dx/d,dz/d,true,dt);
      } else { p.lunge=0; movePlayer(p,inp.x,inp.z,inp.sprint,dt); }
      continue;
    }
    let tg;
    if(ball.holder===p && !p.team.human){ aiCarrier(p,dt); tg=p.target; }
    else tg=aiTarget(p);
    if(ball.holder===p && p.team.human && p!==ctrl){ aiCarrier(p,dt); tg=p.target; }
    if(!tg){ movePlayer(p,0,0,false,dt); continue; }
    const dx=tg.x-p.x, dz=tg.z-p.z, d=Math.hypot(dx,dz);
    let mx=0,mz=0; if(d>0.12){ const s=Math.min(1,d/0.8); mx=dx/d*s; mz=dz/d*s; }
    if(d>1.0 && !tg.gk){ const st=steer(p,dx/d,dz/d,d); mx=st[0]; mz=st[1]; }
    const sprint = tg.gk ? false : ((tg.sprint && d>0.6) || (d>4 && p.stamina>0.35));
    if(tg.gk){ // spostamento laterale del portiere: di posizione (lento o svelto secondo Posizione) oppure in tuffo (Riflessi); stanco è più lento
      const fresco=0.75+0.25*p.stamina, sp=(tg.tuffo ? 1.6+2.2*rif01(p) : 1.1+1.3*pos01(p))*fresco; p.z+=clamp(tg.z-p.z,-sp*dt,sp*dt); mz=0;
    }
    movePlayer(p,mx,mz,sprint,dt);
    if(p.team.defPlay===2 && game.possTeam===other(p.team) && !p.isGK) p.stamina=Math.max(0,p.stamina-dt*0.012);  // il pressing stanca
    // pressing e contrasti dei difensori controllati dall'IA
    if(ball.holder && ball.holder.team!==p.team && !p.isGK && !ball.holder.isGK){
      if(fightOn(p,ball.holder)) continue;
      const marking = other(p.team).players[MARK[p.i]]===ball.holder;
      if((marking||dist(p,ball.holder)<0.9) && dist(p,ball.holder)<1.0 && rnd()<dt*1.6*(p.team.defPlay===2?1.8:1)) tackle(p,ball.holder);
      if(game.state!=='play') return;
    }
  }
  separate();
  updateFight(dt);
  if(game.state!=='play') return;
  // area di porta (art. 8.2.8): dalla linea di porta ai 2 metri, fino a 2 m oltre ciascun palo. La regola vale SOLO qui dentro:
  // un'ala fuori dall'area ma dentro i 2 metri può ricevere e tirare.
  for(const t of teams){
    if(game.possTeam!==t) continue;
    const gx=goalX(t), bd=Math.abs(gx-ball.x);
    for(const q of t.players){
      const qd=Math.abs(gx-q.x);
      if(q.excluded||q.isGK||ball.holder===q||ball.state==='flight'||!(qd<2&&Math.abs(q.z)<GW+2&&qd<bd-0.3)){ q.areaT=0; continue; }
      if(q!==ctrl){ q.x=gx-t.dir*2.05; q.areaT=0; continue; }      // i compagni gestiti dal computer ne restano fuori
      q.areaT=(q.areaT||0)+dt;
      if(q.areaT>1.2){ q.areaT=0; areaFoul(q); return; }
    }
  }
  // palla tenuta: segue il giocatore
  updateBall(dt);
  if(game.state!=='play') return;
  // tempo per l'azione
  if(game.possTeam && game.shot<=0 && ball.state==='held'){
    const opp=other(game.possTeam); whistle(0.4); showMsg('Tempo d\'azione scaduto',1.2);
    const r=closestTo(opp,ball,false); ball.state='dead';
    deadBall(1.0,()=>giveBall(r));
  } else if(game.possTeam && game.shot<=0 && ball.state!=='flight'){
    game.shot=0;
  }
  // fine tempo
  if(game.clock<=0 && game.state==='play'){
    game.clock=0; whistle(0.9);
    if(game.period<4){
      showMsg(`Fine ${game.period}° tempo`,2.2);
      ball.state='dead';
      deadBall(2.5,()=>{ game.period++; game.clock=PERIOD_LEN; kickoff(); });
    } else endMatch();
  }
}
