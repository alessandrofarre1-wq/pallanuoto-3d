// Lettura geometrica del duello: FIN, Dentro la pallanuoto, PDF pp. 23–37 e 42–50.
// I numeri di campo restano quelli del gioco; non sono numeri di cuffia.
import { HW, MARK, clamp } from './costanti.js';
import { ball, game, goalX, other } from './stato.js';

export const difensoreCentro = boa => other(boa.team).players.find(p=>MARK[p.i]===1&&!p.excluded&&!p.uscendo);
const unita = (x,z) => { const l=Math.hypot(x,z)||1; return {x:x/l,z:z/l}; };
const differenza = a => Math.atan2(Math.sin(a),Math.cos(a));

export function leggiCentro(boa,def,portatore=ball){
  if(!def||def.excluded||def.uscendo||Math.hypot(def.x-boa.x,def.z-boa.z)>1.8)
    return {tipo:'libero',ricevibile:true,apertura:1,vantaggio:1,lato:0,spalle:false};
  const g=unita(goalX(boa.team)-boa.x,-boa.z),dx=def.x-boa.x,dz=def.z-boa.z,r=Math.hypot(dx,dz)||0.001;
  // Se ha già palla il riferimento è il perimetro, opposto alla porta.
  const sx=portatore===boa||Math.hypot(portatore.x-boa.x,portatore.z-boa.z)<0.1?-g.x:portatore.x-boa.x;
  const sz=portatore===boa||Math.hypot(portatore.x-boa.x,portatore.z-boa.z)<0.1?-g.z:portatore.z-boa.z;
  const s=unita(sx,sz),fronte=(dx*s.x+dz*s.z)/r,porta=(dx*g.x+dz*g.z)/r;
  const lungo=dx*s.x+dz*s.z,laterale=Math.abs(dx*s.z-dz*s.x);
  const chiude=lungo>0&&lungo<Math.hypot(sx,sz)&&laterale<0.56;
  const apertura=clamp(1-Math.max(0,fronte)*clamp((1.8-r)/0.9,0,1),0,1);
  const tipo=fronte>0.5?'anticipo':porta>0.45?'dietro':'lato';
  return {tipo,ricevibile:!chiude&&apertura>0.28,apertura,
    vantaggio:clamp(apertura*1.5-0.7+porta*0.25,-1,1),
    lato:Math.sign(-g.z*dx+g.x*dz),spalle:porta>0.45&&r<1.65};
}

export function centroTarget(boa){
  const gx=goalX(boa.team),dir=boa.team.dir,base=boa.team.schema?.attacco?.[0]||[2.6,0];
  const def=difensoreCentro(boa),lettura=leggiCentro(boa,def),lato=lettura.lato||Math.sign(ball.z*dir)||(boa.mano==='S'?-1:1);
  let d=base[0],z=base[1];
  const duello=d<=5&&Math.abs(z)<=3.2&&Math.abs(gx-boa.x)<5.2;
  if(duello&&lettura.tipo==='anticipo'){ d=Math.max(d,3.5);z-=lato*0.85; }
  else if(duello&&lettura.tipo==='lato') z-=lato*0.65;
  // La base può essere editata; l'adattamento al marcatore resta entro lo spazio del centro.
  return {x:gx-dir*clamp(d,0.5,10),z:clamp(z*dir,-HW+0.5,HW-0.5)};
}

export function anticipoTarget(def,boa){
  const g=unita(goalX(boa.team)-boa.x,-boa.z),anticipo=def.team.defPlay===2||def.team.defPlay===3;
  const s=anticipo&&ball.holder!==boa?unita(ball.x-boa.x,ball.z-boa.z):g;
  const dx=def.x-boa.x,dz=def.z-boa.z,r=Math.hypot(dx,dz),a=r>0.05?Math.atan2(dz,dx):Math.atan2(g.z,g.x);
  const dest=Math.atan2(s.z,s.x),delta=differenza(dest-a);
  // Waypoint sull'arco: una destinazione opposta non passa attraverso il corpo del boa.
  const verso=Math.abs(Math.abs(delta)-Math.PI)<0.05?(def.uid%2?1:-1):Math.sign(delta);
  const ang=a+verso*Math.min(Math.abs(delta),0.5),rag=0.96;
  return {x:boa.x+Math.cos(ang)*rag,z:boa.z+Math.sin(ang)*rag,sprint:r>1.8};
}

export function avviaGirata(boa,def){
  if(boa.girata||ball.holder!==boa||boa.act||boa.freeThrow||boa.pressatoUntil>game.time||boa.stunUntil>game.time||!def||def.excluded) return false;
  if(Math.hypot(def.x-boa.x,def.z-boa.z)>1.6) return false;
  const g=unita(goalX(boa.team)-boa.x,-boa.z),dx=boa.x-def.x,dz=boa.z-def.z;
  const lato=Math.sign(-g.z*dx+g.x*dz)||(boa.mano==='S'?-1:1);
  boa.girata={def,inizio:game.time,possT:game.possT,verso:-lato,aperta:false};
  return true;
}

// Restituisce un obiettivo di nuoto; non modifica mai direttamente x/z o l'orientamento.
export function passoGirata(boa){
  const giro=boa.girata;if(!giro) return null;
  const def=giro.def;
  if(ball.holder!==boa||game.possTeam!==boa.team||giro.possT!==game.possT||game.time<giro.inizio||
    game.time-giro.inizio>2.4||boa.pressatoUntil>game.time||boa.stunUntil>game.time||def.excluded||boa.excluded||boa.uscendo||game.state!=='play'){
    boa.girata=null;return null;
  }
  const g=unita(goalX(boa.team)-boa.x,-boa.z),dx=boa.x-def.x,dz=boa.z-def.z,r=Math.hypot(dx,dz)||0.001;
  const superato=(dx*g.x+dz*g.z)/r;
  const spazioTiro=Math.abs(dx*g.z-dz*g.x);
  if(superato>0.22||(superato>-.35&&spazioTiro>.8)){
    giro.aperta=true;boa.girata=null;boa.turnedUntil=game.time+1.1;
    return null;
  }
  const a=Math.atan2(dz,dx)+giro.verso*0.45;
  return {x:def.x+Math.cos(a)*1.02,z:def.z+Math.sin(a)*1.02};
}
