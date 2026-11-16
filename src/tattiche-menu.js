// Editor prepartita: la bozza usa gli stessi dati delle posizioni e dei compiti dell'IA.
import { DEFN } from './costanti.js';
import { SCHEMI_PRESET, caricaSchema, copiaSchema, nomePosizione, numeroPosizione, salvaSchema, validaSchema } from './schemi.js';

const $ = id => document.getElementById(id);
const RUOLI = [1,2,3,4,5,6];
const COMPITI = [
  'Davanti alla porta, cerca una linea di ricezione davanti al marcatore. Se arriva un aiuto, offre lo scarico agli esterni.',
  'Tiene largo il lato destro vicino alla porta e offre lo scarico. Collega la palla alla Pos. 2, più fuori.',
  'Tiene largo il lato sinistro vicino alla porta e offre lo scarico. Collega la palla alla Pos. 4, più fuori.',
  'Collega la Pos. 1 a destra e la Pos. 3 al centro; cerca il servizio al centroboa. Può entrare se il compito è assegnato.',
  'Collega la Pos. 5 a sinistra e la Pos. 3 al centro; cerca il servizio al centroboa. Può entrare se il compito è assegnato.',
  'Collega i due lati e offre un appoggio alto per ricominciare. Copre le entrate; in difesa marca il centroboa avversario.'
];
const NOTE_PASSAGGI = {
  vicini:'I compagni cercano soprattutto l’appoggio vicino. Utile per tenere le distanze; per spostare la difesa servono più passaggi.',
  equilibrati:'I compagni alternano appoggi vicini e cambi di lato secondo lo spazio: cerca il centro quando la linea si apre.',
  rapidi:'I compagni cercano più spesso il cambio di lato su linea aperta. Utile contro la zona; se la diagonale è chiusa, usa l’appoggio vicino.'
};
const NOTE_DIFESE = [
  'A uomo: ogni difensore segue il proprio avversario verso la porta; la Pos. 3 marca il centroboa. Se perdi la marcatura, rientra fra uomo e porta.',
  'Zona: gli esterni si abbassano e un aiuto può chiudere il centro. Protegge il boa, ma lascia più spazio al tiro da fuori; dopo l’aiuto torna sull’uomo.',
  'Pressing: marcature strette e anticipo sul boa per togliere appoggi facili. Attenzione alle entrate alle spalle: se ti superano, rientra verso la porta.',
  'Zona a M: le Pos. 1, 3 e 5 restano basse, le Pos. 2 e 4 più alte. Protegge il centro e concede più spazio fuori. Recupera l’uomo dopo l’aiuto.'
];
let bozza = null, salvata = null, fase = 'attacco', ruolo = 1, ritorno = 'squadre';
let navigazione = null, trascinamento = null, inizializzato = false;
const x = z => 300 + z * 29.8;
const y = d => 28 + d * 29;
const ruoloNome = i => nomePosizione(i,fase==='superiorita');

function opzione(select, valore, testo){
  const option=document.createElement('option'); option.value=valore; option.textContent=testo; select.append(option);
}
function messaggio(testo=''){
  $('schemaMessaggio').textContent=testo; $('schemaMessaggio').hidden=!testo;
}
function modificata(){
  bozza.id='personale';
  bozza.descrizione='Posizioni, circolazione e compiti scelti da te.';
  $('schemaPreset').value='personale';
  messaggio();
}
function sporca(){ return JSON.stringify(bozza)!==JSON.stringify(salvata); }
function aggiornaStato(){
  const dirty=sporca();
  $('schemaStato').textContent=dirty?'Bozza da salvare':'Piano salvato';
  $('schemaStato').classList.toggle('bozza',dirty);
  $('schemaRipristina').disabled=!dirty;
  $('schemaDescrizione').textContent=bozza.descrizione;
}

function preparaLavagna(){
  $('schemaPiscina').innerHTML=`
    <defs><linearGradient id="schemaAcqua" x2="0" y2="1"><stop stop-color="#155263"/><stop offset="1" stop-color="#0b3348"/></linearGradient><marker id="schemaFreccia" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#ffd67b"/></marker></defs>
    <rect x="23" y="20" width="554" height="316" rx="5" fill="url(#schemaAcqua)" stroke="#8be5eb" stroke-opacity=".35"/>
    <path d="M23 99H577M23 178H577M23 257H577" stroke="#a8eff0" stroke-opacity=".045" stroke-width="38"/>
    <rect x="193.3" y="28" width="213.4" height="58" fill="#f57c7620"/>
    <path d="M23 86H577" stroke="#f4a293" stroke-opacity=".7" stroke-dasharray="5 6"/>
    <path d="M23 202H577" stroke="#f3db93" stroke-opacity=".55" stroke-dasharray="5 6"/>
    <path d="M300 28V336" stroke="#b8e4eb" stroke-opacity=".12" stroke-dasharray="3 7"/>
    <path d="M255.3 25V11H344.7V25" fill="#071a24" stroke="#f4f8f9" stroke-width="5"/>
    <circle cx="300" cy="38" r="10" fill="#ed746e" stroke="#ffd5d2" stroke-width="2"/>
    <text x="31" y="79" class="schema-misura">2 m</text><text x="31" y="195" class="schema-misura">6 m</text>
    <text x="32" y="328" class="schema-lato">SINISTRA −</text><text x="568" y="328" text-anchor="end" class="schema-lato">+ DESTRA</text>
    <polyline id="schemaTraccia" fill="none" stroke="#8fe9e4" stroke-opacity=".25" stroke-width="2" stroke-dasharray="5 6"/>
    <path id="schemaTaglio" fill="none" stroke="#ffd67b" stroke-width="3" stroke-dasharray="5 5" marker-end="url(#schemaFreccia)"/>
    ${RUOLI.map(i=>`<g data-schema-ruolo="${i}" role="button" tabindex="${i===1?0:-1}"><title>${ruoloNome(i)}</title><circle class="schema-tocco" r="39" fill="transparent"/><circle class="schema-posto-ombra" r="22" cy="3"/><circle class="schema-posto" r="22"/><text text-anchor="middle" dominant-baseline="central">${numeroPosizione(i)}</text></g>`).join('')}`;
}

function aggiornaLavagna(){
  const posti=bozza[fase];
  for(const marker of $('schemaPiscina').querySelectorAll('[data-schema-ruolo]')){
    const n=Number(marker.dataset.schemaRuolo), [d,z]=posti[n-1];
    marker.setAttribute('transform',`translate(${x(z)} ${y(d)})`);
    marker.classList.toggle('scelto',n===ruolo);
    marker.classList.toggle('entra',n===bozza.entrata);
    marker.setAttribute('tabindex',n===ruolo?'0':'-1');
    marker.setAttribute('aria-pressed',n===ruolo?'true':'false');
    marker.setAttribute('aria-label',`${ruoloNome(n)}, ${d} metri dalla porta, lato ${z}. Frecce per spostare.`);
    marker.querySelector('title').textContent=ruoloNome(n);
    marker.querySelector('text').textContent=numeroPosizione(n,fase==='superiorita');
  }
  const ordine=fase==='superiorita'?[2,4,5,3]:[2,4,6,5,3];
  $('schemaTraccia').setAttribute('points',ordine.map(n=>`${x(posti[n-1][1])},${y(posti[n-1][0])}`).join(' '));
  const taglio=$('schemaTaglio'); taglio.hidden=!bozza.entrata;
  taglio.style.display=bozza.entrata?'':'none';
  if(bozza.entrata){
    const [d,z]=posti[bozza.entrata-1];
    taglio.setAttribute('d',`M${x(z)} ${y(d)} Q${x(z*.8)} ${y(Math.max(2.3,d-1.4))} ${x(z*.35)} ${y(2.3)}`);
  }
}

function aggiornaPosizione(){
  const [d,z]=bozza[fase][ruolo-1];
  const sup=fase==='superiorita';
  $('schemaGiocatore').replaceChildren();
  for(const i of [...RUOLI].sort((a,b)=>numeroPosizione(a,sup)-numeroPosizione(b,sup))) opzione($('schemaGiocatore'),String(i),ruoloNome(i));
  $('schemaGiocatore').value=String(ruolo);
  $('schemaDistanza').value=String(d); $('schemaLarghezza').value=String(z);
  $('schemaDistanza').min=Math.abs(z)<3.58?'2.1':'1';
  $('schemaRuoloNumero').textContent=`Pos. ${numeroPosizione(ruolo,sup)}`;
  $('schemaRuoloCompito').textContent=fase==='superiorita'?`Questi sono i posti base del 6 contro 5, usati finché non chiami uno schema dalla sezione «Uomo in più». ${d<=2.7&&Math.abs(z)<3.2?'Da questo posto cerca la ricezione sul palo; se è coperto, la palla resta agli esterni.':'Da questo posto offre un appoggio sul perimetro e cerca il lato libero.'}`:`${COMPITI[ruolo-1]}${bozza.entrata===ruolo?' Entrata assegnata: taglia senza palla quando si apre spazio; un compagno resta alto. Se non ricevi, torna a offrire un appoggio.':''}`;
  $('schemaFaseCorrente').textContent=fase==='attacco'?'PARITÀ · 6 CONTRO 6':'SUPERIORITÀ · POSTI BASE';
  for(const tab of document.querySelectorAll('[data-fase-schema]')){
    const attiva=tab.dataset.faseSchema===fase;
    tab.setAttribute('aria-selected',String(attiva)); tab.tabIndex=attiva?0:-1;
  }
  $('schemaPannello').setAttribute('aria-labelledby',fase==='attacco'?'schemaParita':'schemaSuperiorita');
  aggiornaLavagna();
}

function aggiornaCompiti(){
  $('schemaEntrata').value=String(bozza.entrata);
  $('schemaDifesa').value=String(bozza.difesa);
  $('schemaPassaggi').value=bozza.passaggi;
  $('schemaPassaggiNota').textContent=NOTE_PASSAGGI[bozza.passaggi];
  $('schemaDifesaNota').textContent=NOTE_DIFESE[bozza.difesa];
  $('schemaCompiti').textContent=bozza.entrata?`Entra ${nomePosizione(bozza.entrata)}, senza palla. Gli altri mantengono gli appoggi; un compagno resta alto a coprire. Se il taglio è chiuso, scarica fuori. Il 6 contro 5 usa una numerazione e sei posti dedicati.`:'Nessuna entrata automatica: centroboa davanti alla porta, due appoggi per lato e Pos. 3 al centro. Se il centro è chiuso, ricomincia dal lato libero. Alla palla persa tutti rientrano.';
  for(const input of $('schemaAiuti').querySelectorAll('input')) input.checked=bozza.aiuti.includes(Number(input.value));
}

function aggiornaTutto(){
  $('schemaNome').value=bozza.nome;
  $('schemaPreset').value=SCHEMI_PRESET.some(s=>s.id===bozza.id)?bozza.id:'personale';
  aggiornaCompiti(); aggiornaPosizione(); aggiornaStato();
}

function sposta(d,z){
  if(!Number.isFinite(d)||!Number.isFinite(z)) return;
  z=Math.round(Math.max(-8.8,Math.min(8.8,z))*10)/10;
  d=Math.round(Math.max(Math.abs(z)<3.58?2.1:1,Math.min(10,d))*10)/10;
  const prima=bozza[fase][ruolo-1];
  if(prima[0]===d&&prima[1]===z) return;
  modificata(); bozza[fase][ruolo-1]=[d,z]; aggiornaPosizione(); aggiornaStato();
}

function trascina(event){
  const svg=$('schemaPiscina'), punto=svg.createSVGPoint();
  punto.x=event.clientX; punto.y=event.clientY;
  const matrix=svg.getScreenCTM(); if(!matrix) return;
  const p=punto.matrixTransform(matrix.inverse());
  sposta((p.y-28)/29,(p.x-300)/29.8);
}

export function aggiornaRiepilogoStrategia(){
  const schema=caricaSchema();
  for(const id of ['schemaSquadre','schemaTorneo','schemaImpostazioni']) if($(id)) $(id).textContent=`${schema.nome} · ${DEFN[schema.difesa]}`;
}

export function mostraEditor(opzioni={}){
  if(!inizializzato) return;
  ritorno=opzioni.ritorno||'squadre';
  salvata=caricaSchema(); bozza=copiaSchema(salvata); fase='attacco'; ruolo=1;
  messaggio(); aggiornaTutto(); navigazione.apri();
}

export function inizializzaEditor({apri,torna}){
  if(inizializzato) return;
  inizializzato=true; navigazione={apri,torna};
  opzione($('schemaPreset'),'personale','La mia strategia');
  for(const schema of SCHEMI_PRESET) opzione($('schemaPreset'),schema.id,schema.nome);
  opzione($('schemaEntrata'),'0','Nessuna entrata automatica');
  [...RUOLI].sort((a,b)=>numeroPosizione(a)-numeroPosizione(b)).forEach(i=>{
    opzione($('schemaEntrata'),String(i),nomePosizione(i));
    const label=document.createElement('label'), input=document.createElement('input'), testo=document.createElement('span');
    input.type='checkbox'; input.value=String(i); input.id=`schemaAiuto${i}`;
    testo.textContent=nomePosizione(i); label.append(input,testo); $('schemaAiuti').append(label);
  });
  DEFN.forEach((nome,i)=>opzione($('schemaDifesa'),String(i),nome));
  preparaLavagna(); aggiornaRiepilogoStrategia();
  for(const [id,vista] of [['btStrategieSquadre','squadre'],['btStrategieTorneo','torneo'],['btStrategieImpostazioni','impostazioni']]) $(id).onclick=()=>mostraEditor({ritorno:vista});
  $('schemaIndietro').onclick=()=>navigazione.torna(ritorno);
  $('schemaNuova').onclick=()=>{
    modificata(); bozza.nome='La mia strategia'; aggiornaTutto(); $('schemaNome').focus(); $('schemaNome').select();
  };
  $('schemaRipristina').onclick=()=>{ bozza=copiaSchema(salvata); messaggio(); aggiornaTutto(); };
  $('schemaPreset').onchange=()=>{
    const id=$('schemaPreset').value;
    bozza=id==='personale'?copiaSchema(salvata):copiaSchema(id);
    if(id==='personale'&&bozza.id!=='personale'){ bozza.id='personale'; bozza.nome='La mia strategia'; }
    messaggio(); aggiornaTutto();
  };
  $('schemaNome').oninput=()=>{ modificata(); bozza.nome=$('schemaNome').value; aggiornaStato(); };
  $('schemaGiocatore').onchange=()=>{ ruolo=Number($('schemaGiocatore').value); aggiornaPosizione(); };
  for(const tab of document.querySelectorAll('[data-fase-schema]')){
    tab.onclick=()=>{ fase=tab.dataset.faseSchema; aggiornaPosizione(); };
    tab.onkeydown=event=>{
      if(!['ArrowLeft','ArrowRight'].includes(event.key)) return;
      event.preventDefault(); fase=fase==='attacco'?'superiorita':'attacco'; aggiornaPosizione();
      $(fase==='attacco'?'schemaParita':'schemaSuperiorita').focus();
    };
  }
  const coordinate=()=>sposta($('schemaDistanza').valueAsNumber,$('schemaLarghezza').valueAsNumber);
  $('schemaDistanza').onchange=coordinate; $('schemaLarghezza').onchange=coordinate;
  for(const [id,chiave,numerico] of [['schemaEntrata','entrata',true],['schemaDifesa','difesa',true],['schemaPassaggi','passaggi',false]]) $(id).onchange=()=>{
    modificata(); bozza[chiave]=numerico?Number($(id).value):$(id).value;
    aggiornaCompiti(); aggiornaPosizione(); aggiornaStato();
  };
  $('schemaAiuti').onchange=()=>{
    modificata(); bozza.aiuti=[...$('schemaAiuti').querySelectorAll('input:checked')].map(input=>Number(input.value)); aggiornaStato();
  };
  const svg=$('schemaPiscina');
  svg.onpointerdown=event=>{
    const marker=event.target.closest('[data-schema-ruolo]'); if(!marker) return;
    event.preventDefault(); ruolo=Number(marker.dataset.schemaRuolo); trascinamento=event.pointerId;
    svg.setPointerCapture(event.pointerId); aggiornaPosizione();
  };
  svg.onpointermove=event=>{ if(trascinamento===event.pointerId){ event.preventDefault(); trascina(event); } };
  svg.onpointerup=event=>{ if(trascinamento===event.pointerId){ trascinamento=null; if(svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId); } };
  svg.onpointercancel=svg.onlostpointercapture=()=>{ trascinamento=null; };
  svg.onkeydown=event=>{
    const marker=event.target.closest('[data-schema-ruolo]'); if(!marker) return;
    ruolo=Number(marker.dataset.schemaRuolo);
    if(['Enter',' '].includes(event.key)){ event.preventDefault(); aggiornaPosizione(); return; }
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault(); const [d,z]=bozza[fase][ruolo-1], passo=event.shiftKey?.5:.1;
    sposta(d+(event.key==='ArrowUp'?-passo:event.key==='ArrowDown'?passo:0),z+(event.key==='ArrowLeft'?-passo:event.key==='ArrowRight'?passo:0));
  };
  $('schemaSalva').onclick=()=>{
    if(!Number.isFinite($('schemaDistanza').valueAsNumber)||!Number.isFinite($('schemaLarghezza').valueAsNumber)){
      messaggio('Inserisci due distanze valide prima di salvare la strategia.');
      (!Number.isFinite($('schemaDistanza').valueAsNumber)?$('schemaDistanza'):$('schemaLarghezza')).focus(); return;
    }
    coordinate();
    bozza.nome=$('schemaNome').value.trim();
    if(!bozza.nome){ messaggio('Dai un nome alla strategia prima di salvarla.'); $('schemaNome').focus(); return; }
    const schema=validaSchema(bozza);
    if(!schema){ messaggio('Controlla le posizioni e i compiti: la strategia non è ancora valida.'); return; }
    if(!salvaSchema(schema)){ messaggio('Il browser non consente il salvataggio. La bozza resta qui: abilita la memoria del sito e riprova.'); return; }
    salvata=copiaSchema(schema); aggiornaRiepilogoStrategia(); navigazione.torna(ritorno);
  };
}
