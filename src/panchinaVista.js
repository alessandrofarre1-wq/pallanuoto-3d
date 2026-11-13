// Schermata «Panchina» (dalla pausa): chi è in acqua e le 6 riserve, con ruolo, mano, valutazione, statistiche chiave, stamina
// e gol; suggerimenti per chi è stanco; si sceglie chi esce e chi entra e il cambio volante parte quando si riprende a giocare.
import { CHIAVE, RUOLI, STAT_NOMI } from './dati/rose.js';
import { iconaMano } from './mano.js';
import { PANCHINA, RUOLI_BREVI, annullaRichiesta, chiediCambio, consigli } from './panchina.js';
import { teams } from './stato.js';
import { annuncia } from './cronaca.js';
let sel = null;      // giocatore in acqua scelto per uscire
const barra = s => { const v = Math.round((s ?? 1) * 100); return `<span class="pc-bar ${v < PANCHINA.stanco * 100 ? 'stanco' : v < 65 ? 'medio' : ''}"><i style="width:${v}%"></i></span><b class="pc-pct">${v}%</b>`; };
const chiave = g => CHIAVE[g.ruolo].map(k => `${STAT_NOMI[k].slice(0, 3).toUpperCase()} ${g.s[k]}`).join(' · ');
function riga(g, extra, cls, attr) {
  return `<button type="button" class="pc-g ${cls}" ${attr}><span class="pc-num">${g.num}</span>`
    + `<span class="pc-nome">${g.nomeIntero || g.nome}${iconaMano(g.mano)}<small>${RUOLI[g.ruolo]} · OVR ${g.ovr}${g.tiriP ? ` · ${g.gol || 0} gol su ${g.tiriP} tiri` : g.gol ? ` · ${g.gol} gol` : ''}${g.pf ? ` · ${g.pf} falli gravi` : ''}</small></span>`
    + `<span class="pc-stat">${chiave(g)}</span><span class="pc-stam">${barra(g.stamina)}</span>${extra || ''}</button>`;
}
export function disegnaPanchina() {
  const t = teams[0], box = document.getElementById('panchinaBox'); if (!box || !t.rosa) return;
  // la stamina di chi è in acqua è quella del corpo in campo
  for (const p of t.players) if (p.scheda) p.scheda.stamina = p.stamina;
  const coda = t.coda || [];
  const inCoda = p => coda.find(x => x.esce === p), entraCoda = g => coda.find(x => x.entra === g);
  // consigli con il motivo (stanco, chi rende di più, partita storta, falli): ogni riserva proposta una volta sola
  const sugg = consigli(t, 4);
  let h = '';
  if (sugg.length) h += `<div class="pc-sugg"><b>Consigliati</b>${sugg.map(x => `<button type="button" class="pc-cons" data-esce="${x.p.i}" data-entra="${x.g.num}"><span>Esce <strong>${x.p.scheda.nomeIntero || x.p.name}</strong> (${RUOLI_BREVI[x.p.scheda.ruolo]} · ${x.p.ovr}) → entra <strong>${x.g.nomeIntero || x.g.nome}</strong> (${RUOLI_BREVI[x.g.ruolo]} · ${x.g.ovr})<small>${x.motivo}</small></span><em>Cambia</em></button>`).join('')}</div>`;
  else h += `<div class="pc-sugg"><b>Consigliati</b><span class="pc-ok">Per ora nessun cambio necessario: tutti in forma.</span></div>`;
  if (coda.length) h += `<div class="pc-coda"><b>Cambi in attesa: partono al primo momento utile</b>${coda.map(x => `<span>esce #${x.esce.num} → entra #${x.entra.num} ${x.entra.nome} <button type="button" class="pc-x" data-annulla="${x.esce.i}" aria-label="Annulla">✕</button></span>`).join('')}</div>`;
  h += `<h3>In acqua <small>${sel ? `scegli chi entra al posto di #${sel.num}` : 'tocca chi vuoi far uscire'}</small></h3><div class="pc-lista">`;
  const bloccato = p => p.excluded && p.pf >= 3;      // terzo fallo grave: esce comunque, entra la riserva in automatico
  h += t.players.map(p => riga(p.scheda, inCoda(p) ? `<em class="pc-tag">esce${p.excluded ? ' dal pozzetto' : ''}</em>` : p.excluded ? `<em class="pc-tag rosso">${bloccato(p) ? '3 falli' : p.alPozzetto ? 'nel pozzetto' : 'verso il pozzetto'}</em>` : '', (sel === p ? 'scelto' : '') + (bloccato(p) ? ' no' : ''), `data-campo="${p.i}"`)).join('');
  h += `</div><h3>Panchina</h3><div class="pc-lista">`;
  const riserve = t.rosa.filter(g => !g.inAcqua);
  h += riserve.map(g => { const ok = sel && !g.fuori && (g.ruolo === 0) === sel.isGK && !entraCoda(g);
    return riga(g, g.fuori ? '<em class="pc-tag rosso">3 falli</em>' : entraCoda(g) ? '<em class="pc-tag">entra</em>' : '', (ok ? 'puo' : sel ? 'no' : '') + (g.fuori ? ' no' : ''), `data-riserva="${g.num}"`); }).join('');
  h += `</div><p class="pc-nota">I cambi scelti qui partono al primo momento utile: subito dopo un gol, in un time-out o tra i tempi; per un espulso dal pozzetto; altrimenti quando chi esce è lontano dalla palla e la squadra non sta difendendo vicino alla porta. È un cambio volante: chi esce nuota alla zona dei cambi, il compagno arriva lungo il bordo, cinque ed entra; il gioco non si ferma. In partita il pulsante CAMBI fa solo il cambio consigliato, con un tocco. Il portiere si cambia solo con il portiere di riserva. Un espulso si può cambiare dal pozzetto, senza cinque: chi entra rientra in campo quando finisce l'espulsione.</p>`;
  box.innerHTML = h;
  box.querySelectorAll('[data-campo]').forEach(b => b.onclick = () => { const p = t.players[+b.dataset.campo]; if (p.excluded && p.pf >= 3) return; sel = sel === p ? null : p; disegnaPanchina(); });
  box.querySelectorAll('[data-riserva]').forEach(b => b.onclick = () => { if (!sel) return; const g = t.rosa.find(x => x.num === +b.dataset.riserva); if (chiediCambio(t, sel, g)) sel = null; disegnaPanchina(); });
  box.querySelectorAll('[data-esce]').forEach(b => b.onclick = () => { chiediCambio(t, t.players[+b.dataset.esce], t.rosa.find(x => x.num === +b.dataset.entra)); disegnaPanchina(); });
  box.querySelectorAll('[data-annulla]').forEach(b => b.onclick = e => { e.stopPropagation(); annullaRichiesta(t, t.players[+b.dataset.annulla]); disegnaPanchina(); });
}
export function azzeraScelta() { sel = null; }

// ---------- cambio al volo durante il gioco (pulsante CAMBI o tasto B): solo il sostituto consigliato ----------
// Decisione di Ale: in partita niente elenchi, solo il cambio consigliato; premendo parte subito il cambio volante.
// Per scegliere con calma si mette in pausa («Cambi e panchina»): quei cambi partono al primo momento utile.
let ultimo = 0;
const nomeDi = p => (p.scheda && p.scheda.nomeIntero) || p.name;
const cognomeDi = g => g.nome || '';
export function consiglioAdesso() { const t = teams[0]; return t.rosa ? consigli(t, 1)[0] || null : null; }
export function cambioRapido() {
  const t = teams[0], c = consiglioAdesso();
  if (!c) { annuncia('avviso', 'Nessun cambio consigliato', { dettaglio: 'per scegliere tu: pausa → Cambi e panchina', durata: 1.6 }); return false; }
  chiediCambio(t, c.p, c.g, true);
  annuncia('avviso', 'Cambio', { dettaglio: `esce ${nomeDi(c.p)}, entra ${c.g.nomeIntero || c.g.nome}`, durata: 1.6 });
  aggiornaPulsanteCambi(true); return true;
}
// il pulsante mostra il consiglio (aggiornato ogni mezzo secondo) o i cambi già in corso / in attesa
export function aggiornaPulsanteCambi(forza = false) {
  const b = document.getElementById('tCambi'), t = teams[0]; if (!b || !t.rosa) return;
  const now = performance.now(); if (!forza && now - ultimo < 500) return; ultimo = now;
  const C = t.cambio, coda = t.coda || [], c = C || coda.length ? null : consiglioAdesso();
  let html, stato;
  if (C) { html = `<small>cambio in corso</small><b>${cognomeDi(C.esce.scheda || {})} → ${cognomeDi(C.entra)}</b>`; stato = 'corso'; }
  else if (coda.length) { html = `<small>${coda.length === 1 ? '1 cambio' : coda.length + ' cambi'} in attesa</small><b>${cognomeDi(coda[0].esce.scheda || {})} → ${cognomeDi(coda[0].entra)}</b>`; stato = 'corso'; }
  else if (c) { html = `<small>cambio consigliato · ${c.motivo.split(':')[0].split(' (')[0]}</small><b>${cognomeDi(c.p.scheda)} → ${cognomeDi(c.g)} <i>${RUOLI_BREVI[c.g.ruolo]} ${c.g.ovr}</i></b>`; stato = c.urgente ? 'consiglio' : 'proposta'; }
  else { html = '<b>CAMBI</b>'; stato = 'vuoto'; }
  if (b.dataset.h !== html) { b.dataset.h = html; b.querySelector('.tc-testo').innerHTML = html; b.dataset.stato = stato; }
}
