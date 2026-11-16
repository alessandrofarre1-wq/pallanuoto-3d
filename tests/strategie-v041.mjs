// Il piano disegnato prima della partita deve diventare il piano usato in acqua.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { build, preview } from 'vite';

if(!process.argv.includes('--no-build')) await build({logLevel:'warn'});
const server=await preview({preview:{host:'127.0.0.1',port:4395,strictPort:true}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const context=await browser.newContext({viewport:{width:852,height:393},hasTouch:true,isMobile:true});
  await context.addInitScript(()=>{
    performance.now=()=>0;window.requestAnimationFrame=cb=>{window.__raf=cb;return 1;};
    let seme=41;window.__rnd=()=>{seme=seme+0x6D2B79F5|0;let t=Math.imul(seme^seme>>>15,1|seme);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
  });
  const page=await context.newPage(),errori=[];
  page.on('pageerror',e=>errori.push(e.message));
  const pronta=()=>page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:120000});
  await page.goto(server.resolvedUrls.local[0]);await pronta();
  await page.locator('#vHome .m-cta').click();
  await page.locator('#btStrategieSquadre').click();
  assert.equal(await page.locator('#menu').getAttribute('data-vista'),'strategie');
  const numeriLavagna=()=>page.locator('#schemaPiscina [data-schema-ruolo] > text').allTextContents();
  assert.deepEqual(await numeriLavagna(),['6','1','5','2','4','3'],'parità: numeri richiesti sui posti interni, senza rinumerare il motore');
  assert.match(await page.locator('#schemaGiocatore option[value="6"]').textContent(),/Pos\. 3 · Centro/);
  assert.match(await page.locator('.schema-aiuto-lavagna').first().textContent(),/Pos\. = posizione, # = calotta/);
  await page.locator('#schemaPreset').selectOption('entrata');
  await page.locator('#schemaNome').fill('Taglio Ale');
  await page.locator('#schemaGiocatore').selectOption('4');
  for(const [id,value] of [['schemaDistanza','6.9'],['schemaLarghezza','5.3']]){
    await page.locator('#'+id).fill(value);await page.locator('#'+id).dispatchEvent('change');
  }
  await page.locator('#schemaSuperiorita').click();
  assert.deepEqual(await numeriLavagna(),['5','1','4','2','3','6'],'6c5: convenzione diversa e destra della porta invariata');
  assert.match(await page.locator('#schemaGiocatore option[value="5"]').textContent(),/Pos\. 3 · Esterno sinistro · 5 m/);
  await page.locator('#schemaGiocatore').selectOption('6');
  for(const [id,value] of [['schemaDistanza','2.7'],['schemaLarghezza','-2.4']]){
    await page.locator('#'+id).fill(value);await page.locator('#'+id).dispatchEvent('change');
  }
  await page.locator('#schemaEntrata').selectOption('5');
  await page.locator('#schemaDifesa').selectOption('1');
  await page.locator('#schemaPassaggi').selectOption('vicini');
  await page.locator('#schemaSalva').click();
  assert.equal(await page.locator('#menu').getAttribute('data-vista'),'squadre');
  const salvata=await page.evaluate(()=>JSON.parse(localStorage.getItem('pallanuoto-schema-v041')));
  assert.equal(salvata.id,'personale');assert.equal(salvata.nome,'Taglio Ale');
  assert.deepEqual(salvata.attacco[3],[6.9,5.3]);assert.deepEqual(salvata.superiorita[5],[2.7,-2.4]);
  assert.equal(salvata.entrata,5);assert.equal(salvata.difesa,1);
  await page.reload();await pronta();
  await page.locator('#vHome .m-cta').click();
  assert.match(await page.locator('#schemaSquadre').textContent(),/Taglio Ale/);
  await page.locator('#vSquadre .m-cta').click();await page.locator('#goBtn').click();
  assert.deepEqual(await page.evaluate(()=>window.__pallanuoto.teams[0].schema),salvata,'newMatch conserva il piano salvato');
  const campo=await page.evaluate(()=>{
    const H=window.__pallanuoto,t=H.teams[0],p=t.players[4];
    H.game.state='play';H.game.time=100;H.game.possT=100;
    for(const q of H.allPlayers) Object.assign(q,{excluded:false,uscendo:false,act:null,cut:null,appoggio:null,x:-8,z:-8});
    const h=t.players[2];h.x=6;h.z=-5;H.regole.giveBall(h);H.ball.x=h.x;H.ball.z=h.z;H.__setCtrl(p);
    p.x=5.6;p.z=5.3;
    const a=H.prova.attackTarget(p);
    t.dir=-1;p.x=-5.6;p.z=-5.3;h.x=-6;h.z=5;H.ball.x=h.x;H.ball.z=h.z;
    const b=H.prova.attackTarget(p);
    return {a,b,difesa:t.defPlay};
  });
  assert.ok(Math.abs(campo.a.x-5.6)<.001,'distanza disegnata applicata al target IA');
  assert.ok(Math.abs(campo.a.z-5.3)<.36,'ampiezza disegnata rispettata salvo piccolo appoggio di ruolo');
  assert.ok(Math.abs(campo.b.x+5.6)<.001&&Math.abs(campo.b.z+5.3)<.36,'piano specchiato al cambio campo');
  assert.equal(campo.difesa,1);
  await page.evaluate(()=>window.__pallanuoto.pausa());
  await page.locator('#vPausa [data-va="tattiche"]').click();
  const personale=page.locator('#tattichePausa [data-tattica="attacco"][data-schema="personale"]');
  assert.match(await personale.textContent(),/Taglio Ale/);
  assert.ok(await page.locator('#tattichePausa svg').count()>=9,'tattiche spiegate con diagrammi');
  await page.locator('#tattichePausa [data-tattica="attacco"][data-schema="2"]').click();
  assert.equal(await page.evaluate(()=>window.__pallanuoto.teams[0].schema.id),'incrocio');
  await personale.click();
  assert.deepEqual(await page.evaluate(()=>window.__pallanuoto.teams[0].schema),salvata,'pausa richiama il piano preparato');
  await page.locator('#riprendiTattiche').click();
  assert.equal(await page.evaluate(()=>window.__pallanuoto.game.state),'play');
  // Le sostituzioni cambiano l'atleta che occupa il posto, non il piano del posto.
  const cambio=await page.evaluate(()=>{
    const H=window.__pallanuoto,t=H.teams[0];t.dir=1;
    const p=t.players[4],riserva=t.rosa.find(g=>!g.inAcqua&&g.ruolo!==0&&!g.fuori);
    H.game.state='countdown';H.game.timer=3;const prima=p.scheda.num;H.panchina.chiediCambio(t,p,riserva,true);
    const render=H.renderer.render;H.renderer.render=()=>{};
    try{window.__raf(1000/60);}finally{H.renderer.render=render;}
    return {prima,dopo:p.scheda.num,schema:t.schema};
  });
  assert.notEqual(cambio.prima,cambio.dopo,'cambio libero realmente eseguito');
  assert.deepEqual(cambio.schema,salvata,'sostituzione conserva compiti e posti');
  // Validazione: storage malformato e coordinate impossibili non entrano nel motore.
  const validazione=await page.evaluate(()=>{
    const P=window.__pallanuoto.prova,s=P.copiaSchema('arco');s.attacco[0]=[0,0];s.attacco[1]=[99,99];
    const limitato=P.validaSchema(s);s.entrata=99;
    return {limitato,invalido:P.validaSchema(s),corrotto:P.validaSchema({nome:'rotto'})};
  });
  assert.deepEqual(validazione.limitato.attacco[0],[2.1,0]);
  assert.deepEqual(validazione.limitato.attacco[1],[10,8.8]);
  assert.equal(validazione.invalido,null);assert.equal(validazione.corrotto,null);
  await page.reload();await pronta();
  await page.locator('#vHome [data-competizione="mondiali"]').click();
  await page.locator('#sorteggiaTorneo').click();
  await page.locator('#btStrategieTorneo').click();
  assert.equal(await page.locator('#schemaNome').inputValue(),'Taglio Ale');
  await page.locator('#schemaIndietro').click();
  assert.equal(await page.locator('#menu').getAttribute('data-vista'),'torneo');
  await page.locator('#torneoGioca').click();
  await page.locator('#btStrategieImpostazioni').click();
  await page.locator('#schemaIndietro').click();await page.locator('#goBtn').click();
  const torneo=await page.evaluate(()=>{const H=window.__pallanuoto;return {gara:H.game.torneoMatch,schema:H.teams[0].schema};});
  assert.equal(torneo.gara.tipo,'mondiali');assert.deepEqual(torneo.schema,salvata);
  assert.deepEqual(errori,[],'nessun errore JS in editor, gara, reload o torneo');
  console.log('PASS strategie v0.41: editor→storage→IA, due fasi, cambio campo, sostituzione, validazione e avvio torneo.');
  await context.close();
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
