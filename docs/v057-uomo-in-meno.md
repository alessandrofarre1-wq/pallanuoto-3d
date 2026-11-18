# v0.57 — Difesa con l'uomo in meno: braccio a specchio e centrale tra i pali

Indicazione di Ale (18/11/2026): «sull'uomo in più il difensore che difende su 3 alza il braccio destro anziché quello sinistro.
In difesa sull'uomo in più l'uomo che difende sul 3 difende il suo palo con una posizione a specchio rispetto all'avversario,
mentre il difensore che sta tra i due pali a 2 metri difende il tiro incrociato, quindi copre quella porzione di porta lasciata
libera dal portiere. Chi sta tra i pali ha il ruolo più scomodo perché deve saltare da un palo all'altro (senza fare fallo):
- se ha la palla 1 deve stare sulle spalle del difensore del palo e difendere con il braccio il palo lungo, perché il portiere e
  il difensore di 1 coprono il palo corto;
- se ha la palla 2 copre il tiro incrociato, mentre il difensore di 1 si stringe perché 1 non ha più la palla e si mette a
  proteggere il palo;
- se ha la palla 3 è speculare a 2; se ha la palla 4 è speculare a 1.
Questa è la difesa di partenza: se l'attacco applica degli schemi bisogna cambiare difesa.»

Numerazione dell'uomo in più (v0.50), guardando la porta: 1 destra ai 2 m, 2 fuori palo destro ai 5 m, 3 fuori palo sinistro ai
5 m, 4 sinistra ai 2 m, 5 e 6 ai pali.

## Perché succedeva
Il braccio del muro seguiva sempre la regola della v0.30, valida in parità: braccio dalla parte del palo coperto. L'attaccante 3
sta davanti al palo sinistro, quindi il difensore alzava il braccio da quella parte, cioè il destro, davanti alla spalla che non
tira. Il centrale tra i pali si spostava soltanto verso il palo dalla parte della palla e non alzava il braccio.

## Cosa cambia
- **Braccio a specchio** (`muro.js`, `braccioMuro`): con l'uomo in meno chi esce sul tiratore alza il braccio opposto al suo
  braccio di tiro, proprio davanti alla palla (contro un destro il sinistro, contro un mancino il destro). In parità resta la
  regola v0.30.
- **Centrale tra i pali** (`ia.js`, `postiInferiorita`, misure in `INFERIORITA`):
  - palla a 1 o 4: sta sulle spalle del difensore del palo dalla parte della palla (1 m dal centro, 1,7 m dalla porta) e copre
    il palo lungo;
  - palla a 2 o 3: si mette sulla linea tra il tiratore e il palo lungo, a 2 m dalla porta, e copre l'incrociato.
  - alza il braccio dalla parte del palo lungo (`braccioVerso`, disegno in `grafica/pose.js`): a metà quando l'avversario ha la
    palla, in alto quando carica il tiro.
- **Difensore dell'esterno** (1 o 4): quando il suo uomo ha la palla esce su di lui, tra lui e il palo corto (che copre insieme
  al portiere); quando la palla è al 2 o al 3 si stringe verso il palo, di più se la palla è dalla sua parte.
- **Fisica** (`fisica.js`): il tiro che va dalla parte coperta dal centrale incontra il braccio già alto. Il muro riesce come
  quello sul palo corto (42% di base invece del 34% per il braccio alto in ritardo).

## Prova
Nuovo `npm run inferiorita` (`strumenti/inferiorita-foglio.mjs --prova`, nella CI). La difesa si schiera con la palla al 2, poi
la palla passa all'uomo del caso (1, 2, 3, 4), che carica il tiro. Per ogni caso controlla:
- chi esce sul tiratore alza il braccio a specchio;
- il centrale copre il palo lungo e alza il braccio da quella parte;
- con la palla a 1 o 4 il centrale sta dalla parte della palla; con la palla a 2 o 3 sta sulla linea dell'incrociato.

Risultato: 16 controlli su 16. Sulla build della v0.56 la stessa prova ne fallisce 13 su 16.
Foglio con le quattro situazioni viste da dietro la porta: `docs/immagini/v057-uomo-in-meno.png` (senza `--prova`).

## Effetto sul gioco (8 partite ITA–HUN, per squadra, v0.56 → v0.57)
- superiorità trasformate 43,4% → 35,4% (Mondiali 2025: 52%): con la difesa di partenza giusta l'uomo in più rende meno;
- gol 14,1 → 15,7; tiri 43,1 → 43,6; tiri in gol 32,8% → 36,0%; espulsioni 11,4 → 10,9; rigori 1,9 → 1,9; azioni 75,2 → 77,1;
- in parità: palla persa 16,5% → 16,9%, gol 13,6% → 16,9%. Le partite cambiano dalla prima superiorità in poi (la difesa nuova
  sposta i giocatori e il caso prende un'altra strada), quindi le differenze in parità sono in buona parte variazione casuale.

## Non fatto
- L'attacco del computer con l'uomo in più ora segna meno del reale: andrà rivisto (circolazione più rapida per aprire la difesa,
  come dice Ale) insieme alla difesa sugli schemi.
- La difesa contro gli schemi dell'uomo in più (rotazioni, cambi da 4-2 a 3-3) resta quella di prima, che scivola con la palla.
  La «difesa di partenza» è quella descritta da Ale; adattarla a ogni schema va progettato a parte.
- I difensori umani non hanno ancora un aiuto per il posto in inferiorità: lo fanno solo i difensori guidati dal computer.
