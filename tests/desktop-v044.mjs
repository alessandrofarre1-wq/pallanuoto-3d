// Comandi desktop WPR attraverso eventi reali di tastiera, senza scrivere in Input.keys.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:4384,strictPort:true}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:1024,height:600}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.__rnd=()=>.7;});
  await page.goto('http://127.0.0.1:4384');
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{timeout:60000,polling:100});
  await page.evaluate(async()=>{
    const [I,C,T,S,R,P]=await Promise.all(['input','controllo','tiri','stato','regole','partita'].map(m=>import('/src/'+m+'.js')));
    const G=S.game,B=S.ball,dt=1/60;let scena=0;
    window.__desktop={I,C,T,S,R,P,prepara(){
      I.resetInput();C.resetTap();document.activeElement?.blur();
      G.state='play';G.autoplay=false;G.time=100+(++scena)*10;G.possT=G.time;G.penalty=null;G.rigoriFinali=null;
      G.possTeam=S.teams[0];G.shot=24;G.clock=180;G.period=1;G.passaggi=0;S.fight.active=false;
      for(const t of S.teams){t.human=t.idx===0;t.atkPlay=0;t.cross=false;}
      for(const p of S.allPlayers) Object.assign(p,{x:p.team.idx?11:-11,z:8,vx:0,vz:0,fx:1,fz:0,oriz:0,act:null,cut:null,charging:false,chargeT:0,excluded:false,uscendo:false,pressatoUntil:0,stunUntil:0,freeThrow:false,stamina:1,reazioneT:0,shootNext:false,contactT:0,fakeCount:0,voloPronto:false,qte:null});
      const p=S.teams[0].players[6],m=S.teams[0].players[4];p.x=4;p.z=0;m.x=7;m.z=3;
      R.giveBall(p);S.setCtrl(p);B.x=p.x;B.z=p.z;B.kind=null;B.shooter=null;
      window.__pallanuoto.camera.matrixWorld.identity();
      return p;
    },frame(n=1){for(let i=0;i<n;i++){I.pollInput();G.time+=dt;T.updateActs(dt);C.updateCtrl();if(S.ctrl) C.humanControl(S.ctrl,dt);}},
    stato(){const p=S.teams[0].players[6];return {x:I.inp.x,z:I.inp.z,p1:!!I.inp.p1,p2:!!I.inp.p2,p3:!!I.inp.p3,p4:!!I.inp.p4,
      pass:!!I.inp.pass,desktopPass:!!I.inp.desktopPass,shoot:!!I.inp.shoot,sw:!!I.inp.sw,carica:p.chargeT,charging:p.charging,
      act:p.act?.kind||null,potenza:p.act?.potenza||0,finte:p.fakeCount,trattenuta:B.holder===p,passaggi:G.passaggi,kind:B.kind,ctrl:S.ctrl?.i};}};
    document.querySelector('#menu').style.display='none';window.__desktop.prepara();
  });
  const prepara=()=>page.evaluate(()=>window.__desktop.prepara()&&true);
  const frame=n=>page.evaluate(n=>window.__desktop.frame(n),n);
  const stato=()=>page.evaluate(()=>window.__desktop.stato());
  const down=async(key,n=1)=>{await page.keyboard.down(key);await frame(n);};
  const up=async(key,n=1)=>{await page.keyboard.up(key);await frame(n);};

  await down('ArrowRight');await down('ArrowUp');
  let s=await stato();assert.ok(s.x>.7&&s.z<-.7,'frecce diagonali nel piano dello schermo');
  await up('ArrowRight');await up('ArrowUp');
  for(const [key,flag] of [['q','p1'],['w','p2'],['e','p3'],['4','p4']]){
    await down(key);s=await stato();assert.equal(s[flag],true,'formazione '+key);assert.equal(s.x,0);assert.equal(s.z,0);await up(key);
  }
  for(const key of ['a','s']){await down(key);s=await stato();assert.equal(Math.hypot(s.x,s.z),0,'nessun movimento WASD');await up(key);}
  for(const [key,attesa] of [['w',1],['e',2],['q',0]]){
    await prepara();await page.keyboard.down(key);await page.evaluate(()=>window.__desktop.P.update(1/60));
    assert.equal(await page.evaluate(()=>window.__desktop.S.teams[0].atkPlay),attesa,'formazione applicata da '+key);await up(key);
  }

  await prepara();await down('d',30);s=await stato();
  assert.equal(s.desktopPass,true);assert.equal(s.pass,false);assert.equal(s.x,0);assert.equal(s.act,null,'D tenuto aspetta il rilascio');assert.equal(s.passaggi,0);
  await page.keyboard.down('d');await frame(10);assert.equal((await stato()).passaggi,0,'autorepeat D non passa');
  await up('d');assert.equal((await stato()).act,'pass','D rilasciato avvia il passaggio');await frame(45);
  assert.equal((await stato()).passaggi,1,'un solo passaggio al rilascio');await frame(45);assert.equal((await stato()).passaggi,1);

  await prepara();await down('Space',120);s=await stato();
  assert.ok(s.trattenuta&&s.charging&&s.finte>=2,'SPACE tenuto esegue finte e conserva la palla');
  assert.equal(s.carica,.9,'carica massima dopo 0,9 s');assert.equal(s.passaggi,0);
  await up('Space');s=await stato();assert.equal(s.act,'shot','rilascio interrompe la finta e tira');assert.equal(s.potenza,1);
  await frame(45);s=await stato();assert.equal(s.kind,'shot');assert.equal(s.trattenuta,false);assert.equal(s.act,null,'gesto finito senza blocchi');

  await prepara();await down('Space');await up('Space');s=await stato();
  assert.equal(s.act,'shot','pressione breve: tiro normale al rilascio');assert.equal(s.finte,0);assert.ok(s.potenza>0);
  await down('Space');assert.equal((await stato()).act,'shot','secondo tocco non converte il tiro in finta di polso');await up('Space');await frame(40);

  for(const vincolo of ['freeThrow','pressatoUntil','excluded','portiere']){
    await prepara();await page.evaluate(v=>{const D=window.__desktop,p=D.S.ctrl;if(v==='freeThrow'){p.freeThrow=true;p.x=9;}else if(v==='pressatoUntil')p.pressatoUntil=D.S.game.time+9;else if(v==='excluded')p.excluded=true;else{D.R.giveBall(D.S.teams[0].players[0]);D.S.setCtrl(D.S.teams[0].players[0]);}},vincolo);
    await down('Space',20);await up('Space',40);
    const esito=await page.evaluate(()=>({kind:window.__desktop.S.ball.kind,holder:!!window.__desktop.S.ball.holder}));
    assert.ok(esito.kind!=='shot'&&esito.holder,'nessun tiro illecito: '+vincolo);
  }
  for(const vincolo of ['pressione','libero6']){
    await prepara();await down('Space',24);await page.evaluate(v=>{const D=window.__desktop,p=D.S.ctrl;if(v==='pressione')p.pressatoUntil=D.S.game.time+9;else{p.freeThrow=true;p.x=9;}},vincolo);
    await up('Space',40);s=await stato();assert.ok(s.trattenuta&&!s.charging&&s.kind!=='shot','carica annullata se diventa illecito: '+vincolo);
  }
  await prepara();await page.evaluate(()=>{const D=window.__desktop;D.S.ball.holder=null;D.S.ball.state='flight';D.S.ball.kind='pass';D.S.ball.target=D.S.ctrl;});
  await down('Space',10);await page.evaluate(()=>{const D=window.__desktop;D.R.giveBall(D.S.ctrl);});await frame(20);await up('Space',30);
  assert.equal((await stato()).kind,null,'SPACE tenuto prima della ricezione non produce un tiro automatico');

  for(const key of ['Space','d']){
    await prepara();await down(key,16);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await frame(1);await up(key,45);
    s=await stato();assert.ok(s.trattenuta&&!s.charging&&s.passaggi===0&&s.kind!=='shot','blur annulla senza eseguire '+key);
    await prepara();await down(key,4);await page.evaluate(()=>window.__desktop.C.resetTap());await up(key,40);
    s=await stato();assert.ok(s.trattenuta&&s.passaggi===0&&s.kind!=='shot','reset cancella intenzione '+key);
    await prepara();await down(key,16);await page.evaluate(()=>{const D=window.__desktop;D.S.game.state='paused';D.P.update(1/60);});
    await page.keyboard.up(key);await page.evaluate(()=>window.__desktop.P.update(1/60));
    await page.evaluate(()=>{window.__desktop.S.game.state='play';});await frame(40);
    s=await stato();assert.ok(s.trattenuta&&!s.charging&&s.passaggi===0&&s.kind!=='shot','pausa annulla senza carica bloccata '+key);
  }

  await prepara();await down('d',4);await page.evaluate(()=>{const D=window.__desktop;D.R.giveBall(D.S.teams[1].players[4]);});await up('d',30);
  assert.equal((await stato()).passaggi,0,'perdere il possesso annulla D');
  await prepara();await page.evaluate(()=>{const D=window.__desktop,p=D.S.ctrl,m=D.S.teams[0].players[4];D.R.giveBall(D.S.teams[1].players[4]);D.S.setCtrl(p);D.S.ball.x=0;D.S.ball.z=0;p.x=-8;p.z=0;m.x=.5;m.z=0;});
  await down('c');assert.equal((await stato()).ctrl,4,'C seleziona il difensore più vicino alla palla');await frame(30);assert.equal((await stato()).ctrl,4,'C tenuto cambia una sola volta');await up('c');

  await prepara();await down('Space',15);
  await page.evaluate(()=>{const input=document.createElement('input');input.id='desktop-editor';document.body.append(input);input.focus();});
  await up('Space',30);assert.equal((await stato()).kind,null,'focus nel campo annulla il tiro in carica');
  for(const key of ['Space','ArrowRight','d','w','c']){await down(key);await up(key);}
  const editor=await page.evaluate(()=>{const D=window.__desktop,i=document.getElementById('desktop-editor');return {value:i.value,stato:D.stato(),prevented:i.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true,cancelable:true}))===false};});
  assert.ok(editor.value.includes(' '),'SPACE conserva la funzione nel campo');assert.equal(editor.prevented,false,'SPACE editor non intercettato');
  assert.equal(editor.stato.x,0);assert.equal(editor.stato.z,0);assert.equal(editor.stato.passaggi,0);assert.equal(editor.stato.kind,null);
  await page.evaluate(()=>document.getElementById('desktop-editor').remove());

  await prepara();await page.evaluate(()=>{const D=window.__desktop;D.I.touch.btn.pass=true;});await frame(1);
  assert.equal((await stato()).act,'pass','touch passa ancora alla pressione');await page.evaluate(()=>window.__desktop.I.touch.btn.pass=false);await frame(30);
  assert.equal((await stato()).passaggi,1);
  await prepara();await down('Shift',60);assert.equal(await page.evaluate(()=>window.__desktop.I.inp.sprint),false,'Shift tenuto conserva sprint a tocchi');await up('Shift');
  await down('Shift');assert.equal(await page.evaluate(()=>window.__desktop.I.inp.sprint),true,'un nuovo tocco rinnova lo scatto');await up('Shift');
  assert.deepEqual(errors,[],'nessun errore JavaScript');
  console.log('OK desktop v0.44: frecce, D al rilascio, SPACE finta/tiro, C, QWE, editor, blur, reset, vincoli e touch invariato');
} finally {await browser.close();await server.close();}
