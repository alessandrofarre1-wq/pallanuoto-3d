// Una partita, un solo Chromium: occasioni chiare, scelte e servizi effettivi al centro.
// --umano simula soltanto PASSA neutro dell'Italia dopo 1,2s: non è una partita giocata da una persona.
// node strumenti/sonda-boa-v070.mjs [--tempo=180] [--seme=7919] [--umano] [--salva=file.json]
import fs from 'node:fs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
const arg=(k,d)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)||d;
const tempo=+arg('tempo','180'),seme=+arg('seme','7919'),umano=process.argv.includes('--umano'),salva=arg('salva','');
const server=await createServer({logLevel:'warn',server:{host:'127.0.0.1',port:0,hmr:false}});await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:844,height:390}}),errori=[];page.on('pageerror',e=>errori.push(e.message));
 await page.addInitScript(seed=>{
  let a=seed;window.__rnd=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  window.__now=0;performance.now=()=>window.__now;window.requestAnimationFrame=f=>{window.__raf=f;return 1;};
  window.__step=()=>{window.__now+=1000/60;window.__raf(window.__now);};
 },seme);
 await page.goto(server.resolvedUrls.local[0]);
 await page.waitForFunction(()=>window.__pallanuoto?.modelloPronto,null,{polling:100,timeout:120000});
 const r=await page.evaluate(async({tempo,umano})=>{
  const [T,E,S]=await Promise.all(['tiri','entrate','stato'].map(n=>import('/src/'+n+'.js'))),H=window.__pallanuoto,G=H.game,B=H.ball;
  H.scegliSquadre('ITA','HUN');H.imposta('len',String(tempo));G.autoplay=!umano;
  for(const t of H.teams)t.human=umano&&t.idx===0;
  document.getElementById('goBtn').click();H.renderer.render=()=>{};H.senzaCorpi=true;
  const finestre=[],passaggi=[],ultimo=new Map();let volo=null,chiaveVolo=null;
  const fascia=eta=>eta<6?'0–6':eta<15?'6–15':'15+';
  const descrivi=(p,m)=>{
   const eta=G.time-G.possT,o=S.other(p.team),raddoppio=o.doubleP===m&&o.doubleUntil>G.time||o.adattamentoEntrata?.tipo==='raddoppio';
   return {squadra:p.team.short,fonte:p.team.human?'PASSA neutro simulato':'CPU',eta,fascia:fascia(eta),difesa:raddoppio?'raddoppio':['uomo','zona','pressing','M'][o.defPlay],
    da:p.num,a:m.num,mano:m.mano,distanzaPorta:Math.hypot(S.goalX(m.team)-m.x,m.z)};
  };
  let f=0;
  for(;f<60*60*45&&G.state!=='over';f++){
   const p=G.state==='play'&&B.holder;
   if(p&&!p.isGK&&B.holdTime>=.18){
    const m=E.centroAttacco(p.team),chiara=T.occasioneBoa(p,m),key=G.possT+':'+p.uid+':'+p.ricevutoT;
    let rec=ultimo.get(p.team);
    if(chiara){
     if(!rec||rec.key!==key){rec={key,presente:true,record:{...descrivi(p,m),inizio:G.time,secondi:0,sceltaNeutra:T.humanPassTarget(p,0,0)===m,sceltaCPU:T.bestPassTarget(p,false)===m}};finestre.push(rec.record);ultimo.set(p.team,rec);}
     rec.record.secondi+=1/60;
    }else if(rec)ultimo.delete(p.team);
   }
   if(umano&&G.state==='play'&&H.ctrl&&B.holder===H.ctrl&&B.holdTime>1.2&&!H.ctrl.act){
    const h=H.ctrl,m=T.humanPassTarget(h,0,0);if(m)T.startAct(h,'pass',.08,()=>T.doPass(h,m),[m.x,m.z]);
   }
   window.__step();
   const inVolo=B.state==='flight'&&B.kind==='pass';
   const key=inVolo?B.shooter.uid+':'+B.target?.uid+':'+Math.round((G.time-B.flightT)*1000):null;
   if(volo&&(!inVolo||volo.key!==key)){
    volo.record.esito=B.holder===volo.dest?'presa':B.holder&&B.holder.team!==volo.team?'intercetto':B.holder?'altro compagno':'in acqua/altro';volo=null;
   }
   if(inVolo&&key!==chiaveVolo){
    chiaveVolo=key;
    const h=B.shooter,m=B.target;if(!m)continue;
    const centro=E.centroAttacco(h.team)===m,record={...descrivi(h,m),centro,inizio:G.time,esito:null};
    passaggi.push(record);volo={key,record,dest:m,team:h.team};
   }
   if(!inVolo)chiaveVolo=null;
  }
  if(volo)volo.record.esito='volo a fine osservazione';
  return {finita:G.state==='over',fotogrammi:f,risultato:H.teams.map(t=>({squadra:t.short,gol:t.score})),finestre,passaggi};
 },{tempo,umano});
 const gruppi={};
 for(const f of r.finestre){const k=f.fonte+' / '+f.fascia+' / '+f.difesa;const g=gruppi[k]??={finestre:0,secondi:0,scelteCPU:0,scelteNeutre:0};g.finestre++;g.secondi+=f.secondi;g.scelteCPU+=+f.sceltaCPU;g.scelteNeutre+=+f.sceltaNeutra;}
 const centro=r.passaggi.filter(p=>p.centro),out={nota:'Una sola partita diagnostica. Le finestre sono episodi geometrici osservati, non opportunità indipendenti o una probabilità di gol; le scelte aggiuntive sono deterministiche e non lanciano la palla.',tempo,seme,umano,finita:r.finita,risultato:r.risultato,
  riepilogo:{passaggi:r.passaggi.length,alCentro:centro.length,preseCentro:centro.filter(p=>p.esito==='presa').length,intercettiCentro:centro.filter(p=>p.esito==='intercetto').length,finestreChiare:r.finestre.length,gruppi},dettaglio:r};
 console.log(JSON.stringify(out,null,2));
 if(salva)fs.writeFileSync(salva,JSON.stringify(out,null,2)+'\n');
 if(errori.length||!r.finita){console.log('ERRORI',errori,'finita',r.finita);process.exitCode=1;}
}finally{await browser.close();await server.close();}
