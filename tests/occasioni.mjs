// Occasioni chiare del computer (v0.42): palla in mano entro 7,5 m dalla porta, angolo buono, nessun avversario entro 1,5 m,
// partita computer contro computer; conta cosa ne fa (tiro, passaggio, oppure resta fermo finché arriva un difensore).
// Uso: npm run build && node tests/occasioni.mjs [ESP,HUN]   (usa la cartella dist già costruita)
import { chromium } from 'playwright';
import { preview } from 'vite';
const server=await preview({root:process.cwd(),logLevel:'warn',preview:{port:4394,host:'127.0.0.1'}});
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:800,height:450}});
await p.addInitScript(()=>{ let a=7; Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  let now=0; performance.now=()=>now; window.requestAnimationFrame=cb=>{window.__raf=cb;return 1;};
  window.__passo=()=>{now+=1000/60;window.__raf(now);}; });
await p.goto(server.resolvedUrls.local[0]);
await p.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto',null,{timeout:60000,polling:100});
const ris=await p.evaluate(async([sq])=>{
  const H=window.__pallanuoto; H.scegliSquadre(sq[0],sq[1]); H.imposta('len','480'); document.getElementById('goBtn').click();
  H.game.autoplay=true; for(const t of H.teams) t.human=false; H.__setCtrl(null);
  const R=H.renderer; R.render=()=>{};
  const occ=[]; let cur=null; 
  const goalX=t=>12.5*t.dir;
  let f=0;
  while(H.game.state!=="end"&&f<60*60*45){ window.__passo(); f++;
    const h=H.ball.holder;
    let chiara=false;
    if(h&&!h.isGK&&H.game.state==='play'&&!h.freeThrow){
      const gx=goalX(h.team),d=Math.hypot(gx-h.x,h.z),ang=Math.abs(gx-h.x)/Math.max(.1,d);
      let near=99; for(const o of H.teams.find(t=>t!==h.team).players){ if(o.excluded||o.isGK) continue; near=Math.min(near,Math.hypot(o.x-h.x,o.z-h.z)); }
      chiara=d<7.5&&ang>0.5&&near>1.5;
    }
    if(chiara&&!cur) cur={h,t0:H.game.time,shot:H.game.shot,man:H.teams.find(t=>t===h.team)};
    if(cur&&(H.ball.holder!==cur.h||!chiara)){
      const dur=H.game.time-cur.t0; let e='altro';
      if(H.ball.state==='flight'&&H.ball.shooter===cur.h) e=H.ball.kind==='pass'?'passaggio':'tiro';
      else if(cur.h.act&&!cur.h.act.done) e=cur.h.act.kind==='pass'?'passaggio':'tiro';
      else if(H.ball.holder&&H.ball.holder.team!==cur.h.team) e='persa';
      else if(H.ball.holder===cur.h) e='finita'; // smette di essere chiara (si avvicina un difensore)
      occ.push({dur:+dur.toFixed(2),e,trascorsi:+(28-cur.shot).toFixed(1)}); cur=null;
    }
  }
  return occ;
},[ (process.argv[2]||'ESP,HUN').split(',') ]);
const n=ris.length, per=k=>ris.filter(o=>o.e===k).length;
const lunghe=ris.filter(o=>o.dur>=1);
const ist=k=>ris.filter(o=>o.e===k).map(o=>o.dur).sort((a,b)=>a-b);
console.log('durate tiro',JSON.stringify(ist('tiro')));console.log('durate sfumate',JSON.stringify(ist('finita')));console.log('durate passaggio',JSON.stringify(ist('passaggio')));
console.log(`occasioni chiare: ${n}; tiro ${per('tiro')}, passaggio ${per('passaggio')}, sfumata (difensore arrivato) ${per('finita')}, persa ${per('persa')}, altro ${per('altro')}`);
console.log(`tenute almeno 1 s senza tiro: ${lunghe.filter(o=>o.e!=='tiro').length}; di queste sfumate ${lunghe.filter(o=>o.e==='finita').length}, passate ${lunghe.filter(o=>o.e==='passaggio').length}`);
const prima=ris.filter(o=>o.trascorsi<20), dopo=ris.filter(o=>o.trascorsi>=20);
console.log(`nei primi 20 s del possesso: ${prima.length} occasioni, tiro ${prima.filter(o=>o.e==='tiro').length}; dopo: ${dopo.length}, tiro ${dopo.filter(o=>o.e==='tiro').length}`);
await b.close(); server.httpServer.close();
