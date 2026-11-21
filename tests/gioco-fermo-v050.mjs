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
      Object.assign(G,{state:'paused',time:100,clock:180,shot:24,period:1,penalty:null,rigoriFinali:null,after:null,fermoFallo:null,autoplay:false});H.fight.active=false;
      for(const t of H.teams){t.human=true;t.coda=[];t.cambio=null;t.prossimoControllo=Infinity;}
      for(const q of P)Object.assign(q,{x:-10+q.i*2,z:q.team.idx?7:-7,fx:q.team.dir,fz:0,vx:1.4,vz:0,oriz:1,phase:0,orizPrec:1,J:null,palmi:null,spina:null,excluded:false,uscendo:false,act:null,charging:false,chargeT:0,stunUntil:1e9,pressatoUntil:0,freeThrow:false,perno:false,sprinting:true});
      p=H.teams[0].players[4];d=H.teams[1].players[4];Object.assign(p,{x:0,z:0,stunUntil:0});Object.assign(d,{x:2.5,z:0});
      H.regole.giveBall(p);H.__setCtrl(p);B.inRete=false;B.daTiro=false;step(1);G.state='play';
    }
    function assetto(){
      const O=p.mesh.corpo.ossa,a=O.testa.position.clone(),b=a.clone();O.testa.getWorldPosition(a);O.bacino.getWorldPosition(b);a.sub(b);
      return {velocitaMax:maxVel(),orizMax:Math.max(...P.map(q=>q.oriz||0)),fase:p.phase,verticaleTestaBacino:Math.abs(a.y)/a.length()};
    }
    // Il fischio ferma autore e vittima; i compagni continuano i movimenti già utili.
    prepara();const compagno=H.teams[0].players[2];compagno.stunUntil=0;
    let marcatore=null,lagPrima=null;
    if(sorgenti){
      const A=await import('/src/ia.js');marcatore=H.teams[1].players.find(q=>A.uomoDi(q)===compagno);
      need(marcatore&&marcatore!==d,'marcatore estraneo al fallo nella scena');
      marcatore.stunUntil=0;marcatore.lagX=compagno.x;marcatore.lagZ=compagno.z;lagPrima=[marcatore.lagX,marcatore.lagZ];
    }
    compagno.cut={t0:G.time,phase:0,x:7,z:-4};
    const primaFallo=assetto(),faseCompagno=compagno.phase;H.regole.foul(d,p);
    const immediato=assetto(),posAttori=JSON.stringify([p,d].map(q=>[q.x,q.z])),posCompagno=[compagno.x,compagno.z],clock=G.clock,time=G.time,shot=G.shot;
    const fase=p.phase;step(18);const dopoFallo=assetto();
    const attoriFermi=()=>[p,d].every(q=>Math.hypot(q.vx,q.vz)===0);
    const orizAttori=Math.max(p.oriz||0,d.oriz||0),movimentoCompagno=Math.hypot(compagno.x-posCompagno[0],compagno.z-posCompagno[1]);
    need(G.state==='stop'&&attoriFermi()&&immediato.velocitaMax>0,'solo autore e vittima fermi già al fischio');
    need(orizAttori<1e-8&&p.phase===fase,'entro0,30s gli attori si alzano e fermano la bracciata');
    need(dopoFallo.verticaleTestaBacino>.9,'anche le ossa reali della vittima tornano verticali');
    need(JSON.stringify([p,d].map(q=>[q.x,q.z]))===posAttori,'le collisioni non spostano gli attori del fallo');
    need(movimentoCompagno>.05&&compagno.phase>faseCompagno,'taglio e bracciata dei compagni proseguono durante il tiro libero');
    need(G.clock===clock&&G.time===time&&G.shot===shot,'cronometri fermi durante il fallo');
    const reazioneMarcatore=marcatore?Math.hypot(marcatore.lagX-lagPrima[0],marcatore.lagZ-lagPrima[1]):null;
    if(sorgenti)need(reazioneMarcatore>.03,'la difesa aggiorna la lettura del tagliante durante il fermo del cronometro');
    // Il giocatore umano estraneo al fallo resta comandabile, senza nuovi tiri/contrasti.
    prepara();const libero=H.teams[0].players[2];libero.stunUntil=0;
    H.regole.giveBall(d);H.__setCtrl(libero);H.regole.foul(p,d);
    const origineLibero=[libero.x,libero.z],fermiUmano=JSON.stringify([p,d].map(q=>[q.x,q.z]));
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'ArrowRight',key:'ArrowRight',bubbles:true}));step(18);
    window.dispatchEvent(new KeyboardEvent('keyup',{code:'ArrowRight',key:'ArrowRight',bubbles:true}));
    const movimentoUmano=Math.hypot(libero.x-origineLibero[0],libero.z-origineLibero[1]);
    need(movimentoUmano>.05&&JSON.stringify([p,d].map(q=>[q.x,q.z]))===fermiUmano,'controllo umano libero, attori immobili');
    // Un fallo in attacco cambia subito il possesso: chi era salito deve iniziare il rientro,
    // mentre il colpevole e il nuovo battitore restano al punto del fischio.
    let rientroSuFallo=null,rientroSenzaPalla=null;
    if(sorgenti){
      const R=await import('/src/regole.js');prepara();
      const q=H.teams[0].players[2];Object.assign(q,{x:7,z:-5.5,vx:1.4,vz:0,stunUntil:0,fx:1,fz:0});
      R.sfondamento(p,d);const origine=q.x,attori=JSON.stringify([p,d].map(v=>[v.x,v.z])),c=G.clock,t=G.time;
      step(30);rientroSuFallo={possesso:G.possTeam===d.team,spostamento:q.x-origine,velocita:q.vx};
      need(rientroSuFallo.possesso&&q.x<origine-.05&&q.vx<-.1,'fallo in attacco: cambio possesso e rientro reale nella nuova direzione');
      need(JSON.stringify([p,d].map(v=>[v.x,v.z]))===attori&&G.clock===c&&G.time===t,'attori e cronometri fermi durante il rientro degli altri');
      // Lo stesso vale per un blocco/spinta senza palla: il portatore è un terzo atleta,
      // il possesso cambia già al fischio e si fermano solo colpevole e vittima.
      prepara();const portatore=H.teams[0].players[5],rientrante=H.teams[0].players[2];
      Object.assign(portatore,{x:0,z:3});Object.assign(d,{x:.8,z:0});
      Object.assign(rientrante,{x:7,z:-5.5,vx:1.4,vz:0,stunUntil:0,fx:1,fz:0});
      H.regole.giveBall(portatore);Object.assign(B,{x:portatore.x,z:portatore.z});
      R.falloSenzaPalla(p,d,'blocco irregolare');
      need(G.possTeam===d.team&&B.holder?.team===d.team&&B.holder.freeThrow,'fallo senza palla: possesso assegnato al fischio');
      need(G.fermoFallo?.length===2&&G.fermoFallo.includes(p)&&G.fermoFallo.includes(d),'fallo senza palla: solo autore e vittima nel gruppo fermo');
      const origineSenzaPalla=rientrante.x,attoriSenzaPalla=JSON.stringify([p,d].map(v=>[v.x,v.z])),clockSenzaPalla=G.clock,timeSenzaPalla=G.time;
      step(30);rientroSenzaPalla={possesso:G.possTeam===d.team,spostamento:rientrante.x-origineSenzaPalla,velocita:rientrante.vx};
      need(rientroSenzaPalla.possesso&&rientrante.x<origineSenzaPalla-.05&&rientrante.vx<-.1,'fallo senza palla: gli altri rientrano realmente prima della ripresa');
      need(JSON.stringify([p,d].map(v=>[v.x,v.z]))===attoriSenzaPalla&&G.clock===clockSenzaPalla&&G.time===timeSenzaPalla,'fallo senza palla: attori e cronometri restano fermi');
    }
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
    H.regole.cornerThrow(p.team,1);const posCampo=posizioni(),cx=comparsa?.position.x,cz=comparsa?.position.z;step(12);
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
    return {primaFallo,immediato,dopoFallo,movimentoCompagno,movimentoUmano,rientroSuFallo,rientroSenzaPalla,deltaFaseFallo:dopoFallo.fase-fase,gestoAnnullato,countdown,rigore,esclusioneViva,spostamentoComparsa,faseComparsaViva,recuperoGol,replayCongelato:congelato};
  },{prima,sorgenti:!dist});
  assert.deepEqual(errori,[],'nessun errore JavaScript');
  if(arg('json'))fs.writeFileSync(arg('json'),JSON.stringify(misure,null,2));
  console.log((prima?'PRIMA':'DOPO')+' gioco fermo v0.50 '+JSON.stringify(misure));
  if(!prima)console.log('✓ arresti regolamentari, setup, cambi, espulsione viva, follow-through e replay');
}finally{if(browser)await browser.close();if(dist)await new Promise(r=>server.httpServer.close(r));else await server.close();}
