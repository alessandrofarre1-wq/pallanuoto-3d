// Un cambio volante vero nella partita: soltanto la situazione iniziale è preparata.
// 120 campioni, uno ogni 12 passi a 60 Hz: 24 s di gioco, 8 s di video a 15 fps (accelerato 3×).
// Esempio: node strumenti/video-cambio-v068.mjs --dist=dist --out=/tmp/v068-video-cambio
// Poi: ffmpeg -framerate 15 -i /tmp/v068-video-cambio/%04d.jpg -c:v libx264 -pix_fmt yuv420p /tmp/v068-video-cambio.mp4
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';

const arg=(n,d)=>process.argv.find(s=>s.startsWith('--'+n+'='))?.slice(n.length+3)||d;
const out=arg('out','/tmp/v068-video-cambio'),dist=arg('dist','dist');
fs.mkdirSync(out,{recursive:true});
const server=await preview({logLevel:'warn',build:{outDir:dist},preview:{host:'127.0.0.1',port:0}});
let browser;
try{
  browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{
    // La scena mostra il nuoto e le marcature: il caso bloccato evita che un fischio casuale interrompa il cambio.
    // Le probabilità del gioco non sono cambiate; questa non è una misura statistica di una partita libera.
    window.__rnd=()=>.5;
    window.__now=0;performance.now=()=>window.__now;
    window.requestAnimationFrame=f=>{window.__raf=f;return 1;};
    window.__passoCambio=()=>{window.__now+=1000/60;window.__raf(window.__now);};
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:60000});
  const meta=await page.evaluate(()=>{
    const H=window.__pallanuoto;H.scegliSquadre('ITA','HUN');H.imposta('len','480');document.getElementById('goBtn').click();
    H.replay.interrompiReplay();H.vista=null;H.senzaCorpi=false;
    Object.assign(H.game,{state:'paused',time:100,clock:180,shot:28,autoplay:false,cambiLiberi:false,penalty:null,after:null,timer:0});
    const att=H.teams[1],dif=H.teams[0],dir=-1,gx=-12.5,mark=[0,6,3,2,5,4,1];
    att.dir=dir;dif.dir=-dir;
    for(const t of H.teams){
      H.prova.applicaSchema(t,H.prova.copiaSchema('arco'));
      Object.assign(t,{human:t===att,defPlay:2,prossimoControllo:Infinity,cambio:null,coda:[],timeouts:0,aiutoStato:null,
        accoppiamenti:null,adattamentoEntrata:null,occupantiAttacco:null,entrataAzione:null,scambio:null,doubleP:null});
    }
    const form=[null,[2.6,0],[1.7,6.2],[1.7,-6.2],[5.8,4.6],[5.8,-4.6],[7.5,0]];
    for(const p of H.allPlayers)Object.assign(p,{excluded:false,uscendo:false,cut:null,girata:null,act:null,charging:false,chargeT:0,stamina:1,
      vx:0,vz:0,fx:p.team.dir,fz:0,oriz:0,phase:p.i*.6,J:null,palmi:null,spina:null,orizPrec:0,freeThrow:false,pressatoUntil:0,
      stunUntil:0,tackleCD:0,colpi:[],contactT:0,lunge:0,turnedUntil:0,perno:false,scivolaAI:false,areaT:0});
    for(const p of att.players){p.x=p.isGK?12:gx-dir*form[p.i][0];p.z=p.isGK?0:form[p.i][1]*dir;}
    for(const p of dif.players){
      const a=att.players[mark[p.i]];p.x=p.isGK?-12:a.x+dir*.8;p.z=p.isGK?0:a.z;p.lagX=a.x;p.lagZ=a.z;
    }
    for(const p of att.players){const a=dif.players[mark[p.i]];p.lagX=a.x;p.lagZ=a.z;}
    const portatore=att.players[4],uscente=att.players[5];
    // Il portatore è comandato e non riceve input di tiro/passaggio: gli altri nuotano secondo il ciclo normale.
    H.regole.giveBall(portatore);H.__setCtrl(portatore);H.ball.x=portatore.x;H.ball.z=portatore.z;
    H.game.shot=28;uscente.stamina=.4;
    const marcatore=dif.players.find(p=>!p.isGK&&H.v046.uomoDi(p)===uscente),riserva=H.panchina.suggerimento(uscente);
    if(!marcatore||!riserva)throw new Error('Fixture non valida: mancano il marcatore o la riserva dell’esterno HUN');
    const draw=H.renderer.render.bind(H.renderer);H.renderer.render=()=>{};
    // Assesta soltanto la camera televisiva e gli scheletri, a partita ancora ferma.
    for(let n=0;n<120;n++)window.__passoCambio();
    const canvas=document.createElement('canvas');canvas.width=844;canvas.height=390;
    const iniziale={num:uscente.num,nome:uscente.name,uid:uscente.uid,i:uscente.i,scheda:uscente.scheda};
    window.__videoCambio={H,att,dif,uscente,marcatore,portatore,draw,canvas,iniziale,inizio:H.game.time,fasi:new Set(),
      eventi:[],scambiato:false,minaccia:false,finito:false,maxProfonditaDifensore:0,maxPassoDifensore:0,secondiOltreMeta:0,
      statoNonPlay:[],senzaPalmi:0,sceltaCambiate:0,ultimoDif:{x:marcatore.x,z:marcatore.z}};
    const prima={squadra:'HUN',numero:uscente.num,nome:uscente.name,uid:uscente.uid,i:uscente.i,x:uscente.x,z:uscente.z};
    if(!H.panchina.chiediCambio(att,uscente,riserva,true))throw new Error('La richiesta di cambio reale è stata rifiutata');
    H.game.state='play';
    return {scena:'Cambio volante HUN contro pressing ITA',squadraAttacco:'HUN',squadraDifesa:'ITA',direzioneAttacco:dir,
      inizio:H.game.time,uscente:prima,entrante:{numero:riserva.num,nome:riserva.nome},
      difensore:{numero:marcatore.num,nome:marcatore.name,uid:marcatore.uid,i:marcatore.i},
      portatore:{numero:portatore.num,nome:portatore.name,comandato:true,input:'nessuno'},
      fixture:{caso:'window.__rnd = () => 0.5',coordinate:'preparate solo prima della richiesta; nessuna riscrittura durante il cambio',
        gioco:'ciclo partita completo, regole e collisioni attive',difesa:'pressing selezionato',camera:'televisiva del gioco, senza override',
        render:'scheletri e palmi a ogni passo; GPU solo sul campione',limiti:'scena preparata senza tiri del portatore; non è una partita libera né una misura FPS iPhone'},
      acquisizione:{larghezza:844,altezza:390,passoHz:60,passiPerCampione:12,fotogrammi:120,secondiGioco:24,fpsVideo:15,secondiVideo:8,accelerazione:3}};
  });
  const campioni=[];
  for(let f=0;f<120;f++){
    const result=await page.evaluate(f=>{
      const v=window.__videoCambio,{H,att,dif,uscente:p,marcatore:d,draw,canvas,iniziale}=v;
      for(let n=0;n<12;n++){
        H.renderer.render=n===11?draw:()=>{};
        window.__passoCambio();
        const fase=att.cambio?.fase||(!v.scambiato?'richiesto':'completato');
        if(!v.fasi.has(fase)){v.fasi.add(fase);v.eventi.push({evento:fase,tempo:H.game.time-v.inizio});}
        if(p.scheda!==iniziale.scheda&&!v.scambiato){v.scambiato=true;v.eventi.push({evento:'identità cambiata',tempo:H.game.time-v.inizio,numero:p.num,uid:p.uid,i:p.i});}
        const profonditaAttacco=(att.dir*12.5-p.x)*att.dir;
        if(v.scambiato&&!p.uscendo&&profonditaAttacco<=10.5&&!v.minaccia){v.minaccia=true;v.eventi.push({evento:'entrante in attacco',tempo:H.game.time-v.inizio,profonditaAttacco});}
        if(v.scambiato&&!att.cambio&&!v.finito){v.finito=true;v.eventi.push({evento:'cambio concluso',tempo:H.game.time-v.inizio});}
        if(p.uscendo||v.scambiato&&profonditaAttacco>10.5){
          const profondita=(d.x+dif.dir*12.5)*dif.dir;
          v.maxProfonditaDifensore=Math.max(v.maxProfonditaDifensore,profondita);
          if(profondita>12.5)v.secondiOltreMeta+=1/60;
        }
        v.maxPassoDifensore=Math.max(v.maxPassoDifensore,Math.hypot(d.x-v.ultimoDif.x,d.z-v.ultimoDif.z));v.ultimoDif={x:d.x,z:d.z};
        if(H.game.state!=='play'&&!v.statoNonPlay.includes(H.game.state))v.statoNonPlay.push(H.game.state);
        if(!d.palmi||!p.palmi||!v.portatore.palmi)v.senzaPalmi++;
        if(dif.defPlay!==2||H.ctrl!==v.portatore)v.sceltaCambiate++;
      }
      H.renderer.render=()=>{};
      const ctx=canvas.getContext('2d');ctx.drawImage(H.renderer.domElement,0,0,844,390);
      const tempo=H.game.time-v.inizio,fase=p.uscendo?'uscita':v.minaccia?'rientrato in attacco':v.scambiato?'rientro del sostituto':'richiesta';
      ctx.fillStyle='rgba(3,19,31,.87)';ctx.fillRect(10,9,710,49);ctx.fillStyle='#fff';ctx.font='bold 15px sans-serif';
      ctx.fillText(`Cambio HUN #${iniziale.num} → #${p.scheda!==iniziale.scheda?p.num:att.cambio?.entra.num??'…'} · ${fase} · +${tempo.toFixed(1)} s`,20,29);
      ctx.font='12px sans-serif';ctx.fillText(`ITA #${d.num} in pressing · portatore HUN comandato senza tiri · accelerato 3×`,20,47);
      function etichetta(q,testo,colore,dy){
        const point=H.camera.position.clone().set(q.x,.45,q.z).project(H.camera);
        const sx=(point.x+1)*422,sy=(1-point.y)*195,x=Math.max(17,Math.min(827,sx)),y=Math.max(79,Math.min(352,sy));
        const fuori=sx<17||sx>827||sy<79||sy>352||point.z>1;
        ctx.strokeStyle=colore;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,fuori?6:10,0,Math.PI*2);ctx.stroke();
        const label=(fuori?(sx>x?'→ ':sx<x?'← ':'↕ '):'')+testo;
        ctx.font='bold 12px sans-serif';const larghezza=ctx.measureText(label).width+12,lx=Math.max(10,Math.min(834-larghezza,x-larghezza/2)),ly=Math.max(64,Math.min(365,y+dy));
        ctx.fillStyle='rgba(3,19,31,.88)';ctx.fillRect(lx,ly,larghezza,20);ctx.fillStyle=colore;ctx.fillText(label,lx+6,ly+14);
        return {x:sx,y:sy,fuoriInquadratura:fuori};
      }
      const schermoDifensore=etichetta(d,`ITA #${d.num} difensore`,'#72e3ff',-32);
      const schermoCambio=etichetta(p,`HUN #${p.num} ${p.uscendo?'esce':v.scambiato?'entra':'esterno'}`,'#ffd376',14);
      return {image:canvas.toDataURL('image/jpeg',.9).split(',')[1],dati:{fotogramma:f,tempo:+tempo.toFixed(4),fase,stato:H.game.state,
        fasePanchina:att.cambio?.fase||null,uscenteEntrante:{numero:p.num,uid:p.uid,i:p.i,uscendo:!!p.uscendo,x:p.x,z:p.z,profonditaAttacco:(att.dir*12.5-p.x)*att.dir},
        difensore:{numero:d.num,x:d.x,z:d.z,uomo:H.v046.uomoDi(d)?.num},schermoDifensore,schermoCambio,
        camera:{pos:H.camera.position.toArray(),rot:H.camera.quaternion.toArray()},render:{calls:H.renderer.info.render.calls,triangoli:H.renderer.info.render.triangles}}};
    },f);
    fs.writeFileSync(path.join(out,String(f).padStart(4,'0')+'.jpg'),Buffer.from(result.image,'base64'));
    campioni.push(result.dati);
  }
  const esito=await page.evaluate(()=>{
    const v=window.__videoCambio,{H,uscente:p,marcatore:d,iniziale}=v;
    return {identitaCambiata:v.scambiato,stessoOggetto:v.att.players[iniziale.i]===p,stessoUid:p.uid===iniziale.uid,stessoIndice:p.i===iniziale.i,
      entranteMinacciaInAttacco:v.minaccia,cambioConcluso:v.finito,fasi:[...v.fasi],eventi:v.eventi,statiNonPlay:v.statoNonPlay,
      passiSenzaPalmi:v.senzaPalmi,passiConTatticaOControlloCambiati:v.sceltaCambiate,maxProfonditaDifensore:v.maxProfonditaDifensore,
      secondiOltreMeta:v.secondiOltreMeta,maxPassoDifensore:v.maxPassoDifensore,distanzaFinaleMarcatura:Math.hypot(d.x-p.x,d.z-p.z),
      bersaglioFinaleDaEntrante:Math.hypot(H.prova.markTarget(d).x-p.x,H.prova.markTarget(d).z-p.z),
      durataGioco:H.game.time-v.inizio,entranteFinale:{numero:p.num,x:p.x,z:p.z,uscendo:!!p.uscendo},punteggio:H.teams.map(t=>t.score)};
  });
  const origine={dist:path.resolve(dist),...meta,esito,errori:errors,campioni};
  fs.writeFileSync(path.join(out,'origine.json'),JSON.stringify(origine,null,2)+'\n');
  assert.deepEqual(errors,[],'nessun errore console/WebGL');
  assert.ok(esito.identitaCambiata&&esito.stessoOggetto&&esito.stessoUid&&esito.stessoIndice,'scambio vero della scheda nel medesimo giocatore in campo');
  assert.ok(['esce','cinque','uscita'].every(f=>esito.fasi.includes(f)),'osservate tutte le fasi del cambio volante');
  assert.ok(esito.cambioConcluso&&esito.entranteMinacciaInAttacco&&!esito.entranteFinale.uscendo,'il sostituto è realmente tornato in attacco');
  assert.deepEqual(esito.statiNonPlay,[],'nessun gol o fischio interrompe la scena');
  assert.ok(Math.abs(esito.durataGioco-24)<.05,'24 secondi reali della simulazione');
  assert.equal(esito.passiSenzaPalmi,0,'palmi aggiornati a ogni passo');
  assert.equal(esito.passiConTatticaOControlloCambiati,0,'pressing e controllo del portatore conservati');
  assert.ok(esito.maxProfonditaDifensore<11.5&&esito.secondiOltreMeta===0,'il difensore non insegue il cambio oltre metà campo');
  assert.ok(esito.maxPassoDifensore<.06,'nessun teletrasporto del difensore');
  assert.ok(esito.bersaglioFinaleDaEntrante<1.9,'ripresa la marcatura del sostituto in attacco');
  console.log('PASS 120 JPG, 24 s di gioco, video 8 s accelerato 3×: '+JSON.stringify(esito));
}finally{
  if(browser)await browser.close();
  await new Promise(r=>server.httpServer.close(r));
}
