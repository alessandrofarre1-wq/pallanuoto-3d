// ================= MENU (esperienza pre-partita di WATERPOLO 7) =================
// Schermate: home → squadre (passo 1) → impostazioni (passo 2, facoltativo) → partita. A parte: comandi, opzioni, pausa, fine.
// Dalla home a Italia–Ungheria in campo bastano tre tocchi (PARTITA VELOCE, CONTINUA, GIOCA). Indietro conserva le scelte.
// Le funzioni di gioco sono quelle di prima: scegliSquadre, newMatch, togglePause, endMatch; cambia solo come si presentano.
// Il menu si usa sia in verticale sia in orizzontale; la partita solo in orizzontale (main.js, stile.css).
import { azzeraStatistiche } from './statistiche.js';
import { initAudio } from './audio.js';
import { PERIOD_LEN, SHOT_CLOCK, setArbitro, setDiff, setPeriodLen } from './costanti.js';
import { $, aggiornaTabellone, fmt, fpsIniziale, setFps } from './hud.js';
import { RUOLI, CHIAVE, STAT_NOMI, squadre } from './dati/rose.js';
import { bandiera } from './dati/bandiere.js';
import { LOGO } from './logo.js';
import { applicaSquadre, formazioneValida, formazioni } from './giocatori.js';
import { annullaCambio } from './panchina.js';
import { azzeraScelta, disegnaPanchina } from './panchinaVista.js';
import { apriRegistro } from './cronaca.js';
import { kickoff } from './regole.js';
import { allPlayers, ball, fight, game, teams } from './stato.js';
import { iconaMano } from './mano.js';
import { chiamaUomo, passaAZona } from './ia.js';
import { resetTap } from './controllo.js';
import { COMPETIZIONI, classificaGirone, creaTorneo, prossimaPartita, registraPartita, simulaBronzo } from './tornei.js';
import { applicaSchema, caricaSchema, copiaSchema } from './schemi.js';
import { inizializzaEditor, aggiornaRiepilogoStrategia } from './tattiche-menu.js';
import { aggiornaRiepilogoUomo, inizializzaUomo } from './uomo-editor.js';
import { renderTattichePausa } from './tattiche-pausa.js';

const salva=(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){ /* senza memoria si va avanti lo stesso */ } };
const leggi=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } };
for(const id of ['logoHome','logoPausa','logoFine']) $(id).innerHTML=LOGO();

// ---------- navigazione tra le schermate ----------
const VISTE={ home:'vHome', squadre:'vSquadre', impostazioni:'vImpostazioni', comandi:'vComandi', info:'vInfo', opzioni:'vOpzioni', pausa:'vPausa', panchina:'vPanchina', fine:'vFine', nazionale:'vNazionale', torneo:'vTorneo', bacheca:'vBacheca', tattiche:'vTattiche', cerimonia:'vCerimonia', strategie:'vStrategie', uomo:'vUomo' };
const storia=[];
export function vai(v,senzaStoria){
  const M=$('menu'), prima=M.dataset.vista;
  if(!senzaStoria&&prima&&prima!==v) storia.push(prima);
  M.dataset.vista=v;
  for(const [k,id] of Object.entries(VISTE)) $(id).classList.toggle('on',k===v);
  M.scrollTop=0; $(VISTE[v]).scrollTop=0;
  if(v==='home') disegnaHome();
  if(v==='nazionale') disegnaNazionali();
  if(v==='torneo') disegnaTorneo();
  if(v==='bacheca') disegnaBacheca();
  if(v==='tattiche') disegnaTattiche();
  if(v==='squadre') disegnaSquadre();
  if(v==='squadre'||v==='torneo'||v==='impostazioni'){ aggiornaRiepilogoStrategia(); aggiornaRiepilogoUomo(); }
  if(v==='panchina') disegnaPanchina();
  else azzeraScelta();
}
function indietro(){ vai(storia.pop()||(game.state==='paused'?'pausa':game.state==='over'?'fine':'home'),true); }
document.querySelectorAll('[data-va]').forEach(b=>b.addEventListener('click',()=>{ if(b.dataset.va==='squadre') preparaSingola(); vai(b.dataset.va); }));
document.querySelectorAll('[data-indietro]').forEach(b=>b.addEventListener('click',indietro));
inizializzaEditor({apri:()=>vai('strategie'),torna:()=>indietro()});
inizializzaUomo({apri:()=>vai('uomo'),torna:()=>indietro()});

// ---------- impostazioni: valori di prima, ricordati per la prossima volta ----------
function gruppo(attr,applica,chiave){
  const bottoni=[...document.querySelectorAll(`[data-${attr}]`)];
  const scegli=v=>{ for(const x of bottoni) x.classList.toggle('on',x.dataset[attr]===v); applica(v); if(chiave) salva(chiave,v); };
  for(const b of bottoni) b.onclick=()=>scegli(b.dataset[attr]);
  const v=chiave&&leggi(chiave); if(v&&bottoni.some(x=>x.dataset[attr]===v)) scegli(v);
}
// impostazioni della partita: menu a tendina (come nel concept), con i valori di prima
const TENDINE={ len:['selLen',v=>setPeriodLen(+v),'pallanuoto-durata'], diff:['selDiff',v=>setDiff(+v),'pallanuoto-difficolta'],
  arb:['selArb',v=>setArbitro(+v),'pallanuoto-arbitro'] };
// imposta('len','300'): sceglie un valore come farebbe il giocatore (lo usano anche le verifiche automatiche)
export function imposta(nome,valore){
  if(!TENDINE[nome]) return;
  const [id,applica,chiave]=TENDINE[nome], sel=$(id);
  if(![...sel.options].some(o=>o.value===String(valore))) return;
  sel.value=String(valore); applica(sel.value); salva(chiave,sel.value);
}
for(const [nome,[id,applica]] of Object.entries(TENDINE)){
  const sel=$(id); sel.onchange=()=>imposta(nome,sel.value);
  const v=leggi(TENDINE[nome][2]); if(v) imposta(nome,v); else applica(sel.value);
}
gruppo('fps',v=>setFps(v==='1'),null);
if(fpsIniziale()) document.querySelector('[data-fps="1"]').click();

// ---------- squadre ----------
const scelta=['ITA','HUN'];
let lato=0;                                   // quale card cambia toccando una squadra dell'elenco
// FORMAZIONE: i 7 che partono in acqua, scelti qui (si possono cambiare quante volte si vuole anche durante la partita:
// i cambi nella pallanuoto sono illimitati). Tocca un posto e poi un giocatore della panchina (o un altro posto) per scambiarli.
const POSTI=['Portiere','Centroboa','Ala destra','Ala sinistra','Mezzo destro','Mezzo sinistro','Punto'];
let postoScelto=null;
// dati dei tornei (dal database): gol/tiri e assist per chi gioca, parate per i portieri
const datiTornei=g=>{ const d=g.dati; if(!d) return '<small class="fm-dati">nessun dato nei tornei</small>';
  return `<small class="fm-dati">${d.partite} partite · ${d.parate!=null?`parate ${d.parate}/${d.tiriSubiti}`:`${d.gol}/${d.tiri} al tiro · ${d.assist} assist`}</small>`; };
const scheda=(g,extra)=>`<span class="ov">${g.ovr}</span><b>${g.num} ${g.nome}${iconaMano(g.mano)}</b><br>${RUOLI[g.ruolo]}${extra||''}${datiTornei(g)}`+
  `<div class="st">${CHIAVE[g.ruolo].map(k=>`<span>${STAT_NOMI[k].slice(0,3).toUpperCase()} ${g.s[k]}</span>`).join('')}</div>`;
function disegnaRosa(){
  const t=teams[0], R=t.rosa, inAcqua=t.players.map(p=>p.scheda);
  const riserve=R.filter(g=>!inAcqua.includes(g));
  $('rosa').innerHTML=`<p class="fm-aiuto fm-fonte">Giocatori, numeri, ruoli e mano dalle convocazioni vere; valutazioni stimate dalle statistiche di Mondiali 2025, Europei 2026 e Coppa del Mondo 2026.</p><p class="fm-aiuto">${postoScelto===null?'Tocca un posto per cambiare chi parte in acqua.':`Scegli chi mettere come <b>${POSTI[postoScelto]}</b> (panchina o un altro posto).`}</p>`+
    `<div class="fm-titolo">In acqua</div>`+inAcqua.map((g,i)=>`<button type="button" class="fig fm${postoScelto===i?' scelto':''}${g.campione?' camp':''}" data-posto="${i}"><i class="fm-posto">${POSTI[i]}</i>${scheda(g)}</button>`).join('')+
    `<div class="fm-titolo">Panchina</div>`+riserve.map(g=>{ const ok=postoScelto!==null&&(g.ruolo===0)===(postoScelto===0);
      return `<button type="button" class="fig ris${ok?' puo':''}${g.campione?' camp':''}" data-riserva="${g.num}">${scheda(g)}</button>`; }).join('')+
    `<button type="button" class="fm-ripristina" id="fmRipristina">Formazione di partenza</button>`;
  const salvaF=F=>{ formazioni[t.codice]=F; salva('pallanuoto-formazione2-'+t.codice,F.join(',')); postoScelto=null; applicaSquadre(scelta[0],scelta[1]); aggiornaTabellone(); disegnaRosa(); };
  const attuale=()=>t.players.map(p=>p.scheda.num);
  $('rosa').querySelectorAll('[data-posto]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.posto;
    if(postoScelto===null||postoScelto===i){ postoScelto=postoScelto===i?null:i; disegnaRosa(); return; }
    const F=attuale(); [F[postoScelto],F[i]]=[F[i],F[postoScelto]];          // scambio tra due posti (il portiere resta portiere)
    if(formazioneValida(R,F)) salvaF(F); else { postoScelto=i; disegnaRosa(); } });
  $('rosa').querySelectorAll('[data-riserva]').forEach(b=>b.onclick=()=>{ if(postoScelto===null) return;
    const F=attuale(); F[postoScelto]=+b.dataset.riserva; if(formazioneValida(R,F)) salvaF(F); });
  $('fmRipristina').onclick=()=>{ delete formazioni[t.codice]; salva('pallanuoto-formazione2-'+t.codice,''); postoScelto=null; applicaSquadre(scelta[0],scelta[1]); disegnaRosa(); };
}
// formazioni ricordate dalle volte precedenti
for(const q of squadre){ const v=leggi('pallanuoto-formazione2-'+q.codice); if(v) formazioni[q.codice]=v.split(',').map(Number); }
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

// ---------- campagne: uno slot indipendente per competizione ----------
const CHIAVE_TORNEO='pallanuoto-torneo-', CHIAVE_BACHECA='pallanuoto-bacheca';
const campagne={};
let tipoScelto='mondiali', nazionaleScelta='ITA', torneoAttivo=null, partitaTorneo=null, fineTimer=null, cerimoniaTimer=null, memoriaDisponibile=true;
function leggiJSON(k){ try{ return JSON.parse(leggi(k)); }catch(e){ return null; } }
function salvaJSON(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ memoriaDisponibile=false; return false; } }
for(const tipo of Object.keys(COMPETIZIONI)){
  const t=leggiJSON(CHIAVE_TORNEO+tipo);
  if(t&&t.tipo===tipo&&sq(t.nazionale)&&Array.isArray(t.partite)&&t.gruppi) campagne[tipo]=t;
}
let bacheca=leggiJSON(CHIAVE_BACHECA); if(!Array.isArray(bacheca)) bacheca=[];
const nome=c=>sq(c)?.nome||c;
const finito=t=>['campione','concluso','eliminato'].includes(t.stato);
const faseNome=f=>({gironi:'Prima fase a gironi',prima_fase:'Prima fase a gironi',seconda_fase:'Seconda fase a gironi',seconda:'Seconda fase a gironi',spareggi:'Spareggi',quarti:'Quarti di finale',semifinali:'Semifinali',finale:'Finale',bronzo:'Finale per il bronzo',concluso:'Torneo concluso',terminato:'Torneo concluso'}[f]||String(f||'Gironi').replaceAll('_',' '));
const sfida=m=>`${nome(m.casa)} – ${nome(m.ospite)}`;
const risultato=m=>m.golCasa==null?'Da giocare':`${m.golCasa} – ${m.golOspite}${m.rigoriCasa!=null?` (${m.rigoriCasa}–${m.rigoriOspite} dcr)`:''}`;
const esitoTorneo=t=>t.medaglia==='oro'?'Campioni!':t.medaglia==='argento'?'Medaglia d’argento':t.medaglia==='bronzo'?'Medaglia di bronzo':`${t.piazzamento||'—'}° posto`;
function salvaTorneo(t){ campagne[t.tipo]=t; salvaJSON(CHIAVE_TORNEO+t.tipo,t); }
function prossimaSalvata(t){ const m=prossimaPartita(t); salvaTorneo(t); return m; }
// Le coppe sono disegni originali del gioco, non riproduzioni dei trofei ufficiali.
let coppeDisegnate=0;
function coppa(tipo,medaglia='oro'){
  const colore=medaglia==='argento'?'#d5e4ed':medaglia==='bronzo'?'#d59a60':'#f5ce6b';
  if(medaglia!=='oro') return `<svg class="trofeo-svg medaglia-svg ${tipo}" viewBox="0 0 120 150" role="img" aria-label="Medaglia di ${medaglia} ${COMPETIZIONI[tipo].nome}"><path d="M26 8h23l22 57-18 14z" fill="#4dc7d1"/><path d="M71 8h23L67 79 49 65z" fill="#12627c"/><circle cx="60" cy="98" r="35" fill="${colore}" stroke="#fff2c0" stroke-width="2"/><circle cx="60" cy="98" r="28" fill="none" stroke="#384651" stroke-opacity=".35"/><text x="60" y="111" fill="#263440" font-size="42" font-weight="900" font-family="system-ui" text-anchor="middle">${medaglia==='argento'?'2':'3'}</text><path d="M41 121q19-13 38 0" fill="none" stroke="#fff2c0" stroke-width="2"/></svg>`;
  const gradiente=`metallo-${tipo}-${++coppeDisegnate}`;
  return `<svg class="trofeo-svg ${tipo}" viewBox="0 0 120 150" role="img" aria-label="Coppa ${COMPETIZIONI[tipo].nome}"><defs><linearGradient id="${gradiente}" x2="1" y2=".6"><stop stop-color="#fff4c1"/><stop offset=".45" stop-color="${colore}"/><stop offset="1" stop-color="#a66c23"/></linearGradient></defs><g fill="url(#${gradiente})" stroke="${colore}" stroke-width="2">${tipo==='mondiali'?'<circle cx="60" cy="35" r="25"/><path d="M37 67q23-18 46 0l-11 39H48z"/><path d="M32 30q28 15 56 0M37 48q23-14 46 0" fill="none"/><path d="M60 10q-17 25 0 50q17-25 0-50" fill="none"/>':'<path d="M38 19h44l-6 44q-2 16-16 23q-14-7-16-23z"/><path d="M39 28H23q-4 37 25 39M81 28h16q4 37-25 39" fill="none" stroke-width="7"/><path d="M54 83h12v24H54z"/>'}<path d="M45 108h30l8 14H37z"/><path d="M31 126h58v12H31z"/></g><path d="M40 91q10-9 20 0t20 0" stroke="#59e3e2" stroke-width="4" fill="none"/></svg>`;
}
function disegnaHome(){
  $('continuaTornei').innerHTML=Object.values(campagne).filter(t=>!finito(t)).map(t=>{
    const m=t.partite.find(p=>p.golCasa==null&&(p.casa===t.nazionale||p.ospite===t.nazionale));
    return `<button type="button" class="continua-torneo" data-continua="${t.tipo}"><span>${bandiera(t.nazionale)}</span><span><small>CONTINUA ${COMPETIZIONI[t.tipo].nome.toUpperCase()}</small><b>${nome(t.nazionale)}</b><em>${faseNome(t.fase)}${m?` · ${nome(m.casa===t.nazionale?m.ospite:m.casa)}`:''}</em></span><i>›</i></button>`;
  }).join('');
  $('numeroTrofei').textContent=bacheca.filter(t=>t.medaglia).length;
}
function disegnaNazionali(){
  const c=COMPETIZIONI[tipoScelto], attuale=campagne[tipoScelto];
  $('nazionaleTitolo').textContent=c.nome;
  $('formulaTorneo').textContent=tipoScelto==='mondiali'?'24 nazionali disponibili · 16 al torneo. Quattro gironi da quattro. Le prime ai quarti; seconde e terze agli spareggi. Poi la corsa alla coppa.':'16 nazionali europee. Quattro gironi da quattro. Le prime tre alla seconda fase con i risultati contro le altre qualificate. Poi semifinali, finale e bronzo.';
  $('nazionaliTorneo').innerHTML=c.codici.filter(cod=>sq(cod)).map(cod=>`<button type="button" class="nazionale-card${cod===nazionaleScelta?' on':''}" data-nazionale="${cod}" aria-pressed="${cod===nazionaleScelta}">${bandiera(cod,'band',true)}<span><b>${nome(cod)}</b><small>${cod} · ${sq(cod).forza} OVR</small></span></button>`).join('');
  $('nazionaleScelta').textContent=`Giocherai tutte le gare con ${nome(nazionaleScelta)}.${tipoScelto==='mondiali'?' La tua nazionale è sempre inclusa tra le 16 sorteggiate per fasce.':''} Le altre partite saranno simulate.`;
  $('slotEsistente').innerHTML=attuale?`<div class="slot-esistente"><span>${finito(attuale)?'Ultimo torneo':'Torneo salvato'}: <b>${nome(attuale.nazionale)}</b> · ${finito(attuale)?esitoTorneo(attuale):faseNome(attuale.fase)}</span><button type="button" data-continua="${tipoScelto}">${finito(attuale)?'Rivedi':'Continua'} ›</button></div>`:'';
}
export function creaCampagna(tipo,nazionale,seme){
  if(!COMPETIZIONI[tipo]?.codici.includes(nazionale)||!sq(nazionale)) throw new Error('Nazionale non disponibile per questa competizione');
  const semeNuovo=()=>globalThis.crypto?.getRandomValues?crypto.getRandomValues(new Uint32Array(1))[0]:Date.now();
  const t=creaTorneo(tipo,nazionale,seme??semeNuovo());
  t.id=`${tipo}-${Date.now()}-${t.seed}`; t.impostazioni={durata:$('selLen').value,difficolta:$('selDiff').value,arbitro:$('selArb').value};
  torneoAttivo=t; partitaTorneo=null; game.state='menu'; game.torneoMatch=null;
  salvaTorneo(t); apriMenu('torneo'); return t;
}
export function continuaTorneo(tipo){
  const t=campagne[tipo]; if(!t) return;
  torneoAttivo=t; partitaTorneo=null; game.state='menu'; game.torneoMatch=null;
  if(t.impostazioni){ imposta('len',t.impostazioni.durata); imposta('diff',t.impostazioni.difficolta); imposta('arb',t.impostazioni.arbitro); }
  apriMenu('torneo');
}
export function esportaSalvataggi(){ return JSON.parse(JSON.stringify({campagne,bacheca})); }
function disegnaTorneo(){
  const t=torneoAttivo; if(!t) return;
  const m=finito(t)?null:prossimaSalvata(t), finale=finito(t);
  $('torneoTitolo').textContent=COMPETIZIONI[t.tipo].nome;
  $('torneoFase').textContent=finale?'TORNEO CONCLUSO':faseNome(t.fase).toUpperCase();
  $('torneoNazionale').innerHTML=`${bandiera(t.nazionale)} ${nome(t.nazionale)}`;
  $('torneoCoppa').innerHTML=coppa(t.tipo,t.medaglia||'oro');
  $('torneoProssima').innerHTML=m?`<div><p class="soprattitolo">${faseNome(m.fase)}${m.girone?` · GIRONE ${m.girone}`:''}${m.turno?` · GIORNATA ${m.turno}`:''}</p><h2>${bandiera(m.casa)}<span>${nome(m.casa)}</span><i>VS</i><span>${nome(m.ospite)}</span>${bandiera(m.ospite)}</h2></div><span class="tag-tu">TU: ${t.nazionale}</span>`:`<div><p class="soprattitolo">${esitoTorneo(t)}</p><h2>${t.medaglia==='oro'?'IL MONDO È TUO.':t.medaglia?'UN POSTO SUL PODIO.':'IL PERCORSO SI FERMA QUI.'}</h2><p class="testo-tenue">Campione: ${nome(t.campione||t.nazionale)} · ${t.piazzamento||'—'}° posto con ${nome(t.nazionale)}</p></div>`;
  $('torneoGioca').hidden=!m;
  $('simulaBronzo').hidden=!m||m.fase!=='bronzo';
  $('torneoNota').textContent=memoriaDisponibile?(finale?'Percorso registrato nella bacheca.':t.eliminatoDalTitolo?'Resta una medaglia: gioca o simula la finale per il bronzo.':'Sorteggio e risultati salvati automaticamente dopo ogni gara.'): 'La memoria del browser non è disponibile: i progressi restano solo in questa sessione.';
  const fasi=t.tipo==='mondiali'?['gironi','spareggi','quarti','semifinali','finale']:['gironi','seconda_fase','semifinali','finale'];
  $('torneoPercorso').innerHTML=fasi.map(f=>`<div class="tappa${t.fase===f?' attuale':''}"><b>${faseNome(f)}</b><small>${t.partite.filter(p=>p.fase===f&&(p.casa===t.nazionale||p.ospite===t.nazionale)&&p.golCasa!=null).length} gare completate</small></div>`).join('');
  $('torneoGruppi').innerHTML=Object.entries(t.gruppi).map(([g,codici])=>{
    const righe=classificaGirone(t,g);
    return `<article class="girone${codici.includes(t.nazionale)?' tuo-girone':''}"><h4>GIRONE ${g}${codici.includes(t.nazionale)?'<span>LA TUA NAZIONALE</span>':''}</h4><table><thead><tr><th scope="col">Nazionale</th><th scope="col">G</th><th scope="col">DR</th><th scope="col">PT</th></tr></thead><tbody>${righe.map((r,i)=>`<tr class="${r.codice===t.nazionale?'riga-tu':''}"><th scope="row"><span>${i+1}</span>${bandiera(r.codice)} ${nome(r.codice)}</th><td>${r.giocate}</td><td>${r.differenzaReti>0?'+':''}${r.differenzaReti}</td><td><b>${r.punti}</b></td></tr>`).join('')}</tbody></table></article>`;
  }).join('');
  const partite=t.partite, fasiPresenti=[...new Set(partite.map(p=>p.fase))];
  $('torneoCalendario').innerHTML=fasiPresenti.map(f=>`<details class="calendario-fase"${f===t.fase||finale?' open':''}><summary>${faseNome(f)} <span>${partite.filter(p=>p.fase===f&&p.golCasa!=null).length}/${partite.filter(p=>p.fase===f).length}</span></summary>${partite.filter(p=>p.fase===f).map(p=>`<div class="calendario-riga${p.casa===t.nazionale||p.ospite===t.nazionale?' tua-partita':''}"><span><small>${p.girone?`Girone ${p.girone} · `:''}${p.turno?`Giornata ${p.turno}`:faseNome(p.fase)}</small>${sfida(p)}</span><b>${risultato(p)}</b></div>`).join('')}</details>`).join('');
  if(finale) archiviaTorneo(t);
}
function preparaGaraTorneo(){
  if(!torneoAttivo||finito(torneoAttivo)) return;
  const m=prossimaSalvata(torneoAttivo); if(!m) return;
  partitaTorneo=m; game.state='menu';
  scegliSquadre(torneoAttivo.nazionale,m.casa===torneoAttivo.nazionale?m.ospite:m.casa);
  document.querySelector('#vImpostazioni h2').textContent=`${COMPETIZIONI[torneoAttivo.tipo].nome} · ${faseNome(m.fase)}`;
  vai('impostazioni');
}
function preparaSingola(){
  torneoAttivo=null; partitaTorneo=null; game.torneoMatch=null; game.torneo=false; game.state='menu';
  document.querySelector('#vImpostazioni h2').textContent='Impostazioni partita';
}
function archiviaTorneo(t){
  if(!finito(t)) return;
  const id=t.id||`${t.tipo}-${t.seed}`; if(bacheca.some(v=>v.id===id)) return;
  bacheca.unshift({id,tipo:t.tipo,nazionale:t.nazionale,piazzamento:t.piazzamento,medaglia:t.medaglia,campione:t.campione,data:new Date().toISOString(),percorso:t.partite.filter(p=>p.golCasa!=null&&(p.casa===t.nazionale||p.ospite===t.nazionale)).map(p=>({...p}))});
  salvaJSON(CHIAVE_BACHECA,bacheca);
}
function disegnaBacheca(){
  $('bachecaTrofei').innerHTML=bacheca.length?bacheca.map(t=>`<article class="bacheca-trofeo ${t.medaglia||'senza-medaglia'}"><div class="premio-bacheca">${t.medaglia?coppa(t.tipo,t.medaglia):'<span class="piazzamento-bacheca">'+t.piazzamento+'°</span>'}</div><div><p class="soprattitolo">${COMPETIZIONI[t.tipo].nome} · ${new Date(t.data).toLocaleDateString('it-IT')}</p><h2>${bandiera(t.nazionale)}${nome(t.nazionale)}</h2><p class="premio-nome">${esitoTorneo(t)}</p><details><summary>Il percorso · ${t.percorso.length} partite</summary>${t.percorso.map(p=>`<div class="calendario-riga"><span><small>${faseNome(p.fase)}</small>${sfida(p)}</span><b>${risultato(p)}</b></div>`).join('')}</details></div></article>`).join(''):`<div class="bacheca-vuota">${coppa('mondiali')}<h2>La prima coppa ti aspetta.</h2><p>Completa un torneo per conservare qui nazionale, risultati e medaglie.</p><button type="button" class="azione-secondaria" data-apri-mondiali>Gioca i Mondiali ›</button></div>`;
}
document.querySelectorAll('[data-competizione]').forEach(b=>b.onclick=()=>{ tipoScelto=b.dataset.competizione; nazionaleScelta=COMPETIZIONI[tipoScelto].codici.includes(scelta[0])?scelta[0]:'ITA'; vai('nazionale'); });
$('menu').addEventListener('click',e=>{
  const continua=e.target.closest('[data-continua]'); if(continua) continuaTorneo(continua.dataset.continua);
  const nazionale=e.target.closest('[data-nazionale]'); if(nazionale){ nazionaleScelta=nazionale.dataset.nazionale; disegnaNazionali(); }
  if(e.target.closest('[data-apri-mondiali]')){ tipoScelto='mondiali'; nazionaleScelta=COMPETIZIONI.mondiali.codici.includes(scelta[0])?scelta[0]:'ITA'; vai('nazionale'); }
});
$('sorteggiaTorneo').onclick=()=>{
  const precedente=campagne[tipoScelto];
  if(precedente&&!finito(precedente)&&!window.confirm(`Sostituire il torneo ${COMPETIZIONI[tipoScelto].nome} di ${nome(precedente.nazionale)}? I progressi di questa campagna saranno persi.`)) return;
  creaCampagna(tipoScelto,nazionaleScelta);
};
$('torneoGioca').onclick=preparaGaraTorneo;
$('simulaBronzo').onclick=()=>{ if(!torneoAttivo) return; simulaBronzo(torneoAttivo); salvaTorneo(torneoAttivo); archiviaTorneo(torneoAttivo); disegnaTorneo(); if(torneoAttivo.medaglia) avviaCerimonia(torneoAttivo,'torneo'); };
document.querySelectorAll('[data-home]').forEach(b=>b.onclick=()=>{ game.state='menu'; partitaTorneo=null; game.torneoMatch=null; apriMenu('home'); });

// ---------- avvio, pausa, fine ----------
function chiudiMenu(){ $('menu').style.display='none'; storia.length=0; }
function apriMenu(v){ $('menu').style.display='flex'; storia.length=0; vai(v,true); }
function annullaSchermateFinali(){ clearTimeout(fineTimer); clearInterval(cerimoniaTimer); fineTimer=null; cerimoniaTimer=null; }
$('goBtn').onclick=()=>{
  initAudio();
  try{ const o=screen.orientation; if(o&&o.lock) o.lock('landscape').catch(()=>{}); }catch(e){ /* non supportato */ }
  if(game.state==='paused'){ game.state=game.prevState; chiudiMenu(); return; }
  newMatch();
};
$('riprendi').onclick=()=>$('goBtn').click();
$('riprendiTattiche').onclick=()=>$('goBtn').click();
$('rigioca').onclick=()=>{ if(torneoAttivo){ partitaTorneo=null; apriMenu('torneo'); }else $('goBtn').click(); };
export function togglePause(){
  if(game.state==='menu'||game.state==='over') return;
  if(game.state==='paused'){ game.state=game.prevState; chiudiMenu(); return; }
  game.prevState=game.state; game.state='paused';
  const rigori=game.rigoriFinali;
  $('pausaPunteggio').innerHTML=`<p class="soprattitolo">${torneoAttivo?`${COMPETIZIONI[torneoAttivo.tipo].nome} · ${faseNome(partitaTorneo?.fase)}`:'PARTITA SINGOLA'}</p><div class="pausa-squadre">${bandiera(teams[0].codice)}<b>${teams[0].short} <strong>${teams[0].score} – ${teams[1].score}</strong> ${teams[1].short}</b>${bandiera(teams[1].codice)}</div><div class="pausa-cronometri"><span><small>${game.period}° TEMPO</small><b>${fmt(game.clock)}</b></span><span><small>POSSESSO ${game.possTeam?.short||'—'}</small><b>${game.possTeam?Math.ceil(game.shot)+' s':'—'}</b></span>${rigori?`<span><small>SERIE DI RIGORI</small><b>${rigori.gol[0]} – ${rigori.gol[1]}</b></span>`:''}</div>`;
  $('pausaSalvataggio').textContent=torneoAttivo?'I risultati delle gare concluse sono salvati. Uscendo, questa gara ripartirà dall’inizio.':'Uscendo perderai questa gara. Puoi riprenderla finché resti in pausa.';
  apriMenu('pausa');
}
// registro degli eventi (v0.44, scelta di Ale): si apre dal menu di pausa; chiudendolo si torna alla pausa
$('vaiRegistro').onclick=()=>{ if(game.state==='paused') apriRegistro(); };
function disegnaTattiche(){
  renderTattichePausa(teams[0]);
}
$('tattichePausa').onclick=e=>{
  const b=e.target.closest('[data-tattica]'); if(!b||game.state!=='paused') return;
  const t=teams[0], i=+b.dataset.schema;
  if(b.dataset.tattica==='uomo'){
    if(game.possTeam!==t||!teams[1].players.some(p=>p.excluded)) return;
    chiamaUomo(t,i<3?i:-1);
  }
  else if(b.dataset.tattica==='attacco'){
    const difesa=t.defPlay;
    applicaSchema(t,b.dataset.schema==='personale'?caricaSchema():copiaSchema(['arco','entrata','incrocio','boa'][i]));
    t.defPlay=difesa; t.schema.difesa=difesa;
  }
  else if(i===1||i===3) passaAZona(t,i,false); else { t.defPlay=i; t.lasciato=null; }
  if(t.schema) t.schema.difesa=t.defPlay;
  aggiornaTabellone(); disegnaTattiche();
};
$('esciPartita').onclick=()=>{
  if(!window.confirm(torneoAttivo?'I risultati delle gare concluse sono salvati. La gara in corso ripartirà dall’inizio. Tornare alla home?':'La gara in corso sarà persa. Tornare alla home?')) return;
  if(torneoAttivo) salvaTorneo(torneoAttivo);
  annullaSchermateFinali(); for(const t of teams) annullaCambio(t);
  game.state='menu'; game.prevState=null; game.torneoMatch=null; partitaTorneo=null;
  apriMenu('home');
};
export function newMatch(){
  annullaSchermateFinali();
  if(partitaTorneo&&torneoAttivo){
    game.torneoMatch={id:partitaTorneo.id,tipo:torneoAttivo.tipo,nazionale:torneoAttivo.nazionale};
    torneoAttivo.impostazioni={durata:$('selLen').value,difficolta:$('selDiff').value,arbitro:$('selArb').value}; salvaTorneo(torneoAttivo);
  }else game.torneoMatch=null;
  game.torneo=!!game.torneoMatch;
  for(const t of teams) annullaCambio(t);
  applicaSquadre(teams[0].codice,teams[1].codice);
  teams[0].score=teams[1].score=0;
  Object.assign(game,{period:1,clock:PERIOD_LEN,time:0,shot:SHOT_CLOCK,possT:0,possTeam:null,prevState:null,after:null,penalty:null,penT:0,rigoriFinali:null,cambiLiberi:false,contoVisto:0});
  // I corpi vengono riutilizzati: i timer assoluti della gara precedente non devono
  // sopravvivere al ritorno del cronometro a zero (pressione, finte, esclusioni, IA).
  for(const p of allPlayers) Object.assign(p,{stamina:1,excluded:false,pf:0,cut:null,girata:null,act:null,charging:false,chargeT:0,exclUntil:0,stunUntil:0,tackleCD:0,fakeUntil:0,freeThrow:false,qte:null,
    pressatoUntil:0,turnedUntil:0,fakedUntil:0,biteUntil:0,qteDopo:0,fintaFino:0,sfondaT:0,lunge:0,aggrT:0,cinqueUntil:0,cutT:0,ricevutoT:0,arrivoPozzetto:0,contactT:0,decideT:0,reazioneT:0,
    pressatoDa:null,rientro:null,appoggio:null,daChi:null,ricevutoPassaggio:false,ricevutoCambio:false,alVolo:false,voloPronto:false,shootNext:false,fakeUsed:false,fakeCount:0,tiriDiSchiena:0,perno:false,uscendo:false,alPozzetto:false,puoRientrare:false,valutatoPozzetto:false,colpi:[],sprinting:false});
  for(const t of teams) Object.assign(t,{atkPlay:0,defPlay:2,lasciato:null,cross:false,timeouts:2,vuoleTimeout:false,parzialeSubito:0,espulsioniT:[],setteAnnunciato:false,fugaFino:0,doubleP:null,doubleUntil:0,nextDrive:0,alaConPalla:null,postiT:-1,posti:null,rallT:-1,rall:null,schema:null,schemaStato:null,aiutoStato:null,copertura:null,postiAssegnati:null});
  // Strategia scelta prima della gara: i posti restano relativi alla porta anche al cambio campo.
  applicaSchema(teams[0],caricaSchema());
  Object.assign(ball,{kind:null,target:null,shooter:null,afterShot:false,flightT:0,saveChecked:false,holdTime:0,shotPower:0,lob:false,inRete:false,daTiro:false,inUscita:false,rigore:false,cambioLato:false,toccoDifesa:null,ignora:null,skip:false,skipped:false,schizzi:0,lastTeam:null,wx:0,wy:0,wz:0}); ball.intercept.clear();
  Object.assign(fight,{active:false,v:0,boa:null,def:null,holdT:0,decT:0,foamT:0,stato:null,apertura:0,ricevibile:false});
  resetTap(); azzeraStatistiche(); aggiornaTabellone(); chiudiMenu(); kickoff();
}
export function endMatch(){
  if(game.state==='over') return;
  game.state='over';
  const a=teams[0].score, b=teams[1].score, rigori=game.rigoriFinali?.terminati?game.rigoriFinali:null;
  const vinto=rigori?rigori.vincitore===0:a>b, perso=rigori?rigori.vincitore===1:a<b;
  let premiazione=false;
  if(torneoAttivo&&partitaTorneo){
    const inCasa=partitaTorneo.casa===teams[0].codice;
    registraPartita(torneoAttivo,partitaTorneo.id,{golCasa:inCasa?a:b,golOspite:inCasa?b:a,...(rigori?{rigoriCasa:rigori.gol[inCasa?0:1],rigoriOspite:rigori.gol[inCasa?1:0]}:{})});
    salvaTorneo(torneoAttivo); archiviaTorneo(torneoAttivo);
    premiazione=finito(torneoAttivo)&&!!torneoAttivo.medaglia&&!torneoAttivo.premiazioneVista;
  }
  $('final').innerHTML=`<p class="soprattitolo">${torneoAttivo?`${COMPETIZIONI[torneoAttivo.tipo].nome} · ${faseNome(partitaTorneo?.fase)}`:'FISCHIO FINALE'}</p><div class="fin-esito">${vinto?'Vittoria!':perso?'Sconfitta':'Pareggio'}</div><div class="fin-punteggio">${bandiera(teams[0].codice)}<b>${teams[0].name} ${a} – ${b} ${teams[1].name}</b>${bandiera(teams[1].codice)}</div>${rigori?`<div class="fin-rigori">Rigori: ${rigori.gol[0]} – ${rigori.gol[1]}</div>`:''}<div class="fin-nota">${torneoAttivo?(finito(torneoAttivo)?esitoTorneo(torneoAttivo):'Risultato salvato. Scopri la prossima avversaria.'):(vinto?'Bella partita.':perso?'La prossima sfida ti aspetta.':'Una sfida alla pari.')}</div>`;
  $('rigioca').querySelector('b').textContent=torneoAttivo?'Vai al centro torneo':'Rigioca';
  $('rigioca').querySelector('small').textContent=torneoAttivo?(finito(torneoAttivo)?'Classifiche e percorso':'Risultati e prossima gara'):'Stesse squadre';
  fineTimer=setTimeout(()=>{ fineTimer=null; if(premiazione) avviaCerimonia(torneoAttivo); else apriMenu('fine'); },1500);
}
function avviaCerimonia(t,dopo='fine'){
  t.premiazioneVista=true; salvaTorneo(t);
  $('cerimoniaCompetizione').textContent=COMPETIZIONI[t.tipo].nome;
  $('cerimoniaTitolo').textContent=t.medaglia==='oro'?'CAMPIONI!':t.medaglia==='argento'?'ARGENTO!':'BRONZO!';
  $('cerimoniaSottotitolo').textContent=nome(t.nazionale)+' · '+esitoTorneo(t);
  $('cerimoniaTrofeo').innerHTML=coppa(t.tipo,t.medaglia);
  $('cerimoniaBandiera').innerHTML=bandiera(t.nazionale);
  $('vCerimonia').dataset.medaglia=t.medaglia; $('vCerimonia').dataset.atto='0';
  $('cerimoniaDidascalia').textContent='Il fischio finale. La tua nazionale sul podio.';
  const c=document.querySelector('.coriandoli'); c.innerHTML=Array.from({length:28},(_,i)=>`<i style="--x:${(i*37)%100}%;--ritardo:${(i%7)*.27}s;--giro:${i*43}deg"></i>`).join('');
  apriMenu('cerimonia');
  let atto=0;
  const chiudi=()=>{ clearInterval(cerimoniaTimer); cerimoniaTimer=null; apriMenu(dopo); };
  $('saltaCerimonia').onclick=chiudi;
  cerimoniaTimer=setInterval(()=>{ atto++; if(atto>=4){ chiudi(); return; } $('vCerimonia').dataset.atto=String(atto); $('cerimoniaDidascalia').textContent=[null,t.medaglia==='oro'?'Il capitano alza la coppa. È il vostro momento.':'La squadra riceve le medaglie.','Una nazionale. Una squadra. Un percorso da ricordare.','Il trofeo e tutti i risultati ti aspettano in bacheca.'][atto]; },2500);
}

for(const t of Object.values(campagne)) archiviaTorneo(t);
vai('home',true);

// versione del prototipo (da package.json, vedi vite.config.js): in home e in pausa, così si vede quando il gioco si aggiorna
for(const el of document.querySelectorAll('#sub, .versione-pausa')) el.textContent='Prototipo v'+__VERSIONE__;
