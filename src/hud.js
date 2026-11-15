// ================= HUD: tabellone, schemi, giocatore controllato (le notifiche degli eventi sono in cronaca.js) =================
import { CHIAVE, STAT_NOMI } from './dati/rose.js';
import { dpr, renderer } from './grafica/scena.js';
import { ATK, DEFN } from './costanti.js';
import { bip } from './audio.js';
import { aggiorna as aggiornaCronaca } from './cronaca.js';
import { ball, ctrl, fight, game, teams } from './stato.js';
import { iconaMano } from './mano.js';
import { aggiornaPulsanteCambi } from './panchinaVista.js';
import { manUp, schemiUomo } from './ia.js';
import { siglaUomo } from './uomo-in-piu.js';
export const $ = id => document.getElementById(id);
let tacKey='', schedaVista=null, ultimoBip=null, uomoAperto=null, uomoChiudi=null;
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
  aggiornaPulsanteCambi();      // pulsante CAMBI: cambio consigliato, in corso o in attesa
  $('scA').textContent=teams[0].score; $('scB').textContent=teams[1].score;
  const serie=game.rigoriFinali;
  $('period').textContent=serie?'RIG':game.period+'°T';
  $('clock').textContent=serie?serie.gol.join(' – '):fmt(game.clock);
  $('clock').title=serie?'Risultato della serie di rigori':'Tempo rimasto nel periodo';
  // Durante la serie si conserva il pareggio dei regolamentari e si legge il conto dei rigori accanto a RIG.
  // Cambi e schemi non sono disponibili mentre si stanno eseguendo i tiri finali.
  $('tCambi').style.visibility=serie?'hidden':'';
  $('tac').style.visibility=serie?'hidden':'';
  // tempo per l'azione: negli ultimi 5 secondi il numero lampeggia e suona a ogni secondo
  { const n=serie?(serie.fase==='tiro'?Math.max(0,Math.ceil(7-serie.tempoTiro)):null):game.possTeam?Math.max(0,Math.ceil(game.shot)):null, el=$('shotclock'), urg=n!==null&&n<=5&&game.state==='play'&&(!game.penalty||!!serie);
    el.title=serie?'Tempo per eseguire il rigore':'Tempo rimasto per il possesso';
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
  { const btn=document.querySelector('.tb[data-b="shoot"]'), carica=!!(ctrl&&ctrl.charging&&ball.holder===ctrl), pot=carica?Math.min(1,ctrl.chargeT/0.9):0;
    const max=carica&&pot>=1, recente=ctrl&&ctrl.effettoTiro&&game.time-ctrl.effettoTiro.inizio>=0&&game.time-ctrl.effettoTiro.inizio<0.65?ctrl.effettoTiro:null;
    const nomi={beduina:'BEDUINA',sciarpa:'SCIARPA',schizzo:'SCHIZZO',colonnello:'COLONNELLO'};
    btn.classList.toggle('caricando',carica); btn.classList.toggle('massimo',max);
    const riempimento=pot*100+'%'; if(btn.style.getPropertyValue('--potenza')!==riempimento) btn.style.setProperty('--potenza',riempimento);
    const etichetta=$('power').previousElementSibling, testoPotenza=carica?(max?'Potenza tiro · MAX — rilascia':'Potenza tiro · '+Math.round(pot*100)+'%'):'Potenza tiro';
    if(etichetta.textContent!==testoPotenza) etichetta.textContent=testoPotenza;
    const label=carica?(max?'MAX':Math.round(pot*100)+'%'):recente&&(nomi[recente.tipo]||recente.forza>=0.98)?(nomi[recente.tipo]||'POTENTE'):ctrl&&ctrl.qte?'Premi!':'2× finta';
    const small=btn.querySelector('small'); if(small.textContent!==label) small.textContent=label;
    const aria=carica?(max?'Tiro alla massima potenza: rilascia':'Potenza tiro '+Math.round(pot*100)+'%'):'Tiro';
    if(btn.getAttribute('aria-label')!==aria) btn.setAttribute('aria-label',aria);
  }
  aggiornaCronaca();
  const fe=$('fight');
  // la barra della lotta al centro solo quando riguarda il giocatore: controlla il boa o il suo marcatore, oppure la sua squadra
  // attacca e può servire il centroboa (v0.44, «le informazioni compaiono quando servono»)
  const lottaUtile=fight.active&&(ctrl===fight.boa||ctrl===fight.def||(game.possTeam===teams[0]&&fight.boa.team===teams[0]));
  if(lottaUtile){
    fe.style.display='block';
    const stato=fight.ricevibile?'Boa servibile':fight.stato==='anticipo'?'Anticipo difesa':'Cerca il lato';
    $('fstato').textContent=stato;
    fe.setAttribute('aria-label',`${stato}. Apertura del passaggio ${Math.round((fight.apertura||0)*100)} per cento`);
    fe.title='La barra mostra la posizione sulla linea di passaggio. Taglio con palla al boa: girata; Sprint sostiene il tagliafuori.';
    $('fdef').textContent=fight.def.team.short+' #'+fight.def.num; $('fboa').textContent=fight.boa.team.short+' #'+fight.boa.num+' boa';
    const v=fight.v, fb=$('fbar');
    fb.style.left=(v>=0?50:50+v*50)+'%'; fb.style.width=(Math.abs(v)*50)+'%';
    fb.style.background=v>=0?fight.boa.team.css:fight.def.team.css;
  } else fe.style.display='none';
  const hum=teams[0], ai=teams[1], atk=game.possTeam===hum;
  const piano=atk&&hum.schema?hum.schema.nome:null;
  // uomo in più (v0.44): la barra mostra i tre schemi scelti; si apre da sola all'inizio di ogni superiorità (un tocco per chiamarlo)
  const up=atk&&manUp(hum)&&game.state==='play';
  // si apre da sola a ogni superiorità e, se non si sceglie niente, si richiude dopo 5 s di gioco (resta la pillola chiusa)
  if(up&&hum.uomoPossT!==uomoAperto){ uomoAperto=hum.uomoPossT; uomoChiudi=game.time+5; apriSchemi(true); }
  if(up&&TOUCH&&uomoChiudi!=null&&game.time>=uomoChiudi){ uomoChiudi=null; if(!hum.uomo) apriSchemi(false); }
  if(!up){ uomoAperto=null; uomoChiudi=null; }
  const key=(up?'u'+(hum.uomo?hum.uomo.schema.id+hum.uomo.fase:'-'):'')+(atk?'a'+hum.atkPlay:'d'+hum.defPlay)+'|'+ai.defPlay+ai.atkPlay+'|'+schemiAperti+'|'+piano;
  if(key!==tacKey&&up){
    tacKey=key;
    const lista=schemiUomo(hum), cur=hum.uomo?hum.uomo.schema:null;
    let h;
    // testi brevi (sigla dello schema e fase «2/3»); il nome completo resta nel suggerimento al passaggio del mouse
    const fase=cur&&cur.fasi.length>1?` ${hum.uomo.fase+1}/${cur.fasi.length}`:'';
    if(!schemiAperti) h=`<span class="chip on up" data-apri="1" title="${cur?cur.nome:'4-2 base'}">6c5 · ${siglaUomo(cur)}${fase} ▾</span>`;
    else {
      h=`<span class="chip lab up" data-apri="1">6c5${TOUCH?' ▴':''}</span>`;
      lista.forEach((sc,i)=>{ h+=`<span class="chip up${cur===sc?' on':''}" data-i="${i}" title="${sc.nome}">${i+1} ${siglaUomo(sc)}${cur===sc?fase:''}</span>`; });
      h+=`<span class="chip up${!cur?' on':''}" data-i="3" title="4-2 della strategia">4 Base</span>`;
    }
    $('tac').innerHTML=h;
  } else if(key!==tacKey){
    tacKey=key;
    const names=atk?ATK:DEFN, cur=atk?hum.atkPlay:hum.defPlay;
    // barra degli schemi: su telefono è chiusa (si vede solo lo schema in uso) e si apre con un tocco
    let h;
    // chiusa si vede solo il proprio schema (lo schema avversario si legge aprendo la barra: in gioco non serve sempre)
    if(!schemiAperti) h='<span class="chip on" data-apri="1"></span>';
    else {
      h=`<span class="chip lab" data-apri="1">${atk?'ATTACCO':'DIFESA'}${TOUCH?' ▴':''}</span>`;
      names.forEach((n,i)=>{ h+=`<span class="chip${i===cur?' on':''}" data-i="${i}">${i+1} ${n}</span>`; });
      h+=`<span class="chip lab">${ai.short}: ${(atk?DEFN[ai.defPlay]:ATK[ai.atkPlay]).toLowerCase()}</span>`;
    }
    $('tac').innerHTML=h;
    if(!schemiAperti){
      const chip=$('tac').firstElementChild;
      chip.textContent=`${atk?'ATT':'DIF'}: ${piano||names[cur]} ▾`;
      chip.title=piano||names[cur];
    }
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
