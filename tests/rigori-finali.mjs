import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import { creaSerieRigori, preparaRigoreFinale, registraRigoreFinale } from '../src/rigoriFinali.js';

const tiratori=[0,1].map(s=>[1,2,3,4,5].map(num=>({num:num+s*10,nome:`Tiratore ${s}-${num}`})));
function tiro(s,gol){ const p=preparaRigoreFinale(s); assert.ok(p,'il prossimo tiro esiste'); registraRigoreFinale(s,gol); return p; }
const anticipata=creaSerieRigori(tiratori);
for(const gol of [true,false,true,false,true,false]) tiro(anticipata,gol);
assert.deepEqual(anticipata.gol,[3,0]); assert.deepEqual(anticipata.battuti,[3,3]);
assert.equal(anticipata.vincitore,0); assert.equal(preparaRigoreFinale(anticipata),null);
assert.equal(registraRigoreFinale(anticipata,true),false,'un tiro concluso non viene contato due volte');
let oltranza=creaSerieRigori(tiratori,1);
for(let i=0;i<10;i++) tiro(oltranza,true);
assert.equal(oltranza.terminati,false,'cinque pari richiede oltranza');
oltranza=JSON.parse(JSON.stringify(oltranza));
assert.equal(tiro(oltranza,true).num,11,'sesto tiro ripete il primo tiratore della squadra che inizia');
assert.equal(oltranza.terminati,false,'in oltranza entrambe le squadre hanno la stessa opportunità');
assert.equal(tiro(oltranza,false).num,1);
assert.equal(oltranza.vincitore,1); assert.deepEqual(oltranza.gol,[5,6]);
const seconda=creaSerieRigori(tiratori);
for(const gol of [false,true,false,true,false,true]) tiro(seconda,gol);
assert.equal(seconda.vincitore,1,'chi tira per secondo può chiudere la serie in anticipo');

if(!process.argv.includes('--no-build')) await build({logLevel:'warn'});
const server=await preview({preview:{host:'127.0.0.1',port:4367}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  const errori=[]; page.on('pageerror',e=>errori.push(e.message));
  await page.addInitScript(()=>{
    performance.now=()=>0; window.__f=0;
    window.requestAnimationFrame=cb=>{window.__raf=cb;return 1;};
    window.__step=n=>{const R=window.__pallanuoto.renderer,draw=R.render;R.render=()=>{};
      try{for(let i=0;i<n;i++)window.__raf(++window.__f*1000/60);}finally{R.render=draw;}};
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:60000});
  const avvio=await page.evaluate(()=>{
    const H=window.__pallanuoto;
    // Fine quarto tempo reale nel ciclo del gioco; nessuna dipendenza dai pulsanti della home.
    document.getElementById('menu').style.display='none';
    H.game.state='play'; H.game.period=4; H.game.clock=.001; H.game.time=90; H.game.shot=20;
    H.game.torneoMatch={id:'test-rigori',tipo:'mondiali',nazionale:H.teams[0].codice};
    H.game.rigoriFinali=null; H.game.autoplay=false; H.teams[0].human=true;
    H.teams[0].score=H.teams[1].score=7;
    for(const p of H.allPlayers){p.excluded=false;p.pf=0;p.act=null;p.charging=false;p.stamina=.73;p.fakeUntil=p.fakedUntil=p.turnedUntil=p.pressatoUntil=p.fintaFino=900;}
    H.regole.giveBall(H.teams[0].players[6]); window.__step(1);
    const s=H.game.rigoriFinali;
    // Test dei tiri dell'umano per primi, poi il normale ordine alternato resta invariato.
    s.primo=s.turno=0;
    window.__step(122);
    return {fase:s.fase,tiratori:s.tiratori,clock:H.game.clock,time:H.game.time,shot:H.game.shot,
      num:H.game.penalty?.num,score:H.teams.map(t=>t.score),residui:H.allPlayers.some(p=>p.fakeUntil||p.fakedUntil||p.turnedUntil||p.pressatoUntil||p.fintaFino),stamina:H.allPlayers.map(p=>p.stamina)};
  });
  assert.equal(avvio.fase,'tiro'); assert.equal(avvio.clock,0); assert.deepEqual(avvio.score,[7,7]);
  assert.ok(avvio.tiratori.every(t=>t.length===5&&new Set(t.map(p=>p.num)).size===5),'cinque nomi eleggibili diversi');
  assert.equal(avvio.residui,false,'le finte e la pressione dei regolamentari non restano permanenti nei rigori');
  assert.ok(avvio.stamina.every(s=>s<.74),'il passaggio ai rigori non ricarica le energie');
  const reale=await page.evaluate(()=>{
    const H=window.__pallanuoto,s=H.game.rigoriFinali,p=H.game.penalty;
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyK'})); window.__step(55);
    const carica=p.chargeT,prima=H.ball.holder===p;
    window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyK'})); window.__step(1);
    const gesto=p.act?.kind; let lanciata=false;
    for(let i=0;i<80&&s.fase==='tiro';i++){window.__step(1);if(H.ball.state==='flight')lanciata=true;}
    return {carica,prima,gesto,lanciata,tentativi:s.tentativi,score:H.teams.map(t=>t.score),clock:H.game.clock,time:H.game.time};
  });
  assert.ok(reale.prima&&reale.carica>.85&&reale.gesto==='shot'&&reale.lanciata,'TIRO carica, rilascia e lancia un vero rigore');
  assert.equal(reale.tentativi.length,1,'gol, parata o fuori chiudono il tiro');
  assert.deepEqual(reale.score,[7,7],'i gol della serie non modificano il punteggio regolare');
  assert.equal(reale.clock,0); assert.equal(reale.time,avvio.time);
  const casi=await page.evaluate(()=>{
    const H=window.__pallanuoto;
    const prossimo=()=>{for(let i=0;i<140&&H.game.rigoriFinali.fase!=='tiro';i++)window.__step(1);};
    prossimo(); const s=H.game.rigoriFinali;
    // Un gol ricevuto dalla fisica attraversa il medesimo punto delle normali partite.
    H.regole.goalScored(H.teams[s.turno]); const gol=s.tentativi.at(-1);
    prossimo(); const p=H.game.penalty; H.regole.giveBall(H.teams[1-p.team.idx].players[0]);
    const parata=s.tentativi.at(-1);
    prossimo(); H.game.penalty.team.human=true;
    const clock=H.game.clock,time=H.game.time,shot=H.game.shot;
    window.__step(425); const tempo=s.tentativi.at(-1);
    H.pausa(); const n=s.tentativi.length,t=s.tempoTiro;window.__step(180);
    const pausa=n===s.tentativi.length&&t===s.tempoTiro;H.pausa();
    return {gol,parata,tempo,clock,time,shot,ora:{clock:H.game.clock,time:H.game.time,shot:H.game.shot},pausa,score:H.teams.map(t=>t.score)};
  });
  assert.equal(casi.gol.gol,true); assert.equal(casi.parata.esito,'parata'); assert.equal(casi.tempo.esito,'tempo');
  assert.equal(casi.pausa,true,'la pausa sospende anche la serie');
  assert.deepEqual(casi.ora,{clock:casi.clock,time:casi.time,shot:casi.shot},'cronometri e possesso restano fermi');
  assert.deepEqual(casi.score,[7,7]); assert.deepEqual(errori,[]);
  const finale=await page.evaluate(()=>{
    const H=window.__pallanuoto,s=H.game.rigoriFinali;
    let guardia=0;
    while(!s.terminati&&guardia++<30){
      if(s.fase==='attesa'){window.__step(110);continue;}
      if(s.turno===0) H.regole.goalScored(H.teams[0]);
      else H.regole.giveBall(H.teams[0].players[0]);
    }
    window.__step(115);
    return {terminati:s.terminati,vincitore:s.vincitore,state:H.game.state,score:H.teams.map(t=>t.score),gol:s.gol};
  });
  assert.ok(finale.terminati); assert.equal(finale.state,'over','la fine della serie arriva alla schermata risultato');
  assert.deepEqual(finale.score,[7,7]); assert.notEqual(finale.gol[0],finale.gol[1]);
  console.log('OK rigori finali: chiusura anticipata, oltranza, ordine e JSON; browser TIRO reale, gol/parata/timeout, pausa e cronometri fermi.');
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
