// Sonda (v0.60, taratura): dove si spende il tempo di un'azione. Partite computer contro computer (ITA–HUN, tempi da 8 minuti);
// per ogni azione registra tipo, durata, quando la palla arriva per la prima volta entro 10 m dalla porta avversaria («arrivo in
// attacco»), passaggi e come finisce. Così si separa la transizione (dal recupero all'arrivo) dall'attacco schierato.
// Uso: node strumenti/sonda-azioni.mjs [--dist=dist] [--porta=4481] [--partite=2]
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const dist=arg('dist')||'dist', porta=+(arg('porta')||4481), partite=+(arg('partite')||2);
const server=await preview({root,logLevel:'warn',build:{outDir:dist},preview:{port:porta,host:'127.0.0.1',strictPort:true}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const tutte=[];
for(let k=0;k<partite;k++){
  const pg=await browser.newPage({viewport:{width:844,height:390}});
  await pg.addInitScript(seme=>{
    let s=seme; window.__rnd=()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
    let now=0; performance.now=()=>now; window.requestAnimationFrame=cb=>{ window.__raf=cb; return 1; };
    window.__passo=()=>{ now+=1000/60; window.__raf(now); };
  },33+k*7);
  await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto',null,{timeout:120000,polling:100});
  const r=await pg.evaluate(()=>{
    const H=window.__pallanuoto; H.scegliSquadre('ITA','HUN'); H.imposta('len','480'); document.getElementById('goBtn').click();
    H.game.autoplay=true; for(const t of H.teams) t.human=false; H.renderer.render=()=>{};
    const out=[]; let cur=null, rec=null;
    const esito=()=>{ const e=H.cronaca.registro.at(-1); return e?e.tipo+':'+e.testo:''; };
    for(let i=0;i<60*60*40&&H.game.state!=='over';i++){
      window.__passo();
      const az=H.v046.azioneAperta();
      if(az!==cur||(rec&&!az)){
        if(rec){ rec.durata=H.game.time-rec.t0; const u=H.v046.ultimaAzioneChiusa(); rec.fine=u&&u.a.t0===rec.t0?u.esito:'(annullata) '+esito(); out.push(rec); }
        cur=az; rec=az?{tipo:az.tipo,t0:az.t0,arrivo:null,passaggi0:H.game.passaggi||0,x0:null}:null;
      }
      if(rec&&az){
        if(rec.tipo!==az.tipo) rec.tipo=az.tipo;
        const h=H.ball.holder;
        if(h&&h.team===az.t){
          const dx=Math.abs(az.t.dir*12.5-h.x);
          if(rec.x0===null) rec.x0=+dx.toFixed(1);
          if(rec.arrivo===null&&dx<10) rec.arrivo=H.game.time-rec.t0;
        }
        rec.passaggi=(H.game.passaggi||0)-rec.passaggi0;
      }
    }
    return out;
  });
  tutte.push(...r); await pg.close();
}
const media=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
for(const tipo of ['parita','superiorita','controfuga']){
  const v=tutte.filter(a=>a.tipo===tipo&&a.durata>0.3); if(!v.length) continue;
  const conA=v.filter(a=>a.arrivo!==null), lont=v.filter(a=>a.x0!==null&&a.x0>=10);
  console.log(`${tipo}: ${v.length} azioni (${(v.length/partite/2).toFixed(1)} per squadra a partita) · durata media ${media(v.map(a=>a.durata)).toFixed(1)} s`);
  console.log(`   partite lontano (palla presa a 10+ m dalla porta avversaria): ${lont.length} · arrivo in attacco dopo ${media(lont.filter(a=>a.arrivo!==null).map(a=>a.arrivo)).toFixed(1)} s · poi attacco ${media(lont.filter(a=>a.arrivo!==null).map(a=>a.durata-a.arrivo)).toFixed(1)} s`);
  console.log(`   partite già vicino: ${v.length-lont.length} · durata ${media(v.filter(a=>!(a.x0>=10)).map(a=>a.durata)).toFixed(1)} s · arrivate in attacco ${conA.length}/${v.length} · passaggi medi ${media(v.map(a=>a.passaggi||0)).toFixed(1)}`);
  const fasce=[[0,5],[5,10],[10,15],[15,20],[20,25],[25,40]];
  console.log('   durate: '+fasce.map(([a,b])=>`${a}-${b}s ${v.filter(x=>x.durata>=a&&x.durata<b).length}`).join(' · '));
  for(const [nome,f] of [['brevi (meno di 10 s)',x=>x.durata<10],['lunghe (10 s e più)',x=>x.durata>=10]]){
    const w=v.filter(f), fini={}; for(const a of w){ const k=(a.fine||'').split(':')[0]; fini[k]=(fini[k]||0)+1; }
    console.log(`   esiti ${nome}, ${w.length}: `+Object.entries(fini).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${k} ${n}`).join(' · '));
  }
}
await browser.close(); server.httpServer.close();
