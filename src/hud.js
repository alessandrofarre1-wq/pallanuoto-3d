// ================= MESSAGGI / HUD =================
import { dpr, livelloAcqua, renderer } from './grafica/scena.js';
import { ATK, DEFN } from './costanti.js';
import { allPlayers, ctrl, fight, game, teams } from './stato.js';
export const $ = id => document.getElementById(id);
export let msgT=0;
export function showMsg(text,dur=1.4){ const m=$('msg'); m.innerHTML=text; m.style.opacity=1; msgT=dur; }
$('capA').style.background=teams[0].css; $('capB').style.background=teams[1].css;
export function fmt(s){ s=Math.max(0,Math.ceil(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
export function updateHUD(){
  $('score').textContent=teams[0].score+' - '+teams[1].score;
  $('period').textContent=game.period+'°T';
  $('clock').textContent=fmt(game.clock);
  $('shotclock').textContent=game.possTeam?Math.max(0,Math.ceil(game.shot)):'—';
  if(ctrl){
    $('pname').textContent='#'+ctrl.num+' '+ctrl.name+' · '+ctrl.role+(ctrl.sprinting?' · ⚡ SPRINT':'');
    $('stam').firstChild.style.width=(ctrl.stamina*100)+'%';
    $('stam').firstChild.style.background= ctrl.stamina>0.5?'#4ade80':ctrl.stamina>0.25?'#facc15':'#ef4444';
    $('power').firstChild.style.width=(ctrl.charging?Math.min(1,ctrl.chargeT/0.9)*100:0)+'%';
  }
  let ex='';
  for(const p of allPlayers) if(p.excluded) ex+=`<div>${p.team.short} #${p.num} fuori · ${Math.ceil(p.exclUntil-game.time)}"</div>`;
  if(ex!==exclKey){ exclKey=ex; $('excl').innerHTML=ex; }
  const fe=$('fight');
  if(fight.active){
    fe.style.display='block';
    $('fdef').textContent=fight.def.team.short+' #'+fight.def.num; $('fboa').textContent=fight.boa.team.short+' #'+fight.boa.num+' (boa)';
    const v=fight.v, fb=$('fbar');
    fb.style.left=(v>=0?50:50+v*50)+'%'; fb.style.width=(Math.abs(v)*50)+'%';
    fb.style.background=v>=0?fight.boa.team.css:fight.def.team.css;
  } else fe.style.display='none';
  const hum=teams[0], ai=teams[1], atk=game.possTeam===hum;
  const key=(atk?'a'+hum.atkPlay:'d'+hum.defPlay)+'|'+ai.defPlay+ai.atkPlay;
  if(key!==tacKey){
    tacKey=key;
    const names=atk?ATK:DEFN, cur=atk?hum.atkPlay:hum.defPlay;
    let h=`<span class="chip lab">${atk?'ATTACCO':'DIFESA'}</span>`;
    names.forEach((n,i)=>{ h+=`<span class="chip${i===cur?' on':''}" data-i="${i}">${i+1} ${n}</span>`; });
    h+=`<span class="chip lab">${ai.short}: ${(atk?DEFN[ai.defPlay]:ATK[ai.atkPlay]).toLowerCase()}</span>`;
    $('tac').innerHTML=h;
  }
}
export let tacKey='', exclKey='';
export function tickMsg(dt){ if(msgT>0){ msgT-=dt; if(msgT<=0) $('msg').style.opacity=0; } }

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
  $('fps').innerHTML=`<b>${Math.round(fps)}</b> fps (min ${Math.round(fpsMin)})<br>qualità ${dpr.toFixed(2)} · acqua ${['bassa','media','alta'][livelloAcqua]}<br>${inf.calls} oggetti · ${Math.round(inf.triangles/1000)}k triangoli`;
  fpsT0=now; fpsN=0; fpsMin=1e9;
}
