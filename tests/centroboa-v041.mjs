// Geometria e movimento reale del duello FIN: nessun dado per girarsi o vincere un rigore.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:4381,strictPort:true}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;});
  await page.goto('http://127.0.0.1:4381');
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:60000});
  const out=await page.evaluate(async()=>{
    const [C,F,L,S,T,P]=await Promise.all([import('/src/centroboa.js'),import('/src/fisica.js'),import('/src/lotta.js'),import('/src/stato.js'),import('/src/tiri.js'),import('/src/grafica/pose.js')]);
    const {game:G,ball:B,teams,allPlayers}=S,dt=1/60;let scena=0;
    function prepara(ti=0){
      Object.assign(G,{state:'play',autoplay:false,time:100+(++scena)*10,possT:scena,possTeam:teams[ti],penalty:null});
      for(const q of allPlayers){
        Object.assign(q,{x:-9+q.i*2.7,z:q.team.idx?8:-8,vx:0,vz:0,fx:q.team.dir,fz:0,act:null,oriz:0,girata:null,turnedUntil:0,stamina:1,excluded:false,uscendo:false,freeThrow:false,pressatoUntil:0,stunUntil:0,contactT:0,charging:false,chargeT:0,perno:false});
      }
      const b=teams[ti].players[1],d=C.difensoreCentro(b),h=teams[ti].players[4],dir=b.team.dir;
      b.x=S.goalX(b.team)-dir*3;b.z=0;d.x=b.x+dir*.9;d.z=0;h.x=b.x-dir*4;h.z=2;
      B.holder=h;B.state='held';B.x=h.x;B.z=h.z;S.setCtrl(b);S.fight.active=false;
      return {b,d,h,dir};
    }
    const geometria=[];
    for(const ti of [0,1]){
      const {b,d,h,dir}=prepara(ti);
      const dietro=C.leggiCentro(b,d,h);d.x=b.x-dir*.9;d.z=0;h.z=0;
      const anticipo=C.leggiCentro(b,d,h);d.x=b.x;d.z=.95;
      const lato=C.leggiCentro(b,d,h);d.z=3;
      const libero=C.leggiCentro(b,d,h);
      b.team.schema={attacco:[[9,7]]};const editor=C.centroTarget(b);b.team.schema=null;
      geometria.push({dietro,anticipo,lato,libero,editor,atteso:{x:S.goalX(b.team)-dir*9,z:dir*7}});
    }
    const movimento=[];
    for(const ti of [0,1]){
      const {b,d,h}=prepara(ti);B.holder=h;h.z=0;B.x=h.x;B.z=0;d.team.defPlay=2;
      let min=99,maxPasso=0;
      for(let i=0;i<300;i++){
        G.time+=dt;const tg=C.anticipoTarget(d,b),dx=tg.x-d.x,dz=tg.z-d.z,l=Math.hypot(dx,dz)||1,x=d.x,z=d.z;
        F.movePlayer(d,dx/l,dz/l,false,dt);F.separate();
        min=Math.min(min,Math.hypot(d.x-b.x,d.z-b.z));maxPasso=Math.max(maxPasso,Math.hypot(d.x-x,d.z-z));
      }
      movimento.push({lettura:C.leggiCentro(b,d,h),min,maxPasso,obliquo:d.oriz});
    }
    const giri=[];
    for(const ti of [0,1])for(const mano of ['D','S']){
      const {b,d}=prepara(ti);b.mano=mano;B.holder=b;B.x=b.x;B.z=b.z;
      const x=b.x,z=b.z,fx=b.fx,fz=b.fz;const parte=L.girata(b,d);
      const istantaneo={distanza:Math.hypot(b.x-x,b.z-z),orientamento:Math.hypot(b.fx-fx,b.fz-fz),rigore:!!G.penalty};
      let min=99,maxPasso=0,aperta=null;
      for(let i=0;i<170;i++){
        G.time+=dt;const px=b.x,pz=b.z;F.movePlayer(b,0,0,false,dt);F.separate();
        min=Math.min(min,Math.hypot(b.x-d.x,b.z-d.z));maxPasso=Math.max(maxPasso,Math.hypot(b.x-px,b.z-pz));
        if(b.turnedUntil>G.time){aperta=(i+1)*dt;break;}
      }
      const lettura=C.leggiCentro(b,d,b);
      // Il marcatore torna dalla parte della porta: la vecchia finestra non lo cancella.
      d.x=b.x+b.team.dir*.9;d.z=b.z;S.fight.v=0;L.boaHold(b,d,0);
      giri.push({parte,istantaneo,min,maxPasso,aperta,lettura,recupero:b.turnedUntil<=G.time});
    }
    const posture=[];
    for(const ti of [0,1]){
      const {b,d,h,dir}=prepara(ti);h.z=3;h.x=S.goalX(h.team)-dir*6;B.holder=h;
      const g={x:S.goalX(h.team)-h.x,z:-h.z},gl=Math.hypot(g.x,g.z);h.fx=g.x/gl;h.fz=g.z/gl;
      T.startAct(h,'pass',.2,()=>{},[h.x,-h.z]);
      for(let i=0;i<15;i++){G.time+=dt;F.movePlayer(h,0,0,false,dt);P.updateRig(h,dt,G.time);}
      const fronte=(h.fx*g.x+h.fz*g.z)/gl;
      const mano=h.ballW?.slice();T.launch(h,b.x,.45,b.z,.6,'pass');
      const origine=mano?Math.hypot(B.x-mano[0],B.y-Math.max(.3,mano[1]),B.z-mano[2]):99;
      h.act=null;B.holder=b;B.state='held';B.x=b.x;B.z=b.z;d.x=b.x+dir*.9;d.z=b.z;
      for(let i=0;i<35;i++){G.time+=dt;F.movePlayer(d,0,0,false,dt);}
      const obliquo=d.oriz;
      teams[1-ti].players[2].excluded=true;b.act=null;b.fx=dir;b.fz=0;
      for(let i=0;i<20;i++){G.time+=dt;F.movePlayer(b,0,0,false,dt);}
      L.updateFight(dt);
      posture.push({fronte,origine,obliquo,paloFronte:b.fx*dir,lottaAlPalo:S.fight.active});
    }
    const passaggi=[];
    const distanza=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
    for(const ti of [0,1])for(const mano of ['D','S'])for(const direzione of ['destra','sinistra','dietro']){
      const {h,dir}=prepara(ti);h.mano=mano;h.x=S.goalX(h.team)-dir*6;h.z=0;h.fx=dir;h.fz=0;
      h.J=null;h.palmi=null;h.spina=null;B.holder=h;B.state='held';B.x=h.x;B.z=h.z;
      const dx=(direzione==='dietro'?-4:.5)*dir,dz=(direzione==='destra'?4:direzione==='sinistra'?-4:.7)*dir;
      T.startAct(h,'pass',.2,()=>{},[h.x+dx,h.z+dz]);
      const durata=h.act.wind+h.act.frusta;
      let finiti=true,maxBraccio=0,maxAvambraccio=0;
      for(let i=0;i<=24;i++){
        G.time+=dt;h.act.t=durata*i/24;F.movePlayer(h,0,0,false,dt);P.updateRig(h,dt,G.time);
        const posa=P.computePose(h,0,G.time);
        for(const key of [...P.JK,'nR','nL'])finiti&&=posa[key].every(Number.isFinite);
        for(const lato of ['R','L']){
          maxBraccio=Math.max(maxBraccio,distanza(posa['s'+lato],posa['e'+lato]),distanza(h.J['s'+lato],h.J['e'+lato]));
          maxAvambraccio=Math.max(maxAvambraccio,distanza(posa['e'+lato],posa['h'+lato]),distanza(h.J['e'+lato],h.J['h'+lato]));
        }
        finiti&&=h.ballW.every(Number.isFinite)&&h.ballVistaW.every(Number.isFinite);
      }
      const j=P.computePose(h,0,G.time),lato=mano==='S'?'L':'R',s=j['s'+lato],m=j['h'+lato],n=j['n'+lato];
      const atteso=[dx*h.fx+dz*h.fz,-dx*h.fz+dz*h.fx],al=Math.hypot(...atteso);
      const prodotto=v=>(v[0]*atteso[0]+v[2]*atteso[1])/((Math.hypot(v[0],v[2])||1)*al);
      const manoDiretta=prodotto(m.map((v,i)=>v-s[i])),palmoDiretto=prodotto(n),palmoDisegnato=prodotto(h.palmi['n'+lato]);
      const origine=h.ballW.slice();T.launch(h,h.x+dx,.45,h.z+dz,.6,'pass');
      passaggi.push({ti,mano,direzione,fronte:h.fx*dir,manoDiretta,palmoDiretto,palmoDisegnato,
        origine:distanza([B.x,B.y,B.z],[origine[0],Math.max(.3,origine[1]),origine[2]]),finiti,maxBraccio,maxAvambraccio});
    }
    const negativi=[];
    for(const vincolo of ['tiroLibero','pressione','stordito','possessoPerso','pressioneDurante']){
      const {b,d}=prepara();B.holder=b;B.x=b.x;B.z=b.z;
      if(vincolo==='tiroLibero')b.freeThrow=true;
      if(vincolo==='pressione')b.pressatoUntil=G.time+1;
      if(vincolo==='stordito')b.stunUntil=G.time+1;
      const avviata=L.girata(b,d);
      if(vincolo==='possessoPerso'){B.holder=null;G.possTeam=teams[1];}
      if(vincolo==='pressioneDurante')b.pressatoUntil=G.time+1;
      G.time+=dt;F.movePlayer(b,0,0,false,dt);
      negativi.push({vincolo,avviata,attiva:!!b.girata,fronte:b.turnedUntil>G.time,rigore:!!G.penalty});
    }
    return {geometria,movimento,giri,posture,passaggi,negativi};
  });
  console.log(JSON.stringify(out,null,2));assert.deepEqual(errors,[],'pagina senza errori');
  for(const g of out.geometria){
    assert.equal(g.dietro.tipo,'dietro');assert.equal(g.dietro.spalle,true);assert.equal(g.dietro.ricevibile,true);
    assert.equal(g.anticipo.tipo,'anticipo');assert.equal(g.anticipo.ricevibile,false);assert.equal(g.anticipo.spalle,false);
    assert.equal(g.lato.tipo,'lato');assert.equal(g.libero.tipo,'libero');assert.equal(g.libero.spalle,false);
    assert.deepEqual(g.editor,g.atteso,'editor alto/laterale rispettato');
  }
  for(const m of out.movimento){assert.equal(m.lettura.tipo,'anticipo','difensore raggiunge anticipo reale');assert.equal(m.lettura.ricevibile,false,'anticipo chiude realmente la ricezione');assert.ok(m.min>=.79&&m.maxPasso<.08,'aggira senza attraversamenti');assert.ok(m.obliquo>.3&&m.obliquo<.7);}
  for(const g of out.giri){assert.equal(g.parte,true);assert.deepEqual(g.istantaneo,{distanza:0,orientamento:0,rigore:false});assert.ok(g.aperta!==null&&g.aperta>0.4,'girata apre davvero lo spazio');assert.ok(g.min>=.79&&g.maxPasso<.08,'girata continua e separata');assert.equal(g.lettura.spalle,false);assert.equal(g.recupero,true);}
  for(const p of out.posture){assert.ok(p.fronte>.98);assert.ok(p.origine<.00001,'lancio dalla mano visibile');assert.ok(p.obliquo>.3&&p.obliquo<.7);assert.ok(p.paloFronte>.9);assert.equal(p.lottaAlPalo,false);}
  assert.equal(out.passaggi.length,12);
  for(const p of out.passaggi){
    const caso=`passaggio ${p.ti}/${p.mano}/${p.direzione}`;
    assert.ok(p.fronte>.98,caso+' corpo fronte porta');assert.ok(p.manoDiretta>.99,caso+' mano al bersaglio');
    assert.ok(p.palmoDiretto>.999,caso+' palmo al bersaglio');assert.ok(p.palmoDisegnato>.9,caso+' palmo disegnato segue il gesto');
    assert.ok(p.origine<.00001,caso+' origine dalla mano');assert.equal(p.finiti,true,caso+' nessun NaN');
    assert.ok(p.maxBraccio<=.30001&&p.maxAvambraccio<=.29001,caso+' lunghezze IK nei limiti');
  }
  for(const n of out.negativi){assert.equal(n.attiva,false,n.vincolo);assert.equal(n.fronte,false,n.vincolo);assert.equal(n.rigore,false,n.vincolo);assert.equal(n.avviata,['possessoPerso','pressioneDurante'].includes(n.vincolo),n.vincolo);}
  if(process.argv.includes('--foto')){
    await page.setViewportSize({width:760,height:520});
    await page.addStyleTag({content:'#menu,#hud,#tac,#player,#cronaca,#tLog,#fight,#touch,#fps,#ruota,#tCambi{display:none!important}'});
    const foto=await page.evaluate(async()=>{
      const [S,T,P,R]=await Promise.all([import('/src/stato.js'),import('/src/tiri.js'),import('/src/grafica/pose.js'),import('/src/grafica/render.js')]);
      const H=window.__pallanuoto,p=S.teams[0].players[4];
      for(const q of S.allPlayers)q.mesh.g.visible=q===p;
      Object.assign(p,{x:4,z:0,fx:1,fz:0,vx:0,vz:0,oriz:0,mano:'D',act:null,charging:false,pressatoUntil:0,excluded:false,stunUntil:0,J:null,palmi:null,spina:null});
      S.game.state='play';S.game.possTeam=p.team;S.game.penalty=null;S.fight.active=false;S.ball.state='held';S.ball.holder=p;
      T.startAct(p,'pass',.2,()=>{},[p.x+.5,-4]);
      for(let i=0;i<=24;i++){p.act.t=(p.act.wind+p.act.frusta)*i/24;P.updateRig(p,1/60,S.game.time);}
      H.vista={pos:[p.x+2.2,1.65,-3.4],look:[p.x,.55,0],fov:34};R.render(1/60,S.game.time*1000);
      // Il RAF è fermato per le misure: copia il framebuffer prima che il browser lo scarti.
      return H.renderer.domElement.toDataURL('image/png');
    });
    writeFileSync(path.join(root,'docs/immagini/v041-passaggio.png'),Buffer.from(foto.split(',')[1],'base64'));
  }
  console.log('Centroboa v0.41: tutte le prove superate');
}finally{await browser.close();await server.close();}
