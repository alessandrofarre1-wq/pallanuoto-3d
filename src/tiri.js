// ================= PASSAGGI E TIRI =================
import { registraTiro, tipoDiTiro } from './statistiche.js';
import { BRV, clamp, dist, gauss, rnd } from './costanti.js';
import { manUp, postoPortiere, startCut } from './ia.js';
import { velocitaDiLancio } from './palla.js';
import { allPlayers, ball, fight, game, goalX, other, setCtrl, teams } from './stato.js';
export function startAct(p,kind,wind,fn,aim){
  const gx=goalX(p.team);
  if(!aim) aim = diSchiena(kind) ? [2*p.x-gx,2*p.z] : [gx,0];
  // chi sta ancora nuotando disteso deve prima raddrizzarsi: piccolo ritardo (non per il colonnello, che si tira in nuotata)
  if(kind!=='colonnello') wind+=(kind==='pass'?0.12:0.3)*(p.oriz||0);
  // "frusta" = tempo dal braccio caricato al rilascio. Dati riportati nella tesi Patumi (Melchiorri 2015): 166 ms per i
  // professionisti, 189 ms per i semi-professionisti: chi tira meglio rilascia prima. Passaggio e finta sono gesti più corti.
  const frusta = kind==='pass'||kind==='fake' ? 0.09 : kind==='polso' ? 0.11 : 0.189-0.023*clamp((p.st.sht-0.7)/0.3,0,1);
  p.act={t:0,kind,wind,frusta,fn,aim,done:false}; p.charging=false; p.chargeT=0;
  if(diSchiena(kind)) p.tiriDiSchiena=(p.tiriDiSchiena||0)+1;
}
// tiri del centroboa spalle alla porta
export const diSchiena = kind => kind==='beduina'||kind==='sciarpa';
export function updateActs(dt){
  for(const p of allPlayers){
    const a=p.act; if(!a) continue;
    a.t+=dt;
    if(!a.done && a.t>=a.wind+a.frusta){ a.done=true; if(ball.holder===p && game.state==='play') a.fn(); }
    if(a.t>a.wind+a.frusta+0.36) p.act=null;
  }
}
export function launch(p,tx,ty,tz,t,kind){
  ball.state='flight'; ball.holder=null; ball.kind=kind; ball.shooter=p; ball.lastTeam=p.team;
  if(p.ballW){ ball.x=p.ballW[0]; ball.y=Math.max(0.3,p.ballW[1]); ball.z=p.ballW[2]; }
  else { ball.x=p.x+p.fx*0.25; ball.z=p.z+p.fz*0.25; ball.y=1.0; }
  // velocità e rotazione di partenza: la palla gira all'indietro (di più nella palombella) e la mira tiene conto dell'aria
  const giri = kind==='pass' ? 9 : ty>0.55 ? 34 : 20;
  const L=velocitaDiLancio(ball.x,ball.y,ball.z,tx,ty,tz,t,giri);
  ball.vx=L.vx; ball.vy=L.vy; ball.vz=L.vz; ball.wx=L.wx; ball.wy=L.wy; ball.wz=L.wz;
  ball.flightT=0; ball.intercept=new Set(); ball.saveChecked=false; ball.pickupCD=0.3;
  ball.skip=false; ball.skipped=false; ball.schizzi=0; ball.daTiro=kind==='shot'; ball.inRete=false;
  p.charging=false; p.chargeT=0;
}
export function laneClear(a,bx,bz,team,rad=0.6){
  const dx=bx-a.x, dz=bz-a.z, L2=dx*dx+dz*dz||1;
  for(const o of other(team).players){
    if(o.excluded||o.isGK) continue;
    let u=((o.x-a.x)*dx+(o.z-a.z)*dz)/L2; if(u<0.05||u>0.95) continue;
    const px=a.x+u*dx, pz=a.z+u*dz; if(Math.hypot(o.x-px,o.z-pz)<rad) return false;
  }
  return true;
}
export function openness(m){ let best=99; for(const o of other(m.team).players){ if(o.excluded) continue; best=Math.min(best,dist(o,m)); } return best; }
// che tipo di tiro parte in questa situazione
// 0-1: quanto il giocatore riesce ad alzarsi e a restare stabile sulle gambe (Forza, Resistenza, stanchezza)
export const elevazione = p => ((p.s.frz-40)/59*0.5+(p.s.res-40)/59*0.5)*(0.55+0.45*p.stamina);
export function shotKind(p){
  if(game.penalty===p) return 'shot';
  // centroboa spalle alla porta: beduina (braccio che gira all'esterno) oppure sciarpa (braccio che attraversa il corpo,
  // come per mettersi una sciarpa); il centroboa alterna i due gesti
  if(p.i===1 && !(p.turnedUntil>game.time) && Math.hypot(goalX(p.team)-p.x,p.z)<4.5) return (p.tiriDiSchiena||0)%2 ? 'sciarpa' : 'beduina';
  if(Math.hypot(p.vx,p.vz)>1.3) return 'colonnello';
  return 'shot';
}
export function bestPassTarget(p){
  let best=null, bs=-1e9;
  for(const m of p.team.players){
    if(m===p||m.excluded||m.isGK) continue;
    const d=dist(p,m); if(d<2) continue;
    const dg=Math.hypot(goalX(p.team)-m.x,m.z);
    let s=Math.min(openness(m),3)*1.3 - dg*0.15 + (laneClear(p,m.x,m.z,p.team)?1.2:-2.5) - d*0.04;
    if(m.i===1 && fight.active && fight.boa===m) s+= (fight.v>0?1.6:0.4) + (p.team.atkPlay===3?1.5:0);   // palla al boa
    // Visione: chi ne ha poca sceglie peggio il compagno a cui passare
    s+=(rnd()-0.5)*(99-p.s.vis)/59*3.5;
    if(s>bs){ bs=s; best=m; }
  }
  return best;
}
export function humanPassTarget(p,ix,iz){
  const il=Math.hypot(ix,iz);
  if(il<0.3) return bestPassTarget(p);
  let best=null, bs=-1e9;
  for(const m of p.team.players){
    if(m===p||m.excluded) continue;
    const dx=m.x-p.x, dz=m.z-p.z, d=Math.hypot(dx,dz)||1;
    const c=(dx*ix+dz*iz)/(d*il); if(c<0.35) continue;
    const s=c*4 - d*0.07 + (laneClear(p,m.x,m.z,p.team)?0.5:0);
    if(s>bs){ bs=s; best=m; }
  }
  return best||bestPassTarget(p);
}
export function doPass(p,m){
  if(!m) return;
  const spd=8.5+3.5*p.st.pas;
  let tx=m.x, tz=m.z; let t=dist(p,m)/spd;
  tx+=m.vx*t*0.8; tz+=m.vz*t*0.8;
  const d=Math.hypot(tx-p.x,tz-p.z); t=Math.max(0.25,d/spd);
  const err=(0.2+(1-p.stamina)*0.5)*(1.25-p.st.pas)*(0.3+d*0.05);
  tx+=gauss()*err; tz+=gauss()*err;
  launch(p,tx,0.45,tz,t,'pass'); ball.target=m; ball.tx=tx; ball.tz=tz;
  if(p.team===teams[0]) setCtrl(m);
  // dai e vai: chi passa dal perimetro può tagliare verso la porta
  if(!p.isGK && p.i>=4 && !manUp(p.team) && (p.team.atkPlay===1||rnd()<0.35)) startCut(p);
}
// errore di mira secondo la Precisione: piccolo a 90, circa 2,5 volte a 75, oltre 5 volte a 60
const mira = pre => pre>=90 ? 0.18-(pre-90)/9*0.1 : 0.18+Math.pow((90-pre)/30,1.6)*0.82;
// o = variante: polso (tiro di solo polso, poco caricato), dopoFinta, torsione (finta di busto sul primo palo e chiusura in diagonale), volo
export function doShoot(p,power,lob,aimZ,o){
  o=o||{};
  const tipoAzione=tipoDiTiro(p,ball);
  const t=p.team, gx=goalX(t), gk=other(t).players[0];
  // si mira un po' più dentro di prima: ora pali e traversa sono veri e la palla ha il suo ingombro
  let az = aimZ!=null ? clamp(aimZ*1.28,-1.28,1.28) : -Math.sign(gk.z||(rnd()-0.5))*(0.85+rnd()*0.38);
  let ay = lob ? 0.55 : 0.15+rnd()*0.55;
  const d=Math.hypot(gx-p.x,az-p.z);
  let press=99; for(const o of other(t).players){ if(!o.excluded&&!o.isGK&&game.time>=o.stunUntil&&!(p.turnedUntil>game.time&&o===fight.def)) press=Math.min(press,dist(o,p)); }
  // un tiro marcato stretto è molto meno preciso: gli schemi servono a liberare il tiratore
  // Precisione: tra 60 e 90 l'errore di mira cala di quasi quattro volte (dallo stesso punto, circa il doppio dei tiri nello specchio).
  // Dalla tesi: la precisione NON dipende dalla velocità del tiro (nessuna correlazione), quindi tirare forte non costa mira;
  // il tiro classico è più preciso di beduina, sciarpa e colonnello.
  const tipo=p.act?p.act.kind:'shot', classico=tipo==='shot'||tipo==='lob'||tipo==='polso'||tipo==='torsione';
  // elevazione: quanto il tiratore esce dall'acqua dipende da gambe (Forza), fiato (Resistenza) e stanchezza;
  // più è alto, meno il difensore vicino gli sporca il tiro
  const elev=elevazione(p);
  const errBase=1.25*0.27*(1+(1-p.stamina)*1.3)*(classico?1:1.3)*mira(p.s.pre)*(1+clamp(1.4-press,0,1)*0.9*(1.45-0.9*elev))*(o.volo?1.15:1)*(p.fakeUntil>game.time?0.65:1)*(p.turnedUntil>game.time?0.6:1);
  // Mano: dal lato destro della vasca tira meglio un mancino, dal sinistro un destro (angolo migliore sulla porta)
  const lato=Math.abs(p.z)>1.5?Math.sign(p.z*t.dir):0, mano=lato===0?1:((p.mano==='S')===(lato>0)?0.92:1.2);
  az+=gauss()*errBase*mano*(0.45+d*0.09); ay+=gauss()*errBase*mano*0.35;
  // Velocità al rilascio (dati riportati nella tesi): professionisti 22,8 ± 2,4 m/s a tutta forza. La bravura al tiro sposta
  // il massimo tra circa 20 e 25 m/s; il tiro classico è il più veloce.
  const vMax=(22.8+(p.s.pot-75)*0.16)*(classico?1:tipo==='colonnello'?0.9:0.85);      // Potenza: da circa 20 (60) a 25 m/s (90)
  const spd = lob ? 4.5+d*0.15 : vMax*(0.5+0.5*power)*(0.75+0.25*p.stamina)*(o.torsione?0.92:1);
  // tiro a schizzo: la palla rimbalza sull'acqua poco prima della porta (più difficile da leggere per il portiere)
  const dxg=Math.abs(gx-p.x);
  if(!lob && power>0.55 && dxg>4 && game.penalty!==p && rnd()<0.28){
    const k=1.4/dxg;
    launch(p,gx-t.dir*1.4,BRV,az+(p.z-az)*k,d*(1-k)/spd,'shot'); ball.skip=true;
  } else launch(p,gx,ay,az,d/spd,'shot');
  ball.shotPower=lob?0.3:power; ball.lob=lob; ball.crossZ=az; ball.rigore=game.penalty===p;
  ball.tipoTiro=tipoAzione; registraTiro(p,tipoAzione);
  // dove si trova il portiere nel momento in cui parte il tiro: è da qui che dipende soprattutto la parata
  ball.gkZ0=gk.z; ball.gkFuoriPosto=Math.abs(gk.z-postoPortiere(gk.team,p.x,p.z));
  // sorpresa per portiere e muro: il polso parte senza caricare (ancora di più dopo una finta); con la torsione il portiere
  // si sposta verso il primo palo e la palla va sull'altro
  ball.sorpresa = o.polso ? (o.dopoFinta?0.26:0.15) : o.torsione ? 0.08 : o.volo ? 0.06 : 0;
  ball.elevazione=elev;
  if(o.torsione) ball.gkZ0-=Math.sign(az||1)*0.4;
  p.stamina=Math.max(0,p.stamina-0.04);
}
