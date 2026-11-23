// Scatto iniziale: scelta libera dal ruolo, schieramento e nuoto vero dopo il via.
// --solo-dati esegue soltanto i controlli puri; --salva=file.json conserva le misure.
// --foto=cartella abilita soltanto 4 disegni: countdown e 1s di nuoto, nei due versi.
// Una sola pagina, RAF fermo: nessun disegno ordinario o partita completa.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { scegliScattista, formazioneScatto, stessaFormazioneScatto } from '../src/scatto-inizio.js';

const salva=process.argv.find(a=>a.startsWith('--salva='))?.slice(8);
const foto=process.argv.find(a=>a.startsWith('--foto='))?.slice(7);
if(foto)fs.mkdirSync(foto,{recursive:true});
const corsie=[0,2.5,7.5,-7.5,5,-5,-2.5];
const vicino=(a,b,tol=1e-8)=>Math.abs(a-b)<tol;

function provaDati(){
  const t={dir:1,players:Array.from({length:7},(_,i)=>({i,num:i+1,isGK:i===0,excluded:i===2,uscendo:i===3,
    s:{vel:[99,80,99,99,88,88,82][i]},scheda:{numero:i+1}}))};
  const prima=JSON.stringify(t),scelto=t.players[4];
  assert.equal(scegliScattista(t),scelto,'velocità reale: nessun privilegio al posto6, esclusi GK/espulsi/uscenti');
  assert.equal(scegliScattista({...t,players:t.players.toReversed()}),scelto,'parità risolta per indice, indipendente dall’ordine');
  for(const dir of [1,-1]){
    t.dir=dir;
    const linea=-12.5*dir,f=formazioneScatto(t,linea,corsie),n=f.posizioni.find(v=>v.p===scelto),g=f.posizioni.find(v=>v.p.isGK);
    assert.ok(n&&vicino(n.x,linea+dir*.3)&&n.z===0,'scattista al centro, appena dentro la linea di porta');
    assert.ok(g&&vicino(g.x,linea+dir*.7)&&vicino(g.z,3.75*dir),'portiere laterale fuori dal corridoio centrale');
    assert.ok(!f.posizioni.some(v=>v.p.excluded),'espulso non ricollocato fra gli attivi');
    assert.equal(new Set(f.posizioni.map(v=>v.z)).size,f.posizioni.length,'corsie iniziali distinte');
    assert.ok(stessaFormazioneScatto(f,formazioneScatto(t,linea,corsie)),'stesso schieramento riconosciuto senza ricollocare');
    assert.ok(!stessaFormazioneScatto(f,formazioneScatto(t,linea+.1,corsie)),'linea di porta modificata invalida lo schieramento');
    t.dir=-dir;
    assert.ok(!stessaFormazioneScatto(f,formazioneScatto(t,-linea,corsie)),'cambio campo invalida lo schieramento');
    t.dir=dir;
    const vecchia=scelto.scheda;scelto.scheda={numero:24};
    assert.ok(!stessaFormazioneScatto(f,formazioneScatto(t,linea,corsie)),'subentro nello stesso corpo riconosciuto');
    scelto.scheda=vecchia;
  }
  t.dir=1;
  assert.equal(JSON.stringify(t),prima,'le funzioni pure non cambiano statistiche, identità o schieramento');
  assert.equal(scegliScattista({players:t.players.map(p=>({...p,excluded:true}))}),null,'nessun nuotatore se manca un atleta eleggibile');
  return {scelto:scelto.i,paritaDeterministica:true,direzioni:2,purezza:true};
}

const dati=provaDati();
if(process.argv.includes('--solo-dati')){
  if(salva)fs.writeFileSync(salva,JSON.stringify({dati},null,2)+'\n');
  console.log('PASS scatto iniziale, dati puri: '+JSON.stringify(dati));
}else{
  const [{chromium},{createServer}]=await Promise.all([import('playwright'),import('vite')]);
  const server=await createServer({logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false}});
  await server.listen();
  const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:844,height:390}}),errori=[];
    page.on('pageerror',e=>errori.push(e.message));
    await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.__casoProva=.5;window.__rnd=()=>window.__casoProva;});
    await page.goto(server.resolvedUrls.local[0]);
    await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{timeout:120000,polling:100});
    const r=await page.evaluate(async(foto)=>{
      const [S,P,R,M,I,Q,PB,V]=await Promise.all(['stato','partita','regole','menu','input','pozzetto','panchina','replay'].map(n=>import('/src/'+n+'.js')));
      const H=window.__pallanuoto,G=S.game,B=S.ball,dt=1/60,scene=[],fotografie=[];
      const disegna=H.renderer.render.bind(H.renderer);
      H.renderer.render=()=>{};
      const [vista,scenaVista]=foto?await Promise.all([import('/src/grafica/render.js'),import('/src/grafica/scena.js')]):[];
      const pose=foto?await import('/src/grafica/pose.js'):null;
      let visualizza=false,tempoVista=0;
      function avanza(){
        P.update(dt);
        // Anche senza GPU il rig deve ricevere tutti i fotogrammi: saltarli
        // lascia il busto nella posa precedente mentre le gambe sono già a crawl.
        if(visualizza){tempoVista+=dt;for(const p of S.allPlayers)pose.updateRig(p,dt,tempoVista);}
      }
      function scatta(nome,dir){
        if(!foto)return;
        vista.render(0,tempoVista*1000);
        // Campo della squadra umana, dalla stessa distanza nei due versi.
        const c=scenaVista.camera,primaPos=c.position.clone(),primaQ=c.quaternion.clone(),primaFov=c.fov;
        c.position.set(-dir*8,8,13);c.lookAt(-dir*8,0,0);c.fov=40;c.updateProjectionMatrix();c.updateMatrixWorld();
        disegna(scenaVista.scene,c);
        fotografie.push({nome,png:H.renderer.domElement.toDataURL('image/png')});
        c.position.copy(primaPos);c.quaternion.copy(primaQ);c.fov=primaFov;c.updateProjectionMatrix();c.updateMatrixWorld();
      }
      H.scegliSquadre('ITA','HUN');H.imposta('len','480');
      const posizioni=()=>S.allPlayers.map(p=>[p.x,p.z]);
      const distanza=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
      const ferme=(a,b)=>a.every((v,i)=>distanza(v,b[i])<1e-10);
      function prepara(periodo,dir){
        I.resetInput();V.interrompiReplay();G.autoplay=false;
        M.newMatch();
        Object.assign(G,{period:periodo,time:100+periodo*20,clock:480,possT:0,after:null,penalty:null,rigoriFinali:null,
          rigoreDifferito:null,fermoFallo:null,autoplay:false});
        S.fight.active=false;
        const indici=[2+(periodo-1)%4,5-(periodo-1)%4];
        for(const t of S.teams){
          Object.assign(t,{dir:t.idx?-dir:dir,human:t.idx===0,timeouts:0,coda:[],cambio:null,prossimoControllo:Infinity});
          for(const p of t.players){
            Object.assign(p,{excluded:false,uscendo:false,alPozzetto:false,puoRientrare:false,pf:0,exclUntil:0,stamina:1,
              stunUntil:0,pressatoUntil:0,tackleCD:99,colpi:[],act:null,charging:false,chargeT:0,rientro:null,girata:null,
              decideT:99,reazioneT:99,freeThrow:false,perno:false,scivolaAI:false,oriz:0});
            p.s={...p.s,vel:p.isGK?99:p.i===1?99:p.i===indici[t.idx]?(t.idx?94:97):55+p.i,res:99};
            p.st=H.prova.valoriMotore(p.s);delete p.ballW;delete p.ballVistaW;
          }
          const e=t.players[1];Object.assign(e,{excluded:true,exclUntil:G.time+12,pf:1});
        }
        // Un vecchio tiro non può attribuire proprietà alla palla dello scatto.
        Object.assign(B,{kind:'shot',target:S.teams[0].players[6],shooter:S.teams[1].players[4],afterShot:true,
          daTiro:true,inRete:true,ignora:S.teams[0].players[0]});
        const stats=S.allPlayers.map(p=>JSON.stringify({s:p.s,st:p.st}));
        R.kickoff();
        return {indici,stats};
      }
      function via(dirFoto=null){
        const prima=posizioni(),tempo=G.time,clock=G.clock,residui=S.teams.map(t=>t.players[1].exclUntil-G.time);
        let immobili=true,passi=0;
        while(G.state==='countdown'&&passi<240){
          avanza();immobili&&=ferme(prima,posizioni());passi++;
          if(dirFoto!==null&&passi===30)scatta(`tempo1-dir${dirFoto}-countdown`,dirFoto);
        }
        return {prima,tempo,clock,residui,immobili,passi,state:G.state,time:G.time,alVia:posizioni(),clockAlVia:G.clock};
      }
      for(const periodo of [1,2,3,4])for(const dir of [1,-1]){
        visualizza=!!foto&&periodo===1;
        const {indici,stats}=prepara(periodo,dir),prima=posizioni();
        const iniziale={controllato:S.ctrl?.i,corpi:S.allPlayers.length,gruppi:new Set(S.allPlayers.map(p=>p.mesh.g)).size,
          selezionati:S.teams.map(t=>t.scattoInizio?.nuotatore?.i),
          nuotatori:S.teams.map(t=>{const p=t.scattoInizio.nuotatore;return {x:p.x,z:p.z,dir:t.dir,linea:S.ownGoalX(t)};}),
          portieri:S.teams.map(t=>({x:t.players[0].x,z:t.players[0].z,dir:t.dir,linea:S.ownGoalX(t)})),
          espulsi:S.teams.map(t=>{const p=t.players[1],q=Q.puntoPozzetto(t);return {escluso:p.excluded,nelPozzetto:p.alPozzetto,d:Math.hypot(p.x-q.x,p.z-q.z)};}),
          minimaSeparazione:Math.min(...S.teams.flatMap(t=>t.players.filter(p=>!p.excluded).flatMap((p,i,a)=>a.slice(i+1).map(q=>Math.hypot(p.x-q.x,p.z-q.z))))),
          pallaPulita:B.state==='free'&&!B.holder&&!B.kind&&!B.target&&!B.shooter&&!B.afterShot&&!B.daTiro&&!B.inRete&&!B.ignora&&B.x===0&&B.z===0};
        const conto=via(visualizza?dir:null);
        avanza();
        const primo={nuotatori:S.teams.map((t,k)=>{const p=t.scattoInizio.nuotatore,j=S.allPlayers.indexOf(p);return {avanzamento:(p.x-prima[j][0])*t.dir,d:distanza(prima[j],[p.x,p.z]),sprint:p.sprinting};}),
          portieri:S.teams.map(t=>({z:t.players[0].z,rientra:Math.abs(t.players[0].z)<3.75})),
          clock:G.clock,scattando:G.scattando};
        let vecchie=posizioni(),maxPasso=0,clockFermo=true,residuiFermi=true,ritornoPortieri=false,durata=dt;
        for(let f=0;f<720&&!G.possTeam;f++){
          avanza();durata+=dt;
          // Il rientro regolamentare dal pozzetto conserva il suo percorso:
          // la continuità qui riguarda i 12 atleti partiti sulla linea.
          const nuove=posizioni();maxPasso=Math.max(maxPasso,...nuove.map((v,i)=>S.allPlayers[i].i===1?0:distanza(v,vecchie[i])));vecchie=nuove;
          clockFermo&&=Math.abs(G.clock-conto.clock)<1e-8;
          residuiFermi&&=S.teams.every((t,k)=>Math.abs(t.players[1].exclUntil-G.time-conto.residui[k])<1e-7);
          if(durata>=2.8)ritornoPortieri||=S.teams.every(t=>Math.abs(t.players[0].z)<.25);
          if(visualizza&&f===58){scatta(`tempo1-dir${dir}-nuoto-1s`,dir);visualizza=false;}
        }
        const p=B.holder;
        scene.push({periodo,dir,indici,iniziale,conto,primo,durata,maxPasso,clockFermo,residuiFermi,ritornoPortieri,
          presa:{squadra:G.possTeam?.idx??null,indice:p?.i??null,scattista:!!p&&p===p.team.scattoInizio.nuotatore,
            scattando:G.scattando,stato:B.state,distanza:p?Math.hypot(B.x-p.x,B.z-p.z):null},
          statisticheIntatte:S.allPlayers.every((q,i)=>JSON.stringify({s:q.s,st:q.st})===stats[i]),
          nessunBonusStamina:S.allPlayers.every(q=>q.stamina<=1),corpiFinali:S.allPlayers.length});
      }
      // La levetta prevale sull'avvio automatico; CAMBIA conserva il nuovo atleta.
      prepara(1,1);via();
      H.camera.position.set(0,15,17);H.camera.lookAt(0,0,0);H.camera.updateMatrixWorld();
      const nuotatore=S.ctrl,z0=nuotatore.z;
      I.keys.ArrowDown=true;for(let i=0;i<30;i++)P.update(dt);I.keys.ArrowDown=false;
      const manuale={laterale:nuotatore.z-z0,sprint:nuotatore.sprinting,controllo:S.ctrl===nuotatore};
      I.keys.KeyC=true;P.update(dt);I.keys.KeyC=false;P.update(dt);
      const selezionato=S.ctrl,partenzaNuotatore=nuotatore.x;
      for(let i=0;i<60;i++)P.update(dt);
      const fermo=[selezionato.x,selezionato.z];let controlloConservato=true;
      for(let i=0;i<60;i++){P.update(dt);controlloConservato&&=S.ctrl===selezionato;}
      Object.assign(manuale,{cambiato:selezionato!==nuotatore,controlloConservato,scattando:G.scattando,
        selezionatoFermo:distanza(fermo,[selezionato.x,selezionato.z]),sprintSelezionato:selezionato.sprinting,
        nuotatoreAI:(nuotatore.x-partenzaNuotatore)*nuotatore.team.dir});
      // Cambio libero vero nel countdown: il subentro cambia anche lo scattista.
      prepara(2,-1);
      const t=S.teams[0],vecchio=t.scattoInizio.nuotatore,posto=t.players[5],riserva=t.rosa.find(g=>!g.inAcqua&&!g.fuori&&g.ruolo!==0);
      const valoriRiserva=riserva.s;riserva.s={...riserva.s,vel:99};
      const tempoPrima=G.time,chiesto=PB.chiediCambio(t,posto,riserva,true);P.update(dt);
      const cambio={chiesto,nelCountdown:G.state==='countdown',tempoFermo:G.time===tempoPrima,identita:posto.scheda===riserva,
        piuVeloce:t.scattoInizio.nuotatore===posto,controllato:S.ctrl===posto,centro:posto.z===0,
        precedenteDiLato:vecchio!==posto&&Math.abs(vecchio.z)>1,nessunMoto:S.allPlayers.every(p=>p.vx===0&&p.vz===0)};
      const contoCambio=via();cambio.fermoFinoAlVia=contoCambio.immobili;
      riserva.s=valoriRiserva;
      // Una rubata nel percorso reale dello slancio riprende subito il comando
      // di uscita, senza continuare a nuotare contro il vecchio portatore.
      prepara(1,1);I.resetInput();
      Object.assign(G,{state:'play',scattando:false,clock:180,shot:28,after:null});
      for(const t of S.teams)Object.assign(t,{timeouts:0,contro:null,cambio:null,coda:[],prossimoControllo:Infinity});
      for(const p of S.allPlayers)Object.assign(p,{x:p.team.idx?9:-9,z:5+p.i*.5,vx:0,vz:0,excluded:false,uscendo:false,
        stunUntil:G.time+100,act:null,charging:false,cut:null,girata:null,contactT:0,pressatoUntil:0,turnedUntil:0,
        lunge:0,sfondaT:0,tackleCD:100,colpi:[],oriz:0,orizPrec:0,fx:p.team.dir,fz:0});
      const recuperante=S.teams[0].players[3],avversario=S.teams[1].players[3];
      Object.assign(avversario,{x:0,z:0,vx:0,vz:0,fx:-1,fz:0,decideT:99,reazioneT:99});
      Object.assign(recuperante,{x:-.78,z:0,vx:1,vz:0,fx:1,fz:0,stunUntil:0,tackleCD:0,lunge:G.time+.4});
      R.giveBall(avversario);S.setCtrl(recuperante);
      H.camera.position.set(0,15,17);H.camera.lookAt(0,0,0);H.camera.updateMatrixWorld();
      I.keys.ArrowLeft=true;window.__casoProva=0;
      const clockRubata=G.clock;P.update(dt);I.keys.ArrowLeft=false;window.__casoProva=.5;
      const rubata={state:G.state,cronometro:clockRubata-G.clock,holder:B.holder===recuperante,
        possesso:G.possTeam===recuperante.team,nessunaRipresa:!G.after&&!G.fermoFallo,
        slancioFinito:recuperante.lunge===0,colpi:recuperante.colpi.length};
      return {scene,manuale,cambio,rubata,fotografie};
    },!!foto);
    const fotografie=r.fotografie;delete r.fotografie;
    for(const f of fotografie)fs.writeFileSync(`${foto}/${f.nome}.png`,Buffer.from(f.png.split(',')[1],'base64'));
    r.fotografie=fotografie.map(f=>f.nome);
    const rapporto=salva||(foto?`${foto}/misure.json`:null);
    if(rapporto)fs.writeFileSync(rapporto,JSON.stringify({dati,...r,errori},null,2)+'\n');
    for(const s of r.scene){
      const nome=`tempo${s.periodo} dir${s.dir}`;
      assert.deepEqual(s.iniziale.selezionati,s.indici,nome+': più veloci disponibili, entrambi fuori dal posto6');
      assert.equal(s.iniziale.controllato,s.indici[0],nome+': umano sullo scattista');
      assert.ok(s.iniziale.nuotatori.every(p=>p.z===0&&vicino(p.x,p.linea+p.dir*.3)),nome+': scattisti al centro sulla propria linea');
      assert.ok(s.iniziale.portieri.every(p=>vicino(p.x,p.linea+p.dir*.7)&&vicino(p.z,p.dir*3.75)),nome+': portieri laterali in acqua');
      assert.ok(s.iniziale.espulsi.every(p=>p.escluso&&p.nelPozzetto&&p.d<1e-8),nome+': sanzioni residue conservate nel pozzetto');
      assert.ok(s.iniziale.minimaSeparazione>.75&&s.iniziale.pallaPulita,nome+': nessun ammasso né vecchio stato del tiro');
      assert.ok(s.conto.immobili&&s.conto.passi>=180&&s.conto.state==='play'&&vicino(s.conto.time,s.conto.tempo),nome+': countdown immobile, tempo effettivo fermo');
      assert.deepEqual(s.conto.alVia,s.conto.prima,nome+': il fischio non teletrasporta gli atleti');
      assert.ok(s.primo.nuotatori.every(p=>p.avanzamento>0&&p.d<.08&&p.sprint),nome+': primo passo con nuoto e sprint normali');
      assert.ok(s.primo.portieri.every(p=>p.rientra&&Math.abs(p.z)>3.5),nome+': il portiere inizia a rientrare senza salto');
      assert.ok(s.primo.scattando&&vicino(s.primo.clock,s.conto.clock)&&s.clockFermo&&s.residuiFermi,nome+': cronometro e residuo congelati fino alla prima presa');
      assert.ok(s.ritornoPortieri&&s.maxPasso<.1,nome+': rientro nuotato, nessun salto durante lo scatto');
      assert.ok(s.durata>2&&s.durata<12&&s.presa.squadra!==null&&s.presa.scattista&&s.presa.stato==='held'&&!s.presa.scattando,nome+': possesso determinato dalla vera prima presa');
      assert.ok(s.presa.distanza<.61&&s.statisticheIntatte&&s.nessunBonusStamina,nome+': nessun possesso assegnato o bonus di statistiche');
      assert.equal(s.iniziale.corpi,14);assert.equal(s.iniziale.gruppi,14);assert.equal(s.corpiFinali,14);
    }
    assert.ok(r.manuale.laterale>.2&&!r.manuale.sprint&&r.manuale.controllo,'input manuale laterale prevale sull’avvio automatico');
    assert.ok(r.manuale.cambiato&&r.manuale.controlloConservato&&r.manuale.scattando,'CAMBIA manuale conservato durante lo scatto');
    assert.ok(r.manuale.selezionatoFermo<.01&&!r.manuale.sprintSelezionato&&r.manuale.nuotatoreAI>2,'il nuovo selezionato si ferma; lo scattista continua con l’IA');
    assert.ok(Object.values(r.cambio).every(Boolean),'cambio reale nel countdown: nuova identità più veloce al centro prima del via');
    assert.ok(r.rubata.state==='play'&&vicino(r.rubata.cronometro,1/60)&&r.rubata.holder&&r.rubata.possesso&&
      r.rubata.nessunaRipresa&&r.rubata.slancioFinito&&r.rubata.colpi===1,'rubata pulita nello slancio: possesso vivo e nessun falso fallo in attacco');
    assert.deepEqual(errori,[],'nessun errore JavaScript');
    console.log('PASS scatto iniziale: dati puri, 8 scatti fisici, controllo manuale, cambio nel countdown e rubata pulita');
    console.log(JSON.stringify({scene:r.scene.map(s=>({periodo:s.periodo,dir:s.dir,scattisti:s.indici,durata:s.durata,maxPasso:s.maxPasso,presa:s.presa})),manuale:r.manuale,cambio:r.cambio,rubata:r.rubata}));
  }finally{await browser.close();await server.close();}
}
