// Misure dello scheletro GLB e filmato dei gesti controllati, prima/dopo.
// Non simula una partita: isola articolazioni e stessa temporizzazione dell'azione.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
const arg=(n,d)=>process.argv.find(s=>s.startsWith('--'+n+'='))?.slice(n.length+3)||d;
const out=arg('out','/tmp/v049-gesti'),dist=arg('dist','dist'),filmato=process.argv.includes('--filmato');
fs.mkdirSync(out,{recursive:true});
const server=await preview({logLevel:'warn',build:{outDir:dist},preview:{host:'127.0.0.1',port:0}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:720,height:480},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{let seed=71;window.__rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return(seed+.5)/4294967296;};window.__now=0;performance.now=()=>window.__now;window.requestAnimationFrame=cb=>{window.__raf=cb;};});
 await page.goto(server.resolvedUrls.local[0]);await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:60000});
 await page.addStyleTag({content:'#menu,#hud,#tac,#player,#touch,#cronaca,#tLog,#fight,#fps,#espulsioni,#qte,#replayOverlay,#ruota{display:none!important}'});
 await page.evaluate(()=>{
  const H=window.__pallanuoto,R=H.renderer,draw=R.render;R.render=()=>{};
  const p=H.teams[0].players[4];H.__setCtrl(p);H.replay.interrompiReplay();
  H.vista={pos:[.5,1.3,4.3],look:[0,.1,0],fov:36};H.game.state='paused';
  for(const q of H.allPlayers){Object.assign(q,{x:11,z:9,vx:0,vz:0,act:null,excluded:false,oriz:0});q.mesh.g.visible=q===p;}
  window.__gesti={H,R,draw,p};
 });
 const righe=[],foto=[];let fotogramma=0;
 for(const mano of ['D','S'])for(const tipo of ['shot','pass','beduina','nuoto']){
  await page.evaluate(({tipo,mano})=>{
   const {H,p}=window.__gesti;Object.assign(p,{mano,x:0,z:0,fx:tipo==='beduina'?-1:1,fz:0,vx:tipo==='nuoto'?1.8:0,vz:0,oriz:tipo==='nuoto'?1:0,phase:0,act:null,charging:false,J:null,palmi:null,spina:null,orizPrec:0});
   H.game.time=200;H.game.state='paused';Object.assign(H.ball,{state:tipo==='nuoto'?'free':'held',holder:tipo==='nuoto'?null:p,kind:null,inRete:false,shooter:null,spruzzo:null,x:10,y:.1,z:8,vx:0,vy:0,vz:0});
   if(tipo!=='nuoto')H.prova.startAct(p,tipo,tipo==='pass'?.25:.45,()=>{});
   window.__gesti.a=p.act;window.__gesti.rilasciato=false;
  },{tipo,mano});
  for(let f=0;f<=90;f++){
   const scatta=filmato&&mano==='D'&&f%2===0;
   const r=await page.evaluate(({f,scatta,tipo,mano})=>{
    const {H,R,draw,p,a}=window.__gesti,dt=1/60,t=f*dt;
    if(a){a.t=Math.max(0,t-.2);a.done=t>=.2+a.wind+a.frusta;p.act=t<.2?null:a;
     if(a.done&&!window.__gesti.rilasciato){H.prova.doShoot(p,.85,false,0);window.__gesti.rilasciato=true;}
     if(t>.2+a.wind+a.frusta+.36)p.act=null;
    }
    if(window.__gesti.rilasciato){H.palla.passoPalla(H.ball,dt,H.allPlayers);H.ball.flightT+=dt;}
    window.__now+=1000/60;R.render=scatta?draw:()=>{};window.__raf(window.__now);R.render=()=>{};
    const C=p.mesh.corpo,O=C.ossa,V=O.manoD.position.clone(),pos=b=>b.getWorldPosition(V.clone()),q=b=>b.getWorldQuaternion(b.quaternion.clone());
    const S=pos(O['brac'+mano]),E=pos(O['avam'+mano]),M=pos(O['mano'+mano]),su=S.clone().sub(E).normalize(),giu=M.clone().sub(E).normalize();
    const elbow=Math.acos(Math.max(-1,Math.min(1,su.dot(giu))))*180/Math.PI;
    const asse=O['mano'+mano].position.clone().normalize().transformDirection(O['mano'+mano].matrixWorld);
    const wrist=Math.acos(Math.max(-1,Math.min(1,giu.dot(asse))))*180/Math.PI;
    const palmo=V.clone().set(0,0,1).transformDirection(O['mano'+mano].matrixWorld);palmo.addScaledVector(asse,-palmo.dot(asse)).normalize();
    const wristSigned=Math.atan2(-giu.dot(palmo),giu.dot(asse))*180/Math.PI;
    const torace=C.schiena[C.schiena.length-1],rel=q(O.bacino).invert().multiply(q(torace));
    const grezzo=2*Math.atan2(rel.y,rel.w)*180/Math.PI,torso=((grezzo+180)%360+360)%360-180;
    const quatError=Math.max(...[O.bracD,O.avamD,O.manoD,O.bracS,O.avamS,O.manoS,...C.schiena].map(o=>Math.abs(1-o.quaternion.length())));
    return {tipo,mano,t,elbow,wrist,wristSigned,torso,quatError,fase:a?(t<.2?'attesa':!a.done?'carica':p.act?'chiusura':'riposo'):'nuoto',immagine:scatta?R.domElement.toDataURL():undefined};
   },{f,scatta,tipo,mano});
   if(r.immagine){const nome=String(fotogramma++).padStart(4,'0')+'.png';fs.writeFileSync(path.join(out,nome),Buffer.from(r.immagine.split(',')[1],'base64'));foto.push({nome,tipo,t:r.t});delete r.immagine;}
   righe.push(r);
  }
 }
 const misure={};
 for(const mano of ['D','S'])for(const tipo of ['shot','pass','beduina','nuoto']){
  const a=righe.filter(x=>x.tipo===tipo&&x.mano===mano),range=k=>[Math.min(...a.map(x=>x[k])),Math.max(...a.map(x=>x[k]))];
  misure[tipo+mano]={gomito:range('elbow'),polso:range('wrist'),polsoConSegno:range('wristSigned'),torsione:range('torso'),quatError:Math.max(...a.map(x=>x.quatError)),carica:a.reduce((best,x)=>Math.abs(x.t-(tipo==='pass'?.45:.65))<Math.abs(best.t-(tipo==='pass'?.45:.65))?x:best),preRilascio:a.filter(x=>x.fase==='carica').at(-1)};
 }
 fs.writeFileSync(path.join(out,'misure.json'),JSON.stringify({misure,righe,foto,errori:errors},null,2)+'\n');
 if(process.argv.includes('--verifica')){
  for(const mano of ['D','S']){
   for(const tipo of ['shot','pass','beduina','nuoto']){
    const m=misure[tipo+mano];assert.ok(m.quatError<1e-6,'rotazioni unitarie '+tipo+mano);
    assert.ok([...m.gomito,...m.polso,...m.torsione].every(Number.isFinite),'articolazioni finite '+tipo+mano);
    assert.ok(m.gomito[0]>=25&&m.gomito[1]<=175,'gomito entro limiti anatomici '+tipo+mano);
   }
   const tiro=misure['shot'+mano],nuoto=misure['nuoto'+mano];
   assert.ok(tiro.carica.elbow>=55&&tiro.carica.elbow<=115,'gomito piegato in carica '+mano);
   assert.ok(Math.max(...tiro.torsione.map(Math.abs))>=25,'torace distinto dal bacino '+mano);
   assert.ok(tiro.polsoConSegno[1]-tiro.polsoConSegno[0]>=25,'polso articolato '+mano);
   assert.ok(nuoto.gomito[0]<100&&nuoto.gomito[1]>140,'recupero piegato e ingresso esteso '+mano);
  }
  const recuperi=await page.evaluate(()=>{
   const {H,p}=window.__gesti;let chiamate=0;Object.assign(H.game,{state:'stop',timer:10,after:null,time:200,clock:180,penalty:null,rigoriFinali:null});
   Object.assign(H.ball,{state:'held',holder:p,inRete:true});
   H.prova.startAct(p,'shot',.1,()=>{chiamate++;});const attesa=p.act;
   const step=n=>{for(let i=0;i<n;i++){window.__now+=1000/60;window.__raf(window.__now);}};
   step(20);const nonRilasciata=attesa.t===0&&p.act===attesa;
   attesa.done=true;step(60);const chiusa=p.act===null;
   H.prova.startAct(p,'shot',.1,()=>{chiamate++;});const fallo=p.act;fallo.done=true;H.ball.inRete=false;step(20);
   return {nonRilasciata,chiusa,falloInvariato:fallo.t===0&&p.act===fallo,chiamate,clock:H.game.clock,time:H.game.time};
  });
  assert.deepEqual(recuperi,{nonRilasciata:true,chiusa:true,falloInvariato:true,chiamate:0,clock:180,time:200});
  console.log('PASS articolazioni GLB, due mani, recupero gol senza nuove azioni e falli invariati');
 }
 console.log(JSON.stringify(misure));if(errors.length)throw new Error(errors.join('\n'));
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
