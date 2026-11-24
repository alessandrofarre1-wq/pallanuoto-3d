# v0.85 — Finte: più lente vicino alla porta, più spesso di lato, larghe o strette, braccio piegato o dritto

## Richiesta
Ale (24/11/2026), punti 7 e 8 della lista: «davanti alla porta finta veloce ma non troppo»; «finte: avanti-indietro ma più spesso
destra-sinistra, larghe o strette, braccio piegato o dritto». Poi, senza video: «quello che ti posso dire è che ora quelle vicino alla
porta sono troppo veloci, vanno rallentate».

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
| finte del computer | 45,3 | 38,9 |
| dall'inizio della finta al gesto dopo (metà dei casi) | 0,50 s | 0,92 s |
| … il 10% più veloce | 0,37 s | 0,90 s |
| tra 5 e 7 m: gesto dopo, in media | 0,55 s | 0,91 s |
| tra 5 e 7 m: ritorno del braccio interrotto | 82% | 7% (quasi tutte palombelle: il gesto parte, la palla esce a braccio carico) |
| prima finta di lato | 0% | 63% (prova) |
| giocatore che tiene TIRO: una finta ogni | 0,82 s | 0,92 s |

## Gioco contro realtà (16 partite ITA–HUN, per squadra a partita)
| voce | v0.84 | v0.85 | reale |
|---|---|---|---|
| tiri | 39,0 | 39,0 | 33 |
| gol | 19,1 | 19,8 | 13,3 |
| tiri in gol | 48,9% | 50,9% | 40% |
| espulsioni | 11,6 | 11,3 (a posto) | 11 |
| espulsioni dalla lotta al centro | 60,5% | 59,8% | 66% |
| superiorità trasformate | 48,1% | 42,1% | 52% |
| azioni a partita | 74,4 | 74,5 | 50 |
| parità: durata dell'azione | 13,1 s | 13,0 s | 21 s |
| palla in mano prima del passaggio | 0,98 s | 1,00 s | 0,6-1 s |
| voci a posto | 8 su 15 | 5 su 15 | |

Le voci che passano da «a posto» a «da guardare» sono tre, tutte vicine al confine (espulsioni dal centro 59,8% contro la soglia
del 60%, palla in mano 1,00 s, superiorità). La superiorità era già oscillata tra il 42% e il 48% tra versioni quasi uguali; il
secondo campione della sonda della superiorità è qui sotto.

Secondo campione (sonda della superiorità, 6 partite per versione): in corso.

## Prove
- **Nuova `npm run finte`** (anche nella CI), nove controlli: il gesto del computer dopo la finta parte a braccio tornato carico più
  l'attesa (0,93 s contro un minimo di 0,92 s) e arriva comunque; il giocatore che tiene TIRO fa una finta ogni 0,92 s; la prima
  finta va di lato 63 volte su 100; disegno: braccio dritto (gomito a 143°) e piegato (103-118°), la finta larga va più di lato della
  stretta, nelle finte scelte dal gioco ci sono le due braccia.
- **`npm run finta`** (v0.55): il controllo «la prima dritta, poi di lato alternando» diventa «di lato alternando» più «con la levetta
  inclinata la prima va già da quella parte» (decisione superata qui sotto).
- **`npm run finta-fluida`** (v0.76 di Codex): avvio e finte caricate si confrontano a parità di forma (ogni scena usa una delle
  quattro forme, a rotazione; ogni stile le prova tutte). Con forme diverse il confronto «picco dell'avvio entro 1,5 volte il picco
  dei cicli» falliva in 3 scene su 24 solo perché i due cicli di confronto erano usciti a braccio piegato, che si muove meno: con le
  forme uguali 0 violazioni su 24 scene.
- **`npm run finte-forme`** (strumento nuovo): foglio con otto finte (dritta o di lato, stretta o larga, braccio dritto o piegato) da
  due lati, `docs/immagini/v085-finte-forme.png`.

## Verifiche
In corso: `npm run lint` PASS; `npm run finte`, `npm run finta` e `npm run finta-fluida` PASS; `npm run prove`, `npm run verifica
-- --partite=0` e `npm run aspetto -- --no-build --solo-foto` da completare.

## Decisioni superate
- Il gesto del computer dopo una finta partiva alla fine dell'accenno, a metà del ritorno del braccio → parte a braccio tornato carico
  più 0,2 s (anche per il giocatore che tiene TIRO, prima 0,12 s).
- La prima finta sempre dritta, di lato solo dalla seconda (v0.59) → anche la prima di lato, 65 volte su 100; con la levetta sempre.
- Ogni stile con un solo disegno della finta → a ogni finta larga o stretta, braccio dritto o piegato (solo disegno), con la tendenza
  dello stile.

## Non fatto
- La durata dell'accenno (0,34-0,45 s) e del ritorno (0,36 s) restano quelle della v0.76: sono già vicine al video di Varga.
- Chi abbocca alla finta resta fuori tempo quanto prima (difensore 0,7 s, portiere 1,1 s): con il gesto dopo più lento lo «scarico»
  dopo la finta arriva quasi alla fine del vantaggio. Da rivedere solo se Ale trova le finte inutili.
- Il giudizio sul movimento spetta ad Ale, giocando o guardando il foglio delle forme.
