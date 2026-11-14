// Verifica integrata della resa massima e del ripiego automatico: il riflesso
// resta riservato alla qualità alta e la risoluzione risponde ai frame lenti, le risorse restano stabili e il canvas si ridimensiona.
// Uso: node tests/grafica-arena.mjs [--no-build]
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { build, preview } from 'vite';

const root=fileURLToPath(new URL('..',import.meta.url));
if(!process.argv.includes('--no-build')) await build({root,logLevel:'warn'});
const server=await preview({root,logLevel:'warn',preview:{host:'127.0.0.1',port:4351,strictPort:true}});
let browser;
try {
  browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
  await page.addInitScript(()=>{
    performance.now=()=>0;
    window.requestAnimationFrame=cb=>{window.__raf=cb;return 1;};
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:60000});
  const result=await page.evaluate(()=>{
    const H=window.__pallanuoto;
    let now=1000/60; document.getElementById('goBtn').click(); window.__raf(now);
    const full=H.renderer.info.render.calls, dpr=H.renderer.getPixelRatio();
    // Il test impone il tempo dei frame; non è un benchmark della macchina.
    const draw=H.renderer.render; H.renderer.render=()=>{};
    for(let i=0;i<150;i++){now+=1000/30;window.__raf(now);}
    H.renderer.render=draw; now+=1000/60;window.__raf(now);
    const reduced=H.renderer.info.render.calls, reducedDpr=H.renderer.getPixelRatio();
    H.renderer.setPixelRatio(2); H.renderer.info.reset(); H.__ridisegna();
    const high=H.renderer.info.render.calls;
    H.renderer.setPixelRatio(reducedDpr); H.renderer.info.reset(); H.__ridisegna();
    const low=H.renderer.info.render.calls;
    const textures=H.renderer.info.memory.textures;
    for(let i=0;i<12;i++){H.renderer.info.reset();H.__ridisegna();}
    return {full,reduced,high,low,dpr,reducedDpr,textures,finalTextures:H.renderer.info.memory.textures};
  });
  assert.ok(result.full<100,'budget iPhone: meno di 100 oggetti');
  assert.ok(result.high>result.low,'il riflesso completo è riservato al DPR alto');
  assert.ok(result.reducedDpr<result.dpr,'i frame lenti in partita riducono gradualmente la risoluzione');
  assert.equal(result.finalTextures,result.textures,'i ridisegni non devono creare altre texture');
  await page.setViewportSize({width:667,height:375});
  await page.waitForFunction(()=>window.__pallanuoto.renderer.domElement.style.width==='667px',null,{polling:100});
  const size=await page.evaluate(()=>{const r=window.__pallanuoto.renderer;return [r.domElement.width,r.domElement.height,r.getPixelRatio()];});
  assert.equal(size[0],Math.floor(667*size[2]));
  assert.equal(size[1],Math.floor(375*size[2]));
  assert.deepEqual(errors,[],'errori JavaScript/WebGL durante il cambio di qualità');
  console.log(`OK: qualità alta ${result.high} / media ${result.low} chiamate; DPR ${result.dpr} → ${result.reducedDpr}; texture stabili; resize iPhone; nessun errore WebGL.`);
} finally {
  if(browser) await browser.close();
  await new Promise(resolve=>server.httpServer.close(resolve));
}
