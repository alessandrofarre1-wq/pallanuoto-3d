// Prova dello scheletro in Three.js con la STESSA tecnica del gioco (corpo.js): ogni osso viene girato in modo che punti verso la
// giuntura successiva nella direzione voluta. Avviata da strumenti/posa-glb.mjs. Direzioni nel sistema del personaggio:
// X = sua sinistra, Y = su, Z = avanti.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const daBase64 = b => Uint8Array.from(atob(b), c => c.charCodeAt(0)).buffer;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _qd = new THREE.Quaternion();
function punta(osso, figlio, dir) {      // come in src/grafica/corpo.js
  osso.updateWorldMatrix(true, true); osso.getWorldPosition(_a); figlio.getWorldPosition(_b); _b.sub(_a).normalize();
  _qd.setFromUnitVectors(_b, dir.clone().normalize()); osso.getWorldQuaternion(_q); osso.parent.getWorldQuaternion(_qp);
  osso.quaternion.copy(_q.premultiply(_qd).premultiply(_qp.invert()));
}
const gira = (osso, asse, gradi) => { osso.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...asse).normalize(), gradi * Math.PI / 180)); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// bicicletta: cosce avanti e in fuori, ginocchia piegate, una gamba più avanti dell'altra
const bicicletta = O => { punta(O.thigh_l, O.calf_l, V(0.5, -0.45, 0.75)); punta(O.calf_l, O.foot_l, V(0.45, -0.85, -0.25)); punta(O.foot_l, O.ball_l, V(0.5, -0.6, 0.6));
  punta(O.thigh_r, O.calf_r, V(-0.55, -0.7, 0.45)); punta(O.calf_r, O.foot_r, V(-0.1, -0.65, -0.75)); punta(O.foot_r, O.ball_r, V(-0.3, -0.9, 0.3)); };
const POSE = {
  'riposo (posa a T)': () => {},
  'galleggiamento (bicicletta)': O => { bicicletta(O);
    for (const [n, s] of [['l', 1], ['r', -1]]) { punta(O['upperarm_' + n], O['lowerarm_' + n], V(s * 0.7, -0.6, 0.4)); punta(O['lowerarm_' + n], O['hand_' + n], V(s * 0.25, -0.15, 1)); punta(O['hand_' + n], O['presa_' + n], V(s * 0.1, 0, 1)); } },
  'tiro: caricamento': O => { bicicletta(O); gira(O.spine_01, [0, 1, 0], -12); gira(O.spine_02, [0, 1, 0], -14); gira(O.spine_03, [0, 1, 0], -16); gira(O.spine_03, [1, 0, 0], -8); gira(O.head, [0, 1, 0], 30);
    punta(O.clavicle_r, O.upperarm_r, V(-0.9, 0.35, -0.25)); punta(O.upperarm_r, O.lowerarm_r, V(-0.7, 0.5, -0.5)); punta(O.lowerarm_r, O.hand_r, V(0.15, 0.95, -0.3)); punta(O.hand_r, O.presa_r, V(0.2, 0.95, -0.1));
    punta(O.upperarm_l, O.lowerarm_l, V(0.5, -0.3, 0.8)); punta(O.lowerarm_l, O.hand_l, V(0.05, -0.12, 1)); punta(O.hand_l, O.presa_l, V(0, 0, 1)); },
  'tiro: rilascio': O => { bicicletta(O); gira(O.spine_01, [0, 1, 0], 10); gira(O.spine_02, [0, 1, 0], 12); gira(O.spine_03, [0, 1, 0], 14); gira(O.spine_02, [1, 0, 0], 10);
    punta(O.clavicle_r, O.upperarm_r, V(-0.8, 0.45, 0.4)); punta(O.upperarm_r, O.lowerarm_r, V(-0.25, 0.65, 0.7)); punta(O.lowerarm_r, O.hand_r, V(-0.05, 0.4, 0.92)); punta(O.hand_r, O.presa_r, V(0, 0.1, 1));
    punta(O.upperarm_l, O.lowerarm_l, V(0.75, -0.6, 0.1)); punta(O.lowerarm_l, O.hand_l, V(0.4, -0.5, 0.75)); },
  'stile libero': O => { gira(O.pelvis, [1, 0, 0], 82); gira(O.neck_01, [1, 0, 0], -30); gira(O.head, [1, 0, 0], -32);      // corpo disteso, testa alta
    punta(O.upperarm_r, O.lowerarm_r, V(-0.7, 0.55, 0.45)); punta(O.lowerarm_r, O.hand_r, V(-0.05, -0.35, 0.93)); punta(O.hand_r, O.presa_r, V(0, -0.3, 0.95));      // recupero a gomito alto
    punta(O.upperarm_l, O.lowerarm_l, V(0.3, -0.75, 0.55)); punta(O.lowerarm_l, O.hand_l, V(0.05, -0.95, -0.2)); punta(O.hand_l, O.presa_l, V(0, -0.9, -0.4));        // trazione sott'acqua
    punta(O.thigh_l, O.calf_l, V(0.06, 0.08, -1)); punta(O.calf_l, O.foot_l, V(0.05, -0.1, -1)); punta(O.foot_l, O.ball_l, V(0, -0.25, -1)); punta(O.thigh_r, O.calf_r, V(-0.06, -0.12, -1)); punta(O.calf_r, O.foot_r, V(-0.05, 0.12, -1)); punta(O.foot_r, O.ball_r, V(0, -0.2, -1)); },
  'parata del portiere': O => { bicicletta(O); gira(O.spine_02, [0, 0, 1], -12); gira(O.spine_03, [0, 0, 1], -10);
    punta(O.clavicle_l, O.upperarm_l, V(0.85, 0.5, 0)); punta(O.upperarm_l, O.lowerarm_l, V(0.7, 0.7, 0.1)); punta(O.lowerarm_l, O.hand_l, V(0.45, 0.88, 0.12)); punta(O.hand_l, O.presa_l, V(0.3, 0.95, 0.1));
    punta(O.clavicle_r, O.upperarm_r, V(-0.85, 0.5, 0)); punta(O.upperarm_r, O.lowerarm_r, V(-0.85, 0.5, 0.15)); punta(O.lowerarm_r, O.hand_r, V(-0.6, 0.78, 0.15)); punta(O.hand_r, O.presa_r, V(-0.4, 0.9, 0.1)); },
};
window.pose = Object.keys(POSE);
window.posa = async ({ glb, largo, alto, nome, vista, argilla }) => {
  const canvas = document.getElementById('c'); canvas.width = largo; canvas.height = alto;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); renderer.setSize(largo, alto, false);
  const scena = new THREE.Scene(); scena.background = new THREE.Color(0xcfd6e0);
  scena.add(new THREE.HemisphereLight(0xffffff, 0xb8b0a8, 2.0)); const sole = new THREE.DirectionalLight(0xffffff, 2.2); sole.position.set(-3, 5, 6); scena.add(sole);
  const gltf = await new GLTFLoader().parseAsync(daBase64(glb), ''); scena.add(gltf.scene); gltf.scene.updateMatrixWorld(true);
  let maglia = null; const O = {}; gltf.scene.traverse(o => { if (o.isSkinnedMesh) maglia = o; if (o.isBone) O[o.name] = o; });
  maglia.frustumCulled = false; if (argilla) maglia.material = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.75 });
  // controlli sullo scheletro: rotazioni di riposo nulle? (il gioco lo dà per scontato)
  let rotMax = 0; for (const b of Object.values(O)) rotMax = Math.max(rotMax, 2 * Math.acos(Math.min(1, Math.abs(b.quaternion.w))) * 180 / Math.PI);
  const info = { ossa: Object.keys(O), rotazione_di_riposo_massima_gradi: +rotMax.toFixed(3), triangoli: maglia.geometry.index.count / 3, pesi_per_punto: maglia.geometry.attributes.skinIndex.itemSize, scheletro: maglia.isSkinnedMesh };
  POSE[nome](O); gltf.scene.updateMatrixWorld(true); maglia.skeleton.update();
  const bb = new THREE.Box3(); maglia.computeBoundingBox(); bb.copy(maglia.boundingBox).applyMatrix4(maglia.matrixWorld);
  // ingombro vero della posa: dalle ossa
  const pb = new THREE.Box3(); for (const b of Object.values(O)) pb.expandByPoint(b.getWorldPosition(new THREE.Vector3())); const c = pb.getCenter(new THREE.Vector3()), dim = pb.getSize(new THREE.Vector3()), r = Math.max(dim.x, dim.y, dim.z) * 0.5 + 0.35;
  const cam = new THREE.PerspectiveCamera(24, largo / alto, 0.05, 100), d = new THREE.Vector3(...(vista || [-0.55, 0.18, 1])).normalize();
  cam.position.copy(c).addScaledVector(d, r / Math.tan(12 * Math.PI / 180) * 1.05); cam.lookAt(c); renderer.render(scena, cam);
  return info;
};
window.pronto = true;
