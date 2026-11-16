// Replay UI con tocchi e tastiera reali; la simulazione resta ferma durante le misure DOM.
// Uso: node tests/replay-ui-v047.mjs [--foto]
// Le foto facoltative finiscono in docs/immagini/v047-replay-ui-*.png.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FOTO = process.argv.includes('--foto');
const fotoDir = path.join(ROOT, 'docs/immagini');
const server = await createServer({ root: ROOT, logLevel: 'warn', server: { host: '127.0.0.1', port: 0, strictPort: true } });
await server.listen();
const url = `http://127.0.0.1:${server.httpServer.address().port}`;
let browser;

try {
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 667, height: 300 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await context.addInitScript(() => {
    window.__rnd = () => .7;
    window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
  });
  await page.goto(url);
  await page.waitForFunction(() => window.__pallanuoto?.modelloPronto && window.__raf, null, { polling: 100, timeout: 60000 });
  await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' });
  await page.evaluate(async () => {
    const [U, I, C, S, R] = await Promise.all(['replay-ui', 'input', 'controllo', 'stato', 'regole'].map(m => import('/src/' + m + '.js')));
    const selettori = ['#hud', '#espulsioni', '#tac', '#cronaca', '#qte', '#fight', '#player', '#tCambi', '#tLog', '#registro', '#touch', '#fps'];
    const focus = document.createElement('button');
    focus.id = 'replayFocusPrima';
    focus.textContent = 'Focus prima del replay';
    focus.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';
    document.body.appendChild(focus);
    let scena = 0;
    window.__uiV047 = {
      U, I, C, S, R,
      prepara() {
        U.nascondiReplay(); I.resetInput(); C.resetTap(); document.activeElement?.blur();
        document.getElementById('menu').style.display = 'none';
        document.body.classList.add('gioco');
        Object.assign(S.game, { state: 'play', prevState: 'play', autoplay: false, time: 100 + ++scena * 10, clock: 180, shot: 24, period: 1, penalty: null, rigoriFinali: null, passaggi: 0, possTeam: S.teams[0] });
        S.game.possT = S.game.time;
        S.fight.active = false;
        for (const p of S.allPlayers) Object.assign(p, { x: p.team.idx ? 11 : -11, z: 8, vx: 0, vz: 0, fx: 1, fz: 0, oriz: 0, act: null, charging: false, chargeT: 0, excluded: false, uscendo: false, pressatoUntil: 0, stunUntil: 0, freeThrow: false, stamina: 1, voloPronto: false, qte: null });
        const p = S.teams[0].players[6], m = S.teams[0].players[4];
        p.x = 4; p.z = 0; m.x = 7; m.z = 3;
        R.giveBall(p); S.setCtrl(p);
        S.ball.kind = null; S.ball.shooter = null;
        window.__pallanuoto.camera.matrixWorld.identity();
        window.__saltiUI = 0;
        U.registraSalto(() => { window.__saltiUI++; });
      },
      frame() {
        I.pollInput();
        S.game.time += 1 / 60;
        C.humanControl(S.ctrl, 1 / 60);
      },
      stato() {
        return { x: I.inp.x, z: I.inp.z, pass: !!I.inp.desktopPass, shoot: !!I.inp.desktopShoot, act: S.ctrl.act?.kind || null, charging: S.ctrl.charging, holder: S.ball.holder === S.ctrl, passaggi: S.game.passaggi, salti: window.__saltiUI };
      },
      normali() {
        return selettori.map(s => { const c = getComputedStyle(document.querySelector(s)); return { s, visibility: c.visibility, pointerEvents: c.pointerEvents }; });
      }
    };
    window.__uiV047.prepara();
  });
  const info = { squadra: 'HUN', casa: 'ITA', ospite: 'HUN', numero: 9, nome: 'Varga', firma: 'BEDUINA', punteggio: '2 – 1', avversaria: 'ITA' };
  const mostra = (dati = info) => page.evaluate(d => window.__uiV047.U.mostraReplay(d), dati);
  const nascondi = () => page.evaluate(() => window.__uiV047.U.nascondiReplay());
  const prepara = () => page.evaluate(() => window.__uiV047.prepara());
  const frame = () => page.evaluate(() => window.__uiV047.frame());
  const stato = () => page.evaluate(() => window.__uiV047.stato());

  const normaliPrima = await page.evaluate(() => window.__uiV047.normali());
  await page.locator('#replayFocusPrima').focus();
  await mostra();
  assert.equal(await page.locator('#replayOverlay').getAttribute('role'), 'dialog');
  assert.equal(await page.locator('#replayOverlay').getAttribute('aria-modal'), 'true');
  assert.equal(await page.locator('.replay-marcatore').getAttribute('aria-live'), 'polite');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'replaySalta', 'focus sul comando del replay');
  assert.equal(await page.evaluate(() => document.body.classList.contains('replay')), true);
  assert.ok((await page.evaluate(() => window.__uiV047.normali())).every(v => v.visibility === 'hidden' && v.pointerEvents === 'none'), 'HUD e comandi nascosti soltanto nel playback');
  assert.equal(await page.locator('#replaySquadra').textContent(), 'ITA', 'gol avversario: il tabellone conserva la squadra di casa a sinistra');
  assert.equal(await page.locator('#replayPunteggio').textContent(), '2 – 1');
  assert.equal(await page.locator('#replayAvversaria').textContent(), 'HUN');
  assert.equal(await page.locator('#replayNazione').textContent(), 'HUN', 'la fascia identifica invece il marcatore');
  assert.equal(await page.locator('#replayNumero').textContent(), '#9');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'replaySalta', 'Tab conserva il focus nel replay');
  await nascondi();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'replayFocusPrima', 'ripristino del focus di partenza');
  assert.deepEqual(await page.evaluate(() => window.__uiV047.normali()), normaliPrima, 'HUD e comandi riprendono lo stato precedente');
  assert.equal(await page.evaluate(() => document.body.classList.contains('replay')), false);
  assert.equal(await page.locator('#replayOverlay').isHidden(), true);
  await nascondi();

  // Compatibilità della vecchia chiamata e metadati trattati come testo, mai come markup.
  await mostra({ squadra: 'ITA', avversaria: 'HUN', numero: 4, nome: 'Di Fulvio', firma: 'GOL', punteggio: '3 – 1' });
  assert.equal(await page.locator('#replaySquadra').textContent(), 'ITA');
  assert.equal(await page.locator('#replayAvversaria').textContent(), 'HUN');
  const nomeHtml = '<img src=x onerror="window.__nomeHtml=true"> & <b>Varga</b>';
  await mostra({ ...info, nome: nomeHtml });
  assert.equal(await page.locator('#replayNome').textContent(), nomeHtml, 'nome letterale completo');
  assert.equal(await page.locator('#replayNome').getAttribute('title'), nomeHtml);
  assert.equal(await page.locator('#replayNome img, #replayNome b').count(), 0, 'nessun elemento creato dal nome');
  assert.equal(await page.evaluate(() => !!window.__nomeHtml), false);
  for (const firma of ['BEDUINA', 'SCHIZZO', 'COLONNELLO', 'ROVESCIATA', 'SCIARPA', 'TIRO DA FUORI', 'RIGORE', 'GOL']) {
    await mostra({ ...info, firma: ' ' + firma.toLowerCase() + ' ' });
    assert.equal(await page.locator('#replayFirma').textContent(), firma, 'riconoscimento della firma registrata: ' + firma);
  }
  for (const firma of [undefined, '', 'shot', 'POTENZA', '<b>BEDUINA</b>']) {
    await mostra({ ...info, firma });
    assert.equal(await page.locator('#replayFirma').textContent(), 'GOL', 'firma assente o non riconosciuta: solo GOL');
  }
  assert.equal(await page.locator('#replayOverlay').count(), 1, 'il DOM viene riutilizzato');
  for (const [valore, atteso] of [[-.5, 0], [.375, 38], [2, 100], [null, 0]]) {
    await page.evaluate(v => window.__uiV047.U.aggiornaReplay(v), valore);
    assert.equal(await page.locator('#replayProgresso').getAttribute('aria-valuenow'), String(atteso));
  }

  // IPhone piccolo, barre Safari e margini sicuri simulati, poi iPhone 15.
  if (FOTO) fs.mkdirSync(fotoDir, { recursive: true });
  for (const [width, height] of [[667, 300], [852, 393]]) {
    await page.setViewportSize({ width, height });
    for (const [sl, sr, st, sb] of [[0, 0, 0, 0], [44, 44, 0, 21], [59, 0, 0, 21]]) {
      await page.evaluate(v => {
        for (const [chiave, valore] of Object.entries(v)) document.documentElement.style.setProperty(chiave, valore + 'px');
      }, { '--sl': sl, '--sr': sr, '--st': st, '--sb': sb });
      await mostra({ ...info, nome: 'Giocatore con un cognome molto lungo da mantenere nella fascia' });
      const misure = await page.evaluate(() => {
        const rett = s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
        return { salta: rett('#replaySalta'), fascia: rett('.replay-fascia'), testa: rett('.replay-testa'), logo: rett('.replay-marchio') };
      });
      for (const [nome, r] of Object.entries(misure)) assert.ok(r.x >= sl && r.y >= st && r.right <= width - sr && r.bottom <= height - sb, `${width}×${height}, margini ${sl}/${sr}/${sb}: ${nome} dentro l'area sicura (${JSON.stringify(r)})`);
      assert.ok(misure.salta.width >= 44 && misure.salta.height >= 44, 'Salta ha un bersaglio di almeno 44×44 px');
      assert.ok(misure.fascia.right < misure.salta.x, 'fascia e Salta restano separati');
      assert.ok(misure.testa.right < misure.logo.x, 'badge/punteggio e logo restano separati');
      if (FOTO && sl === 44) {
        await mostra();
        await page.evaluate(() => { window.__uiV047.U.aggiornaReplay(.45); window.__pallanuoto.__ridisegna(); });
        await page.screenshot({ path: path.join(fotoDir, `v047-replay-ui-${width}x${height}.png`), timeout: 120000 });
      }
    }
  }

  // Il fondale copre i vecchi controlli touch e non avvia il joystick sotto il replay.
  const cdp = await context.newCDPSession(page);
  await prepara();
  await mostra();
  const puntoJoy = await page.locator('#joy').evaluate(e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [puntoJoy] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: puntoJoy.x + 25, y: puntoJoy.y - 20 }] });
  const joystick = await page.evaluate(() => ({ x: window.__uiV047.I.touch.x, z: window.__uiV047.I.touch.z, on: document.getElementById('joy').classList.contains('on') }));
  assert.deepEqual(joystick, { x: 0, z: 0, on: false }, 'il gesto touch resta sul replay');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const salta = await page.locator('#replaySalta').boundingBox();
  await page.touchscreen.tap(salta.x + salta.width / 2, salta.y + salta.height / 2);
  await page.touchscreen.tap(salta.x + salta.width / 2, salta.y + salta.height / 2);
  assert.equal((await stato()).salti, 1, 'due tocchi richiedono un solo salto');
  await cdp.detach();

  // Prima si prova il percorso D normale, poi gli stessi eventi reali dentro al dialogo.
  await prepara();
  await page.keyboard.down('d'); await frame();
  assert.equal((await stato()).pass, true, 'la fixture riceve D durante il gioco');
  await page.keyboard.up('d'); await frame();
  assert.equal((await stato()).act, 'pass', 'D fuori dal replay passa al rilascio');
  await prepara();
  await mostra();
  for (const key of ['d', 'ArrowRight', 'ArrowUp']) { await page.keyboard.down(key); await frame(); }
  let s = await stato();
  assert.ok(!s.pass && s.x === 0 && s.z === 0 && s.act === null && s.holder && s.passaggi === 0, 'D e frecce nel replay non comandano il giocatore');
  for (const key of ['d', 'ArrowRight', 'ArrowUp']) { await page.keyboard.up(key); await frame(); }
  assert.equal((await stato()).act, null, 'il rilascio di D non conserva un passaggio');
  await page.keyboard.press('Space'); await frame();
  s = await stato();
  assert.ok(s.salti === 1 && !s.shoot && !s.charging && s.act === null && s.holder, 'Spazio salta senza caricare o tirare');
  await page.locator('#replaySalta').dblclick();
  await page.keyboard.press('Space');
  assert.equal((await stato()).salti, 1, 'doppio click e Spazio non duplicano il salto');
  await prepara(); await mostra();
  await page.keyboard.press('Enter');
  assert.equal((await stato()).salti, 1, 'Invio attiva il pulsante nativo');

  // Anche un comando già premuto viene annullato quando il focus entra nel replay.
  for (const key of ['d', 'Space']) {
    await prepara();
    await page.keyboard.down(key); await frame();
    await mostra();
    await page.keyboard.up(key); await frame();
    s = await stato();
    assert.ok(s.act === null && !s.charging && !s.pass && !s.shoot && s.holder, 'focus del replay annulla la pressione precedente: ' + key);
  }
  await prepara(); await mostra();
  await page.evaluate(() => document.getElementById('replaySalta').blur());
  await page.keyboard.down('d'); await frame();
  assert.equal((await stato()).pass, false, 'capture protegge anche il focus uscito dal dialogo');
  await page.keyboard.up('d'); await frame();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'replaySalta');

  // In verticale il replay rimane sotto la maschera di rotazione già esistente.
  await page.setViewportSize({ width: 393, height: 852 });
  await page.evaluate(() => {
    for (const [k, v] of Object.entries({ '--sl': 0, '--sr': 0, '--st': 59, '--sb': 34 })) document.documentElement.style.setProperty(k, v + 'px');
  });
  assert.equal(await page.locator('#ruota').evaluate(e => getComputedStyle(e).display), 'flex');
  assert.equal(await page.evaluate(() => !!document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('#ruota')), true, 'la maschera di rotazione resta sopra al replay');
  if (FOTO) await page.screenshot({ path: path.join(fotoDir, 'v047-replay-ui-393x852-ruota.png'), timeout: 120000 });
  await page.setViewportSize({ width: 852, height: 393 });
  await page.evaluate(() => { for (const k of ['--sl', '--sr', '--st', '--sb']) document.documentElement.style.setProperty(k, '0px'); });

  // Escape/P passano al normale togglePause. Un singolo RAF applica la pulizia della regia.
  for (const key of ['Escape', 'p']) {
    await prepara(); await mostra();
    await page.keyboard.press(key);
    assert.equal(await page.evaluate(() => window.__uiV047.S.game.state), 'paused', key + ' apre la pausa dal focus Salta');
    await page.evaluate(() => window.__raf(performance.now() + 16));
    assert.equal(await page.locator('#replayOverlay').isHidden(), true, 'la pausa chiude il replay');
    assert.equal(await page.evaluate(() => document.body.classList.contains('replay')), false, 'la pausa rimuove la classe replay');
  }
  assert.deepEqual(errors, [], 'nessun errore JavaScript');
  console.log('PASS replay UI v0.47: score casa/ospite, marcatore, firme, escaping, safe area, tocchi, tastiera, salto singolo, focus, pausa e rotazione');
  await context.close();
} finally {
  await browser?.close();
  await server.close();
}
