import { registraTiroReplay } from './replay.js';
// ================= PASSAGGI E TIRI =================
import { registraTiro, tipoDiTiro } from './statistiche.js';
import { controllaInterferenza } from './regole.js';
import { annuncia } from './cronaca.js';
import { FIRMA, firma } from './finte.js';
import { ALZATA, clamp, dist, gauss, rnd } from './costanti.js';
import { manUp, paloUomo, postoPortiere, setteControSei, viciniUomo } from './ia.js';
import { faseUomo } from './uomo-in-piu.js';
import { leggiCentro } from './centroboa.js';
import { schemaSquadra, viciniPerimetro } from './schemi.js';
import { velocitaDiLancio } from './palla.js';
import { paloCoperto } from './muro.js';
import { P } from './fisica-palla/parametri.js';
import { allPlayers, ball, game, goalX, other, setCtrl, teams } from './stato.js';
export function startAct(p,kind,wind,fn,aim){
  // sotto pressione (contrasto di disturbo) non si tira: si può solo passare o proteggere la palla; il rigore no
  if(kind!=='pass'&&kind!=='fake'&&p.pressatoUntil>game.time&&game.penalty!==p) return false;
  if(p.freeThrow) controllaInterferenza(p);      // chi ha fatto fallo è rimasto addosso a chi batte il tiro libero?
  const gx=goalX(p.team);
  if(!aim) aim = diSchiena(kind) ? [2*p.x-gx,2*p.z] : [gx,0];
  // chi sta ancora nuotando disteso deve prima raddrizzarsi: piccolo ritardo (non per il colonnello, che si tira in nuotata)
  // (il gesto parte anche mentre il corpo sta ancora scivolando: si aspetta solo il tempo di alzarsi)
  if(kind!=='colonnello'&&kind!=='schizzo') wind+=(kind==='pass'?0.4:1)*ALZATA*(p.oriz||0);
  // "frusta" = tempo dal braccio caricato al rilascio. Dati riportati nella tesi Patumi (Melchiorri 2015): 166 ms per i
  // professionisti, 189 ms per i semi-professionisti: chi tira meglio rilascia prima. Passaggio e finta sono gesti più corti.
  const frusta = kind==='pass'||kind==='fake' ? 0.09 : kind==='polso' ? 0.11 : 0.189-0.023*clamp((p.st.sht-0.7)/0.3,0,1);
  p.act={t:0,kind,wind,frusta,fn,aim,done:false,potenza:p.charging?Math.min(1,p.chargeT/0.9):0}; p.charging=false; p.chargeT=0;
  if(diSchiena(kind)) p.tiriDiSchiena=(p.tiriDiSchiena||0)+1;
}
// tiri del centroboa spalle alla porta
export const diSchiena = kind => kind==='beduina'||kind==='sciarpa'||kind==='rovesciata';
export function updateActs(dt){
  for(const p of allPlayers){
    const a=p.act; if(!a) continue;
    a.t+=dt;
    if(!a.done && a.t>=a.wind+a.frusta){ a.done=true; if(ball.holder===p && game.state==='play') a.fn(); }
    if(a.t>a.wind+a.frusta+0.36) p.act=null;
  }
}
// La chiusura già rilasciata continua nella pausa regolamentare. Nessuna
// callback, nuova azione o tempo di gioco: il playback non chiama il motore.
export function updateRecuperi(dt){
  for(const p of allPlayers){
    const a=p.act; if(!a?.done) continue;
    a.t+=dt;
    if(a.t>a.wind+a.frusta+0.36) p.act=null;
  }
}
export function launch(p,tx,ty,tz,t,kind){
  ball.tiroReplay=null;
  ball.state='flight'; ball.holder=null; ball.kind=kind; ball.shooter=p; ball.lastTeam=p.team;
  if(p.ballW){ ball.x=p.ballW[0]; ball.y=Math.max(0.3,p.ballW[1]); ball.z=p.ballW[2]; }
  else { ball.x=p.x+p.fx*0.25; ball.z=p.z+p.fz*0.25; ball.y=1.0; }
  const vista=p.ballVistaW;
  ball.raccordoVista=vista?.every(Number.isFinite)?{x:vista[0]-ball.x,y:vista[1]-ball.y,z:vista[2]-ball.z,durata:Math.min(0.08,Math.max(1/60,t*0.25))}:null;
  // velocità e rotazione di partenza: la palla gira all'indietro (di più nella palombella) e la mira tiene conto dell'aria
  const giri = kind==='pass' ? P.giriPassaggio : ty>0.55 ? P.giriPalombella : P.giriTiro;
  const L=velocitaDiLancio(ball.x,ball.y,ball.z,tx,ty,tz,t,giri);
  ball.vx=L.vx; ball.vy=L.vy; ball.vz=L.vz; ball.wx=L.wx; ball.wy=L.wy; ball.wz=L.wz;
  ball.flightT=0; ball.intercept=new Set(); ball.saveChecked=false; ball.pickupCD=0.3;
  ball.skip=false; ball.skipped=false; ball.schizzi=0; ball.daTiro=kind==='shot'; ball.inRete=false; ball.toccoDifesa=null; ball.ignora=null;
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
// Corridoio al tempo di arrivo: una diagonale lunga dà al difensore il tempo di entrarci.
// Il rischio guida le scelte; intercetti e traiettoria restano quelli della fisica di gioco.
export function passLaneRisk(p,m){
  const dx=m.x-p.x,dz=m.z-p.z,L2=dx*dx+dz*dz,L=Math.sqrt(L2);
  if(L<0.1) return 1;
  const speed=8.5+3.5*(p.st?.pas||0.7); let risk=0;
  for(const o of other(p.team).players){
    if(o.excluded||game.time<o.stunUntil) continue;
    const u=((o.x-p.x)*dx+(o.z-p.z)*dz)/L2;
    if(u<0.06||u>0.96) continue;
    const time=u*L/speed,anticipa=Math.min(time,0.35)*0.65;
    const ox=o.x+(o.vx||0)*anticipa,oz=o.z+(o.vz||0)*anticipa;
    const clearance=Math.hypot(ox-p.x-u*dx,oz-p.z-u*dz);
    const reach=0.52+Math.min(0.55,time*1.4);
    risk=Math.max(risk,clamp((reach-clearance)/reach,0,1));
  }
  return risk;
}
// che tipo di tiro parte in questa situazione
// 0-1: quanto il giocatore riesce ad alzarsi e a restare stabile sulle gambe (Forza, Resistenza, stanchezza)
export const elevazione = p => ((p.s.frz-40)/59*0.5+(p.s.res-40)/59*0.5)*(0.55+0.45*p.stamina);
export function shotKind(p){
  if(game.penalty===p) return 'shot';
  // centroboa spalle alla porta: beduina (braccio che gira all'esterno) oppure sciarpa (braccio che attraversa il corpo,
  // come per mettersi una sciarpa); il centroboa alterna i due gesti
  if(Math.hypot(goalX(p.team)-p.x,p.z)<4.5){
    const def=other(p.team).players.filter(q=>!q.excluded&&!q.isGK).sort((a,b)=>dist(a,p)-dist(b,p))[0];
    const lettura=leggiCentro(p,def,p),dx=goalX(p.team)-p.x,dz=-p.z;
    const fronte=(p.fx*dx+p.fz*dz)/(Math.hypot(dx,dz)||1);
    // rovesciata (Nitzkowski: quando il difensore copre una spalla; Mondiali 2009: circa il 5% dei tiri): una volta su quattro
    if(lettura.spalle&&fronte<-.2) return (p.tiriDiSchiena||0)%4===3?'rovesciata':(p.tiriDiSchiena||0)%2?'sciarpa':'beduina';
  }
  // colonnello e schizzo: solo in controfuga, con il tasto a comparsa (controfuga.js)
  return 'shot';
}
export function bestPassTarget(p,variabile=true){
  let best=null,bs=-1e9; const sup=manUp(p.team),schema=schemaSquadra(p.team),gx=goalX(p.team),press=openness(p);
  for(const m of p.team.players){
    if(m===p||m.excluded||m.uscendo||(m.isGK&&!setteControSei(p.team))) continue;
    const d=dist(p,m); if(d<1.2) continue;
    const dg=Math.hypot(gx-m.x,m.z),aperto=openness(m),risk=passLaneRisk(p,m),linea=laneClear(p,m.x,m.z,p.team,0.55);
    const interno=(!sup&&m.i===1)||(sup&&paloUomo(m));
    if(interno){
      const def=other(p.team).players.filter(q=>!q.excluded&&!q.isGK).sort((a,b)=>dist(a,m)-dist(b,m))[0];
      if(!leggiCentro(m,def,p).ricevibile||!linea||risk>0.3) continue;
    }
    const vicino=sup?viciniUomo(p.team,p.i,m.i):viciniPerimetro(p.i,m.i,false),perimetro=!interno&&!p.isGK&&!(sup?paloUomo(p):p.i===1);
    if(perimetro&&!vicino){
      const gk=other(p.team).players[0];
      const fuoriPosto=Math.abs(gk.z-postoPortiere(gk.team,m.x,m.z));
      const guadagno=aperto>2&&(aperto>Math.min(press,3)+0.8||fuoriPosto>0.65||dg<Math.hypot(gx-p.x,p.z)-1.8);
      // Uno skip coperto non diventa conveniente per un bonus di posizione o un numero casuale.
      if(!linea||risk>0.18||!guadagno) continue;
    }
    let s=Math.min(aperto,3)*1.2-dg*0.14-d*0.07-risk*6+(linea?0.8:-2.8);
    if(vicino) s+=schema.passaggi==='vicini'?2.4:schema.passaggi==='equilibrati'?1.7:1.25;
    if(interno) s+=1.6+(schema.id==='boa'&&!sup?0.8:0);
    // uomo in più: la fase in corso dello schema chiamato indica a chi dare la palla
    if(sup&&faseUomo(p.team)?.palla===m.i) s+=1.8;
    // Una ricezione che libera un tiro ravvicinato prevale sul semplice appoggio laterale.
    const occasione=aperto>2.1&&dg<8.5&&Math.abs(gx-m.x)/Math.max(0.1,dg)>0.5&&
      (dg<Math.hypot(gx-p.x,p.z)-1||sup&&Math.sign(m.z)!==Math.sign(p.z));
    if(occasione&&linea&&risk<0.18) s+=2.6;
    // Un ritorno può essere la risposta corretta alla difesa: si limita solo il ping-pong senza progresso.
    if(m===p.daChi&&ball.holdTime<0.35&&!interno) s-=0.35;
    if(variabile) s+=(rnd()-0.5)*clamp((99-p.s.vis)/59,0,1)*0.8;
    if(s>bs){ bs=s; best=m; }
  }
  return best;
}
export function humanPassTarget(p,ix,iz){
  const il=Math.hypot(ix,iz);
  if(il<0.3) return bestPassTarget(p,false);
  // v0.55 (Ale: «più di una volta ho passato la palla al portiere quando ero in attacco»; «fatico a dare la palla al centro»):
  // il proprio portiere si sceglie solo nella propria metà campo e se non c'è nessun altro nella direzione; con la levetta verso
  // la porta avversaria il centroboa (o il palo con l'uomo in più) ha la precedenza se è nel cono
  const gx=goalX(p.team), versoPorta=((gx-p.x)*ix+(-p.z)*iz)/((Math.hypot(gx-p.x,p.z)||1)*il), inAttacco=Math.abs(gx-p.x)<12.5;
  let best=null, bs=-1e9, portiere=null;
  for(const m of p.team.players){
    if(m===p||m.excluded||m.uscendo) continue;
    const dx=m.x-p.x, dz=m.z-p.z, d=Math.hypot(dx,dz)||1;
    const c=(dx*ix+dz*iz)/(d*il); if(c<0.35) continue;
    if(m.isGK&&!setteControSei(p.team)){ if(!inAttacco&&c>0.8) portiere=m; continue; }
    const boa=(!manUp(p.team)&&m.i===1)||(manUp(p.team)&&paloUomo(m));
    const s=c*4 - d*0.07 + (laneClear(p,m.x,m.z,p.team)?0.5:0) + (boa&&versoPorta>0.55&&c>0.5?BOA_PREFERITO:0);
    if(s>bs){ bs=s; best=m; }
  }
  return best||portiere||bestPassTarget(p,false);
}
export const PASSAGGIO_ALTEZZA=0.95, BOA_PREFERITO=1.2;
export function doPass(p,m){
  if(!m) return;
  // v0.55 (Ale: «ad alti livelli il palleggio è alto, teso e veloce»): 11-15,5 m/s (prima 8,5-12) e arrivo alla mano alzata
  // di chi riceve (PASSAGGIO_ALTEZZA, prima 0,45 m: la palla scendeva verso l'acqua)
  const spd=11+4.5*p.st.pas;
  let tx=m.x, tz=m.z; let t=dist(p,m)/spd;
  tx+=m.vx*t*0.8; tz+=m.vz*t*0.8;
  const d=Math.hypot(tx-p.x,tz-p.z); t=Math.max(0.25,d/spd);
  const err=(0.2+(1-p.stamina)*0.5)*(1.25-p.st.pas)*(0.3+d*0.05);
  tx+=gauss()*err; tz+=gauss()*err;
  launch(p,tx,PASSAGGIO_ALTEZZA,tz,t,'pass'); ball.target=m; ball.tx=tx; ball.tz=tz; ball.dopoFinta=p.fakeUntil>game.time||game.time<(p.fintaFino||0); ball.firma=firma(p,'pass'); if(ball.firma) p.ultimaFintaT=-9;
  game.passaggi=(game.passaggi||0)+1; if(Math.abs(p.z-m.z)>5&&Math.sign(p.z||1)!==Math.sign(m.z||1)) game.cambiLato=(game.cambiLato||0)+1;
  m.daChi=p; ball.cambioLato=Math.abs(p.z-m.z)>5&&Math.sign(p.z||1)!==Math.sign(m.z||1);      // passaggio da un lato all'altro: chi riceve può tirare al volo
  if(p.team===teams[0]){ setCtrl(m);
    // v0.55: suggerimento per il tiro al volo quando il compagno riceve vicino alla porta
    if(p.team.human&&!m.isGK&&Math.hypot(goalX(m.team)-m.x,m.z)<8) annuncia('avviso','Tocca TIRO: al volo',{durata:0.9}); }
  // Le entrate sono coordinate da aggiornaSchemi: nessun taglio casuale in conflitto con l'editor.
}
// Situazione di chi sta per tirare (usata dal tiro e dalle scelte del computer):
// marcato 0-1 = difensore vicino, tra lui e la porta, con il braccio alto; liberato = palla appena ricevuta su passaggio e
// nessuno entro 1,8 m; dopoCambio = palla arrivata da un passaggio che ha cambiato lato, meno di un secondo e mezzo fa;
// daFermo = palla tenuta a lungo (difesa e portiere hanno avuto il tempo di piazzarsi)
export function situazioneTiro(p){
  const t=p.team, gx=goalX(t), dP=Math.hypot(gx-p.x,p.z)||1; let marcato=0, vicino=99;
  for(const o of other(t).players){
    if(o.excluded||o.isGK||game.time<o.stunUntil) continue;
    const dd=dist(o,p); vicino=Math.min(vicino,dd); if(dd>2) continue;
    const cs=((o.x-p.x)*(gx-p.x)+(o.z-p.z)*(-p.z))/((dd||1)*dP);
    if(cs>0.4) marcato=Math.max(marcato,clamp((2-dd)/1.1,0,1)*clamp((cs-0.4)/0.4,0,1));
  }
  const da=game.time-(p.ricevutoT||0)-(p.act?p.act.t:0);      // tempo tra la ricezione e l'inizio del gesto
  return { marcato, vicino, liberato:!!p.ricevutoPassaggio&&da<1.5&&vicino>1.8, dopoCambio:!!p.ricevutoCambio&&da<1.5, daFermo:da>2.5 };
}
// errore di mira secondo la Precisione: piccolo a 90, circa 3 volte a 75, 7 volte a 60 (misurato su 1500 tiri: vedi npm run statistiche)
const mira = pre => pre>=90 ? 0.18-(pre-90)/9*0.1 : 0.18+Math.pow((90-pre)/30,1.6)*1.55;
// o = variante: polso (tiro di solo polso, poco caricato), dopoFinta, torsione (finta di busto sul primo palo e chiusura in diagonale), volo
export function doShoot(p,power,lob,aimZ,o){
  o=o||{};
  const tipoAzione=tipoDiTiro(p,ball);
  const t=p.team, gx=goalX(t), gk=other(t).players[0];
  // si mira un po' più dentro di prima: ora pali e traversa sono veri e la palla ha il suo ingombro
  let az = aimZ!=null ? clamp(aimZ*1.28,-1.28,1.28) : -Math.sign(gk.z||(rnd()-0.5))*(0.85+rnd()*0.38);
  let ay = lob ? 0.55 : 0.15+rnd()*0.55;
  // TIRO BASSO CHE RIMBALZA (Berlino 2018: in parità i tiri bassi e quelli che toccano l'acqua davanti alla porta rendono di più;
  // il tiro alto senza rimbalzo segna il 31%): il computer lo sceglie una volta su cinque nei tiri classici in parità
  if(!lob&&aimZ==null&&!o.speciale&&!game.penalty&&!manUp(p.team)&&rnd()<0.2) { ay=0.04+rnd()*0.05; o.rimbalzo=true; }
  const d=Math.hypot(gx-p.x,az-p.z);
  let press=99; for(const o of other(t).players){ if(!o.excluded&&!o.isGK&&game.time>=o.stunUntil) press=Math.min(press,dist(o,p)); }
  // un tiro marcato stretto è molto meno preciso: gli schemi servono a liberare il tiratore
  // Precisione: tra 60 e 90 l'errore di mira cala di quasi quattro volte (dallo stesso punto, circa il doppio dei tiri nello specchio).
  // Dalla tesi: la precisione NON dipende dalla velocità del tiro (nessuna correlazione), quindi tirare forte non costa mira;
  // il tiro classico è più preciso di beduina, sciarpa e colonnello.
  const tipo=p.act?p.act.kind:'shot', classico=tipo==='shot'||tipo==='lob'||tipo==='polso'||tipo==='torsione';
  // elevazione: quanto il tiratore esce dall'acqua dipende da gambe (Forza), fiato (Resistenza) e stanchezza;
  // più è alto, meno il difensore vicino gli sporca il tiro
  const elev=elevazione(p);
  // QUANTO È LIBERO CHI TIRA. Un difensore davanti con il braccio alto (tra il tiratore e la porta) rende il tiro molto più
  // difficile; chi tira subito dopo aver ricevuto, senza nessuno addosso, è stato "liberato" dal passaggio e tira meglio.
  const dPorta=Math.hypot(gx-p.x,p.z), q=situazioneTiro(p);
  const errBase=(1+0.75*q.marcato)*(q.liberato?0.8:1)*(1+Math.max(0,dPorta-7)*0.3)*1.08*0.27*(1+(1-p.stamina)*1.3)*(classico?1:1.3)*mira(p.s.pre)*(1+clamp(1.4-press,0,1)*0.9*(1.45-0.9*elev))*(o.volo?1.15:1)*(p.fakeUntil>game.time?0.65:1);
  // Mano: dal lato destro della vasca tira meglio un mancino, dal sinistro un destro (angolo migliore sulla porta)
  // MIRA CONTRO FORZA (Berlino 2018: in parità i gol sono stati tirati in media più piano dei tiri sbagliati): oltre l'80% della
  // forza la mira peggiora un poco (fino a +35% di errore al massimo); il rigore è escluso
  const sforzo=game.penalty===p?1:1+0.35*clamp((power-0.8)/0.2,0,1);
  const lato=Math.abs(p.z)>1.5?Math.sign(p.z*t.dir):0, mano=lato===0?1:((p.mano==='S')===(lato>0)?0.92:1.2);
  az+=gauss()*errBase*mano*sforzo*(0.45+d*0.09); ay+=gauss()*errBase*mano*sforzo*(o.rimbalzo?0.15:0.35);
  // Velocità al rilascio (dati riportati nella tesi): professionisti 22,8 ± 2,4 m/s a tutta forza. La bravura al tiro sposta
  // il massimo tra circa 20 e 25 m/s; il tiro classico è il più veloce.
  const vMax=(22.8+(p.s.pot-75)*0.16)*(classico?1:tipo==='colonnello'?0.9:tipo==='schizzo'?0.82:0.85);      // Potenza: da circa 20 (60) a 25 m/s (90)
  const spd = lob ? 4.5+d*0.15 : vMax*(0.5+0.5*power)*(0.75+0.25*p.stamina)*(o.torsione?0.92:1);
  // tiro a schizzo (sezione 4): schiaffo dalla superficie, palla bassa e tesa (sostituisce il vecchio tiro che rimbalzava
  // apposta prima della porta)
  if(o.speciale==='schizzo') ay=clamp(0.12+(ay-0.15)*0.45,0.08,0.5);
  if(p.act) p.act.potenza=power;
  p.effettoTiro={tipo,forza:power,inizio:game.time};
  launch(p,gx,ay,az,d/spd,'shot');
  if(o.speciale==='schizzo') ball.y=Math.min(ball.y,0.32);      // parte dal pelo dell'acqua
  ball.shotPower=lob?0.3:power; ball.lob=lob; ball.crossZ=az; ball.paloCoperto=paloCoperto(p); ball.rigore=game.penalty===p;
  ball.tipoTiro=tipoAzione; registraTiro(p,tipoAzione);
  // dove si trova il portiere nel momento in cui parte il tiro: è da qui che dipende soprattutto la parata
  ball.gkZ0=gk.z; ball.gkFuoriPosto=Math.abs(gk.z-postoPortiere(gk.team,p.x,p.z));
  ball.gkVz0=gk.vz; ball.rimbalzo=!!o.rimbalzo;      // portiere ancora in movimento di lato al momento del tiro (Berlino 2018)
  // sorpresa per portiere e muro: il polso parte senza caricare (ancora di più dopo una finta); con la torsione il portiere
  // si sposta verso il primo palo e la palla va sull'altro
  ball.sorpresa = o.polso ? (o.dopoFinta?0.26:0.15) : o.torsione ? 0.08 : o.volo ? 0.06 : o.speciale==='schizzo' ? 0.14 : o.speciale==='colonnello' ? 0.1 : 0;
  // FIRMA (v0.55, finte.js): la finta personale chiusa con il suo seguito tipico spiazza un po' di più portiere e muro
  { const seguito=lob?'lob':o.polso?'polso':o.volo||o.speciale?null:'shot'; ball.firma=!!seguito&&firma(p,seguito); if(ball.firma){ ball.sorpresa+=FIRMA.sorpresa; p.ultimaFintaT=-9; } }
  ball.elevazione=elev;
  // per il portiere: tiro da lontano o da poco angolo = più tempo e meno porta; tiro "da fermo" con tutti piazzati = facile da
  // leggere; tiro subito dopo un cambio di lato della palla = portiere ancora in viaggio
  registraTiroReplay(p,{tipo:o.speciale||tipo,distanza:dPorta,rigore:ball.rigore});
  ball.distTiro=dPorta; ball.angoloTiro=Math.abs(gx-p.x)/Math.max(0.5,dPorta); ball.marcato=q.marcato; ball.liberato=q.liberato;
  ball.dopoCambio=q.dopoCambio; ball.daFermo=q.daFermo&&!o.polso&&!o.torsione;
  if(o.torsione) ball.gkZ0-=Math.sign(az||1)*0.4;
  p.stamina=Math.max(0,p.stamina-0.04);
}
