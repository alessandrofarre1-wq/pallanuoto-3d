# Verifiche v0.45

Base integrata: main `1b0946a` (v0.44, PR #40 di Claude Code). Confronto iniziale del nuoto: `38b31e8` (v0.43). Le modifiche rispondono ai sette punti di Ale; il logo C «Flusso» è stato scelto da Ale durante la chiusura e applicato nel gioco. Nessun merge/deploy effettuato in questa sessione.

## Cosa verificare

| Richiesta | Implementazione e prova |
| --- | --- |
| Nuoto preciso e ripartenza dopo ricezione | `fisica.js`, `partita.js`, `grafica/pose.js`; `npm run nuoto` confronta la stessa scena con v0.43, due versi/due mani, stop, 90°/180°, ricezione e gesti residui, analogico, carica/pressione/contatti, stamina/GK, 30/60/120Hz. |
| Proposte logo | Tre SVG originali e confronto interattivo `docs/proposte/loghi-v044.html`, tavola `docs/immagini/v044-loghi-proposte.png`; A Segno7, B Campo, C Flusso. Dopo la tavola Ale ha scelto C: `src/logo.js`, `src/immagini/logo-flusso.svg`, `icona-flusso.svg` e favicon in `index.html`. |
| Testi iniziali e schemi | Home, comandi touch/desktop distinti, nove carte con ruolo, vantaggio, rischio e uscita; `npm run home`. |
| Costumi nazionali | Atlante locale768² delle24bandiere, shader unico sul tessuto, cuffie bianche/blu e portieri rossi; `npm run costumi`, inclusi sostituti e pozzetto. Nessuna nuova geometria. |
| Nazionali per competizione | Mondiali24selezionabili/16estratte, scelta sempre inclusa; Europei16nazionali della competizione europea. `npm run tornei` e `tornei-menu`, vecchi salvataggi v1 preservati. |
| Desktop dal riferimento | Frecce, Spazio finta tenuta/tiro al rilascio, D passa al rilascio/contrasto alla pressione, C selezione difensiva, Q/W/E schemi,4boa,F comando. Shift a tocchi e K/L compatibili; `npm run desktop`, con pause/blur/editor/illegalità. |
| Atleta centrato in verticale | Home393×852,852×393,667×320/300 e11combinazioni di margini sicuri. Foto `docs/immagini/v044-home-*`. |

## Risultati mirati

- Lint e build PASS (0 errori/0 warning).
- Nuoto PRIMA e DOPO PASS, con dati e provenienza in `docs/misure-nuoto-v045.json`. Arresto1,174→0,192m, tempo2,017→0,333s; cambio90° all'80%1,333→0,217s, deriva1,271→0,215m; ripartenza con palla contro direzione0,40→0,05s. Velocità massime, curve di stamina e risposta del portiere conservate. Sono misure di scene controllate, non tempi fisiologici ricavati dai manuali né FPS Apple.
- Desktop PASS su eventi reali keydown/up: nessun passaggio alla pressione di D, finte durante Space tenuto, tiro al rilascio senza autotiro, annullamento su pausa/blur/cambio possesso/focus, conservazione touch e sprint a tocchi.
- Home PASS: quattro taglie,11insets, copy24, input testuali liberi, nove carte/SVG e Riprendi visibile; tre immagini reali visionate.
- Tornei PASS:17gruppi,288sorteggi e80campagne; integrazione UI selezione FRA/MLT, reload, torneo16, Euro senza nazionali extraeuropee, slot indipendenti e bacheca.
- Gameplay v0.40 PASS con assert conservati e passaggi provati via touch: appoggio apre in0,917s, spostamento1,154m e distanza compagni2,929m; reazione AI al vantaggio0,017s.

## Integrazione con Claude Code e regressioni

La PR #40 di Claude è già su main: schemi dell’uomo in più a fasi, editor e priorità HUD sono conservati. La v0.45 aggiunge i sette interventi del checkpoint senza rifare la v0.44. I successivi commit Claude `4138b52`/`33dd479` contengono solo proposte in `docs/proposte/manuali-e-studi.md` sul suo branch, non modifiche produttive da duplicare.

La pausa 6c5 usa ora i nomi dei tre schemi scelti, la fase e i sei posti effettivi, compresi i pali variabili. I click chiamano lo schema o la base senza sostituire il piano prepartita; in parità restano le nove carte. `npm run uomo -- --no-build` PASS, inclusi selezione/base, sei posti, fase e pali, editor e reload. La prova non disegna ogni frame 3D durante i cicli di simulazione quando non si chiedono foto, e la pagina dell’editor congela il RAF di sfondo: assert conservati, foto ancora disponibili con `--foto`. Spiegazioni della scheda superiorità dell’editor riferite ai soli posti base.

`sezione1` prima dava selezione5/6: la quarta prova partiva in stop dopo un fallo. La fixture garantisce play/no rigore e congela contrasti/decisioni, esclude chi esce e misura al primo fotogramma. Assert6/6 conservato, PASS al checkpoint; ripetuto in CI.

`sezione2`: l’inerzia precedente nascondeva un vero difetto di protezione da fermo. Il blend normalizzato fra due vettori opposti non faceva ruotare il portatore. Una sola rotazione angolare in `fisica.js` sostituisce il blocco finale di `partita.js`. La fixture tiene fermo il portatore e usa il suo vero marcatore (`MARK[2]=3`), senza indebolire gli assert. Dopo integrazione PASS: protezione, pressione17/30 e0falli/30.

Fixture migrate ai nuovi comandi anche in regia, sequenze e simulatore casuale; il confronto del buffer resta touch. Le differenze delle partite casuali dipendono anche dai tasti del simulatore, non soltanto dalla fisica.

## Grafica e budget iPhone

`npm run aspetto -- --no-build` PASS dopo integrazione: partita finita, gambe fuori acqua0/4582 verticali,0/7638 nuoto,0/1290 transizione. Schermate iPhone:62chiamate/142316tri (844×390),59/141616 (667×375). I primi piani diagnostici desktop arrivano a153306tri; non sono la visuale iPhone di gioco.

`strumenti/misura-fluidita.mjs` PASS, seed33, DPR1,50, azione e due cambi simultanei:844×390 max64chiamate/146228tri,667×375 max63/146216. Dati completi in `docs/misure-fluidita-v045.json`. Nessuna riduzione dei14corpi in campo, nessuna deroga.

Il logo C è una modifica DOM/SVG: non cambia geometria, simulazione o misura dell’immersione. Home, pausa e fine usano copie con ID distinti; favicon coerente. Immagini della home aggiornate dopo la scelta di Ale. I nomi storici v044 dei file di test/proposte rimangono; la versione del gioco è0.45.

## Correzione del banner trovata in CI

Il run `43746814493` ha superato sei gare e tutti i controlli fino ad aspetto, ma è FALLITO in `cronaca`, scenario5: GOL copriva porta2. In `src/cronaca.js` il ritardo di riposizionamento0,8s ignorava il movimento della telecamera; la ricerca si interrompeva anche con una porta coperta, senza tentare il formato compatto. Ora il ritardo resta solo se non copre palla/controllato/porta, la ricerca tenta entrambi i formati fino a peso0 e ripristina posizione e formato del candidato migliore. Nessun assert ridotto e nessuna modifica alla simulazione o alla geometria. Cronaca completa locale PASS, incluso scenario5; lint/build PASS (70 moduli) e `npm run verifica -- --partite=0` PASS: quattro immagini identiche e una differenza entro tolleranza (0,00% arrotondato). La descrizione della PR riporta il run definitivo, da controllare integralmente sul nuovo SHA.

## Verifica completa e CI

Prima dell’apertura della PR: `npm run lint`, `npm run verifica` e `npm run aspetto`. Le sei partite complete di `verifica` sono affidate alla CI del branch; per ispezionare/aggiornare/confrontare le immagini in locale si usa `--partite=0`, evitando simulazioni duplicate. La descrizione della PR riporta l’esito effettivo del run sullo SHA finale e il link a tutti i passi (compreso `sezione4`). Gli screenshot in CI sono non bloccanti per le differenze dei font dei computer; il confronto locale deve passare dopo controllo visivo. Il primo confronto dopo integrazione dava16,07/12,78/61,56/36,49/34,32% sui vecchi riferimenti. Tutte e cinque le immagini sono state ispezionate: nuovo logo/copy in home, nuove posizioni e sviluppi dell’azione dopo il nuoto rapido, cuffie bianche/blu e costumi nazionali. Riferimenti aggiornati soltanto dopo quel controllo, poi confronto con `--partite=0`. Non riusare la CI fallita del checkpoint1e14c40, né dichiarare verde una pipeline ancora avviata.

## Limiti espliciti

Prova su iPhone fisico necessaria per giudicare precisione percepita/FPS/temperatura; nessuna promessa60FPS. Logo C scelto e applicato. Restano i limiti preesistenti di slot personale, arbitraggio semplificato e salvataggio fra gare. Il modello originale e i14corpi in campo restano interi; i costumi non giustificano deroghe a<100chiamate/<150000tri anche durante due cambi.
