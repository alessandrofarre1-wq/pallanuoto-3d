// ================= CONTROLLO UMANO =================
import { MARK, dist } from './costanti.js';
import { showMsg } from './hud.js';
import { closestTo, startCut } from './ia.js';
import { inp, pressed, released } from './input.js';
import { fightOn, girata } from './lotta.js';
import { doFake, tackle } from './regole.js';
import { ball, ctrl, fight, game, goalX, setCtrl, teams } from './stato.js';
import { doPass, doShoot, humanPassTarget, shotKind, startAct } from './tiri.js';
export let tapT=-9, pendingQuick=null;   // doppio tocco = finta, tocco singolo = tiro rapido
export function resetTap(){ tapT=-9; pendingQuick=null; }
export function autoSwitch(pt){
  const c=closestTo(teams[0],pt);
  if(c) setCtrl(c);
}
export function updateCtrl(){
  const ht=teams[0];
  if(ball.holder&&ball.holder.team===ht){ setCtrl(ball.holder); return; }
  if(ctrl.excluded) autoSwitch(ball);
  if(ball.state==='free'&&ctrl!==closestTo(ht,ball)&&dist(ctrl,ball)>3) autoSwitch(ball);
}
export function humanControl(p,dt){
  const hasBall = ball.holder===p;
  p.cut=null;
  if(p.act&&!p.act.done) return;
  if(pressed('cmd') && hasBall && fightOn(p,fight.def) && fight.boa===p && !(p.turnedUntil>game.time)){ girata(p,fight.def); return; }
  if(pressed('cmd')){
    if(hasBall){ const m=humanPassTarget(p,inp.x,inp.z); if(m&&!m.isGK){ startCut(m); showMsg(`<span style="font-size:24px">Taglio di #${m.num} ${m.name}</span>`,0.7); } }
    else if(ball.holder&&ball.holder.team!==p.team){
      let b=null,bd=1e9;
      for(const m of p.team.players){ if(m===p||m.excluded||m.isGK||MARK[m.i]===ball.holder.i) continue; const d=dist(m,ball.holder); if(d<bd){bd=d;b=m;} }
      if(b){ p.team.doubleP=b; p.team.doubleUntil=game.time+3.5; showMsg('<span style="font-size:24px">Raddoppio!</span>',0.6); }
    }
  }
  if(pressed('sw') && !hasBall){
    let best=null,bd=1e9;
    for(const m of p.team.players){ if(m===p||m.excluded||m.isGK) continue; const d=dist(m,ball); if(d<bd){bd=d;best=m;} }
    if(best){ setCtrl(best); return; }
  }
  if(hasBall){
    const aimZ=Math.abs(inp.z)>0.3?inp.z:null;
    const ftBlock = p.freeThrow && Math.abs(goalX(p.team)-p.x)<6;
    if(pressed('pass')){ pendingQuick=null; const m=humanPassTarget(p,inp.x,inp.z); if(m) startAct(p,'pass',0.05,()=>doPass(p,m),[m.x,m.z]); return; }
    if(ftBlock && (pressed('lob')||pressed('shoot'))){ showMsg('<span style="font-size:22px">Tiro libero dentro i 6 metri: devi passare o uscire oltre i 6</span>',1.2); return; }
    if(ftBlock){ p.charging=false; p.chargeT=0; pendingQuick=null; }
    if(pressed('lob')&&!p.isGK){ pendingQuick=null; startAct(p,'lob',0.12,()=>doShoot(p,0.4,true,aimZ)); return; }
    if(inp.shoot&&!p.isGK){ p.charging=true; p.chargeT+=dt; }
    if(p.charging&&(released('shoot')||p.chargeT>1.4)){
      if(p.chargeT<0.2){
        // tocco breve: se è il secondo in rapida successione è una finta, altrimenti un tiro rapido (dopo un attimo)
        p.charging=false; p.chargeT=0;
        if(game.time-tapT<0.32){ tapT=-9; pendingQuick=null; startAct(p,'fake',0.12,()=>doFake(p)); return; }
        tapT=game.time; pendingQuick={aimZ};
      } else {
        const pw=Math.min(1,p.chargeT/0.9), kind=shotKind(p);
        pendingQuick=null; startAct(p,kind,0,()=>doShoot(p,pw,false,aimZ)); return;
      }
    }
    if(pendingQuick && !inp.shoot && game.time-tapT>=0.32){
      const az=pendingQuick.aimZ; pendingQuick=null;
      startAct(p,shotKind(p),0.1,()=>doShoot(p,0.25,false,az)); return;
    }
  } else {
    p.charging=false; p.chargeT=0; pendingQuick=null;
    const h=ball.holder;
    if(pressed('pass') && h && fightOn(p,h)){ p.aggrT=game.time+0.8; showMsg('<span style="font-size:22px">Trattieni il centroboa…</span>',0.4); }
    else if(pressed('pass') && h && h.team!==p.team && !h.isGK){
      const d=dist(p,h);
      if(d<=1.35){ if(!tackle(p,h,{force:true})) showMsg('<span style="font-size:22px">Contrasto: aspetta un attimo</span>',0.4); }
      else if(d<3.5){ p.lunge=game.time+1.3; }      // slancio verso il portatore, il contrasto parte appena arriva
      else showMsg('Troppo lontano',0.5);
    }
  }
}
