// Sonda (v0.66, taratura): le entrate (il taglio verso la porta). Gioca partite computer contro computer (ITA–HUN, tempi da 8
// minuti) e registra: quanto tempo ogni squadra usa ciascuno schema d'attacco in parità, ogni entrata che parte (ruolo, schema,
// blocco riuscito), lo spazio che chi entra guadagna sul difensore più vicino, se gli arriva un passaggio, se tira e come va.
// Uso: node strumenti/sonda-entrate.mjs [--dist=dist] [--porta=4493] [--partite=6] [--paralleli=3] [--json=file] [--schema=entrata]
// --schema=<id> dà a tutte e due le squadre lo schema d'attacco indicato (arco, entrata, incrocio, boa, pali) a inizio partita.
import { chromium } from 'playwright';
import { preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const dist=arg('dist')||'dist', porta=+(arg('porta')||4493), partite=+(arg('partite')||6), paralleli=+(arg('paralleli')||3), json=arg('json'), schema=arg('schema');
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
  const r=await pg.evaluate(schema=>{
    const H=window.__pallanuoto, b=H.ball, g=H.game;
    H.scegliSquadre('ITA','HUN'); H.imposta('len','480'); document.getElementById('goBtn').click();
    g.autoplay=true; for(const t of H.teams) t.human=false; H.renderer.render=()=>{};
    if(schema) for(const t of H.teams) H.prova.applicaSchema(t,H.prova.copiaSchema(schema));
    const schemi={}, entrate=[], aperte=new Map(), dopo=new Map(), tiriEntrata=[]; let prima=false, cur=null;
    H.cronaca.ascoltatori.push((tipo,testo)=>{ if(!cur||cur.esito) return;
      if(tipo==='gol') cur.esito='gol'; else if(tipo==='parata') cur.esito=/muro/i.test(testo)?'muro':'parata'; else if(/fuori/i.test(testo)) cur.esito='fuori'; });
    const dt=1/60;
    for(let i=0;i<60*60*40&&g.state!=='over';i++){
      window.__passo();
      const pt=g.state==='play'&&g.possTeam;
      if(pt&&!H.teams.find(x=>x!==pt).players.some(q=>q.excluded)){ const id=pt.schema?.id||'-'; const k2=pt.short+' '+id; schemi[k2]=(schemi[k2]||0)+dt; }
      for(const t of H.teams) for(const p of t.players){
        const e=aperte.get(p);
        if(p.cut&&!e){
          const o={ squadra:t.short, i:p.i, schema:t.schema?.id||'-', t0:g.time, spazioMax:0, spazio:[], passaggio:false, presa:false, tiro:false, blocco:false };
          aperte.set(p,o); entrate.push(o);
        }
        if(e){
          // la ricezione chiude il taglio (giveBall): se la palla è sua, ha ricevuto in entrata; poi si guarda se tira entro 3 s
          if(!p.cut||p.excluded){ aperte.delete(p); if(b.holder===p){ e.presa=true; e.tPresa=g.time; e.dPresa=Math.hypot(t.dir*12.5-p.x,p.z); dopo.set(p,e); } continue; }
          const dif=H.teams.find(x=>x!==t).players.filter(q=>!q.excluded&&!q.isGK);
          const vic=Math.min(...dif.map(q=>Math.hypot(q.x-p.x,q.z-p.z)));
          e.spazioMax=Math.max(e.spazioMax,vic); if(e.spazio.length<400) e.spazio.push(+vic.toFixed(2));
          if(b.state==='flight'&&b.kind==='pass'&&b.target===p) e.passaggio=true;
          if(b.holder===p) e.presa=true;
          if(t.blocco&&t.blocco.entrante===p&&t.blocco.fatto) e.blocco=true;
        }
      }
      const ora=b.state==='flight'&&b.kind==='shot';
      if(ora&&!prima&&b.shooter){
        if(cur&&!cur.esito) cur.esito='altro';
        cur=null;
        const e=dopo.get(b.shooter);
        if(b.tipoTiro==='entrata'||(e&&g.time-e.tPresa<3)){ cur={ squadra:b.shooter.team.short, i:b.shooter.i, tipo:b.tipoTiro, dopoPresa:e?g.time-e.tPresa:-1, d:Math.hypot(b.shooter.team.dir*12.5-b.shooter.x,b.shooter.z), esito:null }; tiriEntrata.push(cur); }
        if(e&&g.time-e.tPresa<3){ e.tiro=true; dopo.delete(b.shooter); }
      }
      prima=ora;
    }
    if(cur&&!cur.esito) cur.esito='altro';
    for(const e of entrate){ e.durata=e.spazio.length/60; e.spazioMedio=e.spazio.length?e.spazio.reduce((s,x)=>s+x,0)/e.spazio.length:0; delete e.spazio; }
    return { schemi, entrate, tiriEntrata, gol:H.teams.map(t=>t.score) };
  },schema);
  await pg.close(); return r;
}
const tutto={ schemi:{}, entrate:[], tiriEntrata:[], gol:[] };
for(let k=0;k<partite;k+=paralleli){
  const giro=[]; for(let j=k;j<Math.min(partite,k+paralleli);j++) giro.push(partita(j));
  for(const r of await Promise.all(giro)){ for(const [k2,v] of Object.entries(r.schemi)) tutto.schemi[k2]=(tutto.schemi[k2]||0)+v; tutto.entrate.push(...r.entrate); tutto.tiriEntrata.push(...r.tiriEntrata); tutto.gol.push(r.gol); }
}
await browser.close(); server.httpServer.close();
if(json) fs.writeFileSync(json,JSON.stringify(tutto));
const pc=(a,n)=>n?(100*a/n).toFixed(0)+'%':'-';
console.log(`${partite} partite · gol ${tutto.gol.map(x=>x.join('-')).join(', ')}`);
console.log('\nTEMPO IN PARITÀ PER SCHEMA (attacco)');
for(const [k,v] of Object.entries(tutto.schemi).sort()) console.log(`  ${k.padEnd(18)} ${(v/partite).toFixed(0)} s a partita`);
const E=tutto.entrate;
console.log(`\nENTRATE: ${E.length} (${(E.length/partite/2).toFixed(1)} per squadra a partita)`);
for(const s of [...new Set(E.map(e=>e.schema))]){
  const v=E.filter(e=>e.schema===s);
  console.log(`  schema ${s.padEnd(10)} ${v.length} entrate · durata ${(v.reduce((a,e)=>a+e.durata,0)/v.length).toFixed(1)} s · spazio medio ${(v.reduce((a,e)=>a+e.spazioMedio,0)/v.length).toFixed(2)} m, massimo ${(v.reduce((a,e)=>a+e.spazioMax,0)/v.length).toFixed(2)} m · oltre 2 m ${pc(v.filter(e=>e.spazioMax>2).length,v.length)} · blocco riuscito ${pc(v.filter(e=>e.blocco).length,v.length)} · passaggio a chi entra ${pc(v.filter(e=>e.passaggio).length,v.length)} · presa ${pc(v.filter(e=>e.presa).length,v.length)} · tiro ${pc(v.filter(e=>e.tiro).length,v.length)}`);
}
const T=tutto.tiriEntrata;
console.log(`\nTIRI DI CHI HA RICEVUTO IN ENTRATA (entro 3 s) O CONTATI COME «ENTRATA»: ${T.length} · gol ${T.filter(x=>x.esito==='gol').length} · parate ${T.filter(x=>x.esito==='parata').length} · muri ${T.filter(x=>x.esito==='muro').length}`);
for(const tipo of [...new Set(T.map(x=>x.tipo))]){ const v=T.filter(x=>x.tipo===tipo); console.log(`  contati come «${tipo}»: ${v.length} · gol ${v.filter(x=>x.esito==='gol').length} · da ${(v.reduce((a,x)=>a+x.d,0)/v.length).toFixed(1)} m · ${(v.filter(x=>x.dopoPresa>=0).reduce((a,x)=>a+x.dopoPresa,0)/Math.max(1,v.filter(x=>x.dopoPresa>=0).length)).toFixed(1)} s dopo la presa`); }
const P=E.filter(e=>e.presa); console.log(`  prese in entrata: ${P.length} · a ${(P.reduce((a,e)=>a+e.dPresa,0)/Math.max(1,P.length)).toFixed(1)} m dalla porta · ${(P.reduce((a,e)=>a+(e.tPresa-e.t0),0)/Math.max(1,P.length)).toFixed(1)} s dopo l'inizio del taglio`);
