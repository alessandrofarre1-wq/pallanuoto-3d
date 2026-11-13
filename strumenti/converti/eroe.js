// Immagine del giocatore per la home di WATERPOLO 7 (come nel concept di Ale): il pallanuotista VERO del gioco
// (src/grafica/modelli/pallanuotista.glb, cuffia blu con il 7), messo in posa con la tecnica del gioco (ogni osso punta verso
// la giuntura successiva), con il braccio alzato che tiene la palla gialla e blu, il busto fuori dall'acqua e gli schizzi
// attorno. Sfondo trasparente: acqua e luci della piscina le disegna il menu. Avviata da strumenti/eroe.mjs.
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
// generatore di numeri ripetibile (gli schizzi escono sempre uguali)
let seme = 7; const caso = () => { seme = (seme * 16807) % 2147483647; return seme / 2147483647; };

// posa: direzioni nel sistema del personaggio (X = sua sinistra, Y = su, Z = avanti)
function posa(O, P) {
  gira(O.spine_01, [0, 1, 0], P.busto * 0.3); gira(O.spine_02, [0, 1, 0], P.busto * 0.35); gira(O.spine_03, [0, 1, 0], P.busto * 0.35);
  gira(O.spine_02, [0, 0, 1], P.piega);
  // braccio destro alzato con la palla sopra la spalla
  punta(O.clavicle_r, O.upperarm_r, V(-0.85, 0.5, -0.1));
  punta(O.upperarm_r, O.lowerarm_r, V(...P.bracD));
  punta(O.lowerarm_r, O.hand_r, V(...P.avamD));
  punta(O.hand_r, O.presa_r, V(...P.manoD));
  // braccio sinistro avanti, verso l'acqua (equilibrio)
  punta(O.upperarm_l, O.lowerarm_l, V(...P.bracS));
  punta(O.lowerarm_l, O.hand_l, V(...P.avamS));
  punta(O.hand_l, O.presa_l, V(...P.avamS));
  // gambe a bicicletta (sotto l'acqua: non si vedono, ma tengono il bacino al suo posto)
  punta(O.thigh_l, O.calf_l, V(0.5, -0.45, 0.75)); punta(O.calf_l, O.foot_l, V(0.45, -0.85, -0.25));
  punta(O.thigh_r, O.calf_r, V(-0.55, -0.7, 0.45)); punta(O.calf_r, O.foot_r, V(-0.1, -0.65, -0.75));
  gira(O.head, [0, 1, 0], P.testa); gira(O.head, [1, 0, 0], P.mento);
}
function texPalla() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#ffd23f'; x.fillRect(0, 0, 512, 256);
  // spicchi: strisce blu curve (come la palla del gioco)
  x.strokeStyle = '#1d4fd6'; x.lineWidth = 34;
  for (const off of [0, 170, 340]) { x.beginPath(); for (let i = 0; i <= 512; i += 8) { const y = 128 + Math.sin((i + off) / 512 * Math.PI * 2) * 70; i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); }
  x.strokeStyle = 'rgba(10,36,72,.75)'; x.lineWidth = 4;
  for (const off of [0, 170, 340]) for (const d of [-19, 19]) { x.beginPath(); for (let i = 0; i <= 512; i += 8) { const y = 128 + d + Math.sin((i + off) / 512 * Math.PI * 2) * 70; i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
window.disegna = async ({ glb, largo, alto, P }) => {
  const canvas = document.getElementById('c'); canvas.width = largo; canvas.height = alto;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(largo, alto, false); renderer.setClearColor(0x000000, 0); renderer.localClippingEnabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scena = new THREE.Scene();
  // luci da arena: cielo azzurro, luce principale calda davanti in alto, controluce azzurro dietro (bordo luminoso del corpo)
  scena.add(new THREE.HemisphereLight(0xcfe8ff, 0x0b2a55, 1.5));
  const chiave = new THREE.DirectionalLight(0xfff1dc, 3.2); chiave.position.set(-2.5, 4, 5); scena.add(chiave);
  const contro = new THREE.DirectionalLight(0x7fd4ff, 3.4); contro.position.set(3, 2.5, -4); scena.add(contro);
  const contro2 = new THREE.DirectionalLight(0x9fd8ff, 1.6); contro2.position.set(-3.5, 1.5, -3); scena.add(contro2);
  const gltf = await new GLTFLoader().parseAsync(daBase64(glb), ''); scena.add(gltf.scene); gltf.scene.updateMatrixWorld(true);
  let maglia = null; const O = {}; gltf.scene.traverse(o => { if (o.isSkinnedMesh) maglia = o; if (o.isBone) O[o.name] = o; });
  maglia.frustumCulled = false;
  posa(O, P); gltf.scene.updateMatrixWorld(true); maglia.skeleton.update();
  // pelo dell'acqua: poco sotto il petto; tutto ciò che sta sotto non si disegna (lo copre l'acqua del menu)
  const bac = O.pelvis.getWorldPosition(new THREE.Vector3()), pet = O.spine_03.getWorldPosition(new THREE.Vector3());
  const pelo = bac.y + (pet.y - bac.y) * P.pelo;
  const taglio = new THREE.Plane(new THREE.Vector3(0, 1, 0), -pelo);
  maglia.material.clippingPlanes = [taglio]; maglia.material.needsUpdate = true;
  // palla nella mano destra
  const mano = O.hand_r.getWorldPosition(new THREE.Vector3()), presa = O.presa_r.getWorldPosition(new THREE.Vector3());
  const palla = new THREE.Mesh(new THREE.SphereGeometry(0.115, 48, 32), new THREE.MeshStandardMaterial({ map: texPalla(), roughness: 0.55 }));
  // palla nel palmo: al centro della mano, un po' dietro le dita (viste da davanti le dita la tengono)
  palla.position.copy(mano).lerp(presa, 0.75).add(V(...P.palla));
  palla.rotation.set(0.5, 0.8, 0.3); scena.add(palla);
  const bordoPalla = new THREE.Mesh(new THREE.SphereGeometry(0.115 * 1.06, 32, 20), new THREE.MeshBasicMaterial({ color: 0x0a2448, side: THREE.BackSide }));
  bordoPalla.position.copy(palla.position); scena.add(bordoPalla);
  // schizzi: gocce attorno al busto sul pelo dell'acqua e qualcuna che cade dalla palla e dal braccio
  const goccia = new THREE.SphereGeometry(1, 12, 8), matG = new THREE.MeshStandardMaterial({ color: 0xdff4ff, emissive: 0x3d9be0, emissiveIntensity: 0.25, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.7 });
  const centro = bac.clone(); centro.y = pelo;
  for (let i = 0; i < P.gocce; i++) {
    const a = caso() * Math.PI * 2, r = 0.24 + caso() * 0.38, h = Math.pow(caso(), 2.2) * 0.3, s = 0.004 + caso() * 0.012 * (1 - h);
    const g = new THREE.Mesh(goccia, matG); g.position.set(centro.x + Math.cos(a) * r, pelo + h, centro.z + Math.sin(a) * r * 0.75); g.scale.set(s, s * (1 + h * 4), s); scena.add(g);
  }
  for (let i = 0; i < 12; i++) { const g = new THREE.Mesh(goccia, matG); const t = caso();
    g.position.copy(palla.position).add(V((caso() - 0.5) * 0.35, -0.08 - t * 0.6, (caso() - 0.5) * 0.25)); g.scale.setScalar(0.004 + caso() * 0.009); scena.add(g); }
  // inquadratura: busto e palla
  const cima = palla.position.clone(); const c = new THREE.Vector3((cima.x + bac.x) / 2, (cima.y + pelo) / 2 - 0.02, (cima.z + bac.z) / 2);
  const cam = new THREE.PerspectiveCamera(P.fov, largo / alto, 0.05, 100), d = V(...P.vista).normalize();
  cam.position.copy(c).addScaledVector(d, P.distanza); cam.lookAt(c.clone().add(V(...P.mira))); renderer.render(scena, cam);
  return { pelo: +pelo.toFixed(3) };
};
window.pronto = true;
