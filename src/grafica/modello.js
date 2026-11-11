// Modello 3D del giocatore (cilindri e sfere) e numero di calottina
import * as THREE from 'three';
import { STRATO_CORPI, STRATO_SOLO_VISTA } from './acqua.js';
import { attaccaCorpo } from './corpo.js';
import { VIS, rnd } from '../costanti.js';
import { scene } from './scena.js';
export function numberTexture(n,bg,fg){
  const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d');
  x.fillStyle=bg; x.beginPath(); x.arc(32,32,28,0,Math.PI*2); x.fill();
  x.fillStyle=fg; x.font='bold 34px sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(String(n),32,34);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
export const SKIN=[0xe2ad88,0xd59b74,0xc98d66,0xeab995,0xb97f5b];
export const UPV=new THREE.Vector3(0,1,0), _dv=new THREE.Vector3();
export function setSeg(m,a,b){
  _dv.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]); const L=_dv.length()||0.001;
  m.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2); m.scale.set(1,L,1);
  m.quaternion.setFromUnitVectors(UPV,_dv.divideScalar(L));
}
export function makePlayerMesh(capColor,num,team){
  const g=new THREE.Group();
  const skin=new THREE.MeshPhongMaterial({color:SKIN[Math.floor(rnd()*SKIN.length)],shininess:55,specular:0x555555});
  const suit=new THREE.MeshPhongMaterial({color:team.idx===0?0x0b2a6f:0x8a1020,shininess:30});
  const capM=new THREE.MeshPhongMaterial({color:capColor,shininess:40});
  const cyl=(rt,rb)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,1,7),skin); g.add(m); return m; };
  const sph=(r,mat)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(r,9,7),mat||skin); g.add(m); return m; };
  const R={ g,
    torso:cyl(0.165,0.125), bar:cyl(0.078,0.078), chest:sph(0.165), pelvis:sph(0.135,suit),
    shR:sph(0.082), shL:sph(0.082), uaR:cyl(0.043,0.052), uaL:cyl(0.043,0.052), faR:cyl(0.034,0.042), faL:cyl(0.034,0.042),
    haR:sph(0.05), haL:sph(0.05),
    thR:cyl(0.058,0.08), thL:cyl(0.058,0.08), snR:cyl(0.036,0.05), snL:cyl(0.036,0.05) };
  R.chest.scale.set(0.85,0.9,1.15);
  const head=new THREE.Group();
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.105,14,12),skin));
  const cap=new THREE.Mesh(new THREE.SphereGeometry(0.113,14,10,0,Math.PI*2,0,Math.PI*0.6),capM); cap.rotation.z=0.25; head.add(cap);
  g.add(head); R.head=head;
  const bg = team.idx===0 ? '#1d4fd6' : '#f2f2f2', fg = team.idx===0 ? '#fff' : '#111';
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:numberTexture(num,bg,fg),depthTest:false,transparent:true}));
  spr.scale.set(0.2,0.2,1); g.add(spr); R.spr=spr;
  g.traverse(c=>c.layers.set(STRATO_CORPI)); spr.layers.set(STRATO_SOLO_VISTA);
  // corpo con scheletro: quando il modello è caricato prende il posto di cilindri e sfere (che restano come riserva)
  R.vecchi=g.children.filter(c=>c!==spr);
  const portiere=capColor===0xd62828;
  attaccaCorpo(R,{ pelle:skin.color.getHex(), costume:suit.color.getHex(), calottina:capColor, paraorecchie:portiere?0xd62828:suit.color.getHex(),
    testo:team.idx===0||portiere?'#fff':'#111' },num,num+team.idx*7);
  g.scale.setScalar(VIS); scene.add(g);
  return R;
}
