// Foglio del tiro (v0.61): un tiro da fuori (7 m) e uno da vicino (4 m), visti di lato, con il portiere. Fotogrammi ogni 1/15 s
// dalla carica al rilascio, per confrontare il gesto con i video di Ale (Mandić, Varga): alzata dall'acqua del tiratore e salto
// di preparazione del portiere a braccia larghe. Solo disegno: la scena è preparata a mano, nessun numero casuale in più.
// Uso: node strumenti/foglio-tiro-v061.mjs [--dist=dist] [--porta=4527] [--uscita=docs/immagini/v061-tiro.png]
import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const dist=arg('dist')||'dist', porta=+(arg('porta')||4527), uscita=path.resolve(root,arg('uscita')||'docs/immagini/v061-tiro.png');
const server=await preview({root,logLevel:'warn',build:{outDir:dist},preview:{port:porta,host:'127.0.0.1',strictPort:true}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const pg=await browser.newPage({viewport:{width:640,height:420}});
await pg.addInitScript(()=>{
  let s=33; window.__rnd=()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  let now=0; performance.now=()=>now; window.requestAnimationFrame=cb=>{ window.__raf=cb; return 1; };
  window.__passo=()=>{ now+=1000/60; window.__raf(now); };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto',null,{timeout:120000,polling:100});
await pg.evaluate(()=>{ const H=window.__pallanuoto; H.scegliSquadre('ITA','HUN'); H.imposta('len','480'); document.getElementById('goBtn').click();
  for(const t of H.teams) t.human=false; H.game.autoplay=true; for(let i=0;i<240;i++) window.__passo(); });
const righe=[];
for(const distanza of [7,4]){
  const foto=await pg.evaluate(distanza=>{
    const H=window.__pallanuoto, A=H.teams[0], D=H.teams[1], R=H.regole, P=H.prova;
    H.game.state='play'; H.game.penalty=null; H.game.after=null; H.game.shot=25; H.replay.interrompiReplay();
    for(const q of H.allPlayers){ q.act=null; q.charging=false; q.stunUntil=0; q.vx=q.vz=0; q.colpi=[]; q.tackleCD=9; q.cut=null; q.excluded=false; }
    // tutti lontani tranne tiratore e portiere avversario: si vede solo il gesto
    H.allPlayers.forEach((q,i)=>{ q.x=-8+(i%7)*1.2; q.z=-8.5+Math.floor(i/7)*1.4; q.fx=1; q.fz=0; });
    const p=A.players[4], gk=D.players[0], gx=12.5*A.dir;
    p.x=gx-A.dir*distanza; p.z=0.6; p.fx=A.dir; p.fz=0; p.oriz=0; gk.x=gx-A.dir*0.6; gk.z=0; gk.fx=-A.dir; gk.fz=0;
    R.giveBall(p);
    for(let i=0;i<40;i++){ p.decideT=9; p.reazioneT=9; gk.decideT=9; p.x=gx-A.dir*distanza; p.z=0.6; p.vx=p.vz=0; p.fx=A.dir; p.fz=0; window.__passo(); }
    p.oriz=0;
    const out=[]; let rilascio=-1;
    P.startAct(p,'shot',0.32,()=>P.doShoot(p,0.95,false,0));
    // due viste vicine: il tiratore di lato e il portiere visto da davanti, leggermente di lato
    const viste=[{pos:[p.x,1.0,p.z+3.4],look:[p.x,0.55,p.z],fov:50},{pos:[gx-A.dir*3.6,1.1,2.2],look:[gx,0.45,0],fov:50}];
    const v3=new H.camera.position.constructor(); let testaMax=0, bacinoMax=-9, testaGK=0, maniGK=0;
    for(let f=0;f<64;f++){
      p.decideT=9; gk.decideT=9; window.__passo();
      if(H.ball.holder===p&&p.mesh.corpo){ const o=p.mesh.corpo.ossa; testaMax=Math.max(testaMax,o.testa.getWorldPosition(v3).y);
        if(o.bacino) bacinoMax=Math.max(bacinoMax,o.bacino.getWorldPosition(v3).y); }
      if(H.ball.holder===p&&gk.mesh.corpo){ const o=gk.mesh.corpo.ossa; testaGK=Math.max(testaGK,o.testa.getWorldPosition(v3).y);
        maniGK=Math.max(maniGK,Math.min(o.manoD.getWorldPosition(v3).y,o.manoS.getWorldPosition(v3).y)); }
      if(rilascio<0&&H.ball.state==='flight') rilascio=f;
      if(f%4===0){ const C=H.camera, fov=C.fov, img=viste.map(v=>{ C.position.set(...v.pos); C.fov=v.fov; C.updateProjectionMatrix(); C.lookAt(...v.look); C.updateMatrixWorld(true); H.__ridisegna(); return H.renderer.domElement.toDataURL('image/jpeg',0.85); }); C.fov=fov; C.updateProjectionMatrix(); out.push({f,img,volo:H.ball.state==='flight'}); }
    }
    H.vista=null;
    return {out,rilascio,misure:{testaTiratore:+testaMax.toFixed(3),bacinoTiratore:+bacinoMax.toFixed(3),testaPortiere:+testaGK.toFixed(3),maniPortiere:+maniGK.toFixed(3)}};
  },distanza);
  righe.push({distanza,...foto}); console.log(`tiro da ${distanza} m: altezze massime sull'acqua prima del rilascio (m)`,JSON.stringify(foto.misure));
}
const html=`<body style="margin:0;background:#0b1b29;font:600 15px system-ui;color:#fff">${righe.map(r=>`<div style="padding:4px 8px">Tiro da ${r.distanza} m · un fotogramma ogni 1/15 s · rilascio al fotogramma ${r.rilascio}</div><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;padding:0 4px 6px">${[0,1].map(v=>r.out.slice(3,15).map(x=>`<div style="position:relative"><img src="${x.img[v]}" style="width:100%;display:block"><span style="position:absolute;left:4px;top:2px;font-size:12px;background:#0008;padding:1px 4px">${v?'portiere':'tiratore'} ${(x.f/60).toFixed(2)} s${x.volo?' · in volo':''}</span></div>`).join('')).join('')}</div>`).join('')}</body>`;
const p2=await browser.newPage({viewport:{width:1500,height:900}}); await p2.setContent(html); await p2.waitForTimeout(300);
fs.mkdirSync(path.dirname(uscita),{recursive:true}); await p2.screenshot({path:uscita,fullPage:true});
console.log('foglio: '+uscita);
await browser.close(); server.httpServer.close();
