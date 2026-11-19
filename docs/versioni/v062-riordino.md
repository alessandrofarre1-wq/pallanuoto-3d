# v0.62 — Riordino: memoria corta, storia a parte, numeri della taratura in un posto solo, prove con un comando

Ale (v0.60): «se pensi che il gioco sia una cozzaglia di versioni forse è meglio che pensi a un modo per mettere ordine». La
proposta in tre passi è in `docs/proposte/riordino.md`; dopo l'unione della v0.61 Ale ha risposto «Procedi». Qui ci sono il passo 1
(memoria e documenti), il passo 2 (pannello unico della taratura) e il comando `npm run prove` del passo 3. La proposta diceva una
PR per passo: si può lavorare su un ramo solo, quindi due PR avrebbero dovuto aspettarsi a vicenda; i passi sono in commit separati.
**Il gioco non cambia**: nessun numero è stato toccato, ed è dimostrato con le partite simulate (sotto).

## Cosa cambia
1. **Memoria corta** (`CLAUDE.md`, da 213 KB a circa 17 KB): cos'è il gioco e come parlare con Ale, come lavorare (versioni e PR,
   verifiche, limiti iPhone, caso, strato visuale, numeri, misure, trucchi delle prove nel browser, video), mappa del codice,
   decisioni **in vigore** divise per argomento (schermo e interfaccia, comandi, nuoto e corpo, gesti, attacco, difesa, regole,
   grafica, squadre e tornei), numeri gioco contro realtà, cosa resta da fare, fonti.
2. **Storia a parte** (`docs/storia.md`): la memoria vecchia intera, senza tagli, come archivio fino alla v0.61; da qui ogni
   versione aggiunge una voce in cima a «Versioni dopo il riordino».
3. **Decisioni superate** (`docs/decisioni-superate.md`): per ogni versione, dalla v0.62 alla v0.18, com'era e cosa vale ora.
4. **Documenti in cartelle**: `docs/versioni/` (13 rapporti), `docs/verifiche/` (8 verifiche e 12 file di misura),
   `docs/riferimenti/` (11: tattica, tecnica, fisica della palla, corpi e acqua, valutazioni, aspetto, uomo in più, priorità
   dell'interfaccia, arena, analisi di un video), `docs/proposte/`; indice in `docs/README.md`. I percorsi nel codice, nei dati e nei
   documenti sono aggiornati. `docs/immagini/` e `docs/filmati/` restano dove sono (molte prove scrivono lì).
5. **Numeri del bilanciamento in `src/taratura.js`**: 22 numeri (o gruppi di numeri) presi da otto moduli, ognuno con il motivo e
   i valori di prima:
   - attacco del computer: `CIRCOLAZIONE`, `COSTRUZIONE`, `TIRO_LIBERATO`, `PAZIENZA`, `SUPERIORITA`, `RIPARTENZA` (da `ia.js`);
   - passaggi e palle perse: `INTERCETTO`, `PRESA` (da `fisica.js`), `ERRORE_PASSAGGIO` (da `tiri.js`);
   - portiere: `PARATA_SUP` (da `fisica.js`);
   - arbitro: `ESPULSIONI`, `ARBITRI`, `ANTICIPO` (da `regole.js`), `LOTTA_FASE`, `CENTRO_SENZA_PALLA` (da `lotta.js`),
     `CONTR_AI` (da `partita.js`);
   - finte: `FIRMA`, `FINTA_LATO` (da `finte.js`);
   - fatica e cambi: `STANCO`, `CON_PALLA`, `SPRINT_CONSUMO` (da `fisica.js`), `PANCHINA` (da `panchina.js`).

   I moduli li importano da qui e li riesportano con lo stesso nome, quindi chi li usava (altri moduli, prove, `window.__pallanuoto`)
   non cambia. In fondo al file `REALE`: 15 voci con il valore delle partite vere, l'intervallo che consideriamo a posto, la fonte e
   i numeri che le spostano di più. Restano nei loro moduli i numeri di posizione e geometria (`TRE_TRE`, `INFERIORITA`, `CONTRO`),
   quelli dei gesti e quelli della palla (`fisica-palla/parametri.js`).
6. **`npm run taratura`** (`strumenti/taratura.mjs`): gioca le partite del bilancio (8 ITA–HUN, tre alla volta) e stampa la tabella
   gioco contro realtà con lo stato di ogni voce (basso, a posto, alto), i numeri da guardare e i loro valori di oggi. Con
   `--salva=prima.json` e poi `--confronta=prima.json` mette affiancati due giri; `--da=riassunto.json` legge un giro già fatto
   senza giocare.
7. **`npm run bilancio`** più veloce e con due misure in più: `--paralleli=K` gioca K partite insieme (una pagina ciascuna, ognuna
   con il suo caso bloccato: stessi risultati); nel riassunto anche le azioni totali e la palla in mano prima del passaggio (solo
   passaggi dei giocatori di movimento, a gioco in corso).
8. **`npm run prove`** (`tests/prove.mjs`): legge i passi «npm run» dal file della CI (`.github/workflows/pages.yml`), costruisce il
   gioco una volta e li esegue uno dopo l'altro con PASS/FAIL e tempo, poi il riepilogo e dove sono i registri. `npm run verifica`
   resta a parte (con `--con-verifica` si fa anche qui, con i confronti delle immagini bloccanti); `--solo=`, `--da=`, `--elenco`,
   `--tempo-max=` (una prova bloccata si ferma da sola dopo 20 minuti).

## Il gioco è identico
- **Stesse partite, stesso risultato**: 3 partite ITA–HUN a durata vera con il caso bloccato, giocate con la build di `main` (v0.61)
  e con la nuova: riassunto identico byte per byte (stessa impronta md5 `785b166c…`) e stessa uscita riga per riga (12-15, 11-16,
  16-21).
- **Aspetto** (`node tests/aspetto.mjs --dist=<main> --salva=prima.json`, poi `--confronta=prima.json` sulla nuova): «partita
  simulata identica», 0 campioni di gambe fuori dall'acqua, stessi oggetti disegnati e triangoli (viste iPhone 55 e 141.778) e le sei
  foto a telecamera fissa uguali pixel per pixel (0 pixel diversi su 6 immagini).
- **8 partite della taratura** (tre alla volta): gli stessi numeri del bilancio della v0.61 giocato una partita per volta (tiri
  43,6, gol 15,3, tiri in gol 35,0%, espulsioni 11,6, superiorità trasformate 43,0%, rigori 2,2, azioni 70,0, durata in parità
  14,4 s, palla persa in parità 11,7%): il gioco è lo stesso e giocare più partite insieme non cambia i risultati.

## Gioco contro realtà oggi (`npm run taratura`, 8 partite ITA–HUN, per squadra a partita)
| voce | gioco | reale | stato |
|---|---|---|---|
| tiri | 43,6 | 33 | alto |
| gol | 15,3 | 13,3 | a posto |
| tiri in gol | 35,0% | 40% | basso |
| espulsioni | 11,6 | 11 | a posto |
| espulsioni dalla lotta al centro | 74,7% | 66% (Ale: circa 70%) | a posto |
| superiorità trasformate | 43,0% | 52% | basso |
| rigori | 2,2 | 1,8 | a posto |
| azioni a partita | 70,0 | 50 | alto |
| parità: durata dell'azione | 14,4 s | 21 s | basso |
| parità: gol | 16,5% | 6-19% | a posto |
| parità: tiro sbagliato | 38,0% | 32% | alto |
| parità: palla persa | 11,7% | 20% | basso |
| parità: fallo in attacco | 8,5% | 15% | basso |
| parità: espulsione procurata | 20,1% | 22% | a posto |
| palla in mano prima del passaggio | 1,07 s | 0,6-1 s | alto |

A posto 6 voci su 15. Tutte quelle fuori portano allo stesso punto: in parità si tira troppo e troppo presto (azioni di 14 s
invece di 21, 70 azioni invece di 50, tiri 44 invece di 33), si perdono poche palle e si fanno pochi falli in attacco. I numeri da
guardare per primi sono `COSTRUZIONE`, `PAZIENZA` e `TIRO_LIBERATO` (quando si tira), poi `INTERCETTO` ed `ERRORE_PASSAGGIO`
(palle perse) e `CENTRO_SENZA_PALLA` (falli in attacco). La palla in mano prima del passaggio misurata nel bilancio (solo passaggi a
gioco in corso) è 1,07 s; la sonda della v0.53, che conta ogni volta che la palla lascia la mano, dava 1,1 s.

## Verifiche
- `npm run lint`: PASS.
- `npm run prove` (prima esecuzione del comando nuovo): **36 PASS, 0 FAIL** su 36 passi in 11,2 minuti.
- `npm run verifica`: qualità 13 controlli, tornei 17 gruppi di controlli; sei partite arrivate alla fine, **54 gol su 211 tiri**
  (gli stessi numeri della v0.61); cinque immagini: quattro identiche al riferimento, il menu diverso solo per la scritta «Prototipo
  v0.62» (0,00%, nella tolleranza). Riferimenti non aggiornati.
- `npm run aspetto` completo con `--confronta` sulla build di `main`: PASS, «partita simulata identica», 0 campioni di gambe fuori
  dall'acqua, viste iPhone 55 oggetti e 141.778 triangoli (come la v0.61).
- **Build finale**: la tabella `REALE` finiva nel pacchetto del gioco senza servire; ora è segnata come «pura» e il pacchetto non la
  contiene (5.570.176 byte contro 5.570.208 della v0.61). Rifatti sulla build finale: 3 partite col caso bloccato, riassunto identico
  byte per byte a quello di `main`; `aspetto --confronta` «partita simulata identica», stessi oggetti e triangoli, cinque foto su sei
  uguali pixel per pixel e nella sesta (iPhone orizzontale) 315 pixel diversi solo lungo i bordi del tabellone, che ha piccole
  animazioni legate all'orologio vero della pagina e non al gioco (la stessa foto della build provata prima era identica).

## Non fatto
- Prove con nomi per argomento (oggi si chiamano con la versione in cui sono nate) e `aiCarrier` più semplice: restano per dopo,
  come nella proposta.
- Nessun numero ritoccato: la taratura vera (troppi tiri, azioni corte, palle perse basse, superiorità sotto il 52%) è il prossimo
  lavoro, ora con il pannello.
