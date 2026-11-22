// Solo tiro standard: simula senza render; fotografa sei fasi da tre lati.
// --prima=<sha> sostituisce pose.js E corpo.js. --salva=x.json --confronta=prima.json
// --sequenza=cartella fotografa il gesto continuo a30Hz da trequarti.
// --foto=cartella abilita al massimo 18 draw, nessun warmup o foglio live.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(s=>s.startsWith('--'+k+'='))?.slice(k.length+3);
const prima=arg('prima'),originali=new Map(),esegui=promisify(execFile);
if(prima)for(const nome of ['pose','corpo']){
  const relativo='src/grafica/'+nome+'.js';
  const {stdout}=await esegui('git',['show',prima+':'+relativo],{cwd:root,encoding:'utf8'});
  originali.set(path.join(root,relativo),stdout);
}
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false,watch:null},
  plugins:prima?[{name:'tiro-prima-v072',enforce:'pre',load:id=>originali.get(id.split('?')[0])}]:[]});
await server.listen();
const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
const browser=await chromium.launch({executablePath,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),errori=[];
  page.on('pageerror',e=>errori.push(e.message));
  await page.addInitScript(()=>{
    let seed=72;window.__rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return(seed+.5)/4294967296;};
    window.requestAnimationFrame=()=>1;
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:120000});
  const risultato=await page.evaluate(async opzioni=>{
    const {foto,sequenza}=opzioni;
    const [S,P,A,F,R,{VIS}]=await Promise.all(['stato','grafica/pose','tiri','fisica','regole','costanti'].map(n=>import('/src/'+n+'.js')));
    const {renderer,camera,scene,ball3d,freccia,ring,passMark}=await import('/src/grafica/scena.js');
    const draw=renderer.render.bind(renderer);renderer.render=()=>{};
    const dt=1/120,traccia=[],casi=[],immagini=[],fasi=[];
    const round=x=>Math.round(x*1e9)/1e9;
    const viste=[
      {nome:'1-fronte',pos:[3.9,1.35,.12]},
      {nome:'2-lato-dominante',pos:[.15,1.25,3.9]},
      {nome:'3-lato-libero',pos:[-.5,1.25,-3.9]}
    ];
    let render=0,numero=0;
    for(const dir of [1,-1])for(const mano of ['D','S']){
      const t=S.teams[0],o=S.teams[1];t.dir=dir;o.dir=-dir;
      Object.assign(S.game,{state:'play',time:100+ ++numero*10,possT:1,possTeam:t,penalty:null,rigoriFinali:null,autoplay:false});
      S.fight.active=false;
      for(const q of S.allPlayers){
        Object.assign(q,{x:-8+q.i,z:q.team.idx?8:-8,vx:0,vz:0,fx:q.team.dir,fz:0,act:null,charging:false,chargeT:0,
          oriz:0,orizPrec:0,phase:0,J:null,palmi:null,spina:null,giuntiVista:null,bracciaVista:null,ballW:null,ballVistaW:null,
          excluded:false,uscendo:false,freeThrow:false,pressatoUntil:0,stunUntil:0,contactT:0,turnedUntil:0,pesca:null,
          pescaDi:null,ricevutoPassaggio:false,dorsoK:0,inclVert:undefined});
        q.mesh.g.visible=false;
      }
      const p=t.players[4],nome='shot-'+dir+'-'+mano;
      Object.assign(p,{x:0,z:0,mano});p.mesh.g.visible=true;
      o.players[0].x=12*dir;o.players[0].z=0;
      Object.assign(S.ball,{state:'held',holder:p,lastTeam:t,kind:null,target:null,daTiro:false,inRete:false,holdTime:.5,
        x:p.x,y:.8,z:p.z,flightT:0,intercept:new Set(),raccordoVista:null});
      R.giveBall(p);
      let supFisica=0,callback=0,rilascio=null,passo=0;
      const check=delta=>{
        // computePose ha memorie live: la lettura attesa non deve consumare un secondo passo.
        const memoria={phase:p.phase,orizPrec:p.orizPrec,parataIn:p.parataIn,dorsoK:p.dorsoK};
        const T=P.computePose(p,delta,S.game.time);Object.assign(p,memoria);
        const attesa={},k=1-Math.exp(-delta*(p.act?34:16));
        for(const key of P.JK)attesa[key]=p.J?T[key].map((x,i)=>p.J[key][i]+(x-p.J[key][i])*k):T[key].slice();
        P.updateRig(p,delta,S.game.time);
        for(const key of P.JK)for(let j=0;j<3;j++)supFisica=Math.max(supFisica,Math.abs(p.J[key][j]-attesa[key][j]));
        const mh=mano==='S'?p.J.hL:p.J.hR;
        if(T.ballHand){
          const l=[mh[0]+.02,mh[1]+.13,mh[2]],w=[p.x+VIS*(l[0]*p.fx-l[2]*p.fz),VIS*l[1],p.z+VIS*(l[0]*p.fz+l[2]*p.fx)];
          for(let j=0;j<3;j++)supFisica=Math.max(supFisica,Math.abs(p.ballW[j]-w[j]));
        }else if(p.ballW!==null)supFisica=Infinity;
        traccia.push([nome,passo++,...P.JK.flatMap(k=>p.J[k].map(round)),...(p.ballW||[null,null,null]),S.ball.state,
          callback,...[S.ball.x,S.ball.y,S.ball.z,S.ball.vx,S.ball.vy,S.ball.vz].map(round)]);
      };
      const avanza=delta=>{
        S.game.time+=delta;
        if(p.charging)p.chargeT+=delta;
        A.updateActs(delta);check(delta);
        if(S.ball.state==='flight')F.updateBall(delta);
        if(sequenza&&numero===1&&passo%4===0)cattura('seq-'+String(passo).padStart(4,'0'));
      };
      const cattura=fase=>{
        p.mesh.g.updateWorldMatrix(true,true);
        const C=p.mesh.corpo,O=C.ossa,v=camera.position.clone(),q=camera.quaternion.clone(),qRoot=camera.quaternion.clone();
        p.mesh.g.getWorldQuaternion(qRoot);
        const punto=osso=>osso.getWorldPosition(v).toArray().map(round);
        const ossa={};
        for(const [chiave,osso] of Object.entries({pelvis:O.bacino,spine_03:C.schiena.at(-1),
          upperarm_r:O.bracD,lowerarm_r:O.avamD,hand_r:O.manoD,upperarm_l:O.bracS,lowerarm_l:O.avamS,hand_l:O.manoS,
          thigh_r:O.cosciaD,calf_r:O.gambaD,foot_r:O.piedeD,thigh_l:O.cosciaS,calf_l:O.gambaS,foot_l:O.piedeS})){
          ossa[chiave]={pos:punto(osso),quaternion:osso.getWorldQuaternion(q).toArray().map(round)};
        }
        const locale=osso=>{
          const b=osso.getWorldPosition(v),hip=ossa.pelvis.pos;
          return [round((b.x-hip[0])*p.fx+(b.z-hip[2])*p.fz),round(b.y-hip[1]),round(-(b.x-hip[0])*p.fz+(b.z-hip[2])*p.fx)];
        };
        O.bacino.getWorldQuaternion(q);q.premultiply(qRoot.clone().invert());
        const yaw=Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.x*q.x+q.y*q.y));
        const normalizza=a=>Math.atan2(Math.sin(a),Math.cos(a));
        const dominante=mano==='D'?'r':'l',libero=mano==='D'?'l':'r';
        const piedi={dominante:locale(mano==='D'?O.piedeD:O.piedeS),libero:locale(mano==='D'?O.piedeS:O.piedeD)};
        const misura={nome,fase,actT:p.act?.t??null,frusta:p.act?.frusta??null,callback,
          giunti:Object.fromEntries(P.JK.map(k=>[k,p.giuntiVista[k].map(round)])),ossa,piedi,
          asimmetriaPiedi:round(piedi.libero[0]-piedi.dominante[0]),
          yawBacino:round(normalizza(yaw-Math.PI/2)),
          quotaGomito:round(ossa['lowerarm_'+dominante].pos[1]-ossa['upperarm_'+dominante].pos[1]),
          quotaGomitoTesta:round(ossa['lowerarm_'+dominante].pos[1]-punto(O.testa)[1]),
          manoLiberaY:ossa['hand_'+libero].pos[1],
          manoLiberaSottoSpalla:round(ossa['hand_'+libero].pos[1]-ossa['upperarm_'+libero].pos[1])};
        fasi.push(misura);
        const seq=fase.startsWith('seq-');
        if((seq?!sequenza:!foto)||dir!==1||mano!=='D')return;
        freccia.visible=ring.visible=passMark.visible=false;
        const held=S.ball.state==='held'&&S.ball.holder===p,w=held?(p.ballVistaW||p.ballW):[S.ball.x,S.ball.y,S.ball.z];
        ball3d.position.set(...w);
        const raccordo=S.ball.raccordoVista;
        if(!held&&raccordo&&S.ball.flightT<raccordo.durata){
          const u=Math.max(0,Math.min(1,S.ball.flightT/raccordo.durata)),k=1-u*u*(3-2*u);
          ball3d.position.x+=raccordo.x*k;ball3d.position.y+=raccordo.y*k;ball3d.position.z+=raccordo.z*k;
        }
        for(const vista of (seq?[{nome:'trequarti',pos:[2.8,1.1,2.8]}]:viste)){
          camera.position.set(...vista.pos);camera.lookAt(0,.15,0);camera.fov=36;camera.updateProjectionMatrix();
          draw(scene,camera);render++;
          immagini.push({nome:fase+'-'+vista.nome,png:renderer.domElement.toDataURL('image/png')});
        }
      };
      check(dt);cattura('0-attesa');
      p.charging=true;p.chargeT=0;
      for(let i=0;i<60;i++)avanza(dt);
      cattura('1-caricata');
      A.startAct(p,'shot',0,()=>{callback++;rilascio=p.act.t;A.doShoot(p,.7,false,0);});
      const act=p.act;
      check(dt);
      for(const [fase,target] of [['2-spinta',act.frusta*.30],['3-rotazione',act.frusta*.65],
        ['4-rilascio',act.frusta+1e-9],['5-accompagna',act.frusta+.16]]){
        while(act.t<target-1e-12)avanza(Math.min(dt,target-act.t));
        cattura(fase);
      }
      if(sequenza&&numero===1)while(act.t<act.frusta+.36-1e-12)avanza(Math.min(dt,act.frusta+.36-act.t));
      casi.push({nome,dir,mano,supFisica,callback,rilascio,frusta:act.frusta});
    }
    return {casi,traccia,fasi,immagini,render};
  },{foto:!!arg('foto'),sequenza:!!arg('sequenza')});
  assert.deepEqual(errori,[],'nessun errore in pagina');
  for(const c of risultato.casi){
    assert.ok(c.supFisica<1e-10,'J/ballW fisici invariati '+JSON.stringify(c));
    assert.equal(c.callback,1,'callback reale eseguita una volta '+c.nome);
    assert.ok(Math.abs(c.rilascio-c.frusta)<1e-8,'istante fisico di rilascio '+c.nome);
  }
  for(const f of risultato.fasi){
    const valori=[...Object.values(f.giunti).flat(),...Object.values(f.ossa).flatMap(o=>[...o.pos,...o.quaternion]),
      f.asimmetriaPiedi,f.yawBacino,f.quotaGomito,f.quotaGomitoTesta,f.manoLiberaY,f.manoLiberaSottoSpalla];
    assert.ok(valori.every(Number.isFinite),'ossa e giunti finiti '+f.nome+' '+f.fase);
  }
  const sequenza=risultato.immagini.filter(f=>f.nome.startsWith('seq-'));
  assert.equal(risultato.render,(arg('foto')?18:0)+sequenza.length,'solo render delle fasi richieste');
  if(arg('sequenza')){fs.mkdirSync(arg('sequenza'),{recursive:true});for(const [i,f]of sequenza.entries())fs.writeFileSync(path.join(arg('sequenza'),String(i).padStart(4,'0')+'.png'),Buffer.from(f.png.split(',')[1],'base64'));}
  if(arg('foto')){
    fs.mkdirSync(arg('foto'),{recursive:true});
    for(const f of risultato.immagini.filter(f=>!f.nome.startsWith('seq-')))fs.writeFileSync(path.join(arg('foto'),f.nome+'.png'),Buffer.from(f.png.split(',')[1],'base64'));
  }
  delete risultato.immagini;
  risultato.fisicaSHA256=createHash('sha256').update(JSON.stringify(risultato.traccia)).digest('hex');
  risultato.prima=prima||null;
  const confronto=arg('confronta')?JSON.parse(fs.readFileSync(arg('confronta'),'utf8')):null;
  if(confronto){
    assert.deepEqual(risultato.traccia,confronto.traccia,'tracce J/ballW, palla fisica e callback PRIMA/DOPO identiche');
    assert.deepEqual(risultato.casi,confronto.casi,'rilasci e invarianti PRIMA/DOPO identici');
  }
  if(arg('salva')){
    fs.mkdirSync(path.dirname(path.resolve(arg('salva'))),{recursive:true});
    fs.writeFileSync(arg('salva'),JSON.stringify(risultato,null,2)+'\n');
  }
  console.log(JSON.stringify({prima:risultato.prima,casi:risultato.casi,fisicaSHA256:risultato.fisicaSHA256,render:risultato.render},null,2));
  console.log('PASS tiro fasi: quattro casi, invarianti fisiche, '+risultato.fasi.length+' pose del rig; '+risultato.render+' render selezionati');
}finally{await browser.close();await server.close();}
