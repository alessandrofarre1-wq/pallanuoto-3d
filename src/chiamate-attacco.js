// Chiamate in parità: si sceglie il movimento, il passaggio resta del giocatore.
// Il tocco non cambia la strategia salvata né la difesa della squadra.
import { ball, game, goalX, other } from './stato.js';
import { centroAttacco, chiamataAttuale, chiamaEntrata, latoTecnico, occupanteAttacco } from './entrate.js';
import { occasioneBoa } from './tiri.js';
import { ENTRATE_REATTIVE as E } from './taratura.js';

export const CHIAMATE={
  A:{id:'A',nome:'Taglio 3 → 5',breve:'3 → 5',tipo:'Taglio',descrizione:'La Pos. 3 serve la 2 e taglia verso la 5. Leggi il tagliante o l’ala che sale.'},
  B:{id:'B',nome:'Taglio 3 → 1',breve:'3 → 1',tipo:'Taglio',descrizione:'La Pos. 3 serve la 4 e taglia verso la 1. Lato adatto a mancini o tiratori molto abili.'},
  C:{id:'C',nome:'Entrata 2 al palo',breve:'2 al palo',tipo:'Entrata',descrizione:'La Pos. 2 serve la 3 e attacca il palo; un compagno copre lo spazio lasciato.'},
};
const disponibile=p=>p&&!p.excluded&&!p.uscendo&&!p.isGK;
const pari=t=>!t.players.some(p=>p.excluded)&&!other(t).players.some(p=>p.excluded);

export function opzioniChiamata(t){
  if(!t?.human||game.autoplay||game.possTeam!==t||!pari(t))return [];
  const punto=occupanteAttacco(t,6),destro=occupanteAttacco(t,4),sinistro=occupanteAttacco(t,5),ala=occupanteAttacco(t,2);
  const ids=[];
  if(disponibile(punto)&&disponibile(destro))ids.push('A','C');
  if(disponibile(punto)&&disponibile(sinistro)&&disponibile(ala)&&latoTecnico(punto,ala))ids.push('B');
  // La zona invita prima a cercare il palo, il pressing il taglio incrociato.
  // È un ordine di lettura: corridoio e vantaggio restano verificati in campo.
  const ordine=other(t).defPlay===2?['A','B','C']:['C','A','B'];
  return ordine.filter(id=>ids.includes(id)).map(id=>CHIAMATE[id]);
}
export function boaServibileAdesso(t){
  const h=ball.holder,b=centroAttacco(t);
  return !!h&&h.team===t&&occasioneBoa(h,b);
}
export function offertaChiamate(t){
  chiamataAttuale(t);
  if(game.state!=='play'||game.penalty||game.rigoriFinali||game.time-game.possT<5.5||game.shot<=4||
    ball.state!=='held'||ball.holder?.team!==t||ball.holder.isGK||
    t.entrataAzione||t.rotazioneCentro||t.players.some(p=>p.cut)||t.chiamataAttacco||
    t.chiamataPossesso?.possT===game.possT&&t.chiamataPossesso.periodo===game.period||boaServibileAdesso(t))return [];
  return opzioniChiamata(t);
}
export function chiamaAttacco(t,id){
  return opzioniChiamata(t).some(c=>c.id===id)&&chiamaEntrata(t,id);
}
export function etichettaChiamata(t){
  const c=chiamataAttuale(t),tipo=c?.tipo||t.entrataAzione?.chiamata;
  if(!tipo)return null;
  const breve=CHIAMATE[tipo].breve;
  if(!c)return `${breve} · in azione`;
  if(ball.holder?.team===t&&Math.abs(goalX(t)-ball.holder.x)>E.attacco)return `Avanza · ${breve}`;
  if(ball.holder===c.p)return `${breve} · appoggia alla ${tipo==='A'?2:tipo==='B'?4:3}`;
  return `${breve} · servi la ${tipo==='C'?2:3}`;
}
