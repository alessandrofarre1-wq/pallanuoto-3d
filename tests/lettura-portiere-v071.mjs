import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
globalThis.window={__rnd:()=>{throw new Error('La lettura del portiere non deve estrarre il caso');}};
const {creaTentativoPortiere}=await import('../src/parata-portiere.js');

// Eseguiamo gkTarget di produzione senza caricare renderer o browser.
const sorgente=await readFile(new URL('../src/ia.js',import.meta.url),'utf8');
const corpo=sorgente.slice(sorgente.indexOf('export function gkTarget('),sorgente.indexOf('// steering behaviors:')).replace('export ','');
const ball={},GW=1.5,letture=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const contesto={ball,GW,clamp,ownGoalX:t=>-12.5*t.dir,pos01:()=>.5,
  postoPortiere:(t,x,z)=>{letture.push({t,x,z});return .31;},
  muroSu:()=>null,paloCoperto:()=>0,fintaLatoAttiva:()=>0,FINTA_LATO:{portiere:.2},
  setCtrl:()=>{throw new Error('gkTarget non deve cambiare il giocatore controllato');}};
const gkTarget=new Function(...Object.keys(contesto),corpo+'\nreturn gkTarget;')(...Object.values(contesto));
const corpoTarget=sorgente.slice(sorgente.indexOf('export function aiTarget('),sorgente.indexOf('// ultimo minuto dell\'ultimo tempo,')).replace('export ','');
const chiamate=[],game={possTeam:null};let sette=false,vagante=true,inseguitore=null;
const contestoTarget={ball,game,gkTarget,
  setteControSei:()=>{chiamate.push('7v6');return sette;},goalX:t=>12.5*t.dir,
  pallaVagante:()=>{chiamate.push('vagante');return vagante;},
  chiVaSullaPalla:()=>{chiamate.push('inseguitore');return {chi:new Set([inseguitore]),x:10,z:.7};}};
const aiTarget=new Function(...Object.keys(contestoTarget),corpoTarget+'\nreturn aiTarget;')(...Object.values(contestoTarget));

for(const dir of [1,-1])for(const human of [false,true]){
  const team={dir:-dir,human},attacco={dir,human:!human};
  const p={uid:4,num:1,scheda:{},team,isGK:true,x:11.8*dir,z:.1*dir,fx:-dir,fz:0,stamina:1,s:{rif:85}};
  function prepara({riuscita=true,kind='shot',volo=.4}={}){
    Object.assign(ball,{state:'flight',kind,daTiro:true,shooter:{team:attacco},holder:null,
      x:8*dir,y:1.2,z:.3*dir,vx:22*dir,vy:-1.9,vz:5.4*dir,flightT:volo,crossZ:-1.49*dir,revisioneTiro:7});
    const parata=creaTentativoPortiere(p,ball,{probabilita:riuscita?1:0,caso:.5,time:10});
    parata.revisione=ball.revisioneTiro;p.tentativoPortiere=ball.tentativoPortiere=parata;
    return parata;
  }
  for(const kind of ['shot','rebound'])for(const riuscita of [true,false]){
    const parata=prepara({riuscita,kind}),prima={x:p.x,z:p.z,team:p.team};
    ball.flightT=parata.voloInizio+parata.reazione/2;
    assert.equal(gkTarget(p).z,p.z,'prima della reazione il corpo resta sul proprio lato');
    assert.equal(gkTarget(p).tuffo,false);
    ball.flightT=parata.voloInizio+parata.reazione+.01;
    const target=gkTarget(p),bersaglio=riuscita?parata.bersaglio:parata.bersaglioLetto;
    assert.equal(target.z,clamp(bersaglio[2],-GW-.2,GW+.2),'corpo e braccia leggono lo stesso bersaglio');
    assert.equal(target.tuffo,true);assert.equal(target.gk,true);
    assert.deepEqual({x:p.x,z:p.z,team:p.team},prima,'il target AI non muove né prende il controllo del portiere umano');
    if(!riuscita)assert.notEqual(Math.sign(target.z-p.z),Math.sign(parata.bersaglio[2]-p.z),'la lettura fallita resta sul lato opposto');
    inseguitore=p;game.possTeam=team;sette=true;vagante=true;chiamate.length=0;
    assert.deepEqual(aiTarget(p),target,'il tiro in arrivo ha priorità anche sull’inseguimento del rebound e sul 7 contro 6');
    assert.deepEqual(chiamate,[],'il tiro in arrivo non attiva palla vagante, inseguitore o 7 contro 6');
    assert.equal(aiTarget(p).sprint,undefined,'nessuno sprint che bypassi la lettura del portiere');
  }
  // Una deviazione invalida la vecchia lettura e fa ripartire il tempo di reazione.
  let parata=prepara();ball.flightT=.8;ball.revisioneTiro++;
  assert.equal(gkTarget(p).z,p.z,'non usa il profilo precedente dopo una deviazione');
  parata=prepara({kind:'rebound',volo:.8});ball.flightT=.8+parata.reazione/2;
  assert.equal(gkTarget(p).z,p.z,'il tempo di volo precedente non anticipa la nuova reazione');
  for(const altera of [
    q=>{q.attiva=false;},q=>{q.gid++;},q=>{q.num++;},q=>{q.scheda={};},
    q=>{q.fine=0;},q=>{q.revisione++;},q=>{ball.tentativoPortiere={...q};},
    q=>{ball.flightT=q.voloInizio-.01;}
  ]){
    const q=prepara();ball.flightT=q.voloInizio+q.reazione+.01;altera(q);
    assert.equal(gkTarget(p).z,p.z,'nessun tuffo usando un profilo inattivo, vecchio, in recupero o di un’altra identità');
    assert.equal(gkTarget(p).tuffo,false);
  }
  prepara();ball.vx=-ball.vx;letture.length=0;
  assert.equal(gkTarget(p).z,.31,'un tiro che si allontana torna al normale piazzamento');
  assert.equal(letture.length,1);
  ball.kind='rebound';sette=false;chiamate.length=0;
  assert.deepEqual(aiTarget(p),{x:10,z:.7,sprint:true},'la respinta che si allontana conserva l’inseguitore');
  assert.deepEqual(chiamate,['7v6','vagante','inseguitore']);
  prepara();ball.daTiro=false;
  assert.equal(gkTarget(p).z,.31,'un volo estraneo al tiro conserva il piazzamento ordinario');
  Object.assign(ball,{kind:'pass',target:{},flightT:.1,tx:6*dir,tz:-.8*dir});
  letture.length=0;gkTarget(p);
  assert.equal(letture.at(-1).x,ball.x,'il passaggio non viene anticipato prima del normale ritardo');
  ball.flightT=.5;gkTarget(p);
  assert.equal(letture.at(-1).x,ball.tx);assert.equal(letture.at(-1).z,ball.tz,'lettura dei passaggi invariata');
  vagante=false;chiamate.length=0;
  assert.deepEqual(aiTarget(p),gkTarget(p),'un passaggio conserva il normale target del portiere');
  assert.deepEqual(chiamate,['7v6','vagante']);
}
console.log('PASS lettura portiere v071: due versi, reazione, riuscita/fallita, deviazioni, identità/recupero, priorità AI su tiro/rebound, inseguitore uscente, squadra umana e passaggi');
