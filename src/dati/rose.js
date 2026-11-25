// Rose delle 24 nazionali: 13 giocatori per squadra, ordinati per i sette posti titolari e poi le riserve.
// con le statistiche in scala 40-99 come in FIFA, generate dalla forza della squadra (src/dati/squadre.json).
// Le rose sono sempre le stesse a ogni avvio: il caso usato qui dipende solo dal codice della squadra.
// Dalla v0.34 le rose vengono dal database di Ale (src/dati/rose-db.json, vedi strumenti/rose-dal-database.mjs): giocatori,
// numeri, ruoli e mano veri, statistiche stimate dai tornei. Le otto aggiunte degli Europei 2026 usano il rapporto ufficiale
// European Aquatics / Microplus; le loro statistiche sono stime per squadra/ruolo, dichiarate in ogni scheda e nei dati fonte.
// Il generatore qui sotto resta soltanto per le vecchie squadre senza dati: non crea nomi per nuove nazionali.
import dati from './squadre.json';
import MANI from './mancini.json';
import DB from './rose-db.json';
import { profiliSquadra } from '../aspetto.js';
import { LISTA, listaPartita as sceltaLista } from './lista-partita.js';

const NOMI={
  ESP:['Lorenzo','Granados','Munárriz','Sanahuja','Cabanas','Larumbe','Famera','Perrone','Tahull','Bustos','Valera','Asensio','Aguirre'],
  HUN:['Vogel','Angyal','Manhercz','Molnár','Vámos','Nagy','Zalánki','Fekete','Jansik','Varga','Burián','Vigvári','Csoma'],
  GRE:['Zerdevas','Genidounias','Skoumpakis','Gkillas','Fountoulis','Papanastasiou','Dervisis','Argyropoulos','Alafragkis','Kakaris','Nikolaidis','Kalogeropoulos','Tzortzatos'],
  SRB:['Mitrović','Mandić','Jakšić','Dedović','Drašović','Rašović','Lukić','Ranđelović','Vico','Vučinić','Martinović','Stojanović','Filipović'],
  CRO:['Bijač','Burić','Fatović','Krapić','Lazić','Bukić','Vukičević','Žuvela','Marinić','Kragić','Butić','Harkov','Popadić'],
  MNE:['Tešanović','Brguljan','Vujović','Perković','Radović','Popadić','Mršić','Petković','Ukropina','Spaić','Matković','Vidović','Lazović'],
  ITA:['Del Lungo','Di Fulvio','Velotto','Cannella','Fondelli','Condemi','Renzuto','Echenique','Presciutti','Bruni','Di Somma','Iocchi','Nicosia'],
  USA:['Weinberg','Irving','Daube','Hooper','Bowen','Cupido','Woodhead','Hallock','Obert','Dodd','Vavic','Ehrhardt','Holland'],
  JPN:['Tanamura','Date','Takata','Inaba','Adachi','Okawa','Arai','Watanabe','Suzuki','Araki','Ura','Koppu','Fukushima'],
  ROU:['Tic','Gheorghe','Negrean','Fulea','Oanta','Georgescu','Prioteasa','Neamtu','Belenyesi','Vancsik','Iudean','Colodrovschi','Dragusin'],
  CAN:['Gardijan','Lapins','Bicari','Côté','Halajian','Conway','Constantin-Bicari','Parenteau','Djerkovic','Blanchard','Soleimanipak','Gerakoudis','Vandermeer'],
  BRA:['Soro','Crivella','Guimarães','Perrone','Delgado','Rocha','Gomes','Silva','Salemi','Vieira','Coutinho','Real','Freitas'],
  AUS:['Porter','Kayes','Power','Edwards','Ford','Younger','Hrysanthos','Berehulak','Lambie','Ulmer','Maitland','Pavillard','Thompson'],
  CHN:['Wu','Hu','Peng','Xie','Zhang','Chen','Liu','Zhu','Shen','Chu','Wen','Cai','Li'],
  SGP:['Lee','Tan','Ang','Chow','Loh','Koh','Goh','Ooi','Yu','Sim','Chiam','Lim','Wong'],
  RSA:['Madi','Neill','Rezelman','Pike','Card','Stewart','Evezard','Rodda','Jordaan','Molyneux','Spencer','Le Roux','Laurence'],
};
export const RUOLI=['Portiere','Centroboa','Ala destra','Ala sinistra','Mezzo destro','Mezzo sinistro','Punto'];
export const STAT_NOMI={ vel:'Velocità', res:'Resistenza', pot:'Potenza', pre:'Precisione', pas:'Passaggio', vis:'Visione', dif:'Difesa', dis:'Disciplina', frz:'Forza',
  rif:'Riflessi', pos:'Posizione', usc:'Uscita', rig:'Rigori' };
// profilo del ruolo: quanto ogni statistica si scosta dalla media della squadra
const PROFILO=[
  { vel:-10, res:-4, pot:-8, pre:-10, pas:2, vis:2, dif:-6, dis:6, frz:0 },          // portiere (contano rif, pos, usc, rig)
  { vel:-9, res:1, pot:3, pre:2, pas:-3, vis:-1, dif:-2, dis:-3, frz:10 },           // centroboa: forte e lento
  { vel:8, res:3, pot:-2, pre:5, pas:2, vis:0, dif:0, dis:1, frz:-6 },               // ali: veloci e precise
  { vel:8, res:3, pot:-2, pre:5, pas:2, vis:0, dif:0, dis:1, frz:-6 },
  { vel:0, res:0, pot:8, pre:2, pas:0, vis:1, dif:-1, dis:0, frz:1 },                // mezzi: tiratori potenti
  { vel:0, res:0, pot:8, pre:2, pas:0, vis:1, dif:-1, dis:0, frz:1 },
  { vel:-2, res:2, pot:0, pre:-1, pas:7, vis:8, dif:6, dis:1, frz:5 },               // punto: visione, passaggio, marca il centroboa
];
// statistiche chiave e pesi della valutazione complessiva (OVR), per ruolo
export const CHIAVE=[ ['rif','pos','usc'], ['frz','pot','pre'], ['vel','pre','pas'], ['vel','pre','pas'], ['pot','pre','vis'], ['pot','pre','vis'], ['vis','pas','dif'] ];
const PESI=[
  { rif:4, pos:4, usc:1.5, rig:1, pas:1 }, { frz:4, pot:2, pre:2, res:1, dif:1 }, { vel:3, pre:3, pas:2, res:1, dif:1 }, { vel:3, pre:3, pas:2, res:1, dif:1 },
  { pot:3, pre:3, vis:1.5, pas:1.5, vel:1 }, { pot:3, pre:3, vis:1.5, pas:1.5, vel:1 }, { vis:3, pas:3, dif:2, frz:1.5, pre:1 },
];
function generatore(seme){ let a=0; for(const c of seme) a=(Math.imul(a,31)+c.charCodeAt(0))|0;
  return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const lim=v=>Math.max(40,Math.min(99,Math.round(v)));
// valori usati dal motore di gioco (scala 0,6-1,05) ricavati dalle statistiche
export const scala=v=>0.6+(v-40)/59*0.45;
export function valoriMotore(s){ return { spd:scala(s.vel), sht:scala(s.pre), pas:scala(s.pas), def:scala(s.dif), frz:scala(s.frz) }; }
export function ovr(s,ruolo){ const w=PESI[ruolo]; let a=0,b=0; for(const k in w){ a+=s[k]*w[k]; b+=w[k]; } return Math.round(a/b); }

// TUTTI I DISPONIBILI (v0.86, Ale: «mettimi tutti ... non farlo solo per l'Italia ma per tutte le nazionali; considerali tutti»): chi la
// nazionale ha convocato in almeno un torneo del database di Ale (Mondiali 2025, Europei 2026, Coppa del Mondo 2026), con giocatori,
// numeri, ruoli e mano veri e le statistiche calcolate dai tornei (strumenti/rose-dal-database.mjs). Le voci di src/dati/mancini.json
// correggono la mano (chiave «ITA-7»). Ogni scheda riceve anche il suo profilo visivo stabile (src/aspetto.js: solo disegno).
const disponibili={};
export function tutti(codice){
  if(disponibili[codice]) return disponibili[codice];
  if(DB.tutti[codice]) return disponibili[codice]=profiliSquadra(DB.tutti[codice].map(g=>{
    const m=MANI[`${codice}-${g.num}`], mano=m==='sinistra'?'S':m==='destra'?'D':g.mano;
    return { ...g, numDb:g.num, numStimatoDb:!!g.numStimato, mano, s:{ ...g.s }, ovr:ovr(g.s,g.ruolo) };
  }),codice);
  return disponibili[codice]=generata(codice);
}
// LA LISTA DELLA PARTITA (v0.86): la scelta è in dati/lista-partita.js (anche per il costruttore delle rose); qui con la valutazione ovr
export { LISTA };
export const listaPartita=(giocatori,n=LISTA.partita)=>sceltaLista(giocatori,n,ovr);
// numeri di calottina unici nella lista: ognuno tiene il numero della sua convocazione più recente (numDb); se due hanno lo stesso
// numero lo tiene chi era nella rosa usata finora, poi chi l'ha indossato nel torneo più recente; gli altri prendono il primo libero
// (portieri 1, 13, 15; gli altri da 2 a 12, poi 14 e 15).
const EVENTI=['wc2026_finals','wc2026_div1','wc2026_div2','euro2026','wch2025'];
const recente=g=>{ const k=EVENTI.indexOf((g.convocazioni||[])[0]); return k<0?EVENTI.length:k; };
export function numeriLista(L){
  const usati=new Set(), ordine=[...L].sort((a,b)=>(b.inRosa13?1:0)-(a.inRosa13?1:0)||recente(a)-recente(b)), senza=[];
  for(const g of ordine){ const n=g.numDb??g.num;
    if(n>0&&n<=15&&!usati.has(n)){ g.num=n; g.numStimato=g.numStimatoDb||false; usati.add(n); } else senza.push(g); }
  for(const g of senza){
    const pref=g.ruolo===0?[1,13,15]:[2,3,4,5,6,7,8,9,10,11,12,14,15];
    let nuovo=pref.find(v=>!usati.has(v)); for(let v=16;nuovo===undefined;v++) if(!usati.has(v)) nuovo=v;
    g.num=nuovo; g.numStimato=true; usati.add(nuovo); }
  return L;
}
// liste scelte a mano (schermata Squadre, id dei giocatori) e convocati dei tornei (id): le mette il menu (menu.js)
export const liste={}, convocati={};
export function listaValida(L){
  const gk=L.filter(g=>g.ruolo===0).length;
  return L.length>=7&&L.length<=LISTA.partita&&new Set(L).size===L.length&&gk>=1&&gk<=LISTA.portieri&&L.length-gk<=LISTA.partita-LISTA.portieri;
}
// chi può giocare la partita: nei tornei i convocati, altrimenti tutti i disponibili
export const candidati=codice=>{ const P=tutti(codice), c=convocati[codice]; return c&&c.length?P.filter(g=>c.includes(g.id)):P; };
// la lista della partita: quella scelta a mano se è valida, altrimenti quella automatica
export function rosa(codice){
  const C=candidati(codice), a=liste[codice];
  const scelta=a&&a.length?C.filter(g=>a.includes(g.id)):null;
  return numeriLista(scelta&&scelta.length===a.length&&listaValida(scelta)?listaPartita(scelta,scelta.length):listaPartita(C));
}
// VALUTAZIONE DELLA SQUADRA (v0.88, Ale: «le valutazioni delle squadre dipendono dai giocatori che le compongono; se seleziono i più
// forti da una rosa allargata, la squadra dovrebbe essere valutata meglio»): media delle valutazioni della lista della partita, con i 7
// titolari (i primi della lista) che contano il doppio della panchina. Prima il Rating era il numero fisso del ranking (squadre.json,
// «forza»), uguale qualunque giocatore si scegliesse; il ranking resta per le fasce e le partite simulate dei tornei.
// I titolari contano con la valutazione nel posto che occupano (la stessa che usa la scelta della lista: i primi 7 sono portiere,
// centroboa e i posti da 2 a 6), così scegliere tra più giocatori non dà mai una squadra peggiore.
export function ratingLista(L){
  if(!L||!L.length) return 0;
  let somma=0,pesi=0; L.forEach((g,i)=>{ const k=i<7?2:1; somma+=(i<7?ovr(g.s,i):g.ovr)*k; pesi+=k; });
  return Math.round(somma/pesi);
}
export const ratingSquadra=codice=>ratingLista(rosa(codice));
// LE ROSE DEI TORNEI (v0.88, Ale: «possiamo caricare 3 rose diverse per ogni squadra e nella partita singola si può scegliere con quale si
// vuole giocare, considerando che possono avere una valutazione complessiva diversa»): oltre a tutti i disponibili, i convocati della
// nazionale in ogni torneo del database (almeno 9, con un portiere); la lista della partita è la scelta automatica tra loro
export const ROSE_TORNEI=Object.freeze([
  { chiave:'wc2026', nome:'Coppa del Mondo 2026', eventi:['wc2026_finals','wc2026_div1','wc2026_div2'] },
  { chiave:'euro2026', nome:'Europei 2026', eventi:['euro2026'] },
  { chiave:'wch2025', nome:'Mondiali 2025', eventi:['wch2025'] }]);
export function roseTornei(codice){
  const P=tutti(codice);
  return ROSE_TORNEI.map(r=>({ ...r, giocatori:P.filter(g=>(g.convocazioni||[]).some(e=>r.eventi.includes(e))) }))
    .filter(r=>r.giocatori.length>=9&&r.giocatori.some(g=>g.ruolo===0));
}
// rose generate per le vecchie squadre senza dati (non crea nomi per nuove nazionali)
function generata(codice){
  const sq=dati.squadre.find(x=>x.codice===codice), nomi=NOMI[codice];
  if(!sq||!nomi) throw new Error(`Rosa verificata non disponibile per ${codice}`);
  const r=generatore(codice), base=57+(sq.forza-60)*0.72; // da 57 (forza 60) a 80 (forza 92)
  // ordine dei numeri: 1 portiere, 2 centroboa, 3-4 ali, 5-6 mezzi, 7 punto, 8-12 riserve (un ruolo ciascuna), 13 secondo portiere
  const ruoli=[0,1,2,3,4,5,6, 1,2,5,6,4, 0];
  const campioni=new Set([1+Math.floor(r()*6)]); if(r()<0.6) campioni.add(1+Math.floor(r()*6));
  const deboli=new Set([7+Math.floor(r()*5), 1+Math.floor(r()*6)].filter(k=>!campioni.has(k)));
  // mano: solo dal file src/dati/mancini.json (chiave «ITA-7»), altrimenti destra; niente mancini a caso (scelta di Ale).
  // I due numeri casuali che servivano a sceglierli si consumano lo stesso, così le statistiche delle rose non cambiano.
  r(); r();
  const mano=k=>MANI[`${codice}-${k+1}`]==='sinistra'?'S':'D';
  const out=ruoli.map((ruolo,k)=>{
    const riserva=k>=7, extra=(campioni.has(k)?8+r()*4:0)-(deboli.has(k)?7:0)-(riserva?4:0), P=PROFILO[ruolo], s={};
    for(const st of ['vel','res','pot','pre','pas','vis','dif','dis','frz']) s[st]=lim(base+P[st]+extra*(st==='dis'?0.3:1)+(r()-0.5)*9);
    const gk=ruolo===0?base+3+extra:base-28;
    for(const st of ['rif','pos','usc','rig']) s[st]=lim(gk+(r()-0.5)*9);
    return { id:`${codice}-${k+1}`, num:k+1, nome:nomi[k], ruolo, titolare:!riserva, mano:mano(k), s, ovr:ovr(s,ruolo), campione:campioni.has(k), inRosa13:true };
  });
  return profiliSquadra(out,codice);
}
export const squadre=dati.squadre;
export const squadra=codice=>dati.squadre.find(x=>x.codice===codice);
