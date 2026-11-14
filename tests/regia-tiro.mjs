// Scelte uniche, regia speculare, comandi nello schermo, potenza al rilascio.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { build, preview } from 'vite';
if(!process.argv.includes('--no-build')) await build({logLevel:'warn'});
const server=await preview({preview:{host:'127.0.0.1',port:4361}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page=await browser.newPage({viewport:{width:667,height:320},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    localStorage.setItem('pallanuoto-ritmo','1.25');localStorage.setItem('pallanuoto-cam','0.85');
    performance.now=()=>0;window.__f=0;window.requestAnimationFrame=cb=>{window.__raf=cb;return 1;};
    window.__step=n=>{const R=window.__pallanuoto.renderer,draw=R.render;R.render=()=>{};try{for(let i=0;i<n;i++)window.__raf(++window.__f*1000/60);}finally{R.render=draw;}};
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:60000});
  assert.equal(await page.locator('#selSpd,[data-cam]').count(),0,'nessuna scelta di ritmo o telecamera');
  await page.evaluate(()=>document.querySelector('#vHome .m-cta').click());
  const menuPiccolo=await page.evaluate(()=>{
    const r=document.querySelector('#vSquadre .m-cta').getBoundingClientRect();
    return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,viewport:innerHeight,children:[...document.querySelector('#vSquadre').children].map(e=>({tag:e.id||e.className,h:e.getBoundingClientRect().height}))};
  });
  assert.ok(menuPiccolo.bottom<=menuPiccolo.viewport,'CONTINUA visibile anche su Safari 667×320');
  await page.evaluate(()=>document.querySelector('#vSquadre .m-cta').click());
  const regia=await page.evaluate(()=>{
    const H=window.__pallanuoto;document.getElementById('goBtn').click();window.__step(181);
    H.imposta('spd','1.25');const clock=H.game.clock;window.__step(60);const secondo=clock-H.game.clock;
    H.game.state='paused';H.ball.state='free';H.ball.holder=null;H.ball.x=-9;H.ball.z=0;window.__step(420);
    const left=H.camera.getWorldDirection(H.camera.position.clone()).x;
    H.ball.x=9;window.__step(420);H.camera.updateMatrixWorld();
    const right=H.camera.getWorldDirection(H.camera.position.clone()).x,roll=H.camera.matrixWorld.elements[1];
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyD'}));window.__step(1);
    const e=H.camera.matrixWorld.elements, dot=H.inp.x*e[0]+H.inp.z*e[2];
    window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyD'}));window.__step(1);
    return {left,right,roll,dot,secondo,tabellone:document.getElementById('hud').getBoundingClientRect().left};
  });
  assert.ok(regia.left<-.1&&regia.right>.1,'diagonali opposte verso le due porte');
  assert.ok(Math.abs(regia.roll)<1e-6,'orizzonte stabile');
  assert.ok(regia.dot>.99,'destra del joystick = destra dello schermo');
  assert.ok(Math.abs(regia.secondo-1)<.03,'ritmo reale unico anche con preferenze vecchie');
  assert.ok(regia.tabellone<16,'tabellone in alto a sinistra');
  const carica=await page.evaluate(()=>{
    const H=window.__pallanuoto;H.game.state='play';H.game.autoplay=false;H.teams[0].human=true;
    const p=H.teams[0].players[6];for(const q of H.allPlayers){q.x=q.team.idx?11:-11;q.z=8;q.act=null;q.charging=false;}
    p.x=0;p.z=0;p.oriz=0;p.stamina=1;p.pressatoUntil=0;H.regole.giveBall(p);H.__setCtrl(p);
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyK'}));window.__step(120);
    const b=document.querySelector('.tb[data-b="shoot"]');
    const r={trattenuta:H.ball.holder===p,max:b.classList.contains('massimo'),testo:b.querySelector('small').textContent,carica:p.chargeT};
    window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyK'}));window.__step(1);
    r.azione=p.act?.kind;r.potenza=p.act?.potenza;window.__step(6);r.gesto=!!p.tiroVista;
    window.__step(25);r.lanciata=H.ball.shooter===p&&H.ball.holder!==p;
    return r;
  });
  assert.ok(carica.trattenuta&&carica.max&&carica.testo==='MAX','a potenza massima si aspetta il rilascio');
  assert.equal(carica.carica,.9);assert.equal(carica.azione,'shot');assert.equal(carica.potenza,1);
  assert.ok(carica.gesto&&carica.lanciata,'al rilascio partono gesto potente e tiro');
  if(process.argv.includes('--foto')){
    await page.evaluate(()=>{
      const H=window.__pallanuoto,p=H.teams[0].players[6];H.regole.giveBall(p);H.__setCtrl(p);
      H.game.state='paused';p.act=null;p.charging=true;p.chargeT=.9;p.oriz=0;
      window.__step(12);H.__ridisegna();
    });
    await page.screenshot({path:'/tmp/pallanuoto-tiro-max.png',timeout:120000});
    await page.addStyleTag({content:'#hud,#espulsioni,#tac,#player,#cronaca,#touch,#tCambi,#tLog,#tPause,#fps,#fight{display:none!important}'});
  }
  const speciali=[];
  for(const tipo of ['shot','beduina','schizzo','colonnello']){
    const gesto=await page.evaluate(tipo=>{
      const H=window.__pallanuoto,p=H.teams[0].players[6];H.regole.giveBall(p);H.game.state='paused';
      p.x=0;p.z=0;p.fx=tipo==='beduina'?-1:1;p.fz=0;p.vx=p.vz=0;p.oriz=['schizzo','colonnello'].includes(tipo)?1:0;p.charging=false;p.tiroVista=null;
      H.prova.startAct(p,tipo,.12,()=>{});p.act.potenza=1;p.act.t=p.act.wind+p.act.frusta*.72;
      H.vista={pos:[p.fx*2.8,1.2,3.4],look:[0,.05,0],fov:35};window.__step(30);H.__ridisegna();
      return {tipo,accento:!!p.tiroVista,ampiezza:Math.hypot(p.tiroVista.chest[0]-p.J.chest[0],p.tiroVista.chest[1]-p.J.chest[1],p.tiroVista.chest[2]-p.J.chest[2])};
    },tipo);
    assert.ok(gesto.accento&&gesto.ampiezza>.001,'gesto riconoscibile: '+tipo);speciali.push(gesto);
    if(process.argv.includes('--foto'))await page.screenshot({path:'/tmp/pallanuoto-gesto-'+tipo+'.png',timeout:120000});
  }
  assert.deepEqual(errors,[],'nessun errore JavaScript');
  console.log('OK regia e tiro:',JSON.stringify({regia,carica,speciali}));
} finally {await browser.close();await new Promise(r=>server.httpServer.close(r));}
