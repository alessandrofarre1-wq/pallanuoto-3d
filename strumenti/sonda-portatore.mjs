// Sonda: velocità del giocatore comandato che nuota con la palla verso la porta, in partita vera.
import { chromium } from 'playwright';
import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const porta=4471;
const server=await createServer({root,logLevel:'warn',server:{host:'127.0.0.1',port:porta,strictPort:true,hmr:false,watch:null}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const pg=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.addInitScript(()=>{
  let s=33; window.__rnd=()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  let now=0; performance.now=()=>now; window.requestAnimationFrame=cb=>{ window.__raf=cb; return 1; };
  window.__passo=()=>{ now+=1000/60; window.__raf(now); };
});
await pg.goto('http://127.0.0.1:'+porta,{waitUntil:'domcontentloaded',timeout:120000});
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto',null,{timeout:120000,polling:100});
const r=await pg.evaluate(async()=>{
  const H=window.__pallanuoto, I=await import('/src/input.js'), S=await import('/src/stato.js');
  H.scegliSquadre('ITA','HUN'); H.imposta('len','480'); document.getElementById('goBtn').click();
  const R=H.renderer; R.render=()=>{};
  const out=[]; let campioni=[];
  for(let k=0;k<60*400&&out.length<12;k++){
    const c=H.ctrl, B=H.ball;
    const mio=H.game.state==='play'&&c&&B.holder===c&&!c.isGK;
    if(mio){
      const gx=S.goalX(c.team), wx=gx-c.x, wz=-c.z, l=Math.hypot(wx,wz)||1;
      if(l<6){ I.touch.x=I.touch.z=0; }
      else {
        const e=H.camera.matrixWorld.elements, lc=Math.hypot(e[0],e[2])||1, rx=e[0]/lc, rz=e[2]/lc, ux=wx/l, uz=wz/l;
        I.touch.x=ux*rx+uz*rz; I.touch.z=-ux*rz+uz*rx;
        const opp=S.other(c.team).players.filter(q=>!q.isGK).reduce((m,q)=>Math.min(m,Math.hypot(q.x-c.x,q.z-c.z)),99);
        campioni.push({t:+H.game.time.toFixed(2),v:+Math.hypot(c.vx,c.vz).toFixed(2),oriz:+(c.oriz||0).toFixed(2),act:c.act&&!c.act.done?c.act.kind:(c.act?'fatto:'+c.act.kind:''),car:c.charging,cont:c.contactT>0,stun:H.game.time<c.stunUntil,press:c.pressatoUntil>H.game.time,perno:c.perno,turned:c.turnedUntil>H.game.time,gir:!!c.girata,opp:+opp.toFixed(1),inx:+Math.hypot(H.inp.x,H.inp.z).toFixed(2),cos:+((c.fx*ux+c.fz*uz)).toFixed(2),st:+c.stamina.toFixed(2),vel:c.s.vel,dv:+S.other(c.team).players.filter(q=>!q.isGK).reduce((m,q)=>Math.hypot(q.x-c.x,q.z-c.z)<m[0]?[Math.hypot(q.x-c.x,q.z-c.z),Math.hypot(q.vx,q.vz)]:m,[99,0])[1].toFixed(2)});
      }
    } else { I.touch.x=I.touch.z=0; if(campioni.length>30) out.push(campioni); campioni=[]; }
    window.__passo();
  }
  return out;
});
for(const c of r){
  const v=c.map(x=>x.v), m=v.reduce((a,b)=>a+b,0)/v.length;
  console.log('--- possesso',c[0].t,'campioni',c.length,'v media',m.toFixed(2),'max',Math.max(...v).toFixed(2));
  for(let i=0;i<c.length;i+=40) console.log(JSON.stringify(c[i]));
}
await browser.close(); await server.close();
