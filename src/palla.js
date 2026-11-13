// Fisica della palla. Il motore Rapier muove la palla e calcola gli urti veri (pali, traversa, rete, corpi);
// qui si aggiungono le forze che Rapier non conosce: resistenza dell'aria, effetto (palla che gira), acqua
// (schizzo sui tiri tesi, tonfo, galleggiamento, attrito). Le regole (gol, fuori, parate) restano in fisica.js.
import RAPIER from '@dimforge/rapier3d-compat';
import { BRV, G, GH, GW, HL } from './costanti.js';
import { P } from './fisica-palla/parametri.js';

await RAPIER.init();

// Tutti i numeri stanno in fisica-palla/parametri.js, con unità, fonte e intervallo.
export const RAGGIO=P.raggioUrti;           // raggio della palla per gli urti (una palla vera misura circa 11 cm)
export const QUOTA_GALLEGGIA=P.quotaGalleggia;   // altezza del centro quando la palla galleggia ferma
const MASSA=P.massa, SEZIONE=Math.PI*RAGGIO*RAGGIO;
const INERZIA=P.inerzia*MASSA*RAGGIO*RAGGIO;      // palla cava: più vicina a un guscio (2/3·m·a²) che a una sfera piena
// resistenza dell'aria: Cd dalla tesi Patumi (PoliTo 2018), la palla lascia la mano a 13,3 m/s e 5 metri dopo va a 12,2
const ARIA=P.densitaAria*P.cdAria*SEZIONE/(2*MASSA);
// effetto Magnus: CL = cMagnus·S (S = aω/v), quindi accelerazione = EFFETTO·(ω×v)
const EFFETTO=P.densitaAria*SEZIONE*RAGGIO*P.cMagnus/(2*MASSA);
const PASSO=P.passoMax;                     // passo massimo del calcolo (più passi per fotogramma)

const mondo=new RAPIER.World({x:0,y:-G,z:0});
const eventi=new RAPIER.EventQueue(true);
const corpoPalla=mondo.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setCcdEnabled(true).setCanSleep(false).setAngularDamping(P.smorzaRotAria));
corpoPalla.setAdditionalMassProperties(MASSA,{x:0,y:0,z:0},{x:INERZIA,y:INERZIA,z:INERZIA},{w:1,x:0,y:0,z:0},true);
const urtoPalla=mondo.createCollider(RAPIER.ColliderDesc.ball(RAGGIO).setDensity(0).setRestitution(P.rimbalzo).setFriction(P.attrito)
  .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),corpoPalla);

// ---------- porte: pali, traversa e rete ----------
const cosa=new Map();                // per ogni pezzo: che cos'è (palo, traversa, rete, giocatore)
const fisso=(desc,tipo)=>{ const c=mondo.createCollider(desc); cosa.set(c.handle,tipo); return c; };
const PALO=P.raggioPalo, PROF=P.profRete;
for(const s of [1,-1]){
  const x=s*HL, alto=GH+PALO;
  for(const z of [-GW-PALO,GW+PALO])
    fisso(RAPIER.ColliderDesc.capsule((alto+0.3)/2,PALO).setTranslation(x,(alto-0.3)/2,z).setRestitution(P.rimbalzoPalo).setFriction(P.attritoPalo),'palo');
  fisso(RAPIER.ColliderDesc.capsule(GW+PALO,PALO).setTranslation(x,alto,0).setRotation({x:Math.SQRT1_2,y:0,z:0,w:Math.SQRT1_2}).setRestitution(P.rimbalzoPalo).setFriction(P.attritoPalo),'traversa');
  // rete: fondo, tetto e fianchi; trattiene la palla quasi senza rimbalzo
  const rete=d=>fisso(d.setRestitution(P.rimbalzoRete).setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min).setFriction(1),'rete');
  rete(RAPIER.ColliderDesc.cuboid(0.03,(alto+0.3)/2,GW+PALO).setTranslation(x+s*PROF,(alto-0.3)/2,0));
  rete(RAPIER.ColliderDesc.cuboid(PROF/2,0.03,GW+PALO).setTranslation(x+s*PROF/2,alto+0.02,0));
  for(const z of [-GW-PALO*2,GW+PALO*2]) rete(RAPIER.ColliderDesc.cuboid(PROF/2-0.06,(alto+0.3)/2,0.03).setTranslation(x+s*(PROF/2+0.06),(alto-0.3)/2,z));
}

// ---------- corpi dei giocatori: testa e spalle fuori dall'acqua fanno rimbalzare la palla vagante ----------
const corpi=[];
function creaCorpiGiocatori(n){
  for(let i=corpi.length;i<n;i++){
    const b=mondo.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0,-50,0));
    const c=mondo.createCollider(RAPIER.ColliderDesc.ball(P.raggioCorpo).setRestitution(P.rimbalzoCorpo).setFriction(P.attritoCorpo),b);
    cosa.set(c.handle,'giocatore'); corpi.push({b,c,attivo:true});
  }
}

// ---------- forze dell'aria (usate sia nel volo vero sia nel calcolo della mira) ----------
// v = velocità, w = rotazione (giri: radianti al secondo attorno a x, y, z); restituisce l'accelerazione, gravità esclusa
function aria(vx,vy,vz,wx,wy,wz,out){
  const v=Math.hypot(vx,vy,vz);
  out[0]=-ARIA*v*vx+EFFETTO*(wy*vz-wz*vy);
  out[1]=-ARIA*v*vy+EFFETTO*(wz*vx-wx*vz);
  out[2]=-ARIA*v*vz+EFFETTO*(wx*vy-wy*vx);
}
const _a=[0,0,0];
// Con quale velocità deve partire la palla da (x,y,z) per arrivare in (tx,ty,tz) dopo t secondi, tenendo conto di
// gravità, aria ed effetto? Si parte dalla formula senza aria e si corregge provando il volo qualche volta.
export function velocitaDiLancio(x,y,z,tx,ty,tz,t,giri){
  let vx=(tx-x)/t, vz=(tz-z)/t, vy=(ty-y+0.5*G*t*t)/t;
  const n=Math.max(4,Math.ceil(t/PASSO)), dt=t/n, w=[0,0,0];
  for(let giro=0;giro<5;giro++){
    rotazioneDiLancio(vx,vz,giri,w);
    let px=x,py=y,pz=z, ux=vx,uy=vy,uz=vz;
    const cala=1/(1+dt*P.smorzaRotAria);      // la rotazione cala come nel volo vero (smorzamento di Rapier)
    let wx=w[0], wz=w[2];
    for(let i=0;i<n;i++){ aria(ux,uy,uz,wx,0,wz,_a); ux+=_a[0]*dt; uy+=(_a[1]-G)*dt; uz+=_a[2]*dt; px+=ux*dt; py+=uy*dt; pz+=uz*dt; wx*=cala; wz*=cala; }
    vx+=(tx-px)/t; vy+=(ty-py)/t; vz+=(tz-pz)/t;
  }
  rotazioneDiLancio(vx,vz,giri,w);
  return { vx,vy,vz, wx:w[0],wy:w[1],wz:w[2] };
}
// rotazione all'indietro (la palla "tiene" in aria), attorno all'asse orizzontale perpendicolare al tiro
function rotazioneDiLancio(vx,vz,giri,out){ const l=Math.hypot(vx,vz)||1; out[0]=-vz/l*giri; out[1]=0; out[2]=vx/l*giri; }

// ---------- diagnosi (pannello ?fisica e test): solo lettura, non cambia nulla del moto ----------
// h = quanto affonda il punto più basso (con il raggio degli urti); volume immerso = calotta sferica (de Mestre 2004)
export const diagnosi={ y:0, v:0, w:0, h:0, volume:0, inAcqua:false, aGalleggia:0, freni:[0,0,0],
  impatto:{ n:0, tipo:'', angolo:0, vOrizz:0, vVert:0, prima:0, dopo:0, rot:0 } };
// energia meccanica (cinetica + rotazione + posizione rispetto al pelo dell'acqua), in joule
export const energia=B=>0.5*MASSA*(B.vx*B.vx+B.vy*B.vy+B.vz*B.vz)+0.5*INERZIA*((B.wx||0)**2+(B.wy||0)**2+(B.wz||0)**2)+MASSA*G*B.y;
function aggiornaDiagnosi(B,inAcqua,aGalleggia,fo,fv,fr){
  const D=diagnosi, r=RAGGIO, h=Math.min(2*r,Math.max(0,r-B.y));
  D.y=B.y; D.v=Math.hypot(B.vx,B.vy,B.vz); D.w=Math.hypot(B.wx,B.wy,B.wz); D.h=h; D.volume=Math.PI*h*h*(3*r-h)/3;
  D.inAcqua=inAcqua; D.aGalleggia=aGalleggia; D.freni[0]=fo; D.freni[1]=fv; D.freni[2]=fr;
}

// ---------- un passo di simulazione ----------
// B = stato della palla (x,y,z,vx,vy,vz,wx,wy,wz); giocatori = elenco di {x,z,attivo}; restituisce cosa è successo
const esito={ urti:[], acqua:null };
// il gioco chiama una volta per fotogramma; qui il fotogramma si divide in passi di al massimo PASSO secondi
export function passoPalla(B,dt,giocatori){
  esito.urti.length=0; esito.acqua=null;
  const n=Math.max(1,Math.ceil(dt/PASSO-1e-9)), h=dt/n;
  for(let i=0;i<n;i++) passoSingolo(B,h,giocatori,i===0);
  return esito;
}
function passoSingolo(B,dt,giocatori,primo){
  // corpi dei giocatori
  if(giocatori&&corpi.length<giocatori.length) creaCorpiGiocatori(giocatori.length);
  if(giocatori&&primo) for(let i=0;i<corpi.length;i++){ const g=giocatori[i], k=corpi[i], on=!!(g&&g.attivo);
    if(on!==k.attivo){ k.c.setEnabled(on); k.attivo=on; }
    if(on) k.b.setNextKinematicTranslation({x:g.x,y:P.quotaCorpo,z:g.z}); }
  // aria ed effetto (in aria) oppure acqua (a contatto con la superficie)
  let vx=B.vx, vy=B.vy, vz=B.vz, wx=B.wx||0, wy=B.wy||0, wz=B.wz||0;
  const inAcqua=B.y<BRV;
  let aGalleggia=0, fo=1, fv=1, fr=1;
  if(!inAcqua){ aria(vx,vy,vz,wx,wy,wz,_a); vx+=_a[0]*dt; vy+=_a[1]*dt; vz+=_a[2]*dt; }
  else {
    // spinta di galleggiamento (equilibrio a QUOTA_GALLEGGIA) e attrito dell'acqua
    const immersa=Math.min(P.spintaMax,(BRV-B.y)/(BRV-QUOTA_GALLEGGIA));
    aGalleggia=G*immersa; vy+=aGalleggia*dt;
    fo=Math.exp(-P.frenoOrizz*dt); fv=Math.exp(-P.frenoVert*dt); fr=Math.exp(-P.frenoRot*dt);
    vx*=fo; vz*=fo; vy*=fv; wx*=fr; wy*=fr; wz*=fr;
  }
  corpoPalla.setTranslation({x:B.x,y:B.y,z:B.z},true); corpoPalla.setLinvel({x:vx,y:vy,z:vz},true); corpoPalla.setAngvel({x:wx,y:wy,z:wz},true);
  mondo.timestep=dt; mondo.step(eventi);
  const p=corpoPalla.translation(), v=corpoPalla.linvel(), w=corpoPalla.angvel();
  const yPrima=B.y;
  B.x=p.x; B.y=p.y; B.z=p.z; B.vx=v.x; B.vy=v.y; B.vz=v.z; B.wx=w.x; B.wy=w.y; B.wz=w.z;
  eventi.drainCollisionEvents((h1,h2,inizia)=>{ if(!inizia) return; const altro=h1===urtoPalla.handle?h2:h1; esito.urti.push(cosa.get(altro)||'altro'); });
  // arrivo sull'acqua dall'aria: schizzo (la palla tesa e veloce rimbalza) oppure tonfo
  if(yPrima>=BRV && B.y<BRV && B.vy<0){
    const vo=Math.hypot(B.vx,B.vz), angolo=Math.atan2(-B.vy,vo)*57.3, forza=Math.hypot(vo,B.vy);
    const I=diagnosi.impatto, prima=energia(B); I.angolo=angolo; I.vOrizz=vo; I.vVert=-B.vy; I.rot=Math.hypot(B.wx,B.wy,B.wz);
    if(vo>P.schizzoVelMin && angolo<P.schizzoAngMax){
      B.y=BRV+0.005; B.vy=-B.vy*P.schizzoVert; B.vx*=P.schizzoOrizz; B.vz*=P.schizzoOrizz; B.wx*=P.schizzoRot; B.wz*=P.schizzoRot;
      if(!esito.acqua) esito.acqua={ tipo:'schizzo', forza };
    } else {
      B.vx*=P.tonfoOrizz; B.vz*=P.tonfoOrizz; B.vy*=P.tonfoVert;
      if(!esito.acqua) esito.acqua={ tipo:'tonfo', forza };
    }
    I.n++; I.tipo=esito.acqua.tipo; I.prima=prima; I.dopo=energia(B);
  }
  aggiornaDiagnosi(B,inAcqua,aGalleggia,fo,fv,fr);
}
