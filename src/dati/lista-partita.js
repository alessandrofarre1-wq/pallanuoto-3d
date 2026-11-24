// LA LISTA DELLA PARTITA (v0.86). Funzione pura, senza dati: la usano il gioco (dati/rose.js, con la valutazione ovr) e il costruttore
// delle rose (strumenti/rose-dal-database.mjs, che con la stessa scelta riporta la forza di ogni nazionale al ranking).
// Regole World Aquatics del 18 febbraio 2026 (parte sei, 2.2.2): al massimo 14 a partita, 12 di movimento e 2 portieri. Ale: «per la
// partita scegli i più forti nel ruolo. Se ci sono doppi ruoli (molto probabile) scegli i secondi più forti dando variabilità ai cambi
// per coprire il più possibile più ruoli». La forza nel ruolo è la valutazione con i pesi di quel
// ruolo (ovr), anche per un secondo ruolo (g.ruoli, dall'anagrafica del database: «Centre Forward, Driver» = centroboa e mezzo).
// 1. titolari: il portiere più forte; poi, nell'ordine centroboa, punto, ala destra e sinistra, mezzo destro e sinistro, il più forte
//    che sa fare quel ruolo (se non c'è, di un ruolo vicino: PREF);
// 2. panchina: il secondo portiere, poi una riserva per ogni posto, nello stesso ordine: il più forte rimasto che sa fare quel ruolo
//    (se non c'è, l'altro lato dello stesso ruolo o un ruolo vicino); chi sa fare anche un altro posto ancora scoperto lo copre;
// 3. i posti rimasti ai più forti rimasti, di movimento.
// A parità di forza resta chi era nella rosa di 13 usata fino alla v0.85 (inRosa13).
export const LISTA={ partita:14, portieri:2 };
const POSTI_ORDINE=[1,6,2,3,4,5], PREF={ 1:[1,6,5,4], 2:[2,3,4,5], 3:[3,2,5,4], 4:[4,5,2,3,6], 5:[5,4,3,2,6], 6:[6,1,4,5] };
const sa=(g,r)=>(g.ruoli||[g.ruolo]).includes(r);
export function listaPartita(giocatori,n=LISTA.partita,ovr){
  const liberi=new Set(giocatori), titolari=[], panchina=[];
  const migliore=(ok,r)=>{ let b=null,bf=-Infinity; for(const g of liberi){ if(!ok(g)) continue; const f=ovr(g.s,r??g.ruolo)+(g.inRosa13?0.01:0); if(f>bf){ bf=f; b=g; } } return b; };
  const prendi=g=>{ if(g) liberi.delete(g); return g; };
  const campo=q=>q.ruolo!==0;
  titolari[0]=prendi(migliore(q=>q.ruolo===0,0));
  for(const posto of POSTI_ORDINE){
    let g=null; for(const r of PREF[posto]){ g=migliore(q=>campo(q)&&sa(q,r),posto); if(g) break; }
    titolari[posto]=prendi(g||migliore(campo,posto));
  }
  const portieri=()=>[...titolari,...panchina].filter(q=>q&&q.ruolo===0).length;
  if(portieri()<LISTA.portieri){ const g=prendi(migliore(q=>q.ruolo===0,0)); if(g) panchina.push(g); }
  const coperti=new Set();
  for(const posto of POSTI_ORDINE){
    if(coperti.has(posto)||titolari.length+panchina.length>=n) continue;
    let g=null; for(const r of PREF[posto]){ g=migliore(q=>campo(q)&&sa(q,r),posto); if(g) break; }
    if(!prendi(g)) continue;
    panchina.push(g); for(const p2 of POSTI_ORDINE) if(sa(g,p2)) coperti.add(p2);
  }
  while(titolari.filter(Boolean).length+panchina.length<n){ const g=prendi(migliore(campo,null)); if(!g) break; panchina.push(g); }
  return [...titolari.filter(Boolean),...panchina];
}
