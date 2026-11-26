# v0.89 — Riequilibrio: mira più realistica e peso delle statistiche in partita

## Richiesta
Ale (25/11/2026), dopo le richieste della v0.88 (palombella, rigore, valutazioni delle squadre dai giocatori): «Una volta fatto queste
modifiche puoi anche riequilibrare le partite.» Il 26/11: «Riparti e concludi».

## Cosa diceva il gioco (v0.88, 16 partite ITA–HUN computer contro computer)
- 19,9 gol e 39,9 tiri per squadra (veri 13,3 e 33), tiri in gol 49,9% (veri 40%), **85 tiri su 100 nello specchio** (gol più parate;
  nelle partite vere circa 2 su 3), 74,8 azioni per squadra (vere circa 50), azione in parità di 13,0 s (vera 21 s); 5 voci su 15 a posto.
- **Italia 13,4, Ungheria 26,5: l'Ungheria vinceva 16 partite su 16.** Nel database (valutazioni ricentrate sul ranking) l'Ungheria è
  circa +8 in ogni voce: Precisione media dei titolari 82,8 contro 75,5, Difesa 80,5 contro 70,8, portiere 82 contro 75 di Riflessi.

Analisi (strumenti `sonda-azioni`, `sonda-tiri`, bilancio per squadra, partite di prova):
- l'azione in parità dura 12,5 s: 5,0 s di transizione e 9,4 s di attacco; il 43% finisce in meno di 10 s (palle perse 39, tiri 34,
  espulsioni 21 su 255). I tiri vengono da fine azione (22%, dopo 21,7 s), centroboa girato verso la porta (14%, dopo 12 s), entrate
  (13%), rigori (7%) e altro;
- per squadra (4 partite): Italia 68% dei tiri nello specchio e 27% in gol, Ungheria 89% e 61%. Il portiere ungherese parava il 61% dei
  tiri nello specchio, quello italiano il 32%. **Scambiando i portieri** l'Italia passa solo da 10,3 a 12,3 gol e l'Ungheria da 24,3 a
  23,0: lo scarto viene soprattutto dal tiro, non dal portiere. Un tiro più preciso è anche più vicino al palo, quindi più difficile da
  parare: la differenza di mira si moltiplica;
- la mira (`mira` in `tiri.js`): l'errore di un tiratore con Precisione 75 era **il doppio** di quello di un 83 (0,66 contro 0,33), e un 90
  era quasi infallibile (0,18).

## Cosa cambia
1. **Curva della Precisione** (`MIRA` in `src/taratura.js`, usata da `mira` in `tiri.js`): errore = 0,52 + ((90 − Precisione)/30)^3,2 ×
   1,45 (prima 0,18 + ((90 − P)/30)^1,6 × 1,55). La curva è piatta tra 75 e 90, dove stanno quasi tutti i titolari delle nazionali forti
   (un 75 sbaglia 1,24 volte un 83, prima 2,1), e ripida sotto 70. La specifica di Ale della v0.16 resta: tra un 90 e un 60, dallo
   stesso punto, circa il doppio dei tiri nello specchio (2,10 volte, `npm run statistiche`). Oltre 90 l'errore scende fino a 0,15 a 99
   (prima 0,08): nel database nessun giocatore di movimento supera 89 (sei tra 85 e 89), conta per le prove e le correzioni a mano.
2. **Un po' più di errore per tutti i tiri** (`MIRA.globale` 1,3): meno tiri nello specchio, più tiri sbagliati. Il portiere para
   già la quota giusta dei tiri che arrivano in porta (circa 40%, come nella realtà): il problema era quanti ci arrivavano.
3. **Peso delle statistiche in partita** (`STAT_PARTITA`, `pesata` in `src/taratura.js`): negli effetti continui delle voci che la
   specifica di Ale non fissa — Riflessi, Posizione e Uscita del portiere, Difesa, Passaggio, Forza, Resistenza, Disciplina, Visione — la
   statistica conta con peso 0,6 attorno a 75 (un 85 di Difesa vale 81, un 65 vale 69). Velocità, Precisione e Potenza restano piene
   (specifica: tra un 90 e un 60 +15-20% di velocità, circa il doppio dei tiri nello specchio, palla da circa 20 a 25 m/s). Le soglie (chi
   può fare cosa, per esempio Precisione almeno 70 per lo schizzo), le scelte tra compagni, le schede e le valutazioni usano le
   statistiche vere: nelle schede si vedono gli stessi numeri di prima.
4. **Bilancio per squadra** (`tests/bilancio.mjs`): per ognuna delle due squadre gol, tiri, tiri in gol e tiri nello specchio.

Provato e tolto: palla al centroboa più tardi (`CENTRO_ATTESA` da 3-9 a 6-13 s) ed entrate A/B/C dopo 10 s e 3 passaggi invece di 6 s e
2 (`ENTRATE_REATTIVE`): l'azione in parità passava solo da 13,0 a 13,4 s; tolti per non cambiare senza un vantaggio chiaro le scelte
della v0.81 («più palla al centroboa»).

## Misure
### Passi (8 partite ITA–HUN ciascuno; tra due giri da 8 partite c'è qualche punto di variazione)
| passo | gol | Italia / Ungheria | tiri | in gol | nello specchio | voci a posto |
|---|---|---|---|---|---|---|
| v0.88 (16 partite) | 19,9 | 13,4 / 26,5 | 39,9 | 49,9% | 84,8% | 5 su 15 |
| 1. mira 0,40 + x^2 × 1,5, centroboa e entrate più tardi | 16,9 | 10,8 / 23,0 | 38,1 | 44,3% | 80,8% | 4 |
| 2. mira 0,42 + x^2,6 × 1,4, peso 0,6 delle altre voci | 17,8 | 12,6 / 23,0 | 37,9 | 47,0% | 84,0% | 5 |
| 3. mira 0,52 + x^3,2 × 1,45, centroboa ed entrate come prima | 19,6 | 14,5 / 24,6 | 41,0 | 47,7% | 79,9% | 7 |
| 4. come 3 con errore di tutti × 1,3 (versione finale) | 17,6 | 13,1 / 22,1 | 40,6 | 43,4% | 77,7% | 9 |

### Gioco contro realtà, versione finale (16 partite ITA–HUN, per squadra a partita)
| voce | v0.88 | v0.89 | reale |
|---|---|---|---|
| tiri | 39,9 | 39,9 | 33 |
| gol | 19,9 | **17,6** | 13,3 |
| gol dell'Italia / dell'Ungheria | 13,4 / 26,5 | **13,1 / 22,0** | |
| tiri dell'Italia / dell'Ungheria in gol | – | 34,7% / 52,4% | |
| tiri in gol | 49,9% | **44,0% (a posto)** | 40% |
| tiri nello specchio (gol e parate) | 84,8% | **77,2%** | circa 67% |
| espulsioni | 11,2 | 11,5 (a posto) | 11 |
| espulsioni dalla lotta al centro | 56,4% | 59,6% | 66% |
| superiorità trasformate | 44,7% | 47,2% (a posto) | 52% |
| rigori | 2,4 | 1,6 (a posto) | 1,8 |
| azioni a partita | 74,8 | 74,6 | 50 |
| parità: durata dell'azione | 13,0 s | 13,1 s | 21 s |
| parità: gol | 22,8% | 19,3% | 6-19% |
| parità: tiro sbagliato | 23,9% | 26,7% | 32% |
| parità: palla persa | 18,1% | 19,5% (a posto) | 20% |
| parità: espulsione procurata | 17,4% | 17,7% (a posto) | 22% |
| voci a posto | 5 su 15 | **7 su 15** | |

L'Ungheria vince ancora 16 partite su 16 contro l'Italia computer contro computer, ma lo scarto passa da 2 volte i gol a 1,7 volte
(13,1 a 22,0). Gesti dei tiri: classico 73,2%, polso 13,3%, torsione 8,3%, palombella 2,8%, sciarpa 1,2%, beduina 0,9%. La taratura
è stata fatta prima di abbassare l'errore oltre Precisione 90 (`MIRA.sopra` 0,1 → 0,37): nel database nessun giocatore di movimento
supera 89, quindi le partite misurate sono le stesse.

## Prove
- **`npm run statistiche`** (effetti minimi della specifica di Ale): Velocità 90 contro 60 +19,4% (15-20%), Precisione 90 contro 60
  2,10 volte i tiri nello specchio (circa il doppio), Potenza 27,4 contro 22,2 m/s, Resistenza 75 visibilmente stanco dopo 7 vasche,
  Resistenza 90 contro 60 più fresco: tutto rispettato.
- **`npm run traiettorie`** (v0.71 di Codex): il contesto ridotto di `doShoot` ha anche `MIRA` e `pesata`.
- **`npm run nuoto`** (v0.44 di Codex): il consumo e il recupero attesi si calcolano con la Resistenza pesata.
- **`npm run replay`** (v0.48): nella scena del tiro dall'ala il portiere viene rimesso fuori posizione subito prima del tiro (nei 140
  fotogrammi di preparazione rientrava in porta e il gol dipendeva dal caso; con la mira nuova il tiro veniva parato).
- **`npm run palombella`** (v0.88): con l'Uscita pesata un portiere da 40 esce di 1,37 m; la prova chiede che quello da 95 esca almeno
  0,5 m di più (2,08 m).

## Verifiche
- **`npm run lint`**: PASS.
- **`npm run prove`**: primo giro 66 PASS e 4 FAIL su 70 (le quattro prove qui sopra, legate al riequilibrio); dopo gli adattamenti,
  giro completo sulla versione finale **70 PASS su 70** in 13,6 minuti.
- **`npm run verifica -- --partite=0`** (con `qualita` e `tornei`): «3-azione», «4-iphone-piccolo» e «5-iphone-orizzontale» diverse dal
  riferimento per la sola situazione di gioco (stesso momento del primo tempo in 6 contro 5 con Alesiani espulso, giocatori in punti
  diversi perché tiri e parate vanno diversamente); disegno, tasti e tabellone a posto. Controllate, riferimenti aggiornati con
  `npm run verifica:aggiorna -- --partite=0` («1-menu» e «2-sprint» lasciati, entro la tolleranza); confronto ripetuto: «Verifica
  superata».
- **`npm run aspetto -- --no-build --solo-foto`**: «Tutto a posto»; viste iPhone 56 oggetti disegnati e 131.872 triangoli, al massimo
  145.346 nelle sei viste; `--solo-gioco` PASS nel giro delle prove.

## Decisioni superate
- Curva della Precisione 0,18 + x^1,6 × 1,55 → 0,52 + x^3,2 × 1,45 (piatta tra 75 e 90, ripida sotto 70).
- Errore di tutti i tiri × 1 → × 1,3.
- Statistiche piene in tutti gli effetti → peso 0,6 attorno a 75 per le voci senza effetto minimo nella specifica (Velocità, Precisione
  e Potenza restano piene).

## Non fatto
- **Il ritmo**: le azioni restano troppe e troppo corte (circa 75 a squadra contro 50, azione in parità di 13 s contro 21) e per questo
  tiri e gol sono ancora sopra i valori veri anche con la quota giusta di tiri in gol. Il tempo dell'attacco schierato (9,4 s) si
  accorcia per molte strade insieme (centroboa servito presto e girato verso la porta che tira subito, entrate, palle perse e
  espulsioni nei primi secondi); allungarlo davvero vuol dire rendere più paziente l'attacco del computer, anche con meno palloni al
  centroboa nei primi secondi, che è una scelta della v0.81 da decidere con Ale.
- Le valutazioni restano ricentrate sul ranking (v0.88): l'Ungheria resta più forte in ogni voce e vince ancora quasi sempre contro
  l'Italia computer contro computer, ma con uno scarto più vicino a quello delle partite vere.
