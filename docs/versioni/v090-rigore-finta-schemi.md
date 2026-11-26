# v0.90 — Rigore (busto e schieramento), avvio della finta senza avvitamento, schemi del computer contro il pressing, giocatore in porta

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

DA_COMPLETARE_TARATURA

## Prove
- **Nuova `npm run ritocchi`** (`tests/ritocchi-v090.mjs`, anche nella CI), dieci controlli: nel rigore 2 difensori e al massimo 2
  attaccanti vicino al tiratore, sulla linea dei 6 metri ad almeno 3 m, gli altri 7 a metà campo; spalla del braccio che tira dietro
  l'altra e palla in acqua; nella serie finale nessuno vicino; all'avvio della tenuta il bacino gira al massimo di 25° e sotto 70°/s,
  e le spalle più delle anche; portiere con la palla per 8 s nell'apertura del 2 senza compagni nella porta; nessun errore.
DA_COMPLETARE_PROVE

## Verifiche
DA_COMPLETARE_VERIFICHE

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

## Non fatto
- Il rilascio del tiro resta quello registrato (anche lì il bacino tiene il 30% della rotazione).
- Nessun cambio agli schemi del giocatore: A/B/C restano chiamate sue.
- Il ritmo delle azioni (troppe e corte, v0.89) resta da rifare.
