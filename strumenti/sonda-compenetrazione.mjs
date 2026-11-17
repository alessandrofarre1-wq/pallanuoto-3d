// Sonda (v0.55, Ale: «i corpi non possono compenetrarsi, e neanche la palla»): in una partita vera computer contro computer conta
// i fotogrammi in cui le teste disegnate di due giocatori sono più vicine di TESTE m (si fondono) e quelli in cui la palla disegnata
// sta dentro la testa di un giocatore che non la tiene. Uso: node strumenti/sonda-compenetrazione.mjs [--dist=build] [--porta=4480]
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const dist=arg('dist')||'dist', porta=+(arg('porta')||4480);
const server=await preview({root,logLevel:'warn',build:{outDir:dist},preview:{port:porta,host:'127.0.0.1',strictPort:true}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const pg=await browser.newPage({viewport:{width:844,height:390}});
await pg.addInitScript(()=>{
  let s=33; window.__rnd=()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  let now=0; performance.now=()=>now; window.requestAnimationFrame=cb=>{ window.__raf=cb; return 1; };
  window.__passo=()=>{ now+=1000/60; window.__raf(now); };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto',null,{timeout:120000,polling:100});
const r=await pg.evaluate(()=>{
  const H=window.__pallanuoto; H.scegliSquadre('ITA','HUN'); H.imposta('len','480'); document.getElementById('goBtn').click();
  H.game.autoplay=true; for(const t of H.teams) t.human=false; H.renderer.render=()=>{};
  const TESTE=0.26;
  let fot=0, teste=0, palla=0, minima=9; const casi=[];
  const pos={ setFromMatrixPosition(m){ const e=m.elements; this.x=e[12]; this.y=e[13]; this.z=e[14]; return this; } };
  const testa=p=>{ const o=p.mesh?.corpo?.ossa?.testa||p.mesh?.corpo?.ossa?.head; if(!o) return null; o.getWorldPosition(pos); return [pos.x,pos.y,pos.z]; };
  for(let k=0;k<60*240;k++){ window.__passo(); if(H.game.state!=='play'||k%2) continue; fot++;
    const P=H.allPlayers.filter(p=>!p.excluded&&p.mesh?.g?.visible!==false), T=P.map(testa);
    let fusi=false;
    for(let i=0;i<P.length;i++) for(let j=i+1;j<P.length;j++){ const a=T[i],b=T[j]; if(!a||!b) continue; const d=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]); minima=Math.min(minima,d); if(d<TESTE){ fusi=true; if(casi.length<8){ const a=P[i],b2=P[j]; casi.push(`centri ${Math.hypot(a.x-b2.x,a.z-b2.z).toFixed(2)} m · ${a.team.short}${a.i}${a.act?'/'+a.act.kind:''}${H.fight.active&&(H.fight.boa===a||H.fight.def===a)?'/lotta':''} oriz ${(a.oriz||0).toFixed(1)} · ${b2.team.short}${b2.i}${b2.act?'/'+b2.act.kind:''}${H.fight.active&&(H.fight.boa===b2||H.fight.def===b2)?'/lotta':''} oriz ${(b2.oriz||0).toFixed(1)} · teste ${(d*100).toFixed(0)} cm`); } } }
    if(fusi) teste++;
    const h=H.ball.holder, bv=h&&h.ballVistaW; if(bv){ for(let i=0;i<P.length;i++){ if(P[i]===h||!T[i]) continue; if(Math.hypot(bv[0]-T[i][0],bv[1]-T[i][1],bv[2]-T[i][2])<0.24){ palla++; break; } } }
  }
  return {casi,fot,teste,palla,minima,ossa:Object.keys(H.allPlayers[1].mesh?.corpo?.ossa||{}).join(',')};
});
console.log(`${dist}: teste fuse in ${r.teste} fotogrammi su ${r.fot} (${(100*r.teste/r.fot).toFixed(2)}%), distanza minima tra teste ${(r.minima*100).toFixed(0)} cm; palla dentro una testa altrui in ${r.palla} fotogrammi`);
for(const c of r.casi) console.log('  '+c);
if(!/test|head/.test(r.ossa)) console.log('ossa disponibili: '+r.ossa);
await browser.close(); server.httpServer.close();
