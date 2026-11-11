// Fisica della palla. Il motore Rapier muove la palla e calcola gli urti veri (pali, traversa, rete, corpi);
// qui si aggiungono le forze che Rapier non conosce: resistenza dell'aria, effetto (palla che gira), acqua
// (schizzo sui tiri tesi, tonfo, galleggiamento, attrito). Le regole (gol, fuori, parate) restano in fisica.js.
import RAPIER from '@dimforge/rapier3d-compat';
import { BRV, G, GH, GW, HL } from './costanti.js';

await RAPIER.init();

export const RAGGIO=0.12;            // raggio della palla per gli urti (una palla vera misura circa 11 cm)
export const QUOTA_GALLEGGIA=0.05;   // altezza del centro quando la palla galleggia ferma (un terzo sott'acqua)
// resistenza dell'aria, tarata sulle misure della tesi Patumi (PoliTo 2018): la palla lascia la mano a 13,3 m/s
// e arriva in porta, 5 metri dopo, a 12,2 m/s (perde circa l'8%)
const ARIA=0.0245;
const EFFETTO=0.0045;                // spinta laterale/verticale di una palla che gira (effetto Magnus)

const mondo=new RAPIER.World({x:0,y:-G,z:0});
const eventi=new RAPIER.EventQueue(true);
const corpoPalla=mondo.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setCcdEnabled(true).setCanSleep(false).setAngularDamping(0.4));
const urtoPalla=mondo.createCollider(RAPIER.ColliderDesc.ball(RAGGIO).setMass(0.43).setRestitution(0.6).setFriction(0.5)
  .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),corpoPalla);

// ---------- porte: pali, traversa e rete ----------
const cosa=new Map();                // per ogni pezzo: che cos'è (palo, traversa, rete, giocatore)
const fisso=(desc,tipo)=>{ const c=mondo.createCollider(desc); cosa.set(c.handle,tipo); return c; };
const PALO=0.04, PROF=0.8;
for(const s of [1,-1]){
  const x=s*HL, alto=GH+PALO;
  for(const z of [-GW-PALO,GW+PALO])
    fisso(RAPIER.ColliderDesc.capsule((alto+0.3)/2,PALO).setTranslation(x,(alto-0.3)/2,z).setRestitution(0.62).setFriction(0.3),'palo');
  fisso(RAPIER.ColliderDesc.capsule(GW+PALO,PALO).setTranslation(x,alto,0).setRotation({x:Math.SQRT1_2,y:0,z:0,w:Math.SQRT1_2}).setRestitution(0.62).setFriction(0.3),'traversa');
  // rete: fondo, tetto e fianchi; trattiene la palla quasi senza rimbalzo
  const rete=d=>fisso(d.setRestitution(0.02).setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min).setFriction(1),'rete');
  rete(RAPIER.ColliderDesc.cuboid(0.03,(alto+0.3)/2,GW+PALO).setTranslation(x+s*PROF,(alto-0.3)/2,0));
  rete(RAPIER.ColliderDesc.cuboid(PROF/2,0.03,GW+PALO).setTranslation(x+s*PROF/2,alto+0.02,0));
  for(const z of [-GW-PALO*2,GW+PALO*2]) rete(RAPIER.ColliderDesc.cuboid(PROF/2-0.06,(alto+0.3)/2,0.03).setTranslation(x+s*(PROF/2+0.06),(alto-0.3)/2,z));
}

// ---------- corpi dei giocatori: testa e spalle fuori dall'acqua fanno rimbalzare la palla vagante ----------
const corpi=[];
function creaCorpiGiocatori(n){
  for(let i=corpi.length;i<n;i++){
    const b=mondo.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0,-50,0));
    const c=mondo.createCollider(RAPIER.ColliderDesc.ball(0.2).setRestitution(0.35).setFriction(0.4),b);
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
  const n=Math.max(4,Math.round(t*60)), dt=t/n, w=[0,0,0];
  for(let giro=0;giro<5;giro++){
    rotazioneDiLancio(vx,vz,giri,w);
    let px=x,py=y,pz=z, ux=vx,uy=vy,uz=vz;
    for(let i=0;i<n;i++){ aria(ux,uy,uz,w[0],w[1],w[2],_a); ux+=_a[0]*dt; uy+=(_a[1]-G)*dt; uz+=_a[2]*dt; px+=ux*dt; py+=uy*dt; pz+=uz*dt; }
    vx+=(tx-px)/t; vy+=(ty-py)/t; vz+=(tz-pz)/t;
  }
  rotazioneDiLancio(vx,vz,giri,w);
  return { vx,vy,vz, wx:w[0],wy:w[1],wz:w[2] };
}
// rotazione all'indietro (la palla "tiene" in aria), attorno all'asse orizzontale perpendicolare al tiro
function rotazioneDiLancio(vx,vz,giri,out){ const l=Math.hypot(vx,vz)||1; out[0]=-vz/l*giri; out[1]=0; out[2]=vx/l*giri; }

// ---------- un passo di simulazione ----------
// B = stato della palla (x,y,z,vx,vy,vz,wx,wy,wz); giocatori = elenco di {x,z,attivo}; restituisce cosa è successo
const esito={ urti:[], acqua:null };
export function passoPalla(B,dt,giocatori){
  esito.urti.length=0; esito.acqua=null;
  // corpi dei giocatori
  if(giocatori&&corpi.length<giocatori.length) creaCorpiGiocatori(giocatori.length);
  if(giocatori) for(let i=0;i<corpi.length;i++){ const g=giocatori[i], k=corpi[i], on=!!(g&&g.attivo);
    if(on!==k.attivo){ k.c.setEnabled(on); k.attivo=on; }
    if(on) k.b.setNextKinematicTranslation({x:g.x,y:0.12,z:g.z}); }
  // aria ed effetto (in aria) oppure acqua (a contatto con la superficie)
  let vx=B.vx, vy=B.vy, vz=B.vz, wx=B.wx||0, wy=B.wy||0, wz=B.wz||0;
  const inAcqua=B.y<BRV;
  if(!inAcqua){ aria(vx,vy,vz,wx,wy,wz,_a); vx+=_a[0]*dt; vy+=_a[1]*dt; vz+=_a[2]*dt; }
  else {
    // spinta di galleggiamento (equilibrio a QUOTA_GALLEGGIA) e attrito dell'acqua
    const immersa=Math.min(2.5,(BRV-B.y)/(BRV-QUOTA_GALLEGGIA));
    vy+=G*immersa*dt;
    const fo=Math.exp(-1.6*dt), fv=Math.exp(-7*dt), fr=Math.exp(-3*dt);
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
    if(vo>8.5 && angolo<21){
      B.y=BRV+0.005; B.vy=-B.vy*0.55; B.vx*=0.84; B.vz*=0.84; B.wx*=0.5; B.wz*=0.5;
      esito.acqua={ tipo:'schizzo', forza };
    } else {
      B.vx*=0.45; B.vz*=0.45; B.vy*=0.35;
      esito.acqua={ tipo:'tonfo', forza };
    }
  }
  return esito;
}
