import assert from 'node:assert/strict';
globalThis.window={__rnd:()=>{throw new Error('Il profilo non deve estrarre il caso');}};
const {creaTentativoPortiere,avanzaTentativoPortiere,concludiTentativoPortiere}=await import('../src/parata-portiere.js');
const {VIS}=await import('../src/costanti.js');
const {PARATA_PORTIERE}=await import('../src/taratura.js');
const scheda={nome:'Portiere'};
const portiere=(dir=1)=>({uid:4,num:1,scheda,x:dir*10,z:0,fx:-dir,fz:0,stamina:1,s:{rif:90},team:{dir:-dir},excluded:false});
const palla=(dir=1)=>({x:dir*3,y:.7,z:dir*.4,vx:dir*20,vy:1,vz:dir*1.2,flightT:0});
const opzioni={probabilita:.75,caso:.1,time:10};
const distanza=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const arrotonda=a=>a.map(v=>+v.toFixed(9));

for(const dir of [1,-1]){
  const g=portiere(dir),b=palla(dir),t=creaTentativoPortiere(g,b,opzioni);
  assert.equal(t.riuscita,true);assert.equal(t.sfere.length,26);assert.equal(t.sferePrima.length,26);
  assert.ok(t.reazione>=.08&&t.reazione<=.18);assert.ok(t.arrivoStimato>.3&&t.arrivoStimato<.4);
  for(const S of t.sfere)assert.ok(S.centro.every(Number.isFinite)&&S.raggio>0);
  const prima=t.sfere.map(s=>s.centro.slice());g.x+=dir*.08;b.flightT=.2;
  assert.equal(avanzaTentativoPortiere(t,g,b,10.2),true);
  assert.deepEqual(t.sferePrima.map(s=>s.centro),prima,'stato precedente distinto per sweep di sagome mobili');
  for(const lato of ['R','L']){
    assert.ok(distanza(t.giunti['s'+lato],t.giunti['h'+lato])<=.586+1e-12,'portata fisica del braccio limitata');
    assert.ok(Math.abs(distanza(t.giunti['s'+lato],t.giunti['e'+lato])-.3)<1e-10);
    assert.ok(Math.abs(distanza(t.giunti['e'+lato],t.giunti['h'+lato])-.29)<1e-10);
  }
}
const simulate=fps=>{
  const g=portiere(),b=palla(),t=creaTentativoPortiere(g,b,opzioni);
  for(let i=1;i<=fps*.4;i++){b.flightT=i/fps;g.z=.4*i/fps;avanzaTentativoPortiere(t,g,b,10+i/fps);}
  return t;
};
const a=simulate(30),b=simulate(60),c=simulate(120);
assert.deepEqual(a.giunti,b.giunti);assert.deepEqual(b.giunti,c.giunti);
assert.deepEqual(a.sfere,b.sfere);assert.deepEqual(b.sfere,c.sfere);

const g=portiere(),ball=palla(),t=creaTentativoPortiere(g,ball,opzioni);
Object.defineProperties(g,{J:{get(){throw new Error('lettura del rig fisico');}},Jv:{get(){throw new Error('lettura del rig visuale');}},mesh:{get(){throw new Error('lettura della grafica');}}});
ball.flightT=.3;avanzaTentativoPortiere(t,g,ball,10.3);
const senzaRig=portiere(),pallaSenzaRig=palla(),tentativoSenzaRig=creaTentativoPortiere(senzaRig,pallaSenzaRig,opzioni);
pallaSenzaRig.flightT=.3;avanzaTentativoPortiere(tentativoSenzaRig,senzaRig,pallaSenzaRig,10.3);
assert.deepEqual(t.giunti,tentativoSenzaRig.giunti,'stessa sagoma con e senza stato del disegno');
assert.ok(t.sfere.every(s=>s.centro.every(Number.isFinite)));

const gc=portiere(),bc={...palla(),x:9,y:.65,z:.25,vx:25,vy:0,vz:0};
const tc=creaTentativoPortiere(gc,bc,opzioni);
assert.ok(tc.arrivoStimato<tc.reazione,'da vicino il pallone può arrivare prima della risposta');
bc.flightT=tc.arrivoStimato;avanzaTentativoPortiere(tc,gc,bc,10+bc.flightT);
assert.equal(tc.progresso,0,'le mani non inseguono istantaneamente il tiro ravvicinato');
for(const lato of ['R','L']){
  const H=tc.giunti['h'+lato],S=tc.giunti['s'+lato];
  assert.ok(Math.abs(H[2]-S[2])>.35,'restano nella preparazione larga, non sul bersaglio');
}
const gs=portiere(),bs=palla(),successo=creaTentativoPortiere(gs,bs,opzioni),fallito=creaTentativoPortiere(gs,bs,{...opzioni,caso:.99});
bs.flightT=.7;avanzaTentativoPortiere(successo,gs,bs,10.7);avanzaTentativoPortiere(fallito,gs,bs,10.7);
assert.equal(successo.progresso,1);assert.equal(fallito.riuscita,false);assert.equal(fallito.progresso,.45);
assert.ok(distanza(successo.giunti.hR,fallito.giunti.hR)>.05,'un tentativo fallito non presenta le mani sulla stessa presa riuscita');
assert.ok(successo.lean*fallito.lean<0,'una lettura sbagliata sposta il peso dal lato opposto, non insegue comunque il bersaglio corretto');
const latoLetto=fallito.bersaglioLetto.slice();gs.z+=.4;bs.flightT=.72;avanzaTentativoPortiere(fallito,gs,bs,10.72);
assert.deepEqual(fallito.bersaglioLetto,latoLetto,'lo scivolamento non cambia il lato già letto male');

const uno=creaTentativoPortiere(portiere(1),palla(1),opzioni),due=creaTentativoPortiere(portiere(-1),palla(-1),opzioni);
assert.deepEqual(uno.giunti,due.giunti);
for(let i=0;i<uno.sfere.length;i++)assert.deepEqual(arrotonda(uno.sfere[i].centro),arrotonda(due.sfere[i].centro.map((x,k)=>k===1?x:-x)),'simmetria dei due lati');
for(const muta of [g=>g.num++,g=>g.scheda={},g=>g.excluded=true]){
  const gk=portiere(),B=palla(),q=creaTentativoPortiere(gk,B,opzioni);muta(gk);
  assert.equal(avanzaTentativoPortiere(q,gk,B,10.1),false);assert.equal(q.attiva,false);
}
const gk=portiere(),B=palla(),q=creaTentativoPortiere(gk,B,opzioni);B.flightT=.1;avanzaTentativoPortiere(q,gk,B,10.1);
B.flightT=0;assert.equal(avanzaTentativoPortiere(q,gk,B,10.2),false,'un nuovo lancio non eredita il tentativo precedente');
let velocitaMax=0;
for(const caso of [0,.99])for(const y of [.15,.4,.7,1,1.4])for(const z of [0,.35,.7,1,1.3]){
  const g=portiere(),tempoArrivo=.2825,ball={x:4,y:.7,z,flightT:0,vx:20,vy:(y-.7+4.9*tempoArrivo**2)/tempoArrivo,vz:0};
  const t=creaTentativoPortiere(g,ball,{...opzioni,probabilita:.75,caso});
  const prev=t.sfere.slice(24).map(s=>s.centro.slice());
  for(let i=1;i<=700;i++){
    ball.flightT=i/1000;avanzaTentativoPortiere(t,g,ball,10+ball.flightT);
    for(let mano=0;mano<2;mano++){
      const p=t.sfere[24+mano].centro,v=distanza(p,prev[mano])*1000;
      velocitaMax=Math.max(velocitaMax,v);prev[mano]=p.slice();
    }
  }
}
assert.ok(velocitaMax<=PARATA_PORTIERE.velocitaMano,'velocità reale della mano, inclusi IK e busto, limitata: '+velocitaMax);
// Un tiro deviato ha già un tempo di volo, ma il nuovo tentativo deve comunque
// attendere la sua reazione: non può riusare quei secondi per arrivare subito.
const gd=portiere(),bd={...palla(),flightT:.4},devia=creaTentativoPortiere(gd,bd,{...opzioni,time:12});
assert.equal(devia.voloInizio,.4);assert.equal(devia.progresso,0);
assert.throws(()=>{devia.voloInizio=0;},TypeError,'l’origine del nuovo tempo di volo è immutabile');
bd.flightT=.4+devia.reazione-.001;avanzaTentativoPortiere(devia,gd,bd,12+devia.reazione-.001);
assert.equal(devia.progresso,0,'la deviazione non annulla il tempo di reazione');

// Raccordo dal precedente tentativo numerico, non da un osso disegnato.
const gp=portiere(),bp=palla(),precedente=creaTentativoPortiere(gp,bp,opzioni);
bp.flightT=.3;avanzaTentativoPortiere(precedente,gp,bp,10.3);
const fotografati=Object.fromEntries(Object.entries(precedente.giunti).map(([k,v])=>[k,v.slice()]));
const nuovaPalla={...bp,flightT:.4,z:-.8,vz:-2},nuovo=creaTentativoPortiere(gp,nuovaPalla,{...opzioni,time:10.3,precedente});
for(const k of Object.keys(fotografati))assert.ok(distanza(nuovo.giunti[k],fotografati[k])<1e-12,'posa conservata al cambio bersaglio '+k);
precedente.giunti.hR[0]+=4;assert.ok(distanza(nuovo.giuntiInizio.hR,fotografati.hR)<1e-12,'snapshot iniziale senza alias');
assert.equal(nuovo.progresso,0);

const recovery=fps=>{
  const g=portiere(),B=palla(),t=creaTentativoPortiere(g,B,opzioni);
  B.flightT=.3;avanzaTentativoPortiere(t,g,B,10.3);concludiTentativoPortiere(t,10.3);
  const prima=JSON.stringify(t.giunti);B.flightT=0;
  assert.equal(avanzaTentativoPortiere(t,g,B,10.3),true,'il recupero ammette il reset del tempo della palla');
  assert.equal(JSON.stringify(t.giunti),prima,'inizio recupero senza salto');
  for(let i=1;i<=fps;i++)avanzaTentativoPortiere(t,g,B,10.3+PARATA_PORTIERE.recupero*.5*i/fps);
  return {g,B,t};
};
const rec30=recovery(30),rec60=recovery(60),rec120=recovery(120);
assert.deepEqual(rec30.t.giunti,rec60.t.giunti);assert.deepEqual(rec60.t.giunti,rec120.t.giunti);
assert.equal(concludiTentativoPortiere(rec30.t,10.9),true);assert.equal(rec30.t.fine,10.3,'conclusione ripetuta idempotente');
avanzaTentativoPortiere(rec30.t,rec30.g,rec30.B,10.3+PARATA_PORTIERE.recupero);
assert.equal(rec30.t.attiva,false);assert.ok(Math.abs(rec30.t.lift-.1)<1e-12);assert.ok(Math.abs(rec30.t.lean)<1e-12);
const gz=portiere(),bz=palla(),tz=creaTentativoPortiere(gz,bz,{...opzioni,time:0});
concludiTentativoPortiere(tz,0);assert.equal(tz.fine,0);
avanzaTentativoPortiere(tz,gz,{...bz,flightT:0},PARATA_PORTIERE.recupero);assert.equal(tz.attiva,false,'fine=0 resta una conclusione valida');
assert.equal(VIS,1.10,'scala corretta del modello rispetto al campo');
console.log('PASS profilo portiere v0.71: 26 sfere, portata, reazione ravvicinata/deviazione, raccordo e recupero, due versi, 30/60/120Hz e indipendenza dal rendering; massimo mano '+velocitaMax.toFixed(4)+'m/s');
