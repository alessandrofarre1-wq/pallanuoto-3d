// Entrate osservate nel ciclo reale: nessun passaggio imposto e tutti i marcatori nuotano con la loro IA.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const server=await createServer({logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.__casoEntrate=.5;window.__rnd=()=>window.__casoEntrate;});
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:120000});
  const r=await page.evaluate(async()=>{
    const [S,P,A,E,T,Q,R,I,V,D]=await Promise.all(['stato','partita','ia','entrate','tiri','schemi','regole','input','replay','difesa-cambi'].map(n=>import('/src/'+n+'.js')));
    const [vista,scenaVista]=await Promise.all([import('/src/grafica/render.js'),import('/src/grafica/scena.js')]);
    const H=window.__pallanuoto,G=S.game,B=S.ball,dt=1/60;let scena=0;
    const disegna=scenaVista.renderer.render;scenaVista.renderer.render=()=>{};H.replay.forzaRegistrazione=false;
    const put=(p,d,z,dir)=>Object.assign(p,{x:(12.5-d)*dir,z:z*dir,vx:0,vz:0});
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
    scenaVista.renderer.render=disegna;return {zone,scene,qualifiche,riposizionamenti};
  });
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
  assert.deepEqual(errors,[]);console.log('PASS entrate: ciclo reale A/B/C, due direzioni, marcatori mobili e zona/falso centro');
}finally{await browser.close();await server.close();}
