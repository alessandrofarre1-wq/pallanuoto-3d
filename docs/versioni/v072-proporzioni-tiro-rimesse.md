# v0.72 — proporzioni dell'insieme, tiro classico e rimesse

Ale ha segnalato la palla troppo piccola rispetto ai corpi e ha chiesto di verificare anche campo, porte e portiere; ha fornito un articolo sul tiro e segnalato la rimessa laterale errata dopo una parata. Base `main`7827854, PR62 v0.71 già unita; CI main44991043277 verde. Branch `codex/v072-proporzioni-tiro-rimesse`. Nessun merge/deploy di questa versione.

## Proporzioni in metri

Il problema non era la palla regolamentare: `VIS=1,45` portava il modello adulto a circa2,55m rispetto alla porta3m. Ingrandire la sola sfera avrebbe conservato lo squilibrio. Ora `VIS=1,10` riallinea i corpi al campo; rimangono le proporzioni cartoon interne al GLB e le differenze individuali del database.

| Misura | Prima v0.71 | v0.72 |
|---|---:|---:|
| Campo fra le linee di porta |25×20m|25×20m|
| Luce porta / traversa sull'acqua |3×0,90m|3×0,90m|
| Palla fisica e disegnata |22,12cm|22,12cm|
| Altezza modello base, bind completo |2,54702m|1,93222m|
| Nicosia, bind con profilo individuale |2,59478m|1,96845m|
| Distanza spalle Nicosia, posa precedente pronta |59,09cm|44,83cm, riduzione uniforme teorica|

Altezza bind: estremo reale dei vertici del GLB1,80074267m, normalizzazione sulle spalle0,97546709, fattoreVIS e profilo individuale. Non è la quota di emersione in acqua. Il test di proporzioni misura anche le due porte con raggi sulla mesh, non solo le costanti del regolamento, e controlla l'altezza dei14modelli.

`scala-grafica.js` è il riferimento comune. `costanti`, `grafica/modello` e `pose` applicano la scala; `parata-portiere` adegua raggi e centro testa della sagoma condivisa. Ombra e contatto acqua seguono il corpo (`illuminazione`, `pose`). La palla resta appoggiata sul palmo deformato e il replay misura il raggio reale. Per conservare anche il limite storico più stretto della prova costumi, la decal del numero sulla cuffia usa7suddivisioni invece di8:60triangoli risparmiati per atleta,840sui14corpi e960con2comparse. MeshGLB e texture conservate; nessuna modifica alle espressioni. Piscina esterna30×25m: il campo delimitato al suo interno è25×20m.

**Decisione superata:** la v0.71 conservavaVIS e origine assoluta del lancio. Ora `p.ballW` segue l'altezza corretta, così il tiro non parte sopra la mano di un corpo rimpicciolito. La posa locale `computePose`, la durata della frusta e le velocità nominali sono conservate; non si afferma identità delle partite tra le due scale. Raggi degli urtiGK proporzionati; nessun ritocco globale di precisione/potenza per mascherare il cambiamento. Il limite velocità delle mani7m/s resta: affinata la stima dei picchiIK al solo lancio. Il primo gesto lasciava solo21,77° di precarica tra torace e bacino: la regressione esistente ha segnalato il problema. Corretto il caricamento del bacino−0,46→−0,32rad: separazione reale29,46° in carica e max32,21° nella verificaNode sul rig, senza abbassare la soglia25° del test. Anticipo e finale della catena conservati. Cinque suiteNode PASS; max6,5996m/s nel test esistente e6,6346 in160bersagli aggiuntivi a0,5ms. Non sono FPS su iPhone.

## Tiro classico sul rig esistente

Letto per intero [Jim Solum, Fundamentals of the Water Polo Shot, 2008](https://www.waterpoloplanet.com/HTML_Jim_pages/js01_shot_doctor_jim.html). La tecnica è una catena dal sostegno delle gambe a bacino, tronco, braccio e dita: il gesto non deve essere affidato alla sola spalla. Qui si correggono appoggio asimmetrico, anticipo delle anche, core, spazzata/trazione della mano libera e gomito alto; mancini allo specchio. Fonte tecnica storica, non regolamento attuale.

Il file in uso `grafica/modelli/pallanuotista.glb` **ha già uno scheletro funzionante**: una skin,24joints, inverseBindMatrices, `JOINTS_0`/`WEIGHTS_0` su9023vertici; bacino, colonna, gomiti, polsi e gambe hanno influenza reale. Nessuna clip registrata; animazione procedurale. Non serve convertireFBX né applicare un secondo rig conMixamo.

File `grafica/tiro-vista`, `pose`, `corpo`. Polso/frusta continua della0.70 conservati; nessuna nuova geometria, comando o modifica delle espressioni. Il testNode controlla raccordi e rig; la diagnostica browser ha4casi D/S e due versi,24pose e18foto per fase prima/dopo.

| Misura del gesto, stessa scala1,10 nelle due fasi | Prima | Dopo |
|---|---:|---:|
| Gomito sopra spalla, carica,4casi |15,02–15,07cm|21,15–21,21cm|
| Mano libera rispetto superficie, rilascio |+11,02–11,80cm|−15,67–−14,35cm|
| Separazione avanti/dietro piedi caricati |bicicletta|75,16–76,09cm|
| Rilascio nella fixture |175,031ms|175,031ms|
| ErroreJ/ballW contro formula fisica corrente |0|0|

Il confronto del gesto sostituisce **solo** pose/corpo da7827854: usa la scala1,10 in entrambi, per distinguere il tiro dal ridimensionamento. Traccia fisica identica SHA256 `2efc0a240ac2fb77fe2a3bc251e2f6d0542ee7c1894f0f926bd3f6ba65e00528`, callback una volta. Non prova identità del gioco conVIS1,45. Fasi e provenienza in `docs/verifiche/v072/tiro-*.json`; [confronto fotografico](../immagini/v072/tiro-prima-dopo.png) ispezionato. Le foto mostrano le pose; da sole non certificano la fluidità continua né una resa professionale.

## Regressione rigori emersa con la scala corretta

La prima suite ha rilevato237/240gol(98,8%): il preset della quadrella alta, introdotto nella0.71, si applicava a **ogni** rigore CPU perché la potenza è sempre≥0,8. Con il portiere adulto quella scelta era quasi sempre fuori portata; il vecchio corpo gigante nascondeva il problema. Griglie Rapier indipendenti hanno distinto la copertura di quadrella e bersagli naturali, senza attribuire percentuali di partita ai contatti nominali.

Correzione limitata ai rigori: la potenza non forza più la quadrella alta; torna la distribuzione naturale di bersagli bassi/alti e laterali. Velocità, precisione personale, fattore di letturaGK0,7 e requisito del contatto restano identici. Stessa regola per tiratore umano e CPU; mirino allineato (`tiri`, `grafica/render`). Sul gioco in azione resta il preset forte alle quadrelle. Nuova prova: **190/240gol=79,17%**,22,7595±0,7290m/s,169,768ms; dati nel file `rigori-finale.json`, assert70–86% conservato. Nessun rigonfiamento del portiere o estensione artificiale delle braccia.

## Rimessa dopo deviazione

`sideOut` leggeva `lastTeam`, che conserva il lanciatore anche dopo una parata. Ora legge prima il tocco reale della difesa: dopoGK e uscita laterale, tiro libero all'attacco18s nel punto di uscita. Sul fondo rimane il corner18s. Conservata l'eccezione per il tiro murato dal giocatore di movimento: laterale alla difesa28s; sul fondo rimessaGK28s. Distinti ultimo possesso e ultimo tocco, senza cambiare le statistiche di parata.

Fonte primaria: [World Aquatics Competition Regulations, 18febbraio2026, estratto pallanuoto](https://www.bwpl.org/uploads/2/6/5/9/26598283/water_polo_rules_extract_from_2026-02-18_world-aquatics_cr-final.pdf), artt12.3.1/12.3.1.1,9.8.3.2/9.10.3.2,13.1.2.2.3/14.1.1. Letto anche il testo del documento completo già scaricato.

`regole.js`; nuova prova `tests/rimesse-v072.mjs`, script/CI `rimesse`. **56voli Rapier reali PASS**: entrambe le squadre, entrambi i versi e lati;16lateraliGK,8cornerGK,16muri,16senza tocco, cronometro iniziale7/24s. Riprese attraverso `partita.update`, nessuna correzione della palla dopo il lancio, cronometri fermi durante attesa;8parate pendenti risolte senza doppio conteggio. Il codice precedente fallisce sul primo caso. Dati/log in `docs/verifiche/v072/`.

## Verifica finale

- `npm run lint`:PASS sul codice finale.
- `npm run prove`: primo giro49PASS/4FAIL su53. Torace corretto conservando soglia25°; numeri cuffia alleggeriti conservando il limite storico148734; `sezione1` ha avuto un timeout durante una ricostruzione locale, poi PASS isolato; rigori corretti come sopra,190/240. Tutti e quattro i passi falliti ripetuti e PASS. Le altre regressioni, compreso replay, erano PASS; esito **INTERO dell’ultimo SHA nella PR**. Nessuna soglia allentata.
- `traiettorie`:PASS anche con la nuova regressione sui rigori: bersagli bassi/alti, due versi, mira manuale e potenza conservate. La nuova fixture usa la mira esplicita per isolare il forte dalla scelta casuale del rimbalzo, e osserva il profilo reale anziché un campo inesistente della palla.
- Proporzioni finali:4scene/14atleti,22,12cm, porte reali3×0,90m, altezze bind1,860–1,981m, palla/testa0,786–0,788,6,58–7,19pxCSS, distanza dal palmo entro0,345mm.63chiamate/142160tri nelle scene statiche.
- Costumi e fluidità, due cambi contemporanei:844×390 e667×375 entrambi massimo **66chiamate/148150tri**, DPR1,5.14corpi completi più2comparse. Valido anche il limite storico più stretto del test costumi; nessuna deroga150000.
- Immagini:5confronti ispezionati; menu mantenuto, solo riferimenti2–5aggiornati dopo l’ispezione. La diversa azione deriva dalla nuova scala del punto di lancio: non si afferma identità del gioco fraVIS1,45e1,10. Soglia0,5% conservata. Verifica bloccante indipendente **PASS**: menu0,01%, tre immagini identiche, iPhone piccolo0,00% entro tolleranza. Campione gambe finale nei log allegati alla chiusura.
- Aspetto: sei viste già controllate sulla build finale; il campione gioco/gambe è stato ripetuto dopo la correzione dei rigori: **0/7684verticale,0/5144nuoto,0/1200intermedio**, partita conclusa. iPhone844/667:56chiamate/141336tri in entrambe le viste. L’opzione `--solo-foto` consente in futuro di dividere le due metà **solo sulla stessa build**, evitando simulazioni duplicate. Le4viste ravvicinate usano profilo desktop, non sono misure deiPhone.
- Sei partite standard una sola volta nella CI finale. Nessuna nuova prova facciale e nessun nuovo campione generale8+8 dichiarato.

## Non fatto

Nessun nuovo gesto speciale/comando touch, motion capture, conversioneFBX, nuova grafica del viso o prova facciale. Non sono certificati FPS su hardware Apple né naturalezza professionale. Il bilanciamento generale resta aperto: gli8+8incontri della0.71 sono una baseline storica, non misure della0.72; nessuna nuova taratura generale dichiarata. La nuova foto annunciata nel messaggio non risulta allegata: il lavoro usa il GLB attuale, le misure, l'articolo e i riferimenti già presenti. LogoC, camera unica diretta, velocità unica,14corpi, controlli e limiti iPhone conservati.
