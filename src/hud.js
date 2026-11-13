// ================= HUD: tabellone, schemi, giocatore controllato (le notifiche degli eventi sono in cronaca.js) =================
import { CHIAVE, STAT_NOMI } from './dati/rose.js';
import { dpr, renderer } from './grafica/scena.js';
import { ATK, DEFN } from './costanti.js';
import { bip } from './audio.js';
import { aggiorna as aggiornaCronaca } from './cronaca.js';
import { ctrl, fight, game, teams } from './stato.js';
import { iconaMano } from './mano.js';
import { disegnaCambi } from './panchinaVista.js';
export const $ = id => document.getElementById(id);
let tacKey='', schedaVista=null, ultimoBip=null;
const TOUCH='ontouchstart' in window || navigator.maxTouchPoints>0;
let schemiAperti=!TOUCH;
export function apriSchemi(v){ schemiAperti = v===undefined ? !schemiAperti : (TOUCH ? v : true); }
export function aggiornaTabellone(){
  // ogni squadra: colore della calottina (pallino a forma di cuffia e filo sotto la sigla), sigla sempre scritta, e il segno
  // «tu» sulla squadra comandata: le squadre si distinguono anche senza guardare il colore
  $('capA').style.background=teams[0].css; $('capB').style.background=teams[1].css;
  const [qa,qb]=document.querySelectorAll('#hud .sq');
  qa.style.setProperty('--col',teams[0].css); qb.style.setProperty('--col',teams[1].css);
  qa.classList.toggle('tu',!!teams[0].human); qb.classList.toggle('tu',!!teams[1].human);
  $('nameA').textContent=teams[0].short; $('nameB').textContent=teams[1].short; tacKey=''; schedaVista=null;
}
aggiornaTabellone();
export function fmt(s){ s=Math.max(0,Math.ceil(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
export function updateHUD(){
  disegnaCambi(false);      // barra dei cambi aperta: stamina aggiornata ogni mezzo secondo
  $('scA').textContent=teams[0].score; $('scB').textContent=teams[1].score;
  $('period').textContent=game.period+'°T';
  $('clock').textContent=fmt(game.clock);
  // tempo per l'azione: negli ultimi 5 secondi il numero lampeggia e suona a ogni secondo
  { const n=game.possTeam?Math.max(0,Math.ceil(game.shot)):null, el=$('shotclock'), urg=n!==null&&n<=5&&game.state==='play'&&!game.penalty;
    el.textContent=n===null?'—':n; el.classList.toggle('urg',urg);
    if(urg&&n>0&&n!==ultimoBip){ bip(n<=2?1320:880); }
    ultimoBip=urg?n:null; }
  // tasto a comparsa in controfuga (controfuga.js): pillola con il tasto, oppure pulsante TIRO illuminato sul telefono
  { const q=ctrl&&ctrl.qte&&game.state==='play'?ctrl.qte:null, el=$('qte'), b=document.querySelector('.tb[data-b="shoot"]');
    const t=q?`Premi TIRO<small>(K) · ${q.tipo==="schizzo"?"tiro a schizzo":"colonnello"}</small>`:"";
    if(el.dataset.t!==t){ el.dataset.t=t; el.innerHTML=t; el.classList.toggle('on',!!q); }
    if(b){ const on=!!q; if(b.classList.contains('premi')!==on){ b.classList.toggle('premi',on); const s=b.querySelector('small'); if(s) s.textContent=on?'Premi!':'2× finta'; } } }
  if(ctrl){
    { const t=`#${ctrl.num} ${ctrl.name}${iconaMano(ctrl.mano)}<span class="ruolo"> · ${ctrl.role}</span>${ctrl.sprinting?' <span class="sp">⚡</span>':''}`;
      if($('pname').innerHTML!==t) $('pname').innerHTML=t; }
    if(ctrl.scheda!==schedaVista){ schedaVista=ctrl.scheda; const s=ctrl.s; $('pstat').innerHTML=`<b>${ctrl.ovr}</b> · `+CHIAVE[ctrl.i].map(k=>`${STAT_NOMI[k].slice(0,3).toUpperCase()} ${s[k]}`).join(' · ')+` · mano ${ctrl.mano==='S'?'sinistra':'destra'}`; }
    $('stam').firstChild.style.width=(ctrl.stamina*100)+'%';
    $('stam').firstChild.style.background= ctrl.stamina>0.5?'#4ade80':ctrl.stamina>0.25?'#facc15':'#ef4444';
    $('power').firstChild.style.width=(ctrl.charging?Math.min(1,ctrl.chargeT/0.9)*100:0)+'%';
  }
  aggiornaCronaca();
  const fe=$('fight');
  if(fight.active){
    fe.style.display='block';
    $('fdef').textContent=fight.def.team.short+' #'+fight.def.num; $('fboa').textContent=fight.boa.team.short+' #'+fight.boa.num+' boa';
    const v=fight.v, fb=$('fbar');
    fb.style.left=(v>=0?50:50+v*50)+'%'; fb.style.width=(Math.abs(v)*50)+'%';
    fb.style.background=v>=0?fight.boa.team.css:fight.def.team.css;
  } else fe.style.display='none';
  const hum=teams[0], ai=teams[1], atk=game.possTeam===hum;
  const key=(atk?'a'+hum.atkPlay:'d'+hum.defPlay)+'|'+ai.defPlay+ai.atkPlay+'|'+schemiAperti;
  if(key!==tacKey){
    tacKey=key;
    const names=atk?ATK:DEFN, cur=atk?hum.atkPlay:hum.defPlay;
    // barra degli schemi: su telefono è chiusa (si vede solo lo schema in uso) e si apre con un tocco
    let h;
    // chiusa si vede solo il proprio schema (lo schema avversario si legge aprendo la barra: in gioco non serve sempre)
    if(!schemiAperti) h=`<span class="chip on" data-apri="1">${atk?'ATT':'DIF'}: ${names[cur]} ▾</span>`;
    else {
      h=`<span class="chip lab" data-apri="1">${atk?'ATTACCO':'DIFESA'}${TOUCH?' ▴':''}</span>`;
      names.forEach((n,i)=>{ h+=`<span class="chip${i===cur?' on':''}" data-i="${i}">${i+1} ${n}</span>`; });
      h+=`<span class="chip lab">${ai.short}: ${(atk?DEFN[ai.defPlay]:ATK[ai.atkPlay]).toLowerCase()}</span>`;
    }
    $('tac').innerHTML=h;
  }
}

// ================= CONTATORE DI FOTOGRAMMI =================
// Mostra quanti fotogrammi al secondo fa davvero il dispositivo, più i numeri che pesano sulla fluidità:
// qualità di disegno (risoluzione), oggetti disegnati e triangoli per fotogramma.
let fpsOn=false, fpsN=0, fpsT0=0, fpsMin=1e9, fpsPrev=0;
export function setFps(on){
  fpsOn=!!on; $('fps').style.display=fpsOn?'block':'none'; fpsN=0; fpsT0=0;
  try{ localStorage.setItem('pallanuoto-fps',fpsOn?'1':'0'); }catch(e){}
}
export function fpsIniziale(){
  let v=false;
  try{ v=localStorage.getItem('pallanuoto-fps')==='1'; }catch(e){}
  return v||/[?&]fps\b/.test(location.search);
}
export function tickFps(now){
  if(!fpsOn) return;
  if(!fpsT0){ fpsT0=now; fpsPrev=now; fpsN=0; fpsMin=1e9; return; }
  fpsN++; const d=now-fpsPrev; fpsPrev=now; if(d>0) fpsMin=Math.min(fpsMin,1000/d);
  if(now-fpsT0<500) return;
  const fps=fpsN*1000/(now-fpsT0), inf=renderer.info.render;
  $('fps').innerHTML=`<b>${Math.round(fps)}</b> fps (min ${Math.round(fpsMin)})<br>qualità ${dpr.toFixed(2)}<br>${inf.calls} oggetti · ${Math.round(inf.triangles/1000)}k triangoli`;
  fpsT0=now; fpsN=0; fpsMin=1e9;
}
