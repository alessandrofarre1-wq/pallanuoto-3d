# v0.88 — Palombella senza tasto, scelta del tiro, posizione del rigore, valutazione delle squadre dai giocatori

## Richiesta
Ale (25/11/2026): «Secondo me puoi anche togliere il tasto della palomba e puoi gestirla in questo modo: Da fuori area: se il giocatore
che ha la palla in mano è in buona posizione e il portiere sta fuori dai pali può comparire il tasto palomba, a quel punto lo puoi premere
con prontezza ma non è detto che sia gol per forza. Da dentro l'area: la palomba diventa semplicemente un tipo di tiro - quindi se mi
fermo a qualche metro dalla porta e il portiere esce dai pali, quando premerò tiro l'ai del mio giocatore in attacco sceglierà
semplicemente la palomba, se invece il portiere non esce dai pali il giocatore farà un tiro potente e teso e se invece è in contro fuga
può scegliere anche lo schizzo (se non è troppo stanco e se ha qualità nel gioco) o il colonnello (se è meno stanco e qualità nel gioco)
- la posizione iniziale per battere un rigore è palla in acqua e braccio dietro la schiena con mano o sopra la palla o sotto. Poi parte
il movimento che deve essere unico, se è spezzato l'arbitro fischia il contro fallo.»

«Le valutazioni delle squadre dipendono dai giocatori che le compongono. Quindi, se parliamo di partita singola, ad esempio, se seleziono
i più forti da una rosa allargata, la squadra dovrebbe essere valutata meglio rispetto alla formazione della world league del 2026.
Oppure possiamo caricare 3 rose diverse per ogni squadra e nella partita singola si può scegliere con quale si vuole giocare -
considerando però che possono avere una valutazione complessiva diversa.»

«Una volta fatto queste modifiche puoi anche riequilibrare le partite.» Il riequilibrio è la v0.89 (sotto, «Non fatto»).

## Cosa diceva il codice (prima)
- **Palombella**: tasto PALOMB. sempre visibile quando la nostra squadra aveva la palla (L sulla tastiera, Y sul controller), da
  qualunque distanza e con il portiere comunque piazzato. Il computer tirava una palombella a caso nel 12% dei tiri decisi oltre i 5 m
  (`lob = dGoal>5 && rnd()<0.12`) e dopo la finta «di bomba».
- **Schizzo e colonnello** (v0.81): tasto a comparsa nella controfuga vera (entro 9 s dal recupero, in nuotata, nessun difensore davanti,
  da 2,5 a 8 m): un tocco di TIRO faceva lo schizzo (oltre 5,5 m) o il colonnello (più vicino), per tutti, senza guardare energia e
  qualità; tenuto, il tiro normale.
- **Portiere**: sempre a 0,7 m dalla linea di porta, si spostava solo di lato; la statistica Uscita non serviva a niente in partita. Nella
  sonda (4 partite ITA–HUN sulla v0.87) il portiere era fuori dai pali lo 0,7% del tempo di gioco.
- **Rigore** (v0.84): palla in acqua davanti a chi tira, mano sopra la palla; la carica la pescava come nel tiro normale. Il controfallo
  (fermo a braccio carico oltre 0,5 s) c'era già.
- **Valutazione della squadra**: il «Rating» della schermata Squadre era il numero del ranking (`forza` in `squadre.json`), uguale
  qualunque giocatore si scegliesse. Dalla v0.86 le valutazioni dei giocatori erano anche abbassate di quanto i 14 più forti superavano i
  13 della vecchia rosa (`riportaAlRanking`: Italia −0,41, Ungheria −0,70, Serbia −1,59 punti), così la squadra valeva sempre il ranking.

## Cosa cambia
1. **Scelta del tiro dentro l'area** (`src/controfuga.js`, `sceltaTiroArea`; numeri `PALOMBELLA` e `SPECIALI` in `src/taratura.js`).
   Entro 6 m dalla porta TIRO sceglie da solo:
   - **palombella** se il portiere è fuori dai pali (oltre 1,3 m dalla sua linea o oltre 2,2 m di lato dal centro della porta, oppure
     fuori dall'acqua), con un tocco o tenuto, purché il tiratore non sia di spalle alla porta (allora restano beduina e sciarpa);
   - nella **controfuga vera** (v0.81), con un tocco, il **colonnello** con energia almeno 0,6 o lo **schizzo** con energia almeno 0,35,
     solo con Precisione almeno 70 («qualità nel gioco»); più stanco o meno preciso, il polso;
   - altrimenti il tiro normale: tocco = polso, tenuto = tiro potente e teso (v0.81).
   La scritta piccola sotto TIRO dice quale: «palombella», «tocco: colonnello», «tocco: schizzo» o «tocco: polso». Niente più tasto a
   comparsa per schizzo e colonnello.
2. **Palombella fuori area** (`occasionePalombella`, `aggiornaQte`): il tasto PALOMB. non c'è più sempre; compare (illuminato, e sulla
   tastiera la scritta «Palombella! (L)») solo con il portiere fuori dai pali e il tiratore in buona posizione: tra 6 e 10 m dalla porta,
   non oltre 0,6 rad (34°) dal centro della porta, nessun avversario entro 1,6 m. Resta 1,2 s, poi sparisce e non torna per 2 s: va
   premuto subito, e non è detto che sia gol (precisione, distanza e rientro del portiere decidono). Con il tasto spento L e Y non fanno
   niente.
3. **Il portiere esce dai pali** (`gkTarget` e `liberoVersoPorta` in `src/ia.js`, `USCITA_PORTIERE`): quando chi porta palla è libero
   verso la porta ed è entro 9 m, il portiere gli va incontro per chiudere l'angolo: 1 m più 1,4 m × Uscita (statistica del portiere:
   40 = 1 m, 99 = 2,4 m), mai a meno di 1,6 m da chi porta palla. «Libero verso la porta» vuol dire nessun difensore di movimento alla
   sua altezza o più avanti entro 2 m dalla linea tra la palla e la porta: la controfuga, l'entrata, il difensore battuto che insegue da
   dietro (la prima versione chiedeva anche nessun difensore entro 2 m tutto intorno, e il portiere usciva solo 2-3 volte a partita).
   Così Uscita conta e nasce lo spazio per la palombella. Il portiere è fuori dai pali anche nel 7 contro 6, quando va su una palla
   vagante e quando rientra dalla metà campo dopo il time-out.
4. **La palombella non entra sempre** (`doShoot` in `src/tiri.js`, `PALOMBELLA.errore` e `erroreAlto`): è un gesto di misura, con più
   errore del tiro teso: di lato × 1,5 e in lunghezza con il fattore 1,2 × 1,5 al posto di 0,35 (troppo lunga va sopra la traversa,
   troppo corta finisce in mano al portiere che rientra). La Precisione del tiratore lo riduce come per gli altri tiri. Prima, con il
   portiere fuori dai pali, la palombella entrava 119 volte su 120 nelle scene di prova.
5. **Il computer segue le stesse regole**: dentro l'area palombella con il portiere fuori dai pali; nella controfuga vera schizzo o
   colonnello (con energia e Precisione) 35 volte su 100 quando tira (come la v0.81 nel tiro subito dopo la ricezione), altrimenti il
   tiro classico; fuori area, con l'occasione, la palombella con probabilità 1,4 al secondo (da 0,6 a 1,2 volte tanto secondo la
   Visione). Niente più palombelle a caso; la finta «di bomba» finisce in palombella solo con il portiere fuori dai pali.
6. **Posizione del rigore** (solo disegno, `src/grafica/pose.js`, `RIGORE_VISTA`; `abitudine` in `src/finte.js`): prima del gesto la
   palla galleggia dietro chi tira, dalla parte del braccio che tira (40 cm dietro la spalla, 24 cm di lato), con il braccio teso dietro
   la schiena e la mano sopra la palla (palmo in giù) o sotto (palmo in su): è un'abitudine fissa del giocatore, ricavata dal suo id
   (sopra 60 giocatori su 100). La carica la porta su in un solo movimento fino al braccio caricato. Il controfallo per il movimento
   spezzato (v0.84) resta: fermo a braccio carico oltre 0,5 s, palla al portiere avversario.
7. **Valutazione della squadra dai giocatori** (`ratingLista` in `src/dati/rose.js`): media delle valutazioni dei 14 della partita come
   scendono in acqua, i 7 titolari con la valutazione nel loro posto e peso doppio rispetto alla panchina. La scheda della squadra
   («Rating») e il confronto tra le due squadre la usano (la barra allarga lo scarto: 1 punto = 4% della barra; «equilibrata» entro 1
   punto, «di molto» da 6). Cambiando la formazione o la lista cambia anche la valutazione.
8. **Le valutazioni dei giocatori sono quelle del database** (`strumenti/rose-dal-database.mjs`, `src/dati/rose-db.json`): tolto il
   riporto al ranking della v0.86, così scegliere i più forti di una rosa allargata dà una squadra più forte. Il ranking (`forza`)
   resta per le fasce dei tornei e le partite simulate.
9. **Scelta della rosa nella partita singola** (`ROSE_TORNEI`, `roseTornei`; schermata Squadre, `menu.js`): sopra la formazione,
   «Rosa · valutazione della squadra N» e i bottoni «Tutti i disponibili» e i convocati della Coppa del Mondo 2026, degli Europei 2026 e
   dei Mondiali 2025 (quando la nazionale ne ha almeno 9 con un portiere), ognuno con la sua valutazione. Toccandone uno la lista della
   partita diventa la scelta automatica tra quei giocatori. Nei tornei valgono i convocati scelti (v0.86).
10. **Titolari per forza nel posto** (`src/dati/lista-partita.js`, `LISTA.specialista`): per ogni posto vince il più forte nel posto tra
   chi lo fa di ruolo (con 3 punti di vantaggio) e chi fa un ruolo vicino (mezzo punto in meno per ogni gradino). Prima vinceva sempre
   chi lo faceva di ruolo anche se molto più debole (la Spagna metteva all'ala destra un 81 invece di un 85 che gioca a sinistra), e
   «Tutti i disponibili» poteva valere meno di una rosa di torneo. La panchina copre i ruoli come nella v0.86.

## Misure
### Valutazioni (rosa «Tutti i disponibili» e rose dei tornei)
Valutazione della squadra (`ratingLista`) con la lista scelta dal gioco tra tutti i disponibili e tra i convocati di ogni torneo del
database (tra parentesi quanti sono); «ranking» è la `forza` di `squadre.json`, il vecchio «Rating».

| squadra | ranking | giocatori | tutti i disponibili | Coppa del Mondo 2026 | Europei 2026 | Mondiali 2025 |
|---|---|---|---|---|---|---|
| ESP | 92 | 24 | 86 | 86 (22) | 85 (15) | 85 (15) |
| HUN | 90 | 26 | 84 | 84 (21) | 84 (15) | 83 (15) |
| GRE | 88 | 20 | 82 | 82 (19) | 81 (15) | 81 (15) |
| SRB | 86 | 27 | 81 | 79 (16) | 81 (15) | 81 (15) |
| CRO | 84 | 34 | 80 | 79 (26) | 79 (15) | 79 (15) |
| MNE | 82 | 25 | 79 | 79 (19) | 78 (15) | 78 (15) |
| ITA | 79 | 25 | 76 | 76 (18) | 76 (15) | 75 (15) |
| USA | 77 | 20 | 74 | 74 (16) | – | 74 (15) |
| JPN | 75 | 15 | 72 | – | – | 72 (15) |
| ROU | 73 | 20 | 72 | 72 (16) | 72 (15) | 72 (15) |
| FRA | 72 | 15 | 70 | – | 70 (15) | – |
| CAN | 71 | 20 | 69 | 69 (16) | – | 69 (15) |
| BRA | 69 | 19 | 69 | 67 (15) | – | 68 (15) |
| GEO | 70 | 15 | 68 | – | 68 (15) | – |
| NED | 69 | 15 | 67 | – | 67 (15) | – |
| AUS | 67 | 20 | 67 | 67 (19) | – | 67 (15) |
| CHN | 65 | 24 | 66 | 65 (15) | – | 66 (15) |
| TUR | 66 | 15 | 65 | – | 65 (15) | – |
| MLT | 64 | 15 | 64 | – | 64 (15) | – |
| SGP | 63 | 22 | 64 | 63 (14) | – | 63 (15) |
| SVK | 63 | 14 | 63 | – | 63 (14) | – |
| SLO | 61 | 15 | 62 | – | 62 (15) | – |
| RSA | 60 | 22 | 62 | 61 (14) | – | 61 (14) |
| ISR | 60 | 15 | 61 | – | 61 (15) | – |

In nessuna nazionale una rosa di torneo vale più di «Tutti i disponibili» (prima della scelta dei titolari per forza nel posto,
la Spagna della Coppa del Mondo valeva 86 e tutti i disponibili 85; punto 10). Le differenze tra le rose sono piccole (0-2 punti) perché il metodo
delle valutazioni (`docs/riferimenti/valutazioni.md`) ricentra ogni voce dei giocatori sulla media della propria nazionale, che viene
dal ranking: i dati dei tornei decidono chi è più forte dentro la squadra, non quanto vale la squadra contro le altre. Dentro una
nazionale invece la scelta conta: mettendo in acqua i più deboli la valutazione scende (Italia: 76 con la scelta automatica, 74 mettendo in acqua i sette
della panchina al posto dei titolari).

### Palombelle e uscite del portiere (`npm run sonda-palombella`, 4 partite ITA–HUN computer contro computer)
Sonda nuova `npm run sonda-palombella` (palombelle, schizzi e colonnelli per squadra a partita, da che distanza, quanti in gol, e quanto
spesso il portiere è fuori dai pali); 4 partite ITA–HUN computer contro computer per ogni riga, stessi semi.

| | palombelle a squadra | in gol | schizzi + colonnelli | portiere fuori dai pali | uscite per portiere |
|---|---|---|---|---|---|
| v0.87 | 0,75 (a caso, da 6,5 m) | 4 su 6 | 0 | 0,7% del tempo | 1,6 |
| v0.88, prima versione dell'uscita (nessun difensore entro 2 m tutto intorno) | 0,13 | 1 su 1 | 0 | 0,8% | 2,4 |
| v0.88, uscita sull'attaccante libero verso la porta, palombella con l'errore del tiro teso | 1,25 (da 4,7 m) | 9 su 10 | 0,25 | 1,2% | 11,6 |
| **v0.88 finale** (palombella più difficile) | **3,0** (da 5,3 m) | **14 su 24 (58%)** | 0,38 | 1,3% | 11,8 |

Scene di prova (120 palombelle di un tiratore libero con Precisione 78, da 3,5, 4,5 e 5,5 m, portiere fuori di 1,5-2 m): con l'errore
del tiro teso 119 in gol; con l'errore della palombella 75 in gol (62%: 70% da 3,5 m, 62% da 4,5 m, 55% da 5,5 m), 31 prese dal
portiere, 10 fuori. Nelle 16 partite della taratura le palombelle sono il 5,1% dei tiri (circa 2 a squadra per partita).

### Gioco contro realtà (16 partite ITA–HUN, per squadra a partita)
| voce | v0.87 | v0.88 | reale |
|---|---|---|---|
| tiri | 40,1 | 39,9 | 33 |
| gol | 19,4 | 19,9 | 13,3 |
| gol dell'Italia / dell'Ungheria | 13,3 / 25,5 | 13,4 / 26,5 | |
| tiri in gol | 48,4% | 49,9% | 40% |
| espulsioni | 10,8 | 11,2 (a posto) | 11 |
| espulsioni dalla lotta al centro | 57,1% | 56,4% | 66% |
| superiorità trasformate | 47,0% | 44,7% | 52% |
| rigori | 2,2 | 2,4 (a posto) | 1,8 |
| azioni a partita | 73,8 | 74,8 | 50 |
| parità: durata dell'azione | 13,1 s | 13,0 s | 21 s |
| parità: gol | 22,6% | 22,8% | 6-19% |
| parità: espulsione procurata | 16,8% | 17,4% (a posto) | 22% |
| parità: fallo in attacco | 11,5% | 12,9% (a posto) | 15% |
| palla in mano prima del passaggio | 1,01 s | 1,00 s | 0,6-1 s |
| voci a posto | 5 su 15 | 5 su 15 | |

Gesti dei tiri: classico 71,4%, polso 13,8%, torsione 7,4%, palombella 5,1%, beduina 1,3%, sciarpa 0,8%, schizzo 0,2%, colonnello
0,1%. L'equilibrio non cambia: le differenze stanno nelle oscillazioni di 16 partite (la superiorità trasformata 47,0% → 44,7% esce
dalla fascia per poco; l'espulsione procurata e il fallo in attacco in parità rientrano). Il riequilibrio è la v0.89.

## Prove
- **Nuova `npm run palombella`** (`tests/palombella-v088.mjs`, anche nella CI), diciassette controlli: dentro l'area con il portiere in porta
  TIRO tira normale (scritta «tocco: polso», niente tasto) e il tocco è il polso; con il portiere fuori dai pali TIRO fa la palombella;
  fuori area con il portiere fuori dai pali compare il tasto e premuto subito fa la palombella; non premuto sparisce dopo 1,2 s; niente
  tasto con il portiere in porta, da 11 m o troppo angolati, e L non tira; in controfuga il tocco fa il colonnello da fresco, lo schizzo
  un po' stanco, il tiro normale troppo stanco o con poca Precisione e tenendo premuto; niente speciali nell'attacco schierato; il
  portiere esce di 2,2 m con Uscita 95 e di 1 m con Uscita 40; esce anche se il difensore battuto insegue da dietro e resta in porta se
  c'è un difensore davanti.
- **`npm run rigore`** (v0.84): il primo controllo diventa «palla in acqua dietro chi tira, con il braccio dietro la schiena»; foto
  `docs/immagini/v088-rigore-palla-dietro.png` e `v088-rigore-carica.png`.
- **`npm run sezione4`** (v0.31): la parte della controfuga riscritta per la regola nuova (nessun tasto a comparsa, colonnello e schizzo
  con il tocco dentro l'area secondo energia e Precisione, niente speciali da 7 m, troppo stanchi, poco precisi, con un difensore
  davanti o nell'attacco schierato); il computer: schizzo a 5,5 m un po' stanco invece che a 6,2 m.
- **`npm run gameplay`** (v0.40 di Codex): la palombella anticipata durante una finta si prova con il portiere fuori dai pali (il
  tasto c'è solo allora); pressione e tiro libero dentro i 6 m la bloccano ancora.
- **`npm run nuoto-coerente`** (v0.50 di Codex): la domanda «schizzo disponibile avanzando» si fa con l'energia e la Precisione adatte
  allo schizzo (la nuotata misurata non cambia).
- **`npm run traiettorie`** (v0.71 di Codex): il contesto ridotto di `doShoot` ha anche `PALOMBELLA`.
- **`npm run finta`** (v0.55): invariata; ha trovato che il portiere uscito dai pali non abboccava più alla finta di lato. Ora abbocca
  anche fuori dai pali (`gkTarget`), come in porta.

## Verifiche
- **`npm run lint`**: PASS.
- **`npm run prove`** (70 passi con la nuova `palombella`): primo giro 66 PASS e 3 FAIL (`gameplay`, `nuoto-coerente`, `sezione4`, le
  tre prove adattate qui sopra); giro sulla versione finale **68 PASS e 2 FAIL** su 70 in 17,8 minuti: `traiettorie` (contesto senza
  `PALOMBELLA`) e `finta` (portiere uscito che non abboccava alla finta di lato); corretti, poi PASS. Tutte le altre, compresa la nuova
  `palombella` (17 controlli), PASS nella stessa build. Dopo le correzioni, sulla build finale, i 14 passi più vicini alle modifiche
  (`traiettorie`, `tiro-comando`, `gameplay`, `nuoto-coerente`, `finta`, `desktop`, `sezione4`, `azione`, `comandi-interfaccia`,
  `tiri-centro`, `rigore`, `finte`, `finte-mano`, `palombella`): 14 PASS.
- **`npm run verifica -- --partite=0`** (con `qualita` e `tornei` PASS): «2-sprint», «3-azione», «4-iphone-piccolo» e
  «5-iphone-orizzontale» diverse dal riferimento per la sola situazione di gioco (stessi momenti: 3:00, 2:45 in 6 contro 5 con Alesiani
  espulso, 2:56; giocatori spostati perché cambiano titolari e valutazioni, e l'uscita del portiere); disegno, tasti e tabellone a
  posto. Controllate, riferimenti aggiornati con `npm run verifica:aggiorna -- --partite=0` («1-menu» lasciato com'era, entro la
  tolleranza); confronto ripetuto: «Verifica superata».
- **`npm run aspetto -- --no-build --solo-foto`** e **`--solo-gioco`**: «Tutto a posto»; viste iPhone 56 oggetti disegnati e 131.872
  triangoli, al massimo 145.346 triangoli nelle sei viste.
- La taratura delle 16 partite è stata fatta sulla build prima della correzione della finta per il portiere fuori dai pali (cambia solo
  quando il portiere è uscito e l'attaccante finta di lato).

## Decisioni superate
- Tasto PALOMB. sempre visibile con la palla (v0.40) → tasto a comparsa solo fuori area con il portiere fuori dai pali e il tiratore in
  buona posizione (1,2 s); dentro l'area la palombella è un tipo di tiro scelto da TIRO.
- Palombelle del computer a caso (12% dei tiri oltre 5 m) → solo con il portiere fuori dai pali.
- Tasto a comparsa per schizzo e colonnello nella controfuga vera (v0.81), colonnello sotto 5,5 m e schizzo sopra fino a 8 m, per tutti
  → nessun tasto: dentro l'area il tocco di TIRO li sceglie secondo energia (colonnello almeno 0,6, schizzo almeno 0,35) e Precisione
  (almeno 70); il computer 35 volte su 100 quando tira con la stessa occasione.
- Portiere sempre a 0,7 m dalla linea → esce verso chi porta palla libero verso la porta, secondo la sua Uscita (anche fuori dai pali
  abbocca alla finta di lato).
- Palombella con l'errore del tiro teso → più errore di lato e in lunghezza (`PALOMBELLA.errore`, `erroreAlto`).
- Rigore con la palla in acqua davanti e la mano sopra (v0.84) → palla dietro, braccio dietro la schiena, mano sopra o sotto (abitudine
  del giocatore).
- «Rating» = ranking della nazionale → valutazione dei 14 della partita (titolari nel loro posto, peso doppio).
- Valutazioni dei giocatori riportate al ranking (v0.86) → valutazioni del database.
- Titolari: sempre chi fa il ruolo, anche se più debole (v0.86) → il più forte nel posto con 3 punti di vantaggio a chi lo fa di ruolo.
- Partita singola con tutti i disponibili o una lista fatta a mano (v0.86) → anche le rose dei tornei del database, ognuna con la sua
  valutazione.

## Non fatto
- **Riequilibrio delle partite** (Ale: «una volta fatto queste modifiche puoi anche riequilibrare le partite»): nella v0.89, partendo
  dalle misure di questa versione.
- Il portiere non avanza quando la sua squadra attacca e non esce sui passaggi al centroboa: esce solo su chi porta palla libero verso
  la porta.
- La mano sopra o sotto la palla nel rigore è solo disegno: il tiro e i suoi tempi sono quelli della v0.84.
- Il metodo delle valutazioni resta quello di `docs/riferimenti/valutazioni.md`: le voci dei giocatori sono ricentrate sulla media della
  loro nazionale, che viene dal ranking. Per questo le rose di una stessa nazionale differiscono di 0-2 punti e la forza tra nazionali
  resta quella del ranking (Italia 76, Ungheria 84). Valutazioni assolute, uguali per tutti i giocatori del mondo, chiederebbero un
  metodo nuovo (i dati dei tornei dipendono dagli avversari incontrati): da decidere con Ale.
