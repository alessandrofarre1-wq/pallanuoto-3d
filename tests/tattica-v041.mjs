// Scene di scelta e movimento, senza screenshot o avanzamento casuale della partita.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:4379,strictPort:true}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.__rnd=()=>0.5;});
  await page.goto('http://127.0.0.1:4379');
  await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:60000});
  const r=await page.evaluate(async()=>{
    const [A,T,S,C,Q]=await Promise.all([import('/src/ia.js'),import('/src/tiri.js'),import('/src/stato.js'),import('/src/costanti.js'),import('/src/schemi.js')]);
    const G=S.game,B=S.ball;let scena=0;
    function prepara(dir=1,sup=false){
      G.time=100+(++scena)*10;G.possT=G.time;G.state='play';G.shot=24;G.clock=180;G.period=1;G.penalty=null;G.autoplay=true;
      const t=S.teams[0],o=S.teams[1];t.dir=dir;o.dir=-dir;G.possTeam=t;S.setCtrl(null);S.fight.active=false;
      for(const team of S.teams){Q.applicaSchema(team,Q.copiaSchema('arco'));team.timeouts=0;team.lasciato=null;team.doubleP=null;}
      for(const p of S.allPlayers) Object.assign(p,{vx:0,vz:0,fx:dir,fz:0,oriz:0,act:null,charging:false,cut:null,appoggio:null,excluded:false,uscendo:false,stamina:1,pressatoUntil:0,stunUntil:0,freeThrow:false,alVolo:false,ricevutoPassaggio:false,ricevutoCambio:false,turnedUntil:0,fakeUntil:0,shootNext:false,decideT:99,reazioneT:99,girata:null});
      for(const p of t.players){if(p.isGK){p.x=-C.HL*dir;p.z=0;}else{const f=(sup?t.schema.superiorita:t.schema.attacco)[p.i-1];p.x=(C.HL-f[0])*dir;p.z=f[1]*dir;}p.lagX=p.x;p.lagZ=p.z;}
      for(const p of o.players){p.x=-10*dir;p.z=8;p.lagX=p.x;p.lagZ=p.z;}
      o.players[0].x=C.HL*dir;o.players[0].z=0;if(sup)o.players[6].excluded=true;
      Object.assign(B,{state:'held',kind:null,holder:t.players[4],target:null,holdTime:.3,x:t.players[4].x,z:t.players[4].z});
      return {t,o};
    }
    const hold=p=>Object.assign(B,{state:'held',holder:p,kind:null,target:null,x:p.x,z:p.z,holdTime:.3});
    const put=(p,x,z)=>Object.assign(p,{x,z,lagX:x,lagZ:z});
    const schema=(()=>{
      const q=Q.copiaSchema('arco');q.id='personale';q.nome='Mio schema';q.attacco[4]=[7.6,-5.2];q.aiuti=[4,4,5];
      const saved=Q.salvaSchema(q),loaded=Q.caricaSchema(),copy=Q.copiaSchema(loaded);copy.attacco[4][0]=3;
      const invalid=Q.validaSchema({...q,entrata:7}),normal=Q.validaSchema({...q,attacco:[[.2,0],...q.attacco.slice(1)]});
      return {saved,loaded:loaded.attacco[4],indipendente:loaded.attacco[4][0]!==copy.attacco[4][0],aiuti:loaded.aiuti,invalid:invalid===null,goalarea:normal.attacco[0][0]};
    })();
    const adiacente=(()=>{
      const {t,o}=prepara(),p=t.players[4],m=t.players[1];put(o.players[6],m.x+(p.x-m.x)*.25,m.z+(p.z-m.z)*.25);
      return T.bestPassTarget(p,false)?.i;
    })();
    const centro=(()=>{
      const {t,o}=prepara(),p=t.players[4],m=t.players[1];
      for(const q of t.players) if(q!==p&&q!==m)q.excluded=true;
      const dx=p.x-m.x,dz=p.z-m.z,l=Math.hypot(dx,dz);put(o.players[6],m.x+dx/l*.85,m.z+dz/l*.85);
      const chiuso=T.bestPassTarget(p,false)?.i??null;
      put(o.players[6],m.x+.85,m.z);return {chiuso,aperto:T.bestPassTarget(p,false)?.i??null};
    })();
    const skip=(()=>{
      const {t,o}=prepara(),p=t.players[4];o.players[0].z=1.2;
      put(o.players[1],t.players[2].x+.2,t.players[2].z+.25);put(o.players[2],t.players[6].x+.2,t.players[6].z+.25);
      const m=t.players[1];put(o.players[6],m.x+(p.x-m.x)*.25,m.z+(p.z-m.z)*.25);
      const libero=T.bestPassTarget(p,false)?.i,rischioLibero=T.passLaneRisk(p,t.players[5]);
      put(o.players[4],(p.x+t.players[5].x)/2,(p.z+t.players[5].z)/2);
      return {libero,rischioLibero,chiuso:T.bestPassTarget(p,false)?.i,rischioChiuso:T.passLaneRisk(p,t.players[5])};
    })();
    function pali(dir){
      const {t}=prepara(dir,true);const h=t.players[4];hold(h);B.holder=null;B.state='flight';B.kind='pass';B.target=h;
      const a=A.attackTarget(t.players[1]),b=A.attackTarget(t.players[6]);
      return {vicino:Math.abs(C.HL*dir-a.x),lontano:Math.abs(C.HL*dir-b.x),z:a.z*dir};
    }
    const paliDestra=pali(1),paliSinistra=pali(-1);
    function volo(marcato){
      const {t,o}=prepara(1,true),p=t.players[1];hold(p);B.holdTime=.05;p.ricevutoPassaggio=true;p.ricevutoT=G.time;
      if(marcato)put(o.players[3],p.x+.75,p.z-.15);
      A.aiCarrier(p,1/60);return p.act?.kind??null;
    }
    const alVolo={libero:volo(false),marcato:volo(true)};
    const geometria=(()=>{
      const {t,o}=prepara(),p=t.players[1];hold(p);put(o.players[6],p.x+.8,p.z);p.fx=-1;p.fz=0;
      const spalle=T.shotKind(p);p.fx=1;const fronte=T.shotKind(p);
      p.turnedUntil=G.time+1;S.fight.def=o.players[6];const recuperato=T.situazioneTiro(p).marcato;
      return {spalle,fronte,recuperato};
    })();
    const editor=(()=>{
      const {t}=prepara(),s=Q.copiaSchema('arco');s.id='personale';s.attacco[4]=[7.6,-5.2];s.attacco[0]=[4.2,1.2];Q.applicaSchema(t,s);hold(t.players[2]);
      const tg=A.attackTarget(t.players[5]),boa=A.attackTarget(t.players[1]);
      return {profondita:Math.abs(C.HL-tg.x),laterale:tg.z,boa:Math.abs(C.HL-boa.x)};
    })();
    const entrata=(()=>{
      const {t}=prepara();Q.applicaSchema(t,Q.copiaSchema('entrata'));hold(t.players[3]);A.aggiornaSchemi(t);G.time+=.7;A.aggiornaSchemi(t);
      const taglianti=t.players.filter(p=>p.cut).map(p=>p.i),cover=t.copertura?.chi.i,tg=cover&&A.attackTarget(t.players[cover]);
      G.possTeam=S.other(t);G.possT=G.time;A.aggiornaSchemi(t);
      return {taglianti,cover,profondita:tg?Math.abs(C.HL-tg.x):0,rientro:t.players.every(p=>!p.cut)&&!t.copertura};
    })();
    const aiuto=(()=>{
      const {t,o}=prepara(),s=Q.copiaSchema('boa');s.aiuti=[4];Q.applicaSchema(o,s);hold(t.players[3]);
      put(o.players[6],t.players[1].x+.8,t.players[1].z);const p=o.players[4],uomo=t.players[C.MARK[p.i]];put(p,uomo.x,uomo.z);
      const a=A.markTarget(p),attivo=o.aiutoStato?.p===p,prima=Math.hypot(a.x-uomo.x,a.z-uomo.z);
      hold(uomo);G.time+=.1;const b=A.markTarget(p),dopo=Math.hypot(b.x-uomo.x,b.z-uomo.z);
      return {attivo,prima,dopo,ritorno:o.aiutoStato?.p!==p};
    })();
    return {schema,adiacente,centro,skip,paliDestra,paliSinistra,alVolo,geometria,editor,entrata,aiuto};
  });
  console.log('Tattica v0.41 '+JSON.stringify(r));
  assert.deepEqual(errors,[],'nessun errore nella pagina');
  assert.ok(r.schema.saved&&r.schema.indipendente&&r.schema.invalid);assert.deepEqual(r.schema.loaded,[7.6,-5.2]);assert.deepEqual(r.schema.aiuti,[4,5]);assert.ok(r.schema.goalarea>=2.1);
  assert.ok([2,6].includes(r.adiacente),'a parità si costruisce attraverso un vicino del mezzo destro');
  assert.deepEqual(r.centro,{chiuso:null,aperto:1},'il boa è servito solo dopo avere liberato la linea davanti al difensore');
  assert.ok([3,5].includes(r.skip.libero),'un vantaggio reale consente lo skip');assert.notEqual(r.skip.chiuso,5,'il difensore nel corridoio fa rinunciare alla diagonale');assert.ok(r.skip.rischioChiuso>.7&&r.skip.rischioLibero<.2);
  assert.ok(r.paliDestra.vicino-r.paliDestra.lontano>.7,'pali scaglionati già durante il passaggio');assert.deepEqual(r.paliDestra,r.paliSinistra,'schema specchiato al cambio campo');
  assert.deepEqual(r.alVolo,{libero:'shot',marcato:null},'la ricezione al palo non forza il tiro attraverso la marcatura');
  assert.ok(['beduina','sciarpa'].includes(r.geometria.spalle));assert.equal(r.geometria.fronte,'shot');assert.ok(r.geometria.recuperato>.4,'il marcatore recuperato conta anche nella finestra dopo la girata');
  assert.ok(Math.abs(r.editor.profondita-7.6)<1e-9);assert.ok(Math.abs(r.editor.laterale+5.2)<.36);assert.ok(Math.abs(r.editor.boa-4.2)<1e-9);
  assert.deepEqual(r.entrata.taglianti,[4]);assert.ok(r.entrata.cover&&r.entrata.profondita>=6.8&&r.entrata.rientro,'entrata con copertura e pulizia al cambio possesso');
  assert.ok(r.aiuto.attivo&&r.aiuto.prima>3&&r.aiuto.dopo<2&&r.aiuto.ritorno,'aiuto autorizzato e ritorno sul proprio uomo');
}finally{await browser.close();await server.close();}
