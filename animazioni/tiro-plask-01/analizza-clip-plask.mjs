/* global T, scene, mixer, gltf, renderer, bones, duration, pose, camera, center, span */
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const root=path.resolve(process.argv[3]||'/tmp/analisi-tiro-plask');fs.mkdirSync(root,{recursive:true});
const source=path.resolve(process.argv[2]||'');if(!process.argv[2])throw new Error('Uso: node strumenti/analizza-clip-plask.mjs sorgente.glb cartella-uscita');
const deps=path.resolve(path.dirname(fileURLToPath(import.meta.resolve('three'))),'../..');
if(!fs.existsSync(path.join(root,'node_modules')))fs.symlinkSync(deps,path.join(root,'node_modules'),'dir');
const html=`<!doctype html><html><body style="margin:0"><script type="module">
import * as THREE from '/node_modules/three/build/three.module.js';
import {GLTFLoader} from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
window.T=THREE;window.scene=new THREE.Scene();scene.background=new THREE.Color(0xdce5ed);
window.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(600,600);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x707d8d,2.5));for(const p of [[3,5,4],[-4,3,-2]]){const l=new THREE.DirectionalLight(0xffffff,2);l.position.set(...p);scene.add(l);}
window.gltf=await new GLTFLoader().loadAsync('/@fs/'+encodeURI(${JSON.stringify(source)}));scene.add(gltf.scene);window.mixer=new THREE.AnimationMixer(gltf.scene);mixer.clipAction(gltf.animations[0]).setLoop(THREE.LoopOnce,1).play();
window.duration=gltf.animations[0].duration;window.bones={};gltf.scene.traverse(o=>{if(o.isBone)bones[o.name]=o;});
window.pose=t=>{mixer.setTime(Math.min(t,duration-1e-5));scene.updateMatrixWorld(true);};
window.ready=true;</script></body></html>`;
fs.writeFileSync(path.join(root,'index.html'),html);
const server=await createServer({root,configFile:false,logLevel:'warn',server:{host:'127.0.0.1',port:0,fs:{allow:[path.dirname(source),root,deps]}}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const pg=await browser.newPage({viewport:{width:600,height:600}});pg.on('pageerror',e=>console.log('PAGEERROR',e.message));
 await pg.goto('http://127.0.0.1:'+server.httpServer.address().port);await pg.waitForFunction(()=>window.ready,null,{timeout:60000,polling:100});
 const r=await pg.evaluate(()=>{const samples=[],box=new T.Box3(),v=new T.Vector3();const names=['hips','spine','spine1','spine2','head','leftArm','leftForeArm','leftHand','rightArm','rightForeArm','rightHand','leftUpLeg','rightUpLeg','leftFoot','rightFoot'];for(let f=0;f<=Math.floor(duration*60);f++){const time=f/60;pose(time);const points={};for(const n of names){const a=bones[n].getWorldPosition(v).toArray();points[n]=a;box.expandByPoint(v);}samples.push({time,points,rotations:Object.fromEntries(Object.entries(bones).map(([n,o])=>[n,o.quaternion.toArray()]))});}return {duration,samples,bounds:[box.min.toArray(),box.max.toArray()],trackNames:gltf.animations[0].tracks.map(t=>t.name)};});
 fs.writeFileSync(path.join(root,'kinematica.json'),JSON.stringify(r));
 await pg.evaluate(bounds=>{const min=new T.Vector3(...bounds[0]),max=new T.Vector3(...bounds[1]);window.center=min.clone().add(max).multiplyScalar(.5);window.span=Math.max(max.y-min.y,max.x-min.x)*1.18;window.camera=new T.OrthographicCamera(-span/2,span/2,span/2,-span/2,.001,1000);},r.bounds);
 fs.mkdirSync(path.join(root,'pose'),{recursive:true});
 for(const [name,dir] of [['fronte',[0,.12,-1]],['lato',[-1,.12,0]],['trequarti',[-.7,.18,-.7]]])for(let i=0;i<12;i++){
  const t=[4.8,5.1,5.4,5.65,5.8,5.9,5.95,6,6.1,6.25,6.5,6.8][i];const png=await pg.evaluate(({t,dir})=>{pose(t);center.copy(bones.hips.getWorldPosition(new T.Vector3()));span=2.75;camera.left=camera.bottom=-span/2;camera.right=camera.top=span/2;camera.updateProjectionMatrix();camera.position.copy(center).add(new T.Vector3(...dir).normalize().multiplyScalar(span*2));camera.lookAt(center);renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');},{t,dir});
  fs.writeFileSync(path.join(root,'pose',name+'-'+String(i).padStart(2,'0')+'.png'),Buffer.from(png.split(',')[1],'base64'));
 }
 console.log(JSON.stringify({duration:r.duration,bounds:r.bounds,samples:r.samples.length,views:36}));
}finally{await browser.close();await server.close();}
