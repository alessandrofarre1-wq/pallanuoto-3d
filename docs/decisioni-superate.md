# Decisioni superate

Ogni riga dice com'era prima e cosa vale dopo, dalla versione più recente. Le regole in vigore sono in `CLAUDE.md`; il contesto
completo di ogni versione è in `docs/storia.md` e, dalla v0.46, nei rapporti in `docs/versioni/`.

## v0.68
- Difensore che segue l’uscente e poi l’entrante fino al bordo → copertura temporanea palla-centro/porta finché il sostituto torna in zona d’attacco; schema selezionato conservato.
- Posto d’attacco legato all’indice del giocatore → occupanti per posto distinti da identità, calotta, mano e specialità; coperture e rientri dalle coordinate reali.
- Cambio di marcatura che scade dopo5s → accoppiamento conservato nel gioco vivo finché una consegna successiva lo modifica. Nei riposizionamenti già previsti dopo gol/time-out o a inizio tempo, mappe e riferimenti vengono ricostruiti; i recuperi vivi non li resettano. Il marcatore specialista prende il centro effettivo.
- Solo entrate occasionali generiche → anche passaggio vicino e taglio reattivo contro pressing con lettura di entrante/ala e mano di ricezione; A/B/C dopo 6 s e 2 passaggi, controfuga conservata ed eccezione sul fallo;12s fra quelle automatiche, comandi umani conservati.
- Compagno NPC spostato istantaneamente fuori dai2m → rientro tramite nuoto e controllo di permanenza comune al giocatore.
- Cinque preset → sei con Falso centro. La sua preparazione autonoma da un piano neutro non è implementata; CPU legge lo stato già presente.
- Arena leggera precedente → dettagli finanziati recuperando facce nascoste; stesse6mesh/atlante1024², +212tri CPU. Soglia alpha rete0,035→0,35 per evitare il pannello da lontano.

## v0.67
- Dopo ogni recupero scattavano tutti verso i posti d'attacco (v0.54, v0.58) → partono tutti subito, ma scatta solo chi può
  guadagnare un vantaggio: non è dietro al difensore più vicino o non ha nessuno entro 3 m (`SCATTI`, scelta di Ale «Partono tutti,
  scatta chi serve»).
- In rientro scattava chiunque fosse più di 0,8 m lontano dal suo posto → solo chi ha il suo uomo più vicino alla propria porta o
  che gli è scappato.
- Chi aveva il posto a più di 4 m scattava sempre, fino a stamina 0,35 (`partita.js`) → non più nelle transizioni.
- «Incrocio dei lati»: i due mezzi scattavano sempre → solo finché non sono al loro posto.
- Fatica del pressing 0,012 al secondo (scritta nel codice) → 0,008 (`PRESSING_CONSUMO`).

## v0.66
- Il computer non aveva uno schema d'attacco suo: giocava sempre l'«Arco», senza tagliante, e non entrava mai → nell'8% delle sue
  azioni in parità manda in entrata un mezzo, Pos. 2 o 3 (`ENTRATA.azione`); lo schema del giocatore resta quello scelto.
- Con lo schema «Entrata» o «Incrocio» un'entrata ogni 7 s (81 a partita) → al massimo una ogni 12 s (`ENTRATA.ogni`).
- A chi entrava si poteva passare in ogni momento: di solito gli arrivava appena partito, a 7,7 m dalla porta, e il taglio finiva
  lì → solo a meno di 5 m dalla porta e con almeno 1 m di vantaggio sul difensore o 2 m di spazio (`ENTRATA.vicino`, `vantaggio`,
  `libero`); in quel momento è il passaggio preferito. Chi riceve così tira subito (`ENTRATA.tiro`).
- Era «entrata» il tiro partito entro 3 s dall'inizio del taglio → il tiro di chi ha ricevuto tagliando, entro 2,5 s.
- Un'entrata in corso continuava anche con l'uomo in più o in meno → finisce subito: si va ai posti del 6 contro 5.

## v0.65
- Con l'uomo in più le occasioni chiare (tiro al volo, tiro da liberato) si prendevano dai 9 s (v0.59), prima solo subito dopo un
  cambio di lato → dai 7 s (`SUPERIORITA.pronta`): i tiri dei primi 10 s andavano in gol il 60-65% delle volte, quelli dopo il 30%.
- Con l'uomo in più poteva tirare al volo chiunque, anche l'ala sui 2 metri con poca porta (27% di gol) → sotto un'apertura di 0,5
  (distanza dalla linea di porta divisa per la distanza dalla porta) niente tiro al volo e voglia di tirare per 0,25
  (`SUPERIORITA.stretto`, `SUPERIORITA.strettoVoglia`): la palla va a chi vede più porta.
- Portiere in superiorità: `PARATA_SUP` 0,3 (v0.60) → 0,38.

## v0.64
- La ripartenza (fino a 12 s dopo ogni recupero) toglieva il freno della costruzione e chi riceveva libero entro 7 m tirava sempre
  → la costruzione vale anche nella ripartenza alla pari; il tiro subito dopo la ricezione è sicuro solo nella controfuga con l'uomo
  in più.
- Palla al centroboa con lo stesso vantaggio in tutta l'azione → in parità il vantaggio cresce dai 7 ai 15 s d'azione
  (`CENTRO_ATTESA`).
- Costruzione 15 s (v0.60) → 18 s; tiro di fine azione negli ultimi 6 s → 4,5 s; pazienza da 24 s → 25 s.
- Palla in mano sul perimetro 0,55-0,95 s (v0.61, stile equilibrato) → 0,4-0,7 s.
- Lotta al centro piena tra 10 e 24 s (v0.60) → tra 12 e 26 s; `ESPULSIONI.centro` 6,5 → 9, contrasto 0,24 → 0,21; espulsione per
  il fallo su chi palleggia 0,35 → 0,28.
- Falli in attacco del centroboa: con la palla 0,14 → 0,45, senza palla 0,05 → 0,12; palle rubate al centroboa 0,08 → 0,14;
  intercetto 0,12 → 0,14.
- Rigore per un fallo grave su chi sta per segnare: 0,6 da dietro e 0,35 negli altri casi → 0,45 e 0,25 (fallo voluto 0,6 → 0,5).
- Bacino disegnato nel tiro da fuori fino a 14 cm sotto il pelo (v0.61) → 16 cm (con le azioni nuove un campione di coscia usciva
  di 1 cm).

## v0.63
- Replay del gol di 7 s (0,6 s di diretta + 5,2 s di replay + 1,2 s di ripresa, v0.48) → 7,6 s (1,2 s di diretta + 5,2 + 1,2); dopo
  la rete si registrano 1,15 s (prima 0,56) e il primo piano di chi esulta occupa il 38% del replay (prima il 30%).
- Esultanza: solo il braccio alzato (v0.61) → chi ha segnato si alza con la bicicletta e agita il pugno.
- Passaggio di lato: busto quasi fermo e braccio che tornava dritto già nell'accompagnamento (l'avambraccio passava davanti al viso
  e la mano finiva sulla faccia) → busto e testa girano verso il compagno, il braccio lo segue fino al rientro, poi la mano rientra
  in acqua di lato.
- Chi nuota con la palla e tira, passa o finta: la palla saltava dall'acqua alla mano → la mano la pesca dall'acqua e la porta di
  lato all'altezza della spalla (al massimo 0,32 s, dentro i tempi del gesto).
- Chi riceve guardava dritto davanti a sé → gira la testa verso la palla in arrivo. Palombella: accompagnamento a braccio teso →
  gomito appena piegato.

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
