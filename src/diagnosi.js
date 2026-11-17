// Diagnosi a schermo (v0.51), solo con «?diagnosi» nell'indirizzo: Ale vede su iPhone i giocatori che nuotano
// con i piedi in avanti, mentre in Chromium (prove automatiche) i corpi sono giusti. Qui si misura SUL TELEFONO,
// per ogni giocatore disteso che nuota: fronte della fisica (fx,fz), corpo disegnato (testa meno bacino, ossa vere)
// e velocità. Solo lettura: nessun numero casuale, nessuna modifica al gioco.
import { allPlayers, game } from './stato.js';

const attiva = new URLSearchParams(location.search).has('diagnosi');
let el = null, t = 0, tot = null;
const vuoto = () => ({ campioni: 0, fisica: 0, disegno: 0, disegnoFisica: 0, radice: 0 });
const A = { x: 0, y: 0, z: 0 }, B = { x: 0, y: 0, z: 0 };
function posizione(osso, out) { osso.updateWorldMatrix(true, false); const e = osso.matrixWorld.elements; out.x = e[12]; out.y = e[13]; out.z = e[14]; }

export function aggiornaDiagnosi(dt) {
  if (!attiva) return;
  if (!el) {
    el = document.createElement('div');
    el.id = 'diagnosi';
    el.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 40px);transform:translateX(-50%);z-index:60;pointer-events:none;' +
      'background:#07131dd9;color:#fff;font:600 11px/1.35 ui-monospace,monospace;padding:6px 9px;border-radius:6px;white-space:pre';
    document.body.appendChild(el);
    tot = vuoto();
  }
  if (game.state === 'play') {
    for (const p of allPlayers) {
      if (p.excluded || p.uscendo || p.isGK) continue;
      const sp = Math.hypot(p.vx, p.vz);
      if (sp < 0.5 || (p.oriz || 0) < 0.5) continue;
      const O = p.mesh?.corpo?.ossa; if (!O) continue;
      posizione(O.testa, A); posizione(O.bacino, B);
      const bx = A.x - B.x, bz = A.z - B.z, L = Math.hypot(bx, bz) || 1;
      tot.campioni++;
      if (p.fx * p.vx + p.fz * p.vz < 0) tot.fisica++;
      if (bx * p.vx + bz * p.vz < 0) tot.disegno++;
      if ((bx * p.fx + bz * p.fz) / L < 0) tot.disegnoFisica++;
      const ry = Math.atan2(-p.fz, p.fx), d = Math.atan2(Math.sin(p.mesh.g.rotation.y - ry), Math.cos(p.mesh.g.rotation.y - ry));
      if (Math.abs(d) > 0.5) tot.radice++;
    }
  }
  t += dt;
  if (t < 0.25) return;
  t = 0;
  const pc = n => tot.campioni ? (100 * n / tot.campioni).toFixed(1) + '%' : '-';
  const motore = /CriOS|Chrome/.test(navigator.userAgent) ? 'Chrome' : /AppleWebKit/.test(navigator.userAgent) ? 'Safari/WebKit' : 'altro';
  el.textContent = `DIAGNOSI v${__VERSIONE__} · ${motore}\n` +
    `controlli: ${tot.campioni}\n` +
    `A fisica contro moto:  ${tot.fisica} (${pc(tot.fisica)})\n` +
    `B corpo contro moto:   ${tot.disegno} (${pc(tot.disegno)})\n` +
    `C corpo contro fisica: ${tot.disegnoFisica} (${pc(tot.disegnoFisica)})\n` +
    `D rotazione radice:    ${tot.radice}`;
}
