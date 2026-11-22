// Scala relativa della mesh, appoggio sul palmo deformato e leggibilità nelle camere di gioco.
// Non avanza la partita e non cambia le quote fisiche: prova il solo disegno.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { P } from '../src/fisica-palla/parametri.js';
import { VIS } from '../src/scala-grafica.js';
import { quotaGalleggiamentoFisica, quotaGalleggiamentoVistaPalla, raggioVistaPalla } from '../src/grafica/dimensioni-palla.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(s=>s.startsWith('--'+k+'='))?.slice(k.length+3);
const h=P.raggioUrti-quotaGalleggiamentoFisica;
assert.ok(Math.abs(P.densitaAcqua*Math.PI*h*h*(3*P.raggioUrti-h)/3-P.massa)<1e-12,'il volume immerso sostiene la massa regolamentare');
assert.equal(raggioVistaPalla,P.raggioUrti,'palla e campo in metri regolamentari');
assert.equal(quotaGalleggiamentoFisica,quotaGalleggiamentoVistaPalla);
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false}});await server.listen();
let browser;
try{
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const misure=[];
 for(const width of [844,667]){
  const height=width===844?390:375;
  const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:1.5}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{let s=71;window.__rnd=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return(s+.5)/4294967296;};window.requestAnimationFrame=()=>1;});
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:120000});
  const rows=await page.evaluate(async foto=>{
   const H=window.__pallanuoto;document.getElementById('goBtn').click();H.replay.interrompiReplay();
   const THREE=await import('/node_modules/three/build/three.module.js');
   const {render}=await import('/src/grafica/render.js');
   const {scene,camera,renderer,ball3d}=await import('/src/grafica/scena.js');
   const {HL,HW}=await import('/src/costanti.js');
   Object.assign(H.game,{state:'play',time:100,clock:180,shot:20,penalty:null,rigoriFinali:null,fermoFallo:null,autoplay:false,after:null});H.fight.active=false;
   for(const t of H.teams){t.human=true;t.cambio=null;t.coda=[];t.prossimoControllo=Infinity;}
   for(const q of H.allPlayers){Object.assign(q,{x:q.isGK?-11.8*q.team.dir:5+q.i*.55,z:q.isGK?0:(q.i-3)*1.7,vx:0,vz:0,fx:q.team.dir,fz:0,oriz:0,orizPrec:0,act:null,charging:false,chargeT:0,excluded:false,uscendo:false,freeThrow:false,pressatoUntil:0,stunUntil:0,cut:null,girata:null,stamina:1});q.mesh.g.visible=true;}
   const p=H.teams[0].players[4];Object.assign(p,{x:6.5,z:4,fx:1,fz:0});H.regole.giveBall(p);H.__setCtrl(p);H.ball.raccordoPresa=null;
   const draw=renderer.render.bind(renderer);renderer.render=()=>{};H.vista=null;
   const out=[];
   for(const mano of ['D','S']){
    p.mano=mano;p.charging=true;p.chargeT=.7;
    const fisica=()=>JSON.stringify([H.game.time,H.game.clock,H.game.shot,H.ball.x,H.ball.y,H.ball.z,H.ball.vx,H.ball.vy,H.ball.vz,H.ball.state]);
    const prima=fisica();for(let i=0;i<90;i++)render(1/60,100000+i*1000/60);
    const dopo=fisica();scene.updateMatrixWorld(true);
    const bb=new THREE.Box3().setFromObject(ball3d),diametro=bb.getSize(new THREE.Vector3()).toArray();
    let m;p.mesh.corpo.radice.traverse(o=>{if(o.isSkinnedMesh)m=o;});m.skeleton.update();m.computeBoundingSphere();m.computeBoundingBox();
    const testa=new THREE.Box3(),vertice=new THREE.Vector3(),si=m.geometry.attributes.skinIndex,sw=m.geometry.attributes.skinWeight;
    for(let v=0;v<si.count;v++){let peso=0,osso=0;for(let k=0;k<4;k++)if(sw.getComponent(v,k)>peso){peso=sw.getComponent(v,k);osso=si.getComponent(v,k);}if(m.skeleton.bones[osso].name==='head'){m.getVertexPosition(v,vertice);testa.expandByPoint(m.localToWorld(vertice));}}
    const larghezzaTesta=testa.getSize(new THREE.Vector3()).z;
    const presa=p.mesh.corpo.prese[mano],palmo=new THREE.Vector3();presa.getWorldPosition(palmo);
    const centro=ball3d.position.clone(),direzione=palmo.clone().sub(centro).normalize(),ray=new THREE.Raycaster(centro,direzione,0,.5);
    const hit=ray.intersectObject(m,false)[0];
    camera.updateMatrixWorld(true);const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),r=diametro[0]/2;
    const a=centro.clone().addScaledVector(right,-r).project(camera),b=centro.clone().addScaledVector(right,r).project(camera);
    renderer.render=draw;renderer.info.reset();H.__ridisegna();const gpu={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};renderer.render=()=>{};
    const altezzeAtleti=H.allPlayers.map(q=>{let mesh;q.mesh.corpo.radice.traverse(o=>{if(o.isSkinnedMesh)mesh=o;});const box=new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position);const O=q.mesh.corpo.ossa,v=new THREE.Vector3(),w=new THREE.Vector3();return {nome:q.name,portiere:q.isGK,altezzaBindWorld:box.getSize(new THREE.Vector3()).y*q.mesh.corpo.scala*q.mesh.g.scale.y,spalle:O.bracD.getWorldPosition(v).distanceTo(O.bracS.getWorldPosition(w)),aperturaMani:O.manoD.getWorldPosition(v).distanceTo(O.manoS.getWorldPosition(w))};});
    const porte=scene.children.filter(q=>q.name==='Porta 3 × 0,90 m').map(g=>{const o=new THREE.Vector3(g.position.x,.45,0),misura=d=>new THREE.Raycaster(o,new THREE.Vector3(...d),0,4).intersectObject(g.children[0],false)[0]?.distance;return {x:g.position.x,luce:misura([0,0,1])+misura([0,0,-1]),altezza:.45+misura([0,1,0])};});
    const corpi=H.allPlayers.filter(q=>q.mesh.g.visible&&q.mesh.corpo?.radice.visible).length;
    out.push({mano,diametro,campo:[HL*2,HW*2],porte,altezzeAtleti,larghezzaTesta,rapportoPallaTesta:diametro[0]/larghezzaTesta,distanzaPalmo:hit?.distance??null,pixelCss:Math.abs(b.x-a.x)*innerWidth/2,corpi,gpu,fisicaImmutata:prima===dopo,png:foto?renderer.domElement.toDataURL('image/png'):null});
   }
   return out;
  },!!arg('foto'));
  assert.deepEqual(errors,[]);
  for(const q of rows){
   if(q.png){fs.mkdirSync(arg('foto'),{recursive:true});fs.writeFileSync(path.join(arg('foto'),`${width}-${q.mano}.png`),Buffer.from(q.png.split(',')[1],'base64'));}delete q.png;
   console.log(JSON.stringify({width,height,...q}));
   assert.ok(q.diametro.every(d=>Math.abs(d-2*P.raggioUrti)<1e-5),'diametro fisico e grafico22,12cm, corpi riportati a scala adulta');
   assert.ok(q.distanzaPalmo!==null,'la sfera ha davanti la superficie reale della mano');
   assert.ok(Math.abs(q.distanzaPalmo-raggioVistaPalla)<.005,'palla appoggiata sul palmo entro5mm, senza il vecchio distacco');
   assert.ok(q.rapportoPallaTesta>.7&&q.rapportoPallaTesta<1,'pallone coerente con testa cartoon, senza ripristinare la vecchia sfera39cm');
   assert.equal(VIS,1.1);
   assert.deepEqual(q.campo,[25,20]);assert.equal(q.porte.length,2);
   assert.ok(Math.abs(q.porte[0].x-q.porte[1].x)===25,'linee di porta a25m reali');
   for(const porta of q.porte){assert.ok(Math.abs(porta.luce-3)<1e-5,'luce vera mesh3m');assert.ok(Math.abs(porta.altezza-.9)<1e-5,'traversa vera mesh a0,9m');}
   for(const atleta of q.altezzeAtleti)assert.ok(atleta.altezzaBindWorld>1.8&&atleta.altezzaBindWorld<2.1,'altezza bind adulta compreso portiere '+JSON.stringify(atleta));
   assert.equal(q.fisicaImmutata,true,'render non avanza partita o fisica della palla');
   assert.equal(q.corpi,14);assert.ok(q.gpu.calls<100&&q.gpu.triangles<150000,'budget iPhone con14corpi');
   if(q.pixelCss<6)console.log(`AVVISO leggibilità: ${width}px ${q.mano}, diametro ${q.pixelCss.toFixed(2)}px CSS, inferiore al riferimento6px`);
   misure.push({width,height,...q});
  }
  await page.close();
 }
 if(arg('salva'))fs.writeFileSync(arg('salva'),JSON.stringify({raggioVistaPalla,quotaGalleggiamentoVistaPalla,misure},null,2));
 console.log('PASS dimensioni palla: scala dei corpi, palmo deformato, fisica ferma e budget');
}finally{if(browser)await browser.close();await server.close();}
