// Home e testi di gioco su iPhone, con barre Safari e margini sicuri simulati.
// Uso: node tests/home-v044.mjs [--foto] [--url=http://127.0.0.1:4454]
// Il server di sviluppo evita di sovrascrivere dist mentre girano le prove del motore.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const FOTO=process.argv.includes('--foto');
const urlArg=process.argv.find(s=>s.startsWith('--url='));
const server=urlArg?null:await createServer({root:ROOT,logLevel:'warn',server:{host:'127.0.0.1',port:4455,strictPort:true}});
if(server) await server.listen();
const url=urlArg?urlArg.slice(6):'http://127.0.0.1:4455';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errori=[];
const fotoDir=path.join(ROOT,'docs/immagini');
if(FOTO) fs.mkdirSync(fotoDir,{recursive:true});
const inVista=(page,sel,sb=0)=>page.locator(sel).evaluateAll((elements,bottom)=>elements.every(e=>{
  const r=e.getBoundingClientRect();return r.x>=-1&&r.right<=innerWidth+1&&r.y>=-1&&r.bottom<=innerHeight-bottom+1;
}),sb);
const pronta=page=>page.waitForFunction(()=>window.__pallanuoto,null,{polling:100,timeout:120000});
async function apri(viewport,touch=true){
  const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1});
  await context.addInitScript(()=>{
    performance.now=()=>0;window.requestAnimationFrame=cb=>{window.__raf=cb;return 1;};
  });
  const page=await context.newPage();page.on('pageerror',e=>errori.push(e.message));
  await page.goto(url);await pronta(page);
  // Le schermate provate hanno un fondo opaco. Il canvas coperto non serve alle foto DOM;
  // nasconderlo evita di aspettare il compositore WebGL dopo ogni rotazione simulata.
  await page.addStyleTag({content:'canvas{display:none!important} *{animation:none!important;transition:none!important}'});
  return page;
}
try{
  const touchPage=await apri({width:393,height:852});
  for(const [width,height] of [[393,852],[852,393],[667,320],[667,300]]){
    const page=touchPage;await page.setViewportSize({width,height});
    assert.match(await page.locator('#vHome .home-titolo').textContent(),/CONQUISTA\s+LA COPPA/,'home: obiettivo sportivo chiaro');
    assert.match(await page.locator('#vHome [data-competizione="mondiali"] small').textContent(),/24 nazionali/,'home: nazionali disponibili ai Mondiali');
    for(const [sl,sr,st,sb] of height>width?[[0,0,0,0],[0,0,59,34]]:[[0,0,0,0],[44,44,0,21],[59,0,0,21]]){
      await page.evaluate(values=>{
        for(const [name,value] of Object.entries(values)) document.documentElement.style.setProperty(name,value+'px');
      },{'--sl':sl,'--sr':sr,'--st':st,'--sb':sb});
      assert.ok(await inVista(page,'#vHome .modalita-home button',sb),`${width}×${height} safe ${sl}/${sr}/${st}/${sb}: tre scelte visibili`);
      assert.ok(await inVista(page,'#vHome .h-versione',sb),`${width}×${height}: versione visibile sopra il margine sicuro`);
      assert.ok(await page.locator('#vHome .h-azioni').evaluate(e=>{const r=e.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth;}),`${width}×${height}: scelte e testo contenuti in larghezza`);
      if(height>width){
        const image=await page.locator('#vHome .eroe img').evaluate(e=>{
          const r=e.getBoundingClientRect(),scale=Math.min(r.width/e.naturalWidth,r.height/e.naturalHeight);
          const paintedWidth=e.naturalWidth*scale;
          return {centro:r.x+r.width/2,sinistra:r.x+(r.width-paintedWidth)/2,destra:r.x+(r.width+paintedWidth)/2};
        });
        assert.ok(Math.abs(image.centro-width/2)<1&&image.sinistra>=0&&image.destra<=width,'portrait: immagine centrata e nessun taglio laterale di volto, braccio o pallone');
      }
      console.log(`PASS home ${width}×${height} · margini ${sl}/${sr}/${st}/${sb}`);
      if(FOTO&&sl===0&&sr===0&&st===0&&sb===0&&height>320) await page.screenshot({path:path.join(fotoDir,`v044-home-${width}x${height}.png`),timeout:120000});
    }
  }
  await touchPage.locator('#vHome [data-va="comandi"]').click();
  assert.ok(await touchPage.locator('#vComandi .solo-tastiera').first().isHidden(),'touch: le istruzioni desktop sono nascoste');
  assert.ok(await touchPage.locator('#vComandi .solo-touch').first().isVisible(),'touch: istruzioni a schermo visibili');
  assert.match(await touchPage.locator('#vComandi').textContent(),/Tocca TIRO e rilascia subito per un tiro rapido di polso\. Tieni premuto per preparare il tiro e fintare, poi rilascia per tirare\./,'istruzione touch: tocco e rilascio per il polso, pressione lunga per preparare e fintare');
  await touchPage.context().close();
  const page=await apri({width:852,height:393},false);
  await page.locator('#vHome [data-va="comandi"]').click();
  assert.match(await page.locator('#vComandi .solo-tastiera').allTextContents().then(x=>x.join(' ')),/Spazio.*rilascia.*D.*Q Arco · W Entrata · E Incrocio · 4/s,'tastiera: tiro, passaggio e schemi aggiornati');
  assert.ok(await page.locator('#vComandi .solo-touch').first().isHidden(),'desktop: le istruzioni touch sono nascoste');
  await page.locator('#vComandi [data-indietro]').click();
  await page.locator('#vHome .m-cta').click();await page.locator('#btStrategieSquadre').click();
  await page.locator('#schemaDifesa').selectOption('1');
  assert.match(await page.locator('#schemaDifesaNota').textContent(),/lascia più spazio al tiro da fuori/,'editor: mostra il costo della zona selezionata');
  await page.locator('#schemaEntrata').selectOption('4');
  assert.match(await page.locator('#schemaCompiti').textContent(),/uno alla volta/,'editor: una sola entrata con copertura');
  await page.locator('#schemaIndietro').click();await page.locator('#vSquadre .m-cta').click();await page.locator('#goBtn').click();
  await page.evaluate(()=>window.__pallanuoto.pausa());
  await page.locator('#vPausa [data-va="tattiche"]').click();
  assert.equal(await page.locator('#tattichePausa .tp-carta').count(),9,'pausa: nove carte conservate');
  assert.equal(await page.locator('#tattichePausa .tp-carta svg').count(),9,'pausa: nove diagrammi conservati');
  assert.match(await page.locator('#tattichePausa').textContent(),/un solo compagno autorizzato/,'pausa: un solo aiuto difensivo');
  assert.ok(await inVista(page,'#riprendiTattiche'),'pausa: Riprendi sempre visibile');
  if(FOTO) await page.screenshot({path:path.join(fotoDir,'v044-pausa-tattiche-852x393.png'),timeout:120000});
  await page.context().close();assert.deepEqual(errori,[],'nessun errore JavaScript');
  console.log('PASS UI v0.44: home, margini sicuri, comandi touch/tastiera, compiti e nove lavagne.');
}finally{
  await browser.close();if(server) await server.close();
}
