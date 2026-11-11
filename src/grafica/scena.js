// Scena 3D: piscina, acqua, schiuma, corde, porte, palla, telecamera
import * as THREE from 'three';
import { BRV, GH, GW, HL, HW, rnd } from '../costanti.js';
import { game } from '../stato.js';
import { Acqua, STRATO_CORPI, STRATO_SOLO_VISTA, STRATO_SOPRA, STRATO_SOTTO, STRATO_VASCA } from './acqua.js';
// ================= SCENA =================
export const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.info.autoReset=false;   // il conteggio degli oggetti disegnati si azzera a mano una volta per fotogramma (render.js)
export let dpr=Math.min(window.devicePixelRatio||1,('ontouchstart' in window)?1.5:2);
renderer.setPixelRatio(dpr);
renderer.setSize(innerWidth,innerHeight);
document.body.prepend(renderer.domElement);
export const scene = new THREE.Scene();
export function canvasTex(w,h,draw,rx,ry){
  const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  if(rx){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx,ry); }
  return t;
}
scene.background = canvasTex(16,256,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#2f7fd0'); g.addColorStop(0.6,'#a6d4f4'); g.addColorStop(1,'#e9f5fc'); x.fillStyle=g; x.fillRect(0,0,w,h); });
scene.fog = new THREE.Fog(0xcfe6f5,70,170);
export const camera = new THREE.PerspectiveCamera(innerWidth<innerHeight?62:40,innerWidth/innerHeight,0.1,300);
camera.layers.enableAll(); camera.layers.disable(STRATO_SOTTO);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight; camera.fov=camera.aspect<1?62:40;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight); ridimensionaAcqua();});
// intensità ritarate per Three.js moderno (colori calcolati in spazio lineare) in modo da restare come nella v0.9
export const LUCE_CIELO=2.44, LUCE_SOLE=2.86;
scene.add(new THREE.HemisphereLight(0xffffff,0x27385d,LUCE_CIELO));
export const sun = new THREE.DirectionalLight(0xfff3dc,LUCE_SOLE); sun.position.set(-10,30,14); scene.add(sun);

export function box(w,h,d,mat,x,y,z){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof mat==='number'?new THREE.MeshLambertMaterial({color:mat}):mat);
  m.position.set(x,y,z); scene.add(m); return m;
}
export const PX=15, PZ=12.5, DEPTH=2.2;
// fondo piastrellato
export const tileDraw=(base,line)=>(x,w,h)=>{ x.fillStyle=base; x.fillRect(0,0,w,h); x.strokeStyle=line; x.lineWidth=2;
  for(let i=0;i<=w;i+=32){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,h); x.stroke(); x.beginPath(); x.moveTo(0,i); x.lineTo(w,i); x.stroke(); } };
// sul fondo e sulle righe delle corsie si muovono i giochi di luce (caustiche): disegno animato calcolato dalla scheda grafica
export const caustiche={ tempo:{value:0}, forza:{value:1} };
function conCaustiche(mat){
  mat.onBeforeCompile=sh=>{
    sh.uniforms.uTempo=caustiche.tempo; sh.uniforms.uForza=caustiche.forza;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vPosMondo;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvPosMondo=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vPosMondo; uniform float uTempo, uForza;
      float caustica(vec2 q,float t){
        vec2 p=mod(q*1.7,6.2831853)-250.0, i=p; float c=1.0;
        for(int n=0;n<3;n++){ float tt=t*(1.0-3.5/float(n+1));
          i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));
          c+=1.0/length(vec2(p.x/(sin(i.x+tt)/0.005),p.y/(cos(i.y+tt)/0.005))); }
        c=1.17-pow(c/3.0,1.4); return pow(abs(c),8.0);
      }`).replace('#include <opaque_fragment>','outgoingLight+=vec3(0.75,0.9,1.0)*caustica(vPosMondo.xz,uTempo*0.55)*uForza;\n#include <opaque_fragment>');
  };
  return mat;
}
box(PX*2,0.1,PZ*2,conCaustiche(new THREE.MeshLambertMaterial({map:canvasTex(256,256,tileDraw('#3aaee4','rgba(255,255,255,.45)'),PX,PZ)})),0,-DEPTH,0);
{ const riga=conCaustiche(new THREE.MeshLambertMaterial({color:0x0d3566})); for(let i=-4;i<=4;i++) box(PX*2-4,0.02,0.28,riga,0,-DEPTH+0.06,i*2.5); }
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
// acqua realistica (livelli alta e media); quella qui sopra resta come livello basso
export const acqua=new Acqua(PX*2,PZ*2,{ colore:0xc4e8ff, cielo:0xa6d4f4, sole:sun.position, metriPerOnda:5.5 });
scene.add(acqua);
export let livelloAcqua=2;
export function ridimensionaAcqua(){ const v=renderer.getDrawingBufferSize(new THREE.Vector2()); acqua.ridimensiona(v.x,v.y); }
export function setLivelloAcqua(l){
  livelloAcqua=l; acqua.visible=l>0; water.visible=l===0; acqua.setLivello(l); caustiche.forza.value=l>0?1:0; ridimensionaAcqua();
}
export let waterN=0;
export function animateWater(t){
  caustiche.tempo.value=t;
  if(livelloAcqua>0){ acqua.setTempo(t); return; }
  const pos=waterGeo.attributes.position, n=pos.count;
  for(let i=0;i<n;i++){ const x=pos.getX(i), z=pos.getZ(i);
    pos.setY(i,0.03*Math.sin(x*1.3+t*1.7)+0.028*Math.sin(z*1.7-t*1.4)+0.016*Math.sin((x+z)*2.4+t*2.3)); }
  pos.needsUpdate=true; if((waterN=(waterN+1)%3)===0) waterGeo.computeVertexNormals();
  waterTex.offset.x=t*0.012; waterTex.offset.y=t*0.007;
}
// schiuma: macchie morbide disegnate tutte insieme (un solo oggetto per la scheda grafica)
const N_SCHIUMA=160;
export const foams=[]; let foamI=0;
const schiumaAlfa=new THREE.InstancedBufferAttribute(new Float32Array(N_SCHIUMA),1);
export const schiuma=(()=>{
  const g=new THREE.PlaneGeometry(2,2); g.rotateX(-Math.PI/2); g.setAttribute('aAlfa',schiumaAlfa);
  const tex=canvasTex(64,64,(x,w,h)=>{ const gr=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
    gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.55,'rgba(255,255,255,.75)'); gr.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=gr; x.fillRect(0,0,w,h); });
  const m=new THREE.ShaderMaterial({ transparent:true, depthWrite:false, uniforms:{map:{value:tex}},
    vertexShader:`attribute float aAlfa; varying float vA; varying vec2 vUv;
      void main(){ vA=aAlfa; vUv=uv; vec3 transformed=position;
        #include <project_vertex>
      }`,
    fragmentShader:`uniform sampler2D map; varying float vA; varying vec2 vUv;
      void main(){ gl_FragColor=vec4(1.0,1.0,1.0,texture2D(map,vUv).a*vA);
        #include <colorspace_fragment>
      }` });
  const im=new THREE.InstancedMesh(g,m,N_SCHIUMA); im.frustumCulled=false; scene.add(im);
  for(let i=0;i<N_SCHIUMA;i++) foams.push({life:0,max:1,size:0,x:0,z:0});
  return im;
})();
const _ms=new THREE.Matrix4();
export function spawnFoam(x,z,size,life){ const f=foams[foamI=(foamI+1)%foams.length]; f.max=(life||0.9)*1.5; f.life=f.max; f.size=size; f.x=x; f.z=z; }
export function updateFoam(dt){
  for(let i=0;i<N_SCHIUMA;i++){ const f=foams[i]; let sc=0, al=0;
    if(f.life>0){ f.life-=dt; const k=1-Math.max(0,f.life)/f.max; sc=f.size*(0.7+1.9*k); al=0.85*(1-k)*(1-k); }
    _ms.makeScale(sc,1,sc).setPosition(f.x,0.06+i*0.0002,f.z); schiuma.setMatrixAt(i,_ms); schiumaAlfa.array[i]=al; }
  schiuma.instanceMatrix.needsUpdate=true; schiumaAlfa.needsUpdate=true;
}
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
// Palla da pallanuoto: gomma gialla a buccia ruvida (per la presa a mano bagnata), 18 spicchi a gruppi di tre come nel
// pallone vero, separati da solchi scuri. Disegno e rilievo sono calcolati punto per punto sulla sfera, così i solchi
// sono curve esatte e non si deformano ai poli.
export const ball3d = (()=>{
  const W=1024, H=512, colore=document.createElement('canvas'), rilievo=document.createElement('canvas');
  colore.width=rilievo.width=W; colore.height=rilievo.height=H;
  const xc=colore.getContext('2d'), xr=rilievo.getContext('2d'), ic=xc.createImageData(W,H), ir=xr.createImageData(W,H);
  const caso=(a,b,c)=>{ const t=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453; return t-Math.floor(t); };
  const QP=4/Math.PI, SOLCO=0.021;                    // mezza larghezza del solco, in radianti
  for(let j=0;j<H;j++){ const th=(j+0.5)/H*Math.PI, st=Math.sin(th), y=Math.cos(th);
    for(let i=0;i<W;i++){ const ph=(i+0.5)/W*Math.PI*2, x=-Math.cos(ph)*st, z=Math.sin(ph)*st;
      // faccia del cubo in cui cade il punto e coordinate "ad angolo uguale" dentro la faccia
      const ax=Math.abs(x), ay=Math.abs(y), az=Math.abs(z); let u,v,faccia;
      if(ax>=ay&&ax>=az){ u=Math.atan(y/ax)*QP; v=Math.atan(z/ax)*QP; faccia=0; }      // facce X: tre strisce divise lungo y
      else if(ay>=az){ u=Math.atan(z/ay)*QP; v=Math.atan(x/ay)*QP; faccia=1; }         // facce Y: divise lungo z
      else { u=Math.atan(x/az)*QP; v=Math.atan(y/az)*QP; faccia=2; }                   // facce Z: divise lungo x
      // distanza dal solco più vicino: bordo della faccia oppure una delle due divisioni interne
      const d=Math.min(1-Math.abs(u),1-Math.abs(v),Math.abs(Math.abs(u)-1/3))*Math.PI/4;
      const solco=1-Math.min(1,Math.max(0,(d-SOLCO*0.45)/(SOLCO*0.55)));               // 1 nel solco, 0 fuori
      const spalla=Math.exp(-d/0.05);                                                  // la gomma si scurisce verso il solco
      // buccia: puntini in rilievo fitti
      const gx=x*46, gy=y*46, gz=z*46, cx=Math.floor(gx), cy=Math.floor(gy), cz=Math.floor(gz);
      const dx=gx-cx-0.5, dy=gy-cy-0.5, dz=gz-cz-0.5, punto=Math.max(0,1-(dx*dx+dy*dy+dz*dz)*5)*(0.6+0.4*caso(cx,cy,cz));
      const striscia=Math.floor((u+1)*1.5)+faccia*3, tono=0.97+0.05*caso(striscia,faccia,7);      // ogni spicchio ha un tono appena diverso
      const luce=(0.90+0.10*punto)*tono*(1-0.20*spalla);
      const k=(j*W+i)*4, s1=1-solco;
      ic.data[k]=(250*luce)*s1+34*solco; ic.data[k+1]=(203*luce)*s1+26*solco; ic.data[k+2]=(22*luce)*s1+12*solco; ic.data[k+3]=255;
      const q=Math.round((0.62+0.38*punto)*255*(1-solco)+25*solco*0+0); ir.data[k]=ir.data[k+1]=ir.data[k+2]=Math.round(q*(1-0.85*solco)); ir.data[k+3]=255;
    } }
  xc.putImageData(ic,0,0); xr.putImageData(ir,0,0);
  const tc=new THREE.CanvasTexture(colore); tc.colorSpace=THREE.SRGBColorSpace; tc.anisotropy=4;
  const tr=new THREE.CanvasTexture(rilievo);
  return new THREE.Mesh(new THREE.SphereGeometry(BRV,32,24),new THREE.MeshPhongMaterial({map:tc,bumpMap:tr,bumpScale:1.4,shininess:48,specular:0x5a5648}));
})();
scene.add(ball3d);
export const shadow = new THREE.Mesh(new THREE.CircleGeometry(BRV*1.1,16),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.3}));
shadow.rotation.x=-Math.PI/2; scene.add(shadow);
export const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55,0.05,8,32),new THREE.MeshBasicMaterial({color:0xfacc15}));
ring.rotation.x=Math.PI/2; scene.add(ring);
// freccia bianca sopra la testa del giocatore controllato (come nel riferimento)
export const freccia = new THREE.Sprite(new THREE.SpriteMaterial({depthTest:false,transparent:true,map:canvasTex(64,64,(x,w,h)=>{
  x.beginPath(); x.moveTo(8,10); x.lineTo(w-8,10); x.lineTo(w/2,h-8); x.closePath();
  x.lineJoin='round'; x.lineWidth=9; x.strokeStyle='#0b1d33'; x.stroke(); x.fillStyle='#fff'; x.fill(); })}));
freccia.scale.set(0.5,0.5,1); freccia.renderOrder=5; scene.add(freccia);
// mirino sulla porta: mostra dove andrà il tiro mentre lo si carica (come nel riferimento)
export const mirino = new THREE.Sprite(new THREE.SpriteMaterial({depthTest:false,transparent:true,map:canvasTex(64,64,(x,w,h)=>{
  for(const [colore,spessore] of [['#0b1d33',9],['#fff',4]]){ x.strokeStyle=colore; x.lineWidth=spessore; x.lineCap='round';
    x.beginPath(); x.arc(w/2,h/2,20,0,7); x.stroke();
    for(const [a,b,c,d] of [[w/2,3,w/2,17],[w/2,h-3,w/2,h-17],[3,h/2,17,h/2],[w-3,h/2,w-17,h/2]]){ x.beginPath(); x.moveTo(a,b); x.lineTo(c,d); x.stroke(); } } })}));
mirino.scale.set(0.8,0.8,1); mirino.renderOrder=6; mirino.visible=false; scene.add(mirino);
export const passMark = new THREE.Mesh(new THREE.TorusGeometry(0.4,0.035,6,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.6}));
passMark.rotation.x=Math.PI/2; scene.add(passMark);
export const camMode = () => camera.aspect<1 ? 1 : game.camMode;   // in verticale si usa sempre la vista dalla porta
export function setDpr(v){ dpr=v; }
// strati di disegno (vedi acqua.js): cosa compare nel riflesso e cosa nella vista sott'acqua
{
  const bb=new THREE.Box3(), soloVista=new Set([schiuma,shadow,ring,passMark,freccia,mirino,water,acqua]);
  for(const o of scene.children){
    if(o.isLight){ o.layers.enableAll(); continue; }
    let st;
    if(soloVista.has(o)) st=STRATO_SOLO_VISTA;
    else if(o===ball3d) st=STRATO_CORPI;
    else { bb.setFromObject(o); st = bb.min.y<-0.5 ? STRATO_VASCA : STRATO_SOPRA; }
    o.traverse(c=>c.layers.set(st));
  }
  setLivelloAcqua(2);
}
