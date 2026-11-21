// Ricezione del centroboa già fronteporta: scelta IA, palmo reale e rilascio fisico.
// La scena iniziale è preparata; nessun tiro, passaggio o rigore viene imposto nel ciclo.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
const server=await createServer({logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.__rnd=()=>.99;});
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:60000});
  const r=await page.evaluate(async()=>{
    const [S,C,L,T,R,P,A,Q,I,V]=await Promise.all(['stato','centroboa','lotta','tiri','regole','partita','ia','schemi','input','replay'].map(n=>import('/src/'+n+'.js')));
    const [vista,scena]=await Promise.all([import('/src/grafica/render.js'),import('/src/grafica/scena.js')]);
    const H=window.__pallanuoto,G=S.game,B=S.ball,dt=1/60;scena.renderer.render=()=>{};let n=0;
    function setup(dir=1,mano='D'){
      I.resetInput();V.interrompiReplay();
      Object.assign(G,{state:'play',time:200+(++n)*20,possT:190+n*20,passaggi:3,period:1,clock:180,shot:15,autoplay:true,penalty:null,rigoriFinali:null,after:null,possTeam:S.teams[0]});S.setCtrl(null);
      const [t,o]=S.teams;t.dir=dir;o.dir=-dir;
      for(const team of S.teams){Q.applicaSchema(team,Q.copiaSchema('arco'));C.difensoreCentro(team.players[1]);
        Object.assign(team,{human:false,accoppiamenti:null,occupantiAttacco:null,entrataAzione:null,rotazioneCentro:null,preparaEntrata:null,entrataDopo:Infinity,schemaStato:null,contro:null,coda:[],cambio:null,prossimoControllo:Infinity,timeouts:0,adattamentoEntrata:null,scambio:null});}
      for(const p of S.allPlayers){
        Object.assign(p,{x:-10*dir,z:(p.team===t?-1:1)*(3+p.i*.9),vx:0,vz:0,fx:dir,fz:0,oriz:0,orizPrec:0,act:null,charging:false,chargeT:0,excluded:false,uscendo:false,freeThrow:false,
          girata:null,turnedUntil:0,pressatoUntil:0,pressatoDa:null,stunUntil:0,cut:null,appoggio:null,tackleCD:0,colpi:[],areaT:0,rientro:null,lunge:0,perno:false,scivolaAI:false,stamina:1});
      }
      const b=t.players[1],d=C.difensoreCentro(b),h=t.players[4],gx=S.goalX(t);
      Object.assign(b,{x:gx-dir*3,z:0,fx:dir,fz:0,mano});Object.assign(d,{x:b.x-dir*.95,z:0,fx:dir,fz:0});
      Object.assign(h,{x:gx-dir*6,z:4*dir});
      // Il portiere usa la sua linea fissa del motore: nessun salto iniziale della fixture.
      for(const team of S.teams)Object.assign(team.players[0],{x:S.ownGoalX(team)+team.dir*.7,z:0});
      for(const p of S.allPlayers){const a=A.uomoDi(p);p.lagX=a.x;p.lagZ=a.z;}
      R.giveBall(b);B.x=b.x;B.z=b.z;B.holdTime=.2;
      Object.assign(S.fight,{active:true,boa:b,def:d,v:0,holdT:2.2,decT:0,possT:G.possT,foamT:99});
      vista.render(dt,G.time*1000);return {t,o,b,d,h};
    }
    const tiri=[];
    for(const dir of [1,-1])for(const mano of ['D','S']){
      const {b,d}=setup(dir,mano),inizio=G.time,fronte=C.boaFrontePorta(b),contrastoConsentito=!L.fightOn(b,d);let precedente=S.allPlayers.map(p=>[p.x,p.z]),maxPasso=0,tiro=null,origine=null;
      for(let frame=0;frame<90;frame++){
        const palmo=b.ballW?.slice();P.update(dt);V.interrompiReplay();
        for(let i=0;i<S.allPlayers.length;i++)maxPasso=Math.max(maxPasso,Math.hypot(S.allPlayers[i].x-precedente[i][0],S.allPlayers[i].z-precedente[i][1]));
        precedente=S.allPlayers.map(p=>[p.x,p.z]);
        if(B.state==='flight'&&B.shooter===b){
          tiro=B.kind;origine=palmo?Math.hypot(B.x-palmo[0],B.y-Math.max(.3,palmo[1]),B.z-palmo[2]):null;break;
        }
        vista.render(dt,G.time*1000);
      }
      tiri.push({dir,mano,fronte,contrastoConsentito,tiro,secondi:G.time-inizio,motivo:b.motivoTiro,palmoReale:origine!==null,origine,maxPasso,rigore:!!G.penalty});
    }
    const rinunce=[];
    for(const dir of [1,-1])for(const caso of ['spalle','linea-chiusa','tiro-libero','lontano']){
      const {b,d,o}=setup(dir);
      if(caso==='spalle')b.fx=-dir;
      if(caso==='linea-chiusa')Object.assign(o.players[2],{x:b.x+dir*1.2,z:0});
      if(caso==='tiro-libero')b.freeThrow=true;
      if(caso==='lontano')b.x=S.goalX(b.team)-dir*6;
      const fronte=C.boaFrontePorta(b);L.boaHold(b,d,dt);
      rinunce.push({dir,caso,fronte,gesto:b.act?.kind??null});
    }
    const {b,d}=setup();G.autoplay=false;S.setCtrl(b);L.boaHold(b,d,dt);
    return {tiri,rinunce,umano:{controllo:S.ctrl===b,gesto:b.act?.kind??null}};
  });
  console.log(JSON.stringify(r,null,2));
  for(const t of r.tiri){
    const nome=`dir=${t.dir} mano=${t.mano}`;
    assert.ok(t.fronte&&t.contrastoConsentito,nome+': occasione geometrica e intervento reale del difensore consentito');
    assert.equal(t.tiro,'shot',nome+': conclusione vera, nessuno scarico casuale');
    assert.ok(t.secondi<1&&t.palmoReale&&t.maxPasso<.12,nome+': gesto tempestivo dalla mano, nuoto continuo');
    assert.equal(t.rigore,false,nome+': la ricezione non assegna rigori');
  }
  for(const x of r.rinunce){assert.equal(x.fronte,false,x.caso+' non è una ricezione libera fronteporta');assert.notEqual(x.gesto,'shot',x.caso+' non obbliga a un tiro frontale');}
  assert.ok(r.umano.controllo&&r.umano.gesto===null,'la boa comandata conserva la scelta del giocatore');
  assert.deepEqual(errors,[]);console.log('PASS boa fronteporta: 4 tiri reali, 8 rinunce geometriche/regolamentari, controllo umano');
}finally{await browser.close();await server.close();}
