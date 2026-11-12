// Visualizzatore dei modelli degli atleti (avviato da strumenti/render-atleta.mjs): carica un .glb, la sua pelle e le misure
// della testa, mette calottina e costume e disegna il personaggio in posa neutra: fronte, fianco, schiena e primo piano del viso.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { calottinaGeo, disegnaCalottina } from '../../src/grafica/calottina.js';

const daBase64 = b => Uint8Array.from(atob(b), c => c.charCodeAt(0)).buffer;
window.mostra = async ({ glb, pelle, misure, colori, num, largo, alto, morph }) => {
  const canvas = document.getElementById('c'); canvas.width = largo; canvas.height = alto;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); renderer.setSize(largo, alto, false);
  const scena = new THREE.Scene(); scena.background = new THREE.Color(0xdfe9f5);
  scena.add(new THREE.HemisphereLight(0xffffff, 0xc9b7a5, 1.9)); const sole = new THREE.DirectionalLight(0xfff4e0, 1.7); sole.position.set(3, 6, 8); scena.add(sole);
  const fronte = new THREE.DirectionalLight(0xffffff, 0.9); fronte.position.set(-2, 0.5, 9); scena.add(fronte);      // luce di riempimento: niente occhiaie
  const gltf = await new GLTFLoader().parseAsync(daBase64(glb), '');
  const tex = await new THREE.TextureLoader().loadAsync('data:image/jpeg;base64,' + pelle); tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false;
  const gradini = new THREE.DataTexture(new Uint8Array([150, 150, 150, 255, 215, 215, 215, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat); gradini.minFilter = gradini.magFilter = THREE.NearestFilter; gradini.needsUpdate = true;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, metalness: 0 });      // liscio e morbido, come un personaggio 3D da videogioco
  const u = { uCostume: { value: new THREE.Color(colori.costume) }, uFascia: { value: new THREE.Vector2(misure.costume[0], misure.costume[1]) } };
  mat.onBeforeCompile = sh => { Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float _costume; varying float vCostume; varying float vQuota;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvCostume=_costume; vQuota=position.y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uCostume; uniform vec2 uFascia; varying float vCostume; varying float vQuota;')
      .replace('#include <map_fragment>', '#include <map_fragment>\nif(vCostume>1.5) diffuseColor.rgb=vec3(0.13,0.09,0.07); else diffuseColor.rgb=mix(diffuseColor.rgb,uCostume,step(0.5,vCostume)*step(uFascia.x,vQuota)*(1.0-step(uFascia.y,vQuota)));'); };
  let maglia = null, testa = null; gltf.scene.traverse(o => { if (o.isSkinnedMesh) maglia = o; if (o.name === 'head') testa = o; });
  maglia.material = mat; maglia.frustumCulled = false;
  if (morph && maglia.morphTargetDictionary) for (const [k, v] of Object.entries(morph)) if (k in maglia.morphTargetDictionary) maglia.morphTargetInfluences[maglia.morphTargetDictionary[k]] = v;
  const tc = new THREE.CanvasTexture(Object.assign(document.createElement('canvas'), { width: 256, height: 128 })); tc.colorSpace = THREE.SRGBColorSpace;
  disegnaCalottina(tc, num, colori.calottina, colori.paraorecchie, colori.testo, true);
  const cal = new THREE.Mesh(calottinaGeo(misure, { paraorecchie: 1.45 }), new THREE.MeshStandardMaterial({ map: tc, roughness: 0.5, side: THREE.DoubleSide })); testa.add(cal);
  scena.add(gltf.scene); gltf.scene.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(maglia), c = bb.getCenter(new THREE.Vector3()), h = bb.max.y - bb.min.y;
  const tp = testa.getWorldPosition(new THREE.Vector3());
  const cam = new THREE.PerspectiveCamera(22, 1, 0.1, 500);
  const w = Math.round(largo / 4);
  renderer.setScissorTest(true);
  const viste = [[0, 0, 1], [1, 0, 0.0001], [0, 0, -1]];
  viste.forEach((d, i) => { renderer.setViewport(i * w, 0, w, alto); renderer.setScissor(i * w, 0, w, alto); cam.aspect = w / alto; cam.updateProjectionMatrix();
    const dist = h * 3.1; cam.position.set(c.x + d[0] * dist, c.y + h * 0.05, c.z + d[2] * dist); cam.lookAt(c.x, c.y, c.z); renderer.render(scena, cam); });
  // primo piano del viso, di tre quarti, e di fronte sotto
  const hh = misure.raggi[1] * 2.6;
  [[0.55, 0.12, 1], [0, 0.02, 1]].forEach((d, i) => { const y0 = i ? 0 : alto / 2; renderer.setViewport(3 * w, y0, largo - 3 * w, alto / 2); renderer.setScissor(3 * w, y0, largo - 3 * w, alto / 2);
    cam.aspect = (largo - 3 * w) / (alto / 2); cam.updateProjectionMatrix(); const dist = hh * 3.6, l = Math.hypot(d[0], d[2]);
    cam.position.set(tp.x + d[0] / l * dist, tp.y + hh * 0.42 + d[1] * dist, tp.z + d[2] / l * dist); cam.lookAt(tp.x, tp.y + hh * 0.36, tp.z); renderer.render(scena, cam); });
  return { altezza: h, triangoli: maglia.geometry.index.count / 3, morph: Object.keys(maglia.morphTargetDictionary || {}) };
};
window.pronto = true;
