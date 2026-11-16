// Interfaccia del replay: riceve soltanto i dati salvati con il gol.
// Il gesto non si ricava dal nome o dalle caratteristiche del marcatore.
import { bandiera } from './dati/bandiere.js';
import { LOGO } from './logo.js';

const FIRME = new Set(['BEDUINA', 'SCHIZZO', 'COLONNELLO', 'ROVESCIATA', 'SCIARPA', 'TIRO DA FUORI', 'RIGORE', 'GOL']);
let ui = null, visibile = false, salto = null, saltoRichiesto = false, focusPrima = null;
let avanzamento = -1;

function richiediSalto() {
  if (!visibile || saltoRichiesto || !salto) return;
  saltoRichiesto = true;
  salto();
}

function creaUI() {
  if (ui) return ui;
  const el = document.createElement('div');
  el.id = 'replayOverlay';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Replay del gol');
  el.innerHTML = `
    <div class="replay-testa">
      <span class="replay-badge"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4 1 10l6 6V4Zm9 0-6 6 6 6V4Z" fill="currentColor"/></svg>REPLAY</span>
      <div class="replay-score" aria-label="Punteggio"><span id="replaySquadra"></span><b id="replayPunteggio"></b><span id="replayAvversaria"></span></div>
    </div>
    <div class="replay-marchio" aria-hidden="true">${LOGO()}</div>
    <div class="replay-fascia">
      <div class="replay-marcatore" aria-live="polite" aria-atomic="true">
        <div class="replay-identita"><span id="replayBandiera" aria-hidden="true"></span><span id="replayNazione"></span><b id="replayNumero"></b><strong id="replayNome"></strong></div>
        <b id="replayFirma"></b>
      </div>
      <div id="replayProgresso" class="replay-progresso" role="progressbar" aria-label="Avanzamento replay" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
    </div>
    <button type="button" id="replaySalta" aria-label="Salta il replay">Salta<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 4 7 6-7 6V4Zm9 0h2v12h-2V4Z" fill="currentColor"/></svg></button>`;
  document.body.appendChild(el);
  ui = { el, salta: el.querySelector('#replaySalta'), progresso: el.querySelector('#replayProgresso') };
  for (const id of ['Squadra', 'Punteggio', 'Avversaria', 'Bandiera', 'Nazione', 'Numero', 'Nome', 'Firma']) ui[id] = el.querySelector('#replay' + id);
  ui.salta.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    richiediSalto();
  });
  el.addEventListener('keydown', e => {
    // La pausa resta quella della partita, gestita da input.js anche nel dialogo.
    if (e.code === 'Escape' || e.code === 'KeyP') return;
    e.stopPropagation();
    if (e.code === 'Tab') {
      e.preventDefault();
      ui.salta.focus({ preventScroll: true });
    } else if (e.code !== 'Space' && e.code !== 'Enter') e.preventDefault();
    // Spazio e Invio mantengono il click nativo del pulsante, senza arrivare al gioco.
  });
  // Il fondale intercetta anche i tocchi lontani da Salta: non raggiungono il joystick.
  for (const tipo of ['pointerdown', 'pointerup', 'pointermove', 'touchstart', 'touchend', 'touchcancel'])
    el.addEventListener(tipo, e => e.stopPropagation(), { passive: true });
  el.addEventListener('touchmove', e => { e.preventDefault(); e.stopPropagation(); }, { passive: false });
  el.addEventListener('click', e => e.stopPropagation());
  // Protegge anche un eventuale focus spostato dal browser fuori dal dialogo.
  window.addEventListener('keydown', e => {
    if (!visibile || el.contains(e.target) || e.code === 'Escape' || e.code === 'KeyP') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    ui.salta.focus({ preventScroll: true });
  }, true);
  return ui;
}

// info: { squadra (marcatore), numero, nome, firma, casa, ospite, punteggio, avversaria }.
// firma deve essere il gesto registrato sul tiro; in sua assenza compare soltanto GOL.
export function mostraReplay(info = {}) {
  const u = creaUI();
  const squadra = String(info.squadra || '').trim().toUpperCase();
  const firma = String(info.firma || '').trim().toUpperCase();
  if (!visibile) focusPrima = document.activeElement;
  u.Squadra.textContent = String(info.casa || squadra).trim().toUpperCase();
  u.Punteggio.textContent = String(info.punteggio ?? '');
  u.Avversaria.textContent = String(info.ospite || info.avversaria || '').trim().toUpperCase();
  u.Bandiera.innerHTML = /^[A-Z]{3}$/.test(squadra) ? bandiera(squadra, 'replay-bandiera') : '';
  u.Nazione.textContent = squadra;
  u.Numero.textContent = info.numero == null || info.numero === '' ? '' : '#' + info.numero;
  u.Nome.textContent = String(info.nome || '');
  u.Nome.title = String(info.nome || '');
  u.Firma.textContent = FIRME.has(firma) ? firma : 'GOL';
  u.el.dataset.firma = u.Firma.textContent;
  saltoRichiesto = false;
  visibile = true;
  avanzamento = -1;
  u.el.hidden = false;
  document.body.classList.add('replay');
  aggiornaReplay(0);
  // input.js azzera anche i tasti e i tocchi già premuti entrando nel dialogo.
  u.salta.focus({ preventScroll: true });
}

// Progresso normalizzato 0..1; la barra non produce annunci a ogni fotogramma.
export function aggiornaReplay(progresso) {
  if (!ui || !visibile) return;
  const n = Number(progresso), p = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
  ui.progresso.style.setProperty('--replay-progresso', String(p));
  const percento = Math.round(p * 100);
  if (percento !== avanzamento) {
    avanzamento = percento;
    ui.progresso.setAttribute('aria-valuenow', String(percento));
  }
}

export function nascondiReplay() {
  visibile = false;
  saltoRichiesto = false;
  document.body.classList.remove('replay');
  if (!ui) return;
  const focusNelReplay = ui.el.contains(document.activeElement);
  ui.el.hidden = true;
  if (focusNelReplay) {
    if (focusPrima?.isConnected && focusPrima !== document.body && focusPrima.getClientRects().length) focusPrima.focus({ preventScroll: true });
    else ui.salta.blur();
  }
  focusPrima = null;
}

export function registraSalto(fn) {
  salto = typeof fn === 'function' ? fn : null;
}
