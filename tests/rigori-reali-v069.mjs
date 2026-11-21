// API reali delle regole e un tiro fisico. Le scene del controllore gol/rimessa
// provocano esplicitamente l'esito tramite l'API: non sono traiettorie imposte.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const salva=process.argv.find(x=>x.startsWith('--salva='))?.slice(8);
const server=await createServer({logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errori=[];
  page.on('pageerror',e=>errori.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.__casoRigori=.1;window.__rnd=()=>window.__casoRigori;});
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:120000});
  const r=await page.evaluate(async()=>{
    const [S,R,P,T,F,I,V,ST]=await Promise.all(['stato','regole','partita','tiri','fisica','input','replay','statistiche'].map(n=>import('/src/'+n+'.js')));
    const vista=await import('/src/grafica/render.js');
    const H=window.__pallanuoto,G=S.game,B=S.ball,dt=1/60;let scena=0;
    const put=(p,prof,z,dir)=>Object.assign(p,{x:(12.5-prof)*dir,z:z*dir,vx:0,vz:0});
    function setup(dir=1){
      I.resetInput();V.interrompiReplay();ST.azzeraStatistiche();window.__casoRigori=.1;
      const [t,o]=S.teams;t.dir=dir;o.dir=-dir;t.score=o.score=0;t.timeouts=o.timeouts=0;
      Object.assign(G,{state:'play',time:200+(++scena)*20,possT:192+scena*20,possTeam:t,period:1,clock:180,shot:24,
        penalty:null,rigoriFinali:null,rigoreDifferito:null,fermoFallo:null,after:null,timer:0,autoplay:true,cambiLiberi:false});
      S.setCtrl(null);S.fight.active=false;
      for(const team of S.teams){team.cambio=null;team.coda=[];team.prossimoControllo=Infinity;team.contro=null;}
      for(const p of S.allPlayers){
        Object.assign(p,{excluded:false,uscendo:false,alPozzetto:false,puoRientrare:false,pf:0,act:null,charging:false,chargeT:0,cut:null,girata:null,
          freeThrow:false,pressatoUntil:0,pressatoDa:null,stunUntil:0,tackleCD:0,colpi:[],stamina:1,oriz:0,areaT:0,turnedUntil:0,
          fx:p.team.dir,fz:0,decideT:99,reazioneT:99,appoggio:null,perno:false,scivolaAI:false});
        if(p.scheda){p.scheda.pf=0;p.scheda.fuori=false;}
        put(p,p.isGK?24:20,(-1+p.i*.9),dir);delete p.ballW;delete p.ballVistaW;
      }
      const c=t.players[1],d=o.players[6];put(c,2.6,0,dir);put(d,3.5,0,dir);put(o.players[0],.4,0,dir);
      c.fx=dir;c.fz=0;d.fx=-dir;d.fz=0;
      Object.assign(B,{state:'held',holder:c,kind:null,target:null,shooter:null,lastTeam:t,x:c.x,y:.15,z:c.z,vx:0,vy:0,vz:0,
        holdTime:.5,afterShot:false,flightT:0,pickupCD:0,inRete:false,daTiro:false,inUscita:false,saveChecked:false,anticipoBattuto:null});
      R.giveBall(c);B.holdTime=.5;c.fx=dir;c.fz=0;
      vista.render(dt,G.time*1000);
      return {t,o,c,d,dir};
    }
    const rigori=t=>ST.squadreStat()[t.idx].rigori;
    const anticipo=[],negativi=[],contrasti=[],controllore=[],voli=[],fineTempo=[];
    for(const dir of [1,-1]){
      {
        const {t,c,d}=setup(dir);window.__casoRigori=0;
        for(let n=0;n<50;n++)R.anticipoBattuto(d,c);
        anticipo.push({dir,chiamate:50,rigori:rigori(t),falli:d.pf,espulso:d.excluded,stato:G.state,pallaAncoraSua:B.holder===c,attesa:!!G.rigoreDifferito});
      }
      for(const caso of ['fuori6','palla-altrove','passaggio','tiro-libero','senza-contatto','aiuto-in-linea']){
        const {t,o,c,d}=setup(dir);
        if(caso==='fuori6'){put(c,7,0,dir);put(d,6.1,0,dir);}
        if(caso==='palla-altrove')R.giveBall(t.players[4]);
        if(caso==='passaggio')T.startAct(c,'pass',.1,()=>{});
        if(caso==='tiro-libero')c.freeThrow=true;
        if(caso==='senza-contatto')put(d,4.6,0,dir);
        if(caso==='aiuto-in-linea'){put(c,4.8,0,dir);put(d,5.7,0,dir);put(o.players[5],2.4,0,dir);}
        const prima=B.holder,esito=R.penalty(d,c,'sonda condizioni');
        negativi.push({dir,caso,esito,rigori:rigori(t),falli:d.pf,stato:G.state,possessoConservato:B.holder===prima,differito:!!G.rigoreDifferito});
      }
      {
        const {t,c,d}=setup(dir);const esito=R.tackle(d,c,{voluto:true});
        for(let n=0;n<6;n++)P.update(dt);
        contrasti.push({dir,esito,rigori:rigori(t),falli:d.pf,stato:G.state,differito:!!G.rigoreDifferito,timer:G.timer});
      }
      // Il gesto e la fisica sono quelli del gioco; il ciclo isola il tiro dagli altri
      // contrasti, senza imporre la traiettoria né scegliere se debba segnare.
      {
        const {t,c,d}=setup(dir);
        T.startAct(c,'shot',.08,()=>T.doShoot(c,.8,false,null));
        const accettato=R.penalty(d,c,'tiro ostacolato da dietro');let volo=false,frameVolo=null,partenza=null;
        const prima=G.time;
        for(let n=0;n<180;n++){
          G.time+=dt;T.updateActs(dt);
          if(B.state==='flight'&&B.kind==='shot'&&B.shooter===c&&!volo){
            volo=true;partenza=G.time-prima;R.risolviRigoreDifferito();
            frameVolo={differito:!!G.rigoreDifferito,rigori:rigori(t),stato:G.state};
          }
          F.updateBall(dt);R.risolviRigoreDifferito();
          if(!G.rigoreDifferito)break;
        }
        voli.push({dir,accettato,volo,partenza,frameVolo,gol:t.score,rigori:rigori(t),falli:d.pf,pending:!!G.rigoreDifferito,stato:G.state});
      }
      // Contratto del controllore: le due risposte sono indotte dalle API regolari
      // dopo un rilascio reale. Questi due casi non provano l'esito della traiettoria.
      for(const esito of ['gol','rimessa']){
        const {t,o,c,d}=setup(dir);
        T.startAct(c,'shot',.08,()=>T.doShoot(c,.8,false,null));
        const accettato=R.penalty(d,c,'tiro ostacolato da dietro'),prima=G.time;
        let duranteGesto=false,volo=false;
        for(let n=0;n<60;n++){
          G.time+=dt;T.updateActs(dt);R.risolviRigoreDifferito();
          if(c.act&&!c.act.done)duranteGesto||=!!G.rigoreDifferito&&rigori(t)===0&&G.state==='play';
          if(B.state==='flight'&&B.kind==='shot'&&B.shooter===c){volo=true;break;}
        }
        const duranteVolo=!!G.rigoreDifferito&&rigori(t)===0&&G.state==='play';
        if(esito==='gol')R.goalScored(t);else R.goalThrow(o);
        for(let n=0;n<6;n++)R.risolviRigoreDifferito();
        controllore.push({dir,esito,accettato,duranteGesto,volo,duranteVolo,rilascio:G.time-prima,gol:t.score,rigori:rigori(t),falli:d.pf,pending:!!G.rigoreDifferito});
      }
      {
        const {t,o,c,d}=setup(dir);G.period=4;G.clock=.001;
        // Il controllore reale deve conservare il fallo fino al rilascio,
        // anche se il periodo scade nel primo aggiornamento del gesto.
        for(const q of S.allPlayers)q.tackleCD=99;
        T.startAct(c,'shot',.08,()=>T.doShoot(c,.8,false,null));
        R.penalty(d,c,'tiro ostacolato a fine tempo');P.update(dt);
        const scadutoSenzaPerdita=G.clock===0&&G.state==='play'&&!!G.rigoreDifferito;
        let volo=false;
        for(let n=0;n<60;n++){
          G.time+=dt;T.updateActs(dt);R.risolviRigoreDifferito();
          if(B.state==='flight'&&B.kind==='shot'){volo=true;break;}
        }
        R.goalThrow(o);R.risolviRigoreDifferito();
        fineTempo.push({dir,scadutoSenzaPerdita,volo,clock:G.clock,rigori:rigori(t),falli:d.pf,stato:G.state});
      }
    }
    return {anticipo,negativi,contrasti,voli,controllore,fineTempo};
  });
  console.log(JSON.stringify(r,null,2));
  for(const x of r.anticipo)assert.ok(x.rigori===0&&x.falli===0&&!x.espulso&&x.stato==='play'&&x.pallaAncoraSua&&!x.attesa,'ricevere davanti al marcatore non è un fallo '+x.dir);
  for(const x of r.negativi)assert.ok(x.esito===false&&x.rigori===0&&x.falli===0&&x.stato==='play'&&x.possessoConservato&&!x.differito,`rigore rifiutato ${x.caso}, verso ${x.dir}`);
  for(const x of r.contrasti)assert.ok(x.esito==='rigore'&&x.rigori===1&&x.falli===1&&x.stato==='stop'&&!x.differito&&x.timer>1,'fallo reale: un solo rigore nei sei frame successivi '+x.dir);
  for(const x of r.voli){
    assert.ok(x.accettato&&x.volo&&x.frameVolo.differito&&x.frameVolo.rigori===0&&x.frameVolo.stato==='play','il rigore lascia partire il tiro fisico '+x.dir);
    assert.ok(!x.pending&&((x.gol===1&&x.rigori===0&&x.falli===0)||(x.gol===0&&x.rigori===1&&x.falli===1)),'esito della traiettoria: gol oppure un solo rigore '+x.dir);
  }
  for(const x of r.controllore){
    assert.ok(x.accettato&&x.duranteGesto&&x.volo&&x.duranteVolo&&!x.pending,'attesa durante gesto e volo '+x.dir+' '+x.esito);
    assert.ok(x.esito==='gol'?x.gol===1&&x.rigori===0&&x.falli===0:x.gol===0&&x.rigori===1&&x.falli===1,'controllore gol/rimessa senza doppia sanzione '+x.dir+' '+x.esito);
  }
  for(const x of r.fineTempo)assert.ok(x.scadutoSenzaPerdita&&x.volo&&x.clock===0&&x.rigori===1&&x.falli===1&&x.stato==='stop','fine quarto periodo: il rigore dovuto non sparisce '+x.dir);
  assert.deepEqual(errori,[]);
  if(salva)fs.writeFileSync(salva,JSON.stringify(r,null,2)+'\n');
  console.log('PASS rigori reali v0.69: anticipo senza sanzione, guardie, contrasto, tiro fisico e controllore differito nei due versi');
}finally{await browser.close();await server.close();}
