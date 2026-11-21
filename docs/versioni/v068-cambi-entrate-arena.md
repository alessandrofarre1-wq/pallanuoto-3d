# v0.68 — copertura dei cambi, entrate in parità e dettagli dell’arena

**Chiusura del 21/11/2026.** Ricezione e bilanciamento dei due blocchi della bozza completati e misurati. Difesa dei cambi e arena conservate. Esito della CI sul commit finale nella PR59.

Base `c11f93d` (PR #58, v0.67 già pubblicata e CI verde), branch `codex/v068-difesa-entrate-arena`. Prima di lavorare: controllate PR recenti/main, memoria riordinata e diff locale; il vecchio checkpoint v0.50 è rimasto sul proprio branch. Nessun merge o deploy di questa PR.

Ale ha segnalato il difensore che segue fino a metà campo l’avversario uscente dal cambio, arena poco dettagliata e attacco statico contro il pressing. Ha fornito gli schemi 3→5, 3→1, 2 al palo, mezze entrate e falso centro. Conservati i progressi di Claude fino alla v0.67 (circolazione, scatti, taratura, gesti, ripartenze, superiorità e replay).

## Difesa durante il cambio volante avversario

La panchina riutilizza lo stesso giocatore fisico/indice e cambia scheda/numero dopo il cinque. Prima la marcatura seguiva prima l’uscente e poi il sostituto ancora al bordo; la memoria della posizione aggravava l’inseguimento. Ora `difesa-cambi.js` riconosce uscita e rientro del sostituto anche dopo la chiusura del percorso visuale. Finché è fuori dall’azione, il marcatore copre la linea palla-centroboa; se esce anche il centroboa chiude palla-porta. Due coperture si dividono centro e lato debole. Al ritorno nella zona d’attacco (entro 10,5 m dalla porta avversaria) riprende il compito previsto. Lo schema selezionato e i comandi umani rimangono validi: nessuna modifica persistente a `defPlay` o alle coordinate.

## Entrate e occupazione degli spazi

`entrate.js` distingue atleta (indice, calotta, mano e specialità), posto tattico e uomo assegnato in difesa. I compagni scalano verso nuovi posti nuotando; gli accoppiamenti restano per identità durante il gioco vivo fino a una consegna effettiva. Alla perdita del possesso i giocatori partono dalle posizioni raggiunte. Il pannello mostra il posto d’attacco attuale, distinto dalla calotta.

- **3→5:** la 3 serve la 2 vicina; il taglio diagonale inizia soltanto al rilascio vero. La2 legge l’entrante pronto e la linea di passaggio. Se il difensore della 5 stringe, la 5 sale a3,25 m e si accentra, offrendo il secondo sbocco. Un compagno copre alto.
- **3→1:** specchio con appoggio alla 4. Valutati mano e capacità dei due tiratori (coppia mancina oppure elevata capacità atletica/tecnica), senza imporre ricezioni impossibili.
- **2 al palo:** appoggio al vicino e taglio diretto; **mezze entrate da 1/5** soltanto con testa già davanti e proprio marcatore vicino ma poco reattivo. Un difensore lontano non basta a dichiararlo addormentato.
- **Dopo il fallo:** l’intenzione può essere preparata sul tiro libero, ma il movimento inizia dopo il rilascio del passaggio. Ripresa effettiva verificata tramite fallo/stop/ripresa del motore.
- **Falso centro:** nuovo preset prepartita. Un non specialista al centro cerca di portare fuori il marcatore forte; la boa vera attende il corridoio libero e subentra. Assegnazioni iniziali sul centro effettivo, poi mantenute durante l’uscita. La difesa può consegnare, aiutare o coprire temporaneamente a M; la zona sceglie un esterno e non scambia il falso centro per il tiratore da concedere. La CPU legge una situazione già creata da disposizione o movimento; non prepara autonomamente da zero il falso centro in un piano ordinario.

Conservati i tempi generali di costruzione/pazienza e la quota 8% delle entrate generiche; le risposte al pressing sono situazionali con pausa di 12 s fra entrate automatiche. A/B/C richiedono circolazione avviata (almeno 6 s e 2 passaggi) e non interrompono la controfuga organizzata; dopo un fallo recente si può entrare subito sul passaggio. I comandi manuali conservano libertà di chiamata. Nessun bonus automatico al gol, all’espulsione o al rigore. Regola dei2 m e linea della palla restano applicate.

Trovata una correzione istantanea preesistente dei compagni sotto i2 m: rimossa. Ora l’IA punta a rientrare nuotando e la permanenza irregolare usa lo stesso controllo temporale del giocatore umano. Sguardo del tagliante verso il portatore/palla soltanto nel livello visuale: la direzione fisica del nuoto resta coerente. Reset esplicito alla nuova partita e quando il gioco ricolloca le squadre dopo gol/time-out o inizio tempo. Il primo candidato conservava mappe del taglio precedente dopo quelle ricollocazioni: corretto prima della PR. Otto casi nuovi controllano recupero vivo, nuova disposizione, centro effettivo, schema/controllo, riferimenti di marcatura e memoria dell’entrante. Nessun nuovo spostamento delle coordinate introdotto dal reset.

## Arena

Un solo atlante 1024² e le stesse sei mesh statiche. Sedute sagomate, pensilina e sostegni, corrimani, panchine con teli/borse/tappeti, tavolo con monitor e ufficiali 3D. Porte con pontoni smussati, giunti/supporti e rete leggermente deformata. Rulli ancora esagonali: testate ritagliate recuperano1208triangoli per finanziare i dettagli. Soglia alpha della rete 0,035→0,35 per evitare la lastra scura vista da lontano. Nessun nuovo oggetto di simulazione, collider, modello degli atleti o cambiamento dell’acqua/camera. Riferimenti: screenshot di Splash Land e finale olimpica forniti da Ale; nessun asset o marchio copiato.

Il risultato è un miglioramento incrementale del dettaglio; non è una certificazione di qualità professionale. Prima/dopo con medesimi giocatori e camera in `strumenti/arena-v068.mjs`.

## Sequenze da vedere

Filmati registrati sul candidato con innesco6s/2passaggi, prima dell’ultimo limite D. Gli hash nei metadati identificano la fase misurata; non sono una verifica completa della taratura finale.

- [Cambio volante: filmato](../filmati/v068-cambio-volante.mp4) e [sei momenti](../immagini/v068-cambio-volante.jpg). Scena iniziale preparata, poi ciclo reale per 24 s: esce il #10 HUN, il cinque avviene a 8,55 s, cambia scheda a 9,07 s, il #5 torna in attacco a 14,93 s. Il marcatore ITA #5 copre il centro e poi riprende il suo uomo; massimo 5,00 m dalla propria porta durante l'assenza, 0 s oltre metà, passo massimo 4,33 cm. Pressing e controllo conservati, palmi aggiornati a ogni passo. Filmato accelerato 3× (8 s a 15 fps); portatore HUN comandato senza input e caso 0,5 per isolare il cambio, regole/collisioni attive. Non è una partita libera.
- [Entrata IA: filmato](../filmati/v068-entrata-ia.mp4) e [quattro momenti](../immagini/v068-entrata-ia.jpg). Partita CPU reale, seme 68: prima A osservata a 137,13 s, Italia #9 serve #5 e taglia dalla posizione 3 verso la 5. L'appoggio riceve a +0,27 s; l'azione si interrompe prima del ritorno al tagliante. Esportati i primi 53 fotogrammi (1,77 s di gioco), rallentati 2× per seguirli; esclusa la ripresa successiva, che non è parte del taglio. Cerchi/etichette solo nel filmato, nessun passaggio o posizione imposti. Questo episodio non dimostra una ricezione/tiro riusciti del tagliante: i doppi passaggi conclusi sono le scene controllate del ciclo reale descritte sotto.

## File

- Gameplay: `difesa-cambi.js`, `entrate.js`, `ia.js`, `panchina.js`, `tiri.js`, `taratura.js`, `centroboa.js`, `lotta.js`, `fisica.js`, `statistiche.js`, `partita.js`, `regole.js`, `schemi.js`, `hud.js`, `menu.js`.
- Disegno: `grafica/arena.js`, breve sguardo in `grafica/pose.js`.
- Prove: nuovi `difesa-cambi-v068`, `entrate-v068`, `entrate-integrazione-v068`, `area-movimento-v068`; script e passi CI. Strumenti `arena-v068`, `video-entrate-v068`.
- Versione `package*.json`0.68.0; memoria, storia, decisioni superate, consegne e misure aggiornate.

## Misure del checkpoint iniziale

Questa sezione ricostruisce le fasi precedenti alla chiusura del21/11; i risultati finali e la ricezione D corretta sono sotto.

### Misure mirate

Il primo candidato attivava i tagli troppo presto, anche in ripartenza. Sui medesimi primi due semi: v0.67 13,75 gol per squadra, candidato 20,75. Il giro da otto è stato interrotto dopo quattro partite, non dichiarato PASS. Corretto l'innesco (6 s/2 passaggi, controfuga conservata, eccezione sul fallo). Le scene positive di attacco già disposto ora dichiarano 8 s di possesso e due passaggi precedenti; aggiunte due qualifiche, una per verso, con prove negative sul primo tocco/circolazione incompleta e positive su costruzione/fallo. Nessuna soglia abbassata. Il candidato con innesco corretto ma mezze ancora lunghe, su otto partite, produce 16,875 gol e 39,31 tiri per squadra; entrate =38,15% dei gol, 6 voci su15 in fascia. Italia11,625–Ungheria22,125; superiorità42,86%, azioni13,28s. Quel candidato era troppo prolifico e non costituiva una taratura conclusa. Ultima correzione: obiettivo della mezza entrata limitato a1,4m, niente taglio se lo spostamento utile è sotto0,6m. Alla prima pubblicazione questo limite non era ancora misurato e restava il problema della ricezione dall’ala larga. Entrambi i blocchi sono chiusi e documentati nella sezione finale; precisione/potenza non alzate.

- **Cambi:**25 scene, due squadre/direzioni, pressing/zona/M, cambi successivi e controllo umano. Stesse asserzioni sulla v0.67: FAIL. Prima il marcatore arriva18,506 m dalla porta e fino 46,85 s oltre metà; dopo 0 s oltre metà, massimo5 m durante l’uscita. Aiuto al boa1,009–1,186 m; due coperture separate1,970 m; passo massimo4,81 cm. Indice/uid conservati allo scambio.
- **Entrate isolate:** appoggio e ricezione fisica A/B/C nei due versi, ricezioni3,49–3,59 m; ala salita e doppia copertura, mano, mezze entrate, falso centro, rientro e ripresa dal fallo. Foto di stati calcolati dalla fisica; non è una partita completa.
- **Ciclo reale:**18 scene con `partita.update` e render/pose attivi, GPU spenta, pallone dal palmo reale. Dodici scene aperte/davanti completano appoggio e secondo passaggio autonomamente. Le due B schierate rinunciano al ritorno e circolano; nessuna decisione di servizio sul taglio non pronto. Marcatori percorrono1,17–4,99 m, appoggi almeno0,564 m; passo massimo4,84 cm. Controllata scelta della zona sul centro reale e dopo scambio dei posti.
- **Area2 m:** rientro tramite nuoto in 0,8833 s nei due versi, passo massimo4,28 cm; nessun salto o fallo anticipato. La prova iniziale si fermava a0,75 s e il secondo verso ereditava `areaT`: preparazione isolata corretta e osservazione allineata alla tolleranza1,2 s già in gioco.
- **Arena CPU:**8084→8296triangoli (+212), sei mesh statiche invariate. I conteggi GPU per camera/frustum differiscono: vedere dati finali, non sommare ciecamente la differenza CPU alle scene.

La prova precedente `v046`, caso 4, scriveva soltanto `t.scambio` e lo trattava come assegnazione. Con la nuova separazione fra diagnostica e accoppiamenti la scena prepara invece un tagliante che supera il proprio marcatore e un compagno in copertura: un passo reale del motore deve produrre la consegna. Conservata l'asserzione sullo scambio dei due uomini; prova PASS.

Guardati tutti e cinque i confronti screenshot. Nel menu cambia la versione (e il carattere di sistema rispetto alla macchina che aveva prodotto il riferimento); nello sprint incidono i rulli; nelle tre scene d'azione cambiano partita, posizioni/camera conseguenti e dettagli dell'arena. Interfaccia e comandi restano leggibili. Aggiornati i riferimenti senza allargare la tolleranza. Le sei partite del primo giro sono terminate: 78 gol su 233 tiri. Il FAIL iniziale di `verifica` era nei riferimenti immagini; il controllo successivo usa soltanto `--partite=0`.

Dati con provenienza e hash in `docs/verifiche/v068/`.

| Scena iPhone emulata | v0.67 chiamate / triangoli | v0.68 chiamate / triangoli |
|---|---:|---:|
| Diretta, 844 e 667 px | 57 / 141.796 | 57 / 142.118 |
| Arena intera, 844 e 667 px | 61 / 142.498 | 61 / 142.710 |
| Due cambi, 844×390 | 64 / 148.640 | 64 / 148.852 |
| Due cambi, 667×375 | 62 / 148.196 | 62 / 148.518 |

DPR 1,5; stesso posizionamento e stessa camera nei confronti statici. Nei cambi: due richieste effettive e 20 campioni in 1.200 fotogrammi a 60 Hz per vista. Nessun errore console/WebGL. Il test costumi aggiunge un'altra sequenza con due riserve visibili: massimo 62 / 148.262. Replay iPhone: massimo 49 / 146.682, con 14 corpi completi. Non sono misure di FPS di un dispositivo fisico.

`aspetto` del checkpoint iniziale: PASS, partita terminata; gambe fuori dall'acqua 0/7.513 in assetto verticale, 0/4.840 in nuotata, 0/1.129 nelle transizioni. Viste iPhone finali 56 / 142.116 in entrambe le taglie. I primi piani senza emulazione touch restano a dettaglio desktop (153.550–155.552 triangoli); sono distinti dai conteggi iPhone e dal replay mobile.

[Confronto dell'arena: stessa scena e stessa camera](../immagini/v068-arena-prima-dopo.jpg). Ispezionate diretta, panoramica, porta e tavolo: la rete non appare più come un pannello scuro; strutture e attrezzature acquistano profondità. Gli ufficiali restano stilizzati e il contorno richiede ancora una valutazione artistica con Ale.

## Decisioni precedenti superate esplicitamente

1. Marcatore che segue sempre l’uomo fino al bordo durante il cambio → copertura temporanea e ripresa della marcatura quando il sostituto torna pericoloso.
2. Posti sempre legati a `i` e consegne scadute dopo 5 s → occupanti separati dall’identità e consegne conservate, con spostamenti reali.
3. Sole entrate generiche occasionali → anche risposte al pressing legate al passaggio vicino e alla reazione difensiva. Il piano del giocatore viene conservato.
4. Correzione istantanea degli NPC sotto i2 m → rientro nuotato e controllo di permanenza comune.
5. Cinque preset → sei con Falso centro. Regole World Aquatics, velocità, sprint/carica e simulazione del pallone conservati.

## Verifiche del checkpoint iniziale

Esiti reali: primo giro completo `prove --con-verifica`:40PASS/1FAIL su41 (riferimenti screenshot), sei partite finite78gol/233tiri. Dopo i fix sono passati14/14 controlli mirati; dopo l’ultimo limite D,6/6 (lint, entrate, integrazione, nuoto coerente, gioco fermo, replay), più25scene difesa ripetute. `aspetto` sul checkpoint iniziale PASS: gambe0/7513,0/4840,0/1129; iPhone56chiamate/142116tri su entrambe le viste. `verifica --partite=0` bloccante PASS prima dell’ultimo limite D; il controllo immagini dopo quel limite e la CI sull’ultimo SHA sono riportati nella PR. Non attribuire le sei partite iniziali al codice finale. La CI esegue le sei partite sul commit pubblicato; il suo esito va distinto dalla chiusura successiva. Nessun abbassamento delle soglie. Vincolo iPhone: <100 chiamate/<150.000 triangoli anche durante due cambi e replay;14 corpi completi.

Non eseguiti test su iPhone fisico né promessi60fps. Nessuna revisione generale delle espressioni facciali o delle animazioni, nuova meccanica arcade o modifica del flusso CI per eliminare la doppia esecuzione dopo merge. L’interfaccia resta essenziale. Da giudicare con Ale: naturalezza, frequenza delle entrate e resa artistica dell’arena. La CPU non costruisce una preparazione completa del falso centro da un piano neutro: legge le disposizioni e gli accoppiamenti reali già presenti; il preset permette di chiamarlo prima della partita.

## Chiusura del 21 novembre 2026

I due blocchi della prima bozza sono chiusi. La mezza entrata D parte soltanto quando lo scatto legale di 0,6–1,4 m porta a una finestra di ricezione raggiungibile. Si conserva la soglia di 5 m di `entrataPronta`; un margine di 20 cm nell'obiettivo copre i 12 cm di arresto del movimento. Dall'ala larga, e nel caso al bordo profondità2,6/laterale5,7 m, la squadra continua la circolazione. La mezza entrata non manda più il compagno esterno sul punto: non avendo scambiato i posti, conserva gli appoggi laterali. A/B/C, mira, potenza, portiere e probabilità delle regole non modificati in questa chiusura.

File produttivi della chiusura: `src/entrate.js`, `src/taratura.js`. Prove ampliate in `tests/entrate-v068.mjs`, `tests/entrate-integrazione-v068.mjs`. Quattro casi D nel ciclo reale (entrambi i versi e entrambe le mani) completano servizio autonomo a0,700s, presa a1,033s e tiro a1,483s; target a4,552m dalla porta, passo massimo dei14atleti4,83cm. Gli assert richiedono il tiro, non il gol. Controllati rinuncia con difensore davanti, ala larga, margine di arresto e spazio dell'esterno. I difensori di sfondo della nuova fixture sono distanziati per non partire sovrapposti; il palmo viene misurato prima del rilascio, quando esiste. Nessuna asserzione precedente abbassata.

[Quattro fotogrammi: taglio, servizio, presa, tiro](../immagini/v068-mezza-entrata.md). Scena iniziale preparata, poi IA/partita e palmi reali, difensore mobile; nessun servizio o tiro imposto. Camera fissa solo per il foglio. Non è una partita libera né misura degli FPS.

| Campione, 8 partite per riga | Gol/squadra | Tiri/squadra | Gol da entrata | Voci in fascia |
|---|---:|---:|---:|---:|
| Candidato con mezze ancora lunghe |16,875|39,3125|38,15%|6/15|
| PR59 iniziale `3a8984b`, già D1,4m |13,8125|35,5625|18,55%|10/15|
| Chiusura finale, endpoint/ricezione e appoggi corretti |14.5625|35.4375|19,31%|13/15|

Il primo limite D, già nella bozza, aveva ridotto l'eccesso: nella ripresa è stato finalmente misurato. Non attribuire questa riduzione soltanto agli ultimi due ritocchi. Il campione finale usa i medesimi semi1–8 (`n*7919`) e tempi480s. Esito: 14,56 gol / 35,44 tiri per squadra; conversione 41,09%, superiorità 48,28%, rigori 1,62; 13/15 voci in fascia. Italia10,38, Ungheria18,75; la media non indica squadre equivalenti. I dati completi distinguono i tre candidati e riportano hash dei file, comandi e semi. Otto partite non provano piccoli miglioramenti percentuali: non sono stati cambiati i parametri globali per inseguire questi scarti.

Controlli locali finali: lint, gameplay, tattica, difesa dei cambi e area **5/5 PASS**, oltre alle entrate isolate e all'integrazione sopra. `aspetto` **PASS completo**: gambe0/7123,0/5180,0/1179; iPhone56chiamate/142116triangoli nelle due viste. `verifica --partite=0` **PASS** con confronti ispezionati e riferimenti aggiornati dopo i cambi di fase della simulazione. Le sei partite di verifica e tutti i passi della CI vengono eseguiti sul commit pubblicato: controllare l'ultimo SHA nella PR59, non riutilizzare l'esito della bozza. La CI della bozza `3a8984b` era tutta verde.

Restano le due voci globali già note: 66,81azioni per squadra e parità da14,66s rispetto a45–56 e18–24s; nessuna pretesa di taratura completa della pallanuoto reale. Restano inoltre preparazione autonoma completa del falso centro, prova su iPhone fisico e giudizio artistico/naturalezza di Ale. Nessun nuovo lavoro su questi punti, merge o deploy. Budget geometrico invariato rispetto alle prove arena/replay (due cambi64/148852, replay49/146682);14corpi completi.
