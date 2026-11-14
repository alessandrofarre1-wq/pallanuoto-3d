// Campagne maschili: formula Singapore 2025 / Belgrado 2026, regole gara WA 2026.
// Lo stato contiene solo dati JSON. Le funzioni lo aggiornano sul posto; consultare
// la prossima gara è idempotente e non risimula mai un risultato già registrato.
import dati from './dati/squadre.json';

const definisci=(nome,fasce)=>({ nome,fasce,codici:fasce.flat(),partecipanti:fasce.flat() });
export const COMPETIZIONI={
  mondiali:definisci('Mondiali',[
    ['SRB','CRO','USA','ESP'], ['GRE','HUN','ITA','BRA'],
    ['MNE','ROU','AUS','CAN'], ['JPN','CHN','RSA','SGP'],
  ]),
  europei:definisci('Europei',[
    ['ESP','CRO','ITA','HUN'], ['GRE','MNE','SRB','ROU'],
    ['NED','SVK','GEO','FRA'], ['SLO','TUR','MLT','ISR'],
  ]),
};
const forza=Object.fromEntries(dati.squadre.map(s=>[s.codice,s.forza]));
const completata=p=>Number.isInteger(p.golCasa)&&Number.isInteger(p.golOspite);
const propria=(t,p)=>p.casa===t.nazionale||p.ospite===t.nazionale;
const vincitrice=p=>p.golCasa===p.golOspite
  ? (p.rigoriCasa>p.rigoriOspite?p.casa:p.ospite)
  : (p.golCasa>p.golOspite?p.casa:p.ospite);
const perdente=p=>vincitrice(p)===p.casa?p.ospite:p.casa;
const hash=s=>{ let h=2166136261; for(const c of String(s)){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; };
function casuale(t){
  // Mulberry32 indipendente dal caso della partita: salvare rng conserva il seguito.
  t.rng=(t.rng+0x6D2B79F5)>>>0;
  let x=t.rng; x=Math.imul(x^(x>>>15),x|1); x^=x+Math.imul(x^(x>>>7),x|61);
  return ((x^(x>>>14))>>>0)/4294967296;
}
function mescola(t,elementi){
  const a=[...elementi];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(casuale(t)*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function aggiungi(t,casa,ospite,fase,girone=null,turno=1){
  const p={id:`${t.tipo}-${t.partite.length+1}`,casa,ospite,fase,girone,turno,
    golCasa:null,golOspite:null,rigoriCasa:null,rigoriOspite:null};
  t.partite.push(p); return p;
}
function gruppo(t,codice,codici){
  t.gruppi[codice]=[...codici];
  // Una moneta salvata, mai un nuovo lancio aprendo o ricaricando la classifica.
  t.sorteggiParita[codice]=mescola(t,codici);
}
function calendarioGirone(t,codice){
  const q=t.gruppi[codice];
  for(const [turno,coppie] of [ [[0,3],[1,2]], [[0,2],[3,1]], [[0,1],[2,3]] ].entries()){
    for(const [a,b] of coppie) aggiungi(t,q[a],q[b],'gironi',codice,turno+1);
  }
}

/** Crea e salva sorteggio per fasce, calendario e sequenza casuale autonoma. */
export function creaTorneo(tipo,nazionale,seme=Date.now()){
  const c=COMPETIZIONI[tipo];
  if(!c) throw new Error('Competizione sconosciuta');
  if(!c.codici.includes(nazionale)) throw new Error('Nazionale non ammessa alla competizione');
  const seed=typeof seme==='number'&&Number.isFinite(seme)?seme>>>0:hash(seme);
  const t={versione:1,tipo,nazionale,seed,rng:seed,fase:'gironi',faseAttiva:'gironi',
    stato:'in_corso',eliminatoDalTitolo:false,gruppi:{},partite:[],sorteggiParita:{},
    piazzamenti:{},piazzamento:null,medaglia:null,campione:null};
  const estrazioni=c.fasce.map(f=>mescola(t,f));
  for(const [i,g] of ['A','B','C','D'].entries()) gruppo(t,g,estrazioni.map(f=>f[i]));
  for(const g of ['A','B','C','D']) calendarioGirone(t,g);
  return t;
}

function punti(p,codice){
  if(!completata(p)) return 0;
  const v=vincitrice(p)===codice;
  return p.golCasa===p.golOspite?(v?2:1):(v?3:0);
}
function riepilogo(codici,partite){
  const righe=Object.fromEntries(codici.map(codice=>[codice,{codice,punti:0,giocate:0,
    vinte:0,perse:0,golFatti:0,golSubiti:0,differenzaReti:0}]));
  for(const p of partite){
    if(!completata(p)) continue;
    for(const [c,gf,gs] of [[p.casa,p.golCasa,p.golOspite],[p.ospite,p.golOspite,p.golCasa]]){
      const r=righe[c]; if(!r) continue;
      r.giocate++; r.punti+=punti(p,c); r.golFatti+=gf; r.golSubiti+=gs;
      if(vincitrice(p)===c) r.vinte++; else r.perse++;
      r.differenzaReti=r.golFatti-r.golSubiti;
    }
  }
  return righe;
}
function separa(righe,valore){
  const ordinate=[...righe].sort((a,b)=>valore(b)-valore(a)), gruppi=[];
  for(const r of ordinate){
    const ultimo=gruppi.at(-1);
    if(ultimo&&valore(ultimo[0])===valore(r)) ultimo.push(r); else gruppi.push([r]);
  }
  return gruppi;
}
function criterio(blocchi,valore){ return blocchi.flatMap(b=>separa(b,valore)); }
function sciogliParita(t,g,righe,partite){
  if(righe.length<2) return righe;
  const codici=righe.map(r=>r.codice);
  const diretti=partite.filter(p=>codici.includes(p.casa)&&codici.includes(p.ospite));
  const mini=riepilogo(codici,diretti);
  const monete=t.sorteggiParita?.[g]||[...t.gruppi[g]].sort((a,b)=>hash(`${t.seed}:${g}:${a}`)-hash(`${t.seed}:${g}:${b}`));
  const moneta=b=>[...b].sort((a,b)=>monete.indexOf(a.codice)-monete.indexOf(b.codice));
  let blocchi=separa(righe,r=>mini[r.codice].punti);
  if(righe.length===2){
    // WA Appendix 8 §1.3.3: niente differenza reti generale per due squadre.
    blocchi=criterio(blocchi,r=>mini[r.codice].differenzaReti);
    return blocchi.flatMap(moneta);
  }
  // §1.3.4: non si torna al criterio a due se una parità a tre si riduce a due.
  blocchi=criterio(blocchi,r=>r.differenzaReti);
  blocchi=criterio(blocchi,r=>r.golFatti);
  const ordinate=[];
  for(const blocco of blocchi){
    let restanti=[blocco],i=0;
    while(restanti.length){
      // Le posizioni appena risolte diventano a loro volta riferimenti: p.es.
      // dopo la prima, una seconda squadra può essere determinata mentre la
      // terza e la quarta restano pari (§1.3.4.4.4).
      while(restanti[0]?.length===1) ordinate.push(...restanti.shift());
      if(!restanti.length) break;
      const ref=ordinate[i];
      if(!ref){ ordinate.push(...moneta(restanti.shift())); continue; }
      const contro=riepilogo(codici,partite.filter(p=>p.casa===ref.codice||p.ospite===ref.codice));
      restanti=criterio(restanti,r=>contro[r.codice].punti);
      if(i===0){
        restanti=criterio(restanti,r=>contro[r.codice].differenzaReti);
        restanti=criterio(restanti,r=>contro[r.codice].golFatti);
      }
      i++;
    }
  }
  return ordinate;
}

/** Classifica WA 2026, Appendix 8; i rigori non aumentano gol o differenza reti. */
export function classificaGirone(t,codice){
  const q=t.gruppi[codice]; if(!q) return [];
  const ids=t.riportate?.[codice]||[];
  const partite=t.partite.filter(p=>p.girone===codice||ids.includes(p.id));
  const righe=Object.values(riepilogo(q,partite));
  return separa(righe,r=>r.punti).flatMap(b=>sciogliParita(t,codice,b,partite))
    .map((r,i)=>({...r,posizione:i+1}));
}

function poisson(t,media){
  const limite=Math.exp(-media); let k=0,p=1;
  do{ k++; p*=casuale(t); }while(p>limite);
  return k-1;
}
function simula(t,p){
  if(completata(p)) return;
  const scarto=((forza[p.casa]??65)-(forza[p.ospite]??65))/5;
  // Attorno a 12 gol per squadra, scarto da forza + giornata condivisa.
  const ritmo=0.8+casuale(t)*0.4;
  p.golCasa=poisson(t,Math.max(3,12+scarto)*ritmo);
  p.golOspite=poisson(t,Math.max(3,12-scarto)*ritmo);
  if(p.golCasa===p.golOspite){
    p.rigoriCasa=0; p.rigoriOspite=0;
    const a=0.76+Math.max(-0.08,Math.min(0.08,scarto*0.015));
    const b=1.52-a;
    for(let i=0;i<5;i++){
      if(casuale(t)<a) p.rigoriCasa++;
      if(casuale(t)<b) p.rigoriOspite++;
      if(Math.abs(p.rigoriCasa-p.rigoriOspite)>4-i) return;
    }
    while(p.rigoriCasa===p.rigoriOspite){
      if(casuale(t)<a) p.rigoriCasa++;
      if(casuale(t)<b) p.rigoriOspite++;
    }
  }
}
function piazza(t,codice,posizione){ t.piazzamenti[codice]=posizione; }
function piazzamentoDue(t,casa,ospite,posto){
  const p=aggiungi(t,casa,ospite,'piazzamenti',null,posto);
  simula(t,p); piazza(t,vincitrice(p),posto); piazza(t,perdente(p),posto+1);
}
function piazzamentoQuattro(t,q,posto){
  const a=aggiungi(t,q[0],q[1],'piazzamenti',null,posto);
  const b=aggiungi(t,q[2],q[3],'piazzamenti',null,posto);
  simula(t,a); simula(t,b);
  piazzamentoDue(t,vincitrice(a),vincitrice(b),posto);
  piazzamentoDue(t,perdente(a),perdente(b),posto+2);
}
function impostaFase(t,fase){ t.faseAttiva=fase; t.fase=fase; }
function fasePartite(t){
  return t.partite.filter(p=>t.faseAttiva==='finali'
    ? p.fase==='finale'||p.fase==='bronzo' : p.fase===t.faseAttiva);
}
function fuori(t){ t.eliminatoDalTitolo=true; }
function secondaFase(t,classifiche){
  t.riportate={};
  for(const [dest,a,b] of [['E','A','C'],['F','B','D']]){
    const qa=classifiche[a].slice(0,3),qb=classifiche[b].slice(0,3),q=[...qa,...qb];
    gruppo(t,dest,q);
    t.riportate[dest]=t.partite.filter(p=>[a,b].includes(p.girone)&&q.includes(p.casa)&&q.includes(p.ospite)).map(p=>p.id);
    for(let turno=0;turno<3;turno++) for(let i=0;i<3;i++)
      aggiungi(t,qa[i],qb[(i+turno)%3],'seconda_fase',dest,turno+1);
  }
  impostaFase(t,'seconda_fase');
}
function transizione(t){
  const fase=t.faseAttiva,ps=fasePartite(t);
  if(fase==='gironi'){
    const c=Object.fromEntries(['A','B','C','D'].map(g=>[g,classificaGirone(t,g).map(r=>r.codice)]));
    piazzamentoQuattro(t,[c.A[3],c.B[3],c.C[3],c.D[3]],13);
    if(Object.values(c).some(q=>q[3]===t.nazionale)) fuori(t);
    if(t.tipo==='europei'){ secondaFase(t,c); return; }
    t.primeGironi=Object.fromEntries(Object.entries(c).map(([g,q])=>[g,q[0]]));
    for(const [a,b] of [[c.A[1],c.B[2]],[c.A[2],c.B[1]],[c.C[1],c.D[2]],[c.C[2],c.D[1]]])
      aggiungi(t,a,b,'spareggi');
    impostaFase(t,'spareggi'); return;
  }
  if(fase==='spareggi'){
    const v=ps.map(vincitrice),perse=ps.map(perdente),p=t.primeGironi;
    // Singapore 2025: perdenti 27–29 e 28–30, non 27–28 / 29–30.
    piazzamentoQuattro(t,[perse[0],perse[2],perse[1],perse[3]],9);
    if(perse.includes(t.nazionale)) fuori(t);
    for(const [a,b] of [[p.A,v[2]],[p.B,v[3]],[p.C,v[0]],[p.D,v[1]]]) aggiungi(t,a,b,'quarti');
    impostaFase(t,'quarti'); return;
  }
  if(fase==='quarti'){
    const v=ps.map(vincitrice),perse=ps.map(perdente);
    piazzamentoQuattro(t,perse,5);
    if(perse.includes(t.nazionale)) fuori(t);
    aggiungi(t,v[0],v[1],'semifinali'); aggiungi(t,v[2],v[3],'semifinali');
    impostaFase(t,'semifinali'); return;
  }
  if(fase==='seconda_fase'){
    const e=classificaGirone(t,'E').map(r=>r.codice),f=classificaGirone(t,'F').map(r=>r.codice);
    for(let i=2;i<6;i++) piazzamentoDue(t,e[i],f[i],i*2+1);
    if([...e.slice(2),...f.slice(2)].includes(t.nazionale)) fuori(t);
    aggiungi(t,e[0],f[1],'semifinali'); aggiungi(t,f[0],e[1],'semifinali');
    impostaFase(t,'semifinali'); return;
  }
  if(fase==='semifinali'){
    const v=ps.map(vincitrice),perse=ps.map(perdente);
    aggiungi(t,v[0],v[1],'finale'); aggiungi(t,perse[0],perse[1],'bronzo');
    if(perse.includes(t.nazionale)) fuori(t);
    impostaFase(t,'finali'); return;
  }
  if(fase==='finali'){
    const finale=ps.find(p=>p.fase==='finale'),bronzo=ps.find(p=>p.fase==='bronzo');
    piazza(t,vincitrice(finale),1); piazza(t,perdente(finale),2);
    piazza(t,vincitrice(bronzo),3); piazza(t,perdente(bronzo),4);
    t.campione=vincitrice(finale); t.piazzamento=t.piazzamenti[t.nazionale];
    t.medaglia=({1:'oro',2:'argento',3:'bronzo'})[t.piazzamento]||null;
    t.stato=t.piazzamento===1?'campione':t.piazzamento<=3?'concluso':'eliminato';
    impostaFase(t,'concluso');
  }
}
function avanza(t){
  for(let sicurezza=0;sicurezza<12;sicurezza++){
    if(t.faseAttiva==='concluso') return null;
    const ps=fasePartite(t);
    // Solo il bronzo resta giocabile dopo una sconfitta in semifinale.
    const prossima=ps.find(p=>!completata(p)&&propria(t,p)&&(!t.eliminatoDalTitolo||p.fase==='bronzo'));
    if(prossima){
      for(const p of ps) if(p.turno<prossima.turno&&!propria(t,p)) simula(t,p);
      t.fase=prossima.fase; return prossima;
    }
    for(const p of ps) simula(t,p);
    transizione(t);
  }
  throw new Error('Il torneo non riesce ad avanzare');
}

/** Restituisce esclusivamente una gara della nazionale scelta, oppure null. */
export function prossimaPartita(t){ return avanza(t); }

function risultatoValido(r){
  const intero=v=>Number.isSafeInteger(v)&&v>=0&&v<=999;
  if(!intero(r.golCasa)||!intero(r.golOspite)) throw new Error('Risultato non valido');
  const pareggio=r.golCasa===r.golOspite;
  if(pareggio&&(!intero(r.rigoriCasa)||!intero(r.rigoriOspite)||r.rigoriCasa===r.rigoriOspite))
    throw new Error('Il pareggio richiede una serie di rigori conclusa');
  if(!pareggio&&(r.rigoriCasa!=null||r.rigoriOspite!=null)) throw new Error('Rigori non previsti senza pareggio');
  return {golCasa:r.golCasa,golOspite:r.golOspite,rigoriCasa:pareggio?r.rigoriCasa:null,rigoriOspite:pareggio?r.rigoriOspite:null};
}
/** Registra una sola volta la gara giocata e consolida la giornata/il turno. */
export function registraPartita(t,id,risultato){
  const r=risultatoValido(risultato),p=t.partite.find(p=>p.id===id);
  if(!p||!propria(t,p)) throw new Error('La gara non appartiene alla tua nazionale');
  if(completata(p)){
    if(Object.keys(r).every(k=>p[k]===r[k])) return t;
    throw new Error('Risultato già registrato');
  }
  if(prossimaPartita(t)?.id!==id) throw new Error('La gara non è la prossima del torneo');
  Object.assign(p,r); avanza(t); return t;
}

/** Alternativa al pulsante Gioca per il bronzo; non abbandona né risorteggia. */
export function simulaBronzo(t){
  const p=prossimaPartita(t);
  if(!p||p.fase!=='bronzo') throw new Error('Non è prevista una finale per il bronzo');
  simula(t,p); avanza(t); return t;
}
