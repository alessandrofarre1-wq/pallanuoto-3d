import { chromium } from 'playwright';
import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const porta=4472, umano=process.argv.includes('--umano');
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:porta,strictPort:true,hmr:false,watch:null}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const pg=await browser.newPage({viewport:{width:844,height:390}});
await pg.addInitScript(()=>{
  let s=33; window.__rnd=()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  let now=0; performance.now=()=>now; window.requestAnimationFrame=cb=>{ window.__raf=cb; return 1; };
  window.__passo=()=>{ now+=1000/60; window.__raf(now); };
});
await pg.goto('http://127.0.0.1:'+porta,{waitUntil:'domcontentloaded',timeout:120000});
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto',null,{timeout:120000,polling:100});
const r=await pg.evaluate((umano)=>{
  const H=window.__pallanuoto; H.scegliSquadre('ITA','HUN'); H.imposta('len','480'); document.getElementById('goBtn').click();
  if(!umano){ H.game.autoplay=true; for(const t of H.teams) t.human=false; }
  H.renderer.render=()=>{};
  const out=[]; let prossimo=10, sprint=[0,0], tot=0;
  for(let k=0;k<60*60*12&&prossimo<=300;k++){
    window.__passo();
    if(H.game.state==='play'){ tot++; for(const t of H.teams) for(const p of t.players) if(!p.isGK&&p.sprinting) sprint[t.idx]++; }
    if(H.game.state==='play'&&H.game.time>=prossimo){
      out.push({t:prossimo,st:H.teams.map(t=>t.players.filter(p=>!p.isGK).map(p=>+p.stamina.toFixed(2))),sprint:sprint.map(x=>+(x/Math.max(1,tot)/6).toFixed(2))});
      prossimo+=30;
    }
  }
  return out;
},umano);
for(const x of r) console.log(x.t,'s  ITA',x.st[0].join(' '),' | HUN',x.st[1].join(' '),' quota in sprint',x.sprint.join('/'));
await browser.close(); await server.close();
