// Pannello di controllo della fisica della palla: si accende con ?fisica nell'indirizzo.
// Solo testo, aggiornato 10 volte al secondo; legge lo stato della palla e la diagnosi di palla.js, non cambia niente.
import { diagnosi, energia } from '../palla.js';
import { ball } from '../stato.js';
import { G } from '../costanti.js';
import { P } from './parametri.js';

const ATTIVO = typeof location !== 'undefined' && /[?&]fisica\b/.test(location.search);
let el = null, t = 0;
const n = (x, c = 2) => (Number.isFinite(x) ? x.toFixed(c) : '–');

export function aggiornaPannelloFisica(dt) {
  if (!ATTIVO) return;
  if (!el) {
    el = document.createElement('pre'); el.id = 'pannelloFisica';
    el.style.cssText = 'position:fixed;left:calc(var(--sl,0px) + 8px);bottom:calc(var(--sb,0px) + 8px);z-index:30;margin:0;padding:8px 10px;'
      + 'font:11px/1.35 ui-monospace,Menlo,monospace;color:#e8f3ff;background:rgba(6,21,47,.82);border:1px solid rgba(150,205,255,.35);border-radius:8px;pointer-events:none;white-space:pre';
    document.body.appendChild(el);
  }
  t += dt; if (t < 0.1) return; t = 0;
  const D = diagnosi, I = D.impatto, m = P.massa;
  const pesoN = m * G, archN = m * D.aGalleggia;
  el.textContent =
    `PALLA  ${ball.state}${ball.holder ? ' (in mano)' : ''}\n`
    + `velocità        ${n(D.v)} m/s\n`
    + `rotazione       ${n(D.w, 1)} rad/s\n`
    + `centro sull'acqua ${n(D.y, 3)} m\n`
    + `immersione h    ${n(D.h * 100, 1)} cm   volume ${n(D.volume * 1e6, 0)} cm³\n`
    + `forze  peso ${n(pesoN)} N  galleggia ${n(archN)} N\n`
    + `freni per passo ${n(D.freni[0], 3)} / ${n(D.freni[1], 3)} / ${n(D.freni[2], 3)}\n`
    + `energia         ${n(energia(ball))} J\n`
    + `ultimo impatto  ${I.n ? I.tipo + ' a ' + n(I.angolo, 0) + '°' : '–'}\n`
    + (I.n ? `  ${n(I.vOrizz, 1)} avanti, ${n(I.vVert, 1)} giù m/s; energia ${n(I.prima)} → ${n(I.dopo)} J` : '');
}
