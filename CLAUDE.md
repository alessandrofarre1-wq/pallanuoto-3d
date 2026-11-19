# WATERPOLO 7 (pallanuoto-3d) — memoria del progetto

Gioco di pallanuoto 3D nel browser, «una sorta di FIFA per la pallanuoto», giocato soprattutto da iPhone in orizzontale con i
comandi touch (anche tastiera e controller). Proprietario: Ale, ex nuotatore agonista, non programmatore: spiega le scelte in
italiano semplice, senza gergo tecnico; risposte brevi con cosa è cambiato e cosa provare; chiedi conferma prima di cambiamenti
grossi di direzione. Gli screenshot e i video di Ale sono la verità.

Questa memoria contiene solo regole e decisioni **in vigore** (versione attuale: v0.64). Il resto è in `docs/`:
- `docs/storia.md`: tutta la storia versione per versione (fino alla v0.61 il testo originale della vecchia memoria, 213 KB);
- `docs/decisioni-superate.md`: com'era e cosa vale ora, per ogni decisione cambiata;
- `docs/versioni/`: il rapporto di ogni versione; `docs/riferimenti/`: tattica, tecnica, fisica, valutazioni, ecc.;
- `docs/README.md`: l'indice; `docs/PASSAGGIO-CLAUDE-CODE.md` e `docs/PASSAGGIO-CODEX.md`: consegne tra Claude Code e Codex.

## Come lavorare
- **Prima di ogni sviluppo**: Ale lavora anche con Codex. Scaricare `main` e i rami `codex/*`, leggere le PR aperte e il codice
  ATTUALE dei file coinvolti; se il codice non corrisponde a questa memoria, dirlo ad Ale. Non rompere il lavoro di Codex.
- **Versioni e PR**: ogni PR alza la versione di 0,01 (`npm version 0.xx.0 --no-git-tag-version`: `package.json` e lock sono
  l'unica fonte, il gioco la mostra in home e in pausa) e ha il titolo «v0.xx: …». Ogni PR: rapporto in `docs/versioni/`, una voce
  in cima a «Versioni dopo il riordino» in `docs/storia.md` (richiesta di Ale, cambiamenti, file, numeri misurati, decisioni
  superate, verifiche, non fatto) e aggiornamento qui delle sezioni toccate; ogni decisione cambiata va segnalata nella PR e in
  `docs/decisioni-superate.md`.
- **Prima della PR**: `npm run lint`, `npm run prove` (gli stessi passi della CI in locale), `npm run verifica` (sei partite con
  il caso bloccato e cinque immagini: guardare sempre i confronti in `tests/screenshot/confronto/`; aggiornare i riferimenti con
  `npm run verifica:aggiorna -- --partite=0` solo dopo averli controllati) e `npm run aspetto`. Nella descrizione gli esiti veri.
- **Limiti iPhone vincolanti**: meno di 100 oggetti disegnati e meno di 150.000 triangoli per fotogramma, anche durante cambi e
  replay. Se una modifica li supera, chiedere ad Ale prima di tenerla. Da qui non si misurano gli FPS di un iPhone vero: conta il
  contatore di Ale (`?fps` o menu Opzioni).
- **Caso**: nel gioco solo `rnd` (`costanti.js`); nella grafica `rndGrafica`; mai `Math.random`.
- **Solo disegno**: i ritocchi visivi vanno nello strato visuale (`posturaVista`, `articolaVista`, `p.Jv` in `grafica/pose.js`);
  le giunture del gioco `p.J` decidono `p.ballW`, il punto da cui parte la palla di chi la tiene. Per dimostrare che la partita
  non cambia: `node tests/aspetto.mjs <cartella> --dist=<build di prima> --salva=prima.json`, poi
  `npm run aspetto -- <cartella> --confronta=prima.json`.
- **Numeri**: quelli del bilanciamento stanno in `src/taratura.js` con il valore reale accanto (`npm run taratura` stampa gioco
  contro realtà); quelli della palla in `src/fisica-palla/parametri.js` con la fonte. Effetti d'acqua solo da `evento(...)` in
  `grafica/acqua-eventi.js` (con i `LIMITI`); ogni materiale che va in acqua passa da `sottAcqua()`.
- **Misurare prima di correggere**: `npm run taratura` (8 partite ITA–HUN tre alla volta, gioco contro realtà; `--salva=` e
  `--confronta=` per il prima e dopo), `npm run bilancio` (`--partite=8 --squadre=ITA,HUN --paralleli=3`, anche `--dist=` e
  `--porta=` per girare in sottofondo), sonde in `strumenti/` (`sonda-tiri`, `sonda-azioni`, `misura-azione-v053`, `sonda-passaggi`,
  `sonda-ripartenza`, `foglio-tiro-v061`). Tra due giri da 8 partite c'è qualche punto di variazione. Per i movimenti
  `npm run primi-piani` (primi piani e sequenze), `npm run gesti`, `npm run gesti-foglio` (otto gesti da tre lati in sei momenti,
  con misure di gomiti, mani, gambe e compenetrazioni) e i fogli in `strumenti/` (`finte-foglio`, `lotta-foglio`).
- **Prove nel browser** (Playwright, Chromium senza scheda grafica): il `requestAnimationFrame` è finto, quindi ogni
  `waitForFunction` vuole `{timeout:60000,polling:100}`; con il tempo finto la cattura della pagina può bloccarsi: le foto si
  prendono dalla tela (`__ridisegna()` + `toDataURL`); un gol in una scena fa partire il replay che congela il gioco
  (`replay.interrompiReplay()`); per escludere i contrasti del computer azzerare `tackleCD` e `colpi`; `cp -r dist cartella` su una
  cartella esistente copia dentro; un processo lanciato con `&` dentro un comando viene chiuso a fine comando (usare l'esecuzione
  in sottofondo dello strumento).
- **Video di Ale**: `ffprobe` per durata e risoluzione, `ffmpeg -vf "fps=4,crop=…,scale=…,tile=…"` in una cartella dello
  scratchpad, poi ingrandimenti a 8-15 fotogrammi al secondo dei momenti chiave; le registrazioni a 60 fps permettono di misurare
  tempi e velocità. YouTube da qui non si scarica: chiedere registrazioni dello schermo. WebFetch non raggiunge i siti delle
  regole, `curl` sì.
- **Ambiente**: npm funziona, cdnjs no; Blender si usa come modulo Python (`pip install bpy`) per i modelli
  (`strumenti/blender/`). Per le espressioni del viso Ale ha chiesto di non aggiungere né eseguire prove se non lo chiede lui.

## Mappa del codice (`src/`)
- Partita e regole: `partita.js` (ciclo di gioco), `regole.js` (falli, espulsioni, rigori, possesso, `giveBall`), `stato.js`,
  `costanti.js`, `statistiche.js` (contatori ed esiti delle azioni), `gioco-fermo.js`, `pozzetto.js`, `panchina.js`.
- Numeri del bilanciamento: `taratura.js` (con i riferimenti reali; `ia.js`, `fisica.js`, `lotta.js`, `regole.js`, `tiri.js`,
  `partita.js`, `finte.js` e `panchina.js` li importano e li riesportano con lo stesso nome).
- Movimento e palla: `fisica.js` (nuoto, parata, muro, intercetto, presa, uscite), `palla.js` (Rapier), `fisica-palla/`.
- Computer: `ia.js` (attacco `aiCarrier`, posti, marcature, difese, ripartenza), `lotta.js` (centroboa), `centroboa.js`,
  `tiri.js` (gesti, tiri, passaggi), `finte.js`, `muro.js`, `controfuga.js`, `uomo-in-piu.js` e `schemi.js`.
- Comandi: `input.js`, `controllo.js`. Interfaccia: `hud.js`, `cronaca.js`, `menu.js`, `panchinaVista.js`, `tattiche-*.js`,
  `uomo-editor.js`, `replay*.js`, `tornei.js`, `rigoriFinali.js`, `index.html`, `stile.css`.
- Grafica (`grafica/`): `scena.js`, `pose.js` (giunture e gesti), `corpo.js` (ossa del modello), `modello.js`, `espressioni.js`,
  `replay.js` e `replay-camera.js`, `sottacqua.js`, `acqua-eventi.js`, `arena.js`, `costumi.js`, `render.js`, `qualita.js`.
- Dati: `dati/squadre.json`, `dati/rose-db.json` (da `npm run rose-db`), `dati/bandiere.js`.

## Decisioni in vigore
### Piattaforma, schermo, interfaccia
- Browser, grafica 3D solo Cartoon, avversario il computer, stile simulazione. Partita solo in orizzontale (in verticale «Ruota il
  dispositivo», gioco fermo); il menu si usa anche in verticale. Margini sicuri per notch e barre di Safari.
- Regia unica da ripresa TV (alta, di lato, verso la porta dove si gioca, più larga in ripartenza); ritmo unico (SPEED 1).
- HUD: tabellone in alto a sinistra con gli espulsi (nome e tempo) sotto; giocatore, schemi e cambi a destra; pannello del
  giocatore solo per 3 s dopo un cambio manuale e a inizio partita; CAMBI in basso al centro solo con un consiglio urgente o un
  cambio in corso (area di tocco 44 px); registro degli eventi dal menu di pausa; notifiche in stile telecronaca ai margini, mai al
  centro (`cronaca.js`); colori con significato fisso (oro = tu e azioni richieste, rosso = sanzioni e urgenza, ciano = servizio).
- Replay del gol: 7,6 s saltabili (1,2 s diretta + 5,2 s replay + 1,2 s ripresa), motore fermo durante la clip; camera che gira di
  circa 35° attorno all'azione e scende, poi taglio con lampo sul primo piano a pelo d'acqua del marcatore che esulta (si alza e
  agita il pugno; 1,15 s registrati dopo la rete, 38% del replay; niente primo piano se è appena stato sostituito). Prova
  `npm run replay`.
- Menu: home con logo C «Flusso», Partita veloce, Mondiali, Europei, Comandi, Informazioni; Squadre (formazione dei 7, strategie
  prepartita: cinque preset e una personale, schemi dell'uomo in più) → Impostazioni (durata, difficoltà, arbitro) → Gioca.
### Comandi
- Touch: levetta a sinistra; TIRO: tocco (< 0,16 s) = finta ripetibile, tenuto fino a 0,36 s = polso, più a lungo = tiro caricato
  (pieno in 0,9 s, parte al rilascio); un tocco mentre arriva un passaggio = tiro al volo. PASSA; in difesa = contrasto (1-2 tocchi
  in 1,5 s disturbano, il terzo ravvicinato è fallo). SPRINT a tocchi ripetuti. CAMBIA va al compagno più vicino alla palla.
  TAGLIO (taglio, girata, raddoppio), PALOMB. solo con la palla nostra, T.O., pausa. In controfuga TIRO si illumina: schizzo oltre
  5,5 m, colonnello più vicino. Con la levetta ferma il ricevente comandato va incontro alla palla; finta di lato con la levetta.
- Tastiera: frecce; Spazio (tocco = finta, tenuto = carica, rilascio = tiro); D passaggio (contrasto in difesa); K tiro e L
  palombella; Shift sprint a tocchi; C cambia; F taglio/girata/raddoppio; Q/W/E o 1/2/3 schemi, 4 schema «boa» (in
  superiorità torna al 4-2); T time-out; B cambio consigliato; P o Esc pausa. Controller con la stessa logica.
### Nuoto e corpo (indicazioni di Ale, ex nuotatore)
- Tutti i movimenti sono costruiti sulle ossa (niente animazioni registrate). Stile libero a testa alta, mai rana o stella; chi
  porta palla la spinge davanti alla testa. Da fermi acqua alle spalle, corpo comunque inclinato (bacino e gambe indietro, di più
  per chi marca; dritto a gioco fermo); in nuotata corpo orizzontale appena sotto la superficie con onda «a serpente».
- Alzata in 0,25 s, distensione poco di più, transizioni sempre continue; controllo preciso con una piccola inerzia; il corpo si
  piega nelle curve (testa e spalle guidano, bacino e gambe seguono); bicicletta da fermi; braccia morbide, mai «a cavalletta».
- Corpi e palla non si compenetrano; gambe mai fuori dall'acqua (bacino disegnato al massimo 22 cm sotto il pelo, 16 nel tiro da
  fuori). Stanchezza al massimo −18% di velocità, con la palla −7%.
### Gesti: tiro, passaggio, finta, portiere
- Tiro (tesi Patumi): 20-25 m/s al rilascio, frusta 166-189 ms, gomito 147-157°, il classico è il più preciso; nel tiro da fuori
  il corpo esce quasi fino ai fianchi (solo disegno). Palla tenuta alta, mano dietro la palla, gomito in fuori; rilascio come
  accompagnamento; con un avversario vicino si protegge la palla girando busto e testa; il centroboa marcato tiene la palla in acqua
  finché non fa un gesto. Mancini con i gesti allo specchio.
- Passaggi alti e tesi (11-15,5 m/s); presa alla mano (0,55 m, portiere 0,9 m); errore verosimile, mai grossi sbagli su passaggi
  semplici; al centroboa marcato la palla arriva in acqua davanti a lui; mai al proprio portiere in attacco. Nel passaggio di lato
  busto e testa girano verso il compagno e la mano non passa davanti al viso; chi riceve guarda la palla (solo disegno).
- Chi nuota con la palla davanti alla testa, prima di tirare, passare o fintare la pesca dall'acqua e la porta di lato all'altezza
  della spalla (solo disegno, dentro i tempi del gesto).
- Finte: un tocco; sei stili personali (larga, a raffica, di polso, mezza, di bomba, di spalla) con un piccolo vantaggio sul
  seguito tipico; dalla seconda finta il braccio va di lato e sposta difensore e portiere.
- Portiere: segue il passaggio, para in base a posizione, Riflessi, stanchezza, sorpresa e muro; para meno dopo un cambio di lato,
  in superiorità, dopo una finta o su tiri vicini; mentre l'avversario carica sale a braccia larghe (solo disegno).
### Attacco del computer
- Circolazione: palla in mano 0,4-0,7 s sul perimetro (`CIRCOLAZIONE`); costruzione di 18 s prima di cercare il tiro da libero,
  anche nella ripartenza alla pari (il tiro subito dopo la ricezione è sicuro solo nella controfuga con l'uomo in più); palla al
  centroboa dopo la costruzione (vantaggio che cresce dai 7 ai 15 s, `CENTRO_ATTESA`); tiro subito dopo una ricezione libera
  deciso una volta (circa 1 su 3 in parità); pazienza fino a fine azione (tiro di fine azione negli ultimi 4,5 s, `FINE_AZIONE`).
- La squadra sale per corsie, scaglionata per ruolo: nessuno va tutto sulla palla (richiesta di Ale).
- Ripartenza dopo ogni recupero: compagni che scattano ai posti, aperture del portiere («base» e «apertura2»); controfuga
  organizzata in corsie.
- Superiorità: schemi a fasi (libreria di 10, il giocatore ne sceglie 3; il computer usa i tre di partenza e «Uscita del 6»),
  «quick» in 3 superiorità su 10, tiro al volo dopo il cambio di lato.
### Difesa
- A uomo il punto marca il centroboa (`MARK`); pressing di base, zona e zona a M che scelgono chi lasciare tirare, cambio di
  marcatura, rientro difensivo, marcatura staccata lontano dalla palla, scivolamento in verticale, intercetti che nascono dalla
  difesa.
- Muro: braccio dalla parte del palo coperto in parità; con l'uomo in meno braccio a specchio del braccio di tiro e centrale tra i
  pali sul palo lungo; contro il 3-3 i due davanti ai pali stanno a metà tra il loro tiratore e il 6 e saltano su chi ha palla.
### Regole (World Aquatics 18 febbraio 2026; FIN 2026-27 non importato)
- Campo 25 m, porta 3 × 0,90 m; linee 2, 5 e 6 m. Possesso 28 s, 18 s dopo espulsione, angolo, rigore senza cambio o rimbalzo
  ripreso dall'attacco; dopo un tiro respinto il cronometro resta fermo finché qualcuno riprende palla. Espulsione 18 s (rientro
  anticipato su gol o palla riconquistata), terzo fallo grave = fuori per il resto della partita (entra un sostituto); cambi
  illimitati.
- Rigore dai 5 m con gli altri sulla linea dei 6 ad almeno 3 m dal tiratore; tiro libero: dentro i 6 m si passa, fuori si può
  tirare subito; area di porta (2 m, fino a 2 m oltre i pali): attaccante dentro l'area davanti alla linea della palla = fallo.
  Fuori dal fondo: angolo se tocca per ultimo il portiere o se lancia la squadra che difende; tiro murato da un difensore di
  movimento = rimessa del portiere; fuori di lato = tiro libero agli avversari di chi ha toccato per ultimo. Nessun tempo per
  superare la metà campo; passare indietro e al portiere è permesso; fallo per chi rinuncia apposta al possesso. Time-out 2 a
  squadra, solo in possesso, ripresa da metà campo; rigori finali nei tornei.
- Arbitro: circa 70% delle espulsioni dalla lotta al centro (cresce con l'azione), contrasto a tre livelli, sfondamento, vantaggio
  in controfuga, simulazione, interferenza sul tiro libero, anticipo battuto al centroboa (rigore o espulsione).
- Espulso che nuota al pozzetto e rientra solo da lì; cambio dal pozzetto senza «cinque»; cambi volanti con il cinque, immediati
  dopo gol, time-out e tra i tempi; il computer cambia chi scende sotto il 34%; consigli di cambio mai in difesa né nei primi 90 s.
### Grafica
- Un solo modello (il pallanuotista del concept di Ale, v2 con espressioni), colorato per squadra; aspetto dal database (pelle,
  capelli, barba, altezza, corporatura); calottine: squadra del giocatore bianca, computer blu scuro, portieri rossi; costumi con
  bandiera; numero sulla cuffia; niente loghi o stemmi.
- Acqua unica disegnata, colori sott'acqua per profondità, contatti e scie dal movimento vero; qualità automatica che abbassa e
  recupera la risoluzione; riflesso completo solo in qualità alta; porte dal riferimento di Ale; arena con tribune leggere.
### Squadre, tornei, valutazioni
- 24 nazionali; rose vere dal database di Ale (`npm run rose-db`, metodo in `docs/riferimenti/valutazioni.md`), nomi veri
  autorizzati; statistiche 40-99 che cambiano davvero le prestazioni; formazione ricordata per nazionale.
- Mondiali (24 disponibili, 16 estratte per fasce, la scelta di Ale sempre dentro) ed Europei (16), campagna salvata tra le gare,
  bacheca e premiazione.

## Numeri: gioco contro realtà
8 partite ITA–HUN, per squadra, v0.64. Riferimenti: Mondiali 2025, Mondiali 2009, Euro League, video della finale olimpica. La
tabella completa (15 voci, con lo stato e i numeri da guardare) la stampa `npm run taratura`.

| | gioco | reale |
|---|---|---|
| tiri | 35,3 | 33 |
| gol | 12,9 | 13,3 |
| tiri in gol | 36,5% | 40% |
| espulsioni | 11,4 | 11 (66% dal centroboa; in gioco 66,5%) |
| superiorità trasformate | 40,1% | 52% |
| rigori | 1,6 | 1,8 |
| azioni a partita | 66 | circa 50 |
| azione in parità: durata | 15,4 s | circa 21 s (con 30 s di possesso) |
| azione in parità: tiro sbagliato | 28,8% | circa 32% |
| azione in parità: palla persa | 16,3% | circa 20% |
| azione in parità: fallo in attacco | 14,4% | circa 15% |
| palla in mano prima del passaggio | 1,01 s | 0,6-1 s (finale olimpica) |

## Cosa resta da fare
- Gioco: azioni ancora corte (15 s invece di 21, 66 invece di 50): va ripensata la ripartenza, dove tutti scattano subito ai
  posti (insieme al computer che scatta molto e si stanca); superiorità sotto il 52%; gol da entrata quasi zero; difesa
  adattata agli schemi dell'uomo in più; aiuto al posto per i difensori comandati con l'uomo in meno; 7 contro 6 chiamabile dal
  giocatore.
- Gesti: giudizio di Ale sui fogli della v0.63 (passaggio di lato, ricezione, pesca della palla, esultanza); muro e parata a
  braccio del tutto teso; corpo in nuotata con la palla forse troppo inclinato (da confrontare con un video).
- Riordino: prove con nomi per argomento (oggi si chiamano con la versione in cui sono nate); semplificare `aiCarrier`.
- Da Ale: prova su iPhone (FPS, sensazioni), giudizi sulla naturalezza, nuovi video, scelta dei tasti per comandi nuovi.

## Fonti
- Regolamento World Aquatics (febbraio 2026) e modifiche 2025; FIN 2025-26 come confronto; tesi Patumi (PoliTo) sul tiro; de
  Mestre 2004 sulla palla in acqua; Results Report dei Mondiali 2025; Lupo et al. (Mondiali 2009, Euro League); manuali FIN e USA
  Water Polo; wpdworld.com (`docs/riferimenti/tattica.md`, `tecnica.md`); riferimento visivo Water Polo Revolution
  (ericflorio.itch.io). Indirizzi completi nella storia.
