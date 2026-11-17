# v0.55: finte, tiro al volo, passaggi tesi, palla in mano e nuoto a serpente

Indicazioni di Ale del 17/11/2026, dopo aver finito per la prima volta una partita divertendosi:
- «i giocatori tengono la palla come un vassoio e nuotano rigidi»;
- «il nuoto di un pallanuotista è simile a un serpente»;
- «ho difficoltà a usare la finta»;
- «ad alti livelli il palleggio è alto, teso e veloce»;
- «la finta è il gesto distintivo di un giocatore»;
- «questo ha il gomito girato al contrario».

## 1. Finta con un tocco (scelta di Ale)
Su telefono e controller:
- **tocco breve su TIRO** (meno di 0,16 s): finta, anche più di una di fila;
- **tenuto fino a 0,36 s e lasciato**: tiro di polso;
- **tenuto più a lungo**: tiro caricato.

Prima la finta era un doppio tocco entro 0,3 s, e se il secondo tocco arrivava in ritardo partiva il tiro. Costanti `TOCCO_FINTA` e `TIRO_POLSO` in `controllo.js`. Con la tastiera, un tocco di Spazio è una finta.

**Tiro al volo**: basta un tocco su TIRO mentre arriva il passaggio. Quando un compagno riceve vicino alla porta compare l'avviso «Tocca TIRO: al volo». Con la tastiera resta la regola della v0.45: Spazio tenuto prima della ricezione non tira da solo.

## 2. Passaggi alti, tesi e veloci; finta e scarico
- **Passaggi** (`doPass`): 11–15,5 m/s (prima 8,5–12) e arrivo alla mano alzata, a 0,95 m (prima 0,45 m: la palla scendeva verso l'acqua).
- **Dopo una finta** il passaggio è più difficile da intercettare, perché i difensori hanno abboccato. Chi lo riceve tira più spesso al volo, anche in parità.
- **Il computer finta di più**: fino al numero massimo di finte del suo stile. Dopo una finta riuscita scarica al compagno libero, con la frequenza del suo stile. Vicino alla porta finta anche prima di passare.

## 3. Finte personali (`src/finte.js`, scelta di Ale: «piccolo vantaggio»)
Sei finte. Ogni giocatore ne ha una, ricavata dal nome e dalle statistiche, senza usare il caso del gioco:

| Finta | Gesto | Seguito tipico |
|---|---|---|
| larga | lenta, braccio teso | tiro forte |
| a raffica | stretta, rapida, fino a 3 di fila | tiro di polso |
| di polso | busto da destra a sinistra | polso dall'altra parte |
| mezza finta | si alza, accenno breve | sparo immediato |
| di bomba | carica da tiro potente | palombella |
| di spalla | braccio quasi fermo | scarico al compagno |

**Firma**: se la finta si chiude con il suo seguito tipico entro 1,6 s, il portiere è un po' più spiazzato (+0,08 sulla sorpresa del tiro). Per lo scarico, il passaggio è intercettato il 30% in meno.

La finta compare nella scheda del giocatore (schermata della formazione) e nell'avviso a schermo, per esempio «Finta di bomba riuscita!».

Distribuzione su tutte le rose: larga 46, di bomba 39, di spalla 53, di polso 47, mezza finta 39, a raffica 40.

Foglio delle sei finte: `docs/immagini/v055-finte.png` (`node strumenti/finte-foglio.mjs`). Le differenze nelle foto ferme sono contenute; si notano di più nel ritmo del gesto.

## 4. Palla in mano e gomito (solo disegno)
- **Palla tenuta**: prima il palmo era rivolto al cielo e il gomito pendeva sotto la mano: un cameriere. Ora la palla sta sopra la testa, con la mano dietro la palla, il palmo in avanti, il polso piegato all'indietro e il gomito in fuori all'altezza della spalla (`HOLD_VISTA`, `GOMITO_FUORI`, `PALMO_PALLA` in `grafica/pose.js`).
- **Carica del tiro**: prima il gomito veniva spinto indietro e in basso mentre la mano era davanti, e il braccio sembrava girato al contrario, «ad ala di pollo». Ora il gomito va in fuori e un po' indietro, e il palmo sta dietro la palla.
- La posizione della palla nel gioco (`p.ballW`) non cambia: le partite restano identiche.

Immagini:
- `docs/immagini/v055-palla-in-mano-prima-dopo.png`;
- `docs/immagini/v055-braccio.png`: palla tenuta, carica a metà, carica piena e rilascio, da tre lati (`node strumenti/braccio-foglio.mjs`).

## 5. Nuoto a serpente (solo disegno)
- A ogni bracciata un'onda scorre dalle spalle al bacino e alle gambe, ciascuno in ritardo sul precedente (`ONDA` in `pose.js`, applicata alla piega della colonna di `corpo.js`).
- Le spalle ruotano con la bracciata.
- Quando un avversario è addosso l'onda è più ampia, anche da verticali: il divincolarsi.

`npm run aspetto -- --confronta=`: partita simulata identica a prima del cambio grafico.


## 6. Altre indicazioni di Ale, stesso giorno
- **«Gomito girato al contrario»**: vedi la sezione 4.
- **Corpo inclinato** (Ale: «chi sta dritto in acqua è un corpo inerme; sei sempre mezzo inclinato, come un polpo»). Chi è in verticale ha il bacino e le gambe indietro rispetto alle spalle:
  - circa 24° di base;
  - circa 36° per chi marca l'uomo;
  - quasi dritto (7°) solo per tirare, murare o parare (`INCLINA_VERT`, `inclinazioneVerticale` in `pose.js`).

  Senza palla e senza gesti, le braccia remano larghe ai lati, «a polpo».
- **Palla protetta** (Ale: «terrei il braccio e la palla dietro la mia testa»). Con un avversario entro 1,8 m la palla va a braccio teso dietro la testa, dalla parte opposta all'avversario (`PROTEGGI_DIST`).
  - Correzione dopo lo screenshot di Ale («posizione del braccio totalmente innaturale; il corpo e la testa devono essere girati»): per proteggere la palla non si stende più il braccio dietro la schiena a busto fermo. Si girano spalle, busto e testa fino a 1,2 rad (`PROTEGGI_GIRO`), con la spalla libera verso l'avversario e la palla dall'altra parte; il bacino resta dov'è (torsione in vita).
  - Testa (Ale: «l'attaccante non può guardare il difensore in faccia con il braccio teso indietro; la faccia verso la porta, o almeno girata di un quarto»). Prima la testa guardava sempre dritta, qualunque cosa facesse il busto. Ora testa e collo possono girarsi rispetto al corpo (`T.testaGiro` in `corpo.js`). Mentre si protegge la palla il viso va verso la porta, fino a 1,1 rad oltre il busto (`TESTA_GIRO`).
  - Centroboa con il difensore dietro (Ale: «la palla non può stare nel dorso della mano: o sta in acqua oppure il giocatore si deve girare o tirare una beduina o una sciarpa»). Finché non fa un gesto la palla resta in acqua davanti a lui, con la mano sopra (`BOA_ACQUA`); girata, beduina e sciarpa la alzano.
- **Rilascio come accompagnamento** (Ale: «non gli sta dando uno schiaffo, è un accompagnamento»).
  - Prima, dopo il rilascio, la mano finiva sotto la spalla e attraverso il corpo, con il palmo in giù.
  - Ora il braccio prosegue quasi disteso verso il bersaglio, all'altezza del petto, con il palmo verso la porta e le dita che puntano la palla; poi scende (`ACCOMPAGNA`, `PALMO_ACCOMPAGNA`).
  - Immagine `docs/immagini/v055-rilascio-prima-dopo.png`.
- **Lotta al centro** (Ale: «l'attaccante è di spalle alla porta e si appoggia al petto del difensore; spingono in direzioni opposte»).
  - Con il difensore dietro, il centroboa si inclina all'indietro e il difensore in avanti, e i busti si avvicinano fino al contatto (`LOTTA`, `lottaVista`).
  - In anticipo (difensore davanti) si inclinano l'uno verso l'altro.
  - Solo disegno: posizioni e regole della lotta non cambiano.
  - Foglio `docs/immagini/v055-lotta.png` (`node strumenti/lotta-foglio.mjs`).
- **Passaggio al centro e al portiere** (Ale: «più di una volta ho passato la palla al portiere quando ero in attacco»; «fatico a dare la palla al centro»). In `humanPassTarget`:
  - il proprio portiere si sceglie solo nella propria metà campo e se nella direzione della levetta non c'è nessun altro;
  - con la levetta verso la porta avversaria il centroboa (con l'uomo in più il palo) ha la precedenza (`BOA_PREFERITO`).

  Due controlli nuovi in `npm run finta`.

- **Braccia morbide** (Ale: «finiscila di mettere queste braccia piegate, sembrano cavallette; serve fluidità»).
  - In quasi tutte le pose la mano è vicina alla spalla, e il braccio piegava il gomito per arrivarci.
  - Ora `braccio` (`corpo.js`) allunga la distanza spalla-mano del 42% di quanto manca al braccio teso (`BRACCIO_MORBIDO`): gomiti più aperti, braccia larghe.
  - Lo fa meno nel braccio che tira (0,2), con la palla in mano (0,45) e nella bracciata del crawl, che vogliono il gomito piegato.

- **Palla al centroboa** (Ale: «al centroboa la palla va sempre data davanti e in acqua; poi lui la prende e si gira e tira, oppure fa una beduina; se gli arriva in mano al volo è perché si è liberato; se il difensore in anticipo viene superato è rigore»).
  - Con il marcatore entro 1,8 m il passaggio arriva basso, in acqua, 0,55 m davanti a lui verso chi passa (`BOA_DAVANTI`), e un po' più lento.
  - Arriva alto, in mano, solo se il centroboa è libero.
  - Se il difensore era in anticipo e la palla lo supera, resta dietro il centroboa davanti alla porta: entro 5 m rigore nel 45% dei casi, espulsione nel 35% (`anticipoBattuto`, `ANTICIPO` in `regole.js`).
  - Prove: in acqua a 0,29 m con il marcatore; in mano a 1,07 m da libero; anticipo battuto, rigore o espulsione 18 volte su 20.
- **Corpi e palla non si compenetrano** (Ale: «va bene stare vicini ma non ci si può fondere»).
  - La spinta della lotta si ferma a 0,5 m tra i centri petto contro schiena e a 0,7 m faccia a faccia, e cala per chi è mezzo disteso.
  - Regola generale: due giocatori a meno di 0,56 m allontanano le parti alte (`separaVista`).
  - La palla disegnata viene spinta fuori dal corpo e dalla testa degli altri (`PALLA_FUORI`).
  - Misura `node strumenti/sonda-compenetrazione.mjs` (partita vera di 240 s), prima → dopo:
    - teste a meno di 26 cm: 296 fotogrammi su 6336 (4,7%, distanza minima 9 cm) → 0 su 6421 (minima 34 cm);
    - palla dentro la testa di un altro: 6 → 0.

Tutte le modifiche di questa sezione sono solo disegno, tranne la scelta del compagno nel passaggio e la palla al centroboa.

## Misure
Bilancio, 8 partite ITA–HUN, valori per squadra a partita:

| | v0.54 | v0.55 | Mondiali 2025 |
|---|---|---|---|
| Gol | 16,3 | 15,9 | 13,3 |
| Tiri | 43,8 | 48,4 | 33 |
| Tiri in gol | 37,1% | 32,8% | 40% |
| Espulsioni | 14,3 | 14,9 | 11 |
| Rigori | 1,8 | 1,3 | 1,8 |
| Tiri di polso | 10,3% | 14,9% | – |
| Palombelle | 3,4% | 5,3% | – |
| Intercetti | 5,1 | 4,1 | – |
| Superiorità trasformate | 43,2% | 36,0% | 52% |

**Peggiorano**:
- i tiri salgono, per le finte più frequenti e il tiro al volo;
- gli intercetti calano, perché i passaggi sono più veloci.

**Da tarare**:
- quanto spesso si tira dopo la finta;
- gli intercetti.

## Non fatto
- Una prova sul telefono per giudicare i tempi del tocco (0,16 s e 0,36 s).
- Le sei finte si distinguono più nel ritmo che nelle foto. Per gesti molto diversi servirebbero animazioni dedicate.
- Il resto dei gesti non è stato rivisto con lo stesso foglio a tre lati: passaggio, beduina, palombella, ricezione, parata, muro, nuoto con la palla. Per l'indicazione di Ale «ogni giuntura il più flessibile possibile» è il passo successivo.
- La tastiera non ha il tiro al volo con un tocco.
