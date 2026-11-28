// Due partite vere abbreviate, ITA–HUN, semi 33 e 40, quattro tempi da 180 secondi.
// Uso: node strumenti/sonda-difesa-v093.mjs [--root=checkout] [--salva=risultati.json]
//       [--foto=cartella] [--no-build] [--dist=dist] [--porta=4699]
// Solo diagnostica: nessuna soglia nuova su gol, tiri, scambi o bilanciamento.
// Il RAF del gioco e i rig avanzano SEMPRE a 60 Hz. Si sospende soltanto il disegno GPU.
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const arg = (k, d = '') => process.argv.find(x => x.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const root = path.resolve(arg('root', path.join(path.dirname(fileURLToPath(import.meta.url)), '..')));
const salva = arg('salva'), foto = arg('foto'), dist = arg('dist', 'dist');
const semi = [33, 40], maxFrame = 60 * 60 * 20;
const started = Date.now();
if (!process.argv.includes('--no-build')) await build({ root, logLevel: 'warn', build: { outDir: dist } });
const server = await preview({ root, logLevel: 'warn', build: { outDir: dist }, preview: { port: +arg('porta', 4699), host: '127.0.0.1', strictPort: true } });
let browser;
const risultati = {
  versioneSonda: '0.93', root, semi, squadre: ['ITA', 'HUN'], secondiPerTempo: 180,
  metodo: {
    simulazione: 'RAF originale a tempo finto, 60 Hz; rig aggiornati a ogni tick; solo disegno GPU sospeso',
    scambi: 'variazioni degli accoppiamenti a oggetto invariato e senza sostituzioni; permutazioni verificate; metadati incremento t.scambi e stessa azione in play per verificare le consegne vive',
    minaccia: 'attaccante entro 7 m dalla porta; coperto se un difensore di movimento è entro 2 m e a distanza dalla porta <= distanza attaccante + 0,3 m',
    schierata: 'parità, palla entro 9,2 m dalla linea di porta attaccata e possesso da almeno 6 s',
    raggruppamenti: 'componenti di almeno 3 difensori collegate da distanze < 1,8 m; separatamente almeno 3 difensori entro 2,5 m dalla palla',
    foto: 'un solo scambio reale a difesa schierata: t0, +0,5, +1,5, +3 s di RAF; stessa camera e renderer, senza spostare giocatori o palla',
  },
  partite: [], foto: [],
};
let fotoPrenotate = false;

try {
  // Un solo browser e una sola pagina per volta. Il fallback serve dove Chromium di sistema manca.
  const executablePath = fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined;
  browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  risultati.browser = executablePath || 'Chromium Playwright';
  if (foto) fs.mkdirSync(foto, { recursive: true });
  for (let k = 0; k < semi.length; k++) {
    const inizio = Date.now();
    const pg = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
    const errori = [];
    pg.on('pageerror', e => errori.push(e.message));
    pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errori.push(m.text().slice(0, 400)); });
    await pg.addInitScript(seme => {
      let s = seme, now = 0;
      window.__rnd = () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      performance.now = () => now;
      window.requestAnimationFrame = cb => { window.__raf = cb; return 1; };
      window.cancelAnimationFrame = () => {};
      window.__passoDifesa = () => { now += 1000 / 60; window.__raf(now); };
    }, semi[k]);
    await pg.goto(server.resolvedUrls.local[0]);
    await pg.waitForFunction('window.__pallanuoto && window.__raf && window.__pallanuoto.modelloPronto', null, { timeout: 120000, polling: 100 });
    await pg.addStyleTag({ content: '#fps{display:none!important}' });
    await pg.evaluate(({ seme, cercaFoto, maxFrame }) => {
      const H = window.__pallanuoto, g = H.game, B = H.ball, T = H.teams, P = H.allPlayers;
      H.scegliSquadre('ITA', 'HUN'); H.imposta('len', '180');
      g.autoplay = true; for (const t of T) t.human = false;
      document.getElementById('goBtn').click();
      if (Math.abs(g.clock - 180) > 1e-6) throw new Error(`Durata non applicata: attesi 180 s, clock iniziale ${g.clock}`);
      H.senzaCorpi = false;
      const renderOriginale = H.renderer.render;
      H.renderer.render = () => {}; // render(dt,now) continua ad aggiornare scheletri, mani e camera a ogni RAF.
      const r = {
        seme, frame: 0, statoFinale: null, secondiPerTempo: 180, clockInizialeVerificato: g.clock,
        secondiGioco: 0, secondiParita: 0, secondiConLiberi: 0,
        secondiAttaccanteLibero: 0, maxLiberi: 0, abbandoni: 0, recuperi: 0,
        scambi: [], variazioniNonPermutazione: [], minacce: [], transizioni: [],
        gruppi: { secondiTreVicini: 0, secondiTreSullaPalla: 0, maxGruppo: 0, maxSullaPalla: 0, esempi: [] },
        accoppiamentiDuplicatiFrame: 0,
      };
      const n = x => +x.toFixed(3);
      const indice = new Map(P.map((p, i) => [p, i]));
      const id = p => p ? `${p.team.short}:${p.scheda?.id ?? `numero-${p.num}`}` : null;
      const attivi = t => t.players.filter(p => !p.isGK && !p.excluded && !p.uscendo);
      const posPre = new Float64Array(P.length * 4), schedePre = [], idPre = [];
      const precedenti = T.map(() => ({ oggetto: null, uomini: [], contatore: 0 }));
      let preTempo = g.time, prePoss = null, prePossT = g.possT, prePeriodo = g.period, preStato = g.state, preBallX = B.x;
      let possesso = null, chiavePoss = '', fotoStato = null, ultimaEsempio = -99;
      const minacce = new Map();
      const contatori0 = T.map(t => ({ scambi: t.scambi || 0, rientri: t.scambiRientro || 0 }));

      function punto(p, prima = false) {
        if (!p) return null;
        const i = indice.get(p), j = i * 4;
        return { id: prima ? idPre[i] : id(p), uid: p.uid, squadra: p.team.short, posto: p.i,
          numero: prima ? (schedePre[i]?.num ?? p.num) : p.num, nome: prima ? (schedePre[i]?.nome ?? p.name) : p.name,
          x: n(prima ? posPre[j] : p.x), z: n(prima ? posPre[j + 1] : p.z),
          vx: n(prima ? posPre[j + 2] : p.vx), vz: n(prima ? posPre[j + 3] : p.vz) };
      }
      function palla() {
        return { stato: B.state, tipo: B.kind, x: n(B.x), y: n(B.y), z: n(B.z), vx: n(B.vx), vy: n(B.vy), vz: n(B.vz),
          portatore: id(B.holder), tiratore: id(B.shooter), destinatario: id(B.target), possesso: g.possTeam?.short ?? null };
      }
      function copertori(q, dif) {
        const gx = q.team.dir * 12.5, dq = Math.hypot(gx - q.x, q.z);
        return dif.filter(d => Math.hypot(d.x - q.x, d.z - q.z) < 2 && Math.hypot(gx - d.x, d.z) <= dq + 0.3);
      }
      function schierata(t) {
        return g.state === 'play' && g.possTeam !== t && g.possTeam && g.time - g.possT >= 6
          && !T.some(t => t.players.some(p => p.excluded || p.uscendo)) && Math.abs(B.x + t.dir * 12.5) <= 9.2;
      }
      function scena(t) {
        return { frame: r.frame, tempo: n(g.time), stato: g.state, periodo: g.period, cronometro: n(g.clock),
          secondiPossesso: n(g.time - g.possT), difesa: t.short, difesaSchierata: !!schierata(t),
          difensori: attivi(t).map(p => ({ ...punto(p), uomo: id(t.accoppiamenti?.uomini[p.i]) })),
          attaccanti: attivi(T[1 - t.idx]).map(p => punto(p)), palla: palla() };
      }
      function memorizza() {
        for (let i = 0; i < P.length; i++) {
          const p = P[i], j = i * 4; posPre[j] = p.x; posPre[j + 1] = p.z; posPre[j + 2] = p.vx; posPre[j + 3] = p.vz;
          schedePre[i] = p.scheda; idPre[i] = id(p);
        }
        T.forEach((t, i) => {
          precedenti[i].oggetto = t.accoppiamenti; precedenti[i].uomini = t.accoppiamenti?.uomini.slice() || [];
          precedenti[i].contatore = t.scambi || 0;
        });
        preTempo = g.time; prePoss = g.possTeam; prePossT = g.possT; prePeriodo = g.period; preStato = g.state; preBallX = B.x;
      }
      function chiudiMinaccia(s, motivo) {
        if (!s.episodio) return;
        const e = s.episodio; e.fine = n(g.time); e.durata = n(g.time - e.inizio); e.esito = motivo;
        e.attaccanteFine = punto(s.q);
        if (motivo === 'coperto') { r.recuperi++; e.difensoriRecupero = copertori(s.q, attivi(T[1 - s.q.team.idx])).map(d => punto(d)); }
        r.minacce.push(e); s.episodio = null;
      }
      function chiudiPossesso() {
        if (possesso) { possesso.durata = n(g.time - possesso.inizio); r.transizioni.push(possesso); }
        possesso = null;
        for (const s of minacce.values()) chiudiMinaccia(s, 'cambio-possesso');
        minacce.clear();
      }
      function scambi() {
        for (const t of T) {
          const pre = precedenti[t.idx], a = t.accoppiamenti;
          if (!a || pre.oggetto !== a || preStato !== 'play' || prePoss !== T[1 - t.idx] || g.possTeam !== prePoss) continue;
          const cambiati = t.players.filter(d => !d.isGK && pre.uomini[d.i] && a.uomini[d.i] !== pre.uomini[d.i]);
          if (!cambiati.length) continue;
          if (cambiati.some(d => [d, pre.uomini[d.i], a.uomini[d.i]].some(p => !p || schedePre[indice.get(p)] !== p.scheda))) continue;
          const prima = cambiati.map(d => pre.uomini[d.i]), dopo = cambiati.map(d => a.uomini[d.i]);
          const permutazione = cambiati.length >= 2 && new Set(prima).size === cambiati.length
            && new Set(dopo).size === cambiati.length && prima.every(p => dopo.includes(p));
          const incrementoContatore = (t.scambi || 0) - pre.contatore;
          const stessaAzione = g.possT === prePossT && g.period === prePeriodo;
          const e = { indice: r.scambi.length, frame: r.frame, tempo: n(g.time), primaTempo: n(preTempo), difesa: t.short,
            difesaSchierata: !!schierata(t), fase: Math.abs(B.x + t.dir * 12.5) > 9.2 ? 'rientro' : 'schierata',
            permutazione, numeroDifensori: cambiati.length, palla: palla(),
            contatorePrima: pre.contatore, contatoreDopo: t.scambi || 0, incrementoContatore, stessaAzione,
            consegnaViva: incrementoContatore > 0 && stessaAzione && g.state === 'play',
            consegne: cambiati.map(d => ({ difensorePrima: punto(d, true), difensoreDopo: punto(d),
              uomoPrima: punto(pre.uomini[d.i], true), uomoPrimaDopo: punto(pre.uomini[d.i]),
              uomoDopoPrima: punto(a.uomini[d.i], true), uomoDopo: punto(a.uomini[d.i]),
              minacciaLasciata: Math.hypot(-t.dir * 12.5 - pre.uomini[d.i].x, pre.uomini[d.i].z) <= 7,
              copertoriUomoLasciato: copertori(pre.uomini[d.i], attivi(t)).map(p => id(p)) })) };
          if (!permutazione) { r.variazioniNonPermutazione.push(e); continue; }
          r.scambi.push(e);
          if (cercaFoto && !fotoStato && e.consegnaViva && e.difesaSchierata && Math.abs(preBallX + t.dir * 12.5) <= 9.2) {
            const vistaPrima = H.vista, fovPrima = H.camera.fov;
            const gx = -t.dir * 12.5;
            const vista = { pos: [gx * 0.52, 18, 17], look: [gx * 0.58, 0, 0], fov: 43 };
            H.vista = vista; H.camera.position.set(...vista.pos); H.camera.lookAt(...vista.look);
            H.camera.fov = vista.fov; H.camera.updateProjectionMatrix(); H.camera.updateMatrixWorld();
            fotoStato = { scambio: e.indice, difesa: t.idx, frame0: r.frame, prossima: 0, attesa: true,
              offset: [0, 30, 90, 180], vista, vistaPrima, fovPrima };
          }
        }
      }
      function misura(dt) {
        if (g.state !== 'play' || !g.possTeam || !dt) return;
        r.secondiGioco += dt;
        const att = g.possTeam, dif = T[1 - att.idx], gx = att.dir * 12.5;
        const chiave = `${att.idx}:${g.possT}:${g.period}`;
        if (chiave !== chiavePoss) {
          chiudiPossesso(); chiavePoss = chiave;
          possesso = { squadra: att.short, inizio: g.possT, distanzaPallaInizio: n(Math.abs(gx - B.x)),
            pallaEntro9mDopo: null, minacceCoperteDopo: null };
        }
        if (possesso.pallaEntro9mDopo === null && Math.abs(gx - B.x) <= 9.2) possesso.pallaEntro9mDopo = n(g.time - possesso.inizio);
        if (T.some(t => t.players.some(p => p.excluded || p.uscendo))) {
          for (const s of minacce.values()) chiudiMinaccia(s, 'non-parita');
          minacce.clear(); return;
        }
        r.secondiParita += dt;
        const D = attivi(dif), A = attivi(att), presenti = new Set();
        let liberi = 0, viciniPorta = 0;
        for (const q of A) {
          const identita = id(q); presenti.add(identita);
          const entro = Math.hypot(gx - q.x, q.z) <= 7, coperto = entro && copertori(q, D).length > 0;
          let s = minacce.get(identita);
          if (!s) { s = { q, entro: false, coperto: false, episodio: null }; minacce.set(identita, s); }
          if (entro) {
            viciniPorta++;
            if (!coperto) {
              liberi++;
              if (!s.episodio) {
                const abbandono = s.entro && s.coperto;
                if (abbandono) r.abbandoni++;
                const marcatore = D.find(d => dif.accoppiamenti?.uomini[d.i] === q);
                s.episodio = { inizio: n(g.time), attaccante: punto(q), difesa: dif.short,
                  origine: abbandono ? 'abbandono' : 'ingresso-libero', fase: schierata(dif) ? 'schierata' : 'transizione',
                  marcatore: punto(marcatore), palla: palla() };
              }
            } else chiudiMinaccia(s, 'coperto');
          } else chiudiMinaccia(s, 'fuori-7m');
          s.entro = entro; s.coperto = coperto;
        }
        for (const [identita, s] of minacce) if (!presenti.has(identita)) { chiudiMinaccia(s, 'uscito'); minacce.delete(identita); }
        r.maxLiberi = Math.max(r.maxLiberi, liberi);
        if (liberi) r.secondiConLiberi += dt;
        r.secondiAttaccanteLibero += liberi * dt;
        if (viciniPorta && !liberi && possesso.minacceCoperteDopo === null) possesso.minacceCoperteDopo = n(g.time - possesso.inizio);
        const assegnati = D.map(d => dif.accoppiamenti?.uomini[d.i]).filter(Boolean);
        if (new Set(assegnati).size < assegnati.length) r.accoppiamentiDuplicatiFrame++;
        let massimo = 0;
        const visitati = new Set();
        for (const d of D) {
          if (visitati.has(d)) continue;
          const gruppo = [d]; visitati.add(d);
          for (let i = 0; i < gruppo.length; i++) for (const altro of D)
            if (!visitati.has(altro) && Math.hypot(altro.x - gruppo[i].x, altro.z - gruppo[i].z) < 1.8) { visitati.add(altro); gruppo.push(altro); }
          massimo = Math.max(massimo, gruppo.length);
        }
        const sullaPalla = D.filter(d => Math.hypot(d.x - B.x, d.z - B.z) < 2.5).length;
        const G = r.gruppi;
        if (massimo >= 3) G.secondiTreVicini += dt;
        if (sullaPalla >= 3) G.secondiTreSullaPalla += dt;
        G.maxGruppo = Math.max(G.maxGruppo, massimo); G.maxSullaPalla = Math.max(G.maxSullaPalla, sullaPalla);
        if ((massimo >= 4 || sullaPalla >= 3) && g.time - ultimaEsempio >= 20 && G.esempi.length < 12) {
          G.esempi.push({ ...scena(dif), dimensioneGruppo: massimo, sullaPalla }); ultimaEsempio = g.time;
        }
      }
      memorizza();
      window.__sondaDifesa = {
        avanza(quanti) {
          for (let i = 0; i < quanti && g.state !== 'over' && r.frame < maxFrame; i++) {
            const prima = g.time;
            window.__passoDifesa(); r.frame++;
            scambi(); misura(Math.max(0, g.time - prima)); memorizza();
            if (fotoStato && fotoStato.prossima < 4 && r.frame >= fotoStato.frame0 + fotoStato.offset[fotoStato.prossima]) fotoStato.attesa = true;
            if (fotoStato?.attesa) return { foto: true, fine: false, frame: r.frame };
          }
          return { foto: false, fine: g.state === 'over' || r.frame >= maxFrame, frame: r.frame, periodo: g.period };
        },
        foto() {
          const F = fotoStato;
          if (!F?.attesa) throw new Error('Nessuna fotografia in attesa');
          H.renderer.info.reset(); H.renderer.render = renderOriginale;
          try { H.__ridisegna(); } finally { H.renderer.render = () => {}; }
          const info = H.renderer.info;
          const dati = { scambio: F.scambio, offsetSecondi: F.offset[F.prossima] / 60, camera: F.vista, ...scena(T[F.difesa]),
            budget: { chiamateDisegno: info.render.calls, triangoli: info.render.triangles, geometrie: info.memory.geometries,
              texture: info.memory.textures, pixelRatio: H.renderer.getPixelRatio(), larghezza: H.renderer.domElement.width,
              altezza: H.renderer.domElement.height, rigAggiornatiOgniTick: !H.senzaCorpi } };
          F.attesa = false; F.prossima++;
          if (F.prossima === 4) { H.vista = F.vistaPrima; H.camera.fov = F.fovPrima; H.camera.updateProjectionMatrix(); }
          return dati;
        },
        risultato() {
          chiudiPossesso();
          r.statoFinale = g.state; r.secondiGioco = n(r.secondiGioco); r.secondiParita = n(r.secondiParita);
          r.secondiConLiberi = n(r.secondiConLiberi); r.secondiAttaccanteLibero = n(r.secondiAttaccanteLibero);
          r.gruppi.secondiTreVicini = n(r.gruppi.secondiTreVicini); r.gruppi.secondiTreSullaPalla = n(r.gruppi.secondiTreSullaPalla);
          r.squadre = T.map((t, i) => ({ squadra: t.short, gol: t.score, tiri: H.v046.statPartita.squadre[i].tiri,
            scambiContatore: (t.scambi || 0) - contatori0[i].scambi, scambiRientroContatore: (t.scambiRientro || 0) - contatori0[i].rientri,
            statistiche: H.v046.statPartita.squadre[i] }));
          r.foto = fotoStato ? { scambio: fotoStato.scambio, fotogrammi: fotoStato.prossima } : null;
          return r;
        },
      };
    }, { seme: semi[k], cercaFoto: !!foto && !fotoPrenotate, maxFrame });

    let fine = false, ultimoPeriodo = 0;
    while (!fine) {
      const stato = await pg.evaluate(() => window.__sondaDifesa.avanza(600));
      fine = stato.fine;
      if (stato.periodo && stato.periodo !== ultimoPeriodo) {
        ultimoPeriodo = stato.periodo;
        console.log(`Partita ${k + 1}/2 · seme ${semi[k]} · ${ultimoPeriodo}° tempo (4 tempi da 180 s, clock iniziale verificato)`);
      }
      if (stato.foto) {
        fotoPrenotate = true;
        const dati = await pg.evaluate(() => window.__sondaDifesa.foto());
        const nome = `partita-${k + 1}-scambio-${dati.scambio}-t${String(dati.offsetSecondi).replace('.', '_')}.png`;
        await pg.screenshot({ path: path.join(foto, nome), timeout: 120000 });
        risultati.foto.push({ partita: k + 1, seme: semi[k], file: nome, ...dati });
      }
    }
    const r = await pg.evaluate(() => window.__sondaDifesa.risultato());
    r.errori = [...new Set(errori)]; r.secondiReali = +((Date.now() - inizio) / 1000).toFixed(2);
    risultati.partite.push(r);
    console.log(`Partita ${k + 1}/2: ${r.squadre.map(t => `${t.squadra} ${t.gol} gol/${t.tiri} tiri`).join(' · ')} · scambi osservati ${r.scambi.length} · schierati ${r.scambi.filter(s => s.difesaSchierata).length}`);
    await pg.close();
  }
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}

risultati.secondiReali = +((Date.now() - started) / 1000).toFixed(2);
risultati.esitoTecnico = risultati.partite.length === 2 && risultati.partite.every(r => r.statoFinale === 'over' && !r.errori.length) ? 'completo' : 'incompleto-o-errori';
if (foto) {
  if (!risultati.foto.length) risultati.notaFoto = 'Nessuno scambio reale a difesa schierata osservato nelle due partite; nessuna scena imposta.';
  fs.writeFileSync(path.join(foto, 'sequenza.json'), JSON.stringify({ metodo: risultati.metodo, foto: risultati.foto, nota: risultati.notaFoto }, null, 2) + '\n');
}
if (salva) { fs.mkdirSync(path.dirname(path.resolve(salva)), { recursive: true }); fs.writeFileSync(salva, JSON.stringify(risultati, null, 2) + '\n'); }
const somma = campo => risultati.partite.reduce((s, r) => s + r[campo], 0);
console.log(`2 partite · minacce libere nel ${(100 * somma('secondiConLiberi') / Math.max(1, somma('secondiParita'))).toFixed(2)}% del gioco alla pari · abbandoni ${somma('abbandoni')} · recuperi ${somma('recuperi')}`);
console.log(`Durata reale ${risultati.secondiReali}s · esito tecnico ${risultati.esitoTecnico}${salva ? ` · JSON ${salva}` : ''}${foto ? ` · foto ${risultati.foto.length}/4` : ''}`);
if (risultati.esitoTecnico !== 'completo') process.exitCode = 1;
