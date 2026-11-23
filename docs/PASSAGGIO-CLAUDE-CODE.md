# Passaggio WATERPOLO7 — v0.75 tiro continuo, scatto e boa

Base main1ec69ca(PR65 unita, CI45058084563 verde), ramo `codex/v075-tiro-fintee-anello`, worktree `/workspace/pallanuoto-v075`, versione0.75.0. Prima di altro lavoro riallineare main/PR/CI e diff; preservare tutto. Non fare merge/deploy. La PR riporta lo SHA e l’esito finale; non riaprire il vecchio lavoro v068–v074.

TIRO tocco/rilascio=polso; tenuta=preparazione e finte continue, massimo0,9s e tiro al rilascio anche dalla propria finta. Un solo contesto per touch/tastiera/controller e annullamenti robusti; anello oro/PRONTO senza barra di potenza. Controfuga speciale e rigori conservati. Alla boa gesto secondo assetto, anche su ricezione; TAGLIO tolto dal touch, chiamate A/B/C conservate. Scatto: più veloce disponibile al centro della porta; GK laterale prima del via e rientro nuotato. Nessun bonus o teletrasporto dopo il via; controllo umano prioritario. Rubata da slancio: corretto il bersaglio vecchio che causava subito sfondamento, senza immunità ai falli.

**Nuoto e modello invariati**: la foto a L segnalata da Ale era un errore del test (60passi fisici e un solo aggiornamento del rig). Corretto il test e rifatte le foto; non alterare il crawl per replicare quella cattura sbagliata. GLB SHA2568fd658a8… invariato; clip Plask completa415pose/52ossa, volto/rig/pesi conservati. Nessuna nuova prova facciale.

PrimaCI45069119661 sullo SHA b5aae8d:6partite PASS, poi arresto sul vecchio assert del controllato al kickoff in entrate-integrazione. Corretto soltanto il test, regressione locale PASS; runtime invariato. Nuova CI completa necessaria per terminare i passi saltati; l’idea di un solo giro standard è superata da questo arresto. Esito finale nella PR.

SecondaCI45070404033: integrazionePASS,6gare identiche108gol/257tiri; poi errore del foglio inferiorità (ctrl3 residuo anche in autoplay annullava la carica). Corretta solo fixture con selezionato nullo e precondizione carica effettiva. Runtime invariato; coda9passi locale prima della CI finale per evitare altri controlli saltati. La PR riporta la CI finale, le due precedenti non sono verdi.

Coda locale8/9PASS: Pausa nel test cronaca era visibile, ma locator.tap attendeva la stabilità sul RAF finto. Corretto solo test con visibilità/hit espliciti e tocco touchscreen reale; bloccoA ripristinato, nessun force/clickJS. Riprova completa cronaca PASS; con gli8PASS precedenti, tutti9i controlli della coda sono verificati. Lint/diff-check PASS, runtime sempre invariato. CI completa finale nelle verifiche/PR.

Leggere [CLAUDE.md](../CLAUDE.md), [rapporto](versioni/v075-tiro-scatto-boa.md), [verifiche](verifiche/v075/README.md) e [decisioni superate](decisioni-superate.md). Misure con fase esplicita: non attribuire il primo13/13 o le foto precedenti al codice finale. Sei partite soltanto nella CI; confronto locale0partite. Una sola Chromium pesante. Limiti iPhone<100call/<150000tri sempre,14corpi completi, logoC, camera/SPEED1, CAMBI centro basso44px, riflessoalta. Restano giudizio di Ale, iPhone fisico e bilanciamento generale già aperto. Nessun nuovo sviluppo artistico in questa consegna.

---

# Passaggio WATERPOLO7 — v0.74 tiro Plask, modello invariato

Base main `9e95c00` (PR64 unita, CI45014844635 verde), ramo `codex/v074-tiro-plask`, worktree `/workspace/pallanuoto-v074`. Versione0.74.0. Prima di altro lavoro riallineare main/PR/CI e diff; preservare Claude. Esito CI finale e SHA nella PR, nessun merge/deploy.

**Ultima istruzione di Ale:** il modello è già corretto e non va stravolto. Correggere la mano rovesciata applicando bene le pose; il viso si vedrà dopo. Questo supera il vecchio incarico di aggiungere ossa a viso/piedi. Non riaprire il prototipo facciale `/workspace/pallanuoto-v073`, non toccare mesh/rig/pesi/proporzioni. GLB runtime SHA256 `8fd658a8a89ad0dd242100133daf920eb6cfa492af8f39e95f6ff92124ba6745`, identico alla v0.73.

Il tiro fornito da Ale è trasferito su tutte le52ossa corrispondenti, incluse30falangi/caviglie/punte;415pose dall’inizio animato1/60s alla fine6,917s. Solo Tpose artificiale a0 esclusa; traslazione radice adattata alla vasca, nessun salto/spostamento sul campo. Controller solo visuale dopo `muoviCorpo` e mani. Calibrazione anatomica/rest, D/S senza scala negativa, tempi dei comandi conservati. Tiro standard caricato/torsione; gesti rapidi/speciali non convertiti. Tre ossa del braccio destro raccordate5,9–6,1s per perdita tracking fuori dal video; non inventare distacco o fattore slowmotion. OriginaleSHA41c8bebc… e videoSHAfc44fb47… nei dati generati. Originale integrale sul [ramo di consegna](https://github.com/alessandrofarre1-wq/pallanuoto-3d/tree/655a30fa6236de6edc78190134b6b2e812370b86/animazioni/tiro-plask-01); video locale, non pubblicato.

PrimaCI45053104867 sullo SHA02d0a0d:34comandiPASS,FAILgomito in carica(142,42°). Corretta soltanto l’ancora `loadEnd`5,8→5,9s della stessa clip; prova gestiPASS109,94°D/S, assert55–115°/polso/torsione conservati. Nessuna modifica al rig. Esiti finali nellaPR.

La mano alzata dell’esultanza usa ora il palmo trasversale davanti e polso quasi neutro. Test60campioni/due direzioni, foto confrontate; nessuna modifica al file della mano. Tutte le giunture/palla del motore conservate: confronto fisico4casiD/S×dueversi identico,rilascio175,031ms,errore0. Prove, foto e numeri finali con fase in [rapporto](versioni/v074-tiro-plask.md) e [verifiche](verifiche/v074/README.md). Non attribuire al finale i numeri dei prototipi parziali o quelli che usavano solo2,117s: superati.

Vincoli invariati: iPhone<100draw/<150000tri anche2cambi/replay,14corpi completi; logoC,cameraunica,SPEED1,controlli/carica0,9s/rilascio,riflessoalta,CAMBI basso centro44px. Non fare nuove partite di bilancio: modifica visuale verificata con tracce fisiche accoppiate. Sei partite standard una volta nellaCI completa finale; localeprove mirate/verifica immagini0partite/aspetto. Una solaChrome pesante. Nessuna nuova prova o modifica facciale. Restano giudizio di Ale sulla naturalezza, iPhone fisico e bilanciamento già aperto.

---

# Passaggio WATERPOLO 7 — v0.73 mani e polsi

Ramo `codex/v073-mani-polsi`, worktree `/workspace/pallanuoto-v073-mani`, base main `1452f1a` (PR #63 unita), versione 0.73.0. Prima di altri interventi controllare main, PR, CI e modifiche locali: preservare il lavoro di Claude Code.

Ale ha fermato il tentativo sul volto, poi ha chiesto di conservare mani, polsi e movimenti validi. Questo ramo integra soltanto mani/polsi: 30 falangi aggiunte alle 24 giunture originali. Il volto, le 18 morph e il controller delle espressioni sono quelli della v0.72. Le migliorie a nuoto e tiro già pubblicate restano. Il prototipo facciale locale `/workspace/pallanuoto-v073` è sospeso, non pronto e non fa parte della PR.

Leggere [CLAUDE.md](../CLAUDE.md), [rapporto v0.73](versioni/v073-mani-polsi.md) e [verifiche](verifiche/v073/README.md). Lo SHA e l'esito della CI finale si leggono nella PR. Nessun merge o deploy eseguito.

Rigenerazione: `node strumenti/rigenera-mani-v073.mjs`, con Blender 4.3.2, Python numpy/Pillow e dipendenze npm. Fonte MakeHuman CC0 inclusa e fissata a commit. GLB finale: 8366 triangoli, 8599 vertici, 54 joint. Le 24 rest/IBM e le 18 morph originali sono conservate. Dita solo visuali: `J` e `ballW` fisici invariati. Marker di presa 3 mm oltre il palmo; palla 22,12 cm. Il replay registra soltanto le rotazioni delle nuove falangi perché posizione, scala e visibilità locali sono costanti; il limite storico di 24 MiB è conservato.

Non attribuire al modello il nuovo volto o la qualità artistica del concept. Non fatto: rifacimento viso, clip Plask importate, revisione generale di movimenti/IA o bilanciamento, FPS su iPhone fisico. Sempre meno di 100 chiamate e 150.000 triangoli anche con due cambi e replay, 14 corpi completi. Camera unica, SPEED 1, controlli, logo C, riflesso solo in alta e CAMBI basso al centro restano.

---

# Passaggio WATERPOLO7 — v0.72

Branch `codex/v072-proporzioni-tiro-rimesse`, worktree `/workspace/pallanuoto-v072`, base main7827854(PR62unita), versione0.72.0. Prima di altro lavoro riallineare main/PR/CI e preservare le modifiche; non ripartire dai vecchi checkpoint. Nessun merge/deploy di questa versione.

Leggere [CLAUDE.md](../CLAUDE.md), [rapporto v0.72](versioni/v072-proporzioni-tiro-rimesse.md), [verifiche](verifiche/v072/README.md) e [decisioni superate](decisioni-superate.md).

Ale ha chiesto coerenza di **tutto**: non ingrandire la sola palla. Corpi VIS1,45→1,10 (base bind2,547→1,932m); campo25×20m, porta3×0,90m e palla22,12cm conservati. SagomaGK, punti di lancio, ombre/contatti acqua seguono l'atleta. Questo cambia necessariamente ballW assoluto: non dichiarare identità delle partite conVIS1,45. Test gesto prima/dopo usa scala1,10 in entrambe le fasi e isola solo pose/corpo:4casi, frusta175,031ms, erroreJ/ballW0, traccia identica. Il GLB ha già24joints pesati: niente conversioneFBX/Mixamo necessaria. Migliorato solo tiro classico, non tutti gli speciali.

RimessaGK laterale ora attacco18s, fondo corner18s; eccezione muro di movimento conservata (difesa28s).56voli reali con riprese da partita.update PASS. Non abbassare assert;5suiteNodekeeperPASS e limite mani7m/s conservato con scansione dei picchiIK affinata al lancio.

Gli esiti finali sono riportati nella PR e nel rapporto. Locale: lintPASS, primo prove49/53 con4passi poi corretti e ripetutiPASS, verifica bloccantePASS e aspetto completo in due metà sulla stessa buildPASS. Due cambi66/148150,14corpi; rigori190/240=79,17% dopo esclusione del solo preset automaticoquadrella sui rigori, stessa velocità/precisione/lettura. La CI INTERA dell’ultimo SHA nellaPR è la fonte finale; sei partite una sola volta lì. Il bilanciamento0.71 è solo baseline storica: dopo cambio scala non venderlo come nuova misura. Non eseguire altre8+8gare senza diagnosi/scopo; sei partite standard una volta nellaCI. Nuova foto annunciata non allegata nel messaggio attuale: datiGLB/articolo/riferimenti precedenti disponibili. Nessuna nuova prova facciale. Una solaChrome pesante, browser `/tmp/pallanuoto-browsers`; localhost richiede permesso rete dello strumento.

Restano iPhone fisico/FPS e giudizio di Ale, bilanciamento generale già aperto e nuovi comandi touch speciali ancora da concordare.14corpi completi, sempre<100draw/<150000tri su iPhone anche2cambi/replay; logoC, camera unica/SPEED1, controlli e maxcarica0,9s, riflesso soloalta, CAMBI basso centro44px. Non aggiungere `node_modules`.

Nuovo incarico successivo autorizzato: **prima consegnare questa PR**, poi esportare un GLB con rig più completo/dita e giunture per Plask da video. Asset separato, non sostituire automaticamente quello iPhone. Verificare skin/pesi reali e requisiti del retargeting.

---

# Passaggio WATERPOLO 7 — v0.71: portiere, tiri e stamina

Repository `alessandrofarre1-wq/pallanuoto-3d`, branch `codex/v071-portiere-palla`, worktree `/workspace/pallanuoto-v071`, versione0.71.0, base main `dbf20b61024ca9609e6715abd1aa6e7a59899590` (PR60/61 unite). Le verifiche locali sono chiuse; CI completa e SHA definitivo si leggono nella PR associata al ramo. Nessun merge/deploy eseguito. Prima di altro lavoro riallineare main, PR, CI e diff: preservare Claude e Codex, non riaprire gli archivi sotto.

Leggere [CLAUDE.md](../CLAUDE.md), [rapporto](versioni/v071-portiere-tiri-stamina.md), [dati e fonte](verifiche/v071/provenienza.json), [decisioni cambiate](decisioni-superate.md). Tutto il codice di questa versione deve stare su questo ramo; i vecchi checkpoint non sono la base.

## Cosa contiene

- Contatto continuo della palla con26sfere di torso/testa/braccia/mani del portiere, posa condivisa e reazione/portata limitate. Il sorteggio decide una lettura, non una parata. Corpo e braccia seguono lo stesso bersaglio, anche quando è letto male; nessun tuffo laterale sempre sul vero crossZ. In arrivo anche un tiro deviato ha precedenza sul recupero della palla vagante; le respinte uscenti restano contendibili. Controllo umano preservato.
- Prese solo sulle mani, rare sui colpi ravvicinati; deviazioni oblique ancora verso porta e statistiche coerenti. Nessun obbligo di finta per segnare. Fattore rigori0,41→0,7: ora è la sola lettura corretta e può non bastare fisicamente.240rigori senza finta:188gol,78,3%,22,7±0,7m/s,170ms. Non toccati globalmente mira/potenza per nascondere problemi.
- Porta già3×0,90m; palla disegnata39→22,12cm come quella fisica, palmo e galleggiamento allineati. VIS1,45/BRV0,15/origine fisica di lancio conservati. Stamina compatta sempre,0%compreso, dettagli temporanei. Palomba tesa/CPU prima finta; forti alle quadrelle/spin da tiro; rimbalzo davantiGK e rumore sordo su urto vero.
- Replay adattato alla palla reale: fit prospettico più vicino solo se serve, almeno4pxCSS nei casi provati, primo piano≥2×, testa/mano/porta liberi; orbita/FOV/tempi invariati.18scene/558frame PASS, foto reali in `docs/immagini/v071/`.

## Esiti reali e limiti

Cinque suite Node PASS;51scene sweep30/60/120Hz/2versi; mani max6,8586m/s su50bersagli. Browser:14/14 traiettorie sulla sagoma primaGOL→respinte,24varchi ancoraGOL,4muri reali con seguito (striscio entra, pieno torna). I320tiri a22m/s imposti sono primo esito diagnostico, NONpercentuali di partita. Stamina60stati, palla4scene D/S e667/844 PASS. Traiettorie22scene/42voli Rapier: palomba8m1,396→1,021s/picco3,168→2,076m; bounce1,434m dietro→1,248m primaGK.

Lint PASS. `prove` primo48/51: replay,rigori,statistiche corretti e verificati successivamente con soglie conservate; per Precisione il tiro standard0,7 è distinto dalla nuova quadrella≥0,8, confronto casuale accoppiato e rapporto2,25. La CI INTERA definitiva resta la fonte per lo SHA pubblicato. Aspetto completo PASS: gambe0/7502,0/5300,0/1198; iPhone56/142102 e55/142100. Due cambi61/145944; replay48/146426,14corpi. Cinque confronti immagini ispezionati, riferimenti2–5aggiornati con SHA, menu lasciato entro tolleranza; verifica bloccante indipendente PASS(menu0,01%,3identici,orizzontale0,00%entro tolleranza). Sei partite standard una sola volta nella CI finale. Foglio tiro opzionale interrotto per rendering software superfluo; sei foto replay reali già ispezionate.

**Bilanciamento non risolto:** finale8gare ITA–HUN480s/stessi semi,17,375gol/43,25tiri per squadra,40,17%conversione,32,09%superiorità; Italia10,625–Ungheria24,125,4/15voci in fascia. Baseline8gare0.70:16,125gol/41,375tiri,38,97%/40,32%,11,75–20,50,5/15voci. Divario cresciuto e superiorità ancora bassa. Il precedente candidato15,375gol/23,13% non è il finale: archivi e fasi distinti. Prima di ulteriore taratura leggere i dati e diagnosticare la scelta dei tiri/spazi, non nerfare precisione/potenza globale e non abbassare assert. Non è un campione contro un utente umano o tutte le nazionali.

Non fatto: iPhone fisico/FPS reali, giudizio di Ale sulla naturalezza professionale, riequilibrio generale, nuovi comandi touch speciali ancora proposta0.70. Non ampliare lo scopo da soli. Vincoli sempre<100calls/<150000tri su iPhone anche2cambi/replay,14corpi interi, logoC, camera unica diretta/SPEED1, controlli/carica0,9s correnti, riflesso soloalta, CAMBI basso centro44px. Nessuna nuova prova facciale. Browser `/tmp/pallanuoto-browsers`, una sola istanza pesante; rete localhost/git richiede il permesso dello strumento. Non aggiungere il symlink `node_modules`.


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
