# v0.86 — Rose: tutti i giocatori disponibili, i 14 della partita scelti per ruolo, 15 convocati nei tornei

## Richiesta
Ale (24/11/2026), punto 11 della lista: «rose: usare i giocatori a disposizione dei CT, non ritirati (all'Italia mancano Francesco Di
Fulvio ed Edoardo Di Somma)». Poi: «Mettimi tutti e poi scelgo io all'inizio della competizione chi convocare. Non farlo solo per l'Italia
ma per tutte le nazionali. In partita singola lasciami tutti i giocatori. Non so chi si è ritirato quindi considerali tutti». E: «Per
le rose su partita singola mettimi tutti i giocatori disponibili nella sezione in cui scelgo la squadra. Ma per la partita scegli i più
forti nel ruolo. Se ci sono doppi ruoli (molto probabile) scegli i secondi più forti dando variabilità ai cambi per coprire il più
possibile più ruoli».

## Le regole
Regole World Aquatics del 18 febbraio 2026 (parte sei): a ogni partita al massimo **14** giocatori, di cui al massimo 12 di movimento e
2 portieri (art. 2.2.2); ai Mondiali la squadra ne iscrive **15** (14 più una riserva; appendice, 1.4.2). Agli Europei 2026 le nazionali
ne hanno convocati 15. Il gioco finora metteva in partita 13 giocatori (la regola olimpica).

## Cosa diceva il codice
- Per ogni nazionale una rosa di 13: la convocazione più recente con almeno 13 giocatori, i 2 portieri e gli 11 di movimento con più
  minuti (`strumenti/rose-dal-database.mjs`). Chi era solo in un torneo precedente non c'era: all'Italia mancavano Di Fulvio (solo
  Mondiali 2025), Di Somma (Mondiali 2025, Europei 2026 e Coppa del Mondo, ma non alle finali), Bruni, Damonte, Velotto, Presciutti...
- La schermata Squadre mostrava i 7 in acqua e le 6 riserve.

## Cosa cambia
1. **Tutti i disponibili** (`strumenti/rose-dal-database.mjs`, `src/dati/rose-db.json`, `tutti` in `src/dati/rose.js`): per ogni
   nazionale chi è stato convocato in almeno un torneo del database (Mondiali 2025, Europei 2026, Coppa del Mondo 2026), con numero,
   ruolo e mano della convocazione più recente. Le valutazioni si calcolano come prima e con le stesse medie della squadra (poi la
   correzione del punto 7). Cambia il nome mostrato di 12 giocatori che ora hanno un omonimo nella nazionale (per esempio i fratelli
   Vigvari). In tutto 482 giocatori; l'Italia ne ha 25, la Croazia 34, la Spagna 24. Le otto nazionali aggiunte agli Europei hanno tutti
   i 15 convocati ufficiali (Slovacchia 14), con le statistiche stimate per ruolo come prima.
2. **Doppioni**: il database ha 23 giocatori con due schede (nome scritto in due modi: «TAHULL Roger» e «TAHULL COMPTE Roger», «LAZIC
   Dorde» e «LAZIC Djordje», «CASSIA Francesco» e «CASSIA Francesco Lorenzo»...). Stessa nazionale, stessa data di nascita e stesso nome
   (o stessa iniziale e un cognome in comune) = stessa persona: resta una scheda con tutte le convocazioni. I gemelli Hessels (Olanda)
   restano due. Le statistiche della seconda scheda per ora non si sommano.
3. **Ruoli doppi**: dall'anagrafica del database 95 giocatori hanno due o tre ruoli (per esempio «Centre Forward, Driver»): la scheda li
   tiene tutti (`ruoli`) e nella schermata compaiono come «anche …».
4. **I 14 della partita** (`listaPartita` in `src/dati/rose.js`, `LISTA`): la forza in un ruolo è la valutazione con i pesi di quel
   ruolo, anche per un secondo ruolo.
   - titolari: il portiere più forte; poi centroboa, punto, ala destra e sinistra, mezzo destro e sinistro, ognuno il più forte che sa
     fare quel ruolo (se non c'è, di un ruolo vicino);
   - panchina: il secondo portiere, poi una riserva per ogni posto, il più forte rimasto che sa fare quel ruolo (se non c'è, l'altro lato
     dello stesso ruolo o un ruolo vicino); chi sa fare anche un altro posto ancora scoperto lo copre, e il posto libero va al più forte
     rimasto;
   - a parità di forza resta chi era nella rosa usata finora.
   Numeri di calottina unici nella lista: ognuno tiene quello della sua convocazione più recente; se due hanno lo stesso numero lo tiene
   chi era nella rosa usata finora, poi chi l'ha indossato nel torneo più recente, gli altri il primo libero.
5. **Schermata Squadre**: in acqua i 7, in panchina gli altri della lista e sotto **tutti gli altri disponibili** della nazionale (con
   ruoli, tornei e finta). Toccando un giocatore della panchina e poi uno degli altri li si scambia (un portiere solo con un portiere);
   «Scelta automatica: i più forti per ruolo» torna alla lista del gioco. Lista e formazione si ricordano per nazionale (per id, non più
   per numero).
6. **Tornei**: alla creazione il gioco propone i 15 convocati (la lista automatica di 15); nel centro torneo il riquadro «Scegli i
   convocati» apre la schermata **Convocazione** (tutti i disponibili per ruolo, da 2 a 3 portieri, conferma solo con 15). La
   convocazione si cambia fino alla prima partita della propria nazionale; a ogni partita la lista dei 14 viene dai convocati (e la si può
   cambiare nella schermata Squadre tra i convocati). Le altre nazionali scelgono i 14 tra tutti i loro disponibili con la stessa regola.
7. **Forza della nazionale al ranking** (`riportaAlRanking` in `strumenti/rose-dal-database.mjs`; la scelta è in
   `src/dati/lista-partita.js`, usata dal gioco e dal costruttore). Scegliendo i più forti tra tutti i disponibili, i 14 della partita
   valevano un po' più dei 13 di prima (valutazione media di movimento: Ungheria 83,5 → 84,3, Serbia 79,9 → 81,5, Italia 76,1 → 76,5),
   di più dove i disponibili sono tanti. Il metodo delle valutazioni (`docs/riferimenti/valutazioni.md`, punto 1) vuole la forza della
   squadra uguale al suo ranking: tutte le voci dei disponibili di una nazionale scendono quindi di quanto la valutazione media dei 14
   supera quella dei 13 di prima, prima dell'arrotondamento (movimento: Italia 0,41, Ungheria 0,70, Serbia 1,59, Spagna 0,16, Croazia
   0,64; portieri a parte). Chi è più forte resta più forte, e i 14 valgono quanto i 13 di prima (Italia 76,1, Ungheria 83,3, Serbia
   80,0).

## L'Italia (lista automatica)
In acqua: Nicosia (74); Bruni (centroboa, 80); Carnesecchi, Alesiani, Ferrero, Cassia, Iocchi Gratta. In panchina: Baggi Necchi
(portiere), Gianazza, Condemi (punto, anche mezzo e ala), Campopiano, Cannella, Dolce, Del Basso. Tra gli altri disponibili: Antonucci
(75), Patchaliev (74), Di Somma (73), Di Fulvio (72), Damonte, Velotto, Presciutti, De Michelis, Balzarini, Guerrato, Del Lungo. Di
Fulvio e Di Somma restano fuori dalla scelta automatica perché le loro valutazioni, stimate dai tornei del database, sono sotto quelle
dei compagni di ruolo (Di Fulvio ha dati solo dei Mondiali 2025): si mettono in lista dalla schermata Squadre.

## Misure
In corso: 16 partite ITA–HUN sulla versione con la forza riportata al ranking.

## Prova nuova: `npm run rose`
Quindici controlli: 24 nazionali con tutti i disponibili; nessun giocatore due volte; 14 in partita (12 di movimento, 2 portieri); la
panchina copre tutti i ruoli quando c'è chi li sa fare; Italia con numeri diversi, con Di Fulvio e Di Somma tra i disponibili e i
titolari più forti nel ruolo; la schermata Squadre con 7 + 7 + gli altri disponibili; scambio tra panchina e altri ricordato; scelta
automatica; torneo con 15 convocati proposti, conferma solo con 15, lista della partita dai convocati; di nuovo tutti in partita veloce.

## Verifiche
In corso: `npm run lint`, `npm run prove`, `npm run verifica -- --partite=0`, `npm run aspetto -- --no-build --solo-foto`.

## Decisioni superate
- Rosa di 13 dalla convocazione più recente → tutti i disponibili della nazionale; in partita 14 (regole 2026), scelti per ruolo con una
  riserva per posto.
- Valutazioni dei 13 calcolate solo sui 13 → su tutti i disponibili, riportate al ranking della nazionale (scendono da 0 a 1,6 punti).
- Formazione ricordata per numero di calottina → per id del giocatore (i numeri si assegnano a ogni lista).
- Nei tornei la rosa era quella fissa della nazionale → 15 convocati, proposti dal gioco e scelti prima della prima partita.

## Non fatto
- Le statistiche delle due schede di uno stesso giocatore non si sommano (resta la scheda usata finora o la più recente).
- Le valutazioni restano stime dalle statistiche dei tornei del database: chi ha giocato poco (Di Fulvio solo ai Mondiali 2025) viene
  tirato verso la media. Si possono correggere a mano se Ale lo chiede.
- Ritirati: nessuno escluso (Ale: «considerali tutti»).
