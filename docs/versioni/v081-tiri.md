# v0.81 — Tiri: schizzo e colonnello solo in controfuga, beduine del centroboa, occasioni chiare

## Richiesta
Ale (24/11/2026), punti 4 e 10 della lista:
- «Troppi tiri a schizzo e colonnello, poche beduine e pochi passaggi al centroboa».
- «Le occasioni chiare (passaggio con l'uomo davanti alla porta): tirare indipendentemente dai secondi trascorsi».

## Cosa dicevano le misure (v0.80)
1. **Schizzo e colonnello del computer**: rari. Sonda dei tiri, 4 partite computer contro computer: 5 su 306 tiri.
2. **Schizzo e colonnello del giocatore**: il tasto a comparsa si accendeva ogni volta che chi ha la palla nuota verso la porta
   senza nessuno davanti, anche a metà dell'attacco schierato (per esempio dopo un taglio). Con il tasto acceso qualunque pressione
   di TIRO faceva lo speciale: in quei momenti non c'era modo di fare un tiro normale.
3. **Centroboa** (sonda nuova `npm run sonda-centro`, 4 partite computer contro computer, azioni in parità): riceveva la palla in
   18,5% delle azioni (11 palloni vicino alla porta per squadra a partita) e quasi sempre **già girato verso la porta** (77%).
   Il suo possesso finiva con un tiro nel 90% dei casi (57% di gol) e con un'espulsione procurata nell'1%. Nessuna beduina e
   nessuna sciarpa su 92 tiri (sonda dei tiri).
   - Il centroboa del computer, mentre scivola nella lotta, si girava sempre verso la porta, anche con il marcatore dietro. Una regola
     dell'orientamento (lo scivolamento) veniva prima di quella che lo teneva di spalle: quella regola valeva solo per il centroboa
     comandato da te. Di spalle alla porta il tiro è una beduina o una sciarpa; girato è un tiro classico. Per questo le beduine
     erano zero.
   - Con il marcatore al fianco, anche vicinissimo, il centroboa si girava da solo verso la porta e tirava subito.
4. **Occasioni chiare**: chi riceveva libero davanti alla porta tirava subito una volta su tre (TIRO_LIBERATO) e, nei primi 18 s
   dell'azione (COSTRUZIONE), solo entro 4,5 m.

Confronto reale per il centroboa: studio su 11 partite d'élite maschili (7 di campionato italiano, 4 di Champions League; «Elite
water polo: a technical and tactical analysis of the centre forward role»). Delle azioni del centroboa: gol 6,7%, tiro senza gol
7,2%, espulsione procurata 41,4%, fallo in attacco 17,9%, palla rubata 16,6%, passaggio sbagliato al centro 10,1%; il centroboa
procura il 67,6% delle espulsioni.

## Cosa cambia
1. **Schizzo e colonnello solo nella controfuga vera** (`occasioneControfuga` in `src/controfuga.js`, `QTE.eta` in
   `src/taratura.js`): entro 9 s dal recupero della palla. Vale per il giocatore e per il computer.
2. **Tocco o tenuta**: con TIRO illuminato in controfuga, un tocco fa lo schizzo (da lontano) o il colonnello (da vicino); tenendo
   premuto si prepara il tiro normale. Il tasto ora dice «tocco: schizzo» o «tocco: colonnello» e la pillola «Tocca TIRO · tenuto:
   tiro normale». Pagina Comandi aggiornata.
3. **Centroboa di spalle** (`CENTRO_PALLA` in `src/taratura.js`; `leggiCentro` in `src/centroboa.js`, orientamento in
   `src/fisica.js`): con la palla e il marcatore dietro o al fianco entro 1,8 m (la distanza della lotta) resta di spalle alla porta,
   anche mentre scivola nella lotta; il suo tiro è una beduina o una sciarpa. Si gira verso la porta con la girata (tasto F o nuotando con la levetta)
   o se il marcatore è davanti (anticipo) o lontano. Vale per le due squadre.
4. **Decisioni del centroboa del computer** nella lotta (`boaHold` in `src/lotta.js`): ogni 0,45-0,85 s, dopo 0,4 s di lotta, tiro
   di spalle con probabilità 0,3; dopo 0,6 s girata con probabilità 0,15; dopo 1,8 s scarico al perimetro. Prima: girata 35%, tiro
   15% solo dopo 0,8 s. Se riceve già girato verso la porta con il marcatore ancora nella lotta, aspetta 0,45 s prima di tirare
   (prima 0,12 s): se il marcatore rientra tra lui e la porta si torna alla lotta. Girato e libero tira subito, come voleva la
   v0.69.
5. **Occasione chiara** (`occasioneChiara` in `src/ia.js`, `OCCASIONE_CHIARA` in `src/taratura.js`): chi ha appena ricevuto un
   passaggio entro 5 m dalla porta, di fronte (apertura almeno 0,7), senza avversari entro 2 m e con la traiettoria libera, tira
   subito, a qualunque secondo dell'azione, anche in superiorità. Nella controfuga vera restano finta, schizzo e colonnello.
6. **Palla al centroboa prima nell'azione** (`CENTRO_ATTESA`): il vantaggio di passargliela cresce dai 3 ai 9 s d'azione (prima dai
   7 ai 15).

## Le misure dopo
### Centroboa (sonda del centroboa, 4 partite computer contro computer)
| misura | v0.80 | v0.81 | partite vere (studio) |
|---|---|---|---|
| azioni in parità con la palla al centroboa | 18,5% | 22,2% | — |
| palloni al centroboa vicino alla porta, per squadra a partita | 11,0 | 13,6 | — |
| riceve già girato verso la porta | 77% | 49% | — |
| il suo possesso finisce con un tiro | 90% | 62% | 14% |
| finisce con un'espulsione procurata | 1% | 21% | 41% |
| palla tenuta in media | 0,55 s | 0,98 s | — |
| beduine e sciarpe sui suoi tiri | 0 | 15% (3 beduine, 7 sciarpe) | la maggior parte |
| tiri del centroboa per squadra a partita | 9,9 | 8,5 | — |

Quando riceve ancora girato (una volta su due) il centroboa è libero, con il marcatore a più di 1,8 m, oppure ha il marcatore
davanti (anticipo, soprattutto nel pressing). Si gira e tira, e segna circa 6 volte su 10. Nelle partite vere lì arriverebbe
l'aiuto di un compagno o un fallo: è un lavoro della difesa (vedi «Non fatto»).

### Varianti provate (sonda del centroboa, 4 partite ciascuna; il caso pesa)
| variante | cosa | tiro / espulsione nel suo possesso | beduine e sciarpe | palloni al centro |
|---|---|---|---|---|
| a | di spalle con il marcatore entro 1,3 m; occasione chiara entro 6 m | 72% / 11% | 2 | 11,1 |
| a3 | + palla al centro dai 3 s; occasione chiara entro 5 m | 78% / 11% | 4 | 11,6 |
| a4 | + vantaggio dell'ingresso classico 1,2 | 74% / 12% | 6 | 13,5 |
| a5 | + di spalle fino a 1,8 m (la lotta) | 66% / 17% | 9 | 11,9 |
| a6 | + ingresso classico 2 | 71% / 14% | 9 | 15,5 |
| a7 | ingresso 1,2; girato con il marcatore vicino aspetta 0,45 s | 67% / 25% | 5 | 13,1 |
| **a8** | **+ beduina o sciarpa 30% dopo 0,4 s, girata 15%** | **62% / 21%** | **10** | **13,6** |

- La variante «a» ha mostrato la causa vera delle beduine a zero: anche con il marcatore entro 1,3 m il centroboa del computer
  restava girato, per la regola dello scivolamento (corretta da lì in poi).
- Con l'occasione chiara entro 6 m e apertura 0,6 si tirava subito circa 7 volte in più per squadra a partita: ristretta a 5 m e 0,7.
- a6 portava più palloni al centro, ma di più anche quelli ricevuti già girato, con più gol: scartata.

### Tasto a comparsa
Sonda dei rientri, 2 partite computer contro computer: 2,8 occasioni di schizzo o colonnello per squadra a partita, tutte entro
9 s dal recupero. Il computer le aveva già quasi solo nelle controfughe vere. Il cambio pesa per il giocatore: nell'attacco
schierato il tasto non si accende più, e con il tasto acceso tenendo premuto parte il tiro normale. Da qui non si misura quanti
speciali faccia Ale giocando.

### Gioco contro realtà (16 partite ITA–HUN, per squadra a partita)
| voce | v0.80 | v0.81 | reale |
|---|---|---|---|
| tiri | 40,3 | 41,4 | 33 |
| gol | 19,5 | 19,3 | 13,3 |
| tiri in gol | 48,4% | 46,5% | 40% |
| espulsioni | 7,8 | 9,8 (a posto) | 11 |
| espulsioni dalla lotta al centro | 52,6% | 59,0% | 66% |
| superiorità trasformate | 42,2% | 43,3% | 52% |
| rigori | 2,0 | 1,4 | 1,8 |
| parità: gol | 25,4% | 23,5% | 6-19% |
| parità: espulsione procurata | 12,4% | 15,6% | 22% |
| voci a posto | 4 su 15 | 5 su 15 | |

Gol per tipo: perimetro 22% → 25%, superiorità 17% → 22%, entrata 26% → 22%, centroboa 26% → 26%, rigore 8% → 5%. La variante a7
(16 partite) dava 20,2 gol, 42,4 tiri, 9,4 espulsioni e 47,2% di superiorità: tra due giri le differenze di un punto sono caso.

## Prova nuova: `npm run tiri-centro`
Dieci controlli:
- con il marcatore dietro, al fianco e al fianco a 1,5 m il centroboa resta di spalle e il suo tiro è beduina o sciarpa; con il
  marcatore in anticipo o lontano si gira e tira di fronte;
- il centroboa del computer che decide di tirare nella lotta tira di spalle;
- libero a 4,5 m davanti alla porta, 3 s dopo l'inizio dell'azione, tira subito; non con un avversario a 1,4 m né da 6,5 m.

`npm run sezione4` ha due controlli nuovi: nell'attacco schierato (palla presa 15 s prima) nessun tasto; tenendo premuto TIRO nella
controfuga parte il tiro normale.

`tests/nuoto-coerente-v050.mjs` è adeguata alla regola nuova: le sue scene di colonnello e schizzo «avanzando» avevano un possesso
cominciato più di 100 s prima. Ora la palla è recuperata da 2 s, cioè una controfuga vera.

## Verifiche
- **`npm run lint`**: PASS.
- **`npm run prove`** (girata insieme alla taratura): **62 PASS, 1 FAIL** su 63 passi in 22,5 minuti. Il FAIL è `nuoto-coerente`:
  «colonnello disponibile avanzando» atteso, trovato nessuno. La scena aveva un possesso vecchio (vedi sopra). Adeguata e rifatta
  da sola: PASS. Gambe fuori dall'acqua 0 su 7.488, 0 su 5.271 e 0 su 1.185 campioni. `tiri-centro` 10 controlli; `sezione4` con
  i due controlli nuovi.
- **`npm run verifica -- --partite=0`**: superata, immagini identiche o entro la tolleranza; riferimenti non cambiati.
- **`npm run aspetto -- --no-build --solo-foto`**: «Tutto a posto»; viste iPhone 56 oggetti disegnati e 131.872 triangoli, al massimo
  145.942 triangoli nelle sei viste.

## Decisioni superate
- Tasto a comparsa di schizzo e colonnello ogni volta che chi ha la palla nuota verso la porta senza nessuno davanti (v0.31) → solo
  nella controfuga vera, entro 9 s dal recupero.
- Con il tasto acceso qualunque pressione di TIRO faceva lo speciale → un tocco fa lo speciale, tenuto il tiro normale.
- Centroboa con la palla di spalle solo con il marcatore proprio dietro, e quello del computer, mentre scivolava nella lotta, sempre
  girato → di spalle con il marcatore dietro o al fianco entro 1,8 m, per le due squadre.
- Centroboa del computer nella lotta: girata 35% dopo 0,6 s, tiro 15% dopo 0,8 s; girato tirava dopo 0,12 s → beduina o sciarpa 30%
  dopo 0,4 s, girata 15% dopo 0,6 s; girato con il marcatore ancora nella lotta aspetta 0,45 s.
- Tiro subito dopo una ricezione libera una volta su tre, nei primi 18 s solo entro 4,5 m → le occasioni chiare si tirano sempre.
- Palla al centroboa: vantaggio dai 7 ai 15 s d'azione → dai 3 ai 9 s, più un vantaggio per l'ingresso classico.

## Non fatto
- Il centroboa riceve ancora girato verso la porta circa una volta su due: libero o con il marcatore davanti (anticipo). Si gira e
  tira con circa il 60% di gol. Va affrontato con la difesa: anticipo più spesso al fianco, aiuto del compagno sul passaggio
  scavalcato, fallo del marcatore che resta alle spalle.
- Fallo in attacco e palla rubata al centroboa con la palla restano rari (1% e 2% del suo possesso, veri 18% e 17%).
- Gol (19,3) e tiri (41,4) ancora troppi, azioni a partita 72 (vere 50): taratura finale.
- Il gesto della beduina e della sciarpa è quello di prima (solo disegno), non rivisto.
- Da qui non si misura quanti schizzi e colonnelli faccia Ale giocando: serve il suo giudizio.
