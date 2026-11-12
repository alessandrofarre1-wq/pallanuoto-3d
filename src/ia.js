// ================= IA =================
import { difensoriDavanti } from './statistiche.js';
import { DEF_DOWN, FORM, FORM_UP, GW, HW, KICK_Z, MARK, ROLES, SHOT_CLOCK, clamp, dist, rnd } from './costanti.js';
import { doFake, timeout } from './regole.js';
import { annuncia as notifica } from './cronaca.js';
import { allPlayers, ball, ctrl, fight, game, goalX, other, ownGoalX, teams } from './stato.js';
import { bestPassTarget, doPass, doShoot, laneClear, shotKind, situazioneTiro, startAct } from './tiri.js';
export function manUp(t){ return other(t).players.some(q=>q.excluded); }
export function startCut(p){
  if(p.isGK||p.excluded||ball.holder===p) return;
  const t=p.team, side=Math.abs(p.z)<0.5?(rnd()<0.5?1:-1):Math.sign(p.z);
  p.cut={t0:game.time,phase:0,x:goalX(t)-t.dir*2.6,z:side*1.7}; p.cutT=game.time;
}
export function attackTarget(p){
  const t=p.team, gx=goalX(t);
  if(p.isGK) return { x:gx-t.dir*8.6, z:2.6 };      // 7 contro 6: il portiere avanzato sta dietro l'arco (non ha un posto nello schema)
  if(p.cut){
    const c=p.cut;
    if(c.phase===0 && (Math.hypot(c.x-p.x,c.z-p.z)<0.7 || game.time-c.t0>4.5)){ c.phase=1; c.t1=game.time; }
    if(c.phase===1 && game.time-c.t1>1.6) p.cut=null;
    else return {x:c.x,z:c.z,sprint:c.phase===0};
  }
  let f;
  const sup=manUp(t);
  if(sup) f=FORM_UP[p.i];
  else if(p.i===1 && fight.active && fight.boa===p){ f=[FORM[1][0]+Math.max(0,-fight.v)*1.3, FORM[1][1]]; }
  else {
    f=[FORM[p.i][0],FORM[p.i][1]];
    if(t.cross&&(p.i===4||p.i===5)) f[1]=-f[1];
    if(t.atkPlay===3){ if(p.i===1) f[1]=clamp(ball.z*t.dir*0.25,-1.2,1.2); else { f[0]*=1.08; f[1]*=1.1; } }
  }
  // la squadra sale insieme alla palla: nessuno può stare troppo avanti rispetto a chi la porta
  // ognuno sale lungo la propria corsia, scaglionato per ruolo (boa e ali avanti, mezzi a metà, punto in copertura)
  const ballD=Math.abs(gx-ball.x), lead=[0,14,12,12,8,8,4][p.i];
  let f0=f[0], fz=f[1];
  if(ballD-lead>f0) f0=ballD-lead;
  // con l'uomo in più ci si schiera subito e si sta fermi al proprio posto
  if(sup) return { x:gx-t.dir*f0, z:clamp(fz*t.dir,-HW+0.5,HW-0.5), sprint:Math.hypot(gx-t.dir*f0-p.x,fz*t.dir-p.z)>1.5 };
  return { x:gx-t.dir*f0, z:clamp(fz*t.dir+Math.sin(game.time*0.6+p.uid)*0.35,-HW+0.5,HW-0.5), sprint:(t.atkPlay===2&&(p.i===4||p.i===5))||game.time<(t.fugaFino||0) };
}
// Difesa con l'uomo in meno. Posizione di partenza: tre difensori sulla linea dei 2 metri, ciascuno in mezzo tra due dei quattro
// attaccanti; gli altri due davanti ai pali, a metà tra gli attaccanti ai 2 metri e quelli a 5. Ognuno prende il posto più vicino.
// Poi la zona scivola verso il lato della palla e chi sta davanti al palo esce con il braccio alto su chi ha palla ai 5 metri.
function postiInferiorita(t){
  if(t.postiT===game.time) return t.posti;
  const ogx=ownGoalX(t), defs=t.players.filter(q=>!q.excluded&&!q.isGK), liberi=new Set(defs), m=new Map(), h=ball.holder;
  const sciv=clamp(ball.z*0.18,-1,1);
  for(const s of DEF_DOWN.slice(0,defs.length)){
    let x=s[0], z=s[1]+sciv;
    if(s[0]>3 && h && h.team!==t && Math.abs(ogx-h.x)>4 && Math.sign(h.z||1)===Math.sign(s[1])){ x=Math.min(Math.abs(ogx-h.x)-1.9,4.0); z=s[1]+(h.z-s[1])*0.45; }
    const px=ogx+t.dir*x; let b=null,bd=1e9;
    for(const q of liberi){ const d=Math.hypot(q.x-px,q.z-z); if(d<bd){bd=d;b=q;} }
    liberi.delete(b); m.set(b,{ x:px, z:clamp(z,-HW+0.5,HW-0.5), sprint:bd>2.5 });
  }
  t.postiT=game.time; t.posti=m; return m;
}
// RIENTRO DIFENSIVO. Chi perde palla rientra: finché la palla è ancora lontana dalla nostra porta (transizione) nessuno va
// incontro al proprio uomo; tutti nuotano verso la propria porta restando tra la palla e la porta e chiudendo il centro.
// Il più vicino al portatore lo rallenta standogli davanti (senza buttarsi, per non farsi saltare). Solo quando la palla è
// arrivata nella zona d'attacco e il difensore è tornato dalla parte giusta si riprendono le marcature (o la zona scelta).
const RIENTRO_BASE=[0,2.8,3.0,3.0,5.0,5.0,3.4];      // profondità minima a cui si ripiega, per ruolo (metri dalla propria porta)
function chiRallenta(t){
  if(t.rallT===game.time) return t.rall;
  const h=ball.holder, ogx=ownGoalX(t); let b=null, bs=1e9;
  if(h&&h.team!==t&&!h.isGK) for(const q of t.players){
    if(q.excluded||q.isGK||game.time<q.stunUntil) continue;
    const davanti=Math.abs(q.x-ogx)<Math.abs(h.x-ogx)+0.3, sc=dist(q,h)+(davanti?0:3.5);
    if(sc<bs){ bs=sc; b=q; }
  }
  t.rallT=game.time; t.rall=b; return b;
}
export function inRientro(t){
  const att=other(t); if(game.possTeam!==att) return false;
  return Math.abs(ball.x-ownGoalX(t))>9.2;
}
function rientro(p){
  const t=p.team, att=other(t), ogx=ownGoalX(t);
  if(game.possTeam!==att) return null;
  const ballD=Math.abs(ball.x-ogx), myD=Math.abs(p.x-ogx), trans=ballD>9.2;
  if(!trans && (myD<=ballD+0.6 || ballD<7)) return null;    // difesa rientrata (o palla ormai in zona d'attacco): marcature normali
  const h=ball.holder;
  if(trans && h && chiRallenta(t)===p){
    // davanti al portatore, sulla linea verso il centro della porta, arretrando con lui
    const gx=ogx-h.x, gz=-h.z, gl=Math.hypot(gx,gz)||1;
    return { x:h.x+gx/gl*1.7, z:h.z+gz/gl*1.7, sprint:true, rallenta:true };
  }
  const a=att.players[MARK[p.i]], attD=a&&!a.excluded?Math.abs(a.x-ogx):99;
  // sempre qualche metro più indietro del proprio uomo e della palla; mai più bassi del posto di ruolo
  // in transizione si nuota dritti al proprio posto davanti alla porta (blocco stretto al centro), senza aspettare l'uomo;
  // a difesa quasi rientrata ci si tiene un metro dietro di lui
  // (chi ha l'uomo che è scappato più avanti della palla lo segue fino in fondo, restandogli dalla parte della porta)
  const scappato=trans&&attD<ballD-2.5;
  let d=trans ? Math.min(RIENTRO_BASE[p.i]+1.2, Math.max(RIENTRO_BASE[p.i], ballD-2.2)) : Math.max(RIENTRO_BASE[p.i], Math.min(ballD-2.2, attD-0.8));
  if(scappato) d=Math.max(1.6,Math.min(d,attD-0.7));
  const z=clamp((a&&!a.excluded?a.z:p.z)*(scappato?0.85:trans?0.55:0.85),-6.5,6.5);
  return { x:ogx+t.dir*d, z, sprint:myD>d+0.8 };
}
export function markTarget(p){
  const t=p.team, ogx=ownGoalX(t);
  if(t.players.some(q=>q.excluded)){            // uomo in meno: tre sulla linea dei 2 metri negli spazi tra i quattro attaccanti, due davanti ai pali
    const posto=postiInferiorita(t).get(p); if(posto) return posto;
  }
  if(t.doubleP===p && game.time<t.doubleUntil && ball.holder && ball.holder.team!==t) return {x:ball.holder.x,z:ball.holder.z,sprint:true};
  const att=other(t).players[MARK[p.i]];
  if(!att||att.excluded) return { x:ogx+t.dir*3.5, z:clamp(ball.z*0.4,-2,2) };
  // palla all'ala (posizione 1 o 5): il marcatore del mezzo dello stesso lato (il "-2") si abbassa sulla linea tra l'ala e il
  // centroboa per impedire quel passaggio
  const h=ball.holder;
  if(h && h.team!==t && (h.i===2||h.i===3) && att.i===h.i+2 && Math.abs(ogx-h.x)<5){
    const boa=other(t).players[1];
    if(!boa.excluded) return { x:h.x+(boa.x-h.x)*0.62, z:h.z+(boa.z-h.z)*0.62, sprint:true };
  }
  if(MARK[p.i]===1 && Math.abs(ogx-att.x)<5){
    if((t.defPlay===2||t.defPlay===3) && ball.holder!==att){   // pressing e zona a M: anticipo sul centroboa, tra lui e la palla
      const bx=ball.x-att.x, bz=ball.z-att.z, bl=Math.hypot(bx,bz)||1;
      return { x:att.x+bx/bl*0.6, z:att.z+bz/bl*0.6 };
    }
    const gx=ogx-att.x, gz=-att.z, gl=Math.hypot(gx,gz)||1;  // a uomo e zona: alle spalle, a contatto
    return { x:att.x+gx/gl*0.55, z:att.z+gz/gl*0.55 };
  }
  // il difensore reagisce con un piccolo ritardo ai movimenti del suo uomo
  const ax=p.lagX, az=p.lagZ, dx=ogx-ax, dz=-az, l=Math.hypot(dx,dz)||1;
  let gap = ball.holder===att ? 0.85 : 1.0;
  // zona: ci si stacca verso il centroboa; chi marca il giocatore "lasciato" si stacca di più e resta staccato anche quando
  // quello ha la palla (gli si concede il tiro), gli altri restano più vicini al proprio uomo
  const lasc=(t.defPlay===1||t.defPlay===3)&&att===t.lasciato;
  if(t.defPlay===1 && p.i!==6) gap = lasc ? Math.min(ball.holder===att?2.6:3.4,l*0.6) : ball.holder===att ? 1.1 : Math.min(1.8,l*0.4);
  if(t.defPlay===2) gap = 0.8;                                                       // pressing
  // zona a M: due linee strette davanti alla porta (ali e punto bassi, mezzi più alti), braccia alte; lascia il tiro da lontano
  if(t.defPlay===3) gap = ball.holder===att ? (lasc?2.5:1.4) : Math.min(p.i===4||p.i===5?2.4:3.4,l*0.55);
  return { x:ax+dx/l*gap, z:az+dz/l*gap };
}
export function blockR(p){ return ball.kind==='shot' && (p.team.defPlay===1 || p.team.defPlay===3 || p.team.players.some(q=>q.excluded)) ? (p.team.defPlay===3?1.0:0.85) : 0.6; }
// Portiere. L'80% del lavoro è la posizione (docs/tecnica.md): sta sulla linea tra la palla e il centro della porta e la segue
// spostandosi DURANTE i passaggi, non quando sono già arrivati. Quanto in fretta lo capisce e quanto velocemente si sposta
// dipendono dalla statistica Posizione: sulle diagonali lunghe (da 2 a 5, da 4 a 1) un portiere scarso resta indietro.
export const pos01 = gk => (gk.s.pos-40)/59, rif01 = gk => (gk.s.rif-40)/59;
// dove dovrebbe stare il portiere se la palla fosse in (bx,bz): sulla linea palla–centro porta, a 70 cm dalla linea di porta
export function postoPortiere(t,bx,bz){
  const ogx=ownGoalX(t), d=Math.max(1.2,Math.abs(bx-ogx));
  return clamp(bz*0.7/d*1.6,-GW*0.8,GW*0.8);
}
// c'è un difensore a fare muro davanti a chi ha la palla? (allora lui copre il primo palo e il portiere l'angolo lungo)
export function muroSu(h){
  const t=other(h.team), ogx=ownGoalX(t);
  for(const q of t.players){ if(q.isGK||q.excluded) continue;
    if(dist(q,h)<1.7 && Math.abs(q.x-ogx)<Math.abs(h.x-ogx)+0.3) return q; }
  return null;
}
export function gkTarget(p){
  const t=p.team, ogx=ownGoalX(t);
  // tiro in arrivo: ormai conta il tuffo (lo gestisce partita.js con la statistica Riflessi)
  if(ball.state==='flight'&&ball.kind==='shot'&&ball.shooter.team!==t&&ball.flightT>0.08) return { x:ogx+t.dir*0.7, z:clamp(ball.crossZ,-GW-0.2,GW+0.2), gk:true, tuffo:true };
  // la palla "vista" dal portiere: durante un passaggio guarda già dove arriverà, ma lo capisce con un ritardo
  let bx=ball.x, bz=ball.z;
  if(ball.state==='flight'&&ball.kind==='pass'&&ball.target){
    const ritardo=0.42-0.34*pos01(p);                         // da 0,42 s (Posizione 40) a 0,08 s (99)
    if(ball.flightT>ritardo){ bx=ball.tx; bz=ball.tz; }
  }
  let z=postoPortiere(t,bx,bz);
  const h=ball.holder;
  if(h&&h.team!==t&&Math.abs(h.x-ogx)<9){ const m=muroSu(h); if(m) z+=(h.z>=0?-1:1)*0.28; }      // con il muro sul primo palo, mezzo passo verso l'angolo lungo
  return { x:ogx+t.dir*0.7, z:clamp(z,-GW*0.85,GW*0.85), gk:true };
}
// steering behaviors: arrive + separation dai compagni + aggiramento degli avversari sulla traiettoria
export function steer(p,ux,uz,d){
  let ax=ux, az=uz;
  for(const o of allPlayers){
    if(o===p||o.excluded) continue;
    const ox=o.x-p.x, oz=o.z-p.z, od=Math.hypot(ox,oz);
    if(od>1.6||od<0.001) continue;
    if(o.team===p.team){ const w=(1.6-od)/1.6*0.5; ax-=ox/od*w; az-=oz/od*w; }
    else if(od<d-0.4 && o!==ball.holder){
      const fwd=(ox*ux+oz*uz)/od;
      if(fwd>0.45){ const side=(ux*oz-uz*ox)>0?1:-1, w=(1.6-od)/1.6*1.3*fwd; ax+=uz*side*w; az-=ux*side*w; }
    }
  }
  const l=Math.hypot(ax,az)||1;
  return [ax/l,az/l];
}
export function closestTo(team,pt,skipGK=true){
  let best=null,bd=1e9;
  for(const p of team.players){ if(p.excluded||(skipGK&&p.isGK)) continue; const d=dist(p,pt); if(d<bd){bd=d;best=p;} }
  return best;
}
// Palla vagante (rimbalzo su palo o traversa, respinta, palla che ricade in acqua): di ogni squadra ci va SUBITO il giocatore
// più vicino, portiere compreso se la palla è vicina alla sua porta; vince chi arriva prima. Nella squadra del giocatore, se il
// più vicino è quello controllato (che potrebbe non muoversi) ci va anche il secondo.
const _vag={ t:-1, chi:new Set(), x:0, z:0 };
export function pallaVagante(){ return ball.state==='free' || (ball.state==='flight'&&ball.kind==='rebound'); }
function chiVaSullaPalla(){
  if(_vag.t===game.time) return _vag;
  _vag.t=game.time; _vag.chi.clear();
  // dove sarà la palla: se è in aria, dove ricade; se scivola sull'acqua, un po' più avanti
  let tt=0.35;
  if(ball.state==='flight'){ const g=9.8, vy=ball.vy||0; tt=Math.min(1.3,(vy+Math.sqrt(vy*vy+2*g*Math.max(0,ball.y)))/g); }
  _vag.x=clamp(ball.x+ball.vx*tt*0.8,-12.3,12.3); _vag.z=clamp(ball.z+ball.vz*tt*0.8,-HW+0.3,HW-0.3);
  for(const t of teams){
    const cand=[];
    for(const q of t.players){
      if(q.excluded||game.time<q.stunUntil) continue;
      if(q.isGK && Math.hypot(_vag.x-ownGoalX(t),_vag.z)>6.5) continue;
      cand.push([Math.hypot(q.x-_vag.x,q.z-_vag.z),q]);
    }
    cand.sort((a,b)=>a[0]-b[0]);
    if(cand[0]) _vag.chi.add(cand[0][1]);
    if(cand[1] && cand[0][1]===ctrl) _vag.chi.add(cand[1][1]);
  }
  return _vag;
}
export function aiTarget(p){
  if(p.isGK && setteControSei(p.team) && game.possTeam===p.team) return { x:goalX(p.team)-p.team.dir*8.6, z:2.6, sprint:true };      // 7 contro 6: il portiere sale a fare il settimo attaccante
  if(pallaVagante()){ const v=chiVaSullaPalla(); if(v.chi.has(p)) return { x:v.x, z:v.z, sprint:true }; }
  if(p.isGK) return gkTarget(p);
  const t=p.team;
  if(ball.state==='flight'&&ball.kind==='pass'&&ball.target===p) return {x:ball.tx,z:ball.tz,sprint:true};
  const poss = game.possTeam || (ball.lastTeam);
  if(poss===t) return attackTarget(p);
  if(poss===other(t)) return rientro(p)||markTarget(p);
  // palla contesa (sprint iniziale): solo il più vicino va sulla palla, gli altri risalgono la propria corsia fino alla posizione di ruolo
  return {x:-t.dir*FORM[p.i][0]*0.8, z:KICK_Z[p.i]*t.dir, sprint:true};   // palla contesa: ci si ferma a metà campo
}
// ultimo minuto dell'ultimo tempo, sotto di un gol: la squadra del computer attacca in 7 contro 6 con il portiere avanzato
const PAZIENZA=[23,4];      // secondi di possesso prima di cominciare a cercare il tiro, e secondi per arrivare alla piena voglia di tirare
export function setteControSei(t){
  return !t.human && game.period===4 && game.clock<60 && other(t).score-t.score===1;
}
// DIFESA COME SI GIOCA OGGI. Di base pressing (uomo contro uomo). Nella seconda parte dell'azione, soprattutto se il marcatore
// del centroboa è in difficoltà (il centroboa gli ha preso posizione), si passa a zona: zona a M se il centroboa avversario è
// forte, altrimenti zona semplice. La zona si costruisce decidendo CHI LASCIARE TIRARE.
export function scegliDifesa(){ return 2; }
// Chi lasciare tirare: il giocatore di perimetro meno pericoloso in questo momento. Conta la bravura al tiro (Potenza e Precisione)
// e la mano: dal lato destro (posizioni 1 e 2) un destro ha poco angolo, lì è pericoloso il mancino; dal lato sinistro il contrario.
export function chiLasciare(dif){
  const att=other(dif); let b=null, bs=1e9;
  for(const q of att.players){
    if(q.isGK||q.excluded||q.i===1) continue;
    const destra=q.i===2||q.i===4, sinistra=q.i===3||q.i===5, manc=q.mano==='S';
    let per=(q.s.pot+q.s.pre)/2 + (destra?(manc?7:(q.i===2?-12:-6)):sinistra?(manc?-8:3):0) + (q.i===2||q.i===3?-4:0);      // dalle ali si vede meno porta
    if(per<bs){ bs=per; b=q; }
  }
  return b;
}
export function passaAZona(t,quale,annuncia){
  t.defPlay=quale; t.lasciato=chiLasciare(t);
  if(annuncia&&t.lasciato) notifica('avviso',`${t.short}: ${quale===3?'zona a M':'zona'}`,{dettaglio:`si lascia tirare il #${t.lasciato.num} (${ROLES[t.lasciato.i].toLowerCase()})`,durata:1.6});
}
// il computer, mentre difende: pressing all'inizio, zona nella seconda parte dell'azione se il centroboa sta vincendo il duello
// (o comunque, a volte, negli ultimi secondi, per togliere riferimenti)
export function aggiornaDifesa(t,dt){
  if(t.human||game.possTeam!==other(t)||t.defPlay!==2||game.shot>15||inRientro(t)||t.players.some(q=>q.excluded)) return;
  const att=other(t), boa=att.players[1], inDifficolta=fight.active&&fight.def&&fight.def.team===t&&fight.v>0.2;
  if(inDifficolta||rnd()<dt*0.07){
    const forte=!boa.excluded&&(boa.s.frz+boa.s.pot)/2>74;
    passaAZona(t,forte||inDifficolta?3:1,true);
  }
}
export function aiShoot(p,power,lob){
  const kind=lob?'lob':shotKind(p), r=kind==='shot'?rnd():1;
  if(r<0.14) startAct(p,'polso',0.04,()=>doShoot(p,0.42,false,null,{polso:true,dopoFinta:p.fakeUntil>game.time}));        // tiro di polso
  else if(r<0.24) startAct(p,'torsione',0.12+rnd()*0.1,()=>doShoot(p,power,false,null,{torsione:true}));                  // torsione e diagonale
  else startAct(p, kind, lob?0.1:0.12+rnd()*0.1, ()=>doShoot(p,power,lob,null));
}
export function aiPass(p,m){ startAct(p,'pass',0.08,()=>doPass(p,m),[m.x,m.z]); }
export function aiCarrier(p,dt){
  const t=p.team, gx=goalX(t);
  if(p.isGK && !setteControSei(t)){
    p.target={x:p.x,z:p.z};
    if(p.act) return;
    if(ball.holdTime>1.0+rnd()*0.05){ const m=bestPassTarget(p); if(m) aiPass(p,m); }
    return;
  }
  if(fight.active&&fight.boa===p){ p.target={x:p.x,z:p.z}; return; }     // il centroboa in lotta decide in boaHold
  const slot=attackTarget(p);
  const dGoal=Math.hypot(gx-p.x,p.z);
  p.target={x:slot.x+t.dir*0.8, z:slot.z, sprint: Math.abs(p.x-slot.x)>6};
  if(p.act) return;
  // in superiorità: tiro al volo appena ricevuto il passaggio
  if((p.alVolo||p.i===1||p.i===6) && ball.holdTime<0.15 && manUp(t) && dGoal<7.5 && !(p.freeThrow&&Math.abs(gx-p.x)<6)){ p.alVolo=false; startAct(p,'shot',0.03,()=>doShoot(p,0.62,false,null,{volo:true})); return; }
  p.decideT-=dt;
  if(p.decideT>0) return;
  p.decideT=0.3+rnd()*0.35;
  const ft=p.freeThrow&&Math.abs(gx-p.x)<6;       // tiro libero dentro i 6 metri: non si può tirare direttamente
  // time-out dell'allenatore: dopo un parziale negativo, dopo una serie di espulsioni subite, o per preparare il 7 contro 6
  if(t.timeouts>0 && !t.human && t.vuoleTimeout && timeout(t)){ t.vuoleTimeout=false; t.parzialeSubito=0; return; }
  if(t.timeouts>0 && !t.human && rnd()<0.25){ let st=0,n=0; for(const q of t.players){ if(!q.isGK&&!q.excluded){ st+=q.stamina; n++; } } if(n&&st/n<0.3&&timeout(t)) return; }
  if(p.shootNext){ p.shootNext=false; if(dGoal<9&&!ft){ aiShoot(p,0.6+rnd()*0.4,false); return; } }
  const gk=other(t).players[0];
  const aim=-Math.sign(gk.z||(rnd()-0.5))*(0.9+rnd()*0.4);
  const lane=laneClear(p,gx,aim,t,0.7);
  let press=99; for(const o of other(t).players){ if(!o.excluded&&!o.isGK) press=Math.min(press,dist(o,p)); }
  if(dGoal<8.5&&!ft){
    // pazienza: a difesa schierata l'attacco si costruisce (si tira di rado nei primi secondi del possesso); in superiorità
    // o in controfuga, con pochi difensori davanti, si tira subito
    const davanti=difensoriDavanti(p);
    // (con l'uomo in più si fa girare palla qualche secondo prima di cercare il tiro; la controfuga vera è con nessuno davanti)
    const pazienza = davanti===0 ? 1 : manUp(t) ? clamp((15.5-game.shot)/4,0,1) : clamp((SHOT_CLOCK-game.shot-PAZIENZA[0])/PAZIENZA[1],0,1);
    // con l'uomo in più l'esterno, che ha poco angolo, tira di rado: cerca l'uomo al palo o chi sta ai 5 metri
    const angolo = manUp(t) ? clamp(Math.abs(gx-p.x)/Math.max(0.1,dGoal)*2,0.15,1) : 1;
    // si tira quando si è liberi: subito dopo un passaggio che ha liberato il tiratore o cambiato lato; con il difensore davanti
    // a braccio alto e tutti piazzati si aspetta, si finta o si fa girare palla (il tiro arriva comunque a fine azione)
    const sit=situazioneTiro(p), occasione=(sit.liberato?1.7:1)*(sit.dopoCambio?1.6:1)*(1-0.75*sit.marcato)*(sit.daFermo?0.6:1);
    const want = game.shot<2.5 ? 0.9 : (game.shot<6 ? 0.35 : (lane?0.2+0.36*(1-dGoal/8.5):0.1)*(press>1.5?1.35:press<0.9?0.6:1)*pazienza)*angolo*clamp(occasione,0.12,2.2);
    if(rnd()<want){
      if(!p.fakeUsed && game.shot>5 && rnd()<0.18){ p.fakeUsed=true; p.shootNext=true; p.decideT=0.5; startAct(p,'fake',0.12,()=>doFake(p)); return; }
      const lob = dGoal>5 && rnd()<0.12; aiShoot(p,0.55+rnd()*0.45,lob); return;
    }
  }
  if(game.shot<2 && dGoal<13 && !ft){ aiShoot(p,0.9,false); return; }
  // con l'uomo in più la palla gira in fretta: un tocco e via, per spostare la difesa e il portiere
  if(p.freeThrow || (press<1.3&&rnd()<0.55) || ball.holdTime>(manUp(t)?0.55+rnd()*0.5:2.5+rnd()*2.5)){
    const m=bestPassTarget(p); if(m){ aiPass(p,m); return; }
  }
}
