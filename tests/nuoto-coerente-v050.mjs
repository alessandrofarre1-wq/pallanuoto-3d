// Coerenza DINAMICA: ossa vere e palla confrontate con la velocità, ad ogni
// fotogramma. Non giudica la naturalezza e non sostituisce una prova giocata.
// --prima ricarica i moduli della v0.49 per conservare la riproduzione del bug.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const prima=process.argv.includes('--prima'),ref=arg('riferimento')||'fa688c51aaedd8090b0e933140aaec2e828cf6ab';
const originali=new Map();
if(prima)for(const f of ['fisica.js','controfuga.js','grafica/pose.js','partita.js','regole.js'])originali.set(path.join(root,'src',f),execFileSync('git',['show',ref+':src/'+f],{cwd:root,encoding:'utf8'}));
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:+(arg('porta')||4390),strictPort:true,hmr:false,watch:null},
  plugins:[{name:'nuoto-v049',enforce:'pre',load:id=>originali.get(id)}]});
await server.listen();
const browser=await chromium.launch({...(existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{let seed=50;window.__rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return(seed+.5)/4294967296;};window.requestAnimationFrame=()=>1;});
 await page.goto(server.resolvedUrls.local[0],{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:120000});
 const out=await page.evaluate(async()=>{
  const [F,S,T,P,C,Q]=await Promise.all([import('/src/fisica.js'),import('/src/stato.js'),import('/src/tiri.js'),import('/src/grafica/pose.js'),import('/src/controllo.js'),import('/src/controfuga.js')]);
  const G=S.game,B=S.ball,misure=[];let scena=0;
  function prepara(ti,mano,hold=true){
   C.resetTap();Object.assign(G,{state:'play',time:100+(++scena)*10,autoplay:false,possTeam:S.teams[ti],possT:100+scena*10-2,penalty:null,rigoriFinali:null,clock:180,period:1,shot:28});      // v0.81: palla recuperata da 2 s (controfuga vera, QTE.eta)S.fight.active=false;
   for(const q of S.allPlayers)Object.assign(q,{x:-10+q.i*2.5,z:q.team.idx?8:-8,vx:0,vz:0,fx:q.team.dir,fz:0,act:null,girata:null,turnedUntil:0,oriz:0,perno:false,charging:false,chargeT:0,stamina:1,excluded:false,uscendo:false,freeThrow:false,pressatoUntil:0,stunUntil:0,contactT:0,lunge:0,J:null,palmi:null,spina:null,orizPrec:0,phase:0});
   const p=S.teams[ti].players[4];Object.assign(p,{x:0,z:0,mano,s:{...p.s,vel:75,res:80}});S.setCtrl(p);
   Object.assign(B,{state:'held',holder:hold?p:S.teams[1-ti].players[3],holdTime:0,kind:null,target:null,daTiro:false,afterShot:false,inRete:false,x:-9*p.team.dir,z:0,y:.1,vx:0,vy:0,vz:0,intercept:new Set()});return p;
  }
  function passo(p,dx,dz,dt){G.time+=dt;T.updateActs(dt);F.movePlayer(p,dx,dz,false,dt);P.updateRig(p,dt,G.time);p.mesh.g.updateWorldMatrix(true,true);}
  const rnd=v=>Number.isFinite(v)?+v.toFixed(6):null;
  function misura(p,dt,r,t){
   const O=p.mesh.corpo.ossa,V=O.testa.position.clone(),head=O.testa.getWorldPosition(V.clone()),hip=O.bacino.getWorldPosition(V.clone()),sp=Math.hypot(p.vx,p.vz);
   const body=head.clone().sub(hip),L=Math.hypot(body.x,body.z),dot=sp>.00001?(body.x*p.vx+body.z*p.vz)/(sp*L):1;
   const fronte=sp>.00001?(p.fx*p.vx+p.fz*p.vz)/sp:1;
   const ball=p.ballVistaW,ballDot=ball&&sp>.00001?((ball[0]-head.x)*p.vx+(ball[2]-head.z)*p.vz)/sp:null;
   const T=P.computePose(p,0,G.time),nuota=p.oriz>.5&&sp>.3,pallaNuoto=nuota&&B.holder===p&&T.ballDavanti>.8;
   const sample={t:rnd(t),oriz:rnd(p.oriz),sp:rnd(sp),bodyDot:rnd(dot),frontDot:rnd(fronte),ballDot:rnd(ballDot),ballDavanti:rnd(T.ballDavanti)};
   if(nuota){r.campioniNuoto++;r.minBodyDot=Math.min(r.minBodyDot,dot);if(dot<0){r.inversi++;r.durataInversa+=dt;if(r.esempi.length<5)r.esempi.push(sample);}}
   if(pallaNuoto){r.campioniPalla++;r.minBallDot=Math.min(r.minBallDot,ballDot);if(ballDot<0)r.pallaDietro++;}
   r.maxStep=Math.max(r.maxStep,Math.hypot(p.x-r.px,p.z-r.pz));r.px=p.x;r.pz=p.z;
   r.finiti&&=[p.x,p.z,p.vx,p.vz,p.fx,p.fz,p.stamina,...head.toArray(),...hip.toArray(),...(ball||[])].every(Number.isFinite);
  }
  for(const fps of [30,60,120])for(const ti of [0,1])for(const mano of ['D','S'])for(const tipo of ['giro90','giro180','rilascioPallaDietro','ricezione','colonnelloOpposto','colonnelloAvanti','colonnelloInversione','schizzoInversione']){
   const p=prepara(ti,mano,!['ricezione','rilascioPallaDietro'].includes(tipo)),d=p.team.dir,dt=1/fps;
   const avanti=tipo==='colonnelloOpposto'?-d:d;
   const speciale=tipo.startsWith('colonnello')?'colonnello':tipo.startsWith('schizzo')?'schizzo':null;
   if(speciale)p.x=S.goalX(p.team)-d*(speciale==='schizzo'?6.5:4);
   for(let i=0;i<fps*.7;i++)passo(p,avanti,0,dt);
   if(tipo==='ricezione'){
    Object.assign(B,{state:'flight',holder:null,kind:'pass',target:p,shooter:p.team.players[3],lastTeam:p.team,x:p.x-d*.2,y:.65,z:p.z,vx:d,vy:0,vz:0,flightT:.2,tx:p.x,tz:p.z});F.updateBall(dt);
   }
   // v0.88: schizzo e colonnello dipendono da energia (colonnello da 0,6, schizzo da 0,35) e Precisione (almeno 70, SPECIALI): la
   // domanda si fa con l'energia e la Precisione adatte al gesto, senza cambiare la nuotata misurata
   const occasione=speciale?(()=>{const e0=p.stamina,s0=p.s;p.stamina=speciale==='schizzo'?.45:1;p.s={...p.s,pre:Math.max(80,p.s?.pre??0)};
    const o=Q.occasioneControfuga(p);p.stamina=e0;p.s=s0;return o;})():null;
   if(speciale)T.startAct(p,speciale,speciale==='schizzo'?.05:.08,()=>{B.state='free';B.holder=null;},[S.goalX(p.team),0]);
   const r={tipo,fps,ti,mano,occasione,campioniNuoto:0,campioniPalla:0,inversi:0,durataInversa:0,pallaDietro:0,minBodyDot:1,minBallDot:1,maxStep:0,esempi:[],finiti:true,px:p.x,pz:p.z};
   for(let i=0;i<fps;i++){
    const dx=tipo==='giro90'?0:tipo==='giro180'||tipo==='ricezione'||tipo.endsWith('Inversione')?-d:tipo==='rilascioPallaDietro'?0:avanti,dz=tipo==='giro90'?d:0;
    passo(p,dx,dz,dt);misura(p,dt,r,(i+1)*dt);
   }
   for(const k of ['minBodyDot','minBallDot','durataInversa','maxStep'])r[k]=rnd(r[k]);delete r.px;delete r.pz;misure.push(r);
  }
  return {misure};
 });
 out.prima=prima;out.riferimento=prima?ref:null;out.errori=errors;
 const riepilogo=out.riepilogo={casi:out.misure.length,campioniNuoto:out.misure.reduce((n,r)=>n+r.campioniNuoto,0),campioniPalla:out.misure.reduce((n,r)=>n+r.campioniPalla,0),inversi:out.misure.reduce((n,r)=>n+r.inversi,0),pallaDietro:out.misure.reduce((n,r)=>n+r.pallaDietro,0),peggiorBodyDot:Math.min(...out.misure.map(r=>r.minBodyDot)),peggiorPalla:Math.min(...out.misure.map(r=>r.minBallDot))};
 writeFileSync(arg('json')||'/tmp/nuoto-coerente-v050.json',JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify(riepilogo));
 for(const tipo of [...new Set(out.misure.map(r=>r.tipo))]){const a=out.misure.filter(r=>r.tipo===tipo);console.log(tipo,JSON.stringify({inversi:a.reduce((n,r)=>n+r.inversi,0),pallaDietro:a.reduce((n,r)=>n+r.pallaDietro,0),maxDurata:Math.max(...a.map(r=>r.durataInversa)),minDot:Math.min(...a.map(r=>r.minBodyDot)),occasione:a[0].occasione}));}
 assert.deepEqual(errors,[],'errori browser');assert.ok(out.misure.every(r=>r.finiti),'coordinate finite');
 if(!prima){
  assert.equal(riepilogo.inversi,0,'il corpo disteso avanza con i piedi invece che con la testa');assert.equal(riepilogo.pallaDietro,0,'palla dietro la testa lungo il moto durante il nuoto');
  for(const r of out.misure){
   if(r.tipo==='colonnelloOpposto')assert.equal(r.occasione,null,'niente colonnello allontanandosi dalla porta');
   if(r.tipo==='colonnelloAvanti'||r.tipo==='colonnelloInversione')assert.equal(r.occasione,'colonnello','colonnello disponibile avanzando');
   if(r.tipo==='schizzoInversione')assert.equal(r.occasione,'schizzo','schizzo disponibile avanzando');
  }
 }
 // Filmato facoltativo: spostamento integrato da movePlayer, gesto e arresto
 // regolamentare veri; camera normale del gioco. Scena controllata, senza IA.
 // Il colonnello opposto è forzato uguale prima/dopo per mostrare il difetto
 // posturale anche se la nuova regola non lo offre più tramite il comando.
 const filmato=arg('filmato');
 if(filmato){
  mkdirSync(filmato,{recursive:true});
  await page.addStyleTag({content:'#menu,#hud,#tac,#player,#touch,#cronaca,#tLog,#fight,#fps,#espulsioni,#qte,#replayOverlay,#ruota{display:none!important}'});
  await page.evaluate(async()=>{
   const [F,S,T,P,R,Sc,Reg,Part]=await Promise.all([import('/src/fisica.js'),import('/src/stato.js'),import('/src/tiri.js'),import('/src/grafica/pose.js'),import('/src/grafica/render.js'),import('/src/grafica/scena.js'),import('/src/regole.js'),import('/src/partita.js')]);
   const H=window.__pallanuoto,p=S.teams[0].players[4];H.replay.azzeraReplay();
   Object.assign(S.game,{state:'play',time:300,autoplay:false,possTeam:p.team,penalty:null,rigoriFinali:null,clock:180,shot:28,after:null});S.fight.active=false;
   for(const q of S.allPlayers){Object.assign(q,{x:-10+q.i*2.5,z:q.team.idx?8:-8,vx:0,vz:0,act:null,charging:false,oriz:0,J:null,palmi:null,spina:null,phase:0,excluded:false,freeThrow:false,pressatoUntil:0,stunUntil:0,lunge:0,contactT:0,girata:null,turnedUntil:0});q.mesh.g.visible=true;}
   Object.assign(p,{x:5.2,z:0,fx:1,fz:0,mano:'D',stamina:1,perno:false});S.setCtrl(p);
   Object.assign(S.ball,{state:'held',holder:p,x:p.x,y:.1,z:p.z,vx:0,vy:0,vz:0,kind:null,inRete:false,spruzzo:null,target:null});
   const draw=Sc.renderer.render;Sc.renderer.render=()=>{};
   for(let i=0;i<120;i++)R.render(1/60,(300+i/60)*1000);
   const canvas=document.createElement('canvas');canvas.width=844;canvas.height=390;
   window.__filmNuoto={F,S,T,P,R,Sc,Reg,Part,H,p,draw,canvas,colonnello:false,fischio:false};
  });
  for(let f=0;f<240;f++){
   const frame=await page.evaluate(f=>{
    const {F,S,T,R,Sc,Reg,Part,H,p,draw,canvas}=window.__filmNuoto,dt=1/60;
    let titolo='NUOTO IN AVANZAMENTO';
    for(let sub=0;sub<2;sub++){
     const t=(f*2+sub)/60;let dx=1,dz=0;
     if(t>=1.2&&t<2.2){dx=.6;dz=.8;titolo='CAMBIO DI DIREZIONE';}
     else if(t>=2.2&&t<3.2){dx=-1;titolo='INVERSIONE';}
     else if(t>=3.2&&t<3.8){dx=0;titolo='RILASCIO DEL COMANDO';}
     else if(t>=3.8&&t<6.2){dx=-1;titolo=t>=4.8?'COLONNELLO IN USCITA (CASO RIPRODOTTO)':'RIPARTENZA';}
     else if(t>=6.2){dx=0;titolo='FISCHIO: ATTENDERE LA RIPRESA';}
     if(t>=4.8&&!window.__filmNuoto.colonnello){window.__filmNuoto.colonnello=true;T.startAct(p,'colonnello',.08,()=>T.launch(p,12.5,.65,0,.5,'shot'),[12.5,0]);}
     if(t>=6.2&&!window.__filmNuoto.fischio){window.__filmNuoto.fischio=true;Reg.deadBall(10);}
     if(S.game.state==='stop')Part.update(dt);
     else{S.game.time+=dt;T.updateActs(dt);F.movePlayer(p,dx,dz,false,dt);if(S.ball.state==='held')F.updateBall(dt);else if(S.ball.state==='flight'){H.palla.passoPalla(S.ball,dt,S.allPlayers);S.ball.flightT+=dt;}}
     Sc.renderer.render=sub===1?draw:()=>{};R.render(dt,(300+t)*1000);Sc.renderer.render=()=>{};
    }
    const ctx=canvas.getContext('2d');ctx.drawImage(Sc.renderer.domElement,0,0,844,390);ctx.fillStyle='rgba(0,12,26,.82)';ctx.fillRect(12,10,640,56);ctx.fillStyle='#fff';ctx.font='bold 18px sans-serif';ctx.fillText(titolo,24,33);ctx.font='13px sans-serif';ctx.fillText('Sequenza controllata • fisica e camera del gioco • acquisizione 30 fotogrammi/s',24,54);
    return canvas.toDataURL('image/png').split(',')[1];
   },f);
   writeFileSync(path.join(filmato,String(f).padStart(4,'0')+'.png'),Buffer.from(frame,'base64'));
  }
  console.log('Filmato: 240 fotogrammi in '+filmato+' (8 s a 30 fps di acquisizione, non misura FPS del gioco)');
 }
}finally{await browser.close();await server.close();}
