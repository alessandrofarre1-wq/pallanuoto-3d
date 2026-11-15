import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
// Vite importa JSON senza attributi. Qui la sola tabella dati è caricata nello
// stesso modo anche da Node, senza coinvolgere DOM, rendering o motore partita.
const hook=registerHooks({load(url,context,next){
  if(url.endsWith('/src/dati/squadre.json'))
    return {format:'module',source:`export default ${readFileSync(new URL(url),'utf8')}`,shortCircuit:true};
  return next(url,context);
}});
const { COMPETIZIONI,creaTorneo,prossimaPartita,registraPartita,classificaGirone,simulaBronzo }=await import('../src/tornei.js');
hook.deregister();
const squadre=JSON.parse(readFileSync(new URL('../src/dati/squadre.json',import.meta.url),'utf8')).squadre;

let controlli=0;
function prova(nome,fn){ fn(); controlli++; console.log(`✓ ${nome}`); }
const copia=t=>JSON.parse(JSON.stringify(t));
const gioca=(t,p,vinci=true,rigori=false)=>{
  const casa=(p.casa===t.nazionale)===vinci;
  return registraPartita(t,p.id,rigori
    ? {golCasa:10,golOspite:10,rigoriCasa:casa?5:4,rigoriOspite:casa?4:5}
    : {golCasa:casa?30:1,golOspite:casa?1:30});
};
function completa(t,decidi=()=>true){
  const giocate=[]; let p;
  while((p=prossimaPartita(t))){
    assert.ok(p.casa===t.nazionale||p.ospite===t.nazionale,'si gioca solo la nazionale scelta');
    assert.ok(giocate.length<10,'la campagna termina');
    giocate.push(p); gioca(t,p,decidi(p,giocate.length));
  }
  assert.ok(t.partite.every(p=>Number.isInteger(p.golCasa)&&Number.isInteger(p.golOspite)),'ogni piazzamento è simulato');
  assert.equal(Object.keys(t.piazzamenti).length,16);
  assert.deepEqual(Object.values(t.piazzamenti).sort((a,b)=>a-b),Array.from({length:16},(_,i)=>i+1));
  return giocate;
}
function fixture(incontri,ordine=['A','B','C','D']){
  return {seed:71,gruppi:{A:['A','B','C','D']},sorteggiParita:{A:ordine},partite:incontri.map(([casa,ospite,golCasa,golOspite,rigoriCasa=null,rigoriOspite=null],i)=>
    ({id:String(i),casa,ospite,golCasa,golOspite,rigoriCasa,rigoriOspite,girone:'A'}))};
}

prova('Sorteggio: 24 scelte mondiali, 16 europee, torneo a 16 e nazionale sempre inclusa',()=>{
  assert.equal(COMPETIZIONI.mondiali.codici.length,24);
  assert.deepEqual([...COMPETIZIONI.mondiali.codici].sort(),squadre.map(s=>s.codice).sort());
  assert.deepEqual(COMPETIZIONI.mondiali.fasce.map(f=>f.length),[6,6,6,6]);
  assert.deepEqual(COMPETIZIONI.europei.fasce,[
    ['ESP','CRO','ITA','HUN'],['GRE','MNE','SRB','ROU'],
    ['NED','SVK','GEO','FRA'],['SLO','TUR','MLT','ISR'],
  ]);
  const nonEuropee=['USA','BRA','CAN','AUS','CHN','JPN','RSA','SGP'];
  assert.deepEqual(squadre.map(s=>s.codice).filter(c=>!COMPETIZIONI.europei.codici.includes(c)).sort(),[...nonEuropee].sort());
  for(const codice of [...nonEuropee,'NZL']) assert.throws(()=>creaTorneo('europei',codice,1));
  for(const tipo of ['mondiali','europei']){
    const t=creaTorneo(tipo,'ITA',712),c=COMPETIZIONI[tipo];
    assert.deepEqual(t,creaTorneo(tipo,'ITA',712));
    assert.deepEqual(t,copia(t));
    assert.notDeepEqual(t.gruppi,creaTorneo(tipo,'ITA',713).gruppi);
    assert.equal(new Set(Object.values(t.gruppi).flat()).size,16);
    assert.equal(t.partecipanti.length,16);
    assert.deepEqual([...t.partecipanti].sort(),Object.values(t.gruppi).flat().sort());
    assert.deepEqual(t.fasce.map(f=>f.length),[4,4,4,4]);
    for(const gruppo of Object.values(t.gruppi)) for(const fascia of c.fasce)
      assert.equal(gruppo.filter(c=>fascia.includes(c)).length,1);
    assert.equal(t.partite.length,24);
    assert.equal(t.partite.filter(p=>p.casa==='ITA'||p.ospite==='ITA').length,3);
    assert.ok(t.partite.every(p=>p.golCasa===null&&p.rigoriCasa===null));
  }
  const incontrate=new Set();
  for(const nazionale of COMPETIZIONI.mondiali.codici) for(let seme=1;seme<=12;seme++){
    const t=creaTorneo('mondiali',nazionale,seme);
    assert.ok(t.partecipanti.includes(nazionale),'ogni scelta entra sempre nel torneo');
    assert.equal(new Set(t.partecipanti).size,16);
    for(const [i,fascia] of COMPETIZIONI.mondiali.fasce.entries()){
      assert.equal(t.partecipanti.filter(c=>fascia.includes(c)).length,4);
      assert.ok(t.fasce[i].every(c=>fascia.includes(c)));
    }
    for(const gruppo of Object.values(t.gruppi)) for(const fascia of t.fasce)
      assert.equal(gruppo.filter(c=>fascia.includes(c)).length,1);
    t.partecipanti.filter(c=>c!==nazionale).forEach(c=>incontrate.add(c));
  }
  assert.equal(incontrate.size,24,'tutte le disponibili possono anche essere avversarie');
  assert.throws(()=>creaTorneo('inesistente','ITA',1));
  assert.throws(()=>creaTorneo('mondiali','NZL',1));
});

prova('Classifica: 3/2/1/0 e gol dei rigori esclusi',()=>{
  const t=fixture([['A','B',6,6,20,19],['C','D',2,0]]),r=classificaGirone(t,'A');
  const a=c=>r.find(r=>r.codice===c);
  assert.deepEqual(['A','B','C','D'].map(c=>a(c).punti),[2,1,3,0]);
  assert.equal(a('A').golFatti,6); assert.equal(a('A').differenzaReti,0);
  assert.equal(a('B').golSubiti,6);
});

prova('Parità a due: scontro diretto prima della differenza reti generale',()=>{
  const t=fixture([['A','B',1,0],['A','C',0,20],['A','D',2,0],
    ['B','C',10,0],['B','D',10,0],['C','D',0,1]]);
  const c=classificaGirone(t,'A');
  assert.deepEqual(c.slice(0,2).map(r=>r.codice),['A','B']);
  assert.ok(c[0].differenzaReti<c[1].differenzaReti);
});

prova('Parità a tre: dopo mini-punti si usa GD generale senza ripartire da H2H',()=>{
  const t=fixture([['A','B',0,1],['A','C',1,1,0,1],['B','C',1,1,0,1],
    ['A','D',10,0],['B','D',1,2],['C','D',0,10]]);
  assert.deepEqual(classificaGirone(t,'A').map(r=>r.codice),['D','B','C','A']);
});

prova('Parità a tre: gol generali dopo GD generale, moneta persistente ultima',()=>{
  const t=fixture([['A','B',0,1],['A','C',1,1,0,1],['B','C',1,1,0,1],
    ['A','D',10,0],['B','D',0,2],['C','D',5,6]]);
  assert.deepEqual(classificaGirone(t,'A').map(r=>r.codice),['D','C','B','A']);
  const vuoto=fixture([],['C','A','D','B']),prima=JSON.stringify(vuoto);
  assert.deepEqual(classificaGirone(vuoto,'A').map(r=>r.codice),['C','A','D','B']);
  assert.deepEqual(classificaGirone(vuoto,'A'),classificaGirone(copia(vuoto),'A'));
  assert.equal(JSON.stringify(vuoto),prima,'leggere la classifica non consuma caso');
});

prova('Parità a tre: confronto con la più alta della parità originale prima della moneta',()=>{
  // A ha battuto B, ma il criterio a tre deve confrontarle con C, già prima:
  // B ha battuto C, mentre A ha perso. GD e gol generali di A/B sono identici.
  const t=fixture([['A','B',1,0],['A','C',0,1],['B','C',1,0],
    ['A','D',2,0],['B','D',2,0],['C','D',3,0]],['A','B','C','D']);
  assert.deepEqual(classificaGirone(t,'A').map(r=>r.codice),['C','B','A','D']);
});

prova('Parità a quattro: una posizione appena risolta diventa il riferimento successivo',()=>{
  const t=fixture([['A','B',0,1],['A','C',1,0],['A','D',1,0],['B','C',0,1],['B','D',0,1],['C','D',1,0],
    ['A','E',6,0],['A','F',0,4],['B','E',4,1],['B','F',3,2],
    ['C','E',7,0],['C','F',0,1],['D','E',4,1],['D','F',3,2],['E','F',1,0]]);
  t.gruppi.A=['A','B','C','D','E','F']; t.sorteggiParita.A=['D','B','A','C','E','F'];
  // C è prima per GD. A emerge contro C; B/D restano pari contro C e devono
  // quindi confrontare i punti contro A, collocata appena adesso.
  assert.deepEqual(classificaGirone(t,'A').map(r=>r.codice),['C','A','B','D','F','E']);
});

prova('Risultati validati; doppia registrazione e lettura non risimulano',()=>{
  const t=creaTorneo('mondiali','ITA',82),p=prossimaPartita(t),prima=JSON.stringify(t);
  assert.throws(()=>registraPartita(t,p.id,{golCasa:2,golOspite:2}));
  assert.throws(()=>registraPartita(t,p.id,{golCasa:-1,golOspite:2}));
  assert.throws(()=>registraPartita(t,p.id,{golCasa:3,golOspite:2,rigoriCasa:5,rigoriOspite:4}));
  assert.equal(JSON.stringify(t),prima);
  const altra=t.partite.find(p=>p.casa!=='ITA'&&p.ospite!=='ITA');
  assert.throws(()=>registraPartita(t,altra.id,{golCasa:2,golOspite:1}));
  const futura=t.partite.find(q=>(q.casa==='ITA'||q.ospite==='ITA')&&q.turno===3);
  assert.throws(()=>registraPartita(t,futura.id,{golCasa:2,golOspite:1}));
  gioca(t,p,true,true);
  const consolidato=JSON.stringify(t),r={golCasa:p.golCasa,golOspite:p.golOspite,rigoriCasa:p.rigoriCasa,rigoriOspite:p.rigoriOspite};
  registraPartita(t,p.id,r); for(let i=0;i<5;i++) prossimaPartita(t);
  assert.equal(JSON.stringify(t),consolidato);
  assert.throws(()=>registraPartita(t,p.id,{golCasa:0,golOspite:1}));
  assert.equal(t.partite.filter(p=>p.fase==='gironi'&&p.turno===1&&p.golCasa!==null).length,8);
});

prova('Mondiali: titolo da prima del girone in sei gare e incroci ufficiali',()=>{
  const t=creaTorneo('mondiali','ITA',5),giocate=completa(t);
  assert.equal(giocate.length,6); assert.equal(t.stato,'campione'); assert.equal(t.medaglia,'oro');
  assert.deepEqual(giocate.map(p=>p.fase),['gironi','gironi','gironi','quarti','semifinali','finale']);
  const spareggi=t.partite.filter(p=>p.fase==='spareggi'),quarti=t.partite.filter(p=>p.fase==='quarti');
  const win=p=>p.golCasa===p.golOspite?(p.rigoriCasa>p.rigoriOspite?p.casa:p.ospite):(p.golCasa>p.golOspite?p.casa:p.ospite);
  assert.deepEqual(quarti.map(p=>p.casa),['A','B','C','D'].map(g=>classificaGirone(t,g)[0].codice));
  assert.deepEqual(quarti.map(p=>p.ospite),[spareggi[2],spareggi[3],spareggi[0],spareggi[1]].map(win));
});

prova('Mondiali: titolo passando dallo spareggio in sette gare',()=>{
  let trovato=false;
  for(let seed=1;seed<=30&&!trovato;seed++){
    const t=creaTorneo('mondiali','ITA',seed);
    let n=0,p;
    while((p=prossimaPartita(t))&&p.fase==='gironi') gioca(t,p,++n!==1);
    if(p?.fase!=='spareggi') continue;
    const giocate=completa(t);
    assert.equal(giocate.length,4); assert.equal(t.stato,'campione');
    assert.equal(t.partite.filter(p=>(p.casa==='ITA'||p.ospite==='ITA')&&p.fase!=='piazzamenti').length,7);
    trovato=true;
  }
  assert.ok(trovato,'un secondo/terzo accede allo spareggio');
});

prova('Mondiali: eliminazione nel girone, allo spareggio e ai quarti',()=>{
  const girone=creaTorneo('mondiali','ITA',52),gare=completa(girone,()=>false);
  assert.equal(gare.length,3); assert.equal(girone.stato,'eliminato'); assert.ok(girone.piazzamento>=13);
  const quarti=creaTorneo('mondiali','ITA',53),gq=completa(quarti,p=>p.fase!=='quarti');
  assert.equal(gq.length,4); assert.ok(quarti.piazzamento>=5&&quarti.piazzamento<=8);
  let trovato=false;
  for(let seed=1;seed<=30&&!trovato;seed++){
    const t=creaTorneo('mondiali','ITA',seed); let n=0,p;
    while((p=prossimaPartita(t))&&p.fase==='gironi') gioca(t,p,++n!==1);
    if(p?.fase!=='spareggi') continue;
    gioca(t,p,false); assert.equal(prossimaPartita(t),null);
    assert.ok(t.piazzamento>=9&&t.piazzamento<=12); trovato=true;
  }
  assert.ok(trovato);
});

prova('Europei: titolo in otto gare senza quarti, tre avversarie nuove',()=>{
  const t=creaTorneo('europei','ITA',5),giocate=completa(t);
  assert.equal(giocate.length,8); assert.equal(t.stato,'campione');
  assert.equal(t.partite.some(p=>p.fase==='quarti'||p.fase==='spareggi'),false);
  const prime=giocate.filter(p=>p.fase==='gironi').map(p=>p.casa==='ITA'?p.ospite:p.casa);
  const seconde=giocate.filter(p=>p.fase==='seconda_fase').map(p=>p.casa==='ITA'?p.ospite:p.casa);
  assert.equal(seconde.length,3); assert.equal(new Set(seconde).size,3);
  assert.ok(seconde.every(c=>!prime.includes(c)));
  assert.deepEqual([...t.gruppi.E].sort(),[...classificaGirone(t,'A').slice(0,3),...classificaGirone(t,'C').slice(0,3)].map(r=>r.codice).sort());
  for(const g of ['E','F']) assert.ok(classificaGirone(t,g).every(r=>r.giocate===5));
});

prova('Europei: riporta solo due incontri fra qualificate e i punti reali',()=>{
  const t=creaTorneo('europei','ITA',71);
  while(prossimaPartita(t)?.fase==='gironi') gioca(t,prossimaPartita(t),true,true);
  assert.equal(t.fase,'seconda_fase');
  for(const g of ['E','F']){
    assert.equal(t.riportate[g].length,6);
    const r=classificaGirone(t,g);
    assert.ok(r.every(r=>r.giocate===2));
    assert.equal(r.reduce((s,r)=>s+r.punti,0),18);
    const q=t.gruppi[g],riportate=t.partite.filter(p=>t.riportate[g].includes(p.id));
    assert.ok(riportate.every(p=>q.includes(p.casa)&&q.includes(p.ospite)));
    const it=r.find(r=>r.codice==='ITA');
    if(it){assert.equal(it.punti,4);assert.equal(it.golFatti,20);assert.equal(it.golSubiti,20);}
  }
});

prova('Europei: eliminazione nella prima e nella seconda fase',()=>{
  const a=creaTorneo('europei','ITA',52),ga=completa(a,()=>false);
  assert.equal(ga.length,3); assert.ok(a.piazzamento>=13);
  const b=creaTorneo('europei','ITA',53),gb=completa(b,p=>p.fase==='gironi');
  assert.equal(gb.length,6); assert.ok(b.piazzamento>=5&&b.piazzamento<=12);
  assert.equal(b.stato,'eliminato');
});

prova('Entrambe le formule: argento, bronzo giocato e bronzo simulato',()=>{
  for(const tipo of ['mondiali','europei']){
    const argento=creaTorneo(tipo,'ITA',5); completa(argento,p=>p.fase!=='finale');
    assert.equal(argento.piazzamento,2); assert.equal(argento.medaglia,'argento'); assert.equal(argento.stato,'concluso');
    const bronzo=creaTorneo(tipo,'ITA',5); completa(bronzo,p=>p.fase!=='semifinali');
    assert.equal(bronzo.piazzamento,3); assert.equal(bronzo.medaglia,'bronzo');
    const quarto=creaTorneo(tipo,'ITA',5); completa(quarto,p=>p.fase!=='semifinali'&&p.fase!=='bronzo');
    assert.equal(quarto.piazzamento,4); assert.equal(quarto.medaglia,null);
    const simulato=creaTorneo(tipo,'ITA',5); let p;
    while((p=prossimaPartita(simulato))&&p.fase!=='bronzo') gioca(simulato,p,p.fase!=='semifinali');
    assert.equal(p.fase,'bronzo'); assert.equal(simulato.stato,'in_corso'); assert.equal(simulato.eliminatoDalTitolo,true);
    simulaBronzo(simulato); assert.equal(prossimaPartita(simulato),null);
    assert.ok([3,4].includes(simulato.piazzamento));
    assert.throws(()=>simulaBronzo(simulato));
  }
});

prova('Ripresa JSON a ogni gara e consultazioni extra mantengono simulazioni identiche',()=>{
  for(const tipo of ['mondiali','europei']) for(const nazionale of ['ITA','FRA','MLT']){
    const a=creaTorneo(tipo,nazionale,'salvataggio-v044'); let b=copia(a),n=0,p;
    while((p=prossimaPartita(a))){
      assert.deepEqual(prossimaPartita(b),p);
      for(let i=0;i<4;i++) prossimaPartita(b);
      gioca(a,p,true,n%2===0); gioca(b,prossimaPartita(b),true,n%2===0);
      b=copia(b); assert.deepEqual(a,b); n++;
    }
    assert.deepEqual(a,b);
  }
  // Salvataggio v1 reale precedente all'ampliamento: niente metadati fasce o
  // partecipanti. Le sue 16 squadre e la sequenza casuale devono restare quelle.
  const storico={versione:1,tipo:'mondiali',nazionale:'ITA',seed:2026,rng:1007908578,
    fase:'gironi',faseAttiva:'gironi',stato:'in_corso',eliminatoDalTitolo:false,
    gruppi:{A:['USA','HUN','ROU','RSA'],B:['ESP','BRA','MNE','CHN'],C:['SRB','GRE','CAN','SGP'],D:['CRO','ITA','AUS','JPN']},
    sorteggiParita:{A:['RSA','ROU','USA','HUN'],B:['ESP','MNE','CHN','BRA'],C:['GRE','SGP','SRB','CAN'],D:['CRO','JPN','AUS','ITA']},
    partite:[],piazzamenti:{},piazzamento:null,medaglia:null,campione:null};
  for(const [girone,q] of Object.entries(storico.gruppi))
    for(const [turno,coppie] of [[[0,3],[1,2]],[[0,2],[3,1]],[[0,1],[2,3]]].entries())
      for(const [a,b] of coppie) storico.partite.push({id:`mondiali-${storico.partite.length+1}`,casa:q[a],ospite:q[b],
        fase:'gironi',girone,turno:turno+1,golCasa:null,golOspite:null,rigoriCasa:null,rigoriOspite:null});
  const prima=copia(storico);
  assert.equal(prossimaPartita(storico).id,'mondiali-20');
  assert.deepEqual(storico,prima,'aprire lo storico non lo risorteggia né lo migra');
  gioca(storico,prossimaPartita(storico));
  assert.equal(storico.rng,2184909821);
  assert.equal(prossimaPartita(storico).ospite,'ITA');
  assert.equal(prossimaPartita(storico).casa,'JPN');
  const ripreso=copia(storico); completa(storico); completa(ripreso);
  assert.deepEqual(ripreso,storico);
  assert.deepEqual(storico.gruppi,prima.gruppi);
  assert.deepEqual(Object.keys(storico.piazzamenti).sort(),Object.values(prima.gruppi).flat().sort());
});

prova('Tutte le 24 scelte mondiali e le 16 europee arrivano al titolo o all’eliminazione',()=>{
  for(const [tipo,c] of Object.entries(COMPETIZIONI)) for(const [i,nazionale] of c.codici.entries()){
    for(const vinci of [true,false]){
      const t=creaTorneo(tipo,nazionale,100+i); completa(t,()=>vinci);
      assert.equal(t.stato,vinci?'campione':'eliminato');
      if(vinci) assert.equal(t.campione,nazionale);
      assert.equal(new Set(t.partite.map(p=>p.id)).size,t.partite.length);
      assert.ok(t.partecipanti.includes(t.campione));
      assert.ok(t.partite.every(p=>t.partecipanti.includes(p.casa)&&t.partecipanti.includes(p.ospite)));
      assert.ok(t.partite.every(p=>p.golCasa!==p.golOspite||p.rigoriCasa!==p.rigoriOspite));
    }
  }
});

console.log(`Tornei: ${controlli} gruppi di controlli superati`);
