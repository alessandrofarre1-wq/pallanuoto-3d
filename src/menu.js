// ================= MENU =================
import { azzeraStatistiche } from './statistiche.js';
import { initAudio } from './audio.js';
import { PERIOD_LEN, setDiff, setPeriodLen, setSpeed } from './costanti.js';
import { $, aggiornaTabellone, fpsIniziale, setFps } from './hud.js';
import { RUOLI, CHIAVE, STAT_NOMI, squadre } from './dati/rose.js';
import { applicaSquadre } from './giocatori.js';
import { setLivelloAcqua } from './grafica/scena.js';
import { kickoff } from './regole.js';
import { allPlayers, game, teams } from './stato.js';
document.querySelectorAll('[data-len]').forEach(b=>b.onclick=()=>{ document.querySelectorAll('[data-len]').forEach(x=>x.classList.remove('on')); b.classList.add('on'); setPeriodLen(+b.dataset.len); });
document.querySelectorAll('[data-diff]').forEach(b=>b.onclick=()=>{ document.querySelectorAll('[data-diff]').forEach(x=>x.classList.remove('on')); b.classList.add('on'); setDiff(+b.dataset.diff); });
document.querySelectorAll('[data-spd]').forEach(b=>b.onclick=()=>{ document.querySelectorAll('[data-spd]').forEach(x=>x.classList.remove('on')); b.classList.add('on'); setSpeed(+b.dataset.spd); });
// scelta delle nazionali e rosa della propria squadra
const selA=$('sqA'), selB=$('sqB');
for(const q of squadre) for(const sel of [selA,selB]){ const o=document.createElement('option'); o.value=q.codice; o.textContent=`${q.nome} (${q.forza})`; sel.appendChild(o); }
function disegnaRosa(){
  $('rosa').innerHTML=teams[0].rosa.map(g=>`<div class="fig${g.titolare?'':' ris'}${g.campione?' camp':''}"><span class="ov">${g.ovr}</span><b>${g.num} ${g.nome}</b><br>${RUOLI[g.ruolo]}${g.titolare?'':' (riserva)'} · ${g.mano==='S'?'mancino':'destro'}`+
    `<div class="st">${CHIAVE[g.ruolo].map(k=>`<span>${STAT_NOMI[k].slice(0,3).toUpperCase()} ${g.s[k]}</span>`).join('')}</div></div>`).join('');
}
export function scegliSquadre(a,b){
  if(a===b) b=squadre.find(q=>q.codice!==a).codice;
  selA.value=a; selB.value=b; applicaSquadre(a,b); aggiornaTabellone(); disegnaRosa();
  try{ localStorage.setItem('pallanuoto-squadre',a+','+b); }catch(e){}
}
selA.onchange=selB.onchange=()=>{ if(game.state==='menu'||game.state==='over') scegliSquadre(selA.value,selB.value); else { selA.value=teams[0].codice; selB.value=teams[1].codice; } };
{ let a='ITA', b='HUN'; try{ const v=(localStorage.getItem('pallanuoto-squadre')||'').split(','); if(v.length===2&&squadre.some(q=>q.codice===v[0])&&squadre.some(q=>q.codice===v[1])) [a,b]=v; }catch(e){} scegliSquadre(a,b); }
// qualità dell'acqua: "auto" parte dal livello alto e scende da sola se il dispositivo fatica (vedi main.js)
export let acquaAuto=true;
const scegliAcqua=v=>{
  document.querySelectorAll('[data-acqua]').forEach(x=>x.classList.toggle('on',x.dataset.acqua===v));
  acquaAuto=v==='auto'; setLivelloAcqua(acquaAuto?2:+v);
  try{ localStorage.setItem('pallanuoto-acqua',v); }catch(e){}
};
document.querySelectorAll('[data-acqua]').forEach(b=>b.onclick=()=>scegliAcqua(b.dataset.acqua));
try{ const v=localStorage.getItem('pallanuoto-acqua'); if(v&&v!=='auto') scegliAcqua(v); }catch(e){}
const scegliFps=on=>{ document.querySelectorAll('[data-fps]').forEach(x=>x.classList.toggle('on',(x.dataset.fps==='1')===on)); setFps(on); };
document.querySelectorAll('[data-fps]').forEach(b=>b.onclick=()=>scegliFps(b.dataset.fps==='1'));
if(fpsIniziale()) scegliFps(true);
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
  game.penalty=null; azzeraStatistiche();
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
