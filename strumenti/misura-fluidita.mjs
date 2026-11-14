import { chromium } from 'playwright';
import { preview } from 'vite';
const foto=process.argv.includes('--foto');
const server=await preview({ preview:{host:'127.0.0.1',port:4191} });
const browser=await chromium.launch({ args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
try {
  for(const viewport of [{width:844,height:390},{width:667,height:375}]){
    const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,deviceScaleFactor:3});
    const page=await context.newPage();
    page.on('pageerror',e=>console.log('ERRORE',e.message));
    await page.addInitScript(()=>{ let a=33; window.__rnd=()=>{a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;}; performance.now=()=>0; window.__frame=0; window.requestAnimationFrame=cb=>{window.__raf=cb;}; });
    await page.goto(server.resolvedUrls.local[0]);
    await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{timeout:120000,polling:100});
    const result=await page.evaluate(foto=>{
      const H=window.__pallanuoto; document.getElementById('goBtn').click();
      const draw=H.renderer.render; H.renderer.render=()=>{};
      const samples=[];
      for(let i=0;i<(foto?300:1800);i++){
        window.__raf(++window.__frame*1000/60);
        if(i%300===299){
          H.renderer.render=draw; window.__raf(++window.__frame*1000/60);
          samples.push({...H.renderer.info.render}); H.renderer.render=()=>{};
        }
      }
      H.game.cambiLiberi=false;
      for(const t of H.teams){
        const p=t.players.find(p=>!p.isGK&&H.ball.holder!==p), g=t.rosa.find(g=>!g.inAcqua&&g.ruolo!==0&&!g.fuori);
        H.panchina.chiediCambio(t,p,g,true);
      }
      for(let i=0;i<(foto?120:1800);i++){
        window.__raf(++window.__frame*1000/60);
        if(i%120===119){
          H.renderer.render=draw; window.__raf(++window.__frame*1000/60);
          samples.push({fase:'cambi',...H.renderer.info.render}); H.renderer.render=()=>{};
        }
      }
      H.renderer.render=draw;
      return {dpr:H.renderer.getPixelRatio(),calls:Math.max(...samples.map(x=>x.calls)),triangles:Math.max(...samples.map(x=>x.triangles)),samples};
    },foto);
    if(foto) await page.screenshot({path:`/tmp/pallanuoto-cambi-${viewport.width}.png`,timeout:120000});
    console.log(JSON.stringify({viewport,...result}));
    if(result.calls>=100||result.triangles>=150000) process.exitCode=1;
    await context.close();
  }
} finally { await browser.close(); await new Promise(r=>server.httpServer.close(r)); }
