// Lavagne esplicative della pausa: posizioni dagli schemi e principi di markTarget in ia.js.
import { FORM, MARK, ROLES } from './costanti.js';
import { caricaSchema, copiaSchema } from './schemi.js';
import { goalX, other } from './stato.js';

const PRESET=['arco','entrata','incrocio','boa'];
const ATTACCHI=[
  ['Arco · appoggi vicini','Ali larghe, mezzi e punto collegano i lati; il boa offre il centro. Sceglilo per muovere una difesa schierata. Non parte un’entrata automatica: se il centro è chiuso, torna al punto e cambia lato.'],
  ['Entrata · taglio e copertura','Il mezzo destro (4) entra senza palla se trova spazio; un compagno resta alto. Utile contro chi si abbassa e perde il taglio. Entra un solo giocatore: se non puoi servirlo, scarica fuori; alla palla persa rientra.'],
  ['Incrocio · i mezzi cambiano lato','I mezzi (4 e 5) scambiano lato; il 5 cerca l’entrata con un compagno alto. Sceglilo per cambiare riferimenti alla marcatura. Il lato lasciato richiede copertura: se il taglio è chiuso, ricomincia da ali e punto.'],
  ['Palla al boa · servizio e scarico','Ali e mezzi larghi, punto in appoggio, boa (1) davanti alla porta. Sceglilo quando il centro può ricevere davanti al difensore. Il boa resta avanzato: evita il passaggio forzato, scarica fuori e preparati al rientro.']
];
const DIFESE=[
  ['A uomo · proteggi la porta','Ognuno segue il proprio avversario, fra lui e la porta; il punto marca il boa. Utile per controllare gli appoggi senza arretrare troppo. Se perdi l’uomo il centro si apre: rientra fra avversario e porta.'],
  ['Zona · aiuta e torna','Gli esterni si abbassano; un solo compagno autorizzato chiude la linea al boa. Sceglila se il centro avversario riceve troppo. Concedi più spazio fuori: chi aiuta torna sul suo uomo quando cambia la palla o si chiude il servizio.'],
  ['Pressing · vicino al tuo uomo','Ognuno marca stretto, circa 80 cm; il punto cerca l’anticipo sul boa. Utile per togliere appoggi facili. Espone alle entrate alle spalle: se ti superano, torna verso la porta e riprendi il tuo uomo.'],
  ['Zona a M · due linee compatte','Ali e punto bassi, mezzi più alti; un solo aiuto autorizzato può chiudere il centro. Sceglila per proteggere boa e porta. Concede il tiro da fuori a un avversario: segui il cambio di lato e torna sull’uomo dopo l’aiuto.']
];
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ruolo = i => `${i} · ${ROLES[i]}`;
const X = z => 120+z*12, Y = d => 13+d*13;
let sequenza=0;

function pallina(d,z,n,classe='tp-giocatore'){
  return `<g transform="translate(${X(z)} ${Y(d)})"><circle r="7.4" class="${classe}"/>${n?`<text text-anchor="middle" dominant-baseline="central">${n}</text>`:''}</g>`;
}
function lavagna({schema,difesa=null,superiorita=false,team=null}){
  const id=`tp-freccia-${++sequenza}`,posti=(superiorita?schema.superiorita:schema.attacco);
  let disegno='',frecce='';
  const freccia=(a,b,colore='oro')=>`<path d="M${X(a[1])} ${Y(a[0])}L${X(b[1])} ${Y(b[0])}" class="tp-freccia ${colore}" marker-end="url(#${id})"/>`;
  if(difesa===null){
    const catena=(superiorita?[2,4,5,3]:[2,4,6,5,3]).map(n=>`${X(posti[n-1][1])},${Y(posti[n-1][0])}`).join(' ');
    disegno+=`<polyline points="${catena}" class="tp-appoggi"/>`;
    if(schema.id==='incrocio'&&!superiorita) for(const i of [4,5]) frecce+=freccia(FORM[i],posti[i-1]);
    if(schema.entrata&&!superiorita){
      const origine=posti[schema.entrata-1],cut=team?.players?.[schema.entrata]?.cut;
      const dest=cut?[Math.abs(goalX(team)-cut.x),cut.z*team.dir]:[2.6,Math.sign(origine[1]||1)*1.7];
      frecce+=freccia(origine,dest);
    }else if(schema.id==='boa'&&!superiorita) frecce+=freccia(posti[3],posti[0]);
    for(let i=0;i<6;i++) disegno+=pallina(posti[i][0],posti[i][1],i+1);
  }else{
    // Situazione di lettura comune alle quattro carte: palla al mezzo destro.
    // Distanze verso porta uguali ai gap di markTarget; il punto marca il boa (MARK).
    for(let i=1;i<=6;i++) disegno+=pallina(FORM[i][0],FORM[i][1],null,'tp-avversario');
    const puntoAiuto=[FORM[4][0]+(FORM[1][0]-FORM[4][0])*.62,FORM[4][1]+(FORM[1][1]-FORM[4][1])*.62],aiuti=[];
    for(let i=1;i<=6;i++){
      const [d,z]=FORM[MARK[i]],l=Math.hypot(d,z),conPalla=MARK[i]===4;
      let gap=conPalla?.85:1;
      if(difesa===1&&i!==6) gap=conPalla?1.1:Math.min(1.8,l*.4);
      if(difesa===2) gap=.8;
      if(difesa===3) gap=conPalla?1.4:Math.min(i===4||i===5?2.4:3.4,l*.55);
      let target=[d-d/l*gap,z-z/l*gap];
      if(i===6){
        const avanti=difesa===2||difesa===3,dx=avanti?FORM[4][0]-d:-d,dz=avanti?FORM[4][1]-z:-z,n=Math.hypot(dx,dz)||1;
        target=[d+dx/n*.96,z+dz/n*.96];
      }
      disegno+=`<path d="M${X(z)} ${Y(d)}L${X(target[1])} ${Y(target[0])}" class="tp-marcatura"/>`;
      disegno+=pallina(target[0],target[1],i);
      const distanzaAiuto=Math.hypot(target[0]-puntoAiuto[0],target[1]-puntoAiuto[1]);
      if((difesa===1||difesa===3)&&i!==6&&MARK[i]!==4&&schema.aiuti.includes(i)&&distanzaAiuto<5) aiuti.push({target,distanzaAiuto});
    }
    if(aiuti.length) frecce+=freccia(aiuti.sort((a,b)=>a.distanzaAiuto-b.distanzaAiuto)[0].target,puntoAiuto);
    disegno+=`<circle cx="${X(FORM[4][1])+9}" cy="${Y(FORM[4][0])-6}" r="3.8" class="tp-palla"/>`;
  }
  return `<svg viewBox="0 0 240 160" role="img" aria-label="${difesa===null?'Posizioni e indicazioni di attacco':'Difesa schierata con palla al mezzo destro avversario'}"><defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#ffdb92"/></marker></defs><rect x="5" y="6" width="230" height="149" rx="3" class="tp-acqua"/><path d="M102 7V2H138V7" class="tp-porta"/><path d="M5 39H235M5 91H235" class="tp-linee"/>${frecce}${disegno}</svg>`;
}
function compiti(schema,superiorita=false){
  const entrata=superiorita?'Centroboa (1) e punto (6) cercano i pali, ali e mezzi fanno girare la palla. L’entrata di parità è sospesa: usa il lato libero e non forzare il centro.':schema.entrata?`${ROLES[schema.entrata]} (${schema.entrata}) cerca l’unica entrata senza palla; un compagno resta alto. Se il taglio è chiuso, ricomincia dagli appoggi esterni.`:'Boa al centro, ali larghe, mezzi e punto in appoggio. Senza entrata automatica, cerca il lato libero e scarica fuori se il centro è chiuso.';
  return `${entrata} Circolazione ${schema.passaggi==='vicini'?'tra compagni vicini':schema.passaggi==='rapidi'?'con più cambi di lato':'equilibrata'}.`;
}
function stessaStrategia(a,b){
  if(!a||!b) return false;
  return ['id','nome','attacco','superiorita','entrata','passaggi','aiuti'].every(k=>JSON.stringify(a[k])===JSON.stringify(b[k]));
}
function carta(tipo,indice,titolo,testo,svg,attiva,extra=''){
  return `<button type="button" class="tattica tp-carta${attiva?' on':''}${extra?' tp-personale':''}" data-tattica="${tipo}" data-schema="${indice}" aria-pressed="${attiva}"><span class="tp-miniatura" aria-hidden="true">${svg}</span><span class="tp-testo"><small>${attiva?'IN USO':extra||'SCEGLI ALLA RIPRESA'}</small><b>${esc(titolo)}</b><span class="tp-descrizione">${esc(testo)}</span></span></button>`;
}

export function renderTattichePausa(team){
  const salvata=caricaSchema(),attuale=team.schema||copiaSchema(PRESET[team.atkPlay]||'arco');
  const personale=!PRESET.includes(attuale.id)&&stessaStrategia(attuale,salvata);
  const superiorita=other(team)?.players.some(p=>p.excluded)||false;
  const attacco=ATTACCHI.map(([titolo,testo],i)=>carta('attacco',i,titolo,testo,lavagna({schema:copiaSchema(PRESET[i]),superiorita}),!personale&&attuale.id===PRESET[i])).join('');
  const prepartita=carta('attacco','personale',`Piano prepartita: ${salvata.nome}`,compiti(salvata,superiorita),lavagna({schema:salvata,superiorita}),personale,'SALVATO NEL BROWSER');
  const difesa=DIFESE.map(([titolo,testo],i)=>carta('difesa',i,titolo,testo,lavagna({schema:attuale,difesa:i}),team.defPlay===i)).join('');
  const tagliante=team.players?.find(p=>p.cut),copertura=team.copertura?.chi;
  const dettaglio=tagliante?`Entrata in corso: ${ruolo(tagliante.i)}.${copertura?` ${ruolo(copertura.i)} rimane alto a coprire.`:''}`:compiti(attuale,superiorita);
  const helper=team.aiutoStato?.p;
  document.getElementById('tattichePausa').innerHTML=`
    <p class="tp-nota">Scegli come attaccare e come difendere. I compagni raggiungono i posti nuotando; alla palla persa rientrano verso la propria porta. La copertura di un’entrata aiuta il rientro, ma non ferma da sola una controfuga.</p>
    <section class="scelte-tattiche tp-scelte"><h3><span>CON PALLA</span> Come costruire l’attacco</h3><div>${attacco}${prepartita}</div></section>
    <section class="scelte-tattiche tp-scelte"><h3><span>SENZA PALLA</span> Come proteggere la porta</h3><div>${difesa}</div></section>
    <details class="tp-dettaglio"><summary>Vedi la lavagna e i compiti attuali <span aria-hidden="true">＋</span></summary><div class="tp-lavagne"><figure><figcaption>Con palla · ${superiorita?'6 contro 5':'Parità'}</figcaption>${lavagna({schema:attuale,superiorita,team})}<p>${esc(dettaglio)}</p></figure><figure><figcaption>Senza palla · ${esc(DIFESE[team.defPlay][0])}</figcaption>${lavagna({schema:attuale,difesa:team.defPlay})}<p>${esc(DIFESE[team.defPlay][1])}${helper?` Aiuto assegnato a ${esc(ruolo(helper.i))}.`:''}</p></figure></div><p class="tp-legenda">Numeri = posti tattici, non cuffie. ${ROLES.slice(1).map((nome,i)=>`<span><b>${i+1}</b> ${esc(nome)}</span>`).join('')}</p><p class="tp-chiave">Bianco: i tuoi posti · Cerchi vuoti: avversari · Giallo: palla e indicazioni. Le difese mostrano una situazione con palla al mezzo destro: i posti si adattano alla palla. Con un espulso, la squadra passa alla difesa di inferiorità.</p></details>`;
}
