# Passaggio WATERPOLO 7 — v0.73 mani e polsi

Ramo `codex/v073-mani-polsi`, worktree `/workspace/pallanuoto-v073-mani`, base main `1452f1a` (PR #63 unita), versione 0.73.0. Prima di altri interventi controllare main, PR, CI e modifiche locali: preservare il lavoro di Claude Code.

Ale ha fermato il tentativo sul volto, poi ha chiesto di conservare mani, polsi e movimenti validi. Questo ramo integra soltanto mani/polsi: 30 falangi aggiunte alle 24 giunture originali. Il volto, le 18 morph e il controller delle espressioni sono quelli della v0.72. Le migliorie a nuoto e tiro già pubblicate restano. Il prototipo facciale locale `/workspace/pallanuoto-v073` è sospeso, non pronto e non fa parte della PR.

Leggere [CLAUDE.md](../CLAUDE.md), [rapporto v0.73](versioni/v073-mani-polsi.md) e [verifiche](verifiche/v073/README.md). Lo SHA e l'esito della CI finale si leggono nella PR. Nessun merge o deploy eseguito.

Rigenerazione: `node strumenti/rigenera-mani-v073.mjs`, con Blender 4.3.2, Python numpy/Pillow e dipendenze npm. Fonte MakeHuman CC0 inclusa e fissata a commit. GLB finale: 8366 triangoli, 8599 vertici, 54 joint. Le 24 rest/IBM e le 18 morph originali sono conservate. Dita solo visuali: `J` e `ballW` fisici invariati. Marker di presa 3 mm oltre il palmo; palla 22,12 cm. Il replay registra soltanto le rotazioni delle nuove falangi perché posizione, scala e visibilità locali sono costanti; il limite storico di 24 MiB è conservato.

Non attribuire al modello il nuovo volto o la qualità artistica del concept. Non fatto: rifacimento viso, clip Plask importate, revisione generale di movimenti/IA o bilanciamento, FPS su iPhone fisico. Sempre meno di 100 chiamate e 150.000 triangoli anche con due cambi e replay, 14 corpi completi. Camera unica, SPEED 1, controlli, logo C, riflesso solo in alta e CAMBI basso al centro restano.

---

# Passaggio WATERPOLO7 — v0.72

Branch `codex/v072-proporzioni-tiro-rimesse`, worktree `/workspace/pallanuoto-v072`, base main7827854(PR62unita), versione0.72.0. Prima di altro lavoro riallineare main/PR/CI e preservare le modifiche; non ripartire dai vecchi checkpoint. Nessun merge/deploy di questa versione.

Leggere [CLAUDE.md](../CLAUDE.md), [rapporto v0.72](versioni/v072-proporzioni-tiro-rimesse.md), [verifiche](verifiche/v072/README.md) e [decisioni superate](decisioni-superate.md).

Ale ha chiesto coerenza di **tutto**: non ingrandire la sola palla. Corpi VIS1,45→1,10 (base bind2,547→1,932m); campo25×20m, porta3×0,90m e palla22,12cm conservati. SagomaGK, punti di lancio, ombre/contatti acqua seguono l'atleta. Questo cambia necessariamente ballW assoluto: non dichiarare identità delle partite conVIS1,45. Test gesto prima/dopo usa scala1,10 in entrambe le fasi e isola solo pose/corpo:4casi, frusta175,031ms, erroreJ/ballW0, traccia identica. Il GLB ha già24joints pesati: niente conversioneFBX/Mixamo necessaria. Migliorato solo tiro classico, non tutti gli speciali.

RimessaGK laterale ora attacco18s, fondo corner18s; eccezione muro di movimento conservata (difesa28s).56voli reali con riprese da partita.update PASS. Non abbassare assert;5suiteNodekeeperPASS e limite mani7m/s conservato con scansione dei picchiIK affinata al lancio.

Gli esiti finali sono riportati nella PR e nel rapporto. Locale: lintPASS, primo prove49/53 con4passi poi corretti e ripetutiPASS, verifica bloccantePASS e aspetto completo in due metà sulla stessa buildPASS. Due cambi66/148150,14corpi; rigori190/240=79,17% dopo esclusione del solo preset automaticoquadrella sui rigori, stessa velocità/precisione/lettura. La CI INTERA dell’ultimo SHA nellaPR è la fonte finale; sei partite una sola volta lì. Il bilanciamento0.71 è solo baseline storica: dopo cambio scala non venderlo come nuova misura. Non eseguire altre8+8gare senza diagnosi/scopo; sei partite standard una volta nellaCI. Nuova foto annunciata non allegata nel messaggio attuale: datiGLB/articolo/riferimenti precedenti disponibili. Nessuna nuova prova facciale. Una solaChrome pesante, browser `/tmp/pallanuoto-browsers`; localhost richiede permesso rete dello strumento.

Restano iPhone fisico/FPS e giudizio di Ale, bilanciamento generale già aperto e nuovi comandi touch speciali ancora da concordare.14corpi completi, sempre<100draw/<150000tri su iPhone anche2cambi/replay; logoC, camera unica/SPEED1, controlli e maxcarica0,9s, riflesso soloalta, CAMBI basso centro44px. Non aggiungere `node_modules`.

Nuovo incarico successivo autorizzato: **prima consegnare questa PR**, poi esportare un GLB con rig più completo/dita e giunture per Plask da video. Asset separato, non sostituire automaticamente quello iPhone. Verificare skin/pesi reali e requisiti del retargeting.

---

# Passaggio WATERPOLO 7 — v0.71: portiere, tiri e stamina

Repository `alessandrofarre1-wq/pallanuoto-3d`, branch `codex/v071-portiere-palla`, worktree `/workspace/pallanuoto-v071`, versione0.71.0, base main `dbf20b61024ca9609e6715abd1aa6e7a59899590` (PR60/61 unite). Le verifiche locali sono chiuse; CI completa e SHA definitivo si leggono nella PR associata al ramo. Nessun merge/deploy eseguito. Prima di altro lavoro riallineare main, PR, CI e diff: preservare Claude e Codex, non riaprire gli archivi sotto.

Leggere [CLAUDE.md](../CLAUDE.md), [rapporto](versioni/v071-portiere-tiri-stamina.md), [dati e fonte](verifiche/v071/provenienza.json), [decisioni cambiate](decisioni-superate.md). Tutto il codice di questa versione deve stare su questo ramo; i vecchi checkpoint non sono la base.

## Cosa contiene

- Contatto continuo della palla con26sfere di torso/testa/braccia/mani del portiere, posa condivisa e reazione/portata limitate. Il sorteggio decide una lettura, non una parata. Corpo e braccia seguono lo stesso bersaglio, anche quando è letto male; nessun tuffo laterale sempre sul vero crossZ. In arrivo anche un tiro deviato ha precedenza sul recupero della palla vagante; le respinte uscenti restano contendibili. Controllo umano preservato.
- Prese solo sulle mani, rare sui colpi ravvicinati; deviazioni oblique ancora verso porta e statistiche coerenti. Nessun obbligo di finta per segnare. Fattore rigori0,41→0,7: ora è la sola lettura corretta e può non bastare fisicamente.240rigori senza finta:188gol,78,3%,22,7±0,7m/s,170ms. Non toccati globalmente mira/potenza per nascondere problemi.
- Porta già3×0,90m; palla disegnata39→22,12cm come quella fisica, palmo e galleggiamento allineati. VIS1,45/BRV0,15/origine fisica di lancio conservati. Stamina compatta sempre,0%compreso, dettagli temporanei. Palomba tesa/CPU prima finta; forti alle quadrelle/spin da tiro; rimbalzo davantiGK e rumore sordo su urto vero.
- Replay adattato alla palla reale: fit prospettico più vicino solo se serve, almeno4pxCSS nei casi provati, primo piano≥2×, testa/mano/porta liberi; orbita/FOV/tempi invariati.18scene/558frame PASS, foto reali in `docs/immagini/v071/`.

## Esiti reali e limiti

Cinque suite Node PASS;51scene sweep30/60/120Hz/2versi; mani max6,8586m/s su50bersagli. Browser:14/14 traiettorie sulla sagoma primaGOL→respinte,24varchi ancoraGOL,4muri reali con seguito (striscio entra, pieno torna). I320tiri a22m/s imposti sono primo esito diagnostico, NONpercentuali di partita. Stamina60stati, palla4scene D/S e667/844 PASS. Traiettorie22scene/42voli Rapier: palomba8m1,396→1,021s/picco3,168→2,076m; bounce1,434m dietro→1,248m primaGK.

Lint PASS. `prove` primo48/51: replay,rigori,statistiche corretti e verificati successivamente con soglie conservate; per Precisione il tiro standard0,7 è distinto dalla nuova quadrella≥0,8, confronto casuale accoppiato e rapporto2,25. La CI INTERA definitiva resta la fonte per lo SHA pubblicato. Aspetto completo PASS: gambe0/7502,0/5300,0/1198; iPhone56/142102 e55/142100. Due cambi61/145944; replay48/146426,14corpi. Cinque confronti immagini ispezionati, riferimenti2–5aggiornati con SHA, menu lasciato entro tolleranza; verifica bloccante indipendente PASS(menu0,01%,3identici,orizzontale0,00%entro tolleranza). Sei partite standard una sola volta nella CI finale. Foglio tiro opzionale interrotto per rendering software superfluo; sei foto replay reali già ispezionate.

**Bilanciamento non risolto:** finale8gare ITA–HUN480s/stessi semi,17,375gol/43,25tiri per squadra,40,17%conversione,32,09%superiorità; Italia10,625–Ungheria24,125,4/15voci in fascia. Baseline8gare0.70:16,125gol/41,375tiri,38,97%/40,32%,11,75–20,50,5/15voci. Divario cresciuto e superiorità ancora bassa. Il precedente candidato15,375gol/23,13% non è il finale: archivi e fasi distinti. Prima di ulteriore taratura leggere i dati e diagnosticare la scelta dei tiri/spazi, non nerfare precisione/potenza globale e non abbassare assert. Non è un campione contro un utente umano o tutte le nazionali.

Non fatto: iPhone fisico/FPS reali, giudizio di Ale sulla naturalezza professionale, riequilibrio generale, nuovi comandi touch speciali ancora proposta0.70. Non ampliare lo scopo da soli. Vincoli sempre<100calls/<150000tri su iPhone anche2cambi/replay,14corpi interi, logoC, camera unica diretta/SPEED1, controlli/carica0,9s correnti, riflesso soloalta, CAMBI basso centro44px. Nessuna nuova prova facciale. Browser `/tmp/pallanuoto-browsers`, una sola istanza pesante; rete localhost/git richiede il permesso dello strumento. Non aggiungere il symlink `node_modules`.


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
