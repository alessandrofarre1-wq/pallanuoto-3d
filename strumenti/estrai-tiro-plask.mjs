// Pose complete della clip di Ale. Modello e pesi non vengono riscritti.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
const input=process.argv[2],output=process.argv[3]||'src/grafica/dati/tiro-plask-01.js';
if(!input)throw new Error('Uso: node strumenti/estrai-tiro-plask.mjs sorgente.glb [uscita.js]');
const raw=fs.readFileSync(input),len=raw.readUInt32LE(12),g=JSON.parse(raw.toString('utf8',20,20+len)),bin=raw.subarray(28+len),width={SCALAR:1,VEC3:3,VEC4:4};
function acc(id){const a=g.accessors[id],v=g.bufferViews[a.bufferView],n=width[a.type],r=[];if(a.componentType!==5126||!n)throw new Error('Accessor inatteso');for(let i=0;i<a.count;i++)for(let j=0;j<n;j++)r.push(bin.readFloatLE((v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||4*n)+4*j));return r;}
const nodes=g.nodes.map(n=>{const o=new THREE.Object3D();o.name=n.name;if(n.matrix)new THREE.Matrix4().fromArray(n.matrix).decompose(o.position,o.quaternion,o.scale);else{o.position.fromArray(n.translation||[0,0,0]);o.quaternion.fromArray(n.rotation||[0,0,0,1]);o.scale.fromArray(n.scale||[1,1,1]);}return o;});
g.nodes.forEach((n,i)=>n.children?.forEach(c=>nodes[i].add(nodes[c])));const root=new THREE.Group();g.scenes[g.scene||0].nodes.forEach(i=>root.add(nodes[i]));
const named=Object.fromEntries(nodes.map(o=>[o.name,o])),a=g.animations[0],q=new THREE.Quaternion();
const tracks=a.channels.map(c=>{const s=a.samplers[c.sampler];return {o:nodes[c.target.node],kind:c.target.path,t:acc(s.input),v:acc(s.output)};});
function pose(t){for(const a of tracks){let i=0;while(i<a.t.length-2&&a.t[i+1]<t)i++;const j=Math.min(i+1,a.t.length-1),k=Math.max(0,Math.min(1,(t-a.t[i])/(a.t[j]-a.t[i]||1)));if(a.kind==='rotation'){a.o.quaternion.fromArray(a.v,4*i);q.fromArray(a.v,4*j);a.o.quaternion.slerp(q,k);}else if(a.kind==='translation')for(let c=0;c<3;c++)a.o.position.setComponent(c,a.v[3*i+c]+(a.v[3*j+c]-a.v[3*i+c])*k);}root.updateMatrixWorld(true);}
const body={hips:'pelvis',spine:'spine_01',spine1:'spine_02',spine2:'spine_03',neck:'neck_01',head:'head',leftShoulder:'clavicle_l',rightShoulder:'clavicle_r',leftArm:'upperarm_l',rightArm:'upperarm_r',leftForeArm:'lowerarm_l',rightForeArm:'lowerarm_r',leftHand:'hand_l',rightHand:'hand_r',leftUpLeg:'thigh_l',rightUpLeg:'thigh_r',leftLeg:'calf_l',rightLeg:'calf_r',leftFoot:'foot_l',rightFoot:'foot_r',leftToeBase:'ball_l',rightToeBase:'ball_r'};
const child={hips:'spine',spine:'spine1',spine1:'spine2',spine2:'neck',neck:'head'};
for(const side of ['left','right'])Object.assign(child,{[side+'Shoulder']:side+'Arm',[side+'Arm']:side+'ForeArm',[side+'ForeArm']:side+'Hand',[side+'Hand']:side+'HandMiddle1',[side+'UpLeg']:side+'Leg',[side+'Leg']:side+'Foot',[side+'Foot']:side+'ToeBase'});
const joints=g.skins[0].joints.map(i=>nodes[i].name),parent=Object.fromEntries(joints.map(n=>[n,named[n].parent?.name]));
for(const n of joints)if(!child[n])child[n]=named[n].children.find(c=>joints.includes(c.name))?.name||null;
const wp=n=>named[n].getWorldPosition(new THREE.Vector3());
pose(0);const restFront=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),wp('rightArm').sub(wp('leftArm')).normalize()).normalize();
function frame(axis,reference){const x=axis.normalize(),y=reference.clone().addScaledVector(x,-reference.dot(x));if(y.lengthSq()<1e-5)y.set(0,1,0).addScaledVector(x,-x.y);y.normalize();return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,new THREE.Vector3().crossVectors(x,y).normalize()));}
const bind=joints.map(n=>named[n].matrixWorld.clone().invert());
const frames=joints.map(n=>{const axis=child[n]?wp(child[n]).sub(wp(n)):wp(n).sub(wp(parent[n]));return frame(axis,/(Foot|ToeBase)$/.test(n)?new THREE.Vector3(0,1,0):restFront);});
const descriptors=joints.map(n=>({source:n,target:body[n]||n,child:child[n]?(body[child[n]]||child[n]):null,parent:parent[n]?(body[parent[n]]||parent[n]):null,reference:/(Foot|ToeBase)$/.test(n)?'up':'front'}));
pose(6.25);const forward=wp('rightHand').sub(wp('rightArm'));forward.y=0;forward.normalize();const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize(),alignment=new THREE.Matrix4().makeBasis(forward,new THREE.Vector3(0,1,0),right).transpose();
const fixNames=['rightArm','rightForeArm','rightHand'];pose(5.9);const before=fixNames.map(n=>named[n].quaternion.clone());pose(6.1);const after=fixNames.map(n=>named[n].quaternion.clone());
// Conserva tutta l’animazione; esclude solo la T-pose artificiale a t=0.
const start=1/60,end=6.916666507720947,count=Math.round((end-start)*60)+1,poses=[];
for(let f=0;f<count;f++){
 const t=Math.min(end,start+f/60);pose(t);
 if(t>5.9&&t<6.1){const k=(t-5.9)/.2;fixNames.forEach((n,i)=>named[n].quaternion.copy(before[i]).slerp(after[i],k));root.updateMatrixWorld(true);}
 const sample=[];
 for(let j=0;j<joints.length;j++){const delta=named[joints[j]].matrixWorld.clone().multiply(bind[j]);delta.setPosition(0,0,0);delta.extractRotation(delta);const qq=new THREE.Quaternion().setFromRotationMatrix(alignment.clone().multiply(delta)).multiply(frames[j]).normalize();sample.push(qq);}
 poses.push(sample);
}
// Riduce il rumore del tracking senza filtro dinamico o ritardo durante il gioco.
const smooth=poses.map((row,f)=>row.map((_,j)=>{let out=poses[Math.max(0,f-2)][j].clone(),sum=1;for(const [d,w]of [[-1,2],[0,3],[1,2],[2,1]]){const b=poses[Math.max(0,Math.min(count-1,f+d))][j];out.slerp(b,w/(sum+w));sum+=w;}return out.normalize();}));
for(let j=0;j<joints.length;j++)for(let f=1;f<count;f++)if(smooth[f][j].dot(smooth[f-1][j])<0){const a=smooth[f][j];a.set(-a.x,-a.y,-a.z,-a.w);}
function log(q){const a=Math.acos(Math.max(-1,Math.min(1,q.w))),s=Math.sin(a);return new THREE.Vector3(q.x,q.y,q.z).multiplyScalar(Math.abs(s)>1e-8?a/s:1);}
function exp(v){const a=v.length(),s=a>1e-8?Math.sin(a)/a:1;return new THREE.Quaternion(v.x*s,v.y*s,v.z*s,Math.cos(a));}
const controls=smooth.map((row,f)=>row.map((v,j)=>{if(f===0||f===count-1)return v.clone();const inv=v.clone().invert(),p=log(inv.clone().multiply(smooth[f-1][j])),n=log(inv.clone().multiply(smooth[f+1][j]));return v.clone().multiply(exp(p.add(n).multiplyScalar(-.25))).normalize();}));
const packed=Buffer.alloc(count*joints.length*4*2*2);let offset=0;for(const rows of [smooth,controls])for(const row of rows)for(const q of row)for(const x of q.toArray()){packed.writeInt16LE(Math.round(Math.max(-1,Math.min(1,x))*32767),offset);offset+=2;}
const video=process.argv.find(a=>a.startsWith('--video='))?.slice(8);
const data={source:{sha256:createHash('sha256').update(raw).digest('hex'),videoSha256:video?createHash('sha256').update(fs.readFileSync(video)).digest('hex'):null,animation:a.name,fullDuration:end,start,end,loadEnd:5.9,releaseAnchor:6.1,gap:[5.9,6.1],gapBones:fixNames,releaseNote:'Ancora della posa adattata al rilascio fisico esistente; distacco originale fuori inquadratura, non misurato.'},bones:descriptors,frames:count,fps:60,encoding:'signed-int16-le-quaternions-squad',packed:packed.toString('base64')};
fs.writeFileSync(output,'// Generato: pose complete della clip di Ale, nessuna mesh.\nexport default '+JSON.stringify(data)+';\n');
console.log(JSON.stringify({output,bytes:fs.statSync(output).size,bones:joints.length,frames:count,sourceSHA256:data.source.sha256}));
