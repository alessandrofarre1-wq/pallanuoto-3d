// ================= MESSAGGI / HUD =================
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
