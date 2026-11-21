// Espulsione attraverso la sirena, l'intervallo e uno scatto vero della partita.
// Una squadra ha nuotatori più rapidi per rendere ripetibili i due esiti dello scatto;
// il possesso iniziale non viene assegnato dal test. Dopo lo scatto perso il portiere
// avversario conserva la palla soltanto per isolare la scadenza della sanzione.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const salva=process.argv.find(a=>a.startsWith('--salva='))?.slice(8);
const server=await createServer({logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errori=[];
  page.on('pageerror',e=>errori.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.__rnd=()=>.5;});
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{timeout:120000,polling:100});
  const r=await page.evaluate(async()=>{
    const [S,P,R,M,Q]=await Promise.all(['stato','partita','regole','menu','pozzetto'].map(n=>import('/src/'+n+'.js')));
    const H=window.__pallanuoto,G=S.game,B=S.ball,dt=1/60,scene=[];
    H.scegliSquadre('ITA','HUN');H.imposta('len','480');
    function prepara(k,dir,nostra,falli){
      M.newMatch();G.autoplay=true;S.setCtrl(null);
      const t=S.teams[k],o=S.teams[1-k];t.dir=dir;o.dir=-dir;
      for(const team of S.teams){team.human=false;team.timeouts=0;team.coda=[];team.cambio=null;team.prossimoControllo=Infinity;}
      R.kickoff();
      Object.assign(G,{state:'play',time:100,clock:.02,period:1,after:null,scattando:false});
      const vincente=nostra?t:o;
      for(const p of S.allPlayers){p.s={...p.s,vel:p.team===vincente?99:40,res:99};p.st=H.prova.valoriMotore(p.s);p.stamina=1;p.tackleCD=0;p.colpi=[];}
      const p=t.players[4],poz=Q.puntoPozzetto(t);Object.assign(p,{x:poz.x,z:poz.z,pf:falli-1});
      R.giveBall(o.players[0]);R.exclude(p,o.players[0],'prova fine tempo');
      return {t,o,p,vincente,scheda:p.scheda,deadline:p.exclUntil,falli};
    }
    function caso(k,dir,nostra,falli){
      const c=prepara(k,dir,nostra,falli),{t,o,p,vincente,scheda}=c;
      for(let f=0;f<10&&G.state==='play';f++)P.update(dt);
      const residuoSirena=p.exclUntil-G.time,fuoriAllaSirena=p.excluded;
      for(let f=0;f<240&&G.state!=='countdown';f++)P.update(dt);
      const poz=Q.puntoPozzetto(t),inizio={periodo:G.period,escluso:p.excluded,nelPozzetto:p.alPozzetto,
        distanzaPozzetto:Math.hypot(p.x-poz.x,p.z-poz.z),residuo:p.exclUntil-G.time,falli:p.pf,identita:p.scheda===scheda};
      const tempoIntervallo=G.time;
      for(let f=0;f<240&&G.state==='countdown';f++)P.update(dt);
      const residuoAlVia=p.exclUntil-G.time,clockAlVia=G.clock,intervalloFermo=Math.abs(G.time-tempoIntervallo)<1e-9;
      let durataScatto=0,uscitoNelloScatto=false;
      for(let f=0;f<60*20&&!G.possTeam;f++){
        P.update(dt);durataScatto+=dt;uscitoNelloScatto||=!p.excluded;
      }
      const primaPresa={squadra:G.possTeam?.idx,escluso:p.excluded,attivi:t.players.filter(q=>!q.excluded).length,
        residuo:p.exclUntil-G.time,clock:G.clock,identita:p.scheda===scheda,falli:p.pf,scattando:G.scattando};
      let scadenza=null;
      if(!nostra&&G.possTeam===vincente){
        const da=G.time,atteso=p.exclUntil-G.time,gk=o.players[0];
        for(let f=0;f<60*22&&p.excluded;f++){
          if(B.holder!==gk)R.giveBall(gk);
          B.holdTime=0;gk.decideT=gk.reazioneT=99;gk.act=null;
          P.update(dt);
        }
        scadenza={atteso,trascorso:G.time-da,escluso:p.excluded,attivi:t.players.filter(q=>!q.excluded).length,
          identita:p.scheda===scheda,falli:p.pf,vecchioFuori:!!scheda.fuori};
      }
      scene.push({k,dir,nostra,falli,fuoriAllaSirena,residuoSirena,inizio,intervalloFermo,
        residuoAlVia,clockAlVia,durataScatto,uscitoNelloScatto,primaPresa,scadenza});
    }
    for(const k of [0,1])for(const dir of [1,-1])for(const nostra of [false,true])caso(k,dir,nostra,1);
    for(const k of [0,1])for(const nostra of [false,true])caso(k,k===0?1:-1,nostra,3);
    M.newMatch();
    const nuova={nessunEspulso:S.allPlayers.every(p=>!p.excluded),deadlinePulite:S.allPlayers.every(p=>p.exclUntil===0),
      primoTempo:G.period===1,countdown:G.state==='countdown',scattoNuovo:G.scattando===true};
    return {scene,nuova};
  });
  console.log(JSON.stringify(r,null,2));if(salva)fs.writeFileSync(salva,JSON.stringify(r,null,2)+'\n');
  for(const s of r.scene){
    const nome=`squadra${s.k} dir${s.dir} ${s.nostra?'scatto vinto':'scatto perso'} pf${s.falli}`;
    assert.ok(s.fuoriAllaSirena&&s.inizio.periodo===2&&s.inizio.escluso&&s.inizio.nelPozzetto,nome+': espulsione attraversa il periodo');
    assert.ok(s.inizio.distanzaPozzetto<.01&&s.inizio.identita&&s.inizio.falli===s.falli,nome+': attesa nel pozzetto, identità e falli conservati');
    assert.ok(s.intervalloFermo&&Math.abs(s.residuoSirena-s.residuoAlVia)<1e-8,nome+': sanzione ferma nell’intervallo e nel countdown');
    assert.ok(s.durataScatto>1&&Math.abs(s.primaPresa.clock-s.clockAlVia)<1e-8,nome+': scatto nuotato e cronometro fermo fino alla prima presa');
    assert.equal(s.primaPresa.squadra,s.nostra?s.k:1-s.k,nome+': esito determinato dalla presa fisica');
    assert.equal(s.primaPresa.scattando,false,nome+': prima presa chiude lo scatto');
    if(s.nostra){
      assert.ok(!s.primaPresa.escluso&&s.primaPresa.attivi===7,nome+': riconquista permette il rientro');
      if(s.falli===3)assert.ok(!s.primaPresa.identita&&s.primaPresa.falli<3,nome+': subentra riserva al permesso di rientro');
    }else{
      assert.ok(!s.uscitoNelloScatto&&s.primaPresa.escluso&&s.primaPresa.attivi===6&&s.primaPresa.identita,nome+': avversari mantengono superiorità precedente');
      assert.ok(Math.abs(s.primaPresa.residuo-s.residuoAlVia)<1e-7,nome+': residuo non consumato durante lo scatto');
      assert.ok(s.scadenza&&!s.scadenza.escluso&&s.scadenza.attivi===7&&Math.abs(s.scadenza.trascorso-s.scadenza.atteso)<.04,nome+': rientro solo al termine effettivo del residuo');
      if(s.falli===3)assert.ok(!s.scadenza.identita&&s.scadenza.falli<3&&s.scadenza.vecchioFuori,nome+': terzo fallo non anticipa la riserva');
    }
  }
  assert.ok(Object.values(r.nuova).every(Boolean),'nuova partita elimina sanzioni e apre il proprio scatto');
  assert.deepEqual(errori,[]);console.log('PASS espulsioni/tempi: 12 scatti reali, residui, terzo fallo e nuova partita');
}finally{await browser.close();await server.close();}
