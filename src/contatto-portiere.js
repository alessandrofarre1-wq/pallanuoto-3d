// Sweep continuo della palla contro sfere del portiere, in coordinate del mondo.
// Nessun renderer, stato della partita o sorteggio: conta il contatto effettivo.
const EPS=1e-10;
const entro=t=>Math.max(0,Math.min(1,t));

function radiceEntrante(t,A,B,tol){
  if(!Number.isFinite(t)||t< -EPS||t>1+EPS)return Infinity;
  const u=entro(t),derivata=2*A*u+B;
  // Un contatto già lasciato, o tangente all'inizio, non rimbalza una seconda volta.
  if(u<=EPS&&B>=-tol)return Infinity;
  return derivata<=tol?u:Infinity;
}

function tempoContatto(dx,dy,dz,vx,vy,vz,r,vr){
  // |D+tV|² = (r+t·vr)²: anche una sfera che si sposta può incontrare la palla.
  const A=vx*vx+vy*vy+vz*vz-vr*vr;
  const B=2*(dx*vx+dy*vy+dz*vz-r*vr);
  const C=dx*dx+dy*dy+dz*dz-r*r;
  const tol=EPS*Math.max(1,Math.abs(A),Math.abs(B),Math.abs(C));
  if(C<=tol&&(B< -tol||Math.abs(B)<=tol&&A< -tol))return 0;
  if(Math.abs(A)<=tol)return Math.abs(B)>tol?radiceEntrante(-C/B,A,B,tol):Infinity;
  let disc=B*B-4*A*C;
  const tolDisc=EPS*Math.max(1,B*B,Math.abs(4*A*C));
  if(disc< -tolDisc)return Infinity;
  disc=Math.sqrt(Math.max(0,disc));
  const q=-.5*(B+(B<0?-disc:disc));
  if(Math.abs(q)<=tol)return radiceEntrante(-B/(2*A),A,B,tol);
  return Math.min(radiceEntrante(q/A,A,B,tol),radiceEntrante(C/q,A,B,tol));
}

// Sfere: [{centro:[x,y,z],raggio,parte}]; lo stesso indice identifica la stessa
// parte nei due istanti. Una sfera nuova parte dal suo centro corrente; una
// rimossa non collabora alla collisione. Il raggio può variare linearmente.
// punto è il CENTRO della palla all'impatto; normale va dalla sfera alla palla.
export function contattoPortiere(da,a,raggio,sferePrima=[],sfereDopo=sferePrima){
  const bx=a[0]-da[0],by=a[1]-da[1],bz=a[2]-da[2],rb=Math.max(0,raggio);
  let primo=Infinity,indice=-1;
  for(let i=0;i<sfereDopo.length;i++){
    const s1=sfereDopo[i];if(!s1)continue;
    const s0=sferePrima[i]||s1,c0=s0.centro,c1=s1.centro;
    const r0=Math.max(0,s0.raggio),r1=Math.max(0,s1.raggio);
    const t=tempoContatto(da[0]-c0[0],da[1]-c0[1],da[2]-c0[2],
      bx-c1[0]+c0[0],by-c1[1]+c0[1],bz-c1[2]+c0[2],rb+r0,r1-r0);
    // Gli indici decidono soltanto una parità numerica, non anticipano un urto.
    if(t<primo-EPS){primo=t;indice=i;}
  }
  if(indice<0)return null;
  const s1=sfereDopo[indice],s0=sferePrima[indice]||s1,c0=s0.centro,c1=s1.centro;
  const punto=[da[0]+bx*primo,da[1]+by*primo,da[2]+bz*primo];
  let nx=punto[0]-c0[0]-(c1[0]-c0[0])*primo;
  let ny=punto[1]-c0[1]-(c1[1]-c0[1])*primo;
  let nz=punto[2]-c0[2]-(c1[2]-c0[2])*primo;
  let n=Math.hypot(nx,ny,nz);
  if(n<=EPS){
    nx=-(bx-c1[0]+c0[0]);ny=-(by-c1[1]+c0[1]);nz=-(bz-c1[2]+c0[2]);n=Math.hypot(nx,ny,nz);
    if(n<=EPS){nx=1;ny=0;nz=0;n=1;}
  }
  return {t:primo,punto,normale:[nx/n,ny/n,nz/n],parte:s1.parte||s0.parte,indice};
}
