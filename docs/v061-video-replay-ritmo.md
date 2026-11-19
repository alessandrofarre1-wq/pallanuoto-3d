# v0.61 — Dai video della finale: replay da TV, palla che gira più veloce, tiro da fuori e portiere

Ale ha mandato sette spezzoni (registrazioni dello schermo, 60 fotogrammi al secondo): cinque della finale olimpica di Parigi 2024
Serbia–Croazia, uno di Ferencváros–Recco (Champions League) e un replay della TV. Richieste: «tre azioni da analizzare», «un tiro
da fuori visto da vicino… non so se vedi in generale la fluidità dei movimenti e la velocità della palla», «questo è un replay e
direi che ha senso che l'inquadratura cambi, non come la stai facendo ora che è statica», «dai su cerchiamo di velocizzare».

## Cosa si vede nei video (fotogrammi a 4, 8 e 15 al secondo)
- **Replay della TV** (gol di Rasović): circa 4 s di ripresa alta che ruota e segue l'azione, al rallentatore; poi una dissolvenza
  su un primo piano a pelo d'acqua del marcatore che esulta (circa 3 s), con nome e risultato in sovrimpressione.
- **Tiro da fuori di Mandić** (ripresa ravvicinata e replay da dietro la porta): semi-disteso sul dorso con il difensore addosso,
  gira il corpo e pesca la palla dall'acqua (0,4-0,5 s), la porta di lato all'altezza della spalla con il braccio libero teso per
  l'equilibrio, esce dall'acqua quasi fino ai fianchi, rilascia a circa 0,5 s dalla presa e ricade in avanti. Il portiere, mentre il
  tiratore carica, sale fuori dall'acqua con le braccia spalancate e alte, poi si tuffa di lato.
- **Circolazione**: sul perimetro la palla resta in mano 0,6-1 s per tocco (presa alta, pronta al tiro), poi un passaggio teso in
  0,25-0,4 s; le azioni finiscono spesso con un tiro da 7-8 m dopo un passaggio.
- **Velocità della palla**: il tiro di Kharkov da circa 8 m arriva in porta in circa 0,4 s (circa 20 m/s). Nel gioco i tiri partono
  a 20-25 m/s e i passaggi a 11-15,5 m/s: già in linea. A rallentare il gioco era il tempo con la palla in mano.

## Cosa cambia
1. **Replay come in TV** (`grafica/replay-camera.js`, `grafica/replay.js`, `replay-regia.js`, `replay-ui.js`, `stile.css`):
   - inquadratura dell'azione: la camera alta gira di circa 35° da un lato del campo verso dietro il tiratore e intanto scende
     (`REGIA_REPLAY.orbita`); a ogni fotogramma la distanza si ricalcola perché palla, tiratore, portiere e porta restino in vista;
     attorno al rilascio la ripresa si stringe sul tiro. Resta sempre dal lato della giuria (mai girata di 180°);
   - poco dopo la rete (0,1 s) un taglio con un lampo bianco breve porta a un **primo piano a pelo d'acqua del marcatore che
     esulta**, al rallentatore, con un lento avvicinamento e un piccolo arco. L'angolo si sceglie davanti al viso (dopo una beduina
     chi segna dà le spalle alla porta), senza corpi in mezzo né attaccati alla camera, dentro la vasca. Da vicino i numeri sopra le
     teste sono nascosti (si leggono quelli sulle cuffie). Se il marcatore è stato sostituito subito dopo il gol, niente primo piano.
   - il replay dura sempre 5,2 s: 70% azione, 30% primo piano.
2. **Palla che gira più veloce** (`ia.js`, `CIRCOLAZIONE`): il computer tiene palla sul perimetro 0,55-0,95 s con lo stile
   equilibrato (prima 1,1-1,8), 0,4-0,65 (prima 0,8-1,2) con quello rapido, 0,7-1,15 (prima 1,3-2,2) con quello «vicini» e
   0,4-0,75 in superiorità (prima 0,55-1,05).
3. **Tiro da fuori** (`grafica/pose.js`, `ALZATA_TIRO`; `grafica/corpo.js`, `BACINO_TIRO`): nel tiro classico da oltre 5 m (pieno
   da 7 m) il corpo disegnato esce di più dall'acqua man mano che carica; il bacino può salire fino a 14 cm sotto il pelo dell'acqua
   (di solito 22 cm). Solo disegno: la palla parte dallo stesso punto di prima.
4. **Salto di preparazione del portiere** (`grafica/pose.js`, `PREPARA_GK`): quando un avversario entro 10 m carica il tiro, il
   portiere sale (20 cm) con le braccia alte e larghe e i palmi verso il tiratore; poi, con la palla in volo, la parata come prima.
   Solo disegno.

**Decisione superata.** La v0.48 aveva fissato la camera ferma durante la ricezione e tutto il volo, con lo stesso orientamento e
solo un avvicinamento dopo la rete. Su indicazione di Ale ora la camera si muove e dopo la rete c'è un taglio sul primo piano.

## Misure
- **Replay** (`npm run replay`, prova aggiornata alla nuova regola):
  - in sei scenari (tiro da fuori, dall'ala, palombella; due direzioni) e tre schermi la camera dell'azione gira di 0,62 rad
    (35°), al massimo 0,055 rad e 1,42 m tra due campioni, quindi senza scatti;
  - c'è un solo taglio;
  - nel primo piano la testa del marcatore è 2,3-5,4 volte più grande che nell'azione;
  - palla, testa, mano e porta restano in vista e fuori dall'interfaccia per tutta l'azione;
  - costo grafico invariato: 48-49 oggetti, 146 mila triangoli.
- **Tiro e portiere** (`strumenti/foglio-tiro-v061.mjs`, altezze delle ossa sull'acqua prima del rilascio, tiro da 7 m):
  - tiratore: testa da 0,54 a 0,64 m, bacino da -0,22 a -0,14 m;
  - portiere: testa da 0,21 a 0,35 m, mani da 0,19 a 0,64 m;
  - il tiro da 4 m è invariato.
  - Foglio: `docs/immagini/v061-tiro.png`.
- **Partita identica** con i soli cambi di disegno (`npm run aspetto --confronta`). Gambe sopra l'acqua: 0 campioni (con il
  bacino a -0,08 m una coscia sfiorava la superficie: limite abbassato a -0,14 m).
- **Circolazione** (`npm run misura-azione`, 2 partite): palla in mano prima del passaggio da 1,31 a 1,11 s; passaggi per azione in
  parità da 8,8 a 9,1. Sotto questo valore pesano l'intervallo tra una decisione e l'altra del computer e i momenti senza compagni
  liberi.

## Bilancio (8 partite ITA–HUN, per squadra)
Con i tempi di circolazione finali (i cambi successivi sono solo di disegno: partita identica).
| | v0.60 | v0.61 | reale |
|---|---|---|---|
| tiri | 44,1 | 43,6 | 33 |
| gol | 14,9 | 15,3 | 13,3 |
| tiri in gol | 33,9% | 35,0% | 40% |
| espulsioni | 11,1 | 11,6 | 11 |
| superiorità trasformate | 41,2% | 43,0% | 52% |
| rigori | 2,6 | 2,2 | 1,8 |
| azioni | 69,6 | 70,0 | circa 50 |
| parità: durata | 14,5 s | 14,4 s | circa 21 s |
| parità: palla persa | 11,1% | 11,7% | circa 20% |

Un giro intermedio con tempi un po' più lunghi (0,7-1,15 s con lo stile equilibrato) aveva dato tiri in gol 38,4% e superiorità
43,7%: tra due giri da 8 partite c'è qualche punto di variazione. La palla che gira più veloce non aumenta i tiri.

## Verifiche sul codice finale
- `npm run lint` PASS; tutti i 34 passi della CI in locale PASS (compresa la prova del replay aggiornata).
- `npm run verifica`: sei partite arrivate alla fine, 54 gol su 211 tiri (26%). Tre immagini diverse dal riferimento solo per le
  posizioni dei giocatori (palla che gira più veloce; tabellone e minuto uguali): controllate, riferimenti aggiornati, poi
  `--partite=0` PASS.
- `npm run aspetto` PASS: 0 gambe fuori dall'acqua; viste iPhone 55 oggetti / 141.778 triangoli.

## Non fatto
- La presa della palla dall'acqua prima del tiro (Mandić la pesca dal dorso) non ha un gesto dedicato: il tiro parte dalla palla
  già in mano.
- Il primo piano usa i 0,56 s registrati dopo la rete: per un'esultanza più lunga servirebbe registrare di più dopo il gol.
- La palla in mano resta circa 1,1 s in media (finale: 0,6-1 s).
