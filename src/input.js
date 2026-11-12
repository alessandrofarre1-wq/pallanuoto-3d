// ================= INPUT =================
import { camMode, renderer } from './grafica/scena.js';
import { $, apriSchemi } from './hud.js';
import { annuncia } from './cronaca.js';
import { togglePause } from './menu.js';
import { apriRegistro, chiudiRegistro, registroAperto } from './cronaca.js';
import { callPlay } from './regole.js';
import { ctrl, game } from './stato.js';
export const keys={};
addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  if((e.code==='Escape'||e.code==='KeyP') && !e.repeat){ if(registroAperto()) chiudiRegistro(); else togglePause(); }
});
addEventListener('keyup',e=>{ keys[e.code]=false; });
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; });
export const touch={x:0,z:0,btn:{}}; let sprintBtn=null;
export let inp={x:0,z:0}, prev={x:0,z:0}, padStart=false;
export function pollInput(){
  prev=inp;
  const n={x:0,z:0,sprint:false,pass:false,shoot:false,lob:false,sw:false,cam:false,cmd:false,p1:false,p2:false,p3:false,p4:false,to:false};
  if(keys.KeyA||keys.ArrowLeft) n.x-=1; if(keys.KeyD||keys.ArrowRight) n.x+=1;
  if(keys.KeyW||keys.ArrowUp) n.z-=1;   if(keys.KeyS||keys.ArrowDown) n.z+=1;
  n.sprint=!!(keys.ShiftLeft||keys.ShiftRight); n.pass=!!keys.Space; n.shoot=!!keys.KeyK; n.lob=!!keys.KeyL; n.sw=!!keys.KeyQ; n.cam=!!keys.KeyC; n.cmd=!!keys.KeyE; n.to=!!keys.KeyT;
  n.p1=!!keys.Digit1; n.p2=!!keys.Digit2; n.p3=!!keys.Digit3; n.p4=!!keys.Digit4;
  const pads=navigator.getGamepads?navigator.getGamepads():[];
  for(const gp of pads){
    if(!gp) continue;
    const ax=gp.axes[0]||0, az=gp.axes[1]||0;
    const am=Math.hypot(ax,az);
    if(am>0.18){ const k=Math.min(1,(am-0.18)/0.72)/am; n.x+=ax*k; n.z+=az*k; }   // zona morta radiale, risposta progressiva
    const b=i=>gp.buttons[i]&&gp.buttons[i].pressed;
    if(b(12))n.p1=true; if(b(15))n.p2=true; if(b(13))n.p3=true; if(b(14))n.p4=true; if(b(1))n.cmd=true; if(b(6))n.to=true;
    if(b(0))n.pass=true; if(b(2))n.shoot=true; if(b(3))n.lob=true; if(b(4))n.sw=true; if(b(5)||b(7))n.sprint=true; if(b(8))n.cam=true;
    if(b(9)&&!padStart){ padStart=true; togglePause(); } if(!b(9)) padStart=false;
    break;
  }
  if(touch.btn.sprint && ctrl && ctrl.stamina<0.06){ touch.btn.sprint=false; if(sprintBtn) sprintBtn.classList.remove('on'); }
  n.x+=touch.x; n.z+=touch.z;
  for(const k of ['sprint','pass','shoot','lob','sw','cam','cmd','to']) if(touch.btn[k]) n[k]=true;
  const l=Math.hypot(n.x,n.z); if(l>1){ n.x/=l; n.z/=l; }
  // telecamera "dietro": su = verso la porta avversaria (+x), destra = +z
  if(camMode()===1){ const wx=-n.z, wz=n.x; n.x=wx; n.z=wz; }
  inp=n;
}
addEventListener('gamepadconnected',()=>annuncia('avviso','Controller collegato',{durata:1.5}));
export function rumble(ms,mag){
  try{ for(const g of (navigator.getGamepads?navigator.getGamepads():[])){
    if(g&&g.vibrationActuator&&g.vibrationActuator.playEffect){ g.vibrationActuator.playEffect('dual-rumble',{duration:ms,strongMagnitude:mag,weakMagnitude:mag*0.6}); break; } } }catch(e){}
}
export const pressed = k => inp[k] && !prev[k];
export const released = k => !inp[k] && prev[k];

// controlli touch
if('ontouchstart' in window || navigator.maxTouchPoints>0) document.body.classList.add('touch');
{
  const joy=$('joy'), knob=$('knob'); let jid=null, jc=null;
  // joystick: zona morta piccola e rotonda (prima era a croce e larga: le diagonali leggere si perdevano), corsa più ampia
  const setJ=(cx,cy)=>{ const R=joy.offsetWidth/2+6; let dx=(cx-jc.x)/R, dy=(cy-jc.y)/R;
    const l=Math.hypot(dx,dy); if(l>1){dx/=l;dy/=l;} const m=Math.min(1,l), ZM=0.09, f=m<ZM?0:(m-ZM)/(1-ZM)/m; touch.x=dx*f; touch.z=dy*f;
    knob.style.transform='translate('+(dx*(joy.offsetWidth/2-25))+'px,'+(dy*(joy.offsetWidth/2-25))+'px)'; };
  document.addEventListener('touchstart',e=>{
    for(const t of e.changedTouches){
      if(jid!==null) break;
      const tg=t.target;
      if(tg!==renderer.domElement && !joy.contains(tg)) continue;
      if(t.clientX>innerWidth*0.5) continue;
      jid=t.identifier; jc={x:t.clientX,y:t.clientY};
      joy.style.left=(jc.x-joy.offsetWidth/2)+'px'; joy.style.top=(jc.y-joy.offsetHeight/2)+'px'; joy.style.bottom='auto';
      joy.classList.add('on'); setJ(t.clientX,t.clientY); e.preventDefault();
    }
  },{passive:false});
  document.addEventListener('touchmove',e=>{ for(const t of e.changedTouches) if(t.identifier===jid){ setJ(t.clientX,t.clientY); e.preventDefault(); } },{passive:false});
  const endJ=e=>{ for(const t of e.changedTouches) if(t.identifier===jid){ jid=null; touch.x=touch.z=0; knob.style.transform=''; joy.classList.remove('on');
    joy.style.left=''; joy.style.top=''; joy.style.bottom=''; } };
  document.addEventListener('touchend',endJ); document.addEventListener('touchcancel',endJ);
  $('tac').addEventListener('pointerdown',e=>{ if(e.target.closest('[data-apri]')){ e.preventDefault(); apriSchemi(); return; } const c=e.target.closest('[data-i]'); if(c&&game.state==='play'){ e.preventDefault(); callPlay(+c.dataset.i); apriSchemi(false); } });
  document.querySelectorAll('.tb').forEach(b=>{
    const k=b.dataset.b;
    if(k==='sprint'){   // su touch lo sprint è un interruttore: un tocco lo accende, un altro lo spegne
      b.addEventListener('touchstart',e=>{ e.preventDefault(); touch.btn.sprint=!touch.btn.sprint; b.classList.toggle('on',touch.btn.sprint); },{passive:false});
      sprintBtn=b; return;
    }
    b.addEventListener('touchstart',e=>{ e.preventDefault(); touch.btn[k]=true; b.classList.add('on'); },{passive:false});
    const up=e=>{ e.preventDefault(); touch.btn[k]=false; b.classList.remove('on'); };
    b.addEventListener('touchend',up,{passive:false}); b.addEventListener('touchcancel',up,{passive:false});
  });
  $('tPause').addEventListener('touchstart',e=>{ e.preventDefault(); togglePause(); },{passive:false});
}
// registro degli eventi: mentre è aperto il gioco è fermo e i comandi touch vengono rilasciati (niente pulsanti rimasti premuti)
{
  const apri=e=>{ e.preventDefault(); for(const k in touch.btn) if(k!=='sprint') touch.btn[k]=false; touch.x=touch.z=0;
    document.querySelectorAll('.tb.on').forEach(b=>{ if(b.dataset.b!=='sprint') b.classList.remove('on'); }); apriRegistro(); };
  $('tLog').addEventListener('click',apri); $('tLog').addEventListener('touchstart',apri,{passive:false});
  const chiudi=e=>{ e.preventDefault(); chiudiRegistro(); };
  $('regChiudi').addEventListener('click',chiudi); $('regChiudi').addEventListener('touchend',chiudi,{passive:false});
  $('registro').addEventListener('click',e=>{ if(e.target===$('registro')) chiudiRegistro(); });
  if(!document.body.classList.contains('touch')) $('ruotaTesto').textContent='Allarga la finestra per giocare';
}
