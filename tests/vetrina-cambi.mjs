// Foto da iPhone in orizzontale: barra dei cambi durante il gioco e formazione nella schermata Squadre.
// Uso: node tests/vetrina-cambi.mjs [--no-build]
import { chromium, devices } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4342, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ ...devices['iPhone 15'], viewport: { width: 852, height: 393 }, isMobile: true, hasTouch: true });
const pg = await ctx.newPage();
await pg.addInitScript(() => {
  let a = 31; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = window.__dis; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
// formazione
await pg.evaluate(() => { document.querySelector('[data-va="squadre"]').click(); const b = document.getElementById('rosaBox'); b.open = true; document.querySelector('#rosa [data-posto="2"]').click(); });
await pg.waitForTimeout(500);
await pg.evaluate(() => document.getElementById('rosaBox').scrollIntoView());
await pg.waitForTimeout(300);
await pg.screenshot({ path: path.join(ROOT, 'docs/immagini/formazione.png') });
// barra dei cambi in partita
await pg.evaluate(() => { document.querySelector('#rosa [data-posto="2"]').click(); const H = window.__pallanuoto; H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(900); H.teams[0].players[5].stamina = 0.22; H.teams[0].players[3].stamina = 0.35; H.teams[0].players[4].pf = 2; });
await pg.evaluate(() => { document.getElementById('tCambi').click(); window.__salta(2); window.__raf(performance.now() + 16); });
await pg.waitForTimeout(400);
await pg.screenshot({ path: path.join(ROOT, 'docs/immagini/cambi-in-gioco.png') });
// menu di pausa e schermata «Cambi e panchina»
await pg.evaluate(() => { document.getElementById('cambiBox').classList.remove('on'); const H = window.__pallanuoto; H.teams[0].players[1].scheda.tiriP = 5; H.teams[0].players[1].scheda.gol = 0; H.pausa(); });
await pg.waitForTimeout(600);
await pg.screenshot({ path: path.join(ROOT, 'docs/immagini/pausa.png') });
await pg.evaluate(() => document.getElementById('vaiPanchina').click());
await pg.waitForTimeout(600);
await pg.screenshot({ path: path.join(ROOT, 'docs/immagini/panchina.png') });
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log('fatto');
