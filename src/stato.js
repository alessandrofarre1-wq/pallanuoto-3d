// Stato condiviso della partita: squadre, palla, cronometri, giocatore controllato, lotta al centro
import { BRV, HL, SHOT_CLOCK } from './costanti.js';
// ================= SQUADRE =================
export const teams = [
  {idx:0, name:'Italia', short:'ITA', color:0x1d4fd6, css:'#1d4fd6', dir:1, human:true, score:0, players:[],
   names:['Rossi','Bianchi','Esposito','Romano','Colombo','Ricci','Marino']},
  {idx:1, name:'Ungheria', short:'HUN', color:0xf2f2f2, css:'#f2f2f2', dir:-1, human:false, score:0, players:[],
   names:['Nagy','Kovács','Tóth','Szabó','Horváth','Varga','Kiss']}
];
export const other = t => teams[1-t.idx];
export const goalX = t => HL*t.dir;      // porta da attaccare
export const ownGoalX = t => -HL*t.dir;  // porta da difendere
export const allPlayers = [];   // riempito in giocatori.js
export const active = p => !p.excluded;

// ================= STATO =================
export const ball = {x:0,y:BRV,z:0,vx:0,vy:0,vz:0,state:'free',holder:null,kind:null,target:null,shooter:null,lastTeam:null,
              afterShot:false,flightT:0,intercept:new Set(),saveChecked:false,pickupCD:0,holdTime:0,shotPower:0,lob:false,crossZ:0};
export const game = {state:'menu',period:1,clock:180,shot:SHOT_CLOCK,time:0,timer:0,after:null,possTeam:null,camMode:0,prevState:null,penalty:null,penT:0};
export let ctrl = null;         // giocatore controllato dall'umano
export function setCtrl(p){ ctrl=p; }
// lotta al centro (centroboa contro il suo marcatore)
export const fight={active:false,v:0,boa:null,def:null,holdT:0,decT:0,foamT:0};
