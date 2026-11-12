// ================= CONTROLLO UMANO =================
import { MARK, dist } from './costanti.js';
import { annuncia } from './cronaca.js';
import { closestTo, pallaVagante, startCut } from './ia.js';
import { inp, pressed, released } from './input.js';
import { fightOn, girata } from './lotta.js';
import { doFake, tackle } from './regole.js';
import { ball, ctrl, fight, game, goalX, setCtrl, teams } from './stato.js';
import { diSchiena, doPass, doShoot, humanPassTarget, shotKind, startAct } from './tiri.js';
export let tapT=-9, pendingQuick=null;   // doppio tocco = finta, tocco singolo = tiro rapido
export function resetTap(){ tapT=-9; pendingQuick=null; }
export function autoSwitch(pt){
  const c=closestTo(teams[0],pt);
  if(c) setCtrl(c);
}
export function updateCtrl(){
  if(game.autoplay) return;
  const ht=teams[0];
  if(ball.holder&&ball.holder.team===ht){ setCtrl(ball.holder); return; }
  if(ctrl.excluded) autoSwitch(ball);
  if(ball.state==='free'&&ctrl!==closestTo(ht,ball)&&dist(ctrl,ball)>3) autoSwitch(ball);
}
export function humanControl(p,dt){
  const hasBall = ball.holder===p;
  p.cut=null;
  // secondo tocco rapido mentre parte il tiro di polso: il tiro diventa una finta (il braccio si ferma)
  if(hasBall && pressed('shoot') && p.act && p.act.kind==='polso' && !p.act.done && game.time-tapT<0.3){
    p.act.kind='fake'; p.act.frusta=0.09; p.act.fn=()=>doFake(p); p.fintaFino=game.time+1.0; tapT=-9; return;
  }
  if(p.act&&!p.act.done) return;
  if(pressed('cmd') && hasBall && fightOn(p,fight.def) && fight.boa===p && !(p.turnedUntil>game.time)){ girata(p,fight.def); return; }
  if(pressed('cmd')){
    if(hasBall){ const m=humanPassTarget(p,inp.x,inp.z); if(m&&!m.isGK){ startCut(m); annuncia('avviso','Taglio',{p:m}); } }
    else if(ball.holder&&ball.holder.team!==p.team){
      let b=null,bd=1e9;
      for(const m of p.team.players){ if(m===p||m.excluded||m.isGK||MARK[m.i]===ball.holder.i) continue; const d=dist(m,ball.holder); if(d<bd){bd=d;b=m;} }
      if(b){ p.team.doubleP=b; p.team.doubleUntil=game.time+3.5; annuncia('avviso','Raddoppio!'); }
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
    if(ftBlock && (pressed('lob')||pressed('shoot'))){ annuncia('avviso','Tiro libero dentro i 6 metri',{dettaglio:'devi passare o uscire oltre i 6',durata:1.6}); return; }
    if(ftBlock){ p.charging=false; p.chargeT=0; pendingQuick=null; }
    if(pressed('lob')&&!p.isGK){ pendingQuick=null; startAct(p,'lob',0.12,()=>doShoot(p,0.4,true,aimZ)); return; }
    // tiro al volo: TIRO tenuto premuto mentre il passaggio era in volo → si tira appena arriva la palla
    if(p.voloPronto && inp.shoot && ball.holdTime<0.2 && !p.isGK && !ftBlock){ p.voloPronto=false; p.charging=false; p.chargeT=0; startAct(p,'shot',0.03,()=>doShoot(p,0.62,false,aimZ,{volo:true})); return; }
    p.voloPronto=false;
    if(inp.shoot&&!p.isGK){ if(!p.charging) p.mira0=0; p.charging=true; p.chargeT+=dt; if(!p.mira0&&aimZ!=null) p.mira0=Math.sign(aimZ); }
    if(p.charging&&(released('shoot')||p.chargeT>1.4)){
      if(p.chargeT<0.2){
        // tocco breve: tiro di polso, subito (un secondo tocco rapido lo trasforma in finta; dopo una finta il polso sorprende di più)
        p.charging=false; p.chargeT=0; tapT=game.time;
        const dopoFinta=game.time<(p.fintaFino||0);
        startAct(p,diSchiena(shotKind(p))?shotKind(p):'polso',0.04,()=>doShoot(p,0.42,false,aimZ,{polso:true,dopoFinta})); return;
      } else {
        // torsione: caricare con la levetta verso un palo e rilasciare verso l'altro (oppure rilasciare tenendo SPRINT):
        // il busto fa pensare al primo palo, il polso chiude in diagonale
        const pw=Math.min(1,p.chargeT/0.9), kind=shotKind(p);
        const torsione=kind==='shot' && ((p.mira0&&aimZ!=null&&Math.sign(aimZ)!==p.mira0) || inp.sprint);
        startAct(p,torsione?'torsione':kind,0,()=>doShoot(p,pw,false,aimZ,{torsione})); return;
      }
    }
  } else {
    p.charging=false; p.chargeT=0; pendingQuick=null;
    p.voloPronto = inp.shoot && ball.state==='flight' && ball.kind==='pass' && ball.target===p;
    const h=ball.holder;
    if(pressed('pass') && h && fightOn(p,h)){ p.aggrT=game.time+0.8; annuncia('avviso','Trattieni il centroboa…',{durata:0.7}); }
    else {
      // CONTRASTO: un tocco = provare a rubare palla; tenuto premuto (un terzo di secondo) = fallo voluto per fermare l'azione
      if(pressed('pass')) p.contrDa=game.time;
      if(p.contrDa!=null){
        const tenuto=inp.pass && game.time-p.contrDa>=0.33;
        if(tenuto||released('pass')||!inp.pass){
          p.contrDa=null;
          if(h && h.team!==p.team && !h.isGK){
            const d=dist(p,h);
            if(d<=1.35){ if(tackle(p,h,{voluto:tenuto})===false) annuncia('avviso','Contrasto: aspetta un attimo',{durata:0.7}); }
            else if(d<3.5){ p.lunge=game.time+1.3; p.lungeVoluto=tenuto; }      // slancio verso il portatore, il contrasto parte appena arriva
            else annuncia('avviso','Troppo lontano',{durata:0.7});
          }
        }
      }
    }
  }
}

// AIUTO ALLA GUIDA. Se si spinge più o meno verso la palla vagante (anche allo sprint iniziale: basta spingere in avanti), verso
// il portatore avversario quando si difende o verso il compagno che sta ricevendo, la direzione si aggiusta da sola verso di loro.
// Entro 18° la direzione diventa esatta, fino a 45° viene corretta in parte; oltre non si tocca nulla.
const _g=[0,0];
export function aiutoGuida(p,ix,iz){
  _g[0]=ix; _g[1]=iz;
  const m=Math.hypot(ix,iz); if(m<0.3||ball.holder===p) return _g;
  let tx=null, tz=0;
  const h=ball.holder;
  if(pallaVagante()){ const tt=Math.min(0.6,dist(p,ball)/3); tx=ball.x+ball.vx*tt; tz=ball.z+ball.vz*tt; }
  else if(ball.state==='flight'&&ball.kind==='pass'&&ball.target===p){ tx=ball.tx; tz=ball.tz; }
  else if(h&&h.team!==p.team&&!h.isGK&&dist(p,h)<7){ tx=h.x; tz=h.z; }
  if(tx===null) return _g;
  const dx=tx-p.x, dz=tz-p.z, d=Math.hypot(dx,dz); if(d<0.25) return _g;
  const cs=(ix*dx+iz*dz)/(m*d); if(cs<0.707) return _g;                      // oltre 45°: il giocatore vuole andare altrove
  const k=cs>0.951?1:(cs-0.707)/(0.951-0.707)*0.8;
  let ux=ix/m*(1-k)+dx/d*k, uz=iz/m*(1-k)+dz/d*k; const ul=Math.hypot(ux,uz)||1;
  _g[0]=ux/ul*m; _g[1]=uz/ul*m; return _g;
}
