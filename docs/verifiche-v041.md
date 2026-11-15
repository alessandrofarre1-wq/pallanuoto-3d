# Verifiche v0.41 — consegna in bozza

15 novembre 2026. Ale ha chiesto di pubblicare subito il codice pronto e quello ancora da chiudere, con un prompt per Claude Code. La PR resta **in bozza, da non unire** finché i punti aperti sotto non sono risolti. Nessun merge o deploy.

## Passato

- `npm run lint`: PASS, zero errori e zero warning sull'ultima integrazione.
- Build Vite: PASS, 66 moduli con la nuova pausa.
- `npm run centroboa`: PASS. Anticipo e girata nei due versi; girata 2,00 s nei quattro casi verso/mano, distanza minima 0,900 m, passo massimo 0,0209 m/frame. Nessun rigore gratuito; recupero difensivo e cinque vincoli negativi rispettati.
- Dodici passaggi destra/sinistra/dietro, due versi e due mani: corpo fronte porta 1,000; mano verso bersaglio almeno 0,99846, palmo disegnato almeno 0,999976; errore origine dalla mano 0, nessun NaN; lunghezze entro 0,30/0,29 m su 300 campioni.
- `npm run tattica`: PASS; adiacenti, servizio al centro negato/aperto, skip aperto/coperto, pali durante passaggio, al volo libero/marcato, difensore recuperato, posizioni editate, entrata/copertura e aiuto/ritorno.
- `npm run gameplay -- --no-build`: PASS senza indebolire gli assert v0.40. Reazione al vantaggio 0,017 s; appoggio apre in 1,283 s con spostamento 1,167 m e distanza compagni 2,911 m.
- `npm run strategie -- --no-build`: PASS, inclusa la nuova pausa: editor→storage→IA, due fasi, reload, cambio campo, sostituzione, validazione, avvio torneo, scelta Incrocio e richiamo del piano personale.
- Editor e pausa su 667×320, 852×393, 393×852: PASS, nessun overflow orizzontale o errore pagina; Riprendi sempre visibile dopo scroll, almeno 44 px. Tre foto per schermata in `docs/immagini/v041-*`.
- `npm run sezione4 -- --no-build`: PASS, inclusi schizzo/colonnello AI e vincoli negativi.
- `npm run aspetto -- --no-build`: PASS completo. Partita terminata; gambe sopra acqua 0/4.558 verticali, 0/7.582 nuotata, 0/1.300 transizione. Viste iPhone 57 chiamate/141.358 triangoli e 56/141.346. Primi piani diagnostici desktop fino a 156.066 triangoli: non sono le viste iPhone cui si applica il budget.
- Misura fluidità touch 844×390 e 667×375 DPR1,50: azione fino a 65/142.622; due cambi contemporanei fino a **69/148.734**, sotto entrambi i limiti. Traccia `docs/misure-fluidita-v041.json`. Chromium SwiftShader, non una misura FPS su hardware Apple.

## Verifica completa eseguita: partite PASS, riferimenti grafici da chiudere

`npm run verifica`: 13 controlli qualità e 17 gruppi tornei PASS; tutte le sei partite terminate.

| Input | Risultati | Tiri |
| --- | --- | --- |
| Nessun comando | 0–10, 0–8, 0–6 | 19, 15, 15 |
| Comandi casuali | 1–20, 0–14, 0–15 | 71, 68, 72 |

Totale 74 gol/260 tiri, conversione 28%. Nessun risultato è una misura del piacere di gioco.

Esito complessivo **FAIL sui soli screenshot precedenti**: menu entro tolleranza, sprint identico; azione 1,67%, iPhone piccolo 8,42%, iPhone orizzontale 7,56% diversi. Sono cambiate intenzionalmente IA e posizioni: ispezionare attuale/confronto e poi aggiornare i riferimenti soltanto se corretti. Le sei gare non devono essere ripetute per un semplice aggiornamento dei PNG.

## GitHub e lavoro ancora aperto

La [CI del checkpoint e57ef12](https://github.com/alessandrofarre1-wq/pallanuoto-3d/actions/runs/43686710038) ha superato verifica completa con immagini non bloccanti, tornei-menu, rigori, gameplay, centroboa, tattica, strategie, fisica e sezioni 1–2. Si è fermata su **sezione3: centrale destro, difensore a 1,71 m anziché sotto 1,3 m**. Gli altri controlli della sezione sono passati. Non è ancora stabilito se la causa sia il nuovo comportamento o una fixture incompleta: non indebolire l'assert per farla passare.

La pausa esplicativa e le prove aggiuntive sono successive a quel checkpoint. Sul nuovo SHA controllare tutta la pipeline, incluse le fasi che la prima CI non ha raggiunto. Non dichiarare CI verde sulla base dei soli test mirati.

Restano inoltre: prova su iPhone fisico, giudizio sul gameplay, più slot personali/sequenze multi-fase, arbitraggio completo dei contatti e vero sette di movimento mediante sostituzione del portiere. Regolamento mantenuto WA febbraio 2026; differenze FIN ottobre documentate e non fuse nel motore.

## Chiusura dei punti aperti (Claude Code, 15 novembre 2026)

1. **sezione3, centrale destro a 1,71 m.** Causa: la prova, non il muro. Per escludere i contrasti azzerava solo `tackleCD`, ma il terzo tocco ravvicinato di `contrasto` (`regole.js`, regola v0.29) azzera `tackleCD` apposta e diventa fallo. Con la nuova sequenza di numeri casuali della v0.41 il computer arrivava per caso al terzo tocco al fotogramma 145 della prova: `foul` fermava il gioco e spostava il difensore di 0,9 m (da 0,81 a 1,71 m). Lanciato da solo, lo stesso caso dava 0,80 m. Correzione: la prova azzera anche `d.colpi`, come dichiarato nel suo commento («niente contrasti»). Soglia invariata: 1,7 m (il passaggio citava 1,3 m, ma il file della prova usa 1,7). Esito locale: 14/14 controlli PASS, centrale destro 0,82 m.
2. **Riferimenti grafici.** Con il computer di Claude Code gli scarti erano 4,92 / 1,26 / 3,05 / 10,48 / 9,29% (diversi da quelli misurati da Codex: i caratteri dei testi cambiano da un computer all'altro). Confronti guardati uno per uno: posizioni dei giocatori della nuova IA, «Prototipo v0.41», forma dei caratteri; nessun errore di disegno. Aggiornati tutti e cinque (`npm run verifica:aggiorna -- --partite=0`), poi `npm run verifica -- --partite=0`: PASS, cinque immagini identiche. Le sei partite non sono state rifatte (già complete nel controllo di Codex).
3. **CI completa sull'ultimo commit:** esito riportato nella descrizione della PR.

`npm run lint`: PASS.

## Misure e controlli aggiuntivi (Claude Code, 15 novembre 2026)

**Bilancio** (`node tests/bilancio.mjs --partite=8 --squadre=ITA,HUN`, tempi da 8 minuti, per squadra a partita; tra parentesi Mondiali 2025):

| Voce | v0.41 | Mondiali 2025 | v0.34–0.36 |
|---|---|---|---|
| Gol | 17,4 | 13,3 | 18 |
| Tiri | 44,2 | 33 | 46 |
| Tiri in gol | 39,3% | 40% | 39% |
| Espulsioni | 7,7 (71,5% lotta al centro) | 11 (66%) | 9,1 |
| Rigori | 2,3 (segnati 80,6%) | 1,8 | 1,1 |
| Superiorità trasformate | 63,4% | 52% | — |
| Tiri in controfuga | 8,6% | 3% | 13% |

Gol da entrata 0%; ITA–HUN 0 vittorie su 8 (un pareggio). Restano da tarare: troppi tiri e gol, poche espulsioni, superiorità troppo efficaci, controfughe sopra il reale.

**CAMBI** (basso centro) su 667×300 (SE con barre di Safari), 852×340 e 932×430: nessuna sovrapposizione con comandi, joystick, pannello, lotta al centro e tabellone. Sull'SE il testo del consiglio è troncato con i puntini.

**Editor strategie e carte tattiche in pausa**: nessuno sbordo laterale nelle tre misure; a 300 di altezza si vede poco per volta e serve scorrere.

**Home su iPhone** (foto di Ale): fascia di un altro colore in fondo, versione nascosta in verticale e immagine tagliata dritta in orizzontale. Corretto in `src/stile.css` e `index.html` (menu esteso sotto le barre con `100lvh`, schermate nell'area visibile con `100dvh`, sfondo e `theme-color` uguali al menu, giocatore fino al bordo con sfumatura, versione sopra la sfumatura). `npm run menu -- --no-build --solo-controlli` PASS.
