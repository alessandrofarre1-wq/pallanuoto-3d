// Arena statica: un atlante, una mesh. Le porte hanno un telaio e una rete ciascuna.
// Nessun modello ad alta risoluzione viene caricato durante la partita.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GH, GW, HL, HW, rndGrafica } from '../costanti.js';
import { sottAcqua } from './sottacqua.js';

const Y=new THREE.Vector3(0,1,0);
function unisci(pezzi){
  const g=mergeGeometries(pezzi); pezzi.forEach(p=>p.dispose()); return g;
}
function trasforma(g,x,y,z,rx=0,ry=0,rz=0){
  if(g.index){ const n=g.toNonIndexed(); g.dispose(); g=n; }
  const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(1,1,1));
  return g.applyMatrix4(m);
}
function colora(g,colore){
  const c=new THREE.Color(colore), a=new Float32Array(g.attributes.position.count*3);
  for(let i=0;i<a.length;i+=3){ a[i]=c.r; a[i+1]=c.g; a[i+2]=c.b; }
  g.setAttribute('color',new THREE.BufferAttribute(a,3)); return g;
}
function tela(w,h,disegna){
  const c=document.createElement('canvas'); c.width=w; c.height=h; disegna(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}

// Tutte le superfici dell'arena, compreso il pubblico ritagliato, condividono 1024².
function atlanteArena(){
  const celle={};
  const tex=tela(1024,1024,x=>{
    function cella(nome,c,r,disegna){
      const a=c*256, b=r*256; celle[nome]=[a+2,b+2,252,252];
      x.save(); x.translate(a,b); x.beginPath(); x.rect(0,0,256,256); x.clip(); disegna(); x.restore();
    }
    cella('bordo',0,0,()=>{
      x.fillStyle='#c7d2d8'; x.fillRect(0,0,256,256); x.strokeStyle='#a9bac3'; x.lineWidth=2;
      for(let i=0;i<=256;i+=64){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,256); x.stroke(); x.beginPath(); x.moveTo(0,i); x.lineTo(256,i); x.stroke(); }
      // Fughe con un bordo chiaro e grana antiscivolo: leggibili anche dal bordo vasca.
      x.fillStyle='#dce5e7'; for(let i=1;i<256;i+=64){ x.fillRect(i,2,1,254); x.fillRect(2,i,254,1); }
      x.fillStyle='rgba(255,255,255,.32)'; for(let i=0;i<250;i++) x.fillRect((i*97)%256,(i*53)%256,2,2);
      x.fillStyle='rgba(59,89,105,.12)'; for(let i=0;i<250;i++) x.fillRect((i*73+17)%256,(i*41+9)%256,1,1);
    });
    cella('cimasa',1,0,()=>{
      x.fillStyle='#f5f4e9'; x.fillRect(0,0,256,256); x.fillStyle='#c1c9c5';
      for(let i=0;i<256;i+=12) x.fillRect(i,0,2,256);
      x.fillStyle='#fffdf2'; x.fillRect(0,0,256,14); x.fillStyle='#aab9ba'; x.fillRect(0,242,256,14);
    });
    cella('griglia',2,0,()=>{
      x.fillStyle='#314d5d'; x.fillRect(0,0,256,256);
      for(let i=0;i<256;i+=16){
        x.fillStyle='#738c96'; x.fillRect(i+2,5,10,246);
        x.fillStyle='#dce4e6'; x.fillRect(i,4,8,248);
        x.fillStyle='#f1f6f3'; x.fillRect(i,5,2,245);
      }
      x.fillStyle='#a5b6bd'; x.fillRect(0,0,256,7); x.fillRect(0,249,256,7);
      x.fillStyle='#eff5f3'; x.fillRect(0,0,256,2); x.fillRect(0,249,256,2);
    });
    cella('cemento',3,0,()=>{
      x.fillStyle='#8fa5b6'; x.fillRect(0,0,256,256); x.fillStyle='#aebfca'; x.fillRect(0,0,256,12);
      x.fillStyle='#6d879b'; x.fillRect(0,236,256,20); x.strokeStyle='#8399aa'; x.lineWidth=2;
      x.strokeRect(1,1,254,254);
    });
    cella('parapetto',0,1,()=>{
      x.fillStyle='#13364d'; x.fillRect(0,0,256,256); x.fillStyle='#24b7cd'; x.fillRect(0,23,256,14);
      x.fillStyle='#d9eef1'; x.fillRect(0,0,256,9); x.fillStyle='#0d293e'; x.fillRect(0,221,256,35);
      x.strokeStyle='#1c4c63'; x.lineWidth=3; x.strokeRect(2,2,252,252);
    });
    const maglie=['#f2f5f1','#175ba6','#d83949','#f0c946','#20a098','#f2f5f1','#7994bc'];
    for(let v=0;v<2;v++) cella('pubblico'+v,1+v,1,()=>{
      // Silhouette in una sola fila, con vuoti fra i corpi: i gradoni restano visibili.
      for(let i=0;i<24;i++){
        if(rndGrafica()<0.12) continue;
        // La tessera quadrata sarà larga circa dodici volte la sua altezza:
        // le figure sono dipinte strette qui per avere proporzioni normali in 3D.
        const px=5+i*10.8, py=25+rndGrafica()*17, pelle=['#ddaa83','#bd815d','#efc4a1','#80543d'][Math.floor(rndGrafica()*4)];
        x.fillStyle='#143747'; x.fillRect(px-2.4,py+119,1.8,65); x.fillRect(px+0.6,py+119,1.8,65);
        x.fillStyle=maglie[Math.floor(rndGrafica()*maglie.length)];
        x.beginPath(); x.moveTo(px-2.5,py+24); x.lineTo(px+2.5,py+24); x.lineTo(px+2.3,py+125); x.lineTo(px-2.3,py+125); x.fill();
        x.strokeStyle=pelle; x.lineWidth=1.15; x.lineCap='round';
        x.beginPath(); x.moveTo(px-2.4,py+39); x.lineTo(px-3.6,py+102); x.moveTo(px+2.4,py+39); x.lineTo(px+3.6,py+96); x.stroke();
        x.fillStyle=pelle; x.beginPath(); x.ellipse(px,py+3,1.65,18,0,0,Math.PI*2); x.fill();
        x.fillStyle='#30313b'; x.beginPath(); x.ellipse(px,py-10,1.75,7,0,Math.PI,Math.PI*2); x.fill();
      }
    });
    cella('accesso',3,1,()=>{
      x.fillStyle='#13806c'; x.fillRect(0,0,256,256); x.strokeStyle='#e4fff1'; x.lineWidth=10; x.strokeRect(8,8,240,240);
      x.fillStyle='#f1fcf7'; x.font='bold 160px sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('USCITA ↑',128,140,220);
    });
    cella('seduta',0,2,()=>{
      x.fillStyle='#126b9c'; x.fillRect(0,0,256,256); x.fillStyle='#259fc2'; x.fillRect(0,0,256,30);
      x.strokeStyle='#08496e'; x.lineWidth=4; for(let i=0;i<256;i+=26) x.strokeRect(i+3,20,20,218);
      x.fillStyle='#4cb5cc'; for(let i=0;i<256;i+=26) x.fillRect(i+5,24,2,188);
      x.fillStyle='#083c5e'; x.fillRect(0,231,256,25);
    });
    cella('tavolo',1,2,()=>{
      x.fillStyle='#f1f0de'; x.fillRect(0,0,256,256); x.fillStyle='#214c63'; x.fillRect(0,90,256,166);
      x.fillStyle='#fff'; x.textAlign='center'; x.font='bold 35px sans-serif'; x.fillText('OFFICIALS',128,169);
      x.fillStyle='#24b7cd'; x.fillRect(0,209,256,12);
    });
    cella('ufficiale',2,2,()=>{
      x.fillStyle='#203a51'; x.fillRect(96,164,25,85); x.fillRect(132,164,25,85);
      x.fillStyle='#f4f6ec'; x.beginPath(); x.moveTo(43,72); x.lineTo(213,72); x.lineTo(177,171); x.lineTo(79,171); x.fill();
      x.strokeStyle='#deb18a'; x.lineWidth=20; x.lineCap='round'; x.beginPath(); x.moveTo(53,87); x.lineTo(21,143); x.moveTo(203,87); x.lineTo(235,139); x.stroke();
      x.fillStyle='#deb18a'; x.beginPath(); x.ellipse(128,43,35,21,0,0,7); x.fill();
      x.fillStyle='#24374a'; x.beginPath(); x.ellipse(128,27,36,9,0,Math.PI,7); x.fill();
      x.fillStyle='#1994a7'; x.fillRect(123,76,10,74); x.fillStyle='#172f41'; x.fillRect(130,111,20,28);
    });
    cella('scala',3,2,()=>{
      x.fillStyle='#a6b6bf'; x.fillRect(0,0,256,256); x.fillStyle='#f5eac0'; x.fillRect(0,0,256,28);
      x.fillStyle='#dce5e8'; x.fillRect(0,28,256,12); x.fillStyle='#728b9e'; x.fillRect(0,220,256,36);
    });
    // Striscia larga: testi leggibili anche dalla regia di partita.
    celle.cartelloni=[2,770,1020,250];
    const nomi=['WATERPOLO 7','MILANO','WATERPOLO 7','FORZA AZZURRI','WATERPOLO 7'];
    for(let i=0;i<5;i++){
      x.fillStyle=i%2?'#087d91':'#102e48'; x.fillRect(i*205,768,206,256);
      x.fillStyle='#28c2d3'; x.fillRect(i*205,768,205,12); x.fillStyle='#fff'; x.font='900 120px sans-serif'; x.textAlign='center'; x.textBaseline='middle';
      x.fillText(nomi[i],i*205+102,874,193); x.fillStyle='#7dd7df'; x.font='42px sans-serif'; x.fillText('INTERNATIONAL WATER POLO',i*205+102,964,190);
    }
  });
  return {tex,celle};
}

export function creaArena(scene,PX,PZ){
  const {tex,celle}=atlanteArena(), pezzi=[];
  function pezzo(g,cella,x,y,z,rx=0,ry=0,rz=0){
    const piano=g.type==='PlaneGeometry', wP=g.parameters?.width, hP=g.parameters?.height;
    g=trasforma(g,x,y,z,rx,ry,rz);
    const [a,b,w,h]=celle[cella], uv=g.attributes.uv, rettangoli=[];
    for(let i=0;i<uv.count;i++){
      let u=uv.getX(i), v=uv.getY(i);
      if(piano&&cella==='bordo'){ u*=wP/3.6; v*=hP/3.6; }
      if(piano&&(cella==='griglia'||cella==='cimasa')){
        if(hP>wP){ const temp=u; u=v; v=temp; }
        u*=Math.max(wP,hP)/(cella==='griglia'?0.45:1.2);
      }
      uv.setXY(i,u,v); rettangoli.push(a/1024,1-(b+h)/1024,w/1024,h/1024);
    }
    g.setAttribute('aRettangolo',new THREE.Float32BufferAttribute(rettangoli,4));
    pezzi.push(g);
  }
  const scatola=(w,h,d,c,x,y,z)=>pezzo(new THREE.BoxGeometry(w,h,d),c,x,y,z);
  const piano=(w,d,c,x,y,z)=>pezzo(new THREE.PlaneGeometry(w,d),c,x,y,z,-Math.PI/2);
  // Tre superfici per lato: fronte, smusso e appoggio. La cimasa non è più un foglio sospeso.
  function cimasa(lunghezza,x,z,ry){
    const profilo=[[0,0.23],[0,0.33],[0.035,0.365],[0.4,0.365]], pos=[], uv=[];
    for(let i=0;i<profilo.length-1;i++){
      const [za,ya]=profilo[i], [zb,yb]=profilo[i+1], a=-lunghezza/2, b=lunghezza/2;
      pos.push(a,ya,za,b,ya,za,b,yb,zb,a,ya,za,b,yb,zb,a,yb,zb);
      const u=lunghezza/1.2;
      uv.push(0,0.04,u,0.04,u,0.96,0,0.04,u,0.96,0,0.96);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.computeVertexNormals();
    pezzo(g,'cimasa',x,0,z,0,ry);
  }
  for(const s of [-1,1]){
    piano(PX*2+14.6,7,'bordo',0,0.3,s*(PZ+3.8));
    piano(7,PZ*2+0.6,'bordo',s*(PX+3.8),0.3,0);
    cimasa(PX*2+0.8,0,s*PZ,s>0?0:Math.PI);
    cimasa(PZ*2,s*PX,0,s*Math.PI/2);
    piano(PX*2+1.1,0.20,'griglia',0,0.37,s*(PZ+0.52));
    piano(0.20,PZ*2+0.6,'griglia',s*(PX+0.52),0.37,0);
    pezzo(new THREE.PlaneGeometry(PX*2+14.6,0.3),'cemento',0,0.15,s*(PZ+7.3));
    pezzo(new THREE.PlaneGeometry(PZ*2+14.6,0.3),'cemento',s*(PX+7.3),0.15,0,0,Math.PI/2);
  }
  // Pedata e alzata sono geometria vera; le corsie d'accesso lasciano vuoti nel pubblico.
  const file=8, larghezza=44, fronte=-PZ-5.4, passo=0.82, salita=0.52;
  for(let r=0;r<file;r++){
    const y=0.3+(r+1)*salita, z=fronte-r*passo;
    piano(larghezza,passo,'cemento',0,y,z-passo/2);
    pezzo(new THREE.PlaneGeometry(larghezza,salita),'cemento',0,y-salita/2,z);
    for(const x of [-7.5,7.5]) piano(1.35,passo,'scala',x,y+0.006,z-passo/2);
    for(const [x,w] of [[-15.1,13.8],[0,13.2],[15.1,13.8]])
      pezzo(new THREE.PlaneGeometry(w,1.15),'pubblico'+(r%2),x,y+0.33,z-passo*0.55);
  }
  for(const [x,w] of [[-15.1,13.8],[0,13.2],[15.1,13.8]]) scatola(w,0.8,0.18,'parapetto',x,0.7,fronte+0.06);
  for(const x of [-7.5,7.5]) pezzo(new THREE.PlaneGeometry(1.25,0.35),'accesso',x,4.83,fronte-file*passo+0.09);
  scatola(larghezza,0.7,0.16,'parapetto',0,4.82,fronte-file*passo);
  scatola(larghezza,0.09,0.25,'cimasa',0,5.22,fronte-file*passo);
  // Parapetti laterali bassi: nessun elemento fra camera e acqua.
  for(const x of [-22,22]){
    const g=new THREE.BoxGeometry(0.12,0.6,Math.hypot(file*passo,file*salita));
    pezzo(g,'parapetto',x,2.72,fronte-file*passo/2,Math.atan2(salita,passo));
    const lato=new THREE.BufferGeometry();
    lato.setAttribute('position',new THREE.Float32BufferAttribute([0,0.3,0,0,0.3+salita,0,0,0.3+file*salita,-file*passo,0,0.3,0,0,0.3+file*salita,-file*passo,0,0.3,-file*passo],3));
    lato.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,0,1,1,1,0,0,1,1,1,0],2)); lato.computeVertexNormals();
    pezzo(lato,'cemento',x,0,fronte);
  }
  pezzo(new THREE.PlaneGeometry(larghezza,file*salita),'cemento',0,0.3+file*salita/2,fronte-file*passo);
  pezzo(new THREE.PlaneGeometry(32,0.96),'cartelloni',0,0.82,-PZ-2.8);
  // Due testate basse, sul pavimento esterno e arretrate rispetto alle porte.
  // Lasciano libera la fascia z>6 verso la camera laterale; nessun nuovo materiale o mesh.
  for(const s of [-1,1]){
    const fronteX=PX+2.8, file=3, passo=0.82, salita=0.34, base=0.34, centroZ=-1.2, larghezza=14.4;
    const profondita=file*passo, retro=fronteX+profondita, alto=base+file*salita;
    scatola(profondita+0.4,0.08,larghezza+0.4,'cemento',s*(fronteX+profondita/2),0.30,centroZ);
    for(let r=0;r<file;r++){
      const y=base+(r+1)*salita, x=fronteX+(r+0.5)*passo;
      piano(passo,larghezza,'cemento',s*x,y,centroZ);
      pezzo(new THREE.PlaneGeometry(larghezza,salita),'cemento',s*(fronteX+r*passo),y-salita/2,centroZ,0,-s*Math.PI/2);
      piano(passo,0.9,'scala',s*x,y+0.006,centroZ+larghezza/2-0.7);
      pezzo(new THREE.PlaneGeometry(13.2,1.1),'pubblico'+(r%2),s*x,y+0.28,centroZ-0.6,0,-s*Math.PI/2);
    }
    scatola(0.12,0.38,larghezza,'parapetto',s*(fronteX-0.04),base+0.19,centroZ);
    scatola(0.12,0.45,larghezza,'parapetto',s*(retro+0.04),alto+0.225,centroZ);
    pezzo(new THREE.PlaneGeometry(larghezza,file*salita),'cemento',s*retro,base+file*salita/2,centroZ,0,s*Math.PI/2);
    // Chiusure a gradini: sotto la tribuna non si vede il vuoto nelle riprese di tre quarti.
    const sagoma=new THREE.Shape(); sagoma.moveTo(0,0);
    for(let r=0;r<file;r++){ sagoma.lineTo(r*passo,(r+1)*salita); sagoma.lineTo((r+1)*passo,(r+1)*salita); }
    sagoma.lineTo(profondita,0); sagoma.closePath();
    for(const z of [centroZ-larghezza/2,centroZ+larghezza/2]){
      const lato=new THREE.ShapeGeometry(sagoma); lato.scale(s,1,1);
      pezzo(lato,'cemento',s*fronteX,base,z);
    }
  }
  // Due panchine e tavolo degli ufficiali, fuori dal corridoio lungo la vasca.
  for(const s of [-1,1]){
    const x=s*9.6, z=-PZ-1.8;
    scatola(5.4,0.14,0.65,'seduta',x,0.8,z);
    scatola(5.4,0.62,0.10,'seduta',x,1.12,z-0.30);
    for(const dx of [-2.1,2.1]) scatola(0.14,0.44,0.52,'parapetto',x+dx,0.53,z);
  }
  scatola(3.2,0.12,0.82,'cimasa',0,1.02,-PZ-1.7);
  scatola(3.0,0.62,0.10,'tavolo',0,0.69,-PZ-1.27);
  for(const x of [-1.25,1.25]) scatola(0.12,0.64,0.6,'parapetto',x,0.63,-PZ-1.7);
  for(const x of [-0.82,0.82]) pezzo(new THREE.PlaneGeometry(0.6,1.35),'ufficiale',x,1.1,-PZ-2.03);
  const m=new THREE.MeshLambertMaterial({map:tex,side:THREE.DoubleSide,alphaTest:0.35});
  // Ripete ogni tessera entro il suo rettangolo, così una griglia lunga trenta
  // metri conserva fessure piccole senza creare altri oggetti o grandi immagini.
  m.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n attribute vec4 aRettangolo; varying vec4 vRettangolo;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\n vRettangolo=aRettangolo;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n varying vec4 vRettangolo;')
      .replace('#include <map_fragment>','vec4 sampledDiffuseColor=texture2D(map,vRettangolo.xy+fract(vMapUv)*vRettangolo.zw); diffuseColor*=sampledDiffuseColor;');
  };
  m.customProgramCacheKey=()=>'arena-atlante-ripetuto-v040';
  m.forceSinglePass=true;
  const arena=new THREE.Mesh(unisci(pezzi),m); arena.name='Arena — gradoni, pubblico, bordo e ufficiali'; scene.add(arena);
  return arena;
}

let telaioPorta, retePorta, materialeTelaio, materialeRete;
function preparaPorta(){
  const pezzi=[];
  const aggiungi=(g,x,y,z,rx=0,ry=0,rz=0,c=0xffffff)=>pezzi.push(colora(trasforma(g,x,y,z,rx,ry,rz),c));
  const tubo=(a,b,r=0.025)=>{
    const p=new THREE.Vector3(...a), q=new THREE.Vector3(...b), d=q.clone().sub(p), g=new THREE.CylinderGeometry(r,r,d.length(),6);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y,d.normalize()));
    const centro=p.add(q).multiplyScalar(0.5); aggiungi(g,centro.x,centro.y,centro.z);
  };
  for(const z of [-GW-0.04,GW+0.04]){
    aggiungi(new THREE.BoxGeometry(0.08,GH+0.3,0.08),0,(GH+0.3)/2-0.3,z);
    aggiungi(new THREE.CapsuleGeometry(0.095,0.82,2,8),0.42,-0.025,z,0,0,-Math.PI/2);
    tubo([0.07,GH+0.015,z],[0.8,GH-0.015,z]);
    tubo([0.8,GH-0.015,z],[0.86,0.04,z]);
    for(const x of [0.18,0.66]) aggiungi(new THREE.BoxGeometry(0.045,0.19,0.205),x,-0.025,z,0,0,0,0xc2ccd0);
    // Legature della rete, appena sotto la traversa e sui sostegni.
    for(const x of [0.04,0.77]) aggiungi(new THREE.BoxGeometry(0.04,0.065,0.105),x,GH-0.01,z,0,0,0,0xe1e8e7);
  }
  aggiungi(new THREE.BoxGeometry(0.08,0.08,GW*2+0.16),0,GH+0.04,0);
  tubo([0.8,0.04,-GW-0.04],[0.8,0.04,GW+0.04]);
  tubo([0.8,GH-0.015,-GW-0.04],[0.8,GH-0.015,GW+0.04]);
  telaioPorta=unisci(pezzi);
  materialeTelaio=sottAcqua(new THREE.MeshPhongMaterial({color:0xffffff,vertexColors:true,shininess:65}));
  const texture=tela(256,256,x=>{
    x.strokeStyle='rgba(242,250,245,.95)'; x.lineWidth=4;
    for(let i=0;i<=256;i+=64){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,256); x.moveTo(0,i); x.lineTo(256,i); x.stroke(); }
    x.fillStyle='#f7fff9'; for(let i=0;i<=256;i+=64) for(let j=0;j<=256;j+=64){ x.beginPath(); x.arc(i,j,2.4,0,7); x.fill(); }
  });
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  const pannelli=[];
  function pannello(w,h,x,y,z,rx=0,ry=0){
    const g=trasforma(new THREE.PlaneGeometry(w,h),x,y,z,rx,ry), uv=g.attributes.uv;
    for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*w/0.48,uv.getY(i)*h/0.48);
    pannelli.push(g);
  }
  const H=GH+0.34;
  pannello(GW*2+0.16,H,0.8,H/2-0.3,0,0,Math.PI/2);
  pannello(0.8,GW*2+0.16,0.4,GH+0.04,0,-Math.PI/2);
  for(const z of [-GW-0.08,GW+0.08]) pannello(0.8,H,0.4,H/2-0.3,z);
  retePorta=unisci(pannelli);
  materialeRete=sottAcqua(new THREE.MeshLambertMaterial({map:texture,color:0xeaf4ec,side:THREE.DoubleSide,alphaTest:0.035,alphaToCoverage:true}));
  materialeRete.forceSinglePass=true;
}

export function creaPorta(scene,sign){
  if(!telaioPorta) preparaPorta();
  const g=new THREE.Group(); g.name='Porta 3 × 0,90 m';
  const frame=new THREE.Mesh(telaioPorta,materialeTelaio), net=new THREE.Mesh(retePorta,materialeRete);
  frame.name='Telaio 80 mm e galleggianti'; net.name='Rete profonda 0,80 m'; g.add(frame,net);
  g.position.x=sign*HL; g.rotation.y=sign>0?0:Math.PI; scene.add(g); return g;
}

// Rulli esagonali con testate e cavo continuo: 22 triangoli per galleggiante
// contro i 24 delle sfere precedenti. Un solo invio per tutti i colori.
export function creaCorde(scene){
  const side=new THREE.CylinderGeometry(0.085,0.085,0.18,6,1,true); side.rotateZ(-Math.PI/2);
  const parti=[side.toNonIndexed()]; side.dispose();
  const pos=[], uv=[];
  for(const s of [-1,1]) for(let i=1;i<5;i++){
    const punti=[0,i,i+1].map(j=>[s*0.09,Math.sin(j*Math.PI/3)*0.085,Math.cos(j*Math.PI/3)*0.085]);
    if(s<0) punti.reverse();
    for(const p of punti){ pos.push(...p); uv.push(0.5,0.5); }
  }
  const caps=new THREE.BufferGeometry(); caps.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); caps.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); caps.computeVertexNormals(); parti.push(caps);
  const cavo=trasforma(new THREE.PlaneGeometry(0.31,0.022),0,0,0,-Math.PI/2);
  for(let i=0;i<cavo.attributes.uv.count;i++) cavo.attributes.uv.setY(i,2); parti.push(cavo);
  const g=unisci(parti), punti=[];
  for(const z of [-HW-0.2,HW+0.2]) for(let x=-HL;x<=HL+0.01;x+=0.3){ const a=HL-Math.abs(x); punti.push([x,z,0,a<2?0xe73440:a<6?0xffd733:0x2ebf7b]); }
  for(const x of [-HL-0.6,HL+0.6]) for(let z=-HW;z<=HW;z+=0.3) punti.push([x,z,Math.PI/2,0xf4f7ed]);
  const map=tela(64,128,x=>{
    x.fillStyle='#f3f5ef'; x.fillRect(0,0,64,128);
    for(let y=12;y<128;y+=24){ x.fillStyle='#c1cbc6'; x.fillRect(0,y,64,3); x.fillStyle='#fff'; x.fillRect(0,y+3,64,4); }
  });
  const m=new THREE.MeshPhongMaterial({map,color:0xffffff,shininess:48,side:THREE.DoubleSide});
  m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.13,0.18,0.17),step(1.5,vMapUv.y));'); };
  sottAcqua(m,{chiave:'corde-rulli-cavo-v040'});
  const corde=new THREE.InstancedMesh(g,m,punti.length), matrix=new THREE.Matrix4(), q=new THREE.Quaternion();
  punti.forEach(([x,z,a,c],i)=>{
    matrix.compose(new THREE.Vector3(x,0.04,z),q.setFromAxisAngle(Y,a),new THREE.Vector3(1,1,1));
    corde.setMatrixAt(i,matrix); corde.setColorAt(i,new THREE.Color(c));
  });
  corde.name='Corde con rulli e cavo'; scene.add(corde); return corde;
}
