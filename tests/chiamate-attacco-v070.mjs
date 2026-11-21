// Chiamate touch e movimento reale: il giocatore preme PASSA, il taglio aspetta il rilascio.
// Nessun gol/ricezione imposto; camera e pose restano quelli della partita.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const salva=process.argv.find(a=>a.startsWith('--salva='))?.slice(8);
const server=await createServer({logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1}),errori=[];
  page.on('pageerror',e=>errori.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.__rnd=()=>.5;});
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:120000});
  await page.evaluate(async()=>{
    const nomi=['stato','partita','ia','entrate','tiri','schemi','regole','input','replay','chiamate-attacco','hud'];
    const [S,P,A,E,T,Q,R,I,V,C,U]=await Promise.all(nomi.map(n=>import('/src/'+n+'.js')));
    const [vista,scena]=await Promise.all([import('/src/grafica/render.js'),import('/src/grafica/scena.js')]);
    document.getElementById('goBtn').click();scena.renderer.render=()=>{};
    let numero=0;
    const put=(p,d,z,dir)=>Object.assign(p,{x:(12.5-d)*dir,z:z*dir,vx:0,vz:0});
    const setup=(tipo='A',dir=1,mano='D')=>{
      I.resetInput();V.interrompiReplay();const G=S.game,B=S.ball,[t,o]=S.teams;
      Object.assign(G,{state:'play',time:200+(++numero)*20,possT:194.5+numero*20,passaggi:2,possTeam:t,shot:24,clock:180,period:1,
        autoplay:false,penalty:null,rigoriFinali:null,rigoreDifferito:null,fermoFallo:null,after:null,scattando:false});
      t.dir=dir;o.dir=-dir;t.human=true;o.human=false;S.setCtrl(null);S.fight.active=false;
      for(const team of S.teams){
        Q.applicaSchema(team,Q.copiaSchema('arco'));E.resetDisposizioneTattica(team);
        Object.assign(team,{coda:[],cambio:null,prossimoControllo:Infinity,contro:null,timeouts:0,fugaFino:0,postiT:-1,postiAssegnati:null});
      }
      for(const p of S.allPlayers){
        Object.assign(p,{excluded:false,uscendo:false,act:null,charging:false,chargeT:0,cut:null,girata:null,oriz:0,stamina:1,
          pressatoUntil:0,pressatoDa:null,stunUntil:0,tackleCD:99,colpi:[],areaT:0,freeThrow:false,turnedUntil:0,fakeUntil:0,
          ricevutoInEntrata:false,ricevutoPassaggio:false,alVolo:false,shootNext:false,decideT:99,reazioneT:99,appoggio:null,
          mano,fx:p.team.dir,fz:0,perno:false,scivolaAI:false,lunge:0,rientro:null});
        p.s={...p.s,vel:90,pre:90,frz:90,pas:94,vis:90,dif:70,dis:99};p.st=window.__pallanuoto.prova.valoriMotore(p.s);
        delete p.ballW;delete p.ballVistaW;
      }
      for(const p of t.players)put(p,...(p.isGK?[24.3,0]:t.schema.attacco[p.i-1]),dir);
      for(const p of o.players)put(p,p.isGK?.7:23,p.isGK?0:3+p.i*.95,dir);
      // La boa è ancora arretrata: motivo reale per chiamare un movimento invece di servirla.
      put(t.players[1],20.5,-2,dir);
      const h=t.players[tipo==='C'?4:6],m=t.players[tipo==='B'?5:tipo==='C'?6:4];
      const d=E.difensoreEntrata(h);put(d,Math.abs(S.goalX(t)-h.x)+1.25,h.z*dir,dir);d.s.vel=55;d.st=window.__pallanuoto.prova.valoriMotore(d.s);
      R.giveBall(h);B.holdTime=.4;B.x=h.x;B.z=h.z;S.setCtrl(h);
      for(const p of S.allPlayers){const a=A.uomoDi(p);p.lagX=a.x;p.lagZ=a.z;}
      vista.render(1/60,G.time*1000);U.updateHUD();
      return {t,o,h,m,d};
    };
    const step=()=>{P.update(1/60);V.interrompiReplay();vista.render(1/60,S.game.time*1000);U.updateHUD();};
    const inputPass=down=>document.querySelector('[data-b="pass"]').dispatchEvent(new TouchEvent(down?'touchstart':'touchend',{bubbles:true,cancelable:true,changedTouches:[]}));
    window.__chiamate={S,P,A,E,T,Q,R,I,V,C,U,vista,setup,step,inputPass};
  });
  const offerte=await page.evaluate(()=>{
    const {S,E,C,U,setup}=window.__chiamate,{t,o,h}=setup();const G=S.game;
    G.possT=G.time-5.49;U.updateHUD();const presto=document.getElementById('chiamateAttacco').hidden;
    G.possT=G.time-5.51;U.updateHUD();const tre=C.offertaChiamate(t).map(c=>c.id),visibile=!document.getElementById('chiamateAttacco').hidden;
    t.players[6].s.vel=t.players[6].s.pre=t.players[6].s.frz=70;t.players[2].s.vel=t.players[2].s.pre=t.players[2].s.frz=70;
    const due=C.opzioniChiamata(t).map(c=>c.id);t.players[6].mano=t.players[2].mano='S';const mancini=C.opzioniChiamata(t).map(c=>c.id);
    const b=E.centroAttacco(t);b.x=S.goalX(t)-t.dir*2.6;b.z=0;
    for(const d of o.players)if(!d.isGK){d.x=-9;d.z=6+d.i*.5;}
    U.updateHUD();const boaAperta=document.getElementById('chiamateAttacco').hidden&&C.boaServibileAdesso(t);
    // Una linea tecnicamente passabile non equivale a un'occasione chiara:
    // il marcatore ancora sul lato della porta mantiene il duello marginale.
    const marcatore=E.difensoreEntrata(b);marcatore.x=b.x+t.dir*.9;marcatore.z=b.z+.9;
    U.updateHUD();const duelloMarginale=!document.getElementById('chiamateAttacco').hidden&&!C.boaServibileAdesso(t);
    const transizione=setup();transizione.h.x=-2*transizione.t.dir;S.ball.x=transizione.h.x;U.updateHUD();
    const propriaMeta=!document.getElementById('chiamateAttacco').hidden;
    const sceltaInViaggio=C.chiamaAttacco(transizione.t,'A'),hintInViaggio=C.etichettaChiamata(transizione.t);
    const esecuzioneAttende=E.passaggioChiamato(transizione.h,()=>true)===null&&!transizione.h.cut;
    return {presto,tre,visibile,due,mancini,boaAperta,duelloMarginale,propriaMeta,sceltaInViaggio,hintInViaggio,esecuzioneAttende,holder:h.i};
  });
  assert.ok(offerte.presto&&offerte.visibile&&offerte.boaAperta&&offerte.duelloMarginale,'scelte dopo5,5s: assenti su boa davvero libera, presenti nel duello marginale');
  assert.deepEqual(new Set(offerte.tre),new Set(['A','B','C']));assert.deepEqual(new Set(offerte.due),new Set(['A','C']));assert.ok(offerte.mancini.includes('B'));
  assert.ok(offerte.propriaMeta&&offerte.sceltaInViaggio&&offerte.esecuzioneAttende&&offerte.hintInViaggio.startsWith('Avanza'),'dopo5,5s si chiama già nella propria metà, ma lo schema attende l’attacco');

  const scene=[];
  for(const tipo of ['A','B','C'])for(const dir of [1,-1]){
    await page.evaluate(({tipo,dir})=>{
      const {S,setup}=window.__chiamate,s=setup(tipo,dir,tipo==='B'?'S':'D');window.__scenaChiamata=s;
      s.prima=S.allPlayers.map(p=>[p.x,p.z]);s.schema=JSON.stringify(s.t.schema);s.difesa=s.t.defPlay;
    },{tipo,dir});
    await page.locator(`[data-chiamata="${tipo}"]`).dispatchEvent('pointerdown',{pointerType:'touch',bubbles:true});
    const r=await page.evaluate(tipo=>{
      const {S,E,T,C,step,inputPass}=window.__chiamate,{t,h,m,prima,schema,difesa}=window.__scenaChiamata,B=S.ball,G=S.game;
      const scelta={tipo,dir:t.dir,nascoste:document.getElementById('chiamateAttacco').hidden,coda:t.chiamataAttacco?.tipo,
        primaTaglio:!!h.cut,controllo:S.ctrl===h,nessunSalto:prima.every(([x,z],i)=>S.allPlayers[i].x===x&&S.allPlayers[i].z===z),
        hint:C.etichettaChiamata(t),primoTarget:null,rilascio:false,appoggioRiceve:false,ritorno:false,ricezione:false,maxPasso:0,schema:true,difesa:true};
      inputPass(true);step();inputPass(false);
      scelta.primoTarget=h.act?.aim?.map(x=>+x.toFixed(3));scelta.ancoraPrimaDelRilascio=!h.cut&&B.holder===h;
      let precedente=S.allPlayers.map(p=>[p.x,p.z]),ritornoRichiesto=false;
      for(let frame=0;frame<360;frame++){
        step();
        for(let i=0;i<S.allPlayers.length;i++){const p=S.allPlayers[i];scelta.maxPasso=Math.max(scelta.maxPasso,Math.hypot(p.x-precedente[i][0],p.z-precedente[i][1]));}
        precedente=S.allPlayers.map(p=>[p.x,p.z]);
        if(h.cut?.tipo===tipo&&h.cut.coordinata&&B.shooter===h)scelta.rilascio=true;
        if(B.holder===m){scelta.appoggioRiceve=true;
          if(!ritornoRichiesto&&T.entrataPronta(h)&&B.holdTime>.2){inputPass(true);step();inputPass(false);ritornoRichiesto=true;}
        }
        if(B.kind==='pass'&&B.shooter===m&&B.target===h){scelta.ritorno=true;scelta.ritornoT??=G.time;scelta.cutAlRitorno??=!!h.cut;}
        if(B.holder===h&&ritornoRichiesto){scelta.presaT??=G.time;scelta.presaFlag??={taglio:!!h.cut,entrata:h.ricevutoInEntrata,pass:h.ricevutoPassaggio};}
        if(B.holder===h&&h.ricevutoInEntrata){scelta.ricezione=true;break;}
        if(G.possTeam!==t||G.state!=='play')break;
      }
      scelta.schema=JSON.stringify(t.schema)===schema;scelta.difesa=t.defPlay===difesa;
      scelta.stato=G.state;scelta.holder=B.holder?.i;scelta.ctrl=S.ctrl?.i;scelta.palla=B.state;
      return scelta;
    },tipo);
    scene.push(r);
    console.log('SCENA',JSON.stringify(r));
    assert.ok(r.nascoste&&r.coda===tipo&&!r.primaTaglio&&r.controllo&&r.nessunSalto,'il tocco chiama senza spostare atleti o prendere la palla '+tipo+dir);
    assert.ok(r.hint.includes('appoggia alla '+(tipo==='A'?2:tipo==='B'?4:3)),'il portatore vede il vicino da servire, non se stesso '+tipo+dir);
    assert.ok(r.ancoraPrimaDelRilascio&&r.rilascio&&r.appoggioRiceve,'appoggio umano effettivo e partenza al rilascio '+tipo+dir);
    assert.ok(r.ritorno&&r.ricezione,'il giocatore serve il tagliante pronto con il secondo PASSA '+tipo+dir);
    assert.ok(r.schema&&r.difesa&&r.maxPasso<.12,'schema e difesa conservati, nuoto continuo '+tipo+dir);
  }
  const rinunce=await page.evaluate(()=>{
    const {S,E,C,R,setup}=window.__chiamate,r=[];
    for(const causa of ['possesso','espulsione','reset','scadenza','corridoio']){
      const {t,o,h,m}=setup();const chiamata=C.chiamaAttacco(t,'A');let controllo;
      if(causa==='possesso'){R.giveBall(o.players[4]);E.aggiornaEntrate(t);controllo=!t.chiamataAttacco&&!h.cut;}
      if(causa==='espulsione'){o.players[3].excluded=true;E.aggiornaEntrate(t);controllo=!t.chiamataAttacco&&!h.cut;}
      if(causa==='reset'){E.resetDisposizioneTattica(t);controllo=!t.chiamataAttacco&&!t.chiamataPossesso;}
      if(causa==='scadenza'){S.game.time+=7;controllo=E.chiamataAttuale(t)===null&&!h.cut;}
      if(causa==='corridoio'){controllo=E.passaggioChiamato(h,()=>false)===null&&!h.cut&&S.ball.holder===h&&t.chiamataAttacco?.m===m;}
      r.push({causa,chiamata,controllo});
    }
    return r;
  });
  assert.ok(rinunce.every(x=>x.chiamata&&x.controllo),'chiamata annullata o attesa senza passaggi forzati');

  // Guardia isolata: il cambio automatico del controllo non cancella il
  // contesto della presa; una direzione dell'utente lo interrompe immediatamente.
  const controlloManuale=await page.evaluate(async()=>{
    const {humanControl}=await import('/src/controllo.js');
    const {S,I,setup}=window.__chiamate,{h,m}=setup();
    h.cut={coordinata:true,tipo:'A',t0:S.game.time,x:h.x+1,z:h.z};
    Object.assign(S.ball,{state:'flight',kind:'pass',holder:null,target:h,shooter:m});
    humanControl(h,1/60);const neutro=!!h.cut;
    I.inp.x=1;humanControl(h,1/60);const direzione=h.cut===null;I.resetInput();
    return {neutro,direzione};
  });
  assert.ok(controlloManuale.neutro&&controlloManuale.direzione,'il movimento manuale prevale sull’entrata durante la ricezione');

  const layout=[];
  for(const [width,height] of [[667,375],[844,390]])for(const safe of [0,47]){
    await page.setViewportSize({width,height});
    const r=await page.evaluate(({safe,width,height})=>{
      const {S,setup,U}=window.__chiamate,{t,o}=setup();
      for(const k of ['--sl','--sr'])document.documentElement.style.setProperty(k,safe+'px');
      document.documentElement.style.setProperty('--sb','12px');
      Object.assign(S.fight,{active:true,boa:t.players[1],def:o.players[6],ricevibile:false,v:0,apertura:0});
      const cambi=document.getElementById('tCambi');cambi.dataset.stato='corso';U.updateHUD();
      // L'aggiornamento del consiglio può essere differito dal suo timer: qui si
      // simula solo lo stato visivo già emesso dalla panchina, non un cambio fisico.
      cambi.dataset.stato='corso';U.updateHUD();
      const rect=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,r:b.right,b:b.bottom};};
      const row=document.getElementById('chiamateAttacco'),bottoni=[...row.querySelectorAll('button')].map(rect),cr=rect(cambi);
      const comandi=[document.getElementById('joy'),...document.querySelectorAll('.tb')].filter(e=>getComputedStyle(e).display!=='none').map(rect);
      const overlap=(a,b)=>a.x<b.r&&a.r>b.x&&a.y<b.b&&a.b>b.y;
      const fuori=bottoni.some(b=>b.x<safe-.1||b.r>width-safe+.1||b.y<0||b.b>height-12+.1);
      const interseca=bottoni.some(b=>comandi.some(c=>overlap(b,c))||overlap(b,cr));
      const fight=getComputedStyle(document.getElementById('fight')).display;
      return {width,height,safe,bottoni,fuori,interseca,fight,visibile:!row.hidden};
    },{safe,width,height});
    layout.push(r);
    console.log('LAYOUT',JSON.stringify(r));
    assert.ok(r.visibile&&!r.fuori&&!r.interseca&&r.fight==='none',`chiamate e CAMBI separati ${width} safe${safe}`);
    assert.ok(r.bottoni.every(b=>b.w>=43.9&&b.h>=43.9),'aree di tocco44px');
  }
  assert.deepEqual(errori,[]);
  const risultato={offerte,scene,rinunce,controlloManuale,layout};
  if(salva)fs.writeFileSync(salva,JSON.stringify(risultato,null,2)+'\n');
  console.log(JSON.stringify(risultato,null,2));console.log('PASS chiamate v0.70: scelta touch, due passaggi reali A/B/C, annullamenti e layout44px');
}finally{await browser.close();await server.close();}
