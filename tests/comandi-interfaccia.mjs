// Comandi e interfaccia (v0.78, richieste di Ale): con la palla agli avversari il tasto PASSA diventa CONTRASTA (scritta, icona,
// colore e descrizione) e torna PASSA in attacco; ogni tasto ha il suo colore, diverso dall'oro (premuto/azione richiesta), dal
// rosso (sanzioni) e dal ciano (servizio); la barra dell'energia mostra numero e cognome del selezionato, barra e percentuale,
// leggibili per intero anche sull'iPhone più piccolo (667×375).
// Uso: node tests/comandi-interfaccia.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4335, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
const RISERVATI = { oro: '#ffc93c', rosso: '#ff5b5f', ciano: '#5cc8ff' };
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const distanza = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const errori = [];
for (const [nome, viewport] of [['iPhone 14', { width: 844, height: 390 }], ['iPhone SE', { width: 667, height: 375 }]]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errori.push(e.message));
  await pg.addInitScript(() => {
    let a = 11; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
    window.__salta = n => { const R = window.__pallanuoto.renderer, d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = d; };
  });
  await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
  await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); document.getElementById('goBtn').click(); window.__salta(420); });
  const stato = lato => pg.evaluate(lato => {
    const H = window.__pallanuoto; H.replay?.interrompiReplay?.();
    H.regole.giveBall((lato === 'attacco' ? H.teams[0] : H.teams[1]).players[4]); window.__salta(30);
    const b = document.querySelector('.tb[data-b="pass"]'), vis = el => !!el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
    const colori = {}; for (const k of ['shoot', 'pass', 'lob', 'sprint', 'sw']) { const e = document.querySelector(`.tb[data-b="${k}"]`); if (e) colori[k] = getComputedStyle(e).getPropertyValue('--tb-c').trim(); }
    const nome = document.getElementById('stamNome'), ctrl = H.ctrl;
    return { passa: vis(b.querySelector('.et-passa')), contrasta: vis(b.querySelector('b.et-contrasta')), icPassa: vis(b.querySelector('.ic-passa')), icContrasta: vis(b.querySelector('.ic-contrasta')),
      aria: b.getAttribute('aria-label'), colori, numero: document.getElementById('stamNumero').textContent, cognome: document.getElementById('stamCognome').textContent,
      atteso: { numero: '#' + ctrl.num, cognome: ctrl.name }, nomeIntero: vis(nome) && nome.scrollWidth <= nome.clientWidth + 1, perc: document.getElementById('stamPerc').textContent,
      etichettaVecchia: !!document.querySelector('#energia .energia-label') };
  }, lato);
  const att = await stato('attacco');
  prova(att.passa && att.icPassa && !att.contrasta && !att.icContrasta && att.aria === 'Passa', `${nome}, attacco: il tasto dice PASSA (${att.aria})`);
  prova(att.numero === att.atteso.numero && att.cognome === att.atteso.cognome && /^\d+%$/.test(att.perc) && !att.etichettaVecchia, `${nome}: barra dell'energia con «${att.numero} ${att.cognome}» e ${att.perc}`);
  prova(att.nomeIntero, `${nome}: numero e cognome si leggono per intero`);
  const dif = await stato('difesa');
  prova(dif.contrasta && dif.icContrasta && !dif.passa && !dif.icPassa && /^Contrasta/.test(dif.aria), `${nome}, difesa: il tasto dice CONTRASTA (${dif.aria.slice(0, 40)}…)`);
  prova(dif.colori.pass !== att.colori.pass, `${nome}: CONTRASTA ha un colore suo (${att.colori.pass} → ${dif.colori.pass})`);
  const tutti = [...Object.values(att.colori), dif.colori.pass];
  prova(tutti.length === 6 && new Set(tutti).size === 6, `${nome}: sei colori diversi (${tutti.join(' ')})`);
  prova(tutti.every(c => /^#[0-9a-f]{6}$/i.test(c) && Object.values(RISERVATI).every(r => distanza(rgb(c), rgb(r)) > 60)), `${nome}: nessun tasto usa l'oro, il rosso o il ciano dell'interfaccia`);
  const ancora = await stato('attacco');
  prova(ancora.passa && !ancora.contrasta, `${nome}: tornata la palla, il tasto torna PASSA`);
  await ctx.close();
}
prova(!errori.length, 'nessun errore nella pagina' + (errori.length ? ': ' + errori.slice(0, 2).join(' | ') : ''));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log(ok ? '\nComandi e interfaccia: tutte le prove superate' : '\nComandi e interfaccia: prove NON superate');
process.exit(ok ? 0 : 1);
