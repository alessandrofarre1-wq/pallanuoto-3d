// Sonda delle aperture (v0.54): il portiere dell'Italia para e tiene la palla; si guarda dove vanno i sei di movimento
// nei due schemi e a chi arriva il primo passaggio. Uso: node strumenti/sonda-aperture.mjs [--dist=build]
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=process.argv.find(x=>x.startsWith('--dist='))?.slice(7), porta=4473;
const server=dist?await preview({root,logLevel:'warn',build:{outDir:dist},preview:{port:porta,host:'127.0.0.1',strictPort:true}})
  :await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:porta,strictPort:true,hmr:false,watch:null}});
if(!dist) await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const pg=await browser.newPage({viewport:{width:844,height:390}});
pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.addInitScript(()=>{
  let s=7; window.__rnd=()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  let now=0; performance.now=()=>now; window.requestAnimationFrame=cb=>{ window.__raf=cb; return 1; };
  window.__passo=()=>{ now+=1000/60; window.__raf(now); };
});
await pg.goto('http://127.0.0.1:'+porta,{waitUntil:'domcontentloaded',timeout:120000});
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto',null,{timeout:120000,polling:100});
const out=[];
for(const schema of ['base','apertura2']) for(let prova=0;prova<3;prova++){
  out.push(await pg.evaluate(({schema,prova})=>{
    const H=window.__pallanuoto;
    if(!window.__avviata){ H.scegliSquadre('ITA','HUN'); H.imposta('len','480'); document.getElementById('goBtn').click(); H.game.autoplay=true; for(const t of H.teams) t.human=false; H.renderer.render=()=>{}; window.__avviata=true; }
    for(let k=0;k<60*40&&!(H.game.state==='play');k++) window.__passo();
    const it=H.teams[0], hu=H.teams[1], gx=12.5*it.dir, ogx=-gx;
    // HUN attacca: tutti nella metà dell'Italia, poi il portiere italiano para e ha la palla
    for(const q of H.allPlayers){ q.excluded=false; q.uscendo=false; q.act=null; q.cut=null; q.vx=q.vz=0; q.stamina=1; }
    const atk=[null,[2.6,0],[1.7,6.2],[1.7,-6.2],[5.8,4.6],[5.8,-4.6],[7.5,0]];
    for(const q of hu.players){ if(q.isGK){ q.x=-ogx*1; continue; } const f=atk[q.i]; q.x=ogx+it.dir*(f[0]+0.3*prova); q.z=-f[1]*it.dir*-1; }
    for(const q of it.players){ if(q.isGK){ q.x=ogx+it.dir*0.6; q.z=0; continue; } const f=atk[q.i]; q.x=ogx+it.dir*(f[0]*0.8+0.6); q.z=f[1]*it.dir*0.85; }
    H.game.possTeam=hu; H.game.state='play'; H.game.after=null; H.fight.active=false; H.game.shot=28;
    H.ball.x=it.players[0].x; H.ball.z=0; H.regole.giveBall(it.players[0]);
    const c=it.contro; if(c) c.schema=schema;
    const NUM={2:1,4:2,6:3,5:4,3:5,1:6};
    const primo=[]; let ricevente=null, tRic=null; const t0=H.game.time; let possPersa=false;
    const traccia=[], fotogrammi=[];
    for(let k=0;k<60*7;k++){
      const hb=H.ball.holder;
      if(!ricevente&&hb&&hb.team===it&&!hb.isGK){ ricevente=NUM[hb.i]; tRic=+(H.game.time-t0).toFixed(2); }
      if(H.game.possTeam!==it) possPersa=true;
      if(k===40){ const r=H.prova.riceventeApertura(it); const tg=r&&H.prova.attackTarget(r); traccia.push([[7,r?r.i:-1,tg?+Math.hypot(tg.x-r.x,tg.z-r.z).toFixed(1):-1],[7,r?+Math.min(...hu.players.map(o=>Math.hypot(o.x-r.x,o.z-r.z))).toFixed(1):-1,H.ball.holdTime.toFixed(2)]]); }
      if(false){ const q=it.players[4]; const tg=H.prova.attackTarget(q); traccia.push([[0,+((gx-tg.x)*it.dir).toFixed(1),+(tg.z*it.dir).toFixed(1)],[9,+(q.contactT||0).toFixed(2),+Math.hypot(q.vx,q.vz).toFixed(2)],[8,+q.stamina.toFixed(2),q.scivolaAI?1:0]]); }
      if(k%60===59) traccia.push(it.players.filter(q=>!q.isGK).map(q=>[NUM[q.i],+((gx-q.x)*it.dir).toFixed(1),+(q.z*it.dir).toFixed(1)]).sort((a,b)=>a[0]-b[0]));
      if(k%15===0) fotogrammi.push({t:+(k/60).toFixed(2),b:[+((gx-H.ball.x)*it.dir).toFixed(2),+(H.ball.z*it.dir).toFixed(2)],it:it.players.map(q=>[q.isGK?0:NUM[q.i],+((gx-q.x)*it.dir).toFixed(2),+(q.z*it.dir).toFixed(2)]),hu:hu.players.map(q=>[+((gx-q.x)*it.dir).toFixed(2),+(q.z*it.dir).toFixed(2)])});
      window.__passo();
    }
    return {schema,prova,contro:!!c,ricevente,tRic,possPersa,traccia,fotogrammi};
  },{schema,prova}));
}
for(const r of out){
  console.log(`${r.schema} prova ${r.prova}: controfuga ${r.contro}, primo passaggio del portiere a Pos.${r.ricevente} dopo ${r.tRic} s${r.possPersa?' (palla persa)':''}`);
  r.traccia.forEach((f,k)=>console.log(`  ${k+1} s: `+f.map(([n,d,z])=>`${n}:${d}m/${z>0?'+':''}${z}`).join('  ')));
}
const json=process.argv.find(x=>x.startsWith('--json='))?.slice(7);
if(json){ (await import('node:fs')).writeFileSync(json,JSON.stringify(out)); }
await browser.close(); if(dist) server.httpServer.close(); else await server.close();
