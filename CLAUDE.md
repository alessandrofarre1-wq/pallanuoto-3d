# Pallanuoto 3D — memoria del progetto

Gioco di pallanuoto 3D nel browser, "una sorta di FIFA per la pallanuoto". Proprietario: Ale, ex nuotatore agonista, non programmatore: spiega le scelte in italiano semplice, senza gergo tecnico, e chiedi conferma prima di cambiamenti grossi di direzione.

## Stato attuale (v0.17, novembre 2026)
- v0.17 = correzioni chieste da Ale dopo aver giocato la v0.16 (menu, fluidità del movimento, contrasto, palla vagante, uomo in più, tempo per l'azione). Dettagli nella sezione "Correzioni v0.17" più sotto.
- v0.16 = passi 1-7 di `docs/sessioni.md` fatti in un'unica sessione (regole, squadre, statistiche, portiere, tiri, difesa e allenatore, arbitro e bilanciamento). Dettagli nella sezione "Passi 1-7 (v0.16)" più sotto.
- Progetto Vite a moduli in `src/` (stesso identico gioco della v0.9, solo riorganizzato): `costanti`, `stato`, `giocatori`, `regole`, `partita` (ciclo di gioco), `lotta`, `fisica`, `palla` (fisica della palla con Rapier), `tiri`, `ia`, `controllo` (comandi umani), `input`, `hud`, `menu`, `audio`, `grafica/` (`scena`, `acqua`, `modello`, `corpo`, `pose`, `render`). Three.js 0.187 da npm (aggiornato dalla r128 nella fase 1 del piano; richiede WebGL2, cioè iPhone con iOS 15 o successivo).
- Le variabili condivise che cambiano si modificano con funzioni apposite: `setCtrl`, `resetTap`, `setPeriodLen`, `setDiff`, `setSpeed`, `setDpr`.
- Colori: gestione moderna di Three.js (immagini marcate sRGB, luci ritarate: `LUCE_CIELO`, `LUCE_SOLE` in `grafica/scena.js`) per restare uguali alla v0.9.
- Il caso del gioco passa tutto da `rnd` (`costanti.js`): mai usare `Math.random` direttamente nel codice del gioco, altrimenti la verifica non è più ripetibile.
- Acqua (`grafica/acqua.js`, adattata da Water2 di Three.js): tre livelli scelti dal menu ("Acqua: Auto/Alta/Media/Bassa") o calati in automatico se il dispositivo fatica (ordine dei tagli in `main.js`: riflesso, poi risoluzione, poi acqua semplice). Alta = riflesso + vista sott'acqua deformata; media = solo vista sott'acqua; bassa = acqua della v0.9.
- Strati di disegno (`STRATO_*` in `acqua.js`): ogni oggetto nuovo va messo nello strato giusto (vasca, corpi, sopra l'acqua, solo vista), altrimenti non compare nel riflesso o sott'acqua, oppure viene ridisegnato inutilmente.
- Telecamera: laterale alta e vicina in orizzontale; in verticale da dietro e dall'alto. Giocatore controllato indicato da una freccia bianca sopra la testa. Schiuma disegnata in un solo oggetto.
- Giocatori: corpo con scheletro mosso interamente da noi, osso per osso, senza animazioni registrate (`grafica/corpo.js`). `pose.js` decide dove stanno le giunture (bacino, petto, spalle, gomiti, mani, ginocchia, piedi) e `corpo.js` le applica alle ossa e aggiunge le gambe a bicicletta. Cilindri e sfere restano solo come riserva se il modello non si carica.
- Il codice non dipende dal modello: tutto ciò che è specifico (file, nomi delle ossa, corporature, pelli) sta in `grafica/modelli/atleta.js`; la scala si ricava da sola dalla larghezza delle spalle.
- Modello attuale (v0.13): atleti costruiti dai dati liberi (CC0) di MakeHuman con `npm run costruisci-atleta -- <dati MPFB> <risorse MakeHuman>` (`strumenti/costruisci-atleta.mjs`: legge direttamente forma base, muscolatura, ossatura con pesi, pelli, occhi, sopracciglia; non servono né MakeHuman né Blender). Risultato in `src/grafica/modelli/`: 3 corporature (`atleta-a/b/c.glb` da 5.400 triangoli per la scena, `-lontano` da 1.700 per la vista sott'acqua; la testa ha un suo conto di triangoli perché il viso resti liscio), 5 pelli con volto (`pelle-*.jpg`, 1024 punti; due con ombra di barba disegnata) e `misure.json` (forma del cranio per la calottina, fascia del costume). In tutto circa 1,5 MB. Ogni giocatore prende una pelle in base al suo numero.
- Da dove vengono i dati (NON nel repository, sono grandi): cartella `src/mpfb/data` di github.com/makehumancommunity/mpfb2 e pacchetto `makehuman_system_assets_cc0.zip` da files.makehumancommunity.org (indirizzo permesso nell'ambiente cloud "pallanuoto-3d", creato apposta).
- Calottina: oggetto a sé che segue la forma del cranio misurata sul modello, con bordo bianco, numero su lati e nuca, paraorecchie rigidi con fori e laccetti annodati sotto il mento (`calottinaGeo` in `corpo.js`). Palla: gialla a spicchi con cuciture scure e gomma ruvida (`ball3d` in `scena.js`).
- Il vecchio manichino Y Bot di Mixamo non è più usato (resta `npm run converti-modello` per eventuali modelli FBX). Gli FBX caricati da Ale su `main` restano nella cronologia di git.
- Corpo e fisica sono legati da `p.oriz` (0 = verticale, 1 = disteso), aggiornato in `movePlayer` (`fisica.js`). Dalla v0.17: ci si alza in `ALZATA` secondi (0,25; provvisoriamente scelto dal menu) e ci si distende in un decimo in più; lo spostamento invece è scivoloso (vedi "Correzioni v0.17"). Chi tira o passa mentre è disteso aspetta solo il tempo di alzarsi (`startAct` in `tiri.js`) e intanto continua a scivolare.
- Palla (v0.14): fisica vera in `src/palla.js` con il motore Rapier (`@dimforge/rapier3d-compat`, circa 1,6 MB in più da scaricare, compressi). Rapier muove la palla e calcola gli urti con pali, traversa, rete e corpi dei giocatori (solo palla vagante); noi aggiungiamo resistenza dell'aria, effetto della rotazione (Magnus), schizzo sull'acqua dei tiri tesi e veloci, tonfo, galleggiamento e attrito dell'acqua. `velocitaDiLancio` calcola la partenza tenendo conto di aria ed effetto, così tiri e passaggi arrivano dove si mira. Le regole restano in `fisica.js` (`updateBall`): parata, muro e intercetto sono ancora decisi con le probabilità di prima, ma la palla respinta ora rimbalza davvero; gol e fuori si decidono dal passaggio vero della linea (vale anche il palo-gol); dopo il gol la palla finisce in fondo alla rete (`ball.inRete`).
- Aspetto della palla: gialla, 18 spicchi a gruppi di tre con solchi scuri e buccia ruvida, calcolata punto per punto sulla sfera (`ball3d` in `scena.js`); gira secondo la rotazione vera e galleggia per un terzo sott'acqua.
- `npm run fisica-palla`: 10 prove della palla fuori dalla partita (mira, palo, palo interno, traversa, rete, schizzo, palombella, effetto, corpi) e disegno delle traiettorie in `tests/screenshot/fisica-palla.png`. Da rifare a ogni modifica di `palla.js`.
- Dati della tesi Patumi applicati (v0.15; la tesi misura il tiro in atlete semi-professioniste e riporta gli studi su professionisti):
  - aria tarata sulla misura della tesi: da 13,3 m/s al rilascio a 12,2 m/s dopo 5 m (`ARIA` in `palla.js`);
  - velocità al rilascio: professionisti 22,8 ± 2,4 m/s a tutta forza, spostata dalla bravura al tiro tra circa 20 e 25 (`doShoot`); il tiro classico è il più veloce;
  - tempo dal braccio caricato al rilascio: 166 ms (bravi) – 189 ms (meno bravi), campo `frusta` dell'azione (`startAct`); il busto ruota in 125 ms e il braccio segue (`pose.js`);
  - gomito al rilascio 147°–157° secondo la bravura; chi è stanco esce meno dall'acqua;
  - la precisione non dipende dalla forza del tiro (nella tesi non c'è correlazione); il tiro classico è più preciso di beduina, sciarpa e colonnello;
  - rigori: il portiere para molto meno (negli studi citati entra l'80,1%);
  - nuovo tiro "a sciarpa" del centroboa, alternato alla beduina.
- `npm run dati-tesi` misura il gioco contro questi numeri (velocità dopo 5 m, rigori segnati su 240, velocità e tempo di rilascio). Da rifare se si toccano tiri, palla o portiere.
- Mirino sulla porta mentre il giocatore controllato carica o esegue un tiro (`mirino` in `scena.js`, aggiornato in `render.js`).
- Contatore FPS: si accende dal menu (o con `?fps` nell'indirizzo); mostra fotogrammi al secondo, qualità di disegno, livello dell'acqua, oggetti disegnati e triangoli.
- `legacy/index.html` è la v0.9 in un solo file e `legacy/three-r128.min.js` la sua libreria: termine di paragone, non modificarli.
- Pubblicazione: GitHub Actions (`.github/workflows/pages.yml`) verifica e pubblica su GitHub Pages a ogni modifica di `main`.
- Pubblicato anche come artifact su claude.ai (versioni v0.1 → v0.9).
- Giocato soprattutto da iPhone, sia in orizzontale sia in verticale, con comandi touch. Supporta anche tastiera e controller (Gamepad API).

## Scelte fissate con Ale
- Piattaforma browser, grafica 3D, controlli tastiera o controller (+ touch), stile simulazione, avversario il computer.
- Italia (calottine blu, umano) contro Ungheria (bianche, computer); portieri in rosso.
- Regole: World Aquatics 2026 (fonte principale) e Regolamento Tecnico FIN 2025-26.

## Regole già implementate
- Campo 25 m tra le linee di porta, porta 3 × 0,90 m; linee 2, 5 e 6 m (il 6 m è una LINEA trasversale, non un raggio).
- Possesso 28 s; 18 s dopo espulsione, tiro d'angolo, rigore senza cambio palla o rimbalzo ripreso dall'attacco. Dopo un tiro respinto il cronometro resta fermo finché qualcuno riprende palla.
- Espulsione 18 s, rientro anticipato su gol o palla riconquistata; terzo fallo grave = cambio.
- Rigore dai 5 m; tiro d'angolo; rimessa del portiere; palla fuori lateralmente = tiro libero agli avversari di chi l'ha toccata per ultimo (muro su tiro: resta a chi ha murato).
- Tiro libero: dentro i 6 m si deve passare o uscire oltre i 6; fuori dai 6 il tiro diretto immediato è ammesso (art. 7.5.1.2). Ale pensava che si dovesse sempre passare: gli è stata spiegata la regola, si è tenuta quella ufficiale.
- Area di porta (art. 8.2.8): attaccante davanti alla linea della palla = fallo. Misure: dalla linea di porta ai 2 metri, fino a 2 m oltre ciascun palo (CONFERMATE, vedi `docs/tecnica.md`). La regola vale solo dentro l'area: un attaccante laterale fuori dall'area ma dentro i 2 metri può ricevere.
- Rigore (corretto nella v0.16): tutti gli altri giocatori (tranne tiratore e portiere) stanno sulla linea dei 6 metri, ad almeno 3 m dal tiratore (`setupPenalty` in `regole.js`).
- Time-out: 2 a squadra, solo in possesso, ripresa da metà campo.
- Non implementati: rigori finali in caso di parità, VAR, cambi volanti.

## Gioco già implementato
- Ruoli: centroboa, ali, mezzi, punto; arco 3-3 in attacco; 4-2 con uomo in più (`FORM_UP`); con uomo in meno tre sulla linea dei 2 metri e due davanti ai pali (`DEF_DOWN`).
- Marcature per lato di vasca (array MARK): il punto marca il centroboa.
- La squadra sale per corsie, scaglionata per ruolo: nessuno va tutto sulla palla (richiesta esplicita di Ale).
- Schemi chiamabili: attacco Arco/Entrata/Incrocio/Palla al boa; difesa A uomo/Zona/Pressing; taglio di un compagno; raddoppio.
- Contrasto (v0.17): un tocco = provare a rubare palla senza fallo; tenuto = fallo voluto (vedi "Correzioni v0.17"). Finta di tiro (doppio tocco) con difensori che abboccano, tiro rapido, tiro caricato, palombella, beduina, colonnello, tiro a schizzo.
- Lotta al centro: barra di posizione boa/marcatore basata su forza e stanchezza; tenere SPRINT = spingere; il boa con palla guadagna espulsioni o falli, può fare girata (rigore se trattenuto), beduina o scarico.
- Fisica: acqua che frena, bisogna girare il corpo prima di nuotare, resistenza corpo a corpo, sprint che consuma resistenza.
- IA con steering (separazione, aggiramento, inseguimento della palla).
- Portiere che esce sulle palle vaganti vicino alla porta.

## Problemi aperti e richieste di Ale
1. GRAFICA: obiettivo dichiarato il livello di "Saltline" (FPS fatto da Claude Fable 5.2 in un artifact, tutto procedurale). Oggi i giocatori sono cilindri e sfere animati con IK fatta a mano. Mai visto un render reale finora: lavora SEMPRE con screenshot (es. Playwright) e confronta.
2. Movimenti di nuoto e tiro più realistici (fonte: tesi Patumi, PoliTo, fasi del tiro; velocità palla 13–23 m/s).
3. Fluidità su iPhone: tenere d'occhio il numero di oggetti e di draw call; qualità adattiva già presente.
4. In orizzontale il joystick copriva la porta di sinistra quando si difende: con la telecamera della v0.10 la porta sta più in alto e il joystick a riposo è semitrasparente. Da confermare con Ale su iPhone.
5. Bilanciamento: conversione dei tiri intorno al 40% nelle partite simulate.

## Riferimento visivo: Water Polo Revolution (video pre-alpha v0.1.4, Eric Flório, 2019)
Ale ha indicato questo video come riferimento: https://www.youtube.com/watch?v=EUJ9M41NlCc
Cosa si vede e cosa prendere (osservato su 5 fotogrammi):
- Telecamera laterale, alta ma vicina, che inquadra la metà campo dove si gioca: l'acqua riempie lo schermo, niente tribune né cielo in vista.
- Acqua trasparente con onde fitte (normal map) e rifrazione: i corpi sott'acqua si vedono distorti e ondeggianti. È l'elemento che dà più realismo.
- Giocatori quasi tutti immersi: fuori dall'acqua solo testa, collo e spalle. Corpo verticale da fermi.
- Chi nuota lascia una scia di schiuma dietro di sé.
- Al tiro: braccio alzato con la palla sopra la testa e un mirino sulla porta che indica dove andrà il tiro.
- Giocatore controllato indicato da una piccola freccia bianca sopra la testa (non un anello sull'acqua).
- Porte semplici bianche; corde laterali con i colori delle zone.
Cose da NON copiare: è un pre-alpha senza interfaccia, senza avversari visibili e con una sola squadra in campo.

## Roadmap concordata
1. FATTO (v0.9.1): migrazione a progetto vero: Vite, moduli, verifica automatica, GitHub Pages.
2. Grafica e fisica realistiche: vedi "Piano grafica e fisica realistiche" in fondo (6 fasi, approvato).
3. IA più ricca con steering behaviors (Reynolds) e macchine a stati.
4. Squadre, statistiche, modalità torneo/carriera.

## Fonti indicate da Ale
- World Aquatics Competition Regulations, parte pallanuoto (feb 2026): https://www.worldaquatics.com/rules/competition-regulations
- Estratto regole 2026: https://www.bwpl.org/uploads/2/6/5/9/26598283/water_polo_rules_extract_from_2026-02-18_world-aquatics_cr-final.pdf
- Modifiche giugno 2025: https://d1s9j44aio5gjs.cloudfront.net/2024/08/World-Aquatics-Water-Polo-rule-changes-June-2025-Summary-of-Changes.pdf
- FIN, Regolamento Tecnico Pallanuoto 2025-26 (federnuoto.it)
- Tesi tiro in pallanuoto: https://webthesis.biblio.polito.it/7179/1/tesi.pdf
- Reference di gioco: https://ericflorio.itch.io/water-polo-revolution
- Three.js docs, Rapier.js, Mixamo, Gamepad API (MDN), Reynolds Steering Behaviors, Game Programming Patterns, GitHub Pages, best practice Claude Code.

## Come lavorare
- Dopo ogni modifica: `npm run lint` e `npm run verifica` (partite simulate col caso bloccato + 5 screenshot confrontati con `tests/screenshot/riferimento/`; immagini affiancate prima/dopo in `tests/screenshot/confronto/`). Guarda sempre gli screenshot.
- Dalla v0.11 `npm run verifica` non confronta più le partite con la v0.9; dalla v0.12 il gioco è davvero diverso (corpo e fisica legati), quindi `npm run verifica:legacy` dà partite diverse ed è normale. `npm run primi-piani` scatta i primi piani (fermo, nuoto, nuoto con palla, dorso, tiro, portiere) e le sequenze di una partenza e di una frenata, con fogli riassuntivi: usarlo a ogni modifica dei movimenti.
- Storico: finché regole, fisica e IA non cambiavano, le partite simulate dovevano risultare "identiche alla v0.9" (la verifica tiene fuori dal conto i numeri casuali usati da Three.js). Attenzione: anche la grafica del gioco consuma numeri casuali (schiuma, pose) e la posizione della mano decide da dove parte la palla, quindi cambiando la grafica le partite smetteranno di coincidere: da quel momento usare `--no-legacy` e guardare statistiche ed errori.
- Cambiamento d'aspetto voluto: `npm run verifica:aggiorna` (i nuovi screenshot diventano il riferimento).
- Nell'ambiente cloud cdnjs è bloccato, npm funziona; Chromium gira senza scheda grafica (opzioni swiftshader già nello script).
- Dati dell'ultima verifica: vedi i numeri in "Correzioni v0.17". Storico (6 partite, v0.15): conversione dei tiri 35% (obiettivo 40%; 39% in un giro precedente con lo stesso codice salvo ritocchi: oscilla di qualche punto); pali e traverse sul 9% dei tiri; rigori segnati 77% su 240; senza comandi l'Italia non segna mai. Altri dati della tesi utili in futuro: l'81% dei tiri in partita è classico; 27,8 ± 2,6 tiri per squadra a partita (Europei 2012); testa a 66–71 cm dall'acqua al rilascio; zone di precisione (fascia di 0,5 m dai pali e 0,3 m dalla traversa).
- Ale gioca da telefono e manda screenshot: usali come verità.
- Risposte brevi, in italiano, con cosa è cambiato e cosa provare.

## Piano grafica e fisica realistiche (approvato da Ale l'11 novembre 2026)
Obiettivo: avvicinarsi al riferimento Water Polo Revolution con librerie open source. Una fase per sessione, in quest'ordine. Ogni fase finisce con `npm run verifica`, screenshot prima/dopo mostrati ad Ale e prova di Ale su iPhone; non si passa alla fase dopo senza il suo ok.

Limiti di fluidità da rispettare in tutte le fasi (iPhone): 60 fotogrammi al secondo sui modelli recenti e mai sotto 30 sui vecchi; meno di 100 oggetti disegnati per fotogramma; meno di 150.000 triangoli a schermo; immagini di superficie al massimo 1024 punti; tre livelli di qualità (alta, media, bassa) scelti in automatico. Da qui non si può misurare un iPhone vero: la fase 1 aggiunge un contatore di fotogrammi a schermo, e il numero che Ale legge sul telefono è la verità.

### Fase 1 — Three.js aggiornato, stesso aspetto — FATTA (v0.9.2)
- Esito: partite simulate ancora identiche alla v0.9; aspetto quasi uguale (scarto medio di colore circa 2%). Misura utile per le fasi dopo: oggi si disegnano circa 350–430 oggetti per fotogramma (limite che ci siamo dati: 100), quasi tutti pezzi dei giocatori: si risolve nella fase 3 con un corpo unico per giocatore.
- A schermo: quasi niente (colori e luci ritarati per restare come oggi) + contatore di fotogrammi attivabile.
- Librerie: three da r128 (2021) all'ultima versione (0.187 a novembre 2026). Serve perché acqua con rifrazione, modelli con scheletro e strumenti moderni partono da lì.
- Rischi: la versione nuova gestisce colori e intensità delle luci in modo diverso, quindi l'aspetto va ritarato a mano con gli screenshot; le partite simulate potrebbero non coincidere più con la v0.9 (cambia il consumo di numeri casuali) e da lì si controllano statistiche ed errori. Fluidità: nessun rischio atteso.
- Da Ale: niente, solo la prova su iPhone con il numero di fotogrammi.

### Fase 2 — Telecamera e acqua come nel riferimento — FATTA (v0.10, ritocchi v0.10.1), provata da Ale su iPhone
- Prova di Ale (iPhone, Safari): 60 fotogrammi al secondo fissi con acqua alta e qualità 1.50, con 400–600 oggetti disegnati, in verticale e in orizzontale. C'è quindi margine anche per la fase 3. In orizzontale con le barre di Safari lo schermo utile è basso (circa 280 punti): tenere compatti i riquadri. Dalla schermata Home ("Aggiungi a Home") il gioco si apre a tutto schermo.
- Ritocchi v0.10.1 dopo la prova: su telefono in orizzontale la telecamera avanza di più verso la porta di destra (l'azione non finisce sotto i pulsanti); in verticale la palla sta nel terzo alto dello schermo; la qualità cala solo dopo 4 secondi lenti di fila e non al rientro da un'altra app; contatore FPS piccolo sotto il riquadro del giocatore.
- Esito: partite simulate ancora identiche alla v0.9. Prima della fase 2 l'iPhone di Ale faceva 60 fotogrammi al secondo fissi a qualità 1.50 con 240–340 oggetti. Con l'acqua alta gli oggetti disegnati salgono a circa 550 (i pezzi dei giocatori vengono ridisegnati per la vista sott'acqua): è il motivo in più per fare la fase 3 (un corpo unico per giocatore). Le caustiche sono un effetto scritto da noi sul fondo e sulle righe delle corsie.
- A schermo: telecamera laterale più vicina (l'acqua riempie lo schermo); acqua trasparente con onde fitte, riflessi e corpi sott'acqua visibili e deformati; giochi di luce sul fondo (caustiche); scia di schiuma più credibile; freccia bianca sopra il giocatore controllato al posto dell'anello.
- Librerie: Water2 (incluso in Three.js, riflessione + rifrazione). Le caustiche NON esistono pronte in Three.js: si fanno con un piccolo effetto scritto da noi (disegno animato proiettato sul fondo), poco costoso.
- Rischi iPhone: è la fase più pesante. Water2 ridisegna la scena tre volte per fotogramma. Contromisure: riflesso e rifrazione a metà risoluzione, riflesso solo delle cose ferme, e livelli di qualità (alta = Water2 completo, media = solo rifrazione, bassa = acqua di oggi). Se anche così l'iPhone di Ale resta sotto i 30, si tiene il livello medio come standard.
- Da Ale: prova su iPhone in verticale e orizzontale, con numero di fotogrammi e uno screenshot.

### Fase 3 — Giocatori con corpo vero e scheletro — RIFATTA nella v0.12 insieme alla fase 4 (vedi sotto)
- Giudizio di Ale sulla v0.11: risultato di basso livello (nuotata a rana con braccia e gambe a stella, transizioni a scatti, corpo sfaccettato). Le animazioni Mixamo sono state abbandonate.
- Esito: 6 partite simulate senza errori, con gli stessi punteggi di prima. Oggetti disegnati per fotogramma da circa 550 a circa 130; triangoli circa 150.000 con l'acqua alta (14 corpi da 5.000 disegnati due volte: scena e vista sott'acqua), cioè al limite che ci siamo dati; muovere i 14 scheletri costa circa 0,6 millesimi di secondo per fotogramma sul computer di prova. Se l'iPhone cala: ridurre i triangoli (secondo numero di `converti-modello`) o animare a ritmo dimezzato i giocatori lontani.
- Non riuscito o da migliorare: il dorso di attesa si nota poco da lontano; la bracciata è solo accelerata (non accorciata né con gomito più alto); il manichino resta un manichino (niente volto, superficie un po' sfaccettata da vicino); le dita non si muovono.
- A schermo: al posto di cilindri e sfere, un corpo umano continuo con calottina, costume e numero; da fermo galleggia in verticale, in movimento nuota a crawl (animazioni registrate da persone vere).
- Librerie: caricatore GLTF e SkeletonUtils di Three.js; glTF-Transform per alleggerire e convertire i file; modello e animazioni da Mixamo.
- Rischi iPhone: 14 corpi animati sono il secondo costo più grosso. Il modello Mixamo è troppo dettagliato e va ridotto a circa 5.000–8.000 triangoli, un solo materiale; i giocatori lontani si animano a ritmo dimezzato. Rischio di qualità: Mixamo non ha un nuotatore in costume, quindi si parte dal manichino "Y Bot" colorato da noi (pelle, costume, calottina aggiunta): figura umana credibile a distanza di gioco, non un atleta fotorealistico. Rischio licenza: i file Mixamo si possono usare liberamente in un gioco ma non ridistribuire così come sono; nel repository pubblico va solo il file finale convertito, gli originali Ale li manda in chat.
- Da Ale, PRIMA della sessione (da computer, su mixamo.com con account Adobe gratuito). I titoli sono le parole da scrivere nella ricerca; non è stato possibile verificarli da qui (il sito richiede l'accesso): se un titolo non c'è, prendere il più simile e dirlo.
  1. Personaggio "Y Bot" → Download: Format "FBX Binary (.fbx)", Pose "T-pose" → salvare come `modello.fbx`.
  2. Animazione "Treading Water" → Download: Format "FBX Binary (.fbx)", Skin "Without Skin", 30 fotogrammi al secondo, Keyframe Reduction "none" → `fermo.fbx`.
  3. Animazione "Swimming" (spuntare "In Place" se c'è), stesse impostazioni → `nuoto.fbx`.
- Piano B se Mixamo non va: corpo e scheletro costruiti da noi via codice, senza file esterni (meno realistico, nessuna dipendenza).

### Fase 4 — Gesti di gioco: tiro, passaggio, parata, muro, lotta — FATTA (v0.12) insieme al rifacimento della fase 3, in attesa della prova di Ale su iPhone
- Esito: tutti i movimenti costruiti da zero sulle ossa (stile libero, bicicletta, dorso, transizioni continue, tiro, passaggio, parata, muro, beduina, palombella, finta, lotta) e mirino sulla porta. 6 partite simulate senza errori. Con acqua alta: 153 oggetti disegnati (il limite di 100 NON è rispettato: restano una sessantina di oggetti della scena, da ridurre nella fase 6) e 141.000 triangoli (limite 150.000).
- Non riuscito o da migliorare: la schiena è rigida (non si incurva), mani e dita sono ferme e il polso non è orientato; il portiere allunga le mani verso la palla ma non c'è una vera presa; la partenza non ha bracciate dedicate (sfuma tra remata e bracciata); il corpo resta un manichino senza volto finché non arriva il modello MakeHuman.
- (Piano originale, superato: usava animazioni Mixamo di lanci e parate.)
- A schermo: caricamento e rilascio del tiro con busto fuori dall'acqua e palla che parte dalla mano nel momento giusto; passaggio; portiere che si allunga sul lato giusto; braccio alzato a murare; mirino sulla porta mentre si carica il tiro (come nel riferimento).
- Librerie: sistema di animazione di Three.js (miscela tra animazioni, solo parte alta del corpo) + la nostra mira del braccio già esistente, applicata allo scheletro.
- Rischi: Mixamo non ha gesti di pallanuoto. I lanci disponibili sono fatti in piedi sulla terra: si usa solo busto e braccio sopra le gambe che galleggiano e si corregge la mira via codice. Beduina, palombella, colonnello e lotta al centro restano in gran parte movimenti calcolati da noi (fonte: tesi Patumi). Fluidità: costo piccolo rispetto alla fase 3.
- Da Ale, prima della sessione (stesse impostazioni della fase 3, "Without Skin"): "Throw" → `tiro.fbx`; "Goalkeeper Overhand Throw" → `passaggio.fbx`; "Goalkeeper Diving Save" → `parata.fbx`; "Goalkeeper Catch" → `presa.fbx`; "Victory" → `esulta.fbx` (facoltativo).

### Atleti veri al posto del manichino — FATTO (v0.13), in attesa della prova di Ale su iPhone
- Richiesta di Ale dopo la v0.12: "sembrano ancora manichini", calottina fusa con la testa, palla non da pallanuoto, fisica della palla troppo semplice; senza un salto netto non ha senso continuare. Confronto fatto con tre screenshot di Water Polo Revolution (atleti con volto e barba, pelle bagnata, calottine con paraorecchie forati e laccetti, palla a spicchi).
- Esito: corpi muscolosi con pelle e volto veri, 5 facce diverse, calottina e palla rifatte. 6 partite simulate senza errori. Con acqua alta: 149 oggetti disegnati (limite 100 non rispettato, resta la scena) e 145.000 triangoli (limite 150.000).
- Non fatto: fisica della palla (è la fase 5 qui sotto); niente capelli (sotto la calottina non si vedono), niente ciglia, nessuna espressione del viso; i volti sono 5 e si ripetono; da vicino il dettaglio resta inferiore al riferimento, che gira su computer.

### Fase 5 — Fisica della palla con Rapier — FATTA (v0.14), in attesa della prova di Ale su iPhone
- Giudizio di Ale sulla v0.13 (atleti): "pensavo molto meglio". Ha chiesto di dedicarsi a palla, fisica e aspetto della palla.
- Esito: vedi "Palla (v0.14)" nello stato attuale. Prove di fisica tutte superate; 6 partite simulate senza errori.
- Non fatto: la rete non si muove quando entra la palla (la palla però ci si ferma dentro); parata, muro e intercetto restano decisi a probabilità (mani e braccia non sono ostacoli veri); i corpi fanno rimbalzare solo la palla vagante, con una sfera all'altezza della testa; Rapier NON muove i giocatori (come da consiglio del piano).
- A schermo: rimbalzi veri su pali e traversa, palla che schizza e rallenta sull'acqua, galleggia e viene spostata dai corpi, rotazione visibile; rete della porta che si muove quando entra il gol.
- Librerie: Rapier (motore fisico open source, versione per il web).
- Rischi: cambia il gioco, non solo l'aspetto: percentuale di gol, parate e intercetti vanno ribilanciati (oggi 31%, obiettivo 40%) e il confronto "identico alla v0.9" finisce definitivamente. Circa 2 MB in più da scaricare al primo avvio. Fluidità: costo trascurabile con pochi oggetti. Consiglio: Rapier per palla, porte e contatto palla-corpi; NON per il movimento dei giocatori in acqua (un motore di corpi rigidi non simula il nuoto: lì resta la nostra fisica, che è già tarata).
- Da Ale: partite di prova e giudizio sul "peso" della palla.

### Fase 6 — Ambiente, rifiniture e prestazioni
- A schermo: spruzzi a particelle su tiri e bracciate, ombre morbide sotto i corpi, bordo vasca e luci più curati, porte e corde rifinite; joystick che non copre più la porta in orizzontale (problema aperto n. 4).
- Librerie: solo Three.js.
- Rischi iPhone: le particelle trasparenti costano; numero massimo fisso e riduzione automatica. Sessione dedicata anche a misurare e tagliare ciò che pesa.
- Da Ale: prova lunga su iPhone (surriscaldamento, batteria, cali dopo 10 minuti).

### Cosa NON è raggiungibile nel browser (soprattutto su iPhone)
- Acqua simulata davvero: onde, spruzzi e schiuma che nascono dalla fisica dei corpi. Si può solo imitare con disegni animati, scie e particelle.
- Riflessi e caustiche fisicamente esatti (tecniche da console/PC di fascia alta): si usano approssimazioni.
- Atleti fotorealistici con muscoli, pelle bagnata e volti: richiedono modelli fatti da artisti e troppa potenza per 14 giocatori su telefono.
- Animazioni registrate da veri pallanuotisti: non esistono gratis; i gesti specifici restano ricostruiti da noi.
- Tutti gli effetti insieme a 60 fotogrammi al secondo e piena risoluzione su iPhone vecchi: lì si gioca a qualità media o bassa.
- Pubblico 3D animato, replay in stile televisivo con molte telecamere e qualità da FIFA: fuori portata per un progetto di questo tipo.
- Nota: il riferimento è un pre-alpha del 2019 per computer; acqua, telecamera e corpi immersi sono raggiungibili, e su quelli si concentra il piano.

## Passi 1-7 (v0.16) — cosa c'è e dove
- Squadre: 16 nazionali scelte dal menu (`#sqA`, `#sqB`), rose da 13 in `src/dati/rose.js` (generate sempre uguali a partire dalla sigla). Calottine: la squadra del giocatore in BIANCO, quella del computer in BLU, portieri in rosso (deciso da Ale: finché non ci sono le piscine non c'è "casa/ospite"). Costumi dal file delle squadre. `applicaSquadre` in `giocatori.js`.
- Nomi: Ale ha AUTORIZZATO i nomi veri delle nazionali (progetto gratuito). Oggi sono cognomi scritti a memoria, NON verificati: da controllare quando si collegheranno statistiche vere. Niente loghi o stemmi.
- Statistiche 40-99 in `p.s` (vel, res, pot, pre, pas, vis, dif, dis, frz, rif, pos, usc, rig), valutazione `p.ovr`, mano `p.mano`. Il motore usa ancora i vecchi valori `p.st`, ricavati con `valoriMotore`. Pannello del giocatore con OVR e 3 statistiche chiave; rosa a figurine nel menu.
- Numerazione: 1 = ala destra, 5 = ala sinistra (confermato da Ale).
- Portiere (`gkTarget` in `ia.js`, parata in `fisica.js`): si sposta seguendo il passaggio con un ritardo che dipende da Posizionamento; la parata dipende da dov'era al momento del tiro, dai Riflessi, dalla stanchezza, dalla sorpresa e dal muro del difensore (coppia primo palo / secondo palo).
- Tiri nuovi: polso (un tocco), finta e polso, torsione (si carica verso un palo e si rilascia verso l'altro), tiro al volo (TIRO tenuto mentre arriva il passaggio). Il difensore alza il braccio e può abboccare alla finta.
- Difesa e allenatore: Zona a M (quarto schema di difesa), il computer sceglie la difesa da solo, time-out dell'allenatore (3 gol subiti di fila o 3 espulsioni in 2 minuti), 7 contro 6 a fine partita per chi perde (solo il computer; il giocatore umano non può ancora chiamarlo).
- Arbitro: Permissivo / Normale / Fiscale nel menu (`ARBITRO`, `setArbitro` in `costanti.js`); cambia espulsioni e rigori.
- Pazienza in attacco: il computer non tira subito se ha difensori davanti (`PAZIENZA` in `ia.js`).
- Computer contro computer per le prove: `game.autoplay = true` e `teams[i].human = false`.
- Strumenti: `npm run bilancio` (20 partite 4×8 min; opzioni `--partite= --squadre=ITA,USA --arbitro= --salva=`), `npm run statistiche` (effetti minimi delle statistiche), `npm run vetrina` (screenshot iPhone orizzontale e verticale di menu, rosa, partita, rigore, zona a M, 7 contro 6, sequenza del portiere). Contatori di partita in `src/statistiche.js`.
- Nei test `requestAnimationFrame` è finto: ogni `page.waitForFunction` deve avere `{ timeout: 60000, polling: 100 }`, altrimenti il caricamento va in errore a caso.
- Numeri misurati (20 partite 4×8 min, per squadra a partita). Prima (ITA–HUN, v0.15): gol 25,9; tiri 60,1; tiri in gol 43,1%; parate 25,7; espulsioni 12,2; superiorità trasformate 44,7%; rigori 0,4; gol: perimetro 45%, superiorità 21%, controfuga 29%, entrata 0%, centroboa 3%, rigore 1%. Dopo (ITA–USA, forza simile): gol 21,6; tiri 51,7; tiri in gol 41,7%; parate 20,0; espulsioni 12,2; superiorità trasformate 36,7%; rigori 1,6; gol: perimetro 52%, superiorità 21%, controfuga 18%, entrata 0%, centroboa 4%, rigore 6%.
- Statistiche verificate: Velocità 90 contro 60 = +19%; Precisione 90 contro 60 = 94% contro 53% di tiri nello specchio (1,8 volte, obiettivo "circa il doppio"); Potenza 26,6 contro 21,4 m/s; Resistenza 90 contro 60 = barra al 53% contro 13% dopo 7 vasche.
- NON riuscito (da riprendere): tiri (circa 52) e gol (circa 21) per squadra restano quasi il doppio di una partita vera (28 tiri, 10-12 gol); i gol "da entrata" sono a zero; 10 punti di forza decidono quasi sempre (ITA–HUN 0 vittorie su 20, ESP–RSA 20 su 20): il divario va addolcito; i mancini non hanno il gesto specchiato; fluidità su iPhone non misurata.

## Correzioni v0.17 (chieste da Ale dopo aver giocato) — cosa c'è e dove
- Menu: `#menu` allineato in alto e scorrevole (`margin:auto` sul riquadro lo tiene centrato quando ci sta; `touch-action:pan-y` perché il resto della pagina ha `touch-action:none`). Comandi in una sezione richiudibile "Comandi", chiusa di default. NON rimettere `align-items:center`: su telefono la cima del menu diventa irraggiungibile.
- Movimento (`movePlayer` in `fisica.js`): alzata in `ALZATA` s (0,25), distensione in `ALZATA`+0,1; da distesi si spinge nella direzione del corpo e il corpo gira a velocità limitata (circa 180°/s in piena nuotata, 430°/s in verticale) → curve ampie; inversione = ci si alza, si gira, si riparte (`p.perno`); scivolata: smettendo di nuotare la velocità cala piano (ritmo 0,8 da distesi, 1,4 in verticale), si frena davvero solo remando contro; chi riceve un passaggio si alza poco prima dell'arrivo; i giocatori del computer smettono di nuotare in anticipo e arrivano al posto scivolando (`partita.js`). In `pose.js`: testa che si alza ogni tanto in nuotata (`guarda`) e mano verso la palla in ricezione (`presa`).
- PROVVISORIO: riga "Alzata (prova)" nel menu (0,20 / 0,25 / 0,35 s; `setAlzata` in `costanti.js`) per far scegliere il valore ad Ale. Scelto il valore, togliere la riga e fissare `ALZATA`.
- `npm run sequenze` (lanciato anche in coda a `npm run primi-piani`): sequenze a 10 fotogrammi al secondo di partenza con palla, frenata e tiro, cambio di direzione, passaggio ricevuto in nuotata, fatte con i comandi veri; stampa velocità, quanto il corpo è disteso, direzione, e l'accelerazione e la rotazione più brusche. `--dist=<cartella>` usa una build già fatta (per il confronto prima/dopo). Prima della v0.17: frenata a 4,4 m/s² e mezzo secondo per alzarsi, curva a 300°/s sul posto; dopo: 1,4 m/s², 0,25 s, 194°/s.
- Contrasto (`tackle`, `latoContrasto`, `pallaEsposta` in `regole.js`): un tocco = tentativo di rubare. Conta da dove si arriva (davanti/lato bene, dietro male), com'è tenuta la palla (in palleggio o appoggiata bene, alzata male) e Difesa contro Forza+Passaggio dell'attaccante. Esiti: rubata, niente ("Palla protetta"), fallo semplice, espulsione (soprattutto da dietro), rigore (dentro i 6 m su probabile gol). CONTRASTO tenuto un terzo di secondo = fallo voluto, con rischio di espulsione o rigore. Il computer usa la stessa logica (ci prova quando la palla è esposta; chi ha poca Disciplina anche quando non dovrebbe; in controfuga spende il fallo).
- Palla vagante (`chiVaSullaPalla` in `ia.js`): su palla libera o rimbalzo in aria ci va subito il più vicino di ogni squadra (portiere compreso entro 6,5 m dalla sua porta), puntando dove la palla ricadrà; nella squadra del giocatore, se il più vicino è quello controllato ci va anche il secondo. `npm run bilancio` misura quanto la palla resta ferma senza che nessuno ci vada (limite 2 s; misurato 0,1 s).
- Uomo in più: `FORM_UP` (4 sui 2 metri: esterni larghi a 5,4 m di lato, centroboa e punto ai pali; 2 mezzi a 5 metri) e `DEF_DOWN` (3 sui 2 metri negli spazi, 2 davanti ai pali), con i posti assegnati al difensore più vicino (`postiInferiorita` in `ia.js`). Schemi: palla che gira in fretta, dai 5 metri all'esterno opposto, palla all'uomo al palo che tira subito, tiro al volo dopo il cambio di lato; l'esterno (poco angolo) tira di rado.
- Precisione: il controllo di `npm run statistiche` passava per caso (600 tiri, dipendeva dai numeri casuali); ora usa 1500 tiri, la curva dell'errore è più ripida sotto il 90 (`mira` in `tiri.js`) e l'errore di base è stato abbassato per compensare: 90 contro 60 = 93% contro 52% (1,8 volte).
- Portiere: sui tiri da vicino (palla che arriva in meno di un quarto di secondo) para meno (`vicino` in `fisica.js`).
- Tempo per l'azione: numero grande nel tabellone; negli ultimi 5 secondi giallo, lampeggiante e con un bip al secondo (`bip` in `audio.js`), sirena bassa allo scadere. `npm run azione` verifica 28 s, 18 s (espulsione con meno di 18, tiro d'angolo, rimbalzo ripreso dall'attacco) e il cambio di possesso allo scadere. La rimessa/tiro libero NON è stata toccata (regola ufficiale).
- ERRORE CORRETTO (c'era dalla v0.16): nel 7 contro 6 il portiere avanzato con la palla mandava in errore il gioco a ogni fotogramma (partita che non finiva più). Ora `bilancio` e `verifica` contano come errori anche quelli scritti in console dal ciclo di gioco.
- `npm run vetrina-correzioni`: screenshot iPhone di menu (in alto e in fondo), uomo in più (anche dall'alto), contrasto riuscito, ultimi secondi dell'azione.
- Numeri (20 partite 4×8 min ITA–USA, per squadra a partita), prima → dopo: gol 21,6 → 22,0; tiri 51,7 → 56,8; tiri in gol 41,7% → 38,8%; palle rubate 10,7 → 12,8; falli semplici 41,9 → 21,3; espulsioni 12,2 → 10,5; rigori 1,6 → 1,4 (segnati 84% → 74%); superiorità trasformate 36,7% → 28,3% (SOTTO l'obiettivo del 30%: da riprendere); gol in controfuga 18% → 20%, del centroboa 4% → 9%. Nelle 6 partite di `npm run verifica` (Italia senza comandi o con tasti a caso): 31% di tiri in gol, nessun errore.
- NON fatto / da riprendere: il giocatore umano non ha comandi dedicati per gli schemi dell'uomo in più (i compagni si schierano da soli, passaggi e tiri li decide lui); nessun gesto dedicato per il contrasto (mano sulla palla) né per il fallo; il valore di `ALZATA` è da confermare con Ale su iPhone; tiri e gol per squadra restano circa il doppio di una partita vera.

## Squadre nazionali (richiesta di Ale)
- Dati pronti in `src/dati/squadre.json`: 16 nazionali maschili (classifica Mondiali 2025), forza, colori della bandiera, calottine (bianca, scura, portiere rossa).
- Regole per le calottine: una squadra in bianco e l'altra in scuro; portieri sempre in rosso; numeri 1-13 (1 = portiere).
- Le calottine scure con `calottinaScuraVerificata: false` sono proposte: chiedi conferma ad Ale prima di considerarle definitive.
- Nomi dei giocatori: inventati ma coerenti con la nazionalità. NON usare nomi di atleti reali (nei giochi richiedono licenza; il gioco è pubblico su GitHub Pages). Niente loghi o stemmi delle federazioni.
- FATTO nella v0.16: scelta delle due squadre nel menu, calottine e costumi presi dal file, forza della squadra che influenza le statistiche dei giocatori. Sui nomi vale la decisione più recente di Ale (nomi veri ammessi, vedi "Passi 1-7").

## Statistiche dei giocatori (specifica, richiesta di Ale)
Obiettivo: come in FIFA, le statistiche devono differenziare DAVVERO le prestazioni e il giocatore deve accorgersene.
FATTO nella v0.16 (vedi "Passi 1-7"); questa resta la specifica di riferimento.

Scala 40-99 come FIFA. Statistiche:
- Velocità (nuoto e sprint), Resistenza (quanto cala la barra e quanto si recupera)
- Potenza di tiro (velocità della palla, 13-23 m/s) e Precisione di tiro (errore sul bersaglio), separate
- Passaggio (velocità e precisione), Visione (qualità delle scelte dell'IA: a chi passare, quando tirare)
- Difesa (anticipo, contrasti, muri, ritardo di reazione) e Disciplina (probabilità di fare fallo grave o rigore)
- Forza (lotta al centro, corpo a corpo)
- Portieri: Riflessi, Posizionamento, Uscita (palle vaganti), Rigori
- Mano: destra o sinistra. I mancini giocano sul lato destro (ala destra, mezzo destro) e lì tirano meglio; un destro sul lato destro ha un angolo peggiore.

Generazione:
- Media della squadra dalla `forza` in `src/dati/squadre.json`; ogni rosa ha 1-2 campioni (+8/+12) e qualche punto debole.
- Profili per ruolo: centroboa forte e lento, ali veloci e precise, punto con visione e passaggio, mezzi tiratori potenti.
- Valutazione complessiva (OVR) per ruolo, mostrata come in FIFA.

Effetti minimi da rispettare (verificali con partite simulate):
- Tra un 90 e un 60 di Velocità: circa il 15-20% di differenza di velocità in sprint.
- Tra un 90 e un 60 di Precisione: dal tiro dallo stesso punto, circa il doppio dei tiri nello specchio.
- Squadra forte contro debole: la forte vince la grande maggioranza delle partite simulate, ma non tutte.
- Ogni statistica deve avere almeno un effetto misurabile; niente numeri decorativi.

Interfaccia:
- Pannello del giocatore controllato: nome, ruolo, OVR, 3 statistiche chiave del ruolo, mano.
- Nel menu: rosa della squadra con OVR e statistiche (schede tipo figurine).

## Come si muove un pallanuotista (indicazioni di Ale, ex nuotatore) — valgono per ogni lavoro sulle animazioni
REGOLA GENERALE: tutti i movimenti si costruiscono DA ZERO muovendo le ossa dello scheletro. Le animazioni Mixamo sono fatte a terra o per il calcio: non usarle. Il riferimento è Water Polo Revolution: movimenti fluidi, corpi immersi, transizioni morbide.
1. STILE LIBERO, NON RANA: braccia alternate con recupero fuori dall'acqua e gomito alto, bracciata corta e frequente, testa alta, gambe unite con battuta veloce. Mai braccia e gambe aperte a stella. Chi porta palla la spinge davanti alla testa, tra le braccia.
2. POSIZIONE IN ACQUA: da fermi l'acqua arriva alle spalle (fuori solo testa, collo e spalle). In nuotata il corpo è orizzontale appena sotto la superficie: fuori solo testa, braccio in recupero e schiena a pelo d'acqua. Ci si alza fino al petto solo per tirare, parare o marcare.
3. TRANSIZIONI VERTICALE ↔ ORIZZONTALE, sempre continue (nessuno scatto):
   - Il CAMBIO DI POSIZIONE è RAPIDO e frequentissimo (correzione di Ale dopo la v0.16): ci si alza per ricevere, passare, tirare o anche solo per guardare l'azione, e si riparte subito a nuotare. Circa un quarto di secondo per alzarsi, poco di più per distendersi (non mezzo secondo).
   - Lo SPOSTAMENTO invece è LENTO e SCIVOLOSO: il corpo porta con sé la velocità e scivola anche quando smette di nuotare o si alza in verticale, rallentando gradualmente per l'attrito dell'acqua; si accelera in modo progressivo; i cambi di direzione sono ampi, non a spigolo (per tornare indietro ci si alza, ci si gira e si riparte).
   - Da verticale si riparte senza aspettare di essere fermi; tiro e passaggio possono partire mentre il corpo sta ancora scivolando.
   - Durante la nuotata, alzate brevi della testa per guardare l'azione; chi riceve un passaggio in nuotata si alza un attimo e allunga la mano.
   - Partenza (da fermo a nuoto): il busto si inclina in avanti, le gambe passano dalla bicicletta alla battuta salendo dietro, le prime bracciate partono mentre il corpo si distende.
   - Frenata (per tirare): le gambe tornano sotto il corpo, il busto si raddrizza all'indietro, una remata di freno e si riparte con la bicicletta; poi ci si alza per il tiro.
4. BICICLETTA (eggbeater) da fermi: calcio a rana alternato, una gamba dopo l'altra, spinta continua, testa ferma e alta; più ampia e veloce quando ci si alza. NON il galleggiamento a gambe unite.
5. DORSO DI ATTESA: semi-seduti sul dorso, gambe a bicicletta, braccia larghe che remano ai lati, sguardo alla palla; riconoscibile anche da lontano. Per chi aspetta il passaggio o arretra di poco.
6. GESTI (fasi del tiro dalla tesi Patumi):
   - Tiro: bicicletta più forte che alza il corpo fino al petto, busto ruotato, braccio che carica dietro la testa, frustata e rilascio, braccio libero in appoggio sull'acqua; mirino sulla porta mentre si carica.
   - Passaggio: stesso gesto, più corto e senza rotazione del busto.
   - Parata: il portiere si alza con la bicicletta, braccia larghe e alte, si allunga di lato verso la palla; presa con una o due mani sopra la testa.
   - Muro: braccio alzato verso il tiratore. Beduina, palombella, finta e lotta al centro: stessi principi, fluidi.
Come è realizzato oggi: `pose.js` calcola una posa verticale (con tutti i gesti: tabella `THROW`) e una orizzontale (stile libero) e le mescola in modo continuo secondo `p.oriz`; `corpo.js` orienta busto, braccia e testa sulle giunture e mescola nello stesso modo bicicletta e battuta di gambe. Le giunture sono anche smussate nel tempo (`updateRig`), quindi ogni cambio di gesto è graduale.

## Tattica (fonte: wpdworld.com, raccolta l'11 novembre 2026)
- Tutto in `docs/tattica.md`: numerazione delle posizioni 1-6, come si gioca con le regole attuali, numeri per il bilanciamento (espulsioni, superiorità, rigori), difese (pressing, zona, zona a M), attacco (ali, centroboa, 7 contro 6), tecnica di tiro, portiere, time-out. Ogni sezione finisce con "Proposte" per il gioco.
- Usalo quando si lavora su IA, schemi, regole o bilanciamento (fase 3 della roadmap). Non è un lavoro da fare tutto insieme: una proposta o un gruppo di proposte per sessione.

## Tecnica (fonte: wpdworld.com, raccolta l'11 novembre 2026)
- Tutto in `docs/tecnica.md`: regole confermate (area di porta) e da correggere (posizioni al rigore), come si muove un pallanuotista (tempo in verticale/orizzontale, metri a partita, sprint ripetuti), varianti di tiro (polso, finte, torsione, elevazione), difensore e muro, portiere (posizione prima del tuffo, si muove con il passaggio, coppia con il difensore). Ogni sezione ha le "Proposte" per il gioco.
- Da usare per animazioni (fase 3-4), statistiche (Resistenza, Posizionamento del portiere) e IA.

