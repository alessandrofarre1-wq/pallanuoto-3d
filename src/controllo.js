// ================= CONTROLLO UMANO =================
import { MARK, dist } from './costanti.js';
import { annuncia } from './cronaca.js';
import { closestTo, pallaVagante, startCut } from './ia.js';
import { inp, inputEpoch, pressed, released } from './input.js';
import { fightOn, girata } from './lotta.js';
import { contrasto, doFake } from './regole.js';
import { FINTA_RITMO, fintaDi } from './finte.js';
import { TIRO_COMANDO } from './tiro-comando.js';
import { aggiornaQte, occasioneControfuga, tiroSpeciale } from './controfuga.js';
import { ball, ctrl, fight, game, goalX, ownGoalX, setCtrl, teams } from './stato.js';
import { diSchiena, doPass, doShoot, humanPassTarget, shotKind, startAct } from './tiri.js';
export let tapT=-9, pendingQuick=null;
// v0.75: il tocco tira di polso; tenere prepara e finta, lasciare tira.
export const TIRO_POLSO=TIRO_COMANDO.polso;
// Una sola intenzione negli ultimi 200 ms del gesto: non si accodano tiri speciali o cariche.
let intenzione=null;
let tiroTenuto=null, desktopPass=null;
function annullaTiroTenuto(){
  if(tiroTenuto){
    const p=tiroTenuto.p;
    if(p.act===tiroTenuto.act) p.act=null;
    p.charging=false; p.chargeT=0;
  }
  tiroTenuto=null;
}
export function resetTap(){ tapT=-9; pendingQuick=null; intenzione=null; annullaTiroTenuto(); desktopPass=null; }
const tiroLecito=p=>ball.holder===p&&ctrl===p&&game.state==='play'&&!game.penalty&&!p.excluded&&!p.isGK&&
  !(p.freeThrow&&Math.abs(goalX(p.team)-p.x)<6)&&!(p.pressatoUntil>game.time);
const tenutaValida=c=>tiroLecito(c.p)&&game.possT===c.possT&&inputEpoch===c.epoch&&c.p.num===c.numero&&c.p.scheda===c.scheda;
function verificaIntenzione(){
  if(intenzione && (game.state!=='play'||game.penalty||ctrl!==intenzione.p||ball.holder!==intenzione.p||
    game.possT!==intenzione.possT||intenzione.p.act!==intenzione.act||inputEpoch!==intenzione.epoch||game.time>intenzione.fino)) intenzione=null;
  if(tiroTenuto&&!tenutaValida(tiroTenuto)) annullaTiroTenuto();
  if(desktopPass&&!(game.state==='play'&&!game.penalty&&ctrl===desktopPass.p&&ball.holder===desktopPass.p&&
    game.possT===desktopPass.possT&&inputEpoch===desktopPass.epoch)) desktopPass=null;
}
// Restituisce true soltanto mentre possiede il gesto: un'altra azione non si
// interrompe per un vecchio rilascio. Finta e tiro condividono la stessa tenuta.
function aggiornaTiroTenuto(p,dt,passa,lob){
  if(pressed('shoot')&&tiroLecito(p)&&(!p.act||p.act.done)){
    tiroTenuto={p,possT:game.possT,epoch:inputEpoch,numero:p.num,scheda:p.scheda,
      prossimaFinta:game.time+TIRO_COMANDO.primaFinta,act:null};
    p.act=null;p.charging=true;p.chargeT=0;p.mira0=0;
  }
  if(!tiroTenuto)return false;
  if(tiroTenuto.p!==p)return false;
  if(!tenutaValida(tiroTenuto)||passa||lob||pressed('cmd')||(!inp.shoot&&!released('shoot'))){ annullaTiroTenuto();return false; }
  const c=tiroTenuto,aimZ=Math.abs(inp.z)>.3?inp.z:null;
  p.charging=true;p.chargeT=Math.min(TIRO_COMANDO.carica,p.chargeT+(inp.shoot?Math.max(0,dt):0));
  if(!p.mira0&&aimZ!==null)p.mira0=Math.sign(aimZ);
  if(released('shoot')){
    const carica=p.chargeT,kind=shotKind(p),dopoFinta=game.time<(p.fintaFino||0);
    if(p.act===c.act)p.act=null;
    tiroTenuto=null;p.voloPronto=false;pendingQuick=null;tapT=game.time;
    if(carica<TIRO_POLSO){
      // v0.81: un tocco durante il tasto a comparsa della controfuga vera fa lo schizzo o il colonnello
      const speciale=p.qte&&occasioneControfuga(p);
      if(speciale){ tiroSpeciale(p,speciale,aimZ); return true; }
      // Il polso rimane utile vicino alla porta: meno potenza, stessa mira.
      const pw=.42;p.chargeT=pw*TIRO_COMANDO.carica;
      startAct(p,diSchiena(kind)?kind:'polso',.04,()=>doShoot(p,pw,false,aimZ,{polso:true,dopoFinta}));
    }else{
      const pw=Math.min(1,carica/TIRO_COMANDO.carica);
      const torsione=kind==='shot'&&((p.mira0&&aimZ!==null&&Math.sign(aimZ)!==p.mira0)||inp.sprint);
      startAct(p,torsione?'torsione':kind,0,()=>doShoot(p,pw,false,aimZ,{torsione}));
    }
    return true;
  }
  if(game.time>=c.prossimaFinta&&!p.act){
    const carica=p.chargeT,f=fintaDi(p);
    p.fintaLatoVoluto=Math.abs(inp.z)>.35?Math.sign(inp.z):0;
    startAct(p,'fake',f.wind,()=>{
      if(tiroTenuto===c&&tenutaValida(c)&&inp.shoot){
        doFake(p,{continua:true});if(ball.holder===p)p.fintaFino=game.time+1.2;
      }
    });
    // v0.85: la finta dopo parte a braccio tornato carico più FINTA_RITMO.attesa (prima 0,12 s), come per il computer
    c.act=p.act;c.prossimaFinta=game.time+Math.max(TIRO_COMANDO.pausaFinta,p.act.wind+p.act.frusta+p.act.recupero+FINTA_RITMO.attesa);
    p.charging=true;p.chargeT=carica;
  }
  return true;
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
  if(!ctrl){ autoSwitch(ball);if(!ctrl)return; }
  if(pressed('sw')){ const best=piuVicinoAllaPalla(ht,ctrl); if(best){ setCtrl(best); cambioManualeT=game.time; return; } }
  if(ctrl.excluded) autoSwitch(ball);
  if(!game.scattando&&ball.state==='free'&&game.time-cambioManualeT>1.5&&ctrl!==closestTo(ht,ball)&&dist(ctrl,ball)>3) autoSwitch(ball);
}
export function humanControl(p,dt){
  const hasBall = ball.holder===p;
  verificaIntenzione();
  let passa=pressed('pass'), lob=pressed('lob'), ix=inp.x, iz=inp.z;
  if(pressed('desktopPass')&&hasBall&&!p.excluded&&game.state==='play'&&!game.penalty) desktopPass={p,possT:game.possT,epoch:inputEpoch};
  if(released('desktopPass')&&desktopPass?.p===p){ passa=true; desktopPass=null; }
  // Il passaggio porta automaticamente il controllo al ricevente mentre la
  // palla è ancora in volo. Non cancellare in quel momento l'entrata chiamata:
  // la presa deve conservarne il contesto. Una direzione manuale prevale subito.
  const riceveTaglio=p.cut?.coordinata&&!hasBall&&ball.state==='flight'&&ball.kind==='pass'&&
    ball.target===p&&ball.shooter?.team===p.team&&Math.hypot(ix,iz)<.2;
  if(!riceveTaglio)p.cut=null;
  // v0.81 (Ale: «troppi tiri a schizzo e colonnello»): nella controfuga vera il tasto a comparsa resta, ma lo speciale parte solo con
  // un tocco di TIRO (al rilascio, in aggiornaTiroTenuto); tenendo premuto si prepara il tiro normale. Prima qualunque pressione di
  // TIRO durante il tasto faceva lo schizzo o il colonnello.
  if(hasBall&&tiroLecito(p)) aggiornaQte(p);
  if(aggiornaTiroTenuto(p,dt,passa,lob))return;
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
    // v0.79: si ricorda la levetta usata per mirare: se resta tenuta così, chi riceve va lo stesso incontro alla palla (aiutoGuida)
    if(passa){ pendingQuick=null; const m=humanPassTarget(p,ix,iz), mx=ix, mz=iz;
      if(m) startAct(p,'pass',0.05,()=>{ doPass(p,m); if(ball.state==='flight'&&ball.kind==='pass'&&ball.target===m&&Math.hypot(mx,mz)>=0.3) ball.levettaMira={x:mx,z:mz}; },[m.x,m.z]); return; }
    if(ftBlock && (lob||pressed('shoot'))){ annuncia('avviso','Tiro libero dentro i 6 metri',{dettaglio:'devi passare o uscire oltre i 6',durata:1.6}); return; }
    if(ftBlock){ p.charging=false; p.chargeT=0; pendingQuick=null; }
    // sotto pressione non si tira: si passa o ci si allontana proteggendo la palla
    if(p.pressatoUntil>game.time && !p.isGK){ p.charging=false; p.chargeT=0; p.voloPronto=false; pendingQuick=null;
      if(pressed('shoot')||lob) annuncia('avviso','Sotto pressione',{dettaglio:'proteggi la palla o passa',durata:0.9});
      return; }
    if(lob&&!p.isGK){ pendingQuick=null; startAct(p,'lob',0.12,()=>doShoot(p,0.4,true,aimZ)); return; }
    // tiro al volo: TIRO tenuto premuto mentre il passaggio era in volo → si tira appena arriva la palla
    if(p.voloPronto && ball.holdTime<0.2 && !p.isGK && !ftBlock){ p.voloPronto=false; p.voloTocco=-9; p.charging=false; p.chargeT=0; startAct(p,shotKind(p),0.03,()=>doShoot(p,0.62,false,aimZ,{volo:true})); return; }
    p.voloPronto=false;

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
  const m=Math.hypot(ix,iz);
  // PASSAGGIO IN ARRIVO E LEVETTA FERMA (v0.57): il ricevente va da solo incontro alla palla, sul punto della sua traiettoria più
  // vicino a lui (con la presa alla mano della v0.56 chi restava fermo se la lasciava sfuggire). v0.79: vale anche con la levetta
  // ancora tenuta nella direzione usata per mirare il passaggio (il comando passa subito a chi riceve: prima nuotava via dalla palla)
  const mira=ball.levettaMira, ml=mira?Math.hypot(mira.x,mira.z):0;
  const comeFerma=m<0.3||(ml>0&&ball.target===p&&(ix*mira.x+iz*mira.z)/(m*ml)>0.82);
  if(comeFerma&&ball.state==='flight'&&ball.kind==='pass'&&ball.target===p){
    const vx=ball.vx, vz=ball.vz, v2=vx*vx+vz*vz||1, u=Math.max(0,((p.x-ball.x)*vx+(p.z-ball.z)*vz)/v2);
    const dx=ball.x+vx*u-p.x, dz=ball.z+vz*u-p.z, d=Math.hypot(dx,dz);
    if(d>0.2){ const k=Math.min(1,d/0.6); _g[0]=dx/d*k; _g[1]=dz/d*k; } else { _g[0]=_g[1]=0; }
    return _g;
  }
  // v0.79: il passaggio morbido arrivato sull'acqua appena fuori portata: chi doveva riceverlo va a prenderlo
  if(comeFerma&&ball.state==='free'&&ball.kind==='pass'&&ball.target===p&&ball.shooter&&ball.shooter.team===p.team&&dist(p,ball)<2.5){
    const dx=ball.x-p.x, dz=ball.z-p.z, d=Math.hypot(dx,dz);
    if(d>0.2){ const k=Math.min(1,d/0.6); _g[0]=dx/d*k; _g[1]=dz/d*k; } else { _g[0]=_g[1]=0; }
    return _g;
  }
  if(m<0.3||ball.holder===p) return _g;
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
