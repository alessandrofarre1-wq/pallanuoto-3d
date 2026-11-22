// Comandi reali → ciclo completo della partita → palla e ossa del modello.
// Nessuna scrittura in inp/keys/touch: il solo dispositivo simulato è il gamepad.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false,watch:null}});
await server.listen();
const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
const browser=await chromium.launch({executablePath,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  const errori=[];page.on('pageerror',e=>errori.push(e.message));
  await page.addInitScript(()=>{
    let seme=75,ora=0;
    window.__rafNativo=window.requestAnimationFrame.bind(window);
    window.__rnd=()=>{seme=(Math.imul(seme,1664525)+1013904223)>>>0;return(seme+.5)/4294967296;};
    performance.now=()=>ora;
    window.requestAnimationFrame=cb=>{window.__raf=cb;return 1;};
    window.__pad={buttons:Array.from({length:17},()=>({pressed:false,value:0})),axes:[0,0]};
    Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad]});
    window.__avanza=n=>{
      const H=window.__pallanuoto,draw=H.renderer.render;H.renderer.render=()=>{};
      try{for(let i=0;i<n;i++){
        const prima=H.ball.revisioneTiro||0,portatore=H.ball.holder;ora+=1000/60;window.__raf(ora);
        // La revisione cambia anche su rimbalzo/deviazione: un lancio richiede
        // che la palla lasci davvero la mano del suo tiratore in questo passo.
        if((H.ball.revisioneTiro||0)!==prima&&portatore&&H.ball.shooter===portatore&&H.ball.holder!==portatore&&window.__comando){
          window.__comando.lanci.push({uid:H.ball.shooter?.uid,kind:H.ball.kind,potenza:H.ball.shotPower,
            velocita:Math.hypot(H.ball.vx,H.ball.vy,H.ball.vz),libera:H.ball.holder===null});
        }
      }}finally{H.renderer.render=draw;}
    };
    document.addEventListener('touchstart',e=>{window.__touchVero=e.isTrusted;});
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto&&window.__raf,null,{timeout:60000,polling:100});
  await page.evaluate(async()=>{
    const H=window.__pallanuoto;
    const [I,C,S,{ring},T]=await Promise.all(['input','controllo','stato','grafica/scena','tiri'].map(n=>import('/src/'+n+'.js')));
    let scena=0;
    window.__comando={I,C,S,ring,lanci:[],prepara(){
      I.resetInput();C.resetTap();H.replay.interrompiReplay();
      window.__pad.buttons.forEach(b=>{b.pressed=false;b.value=0;});window.__pad.axes=[0,0];
      document.activeElement?.blur();document.querySelector('#menu').style.display='none';
      Object.assign(H.game,{state:'play',autoplay:false,time:100+ ++scena*10,clock:180,shot:28,period:1,
        after:null,fermoFallo:null,penalty:null,rigoriFinali:null,possTeam:H.teams[0],possT:100+scena*10,passaggi:0});
      H.fight.active=false;
      for(const t of H.teams){t.human=t.idx===0;t.dir=t.idx===0?1:-1;t.atkPlay=0;t.timeouts=2;}
      for(const q of H.allPlayers)Object.assign(q,{x:-9+q.i*.1,z:q.team.idx?8:-8,vx:0,vz:0,fx:q.team.dir,fz:0,
        act:null,cut:null,girata:null,charging:false,chargeT:0,oriz:0,orizPrec:0,phase:0,J:null,palmi:null,spina:null,
        giuntiVista:null,bracciaVista:null,ballW:null,ballVistaW:null,excluded:false,uscendo:false,stamina:1,
        pressatoUntil:0,stunUntil:H.game.time+100,tackleCD:100,colpi:[],contactT:0,turnedUntil:0,
        freeThrow:false,fakeCount:0,ultimoLatoFinta:0,fintaLatoGesto:0,fintaLato:null,voloPronto:false,
        voloTocco:-9,qte:null,qteDopo:H.game.time+100,ricevutoPassaggio:false,shootNext:false});
      const p=H.teams[0].players[4];Object.assign(p,{x:4,z:0,fx:1,fz:0,stunUntil:0});
      const gk=H.teams[1].players[0];gk.x=11.8;gk.z=0;
      H.regole.giveBall(p);H.__setCtrl(p);
      Object.assign(H.ball,{kind:null,shooter:null,afterShot:false,inRete:false,vx:0,vy:0,vz:0});
      window.__avanza(3);this.lanci=[];return p.uid;
    },stato(){const p=H.teams[0].players[4];return {uid:p.uid,x:p.x,z:p.z,tiene:H.ball.holder===p,
      carica:p.chargeT,charging:p.charging,finte:p.fakeCount,gesto:p.act?.kind,potenza:p.act?.potenza,
      lanci:this.lanci.filter(x=>x.uid===p.uid),ring:ring.visible,colore:ring.material.color.getHex(),scala:ring.scale.x};},
    finta(){const p=H.teams[0].players[4];for(let i=0;i<180;i++){
      window.__avanza(1);if(p.act?.kind==='fake'&&!p.act.done&&p.act.t>.03)return true;
    }return false;},
    movimento(){const p=H.teams[0].players[4],C=p.mesh.corpo,O=C.ossa,campioni=[];
      for(let i=0;i<24;i++){window.__avanza(4);campioni.push([O.bracD,O.avamD,O.manoD,C.schiena.at(-1)].map(o=>o.quaternion.toArray()));}
      const angolo=(a,b)=>2*Math.acos(Math.min(1,Math.abs(a.reduce((s,x,i)=>s+x*b[i],0))));
      const escursione=campioni[0].map((q,j)=>Math.max(...campioni.map(c=>angolo(q,c[j]))));
      return {braccio:Math.max(...escursione.slice(0,3)),busto:escursione[3],...this.stato()};
    },preparaBoa(dir,mano,coperto){
      this.prepara();const [t,o]=H.teams;t.dir=dir;o.dir=-dir;
      for(const q of H.allPlayers){q.x=(-9+q.i*.1)*dir;q.fx=q.team.dir;}
      const b=t.players[1],d=o.players[6],h=t.players[4],lato=mano==='S'?-1:1;
      Object.assign(b,{x:9.5*dir,z:0,fx:-dir,fz:0,mano,stunUntil:0});
      Object.assign(d,{x:b.x+.9*dir,z:-dir*lato*(coperto?.7:-.7),fx:-dir,fz:0});
      Object.assign(h,{x:5.5*dir,z:0,fx:dir,fz:0});o.players[0].x=11.8*dir;
      H.regole.giveBall(h);H.__setCtrl(h);window.__avanza(3);T.doPass(h,b);
      this.lanci=[];return b.uid;
    },ricezioneBoa(){const b=H.teams[0].players[1];
      for(let i=0;i<90&&H.ball.holder!==b;i++)window.__avanza(1);
      return {ricevuta:H.ball.holder===b&&b.ricevutoPassaggio,gesto:b.act?.kind};
    },statoBoa(){const b=H.teams[0].players[1];return {gesto:b.act?.kind,lanci:this.lanci.filter(x=>x.uid===b.uid)};
    },geometriaBoa(){const casi=[];
      for(const dir of [1,-1])for(const mano of ['D','S'])for(const assetto of ['coperto','aperto','porta-esterno','porta-interno']){
        this.preparaBoa(dir,mano,assetto==='coperto');
        const b=H.teams[0].players[1],d=H.teams[1].players[6],lato=mano==='S'?-1:1;
        Object.assign(b,{x:9.5*dir,z:0,fx:-dir,fz:0});
        Object.assign(d,{x:b.x+.9*dir,z:-dir*lato*(assetto==='coperto'?.7:-.7)});
        if(assetto.startsWith('porta-')){
          b.fx=-dir*Math.cos(.45);b.fz=(assetto==='porta-esterno'?-1:1)*dir*lato*Math.sin(.45);d.z=0;
        }
        const atteso=['coperto','porta-interno'].includes(assetto)?'sciarpa':'beduina';
        const gesti=[0,1,3,8].map(n=>{b.tiriDiSchiena=n;return T.shotKind(b);});
        casi.push({dir,mano,assetto,atteso,gesti});
      }
      this.prepara();return casi;
    }};
  });
  const frame=n=>page.evaluate(n=>window.__avanza(n),n);
  const prepara=()=>page.evaluate(()=>window.__comando.prepara());
  const stato=()=>page.evaluate(()=>window.__comando.stato());
  const cdp=await page.context().newCDPSession(page);
  let contatti=[];
  const touch=async(type,nuovi)=>{contatti=nuovi;await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:nuovi});};
  const centro=()=>page.locator('[data-b="shoot"]').evaluate(b=>{const r=b.getBoundingClientRect();return {id:7,x:r.x+r.width/2,y:r.y+r.height/2};});
  const canali=['touch','Space','k','pad'];
  async function premi(canale,muovi=false){
    if(canale==='touch'){
      if(muovi){await touch('touchStart',[{id:3,x:90,y:260}]);await touch('touchMove',[{id:3,x:145,y:260}]);}
      await touch('touchStart',[...contatti,await centro()]);
    }else if(canale==='pad')await page.evaluate(muovi=>{const p=window.__pad;p.buttons[2]={pressed:true,value:1};p.axes=[muovi?1:0,0];},muovi);
    else {if(muovi)await page.keyboard.down('ArrowRight');await page.keyboard.down(canale);}
  }
  async function rilascia(canale){
    if(canale==='touch'){
      await touch('touchEnd',contatti.filter(t=>t.id!==7));
      if(contatti.length)await touch('touchEnd',[]);
    }else if(canale==='pad')await page.evaluate(()=>{window.__pad.buttons[2]={pressed:false,value:0};window.__pad.axes=[0,0];});
    else {await page.keyboard.up(canale);await page.keyboard.up('ArrowRight');}
  }
  const misure=[];
  for(const canale of canali){
    await prepara();await premi(canale);await frame(5);
    let s=await stato();assert.ok(s.tiene&&s.charging&&s.lanci.length===0,canale+': il polso aspetta il rilascio');
    await rilascia(canale);await frame(1);s=await stato();
    assert.equal(s.gesto,'polso',canale+': tocco e rilascio avviano il polso');assert.equal(s.finte,0);
    await frame(24);s=await stato();
    assert.equal(s.lanci.length,1,canale+': un solo tiro reale');assert.equal(s.lanci[0].kind,'shot');
    assert.equal(s.lanci[0].potenza,.42);assert.ok(s.lanci[0].libera&&s.lanci[0].velocita>10,canale+': palla lanciata davvero');

    await prepara();const prima=await stato();await premi(canale,true);await frame(12);s=await stato();
    assert.ok(s.carica>0&&s.carica<.9,canale+': preparazione progressiva');
    await frame(60);s=await stato();assert.equal(s.carica,.9,canale+': massima potenza a 0,9 s');
    const pronto={colore:s.colore,scala:s.scala};
    const movimento=await page.evaluate(()=>window.__comando.movimento());
    assert.ok(movimento.tiene&&movimento.charging&&movimento.lanci.length===0,canale+': tenere premuto non tira');
    assert.equal(movimento.carica,.9,canale+': la potenza resta disponibile durante le finte');
    assert.ok(movimento.finte>=2,canale+': le finte continuano oltre la piena carica');
    assert.ok(Math.hypot(movimento.x-prima.x,movimento.z-prima.z)>.12,canale+': il giocatore continua a spostarsi');
    assert.ok(movimento.braccio>.04&&movimento.busto>.01,canale+': braccio e busto del modello si muovono dopo la piena carica');
    assert.ok(s.ring&&movimento.ring,canale+': anello di preparazione visibile');
    assert.equal(movimento.colore,pronto.colore,canale+': colore pronto stabile');assert.equal(movimento.scala,pronto.scala,canale+': anello pronto stabile');
    assert.ok(await page.evaluate(()=>window.__comando.finta()),canale+': finta attiva prima del rilascio');
    await rilascia(canale);await frame(1);s=await stato();
    assert.ok(['shot','torsione'].includes(s.gesto),canale+': rilascio durante la finta avvia subito il tiro');assert.equal(s.potenza,1);
    await frame(28);s=await stato();assert.equal(s.lanci.length,1,canale+': nessun secondo tiro residuo');assert.equal(s.lanci[0].potenza,1);
    misure.push({canale,braccio:+movimento.braccio.toFixed(3),busto:+movimento.busto.toFixed(3),finte:movimento.finte});
  }
  assert.equal(await page.evaluate(()=>window.__touchVero),true,'touchstart prodotto dal dispositivo del browser');

  const geometriaBoa=await page.evaluate(()=>window.__comando.geometriaBoa());
  for(const c of geometriaBoa)assert.deepEqual(c.gesti,Array(4).fill(c.atteso),'gesto dalla geometria, indipendente dai tiri precedenti: '+JSON.stringify(c));
  const ricezioniBoa=[];
  for(const [dir,mano,coperto,volo] of [[1,'D',true,false],[-1,'S',true,false],[1,'S',false,false],[-1,'D',false,false],[1,'D',true,true],[1,'D',false,true]]){
    await page.evaluate(({dir,mano,coperto})=>window.__comando.preparaBoa(dir,mano,coperto),{dir,mano,coperto});
    if(volo){await premi('touch');await frame(3);await rilascia('touch');}
    const arrivo=await page.evaluate(()=>window.__comando.ricezioneBoa());
    assert.ok(arrivo.ricevuta,'passaggio realmente ricevuto dalla boa');
    if(!volo){await premi('touch');await frame(5);await rilascia('touch');await frame(1);}
    else await frame(1);
    const gesto=(await page.evaluate(()=>window.__comando.statoBoa())).gesto,atteso=coperto?'sciarpa':'beduina';
    assert.equal(gesto,atteso,'TIRO della boa dopo la ricezione'+(volo?' al volo':''));
    await frame(28);const esito=await page.evaluate(()=>window.__comando.statoBoa());
    assert.equal(esito.lanci.length,1,'un solo lancio reale della boa');
    assert.equal(esito.lanci[0].potenza,volo?.62:.42,'potenza del comando conservata');
    ricezioniBoa.push({dir,mano,coperto,volo,gesto});
  }

  // Annullamenti: il rilascio successivo non deve trasformarsi in un tiro differito.
  for(const caso of ['blur','pausa','reset','possesso','controllo','pressione','libero6']){
    await prepara();await premi('Space');await frame(42);
    await page.evaluate(caso=>{
      const D=window.__comando,H=window.__pallanuoto,p=H.teams[0].players[4];
      if(caso==='blur')window.dispatchEvent(new Event('blur'));
      if(caso==='pausa')H.pausa();
      if(caso==='reset')D.C.resetTap();
      if(caso==='possesso'){H.regole.giveBall(H.teams[1].players[4]);H.regole.giveBall(p);H.__setCtrl(p);}
      if(caso==='controllo')H.__setCtrl(H.teams[0].players[3]);
      if(caso==='pressione')p.pressatoUntil=H.game.time+10;
      if(caso==='libero6'){p.x=9;p.freeThrow=true;}
    },caso);
    await frame(2);await rilascia('Space');
    if(caso==='pausa')await page.evaluate(()=>window.__pallanuoto.pausa());
    await frame(50);const s=await stato();
    assert.ok(s.tiene&&!s.charging&&s.carica===0&&s.lanci.length===0,'annullamento senza tiro residuo: '+caso);
  }
  await prepara();await premi('touch');await frame(42);
  await touch('touchCancel',[]);await frame(60);
  let s=await stato();assert.ok(s.tiene&&!s.charging&&s.carica===0&&s.lanci.length===0,'touchcancel annulla e non equivale al rilascio');
  await premi('touch');await frame(5);await rilascia('touch');await frame(24);
  assert.equal((await stato()).lanci.length,1,'dopo touchcancel un nuovo tocco funziona');
  await prepara();await premi('pad');await frame(42);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await frame(2);await rilascia('pad');await frame(40);s=await stato();
  assert.ok(s.tiene&&!s.charging&&s.lanci.length===0,'blur annulla anche un gamepad ancora premuto');
  const foto=process.argv.find(a=>a.startsWith('--foto='))?.slice(7),budget=[];
  if(foto){
    fs.mkdirSync(foto,{recursive:true});
    await page.evaluate(()=>window.__pallanuoto.costumi.pronti);
    for(const viewport of [{width:844,height:390},{width:667,height:375}]){
      await page.setViewportSize(viewport);
      await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
      const dimensioni=await page.evaluate(()=>{const tela=window.__pallanuoto.renderer.domElement;
        return {width:innerWidth,height:innerHeight,tela:[parseFloat(tela.style.width),parseFloat(tela.style.height)]};});
      assert.deepEqual([dimensioni.width,dimensioni.height],Object.values(viewport),'viewport della foto');
      assert.deepEqual(dimensioni.tela,Object.values(viewport),'tela ridimensionata alla viewport della foto');
      await prepara();
      await page.evaluate(()=>{
        const H=window.__pallanuoto;H.vista=null;H.game.cambiLiberi=false;
        for(const t of H.teams){
          t.coda=[];t.cambio=null;t.prossimoControllo=H.game.time+100;
          const p=t.players.find(q=>!q.isGK&&q!==H.ctrl),g=t.rosa.find(q=>!q.inAcqua&&q.ruolo!==0&&!q.fuori);
          if(!H.panchina.chiediCambio(t,p,g,true))throw new Error('Impossibile preparare i due cambi reali');
        }
      });
      await premi('k');await frame(72);
      const scatto=await page.evaluate(async()=>{
        const H=window.__pallanuoto,{comparseVisibili}=await import('/src/panchina.js');
        H.__ridisegna();
        const tv={...H.renderer.info.render},png=H.renderer.domElement.toDataURL('image/png'),fov=H.camera.fov;
        // Una sola vista larga per includere anche entrambi i bordi e misurare
        // il caso con tutti i corpi; le foto conservano la camera del gioco.
        H.vista={pos:[0,19,16],look:[0,0,0],fov:60};window.__avanza(1);H.__ridisegna();
        let corpi=0;H.allPlayers[0].mesh.g.parent.traverse(o=>{
          if(!o.isSkinnedMesh)return;for(let n=o;n;n=n.parent)if(!n.visible)return;corpi++;
        });
        const ampia={...H.renderer.info.render};H.vista=null;H.camera.fov=fov;H.camera.updateProjectionMatrix();
        return {png,tv,ampia,comparse:comparseVisibili().length,corpi,
          anello:window.__comando.ring.visible,carica:H.ctrl.chargeT};
      });
      assert.equal(scatto.comparse,2,'due cambi reali contemporanei');assert.ok(scatto.corpi>=14,'almeno 14 corpi visibili');
      assert.ok(scatto.anello&&scatto.carica===.9,'foto con anello pronto durante la tenuta');
      for(const vista of [scatto.tv,scatto.ampia])assert.ok(vista.calls<100&&vista.triangles<150000,'budget iPhone durante preparazione e due cambi: '+JSON.stringify(vista));
      fs.writeFileSync(path.join(foto,'tenuta-pronta-'+viewport.width+'.png'),Buffer.from(scatto.png.split(',')[1],'base64'));
      // Conserva la vista TV sotto l'HUD reale: il compositore della foto DOM
      // usa l'immagine salvata, senza richiedere un altro disegno WebGL.
      await page.evaluate(async png=>{
        const tela=window.__pallanuoto.renderer.domElement,img=document.createElement('img');
        img.id='fotoTiro075';img.src=png;img.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:1;pointer-events:none';
        window.__statoFotoUI={raf:window.requestAnimationFrame,visibilita:tela.style.visibility};
        window.requestAnimationFrame=window.__rafNativo;tela.style.visibility='hidden';
        document.body.append(img);await img.decode();
      },scatto.png);
      try{
        const tiro=page.locator('[data-b="shoot"]');
        assert.ok(await tiro.isVisible(),'TIRO visibile nella foto dell’interfaccia');
        assert.equal(await tiro.locator('small').textContent(),'PRONTO','stato reale di TIRO nella foto');
        assert.equal(await page.locator('#power').count(),0,'nessuna barra di carica nella foto');
        assert.ok(await page.locator('#tCambi').isVisible()&&await page.locator('#stamPerc').isVisible(),'CAMBI ed energia visibili nella foto');
        await page.screenshot({path:path.join(foto,'ui-tenuta-pronta-'+viewport.width+'.png'),timeout:60000});
      }finally{
        await page.evaluate(()=>{
          document.querySelector('#fotoTiro075')?.remove();
          window.__pallanuoto.renderer.domElement.style.visibility=window.__statoFotoUI.visibilita;
          window.requestAnimationFrame=window.__statoFotoUI.raf;delete window.__statoFotoUI;
        });
      }
      delete scatto.png;budget.push({viewport,...scatto});await rilascia('k');await frame(1);
      await page.evaluate(()=>{window.__pallanuoto.vista=null;});
    }
    fs.writeFileSync(path.join(foto,'misure.json'),JSON.stringify({misure,budget,geometriaBoa,ricezioniBoa},null,2));
  }
  assert.deepEqual(errori,[],'nessun errore JavaScript');
  console.log('PASS tiro v0.75: touch vero, Space/K/controller, polso, finte e ossa in movimento, rilascio, boa e annullamenti '+JSON.stringify({misure,budget,ricezioniBoa}));
}finally{await browser.close();await server.close();}
