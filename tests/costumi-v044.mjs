// Costumi nazionali e calottine: controlli mirati e fotografie, senza simulare una partita intera.
// Uso: node tests/costumi-v044.mjs [--no-build] [--uscita=/tmp/pallanuoto-costumi-v044]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=(k,d)=>process.argv.find(a=>a.startsWith(`--${k}=`))?.slice(k.length+3)||d;
const USCITA=arg('uscita','/tmp/pallanuoto-costumi-v044'); fs.mkdirSync(USCITA,{recursive:true});
const DIST=arg('dist','dist');
const rig=JSON.parse(fs.readFileSync(path.join(ROOT,'src/grafica/modelli/riserva-indici.json'),'utf8'));
if(rig.triangoliOriginali>9042||rig.triangoli>2800)throw new Error('Budget storico dei corpi e delle riserve superato');
const codici=JSON.parse(fs.readFileSync(path.join(ROOT,'src/dati/squadre.json'),'utf8')).squadre.map(s=>s.codice);
if(!process.argv.includes('--no-build')) await build({root:ROOT,logLevel:'warn',build:{outDir:DIST,emptyOutDir:true}});
const server=await preview({root:ROOT,logLevel:'warn',build:{outDir:DIST},preview:{port:+arg('porta','4344'),host:'127.0.0.1'}});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
let ok=true; const prova=(bene,testo)=>{console.log(`${bene?'OK':'NO'} ${testo}`);if(!bene)ok=false;};
const errori=[],risultati={};
async function apri(viewport){
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,deviceScaleFactor:3});
  const pg=await context.newPage();
  pg.on('pageerror',e=>errori.push(e.message));
  pg.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(m.text()))errori.push(m.text());});
  await pg.addInitScript(()=>{
    let a=33;window.__rnd=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
    performance.now=()=>0;window.__frame=0;window.requestAnimationFrame=cb=>{window.__raf=cb;return 1;};
    window.__passi=(n,disegna=false)=>{const H=window.__pallanuoto,r=H.renderer.render;if(!disegna)H.renderer.render=()=>{};for(let i=0;i<n;i++)window.__raf(++window.__frame*1000/60);H.renderer.render=r;};
  });
  await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction(()=>window.__pallanuoto?.modelloPronto&&window.__pallanuoto?.costumi&&window.__raf,null,{timeout:60000,polling:100});
  await pg.evaluate(()=>window.__pallanuoto.costumi.pronti);
  return pg;
}
try{
  const pg=await apri({width:844,height:390});
  risultati.atlante=await pg.evaluate(codici=>{
    const H=window.__pallanuoto,C=H.costumi,canvas=C.atlante.image,ctx=canvas.getContext('2d');
    const nazionali=codici.map(c=>{
      const p=C.profilo(c),[u,v,w,h]=p.rettangolo,x=Math.round(u*canvas.width),y=Math.round((1-v-h)*canvas.height);
      const rgba=ctx.getImageData(x,y,Math.round(w*canvas.width),Math.round(h*canvas.height)).data,colori=new Set();let hash=2166136261;
      for(let k=0;k<rgba.length;k+=4){if(rgba[k+3]>240)colori.add(`${rgba[k]>>4},${rgba[k+1]>>4},${rgba[k+2]>>4}`);hash=Math.imul(hash^rgba[k],16777619);hash=Math.imul(hash^rgba[k+1],16777619);hash=Math.imul(hash^rgba[k+2],16777619);}
      H.scegliSquadre(c,c==='ITA'?'HUN':'ITA');
      const uniformi=H.teams[0].players.every(p=>p.mesh.corpo.costume.codice===c&&p.mesh.corpo.u.uBandiera.value.toArray().every((n,i)=>n===C.profilo(c).rettangolo[i]));
      const cuffie=H.allPlayers.every(p=>p.mesh.corpo.u.uCal.value.getHex()===(p.isGK?0xd62828:p.team.idx===0?0xf4f4f4:0x10284f));
      const hud=H.teams.every(t=>t.color===(t.idx===0?0xf4f4f4:0x10284f)&&t.css===(t.idx===0?'#f4f4f4':'#10284f'));
      return {codice:c,colori:colori.size,hash:hash>>>0,uniformi,cuffie,hud};
    });
    return {larghezza:canvas.width,altezza:canvas.height,nazionali};
  },codici);
  prova(risultati.atlante.larghezza<=1024&&risultati.atlante.altezza<=1024,'atlante condiviso entro 1024×1024');
  prova(risultati.atlante.nazionali.length===24&&risultati.atlante.nazionali.every(n=>n.colori>=2&&n.uniformi&&n.cuffie&&n.hud),'24 nazionali: bandiere disegnate, profilo assegnato, calottine e colori HUD corretti');
  prova(new Set(risultati.atlante.nazionali.map(n=>n.hash)).size===24,'24 bandiere distinte, senza celle vuote o ripetute');
  risultati.matrice=await pg.evaluate(triangoli=>{
    const H=window.__pallanuoto,matrice=[],forme=[];
    document.getElementById('goBtn').click();window.__passi(2);
    for(const cod of ['ITA','GRE'])for(const lato of [0,1])for(const mano of ['D','S']){
      H.scegliSquadre(lato===0?cod:'USA',lato===1?cod:'USA');
      H.game.state='pause';H.vista={pos:[0,26,24],look:[0,-0.2,0],fov:60};
      const disegnati=new Set();
      for(const p of H.allPlayers){p.mano=mano;p.mesh.g.visible=true;p.excluded=false;p.mesh.corpo.radice.traverse(o=>{if(o.isSkinnedMesh)o.onAfterRender=()=>disegnati.add(p.uid);});}
      window.__passi(1,true);
      const verificati=H.allPlayers.every(p=>{const C=p.mesh.corpo;let m;C.radice.traverse(o=>{if(o.isSkinnedMesh)m=o;});forme.push(m.geometry.index.count/3);return C.costume.codice===p.team.codice&&C.u.uCostumi.value===H.costumi.atlante&&m.geometry.index.count/3===triangoli;});
      matrice.push({cod,lato,mano,corpi:disegnati.size,verificati});
      for(const p of H.allPlayers)p.mesh.corpo.radice.traverse(o=>{if(o.isSkinnedMesh)o.onAfterRender=()=>{};});
    }
    H.scegliSquadre('ITA','HUN');const prima=H.teams[0].players[3].mesh.corpo.u.uBandiera.value.toArray();
    H.scegliSquadre('HUN','ITA');const dopo=H.teams[1].players[3].mesh.corpo.u.uBandiera.value.toArray();
    return {casi:matrice,stessaNazioneDueLati:JSON.stringify(prima)===JSON.stringify(dopo)};
  },rig.triangoliOriginali);
  prova(risultati.matrice.casi.every(c=>c.corpi===14&&c.verificati),'due nazioni × due mani × due lati: tutti i 14 corpi completi disegnati');
  prova(risultati.matrice.stessaNazioneDueLati,'stessa nazionale sui due lati: costume identico, calottina diversa');
  risultati.cambi=await pg.evaluate(triangoliRiserva=>{
    const H=window.__pallanuoto;
    H.scegliSquadre('BRA','USA');H.game.state='stop';H.game.timer=10;H.game.after=null;H.game.cambiLiberi=true;
    const t=H.teams[0],gk=t.players[0],ris=t.rosa.find(g=>!g.inAcqua&&g.ruolo===0),numero=ris.num;
    H.panchina.chiediCambio(t,gk,ris,true);window.__passi(2);
    const portiere=gk.num===numero&&gk.mesh.corpo.costume.codice==='BRA'&&gk.mesh.corpo.u.uCal.value.getHex()===0xd62828;
    H.game.state='play';H.game.cambiLiberi=false;H.game.clock=300;const p=t.players[4],g=t.rosa.find(g=>!g.inAcqua&&g.ruolo!==0);
    p.excluded=true;p.alPozzetto=true;p.exclUntil=H.game.time+20;p.pf=0;H.panchina.chiediCambio(t,p,g,true);window.__passi(1);
    const pozzetto=p.num===g.num&&p.mesh.corpo.costume.codice==='BRA'&&p.mesh.corpo.u.uCal.value.getHex()===0xf4f4f4;
    let comparse=0,corrette=true;const scene=p.mesh.g.parent;scene.traverse(o=>{
      if(!o.isSkinnedMesh||o.geometry.index.count/3!==triangoliRiserva)return;
      for(let z=o;z;z=z.parent)if(!z.visible)return;
      const shader={uniforms:{},vertexShader:'',fragmentShader:''};o.material.onBeforeCompile(shader,H.renderer);comparse++;
      corrette&&=shader.uniforms.uBandiera.value.toArray().every((v,i)=>v===H.costumi.profilo('BRA').rettangolo[i]);
    });
    return {portiere,pozzetto,corrette,comparse};
  },rig.triangoli);
  prova(risultati.cambi.portiere&&risultati.cambi.pozzetto&&risultati.cambi.corrette&&risultati.cambi.comparse===1,'bandiera conservata dopo cambio portiere e cambio dal pozzetto, compresa la riserva visibile');
  // Fotografie di vestibilità: lo stesso corpo è portato sopra il pelo dell'acqua per leggere tutto il tessuto.
  await pg.addStyleTag({content:'body>:not(canvas):not(script):not(style){display:none!important}'});
  for(const [cod,lato] of [['ITA',0],['HUN',1],['GRE',0],['USA',1]]){
    await pg.evaluate(({cod,lato})=>{
      const H=window.__pallanuoto;H.scegliSquadre(lato===0?cod:'BRA',lato===1?cod:'BRA');H.game.state='pause';
      H.__setCtrl(null);H.ball.holder=null;H.ball.state='free';H.ball.x=12;H.ball.z=8;
      for(const p of H.allPlayers){p.mesh.g.visible=false;p.mesh.spr.visible=false;}
      const p=H.teams[lato].players[4];p.x=p.z=0;p.fx=0;p.fz=1;p.oriz=0;p.act=null;p.charging=false;p.J=null;p.spina=null;p.mesh.g.visible=true;
      H.vista={pos:[0,1.55,3.8],look:[0,0.95,0],fov:31};window.__passi(2,true);p.mesh.g.position.y=1.0;H.__ridisegna();
    },{cod,lato});
    await pg.screenshot({path:path.join(USCITA,`${cod}-${lato===0?'bianca':'blu'}.png`),timeout:120000});
  }
  await pg.context().close();
  risultati.budget=[];
  for(const viewport of [{width:844,height:390},{width:667,height:375}]){
    const p=await apri(viewport);
    const b=await p.evaluate(triangoliRiserva=>{
      const H=window.__pallanuoto;H.scegliSquadre('ITA','HUN');document.getElementById('goBtn').click();const campioni=[];
      for(let f=0;f<1800;f++){window.__passi(1);if(f%300===299){window.__passi(1,true);campioni.push({fase:'azione',...H.renderer.info.render});}}
      H.game.state='play';H.game.clock=300;H.game.after=null;H.game.cambiLiberi=false;
      for(const t of H.teams){
        t.coda=[];t.cambio=null;t.prossimoControllo=H.game.time+100;
        const p=t.players.find(p=>!p.isGK&&!p.excluded&&H.ball.holder!==p),g=t.rosa.find(g=>!g.inAcqua&&g.ruolo!==0&&!g.fuori);H.panchina.chiediCambio(t,p,g,true);
      }
      window.__passi(1,true);campioni.push({fase:'doppi-cambi',...H.renderer.info.render});
      let doppi=0;H.allPlayers[0].mesh.g.parent.traverse(o=>{if(!o.isSkinnedMesh||o.geometry.index.count/3!==triangoliRiserva)return;for(let z=o;z;z=z.parent)if(!z.visible)return;doppi++;});
      for(let f=0;f<180;f++){window.__passi(1);if(f%12===11){window.__passi(1,true);campioni.push({fase:'doppi-cambi',...H.renderer.info.render});}}
      return {dpr:H.renderer.getPixelRatio(),doppi,calls:Math.max(...campioni.map(c=>c.calls)),triangles:Math.max(...campioni.map(c=>c.triangles)),campioni};
    },rig.triangoli);
    risultati.budget.push({viewport,...b});prova(b.doppi===2&&b.calls<=69&&b.triangles<=148734,`iPhone ${viewport.width}: ${b.calls} chiamate / ${b.triangles} triangoli, ${b.doppi} riserve visibili (limiti v0.43: 69 / 148734)`);
    await p.context().close();
  }
  prova(errori.length===0,`nessun errore pagina/WebGL/shader (${errori.length})`);
  risultati.errori=errori;fs.writeFileSync(path.join(USCITA,'controlli.json'),JSON.stringify(risultati,null,2));
  console.log(`Fotografie e rapporto: ${USCITA}`);
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
if(!ok)process.exitCode=1;
