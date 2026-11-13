// Creazione dei 14 giocatori in acqua (modello 3D) e assegnazione delle due nazionali scelte: nomi, numeri, statistiche, colori
import { rnd } from './costanti.js';
import { RUOLI, rosa, squadra, valoriMotore } from './dati/rose.js';
import { coloraGiocatore, makePlayerMesh } from './grafica/modello.js';
import { allPlayers, setCtrl, teams } from './stato.js';
export let uid=0;
for(const t of teams){
  for(let i=0;i<7;i++){
    const m=makePlayerMesh(i+1,t);
    t.players.push({uid:uid++, team:t, i, num:i+1, isGK:i===0, name:'', role:RUOLI[i], st:null, s:null, ovr:0, mano:'D',
      x:0,z:0,vx:0,vz:0,fx:t.dir,fz:0, stamina:1, mesh:m, phase:rnd()*6,
      excluded:false, exclUntil:0, stunUntil:0, tackleCD:0, decideT:0, charging:false, chargeT:0, pf:0, cut:null, lagX:0, lagZ:0, act:null, J:null, ballW:null});
  }
}
allPlayers.push(...teams[0].players, ...teams[1].players);
for(const t of teams) Object.assign(t,{atkPlay:0,defPlay:2,cross:false,doubleP:null,doubleUntil:0,nextDrive:0,subs:0,timeouts:2});

// calottine: la squadra del giocatore in bianco, quella del computer in blu, portieri in rosso (scelta di Ale finché non ci sono
// "casa" e "ospite"); il costume ha il colore della nazionale
const BIANCA={ cal:0xf4f4f4, css:'#f4f4f4', testo:'#111' }, BLU={ cal:0x1d3f8f, css:'#1d3f8f', testo:'#fff' };
// mette un giocatore della rosa nel corpo p (titolare all'inizio, riserva quando entra un cambio)
export function vesti(p,g){
  if(p.scheda&&p.scheda!==g) p.scheda.inAcqua=false;
  p.num=g.num; p.name=g.nome; p.s=g.s; p.st=valoriMotore(g.s); p.ovr=g.ovr; p.mano=g.mano; p.scheda=g; g.inAcqua=true;
  colora(p.mesh,p.team,p.isGK,p.num);
}
// solo l'aspetto (calottina, costume, numero): serve anche per chi entra o esce con un cambio (panchina.js)
export function colora(mesh,t,isGK,num){
  const C=t.calottina;
  coloraGiocatore(mesh,{ costume:t.costume, calottina:isGK?0xd62828:C.cal, paraorecchie:isGK?0xf2f2ee:(C===BIANCA?t.costume:0xf2f2ee), testo:isGK?'#fff':C.testo,
    disco:isGK?'#d62828':C.css, discoTesto:isGK?'#fff':C.testo },num);
}
// formazione scelta dal giocatore nella schermata Squadre: per ogni nazionale i numeri dei 7 in acqua, posto per posto
// (0 portiere, 1 centroboa, 2 ala destra, 3 ala sinistra, 4 mezzo destro, 5 mezzo sinistro, 6 punto)
export const formazioni={};
export function formazioneValida(R,F){
  if(!Array.isArray(F)||F.length!==7||new Set(F).size!==7) return false;
  return F.every((n,i)=>{ const g=R.find(x=>x.num===n); return g&&((g.ruolo===0)===(i===0)); });
}
export function applicaSquadre(codA,codB){
  [codA,codB].forEach((cod,k)=>{
    const t=teams[k], sq=squadra(cod), R=rosa(cod);
    Object.assign(t,{ codice:cod, name:sq.nome, short:cod, forza:sq.forza, costume:parseInt(sq.costume.slice(1),16), calottina:k===0?BIANCA:BLU, rosa:R, subs:0, usciti:new Set() });
    t.css=t.calottina.css; t.color=t.calottina.cal;
    // un mancino titolare gioca sul lato destro (ala destra = 2, mezzo destro = 4): se sta a sinistra si scambia con il destro
    const posto=[0,1,2,3,4,5,6];
    for(const [dx,sx] of [[2,3],[4,5]]) if(R[sx].mano==='S'&&R[dx].mano!=='S'){ posto[dx]=sx; posto[sx]=dx; }
    // formazione scelta nella schermata Squadre (se c'è ed è valida)
    const F=formazioni[cod]; if(formazioneValida(R,F)) for(let i=0;i<7;i++) posto[i]=R.findIndex(g=>g.num===F[i]);
    // la panchina riparte da capo: tutti freschi, nessun gol, nessun fallo; in acqua i titolari
    for(const g of R){ g.inAcqua=false; g.stamina=1; g.gol=0; g.tiriP=0; g.pf=0; g.fuori=false; }
    t.cambio=null; t.coda=[];
    for(const p of t.players){ p.scheda=null; vesti(p,R[posto[p.i]]); }
  });
}
// prossima riserva per il ruolo di chi esce (portiere per portiere), tra quelle non ancora entrate
// la riserva migliore per il posto di p (portiere per portiere): stesso ruolo se c'è, poi la più fresca
export function riservaPer(p,escluse){
  const t=p.team, libere=t.rosa.filter(g=>!g.inAcqua&&!g.fuori&&(g.ruolo===0)===p.isGK&&!(escluse&&escluse.has(g)));
  libere.sort((a,b)=>((b.ruolo===p.i)-(a.ruolo===p.i))||((b.stamina??1)-(a.stamina??1)));
  return libere[0]||null;
}
applicaSquadre('ITA','HUN');
setCtrl(teams[0].players[6]);
