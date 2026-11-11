// Scena 3D: piscina, acqua, schiuma, corde, porte, palla, telecamera
import * as THREE from 'three';
import { BRV, GH, GW, HL, HW, rnd } from '../costanti.js';
import { game } from '../stato.js';
// ================= SCENA =================
export const renderer = new THREE.WebGLRenderer({antialias:true});
export let dpr=Math.min(window.devicePixelRatio||1,('ontouchstart' in window)?1.5:2);
renderer.setPixelRatio(dpr);
renderer.setSize(innerWidth,innerHeight);
document.body.prepend(renderer.domElement);
export const scene = new THREE.Scene();
export function canvasTex(w,h,draw,rx,ry){
  const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);
  if(rx){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx,ry); }
  return t;
}
scene.background = canvasTex(16,256,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#2f7fd0'); g.addColorStop(0.6,'#a6d4f4'); g.addColorStop(1,'#e9f5fc'); x.fillStyle=g; x.fillRect(0,0,w,h); });
scene.fog = new THREE.Fog(0xcfe6f5,70,170);
export const camera = new THREE.PerspectiveCamera(innerWidth<innerHeight?62:40,innerWidth/innerHeight,0.1,300);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight; camera.fov=camera.aspect<1?62:40;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
scene.add(new THREE.HemisphereLight(0xffffff,0x5a86a6,0.62));
export const sun = new THREE.DirectionalLight(0xfff3dc,0.7); sun.position.set(-10,30,14); scene.add(sun);

export function box(w,h,d,mat,x,y,z){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof mat==='number'?new THREE.MeshLambertMaterial({color:mat}):mat);
  m.position.set(x,y,z); scene.add(m); return m;
}
export const PX=15, PZ=12.5, DEPTH=2.2;
// fondo piastrellato
export const tileDraw=(base,line)=>(x,w,h)=>{ x.fillStyle=base; x.fillRect(0,0,w,h); x.strokeStyle=line; x.lineWidth=2;
  for(let i=0;i<=w;i+=32){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,h); x.stroke(); x.beginPath(); x.moveTo(0,i); x.lineTo(w,i); x.stroke(); } };
box(PX*2,0.1,PZ*2,new THREE.MeshLambertMaterial({map:canvasTex(256,256,tileDraw('#3aaee4','rgba(255,255,255,.45)'),PX,PZ)}),0,-DEPTH,0);
for(let i=-4;i<=4;i++) box(PX*2-4,0.02,0.28,0x0d3566,0,-DEPTH+0.06,i*2.5);
export const wallMat=new THREE.MeshLambertMaterial({map:canvasTex(256,256,tileDraw('#8fe0f7','rgba(255,255,255,.55)'),12,1)});
box(PX*2,DEPTH+0.3,0.3,wallMat,0,-DEPTH/2+0.15,-PZ-0.15); box(PX*2,DEPTH+0.3,0.3,wallMat,0,-DEPTH/2+0.15,PZ+0.15);
box(0.3,DEPTH+0.3,PZ*2,wallMat,-PX-0.15,-DEPTH/2+0.15,0); box(0.3,DEPTH+0.3,PZ*2,wallMat,PX+0.15,-DEPTH/2+0.15,0);
// bordo vasca
export const deckMat=()=>new THREE.MeshLambertMaterial({map:canvasTex(128,128,tileDraw('#cbc2b0','rgba(110,100,85,.4)'),20,4)});
box(PX*2+16,0.3,7,deckMat(),0,0.15,-PZ-3.8); box(PX*2+16,0.3,7,deckMat(),0,0.15,PZ+3.8);
box(7,0.3,PZ*2+0.6,deckMat(),-PX-3.8,0.15,0); box(7,0.3,PZ*2+0.6,deckMat(),PX+3.8,0.15,0);
box(PX*2+0.8,0.08,0.4,0xffffff,0,0.32,-PZ-0.2); box(PX*2+0.8,0.08,0.4,0xffffff,0,0.32,PZ+0.2);
box(0.4,0.08,PZ*2,0xffffff,-PX-0.2,0.32,0); box(0.4,0.08,PZ*2,0xffffff,PX+0.2,0.32,0);
// cartelloni e tribuna con pubblico sul lato lontano
{
  const cols=['#0b3d91','#c1121f','#0a7d4b','#f59e0b','#111827'], words=['PALLANUOTO 3D','MILANO','WATERPOLO','FORZA AZZURRI','PALLANUOTO 3D'];
  for(let i=0;i<5;i++){
    const tex=canvasTex(512,96,(x,w,h)=>{ x.fillStyle=cols[i]; x.fillRect(0,0,w,h); x.fillStyle='#fff'; x.font='bold 54px sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(words[i],w/2,h/2+3); });
    const m=new THREE.Mesh(new THREE.PlaneGeometry(6.2,1.0),new THREE.MeshBasicMaterial({map:tex})); m.position.set((i-2)*6.4,0.82,-PZ-2.6); scene.add(m);
  }
  const crowd=canvasTex(1024,256,(x,w,h)=>{ x.fillStyle='#22324d'; x.fillRect(0,0,w,h);
    const cc=['#e11d48','#2563eb','#f8fafc','#facc15','#16a34a','#f97316','#94a3b8','#0ea5e9'];
    for(let r=0;r<9;r++){ x.fillStyle='rgba(0,0,0,.25)'; x.fillRect(0,r*28+22,w,6);
      for(let i=0;i<120;i++){ if(rnd()<0.2) continue; const px=i*8.6+rnd()*3, py=r*28+12;
        x.fillStyle=cc[Math.floor(rnd()*cc.length)]; x.fillRect(px-3,py,6,10);
        x.fillStyle='#e0b090'; x.beginPath(); x.arc(px,py-2,2.6,0,7); x.fill(); } } });
  const st=new THREE.Mesh(new THREE.PlaneGeometry(PX*2+14,7),new THREE.MeshLambertMaterial({map:crowd}));
  st.position.set(0,3.6,-PZ-8.5); st.rotation.x=-0.55; scene.add(st);
  box(PX*2+14,1.2,0.4,0x1b2d4a,0,0.6,-PZ-5.4);
  box(PX*2+14,0.3,1.5,0x9aa7b8,0,7.3,-PZ-11.6);
}
// acqua: superficie ondulata con riflessi
export const waterTex = canvasTex(256,256,(x,w,h)=>{ x.fillStyle='#1f86d2'; x.fillRect(0,0,w,h);
  for(let i=0;i<70;i++){ x.strokeStyle=i%3?'rgba(170,225,255,.35)':'rgba(10,80,150,.28)'; x.lineWidth=1+rnd()*2.5;
    const px=rnd()*w, py=rnd()*h, l=20+rnd()*50; x.beginPath();
    x.moveTo(px,py); x.quadraticCurveTo(px+l/2,py+(rnd()-0.5)*18,px+l,py+(rnd()-0.5)*8); x.stroke(); } },7,6);
export const waterGeo = new THREE.PlaneGeometry(PX*2,PZ*2,28,22); waterGeo.rotateX(-Math.PI/2);
export const water = new THREE.Mesh(waterGeo,new THREE.MeshPhongMaterial({map:waterTex,transparent:true,opacity:0.76,shininess:150,specular:0xffffff}));
scene.add(water);
export let waterN=0;
export function animateWater(t){
  const pos=waterGeo.attributes.position, n=pos.count;
  for(let i=0;i<n;i++){ const x=pos.getX(i), z=pos.getZ(i);
    pos.setY(i,0.03*Math.sin(x*1.3+t*1.7)+0.028*Math.sin(z*1.7-t*1.4)+0.016*Math.sin((x+z)*2.4+t*2.3)); }
  pos.needsUpdate=true; if((waterN=(waterN+1)%3)===0) waterGeo.computeVertexNormals();
  waterTex.offset.x=t*0.012; waterTex.offset.y=t*0.007;
}
// schiuma
export const foams=[]; let foamI=0;
{ const g=new THREE.CircleGeometry(1,10); g.rotateX(-Math.PI/2);
  for(let i=0;i<140;i++){ const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false})); m.visible=false; scene.add(m); foams.push({m,life:0,max:1,size:0}); } }
export function spawnFoam(x,z,size,life){ const f=foams[foamI=(foamI+1)%foams.length]; f.life=f.max=life||0.9; f.size=size; f.m.position.set(x,0.08,z); f.m.visible=true; }
export function updateFoam(dt){ for(const f of foams){ if(f.life<=0) continue; f.life-=dt; const k=1-Math.max(0,f.life)/f.max; f.m.scale.setScalar(f.size*(0.5+1.4*k)); f.m.material.opacity=0.8*(1-k); if(f.life<=0) f.m.visible=false; } }
// corde di delimitazione con i colori delle zone
{
  const geo=new THREE.SphereGeometry(0.09,6,5);
  const cols={w:0xffffff,r:0xe11d2a,y:0xfacc15,g:0x22c55e}, pts={w:[],r:[],y:[],g:[]};
  for(const zs of [-HW-0.2,HW+0.2]) for(let x=-HL;x<=HL+0.01;x+=0.3){ const ax=HL-Math.abs(x); pts[ax<2?'r':ax<6?'y':'g'].push([x,zs]); }
  for(const xs of [-HL-0.6,HL+0.6]) for(let z=-HW;z<=HW;z+=0.3) pts.w.push([xs,z]);
  const mtx=new THREE.Matrix4();
  for(const c in pts){
    const im=new THREE.InstancedMesh(geo,new THREE.MeshLambertMaterial({color:cols[c]}),pts[c].length);
    pts[c].forEach((q,i)=>{ mtx.makeTranslation(q[0],0.04,q[1]); im.setMatrixAt(i,mtx); });
    im.instanceMatrix.needsUpdate=true; scene.add(im);
  }
  const mk=[[HL,0xffffff],[HL-2,0xe11d2a],[HL-5,0xe11d2a],[HL-6,0xfacc15],[0,0xffffff],[-HL,0xffffff],[-HL+2,0xe11d2a],[-HL+5,0xe11d2a],[-HL+6,0xfacc15]];
  for(const [x,c] of mk) for(const zs of [-PZ-0.6,PZ+0.6]) box(0.35,0.06,0.9,c,x,0.34,zs);
}
// porte
export function makeGoal(sign){
  const g=new THREE.Group(); const mat=new THREE.MeshPhongMaterial({color:0xffffff,shininess:60});
  const H=GH+0.3;
  for(const z of [-GW-0.04,GW+0.04]){ const p=new THREE.Mesh(new THREE.BoxGeometry(0.08,H,0.08),mat); p.position.set(0,H/2-0.3,z); g.add(p); }
  const bar=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,GW*2+0.16),mat); bar.position.set(0,GH+0.04,0); g.add(bar);
  const netMat=new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:0.5});
  const back=new THREE.Mesh(new THREE.PlaneGeometry(GW*2,H,12,5),netMat); back.rotation.y=Math.PI/2; back.position.set(sign*0.8,H/2-0.3,0); g.add(back);
  const top=new THREE.Mesh(new THREE.PlaneGeometry(0.8,GW*2,3,12),netMat); top.rotation.x=-Math.PI/2; top.position.set(sign*0.4,GH,0); g.add(top);
  for(const z of [-GW,GW]){ const sd=new THREE.Mesh(new THREE.PlaneGeometry(0.8,H,4,8),netMat); sd.position.set(sign*0.4,H/2-0.3,z); g.add(sd); }
  const flo=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.14,GW*2+0.5),new THREE.MeshLambertMaterial({color:0xf4f4f4})); flo.position.set(sign*0.45,-0.02,0); g.add(flo);
  g.position.set(sign*HL,0,0); scene.add(g);
}
makeGoal(1); makeGoal(-1);

// palla + ombra + anello del giocatore controllato
export const ball3d = new THREE.Mesh(new THREE.SphereGeometry(BRV,18,14),new THREE.MeshPhongMaterial({color:0xffd60a,shininess:40}));
scene.add(ball3d);
{ const stripe=new THREE.Mesh(new THREE.TorusGeometry(BRV*1.002,0.018,6,24),new THREE.MeshLambertMaterial({color:0x1e3a8a})); ball3d.add(stripe);
  const s2=stripe.clone(); s2.rotation.y=Math.PI/2; ball3d.add(s2); }
export const shadow = new THREE.Mesh(new THREE.CircleGeometry(BRV*1.1,16),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.3}));
shadow.rotation.x=-Math.PI/2; scene.add(shadow);
export const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55,0.05,8,32),new THREE.MeshBasicMaterial({color:0xfacc15}));
ring.rotation.x=Math.PI/2; scene.add(ring);
export const passMark = new THREE.Mesh(new THREE.TorusGeometry(0.4,0.035,6,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.6}));
passMark.rotation.x=Math.PI/2; scene.add(passMark);
export const camMode = () => camera.aspect<1 ? 1 : game.camMode;   // in verticale si usa sempre la vista dalla porta
export function setDpr(v){ dpr=v; }
