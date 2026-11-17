// ================= IA =================
import { azioneAperta, difensoriDavanti } from './statistiche.js';
import { ARBITRO, DEF_DOWN, FORM, GW, HW, KICK_Z, MARK, ROLES, SHOT_CLOCK, clamp, dist, rnd } from './costanti.js';
import { anticipoTarget, centroTarget, leggiCentro } from './centroboa.js';
import { schemaSquadra } from './schemi.js';
import { avanzaUomo, avviaUomo, ePalo, perimetroUomo, postiUomo, postiUomoDi, scelti as sceltiUomo, trova as trovaUomo, SCELTI_BASE } from './uomo-in-piu.js';
import { doFake, falloSenzaPalla, timeout } from './regole.js';
import { annuncia as notifica } from './cronaca.js';
import { allPlayers, ball, ctrl, fight, game, goalX, other, ownGoalX, teams } from './stato.js';
import { paloCoperto } from './muro.js';
import { QTE, aiControfuga, occasioneControfuga, tiroSpeciale } from './controfuga.js';
import { bestPassTarget, doPass, doShoot, laneClear, openness, shotKind, situazioneTiro, startAct } from './tiri.js';
export function manUp(t){ return other(t).players.some(q=>q.excluded); }
// l'uomo che marca p: di regola quello del ruolo (MARK); dopo un CAMBIO DI MARCATURA su un'entrata («time switching», Nitzkowski e
// manuale USA Water Polo) i due difensori si scambiano gli uomini per qualche secondo
export function uomoDi(p){
  const t=p.team, sc=t.scambio, base=other(t).players[MARK[p.i]];
  if(sc&&game.time<sc.fino&&!sc.a.excluded&&!sc.b.excluded){ if(p===sc.a) return other(t).players[MARK[sc.b.i]]; if(p===sc.b) return other(t).players[MARK[sc.a.i]]; }
  return base;
}
// chi entra (taglio) e ha superato il proprio difensore viene preso dal compagno che gli sta davanti, che lascia il suo uomo
// di perimetro al difensore battuto; non si scambia con il marcatore del centroboa, né con l'uomo in meno
function cambioMarcatura(t){
  if(t.scambio&&game.time<t.scambio.fino) return;
  t.scambio=null;
  const att=other(t); if(game.possTeam!==att||t.players.some(q=>q.excluded)||inRientro(t)) return;
  const ogx=ownGoalX(t);
  for(const q of att.players){
    if(!q.cut||q.cut.phase!==0||q.isGK) continue;
    const a=t.players.find(d=>!d.excluded&&!d.isGK&&d!==ctrl&&uomoDi(d)===q); if(!a||MARK[a.i]===1) continue;
    const qd=Math.abs(q.x-ogx); if(Math.abs(a.x-ogx)<qd+0.8) continue;      // il suo difensore non è stato battuto
    let b=null,bd=2.6;
    for(const d of t.players){ if(d===a||d.excluded||d.isGK||d===ctrl||MARK[d.i]===1) continue;
      const dd=dist(d,q); if(dd<bd&&Math.abs(d.x-ogx)<qd+0.2){ b=d; bd=dd; } }
    if(b){ t.scambio={a,b,fino:game.time+5}; t.scambi=(t.scambi||0)+1; return; }
  }
}
// Uomo in più (v0.44): posti della fase in corso dello schema chiamato, altrimenti il 4-2 della strategia
export const postiSup = t => postiUomo(t,schemaSquadra(t).superiorita);
// in superiorità è «palo» chi occupa un posto davanti alla porta nella fase in corso (non più solo centroboa e punto)
export function paloUomo(p){ return !p.isGK&&manUp(p.team)&&ePalo(postiSup(p.team)[p.i-1]); }
export function viciniUomo(t,a,b){
  const o=perimetroUomo(postiSup(t)),ia=o.indexOf(a),ib=o.indexOf(b);
  return ia>=0&&ib>=0&&Math.abs(ia-ib)===1;
}
// schemi del computer: i tre di base (la squadra umana usa i tre scelti nella sezione «Uomo in più»)
export const schemiUomo = t => t.human ? sceltiUomo() : SCELTI_BASE.map(trovaUomo).filter(Boolean);
// il giocatore chiama uno dei suoi schemi (i = 0, 1, 2); null = torna al 4-2 della strategia
export function chiamaUomo(t,i){
  const sc=schemiUomo(t)[i]||null; avviaUomo(t,sc,game.time); if(t.uomo) t.uomo.possT=game.possT; t.uomoPossT=game.possT; return sc;
}
export function startCut(p){
  if(p.isGK||p.excluded||ball.holder===p||manUp(p.team)||p.team.players.some(q=>q!==p&&q.cut)) return false;
  const t=p.team, side=Math.abs(p.z)<0.5?(rnd()<0.5?1:-1):Math.sign(p.z);
  p.cut={t0:game.time,phase:0,x:goalX(t)-t.dir*2.6,z:side*1.7}; p.cutT=game.time;
  const cover=t.players.filter(q=>q!==p&&q!==ball.holder&&q!==ctrl&&!q.isGK&&!q.excluded&&!q.uscendo)
    .sort((a,b)=>(b.i===6?10:0)+Math.abs(goalX(t)-b.x)-(a.i===6?10:0)-Math.abs(goalX(t)-a.x))[0];
  if(cover) t.copertura={chi:cover,entrante:p,possT:game.possT,d:Math.max(6.8,schemaSquadra(t).attacco[p.i-1][0]),z:p.i===6?0:schemaSquadra(t).attacco[cover.i-1][1]};
  // BLOCCO (manuale USA Water Polo: «picks» 3 per 2, 1 per 2, 2 per 1): il compagno più vicino al difensore di chi entra gli va
  // addosso per ritardarlo; si crea il 2 contro 1. Il centroboa e chi ha la palla non bloccano.
  const dif=other(t).players.find(q=>!q.excluded&&!q.isGK&&uomoDi(q)===p);
  const bl=dif&&t.players.filter(q=>q!==p&&q!==cover&&q!==ball.holder&&q!==ctrl&&!q.isGK&&!q.excluded&&!q.uscendo&&q.i!==1).sort((a,b)=>dist(a,dif)-dist(b,dif))[0];
  t.blocco=bl&&dist(bl,dif)<4.5?{chi:bl,su:dif,entrante:p,fino:game.time+3,fatto:false}:null;
  return true;
}
// Un solo tagliante e una copertura: l'editor sceglie il ruolo, la situazione decide quando parte.
export function aggiornaSchemi(t){
  const s=schemaSquadra(t);
  { const b=t.blocco;      // il blocco riuscito ritarda il difensore; se chi blocca lo trattiene, l'arbitro fischia fallo in attacco
    if(b&&!b.fatto&&game.time<b.fino&&game.state==='play'&&game.possTeam===t&&!b.su.excluded&&dist(b.chi,b.su)<0.75){
      b.fatto=true; t.blocchi=(t.blocchi||0)+1;
      if(rnd()<0.12*ARBITRO) { falloSenzaPalla(b.chi,b.su,'blocco irregolare'); return; }
      b.su.stunUntil=Math.max(b.su.stunUntil,game.time+0.7);
    } else if(b&&(game.time>b.fino||game.possTeam!==t)) t.blocco=null; }
  // uomo in più: il computer sceglie uno dei suoi schemi a ogni nuova superiorità; il giocatore lo chiama lui (callPlay)
  if(t.human&&!game.autoplay&&t.uomo&&!(manUp(t)&&game.possTeam===t)){      // fine della superiorità: com'è andato lo schema chiamato
    notifica('avviso',t.uomo.saltato?`${t.uomo.schema.sigla||t.uomo.schema.nome}: fasi saltate`:`${t.uomo.schema.sigla||t.uomo.schema.nome}: schema eseguito`,{durata:1.2,registro:false}); t.uomo=null; }
  if(manUp(t)&&game.possTeam===t){
    if(t.uomoPossT!==game.possT){ t.uomoPossT=game.possT; t.uomo=null;
      if(!t.human||game.autoplay){ const l=schemiUomo(t); if(l.length){ avviaUomo(t,l[Math.floor(rnd()*l.length)],game.time); t.uomo.possT=game.possT; } } }
    if(t.uomo){
      // arrivati: in media a meno di 1,6 m dai posti della fase (chi ha la palla e il giocatore controllato non contano)
      const f=t.uomo.schema.fasi[t.uomo.fase].posti,gx=goalX(t); let s2=0,n=0;
      for(const q of t.players){ if(q.isGK||q.excluded||q===ball.holder||q===ctrl) continue; const [d,z]=f[q.i-1]; s2+=Math.hypot(q.x-(gx-t.dir*d),q.z-z*t.dir); n++; }
      avanzaUomo(t,game.time,!n||s2/n<1.6);
    }
  } else if(t.uomo||t.uomoPossT!=null){ t.uomo=null; t.uomoPossT=null; }
  if(!t.schemaStato||t.schemaStato.possT!==game.possT||t.schemaStato.schema!==s){
    t.schemaStato={possT:game.possT,schema:s,next:game.time+0.6}; t.copertura=null; t.aiutoStato=null;
    for(const p of t.players) p.cut=null;
  }
  for(const p of t.players) if(p.cut&&(p.excluded||p.uscendo||game.time-p.cut.t0>6.4)) p.cut=null;
  if(game.possTeam!==t){ t.copertura=null; for(const p of t.players) p.cut=null; return; }
  if(t.copertura&&(!t.copertura.entrante.cut||t.copertura.chi.excluded||t.copertura.chi===ball.holder)) t.copertura=null;
  const h=ball.holder,p=t.players[s.entrata],st=t.schemaStato;
  if(!s.entrata||manUp(t)||!h||h.team!==t||h.isGK||!p||p===h||p===ctrl||p.excluded||p.uscendo||p.cut||game.time<st.next||
    Math.abs(goalX(t)-h.x)>8.5||dist(h,p)<3||t.players.some(q=>q.cut)) return;
  // Entrare dietro il difensore che si è abbassato o quando il lato opposto tiene la palla.
  const def=other(t).players.find(q=>!q.excluded&&MARK[q.i]===p.i);
  const spazio=!def||Math.abs(goalX(t)-def.x)<Math.abs(goalX(t)-p.x)-0.6||Math.sign(h.z)!==Math.sign(p.z);
  if(spazio&&startCut(p)) st.next=game.time+7;
}
function riferimentoPalla(t){
  if(ball.holder?.team===t) return ball.holder;
  if(ball.state==='flight'&&ball.kind==='pass'&&ball.target?.team===t) return ball.target;
  return null;
}
// Piccoli appoggi attorno al posto di ruolo, senza trasformare tutti gli attaccanti in taglianti.
// La scelta resta ferma per un secondo: niente inversioni a ogni fotogramma quando si apre la linea.
function appoggio(p,x,z,sup){
  const h=riferimentoPalla(p.team);
  let a=p.appoggio;
  if(!h||h===p||p===ctrl||p.uscendo||(!sup&&fight.active&&fight.boa===p)){
    if(a){ a.h=null; a.fino=0; } return null;
  }
  if(!a) a=p.appoggio={h:null,possT:-1,dx:0,dz:0,fino:0,dopo:0,checkT:0};
  if(a.h!==h||a.possT!==game.possT){ a.h=h; a.possT=game.possT; a.fino=0; a.dopo=0; a.checkT=0; }
  if(game.time<a.fino) return a;
  a.dx=a.dz=0;
  if(game.time<a.dopo||game.time<a.checkT) return null;
  a.checkT=game.time+0.3;
  if(Math.hypot(p.x-x,p.z-z)>2||dist(h,p)<2.2|| (laneClear(h,p.x,p.z,p.team)&&openness(p)>1.8)) return null;
  let best=-1e9, base=-1e9, bx=x,bz=z;
  const dx=x-h.x,dz=z-h.z,l=Math.hypot(dx,dz)||1;
  for(let k=0;k<9;k++){
    // Otto direzioni, al massimo 1,25 m: ali larghe e punto in copertura restano riconoscibili.
    const ang=(k-1)*Math.PI/4,r=k===0?0:1.25;
    const cx=x+(dx/l*Math.sin(ang)-dz/l*Math.cos(ang))*r;
    const cz=clamp(z+(dz/l*Math.sin(ang)+dx/l*Math.cos(ang))*r,-HW+0.5,HW-0.5);
    if(Math.abs(z)>1.5&&Math.sign(cz)!==Math.sign(z)) continue;
    if(Math.abs(cz)<3.58&&Math.abs(goalX(p.team)-cx)<Math.min(2.08,Math.abs(goalX(p.team)-h.x)+0.2)) continue;
    let vicino=99,compagno=99;
    for(const q of other(p.team).players){ if(!q.excluded) vicino=Math.min(vicino,Math.hypot(q.x-cx,q.z-cz)); }
    for(const q of p.team.players){ if(q!==p&&!q.excluded) compagno=Math.min(compagno,Math.hypot(q.x-cx,q.z-cz)); }
    const s=(laneClear(h,cx,cz,p.team)?3:0)+Math.min(vicino,3)*0.65-Math.max(0,1.7-compagno)*3-r*0.18;
    if(k===0) base=s;
    if(s>best){ best=s; bx=cx; bz=cz; }
  }
  if(best<base+0.7) return null;
  a.dx=bx-x; a.dz=bz-z; a.fino=game.time+(sup?1.2:1); a.dopo=a.fino+0.6;
  return a;
}
function paloTarget(p,f){
  const t=p.team,gx=goalX(t),h=riferimentoPalla(t),side=Math.sign(f[1]||1);
  let d=f[0],z=f[1];
  if(h&&h!==p){
    const hd=Math.abs(gx-h.x),hz=h.z*t.dir,near=side===Math.sign(hz||1);
    if(near){
      // Il palo vicino esce sulla ricezione esterna; il lontano resta sulla linea.
      const tx=gx-t.dir*(d+0.9),tz=(z+Math.sign(hz-z)*0.45)*t.dir;
      const chiuso=other(t).players.some(q=>!q.excluded&&!q.isGK&&Math.hypot(q.x-tx,q.z-tz)<0.95);
      if(!chiuso){ d+=hd>3.8?1.15:0.85; z+=(hz-z)*0.18; }
    }else{
      const vicino=t.players.find(q=>q!==p&&!q.isGK&&manUp(t)&&ePalo(postiSup(t)[q.i-1]));      // l'altro palo della fase in corso
      const centraleSegue=vicino&&other(t).players.some(q=>!q.excluded&&!q.isGK&&Math.abs(q.z)<2.2&&dist(q,vicino)<1.65);
      if(centraleSegue) z+=Math.sign(hz||1)*Math.min(0.9,Math.abs(z)*0.55);
    }
    d=Math.max(Math.min(2.1,hd+0.2),d);
  }
  let x=gx-t.dir*d,zz=z*t.dir;
  // Non correre da una marcatura dentro la seconda: arretra il candidato prima del nuovo ostacolo.
  const bx=gx-t.dir*f[0],bz=f[1]*t.dir;
  for(const q of other(t).players){
    if(q.excluded||q.isGK||Math.hypot(q.x-bx,q.z-bz)<1) continue;
    if(Math.hypot(q.x-x,q.z-zz)<1){ x=(x+bx)*0.5; zz=(zz+bz)*0.5; }
  }
  return {x,z:zz,sprint:Math.hypot(x-p.x,zz-p.z)>1.5};
}
// CONTROFUGA ORGANIZZATA (v0.45, manuale USA Water Polo 2021, capitolo «The counter attack»). Appena si recupera palla lontano dalla
// porta avversaria si risale per TRE CORSIE (destra, centro, sinistra) e DUE LINEE: i primi tre (prima linea) vanno fino ai 2 metri
// sui due lati e al centro, così la seconda linea ha spazio per attaccare il 2 contro 1 sui 5 metri. Chi porta palla segue le tre
// regole del vantaggio: palla pressata → i compagni si spostano dal lato della palla; palla libera → si impegna il difensore e ci
// si allarga; difesa che non si impegna → si accelera. Senza vantaggio (transizione 6 contro 6) la struttura porta comunque
// all'attacco schierato prima che la difesa sia pronta. Finisce quando la palla arriva ai 5,5 m o dopo CONTRO.durata secondi.
export const CONTRO={ durata:9, zLati:4.0, dPrima:2.25, dSeconda:5.2, zSeconda:2.3 };
// STILE PER NAZIONALE (Canossa, Lupo et al. 2022, dopo le regole 2018): Italia, Serbia e Australia segnano fino al 33% dei gol in
// gioco veloce, Spagna, Croazia e Ungheria il 15% o meno. Probabilità di lanciare la controfuga organizzata dopo il recupero.
export const STILE_VELOCE={ ITA:1, SRB:1, AUS:1, ESP:0.5, CRO:0.5, HUN:0.5 };
export const stileVeloce = t => STILE_VELOCE[t.codice] ?? 0.8;
export function contropiede(t){
  const c=t.contro; if(!c) return null;
  if(game.possTeam!==t||game.time>c.fino||manUp(t)||Math.abs(goalX(t)-ball.x)<5.5){ t.contro=null; return null; }
  return c;
}
function pressato(h){ if(!h) return false; const gx=goalX(h.team), gd=Math.abs(gx-h.x);
  return other(h.team).players.some(q=>!q.excluded&&!q.isGK&&dist(q,h)<1.9&&Math.abs(gx-q.x)<gd+0.4); }
function contropiedeTarget(p,c){
  const t=p.team, gx=goalX(t), h=ball.holder&&ball.holder.team===t?ball.holder:null, ballD=Math.abs(gx-ball.x);
  if(c.calcT!==game.time){
    c.calcT=game.time;
    const liberi=t.players.filter(q=>!q.isGK&&!q.excluded&&!q.uscendo&&q!==h).sort((a,b)=>Math.abs(gx-a.x)-Math.abs(gx-b.x));
    const prima=liberi.slice(0,3).sort((a,b)=>a.z*t.dir-b.z*t.dir), seconda=liberi.slice(3).sort((a,b)=>a.z*t.dir-b.z*t.dir);
    const pz=h?h.z*t.dir:0, regola=!h?0:pressato(h)?1:2;      // 1: pressata → verso la palla; 2: libera → ci si allarga
    c.posti=new Map(); c.regola=regola;
    const zP=[-CONTRO.zLati,0,CONTRO.zLati].slice(prima.length===3?0:1).slice(0,prima.length);
    prima.forEach((q,k)=>{ let z=prima.length===3?zP[k]:(k===0?-CONTRO.zLati:CONTRO.zLati);
      if(regola===1) z+=Math.sign(pz||1)*1.3; else if(regola===2&&z!==0) z*=1.12;
      c.posti.set(q,{d:Math.max(CONTRO.dPrima,ballD-6.5),z}); });
    seconda.forEach((q,k)=>{ const z=(seconda.length===1?0:(k===0?-CONTRO.zSeconda:CONTRO.zSeconda))+(regola===1?Math.sign(pz||1)*0.8:0);
      c.posti.set(q,{d:Math.max(CONTRO.dSeconda,ballD-1.5),z}); });
  }
  const ps=c.posti.get(p); if(!ps) return null;
  return { x:gx-t.dir*ps.d, z:clamp(ps.z*t.dir,-HW+0.5,HW-0.5), sprint:true };
}
// chi porta palla in controfuga: risale la sua corsia; 1 contro 0 verso il palo del braccio forte, palla in mano dentro i 5 metri,
// poi scivolamento laterale verso l'altro palo dopo la finta al portiere (manuale USA: «1v0 counter attack»)
export function contropiedePortatore(p){
  const t=p.team, gx=goalX(t), dG=Math.hypot(gx-p.x,p.z);
  const forte=t.dir*(p.mano==='S'?-1:1);      // lato del braccio di tiro, guardando la porta avversaria
  if(difensoriDavanti(p)===0){
    if(dG>5.2) return { x:gx-t.dir*4.6, z:forte*1.0, sprint:true, unoZero:true };
    return { x:gx-t.dir*3.6, z:-forte*0.9, sprint:false, unoZero:true };
  }
  const via=pressato(p)?Math.sign(p.z-(other(t).players.filter(q=>!q.excluded&&!q.isGK).sort((a,b)=>dist(a,p)-dist(b,p))[0]?.z??0)||1)*1.6:0;
  return { x:gx-t.dir*Math.max(5.2,Math.abs(gx-p.x)-4), z:clamp(p.z*0.8+via,-HW+0.8,HW-0.8), sprint:true };
}
export function attackTarget(p){
  const t=p.team, gx=goalX(t);
  if(p.isGK) return { x:gx-t.dir*8.6, z:2.6 };      // 7 contro 6: il portiere avanzato sta dietro l'arco (non ha un posto nello schema)
  // NON SBILANCIARSI IN ATTACCO (manuale USA: «do not over commit to offense»): appena parte il tiro il punto e i mezzi cominciano
  // a rientrare, così la controfuga avversaria trova la difesa già in transizione (nelle partite vere le controfughe sono poche)
  if(ball.kind==='shot'&&ball.state==='flight'&&ball.shooter?.team===t&&!ball.rigore&&(p.i===6||p.i===4||p.i===5)&&!p.isGK&&ball.shooter!==p)
    return { x:gx-t.dir*(p.i===6?15:12.5), z:p.z*0.6, sprint:true };
  { const c=contropiede(t); if(c&&!p.cut){ if(ball.holder===p){ if(!(p.pressatoUntil>game.time)) return contropiedePortatore(p); } else { const tg=contropiedeTarget(p,c); if(tg) return tg; } } }
  if(p.cut){
    const c=p.cut;
    if(c.phase===0 && (Math.hypot(c.x-p.x,c.z-p.z)<0.7 || game.time-c.t0>4.5)){ c.phase=1; c.t1=game.time; }
    if(c.phase===1 && game.time-c.t1>1.6) p.cut=null;
    else return {x:c.x,z:c.z,sprint:c.phase===0};
  }
  let f;
  const sup=manUp(t);
  const s=schemaSquadra(t);
  f=[...(sup?postiUomoDi(t,p,schemaSquadra(t).superiorita,game.time):s.attacco)[p.i-1]];
  if(!sup&&t.copertura?.chi===p&&t.copertura.entrante.cut) return {x:gx-t.dir*t.copertura.d,z:t.copertura.z*t.dir};
  { const b=t.blocco; if(!sup&&b&&b.chi===p&&!b.fatto&&game.time<b.fino&&b.entrante.cut){ const c=b.entrante.cut,d=b.su;
      return {x:d.x+(c.x-d.x)*0.2,z:d.z+(c.z-d.z)*0.2,sprint:true}; } }
  if(!sup&&p.i===1){
    const tg=centroTarget(p),d=Math.max(Math.abs(gx-tg.x),Math.abs(gx-ball.x)-14);
    return {...tg,x:gx-t.dir*d};
  }
  // la squadra sale insieme alla palla: nessuno può stare troppo avanti rispetto a chi la porta
  // ognuno sale lungo la propria corsia, scaglionato per ruolo (boa e ali avanti, mezzi a metà, punto in copertura)
  const ballD=Math.abs(gx-ball.x), lead=[0,14,12,12,8,8,4][p.i];
  let f0=f[0], fz=f[1];
  if(ballD-lead>f0) f0=ballD-lead;
  if(sup&&ePalo(f)&&ballD<9) return paloTarget(p,[f0,fz]);
  const x=gx-t.dir*f0,z=clamp(fz*t.dir+(sup?0:Math.sin(game.time*0.6+p.uid)*0.35),-HW+0.5,HW-0.5);
  const a=appoggio(p,x,z,sup),ax=x+(a?a.dx:0),az=z+(a?a.dz:0);
  if(sup) return { x:ax, z:az, sprint:Math.hypot(ax-p.x,az-p.z)>1.5 };
  return { x:ax, z:az, sprint:(t.atkPlay===2&&(p.i===4||p.i===5))||game.time<(t.fugaFino||0) };
}
// Difesa con l'uomo in meno. Posizione di partenza: tre difensori sulla linea dei 2 metri, ciascuno in mezzo tra due dei quattro
// attaccanti; gli altri due davanti ai pali, a metà tra gli attaccanti ai 2 metri e quelli a 5. Ognuno prende il posto più vicino.
// Poi la zona scivola verso il lato della palla e chi sta davanti al palo esce con il braccio alto su chi ha palla ai 5 metri.
function postiInferiorita(t){
  if(t.postiT===game.time) return t.posti;
  const ogx=ownGoalX(t),defs=t.players.filter(q=>!q.excluded&&!q.isGK),m=new Map(),h=riferimentoPalla(other(t));
  let ruoli=t.postiAssegnati;
  if(!ruoli||ruoli.size!==defs.length||defs.some(q=>!ruoli.has(q))){
    ruoli=new Map();const liberi=new Set(defs);
    for(let i=0;i<Math.min(DEF_DOWN.length,defs.length);i++){
      const s=DEF_DOWN[i],x=ogx+t.dir*s[0];let b=null,bd=Infinity;
      for(const q of liberi){const d=Math.hypot(q.x-x,q.z-s[1]);if(d<bd){b=q;bd=d;}}
      liberi.delete(b);ruoli.set(b,i);
    }
    t.postiAssegnati=ruoli;
    // UOMO IN MENO: «a grappolo» (stretti davanti alla porta, la scelta dell'80-93% delle squadre ai Mondiali 2009) oppure «in
    // anticipo» (si esce sulle linee di passaggio verso i tiratori). Il computer sceglie l'anticipo una volta su sei.
    t.difesaMeno=t.human?'grappolo':rnd()<0.16?'anticipo':'grappolo';
  }
  const anticipo=t.difesaMeno==='anticipo';
  const sciv=clamp((h?h.z:ball.z)*(anticipo?0.29:0.18),-1.4,1.4);
  for(const [q,i] of ruoli){
    const s=DEF_DOWN[i];
    let x=s[0], z=s[1]+sciv;
    if(s[0]>3&&h&&Math.abs(ogx-h.x)>4&&Math.sign(h.z||1)===Math.sign(s[1])){
      x=Math.min(Math.abs(ogx-h.x)-(anticipo?0.7:0.95),anticipo?5.6:5);z=s[1]+(h.z-s[1])*(anticipo?0.8:0.7);
    }else if(Math.abs(s[1])>3&&h){
      const palo=other(t).players.find(p=>!p.excluded&&(p.i===1||p.i===6)&&Math.sign(p.z)===Math.sign(s[1]));
      if(palo&&Math.abs(ogx-palo.x)>2.7&&Math.sign(h.z||1)===Math.sign(s[1])&&Math.abs(ogx-h.x)>4){
        x=Math.max(1.8,Math.abs(ogx-palo.x)-0.7);z=palo.z+(s[1]-palo.z)*0.25;
      }
    }else if(i===0&&h){
      // Il centrale prende il palo vicino alla palla: quello lontano può scorrere nella finestra lasciata.
      const palo=other(t).players.find(p=>!p.excluded&&(p.i===1||p.i===6)&&Math.sign(p.z)===Math.sign(h.z||1));
      if(palo){z=clamp(palo.z*0.55,-1.6,1.6);x=Math.max(1.8,Math.min(2.7,Math.abs(ogx-palo.x)-0.8));}
    }
    const px=ogx+t.dir*x,bd=Math.hypot(q.x-px,q.z-z);
    m.set(q,{x:px,z:clamp(z,-HW+0.5,HW-0.5),sprint:bd>2.5});
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
  const a=uomoDi(p), attD=a&&!a.excluded?Math.abs(a.x-ogx):99;
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
function aiutoDifensivo(p){
  const t=p.team;
  if(t.defPlay!==1&&t.defPlay!==3){ t.aiutoStato=null; return null; }
  const h=riferimentoPalla(other(t)),boa=other(t).players[1];
  if(!h||h===boa||h.isGK||boa.excluded||Math.abs(ownGoalX(t)-h.x)>8||Math.abs(ownGoalX(t)-boa.x)>4.6){t.aiutoStato=null;return null;}
  const def=t.players.find(q=>!q.excluded&&MARK[q.i]===1),lettura=leggiCentro(boa,def,h);
  if(!lettura.ricevibile){t.aiutoStato=null;return null;}
  const x=h.x+(boa.x-h.x)*0.62,z=h.z+(boa.z-h.z)*0.62;
  let st=t.aiutoStato;
  if(!st||st.h!==h||game.time>st.fino||st.p.excluded||st.p===ctrl){
    let helper=null,bd=Infinity;
    for(const i of schemaSquadra(t).aiuti){
      const q=t.players[i],uomo=other(t).players[MARK[i]];
      if(!q||q===def||q===ctrl||q.excluded||q.uscendo||uomo===h||!uomo||uomo.excluded) continue;
      const d=Math.hypot(q.x-x,q.z-z);if(d<bd){helper=q;bd=d;}
    }
    st=t.aiutoStato=helper&&bd<5?{h,p:helper,fino:game.time+0.8}:null;
  }
  return st?.p===p?{x,z,sprint:true}:null;
}
export function markTarget(p){
  const t=p.team, ogx=ownGoalX(t);
  if(t.players.some(q=>q.excluded)){            // uomo in meno: tre sulla linea dei 2 metri negli spazi tra i quattro attaccanti, due davanti ai pali
    const posto=postiInferiorita(t).get(p); if(posto) return posto;
  }
  if(t.doubleP===p && game.time<t.doubleUntil && ball.holder && ball.holder.team!==t) return {x:ball.holder.x,z:ball.holder.z,sprint:true};
  const att=uomoDi(p);
  if(!att||att.excluded) return { x:ogx+t.dir*3.5, z:clamp(ball.z*0.4,-2,2) };
  const aiuto=aiutoDifensivo(p);if(aiuto) return aiuto;
  if(MARK[p.i]===1 && Math.abs(ogx-att.x)<5){
    return anticipoTarget(p,att);
  }
  // il difensore reagisce con un piccolo ritardo ai movimenti del suo uomo
  // contro chi ha la palla vicino alla porta ci si mette tra lui e il palo da coprire (muro.js), non tra lui e il centro
  const conPalla=ball.holder===att&&Math.abs(ogx-att.x)<9, pz=conPalla?paloCoperto(att)*GW*0.55:0;
  const ax=p.lagX, az=p.lagZ, dx=ogx-ax, dz=pz-az, l=Math.hypot(dx,dz)||1;
  let gap = ball.holder===att ? 0.85 : 1.0;
  // zona: ci si stacca verso il centroboa; chi marca il giocatore "lasciato" si stacca di più e resta staccato anche quando
  // quello ha la palla (gli si concede il tiro), gli altri restano più vicini al proprio uomo
  const lasc=(t.defPlay===1||t.defPlay===3)&&att===t.lasciato;
  if(t.defPlay===1 && p.i!==6) gap = lasc ? Math.min(ball.holder===att?2.6:3.4,l*0.6) : ball.holder===att ? 1.1 : Math.min(1.8,l*0.4);
  if(t.defPlay===2){
    gap = 0.8;                                                                        // pressing
    // ZONA-PRESSING (Botonis 2015; manuale USA: «è più pericolosa l'occasione dietro di me o quella davanti?»): chi è lontano
    // dalla palla e ha il centroboa libero alle spalle si abbassa a coprirlo; torna sul suo uomo quando la palla si avvicina
    const h=ball.holder, boa=other(t).players[1];
    if(h&&h.team!==t&&h!==att&&MARK[p.i]!==1&&boa&&!boa.excluded&&Math.abs(ogx-boa.x)<4.6&&dist(h,att)>5.5&&Math.abs(ogx-h.x)<10){
      if(t.centroT!==game.time){ t.centroT=game.time; t.centroAperto=leggiCentro(boa,t.players.find(q=>!q.excluded&&MARK[q.i]===1),h).ricevibile; }
      if(t.centroAperto) gap=Math.min(2.6,l*0.5);
    }
  }
  // chi ha appena fatto fallo resta a più di un metro da chi batte il tiro libero, altrimenti è interferenza (WP 20.2)
  const appenaFallo=att.freeThrow&&att.falloDa===p&&game.time-(att.falloT||0)<3;
  if(appenaFallo) return { x:ax+dx/l*Math.max(gap,1.35), z:az+dz/l*Math.max(gap,1.35) };
  // zona a M: due linee strette davanti alla porta (ali e punto bassi, mezzi più alti), braccia alte; lascia il tiro da lontano
  if(t.defPlay===3) gap = ball.holder===att ? (lasc?2.5:1.4) : Math.min(p.i===4||p.i===5?2.4:3.4,l*0.55);
  // l'attaccante carica il tiro: si va incontro al tiratore con il braccio alto (a meno che non sia quello lasciato tirare)
  const tira=conPalla&&!lasc&&(att.charging||(att.act&&!att.act.done&&att.act.kind!=='pass'&&att.act.kind!=='fake'));
  // e ci si sposta di 30 cm verso il palo da coprire, così il braccio alzato sta davanti a quella traiettoria
  const sp=conPalla&&!lasc?paloCoperto(att)*0.3:0;
  if(tira) return { x:ax+dx/l*Math.min(gap,0.75), z:az+dz/l*Math.min(gap,0.75)+sp, sprint:true };
  // MARCATURA SECONDO LA DISTANZA DALLA PALLA (v0.53, richiesta di Ale: «marcatori incollati»): chi marca un attaccante lontano
  // dalla palla si stacca verso la porta e verso il lato della palla, pronto ad aiutare; mano a mano che la palla si avvicina
  // al suo uomo torna a stringere. Tra 5 m (incollato come prima) e 10 m (staccato fino a 1,6 m e 0,4 m verso la palla).
  const hb=ball.holder;
  if(hb&&hb.team!==t&&hb!==att&&!hb.isGK&&!lasc&&t.defPlay!==3&&MARK[p.i]!==1){
    const lontano=clamp((Math.hypot(hb.x-att.x,hb.z-att.z)-5)/5,0,1);
    if(lontano>0){
      const g2=Math.max(gap,Math.min(0.8+0.8*lontano,l*0.4)), tx=ax+dx/l*g2, tz=az+dz/l*g2+sp;
      const vx=hb.x-tx, vz=hb.z-tz, vl=Math.hypot(vx,vz)||1, k=0.4*lontano;
      return { x:tx+vx/vl*k, z:tz+vz/vl*k };
    }
  }
  return { x:ax+dx/l*gap, z:az+dz/l*gap+sp };
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
  if(h&&h.team!==t&&Math.abs(h.x-ogx)<9){ const m=muroSu(h); if(m) z-=paloCoperto(h)*0.28; }      // il muro copre un palo (muro.js): mezzo passo verso l'altro
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
  cambioMarcatura(t);
  if(t.schema){
    if((t.defPlay===1||t.defPlay===3)&&(!t.lasciato||game.time>(t.lasciatoT||0))){t.lasciato=chiLasciare(t);t.lasciatoT=game.time+0.8;}
    return;
  }
  if(t.human||game.possTeam!==other(t)||t.defPlay!==2||game.shot>22||inRientro(t)||t.players.some(q=>q.excluded)) return;
  const att=other(t), boa=att.players[1], inDifficolta=fight.active&&fight.def&&fight.def.team===t&&fight.v>0.2;
  // Mondiali 2009 (Lupo et al. 2012): pressing 40-60% del tempo, zone 30-65%, zona a M 6-9%: la zona arriva spesso nella seconda
  // parte dell'azione; la zona a M solo contro un centroboa forte
  if(inDifficolta||rnd()<dt*0.7){
    const forte=!boa.excluded&&(boa.s.frz+boa.s.pot)/2>74;
    passaAZona(t,forte&&rnd()<0.3?3:1,true);
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
  if(!manUp(t)&&fight.active&&fight.boa===p){ p.target={x:p.x,z:p.z}; return; }     // il centroboa in lotta decide in boaHold
  const slot=attackTarget(p);
  const dGoal=Math.hypot(gx-p.x,p.z);
  p.target={x:slot.x+t.dir*0.8, z:slot.z, sprint: Math.abs(p.x-slot.x)>6};
  if(p.act&&!p.act.done) return;
  // 1 contro 0 in controfuga: dentro i 5 metri una finta per far saltare il portiere, poi lo scivolamento e il tiro
  if(slot.unoZero&&dGoal<5.4&&!p.fakeUsed&&!(p.freeThrow&&Math.abs(gx-p.x)<6)&&rnd()<dt*3){ p.fakeUsed=true; p.shootNext=true; p.decideT=0.45; startAct(p,'fake',0.1,()=>doFake(p)); return; }
  if(aiControfuga(p,dt)) return;      // controfuga: schizzo o colonnello
  // Il palo conclude subito solo nella finestra creata dal passaggio e dalla scelta difensiva.
  // superiorità: nelle partite vere dura circa 15 s (Mondiali 2009): si fa girare palla e si tira dopo almeno 5-6 passaggi di tempo,
  // tranne il «quick» dei primi secondi; tempoSup = secondi da quando è iniziata la superiorità
  const azSup=manUp(t)?azioneAperta():null, tempoSup=azSup&&azSup.tipo==='superiorita'?game.time-azSup.t0:99;
  const supPronta=!manUp(t)||tempoSup>5;
  if(supPronta&&(p.alVolo||paloUomo(p))&&ball.holdTime<0.15&&manUp(t)&&dGoal<7.5&&!(p.freeThrow&&Math.abs(gx-p.x)<6)){
    const sit=situazioneTiro(p),gk=other(t).players[0],aim=-Math.sign(gk.z||1);
    p.alVolo=false;
    if(sit.marcato<0.2&&sit.vicino>1.25&&!(p.pressatoUntil>game.time)&&laneClear(p,gx,aim,t,0.7)){
      startAct(p,'shot',0.03,()=>doShoot(p,0.62,false,null,{volo:true}));return;
    }
  }
  const ft=p.freeThrow&&Math.abs(gx-p.x)<6;       // tiro libero dentro i 6 metri: non si può tirare direttamente
  // Il vantaggio si legge anche tra due decisioni ordinarie. La breve cadenza evita ricerche complete a ogni frame.
  p.reazioneT=(p.reazioneT||0)-dt;
  if(p.reazioneT<=0&&ball.holdTime>=0.18){
    p.reazioneT=0.12;
    const press=openness(p),sottoPressione=p.pressatoUntil>game.time;
    const sit=situazioneTiro(p),angolo=Math.abs(gx-p.x)/Math.max(0.1,dGoal);
    if(supPronta&&!ft&&!sottoPressione&&dGoal<7&&angolo>0.68&&sit.liberato&&sit.marcato<0.2&&laneClear(p,gx,0,t,0.7)){
      // Il tiro rapido non deve consumare quasi sempre la controfuga prima che
      // il controllo per fotogramma scelga uno speciale. La decisione resta immediata.
      const speciale=dGoal<=QTE.maxComputer?occasioneControfuga(p):null;
      if(speciale&&rnd()<0.35) tiroSpeciale(p,speciale,null);
      else aiShoot(p,0.55+rnd()*0.45,false);
      return;
    }
    const m=bestPassTarget(p,false);
    if(m&&laneClear(p,m.x,m.z,t)&&openness(m)>1.5){
      const md=Math.hypot(gx-m.x,m.z),ma=Math.abs(gx-m.x)/Math.max(0.1,md);
      const vantaggio=openness(m)>2.1&&openness(m)>press+0.8&&md<8.5&&ma>0.5&&
        (md<dGoal-1||(manUp(t)&&Math.sign(m.z)!==Math.sign(p.z)));
      // sotto pressione (contrasto di disturbo) si scarica solo dalla parte opposta al difensore; altrimenti si protegge la palla
      // girandosi di spalle (partita.js) e si aspetta: il passaggio che scavalca chi pressa è quello che viene intercettato
      const dP=p.pressatoDa, scarico=!sottoPressione||!dP||((m.x-p.x)*(p.x-dP.x)+(m.z-p.z)*(p.z-dP.z))>0;
      if((ft||sottoPressione||press<1.25||vantaggio)&&scarico){ aiPass(p,m); return; }
    }
  }
  p.decideT-=dt;
  if(p.decideT>0) return;
  p.decideT=0.3+rnd()*0.35;
  // time-out dell'allenatore: dopo un parziale negativo, dopo una serie di espulsioni subite, o per preparare il 7 contro 6
  if(t.timeouts>0 && !t.human && t.vuoleTimeout && timeout(t)){ t.vuoleTimeout=false; t.parzialeSubito=0; return; }
  if(t.timeouts>0 && !t.human && rnd()<0.25){ let st=0,n=0; for(const q of t.players){ if(!q.isGK&&!q.excluded){ st+=q.stamina; n++; } } if(n&&st/n<0.3&&timeout(t)) return; }
  if(p.shootNext){ p.shootNext=false; if(dGoal<9&&!ft){ if((p.fakeCount||0)<2&&game.shot>4&&rnd()<0.28){ p.shootNext=true; p.decideT=0.2+rnd()*0.6; startAct(p,'fake',0.08+rnd()*0.1,()=>doFake(p)); return; } aiShoot(p,0.6+rnd()*0.4,false); return; } }
  const gk=other(t).players[0];
  const aim=-Math.sign(gk.z||(rnd()-0.5))*(0.9+rnd()*0.4);
  const lane=laneClear(p,gx,aim,t,0.7);
  let press=99; for(const o of other(t).players){ if(!o.excluded&&!o.isGK) press=Math.min(press,dist(o,p)); }
  if(dGoal<8.5&&!ft){
    // pazienza: a difesa schierata l'attacco si costruisce (si tira di rado nei primi secondi del possesso); in superiorità
    // o in controfuga, con pochi difensori davanti, si tira subito
    const davanti=difensoriDavanti(p);
    // (con l'uomo in più si fa girare palla qualche secondo prima di cercare il tiro; la controfuga vera è con nessuno davanti)
    // ...ma chi è DAVVERO libero (buon angolo, nessun avversario entro 1,8 m, traiettoria sgombra) non aspetta: segnalazione di Ale
    // (15/11/2026, «hanno chiare occasioni da gol ma non tirano»); prima tirava solo dopo 23 s di possesso o appena ricevuta palla
    // con l'uomo in più c'è quasi sempre qualcuno «libero»: lì vale solo il tiro davvero pulito, il resto si costruisce girando palla
    const libero = manUp(t) ? dGoal<5.5 && press>2.4 && lane && Math.abs(gx-p.x)/Math.max(0.1,dGoal)>0.6
                            : dGoal<6.5 && press>2.2 && lane && Math.abs(gx-p.x)/Math.max(0.1,dGoal)>0.55;
    // IL «QUICK» (manuale USA Water Polo, 6 contro 5): nei primi secondi della superiorità la difesa non è ancora organizzata;
    // chi è libero vicino alla porta tira subito invece di aspettare la circolazione
    const az=azioneAperta(), quick=manUp(t)&&az&&az.tipo==='superiorita'&&game.time-az.t0<3&&press>2.4&&lane&&dGoal<6.5;
    const pazienza = quick ? 1 : manUp(t) ? (libero&&tempoSup>3.5?1:clamp((tempoSup-5)/4,0,1)) : davanti===0||libero ? 1 : clamp((SHOT_CLOCK-game.shot-PAZIENZA[0])/PAZIENZA[1],0,1);
    // con l'uomo in più l'esterno, che ha poco angolo, tira di rado: cerca l'uomo al palo o chi sta ai 5 metri
    const angolo = manUp(t) ? clamp(Math.abs(gx-p.x)/Math.max(0.1,dGoal)*2,0.15,1) : 1;
    // si tira quando si è liberi: subito dopo un passaggio che ha liberato il tiratore o cambiato lato; con il difensore davanti
    // a braccio alto e tutti piazzati si aspetta, si finta o si fa girare palla (il tiro arriva comunque a fine azione)
    const sit=situazioneTiro(p), occasione=(sit.liberato?1.7:1)*(sit.dopoCambio?1.6:1)*(1-0.75*sit.marcato)*(sit.daFermo?0.6:1);
    const want = game.shot<2.5 ? 0.9 : (game.shot<6 ? 0.35 : (lane?0.2+0.36*(1-dGoal/8.5):0.1)*(press>1.5?1.35:press<0.9?0.6:1)*pazienza)*angolo*clamp(occasione,0.12,2.2);
    if(rnd()<want){
      if((p.fakeCount||0)<2 && game.shot>5 && rnd()<(p.fakeCount?0.3:0.24)){ p.fakeUsed=true; p.shootNext=true; p.decideT=0.2+rnd()*0.75; startAct(p,'fake',0.08+rnd()*0.1,()=>doFake(p)); return; }
      const lob = dGoal>5 && rnd()<0.12; aiShoot(p,0.55+rnd()*0.45,lob); return;
    }
  }
  if(game.shot<2 && dGoal<13 && !ft){ aiShoot(p,0.9,false); return; }
  // con l'uomo in più la palla gira in fretta: un tocco e via, per spostare la difesa e il portiere
  const ritmo=schemaSquadra(t).passaggi;
  // v0.53 (Ale: «circolazione macchinosa»): prima 2,5-4,5 s con lo stile «vicini» della strategia di partenza; nelle partite vere
  // sul perimetro la palla resta in mano 1-2 s. Il passaggio parte solo verso un compagno libero (bestPassTarget).
  const attesa=manUp(t)?0.55+rnd()*0.5:ritmo==='rapidi'?0.8+rnd()*0.4:ritmo==='equilibrati'?1.1+rnd()*0.7:1.3+rnd()*0.9;
  if(p.freeThrow || (press<1.3&&rnd()<0.55) || ball.holdTime>attesa){
    const m=bestPassTarget(p); if(m){ aiPass(p,m); return; }
  }
}
