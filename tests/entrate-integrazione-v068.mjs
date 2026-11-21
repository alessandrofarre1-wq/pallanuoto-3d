// Entrate osservate nel ciclo reale: nessun passaggio imposto e tutti i marcatori nuotano con la loro IA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const fotoDir=process.argv.find(a=>a.startsWith('--foto='))?.slice(7);
const server=await createServer({logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.__casoEntrate=.5;window.__rnd=()=>window.__casoEntrate;});
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:120000});
  const r=await page.evaluate(async foto=>{
    const [S,P,A,E,T,Q,R,I,V,D]=await Promise.all(['stato','partita','ia','entrate','tiri','schemi','regole','input','replay','difesa-cambi'].map(n=>import('/src/'+n+'.js')));
    const [vista,scenaVista]=await Promise.all([import('/src/grafica/render.js'),import('/src/grafica/scena.js')]);
    const H=window.__pallanuoto,G=S.game,B=S.ball,dt=1/60,fotogrammi=[];let scena=0;
    const disegna=scenaVista.renderer.render;scenaVista.renderer.render=()=>{};H.replay.forzaRegistrazione=false;
    const put=(p,d,z,dir)=>Object.assign(p,{x:(12.5-d)*dir,z:z*dir,vx:0,vz:0});
    // Cattura facoltativa: la simulazione e le pose sono già avanzate; cambia solo
    // la camera per il singolo disegno, poi ripristina camera e renderer integralmente.
    function fotografa(nome,p,h,inizio){
      if(!foto||fotogrammi.some(f=>f.nome===nome))return;
      const {camera,renderer,scene:scena3d}=scenaVista,prima=camera.clone(),primaRender=renderer.render;
      try{
        camera.position.set(8,11,18);camera.lookAt(8,0,2);camera.fov=40;camera.updateProjectionMatrix();camera.updateMatrixWorld();
        renderer.render=disegna;renderer.render(scena3d,camera);
        fotogrammi.push({nome,tempo:+(G.time-inizio).toFixed(3),entrante:[p.x,p.z],appoggio:[h.x,h.z],
          palla:{stato:B.state,tipo:B.kind,holder:B.holder?.uid??null,da:B.shooter?.uid??null,a:B.target?.uid??null},
          camera:{pos:[8,11,18],look:[8,0,2],fov:40},png:renderer.domElement.toDataURL('image/png').split(',')[1]});
      }finally{camera.copy(prima);camera.updateProjectionMatrix();camera.updateMatrixWorld();renderer.render=primaRender;}
    }
    function setup(dir=1){
      I.resetInput();V.interrompiReplay();
      Object.assign(G,{state:'play',time:200+(++scena)*20,possT:192+scena*20,passaggi:2,shot:24,clock:180,period:1,autoplay:true,possTeam:S.teams[0],penalty:null,rigoriFinali:null});S.setCtrl(null);S.fight.active=false;
      const [t,o]=S.teams;t.dir=dir;o.dir=-dir;
      for(const team of S.teams){
        Q.applicaSchema(team,Q.copiaSchema('arco'));
        Object.assign(team,{accoppiamenti:null,occupantiAttacco:null,occupantiSchema:null,entrataAzione:null,rotazioneCentro:null,preparaEntrata:null,entrataDopo:0,adattamentoEntrata:null,scambio:null,contro:null,
          schemaStato:null,copertura:null,aiutoStato:null,blocco:null,coda:[],cambio:null,prossimoControllo:Infinity,timeouts:0,postiT:-1,rallT:-1,doubleP:null,doubleUntil:0,fugaFino:0});
      }
      for(const p of S.allPlayers){
        Object.assign(p,{excluded:false,uscendo:false,act:null,charging:false,cut:null,girata:null,stamina:1,pressatoUntil:0,pressatoDa:null,stunUntil:0,freeThrow:false,decideT:0,reazioneT:0,appoggio:null,
          oriz:0,fx:p.team.dir,fz:0,contactT:0,turnedUntil:0,ricevutoInEntrata:false,ricevutoPassaggio:false,alVolo:false,shootNext:false,fakeUntil:0,fakeCount:0,mano:'D',tackleCD:0,colpi:[],areaT:0,rientro:null,lunge:0,perno:false,scivolaAI:false});
        p.s={...p.s,vel:90,pre:80,frz:80,pas:94,vis:90,dif:70,dis:90};p.st=H.prova.valoriMotore(p.s);p.scheda={...p.scheda,ruolo:p.i};delete p.ballW;delete p.ballVistaW;
      }
      for(const p of t.players){const f=p.isGK?[24,0]:t.schema.attacco[p.i-1];put(p,...f,dir);}
      // Gli altri difensori rientrano da lontano: la scena isola il duello, senza arrestarne il movimento.
      for(const p of o.players)put(p,p.isGK?.7:23, p.isGK?0:6+p.i*.35,dir);
      for(const p of S.allPlayers){const a=A.uomoDi(p);p.lagX=a.x;p.lagZ=a.z;}
      Object.assign(B,{state:'held',holder:t.players[6],kind:null,target:null,shooter:null,lastTeam:t,holdTime:0,afterShot:false,pickupCD:0,cambioLato:false,dopoFinta:false,flightT:0});
      return {t,o};
    }
    const zone=[];
    for(const dir of [1,-1]){
      const {t,o}=setup(dir);Q.applicaSchema(t,Q.copiaSchema('falso-centro'));
      for(const p of t.players)if(!p.isGK)put(p,...t.schema.attacco[p.i-1],dir);
      for(const p of t.players){p.s.pot=p.s.pre=99;}
      t.players[6].s.pot=t.players[6].s.pre=40;t.players[1].s.pot=t.players[1].s.pre=55;
      A.passaAZona(o,1,false);const lasciaPeriferico=o.lasciato===t.players[1],escludeBoa=o.lasciato!==E.centroAttacco(t);
      for(const p of t.players)p.s.pot=p.s.pre=99;
      t.players[2].s.pot=t.players[2].s.pre=t.players[5].s.pot=t.players[5].s.pre=70;
      const occ=t.occupantiAttacco;[occ[2],occ[5]]=[occ[5],occ[2]];
      A.passaAZona(o,3,false);const latoDopoRotazione=o.lasciato===t.players[5];
      t.players[6].s.frz=t.players[6].s.pot=99;t.players[1].s.frz=t.players[1].s.pot=40;
      o.schema=null;o.defPlay=2;G.shot=20;B.x=t.players[6].x;B.z=t.players[6].z;
      window.__casoEntrate=.25;A.aggiornaDifesa(o,1);window.__casoEntrate=.5;
      zone.push({dir,lasciaPeriferico,escludeBoa,latoDopoRotazione,zonaMControBoaForte:o.defPlay===3});
    }
    const scene=[];
    for(const tipo of ['A','B','C'])for(const dir of [1,-1])for(const difesa of ['testa-avanti','davanti','schierata']){
      const chiuso=difesa!=='testa-avanti',schierata=difesa==='schierata';
      const {t,o}=setup(dir),h=t.players[tipo==='C'?4:6],m=t.players[tipo==='B'?5:tipo==='C'?6:4];
      if(tipo==='B'){h.mano=t.players[2].mano='S';}
      if(schierata){
        for(const q of o.players){
          if(q.isGK)continue;
          const a=A.uomoDi(q);q.x=a.x+dir*.9;q.z=a.z+(Math.sign(a.z)||-1)*2*dir;
        }
        const centro=E.difensoreEntrata(E.centroAttacco(t));put(centro,3.4,(tipo==='A'?-1:1)*1.8,dir);
      }
      const d=E.difensoreEntrata(h);d.s.vel=chiuso?99:55;d.st=H.prova.valoriMotore(d.s);
      d.x=h.x+dir*(chiuso?.9:-1.25);d.z=h.z;d.fx=-dir;d.fz=0;
      for(const p of S.allPlayers){const a=A.uomoDi(p);p.lagX=a.x;p.lagZ=a.z;}
      R.giveBall(h);B.holdTime=.2;B.x=h.x;B.z=h.z;
      vista.render(dt,G.time*1000);
      const inizio=G.time,origineH={x:h.x,z:h.z},origineD={x:d.x,z:d.z},origineM={x:m.x,z:m.z};
      const misura={tipo,dir,difesa,chiuso,mano:h.mano,palmoReale:!!h.ballW,preparato:false,primaDelRilascio:false,rilascio:null,taglio:null,appoggioRiceve:false,ritorno:null,ricezione:false,passaggi:[],maxPasso:0,stato:null,attesaCoperto:0,decisioniNonPronte:0,nuotoD:0,nuotoM:0};
      let precedente={x:h.x,z:h.z},precedenteD={x:d.x,z:d.z},precedenteM={x:m.x,z:m.z},voloPrecedente=null,gestoPrecedente=null;
      for(let frame=0;frame<420;frame++){
        P.update(dt);V.interrompiReplay();vista.render(dt,G.time*1000);
        misura.nuotoD+=Math.hypot(d.x-precedenteD.x,d.z-precedenteD.z);precedenteD={x:d.x,z:d.z};
        misura.nuotoM+=Math.hypot(m.x-precedenteM.x,m.z-precedenteM.z);precedenteM={x:m.x,z:m.z};
        if(B.holder===m&&B.holdTime>=.18&&h.cut&&!T.entrataPronta(h))misura.attesaCoperto++;
        if(m.act?.kind==='pass'&&m.act!==gestoPrecedente&&!m.act.done){
          gestoPrecedente=m.act;
          if(Math.hypot(h.x-m.act.aim[0],h.z-m.act.aim[1])<.15&&!T.entrataPronta(h))misura.decisioniNonPronte++;
        }
        misura.maxPasso=Math.max(misura.maxPasso,Math.hypot(h.x-precedente.x,h.z-precedente.z));precedente={x:h.x,z:h.z};
        if(t.preparaEntrata?.p===h){misura.preparato=true;misura.primaDelRilascio||=B.holder===h&&h.act?.kind==='pass'&&!h.cut;}
        if(h.cut?.coordinata){misura.taglio=h.cut.tipo;if(misura.rilascio===null&&B.shooter===h&&B.state==='flight')misura.rilascio=G.time-inizio;}
        if(B.state==='flight'&&B.kind==='pass'){
          const chiave=B.shooter.uid+':'+B.target?.uid+':'+Math.round((G.time-B.flightT)*1000);
          if(chiave!==voloPrecedente){
            voloPrecedente=chiave;misura.passaggi.push({da:B.shooter.i,a:B.target?.i,t:+(G.time-inizio).toFixed(3),pronto:B.target===h?T.entrataPronta(h):null});
            if(B.shooter===m&&B.target===h)misura.ritorno=G.time-inizio;
          }
        }
        if(B.holder===m&&m.ricevutoPassaggio)misura.appoggioRiceve=true;
        if(B.holder===h&&h.ricevutoInEntrata){misura.ricezione=true;break;}
        if(G.state!=='play'||G.possTeam!==t)break;
      }
      misura.stato=G.state;misura.metriH=Math.hypot(h.x-origineH.x,h.z-origineH.z);misura.metriD=Math.hypot(d.x-origineD.x,d.z-origineD.z);misura.metriM=Math.hypot(m.x-origineM.x,m.z-origineM.z);
      misura.fine={holder:B.holder?.i,team:B.holder?.team.idx,state:B.state,cut:!!h.cut,allargata:t.entrataAzione?.allargata,pronto:T.entrataPronta(h),posH:[h.x*dir,h.z*dir],posD:[d.x*dir,d.z*dir]};scene.push(misura);
    }
    // Una mezza entrata nasce da un vantaggio già presente: il motore sceglie
    // autonomamente servizio, presa e tiro. Lo scatto corto non trascina l'esterno sul punto.
    const mezze=[];
    for(const dir of [1,-1])for(const mano of ['D','S']){
      const {t,o}=setup(dir),p=t.players[2],h=t.players[6],esterno=t.players[4];
      // Nessuna sovrapposizione iniziale fra i rientranti: altrimenti separate()
      // corregge la fixture al primo fotogramma, falsando la misura sui 14 atleti.
      for(const q of o.players)if(!q.isGK)put(q,23,4+q.i*.9,dir);
      put(p,2.6,5.2,dir);p.mano=mano;
      const d=E.difensoreEntrata(p);put(d,3.85,5.2,dir);d.fx=-dir;d.fz=0;
      d.s.vel=55;d.st=H.prova.valoriMotore(d.s);
      for(const q of S.allPlayers){const a=A.uomoDi(q);q.lagX=a.x;q.lagZ=a.z;}
      R.giveBall(h);B.holdTime=.2;B.x=h.x;B.z=h.z;vista.render(dt,G.time*1000);
      const inizio=G.time,origine={x:p.x,z:p.z},misura={dir,mano,taglio:false,metriTarget:null,distanzaTarget:null,
        palmoReale:!!h.ballW,passaggioAutonomo:false,ricezione:false,tiro:false,scarico:false,prontaAllaScelta:false,
        esternoLaterale:null,maxPasso:0,nuotoD:0,passaggi:[],stato:null};
      let prima=S.allPlayers.map(q=>[q.x,q.z]),precedenteD=[d.x,d.z],ultimoVolo=null,gesto=null;
      for(let frame=0;frame<300;frame++){
        const palmiPrima={passaggio:!!h.ballW,tiro:!!p.ballW};
        P.update(dt);V.interrompiReplay();vista.render(dt,G.time*1000);
        for(let i=0;i<S.allPlayers.length;i++){
          const q=S.allPlayers[i];misura.maxPasso=Math.max(misura.maxPasso,Math.hypot(q.x-prima[i][0],q.z-prima[i][1]));
        }
        prima=S.allPlayers.map(q=>[q.x,q.z]);
        misura.nuotoD+=Math.hypot(d.x-precedenteD[0],d.z-precedenteD[1]);precedenteD=[d.x,d.z];
        if(p.cut?.tipo==='D'&&!misura.taglio){
          misura.taglio=true;misura.metriTarget=Math.hypot(p.cut.x-origine.x,p.cut.z-origine.z);
          misura.distanzaTarget=Math.hypot(S.goalX(t)-p.cut.x,p.cut.z);
          misura.esternoLaterale=Math.abs(A.attackTarget(esterno).z);
          if(dir===1&&mano==='D')fotografa('1-taglio',p,h,inizio);
        }
        if(h.act?.kind==='pass'&&h.act!==gesto&&!h.act.done){
          gesto=h.act;
          if(Math.hypot(h.act.aim[0]-p.x,h.act.aim[1]-p.z)<.15){
            misura.prontaAllaScelta=T.entrataPronta(p);
            if(misura.prontaAllaScelta&&dir===1&&mano==='D')fotografa('2-servizio-pronto',p,h,inizio);
          }
        }
        if(B.state==='flight'&&(B.kind==='pass'||B.kind==='shot')){
          const chiave=B.shooter.uid+':'+B.target?.uid+':'+B.kind+':'+Math.round((G.time-B.flightT)*1000);
          if(chiave!==ultimoVolo){
            ultimoVolo=chiave;misura.passaggi.push({tipo:B.kind,da:B.shooter.i,a:B.target?.i,t:+(G.time-inizio).toFixed(3)});
            if(B.kind==='pass'&&B.shooter===h&&B.target===p){misura.passaggioAutonomo=true;misura.palmoReale&&=palmiPrima.passaggio;}
            if(B.shooter===p){
              misura.tiro=B.kind==='shot';misura.scarico=B.kind==='pass';misura.palmoReale&&=palmiPrima.tiro;
              if(misura.tiro&&dir===1&&mano==='D')fotografa('4-tiro-rilasciato',p,h,inizio);break;
            }
          }
        }
        if(B.holder===p&&p.ricevutoInEntrata){
          misura.ricezione=true;if(dir===1&&mano==='D')fotografa('3-presa-reale',p,h,inizio);
        }
        if(G.state!=='play'||G.possTeam!==t)break;
      }
      misura.stato=G.state;misura.metri=Math.hypot(p.x-origine.x,p.z-origine.z);mezze.push(misura);
    }
    const mezzeChiuse=[];
    for(const motivo of ['ala-larga','difensore-davanti']){
      const {t}=setup(1),p=t.players[2],h=t.players[6];put(p,2.6,motivo==='ala-larga'?6.2:5.2,1);
      const d=E.difensoreEntrata(p);put(d,motivo==='difensore-davanti'?1.7:3.85,p.z,1);d.fx=-1;d.fz=0;
      d.s.vel=55;d.st=H.prova.valoriMotore(d.s);
      for(const q of S.allPlayers){const a=A.uomoDi(q);q.lagX=a.x;q.lagZ=a.z;}
      R.giveBall(h);B.holdTime=.2;B.x=h.x;B.z=h.z;vista.render(dt,G.time*1000);
      let partenza=false,maxPasso=0,prima=[p.x,p.z];
      for(let frame=0;frame<15;frame++){
        P.update(dt);V.interrompiReplay();vista.render(dt,G.time*1000);
        partenza||=p.cut?.tipo==='D';maxPasso=Math.max(maxPasso,Math.hypot(p.x-prima[0],p.z-prima[1]));prima=[p.x,p.z];
      }
      mezzeChiuse.push({motivo,partenza,maxPasso});
    }
    const qualifiche=[];
    for(const dir of [1,-1]){
      const {t}=setup(dir),h=t.players[6],d=E.difensoreEntrata(h);d.x=h.x-dir;d.z=h.z;
      R.giveBall(h);B.holdTime=.3;B.x=h.x;B.z=h.z;
      G.possT=G.time-.5;G.passaggi=2;const primoToccoFermo=E.preparaEntrata(h,()=>true)===null;
      G.possT=G.time-8;G.passaggi=1;const primaCircolazioneFerma=E.preparaEntrata(h,()=>true)===null;
      G.passaggi=2;const costruita=E.preparaEntrata(h,()=>true)===t.players[4];t.preparaEntrata=null;
      t.contro={t0:G.time,fino:G.time+8,schema:'base'};A.aiCarrier(h,dt);const ripartenzaConservata=!t.preparaEntrata;
      h.act=null;t.preparaEntrata=null;G.possT=G.time;G.passaggi=0;h.freeThrow=true;h.falloT=G.time;
      const dopoFallo=E.preparaEntrata(h,()=>true)===t.players[4];
      qualifiche.push({dir,primoToccoFermo,primaCircolazioneFerma,costruita,ripartenzaConservata,dopoFallo});
    }
    const riposizionamenti=[];
    for(const dir of [1,-1])for(const schema of ['arco','falso-centro'])for(const ripresa of ['placeHalves','kickoff']){
      const {t,o}=setup(dir);Q.applicaSchema(t,Q.copiaSchema(schema));
      for(const team of S.teams)E.occupanteAttacco(team,1);
      [t.occupantiAttacco[1],t.occupantiAttacco[6]]=[t.occupantiAttacco[6],t.occupantiAttacco[1]];
      [o.occupantiAttacco[2],o.occupantiAttacco[5]]=[o.occupantiAttacco[5],o.occupantiAttacco[2]];
      for(const p of S.allPlayers)A.uomoDi(p);
      const forte=o.players[6],uomini=o.accoppiamenti.uomini,vecchio=uomini.indexOf(t.players[4]);
      [uomini[6],uomini[vecchio]]=[uomini[vecchio],uomini[6]];
      const rientrante=t.players[2];rientrante.x=-dir*10;D.registraEntranteCambio(rientrante);
      const mappe=S.teams.map(team=>({posti:team.occupantiAttacco,uomini:team.accoppiamenti}));
      const coordinate=S.allPlayers.map(p=>[p.x,p.z]),scelti=S.teams.map(team=>({schema:team.schema,piano:JSON.stringify(team.schema),human:team.human}));
      G.autoplay=false;S.setCtrl(t.players[6]);const controllo=S.ctrl;
      G.possTeam=o;R.giveBall(t.players[4]);
      const liveConservaMappe=S.teams.every((team,i)=>team.occupantiAttacco===mappe[i].posti&&team.accoppiamenti===mappe[i].uomini);
      const liveConservaCoordinate=S.allPlayers.every((p,i)=>p.x===coordinate[i][0]&&p.z===coordinate[i][1]);
      const marcatoreRientro=o.players.find(p=>A.uomoDi(p)===rientrante);
      const memoriaCambioPrima=!!D.coperturaCambio(marcatoreRientro,rientrante,E.centroAttacco(t),t.players[4],A.uomoDi);
      const difese=S.teams.map(team=>team.defPlay),primaForte=A.uomoDi(forte).i;
      for(const team of S.teams){
        const entrante=team.players[4];entrante.cut={t0:G.time,phase:0,coordinata:true};entrante.appoggio={h:team.players[6]};
        Object.assign(team,{entrataAzione:{entrante},preparaEntrata:{p:entrante},rotazioneCentro:{uscente:team.players[6],boa:team.players[1]},entrataDopo:G.time+12,
          scambio:{a:team.players[1],b:team.players[6]},adattamentoEntrata:{entrante},schemaStato:{possT:G.possT},copertura:{entrante},blocco:{entrante},aiutoStato:{p:team.players[5]},lasciato:team.players[1],lasciatoT:G.time+1,centroT:G.time,centroAperto:true});
      }
      R[ripresa]();
      const resetMappe=S.teams.every((team,i)=>team.occupantiAttacco!==mappe[i].posti&&team.accoppiamenti!==mappe[i].uomini&&team.occupantiSchema===Q.schemaSquadra(team));
      const resetAzione=S.teams.every(team=>['entrataAzione','preparaEntrata','rotazioneCentro','scambio','adattamentoEntrata','schemaStato','copertura','blocco','aiutoStato','lasciato'].every(k=>team[k]===null)&&
        team.entrataDopo===0&&team.lasciatoT===0&&team.centroT===-1&&!team.centroAperto&&team.players.every(p=>!p.cut&&!p.appoggio));
      const invarianti=S.teams.every((team,i)=>team.schema===scelti[i].schema&&JSON.stringify(team.schema)===scelti[i].piano&&team.human===scelti[i].human&&team.defPlay===difese[i])&&S.ctrl===controllo;
      for(const team of S.teams)E.occupanteAttacco(team,1);
      const centro=E.centroAttacco(t),nuovoForte=A.uomoDi(forte);
      const riferimentiAllineati=S.allPlayers.every(p=>{const a=A.uomoDi(p);return p.lagX===a.x&&p.lagZ===a.z;});
      G.possTeam=t;
      const memoriaCambioPulita=!D.coperturaCambio(o.players.find(p=>A.uomoDi(p)===rientrante),rientrante,centro,t.players[4],A.uomoDi);
      riposizionamenti.push({dir,schema,ripresa,liveConservaMappe,liveConservaCoordinate,resetMappe,resetAzione,invarianti,
        memoriaCambioPrima,memoriaCambioPulita,riferimentiAllineati,primaForte,centro:centro.i,dopoForte:nuovoForte.i,forteSulCentro:nuovoForte===centro,postiRicostruiti:S.teams.every(team=>team.occupantiAttacco.every((p,i)=>p===team.players[i]))});
    }
    scenaVista.renderer.render=disegna;return {zone,scene,mezze,mezzeChiuse,qualifiche,riposizionamenti,fotogrammi};
  },!!fotoDir);
  if(fotoDir){
    fs.mkdirSync(fotoDir,{recursive:true});
    for(const f of r.fotogrammi){fs.writeFileSync(path.join(fotoDir,f.nome+'.png'),Buffer.from(f.png,'base64'));delete f.png;}
    fs.writeFileSync(path.join(fotoDir,'stati.json'),JSON.stringify(r.fotogrammi,null,2)+'\n');
  }
  delete r.fotogrammi;
  console.log(JSON.stringify(r,null,2));
  for(const z of r.zone)assert.ok(z.lasciaPeriferico&&z.escludeBoa&&z.latoDopoRotazione&&z.zonaMControBoaForte,'zona usa centro e lato realmente occupati '+z.dir);
  for(const x of r.scene){
    const nome=x.tipo+' dir='+x.dir+' '+x.difesa;
    assert.ok(x.preparato&&x.primaDelRilascio&&x.rilascio!==null,nome+': appoggio autonomo e taglio soltanto al rilascio');
    assert.ok(x.palmoReale,nome+': lancio dalla mano aggiornata dal render');
    assert.equal(x.taglio,x.tipo,nome+': tipo riconosciuto');assert.ok(x.appoggioRiceve,nome+': primo passaggio ricevuto');
    assert.deepEqual(x.passaggi[0]&&[x.passaggi[0].da,x.passaggi[0].a],[x.tipo==='C'?4:6,x.tipo==='B'?5:x.tipo==='C'?6:4],nome+': primo passaggio al vicino previsto');
    assert.ok(x.nuotoD>.5&&x.metriH>1&&x.nuotoM>.1,nome+': atleti e appoggio mobili');assert.ok(x.maxPasso<.12,nome+': nuoto continuo');
    if(!x.chiuso)assert.ok(x.ritorno!==null&&x.ricezione,nome+': appoggio legge il vantaggio e serve il tagliante');
    if(x.difesa==='schierata')assert.ok(x.attesaCoperto>0,nome+': appoggio osservato con taglio ancora coperto');
    assert.equal(x.decisioniNonPronte,0,nome+': nessun servizio deciso sul tagliante ancora coperto');
    if(x.difesa==='schierata'&&x.tipo==='B')assert.equal(x.ritorno,null,nome+': copertura completa toglie il ritorno');
  }
  for(const x of r.mezze){
    const nome='D dir='+x.dir+' mano='+x.mano;
    assert.ok(x.taglio&&x.metriTarget>=.6&&x.metriTarget<=1.400001&&x.distanzaTarget<=5,nome+': scatto breve verso una finestra raggiungibile');
    assert.ok(x.palmoReale&&x.passaggioAutonomo&&x.prontaAllaScelta&&x.ricezione,nome+': la IA serve un vantaggio reale e la palla viene presa');
    assert.ok(x.tiro,nome+': dopo la ricezione libera la IA conclude autonomamente');
    assert.ok(x.nuotoD>.1&&x.metri>.3&&x.maxPasso<.12,nome+': difensore mobile e nessun salto dei quattordici atleti');
    assert.ok(x.esternoLaterale>2.5,nome+': l’esterno conserva il suo spazio laterale senza convergere sul punto');
  }
  for(const x of r.mezzeChiuse){
    assert.equal(x.partenza,false,'D '+x.motivo+': nessun taglio senza finestra o senza testa davanti');
    assert.ok(x.maxPasso<.12,'D '+x.motivo+': movimento continuo anche nella rinuncia');
  }
  for(const x of r.riposizionamenti){
    const nome=x.ripresa+' '+x.schema+' dir='+x.dir;
    assert.ok(x.liveConservaMappe&&x.liveConservaCoordinate,nome+': il recupero vivo conserva posti, uomini e coordinate');
    assert.ok(x.resetMappe&&x.resetAzione&&x.postiRicostruiti,nome+': la ricollocazione elimina le mappe e i tagli precedenti');
    assert.ok(x.invarianti,nome+': schema, difesa e controllo umano conservati');
    assert.ok(x.riferimentiAllineati&&x.memoriaCambioPrima&&x.memoriaCambioPulita,nome+': riferimenti nuovi e memoria del cambio precedente pulita');
    assert.equal(x.primaForte,4,nome+': scena con vecchia consegna persistente');
    assert.equal(x.centro,x.schema==='falso-centro'?6:1,nome+': centro del piano scelto');
    assert.ok(x.forteSulCentro,nome+': il marcatore specialista riprende il centro effettivo');
  }
  for(const x of r.qualifiche)assert.ok(x.primoToccoFermo&&x.primaCircolazioneFerma&&x.costruita&&x.ripartenzaConservata&&x.dopoFallo,'entrata dopo circolazione, ripartenza conservata e risposta al fallo '+x.dir);
  assert.deepEqual(errors,[]);console.log('PASS entrate: ciclo reale A/B/C/D, due direzioni, mani D/S, marcatori mobili e zona/falso centro');
}finally{await browser.close();await server.close();}
