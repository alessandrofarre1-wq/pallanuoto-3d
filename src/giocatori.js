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
for(const t of teams) Object.assign(t,{atkPlay:0,defPlay:0,cross:false,doubleP:null,doubleUntil:0,nextDrive:0,subs:0,timeouts:2});

// calottine: la squadra del giocatore in bianco, quella del computer in blu, portieri in rosso (scelta di Ale finché non ci sono
// "casa" e "ospite"); il costume ha il colore della nazionale
const BIANCA={ cal:0xf4f4f4, css:'#f4f4f4', testo:'#111' }, BLU={ cal:0x1d3f8f, css:'#1d3f8f', testo:'#fff' };
// mette un giocatore della rosa nel corpo p (titolare all'inizio, riserva quando entra un cambio)
export function vesti(p,g){
  const t=p.team;
  p.num=g.num; p.name=g.nome; p.s=g.s; p.st=valoriMotore(g.s); p.ovr=g.ovr; p.mano=g.mano; p.scheda=g;
  const C=t.calottina;
  coloraGiocatore(p.mesh,{ costume:t.costume, calottina:p.isGK?0xd62828:C.cal, paraorecchie:p.isGK?0xf2f2ee:(C===BIANCA?t.costume:0xf2f2ee), testo:p.isGK?'#fff':C.testo,
    disco:p.isGK?'#d62828':C.css, discoTesto:p.isGK?'#fff':C.testo },p.num);
}
export function applicaSquadre(codA,codB){
  [codA,codB].forEach((cod,k)=>{
    const t=teams[k], sq=squadra(cod), R=rosa(cod);
    Object.assign(t,{ codice:cod, name:sq.nome, short:cod, forza:sq.forza, costume:parseInt(sq.costume.slice(1),16), calottina:k===0?BIANCA:BLU, rosa:R, subs:0, usciti:new Set() });
    t.css=t.calottina.css; t.color=t.calottina.cal;
    for(const p of t.players) vesti(p,R[p.i]);
  });
}
// prossima riserva per il ruolo di chi esce (portiere per portiere), tra quelle non ancora entrate
export function riservaPer(p){
  const t=p.team, libere=t.rosa.filter(g=>!g.titolare&&!t.usciti.has(g.num)&&(g.ruolo===0)===p.isGK);
  const g=libere.find(x=>x.ruolo===p.i)||libere[0]||null;
  if(g) t.usciti.add(g.num);
  return g;
}
applicaSquadre('ITA','HUN');
setCtrl(teams[0].players[6]);
