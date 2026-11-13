// Schermata «Panchina» (dalla pausa): chi è in acqua e le 6 riserve, con ruolo, mano, valutazione, statistiche chiave, stamina
// e gol; suggerimenti per chi è stanco; si sceglie chi esce e chi entra e il cambio volante parte quando si riprende a giocare.
import { CHIAVE, RUOLI, STAT_NOMI } from './dati/rose.js';
import { iconaMano } from './mano.js';
import { PANCHINA, annullaRichiesta, chiediCambio, suggerimento } from './panchina.js';
import { teams } from './stato.js';
let sel = null;      // giocatore in acqua scelto per uscire
const barra = s => { const v = Math.round((s ?? 1) * 100); return `<span class="pc-bar ${v < PANCHINA.stanco * 100 ? 'stanco' : v < 65 ? 'medio' : ''}"><i style="width:${v}%"></i></span><b class="pc-pct">${v}%</b>`; };
const chiave = g => CHIAVE[g.ruolo].map(k => `${STAT_NOMI[k].slice(0, 3).toUpperCase()} ${g.s[k]}`).join(' · ');
function riga(g, extra, cls, attr) {
  return `<button type="button" class="pc-g ${cls}" ${attr}><span class="pc-num">${g.num}</span>`
    + `<span class="pc-nome">${g.nome}${iconaMano(g.mano)}<small>${RUOLI[g.ruolo]} · OVR ${g.ovr}${g.gol ? ` · ${g.gol} gol` : ''}${g.pf ? ` · ${g.pf} falli gravi` : ''}</small></span>`
    + `<span class="pc-stat">${chiave(g)}</span><span class="pc-stam">${barra(g.stamina)}</span>${extra || ''}</button>`;
}
export function disegnaPanchina() {
  const t = teams[0], box = document.getElementById('panchinaBox'); if (!box || !t.rosa) return;
  // la stamina di chi è in acqua è quella del corpo in campo
  for (const p of t.players) if (p.scheda) p.scheda.stamina = p.stamina;
  const coda = t.coda || [];
  const inCoda = p => coda.find(x => x.esce === p), entraCoda = g => coda.find(x => x.entra === g);
  // suggerimenti: prima i più stanchi, ogni riserva proposta una volta sola
  const usate = new Set(coda.map(x => x.entra)), sugg = [];
  for (const p of [...t.players].sort((a, b) => a.stamina - b.stamina)) {
    if (inCoda(p) || p.isGK) continue;
    const g = suggerimento(p, usate); if (g) { usate.add(g); sugg.push({ p, g }); }
  }
  let h = '';
  if (sugg.length) h += `<div class="pc-sugg"><b>Consigliati</b>${sugg.map(x => `<button type="button" class="pc-cons" data-esce="${x.p.i}" data-entra="${x.g.num}">#${x.p.num} ${x.p.name} è stanco (${Math.round(x.p.stamina * 100)}%) → entra #${x.g.num} ${x.g.nome} <em>Cambia</em></button>`).join('')}</div>`;
  if (coda.length) h += `<div class="pc-coda"><b>Cambi alla ripresa</b>${coda.map(x => `<span>esce #${x.esce.num} → entra #${x.entra.num} ${x.entra.nome} <button type="button" class="pc-x" data-annulla="${x.esce.i}" aria-label="Annulla">✕</button></span>`).join('')}</div>`;
  h += `<h3>In acqua <small>${sel ? `scegli chi entra al posto di #${sel.num}` : 'tocca chi vuoi far uscire'}</small></h3><div class="pc-lista">`;
  const bloccato = p => p.excluded && p.pf >= 3;      // terzo fallo grave: esce comunque, entra la riserva in automatico
  h += t.players.map(p => riga(p.scheda, inCoda(p) ? `<em class="pc-tag">esce${p.excluded ? ' dal pozzetto' : ''}</em>` : p.excluded ? `<em class="pc-tag rosso">${bloccato(p) ? '3 falli' : p.alPozzetto ? 'nel pozzetto' : 'verso il pozzetto'}</em>` : '', (sel === p ? 'scelto' : '') + (bloccato(p) ? ' no' : ''), `data-campo="${p.i}"`)).join('');
  h += `</div><h3>Panchina</h3><div class="pc-lista">`;
  const riserve = t.rosa.filter(g => !g.inAcqua);
  h += riserve.map(g => { const ok = sel && !g.fuori && (g.ruolo === 0) === sel.isGK && !entraCoda(g);
    return riga(g, g.fuori ? '<em class="pc-tag rosso">3 falli</em>' : entraCoda(g) ? '<em class="pc-tag">entra</em>' : '', (ok ? 'puo' : sel ? 'no' : '') + (g.fuori ? ' no' : ''), `data-riserva="${g.num}"`); }).join('');
  h += `</div><p class="pc-nota">Il cambio è volante: quando riprendi, chi esce nuota alla zona dei cambi sul bordo della tua metà, il compagno arriva lungo il bordo, si danno il cinque ed entra. Il gioco non si ferma. Dopo un gol, nei time-out e tra i tempi il cambio è immediato. Il portiere si cambia solo con il portiere di riserva. Un espulso si può cambiare dal pozzetto, senza cinque: chi entra rientra in campo quando finisce l'espulsione.</p>`;
  box.innerHTML = h;
  box.querySelectorAll('[data-campo]').forEach(b => b.onclick = () => { const p = t.players[+b.dataset.campo]; if (p.excluded && p.pf >= 3) return; sel = sel === p ? null : p; disegnaPanchina(); });
  box.querySelectorAll('[data-riserva]').forEach(b => b.onclick = () => { if (!sel) return; const g = t.rosa.find(x => x.num === +b.dataset.riserva); if (chiediCambio(t, sel, g)) sel = null; disegnaPanchina(); });
  box.querySelectorAll('[data-esce]').forEach(b => b.onclick = () => { chiediCambio(t, t.players[+b.dataset.esce], t.rosa.find(x => x.num === +b.dataset.entra)); disegnaPanchina(); });
  box.querySelectorAll('[data-annulla]').forEach(b => b.onclick = e => { e.stopPropagation(); annullaRichiesta(t, t.players[+b.dataset.annulla]); disegnaPanchina(); });
}
export function azzeraScelta() { sel = null; }

// ---------- cambi durante il gioco, senza pausa (pulsante CAMBI in alto a destra o tasto B) ----------
// Barra compatta in basso: i cambi consigliati con un tocco, oppure chi esce e poi chi entra. Il gioco continua e il cambio
// volante parte subito. Nella pallanuoto i cambi sono illimitati.
let selR = null, ultimo = 0, firma = '';
const classe = v => v < PANCHINA.stanco * 100 ? 'stanco' : v < 65 ? 'medio' : '';
const mini = (s, q) => { const v = Math.round((s ?? 1) * 100); return `<span class="cr-bar ${classe(v)}" data-q="${q}"><i style="width:${v}%"></i></span>`; };
export function cambiAperti() { const b = document.getElementById('cambiBox'); return !!b && b.classList.contains('on'); }
export function apriCambi(on = !cambiAperti()) {
  const b = document.getElementById('cambiBox'); if (!b) return;
  b.classList.toggle('on', on); selR = null; if (on) disegnaCambi();
}
export function disegnaCambi(forza = true) {
  const box = document.getElementById('cambiBox'), t = teams[0]; if (!box || !t.rosa || !cambiAperti()) return;
  const now = performance.now(); if (!forza && now - ultimo < 500) return; ultimo = now;
  // se è cambiato qualcosa nei cambi (uno è partito, finito o annullato) si ridisegna tutto
  const f = `${t.cambio ? t.cambio.fase + t.cambio.esce.num : ''}|${(t.coda || []).length}|${t.players.map(p => p.num + (p.excluded ? 'x' : '')).join(',')}`;
  if (f !== firma) { firma = f; forza = true; }
  if (!forza) {      // aggiornamento periodico: solo le barrette della stamina (i pulsanti restano, così un tocco non va perso)
    for (const el of box.querySelectorAll('.cr-bar[data-q]')) {
      const q = el.dataset.q, s = q[0] === 'c' ? t.players[+q.slice(1)].stamina : (t.rosa.find(g => g.num === +q.slice(1)) || {}).stamina;
      const v = Math.round((s ?? 1) * 100); el.className = 'cr-bar ' + classe(v); el.firstChild.style.width = v + '%';
    }
    return;
  }
  const coda = t.coda || [], C = t.cambio;
  const inCoda = p => coda.find(x => x.esce === p) || (C && C.esce === p), entraCoda = g => coda.find(x => x.entra === g) || (C && C.entra === g);
  const usate = new Set([...coda.map(x => x.entra), ...(C ? [C.entra] : [])]), sugg = [];
  for (const p of [...t.players].sort((a, b) => a.stamina - b.stamina)) { if (inCoda(p) || p.isGK) continue; const g = suggerimento(p, usate); if (g) { usate.add(g); sugg.push({ p, g }); } if (sugg.length >= 2) break; }
  let h = '<button type="button" class="cr-chiudi" data-chiudi aria-label="Chiudi">✕</button>';
  if (C || coda.length) h += `<div class="cr-riga cr-corso">${C ? `<span>in corso: esce #${C.esce.num} → entra #${C.entra.num}</span>` : ''}${coda.map(x => `<span>esce #${x.esce.num} → entra #${x.entra.num} <button type="button" data-annulla="${x.esce.i}">✕</button></span>`).join('')}</div>`;
  if (sugg.length && !selR) h += `<div class="cr-riga">${sugg.map(x => `<button type="button" class="cr-cons" data-esce="${x.p.i}" data-entra="${x.g.num}">#${x.p.num} ${mini(x.p.stamina, 'c' + x.p.i)} → #${x.g.num} ${x.g.nome}</button>`).join('')}</div>`;
  if (!selR) h += `<div class="cr-riga"><b>Chi esce?</b>${t.players.map(p => { const no = (p.excluded && p.pf >= 3) || inCoda(p); return `<button type="button" class="cr-g${no ? ' no' : ''}" data-campo="${p.i}">#${p.num}${p.excluded ? '<em>pozz.</em>' : ''}${mini(p.stamina, 'c' + p.i)}</button>`; }).join('')}</div>`;
  else h += `<div class="cr-riga"><b>Al posto di #${selR.num}:</b>${t.rosa.filter(g => !g.inAcqua && !g.fuori && (g.ruolo === 0) === selR.isGK && !entraCoda(g)).map(g => `<button type="button" class="cr-g" data-riserva="${g.num}">#${g.num} ${g.nome}${mini(g.stamina, 'r' + g.num)}</button>`).join('') || '<span>nessuna riserva disponibile</span>'}<button type="button" class="cr-g no" data-indietro-c>‹</button></div>`;
  box.innerHTML = h;
  const ok = () => { selR = null; disegnaCambi(); };
  box.querySelector('[data-chiudi]').onclick = () => apriCambi(false);
  box.querySelectorAll('[data-esce]').forEach(b => b.onclick = () => { chiediCambio(t, t.players[+b.dataset.esce], t.rosa.find(x => x.num === +b.dataset.entra)); ok(); });
  box.querySelectorAll('[data-campo]').forEach(b => b.onclick = () => { const p = t.players[+b.dataset.campo]; if ((p.excluded && p.pf >= 3) || inCoda(p)) return; selR = p; disegnaCambi(); });
  box.querySelectorAll('[data-riserva]').forEach(b => b.onclick = () => { chiediCambio(t, selR, t.rosa.find(x => x.num === +b.dataset.riserva)); ok(); });
  box.querySelectorAll('[data-annulla]').forEach(b => b.onclick = () => { annullaRichiesta(t, t.players[+b.dataset.annulla]); ok(); });
  const ind = box.querySelector('[data-indietro-c]'); if (ind) ind.onclick = ok;
}
