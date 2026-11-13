// ================= MENU (esperienza pre-partita di WATERPOLO 7) =================
// Schermate: home → squadre (passo 1) → impostazioni (passo 2, facoltativo) → partita. A parte: comandi, opzioni, pausa, fine.
// Dalla home a Italia–Ungheria in campo bastano tre tocchi (PARTITA VELOCE, CONTINUA, GIOCA). Indietro conserva le scelte.
// Le funzioni di gioco sono quelle di prima: scegliSquadre, newMatch, togglePause, endMatch; cambia solo come si presentano.
// Il menu si usa sia in verticale sia in orizzontale; la partita solo in orizzontale (main.js, stile.css).
import { azzeraStatistiche } from './statistiche.js';
import { initAudio } from './audio.js';
import { PERIOD_LEN, setCamZoom, setArbitro, setDiff, setPeriodLen, setSpeed } from './costanti.js';
import { $, aggiornaTabellone, fpsIniziale, setFps } from './hud.js';
import { RUOLI, CHIAVE, STAT_NOMI, squadre } from './dati/rose.js';
import { bandiera } from './dati/bandiere.js';
import { LOGO } from './logo.js';
import { applicaSquadre } from './giocatori.js';
import { annullaCambio } from './panchina.js';
import { azzeraScelta, disegnaPanchina } from './panchinaVista.js';
import { kickoff } from './regole.js';
import { allPlayers, game, teams } from './stato.js';
import { iconaMano } from './mano.js';

const salva=(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){ /* senza memoria si va avanti lo stesso */ } };
const leggi=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } };
for(const id of ['logoHome','logoPausa','logoFine']) $(id).innerHTML=LOGO();

// ---------- navigazione tra le schermate ----------
const VISTE={ home:'vHome', squadre:'vSquadre', impostazioni:'vImpostazioni', comandi:'vComandi', info:'vInfo', opzioni:'vOpzioni', pausa:'vPausa', panchina:'vPanchina', fine:'vFine' };
const storia=[];
export function vai(v,senzaStoria){
  const M=$('menu'), prima=M.dataset.vista;
  if(!senzaStoria&&prima&&prima!==v) storia.push(prima);
  M.dataset.vista=v;
  for(const [k,id] of Object.entries(VISTE)) $(id).classList.toggle('on',k===v);
  M.scrollTop=0; $(VISTE[v]).scrollTop=0;
  if(v==='squadre') disegnaSquadre();
  if(v==='panchina') disegnaPanchina();
  else azzeraScelta();
}
function indietro(){ vai(storia.pop()||(game.state==='paused'?'pausa':game.state==='over'?'fine':'home'),true); }
document.querySelectorAll('[data-va]').forEach(b=>b.addEventListener('click',()=>vai(b.dataset.va)));
document.querySelectorAll('[data-indietro]').forEach(b=>b.addEventListener('click',indietro));
vai('home',true);

// ---------- impostazioni: valori di prima, ricordati per la prossima volta ----------
function gruppo(attr,applica,chiave){
  const bottoni=[...document.querySelectorAll(`[data-${attr}]`)];
  const scegli=v=>{ for(const x of bottoni) x.classList.toggle('on',x.dataset[attr]===v); applica(v); if(chiave) salva(chiave,v); };
  for(const b of bottoni) b.onclick=()=>scegli(b.dataset[attr]);
  const v=chiave&&leggi(chiave); if(v&&bottoni.some(x=>x.dataset[attr]===v)) scegli(v);
}
// impostazioni della partita: menu a tendina (come nel concept), con i valori di prima
const TENDINE={ len:['selLen',v=>setPeriodLen(+v),'pallanuoto-durata'], diff:['selDiff',v=>setDiff(+v),'pallanuoto-difficolta'],
  arb:['selArb',v=>setArbitro(+v),'pallanuoto-arbitro'], spd:['selSpd',v=>setSpeed(+v),'pallanuoto-ritmo'] };
// imposta('len','300'): sceglie un valore come farebbe il giocatore (lo usano anche le verifiche automatiche)
export function imposta(nome,valore){
  const [id,applica,chiave]=TENDINE[nome], sel=$(id);
  if(![...sel.options].some(o=>o.value===String(valore))) return;
  sel.value=String(valore); applica(sel.value); salva(chiave,sel.value);
}
for(const [nome,[id,applica]] of Object.entries(TENDINE)){
  const sel=$(id); sel.onchange=()=>imposta(nome,sel.value);
  const v=leggi(TENDINE[nome][2]); if(v) imposta(nome,v); else applica(sel.value);
}
gruppo('cam',v=>setCamZoom(+v),'pallanuoto-cam');
gruppo('fps',v=>setFps(v==='1'),null);
if(fpsIniziale()) document.querySelector('[data-fps="1"]').click();

// ---------- squadre ----------
const scelta=['ITA','HUN'];
let lato=0;                                   // quale card cambia toccando una squadra dell'elenco
function disegnaRosa(){
  $('rosa').innerHTML=teams[0].rosa.map(g=>`<div class="fig${g.titolare?'':' ris'}${g.campione?' camp':''}"><span class="ov">${g.ovr}</span><b>${g.num} ${g.nome}${iconaMano(g.mano)}</b><br>${RUOLI[g.ruolo]}${g.titolare?'':' (riserva)'} · ${g.mano==='S'?'mancino':'destro'}`+
    `<div class="st">${CHIAVE[g.ruolo].map(k=>`<span>${STAT_NOMI[k].slice(0,3).toUpperCase()} ${g.s[k]}</span>`).join('')}</div></div>`).join('');
}
const sq=c=>squadre.find(q=>q.codice===c);
export function scegliSquadre(a,b){
  if(a===b) b=squadre.find(q=>q.codice!==a).codice;
  scelta[0]=a; scelta[1]=b; applicaSquadre(a,b); aggiornaTabellone(); disegnaRosa(); disegnaSquadre();
  salva('pallanuoto-squadre',a+','+b);
}
// scegliere per un lato la squadra già presa dall'altro scambia le due
function metti(l,codice){
  if(!(game.state==='menu'||game.state==='over')) return;
  if(codice===scelta[1-l]) scegliSquadre(scelta[1],scelta[0]);      // già presa dall'altra parte: si scambiano
  else scegliSquadre(l===0?codice:scelta[0],l===1?codice:scelta[1]);
}
function disegnaSquadre(){
  document.querySelectorAll('.card-sq').forEach(c=>{
    const l=+c.dataset.lato, q=sq(scelta[l]);
    c.classList.toggle('on',l===lato);
    c.querySelector('.cs-band').innerHTML=bandiera(q.codice,'band grande',true);
    c.querySelector('.cs-nome').textContent=q.nome;
    c.querySelector('.cs-rating').innerHTML=`Rating <b>${q.forza}</b>`;
  });
  const a=sq(scelta[0]), b=sq(scelta[1]), d=a.forza-b.forza;
  $('confronto').innerHTML=`<span class="cf-sig">${a.codice}</span><div class="cf-barra"><i style="width:${a.forza/(a.forza+b.forza)*100}%"></i></div><span class="cf-sig">${b.codice}</span>`+
    `<span class="cf-testo">${Math.abs(d)<=3?'Partita equilibrata':(d>0?a.nome:b.nome)+' favorita'+(Math.abs(d)>=10?' di molto':'')}</span>`;
  $('elencoSq').innerHTML=squadre.map(q=>`<button type="button" class="es${q.codice===scelta[lato]?' on':''}${q.codice===scelta[1-lato]?' altra':''}" data-sq="${q.codice}">${bandiera(q.codice,'band',true)}<span>${q.codice}</span></button>`).join('');
}
document.querySelectorAll('.card-sq').forEach(c=>{
  c.addEventListener('click',e=>{ const l=+c.dataset.lato;
    const f=e.target.closest('[data-scorri]');
    if(f){ const i=squadre.findIndex(q=>q.codice===scelta[l]); let j=(i+(+f.dataset.scorri)+squadre.length)%squadre.length;
      if(squadre[j].codice===scelta[1-l]) j=(j+(+f.dataset.scorri)+squadre.length)%squadre.length;
      lato=l; metti(l,squadre[j].codice); return; }
    lato=l; disegnaSquadre(); });
});
$('elencoSq').addEventListener('click',e=>{ const b=e.target.closest('[data-sq]'); if(b) metti(lato,b.dataset.sq); });
$('scambia').onclick=()=>{ if(game.state==='menu'||game.state==='over') scegliSquadre(scelta[1],scelta[0]); };
{ let a='ITA', b='HUN'; const v=(leggi('pallanuoto-squadre')||'').split(','); if(v.length===2&&sq(v[0])&&sq(v[1])) [a,b]=v; scegliSquadre(a,b); }

// ---------- avvio, pausa, fine ----------
function chiudiMenu(){ $('menu').style.display='none'; storia.length=0; }
function apriMenu(v){ $('menu').style.display='flex'; storia.length=0; vai(v,true); }
$('goBtn').onclick=()=>{
  initAudio();
  // dove il browser lo permette si blocca lo schermo in orizzontale (non è indispensabile: in verticale c'è comunque l'avviso)
  try{ const o=screen.orientation; if(o&&o.lock) o.lock('landscape').catch(()=>{}); }catch(e){ /* non supportato */ }
  if(game.state==='paused'){ game.state=game.prevState; chiudiMenu(); return; }
  newMatch();
};
$('riprendi').onclick=()=>$('goBtn').click();
$('rigioca').onclick=()=>$('goBtn').click();
export function togglePause(){
  if(game.state==='menu') return;
  if(game.state==='paused'){ game.state=game.prevState; chiudiMenu(); return; }
  if(game.state==='over') return;
  game.prevState=game.state; game.state='paused';
  $('pausaPunteggio').innerHTML=`${bandiera(teams[0].codice)}<b>${teams[0].short} ${teams[0].score} – ${teams[1].score} ${teams[1].short}</b>${bandiera(teams[1].codice)}<span>${game.period}° tempo</span>`;
  apriMenu('pausa');
}
export function newMatch(){
  for(const t of teams) annullaCambio(t);
  applicaSquadre(teams[0].codice,teams[1].codice);      // si riparte con i titolari, panchina fresca
  teams[0].score=teams[1].score=0; game.period=1; game.clock=PERIOD_LEN; game.time=0;
  for(const p of allPlayers){ p.stamina=1; p.excluded=false; p.pf=0; p.cut=null; }
  for(const t of teams){ t.atkPlay=0; t.defPlay=2; t.lasciato=null; t.cross=false; t.timeouts=2; t.vuoleTimeout=false; t.parzialeSubito=0; t.espulsioniT=[]; t.setteAnnunciato=false; t.fugaFino=0; }
  game.penalty=null; azzeraStatistiche();
  chiudiMenu();
  kickoff();
}
export function endMatch(){
  game.state='over';
  const a=teams[0].score, b=teams[1].score;
  $('final').innerHTML=`<div class="fin-esito">${a>b?'Vittoria!':a<b?'Sconfitta':'Pareggio'}</div><div class="fin-punteggio">${bandiera(teams[0].codice)}<b>${teams[0].name} ${a} – ${b} ${teams[1].name}</b>${bandiera(teams[1].codice)}</div>`+
    `<div class="fin-nota">${a>b?'Bella partita.':a<b?'Si riprova.':'Tutto da rifare.'}</div>`;
  setTimeout(()=>apriMenu('fine'),1500);
}

// versione del prototipo (da package.json, vedi vite.config.js): in home e in pausa, così si vede quando il gioco si aggiorna
for(const el of document.querySelectorAll('#sub, .versione-pausa')) el.textContent='Prototipo v'+__VERSIONE__;
