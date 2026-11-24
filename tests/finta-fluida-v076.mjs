// Controller reale → RAF della partita → updateRig → ossa del modello esistente.
// --root=checkout oppure --dist=build, --misure=file.json, --foto=directory; --solo-foto evita di ripetere le misure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createServer} from 'vite';

const arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const soloFoto=process.argv.includes('--solo-foto');
if(soloFoto&&!arg('foto'))throw new Error('--solo-foto richiede --foto=directory');
const checkout=path.resolve(arg('root')||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const root=arg('dist')?path.resolve(arg('dist')):checkout;
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false,watch:null}});
await server.listen();
const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
const browser=await chromium.launch({executablePath,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errori=[],violazioni=[],scene=[],rilasciPrecoci=[];
try{
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  page.on('pageerror',e=>errori.push(e.message));
  await page.addInitScript(()=>{
    let ora=0;
    performance.now=()=>ora;
    window.requestAnimationFrame=cb=>{window.__raf=cb;return 1;};
    window.__pad={buttons:Array.from({length:17},()=>({pressed:false,value:0})),axes:[0,0]};
    Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad]});
    window.__avanza=n=>{
      const H=window.__pallanuoto,draw=H.renderer.render;H.renderer.render=()=>{};
      try{for(let i=0;i<n;i++){
        const prima=H.ball.revisioneTiro||0,portatore=H.ball.holder;
        ora+=1000/60;window.__raf(ora);
        if((H.ball.revisioneTiro||0)!==prima&&portatore&&H.ball.shooter===portatore&&H.ball.holder!==portatore){
          window.__finta?.lanci.push({uid:portatore.uid,kind:H.ball.kind,potenza:H.ball.shotPower,tempo:H.game.time,
            velocita:Math.hypot(H.ball.vx,H.ball.vy,H.ball.vz),libera:H.ball.holder===null});
        }
      }}finally{H.renderer.render=draw;}
    };
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto&&window.__raf,null,{timeout:60000,polling:100});
  await page.evaluate(()=>{
    const H=window.__pallanuoto;
    let scena=0;
    const angolo=(a,b)=>2*Math.acos(Math.min(1,Math.abs(a.reduce((s,x,i)=>s+x*b[i],0))));
    const distanza=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
    window.__finta={lanci:[],prepara(stile,mano,dir){
      window.dispatchEvent(new Event('blur'));H.replay.interrompiReplay();
      window.__pad.buttons.forEach(b=>{b.pressed=false;b.value=0;});window.__pad.axes=[0,0];
      document.activeElement?.blur();document.querySelector('#menu').style.display='none';
      const time=100+ ++scena*20;
      // v0.85: a ogni finta il disegno sceglie una forma (larga o stretta, braccio dritto o piegato: grafica/pose.js FINTA_FORMA).
      // Avvio e cicli caricati si confrontano a parità di forma: ogni scena ne usa una, a rotazione, e ogni stile le prova tutte e quattro.
      window.__formaFinta=[{largo:.9,piegato:false},{largo:.1,piegato:true},{largo:.1,piegato:false},{largo:.9,piegato:true}][scena%4];
      Object.assign(H.game,{state:'play',autoplay:false,time,clock:180,shot:28,period:1,after:null,
        fermoFallo:null,penalty:null,rigoriFinali:null,possTeam:H.teams[0],possT:time,passaggi:0,cambiLiberi:false});
      H.fight.active=false;
      for(const t of H.teams){t.human=t.idx===0;t.dir=t.idx===0?dir:-dir;t.atkPlay=0;t.coda=[];t.cambio=null;}
      for(const q of H.allPlayers)Object.assign(q,{x:(-9+q.i*.1)*dir,z:q.team.idx?8:-8,vx:0,vz:0,
        fx:q.team.dir,fz:0,act:null,cut:null,girata:null,charging:false,chargeT:0,oriz:0,orizPrec:0,
        phase:0,J:null,palmi:null,spina:null,giuntiVista:null,bracciaVista:null,ballW:null,ballVistaW:null,
        excluded:false,uscendo:false,stamina:1,pressatoUntil:0,stunUntil:time+100,tackleCD:100,colpi:[],
        contactT:0,turnedUntil:0,freeThrow:false,fakeCount:0,ultimoLatoFinta:0,fintaLatoGesto:0,
        fintaLato:null,voloPronto:false,voloTocco:-9,qte:null,qteDopo:time+100,
        ricevutoPassaggio:false,shootNext:false});
      const p=H.teams[0].players[4];
      Object.assign(p,{x:4*dir,z:0,fx:dir,fz:0,stunUntil:0,mano,scheda:{...p.scheda,finta:stile}});
      H.teams[1].players[0].x=11.8*dir;H.teams[1].players[0].z=0;
      H.regole.giveBall(p);H.__setCtrl(p);
      Object.assign(H.ball,{kind:null,shooter:null,afterShot:false,inRete:false,vx:0,vy:0,vz:0});
      window.__avanza(30);this.lanci=[];return p;
    },campiona(p){
      const R=p.mesh,C=R.corpo,O=C.ossa,s=p.mano==='S'?'S':'D';
      R.g.updateWorldMatrix(true,true);
      const Q=O.bacino.quaternion.constructor,V=O.bacino.position.constructor;
      const rig=R.g.getWorldQuaternion(new Q()).invert();
      const bones={anca:O.bacino,torso:C.schiena.at(-1),braccio:O['brac'+s],avambraccio:O['avam'+s],mano:O['mano'+s]};
      const rot={};
      for(const [n,o] of Object.entries(bones))rot[n]=o.getWorldQuaternion(new Q()).premultiply(rig).normalize().toArray();
      const v=O['mano'+s].getWorldPosition(new V());R.g.worldToLocal(v);
      const dita=C.mani?.find(m=>m.lato===s)?.dita.flatMap(d=>d.ossa.map(o=>o.quaternion.toArray()))||[];
      return {rot,mano:v.toArray(),dita,heading:Math.atan2(p.fz,p.fx),carica:p.chargeT};
    },ciclo(campioni){
      const maxPasso={anca:0,torso:0,braccio:0,avambraccio:0,mano:0},percorso={anca:0,torso:0};
      let passoMano=0,escursioneMano=0,escursioneBraccio=0,ditaMaxDelta=0,ditaMaxPasso=0;
      const primo=campioni[0],ultimo=campioni.at(-1);
      for(let i=0;i<campioni.length;i++){
        const a=campioni[i];
        escursioneMano=Math.max(escursioneMano,distanza(a.mano,primo.mano));
        escursioneBraccio=Math.max(escursioneBraccio,angolo(a.rot.braccio,primo.rot.braccio));
        for(let d=0;d<a.dita.length;d++){
          ditaMaxDelta=Math.max(ditaMaxDelta,angolo(a.dita[d],primo.dita[d]));
          if(i)ditaMaxPasso=Math.max(ditaMaxPasso,angolo(a.dita[d],campioni[i-1].dita[d]));
        }
        if(!i)continue;
        for(const n of Object.keys(maxPasso)){
          const d=angolo(a.rot[n],campioni[i-1].rot[n]);maxPasso[n]=Math.max(maxPasso[n],d);
          if(n in percorso)percorso[n]+=d;
        }
        passoMano=Math.max(passoMano,distanza(a.mano,campioni[i-1].mano));
      }
      return {frames:campioni.length,maxPasso,percorso,passoMano,escursioneMano,escursioneBraccio,
        falangi:primo.dita.length,ditaMaxDelta,ditaMaxPasso,
        derivaAnca:angolo(primo.rot.anca,ultimo.rot.anca),derivaTorso:angolo(primo.rot.torso,ultimo.rot.torso)};
    },esegui(stile,mano,dir,fase){
      const p=this.prepara(stile,mano,dir),inizio=H.game.time,cicli=[];
      const iniziale=this.campiona(p),campioniAvvio=[iniziale],profiloAvvio=[{t:0,carica:p.chargeT,gesto:null,
        maxPasso:{anca:0,torso:0,braccio:0,avambraccio:0,mano:0},passoMano:0}];
      window.__pad.buttons[2]={pressed:true,value:1};
      let corrente=null,campioni=[],coda=0,carica09=null,maxCarica=0,prima=iniziale,frames=0;
      // L'avvio parte dalla posa realmente visibile prima della pressione.
      // I due cicli dopo piena carica restano misurati separatamente.
      for(;frames<420&&cicli.length<2;frames++){
        window.__avanza(1);const a=p.act,campione=this.campiona(p);
        const t=H.game.time-inizio;
        if(t<=1.2+1e-6){
          campioniAvvio.push(campione);
          profiloAvvio.push({t,carica:p.chargeT,gesto:a?.kind||'carica',attoT:a?.t??null,done:a?.done||false,
            maxPasso:Object.fromEntries(Object.keys(campione.rot).map(n=>[n,angolo(campione.rot[n],prima.rot[n])])),
            passoMano:distanza(campione.mano,prima.mano)});
        }
        maxCarica=Math.max(maxCarica,p.chargeT);
        if(carica09===null&&H.game.time-inizio>=.9+1e-6)carica09=p.chargeT;
        if(corrente){
          campioni.push(campione);
          if(a!==corrente)coda++;
          // Comprende anche il raccordo dopo la scadenza dell'atto: qui il
          // precedente disegno riaccendeva la clip e cambiava ancora posa.
          if(coda>=8||(a?.kind==='fake'&&a!==corrente)){
            cicli.push(this.ciclo(campioni));corrente=null;campioni=[];
          }
        }
        if(!corrente&&a?.kind==='fake'&&a.t<.04&&p.chargeT>=.9-1e-6){
          corrente=a;coda=0;campioni=[prima,campione];
        }
        prima=campione;
      }
      const tenuta={finte:p.fakeCount,carica:p.chargeT,tiene:H.ball.holder===p,lanci:this.lanci.length};
      let trovata=false;
      for(let i=0;i<180;i++){
        const a=p.act;
        if(a?.kind==='fake'&&(fase==='frusta'
          ? !a.done&&a.t>=a.wind+a.frusta*.35&&a.t<a.wind+a.frusta*.85
          : a.done&&a.t>=a.wind+a.frusta+.10)) {trovata=true;break;}
        window.__avanza(1);
      }
      const da=p.act?{kind:p.act.kind,done:p.act.done,t:p.act.t,wind:p.act.wind,frusta:p.act.frusta}:null;
      window.__pad.buttons[2]={pressed:false,value:0};window.__avanza(1);
      const rilascio={gesto:p.act?.kind,potenza:p.act?.potenza};
      window.__avanza(32);
      const avvio={...this.ciclo(campioniAvvio),durata:profiloAvvio.at(-1).t,profilo:profiloAvvio};
      return {stile,mano,dir,fase,frames,carica09,maxCarica,avvio,cicli,tenuta,trovata,da,rilascio,
        lanci:this.lanci.filter(x=>x.uid===p.uid)};
    },rilasciaPresto(mano,dir){
      const p=this.prepara('larga',mano,dir),inizio=H.game.time;
      window.__pad.buttons[2]={pressed:true,value:1};window.__avanza(24);
      const tenuta=H.game.time-inizio,carica=p.chargeT,rilasciato=H.game.time;
      window.__pad.buttons[2]={pressed:false,value:0};window.__avanza(1);
      const a=p.act,rilascio={gesto:a?.kind,potenza:a?.potenza,wind:a?.wind,frusta:a?.frusta,t:a?.t};
      window.__avanza(32);
      return {mano,dir,tenuta,carica,rilasciato,rilascio,lanci:this.lanci.filter(x=>x.uid===p.uid)};
    }};
  });
  const verifica=(ok,messaggio)=>{if(!ok)violazioni.push(messaggio);};
  for(const stile of soloFoto?[]:['larga','raffica','polso','mezza','bomba','spalla'])for(const mano of ['D','S'])for(const dir of [1,-1]){
    const m=await page.evaluate(({stile,mano,dir})=>window.__finta.esegui(stile,mano,dir,mano==='D'?'frusta':'recupero'),{stile,mano,dir});
    scene.push(m);const id=[stile,mano,dir].join('/');
    verifica(m.cicli.length===2,id+': due cicli completi dopo la piena carica');
    verifica(Math.abs(m.carica09-.9)<1e-6&&Math.abs(m.maxCarica-.9)<1e-6,id+': carica massima a .9s');
    verifica(m.tenuta.tiene&&m.tenuta.lanci===0&&m.tenuta.finte>=2,id+': tenuta ripetuta senza lancio');
    verifica(m.avvio.frames===73&&Math.abs(m.avvio.durata-1.2)<1e-6,id+': avvio completo dalla pressione a 1.2s');
    verifica(m.avvio.maxPasso.anca<.12&&m.avvio.maxPasso.torso<.12,id+': continuità anca/torso fin dalla prima pressione');
    verifica(m.avvio.passoMano<.16,id+': mano senza scatto durante avvio');
    m.avvio.limitiBraccio={};m.avvio.rapportiBraccio={};
    for(const n of ['braccio','avambraccio','mano']){
      const steady=Math.max(...m.cicli.map(c=>c.maxPasso[n]));
      const limite=Math.max(.15,1.5*steady);
      m.avvio.limitiBraccio[n]=limite;m.avvio.rapportiBraccio[n]=steady>0?m.avvio.maxPasso[n]/steady:null;
      verifica(m.avvio.maxPasso[n]<=limite,id+': picco '+n+' avvio entro max(.15rad, 1.5×picco cicli caricati)');
    }
    for(const [i,c] of m.cicli.entries()){
      const nome=id+' ciclo '+(i+1);
      verifica(c.escursioneMano>.035&&c.escursioneBraccio>.06,nome+': movimento reale del braccio dominante');
      // In verticale un accenno non deve ruotare il bacino di un quarto di
      // giro in un frame, né aggiungere un giro completo durante un ciclo.
      verifica(c.maxPasso.anca<.25&&c.maxPasso.torso<.30,nome+': continuità torso/anca');
      verifica(c.percorso.anca<1.5&&c.percorso.torso<3.5,nome+': niente avvitamento');
      verifica(c.derivaAnca<.30&&c.derivaTorso<.40,nome+': ritorno continuo alla carica');
      verifica(c.passoMano<.16,nome+': mano senza scatto');
      verifica(Math.max(c.maxPasso.braccio,c.maxPasso.avambraccio,c.maxPasso.mano)<.9,nome+': braccio senza salto angolare');
      verifica(c.falangi===15&&c.ditaMaxDelta<.55&&c.ditaMaxPasso<.35,nome+': dita coerenti con la presa, senza inversione');
    }
    verifica(m.trovata,id+': rilascio durante '+m.fase);
    verifica(['shot','torsione'].includes(m.rilascio.gesto)&&m.rilascio.potenza===1,id+': il rilascio avvia subito il tiro carico');
    verifica(m.lanci.length===1&&m.lanci[0].kind==='shot'&&m.lanci[0].libera&&m.lanci[0].potenza===1&&m.lanci[0].velocita>10,id+': un tiro reale senza residui');
  }
  if(!soloFoto)for(const mano of ['D','S'])for(const dir of [1,-1]){
    const m=await page.evaluate(({mano,dir})=>window.__finta.rilasciaPresto(mano,dir),{mano,dir});
    rilasciPrecoci.push(m);const id='rilascio precoce/'+mano+'/'+dir,potenza=.4/.9;
    verifica(Math.abs(m.tenuta-.4)<1e-6&&Math.abs(m.carica-.4)<1e-6,id+': pressione mantenuta .4s');
    verifica(['shot','torsione'].includes(m.rilascio.gesto)&&m.rilascio.wind===0&&Math.abs(m.rilascio.potenza-potenza)<1e-6,
      id+': rilascio avvia subito il tiro con potenza .4/.9');
    verifica(m.lanci.length===1&&m.lanci[0].kind==='shot'&&m.lanci[0].libera&&Math.abs(m.lanci[0].potenza-potenza)<1e-6,
      id+': un tiro reale alla potenza prevista');
    verifica(m.lanci.length===1&&m.lanci[0].tempo-m.rilasciato<=m.rilascio.frusta+1/30+1e-6,
      id+': lancio entro la frusta, senza attendere il completamento ingresso');
  }
  verifica(errori.length===0,'errori browser: '+errori.join('; '));
  const massimi={};
  for(const m of scene)for(const c of m.cicli)for(const [k,v] of Object.entries({anca:c.maxPasso.anca,torso:c.maxPasso.torso,
    passoMano:c.passoMano,percorsoAnca:c.percorso.anca,percorsoTorso:c.percorso.torso,derivaAnca:c.derivaAnca,derivaTorso:c.derivaTorso,
    ditaMaxDelta:c.ditaMaxDelta,ditaMaxPasso:c.ditaMaxPasso}))massimi[k]=Math.max(massimi[k]||0,v);
  const massimiAvvio={};
  for(const m of scene)for(const [k,v] of Object.entries({anca:m.avvio.maxPasso.anca,torso:m.avvio.maxPasso.torso,
    braccio:m.avvio.maxPasso.braccio,avambraccio:m.avvio.maxPasso.avambraccio,mano:m.avvio.maxPasso.mano,
    passoMano:m.avvio.passoMano}))massimiAvvio[k]=Math.max(massimiAvvio[k]||0,v);
  const misure={root,scene,rilasciPrecoci,limiti:{passoAnca:.25,passoTorso:.30,percorsoAnca:1.5,percorsoTorso:3.5,
    derivaAnca:.30,derivaTorso:.40,passoMano:.16,passoBraccio:.9,ditaMaxDelta:.55,ditaMaxPasso:.35,
    avvio:{durata:1.2,passoAnca:.12,passoTorso:.12,passoMano:.16,rapportoBraccio:1.5,minimoLimiteBraccio:.15}},
    massimi,massimiAvvio,violazioni,errori};
  if(arg('misure')){const dest=path.resolve(arg('misure'));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(misure,null,2)+'\n');}
  if(arg('foto')){
    const dir=path.resolve(arg('foto'));fs.mkdirSync(dir,{recursive:true});
    const pose=await page.evaluate(()=>{
      const H=window.__pallanuoto,p=window.__finta.prepara('larga','D',1);
      const camera={pos:[p.x+3.8,2.2,p.z+3.2],look:[p.x,.5,p.z],fov:35};H.vista=camera;
      // La camera viene applicata dal RAF: prepararla prima del campione t=0.
      window.__avanza(1);
      const inizio=H.game.time,tempi=[0,.10,.20,.35,.5,.7,.9,1.15],pose=[];
      window.__pad.buttons[2]={pressed:true,value:1};
      for(const t of tempi){
        while(H.game.time-inizio<t-1e-6)window.__avanza(1);
        H.__ridisegna();pose.push({tRichiesto:t,t:H.game.time-inizio,primaDellaPressione:t===0,carica:p.chargeT,
          gesto:p.act?.kind||(p.charging?'carica':null),done:p.act?.done||false,camera,
          png:H.renderer.domElement.toDataURL('image/png')});
      }
      H.vista=null;return pose;
    });
    for(const [i,p] of pose.entries()){
      fs.writeFileSync(path.join(dir,'finta-'+String(i+1).padStart(2,'0')+'.png'),Buffer.from(p.png.split(',')[1],'base64'));delete p.png;
    }
    fs.writeFileSync(path.join(dir,'pose.json'),JSON.stringify(pose,null,2)+'\n');
  }
  console.log('Finta v0.76: '+JSON.stringify({scene:scene.length,rilasciPrecoci:rilasciPrecoci.length,massimi,massimiAvvio,violazioni:violazioni.length}));
  assert.equal(violazioni.length,0,'finte complete, continuità e rilascio: '+JSON.stringify(violazioni.slice(0,8))+
    (violazioni.length>8?' (elenco completo nel file --misure)':''));
}finally{await browser.close();await server.close();}
