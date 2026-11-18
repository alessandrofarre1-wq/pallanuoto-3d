# v0.59 — Finta di lato (dal video di Varga) e taratura dei tiri

## 1. Finta di lato
Dal secondo video di Ale (finta e tiro di Dénes Varga): prima finta larga verso la porta, poi una seconda finta **di lato**, che
secondo Ale «sposta sia il difensore che il portiere»; il tiro parte sul lato lasciato libero dal braccio del difensore.

Cosa cambia:
- **La seconda finta è di lato** (`tiri.js`, `startAct`): la prima finta resta quella di prima (verso la porta). Dalla seconda in
  poi il braccio va di lato: dalla parte della levetta se la si inclina (`controllo.js`), altrimenti dalla parte opposta alla finta
  precedente. Il gesto ruota il braccio di lato (`grafica/pose.js`, `FINTA_LATO.gesto`, solo disegno).
- **Il difensore che abbocca si sposta da quella parte** (`regole.js`, `doFake`, misure `FINTA_LATO` in `finte.js`): per 1,1 s
  il suo muro vale di più dalla parte della finta (×1,15) e molto meno dall'altra (×0,4). Non resta più «stordito» come nella
  finta verso la porta.
- **Anche il portiere si sposta** di 45 cm dalla parte della finta (`ia.js`, `gkTarget`). Sul tiro dall'altra parte para molto
  meno (−0,35); dalla stessa parte un po' di più (+0,08) (`fisica.js`, `gkFinta`).
- Il computer usa la stessa regola quando finta due volte.
- Prova `npm run finta`: due controlli nuovi (la seconda finta è di lato e cambia lato; il portiere si sposta dalla parte della finta).

## 2. Taratura: perché il computer tirava presto
Nuova sonda `strumenti/sonda-tiri.mjs`: partite computer contro computer, ogni tiro registrato con il motivo e i secondi d'azione.
Sulla v0.58 (3 partite, 311 tiri):
- in parità, un tiro su quattro era il **tiro subito dopo la ricezione** con il tiratore libero, a circa 10 s d'azione: scattava
  quasi a ogni ricezione libera;
- il **tiro al volo** dava un altro 17% (parità e superiorità);
- in superiorità il **«quick»** dei primi 3 secondi (tiro a 2 s) era frequente.

Cosa cambia (`ia.js`):
- `TIRO_LIBERATO`: il tiro subito dopo la ricezione (e al volo) si decide **una volta per ricezione**: in parità 40%, in
  superiorità 85%, in controfuga sempre. Nelle altre ricezioni si continua a far girare palla.
- `COSTRUZIONE.secondi` 7 → 11: nei primi 11 s di un'azione in parità si tira da libero solo molto vicino alla porta.
- Il «quick» in superiorità si cerca in 3 superiorità su 10 (`TIRO_LIBERATO.quick`).
- `SUPERIORITA`: pronta 7 → 9 s; la voglia di tirare cresce da 8 a 12 s (prima 9-13). Una prova con 11 s di attesa portava molte
  superiorità al tiro forzato a fine azione (conversione 31%): scartata.
- `lotta.js`, `LOTTA_FASE`: la lotta al centro arriva al pieno tra 8 e 20 s d'azione (prima 5-16): le espulsioni erano troppe e troppo
  presto.

Sonda sulla v0.59 (3 partite): tiri «liberato» dal 26% al 17% del totale; il gruppo più grande è il tiro a fine azione.

## Bilancio (8 partite ITA–HUN, per squadra; tra parentesi Mondiali 2025 / Euro League)
| | v0.58 | v0.59 |
|---|---|---|
| tiri | 51,9 | 44,6 (33) |
| gol | 16,5 | 14,4 (13,3) |
| tiri in gol | 31,8% | 32,3% (40%) |
| espulsioni | 11,2 | 11,7 (11) |
| superiorità trasformate | 41,3% | 36,4% (52%) |
| rigori | 2,4 | 2,8 (1,8) |
| azioni | 78,5 | 70,8 (circa 50) |
| durata parità | (per esito: tiro sbagliato 14,7 s, espulsione 10,2 s) | 14,3 s (tiro sbagliato 16,9 s, espulsione 11,8 s; reale 21) |
| durata superiorità | 6,7 s | 8,3 s (circa 15) |
| parità: palla persa | 10,1% | 9,1% (20%) |

Le partite cambiano con ogni ritocco e tra due giri da 8 partite c'è qualche punto di variazione (soprattutto conversioni e rigori).

## Non fatto
- Le azioni in parità durano ancora 14 s (21 nelle partite vere) e sono 71 a partita (50): il tempo si perde soprattutto nella
  ripartenza veloce (v0.57), che porta subito in attacco. Va ripensata a parte: l'attacco arriva presto e poi l'azione dura poco.
- Tiri ancora 44,6 contro 33; tiri in gol 32% contro 40%; superiorità trasformate 36% contro 52%.
- Palle perse 9% contro 20%: servono anticipi e intercetti della difesa.
- Dal video di Varga: l'alzata dall'acqua in 0,4 s e la finta larga a braccio teso di 0,6 s non sono state ritoccate (oggi la
  finta larga dura circa 0,65 s).
