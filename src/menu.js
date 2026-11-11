// ================= MENU =================
import { initAudio } from './audio.js';
import { PERIOD_LEN, setDiff, setPeriodLen, setSpeed } from './costanti.js';
import { $ } from './hud.js';
import { kickoff } from './regole.js';
import { allPlayers, game, teams } from './stato.js';
document.querySelectorAll('[data-len]').forEach(b=>b.onclick=()=>{ document.querySelectorAll('[data-len]').forEach(x=>x.classList.remove('on')); b.classList.add('on'); setPeriodLen(+b.dataset.len); });
document.querySelectorAll('[data-diff]').forEach(b=>b.onclick=()=>{ document.querySelectorAll('[data-diff]').forEach(x=>x.classList.remove('on')); b.classList.add('on'); setDiff(+b.dataset.diff); });
document.querySelectorAll('[data-spd]').forEach(b=>b.onclick=()=>{ document.querySelectorAll('[data-spd]').forEach(x=>x.classList.remove('on')); b.classList.add('on'); setSpeed(+b.dataset.spd); });
$('goBtn').onclick=()=>{
  initAudio();
  if(game.state==='paused'){ game.state=game.prevState; $('menu').style.display='none'; return; }
  newMatch();
};
export function togglePause(){
  if(game.state==='menu') return;
  if(game.state==='paused'){ game.state=game.prevState; $('menu').style.display='none'; return; }
  if(game.state==='over') return;
  game.prevState=game.state; game.state='paused';
  $('goBtn').textContent='RIPRENDI'; $('sub').textContent='Pausa'; $('final').style.display='none';
  $('menu').style.display='flex';
}
export function newMatch(){
  teams[0].score=teams[1].score=0; game.period=1; game.clock=PERIOD_LEN; game.time=0;
  for(const p of allPlayers){ p.stamina=1; p.excluded=false; p.pf=0; p.cut=null; }
  for(const t of teams){ t.atkPlay=0; t.defPlay=0; t.cross=false; t.timeouts=2; }
  game.penalty=null;
  $('menu').style.display='none';
  kickoff();
}
export function endMatch(){
  game.state='over';
  const a=teams[0].score, b=teams[1].score;
  $('final').style.display='block';
  $('final').innerHTML=`Finale: ${teams[0].name} ${a} - ${b} ${teams[1].name}<div style="font-size:16px;opacity:.8;margin-top:4px">${a>b?'Vittoria! 🏆':a<b?'Sconfitta, si riprova.':'Pareggio.'}</div>`;
  $('sub').textContent='Partita terminata'; $('goBtn').textContent='RIGIOCA';
  setTimeout(()=>{ $('menu').style.display='flex'; },1500);
}
