# v0.92 — Uomo in più che si muove: schemi del computer, ripetizione delle fasi, schema automatico della squadra di Ale

## Richiesta
Ale (27/11/2026), dopo il primo Mondiale (la parte sull'uomo in più; il resto è nella v0.91):
> «Sull'uomo in più quasi non fanno schemi e anche l'AI del mio attacco ho notato che lo schema non parte o se parte i movimenti sono
> impercettibili.»

E poi, dopo la PR della v0.91: «Continua».

## Cosa diceva il codice (misure prima, v0.91)
Sonda `sonda-schemi-uomo` (scratchpad, partite computer contro computer ITA–HUN, 4 partite, 45 superiorità):
- il computer sceglieva a caso tra quattro schemi, uno dei quali, il **«4-2 classico», ha una sola fase: 11 superiorità su 45 senza
  nessun movimento**;
- negli altri a ogni cambio di fase ci si spostava in media di 1,4-2,4 m (al massimo 3-5 m), e in 2 s si faceva circa il 70% della
  strada: gli spostamenti sotto 1,8 m si facevano scivolando sulle gambe a metà velocità (v0.53, giusto per i piccoli aggiustamenti);
- **dopo l'ultima fase si restava fermi fino alla fine** (le superiorità durano circa 9 s, l'ultima fase arriva dopo 3-5 s);
- ogni attaccante senza palla nuotava in media 0,87 m al secondo;
- **la squadra del giocatore aveva uno schema solo se lo chiamava**: la barra degli schemi si apre a ogni superiorità e, se non si
  sceglie niente, si richiude dopo 5 s lasciando il 4-2 fermo. Il primo schema predefinito del giocatore è proprio il «4-2 classico».

Taratura della v0.91 (16 partite): superiorità trasformate 37,8% (vero 52%).

## Cosa cambia
1. **Schemi del computer** (`uomo-in-piu.js` `SCELTI_COMPUTER`): solo schemi con più fasi: «4-2 che diventa 3-3», «3-3 che diventa 4-2»,
   «4-2 → 3-3 → 4-2 dall'altro lato», «Uscita del 6» (finale olimpica 2024, v0.58) e «Rotazione con la tasca» (manuale USA). Tolto il
   «4-2 classico».
2. **La rotazione continua** (`avanzaUomo`, `UOMO_SCHEMI.ripete`): dopo l'ultima fase, finita la sua durata e arrivati i compagni, lo
   schema ricomincia dalla prima finché dura la superiorità (prima l'ultima fase restava fino alla fine). Vale per il computer e per
   gli schemi del giocatore, anche quelli personali; uno schema di una sola fase resta fermo come prima. Il ritardo di chi ha poca
   Visione e Disciplina (v0.45) vale anche quando si ricomincia. L'editor lo dice nella nota dell'ultima fase.
3. **Schema automatico della squadra di Ale** (`aggiornaSchemi`, `UOMO_SCHEMI.auto`): se nei primi 2 s della superiorità non chiama
   niente, la sua squadra parte da sola con il primo dei suoi tre schemi che si muove (con i predefiniti: «3-3 che diventa 4-2») e una
   notifica lo dice. Se sceglie la base (tasto 4 o «Base» nella barra) lo schema automatico non parte; può sempre chiamarne un altro.
4. **Cambi di fase decisi** (`attackTarget`, `partita.js`, `UOMO_SCHEMI.deciso`): nei primi 2 s di una fase chi deve spostarsi di più di
   0,8 m nuota invece di scivolare sulle gambe a metà velocità.

## Numeri
**Taratura, 16 partite ITA–HUN** (`npm run taratura -- --partite=16`, confronto con le 16 della v0.91; per squadra a partita):

| voce | v0.91 | v0.92 | reale |
| --- | --- | --- | --- |
| superiorità trasformate | 37,8% | **51,3%** | 52% |
| superiorità: gol / tiro sbagliato / durata | 35,2% / 49,1% / 9,5 s | 46,5% / 40,5% / 8,2 s | |
| gol | 17,8 | 18,8 | 13,3 |
| tiri | 42,4 | 42,0 | 33 |
| tiri in gol | 42,1% | 44,9% | 40% |
| espulsioni (dalla lotta al centro) | 10,7 (62,2%) | 10,6 (59,3%) | 11 (66%) |
| gol con l'uomo in più (quota dei gol) | 22,6% | 28,9% | |

Il gol in più a squadra viene dall'uomo in più. Le superiorità trasformate restano una voce che cambia molto tra due gruppi di
partite (36-45% con la stessa v0.90), ma il 51,3% è fuori da quella variazione.

**Sonda dell'uomo in più** (4 partite): nessuna superiorità ferma (prima 11 su 45); in 19 superiorità su 38 lo schema ricomincia
almeno una volta; ogni attaccante senza palla nuota 0,96 m al secondo (prima 0,87; senza il nuoto deciso 1,06 su un altro gruppo di
partite: la misura dipende da quanto dura ogni superiorità).

## Decisioni superate
- Il computer sceglieva tra i tre schemi di partenza e l'«Uscita del 6», compreso il «4-2 classico» fermo (v0.44, v0.58) → solo schemi
  che si muovono (`SCELTI_COMPUTER`).
- L'ultima fase di uno schema restava fino alla fine della superiorità (v0.44) → si ricomincia dalla prima (`UOMO_SCHEMI.ripete`).
- La squadra del giocatore restava nel 4-2 fermo finché non chiamava uno schema (v0.44) → dopo 2 s parte da sola con il suo primo schema
  che si muove, salvo la scelta della base (`UOMO_SCHEMI.auto`).
- Nei cambi di fase si scivolava sulle gambe sotto 1,8 m (v0.53) → nei primi 2 s di una fase si nuota oltre 0,8 m
  (`UOMO_SCHEMI.deciso`); fuori dall'uomo in più lo scivolamento resta.

## Verifiche
- Nuova prova `npm run uomo-movimento` (`tests/uomo-v092.mjs`, anche nella CI), 7 controlli: schemi del computer tutti con più fasi;
  nessuno schema imposto nei primi secondi; dopo 2 s parte da solo «3-3 che diventa 4-2»; scelta la base non parte niente; fasi
  1 → 2 → 1 → 2 con una ripetizione; al cambio di fase in 2 s il 75% della strada (72% senza il nuoto deciso); nessun errore.
- `npm run uomo` (v0.44): superata; cambiato solo il testo del primo controllo (prima diceva che senza chiamata restava il 4-2 base).
- `npm run lint`: nessun errore. `npm run prove`: **73 PASS su 73** (20,8 minuti, con la prova nuova).
- `npm run verifica -- --partite=0`: «Verifica superata» (le foto 3-5 identiche ai riferimenti della v0.91).
- `npm run aspetto -- --no-build --solo-foto`: «Tutto a posto», iPhone orizzontale 43 oggetti disegnati e 130.668 triangoli (massimo
  144.602 nel gruppo dall'alto).
