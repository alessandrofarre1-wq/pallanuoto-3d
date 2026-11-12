// Numeri della partita, per squadra: servono al bilanciamento (prove automatiche) e, più avanti, al tabellino.
import { ball, game, teams, other } from './stato.js';

const TIPI=['perimetro','superiorita','controfuga','entrata','centroboa','rigore'];
const nuova=()=>({ tiri:0, inPorta:0, gol:0, parate:0, espulsioni:0, superiorita:0, superioritaGol:0, rigori:0, rigoriGol:0, palleRubate:0, intercetti:0, falli:0, tiriLontani:0, golLontani:0, tiriSoli:0, golCostruiti:0, passaggiGol:0, timeout:0, etaPossesso:0, gesti:{},
  golTipo:Object.fromEntries(TIPI.map(t=>[t,0])), tiriTipo:Object.fromEntries(TIPI.map(t=>[t,0])) });
export const stat={ squadre:[nuova(),nuova()] };
export function azzeraStatistiche(){ stat.squadre=[nuova(),nuova()]; }
const di=t=>stat.squadre[t.idx];

// quanti difensori (portiere escluso) sono più vicini alla porta di chi ha la palla, o gli stanno addosso
export function difensoriDavanti(p){
  const t=p.team, gx=t.dir*12.5, dp=Math.hypot(gx-p.x,p.z);
  return other(t).players.filter(q=>!q.isGK&&!q.excluded&&(Math.hypot(gx-q.x,q.z)<dp+0.8||Math.hypot(q.x-p.x,q.z-p.z)<2)).length;
}
// che tipo di azione ha portato a questo tiro
export function tipoDiTiro(p,ball){
  const t=p.team, dif=other(t), gx=t.dir*12.5, dPorta=Math.hypot(gx-p.x,p.z);
  if(game.penalty===p) return 'rigore';
  if(dif.players.some(q=>q.excluded)) return 'superiorita';
  if(p.i===1 && dPorta<4.6) return 'centroboa';
  // controfuga: possesso appena conquistato e al massimo due difensori (portiere escluso) tra chi tira e la porta
  const davanti=difensoriDavanti(p);
  if(game.time-(game.possT||0)<11 && davanti<=2) return 'controfuga';
  if((p.cut||game.time-(p.cutT||-99)<3) && dPorta<5.5) return 'entrata';
  return 'perimetro';
}
// in più: tiri da oltre 8 metri, tiri senza nessun difensore tra chi tira e la porta (rigori esclusi)
export function registraTiro(p,tipo){ const s=di(p.team); s.tiri++;
  const dPorta=Math.hypot(p.team.dir*12.5-p.x,p.z); ball.distTiro=dPorta; if(dPorta>8) s.tiriLontani++;
  if(tipo!=='rigore'&&difensoriDavanti(p)===0) s.tiriSoli++; s.tiriTipo[tipo]++; s.etaPossesso+=game.time-(game.possT||0); const g=p.act?p.act.kind:'altro'; s.gesti[g]=(s.gesti[g]||0)+1; }
export function registraGol(t,ball){
  const s=di(t); s.gol++; s.inPorta++;
  if(ball.shooter&&ball.shooter.team===t){ if(ball.distTiro>8) s.golLontani++; s.passaggiGol+=game.passaggi||0; if((game.passaggi||0)>=2||(game.cambiLato||0)>=1) s.golCostruiti++; }
  const tipo=ball.shooter&&ball.shooter.team===t&&ball.tipoTiro ? ball.tipoTiro : 'perimetro';
  s.golTipo[tipo]++;
  if(tipo==='superiorita') s.superioritaGol=Math.min(s.superiorita,s.superioritaGol+1);
  if(tipo==='rigore') s.rigoriGol++;
}
export function registraParata(att,dif){ di(att).inPorta++; di(dif).parate++; }
export function registraEspulsione(d){ di(d.team).espulsioni++; di(other(d.team)).superiorita++; }
export function registraRigore(t){ di(t).rigori++; }
export function registraPallaRubata(t){ di(t).palleRubate++; }
export function registraIntercetto(t){ di(t).intercetti++; }
export function registraFallo(t){ di(t).falli++; }
export function registraTimeout(t){ di(t).timeout++; }
export const squadreStat=()=>teams.map(t=>({ nome:t.name, ...di(t) }));
