# v0.66 — Gol su entrata

Ale, sui cinque punti di gioco, punto 4: «Gol su entrata (il taglio verso la porta): oggi sono quasi zero».

## La sonda nuova: `strumenti/sonda-entrate.mjs`
Gioca partite computer contro computer (ITA–HUN, tempi da 8 minuti, semi della sonda dei tiri).
- **Schemi**: quanto tempo ogni squadra usa ciascuno schema d'attacco in parità.
- **Ogni entrata che parte**:
  - ruolo, schema, blocco del compagno;
  - spazio sul difensore più vicino, medio e massimo;
  - se arriva un passaggio, dove e quando chi entra riceve;
  - se tira entro 3 s e come va il tiro.
- **Conteggio**: come sono contati i tiri di chi ha ricevuto in entrata.

Uso: `node strumenti/sonda-entrate.mjs --partite=6 --paralleli=3`. Con `--schema=entrata` dà a tutte e due le squadre lo schema
indicato.

Anche `strumenti/sonda-superiorita.mjs` registra ora, per ogni tiro con l'uomo in più:
- nome, Precisione e stamina di chi tira;
- se la superiorità è nata durante un'entrata.

## Cosa diceva la sonda (v0.65, 6 partite)
- **Nessuna entrata in 6 partite.** Il computer non ha uno schema suo e usa l'«Arco», che non ha tagliante; anche il giocatore
  parte con l'«Arco». Si entra solo con gli schemi «Entrata e copertura» e «Incrocio dei lati».
- **Con lo schema «Entrata» per tutte e due le squadre**:
  - 81 entrate per squadra a partita: una ogni 7 s di possesso;
  - chi entra riceveva nel 41% dei casi, ma a 7,7 m dalla porta e 2 s dopo l'inizio del taglio: la palla arrivava appena partito
    e il taglio finiva lì;
  - solo il 4% delle entrate finiva con un tiro;
  - partite sbilanciate: fino a 30 gol per una squadra.
- **Conteggio sbagliato**: era «entrata» solo il tiro partito entro 3 s dall'inizio del taglio. Di solito si riceve dopo, e quei
  tiri finivano tra quelli dal perimetro.

## Cosa cambia
1. **Il computer entra**: nell'8% delle sue azioni in parità manda in entrata un mezzo, Pos. 2 o 3 (`ENTRATA.azione`), anche se il
   suo schema non lo prevede. Il giocatore tiene lo schema che ha scelto.
2. **Al massimo un'entrata ogni 12 s** per squadra (`ENTRATA.ogni`; prima 7 s), anche con lo schema «Entrata» del giocatore.
3. **La palla arriva al momento giusto** (`tiri.js`, `entrataPronta`): a chi entra si passa solo quando è a meno di 5 m dalla
   porta (`ENTRATA.vicino`) e ha almeno 1 m di vantaggio sul difensore, che gli resta alle spalle (`ENTRATA.vantaggio`), o almeno
   2 m di spazio (`ENTRATA.libero`). In quel momento è il passaggio preferito e parte subito. Vale anche per il passaggio del
   giocatore con la levetta ferma.
4. **Chi riceve in entrata tira subito**: vicino alla porta, senza un difensore davanti a braccio alto, entro 1,2 s
   (`ENTRATA.tiro`).
5. **Conteggio giusto** (`statistiche.js`): è «entrata» il tiro di chi ha ricevuto tagliando, entro 2,5 s. Su questi tiri il
   portiere non ha più il piccolo vantaggio che ha sui tiri dal perimetro.
6. **Con l'uomo in più o in meno l'entrata finisce subito**: si va ai posti del 6 contro 5. Il sorteggio dell'entrata si fa solo
   nelle azioni in parità.

## Le prove
| giro | computer in entrata | entrate per squadra a partita (sonda) | gol su entrata | superiorità | espulsioni |
|---|---|---|---|---|---|
| e1 | 35%, vantaggio 0,3 m o 1,5 m di spazio | 23,1 | 23,6% | 43,4% | 9,9 |
| e2 | 20%, vantaggio 1 m o 2 m di spazio | 12,1 | 6,6% | 38,3% | 11,3 |
| e3 | 15% | 9,3 | 8,0% | 41,4% | 9,5 |
| e4 | 15%, entrata che finisce con l'uomo in più | 8,8 | 9,4% | 37,3% | 8,4 |
| e5 | come e4, sorteggio solo in parità (16 partite) | — | 7,4% | 39,9% | 9,2 |
| **e6** | **8% (16 partite)** | **4,7** | **6,1%** | **46,2%** | **10,8** |

Taratura ITA–HUN su 8 partite, e5 ed e6 su 16. Nella v0.65, su 16 partite: superiorità 46,3%, espulsioni 10,5.

## Perché l'8% e non il 15%
Con il 15% le entrate abbassavano due voci, confermato su 16 partite:
- **espulsioni**: da 10,5 a 9,2. Si spiega: un'azione che finisce con un'entrata non arriva più alla lotta al centro;
- **superiorità trasformate**: dal 46% al 40%.

Ho fatto tre controlli:
- **Prova del caso**: la v0.65 con un solo numero casuale in più per azione resta al 46,3% su tre campioni. Il livello della v0.65
  regge.
- **Codice nuovo con le entrate spente**: 46,0% e 10,6 espulsioni su 16 partite, come la v0.65. Il codice nuovo è innocuo: sono le
  entrate stesse a pesare.
- **Cause escluse con la sonda**:
  - superiorità nate durante un'entrata (solo il 5% dei tiri, e vanno bene);
  - stanchezza di chi tira (stamina uguale, 0,55 e 0,54);
  - chi tira (stessa Precisione media, 77);
  - posizione del portiere, distanza, difensore più vicino.

La causa precisa per la superiorità non l'ho trovata. Con l'8% delle azioni le entrate restano (6% dei gol in 16 partite) e le
altre voci tornano come nella v0.65.

## Gioco contro realtà (16 partite ITA–HUN, per squadra a partita)
| voce | v0.65 | v0.66 | reale |
|---|---|---|---|
| tiri | 36,0 | 36,3 | 33 |
| gol | 13,5 | 13,8 | 13,3 |
| tiri in gol | 37,6% | 38,1% | 40% |
| espulsioni | 10,5 | 10,8 | 11 |
| espulsioni dalla lotta al centro | 70,0% | 74,0% | 66% |
| superiorità trasformate | 46,3% | 46,2% | 52% |
| rigori | 2,0 | 1,8 | 1,8 |
| azioni a partita | 65,8 | 66,3 | 50 |
| parità: durata dell'azione | 15,4 s | 15,1 s | 21 s |
| parità: gol | 14,7% | 15,2% | 6-19% |
| parità: tiro sbagliato | 31,1% | 30,3% | 32% |
| parità: palla persa | 15,5% | 15,0% | 20% |
| parità: fallo in attacco | 13,6% | 15,0% | 15% |
| parità: espulsione procurata | 19,3% | 19,8% | 22% |
| palla in mano prima del passaggio | 1,01 s | 1,01 s | 0,6-1 s |
| **gol su entrata** | **0%** | **6,1%** | — |

**A posto 12 voci su 15**, come nella v0.65. Nella sonda delle entrate (altri 6 partite): 4,7 entrate a squadra per partita,
ricezioni a 3,7 m dalla porta, 5 gol su 9 tiri d'entrata.

## Verifiche
- `npm run lint`: PASS.
- `npm run prove`: **36 PASS, 0 FAIL** su 36 passi in 7,8 minuti.
  - Con il sorteggio dell'entrata in ogni azione, `npm run inferiorita` falliva per 7 cm: il centrale dell'uomo in meno stava a
    0,43 m dal centro invece di oltre 0,5 m.
  - La stessa prova fallisce con lo stesso valore anche sulla v0.65 con un solo numero casuale in più: la scena è sensibile alla
    sequenza del caso, non alle entrate.
  - Con il sorteggio solo in parità passa.
- `npm run verifica`: sei partite arrivate alla fine, 57 gol su 181 tiri (v0.65: 52 su 189).
  - Le foto «azione» e le due iPhone sono diverse dai riferimenti (54%, 40% e 44% dei punti): il sorteggio dell'entrata nella prima
    azione del computer cambia il seguito della partita.
  - Le ho guardate: grafica e interfaccia normali, giocatori in altri posti. Riferimenti aggiornati con `--partite=0`.
  - Verifica ripetuta: superata, cinque immagini identiche.
- `npm run aspetto`: «Tutto a posto», 0 gambe fuori dall'acqua, viste iPhone 59 oggetti e 142.480 triangoli, 58 e 142.224.

## Non fatto
- **Il blocco non riesce mai**: il compagno che dovrebbe bloccare il difensore di chi entra non arriva mai a meno di 0,75 m (0%
  in tutte le prove). C'era già prima: da guardare a parte.
- **Superiorità**: resta al 46% (reale 52%). Le leve rimaste: i pali (mira di tutti i tiri) e il portiere.
- **Perché entrate più frequenti abbassano la superiorità**: non l'ho trovato.
