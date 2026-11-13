// Prove della sezione 3 (v0.30): il difensore va incontro al tiratore con il braccio giusto.
// Regola di Ale (vista dal tiratore): braccio sinistro del difensore = palo destro, braccio destro = palo sinistro.
// Uso: node tests/sezione3.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4332, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage();
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 13; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = window.__dis; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'USA'); H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(400); });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };

const r = await pg.evaluate(() => {
  const H = window.__pallanuoto, B = H.ball, MARK = [0, 6, 3, 2, 5, 4, 1];
  const att = H.teams[1].players[3], dir = H.teams[1].dir, gx = 12.5 * dir;
  const d = H.teams[0].players.find(q => MARK[q.i] === att.i);
  H.game.autoplay = true; H.teams[0].human = false; H.__setCtrl(null);
  const casi = [];
  for (const [nome, z, mano] of [['ala a destra del tiratore', 3.2 * dir, 'D'], ['ala a sinistra del tiratore', -3.2 * dir, 'D'], ['centrale destro', 0, 'D'], ['centrale mancino', 0, 'S']]) {
    att.mano = mano; H.regole.giveBall(att); H.game.state = 'play'; H.game.after = null;
    for (const q of H.allPlayers) { q.excluded = false; q.stunUntil = 0; q.pressatoUntil = 0; }
    d.x = gx - dir * 4.0; d.z = z * 0.8; d.vx = d.vz = 0;
    let dz = 0;
    for (let i = 0; i < 150; i++) {      // 1,5 s con la palla in mano, poi 1 s di carica del tiro
      att.x = gx - dir * 6.5; att.z = z; att.vx = att.vz = 0; att.fx = dir; att.fz = 0;
      att.act = i < 90 ? null : (att.act || { kind: 'shot', t: 0.05, wind: 99, frusta: 0.17, done: false, fn: () => {} }); att.decideT = 99; att.pressatoUntil = 0;
      if (B.holder !== att) H.regole.giveBall(att);
      window.__salta(1);
    }
    dz = d.z - att.z;
    // mano alzata nel disegno: quale delle due è più alta e da che parte sta
    const o = d.mesh.corpo.ossa;
    const pos = b => { const w = b.getWorldPosition(new b.position.constructor()); return { y: w.y, z: w.z }; };
    const mD = pos(o.manoD), mS = pos(o.manoS);
    const palo = H.muro.paloCoperto(att), lato = palo === dir ? 'destro' : 'sinistro';      // visto dal tiratore (destra = +z se attacca verso +x)
    const braccio = H.muro.braccioMuro(d, att), alzata = mD.y > mS.y ? 'D' : 'S', alzataZ = (alzata === 'D' ? mD.z : mS.z) - d.z;
    att.act = null;
    casi.push({ nome, palo, lato, braccio, alzata, alzataY: Math.max(mD.y, mS.y), alzataZ, dz, distanza: Math.hypot(d.x - att.x, d.z - att.z) });
    window.__salta(30);
  }
  return casi;
});
for (const c of r) {
  const atteso = c.lato === 'destro' ? 'S' : 'D';
  prova(c.braccio === atteso && c.alzata === atteso, `${c.nome}: palo ${c.lato} coperto → braccio ${c.braccio === 'D' ? 'destro' : 'sinistro'} (alzato nel disegno: ${c.alzata === 'D' ? 'destro' : 'sinistro'}, mano a ${c.alzataY.toFixed(2)} m)`);
  prova(Math.sign(c.alzataZ) === c.palo, `${c.nome}: la mano alzata sta dalla parte del palo coperto (${c.alzataZ.toFixed(2)} m)`);
  prova(c.distanza < 1.7, `${c.nome}: il difensore va incontro al tiratore (a ${c.distanza.toFixed(2)} m)`);
}
const cen = r.filter(c => c.nome.startsWith('centrale'));
prova(cen.every(c => Math.sign(c.dz) === c.palo), `tiratore centrale: il difensore si sposta verso il palo da coprire (${cen.map(c => c.dz.toFixed(2)).join(' / ')} m)`);
prova(cen[0].palo !== cen[1].palo, 'tiratore centrale: destro e mancino fanno coprire pali diversi');
// foto ravvicinate (vista da dietro il tiratore, come la vede chi tira): docs/immagini/muro-braccio.png
if (process.argv.includes('--foto')) {
  const foto = [];
  for (let k = 0; k < 4; k++) {
    await pg.evaluate(k => {
      const H = window.__pallanuoto, B = H.ball, MARK = [0, 6, 3, 2, 5, 4, 1];
      const att = H.teams[1].players[3], dir = H.teams[1].dir, gx = 12.5 * dir, d = H.teams[0].players.find(q => MARK[q.i] === att.i);
      const [z, mano] = [[3.2 * dir, 'D'], [-3.2 * dir, 'D'], [0, 'D'], [0, 'S']][k];
      att.mano = mano; H.regole.giveBall(att); H.game.state = 'play'; H.game.after = null; att.act = null;
      d.x = gx - dir * 4.0; d.z = z * 0.8;
      for (let i = 0; i < 150; i++) {
        att.x = gx - dir * 6.5; att.z = z; att.vx = att.vz = 0; att.decideT = 99; att.pressatoUntil = 0;
        att.act = i < 90 ? null : (att.act || { kind: 'shot', t: 0.05, wind: 99, frusta: 0.17, done: false, fn: () => {} });
        if (B.holder !== att) H.regole.giveBall(att);
        window.__salta(1);
      }
      H.vista = { pos: [att.x - dir * 3.4, 3.6, att.z], look: [d.x, 0.3, d.z], fov: 42 };
      window.__salta(1); H.__ridisegna(); H.vista = null; att.act = null;
    }, k);
    foto.push((await pg.locator('canvas').first().screenshot()).toString('base64'));
  }
  const nomi = ['Ala a destra del tiratore → braccio SINISTRO (palo destro)', 'Ala a sinistra → braccio DESTRO (palo sinistro)', 'Centrale destro → braccio SINISTRO (palo destro)', 'Centrale mancino → braccio DESTRO (palo sinistro)'];
  const pf = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await pf.setContent(`<body style="margin:0;background:#111;color:#fff;font:600 18px system-ui;display:grid;grid-template-columns:1fr 1fr;gap:6px">${foto.map((f, i) => `<div><div style="padding:6px">${nomi[i]}</div><img style="width:100%" src="data:image/png;base64,${f}"></div>`).join('')}</body>`);
  await pf.screenshot({ path: path.join(ROOT, 'docs/immagini/muro-braccio.png'), fullPage: true });
}
if (errori.length) prova(false, 'errori: ' + errori.slice(0, 2).join(' | '));
await browser.close(); await new Promise(res => server.httpServer.close(res));
console.log(ok ? '\nSezione 3: tutte le prove superate' : '\nSezione 3: prove NON superate');
process.exit(ok ? 0 : 1);
