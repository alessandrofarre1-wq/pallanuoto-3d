// Sonda (v0.59, taratura): perché e dopo quanti secondi d'azione tira il computer. Gioca partite computer contro computer
// (ITA–HUN, tempi da 8 minuti) e raggruppa i tiri per motivo (al volo, liberato, dopo finta, libero, nessuno davanti, pazienza,
// fine azione, sirena, superiorità, centroboa, girata, controfuga) e per tipo d'azione (parità, superiorità, controfuga).
// Uso: node strumenti/sonda-tiri.mjs [--dist=dist] [--porta=4479] [--partite=2]
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const dist=arg('dist')||'dist', porta=+(arg('porta')||4479), partite=+(arg('partite')||2);
const server=await preview({root,logLevel:'warn',build:{outDir:dist},preview:{port:porta,host:'127.0.0.1',strictPort:true}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const tutti=[];
for(let k=0;k<partite;k++){
  const pg=await browser.newPage({viewport:{width:844,height:390}});
  await pg.addInitScript(seme=>{
    let s=seme; window.__rnd=()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
    let now=0; performance.now=()=>now; window.requestAnimationFrame=cb=>{ window.__raf=cb; return 1; };
    window.__passo=()=>{ now+=1000/60; window.__raf(now); }; window.__logTiri=[];
  },33+k*7);
  await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto',null,{timeout:120000,polling:100});
  const r=await pg.evaluate(()=>{
    const H=window.__pallanuoto; H.scegliSquadre('ITA','HUN'); H.imposta('len','480'); document.getElementById('goBtn').click();
    H.game.autoplay=true; for(const t of H.teams) t.human=false; H.renderer.render=()=>{};
    for(let i=0;i<60*60*40&&H.game.state!=='over';i++){ window.__passo(); }
    return window.__logTiri;
  });
  tutti.push(...r); await pg.close();
}
const per={};
for(const x of tutti){ const k=x.tipo+' · '+x.m; (per[k]=per[k]||[]).push(x); }
console.log(`${tutti.length} tiri in ${partite} partite (${(tutti.length/partite/2).toFixed(1)} per squadra a partita)`);
for(const [k,v] of Object.entries(per).sort((a,b)=>b[1].length-a[1].length)){
  const tm=v.reduce((s,x)=>s+x.t,0)/v.length, dm=v.reduce((s,x)=>s+x.d,0)/v.length;
  console.log(`  ${k.padEnd(34)} ${String(v.length).padStart(4)} (${(100*v.length/tutti.length).toFixed(1)}%) · dopo ${tm.toFixed(1)} s d'azione · da ${dm.toFixed(1)} m`);
}
await browser.close(); server.httpServer.close();
