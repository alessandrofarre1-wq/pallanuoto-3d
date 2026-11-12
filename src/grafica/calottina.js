// Calottina da pallanuoto: forma (dal profilo del cranio misurato sul modello) e disegno (colore, numero, paraorecchie).
// Modulo senza dipendenze dal gioco: lo usano il gioco (corpo.js) e gli strumenti che fanno i render dei modelli.
import * as THREE from 'three';
// ---------- calottina ----------
// Oggetto a sé, più grande della testa: guscio colorato con bordo bianco e numero su lati e nuca, paraorecchie rigidi
// con i fori, laccetti annodati sotto il mento. Un solo oggetto con una sola immagine, attaccato all'osso della testa.
export function disegnaCalottina(tex,num,colore,paraorecchie,testo,grande){
  const c=tex.image, x=c.getContext('2d'), w=c.width, h=c.height, yBordo=h*0.74;
  x.fillStyle=colore; x.fillRect(0,0,w,yBordo);
  // cuciture a spicchi e bordo bianco
  x.strokeStyle='rgba(0,0,0,.16)'; x.lineWidth=1.5; for(let i=0;i<6;i++){ x.beginPath(); x.moveTo((i+0.5)/6*w,0); x.lineTo((i+0.5)/6*w,yBordo); x.stroke(); }
  x.fillStyle='#f4f4f0'; x.fillRect(0,yBordo-h*0.05,w,h*0.05+1);
  x.fillStyle=testo; x.font=`bold ${Math.round(h*(grande?0.46:0.3))}px sans-serif`; x.textAlign='center'; x.textBaseline='middle';
  for(const u of [0.25,0.5,0.75]) x.fillText(String(num),u*w,h*0.4);                 // lati e nuca
  // riquadro dei paraorecchie (in basso a sinistra): plastica con fori; riquadro dei laccetti (in basso a destra): bianco
  x.fillStyle=paraorecchie; x.fillRect(0,yBordo,w/2,h-yBordo);
  x.fillStyle='rgba(20,20,25,.75)'; const cx=w/4, cy=(yBordo+h)/2, r=(h-yBordo)*0.36;
  for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0.5,0.87],[-0.5,0.87],[0.5,-0.87],[-0.5,-0.87]]){ x.beginPath(); x.arc(cx+dx*r*0.72,cy+dy*r*0.72,r*0.2,0,7); x.fill(); }
  x.fillStyle='#f4f4f0'; x.fillRect(w/2,yBordo,w/2,h-yBordo);
  tex.needsUpdate=true;
}
// T = misure della testa (misure.json): centro, raggi, profilo del cranio, orecchio, mento
// opz.paraorecchie = quanto ingrandire i paraorecchie (1 = misura vera; nel personaggio cartoon sono più grandi e sporgenti)
export function calottinaGeo(T,opz={}){
  const PO=opz.paraorecchie||1;
  const [cx,cy,cz]=T.centro, [rx,ry,rz]=T.raggi, P=[], N=[], U=[], I=[];
  // quanto sporge il cranio in una direzione (misurato sul modello): la calottina sta appena fuori
  const Q=T.profilo, raggio=(az,pol)=>{ const fa=((az/(Math.PI*2))%1+1)%1*Q.NA, a0=Math.floor(fa)%Q.NA, a1=(a0+1)%Q.NA, ta=fa-Math.floor(fa);
    const fk=Math.min(Q.NP,pol/(Q.fino*Math.PI/180)*Q.NP), k0=Math.floor(fk), k1=Math.min(Q.NP,k0+1), tk=fk-k0, v=(a,k)=>Q.r[a*(Q.NP+1)+k];
    return ((v(a0,k0)*(1-ta)+v(a1,k0)*ta)*(1-tk)+(v(a0,k1)*(1-ta)+v(a1,k1)*ta)*tk)*1.025+ry*0.02; };
  const VB=0.26;                                             // sotto questa quota dell'immagine stanno paraorecchie e laccetti
  // guscio: copre dalla fronte alla nuca e scende sulle orecchie
  const NA=32, NP=10;
  for(let a=0;a<=NA;a++){ const az=a/NA*Math.PI*2, fino=(60+25*(1-Math.cos(az))+24*Math.sin(az)**2)*Math.PI/180;
    for(let k=0;k<=NP;k++){ const f=k/NP*fino, sx=Math.sin(f)*Math.sin(az), sy=Math.cos(f), sz=Math.sin(f)*Math.cos(az), r=raggio(az,f);
      P.push(cx+r*sx,cy+r*sy,cz+r*sz); const n=new THREE.Vector3(sx/rx,sy/ry,sz/rz).normalize(); N.push(n.x,n.y,n.z);
      U.push(a/NA,VB+(1-VB)*(1-k/NP)); } }      // (il numero si legge dritto da fuori)
  for(let a=0;a<NA;a++) for(let k=0;k<NP;k++){ const i=a*(NP+1)+k, j=i+NP+1; I.push(i,i+1,j, j,i+1,j+1); }
  const unisci=(g,uv)=>{ const o=P.length/3, p=g.attributes.position, n=g.attributes.normal;
    for(let i=0;i<p.count;i++){ P.push(p.getX(i),p.getY(i),p.getZ(i)); N.push(n.getX(i),n.getY(i),n.getZ(i)); const [u,v]=uv(i); U.push(u,v); }
    const ix=g.index.array; for(let i=0;i<ix.length;i++) I.push(ix[i]+o); };
  for(const lato of [1,-1]){
    // paraorecchie: disco rigido sopra l'orecchio
    const r=ry*0.36*PO, d=new THREE.CylinderGeometry(r,r*0.82,ry*0.16*PO,16); d.rotateZ(Math.PI/2*-lato); d.translate(lato*(T.orecchio[0]+ry*0.10),T.orecchio[1]+ry*0.02,T.orecchio[2]+rz*0.04);
    const pd=d.attributes.position; unisci(d,i=>[0.25+(pd.getZ(i)-T.orecchio[2]-rz*0.04)/r*0.2, VB*0.5+(pd.getY(i)-T.orecchio[1]-ry*0.02)/r*VB*0.42]);
    // laccetto: dal paraorecchie a sotto il mento
    const curva=new THREE.CatmullRomCurve3([ new THREE.Vector3(lato*(T.orecchio[0]+ry*0.06),T.orecchio[1]-r*0.9,T.orecchio[2]+rz*0.06),
      new THREE.Vector3(lato*T.orecchio[0]*0.86,(T.orecchio[1]+T.mento[1])/2,(T.orecchio[2]+T.mento[2])/2+rz*0.10),
      new THREE.Vector3(lato*rx*0.10,T.mento[1]-ry*0.07,T.mento[2]-rz*0.22) ]);
    unisci(new THREE.TubeGeometry(curva,8,ry*0.022,5),()=>[0.75,VB*0.5]);
    // capi del fiocco
    const capo=new THREE.CatmullRomCurve3([ new THREE.Vector3(lato*rx*0.06,T.mento[1]-ry*0.08,T.mento[2]-rz*0.22), new THREE.Vector3(lato*rx*0.24,T.mento[1]-ry*0.22,T.mento[2]-rz*0.12), new THREE.Vector3(lato*rx*0.14,T.mento[1]-ry*0.42,T.mento[2]-rz*0.10) ]);
    unisci(new THREE.TubeGeometry(capo,6,ry*0.02,5),()=>[0.75,VB*0.5]);
  }
  const nodo=new THREE.SphereGeometry(ry*0.05,8,6); nodo.translate(0,T.mento[1]-ry*0.08,T.mento[2]-rz*0.22); unisci(nodo,()=>[0.75,VB*0.5]);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.setIndex(I);
  return g;
}

