// Regressione della mano rovesciata segnalata da Ale nel primo piano del gol.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {createServer} from 'vite';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=n=>process.argv.find(x=>x.startsWith('--'+n+'='))?.slice(n.length+3);
const before=arg('prima'),old=before?execFileSync('git',['show',before+':src/grafica/pose.js'],{cwd:root,encoding:'utf8'}):null;
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false,watch:null},plugins:before?[{name:'prima-mano',enforce:'pre',load:id=>id===path.join(root,'src/grafica/pose.js')?old:null}]:[]});
await server.listen();let browser;
try{
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{let n=74;window.__rnd=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return(n+.5)/4294967296;};window.requestAnimationFrame=()=>1;});
 await page.goto(server.resolvedUrls.local[0]);
 await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{timeout:120000,polling:100});
 const result=await page.evaluate(async foto=>{
  const [S,P,W]=await Promise.all([import('/src/stato.js'),import('/src/grafica/pose.js'),import('/src/grafica/scena.js')]);
  const Vector3=W.camera.position.constructor,Quaternion=W.camera.quaternion.constructor;
  const real=W.renderer.render.bind(W.renderer);W.renderer.render=()=>{};const records=[],images=[];
  for(const dir of [1,-1]){
   S.teams[0].dir=dir;const p=S.teams[0].players[4];
   for(const q of S.allPlayers)q.mesh.g.visible=false;
   Object.assign(p,{x:0,z:0,fx:dir,fz:0,vx:0,vz:0,act:null,charging:false,excluded:false,oriz:0,phase:0,J:null,palmi:null,spina:null,giuntiVista:null,bracciaVista:null});p.mesh.g.visible=true;
   Object.assign(S.game,{state:'stop',time:100,timer:2.6,penalty:null});
   Object.assign(S.ball,{holder:null,state:'flight',inRete:true,shooter:p,tiroReplay:{uid:p.uid,numero:p.num}});
   const C=p.mesh.corpo,v=new Vector3(),q=new Quaternion(),w=new Vector3();
   for(let f=0;f<72;f++){
    S.game.time+=1/60;S.game.timer-=1/60;P.updateRig(p,1/60,S.game.time);
    if(f<42)continue;
    p.mesh.g.updateWorldMatrix(true,true);
    const palm=C.normaliPrese.D.clone().applyQuaternion(C.prese.D.getWorldQuaternion(q));
    const forward=new Vector3(dir,0,0),finger=C.bracci[1].mano.a.clone().applyQuaternion(C.ossa.manoD.getWorldQuaternion(q));
    const forearm=C.ossa.manoD.getWorldPosition(v).sub(C.ossa.avamD.getWorldPosition(w)).normalize();
    records.push({dir,t:2.6-S.game.timer,palmFront:palm.dot(forward),wristBend:Math.acos(Math.max(-1,Math.min(1,finger.dot(forearm))))*180/Math.PI,handY:C.ossa.manoD.getWorldPosition(v).y,headY:C.ossa.testa.getWorldPosition(w).y});
   }
   if(foto&&dir===1){
    W.ball3d.visible=false;W.freccia.visible=W.ring.visible=W.passMark.visible=false;
    for(const [name,pos]of [['fronte',[3.1,.9,.05]],['lato',[.1,.9,3.1]],['trequarti',[2.4,.9,1.8]]]){
     W.camera.position.set(...pos);W.camera.lookAt(0,.3,0);W.camera.fov=36;W.camera.updateProjectionMatrix();real(W.scene,W.camera);
     images.push({name,png:W.renderer.domElement.toDataURL('image/png')});
    }
   }
  }
  return {records,images};
 },!!arg('foto'));
 assert.deepEqual(errors,[]);
 const minPalm=Math.min(...result.records.map(r=>r.palmFront)),maxWrist=Math.max(...result.records.map(r=>r.wristBend));
 if(!before){
  assert.ok(minPalm>.8,'il palmo alzato guarda in avanti, non si rovescia: '+minPalm);
  assert.ok(maxWrist<15,'polso allineato all’avambraccio: '+maxWrist);
  assert.ok(result.records.every(r=>r.handY>r.headY),'mano realmente alzata nell’esultanza');
 }
 if(arg('foto')){fs.mkdirSync(arg('foto'),{recursive:true});for(const im of result.images)fs.writeFileSync(path.join(arg('foto'),im.name+'.png'),Buffer.from(im.png.split(',')[1],'base64'));}
 const report={before:before||null,samples:result.records.length,minPalmFront:minPalm,maxWristDegrees:maxWrist,records:result.records};
 if(arg('salva'))fs.writeFileSync(arg('salva'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({before:report.before,samples:report.samples,minPalmFront:minPalm,maxWristDegrees:maxWrist}));
 console.log(before?'MISURA baseline mano esultanza':'PASS mano esultanza: palmo e polso coerenti, entrambi i sensi del campo');
}finally{await browser?.close();await server.close();}
