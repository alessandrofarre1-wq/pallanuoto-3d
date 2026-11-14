# Tempi di gioco — video Croazia–Spagna, finale europea 2024

Riferimento allegato da Ale il 14 novembre 2026: «HIGHLIGHTS | Croatia vs.
Spain | Final | European Water Polo Championships 2024_0_34.mp4».
Durata 34,017 s, 640×360, 25 fotogrammi/s. Analisi visuale di fotogrammi
estratti con timestamp, fino al passo di 0,04 s attorno ai tiri.
La compressione e la piccola dimensione della palla richiedono intervalli
approssimativi: il passo dei fotogrammi non equivale alla precisione della misura.

## Sequenze osservate

| Sequenza | Posizione nel filmato | Durata osservabile e interpretazione |
| --- | --- | --- |
| Scatto di inizio tempo | 0:00–circa 0:06 | Circa 5–6 s visibili fino alla contesa/primo contatto con la palla. Già nei primi fotogrammi c'è movimento: il momento preciso del fischio e l'eventuale parte precedente non sono stati stabiliti. |
| Preparazione del rigore | circa 0:10–0:12,7 | Oltre 2 s mostrati di posizione verticale, controllo della palla e preparazione. Il cambio d'inquadratura impedisce di attribuire una durata completa all'attesa prima del tiro. |
| Rigore, elevazione e tiro | circa 0:13,3–0:14,0 | Elevazione/caricamento nell'ordine di alcuni decimi; parte finale del gesto circa 0,2 s; rilascio intorno a 13,6–13,8 e arrivo in porta intorno a 13,9–14,0. Volo nell'ordine di 0,2–0,4 s. |
| Replay del rigore | circa 0:17–0:23,3 | Utile per la sequenza del gesto e la reazione del portiere. Tempi di riproduzione esclusi dalla misura della velocità reale. |
| Attacco schierato e tiro da fuori | circa 0:23,4–0:27,9 | Circa 4–4,5 s della parte finale dell'azione sono mostrate: circolazione, ricezione, elevazione e conclusione. Non è la durata dell'intero possesso. |
| Gesto conclusivo del tiro da fuori | circa 0:27,4–0:27,9 | Caricamento visibile intorno a 27,4–27,6; rilascio circa 27,6–27,7; arrivo in porta circa 27,8–28,0. Anche qui il volo dura pochi decimi. |
| Reazione ed esultanza | circa 0:28–0:30,7 | Circa 2,5–3 s mostrati fra campo largo e primo piano: rotazione, braccio/pugno alzato, movimento nell'acqua. Gli altri giocatori continuano a muoversi. Il montaggio non permette di misurare tutta la pausa fino alla ripresa dal centro. |
| Replay dell'azione | circa 0:30,8–fine | Il finale ripropone l'azione: non misura il tempo di ripresa dopo il gol. |

I timestamp identificano finestre da rivedere nel filmato. Non sono misure
biomeccaniche di laboratorio. La parte finale del gesto e il volo sono stime
con incertezza di circa uno o più decimi; non ricavo velocità in m/s senza
una calibrazione geometrica della vasca e della telecamera.

## Confronto con WATERPOLO 7

- **Scatto misurato nel gioco:** `node strumenti/misura-tempi.mjs`, simulazione
  a 60 Hz, Italia–Ungheria, seme 33, SPEED 1, campo 25 m: conto alla rovescia
  3,00 s; dal via al primo possesso **5,15 s**, palla all'Ungheria. È una singola
  prova, non una media e non una misura degli FPS del dispositivo. La parte
  visibile dello scatto nel video è dello stesso ordine di grandezza. Le
  dimensioni della vasca nel video non sono state calibrate: non si trasferisce
  automaticamente il medesimo tempo a distanze diverse.
- **Gesto del tiro:** il codice distingue alzata (`ALZATA=0,25 s`, quando si è
  distesi), caricamento e frusta (`0,166–0,189 s`, `src/tiri.js`). Le durate della
  parte finale sono compatibili come ordine di grandezza con quanto visibile.
  Per misurare la risposta ai comandi, cronometrare dal rilascio del tasto al
  rilascio della palla, annotando se il giocatore era già verticale e pronto.
  Il tempo per cui l'utente tiene premuto per scegliere la potenza va annotato
  separatamente. Da questo video non si ricava un nuovo valore preciso da
  sostituire ai dati della tesi già applicati.
- **Palla:** i tiri tesi attraversano lo spazio in pochi decimi. La leggibilità
  può venire da posa e reazione del portiere; rallentare artificialmente la
  palla cambierebbe il ritmo osservato. La simulazione della palla non è stata
  modificata in questa analisi.
- **Esultanza e ripresa:** `goalScored` (`src/regole.js`) ferma il gioco per
  2,6 s, riposiziona le squadre e ferma altri 1,2 s: **3,8 s programmati** prima
  della ripresa, più la scansione dei fotogrammi. La posa del volto esulta,
  mentre lo stato `stop` (`src/partita.js`) arresta gli spostamenti. Nel video
  esultanza e movimento dei giocatori coesistono. Il miglioramento da valutare
  è il ritorno alle posizioni durante la reazione al gol, con un gesto breve
  del marcatore. Il filmato non stabilisce che la ripresa reale avvenga dopo
  2,5–3 s: quella è soltanto la porzione di esultanza mostrata.

## Indicazioni per una prossima revisione del ritmo

Il riferimento suggerisce un'alternanza fra secondi di spostamento/lettura e
conclusioni esplosive di pochi decimi, con risposta immediata ai comandi.
Prima di cambiare i tempi: misurare più scatti, ricezione→rilascio con atleta
pronto e dopo nuoto, volo dei tiri tesi a distanza nota, e gol→ripresa.
Per l'esultanza, mostrare il gesto insieme al movimento verso il centro e
valutare il risultato con Ale. Queste sono indicazioni da discutere: **questa
analisi non modifica velocità, regole, animazioni o tempi della partita**.

Le regole del gioco restano quelle attuali già decise con Ale; il riferimento
video del 2024 serve a studiare ritmo e gesti, non sostituisce il regolamento.
