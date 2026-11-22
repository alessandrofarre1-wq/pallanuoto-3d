// Replay vero: nuoto/passaggio/ricezione/tiro/gol, poi sola riproduzione della scena.
// Uso: node tests/replay-v048.mjs [--foto]. GPU accesa soltanto nei sei fotogrammi finali.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'), foto=process.argv.includes('--foto');
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:0,strictPort:true}});
await server.listen();
let browser;
try{
  browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1.5});
  const page=await context.newPage(), errors=[];
  page.setDefaultTimeout(120000); page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    let seed=71,calls=0; window.__setSeed=n=>{seed=n;calls=0;}; window.__rngState=()=>[seed,calls];
    window.__rnd=()=>{calls++;seed=(Math.imul(seed,1664525)+1013904223)>>>0;return(seed+.5)/4294967296;};
    window.__now=0; performance.now=()=>window.__now;
    window.requestAnimationFrame=cb=>{window.__raf=cb;return 1;};
    window.__frame=()=>{window.__now+=1000/60;window.__raf(window.__now);};
  });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto&&window.__raf,null,{polling:100,timeout:60000});
  await page.evaluate(async()=>{
    const [S,T,F,P,R,M,J,V,W,Q,A,I,PN]=await Promise.all(['stato','tiri','fisica','partita','regole','menu','giocatori','grafica/render','grafica/scena','replay','grafica/replay','input','panchina'].map(n=>import('/src/'+n+'.js')));
    const H=window.__pallanuoto,G=S.game,B=S.ball,dt=1/60, real=W.renderer.render;
    const need=(ok,msg)=>{if(!ok)throw new Error(msg);};
    const D=window.__replay048={S,T,F,P,R,M,J,V,W,Q,A,I,PN,H,G,B,need,gpu:false,draws:0,riprese:0};
    W.renderer.render=function(...args){D.draws++;need(args[1]===W.camera,'una sola camera condivisa');if(D.gpu)return real.apply(this,args);};
    H.replay.forzaRegistrazione=true;
    H.cronaca.ascoltatori.push((tipo,titolo)=>{if(tipo==='ripresa'&&titolo==='Ripresa dal centro')D.riprese++;});
    D.paint=(dd=dt)=>{window.__now+=dd*1000;W.scene.updateMatrixWorld(true);const n=D.draws;V.render(dd,window.__now);need(D.draws===n+1,'un solo renderer.render per fotogramma');};
    D.prepare=()=>{
      window.__setSeed(71);M.newMatch(); I.resetInput(); G.state='play';G.time=100;G.possT=100;G.clock=180;G.shot=28;G.autoplay=false;G.after=null;S.fight.active=false;
      for(const t of S.teams){t.human=true;t.prossimoControllo=Infinity;t.coda=[];t.cambio=null;}
      for(const p of S.allPlayers)Object.assign(p,{x:(p.i-3)*1.8,z:p.team.idx?7:-7,vx:0,vz:0,fx:p.team.dir,fz:0,oriz:0,act:null,charging:false,excluded:false,uscendo:false,stamina:1,freeThrow:false,pressatoUntil:0,stunUntil:0,pf:0,J:null,palmi:null,spina:null});
      const p=S.teams[0].players[4],c=S.teams[0].players[6];Object.assign(p,{x:8,z:0,s:{...p.s,pre:99,pot:90}});Object.assign(c,{x:3,z:-1.4});
      Object.assign(S.teams[1].players[0],{x:12,z:8});R.giveBall(c);S.setCtrl(c);D.p=p;D.c=c;D.paint();
    };
    D.step=(n=1,motion=false)=>{
      for(let i=0;i<n;i++){
        const dd=G.state==='stop'?Math.min(dt,Math.max(G.timer,1e-12)):dt;
        Q.avanzaTempoReplay(dd);
        const saltati=Q.eseguiSaltoReplay(P.update);if(saltati)I.resetInput();
        if(Q.trattieniMondoReplay()){}
        else if(G.state==='stop'||G.state==='paused')P.update(dd);
        else if(G.state==='play'){
          G.time+=dd;if(motion){F.movePlayer(D.c,1,0,false,dd);F.movePlayer(D.p,.35,0,false,dd);}
          else{F.movePlayer(D.c,0,0,false,dd);F.movePlayer(D.p,0,0,false,dd);}
          T.updateActs(dd);F.updateBall(dd);
        }
        D.paint(dd);
      }
    };
    D.engine=()=>JSON.stringify({
      giocatori:S.allPlayers.map(p=>({uid:p.uid,num:p.num,name:p.name,x:p.x,z:p.z,vx:p.vx,vz:p.vz,fx:p.fx,fz:p.fz,stamina:p.stamina,pf:p.pf,excluded:p.excluded,act:p.act&&{kind:p.act.kind,t:p.act.t,wind:p.act.wind,done:p.act.done,potenza:p.act.potenza}})),
      palla:{...Object.fromEntries(Object.entries(B).filter(([,v])=>v===null||['number','string','boolean'].includes(typeof v))),holder:B.holder?.uid,shooter:B.shooter?.uid,target:B.target?.uid,lastTeam:B.lastTeam?.idx,toccoDifesa:B.toccoDifesa?.idx,ignora:B.ignora?.uid,intercept:[...B.intercept].map(p=>p.uid),tiro:B.tiroReplay,spruzzo:B.spruzzo},
      game:{...Object.fromEntries(Object.entries(G).filter(([,v])=>v===null||['number','string','boolean'].includes(typeof v))),possTeam:G.possTeam?.idx,penalty:G.penalty?.uid},
      punteggio:S.teams.map(t=>t.score),stat:H.v046.statPartita,rng:window.__rngState()});
    D.visual=()=>{
      const n=[];W.scene.traverse(o=>n.push([o.id,o.position.toArray(),o.quaternion.toArray(),o.scale.toArray(),o.visible,o.matrix.toArray(),o.matrixWorld.toArray(),o.modelViewMatrix.toArray(),o.normalMatrix.toArray(),o.bindMatrix?.toArray(),o.bindMatrixInverse?.toArray(),o.morphTargetInfluences,o.material?.map?.id,o.isInstancedMesh?[o.count,Array.from(o.instanceMatrix.array),Object.entries(o.geometry.attributes).filter(([,a])=>a.isInstancedBufferAttribute).map(([k,a])=>[k,Array.from(a.array)])]:null]));
      return JSON.stringify({n,camera:[W.camera.position.toArray(),W.camera.quaternion.toArray(),W.camera.matrixWorld.toArray(),W.camera.matrixWorldInverse.toArray(),W.camera.projectionMatrix.toArray()],u:S.allPlayers.map(p=>Object.entries(p.mesh.corpo.u).map(([k,u])=>[k,u.value?.isTexture?u.value.id:u.value?.toArray?u.value.toArray():u.value]))});
    };
    D.hash=tex=>{let n=2166136261;for(const b of tex.image.getContext('2d').getImageData(0,0,128,128).data)n=Math.imul(n^b,16777619);return n>>>0;};
    D.capMat=p=>{let m;p.mesh.g.traverse(o=>{if(o.material?.map===p.mesh.corpo.texNum)m=o.material;});return m;};
    D.manualGoal=()=>{R.giveBall(D.p);T.doShoot(D.p,.8,false,0);R.goalScored(S.teams[0]);};
    D.prepare();
  });
  const core=await page.evaluate(()=>{
    const D=window.__replay048,{S,T,F,R,Q,A,G,B,need}=D;
    // Primo gol esclusivamente fisico; il nuoto precedente offre fotogrammi realmente differenti.
    const x0=D.c.x;D.step(110,true);const nuoto={dx:D.c.x-x0,oriz:D.c.oriz};
    T.startAct(D.c,'pass',.08,()=>T.doPass(D.c,D.p),[D.p.x,D.p.z]);
    for(let i=0;i<150&&B.holder!==D.p;i++)D.step();
    need(B.holder===D.p&&G.passaggi===1,'passaggio e ricezione calcolati dalla fisica');
    S.setCtrl(D.p);const old={num:D.p.num,name:D.p.name,hash:D.hash(D.p.mesh.corpo.texNum)};
    T.startAct(D.p,'shot',.15,()=>T.doShoot(D.p,.85,false,0));
    for(let i=0;i<160&&S.teams[0].score===0;i++)D.step();
    need(B.inRete&&S.teams[0].score===1&&G.state==='stop','gol reale dal rilascio e dal volo della palla');
    need(nuoto.dx>1&&nuoto.oriz>.7,'movimento vero prima del gol');
    const clock=G.clock,score=S.teams.map(t=>t.score),stat=JSON.stringify(D.H.v046.statPartita),after=G.after;
    need(Q.statoReplay()?.fase==='diretta','inizio: diretta');D.step(70);need(Q.statoReplay()?.fase==='diretta','1,17 s: ancora diretta');
    // Cambio regolamentare immediato dopo gol: stesso corpo, atleta e numero diversi.
    const riserva=S.teams[0].rosa.find(g=>!g.inAcqua&&!g.fuori&&g.ruolo!==0);
    D.H.panchina.chiediCambio(S.teams[0],D.p,riserva,true);D.step(4);
    need(Q.statoReplay()?.fase==='replay'&&document.body.classList.contains('replay'),'1,23 s: playback');
    const info=Q.statoReplay().info;need(info.numero===old.num&&info.nome===old.name&&D.p.num!==old.num,'identità al rilascio conservata dopo cambio');
    const fermo=D.engine(),timerFermo=G.timer;D.step(60);need(D.engine()===fermo&&G.timer===timerFermo,'il replay non recupera stamina o consuma espulsioni/cambi/cronometri');
    const engine=D.engine(),visual=D.visual(),map=D.capMat(D.p).map;let copie=0,hash=0,ballA,ballB,poseA,poseB,fxA,fxB;
    for(const progresso of [0,.7]){
      need(A.disegnaClipReplay(progresso,info,()=>{
        // Durante replay il materiale punta alla tela congelata, non a K.texNum.
        const nums=[];D.p.mesh.g.traverse(o=>{if(o.material?.map?.image?.width===128)nums.push(o.material.map);});
        const cap=nums.find(t=>t!==D.p.mesh.corpo.texNum);if(cap){copie++;if(progresso===0)hash=D.hash(cap);}
        if(progresso===0){ballA=D.W.ball3d.position.toArray();poseA=D.p.mesh.corpo.ossa.manoD.quaternion.toArray();fxA=Array.from(D.W.schiuma.instanceMatrix.array);}
        else{ballB=D.W.ball3d.position.toArray();poseB=D.p.mesh.corpo.ossa.manoD.quaternion.toArray();fxB=Array.from(D.W.schiuma.instanceMatrix.array);}
        need(D.engine()===engine,'engine e RNG fermi anche dentro draw');
      }),'clip disponibile');
      need(D.engine()===engine&&D.visual()===visual&&D.capMat(D.p).map===map&&G.after===after,'ripristino esatto dopo draw');
    }
    need(copie===2&&hash===old.hash,'numero del vecchio atleta congelato in una tela privata');
    need(JSON.stringify(ballA)!==JSON.stringify(ballB)&&JSON.stringify(poseA)!==JSON.stringify(poseB),'palla e ossa riproducono fotogrammi differenti');
    need(A.diagnosticaReplay().effettiRegistrati>=4&&JSON.stringify(fxA)!==JSON.stringify(fxB),'schiuma e spruzzi appartengono alla sequenza registrata');
    let errore=false;try{A.disegnaClipReplay(.4,info,()=>{throw new Error('draw intenzionale');});}catch(e){errore=e.message==='draw intenzionale';}
    need(errore&&D.engine()===engine&&D.visual()===visual,'finally ripristina anche quando draw lancia');
    let stop=134/60;while(G.state==='stop'&&stop<8){const t=G.timer;D.step();stop+=Math.min(1/60,t);}
    need(G.state==='play'&&Math.abs(stop-7.6)<1/60+1e-8&&G.clock===clock&&G.shot===28,'1,2 diretta +5,2 replay +1,2 ripresa (v0.63); cronometro invariato');
    need(JSON.stringify(S.teams.map(t=>t.score))===JSON.stringify(score)&&JSON.stringify(D.H.v046.statPartita)===stat&&D.riprese===1,'gol/statistiche non duplicati e una sola ripresa');
    return {nuoto,stop,archivio:A.diagnosticaReplay(),marcatore:info.nome};
  });
  console.log('✓ gol fisico, replay dei corpi, identità, ripristino e tempi',JSON.stringify(core));
  const casi=await page.evaluate(()=>{
    const D=window.__replay048,{S,T,Q,A,G,R,P,need}=D;
    const firme=[];
    for(const [tipo,attesa,rigore,x] of [['beduina','BEDUINA',false,9],['sciarpa','SCIARPA',false,9],['rovesciata','ROVESCIATA',false,9],['schizzo','SCHIZZO',false,9],['colonnello','COLONNELLO',false,9],['shot','RIGORE',true,7.5],['shot','TIRO DA FUORI',false,5]]){
      D.prepare();D.p.x=x;R.giveBall(D.p);if(rigore)G.penalty=D.p;
      D.p.act={kind:tipo,done:true,t:.4,wind:.1,frusta:.1,aim:[12.5,0]};T.doShoot(D.p,.8,false,0,{speciale:['schizzo','colonnello'].includes(tipo)?tipo:undefined});D.p.act=null;
      const info=Q.datiGolReplay(S.teams[0]);need(info.firma===attesa,'firma dal rilascio senza act: '+tipo);firme.push(info.firma);
      const avversario=Q.datiGolReplay(S.teams[1]);need(avversario.numero===null&&avversario.nome===''&&avversario.firma==='GOL','nessuna attribuzione al tiratore avversario');
    }
    D.prepare();D.step(70);D.manualGoal();const prima=D.riprese,clock=G.clock;D.step(74);Q.richiediSaltoReplay();
    const saltati=Q.eseguiSaltoReplay(P.update);need(saltati>1.3&&G.state==='stop'&&Math.abs(G.timer-1.2)<1e-9&&G.shot===28,'Salta usa callback originale e lascia ripresa 1,2 s');
    need(D.riprese===prima+1&&Q.eseguiSaltoReplay(P.update)===0&&S.teams[0].score===1,'Salta non ripete callback né gol');
    while(G.state==='stop')D.step();need(G.clock===clock,'Salta non consuma cronometro');
    D.prepare();D.step(70);G.clock=0;D.manualGoal();D.M.endMatch();D.step(74);
    need(G.state==='over'&&document.body.classList.contains('replay'),'gol sulla sirena: replay prima del risultato');
    const scoreFine=S.teams[0].score;Q.richiediSaltoReplay();Q.eseguiSaltoReplay(P.update);D.paint();
    need(G.state==='over'&&!document.body.classList.contains('replay')&&S.teams[0].score===scoreFine,'Salta finale restituisce il risultato senza ripresa o gol duplicato');
    D.prepare();D.step(70);D.manualGoal();D.step(74);G.prevState='stop';G.state='paused';const timer=G.timer;D.step(20);
    need(G.timer===timer&&!document.body.classList.contains('replay'),'pausa conserva timer e chiude presentazione');
    D.M.newMatch();D.paint();need(A.diagnosticaReplay().count===0&&!Q.statoReplay(),'nuova partita elimina archivio e sessione');
    D.prepare();A.azzeraArchivioReplay();D.H.replay.forzaRegistrazione=false;D.manualGoal();D.step(74);
    need(!document.body.classList.contains('replay')&&A.diagnosticaReplay().count===0,'nessun buffer: prosegue la diretta');
    D.H.replay.forzaRegistrazione=true;D.prepare();D.step(50);R.avviaRigoriFinali();D.paint();need(!Q.statoReplay()&&!document.body.classList.contains('replay'),'serie rigori esclusa');
    D.prepare();R.giveBall(D.p);D.step(70);T.startAct(D.p,'shot',.2,()=>T.doShoot(D.p,.85,false,0));
    for(let i=0;i<180&&S.teams[0].score===0;i++)D.step();
    need(D.B.inRete&&S.teams[0].score===1,'gol fisico prima del cambio immediato');
    const vecchio=Q.statoReplay().info,riserva=S.teams[0].rosa.find(g=>!g.inAcqua&&!g.fuori&&g.ruolo!==0);
    D.H.panchina.chiediCambio(S.teams[0],D.p,riserva,true);D.step(38);
    need(D.p.num!==vecchio.numero,'sostituzione immediata effettiva');
    A.disegnaClipReplay(.95,vecchio,()=>{
      const r=A.ultimaRegiaReplay();need(!r.marcatoreIdentificato&&r.faseCamera==='principale','nessun primo piano del nuovo entrato attribuito al vecchio marcatore');
    });
    // 34 episodi senza reset del pool: identità diverse, archivio circolare e clip sostituite.
    D.prepare();const memoria=[];
    for(let e=0;e<34;e++){
      const p=S.allPlayers[e%14],g=p.team.rosa.find(g=>!g.inAcqua&&!g.fuori&&(g.ruolo===0)===p.isGK);
      if(g)D.J.vesti(p,g);G.state='play';G.after=null;
      for(let k=0;k<32;k++){p.x+=.002;D.paint(1/30);}
      need(A.preparaClipReplay(),'clip disponibile nell’episodio '+e);
      const prima=D.engine();A.disegnaClipReplay(.4,{dir:1,tiroX:8,tiroZ:0,xGol:12.5,zGol:0},()=>{});need(D.engine()===prima,'nessun RNG durante episodio '+e);
      const d=A.diagnosticaReplay();need(d.count<=127&&d.textures<=32&&d.bytes<24*1024*1024,'memoria limitata episodio '+e);memoria.push(d.bytes);
    }
    return {firme,saltati,maxBytes:Math.max(...memoria),textures:A.diagnosticaReplay().textures};
  });
  console.log('✓ firme, skip, pausa, reset, buffer, rigori e memoria',JSON.stringify(casi));
  await page.evaluate(()=>{const D=window.__replay048;D.prepare();D.step(70);D.G.clock=0;D.manualGoal();D.M.endMatch();D.step(74);});
  await page.waitForTimeout(1650);
  assert.equal(await page.evaluate(()=>document.getElementById('menu').style.display==='none'&&document.body.classList.contains('replay')),true,'risultato e premiazione aspettano la fine del replay');
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.__frame());
  assert.equal(await page.evaluate(()=>window.__replay048.G.state==='over'&&!document.body.classList.contains('replay')),true,'rotazione dopo sirena chiude il replay');
  await page.waitForFunction(()=>document.getElementById('menu').style.display!=='none',null,{polling:100,timeout:2000});
  await page.setViewportSize({width:844,height:390});
  await page.evaluate(()=>{const D=window.__replay048;D.prepare();D.step(70);D.manualGoal();D.step(74);window.__timerRotazione=D.G.timer;});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.__frame());
  assert.equal(await page.evaluate(()=>window.__replay048.G.timer===window.__timerRotazione&&!document.body.classList.contains('replay')),true,'rotazione sospende il mondo e chiude replay');
  // Due comparse vere del cambio, registrate prima del gol; sei draw GPU complessivi.
  for(const [width,height] of [[844,390],[667,300]]){
    await page.setViewportSize({width,height});
    const budget=await page.evaluate(foto=>{
      const D=window.__replay048;D.prepare();D.W.renderer.setPixelRatio(1.5);D.W.setDpr(1.5);
      for(const t of D.S.teams){const p=t.players[2],g=t.rosa.find(g=>!g.inAcqua&&g.ruolo!==0);p.x=0;p.z=-9.5;D.H.panchina.chiediCambio(t,p,g,true);}
      // Possesso vicino al centro: entrambi i cambi partono al primo aggiornamento utile.
      D.G.cambiLiberi=false;D.G.state='stop';D.G.timer=10;D.G.after=null;D.P.update(1/60);D.G.state='play';
      D.p=D.S.teams[0].players[1];Object.assign(D.p,{x:10.2,z:0,fx:-1,fz:0,vx:0,vz:0});
      Object.assign(D.S.teams[1].players[0],{x:12,z:2.4});
      D.step(70);D.need(D.PN.comparsePerReplay.filter(c=>c.visibile).length===2,'due comparse reali registrate prima del gol');
      D.T.startAct(D.c,'pass',.08,()=>D.T.doPass(D.c,D.p),[D.p.x,D.p.z]);
      for(let i=0;i<150&&D.B.holder!==D.p;i++)D.step();
      D.need(D.B.holder===D.p,'passaggio reale al centroboa nel filmato');D.S.setCtrl(D.p);
      D.T.startAct(D.p,'beduina',.12,()=>D.T.doShoot(D.p,.85,false,0));
      for(let i=0;i<180&&D.S.teams[0].score===0;i++)D.step();
      D.need(D.B.inRete&&D.S.teams[0].score===1,'beduina reale in porta nel filmato');
      D.step(74);const out=[];
      for(let i=0;i<3;i++){
        const obiettivo=[.1,.65,.95][i],attuale=D.Q.statoReplay().progresso;
        D.gpu=false;D.step(Math.max(0,Math.ceil((obiettivo-attuale)*D.Q.TEMPI_REPLAY.clip*60)));D.gpu=true;D.paint();
        const gl=D.W.renderer.getContext(),pixel=new Uint8Array(4),colori=new Set();
        for(let y=1;y<8;y++)for(let x=1;x<8;x++){
          gl.readPixels(Math.floor(gl.drawingBufferWidth*x/8),Math.floor(gl.drawingBufferHeight*y/8),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
          colori.add(Array.from(pixel).join(','));
        }
        D.need(colori.size>8,'il draw GPU contiene la piscina, non uno sfondo uniforme');
        out.push({calls:D.W.renderer.info.render.calls,tri:D.W.renderer.info.render.triangles,dpr:D.W.renderer.getPixelRatio(),corpi:D.S.allPlayers.filter(p=>p.mesh.g.visible&&p.mesh.corpo?.radice.visible).length,colori:colori.size});
        if(foto){
          // Il RAF finto non ridisegna mentre Playwright cattura il DOM: conserva
          // i pixel del draw nel medesimo task, prima che WebGL svuoti il buffer.
          out[out.length-1].immagine=D.W.renderer.domElement.toDataURL();out[out.length-1].progresso=D.Q.statoReplay().progresso;
        }
      }
      D.gpu=false;return out;
    },foto);
    for(const b of budget){assert.ok(b.calls>0&&b.calls<100,`GPU ${width}×${height}: meno di100 draw (${b.calls})`);assert.ok(b.tri<150000,`GPU triangoli ${b.tri}`);assert.equal(b.corpi,14);assert.equal(b.dpr,1.5);}
    console.log('✓ budget GPU',width,height,JSON.stringify(budget.map(({immagine, ...dati})=>dati)));
    if(foto){
      fs.mkdirSync(path.join(root,'docs/immagini'),{recursive:true});
      for(let i=0;i<budget.length;i++){
        await page.evaluate(async({immagine,progresso})=>{
          const U=await import('/src/replay-ui.js');U.aggiornaReplay(progresso);
          const img=document.createElement('img');img.id='fotoReplay048';img.src=immagine;
          img.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:1;pointer-events:none';document.body.append(img);await img.decode();
        },budget[i]);
        await page.screenshot({path:path.join(root,`docs/immagini/v048-replay-regia-${width}x${height}-${i+1}.png`)});
        await page.locator('#fotoReplay048').evaluate(img=>img.remove());
      }
    }
  }
  const leggibilita=[];
  for(const [width,height,sl,sr,sb] of [[844,390,0,0,0],[667,300,0,0,0],[667,300,44,44,21]]){
    await page.setViewportSize({width,height});
    await page.evaluate(v=>{for(const [k,n] of Object.entries(v))document.documentElement.style.setProperty(k,n+'px');},{'--sl':sl,'--sr':sr,'--sb':sb});
    const misure=await page.evaluate(()=>{
      const D=window.__replay048,risultati=[];
      for(const dir of [-1,1])for(const [nome,x,z,lob] of [['da fuori',5,0,false],['ala',10,6.2,false],['palombella',7,-2,true]]){
        D.prepare();D.S.teams[0].dir=dir;D.S.teams[1].dir=-dir;
        for(const p of D.S.allPlayers)Object.assign(p,{x:-dir*8,z:-9,vx:0,vz:0});
        Object.assign(D.p,{x:dir*x,z,fx:dir,fz:0,s:{...D.p.s,pre:99,pot:95},st:{...D.p.st,sht:1}});
        Object.assign(D.S.teams[1].players[0],{x:dir*12,z:-Math.sign(z||1)*2.4});
        D.R.giveBall(D.p);D.S.setCtrl(D.p);D.step(140);
        D.T.startAct(D.p,lob?'lob':'shot',.3,()=>D.T.doShoot(D.p,.85,lob,0));
        for(let i=0;i<240&&D.S.teams[0].score===0;i++)D.step();
        D.need(D.B.inRete&&D.S.teams[0].score===1,'scenario fisico '+nome+' dir'+dir+' '+JSON.stringify({state:D.B.state,kind:D.B.kind,x:D.B.x,y:D.B.y,z:D.B.z,save:D.B.saveChecked,score:D.S.teams[0].score}));
        D.step(74);const info=D.Q.statoReplay()?.info;D.need(!!info,'replay disponibile '+nome);
        const coperture=['.replay-testa','.replay-marchio','.replay-fascia','#replaySalta'].map(sel=>document.querySelector(sel).getBoundingClientRect());
        const proietta=p=>{const v=p.clone().project(D.W.camera);return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2,z:v.z};};
        const css=getComputedStyle(document.documentElement),inset=k=>parseFloat(css.getPropertyValue(k))||0;
        // v0.61 (Ale: «ha senso che l'inquadratura cambi, non statica»): nell'azione la camera si muove senza scatti e tiene in
        // vista palla, tiratore e porta; dopo la rete un solo taglio sul primo piano del marcatore (testa e mano in vista, grandi)
        let pallaMin=Infinity,campioni=0,postGol=0,primi=0,tagli=0,prima=null,ultima=null,passoMax=0,giroMax=0,testaAzione=0,testaPrimo=Infinity,fasePrec=null;
        for(let n=0;n<=30;n++)D.A.disegnaClipReplay(n/30,info,()=>{
          const c=D.W.camera,r=D.A.ultimaRegiaReplay();
          D.need(Number.isFinite(r.rilascio)&&Number.isFinite(r.gol)&&r.gol>r.rilascio,'rilascio e gol riconosciuti dalla sequenza reale');
          const v=c.position.clone(),testa=D.p.mesh.corpo.ossa.testa.getWorldPosition(v.clone());
          const mano=D.p.mesh.corpo.ossa[D.p.mano==='S'?'manoS':'manoD'].getWorldPosition(v.clone());
          const primo=r.faseCamera==='primoPiano';
          const punti=[['testa',testa],['mano',mano]];
          if(!primo){punti.push(['palla',D.W.ball3d.position]);for(const y of [0,.9])for(const z of [-1.5,1.5])punti.push(['porta',v.clone().set(dir*12.5,y,z)]);}
          for(const [etichetta,p] of punti){
            const q=proietta(p);
            D.need(q.z>-1&&q.z<1&&q.x>=inset('--sl')+8&&q.x<=innerWidth-inset('--sr')-8&&q.y>=8&&q.y<=innerHeight-inset('--sb')-8,`${nome} dir${dir} p${n}/30 ${r.faseCamera}: ${etichetta} fuori schermo ${JSON.stringify(q)}`);
            D.need(!coperture.some(b=>q.x>b.left-5&&q.x<b.right+5&&q.y>b.top-5&&q.y<b.bottom+5),`${nome} dir${dir} p${n}/30 ${r.faseCamera}: ${etichetta} sotto overlay ${JSON.stringify(q)}`);
          }
          const qt=proietta(testa),bt=proietta(v.clone().set(.12,0,0).applyQuaternion(c.quaternion).add(testa)),dt=2*Math.hypot(bt.x-qt.x,bt.y-qt.y);
          if(primo){
            primi++;testaPrimo=Math.min(testaPrimo,dt);
            if(fasePrec==='principale')tagli++;
          }else{
            D.need(fasePrec!=='primoPiano','un solo taglio: dal primo piano non si torna all\'azione');
            const raggio=D.W.ball3d.geometry.parameters.radius*D.W.ball3d.getWorldScale(v.clone()).x;
            const centro=proietta(D.W.ball3d.position),bordo=proietta(v.clone().set(raggio,0,0).applyQuaternion(c.quaternion).add(D.W.ball3d.position));
            const diametro=2*Math.hypot(bordo.x-centro.x,bordo.y-centro.y);pallaMin=Math.min(pallaMin,diametro);
            D.need(diametro>=4,'palla leggibile '+nome+': '+diametro+'px');
            D.need(c.position.z>0,'nell\'azione la camera resta sul lato della giuria (mai girata di 180°)');
            testaAzione=Math.max(testaAzione,dt);
            if(ultima){passoMax=Math.max(passoMax,c.position.distanceTo(ultima.p));giroMax=Math.max(giroMax,c.quaternion.angleTo(ultima.q));}
            if(!prima)prima={p:c.position.clone(),q:c.quaternion.clone()};
            ultima={p:c.position.clone(),q:c.quaternion.clone()};
          }
          if(r.sorgente>r.gol+1e-8)postGol++;
          fasePrec=r.faseCamera;campioni++;
        });
        const giro=prima&&ultima?prima.q.angleTo(ultima.q):0;
        D.need(giro>=0.25,`${nome} dir${dir}: la camera dell'azione gira davvero (${giro.toFixed(3)} rad)`);
        D.need(giroMax<=0.16&&passoMax<=1.6,`${nome} dir${dir}: nessuno scatto nell'azione (giro max ${giroMax.toFixed(3)} rad, passo max ${passoMax.toFixed(2)} m)`);
        D.need(tagli===1&&primi>=5,`${nome} dir${dir}: un taglio sul primo piano (${tagli} tagli, ${primi} campioni)`);
        D.need(testaPrimo>=2*testaAzione,`${nome} dir${dir}: nel primo piano la testa è almeno il doppio (${testaPrimo.toFixed(1)} contro ${testaAzione.toFixed(1)} px)`);
        D.need(campioni===31&&postGol>0,'azione e reazione entrambe verificate');
        risultati.push({nome,dir,campioni,pallaMin:+pallaMin.toFixed(2),postGol,giro:+giro.toFixed(3),giroMax:+giroMax.toFixed(3),passoMax:+passoMax.toFixed(2),primi,testaAzione:+testaAzione.toFixed(1),testaPrimo:+testaPrimo.toFixed(1)});
      }
      return risultati;
    });
    leggibilita.push({viewport:[width,height],insets:[sl,sr,sb],scenari:misure});
  }
  console.log('✓ leggibilità, nessuna copertura/taglio in volo, due direzioni',JSON.stringify(leggibilita));
  assert.deepEqual(errors,[],'nessun errore JavaScript');
  console.log('✓ replay v0.48 completo');
}finally{if(browser)await browser.close();await server.close();}
