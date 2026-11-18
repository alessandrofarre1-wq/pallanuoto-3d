// Numeri della partita, per squadra: servono al bilanciamento (prove automatiche) e, più avanti, al tabellino.
import { ball, game, teams, other } from './stato.js';

const TIPI=['perimetro','superiorita','controfuga','entrata','centroboa','rigore'];
const ESITI=['gol','tiro','persa','falloAttacco','espulsione','rigore','tempo'];
const nuovaAz=()=>Object.fromEntries([['n',0],['durata',0],...ESITI.map(e=>[e,0])]);
const nuova=()=>({ azioni:{parita:nuovaAz(),controfuga:nuovaAz(),superiorita:nuovaAz()}, difesa:[0,0,0,0], tiri:0, inPorta:0, gol:0, parate:0, espulsioni:0, espCentro:0, espFuga:0, espAltro:0, superiorita:0, superioritaGol:0, rigori:0, rigoriGol:0, palleRubate:0, intercetti:0, falli:0, tiriLontani:0, golLontani:0, tiriSoli:0, golCostruiti:0, passaggiGol:0, timeout:0, etaPossesso:0, gesti:{},
  golTipo:Object.fromEntries(TIPI.map(t=>[t,0])), tiriTipo:Object.fromEntries(TIPI.map(t=>[t,0])) });
export const stat={ squadre:[nuova(),nuova()] };
export function azzeraStatistiche(){ stat.squadre=[nuova(),nuova()]; azione=null; ultimaChiusa=null; }
const di=t=>stat.squadre[t.idx];

// quanti difensori (portiere escluso) sono più vicini alla porta di chi ha la palla, o gli stanno addosso
export function difensoriDavanti(p){
  const t=p.team, gx=t.dir*12.5, dp=Math.hypot(gx-p.x,p.z);
  return other(t).players.filter(q=>!q.isGK&&!q.excluded&&(Math.hypot(gx-q.x,q.z)<dp+0.8||Math.hypot(q.x-p.x,q.z-p.z)<2)).length;
}
// VANTAGGIO NUMERICO IN CONTROFUGA (v0.45, manuale USA: 1 contro 0, 2 contro 1, 3 contro 2...): entro 9 m dalla porta ci sono
// più attaccanti che difensori (portieri esclusi) e la palla è già lì, nei primi 6 s del possesso. Senza vantaggio la ripartenza è
// una transizione 6 contro 6.
export function vantaggioNumerico(t){
  const gx=t.dir*12.5, h=ball.holder; if(!h||h.team!==t||Math.hypot(gx-h.x,h.z)>9) return false;
  // i difensori contano fino a 10,5 m: chi sta appena oltre i 9 m in un attacco schierato non è un difensore «battuto»
  const vicini=r=>q=>!q.isGK&&!q.excluded&&Math.hypot(gx-q.x,q.z)<r;
  return t.players.filter(vicini(9)).length>other(t).players.filter(vicini(10.5)).length;
}
// che tipo di azione ha portato a questo tiro
export function tipoDiTiro(p,ball){
  const t=p.team, dif=other(t), gx=t.dir*12.5, dPorta=Math.hypot(gx-p.x,p.z);
  if(game.penalty===p) return 'rigore';
  if(dif.players.some(q=>q.excluded)) return 'superiorita';
  if(p.i===1 && dPorta<4.6) return 'centroboa';
  // controfuga: possesso appena conquistato e al massimo due difensori (portiere escluso) tra chi tira e la porta
  if(game.time-(game.possT||0)<6 && vantaggioNumerico(t)) return 'controfuga';
  if((p.cut||game.time-(p.cutT||-99)<3) && dPorta<5.5) return 'entrata';
  return 'perimetro';
}
// in più: tiri da oltre 8 metri, tiri senza nessun difensore tra chi tira e la porta (rigori esclusi)
export function registraTiro(p,tipo){ const s=di(p.team); s.tiri++; tiroChiude(); if(p.scheda) p.scheda.tiriP=(p.scheda.tiriP||0)+1;      // tiri del giocatore in questa partita (consigli dei cambi)
  const dPorta=Math.hypot(p.team.dir*12.5-p.x,p.z); ball.distTiro=dPorta; if(dPorta>8) s.tiriLontani++;
  if(tipo!=='rigore'&&difensoriDavanti(p)===0) s.tiriSoli++; s.tiriTipo[tipo]++; s.etaPossesso+=game.time-(game.possT||0); const g=p.act?p.act.kind:'altro'; s.gesti[g]=(s.gesti[g]||0)+1; }
export function registraGol(t,ball){
  const s=di(t); s.gol++; s.inPorta++; golDaTiro(t);
  if(ball.shooter&&ball.shooter.team===t){ if(ball.distTiro>8) s.golLontani++; s.passaggiGol+=game.passaggi||0; if((game.passaggi||0)>=2||(game.cambiLato||0)>=1) s.golCostruiti++; }
  const tipo=ball.shooter&&ball.shooter.team===t&&ball.tipoTiro ? ball.tipoTiro : 'perimetro';
  s.golTipo[tipo]++;
  if(tipo==='superiorita') s.superioritaGol=Math.min(s.superiorita,s.superioritaGol+1);
  if(tipo==='rigore') s.rigoriGol++;
}
export function registraParata(att,dif){ di(att).inPorta++; di(dif).parate++; }
export function registraEspulsione(d,origine){ const s=di(d.team); s.espulsioni++; s[origine==='centro'?'espCentro':origine==='fuga'?'espFuga':'espAltro']++; di(other(d.team)).superiorita++; }
export function registraRigore(t){ di(t).rigori++; }
export function registraPallaRubata(t){ di(t).palleRubate++; }
export function registraIntercetto(t){ di(t).intercetti++; }
export function registraFallo(t){ di(t).falli++; }
export function registraTimeout(t){ di(t).timeout++; }
export const squadreStat=()=>teams.map(t=>({ nome:t.name, ...di(t) }));

// ---------------------------------------------------------------- esito di ogni azione (v0.45)
// Un'azione è un possesso: comincia quando una squadra prende palla (o riparte dopo un'espulsione procurata o un tiro respinto
// ripreso) e finisce con un esito: gol, tiro (parato, fuori, murato), palla persa, fallo in attacco, espulsione procurata, rigore
// procurato, tempo dell'azione scaduto. Tipo: superiorità se l'avversario ha un espulso all'inizio; controfuga se nei primi 11 s
// chi ha la palla arriva entro 9 m dalla porta con al massimo due difensori davanti (stessa regola dei tiri in controfuga);
// altrimenti parità. Fonti dei confronti: Lupo, Condello, Tessitore 2012 (Mondiali 2009); Lupo et al. 2012 (Euro League).
let azione=null, ultimaChiusa=null;
export const azioneAperta=()=>azione;
export function apriAzione(t){
  if(game.penalty) return;
  azione={ t, t0:game.time, tipo:other(t).players.some(q=>q.excluded)?'superiorita':'parita' };
}
export function chiudiAzione(esito){
  if(!azione) return; const a=azione; azione=null;
  const r=di(a.t).azioni[a.tipo]; r.n++; r[esito]++; r.durata+=game.time-a.t0; r.durate=r.durate||{}; r.durate[esito]=(r.durate[esito]||0)+game.time-a.t0;
  ultimaChiusa={ a, r, esito };
}
export const annullaAzione=()=>{ azione=null; };
// a ogni fotogramma di gioco: apre l'azione se manca e riconosce la controfuga
export function aggiornaAzione(dt=0){
  if(game.state!=='play'||!game.possTeam) return;
  { const dif=other(game.possTeam); if(!dif.players.some(q=>q.excluded)) di(dif).difesa[dif.defPlay]+=dt; }      // tempo in ogni difesa (parità)
  const h=ball.holder;
  // l'azione si riapre da sola solo con la palla in mano alla squadra in possesso (per esempio dopo un'espulsione procurata):
  // dopo un tiro la palla è in volo o vagante e la nuova azione nasce con chi la riprende (giveBall)
  if(!azione){ if(h&&h.team===game.possTeam&&ball.state==='held') apriAzione(game.possTeam); return; }
  if(azione.t!==game.possTeam) return;
  if(azione.tipo==='parita'&&h&&h.team===azione.t&&game.time-azione.t0<6&&vantaggioNumerico(h.team)) azione.tipo='controfuga';
}
// il tiro chiude l'azione; se poi è gol, l'esito diventa «gol»
function tiroChiude(){ chiudiAzione('tiro'); }
function golDaTiro(t){ if(ultimaChiusa&&ultimaChiusa.a.t===t&&ultimaChiusa.esito==='tiro'){ ultimaChiusa.r.tiro--; ultimaChiusa.r.gol++; ultimaChiusa.esito='gol'; } }
