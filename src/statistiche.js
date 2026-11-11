// Numeri della partita, per squadra: servono al bilanciamento (prove automatiche) e, più avanti, al tabellino.
import { game, teams, other } from './stato.js';

const TIPI=['perimetro','superiorita','controfuga','entrata','centroboa','rigore'];
const nuova=()=>({ tiri:0, inPorta:0, gol:0, parate:0, espulsioni:0, superiorita:0, superioritaGol:0, rigori:0, rigoriGol:0, palleRubate:0, timeout:0,
  golTipo:Object.fromEntries(TIPI.map(t=>[t,0])), tiriTipo:Object.fromEntries(TIPI.map(t=>[t,0])) });
export const stat={ squadre:[nuova(),nuova()] };
export function azzeraStatistiche(){ stat.squadre=[nuova(),nuova()]; }
const di=t=>stat.squadre[t.idx];

// che tipo di azione ha portato a questo tiro
export function tipoDiTiro(p,ball){
  const t=p.team, dif=other(t), gx=t.dir*12.5, dPorta=Math.hypot(gx-p.x,p.z);
  if(game.penalty===p) return 'rigore';
  if(dif.players.some(q=>q.excluded)) return 'superiorita';
  if(p.i===1 && dPorta<4.6) return 'centroboa';
  // controfuga: possesso appena conquistato e al massimo due difensori (portiere escluso) tra chi tira e la porta
  const davanti=dif.players.filter(q=>!q.isGK&&!q.excluded&&Math.abs(gx-q.x)<Math.abs(gx-p.x)+0.5).length;
  if(game.time-(game.possT||0)<11 && davanti<=2) return 'controfuga';
  if((p.cut||game.time-(p.cutT||-99)<3) && dPorta<5.5) return 'entrata';
  return 'perimetro';
}
export function registraTiro(p,tipo){ const s=di(p.team); s.tiri++; s.tiriTipo[tipo]++; }
export function registraGol(t,ball){
  const s=di(t); s.gol++; s.inPorta++;
  const tipo=ball.shooter&&ball.shooter.team===t&&ball.tipoTiro ? ball.tipoTiro : 'perimetro';
  s.golTipo[tipo]++;
  if(tipo==='superiorita') s.superioritaGol=Math.min(s.superiorita,s.superioritaGol+1);
  if(tipo==='rigore') s.rigoriGol++;
}
export function registraParata(att,dif){ di(att).inPorta++; di(dif).parate++; }
export function registraEspulsione(d){ di(d.team).espulsioni++; di(other(d.team)).superiorita++; }
export function registraRigore(t){ di(t).rigori++; }
export function registraPallaRubata(t){ di(t).palleRubate++; }
export function registraTimeout(t){ di(t).timeout++; }
export const squadreStat=()=>teams.map(t=>({ nome:t.name, ...di(t) }));
