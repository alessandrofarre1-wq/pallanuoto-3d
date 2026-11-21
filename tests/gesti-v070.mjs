// Continuità del solo disegno + invarianti reali delle giunture e del lancio.
// --solo-helper non apre Chromium. --prima=<sha> usa pose.js di quel commit.
// --salva=file.json --confronta=prima.json; --foto=cartella cattura sei stati.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { caricaVista, conservaGestoVista, frustaVista, GIUNTI_GESTO_VISTA, preparaGestoVista, raccordaGestoVista, smussoGestoVista } from '../src/grafica/gesto-vista.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(s=>s.startsWith('--'+k+'='))?.slice(k.length+3);
const source=fs.readFileSync(path.join(root,'src/grafica/pose.js'),'utf8');
const fisica=source.slice(source.indexOf('//<POSE>'),source.indexOf('//</POSE>')+'//</POSE>'.length);
assert.equal(createHash('sha256').update(fisica).digest('hex'),'bd1833d84ab7553fcfcf95d21c20c619fdaafab91eb657405ce7b51a6e17c231','posa fisica e costanti del lancio conservate dalla v0.69');
const curve=[
  {K:[-.2,.36,.08],R:[.42,.54,-.02],F:[.54,.2,-.08],fr:.166},
  {K:[-.12,.37,.12],R:[.36,.44,.02],F:[.48,.26,-.02],fr:.09},
  {K:[.29,.08,.28],R:[-.35,.45,.25],F:[-.45,.1,-.05],fr:.18},
  {K:[.27,.09,.3],R:[-.16,.36,-.3],F:[-.34,.22,-.34],fr:.18}
];
const out=[0,0,0],eps=1e-6,velocitaR=[];
for(const c of curve)for(const lato of [1,-1]){
  const K=c.K.map((x,i)=>i===2?x*lato:x),R=c.R.map((x,i)=>i===2?x*lato:x),F=c.F.map((x,i)=>i===2?x*lato:x);
  assert.deepEqual(frustaVista(out,K,R,F,0,c.fr).slice(),K);
  const atR=frustaVista(out,K,R,F,c.fr,c.fr).slice();
  assert.ok(atR.every((x,i)=>Math.abs(x-R[i])<1e-12),'ancora del rilascio identica');
  assert.ok(frustaVista(out,K,R,F,c.fr+.198,c.fr).every((x,i)=>Math.abs(x-F[i])<1e-12));
  const l=frustaVista(out,K,R,F,c.fr-eps,c.fr).slice(),r=frustaVista(out,K,R,F,c.fr+eps,c.fr).slice();
  const vl=l.map((x,i)=>(R[i]-x)/eps),vr=r.map((x,i)=>(x-R[i])/eps);
  assert.ok(vl.every((x,i)=>Math.abs(x-vr[i])<.001),'velocità condivisa nei due lati del rilascio');
  assert.ok(Math.abs(vl[0])>.05,'il braccio non si arresta nel punto di rilascio');
  velocitaR.push(+Math.abs(vl[0]).toFixed(6));
  for(let j=0;j<=300;j++){
    frustaVista(out,K,R,F,j*(c.fr+.198)/300,c.fr);
    assert.ok(out.every((x,i)=>x>=Math.min(K[i],R[i],F[i])-1e-12&&x<=Math.max(K[i],R[i],F[i])+1e-12),'curva senza overshoot oltre gli ancoraggi');
  }
}
assert.equal(caricaVista({wind:.04,t:0},0,.6),.6,'la carica non ricomincia da zero al polso');
assert.equal(caricaVista({wind:.04,t:.04},0,.6),1);
const a={wind:.05,frusta:.09,t:.14};
const left=smussoGestoVista({...a,t:a.t-eps}),right=smussoGestoVista({...a,t:a.t+eps});
assert.ok(Math.abs(left-right)<1e-6&&left>39.99,'nessun salto 40→14 al rilascio');
assert.equal(smussoGestoVista({...a,t:.5}),14,'fine recupero uguale alla base');
const p={num:5,scheda:{},x:0,z:0,chargeT:.3,charging:true,J:Object.freeze({testa:'immutabile'}),ballW:Object.freeze([1,2,3])};
const V=Object.fromEntries(GIUNTI_GESTO_VISTA.map(k=>[k,[.2,.3,.4]])),T={torsioneVista:.4,polsoR:.2,polsoL:.1};
let s=preparaGestoVista(p,null,true,1,1/60,1);conservaGestoVista(s,V,T);
p.charging=false;const atto={wind:.04,frusta:.11,t:0};s=preparaGestoVista(p,atto,true,1.01,1/60,1.01);
const W=Object.fromEntries(GIUNTI_GESTO_VISTA.map(k=>[k,[1,2,3]]));raccordaGestoVista(s,W,T);
assert.ok(GIUNTI_GESTO_VISTA.every(k=>W[k].every((x,i)=>x===V[k][i])),'ingresso dalla posa visuale precedente');
assert.equal(s.carica,.648,'stesso livello di carica raggiunto prima del nuovo gesto');
atto.t=.02;s=preparaGestoVista(p,atto,true,1.02,1/60,6.02);
assert.ok(s.carica>.648&&s.caricaIngresso===.648,'il salto del tempo reale del replay conserva il gesto live congelato');
for(const mutate of [()=>p.num++,()=>p.scheda={},()=>p.x+=4,()=>{}]){
  conservaGestoVista(s,V,T);mutate();s=preparaGestoVista(p,null,true,2,1/60,4);
  assert.equal(s.raccordoD,0,'nessuna posa trascinata dopo identità/ricollocazione o intervallo del replay');
}
assert.deepEqual(p.J,{testa:'immutabile'});assert.deepEqual(p.ballW,[1,2,3]);
console.log('PASS helper gesti: ancore, velocità al rilascio, niente overshoot, carica e filtro continui, reset e fisica intatta');
if(process.argv.includes('--solo-helper'))process.exit(0);

const { chromium }=await import('playwright'),{createServer}=await import('vite');
const prima=arg('prima'),originale=prima?execFileSync('git',['show',prima+':src/grafica/pose.js'],{cwd:root,encoding:'utf8'}):null;
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false,watch:null},plugins:originale?[{name:'posa-prima-v070',enforce:'pre',load:id=>id===path.join(root,'src/grafica/pose.js')?originale:null}]:[]});
await server.listen();const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),errori=[];
 page.on('pageerror',e=>errori.push(e.message));
 await page.addInitScript(()=>{let s=70;window.__rnd=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return(s+.5)/4294967296;};window.requestAnimationFrame=()=>1;});
 await page.goto(server.resolvedUrls.local[0]);
 await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:120000});
 const r=await page.evaluate(async(foto)=>{
  const [S,P,A,F,R]=await Promise.all(['stato','grafica/pose','tiri','fisica','regole'].map(n=>import('/src/'+n+'.js')));
  const {renderer,camera,scene}=await import('/src/grafica/scena.js');const H=window.__pallanuoto,draw=renderer.render.bind(renderer);
  H.renderer.render=()=>{};const dt=1/60,misure=[],traccia=[],immagini=[];let numero=0;
  const round=x=>Math.round(x*1e9)/1e9;
  for(const tipo of ['polso-caricato','tiro-caricato','passa-avanti','passa-opposto','passa-stesso','palomba'])for(const dir of [1,-1])for(const mano of ['D','S']){
   const t=S.teams[0],o=S.teams[1];t.dir=dir;o.dir=-dir;Object.assign(S.game,{state:'play',time:100+ ++numero*10,possT:1,possTeam:t,penalty:null,rigoriFinali:null,autoplay:false});S.fight.active=false;
   for(const q of S.allPlayers)Object.assign(q,{x:-8+q.i,z:q.team.idx?8:-8,vx:0,vz:0,fx:q.team.dir,fz:0,act:null,charging:false,chargeT:0,oriz:0,orizPrec:0,phase:0,J:null,palmi:null,spina:null,giuntiVista:null,bracciaVista:null,ballW:null,ballVistaW:null,excluded:false,uscendo:false,freeThrow:false,pressatoUntil:0,stunUntil:0,contactT:0,turnedUntil:0,pesca:null,pescaDi:null,ricevutoPassaggio:false});
   const p=t.players[4],m=t.players[5];Object.assign(p,{x:0,z:0,mano});Object.assign(m,{x:dir*3,z:tipo==='passa-opposto'?-5*dir:tipo==='passa-stesso'?5*dir:0});
   o.players[0].x=12*dir;o.players[0].z=0;
   Object.assign(S.ball,{state:'held',holder:p,lastTeam:t,kind:null,target:null,daTiro:false,inRete:false,holdTime:.5,x:p.x,y:.8,z:p.z,flightT:0,intercept:new Set()});
   R.giveBall(p);P.updateRig(p,dt,S.game.time);
   const bone=()=>{const v=camera.position.clone();p.mesh.corpo.ossa[mano==='S'?'manoS':'manoD'].getWorldPosition(v);return v.toArray();};
   let precedente=bone(),massimo=0,primo=null,rilascio=null,supFisica=0;
   const check=()=>{
    const phase=p.phase,orizPrec=p.orizPrec,parataIn=p.parataIn,T=P.computePose(p,dt,S.game.time);Object.assign(p,{phase,orizPrec,parataIn});
    const expected={},k=1-Math.exp(-dt*(p.act?34:16));
    for(const key of P.JK)expected[key]=p.J?T[key].map((x,i)=>p.J[key][i]+(x-p.J[key][i])*k):T[key].slice();
    P.updateRig(p,dt,S.game.time);
    for(const key of P.JK)for(let j=0;j<3;j++)supFisica=Math.max(supFisica,Math.abs(p.J[key][j]-expected[key][j]));
    const mh=mano==='S'?p.J.hL:p.J.hR;
    if(T.ballHand){const l=[mh[0]+.02,mh[1]+.13,mh[2]],w=[p.x+1.45*(l[0]*p.fx-l[2]*p.fz),1.45*l[1],p.z+1.45*(l[0]*p.fz+l[2]*p.fx)];
     for(let j=0;j<3;j++)supFisica=Math.max(supFisica,Math.abs(p.ballW[j]-w[j]));}
    else if(p.ballW!==null)supFisica=Infinity;
    const v=bone(),step=Math.hypot(...v.map((x,i)=>x-precedente[i]));massimo=Math.max(massimo,step);precedente=v;
    return step;
   };
   const tempoCarica=tipo==='polso-caricato'?.28:tipo==='tiro-caricato'?.7:0;
   for(let n=0;n<Math.round(tempoCarica/dt);n++){p.charging=true;p.chargeT+=dt;S.game.time+=dt;check();}
   const kind=tipo==='polso-caricato'?'polso':tipo==='tiro-caricato'?'shot':tipo==='palomba'?'lob':'pass';
   const wind=kind==='polso'?.04:kind==='shot'?0:kind==='lob'?.12:.05;
   if(kind==='polso'){p.charging=false;p.chargeT=0;}
   A.startAct(p,kind,wind,()=>kind==='pass'?A.doPass(p,m):A.doShoot(p,.7,kind==='lob',0),kind==='pass'?[m.x,m.z]:null);
   const act=p.act;primo=check();const nome=tipo+'-'+dir+'-'+mano;
   for(let frame=0;frame<60;frame++){
    S.game.time+=dt;A.updateActs(dt);check();
    if(act.done&&rilascio===null)rilascio=frame;
    traccia.push([nome,frame,...P.JK.flatMap(k=>p.J[k].map(round)),...(p.ballW||[null,null,null]),S.ball.state,...[S.ball.x,S.ball.y,S.ball.z,S.ball.vx,S.ball.vy,S.ball.vz].map(round)]);
    if(foto&&dir===1&&mano==='D'&&tipo==='passa-opposto'&&[0,2,5,8,12,25].includes(frame)){
     camera.position.set(2,2.4,4);camera.lookAt(0,.35,0);camera.updateProjectionMatrix();draw(scene,camera);
     immagini.push({nome:nome+'-'+String(frame).padStart(2,'0'),png:renderer.domElement.toDataURL('image/png')});}
    if(S.ball.state==='flight')F.updateBall(dt);
   }
   misure.push({tipo,dir,mano,primo,massimo,rilascio,supFisica});
  }
  return {misure,traccia,immagini};
 },!!arg('foto'));
 assert.deepEqual(errori,[]);
 for(const m of r.misure){assert.ok(m.supFisica<1e-10,'p.J e ballW identici alla posa fisica '+JSON.stringify(m));assert.ok(m.rilascio!==null,'callback di rilascio eseguita');}
 if(arg('foto')){fs.mkdirSync(arg('foto'),{recursive:true});for(const f of r.immagini)fs.writeFileSync(path.join(arg('foto'),f.nome+'.png'),Buffer.from(f.png.split(',')[1],'base64'));}
 delete r.immagini;
 const confronto=arg('confronta')?JSON.parse(fs.readFileSync(arg('confronta'),'utf8')):null;
 if(confronto){assert.deepEqual(r.traccia,confronto.traccia,'sequenza fisica e tempi di rilascio PRIMA/DOPO identici');
  for(const m of r.misure.filter(x=>x.tipo==='polso-caricato')){const b=confronto.misure.find(x=>x.tipo===m.tipo&&x.dir===m.dir&&x.mano===m.mano);assert.ok(m.primo<=b.primo*.8,'ingresso polso senza scatto dopo carica');}}
 if(arg('salva'))fs.writeFileSync(arg('salva'),JSON.stringify(r,null,2)+'\n');
 console.log(JSON.stringify({prima:prima||null,casi:r.misure,curve:velocitaR},null,2));
 console.log('PASS gesti v0.70: 24 casi, invarianti J/ballW e callback, confronto PRIMA/DOPO se richiesto');
}finally{await browser.close();await server.close();}
