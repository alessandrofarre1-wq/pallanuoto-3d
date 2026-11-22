// Regole, lanci, contatti e Rapier reali; solo disegno, cronaca e input sono sostituiti.
// Nessuna posizione/velocità viene corretta dopo il lancio delle scene touch→out.
// --regole-prima=/tmp/regole-prima.js usa lo stesso test con il sorgente precedente.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';

const prima=process.argv.find(a=>a.startsWith('--regole-prima='))?.slice(15),base=new URL('../src/',import.meta.url).href;
const salva=process.argv.find(a=>a.startsWith('--salva='))?.slice(8);
const originale=prima?fs.readFileSync(prima,'utf8'):null;
const stub=new Map([
  ['grafica/modello.js','export const makePlayerMesh=()=>({g:{visible:true}}),coloraGiocatore=()=>{};'],
  ['grafica/costumi.js','export const profiloCostume=()=>({});'],
  ['grafica/scena.js','export const spawnFoam=()=>{};'],
  ['cronaca.js','export const eventi=[];export const annuncia=(tipo,testo,opzioni={})=>eventi.push({tipo,testo,...opzioni});'],
  ['input.js','export const inp={x:0,z:0},prev={},inputEpoch=0,pressed=()=>false,released=()=>false,rumble=()=>{},pollInput=()=>{};'],
  ['menu.js','export const endMatch=()=>{};'],
]);
registerHooks({load(url,context,next){
  if(url.startsWith(base)){
    const name=url.slice(base.length);
    if(stub.has(name))return {format:'module',shortCircuit:true,source:stub.get(name)};
    if(name.endsWith('.json'))return {format:'module',shortCircuit:true,source:'export default '+fs.readFileSync(new URL(url),'utf8')};
    if(prima&&name==='regole.js')return {format:'module',shortCircuit:true,source:originale};
  }
  return next(url,context);
}});
let caso=.999;
globalThis.window=globalThis;window.__rnd=()=>caso;
const S=await import('../src/stato.js'),C=await import('../src/costanti.js');
const J=await import('../src/giocatori.js'),R=await import('../src/regole.js'),F=await import('../src/fisica.js');
const T=await import('../src/tiri.js'),Q=await import('../src/schemi.js');
const ST=await import('../src/statistiche.js'),N=await import('../src/cronaca.js');
const partita=await import('../src/partita.js');
const B=S.ball,G=S.game,dt=1/60,misure=[];
function prepara(dir,side=1,idx=0){
  J.applicaSquadre('ITA','HUN');ST.azzeraStatistiche();N.eventi.length=0;caso=.999;
  const att=S.teams[idx],dif=S.other(att),p=att.players[4],gk=dif.players[0];att.dir=dir;dif.dir=-dir;
  Object.assign(G,{state:'play',time:100,possT:100,possTeam:att,shot:7,period:1,clock:180,penalty:null,
    rigoriFinali:null,rigoreDifferito:null,fermoFallo:null,after:null,scattando:false,autoplay:false});
  S.setCtrl(gk);S.fight.active=false;
  for(const t of S.teams){
    Q.applicaSchema(t,Q.copiaSchema('arco'));Object.assign(t,{human:true,contro:null,accoppiamenti:null});
    for(const q of t.players)Object.assign(q,{x:-5*dir,z:-side*7,vx:0,vz:0,fx:q.team.dir,fz:0,
      excluded:false,uscendo:false,cut:null,act:null,charging:false,stamina:1,stunUntil:1e9,
      freeThrow:false,tentativoPortiere:null,pressatoUntil:0,fakeUntil:0,fakedUntil:0,turnedUntil:0,
      fintaFino:0,fintaLato:null,ultimaFintaT:-1e9,oriz:0,orizPrec:0,ballW:null,ballVistaW:null});
  }
  Object.assign(B,{state:'held',holder:p,x:p.x,z:p.z,y:.6,kind:null,target:null,lastTeam:att,
    afterShot:false,daTiro:false,inRete:false,inUscita:false,pickupCD:99,holdTime:.4,
    parataRegistrata:false,parataDaRegistrare:null,contattoPortiere:null,tentativoPortiere:null});
  R.giveBall(p);G.shot=side>0?7:24;
  return {att,dif,p,gk,dir,side};
}
function lancia(s,{x,y=.6,z,tx,ty=y,tz,t=.15,tiro=true}){
  const {p}=s;Object.assign(p,{x,z,fx:s.dir,fz:0,ballW:[x,y,z]});
  T.launch(p,tx,ty,tz,t,tiro?'shot':'pass',0);
  B.distTiro=Math.hypot(S.goalX(s.att)-x,z);B.tipoTiro='perimetro';B.crossZ=tz;B.shotPower=.9;
  B.pickupCD=99;
}
function passo(){G.time+=dt;F.updateBall(dt);}
function riprendi(nome,s,attesa,{angolo=false,parata=false}={}){
  assert.equal(G.state,'stop',nome+': uscita effettivamente fischiata');
  const avviso=N.eventi.findLast(e=>e.tipo==='ripresa');
  assert.equal(avviso.squadra?.idx,attesa.idx,nome+': squadra annunciata');
  assert.equal(/angolo/i.test(avviso.testo),angolo,nome+': tipo di rimessa');
  const tocco={squadra:B.toccoDifesa?.idx??null,portiere:!!B.toccoPortiere},fuori=[B.x,B.y,B.z],parataInAttesa=!!B.parataDaRegistrare;
  assert.equal(typeof G.after,'function');
  const fermo={tempo:G.time,partita:G.clock,possesso:G.shot};let attesaStop=0;
  while(G.state==='stop'&&attesaStop++<120){
    partita.update(dt);
    if(G.state==='stop')assert.equal(G.shot,fermo.possesso,nome+': possesso fermo durante la rimessa');
  }
  assert.equal(G.state,'play',nome+': il ciclo partita esegue la ripresa');
  assert.equal(G.time,fermo.tempo,nome+': tempo effettivo fermo');
  assert.equal(G.clock,fermo.partita,nome+': cronometro partita fermo');
  assert.equal(B.state,'held',nome+': palla assegnata alla ripresa');
  assert.equal(B.holder.team.idx,attesa.idx,nome+': possesso effettivo');
  assert.equal(G.possTeam.idx,attesa.idx,nome+': squadra in possesso aggiornata');
  assert.equal(G.shot,attesa===s.att?C.SHOT_RESET:C.SHOT_CLOCK,nome+': 18/28 secondi');
  assert.equal(!!B.holder.freeThrow,!angolo&&Math.abs(fuori[2])>C.HW,nome+': laterale è tiro libero');
  if(!angolo&&Math.abs(fuori[2])>C.HW)assert.ok(Math.abs(B.holder.x)<=C.HL-1&&Math.abs(B.holder.z)<C.HW,nome+': battuta dentro il campo');
  assert.equal(ST.stat.squadre[s.dif.idx].parate,parata?1:0,nome+': tabellino parate');
  assert.equal(ST.stat.squadre[s.att.idx].gol,0,nome+': nessun gol inventato');
  assert.ok(!B.toccoDifesa&&!B.toccoPortiere,nome+': la nuova presa pulisce i tocchi precedenti');
  misure.push({nome,tocco,fuori,possesso:attesa.idx,secondiPrima:fermo.possesso,secondi:G.shot,parata,parataInAttesa});
}
// WA 18/02/2026: 12.3.1/12.3.1.1 (lato), 13.1.2.2.3/14.1.1 (fondo),
// 9.8.3.2 e 9.10.3.2 (28/18 secondi). Il muro su tiro lascia la palla alla difesa.
for(const idx of [0,1])for(const dir of [1,-1])for(const side of [1,-1])for(const [tocco,offLaterale] of [['portiere',.12],['portiere',.28],['muro',.12],['nessuno',0]]){
  for(const bordo of ['laterale','fondo']){
    if(tocco==='portiere'&&offLaterale===.28&&bordo==='fondo')continue;
    const s=prepara(dir,side,idx),{att,dif}=s,nome=`${tocco}-${bordo}-squadra${idx}-${dir}-${side}-${offLaterale}`;
    const gz=(bordo==='laterale'?9.4:2.4)*side,gx=(bordo==='laterale'?9:11.8)*dir;
    const scala=tocco==='portiere'?C.VIS/1.45:1;
    const off=(bordo==='laterale'?offLaterale:.28)*side*scala,q=tocco==='portiere'?s.gk:dif.players[2];
    if(tocco!=='nessuno')Object.assign(q,{x:gx,z:gz,stunUntil:0,fx:-dir,fz:0});
    if(tocco!=='portiere')s.gk.uscendo=true;
    if(tocco==='muro')caso=0;
    if(tocco==='nessuno'&&bordo==='laterale')lancia(s,{x:5*dir,z:9.6*side,tx:5*dir,tz:11*side,t:.1});
    else lancia(s,{x:gx-3*dir,y:.6*scala,z:gz+off,tx:gx,ty:.6*scala,tz:gz+off});
    assert.ok(!B.toccoDifesa&&!B.toccoPortiere,nome+': lancio pulito');
    let contatto=null;
    for(let i=0;i<150&&G.state==='play'&&B.state!=='held';i++){
      const prima=[B.vx,B.vy,B.vz];passo();
      if(!contatto&&B.toccoDifesa)contatto={frame:i+1,punto:[B.x,B.y,B.z],prima,dopo:[B.vx,B.vy,B.vz]};
    }
    assert.equal(!!contatto,tocco!=='nessuno',nome+': tocco prodotto dalla fisica '+JSON.stringify({scala:C.VIS,quota:B.y,palla:[B.x,B.z],portiere:[s.gk.x,s.gk.z]}));
    if(contatto){
      assert.equal(B.toccoDifesa.idx,dif.idx,nome+': ultimo tocco difensivo');
      assert.equal(B.toccoPortiere,tocco==='portiere',nome+': identità del difensore');
      assert.ok(Math.hypot(...contatto.dopo.map((v,i)=>v-contatto.prima[i]))>1,nome+': deviazione effettiva');
    }
    assert.equal(B.lastTeam.idx,att.idx,nome+': lastTeam conserva chi ha lanciato');
    assert.equal(B.contattoPortiere!==null,tocco==='portiere',nome+': nessuna parata inventata');
    assert.ok(bordo==='laterale'?Math.abs(B.z)>C.HW+.2:Math.abs(B.x)>C.HL,nome+': attraversa il bordo richiesto');
    if(tocco==='portiere'&&bordo==='laterale'&&offLaterale===.28)assert.ok(B.parataDaRegistrare,nome+': respinta in avanti ancora in attesa del tabellino');
    riprendi(nome,s,tocco==='portiere'?att:dif,{angolo:tocco==='portiere'&&bordo==='fondo',parata:tocco==='portiere'});
    misure.at(-1).contatto=contatto;
  }
}
if(salva)fs.writeFileSync(salva,JSON.stringify(misure,null,2)+'\n');
console.log(`PASS rimesse v0.72: ${misure.length} voli reali e riprese, due squadre/versi/lati, possesso18/28s e parate una sola volta`);
