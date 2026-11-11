# Pallanuoto 3D — memoria del progetto

Gioco di pallanuoto 3D nel browser, "una sorta di FIFA per la pallanuoto". Proprietario: Ale, ex nuotatore agonista, non programmatore: spiega le scelte in italiano semplice, senza gergo tecnico, e chiedi conferma prima di cambiamenti grossi di direzione.

## Stato attuale (v0.9.1, novembre 2026)
- Progetto Vite a moduli in `src/` (stesso identico gioco della v0.9, solo riorganizzato): `costanti`, `stato`, `giocatori`, `regole`, `partita` (ciclo di gioco), `lotta`, `fisica`, `tiri`, `ia`, `controllo` (comandi umani), `input`, `hud`, `menu`, `audio`, `grafica/` (`scena`, `modello`, `pose`, `render`). Three.js r128 da npm (non più da CDN).
- Le variabili condivise che cambiano si modificano con funzioni apposite: `setCtrl`, `resetTap`, `setPeriodLen`, `setDiff`, `setSpeed`, `setDpr`.
- `legacy/index.html` è la v0.9 in un solo file: termine di paragone, non modificarla.
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
2. Grafica (punto 1 sopra) con verifica a screenshot.
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
- Finché regole, fisica e IA non cambiano, le partite simulate devono risultare "identiche alla v0.9". Attenzione: anche la grafica consuma numeri casuali (schiuma, pose) e la posizione della mano decide da dove parte la palla, quindi cambiando la grafica le partite smetteranno di coincidere: da quel momento usare `--no-legacy` e guardare statistiche ed errori.
- Cambiamento d'aspetto voluto: `npm run verifica:aggiorna` (i nuovi screenshot diventano il riferimento).
- Nell'ambiente cloud cdnjs è bloccato, npm funziona; Chromium gira senza scheda grafica (opzioni swiftshader già nello script).
- Dati dell'ultima verifica (6 partite): conversione dei tiri 31% (obiettivo 40%); senza comandi l'Italia non segna mai.
- Ale gioca da telefono e manda screenshot: usali come verità.
- Risposte brevi, in italiano, con cosa è cambiato e cosa provare.
