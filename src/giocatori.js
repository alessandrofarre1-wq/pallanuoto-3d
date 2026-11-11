// Creazione dei 14 giocatori (caratteristiche + modello 3D) e delle panchine
import { ROLES, rnd } from './costanti.js';
import { makePlayerMesh } from './grafica/modello.js';
import { allPlayers, setCtrl, teams } from './stato.js';
export let uid=0;
for(const t of teams){
  for(let i=0;i<7;i++){
    const isGK=i===0;
    const st={ spd:0.75+rnd()*0.25, sht:0.7+rnd()*0.3, pas:0.7+rnd()*0.3, def:0.7+rnd()*0.3, frz:0.6+rnd()*0.25 };
    if(i===1||i===6) st.frz+=0.15;      // centroboa e suo marcatore (il punto): i più forti fisicamente
    if(i===1){ st.sht+=0.05; st.spd-=0.08; }
    if(isGK){ st.def=0.85+rnd()*0.15; }
    const num=i+1;
    const m=makePlayerMesh(isGK?0xd62828:t.color,num,t);
    t.players.push({uid:uid++, team:t, i, num, isGK, name:t.names[i], role:ROLES[i], st,
      x:0,z:0,vx:0,vz:0,fx:t.dir,fz:0, stamina:1, mesh:m, phase:rnd()*6,
      excluded:false, exclUntil:0, stunUntil:0, tackleCD:0, decideT:0, charging:false, chargeT:0, pf:0, cut:null, lagX:0, lagZ:0, act:null, J:null, ballW:null});
  }
}
allPlayers.push(...teams[0].players, ...teams[1].players);
teams[0].bench=['Ferrari','Greco','Conti','Gallo','Costa','Fontana'];
teams[1].bench=['Molnár','Németh','Farkas','Balogh','Papp','Lakatos'];
for(const t of teams) Object.assign(t,{atkPlay:0,defPlay:0,cross:false,doubleP:null,doubleUntil:0,nextDrive:0,subs:0,timeouts:2});
setCtrl(teams[0].players[6]);
