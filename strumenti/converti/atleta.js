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
    const px = ([u, v]) => [u * L.lato, (1 - v) * L.lato];
    if (P.cartoon) {
      // PELLE CARTOON: della foto resta solo l'andamento morbido dei colori (labbra, capezzoli, ombre larghe dei muscoli);
      // rughe, pori e peli spariscono; il tono viene schiarito e scaldato. Occhi disegnati: iride grande, pupilla, riflesso.
      const foto = await immagine(P.pelle), r = L.lato / 1024;
      x.filter = `blur(${7 * r}px)`; x.drawImage(foto, 0, 0, L.lato, L.lato); x.filter = 'none';
      const d = x.getImageData(0, 0, L.lato, L.lato).data; let R = 0, G = 0, B = 0, n = 0;
      for (let k = 0; k < d.length; k += 64) { R += d[k]; G += d[k + 1]; B += d[k + 2]; n++; }
      R /= n; G /= n; B /= n; const m = Math.max(R, G, B), f = Math.min(1.35, 232 / m);      // schiarita: i toni chiari arrivano a un abbronzato caldo
      const tono = [Math.min(255, R * f * 1.03), Math.min(255, G * f * 0.97), Math.min(255, B * f * 0.9)];
      // labbra: dove la foto sfocata è più rossa della media (nella zona del viso) si stende un colore di labbra pieno
      { const img = x.getImageData(0, 0, L.lato, L.lato), q = img.data, rosso = R - G, lab = [];
        for (let yy = 0; yy < L.lato; yy++) for (let xx = Math.round(L.lato * 0.62); xx < L.lato; xx++) { const k = (yy * L.lato + xx) * 4; if (yy / L.lato > 0.17 && yy / L.lato < 0.85 && q[k] - q[k + 1] > rosso + 26) lab.push(k); }
        window.__labbra = lab; }
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 0.9; x.fillStyle = `rgb(${tono.map(Math.round)})`; x.fillRect(0, 0, L.lato, L.lato); x.globalAlpha = 1;
      { const img = x.getImageData(0, 0, L.lato, L.lato), q = img.data, sc = Math.min(1, m / 200); for (const k of window.__labbra) { q[k] = q[k] * 0.35 + 196 * sc * 0.65; q[k + 1] = q[k + 1] * 0.35 + 108 * sc * 0.65; q[k + 2] = q[k + 2] * 0.35 + 96 * sc * 0.65; } x.putImageData(img, 0, 0); }
      const lato = L.libero.lato * L.lato, ox = L.libero.u * L.lato, oy = (1 - L.libero.v) * L.lato - lato;
      x.fillStyle = '#fbfbf8'; x.fillRect(ox, oy, lato, lato);
      const iride = { brown: ['#7a4a22', '#4a2a10'], blue: ['#3f86d8', '#1d4f94'], green: ['#4f9a58', '#2a6233'] }[P.coloreOcchi || 'brown'];
      for (const [cx, cy] of [[0.29, 0.71], [0.705, 0.30]]) {
        const a = ox + cx * lato, b = oy + cy * lato;
        x.fillStyle = iride[1]; x.beginPath(); x.arc(a, b, lato * 0.118, 0, 7); x.fill();
        x.fillStyle = iride[0]; x.beginPath(); x.arc(a, b, lato * 0.1, 0, 7); x.fill();
        x.fillStyle = '#0c0a0a'; x.beginPath(); x.arc(a, b, lato * 0.052, 0, 7); x.fill();
        x.fillStyle = '#ffffff'; x.beginPath(); x.arc(a - lato * 0.032, b - lato * 0.036, lato * 0.022, 0, 7); x.fill();
      }
      pelli.push({ nome: P.nome, jpg: c.toDataURL('image/jpeg', 0.9).split(',')[1] });
      continue;
    }
    x.drawImage(await immagine(P.pelle), 0, 0, L.lato, L.lato);
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
