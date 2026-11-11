// Acqua realistica: superficie trasparente con onde fitte, riflesso di ciò che sta sopra e
// vista deformata di ciò che sta sotto (corpi, fondo). Adattata da Water2 di Three.js (licenza MIT).
// Tre livelli: 2 = alta (riflesso + trasparenza), 1 = media (solo trasparenza), 0 = bassa (acqua semplice della v0.9).
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { Refractor } from 'three/addons/objects/Refractor.js';
import urlOnde1 from './immagini/acqua-normali-1.jpg';
import urlOnde2 from './immagini/acqua-normali-2.jpg';

// strati di disegno: servono a non ridisegnare tutto tre volte
export const STRATO_VASCA=0;     // fondo e pareti: scena principale + vista sott'acqua
export const STRATO_CORPI=1;     // giocatori e palla: scena principale + vista sott'acqua
export const STRATO_SOPRA=2;     // bordo vasca, tribune, porte, corde: scena principale + riflesso
export const STRATO_SOLO_VISTA=3;// schiuma, numeri, indicatori, corpo dettagliato dei giocatori: solo scena principale
export const STRATO_SOTTO=4;     // corpo leggero dei giocatori: solo vista sott'acqua

const vertice=/* glsl */`
  #include <common>
  #include <fog_pars_vertex>
  uniform mat4 textureMatrix;
  varying vec4 vCoord; varying vec2 vUv; varying vec3 vToEye;
  void main(){
    vUv=uv;
    vCoord=textureMatrix*vec4(position,1.0);
    vec4 worldPosition=modelMatrix*vec4(position,1.0);
    vToEye=cameraPosition-worldPosition.xyz;
    vec4 mvPosition=viewMatrix*worldPosition;
    gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
  }`;
const frammento=/* glsl */`
  #include <common>
  #include <fog_pars_fragment>
  uniform sampler2D tReflectionMap, tRefractionMap, tNormalMap0, tNormalMap1;
  uniform vec3 color, cielo, sole, coloreSole, profondo;
  uniform vec2 scala;
  uniform float tempo, riflettanza, distorsione, conRiflesso;
  varying vec4 vCoord; varying vec2 vUv; varying vec3 vToEye;
  void main(){
    vec3 toEye=normalize(vToEye);
    // due strati di onde che scorrono in direzioni diverse
    vec2 uv0=vUv*scala+vec2(tempo*0.021,tempo*0.013);
    vec2 uv1=vUv*scala*1.7+vec2(-tempo*0.017,tempo*0.024);
    vec3 n0=texture2D(tNormalMap0,uv0).rgb, n1=texture2D(tNormalMap1,uv1).rgb;
    vec3 nc=mix(n0,n1,0.5);
    vec3 normal=normalize(vec3(nc.r*2.0-1.0,nc.b*1.6,nc.g*2.0-1.0));
    float theta=max(dot(toEye,normal),0.0);
    float reflectance=riflettanza+(1.0-riflettanza)*pow(1.0-theta,5.0);
    vec3 coord=vCoord.xyz/vCoord.w;
    vec2 uv=coord.xy+coord.z*normal.xz*distorsione;
    // ciò che sta sott'acqua prende il colore dell'acqua e perde un po' di contrasto
    vec3 sotto=mix(texture2D(tRefractionMap,uv).rgb*color,profondo,0.2);
    vec3 sopra=mix(cielo,texture2D(tReflectionMap,vec2(1.0-uv.x,uv.y)).rgb,conRiflesso);
    vec3 c=mix(sotto,sopra,reflectance);
    // chiaroscuro delle increspature, così le onde si leggono anche dove non c'è riflesso
    c*=1.0+(normal.x*0.6-normal.z*0.8)*0.5;
    // luccichio del sole sulle creste
    float luce=pow(max(dot(reflect(-sole,normal),toEye),0.0),180.0);
    c+=coloreSole*luce*0.9;
    gl_FragColor=vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }`;

export class Acqua extends THREE.Mesh {
  constructor(larghezza,profondita,opz={}){
    const geo=new THREE.PlaneGeometry(larghezza,profondita);
    super(geo);
    this.rotation.x=-Math.PI/2;
    this.renderOrder=-1;
    this.livello=2;
    const carica=new THREE.TextureLoader();
    const onde=u=>{ const t=carica.load(u); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; };
    this.riflesso=new Reflector(geo,{textureWidth:256,textureHeight:256,multisample:0});
    this.sotto=new Refractor(geo,{textureWidth:256,textureHeight:256,multisample:0});
    this.riflesso.matrixAutoUpdate=false; this.sotto.matrixAutoUpdate=false;
    // il riflesso mostra solo le cose ferme sopra l'acqua; la vista sott'acqua solo vasca e corpi
    this.sotto.camera.layers.set(STRATO_VASCA); this.sotto.camera.layers.enable(STRATO_CORPI); this.sotto.camera.layers.enable(STRATO_SOTTO);
    this.matrice=new THREE.Matrix4();
    this.material=new THREE.ShaderMaterial({
      name:'Acqua', transparent:true, fog:true, vertexShader:vertice, fragmentShader:frammento,
      uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{
        color:{value:new THREE.Color(opz.colore??0xffffff)}, cielo:{value:new THREE.Color(opz.cielo??0x9fd0f2)},
        sole:{value:(opz.sole||new THREE.Vector3(0,1,0)).clone().normalize()}, coloreSole:{value:new THREE.Color(opz.coloreSole??0xfff3dc)},
        scala:{value:new THREE.Vector2(larghezza/(opz.metriPerOnda||5),profondita/(opz.metriPerOnda||5))},
        profondo:{value:new THREE.Color(opz.profondo??0x2a8fd6)},
        tempo:{value:0}, riflettanza:{value:opz.riflettanza??0.06}, distorsione:{value:opz.distorsione??0.022}, conRiflesso:{value:1},
        tReflectionMap:{value:null}, tRefractionMap:{value:null}, tNormalMap0:{value:onde(urlOnde1)}, tNormalMap1:{value:onde(urlOnde2)},
        textureMatrix:{value:this.matrice},
      }]),
    });
    const u=this.material.uniforms;
    u.tReflectionMap.value=this.riflesso.getRenderTarget().texture;
    u.tRefractionMap.value=this.sotto.getRenderTarget().texture;
    u.textureMatrix.value=this.matrice;
    this.onBeforeRender=(renderer,scene,camera)=>{
      this.matrice.set(0.5,0,0,0.5, 0,0.5,0,0.5, 0,0,0.5,0.5, 0,0,0,1);
      this.matrice.multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(this.matrixWorld);
      this.visible=false;
      if(this.livello>=2){ this.riflesso.getReflectionCamera(camera).layers.set(STRATO_SOPRA); this.riflesso.matrixWorld.copy(this.matrixWorld); this.riflesso.onBeforeRender(renderer,scene,camera); }
      this.sotto.matrixWorld.copy(this.matrixWorld); this.sotto.onBeforeRender(renderer,scene,camera);
      this.visible=true;
    };
  }
  setTempo(t){ this.material.uniforms.tempo.value=t; }
  setLivello(l){ this.livello=l; this.material.uniforms.conRiflesso.value=l>=2?1:0; }
  // riflesso e vista sott'acqua si disegnano a risoluzione ridotta rispetto allo schermo
  ridimensiona(w,h){
    const f=this.livello>=2?0.5:0.4, W=Math.max(64,Math.round(w*f)), H=Math.max(64,Math.round(h*f));
    this.sotto.getRenderTarget().setSize(W,H);
    this.riflesso.getRenderTarget().setSize(Math.round(W/2),Math.round(H/2));
  }
}
