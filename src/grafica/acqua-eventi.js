// Eventi corpo-acqua: ogni effetto d'acqua (gocce, increspature, schiuma, scie) nasce da un evento del movimento e passa da qui,
// dove le regole di visibilità lo limitano. Rapporto: https://claude.ai/artifact/1k9M3FJbkdVyGzd7ihFWLz
//
// Eventi: bracciata (mano che entra in acqua), appoggio (mano libera nel tiro), elevazione e ricaduta del busto, lotta, parata,
// palla (impatto e schizzo), scia (chi nuota, a distanza percorsa). La bicicletta non fa gocce: è sott'acqua.
// Regole di visibilità: zona protetta attorno alla palla, meno effetti secondari quando ci sono tanti giocatori vicini alla palla,
// tetti a numero, dimensione, opacità e durata. Solo disegno: si usa rndGrafica, mai il caso del gioco.
import * as THREE from 'three';
import { ball, allPlayers } from '../stato.js';
import { clamp, rndGrafica } from '../costanti.js';
import { scene, spawnFoam } from './scena.js';

export const LIMITI = {
  gocceMax: 96,          // gocce attive in tutto
  gocceEvento: 24,       // gocce per un solo evento
  dimGoccia: [0.035, 0.08],   // metri
  alfaGoccia: 0.5,
  vitaGoccia: 0.8,       // secondi al massimo
  zonaPalla: 0.6,        // metri: entro questa distanza dalla palla gli effetti si attenuano...
  attenuaPalla: 0.3,     // ...fino al 30% sopra la palla
  affollati: 5,          // giocatori entro raggioAffollato dalla palla oltre i quali gli effetti secondari si dimezzano
  raggioAffollato: 3,
  attenuaAffollato: 0.5,
};
const PRIMARI = new Set(['palla', 'parata']);      // gli effetti che raccontano la palla non si dimezzano per l'affollamento
let affollato = false;

// da chiamare una volta per fotogramma: quanti giocatori stanno vicino alla palla
export function aggiornaVisibilita() {
  let n = 0;
  for (const p of allPlayers) if (!p.excluded && Math.hypot(p.x - ball.x, p.z - ball.z) < LIMITI.raggioAffollato) n++;
  affollato = n >= LIMITI.affollati;
}
// quanto resta di un effetto nato in (x,z)
export function attenuazione(x, z, tipo) {
  let k = 1;
  if (!PRIMARI.has(tipo)) {
    const d = Math.hypot(x - ball.x, z - ball.z);
    if (d < LIMITI.zonaPalla) k *= LIMITI.attenuaPalla + (1 - LIMITI.attenuaPalla) * d / LIMITI.zonaPalla;
  }
  if (affollato && !PRIMARI.has(tipo)) k *= LIMITI.attenuaAffollato;
  return k;
}

// ---------- gocce in rilievo: un solo oggetto disegnato (InstancedMesh), pool fisso, nessuna allocazione per fotogramma ----------
const N = LIMITI.gocceMax;
const gocce = [];
for (let i = 0; i < N; i++) gocce.push({ vita: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, dim: 0 });
const aAlfa = new THREE.InstancedBufferAttribute(new Float32Array(N), 1);
const aDim = new THREE.InstancedBufferAttribute(new Float32Array(N), 1);
export const gocceMesh = (() => {
  const g = new THREE.PlaneGeometry(2, 2); g.setAttribute('aAlfa', aAlfa); g.setAttribute('aDim', aDim);
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
    // goccia rivolta sempre alla telecamera: il centro viene dalla copia, la forma dal quadrato attorno
    vertexShader: `attribute float aAlfa; attribute float aDim; varying float vA; varying vec2 vUv;
      void main(){ vA=aAlfa; vUv=uv; vec4 c=viewMatrix*vec4(instanceMatrix[3].xyz,1.0); c.xy+=position.xy*aDim; gl_Position=projectionMatrix*c; }`,
    fragmentShader: `varying float vA; varying vec2 vUv;
      void main(){ vec2 d=vUv*2.0-1.0; float r=length(d); if(r>1.0) discard;
        float a=vA*(1.0-smoothstep(0.55,1.0,r)); vec3 c=mix(vec3(0.80,0.93,1.0),vec3(1.0),smoothstep(0.6,0.0,length(d-vec2(-0.3,0.35))));
        gl_FragColor=vec4(c,a);
        #include <colorspace_fragment>
      }` });
  const im = new THREE.InstancedMesh(g, m, N); im.frustumCulled = false; im.renderOrder = 2;
  const zero = new THREE.Matrix4().makeTranslation(0, -50, 0); for (let i = 0; i < N; i++) im.setMatrixAt(i, zero);
  scene.add(im); return im;
})();
let gi = 0;
export function gocceAttive() { let n = 0; for (const g of gocce) if (g.vita > 0) n++; return n; }
// n gocce dal punto (x,y,z): velocità verso l'alto vSu, in fuori vFuori, spinta lungo (dx,dz)
function lancia(n, x, y, z, vSu, vFuori, dx, dz, dim) {
  n = Math.min(LIMITI.gocceEvento, Math.round(n));
  for (let i = 0; i < n; i++) {
    const g = gocce[gi = (gi + 1) % N], a = rndGrafica() * 6.2832, r = 0.4 + 0.6 * rndGrafica();
    g.x = x + Math.cos(a) * 0.05; g.y = Math.max(0.02, y); g.z = z + Math.sin(a) * 0.05;
    g.vx = Math.cos(a) * vFuori * r + dx * (0.6 + 0.6 * rndGrafica()); g.vz = Math.sin(a) * vFuori * r + dz * (0.6 + 0.6 * rndGrafica());
    g.vy = vSu * (0.6 + 0.5 * rndGrafica());
    g.max = g.vita = LIMITI.vitaGoccia * (0.6 + 0.4 * rndGrafica());
    g.dim = clamp(dim * (0.7 + 0.6 * rndGrafica()), LIMITI.dimGoccia[0], LIMITI.dimGoccia[1]);
  }
}
const _m = new THREE.Matrix4();
export function aggiornaGocce(dt) {
  for (let i = 0; i < N; i++) {
    const g = gocce[i]; let al = 0;
    if (g.vita > 0) {
      g.vita -= dt; g.vy -= 9.8 * dt; const f = Math.exp(-1.2 * dt); g.vx *= f; g.vz *= f;
      g.x += g.vx * dt; g.y += g.vy * dt; g.z += g.vz * dt;
      // ricade in acqua: nasce una piccola increspatura (catena spruzzo → schiuma, Chentanez e Müller 2010)
      if (g.y <= 0) { g.vita = 0; if (rndGrafica() < 0.35) spawnFoam(g.x, g.z, 0.05, 0.35); }
      else al = LIMITI.alfaGoccia * Math.min(1, g.vita / g.max * 2.5);
    }
    _m.makeTranslation(g.x, al > 0 ? g.y : -50, g.z); gocceMesh.setMatrixAt(i, _m);
    aAlfa.array[i] = al; aDim.array[i] = g.dim;
  }
  gocceMesh.instanceMatrix.needsUpdate = true; aAlfa.needsUpdate = true; aDim.needsUpdate = true;
}

// ---------- eventi ----------
// tipo, punto (x,y,z in metri), intensità 0..1, direzione del moto (dx,dz) facoltativa; radente = palla che sfiora l'acqua
export function evento(tipo, x, y, z, intensita, dx = 0, dz = 0, radente = false) {
  const k = clamp(intensita, 0, 1) * attenuazione(x, z, tipo);
  if (k < 0.03) return;
  switch (tipo) {
    case 'bracciata':      // mano che rientra: poche gocce basse, increspatura piccola
      lancia(2 + 5 * k, x, 0.04, z, 1.0 + 1.4 * k, 0.5, dx * 0.4, dz * 0.4, 0.04 + 0.02 * k);
      spawnFoam(x, z, 0.08 + 0.05 * k, 0.45); break;
    case 'appoggio':       // braccio libero che si appoggia sull'acqua nel tiro: solo increspatura
      spawnFoam(x, z, 0.08 + 0.04 * k, 0.45); break;
    case 'elevazione':     // il busto esce: anello e qualche goccia ai lati
      lancia(3 + 5 * k, x, 0.05, z, 0.8 + 1.0 * k, 1.1, 0, 0, 0.035);
      spawnFoam(x, z, 0.25 + 0.15 * k, 0.7); break;
    case 'ricaduta':       // il busto ricade dopo il tiro: schizzo verticale breve e anello
      lancia(5 + 9 * k, x, 0.05, z, 1.4 + 1.6 * k, 0.9, 0, 0, 0.04 + 0.01 * k);
      spawnFoam(x, z, 0.3 + 0.2 * k, 0.9); break;
    case 'lotta':          // acqua mossa tra due corpi
      lancia(1 + 3 * k, x, 0.05, z, 0.8 + 0.8 * k, 0.8, 0, 0, 0.03);
      spawnFoam(x, z, 0.12 + 0.08 * k, 0.5); break;
    case 'parata':         // nel punto delle mani del portiere
      lancia(4 + 8 * k, x, Math.min(y, 0.4), z, 1.2 + 1.2 * k, 1.0, 0, 0, 0.04);
      spawnFoam(x, z, 0.25 + 0.15 * k, 0.8); break;
    case 'palla': {        // impatto della palla: più forte arriva, più acqua; radente = spruzzo allungato in avanti e basso
      const l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l;
      if (radente) lancia(3 + 11 * k, x, 0.03, z, 0.6 + 1.2 * k, 0.35, ux * (1.5 + 3 * k), uz * (1.5 + 3 * k), 0.035 + 0.015 * k);
      else lancia(3 + 9 * k, x, 0.03, z, 1.0 + 2.0 * k, 0.8, 0, 0, 0.04);
      const nf = Math.min(6, 2 + Math.round(4 * k));
      for (let i = 0; i < nf; i++) { const s = radente ? i / nf * 0.9 : 0; spawnFoam(x - ux * s + (rndGrafica() - 0.5) * 0.25, z - uz * s + (rndGrafica() - 0.5) * 0.25, 0.12 + 0.12 * k, 0.5 + 0.3 * k); }
      break; }
    default: break;
  }
}
