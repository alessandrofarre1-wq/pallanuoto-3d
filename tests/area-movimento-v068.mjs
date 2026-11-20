// Il rientro dall'area dei 2 m usa il nuoto: niente correzione istantanea di x.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
const server=await createServer({logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__rnd=()=>.5;window.requestAnimationFrame=()=>1;});
 await page.goto(server.resolvedUrls.local[0]);
 await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:60000});
 const r=await page.evaluate(async()=>{
  const [S,P,I]=await Promise.all(['stato','partita','input'].map(n=>import('/src/'+n+'.js'))),H=window.__pallanuoto,out=[];
  for(const dir of [1,-1]){
   I.resetInput();S.fight.active=false;
   for(const t of S.teams){t.dir=t.idx?-dir:dir;t.human=true;t.accoppiamenti=null;t.occupantiAttacco=null;t.coda=[];t.cambio=null;t.prossimoControllo=Infinity;}
   const t=S.teams[0],gx=12.5*dir,h=t.players[6],q=t.players[4];
   for(const p of S.allPlayers)Object.assign(p,{x:(p.i-3)*2,z:p.team.idx?7:-7,vx:0,vz:0,fx:p.team.dir,fz:0,excluded:false,uscendo:false,cut:null,act:null,
    charging:false,oriz:0,stamina:1,areaT:0,stunUntil:1000,pressatoUntil:0,contactT:0,lunge:0,tackleCD:999,colpi:[],lagX:(p.i-3)*2,lagZ:p.team.idx?7:-7});
   Object.assign(S.game,{state:'play',time:100,possT:100,possTeam:t,clock:180,shot:28,penalty:null,rigoriFinali:null,autoplay:false});
   Object.assign(h,{x:gx-dir*7,z:0,stunUntil:0});Object.assign(q,{x:gx-dir*1.2,z:0,stunUntil:0});
   H.regole.giveBall(h);H.__setCtrl(h);S.ball.x=h.x;S.ball.z=h.z;
   let maxStep=0,uscita=null;
   for(let i=0;i<90&&S.game.state==='play';i++){
    const x=q.x,z=q.z;P.update(1/60);maxStep=Math.max(maxStep,Math.hypot(q.x-x,q.z-z));
    if(uscita===null&&(gx-q.x)*dir>=2)uscita=(i+1)/60;
   }
   out.push({dir,maxStep,uscita,distanzaPorta:(gx-q.x)*dir,stato:S.game.state});
  }
  return out;
 });
 console.log('Misure rientro: '+JSON.stringify(r));
 for(const x of r){assert.ok(x.maxStep<.12,'nessun salto di posizione al rientro dai2m');assert.ok(x.distanzaPorta>2&&x.uscita!==null&&x.uscita<=1.2,'rientra nuotando entro la tolleranza regolamentare del gioco');assert.equal(x.stato,'play');}
 assert.deepEqual(errors,[]);console.log('PASS area, due direzioni: '+JSON.stringify(r));
}finally{await browser.close();await server.close();}
