import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function illuminaArena(renderer,scene){
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.0;
  // Ambiente prefiltrato una sola volta: dà volume ai materiali bagnati senza
  // rifare riflessi o shadow map a ogni fotogramma.
  const pmrem=new THREE.PMREMGenerator(renderer);
  const stanza=new RoomEnvironment();
  const ambiente=pmrem.fromScene(stanza,0.04);
  scene.environment=ambiente.texture;
  scene.environmentIntensity=0.3;
  scene.userData.ambiente=ambiente;
  stanza.dispose(); pmrem.dispose();
  const riempimento=new THREE.DirectionalLight(0x9cdbff,0.8);
  riempimento.position.set(8,9,-12); scene.add(riempimento);
}

export function creaOmbreAcqua(scene){
  const geo=new THREE.PlaneGeometry(2,2); geo.rotateX(-Math.PI/2);
  const mat=new THREE.ShaderMaterial({ transparent:true, depthWrite:false,
    vertexShader:`varying vec2 vUv; void main(){ vUv=uv; vec3 transformed=position;
      #include <project_vertex>
    }`,
    fragmentShader:`varying vec2 vUv; void main(){ float r=length(vUv*2.0-1.0);
      float a=(1.0-smoothstep(0.15,1.0,r))*0.23;
      gl_FragColor=vec4(0.005,0.075,0.10,a);
      #include <colorspace_fragment>
    }`,
  });
  const ombre=new THREE.InstancedMesh(geo,mat,24); ombre.frustumCulled=false;
  ombre.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(ombre);
  const m=new THREE.Matrix4(), q=new THREE.Quaternion(), p=new THREE.Vector3(), s=new THREE.Vector3(), su=new THREE.Vector3(0,1,0);
  return giocatori=>{
    ombre.count=Math.min(giocatori.length,24);
    for(let i=0;i<ombre.count;i++){
      const g=giocatori[i], visibile=!g.excluded&&g.mesh.g.visible, o=g.oriz||0;
      q.setFromAxisAngle(su,Math.atan2(-g.fz,g.fx));
      s.set(visibile?0.45+0.65*o:0,1,visibile?0.38:0);
      m.compose(p.set(g.x-0.15*g.fx*o,-0.025,g.z-0.15*g.fz*o),q,s);
      ombre.setMatrixAt(i,m);
    }
    ombre.instanceMatrix.needsUpdate=true;
  };
}
