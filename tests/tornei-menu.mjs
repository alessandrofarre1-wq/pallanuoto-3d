// Verifica l'integrazione della campagna con le schermate e con la fine partita.
// I risultati sportivi sono imposti a fine quarto tempo per provare il percorso UI;
// le partite complete e i rigori reali hanno verifiche separate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { build, preview } from 'vite';
if(!process.argv.includes('--no-build')) await build({logLevel:'warn'});
const server=await preview({preview:{host:'127.0.0.1',port:4392}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const foto=process.argv.includes('--foto'), out='tests/screenshot/tornei';
if(foto)fs.mkdirSync(out,{recursive:true});
try{
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1});
  await context.addInitScript(()=>{
    performance.now=()=>0;window.__f=0;window.requestAnimationFrame=cb=>{window.__raf=cb;return 1;};
    window.__step=n=>{const R=window.__pallanuoto.renderer,draw=R.render;R.render=()=>{};try{for(let i=0;i<n;i++)window.__raf(++window.__f*1000/60);}finally{R.render=draw;}};
  });
  const page=await context.newPage(),errori=[];
  page.on('pageerror',e=>{errori.push(e.message);console.error(e.stack);});
  const pronta=async()=>page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{timeout:120000,polling:100});
  const scatta=async nome=>{if(foto){await page.evaluate(()=>{window.__raf(++window.__f*1000/60);});await page.screenshot({path:`${out}/${nome}.png`,timeout:120000});}};
  await page.goto(server.resolvedUrls.local[0]);await pronta();
  await scatta('home');
  assert.equal(await page.locator('#vHome [data-competizione]').count(),2);
  await page.locator('#vHome [data-competizione="mondiali"]').click();
  assert.equal(await page.locator('#nazionaliTorneo [data-nazionale]').count(),24);
  assert.match(await page.locator('#formulaTorneo').textContent(),/24 nazionali disponibili · 16 al torneo/);
  for(const codice of ['FRA','MLT']){
    await page.locator(`[data-nazionale="${codice}"]`).click();
    assert.equal(await page.locator(`[data-nazionale="${codice}"]`).getAttribute('aria-pressed'),'true');
  }
  await page.locator('#sorteggiaTorneo').click();
  assert.equal(await page.locator('#menu').getAttribute('data-vista'),'torneo');
  const iniziale=await page.evaluate(()=>window.__pallanuoto.tornei.esportaSalvataggi().campagne.mondiali);
  assert.equal(iniziale.nazionale,'MLT');assert.equal(Object.keys(iniziale.gruppi).length,4);
  assert.equal(iniziale.partecipanti.length,16);
  assert.ok(iniziale.partecipanti.includes('MLT'));
  assert.deepEqual([...iniziale.partecipanti].sort(),Object.values(iniziale.gruppi).flat().sort());
  await scatta('mondiali-gironi');
  async function giocaFine(){
    await page.locator('#torneoGioca').click();
    assert.deepEqual(errori,[],'il cambio delle squadre non genera errori');
    await page.locator('#goBtn').click();
    const risultato=await page.evaluate(()=>{
      const H=window.__pallanuoto;
      if(H.ball.inRete||H.allPlayers.some(p=>p.pressatoUntil>0||p.fakedUntil>0)) return {reset:false};
      const m={...H.game.torneoMatch};
      H.game.state='play';H.game.period=4;H.game.clock=.001;H.game.shot=28;H.game.time=120;
      H.teams[0].score=30;H.teams[1].score=1;
      for(const p of H.allPlayers){p.act=null;p.excluded=false;p.pf=0;p.x=p.team.idx?11:-11;p.z=8;}
      const p=H.teams[0].players[6];p.x=p.z=0;H.regole.giveBall(p);H.__setCtrl(p);
      window.__step(1);
      return {reset:true,stato:H.game.state,m,codice:H.teams[0].codice};
    });
    assert.ok(risultato.reset,'nessuno stato residuo della gara precedente');
    assert.equal(risultato.stato,'over');
    assert.equal(risultato.codice,risultato.m.nazionale,'la nazionale scelta è sempre controllata');
    await page.waitForFunction(()=>['fine','cerimonia'].includes(document.getElementById('menu').dataset.vista),null,{timeout:10000,polling:100});
    const vista=await page.locator('#menu').getAttribute('data-vista');
    if(vista==='cerimonia'){await scatta('premiazione');await page.locator('#saltaCerimonia').click();}
    await page.locator('#rigioca').click();
  }
  await giocaFine();
  const salvata=await page.evaluate(()=>window.__pallanuoto.tornei.esportaSalvataggi().campagne.mondiali);
  assert.equal(salvata.partite.filter(p=>(p.casa==='MLT'||p.ospite==='MLT')&&p.golCasa!==null).length,1);
  await page.reload();await pronta();
  const riletta=await page.evaluate(()=>window.__pallanuoto.tornei.esportaSalvataggi().campagne.mondiali);
  assert.deepEqual(riletta,salvata,'reload conserva sorteggio, risultati e prossima avversaria');
  await page.locator('#continuaTornei [data-continua="mondiali"]').click();
  await page.locator('#torneoGioca').click();await page.locator('#goBtn').click();
  await page.evaluate(()=>{window.__step(181);window.__pallanuoto.pausa();});
  const primaPausa=await page.evaluate(()=>{const H=window.__pallanuoto;return [H.game.clock,H.game.shot,H.game.time,H.teams[0].players[1].stamina];});
  await page.evaluate(()=>window.__step(120));
  assert.deepEqual(await page.evaluate(()=>{const H=window.__pallanuoto;return [H.game.clock,H.game.shot,H.game.time,H.teams[0].players[1].stamina];}),primaPausa);
  await scatta('pausa');
  page.once('dialog',d=>d.accept());await page.locator('#esciPartita').click();
  assert.deepEqual(await page.evaluate(()=>window.__pallanuoto.tornei.esportaSalvataggi().campagne.mondiali),riletta,'uscita non inventa un risultato');
  await page.locator('#vHome [data-competizione="europei"]').click();
  assert.equal(await page.locator('#nazionaliTorneo [data-nazionale]').count(),16);
  for(const codice of ['USA','BRA','CAN','AUS','CHN','JPN','RSA','SGP','NZL'])
    assert.equal(await page.locator(`#nazionaliTorneo [data-nazionale="${codice}"]`).count(),0);
  for(const codice of ['ISR','GEO','TUR']) assert.equal(await page.locator(`#nazionaliTorneo [data-nazionale="${codice}"]`).count(),1);
  await page.locator('[data-nazionale="FRA"]').click();await page.locator('#sorteggiaTorneo').click();
  const fasi=[];
  for(let i=0;i<8;i++){
    // Un timer assoluto della vecchia gara non deve bloccare quella successiva.
    await page.evaluate(()=>{const H=window.__pallanuoto;H.allPlayers[1].pressatoUntil=H.game.time+700;H.allPlayers[1].fakedUntil=H.game.time+700;H.ball.inRete=true;});
    fasi.push(await page.evaluate(()=>window.__pallanuoto.tornei.esportaSalvataggi().campagne.europei.fase));
    await giocaFine();
  }
  const dopo=await page.evaluate(()=>window.__pallanuoto.tornei.esportaSalvataggi());
  assert.equal(dopo.campagne.europei.stato,'campione');
  assert.equal(dopo.campagne.europei.nazionale,'FRA');
  assert.equal(dopo.campagne.europei.piazzamento,1);
  assert.deepEqual(fasi,['gironi','gironi','gironi','seconda_fase','seconda_fase','seconda_fase','semifinali','finale']);
  assert.deepEqual(dopo.campagne.mondiali,riletta,'i due slot sono indipendenti');
  assert.equal(dopo.bacheca.length,1);assert.equal(dopo.bacheca[0].percorso.length,8);
  await page.locator('#vTorneo [data-va="bacheca"]').click();await scatta('bacheca');
  await page.reload();await pronta();
  assert.deepEqual(await page.evaluate(()=>window.__pallanuoto.tornei.esportaSalvataggi().bacheca),dopo.bacheca);
  await page.locator('#vHome .m-cta').click();await page.locator('#vSquadre .m-cta').click();await page.locator('#goBtn').click();
  assert.equal(await page.evaluate(()=>window.__pallanuoto.game.torneoMatch),null,'singola non eredita il torneo');
  assert.deepEqual(await page.evaluate(()=>window.__pallanuoto.tornei.esportaSalvataggi().campagne),dopo.campagne,'singola conserva le campagne');
  assert.deepEqual(errori,[],'nessun errore JavaScript');
  console.log('PASS integrazione: 24 scelte Mondiali incluse FRA/MLT, torneo a 16 con MLT salvato/reload, Europei solo europee, pausa congelata, uscita avvisata, 8 gare con FRA fino al titolo, cerimonia saltabile, bacheca persistente e singola indipendente.');
  await context.close();
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
