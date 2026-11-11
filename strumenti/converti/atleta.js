// Gira dentro il browser (avviato da strumenti/costruisci-atleta.mjs): riceve punti, triangoli, ossa e pesi già calcolati
// e produce il file .glb del corpo e le immagini .jpg della pelle (con occhi, sopracciglia e barba disegnati sopra).
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const aBase64 = buf => { let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const immagine = b64 => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = 'data:image/png;base64,' + b64; });

window.costruisci = async L => {
  let glb = null;
  if (!L.soloPelli) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(L.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(L.nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(L.uv.map((x, i) => i % 2 ? 1 - x : x), 2));      // nei file .glb l'origine dell'immagine è in alto
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(L.si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(L.sw, 4));
  g.setAttribute('_costume', new THREE.Float32BufferAttribute(L.cost, 1));
  g.setIndex(L.ind);
  // ossa senza rotazioni: solo la posizione rispetto al genitore
  const ossa = L.ossa.map(o => { const b = new THREE.Bone(); b.name = o.nome; return b; });
  L.ossa.forEach((o, i) => { const p = o.genitore >= 0 ? L.ossa[o.genitore].pos : [0, 0, 0]; ossa[i].position.set(o.pos[0] - p[0], o.pos[1] - p[1], o.pos[2] - p[2]); if (o.genitore >= 0) ossa[o.genitore].add(ossa[i]); });
  const maglia = new THREE.SkinnedMesh(g, new THREE.MeshStandardMaterial({ color: 0xffffff })); maglia.name = 'corpo';
  const radice = new THREE.Group(); radice.name = 'atleta'; radice.add(ossa[0]); radice.add(maglia);
  radice.updateMatrixWorld(true); maglia.bind(new THREE.Skeleton(ossa));
  glb = aBase64(await new GLTFExporter().parseAsync(radice, { binary: true, onlyVisible: false }));
  }
  // pelli
  const pelli = [];
  for (const P of L.pelli) {
    const c = document.createElement('canvas'); c.width = c.height = L.lato; const x = c.getContext('2d');
    x.drawImage(await immagine(P.pelle), 0, 0, L.lato, L.lato);
    const px = ([u, v]) => [u * L.lato, (1 - v) * L.lato];
    // barba corta: tanti puntini scuri sfumati
    if (P.barba.length) {      // disegnata a parte, sfumata e poi stesa leggera sulla pelle: ombra di barba, non una macchia
      const m = document.createElement('canvas'); m.width = m.height = L.lato; const y = m.getContext('2d'), r = L.lato / 1024;
      y.fillStyle = '#3a2a1f'; for (const p of P.barba) { const [a, b] = px(p); y.beginPath(); y.arc(a, b, 9 * r, 0, 7); y.fill(); }
      x.save(); x.filter = `blur(${5 * r}px)`; x.globalAlpha = 0.5; x.drawImage(m, 0, 0); x.restore();
    }
    // sopracciglia
    x.fillStyle = 'rgba(38,27,20,0.22)'; for (const p of L.uvSopracciglia) { const [a, b] = px(p); x.beginPath(); x.arc(a, b, L.lato / 512 * 1.3, 0, 7); x.fill(); }
    // occhi nel riquadro libero
    const lato = L.libero.lato * L.lato; x.drawImage(await immagine(P.occhi), L.libero.u * L.lato, (1 - L.libero.v) * L.lato - lato, lato, lato);
    pelli.push({ nome: P.nome, jpg: c.toDataURL('image/jpeg', 0.86).split(',')[1] });
  }
  return { glb, pelli };
};
window.pronto = true;
