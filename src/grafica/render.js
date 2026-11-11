// ================= RENDER =================
import * as THREE from 'three';
import { BRV, HL, clamp, rnd } from '../costanti.js';
import { updateRig } from './pose.js';
import { animateWater, ball3d, camMode, camera, freccia, mirino, passMark, renderer, ring, scene, shadow, spawnFoam, updateFoam } from './scena.js';
import { inp } from '../input.js';
import { allPlayers, ball, ctrl, game, teams } from '../stato.js';
import { humanPassTarget } from '../tiri.js';
export const camPos=new THREE.Vector3(0,10.5,16), camLook=new THREE.Vector3(), _cv=new THREE.Vector3();
export let prevBY=BRV;
const _wv=new THREE.Vector3(), _wq=new THREE.Quaternion();
const TOUCH='ontouchstart' in window || navigator.maxTouchPoints>0;
export function render(dt,now){
  const t=now*0.001;
  animateWater(t);
  for(const p of allPlayers) updateRig(p,dt,t);
  // palla
  const h=ball.holder; let by;
  if(ball.state==='held'&&h&&h.ballW){ by=Math.max(BRV,h.ballW[1]); ball3d.position.set(h.ballW[0],by,h.ballW[2]); }
  else { by=ball.y; ball3d.position.set(ball.x,ball.y,ball.z); }
  // spruzzo quando la palla tocca l'acqua: più forte arriva, più schiuma; nello schizzo la schiuma si allunga nella direzione del tiro
  if(ball.spruzzo){ const S=ball.spruzzo, n=Math.min(9,2+Math.round(S.forza*0.4)), vo=Math.hypot(ball.vx,ball.vz)||1; ball.spruzzo=null;
    for(let i=0;i<n;i++){ const k=S.schizzo?i/n*0.9:0; spawnFoam(ball.x-ball.vx/vo*k+(rnd()-0.5)*0.35,ball.z-ball.vz/vo*k+(rnd()-0.5)*0.35,0.16+rnd()*0.14+S.forza*0.008,0.6+rnd()*0.4); } }
  prevBY=by;
  updateFoam(dt);
  // rotazione: in aria quella data dal tiro (e dagli urti); in acqua la palla rotola nella direzione in cui scivola; in mano gira poco
  if(ball.state==='held') _wv.set(0,0,0);
  else if(ball.y<BRV) _wv.set(ball.vz,0,-ball.vx).multiplyScalar(4);
  else _wv.set(ball.wx||0,ball.wy||0,ball.wz||0);
  const wl=_wv.length();
  if(wl>0.01){ _wq.setFromAxisAngle(_wv.divideScalar(wl),wl*dt); ball3d.quaternion.premultiply(_wq); }
  shadow.position.set(ball3d.position.x,0.015,ball3d.position.z);
  shadow.visible=ball3d.position.y>BRV+0.15;
  // anello del giocatore controllato
  ring.visible=false;
  freccia.visible=!!ctrl&&!ctrl.excluded&&game.state!=='menu';
  if(ctrl){ ctrl.mesh.spr.getWorldPosition(_cv); freccia.position.set(_cv.x,_cv.y+0.48+Math.sin(now*0.006)*0.05,_cv.z); }
  // mirino: mentre il giocatore controllato carica o esegue un tiro, mostra il punto della porta a cui mira
  mirino.visible=false;
  if(ctrl&&ball.holder===ctrl&&!ctrl.isGK&&game.state==='play'&&(ctrl.charging||(ctrl.act&&!ctrl.act.done&&ctrl.act.kind!=='pass'&&ctrl.act.kind!=='fake'))){
    const gk=teams[1-ctrl.team.idx].players[0];
    const az=Math.abs(inp.z)>0.3 ? clamp(inp.z*1.28,-1.28,1.28) : -Math.sign(gk.z||1)*1.1;
    mirino.visible=true; mirino.position.set(HL*ctrl.team.dir,0.45,az);
    const s=0.95-0.3*Math.min(1,(ctrl.chargeT||0)/0.9); mirino.scale.set(s,s,1);      // si stringe mentre il tiro si carica
  }
  // indicatore del compagno a cui passeresti
  passMark.visible=false;
  if(ctrl&&ball.holder===ctrl&&game.state==='play'){
    const m=humanPassTarget(ctrl,inp.x,inp.z);
    if(m){ passMark.visible=true; passMark.position.set(m.x,0.03,m.z); }
  }
  // telecamera
  const portrait=camera.aspect<1;
  // su telefono in orizzontale l'azione va tenuta nella fascia libera tra joystick (a sinistra) e pulsanti (a destra):
  // vicino alla porta di destra la telecamera avanza di più, così porta e tiratori non finiscono sotto i pulsanti
  const fx = TOUCH&&!portrait ? clamp(ball.x*0.9+clamp(ball.x,0,HL)*0.12,-HL+4,HL-1.5) : clamp(ball.x*0.85,-HL+4,HL-4);
  if(camMode()===0){
    // laterale, alta e vicina: l'acqua riempie lo schermo e il bordo lontano della vasca sta in cima all'inquadratura
    const far=portrait?1.9:1, sz=ball.z*0.45;
    camPos.lerp(_cv.set(fx, 10*far, 11.7*far+sz), Math.min(1,dt*2.5));
    camLook.lerp(_cv.set(fx, 0, 1.9*far+sz), Math.min(1,dt*3));
  } else if(portrait){
    // verticale: da dietro e dall'alto, guardando in giù quanto basta per non inquadrare cielo e tribune
    const d=teams[0].dir, bx=clamp(ball.x,-HL+3,HL-3), sz=ball.z*0.75;
    // la palla sta nel terzo alto dello schermo: la parte bassa è coperta da joystick e pulsanti
    camPos.lerp(_cv.set(bx-d*10, 16, sz), Math.min(1,dt*2.5));
    camLook.lerp(_cv.set(bx-d*2.9, 0, sz), Math.min(1,dt*3));
  } else {
    const d=teams[0].dir;
    camPos.lerp(_cv.set(clamp(ball.x,-HL+3,HL-3)-d*9, 5.5, ball.z*0.6), Math.min(1,dt*2.5));
    camLook.lerp(_cv.set(clamp(ball.x,-HL+3,HL-3)+d*6, 0, ball.z*0.6), Math.min(1,dt*3));
  }
  camera.position.copy(camPos); camera.lookAt(camLook);
  const V=window.__pallanuoto&&window.__pallanuoto.vista;
  if(V){ camera.position.set(V.pos[0],V.pos[1],V.pos[2]); camera.lookAt(V.look[0],V.look[1],V.look[2]); if(V.fov&&camera.fov!==V.fov){ camera.fov=V.fov; camera.updateProjectionMatrix(); } }
  renderer.info.reset();
  renderer.render(scene,camera);
}
