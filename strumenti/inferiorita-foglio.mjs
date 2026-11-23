// Foglio della difesa con l'uomo in meno (v0.56, indicazione di Ale): Ungheria in 5 contro 6, palla a turno a 1, 2, 3, 4
// (numerazione dell'uomo in più: 1 destra ai 2 m, 2 fuori palo destro ai 5 m, 3 fuori palo sinistro ai 5 m, 4 sinistra ai 2 m).
// Per ogni caso: dove sta il centrale tra i pali, che braccio alza e da che parte, e che braccio alza chi esce sul tiratore
// (a specchio del braccio di tiro). Stampa i controlli e fa docs/immagini/v058-uomo-in-meno.png.
// Uso: node strumenti/inferiorita-foglio.mjs [--dist=dist] [--porta=4498] [--prova] (--prova: solo controlli, esce con errore se falliscono)
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const dist=arg('dist')||'dist', porta=+(arg('porta')||4498), solo=process.argv.includes('--prova');
const server=await preview({root,logLevel:'warn',build:{outDir:dist},preview:{port:porta,host:'127.0.0.1',strictPort:true}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const pg=await browser.newPage({viewport:{width:900,height:520}});
await pg.addInitScript(()=>{
  let s=33; window.__rnd=()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  let now=0; performance.now=()=>now; window.requestAnimationFrame=cb=>{ window.__raf=cb; return 1; };
  window.__passo=()=>{ now+=1000/60; window.__raf(now); };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto',null,{timeout:120000,polling:100});
await pg.evaluate(solo=>{ const H=window.__pallanuoto; H.scegliSquadre('ITA','HUN'); H.imposta('len','480'); document.getElementById('goBtn').click();
  if(solo) H.renderer.render=()=>{};   // solo controlli: niente disegno (molto più veloce)
  for(const t of H.teams) t.human=false; H.game.autoplay=true;
  // L'autoplay non cancella da solo il selezionato della partenza: tutta la scena è IA.
  H.__setCtrl(null);for(let i=0;i<240;i++) window.__passo(); },solo);
// UI 1..4 → indice di ruolo dell'attaccante (FORM_UP; l'Italia attacca verso +x, la sua destra è +z)
const CASI=[{n:1,i:2},{n:2,i:4},{n:3,i:5},{n:4,i:3}];
const esiti=[], foto=[];
for(const caso of CASI){
  const r=await pg.evaluate(({i})=>{
    const H=window.__pallanuoto, A=H.teams[0], D=H.teams[1], R=H.regole;
    const FORM=[null,[2.1,1.75],[2.0,5.4],[2.0,-5.4],[5.2,2.5],[5.2,-2.5],[2.1,-1.75]];
    H.replay.interrompiReplay(); H.game.after=null; H.game.state='play'; H.game.penalty=null; H.game.shot=25;   // un gol in una scena precedente fa partire il replay, che congela il gioco
    for(const q of H.allPlayers){ q.excluded=false; q.act=null; q.charging=false; q.stunUntil=0; q.vx=q.vz=0; q.colpi=[]; q.tackleCD=9; q.cut=null; }
    const esp=D.players[3]; esp.excluded=true; esp.exclUntil=H.game.time+999; esp.alPozzetto=true; esp.x=10; esp.z=-11; D.postiAssegnati=null;
    for(let k=1;k<=6;k++){ const p=A.players[k]; p.x=12.5-FORM[k][0]; p.z=FORM[k][1]; p.fx=1; p.fz=0; }
    // la difesa si schiera con la palla al 2 (fuori palo destro), poi la palla arriva all'uomo del caso
    const h0=A.players[4]; R.giveBall(h0);
    // v0.67: l'espulso resta fuori per tutta la scena (se la difesa tocca palla, la regola lo farebbe rientrare prima: sei difensori)
    const fuori=()=>{ esp.excluded=true; esp.exclUntil=H.game.time+999; esp.alPozzetto=true; esp.x=10; esp.z=-11; esp.vx=esp.vz=0; };
    for(let f=0;f<240;f++){ for(let k=1;k<=6;k++){ const p=A.players[k]; p.x=12.5-FORM[k][0]; p.z=FORM[k][1]; p.vx=p.vz=0; p.fx=1; p.fz=0; p.decideT=9; p.reazioneT=9; p.act=null; } if(H.ball.holder!==h0) R.giveBall(h0); for(const q of D.players) q.tackleCD=9; fuori(); window.__passo(); }
    const h=A.players[i]; R.giveBall(h);
    const ferma=()=>{ for(let k=1;k<=6;k++){ const p=A.players[k]; p.x=12.5-FORM[k][0]; p.z=FORM[k][1]; p.vx=p.vz=0; p.fx=1; p.fz=0; p.decideT=9; p.reazioneT=9; p.act=null; } };
    for(let f=0;f<240;f++){ ferma(); h.charging=f>190; h.chargeT=f>190?0.3:0; if(H.ball.holder!==h) R.giveBall(h); for(const q of D.players) q.tackleCD=9; fuori(); window.__passo(); }
    const ogx=12.5, dif=D.players.filter(q=>!q.isGK&&!q.excluded);
    const ruolo=q=>D.postiAssegnati?.get(q);
    const alto=q=>{ const J=q.J; return J.hR[1]>J.hL[1]+0.08?'destro':J.hL[1]>J.hR[1]+0.08?'sinistro':'nessuno'; };
    const centrale=dif.find(q=>ruolo(q)===0), suTiro=dif.reduce((a,b)=>Math.hypot(b.x-h.x,b.z-h.z)<Math.hypot(a.x-h.x,a.z-h.z)?b:a);
    return { mano:h.mano,carica:h.charging&&H.ball.holder===h, h:{x:+(ogx-h.x).toFixed(2),z:+h.z.toFixed(2)},
      centrale:{x:+(ogx-centrale.x).toFixed(2),z:+centrale.z.toFixed(2),braccio:alto(centrale),copre:centrale.copreLungo?.lato, fx:+centrale.fx.toFixed(2)},
      suTiro:{x:+(ogx-suTiro.x).toFixed(2),z:+suTiro.z.toFixed(2),braccio:alto(suTiro),d:+Math.hypot(suTiro.x-h.x,suTiro.z-h.z).toFixed(2),ruolo:ruolo(suTiro)},
      altri:dif.map(q=>{ const tg=H.prova.markTarget(q); return {r:ruolo(q),x:+(ogx-q.x).toFixed(1),z:+q.z.toFixed(1),tx:+(ogx-tg.x).toFixed(1),tz:+tg.z.toFixed(1)}; }) };
  },caso);
  // vista da dietro la porta difesa, in alto: destra dell'attacco a sinistra dell'immagine
  if(!solo){
    // la foto si prende dalla tela del gioco subito dopo il disegno (la cattura della pagina con il tempo finto si blocca a caso)
    const dati=await pg.evaluate(()=>{ const H=window.__pallanuoto; H.vista={pos:[17.5,7.5,0],look:[8.5,0,0],fov:50}; window.__passo(); H.__ridisegna();
      const c=H.renderer.domElement, u=c.toDataURL('image/png'); H.vista=null; return u; });
    foto.push({n:caso.n,dati}); }
  esiti.push({caso,r});
}
// CONTRO IL 3-3 (v0.58, Ale): attacco schierato come nell'«Uscita del 6» (il 6 al centro dei 5 metri, il 5 al centro della porta);
// i due difensori che stavano davanti ai pali stanno a metà tra 2 (o 3) e il 6 e saltano su chi ha la palla
const CASI33=[{n:2,i:4},{n:6,i:6},{n:3,i:5}];
const esiti33=[];
for(const caso of CASI33){
  const r=await pg.evaluate(({i})=>{
    const H=window.__pallanuoto, A=H.teams[0], D=H.teams[1], R=H.regole;
    const F33=[null,[2.1,0],[2.0,4.6],[2.0,-4.6],[4.8,3.4],[4.8,-3.4],[5.6,0]];
    H.replay.interrompiReplay(); H.game.after=null; H.game.state='play'; H.game.penalty=null; H.game.shot=25;   // un gol in una scena precedente fa partire il replay, che congela il gioco
    for(const q of H.allPlayers){ q.excluded=false; q.act=null; q.charging=false; q.stunUntil=0; q.vx=q.vz=0; q.colpi=[]; q.tackleCD=9; q.cut=null; }
    const esp=D.players[3]; esp.excluded=true; esp.exclUntil=H.game.time+999; esp.alPozzetto=true; esp.x=10; esp.z=-11; D.postiAssegnati=null;
    const ferma=()=>{ for(let k=1;k<=6;k++){ const p=A.players[k]; p.x=12.5-F33[k][0]; p.z=F33[k][1]; p.vx=p.vz=0; p.fx=1; p.fz=0; p.decideT=9; p.reazioneT=9; p.act=null; } };
    // se durante la scena l'arbitro fischia (un difensore che salta sul portatore può fare fallo e viene allontanato), la scena
    // si ripete: la prova riguarda le posizioni, non il fallo (v0.59)
    const h=A.players[i]; let fischi=0;
    for(let prova=0;prova<3;prova++){
      H.game.state='play'; H.game.after=null; for(const q of H.allPlayers){ q.stunUntil=0; q.colpi=[]; }
      const falli0=H.cronaca.registro.filter(e=>e.tipo==='fallo').length;
      const h0=A.players[4]; ferma(); R.giveBall(h0);
      for(let f=0;f<240;f++){ ferma(); if(H.ball.holder!==h0) R.giveBall(h0); for(const q of D.players){ q.tackleCD=9; q.colpi=[]; } window.__passo(); }
      R.giveBall(h);
      for(let f=0;f<150;f++){ ferma(); if(H.ball.holder!==h) R.giveBall(h); for(const q of D.players){ q.tackleCD=9; q.colpi=[]; } window.__passo(); }
      fischi=H.cronaca.registro.filter(e=>e.tipo==='fallo').length-falli0; if(!fischi&&H.game.state==='play') break;
    }
    const ogx=12.5, dif=D.players.filter(q=>!q.isGK&&!q.excluded), ruolo=q=>D.postiAssegnati?.get(q);
    const davanti=dif.filter(q=>ruolo(q)===1||ruolo(q)===2);
    const d=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
    return { fischi, h:{x:+(ogx-h.x).toFixed(2),z:+h.z.toFixed(2)}, suPalla:+Math.min(...dif.map(q=>d(q,h))).toFixed(2),
      davanti:davanti.map(q=>({x:+(ogx-q.x).toFixed(2),z:+q.z.toFixed(2),dPalla:+d(q,h).toFixed(2)})) };
  },caso);
  if(!solo){
    const dati=await pg.evaluate(()=>{ const H=window.__pallanuoto; H.vista={pos:[17.5,7.5,0],look:[8.5,0,0],fov:50}; window.__passo(); H.__ridisegna();
      const c=H.renderer.domElement, u=c.toDataURL('image/png'); H.vista=null; return u; });
    foto.push({n:'3-3 a '+caso.n,dati,tre3:true}); }
  esiti33.push({caso,r});
}
// controlli: braccio a specchio (destro → sinistro); centrale dalla parte giusta e con il braccio verso il palo lungo
let ok=true; const no=m=>{ ok=false; console.log('  ✗ '+m); }, si=m=>console.log('  ✓ '+m);
for(const {caso,r} of esiti33){
  console.log(`3-3, palla a ${caso.n}${r.fischi?` (fischio anche alla terza prova: ${r.fischi})`:""} (a ${r.h.x} m dalla porta, z ${r.h.z}): difensori di mezzo ${r.davanti.map(q=>`(${q.x} m, z ${q.z}, a ${q.dPalla} m dalla palla)`).join(' ')}`);
  (r.suPalla<1.3?si:no)(`3-3, palla a ${caso.n}: un difensore salta su chi ha la palla (a ${r.suPalla} m)`);
  if(caso.n===2){ const altro=r.davanti.find(q=>q.dPalla>1.5);
    (altro&&altro.z<0.4&&altro.z>-3.8&&altro.x>3&&altro.x<5.6?si:no)(`3-3, palla a 2: l'altro difensore sta a metà tra 3 e il 6 (${altro?`${altro.x} m, z ${altro.z}`:'non trovato'})`); }
}
for(const {caso,r} of esiti){
  console.log(`palla a ${caso.n} (tiratore a ${r.h.x} m dalla porta, z ${r.h.z}, mano ${r.mano}):`);
  console.log(`   centrale: ${r.centrale.x} m, z ${r.centrale.z}, braccio ${r.centrale.braccio}, copre palo ${r.centrale.copre>0?'+z':'-z'}`);
  console.log('   difensori: '+r.altri.map(a=>`r${a.r} (${a.x}, ${a.z} → ${a.tx}, ${a.tz})`).join(' '));
  console.log(`   su chi tira: ruolo ${r.suTiro.ruolo} a ${r.suTiro.d} m, braccio ${r.suTiro.braccio}`);
  const specchio=r.mano==='S'?'destro':'sinistro';
  (r.carica?si:no)(`palla a ${caso.n}: il tiratore sta davvero caricando con la palla in mano`);
  (r.suTiro.braccio===specchio?si:no)(`palla a ${caso.n}: chi esce sul tiratore alza il braccio ${specchio} (a specchio): ${r.suTiro.braccio}`);
  (r.centrale.copre===-Math.sign(r.h.z)?si:no)(`palla a ${caso.n}: il centrale copre il palo lungo`);
  // il centrale guarda il tiratore (verso -x); il palo lungo con z di segno opposto al tiratore: per chi guarda verso -x la destra è -z
  const atteso=(-Math.sign(r.h.z))===-1?'destro':'sinistro';
  (r.centrale.braccio===atteso?si:no)(`palla a ${caso.n}: il centrale alza il braccio dalla parte del palo lungo (${atteso}): ${r.centrale.braccio}`);
  if(caso.n===1||caso.n===4) (Math.sign(r.centrale.z)===Math.sign(r.h.z)&&Math.abs(r.centrale.z)>0.5?si:no)(`palla a ${caso.n}: il centrale sta sulle spalle del difensore del palo dalla parte della palla (z ${r.centrale.z})`);
  else { const lungo=-Math.sign(r.h.z)*1.2, zl=lungo+(r.h.z-lungo)*2/r.h.x; (Math.abs(r.centrale.z-zl)<0.6?si:no)(`palla a ${caso.n}: il centrale è sulla linea dell'incrociato (z ${r.centrale.z}, linea ${zl.toFixed(2)})`); }
}
if(!solo&&foto.length){
    const html=`<body style="margin:0;background:#0b1b29;font:600 18px system-ui;color:#fff"><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:6px">${foto.map(x=>{ if(x.tre3) return `<div><div style="padding:4px 8px">Contro il 3-3 · palla ${x.n.slice(5)}</div><img src="${x.dati}" style="width:100%"></div>`; const r=esiti.find(e=>e.caso.n===x.n).r; return `<div><div style="padding:4px 8px">Palla a ${x.n} · centrale: braccio ${r.centrale.braccio} (palo lungo) · su chi tira: braccio ${r.suTiro.braccio}</div><img src="${x.dati}" style="width:100%"></div>`; }).join('')}</div></body>`;
  const p2=await browser.newPage({viewport:{width:1812,height:1700}}); await p2.setContent(html); await p2.waitForTimeout(300);
  const out=path.join(root,'docs/immagini/v058-uomo-in-meno.png'); await p2.screenshot({path:out,fullPage:true}); console.log('foglio: '+out);
}
await browser.close(); server.httpServer.close();
console.log(ok?'Uomo in meno: tutte le prove superate':'Uomo in meno: prove NON superate'); process.exit(ok?0:1);
