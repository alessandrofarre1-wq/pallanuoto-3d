// Scelta assistita e servizi reali alla boa: nessuna modifica alla precisione del lancio.
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
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.__rnd=()=>.5;});
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:120000});
  const r=await page.evaluate(async()=>{
    const [S,T,R,P,A,E,Q,I,V,ST]=await Promise.all(['stato','tiri','regole','partita','ia','entrate','schemi','input','replay','statistiche'].map(n=>import('/src/'+n+'.js')));
    const vista=await import('/src/grafica/render.js'),scena=await import('/src/grafica/scena.js');
    const H=window.__pallanuoto,G=S.game,B=S.ball,dt=1/60;let n=0;
    scena.renderer.render=()=>{};H.replay.forzaRegistrazione=false;
    const put=(p,d,z,dir)=>Object.assign(p,{x:(12.5-d)*dir,z:z*dir,vx:0,vz:0});
    function setup(dir=1,eta=4){
      I.resetInput();V.interrompiReplay();ST.azzeraStatistiche();
      const [t,o]=S.teams;t.dir=dir;o.dir=-dir;t.human=true;o.human=false;
      Object.assign(G,{state:'play',time:200+(++n)*20,possT:200+n*20-eta,passaggi:2,shot:24,clock:180,period:1,autoplay:false,possTeam:t,
        penalty:null,rigoriFinali:null,rigoreDifferito:null,fermoFallo:null,scattando:false});
      S.fight.active=false;
      for(const team of S.teams){
        E.resetDisposizioneTattica(team);Q.applicaSchema(team,Q.copiaSchema('arco'));
        Object.assign(team,{cambio:null,coda:[],prossimoControllo:Infinity,timeouts:0,contro:null,chiamataAttacco:null});
      }
      for(const p of S.allPlayers){
        Object.assign(p,{excluded:false,uscendo:false,act:null,charging:false,cut:null,girata:null,stamina:1,pressatoUntil:0,pressatoDa:null,
          stunUntil:0,freeThrow:false,decideT:99,reazioneT:99,appoggio:null,oriz:0,fx:dir,fz:0,tackleCD:99,colpi:[],areaT:0,rientro:null,
          ricevutoInEntrata:false,ricevutoPassaggio:false,alVolo:false,shootNext:false,fakeUntil:0,mano:'D',perno:false,scivolaAI:false});
        p.s={...p.s,pas:94,vis:90,pre:85,vel:85,frz:85,dis:99};p.st=H.prova.valoriMotore(p.s);delete p.ballW;delete p.ballVistaW;
        if(p.scheda){p.scheda.fuori=false;p.scheda.pf=0;}
      }
      for(const p of t.players)put(p,...(p.isGK?[24.3,0]:t.schema.attacco[p.i-1]),dir);
      for(const p of o.players)put(p,p.isGK?.7:18,p.isGK?0:-7+p.i*1.0,dir);
      const h=t.players[4],b=E.centroAttacco(t),d=E.difensoreEntrata(b);
      put(d,5.3,-.6,dir);
      R.giveBall(h);B.holdTime=.4;B.x=h.x;B.z=h.z;B.y=.4;G.possT=G.time-eta;ST.apriAzione(t);G.possT=G.time-eta;
      // L'età del possesso nelle statistiche deve descrivere la stessa azione.
      ST.azioneAperta().t0=G.possT;
      S.setCtrl(h);vista.render(dt,G.time*1000);
      return {t,o,h,b,d};
    }
    const scelte=[];
    for(const dir of [1,-1])for(const eta of [1,5.5,16])for(const caso of ['libera','testa-avanti','marcata','corridoio','raddoppio','portiere-uscito']){
      const {t,o,h,b,d}=setup(dir,eta);
      if(caso==='testa-avanti'){put(d,3.8,-1.1,dir);b.fx=dir;b.fz=0;}
      if(caso==='marcata')put(d,1.9,0,dir);
      if(caso==='corridoio')Object.assign(d,{x:(h.x+b.x)/2,z:(h.z+b.z)/2});
      if(caso==='raddoppio'){put(d,3.8,-1.1,dir);const aiuto=o.players.find(q=>!q.isGK&&q!==d);put(aiuto,2.1,1.0,dir);}
      if(caso==='portiere-uscito'){put(o.players[0],1.9,0,dir);o.players[0].vx=-dir*1.2;}
      const prima=S.allPlayers.map(q=>[q.x,q.z]),chiara=T.occasioneBoa(h,b),umano=T.humanPassTarget(h,0,0),cpu=T.bestPassTarget(h,false);
      const angolo=T.humanPassTarget(h,0,dir),direzionale=angolo?.i;
      scelte.push({dir,eta,caso,chiara,umano:umano?.i,cpu:cpu?.i,boa:b.i,direzionale,
        nessunoSpostamento:prima.every(([x,z],i)=>S.allPlayers[i].x===x&&S.allPlayers[i].z===z)});
    }
    const ricezioni=[];
    for(const dir of [1,-1])for(const mano of ['D','S']){
      const {t,h,b,d}=setup(dir,5.5);b.mano=mano;put(d,8,-4,dir);
      const scelto=T.humanPassTarget(h,0,0),inizio=G.time;
      T.startAct(h,'pass',.08,()=>T.doPass(h,scelto),[scelto.x,scelto.z]);
      let lanciato=false,presa=false,metri=0,prima=[b.x,b.z],rilascio=null;
      for(let f=0;f<180;f++){
        P.update(dt);V.interrompiReplay();vista.render(dt,G.time*1000);
        metri=Math.max(metri,Math.hypot(b.x-prima[0],b.z-prima[1]));prima=[b.x,b.z];
        if(B.state==='flight'&&B.kind==='pass'&&B.target===b){lanciato=true;rilascio??=G.time-inizio;}
        if(B.holder===b&&b.ricevutoPassaggio){presa=true;break;}
        if(G.state!=='play'||G.possTeam!==t)break;
      }
      ricezioni.push({dir,mano,scelto:scelto.i,boa:b.i,lanciato,presa,rilascio,tempo:G.time-inizio,maxPasso:metri});
    }
    return {scelte,ricezioni};
  });
  console.log(JSON.stringify(r,null,2));
  for(const x of r.scelte){
    assert.ok(x.nessunoSpostamento,'la selezione non sposta giocatori');
    if(x.caso==='libera'||x.caso==='testa-avanti'){
      assert.ok(x.chiara&&x.umano===x.boa&&x.cpu===x.boa,'boa davvero libera servita senza ritardo strategico '+JSON.stringify(x));
    }else{
      assert.equal(x.chiara,false,'nessuna occasione chiara con copertura reale '+JSON.stringify(x));
      if(x.eta<=5.5)assert.notEqual(x.umano,x.boa,'nessun servizio neutro forzato nel caso chiuso '+JSON.stringify(x));
    }
  }
  for(const x of r.ricezioni)assert.ok(x.scelto===x.boa&&x.lanciato&&x.presa&&x.maxPasso<.12,'passaggio e presa fisici nei due versi/con entrambe le mani '+JSON.stringify(x));
  assert.deepEqual(errori,[]);
  if(salva)fs.writeFileSync(salva,JSON.stringify(r,null,2)+'\n');
  console.log('PASS servizio boa v0.70: scelta assistita/CPU, coperture reali e quattro prese fisiche');
}finally{await browser.close();await server.close();}
