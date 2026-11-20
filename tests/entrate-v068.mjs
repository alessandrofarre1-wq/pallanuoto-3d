// Scene fisiche brevi: passaggi reali, nuoto con inerzia, accoppiamenti e risposte al taglio.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';
const port=Number(process.env.ENTRATE_PORT||4398);
const fotoDir=process.argv.find(a=>a.startsWith('--foto='))?.slice(7);
const server=await createServer({logLevel:'warn',server:{host:'127.0.0.1',port,strictPort:true,hmr:false}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.__rnd=()=>0.5;});
  await page.goto(`http://127.0.0.1:${port}`);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:120000});
  const r=await page.evaluate(async(foto)=>{
    const [A,E,T,S,C,F,Q,R,P]=await Promise.all(['ia','entrate','tiri','stato','costanti','fisica','schemi','regole','partita'].map(f=>import(`/src/${f}.js`)));
    const G=S.game,B=S.ball,dt=1/60;let scena=0;
    const fotografie=[],vista=foto?await import('/src/grafica/render.js'):null,scenaVista=foto?await import('/src/grafica/scena.js'):null;
    function scatta(nome){
      if(!foto)return;
      // Disegno dello stato appena prodotto dalla fisica; i punti di rilascio vengono ripristinati
      // perché una fotografia opzionale non deve cambiare il seguito della prova.
      const mani=S.allPlayers.map(p=>[p.ballW,p.ballVistaW]);vista.render(1/60,G.time*1000);
      const {camera,renderer,scene}=scenaVista;camera.position.set(6,15,17);camera.lookAt(6,0,0);camera.updateProjectionMatrix();renderer.render(scene,camera);
      fotografie.push({nome,png:renderer.domElement.toDataURL('image/png')});
      S.allPlayers.forEach((p,i)=>{p.ballW=mani[i][0];p.ballVistaW=mani[i][1];});
    }
    const put=(p,d,z)=>Object.assign(p,{x:(12.5-d)*p.team.dir,z:z*p.team.dir,vx:0,vz:0});
    function setup(dir=1){
      const t=S.teams[0],o=S.teams[1];t.dir=dir;o.dir=-dir;G.time=200+(++scena)*20;G.possT=G.time-8;G.passaggi=2;G.state='play';G.shot=24;G.clock=180;G.autoplay=true;G.possTeam=t;G.penalty=null;S.setCtrl(null);S.fight.active=false;
      for(const team of [t,o]){Q.applicaSchema(team,Q.copiaSchema('arco'));Object.assign(team,{accoppiamenti:null,occupantiAttacco:null,entrataAzione:null,rotazioneCentro:null,preparaEntrata:null,entrataDopo:0,contro:null,scambio:null,adattamentoEntrata:null,timeouts:0});}
      for(const p of S.allPlayers){
        Object.assign(p,{excluded:false,uscendo:false,act:null,charging:false,cut:null,stamina:1,pressatoUntil:0,stunUntil:0,freeThrow:false,decideT:99,reazioneT:99,appoggio:null,girata:null,oriz:0,fx:p.team.dir,fz:0,contactT:0,turnedUntil:0,ricevutoInEntrata:false,ricevutoPassaggio:false,alVolo:false,shootNext:false,fakeUntil:0,mano:'D'});
        p.s={...p.s,vel:84,pre:84,frz:84,pas:94,vis:90,dif:70};p.st=window.__pallanuoto.prova.valoriMotore(p.s);
        p.scheda={...p.scheda,ruolo:p.i};delete p.ballW;delete p.ballVistaW;
      }
      for(const p of t.players){const f=C.FORM[p.i];if(f)put(p,...f);else put(p,24,0);}
      for(const p of o.players){p.x=-8*dir;p.z=(7+p.i*.25)*dir;}
      o.players[0].x=12.5*dir;o.players[0].z=0;
      for(const p of o.players)A.uomoDi(p);
      Object.assign(B,{state:'held',holder:t.players[6],kind:null,target:null,x:t.players[6].x,z:t.players[6].z,y:.15,holdTime:.4,afterShot:false,pickupCD:0,cambioLato:false,dopoFinta:false});
      return {t,o};
    }
    const hold=p=>{R.giveBall(p);B.holdTime=.4;B.x=p.x;B.z=p.z;};
    const passabile=(p,m,cut=false)=>(!cut||T.entrataPronta(m))&&T.laneClear(p,m.x,m.z,p.team,.55)&&T.passLaneRisk(p,m)<.25&&T.openness(m)>1.1;
    function swim(p,tg){const dx=tg.x-p.x,dz=tg.z-p.z,d=Math.hypot(dx,dz);let ux=dx/(d||1),uz=dz/(d||1);if(d>1)[ux,uz]=A.steer(p,ux,uz,d);const v=Math.min(1,d*2.5);F.movePlayer(p,ux*v,uz*v,!!tg.sprint,dt);}
    function step(t,feed=false){
      G.time+=dt;E.aggiornaEntrate(t);
      for(const p of t.players){if(p.isGK)continue;let tg;
        if(B.state==='flight'&&B.target===p)tg={x:B.tx,z:B.tz,sprint:!!p.cut};
        else if(B.holder===p)tg={x:p.x,z:p.z};else tg=A.attackTarget(p);
        swim(p,tg);
      }
      F.separate();T.updateActs(dt);F.updateBall(dt);
      if(feed&&B.holder){const m=E.destinatarioEntrata(B.holder,passabile);if(m)T.doPass(B.holder,m);}
    }
    function avvia(tipo,dir=1){
      const {t,o}=setup(dir),h=t.players[tipo==='C'?4:6],m=t.players[tipo==='B'?5:tipo==='C'?6:4];hold(h);
      if(tipo==='B'){h.mano='S';t.players[2].mano='S';}
      const d=E.difensoreEntrata(h);d.x=h.x+.85*dir;d.z=h.z;d.fx=-dir;d.fz=0;
      A.aiCarrier(h,dt);const gesto=h.act?.kind;for(let n=0;n<18&&B.holder===h;n++)step(t);
      return {t,o,h,m,gesto,tipo:t.entrataAzione?.tipo,partito:!!h.cut};
    }
    const risultati={};
    for(const tipo of ['A','B','C'])for(const dir of [1,-1]){
      const s=avvia(tipo,dir),{t,h,m}=s;if(tipo==='A'&&dir===1)scatta('A-1-appoggio-rilasciato');let primo=false,secondo=false,maxStep=0,prima={x:h.x,z:h.z};
      for(let n=0;n<280;n++){
        step(t,true);if(tipo==='A'&&dir===1&&n===55)scatta('A-2-taglio-e-scalata');maxStep=Math.max(maxStep,Math.hypot(h.x-prima.x,h.z-prima.z));prima={x:h.x,z:h.z};
        if(B.holder===m)primo=true;if(B.holder===h){secondo=!!h.ricevutoInEntrata;if(tipo==='A'&&dir===1)scatta('A-3-ricezione-fisica');break;}
      }
      risultati[tipo+dir]={gesto:s.gesto,tipo:s.tipo,partito:s.partito,primo,secondo,profondita:(12.5*dir-h.x)*dir,z:h.z*dir,maxStep,posti:t.occupantiAttacco.slice(1).map(p=>p.i),identita:h.i,mano:h.mano};
    }
    // Due difese dello stesso passaggio: chiusura del taglio e successiva salita dell'ala, oppure copertura di entrambi.
    for(const doppia of [false,true]){
      const {t,o,h,m}=avvia('A'),ala=t.players[3],difAla=E.difensoreEntrata(ala);let primo=false,passAla=false,pronta=false;
      difAla.x=9.5;difAla.z=-2.65;if(!doppia)scatta('copertura-1-difensore-stringe');let salitaFotografata=false;
      if(doppia){o.players[4].x=9.3;o.players[4].z=-4.4;}
      for(let n=0;n<280;n++){
        step(t,false);if(B.holder===m)primo=true;
        const a=t.entrataAzione;if(a?.allargata&&!doppia&&!salitaFotografata){scatta('copertura-2-ala-sale');salitaFotografata=true;}
        if(a?.allargata&&Math.abs(ala.z)<4.15){
          pronta=true;const destinatario=E.destinatarioEntrata(m,passabile);
          if(B.holder===m&&destinatario===ala){T.doPass(m,ala);passAla=true;}
        }
        if(B.holder===ala){if(!doppia)scatta('copertura-3-ricezione-ala');break;}
      }
      risultati[doppia?'doppiaCopertura':'alaSale']={primo,pronta,passAla,allargata:!!t.entrataAzione?.allargata,alaD:12.5-ala.x,alaZ:ala.z,riceve:B.holder===ala,taglioRicevibile:T.entrataPronta(h)};
    }
    // Difensore in consegna: cambia l'uomo, nessuno salta di posto e l'assegnazione non torna indietro dopo 5 s.
    {
      const {t,o,h}=avvia('A'),a=E.difensoreEntrata(h),b=o.players[4],prima={ax:a.x,az:a.z,bx:b.x,bz:b.z};
      h.x=9;h.z=-1.4;a.x=7.2;a.z=-1.2;b.x=10;b.z=-1.5;
      const pos=[a.x,a.z,b.x,b.z];A.aggiornaDifesa(o,dt);const assegnato=A.uomoDi(b)===h;
      const fermo=pos.every((v,i)=>v===[a.x,a.z,b.x,b.z][i]);G.time+=5.1;A.aggiornaDifesa(o,dt);
      risultati.consegna={assegnato,fermo,persistente:A.uomoDi(b)===h,prima};
    }
    // Fallo reale, pausa regolamentare e ripresa: l'appoggio è consentito, il taglio aspetta il rilascio.
    {
      const {t}=setup(),h=t.players[6],m=t.players[4],d=E.difensoreEntrata(h);hold(h);d.x=h.x+.85;d.z=h.z;
      R.foul(d,h);const fermo=G.state==='stop'&&h.freeThrow;
      const nienteDuranteStop=E.preparaEntrata(h,passabile)===null&&!h.cut;
      P.update(.4);const ancoraFermo=G.state==='stop'&&!h.cut;P.update(.41);
      const ripreso=G.state==='play'&&h.freeThrow;
      A.aiCarrier(h,dt);const gesto=h.act?.kind,primaRilascio=!h.cut;
      for(let n=0;n<18&&B.holder===h;n++)step(t);
      const dopoRilascio=h.cut?.tipo==='A';let ricevuto=false;
      for(let n=0;n<70;n++){step(t);if(B.holder===m){ricevuto=true;break;}}
      risultati.tiroLibero={fermo,nienteDuranteStop,ancoraFermo,ripreso,gesto,primaRilascio,dopoRilascio,ricevuto};
    }
    // D: la larghezza da sola non fa partire un taglio; testa avanti e difensore distratto sì.
    for(const dir of [1,-1])for(const davanti of [false,true]){
      const {t}=setup(dir),p=t.players[2],d=E.difensoreEntrata(p);hold(t.players[5]);d.x=p.x+(davanti?-1.1:.4)*dir;d.z=p.z;d.fx=-dir;d.fz=0;
      E.aggiornaEntrate(t);risultati[(davanti?'mezzaSi':'mezzaNo')+(dir===1?'':'Specchio')]={taglio:p.cut?.tipo??null,metri:p.cut?Math.hypot(p.cut.x-p.x,p.cut.z-p.z):0};
    }
    for(const dir of [1,-1]){
      const {t}=setup(dir),p=t.players[2],d=E.difensoreEntrata(p);put(p,2.35,1.7);hold(t.players[5]);d.x=p.x-dir*1.1;d.z=p.z;d.fx=-dir;d.fz=0;
      E.aggiornaEntrate(t);risultati['mezzaGiaArrivato'+dir]={taglio:p.cut?.tipo??null};
    }
    // Il lato sfavorevole non è vietato per una coppia capace: mano e qualità restano dati dell'atleta.
    {
      const {t}=setup(),p=t.players[6],ala=t.players[2];p.s.vel=p.s.pre=p.s.frz=70;ala.s.vel=ala.s.pre=ala.s.frz=70;
      const debole=E.latoTecnico(p,ala);p.mano=ala.mano='S';const mancina=E.latoTecnico(p,ala);p.mano=ala.mano='D';p.s.vel=p.s.pre=p.s.frz=90;ala.s.vel=ala.s.pre=ala.s.frz=90;
      risultati.mano={debole,mancina,abile:E.latoTecnico(p,ala)};
    }
    // Schema personale con non specialista davanti, forte marcatore che lo segue e vera boa su difensore debole.
    for(const dir of [1,-1]){
      const {t,o}=setup(dir),s=Q.copiaSchema('arco');s.id='personale';s.attacco[0]=[2.8,-5.5];s.attacco[5]=[2.7,0];Q.applicaSchema(t,s);
      const u=t.players[6],boa=t.players[1];put(u,2.7,0);put(boa,2.8,-5.5);hold(t.players[4]);
      const forte=E.difensoreEntrata(u),debole=E.difensoreEntrata(boa);forte.scheda={...forte.scheda,ruolo:6};forte.s.dif=94;debole.s.dif=65;
      forte.x=u.x+.85*dir;forte.z=u.z;debole.x=boa.x+.8*dir;debole.z=boa.z;
      const salvato=JSON.stringify(s),identita=[u.i,u.mano,u.scheda.ruolo,boa.i,boa.mano,boa.scheda.ruolo];E.aggiornaEntrate(t);
      const partito=!!t.rotazioneCentro,primaBoa={x:boa.x,z:boa.z},targetAttesa=E.targetEntrata(boa);let massimo=0,pr={x:u.x,z:u.z};
      for(let n=0;n<190;n++){step(t);swim(forte,A.markTarget(forte));massimo=Math.max(massimo,Math.hypot(u.x-pr.x,u.z-pr.z));pr={x:u.x,z:u.z};}
      risultati['mismatch'+dir]={partito,centro:E.centroAttacco(t)===boa,attesa:Math.hypot(targetAttesa.x-primaBoa.x,targetAttesa.z-primaBoa.z)<.01,
        uscita:Math.abs(u.z)>3,boaDentro:Math.abs(boa.z)<3,forteSegue:A.uomoDi(forte)===u,deboleSuBoa:A.uomoDi(debole)===boa,massimo,schema:salvato===JSON.stringify(s),identita:JSON.stringify(identita)===JSON.stringify([u.i,u.mano,u.scheda.ruolo,boa.i,boa.mano,boa.scheda.ruolo])};
    }
    // Giocata selezionabile dalla lavagna: nessun falso centro deve essere predisposto a mano nella scena.
    for(const dir of [1,-1]){
      const {t,o}=setup(dir),s=Q.copiaSchema('falso-centro');
      const salvato=Q.salvaSchema(s),caricato=Q.caricaSchema();Q.applicaSchema(t,caricato);
      for(const p of t.players)if(!p.isGK)put(p,...caricato.attacco[p.i-1]);
      const fake=t.players[6],boa=t.players[1],forte=o.players[6],debole=o.players[1];
      forte.s.dif=94;debole.s.dif=65;o.accoppiamenti=null;
      const primaMap=S.allPlayers.map(p=>[p.x,p.z]);
      const accoppia=A.uomoDi(forte)===fake&&A.uomoDi(debole)===boa;
      const nienteSalti=primaMap.every(([x,z],i)=>S.allPlayers[i].x===x&&S.allPlayers[i].z===z);
      forte.x=fake.x+.85*dir;forte.z=fake.z;debole.x=boa.x+.8*dir;debole.z=boa.z;
      hold(t.players[4]);G.autoplay=false;S.setCtrl(t.players[4]);
      const salvo=JSON.stringify(t.schema);E.aggiornaEntrate(t);
      const chiamata=!!t.rotazioneCentro,controllato=S.ctrl===t.players[4];
      for(let n=0;n<220;n++){step(t);swim(forte,A.markTarget(forte));}
      const rientraBoa=Math.abs(boa.z)<2.5&&Math.abs(12.5*dir-boa.x)<4.5,esceFake=Math.abs(fake.z)>3;
      const stessoPiano=salvo===JSON.stringify(t.schema),centro=E.centroAttacco(t)===boa;
      Q.applicaSchema(t,Q.copiaSchema('arco'));
      const persiste=A.uomoDi(forte)===fake&&A.uomoDi(debole)===boa;
      risultati['preset'+dir]={salvato,nome:caricato.nome,accoppia,nienteSalti,chiamata,controllato,rientraBoa,esceFake,stessoPiano,centro,persiste};
      G.autoplay=true;S.setCtrl(null);
    }
    {
      const {t,o,h}=avvia('A');for(let i=0;i<50;i++)step(t);const pos=S.allPlayers.map(p=>[p.x,p.z]),occ=[...t.occupantiAttacco];
      hold(o.players[5]);E.aggiornaEntrate(t);const immediato=S.allPlayers.every((p,i)=>p.x===pos[i][0]&&p.z===pos[i][1]);
      const target=A.aiTarget(h);swim(h,target);
      risultati.recupero={immediato,occ:occ.every((p,i)=>p===t.occupantiAttacco[i]),nessunTaglio:t.players.every(p=>!p.cut),nuota:Math.hypot(h.x-pos[h.i][0],h.z-pos[h.i][1])>0};
    }
    {
      const {t}=setup(),p=t.players[6];hold(t.players[4]);p.cut={t0:G.time,phase:0,x:11.3,z:1.5};p.x=11.3;p.z=1.5;
      risultati.area={vietata:!T.entrataPronta(p),limite:12.5-E.limiteAreaEntrata(p,11.5,1.5).x};
    }
    return {...risultati,__foto:fotografie};
  },!!fotoDir);
  if(fotoDir){fs.mkdirSync(fotoDir,{recursive:true});for(const f of r.__foto)fs.writeFileSync(path.join(fotoDir,f.nome+'.png'),Buffer.from(f.png.split(',')[1],'base64'));}
  delete r.__foto;
  console.log(JSON.stringify(r,null,2));
  for(const tipo of ['A','B','C'])for(const dir of [1,-1]){const x=r[tipo+dir];assert.equal(x.gesto,'pass',tipo+' appoggio IA');assert.equal(x.tipo,tipo);assert.ok(x.partito&&x.primo&&x.secondo,tipo+' due passaggi fisici e ricezione in entrata');assert.ok(x.maxStep<.1,'nuoto continuo');assert.equal(new Set(x.posti).size,6,'sei occupanti distinti');assert.ok(x.profondita>=1.99,'fuori area davanti alla palla');}
  assert.ok(r.alaSale.primo&&r.alaSale.allargata&&r.alaSale.passAla&&r.alaSale.riceve,'chiusura taglio libera ala salita');
  assert.ok(!r.doppiaCopertura.passAla,'la seconda copertura toglie il servizio all’ala');
  assert.ok(r.consegna.assegnato&&r.consegna.fermo&&r.consegna.persistente,'consegna persiste senza spostare atleti');
  assert.equal(r.tiroLibero.gesto,'pass');assert.ok(Object.entries(r.tiroLibero).filter(([k])=>k!=='gesto').every(([,v])=>v),'fallo reale, pausa, ripresa e taglio dopo rilascio');
  assert.equal(r.mezzaNo.taglio,null);assert.equal(r.mezzaSi.taglio,'D');
  assert.equal(r.mezzaNoSpecchio.taglio,null);assert.equal(r.mezzaSiSpecchio.taglio,'D');
  assert.ok(r.mezzaSi.metri<=1.40001&&r.mezzaSi.metri>.6&&r.mezzaSiSpecchio.metri<=1.40001&&r.mezzaSiSpecchio.metri>.6,'mezza entrata breve, non taglio intero al palo');
  for(const dir of [1,-1])assert.equal(r['mezzaGiaArrivato'+dir].taglio,null,'niente entrata senza spostamento utile');
  assert.deepEqual(r.mano,{debole:false,mancina:true,abile:true});
  for(const dir of [1,-1]){const x=r['mismatch'+dir];assert.ok(x.partito&&x.centro&&x.attesa&&x.uscita&&x.boaDentro&&x.forteSegue&&x.deboleSuBoa&&x.schema&&x.identita,'rotazione vera boa e identità/accoppiamenti '+dir);assert.ok(x.massimo<.1);}
  for(const dir of [1,-1]){const x=r['preset'+dir];assert.equal(x.nome,'Falso centro');assert.ok(Object.entries(x).filter(([k])=>k!=='nome').every(([,v])=>v),'preset da lavagna, rotazione umana e primo accoppiamento persistente '+dir);}
  assert.ok(Object.values(r.recupero).every(Boolean),'recupero senza riordino o blocco');assert.ok(r.area.vietata&&r.area.limite>=2,'linea palla e area');
  assert.deepEqual(errors,[]);console.log('Entrate v0.68: scene A/B/C/D, copertura/consegna, mani, campo e mismatch PASS');
}finally{await browser.close();await server.close();}
