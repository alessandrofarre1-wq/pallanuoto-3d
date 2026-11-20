# v0.65 — Superiorità numerica

Ale, sui cinque punti di gioco, punto 3: «Superiorità numerica: oggi va a segno il 43% delle superiorità, nella realtà il 52%».

Il metodo è lo stesso della v0.64: misuro, cambio un numero in `src/taratura.js`, rimisuro. In più c'è una sonda nuova solo per
la superiorità.

## La sonda nuova: `strumenti/sonda-superiorita.mjs`
Gioca partite computer contro computer (ITA–HUN, tempi da 8 minuti, semi diversi da `npm run taratura`).
- **Per ogni tiro con l'uomo in più registra**:
  - esito (gol, parata, muro, fuori, legno);
  - posto di chi tira, distanza, lato, apertura sulla porta;
  - motivo del tiro e gesto;
  - schema in corso e secondi dall'inizio della superiorità.
- **Per confronto**: le stesse misure per i tiri in parità.
- **Totali**: espulsioni e superiorità trasformate, anche squadra per squadra.
- **Passaggi con l'uomo in più**: quanti, per fascia di tempo, e quanti cambiano lato.

Uso: `node strumenti/sonda-superiorita.mjs --partite=6 --paralleli=3` (anche `--dist=`, `--porta=`, `--json=`).

## Cosa diceva la sonda (v0.64, 6 partite, 101 tiri con l'uomo in più)
Con l'uomo in più va in gol il 44% dei tiri (in parità il 25%). Tre cose saltavano all'occhio:
- **Le ali sui 2 metri tiravano troppo**: quasi metà dei tiri (45 su 101) partiva da chi vede poca porta. Andava in gol il 27% di
  quei tiri, contro il 57% di quelli frontali. Erano quasi tutti tiri al volo, che non guardavano l'angolo.
- **Tiri presto contro tiri tardi**: i tiri dei primi 10 s andavano in gol il 60-65% delle volte, quelli dopo i 10 s il 30%.
  Prima dei 9 s il computer poteva tirare solo subito dopo un passaggio che cambiava lato. Dopo i 9 s tirava anche da fermo, con
  difesa e portiere ormai piazzati.
- **I cambi di lato restavano costanti**: tra il 7% e il 17% dei passaggi lungo tutta la superiorità (circa 7,5 passaggi ogni
  superiorità). I tiri subito dopo un cambio di lato andavano in gol il 58% delle volte, gli altri il 34%.

## Le prove (8 partite ITA–HUN per giro, superiorità trasformate; nella v0.64 40,1%)
| giro | cosa | superiorità | scarto ITA–HUN |
|---|---|---|---|
| 1 | ali sui 2 m: niente tiro al volo, voglia di tirare ×0,25 | 34,1% | 4,6 |
| 2 | giro 1 + cambio di lato «sempre un guadagno» + portiere 0,38 | 40,3% | 3,0 |
| 3a | giro 2 + portiere 0,46 | 39,2% | 4,6 |
| 3b | giro 3a + occasioni chiare dai 7 s invece che dai 9 | 49,7% | 5,6 |
| 4a | giro 3b con il portiere a 0,38 | 47,1% | 8,0 |
| 5a | solo occasioni dai 7 s e portiere 0,38 | 44,6% | 8,8 |
| 5b | giro 5a + regola delle ali (senza il cambio di lato) | **47,1%** | 8,0 |
| 6 | giro 5b con il portiere a 0,42 | 48,5% | 6,1 |

Cosa si impara:
- **Togliere i tiri delle ali da solo peggiora** (giro 1): la superiorità si allunga e i tiri arrivano più tardi, quando sono
  peggiori.
- **Il punto decisivo è prendere le occasioni chiare dai 7 s** (giri 3a e 3b, che differiscono solo per questo: +10 punti).
- **Con i 7 s la regola delle ali aiuta**: 44,6% → 47,1%, meno tiri (38,4 → 36,3) e superiorità più lunghe (7,6 → 8,9 s).
- **Il cambio di lato «sempre un guadagno» non ha mai cambiato una scelta**: i giri 4a e 5b sono identici fino all'ultimo
  decimale. Tolto.
- **Il portiere conta poco**: da 0,38 a 0,46 si guadagnano 2-3 punti, ma con 0,46 il portiere parava solo l'11% dei tiri con
  l'uomo in più (sonda), troppo poco per essere credibile. Tenuto 0,38 (con 0,38 para il 17%).

## Cosa cambia
Nel codice (`ia.js`): con l'uomo in più chi vede poca porta (apertura sotto `SUPERIORITA.stretto`, l'ala sui 2 metri) non tira
al volo e ha meno voglia di tirare (`SUPERIORITA.strettoVoglia`). La palla va a chi vede più porta: pali e 5 metri.

Numeri cambiati in `src/taratura.js` (prima → dopo):

| numero | prima | dopo | perché |
|---|---|---|---|
| `SUPERIORITA.pronta` | 9 s | 7 s | le occasioni chiare si prendono prima che difesa e portiere si piazzino |
| `SUPERIORITA.stretto` | — | 0,5 | sotto questa apertura niente tiro al volo con l'uomo in più |
| `SUPERIORITA.strettoVoglia` | — | 0,25 | voglia di tirare di chi vede poca porta |
| `PARATA_SUP` | 0,3 | 0,38 | sui tiri nello specchio con l'uomo in più il portiere ne parava il 47% |

## Gioco contro realtà (8 partite ITA–HUN, per squadra a partita)
| voce | v0.64 | v0.65 | reale |
|---|---|---|---|
| tiri | 35,3 | 36,3 | 33 |
| gol | 12,9 | 13,9 | 13,3 |
| tiri in gol | 36,5% | 38,3% | 40% |
| espulsioni | 11,4 | 11,8 | 11 |
| espulsioni dalla lotta al centro | 66,5% | 73,0% | 66% |
| **superiorità trasformate** | **40,1%** | **47,1%** | **52%** |
| rigori | 1,6 | 2,0 | 1,8 |
| azioni a partita | 66,3 | 66,9 | 50 |
| parità: durata dell'azione | 15,4 s | 15,5 s | 21 s |
| parità: tiro sbagliato | 28,8% | 30,2% | 32% |
| parità: palla persa | 16,3% | 16,0% | 20% |
| parità: fallo in attacco | 14,4% | 12,3% | 15% |
| parità: espulsione procurata | 20,6% | 22,0% | 22% |
| palla in mano prima del passaggio | 1,01 s | 1,01 s | 0,6-1 s |

**A posto 12 voci su 15** (erano 11). Superiorità con l'uomo in più: durata 8,8 → 8,9 s; gol 38,1% → 46,3% delle superiorità;
tiro sbagliato 52,0% → 39,5%.

## Quanto è solido il risultato (tre campioni, 22 partite)
Le 8 partite della taratura sono un solo campione: tra due giri c'è qualche punto di variazione. Ho rifatto i conti su altri due:

| campione | v0.64 | v0.65 |
|---|---|---|
| taratura ITA–HUN (8 partite) | 40,1% | 47,1% |
| sonda ITA–HUN (6 partite, altri semi) | 41% | 45% |
| taratura ESP–HUN (8 partite) | 44,8% | 45,3% |

In media la superiorità sale di circa 4 punti: da circa il 42% a circa il 46%.

## Lo scarto tra le squadre
Nel database di Ale l'Ungheria ha forza 90, l'Italia 79 e la Spagna 92. Nelle 8 partite della taratura l'Ungheria batte l'Italia 8
volte su 8 con 8 gol di scarto (v0.64: 6 su 8, 4,5 gol). Non è un effetto della v0.65:
- nelle 6 partite della sonda (ITA–HUN, altri semi) lo scarto va invece da 9,2 a 1,3 gol: sommando le 14 partite, da 6,5 a 5,2;
- in Spagna–Ungheria lo scarto va da 2,3 a 4,8 gol (vittorie della Spagna da 5 a 6 su 8), ma i gol in più della Spagna vengono
  dalla parità (gol nel 17,9% → 20,7% delle azioni in parità), che la v0.65 non tocca.

Lo scarto cambia molto da un gruppo di partite all'altro, in tutte e due le versioni.

## Verifiche
- `npm run lint`: PASS.
- `npm run prove`: **36 PASS, 0 FAIL** su 36 passi in 8,6 minuti.
- `npm run verifica`: sei partite arrivate alla fine, 52 gol su 189 tiri (v0.64: 49 su 195). Le cinque immagini sono identiche ai
  riferimenti (il menu differisce dello 0,00% per la scritta «v0.65», dentro la tolleranza): riferimenti non aggiornati.
- `npm run aspetto`: «Tutto a posto», 0 gambe fuori dall'acqua, viste iPhone 56 oggetti e 141.794 triangoli (come la v0.64).
- La build finale è identica byte per byte a quella del giro 5b (i numeri qui sopra sono quelli).

## Non fatto
- Superiorità al 45-47%, ancora sotto il 52% (dentro la fascia 45-58%). Le leve rimaste: il portiere (ma con meno parate non è più
  credibile) e i pali qui sotto.
- **Pali**: il 13% dei tiri con l'uomo in più colpisce un legno (in parità il 9%). Il computer mira a 0,85-1,23 m dal centro della
  porta, che è larga 3 m: è la mira di tutti i tiri, da guardare a parte.
- Le superiorità del giocatore: qui cambia solo come gioca il computer (e il portiere, per tutti).
