// ================= AUDIO =================
export let actx=null;
export function whistle(len=0.35){
  if(!actx) return;
  try{
    const o=actx.createOscillator(), g=actx.createGain(), lfo=actx.createOscillator(), lg=actx.createGain();
    o.type='square'; o.frequency.value=2800; lfo.frequency.value=28; lg.gain.value=160;
    lfo.connect(lg); lg.connect(o.frequency); o.connect(g); g.connect(actx.destination);
    const t=actx.currentTime; g.gain.setValueAtTime(0.035,t); g.gain.exponentialRampToValueAtTime(0.0005,t+len);
    o.start(t); lfo.start(t); o.stop(t+len); lfo.stop(t+len);
  }catch(e){}
}
export function initAudio(){
  try{ if(!actx){ const AC=window.AudioContext||window.webkitAudioContext; if(AC) actx=new AC(); } if(actx&&actx.resume) actx.resume(); }catch(e){}
}
