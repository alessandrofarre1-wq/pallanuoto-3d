# v0.82 — Cambi volanti: in transizione, da metà campo, niente palla a chi è appena entrato

## Richiesta
Ale (24/11/2026), punto 9 della lista: «cambi volanti: non quando l'attacco è già impostato; il sostituto deve entrare da metà campo
con il cinque; niente passaggi a un giocatore appena entrato a 20 m».

## Le regole
Regole World Aquatics in vigore dal 25 giugno 2025 (parte sei, art. 18): la zona dei cambi volanti sta sul lato delle panchine e
va «dalla linea di porta davanti alla panchina alla metà campo». Nel gioco il cinque avveniva a 3,2 m dalla propria linea di porta:
lecito, ma lontano dall'azione. Spostarlo vicino alla metà campo resta dentro la regola.

## Cosa diceva il codice
- Il computer cambiava in qualunque momento: la regola «mai mentre si difende» (Ale, 15/11/2026) valeva solo per i cambi del
  giocatore. Il cambio del computer partiva subito.
- Il sostituto compariva dietro la propria linea di porta ed entrava a 2,7 m da lì, a più di 20 m dalla porta d'attacco. Per i
  compagni era subito un appoggio come gli altri.

## Cosa diceva la sonda nuova
`npm run sonda-cambi` (2 partite computer contro computer, ITA–HUN), sulla v0.81:
- 24 cambi volanti per squadra a partita: il 44% cominciava in difesa, il 30% ad attacco già impostato;
- chi esce restava fuori 7,9 s in media; il cinque avveniva a 2,7 m dalla propria linea di porta;
- 29 passaggi a chi era appena entrato (entro 10 s), 4 lunghi più di 12 m, con il ricevente a 20-24 m dalla porta;
- energia di chi è in acqua: media 70%, sotto il 35% per il 14,2% del tempo, sotto il 20% per l'8,7%.

## Cosa cambia
Numeri in `PANCHINA` di `src/taratura.js`.
1. **Zona dei cambi vicino alla metà campo** (`zonaCambi` in `src/panchina.js`): a 11 m dalla propria linea di porta, 1,5 m prima
   della metà campo (prima 3,2 m). Il sostituto compare sul bordo a 8,5 m (prima dietro la linea di porta) e raggiunge la zona
   mentre il compagno nuota verso di lui; poi il cinque.
2. **Solo in transizione** (`momentoUtile`): un cambio volante comincia quando la squadra attacca, chi esce non ha la palla ed è
   lontano dall'azione, e la squadra ha la palla da meno di 7 s o la palla è ancora nella propria metà. Mai ad attacco impostato
   né in difesa. Vale per il giocatore e per il computer: il computer mette il cambio in coda e aspetta il momento.
3. **Niente palla a chi è appena entrato** (`sostitutoLontano` in `src/difesa-cambi.js`, usata da `bestPassTarget`): per 10 s dopo
   il cinque il sostituto non è un appoggio finché non arriva a 10,5 m dalla porta d'attacco. La stessa soglia che la difesa usa per
   tornare a marcarlo. I passaggi del giocatore con la levetta restano liberi.
4. **Cambi liberi del computer** (`cambiLiberiDelComputer`): a gioco fermo con i cambi liberi (dopo un gol, nel time-out, tra i
   tempi) il computer cambia subito chi è sotto il 45% di energia, fino a due giocatori. Prima ne cambiava uno alla volta. Serve
   perché con i volanti solo in transizione i cambi scendevano e i giocatori restavano più stanchi (variante b1 qui sotto).

## Le misure dopo (sonda dei cambi, 2 partite)
| misura | v0.81 | b1: solo transizione | b2: + liberi 55%, 3 per volta | **b3: liberi 45%, 2 per volta (scelta)** |
|---|---|---|---|---|
| cambi volanti per squadra a partita | 24,0 | 11,0 | 6,0 | **9,3** |
| tutti i cambi (anche a gioco fermo e dal pozzetto) | 31,8 | — | — | **46,5** |
| cominciano in difesa | 44% | 0% | 0% | **0%** |
| cominciano ad attacco impostato | 30% | 0% | 0% | **0%** |
| chi esce resta fuori | 7,9 s | 7,0 s | 7,0 s | **6,2 s** |
| cinque a metri dalla propria porta | 2,7 | 10,5 | 10,5 | **10,5** |
| passaggi oltre 12 m a chi è appena entrato | 4 su 29 | 0 su 19 | 0 su 16 | **0 su 24** |
| energia in acqua: media | 70% | 66% | 76% | **75%** |
| sotto il 35% di energia | 14,2% del tempo | 18,9% | 5,9% | **8,2%** |
| sotto il 20% di energia | 8,7% | 12,6% | 3,1% | **4,2%** |

La b2 usava la soglia 55% e tre giocatori per volta: più energia, ma ancora più cambi. Il numero dei cambi a gioco fermo dipende
anche da quanti gol si segnano (oggi troppi, 19 per squadra contro i 13 veri): con la taratura finale scenderà.

## Gioco contro realtà (16 partite ITA–HUN, per squadra a partita)
| voce | v0.81 | v0.82 | reale |
|---|---|---|---|
| tiri | 41,4 | 41,0 | 33 |
| gol | 19,3 | 20,2 | 13,3 |
| tiri in gol | 46,5% | 49,2% | 40% |
| espulsioni | 9,8 | 10,3 (a posto) | 11 |
| espulsioni dalla lotta al centro | 59,0% | 60,0% (a posto) | 66% |
| superiorità trasformate | 43,3% | 42,4% | 52% |
| rigori | 1,4 | 2,1 | 1,8 |
| azioni a partita | 72,4 | 76,0 | 50 |
| parità: durata dell'azione | 13,5 s | 12,7 s | 21 s |
| voci a posto | 5 su 15 | 6 su 15 | |

Con i giocatori più riposati (energia media 75% contro 70%) si gioca un po' più in fretta e si segna un po' di più: gol +0,9 a
squadra, al limite delle oscillazioni del caso (circa 0,6). Da rivedere nella taratura finale insieme ai gol.

## Prova nuova: `npm run cambi-volanti`
Nove controlli:
- il momento utile: sì con la palla appena recuperata o nella propria metà, no ad attacco impostato, no in difesa;
- ad attacco impostato il computer mette in coda il cambio del giocatore stanco e aspetta; in transizione il cambio parte con il
  cinque, a 11,5 m dalla propria linea di porta;
- chi è appena entrato a 17 m dalla porta non è scelto per il passaggio;
- a gioco fermo con i cambi liberi il computer cambia subito i due giocatori stanchi.

## Verifiche
- **`npm run lint`**: PASS.
- **`npm run prove`** (girata insieme alla taratura): **64 PASS, 0 FAIL** su 64 passi in 18,1 minuti, con `cambi-volanti` (9
  controlli) e `sezione5` (13 controlli, tutti superati: il computer cambia 7 volte in 6 minuti). Gambe fuori dall'acqua 0 su 8.230,
  0 su 4.650 e 0 su 1.232 campioni.
- **`npm run verifica -- --partite=0`**: superata, immagini identiche o entro la tolleranza; riferimenti non cambiati.
- **`npm run aspetto -- --no-build --solo-foto`**: «Tutto a posto»; viste iPhone 56 oggetti disegnati e 131.872 triangoli, al massimo
  145.942 triangoli nelle sei viste.

## Decisioni superate
- Zona dei cambi a 3,2 m dalla propria linea di porta, sostituto che compare dietro la linea di porta → zona a 11 m (vicino alla
  metà campo, regole 2025 art. 18), sostituto che compare sul bordo a 8,5 m.
- Cambio volante del giocatore in qualunque momento d'attacco, del computer in qualunque momento → solo in transizione (palla da meno
  di 7 s o nella propria metà), per tutti e due; il computer aspetta in coda.
- Il sostituto appena entrato era subito un appoggio → riceve la palla quando arriva a 10,5 m dalla porta d'attacco (per 10 s).
- A gioco fermo il computer cambiava un giocatore alla volta → cambia subito fino a due giocatori sotto il 45% di energia.

## Non fatto
- Due cambi volanti insieme nella stessa transizione: il gioco ne gestisce uno alla volta (un solo sostituto visibile per squadra).
- Il numero dei cambi a gioco fermo è alto finché i gol restano troppi.
- I cambi del giocatore: il pulsante CAMBI consiglia solo nei momenti utili, quindi ora compare solo in transizione.
