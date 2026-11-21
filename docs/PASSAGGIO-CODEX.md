# Passaggio WATERPOLO 7 — v0.69: correzioni e prove mirate concluse

Repository `alessandrofarre1-wq/pallanuoto-3d`, branch `codex/v069-falli-riprese`, versione0.69.0, base main `e4e0787` (PR59 già unita da Ale). Prima di modifiche/test onerosi riallinea main, PR recenti, CI e diff: Claude e Codex lavorano sullo stesso progetto. Nessun merge/deploy fatto da Codex.

Leggi [CLAUDE.md](../CLAUDE.md), [rapporto v0.69](versioni/v069-falli-e-riprese.md), [prove/hash](verifiche/v069/chiusura.json) e [campione finale](verifiche/v069/bilancio-finale.json). L'archivio sotto non è un punto di ripartenza. La CI intera sull'ultimo commit pubblicato resta da verificare prima di dichiarare la PR pronta.

## Concluso v0.69

- Espulsione residua nel pozzetto attraverso intervallo/scatto, sei allo scatto; cronometri e residuo dal primo tocco, rientro legale su riconquista o scadenza. Terzo fallo gestito con sostituto al rientro.
- Tolta sanzione casuale dal passaggio che batte l'anticipo. Rigore solo per infrazione/contatto/possesso/occasione credibile entro6m. Ostacolo da dietro durante tiro: attesa dell'esito, senza cancellazione alla sirena.
- Boa CPU già fronteporta conclude in parità, con linea realmente libera. Guardia `!manUp` conserva il sistema di superiorità. Nessun tiro o gol garantito.
- Sul fallo ordinario fermi solo autore/vittima; compagni/avversari continuano e le marcature leggono posizioni aggiornate. Fallo in attacco cambia subito possesso e rientro. Arresti generali restano per pause regolamentari.

## Esiti reali e limiti

Mirate6/6 e3/3 PASS. Primo giro regressioni12PASS/2FAIL: tattica corretta con `!manUp`; replay ripetuto senza sorgente modificato durante la prova, nessun fix replay. Ripetizione lint/tattica/replay3/3; dopo aggiornamento marcature lint/tattica/gioco-fermo3/3 PASS. Ultimo allineamento di `falloSenzaPalla`: possesso immediato e fermo selettivo, lint/gioco-fermo2/2 PASS con nuovo caso reale. Le misure generali seguenti precedono quest’ultimo percorso, con geometria invariata. Aspetto completo PASS: gambe0/8286,0/4686,0/1112; iPhone55calls/142100tri, due cambi picco61/145944 nelle scene campionate. Replay48/146426,14corpi nella ripetizione precedente al ritocco alle marcature. Nessuna nuova geometria. Non sono FPS di iPhone fisico.

`npm run verifica -- --partite=0` PASS, cinque confronti ispezionati, scarto≤0,02%, nessun riferimento sostituito. Le sei partite della verifica e tutti i passi della CI sono da eseguire sul commit pubblicato, senza duplicare un altro campione locale.

Campione8gare ITA–HUN480s prima dell’ultimo allineamento di `falloSenzaPalla` (non sul codice finale):15,125gol/40,75tiri, rigori1,4375, espulsioni8,4375, superiorità37,04%, azioni69,25, parità14,09s, soltanto6/15voci in fascia (v0.68:13/15). NON presentare il bilanciamento globale come concluso. Nessun ritocco a potenza/precisione o probabilità globali per compensare. Campioni precedenti/interrotti non sono questi dati.

## Lavoro successivo già autorizzato: v0.70

Worktree separato `/workspace/pallanuoto-v070`, branch `codex/v070-chiamate-gesti`, nato dal checkpoint locale v0.69 `6d7b563`; prima di pubblicare va riallineato al commit finale v0.69. Preservare il diff locale. **Non aggiungere `node_modules`: nel worktree è un collegamento simbolico non tracciato.**

Implementati localmente ma ancora da verificare nel browser: chiamate A/B/C durante l'azione con scelte touch dopo5,5s se boa non servibile, assistenza al servizio della boa realmente libera, raccordi visuali tiro/passaggio. Separati dalla PR regolamentare v0.69. I nuovi comandi touch per beduina/sciarpa/finte speciali sono ancora idee da discutere con Ale; non aggiungere pulsanti fingendo che siano già concordati. Restano prove reali, ispezione sequenze, regressioni/aspetto/verifica e CI, documentazione/versione e PR v0.70.

Limiti sempre<100calls/<150000tri anche due cambi/replay,14corpi completi; nessuna deroga. LogoC, camera/velocità uniche, sprint/controlli/carica attuali e CAMBI basso centro44px conservati. Una sola istanza Chromium pesante, `PLAYWRIGHT_BROWSERS_PATH=/tmp/pallanuoto-browsers`; niente prove espressioni facciali senza richiesta. Prova iPhone fisico e giudizio artistico di Ale ancora necessari.

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
