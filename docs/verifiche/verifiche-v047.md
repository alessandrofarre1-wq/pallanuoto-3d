# v0.47 — replay dei gol e azioni firma

Base: `60dcc44`, main dopo le PR #41 (Codex v0.45) e #42 (Claude v0.46). Il nuovo nuoto e le regole/IA di Claude sono conservati. Branch: `codex/v047-replay-azioni-firma`.

## Comportamento

Dopo un gol: 0,6 s in diretta, 2 s di replay, 1,2 s di ripresa dal centro. Totale **3,8 s**, uguale all'attesa precedente. Il filmato usa circa 1,8 s della sequenza realmente disegnata, fino a 0,3 s dopo il gol, con rallentamento finale. Ricezione, alzata, lancio, palla e schiuma appartengono alla stessa azione. Non vengono ricalcolate fisica o pose per fabbricare un gol.

La ripresa automatica a tre quarti comprende tiratore, porta e giocatori vicini. Nasconde comandi e indicatori della diretta. Una sola fascia mostra nazionale, numero, nome e gesto. «Salta» termina il resto dell'attesa usando la callback originale, una volta sola; conserva gli 1,2 s della rimessa, cronometro, punteggio, recupero e cambi. Pausa, rotazione, scheda nascosta e nuova partita chiudono la presentazione. Senza filmato valido si prosegue in diretta. Gestito il risultato finale dopo gol sulla sirena; esclusa la serie di rigori di spareggio.

Beduina, schizzo, colonnello, sciarpa, rovesciata, rigore e tiro da fuori vengono riconosciuti dai dati salvati al rilascio, anche se il gesto è già finito o il marcatore è sostituito. Nessun bonus alle statistiche. Breve accento musicale WebAudio dopo il gol; nessun servizio esterno o voce.

## File

- `src/replay.js`: metadati immutabili del tiro/gol, tempi e salto.
- `src/grafica/replay.js`: archivio circolare delle trasformazioni, ossa, materiali, numeri sulle cuffie, palla, acqua e quattro buffer di effetti; camera e ripristino protetto da `finally`.
- `src/replay-regia.js`, `src/replay-ui.js`, `src/stile.css`: presentazione, focus, pausa, margini sicuri e pannello finale.
- `src/tiri.js`, `src/regole.js`, `src/menu.js`, `src/main.js`, `src/grafica/render.js`, `src/panchina.js`, `src/input.js`, `src/audio.js`: collegamenti al gioco. Una sola chiamata al renderer per fotogramma; nessuna nuova mesh.
- `tests/replay-v047.mjs`, `tests/replay-ui-v047.mjs`, `package.json`, `package-lock.json`, `.github/workflows/pages.yml`: versione, prove e due nuovi passi CI.
- `tests/screenshot/riferimento/*.png`: cinque riferimenti ispezionati; differenze di caratteri e scritta v0.47, posizioni della simulazione conservate. Nessuna soglia allentata.

## Misure locali

Playwright/Chromium con SwiftShader nel workspace Linux, non un iPhone fisico. Numeri grezzi e provenienza in `misure-replay-v047.json`.

| Prova | Risultato |
| --- | --- |
| Gol fisico dopo nuoto → passaggio → ricezione → tiro | PASS; nuoto preliminare 2,166 m, corpo orizzontale 1,0 |
| Durata originale di stop | 3,800 s; cronometro fermo, una rimessa, possesso 28 s |
| Ripristino scena/motore/RNG, anche se il draw genera errore | PASS; trasformazioni, matrici, materiali, scheletri e buffer degli effetti |
| Cambio del marcatore dopo gol | Nome/numero del filmato conservati; aspetto corrente ripristinato |
| Pausa, rotazione, reset, filmato assente, gol finale, serie rigori esclusa | PASS |
| 34 episodi con identità differenti | Max 13.771.060 byte nei buffer contati e copie RGBA delle cuffie; 19 texture, tetto 32; archivio ≤106 campioni |
| Replay, beduina fisica, 844×390 DPR1,5 | Max 48 chiamate / 145.416 triangoli nei tre fotogrammi misurati |
| Replay, beduina fisica, 667×300 DPR1,5 | Max 48 chiamate / 145.416 triangoli nei tre fotogrammi misurati |
| Diretta con due cambi, 844×390 e 667×375 DPR1,5 | Entrambe max 65 chiamate / 147.488 triangoli |
| Aspetto iPhone 844×390 / 667×375 | 62 / 142.316 e 61 / 142.060 |
| Gambe fuori dall'acqua | 0/4.375 verticali; 0/7.740 nuoto; 0/1.395 transizione |

I 14 corpi in campo restano completi. Il filmato registra anche due comparse reali dei cambi: nessun doppione viene aggiunto alla scena. I massimi sono dei campioni di prova, non una promessa su ogni possibile stato. Memoria riportata: buffer e copie di texture contati dalla diagnostica, non intero heap o memoria GPU. Nessuna misura FPS sul dispositivo.

`npm run lint`, `npm run build`, `npm run replay -- --foto`, `npm run replay-ui -- --foto` e `npm run aspetto -- --no-build`: PASS locale. `npm run verifica -- --partite=0`: PASS locale (cinque immagini identiche, qualità e tornei); sei partite complete e regressioni dell'intera CI vengono eseguite sull'ultimo SHA del branch. Esito definitivo e collegamento del run nella descrizione della PR; non considerare una prova solo avviata come PASS.

## Decisioni precedenti superate esplicitamente

- Attesa del gol solo in diretta → stessa durata con 0,6 s diretta + 2 s replay + 1,2 s rimessa, come proposta approvata da Ale.
- Camera unica: resta unica durante il gioco; il replay usa temporaneamente un'inquadratura automatica dedicata, poi ripristina quella corrente.
- È approvato saltare la presentazione del gol: il salto percorre soltanto lo stop originale e non consuma tempo di gioco.

Restano SPEED1, nuoto v0.45, IA/regole v0.46, sprint a tocchi, riflesso solo alta, tiro al rilascio e carica massima0,9s, logo C, CAMBI in basso e budget iPhone strettamente sotto100 chiamate/150.000 triangoli anche nei cambi.

## Non fatto

Telecronaca, cori registrati, replay selezionabile dalla pausa o archivio di video esportabili, replay della serie di rigori, assist/traversa come didascalie, nuove animazioni di ricezione, Sfide lampo, progressione e ricompense. La barra oscillante del concorrente è uno spunto da valutare con Ale: nessun cambiamento alla meccanica di tiro in questa PR. Nessun merge o deploy.
