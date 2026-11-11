// ================= RENDER =================
import * as THREE from 'three';
import { BRV, HL, clamp, rnd } from '../costanti.js';
import { updateRig } from './pose.js';
import { animateWater, ball3d, camMode, camera, freccia, passMark, renderer, ring, scene, shadow, spawnFoam, updateFoam } from './scena.js';
import { inp } from '../input.js';
import { allPlayers, ball, ctrl, game, teams } from '../stato.js';
import { humanPassTarget } from '../tiri.js';
export const camPos=new THREE.Vector3(0,10.5,16), camLook=new THREE.Vector3(), _cv=new THREE.Vector3();
export let prevBY=BRV;
const TOUCH='ontouchstart' in window || navigator.maxTouchPoints>0;
export function render(dt,now){
  const t=now*0.001;
  animateWater(t);
  for(const p of allPlayers) updateRig(p,dt,t);
  // palla
  const h=ball.holder; let by;
  if(ball.state==='held'&&h&&h.ballW){ by=Math.max(BRV,h.ballW[1]); ball3d.position.set(h.ballW[0],by,h.ballW[2]); }
  else { by=ball.y; ball3d.position.set(ball.x,ball.y,ball.z); }
  if(prevBY>BRV+0.25 && by<=BRV+0.02 && ball.state!=='held'){ for(let i=0;i<4;i++) spawnFoam(ball.x+(rnd()-0.5)*0.4,ball.z+(rnd()-0.5)*0.4,0.22+rnd()*0.15,0.8); }
  prevBY=by;
  updateFoam(dt);
  ball3d.rotation.x+=Math.hypot(ball.vx,ball.vz)*dt*2;
  shadow.position.set(ball3d.position.x,0.015,ball3d.position.z);
  shadow.visible=ball3d.position.y>BRV+0.15;
  // anello del giocatore controllato
  ring.visible=false;
  freccia.visible=!!ctrl&&!ctrl.excluded&&game.state!=='menu';
  if(ctrl){ ctrl.mesh.spr.getWorldPosition(_cv); freccia.position.set(_cv.x,_cv.y+0.48+Math.sin(now*0.006)*0.05,_cv.z); }
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
