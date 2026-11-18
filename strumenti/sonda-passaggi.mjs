// Sonda (v0.56, Ale: «i passaggi sembrano calamitati»): in una partita vera computer contro computer misura ogni passaggio:
// come finisce (preso, intercettato, in acqua), a che distanza dal ricevente la palla viene «presa», di quanto salta la palla
// disegnata nel fotogramma della presa (dalla traiettoria alla mano) e quanto si sposta il ricevente per andarle incontro.
// Uso: node strumenti/sonda-passaggi.mjs [--dist=build] [--porta=4481] [--secondi=240]
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const dist=arg('dist')||'dist', porta=+(arg('porta')||4481), secondi=+(arg('secondi')||240);
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
const r=await pg.evaluate((secondi)=>{
  const H=window.__pallanuoto; H.scegliSquadre('ITA','HUN'); H.imposta('len','480'); document.getElementById('goBtn').click();
  H.game.autoplay=true; for(const t of H.teams) t.human=false; H.renderer.render=()=>{};
  const B=H.ball; let cur=null, prev=null; const fine=[];
  // palla disegnata (posizione del modello 3D dopo il disegno del fotogramma, raccordi compresi)
  const vista=()=>H.ball3d?[H.ball3d.position.x,H.ball3d.position.y,H.ball3d.position.z]:(B.state==='held'&&B.holder?.ballW?[...(B.holder.ballVistaW||B.holder.ballW)]:[B.x,B.y,B.z]);
  let dopo=null;      // dopo la presa: il passo più lungo della palla disegnata nei 12 fotogrammi seguenti
  for(let k=0;k<60*secondi;k++){
    const v0=vista(), st0=B.state, kind0=B.kind, tg0=B.target;
    window.__passo();
    if(dopo){ const v=vista(), sp=Math.hypot(v[0]-v0[0],v[1]-v0[1],v[2]-v0[2]); if(sp>dopo.rec.passoDopo){ dopo.rec.passoDopo=sp; const h=B.holder, T=h?.mesh?.T||h?.rig?.T||{}; dopo.rec.perche=`${B.state}/${h?.act?.kind||"-"}/fotogramma ${12-dopo.n}/st0 ${st0} oriz ${(h?.oriz||0).toFixed(2)} vista-gioco ${h?.ballVistaW&&h.ballW?Math.hypot(h.ballVistaW[0]-h.ballW[0],h.ballVistaW[1]-h.ballW[1],h.ballVistaW[2]-h.ballW[2]).toFixed(2):"-"} raccordo ${B.raccordoPresa?"si":"no"} fight ${H.fight.active&&H.fight.boa===h} vista ${!!h?.ballVistaW} i ${h?.i}`; } if(--dopo.n<=0) dopo=null; }
    if(H.game.state!=='play'){ cur=null; continue; }
    if(B.state==='flight'&&B.kind==='pass'&&(!cur||cur.tg!==B.target)&&B.flightT<0.05){
      const m=B.target; cur={tg:m, x0:m.x, z0:m.z, err:Math.hypot(B.tx-m.x,B.tz-m.z), lungo:Math.hypot(B.tx-B.shooter.x,B.tz-B.shooter.z), team:m.team};
    }
    if(cur&&st0==='flight'&&kind0==='pass'&&!(B.state==='flight'&&B.kind==='pass')){
      const v1=vista(), m=cur.tg;
      const esito=B.holder===m?'preso':B.holder&&B.holder.team!==cur.team?'intercettato':B.holder?'altro compagno':'in acqua/altro';
      const rec={esito, salto:Math.hypot(v1[0]-v0[0],v1[1]-v0[1],v1[2]-v0[2]), passoDopo:0, hd:Math.hypot(m.x-v0[0],m.z-v0[2]), y:v0[1], corsa:Math.hypot(m.x-cur.x0,m.z-cur.z0), err:cur.err, lungo:cur.lungo, volo:Math.hypot(B.vx,B.vy,B.vz)/60};
      fine.push(rec); dopo={rec,n:12};
      cur=null;
    }
  }
  return fine;
},secondi);
const per=e=>r.filter(x=>x.esito===e);
const med=(a,k)=>a.length?a.reduce((s,x)=>s+x[k],0)/a.length:0, q=(a,k,f)=>{ const s=a.map(x=>x[k]).sort((x,y)=>x-y); return s.length?s[Math.min(s.length-1,Math.floor(f*s.length))]:0; };
console.log(`${dist}: ${r.length} passaggi in ${secondi} s`);
for(const e of ['preso','intercettato','altro compagno','in acqua/altro']) console.log(`  ${e}: ${per(e).length} (${(100*per(e).length/r.length).toFixed(1)}%)`);
const p=per('preso');
console.log(`  presi: salto della palla disegnata alla presa media ${med(p,'salto').toFixed(2)} m, 90° percentile ${q(p,'salto',0.9).toFixed(2)}, massimo ${q(p,'salto',1).toFixed(2)}`);
console.log(`  presi: passo più lungo della palla disegnata nei 0,2 s dopo la presa media ${med(p,'passoDopo').toFixed(2)} m, massimo ${q(p,'passoDopo',1).toFixed(2)}`);
console.log(`  presi: distanza orizzontale palla-ricevente alla presa media ${med(p,'hd').toFixed(2)} m; altezza palla ${med(p,'y').toFixed(2)} m`);
console.log(`  presi: il ricevente si sposta in volo di ${med(p,'corsa').toFixed(2)} m; errore della mira rispetto a dove era ${med(p,'err').toFixed(2)} m (90° ${q(p,'err',0.9).toFixed(2)}); lunghezza ${med(p,'lungo').toFixed(1)} m`);
console.log(`  presi con salto > 0,4 m: ${p.filter(x=>x.salto>0.4).length}; mira sbagliata di oltre 1,5 m ma presi: ${p.filter(x=>x.err>1.5).length}`);
for(const x of p.filter(x=>x.passoDopo>0.5)) console.log(`  passo lungo dopo la presa ${x.passoDopo.toFixed(2)} m: ${x.perche}`);
await browser.close(); server.httpServer.close();
