# v0.78 — Comandi e interfaccia: CONTRASTA, colori dei tasti, energia con il cognome

## Richiesta
Ale (24/11/2026), con una lista di 13 punti dopo le versioni di Codex. Prima di tutto: «riallinearsi agli sviluppi di Codex».
Questa versione contiene i due punti sull'interfaccia:
- «In difesa il tasto passa deve diventare contrasta. Inoltre penserei se ha senso colorare i tasti, renderli più riconoscibili».
- «Nella barra dell'energia, anziché scrivere "energia" e il numero del giocatore, avrebbe senso scriverci il cognome del giocatore
  e il numero, con a fianco la barra e la % di stamina residua».

Gli altri punti (passaggi, tiri, cambi di marcatura, cambi volanti, time-out, rigore, finte, rose) vanno nelle versioni successive.

## Riallineamento
Il ramo di Claude Code riparte da `main` con la v0.77 di Codex (PR dalla #59 alla #68: entrate reattive, chiamate A/B/C, cambi
volanti dell'avversario in difesa, portiere a contatto, proporzioni, tiro registrato con Plask, mani, finte). Nessuna PR aperta.
Letti `CLAUDE.md`, il passaggio di consegne di Codex e il codice attuale dell'interfaccia (`index.html`, `src/hud.js`,
`src/stile.css`, `src/controllo.js`).

## Cosa cambia
1. **PASSA diventa CONTRASTA** quando la palla è degli avversari: scritta, icona (mano aperta), colore (rosa), sottotitolo
   «3° = fallo» e descrizione per chi usa la lettura dello schermo. Il comando è quello di prima: uno o due tocchi disturbano il
   portatore, il terzo ravvicinato è fallo; al centro «trattieni il centroboa». In attacco il tasto dice PASSA, senza più la
   scritta «contrasto» sotto. Con la palla libera resta PASSA. (`index.html`, `src/hud.js`: classe `in-difesa` sulla pagina.)
2. **Un colore per ogni tasto**, su bordo e icona: TIRO arancione, PASSA blu, CONTRASTA rosa, PALOMB. viola, SPRINT verde, CAMBIA
   bianco. Lo sfondo dei due tasti principali è tinto con il loro colore. Restano come prima i segnali in oro: tasto premuto, tiro
   pronto, tasto a comparsa della controfuga. I colori dei tasti sono lontani dall'oro (tu e azioni richieste), dal rosso
   (sanzioni) e dal ciano (servizio), che nel gioco hanno un significato fisso. (`src/stile.css`)
3. **Energia con numero e cognome**: «#14 Alesiani, barra, 95%» al posto di «Energia #14, barra, 95%». Il riquadro in alto a destra
   è più largo (148 → 170 px; sugli iPhone piccoli 118 → 152 px) per leggere il cognome intero; un cognome molto lungo finisce con i
   puntini. Quando la scheda del giocatore è aperta (3 s dopo un cambio) numero e cognome sono già scritti sopra: lì restano
   barra e percentuale. (`index.html`, `src/hud.js`, `src/stile.css`)
4. **Pagina Comandi**: spiega che con la palla agli avversari il tasto PASSA diventa CONTRASTA.

## Immagini
`docs/immagini/v078-interfaccia-prima-dopo.jpg`: iPhone 14, prima (v0.77) e dopo, in attacco e in difesa.

## Prova nuova: `npm run comandi-interfaccia`
Su iPhone 14 (844×390) e iPhone SE (667×375), touch:
- in attacco il tasto dice PASSA, in difesa CONTRASTA (scritta, icona e descrizione), e torna PASSA quando la palla torna nostra;
- sei colori diversi, tutti lontani dall'oro, dal rosso e dal ciano dell'interfaccia;
- la barra mostra il numero e il cognome del selezionato (uguali a quelli del gioco) e la percentuale, e si leggono per intero.

Al primo giro due colori erano troppo vicini a quelli riservati (l'arancione di TIRO all'oro, l'azzurro di PASSA al ciano): sono
diventati un arancione più carico e un blu più deciso.

## Verifiche
- **`npm run lint`**: PASS.
- **`npm run prove`** (gli stessi passi della CI, compresa la prova nuova): **60 PASS, 0 FAIL** su 60 passi in 16,3 minuti.
  `comandi-interfaccia`: 17 controlli superati. `aspetto --solo-gioco`: gambe fuori dall'acqua 0 su 8.539, 0 su 4.316, 0 su 1.229.
- **`npm run verifica -- --partite=0`** (le sei partite si giocano una volta sola nella CI finale, come fa Codex): cinque immagini
  diverse dai riferimenti.
  - La 4 e la 5 (iPhone) per i cambi voluti: tasti colorati, CONTRASTA, «#12 Carnesecchi» al posto di «Energia #12».
  - Tutte e cinque anche per i caratteri: i riferimenti li aveva fatti Codex sulla sua macchina, con caratteri diversi (il menu è
    lo stesso, cambia solo il tipo di carattere).
  - Posizioni dei giocatori identiche nelle immagini 2-5: la partita non cambia (la versione tocca solo l'interfaccia).
  - Guardate tutte; riferimenti aggiornati con `npm run verifica:aggiorna -- --partite=0`; verifica ripetuta: superata, cinque
    immagini identiche.
- **`npm run aspetto -- --no-build --solo-foto`**: «Tutto a posto»; viste iPhone 56 oggetti disegnati e 131.872 triangoli.

## Decisioni superate
- Tasto PASSA sempre uguale, con «contrasto» scritto in piccolo → con la palla agli avversari diventa CONTRASTA.
- Tasti bianchi (i due principali chiari, gli altri scuri) → bordo e icona con un colore per funzione.
- «Energia #N» (sugli iPhone piccoli la scritta spariva) → «#N Cognome».

## Non fatto
- I colori sono una proposta: decide Ale guardando le foto o giocando.
- Gli altri undici punti della lista (versioni successive).
