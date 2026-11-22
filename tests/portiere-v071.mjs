// Portiere attraverso il ciclo RAF reale, compatibile anche con la build v0.70.
// --dist=/percorso/dist --prima --salva=/tmp/prima.json
// --campioni=80 (per distanza/potenza; metà per ciascuna direzione), --foto=/tmp/foto
// doShoot prepara i metadati veri; la traiettoria è poi imposta per isolare il
// contatto del portiere. Queste scene NON misurano il bilanciamento di una gara.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(s=>s.startsWith('--'+k+'='))?.slice(k.length+3);
const dist=arg('dist'),prima=process.argv.includes('--prima'),campioni=+(arg('campioni')??80),foto=arg('foto');
assert.ok(Number.isInteger(campioni)&&campioni>=0&&campioni%2===0,'campioni pari per accoppiare i due versi');
const server=dist?await preview({root,logLevel:'warn',build:{outDir:dist},preview:{host:'127.0.0.1',port:0}}):
  await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false}});
if(!dist)await server.listen();
let browser;
try{
  browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),errori=[];
  page.on('pageerror',e=>errori.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errori.push(m.text());});
  await page.addInitScript(()=>{
    window.__casoGK={modo:'costante',valore:.999,seme:71};
    window.__rnd=()=>{
      const r=window.__casoGK;if(r.modo==='costante')return r.valore;
      r.seme=(Math.imul(r.seme,1664525)+1013904223)>>>0;return(r.seme+.5)/4294967296;
    };
    window.__nowGK=0;performance.now=()=>window.__nowGK;
    window.requestAnimationFrame=cb=>{window.__rafGK=cb;return 1;};
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto&&window.__rafGK,null,{polling:100,timeout:120000});
  const r=await page.evaluate(({campioni,foto,prima})=>{
    const H=window.__pallanuoto,G=H.game,B=H.ball,giocatori=H.allPlayers,HL=12.5,rb=.1106;
    if(!H.prova?.doShoot||!H.palla?.velocitaDiLancio||!H.__setCtrl)throw new Error('API debug richieste non disponibili');
    H.imposta('diff','1');document.getElementById('goBtn').click();H.replay.interrompiReplay();
    H.replay.forzaRegistrazione=false;
    const draw=H.renderer.render.bind(H.renderer);H.renderer.render=()=>{};
    const immagini=[],mirati=[],statistiche=[],muri=[];let scena=0;
    const snap=p=>[p.x,p.y,p.z];
    const frame=dt=>{window.__nowGK+=dt*1000;window.__rafGK(window.__nowGK);};
    const fotoScena=(nome,gk,dir)=>{
      H.camera.position.set(gk.x-dir*4,3.2,4.5);H.camera.lookAt(gk.x,.45,0);H.camera.updateProjectionMatrix();
      H.renderer.render=draw;H.__ridisegna();H.renderer.render=()=>{};
      immagini.push({nome,png:H.renderer.domElement.toDataURL('image/png')});
    };
    function prepara({dir,distanza,y,z,potenza,velocita,fps=60,vicino=false,seme=null,corpi=true}){
      H.replay.interrompiReplay();H.cronaca.svuota();H.fight.active=false;H.senzaCorpi=!corpi;
      Object.assign(G,{state:'paused',time:100+(++scena)*10,possT:100+scena*10,period:1,clock:180,shot:28,
        penalty:null,rigoriFinali:null,rigoreDifferito:null,fermoFallo:null,after:null,timer:0,autoplay:false,scattando:false,cambiLiberi:false});
      H.teams[0].dir=1;H.teams[1].dir=-1;
      const att=H.teams[dir===1?0:1],dif=H.teams[dir===1?1:0],gx=HL*dir,gk=dif.players[0],p=att.players[4],worldZ=z*dir;
      for(const t of H.teams)Object.assign(t,{human:true,score:0,coda:[],cambio:null,prossimoControllo:Infinity,contro:null,
        entrataAzione:null,preparaEntrata:null,rotazioneCentro:null,occupantiAttacco:null,accoppiamenti:null,adattamentoEntrata:null,
        schemaStato:null,copertura:null,entrataDopo:Infinity,chiamataAttacco:null,chiamataPossesso:null,doubleP:null,doubleUntil:0,timeouts:0});
      for(const q of giocatori){
        Object.assign(q,{x:-8*dir+(q.i-3)*1.3*dir,z:(q.team===att?8:-8)*dir,vx:0,vz:0,fx:q.team.dir,fz:0,
          act:null,charging:false,chargeT:0,excluded:false,uscendo:false,alPozzetto:false,puoRientrare:false,pf:0,
          oriz:0,orizPrec:0,phase:0,J:null,Jv:null,giuntiVista:null,bracciaVista:null,palmi:null,spina:null,
          ballW:null,ballVistaW:null,freeThrow:false,stamina:1,pressatoUntil:0,pressatoDa:null,stunUntil:1e9,
          tackleCD:1e9,colpi:[],cut:null,girata:null,lunge:0,contactT:0,perno:false,scivolaAI:false,areaT:0,
          decideT:1e9,reazioneT:1e9,fakeUntil:0,fakedUntil:0,turnedUntil:0,fintaFino:0,fintaLato:null,ultimaFintaT:-1e9,
          ricevutoPassaggio:false,ricevutoCambio:false,ricevutoInEntrata:false,ricevutoT:G.time,tentativoPortiere:null});
        q.s=Object.fromEntries(Object.keys(q.s).map(k=>[k,75]));q.st=Object.fromEntries(Object.keys(q.st).map(k=>[k,.75]));
        if(q.scheda){q.scheda.pf=0;q.scheda.fuori=false;}
        if(q.isGK){q.x=-HL*q.team.dir+q.team.dir*.7;q.z=0;}
        q.lagX=q.x;q.lagZ=q.z;
      }
      const gkx=gx-dir*(vicino?.45:.7),inizioX=vicino?gkx-dir*.3:gx-dir*distanza;
      Object.assign(gk,{x:gkx,z:0,fx:-dir,fz:0,stunUntil:0});
      Object.assign(p,{x:vicino?gx-dir*3:inizioX,z:worldZ,fx:dir,fz:0,mano:'D'});p.s.pre=90;p.s.pot=90;p.st.sht=.9;
      Object.assign(B,{state:'held',holder:p,kind:null,target:null,lastTeam:att,shooter:null,x:p.x,y:y,z:worldZ,
        vx:0,vy:0,vz:0,flightT:0,holdTime:.4,daTiro:false,inRete:false,inUscita:false,afterShot:false,saveChecked:false,
        tentativoPortiere:null,contattoPortiere:null,costoTentativoPortiere:false,parataRegistrata:false,parataDaRegistrare:null,raccordoVista:null,raccordoPresa:null});
      G.possTeam=att;H.__setCtrl(gk);frame(1/fps);G.state='play';
      H.regole.giveBall(p);B.holdTime=.4;
      const random=window.__casoGK;random.modo=seme===null?'costante':'seme';random.valore=.999;random.seme=seme??71;
      H.prova.doShoot(p,potenza,false,worldZ/1.28);H.__setCtrl(gk);
      const tempo=Math.abs(gkx-inizioX)/velocita;
      const L=H.palla.velocitaDiLancio(inizioX,y,worldZ,gkx,y,worldZ,tempo,0);
      Object.assign(B,L,{x:inizioX,y,z:worldZ,flightT:0,crossZ:worldZ,raccordoVista:null});
      return {att,dif,gk,p,dir,gx,inizio:[inizioX,y,worldZ],inizioGK:[gk.x,gk.z],fps,potenza,velocita,distanza};
    }
    function tiro(opts,nome,registra=false,immagine=false){
      const s=prepara(opts),{att,gk,dir,fps}=s,dt=1/fps,traccia=[];let esito=null,movimentoGK=0,fotografato=false,frames=0;
      for(let i=0;i<Math.ceil(1.6/dt)&&!esito;i++){
        frame(dt);frames++;
        movimentoGK=Math.max(movimentoGK,Math.hypot(gk.x-s.inizioGK[0],gk.z-s.inizioGK[1]));
        const hit=B.contattoPortiere,contatto=!!hit||B.kind==='rebound'&&B.toccoPortiere;
        if(B.holder===gk&&B.state==='held')esito='PRESA';
        else if(contatto)esito='RESPINTA';
        else if(att.score>0||B.inRete)esito='GOL';
        else if(G.state!=='play'&&B.state==='dead')esito='FUORI';
        else if(B.state==='free')esito='ACQUA';
        if(registra)traccia.push({frame:i+1,tempo:(i+1)*dt,palla:snap(B),stato:B.state,tipo:B.kind,contatto:hit?{parte:hit.parte,punto:hit.punto.slice(),normale:hit.normale.slice()}:null});
        if(immagine&&!fotografato&&(contatto||Math.abs(B.x-gk.x)<.20||esito)){
          fotoScena(nome,gk,dir);fotografato=true;
        }
      }
      const hit=B.contattoPortiere,t=B.tentativoPortiere;
      return {nome,dir,fps,distanza:opts.distanza,potenza:opts.potenza,velocita:opts.velocita,bersaglio:[opts.y,opts.z],
        esito:esito||'NESSUN_ESITO',frames,movimentoGK,pallaFinale:snap(B),golNelFrame:att.score>0,
        controlloPortiere:H.ctrl===gk,contatto:hit?{parte:hit.parte,punto:hit.punto.slice(),normale:hit.normale.slice(),velocita:hit.velocita}:null,
        tentativo:t?{probabilita:t.probabilita,riuscita:t.riuscita,progresso:t.progresso}:null,traccia};
    }
    for(const dir of [1,-1])for(const fps of [30,60,120])for(const [nome,y,z,atteso] of [
      ['centro-torace',.4,0,'contatto'],['centro-testa',.65,0,'contatto'],
      ['lato-destro',.6,1.15,'gol'],['lato-sinistro',.6,-1.15,'gol'],
      ['sopra-spalla-destra',.72,.38,'gol'],['sopra-spalla-sinistra',.72,-.38,'gol']
    ]){
      const r=tiro({dir,fps,distanza:3,y,z,potenza:.9,velocita:25},`${nome}-${dir}-${fps}`,true,foto&&dir===1&&fps===60&&z>=0);
      r.atteso=atteso;mirati.push(r);
    }
    for(const dir of [1,-1]){
      const r=tiro({dir,fps:30,distanza:3,y:.4,z:0,potenza:.9,velocita:25,vicino:true},`stesso-frame-${dir}`,true,false);
      r.atteso='contatto';r.stessoFrame=true;mirati.push(r);
    }
    // Un muro non chiude il tiro: lo striscio può continuare in porta, il colpo
    // pieno può tornare in campo. È il vero ramo deviaMuro del ciclo RAF.
    // Il volo copiato serve soltanto a collocare la fixture al nono fotogramma;
    // la traiettoria della palla viva non viene più corretta dopo prepara().
    if(!prima)for(const dir of [1,-1])for(const tipo of ['striscio','pieno']){
      const s=prepara({dir,distanza:8,y:.6,z:0,potenza:.9,velocita:22,corpi:false});
      const {att,dif,gk}=s,q=dif.players[2],dt=1/60,copia={...B};
      for(let i=0;i<9;i++)H.palla.passoPalla(copia,dt,[]);
      Object.assign(q,{x:copia.x+dir*(tipo==='striscio'?.01:.3),z:dir*(tipo==='striscio'?.57:0),
        vx:0,vz:0,fx:-dir,fz:0,stunUntil:0});q.lagX=q.x;q.lagZ=q.z;
      Object.assign(gk,{z:7*dir,vx:0,vz:0,stunUntil:1e9});gk.lagZ=gk.z;
      dif.defPlay=0;H.__setCtrl(q);
      window.__casoGK.modo='costante';window.__casoGK.valore=0; // scelta muro, non modifica l'urto
      const primaStat=H.statistiche,posQ=[q.x,q.z],traccia=[];
      let deviazione=null,esito='NESSUN_ESITO',pendingGK=false,movimentoDifensore=0;
      for(let i=0;i<72;i++){
        const vPrima=[B.vx,B.vy,B.vz];frame(dt);
        movimentoDifensore=Math.max(movimentoDifensore,Math.hypot(q.x-posQ[0],q.z-posQ[1]));
        pendingGK||=!!B.parataDaRegistrare;
        if(!deviazione&&B.kind==='rebound'&&B.ignora===q&&B.toccoDifesa===dif&&B.deviataInPorta){
          deviazione={frame:i+1,punto:snap(B),prima:vPrima,dopo:[B.vx,B.vy,B.vz],portiere:B.toccoPortiere,
            stessaDirezione:B.vx*dir>0};
        }
        traccia.push({frame:i+1,palla:snap(B),velocita:[B.vx,B.vy,B.vz],tipo:B.kind,stato:B.state});
        if(att.score>0){esito='GOL';break;}
        if(deviazione&&tipo==='pieno'&&i+1>=deviazione.frame+3){esito=B.vx*dir<0?'TORNA_IN_CAMPO':'NON_TORNA';break;}
        if(B.state==='held'||B.state==='free'||G.state!=='play'){esito=B.state==='held'?'PRESA':B.state==='free'?'ACQUA':'FUORI';break;}
      }
      const dopoStat=H.statistiche;
      muri.push({nome:`muro-${tipo}-${dir}`,tipo,dir,deviazione,esito,movimentoDifensore,
        controlloDifensore:H.ctrl===q,portiereLaterale:gk.z,contattoPortiere:B.contattoPortiere,
        pendingGK,parataRegistrata:!!B.parataRegistrata,
        gol:dopoStat[att.idx].gol-primaStat[att.idx].gol,
        parate:dopoStat[dif.idx].parate-primaStat[dif.idx].parate,traccia});
    }
    const gruppi=[],simmetria={coppie:0,esitiDiversi:0,differenze:[]};
    for(const distanza of [3,8])for(const potenza of [.42,.9]){
      const g={distanza,potenza,n:campioni,esiti:{PRESA:0,RESPINTA:0,GOL:0,FUORI:0,ACQUA:0,NESSUN_ESITO:0},squadre:[{n:0,prese:0,gol:0},{n:0,prese:0,gol:0}]};
      let precedente=null;
      for(let i=0;i<campioni;i++){
        const coppia=Math.floor(i/2),dir=i%2===0?1:-1,z=[1.15,-1.15,.38,-.38][coppia%4];
        const r=tiro({dir,fps:60,distanza,y:.72,z,potenza,velocita:22,seme:7919*(coppia+1),corpi:false},`campione-${distanza}-${potenza}-${i}`,false,false);
        g.esiti[r.esito]++;const squadra=g.squadre[dir===1?0:1];squadra.n++;if(r.esito==='PRESA')squadra.prese++;if(r.esito==='GOL')squadra.gol++;
        if(precedente){simmetria.coppie++;if(precedente.esito!==r.esito){simmetria.esitiDiversi++;simmetria.differenze.push([precedente.nome,r.nome,precedente.esito,r.esito]);}precedente=null;}else precedente=r;
        statistiche.push(r);
      }
      g.preseDirette=campioni?g.esiti.PRESA/campioni:0;gruppi.push(g);
    }
    return {nota:'Traiettorie imposte dopo doShoot per isolare il portiere; metadati reali, portiere controllato e neutro, difficoltà media, valori delle squadre normalizzati. Primo evento: una respinta può ancora entrare successivamente. Le frequenze non rappresentano partite complete.',
      raggioFisicoAtteso:rb,mirati,muri,gruppi,simmetria,statistiche,immagini};
  },{campioni,foto:!!foto,prima});
  assert.deepEqual(errori,[],'nessun errore JavaScript o shader');
  if(foto){fs.mkdirSync(foto,{recursive:true});for(const f of r.immagini)fs.writeFileSync(path.join(foto,f.nome+'.png'),Buffer.from(f.png.split(',')[1],'base64'));}
  delete r.immagini;
  r.provenienza={prima,build:dist||'sorgenti v0.71',campioniPerGruppo:campioni};
  // Conservare tutte le misure anche quando uno degli assert segnala il bug.
  if(arg('salva')){fs.mkdirSync(path.dirname(arg('salva')),{recursive:true});fs.writeFileSync(arg('salva'),JSON.stringify(r,null,2)+'\n');}
  for(const m of r.mirati){
    assert.ok(m.pallaFinale.every(Number.isFinite),m.nome+': coordinate finite');
    assert.ok(m.movimentoGK<.005,m.nome+': il portiere controllato resta nella posizione preparata');
    if(!prima){
      if(m.atteso==='contatto'){
        assert.ok(['PRESA','RESPINTA'].includes(m.esito)&&m.contatto,m.nome+': il corpo effettivo ferma il tiro anche con sorteggio sfavorevole '+JSON.stringify(m));
        assert.ok(m.contatto.punto[0]*m.dir<12.5,m.nome+': contatto prima della linea di gol');
      }else assert.equal(m.esito,'GOL',m.nome+': la traiettoria libera su lato/sopra spalla resta realizzabile '+JSON.stringify(m));
    }
  }
  for(const m of r.muri){
    assert.ok(m.deviazione,m.nome+': deviaMuro avviene nel ciclo RAF '+JSON.stringify(m));
    assert.ok(m.controlloDifensore&&m.movimentoDifensore<.005,m.nome+': difensore controllato neutro');
    assert.ok(Math.hypot(...m.deviazione.dopo.map((v,i)=>v-m.deviazione.prima[i]))>.5,m.nome+': velocità realmente modificata');
    assert.equal(m.deviazione.portiere,false,m.nome+': il tocco appartiene al difensore di movimento');
    assert.ok(!m.contattoPortiere&&!m.pendingGK&&!m.parataRegistrata,m.nome+': nessuna parata del GK creata dal muro');
    assert.equal(m.parate,0,m.nome+': il tabellino non attribuisce la deviazione al portiere');
    if(m.tipo==='striscio'){
      assert.ok(m.deviazione.stessaDirezione,m.nome+': l’urto obliquo conserva il moto verso porta');
      assert.equal(m.esito,'GOL',m.nome+': il seguito fisico della deviazione entra '+JSON.stringify(m));
      assert.equal(m.gol,1,m.nome+': un solo gol effettivamente registrato');
    }else{
      assert.equal(m.esito,'TORNA_IN_CAMPO',m.nome+': il colpo pieno respinge verso il campo '+JSON.stringify(m));
      assert.equal(m.gol,0,m.nome+': nessun gol sul colpo pieno');
    }
  }
  if(!prima&&campioni){
    const vicinoDebole=r.gruppi.find(g=>g.distanza===3&&g.potenza===.42);
    assert.ok(vicinoDebole.preseDirette<=.1,'tiro debole ravvicinato: la presa diretta non è automatica '+JSON.stringify(vicinoDebole));
    assert.equal(r.simmetria.esitiDiversi,0,'coppie specchiate con stessi valori/seme: regole simmetriche '+JSON.stringify(r.simmetria));
  }
  console.log(JSON.stringify({prima,mirati:r.mirati.map(({traccia,...m})=>m),muri:r.muri.map(({traccia,...m})=>m),gruppi:r.gruppi,simmetria:r.simmetria},null,2));
  console.log(`${prima?'MISURA PRIMA':'PASS'} portiere v0.71: ${r.mirati.length} scene reali RAF, ${r.muri.length} muri con seguito reale e ${campioni*4} tiri diagnostici, primo esito e controllo umano`);
}finally{if(browser)await browser.close();if(dist)await new Promise(r=>server.httpServer.close(r));else await server.close();}
