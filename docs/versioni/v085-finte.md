# v0.85 — Finte: più lente vicino alla porta, da destra verso sinistra, strette e veloci o ampie e lente, braccio teso o piegato

## Richiesta
Ale (24/11/2026), punti 7 e 8 della lista: «davanti alla porta finta veloce ma non troppo»; «finte: avanti-indietro ma più spesso
destra-sinistra, larghe o strette, braccio piegato o dritto». Poi, senza video: «quello che ti posso dire è che ora quelle vicino alla
porta sono troppo veloci, vanno rallentate». E dopo la prima versione: «la finta di tiro può essere fatta sia mandando la palla avanti
e indietro ma, più frequentemente, da destra verso sinistra. In generale può essere fatta con movimenti stretti e veloci o più ampi e
lenti e con il braccio teso o piegato».

## Il riferimento
Non ho trovato studi con la durata delle finte di tiro. Resta il video di Dénes Varga che Ale aveva mandato (analisi della v0.58):
finta larga di circa 0,6 s tra andata e ritorno, tiro circa 0,2 s dopo che il braccio è tornato carico.

## Cosa diceva il codice (e la sonda nuova)
`npm run sonda-finte` (nuova, 4 partite computer contro computer ITA–HUN) sulla v0.84:
- 45 finte del computer per squadra a partita, quasi tutte tra 5 e 7 m dalla porta (234 su 362) o tra 7 e 9 m (104);
- dopo la finta il gesto successivo partiva **0,50 s** dopo l'inizio della finta (metà dei casi; tra 5 e 7 m 0,55 s in media), cioè
  appena finito l'accenno: il ritorno del braccio (0,36 s) era interrotto **82 volte su 100** tra 5 e 7 m;
- dopo la finta veniva quasi sempre un passaggio (8 volte su 10: «finta e scarico» della v0.55), poi il tiro;
- 98 finte su 100 erano la prima della serie, e la prima finta era sempre dritta verso la porta: le finte di lato (v0.59, dalla
  seconda) non si vedevano quasi mai.

Il giocatore che tiene TIRO faceva una finta ogni 0,82 s (accenno 0,34 s, ritorno 0,36 s, attesa 0,12 s: v0.76 di Codex).

## Cosa cambia
1. **Ritmo** (`FINTA_RITMO` in `src/taratura.js`; `p.fintaPronto` in `src/tiri.js`, `aiCarrier` in `src/ia.js`, `controllo.js`): dopo
   ogni finta il braccio torna alla carica (0,36 s) e resta carico ancora **0,2 s** (come Varga) prima del gesto successivo, finta,
   tiro o passaggio. Vale per il computer e per il giocatore che tiene TIRO (prima 0,12 s). Il rilascio di TIRO tira sempre subito,
   anche durante la finta: il comando del giocatore non aspetta. La palombella dopo la finta del computer parte a braccio tornato
   carico.
2. **Di lato, da destra verso sinistra** (`FINTA_LATO.quota` = 0,65; Ale: «la finta di tiro può essere fatta sia mandando la palla
   avanti e indietro ma, più frequentemente, da destra verso sinistra»): ogni finta va di lato 65 volte su 100, attraverso il corpo
   (per un destro verso la sua sinistra, per un mancino al contrario); le altre avanti e indietro verso la porta. Con la levetta
   inclinata il giocatore sceglie il palo, anche alla prima finta. Prima la prima finta era sempre dritta e dalla seconda si
   alternavano i due pali. Chi abbocca si sposta verso quel palo come nella v0.59.
3. **Strette e veloci o ampie e lente** (`FINTA_AMPIEZZA` in `src/taratura.js`, larghezza decisa in `startAct`; Ale: «in generale può
   essere fatta con movimenti stretti e veloci o più ampi e lenti»): a ogni finta la larghezza viene dalla tendenza dello stile
   personale (`largo` in `src/finte.js`) con un po' di caso, più stretta entro 6 m dalla porta. La stretta ha i tempi minimi della
   v0.76 (preparazione 0,16 s, accenno 0,18 s, ritorno 0,36 s); l'ampia fino a 0,10 + 0,10 + 0,12 s in più. Ogni gesto porta il suo
   ritorno (`a.recupero`), usato dal gioco e dal disegno.
4. **Braccio teso o piegato** (solo disegno, `FINTA_FORMA` e `formaFinta` in `src/grafica/pose.js`; tendenza `piegato` per stile): il
   braccio si distende (verso l'alto nella stretta, verso la porta nell'ampia) o resta piegato (si muove l'avambraccio, la mano vicino
   alla testa; nella finta di lato la mano va anche di lato). L'ampia gira di più il busto e va più in là. Stili: larga e bomba quasi
   sempre ampie a braccio teso; raffica stretta, metà a braccio piegato; polso e spalla quasi sempre a braccio piegato; mezza in mezzo.

## Misure (sonda-finte, 4 partite, per squadra a partita)
| misura | v0.84 | v0.85 |
|---|---|---|
| finte del computer | 45,3 | 37,0 |
| dall'inizio della finta al gesto dopo (metà dei casi) | 0,50 s | 1,05 s |
| … il 10% più veloce | 0,37 s | 0,93 s |
| tra 5 e 7 m: gesto dopo, in media | 0,55 s | 1,04 s |
| tra 5 e 7 m: ritorno del braccio interrotto | 82% | 4% (quasi tutte palombelle: il gesto parte, la palla esce a braccio carico) |
| andata della finta (preparazione + accenno), per stile | 0,36-0,43 s | raffica 0,42, spalla 0,42, mezza 0,43, polso 0,47, bomba 0,58 s |
| finte di lato | quasi mai (98 su 100 erano la prima, sempre dritta) | 57-63 su 100 nelle prove, tutte da destra verso sinistra |
| giocatore che tiene TIRO (stile a raffica): una finta ogni | 0,82 s | 1,02-1,03 s |

## Gioco contro realtà (16 partite ITA–HUN, per squadra a partita)
| voce | v0.84 | v0.85 | reale |
|---|---|---|---|
| tiri | 39,0 | 39,3 | 33 |
| gol | 19,1 | 19,3 | 13,3 |
| tiri in gol | 48,9% | 49,1% | 40% |
| espulsioni | 11,6 | 11,8 (a posto) | 11 |
| espulsioni dalla lotta al centro | 60,5% | 62,7% (a posto) | 66% |
| superiorità trasformate | 48,1% | 47,1% (a posto) | 52% |
| rigori | 1,9 | 1,8 (a posto) | 1,8 |
| azioni a partita | 74,4 | 75,2 | 50 |
| parità: durata dell'azione | 13,1 s | 13,0 s | 21 s |
| palla in mano prima del passaggio | 0,98 s | 1,00 s | 0,6-1 s |
| voci a posto | 8 su 15 | 7 su 15 | |

Le finte non cambiano l'equilibrio della partita: tutte le voci restano entro le oscillazioni del caso; esce dalla fascia solo la palla in
mano prima del passaggio (1,00 s, il limite è 1 s), perché lo scarico dopo la finta ora aspetta il ritorno del braccio. Secondo
campione (sonda della superiorità, 6 partite per versione con semi diversi): superiorità trasformate **42% sulla v0.84 e 41% sulla
v0.85**. Il 48% della taratura della v0.84 era il caso di quel campione (nella prima versione della v0.85 era uscito 42%).

## Prove
- **Nuova `npm run finte`** (anche nella CI), undici controlli: il gesto del computer dopo la finta parte a braccio tornato carico più
  l'attesa e arriva comunque; il giocatore che tiene TIRO fa una finta ogni 1,02-1,03 s (accenno + ritorno + attesa); le finte vanno
  di lato 57 volte su 100 nella prova, tutte da destra verso sinistra attraverso il corpo; stretta e veloce contro ampia e lenta (accenno
  0,38 contro 0,51 s, ritorno 0,39 contro 0,46 s); davanti alla porta più strette (larghezza 0,61 a 3,5 m contro 0,87 a 8 m); disegno:
  braccio teso (gomito 143-149°) e piegato (103-119°), la finta ampia va più di lato della stretta, nelle finte scelte dal gioco ci sono
  le due braccia.
- **`npm run finta`** (v0.55): il controllo «la prima dritta, poi di lato alternando» diventa «di lato da destra verso sinistra,
  attraverso il corpo» più «con la levetta inclinata la prima va già da quella parte» (decisione superata qui sotto).
- **`npm run traiettorie`** (v0.71 di Codex): la prova esegue `tiri.js` e un pezzo di `ia.js` in un ambiente ridotto; ha le costanti
  nuove (`FINTA_AMPIEZZA`, `FINTA_LATO`, `FINTA_RITMO`) e controlla la palombella del computer dopo la finta con la regola nuova: parte a
  braccio tornato carico (prima doveva essere in volo 0,55 s dopo la finta). Nel salvataggio intermedio 169f7ed questa prova falliva
  (costante mancante): corretta nel salvataggio successivo.
- **`npm run finta-fluida`** (v0.76 di Codex): avvio e finte caricate si confrontano a parità di forma (ogni scena usa una delle quattro
  forme a rotazione, con i tempi della sua larghezza; ogni stile le prova tutte). Con forme diverse il confronto «picco dell'avvio entro
  1,5 volte il picco dei cicli» falliva in 3 scene su 24 solo perché i due cicli di confronto erano usciti a braccio piegato, che si
  muove meno: con le forme uguali 0 violazioni su 24 scene.
- **`npm run finte-forme`** (strumento nuovo): foglio con otto finte (dritta o di lato, stretta o ampia, braccio teso o piegato) da due
  lati, `docs/immagini/v085-finte-forme.png`.

## Verifiche
- **`npm run lint`**: PASS.
- **`npm run prove`**: **67 PASS, 0 FAIL** su 67 passi in 18,2 minuti, con `finte` (11 controlli), `finta`, `finta-fluida` e
  `traiettorie` adattate.
- **`npm run verifica -- --partite=0`**: «3-azione» diversa dal riferimento per la sola situazione di gioco (con le finte nuove a 2:45
  la palla è all'Italia invece che all'Ungheria; disegno, acqua e tabellone a posto): controllata, riferimento aggiornato con
  `npm run verifica:aggiorna -- --partite=0`, confronto ripetuto con le cinque immagini identiche.
- **`npm run aspetto -- --no-build --solo-foto`**: «Tutto a posto»; viste iPhone 56 oggetti disegnati e 131.872 triangoli, al massimo
  145.148 triangoli nelle sei viste.
- **`npm run finte-forme`**: foglio `docs/immagini/v085-finte-forme.png` (otto finte, di lato e da dietro).

## Decisioni superate
- Il gesto del computer dopo una finta partiva alla fine dell'accenno, a metà del ritorno del braccio → parte a braccio tornato carico
  più 0,2 s (anche per il giocatore che tiene TIRO, prima 0,12 s).
- La prima finta sempre dritta, di lato solo dalla seconda alternando i due pali (v0.59) → ogni finta di lato 65 volte su 100, sempre
  da destra verso sinistra attraverso il corpo (per un mancino al contrario); con la levetta il palo lo sceglie il giocatore.
- Tempi della finta uguali per tutte (v0.76: 0,16 + 0,18 + 0,36 s) → la stretta tiene questi tempi, l'ampia fino a 0,10 + 0,10 +
  0,12 s in più; davanti alla porta più strette.
- Ogni stile con un solo disegno della finta → a ogni finta braccio teso o piegato (solo disegno), con la tendenza dello stile.

## Non fatto
- La finta stretta ha ancora i tempi della v0.76 (dopo i video di Ale a Codex «accenno troppo veloce e scattoso»): non è più veloce di
  così.
- Chi abbocca alla finta resta fuori tempo quanto prima (difensore 0,7 s, portiere 1,1 s): con il gesto dopo più lento lo «scarico»
  dopo la finta arriva quasi alla fine del vantaggio. Da rivedere solo se Ale trova le finte inutili.
- Il giudizio sul movimento spetta ad Ale, giocando o guardando il foglio delle forme.
