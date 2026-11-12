// Prova di un file .glb nella versione di Three.js del gioco (avviata da strumenti/prova-glb.mjs): lo carica, ne legge i dati,
// lo disegna tre volte: com'è, e due volte con calottina e costume ricolorati usando le "zone" scritte sui punti (_zona).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const daBase64 = b => Uint8Array.from(atob(b), c => c.charCodeAt(0)).buffer;
window.prova = async ({ glb, largo, alto }) => {
  const canvas = document.getElementById('c'); canvas.width = largo; canvas.height = alto;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); renderer.setSize(largo, alto, false);
  const scena = new THREE.Scene(); scena.background = new THREE.Color(0xcfd6e0);
  scena.add(new THREE.HemisphereLight(0xffffff, 0xb8b0a8, 2.0)); const sole = new THREE.DirectionalLight(0xffffff, 2.2); sole.position.set(-3, 5, 6); scena.add(sole);
  const gltf = await new GLTFLoader().parseAsync(daBase64(glb), '');
  let maglia = null; gltf.scene.traverse(o => { if (o.isMesh) maglia = o; });
  const g = maglia.geometry, m = maglia.material, bb = new THREE.Box3().setFromObject(gltf.scene), dim = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
  const info = { three: THREE.REVISION, triangoli: g.index.count / 3, punti: g.attributes.position.count, dati: Object.keys(g.attributes), materiale: m.type, immagini: { colore: !!m.map, rilievo: !!m.normalMap, ruvidezza: !!m.roughnessMap, lato: m.map ? m.map.image.width : 0 }, dimensioni: dim.toArray().map(x => +x.toFixed(3)), minY: +bb.min.y.toFixed(3), scheletro: !!maglia.isSkinnedMesh };
  // cambio colore per istanza: materiale clonato, la tinta blu dell'immagine viene sostituita solo dove _zona lo dice
  const ricolora = (cal, cos) => { const k = m.clone(); const u = { uCal: { value: new THREE.Color(cal) }, uCos: { value: new THREE.Color(cos) } };
    k.onBeforeCompile = sh => { Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 _zona; varying vec3 vZona;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvZona=_zona;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uCal; uniform vec3 uCos; varying vec3 vZona;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          { float lum=dot(diffuseColor.rgb,vec3(0.3,0.5,0.2)); float blu=smoothstep(0.08,0.25,diffuseColor.b-max(diffuseColor.r,diffuseColor.g)*0.9);      // solo i punti blu dell'immagine (il numero bianco resta bianco)
            diffuseColor.rgb=mix(diffuseColor.rgb,uCal*(0.35+1.5*lum),blu*step(0.5,vZona.x)); diffuseColor.rgb=mix(diffuseColor.rgb,uCos*(0.35+1.5*lum),blu*step(0.5,vZona.y)); }`); };
    return k; };
  const copie = [[m, -1], [ricolora('#f4f4f2', '#c1121f'), 0], [ricolora('#c1121f', '#16a34a'), 1]];
  for (const [mat, i] of copie) { const o = new THREE.Mesh(g, mat); o.position.x = i * dim.x * 1.05; o.rotation.y = i === 1 ? 2.4 : i === 0 ? -0.5 : 0; scena.add(o); }
  const cam = new THREE.PerspectiveCamera(24, largo / alto, 0.05, 100); cam.position.set(0, c.y + dim.y * 0.1, dim.y * 3.6); cam.lookAt(0, c.y, 0); renderer.render(scena, cam);
  info.oggetti = renderer.info.render.calls; return info;
};
window.pronto = true;
