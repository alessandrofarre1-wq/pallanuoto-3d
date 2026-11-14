// Onde geometriche basse, normali analitiche e Fresnel. Il riflesso della scena
// ha una piccola texture dedicata e viene escluso dalla qualità adattiva.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

export function creaSuperficie(larghezza, profondita, tempo){
  const telefono='ontouchstart' in window || navigator.maxTouchPoints>0;
  const geometria=new THREE.PlaneGeometry(larghezza,profondita,telefono?32:100,telefono?24:80);
  geometria.rotateX(-Math.PI/2);
  const specchio=new Reflector(new THREE.PlaneGeometry(larghezza,profondita),{
    textureWidth:384,textureHeight:192,multisample:0,clipBias:0.003,
  });
  specchio.rotation.x=-Math.PI/2; specchio.updateMatrixWorld();
  const inversa=specchio.matrixWorld.clone().invert(), matrice=new THREE.Matrix4();
  const materiale=new THREE.ShaderMaterial({
    transparent:true, depthWrite:false,
    uniforms:{ uTempo:tempo, uRiflesso:{value:specchio.getRenderTarget().texture}, uMatrice:{value:matrice}, uConRiflesso:{value:0} },
    vertexShader:`
      uniform float uTempo;
      uniform mat4 uMatrice;
      varying vec3 vMondo;
      varying vec4 vRiflesso;
      void main(){
        vec3 p=position;
        p.y=0.009*sin(p.x*2.1+p.z*1.3-uTempo*1.7)
           +0.006*sin(p.x*3.7-p.z*2.5+uTempo*2.1);
        vMondo=(modelMatrix*vec4(p,1.0)).xyz;
        vRiflesso=uMatrice*vec4(vMondo,1.0);
        gl_Position=projectionMatrix*viewMatrix*vec4(vMondo,1.0);
      }`,
    fragmentShader:`
      uniform float uTempo;
      uniform sampler2D uRiflesso;
      uniform float uConRiflesso;
      varying vec3 vMondo;
      varying vec4 vRiflesso;
      void main(){
        vec2 p=vMondo.xz;
        float a=p.x*2.1+p.y*1.3-uTempo*1.7;
        float b=p.x*3.7-p.y*2.5+uTempo*2.1;
        float c=p.x*11.0+p.y*7.0-uTempo*3.0;
        float d=p.x*17.0-p.y*13.0+uTempo*3.7;
        float detail=1.0-smoothstep(0.06,0.25,length(fwidth(p)));
        vec2 pente=vec2(2.1,1.3)*cos(a)*0.025
                  +vec2(3.7,-2.5)*cos(b)*0.018
                  +(vec2(11.0,7.0)*cos(c)+vec2(17.0,-13.0)*cos(d))*0.0025*detail;
        vec3 N=normalize(vec3(-pente.x,1.0,-pente.y));
        vec3 V=normalize(cameraPosition-vMondo);
        vec3 R=reflect(-V,N);
        float fresnel=0.025+0.975*pow(1.0-max(dot(N,V),0.0),5.0);
        // Le variazioni lente restano deboli: il contrasto serve alla partita.
        float profondita=0.5+0.5*sin(p.x*0.19+p.y*0.23+sin(p.y*0.3)*0.5);
        vec3 acqua=mix(vec3(0.005,0.14,0.25),vec3(0.008,0.25,0.36),profondita);
        vec3 cielo=mix(vec3(0.24,0.42,0.54),vec3(0.57,0.75,0.86),clamp(R.y,0.0,1.0));
        vec3 colore=mix(acqua,cielo,fresnel);
        vec2 uvRiflesso=vRiflesso.xy/vRiflesso.w+pente*0.035;
        vec3 riflesso=texture2D(uRiflesso,clamp(uvRiflesso,0.002,0.998)).rgb;
        colore=mix(colore,riflesso,clamp(0.12+fresnel*0.8,0.0,0.85)*uConRiflesso);
        vec3 sole=normalize(vec3(-10.0,30.0,14.0));
        float spec=pow(max(dot(reflect(-sole,N),V),0.0),180.0);
        // Riflessi allungati dei corpi illuminanti a bordo vasca.
        float pannelli=pow(max(R.y,0.0),8.0)
          *pow(0.5+0.5*cos(R.x*25.0+R.z*17.0),24.0);
        colore+=vec3(1.0,0.9,0.72)*spec*0.8;
        colore+=vec3(0.55,0.78,0.9)*pannelli*0.12;
        float alpha=clamp(0.23+fresnel*0.62+spec*0.16,0.0,0.88);
        gl_FragColor=vec4(colore,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const superficie=new THREE.Mesh(geometria,materiale);
  superficie.renderOrder=-1;
  // Un riflesso a risoluzione contenuta. Non include gli indicatori sopra le teste.
  superficie.onBeforeRender=(renderer,scene,camera)=>{
    // Alta = DPR almeno 1,75. Su iPhone il massimo è 1,50: resta il
    // riflesso dell'ambiente, senza un secondo disegno di tutti i corpi.
    materiale.uniforms.uConRiflesso.value=renderer.getPixelRatio()>=1.75?1:0;
    if(!materiale.uniforms.uConRiflesso.value) return;
    const riflesso=specchio.getReflectionCamera(camera); riflesso.layers.set(0);
    superficie.visible=false;
    try {
      specchio.onBeforeRender(renderer,scene,camera);
      matrice.copy(specchio.material.uniforms.textureMatrix.value).multiply(inversa);
    } finally { superficie.visible=true; }
  };
  superficie.userData.riduciQualita=()=>{
    if(!materiale.uniforms.uConRiflesso.value) return false;
    materiale.uniforms.uConRiflesso.value=0;
    return true;
  };
  superficie.userData.dispose=()=>{specchio.dispose();specchio.geometry.dispose();};
  return superficie;
}
