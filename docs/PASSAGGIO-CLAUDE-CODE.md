# Passaggio WATERPOLO 7 — v0.68

Repository `alessandrofarre1-wq/pallanuoto-3d`, branch `codex/v068-difesa-entrate-arena`, base main `c11f93d` (PR #58, v0.67 di Claude). Versione `0.68.0`. Prima di proseguire riallinea main, PR recenti, CI, questo branch e diff locale. L'archivio v0.49/v0.50 sotto non è il punto da cui ripartire.

Leggi [CLAUDE.md](../CLAUDE.md), [rapporto v0.68](versioni/v068-cambi-entrate-arena.md), [decisioni cambiate](decisioni-superate.md) e [misure con provenienza](verifiche/v068/). Esiti della CI sull'ultimo SHA e stato del campione e della consegna sono nella descrizione della PR v0.68; controllarli prima di dichiarare pronto un seguito. Nessun merge/deploy eseguito da Codex.

## Implementato

- Cambio volante avversario: il marcatore copre temporaneamente palla-centroboa/porta, senza inseguire l'uscente al bordo; due coperture si dividono gli spazi. Riprende il sostituto quando entra nella zona d'attacco, entro 10,5 m dalla porta. Pressing/zona e controllo umano conservati.
- Entrate A/B/C: 3→2 e taglio verso 5; specchio 3→4 e taglio verso 1 con mano/abilità adatte; 2 al palo. Taglio al rilascio effettivo. L'appoggio legge entrante pronto, ala salita a 3,25 m sulla chiusura del suo difensore, oppure circolazione. Mezze entrate 1/5 richiedono testa davanti e marcatore vicino poco attento. Nessuna sanzione o rete garantita.
- L'innesco A/B/C richiede 6 s di possesso e due passaggi; mezza D con obiettivo max1,4m e almeno0,6m utile; non interrompe la controfuga organizzata. Dopo un fallo recente può partire subito sul passaggio. Cooldown automatico 12 s, comandi manuali conservati. Il primo candidato partiva troppo presto: sui due semi di controllo 20,75 gol per squadra contro 13,75 della v0.67. Non riattivare quell'innesco precoce.
- Identità, calotta, mano e specialità separate dal posto tattico. Occupanti e consegne persistono durante il gioco vivo; rientri dalle posizioni raggiunte. Quando le regole ricollocano le squadre dopo gol/time-out o a inizio tempo, si ricostruiscono mappe e riferimenti, pulendo anche la memoria dell'entrante. Nessun reset sui recuperi vivi.
- Preset **Falso centro**: non specialista esce, boa vera attende il corridoio e subentra; difesa può consegnare o aiutare temporaneamente a M/raddoppio. Centro effettivo usato da lotta, fisica, zona e statistiche. HUD con posto attuale distinto dal numero di calotta.
- Rimossa la correzione istantanea degli NPC sotto i 2 m: tornano nuotando. Sguardo del tagliante verso il portatore solo visuale, direzione fisica coerente.
- Arena: sedute, pensilina, corrimani, panchine/attrezzature, tavolo e ufficiali 3D, pontoni/supporti/rete e rulli. Sei mesh statiche, atlante 1024²; CPU 8.084→8.296 triangoli. Nessun modello/controllo/camera/acqua sostituito.

## Verifiche da conservare

- Primo giro completo40PASS/1FAIL immagini su41, sei gare78gol/233tiri: precedente ai fix finali, non attribuirlo al codice finale.
- Dopo i fix14/14 mirate PASS; dopo ultimo limite D6/6 PASS (lint, entrate, integrazione, nuoto coerente, gioco fermo, replay).25scene difesa ripetute PASS.
- Aspetto finale completo PASS: gambe0/7513,0/4840,0/1129; iPhone56/142116. Arena con due cambi64/148852, replay49/146682.
- PR DRAFT: CI in corso/da consultare nella PR, non dichiararla pronta al merge.
- Otto partite prima della mezza corta:16,875gol,39,31tiri per squadra,38,15%gol da entrata,6/15voci in fascia. Bilancio dopo ultimo limite1,4m NON completato. D ora richiede anche0,6m di spostamento utile.
- Punto concreto da verificare: ala a6,2m, mezza1,4m, `entrataPronta` richiede distanza porta<=5m; il target può rimanere fuori finestra. Risolvere con prova di ricezione/tiro reale prima di tarare8/16gare. Non allargare soglie senza verificare il comportamento.

I filmati sono verifiche: quello del cambio parte da una scena preparata (portatore comandato senza tiri, caso 0,5), poi usa il motore reale per 24 s e viene accelerato 3×. Quello dell'entrata cerca una vera azione CPU, senza imporre passaggi o posizioni; cerchi/etichette sono solo annotazioni del filmato. Non sono misure degli FPS di un iPhone fisico né prova di naturalezza professionale. Vedi rapporto e metadati.

## Da continuare con Ale / Claude

1. Completare e valutare il campione di otto partite sul codice finale e la frequenza delle entrate giocando. Conservare circolazione e ripartenze di Claude; non compensare un problema di scelta tattica alterando alla cieca precisione/potenza. La taratura non è dichiarata conclusa dai test geometrici.
2. La CPU riconosce un falso centro già disposto o nato dai movimenti, ma **non costruisce autonomamente la preparazione da un piano ordinario**. Il preset è disponibile al giocatore. Se completi la preparazione, conserva mano/specialità, tempi e lettura difensiva; nessun esito garantito.
3. Restano i problemi v0.67 di durata delle azioni, superiorità, fatica da contatto e riferimento reale dei falli. Non sono automaticamente risolti dalla v0.68.
4. Ale deve giudicare la resa artistica dell'arena e la naturalezza in partita. Il dettaglio è migliorato in modo incrementale; per il livello professionale serve ancora una valutazione artistica, non altre sole misure geometriche.

Se la PR v0.68 non è unita, prosegui dal suo branch senza duplicarla. Se è unita, parti da main aggiornato e alza la versione della nuova PR. Preserva tutto il lavoro successivo di Claude. Limiti iPhone sempre <100 chiamate e <150.000 triangoli anche con due cambi/replay, 14 corpi completi; nessuna deroga. Una sola istanza Chromium pesante per volta. Browser locale: `PLAYWRIGHT_BROWSERS_PATH=/tmp/pallanuoto-browsers`. Non aggiungere prove delle espressioni facciali senza richiesta di Ale.

---

# Archivio — passaggio a Claude Code v0.50 sospesa

> **Ripreso e chiuso da Claude Code il 16/11/2026** sul branch `claude/gracious-rubin-rcvklk`: scatti del limite ±60° corretti, prove mancanti eseguite, riferimenti grafici aggiornati. Esiti in `docs/verifiche/verifiche-v050.md`. Restano aperti i punti di «Non fatto».

Ale ha chiesto di fermare Codex e continuare con Claude Code il 16 novembre 2026 alle 17:09 UTC. La pipeline locale è stata interrotta. Alle17:09 non c’erano commit/push/PR v0.50. In seguito Ale ha autorizzato il solo caricamento su GitHub per continuare con Claude: questo è il checkpoint sul branch `codex/v050-nuoto-direzione-stop`, senza PR, merge o deploy. Il commit usa `[skip ci]`: nessuna nuova pipeline onerosa avviata per il passaggio. Il lavoro resta incompleto e non approvato visivamente da Ale.

## Prompt da usare

Continua WATERPOLO 7, repository alessandrofarre1-wq/pallanuoto-3d. Prima di modificare o avviare test onerosi riallinea GitHub, main, PR recenti, CI e diff locale: conserva il lavoro di Claude e Codex. Workspace Codex /workspace/pallanuoto-3d; branch codex/v050-nuoto-direzione-stop, base main fa688c51aaedd8090b0e933140aaec2e828cf6ab (PR45 v0.49 già unita). Il checkpoint v0.50 è nel branch GitHub `codex/v050-nuoto-direzione-stop`; recupera prima la sua ultima revisione. Se lavori su un'altra macchina, usa la patch del pacchetto allegato su una copia pulita della base, verificando prima eventuali cambi successivi. Non applicarla alla cieca sopra main modificato.

Ale vuole un gioco fluido, con ritmo controllato e resa 3D professionale. Segnala ancora circolazione della palla macchinosa, marcatori incollati, rotazioni innaturali, assenza di scivolamento laterale in verticale con/senza palla, nuoto al contrario e pallone dietro la schiena. Al fischio devono fermare avanzamento e bracciata e restare verticali a galleggiare. Non dichiarare risolta la naturalezza perché passano test geometrici: mostra e verifica una vera sequenza giocata. Per una resa professionale valuta una base di animazioni curata da un animatore 3D, integrata con presa/contatti; non promettere che bastino altri ritocchi procedurali.

### Implementato localmente, da revisionare

1. fisica.js: fronte desiderato scelto prima dell'assetto; crawl consentito se compatibile con il movimento; finché oriz>.5 e velocità>.3, fronte nel settore ±60° dalla velocità effettiva. Nessun nuovo asset. Schizzo escluso dalla verticalizzazione come colonnello. controfuga.js richiede avanzamento verso porta (coseno >=.5) per offrire i due tiri speciali. Verificare possibili scatti introdotti dal limite angolare, non limitarsi al valore finale del fronte.
2. gioco-fermo.js (nuovo), partita.js, regole.js: stop immediato dei 14 corpi in campo e upright in ALZATA=.25s; countdown/collocamenti/rigori/fine ripuliscono l'assetto. pose.js ferma la fase crawl fuori da play/fixture paused, con eccezione comparsa cambio. Non agganciato al suono whistle: espulsione in play continua. Carica e gesto non ancora rilasciato annullati; act.done conservato. Recovery dopo gol invariata; niente nuova recovery dei gesti già rilasciati su fallo. Questa annullazione supera esplicitamente la decisione v0.49 di tenere sospesi i gesti non rilasciati.
3. Numerazione UI indicata da Ale, guardando la porta. Parità: 1 destra vicino, 2 destra fuori, 3 marcatore del centroboa al centro, 4 sinistra fuori, 5 sinistra vicino, 6 centroboa. Uomo in più 4-2: 1 esterno destro2m (spesso mancino), 2 fuori palo destro5m, 3 fuori palo sinistro5m, 4 esterno sinistro2m, 5 palo destro2m, 6 palo sinistro2m. Posizione distinta da #calotta. Conversioni soli UI negli indici interni1..6: parità[6,1,5,2,4,3], superiorità[5,1,4,2,3,6]. Nessun cambio a IA, coordinate, ID o salvataggi. Valori esistenti2.1m/5.2m conservati. «Uscita del5» della fonte diventa «Uscita del4» nella convenzione Ale. Aggiornati schemi.js, tattiche-menu.js, tattiche-pausa.js, uomo-editor.js, uomo-in-piu.js, menu.js, hud.js, index.html/stile.css. Pos.N fisso prima del nome in HUD, ellissi solo sul nome. I numeri seguono gli stessi giocatori nelle rotazioni.
4. Versione package*.json0.50.0. Nuovi script/step CI nuoto-coerente, gioco-fermo, posizioni; aggiornate aspettative per i nuovi nomi e l'annullamento del gesto. CLAUDE.md e docs/verifiche/verifiche-v050.md riportano lo stato sospeso e il checkpoint di passaggio; vanno consolidati prima di PR.

### Risultati REALI già ottenuti

- Lint e build PASS, ultimo lint della pipeline e test Node posizioni PASS.
- Nuoto dinamico: tests/nuoto-coerente-v050.mjs,96casi a30/60/120Hz, D/S, due lati, ossa vere GLB vs velocità. Prima100campioni con corpo inverso su4366, max.133333s, SOLO colonnello offerto in allontanamento. Dopo0/4286; palla dietro durante crawl0/1996. Non riprodotto un nuoto inverso persistente ordinario. Non vendere questo test come copertura di tutto ciò che Ale ha visto. Dati docs/verifiche/misure-nuoto-v050.json con hash file e provenienza.
- Vecchio npm run nuoto PASS: frenata0.19178m/.33333s; giro90° .21667s; ricezione→movimento .05s; stamina/GK invariati. Log /tmp/v050-nuoto-regressioni.log, dati /tmp/v050-nuoto-regressioni.json.
- Test stop tramite RAF reale PASS. Prima al fallo velocità max1.4→.210132m/s dopo.3s, oriz resta1, fase aumenta1.299112; dopo velocità subito0 e oriz0 entro.3s, fase invariata. Asse testa/bacino verticale reale .698→.982. PASS anche annullamento senza callback, countdown/rigore, espulsione viva, comparsa in movimento e fase attiva, follow-through gol, replay congelato. docs/verifiche/misure-stop-v050.json. Comando node tests/gioco-fermo-v050.mjs (senza --dist include test fase della comparsa reale).
- npm run aspetto -- --no-build COMPLETO PASS, log /tmp/v050-aspetto.log. iPhone56calls/141794tri su entrambe le viste. Primi piani desktop154–155mila sono fuori dal budget specifico iPhone. Recuperare dal log i conteggi completi gambe (ultimo blocco0/1378).
- Misura fluidità con due cambi PASS su844×390 e667×375,DPR1.5: picco61calls/147940tri. Log /tmp/v050-fluidita.log. Non è FPS su iPhone fisico.
- npm run verifica -- --partite=0 FALLISCE sui riferimenti screenshot: menu e sprint entro tolleranza .01%; azione55.09%, iPhone piccolo5.02%, orizzontale4.90%. Nessun riferimento ancora sostituito. Visti confronto3-azione e attuale4-iphone: cambiano fase/posizioni dopo la diversa inizializzazione e logica, non solo testo. Controllare visivamente anche5 e motivare i riferimenti da aggiornare, senza allargare tolleranze. Non chiamare questa verifica PASS. Sei partite NON eseguite sul v0.50: usarle una sola volta nella CI finale.
- Replay: processo INTERROTTO durante npm run replay -- --no-build. Log /tmp/v050-replay.log contiene PASS parziali per gol, firme, ripristino, memoria e GPU49/146360, ma non è PASS completo. Gesti, sezione4, strategie e uomo erano in coda e NON sono stati avviati dalla pipeline. /tmp/v050-esiti.json riporta solo comandi conclusi.

### Materiale da vedere e riprodurre

- docs/filmati/v050-nuoto-e-fischio.mp4:8sec,30fps di ACQUISIZIONE, confronto sopra v0.49/sotto v0.50, stessa sequenza controllata in movimento e camera del gioco: avanti/curva/inversione/ripartenza/colonnello forzato contro il moto/fischio. Non è una gara con IA, non misura FPS e non prova una naturalezza professionale. Script --filmato=/tmp/cartella nel nuovo test nuoto.
- docs/immagini/v050-nuoto-e-fischio.jpg: tavola già ispezionata. Il dopo-fischio è visibilmente verticale; il prima continua il crawl.
- Screenshot verifiche in tests/screenshot/attuale e confronto; riferimenti ancora v0.49. La patch contiene i nuovi file e le modifiche, non i file ignorati; il pacchetto conserva anche i log principali.

### Richieste di design recenti da preservare

Visto trailer ufficiale Splash Land (App Store id6828066734,29.77sec), non una partita integrale. Fonti e limiti in docs/verifiche/verifiche-v050.md. Ale lo trova troppo veloce, pieno di dettagli, carriera/testi/indicatori e interfaccia confusa su telefono. NON copiarne la carriera rookie, UI o aumentare ritmo. Una decisione principale per schermata; in acqua leggibilità di palla/portatore/porta, calotte, distanze e camera. Informazioni dettagliate accessibili in preparazione/pausa; telecronaca breve. Anche il replay deve essere comprensibile. Lo screenshot di un competitor non autorizza nuove meccaniche o una riscrittura della UI fuori scopo.

### Chiusura necessaria prima della PR

Prima rivaluta il codice locale: la limitazione angolare e il fermo devono risultare credibili anche in azione, non soltanto nei test. Non sono stati riscritti circolazione, contatti/pressing, scivolamento laterale o locomozione completa: sono lavoro ancora aperto e prioritario per Ale, da rendere verificabile con sequenze vere.

Completa regressioni realmente mancanti (replay, gesti, sezione4 per schizzo/colonnello, strategie/UI e uomo-in-più; CI completa incl sezione2), rivedi5screenshot e aggiorna SOLO i riferimenti giustificati. Esegui lint/verifica/aspetto sul codice finale e scrivi risultati veritieri in PR. Per immagini usare --partite=0; le6partite complete una volta in CI. Aggiorna CLAUDE.md/rapporto con versione, file, numeri REALI, decisioni superate e non fatto. Commit/push, CI INTERA verde sull'ultimo SHA, poi PR v0.50; non merge/deploy. Se cambi ancora produzione, rinnova hash/provenienza delle misure pertinenti.

Vincoli fissi: iPhone SEMPRE<100calls e<150000tri, anche2cambi, senza deroga;14corpi completi;cartoon;camera unica in diretta;SPEED1;tap sprint;caricaMAX.9s e tiro alrilascio;riflesso soloalta;logoC;CAMBI basso centro44px;replay7s skippable. Browser già installato: PLAYWRIGHT_BROWSERS_PATH=/tmp/pallanuoto-browsers. Un Chromium alla volta: softwareGPU rende molto lenta l'acquisizione. Rete locale richiede permesso del tool. gh CLI era401; connector GitHub legge/scrive, non chiedere token senza verificare le alternative.
