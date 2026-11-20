// Sonda (v0.65, taratura): come vanno i tiri con l'uomo in più. Gioca partite computer contro computer (ITA–HUN, tempi da 8
// minuti) e per ogni tiro registra l'esito (gol, parata, muro, fuori, legno), chi tira (posto, distanza, lato), perché tira (motivo
// della sonda dei tiri), con quale gesto e, con l'uomo in più, lo schema e i secondi passati dall'inizio della superiorità.
// Le stesse misure per i tiri in parità servono da confronto. In più: espulsioni e superiorità trasformate (gol con l'uomo in più
// diviso espulsioni, come `npm run bilancio`) e i passaggi con l'uomo in più per fascia di tempo, con la quota di cambi di lato.
// Reale: 52% di superiorità trasformate (Mondiali 2025). Semi diversi da `npm run taratura`: è un secondo campione.
// Uso: node strumenti/sonda-superiorita.mjs [--dist=dist] [--porta=4483] [--partite=6] [--paralleli=3] [--json=file]
import { chromium } from 'playwright';
import { preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const dist=arg('dist')||'dist', porta=+(arg('porta')||4483), partite=+(arg('partite')||6), paralleli=+(arg('paralleli')||3), json=arg('json');
const server=await preview({root,logLevel:'warn',build:{outDir:dist},preview:{port:porta,host:'127.0.0.1',strictPort:true}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});

async function partita(k){
  const pg=await browser.newPage({viewport:{width:844,height:390}});
  await pg.addInitScript(seme=>{
    let s=seme; window.__rnd=()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
    let now=0; performance.now=()=>now; window.requestAnimationFrame=cb=>{ window.__raf=cb; return 1; };
    window.__passo=()=>{ now+=1000/60; window.__raf(now); }; window.__logTiri=[];
  },33+k*7);
  await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto',null,{timeout:120000,polling:100});
  const r=await pg.evaluate(()=>{
    const H=window.__pallanuoto, b=H.ball, g=H.game;
    H.scegliSquadre('ITA','HUN'); H.imposta('len','480'); document.getElementById('goBtn').click();
    g.autoplay=true; for(const t of H.teams) t.human=false; H.renderer.render=()=>{};
    const tiri=[], passaggi=[], inizioSup=new Map(), daEntrata=new Map(); let cur=null, prima=false, primaPass=false, espulsioni=0; const perSquadra={};
    // esito del tiro: il primo evento della cronaca dopo il tiro (il legno aspetta quello che succede dopo)
    H.cronaca.ascoltatori.push((tipo,testo)=>{
      if(tipo==='espulsione') espulsioni++;
      // la superiorità va alla squadra avversaria dell'espulso (nel testo c'è «SIGLA #numero» dell'espulso)
      if(tipo==='espulsione'){
        const pos=H.teams.map(x=>({ x, i:testo.indexOf(x.short+' #') })).filter(o=>o.i>=0).sort((a,b)=>a.i-b.i)[0];      // il primo è l'espulso
        const a=pos&&H.teams.find(x=>x!==pos.x); if(a) perSquadra[a.short]=(perSquadra[a.short]||0)+1;
      }
      if(!cur||cur.esito) return;
      if(tipo==='gol') cur.esito='gol';
      else if(tipo==='parata') cur.esito=/muro/i.test(testo)?'muro':'parata';
      else if(tipo==='legno') cur.legno=true;
      else if(/fuori/i.test(testo)) cur.esito='fuori';
    });
    for(let i=0;i<60*60*40&&g.state!=='over';i++){
      window.__passo();
      for(const t of H.teams){ const n=t.players.some(q=>q.excluded); if(n&&!inizioSup.has(t)){ inizioSup.set(t,g.time);
          // superiorità nata durante un'entrata (o entro 3 s dall'inizio di un taglio) della squadra che attacca
          const a=H.teams.find(x=>x!==t); daEntrata.set(t,a.players.some(q=>q.cut||g.time-(q.cutT||-99)<3)); }
        else if(!n){ inizioSup.delete(t); daEntrata.delete(t); } }
      const ora=b.state==='flight'&&b.kind==='shot';
      if(ora&&!prima&&b.shooter){
        if(cur&&!cur.esito) cur.esito=cur.legno?'legno':'altro';
        const p=b.shooter, t=p.team, dif=H.teams.find(x=>x!==t), gx=t.dir*12.5, log=window.__logTiri[window.__logTiri.length-1]||{};
        const sup=dif.players.some(q=>q.excluded), u=sup&&t.uomo&&t.uomo.schema;
        const vicino=Math.min(...dif.players.filter(q=>!q.isGK&&!q.excluded).map(q=>Math.hypot(q.x-p.x,q.z-p.z)));
        cur={ squadra:t.short, nome:p.name, pre:p.s.pre, stamina:+p.stamina.toFixed(2), sup, tipo:b.tipoTiro||'-', m:log.m||'-', az:log.tipo||'-', i:p.i, d:Math.hypot(gx-p.x,p.z), z:p.z*t.dir,
          gesto:p.act?p.act.kind:'-', potenza:b.shotPower||0, lob:!!b.lob, dopoCambio:!!b.dopoCambio, liberato:!!b.liberato,
          marcato:b.marcato||0, vicino, gkFuori:b.gkFuoriPosto||0, schema:u?u.id:'-', fase:u?t.uomo.fase:-1,
          tSup:sup&&inizioSup.has(dif)?g.time-inizioSup.get(dif):-1, daEntrata:sup&&!!daEntrata.get(dif), esito:null, legno:false };
        tiri.push(cur);
      }
      prima=ora;
      // passaggi con l'uomo in più: secondi dall'inizio della superiorità e cambio di lato (da una metà all'altra, oltre 5 m)
      const pass=b.state==='flight'&&b.kind==='pass';
      if(pass&&!primaPass&&b.shooter&&b.target&&!b.shooter.isGK){
        const t=b.shooter.team, dif=H.teams.find(x=>x!==t);
        if(dif.players.some(q=>q.excluded)&&inizioSup.has(dif)) passaggi.push({ tSup:g.time-inizioSup.get(dif), cambio:Math.abs(b.shooter.z-b.target.z)>5&&Math.sign(b.shooter.z||1)!==Math.sign(b.target.z||1), da:b.shooter.i, a:b.target.i });
      }
      primaPass=pass;
    }
    if(cur&&!cur.esito) cur.esito=cur.legno?'legno':'altro';
    return { tiri, passaggi, espulsioni, perSquadra };
  });
  await pg.close(); return r;
}
const tutti=[], passaggi=[], supPerSquadra={}; let espulsioni=0;
for(let k=0;k<partite;k+=paralleli){
  const giro=[]; for(let j=k;j<Math.min(partite,k+paralleli);j++) giro.push(partita(j));
  for(const r of await Promise.all(giro)){ tutti.push(...r.tiri); passaggi.push(...r.passaggi); espulsioni+=r.espulsioni; for(const [k,v] of Object.entries(r.perSquadra)) supPerSquadra[k]=(supPerSquadra[k]||0)+v; }
}
await browser.close(); server.httpServer.close();
if(json) fs.writeFileSync(json,JSON.stringify(tutti));

const ESITI=['gol','parata','muro','fuori','legno','altro'];
const pc=(a,n)=>n?(100*a/n).toFixed(0).padStart(3)+'%':'   -';
function tabella(titolo,lista,chiave,min=1){
  const per={}; for(const x of lista){ const k=chiave(x); (per[k]=per[k]||[]).push(x); }
  console.log(`  ${titolo}`);
  for(const [k,v] of Object.entries(per).sort((a,b)=>b[1].length-a[1].length)){
    if(v.length<min) continue;
    const c=Object.fromEntries(ESITI.map(e=>[e,v.filter(x=>x.esito===e).length]));
    console.log(`    ${String(k).padEnd(22)} ${String(v.length).padStart(4)} (${pc(v.length,lista.length)}) · `+ESITI.map(e=>`${e} ${pc(c[e],v.length)}`).join(' · ')+` · da ${(v.reduce((s,x)=>s+x.d,0)/v.length).toFixed(1)} m`);
  }
}
const fascia=(x,lim)=>{ for(const [l,n] of lim) if(x<l) return n; return lim[lim.length-1][1]; };
const sup=tutti.filter(x=>x.sup&&x.tipo!=='rigore'), par=tutti.filter(x=>!x.sup&&x.az==='parita'&&x.tipo!=='rigore');
console.log(`${tutti.length} tiri in ${partite} partite · con l'uomo in più ${sup.length} (${(sup.length/partite/2).toFixed(1)} per squadra a partita) · in parità ${par.length}`);
for(const k of [...new Set(tutti.map(x=>x.squadra))]){ const v=supPerSquadra[k]||0; const g=tutti.filter(x=>x.sup&&x.tipo!=='rigore'&&x.squadra===k&&x.esito==='gol').length; console.log(`  ${k}: superiorità ${v}, gol con l'uomo in più ${g} (${pc(g,v)}), tiri con l'uomo in più ${tutti.filter(x=>x.sup&&x.tipo!=='rigore'&&x.squadra===k).length}`); }
console.log(`espulsioni ${espulsioni} (${(espulsioni/partite/2).toFixed(1)} per squadra a partita) · gol con l'uomo in più ${sup.filter(x=>x.esito==='gol').length} · superiorità trasformate ${pc(sup.filter(x=>x.esito==='gol').length,espulsioni)} (reale 52%)`);
for(const [nome,l] of [['UOMO IN PIÙ',sup],['PARITÀ (confronto)',par]]){
  console.log(`\n${nome}`);
  tabella('tutti',l,()=>'tutti');
  tabella('per motivo',l,x=>x.m,3);
  tabella('per posto di chi tira (1 centroboa, 2-3 ali, 4-5 mezzi, 6 punto)',l,x=>x.i,3);
  tabella('per distanza',l,x=>fascia(x.d,[[3,'<3 m'],[5,'3-5 m'],[7,'5-7 m'],[99,'>7 m']]));
  tabella('per lato (+ destra di chi attacca)',l,x=>fascia(x.z,[[-2,'sinistra'],[2,'centro'],[99,'destra']]));
  tabella('per gesto',l,x=>x.gesto,3);
  tabella('difensore più vicino',l,x=>fascia(x.vicino,[[1,'<1 m'],[2,'1-2 m'],[3,'2-3 m'],[99,'>3 m']]));
  tabella('dopo un cambio di lato',l,x=>x.dopoCambio?'sì':'no');
  if(l===sup){
    tabella('per schema',l,x=>x.schema,3);
    tabella('secondi dall\'inizio della superiorità',l,x=>fascia(x.tSup,[[0,'?'],[5,'0-5 s'],[10,'5-10 s'],[15,'10-15 s'],[99,'oltre 15 s']]));
    tabella('superiorità nata durante un\'entrata',l,x=>x.daEntrata?'sì':'no');
    tabella('stamina di chi tira',l,x=>fascia(x.stamina,[[0.4,'sotto 0,4'],[0.6,'0,4-0,6'],[0.8,'0,6-0,8'],[9,'oltre 0,8']]));
  }
}
// passaggi con l'uomo in più, per fascia di tempo: quanti e quanti cambiano lato
console.log(`\nPASSAGGI CON L'UOMO IN PIÙ (${passaggi.length}, ${(passaggi.length/partite/2).toFixed(1)} per squadra a partita)`);
for(const [l,n] of [[3,'0-3 s'],[6,'3-6 s'],[9,'6-9 s'],[12,'9-12 s'],[15,'12-15 s'],[99,'oltre 15 s']]){
  const v=passaggi.filter(x=>x.tSup<l&&x.tSup>=(l===3?0:l===99?15:l-3));
  console.log(`  ${n.padEnd(10)} ${String(v.length).padStart(4)} passaggi · cambi di lato ${pc(v.filter(x=>x.cambio).length,v.length)}`);
}
