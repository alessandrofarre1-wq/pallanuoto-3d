// Sonda (v0.58, Ale: «quando prendo la palla per andare in attacco i miei compagni non possono stare fermi ad aspettarmi: devono
// nuotare il più velocemente possibile per raggiungere le loro posizioni di attacco; invece mi stanno intorno e mi portano addosso
// i loro difensori»). Scene ripetibili: il giocatore comandato (Italia) recupera palla nella propria metà, a 4 m dalla propria porta
// (ripartenza dopo il recupero) e a metà della propria metà, poi nuota verso l'attacco con la freccia a destra per 6 s.
// Ogni mezzo secondo misura i compagni: quanti stanno entro 3 m da chi porta palla, quanti sono davanti a lui, quanti scattano,
// e dove sono i loro difensori. Uso: node strumenti/sonda-ripartenza.mjs [--dist=dist] [--porta=4483] [--json=file]
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const dist=arg('dist')||'dist', porta=+(arg('porta')||4483);
const server=await preview({root,logLevel:'warn',build:{outDir:dist},preview:{port:porta,host:'127.0.0.1',strictPort:true}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const pg=await browser.newPage({viewport:{width:844,height:390}});
await pg.addInitScript(()=>{
  let s=33; window.__rnd=()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  let now=0; performance.now=()=>now; window.requestAnimationFrame=cb=>{ window.__raf=cb; return 1; };
  window.__passo=()=>{ now+=1000/60; window.__raf(now); };
  window.__tasto=(code,giu)=>window.dispatchEvent(new KeyboardEvent(giu?'keydown':'keyup',{code}));
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto',null,{timeout:120000,polling:100});
await pg.evaluate(()=>{ const H=window.__pallanuoto; H.scegliSquadre('ITA','HUN'); H.imposta('len','480'); document.getElementById('goBtn').click();
  H.renderer.render=()=>{}; for(let i=0;i<300;i++) window.__passo(); });
const risultati=[];
for(const [nome,x0] of [['recupero a 4 m dalla propria porta',-8.5],['recupero a metà della propria metà',-6]]){
  for(const ruolo of [3,4,5]){
    const r=await pg.evaluate(({x0,ruolo})=>{
      const H=window.__pallanuoto, A=H.teams[0], D=H.teams[1], R=H.regole;
      H.game.state='play'; H.game.penalty=null; H.game.after=null;
      for(const q of H.allPlayers){ q.excluded=false; q.act=null; q.charging=false; q.stunUntil=0; q.colpi=[]; q.tackleCD=9; q.cut=null; q.vx=q.vz=0; }
      // posizione «difensiva»: l'Italia era schierata in difesa davanti alla propria porta (x negativo), l'Ungheria in attacco
      const FORM=[null,[2.1,0],[2.0,5.0],[2.0,-5.0],[5.5,3.0],[5.5,-3.0],[6.5,0]];
      for(let k=1;k<=6;k++){ const a=A.players[k], d=D.players[k]; d.x=-12.5+FORM[k][0]; d.z=-FORM[k][1]; a.x=d.x+0.9; a.z=d.z; a.fx=-1; a.fz=0; d.fx=-1; d.fz=0; }
      const h=A.players[ruolo]; h.x=x0;
      R.giveBall(h); H.__setCtrl(h);
      window.__tasto('ArrowRight',true);
      const campioni=[]; const x0h=h.x;
      for(let f=0;f<360;f++){
        if(H.ball.holder!==h){ break; }
        h.decideT=9;
        window.__passo();
        if(f%30===29){
          const comp=A.players.filter(q=>!q.isGK&&q!==h&&!q.excluded);
          const vicini=comp.filter(q=>Math.hypot(q.x-h.x,q.z-h.z)<3).length;
          const davanti=comp.filter(q=>q.x>h.x+1).length;
          const scattano=comp.filter(q=>q.target?.sprint||Math.hypot(q.vx,q.vz)>1.8).length;
          const vel=comp.reduce((s,q)=>s+Math.hypot(q.vx,q.vz),0)/comp.length;
          const difVicini=D.players.filter(q=>!q.isGK&&!q.excluded&&Math.hypot(q.x-h.x,q.z-h.z)<3).length;
          campioni.push({t:+((f+1)/60).toFixed(1),hx:+h.x.toFixed(1),vicini,davanti,scattano,vel:+vel.toFixed(2),difVicini,contro:!!A.contro});
        }
      }
      window.__tasto('ArrowRight',false);
      for(let i=0;i<30;i++) window.__passo();
      return {campioni,avanzato:+(h.x-x0h).toFixed(1)};
    },{x0,ruolo});
    risultati.push({nome,ruolo,...r});
  }
}
let sv=0,sd=0,ss=0,sdif=0,svel=0,n=0;
for(const r of risultati){
  console.log(`${r.nome}, palla al ruolo ${r.ruolo} (avanza di ${r.avanzato} m):`);
  for(const c of r.campioni) console.log(`   ${c.t}s portatore x ${c.hx} · compagni entro 3 m ${c.vicini} · davanti ${c.davanti}/5 · scattano ${c.scattano}/5 · velocità media ${c.vel} m/s · difensori entro 3 m ${c.difVicini}${c.contro?' · ripartenza':''}`);
  for(const c of r.campioni){ sv+=c.vicini; sd+=c.davanti; ss+=c.scattano; sdif+=c.difVicini; svel+=c.vel; n++; }
}
console.log(`MEDIA su ${n} campioni: compagni entro 3 m ${(sv/n).toFixed(2)} · davanti ${(sd/n).toFixed(2)}/5 · scattano ${(ss/n).toFixed(2)}/5 · velocità ${(svel/n).toFixed(2)} m/s · difensori entro 3 m ${(sdif/n).toFixed(2)}`);
if(arg('json')) fs.writeFileSync(arg('json'),JSON.stringify(risultati,null,1));
await browser.close(); server.httpServer.close();
