# Passaggio WATERPOLO 7 — v0.68

Repository `alessandrofarre1-wq/pallanuoto-3d`, branch `codex/v068-difesa-entrate-arena`, base main `c11f93d` (PR #58, v0.67 di Claude). Versione `0.68.0`. Prima di proseguire riallinea main, PR recenti, CI, questo branch e diff locale. L'archivio v0.49/v0.50 sotto non è il punto da cui ripartire.

Leggi [CLAUDE.md](../CLAUDE.md), [rapporto v0.68](versioni/v068-cambi-entrate-arena.md), [decisioni cambiate](decisioni-superate.md) e [misure con provenienza](verifiche/v068/). Esiti della CI sull'ultimo SHA e stato del campione e della consegna sono nella descrizione della PR v0.68; controllarli prima di dichiarare pronto un seguito. Nessun merge/deploy eseguito da Codex.

## Implementato

- Cambio volante avversario: il marcatore copre temporaneamente palla-centroboa/porta, senza inseguire l'uscente al bordo; due coperture si dividono gli spazi. Riprende il sostituto quando entra nella zona d'attacco, entro 10,5 m dalla porta. Pressing/zona e controllo umano conservati.
- Entrate A/B/C: 3→2 e taglio verso 5; specchio 3→4 e taglio verso 1 con mano/abilità adatte; 2 al palo. Taglio al rilascio effettivo. L'appoggio legge entrante pronto, ala salita a 3,25 m sulla chiusura del suo difensore, oppure circolazione. Mezze entrate 1/5 richiedono testa davanti e marcatore vicino poco attento. Nessuna sanzione o rete garantita.
- L'innesco A/B/C richiede 6 s di possesso e due passaggi; mezza D con obiettivo max1,4m e almeno0,6m utile; non interrompe la controfuga organizzata. Dopo un fallo recente può partire subito sul passaggio. Cooldown automatico 12 s, comandi manuali conservati. Il primo candidato partiva troppo presto: sui due semi di controllo 20,75 gol per squadra contro 13,75 della v0.67. Non riattivare quell'innesco precoce.
- Identità, calotta, mano e specialità separate dal posto tattico. Occupanti e consegne persistono durante il gioco vivo; rientri dalle posizioni raggiunte. Quando le regole ricollocano le squadre dopo gol/time-out o a inizio tempo, si ricostruiscono mappe e riferimenti, pulendo anche la memoria dell'entrante. Nessun reset sui recuperi vivi.
- Preset **Falso centro**: non specialista esce, boa vera attende il corridoio e subentra; difesa può consegnare o aiutare temporaneamente a M/raddoppio. Centro effettivo usato da lotta, fisica, zona e statistiche. HUD con posto attuale distinto dal numero di calotta.
- Rimossa la correzione istantanea degli NPC sotto i 2 m: tornano nuotando. Sguardo del tagliante verso il portatore solo visuale, direzione fisica coerente.
- Arena: sedute, pensilina, corrimani, panchine/attrezzature, tavolo e ufficiali 3D, pontoni/supporti/rete e rulli. Sei mesh statiche, atlante 1024²; CPU 8.084→8.296 triangoli. Nessun modello/controllo/camera/acqua sostituito.

## Verifiche da conservare

- Primo giro completo40PASS/1FAIL immagini su41, sei gare78gol/233tiri: precedente ai fix finali, non attribuirlo al codice finale.
- Dopo i fix14/14 mirate PASS; dopo ultimo limite D6/6 PASS (lint, entrate, integrazione, nuoto coerente, gioco fermo, replay).25scene difesa ripetute PASS.
- Aspetto finale completo PASS: gambe0/7513,0/4840,0/1129; iPhone56/142116. Arena con due cambi64/148852, replay49/146682.
- PR DRAFT: CI in corso/da consultare nella PR, non dichiararla pronta al merge.
- Otto partite prima della mezza corta:16,875gol,39,31tiri per squadra,38,15%gol da entrata,6/15voci in fascia. Bilancio dopo ultimo limite1,4m NON completato. D ora richiede anche0,6m di spostamento utile.
- Punto concreto da verificare: ala a6,2m, mezza1,4m, `entrataPronta` richiede distanza porta<=5m; il target può rimanere fuori finestra. Risolvere con prova di ricezione/tiro reale prima di tarare8/16gare. Non allargare soglie senza verificare il comportamento.

I filmati sono verifiche: quello del cambio parte da una scena preparata (portatore comandato senza tiri, caso 0,5), poi usa il motore reale per 24 s e viene accelerato 3×. Quello dell'entrata cerca una vera azione CPU, senza imporre passaggi o posizioni; cerchi/etichette sono solo annotazioni del filmato. Non sono misure degli FPS di un iPhone fisico né prova di naturalezza professionale. Vedi rapporto e metadati.

## Da continuare con Ale / Claude

1. Completare e valutare il campione di otto partite sul codice finale e la frequenza delle entrate giocando. Conservare circolazione e ripartenze di Claude; non compensare un problema di scelta tattica alterando alla cieca precisione/potenza. La taratura non è dichiarata conclusa dai test geometrici.
2. La CPU riconosce un falso centro già disposto o nato dai movimenti, ma **non costruisce autonomamente la preparazione da un piano ordinario**. Il preset è disponibile al giocatore. Se completi la preparazione, conserva mano/specialità, tempi e lettura difensiva; nessun esito garantito.
3. Restano i problemi v0.67 di durata delle azioni, superiorità, fatica da contatto e riferimento reale dei falli. Non sono automaticamente risolti dalla v0.68.
4. Ale deve giudicare la resa artistica dell'arena e la naturalezza in partita. Il dettaglio è migliorato in modo incrementale; per il livello professionale serve ancora una valutazione artistica, non altre sole misure geometriche.

Se la PR v0.68 non è unita, prosegui dal suo branch senza duplicarla. Se è unita, parti da main aggiornato e alza la versione della nuova PR. Preserva tutto il lavoro successivo di Claude. Limiti iPhone sempre <100 chiamate e <150.000 triangoli anche con due cambi/replay, 14 corpi completi; nessuna deroga. Una sola istanza Chromium pesante per volta. Browser locale: `PLAYWRIGHT_BROWSERS_PATH=/tmp/pallanuoto-browsers`. Non aggiungere prove delle espressioni facciali senza richiesta di Ale.

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
