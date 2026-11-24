# v0.84 — Rigore: la palla parte dall'acqua, movimento continuo, altrimenti controfallo

## Richiesta
Ale (24/11/2026), punto 13 della lista: «rigore: la palla deve partire dall'acqua e il movimento deve essere continuo, altrimenti
controfallo».

## Cosa diceva il codice
- **Disegno**: chi tirava il rigore teneva la palla in mano, alta, fin dal fischio.
- **Comando** (`src/partita.js`): TIRO tenuto carica fino a 0,9 s; al rilascio parte il tiro. Si poteva restare a braccio caricato
  fino a 7 s, aspettando che il portiere si muovesse. Nella serie finale dopo 7 s il rigore era «non eseguito».
- **Computer**: tira dopo 1,3 s con un gesto unico.

## Cosa cambia
1. **La palla parte dall'acqua** (`src/grafica/pose.js`, solo disegno): prima del gesto la palla galleggia davanti a chi tira, a
   braccio teso, come per il centroboa marcato da dietro. Quando comincia la carica la mano la pesca dall'acqua e la porta su (la
   stessa «pesca» della v0.63), poi la carica di sempre. La palla del gioco e i tempi del tiro non cambiano.
2. **Movimento continuo** (`RIGORE_TIRO` in `src/taratura.js`, `controfalloRigore` in `src/regole.js`): chi resta fermo a braccio
   caricato (carica piena) per più di mezzo secondo commette **controfallo**: fischio, palla al portiere avversario con il tiro
   libero. Nella serie finale è un rigore sbagliato («Controfallo · movimento interrotto»). Il tiro normale resta: carica e rilascio
   senza fermarsi.
3. All'inizio del rigore l'avviso dice «Rigore: carica e tira in un solo movimento · fermarsi a braccio carico è controfallo».
4. Il computer tira già con un gesto unico: nessun cambio.

Foto: `docs/immagini/v084-rigore-palla-in-acqua.png` (prima del gesto, di lato a pelo d'acqua) e `v084-rigore-carica.png` (dopo la
pesca, palla alta).

## Misure
16 partite ITA–HUN computer contro computer: **identiche alla v0.83**, numero per numero (rigori 1,94 a squadra, 69% segnati). Il
computer tira già con un gesto unico e la palla in acqua è solo disegno: la partita del computer non cambia. Il controfallo riguarda
chi tira a mano.

## Prova nuova: `npm run rigore`
Sei controlli:
- prima del gesto la palla disegnata è in acqua davanti a chi tira (5 cm sul pelo dell'acqua);
- caricando la palla viene pescata dall'acqua e alzata (fino a 0,74 m);
- carica e rilascio in un solo movimento: il tiro parte;
- fermo a braccio carico oltre mezzo secondo: controfallo, palla al portiere avversario con il tiro libero;
- il rigore del computer parte con un movimento continuo;
- nessun errore nella pagina.

## Verifiche
- **`npm run lint`**: PASS.
- **`npm run prove`** (girata insieme alla taratura): **66 PASS, 0 FAIL** su 66 passi in 18,9 minuti, con `rigore` (6 controlli).
  Gambe fuori dall'acqua 0 su 8.369, 0 su 4.461 e 0 su 1.282 campioni.
- **`npm run verifica -- --partite=0`**: superata, immagini identiche o entro la tolleranza; riferimenti non cambiati.
- **`npm run aspetto -- --no-build --solo-foto`**: «Tutto a posto»; viste iPhone 56 oggetti disegnati e 131.872 triangoli.

## Decisioni superate
- Palla in mano, alta, fin dal fischio del rigore → palla in acqua davanti a chi tira, pescata all'inizio della carica (solo disegno).
- Carica del rigore tenibile fino a 7 s → fermo a braccio carico oltre mezzo secondo = controfallo (palla al portiere; nella serie
  finale rigore sbagliato).

## Non fatto
- Le finte nel rigore non esistono già (il tasto TIRO nel rigore carica soltanto): nessun controllo da aggiungere.
- Il controfallo per il tiratore che si gira o si sposta prima di tirare: nel gioco chi tira il rigore non si muove.
- Il giudizio sul gesto (la pesca e la mano sulla palla) spetta ad Ale guardando le foto o giocando.
