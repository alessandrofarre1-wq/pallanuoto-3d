// Si arrestano soltanto i 14 corpi in campo: le comparse dei cambi hanno il proprio percorso.
import { ALZATA } from './costanti.js';
import { allPlayers, game } from './stato.js';

// Solo autore e vittima si arrestano sul fallo; gli altri possono riposizionarsi.
export const puoMuoversiSuFallo=p=>game.state==='stop'&&!!game.fermoFallo?.length&&!game.fermoFallo.includes(p);

export function aggiornaGiocoFermo(dt=0,istantaneo=false,giocatori=allPlayers){
  const alzata=Math.max(0,dt)/ALZATA;
  for(const p of giocatori){
    p.vx=p.vz=0; p.sprinting=false; p.perno=false; p.lunge=0;
    p.charging=false; p.chargeT=0;
    // Un gesto ancora da rilasciare non può sopravvivere al fischio e partire alla ripresa.
    // Quelli già rilasciati conservano invece la chiusura, senza richiamarne la callback.
    if(p.act&&!p.act.done)p.act=null;
    p.oriz=istantaneo?0:Math.max(0,(p.oriz||0)-alzata);
    if(istantaneo)p.orizPrec=0;
  }
}
