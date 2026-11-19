# v0.50 — coerenza del nuoto, arresto al fischio e posizioni numerate

Base main `fa688c51aaedd8090b0e933140aaec2e828cf6ab`, dopo PR #45 v0.49. Branch `codex/v050-nuoto-direzione-stop`. Nessuna pubblicazione o merge da questa PR.

## Problemi riprodotti e interventi

Il modello GLB non è invertito staticamente: testa e palla sono davanti al bacino nelle direzioni ±X/Z. Il problema riprodotto è dinamico: il colonnello poteva essere proposto anche nuotando in allontanamento dalla porta, e la mira imponeva al corpo il fronte opposto alla velocità conservando l'assetto disteso. Nelle scene controllate v0.49 questo produce 100 campioni con corpo inverso, per massimo 0,133333 s consecutivi. Non è stata riprodotta un'inversione persistente nel crawl ordinario: non attribuiamo a questa sola causa tutto ciò che Ale ha osservato.

`fisica.js` risolve la direzione desiderata prima di scegliere l'assetto: se il gesto richiede di guardare contro il movimento, il giocatore si alza. Finché è disteso, il fronte resta nel settore di ±60° rispetto alla velocità effettiva; appena verticale può completare il pivot. Conservati curva breve, velocità, integrale della frenata, risposta alla levetta e stamina. Lo schizzo, come il colonnello, conserva il nuoto quando eseguito verso la porta. `controfuga.js` offre questi tiri soltanto con avanzamento verso la porta (prodotto scalare normalizzato almeno 0,5); invertendo il comando durante un gesto, il controllo di coerenza resta attivo.

Il fermo regolamentare prima smorzava `vx/vz` senza ridurre `oriz`: `computePose` continuava così a far avanzare il ciclo delle braccia anche a velocità zero. `gioco-fermo.js`, `partita.js` e `regole.js` arrestano i 14 corpi in campo e li riportano verticali in 0,25 s; la fase del crawl si ferma subito. Rimangono bicicletta e remata per galleggiare. Avvio tempo, sistemazione al centro, rigore e fine partita ripuliscono l'assetto. Le comparse delle sostituzioni mantengono il proprio percorso. Nessun arresto globale agganciato al suono del fischio: espulsione con gioco che continua resta in movimento.

Al fischio si annullano carica e gesti non ancora rilasciati, evitando un lancio differito alla ripresa; nessuna callback. I gesti già rilasciati conservano la chiusura dopo gol, come v0.49. Il comportamento dei recuperi già rilasciati nei fermi da fallo resta invariato.

## Numerazione richiesta da Ale

Numero di posizione distinto dal numero sulla calottina, riferimento sempre guardando la porta avversaria. Parità: 1 destra vicino alla porta, 2 destra fuori, 3 marcatore del centroboa al centro, 4 sinistra fuori, 5 sinistra vicino alla porta, 6 centroboa. Uomo in più: 1 esterno destro sui 2 m, 2 fuori palo destro sui 5 m, 3 fuori palo sinistro sui 5 m, 4 esterno sinistro sui 2 m, 5 palo destro sui 2 m, 6 palo sinistro sui 2 m. Due conversioni UI distinte; gli indici interni e le strategie salvate conservano il proprio significato.

Le coordinate del 4-2 esistente sono già coerenti: pali a 2,1 m e tiratori fuori a 5,2 m. Nessuna modifica a posti o IA per cambiare la denominazione. Diagrammi, editor e spiegazioni utilizzano le due numerazioni. La «Uscita del 5» dei documenti diventa «Uscita del 4» nell'interfaccia perché nella convenzione richiesta l'esterno sinistro sui 2 m è la posizione 4.

## Prove e misure

**Chiusura (Claude Code, 16/11/2026)**, dal checkpoint di Codex `9c65184`, sul branch `claude/gracious-rubin-rcvklk`.

- **Scatti di orientamento trovati e corretti.** Nuovo strumento `npm run rotazioni` (`strumenti/misura-rotazioni-v050.mjs`): partita vera computer contro computer ITA–HUN, 240 s, 14 giocatori a ogni fotogramma. Conta i fotogrammi in cui il corpo gira più di 0,35 rad (la rotazione normale arriva a 0,27 rad per fotogramma a 60 Hz) e quelli in cui nuota disteso all'indietro.
  - v0.49: 0 scatti, 63 fotogrammi all'indietro.
  - Checkpoint Codex: 24 scatti, tutti in nuotata, fino a 1,27 rad (73°) in un fotogramma; 2 fotogrammi all'indietro. Il limite di ±60° tagliava di colpo la direzione del corpo.
  - Dopo la correzione: 0 scatti, rotazione massima 0,267 rad per fotogramma come nella v0.49, 1 fotogramma all'indietro.

  `fisica.js` ora porta il corpo dentro il settore di ±60° girando al massimo di 16 rad/s in tutto, la stessa velocità dei gesti, invece di tagliare. `docs/verifiche/misure-nuoto-v050.json` riporta il nuovo hash di `fisica.js` e il riepilogo rifatto: 96 casi, 0 su 4.286 inversi, palla dietro 0 su 1.996.
- **Prove sul codice finale**, tutte PASS:
  - lint e build;
  - replay, replay-ui, gesti, sezione1-6, strategie, uomo;
  - nuoto-coerente, nuoto, gioco-fermo, posizioni;
  - v046, gameplay, centroboa, tattica, azione, cronaca, menu, desktop.

  Il replay completo, interrotto nel checkpoint, ora passa.
- **`npm run verifica`**: le sei partite sono arrivate alla fine, 49 gol su 205 tiri (24%). Senza comandi 0–2, 0–8, 0–4; con comandi 0–9, 1–13, 0–12.
  - Prima esecuzione FAIL sui vecchi riferimenti grafici: menu 4,78%, sprint 0,54%, azione 49,42%, iPhone piccolo 6,68%, orizzontale 6,33%.
  - Confronti guardati: il menu cambia per la scritta «v0.50» e i caratteri di questo computer; l'azione è un momento diverso della partita; le viste iPhone cambiano per piccoli spostamenti dei giocatori. I corpi sono in acqua e corretti.
  - Riferimenti aggiornati, poi `--partite=0` PASS con cinque immagini identiche.
- **`npm run aspetto -- --no-build`**: PASS. Gambe fuori dall'acqua 0/4.058 in verticale, 0/8.070 in nuotata, 0/1.354 a metà. Viste iPhone 56 oggetti e 141.794 triangoli. I primi piani desktop restano a 154–155 mila triangoli, fuori dal budget specifico iPhone come nelle versioni precedenti.

Stop reale: velocità max al fischio1.4→0 immediatamente; dopo.3s oriz1→0 e deltafase1.299112→0, asse verticale testa-bacino.698→.982. Dati `docs/verifiche/misure-stop-v050.json`. Filmato prima/dopo `docs/filmati/v050-nuoto-e-fischio.mp4`,8s controllati con fisica e camera vere, acquisizione30fps senza IA; tavola `docs/immagini/v050-nuoto-e-fischio.jpg`. Non è una gara completa o misura FPS.

- Nuoto dinamico: 96 casi, 30/60/120 Hz, D/S e due lati; 90°, 180°, rilascio con palla alle spalle, ricezione, colonnello opposto/avanti e inversione durante colonnello/schizzo. Ossa reali del GLB e palla confrontate con la velocità ad ogni campione, non soltanto dopo l'assestamento. Prima 100 campioni inversi su 4.366; dopo 0 su 4.286. Palla davanti durante crawl: 0 campioni dietro su 1.996. Dati `docs/verifiche/misure-nuoto-v050.json` con provenienza prima/dopo.
- Regressione nuoto v0.44: PASS, stop libero 0,19178 m / 0,33333 s, cambio a 90° 0,21667 s, ricezione→movimento 0,05 s; stamina e portieri conservati.

## Confronto Splash Land e limite del risultato

Esaminato il [trailer ufficiale App Store](https://apps.apple.com/us/app/splash-land-water-polo/id6828066734), filmato di 29,77 s con sequenze di gameplay e montaggio. [Manifest Apple originale](https://apptrailers.itunes.apple.com/itunes-assets/PurpleVideo221/v4/8e/f7/3b/8ef73b9d-940e-2953-d495-3e68b482c581/P1535265681_default.m3u8). Intervalli 0–1,5 s, 4,5–7,5 s, 14,5–17,5 s e 16,5–17,7 s. Si distinguono crawl alternato, carica verticale con braccio libero e transizione nuoto→tiro. Presenti azioni arcade e tagli/zoom. Il montaggio non misura latenza, FPS reali su iPhone o continuità di una gara intera. I 30 fps sono del file video. Nessuna riproduzione dei suoi asset nel gioco.

Il riferimento utile è la chiarezza di pose e transizioni, conservando il ritmo più lento voluto da Ale. I test di coerenza non certificano naturalezza né qualità professionale: per quel livello occorre una base di animazioni 3D curata e verificata in gioco, eventualmente realizzata da un animatore, poi adattata a palla, appoggi e contatti. Non basta aggiungere generatori di immagini o altre correzioni locali ai gomiti.

## Decisioni precedenti superate esplicitamente

- v0.49 lasciava sospesi anche i gesti non rilasciati durante uno stop. Ora si annullano al fischio, su richiesta di arresto dell'azione: nessun tiro arretrato alla ripresa. Le recovery già rilasciate conservano la policy v0.49.
- Le denominazioni «mezzo», «punto», «ala» come unica spiegazione cedono alle due numerazioni indicate da Ale. Non si rinumerano calotte o indici del motore.
- L'idoneità ai tiri in controfuga ora richiede anche la direzione verso la porta, non soltanto distanza e velocità.

## Non fatto

Nessuna riscrittura della circolazione della palla, marcatura/contatti o scivolamento laterale in verticale; nessun nuovo pacchetto di animazioni o intervento di animatore. Non dichiarata risolta ogni possibile sequenza di nuoto inverso. Non dichiarata raggiunta una resa grafica professionale o garantiti 60 fps. Nessuna prova su iPhone fisico; budget disegno misurato in Chromium software. Niente cambi a camera, velocità unica, carica al rilascio, logo, modello/geometria, espressioni facciali, replay o regole World Aquatics.
