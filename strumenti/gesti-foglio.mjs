// FOGLI A TRE LATI DEI GESTI (v0.63, punto 11 della lista di Ale): passaggio, ricezione, palombella, beduina, parata, muro e nuoto
// con palla, ognuno messo in scena da solo vicino alla porta e fotografato da davanti, di lato e da dietro in sei momenti del gesto,
// con le misure del corpo disegnato (angolo dei gomiti, altezza di mani, testa e bacino, punto più alto delle gambe, distanza tra la
// palla disegnata e il palmo). Solo per guardare e confrontare prima e dopo: la scena è preparata a mano, con il caso bloccato.
// Uso: node strumenti/gesti-foglio.mjs [--dist=dist] [--porta=4528] [--uscita=docs/immagini] [--tag=prima] [--solo=passaggio,parata]
// Scrive un foglio JPEG per gesto (v063-<gesto>-<tag>.jpg) e le misure (v063-gesti-<tag>.json).
//      [--foto=cartella] salva anche le singole foto (per ingrandirle)
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => process.argv.find(x => x.startsWith('--' + k + '='))?.slice(k.length + 3);
const dist = arg('dist'), porta = +(arg('porta') || 4528), uscita = path.resolve(ROOT, arg('uscita') || 'docs/immagini'), tag = arg('tag') || 'prima';
const GESTI = ['passaggio', 'ricezione', 'palombella', 'beduina', 'parata', 'muro', 'nuoto'];
const solo = arg('solo') ? arg('solo').split(',') : GESTI;
if (!dist && !process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', build: { outDir: dist || 'dist' }, preview: { port: porta, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 640, height: 420 } });
const errori = []; pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let s = 61; window.__rnd = () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__passo = () => { now += 1000 / 60; window.__raf(now); };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 120000, polling: 100 });
await pg.evaluate(() => {
  const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click();
  for (const t of H.teams) t.human = false; H.game.autoplay = true; for (let i = 0; i < 240; i++) window.__passo();
});

// una scena: attori fermi al loro posto a ogni fotogramma, tutti gli altri parcheggiati lontano; il gesto parte e scorre con i
// tempi del gioco; ogni «momento» si fotografa al primo fotogramma in cui la sua condizione è vera
const risultati = {};
for (const gesto of solo) {
  const r = await pg.evaluate(gesto => {
    const H = window.__pallanuoto, A = H.teams[0], D = H.teams[1], B = H.ball, P = H.prova, R = H.regole, C = H.camera;
    const gx = 12.5 * A.dir, gkD = D.players[0];
    const pausa = gesto === 'nuoto';
    H.replay.interrompiReplay(); H.game.penalty = null; H.game.after = null; H.fight.active = false;
    H.game.state = pausa ? 'paused' : 'play';
    const attori = new Map();      // giocatore -> posto fisso {x, z, fx, fz, oriz, v}
    const metti = (q, x, z, fx, fz, oriz = 0, v = 0) => attori.set(q, { x, z, fx, fz, oriz, v });
    // posti delle scene (A attacca la porta in gx; il portiere di D sta in porta)
    const pas = A.players[4], ric = A.players[5], boa = A.players[1], dif = D.players[6], tir = A.players[3];
    metti(gkD, gx - A.dir * 0.6, 0, -A.dir, 0);
    let attore, momenti, avvio;
    // telecamere rispetto all'attore: [metri in avanti, metri alla sua destra, altezza]; alcune scene le spostano perché un altro
    // giocatore, la porta o la palla in volo non coprano il gesto
    let camere = { 'davanti': [3.1, 0.5, 1.05], 'di lato': [0.3, 3.2, 0.95], 'da dietro': [-2.9, -0.8, 1.35] };
    if (gesto === 'passaggio' || gesto === 'ricezione') {
      metti(pas, gx - A.dir * 7, 2.6, A.dir, 0); metti(ric, gx - A.dir * 7.4, -3.4, A.dir, 0);
      attore = gesto === 'passaggio' ? pas : ric;
      if (gesto === 'ricezione') camere['di lato'] = [0.3, -3.2, 0.95];      // dal lato opposto a quello da cui arriva la palla
      avvio = () => P.startAct(pas, 'pass', 0.08, () => P.doPass(pas, ric), [ric.x, ric.z]);
      momenti = gesto === 'passaggio' ? [
        ['palla in mano', s => s.f === 0],
        ['carica a metà', s => pas.act && pas.act.t >= 0.04],
        ['carica piena', s => pas.act && pas.act.t >= 0.08],
        ['rilascio', s => B.state === 'flight'],
        ['accompagnamento', s => s.volo >= 0.12],
        ['chiusura', s => s.volo >= 0.36],
      ] : [
        ['attesa', s => s.f === 0],
        ['palla partita', s => s.volo >= 0.1],
        ['a metà strada', s => s.volo >= 0.25],
        ['sta per arrivare', s => s.volo >= 0.4],
        ['presa', s => B.holder === ric],
        ['dopo la presa', s => s.dopoPresa >= 0.2],
      ];
    } else if (gesto === 'palombella') {
      metti(tir, gx - A.dir * 6.5, 1.0, A.dir, 0); attore = tir;
      avvio = () => P.startAct(tir, 'lob', 0.1, () => P.doShoot(tir, 0.45, true, null));
      momenti = [['palla in mano', s => s.f === 0], ['carica a metà', s => tir.act && tir.act.t >= 0.05], ['carica piena', s => tir.act && tir.act.t >= 0.1],
        ['rilascio', s => B.state === 'flight'], ['accompagnamento', s => s.volo >= 0.12], ['chiusura', s => s.volo >= 0.36]];
    } else if (gesto === 'beduina') {
      metti(boa, gx - A.dir * 2.7, 0.4, -A.dir, 0); metti(dif, gx - A.dir * 1.6, 0.3, -A.dir, 0); attore = boa;
      camere['da dietro'] = [-2.2, -1.8, 2.4];      // dietro c'è il difensore: dall'alto
      avvio = () => P.startAct(boa, 'beduina', 0.16, () => P.doShoot(boa, 0.7, false, null));
      momenti = [['palla in mano', s => s.f === 0], ['carica a metà', s => boa.act && boa.act.t >= 0.08], ['carica piena', s => boa.act && boa.act.t >= 0.16],
        ['rilascio', s => B.state === 'flight'], ['accompagnamento', s => s.volo >= 0.12], ['chiusura', s => s.volo >= 0.36]];
    } else if (gesto === 'parata') {
      metti(tir, gx - A.dir * 7, -1.4, A.dir, 0); attore = gkD;
      camere = { 'davanti': [3.4, -1.8, 1.3], 'di lato': [0.4, 3.2, 1.0], 'da dietro': [-2.3, 0.5, 2.2] };      // fuori dalla linea del tiro; da dietro sopra la rete
      avvio = () => P.startAct(tir, 'shot', 0.3, () => P.doShoot(tir, 0.95, false, 0.85));
      momenti = [['tiratore fermo', s => s.f === 0], ['carica del tiro', s => tir.act && tir.act.t >= 0.25], ['rilascio', s => B.state === 'flight'],
        ['palla a metà', s => s.volo >= 0.1], ['palla vicina', s => s.volo >= 0.2], ['arrivo', s => s.volo >= 0.28 || (s.volo > 0 && B.state !== 'flight')]];
    } else if (gesto === 'muro') {
      metti(tir, gx - A.dir * 6.5, 0.8, A.dir, 0); metti(dif, gx - A.dir * 5.5, 0.95, -A.dir, 0); attore = dif;
      camere['davanti'] = [2.3, -2.3, 1.5];      // davanti c'è il tiratore: di tre quarti
      avvio = () => P.startAct(tir, 'shot', 0.36, () => P.doShoot(tir, 0.9, false, -0.6));
      momenti = [['marca', s => s.f === 0], ['carica 30%', s => tir.act && tir.act.t >= 0.11], ['carica 70%', s => tir.act && tir.act.t >= 0.25],
        ['carica piena', s => tir.act && tir.act.t >= 0.36], ['rilascio', s => B.state === 'flight' || s.volo > 0], ['dopo il tiro', s => s.volo >= 0.2]];
    } else {
      // nuoto con palla: a gioco fermo (come npm run gesti) per avere la bracciata intera senza che il gioco lo muova
      metti(pas, gx - A.dir * 9, 1.5, A.dir, 0, 1, 1.8); attore = pas; avvio = null;
      const fase0 = () => window.__fase0;
      momenti = [0, 1, 2, 3, 4, 5].map(k => [`bracciata ${k}/6`, () => ((pas.phase - fase0()) / (2 * Math.PI)) >= k / 6]);
    }
    const tieni = () => {
      for (const q of H.allPlayers) {
        q.colpi = []; q.tackleCD = 99; q.stunUntil = 0; q.cut = null; q.excluded = false; q.pressatoUntil = 0;
        const a = attori.get(q);
        if (a) { q.x = a.x; q.z = a.z; q.fx = a.fx; q.fz = a.fz; q.vx = a.fx * a.v; q.vz = a.fz * a.v; q.oriz = a.oriz; q.decideT = 99; q.reazioneT = 99; if (!q.act) q.charging = false; }
        else { const i = H.allPlayers.indexOf(q); q.x = -A.dir * (3 + (i % 7) * 1.3); q.z = -8.7 + Math.floor(i / 7) * 1.4; q.vx = q.vz = 0; q.oriz = 0; q.decideT = 99; q.act = null; q.charging = false; }
      }
      H.fight.active = false; H.game.shot = 25;
    };
    // prima della scena: tutti fermi, la palla a chi deve averla, un secondo per assestare pose e smussamenti
    for (const q of H.allPlayers) { q.act = null; q.charging = false; q.J = null; q.palmi = null; q.spina = null; q.bracciaVista = null; q.inclVert = undefined; }
    const portatore = gesto === 'beduina' ? boa : gesto === 'parata' || gesto === 'muro' || gesto === 'palombella' ? tir : pas;
    tieni(); R.giveBall(portatore);
    if (pausa) { B.state = 'held'; B.holder = portatore; }
    for (let i = 0; i < 60; i++) { tieni(); window.__passo(); }
    window.__fase0 = pas.phase;
    const foto = [], misure = [], viste = [];
    let volo = 0, presaT = null, f = 0, partito = false, fischio = null;
    const v3 = new C.position.constructor();
    const misura = () => {
      const O = attore.mesh.corpo?.ossa; if (!O) return null;
      const w = o => o.getWorldPosition(new C.position.constructor());
      const gomito = s => { const S = w(O['brac' + s]), E = w(O['avam' + s]), M = w(O['mano' + s]); const a = S.sub(E).normalize(), b = M.sub(E).normalize(); return Math.round(Math.acos(Math.max(-1, Math.min(1, a.dot(b)))) * 180 / Math.PI); };
      const y = o => +w(o).y.toFixed(2);
      const gambe = Math.max(...['gambaD', 'gambaS', 'piedeD', 'piedeS', 'puntaD', 'puntaS'].map(k => w(O[k]).y));
      let palla = null;
      if (B.holder === attore && attore.ballVistaW) { const m = w(attore.mano === 'S' ? O.manoS : O.manoD); palla = +Math.hypot(m.x - attore.ballVistaW[0], m.y - attore.ballVistaW[1], m.z - attore.ballVistaW[2]).toFixed(2); }
      // compenetrazioni (approssimate sulle ossa): palla disegnata contro teste e busti degli altri; mani dell'attore contro la propria
      // testa e contro teste e busti degli altri. Centro della testa = osso della testa + 0,1 m in su.
      const testaC = q => { const t = q.mesh.corpo?.ossa?.testa; if (!t) return null; const v = w(t); v.y += 0.1; return v; };
      const busto = q => { const b = q.mesh.corpo?.ossa?.bacino; const t = q.mesh.corpo?.ossa?.testa; if (!b || !t) return null; return w(b).lerp(w(t), 0.6); };
      const altri = H.allPlayers.filter(q => q !== attore && !q.excluded && Math.hypot(q.x - attore.x, q.z - attore.z) < 3);
      const bp = H.ball3d.position; let pallaCorpo = 9;
      for (const q of altri.concat(B.holder === attore ? [] : [attore])) { const tc = testaC(q), bc = busto(q);
        if (tc) pallaCorpo = Math.min(pallaCorpo, tc.distanceTo(bp) - 0.26); if (bc) pallaCorpo = Math.min(pallaCorpo, bc.distanceTo(bp) - 0.30); }
      const mani = [w(O.manoD), w(O.manoS)], mia = testaC(attore); let manoTesta = 9, manoAltri = 9;
      for (const m of mani) { if (mia) manoTesta = Math.min(manoTesta, m.distanceTo(mia) - 0.12);
        for (const q of altri) { const tc = testaC(q), bc = busto(q); if (tc) manoAltri = Math.min(manoAltri, m.distanceTo(tc) - 0.12); if (bc) manoAltri = Math.min(manoAltri, m.distanceTo(bc) - 0.2); } }
      const lotta = H.fight.active ? (H.fight.boa === attore ? 'boa' : H.fight.def === attore ? 'difensore' : 'altri') : null;
      return { gomitoD: gomito('D'), gomitoS: gomito('S'), manoD: y(O.manoD), manoS: y(O.manoS), testa: y(O.testa), bacino: y(O.bacino), gambe: +gambe.toFixed(2), palla,
        pallaCorpo: +pallaCorpo.toFixed(2), manoTesta: +manoTesta.toFixed(2), manoAltri: +manoAltri.toFixed(2), lotta, inAcqua: +(attore.pallaAcquaVista || 0).toFixed(2) };
    };
    const scatta = (nome) => {
      const P0 = { x: attore.x, z: attore.z }, fx = attore.fx, fz = attore.fz, rx = -fz, rz = fx;
      const cam = Object.entries(camere).map(([nome, [av, de, al]]) => [nome, [P0.x + fx * av + rx * de, al, P0.z + fz * av + rz * de]]);
      for (const q of H.allPlayers) if (q.mesh.spr) q.mesh.spr.visible = false;      // niente numeri sopra le teste nelle foto
      const fov = C.fov, img = cam.map(([, pos]) => { C.position.set(...pos); C.fov = 48; C.updateProjectionMatrix(); C.lookAt(P0.x, 0.5, P0.z); C.updateMatrixWorld(true); H.__ridisegna(); return H.renderer.domElement.toDataURL('image/jpeg', 0.88); });
      C.fov = fov; C.updateProjectionMatrix();
      for (const q of H.allPlayers) if (q.mesh.spr) q.mesh.spr.visible = true;
      foto.push({ nome, img, t: +(f / 60).toFixed(2), misure: misura() }); viste.push(cam.map(c => c[0]));
    };
    let m = 0;
    for (; f < 200 && m < momenti.length; f++) {
      if (f === 1 && avvio) { avvio(); partito = true; }
      if (B.state === 'flight' || volo > 0) volo += 1 / 60;
      if (B.holder === ric && presaT == null && gesto === 'ricezione') presaT = f;
      const s = { f, volo: B.state === 'flight' || volo > 0 ? volo : 0, dopoPresa: presaT == null ? -1 : (f - presaT) / 60 };
      while (m < momenti.length && momenti[m][1](s)) { scatta(momenti[m][0]); m++; }
      if (m >= momenti.length) break;
      tieni(); window.__passo();
      if (!pausa && H.game.state !== 'play' && !fischio) fischio = `stato ${H.game.state} al fotogramma ${f}`;
      H.replay.interrompiReplay();
    }
    misure.push(...foto.map(x => x.misure));
    return { foto: foto.map(({ nome, img, t, misure }) => ({ nome, img, t, misure })), mancanti: momenti.slice(m).map(x => x[0]), fischio, partito, attore: `${attore.team.codice} ${attore.num} ${attore.isGK ? 'portiere' : ''}`.trim() };
  }, gesto);
  risultati[gesto] = r;
  console.log(`${gesto}: ${r.foto.length} momenti${r.mancanti.length ? ' (mancano: ' + r.mancanti.join(', ') + ')' : ''}${r.fischio ? ' · ' + r.fischio : ''}`);
  for (const x of r.foto) console.log(`   ${x.nome.padEnd(18)} ${String(x.t).padStart(5)} s  ${JSON.stringify(x.misure)}`);
}

// un foglio per gesto: righe = davanti, di lato, da dietro; colonne = i sei momenti; sotto le misure
fs.mkdirSync(uscita, { recursive: true });
const p2 = await browser.newPage({ viewport: { width: 2400, height: 400 } });
const cartellaFoto = arg('foto') ? path.resolve(ROOT, arg('foto')) : null;
if (cartellaFoto) fs.mkdirSync(cartellaFoto, { recursive: true });
for (const [gesto, r] of Object.entries(risultati)) {
  const lati = ['davanti', 'di lato', 'da dietro'];
  if (cartellaFoto) r.foto.forEach((x, i) => x.img.forEach((d, v) => fs.writeFileSync(path.join(cartellaFoto, `${gesto}-${tag}-${i}-${['davanti', 'lato', 'dietro'][v]}.jpg`), Buffer.from(d.split(',')[1], 'base64'))));
  const mis = x => x.misure ? `gomiti ${x.misure.gomitoD}°/${x.misure.gomitoS}° · mani ${x.misure.manoD}/${x.misure.manoS} m · testa ${x.misure.testa} · bacino ${x.misure.bacino} · gambe ${x.misure.gambe}${x.misure.palla != null ? ' · palla-palmo ' + x.misure.palla : ''}` : '';
  const html = `<body style="margin:0;background:#0b1b29;font:600 17px system-ui;color:#fff">
    <div style="padding:8px 12px;font-size:22px">${gesto.toUpperCase()} · ${r.attore} · ${tag} · un fotogramma per momento, tre lati</div>
    <div style="display:grid;grid-template-columns:110px repeat(${r.foto.length},1fr);gap:4px;padding:0 6px 6px">
      <div></div>${r.foto.map(x => `<div style="padding:2px 4px">${x.nome} · ${x.t} s</div>`).join('')}
      ${lati.map((l, v) => `<div style="writing-mode:vertical-rl;transform:rotate(180deg);text-align:center;padding:4px">${l}</div>${r.foto.map(x => `<img src="${x.img[v]}" style="width:100%;display:block">`).join('')}`).join('')}
      <div></div>${r.foto.map(x => `<div style="font:500 13px system-ui;padding:2px 4px;color:#bcd">${mis(x)}</div>`).join('')}
    </div></body>`;
  await p2.setContent(html); await p2.waitForTimeout(200);
  const file = path.join(uscita, `v063-${gesto}-${tag}.jpg`);
  await p2.screenshot({ path: file, fullPage: true, type: 'jpeg', quality: 82 });
  console.log('foglio: ' + path.relative(ROOT, file));
}
// foglio riassuntivo: una riga per gesto, con la vista che lo mostra meglio
{ const vista = { passaggio: 0, ricezione: 0, palombella: 1, beduina: 0, parata: 0, muro: 1, nuoto: 1 }, lati = ['davanti', 'di lato', 'da dietro'];
  const righe = Object.entries(risultati).map(([g, r]) => `<div style="writing-mode:vertical-rl;transform:rotate(180deg);text-align:center;padding:4px;font-size:15px">${g}<br>${lati[vista[g] ?? 0]}</div>${r.foto.map(x => `<div style="position:relative"><img src="${x.img[vista[g] ?? 0]}" style="width:100%;display:block"><span style="position:absolute;left:4px;top:2px;font-size:13px;background:#0009;padding:1px 4px">${x.nome} · ${x.t} s</span></div>`).join('')}`).join('');
  await p2.setContent(`<body style="margin:0;background:#0b1b29;font:600 17px system-ui;color:#fff"><div style="padding:8px 12px;font-size:22px">I sette gesti · ${tag} · sei momenti ciascuno</div><div style="display:grid;grid-template-columns:70px repeat(6,1fr);gap:4px;padding:0 6px 6px">${righe}</div></body>`);
  await p2.waitForTimeout(200);
  if (Object.keys(risultati).length > 1) { const file = path.join(uscita, `v063-gesti-${tag}.jpg`); await p2.screenshot({ path: file, fullPage: true, type: 'jpeg', quality: 82 }); console.log('riassunto: ' + path.relative(ROOT, file)); } }
fs.writeFileSync(path.join(uscita, `v063-gesti-${tag}.json`), JSON.stringify(Object.fromEntries(Object.entries(risultati).map(([g, r]) => [g, { attore: r.attore, mancanti: r.mancanti, fischio: r.fischio, momenti: r.foto.map(x => ({ nome: x.nome, t: x.t, ...x.misure })) }])), null, 1));
if (errori.length) console.log('errori nella pagina: ' + errori.slice(0, 3).join(' | '));
await browser.close(); server.httpServer.close();
