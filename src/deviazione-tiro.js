// Urto obliquo: perde soprattutto la componente normale, conservando quella
// tangente. Un muro sfiorato può quindi lasciare la palla diretta verso la porta.
export function velocitaDeviata(v,n,restituzione=.3,attrito=.06){
  const l=Math.hypot(n[0],n[1],n[2])||1;
  let nx=n[0]/l,ny=n[1]/l,nz=n[2]/l,d=v[0]*nx+v[1]*ny+v[2]*nz;
  if(d>0){nx=-nx;ny=-ny;nz=-nz;d=-d;}
  const t=1-attrito;
  return [(v[0]-d*nx)*t-restituzione*d*nx,
    (v[1]-d*ny)*t-restituzione*d*ny,(v[2]-d*nz)*t-restituzione*d*nz];
}
