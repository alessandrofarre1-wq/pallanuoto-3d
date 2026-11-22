// Dettagli di mani e polsi nel renderer effettivo, senza ricalcolare la partita.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';
const casi=process.argv.find(a=>a.startsWith('--casi='))?.slice(7).split(',');
const out=process.argv[2]||'docs/immagini/v073/mani';fs.mkdirSync(out,{recursive:true});
const server=await createServer({logLevel:'warn',server:{host:'127.0.0.1',port:0}});await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
try{
  const page=await browser.newPage({viewport:{width:900,height:650},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{let s=73;window.__rnd=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return(s+.5)/4294967296;};performance.now=()=>0;window.requestAnimationFrame=cb=>{window.__raf=cb;};});
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:60000});
  await page.addStyleTag({content:'body>:not(canvas):not(script):not(style){display:none!important}'});
  await page.evaluate(async()=>{
    const [V,W,D]=await Promise.all([import('/src/grafica/render.js'),import('/src/grafica/scena.js'),import('/src/grafica/mani.js')]);
    const H=window.__pallanuoto;document.getElementById('goBtn').click();H.replay.interrompiReplay();
    const p=H.teams[0].players[4];
    Object.assign(H.game,{state:'play',time:100,clock:180,shot:20,after:null,fermoFallo:null});H.fight.active=false;
    for(const q of H.allPlayers){Object.assign(q,{x:8+q.i*.5,z:7,vx:0,vz:0,excluded:false,act:null,charging:false});q.mesh.g.visible=q===p;}
    Object.assign(p,{x:0,z:0,fx:1,fz:0,oriz:0,vx:0,vz:0,phase:0,stamina:1,act:null,charging:true,chargeT:.7});
    H.regole.giveBall(p);H.ball.raccordoPresa=null;p.mesh.spr.visible=false;
    const draw=W.renderer.render.bind(W.renderer);W.renderer.render=()=>{};window.__maniStudio={p,V,W,D,draw};
  });
  let scatti=0;
  for(const mano of ['D','S'])for(const vista of ['dorso','lato','palmo-libero']){
    if(casi&&!casi.includes(mano+'-'+vista))continue;
    const png=await page.evaluate(({mano,vista})=>{
      const {p,V,W,D,draw}=window.__maniStudio;p.mano=mano;W.ball3d.visible=true;
      for(let i=0;i<90;i++)V.render(1/60,100000+i*1000/60);
      const C=p.mesh.corpo,h=C.prese[mano],Vector=h.position.constructor,Quaternion=h.quaternion.constructor;
      if(vista==='palmo-libero'){
        for(let i=0;i<60;i++)D.aggiornaMani(C.mani,p,{manoS:mano==='S',ballHand:false,swim:false},1/60);
        W.ball3d.visible=false;
      }
      W.scene.updateMatrixWorld(true);
      const centro=h.getWorldPosition(new Vector()),q=h.getWorldQuaternion(new Quaternion());
      const normale=C.normaliPrese[mano].clone().applyQuaternion(q).normalize();
      const indice=C.radice.getObjectByName((mano==='S'?'left':'right')+'HandMiddle1').getWorldPosition(new Vector());
      const lungo=indice.sub(centro).normalize(),su=new Vector().crossVectors(normale,lungo).normalize();
      const pos=centro.clone().addScaledVector(normale,vista==='dorso'?-.45:vista==='lato'?.15:.47).addScaledVector(lungo,.17).addScaledVector(su,.09);
      W.camera.near=.01;W.camera.fov=35;W.camera.aspect=900/650;W.camera.updateProjectionMatrix();W.camera.position.copy(pos);W.camera.lookAt(centro.clone().addScaledVector(lungo,.035));W.camera.updateMatrixWorld();
      W.renderer.info.reset();draw(W.scene,W.camera);
      return W.renderer.domElement.toDataURL('image/png');
    },{mano,vista});
    fs.writeFileSync(path.join(out,mano+'-'+vista+'.png'),Buffer.from(png.split(',')[1],'base64'));scatti++;
  }
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('PASS '+scatti+' viste reali di mani e polsi, zero errori');
}finally{await browser.close();await server.close();}
