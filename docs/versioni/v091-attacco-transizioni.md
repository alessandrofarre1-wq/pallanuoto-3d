# v0.91 — Attacco del computer più deciso, transizioni ordinate, controfuga come nel manuale FIN

## Richiesta
Ale (27/11/2026), dopo il primo Mondiale giocato:
> «È la prima volta che gioco un mondiale e mi sono un po' divertito. Però secondo me l'AI dei giocatori deve essere più avanzata. Mi
> devono mettere più in difficoltà principalmente quando loro attaccano. A volte partono degli schemi e passano la palla dall'altra
> rispetto all'uomo libero. Poi a volte ci sono palesi occasioni da gol e passano la palla a un compagno e ricominciano l'azione,
> soprattutto quando partono in contro fuga dovrebbero andare in porta. Sull'uomo in più quasi non fanno schemi e anche l'AI del mio
> attacco ho notato che lo schema non parte o se parte i movimenti sono impercettibili. Lavora su come può essere reso più realista il
> gameplay perché secondo me è il punto di forza di questo gioco.»

E poi:
> «Si va bene partire da questi tre ma sono esempi. Vorrei che degli spunti arrivassero pure da te. Aggiungo che a volte in transizione i
> giocatori si ammassano, ma in realtà nelle partite avviene tutto in modo piuttosto ordinato anche perché gli uomini sanno dove devono
> andare. Ci sono anche dei modi per "portare" le contro fughe, dovresti sicuramente avere qualcosa nei documenti che ho allegato
> dall'inizio.»

Questa versione fa l'attacco del computer (occasioni, uomo libero, controfuga), le transizioni e la controfuga. L'uomo in più (schemi del
computer e della squadra di Ale) è la prossima versione; le proposte sono in fondo.

## Fonti
- Manuale didattico FIN (indicato da Ale come 2010), controfuga alle pp.51-63, letto per intero per la v0.41
  (`docs/riferimenti/tecnica-v041.md`, F1; il PDF non è tra gli allegati di questa sessione, valgono gli appunti di allora): fasi di
  preparazione, acquisizione e conservazione del vantaggio, conclusione e copertura della ripartenza avversaria; **la prima apertura
  allarga e facilita il trasporto della palla, la seconda dà profondità; il marcatore del centro può diventare un appoggio centrale; più
  corsie e linee di passaggio partecipano alla salita**; rischio di verticalizzare troppo presto; un 5 contro 4 può diventare 4 contro 3 o
  2 contro 1: va letto chi è davvero disponibile.
- Manuale USA Water Polo 2021, «The counter attack» (già nella v0.45): tre corsie e due linee, le tre regole del vantaggio.
- `docs/riferimenti/tattica.md` §7: «il portiere lancia le controfughe con passaggi lunghi».
- Le due aperture del portiere di Ale (v0.54) e la sua decisione della v0.58 («i compagni non possono stare fermi ad aspettarmi: devono
  nuotare il più velocemente possibile verso le posizioni d'attacco; invece mi stanno intorno»).

## Cosa diceva il codice (misure prima, v0.90)
Sonde nuove (scratchpad, partite computer contro computer ITA–HUN):
- **Occasioni** (`sonda-occasioni`, 4 partite): chi aveva la palla entro 6,5 m, con un buon angolo, nessun difensore entro 2 m e la
  traiettoria libera tirava **50 volte su 100**; **42 su 100 passava**, 15 volte su 20 **indietro**, a chi era più lontano e meno libero.
  Con più attaccanti che difensori vicino alla porta nei primi secondi (controfuga) tirava **2 volte su 7**; i passaggi andavano a chi
  stava a 8,9 m.
- **Uomo libero** (`sonda-uomo-libero`, 4 partite): quando un compagno era libero davanti alla porta la palla andava a lui il 71% delle
  volte in parità, il 67-80% negli schemi (A, C, D), il 78% con l'uomo in più; quando no, quasi sempre dall'altra parte.
- **Transizioni** (`sonda-transizioni`, 4 partite, 394 transizioni dopo un recupero a più di 13 m dalla porta): con la controfuga
  organizzata (62% delle transizioni) **0,99 coppie di compagni a meno di 2 m** in ogni istante e **almeno una coppia sotto i 2 m nel 65%
  degli istanti**; senza (transizioni dopo un fallo, verso i posti d'attacco normali) 0,49 e 49%. Nei disegni dall'alto: ognuno andava al
  posto del **suo numero** e non a quello più vicino, quindi dopo una zona o uno scambio di marcatura attraversava la vasca; ala e mezzo
  dello stesso lato avevano corsie a 4 e 3,2 m dal centro e nuotavano **affiancati**; punto e centroboa risalivano insieme la corsia
  centrale; chi portava palla scivolava sempre verso il centro.

## Cosa cambia
1. **Occasione palese** (`ia.js` `aiCarrier`, `tiri.js` `liberoDavanti`, `OCCASIONE_PALESE`): chi ha la palla entro 5 m, con apertura
   almeno 0,7, nessun difensore di movimento entro 2,2 m e la traiettoria libera tira dopo 0,15 s, **in qualunque momento dell'azione**
   (l'occasione chiara della v0.81 valeva solo appena ricevuto). Non con l'uomo in più: lì il tiro lo prepara lo schema.
2. **Palla all'uomo libero** (`bestPassTarget`): il compagno così libero è la prima scelta, anche se non è il vicino della circolazione
   (linea libera, rischio di intercetto sotto 0,22), e il passaggio parte subito.
3. **Libero tra 5 e 6,5 m** (`OCCASIONE_PALESE.largo`): niente più passaggio indietro a chi è meno libero, e niente scarico per far
   partire uno schema; la palla va solo a un compagno più vicino alla porta e libero, altrimenti finta (sposta portiere e difensore) e tiro.
4. **Controfuga con l'uomo in più davanti** (`vantaggioAttacco`, `VANTAGGIO`): nei primi 10 s del possesso, con più attaccanti che
   difensori vicino alla porta, chi ha la palla punta la porta fino a 4,6 m; senza nessuno davanti tira lì (prima solo se un difensore lo
   raggiunge da dietro); la palla va solo avanti, al compagno libero più vicino alla porta, quando il difensore gli viene addosso; niente
   costruzione dei 18 s.
5. **Transizione ordinata** (`assegnaPostiRipartenza`, `corsiaViaggio`, `TRANSIZIONE`; `entrate.js` `occupaPosti`): al recupero i cinque
   posti del perimetro vanno a chi è già dalla parte giusta (corsia; linea: i più avanti in prima linea, il più indietro fa il punto, come
   l'appoggio centrale del manuale FIN; un mancino preferisce destra); il centro resta al centroboa. I posti restano nell'attacco
   schierato che segue (atleta, posto e accoppiamento erano già distinti). In viaggio ali larghe (6 m dal centro) e mezzi all'interno
   (3 m), poi il posto vero; il punto resta 3 m dietro il centroboa e, se gli è alla pari, si sposta di 2 m; in transizione i compagni si
   tengono a 2,4 m invece di 1,6 m. Le due aperture del portiere (v0.54) restano come erano, con i posti occupati al posto del numero.
6. **Chi porta palla** (`contropiedePortatore`): lontano dalla porta resta nella sua corsia (prima scivolava sempre verso il centro, dove
   risalgono centroboa e punto) e aggira il difensore che gli sta davanti già da 2,6 m (prima 1,9 m).
7. **Lancio lungo** (`lancioLungo`, seconda apertura del manuale FIN): nella controfuga il portiere e chi porta palla lanciano al compagno
   già almeno 6 m più avanti che non ha difensori davanti, libero di almeno 2,5 m, entro 17 m, con la linea sgombra e poco rischio.

Provato e tolto: un primo «libero» a 6,5 m con apertura 0,55 e 2 m di spazio prendeva anche i normali tiri dal perimetro contro la zona
(9,9 tiri a squadra a partita da 5,9 m, **29 in gol su 100**; tiri da 40,9 a 49,6 a squadra); prima apertura del mezzo e appoggio
centrale del punto dietro la palla anche con la palla a un giocatore di movimento (tornavano i compagni intorno a chi porta palla, la
decisione della v0.58).

## Numeri
**Taratura, 16 partite ITA–HUN** (`npm run taratura -- --partite=16`, confronto con le 16 della v0.90; per squadra a partita):

| voce | v0.90 | v0.91 | reale |
| --- | --- | --- | --- |
| tiri | 40,9 | 42,4 | 33 |
| gol | 18,9 | 17,8 | 13,3 |
| tiri in gol | 46,2% | 42,1% | 40% |
| espulsioni (dalla lotta al centro) | 11,3 (55,8%) | 10,7 (62,2%) | 11 (66%) |
| superiorità trasformate | 42,8% | 37,8% | 52% |
| azioni a partita | 75,5 | 74,6 | 50 |
| parità: durata dell'azione | 12,8 s | 13,1 s | 21 s |
| parità: gol / tiro sbagliato / palla persa / fallo in attacco | 21,7 / 25,8 / 19,6 / 12,0% | 21,5 / 29,3 / 15,6 / 11,8% | 6-19 / 32 / 20 / 15% |
| controfughe a partita (gol) | 1,7 (14,5%) | 1,9 (24,2%) | |

7 voci su 15 a posto (v0.90: 6). Le superiorità trasformate (37,8%) stanno nella variazione già misurata per la v0.90 (tra 36% e 45%
con la stessa versione in gruppi da 12-16 partite); nessuna modifica di questa versione vale con l'uomo in più (la prova con 4 partite
della versione intermedia, uguale per l'uomo in più, dava 44,8%). Falli in attacco invariati: chi resta nella sua corsia aggira il
difensore e non gli nuota addosso.

**Sonde** (4 partite ciascuna, scratchpad):
- Occasioni (`sonda-occasioni`) e uomo libero (`sonda-uomo-libero`): vedi «Verifiche».
- Transizioni (`sonda-transizioni`, 398 transizioni, 66% con la controfuga organizzata): **coppie di compagni a meno di 2 m 0,99 → 0,54**
  per istante, **istanti con almeno una coppia sotto i 2 m 65% → 42%**, compagno più vicino 2,8 → 3,2 m, al massimo 3,1 → 2,8 nella stessa
  corsia, **compagni entro 3 m da chi porta palla 0,94 → 0,64**; chi rientra: coppie 0,79 → 0,50, istanti 51% → 38%. La coppia più
  frequente (punto e centroboa nella corsia centrale) da 1.816 a 1.011 (su 4.871 coppie). Disegni dall'alto delle prime otto transizioni:
  [prima](../immagini/v091-transizioni-prima.jpg) (etichette per numero dell'atleta) e [dopo](../immagini/v091-transizioni-dopo.jpg)
  (etichette per il posto occupato): chi attraversa la vasca dopo la v0.91 va in panchina per un cambio.
- Tiri per motivo ed esito (`sonda-tiri-esito`, 6 partite, versione intermedia con il «libero» a 6,5 m): da lì la scelta delle soglie.

## Decisioni superate
- Il computer libero entro 6,5 m dalla porta tirava con una probabilità (nella costruzione dei primi 18 s, oltre 4,5 m, solo 0,3 della
  voglia) e poteva passare indietro (v0.64, v0.81) → entro 5 m libero tira sempre, in qualunque momento; tra 5 e 6,5 m non passa
  indietro: finta e tiro, oppure passaggio a un compagno più avanti e libero (`OCCASIONE_PALESE`).
- Circolazione con la precedenza ai vicini (v0.53) → il compagno libero davanti alla porta è la prima scelta.
- Controfuga: posti d'attacco per numero dell'atleta (v0.54-v0.58) → posti del perimetro per vicinanza al recupero (`TRANSIZIONE`);
  corsie di ala e mezzo a 4 e 3,2 m → in viaggio 6 e 3 m; chi porta palla scivolava verso il centro → resta nella sua corsia.
- In ripartenza la palla andava avanti salvo pressione (v0.54) → con più attaccanti che difensori vicino alla porta mai indietro
  (`VANTAGGIO`); in più il lancio lungo.
- Separazione tra compagni sempre a 1,6 m → 2,4 m in transizione.

## Verifiche
- **Comportamenti** (sonde, 4 partite, versione finale contro v0.90):
  - libero entro 6,5 m (apertura 0,55, nessuno entro 2 m): **tiro 50% → 76%**, passaggio 42% → 21%, **passaggi indietro 15 → 5**
    (episodi 48 → 29); entro 5 m con 2,2 m di spazio tirava già sempre;
  - controfuga con più attaccanti che difensori vicino alla porta: episodi 7 → 13, **tiro 29% → 46%**;
  - con l'uomo in più invariato (tiro 38% → 40%), come voluto;
  - palla al compagno libero davanti alla porta: parità 71% → 75%, schema C 67% → 88%, uomo in più 78% → 81% (schemi A e D: nessun
    caso con un compagno libero nelle 4 partite).
- `npm run attacco` (nuova): 10 controlli superati: libero a 4,6 m tira dopo 0,63 s; libero a 6,2 m nella costruzione tira (niente
  passaggi); il compagno libero dall'altra parte riceve per primo dopo 0,37 s e tira; 2 contro 1 senza passaggi indietro, tiro da 5,1 m;
  1 contro 0 di palombella con il portiere che esce (v0.88); ripartenza dopo una zona: nessuno attraversa la vasca, distanza minima tra
  due compagni 2,0 m, un compagno entro 2,5 m da chi porta palla in 19 istanti su 114.
- `npm run lint`: nessun errore.
- `npm run prove`, primo giro: 68 PASS e 4 FAIL su 72 (`servizio-boa`, `entrate`, `entrate-integrazione`, `sezione1`). Cause e correzioni:
  - `servizio-boa` (v0.70): con il portiere avversario uscito a 1,9 m il centroboa a 2,6 m risultava «libero» e il passaggio assistito
    andava a lui. **Correzione nel gioco**: il portiere avversario entro 1,6 m toglie l'occasione palese (`OCCASIONE_PALESE.portiere`).
  - `entrate` ed `entrate-integrazione` (v0.68 di Codex): le scene tengono tutti i difensori lontani tranne il marcatore del portatore,
    quindi il centroboa a 2,6 m dalla porta era libero e la palla andava a lui invece che all'appoggio dello schema (la regola nuova). Nelle
    scene il centroboa ora è marcato: di fianco, dalla parte opposta al taglio, in `entrate`; fermo 1,4 m davanti a lui verso il campo in
    `entrate-integrazione`, per isolare il duello come prima. Controlli e soglie delle prove invariati.
  - `sezione1` (v0.28): la scena «passaggio dell'attacco oltre la linea di fondo» crea un passaggio verso il portiere senza punto d'arrivo;
    il portiere leggeva quello dell'ultimo passaggio vero della partita e, se non ce n'era stato, la sua posizione diventava non valida
    (NaN) e la partita della prova si bloccava (CAMBIA 0 su 6, nessun contatto). **Correzione nel gioco**: il portiere legge l'arrivo solo
    se è valido (`gkTarget`); nella scena il punto d'arrivo ora c'è, e il replay di un gol nell'attesa viene interrotto.
- `npm run prove`, secondo giro: **72 PASS su 72** (13,2 minuti).
- `npm run verifica -- --partite=0`: foto 1 e 2 entro la tolleranza; 3, 4 e 5 diverse perché la partita è in un'altra situazione in quel
  momento (nella 5, 4 s dopo l'inizio, prima i dieci giocatori stavano in una striscia stretta, ora sono distribuiti in corsie). Controllate
  e aggiornate con `npm run verifica:aggiorna -- --partite=0` (riferimenti 1 e 2 lasciati com'erano), poi «Verifica superata».
- `npm run aspetto -- --no-build --solo-foto`: «Tutto a posto», iPhone orizzontale 43 oggetti disegnati e 130.668 triangoli (massimo
  144.602 nel gruppo dall'alto).

## Non fatto, prossimo
- **Uomo in più** (v0.92, misure già fatte con `sonda-schemi-uomo`): lo schema «4-2 fermo» tra i quattro del computer non si muove (9
  superiorità su 48); negli altri a ogni fase i giocatori si spostano in media di 1,4-2,4 m, nell'ultima fase dell'«Uscita del 6» di
  0,56 m; il 40% dei primi tiri arriva dopo 8 s. La squadra di Ale ha uno schema solo se lo chiama.
- **Difesa che chiude l'uomo libero** (proposta): oggi ognuno guarda il suo uomo; in parità si riceve libero entro 6,5 m circa 6 volte a
  partita per squadra.
- **Ritmo** (da decidere con Ale): azioni in parità di 12-13 s contro 21 s veri.
