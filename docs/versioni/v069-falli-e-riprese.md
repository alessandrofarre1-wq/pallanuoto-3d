# v0.69 — espulsioni tra i tempi, rigori e continuità sui falli

Base `e4e0787` (PR59 v0.68 unita), versione0.69.0, branch `codex/v069-falli-riprese`. Richiesta di Ale: espulsione cancellata al cambio tempo, rigori apparentemente ingiustificati, boa già fronteporta che scarica, tutti immobili al fallo. Correzioni e prove mirate concluse; misure generali prima dell’ultimo percorso di fallo senza palla, CI intera sul commit pubblicato ancora da verificare. Nessun merge o deploy.

## Cosa cambia

- L'espulso conserva sanzione e identità nel pozzetto durante intervallo/scatto. Partecipano sei giocatori; se i suoi conquistano palla può rientrare, altrimenti resta fuori per il residuo. Terzo fallo: sostituto solo al rientro consentito. Cronometro e sanzione partono al primo tocco.
- Il passaggio riuscito alla boa non è un fallo: tolto il sorteggio45%rigore/35%espulsione all'anticipo battuto. I contrasti reali usano un criterio comune: area6m, contatto, possesso, occasione credibile, orientamento e difensori sul corridoio. I5m sono il punto del tiro di rigore.
- Se un intervento da dietro disturba un tiro già iniziato, si attende l'esito: gol→niente rigore; esito senza gol→un solo rigore. La sirena non cancella la sanzione pendente e lascia finire il tiro partito in tempo.
- Boa CPU già fronteporta e linea libera: conclude dopo la presa senza attendere il flag della girata o scegliere uno scarico casuale. Vale in parità: la superiorità conserva il proprio sistema di tiri. Il difensore può intervenire realmente; portiere e tiro restano fallibili. Controllo umano conservato.
- Fallo ordinario: fermi autore e vittima; gli altri continuano movimenti/tagli e controllo umano. Le marcature leggono le posizioni aggiornate anche durante la ripresa. Cronometri fermi. Fallo in attacco, compreso il blocco/spinta senza palla: possesso assegnato subito alla difesa e rientro degli altri. Gol, rigori, intervalli e time-out conservano l'arresto generale. Le collisioni non spostano i due giocatori fermi.

## File

- `src/regole.js`, nuovi `src/espulsioni-tempi.js` e `src/decisione-rigore.js`: sanzioni, scatto, criteri del rigore, vantaggio e cambio possesso.
- `src/partita.js`, `src/gioco-fermo.js`, `src/fisica.js`, `src/grafica/pose.js`: cronometri, fermo selettivo, movimento e marcature, separazione dei corpi e posa coerente.
- `src/centroboa.js`, `src/lotta.js`, `src/ia.js`: lettura fronteporta e conclusione in parità.
- `tests/espulsioni-tempi-v069.mjs`, `decisione-rigore-v069.mjs`, `rigori-reali-v069.mjs`, `boa-fronte-v069.mjs`, aggiornato `gioco-fermo-v050.mjs`; script in `package*.json`, passi in `.github/workflows/pages.yml`; memoria, storia, consegne e dati in `docs/verifiche/v069/`.

## Verifiche e fasi

Registri e hash del codice in [dati di chiusura](../verifiche/v069/chiusura.json). Non sommare i giri parzialmente ripetuti come se fossero prove distinte.

1. Primo giro mirato:6/6 PASS (lint,12scatti reali,40condizioni di rigore, rigori reali,4boa fronte+8negativi, fermo selettivo). Prima della guardia alla sirena e dell'ultimo aggiornamento marcature.
2. Dopo la guardia fine-periodo:3/3 PASS (`lint,rigori-reali,gioco-fermo`), inclusi2casi a0s nel quarto periodo e rientro sullo sfondamento.
3. Regressioni:12PASS/2FAIL su14 al primo giro. Il tiro in superiorità era intercettato dalla nuova priorità della boa: aggiunta guardia `!manUp`. Il replay fallì sull'ultima attesa UI mentre il sorgente veniva modificato; ricaricamento automatico sospetto, nessuna modifica al replay. Ripetizione con sorgente stabile: `lint,tattica,replay`3/3 PASS.
4. Dopo l'aggiornamento delle marcature durante il fallo: `npm run prove -- --solo=lint,tattica,gioco-fermo`3/3 PASS, inclusa reazione reale del difensore allo spostamento dell'attaccante. Nessuna soglia abbassata. Il vecchio obbligo di14fermi sul fallo ordinario è superato dalla richiesta di Ale; gli assert degli arresti generali/replay/comparse restano.
5. Ultimo allineamento di `falloSenzaPalla`: possesso immediato e gruppo fermo autore/vittima, verificati con nuovo caso reale di rientro. `npm run prove -- --solo=lint,gioco-fermo`2/2 PASS sul codice finale. Le misure generali seguenti precedono solo questo ritocco; geometria invariata, CI intera finale da verificare.
6. `npm run aspetto -- --no-build`: PASS completo. Gambe fuori:0/8286verticale,0/4686nuotata,0/1112transizione. iPhone844×390 e667×375:55chiamate/142100triangoli. I primi piani desktop oltre150000non sono scene iPhone.
7. Fluidità/due cambi: PASS, DPR1,5; massimi844×39061chiamate/145944tri,667×37560/145942. Replay nella ripetizione precedente all'ultimo ritocco alle marcature:48/146426,14corpi. Geometria invariata; sono i massimi delle scene campionate, non FPS di un iPhone fisico.
8. `npm run verifica -- --partite=0`: PASS (qualità, tornei e cinque immagini). Confronti ispezionati: posa, arena e HUD coerenti; cambia il footer versione e il timer, ora fermo nello scatto. Sprint3:00contro2:57, azione2:43contro2:39, iPhone2:56contro2:52. Scarti0–0,02%; nessun riferimento sostituito. Le sei partite della verifica e tutti i passi della CI saranno eseguiti sul commit pubblicato: non sono ancora dichiarati PASS.

## Campione di gioco prima dell’ultimo percorso di fallo

[Otto partite finali](../verifiche/v069/bilancio-finale.json), ITA–HUN, periodi480s, semi7919×1…8. Codice dopo l’aggiornamento marcature, prima dell’ultimo allineamento di `falloSenzaPalla`: questi numeri non sono attribuiti al codice finale. Il primo campione prima di `!manUp` e il successivo giro interrotto non sono questo risultato.

| Per squadra/partita | v0.68 finale | v0.69 prima dell’ultimo percorso |
|---|---:|---:|
| Gol |14,56|15,125|
| Tiri |35,44|40,75|
| Rigori |1,62|1,4375|
| Conversione tiri |41,09%|37,12%|
| Superiorità trasformate |48,28%|37,04%|
| Voci in fascia |13/15|6/15|

Espulsioni8,4375 (52,59%dal centro), azioni69,25, durata parità14,09s; gol ITA10,75/HUN19,5, entrate20,66%dei gol. I rigori ora derivano da infrazioni effettive, ma **il bilanciamento globale non è concluso**: tiri alti, espulsioni e superiorità basse, azioni numerose e corte. Campioni da8partite non misurano con precisione differenze piccole. Nessun aumento di potenza/precisione o ritocco delle probabilità globali per compensare artificialmente le nuove regole.

## Fonti e decisioni superate

World Aquatics Competition Regulations18/02/2026, PartSix2.3.8.1,4.2.1,10.4.3,10.5.2,11.1.1.1,11.1.1.4 ([PDF ufficiale](https://resources.fina.org/fina/document/2026/02/18/e6815ecc-06d9-4f0b-98e9-4c441cf5e6a3/2026-02-18_World-Aquatics_CR-Final.pdf)). Estratto locale verificato; FIN successivo non importato.

Superate esplicitamente: annullamento delle espulsioni al kickoff, consumo del tempo durante lo scatto, sanzione casuale sul semplice anticipo battuto, riconoscimento fronteporta soltanto da `turnedUntil`, congelamento generale su fallo ordinario(v0.50). Dettagli in `docs/decisioni-superate.md`.

## Non fatto

Bilanciamento globale e prova su iPhone fisico; giudizio di Ale sulla naturalezza. Le richieste successive (chiamate touch delle entrate durante l'azione, assistenza del PASSA alla boa libera, raccordi visuali tiro/passaggio) sono un lavoro distinto v0.70 e non fanno parte di questa PR. Nuove scorciatoie touch dei tiri speciali: proposta da discutere, non implementata qui. Nessuna nuova promessa di qualità professionale sulla base dei soli test.
