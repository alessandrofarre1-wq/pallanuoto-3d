// Entrate in parità: passaggio al vicino, taglio e occupazione dei posti.
// Gli atleti conservano indice, mano e specialità; cambiano soltanto gli obiettivi di nuoto.
import { MARK, dist } from './costanti.js';
import { ball, ctrl, game, goalX, other } from './stato.js';
import { schemaSquadra } from './schemi.js';
import { ENTRATA, ENTRATE_REATTIVE as E } from './taratura.js';
import { resetEntrantiCambio } from './difesa-cambi.js';

const disponibile=p=>p&&!p.isGK&&!p.excluded&&!p.uscendo;
const automatico=t=>!t.human||game.autoplay;
const pari=t=>!t.players.some(p=>p.excluded)&&!other(t).players.some(p=>p.excluded);
const profondita=p=>(goalX(p.team)-p.x)*p.team.dir;
const specialita=p=>p.scheda?.ruolo??(p.role==='Centroboa'?1:p.role==='Punto'?6:p.i);
export const specialistaBoa=p=>specialita(p)===1;
// Soltanto quando le regole ricollocano tutti i giocatori: le mappe dell'azione
// precedente non descrivono più quei posti. Un recupero in gioco vivo le conserva.
export function resetDisposizioneTattica(t){
  resetEntrantiCambio(t);
  Object.assign(t,{occupantiAttacco:null,occupantiSchema:null,occupantiTempo:null,accoppiamenti:null,
    entrataAzione:null,preparaEntrata:null,rotazioneCentro:null,entrataDopo:0,scambio:null,adattamentoEntrata:null,
    chiamataAttacco:null,chiamataPossesso:null,
    schemaStato:null,copertura:null,blocco:null,aiutoStato:null,lasciato:null,lasciatoT:0,centroT:-1,centroAperto:false});
  for(const p of t.players){p.cut=null;p.appoggio=null;}
}
function posti(t){
  if(!t.occupantiAttacco||t.occupantiAttacco.some((p,i)=>p&&!t.players.includes(p))||t.occupantiSchema!==schemaSquadra(t)||game.time<(t.occupantiTempo??-1)){
    t.occupantiAttacco=[...t.players];t.occupantiSchema=schemaSquadra(t);t.entrataAzione=null;t.rotazioneCentro=null;t.entrataDopo=0;t.chiamataAttacco=null;t.chiamataPossesso=null;
  }
  t.occupantiTempo=game.time;return t.occupantiAttacco;
}
export const occupanteAttacco=(t,i)=>posti(t)[i];
export function postoCentro(t){
  const f=schemaSquadra(t).attacco;let best=1,score=Infinity;
  for(let i=0;i<f.length;i++){const [d,z]=f[i],s=Math.abs(z)*2+Math.abs(d-2.7);if(d<5&&Math.abs(z)<2.3&&s<score){best=i+1;score=s;}}
  return best;
}
export const centroAttacco=t=>occupanteAttacco(t,postoCentro(t));
export function postoAttacco(p){return p.isGK?0:Math.max(1,posti(p.team).indexOf(p));}
// L'IA difensiva può fornire gli accoppiamenti reali. Fallback per l'avvio e le scene isolate.
export function difensoreEntrata(p){
  const t=other(p.team),assegnati=t.accoppiamenti?.uomini;
  return t.players.find(d=>disponibile(d)&&assegnati?.[d.i]===p)||
    t.players.find(d=>disponibile(d)&&MARK[d.i]===p.i);
}
const atletico=p=>((p.s?.vel??70)+(p.s?.pre??70)+(p.s?.frz??70))/3;
export function latoTecnico(p,ala){return p.mano==='S'&&ala.mano==='S'||Math.min(atletico(p),atletico(ala))>=E.manoAbile;}
const pressato=p=>{const d=difensoreEntrata(p);return !!d&&(dist(d,p)<E.pressing||p.pressatoUntil>game.time||
  p.freeThrow&&game.time-(p.falloT??-9)<4&&dist(d,p)<3);};
function valida(t,rotazione=false,chiamata=false){return game.state==='play'&&game.possTeam===t&&pari(t)&&(automatico(t)||chiamata||rotazione&&schemaSquadra(t).id==='falso-centro')&&!t.entrataAzione&&!t.rotazioneCentro&&
  !t.players.some(p=>p.cut)&&(chiamata||game.time>=(t.entrataDopo||0));}

// La chiamata umana dispone i compagni e aspetta l'appoggio: non prende il
// controllo della palla. I riferimenti sono agli atleti che occupano i posti ora.
export function chiamataAttuale(t){
  const c=t.chiamataAttacco;if(!c)return null;
  if(game.possTeam!==t||!pari(t)||game.period!==c.periodo||game.possT!==c.possT||
    game.time>c.fino||!disponibile(c.p)||!disponibile(c.m)||
    !t.players.includes(c.p)||!t.players.includes(c.m)||['menu','over','countdown'].includes(game.state)){
    t.chiamataAttacco=null;
    if(t.preparaEntrata?.chiamata===c)t.preparaEntrata=null;
    return null;
  }
  return c;
}
export function chiamaEntrata(t,tipo){
  posti(t);
  if(!t.human||game.autoplay||!['A','B','C'].includes(tipo)||!valida(t,false,true)||chiamataAttuale(t)||
    t.chiamataPossesso?.possT===game.possT&&t.chiamataPossesso.periodo===game.period)return false;
  const p=occupanteAttacco(t,tipo==='C'?4:6),m=occupanteAttacco(t,tipo==='B'?5:tipo==='C'?6:4);
  const ala=occupanteAttacco(t,2);
  if(!disponibile(p)||!disponibile(m)||tipo==='B'&&(!disponibile(ala)||!latoTecnico(p,ala)))return false;
  t.preparaEntrata=null;
  t.chiamataAttacco={tipo,p,m,side:tipo==='A'?-1:1,t0:game.time,fino:game.time+E.durata,possT:game.possT,periodo:game.period};
  t.chiamataPossesso={possT:game.possT,periodo:game.period};
  return true;
}
export function passaggioChiamato(p,passabile){
  const t=p.team;posti(t);const c=chiamataAttuale(t);
  if(!c||c.p!==p||ball.holder!==p||!valida(t,false,true)||profondita(p)>E.attacco||
    dist(p,c.m)<1.8||dist(p,c.m)>=E.appoggio||!passabile(p,c.m,false))return null;
  t.preparaEntrata={...c,fino:Math.min(c.fino,game.time+.7),chiamata:c};return c.m;
}

// Solo la partenza effettiva del passaggio mette in moto il tagliante.
export function preparaEntrata(p,passabile){
  const t=p.team;posti(t);
  const chiamato=passaggioChiamato(p,passabile);if(chiamato)return chiamato;
  if(chiamataAttuale(t))return null;
  if(!valida(t)||p===ctrl||profondita(p)>E.attacco||!pressato(p)) return null;
  const dopoFallo=p.freeThrow&&game.time-(p.falloT??-9)<4;
  if(!dopoFallo&&(game.time-game.possT<E.circolazione||(game.passaggi||0)<E.passaggi))return null;
  const pos=postoAttacco(p),scelte=[];
  if(pos===6){
    const a=occupanteAttacco(t,4),b=occupanteAttacco(t,5),ala=occupanteAttacco(t,2);
    if(disponibile(a)&&a!==ctrl) scelte.push({tipo:'A',m:a,side:-1});
    if(disponibile(b)&&b!==ctrl&&disponibile(ala)&&latoTecnico(p,ala)) scelte.push({tipo:'B',m:b,side:1});
    if(p.mano==='S'&&ala?.mano==='S') scelte.reverse();
  }else if(pos===4){
    const vicino=occupanteAttacco(t,6),ala=occupanteAttacco(t,2);
    for(const m of [vicino,ala]) if(disponibile(m)&&m!==ctrl) scelte.push({tipo:'C',m,side:1});
  }
  const scelta=scelte.find(s=>dist(p,s.m)>=1.8&&dist(p,s.m)<E.appoggio&&passabile(p,s.m));
  if(!scelta)return null;
  t.preparaEntrata={...scelta,p,fino:game.time+0.7,possT:game.possT};return scelta.m;
}
function scambia(t,a,b){const f=posti(t),ia=f.indexOf(a),ib=f.indexOf(b);if(ia>0&&ib>0)[f[ia],f[ib]]=[f[ib],f[ia]];}
function inizia(p,tipo,appoggio,side,arrivo=null){
  const t=p.team,gx=goalX(t),ala=occupanteAttacco(t,side<0?3:2),esterno=occupanteAttacco(t,side<0?5:4);
  const c={coordinata:true,tipo,t0:game.time,phase:0,tratto:tipo==='A'||tipo==='B'?0:1,
    x:gx-t.dir*E.fondo,z:side*E.palo*t.dir,guarda:appoggio};
  if(arrivo){c.x=arrivo.x;c.z=arrivo.z;}
  p.cut=c;p.cutT=game.time;t.copertura=null;t.blocco=null;t.entrataDopo=game.time+ENTRATA.ogni;
  t.entrataAzione={tipo,entrante:p,appoggio,ala,esterno,side,t0:game.time,possT:game.possT,allargata:false};
  if(tipo==='A'||tipo==='B'){
    // 3 entra sul lato opposto, l'esterno copre 3 e l'ala sale nel posto lasciato dall'esterno.
    scambia(t,p,esterno);scambia(t,p,ala);
  }else if(tipo==='C') scambia(t,p,ala);
  return true;
}
export function registraPassaggioEntrata(p,m){
  const t=p.team,c=chiamataAttuale(t),diretto=c&&c.p===p&&c.m===m&&profondita(p)<=E.attacco&&dist(p,m)>=1.8&&dist(p,m)<E.appoggio;
  const s=t.preparaEntrata||(diretto?{...c,chiamata:c}:null);t.preparaEntrata=null;
  const chiamata=s?.chiamata&&chiamataAttuale(t)===s.chiamata;
  if(!s||s.p!==p||s.m!==m||s.possT!==game.possT||game.time>s.fino||!valida(t,false,!!chiamata)||p===ctrl&&!chiamata)return false;
  const avviata=inizia(p,s.tipo,m,s.side);
  if(avviata&&chiamata){t.entrataAzione.chiamata=s.tipo;t.chiamataAttacco=null;}
  return avviata;
}
function mezzaEntrata(t){
  for(const i of [2,3]){
    const p=occupanteAttacco(t,i);if(!disponibile(p)||p===ctrl||p===ball.holder||profondita(p)>3.7)continue;
    const d=difensoreEntrata(p);if(!d||dist(d,p)>3)continue;
    const testa=(p.x-d.x)*t.dir,verso=(p.x-d.x)*(d.fx||0)+(p.z-d.z)*(d.fz||0);
    // Essere semplicemente largo non basta: testa già davanti e difensore che non segue.
    if(testa<E.testa||!(d.stunUntil>game.time||verso<-0.2||Math.hypot(d.vx||0,d.vz||0)<0.18&&testa>1.05))continue;
    const side=i===2?1:-1;
    const gx=goalX(t),dx=gx-t.dir*E.fondo-p.x,dz=side*E.palo*t.dir-p.z,l=Math.hypot(dx,dz);
    if(l<E.mezzaMin)continue;
    const s=Math.min(1,E.mezzaMetri/l),arrivo=limiteAreaEntrata(p,p.x+dx*s,p.z+dz*s),metri=Math.hypot(arrivo.x-p.x,arrivo.z-p.z);
    // Uno scatto breve deve offrire un punto di ricezione raggiungibile: dall'ala
    // ancora larga si continua a circolare, senza un taglio sterile o più lungo.
    if(metri<E.mezzaMin||metri>E.mezzaMetri+1e-6||Math.hypot(gx-arrivo.x,arrivo.z)>ENTRATA.vicino-E.mezzaMargine)continue;
    inizia(p,'D',ball.holder,side,arrivo);return;
  }
}
function ruotaCentro(t){
  if(!valida(t,true))return;
  const uscente=t.players.filter(p=>disponibile(p)&&p!==ctrl&&p!==ball.holder&&!specialistaBoa(p)&&profondita(p)<E.centro&&Math.abs(p.z)<2.2)
    .sort((a,b)=>Math.abs(a.z)-Math.abs(b.z))[0];
  if(!uscente)return;
  const d=difensoreEntrata(uscente),boa=t.players.find(p=>disponibile(p)&&p!==uscente&&p!==ctrl&&p!==ball.holder&&specialistaBoa(p));
  if(!d||!boa||dist(d,uscente)>1.9||specialita(d)!==6||(d.s?.dif??0)<E.difensoreForte)return;
  const side=boa.z*t.dir<0?-1:1;
  // Il vero centro deve poter prendere un avversario meno capace; non basta il nome del ruolo.
  const debole=difensoreEntrata(boa);if(!debole||(d.s?.dif??0)-(debole.s?.dif??0)<E.divario)return;
  t.rotazioneCentro={uscente,boa,side,t0:game.time,possT:game.possT};t.entrataDopo=game.time+ENTRATA.ogni;
  scambia(t,uscente,boa);
}
export function aggiornaEntrate(t){
  posti(t);
  const chiamata=chiamataAttuale(t);
  const a=t.entrataAzione,r=t.rotazioneCentro;
  if(game.possTeam!==t||!pari(t)){
    if(a?.entrante.cut?.coordinata)a.entrante.cut=null;
    t.entrataAzione=null;t.rotazioneCentro=null;t.preparaEntrata=null;return;
  }
  if(a){
    if(a.possT!==game.possT||!disponibile(a.entrante)||game.time-a.t0>E.durata||!a.entrante.cut&&ball.holder!==a.entrante){t.entrataAzione=null;return;}
    if(a.entrante.cut){a.entrante.cut.guarda=ball.holder?.team===t?ball.holder:a.appoggio;}
    if(a.ala!==a.entrante&&disponibile(a.ala)){
      const d=difensoreEntrata(a.ala),e=a.entrante;
      // La salita dell'ala risponde alla chiusura reale del suo difensore sul taglio.
      if(d&&profondita(e)<5&&dist(d,e)<E.stringe&&dist(d,a.ala)>1.5)a.allargata=true;
    }
    return;
  }
  if(r){if(r.possT!==game.possT||game.time-r.t0>E.durata||!disponibile(r.uscente)||!disponibile(r.boa))t.rotazioneCentro=null;return;}
  if(t.preparaEntrata&&game.time<t.preparaEntrata.fino)return;
  if(chiamata)return;
  if(!valida(t,true)||!ball.holder||ball.holder.team!==t||ball.holder.isGK||profondita(ball.holder)>E.attacco)return;
  ruotaCentro(t);if(!t.rotazioneCentro&&automatico(t))mezzaEntrata(t);
}
// Il punto di arresto si ferma fuori dai 2 m; dentro solo dietro la linea della palla.
export function limiteAreaEntrata(p,x,z){
  const t=p.team,gx=goalX(t),d=(gx-x)*t.dir;
  if(Math.abs(z)<3.58&&d<2.12){
    const b=ball.holder?.team===t?ball.holder:ball;
    const bd=(gx-b.x)*t.dir;
    return {x:gx-t.dir*Math.max(d,Math.min(2.12,bd+0.15)),z};
  }
  return {x,z};
}
export function targetEntrata(p){
  const t=p.team,a=t.entrataAzione,c=p.cut,r=t.rotazioneCentro,gx=goalX(t);
  if(c?.coordinata){
    if(game.time-c.t0>E.durata){p.cut=null;return null;}
    let x=c.x,z=c.z;
    if(c.tratto===0){x=gx-t.dir*E.diagonale;z=Math.sign(c.z)*E.corridoio;
      if(Math.hypot(x-p.x,z-p.z)<1){c.tratto=1;x=c.x;z=c.z;}}
    if(Math.hypot(c.x-p.x,c.z-p.z)<.65){c.phase=1;c.t1??=game.time;}
    return {...limiteAreaEntrata(p,x,z),sprint:c.phase===0};
  }
  if(a&&game.time-a.t0<E.durata){
    if(p===a.ala&&p!==a.entrante){
      const d=a.allargata?E.alaSale:4.7,z=a.side*(a.allargata?3.1:5.5)*t.dir;
      return {x:gx-t.dir*d,z,sprint:Math.hypot(gx-t.dir*d-p.x,z-p.z)>1.6};
    }
    if(a.tipo!=='D'&&p===a.esterno&&p!==a.entrante&&p!==a.appoggio)return {x:gx-t.dir*7.4,z:0,sprint:false};
    if(p===a.entrante&&ball.holder===p)return {x:p.x,z:p.z};
  }
  if(r){
    if(p===r.uscente)return {x:gx-t.dir*3.2,z:r.side*5.5*t.dir,sprint:true};
    if(p===r.boa){
      // Si libera il corridoio prima di subentrare: niente due corpi sullo stesso posto.
      const libero=Math.abs(r.uscente.z)>2.5;
      return libero?{x:gx-t.dir*2.7,z:0,sprint:true}:{x:p.x,z:p.z};
    }
  }
  return null;
}
export function destinatarioEntrata(p,passabile){
  const a=p.team.entrataAzione;if(!a||a.possT!==game.possT||game.time-a.t0>E.durata)return null;
  if(p!==a.appoggio)return null;
  if(a.entrante.cut&&passabile(p,a.entrante,true))return a.entrante;
  if(a.allargata&&disponibile(a.ala)&&a.ala!==a.entrante&&profondita(a.ala)>2.8&&Math.abs(a.ala.z)<4.15&&passabile(p,a.ala,false))return a.ala;
  return null;
}
export function attesaEntrata(p){
  const a=p.team.entrataAzione;
  return !!a&&a.appoggio===p&&a.entrante.cut&&game.time-a.t0<E.attesaAppoggio&&!p.freeThrow;
}
export function ricezioneAla(p){
  const a=p.team.entrataAzione;return !!a&&a.allargata&&a.ala===p&&p.daChi===a.appoggio&&
    p.ricevutoPassaggio&&game.time-(p.ricevutoT??-9)<ENTRATA.tiro;
}
