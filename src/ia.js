// ================= IA =================
import { azioneAperta, difensoriDavanti } from './statistiche.js';
import { ARBITRO, DEF_DOWN, FORM, GW, HW, KICK_Z, MARK, ROLES, SHOT_CLOCK, clamp, dist, rnd } from './costanti.js';
import { anticipoTarget, boaFrontePorta, centroTarget, leggiCentro } from './centroboa.js';
import { numeroPosizione, schemaSquadra } from './schemi.js';
import { coperturaCambio } from './difesa-cambi.js';
import { aggiornaEntrate, appoggioPerSchema, attesaEntrata, attesaSchema, schemaDovuto, segnaSchema, centroAttacco, destinatarioEntrata, postoAttacco, preparaEntrata, ricezioneAla, targetEntrata } from './entrate.js';
import { FINTA_LATO, fintaDi, fintaLatoAttiva } from './finte.js';
import { avanzaUomo, avviaUomo, ePalo, perimetroUomo, postiUomo, postiUomoDi, scelti as sceltiUomo, trova as trovaUomo, SCELTI_COMPUTER } from './uomo-in-piu.js';
import { doFake, falloSenzaPalla, timeout } from './regole.js';
import { annuncia as notifica } from './cronaca.js';
import { allPlayers, ball, ctrl, fight, game, goalX, other, ownGoalX, teams } from './stato.js';
import { paloCoperto } from './muro.js';
import { SPECIALI, aiControfuga, aiPalombella, occasioneControfuga, occasionePalombella, palombella, sceltaTiroArea, tiroSpeciale } from './controfuga.js';
import { bestPassTarget, doPass, doShoot, entrataPronta, laneClear, openness, passLaneRisk, shotKind, situazioneTiro, startAct } from './tiri.js';
import { CIRCOLAZIONE, COSTRUZIONE, ENTRATA, FINE_AZIONE, FINTA_RITMO, OCCASIONE_CHIARA, PAZIENZA, RIENTRO_SCAMBI, RIPARTENZA, SCATTI, SUPERIORITA, TIMEOUT, TIRO_LIBERATO, USCITA_PORTIERE, SCHEMI_PRESSING, pesata } from './taratura.js';      // numeri del bilanciamento
export { CIRCOLAZIONE, COSTRUZIONE, ENTRATA, FINE_AZIONE, OCCASIONE_CHIARA, PAZIENZA, RIENTRO_SCAMBI, RIPARTENZA, SCATTI, SUPERIORITA, TIMEOUT, TIRO_LIBERATO, USCITA_PORTIERE };
export function manUp(t){ return other(t).players.some(q=>q.excluded); }
// l'uomo che marca p: di regola quello del ruolo (MARK); dopo un CAMBIO DI MARCATURA su un'entrata («time switching», Nitzkowski e
// manuale USA Water Polo) i due difensori si scambiano gli uomini per qualche secondo
export function uomoDi(p){
  const t=p.team,o=other(t);let a=t.accoppiamenti;
  if(!a||a.uomini.some(q=>q&&!o.players.includes(q))||game.time<a.tempo){
    a=t.accoppiamenti={uomini:t.players.map(d=>o.players[MARK[d.i]]),tempo:game.time};
    // Soltanto all'avvio: il marcatore specialista prende chi occupa davvero il centro.
    // I movimenti successivi conservano queste identità, fino a una consegna letta in acqua.
    const centro=centroAttacco(o),specialisti=t.players.filter(d=>!d.isGK&&!d.excluded&&!d.uscendo&&(d.scheda?.ruolo===6||!d.scheda&&d.i===6));
    const specialista=specialisti.sort((u,v)=>(v.s?.dif??0)-(u.s?.dif??0))[0]||t.players[6];
    const precedente=centro&&a.uomini.indexOf(centro);
    if(specialista&&precedente>0&&precedente!==specialista.i){
      a.uomini[precedente]=a.uomini[specialista.i];a.uomini[specialista.i]=centro;
    }
    t.scambio=null;
  }
  a.tempo=game.time;return a.uomini[p.i]||o.players[MARK[p.i]];
}
// La consegna cambia gli uomini assegnati, mai le coordinate. Gli accoppiamenti restano
// anche al termine del taglio: il rientro e una successiva consegna avvengono nuotando.
function cambioMarcatura(t){
  const att=other(t);if(game.possTeam!==att||t.players.some(q=>q.excluded)||inRientro(t))return;
  if(t.adattamentoEntrata&&(game.time>t.adattamentoEntrata.fino||!t.adattamentoEntrata.entrante.cut))t.adattamentoEntrata=null;
  if(t.scambio&&game.time<t.scambio.dopo)return;
  const ogx=ownGoalX(t),r=att.rotazioneCentro;
  const pericoli=att.players.filter(q=>q.cut?.phase===0);
  if(r&&Math.abs(r.uscente.z)>2.5&&Math.abs(r.boa.x-ogx)<4.6)pericoli.push(r.boa);
  for(const q of pericoli){
    const a=t.players.find(d=>!d.excluded&&!d.isGK&&d!==ctrl&&uomoDi(d)===q);if(!a)continue;
    const qd=Math.abs(q.x-ogx),ad=Math.abs(a.x-ogx);
    if(ad<qd+0.65&&dist(a,q)<1.6)continue;
    let b=null,bd=2.65;
    for(const d of t.players){
      if(d===a||d.excluded||d.isGK||d===ctrl)continue;
      const uomo=uomoDi(d),dd=dist(d,q);
      if(uomo===ball.holder&&dist(d,uomo)<1.2)continue;
      if(dd<bd&&Math.abs(d.x-ogx)<qd+0.35){b=d;bd=dd;}
    }
    if(b){
      const ua=uomoDi(a),ub=uomoDi(b);t.accoppiamenti.uomini[a.i]=ub;t.accoppiamenti.uomini[b.i]=ua;
      t.scambio={a,b,fino:game.time+5,dopo:game.time+0.9};t.scambi=(t.scambi||0)+1;t.adattamentoEntrata=null;return;
    }
    // La consegna tardiva concede uno spazio: aiuto breve sul pericolo, poi si recupera.
    const aiutante=t.players.filter(d=>d!==a&&d!==ctrl&&!d.isGK&&!d.excluded&&uomoDi(d)!==ball.holder)
      .sort((u,v)=>dist(u,q)-dist(v,q))[0];
    if(aiutante&&dist(aiutante,q)<4.5)t.adattamentoEntrata={tipo:qd<3.8?'raddoppio':'M',entrante:q,aiutante,fino:game.time+1.6};
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
export const schemiUomo = t => t.human ? sceltiUomo() : SCELTI_COMPUTER.map(trovaUomo).filter(Boolean);
// il giocatore chiama uno dei suoi schemi (i = 0, 1, 2); null = torna al 4-2 della strategia
export function chiamaUomo(t,i){
  const sc=schemiUomo(t)[i]||null; avviaUomo(t,sc,game.time); if(t.uomo) t.uomo.possT=game.possT; t.uomoPossT=game.possT; return sc;
}
export function startCut(p,dovuto=false){
  if(!dovuto&&(!p.team.human||game.autoplay)&&game.time<(p.team.entrataDopo||0))return false;
  if(p.isGK||p.excluded||ball.holder===p||manUp(p.team)||manUp(other(p.team))||p.team.players.some(q=>q!==p&&q.cut)) return false;
  const t=p.team, side=Math.abs(p.z)<0.5?(rnd()<0.5?1:-1):Math.sign(p.z);
  p.cut={t0:game.time,phase:0,x:goalX(t)-t.dir*2.6,z:side*1.7}; p.cutT=game.time;t.entrataDopo=game.time+ENTRATA.ogni;
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
    // v0.66: il computer, in ENTRATA.azione delle sue azioni in parità, manda in entrata un mezzo (Pos. 2 o 3) anche se lo schema
    // non la prevede (prima giocava sempre l'«Arco» e non entrava mai); lo schema del giocatore resta quello che ha scelto lui.
    // Con l'uomo in più o in meno non si entra: lì il sorteggio non si fa (la sequenza del caso resta quella di prima)
    const pari=game.possTeam===t&&!manUp(t)&&!manUp(other(t));
    const entrata=s.entrata||(pari&&(!t.human||game.autoplay)&&rnd()<ENTRATA.azione?(rnd()<0.5?4:5):0);
    t.schemaStato={possT:game.possT,schema:s,next:game.time+0.6,entrata}; t.copertura=null; t.aiutoStato=null;
    for(const p of t.players) p.cut=null;
  }
  aggiornaEntrate(t);
  // v0.66: con l'uomo in più (o in meno) l'entrata finisce subito: si va ai posti del 6 contro 5
  for(const p of t.players) if(p.cut&&(p.excluded||p.uscendo||game.time-p.cut.t0>6.4||manUp(t)||manUp(other(t)))) p.cut=null;
  if(game.possTeam!==t){ t.copertura=null; for(const p of t.players) p.cut=null; return; }
  if(t.copertura&&(!t.copertura.entrante.cut||t.copertura.chi.excluded||t.copertura.chi===ball.holder)) t.copertura=null;
  const h=ball.holder,st=t.schemaStato,p=t.players[st.entrata];
  // v0.90 (Ale: contro il pressing «uno schema va sempre chiamato»): se lo schema con il passaggio non parte entro SCHEMI_PRESSING.attesa
  // s, entra il mezzo del lato debole (lontano dalla palla), anche senza la pausa tra le entrate (entrate.js schemaDovuto)
  if(h&&h.team===t&&!h.isGK&&attesaSchema(t)>=SCHEMI_PRESSING.attesa&&Math.abs(goalX(t)-h.x)<=SCHEMI_PRESSING.profondita){
    const lato=h.z*t.dir>0?5:4, q=t.players[lato];
    if(q&&q!==h&&q!==ctrl&&!q.excluded&&!q.uscendo&&dist(h,q)>=3&&startCut(q,true)){ segnaSchema(t); st.next=game.time+ENTRATA.ogni; return; }
  }
  if(t.entrataAzione||t.rotazioneCentro||game.time<(t.entrataDopo||0)||!st.entrata||manUp(t)||!h||h.team!==t||h.isGK||!p||p===h||p===ctrl||p.excluded||p.uscendo||p.cut||game.time<st.next||
    Math.abs(goalX(t)-h.x)>8.5||dist(h,p)<3||t.players.some(q=>q.cut)) return;
  // Entrare dietro il difensore che si è abbassato o quando il lato opposto tiene la palla.
  const def=other(t).players.find(q=>!q.excluded&&MARK[q.i]===p.i);
  const spazio=!def||Math.abs(goalX(t)-def.x)<Math.abs(goalX(t)-p.x)-0.6||Math.sign(h.z)!==Math.sign(p.z);
  if(spazio&&startCut(p)) st.next=t.entrataDopo=game.time+ENTRATA.ogni;
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
// RIPARTENZA con la palla a un giocatore di movimento (v0.58): numeri e motivi in taratura.js
export const CONTRO={ durata:12, zLati:4.0, dPrima:2.25, dSeconda:5.2, zSeconda:2.3, dietroPortiere:4 };      // v0.90: dietroPortiere = metri minimi dalla propria linea di porta nei posti delle aperture
// STILE PER NAZIONALE (Canossa, Lupo et al. 2022, dopo le regole 2018): Italia, Serbia e Australia segnano fino al 33% dei gol in
// gioco veloce, Spagna, Croazia e Ungheria il 15% o meno. Probabilità di lanciare la controfuga organizzata dopo il recupero.
export const STILE_VELOCE={ ITA:1, SRB:1, AUS:1, ESP:0.5, CRO:0.5, HUN:0.5 };
export const stileVeloce = t => STILE_VELOCE[t.codice] ?? 0.8;
export function contropiede(t){
  const c=t.contro; if(!c) return null;
  if(game.possTeam!==t||game.time>c.fino||manUp(t)||Math.abs(goalX(t)-ball.x)<5.5){ t.contro=null; return null; }
  return c;
}
// v0.67 (SCATTI): in ripartenza scatta solo chi può guadagnare un vantaggio: nessun difensore entro SCATTI.spazio metri, oppure
// non più di SCATTI.ripartenza metri dietro al difensore più vicino (rispetto alla porta avversaria); gli altri nuotano senza scatto
function scattoUtile(p){
  const t=p.team, gx=goalX(t); let d=null, dd=99;
  for(const o of other(t).players){ if(o.excluded||o.isGK) continue; const k=dist(o,p); if(k<dd){ dd=k; d=o; } }
  return !d||dd>SCATTI.spazio||Math.abs(gx-p.x)<=Math.abs(gx-d.x)+SCATTI.ripartenza;
}
function pressato(h){ if(!h) return false; const gx=goalX(h.team), gd=Math.abs(gx-h.x);
  return other(h.team).players.some(q=>!q.excluded&&!q.isGK&&dist(q,h)<1.9&&Math.abs(gx-q.x)<gd+0.4); }
// APERTURE DOPO IL RECUPERO (v0.54, indicazioni di Ale). Numeri di posizione come in schemi.js, guardando la porta avversaria:
// 1 destra vicino, 2 destra fuori, 3 centro, 4 sinistra fuori, 5 sinistra vicino, 6 centroboa. POS_I = indice interno di ogni numero.
// «base»: la prima linea 1, 6, 5 va il prima possibile ai 2 metri (destra, centro, sinistra); 3 viene incontro al portiere e riceve,
//   2 e 4 gli fanno da appoggio davanti, sui due lati.
// «apertura del 2»: 2 scatta verso metà campo a ricevere; 1 lo supera e va ai 2 metri; 6 va a fare il centro ai 2 metri e spinge il
//   difensore verso la porta; 4 e 5 vanno in posizione; ultimi arrivano 3 e 2, che gestiscono la palla.
export const POS_I=Object.freeze({1:2,2:4,3:6,4:5,5:3,6:1});
export const APERTURE=Object.freeze({
  base:{ nome:'Prima linea ai 2 metri', ricevente:3 },
  apertura2:{ nome:'Apertura del 2', ricevente:2 },
});
// posto di ogni numero: d = distanza dalla linea di porta avversaria, z = lato (positivo = destra guardando la porta)
function postoApertura(num,schema,ballD,h,t){
  if(schema==='base'){
    if(num===1) return {d:CONTRO.dPrima,z:CONTRO.zLati};
    if(num===5) return {d:CONTRO.dPrima,z:-CONTRO.zLati};
    if(num===6) return {d:CONTRO.dPrima+0.35,z:0};
    // v0.58 (Ale: «quando prendo la palla i compagni non possono stare fermi ad aspettarmi: devono nuotare il più velocemente
    // possibile verso le posizioni d'attacco; invece mi stanno intorno»): incontro e appoggio servono solo al PORTIERE che deve
    // lanciare; se la palla l'ha un giocatore di movimento, 2, 3 e 4 vanno subito ai loro posti d'attacco
    if(num===3) return h&&h.isGK ? {d:25-6,z:0} : {d:RIPARTENZA.d3,z:0};
    const lato=num===2?1:-1;
    return h&&h.isGK ? {d:25-11,z:lato*3.6} : {d:CONTRO.dSeconda,z:lato*CONTRO.zSeconda*1.4};
  }
  if(num===1) return {d:CONTRO.dPrima,z:CONTRO.zLati};
  if(num===6) return {d:CONTRO.dPrima+0.35,z:0};
  if(num===4) return {d:5.8,z:-4.6};
  if(num===5) return {d:CONTRO.dPrima,z:-6.2};
  if(num===2) return h&&h.isGK ? {d:12.5,z:2.5} : {d:CONTRO.dSeconda,z:3.2};
  // 3: l'ultimo, dietro la palla; v0.90 (Ale: «quando il portiere recupera palla un giocatore va verso la porta entrandoci dentro»): con la
  // palla al portiere sulla linea di porta «3,5 m dietro la palla» era dentro la rete. Resta davanti al portiere, a CONTRO.dietroPortiere m
  // dalla propria linea di porta
  return h&&h.isGK ? {d:Math.min(25-CONTRO.dietroPortiere,Math.max(CONTRO.dSeconda+2,ballD+3.5)),z:0.5} : {d:RIPARTENZA.d3,z:0.5};
}
// chi deve ricevere il primo passaggio del portiere nell'apertura in corso
export function riceventeApertura(t){
  const c=t.contro; if(!c||!c.schema||t.players.some(q=>q.excluded)) return null;
  const q=t.players[POS_I[APERTURE[c.schema].ricevente]]; return q&&!q.uscendo?q:null;
}
function contropiedeTarget(p,c){
  const t=p.team, gx=goalX(t), h=ball.holder&&ball.holder.team===t?ball.holder:null, ballD=Math.abs(gx-ball.x);
  if(c.schema&&!t.players.some(q=>q.excluded||q.uscendo)){
    const num=numeroPosizione(p.i); if(!num) return null;
    const ps=postoApertura(num,c.schema,ballD,h,t);
    ps.d=Math.min(ps.d,25-CONTRO.dietroPortiere);      // v0.90: nessun posto dentro la propria porta
    const sprint=!(ps.d>ballD&&Math.abs(gx-p.x)>ps.d-0.5)&&Math.hypot(gx-t.dir*ps.d-p.x,ps.z*t.dir-p.z)>RIPARTENZA.arrivato&&scattoUtile(p);      // chi deve stare dietro la palla non scatta; v0.67: scatta solo chi può guadagnare un vantaggio
    return { x:gx-t.dir*ps.d, z:clamp(ps.z*t.dir,-HW+0.5,HW-0.5), sprint, nuota:!sprint };      // nuota = niente scatto automatico da lontano (partita.js)
  }
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
  // v0.67: partono tutti subito, ma scatta solo chi può guadagnare un vantaggio (SCATTI); prima scattavano sempre tutti
  const sc=scattoUtile(p);
  return { x:gx-t.dir*ps.d, z:clamp(ps.z*t.dir,-HW+0.5,HW-0.5), sprint:sc, nuota:!sc };
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
  const coordinato=targetEntrata(p);if(coordinato)return coordinato;
  if(p.cut){
    const c=p.cut;
    if(c.phase===0 && (Math.hypot(c.x-p.x,c.z-p.z)<0.7 || game.time-c.t0>4.5)){ c.phase=1; c.t1=game.time; }
    if(c.phase===1 && game.time-c.t1>1.6) p.cut=null;
    else return {x:c.x,z:c.z,sprint:c.phase===0};
  }
  let f;
  const sup=manUp(t);
  const s=schemaSquadra(t);
  f=[...(sup?postiUomoDi(t,p,schemaSquadra(t).superiorita,game.time):s.attacco)[(sup?p.i:postoAttacco(p))-1]];
  if(!sup&&t.copertura?.chi===p&&t.copertura.entrante.cut) return {x:gx-t.dir*t.copertura.d,z:t.copertura.z*t.dir};
  { const b=t.blocco; if(!sup&&b&&b.chi===p&&!b.fatto&&game.time<b.fino&&b.entrante.cut){ const c=b.entrante.cut,d=b.su;
      return {x:d.x+(c.x-d.x)*0.2,z:d.z+(c.z-d.z)*0.2,sprint:true}; } }
  if(!sup&&centroAttacco(t)===p){
    const tg=centroTarget(p),d=Math.max(Math.abs(gx-tg.x),Math.abs(gx-ball.x)-14);
    return {...tg,x:gx-t.dir*d};
  }
  // la squadra sale insieme alla palla: nessuno può stare troppo avanti rispetto a chi la porta
  // ognuno sale lungo la propria corsia, scaglionato per ruolo (boa e ali avanti, mezzi a metà, punto in copertura)
  const ballD=Math.abs(gx-ball.x), transizione=!sup&&ballD>RIPARTENZA.transizione&&ball.holder?.team===t&&!ball.holder.isGK;
  // v0.58: in transizione con la palla a un giocatore di movimento solo il punto resta un po' più vicino (al massimo 8 m davanti
  // alla palla, per lo scarico); gli altri vanno dritti al loro posto. Prima nessuno poteva stare più di 4-14 m davanti alla palla
  const lead=transizione?[0,99,99,99,99,99,8][p.i]:[0,14,12,12,8,8,4][p.i];
  let f0=f[0], fz=f[1];
  if(ballD-lead>f0) f0=ballD-lead;
  if(sup&&ePalo(f)&&ballD<9) return paloTarget(p,[f0,fz]);
  const x=gx-t.dir*f0,z=clamp(fz*t.dir+(sup?0:Math.sin(game.time*0.6+p.uid)*0.35),-HW+0.5,HW-0.5);
  const a=appoggio(p,x,z,sup),ax=x+(a?a.dx:0),az=z+(a?a.dz:0);
  if(sup) return { x:ax, z:az, sprint:Math.hypot(ax-p.x,az-p.z)>1.5 };
  // v0.67: in transizione scatta solo chi non è ancora arrivato e può guadagnare un vantaggio (SCATTI); nell'«Incrocio» i due mezzi
  // scattano solo finché non sono al loro posto (prima scattavano sempre)
  const lontano=Math.hypot(ax-p.x,az-p.z)>RIPARTENZA.arrivato;
  const corre=(t.atkPlay===2&&(p.i===4||p.i===5)&&lontano)||game.time<(t.fugaFino||0)||(transizione&&lontano&&scattoUtile(p));
  return { x:ax, z:az, sprint:corre, nuota:transizione&&!corre };
}
// Difesa con l'uomo in meno. Posizione di partenza: tre difensori sulla linea dei 2 metri, ciascuno in mezzo tra due dei quattro
// attaccanti; gli altri due davanti ai pali, a metà tra gli attaccanti ai 2 metri e quelli a 5. Ognuno prende il posto più vicino.
// Poi la zona scivola verso il lato della palla e chi sta davanti al palo esce con il braccio alto su chi ha palla ai 5 metri.
// misure della difesa con l'uomo in meno (v0.56): esterno = l'attaccante con palla è «all'esterno dei 2 metri» se è entro
// questa distanza dalla porta e oltre «largo» dal centro; spalle = dove sta il centrale dietro il difensore del palo;
// stretto = dove si stringe chi difende sull'esterno quando il suo uomo non ha palla
// difesa contro il 3-3 (v0.58): centro = |z| sotto cui un attaccante tra daMin e daMax metri dalla porta è «il 6 al centro dei 5 metri»;
// latoMin = da quanti metri dalla porta un attaccante di lato conta come tiratore dei 5 metri; addosso = distanza da chi ha palla
// quando si salta su di lui; dentro = quanto la posizione di mezzo sta più vicina alla porta; versoTiratore/aiuto = quanto ci si
// sposta dal punto di mezzo verso il proprio tiratore (palla vicina) o verso il 6 (palla dall'altra parte)
export const TRE_TRE={ centro:1.6, daMin:4.2, daMax:7.5, latoMin:3.6, addosso:0.9, dentro:0.6, versoTiratore:0.35, aiuto:0.25 };
// attacco del computer in superiorità (v0.58): numeri SUPERIORITA in taratura.js
export const INFERIORITA={ esterno:3.6, largo:3.4, spalle:1.0, stretto:2.3 };
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
  // CONTRO IL 3-3 (v0.58, Ale: «quando l'attacco si posiziona in 3-3 i difensori che prima stavano davanti ai pali si devono mettere
  // in mezzo tra 2-3 e il 6 uscito ai 5 metri e si devono fare il mazzo saltando da un giocatore all'altro seguendo la palla; di
  // solito si lascia il tiro al giocatore più lontano, ma bisogna disturbarlo»). 3-3 = un attaccante al centro dei 5 metri.
  const avv=other(t).players.filter(p=>!p.excluded&&!p.isGK), dist5=p=>Math.abs(ogx-p.x);
  const centro5=h?avv.find(p=>dist5(p)>TRE_TRE.daMin&&dist5(p)<TRE_TRE.daMax&&Math.abs(p.z)<TRE_TRE.centro):null;
  const lato5=L=>avv.filter(p=>p!==centro5&&dist5(p)>TRE_TRE.latoMin&&dist5(p)<TRE_TRE.daMax&&Math.sign(p.z)===L&&Math.abs(p.z)>=TRE_TRE.centro)
    .sort((a,b)=>Math.abs(a.z-L*3)-Math.abs(b.z-L*3))[0]||null;
  // chi dei due esce sul 6 quando ha la palla: il più vicino a lui
  let suCentro=null;
  if(centro5&&h===centro5){ let bd=Infinity; for(const [q,i] of ruoli){ if(DEF_DOWN[i][0]<3) continue; const d=Math.hypot(q.x-h.x,q.z-h.z); if(d<bd){ bd=d; suCentro=q; } } }
  for(const [q,i] of ruoli){
    const s=DEF_DOWN[i];
    let x=s[0], z=s[1]+sciv;
    if(i!==0) q.copreLungo=null;
    if(Math.abs(s[1])>3&&h&&Math.abs(ogx-h.x)<INFERIORITA.esterno&&Math.abs(h.z)>INFERIORITA.largo&&Math.sign(h.z)===Math.sign(s[1])){
      // palla all'esterno dei 2 metri dalla sua parte: esce sul suo uomo tra lui e il palo corto (con il portiere)
      x=Math.max(1.4,Math.abs(ogx-h.x)-0.2); z=h.z-Math.sign(h.z)*0.8;
    }else if(s[0]>3&&centro5&&lato5(Math.sign(s[1]))){
      const L=Math.sign(s[1]), mio=lato5(L), hd=dist5(h);
      if(h===mio||q===suCentro){ x=Math.max(2.4,hd-TRE_TRE.addosso); z=h.z*0.85; }      // salta su chi ha la palla
      else{
        // a metà tra il suo tiratore ai 5 metri e il 6 uscito al centro, un po' più vicino alla porta; spostato verso il tiratore se
        // la palla è dalla sua parte o se l'altro difensore è uscito sul 6 (deve disturbare il tiro lasciato), verso il 6 se la palla
        // è dall'altra parte (aiuto)
        const lontano=Math.sign(h.z||0)===-L&&h!==centro5, k=h===centro5?TRE_TRE.versoTiratore:lontano?-TRE_TRE.aiuto:TRE_TRE.versoTiratore*0.6;
        const mx=(dist5(mio)+dist5(centro5))/2-TRE_TRE.dentro, mz=(mio.z+centro5.z)/2;
        x=mx+(dist5(mio)-mx)*Math.max(0,k)+(dist5(centro5)-mx)*Math.max(0,-k); z=mz+(mio.z-mz)*Math.max(0,k)+(centro5.z-mz)*Math.max(0,-k);
      }
    }else if(s[0]>3&&h&&Math.abs(ogx-h.x)>4&&Math.sign(h.z||1)===Math.sign(s[1])){
      x=Math.min(Math.abs(ogx-h.x)-(anticipo?0.7:0.95),anticipo?5.6:5);z=s[1]+(h.z-s[1])*(anticipo?0.8:0.7);
    }else if(Math.abs(s[1])>3&&h){
      const palo=other(t).players.find(p=>!p.excluded&&(p.i===1||p.i===6)&&Math.sign(p.z)===Math.sign(s[1]));
      if(palo&&Math.abs(ogx-palo.x)>2.7&&Math.sign(h.z||1)===Math.sign(s[1])&&Math.abs(ogx-h.x)>4){
        x=Math.max(1.8,Math.abs(ogx-palo.x)-0.7);z=palo.z+(s[1]-palo.z)*0.25;
      }else{
        // (v0.56) il suo uomo all'esterno non ha la palla: si stringe verso il palo, di più con la palla dalla sua parte, mentre il
        // centrale copre l'incrociato
        x=1.9; z=s[1]+(Math.sign(s[1])*INFERIORITA.stretto-s[1])*(Math.sign(h.z||1)===Math.sign(s[1])?1:0.5);
      }
    }else if(i===0&&h){
      // IL CENTRALE TRA I PALI (v0.56, Ale: «ha il ruolo più scomodo: salta da un palo all'altro senza fare fallo»). Con la palla
      // all'esterno dei 2 metri (1 o 4) sta sulle spalle del difensore del palo dalla parte della palla e difende con il braccio
      // il palo lungo (il palo corto lo coprono il portiere e il difensore dell'esterno); con la palla ai 5 metri (2 o 3) copre
      // il tiro incrociato: si mette sulla linea tra il tiratore e il palo lungo, la parte di porta lasciata dal portiere.
      const hx=Math.abs(ogx-h.x), lato=Math.sign(h.z||1);
      if(hx<INFERIORITA.esterno&&Math.abs(h.z)>INFERIORITA.largo){ z=lato*INFERIORITA.spalle; x=1.7; }
      else if(hx<9){ const lungo=-lato*GW*0.8, k=2.0/Math.max(2.2,hx); z=lungo+(h.z-lungo)*k; x=2.0; }
      q.copreLungo=hx<9?{lato:-lato,t:game.time}:null;
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
  // v0.67: in rientro scatta solo chi deve coprire: il suo uomo è più vicino alla porta di lui o meno di SCATTI.rientro metri dietro
  // (prima scattava chiunque fosse più di 0,8 m lontano dal suo posto, anche dall'altra metà campo)
  const corre=myD>d+0.8&&(scappato||attD<myD+SCATTI.rientro);
  return { x:ogx+t.dir*d, z, sprint:corre, nuota:trans&&!corre };
}
function aiutoDifensivo(p){
  const t=p.team;
  if(p===ctrl)return null;
  const adattamento=t.adattamentoEntrata,a=adattamento?.entrante,hEntrata=riferimentoPalla(other(t)),gx=ownGoalX(t);
  if(adattamento&&adattamento.aiutante===p&&game.time<adattamento.fino&&a&&!a.excluded&&!a.uscendo&&Math.abs(gx-a.x)<6.5){
    if(adattamento.tipo==='raddoppio'){
      const dx=gx-a.x,dz=-a.z,l=Math.hypot(dx,dz)||1;
      return {x:a.x+dx/l*.8,z:a.z+dz/l*.8,sprint:true};
    }
    if(adattamento.tipo==='M'&&hEntrata){
      const x=a.x+(hEntrata.x-a.x)*.32,z=a.z+(hEntrata.z-a.z)*.32;
      return {x:gx+t.dir*clamp((x-gx)*t.dir,2.2,6.5),z:clamp(z,-5.5,5.5),sprint:true};
    }
  }
  if(t.defPlay!==1&&t.defPlay!==3){ t.aiutoStato=null; return null; }
  const h=riferimentoPalla(other(t)),boa=centroAttacco(other(t));
  if(!h||h===boa||h.isGK||boa.excluded||boa.uscendo||Math.abs(ownGoalX(t)-h.x)>8||Math.abs(ownGoalX(t)-boa.x)>4.6){t.aiutoStato=null;return null;}
  const def=t.players.find(q=>!q.excluded&&uomoDi(q)===boa),lettura=leggiCentro(boa,def,h);
  if(!lettura.ricevibile){t.aiutoStato=null;return null;}
  const x=h.x+(boa.x-h.x)*0.62,z=h.z+(boa.z-h.z)*0.62;
  let st=t.aiutoStato;
  if(!st||st.h!==h||game.time>st.fino||st.p.excluded||st.p===ctrl){
    let helper=null,bd=Infinity;
    for(const i of schemaSquadra(t).aiuti){
      const q=t.players[i],uomo=q&&uomoDi(q);
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
  const boa=centroAttacco(other(t)),cambio=coperturaCambio(p,att,boa,riferimentoPalla(other(t)),uomoDi);
  if(cambio)return cambio.target;
  const aiuto=aiutoDifensivo(p);if(aiuto) return aiuto;
  if(att===boa && Math.abs(ogx-att.x)<5){
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
    const h=ball.holder;
    if(h&&h.team!==t&&h!==att&&att!==boa&&boa&&!boa.excluded&&!boa.uscendo&&Math.abs(ogx-boa.x)<4.6&&dist(h,att)>5.5&&Math.abs(ogx-h.x)<10){
      if(t.centroT!==game.time){ t.centroT=game.time; t.centroAperto=leggiCentro(boa,t.players.find(q=>!q.excluded&&uomoDi(q)===boa),h).ricevibile; }
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
  if(hb&&hb.team!==t&&hb!==att&&!hb.isGK&&!lasc&&t.defPlay!==3&&att!==boa){
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
// Portiere. L'80% del lavoro è la posizione (docs/riferimenti/tecnica.md): sta sulla linea tra la palla e il centro della porta e la segue
// spostandosi DURANTE i passaggi, non quando sono già arrivati. Quanto in fretta lo capisce e quanto velocemente si sposta
// dipendono dalla statistica Posizione: sulle diagonali lunghe (da 2 a 5, da 4 a 1) un portiere scarso resta indietro.
export const pos01 = gk => (pesata(gk.s.pos)-40)/59, rif01 = gk => (pesata(gk.s.rif)-40)/59;      // v0.89: statistiche pesate (STAT_PARTITA)
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
// libero verso la porta (v0.88, uscita del portiere): nessun difensore di movimento tra chi porta palla e la porta, cioè alla sua altezza
// o più avanti (fino a USCITA_PORTIERE.dietro m indietro) entro USCITA_PORTIERE.corridoio m dalla linea palla-porta; chi insegue da
// dietro non conta
export function liberoVersoPorta(h,t,ogx){
  const dx=ogx-h.x, dz=-h.z, d=Math.hypot(dx,dz)||1, ux=dx/d, uz=dz/d, U=USCITA_PORTIERE;
  return !t.players.some(q=>{ if(q.isGK||q.excluded) return false;
    const rx=q.x-h.x, rz=q.z-h.z, avanti=rx*ux+rz*uz;
    return avanti>-U.dietro&&avanti<d&&Math.abs(rx*uz-rz*ux)<U.corridoio; });
}
export function gkTarget(p){
  const t=p.team, ogx=ownGoalX(t);
  // Il corpo legge lo stesso lato delle braccia: un tentativo sbagliato non
  // può continuare a tuffarsi verso il bersaglio vero, né anticipare la reazione.
  if(ball.state==='flight'&&ball.daTiro&&(ball.kind==='shot'||ball.kind==='rebound')&&
    ball.shooter?.team!==t&&ball.vx*ball.shooter?.team.dir>0){
    const parata=p.tentativoPortiere;
    const valida=parata?.attiva&&parata===ball.tentativoPortiere&&parata.fine===undefined&&
      parata.gid===p.uid&&parata.num===p.num&&parata.scheda===p.scheda&&
      parata.revisione===ball.revisioneTiro&&ball.flightT>=parata.voloInizio;
    const bersaglio=valida&&(parata.riuscita?parata.bersaglio:parata.bersaglioLetto);
    const reagisce=!!bersaglio&&ball.flightT-parata.voloInizio>=parata.reazione;
    return { x:ogx+t.dir*0.7, z:reagisce?clamp(bersaglio[2],-GW-0.2,GW+0.2):p.z, gk:true, tuffo:reagisce };
  }
  // USCITA (v0.88): su chi porta palla libero verso la porta (controfuga, entrata, difensore battuto che insegue da dietro) il portiere
  // esce dai pali verso di lui per chiudere l'angolo; quanto, lo dice la sua Uscita (USCITA_PORTIERE). Chi esce lascia la porta scoperta
  // alla palombella (controfuga.js). Prima restava sempre a 0,7 m.
  { const h=ball.holder;
    if(h&&h.team!==t&&!h.isGK&&ball.state==='held'){
      const dx=h.x-ogx, dz=h.z, d=Math.hypot(dx,dz), U=USCITA_PORTIERE;
      if(d<U.da&&d>U.distanza+0.7&&liberoVersoPorta(h,t,ogx)){
        const fuori=Math.min(U.base+U.extra*clamp((pesata(p.s?.usc??60)-40)/59,0,1),d-U.distanza);
        let z=clamp(dz/d*fuori,-GW,GW);
        { const fl=fintaLatoAttiva(p); if(fl) z=clamp(z+fl*FINTA_LATO.portiere,-GW,GW); }      // anche fuori dai pali abbocca alla finta di lato (v0.59)
        return { x:ogx+dx/d*fuori, z, gk:true };
      }
    }
  }
  // la palla "vista" dal portiere: durante un passaggio guarda già dove arriverà, ma lo capisce con un ritardo
  let bx=ball.x, bz=ball.z;
  if(ball.state==='flight'&&ball.kind==='pass'&&ball.target){
    const ritardo=0.42-0.34*pos01(p);                         // da 0,42 s (Posizione 40) a 0,08 s (99)
    if(ball.flightT>ritardo){ bx=ball.tx; bz=ball.tz; }
  }
  let z=postoPortiere(t,bx,bz);
  const h=ball.holder;
  if(h&&h.team!==t&&Math.abs(h.x-ogx)<9){ const m=muroSu(h); if(m) z-=paloCoperto(h)*0.28; }      // il muro copre un palo (muro.js): mezzo passo verso l'altro
  { const fl=fintaLatoAttiva(p); if(fl) z+=fl*FINTA_LATO.portiere; }      // ha abboccato alla finta di lato (v0.59): si sposta verso quel palo
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
  // Scatto d'inizio: una sola corsia centrale per il nuotatore scelto prima
  // del via. Il portiere rientra con il normale movimento, gli altri ai ruoli.
  if(game.scattando&&!game.possTeam&&ball.state==='free'){
    if(p.isGK)return gkTarget(p);
    if(p===p.team.scattoInizio?.nuotatore&&!p.excluded&&!p.uscendo)return {x:ball.x,z:ball.z,sprint:true};
    return {x:-p.team.dir*FORM[p.i][0]*.8,z:KICK_Z[p.i]*p.team.dir,sprint:true};
  }
  if(p.isGK&&ball.state==='flight'&&ball.daTiro&&(ball.kind==='shot'||ball.kind==='rebound')&&
    ball.shooter?.team!==p.team&&ball.vx*ball.shooter?.team.dir>0) return gkTarget(p);
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
  const att=other(dif),boa=centroAttacco(att); let b=null, bs=1e9;
  for(const q of att.players){
    if(q.isGK||q.excluded||q===boa) continue;
    const posto=postoAttacco(q),destra=posto===2||posto===4, sinistra=posto===3||posto===5, manc=q.mano==='S';
    let per=(q.s.pot+q.s.pre)/2 + (destra?(manc?7:(posto===2?-12:-6)):sinistra?(manc?-8:3):0) + (posto===2||posto===3?-4:0);      // dalle ali si vede meno porta
    if(per<bs){ bs=per; b=q; }
  }
  return b;
}
export function passaAZona(t,quale,annuncia){
  t.defPlay=quale; t.lasciato=chiLasciare(t);
  if(annuncia&&t.lasciato) notifica('avviso',`${t.short}: ${quale===3?'zona a M':'zona'}`,{dettaglio:`si lascia tirare il #${t.lasciato.num} (${ROLES[t.lasciato.i].toLowerCase()})`,durata:1.6});
}
// v0.80 (Ale): nei rientri ci si scambia l'uomo (RIENTRO_SCAMBI in taratura.js). L'attaccante più vicino alla nostra porta lo prende
// il difensore meglio piazzato, non per forza il suo marcatore, che prende l'uomo lasciato libero. Prima nei rientri ognuno
// inseguiva il suo uomo (cambioMarcatura scambia solo sui tagli dell'attacco schierato) e restavano attaccanti liberi.
function scambiRientro(t){
  const att=other(t),R=RIENTRO_SCAMBI;
  if(game.possTeam!==att||t.players.some(q=>q.excluded)||att.players.some(q=>q.excluded)) return;
  const ogx=ownGoalX(t),ballD=Math.abs(ball.x-ogx);
  if(ballD<R.schierata||game.time<(t.prossimoScambioRientro||0)) return;
  t.prossimoScambioRientro=game.time+R.ogni;
  uomoDi(t.players[1]);      // accoppiamenti pronti
  const dG=q=>Math.hypot(q.x-ogx,q.z), costo=(d,q)=>dist(d,q)+R.dietro*Math.max(0,dG(d)-dG(q));
  const rall=chiRallenta(t);
  const liberi=new Set(t.players.filter(d=>!d.isGK&&!d.excluded&&!d.uscendo&&d!==rall&&d!==ctrl&&game.time>=(d.stunUntil||0)));
  const pericolosi=att.players.filter(q=>!q.isGK&&!q.excluded&&!q.uscendo&&q!==ball.holder&&Math.abs(q.x-ogx)<ballD+R.davanti)
    .sort((a,b)=>dG(a)-dG(b));
  for(const q of pericolosi){
    const a=t.players.find(d=>!d.excluded&&!d.isGK&&uomoDi(d)===q);
    // il marcatore resta se non è stato superato, o se ha appena preso questo uomo in uno scambio
    if(a&&(!(dG(a)>dG(q)+R.battuto||dist(a,q)>R.lontano)||game.time<(a.scambiatoFino||0))){ liberi.delete(a); continue; }
    let b=null,bc=1e9;
    for(const d of liberi){ if(game.time<(d.scambiatoFino||0)) continue; const c=costo(d,q); if(c<bc){ bc=c; b=d; } }
    if(!b) continue;
    if(a===b){ liberi.delete(b); continue; }
    if(a&&costo(a,q)-bc<R.guadagno){ liberi.delete(a); continue; }
    const ub=uomoDi(b); t.accoppiamenti.uomini[b.i]=q; if(a) t.accoppiamenti.uomini[a.i]=ub;
    b.scambiatoFino=game.time+R.tieni; if(a) a.scambiatoFino=game.time+R.tieni;
    liberi.delete(b); t.scambi=(t.scambi||0)+1; t.scambiRientro=(t.scambiRientro||0)+1;
  }
}
// il computer, mentre difende: pressing all'inizio, zona nella seconda parte dell'azione se il centroboa sta vincendo il duello
// (o comunque, a volte, negli ultimi secondi, per togliere riferimenti)
export function aggiornaDifesa(t,dt){
  scambiRientro(t);
  cambioMarcatura(t);
  if(t.schema){
    if((t.defPlay===1||t.defPlay===3)&&(!t.lasciato||game.time>(t.lasciatoT||0))){t.lasciato=chiLasciare(t);t.lasciatoT=game.time+0.8;}
    return;
  }
  if(t.human||game.possTeam!==other(t)||t.defPlay!==2||game.shot>22||inRientro(t)||t.players.some(q=>q.excluded)) return;
  const att=other(t), boa=centroAttacco(att), inDifficolta=fight.active&&fight.def&&fight.def.team===t&&fight.v>0.2;
  // Mondiali 2009 (Lupo et al. 2012): pressing 40-60% del tempo, zone 30-65%, zona a M 6-9%: la zona arriva spesso nella seconda
  // parte dell'azione; la zona a M solo contro un centroboa forte
  if(inDifficolta||rnd()<dt*0.7){
    const forte=!boa.excluded&&(boa.s.frz+boa.s.pot)/2>74;
    passaAZona(t,forte&&rnd()<0.3?3:1,true);
  }
}
// finte personali (v0.55, finte.js): il ritmo tra una finta e l'altra e il seguito dipendono dallo stile del giocatore
function pausaFinta(p,f){ p.decideT=f.pausa[0]+rnd()*(f.pausa[1]-f.pausa[0]); }
function chiudiFinta(p,f,dGoal){
  // v0.88: la palombella dopo la finta (stile di bomba) solo quando il portiere è fuori dai pali (controfuga.js); altrimenti il tiro
  if(f.seguito==='lob'&&!p.isGK&&(occasionePalombella(p)||sceltaTiroArea(p)==='lob')){ palombella(p,null); return; }
  if(f.seguito==='polso'){ startAct(p,'polso',0.04,()=>doShoot(p,0.42,false,null,{polso:true,dopoFinta:p.fakeUntil>game.time})); return; }
  aiShoot(p,0.6+rnd()*0.4,false);
}
export function aiShoot(p,power,lob){
  // v0.88 (Ale): dentro l'area il tiro lo sceglie la situazione, come per il giocatore (controfuga.js sceltaTiroArea): palombella con il
  // portiere fuori dai pali; nella controfuga vera schizzo o colonnello SPECIALI.computer volte su uno, altrimenti il tiro classico
  if(!lob){ const s=sceltaTiroArea(p); if(s==='lob') return palombella(p,null); if(s&&rnd()<SPECIALI.computer) return tiroSpeciale(p,s,null); }
  // Solo la scelta CPU prepara la palombella con la finta personale. I comandi
  // umani L/PALOMB. restano immediati; una finta già fatta basta anche se il
  // portiere non ha abboccato (fakeUntil non è un requisito).
  if(lob&&!(p.fakeCount>0)){
    const f=fintaDi(p);
    startAct(p,'fake',f.wind,()=>{
      doFake(p);
      // v0.85: la palombella parte a braccio tornato carico (ritorno della finta più FINTA_RITMO.attesa: a.pronto, tiri.js), non a metà
      // del ritorno
      const a=p.act;
      if(ball.holder===p&&game.state==='play')startAct(p,'lob',Math.max(f.pausa[0],(a?.pronto??0)-(a?.t??0)),()=>doShoot(p,power,true,null));
    });
    return;
  }
  const kind=lob?'lob':shotKind(p), r=kind==='shot'?rnd():1;
  if(r<0.14) startAct(p,'polso',0.04,()=>doShoot(p,0.42,false,null,{polso:true,dopoFinta:p.fakeUntil>game.time}));        // tiro di polso
  else if(r<0.24) startAct(p,'torsione',0.12+rnd()*0.1,()=>doShoot(p,power,false,null,{torsione:true}));                  // torsione e diagonale
  else startAct(p, kind, lob?0.1:0.12+rnd()*0.1, ()=>doShoot(p,power,lob,null));
}
export function aiPass(p,m){ startAct(p,'pass',0.08,()=>doPass(p,m),[m.x,m.z]); }
// COSTRUZIONE dell'azione in parità (v0.56), CIRCOLAZIONE sul perimetro (v0.61) e TIRO_LIBERATO dopo la ricezione (v0.59):
// numeri e motivi in taratura.js
// v0.64: la costruzione vale anche nella ripartenza alla pari (prima la ripartenza la toglieva per 12 s e in parità si tirava a 11 s)
// v0.81 (Ale: «le occasioni chiare, passaggio con l'uomo davanti alla porta, si tirano indipendentemente dai secondi trascorsi»):
// chi ha appena ricevuto libero davanti alla porta (OCCASIONE_CHIARA) tira subito, qualunque sia il secondo dell'azione
export function occasioneChiara(p,dGoal=Math.hypot(goalX(p.team)-p.x,p.z)){
  const C=OCCASIONE_CHIARA, gx=goalX(p.team);
  if(p.isGK||!p.ricevutoPassaggio||game.time-(p.ricevutoT||-9)>C.entro||dGoal>C.distanza||Math.abs(gx-p.x)/Math.max(0.1,dGoal)<C.angolo) return false;
  if(p.pressatoUntil>game.time||(p.freeThrow&&Math.abs(gx-p.x)<6)||game.penalty) return false;
  return situazioneTiro(p).vicino>C.spazio&&laneClear(p,gx,0,p.team,C.corridoio);
}
function inCostruzione(t){ const az=azioneAperta(); return !!az&&az.t===t&&az.tipo==='parita'&&!manUp(t)&&game.time-az.t0<COSTRUZIONE.secondi&&game.shot>8; }
export function aiCarrier(p,dt){
  const t=p.team, gx=goalX(t);
  if(p.isGK && !setteControSei(t)){
    p.target={x:p.x,z:p.z};
    if(p.act) return;
    // apertura (v0.54): appena il ricevente è arrivato al suo posto e libero, il portiere gliela dà subito
    const r=riceventeApertura(t);
    if(r&&ball.holdTime>0.45&&ball.holdTime<4){ const tg=contropiedeTarget(r,t.contro); if(tg&&Math.hypot(tg.x-r.x,tg.z-r.z)<2.5&&openness(r)>1.1&&laneClear(p,r.x,r.z,t)){ aiPass(p,r); return; } if(ball.holdTime<(t.contro.schema==='apertura2'?3.6:2.4)) return; }
    if(ball.holdTime>1.0+rnd()*0.05){ const m=bestPassTarget(p); if(m) aiPass(p,m); }
    return;
  }
  if(!manUp(t)&&fight.active&&fight.boa===p){ p.target={x:p.x,z:p.z}; return; }     // il centroboa in lotta decide in boaHold
  const slot=attackTarget(p);
  const dGoal=Math.hypot(gx-p.x,p.z);
  p.target={x:slot.x+t.dir*0.8, z:slot.z, sprint: Math.abs(p.x-slot.x)>6};
  // v0.90 (FINTA_RITMO.scivolo): durante la finta e fino al gesto dopo si resta dritti, al massimo uno scivolamento con la bicicletta
  if(p.act?.kind==='fake'||game.time<(p.fintaPronto||0)){ const dx=p.target.x-p.x, dz=p.target.z-p.z, d=Math.hypot(dx,dz), m=FINTA_RITMO.scivolo;
    if(d>m) p.target={x:p.x+dx/d*m, z:p.z+dz/d*m, sprint:false}; }
  if(p.act&&!p.act.done) return;
  // v0.85 (Ale: «le finte vicino alla porta sono troppo veloci»): dopo una finta nessun gesto nuovo finché il braccio non è tornato
  // carico e ha atteso FINTA_RITMO.attesa (tiri.js, p.fintaPronto); la pausa personale della finta intanto scorre
  if(game.time<(p.fintaPronto||0)){ p.decideT-=dt; return; }
  if(!manUp(t)&&centroAttacco(t)===p&&boaFrontePorta(p)){
    if(ball.holdTime>=.12&&!(p.pressatoUntil>game.time)){
      p.motivoTiro='boa fronte porta';aiShoot(p,.75,false);
    }
    return;
  }
  // v0.81: occasione chiara dopo il passaggio (nella controfuga vera restano finta, schizzo e colonnello)
  if(!slot.unoZero&&ball.holdTime>=0.1&&occasioneChiara(p,dGoal)&&!occasioneControfuga(p)){ p.motivoTiro='occasione chiara'; aiShoot(p,0.6+rnd()*0.35,false); return; }
  if(ball.holdTime>=0.18){
    const passabile=(a,m,taglio)=>!m.excluded&&!m.uscendo&&(!taglio||entrataPronta(m))&&
      laneClear(a,m.x,m.z,t,0.55)&&passLaneRisk(a,m)<0.25&&openness(m)>1.1;
    // v0.90: contro il pressing, se lo schema è dovuto e la palla non è dove può partire, va al punto o al mezzo destro (entrate.js);
    // per lo schema basta una linea di passaggio sicura anche verso un compagno marcato: è il movimento dello schema che crea lo spazio
    const dovuto=schemaDovuto(t), sicuro=(a,m)=>!m.excluded&&!m.uscendo&&laneClear(a,m.x,m.z,t,0.5)&&passLaneRisk(a,m)<SCHEMI_PRESSING.rischio;
    const m=destinatarioEntrata(p,passabile)||((!contropiede(t)||p.freeThrow)&&(preparaEntrata(p,dovuto?sicuro:passabile)||appoggioPerSchema(p,sicuro)));
    if(m){aiPass(p,m);return;}
  }
  if(attesaEntrata(p)&&!(p.pressatoUntil>game.time))return;
  // 1 contro 0 in controfuga: dentro i 5 metri una finta per far saltare il portiere, poi lo scivolamento e il tiro
  if(slot.unoZero&&dGoal<5.4&&!p.fakeUsed&&!(p.freeThrow&&Math.abs(gx-p.x)<6)&&rnd()<dt*3){ p.fakeUsed=true; p.shootNext=true; p.decideT=0.45; startAct(p,'fake',0.1,()=>doFake(p)); return; }
  if(aiControfuga(p,dt)) return;      // controfuga: schizzo o colonnello
  if(aiPalombella(p,dt)) return;      // v0.88: palombella fuori area con il portiere fuori dai pali
  // Il palo conclude subito solo nella finestra creata dal passaggio e dalla scelta difensiva.
  // superiorità: nelle partite vere dura circa 15 s (Mondiali 2009): si fa girare palla e si tira dopo almeno 5-6 passaggi di tempo,
  // tranne il «quick» dei primi secondi; tempoSup = secondi da quando è iniziata la superiorità
  const azSup=manUp(t)?azioneAperta():null, tempoSup=azSup&&azSup.tipo==='superiorita'?game.time-azSup.t0:99;
  // v0.58 (video di Ale, finale olimpica 2024: 3 passaggi in circa 6 s e tiro dopo il passaggio lungo che cambia lato, gol a circa
  // 15 s dall'inizio della superiorità; nel gioco le superiorità duravano circa 7 s): si tira presto solo subito dopo un cambio di lato
  const dopoCambioSup=manUp(t)&&p.ricevutoCambio&&game.time-(p.ricevutoT||-9)<SUPERIORITA.dopoCambio&&tempoSup>SUPERIORITA.cambioDa;
  const supPronta=!manUp(t)||tempoSup>SUPERIORITA.pronta||dopoCambioSup;
  const costr=inCostruzione(t);
  // v0.64: il tiro subito dopo la ricezione è sicuro solo nella controfuga vera (con l'uomo in più); nella ripartenza alla pari si
  // decide come in parità
  if(p.provaLiberato!==p.ricevutoT){ p.provaLiberato=p.ricevutoT; p.vuoleLiberato=rnd()<(manUp(t)?TIRO_LIBERATO.superiorita:contropiede(t)&&azioneAperta()?.tipo==='controfuga'?1:TIRO_LIBERATO.parita); }
  // v0.66: chi ha ricevuto in entrata vicino alla porta, senza un difensore davanti a braccio alto, tira subito (entro ENTRATA.tiro)
  if(p.ricevutoInEntrata&&game.time-(p.ricevutoT||-9)<ENTRATA.tiro&&ball.holdTime>=0.08&&dGoal<ENTRATA.vicino+0.5&&!(p.freeThrow&&Math.abs(gx-p.x)<6)){
    const sit=situazioneTiro(p);
    if(sit.marcato<0.35&&laneClear(p,gx,0,t,0.6)){ p.motivoTiro='entrata'; aiShoot(p,0.6+rnd()*0.35,false); return; }
  }
  // L'ala salita sulla chiusura difensiva può concludere al volo soltanto se la difesa le concede la linea.
  if(ricezioneAla(p)&&!p.freeThrow&&ball.holdTime<0.25&&dGoal<5.6){
    const sit=situazioneTiro(p);
    if(sit.marcato<0.2&&sit.vicino>1.5&&laneClear(p,gx,0,t,0.65)){
      p.motivoTiro='ala su entrata';startAct(p,'shot',0.03,()=>doShoot(p,0.68,false,null,{volo:true}));return;
    }
  }
  // v0.65: con l'uomo in più chi vede poca porta (ala sui 2 metri) non tira al volo (SUPERIORITA.stretto)
  const strettoSup=manUp(t)&&Math.abs(gx-p.x)/Math.max(0.1,dGoal)<SUPERIORITA.stretto;
  if(p.vuoleLiberato&&supPronta&&!costr&&!strettoSup&&(p.alVolo||paloUomo(p))&&ball.holdTime<0.15&&(manUp(t)||p.ricevutoDopoFinta||p.ricevutoCambio)&&dGoal<7.5&&!(p.freeThrow&&Math.abs(gx-p.x)<6)){
    const sit=situazioneTiro(p),gk=other(t).players[0],aim=-Math.sign(gk.z||1);
    p.alVolo=false;
    if(sit.marcato<0.2&&sit.vicino>1.25&&!(p.pressatoUntil>game.time)&&laneClear(p,gx,aim,t,0.7)){
      p.motivoTiro='al volo'; startAct(p,'shot',0.03,()=>doShoot(p,0.62,false,null,{volo:true}));return;
    }
  }
  const ft=p.freeThrow&&Math.abs(gx-p.x)<6;       // tiro libero dentro i 6 metri: non si può tirare direttamente
  // Il vantaggio si legge anche tra due decisioni ordinarie. La breve cadenza evita ricerche complete a ogni frame.
  p.reazioneT=(p.reazioneT||0)-dt;
  if(p.reazioneT<=0&&ball.holdTime>=0.18){
    p.reazioneT=0.12;
    const press=openness(p),sottoPressione=p.pressatoUntil>game.time;
    const sit=situazioneTiro(p),angolo=Math.abs(gx-p.x)/Math.max(0.1,dGoal);
    if(p.vuoleLiberato&&supPronta&&!ft&&!sottoPressione&&dGoal<(costr?COSTRUZIONE.vicino:7)&&angolo>0.68&&sit.liberato&&sit.marcato<0.2&&laneClear(p,gx,0,t,0.7)){
      // Il tiro rapido non deve consumare quasi sempre la controfuga prima che il controllo per fotogramma scelga uno speciale: dalla
      // v0.88 la scelta (schizzo o colonnello SPECIALI.computer volte su uno, prima 0,35 qui) la fa aiShoot. La decisione resta immediata.
      p.motivoTiro='liberato';
      aiShoot(p,0.55+rnd()*0.45,false);
      return;
    }
    // FINTA E SCARICO (v0.55, Ale): dopo una finta riuscita, se la scelta era di scaricare, la palla va subito al compagno libero
    if(p.scaricoDopoFinta&&p.fakeUntil>game.time&&!sottoPressione){
      const m2=bestPassTarget(p,false);
      if(m2&&laneClear(p,m2.x,m2.z,t)&&openness(m2)>1.3){ p.scaricoDopoFinta=false; aiPass(p,m2); return; }
    }
    const m=bestPassTarget(p,false);
    // v0.66: il compagno in entrata pronto a ricevere (vicino alla porta, davanti al suo difensore) la riceve subito
    if(m&&m.cut&&entrataPronta(m)&&!sottoPressione&&laneClear(p,m.x,m.z,t,0.55)){ aiPass(p,m); return; }
    if(m&&laneClear(p,m.x,m.z,t)&&openness(m)>1.5){
      const md=Math.hypot(gx-m.x,m.z),ma=Math.abs(gx-m.x)/Math.max(0.1,md);
      const vantaggio=openness(m)>2.1&&openness(m)>press+0.8&&md<8.5&&ma>0.5&&
        (md<dGoal-1||(manUp(t)&&Math.sign(m.z)!==Math.sign(p.z)));
      // sotto pressione (contrasto di disturbo) si scarica solo dalla parte opposta al difensore; altrimenti si protegge la palla
      // girandosi di spalle (partita.js) e si aspetta: il passaggio che scavalca chi pressa è quello che viene intercettato
      const dP=p.pressatoDa, scarico=!sottoPressione||!dP||((m.x-p.x)*(p.x-dP.x)+(m.z-p.z)*(p.z-dP.z))>0;
      // in ripartenza (v0.54) la palla va avanti: indietro solo se pressati
      const avanti=!contropiede(t)||sottoPressione||press<1.25||Math.abs(gx-m.x)<Math.abs(gx-p.x)-1;
      if((ft||sottoPressione||press<1.25||vantaggio)&&scarico&&avanti){ aiPass(p,m); return; }
    }
  }
  p.decideT-=dt;
  if(p.decideT>0) return;
  p.decideT=0.3+rnd()*0.35;
  // time-out dell'allenatore: dopo un parziale negativo, dopo una serie di espulsioni subite, o per preparare il 7 contro 6
  if(t.timeouts>0 && !t.human && t.vuoleTimeout && timeout(t)){ t.vuoleTimeout=false; t.parzialeSubito=0; return; }
  // v0.83 (Ale: «negli ultimi minuti per preparare un attacco»): pari o sotto di un gol nell'ultimo tempo, appena ripresa la palla
  if(t.timeouts>0 && !t.human && !t.timeoutFinale && game.period>=4 && game.clock<TIMEOUT.finale && game.time-(game.possT||0)<TIMEOUT.eta &&
    t.score-other(t).score<=0 && t.score-other(t).score>=-1 && timeout(t)){ t.timeoutFinale=true; return; }
  if(t.timeouts>0 && !t.human && rnd()<0.25){ let st=0,n=0; for(const q of t.players){ if(!q.isGK&&!q.excluded){ st+=q.stamina; n++; } } if(n&&st/n<0.3&&timeout(t)) return; }
  if(p.shootNext){ p.shootNext=false; if(dGoal<9&&!ft){ const f=fintaDi(p);
      if((p.fakeCount||0)<f.max&&game.shot>4&&rnd()<0.42){ p.shootNext=true; pausaFinta(p,f); startAct(p,'fake',f.wind*(0.8+rnd()*0.4),()=>doFake(p)); return; }
      p.motivoTiro='dopo finta'; chiudiFinta(p,f,dGoal); return; } }
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
    const az=azioneAperta(); if(az&&az.quickOk===undefined) az.quickOk=rnd()<TIRO_LIBERATO.quick;
    const quick=manUp(t)&&az&&az.tipo==='superiorita'&&az.quickOk&&game.time-az.t0<3&&press>2.4&&lane&&dGoal<6.5;
    const pazienza = quick ? 1 : manUp(t) ? (dopoCambioSup||(libero&&tempoSup>SUPERIORITA.libero)?1:clamp((tempoSup-SUPERIORITA.attesa)/SUPERIORITA.rampa,0,1)) : davanti===0 ? 1 : libero ? (costr&&dGoal>COSTRUZIONE.vicino?COSTRUZIONE.libero:1) : clamp((SHOT_CLOCK-game.shot-PAZIENZA[0])/PAZIENZA[1],0,1);
    // con l'uomo in più l'esterno, che ha poco angolo, tira di rado: cerca l'uomo al palo o chi sta ai 5 metri
    // v0.65: sotto SUPERIORITA.stretto la voglia scende ancora (SUPERIORITA.strettoVoglia) e la palla gira verso chi vede più porta
    const angolo = manUp(t) ? clamp(Math.abs(gx-p.x)/Math.max(0.1,dGoal)*2,0.15,1)*(strettoSup?SUPERIORITA.strettoVoglia:1) : 1;
    // si tira quando si è liberi: subito dopo un passaggio che ha liberato il tiratore o cambiato lato; con il difensore davanti
    // a braccio alto e tutti piazzati si aspetta, si finta o si fa girare palla (il tiro arriva comunque a fine azione)
    const sit=situazioneTiro(p), occasione=(sit.liberato?1.7:1)*(sit.dopoCambio?1.6:1)*(1-0.75*sit.marcato)*(sit.daFermo?0.6:1);
    const want = game.shot<FINE_AZIONE.ultimi ? FINE_AZIONE.ultima : (game.shot<FINE_AZIONE.secondi ? FINE_AZIONE.voglia : (lane?0.2+0.36*(1-dGoal/8.5):0.1)*(press>1.5?1.35:press<0.9?0.6:1)*pazienza)*angolo*clamp(occasione,0.12,2.2);
    if(rnd()<want){
      // v0.55 (Ale: «si finta molto e poi si tira, oppure si finta e si scarica»): finte più frequenti, fino a tre;
      // dopo la finta, quasi una volta su due la palla va al compagno che si è liberato (aiCarrier, «finta e scarico»)
      { const f=fintaDi(p);
        if((p.fakeCount||0)<f.max && game.shot>5 && rnd()<(p.fakeCount?0.4:0.5)){ p.fakeUsed=true; p.shootNext=true; p.scaricoDopoFinta=rnd()<f.scarico; pausaFinta(p,f); startAct(p,'fake',f.wind*(0.8+rnd()*0.4),()=>doFake(p)); return; } }
      // v0.88: niente più palombelle a caso (prima 12 tiri su 100 oltre i 5 m): la palombella la decidono il portiere fuori dai pali e
      // la posizione (aiShoot e aiPalombella)
      const lob = false; p.motivoTiro=game.shot<FINE_AZIONE.secondi?'fine azione':manUp(t)?'superiorita':davanti===0?'nessuno davanti':libero?'libero':'pazienza'; aiShoot(p,0.55+rnd()*0.45,lob); return;
    }
  }
  if(game.shot<2 && dGoal<13 && !ft){ p.motivoTiro='sirena'; aiShoot(p,0.9,false); return; }
  // con l'uomo in più la palla gira in fretta: un tocco e via, per spostare la difesa e il portiere
  const ritmo=schemaSquadra(t).passaggi;
  // v0.53 (Ale: «circolazione macchinosa»): prima 2,5-4,5 s con lo stile «vicini» della strategia di partenza; nelle partite vere
  // sul perimetro la palla resta in mano 1-2 s. Il passaggio parte solo verso un compagno libero (bestPassTarget).
  // v0.61 (video della finale olimpica, Ale: «cerchiamo di velocizzare»): sul perimetro la palla resta in mano 0,6-1 s per tocco,
  // nel gioco 1,3 s in media: tempi accorciati di circa un terzo (CIRCOLAZIONE, secondi minimi e variazione per stile)
  const C=CIRCOLAZIONE[manUp(t)?'superiorita':ritmo]||CIRCOLAZIONE.vicini, attesa=C[0]+rnd()*C[1];
  if(p.freeThrow || (press<1.3&&rnd()<0.55) || ball.holdTime>attesa){
    // finta prima dello scarico vicino alla porta (v0.55): sposta i difensori, poi il passaggio parte dalla regola «finta e scarico»
    if(!p.freeThrow&&!manUp(t)&&dGoal<9.5&&!(p.fakeCount)&&press>1.1&&rnd()<0.3){ const f=fintaDi(p); p.scaricoDopoFinta=true; pausaFinta(p,f); startAct(p,'fake',f.wind*(0.8+rnd()*0.4),()=>doFake(p)); return; }
    const m=bestPassTarget(p); if(m&&(!contropiede(t)||press<1.3||p.freeThrow||Math.abs(gx-m.x)<Math.abs(gx-p.x)-1)){ aiPass(p,m); return; }
  }
}
