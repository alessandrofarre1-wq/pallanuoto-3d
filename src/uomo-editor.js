// Sezione «Uomo in più» (v0.44): scelta di massimo 3 schemi dalla libreria e creazione di schemi nuovi a fasi.
// Stessa lavagna dell'editor delle strategie (coordinate x/y uguali), con i 6 posti trascinabili e la fase precedente in trasparenza.
import { DURATE, MAX_FASI, MAX_SCELTI, RUOLI_UP, eliminaPersonale, ePalo, nuovoId, salvaPersonale, salvaScelti, scelti, tutti, validaUomo, LIBRERIA } from './uomo-in-piu.js';

const $ = id => document.getElementById(id);
const x = z => 300 + z * 29.8, y = d => 28 + d * 29;
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let bozza = null, faseI = 0, ruolo = 1, trascina = null, navigazione = null, pronto = false;
const copia = v => JSON.parse(JSON.stringify(v));

// ---------- disegni ----------
const fondo = (id = '') => `<rect x="23" y="20" width="554" height="316" rx="5" fill="#0f4456"/>
  <rect x="193.3" y="28" width="213.4" height="58" fill="#f57c7620"/><path d="M23 86H577" stroke="#f4a293" stroke-opacity=".7" stroke-dasharray="5 6"/>
  <path d="M23 202H577" stroke="#f3db93" stroke-opacity=".5" stroke-dasharray="5 6"/><path d="M255.3 25V11H344.7V25" fill="#071a24" stroke="#f4f8f9" stroke-width="5"/>
  <defs><marker id="uFreccia${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#ffd67b"/></marker></defs>`;
// frecce dalla fase a alla fase b
const frecce = (a, b, id) => b.posti.map((p, i) => {
  const q = a.posti[i]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.3) return '';
  return `<path d="M${x(q[1])} ${y(q[0])}L${x(p[1])} ${y(p[0])}" stroke="#ffd67b" stroke-width="3" stroke-dasharray="7 6" fill="none" marker-end="url(#uFreccia${id})"/>`;
}).join('');
// schema in miniatura: posti finali, con le frecce di tutte le fasi
export function miniatura(s, id) {
  let h = `<svg viewBox="0 0 600 350" class="uomo-mini" aria-hidden="true">${fondo(id)}`;
  for (let k = 1; k < s.fasi.length; k++) h += frecce(s.fasi[k - 1], s.fasi[k], id);
  const fin = s.fasi[s.fasi.length - 1];
  fin.posti.forEach((p, i) => { h += `<circle cx="${x(p[1])}" cy="${y(p[0])}" r="20" fill="${ePalo(p) ? '#ffd67b' : '#57e2df'}" stroke="#062030" stroke-width="3"/><text x="${x(p[1])}" y="${y(p[0]) + 8}" text-anchor="middle" font-size="22" font-weight="800" fill="#062030">${i + 1}</text>`; });
  return h + '</svg>';
}

// ---------- elenco: scelti e libreria ----------
function disegnaElenco() {
  const sc = scelti(), ids = sc.map(s => s.id);
  $('uomoScelti').innerHTML = [0, 1, 2].map(i => sc[i]
    ? `<div class="uomo-slot pieno" data-scelto="${sc[i].id}"><span class="uomo-tasto">${i + 1}</span><b>${esc(sc[i].nome)}</b><button type="button" data-azione="togli" aria-label="Togli ${esc(sc[i].nome)}">✕</button></div>`
    : `<div class="uomo-slot"><span class="uomo-tasto">${i + 1}</span><span>Libero: scegli uno schema qui sotto</span></div>`).join('');
  $('uomoLista').innerHTML = tutti().map(s => {
    const preso = ids.includes(s.id), pieno = ids.length >= MAX_SCELTI;
    return `<article class="uomo-carta${preso ? ' presa' : ''}" data-uomo="${s.id}">${miniatura(s, s.id)}
      <div class="uomo-testo"><p class="soprattitolo">${s.personale ? 'TUO SCHEMA' : esc(s.fonte || 'LIBRERIA')} · ${s.fasi.length} ${s.fasi.length === 1 ? 'FASE' : 'FASI'}</p>
      <h3>${esc(s.nome)}</h3><p>${esc(s.descrizione || 'Schema personale.')}</p>
      <div class="uomo-bottoni"><button type="button" class="${preso ? 'azione-secondaria' : 'm-cta corta'}" data-azione="${preso ? 'togli' : 'scegli'}"${!preso && pieno ? ' disabled title="Hai già 3 schemi: togline uno"' : ''}>${preso ? 'Scelto ✓ (togli)' : 'Scegli'}</button>
      ${s.personale ? '<button type="button" class="azione-secondaria" data-azione="modifica">Modifica</button><button type="button" class="azione-secondaria" data-azione="elimina">Elimina</button>' : '<button type="button" class="azione-secondaria" data-azione="copia">Usa come base</button>'}</div></div></article>`;
  }).join('');
}
function azione(e) {
  const b = e.target.closest('[data-azione]'); if (!b) return;
  const carta = b.closest('[data-uomo],[data-scelto]'), id = carta && (carta.dataset.uomo || carta.dataset.scelto);
  const ids = scelti().map(s => s.id), s = tutti().find(q => q.id === id);
  if (b.dataset.azione === 'scegli' && ids.length < MAX_SCELTI) salvaScelti([...ids, id]);
  if (b.dataset.azione === 'togli') salvaScelti(ids.filter(q => q !== id));
  if (b.dataset.azione === 'elimina' && confirm(`Eliminare lo schema «${s.nome}»?`)) eliminaPersonale(id);
  if (b.dataset.azione === 'modifica' && s) return apriCrea(copia(s));
  if (b.dataset.azione === 'copia' && s) return apriCrea({ ...copia(s), id: nuovoId(), nome: `${s.nome} (mio)`, sigla: s.sigla || '', personale: true, fonte: '' });
  disegnaElenco();
}

// ---------- creazione ----------
function messaggio(t = '') { $('uomoMessaggio').textContent = t; $('uomoMessaggio').hidden = !t; }
function apriCrea(schema) {
  bozza = schema || { id: nuovoId(), nome: 'Il mio schema', descrizione: '', personale: true, fasi: copia(LIBRERIA[0].fasi) };
  faseI = 0; ruolo = 1; messaggio();
  $('uomoElenco').hidden = true; $('uomoCrea').hidden = false; $('uomoNome').value = bozza.nome; $('uomoSigla').value = bozza.sigla || '';
  disegnaCrea();
}
function chiudiCrea() { $('uomoCrea').hidden = true; $('uomoElenco').hidden = false; bozza = null; disegnaElenco(); }
function disegnaCrea() {
  const f = bozza.fasi[faseI], prima = faseI > 0 ? bozza.fasi[faseI - 1] : null;
  $('uomoFasi').innerHTML = bozza.fasi.map((_, i) => `<button type="button" role="tab" aria-selected="${i === faseI}" data-fase="${i}">Fase ${i + 1}</button>`).join('');
  $('uomoAggiungiFase').disabled = bozza.fasi.length >= MAX_FASI; $('uomoTogliFase').disabled = bozza.fasi.length <= 1;
  let h = fondo('e');
  if (prima) {
    h += frecce(prima, f, 'e');
    prima.posti.forEach(p => { h += `<circle cx="${x(p[1])}" cy="${y(p[0])}" r="18" fill="none" stroke="#bfeef0" stroke-opacity=".45" stroke-dasharray="4 4" stroke-width="2"/>`; });
  }
  f.posti.forEach((p, i) => {
    const n = i + 1;
    h += `<g data-uomo-ruolo="${n}" transform="translate(${x(p[1])} ${y(p[0])})" class="${n === ruolo ? 'scelto' : ''}" role="button" tabindex="${n === ruolo ? 0 : -1}" aria-label="${n} ${RUOLI_UP[i]}, ${p[0]} metri dalla porta, lato ${p[1]}">
      <circle r="36" fill="transparent"/><circle r="22" fill="${ePalo(p) ? '#ffd67b' : '#57e2df'}" stroke="${n === ruolo ? '#fff' : '#062030'}" stroke-width="${n === ruolo ? 4 : 3}"/>
      <text text-anchor="middle" dominant-baseline="central" font-size="22" font-weight="800" fill="#062030">${n}</text>${f.palla === n ? '<circle cx="17" cy="-17" r="9" fill="#ffd400" stroke="#062030" stroke-width="2"/>' : ''}</g>`;
  });
  $('uomoPiscina').innerHTML = h;
  $('uomoDurata').value = String(f.durata); $('uomoPalla').value = String(f.palla);
  $('uomoRuolo').textContent = `${ruolo} · ${RUOLI_UP[ruolo - 1]}: ${f.posti[ruolo - 1][0]} m dalla porta, lato ${f.posti[ruolo - 1][1]}${ePalo(f.posti[ruolo - 1]) ? ' · palo' : ''}`;
  $('uomoDurataNota').textContent = faseI === bozza.fasi.length - 1 ? 'Ultima fase: i compagni restano qui fino alla fine dell’uomo in più.' : 'Finita la durata, quando i compagni sono arrivati, si passa alla fase dopo.';
}
function sposta(d, z) {
  z = Math.round(Math.max(-8.8, Math.min(8.8, z)) * 10) / 10;
  d = Math.round(Math.max(Math.abs(z) < 3.58 ? 2.1 : 1.6, Math.min(10, d)) * 10) / 10;
  bozza.fasi[faseI].posti[ruolo - 1] = [d, z]; disegnaCrea();
}
function puntoSvg(e) {
  const svg = $('uomoPiscina'), m = svg.getScreenCTM(); if (!m) return null;
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(m.inverse());
  return [(p.y - 28) / 29, (p.x - 300) / 29.8];
}
function salva() {
  bozza.nome = $('uomoNome').value.trim();
  if (!bozza.nome) { messaggio('Dai un nome allo schema prima di salvarlo.'); $('uomoNome').focus(); return; }
  bozza.sigla = $('uomoSigla').value.trim();
  bozza.descrizione = bozza.fasi.length === 1 ? 'Schema personale a una fase.' : `Schema personale in ${bozza.fasi.length} fasi.`;
  const s = validaUomo({ ...bozza, personale: true });
  if (!s) { messaggio('Lo schema non è valido: controlla i posti.'); return; }
  if (!salvaPersonale(s)) { messaggio('Non riesco a salvare: memoria del browser piena o non disponibile (al massimo 24 schemi tuoi).'); return; }
  chiudiCrea();
}

// ---------- apertura e collegamenti ----------
export function mostraUomo() { if (!pronto) return; $('uomoCrea').hidden = true; $('uomoElenco').hidden = false; disegnaElenco(); navigazione.apri(); }
export function riepilogoUomo() { return scelti().map(s => s.nome).join(' · ') || 'Nessuno schema scelto'; }
export function aggiornaRiepilogoUomo() { for (const id of ['uomoRiepSquadre', 'uomoRiepImpostazioni', 'uomoRiepTorneo']) if ($(id)) $(id).textContent = riepilogoUomo(); }
export function inizializzaUomo({ apri, torna }) {
  if (pronto) return; pronto = true; navigazione = { apri, torna };
  for (const d of DURATE) $('uomoDurata').insertAdjacentHTML('beforeend', `<option value="${d}">${String(d).replace('.', ',')} s</option>`);
  $('uomoPalla').insertAdjacentHTML('beforeend', '<option value="0">Libera: decide chi ha la palla</option>');
  RUOLI_UP.forEach((r, i) => $('uomoPalla').insertAdjacentHTML('beforeend', `<option value="${i + 1}">${i + 1} · ${r}</option>`));
  for (const id of ['btUomoSquadre', 'btUomoImpostazioni', 'btUomoTorneo', 'btUomoStrategie']) if ($(id)) $(id).onclick = mostraUomo;
  $('uomoIndietro').onclick = () => { if (!$('uomoCrea').hidden) chiudiCrea(); else { aggiornaRiepilogoUomo(); navigazione.torna(); } };
  $('uomoLista').onclick = azione; $('uomoScelti').onclick = azione;
  $('uomoNuovo').onclick = () => apriCrea();
  $('uomoAnnulla').onclick = chiudiCrea; $('uomoSalva').onclick = salva;
  $('uomoFasi').onclick = e => { const b = e.target.closest('[data-fase]'); if (b) { faseI = +b.dataset.fase; disegnaCrea(); } };
  $('uomoAggiungiFase').onclick = () => { if (bozza.fasi.length < MAX_FASI) { bozza.fasi.splice(faseI + 1, 0, copia(bozza.fasi[faseI])); faseI++; disegnaCrea(); } };
  $('uomoTogliFase').onclick = () => { if (bozza.fasi.length > 1) { bozza.fasi.splice(faseI, 1); faseI = Math.max(0, faseI - 1); disegnaCrea(); } };
  $('uomoDurata').onchange = () => { bozza.fasi[faseI].durata = +$('uomoDurata').value; };
  $('uomoPalla').onchange = () => { bozza.fasi[faseI].palla = +$('uomoPalla').value; disegnaCrea(); };
  $('uomoNome').oninput = () => { bozza.nome = $('uomoNome').value; };
  const svg = $('uomoPiscina');
  svg.addEventListener('pointerdown', e => {
    const m = e.target.closest('[data-uomo-ruolo]'); if (!m) return;
    e.preventDefault(); ruolo = +m.dataset.uomoRuolo; trascina = e.pointerId;
    try { svg.setPointerCapture(e.pointerId); } catch { /* il puntatore può non essere catturabile */ }
    const p = puntoSvg(e); if (p) sposta(...p); else disegnaCrea();
  });
  svg.addEventListener('pointermove', e => { if (trascina === e.pointerId) { e.preventDefault(); const p = puntoSvg(e); if (p) sposta(...p); } });
  const fine = e => { if (trascina === e.pointerId) trascina = null; };
  svg.addEventListener('pointerup', fine); svg.addEventListener('pointercancel', fine);
  svg.addEventListener('keydown', e => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault(); const [d, z] = bozza.fasi[faseI].posti[ruolo - 1], k = e.shiftKey ? 0.5 : 0.1;
    sposta(d + (e.key === 'ArrowDown' ? k : e.key === 'ArrowUp' ? -k : 0), z + (e.key === 'ArrowRight' ? k : e.key === 'ArrowLeft' ? -k : 0));
  });
  aggiornaRiepilogoUomo();
}
