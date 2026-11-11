// ================= RENDER =================
import * as THREE from 'three';
import { BRV, HL, clamp, rnd } from '../costanti.js';
import { updateRig } from './pose.js';
import { animateWater, ball3d, camMode, camera, passMark, renderer, ring, scene, shadow, spawnFoam, updateFoam } from './scena.js';
import { inp } from '../input.js';
import { allPlayers, ball, ctrl, game, teams } from '../stato.js';
import { humanPassTarget } from '../tiri.js';
export const camPos=new THREE.Vector3(0,10.5,16), camLook=new THREE.Vector3(), _cv=new THREE.Vector3();
export let prevBY=BRV;
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
  ring.visible=!!ctrl&&!ctrl.excluded&&game.state!=='menu';
  if(ctrl){ ring.position.set(ctrl.x,0.03,ctrl.z); ring.scale.setScalar(1+Math.sin(now*0.008)*0.06); }
  // indicatore del compagno a cui passeresti
  passMark.visible=false;
  if(ctrl&&ball.holder===ctrl&&game.state==='play'){
    const m=humanPassTarget(ctrl,inp.x,inp.z);
    if(m){ passMark.visible=true; passMark.position.set(m.x,0.03,m.z); }
  }
  // telecamera
  const portrait=camera.aspect<1;
  const fx=clamp(ball.x*0.85,-HL+4,HL-4);
  if(camMode()===0){
    const far=portrait?1.9:1;
    camPos.lerp(_cv.set(fx, 9.5*far, 14.5*far+ball.z*0.25), Math.min(1,dt*2.5));
    camLook.lerp(_cv.set(fx, 0, ball.z*0.3-0.5), Math.min(1,dt*3));
  } else {
    const d=teams[0].dir;
    camPos.lerp(_cv.set(clamp(ball.x,-HL+3,HL-3)-d*(portrait?9:9), portrait?15:5.5, ball.z*(portrait?0.35:0.6)), Math.min(1,dt*2.5));
    camLook.lerp(_cv.set(clamp(ball.x,-HL+3,HL-3)+d*(portrait?4.5:6), 0, ball.z*(portrait?0.35:0.6)), Math.min(1,dt*3));
  }
  camera.position.copy(camPos); camera.lookAt(camLook);
  renderer.render(scene,camera);
}
