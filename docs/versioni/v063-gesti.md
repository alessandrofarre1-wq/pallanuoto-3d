# v0.63 — Gesti: fogli a tre lati, passaggio di lato, palla pescata dall'acqua, esultanza più lunga nel replay

Ale, sulla lista dei prossimi punti: «Io farei questo partendo dal punto 11», cioè il gruppo dei gesti: 11 (controllo con foto da
tre lati di passaggio, beduina, palombella, ricezione, parata, muro e nuoto con palla), 9 (il tiratore che pesca la palla dall'acqua,
come Mandić nel suo video) e 10 (esultanza più lunga nel replay). Tutto è nello strato del solo disegno: la partita non cambia
(dimostrato sotto).

## Punto 11: i fogli a tre lati
**Strumento** `npm run gesti-foglio` (`strumenti/gesti-foglio.mjs`). Mette in scena un gesto alla volta, vicino alla porta e con il
caso bloccato:
- passaggio verso sinistra (il caso più difficile per un destro) e la ricezione del compagno;
- palombella;
- beduina, con il difensore dietro e la lotta al centro vera;
- parata e muro;
- nuoto con palla;
- il tiro dal nuoto del punto 9.

Per ogni gesto fotografa sei momenti da tre lati (davanti, di lato, da dietro). Accanto alle foto mette le misure del corpo
disegnato: angolo dei gomiti, altezza di mani, testa e bacino, punto più alto delle gambe, distanza tra palla e palmo, palla dentro
teste o busti, mani dentro la propria testa o negli altri, stato della lotta e palla in acqua. Scrive un foglio per gesto, un
riassunto con una riga per gesto e le misure in JSON.

**Cosa si vedeva** nei fogli della v0.62:
- **Passaggio verso il lato opposto al braccio**: al rilascio l'avambraccio passava davanti al viso e a fine gesto la mano finiva
  sulla faccia. Il braccio tornava dritto davanti già nell'accompagnamento, con il busto quasi fermo.
- **Ricezione**: chi aspetta il passaggio guardava dritto davanti a sé, non la palla che arrivava.
- **Palombella**: nell'accompagnamento il braccio era del tutto teso (174°), come un bastone.
- **Beduina, parata, muro e nuoto con palla**: niente compenetrazioni (palla e mani sempre fuori da teste e busti) e gambe sempre
  sotto l'acqua (punto più alto a −0,35 m). Muro e parata allungano il braccio fino a 172-174°: è un allungo verso la palla, lasciato
  così.

**Correzioni** (`grafica/pose.js`, solo disegno):
- **Passaggio di lato** (`PASSAGGIO_VISTA`):
  - il busto gira verso il compagno: il 70% dell'angolo se il passaggio va dalla parte opposta al braccio, il 35% dalla stessa
    parte, al massimo 1,1 rad;
  - la testa guarda il compagno, fino a 1,3 rad;
  - il braccio punta al compagno fino al rientro, poi la mano rientra in acqua di lato (`FINE_LEGGERO`, anche nella palombella);
  - le gambe e il bacino restano verso la porta.
- **Ricezione** (`RICEZIONE_TESTA`): la testa gira verso la palla in volo, fino a 1,2 rad.
- **Palombella**: nell'accompagnamento il gomito resta appena piegato (`ACCOMPAGNA.lob`).

## Punto 9: la palla pescata dall'acqua
**Prima**: chi nuotava con la palla davanti alla testa e tirava (o passava, o fintava) la vedeva saltare in un fotogramma
dall'acqua a sopra la testa.

**Ora** (`PESCA`):
1. la mano arriva sulla palla in acqua;
2. ci passa sotto;
3. la porta di lato all'altezza della spalla, come Mandić;
4. poi parte la carica di sempre.

La palla disegnata resta in acqua finché la mano non la raccoglie. La pesca dura al massimo 0,32 s e mai oltre l'80% della carica
del gesto: i tempi del gioco non cambiano e la palla parte sempre dallo stesso punto. Vale anche quando il giocatore tiene
premuto TIRO mentre nuota.

Misure nel tiro dal nuoto:

| momento | prima | dopo |
|---|---|---|
| 0,1 s dall'inizio | mano già a 0,59 m sull'acqua con la palla | mano sulla palla in acqua (0,15 m) |
| 0,17 s | — | mano sotto la palla (0,12 m) |
| 0,28 s | — | palla di lato (0,25 m) |
| carica piena | 0,45 s | 0,45 s, come prima |

## Punto 10: esultanza più lunga nel replay
- **Più esultanza registrata**: la diretta dopo il gol passa da 0,6 a 1,2 s e dopo la rete si registrano 1,15 s (prima 0,56). Per
  non togliere azione prima del gol, l'archivio passa da 3,5 a 4,2 s e la clip da 3 a 3,6 s.
- **Più spazio al primo piano**: occupa il 38% del replay (prima il 30%), circa 2 s di schermo.
- **Esultanza più viva** (`ESULTA`): chi ha segnato si alza con la bicicletta (12 cm) e agita il pugno con il braccio alzato (2,2
  colpi al secondo). Prima alzava soltanto il braccio.
- **Durata**: il replay dura in tutto 7,6 s (prima 7) e si può sempre saltare. Il cronometro della partita resta fermo come prima
  (2,6 + 1,2 s).
- **Prova `npm run replay`**, aggiornata ai tempi nuovi:
  - 7,6 s in tutto;
  - memoria massima 19,6 MB (limite 24 MB);
  - archivio fino a 127 fotogrammi;
  - durante il replay al massimo 49 oggetti disegnati e 146.360 triangoli.

## Il gioco è identico
- **Stesse partite, stesso risultato**: 3 partite ITA–HUN a durata vera con il caso bloccato, giocate con la build di `main` (v0.62) e
  con la nuova: riassunto identico byte per byte (12-15, 11-16, 16-21, come nella v0.62).
- **Aspetto** (`--salva` sulla build di `main`, `--confronta` sulla nuova): «partita simulata identica», 0 campioni di gambe fuori
  dall'acqua, viste iPhone 55 oggetti e 141.778 triangoli. Le sei foto a telecamera fissa cambiano solo in piccoli dettagli delle pose
  (8.000-37.000 punti su 1,3 milioni): sono le correzioni volute.
- **Verifica**: le sei partite danno gli stessi numeri di prima (54 gol su 211 tiri).

## Verifiche
- `npm run lint`: PASS.
- `npm run prove`: al primo giro 35 PASS e 1 FAIL. La prova del gioco fermo (`gioco-fermo`) aspettava il replay 0,67 s dopo il gol:
  ora la diretta dura 1,2 s, quindi l'attesa è stata portata a 1,27 s. Al secondo giro **36 PASS, 0 FAIL** su 36 passi in 9,3 minuti.
- `npm run verifica`: qualità e tornei superati; sei partite arrivate alla fine, 54 gol su 211 tiri (come la v0.62). Le foto 4 e 5
  (iPhone piccolo e orizzontale) differivano dai riferimenti dello 0,92% e dello 0,76% dei punti: stesse posizioni, cambiano solo
  braccia e teste dei giocatori. Controllate, riferimenti aggiornati con `npm run verifica:aggiorna -- --partite=0` (anche il menu,
  per la scritta «v0.63») e verifica ripetuta: cinque immagini identiche.
- `npm run aspetto` completo con `--confronta`: PASS (sopra).
- `npm run replay`: PASS con i tempi nuovi (7,6 s, 19,6 MB, 49 oggetti e 146.360 triangoli al massimo).
- `npm run gesti-foglio`: otto fogli prima e dopo, nessuna compenetrazione nelle misure.

## Immagini
- `docs/immagini/v063-gesti-prima.jpg`, `docs/immagini/v063-gesti-dopo.jpg`: riassunto, una riga per gesto.
- `docs/immagini/v063-passaggio-prima.jpg` e `-dopo.jpg`, `docs/immagini/v063-pesca-prima.jpg` e `-dopo.jpg`: i due gesti cambiati
  di più, da tre lati.
- `docs/immagini/v063-gesti-dopo.json`: le misure.
- Gli altri fogli si rifanno con `npm run gesti-foglio -- --tag=dopo`.

## Non fatto
- Il giudizio di Ale sui fogli e su come appaiono in partita.
- Muro e parata a braccio del tutto teso.
- Il corpo in nuotata con la palla forse troppo inclinato (24°): da confrontare con un video.
- Un solo modo di esultare; nessuna espressione nuova del viso (Ale ha chiesto di non toccarle).
