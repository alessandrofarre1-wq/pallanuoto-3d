# Passaggio corrente — WATERPOLO 7 v0.48

```text
Continua alessandrofarre1-wq/pallanuoto-3d, branch
codex/v048-replay-regia-leggibile, versione 0.48.
Prima controlla main, PR recenti, stato locale, CLAUDE.md e CI:
Claude e Codex lavorano in parallelo. Non duplicare modifiche.
Base 933654b dopo PR #43 v0.47; conservati nuoto v0.45 e IA/regole v0.46.
Leggi docs/verifiche-v048.md e docs/misure-replay-v048.json.

Ale autorizza un replay più ambizioso sul riferimento FIFA e insiste sulla
comprensibilità. Implementati 0,6 s diretta + 5,2 s replay saltabile + 1,2 s
rimessa. Motore congelato solo con archivio valido; fine e Salta attraversano
una volta sola il residuo dello stop originale. Nessun recupero, cambio,
cronometro, gol o statistica aggiuntivi. Risultato e premiazione aspettano
la fine della clip; gestita la rotazione anche nel ramo finale.

Fonte vera fino a 3 s: arrivo del passaggio, ricezione, alzata, rilascio,
rete e reazione. Camera FERMA durante ricezione e intero volo; avvicinamento
morbido solo dopo il gol, stesso lato e orientamento. Fit prospettico sui
punti critici e margini DOM/notch. Rallenty legato a rilascio/rete.
Identità registrata: niente primo piano della riserva appena subentrata.
Pose.js aggiunge una piccola esultanza vera (mano su dopo rete), registrata.

Arena: cimasa con spessore/smusso e due tribune basse alle testate;
stessa mesh/atlante 1024, 388→552 triangoli (+164). Pareti 4→1 mesh,
48 triangoli invariati. I 14 corpi in campo restano completi.
Sei foto vere in docs/immagini/v048-replay-regia-* e tavola
v048-replay-sequenza.jpg: stessa beduina fisica, tre momenti, due telefoni.

npm run replay usa tests/replay-v048.mjs, che sostituisce il test v047.
PASS locale: 558 fotogrammi, 18 sequenze, due direzioni, tiri da fuori/ala/
palombella, 844×390 e667×300, anche margini 44/44/21. Punti critici liberi
dalle scritte; palla minima 5,46 px CSS. Replay con due comparse: max
49 chiamate/146360 triangoli. Diretta con due cambi: max62/147652 su
entrambe le viste. Buffer34episodi: max16676528 byte contati,19 texture
finali (tetto32),≤106campioni. La fixture dell'ala inizialmente trovava
una parata vera: portiere posizionato dal lato opposto per isolare la camera;
gol sempre fisico e assert invariati. Non alterare l'IA per far passare test.

Prima della PR: lint, verifica, aspetto e CI INTERA verde sull'ultimo SHA.
Sei gare in CI una sola volta; per sole PNG verifica --partite=0, con
ispezione prima di aggiornare i riferimenti. Esiti/link definitivi nella PR.
Non dichiarare PASS una prova soltanto avviata.
PLAYWRIGHT_BROWSERS_PATH=/tmp/pallanuoto-browsers nel workspace cloud.
Conserva <100 chiamate/<150000 triangoli su iPhone ANCHE con due cambi,
14 corpi interi, cartoon, SPEED1, sprint a tocchi, riflesso solo alta,
MAX0,9s/tiro al rilascio, logo C e CAMBI in basso.

NON FATTO: telecronaca, barra oscillante, bonus/Sfide/progressione,
replay manuale/serie rigori, tribune animate, nuovi GLB, arena fotorealistica.
Nessuna misura FPS su iPhone fisico. Non ampliare lo scopo senza richiesta.
Nessun merge/deploy. Ogni PR aggiorna CLAUDE con versione/file/misure/non fatto
ed evidenzia decisioni superate. Preserva lavoro locale e di Claude.
```

## Storico dopo la v0.41

Testo da incollare in Codex per continuare il lavoro dopo la sessione di Claude Code del 15 novembre 2026.

```text
Continua alessandrofarre1-wq/pallanuoto-3d per Ale (non programmatore:
spiegazioni in italiano semplice, brevi, con cosa è cambiato e cosa provare).

PRIMA DI TUTTO, CONTROLLA LO STATO REALE (non fidarti di questo testo):
- git fetch; guarda se la PR 37 (v0.41 completa, ramo
  claude/gracious-rubin-rcvklk) è stata unita in main. La PR 36 (tua bozza
  v0.41) è SUPERATA dalla 37: non riaprirla e non ripartire dal suo ramo.
- Se la 37 è unita: nuovo ramo da main aggiornato. Se non è unita: chiedi
  ad Ale se unirla prima, non duplicare il lavoro.
- Leggi CLAUDE.md (memoria del progetto), docs/verifiche-v041.md (sezione
  finale «Chiusura dei punti aperti») e il codice ATTUALE dei file che tocchi
  e di chi li usa. Anche Claude Code lavora sul progetto: il codice può essere
  cambiato rispetto a quanto ricordi.

COSA HA FATTO CLAUDE CODE SULLA v0.41 (nessuna modifica al codice del gioco):
1. sezione3 «centrale destro a 1,71 m»: era un difetto della PROVA. Per
   escludere i contrasti azzerava solo tackleCD, ma il terzo tocco di
   contrasto() in regole.js (regola v0.29) azzera tackleCD apposta e diventa
   fallo; con la nuova sequenza di rnd della v0.41 il computer ci arrivava per
   caso e foul() spostava il difensore di 0,9 m. Ora tests/sezione3.mjs azzera
   anche d.colpi. Soglia INVARIATA a 1,7 m (il tuo passaggio diceva 1,3: nel
   file è 1,7).
   LEZIONE: se una prova fallisce solo nella sequenza completa e passa da
   sola, cerca uno stato rimasto dalla prova precedente o un evento casuale
   (fallo, contrasto, lotta) prima di toccare il comportamento.
2. Riferimenti grafici ispezionati e aggiornati (posizioni della nuova IA,
   «Prototipo v0.41», caratteri). ATTENZIONE: computer diversi (tuo, Claude
   Code, GitHub) disegnano i caratteri in modo diverso; i riferimenti fatti
   su uno danno scarti di qualche % sugli altri. In CI gli screenshot non
   bloccano. Se vedi solo scarti di caratteri, non è un errore del gioco.
3. CI completa PASS su tutti i passi (esecuzione 43693430326).

MISURE DI PARTENZA (8 partite ITA–HUN, per squadra; Mondiali 2025 tra
parentesi): gol 17,4 (13,3), tiri 44,2 (33), espulsioni 7,7 (11), rigori 2,3
(1,8), superiorità trasformate 63% (52%), controfuga 8,6% dei tiri (3%).
Dettagli in docs/verifiche-v041.md. Corretta anche la home su iPhone (fascia
in fondo, versione nascosta, immagine tagliata): non rimettere #menu a
inset:0 senza 100lvh/100dvh.

v0.42 (Claude Code): consigli di cambio mai nei primi 90 s e mai in difesa
(anche i cambi scelti in pausa aspettano il possesso); il computer libero
entro 7,5 m tira senza aspettare i 23 s di «pazienza» (npm run occasioni);
menu che sfuma verso #07131d in basso per nascondere la striscia di iOS 26
nelle app aggiunte alla Home. Dettagli in CLAUDE.md.

v0.44 (Claude Code): SCHEMI DELL'UOMO IN PIÙ a fasi (src/uomo-in-piu.js,
src/uomo-editor.js, docs/uomo-in-piu.md). In superiorità i pali NON sono
più fissi (ruoli 1 e 6): sono chi nella fase in corso sta davanti alla porta
(paloUomo in ia.js). Prova: npm run uomo.

REGOLE FISSE DI ALE (da rispettare sempre):
- Ogni PR alza la versione di 0.01 (package.json) e la scrive nel titolo
  («v0.42: …»). Le correzioni di una PR aperta vanno nella STESSA PR.
- Ogni PR aggiorna CLAUDE.md: cosa è cambiato, file, numeri misurati
  davvero, cosa NON è fatto; segnala ogni decisione precedente cambiata.
- Prima della PR: npm run lint, npm run verifica, npm run aspetto, più le
  prove dei file toccati; risultati veri nella descrizione. Mai scrivere PASS
  per una prova non eseguita o fallita. Controlla la CI COMPLETA sull'ultimo
  commit prima di dire che è pronta.
- Non indebolire una prova per farla passare: trova la causa.
- iPhone: sempre meno di 100 oggetti disegnati e 150.000 triangoli, anche
  con due cambi in corso. Nessuna deroga senza ok esplicito di Ale.
- Restano fissi: stile cartoon, 14 corpi completi, camera unica, SPEED=1,
  sprint a tocchi, riflesso completo solo in qualità alta, ombra
  dell'espulso, palla senza contorno, carica 0,9 s e tiro al rilascio, CAMBI
  in basso al centro con area di tocco 44 px (dalla v0.44 visibile SOLO con
  un consiglio urgente o un cambio in corso), regolamento World Aquatics
  18 febbraio 2026. Cosa si vede in partita e quando: docs/hud-priorita.md.
- Il caso del gioco passa solo da rnd(); la grafica usa rndGrafica().
- Nessun merge o pubblicazione senza istruzione di Ale. Prima di cambiare
  direzione in modo grosso, chiedi ad Ale.

COSA RESTA APERTO (scegli con Ale da dove partire):
- Prova di Ale su iPhone fisico della v0.41 (centroboa, strategie
  prepartita, carte tattiche in pausa) e suo giudizio sul gameplay.
- Bilanciamento verso i Mondiali 2025 (per squadra: ~33 tiri, ~13 gol,
  ~11 espulsioni, ~1,8 rigori, controfuga 3% dei tiri): rimisurare con
  npm run bilancio dopo la v0.41 prima di tarare.
- Limiti dichiarati v0.41: un solo slot personale di strategia, niente
  sequenze multi-fase, arbitraggio dei contatti semplificato, niente vero
  sette di movimento con sostituzione del portiere.
- Da verificare con Ale: mano di Tommaso Gianazza (database mancino, file
  dell'aspetto destro); giudizio sul logo.
```
