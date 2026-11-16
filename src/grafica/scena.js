// Scena 3D: piscina, acqua, schiuma, corde, porte, palla, telecamera
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BRV, HL } from '../costanti.js';
import { sottAcqua, tempoAcqua } from './sottacqua.js';
import { creaSuperficie } from './superficie.js';
import { illuminaArena, creaOmbreAcqua } from './illuminazione.js';
import { creaArena, creaCorde, creaPorta } from './arena.js';
// ================= SCENA =================
export const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.info.autoReset=false;   // il conteggio degli oggetti disegnati si azzera a mano una volta per fotogramma (render.js)
export let dpr=Math.min(window.devicePixelRatio||1,('ontouchstart' in window)?1.5:2);
renderer.setPixelRatio(dpr);
renderer.setSize(innerWidth,innerHeight);
document.body.prepend(renderer.domElement);
export const scene = new THREE.Scene();
illuminaArena(renderer,scene);
export const aggiornaOmbreAcqua=creaOmbreAcqua(scene);
export function canvasTex(w,h,draw,rx,ry){
  const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  if(rx){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx,ry); }
  return t;
}
scene.background = canvasTex(16,256,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#2f7fd0'); g.addColorStop(0.6,'#a6d4f4'); g.addColorStop(1,'#e9f5fc'); x.fillStyle=g; x.fillRect(0,0,w,h); });
scene.fog = new THREE.Fog(0xcfe6f5,70,170);
export const camera = new THREE.PerspectiveCamera(innerWidth<innerHeight?62:40,innerWidth/innerHeight,0.1,300);
camera.layers.enable(1);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight; camera.fov=camera.aspect<1?62:40;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
// intensità ritarate per Three.js moderno (colori calcolati in spazio lineare) in modo da restare come nella v0.9
export const LUCE_CIELO=1.4, LUCE_SOLE=2.8;
scene.add(new THREE.HemisphereLight(0xd9f3ff,0x16465b,LUCE_CIELO));
export const sun = new THREE.DirectionalLight(0xfff3dc,LUCE_SOLE); sun.position.set(-10,30,14); scene.add(sun);

export function box(w,h,d,mat,x,y,z){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof mat==='number'?new THREE.MeshLambertMaterial({color:mat}):mat);
  m.position.set(x,y,z); scene.add(m); return m;
}
export const PX=15, PZ=12.5, DEPTH=2.2;
// fondo piastrellato
export const tileDraw=(base,line)=>(x,w,h)=>{ x.fillStyle=base; x.fillRect(0,0,w,h); x.strokeStyle=line; x.lineWidth=2;
  for(let i=0;i<=w;i+=32){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,h); x.stroke(); x.beginPath(); x.moveTo(0,i); x.lineTo(w,i); x.stroke(); } };
// fondo, corsie e pareti prendono il colore dell'acqua secondo la profondità (sottacqua.js): piastrelle e righe si vedono, ma
// attenuate come in una piscina vera; sul fondo si muovono giochi di luce leggeri
box(PX*2,0.1,PZ*2,sottAcqua(new THREE.MeshBasicMaterial({map:canvasTex(256,256,tileDraw('#319fc2','rgba(220,250,255,.18)'),PX/2,PZ/2)}),{luci:'0.3'}),0,-DEPTH,0);
{
  const righe=[];
  for(let i=-4;i<=4;i++){
    const g=new THREE.PlaneGeometry(PX*2-4,0.28); g.rotateX(-Math.PI/2); g.translate(0,-DEPTH+0.07,i*2.5); righe.push(g);
  }
  scene.add(new THREE.Mesh(mergeGeometries(righe),sottAcqua(new THREE.MeshLambertMaterial({color:0x124658}),{luci:'0.18'})));
  righe.forEach(g=>g.dispose());
}
export const wallMat=sottAcqua(new THREE.MeshLambertMaterial({map:canvasTex(256,256,tileDraw('#8fe0f7','rgba(255,255,255,.55)'),12,1)}));
{
  // Stesse quattro pareti, facce e UV; un solo invio anziché quattro anche dalle nuove camere.
  const pareti=[];
  for(const s of [-1,1]){
    pareti.push(new THREE.BoxGeometry(PX*2,DEPTH+0.3,0.3).translate(0,-DEPTH/2+0.15,s*(PZ+0.15)));
    pareti.push(new THREE.BoxGeometry(0.3,DEPTH+0.3,PZ*2).translate(s*(PX+0.15),-DEPTH/2+0.15,0));
  }
  const muro=new THREE.Mesh(mergeGeometries(pareti),wallMat); muro.name='Pareti della vasca'; scene.add(muro);
  pareti.forEach(g=>g.dispose());
}
// Bordo, griglie, panchine, tavolo ufficiali e tribune a gradoni condividono un atlante.
creaArena(scene,PX,PZ);
// Onde e riflessi in un solo passaggio, sincronizzati con l'immersione dei corpi.
export const acqua=creaSuperficie(PX*2,PZ*2,tempoAcqua);
scene.add(acqua);
export function animateWater(t){ tempoAcqua.value=t; }
// schiuma: increspature e scie disegnate tutte insieme (un solo oggetto per la scheda grafica)
const N_SCHIUMA=320;
export const foams=[]; let foamI=0;
const schiumaAlfa=new THREE.InstancedBufferAttribute(new Float32Array(N_SCHIUMA),1);
const schiumaEta=new THREE.InstancedBufferAttribute(new Float32Array(N_SCHIUMA),1);      // 0 appena nata, 1 finita
const schiumaScia=new THREE.InstancedBufferAttribute(new Float32Array(N_SCHIUMA),1);     // 1 = scia di chi nuota
export const schiuma=(()=>{
  const g=new THREE.PlaneGeometry(2,2); g.rotateX(-Math.PI/2); g.setAttribute('aAlfa',schiumaAlfa); g.setAttribute('aEta',schiumaEta); g.setAttribute('aScia',schiumaScia);
  const m=new THREE.ShaderMaterial({ transparent:true, depthWrite:false,
    vertexShader:`attribute float aAlfa; attribute float aEta; attribute float aScia; varying float vA; varying float vK; varying float vS; varying float vSeme; varying vec2 vUv;
      void main(){ vA=aAlfa; vK=aEta; vS=aScia; vUv=uv; vSeme=fract(instanceMatrix[3].x*3.17+instanceMatrix[3].z*1.71); vec3 transformed=position;
        #include <project_vertex>
      }`,
    // increspatura: un anello sottile un po' spezzato che si allarga e svanisce, con un velo chiaro dentro appena nato;
    // le scie dei nuotatori sono anelli allungati nella direzione del nuoto, aperti davanti: restano i lati e la coda, cioè due
    // strisce chiare che si allontanano dal corpo
    fragmentShader:`varying float vA; varying float vK; varying float vS; varying float vSeme; varying vec2 vUv;
      void main(){
        vec2 d=vUv*2.0-1.0; float r=length(d), ang=atan(d.y,d.x);
        float spezzato=0.55+0.45*sin(ang*3.0+vSeme*6.283)*sin(ang*5.0-vSeme*12.0+vK*2.0);
        float anello=1.0-smoothstep(0.0,0.07+0.05*vK,abs(r-0.74));
        float velo=(1.0-smoothstep(0.0,0.74,r))*0.35*(1.0-vK)*(1.0-vK);
        float aperto=mix(1.0,1.0-smoothstep(-0.2,0.55,d.x),vS);
        float a=clamp((anello*clamp(spezzato,0.0,1.0)*0.85*aperto+velo*mix(1.0,0.5,vS))*min(1.0,vA*1.6),0.0,0.8);
        gl_FragColor=vec4(1.0,1.0,1.0,a);
        #include <colorspace_fragment>
      }` });
  const im=new THREE.InstancedMesh(g,m,N_SCHIUMA); im.frustumCulled=false; scene.add(im);
  for(let i=0;i<N_SCHIUMA;i++) foams.push({life:0,max:1,size:0,x:0,z:0,dx:0,dz:0});
  return im;
})();
const _ms=new THREE.Matrix4();
// dx,dz (facoltativi) = direzione del nuoto: la scia viene allungata in quella direzione
export function spawnFoam(x,z,size,life,dx,dz){ const f=foams[foamI=(foamI+1)%foams.length]; f.max=(life||0.9)*1.5; f.life=f.max; f.size=size; f.x=x; f.z=z; f.dx=dx||0; f.dz=dz||0; }
const _sq=new THREE.Quaternion(), _sv=new THREE.Vector3(), _sp=new THREE.Vector3(), _sy=new THREE.Vector3(0,1,0);
export function updateFoam(dt){
  for(let i=0;i<N_SCHIUMA;i++){ const f=foams[i]; let sc=0, al=0, k=1;
    if(f.life>0){ f.life-=dt; k=1-Math.max(0,f.life)/f.max; sc=f.size*(0.7+1.9*k); al=0.85*(1-k)*(1-k); }
    // la scia è più lunga nel verso del nuoto e un po' più stretta di traverso
    const scia=!!(f.dx||f.dz), lungo=scia?1.7:1, largo=scia?0.75:1, s2=sc*1.25;
    _sq.setFromAxisAngle(_sy,scia?Math.atan2(-f.dz,f.dx):0);
    _ms.compose(_sp.set(f.x,0.06+i*0.0002,f.z),_sq,_sv.set(s2*lungo,1,s2*largo)); schiuma.setMatrixAt(i,_ms); schiumaAlfa.array[i]=al; schiumaEta.array[i]=k; schiumaScia.array[i]=scia?1:0; }
  schiuma.instanceMatrix.needsUpdate=true; schiumaAlfa.needsUpdate=true; schiumaEta.needsUpdate=true; schiumaScia.needsUpdate=true;
  contatti.instanceMatrix.needsUpdate=true; contattoForza.needsUpdate=true; contattoVel.needsUpdate=true;
}
// contatto con l'acqua attorno a ogni giocatore: dove il corpo attraversa la superficie l'acqua fa un bordo chiaro e mosso, e
// da lì partono piccole increspature che si allargano; chi nuota spinge davanti a sé un'onda (più forte se veloce).
// Da fermi è un cerchio attorno alle spalle, in nuotata un ovale lungo il corpo. Tutti i giocatori in un solo oggetto.
const N_CONTATTI=16;
const contattoForza=new THREE.InstancedBufferAttribute(new Float32Array(N_CONTATTI),1);
const contattoVel=new THREE.InstancedBufferAttribute(new Float32Array(N_CONTATTI),1);
export const contatti=(()=>{
  const g=new THREE.PlaneGeometry(2,2); g.rotateX(-Math.PI/2); g.setAttribute('aForza',contattoForza); g.setAttribute('aVel',contattoVel);
  const m=new THREE.ShaderMaterial({ transparent:true, depthWrite:false, uniforms:{ uTempo:tempoAcqua },
    vertexShader:`attribute float aForza; attribute float aVel; varying float vF; varying float vV; varying float vSeme; varying vec2 vUv;
      void main(){ vF=aForza; vV=aVel; vUv=uv; vSeme=fract(instanceMatrix[3].x*0.37+instanceMatrix[3].z*0.71)*6.283; vec3 transformed=position;
        #include <project_vertex>
      }`,
    fragmentShader:`uniform float uTempo; varying float vF; varying float vV; varying float vSeme; varying vec2 vUv;
      void main(){
        vec2 d=vUv*2.0-1.0; float r=length(d), ang=atan(d.y,d.x), t=uTempo;
        // bordo chiaro attorno al corpo, mosso e un po' spezzato
        float mosso=0.6+0.4*sin(ang*5.0+t*3.1+vSeme)*sin(ang*3.0-t*2.3+vSeme*2.0);
        float bordo=(1.0-smoothstep(0.0,0.09,abs(r-0.60-0.025*sin(ang*6.0+t*4.0+vSeme))))*mosso;
        // due increspature che partono dal corpo e si allargano svanendo
        float onde=0.0;
        for(int i=0;i<2;i++){ float k=fract(t*0.75+float(i)*0.5+vSeme*0.16);
          onde+=(1.0-smoothstep(0.0,0.05+0.04*k,abs(r-0.62-0.36*k)))*(1.0-k)*(1.0-k)*(0.55+0.45*sin(ang*4.0+vSeme+float(i)*2.0)); }
        // onda davanti a chi nuota
        float prua=smoothstep(0.15,0.75,d.x)*(1.0-smoothstep(0.0,0.16,abs(r-0.66)))*vV;
        // le increspature che si allargano ci sono solo quando il corpo si muove o si alza: da fermi resta il bordo (niente rumore)
        float a=(bordo*0.5+onde*0.28*smoothstep(0.3,0.75,vF))*vF+prua*0.5;
        a*=1.0-smoothstep(0.92,1.0,r);
        gl_FragColor=vec4(1.0,1.0,1.0,clamp(a,0.0,0.7));
        #include <colorspace_fragment>
      }` });
  const im=new THREE.InstancedMesh(g,m,N_CONTATTI); im.frustumCulled=false;
  const zero=new THREE.Matrix4().makeScale(0,0,0); for(let i=0;i<N_CONTATTI;i++) im.setMatrixAt(i,zero);
  scene.add(im); return im;
})();
// i = numero del giocatore (0..15); ang = direzione del corpo; lungo/largo = mezze misure in metri; forza 0..1; vel 0..1 (onda davanti)
export function contatto(i,x,z,ang,lungo,largo,forza,vel){
  if(i>=N_CONTATTI) return;
  _sq.setFromAxisAngle(_sy,ang); _ms.compose(_sp.set(x,0.03+i*0.0003,z),_sq,_sv.set(lungo,1,largo)); contatti.setMatrixAt(i,_ms);
  contattoForza.array[i]=forza; contattoVel.array[i]=vel;
}
// corde di delimitazione con i colori delle zone
creaCorde(scene);
{
  const mtx=new THREE.Matrix4();
  const mk=[[HL,0xffffff],[HL-2,0xe11d2a],[HL-5,0xe11d2a],[HL-6,0xfacc15],[0,0xffffff],[-HL,0xffffff],[-HL+2,0xe11d2a],[-HL+5,0xe11d2a],[-HL+6,0xfacc15]];
  // Stessi 18 segni e colori, inviati insieme anziché come 18 oggetti.
  const segni=new THREE.InstancedMesh(new THREE.BoxGeometry(0.35,0.06,0.9),new THREE.MeshLambertMaterial({color:0xffffff}),mk.length*2);
  let segno=0;
  for(const [x,c] of mk) for(const zs of [-PZ-0.6,PZ+0.6]){
    segni.setMatrixAt(segno,mtx.makeTranslation(x,0.34,zs)); segni.setColorAt(segno++,new THREE.Color(c));
  }
  scene.add(segni);
}
// porte
export function makeGoal(sign){
  return creaPorta(scene,sign);
}
makeGoal(1); makeGoal(-1);

// palla + ombra + anello del giocatore controllato
// Palla da pallanuoto gialla e blu come nel concept: 18 spicchi a gruppi di tre (la striscia di mezzo di ogni spicchio è blu),
// separati da solchi scuri, con la buccia a puntini. Disegno calcolato punto per punto sulla sfera, così i solchi sono curve
// esatte e non si deformano ai poli. Un po' più grande del vero (1,3), per leggerla anche da lontano.
export const ball3d = (()=>{
  const W=1024, H=512, tela=document.createElement('canvas'); tela.width=W; tela.height=H;
  const xg=tela.getContext('2d'), ig=xg.createImageData(W,H);
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
      const k=(j*W+i)*4, s1=1-solco, blu=Math.floor((u+1)*1.5)===1;
      ig.data[k]=(blu?28:250*luce)*s1+20*solco; ig.data[k+1]=(blu?78:203*luce)*s1+22*solco; ig.data[k+2]=(blu?196:22*luce)*s1+40*solco; ig.data[k+3]=255;
    } }
  xg.putImageData(ig,0,0);
  const tg=new THREE.CanvasTexture(tela); tg.colorSpace=THREE.SRGBColorSpace; tg.anisotropy=4;
  const m=new THREE.Mesh(new THREE.SphereGeometry(BRV,32,24),sottAcqua(new THREE.MeshPhysicalMaterial({map:tg,roughness:0.4,metalness:0,clearcoat:0.65,clearcoatRoughness:0.22,envMapIntensity:0.6})));
  m.scale.setScalar(1.3);
  return m;
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
export function setDpr(v){ dpr=v; }
