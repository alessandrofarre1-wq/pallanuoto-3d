# v0.73 — mani e polsi

Base: main `1452f1a`, PR #63 unita e CI `45001334329` riuscita. Ramo `codex/v073-mani-polsi`. Ale ha chiesto di conservare mani, polsi e movimenti validi dopo aver fermato il tentativo sul volto. Questa versione integra soltanto quella parte; il prototipo facciale è escluso.

## Risultato e file

Il modello runtime mantiene il corpo, le 24 giunture originali e le 18 morph del volto v0.72. Le mani unite sono sostituite con mani anatomiche MakeHuman CC0: cinque dita indipendenti per mano, 30 falangi aggiunte e pesate, polso assottigliato e raccordato all'avambraccio. Il modello completo contiene **8366 triangoli, 8599 vertici e 54 joint**, in un'unica primitiva e materiale. Tutti i 14 atleti rimangono completi; non viene importato 14 volte il modello Plask da 34.550 triangoli.

`src/grafica/mani.js` raccorda appoggio, presa e rilascio, con una lieve opposizione del pollice. `corpo.js` e `pose.js` collegano il controller nella sola fase visuale. `modelli/pallanuotista.js` usa marker misurati sul palmo; il lancio conserva il medesimo `J` e `ballW` fisico. Nuoto e tiro v0.72 rimangono quelli già pubblicati. Non si presenta questa integrazione come una nuova revisione generale dei movimenti.

`src/grafica/replay.js` registra quattro valori di rotazione per ciascuna nuova falange, invece di undici canali: posizione, scala e visibilità locali sono costanti. Serve a mantenere il limite storico di 24 MiB dopo l'aggiunta delle ossa. Durata e frequenza della clip restano invariate; ripristino nel `finally` e dopo eccezioni verificati dalla suite esistente. Il controller modifica solo le rotazioni, come controllato dalla nuova prova indipendente.

Builder e fonti riproducibili: `strumenti/blender/runtime-mani.py`, `mano-makehuman.py`, `modelli-sorgente/pallanuotista/v073/`. `strumenti/rigenera-mani-v073.mjs` costruisce, compatta, installa e rigenera gli indici della riserva. `compatta-glb.mjs` elimina soltanto dati non più referenziati: posizioni, indici, morph, texture e matrici utilizzati restano identici. Licenze e provenienza CC0 sono incluse.

`tests/rig-mani-v073.mjs` controlla il vero GLB: pesi, bind, dita indipendenti, marker, rest originali, morph conservate e controller destro/mancino. È aggiunto alla CI. Il test costumi usa ora il conteggio dell'asset ufficiale, conservando i massimi storici di 9042/2800 triangoli per corpo/riserva e 69 chiamate/148.734 triangoli su iPhone. Controlli su bandiere e 14 corpi conservati.

## Misure e provenienza

GLB finale compatto: SHA256 `8fd658a8a89ad0dd242100133daf920eb6cfa492af8f39e95f6ff92124ba6745`, 4.523.896 byte, contro 1.101.624 byte della base. L'aumento del file deriva anche dall'atlante 2048×1024 e dai dati delle nuove falangi; il costo geometrico per atleta scende da 9042 a 8366 triangoli. Non è una misura dei tempi di caricamento su rete mobile.

Il primo raccordo mostrava triangoli sovrapposti al polso. Il candidato finale ricuce il bordo geometrico, mantenendo identici i pesi dei duplicati UV: nessun triangolo nullo; ciascuno dei 130 bordi geometrici per polso ha due facce incidenti. Correzione locale massima di 2,014 mm a sinistra e 0,671 mm a destra. Due fotografie ravvicinate del motore sono state ispezionate; restano le sfaccettature del modello leggero. Dati e limiti in `docs/verifiche/v073/raccordo-polsi.json` e `ispezione-mani.json`.

Sul modello finale, il replay completo misura massimo **22.009.580 byte**, **49 chiamate e 136.678 triangoli**; 14 corpi nei casi 844/667, controllo dei cambi e 480 falangi compattate. Tutte le 18 scene/558 campioni di leggibilità passano, palla almeno 4,30 px CSS. La prima versione non compressa superava il limite di memoria ed è stata corretta.

Le quattro scene della palla verificano destra/sinistra su 844/667: diametro 22,12 cm, porta 3×0,90 m, campo 25×20 m, contatto del palmo entro 5 mm. Costumi e bandiere: 24 nazionali, 14 corpi completi; due cambi simultanei su entrambi gli schermi, massimo **66 chiamate e 138.686 triangoli**, nessun errore pagina/WebGL/shader. Rapporti finali in `docs/verifiche/v073/`.

## Verifiche finali

`npm run prove`: **54 PASS, 0 FAIL**, in 22,7 minuti; include `npm run lint` e il controllo completo del gioco/gambe con `npm run aspetto -- --no-build --solo-gioco`. Gambe sopra l'acqua: **0/7684** in verticale, **0/5144** in nuotata e **0/1200** a metà. Nessuna modifica a soglie o assert. `npm run aspetto -- docs/immagini/v073/aspetto --no-build --solo-foto`: **PASS**, sei viste ispezionate sulla stessa build, senza ripetere la partita. Entrambi gli iPhone: **56 chiamate / 131.872 triangoli**. `npm run verifica -- --partite=0`: **PASS** finale, qualità e 17 gruppi dei tornei superati, cinque confronti immagini entro tolleranza. Il primo giro aveva un solo scarto (azione 0,58%); dopo ispezione è stato aggiornato soltanto quel riferimento. Soglia 0,5% conservata, altri quattro riferimenti invariati. Le sei partite standard sono riservate alla CI finale per evitare duplicazioni. Risultati effettivi e fase dei dati in `docs/verifiche/v073/README.md`; lo SHA e l'esito della CI si leggono nella PR.

## Decisioni cambiate e non fatto

L'unico modello runtime è ora una derivazione del corpo del concept con mani anatomiche. La decisione precedente di mantenere le mani originali è superata dalla richiesta di Ale. Le nuove dita vengono animate; non si applica alcun nuovo volto. Limiti iPhone, 14 corpi, stile cartoon, logo C, camera unica, SPEED 1, controlli, riflesso solo in alta e CAMBI basso al centro sono conservati.

Non fatto: nuovo volto o rig facciale, qualità artistica del concept nei primi piani, nuovi gesti generali, clip Plask importate, FPS su iPhone fisico e bilanciamento già aperto nella v0.71. Il GLB Plask consegnato rimane separato. Nessun merge o deploy.
