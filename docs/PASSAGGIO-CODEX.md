# Passaggio WATERPOLO 7 — v0.70: chiamate, boa e raccordi in verifica

Repository `alessandrofarre1-wq/pallanuoto-3d`, worktree `/workspace/pallanuoto-v070`, branch `codex/v070-chiamate-gesti`, versione0.70.0. Dipendenza dalla v0.69 finale `ea469d2`, ultimi aggiornamenti solo test/documenti, produzione misurata invariata. Prima di modifiche/test onerosi controlla main, PR recenti, CI e diff: preserva il lavoro di Claude e Codex. Non ripartire dagli archivi. Nessun merge/deploy.

Leggi [CLAUDE.md](../CLAUDE.md), [rapporto v0.70](versioni/v070-chiamate-servizio-gesti.md), [dati e provenienza](verifiche/v070/provenienza.json), [decisioni superate](decisioni-superate.md). La v0.69 regolamentare è separata e la CI completa è verde: https://github.com/alessandrofarre1-wq/pallanuoto-3d/actions/runs/44906185448 sul commit `ea469d23be9b8806ee2224ee0c97ec214ca14611`. I precedenti fallimenti erano scene obsolete, non nuovi bug produttivi. La PR v0.70 dipende dalla v0.69 se non è ancora unita.

## Implementato e verificato finora

- Chiamate A/B/C in parità dopo5,5s dal possesso, compreso viaggio, se la boa non è servibile. Una scelta per possesso, pannello scompare al tocco; appoggio/ritorno restano del giocatore e taglio parte al rilascio. Schema/difesa persistenti conservati. Nel passaggio al tagliante controllato la levetta neutra conserva il contesto; la direzione manuale prevale.
- PASS chiamate:6scene A/B/C nei due versi, due passaggi e presa fisici;5annullamenti;4layout667/844 con margini0/47px ripetuti con HUD effettivamente visibile PASS,44px senza sovrapposizione, foto ispezionate. CAMBI rapido resta basso centro; pausa nasconde le proposte.
- Servizio alla boa realmente libera senza attesa artificiale, con marcatore/aiuti/portiere/linea2m e rischio reali; PASSA neutro preferisce appoggio chiamato e tagliante pronto. Direzionale e superiorità conservati. PASS36scelte e4prese fisiche D/S e due versi: rilascio0,18333s/presa0,5s.
- Raccordi visuali: memoria della carica, Hermite con velocità condivisa al rilascio, ingresso/uscita dalla posa precedente e filtro graduale. Fisica `p.J`/`ballW` e tempi di lancio conservati, nessuna nuova geometria. PASS24casi a60Hz con tracce fisiche identiche, errore massimo0. Ingresso mano polso0,12873→0m, tiro0,07051→0m, passaggio0,03696→0,01484m. Fixture isolata ispezionata: non affermare naturalezza risolta o partita intera. Replay completo PASS,14corpi/picco48calls146426tri.

Le scene già passate precedono l’ultimo percorsooffball della v0.69 ereditato col rebase, non coinvolto nelle scene; dati/hash distinti in `verifiche/v070/`. Nessun nuovo campione generale v0.70: il bilanciamento resta aperto, non copiare i numeri v0.69 come misure di questa versione.

## Chiusura locale e passo finale

Lint/build e regressioni9/9 PASS (gameplay,centroboa,tattica,entrate,integrazione,nuoto coerente,gioco fermo,desktop). Aspetto completo PASS gambe0/8282,0/4689,0/1113 e iPhone55/142100; due cambi PASS61/145944. SondaCPU N1(4×180s,seme7919)ITA6–HUN8,508passaggi/37alcentro/36prese/9finestre, non campione generale. Verifica immagini inizialeFAILsolo4/5, poi2riferimenti aggiornati dopo ispezione e prove pixel/hash; ripetizione indipendente `verifica --partite=0` PASS(0,01/0,02/0,22%/identico/identico). Cronaca completa locale PASS: corretta la fixture rigore con contatto0,9m/vittima2,6m dalla porta e CPU isolata, assert conservati; vecchia CI07044904621590su ba3e falliva qui. Nessun sorgente produttivo modificato. Resta CI070 intera verde sull’ultimo push, poi PR con esiti veritieri. Una sola istanza Chromium pesante; `PLAYWRIGHT_BROWSERS_PATH=/tmp/pallanuoto-browsers`. Non eseguire nuove prove delle espressioni facciali. **Non aggiungere `node_modules`: nel worktree è un collegamento simbolico non tracciato.**

I nuovi tasti touch beduina/sciarpa/finte sono solo proposta da discutere con Ale, non implementati. Le due analisi in `docs/proposte/v070-*` documentano la fase iniziale; il rapporto v0.70 prevale per lo stato attuale. Restano iPhone fisico e giudizio di Ale, nessuna certificazione professionale.

Vincoli sempre<100calls/<150000tri anche due cambi/replay,14corpi completi, nessuna deroga. LogoC, camera/velocità uniche, sprint/controlli/carica0,9s e CAMBI basso centro44px conservati. Non fare merge/deploy.

---

# Archivio delle consegne precedenti

> **Dalla v0.62 (riordino)**: la memoria `CLAUDE.md` contiene solo le regole e le decisioni in vigore; la storia completa è in
> `docs/storia.md`, le decisioni cambiate in `docs/decisioni-superate.md`, l'indice in `docs/README.md`. I numeri del
> bilanciamento stanno in `src/taratura.js` (i moduli li importano e li riesportano con lo stesso nome; `npm run taratura` per
> gioco contro realtà) e `npm run prove` esegue in locale gli stessi passi della CI.

> Archivio v0.50: checkpoint per Claude Code conservato sotto la consegna v0.68 in [PASSAGGIO-CLAUDE-CODE.md](PASSAGGIO-CLAUDE-CODE.md). Il testo v0.49 sotto è storico; non usarlo per riprendere il lavoro corrente.

# Archivio — WATERPOLO 7 v0.49

```text
Continua alessandrofarre1-wq/pallanuoto-3d, branch
codex/v049-gesti-articolati, versione0.49. Prima controlla main, PR recenti,
diff locale, CLAUDE.md e CI: Claude e Codex lavorano in parallelo.
Base19c213d dopo PR44 v0.48. Non duplicare o sovrascrivere lavoro altrui.
Leggi docs/verifiche/verifiche-v049.md e docs/verifiche/misure-gesti-v049.json.

Ale chiedeva di correggere i manichini: gomiti/polsi/busto e gesti in acqua.
Implementato: bind corretto del rig, asse mano anatomico separato dalla
presa, basi ortonormali/rotazioni unitarie, IK sulle lunghezze GLB reali,
limite gomito30°, polso per fase e torsione bacino→tre spine→torace.
Layer VISUALE separato in pose.js: carica, frustata, chiusura, ricezione
interrompibile e nuoto a gomito alto/ingresso disteso. J e ballW fisici
conservati. Palla nel palmo reale e raccordo grafico al lancio≤80ms.
Dopo gol avanzano solo gesti già done, senza callback o tempo di gioco;
non estendere ai falli: cambierebbe la disponibilità delle azioni alla ripresa.
Nessun nuovo GLB, triangolo/materiale o modifica alle espressioni facciali.

Prove: npm run gesti (nuovo, in CI),8casi×91campioni D/S sul GLB vero;
carica classica136,67→88,88°, torace/bacino0→−48,10..+26,72°,
polso nel piano del palmo−1,05..+1,27→−26,36..+30,91°.
Errore norma rotazioni0,186→4,44e−16. Nuoto e replay PASS locali,
558fotogrammi della regia ancora leggibili. Due cambi max62/147652,
replay max49/146360 su entrambe le viste,14corpi completi.
Aspetto PASS:0gambe fuori; iPhone59/142480 e58/142224.

Video prima/dopo in docs/filmati/v049-confronto-gesti.mp4 e tavola
in docs/immagini/v049-gesti-confronto.jpg. Sono sequenze controllate
ai tempi startAct, non una partita completa;30fps acquisizione non sono
una misura delle prestazioni su iPhone. Baseline costruita prima dei cambi.

Prima di PR lint/verifica/aspetto e CI INTERA verde sull'ultimo SHA;
sei partite complete una sola volta in CI, per sole PNG verifica --partite=0.
Ispeziona prima di aggiornare riferimenti e non indebolire assert.
Esiti/link definitivi nella PR; non dichiarare PASS una prova solo avviata.
PLAYWRIGHT_BROWSERS_PATH=/tmp/pallanuoto-browsers nel workspace cloud.

Conserva limiti iPhone <100call/<150000tri ANCHE con due cambi,14corpi
interi, nuoto rapido, IA/regole v0.46, regia/replay v0.48 (7s saltabili),
SPEED1, sprint a tocchi, riflesso solo alta, MAX0,9s/tiro al rilascio,
logo C e CAMBI in basso. Ogni PR aggiorna CLAUDE con file/misure/non fatto
ed evidenzia decisioni superate. Nessun merge/deploy.
NON FATTO: dita indipendenti, nuovo rig/GLB, nuove tecniche o comandi,
telecronaca e altri sistemi arcade. Non ampliare lo scopo senza richiesta.
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
- Leggi CLAUDE.md (memoria del progetto), docs/verifiche/verifiche-v041.md (sezione
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
Dettagli in docs/verifiche/verifiche-v041.md. Corretta anche la home su iPhone (fascia
in fondo, versione nascosta, immagine tagliata): non rimettere #menu a
inset:0 senza 100lvh/100dvh.

v0.42 (Claude Code): consigli di cambio mai nei primi 90 s e mai in difesa
(anche i cambi scelti in pausa aspettano il possesso); il computer libero
entro 7,5 m tira senza aspettare i 23 s di «pazienza» (npm run occasioni);
menu che sfuma verso #07131d in basso per nascondere la striscia di iOS 26
nelle app aggiunte alla Home. Dettagli in CLAUDE.md.

v0.44 (Claude Code): SCHEMI DELL'UOMO IN PIÙ a fasi (src/uomo-in-piu.js,
src/uomo-editor.js, docs/riferimenti/uomo-in-piu.md). In superiorità i pali NON sono
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
  18 febbraio 2026. Cosa si vede in partita e quando: docs/riferimenti/hud-priorita.md.
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
