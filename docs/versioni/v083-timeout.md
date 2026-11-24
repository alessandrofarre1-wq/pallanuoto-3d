# v0.83 — Time-out: palla al portiere a metà campo, squadra già schierata in attacco

## Richiesta
Ale (24/11/2026), punto 5 della lista: «time-out: chiamato quando si subisce un break, o negli ultimi minuti per preparare un
attacco; i giocatori si schierano nella metà campo avversaria; l'arbitro dà la palla al portiere a metà campo, che la passa al
compagno libero e torna in porta nuotando».

## Cosa diceva il codice
- **Ripresa** (`timeout` in `src/regole.js`): dopo il fischio tutti tornavano nella propria metà, come a inizio tempo, e il punto
  ripartiva con la palla a metà campo. La squadra doveva poi nuotare fino in attacco.
- **Quando lo chiama il computer**: dopo tre gol subiti di fila (il break), dopo tre espulsioni in 2 minuti, all'inizio del 7 contro
  6 e, a volte, quando la squadra è stanca. Mai per preparare l'attacco finale.

## Cosa cambia
1. **Ripresa come nelle partite vere** (`schieraTimeout` in `src/regole.js`): l'arbitro dà la palla al portiere a metà campo, nella
   sua metà; i compagni sono già ai loro posti d'attacco nella metà campo avversaria; i difensori sono sul loro uomo, a un metro da
   lui verso la propria porta. Il portiere passa al compagno libero (il computer dopo circa un secondo, il giocatore con PASSA) e
   torna in porta nuotando.
2. **Time-out del computer per l'attacco finale** (`TIMEOUT` in `src/taratura.js`): nell'ultimo minuto e mezzo dell'ultimo tempo,
   pari o sotto di un gol, appena ripresa la palla (entro 4 s), una volta a partita. Restano le regole di prima (break, espulsioni,
   7 contro 6, stanchezza).
3. Energia recuperata nel minuto di time-out: 0,4 come prima, ora scritta in `TIMEOUT.recupero`.

## Gioco contro realtà (16 partite ITA–HUN, per squadra a partita)
| voce | v0.82 | v0.83 | reale |
|---|---|---|---|
| time-out | 1,53 | 1,34 | fino a 2 |
| tiri | 41,0 | 39,0 | 33 |
| gol | 20,2 | 19,1 | 13,3 |
| espulsioni | 10,3 | 11,6 (a posto) | 11 |
| superiorità trasformate | 42,4% | 48,1% (a posto) | 52% |
| parità: espulsione procurata | 15,8% | 18,1% (a posto) | 22% |
| voci a posto | 6 su 15 | 8 su 15 | |

Il time-out tocca pochi momenti per partita: quasi tutte le differenze tra i due giri vengono dal caso (le partite prendono strade
diverse appena cambia una scelta).

## Prova nuova: `npm run timeout`
Sette controlli:
- il time-out viene chiamato e il gioco riprende; la palla è al portiere a metà campo, nella sua metà;
- i compagni sono schierati nella metà campo avversaria; i difensori a un metro dal loro uomo;
- il portiere passa a un compagno e torna verso la porta (3 m più vicino in 4 s);
- pari nell'ultimo minuto e mezzo il computer chiama il time-out appena riprende la palla.

## Verifiche
- **`npm run lint`**: PASS.
- **`npm run prove`** (girata insieme alla taratura): **65 PASS, 0 FAIL** su 65 passi in 18,7 minuti, con `timeout` (7 controlli).
  Gambe fuori dall'acqua 0 su 8.369, 0 su 4.461 e 0 su 1.282 campioni.
- **`npm run verifica -- --partite=0`**: superata, immagini identiche o entro la tolleranza; riferimenti non cambiati.
- **`npm run aspetto -- --no-build --solo-foto`**: «Tutto a posto»; viste iPhone 56 oggetti disegnati e 131.872 triangoli.

## Decisioni superate
- Ripresa del time-out con tutti nella propria metà e il punto con la palla a metà campo → palla al portiere a metà campo,
  compagni schierati in attacco, difensori sul loro uomo; il portiere passa e torna in porta.
- Time-out del computer solo dopo un break, tre espulsioni, il 7 contro 6 o la stanchezza → anche nell'ultimo minuto e mezzo, pari o
  sotto di un gol, per preparare l'attacco.

## Non fatto
- Nessuno schema particolare dopo il time-out: la squadra riparte con lo schema che aveva. Un «gioco da time-out» (per esempio la
  palla al centroboa o un taglio preparato) si può aggiungere se Ale lo vuole.
- Se il passaggio del portiere viene intercettato, la porta resta vuota finché lui non rientra: è il rischio vero, non è corretto.
