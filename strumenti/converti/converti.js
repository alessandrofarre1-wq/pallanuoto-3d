// Gira dentro il browser (avviato da strumenti/converti-modello.mjs): legge i file FBX di Mixamo
// e produce un unico file GLB con il corpo e le animazioni.
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const daBase64 = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
const aBase64 = buf => { let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };

window.converti = async ({ modello, animazioni }) => {
  const loader = new FBXLoader();
  const radice = loader.parse(daBase64(modello), '');
  const info = { maglie: [], ossa: 0, animazioni: [] };
  const maglie = [];
  radice.traverse(o => { if (o.isSkinnedMesh) maglie.push(o); });
  for (const m of maglie) info.maglie.push({ nome: m.name, triangoli: (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3, ossa: m.skeleton.bones.length, attributi: Object.keys(m.geometry.attributes).join(',') });
  // le maglie (superficie e giunture del manichino) usano lo stesso scheletro: si fondono in una sola
  const stesse = maglie.every(m => m.skeleton.bones.length === maglie[0].skeleton.bones.length && m.skeleton.bones.every((b, i) => b === maglie[0].skeleton.bones[i] || b.name === maglie[0].skeleton.bones[i].name));
  info.stessoScheletro = stesse;
  let corpo = maglie[0];
  if (maglie.length > 1 && stesse) {
    const geo = maglie.map((m, k) => { const g = m.geometry.clone(); for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'skinIndex', 'skinWeight'].includes(n)) g.deleteAttribute(n);
      // canale "zona": 0 = superficie del corpo, 1 = giunture
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2).fill(k), 2)); g.morphAttributes = {}; return g; });
    let unita = BufferGeometryUtils.mergeGeometries(geo, false);
    // superficie liscia: si uniscono i punti che coincidono (anche dove il modello aveva spigoli vivi) e si ricalcolano le normali
    unita.deleteAttribute('normal'); unita.deleteAttribute('uv');
    unita = BufferGeometryUtils.mergeVertices(unita, 0.01); unita.computeVertexNormals();
    corpo = new THREE.SkinnedMesh(unita, new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    corpo.name = 'Corpo'; corpo.bind(maglie[0].skeleton, maglie[0].bindMatrix);
    maglie[0].parent.add(corpo); for (const m of maglie) m.parent.remove(m);
  }
  info.ossa = corpo.skeleton.bones.length;
  info.nomiOssa = corpo.skeleton.bones.map(b => b.name).join(' ');
  info.scala = radice.scale.toArray(); 
  const bb = new THREE.Box3().setFromObject(radice); info.misure = [bb.min.toArray().map(v => +v.toFixed(1)), bb.max.toArray().map(v => +v.toFixed(1))];
  const clip = [];
  for (const [nome, b64] of Object.entries(animazioni)) {
    const o = loader.parse(daBase64(b64), ''); const c = o.animations[0]; c.name = nome;
    // si tengono le rotazioni di tutte le ossa e lo spostamento del solo bacino
    c.tracks = c.tracks.filter(t => (t.name.endsWith('.quaternion') && !/Hand(Thumb|Index|Middle|Ring|Pinky)|ToeBase/.test(t.name)) || t.name === 'mixamorigHips.position');   // niente dita: non si vedono e costano
    info.animazioni.push({ nome, durata: +c.duration.toFixed(2), tracce: c.tracks.length, fotogrammi: c.tracks[0].times.length });
    clip.push(c);
  }
  const glb = await new GLTFExporter().parseAsync(radice, { binary: true, animations: clip, onlyVisible: false });
  return { info, glb: aBase64(glb) };
};
window.pronto = true;
