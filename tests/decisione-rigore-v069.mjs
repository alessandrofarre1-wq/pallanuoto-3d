// Lettura regolamentare: nessun renderer, sorteggio o probabilità modificata.
import assert from 'node:assert/strict';
import { leggiRigore } from '../src/decisione-rigore.js';

let casi=0;
for(const dir of [1,-1]){
  function scena(){
    const att={dir},dif={dir:-dir},porta=12.5*dir;
    const c={team:att,x:porta-dir*2.6,z:0,fx:dir,fz:0,excluded:false,act:null};
    const d={team:dif,x:c.x-dir*.9,z:0,excluded:false};
    const gk={team:dif,x:porta-dir*.4,z:0,isGK:true,excluded:false};
    const palla={state:'held',holder:c,x:c.x,z:0};
    return {c,d,gk,palla,porta,difendenti:[d,gk]};
  }
  const check=(nome,modifica,possibile,differito=false)=>{
    const s=scena();modifica(s);const r=leggiRigore(s.d,s.c,s);
    assert.equal(r.possibile,possibile,`${nome}, verso ${dir}: ${r.motivo}`);
    assert.equal(r.differito,differito,`${nome}, differimento verso ${dir}`);casi++;
  };
  check('fallo reale su occasione frontale',()=>{},true);
  check('ricezione senza fallo',s=>{s.fallo=false;},false);
  check('solo palla',s=>{s.soloPalla=true;},false);
  check('palla sul perimetro',s=>{s.palla.holder={};},false);
  check('palla in volo',s=>{s.palla.state='flight';s.palla.holder=null;},false);
  check('attaccante fuori6',s=>{s.c.x=s.porta-dir*6.2;s.d.x=s.porta-dir*5.5;},false);
  check('difensore fuori6',s=>{s.c.x=s.porta-dir*5.5;s.d.x=s.porta-dir*6.2;},false);
  check('difensore non a contatto',s=>{s.d.x=s.c.x-dir*2;},false);
  check('fuori area2m ma entro6m',s=>{s.c.x=s.porta-dir*4.2;s.d.x=s.c.x-dir*.9;},true);
  check('fronte opposto',s=>{s.c.fx=-dir;},false);
  check('angolo troppo chiuso',s=>{s.c.x=s.porta-dir;s.c.z=6;s.d.x=s.c.x-dir*.9;s.d.z=s.c.z;},false);
  check('passaggio',s=>{s.c.act={kind:'pass',done:false};},false);
  check('tiro libero',s=>{s.c.freeThrow=true;},false);
  check('tiro da dietro differito',s=>{s.c.act={kind:'shot',done:false};},true,true);
  check('semplice carica non è tiro rilasciato',s=>{s.c.charging=true;},true,false);
  check('difensore sulla linea lontano dal portatore',s=>{s.c.x=s.porta-dir*4.8;s.d.x=s.c.x-dir*.9;s.difendenti.push({x:s.porta-dir*2.4,z:0,team:s.d.team});},false);
  check('aiuto laterale lascia un corridoio',s=>{s.difendenti.push({x:s.porta-dir*1.5,z:2,team:s.d.team});},true);
  check('aiuto espulso non copre il tiro',s=>{s.difendenti.push({x:s.porta-dir*.5,z:0,team:s.d.team,excluded:true});},true);
  check('porta vuota, conclusione anche di schiena',s=>{s.c.fx=-dir;s.gk.x=s.porta-dir*3;},true);
  check('stessa squadra',s=>{s.d.team=s.c.team;},false);
}
console.log(`PASS decisione rigore v0.69: ${casi} casi, due versi, fallo reale/possesso/6m/fronte/aiuti e tiro differito`);
