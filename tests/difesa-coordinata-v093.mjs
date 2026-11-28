// Difesa coordinata: fixture geometriche, funzioni reali, nessuna partita completa.
// node tests/difesa-coordinata-v093.mjs [--root=checkout] [--misure=file.json]
// Soglie definite sulla v0.92 PR75 prima della correzione: 2,2 m dal nuovo uomo,
// almeno 0,7 m di spostamento aggiuntivo per contare un aiuto, non oltre due
// consegne per atleta in sei secondi di passaggi. Le posizioni non si integrano:
// si verificano decisione, bersaglio scelto e copertura della consegna lasciata.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const root=path.resolve(arg('root')||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const misure=arg('misure')&&path.resolve(arg('misure'));
const limiti={bersaglio:2.2,recuperoZona:3.6,aiutoAggiuntivo:.7,stacchiSenzaConsegna:1,cambiPerAtleta:2,durata:6};
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false,watch:null}});
let browser;
const errori=[];
let risultati=[];
try{
  await server.listen();
  const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||
    ['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].find(p=>fs.existsSync(p));
  browser=await chromium.launch({executablePath,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:844,height:390}});
  page.on('pageerror',e=>errori.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.__rnd=()=>.5;});
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>window.__pallanuoto?.allPlayers?.length===14,null,{timeout:60000,polling:100});
  risultati=await page.evaluate(async L=>{
    const [S,A,E,Q,C]=await Promise.all(['stato','ia','entrate','schemi','centroboa'].map(n=>import('/src/'+n+'.js')));
    const G=S.game,B=S.ball,[att,dif]=S.teams,dt=1/60,out=[];
    let numero=0;
    const lunghezza=(p,q)=>Math.hypot(p.x-q.x,p.z-q.z);
    const mappa=()=>dif.players.map(p=>A.uomoDi(p)?.i??null);
    const biunivoca=()=>{const m=mappa().slice(1);return m.length===6&&new Set(m).size===6&&m.every(i=>i>=1&&i<=6);};
    const metti=(p,d,z,dir)=>Object.assign(p,{x:(12.5-d)*dir,z:z*dir,vx:0,vz:0});
    const aggiornaLag=()=>{for(const p of S.allPlayers){const q=A.uomoDi(p);p.lagX=q.x;p.lagZ=q.z;}};
    function palla(h){
      Object.assign(B,{state:'held',holder:h,x:h.x,y:.1,z:h.z,vx:0,vy:0,vz:0,kind:null,target:null,shooter:null,
        afterShot:false,lastTeam:att,flightT:0,holdTime:.2});
    }
    function prepara(dir,mano,preset=2){
      Object.assign(G,{state:'play',time:100+ ++numero*20,possT:90+numero*20,possTeam:att,period:1,clock:120,shot:20,
        autoplay:false,after:null,penalty:null,scattando:false,fermoFallo:null,passaggi:2});
      S.setCtrl(null);Object.assign(S.fight,{active:false,boa:null,def:null});
      att.dir=dir;dif.dir=-dir;
      for(const t of S.teams){
        E.resetDisposizioneTattica(t);Q.applicaSchema(t,Q.copiaSchema('arco'));
        Object.assign(t,{human:false,defPlay:t===dif?preset:2,contro:null,prossimoScambioRientro:0,scambi:0,scambiRientro:0,
          postiT:-1,rallT:-1,rall:null,centroT:-1,doubleP:null,doubleUntil:0,posti:null,coda:[],cambio:null});
      }
      for(const p of S.allPlayers){
        Object.assign(p,{excluded:false,uscendo:false,stunUntil:0,act:null,cut:null,girata:null,charging:false,freeThrow:false,
          pressatoUntil:0,stamina:1,mano,scambiatoFino:0,appoggio:null,scivolaAI:false,rientro:null,fx:p.team.dir,fz:0});
        p.scheda={...p.scheda,ruolo:p.i};
      }
      const lato=mano==='S'?-1:1;
      const posti={0:[24.3,0],1:[2.7,0],2:[3.8,2.4*lato],3:[6.8,-5*lato],4:[7,3*lato],5:[8.3,5.6*lato],6:[7.5,-2.5*lato]};
      for(const p of att.players)metti(p,...posti[p.i],dir);
      for(const p of dif.players){
        const q=A.uomoDi(p);
        if(p.isGK)metti(p,.7,0,dir);
        else Object.assign(p,{x:q.x+dir*.8,z:q.z});
      }
      const q=att.players[2],cedente=dif.players.find(p=>A.uomoDi(p)===q),subentrante=dif.players.find(p=>A.uomoDi(p)===att.players[4]);
      metti(cedente,7.3,2.8*lato,dir);metti(subentrante,3,3.2*lato,dir);
      palla(att.players[6]);aggiornaLag();
      return {dir,mano,preset,lato,q,cedente,subentrante};
    }
    function decidi(durata=.6){
      for(let i=0;i<Math.round(durata/dt);i++){G.time+=dt;A.aggiornaDifesa(dif,dt);aggiornaLag();}
    }
    const coord=(p,dir)=>({d:+(12.5-p.x*dir).toFixed(3),z:+(p.z*dir).toFixed(3)});
    function bersaglio(p,dir){const t=A.markTarget(p);return {uomo:A.uomoDi(p)?.i,target:coord(t,dir),distanza:+lunghezza(t,A.uomoDi(p)).toFixed(3)};}
    function registra(caso,f,bene,dati){out.push({caso,dir:f.dir,mano:f.mano,preset:f.preset,bene:!!bene,...dati});}
    // Una consegna utile ha due estremi: il nuovo marcatore chiude il fuggitivo
    // e il cedente può davvero raggiungere il precedente uomo del compagno.
    for(const dir of [1,-1])for(const mano of ['D','S'])for(const preset of [2,1,3]){
      const f=prepara(dir,mano,preset),lasciato=A.uomoDi(f.subentrante),prima=mappa();
      const precondizioni=!f.q.cut&&lunghezza(f.cedente,f.q)>3.4&&lunghezza(f.subentrante,f.q)<1.5&&lunghezza(f.cedente,lasciato)<1;
      decidi();const nuovo=dif.players.find(p=>!p.isGK&&A.uomoDi(p)===f.q),nuovoUomo=A.uomoDi(f.cedente);
      const targetNuovo=nuovo&&A.markTarget(nuovo),targetCedente=A.markTarget(f.cedente);
      registra('sfuggito-senza-taglio',f,precondizioni&&nuovo!==f.cedente&&nuovoUomo!==f.q&&
        lunghezza(targetNuovo,f.q)<=L.bersaglio&&lunghezza(targetCedente,nuovoUomo)<=(preset===2?L.bersaglio:L.recuperoZona)&&biunivoca()&&dif.defPlay===preset,
      {precondizioni,prima,dopo:mappa(),subentrante:nuovo?.i,cedente:f.cedente.i,nuovoUomo:nuovoUomo?.i,
        nuovo:nuovo&&bersaglio(nuovo,dir),recupero:bersaglio(f.cedente,dir),biunivoca:biunivoca(),presetFinale:dif.defPlay});
    }
    // Il candidato più vicino difende una minaccia più grave che il cedente,
    // lontano oltre 4,5 m, non può rilevare. La falsa soluzione non è un cambio.
    for(const dir of [1,-1])for(const mano of ['D','S'])for(const minaccia of ['boa','portatore']){
      const f=prepara(dir,mano),q=f.q;
      for(const p of dif.players)if(!p.isGK)metti(p,9,-6*f.lato,dir);
      metti(q,3.2,1.5*f.lato,dir);metti(f.cedente,8,-3.5*f.lato,dir);
      const grave=minaccia==='boa'?att.players[1]:att.players[6],marcatore=dif.players.find(p=>!p.isGK&&A.uomoDi(p)===grave);
      if(minaccia==='boa'){metti(grave,2.7,0,dir);metti(marcatore,2.1,.6*f.lato,dir);}
      else{metti(grave,5,1.5*f.lato,dir);metti(marcatore,3.5,1.5*f.lato,dir);}
      q.cut={phase:0,t0:G.time,x:q.x,z:q.z};palla(att.players[6]);aggiornaLag();
      const precondizioni=lunghezza(f.cedente,grave)>4.5&&lunghezza(marcatore,q)<2&&lunghezza(marcatore,grave)<1.8&&
        Math.abs(marcatore.x-12.5*dir)<Math.abs(q.x-12.5*dir)+.35;
      const prima=mappa();decidi();const target=A.markTarget(marcatore);
      registra('non-abbandona-'+minaccia,f,precondizioni&&A.uomoDi(marcatore)===grave&&lunghezza(target,grave)<=L.bersaglio&&biunivoca(),
        {precondizioni,prima,dopo:mappa(),marcatore:marcatore.i,minaccia:grave.i,target:bersaglio(marcatore,dir),biunivoca:biunivoca()});
    }
    // Le forme previste da zona/M sono ammesse. Si conta soltanto chi cambia
    // bersaglio quando si apre la stessa linea di servizio al centro.
    for(const dir of [1,-1])for(const mano of ['D','S'])for(const preset of [2,1,3]){
      const f=prepara(dir,mano,preset),boa=E.centroAttacco(att),dc=dif.players.find(p=>A.uomoDi(p)===boa),h=att.players[6];
      metti(h,7.5,5.5*f.lato,dir);
      for(const [i,d,z] of [[2,4,-4.7],[3,7,-5.5],[4,8,-2.5],[5,8.7,-5]])metti(att.players[i],d,z*f.lato,dir);
      for(const p of dif.players)if(!p.isGK){const q=A.uomoDi(p);Object.assign(p,{x:q.x+.8*dir,z:q.z});}
      const dx=h.x-boa.x,dz=h.z-boa.z,l=Math.hypot(dx,dz);
      Object.assign(dc,{x:boa.x+dx/l*.8,z:boa.z+dz/l*.8});palla(h);aggiornaLag();
      const chiusa=C.leggiCentro(boa,dc,h).ricevibile===false;
      A.aggiornaDifesa(dif,dt);const prima=new Map(dif.players.filter(p=>!p.isGK).map(p=>[p,A.markTarget(p)]));
      metti(dc,1.9,0,dir);G.time+=.1;dif.centroT=-1;dif.aiutoStato=null;A.aggiornaDifesa(dif,dt);
      const aperta=C.leggiCentro(boa,dc,h).ricevibile===true,spostati=[];
      for(const p of dif.players){
        if(p.isGK||p===dc)continue;const t=A.markTarget(p),cambiamento=lunghezza(t,prima.get(p));
        if(cambiamento>L.aiutoAggiuntivo)spostati.push({difensore:p.i,uomo:A.uomoDi(p).i,metri:+cambiamento.toFixed(3),target:coord(t,dir)});
      }
      registra('un-aiuto-centro',f,chiusa&&aperta&&spostati.length<=L.stacchiSenzaConsegna&&biunivoca()&&dif.defPlay===preset,
        {chiusa,aperta,spostati,biunivoca:biunivoca(),presetFinale:dif.defPlay});
    }
    // In rientro ctrl non riceve né cede consegne automatiche. Si verifica
    // l'identità dell'uomo oltre al mantenimento del controller e delle coordinate.
    for(const dir of [1,-1])for(const mano of ['D','S'])for(const ruolo of ['cedente','subentrante']){
      const f=prepara(dir,mano),h=att.players[6];metti(h,13,-2.5*f.lato,dir);
      metti(f.cedente,10,2.8*f.lato,dir);metti(att.players[4],9.6,2.8*f.lato,dir);palla(h);
      const umano=ruolo==='cedente'?f.cedente:f.subentrante;dif.human=true;S.setCtrl(umano);aggiornaLag();
      const prima=mappa(),uomo=A.uomoDi(umano),pos=[umano.x,umano.z];decidi();
      registra('umano-'+ruolo,f,A.uomoDi(umano)===uomo&&S.ctrl===umano&&umano.x===pos[0]&&umano.z===pos[1]&&biunivoca(),
        {prima,dopo:mappa(),umano:umano.i,uomoPrima:uomo.i,uomoDopo:A.uomoDi(umano).i,controller:S.ctrl?.i,biunivoca:biunivoca()});
    }
    // Due tagli già presenti e passaggi ripetuti fra i mezzi: non si deve
    // risolvere il secondo pericolo annullando continuamente la prima consegna.
    for(const dir of [1,-1])for(const mano of ['D','S'])for(const preset of [2,1,3]){
      const f=prepara(dir,mano,preset),q2=att.players[3],a2=dif.players.find(p=>A.uomoDi(p)===q2),b2=dif.players.find(p=>A.uomoDi(p)===att.players[5]);
      metti(q2,3.8,-2.4*f.lato,dir);metti(a2,7.3,-2.8*f.lato,dir);metti(b2,3,-3.2*f.lato,dir);
      metti(att.players[5],7,-3*f.lato,dir);metti(att.players[6],8.6,0,dir);
      for(const q of [f.q,q2])q.cut={phase:0,t0:G.time,x:q.x,z:q.z};
      const cambi=Object.fromEntries(dif.players.filter(p=>!p.isGK).map(p=>[p.i,0]));let precedente=mappa(),sempreBiunivoca=true;
      for(let i=0;i<Math.round(L.durata/dt);i++){
        palla(att.players[Math.floor(i/24)%2?4:5]);G.time+=dt;A.aggiornaDifesa(dif,dt);aggiornaLag();
        const corrente=mappa();for(let j=1;j<corrente.length;j++)if(corrente[j]!==precedente[j])cambi[j]++;
        precedente=corrente;sempreBiunivoca&&=biunivoca();
      }
      const prese=[f.q,q2].map(q=>{const p=dif.players.find(d=>!d.isGK&&A.uomoDi(d)===q);return {uomo:q.i,marcatore:p?.i,target:p&&bersaglio(p,dir)};});
      registra('due-pericoli-passaggi',f,sempreBiunivoca&&Math.max(...Object.values(cambi))<=L.cambiPerAtleta&&
        prese.every(x=>x.target&&x.target.distanza<=L.bersaglio)&&dif.defPlay===preset,
        {cambi,prese,biunivoca:sempreBiunivoca,presetFinale:dif.defPlay});
    }
    for(const dir of [1,-1])for(const mano of ['D','S']){
      const f=prepara(dir,mano),h=att.players[6],uscente=dif.players[4];metti(h,14,0,dir);palla(h);
      for(const p of dif.players)if(!p.isGK)metti(p,2+p.i*.2,p.i*.5*f.lato,dir);
      metti(uscente,12.9,0,dir);uscente.uscendo=true;metti(dif.players[1],12.3,1.8*f.lato,dir);aggiornaLag();
      const targets=dif.players.filter(p=>!p.isGK).map(p=>({p:p.i,uscendo:p.uscendo,target:A.aiTarget(p)}));
      registra('uscente-non-rallenta',f,!targets.find(x=>x.p===uscente.i).target.rallenta&&targets.some(x=>!x.uscendo&&x.target.rallenta),
        {targets:targets.map(x=>({...x,target:{...coord(x.target,dir),rallenta:!!x.target.rallenta}}))});
    }
    return out;
  },limiti);
}catch(e){errori.push(e.stack||String(e));}
finally{await browser?.close();await server.close();}

const falliti=risultati.filter(r=>!r.bene);
if(misure){fs.mkdirSync(path.dirname(misure),{recursive:true});fs.writeFileSync(misure,JSON.stringify({root,limiti,totale:risultati.length,falliti:falliti.length,errori,scene:risultati},null,2)+'\n');}
for(const caso of new Set(risultati.map(r=>r.caso))){
  const scene=risultati.filter(r=>r.caso===caso),ko=scene.filter(r=>!r.bene);
  console.log(`${ko.length?'✗':'✓'} ${caso}: ${scene.length-ko.length}/${scene.length}`);
  for(const r of ko.slice(0,2))console.log(JSON.stringify(r));
}
for(const e of errori)console.error(e);
console.log(`Difesa coordinata: ${risultati.length-falliti.length}/${risultati.length}, errori pagina/esecuzione: ${errori.length}${misure?', misure '+misure:''}`);
process.exitCode=falliti.length||errori.length||!risultati.length?1:0;
