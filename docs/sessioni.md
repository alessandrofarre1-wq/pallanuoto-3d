# Sessioni di lavoro in sequenza

Una sessione nuova per ogni passo. Prima di lanciare il passo successivo: prova su iPhone, poi unisci la pull request.
Ogni messaggio va incollato così com'è.

## Regole comuni (valgono per tutti i passi; sono già ripetute in ogni messaggio)
- Fare solo quello che chiede il passo.
- Prima di scrivere codice: elenco in 5 righe di cosa si farà, poi STOP in attesa dell'ok di Ale.
- Verifica: npm run lint e npm run verifica --no-legacy, con i numeri delle partite simulate prima e dopo.
- Fine: screenshot iPhone orizzontale e verticale, 3 righe su cosa è cambiato, CLAUDE.md aggiornato, pull request, STOP.

## Passo 0 — Corpi e gesti (in corso)
Messaggio già inviato (stile libero, posizione in acqua, transizioni, bicicletta, dorso, gesti da zero).

## Passo 1 — Correzioni di regole (FATTO, v0.16)
Leggi CLAUDE.md, docs/tattica.md e docs/tecnica.md. Sessione: correzioni di regole, e SOLO questo:
- Rigore: tutti i giocatori tranne tiratore e portiere sulla linea dei 6 metri, ad almeno 3 metri dal tiratore.
- Regola dei 2 metri solo dentro l'area di porta: un attaccante laterale fuori dall'area ma dentro i 2 metri può ricevere e tirare.
Prima di scrivere codice elencami in 5 righe cosa farai e FERMATI ad aspettare il mio ok.
Dopo l'ok: npm run lint e npm run verifica --no-legacy, con i numeri delle partite simulate (gol, tiri a segno, espulsioni, superiorità trasformate, rigori) prima e dopo.
Alla fine: screenshot iPhone orizzontale e verticale di un rigore, 3 righe su cosa è cambiato, aggiorna CLAUDE.md, pull request, FERMATI.

## Passo 2 — Squadre nazionali (FATTO, v0.16)
Leggi CLAUDE.md, sezione "Squadre nazionali", e src/dati/squadre.json. Sessione: squadre nazionali, e SOLO questo:
- Nel menu scelgo la mia nazionale e l'avversaria tra le 16.
- Calottine (bianca, scura, portiere rossa), costumi e forza vengono dal file; una squadra in bianco e una in scuro.
- Nomi dei giocatori inventati e coerenti con la nazionalità (niente atleti reali).
Non toccare grafica, regole e IA oltre a quanto serve per la forza delle squadre.
Prima di scrivere codice elencami in 5 righe cosa farai e FERMATI ad aspettare il mio ok.
Dopo l'ok: npm run lint e npm run verifica --no-legacy, con i numeri delle partite simulate prima e dopo.
Alla fine: screenshot del menu e di una partita (iPhone orizzontale e verticale), 3 righe su cosa è cambiato, aggiorna CLAUDE.md, pull request, FERMATI.

## Passo 3 — Statistiche dei giocatori (FATTO, v0.16)
Leggi CLAUDE.md, sezione "Statistiche dei giocatori", e docs/tecnica.md. Sessione: statistiche, e SOLO questo:
- Sostituisci i 5 valori attuali con il sistema descritto (scala 40-99, statistiche per ruolo, portieri, mano, OVR), generato dalla forza della squadra.
- Resistenza tarata sui dati di docs/tecnica.md: dopo 6-7 contropiedi di fila un giocatore è visibilmente stanco.
- Pannello del giocatore controllato e rosa nel menu.
Verifica con partite simulate gli "effetti minimi" della specifica e riportami i numeri ottenuti. Non toccare la grafica.
Prima di scrivere codice elencami in 5 righe cosa farai e FERMATI ad aspettare il mio ok.
Dopo l'ok: npm run lint e npm run verifica --no-legacy.
Alla fine: screenshot di pannello e rosa (iPhone orizzontale e verticale), i numeri delle verifiche, 3 righe su cosa è cambiato, aggiorna CLAUDE.md, pull request, FERMATI.

## Passo 4 — Portiere (FATTO, v0.16)
Leggi CLAUDE.md e docs/tecnica.md, sezione "Portiere". Sessione: portiere, e SOLO questo:
- La parata dipende soprattutto da dove si trova il portiere quando parte il tiro (statistica Posizionamento), meno dal tuffo (Riflessi).
- Si sposta DURANTE i passaggi avversari, con un ritardo che dipende dalle statistiche; diagonali lunghe (da 2 a 5, da 4 a 1) più difficili.
- Palla lontana: basso, rema e guarda il gioco. Palla vicina: posizione alta, braccia pronte. Stanchezza legata ai salti.
- Coppia con il difensore: il muro copre il primo palo, il portiere l'angolo lungo.
Prima di scrivere codice elencami in 5 righe cosa farai e FERMATI ad aspettare il mio ok.
Dopo l'ok: npm run lint e npm run verifica --no-legacy, con i numeri delle partite simulate (gol, tiri a segno, parate) prima e dopo.
Alla fine: screenshot iPhone orizzontale e verticale e una sequenza di 4 immagini di un portiere che segue un passaggio e para, 3 righe su cosa è cambiato, aggiorna CLAUDE.md, pull request, FERMATI.

## Passo 5 — Tiro e difensore (FATTO, v0.16)
Leggi CLAUDE.md, docs/tecnica.md (sezioni "Tiro" e "Difensore e muro") e docs/tattica.md (sezione "Tecnica di tiro"). Sessione: tiro e difensore, e SOLO questo:
- Varianti di tiro: tiro di polso rapido (poco caricamento, meno potenza, più sorpresa); finta che si ferma e poi fa partire il polso; torsione verso il primo palo e chiusura in diagonale; tiro al volo su passaggio in superiorità.
- La precisione sopra il muro dipende dall'elevazione (gambe, Forza, Resistenza); la qualità delle finte dalla stabilità sulle gambe.
- Difensore: braccio alto soprattutto sulle diagonali, deciso dalla statistica Difesa; una finta riuscita gli abbassa il braccio per un attimo.
- Comandi: proponimi come attivare le nuove varianti con i pulsanti attuali (telefono e controller) prima di implementarle.
Prima di scrivere codice elencami in 5 righe cosa farai e FERMATI ad aspettare il mio ok.
Dopo l'ok: npm run lint e npm run verifica --no-legacy, con i numeri delle partite simulate prima e dopo.
Alla fine: screenshot iPhone orizzontale e verticale, primo piano di ogni variante di tiro, 3 righe su cosa è cambiato, aggiorna CLAUDE.md, pull request, FERMATI.

## Passo 6 — Difesa e allenatore (FATTO, v0.16)
Leggi CLAUDE.md e docs/tattica.md (sezioni "Difesa", "Attacco", "Allenatore e time-out"). Sessione: difesa e allenatore, e SOLO questo:
- Nuovo schema difensivo "Zona a M" (braccia alte, scalate rapide, taglia fuori i centroboa, favorisce la controfuga).
- Palla all'ala (1 o 5): il -1 cambia posizione e il -2 si abbassa per impedire il passaggio al centroboa; in attacco il 2 attacca lo spazio.
- L'IA sceglie la difesa in base all'avversario (centroboa forte → zona o M; tiratori forti dal perimetro → pressing) e alterna pressing e zona nella stessa partita.
- Pressing più aggressivo = più palle rubate ma più espulsioni, in base a Difesa e Disciplina.
- Time-out dell'IA dopo un parziale negativo o una serie di espulsioni subite; 7 contro 6 con il portiere avanzato nell'ultimo minuto se sotto di un gol.
Prima di scrivere codice elencami in 5 righe cosa farai e FERMATI ad aspettare il mio ok.
Dopo l'ok: npm run lint e npm run verifica --no-legacy, con i numeri delle partite simulate prima e dopo.
Alla fine: screenshot iPhone orizzontale e verticale della zona a M e di un 7 contro 6, 3 righe su cosa è cambiato, aggiorna CLAUDE.md, pull request, FERMATI.

## Passo 7 — Arbitro e bilanciamento (FATTO, v0.16)
Leggi CLAUDE.md, docs/tattica.md (sezioni 2 e 3) e docs/tecnica.md. Sessione: arbitro e bilanciamento, e SOLO questo:
- Severità dell'arbitro scelta a inizio partita (anche nel menu): sposta il confine tra contatto lecito, fallo ed espulsione, soprattutto ai 2 metri.
- Tara il gioco su questi obiettivi, misurati su almeno 20 partite simulate tra squadre di forza simile: 7-13 espulsioni per squadra; superiorità trasformate 30-60%; 1-2 rigori per squadra; tiri a segno circa 40%; la maggior parte dei gol dal perimetro contro difesa schierata o in superiorità, meno in controfuga, in entrata e del centroboa.
- Tabella prima/dopo per ogni obiettivo.
Prima di scrivere codice elencami in 5 righe cosa farai e FERMATI ad aspettare il mio ok.
Dopo l'ok: npm run lint e npm run verifica --no-legacy.
Alla fine: la tabella dei numeri, screenshot iPhone orizzontale e verticale, 3 righe su cosa è cambiato, aggiorna CLAUDE.md, pull request, FERMATI.
