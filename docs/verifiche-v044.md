# Verifiche v0.44

Base: main38b31e8 (v0.43). Le modifiche rispondono ai sette punti di Ale; il logo resta una proposta da scegliere, gli altri interventi sono nel gioco. Nessun merge/deploy effettuato in questa sessione.

## Cosa verificare

| Richiesta | Implementazione e prova |
| --- | --- |
| Nuoto preciso e ripartenza dopo ricezione | `fisica.js`, `partita.js`, `grafica/pose.js`; `npm run nuoto` confronta la stessa scena con v0.43, due versi/due mani, stop, 90°/180°, ricezione e gesti residui, analogico, carica/pressione/contatti, stamina/GK, 30/60/120Hz. |
| Proposte logo | Tre SVG originali e confronto interattivo `docs/proposte/loghi-v044.html`, tavola `docs/immagini/v044-loghi-proposte.png`; A Segno7 consigliato, B Campo, C Flusso. Nessuna scelta imposta nel prodotto. |
| Testi iniziali e schemi | Home, comandi touch/desktop distinti, nove carte con ruolo, vantaggio, rischio e uscita; `npm run home`. |
| Costumi nazionali | Atlante locale768² delle24bandiere, shader unico sul tessuto, cuffie bianche/blu e portieri rossi; `npm run costumi`, inclusi sostituti e pozzetto. Nessuna nuova geometria. |
| Nazionali per competizione | Mondiali24selezionabili/16estratte, scelta sempre inclusa; Europei16nazionali della competizione europea. `npm run tornei` e `tornei-menu`, vecchi salvataggi v1 preservati. |
| Desktop dal riferimento | Frecce, Spazio finta tenuta/tiro al rilascio, D passa al rilascio/contrasto alla pressione, C selezione difensiva, Q/W/E schemi,4boa,F comando. Shift a tocchi e K/L compatibili; `npm run desktop`, con pause/blur/editor/illegalità. |
| Atleta centrato in verticale | Home393×852,852×393,667×320/300 e11combinazioni di margini sicuri. Foto `docs/immagini/v044-home-*`. |

## Risultati mirati

- Lint e build iniziali PASS (0 errori/0 warning,67moduli).
- Nuoto PRIMA e DOPO PASS, con dati e provenienza in `docs/misure-nuoto-v044.json`. Arresto1,174→0,192m, tempo2,017→0,333s; cambio90° all'80%1,333→0,217s, deriva1,271→0,215m; ripartenza con palla contro direzione0,40→0,05s. Velocità massime, curve di stamina e risposta del portiere conservate. Sono misure di scene controllate, non tempi fisiologici ricavati dai manuali né FPS Apple.
- Desktop PASS su eventi reali keydown/up: nessun passaggio alla pressione di D, finte durante Space tenuto, tiro al rilascio senza autotiro, annullamento su pausa/blur/cambio possesso/focus, conservazione touch e sprint a tocchi.
- Home PASS: quattro taglie,11insets, copy24, input testuali liberi, nove carte/SVG e Riprendi visibile; tre immagini reali visionate.
- Tornei PASS:17gruppi,288sorteggi e80campagne; integrazione UI selezione FRA/MLT, reload, torneo16, Euro senza nazionali extraeuropee, slot indipendenti e bacheca.
- Gameplay v0.40 PASS con assert conservati e passaggi provati via touch: appoggio apre in0,917s, spostamento1,154m e distanza compagni2,929m; reazione AI al vantaggio0,017s.

## Controlli completi e stato della consegna

`npm run verifica` e `npm run aspetto -- --no-build` sono in esecuzione al checkpoint. Non sono ancora dichiarati PASS complessivi. Aspetto ha già concluso la partita e misurato gambe sopra acqua0/4554 verticali,0/7649 nuoto,0/1377 transizione; restano le immagini/costi finali. Aggiornare questa sezione prima della PR pronta.

La prima regressione di `sezione1` dava selezione5/6: la diagnosi ha mostrato che la quarta prova partiva in `stop` dopo un fallo casuale, quindi C era correttamente ignorato. La fixture ora garantisce gioco attivo senza rigore e congela contrasti/decisioni per isolare il cambio; esclude chi sta uscendo, come il motore, e misura subito il fotogramma della pressione. Conservato l'assert6/6. Rerun completo delle sezioni in corso; nessuna soglia allargata.

Fixture migrate ai nuovi comandi anche in regia, sequenze e simulatore casuale; il confronto prima/dopo del buffer resta sul controllo touch. Non attribuire le differenze di partite casuali soltanto alla fisica: è cambiata anche la tastiera usata dal simulatore.

## Limiti espliciti

Restano da completare CI sull'ultimo SHA e risultati completi sopra. Prova su iPhone fisico necessaria per giudicare precisione percepita/FPS/temperatura; nessuna promessa60FPS. Nuovo logo da scegliere. Restano i limiti preesistenti di slot personale, arbitraggio semplificato e salvataggio fra gare. Il modello originale e i14corpi in campo restano interi; i costumi non giustificano deroghe a<100chiamate/<150000tri anche durante due cambi.
