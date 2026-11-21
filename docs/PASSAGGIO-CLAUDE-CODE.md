# Passaggio WATERPOLO 7 — v0.69: correzioni e prove mirate concluse

Repository `alessandrofarre1-wq/pallanuoto-3d`, branch `codex/v069-falli-riprese`, versione0.69.0, base main `e4e0787` (PR59 già unita da Ale). Prima di modifiche/test onerosi riallinea main, PR recenti, CI e diff: Claude e Codex lavorano sullo stesso progetto. Nessun merge/deploy fatto da Codex.

Leggi [CLAUDE.md](../CLAUDE.md), [rapporto v0.69](versioni/v069-falli-e-riprese.md), [prove/hash](verifiche/v069/chiusura.json) e [campione finale](verifiche/v069/bilancio-finale.json). L'archivio sotto non è un punto di ripartenza. La CI intera sull'ultimo commit pubblicato resta da verificare prima di dichiarare la PR pronta.

## Concluso v0.69

- Espulsione residua nel pozzetto attraverso intervallo/scatto, sei allo scatto; cronometri e residuo dal primo tocco, rientro legale su riconquista o scadenza. Terzo fallo gestito con sostituto al rientro.
- Tolta sanzione casuale dal passaggio che batte l'anticipo. Rigore solo per infrazione/contatto/possesso/occasione credibile entro6m. Ostacolo da dietro durante tiro: attesa dell'esito, senza cancellazione alla sirena.
- Boa CPU già fronteporta conclude in parità, con linea realmente libera. Guardia `!manUp` conserva il sistema di superiorità. Nessun tiro o gol garantito.
- Sul fallo ordinario fermi solo autore/vittima; compagni/avversari continuano e le marcature leggono posizioni aggiornate. Fallo in attacco cambia subito possesso e rientro. Arresti generali restano per pause regolamentari.

## Esiti reali e limiti

Mirate6/6 e3/3 PASS. Primo giro regressioni12PASS/2FAIL: tattica corretta con `!manUp`; replay ripetuto senza sorgente modificato durante la prova, nessun fix replay. Ripetizione lint/tattica/replay3/3; dopo aggiornamento marcature lint/tattica/gioco-fermo3/3 PASS. Ultimo allineamento di `falloSenzaPalla`: possesso immediato e fermo selettivo, lint/gioco-fermo2/2 PASS con nuovo caso reale. Le misure generali seguenti precedono quest’ultimo percorso, con geometria invariata. Aspetto completo PASS: gambe0/8286,0/4686,0/1112; iPhone55calls/142100tri, due cambi picco61/145944 nelle scene campionate. Replay48/146426,14corpi nella ripetizione precedente al ritocco alle marcature. Nessuna nuova geometria. Non sono FPS di iPhone fisico.

`npm run verifica -- --partite=0` PASS, cinque confronti ispezionati, scarto≤0,02%, nessun riferimento sostituito. Le sei partite della verifica e tutti i passi della CI sono da eseguire sul commit pubblicato, senza duplicare un altro campione locale.

Campione8gare ITA–HUN480s prima dell’ultimo allineamento di `falloSenzaPalla` (non sul codice finale):15,125gol/40,75tiri, rigori1,4375, espulsioni8,4375, superiorità37,04%, azioni69,25, parità14,09s, soltanto6/15voci in fascia (v0.68:13/15). NON presentare il bilanciamento globale come concluso. Nessun ritocco a potenza/precisione o probabilità globali per compensare. Campioni precedenti/interrotti non sono questi dati.

## Lavoro successivo già autorizzato: v0.70

Worktree separato `/workspace/pallanuoto-v070`, branch `codex/v070-chiamate-gesti`, nato dal checkpoint locale v0.69 `6d7b563`; prima di pubblicare va riallineato al commit finale v0.69. Preservare il diff locale. **Non aggiungere `node_modules`: nel worktree è un collegamento simbolico non tracciato.**

Implementati localmente ma ancora da verificare nel browser: chiamate A/B/C durante l'azione con scelte touch dopo5,5s se boa non servibile, assistenza al servizio della boa realmente libera, raccordi visuali tiro/passaggio. Separati dalla PR regolamentare v0.69. I nuovi comandi touch per beduina/sciarpa/finte speciali sono ancora idee da discutere con Ale; non aggiungere pulsanti fingendo che siano già concordati. Restano prove reali, ispezione sequenze, regressioni/aspetto/verifica e CI, documentazione/versione e PR v0.70.

Limiti sempre<100calls/<150000tri anche due cambi/replay,14corpi completi; nessuna deroga. LogoC, camera/velocità uniche, sprint/controlli/carica attuali e CAMBI basso centro44px conservati. Una sola istanza Chromium pesante, `PLAYWRIGHT_BROWSERS_PATH=/tmp/pallanuoto-browsers`; niente prove espressioni facciali senza richiesta. Prova iPhone fisico e giudizio artistico di Ale ancora necessari.

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
