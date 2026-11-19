# Decisioni superate

Ogni riga dice com'era prima e cosa vale dopo, dalla versione più recente. Le regole in vigore sono in `CLAUDE.md`; il contesto
completo di ogni versione è in `docs/storia.md` e, dalla v0.46, nei rapporti in `docs/versioni/`.

## v0.62
- Memoria (`CLAUDE.md`, 213 KB) con tutta la storia di 61 versioni, decisioni superate comprese → memoria corta con le sole regole
  e decisioni in vigore; la storia in `docs/storia.md`, le decisioni cambiate qui.
- Tutti i documenti allo stesso livello in `docs/` → cartelle `versioni/`, `verifiche/`, `riferimenti/`, `proposte/`.
- Numeri del bilanciamento sparsi in otto moduli (`ia.js`, `fisica.js`, `lotta.js`, `regole.js`, `tiri.js`, `partita.js`,
  `finte.js`, `panchina.js`) → tutti in `src/taratura.js` con accanto i riferimenti reali (`npm run taratura`); il gioco è identico.
- Passi della CI lanciati a mano uno per uno → `npm run prove` (stessi passi, letti dal file della CI, con il riepilogo).
- Palla in mano prima del passaggio misurata solo con la sonda della v0.53 (ogni volta che la palla lascia la mano) → anche nel
  bilancio, solo sui passaggi dei giocatori di movimento a gioco in corso.

## v0.61
- Replay: camera ferma durante ricezione e volo, sempre con lo stesso orientamento, e solo un avvicinamento dopo la rete (v0.48) →
  camera che gira di circa 35° attorno all'azione e scende, poi taglio con lampo su un primo piano a pelo d'acqua di chi esulta.
- Bacino disegnato mai sopra 22 cm sotto il pelo dell'acqua per tutti (v0.22) → fino a 14 cm sotto nel tiro da fuori.
- Palla in mano sul perimetro 1,1-1,8 s con lo stile equilibrato (v0.53) → 0,55-0,95 s (tabella `CIRCOLAZIONE`).

## v0.60
- Costruzione dell'azione in parità 11 s (v0.59) → 15 s; tiro subito dopo la ricezione in parità 40% → 30%.
- Lotta al centro piena tra 8 e 20 s d'azione (v0.59) → tra 10 e 24 s; `ESPULSIONI.centro` 5,6 (v0.56) → 6,5.
- Intercetto: base 0,09 e passaggio lungo 0,3, scritti nel codice → 0,12 e 0,36 (`INTERCETTO`).
- Parata in superiorità −0,2 (nel codice) → −0,3 (`PARATA_SUP`); tiro al volo in superiorità 85% → sempre.

## v0.59
- Tiro subito a ogni ricezione libera → deciso una volta per ricezione (in parità circa una volta su tre).
- Finte tutte verso la porta → dalla seconda finta di lato, che sposta difensore e portiere.

## v0.58
- Superiorità del computer pronta a 5 s e voglia di tiro da 5 a 9 s → (poi v0.59) pronta a 9 s e voglia da 8 a 12 s.

## v0.57
- In inferiorità braccio del muro dalla parte del palo coperto (v0.30) → a specchio del braccio di tiro; il centrale tra i pali
  copre il palo lungo invece di spostarsi solo verso la palla.
- Passaggio fuori dal fondo ripreso dal proprio portiere se nessun difensore aveva toccato → conta l'ultimo lancio (angolo agli
  avversari se a lanciare è la squadra che difende quella porta).
- Tiro murato da un difensore e uscito dal fondo = angolo (v0.28) → rimessa del portiere (art. 13.1.2.2.3).
- In ripartenza nessuno più di 4-14 m davanti alla palla (v0.18) → i compagni scattano ai posti d'attacco.
- Errore dei passaggi sotto pressione della v0.56 (fino a ×3,5) → al massimo ×1,8 e mai oltre due volte l'errore tipico.

## v0.56
- Presa del passaggio entro 0,85 m dal centro del corpo → alla mano (0,55 m; portiere 0,9 m dalla v0.57).
- Espulsioni nella lotta al centro uguali in tutta l'azione → crescono con l'azione (`LOTTA_FASE`).

## v0.55
- Doppio tocco = finta e tocco = polso (v0.16/v0.29) → tocco = finta, tenuto breve (fino a 0,36 s) = polso, più a lungo = tiro
  caricato; tocco breve di Spazio = tiro (v0.45) → finta.
- Palmo sotto la palla (v0.31/v0.49) → mano dietro la palla, gomito in fuori.
- Corpo verticale dritto (v0.12-v0.53) → sempre inclinato a gioco in corso (dritto a gioco fermo).
- Braccia che arrivano esattamente alla mano della posa → braccia più distese («non cavallette»).
- Passaggio al centroboa sempre alla mano → in acqua davanti a lui se è marcato.

## v0.54
- Stanchezza fino a −40% della velocità (v0.16) → fino a −18%; con la palla −15% → −7%.
- Controfuga organizzata con probabilità diversa per nazionale (v0.46) → ripartenza sempre, dopo ogni recupero.

## v0.52
- La v0.51 attribuiva il corpo girato al contrario a Safari → la causa era il ripristino del replay.

## v0.50
- Carica e gesti non ancora rilasciati restavano sospesi al fischio (v0.49) → si annullano allo stop.
- Nomi mezzo/punto/ala nell'interfaccia → numerazione 1-6 distinta per parità e uomo in più.
- Controfuga anche senza andare verso la porta → richiede di avanzare verso la porta.

## v0.49
- Braccia orientate solo con le direzioni nominali → piegamento calcolato sulle lunghezze vere del modello; bacino solidale alle
  spalle → torsione distribuita sulla schiena; piega del polso fissa → per fase del gesto; gesto sospeso dopo il gol → recupero
  dei soli gesti già rilasciati.

## v0.48
- Attesa dopo il gol 3,8 s (v0.47) → 7 s saltabili (0,6 diretta + 5,2 replay + 1,2 ripresa); il motore resta fermo 3,8 s come da
  regolamento, il resto è solo presentazione.
- Camera del replay che ricalcolava il quadro sui giocatori vicini (v0.47) → quadro stabile (a sua volta superato nella v0.61).

## v0.46
- Fallo su chi palleggia valutato come un contrasto qualsiasi → espulsione probabile.
- Difensori del computer sempre a uomo → cambio di marcatura sulle entrate; quasi solo pressing → anche zona.

## v0.45
- Spostamento lento e scivoloso con curve ampie (v0.17) → controllo preciso con una piccola inerzia continua.
- Tastiera WASD, Spazio passa, Q cambia, E comando → frecce, Spazio tiro/finta, D passaggio, C cambia, Q/W/E schemi, F comando.
- Logo provvisorio con il 7 dorato → logo C «Flusso» scelto da Ale.

## v0.44
- Pali in superiorità sempre centroboa e punto con un solo 4-2 fisso → posti e pali dalla fase dello schema chiamato.
- Pulsante CAMBI sempre visibile (v0.39) → solo con un consiglio urgente o un cambio in corso.
- Pannello del giocatore sempre visibile e registro accanto alla pausa → pannello per 3 s dopo un cambio manuale e a inizio
  partita, registro dal menu di pausa.

## v0.42
- Cambio in coda possibile anche in difesa lontano dalla porta (v0.34) → mai mentre la squadra difende.

## v0.41
- Lotta al centro con barra di forza e SPRINT che aumentava un numero → lettura della linea di ricezione e movimento vero.
- Girata con esito casuale e rigore → aggiramento reale senza rigore regalato; beduina decisa dal ruolo → dalla posizione vera.
- Preferenza fissa per la diagonale lunga → scelta dalla geometria; tagli casuali → entrata coordinata; schemi fissi → preset e
  editor prepartita.

## v0.39
- Pulsante CAMBI a destra (v0.38) → in basso al centro.

## v0.38
- Più visuali e zoom → una sola regia da ripresa televisiva; scelta della velocità di gioco → ritmo unico (SPEED 1).
- Tabellone al centro → in alto a sinistra; nome dell'espulso che spariva dopo il primo avviso → nome e tempo sempre visibili.
- Palla con il contorno nero → senza; carica lunga con tiro automatico → tiro al rilascio.
- Riflesso dell'acqua sempre acceso (v0.37) → solo in qualità alta; qualità che poteva solo calare → recupero graduale.

## v0.34
- Barra dei cambi in gioco (v0.33) → sul pulsante CAMBI solo il cambio consigliato, che parte subito.
- Rose e nomi generati → rose vere dal database di Ale; pulsante Panchina finito per errore in home → nel menu di pausa.

## v0.33
- L'espulso spariva → nuota fino al pozzetto e rientra solo da lì.
- Sostituzioni solo prima della partita → soprattutto durante il gioco, illimitate.

## v0.31
- Tiro a schizzo che rimbalzava apposta prima della porta e colonnello automatico in nuotata → tiri di Ale con tasto a comparsa
  in controfuga.

## v0.30
- Contrasto a tocchi della v0.29 con pochissimi falli del computer → il terzo tocco è un fallo valutato come un contrasto vero.

## v0.29
- Contrasto «tenuto = fallo voluto» (v0.17) → tre livelli a tocchi (disturbo, disturbo, fallo).

## v0.24
- Partita in verticale e in orizzontale → solo in orizzontale; messaggi al centro dello schermo → notifiche ai margini.

## v0.22
- Due grafiche (Realistica e Cartoon) → solo Cartoon; acqua con riflesso e vista sott'acqua → un'acqua disegnata sola.

## v0.18 e prima
- «Alzata (prova)» nel menu → alzata fissa a 0,25 s (v0.18); alzata di mezzo secondo → 0,25 s (v0.17).
- Italia in blu comandata dal giocatore (scelta iniziale) → la squadra del giocatore in bianco, il computer in blu, portieri in
  rosso (v0.16); nomi inventati → nomi veri autorizzati da Ale (v0.16, rose vere dalla v0.34).
- Animazioni registrate Mixamo (v0.11) → tutti i movimenti costruiti sulle ossa (v0.12).
