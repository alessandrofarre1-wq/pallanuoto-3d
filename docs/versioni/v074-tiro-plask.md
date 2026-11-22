# v0.74 — tiro Plask e mano nell’esultanza

Base main `9e95c00`, PR64 unita e CI45014844635 riuscita. Ramo `codex/v074-tiro-plask`. Ale ha fornito il tiro registrato con Plask e il video originale, poi chiesto di trasferire il movimento di tutto il corpo. La richiesta più recente vieta di stravolgere il modello e rimanda il volto: questa versione modifica esclusivamente l’applicazione delle pose. Il GLB runtime rimane identico byte per byte alla v0.73: SHA256 `8fd658a8a89ad0dd242100133daf920eb6cfa492af8f39e95f6ff92124ba6745`.

## Trasferimento del tiro

`strumenti/estrai-tiro-plask.mjs` legge l’originale senza riscriverlo; `grafica/dati/tiro-plask-01.js` contiene le pose compattate e la provenienza. `grafica/tiro-plask-vista.js` calibra gli assi anatomici dei due rig e applica 52 ossa: bacino, tre segmenti della schiena, clavicole, collo/testa, braccia, mani, 30 falangi, cosce, ginocchia, caviglie e punte. Le due ossa aggiuntive del rig del gioco rimangono nel modello. Nessun nuovo osso, vertice, peso, proporzione, materiale o morph.

Il trasferimento agisce dopo il movimento procedurale in `corpo.js`/`pose.js`, per il tiro standard caricato e la torsione. Le caviglie e le punte non vengono più sovrascritte dalla vecchia posa del tiro con il piede a martello. Per il mancino si scambiano i lati e si riflettono le pose nel sistema anatomico; non si usa una scala negativa sulla mesh. I gesti rapidi/speciali restano quelli esistenti. Non è una nuova revisione di tutti i passaggi, delle beduine o delle palombelle.

La registrazione è conservata integralmente: **415 pose**, dal primo fotogramma animato a1/60s fino a6,917s, con tutti i52canali di rotazione. Si esclude soltanto la Tpose artificiale inserita nell’esportazione a tempo0. Preparazione, carica, frusta e accompagnamento attraversano tutta la sequenza, adattata ai tempi dei comandi esistenti; non si riproduce lo slow motion originale nella partita. Una precedente prova limitata ai2,117s finali è superata dalla richiesta di Ale di prendere tutta l’animazione. L’originale completo è anche disponibile nel [ramo di consegna](https://github.com/alessandrofarre1-wq/pallanuoto-3d/tree/655a30fa6236de6edc78190134b6b2e812370b86/animazioni/tiro-plask-01).

Nel video la mano destra esce dall’inquadratura vicino al rilascio e Plask produce una chiusura errata del braccio. Si raccordano soltanto `rightArm`, `rightForeArm`, `rightHand` tra5,9 e6,1s; le altre articolazioni restano dalla registrazione. Denoise di cinque campioni e interpolazione SQUAD riducono il rumore. Il punto6,1s è un’ancora adattata al lancio fisico esistente, **non** una misura del distacco del pallone dal video. Il fattore dello slow motion originale non è noto.

Traslazione e salti della radice Plask non spostano il giocatore sul campo. La quota viene adattata alla vasca e i limiti d’immersione conservati; la forma del gesto rimane sulle ossa registrate. Carica, rilascio e recupero sono raccordati con una curva temporale continua. Il motore conserva `J`, `ballW`, callback, tempi, traiettorie, regole e caso; la palla disegnata segue il palmo reale tramite il raccordo già presente.

## Mano alzata

Nel primo piano segnalato da Ale, il riferimento del palmo dell’esultanza era quasi parallelo all’avambraccio alzato. `pose.js` usa ora un riferimento trasversale rivolto in avanti e un polso quasi neutro. Nessuna mano viene rimodellata o girata nel fileGLB. La sonda su60 campioni e due direzioni misura il prodotto fra normale del palmo e direzione frontale da minimo0,579 a0,919; flessione del polso da5,73° a2,29°. Foto prima/dopo e viste laterali sono state ispezionate; [confronto della mano](../immagini/v074/mano-esultanza-prima-dopo.png). Il test non valuta la mimica facciale.

## Verifiche e limiti

`tests/tiro-registrato.mjs` controlla il vero hash del modello, tutte le52 ossa, calibrazione dei palmi/punte D/S e interpolazione normalizzata. `tests/esultanza-mano.mjs` controlla il polso e il palmo sulla posa realmente applicata nel browser. Entrambi nel comando `tiro-registrato`, aggiunto alla CI. Il confronto indipendente `tests/tiro-fasi-v072.mjs` passa nei quattro casi D/S e due direzioni:24 pose,18 fotografie da tre lati, errore sulle giunture/palla fisiche0, callback una volta, rilascio175,031ms; la traccia è identica alla base, SHA256 `2efc0a240ac2fb77fe2a3bc251e2f6d0542ee7c1894f0f926bd3f6ba65e00528`.

La [sequenza continua](../filmati/v074-tiro-plask.mp4) mostra32fotogrammi selezionati a circa30Hz: carica, lancio fisico e recupero nella scena isolata del motore, con gambe visibili. [Foglio](../immagini/v074/sequenza-tiro.jpg) ispezionato per intero: non è una partita completa né una registrazione di FPS su telefono.

La prima CI sullo SHA02d0a0d si è fermata dopo34comandi riusciti: gomito in carica142,42° al fotogramma agganciato5,8s, fuori dall’assert55–115°. La curva originale si chiude nel caricamento a5,9s: si corregge soltanto `loadEnd`5,8→5,9, non l’osso o il modello. La prova completa dei gesti passa ora D/S con109,94° nella sua scena. Soglie anatomiche, torsione e polso conservate; nuova regressione verifica che l’ancora della carica abbia il gomito55–115° nella clip. Foto e sequenza sono rigenerate dopo questa correzione; gli esiti precedenti restano distinti dalla fase finale.

La prima verifica delle proporzioni ha evidenziato un errore nella misura: la scatola della testa sulloZ del campo includeva la profondità quando la testa ruotava. `tests/dimensioni-palla-v071.mjs` misura ora negli assi anatomici della testa, in metri e senza togliere la scala. Le soglie0,7–1,0 del rapporto palla/testa e5mm sul palmo restano invariate. Non si corregge il modello per far passare una proiezione sbagliata.

Esiti finali, fase e provenienza delle misure sono in [verifiche/v074](../verifiche/v074/README.md). La CI dell’ultimo SHA pubblicato è la fonte per l’intera suite e le sei partite standard; non si attribuiscono alla v0.74 i numeri della v0.73.

Non fatto: volto/rig facciale, nuovi modelli o dita, nuove animazioni degli altri gesti, nuovo bilanciamento, ricostruzione affidabile dei dettagli non visibili nel video, misure FPS su iPhone fisico. Naturalezza da giudicare con Ale; nessuna certificazione artistica sulla base dei soli test. Nessun merge o deploy.
