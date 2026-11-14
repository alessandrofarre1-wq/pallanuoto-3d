# v0.38 — grafica e regolarità dei fotogrammi

## Modifiche

La qualità automatica misura finestre di un secondo: riduce la risoluzione
se per due finestre consecutive la media supera 19 ms oppure oltre il 10% dei
fotogrammi dura più di 22 ms. Un singolo scatto non basta. Passi di DPR da 0,125,
minimo 1 (o il valore iniziale se inferiore); dopo 12 secondi stabili recupera
un passo fino al valore iniziale. Menu, pausa, orientamento verticale in partita
e ritorno dall'altra app azzerano la misura. Si misura il tempo reale, prima
del limite usato dalla simulazione. File: `src/grafica/qualita.js`, `src/main.js`.

Il riflesso completo è riservato alla qualità alta (DPR >= 1,75): sui telefoni,
con massimo 1,50, restano riflessi dell'ambiente, luci e onde senza ridisegnare
tutta la scena. Griglia dell'acqua touch 32×24 (1.536 triangoli invece di 16.000),
con normali analitiche invariate. File: `src/grafica/superficie.js`.

Pali e pannelli delle reti sono accorpati per materiale senza cambiare le facce;
i 18 segni a bordo vasca sono istanziati. Le piccole boe passano da 48 a 24
triangoli ciascuna, conservando dimensioni e colori. File: `src/grafica/scena.js`.

I 14 giocatori in campo conservano il modello completo (9.042 triangoli del
corpo). Soltanto i due corpi aggiuntivi dei cambi usano 2.800 triangoli, con
stessi vertici, texture, ossa e morph target. Resta il numero sulla cuffia;
per loro si nasconde il numero fluttuante duplicato. I corpi non si scambiano:
quando la riserva entra in campo prende il corpo completo del titolare.
Indici generati con `node strumenti/riserva-leggera.mjs`, legati all'hash del
GLB originale e verificati da `tests/qualita.mjs`. File: `corpo.js`, `modello.js`,
`modelli/riserva-indici.json`, `panchina.js`.

I vettori temporanei delle braccia sono riutilizzati, mantenendo gli stessi
calcoli. L'ombra dell'espulso segue la visibilità del corpo anche mentre nuota
al pozzetto. File: `corpo.js`, `illuminazione.js`.

## Misure e limiti

Il primo controllo dei doppi cambi ha rilevato 100 oggetti e 168.468 triangoli.
Ale ha richiesto di rispettare i limiti anche nei cambi, senza deroghe.
Misure definitive e risultati dei comandi sono riportati in CLAUDE.md e nella PR.
`strumenti/misura-fluidita.mjs` campiona azione e due cambi simultanei su iPhone
844×390 e 667×375, DPR 1,50. `--foto` salva anche due immagini in `/tmp`.

Verifiche: `npm run lint`, `npm run verifica`, `npm run aspetto`,
`npm run qualita` e `node tests/grafica-arena.mjs --no-build`. Per Chromium in
questo ambiente è usata la cartella `/tmp/pallanuoto-browsers` con
`PLAYWRIGHT_BROWSERS_PATH`. Gli screenshot di aspetto hanno timeout 120 s,
per il rendering software, e il test del resize attende l'evento di resize.
Le soglie e le affermazioni verificate restano esplicite nei test.

## Decisioni modificate e lavoro non fatto

Su indicazione esplicita di Ale, il riflesso della v0.37 non è sempre acceso;
la qualità ora recupera dettaglio dopo un periodo stabile. Sono stati ridotti
i soli corpi aggiuntivi dei cambi per restare nel budget. Regole, ritmo,
comandi e fisica non cambiano.

Resta necessaria una prova su iPhone reale per valutare FPS e resa visiva:
i tempi del rendering software e le simulazioni non dimostrano 60 fps sul
telefono. Nessuna pubblicazione su main in questa PR prima della revisione.
