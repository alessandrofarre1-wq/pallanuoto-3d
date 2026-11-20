// Stessa scena e stessa camera prima/dopo: dettagli dell'arena e budget iPhone,
// inclusi due cambi reali. Nessuna misura degli FPS del dispositivo fisico.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';

const arg=(k,d)=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3)||d;
const out=arg('out','/tmp/arena-v068'),dist=arg('dist','dist');
fs.mkdirSync(out,{recursive:true});
const server=await preview({logLevel:'warn',build:{outDir:dist},preview:{host:'127.0.0.1',port:0}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try{
 for(const viewport of [{width:844,height:390},{width:667,height:375}]){
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,deviceScaleFactor:1.5});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{
   let a=68;window.__rnd=()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return(a+.5)/4294967296;};
   window.__now=0;performance.now=()=>window.__now;window.requestAnimationFrame=f=>{window.__raf=f;return 1;};
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:120000});
  await page.evaluate(()=>{
   const H=window.__pallanuoto;document.getElementById('goBtn').click();H.replay.interrompiReplay();
   H.game.state='paused';H.game.time=100;H.game.possTeam=H.teams[0];H.game.possT=100;
   const places=[[12,0],[9.6,0],[10,5.2],[10,-5.2],[6,3.9],[6,-3.9],[4.3,0]];
   for(const p of H.allPlayers){
    const [x,z]=places[p.i],att=p.team.idx===0;
    Object.assign(p,{x:p.isGK?(att?-12:12):x+(att?0:1.3),z:z+(att?0:.25),vx:0,vz:0,fx:att?1:-1,fz:0,
     oriz:0,act:null,charging:false,excluded:false,uscendo:false,stamina:1,phase:p.i*.6,J:null,palmi:null,spina:null,orizPrec:0});
   }
   H.regole.giveBall(H.teams[0].players[4]);H.__setCtrl(H.teams[0].players[4]);H.ball.x=6;H.ball.z=3.9;
   window.__arenaDraw=H.renderer.render.bind(H.renderer);H.renderer.render=()=>{};
   window.__arenaStep=(n,gpu=false)=>{for(let i=0;i<n;i++){H.renderer.render=gpu&&i===n-1?window.__arenaDraw:()=>{};window.__now+=1000/60;window.__raf(window.__now);}H.renderer.render=()=>{};};
   window.__arenaStep(120);
  });
  for(const [name,vista] of [
   ['tv',null],
   ['arena',{pos:[26,19,29],look:[0,.2,0],fov:50}],
   ['porta',{pos:[17,3,7],look:[12.5,.4,0],fov:42}],
   ['bordo',{pos:[4,3,-16],look:[0,.7,-10],fov:54}]
  ]){
   const r=await page.evaluate(vista=>{
    const H=window.__pallanuoto;H.vista=vista;window.__arenaStep(80);window.__arenaStep(1,true);
    return {calls:H.renderer.info.render.calls,tri:H.renderer.info.render.triangles,dpr:H.renderer.getPixelRatio(),
     image:H.renderer.domElement.toDataURL(),corpi:H.allPlayers.filter(p=>p.mesh.g.visible).length};
   },vista);
   fs.writeFileSync(path.join(out,`${viewport.width}-${name}.png`),Buffer.from(r.image.split(',')[1],'base64'));delete r.image;
   results.push({viewport:viewport.width,scena:name,...r});
   if(name==='tv'){assert.ok(r.calls<100&&r.tri<150000,'budget iPhone in partita');assert.equal(r.corpi,14);}
  }
  const cambio=await page.evaluate(()=>{
   const H=window.__pallanuoto;H.vista=null;H.game.state='play';H.game.cambiLiberi=false;H.game.autoplay=true;
   for(const t of H.teams){t.human=false;t.prossimoControllo=Infinity;const p=t.players.find(p=>!p.isGK&&p!==H.ball.holder),g=t.rosa.find(g=>!g.inAcqua&&!g.fuori&&g.ruolo!==0);H.panchina.chiediCambio(t,p,g,true);}
   const frames=[];
   for(let i=0;i<1200;i++){window.__arenaStep(1,i%60===0);if(i%60===0)frames.push({...H.renderer.info.render});}
   window.__arenaStep(1,true);
   return {calls:Math.max(...frames.map(r=>r.calls)),tri:Math.max(...frames.map(r=>r.triangles)),samples:frames,
    image:H.renderer.domElement.toDataURL()};
  });
  fs.writeFileSync(path.join(out,`${viewport.width}-cambi.png`),Buffer.from(cambio.image.split(',')[1],'base64'));delete cambio.image;
  results.push({viewport:viewport.width,scena:'cambi',...cambio});
  assert.ok(cambio.calls<100&&cambio.tri<150000,'budget iPhone durante due cambi');
  assert.deepEqual(errors,[],'errori console/WebGL');
  await context.close();
 }
 fs.writeFileSync(path.join(out,'misure.json'),JSON.stringify({dist,results},null,2)+'\n');
 console.log(JSON.stringify(results.map(({samples,...r})=>r)));
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
