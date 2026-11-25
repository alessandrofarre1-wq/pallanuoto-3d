import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { profiloTraiettoria } from '../src/profili-traiettorie.js';
import { P } from '../src/fisica-palla/parametri.js';
import { FIRMA, FINTA_AMPIEZZA, FINTA_LATO, FINTA_RITMO, TRAIETTORIE_TIRO as T } from '../src/taratura.js';
import { FINTA_MOVIMENTO } from '../src/finta-movimento.js';
// La fisica della partita usa Rapier anche qui, senza renderer o browser.
globalThis.window=globalThis;
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
const H=await import('../src/palla.js');
const { ALZATA }=await import('../src/costanti.js');
const DT=1/240,misure=[];
function misura(o,profilo){
  const B={x:o.x,y:o.y,z:o.z,...H.velocitaDiLancio(o.x,o.y,o.z,profilo.tx,profilo.ty,profilo.tz,profilo.t,profilo.giri)};
  const dir=Math.sign(o.gx-o.x),out={picco:B.y,impatto:null,uscita:null,portiere:null,porta:null,v0:Math.hypot(B.vx,B.vy,B.vz)};
  for(let i=0;i<600;i++){
    const e=H.passoPalla(B,DT,null),t=(i+1)*DT;
    out.picco=Math.max(out.picco,B.y);
    if(!out.impatto&&B.y<H.RAGGIO)out.impatto={t,x:B.x,primaPortiere:(o.gkX-B.x)*dir};
    if(!out.uscita&&out.impatto&&e.acqua?.tipo==='schizzo')out.uscita={t,x:B.x,y:B.y,vy:B.vy};
    if(!out.portiere&&(B.x-o.gkX)*dir>=0)out.portiere={t,y:B.y,vy:B.vy};
    if((B.x-o.gx)*dir>=-H.RAGGIO){out.porta={t,y:B.y,z:B.z,v:Math.hypot(B.vx,B.vy,B.vz)};break;}
    if(B.vx*dir<0)break;
  }
  return out;
}
for(const dir of [1,-1])for(const d of [4,6,8,10]){
  const o={x:(12.5-d)*dir,y:1.2,z:0,gx:12.5*dir,ay:.55,az:1.1,velocita:23,gkX:10.9*dir,lob:true};
  const p=profiloTraiettoria(o),prima=misura(o,{tx:o.gx,ty:o.ay,tz:o.az,t:Math.hypot(d,1.1)/(4.5+Math.hypot(d,1.1)*.15),giri:P.giriPalombella});
  const dopo=misura(o,p);
  assert.deepEqual(profiloTraiettoria(o),p,'profilo deterministico');
  assert.equal(p.giri,P.giriPalombella);
  assert.ok(dopo.porta&&dopo.porta.y<.9&&dopo.porta.y>H.RAGGIO,'palombella diretta nello specchio');
  assert.ok(dopo.picco<prima.picco&&dopo.porta.t<prima.porta.t,'palombella più tesa e rapida');
  if(dir===1)misure.push({tipo:'palombella',d,prima,dopo});
}
for(const dir of [1,-1])for(const gk of [10.9,11.8])for(const d of [6,8,10]){
  const o={x:(12.5-d)*dir,y:1.2,z:0,gx:12.5*dir,ay:H.RAGGIO-T.rimbalzoImmersione,az:.8,velocita:23,gkX:gk*dir,rimbalzo:true};
  const p=profiloTraiettoria(o),dopo=misura(o,p);
  const prima=misura({...o,ay:.065},{tx:o.gx,ty:.065,tz:o.az,t:Math.hypot(d,.8)/23,giri:P.giriTiro});
  assert.ok(p.rimbalzo&&dopo.impatto&&dopo.uscita,'rimbalzo dalle forze dell’acqua');
  assert.ok(dopo.impatto.primaPortiere>=.8&&dopo.impatto.primaPortiere<=1.5,'contatto 0,8–1,5m prima del portiere');
  assert.ok(dopo.uscita.vy>1,'impennata fisica visibile');
  assert.ok(dopo.portiere.y>H.RAGGIO+.075&&dopo.portiere.vy>0,'arriva al portiere già in risalita');
  assert.ok(dopo.porta&&dopo.porta.y<.9,'il profilo nominale arriva sotto la traversa');
  if(dir===1)misure.push({tipo:'rimbalzo',d,gk,prima,dopo});
}
for(const dir of [1,-1]){
  const o={x:4.5*dir,y:1.2,z:0,gx:12.5*dir,ay:.71,az:1.25,velocita:23,gkX:10.9*dir};
  const p=profiloTraiettoria(o),m=misura(o,p);
  assert.equal(p.giri,P.giriTiro,'tiro alto forte: spin da tiro, non da palombella');
  assert.ok(m.porta&&m.porta.y<.7894&&Math.abs(m.porta.z)<1.3894,'quadrella nominale entro la porta utile');
  assert.ok(m.picco-o.y<.025&&m.porta.t<.4&&m.v0>=22&&m.v0<=26,'forte quasi dritto, velocità professionistica');
  if(dir===1)misure.push({tipo:'forte',d:8,dopo:m});
}

// Eseguiamo le funzioni di produzione con soli servizi di partita sostituiti:
// niente grafica, ma launch/velocitaDiLancio, errori e azioni restano reali.
const sorgente=await readFile(new URL('../src/tiri.js',import.meta.url),'utf8');
const corpo=sorgente.replace(/^import .*;.*\n/gm,'').replace(/^export \{.*\};.*\n/gm,'').replace(/\bexport /g,'');
const ball={},game={time:10,state:'play',penalty:null},teams=[{idx:0,dir:1,human:true,short:'ITA',players:[]},{idx:1,dir:-1,short:'HUN',players:[]}],allPlayers=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),other=t=>teams[1-t.idx],goalX=t=>12.5*t.dir;
let caso=.5,profiloScelto;
const contesto={ball,game,teams,allPlayers,clamp,dist,other,goalX,P,T,FIRMA,ALZATA,FINTA_MOVIMENTO,FINTA_AMPIEZZA,FINTA_LATO,FINTA_RITMO,
  fintaDi:()=>({largo:.5}),firmaFinta:()=>({largo:.5,verso:'avanti',piegato:false}),versoFinta:()=>'avanti',profiloTraiettoria:o=>{profiloScelto=profiloTraiettoria(o);return profiloScelto;},velocitaDiLancio:H.velocitaDiLancio,rnd:()=>caso,gauss:()=>0,
  azioneAperta:()=>null,tipoDiTiro:()=> 'fuori',registraTiro:()=>{},registraTiroReplay:()=>{},paloCoperto:()=>0,postoPortiere:()=>0,manUp:()=>false,firma:()=>false};
const tiro=new Function(...Object.keys(contesto),corpo+'\nreturn {doShoot,launch,startAct,updateActs};')(...Object.values(contesto));
const p={team:teams[0],x:4.5,z:0,fx:1,fz:0,ballW:[4.5,1.2,0],stamina:1,s:{pot:76.25,pre:90,frz:85,res:85},st:{sht:.9},fakeCount:0};
const gk={team:teams[1],x:10.9,z:.2,vz:0,isGK:true};teams[0].players=[p];teams[1].players=[gk];allPlayers.push(p,gk);
ball.holder=p;ball.costoTentativoPortiere=true;ball.deviataInPorta=true;
tiro.doShoot(p,1,false,.9);
assert.equal(ball.lob,false);assert.equal(ball.crossZ,.9*1.28,'mira manuale conservata');
assert.ok(Math.abs(Math.hypot(ball.wx,ball.wz)-P.giriTiro)<1e-9,'doShoot passa spin esplicito anche in alto');
assert.equal(ball.costoTentativoPortiere,false);assert.equal(ball.deviataInPorta,false);
assert.equal(ball.tentativoPortiere,null);assert.equal(ball.contattoPortiere,null);assert.equal(ball.parataRegistrata,false);
tiro.launch(p,8,.95,0,.4,'pass');assert.ok(Math.abs(Math.hypot(ball.wx,ball.wz)-P.giriPassaggio)<1e-9,'passaggio conserva lo spin');
ball.holder=p;p.fakeCount=0;tiro.doShoot(p,.4,true,0);assert.equal(ball.lob,true,'palombella umana senza nuovo requisito di finta');

// Rigori: potenza piena non impone la quadrella alta. Le due direzioni e
// i due estremi della distribuzione mantengono forza e spin, con mira manuale prioritaria.
const quoteRigore=[];
for(const dir of [1,-1])for(const r of [.02,.5,.98]){
  caso=r;teams[0].dir=dir;teams[1].dir=-dir;p.x=4.5*dir;p.fx=dir;p.ballW=[p.x,1.2,0];gk.x=10.9*dir;gk.z=.2*dir;
  p.stamina=1;ball.holder=p;game.penalty=null;tiro.doShoot(p,1,false,.7);
  const velocitaForte=Math.hypot(ball.vx,ball.vy,ball.vz);
  assert.ok(profiloScelto.ty>=T.quadrellaY&&profiloScelto.ty<=T.quadrellaY+T.quadrellaAltezza,'forte in azione conserva quadrella');
  p.stamina=1;ball.holder=p;game.penalty=p;tiro.doShoot(p,1,false,null);
  quoteRigore.push(profiloScelto.ty);assert.equal(ball.rigore,true);assert.equal(ball.shotPower,1);
  assert.ok(Math.abs(profiloScelto.ty-(.15+r*.55))<1e-12,'bersagli naturali bassi/alti sul rigore');
  assert.ok(Math.abs(Math.hypot(ball.vx,ball.vy,ball.vz)-velocitaForte)/velocitaForte<.03,'potenza nominale conservata');
  assert.ok(Math.abs(Math.hypot(ball.wx,ball.wz)-P.giriTiro)<1e-9);
  p.stamina=1;ball.holder=p;tiro.doShoot(p,1,false,.7);assert.equal(ball.crossZ,.7*1.28,'mira manuale anche sul rigore');
}
assert.ok(Math.min(...quoteRigore)<.2&&Math.max(...quoteRigore)>.65,'rigori alti e bassi disponibili');
caso=.5;game.penalty=null;teams[0].dir=1;teams[1].dir=-1;p.x=4.5;p.fx=1;p.ballW=[4.5,1.2,0];gk.x=10.9;gk.z=.2;

const ia=await readFile(new URL('../src/ia.js',import.meta.url),'utf8');
const aiSource=ia.slice(ia.indexOf('export function aiShoot('),ia.indexOf('export function aiPass(')).replace('export ','');
let finte=0;
const ai=new Function('fintaDi','startAct','doFake','ball','game','doShoot','shotKind','rnd',aiSource+'\nreturn aiShoot;')(
  ()=>({wind:.17,pausa:[.35,.6]}),tiro.startAct,q=>{finte++;q.fakeCount++;q.ultimaFintaT=game.time;},ball,game,tiro.doShoot,()=> 'shot',()=>.5);
ball.holder=p;ball.state='held';p.fakeCount=0;p.act=null;ai(p,.4,true);
assert.equal(p.act.kind,'fake','CPU prepara almeno una finta personale');
tiro.updateActs(p.act.wind+p.act.frusta-.001);assert.equal(finte,0,'effetto della finta non anticipato');
const fintaCPU=p.act;
tiro.updateActs(.002);assert.equal(finte,1);assert.equal(p.act.kind,'lob');assert.equal(ball.state,'held');
// v0.85: la palombella parte a braccio tornato carico (ritorno della finta più FINTA_RITMO.attesa), non a metà del ritorno
const lobCPU=p.act;assert.ok(lobCPU.wind>=fintaCPU.recupero+FINTA_RITMO.attesa-.002-1e-9,'palombella dopo il ritorno della finta');
tiro.updateActs(lobCPU.wind+lobCPU.frusta-.002);assert.equal(ball.state,'held','palombella non anticipata');
tiro.updateActs(.004);assert.equal(ball.lob,true);assert.equal(ball.state,'flight');
ball.holder=p;p.act=null;ai(p,.4,true);assert.equal(p.act.kind,'lob','una finta già completata basta');
console.log(JSON.stringify(misure,null,2));
console.log('PASS traiettorie v071: 22 scene/42 voli Rapier, spin/mira/reset di doShoot, preparazione CPU e comando umano');
