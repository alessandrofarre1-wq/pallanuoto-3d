// Stesse scene a 60 Hz, senza RAF né IA casuale. --prima ricarica i moduli della v0.43.
// node tests/nuoto-v044.mjs [--prima] [--riferimento=38b31e8] [--json=/tmp/misure.json] [--foto=/tmp/nuoto.png] [--porta=4387]
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const prima=process.argv.includes('--prima'), riferimento=arg('riferimento')||'38b31e8';
const porta=+(arg('porta')||4387);
const originali=new Map();
if(prima)for(const f of ['fisica.js','controllo.js','input.js','grafica/pose.js']){
  originali.set(path.join(root,'src',f),execFileSync('git',['show',riferimento+':src/'+f],{cwd:root,encoding:'utf8'}));
}
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:porta,strictPort:true,hmr:false,watch:null},
  plugins:[{name:'nuoto-v043',enforce:'pre',load:id=>originali.get(id)}]});
await server.listen();
const browser=await chromium.launch({...(existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    let a=44;window.__rnd=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
    window.requestAnimationFrame=()=>1;
  });
  await page.goto('http://127.0.0.1:'+porta,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:120000});
  const out=await page.evaluate(async()=>{
    const [F,S,T,P,C,I,K]=await Promise.all([import('/src/fisica.js'),import('/src/stato.js'),import('/src/tiri.js'),import('/src/grafica/pose.js'),import('/src/controllo.js'),import('/src/input.js'),import('/src/costanti.js')]);
    const G=S.game,B=S.ball,dt=1/60;let scena=0;
    function prepara(ti=0,mano='D',hold=false){
      C.resetTap();Object.assign(G,{state:'play',time:100+(++scena)*10,autoplay:false,possTeam:S.teams[ti],possT:scena,penalty:null,rigoriFinali:null,clock:180,period:1,shot:28});S.fight.active=false;
      for(const t of S.teams){t.human=t.idx===0;t.schema=null;}
      for(const q of S.allPlayers)Object.assign(q,{x:-10+q.i*2.5,z:q.team.idx?8:-8,vx:0,vz:0,fx:q.team.dir,fz:0,act:null,girata:null,turnedUntil:0,oriz:0,perno:false,charging:false,chargeT:0,stamina:1,excluded:false,uscendo:false,freeThrow:false,pressatoUntil:0,stunUntil:0,contactT:0,lunge:0,J:null,palmi:null,spina:null,orizPrec:0,phase:0});
      const p=S.teams[ti].players[4];Object.assign(p,{x:0,z:0,mano,s:{...p.s,vel:75,res:80}});
      Object.assign(B,{state:'held',holder:hold?p:S.teams[1-ti].players[3],holdTime:0,kind:null,target:null,daTiro:false,afterShot:false,x:9,z:8,y:.1,vx:0,vy:0,vz:0,intercept:new Set()});S.setCtrl(p);
      for(const k in I.keys)I.keys[k]=false;I.touch.x=I.touch.z=0;for(const k in I.touch.btn)I.touch.btn[k]=false;I.pollInput();I.pollInput();
      return p;
    }
    function passo(p,x,z,{sprint=false,fresco=false,rig=false,dt:dd=dt}={}){G.time+=dd;T.updateActs(dd);if(fresco)p.stamina=1;F.movePlayer(p,x,z,sprint,dd);if(rig)P.updateRig(p,dd,G.time);}
    const base=p=>1.45*1.08*(.82+(p.s.vel-40)/59*.36);
    const rotonda=v=>Number.isFinite(v)?+v.toFixed(5):null;
    const misure=[];
    for(const ti of [0,1])for(const mano of ['D','S'])for(const hold of [false,true]){
      const p=prepara(ti,mano,hold),dir=p.team.dir,b=base(p)*(hold?.85:1);
      for(let i=0;i<180;i++)passo(p,dir,0,{fresco:true});
      const velocita=Math.hypot(p.vx,p.vz),x=p.x,z=p.z;let stop=null,maxPasso=0;
      for(let i=0;i<180;i++){const px=p.x,pz=p.z;passo(p,0,0);maxPasso=Math.max(maxPasso,Math.hypot(p.x-px,p.z-pz));if(stop===null&&Math.hypot(p.vx,p.vz)<.1)stop=(i+1)*dt;}
      misure.push({tipo:'stop',ti,mano,hold,velocita:rotonda(velocita),attesa:rotonda(b),distanza:rotonda(Math.hypot(p.x-x,p.z-z)),tempo:rotonda(stop),maxPasso:rotonda(maxPasso)});
      for(const angolo of [90,180]){
        const q=prepara(ti,mano,hold);for(let i=0;i<180;i++)passo(q,dir,0,{fresco:true});
        const tx=angolo===180?-dir:0,tz=angolo===90?dir:0,x0=q.x,z0=q.z;let allinea=null,veloce=null,primoPerno=null,maxGiro=0,maxStep=0;
        for(let i=0;i<90;i++){const fx=q.fx,fz=q.fz,px=q.x,pz=q.z;passo(q,tx,tz,{fresco:true});
          maxGiro=Math.max(maxGiro,Math.acos(Math.min(1,Math.max(-1,fx*q.fx+fz*q.fz))));maxStep=Math.max(maxStep,Math.hypot(q.x-px,q.z-pz));
          if(allinea===null&&q.fx*tx+q.fz*tz>Math.cos(Math.PI/18))allinea=(i+1)*dt;
          if(veloce===null&&q.vx*tx+q.vz*tz>b*.8)veloce=(i+1)*dt;
          if(primoPerno===null&&!q.perno)primoPerno=(i+1)*dt;
        }
        misure.push({tipo:'giro',angolo,ti,mano,hold,allinea:rotonda(allinea),veloce:rotonda(veloce),uscitaPerno:rotonda(primoPerno),deriva:rotonda((q.x-x0)*dir),avanza:rotonda((q.x-x0)*tx+(q.z-z0)*tz),maxGiro:rotonda(maxGiro),maxPasso:rotonda(maxStep),oriz:rotonda(q.oriz)});
      }
    }
    const ripartenze=[];
    for(const ti of [0,1])for(const mano of ['D','S'])for(const residuo of ['ricezione','gestoConcluso','girataConclusa']){
      const p=prepara(ti,mano),dir=p.team.dir;
      // Ricezione vera: il passaggio arriva nella presa, dopo almeno 150 ms di volo.
      Object.assign(B,{state:'flight',kind:'pass',target:p,shooter:p.team.players[3],lastTeam:p.team,x:p.x-dir*.2,y:.65,z:p.z,vx:dir*1,vy:0,vz:0,flightT:.2,tx:p.x,tz:p.z});
      F.updateBall(dt);const ricevuta=B.holder===p;
      if(residuo==='gestoConcluso')p.act={kind:'fake',done:true,t:.19,wind:.1,frusta:.09,aim:[S.goalX(p.team),0],fn:()=>{}};
      if(residuo==='girataConclusa')p.turnedUntil=G.time+2;
      const x=p.x;let mosso=null,disteso=null;const campioni=[];
      for(let i=0;i<60;i++){passo(p,-dir,0,{rig:true});if(mosso===null&&p.vx*-dir>.2)mosso=(i+1)*dt;if(disteso===null&&p.oriz>.8)disteso=(i+1)*dt;if([5,17,29,59].includes(i))campioni.push({t:rotonda((i+1)*dt),d:rotonda((p.x-x)*-dir),oriz:rotonda(p.oriz),perno:p.perno,fronte:rotonda(p.fx*-dir)});}
      const visuale=P.computePose(p,0,G.time);P.updateRig(p,dt,G.time);
      const l=p.ballW?[p.ballW[0]-p.x,p.ballW[2]-p.z]:[NaN,NaN],lv=p.ballVistaW||p.ballW||[NaN,NaN,NaN];
      const j=visuale.oriz>.001?p.Jv:p.J,vx=j.chest[0]-j.hip[0],vy=j.chest[1]-j.hip[1],orizVista=Math.abs(vx)/(Math.hypot(vx,vy)||1);
      ripartenze.push({ti,mano,residuo,ricevuta,mosso:rotonda(mosso),disteso:rotonda(disteso),campioni,oriz:rotonda(p.oriz),orizVista:rotonda(orizVista),fronte:rotonda(p.fx*-dir),pallaAvanti:rotonda(l[0]*p.fx+l[1]*p.fz),pallaVistaAvanti:rotonda((lv[0]-p.x)*p.fx+(lv[2]-p.z)*p.fz),ballDavanti:rotonda(visuale.ballDavanti),finiti:!!p.ballW&&p.ballW.every(Number.isFinite)&&lv.every(Number.isFinite)});
    }
    const analogici=[];
    for(const ti of [0,1])for(const mag of [.2,.45,.7,1]){
      const p=prepara(ti),dir=p.team.dir;
      for(let i=0;i<180;i++)passo(p,dir*mag*.6,dir*mag*.8,{fresco:true});
      analogici.push({ti,mag,velocita:rotonda(Math.hypot(p.vx,p.vz)),attesa:rotonda(base(p)*mag),direzione:rotonda((p.vx*.6*dir+p.vz*.8*dir)/(Math.hypot(p.vx,p.vz)||1))});
    }
    const vincoli=[];
    for(const ti of [0,1])for(const mano of ['D','S']){
      const p=prepara(ti,mano,true),dir=p.team.dir;p.charging=true;p.chargeT=.4;
      for(let i=0;i<90;i++)passo(p,-dir,0,{fresco:true});
      const carica={oriz:p.oriz,velocita:Math.hypot(p.vx,p.vz),fronte:p.fx*dir};
      p.charging=false;p.chargeT=0;p.pressatoUntil=G.time+3;
      const vietato=T.startAct(p,'shot',0,()=>{}),tiroPressato=!!p.act;T.startAct(p,'pass',.05,()=>{},[p.x-dir*2,p.z+2]);const passa=!!p.act;
      p.act=null;for(let i=0;i<60;i++)passo(p,-dir,0,{fresco:true});const protetto=Math.hypot(p.vx,p.vz);
      const manoPrima=p.ballW?.slice();P.updateRig(p,dt,G.time);const origine=p.ballW.slice();T.launch(p,p.x-dir*3,.7,p.z,1,'pass');const lancio=Math.hypot(B.x-origine[0],B.y-Math.max(.3,origine[1]),B.z-origine[2]);
      vincoli.push({ti,mano,carica,vietato:vietato===false,tiroPressato,passa,protetto,lancio,manoPrima:!!manoPrima});
    }
    const contatti=[];
    for(const ti of [0,1]){
      const p=prepara(ti),dir=p.team.dir,d=S.teams[1-ti].players[4];d.x=dir*.78;d.z=0;p.vx=dir*1.7;d.vx=0;F.separate();
      const dopoUrto=p.vx*dir,contactT=p.contactT;passo(p,dir,0);const spinto=Math.hypot(p.vx,p.vz);
      contatti.push({ti,distanza:Math.hypot(p.x-d.x,p.z-d.z),dopoUrto,contactT,spinto});
    }
    const ritmi=[];
    for(const fps of [30,60,120]){
      const p=prepara(),dir=p.team.dir,dd=1/fps;
      for(let i=0;i<fps;i++)passo(p,dir,0,{fresco:true,dt:dd});const x=p.x;
      for(let i=0;i<fps;i++)passo(p,0,0,{fresco:true,dt:dd});ritmi.push({fps,distanza:p.x,arresto:p.x-x});
    }
    const sprint=prepara();for(let i=0;i<180;i++)passo(sprint,1,0,{sprint:true,fresco:true});
    const scatto={velocita:Math.hypot(sprint.vx,sprint.vz),attesa:base(sprint)*1.65};
    const energie=[];
    for(const res of [40,99])for(const modo of ['sprint','normale','fermo']){
      const p=prepara();p.s.res=res;p.stamina=.7;for(let i=0;i<720;i++)passo(p,modo==='fermo'?0:1,0,{sprint:modo==='sprint'});
      const f=(res-40)/59,attesa=Math.min(1,.7+12*(modo==='sprint'?-.0092*(1.6-f):(modo==='fermo'?.02:.006)*(.6+.8*f)));
      energie.push({res,modo,stamina:p.stamina,attesa});
    }
    const portieri=[];
    for(const ti of [0,1]){
      prepara(ti);const p=S.teams[ti].players[0],dir=p.team.dir;Object.assign(p,{x:-dir*11,z:0});
      for(let i=0;i<180;i++)passo(p,dir,0,{fresco:true});
      const sp=Math.hypot(p.vx,p.vz),x=p.x;for(let i=0;i<60;i++)passo(p,0,0,{fresco:true});
      const arresto=Math.abs(p.x-x);for(let i=0;i<600;i++)passo(p,dir,0,{fresco:true});
      portieri.push({ti,velocita:sp,arresto,x:p.x,dir});
    }
    return {riferimento:K.SPEED,misure,ripartenze,analogici,vincoli,contatti,ritmi,scatto,energie,portieri};
  });
  console.log((prima?'PRIMA':'DOPO')+' nuoto v0.44 '+JSON.stringify(out));
  if(arg('json'))writeFileSync(arg('json'),JSON.stringify(out,null,2));
  assert.deepEqual(errors,[],'pagina senza errori');assert.equal(out.riferimento,1,'tempo di gioco invariato');
  for(const m of out.misure){assert.ok(m.maxPasso<.05,'nessun salto di posizione');if(m.tipo==='giro')assert.ok(m.maxGiro<.28,'rotazione continua');}
  for(const v of out.vincoli){assert.ok(v.carica.oriz<.01&&v.carica.fronte>.98,'carica verticale e rivolta alla porta');assert.ok(v.carica.velocita<.4,'carica rallenta il nuoto');assert.equal(v.vietato,true);assert.equal(v.tiroPressato,false);assert.equal(v.passa,true);assert.ok(v.protetto>.3,'ci si allontana sotto pressione');assert.ok(v.lancio<.000001,'lancio dalla mano del motore');}
  for(const c of out.contatti){assert.ok(c.contactT>0&&c.dopoUrto<.2,'urto smorza avanzamento');assert.ok(c.spinto<.5,'contatto resta resistente');}
  for(const e of out.energie)assert.ok(Math.abs(e.stamina-e.attesa)<1e-9,'consumo e recupero conservati: '+e.res+'/'+e.modo);
  for(const p of out.portieri){assert.ok(p.x*p.dir<=0,'portiere nella propria metà');assert.ok(p.arresto>.4&&p.arresto<1,'il portiere conserva la sua risposta');}
  if(!prima){
    for(const m of out.misure){
      if(m.tipo==='stop'){assert.ok(Math.abs(m.velocita-m.attesa)<.01,'velocità massima invariata');assert.ok(m.distanza>.05&&m.distanza<.28,'piccola inerzia, meno di 28 cm');assert.ok(m.tempo<=.45,'arresto entro 450 ms');}
      else{assert.ok(m.allinea!==null&&m.allinea<.65,'corpo segue il cambio entro 650 ms');assert.ok(m.veloce!==null&&m.veloce<.65,'velocità nuova direzione entro 650 ms');assert.ok(m.oriz>.99,'riprende il nuoto dopo la girata');if(m.angolo===90)assert.ok(Math.abs(m.deriva)<.3,'deriva laterale sotto 30 cm');}
    }
    for(const r of out.ripartenze){assert.equal(r.ricevuta,true);assert.ok(r.mosso!==null&&r.mosso<=.2,'ricevente parte subito');assert.ok(r.disteso!==null&&r.disteso<=.75,'il perno si scioglie e il ricevente nuota');assert.ok(r.oriz>.99&&r.fronte>.99&&r.orizVista>.5,'anche il corpo disegnato è disteso');assert.ok(r.ballDavanti>.99&&r.pallaAvanti>.4&&r.pallaVistaAvanti>.2,'palla davanti alla testa durante il nuoto');assert.equal(r.finiti,true);assert.ok(r.campioni[2].d>.2,'movimento reale entro mezzo secondo');}
    for(const a of out.analogici)assert.ok(a.direzione>.999&&Math.abs(a.velocita-a.attesa)<.01,'direzione e intensità analogica rispettate');
    assert.ok(Math.abs(out.scatto.velocita-out.scatto.attesa)<.01,'sprint conserva il massimo');
    assert.ok(Math.max(...out.ritmi.map(r=>r.distanza))-Math.min(...out.ritmi.map(r=>r.distanza))<.06,'30/60/120 Hz entro 6 cm');
  }
  if(arg('foto')){
    await page.addStyleTag({content:'#menu,#hud,#touch,#player,#schemi,#cronaca,#tLog,#qte,#pauseBtn,#tac,#fight,#fps,#ruota,#tCambi{display:none!important}'});
    const foto=await page.evaluate(async()=>{
      const [S,P,R]=await Promise.all([import('/src/stato.js'),import('/src/grafica/pose.js'),import('/src/grafica/render.js')]);
      const H=window.__pallanuoto,p=S.teams[0].players[4];for(const q of S.allPlayers)q.mesh.g.visible=q===p;
      Object.assign(p,{x:0,z:0,fx:1,fz:0,vx:1.4,vz:0,oriz:1,mano:'S',act:null,charging:false,pressatoUntil:0,stunUntil:0,J:null,palmi:null,spina:null});Object.assign(S.ball,{state:'held',holder:p,x:0,z:0,y:.1});S.game.state='play';
      for(let i=0;i<30;i++)P.updateRig(p,1/60,S.game.time+i/60);
      H.vista={pos:[2.4,1.55,3.1],look:[0,0,0],fov:35};R.render(1/60,S.game.time*1000);return H.renderer.domElement.toDataURL('image/png');
    });writeFileSync(arg('foto'),Buffer.from(foto.split(',')[1],'base64'));
  }
}finally{await browser.close();await server.close();}
