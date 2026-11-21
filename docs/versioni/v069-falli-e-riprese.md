# v0.69 — espulsioni tra i tempi, rigori e continuità sui falli

Base main e4e0787 (PR59 v0.68 unita). Richiesta di Ale del21/11: espulsione cancellata al cambio tempo, rigori apparentemente ingiustificati, boa già fronteporta che scarica, tutti immobili al fallo. Stato: implementazione e prove mirate concluse; bilancio, regressioni e verifiche generali in corso. Non ancora pronta al merge.

- L'espulso conserva sanzione e identità nel pozzetto durante l'intervallo e lo scatto. Partecipano sei giocatori; se i suoi conquistano palla può rientrare, altrimenti resta fuori per il residuo. Terzo fallo: sostituto solo al rientro consentito. Cronometro e sanzione partono al primo tocco, non durante lo scatto.
- Il passaggio riuscito alla boa non è un fallo: tolto il sorteggio45%rigore/35%espulsione all'anticipo battuto. I contrasti reali usano un criterio comune: area6m, contatto, possesso, occasione di gol credibile, orientamento e difensori sul corridoio. I5m sono il punto del tiro di rigore, non il limite dell'area.
- Se un intervento da dietro disturba un tiro già iniziato, si lascia finire il tiro: gol→niente rigore; esito senza gol→un solo rigore. La scadenza del periodo non cancella la sanzione pendente e lascia finire il tiro partito in tempo.
- Boa CPU già fronteporta e linea libera: conclude dopo la presa senza attendere il flag della girata o scegliere uno scarico casuale. Il difensore può intervenire realmente; portiere e tiro restano fallibili. Comandi umani liberi.
- Fallo ordinario: si arrestano autore e vittima, gli altri continuano movimento/tagli e controllo umano. Cronometri fermi. Fallo in attacco: possesso assegnato subito alla difesa e gli altri iniziano il rientro. Gol, rigori, intervalli e time-out mantengono l'arresto generale. Collisioni non spostano i due giocatori fermi.

File: regole.js, partita.js, gioco-fermo.js, fisica.js(separate), grafica/pose.js, centroboa.js, lotta.js, ia.js; nuovi decisione-rigore.js ed espulsioni-tempi.js; test dedicati e gioco-fermo aggiornato; versione/package e CI.

Prime prove:6/6 PASS (lint,12scatti reali,40condizioni di rigore,API/tiro fisico/controllore rigori,4boa fronte+8negativi,stopselettivo). Dopo la guardia fine-periodo:3/3 PASS (lint,rigori reali con2casi a0s del quarto periodo,gioco-fermo con rientro su sfondamento). Nessuna soglia abbassata; il vecchio test che imponeva14fermi sul fallo è superato dalla nuova richiesta, mentre arresti generali/replay/comparse restano verificati.

Fonti: World Aquatics Competition Regulations18/02/2026, PartSix2.3.8.1,4.2.1,10.4.3,10.5.2,11.1.1.1,11.1.1.4. PDF ufficiale già usato nel progetto, verificato nell'estratto locale. FIN successivo non importato.

Decisioni superate esplicitamente: annullare espulsioni al kickoff; consumare tempo nello scatto; sanzionare il semplice anticipo battuto; riconoscere fronteporta solo da turnedUntil; congelare tutti su un fallo ordinario(v0.50). Nessun cambiamento a geometria, potenza o precisione per ridurre artificialmente i rigori.

Lavoro successivo distinto(v0.70): chiamate touch delle nuove entrate in azione, assistenza del PASSA alla boa libera, raccordi visuali tiro/passaggio. Idee gesti touch richieste da Ale: due opzioni contestuali al massimo, non combinazioni simultanee. Non incluse nelle correzioni regolamentari di questa PR. Restano prova su iPhone fisico e giudizio di naturalezza/resa di Ale. Nessun merge o deploy.
