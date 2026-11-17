// ================= CONTROLLO UMANO =================
import { MARK, dist } from './costanti.js';
import { annuncia } from './cronaca.js';
import { closestTo, pallaVagante, startCut } from './ia.js';
import { inp, inputEpoch, pressed, released } from './input.js';
import { fightOn, girata } from './lotta.js';
import { contrasto, doFake } from './regole.js';
import { aggiornaQte, tiroSpeciale } from './controfuga.js';
import { ball, ctrl, fight, game, goalX, ownGoalX, setCtrl, teams } from './stato.js';
import { diSchiena, doPass, doShoot, humanPassTarget, shotKind, startAct } from './tiri.js';
export let tapT=-9, pendingQuick=null;
// v0.55 (scelta di Ale): tocco su TIRO (meno di TOCCO_FINTA secondi) = finta; tenuto fino a TIRO_POLSO = tiro di polso; più a lungo = tiro caricato
export const TOCCO_FINTA=0.16, TIRO_POLSO=0.36;
// Una sola intenzione negli ultimi 200 ms del gesto: non si accodano tiri speciali o cariche.
let intenzione=null;
let desktopShot=null, desktopPass=null;
function annullaTiroDesktop(){
  if(desktopShot){
    const p=desktopShot.p;
    if(p.act===desktopShot.act) p.act=null;
    p.charging=false; p.chargeT=0;
  }
  desktopShot=null;
}
export function resetTap(){ tapT=-9; pendingQuick=null; intenzione=null; annullaTiroDesktop(); desktopPass=null; }
function verificaIntenzione(){
  if(intenzione && (game.state!=='play'||game.penalty||ctrl!==intenzione.p||ball.holder!==intenzione.p||
    game.possT!==intenzione.possT||intenzione.p.act!==intenzione.act||inputEpoch!==intenzione.epoch||game.time>intenzione.fino)) intenzione=null;
  const valida=c=>game.state==='play'&&!game.penalty&&ctrl===c.p&&ball.holder===c.p&&game.possT===c.possT&&inputEpoch===c.epoch;
  if(desktopShot&&!valida(desktopShot)) annullaTiroDesktop();
  if(desktopPass&&!valida(desktopPass)) desktopPass=null;
}
export function autoSwitch(pt){
  const c=closestTo(teams[0],pt);
  if(c) setCtrl(c);
}
// CAMBIA: il controllo passa sempre al compagno più vicino alla palla, escluso quello già controllato, il portiere e chi è
// fuori dal gioco (espulso). Si gestisce qui, a ogni fotogramma, così funziona anche se il giocatore controllato sta facendo
// un gesto o è rimasto indietro dopo una finta. A parità di distanza vince il più vicino alla propria porta.
// Dopo un cambio a mano il cambio automatico sulla palla vagante aspetta 1,5 s, altrimenti annullerebbe la scelta.
let cambioManualeT=-9;
export const ultimoCambioManuale=()=>cambioManualeT;     // per il pannello del giocatore (hud.js)
export function piuVicinoAllaPalla(t,escluso){
  let best=null,bd=1e9;
  for(const m of t.players){ if(m===escluso||m.excluded||m.isGK||m.uscendo) continue; const d=dist(m,ball);
    if(d<bd-1e-6||(Math.abs(d-bd)<=1e-6&&best&&Math.abs(m.x-ownGoalX(t))<Math.abs(best.x-ownGoalX(t)))){ bd=d; best=m; } }
  return best;
}
export function updateCtrl(){
  verificaIntenzione();
  if(game.autoplay) return;
  const ht=teams[0];
  if(ball.holder&&ball.holder.team===ht){ setCtrl(ball.holder); return; }
  if(pressed('sw')){ const best=piuVicinoAllaPalla(ht,ctrl); if(best){ setCtrl(best); cambioManualeT=game.time; return; } }
  if(ctrl.excluded) autoSwitch(ball);
  if(ball.state==='free'&&game.time-cambioManualeT>1.5&&ctrl!==closestTo(ht,ball)&&dist(ctrl,ball)>3) autoSwitch(ball);
}
export function humanControl(p,dt){
  const hasBall = ball.holder===p;
  verificaIntenzione();
  let passa=pressed('pass'), lob=pressed('lob'), ix=inp.x, iz=inp.z;
  if(pressed('desktopPass')&&hasBall&&!p.excluded&&game.state==='play'&&!game.penalty) desktopPass={p,possT:game.possT,epoch:inputEpoch};
  if(released('desktopPass')&&desktopPass?.p===p){ passa=true; desktopPass=null; }
  p.cut=null;
  const ftDesktop=p.freeThrow&&Math.abs(goalX(p.team)-p.x)<6;
  const tiroDesktopLecito=hasBall&&p===ctrl&&game.state==='play'&&!game.penalty&&!p.excluded&&!p.isGK&&!ftDesktop&&!(p.pressatoUntil>game.time);
  if(pressed('desktopShoot')){
    if(tiroDesktopLecito&&(!p.act||p.act.done)){
      desktopShot={p,possT:game.possT,epoch:inputEpoch,prossimaFinta:game.time+0.18,act:null};
      p.charging=true; p.chargeT=0; p.mira0=0;
    } else if(hasBall&&ftDesktop) annuncia('avviso','Tiro libero dentro i 6 metri',{dettaglio:'devi passare o uscire oltre i 6',durata:1.6});
    else if(hasBall&&p.pressatoUntil>game.time) annuncia('avviso','Sotto pressione',{dettaglio:'proteggi la palla o passa',durata:0.9});
  }
  if(desktopShot){
    if(!tiroDesktopLecito||passa||lob||pressed('cmd')||(!inp.desktopShoot&&!released('desktopShoot'))) annullaTiroDesktop();
    else {
      // La carica continua anche durante le finte, ma non produce mai un tiro da sola.
      p.charging=true; p.chargeT=Math.min(0.9,p.chargeT+(inp.desktopShoot?dt:0));
      const aimZ=Math.abs(iz)>0.3?iz:null;
      if(released('desktopShoot')){
        if(p.act===desktopShot.act) p.act=null;
        const fintaFatta=!!desktopShot.act; desktopShot=null; p.voloPronto=false; pendingQuick=null;
        // v0.55: anche con Spazio un tocco breve è una finta
        if(!fintaFatta&&p.chargeT<TOCCO_FINTA){ p.charging=false; p.chargeT=0; startAct(p,'fake',0.06,()=>doFake(p)); p.fintaFino=game.time+1.2; return; }
        const pw=Math.max(0.35,Math.min(1,p.chargeT/0.9));
        p.chargeT=pw*0.9;
        startAct(p,shotKind(p),0,()=>doShoot(p,pw,false,aimZ)); return;
      }
      if(inp.desktopShoot&&game.time>=desktopShot.prossimaFinta&&(!p.act||p.act.done)){
        const carica=p.chargeT;
        startAct(p,'fake',0,()=>{ if(desktopShot?.p===p&&desktopShot.epoch===inputEpoch&&inp.desktopShoot) doFake(p); });
        desktopShot.act=p.act; desktopShot.prossimaFinta=game.time+0.42;
        p.charging=true; p.chargeT=carica;
      }
      return;
    }
  }
  if(p.act&&!p.act.done){
    const resto=p.act.wind+p.act.frusta-p.act.t;
    const lobLecito=!p.isGK&&!(p.freeThrow&&Math.abs(goalX(p.team)-p.x)<6)&&!(p.pressatoUntil>game.time);
    if(hasBall&&p===ctrl&&game.state==='play'&&!game.penalty&&resto<=0.2&&resto>0 && (passa||(lob&&lobLecito))){
      intenzione={p,act:p.act,possT:game.possT,epoch:inputEpoch,kind:passa?'pass':'lob',x:ix,z:iz,fino:game.time+0.24};
    }
    return;
  }
  if(intenzione){
    const c=intenzione; intenzione=null;
    // Un comando nuovo sostituisce quello anticipato; altrimenti si usa la direzione del tocco.
    if(!passa&&!lob&&!pressed('legacyShoot')&&!pressed('desktopShoot')&&!pressed('cmd')){ passa=c.kind==='pass'; lob=c.kind==='lob'; ix=c.x; iz=c.z; }
  }
  if(pressed('cmd') && hasBall && fightOn(p,fight.def) && fight.boa===p && !(p.turnedUntil>game.time)){ girata(p,fight.def); return; }
  if(pressed('cmd')){
    if(hasBall){ const m=humanPassTarget(p,inp.x,inp.z); if(m&&!m.isGK){ startCut(m); annuncia('avviso','Taglio',{p:m}); } }
    else if(ball.holder&&ball.holder.team!==p.team){
      let b=null,bd=1e9;
      for(const m of p.team.players){ if(m===p||m.excluded||m.isGK||MARK[m.i]===ball.holder.i) continue; const d=dist(m,ball.holder); if(d<bd){bd=d;b=m;} }
      if(b){ p.team.doubleP=b; p.team.doubleUntil=game.time+3.5; annuncia('avviso','Raddoppio!'); }
    }
  }
  if(hasBall){
    const aimZ=Math.abs(iz)>0.3?iz:null;
    const ftBlock = p.freeThrow && Math.abs(goalX(p.team)-p.x)<6;
    if(passa){ pendingQuick=null; const m=humanPassTarget(p,ix,iz); if(m) startAct(p,'pass',0.05,()=>doPass(p,m),[m.x,m.z]); return; }
    if(ftBlock && (lob||pressed('legacyShoot'))){ annuncia('avviso','Tiro libero dentro i 6 metri',{dettaglio:'devi passare o uscire oltre i 6',durata:1.6}); return; }
    if(ftBlock){ p.charging=false; p.chargeT=0; pendingQuick=null; }
    // sotto pressione non si tira: si passa o ci si allontana proteggendo la palla
    if(p.pressatoUntil>game.time && !p.isGK){ p.charging=false; p.chargeT=0; p.voloPronto=false; pendingQuick=null;
      if(pressed('legacyShoot')||lob) annuncia('avviso','Sotto pressione',{dettaglio:'proteggi la palla o passa',durata:0.9});
      return; }
    // controfuga: tasto a comparsa per lo schizzo o il colonnello (controfuga.js)
    const qte=aggiornaQte(p);
    if(qte && pressed('legacyShoot')){ pendingQuick=null; p.charging=false; p.chargeT=0; tiroSpeciale(p,qte.tipo,aimZ); return; }
    if(lob&&!p.isGK){ pendingQuick=null; startAct(p,'lob',0.12,()=>doShoot(p,0.4,true,aimZ)); return; }
    // tiro al volo: TIRO tenuto premuto mentre il passaggio era in volo → si tira appena arriva la palla
    if(p.voloPronto && ball.holdTime<0.2 && !p.isGK && !ftBlock){ p.voloPronto=false; p.voloTocco=-9; p.charging=false; p.chargeT=0; startAct(p,'shot',0.03,()=>doShoot(p,0.62,false,aimZ,{volo:true})); return; }
    p.voloPronto=false;
    if(inp.legacyShoot&&!p.isGK){ if(!p.charging) p.mira0=0; p.charging=true; p.chargeT=Math.min(0.9,p.chargeT+dt); if(!p.mira0&&aimZ!=null) p.mira0=Math.sign(aimZ); }
    if(p.charging&&released('legacyShoot')){
      if(p.chargeT<TOCCO_FINTA){
        // v0.55 (scelta di Ale): un tocco breve su TIRO è una FINTA, ripetibile; per tirare si tiene premuto e si lascia
        p.charging=false; p.chargeT=0; tapT=game.time;
        startAct(p,'fake',0.06,()=>doFake(p)); p.fintaFino=game.time+1.2; return;
      }
      if(p.chargeT<TIRO_POLSO){
        // tenuto poco: tiro di polso, subito (dopo una finta il polso sorprende di più)
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
    p.qte=null;
    p.charging=false; p.chargeT=0; pendingQuick=null;
    // tiro al volo: basta TENERE o anche solo TOCCARE TIRO mentre arriva il passaggio (v0.55, telefono e controller;
    // con la tastiera resta la regola v0.45: Spazio tenuto prima della ricezione non tira da solo)
    const inArrivo=ball.state==='flight' && ball.kind==='pass' && ball.target===p;
    if(inArrivo&&pressed('legacyShoot')) p.voloTocco=game.time;
    p.voloPronto = inArrivo && (inp.legacyShoot || game.time-(p.voloTocco||-9)<1.5);
    const h=ball.holder;
    const contrasta=pressed('pass')||pressed('desktopPass');
    if(contrasta && h && fightOn(p,h)){ p.aggrT=game.time+0.8; annuncia('avviso','Trattieni il centroboa…',{durata:0.7}); }
    else {
      // CONTRASTO a tre livelli (vedi contrasto in regole.js): 1-2 pressioni = disturbo, la terza ravvicinata = fallo
      if(contrasta && h && h.team!==p.team && !h.isGK){
        const d=dist(p,h);
        if(d<=1.35) contrasto(p,h);
        else if(d<3.5){ p.lunge=game.time+1.3; }      // slancio verso il portatore: il disturbo parte appena arriva
        else annuncia('avviso','Troppo lontano',{durata:0.7});
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
