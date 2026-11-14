// ================= CRONACA: notifiche degli eventi in stile telecronaca =================
// Tutti gli eventi di partita passano da annuncia(tipo, titolo, opzioni). Regole:
//  - UN SOLO spazio di notifica, sotto il tabellone in alto: mai al centro del campo, mai due notifiche sovrapposte;
//  - priorità: gol > espulsione, rigore, time-out, fine tempo > conto alla rovescia > eventi ordinari > suggerimenti al
//    giocatore. Un evento più importante sostituisce subito quello a schermo; uno meno importante aspetta in coda (al massimo
//    3, e se aspetta troppo viene lasciato perdere: resta comunque nel registro);
//  - se la notifica coprirebbe la palla, una porta o il giocatore controllato si sposta di lato (sinistra o destra);
//  - le espulsioni, dopo il banner, restano come piccolo indicatore con il tempo che manca e la superiorità numerica;
//  - il time-out ha la sua grafica finché il gioco è fermo; il gol la sua finché si riprende dal centro;
//  - ogni evento (non i suggerimenti) va nel registro, consultabile dal pulsante accanto alla pausa.
// Solo interfaccia: niente caso del gioco, niente regole.
import { camera } from './grafica/scena.js';
import { EXCL_TIME, HL } from './costanti.js';
import { ball, ctrl, game, teams } from './stato.js';
import * as THREE from 'three';

const $ = id => document.getElementById(id);
const fmt = s => { s=Math.max(0,Math.ceil(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const PRI={ avviso:1, info:2, fallo:2, possesso:2, parata:2, legno:2, ripresa:2, conto:3, espulsione:4, rigore:4, timeout:4, fine:4, gol:5 };
const GRANDE=new Set(['espulsione','rigore','timeout','gol','fine','conto']);
const DURATA={ avviso:1.0, info:1.8, fallo:1.7, possesso:1.7, parata:1.6, legno:1.6, ripresa:1.4, conto:0.4, espulsione:2.6, rigore:2.4, timeout:2.6, fine:2.4, gol:2.8 };
const NOMI={ info:'', fallo:'Fallo', possesso:'Possesso', parata:'Parata', legno:'Legno', ripresa:'Ripresa', espulsione:'Espulsione', rigore:'Rigore', timeout:'Time-out', fine:'Fine tempo', gol:'Gol', conto:'' };
// icone disegnate (stile cartoon: forme piene e arrotondate, contorno scuro)
const ICONE={
  fischio:'<svg viewBox="0 0 24 24"><path d="M2.5 11.5a6.5 6.5 0 0 0 13 1.2h5.3V8.3H9.3A6.5 6.5 0 0 0 2.5 11.5z" fill="currentColor"/><circle cx="9" cy="12" r="2.2" fill="#0b1d33"/><rect x="11" y="5.5" width="3" height="3" rx="1" fill="currentColor"/></svg>',
  palla:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#facc15" stroke="#0b1d33" stroke-width="1.5"/><path d="M5 7.5c4 2.5 10 2.5 14 0M5 16.5c4-2.5 10-2.5 14 0" stroke="#1d4fd6" stroke-width="3" fill="none"/></svg>',
  orologio:'<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12 8.5V13l3 2" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="9.5" y="1.5" width="5" height="2.6" rx="1" fill="currentColor"/></svg>',
  fuori:'<svg viewBox="0 0 24 24"><path d="M4 3.5h9v4h-2.4V6H6.4v12h4.2v-1.5H13v4H4z" fill="currentColor"/><path d="M13.5 8l6 4-6 4v-2.6H8.6v-2.8h4.9z" fill="currentColor"/></svg>',
  bersaglio:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="5.2" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/></svg>',
  scambio:'<svg viewBox="0 0 24 24"><path d="M4 8h12.5l-3-3M20 16H7.5l3 3" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  guanto:'<svg viewBox="0 0 24 24"><path d="M7 21v-6.5L4.2 11a1.6 1.6 0 0 1 2.5-2l1.3 1.4V4.6a1.5 1.5 0 0 1 3 0V10V3.4a1.5 1.5 0 0 1 3 0V10V4.6a1.5 1.5 0 0 1 3 0V11V7a1.5 1.5 0 0 1 3 0v7.5A6.5 6.5 0 0 1 13.5 21z" fill="currentColor"/></svg>',
  palo:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="3.2" height="18" rx="1" fill="currentColor"/><path d="M4 4h16" stroke="currentColor" stroke-width="3"/><circle cx="15" cy="14" r="4" fill="#facc15" stroke="#0b1d33" stroke-width="1.4"/></svg>',
  info:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="currentColor"/><rect x="10.6" y="10" width="2.8" height="7.5" rx="1.2" fill="#0b1d33"/><circle cx="12" cy="7" r="1.7" fill="#0b1d33"/></svg>'
};
const ICONA_DI={ avviso:'info', info:'info', fallo:'fischio', possesso:'scambio', parata:'guanto', legno:'palo', ripresa:'fischio', conto:'orologio', espulsione:'fuori', rigore:'bersaglio', timeout:'orologio', fine:'fischio', gol:'palla' };

export const registro=[];            // { periodo, tempo, tipo, testo, colore }
export const ascoltatori=[];         // per le verifiche automatiche: f(tipo, testo semplice)
let attuale=null, coda=[], visibile=false, pos='', golFlash=0;
const chi=p=>p?`${p.team.short} #${p.num}`:'';
const pallino=t=>t?`<i class="capc" style="background:${t.css}"></i>`:'';
// tipo: vedi PRI. titolo: testo principale. o: { p (giocatore coinvolto), squadra, dettaglio, durata, registro (sì/no), extra }
export function annuncia(tipo,titolo,o={}){
  const squadra=o.squadra||(o.p&&o.p.team)||null;
  const n={ tipo, titolo, p:o.p||null, squadra, dettaglio:o.dettaglio||'', durata:o.durata||DURATA[tipo]||1.5, pri:PRI[tipo]||2, eta:0, attesa:0, extra:o.extra||null };
  n.chiave=tipo+'|'+titolo+'|'+chi(n.p);
  const piano=[NOMI[tipo]&&!titolo.toLowerCase().startsWith(NOMI[tipo].toLowerCase())?NOMI[tipo]:'',titolo,chi(n.p),o.dettaglio||''].filter(Boolean).join(' · ');
  for(const f of ascoltatori) f(tipo,piano);
  if(o.registro!==false && tipo!=='avviso' && tipo!=='conto')
    registro.push({ periodo:game.period, tempo:fmt(game.clock), tipo, colore:squadra?squadra.css:null,
      testo:[NOMI[tipo]&&!titolo.toLowerCase().startsWith(NOMI[tipo].toLowerCase())?NOMI[tipo]:'',titolo].filter(Boolean).join(': '),
      chi:o.p?`${chi(o.p)} ${o.p.name}`:(squadra?squadra.short:''), dettaglio:o.dettaglio||'' });
  if(registro.length>300) registro.shift();
  if(tipo==='gol') golFlash=1.6;
  // l'espulsione non usa lo spazio delle notifiche: si apre come linguetta sotto la squadra dell'espulso (vedi più sotto)
  // (nella linguetta solo su chi ha fatto fallo: tempo e superiorità si vedono già lì accanto; il resto va nel registro)
  if(tipo==='espulsione'&&n.p){ fresche.set(n.p,{ eta:0, det:(o.dettaglio||'').split(' · ')[0] }); return; }
  if(!attuale){ mostra(n); return; }
  if(attuale.chiave===n.chiave){ attuale.eta=Math.min(attuale.eta,0.3); return; }
  if(n.pri>attuale.pri || (n.pri===attuale.pri && attuale.eta>0.6 && !GRANDE.has(n.tipo)) || (n.tipo==='conto'&&attuale.tipo==='conto')){ mostra(n); return; }
  if(n.tipo==='avviso') return;                       // i suggerimenti non aspettano: se c'è qualcosa di più importante si perdono
  coda=coda.filter(x=>x.chiave!==n.chiave); coda.push(n); coda.sort((a,b)=>b.pri-a.pri); if(coda.length>3) coda.length=3;
}
function contenuto(n){
  const det=[];
  if(n.p) det.push(`<span class="chi">${pallino(n.p.team)}${chi(n.p)} <small>${n.p.name}</small></span>`);
  else if(n.squadra) det.push(`<span class="chi">${pallino(n.squadra)}${n.squadra.short}</span>`);
  if(n.dettaglio) det.push(`<span class="det">${n.dettaglio}</span>`);
  const nome=n.tipo==='gol'?'GOL!':n.titolo;
  // gol: anche il punteggio aggiornato (il tabellone intanto si illumina)
  if(n.tipo==='gol') det.push(`<span class="esito">${teams[0].short} ${teams[0].score} – ${teams[1].score} ${teams[1].short}</span>`);
  return `<span class="ico">${ICONE[ICONA_DI[n.tipo]||'info']}</span><span class="tx"><b>${nome}</b>${det.join('')}</span><span class="cnt"></span>`;
}
function mostra(n){
  attuale=n; n.eta=0; posT=0;
  const el=$('cronaca');
  el.className='cr t-'+n.tipo+(GRANDE.has(n.tipo)?' grande':'')+(pos?' '+pos:'');
  el.style.setProperty('--col',n.squadra?n.squadra.css:'#facc15');
  el.innerHTML=contenuto(n);
  void el.offsetWidth; el.classList.add('vis'); visibile=true;
}
function chiudi(){
  attuale=null; const el=$('cronaca'); el.classList.remove('vis'); visibile=false;
  while(coda.length){ const n=coda.shift(); if(n.attesa<2.5){ mostra(n); break; } }
}
export function svuota(){ coda=[]; chiudi(); }
// a ogni fotogramma (dt in secondi di gioco)
export function tick(dt){
  for(const n of coda) n.attesa+=dt;
  if(golFlash>0){ golFlash-=dt; $('hud').classList.toggle('gol',golFlash>0); }
  for(const [p,f] of fresche){ f.eta+=dt; if(f.eta>DURATA.espulsione||!p.excluded) fresche.delete(p); }
  if(!attuale) return;
  attuale.eta+=dt;
  // time-out e gol restano finché il gioco è fermo; il time-out mostra quanto manca alla ripresa
  const fermo=game.state==='stop';
  if(attuale.tipo==='timeout'){ const c=$('cronaca').querySelector('.cnt'); if(c) c.textContent=fermo?Math.ceil(game.timer)+'"':''; if(!fermo&&attuale.eta>0.3) chiudi(); return; }
  if(attuale.tipo==='gol'&&fermo&&attuale.eta<4) return;
  if(attuale.eta>=attuale.durata) chiudi();
}

// ---------- espulsioni e superiorità: linguette appese sotto la squadra interessata (tabellone) ----------
// Appena fischiata si evidenzia la riga; numero, nome e timer restano visibili. In precedenza si
// richiude e resta piccola: numero, tempo che manca e una barra che si accorcia. Sotto la squadra con l'uomo in più compare
// il distintivo oro «6 c 5» nel tabellone. Nessun banner al centro: il gioco intanto continua.
const fresche=new Map();
const USCITA_SVG='<svg viewBox="0 0 24 24"><path d="M4 3.5h9v4h-2.4V6H6.4v12h4.2v-1.5H13v4H4z" fill="currentColor"/><path d="M13.5 8l6 4-6 4v-2.6H8.6v-2.8h4.9z" fill="currentColor"/></svg>';
const chiaviEsp=['',''];
function aggiornaStato(){
  const inCampo=t=>t.players.filter(p=>!p.excluded&&!p.isGK).length;      // giocatori di movimento: «6 contro 5»
  const a=inCampo(teams[0]), b=inCampo(teams[1]);
  teams.forEach((t,k)=>{
    let h='';
    for(const p of t.players) if(p.excluded){
      const resta=Math.max(0,p.exclUntil-game.time), f=fresche.get(p), def=p.pf>=3;
      h+=`<span class="ex${f?' nuova':''}" style="--p:${def?100:Math.round(Math.min(1,resta/EXCL_TIME)*100)}%">`
        +`<span class="r1">${USCITA_SVG}<span class="sq-ex">${t.short}</span><span class="lab">Espulsione</span><span class="chi">#${p.num} <small>${p.name}</small></span><span class="t">${def?'def.':fmt(resta)}</span></span>`
        +(f&&f.det?`<span class="det">${f.det}</span>`:'')+'</span>';
    }
    const mia=k===0?a:b, altra=k===0?b:a, piu=$(k===0?'piuA':'piuB'), sup=mia>altra?`${mia} c ${altra}`:'';
    if(piu.textContent!==sup){ piu.textContent=sup; piu.classList.toggle('on',!!sup); piu.title=sup?'uomo in più':''; }
    if(h!==chiaviEsp[k]){ chiaviEsp[k]=h; $(k===0?'espA':'espB').innerHTML=h; }
  });
}

// ---------- la notifica non deve coprire palla, porte e giocatore controllato ----------
const _v=new THREE.Vector3();
function aSchermo(x,y,z){ _v.set(x,y,z).project(camera); if(_v.z>1) return null; return [(_v.x+1)/2*innerWidth,(1-_v.y)/2*innerHeight]; }
// quanto è grave ciò che la notifica coprirebbe: palla 4, giocatore controllato 2, porta 1 (0 = non copre niente)
function copre(r){
  const punti=[[aSchermo(ball.x,ball.y||0.2,ball.z),4]];
  if(ctrl) punti.push([aSchermo(ctrl.x,0.5,ctrl.z),2]);
  for(const s of [1,-1]) for(const dz of [-1.5,0,1.5]) punti.push([aSchermo(s*HL,0.5,dz),1]);
  const m=18; let peso=0;
  for(const [q,w] of punti) if(q&&q[0]>r.left-m&&q[0]<r.right+m&&q[1]>r.top-m&&q[1]<r.bottom+m) peso=Math.max(peso,w);
  // Anche i pannelli e i comandi restano distinti dalle notifiche.
  for(const id of ['hud','tac','player','tCambi','tLog','tPause']){
    const el=$(id); if(!el.getClientRects().length) continue;
    const q=el.getBoundingClientRect();
    if(r.left<q.right&&r.right>q.left&&r.top<q.bottom&&r.bottom>q.top) peso=Math.max(peso,0.5);
  }
  return peso;
}
let posT=0;
// chiamata dall'aggiornamento del tabellone (20 volte al secondo)
export function aggiorna(){
  aggiornaStato();
  // posizione verticale: sotto il tabellone e sotto gli indicatori delle espulsioni
  // al centro e a destra: sotto il tabellone (e sotto gli espulsi); a sinistra: sotto gli schemi, che stanno in alto a sinistra
  const el=$('cronaca');
  let sotto=$('hud').getBoundingClientRect().bottom;
  for(const id of ['espA','espB']) if($(id).childElementCount) sotto=Math.max(sotto,$(id).getBoundingClientRect().bottom);
  sotto+=6; const alto={ '':sotto, dx:sotto, sx:sotto };
  const metti=p=>{ el.classList.remove('sx','dx'); if(p) el.classList.add(p); el.style.top=alto[p]+'px'; };
  metti(pos);
  if(!visibile||game.state==='menu') return;
  if((posT-=0.05)>0) return;                  // non salta di continuo da una parte all'altra
  // la prima posizione libera; se nessuna lo è (schermi molto bassi), quella che copre la cosa meno importante
  // se in ogni posizione coprirebbe la palla, la notifica si riduce a una riga (i dettagli restano nel registro)
  // riduzione automatica: a gioco in corso, se la palla è vicina alla zona delle notifiche (in alto), la notifica è già
  // compatta: una riga sola, senza dettagli
  const pb=aSchermo(ball.x,ball.y||0.2,ball.z), vicina=game.state==='play'&&pb&&pb[1]<sotto+130;
  let meglio='', minimo=99;
  for(const compatta of (vicina?[true]:[false,true])){
    el.classList.toggle('compatto',compatta);
    for(const p of ['','dx','sx']){
      metti(p); const c=copre(el.getBoundingClientRect());
      if(c<minimo){ minimo=c; meglio=p; }
      if(!c) break;
    }
    if(minimo<4) break;
  }
  if(meglio!==pos){ pos=meglio; posT=0.8; }
  metti(pos);
}

// ---------- registro degli eventi ----------
let prima=null;
export function apriRegistro(){
  if($('registro').classList.contains('vis')) return;
  if(['play','stop','countdown'].includes(game.state)){ prima=game.state; game.prevState=game.state; game.state='paused'; } else prima=null;
  const L=$('regLista');
  L.innerHTML=registro.length?registro.map(e=>`<li class="t-${e.tipo}"><span class="tm">${e.periodo}°T ${e.tempo}</span><span class="ico">${ICONE[ICONA_DI[e.tipo]||'info']}</span>`+
    `<span class="rt"><b>${e.testo}</b>${e.chi?` <span class="rc">${e.colore?`<i class="capc" style="background:${e.colore}"></i>`:''}${e.chi}</span>`:''}${e.dettaglio?` <small>${e.dettaglio}</small>`:''}</span></li>`).join(''):'<li class="vuoto">Ancora nessun evento</li>';
  $('registro').classList.add('vis');
  L.scrollTop=L.scrollHeight;
}
export function chiudiRegistro(){
  if(!$('registro').classList.contains('vis')) return;
  $('registro').classList.remove('vis');
  if(prima&&game.state==='paused'){ game.state=prima; }
  prima=null;
}
export const registroAperto=()=>$('registro').classList.contains('vis');
