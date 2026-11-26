// Sagoma e tentativo del portiere: stessi punti per urti e disegno.
// Nessuna lettura del rig, della qualità grafica o del caso: il sorteggio è un input.
import { G, VIS } from './costanti.js';
import { PARATA_PORTIERE as P, pesata } from './taratura.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=x=>{const q=clamp(x,0,1);return q*q*(3-2*q);};
const GIUNTI=['hip','chest','head','sR','sL','eR','eL','hR','hL'];
const TORACE=[.25,.65,1];
const OSSA_BRACCIA=[['sR','eR'],['sL','eL'],['eR','hR'],['eL','hL']];
const CATENE_BRACCIA=[['sR','hR','eR',1],['sL','hL','eL',-1]];
const PRONTO={hip:[-.06,Math.max(-.22/VIS,-.5),0],chest:[.02,.04,0],head:[.05,.26,0],
  sR:[.02,.04,.2],sL:[.02,.04,-.2],hR:[.26,.14,.44],hL:[.26,.14,-.44]};
const nuovoVettore=()=>[0,0,0];
const punto=(v,x,y,z)=>{v[0]=x;v[1]=y;v[2]=z;return v;};
// Raggi tarati sul rig precedente aVIS1,45: seguono il corpo, non la porta.
const nuovaSfera=(parte,raggio)=>({centro:nuovoVettore(),raggio:raggio*VIS/1.45,parte});
const nuoveSfere=()=>[
  ...Array.from({length:3},()=>nuovaSfera('torace',.23)),nuovaSfera('testa',.19),
  ...Array.from({length:10},()=>nuovaSfera('braccio',.07)),
  ...Array.from({length:10},()=>nuovaSfera('braccio',.08)),
  nuovaSfera('mano',.085),nuovaSfera('mano',.085)
];
const copiaGiunti=J=>Object.fromEntries(GIUNTI.map(k=>[k,J[k].slice()]));

// Stessa catena a due segmenti delle pose, con estensione limitata prima del gomito.
// Il risultato è numerico e non dipende da un osso Three.js già aggiornato.
function braccio(S,H,E,lato){
  let x=H[0]-S[0],y=H[1]-S[1],z=H[2]-S[2],d=Math.hypot(x,y,z)||.001;
  x/=d;y/=d;z/=d;d=clamp(d,.03,.586);
  const a=(.30*.30-.29*.29+d*d)/(2*d),h=Math.sqrt(Math.max(0,.30*.30-a*a));
  const k=-.3*y+lato*z;let px=-x*k,py=-.3-y*k,pz=lato-z*k;
  let n=Math.hypot(px,py,pz);if(n<.001){px=0;py=-1;pz=0;n=1;}
  punto(E,S[0]+x*a+px/n*h,S[1]+y*a+py/n*h,S[2]+z*a+pz/n*h);
  punto(H,S[0]+x*d,S[1]+y*d,S[2]+z*d);
}
function orientamento(gk){
  const n=Math.hypot(gk.fx||0,gk.fz||0);
  return n>1e-9?[gk.fx/n,gk.fz/n]:[-(gk.team?.dir||1),0];
}
function mondo(out,v,gk,c,s){
  return punto(out,gk.x+VIS*(v[0]*c-v[2]*s),VIS*v[1],gk.z+VIS*(v[0]*s+v[2]*c));
}
function aggiornaSagoma(t,gk){
  const c=t.fx,s=t.fz,J=t.giunti,S=t.sfere;
  const A=t._a,B=t._b;
  for(let i=0;i<3;i++){
    const k=TORACE[i];
    punto(A,J.hip[0]+(J.chest[0]-J.hip[0])*k,J.hip[1]+(J.chest[1]-J.hip[1])*k,J.hip[2]+(J.chest[2]-J.hip[2])*k);
    mondo(S[i].centro,A,gk,c,s);
  }
  mondo(S[3].centro,J.head,gk,c,s);S[3].centro[1]+=.03*VIS/1.45;
  let idx=4;
  for(const [da,a] of OSSA_BRACCIA){
    mondo(A,J[da],gk,c,s);mondo(B,J[a],gk,c,s);
    for(let i=0;i<5;i++){
      const u=i/4;
      punto(S[idx++].centro,A[0]+(B[0]-A[0])*u,A[1]+(B[1]-A[1])*u,A[2]+(B[2]-A[2])*u);
    }
  }
  mondo(S[24].centro,J.hR,gk,c,s);mondo(S[25].centro,J.hL,gk,c,s);
}
function disegnaTentativo(t,gk,B){
  const tempo=Math.max(0,(B.flightT||0)-t.voloInizio),n=Math.hypot(gk.fx||0,gk.fz||0);
  const c=n>1e-9?gk.fx/n:-(gk.team?.dir||1),s=n>1e-9?gk.fz/n:0;t.fx=c;t.fz=s;
  // Un'anticipazione sbagliata porta peso e braccio sul lato letto male:
  // rallentare soltanto verso il bersaglio giusto copriva ancora le quadrelle.
  // La sagoma rimane sempre un ostacolo, anche quando il portiere è spiazzato.
  // Congelare il bersaglio letto evita di invertirlo di nuovo mentre scivola.
  if(!t.riuscita&&!t.bersaglioLetto){
    const lato=-(t.bersaglio[0]-gk.x)*s+(t.bersaglio[2]-gk.z)*c;
    t.bersaglioLetto=[t.bersaglio[0]+2*lato*s,t.bersaglio[1],t.bersaglio[2]-2*lato*c];
  }
  const bersaglio=t.riuscita?t.bersaglio:t.bersaglioLetto;
  const dx=bersaglio[0]-gk.x,dz=bersaglio[2]-gk.z;
  const lz=clamp((-dx*s+dz*c)/VIS,-1.25/VIS,1.25/VIS),ly=clamp(bersaglio[1],.12,1.5)/VIS;
  // Anche una risposta fortunata richiede un tempo fisico per muovere il braccio.
  const durata=t.durataBraccio*(t.riuscita?1:1.2);
  const q=ease((tempo-t.reazione)/durata),arrivo=q*(t.riuscita?1:.45);
  const lift=t.liftInizio+(.34-t.liftInizio)*ease((tempo-t.reazione*.4)/.22);
  const lean=t.leanInizio*(1-ease(tempo/.18))+clamp(lz/.7,-1,1)*arrivo*.55,J=t.giunti;
  t.progresso=arrivo;t.lift=lift;t.lean=lean;
  punto(J.hip,-.06,Math.max(-.22/VIS,-.6+lift),lean*.05);
  punto(J.chest,.02,-.06+lift,lean*.38);punto(J.head,.05,.16+lift,lean*.44);
  punto(J.sR,J.chest[0],J.chest[1],J.chest[2]+.2);
  punto(J.sL,J.chest[0],J.chest[1],J.chest[2]-.2);
  if(t.giuntiInizio){
    const k=ease(tempo/.08);
    for(const key of ['hip','chest','head','sR','sL'])for(let i=0;i<3;i++)J[key][i]=t.giuntiInizio[key][i]+(J[key][i]-t.giuntiInizio[key][i])*k;
  }
  const due=Math.abs(lz)<.3||(ly*VIS>1&&Math.abs(lz)<.6);
  for(const [spalla,mano,gomito,lato] of CATENE_BRACCIA){
    const S=J[spalla],H=J[mano],attiva=(lato>0?lz>=0:lz<0)||due;
    const k=attiva?arrivo:0,z=lz+(due?.09*lato:0);
    const inizio=t.giuntiInizio,px=inizio?inizio[mano][0]-inizio[spalla][0]:.14,
      py=inizio?inizio[mano][1]-inizio[spalla][1]:.34,pz=inizio?inizio[mano][2]-inizio[spalla][2]:.36*lato;
    punto(H,S[0]+px+(.24-S[0]-px)*k,S[1]+py+(ly-S[1]-py)*k,S[2]+pz+(z-S[2]-pz)*k);
    braccio(S,H,J[gomito],lato);
  }
  aggiornaSagoma(t,gk);
}
function copiaSfere(da,a){
  for(let i=0;i<da.length;i++){
    const d=da[i],b=a[i];punto(b.centro,d.centro[0],d.centro[1],d.centro[2]);b.raggio=d.raggio;
  }
}
// L'IK e l'inclinazione del busto curvano il percorso: la sola distanza fra
// estremi sottostimerebbe la velocità. Una breve stima numerica al lancio allunga
// la durata finché anche quel percorso rispetta il limite, senza dipendere dai
// fotogrammi che verranno disegnati. Nel passo ordinario non c'è questa scansione.
function limitaVelocita(t,gk,B){
  const prova={...B},margine=P.velocitaMano*.95;
  for(let giro=0;giro<4;giro++){
    // Dopo questi raccordi le mani sono ferme: includere mezzo secondo anche
    // per un gesto breve diluiva i picchi dell'IK in corde di oltre 5 ms.
    const fine=Math.max(.18,t.reazione*.4+.22,t.reazione+t.durataBraccio*(t.riuscita?1:1.2)),dt=fine/96;
    prova.flightT=t.voloInizio;disegnaTentativo(t,gk,prova);
    const r=t.sfere[24].centro.slice(),l=t.sfere[25].centro.slice(),picchi=[];let massimo=0;
    for(let i=1;i<=96;i++){
      prova.flightT=t.voloInizio+i*dt;disegnaTentativo(t,gk,prova);
      let velocita=0;
      for(const [idx,prima] of [[24,r],[25,l]]){
        const v=t.sfere[idx].centro;
        velocita=Math.max(velocita,Math.hypot(v[0]-prima[0],v[1]-prima[1],v[2]-prima[2])/dt);
        punto(prima,v[0],v[1],v[2]);
      }
      massimo=Math.max(massimo,velocita);picchi.push({i,velocita});
    }
    // Raffina soltanto i tre intervalli più veloci e i loro vicini: il cambio
    // di direzione del palmo può essere più rapido della corda iniziale.
    // Al massimo 178 pose per giro, tutte al lancio e mai nel passo fisico.
    const intervalli=new Set();
    for(const {i} of picchi.sort((a,b)=>b.velocita-a.velocita).slice(0,3)){
      for(let j=Math.max(1,i-1);j<=Math.min(96,i+1);j++)intervalli.add(j);
    }
    for(const i of intervalli){
      prova.flightT=t.voloInizio+(i-1)*dt;disegnaTentativo(t,gk,prova);
      punto(r,...t.sfere[24].centro);punto(l,...t.sfere[25].centro);
      for(let j=1;j<=8;j++){
        prova.flightT=t.voloInizio+(i-1+j/8)*dt;disegnaTentativo(t,gk,prova);
        for(const [idx,prima] of [[24,r],[25,l]]){
          const v=t.sfere[idx].centro;
          massimo=Math.max(massimo,Math.hypot(v[0]-prima[0],v[1]-prima[1],v[2]-prima[2])*8/dt);
          punto(prima,v[0],v[1],v[2]);
        }
      }
    }
    t.velocitaMassimaStimata=massimo;
    if(massimo<=margine)break;
    t.durataBraccio*=massimo/margine*1.02;
  }
}

export function creaTentativoPortiere(gk,B,{probabilita,caso,time,ritardoFinta=0,precedente=null}){
  const [c,s]=orientamento(gk),vel=(B.vx||0)*c+(B.vz||0)*s;
  const distanza=(gk.x+c*.35-B.x)*c+(gk.z+s*.35-B.z)*s;
  const residuo=vel<-.001?clamp(distanza/vel,.001,1.5):.25;
  const rif=clamp((pesata(gk.s?.rif??70)-40)/59,0,1),stamina=clamp(gk.stamina??1,0,1);
  const valido=precedente?.attiva&&precedente.gid===gk.uid&&precedente.num===gk.num&&precedente.scheda===gk.scheda&&
    time>=precedente.time&&time-precedente.time<=.5;
  const t={gid:gk.uid,num:gk.num,scheda:gk.scheda,attiva:true,time,timeInizio:time,tempoVolo:Math.max(0,B.flightT||0),
    probabilita:clamp(Number.isFinite(probabilita)?probabilita:0,0,1),riuscita:caso<clamp(Number.isFinite(probabilita)?probabilita:0,0,1),
    arrivoStimato:Math.max(0,B.flightT||0)+residuo,
    reazione:P.reazioneMin+P.reazioneRiflessi*(1-rif)+P.reazioneStanchezza*(1-stamina)+clamp(ritardoFinta,0,.15),
    durataBraccio:P.durataMinima,
    liftInizio:valido?precedente.lift:.18,leanInizio:valido?precedente.lean:0,
    giuntiInizio:valido?copiaGiunti(precedente.giunti):null,
    bersaglio:[B.x+(B.vx||0)*residuo,B.y+(B.vy||0)*residuo-G*.5*residuo*residuo,B.z+(B.vz||0)*residuo],
    giunti:Object.fromEntries(GIUNTI.map(k=>[k,nuovoVettore()])),sfere:nuoveSfere(),sferePrima:nuoveSfere(),_a:nuovoVettore(),_b:nuovoVettore()};
  Object.defineProperty(t,'voloInizio',{value:Math.max(0,B.flightT||0),enumerable:true});
  // La durata dipende dalla strada da percorrere e dalla velocità massima,
  // mai dal poco tempo rimasto prima dell'arrivo del pallone.
  disegnaTentativo(t,gk,{...B,flightT:t.voloInizio});
  if(!t.giuntiInizio)t.giuntiInizio=copiaGiunti(t.giunti);
  const mani=[t.giunti.hR.slice(),t.giunti.hL.slice()],riuscita=t.riuscita;
  t.riuscita=true;disegnaTentativo(t,gk,{...B,flightT:t.voloInizio+10});
  const strada=Math.max(...['hR','hL'].map((k,i)=>Math.hypot(...t.giunti[k].map((v,j)=>v-mani[i][j]))))*VIS;
  t.durataBraccio=Math.max(P.durataMinima,1.5*strada/P.velocitaMano);t.riuscita=riuscita;
  limitaVelocita(t,gk,B);
  disegnaTentativo(t,gk,B);copiaSfere(t.sfere,t.sferePrima);return t;
}

export function concludiTentativoPortiere(t,time){
  if(!t?.attiva)return false;
  if(t.fine!==undefined)return true;
  t.fine=time;t.giuntiFine=copiaGiunti(t.giunti);t.liftFine=t.lift;t.leanFine=t.lean;t.progressoFine=t.progresso;return true;
}
function disegnaRecupero(t,gk,time){
  const elapsed=Math.max(0,time-t.fine),finito=elapsed>=P.recupero-1e-8,k=finito?1:ease(elapsed/P.recupero),J=t.giunti;
  const n=Math.hypot(gk.fx||0,gk.fz||0);
  t.fx=n>1e-9?gk.fx/n:-(gk.team?.dir||1);t.fz=n>1e-9?gk.fz/n:0;
  for(const key of Object.keys(PRONTO))for(let i=0;i<3;i++)J[key][i]=t.giuntiFine[key][i]+(PRONTO[key][i]-t.giuntiFine[key][i])*k;
  braccio(J.sR,J.hR,J.eR,1);braccio(J.sL,J.hL,J.eL,-1);
  t.lift=t.liftFine+(.1-t.liftFine)*k;t.lean=t.leanFine*(1-k);t.progresso=t.progressoFine*(1-k);
  aggiornaSagoma(t,gk);if(finito)t.attiva=false;
}

// Chiamare una volta per passo fisico DOPO l'avanzamento della palla. Le sfere
// precedenti conservano anche il movimento del portiere fra due fotogrammi.
export function avanzaTentativoPortiere(t,gk,B,time){
  const volo=Math.max(0,B.flightT||0);
  if(!t.attiva||gk.excluded||gk.uid!==t.gid||gk.num!==t.num||gk.scheda!==t.scheda||time<t.time-1e-8||
    t.fine===undefined&&volo<t.tempoVolo-1e-8){t.attiva=false;return false;}
  copiaSfere(t.sfere,t.sferePrima);
  if(t.fine!==undefined)disegnaRecupero(t,gk,time);else disegnaTentativo(t,gk,B);
  t.time=time;t.tempoVolo=volo;return true;
}
