// Rose delle 16 nazionali: 13 giocatori per squadra (1 = portiere, 2-7 titolari di movimento, 8-12 riserve, 13 secondo portiere)
// con le statistiche in scala 40-99 come in FIFA, generate dalla forza della squadra (src/dati/squadre.json).
// Le rose sono sempre le stesse a ogni avvio: il caso usato qui dipende solo dal codice della squadra.
// Nomi: per scelta di Ale (progetto gratuito e aperto) sono cognomi di giocatori che hanno vestito quelle nazionali, scritti
// a memoria e NON verificati; numeri di calottina, ruoli e statistiche sono inventati. Da sostituire con rose e dati reali.
import dati from './squadre.json';
import MANI from './mancini.json';

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

const rose={};
export function rosa(codice){
  if(rose[codice]) return rose[codice];
  const sq=dati.squadre.find(x=>x.codice===codice), r=generatore(codice), base=57+(sq.forza-60)*0.72 /* da 57 di media (forza 60) a 80 (forza 92): differenze nette ma non schiaccianti */, nomi=NOMI[codice];
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
    return { num:k+1, nome:nomi[k], ruolo, titolare:!riserva, mano:mano(k), s, ovr:ovr(s,ruolo), campione:campioni.has(k) };
  });
  return rose[codice]=out;
}
export const squadre=dati.squadre;
export const squadra=codice=>dati.squadre.find(x=>x.codice===codice);
