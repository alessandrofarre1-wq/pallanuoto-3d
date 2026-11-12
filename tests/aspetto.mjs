// Aspetto dei giocatori in acqua (grafica Cartoon, l'unica dalla v0.22):
//  1) partita simulata computer contro computer: le statistiche si possono salvare e confrontare con quelle di un'altra build,
//     per dimostrare che un cambiamento solo grafico non tocca il gioco (--salva=file.json / --confronta=file.json);
//  2) gambe fuori dall'acqua: durante la partita, per ogni giocatore, quanta parte delle gambe sta sopra la superficie
//     (punti veri del corpo deformato dallo scheletro, non le ossa);
//  3) screenshot con telecamere fisse (iPhone orizzontale e verticale, primi piani di nuoto, verticale e dall'alto),
//     con oggetti disegnati e triangoli, da confrontare prima/dopo (--dist=<build> per fotografare una build già fatta).
// Uso: node tests/aspetto.mjs [cartella di uscita] [--no-build] [--dist=cartella] [--salva=f.json] [--confronta=f.json] [--solo-gioco]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'tests/screenshot/aspetto');
const DIST = arg('dist', ''), SALVA = arg('salva', ''), CONFRONTA = arg('confronta', ''), SOLO_GIOCO = process.argv.includes('--solo-gioco');
fs.mkdirSync(USCITA, { recursive: true });
if (!DIST && !process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: DIST ? { outDir: DIST } : {}, preview: { port: +arg('porta', 4181), host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const init = () => {
  try { localStorage.setItem('pallanuoto-stile', 'cartoon'); } catch (e) { /* build vecchie: lo stile si sceglieva dal menu */ }
  let a = 33; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  performance.now = () => 0; window.__frame = 0;
  window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { window.__frame++; window.__raf(window.__frame * 1000 / 60); } R.render = window.__dis; };
  window.__vai = n => { window.__salta(n - 1); window.__frame++; window.__raf(window.__frame * 1000 / 60); };
};
async function apri(viewport, telefono) {
  const ctx = await browser.newContext(telefono ? { viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport, deviceScaleFactor: 1 });
  const pg = await ctx.newPage(); const errori = [];
  pg.on('pageerror', e => errori.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && /Error/.test(m.text()) && !/Failed to load/.test(m.text())) errori.push(m.text().split('\n')[0]); });
  await pg.addInitScript(init); await pg.goto(server.resolvedUrls.local[0]);
  await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
  await pg.evaluate(() => { const H = window.__pallanuoto; if (H.stile) H.stile.setStile('cartoon'); });
  await pg.addStyleTag({ content: '#fps{display:none!important}' });
  pg.errori = errori; return pg;
}
let ok = true; const nota = (bene, testo) => { console.log(`${bene ? 'OK ' : 'NO '} ${testo}`); if (!bene) ok = false; };

// ---------- 1 e 2: partita simulata + gambe fuori dall'acqua ----------
{
  const pg = await apri({ width: 640, height: 360 }, false);
  const r = await pg.evaluate(() => {
    const H = window.__pallanuoto; H.scegliSquadre('ITA', 'USA'); H.game.autoplay = true; for (const t of H.teams) t.human = false;
    document.querySelector('[data-len="120"]').click(); document.getElementById('goBtn').click();
    // punti delle gambe (osso con il peso maggiore: coscia, gamba, piede) di ogni corpo, uno ogni tre
    const gambe = new Map(); let v = null;
    const puntiGambe = m => { if (gambe.has(m)) return gambe.get(m);
      const g = m.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, ossa = m.skeleton.bones, L = [];
      for (let i = 0; i < si.count; i += 3) { let b = 0, w = -1; for (let k = 0; k < 4; k++) { const wk = sw.getComponent(i, k); if (wk > w) { w = wk; b = si.getComponent(i, k); } }
        if (/^(thigh|calf|foot|ball)_/.test(ossa[b].name)) L.push(i); }
      gambe.set(m, L); return L; };
    const conta = { vert: [0, 0], oriz: [0, 0], mezzo: [0, 0] }; let sopraMax = 0;
    for (let f = 0; f < 60 * 60 * 30 && H.game.state !== 'over'; f++) {
      if (f % 240 === 0) window.__vai(1); else window.__salta(1);
      if (f % 30 !== 15 || H.game.state !== 'play') continue;
      for (const p of H.allPlayers) { const C = p.mesh.corpo; if (!C || !C.radice.visible) continue;
        let m = null; C.radice.traverse(o => { if (o.isSkinnedMesh && !m) m = o; }); if (!m) continue;
        C.radice.updateMatrixWorld(true); m.skeleton.update(); if (!v) v = C.radice.position.clone();
        let su = 0; for (const i of puntiGambe(m)) { m.getVertexPosition(i, v); const w = m.localToWorld(v); if (w.y > su) su = w.y; }
        const o = p.oriz || 0, k = o < 0.2 ? 'vert' : o > 0.8 ? 'oriz' : 'mezzo';
        conta[k][0]++; if (su > 0.01) conta[k][1]++; if (su > sopraMax) sopraMax = su; }
    }
    return { st: JSON.stringify({ fine: H.game.state, st: H.statistiche }), conta, sopraMax };
  });
  if (pg.errori.length) nota(false, `errori: ${pg.errori.slice(0, 2).join(' | ')}`);
  nota(JSON.parse(r.st).fine === 'over', 'partita simulata arrivata alla fine');
  for (const [k, [n, s]] of Object.entries(r.conta)) console.log(`   gambe sopra l'acqua (${k === 'vert' ? 'verticale' : k === 'oriz' ? 'in nuotata' : 'a metà'}): ${s} campioni su ${n} (${n ? Math.round(s / n * 100) : 0}%)`);
  console.log(`   punto delle gambe più alto: ${(r.sopraMax * 100).toFixed(0)} cm sopra la superficie`);
  if (SALVA) { fs.writeFileSync(SALVA, r.st); console.log(`   statistiche salvate in ${SALVA}`); }
  if (CONFRONTA) nota(fs.readFileSync(CONFRONTA, 'utf8') === r.st, `partita simulata identica a quella di ${path.basename(CONFRONTA)}`);
  fs.writeFileSync(path.join(USCITA, 'immersione.json'), JSON.stringify({ conta: r.conta, sopraMax: r.sopraMax }));
  await pg.context().close();
}

// ---------- 3: screenshot con telecamere fisse ----------
if (!SOLO_GIOCO) {
  const costi = [];
  // a: partita a un istante fisso, con la telecamera di gioco; b: primi piani con telecamera messa a mano sul giocatore scelto
  const SCENE = [
    { nome: 'iphone-orizzontale', vp: { width: 844, height: 390 }, tel: true, f: 1500 },
    { nome: 'iphone-verticale', vp: { width: 390, height: 844 }, tel: true, f: 1500 },
    { nome: 'nuoto-lato', vp: { width: 844, height: 390 }, f: 1500, chi: 'oriz', cam: (q) => ({ pos: [q.x + 0.4 * q.fz, 1.1, q.z + 4.2], look: [q.x, -0.1, q.z], fov: 32 }) },
    { nome: 'nuoto-alto', vp: { width: 844, height: 390 }, f: 1500, chi: 'oriz', cam: (q) => ({ pos: [q.x - 0.5, 4.6, q.z + 3.6], look: [q.x, -0.2, q.z], fov: 34 }) },
    { nome: 'verticale-lato', vp: { width: 844, height: 390 }, f: 1500, chi: 'vert', cam: (q) => ({ pos: [q.x + 0.2, 0.9, q.z + 3.6], look: [q.x, 0.0, q.z], fov: 32 }) },
    { nome: 'gruppo-alto', vp: { width: 844, height: 390 }, f: 1500, chi: 'palla', cam: (q) => ({ pos: [q.x - 1, 7.5, q.z + 6.5], look: [q.x, -0.3, q.z], fov: 40 }) }
  ];
  for (const sc of SCENE) {
    const pg = await apri(sc.vp, !!sc.tel);
    const r = await pg.evaluate(({ f, chi, cam }) => {
      const H = window.__pallanuoto; H.scegliSquadre('ITA', 'USA'); H.game.autoplay = true; for (const t of H.teams) t.human = false;
      document.querySelector('[data-len="120"]').click(); document.getElementById('goBtn').click();
      window.__salta(f);
      if (chi) {
        const lista = H.allPlayers.filter(p => !p.isGK);
        const q = chi === 'palla' ? (H.ball.holder || lista[0]) : chi === 'oriz' ? lista.reduce((a, b) => ((b.oriz || 0) > (a.oriz || 0) ? b : a)) : lista.reduce((a, b) => ((b.oriz || 0) < (a.oriz || 0) ? b : a));
        H.vista = new Function('q', 'return (' + cam + ')(q)')(q);
      }
      window.__vai(2);
      const inf = H.renderer.info.render; return { calls: inf.calls, tri: inf.triangles };
    }, { f: sc.f, chi: sc.chi, cam: sc.cam ? sc.cam.toString() : '' });
    await pg.screenshot({ path: path.join(USCITA, sc.nome + '.png') });
    costi.push(`${sc.nome}: ${r.calls} oggetti disegnati, ${Math.round(r.tri / 1000)} mila triangoli`);
    if (pg.errori.length) nota(false, `errori in ${sc.nome}: ${pg.errori.slice(0, 2).join(' | ')}`);
    await pg.context().close();
  }
  for (const c of costi) console.log('   ' + c);
  fs.writeFileSync(path.join(USCITA, 'costi.txt'), costi.join('\n') + '\n');
}
await browser.close(); await new Promise(r => server.httpServer.close(r));
if (!ok) { console.log('\nCi sono problemi.'); process.exit(1); }
console.log('\nTutto a posto.');
