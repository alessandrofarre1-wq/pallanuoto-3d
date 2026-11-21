// Un'espulsione attraversa l'intervallo: l'espulso aspetta nel pozzetto,
// non partecipa allo scatto. WA febbraio2026, ParteVI 2.3.8.1,10.4.3,10.5.2.
import { allPlayers, game } from './stato.js';
import { puntoPozzetto } from './pozzetto.js';

export function preparaEspulsoAlTempo(p){
  if(!p.excluded||p.puoRientrare||p.exclUntil<=game.time)return false;
  const punto=puntoPozzetto(p.team);
  Object.assign(p,{x:punto.x,z:punto.z,vx:0,vz:0,fx:p.team.dir,fz:0,
    alPozzetto:true,arrivoPozzetto:game.time,puoRientrare:false,rientro:null});
  return true;
}

// Il tempo effettivo inizia al primo tocco della palla (WA4.2.1).
// game.time continua per nuoto/IA; il residuo della sanzione non scorre nello scatto.
// Il chiamante usa lo stesso esito per tenere fermo il cronometro di periodo.
export function aggiornaScatto(dt){
  if(!game.scattando||game.state!=='play')return false;
  if(game.possTeam){game.scattando=false;return false;}
  const passo=Math.max(0,dt);
  for(const p of allPlayers)if(p.excluded)p.exclUntil+=passo;
  return true;
}
