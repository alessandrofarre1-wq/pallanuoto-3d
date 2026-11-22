# Tiro Plask 01 — sorgente di Ale, da ripulire

Animazione allegata da Ale il 22 novembre 2026: `waterpolo shoot.glb`, nome interno `waterpolo shoot 2.mov`. Conservata senza modifiche in `tiro-originale-plask.glb`; SHA256 e misure in `analisi.json`. **Non è ancora integrata nel gioco.** Questo ramo contiene soltanto consegne e non modifica main né pubblica il gioco.

La clip dura 6,9167 s: 52 joint, 53 canali (52 rotazioni e una traslazione), 34.550 triangoli e tre primitive. Le tavole derivano dalla riproduzione del vero GLB con Three.js/GLTFLoader. I tempi indicati sono quelli del file, non tempi reali ricostruiti dal video.

## Parti utili e problemi

Ale propone la clip per l’alza e tira dopo fallo e autorizza a riutilizzarne parti nei tiri generali. Preparazione/alzata **4,8–5,9 s** e accompagnamento/recupero **6,1–6,8 s** sono candidati. Anche busto, braccio libero e coordinazione vanno studiati per il tiro classico. Beduina, sciarpa e palombella richiedono gesti propri.

Nella riproduzione, la posa a T iniziale precede un salto della radice di **2,358 m**: non trasferirlo nel gioco. Anche spostamenti e gambe stimati da Plask non possono sostituire il nuoto e la bicicletta.

Fra **5,9 e 6,1 s** il braccio destro scatta: a 5,95 s va all’indietro e a 6 s il gomito è piegato a circa **23,9°**. La mano raggiunge 23,02 unità/s rispetto al bacino nel tempo del file, esclusa la posa iniziale. Non è una misura della velocità reale del pallanuotista. Il fattore di rallentamento e il distacco della palla non si ricavano con certezza dal GLB.

**Serve il video `waterpolo shoot 2.mov` per verificare quel tratto e il rilascio.** Le tavole mostrano il difetto, non una correzione già riuscita.

## Passaggio per l’integrazione

Base verificata: main `9e95c00`, v0.73, PR #64 unita e CI `45014844635` riuscita. Preservare mani/polsi, volto v0.72 e modello leggero da 8366 triangoli. Trasferire soltanto i dati utili della clip sul rig esistente, senza caricare 14 copie del sorgente da 34.550 triangoli.

Lavorare nel solo disegno: `src/grafica/pose.js` (`articolaVista`, `p.Jv`) e `tiro-vista.js`. `computePose`/`p.J` e `p.ballW` decidono la fisica del lancio e devono restare invariati. Carica massima 0,9 s e tiro al rilascio: non riprodurre tutti i 6,9 s. Agganciare le fasi ai tempi correnti, con raccordi continui, specchio per mancini e palla sul palmo fino al rilascio.

Il codice corrente consente il tiro libero diretto dopo fallo ordinario fuori dai **6 m**; i 5 m sono la linea del rigore. Nessuna regola è stata cambiata.

Prima della PR: confronto reale a tre lati, rilascio/compenetrazioni, regressioni richieste da CLAUDE, meno di 100 chiamate e 150.000 triangoli anche con due cambi/replay e 14 corpi completi. Aggiornare versione, CLAUDE, rapporto, decisioni e passaggio. Nessuna PR del tiro è ancora aperta.

## Riproduzione delle viste

Copiare `analizza-clip-plask.mjs` nella cartella `strumenti` di un checkout del gioco con dipendenze npm installate. Eseguire:

```sh
PLAYWRIGHT_BROWSERS_PATH=/percorso/browser node strumenti/analizza-clip-plask.mjs /percorso/tiro-originale-plask.glb /tmp/analisi-tiro
```

Usa una sola istanza Chromium e produce 36 viste dei tempi della tavola e una registrazione numerica delle ossa. Non esegue partite né modifica il gioco.
