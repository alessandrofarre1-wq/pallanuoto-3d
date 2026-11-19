// Arresti regolamentari attraverso il ciclo RAF reale; nessun draw GPU necessario.
// node tests/gioco-fermo-v050.mjs [--dist=/tmp/build] [--prima] [--json=/tmp/misure.json]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const prima=process.argv.includes('--prima'),dist=arg('dist');
const server=dist?await preview({root,logLevel:'warn',build:{outDir:dist},preview:{host:'127.0.0.1',port:0}}):
  await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:0}});
if(!dist)await server.listen();
let browser;
try{
  browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:844,height:390}}),errori=[];
  page.on('pageerror',e=>errori.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errori.push(m.text());});
  await page.addInitScript(()=>{
    let seed=71;window.__rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return(seed+.5)/4294967296;};
    window.__now=0;performance.now=()=>window.__now;window.requestAnimationFrame=cb=>{window.__raf=cb;return 1;};
  });
  const url=dist?server.resolvedUrls.local[0]:`http://127.0.0.1:${server.httpServer.address().port}`;
  await page.goto(url);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto&&window.__raf,null,{polling:100,timeout:60000});
  const misure=await page.evaluate(async({prima,sorgenti})=>{
    const H=window.__pallanuoto,G=H.game,B=H.ball,P=H.allPlayers,dt=1/60;
    const need=(ok,msg)=>{if(!prima&&!ok)throw new Error(msg);};
    H.renderer.render=()=>{};H.replay.forzaRegistrazione=false;
    const step=n=>{for(let i=0;i<n;i++){window.__now+=1000/60;window.__raf(window.__now);}};
    const posizioni=()=>JSON.stringify(P.map(p=>[p.x,p.z]));
    const maxVel=()=>Math.max(...P.map(p=>Math.hypot(p.vx,p.vz)));
    let p,d;
    function prepara(){
      G.state='menu';document.getElementById('goBtn').click();H.replay.interrompiReplay();
      Object.assign(G,{state:'paused',time:100,clock:180,shot:24,period:1,penalty:null,rigoriFinali:null,after:null,autoplay:false});H.fight.active=false;
      for(const t of H.teams){t.human=true;t.coda=[];t.cambio=null;t.prossimoControllo=Infinity;}
      for(const q of P)Object.assign(q,{x:-10+q.i*2,z:q.team.idx?7:-7,fx:q.team.dir,fz:0,vx:1.4,vz:0,oriz:1,phase:0,orizPrec:1,J:null,palmi:null,spina:null,excluded:false,uscendo:false,act:null,charging:false,chargeT:0,stunUntil:1e9,pressatoUntil:0,freeThrow:false,perno:false,sprinting:true});
      p=H.teams[0].players[4];d=H.teams[1].players[4];Object.assign(p,{x:0,z:0,stunUntil:0});Object.assign(d,{x:2.5,z:0});
      H.regole.giveBall(p);H.__setCtrl(p);B.inRete=false;B.daTiro=false;step(1);G.state='play';
    }
    function assetto(){
      const O=p.mesh.corpo.ossa,a=O.testa.position.clone(),b=a.clone();O.testa.getWorldPosition(a);O.bacino.getWorldPosition(b);a.sub(b);
      return {velocitaMax:maxVel(),orizMax:Math.max(...P.map(q=>q.oriz||0)),fase:p.phase,verticaleTestaBacino:Math.abs(a.y)/a.length()};
    }
    // Un fallo vero interrompe tutti i corpi, senza avanzare cronometri o posizioni dopo il fischio.
    prepara();const primaFallo=assetto();H.regole.foul(d,p);const immediato=assetto(),pos=posizioni(),clock=G.clock,time=G.time;
    const fase=p.phase;step(18);const dopoFallo=assetto();
    need(G.state==='stop'&&immediato.velocitaMax===0,'14 giocatori fermi già all’ingresso dello stop');
    need(dopoFallo.orizMax<1e-8&&p.phase===fase,'entro 0,30 s nessun crawl né avanzamento della bracciata');
    need(dopoFallo.verticaleTestaBacino>.9,'anche le ossa reali tornano in verticale');
    need(posizioni()===pos&&G.clock===clock&&G.time===time,'campo e cronometri fermi durante il fallo');
    // Il gesto non rilasciato viene annullato dal deadBall del time-out, non soltanto dal fallo sul portatore.
    prepara();let callback=0;H.prova.startAct(p,'shot',.4,()=>{callback++;});p.charging=true;p.chargeT=.7;
    const sospeso=p.act;const timeout=H.regole.timeout(p.team);step(20);
    need(timeout&&p.act===null&&!p.charging&&p.chargeT===0&&callback===0&&sospeso.t===0,'time-out annulla carica/gesto senza rilasciare');
    const gestoAnnullato=p.act===null;
    // I collocamenti iniziali e dei rigori non ereditano il nuoto della gara precedente.
    prepara();G.state='menu';document.getElementById('goBtn').click();const countdown=assetto(),faseInizio=p.phase;step(20);
    need(G.state==='countdown'&&countdown.orizMax===0&&maxVel()===0&&p.phase===faseInizio,'conto iniziale in verticale, senza bracciate');
    prepara();H.regole.setupPenalty(p.team,p);const rigore=assetto();
    need(G.penalty===p&&rigore.orizMax===0&&rigore.velocitaMax===0,'assetto verticale già nel setup del rigore');
    // Un’espulsione con gioco vivo non equivale a un arresto generale al suono del fischio.
    prepara();const velVantaggio=p.vx,faseVantaggio=p.phase;H.regole.exclude(d,p);const esclusioneViva=G.state==='play'&&p.vx===velVantaggio;
    step(1);need(esclusioneViva&&p.phase>faseVantaggio&&p.oriz>0,'espulsione in play: il nuoto degli altri continua');
    // Il percorso della comparsa del cambio continua nel gioco fermo; i 14 in acqua non traslano.
    prepara();const q=p.team.players[2],g=p.team.rosa.find(g=>!g.inAcqua&&!g.fuori&&g.ruolo!==0);q.x=-2;q.z=-8.5;
    H.panchina.chiediCambio(p.team,q,g,true);step(1);
    const scena=p.mesh.g.parent,radici=new Set(P.map(q=>q.mesh.g));
    const comparse=scena.children.filter(o=>o.isGroup&&!radici.has(o)&&o.children.some(c=>c.isSprite));
    const comparsa=comparse.find(c=>c.visible);need(!!comparsa,'comparsa del cambio presente');
    let corpoComparsa=null,assettoComparsa=0,faseComparsa=0;
    if(sorgenti){
      const PN=await import('/src/panchina.js');corpoComparsa=PN.comparsePerReplay.find(c=>c.visibile);
      need(!!corpoComparsa,'riferimento alla comparsa reale');
      if(corpoComparsa){assettoComparsa=corpoComparsa.oriz;faseComparsa=corpoComparsa.phase;corpoComparsa.oriz=.65;}
    }
    H.regole.foul(d,p);const posCampo=posizioni(),cx=comparsa?.position.x,cz=comparsa?.position.z;step(12);
    const spostamentoComparsa=comparsa?Math.hypot(comparsa.position.x-cx,comparsa.position.z-cz):0;
    need(spostamentoComparsa>.05&&posizioni()===posCampo&&maxVel()===0,'cambio a bordo continua, campo fermo');
    const faseComparsaViva=corpoComparsa?corpoComparsa.phase>faseComparsa&&corpoComparsa.oriz===.65:null;
    if(corpoComparsa){need(faseComparsaViva,'comparsa con assetto non verticale: fase continua anche in stop');corpoComparsa.oriz=assettoComparsa;corpoComparsa.orizPrec=assettoComparsa;corpoComparsa.phase=faseComparsa;corpoComparsa.J=null;corpoComparsa.palmi=null;corpoComparsa.spina=null;}
    // La chiusura del gol già rilasciato avanza, senza callback né tempo di gioco.
    prepara();H.prova.startAct(p,'shot',.1,()=>{callback++;});const rilasciato=p.act;rilasciato.done=true;rilasciato.t=rilasciato.wind+rilasciato.frusta;
    Object.assign(B,{state:'dead',holder:null,inRete:true,vx:0,vy:0,vz:0,shooter:p});H.regole.goalScored(p.team);
    const tempoGol=G.time,clockGol=G.clock;step(18);
    const recuperoGol=rilasciato.t>rilasciato.wind+rilasciato.frusta;
    need(recuperoGol&&callback===0&&G.time===tempoGol&&G.clock===clockGol,'follow-through gol preservato, nessun nuovo rilascio');
    // Il playback congela il mondo: anche il nuovo arresto non deve consumare altri secondi di gioco.
    prepara();H.replay.forzaRegistrazione=true;step(55);
    H.prova.doShoot(p,.8,false,0);B.inRete=true;H.regole.goalScored(p.team);step(76);      // v0.63: 1,2 s di diretta prima del replay
    const congelato=H.replay.trattieniMondoReplay();
    const snapshot=()=>JSON.stringify({timer:G.timer,clock:G.clock,time:G.time,corpi:P.map(q=>[q.x,q.z,q.vx,q.vz,q.oriz,q.phase,q.act?.t])});
    const fermo=snapshot();step(10);need(congelato&&H.replay.trattieniMondoReplay()&&snapshot()===fermo,'replay: mondo e assetto restano congelati');
    return {primaFallo,immediato,dopoFallo,deltaFaseFallo:dopoFallo.fase-fase,gestoAnnullato,countdown,rigore,esclusioneViva,spostamentoComparsa,faseComparsaViva,recuperoGol,replayCongelato:congelato};
  },{prima,sorgenti:!dist});
  assert.deepEqual(errori,[],'nessun errore JavaScript');
  if(arg('json'))fs.writeFileSync(arg('json'),JSON.stringify(misure,null,2));
  console.log((prima?'PRIMA':'DOPO')+' gioco fermo v0.50 '+JSON.stringify(misure));
  if(!prima)console.log('✓ arresti regolamentari, setup, cambi, espulsione viva, follow-through e replay');
}finally{if(browser)await browser.close();if(dist)await new Promise(r=>server.httpServer.close(r));else await server.close();}
