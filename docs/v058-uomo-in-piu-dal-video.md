# v0.58 — Uomo in più dal video della finale olimpica

Ale ha mandato una registrazione dello schermo: finale olimpica di Parigi 2024, Serbia–Croazia, 2° tempo da 7:20 a 7:14
(file di 7,5 s). La Croazia è in superiorità e segna.

## Cosa si vede (fotogrammi a 4 al secondo)
Numerazione dell'uomo in più, guardando la porta: 1 destra ai 2 m, 2 fuori palo destro ai 5 m, 3 fuori palo sinistro ai 5 m,
4 sinistra ai 2 m, 5 palo destro, 6 palo sinistro.

1. **7:20.** Partenza in 4-2. Il 6 lascia il palo e nuota verso il centro dei 5 metri; il 4 passa al 1 attraverso la porta (Ale:
   «è rischioso, ma a quei livelli si fa spesso per rendere la vita difficile alla difesa»).
2. **7:19.** Nasce il 3-3: il 5 è al centro della porta. Ai 2 metri restano 1, 5 e 4; ai 5 metri ci sono 2, 6 e 3.
3. **7:18.** Il 1 passa al 2. Un difensore esce sul 2 con il braccio alto; il 2 tiene palla circa 1 secondo.
4. **7:16.** Il 2 fa un passaggio lungo che scavalca il 6 e arriva al 3, lasciato libero.
5. **7:15-7:14.** Il 3 tira circa 1,3 s dopo aver ricevuto, basso sul primo palo. Il difensore arriva disteso e in ritardo: gol, con
   ancora 3 secondi di espulsione (circa 15 s dall'inizio della superiorità).

## Indicazioni di Ale sulla difesa
«Quando l'attacco si posiziona in 3-3 i difensori che prima stavano davanti ai pali si devono mettere in mezzo tra 2-3 e il 6 che è
uscito ai 5 metri, e si devono fare il mazzo saltando da un giocatore all'altro seguendo la palla. Di solito si lascia il tiro al
giocatore più lontano, ma bisogna disturbarlo.»

## Cosa cambia nel gioco
- **Schema «Uscita del 6»** (`uomo-in-piu.js`, `u6esce`, sigla «Esce il 6»): fase 1 di 1,5 s in 4-2 con la palla al 1; fase 2 di
  2,5 s in 3-3 (il 6 al centro dei 5 m, il 5 al centro della porta) con la palla al 2; fase 3 con la palla al 3. È nella libreria
  per il giocatore e il computer lo usa insieme ai tre schemi di partenza (`SCELTI_COMPUTER`).
- **Difesa contro il 3-3** (`ia.js`, `postiInferiorita`, misure `TRE_TRE`): quando un attaccante è al centro dei 5 metri, i due
  difensori che stavano davanti ai pali si mettono a metà tra il loro tiratore ai 5 metri e il 6, un po' più vicini alla porta.
  Saltano su chi ha la palla: sul tiratore dalla loro parte, e sul 6 va il più vicino dei due. Con la palla dall'altra parte si
  spostano verso il 6 per aiutare; quando l'altro difensore è uscito sul 6, si spostano verso il proprio tiratore per disturbarlo.
- **Superiorità del computer più paziente** (`ia.js`, `SUPERIORITA`): prima di cercare il tiro si aspettano 7 s (prima 5); la voglia
  di tirare cresce da 9 a 13 s (prima da 5 a 9). Si tira subito solo nei primi 3 s («quick», come prima) o entro 1,6 s da un
  passaggio che ha cambiato lato (dopo i primi 3 s), come nel video.

## Prova
`npm run inferiorita` (in CI) ha tre scene nuove contro il 3-3, con l'attacco schierato come nell'«Uscita del 6»:
- palla al 2: un difensore è a 1,08 m dal 2, l'altro sta a metà tra il 3 e il 6;
- palla al 6: un difensore salta sul 6;
- palla al 3: un difensore è a 1,07 m dal 3.

Il primo tentativo falliva sulla palla al 6 per un errore nel codice (confrontavo il portatore con il difensore scelto): corretto.
Foglio con le sette situazioni: `docs/immagini/v058-uomo-in-meno.png`.
La prova `v046` controlla ora 10 schemi nella libreria (prima 9), compreso il nuovo.

## Bilancio (8 partite ITA–HUN, per squadra, v0.57 → v0.58)
- superiorità trasformate 36,1% → 41,3% (Mondiali 2025: 52%);
- gol 15,5 → 16,5; tiri 53,9 → 51,9; tiri in gol 28,8% → 31,8%; espulsioni 12,6 → 11,2; rigori 2,6 → 2,4; intercetti 4,3 → 4,9;
  azioni 80,9 → 78,5; parità: palla persa 7,4% → 10,1%.
- In superiorità i tiri sbagliati arrivano dopo circa 12 s (v0.57: 11 s). La durata media della superiorità resta bassa (6,7 s), anche
  perché il conteggio delle azioni finite in gol non ne somma la durata (`golDaTiro` sposta l'esito ma non la durata): da correggere.

## Verifiche sul codice finale
- `npm run lint` PASS.
- Tutti i passi della CI in locale PASS. `posizioni` falliva perché la sua «impronta» comprendeva tutta la libreria degli schemi:
  ora l'impronta resta sugli schemi precedenti (identica, quindi non sono cambiati) e lo schema nuovo ha un controllo a parte.
- `npm run verifica`: sei partite arrivate alla fine, 81 gol su 261 tiri (31%), cinque immagini dentro la tolleranza.
- `npm run aspetto` PASS: 0 gambe fuori dall'acqua; viste iPhone 54 oggetti / 141.282 triangoli.

## Non fatto
- Il 3-3 nasce solo dallo schema «Uscita del 6» e dagli altri schemi con un attaccante al centro dei 5 metri; la difesa non
  distingue ancora uno schema dall'altro.
- I numeri sono ricavati da una sola azione: altri spezzoni di superiorità servirebbero a capire quanto questo modo di giocare sia
  la regola.
