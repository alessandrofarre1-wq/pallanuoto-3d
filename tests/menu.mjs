// Menu di WATERPOLO 7 su iPhone (verticale e orizzontale, grande e piccolo): screenshot reali di home, squadre, impostazioni,
// comandi, opzioni, pausa; e controlli del percorso: Italia–Ungheria in campo in pochi tocchi, «indietro» che conserva le
// scelte, squadre e impostazioni davvero usate dalla partita, avviso di rotazione solo durante la partita.
// Uso: node tests/menu.mjs [cartella di uscita] [--no-build] [--solo-controlli]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'tests/screenshot/menu');
const FOTO = !process.argv.includes('--solo-controlli');
fs.mkdirSync(USCITA, { recursive: true });
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4187, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const init = () => {
  let a = 5; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  performance.now = () => 0; window.__frame = 0;
  window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__vai = n => { for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } };
};
let ok = true; const nota = (bene, testo) => { console.log(`${bene ? 'OK ' : 'NO '} ${testo}`); if (!bene) ok = false; };
async function apri(vp) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage(); const errori = [];
  pg.on('pageerror', e => errori.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && /Error/.test(m.text()) && !/Failed to load/.test(m.text())) errori.push(m.text().split('\n')[0]); });
  await pg.addInitScript(init); await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
  await pg.evaluate(() => window.__vai(2));
  pg.errori = errori; return pg;
}
const foto = async (pg, nome) => { if (!FOTO) return; await pg.evaluate(() => window.__vai(1)); await pg.waitForTimeout(350); await pg.screenshot({ path: path.join(USCITA, nome + '.png'), timeout: 120000 }); };
// il pulsante principale della schermata è dentro lo schermo (senza scorrere)?
const inVista = (pg, sel) => pg.evaluate(s => { const e = [...document.querySelectorAll(s)].find(x => x.offsetParent); if (!e) return false; const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; }, sel);
const TELEFONI = { 'iphone-verticale': { width: 393, height: 852 }, 'iphone-orizzontale': { width: 852, height: 393 }, 'iphone-se-orizzontale-safari': { width: 667, height: 320 } };
for (const [tel, vp] of Object.entries(TELEFONI)) {
  const pg = await apri(vp);
  console.log(`\n${tel} (${vp.width}×${vp.height})`);
  // 1. home
  nota(await pg.evaluate(() => document.title) === 'WATERPOLO 7', 'titolo della pagina: WATERPOLO 7');
  nota(await inVista(pg, '#vHome .m-cta'), 'home: PARTITA VELOCE visibile senza scorrere');
  const logo = await pg.evaluate(() => { const r = document.querySelector('#vHome .logo').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
  nota(logo.w >= 220, `home: logo largo ${logo.w} punti (leggibile)`);
  await foto(pg, `${tel}-1-home`);
  nota(await pg.evaluate(() => { const i = document.querySelector('#vHome .eroe img'); return i && i.complete && i.naturalWidth > 0; }), 'home: giocatore in primo piano caricato');
  await pg.tap('#vHome [data-va="info"]'); nota(await pg.evaluate(() => document.querySelectorAll('#vInfo li').length) >= 8, 'informazioni: regole e suggerimenti');
  await foto(pg, `${tel}-7-informazioni`); await pg.tap('#vInfo [data-indietro]');
  // 2. squadre: Italia contro Ungheria (predefinite), tocchi contati
  let tocchi = 0; const tocca = async sel => { tocchi++; await pg.tap(sel); };
  await tocca('#vHome .m-cta');
  nota(await inVista(pg, '#vSquadre .m-cta'), 'squadre: CONTINUA visibile senza scorrere');
  const sq = await pg.evaluate(() => [...document.querySelectorAll('.card-sq .cs-nome')].map(e => e.textContent));
  nota(sq[0] === 'Italia' && sq[1] === 'Ungheria', `squadre: ${sq.join(' contro ')}`);
  await foto(pg, `${tel}-2-squadre`);
  // cambio dall'elenco e ritorno: tocca Spagna per la tua squadra, poi Italia di nuovo
  await pg.tap('#elencoSq [data-sq="ESP"]'); const s2 = await pg.evaluate(() => document.querySelector('.card-sq[data-lato="0"] .cs-nome').textContent);
  await pg.tap('#elencoSq [data-sq="ITA"]');
  nota(s2 === 'Spagna', 'squadre: toccare una bandiera cambia la tua squadra');
  // 3. impostazioni, poi indietro e avanti: le scelte restano
  await tocca('#vSquadre .m-cta');
  nota(await inVista(pg, '#goBtn'), 'impostazioni: GIOCA visibile senza scorrere');
  await pg.selectOption('#selLen', '300'); await pg.selectOption('#selArb', '1.4');
  await foto(pg, `${tel}-3-impostazioni`);
  await pg.tap('#vImpostazioni [data-indietro]'); const dopo = await pg.evaluate(() => [...document.querySelectorAll('.card-sq .cs-nome')].map(e => e.textContent));
  nota(dopo[0] === 'Italia' && dopo[1] === 'Ungheria', 'indietro: le squadre scelte restano');
  await pg.tap('#vSquadre .m-cta'); tocchi++;
  const imp = await pg.evaluate(() => ({ len: document.getElementById('selLen').value, arb: document.getElementById('selArb').value }));
  nota(imp.len === '300' && imp.arb === '1.4', 'indietro e avanti: le impostazioni restano');
  // 4. gioca
  await tocca('#goBtn');
  const partita = await pg.evaluate(() => { const H = window.__pallanuoto; window.__vai(5); return { stato: H.game.state, a: H.teams[0].codice, b: H.teams[1].codice, menu: document.getElementById('menu').style.display, clock: H.game.clock }; });
  nota(partita.menu === 'none' && ['countdown', 'play'].includes(partita.stato), `partita avviata (${partita.stato})`);
  nota(partita.a === 'ITA' && partita.b === 'HUN', `in campo ${partita.a} contro ${partita.b}`);
  nota(Math.round(partita.clock) === 300, `durata scelta applicata (${Math.round(partita.clock)} s)`);
  nota(tocchi <= 4, `dalla home alla partita in ${tocchi} tocchi (3 senza toccare le impostazioni)`);
  // 5. rotazione: durante la partita in verticale c'è l'avviso; nel menu no
  const ruota = await pg.evaluate(() => getComputedStyle(document.getElementById('ruota')).display);
  nota(vp.width > vp.height ? ruota === 'none' : ruota === 'flex', `avviso di rotazione in partita: ${ruota}`);
  // 6. pausa e comandi dalla pausa
  await pg.evaluate(() => { window.__vai(240); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Escape' })); window.__vai(2); });
  const pausa = await pg.evaluate(() => ({ stato: window.__pallanuoto.game.state, vista: document.getElementById('menu').dataset.vista, ruota: getComputedStyle(document.getElementById('ruota')).display }));
  nota(pausa.stato === 'paused' && pausa.vista === 'pausa' && pausa.ruota === 'none', 'pausa: schermata di pausa (anche in verticale, senza avviso di rotazione)');
  await foto(pg, `${tel}-6-pausa`);
  await pg.tap('#vPausa [data-va="comandi"]');
  nota(await pg.evaluate(() => document.querySelectorAll('.comandi li').length) >= 9, 'comandi: raggiungibili anche dalla pausa');
  await foto(pg, `${tel}-4-comandi`);
  await pg.tap('#vComandi [data-indietro]'); await pg.tap('#vPausa [data-va="opzioni"]');
  await foto(pg, `${tel}-5-opzioni`);
  await pg.tap('#vOpzioni [data-indietro]'); await pg.tap('#riprendi');
  nota(await pg.evaluate(() => window.__pallanuoto.game.state !== 'paused' && document.getElementById('menu').style.display === 'none'), 'riprendi: si torna in partita');
  if (pg.errori.length) nota(false, `errori: ${pg.errori.slice(0, 2).join(' | ')}`);
  await pg.context().close();
}
await browser.close(); await new Promise(r => server.httpServer.close(r));
if (!ok) { console.log('\nCi sono problemi.'); process.exit(1); }
console.log('\nTutto a posto.');
