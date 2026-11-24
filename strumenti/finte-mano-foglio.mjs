// Palmo e palla lungo la finta (v0.87, Ale: «se la palla sta dietro la testa il palmo della mano deve essere rivolto verso l'alto,
// come se il giocatore tenesse la palla su un vassoio; se la finta supera la testa e va in avanti l'unico modo per tenere la palla è
// ruotare il polso e mettere il palmo rivolto verso il basso con la palla attaccata»).
// Segue la finta fotogramma per fotogramma, del computer (gesto procedurale, quattro forme) e del giocatore che tiene TIRO (posa
// Plask con la finta sovrapposta), e misura nel sistema del giocatore (avanti = verso la porta, su = verticale):
//   - palla: quanto sta davanti (+) o dietro (−) alla testa e quanto sopra;
//   - palmo: la sua direzione (su = +1 palmo al cielo, −1 palmo in giù; avanti = +1 palmo verso la porta);
//   - presa: la palla disegnata sta sul lato del palmo (distanza dal palmo lungo la normale).
// Scrive un foglio di foto di lato in sei momenti e un file JSON con le misure.
// Uso: node strumenti/finte-mano-foglio.mjs [uscita.png] [--no-build] [--dist=<build>] [--porta=4345] [--json=misure.json]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=').slice(1).join('=') : d; };
const USCITA = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'docs/immagini/v087-finte-mano.png');
if (!process.argv.includes('--no-build') && !arg('dist', '')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: arg('dist', '') ? { outDir: arg('dist', '') } : {}, preview: { port: +arg('porta', 4345), host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 480, height: 400 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 5; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__pad = { buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0] };
  Object.defineProperty(navigator, 'getGamepads', { value: () => [window.__pad] });
  window.__salta = n => { const R = window.__pallanuoto.renderer; if (!window.__dis) window.__dis = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = window.__dis; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.game.autoplay = true; for (const t of H.teams) t.human = false; H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(200); document.body.classList.add('foto'); });
await pg.addStyleTag({ content: 'body.foto #hud, body.foto #touch, body.foto #player, body.foto #schemi, body.foto #cronaca, body.foto #qte, body.foto #tLog, body.foto #pauseBtn, body.foto .tb, body.foto #fps, body.foto #menu { display:none !important }' });
// scene: tre forme del computer avanti e indietro, due di lato (nei due sensi), poi la tenuta del giocatore (Plask)
const SCENE = [
  { nome: 'computer · avanti e indietro · larga · braccio dritto', largo: 0.9, piegato: false, lato: 0 },
  { nome: 'computer · avanti e indietro · stretta · braccio dritto', largo: 0.1, piegato: false, lato: 0 },
  { nome: 'computer · avanti e indietro · stretta · braccio piegato', largo: 0.1, piegato: true, lato: 0 },
  { nome: 'computer · da destra a sinistra · larga · dritto', largo: 0.9, piegato: false, lato: 1 },
  { nome: 'computer · da sinistra a destra · larga · dritto', largo: 0.9, piegato: false, lato: -1 },
  { nome: 'giocatore che tiene TIRO · larga · dritto', largo: 0.9, piegato: false, lato: 0, umano: true },
  { nome: 'giocatore che tiene TIRO · stretta · piegato', largo: 0.1, piegato: true, lato: 0, umano: true },
];
const risultati = [];
for (const sc of SCENE) {
  risultati.push(await pg.evaluate(sc => {
    const H = window.__pallanuoto, B = H.ball, A = H.teams[0], g = H.game;
    H.replay?.interrompiReplay?.();
    window.__pad.buttons.forEach(b => { b.pressed = false; b.value = 0; }); window.__pad.axes = [0, 0];
    g.state = 'play'; g.after = null; g.penalty = null; H.fight.active = false;
    for (const t of H.teams) t.human = !!sc.umano && t === A;
    g.autoplay = !sc.umano; if (sc.umano) { window.dispatchEvent(new Event('blur')); document.activeElement?.blur(); }
    for (const q of H.allPlayers) { q.act = null; q.excluded = false; q.charging = false; q.chargeT = 0; q.decideT = 99; q.reazioneT = 99; q.x = -6 + q.i; q.z = (q.team === A ? 6 : -6); q.vx = q.vz = 0; q.oriz = 0; q.stunUntil = g.time + 99; q.tackleCD = 99; q.colpi = []; }
    const p = A.players[4], gx = 12.5 * A.dir; p.scheda = { ...p.scheda, finta: 'larga' }; p.mano = 'D';
    const tieni = () => { p.x = gx - A.dir * 6; p.z = 0; p.fx = A.dir; p.fz = 0; p.vx = p.vz = 0; p.oriz = 0; p.decideT = 99; p.stunUntil = 0; if (!sc.umano) p.fintaPronto = g.time + 99; if (B.holder !== p) H.regole.giveBall(p); };
    tieni(); if (sc.umano) H.__setCtrl(p); for (let i = 0; i < 40; i++) { tieni(); window.__salta(1); }
    window.__formaFinta = { largo: sc.largo, piegato: sc.piegato, lato: sc.lato };
    Object.assign(p, { fakeCount: 0, ultimoLatoFinta: 0 });
    const C = p.mesh.corpo, lato = 'D', presa = C.prese[lato], testa = C.ossa.testa;
    const q = presa.quaternion.clone(), vp = presa.position.clone(), vt = presa.position.clone();
    const misura = () => {
      presa.getWorldPosition(vp); testa.getWorldPosition(vt); presa.getWorldQuaternion(q);
      const n = C.normaliPrese[lato].clone().applyQuaternion(q).normalize();
      const fx = p.fx, fz = p.fz, av = v => v[0] * fx + v[2] * fz;
      const b = p.ballVistaW;
      return {
        palmoSu: +n.y.toFixed(3), palmoAvanti: +(n.x * fx + n.z * fz).toFixed(3),
        manoAvanti: +av([vp.x - vt.x, 0, vp.z - vt.z]).toFixed(3), manoSopra: +(vp.y - vt.y).toFixed(3),
        pallaAvanti: b ? +av([b[0] - vt.x, 0, b[2] - vt.z]).toFixed(3) : null, pallaSopra: b ? +(b[1] - vt.y).toFixed(3) : null,
        // la palla sta sul lato del palmo: distanza del centro della palla dalla mano lungo la normale del palmo
        sulPalmo: b ? +((b[0] - vp.x) * n.x + (b[1] - vp.y) * n.y + (b[2] - vp.z) * n.z).toFixed(3) : null,
      };
    };
    const camera = { pos: [p.x - A.dir * 0.2, 1.15, p.z + 2.6], look: [p.x + A.dir * 0.15, 0.85, p.z], fov: 34 };
    const fot = () => { H.vista = camera; window.__salta(1); H.__ridisegna(); const url = H.renderer.domElement.toDataURL('image/png'); return url.split(',')[1]; };
    const serie = [], foto = [];
    if (!sc.umano) {
      // carica come nel gioco (la finta del computer parte dalla posa con la palla in mano)
      H.prova.startAct(p, 'fake', 0.16, () => {}); if (!sc.lato) p.fintaLatoGesto = 0;
      const a = p.act, fine = a.wind + a.frusta + (a.recupero ?? 0.36);
      const momenti = [0.6 * a.wind, a.wind, a.wind + a.frusta * 0.5, a.wind + a.frusta, a.wind + a.frusta + (a.recupero ?? 0.36) * 0.4, fine - 0.02];
      let m = 0;
      while (a.t < fine && p.act === a) {
        tieni(); p.act = a; window.__salta(1);
        serie.push({ t: +a.t.toFixed(3), fase: a.t < a.wind ? 'preparazione' : a.t < a.wind + a.frusta ? 'accenno' : 'ritorno', ...misura() });
        if (m < momenti.length && a.t >= momenti[m] - 1e-6) { foto.push({ t: +a.t.toFixed(2), fase: serie.at(-1).fase, png: fot() }); H.vista = null; m++; }
      }
    } else {
      // il giocatore tiene TIRO: carica (Plask) e finte automatiche dopo la piena carica
      window.__pad.buttons[2] = { pressed: true, value: 1 };
      let ultimo = null, tFinta = null; const t0 = g.time;
      for (let f = 0; f < 150; f++) {
        tieni(); window.__salta(1);
        const a = p.act, t = g.time - t0;
        if (a?.kind === 'fake' && a !== ultimo) { ultimo = a; tFinta = { a, momenti: [0, a.wind, a.wind + a.frusta * 0.5, a.wind + a.frusta, a.wind + a.frusta + (a.recupero ?? 0.36) * 0.4, a.wind + a.frusta + (a.recupero ?? 0.36) - 0.02], m: 0 }; }
        const fase = a?.kind === 'fake' ? (a.t < a.wind ? 'preparazione' : a.t < a.wind + a.frusta ? 'accenno' : 'ritorno') : 'carica';
        serie.push({ t: +t.toFixed(3), fase, ...misura() });
        if (tFinta && a === tFinta.a && tFinta.m < tFinta.momenti.length && a.t >= tFinta.momenti[tFinta.m] - 1e-6 && foto.length < 6) { foto.push({ t: +a.t.toFixed(2), fase, png: fot() }); H.vista = null; tFinta.m++; }
      }
      window.__pad.buttons[2] = { pressed: false, value: 0 };
      for (const t of H.teams) t.human = false;
      g.autoplay = true; p.act = null; p.charging = false; p.chargeT = 0;
    }
    window.__formaFinta = null; H.vista = null;
    return { nome: sc.nome, serie, foto };
  }, sc));
}
// riepilogo: dove sta la palla e dove guarda il palmo
const riassunto = risultati.map(r => {
  const dietro = r.serie.filter(s => s.pallaAvanti != null && s.pallaAvanti < -0.04), davanti = r.serie.filter(s => s.pallaAvanti != null && s.pallaAvanti > 0.10);
  const media = (xs, k) => xs.length ? +(xs.reduce((s, x) => s + x[k], 0) / xs.length).toFixed(2) : null;
  const maxDavanti = Math.max(...r.serie.map(s => s.pallaAvanti ?? -9));
  return { nome: r.nome, fotogrammi: r.serie.length, dietro: dietro.length, palmoSuDietro: media(dietro, 'palmoSu'), davanti: davanti.length, palmoSuDavanti: media(davanti, 'palmoSu'),
    pallaPiuAvanti: +maxDavanti.toFixed(2), palmoSuMinimo: Math.min(...r.serie.map(s => s.palmoSu)), palmoSuMassimo: Math.max(...r.serie.map(s => s.palmoSu)),
    sulPalmoMinimo: Math.min(...r.serie.filter(s => s.sulPalmo != null).map(s => s.sulPalmo)) };
});
console.table(riassunto);
if (arg('json', '')) fs.writeFileSync(arg('json', ''), JSON.stringify({ riassunto, scene: risultati.map(r => ({ nome: r.nome, serie: r.serie })) }, null, 1));
const righe = risultati.map(r => `<div class="riga"><b class="nome">${r.nome}</b>${r.foto.map(f => `<div class="f"><img src="data:image/png;base64,${f.png}"><i>${f.fase} ${f.t.toFixed(2)} s</i></div>`).join('')}</div>`).join('');
const pf = await browser.newPage({ viewport: { width: 1440, height: 400 } });
await pf.setContent(`<body style="margin:0;background:#111;color:#fff;font:600 14px system-ui"><style>.riga{display:grid;grid-template-columns:repeat(6,1fr);gap:3px;margin-bottom:6px;position:relative}.nome{position:absolute;left:6px;top:4px;z-index:2;text-shadow:0 1px 3px #000}.f{position:relative}.f img{width:100%;display:block}.f i{position:absolute;left:6px;bottom:4px;font-style:normal;text-shadow:0 1px 3px #000}</style>${righe}</body>`);
await pf.screenshot({ path: USCITA, fullPage: true });
if (errori.length) console.log('errori: ' + errori.slice(0, 2).join(' | '));
await browser.close(); await new Promise(r => server.httpServer.close(r));
console.log('foglio: ' + USCITA);
