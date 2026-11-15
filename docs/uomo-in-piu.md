# Schemi dell'uomo in più (v0.44)

Richiesta di Ale (15/11/2026): ripensare il 6 contro 5. Chi attacca sceglie e chiama uno schema; nella preparazione della squadra si scelgono al massimo 3 schemi da una libreria che può avere decine di schemi; il giocatore può creare e salvare schemi propri in una sezione dedicata.

## Fonti

- C. Mistrangelo, «Pali in superiorità numerica», prima e terza puntata, Area Tecnica, Rari Nantes Savona (PDF di Ale): schieramenti 4-2, 3-3, 3-3 che diventa 4-2, 4-2 che diventa 3-3, rotazione verso 1, 4-2 → 3-3 → 4-2 dall'altro lato (fig. 1-6); uscita del 5 con scivolamento del palo (fig. 20-21); tecnica dei pali (scivolamento, trazione, schiacciata, deviazione al volo).
- S. Campagna, «L'area di porta cambia la difesa in meno», wpdworld.com (6/10/2022): con l'area di porta gli esterni 1 e 4 possono restare dentro i 2 metri in un angolo chiuso («schiacciata» della Serbia). Non è nella libreria: la regola dell'area di porta del gioco (art. 8.2.8) oggi non lascia stare un attaccante dentro l'area davanti alla linea della palla.

Numerazione dei documenti → ruoli del gioco: 1 = ala destra (2), 5 = ala sinistra (3), 2 = mezzo destro (4), 4 = mezzo sinistro (5), P1 = centroboa (1), P5 = punto (6).

## Come è fatto

- `src/uomo-in-piu.js`: uno schema è una sequenza di 1–4 **fasi**. Ogni fase ha i 6 posti `[distanza dalla porta, lato]`, una durata (1,5 / 2,5 / 3,5 / 5 s) e, se serve, il ruolo a cui dare la palla. Validazione (`validaUomo`): posti in vasca e fuori dall'area di porta (dentro 3,58 m dal centro mai sotto 2,1 m), al massimo 4 fasi, nome obbligatorio. Libreria `LIBRERIA` (7 schemi dai documenti), scelti predefiniti `SCELTI_BASE`, memoria in `localStorage` «pallanuoto-uomo-v044» (scelti + fino a 24 schemi personali).
- Fasi in partita (`avanzaUomo`): si passa alla fase dopo quando la durata è finita **e** i compagni sono arrivati ai posti (distanza media sotto 1,6 m), oppure al massimo 3 s dopo; il tempo a gioco fermo non conta; l'ultima fase resta fino alla fine della superiorità.
- IA (`ia.js`): con l'uomo in più i posti sono quelli della fase in corso (`postiSup`); è «palo» chi nella fase sta davanti alla porta (`ePalo`: entro 2,7 m e 3,2 m di lato), non più solo centroboa e punto (`paloUomo`, usato da `paloTarget`, tiro al volo dei pali, passaggi in `tiri.js`); i passaggi «vicini» seguono il perimetro della fase (`viciniUomo`); la squadra cerca chi è indicato da «palla a» (+1,8 nella scelta del passaggio). Il computer sceglie a caso (con `rnd`) uno dei suoi 3 schemi a ogni nuova superiorità; il giocatore non ha schemi imposti: finché non chiama resta il 4-2 base della strategia.
- Chiamata (`callPlay` in `regole.js`): con l'uomo in più, tasti 1-3 (o la croce del controller, o la barra in alto) = i 3 schemi scelti, 4 = torna al 4-2 base. La barra in alto si apre da sola all'inizio di ogni superiorità e mostra la fase in corso; dopo il tocco si richiude.
- Sezione «Uomo in più» (`src/uomo-editor.js`, vista `vUomo`): dalle schermate Squadre, Impostazioni, Torneo e dall'editor delle Strategie. Tre posti in alto (1, 2, 3) con gli schemi scelti; elenco con miniature (pali in giallo, frecce del movimento); «Usa come base» copia uno schema della libreria; «Crea uno schema» apre la lavagna con le fasi (aggiungi/togli fase, durata, palla a), la fase prima in trasparenza e le frecce; «Modifica» ed «Elimina» per gli schemi propri.

## Prove e misure

- `npm run uomo` (`tests/uomo-in-piu.mjs`, anche nei controlli automatici): libreria e validazione; giocatore che chiama lo schema 2; compagni che nuotano ai posti della fase 1 e della fase 2; la fase che aspetta i compagni; pali riconosciuti dalla fase; barra con la fase in corso; tasto 4 e fine della superiorità; computer che sceglie da solo; sezione con 3 scelti, quarto spento, scambio, creazione di uno schema a 2 fasi con trascinamento e «palla a», salvataggio che resta dopo aver ricaricato; nessun errore.
- Foto: `docs/immagini/uomo-in-piu-libreria.png`, `uomo-in-piu-editor.png`, `uomo-in-piu-partita-se.png` (iPhone SE con le barre di Safari, nessuna sovrapposizione con i comandi), `uomo-in-piu-partita-15.png`.
- Bilancio (8 partite ITA–HUN, per squadra) v0.42 → v0.44: superiorità trasformate 67,0% → 47,7% (Mondiali 2025: 52%); gol 17,3 → 16,0; tiri 46,0 → 48,6; tiri in gol 37,6% → 32,9%; espulsioni 6,1 → 5,4.

## Non fatto

- Movimenti dei pali specifici dei documenti (scivolamento all'indietro in assetto di tiro, trazione, trudgeon, rotazione esterna, blocco sul difensore) e tiri dedicati (schiacciata, mezza rovesciata): oggi i pali nuotano ai posti e tirano con i gesti esistenti.
- Fasi legate a un evento (per esempio «quando la palla arriva al 5») invece che al tempo; schemi per il 5 contro 4 o per il 6 contro 5 da controfuga.
- La squadra del computer usa sempre i 3 schemi di base; niente scelta per avversario.
