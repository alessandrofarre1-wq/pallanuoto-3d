# Pallanuoto 3D — memoria del progetto

Gioco di pallanuoto 3D nel browser, "una sorta di FIFA per la pallanuoto". Proprietario: Ale, ex nuotatore agonista, non programmatore: spiega le scelte in italiano semplice, senza gergo tecnico, e chiedi conferma prima di cambiamenti grossi di direzione.

## Stato attuale (v0.9.2, novembre 2026)
- Progetto Vite a moduli in `src/` (stesso identico gioco della v0.9, solo riorganizzato): `costanti`, `stato`, `giocatori`, `regole`, `partita` (ciclo di gioco), `lotta`, `fisica`, `tiri`, `ia`, `controllo` (comandi umani), `input`, `hud`, `menu`, `audio`, `grafica/` (`scena`, `modello`, `pose`, `render`). Three.js 0.187 da npm (aggiornato dalla r128 nella fase 1 del piano; richiede WebGL2, cioè iPhone con iOS 15 o successivo).
- Le variabili condivise che cambiano si modificano con funzioni apposite: `setCtrl`, `resetTap`, `setPeriodLen`, `setDiff`, `setSpeed`, `setDpr`.
- Colori: gestione moderna di Three.js (immagini marcate sRGB, luci ritarate: `LUCE_CIELO`, `LUCE_SOLE` in `grafica/scena.js`) per restare uguali alla v0.9.
- Il caso del gioco passa tutto da `rnd` (`costanti.js`): mai usare `Math.random` direttamente nel codice del gioco, altrimenti la verifica non è più ripetibile.
- Contatore FPS: si accende dal menu (o con `?fps` nell'indirizzo); mostra fotogrammi al secondo, qualità di disegno, oggetti disegnati e triangoli.
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
- Area di porta (art. 8.2.8): attaccante davanti alla linea della palla = fallo. Misure usate: 2 m × (porta + 2 m per lato), DA VERIFICARE (l'estratto 2026 non riportava l'appendice delle definizioni).
- Time-out: 2 a squadra, solo in possesso, ripresa da metà campo.
- Non implementati: rigori finali in caso di parità, VAR, cambi volanti.

## Gioco già implementato
- Ruoli: centroboa, ali, mezzi, punto; arco 3-3 in attacco; 4-2 con uomo in più; zona a 5 con uomo in meno.
- Marcature per lato di vasca (array MARK): il punto marca il centroboa.
- La squadra sale per corsie, scaglionata per ruolo: nessuno va tutto sulla palla (richiesta esplicita di Ale).
- Schemi chiamabili: attacco Arco/Entrata/Incrocio/Palla al boa; difesa A uomo/Zona/Pressing; taglio di un compagno; raddoppio.
- Contrasto con slancio (finisce sempre almeno in fallo, che ferma il gioco), finta di tiro (doppio tocco) con difensori che abboccano, tiro rapido, tiro caricato, palombella, beduina, colonnello, tiro a schizzo.
- Lotta al centro: barra di posizione boa/marcatore basata su forza e stanchezza; tenere SPRINT = spingere; il boa con palla guadagna espulsioni o falli, può fare girata (rigore se trattenuto), beduina o scarico.
- Fisica: acqua che frena, bisogna girare il corpo prima di nuotare, resistenza corpo a corpo, sprint che consuma resistenza.
- IA con steering (separazione, aggiramento, inseguimento della palla).
- Portiere che esce sulle palle vaganti vicino alla porta.

## Problemi aperti e richieste di Ale
1. GRAFICA: obiettivo dichiarato il livello di "Saltline" (FPS fatto da Claude Fable 5.2 in un artifact, tutto procedurale). Oggi i giocatori sono cilindri e sfere animati con IK fatta a mano. Mai visto un render reale finora: lavora SEMPRE con screenshot (es. Playwright) e confronta.
2. Movimenti di nuoto e tiro più realistici (fonte: tesi Patumi, PoliTo, fasi del tiro; velocità palla 13–23 m/s).
3. Fluidità su iPhone: tenere d'occhio il numero di oggetti e di draw call; qualità adattiva già presente.
4. In orizzontale il joystick copre la porta di sinistra quando si difende.
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
- Finché regole, fisica e IA non cambiano, le partite simulate devono risultare "identiche alla v0.9" (la verifica tiene fuori dal conto i numeri casuali usati da Three.js). Attenzione: anche la grafica del gioco consuma numeri casuali (schiuma, pose) e la posizione della mano decide da dove parte la palla, quindi cambiando la grafica le partite smetteranno di coincidere: da quel momento usare `--no-legacy` e guardare statistiche ed errori.
- Cambiamento d'aspetto voluto: `npm run verifica:aggiorna` (i nuovi screenshot diventano il riferimento).
- Nell'ambiente cloud cdnjs è bloccato, npm funziona; Chromium gira senza scheda grafica (opzioni swiftshader già nello script).
- Dati dell'ultima verifica (6 partite): conversione dei tiri 37% (obiettivo 40%; varia molto da un gruppo di partite all'altro: 31% in quello precedente); senza comandi l'Italia non segna mai.
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

### Fase 2 — Telecamera e acqua come nel riferimento
- A schermo: telecamera laterale più vicina (l'acqua riempie lo schermo); acqua trasparente con onde fitte, riflessi e corpi sott'acqua visibili e deformati; giochi di luce sul fondo (caustiche); scia di schiuma più credibile; freccia bianca sopra il giocatore controllato al posto dell'anello.
- Librerie: Water2 (incluso in Three.js, riflessione + rifrazione). Le caustiche NON esistono pronte in Three.js: si fanno con un piccolo effetto scritto da noi (disegno animato proiettato sul fondo), poco costoso.
- Rischi iPhone: è la fase più pesante. Water2 ridisegna la scena tre volte per fotogramma. Contromisure: riflesso e rifrazione a metà risoluzione, riflesso solo delle cose ferme, e livelli di qualità (alta = Water2 completo, media = solo rifrazione, bassa = acqua di oggi). Se anche così l'iPhone di Ale resta sotto i 30, si tiene il livello medio come standard.
- Da Ale: prova su iPhone in verticale e orizzontale, con numero di fotogrammi e uno screenshot.

### Fase 3 — Giocatori con corpo vero e scheletro
- A schermo: al posto di cilindri e sfere, un corpo umano continuo con calottina, costume e numero; da fermo galleggia in verticale, in movimento nuota a crawl (animazioni registrate da persone vere).
- Librerie: caricatore GLTF e SkeletonUtils di Three.js; glTF-Transform per alleggerire e convertire i file; modello e animazioni da Mixamo.
- Rischi iPhone: 14 corpi animati sono il secondo costo più grosso. Il modello Mixamo è troppo dettagliato e va ridotto a circa 5.000–8.000 triangoli, un solo materiale; i giocatori lontani si animano a ritmo dimezzato. Rischio di qualità: Mixamo non ha un nuotatore in costume, quindi si parte dal manichino "Y Bot" colorato da noi (pelle, costume, calottina aggiunta): figura umana credibile a distanza di gioco, non un atleta fotorealistico. Rischio licenza: i file Mixamo si possono usare liberamente in un gioco ma non ridistribuire così come sono; nel repository pubblico va solo il file finale convertito, gli originali Ale li manda in chat.
- Da Ale, PRIMA della sessione (da computer, su mixamo.com con account Adobe gratuito). I titoli sono le parole da scrivere nella ricerca; non è stato possibile verificarli da qui (il sito richiede l'accesso): se un titolo non c'è, prendere il più simile e dirlo.
  1. Personaggio "Y Bot" → Download: Format "FBX Binary (.fbx)", Pose "T-pose" → salvare come `modello.fbx`.
  2. Animazione "Treading Water" → Download: Format "FBX Binary (.fbx)", Skin "Without Skin", 30 fotogrammi al secondo, Keyframe Reduction "none" → `fermo.fbx`.
  3. Animazione "Swimming" (spuntare "In Place" se c'è), stesse impostazioni → `nuoto.fbx`.
- Piano B se Mixamo non va: corpo e scheletro costruiti da noi via codice, senza file esterni (meno realistico, nessuna dipendenza).

### Fase 4 — Gesti di gioco: tiro, passaggio, parata, muro, lotta
- A schermo: caricamento e rilascio del tiro con busto fuori dall'acqua e palla che parte dalla mano nel momento giusto; passaggio; portiere che si allunga sul lato giusto; braccio alzato a murare; mirino sulla porta mentre si carica il tiro (come nel riferimento).
- Librerie: sistema di animazione di Three.js (miscela tra animazioni, solo parte alta del corpo) + la nostra mira del braccio già esistente, applicata allo scheletro.
- Rischi: Mixamo non ha gesti di pallanuoto. I lanci disponibili sono fatti in piedi sulla terra: si usa solo busto e braccio sopra le gambe che galleggiano e si corregge la mira via codice. Beduina, palombella, colonnello e lotta al centro restano in gran parte movimenti calcolati da noi (fonte: tesi Patumi). Fluidità: costo piccolo rispetto alla fase 3.
- Da Ale, prima della sessione (stesse impostazioni della fase 3, "Without Skin"): "Throw" → `tiro.fbx`; "Goalkeeper Overhand Throw" → `passaggio.fbx`; "Goalkeeper Diving Save" → `parata.fbx`; "Goalkeeper Catch" → `presa.fbx`; "Victory" → `esulta.fbx` (facoltativo).

### Fase 5 — Fisica della palla con Rapier
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

## Squadre nazionali (richiesta di Ale)
- Dati pronti in `src/dati/squadre.json`: 16 nazionali maschili (classifica Mondiali 2025), forza, colori della bandiera, calottine (bianca, scura, portiere rossa).
- Regole per le calottine: una squadra in bianco e l'altra in scuro; portieri sempre in rosso; numeri 1-13 (1 = portiere).
- Le calottine scure con `calottinaScuraVerificata: false` sono proposte: chiedi conferma ad Ale prima di considerarle definitive.
- Nomi dei giocatori: inventati ma coerenti con la nazionalità. NON usare nomi di atleti reali (nei giochi richiedono licenza; il gioco è pubblico su GitHub Pages). Niente loghi o stemmi delle federazioni.
- Da implementare: scelta delle due squadre nel menu, calottine e costumi presi dal file, forza della squadra che influenza le statistiche dei giocatori e la difficoltà dell'IA.

## Statistiche dei giocatori (specifica, richiesta di Ale)
Obiettivo: come in FIFA, le statistiche devono differenziare DAVVERO le prestazioni e il giocatore deve accorgersene.
Oggi esistono 5 valori casuali (`spd`, `sht`, `pas`, `def`, `frz`, scala 0,6-1) usati in fisica, tiri, regole e lotta: vanno sostituiti da questo sistema.

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

