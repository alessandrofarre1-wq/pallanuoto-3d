// Diametro reale della mesh, appoggio sul palmo deformato e leggibilità nelle camere di gioco.
// Non avanza la partita e non cambia le quote fisiche: prova il solo disegno.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { P } from '../src/fisica-palla/parametri.js';
import { quotaGalleggiamentoVistaPalla, raggioVistaPalla } from '../src/grafica/dimensioni-palla.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(s=>s.startsWith('--'+k+'='))?.slice(k.length+3);
const h=raggioVistaPalla-quotaGalleggiamentoVistaPalla;
assert.ok(Math.abs(P.densitaAcqua*Math.PI*h*h*(3*raggioVistaPalla-h)/3-P.massa)<1e-12,'il volume immerso sostiene la massa regolamentare');
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
    const presa=p.mesh.corpo.prese[mano],palmo=new THREE.Vector3();presa.getWorldPosition(palmo);
    const centro=ball3d.position.clone(),direzione=palmo.clone().sub(centro).normalize(),ray=new THREE.Raycaster(centro,direzione,0,.5);
    const hit=ray.intersectObject(m,false)[0];
    camera.updateMatrixWorld(true);const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),r=diametro[0]/2;
    const a=centro.clone().addScaledVector(right,-r).project(camera),b=centro.clone().addScaledVector(right,r).project(camera);
    renderer.render=draw;renderer.info.reset();H.__ridisegna();const gpu={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};renderer.render=()=>{};
    const corpi=H.allPlayers.filter(q=>q.mesh.g.visible&&q.mesh.corpo?.radice.visible).length;
    out.push({mano,diametro,distanzaPalmo:hit?.distance??null,pixelCss:Math.abs(b.x-a.x)*innerWidth/2,corpi,gpu,fisicaImmutata:prima===dopo,png:foto?renderer.domElement.toDataURL('image/png'):null});
   }
   return out;
  },!!arg('foto'));
  assert.deepEqual(errors,[]);
  for(const q of rows){
   if(q.png){fs.mkdirSync(arg('foto'),{recursive:true});fs.writeFileSync(path.join(arg('foto'),`${width}-${q.mano}.png`),Buffer.from(q.png.split(',')[1],'base64'));}delete q.png;
   console.log(JSON.stringify({width,height,...q}));
   assert.ok(q.diametro.every(d=>Math.abs(d-.2212)<1e-5),'diametro world22,12cm, senza ingrandimento aggiuntivo');
   assert.ok(q.distanzaPalmo!==null,'la sfera ha davanti la superficie reale della mano');
   assert.ok(Math.abs(q.distanzaPalmo-.1106)<.005,'palla appoggiata sul palmo entro5mm, senza il vecchio distacco');
   assert.equal(q.fisicaImmutata,true,'render non avanza partita o fisica della palla');
   assert.equal(q.corpi,14);assert.ok(q.gpu.calls<100&&q.gpu.triangles<150000,'budget iPhone con14corpi');
   if(q.pixelCss<6)console.log(`AVVISO leggibilità: ${width}px ${q.mano}, diametro ${q.pixelCss.toFixed(2)}px CSS, inferiore al riferimento6px`);
   misure.push({width,height,...q});
  }
  await page.close();
 }
 if(arg('salva'))fs.writeFileSync(arg('salva'),JSON.stringify({raggioVistaPalla,quotaGalleggiamentoVistaPalla,misure},null,2));
 console.log('PASS dimensioni palla: sfera reale, palmo deformato, fisica ferma e budget');
}finally{if(browser)await browser.close();await server.close();}
