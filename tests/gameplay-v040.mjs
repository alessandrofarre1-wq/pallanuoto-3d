// Scene ripetibili: comandi anticipati, passaggi leggibili, linee di appoggio e vantaggi AI.
// --prima carica i tre moduli dalla v0.39 per misurare le stesse scene prima della correzione.
// --riferimento=<commit> permette di scegliere un'altra base, senza dipendere dal nuovo HEAD.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const prima=process.argv.includes('--prima');
const riferimento=process.argv.find(a=>a.startsWith('--riferimento='))?.slice('--riferimento='.length)||'0998d8942c357d719ddf14fb3874c19786d0e556';
const originali=new Map();
if(prima) for(const f of ['controllo','tiri','ia']) originali.set(path.join(root,'src',f+'.js'),execFileSync('git',['show',riferimento+':src/'+f+'.js'],{cwd:root,encoding:'utf8'}));
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:4374,strictPort:true},
  plugins:[{name:'gameplay-prima',enforce:'pre',load:id=>originali.get(id)}]});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    let a=44;window.__rnd=()=>{ a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296; };
    window.requestAnimationFrame=()=>1;
  });
  await page.goto('http://127.0.0.1:4374');
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:60000});
  const risultati=await page.evaluate(async()=>{
    const [C,T,A,I,S,K]=await Promise.all([import('/src/controllo.js'),import('/src/tiri.js'),import('/src/ia.js'),import('/src/input.js'),import('/src/stato.js'),import('/src/costanti.js')]);
    const H=window.__pallanuoto,G=S.game,B=S.ball,dt=1/60;let scena=0;
    function prepara(i=6,team=0){
      C.resetTap();G.state='play';G.autoplay=false;G.time=100+(++scena)*10;G.possT=G.time;G.penalty=null;G.possTeam=S.teams[team];G.shot=24;G.clock=180;G.period=1;S.fight.active=false;
      for(const t of S.teams){t.timeouts=0;t.human=t.idx===0;t.atkPlay=0;t.cross=false;}
      for(const q of S.allPlayers){Object.assign(q,{x:-10+q.i*.1,z:-8,vx:0,vz:0,fx:1,fz:0,oriz:0,act:null,cut:null,appoggio:null,charging:false,chargeT:0,excluded:false,uscendo:false,pressatoUntil:0,stunUntil:0,freeThrow:false,stamina:1,reazioneT:0,shootNext:false,contactT:0});}
      const p=S.teams[team].players[i];p.x=4;p.z=0;S.teams[1-team].players[0].x=K.HL*S.teams[team].dir;S.teams[1-team].players[0].z=0;
      H.regole.giveBall(p);S.setCtrl(p);B.x=p.x;B.z=p.z;G.passaggi=0;
      for(const k in I.keys) I.keys[k]=false;I.pollInput();I.pollInput();return p;
    }
    function frame(p){G.time+=dt;T.updateActs(dt);C.humanControl(p,dt);}
    function tocco(p,key){
      // Questo controllo riguarda il buffer touch; la tastiera ha una prova
      // dedicata per il nuovo passaggio al rilascio di D.
      if(key==='pass'){I.touch.btn.pass=true;I.pollInput();C.humanControl(p,dt);I.touch.btn.pass=false;I.pollInput();}
      else {I.keys[key]=true;I.pollInput();C.humanControl(p,dt);I.keys[key]=false;I.pollInput();}
    }
    function finta(p,wind=.18){let fine=null;T.startAct(p,'fake',wind,()=>{fine=G.time;});return ()=>fine;}
    function buffer(key,modifica){
      const p=prepara(),m=p.team.players[4];m.x=7;m.z=4;
      // v0.88: la palombella si comanda solo quando compare (portiere fuori dai pali, controfuga.js): il portiere avversario esce di 2,5 m
      if(key==='KeyL'){const gk=S.teams[1].players[0];gk.x-=S.teams[0].dir*2.5;}
      const fine=finta(p);
      // Il comando si anticipa di150ms sul gesto effettivo, anche quando la
      // finta ha un accenno più lungo; la finestra del buffer resta200ms.
      while(p.act&&!p.act.done&&p.act.wind+p.act.frusta-p.act.t>.15)frame(p);
      tocco(p,key);if(modifica) modifica(p);let inizio=null;
      for(let i=0;i<50;i++){frame(p);if(!inizio&&p.act&&p.act.kind!=='fake')inizio=G.time;}
      return {esecuzioni:G.passaggi,azione:B.kind,ritardo:inizio&&fine()?+(inizio-fine()).toFixed(4):null};
    }
    const passaggio=buffer('pass'),palombella=buffer('KeyL');
    const passaggioPressato=buffer('pass',p=>{p.pressatoUntil=G.time+2;});
    const tiroAnticipato=buffer('KeyK');
    const pressione=buffer('KeyL',p=>{p.pressatoUntil=G.time+2;});
    const libero6=buffer('KeyL',p=>{p.x=9;p.freeThrow=true;});
    const cambio=buffer('pass',p=>{const q=p.team.players[3];S.setCtrl(q);C.humanControl(q,dt);S.setCtrl(p);});
    const fallo=buffer('pass',p=>{p.act=null;p.freeThrow=true;});
    const possesso=buffer('pass',p=>{H.regole.giveBall(S.teams[1].players[4]);H.regole.giveBall(p);});
    const reset=buffer('pass',()=>C.resetTap());
    const early=(()=>{const p=prepara();p.team.players[4].x=7;p.team.players[4].z=4;finta(p,.4);tocco(p,'pass');for(let i=0;i<55;i++)frame(p);return G.passaggi;})();
    const stabile=(()=>{
      const p=prepara();p.s={...p.s,vis:40};for(const m of p.team.players)m.excluded=m!==p&&m.i!==4&&m.i!==5;
      for(const i of [4,5]){p.team.players[i].x=7;p.team.players[i].z=i===4?3:-3;}
      return new Set(Array.from({length:200},()=>T.humanPassTarget(p,0,0)?.uid)).size;
    })();
    const linee=(()=>{
      const h=prepara(4),t=h.team;for(const p of t.players){if(p.isGK)continue;const f=K.FORM_UP[p.i];p.x=K.HL-f[0];p.z=f[1];}
      B.x=h.x;B.z=h.z;const p=t.players[2],o=S.teams[1].players[1];S.teams[1].players[6].excluded=true;
      o.x=h.x+(p.x-h.x)*.6;o.z=h.z+(p.z-h.z)*.6;
      const inizio=T.laneClear(h,p.x,p.z,t),x0=p.x,z0=p.z;let apre=null,spostamento=0,minCompagni=99;
      const bersaglio=A.attackTarget(p),targetLibero=T.laneClear(h,bersaglio.x,bersaglio.z,t);
      for(let i=0;i<150;i++){
        G.time+=dt;const tg=A.attackTarget(p),dx=tg.x-p.x,dz=tg.z-p.z,d=Math.hypot(dx,dz),v=Math.min(1,d/.8);
        H.prova.movePlayer(p,d>.12?dx/d*v:0,d>.12?dz/d*v:0,false,dt);
        spostamento=Math.max(spostamento,Math.hypot(p.x-x0,p.z-z0));
        for(const q of t.players)if(q!==p&&!q.excluded)minCompagni=Math.min(minCompagni,K.dist(p,q));
        if(apre===null&&T.laneClear(h,p.x,p.z,t))apre=+(i*dt).toFixed(3);
      }
      return {inizio,targetLibero,apre,spostamento:+spostamento.toFixed(3),minCompagni:+minCompagni.toFixed(3)};
    })();
    function reazione(tipo){
      const p=prepara(4,1),t=p.team;p.x=-5.5;p.z=0;p.decideT=.65;S.setCtrl(null);B.holdTime=.3;
      const m=t.players[5];m.x=-7;m.z=3;
      for(const o of S.teams[0].players){o.x=9;o.z=-8;}S.teams[0].players[0].x=-K.HL;S.teams[0].players[0].z=0;
      if(tipo==='pressione'){S.teams[0].players[4].x=p.x+.8;S.teams[0].players[4].z=p.z;p.pressatoUntil=G.time+1;}
      if(tipo==='libero6'){p.x=-9;p.freeThrow=true;}
      if(tipo==='tiro'){p.ricevutoPassaggio=true;p.ricevutoT=G.time;p.provaLiberato=p.ricevutoT;p.vuoleLiberato=true;/* v0.59: il tiro subito si decide una volta per ricezione (TIRO_LIBERATO): qui la decisione è «tira» */p.x=-6.5;m.x=5;m.z=8;}
      if(tipo==='vantaggio'){S.teams[0].players[4].x=p.x+.8;S.teams[0].players[4].z=p.z+1;m.x=-8;m.z=2;}
      let tempo=null,azione=null;
      for(let i=0;i<42;i++){G.time+=dt;B.holdTime+=dt;A.aiCarrier(p,dt);if(p.act){tempo=+((i+1)*dt).toFixed(3);azione=p.act.kind;break;}}
      return {tempo,azione};
    }
    return {passaggio,palombella,passaggioPressato,tiroAnticipato,pressione,libero6,cambio,fallo,possesso,reset,early,stabile,linee,ai:{pressione:reazione('pressione'),vantaggio:reazione('vantaggio'),tiro:reazione('tiro'),libero6:reazione('libero6')}};
  });
  console.log((prima?'PRIMA':'DOPO')+' gameplay v0.40 '+JSON.stringify(risultati));
  assert.deepEqual(errors,[],'nessun errore nella pagina');
  for(const k of ['pressione','libero6','cambio','fallo','possesso','reset'])assert.equal(risultati[k].esecuzioni,0,'nessun passaggio residuo: '+k);
  assert.notEqual(risultati.pressione.azione,'shot','pressione rispettata');assert.notEqual(risultati.libero6.azione,'shot','tiro libero nei 6 m rispettato');
  assert.equal(risultati.tiroAnticipato.azione,null,'il buffer non trasforma TIRO in un tiro speciale o automatico');
  assert.equal(risultati.early,0,'il tocco troppo anticipato non resta in attesa');
  if(!prima){
    assert.equal(risultati.passaggio.esecuzioni,1,'un tocco anticipato produce un solo passaggio');
    assert.equal(risultati.passaggioPressato.esecuzioni,1,'sotto pressione resta possibile passare');
    assert.ok(risultati.passaggio.ritardo<=1/60+.0001,'passaggio al primo fotogramma lecito');
    assert.equal(risultati.palombella.azione,'shot','palombella anticipata eseguita');
    assert.ok(risultati.palombella.ritardo<=1/60+.0001,'palombella al primo fotogramma lecito');
    assert.equal(risultati.stabile,1,'stessa scena e direzione producono lo stesso ricevente');
    assert.equal(risultati.linee.inizio,false);assert.equal(risultati.linee.targetLibero,true,'il compagno cerca una linea aperta');
    assert.ok(risultati.linee.apre!==null&&risultati.linee.apre<2,'il movimento apre davvero la linea entro 2 secondi');
    assert.ok(risultati.linee.spostamento<1.6&&risultati.linee.minCompagni>1.5,'ruolo e distanze preservati');
    for(const tipo of ['pressione','vantaggio','libero6']){assert.equal(risultati.ai[tipo].azione,'pass');assert.ok(risultati.ai[tipo].tempo<=.15,'AI reagisce al vantaggio: '+tipo);}
    assert.ok(risultati.ai.tiro.tempo<=.15&&risultati.ai.tiro.azione!=='pass','AI sfrutta una ricezione libera utile');
  }
} finally {await browser.close();await server.close();}
