# v0.53: la «fetta di gioco» — azione d'attacco in parità

Richiesta di Ale (17/11/2026): fermare le funzioni nuove e rendere ottimi i 30 secondi di gioco che si ripetono di più. Si parte da tre punti che Ale aveva segnalato:
- circolazione della palla macchinosa;
- marcatori incollati;
- assenza di scivolamento laterale in verticale.

## Cosa cambia

1. **Scivolamento in verticale** (`partita.js`, `fisica.js`).
   - Gli spostamenti brevi del computer, sotto 1,8 m, si fanno restando dritti con la bicicletta, in qualunque direzione, senza distendersi a crawl. Oltre 2,8 m si torna a nuotare; in mezzo resta la scelta precedente, così il giocatore non alterna i due modi a ogni fotogramma.
   - Mentre scivola, il giocatore guarda la palla, oppure la porta se la palla ce l'ha lui, e non la direzione in cui si sposta.
   - Il difensore di chi ha la palla non scivola: deve poter chiudere il tiro alla velocità piena.
2. **Marcatura secondo la distanza dalla palla** (`markTarget` in `ia.js`).
   - Chi marca un attaccante lontano dalla palla si stacca verso la porta e verso il lato della palla, pronto ad aiutare.
   - Mano a mano che la palla si avvicina al suo uomo torna a stringere: a 5 m è incollato come prima, a 10 m è staccato fino a 1,6 m e spostato di 0,4 m verso la palla.
   - Non vale per il marcatore del centroboa, per la zona a M né per chi difende sul giocatore «lasciato tirare».
3. **Circolazione più rapida** (`aiCarrier` in `ia.js`). Prima di cercare un passaggio il computer tiene la palla:
   - 1,3–2,2 s con lo stile «vicini» della strategia di partenza (prima 2,5–4,5 s);
   - 1,1–1,8 s con lo stile «equilibrati» (prima 1,9–2,9 s);
   - 0,8–1,2 s con lo stile «rapidi» (prima 1,1–1,7 s).

## Misure

`npm run misura-azione` (`strumenti/misura-azione-v053.mjs`): 2 partite computer contro computer ITA–HUN, semi 33 e 134.

| Voce | v0.52 | v0.53 |
|---|---|---|
| Spostamenti brevi (0,3–1,3 m/s) fatti in verticale | 17,1% | 49,2% |
| Attaccanti lontani dalla palla con il difensore entro 1,2 m | 27,8% | 21,5% |
| Distanza del difensore da un attaccante lontano dalla palla | 2,72 m | 2,80 m |
| Passaggi per azione in parità | 6,68 | 7,95 |
| Secondi di palla in mano prima del passaggio | 1,51 | 1,39 |

Bilancio con 8 partite ITA–HUN, valori per squadra a partita. Ho isolato l'effetto delle singole modifiche:

| Configurazione | Gol | Tiri | Tiri in gol | Espulsioni | Rigori | Espulsioni dalla lotta |
|---|---|---|---|---|---|---|
| v0.52 | 15,6 | 41,4 | 37,8% | 14,8 | 1,7 | 62% |
| Marcature e circolazione, senza scivolamento | 16,8 | 44,9 | 37,5% | 14,3 | 1,6 | 65% |
| v0.53 completa | 15,0 | 45,4 | 33,0% | 11,9 | 0,4 | 81% |
| Partite vere (Mondiali 2025) | 13,3 | 33 | 40% | 11 | 1,8 | 66% |

**Effetti collaterali, da riprendere nella taratura:**
- marcature e circolazione portano circa 3,5 tiri in più a partita;
- lo scivolamento riduce i contatti, quindi calano espulsioni da contrasto e rigori, e calano anche i tiri in gol.

Il numero di tiri dipende soprattutto da quante azioni ci sono (71 per squadra contro circa 50 nelle partite vere): è un problema che c'era già. Due tentativi di dare più pazienza al tiratore non hanno cambiato nulla e li ho tolti. Anche il tempo medio prima del tiro, circa 19 s di possesso, era già realistico.

## Video

`docs/filmati/v053-azione-prima-dopo.mp4`, con la tavola `docs/immagini/v053-azione-prima-dopo.jpg`:
- in alto la v0.52, in basso la v0.53;
- stesso seme e stessa camera del gioco, 12 s dal decimo secondo di gioco, 30 fotogrammi al secondo di tempo di gioco;
- le due partite partono identiche e divergono dopo pochi secondi, perché i giocatori si muovono in modo diverso: non è la stessa azione per tutti i 12 secondi;
- il disegno è in software: il video non misura la fluidità su iPhone.

Strumento: `npm run video-azione -- --uscita=cartella [--dist=build precedente]`.

## Non fatto
- Taratura di tiri, azioni, rigori e tiri in gol (vedi sopra).
- Smarcamento dedicato senza palla: oggi l'attaccante si offre solo con i piccoli appoggi già esistenti (`appoggio`).
- Scivolamento in verticale per il giocatore comandato da te: oggi scivola in verticale solo con la levetta inclinata poco (sotto metà corsa), come prima.
- Giudizio di naturalezza: spetta ad Ale, guardando il video e giocando.

## Verifiche sul codice finale
- `npm run lint`: PASS.
- Prove PASS: sezione1-6, tattica, strategie, gameplay, centroboa, v046, uomo, azione, nuoto, nuoto-coerente, gioco-fermo, orientamento, replay, gesti, posizioni, cronaca.
- `npm run verifica`: sei partite arrivate alla fine, 55 gol su 224 tiri (25%). Le immagini cambiano solo per le posizioni dei giocatori, controllate a occhio; riferimenti aggiornati, poi `--partite=0` PASS.
- `npm run aspetto`: PASS, gambe fuori dall'acqua 0. Campioni in verticale da 4.058 a 6.533, effetto dello scivolamento. Viste iPhone 47 oggetti e 140.506 triangoli, 45 oggetti e 140.248 triangoli.
