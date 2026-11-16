// Prove degli schemi dell'uomo in più (v0.44): libreria e regole di validità, chiamata dello schema in partita, fasi che avanzano,
// compagni che raggiungono i posti della fase, pali riconosciuti dalla fase in corso, computer che sceglie da solo, sezione «Uomo in
// più» (scelta di massimo 3 schemi, creazione e salvataggio di uno schema nuovo con più fasi, che resta dopo aver ricaricato).
// Uso: node tests/uomo-in-piu.mjs [--no-build] [--foto]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4398, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
const init = (foto = false) => {
  let a = 21; Math.random = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; const d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } now += 1000 / 60; if (foto) R.render = d; window.__raf(now); R.render = d; };
};
const errori = [];
const pg = await browser.newPage({ viewport: { width: 852, height: 393 }, isMobile: true, hasTouch: true });
pg.setDefaultTimeout(150000);
pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(init, process.argv.includes('--foto'));
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });

// ---------- libreria e validazione (funzioni pure) ----------
const lib = await pg.evaluate(() => {
  const U = window.__pallanuoto.uomo;
  const nomi = U.LIBRERIA.map(s => `${s.nome} (${s.fasi.length})`);
  const tuttiValidi = U.LIBRERIA.every(s => U.validaUomo(s));
  // un posto dentro l'area di porta viene spostato fuori (2,1 m), uno fuori vasca riportato dentro
  const v = U.validaUomo({ id: 'x', nome: 'Prova', fasi: [{ posti: [[0.5, 0], [2, 12], [2, -5], [5, 2], [5, -2], [7, 0]], durata: 2.5, palla: 9 }] });
  const sette = U.validaUomo({ id: 'y', nome: 'Troppe', fasi: Array(5).fill({ posti: U.LIBRERIA[0].fasi[0].posti }) });
  const senzaNome = U.validaUomo({ id: 'z', nome: ' ', fasi: U.LIBRERIA[0].fasi });
  return { nomi, tuttiValidi, area: v && v.fasi[0].posti[0], bordo: v && v.fasi[0].posti[1], palla: v && v.fasi[0].palla, sette, senzaNome };
});
prova(lib.nomi.length >= 6 && lib.tuttiValidi, `libreria: ${lib.nomi.length} schemi validi dai documenti (${lib.nomi.join(', ')})`);
prova(lib.area && lib.area[0] === 2.1, `un posto dentro l'area di porta viene portato fuori (${lib.area})`);
prova(lib.bordo && lib.bordo[1] === 8.8 && lib.palla === 0, 'posto fuori vasca riportato dentro, ruolo della palla non valido = palla libera');
prova(!lib.sette && !lib.senzaNome, 'rifiutati: più di 4 fasi, nome vuoto');

// ---------- in partita: il giocatore chiama lo schema ----------
const partita = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.teams[0], O = H.teams[1];
  H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(300);
  t.human = true; H.game.autoplay = false;
  // superiorità per l'Italia: un difensore ungherese escluso, palla al nostro portiere (ferma)
  const esp = O.players[3]; esp.excluded = true; esp.exclUntil = H.game.time + 999; esp.alPozzetto = false; esp.puoRientrare = false; esp.x = -30;
  // palla ferma al mezzo destro (4) in attacco, a 5 metri: nessun contrasto avversario, così il possesso non cambia
  const gk = t.players[4], ferma = () => { if (H.ball.holder !== gk) H.regole.giveBall(gk); gk.x = 12.5 * t.dir - t.dir * 5.6; gk.z = 2.5 * t.dir; gk.decideT = 99; gk.reazioneT = 99; gk.act = null; H.ball.holdTime = 0; esp.excluded = true; esp.exclUntil = H.game.time + 999; esp.puoRientrare = false; H.game.shot = 25;
    for (const q of O.players) { q.tackleCD = 9; q.colpi = []; } H.fight.active = false; };
  ferma(); window.__salta(30);
  const r = { prima: t.uomo ? t.uomo.schema.id : null, barra: document.getElementById('tac').textContent };
  // il giocatore chiama il secondo dei suoi tre schemi (3-3 che diventa 4-2, due fasi)
  H.regole.callPlay(1); ferma();
  const sc = t.uomo && t.uomo.schema;
  r.chiamato = sc && sc.id; r.fase0 = t.uomo && t.uomo.fase; const tChiamata = H.game.time;
  // distanza media dai posti della fase, all'inizio e dopo 2 s
  const dalPosto = fase => { const gx = 12.5 * t.dir; let s = 0, n = 0; for (const p of t.players) { if (p.isGK || p === H.ctrl || p === gk) continue; const [d, z] = fase.posti[p.i - 1]; s += Math.hypot(p.x - (gx - t.dir * d), p.z - z * t.dir); n++; } return s / n; };
  r.inizio = dalPosto(sc.fasi[0]);
  let tCambio = null;
  for (let i = 0; i < 60; i++) { ferma(); window.__salta(1); if (tCambio === null && t.uomo.fase === 1) tCambio = H.game.time; }      // __salta(1) = 2 fotogrammi: 60 giri = 2 s
  r.dopo2s = dalPosto(sc.fasi[0]);
  for (let i = 0; i < 300 && t.uomo.fase === 0; i++) { ferma(); window.__salta(1); if (t.uomo.fase === 1) tCambio = H.game.time; }
  r.fase1 = t.uomo.fase; r.cambioDopo = Math.round((tCambio - tChiamata) * 10) / 10; r.durata = sc.fasi[0].durata;
  r.inizioF2 = dalPosto(sc.fasi[1]);
  for (let i = 0; i < 120; i++) { ferma(); window.__salta(1); }
  r.dopoF2 = dalPosto(sc.fasi[1]);
  // pali della fase 2: il mezzo sinistro (5) è entrato sul palo e ora conta come palo, il punto (6) no
  r.palo5 = H.prova.paloUomo(t.players[5]); r.palo6 = H.prova.paloUomo(t.players[6]);
  r.barraDopo = document.getElementById('tac').textContent;
  // Pausa 6c5: le carte chiamano gli schemi a fasi, senza sostituire il piano della parità.
  const pianoPrima = JSON.stringify(t.schema);
  H.pausa(); document.querySelector('#vPausa [data-va="tattiche"]').click();
  const lavagna = document.querySelector('#tattichePausa .tp-lavagne figure');
  r.pausa = {
    nomi: [...document.querySelectorAll('#tattichePausa [data-tattica="uomo"] b')].map(e => e.textContent),
    fase: lavagna.querySelector('figcaption').textContent,
    posti: [...lavagna.querySelectorAll('svg g')].map(e => e.getAttribute('transform')),
    attesi: sc.fasi[1].posti.map(([d, z]) => `translate(${120 + z * 12} ${13 + d * 13})`),
    compiti: lavagna.querySelector('p').textContent,
    carteParita: document.querySelectorAll('#tattichePausa [data-tattica="attacco"]').length,
  };
  document.querySelector('#tattichePausa [data-tattica="uomo"][data-schema="0"]').click();
  r.pausa.chiamato = t.uomo && t.uomo.schema.id; r.pausa.riparte = t.uomo && t.uomo.fase;
  document.querySelector('#tattichePausa [data-tattica="uomo"][data-schema="3"]').click();
  r.pausa.base = t.uomo; r.pausa.pianoConservato = JSON.stringify(t.schema) === pianoPrima;
  H.pausa();
  // 4 = torna al 4-2 base
  H.regole.callPlay(3); r.base = t.uomo; ferma(); window.__salta(5);
  // finita la superiorità lo schema si spegne
  esp.excluded = false; window.__salta(5); r.finito = t.uomo;
  return r;
});
prova(partita.prima === null, 'il giocatore non ha uno schema imposto: finché non chiama resta il 4-2 base');
prova(/UOMO IN PIÙ|6c5/.test(partita.barra), `all'inizio della superiorità la barra mostra gli schemi da chiamare («${partita.barra.slice(0, 80)}»)`);
prova(partita.chiamato === 'u33-42' && partita.fase0 === 0, `tasto 2 = secondo schema scelto: ${partita.chiamato}, fase 1`);
prova(partita.dopo2s < partita.inizio - 0.5, `i compagni nuotano verso i posti della fase 1 (distanza media ${partita.inizio.toFixed(2)} → ${partita.dopo2s.toFixed(2)} m)`);
prova(partita.fase1 === 1 && partita.cambioDopo >= partita.durata - 0.02 && partita.cambioDopo <= partita.durata + 3.05, `la fase 1 dura ${partita.durata} s ma aspetta i compagni ancora lontani (al massimo 3 s in più): si passa alla seconda dopo ${partita.cambioDopo} s`);
prova(partita.dopoF2 < partita.inizioF2 - 0.3, `e i compagni vanno ai nuovi posti (${partita.inizioF2.toFixed(2)} → ${partita.dopoF2.toFixed(2)} m)`);
prova(partita.palo5 && !partita.palo6, 'pali riconosciuti dalla fase in corso: il mezzo sinistro entrato sul palo è palo, il punto uscito no');
prova(/3-3›4-2 2\/2/.test(partita.barraDopo), `la barra indica la fase in corso («${partita.barraDopo.slice(0, 90)}»)`);
prova(partita.pausa.nomi.includes('3-3 che diventa 4-2') && partita.pausa.carteParita === 0 && /fase 2\/2/.test(partita.pausa.fase), 'pausa 6c5: mostra i propri schemi e la fase reale, senza carte della parità');
prova(JSON.stringify(partita.pausa.posti) === JSON.stringify(partita.pausa.attesi) && /Sui pali: Pos\. 5, Pos\. 3\./.test(partita.pausa.compiti), 'pausa 6c5: lavagna e pali corrispondono ai posti della seconda fase con la numerazione del 4–2');
prova(partita.pausa.chiamato === 'u42' && partita.pausa.riparte === 0 && partita.pausa.base === null && partita.pausa.pianoConservato, 'pausa 6c5: scelta e ritorno alla base funzionano senza cambiare il piano prepartita');
prova(partita.base === null && partita.finito === null, 'tasto 4 = 4-2 base; a superiorità finita lo schema si spegne');

// ---------- il computer sceglie da solo ----------
const computer = await pg.evaluate(() => {
  const H = window.__pallanuoto, t = H.teams[0], O = H.teams[1];
  O.players.forEach(q => { q.excluded = false; });
  t.human = false;
  const esp = t.players[2]; esp.excluded = true; esp.x = 30;
  const gk = O.players[0]; H.regole.giveBall(gk); gk.decideT = 99; gk.reazioneT = 99;
  window.__salta(10);
  const r = { scelto: O.uomo && O.uomo.schema.id, tra: H.prova.schemiUomo(O).map(s => s.id) };
  esp.excluded = false; t.human = true;
  return r;
});
prova(!!computer.scelto && computer.tra.includes(computer.scelto), `il computer in superiorità sceglie uno dei suoi schemi (${computer.scelto})`);
await pg.close();

// ---------- sezione «Uomo in più»: scelta di 3 e creazione ----------
const pm = await browser.newPage({ viewport: { width: 852, height: 393 }, isMobile: true, hasTouch: true });
// La sezione è DOM/SVG: evita di renderizzare la vasca dietro al menu a ogni frame.
await pm.addInitScript(() => { window.requestAnimationFrame = () => 1; });
pm.setDefaultTimeout(150000); pm.on('pageerror', e => errori.push(e.message));
await pm.goto(server.resolvedUrls.local[0]);
await pm.waitForFunction('window.__pallanuoto && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
await pm.locator('#vHome .m-cta').click();
await pm.locator('#btUomoSquadre').click();
await pm.waitForTimeout(400);
const vista = await pm.evaluate(() => ({ on: document.getElementById('vUomo').classList.contains('on'), carte: document.querySelectorAll('#uomoLista [data-uomo]').length,
  scelti: [...document.querySelectorAll('#uomoScelti [data-scelto]')].map(e => e.dataset.scelto) }));
prova(vista.on && vista.carte >= 6 && vista.scelti.length === 3, `sezione «Uomo in più» dalla schermata Squadre: ${vista.carte} schemi, ${vista.scelti.length} scelti (${vista.scelti.join(', ')})`);
if (process.argv.includes('--foto')) await pm.screenshot({ path: path.join(ROOT, 'docs/immagini/uomo-in-piu-libreria.png') });
// il quarto schema non entra finché non se ne toglie uno
const pieno = await pm.evaluate(() => ({ disattivo: document.querySelector('#uomoLista [data-uomo="u33"] [data-azione="scegli"]').disabled, n: document.querySelectorAll('#uomoScelti [data-scelto]').length }));
prova(pieno.disattivo && pieno.n === 3, 'con 3 schemi scelti il pulsante «Scegli» degli altri è spento: un quarto non entra');
await pm.locator('#uomoScelti [data-scelto="u42"] [data-azione="togli"]').click();
await pm.locator('#uomoLista [data-uomo="u33"] [data-azione="scegli"]').click();
const scambio = await pm.evaluate(() => [...document.querySelectorAll('#uomoScelti [data-scelto]')].map(e => e.dataset.scelto));
prova(scambio.length === 3 && scambio.includes('u33') && !scambio.includes('u42'), `togliendone uno si può scegliere un altro (${scambio.join(', ')})`);
// creazione: nuovo schema a due fasi, sposto un giocatore nella seconda fase e salvo
await pm.locator('#uomoNuovo').click();
await pm.locator('#uomoNome').fill('Mio rombo');
await pm.locator('#uomoSigla').fill('Rombo');
await pm.locator('#uomoAggiungiFase').click();
const spostato = await pm.evaluate(() => {
  const svg = document.getElementById('uomoPiscina'), m = svg.querySelector('[data-uomo-ruolo="6"]'), r = svg.getBoundingClientRect();
  return { x: r.left + r.width * 0.25, y: r.top + r.height * 0.55, da: m.getAttribute('transform') };
});
await pm.locator('#uomoPiscina [data-uomo-ruolo="6"]').dispatchEvent('pointerdown', { pointerId: 1, clientX: spostato.x, clientY: spostato.y, bubbles: true });
await pm.locator('#uomoPiscina').dispatchEvent('pointermove', { pointerId: 1, clientX: spostato.x, clientY: spostato.y, bubbles: true });
await pm.locator('#uomoPiscina').dispatchEvent('pointerup', { pointerId: 1, clientX: spostato.x, clientY: spostato.y, bubbles: true });
await pm.locator('#uomoPalla').selectOption('6');
if (process.argv.includes('--foto')) await pm.screenshot({ path: path.join(ROOT, 'docs/immagini/uomo-in-piu-editor.png') });
await pm.locator('#uomoSalva').click();
const salvato = await pm.evaluate(() => {
  const U = window.__pallanuoto.uomo, p = U.personali().find(s => s.nome === 'Mio rombo');
  return p && { id: p.id, sigla: p.sigla, fasi: p.fasi.length, palla: p.fasi[1].palla, mosso: JSON.stringify(p.fasi[0].posti[5]) !== JSON.stringify(p.fasi[1].posti[5]), inLista: !!document.querySelector(`#uomoLista [data-uomo="${p.id}"]`) };
});
prova(!!salvato && salvato.sigla === 'Rombo' && salvato.fasi === 2 && salvato.palla === 6 && salvato.mosso && salvato.inLista, `schema nuovo salvato con 2 fasi, il punto spostato nella seconda e la palla a lui (${JSON.stringify(salvato)})`);
if (salvato) { await pm.locator('#uomoScelti [data-scelto="u33"] [data-azione="togli"]').click(); await pm.locator(`#uomoLista [data-uomo="${salvato.id}"] [data-azione="scegli"]`).click(); }
await pm.reload();
await pm.waitForFunction('window.__pallanuoto && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
const dopo = await pm.evaluate(() => ({ personali: window.__pallanuoto.uomo.personali().map(s => s.nome), scelti: window.__pallanuoto.uomo.scelti().map(s => s.nome) }));
prova(dopo.personali.includes('Mio rombo'), `dopo aver ricaricato lo schema personale resta (${dopo.personali.join(', ')})`);
prova(dopo.scelti.length === 3 && dopo.scelti.includes('Mio rombo'), `scelti dopo il ricaricamento, compreso lo schema nuovo: ${dopo.scelti.join(', ')}`);
prova(errori.length === 0, `nessun errore nella pagina${errori.length ? ': ' + errori.slice(0, 3).join(' | ') : ''}`);
await browser.close(); server.httpServer.close();
console.log(ok ? '\nUomo in più: tutte le prove superate' : '\nUomo in più: prove NON superate');
process.exit(ok ? 0 : 1);
