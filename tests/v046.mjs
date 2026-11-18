// Prove della v0.46 (manuali e studi indicati da Ale): esiti delle azioni, arbitro (palleggio, vantaggio, interferenza, espulsioni
// simultanee, simulazione con cartellino giallo), cambio di marcatura, controfuga organizzata, schemi nuovi dell'uomo in più,
// rovesciata del centroboa, minuti in acqua.
// Uso: node tests/v046.mjs [--no-build]
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--no-build')) await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4399, host: '127.0.0.1' } });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let ok = true; const prova = (bene, testo) => { console.log(`${bene ? '✓' : '✗'} ${testo}`); if (!bene) ok = false; };
const errori = [];
const pg = await browser.newPage({ viewport: { width: 852, height: 393 } });
pg.setDefaultTimeout(150000);
pg.on('pageerror', e => errori.push(e.message));
await pg.addInitScript(() => {
  let a = 33; window.__rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; performance.now = () => now; window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  window.__salta = n => { const R = window.__pallanuoto.renderer; const d = R.render; R.render = () => {}; for (let i = 0; i < n; i++) { now += 1000 / 60; window.__raf(now); } R.render = d; };
});
await pg.goto(server.resolvedUrls.local[0]);
await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 60000, polling: 100 });
await pg.evaluate(() => { const H = window.__pallanuoto; H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '480'); document.getElementById('goBtn').click(); window.__salta(300);
  H.game.autoplay = true; for (const t of H.teams) t.human = false;
  // prepara una scena ferma: palla all'Italia a metà campo, gioco in corso
  window.__scena = (x = 0) => { const it = H.teams[0], c = it.players[4]; for (const q of H.allPlayers) { q.excluded = false; q.stunUntil = 0; q.colpi = []; q.tackleCD = 0; q.act = null; q.charging = false; q.freeThrow = false; }
    H.game.state = 'play'; H.game.penalty = null; c.x = x; c.z = 0; c.vx = c.vz = 0; H.regole.giveBall(c); return c; }; });

// 1. esiti delle azioni: il tiro chiude l'azione, il gol la trasforma in «gol»; l'espulsione procurata apre la superiorità
{ const r = await pg.evaluate(() => { const H = window.__pallanuoto, V = H.v046, it = H.teams[0], s = () => V.statPartita.squadre[0].azioni;
    const c = window.__scena(4 * it.dir); const prima = { ...s().parita }; const aperta = !!V.azioneAperta();
    H.prova.doShoot(c, 0.8, false, 0); const dopoTiro = { ...s().parita }, chiusa = !V.azioneAperta();
    H.regole.goalScored(it); const dopoGol = { ...s().parita };
    const c2 = window.__scena(4 * it.dir); window.__salta(2);
    const d = H.teams[1].players[3]; H.regole.exclude(d, c2); const esp = s().parita.espulsione - dopoGol.espulsione;
    window.__salta(2); const tipo = V.azioneAperta()?.tipo;
    return { aperta, chiusa, tiro: dopoTiro.tiro - prima.tiro, gol: dopoGol.gol - prima.gol, tiroDopoGol: dopoGol.tiro - prima.tiro, esp, tipo }; });
  prova(r.aperta && r.chiusa && r.tiro === 1, `il tiro chiude l'azione in corso (esito «tiro»)`);
  prova(r.gol === 1 && r.tiroDopoGol === 0, 'se il tiro diventa gol, l\'esito diventa «gol»');
  prova(r.esp === 1 && r.tipo === 'superiorita', `l'espulsione procurata chiude l'azione e apre una superiorità (${r.tipo})`); }

// 2. arbitro: fallo su chi palleggia = espulsione; regola del vantaggio in controfuga; interferenza sul tiro libero
{ const r = await pg.evaluate(() => { const H = window.__pallanuoto, V = H.v046, it = H.teams[0], hu = H.teams[1];
    const out = {};
    { const c = window.__scena(0); c.oriz = 0.9; c.fx = it.dir; c.fz = 0; const d = hu.players[2]; d.x = c.x; d.z = c.z + 0.8;
      const vecchio = V.ARBITRI.palleggio; V.ARBITRI.palleggio = 50; const esito = H.regole.tackle(d, c, { fallo: true }); V.ARBITRI.palleggio = vecchio;
      out.palleggio = { esito, esp: d.excluded }; }
    { const c = window.__scena(7 * it.dir); c.fx = it.dir; for (const q of hu.players) if (!q.isGK) { q.x = -7 * it.dir; q.z = 4; }
      const d = hu.players[2]; d.x = c.x - it.dir * 0.8; d.z = c.z; window.__salta(1); V.azioneAperta().tipo = 'controfuga';
      H.regole.foul(d, c); out.vantaggio = { stato: H.game.state, palla: H.ball.holder === c }; }
    { const c = window.__scena(0); const d = hu.players[2]; d.x = c.x + 0.7; d.z = c.z; H.regole.foul(d, c);
      d.x = c.x + 0.6; d.z = c.z; const v = V.ARBITRI.interferenza; V.ARBITRI.interferenza = 50; const fischio = V.controllaInterferenza(c); V.ARBITRI.interferenza = v;
      out.interferenza = { fischio, esp: d.excluded, ricordato: true }; }
    return out; });
  prova(r.palleggio.esito === 'espulsione' && r.palleggio.esp, `chi ferma con un fallo un giocatore che palleggia viene espulso (${r.palleggio.esito})`);
  prova(r.vantaggio.stato === 'play' && r.vantaggio.palla, `regola del vantaggio: in controfuga il fallo semplice non ferma il gioco (${r.vantaggio.stato})`);
  prova(r.interferenza.fischio && r.interferenza.esp, 'interferenza: chi ha fatto fallo e resta entro 1 m da chi batte il tiro libero viene espulso'); }

// 3. lotta al centro: espulsioni simultanee (il tempo dell'azione non si azzera); simulazione → giallo → espulsione
{ const r = await pg.evaluate(() => { const H = window.__pallanuoto, V = H.v046, it = H.teams[0], hu = H.teams[1];
    const c = window.__scena(9 * it.dir); const boa = it.players[1], def = hu.players.find(q => q.i === 6);
    H.game.shot = 11; V.simultanea(boa, def); const sim = { boa: boa.excluded, def: def.excluded, shot: H.game.shot };
    const c2 = window.__scena(9 * it.dir); it.simulazioni = 0; const visti = [];
    H.cronaca.ascoltatori.push((tipo, titolo) => visti.push(titolo));
    for (let k = 0; k < 3; k++) { window.__scena(9 * it.dir); H.regole.giveBall(boa); V.simulazione(boa); }
    return { sim, visti: visti.slice(-4), simulazioni: it.simulazioni, giallo: visti.some(t => /Cartellino giallo/.test(t)), espulso: boa.excluded, c2: !!c2 }; });
  prova(r.sim.boa && r.sim.def && r.sim.shot === 11, `espulsioni simultanee: centroboa e marcatore fuori, tempo dell'azione invariato (${r.sim.shot})`);
  prova(r.simulazioni === 3 && r.giallo && r.espulso, `simulazione: fallo contro, poi cartellino giallo alla squadra, poi espulsione di chi simula (${r.simulazioni}, giallo ${r.giallo}, espulso ${r.espulso})`); }

// 4. difesa: cambio di marcatura; controfuga organizzata (tre corsie, prima linea sui 2 metri)
{ const r = await pg.evaluate(() => { const H = window.__pallanuoto, V = H.v046, it = H.teams[0], hu = H.teams[1];
    window.__scena(0); const a = hu.players[2], b = hu.players[3];
    const primaA = V.uomoDi(a), primaB = V.uomoDi(b); hu.scambio = { a, b, fino: H.game.time + 5 };
    const scambiato = V.uomoDi(a) === primaB && V.uomoDi(b) === primaA; hu.scambio = null;
    // controfuga: l'Italia recupera palla vicino alla propria porta
    const gk = it.players[0]; for (const q of H.allPlayers) { q.excluded = false; } H.ball.x = -10 * it.dir;
    gk.x = -11.5 * it.dir; gk.z = 0; H.game.possTeam = hu; H.regole.giveBall(gk); const c = V.contropiede(it);
    const posti = c ? it.players.filter(q => !q.isGK).map(q => H.prova.attackTarget(q)) : [];
    const gx = 12.5 * it.dir, prima = posti.sort((p1, p2) => Math.abs(gx - p1.x) - Math.abs(gx - p2.x)).slice(0, 3), zPrima = prima.map(t => Math.round(t.z * it.dir));
    const avanti = prima.every(t => Math.abs(gx - t.x) < Math.abs(gx - H.ball.x) - 3);
    return { scambiato, contro: !!c, nPrima: prima.length, avanti, zPrima: zPrima.sort((x, y) => x - y) }; });
  prova(r.scambiato, 'cambio di marcatura: i due difensori si scambiano gli uomini');
  prova(r.contro && r.avanti && r.zPrima.length === 3 && r.zPrima[0] <= -3 && Math.abs(r.zPrima[1]) <= 1 && r.zPrima[2] >= 3, `controfuga organizzata: la prima linea va avanti, davanti alla palla, su tre corsie (lato: ${r.zPrima.join(', ')} m)`); }

// 5. uomo in più: 10 schemi validi (v0.58: + uscita del 6); rovesciata del centroboa; minuti in acqua
{ const r = await pg.evaluate(() => { const H = window.__pallanuoto, U = H.uomo, it = H.teams[0], hu = H.teams[1];
    const lib = U.LIBRERIA.map(s => s.id), validi = U.LIBRERIA.every(s => U.validaUomo(s));
    const c = window.__scena(0); const boa = it.players[1], gx = 12.5 * it.dir, def = hu.players.find(q => q.i === 6);
    boa.x = gx - it.dir * 2.3; boa.z = 0; boa.fx = -it.dir; boa.fz = 0; def.x = gx - it.dir * 1.6; def.z = 0.05; H.regole.giveBall(boa);
    boa.tiriDiSchiena = 3; const k3 = H.prova.shotKind(boa); boa.tiriDiSchiena = 0; const k0 = H.prova.shotKind(boa);
    const g = it.players[2].scheda, m0 = g.minuti || 0; window.__scena(0); window.__salta(600); const m1 = g.minuti || 0;
    return { lib, validi, k3, k0, m0, m1 }; });
  prova(r.lib.length === 10 && r.validi && r.lib.includes('utasca') && r.lib.includes('u33-entra') && r.lib.includes('u6esce'), `uomo in più: ${r.lib.length} schemi validi, compresi i due del manuale USA e l'uscita del 6 (v0.58)`);
  prova(r.k3 === 'rovesciata' && r.k0 === 'beduina', `centroboa di spalle: ogni quattro tiri una rovesciata (${r.k0} … ${r.k3})`);
  prova(r.m1 > r.m0 + 0.05, `minuti in acqua contati a gioco in corso (${r.m0.toFixed(2)} → ${r.m1.toFixed(2)} min)`); }

prova(errori.length === 0, `nessun errore nella pagina${errori.length ? ': ' + errori.slice(0, 2).join(' | ') : ''}`);
await browser.close(); server.httpServer.close();
console.log(ok ? '\nv0.46: tutte le prove superate' : '\nv0.46: prove NON superate');
process.exit(ok ? 0 : 1);
