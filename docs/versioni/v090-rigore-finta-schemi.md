# v0.90 — Rigore (busto e schieramento), finta senza avvitamento e senza scatti, schemi del computer contro il pressing, giocatore in porta

## Richiesta
Ale (26/11/2026), con una foto del rigore:
1. «Dalla foto allegata vedo un problema perché la posizione è innaturale. Se il giocatore tiene il braccio in quel modo deve ruotare
   un po' il busto e le spalle verso la palla.»
2. «All'inizio del movimento di finta continua a esserci questo avvitamento veloce e innaturale che, a questo punto, se non sai
   governare, ti chiederei di togliere (credo sia un residuo della finta che ti avevo mandato).»
3. «Farei un check sull'intelligenza artificiale dei giocatori. A volte i due giocatori esterni rimangono a palleggiare diverso tempo
   facendo scadere il tempo dell'azione e non chiamando nessuno schema. Se la difesa è in pressing uno schema va sempre chiamato in modo
   da provocare il movimento della difesa ed eventuali scoperture. Se il primo schema non va a buon fine e c'è ancora tempo, se ne chiama
   un secondo. Altro punto più semplice: a volte quando il portiere recupera palla un giocatore va verso la porta entrandoci dentro.
   Finché il portiere non la passa a un compagno, il giocatore continua a nuotare dentro la porta.»
4. «Nei rigori ho notato che schieri tutte le due squadre in linea. In realtà non succede così: a fianco al tiratore rimangono 2 uomini
   della squadra avversaria pronti a recuperare palla e al massimo altri due della squadra che sta attaccando per recuperare palla anche
   loro, gli altri giocatori stanno in mezzo al campo rispettando le posizioni. Questo perché se il giocatore che tira sbaglia, si può
   partire subito in controfuga.»
5. Poi, con una registrazione dello schermo (26/11, 6,7 s a 60 fotogrammi al secondo) e dopo la prima versione: «Questo è il movimento
   innaturale di cui parlo: intanto parte il movimento di finta e la palla viene traslata da davanti al giocatore alla sua mano e poi
   parte quel movimento molto veloce che sembra quasi uno spasmo. Quindi o va rallentato o va tolto.» E, dopo il primo resoconto,
   «Puoi procedere».

## Cosa diceva il codice (misure prima)
- **Rigore, posizione iniziale** (v0.88, `RIGORE_VISTA`): braccio teso dietro la schiena verso la palla in acqua, ma spalle e busto
  dritti verso la porta: la foto di Ale.
- **Avvio della tenuta di TIRO** (v0.74 e v0.77: la posa registrata da Ale, Plask, raccordata in 0,70 s dalla posa in acqua). Misura
  nuova (rotazione attorno alla verticale della linea delle anche e di quella delle spalle, fotogramma per fotogramma): **il bacino, e
  con lui le gambe, girava di 56° in 0,7 s, fino a 126° al secondo, più delle spalle (32°)**. In acqua il caricamento lo fanno spalle e
  busto sopra le gambe che pedalano: era l'avvitamento.
- **Schemi del computer**: le entrate (A, B, C) partivano solo se la palla arrivava per caso al punto o al mezzo destro, con il
  portatore pressato, dopo 6 s e 2 passaggi, e con un compagno smarcato a cui passare: contro il pressing non lo è quasi mai. Sonda
  nuova (2 partite ITA–HUN, possessi in parità contro il pressing): **57% dei possessi senza nessuno schema, e il 19% di quelli lunghi
  almeno 12 s**; due schemi nello stesso possesso 3 volte.
- **Giocatore in porta**: nell'«apertura del 2» il numero 3 doveva restare «dietro la palla del portiere», 3,5 m oltre la palla: con la
  palla al portiere sulla linea di porta, dentro la rete. Il computer passa subito e non si vedeva; il giocatore, che tiene il portiere
  finché cerca il passaggio, lo vedeva entrare in porta. Sonda: **35 casi in 2 partite** (sempre nella squadra del giocatore).
- **Schieramento del rigore**: tutti i giocatori di movimento in fila sulla linea dei 6 metri, alternati, dai 3 m in poi.
- **Il video** (giocatore del computer, fotogramma per fotogramma): la palla arriva sull'acqua davanti a lui e in 2-3 fotogrammi è nella
  mano già alta; il braccio sale come nella finta; poi in circa 5 fotogrammi (0,08 s) il corpo passa da dritto con il braccio alto a
  disteso in nuotata con la palla davanti alla testa. Ricostruito nel gioco con una sonda nuova (scatti del corpo disegnato e salti della
  palla, partite computer contro computer) e rigiocando gli stessi casi fotogramma per fotogramma:
  - **dopo la finta il computer si distendeva subito a nuotare verso il suo posto**, con il braccio ancora carico (`aiCarrier` gli dava
    sempre come meta il suo posto, anche durante la finta e l'attesa prima del gesto dopo, `p.fintaPronto`); 3 finte su 5 in 2 partite;
  - il **raccordo del disegno** tra due pose (v0.70, `grafica/gesto-vista.js`) durava **sempre 0,08 s**, anche quando il braccio passava
    dalla carica sopra la testa alla palla davanti in acqua (circa un metro);
  - **alla presa il raccordo si azzerava**: corpo e braccio passavano in un fotogramma dalla posa di ricezione a quella con la palla in mano
    (107 scatti del corpo alla presa in 2 partite) e la palla volava da sola fino alla mano già alta;
  - all'inizio di un gesto la palla disegnata poteva saltare di 18-50 cm in un fotogramma (palla mezza davanti alla testa che torna di
    colpo in mano, palmo che si gira).

## Cosa cambia
1. **Rigore, busto e spalle verso la palla** (solo disegno, `grafica/pose.js`, `RIGORE_VISTA.busto` 0,5 rad, circa 29°): la spalla del
   braccio che tira va indietro verso la palla, il busto si torce e la testa resta verso la porta. Foto `docs/immagini/v090-rigore-busto.png`.
2. **Avvio della finta senza avvitamento** (solo disegno, `grafica/tiro-plask-vista.js`, `PLASK_ANCHE.quota` 0,3): nella posa registrata il
   bacino tiene solo il 30% della sua rotazione attorno alla verticale; la schiena resta dov'era, quindi spalle, braccio e palla sono
   quelli di prima e il busto si torce sopra le anche. Vale per la tenuta, le finte e il tiro (giocatore e computer). Il raccordo resta
   quello della v0.77; tempi del gioco invariati. Foglio prima/dopo `docs/immagini/v090-avvio-tenuta.png`.
3. **Schemi del computer contro il pressing** (`entrate.js` `schemaDovuto`, `appoggioPerSchema`, `segnaSchema`; `ia.js`; `SCHEMI_PRESSING`
   in `taratura.js`): contro il pressing, in parità, dopo 6 s e 2 passaggi lo schema è dovuto. Il portatore porta la palla dove può
   partire (al punto per A e B, al mezzo destro per C) e il passaggio che avvia lo schema va anche a un compagno marcato, purché la linea
   sia sicura (rischio di intercetto sotto 0,3): è il movimento dello schema che crea lo spazio. Se dopo 2,5 s non è partito, entra il
   mezzo del lato debole (lontano dalla palla). Un secondo schema parte 7 s dopo l'inizio del primo, se non è finito con un tiro e restano
   almeno 9 s di possesso; al massimo due per possesso. Vale solo per il computer (il giocatore chiama i suoi con A/B/C).
4. **Nessuno in porta** (`ia.js`, `CONTRO.dietroPortiere` 4): nelle aperture del portiere nessun posto è a meno di 4 m dalla propria
   linea di porta; il numero 3 dell'«apertura del 2» aspetta davanti al portiere.
5. **Schieramento del rigore** (`regole.js` `setupPenalty`, `RIGORE_SCHIERA`): sulla linea dei 6 metri, ad almeno 3 m dal tiratore, i 2
   difensori più vicini al dischetto (dentro, uno per lato) e al massimo 2 attaccanti (fuori); gli altri a coppie affiancate a metà
   campo, appena nella metà di chi tira, su corsie larghe: se il rigore è sbagliato la squadra che difende parte subito in controfuga.
   Nella serie finale dei rigori nessuno vicino al tiratore.

6. **Dopo la finta il computer resta dritto** (`ia.js` `aiCarrier`, `FINTA_RITMO.scivolo` 1,2 m in `taratura.js`): durante la finta e
   finché non parte il gesto dopo (`p.fintaPronto`) chi ha la palla si sposta al massimo di 1,2 m alla volta verso il suo posto, cioè con la
   bicicletta in verticale; niente più nuotata con il braccio carico. È il «va tolto» di Ale. Vale solo per il computer.
7. **Raccordi più lenti per i grandi spostamenti** (solo disegno, `grafica/gesto-vista.js`, `RACCORDO_VISTA`): il raccordo tra due pose
   dura quanto serve a non superare 3 unità del corpo al secondo con la giuntura che si sposta di più (circa 3,3 m/s), fino a 0,4 s; i
   piccoli cambi restano a 0,08 s e l'ingresso in un gesto resta dentro la carica (al massimo l'80% del tempo che manca all'accenno della
   finta o alla frusta del tiro, mai oltre il 55% del tempo al rilascio). È il «va rallentato».
8. **Presa senza scatto** (solo disegno, `grafica/gesto-vista.js`): alla presa il corpo raccorda la posa di ricezione con quella della
   palla in mano invece di cambiarla in un fotogramma.
9. **Presa dall'acqua** (solo disegno, `grafica/pose.js`, `PRESA_ACQUA`): quando un passaggio arriva basso (palla sotto 0,3 m, il
   passaggio morbido sull'acqua) e chi riceve è dritto, la palla resta dov'è stata presa e la mano la raccoglie e la porta su in 0,32 s,
   come la pesca della v0.63; se chi riceve riparte a nuotare la raccolta si interrompe e la palla va davanti alla testa.

## Misure
| | prima | dopo |
|---|---|---|
| avvio della tenuta: rotazione del bacino | 56°, fino a 126°/s | **18°, fino a 42°/s** |
| avvio della tenuta: rotazione delle spalle | 32° | 32° (invariata) |
| rigore: spalla del braccio che tira dietro l'altra | 0 | 0,19 (unità del corpo) |
| giocatori in porta con la palla al portiere (2 partite) | 35 casi | **0** |
| possessi in parità contro il pressing senza schemi (2 partite) | 57% (66 su 116) | **38%** (51 su 133) |
| — di quelli lunghi almeno 12 s | 19% (8 su 43) | **7%** (4 su 55) |
| possessi con due schemi | 3 | **18** |
| finte del computer seguite dalla nuotata con il braccio carico (prima del gesto dopo) | 3 su 5 (2 partite) | **0** (assetto massimo 0,03) |
| scatti del corpo con la palla in mano, senza gesti (testa oltre 9 cm o corpo oltre 10° in un fotogramma; 2 partite da 4 × 4 min) | 114 | **25** |
| — di cui nel fotogramma della presa | 107 | **23** |
| raccordo tra due pose con un metro di spostamento | 0,08 s | **0,33 s** |
| palla disegnata oltre 20 cm in un fotogramma nei primi 0,15 s dopo la presa | 136 | 505 |
| — all'inizio di un gesto (di cui entro 0,35 s dalla presa) | 71 (44) | 130 (107) |
| — durante la carica del passaggio | 692 | 631 |

Gli spostamenti veloci della palla in più sono quasi tutti subito dopo la presa: prima il braccio cambiava posa di colpo e la palla era
già in mano dopo 0,12 s; ora la palla arriva in mano insieme al braccio, che si muove per circa 0,3 s, e il tratto più veloce cade in quei
primi 0,15 s; quando dopo la presa parte subito un gesto (tiro al volo, passaggio di prima) il braccio va dalla posa a metà raccordo a
quella del gesto in 0,08 s. Nella presa ripresa di fronte (foto qui sotto) la mano prende la palla davanti, la porta di lato e
poi la alza in modo continuo, mentre prima la palla veniva sparata sopra la testa in 4 fotogrammi. Da guardare nelle partite di Ale.
Foto: `docs/immagini/v090-presa.jpg` (la stessa presa di un passaggio morbido, prima e dopo) e `docs/immagini/v090-dopo-finta.jpg` (finta
del computer nella versione nuova: arriva nuotando con la palla, si alza, finta, resta dritto con il braccio carico e si sposta appena).

### Gioco contro realtà (16 partite ITA–HUN, per squadra a partita)
| voce | v0.89 | v0.90 senza la correzione della finta | v0.90 | reale |
|---|---|---|---|---|
| tiri | 39,9 | 39,5 | 40,9 | 33 |
| gol | 17,6 | 17,3 | **18,9** | 13,3 |
| gol dell'Italia / dell'Ungheria | 13,1 / 22,0 | 12,3 / 22,3 | 13,8 / 24,0 | |
| tiri in gol | 44,0% | 43,7% | **46,2%** | 40% |
| tiri nello specchio | 77,2% | 77,5% | 78,8% | circa 67% |
| espulsioni | 11,5 | 10,9 | 11,3 | 11 |
| espulsioni dalla lotta al centro | 59,6% | 55,5% | 55,8% | 66% |
| superiorità trasformate | 47,2% | 36,2% | 42,8% | 52% |
| rigori | 1,6 | 1,8 | 1,6 | 1,8 |
| azioni a partita | 74,6 | 75,8 | 75,5 | 50 |
| parità: durata dell'azione | 13,1 s | 12,7 s | 12,8 s | 21 s |
| parità: gol | 19,3% | 20,3% | 21,7% | 6-19% |
| gol su entrata (taglio), quota dei gol | 19,4% | 28,4% | 28,1% | |
| voci a posto | 7 su 15 | 7 su 15 | 6 su 15 | |

- **Schemi contro il pressing**: più gol su entrata (19% → 28% dei gol), con i gol totali quasi uguali; meno espulsioni dalla lotta al centro
  (la palla va meno al centroboa contro il pressing).
- **Correzione della finta**: il computer che dopo la finta resta dritto tira più spesso da lì: gol 17,3 → 18,9, tiri in gol 43,7% → 46,2%
  (sempre meno dei 19,9 gol della v0.88). Da guardare con il ritmo (sotto, «Non fatto»).
- **Superiorità**: nella prima taratura da 16 partite erano scese al 36%. Controllate con altri tre campioni: la v0.90 senza gli schemi
  contro il pressing (stessi semi) 43,7%; la sonda delle superiorità (12 partite, altri semi) v0.89 36% e v0.90 37% (gol per tiro con
  l'uomo in più 43% e 42%); la sonda per origine dell'espulsione (10 partite, stessi semi per le due versioni) 43% con gli schemi e 45%
  senza, con le superiorità nate durante un taglio al 49%. Il calo non si ripete: tra due gruppi da 12-16 partite la stessa versione
  cambia anche di 10 punti (v0.89: 47% e 36%). Nessun cambio alle superiorità; nella versione finale 42,8%.

## Prove
- **Nuova `npm run ritocchi`** (`tests/ritocchi-v090.mjs`, anche nella CI), sedici controlli: raccordo di una posa che si sposta di 1
  unità del corpo almeno 0,3 s (0,33), piccolo spostamento ancora 0,08 s, ingresso in un gesto dentro la carica, alla presa il corpo parte
  dalla posa di prima; nel rigore 2 difensori e al massimo 2 attaccanti vicino al tiratore, sulla linea dei 6 metri ad almeno 3 m, gli
  altri 7 a metà campo; spalla del braccio che tira dietro l'altra e palla in acqua; nella serie finale nessuno vicino; all'avvio della
  tenuta il bacino gira al massimo di 25° e sotto 70°/s, e le spalle più delle anche; portiere con la palla per 8 s nell'apertura del 2
  senza compagni nella porta; dopo la finta, con il posto a 10 m, chi ha la palla resta dritto fino al gesto dopo (assetto massimo 0,03,
  1,2 m alla volta); nessun errore.
- **Adattate**: `tests/tiro-registrato.mjs` (v0.74 di Codex): i piedi della posa registrata si confrontano con quelli della clip girati
  della rotazione tolta al bacino (`s.giroAnche`), soglia invariata, errore 2e-16; `tests/finte-v085.mjs`: le finte scelte dal gioco
  misurate sono 20 invece di 12 (ognuno usa il suo braccio 85 volte su 100: con il computer che dopo la finta resta dritto cambia la
  sequenza del caso nella scena e nelle prime 12 era uscito solo il braccio piegato; il disegno è lo stesso, verificato rigiocando la
  scena senza la correzione).

## Verifiche
- **`npm run lint`**: PASS.
- **`npm run prove`** (71 passi): primo giro 70 PASS e 1 FAIL (`tiro-registrato`, i piedi della posa registrata, adattata); dopo la
  correzione della finta 69 PASS e 2 FAIL (`finte`: 12 finte scelte dal gioco tutte con il braccio piegato, adattata a 20; `finte-mano`:
  la palla si staccava di 2 mm dal palmo nella tenuta di TIRO, corretto lasciando il raccordo della palla solo senza gesti, poi tolto del
  tutto); giro finale sulla versione definitiva **71 PASS su 71** in 18,8 minuti.
- **`npm run verifica -- --partite=0`**: «3-azione» diversa dal riferimento per la sola situazione di gioco (stesso istante del primo
  tempo in 6 contro 5, giocatori in punti diversi per schemi, rigore e finta), «4-iphone-piccolo» e «5-iphone-orizzontale» per la posa di
  un paio di giocatori (0,7% e 0,6% dei punti); tabellone, tasti ed energia a posto. Controllate, riferimenti 3-5 aggiornati con
  `npm run verifica:aggiorna -- --partite=0` («1-menu» e «2-sprint» lasciati, entro la tolleranza); confronto ripetuto: «Verifica
  superata».
- **`npm run aspetto -- --no-build --solo-foto`**: «Tutto a posto»; viste iPhone 56 oggetti disegnati e 131.872 triangoli, al massimo
  145.346 nelle sei viste; `--solo-gioco` PASS nel giro delle prove.

## Decisioni superate
- Rigore con spalle e busto dritti verso la porta e il braccio teso indietro (v0.88) → spalle e busto girati di circa 29° verso la palla,
  testa verso la porta.
- Bacino della posa registrata con tutta la sua rotazione (v0.74, v0.77) → 30% (`PLASK_ANCHE`).
- Entrate del computer solo con la palla al punto o al mezzo destro, il portatore pressato e un compagno smarcato (v0.68) → contro il
  pressing lo schema è dovuto: palla dove può partire, passaggio anche al compagno marcato con linea sicura, entrata del mezzo del lato
  debole dopo 2,5 s, secondo schema 7 s dopo il primo (`SCHEMI_PRESSING`).
- «Apertura del 2»: il numero 3 a 3,5 m dietro la palla del portiere (v0.54) → mai a meno di 4 m dalla propria linea di porta.
- Rigore con tutti sulla linea dei 6 metri in fila (v0.45) → 2 difensori e al massimo 2 attaccanti vicino al tiratore, gli altri a metà
  campo; nella serie finale nessuno vicino.
- Computer con la palla diretto al suo posto anche durante la finta e l'attesa prima del gesto dopo → resta dritto, al massimo 1,2 m alla
  volta (`FINTA_RITMO.scivolo`).
- Raccordo del disegno sempre di 0,08 s (v0.70) → proporzionale allo spostamento, fino a 0,4 s (`RACCORDO_VISTA`).
- Reset del raccordo alla presa (v0.70) → la presa raccorda la posa.
- Passaggio basso: palla che vola da sola nella mano alta in 0,12 s (v0.56) → raccolta dalla mano in 0,32 s per chi è dritto (`PRESA_ACQUA`).

## Non fatto
- Il rilascio del tiro resta quello registrato (anche lì il bacino tiene il 30% della rotazione).
- Nessun cambio agli schemi del giocatore: A/B/C restano chiamate sue.
- Il ritmo delle azioni (troppe e corte, v0.89) resta da rifare, ora con 18,9 gol a squadra (v0.89 17,6).
- All'inizio dei tiri e dei passaggi veloci, soprattutto subito dopo la presa, la palla può ancora spostarsi di colpo verso il palmo (al
  rilascio deve stare esattamente sul palmo): 71 → 130 casi in 2 partite, 107 entro 0,35 s dalla presa.
- Il passaggio dalla raccolta della pesca alla palla in mano resta quello della v0.63 (circa 0,06 s): un piccolo scatto di una decina di
  centimetri, ora anche nella presa dall'acqua.
