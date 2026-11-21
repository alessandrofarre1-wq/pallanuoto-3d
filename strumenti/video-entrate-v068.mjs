// Una vera azione IA: cerca il primo taglio coordinato senza imporre passaggi o posizioni.
// Acquisizione 30 fps simulati: non misura la velocità di rendering su iPhone.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';
const arg=(n,d)=>process.argv.find(s=>s.startsWith('--'+n+'='))?.slice(n.length+3)||d;
const out=arg('out','/tmp/v068-video-entrata');fs.mkdirSync(out,{recursive:true});
const server=await preview({logLevel:'warn',preview:{host:'127.0.0.1',port:0}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  let a=68;window.__rnd=()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return(a+.5)/4294967296;};
  window.__now=0;performance.now=()=>window.__now;window.requestAnimationFrame=f=>{window.__raf=f;return 1;};
  window.__passo=()=>{window.__now+=1000/60;window.__raf(window.__now);};
 });
 await page.goto(server.resolvedUrls.local[0]);
 await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:60000});
 const meta=await page.evaluate(()=>{
  const H=window.__pallanuoto;H.scegliSquadre('ITA','HUN');H.imposta('len','480');
  H.game.autoplay=true;for(const t of H.teams)t.human=false;document.getElementById('goBtn').click();
  const draw=H.renderer.render.bind(H.renderer);H.renderer.render=()=>{};
  for(let i=0;i<60*240;i++){
   window.__passo();
   const t=H.teams.find(t=>t.entrataAzione&&['A','B','C'].includes(t.entrataAzione.tipo)&&H.game.time-t.entrataAzione.t0<.05);
   if(!t||H.game.state!=='play')continue;
   const a=t.entrataAzione;
   const canvas=document.createElement('canvas');canvas.width=844;canvas.height=390;
   window.__videoEntrata={H,draw,canvas,inizio:H.game.time,traccia:[],campioni:[]};
   return {tipo:a.tipo,squadra:t.short,entrante:a.entrante.num,appoggio:a.appoggio?.num,entranteUid:a.entrante.uid,appoggioUid:a.appoggio?.uid,inizio:H.game.time,seme:68};
  }
  return null;
 });
 assert.ok(meta,'nessuna entrata coordinata osservata in240s: non inventare il filmato');
 fs.writeFileSync(path.join(out,'origine.json'),JSON.stringify(meta,null,2)+'\n');
 for(let f=0;f<120;f++){
  const image=await page.evaluate(meta=>{
   const v=window.__videoEntrata,{H,draw,canvas}=v;
   H.renderer.render=()=>{};window.__passo();H.renderer.render=draw;window.__passo();
   const ctx=canvas.getContext('2d');ctx.drawImage(H.renderer.domElement,0,0,844,390);
   ctx.fillStyle='rgba(3,19,31,.85)';ctx.fillRect(12,10,690,48);ctx.fillStyle='#fff';ctx.font='bold 16px sans-serif';
   const schema={A:'Pos. 3 → 5',B:'Pos. 3 → 1',C:'Pos. 2 al palo',D:'Mezza entrata'}[meta.tipo]||meta.tipo;
   ctx.fillText(`IA ${meta.squadra} · ${schema} · #${meta.entrante} taglia, #${meta.appoggio} appoggia`,22,30);
   ctx.font='12px sans-serif';ctx.fillText('Azione autonoma · annotazioni di verifica · acquisizione 30 fps',22,48);
   const p=H.allPlayers.find(p=>p.uid===meta.entranteUid),m=H.allPlayers.find(p=>p.uid===meta.appoggioUid);
   const schermo=(x,z)=>{const q=H.camera.position.clone().set(x,.25,z).project(H.camera);return [(q.x+1)*422,(1-q.y)*195];};
   v.traccia.push([p.x,p.z]);ctx.strokeStyle='rgba(80,235,255,.8)';ctx.lineWidth=2;ctx.beginPath();
   v.traccia.forEach(([x,z],i)=>{const [sx,sy]=schermo(x,z);if(i===0)ctx.moveTo(sx,sy);else ctx.lineTo(sx,sy);});ctx.stroke();
   for(const [q,label,color,dy] of [[p,`#${p.num} entra`,'#72e3ff',-30],[m,`#${m.num} appoggio`,'#ffd376',14]]){
    const [sx,sy]=schermo(q.x,q.z),x=Math.max(20,Math.min(824,sx)),y=Math.max(80,Math.min(350,sy));
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,11,0,Math.PI*2);ctx.stroke();ctx.font='bold 12px sans-serif';
    const w=ctx.measureText(label).width+10,lx=Math.max(10,Math.min(834-w,x-w/2)),ly=Math.max(62,Math.min(367,y+dy));
    ctx.fillStyle='rgba(3,19,31,.88)';ctx.fillRect(lx,ly,w,20);ctx.fillStyle=color;ctx.fillText(label,lx+5,ly+14);
   }
   v.campioni.push({tempo:H.game.time-v.inizio,statoGioco:H.game.state,entrante:[p.x,p.z],appoggio:[m.x,m.z],holder:H.ball.holder?.uid??null,
    statoPalla:H.ball.state,tipoPalla:H.ball.kind,da:H.ball.shooter?.uid??null,a:H.ball.target?.uid??null});
   return canvas.toDataURL('image/jpeg',.9).split(',')[1];
  },meta);
  fs.writeFileSync(path.join(out,String(f).padStart(4,'0')+'.jpg'),Buffer.from(image,'base64'));
 }
 const campioni=await page.evaluate(()=>window.__videoEntrata.campioni);
 fs.writeFileSync(path.join(out,'origine.json'),JSON.stringify({...meta,campioni},null,2)+'\n');
 assert.deepEqual(errors,[]);console.log('PASS partita IA,120fotogrammi '+JSON.stringify(meta));
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
