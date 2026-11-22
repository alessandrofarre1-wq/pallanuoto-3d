// Il ciclo vero della panchina, i bersagli IA e il nuoto girano in Node; solo disegno, cronaca e regole estranee alla scena sono stub.
// --prima usa ia.js e panchina.js di v0.67 con le STESSE scene e asserzioni (deve fallire).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)), prima=process.argv.includes('--prima');
const originali=new Map();
if(prima){
  const cartella=fs.mkdtempSync(path.join(os.tmpdir(),'difesa-cambi-prima-'));
  try{
    for(const name of ['ia.js','panchina.js']){
      const file=path.join(cartella,name),fd=fs.openSync(file,'w');
      try{execFileSync('git',['show','c11f93d:src/'+name],{cwd:root,stdio:['ignore',fd,'inherit']});}finally{fs.closeSync(fd);}
      originali.set(name,fs.readFileSync(file,'utf8'));
    }
  }finally{fs.rmSync(cartella,{recursive:true,force:true});}
}
const stub=new Map([
  ['grafica/modello.js','export const makePlayerMesh=()=>({g:{visible:true}}),coloraGiocatore=()=>{};'],
  ['grafica/costumi.js','export const profiloCostume=()=>({});'],
  ['cronaca.js','export const annuncia=()=>{};'],
  ['replay.js','export const registraTiroReplay=()=>{};'],
  ['palla.js','export const RAGGIO=.1106,QUOTA_GALLEGGIA=.15,passoPalla=()=>{},velocitaDiLancio=()=>20;'],
  ['regole.js',`export const ${['doFake','falloSenzaPalla','timeout','controllaInterferenza','anticipoBattuto','cornerThrow','giveBall','goalScored','goalThrow','sfondamento','sideOut'].map(n=>n+'=()=>{}').join(',')};`],
]);
registerHooks({load(url,context,next){
  const base=new URL('../src/',import.meta.url).href;
  if(url.startsWith(base)){
    const name=url.slice(base.length);
    if(stub.has(name))return {format:'module',shortCircuit:true,source:stub.get(name)};
    if(name.endsWith('.json'))return {format:'module',shortCircuit:true,source:'export default '+fs.readFileSync(new URL(url),'utf8')};
    if(originali?.has(name))return {format:'module',shortCircuit:true,source:originali.get(name)};
  }
  return next(url,context);
}});
globalThis.window={__rnd:()=>.5};
const S=await import('../src/stato.js'),C=await import('../src/costanti.js');
const P=await import('../src/panchina.js'),A=await import('../src/ia.js'),F=await import('../src/fisica.js');
const J=await import('../src/giocatori.js'),Q=await import('../src/schemi.js');
const dt=1/60,violazioni=[],misure=[];
const controlla=(ok,msg)=>{if(!ok&&!violazioni.includes(msg))violazioni.push(msg);};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function prepara(idx,dir,difesa){
  J.applicaSquadre('ITA','HUN');
  Object.assign(S.game,{state:'play',autoplay:false,time:100,possT:100,possTeam:S.teams[idx],shot:24,period:1,clock:180});
  S.teams[idx].dir=dir;S.teams[1-idx].dir=-dir;S.setCtrl(null);S.fight.active=false;
  for(const t of S.teams){
    Q.applicaSchema(t,Q.copiaSchema('arco'));
    Object.assign(t,{defPlay:difesa,cambio:null,coda:[],prossimoControllo:1e9,aiutoStato:null,scambio:null,accoppiamenti:null,adattamentoEntrata:null,occupantiAttacco:null,entrataAzione:null});
    for(const p of t.players)Object.assign(p,{excluded:false,uscendo:false,cut:null,girata:null,act:null,charging:false,stamina:1,stunUntil:0,pressatoUntil:0,freeThrow:false,contactT:0,vx:0,vz:0,oriz:0,fx:dir,fz:0,lunge:0,perno:false,turnedUntil:0,scivolaAI:false});
  }
  const att=S.teams[idx],dif=S.other(att);
  for(const p of att.players){
    const f=C.FORM[p.i];p.x=p.isGK?S.ownGoalX(att)+dir*.6:S.goalX(att)-dir*f[0];p.z=p.isGK?0:f[1]*dir;
  }
  for(const p of dif.players){
    const a=att.players[C.MARK[p.i]];p.x=p.isGK?S.ownGoalX(dif)+dif.dir*.6:a.x+dir*.8;p.z=a.z;p.lagX=a.x;p.lagZ=a.z;
  }
  const h=att.players[4];Object.assign(S.ball,{state:'held',holder:h,x:h.x,z:h.z,kind:null,target:null,lastTeam:att,holdTime:.3});
  return {att,dif};
}
// Stesse scelte di arrivo, aggiramento, frenata e scivolamento del ciclo partita; il nuoto è F.movePlayer, senza scorciatoie geometriche.
function nuota(p,tg){
  if(!tg){F.movePlayer(p,0,0,false,dt);return;}
  const dx=tg.x-p.x,dz=tg.z-p.z,d=Math.hypot(dx,dz);let mx=0,mz=0;
  if(d>.12){const s=Math.min(1,d/.8);mx=dx/d*s;mz=dz/d*s;}
  if(d>1&&!tg.gk)[mx,mz]=A.steer(p,dx/d,dz/d,d);
  if(!tg.gk&&!tg.sprint&&d<Math.hypot(p.vx,p.vz)/8&&p.vx*dx+p.vz*dz>0)mx=mz=0;
  const suPortatore=S.ball.holder&&S.ball.holder.team!==p.team&&A.uomoDi(p)===S.ball.holder;
  if(!tg.gk&&!tg.sprint&&!p.uscendo&&!p.excluded&&!suPortatore){
    if(d<1.8)p.scivolaAI=true;else if(d>2.8)p.scivolaAI=false;
    if(p.scivolaAI){const k=Math.hypot(mx,mz);if(k>.48){mx*=.48/k;mz*=.48/k;}}
  }else p.scivolaAI=false;
  F.movePlayer(p,mx,mz,!tg.gk&&((tg.sprint&&d>.6)||(!tg.nuota&&d>4&&p.stamina>.35)),dt);
}
function fotogramma({att,dif},mobili,manuale=null){
  S.game.time+=dt;
  for(const p of S.allPlayers){const a=A.uomoDi(p),k=Math.min(1,dt*(2+2*p.st.def)*(p.team.defPlay===3?1.4:1));p.lagX+=(a.x-p.lagX)*k;p.lagZ+=(a.z-p.lagZ)*k;}
  P.aggiornaPanchina(dt);
  for(const p of mobili){
    if(p===S.ctrl){nuota(p,manuale||{x:p.x,z:p.z});continue;}
    const tg=p.uscendo?P.obiettivoUscita(p):A.attackTarget(p);nuota(p,tg);
  }
  for(const p of dif.players){
    if(p.isGK)continue;
    if(p===S.ctrl){F.movePlayer(p,0,0,false,dt);continue;}
    nuota(p,A.aiTarget(p));
  }
  S.ball.x=S.ball.holder.x;S.ball.z=S.ball.holder.z;
}
function ciclo(idx,dir,difesa,umano=false){
  const ctx=prepara(idx,dir,difesa),{att,dif}=ctx,uscente=att.players[5],marcatore=dif.players.find(p=>A.uomoDi(p)===uscente);
  const riserva=P.suggerimento({...uscente,stamina:.2})||J.riservaPer(uscente),vecchia=uscente.scheda,uid=uscente.uid,i=uscente.i;
  const umanoP=umano?marcatore:null;if(umanoP)S.setCtrl(umanoP);
  const fermo=umanoP&&{x:umanoP.x,z:umanoP.z};
  assert.equal(P.chiediCambio(att,uscente,riserva,true),true);
  let esce=false,cinque=false,entra=false,finito=false,ritornato=false,maxMetri=0,maxTarget=0,tempoOltre=0,maxPasso=0,aiuto=Infinity,primaScheda=uscente.scheda;
  for(let n=0;n<60*45;n++){
    const prima={x:marcatore.x,z:marcatore.z};fotogramma(ctx,[uscente]);
    esce ||=att.cambio?.fase==='esce';cinque ||=att.cambio?.fase==='cinque';entra ||=uscente.scheda!==vecchia;finito ||=entra&&!att.cambio;
    const lontano=uscente.uscendo||(entra&&(S.goalX(att)-uscente.x)*dir>10.5);
    if(lontano){
      const profondita=(marcatore.x-S.ownGoalX(dif))*dif.dir,tg=A.markTarget(marcatore);
      maxMetri=Math.max(maxMetri,profondita);maxTarget=Math.max(maxTarget,(tg.x-S.ownGoalX(dif))*dif.dir);
      if(profondita>12.5)tempoOltre+=dt;
      if(n>180)aiuto=Math.min(aiuto,dist(marcatore,att.players[1]));
    }
    maxPasso=Math.max(maxPasso,dist(prima,marcatore));
    if(entra&&primaScheda!==uscente.scheda){controlla(uscente.uid===uid&&uscente.i===i&&att.players[i]===uscente,'lo scambio conserva oggetto, indice e uid');primaScheda=uscente.scheda;}
    if(finito&&(S.goalX(att)-uscente.x)*dir<8.8){ritornato=true;break;}
  }
  controlla(esce&&cinque&&entra&&finito&&ritornato,`ciclo completo ${idx}/${dir}/${difesa}`);
  controlla(dif.defPlay===difesa,'la tattica selezionata resta uguale');
  controlla(S.ctrl===umanoP,'nessun cambio al giocatore controllato');
  if(umano)controlla(dist(marcatore,fermo)<1e-9,'il marcatore comandato resta fermo senza input');
  else{
    controlla(maxMetri<11.5,`il marcatore resta utile nella metà difensiva (${maxMetri.toFixed(2)} m dalla porta)`);
    controlla(maxTarget<11.5,`il bersaglio non segue il cambio oltre metà campo (${maxTarget.toFixed(2)} m)`);
    controlla(tempoOltre===0,`nessuna permanenza oltre metà campo (${tempoOltre.toFixed(2)} s)`);
    controlla(aiuto<4.2,`copertura vicina al centroboa (${aiuto.toFixed(2)} m)`);
  }
  controlla(maxPasso<.06,'nessun teletrasporto del difensore');
  // Rientrato in attacco: il pressing riprende il suo uomo. A zona può continuare l'aiuto sul boa;
  // quando l'entrante riceve davvero palla, tutte e tre le difese devono tornare a chiudere quel tiro.
  const rientro=dist(A.markTarget(marcatore),uscente);
  if(!umano&&difesa===2)controlla(rientro<1.9,`ripresa della marcatura in pressing (${rientro.toFixed(2)} m)`);
  Object.assign(S.ball,{holder:uscente,x:uscente.x,z:uscente.z});
  const ricezione=dist(A.markTarget(marcatore),uscente);
  if(!umano)controlla(ricezione<1.9,`la minaccia con palla viene chiusa (${ricezione.toFixed(2)} m)`);
  controlla(dif.defPlay===difesa,'zona e pressing restano quelli scelti anche alla ricezione');
  misure.push({idx,dir,difesa,umano,maxMetri:+maxMetri.toFixed(3),maxTarget:+maxTarget.toFixed(3),secondiOltreMeta:+tempoOltre.toFixed(3),minDistanzaBoa:+aiuto.toFixed(3),bersaglioRientro:+rientro.toFixed(3),bersaglioRicezione:+ricezione.toFixed(3),maxPasso:+maxPasso.toFixed(4)});
}
for(const idx of [0,1])for(const dir of [1,-1])for(const difesa of [2,1,3])ciclo(idx,dir,difesa);
ciclo(0,1,2,true);

// Due cambi reali consecutivi con due sostituti ancora nella propria metà. Il primo è comandato:
// nuota per scelta nella sua metà anche dopo che la comparsa dell'uscente è già sparita.
function dueCambi(idx,dir,difesa){
  const ctx=prepara(idx,dir,difesa),{att,dif}=ctx,a=att.players[5],b=att.players[2],m1=dif.players.find(p=>A.uomoDi(p)===a),m2=dif.players.find(p=>A.uomoDi(p)===b);
  const scA=a.scheda,scB=b.scheda;
  assert.equal(P.chiediCambio(att,a,J.riservaPer(a),true),true);
  let richiestoB=false,entratoA=false,entratoB=false,doppia=0,oltre=0,maxProf=0,minSeparazione=Infinity,maxSalto=0;
  const guida={x:-dir*4,z:-3};
  for(let n=0;n<60*55;n++){
    const p1={x:m1.x,z:m1.z},p2={x:m2.x,z:m2.z};
    fotogramma(ctx,[a,b],guida);
    if(a.scheda!==scA&&!entratoA){entratoA=true;S.setCtrl(a);}
    if(entratoA&&!att.cambio&&!richiestoB){assert.equal(P.chiediCambio(att,b,J.riservaPer(b),true),true);richiestoB=true;}
    entratoB ||=b.scheda!==scB;
    maxSalto=Math.max(maxSalto,dist(p1,m1),dist(p2,m2));
    if(entratoA&&(S.goalX(att)-a.x)*dir>12.5){
      const d=(m1.x-S.ownGoalX(dif))*dif.dir;maxProf=Math.max(maxProf,d);if(d>12.5)oltre+=dt;
    }
    if(entratoB&&!a.uscendo&&!b.uscendo&&(S.goalX(att)-a.x)*dir>12.5&&(S.goalX(att)-b.x)*dir>12.5){
      doppia+=dt;
      const t1=A.markTarget(m1),t2=A.markTarget(m2);
      minSeparazione=Math.min(minSeparazione,dist(t1,t2));
      controlla((t1.x-S.ownGoalX(dif))*dif.dir<11.5&&(t2.x-S.ownGoalX(dif))*dif.dir<11.5,'entrambi i bersagli restano difensivi con due sostituti lontani');
      if(!att.cambio)break;
    }
  }
  controlla(entratoA&&entratoB&&!att.cambio&&doppia>1,'due cambi completati con entranti ancora lontani e coperture contemporanee');
  controlla(S.ctrl===a&&Math.hypot(a.x-guida.x,a.z-guida.z)<.3,'l’entrante comandato segue il comando nella propria metà');
  controlla(maxProf<11.5&&oltre===0,`il difensore non segue l’entrante comandato (${maxProf.toFixed(2)} m, ${oltre.toFixed(2)} s oltre metà)`);
  controlla(minSeparazione>1.5,`due coperture distinte (${minSeparazione.toFixed(2)} m)`);
  controlla(maxSalto<.06,'nessun teletrasporto con due cambi');
  controlla(dif.defPlay===difesa,'due cambi non cambiano la tattica');
  const coperturaPrima=A.markTarget(m1),h=att.players[3];Object.assign(S.ball,{holder:h,x:h.x,z:h.z});
  const coperturaDopo=A.markTarget(m1);
  controlla(dist(coperturaPrima,coperturaDopo)>.5,'la copertura si adatta geometricamente al cambio del lato della palla');
  controlla((coperturaDopo.x-S.ownGoalX(dif))*dif.dir<11.5,'la copertura adattata resta davanti alla propria porta');
  misure.push({dueCambi:true,idx,dir,difesa,entranteComandato:true,secondiCoperturaDoppia:+doppia.toFixed(3),maxMetri:+maxProf.toFixed(3),secondiOltreMeta:+oltre.toFixed(3),minSeparazioneBersagli:+minSeparazione.toFixed(3),maxPasso:+maxSalto.toFixed(4)});
}
for(const idx of [0,1])for(const dir of [1,-1])for(const difesa of [2,1,3])dueCambi(idx,dir,difesa);

console.log(JSON.stringify({versione:prima?'prima v0.67':'dopo v0.68',misure,violazioni},null,2));
assert.deepEqual(violazioni,[],'difesa dei cambi volanti');
