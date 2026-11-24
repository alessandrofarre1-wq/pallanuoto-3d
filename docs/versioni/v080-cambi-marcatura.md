# v0.80 — Cambi di marcatura nei rientri: meno controfughe finte

## Richiesta
Ale (24/11/2026), punto 6 della lista: «Non funzionano molto i cambi di marcatura in difesa. Sembra che ogni giocatore guardi solo
il proprio giocatore. Così facendo però si generano diverse controfughe che in realtà non esisterebbero».

## Cosa diceva il codice
- Gli scambi di marcatura (`cambioMarcatura` in `src/ia.js`) avvengono solo nell'attacco schierato, su chi taglia verso la porta
  (e sulla rotazione del centro).
- **Nei rientri non c'erano scambi**: la funzione esce subito quando la difesa sta rientrando. Ogni difensore rientrava pensando al
  suo uomo; quello che scappava verso la porta lo inseguiva solo il suo marcatore, anche se era rimasto indietro e un compagno era
  già lì davanti.

## Cosa diceva la sonda nuova
`npm run sonda-rientri` (partite computer contro computer, ITA–HUN) conta:
- le **occasioni da schizzo o colonnello**: il portatore nuota verso la porta senza nessun difensore davanti, entro 2,5-8 m. È
  la controfuga che Ale vede nascere dove nella realtà non ci sarebbe;
- gli scambi di marcatura;
- il tempo con un attaccante libero entro 7 m dalla porta. Questa misura conta anche le zone, che lasciano apposta un attaccante:
  serve poco.

Sulla v0.78 (2 partite): **5,8 occasioni da schizzo o colonnello** per squadra a partita, 26 scambi (solo sui tagli).

## Cosa cambia
`scambiRientro` in `src/ia.js`, numeri in `RIENTRO_SCAMBI` di `src/taratura.js`.
- Mentre la difesa rientra (palla a più di 9,2 m dalla propria porta, la stessa soglia che il gioco usa per il rientro), ogni
  0,3 s si guardano gli attaccanti più avanti della palla, dal più vicino alla porta.
- Se il marcatore di uno di loro **è stato superato** (più lontano dalla porta del suo uomo di oltre 1,5 m, o a più di 5 m da lui),
  lo prende il difensore meglio piazzato: vicino a lui e dalla parte della porta. Il marcatore superato prende l'uomo lasciato
  libero. Lo scambio si fa solo se il nuovo difensore è almeno 3 m «meglio» del vecchio.
- Chi ha appena scambiato tiene il nuovo uomo per 2,5 s.
- Il difensore comandato dal giocatore e quello che rallenta il portatore non prendono un uomo nuovo. Se però il loro uomo scappa,
  può prenderlo un compagno del computer: aiuta anche la difesa del giocatore.
- Con l'uomo in più o in meno non cambia niente. Con la palla vicina alla porta valgono gli scambi di prima, sui tagli.

## Le prove (sonda dei rientri su 2 partite, taratura su 16)
| giro | cosa | occasioni da schizzo o colonnello | scambi | gol | controfughe | superiorità |
|---|---|---|---|---|---|---|
| v0.78-0.79 | — | 5,8 | 26 | 20,8 | 2,5 | 47,1% |
| r1 | scambi senza tenuta | 1,3 | 381 | 18,2 | 1,1 | 40,6% |
| r2 | con la tenuta (errore) | 3,5 | 650 | — | — | — |
| r3 | solo se il marcatore è superato, con la tenuta, palla oltre 6 m | 1,5 | 114 | 19,3 | 1,8 | 38,8% |
| **r4** | **come r3, ma solo con la palla oltre 9,2 m** | **2,5** | **96** | **19,5** | **1,9** | **42,2%** |

- Nel giro r1 i difensori si scambiavano l'uomo avanti e indietro (381 scambi a squadra per partita).
- Nel giro r2 la tenuta escludeva per errore anche il controllo «marca già bene» e partivano scambi a catena. Le 16 partite di r2
  le ho fermate.
- Il giro r3 fa uno o due scambi per rientro, ma partiva già con la palla a 6 m dalla porta. Tra 6 e 9,2 m per il gioco la difesa è
  già schierata: gli scambi cambiavano le marcature dentro l'attacco schierato e tre prove (chiamate A/B/C, entrate, sezione 3)
  non passavano più. Errore mio.
- Il giro r4 (scelto) scambia solo nei rientri veri. Le occasioni da schizzo o colonnello salgono un po' rispetto a r3 (2,5 contro
  1,5), restano meno della metà di prima (5,8). Le controfughe restano vicine alle 2 a partita delle partite vere.

## Gioco contro realtà (16 partite ITA–HUN, per squadra a partita)
| voce | v0.79 | v0.80 | reale |
|---|---|---|---|
| tiri | 41,3 | 40,3 | 33 |
| gol | 20,8 | 19,5 | 13,3 |
| tiri in gol | 50,4% | 48,4% | 40% |
| espulsioni | 8,0 | 7,8 | 11 |
| superiorità trasformate | 47,1% | 42,2% | 52% |
| controfughe a partita | 2,5 | 1,9 | circa 2 |
| parità: palla persa | 16,0% | 17,4% | 20% |
| parità: fallo in attacco | 12,8% | 10,3% | 15% |

Gol per tipo: perimetro 25% → 22%, centroboa 29% → 26%, entrata 21% → 26%, superiorità 18% → 17%, rigore 7% → 8%.

- **Superiorità**: scende dal 47% al 42% (39% in r3). Con circa 250 superiorità in 16 partite la differenza è al limite delle
  oscillazioni del caso. Forse alcune superiorità nascevano dai falli nelle controfughe finte, a difesa scomposta. È da ritarare
  insieme ai tiri.
- **Gol ancora troppi** (19,5 contro 13,3): restano i tiri del centroboa girato verso la porta e le entrate. Versione dei tiri e
  taratura finale.
- **Italia e Ungheria**: nelle partite di prova l'Ungheria segna in media il doppio dell'Italia (26,1 contro 12,9). Non dipende
  dalla v0.80: era così anche nella v0.77 (27,3 contro 13,6). Nel database le valutazioni medie dei primi 14 sono 76 per l'Italia e
  83 per l'Ungheria, e le statistiche cambiano davvero le prestazioni. Da rivedere con le rose (punto 11 di Ale: all'Italia mancano
  Di Fulvio e Di Somma).

## Prova nuova: `npm run cambi-marcatura`
- Nel rientro l'attaccante scappato, con il marcatore rimasto indietro, lo prende il difensore vicino alla porta, e non resta
  libero davanti alla porta.
- Con la palla vicina alla porta (difesa schierata) i rientri non scambiano.
- Con l'Italia in difesa comandata dal giocatore, l'attaccante scappato non va al difensore comandato: lo prende un compagno del
  computer.

## Verifiche
- **`npm run lint`**: PASS.
- **`npm run prove`**: il primo giro, con gli scambi già dalla palla a 6 m, aveva tre FAIL: `chiamate-attacco`, `entrate-integrazione` e
  `sezione3`. Gli scambi cambiavano le marcature dentro l'attacco schierato. Soglia portata a 9,2 m, come il rientro del gioco; le
  tre prove rifatte da sole passano. Secondo giro completo: **62 PASS, 0 FAIL** su 62 passi in 16,6 minuti; `cambi-marcatura` 6
  controlli; gambe fuori dall'acqua 0 su 8.651, 0 su 4.212 e 0 su 1.123 campioni.
- **`npm run verifica -- --partite=0`**: diverse la foto «azione» (38,4% dei punti) e le due viste iPhone (9,7% e 10,9%). Nello
  stesso istante i difensori sono in posizioni diverse, perché ora si scambiano l'uomo nei rientri; la grafica è normale (tabellone,
  tasti, acqua e corpi come prima). Menu e sprint iniziale entro la tolleranza. Riferimenti aggiornati con `--partite=0`; verifica
  ripetuta: superata, cinque immagini identiche.
- **`npm run aspetto -- --no-build --solo-foto`**: «Tutto a posto»; viste iPhone 56 oggetti disegnati e 131.872 triangoli, al massimo
  56 oggetti e 145.942 triangoli nelle sei viste.

## Decisioni superate
- Nei rientri nessuno scambio di marcatura: ognuno inseguiva il suo uomo → l'attaccante più avanti lo prende il difensore meglio
  piazzato quando il suo marcatore è stato superato (`RIENTRO_SCAMBI`).

## Non fatto
- La superiorità al 42% (reale 52%) e i gol ancora troppi: da ritarare con i tiri.
- Dopo il rientro gli scambi restano: il centroboa può restare marcato da un difensore piccolo. Una squadra vera, quando può,
  rimette il suo specialista sul centro. Da valutare se serve.
