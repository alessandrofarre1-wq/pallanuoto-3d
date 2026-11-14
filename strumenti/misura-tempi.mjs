// Misura simulata a 60 Hz: non è un benchmark di FPS sul dispositivo.
import { chromium } from 'playwright';
import { preview } from 'vite';
const server=await preview({preview:{host:'127.0.0.1',port:4198}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});
  await page.addInitScript(()=>{
    let a=33; window.__rnd=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
    performance.now=()=>0; window.requestAnimationFrame=cb=>{window.__raf=cb;return 1;};
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:60000});
  console.log(JSON.stringify(await page.evaluate(()=>{
    const H=window.__pallanuoto; H.game.autoplay=true; for(const t of H.teams) t.human=false;
    H.renderer.render=()=>{}; document.getElementById('goBtn').click();
    let via=null, presa=null;
    for(let i=1;i<=1200;i++){
      const now=i/60; window.__raf(now*1000);
      if(via===null&&H.game.state==='play') via=now;
      if(via!==null&&H.ball.holder){presa=now;break;}
    }
    return {misura:'sprint iniziale ITA–HUN, seme 33, SPEED 1, campo 25 m',contoAllaRovescia:via,sprintFinoAlPossesso:presa===null?null:presa-via,squadra:H.ball.holder?.team.short};
  }),null,2));
} finally { await browser.close(); await new Promise(r=>server.httpServer.close(r)); }
