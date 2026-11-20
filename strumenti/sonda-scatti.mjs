// Sonda (v0.67, punto 5 di Ale: «il computer scatta troppo e si stanca»): in quali situazioni scattano i giocatori di movimento e
// quanto si stancano. Gioca partite computer contro computer (ITA–HUN, tempi da 8 minuti) e, a ogni fotogramma di gioco, divide il
// tempo in scatto per situazione: con la palla, ripartenza (dopo un recupero), transizione in attacco (palla a oltre 10 m dalla porta
// avversaria), attacco schierato, entrata, rientro in difesa (palla a oltre 10 m dalla propria porta), difesa schierata, uomo in più
// o in meno. Conta anche il tempo sotto la soglia dei cambi (0,34) e i cambi fatti dal computer.
// Uso: node strumenti/sonda-scatti.mjs [--dist=dist] [--porta=4505] [--partite=3] [--paralleli=3]
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const dist=arg('dist')||'dist', porta=+(arg('porta')||4505), partite=+(arg('partite')||3), paralleli=+(arg('paralleli')||3);
const server=await preview({root,logLevel:'warn',build:{outDir:dist},preview:{port:porta,host:'127.0.0.1',strictPort:true}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});

async function partita(k){
  const pg=await browser.newPage({viewport:{width:844,height:390}});
  await pg.addInitScript(seme=>{
    let s=seme; window.__rnd=()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
    let now=0; performance.now=()=>now; window.requestAnimationFrame=cb=>{ window.__raf=cb; return 1; };
    window.__passo=()=>{ now+=1000/60; window.__raf(now); };
  },33+k*7);
  await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto',null,{timeout:120000,polling:100});
  const r=await pg.evaluate(()=>{
    const H=window.__pallanuoto, b=H.ball, g=H.game;
    H.scegliSquadre('ITA','HUN'); H.imposta('len','480'); document.getElementById('goBtn').click();
    g.autoplay=true; for(const t of H.teams) t.human=false; H.renderer.render=()=>{};
    const dt=1/60, scatto={}, gioco={}, contatto={}; let tempoGioco=0, sottoSoglia=0, cambi=0;
    H.cronaca.ascoltatori.push((tipo,testo)=>{ if(tipo==='info'&&/Cambio/.test(testo)) cambi++; });
    for(let i=0;i<60*60*40&&g.state!=='over';i++){
      window.__passo();
      if(g.state!=='play') continue;
      tempoGioco+=dt;
      for(const t of H.teams){
        const o=H.teams.find(x=>x!==t), inMeno=t.players.some(q=>q.excluded), inPiu=o.players.some(q=>q.excluded);
        const gxA=t.dir*12.5, gxD=-t.dir*12.5, possesso=g.possTeam===t;
        for(const p of t.players){
          if(p.isGK||p.excluded) continue;
          let k;
          if(inPiu||inMeno) k=inPiu?'uomo in più':'uomo in meno';
          else if(possesso){
            if(b.holder===p) k='con la palla';
            else if(H.v046.contropiede(t)) k='ripartenza';
            else if(p.cut) k='entrata';
            else if(Math.abs(gxA-b.x)>10) k='transizione in attacco';
            else k='attacco schierato';
          } else k=Math.abs(gxD-b.x)>10?'rientro in difesa':'difesa schierata';
          gioco[k]=(gioco[k]||0)+dt;
          if(p.sprinting) scatto[k]=(scatto[k]||0)+dt;
          if(p.contactT>0) contatto[k]=(contatto[k]||0)+dt;
          if(p.stamina<0.34) sottoSoglia+=dt;
        }
      }
    }
    return { scatto, gioco, contatto, tempoGioco, sottoSoglia, cambi };
  });
  await pg.close(); return r;
}
const tot={ scatto:{}, gioco:{}, contatto:{}, tempoGioco:0, sottoSoglia:0, cambi:0 };
for(let k=0;k<partite;k+=paralleli){
  const giro=[]; for(let j=k;j<Math.min(partite,k+paralleli);j++) giro.push(partita(j));
  for(const r of await Promise.all(giro)){
    for(const n of ['scatto','gioco','contatto']) for(const [c,v] of Object.entries(r[n])) tot[n][c]=(tot[n][c]||0)+v;
    tot.tempoGioco+=r.tempoGioco; tot.sottoSoglia+=r.sottoSoglia; tot.cambi+=r.cambi;
  }
}
await browser.close(); server.httpServer.close();
const giocatori=12, tScatto=Object.values(tot.scatto).reduce((s,x)=>s+x,0), tGioco=Object.values(tot.gioco).reduce((s,x)=>s+x,0);
console.log(`${partite} partite · tempo di gioco ${(tot.tempoGioco/partite).toFixed(0)} s a partita · in scatto ${(100*tScatto/tGioco).toFixed(0)}% del tempo dei giocatori di movimento`);
const tCont=Object.values(tot.contatto).reduce((a,x)=>a+x,0);
console.log(`in contatto con un avversario (costa stamina come uno scatto e più): ${(100*tCont/tGioco).toFixed(0)}% del tempo`);
console.log(`sotto la soglia dei cambi (0,34): ${(100*tot.sottoSoglia/tGioco).toFixed(1)}% del tempo · cambi ${(tot.cambi/partite).toFixed(1)} a partita (le due squadre)`);
console.log('situazione                  tempo   in scatto   quota di tutti gli scatti                           in contatto');
for(const [c,v] of Object.entries(tot.gioco).sort((a,b)=>(tot.scatto[b[0]]||0)-(tot.scatto[a[0]]||0))){
  const s=tot.scatto[c]||0;
  console.log(`  ${c.padEnd(24)} ${(100*v/tGioco).toFixed(0).padStart(4)}%  ${(100*s/v).toFixed(0).padStart(6)}%  ${(100*s/Math.max(1e-9,tScatto)).toFixed(0).padStart(10)}%  (${(s/partite/giocatori).toFixed(0)} s a giocatore per partita)  ${(100*(tot.contatto[c]||0)/v).toFixed(0).padStart(4)}%`);
}
