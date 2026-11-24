# Passaggio WATERPOLO7 — v0.84 rigore (Claude Code)

Stesso ramo (`claude/gracious-rubin-rcvklk`), versione 0.84.0. Cambia la partita (controfallo del rigore) e il disegno del rigore.
- `RIGORE_TIRO.fermo` (0,5 s, `src/taratura.js`); in `partita.js`, nel rigore della partita e nella serie finale, `s.fermoRigore`
  conta i secondi a carica piena con TIRO tenuto: oltre la soglia `controfalloRigore(s)` (nuova, `src/regole.js`: palla al portiere
  avversario con `freeThrow`, `chiudiAzione('persa')`) o `concludiRigoreFinale(false,'controfallo')` (testo «Controfallo»).
- `src/grafica/pose.js` (solo disegno): con `game.penalty===p` e nessun gesto la mano va sulla palla in acqua (`BOA_ACQUA`,
  `T.pallaInAcqua`); `T.rigoreAcqua` imposta `p.davantiVista`/`p.pallaDavantiLocale` così la carica parte con la `PESCA` della v0.63.
- Prova nuova `npm run rigore` (anche nella CI; `--foto` salva le due immagini). [Rapporto](versioni/v084-rigore.md).

---

# Passaggio WATERPOLO7 — v0.83 time-out (Claude Code)

Stesso ramo (`claude/gracious-rubin-rcvklk`), versione 0.83.0. Cambia la partita (ripresa del time-out, time-out del computer).
- `schieraTimeout(t)` (`src/regole.js`, esportata), chiamata dalla callback del `timeout` dopo `placeHalves`: palla al portiere
  (o al più vicino alla metà campo se è espulso) a `-t.dir*0,4`, `freeThrow`; compagni su `attackTarget`; difensori a un metro dal
  loro uomo verso la propria porta (non `markTarget`, che con la palla a metà campo legge un rientro); `riallineaRiferimenti`.
- `TIMEOUT` (`src/taratura.js`): `finale` 90 s, `eta` 4 s, `recupero` 0,4. In `aiCarrier` (decisione periodica) il computer chiama
  il time-out nell'ultimo tempo, pari o sotto di uno, appena ripresa la palla; `t.timeoutFinale` (azzerato in `menu.js`).
- Prova nuova `npm run timeout` (anche nella CI). [Rapporto](versioni/v083-timeout.md).

---

# Passaggio WATERPOLO7 — v0.82 cambi volanti (Claude Code)

Stesso ramo (`claude/gracious-rubin-rcvklk`), versione 0.82.0. Cambia la partita (cambi volanti).
- `PANCHINA` (`src/taratura.js`): `distZona` 3,2 → 11 m, nuovi `ingresso` (8,5 m: dove compare il sostituto), `transizione` (7 s),
  `appena`/`zona` (10 s, 10,5 m), `stancoLibero`/`liberiMax` (0,45, 2).
- `momentoUtile` (`src/panchina.js`): oltre a «in attacco e lontano dalla palla», possesso da meno di `transizione` s o palla nella
  propria metà. `cambiDelComputer` mette in coda con `attesa`, come i cambi del giocatore (prima partiva subito, anche in difesa).
  Nuova `cambiLiberiDelComputer` chiamata da `aggiornaPanchina` quando i cambi sono liberi.
- `sostitutoLontano(p)` (`src/difesa-cambi.js`, stessa mappa `rientri` della copertura difensiva): `bestPassTarget` salta il
  sostituto appena entrato finché non è a `zona` m dalla porta d'attacco.
- Ganci: `window.__pallanuoto.panchina` espone anche `momentoUtile`, `zonaCambi`, `PANCHINA`. Sonda nuova `npm run sonda-cambi`;
  prova nuova `npm run cambi-volanti` (anche nella CI). [Rapporto](versioni/v082-cambi-volanti.md).

---

# Passaggio WATERPOLO7 — v0.81 tiri: controfuga vera, centroboa di spalle, occasioni chiare (Claude Code)

Stesso ramo (`claude/gracious-rubin-rcvklk`), versione 0.81.0. Cambia la partita (tiri e centroboa) e un comando (tasto a comparsa).
- `occasioneControfuga` (`src/controfuga.js`): solo entro `QTE.eta` (9 s) da `game.possT`. `QTE` è passato in `src/taratura.js`
  (riesportato da `controfuga.js` con lo stesso nome).
- `controllo.js`: con il tasto a comparsa acceso lo speciale parte al rilascio di un tocco (in `aggiornaTiroTenuto`, carica sotto
  `TIRO_POLSO`); tenuto resta il tiro normale. Prima `pressed('legacyShoot')` faceva subito lo speciale. Testi in `hud.js` e nella
  pagina Comandi.
- `leggiCentro` (`src/centroboa.js`) restituisce anche `addosso` (marcatore entro `CENTRO_PALLA.addosso` = 1,8 m e non davanti);
  `fisica.js` tiene di spalle alla porta il centroboa con la palla se `spalle||addosso` anche nel ramo dello scivolamento
  (`p.scivolaAI`), che prima lo girava sempre verso la porta; `shotKind` (`src/tiri.js`) dà beduina o sciarpa anche con `addosso`.
- `boaHold` (`src/lotta.js`): decisioni del computer da `CENTRO_PALLA`; girato con il marcatore entro 1,8 m aspetta
  `CENTRO_PALLA.girarsi` (0,45 s) prima del tiro «boa fronte porta». La decisione v0.69 (girato e libero tira) resta.
- `occasioneChiara` (`src/ia.js`, `OCCASIONE_CHIARA`): tiro subito dopo la ricezione, prima della scelta delle entrate; esclusa
  quando c'è un'occasione di controfuga vera.
- `bestPassTarget` (`src/tiri.js`): `CENTRO_ATTESA` 3-9 s e `CENTRO_ATTESA.ingresso` per il centroboa marcato dietro o al fianco.
- Ganci di misura in `window.__pallanuoto.prova`: `centroAttacco`, `boaFrontePorta`, `difensoreCentro`, `leggiCentro`,
  `occasioneControfuga`. Sonda nuova `npm run sonda-centro`; `sonda-rientri` conta anche i tasti con la regola del gioco.
- Prova nuova `npm run tiri-centro` (anche nella CI); `sezione4` con due controlli nuovi. [Rapporto](versioni/v081-tiri.md).

---

# Passaggio WATERPOLO7 — v0.80 cambi di marcatura nei rientri (Claude Code)

Stesso ramo (`claude/gracious-rubin-rcvklk`), versione 0.80.0. Cambia la partita (difesa nei rientri).
- `scambiRientro(t)` in `src/ia.js`, chiamata all'inizio di `aggiornaDifesa` prima di `cambioMarcatura`; numeri in `RIENTRO_SCAMBI`.
  Con la palla a più di 9,2 m dalla porta difesa (come `inRientro`) e nessuna espulsione: per gli attaccanti più avanti della palla, se il marcatore è
  superato (oltre 1,5 m più lontano dalla porta o a più di 5 m) e un altro difensore costa almeno 3 m meno, si scambiano gli uomini
  in `t.accoppiamenti.uomini` (come fanno le consegne). `p.scambiatoFino` tiene lo scambio 2,5 s (azzerato a inizio partita in
  `menu.js`); `t.scambiRientro` li conta. Il difensore comandato (`ctrl`) e chi rallenta il portatore non prendono uomini nuovi.
- Prova nuova `npm run cambi-marcatura` (anche nella CI); sonda `npm run sonda-rientri`.
- Misure (16 partite): gol 20,8 → 19,5, controfughe 2,5 → 1,9, superiorità 47% → 42% (da ritarare). Con la soglia a 6 m gli scambi
  entravano nell'attacco schierato e fallivano `chiamate-attacco`, `entrate-integrazione` e `sezione3`: la soglia è quella del
  rientro (9,2 m). [Rapporto](versioni/v080-cambi-marcatura.md).

---

# Passaggio WATERPOLO7 — v0.79 passaggi (Claude Code)

Stesso ramo della v0.78 (`claude/gracious-rubin-rcvklk`), versione 0.79.0. Cambia la partita (solo i passaggi).
- `tipoPassaggio(p,m,d)` in `src/tiri.js` e `PASSAGGI` in `src/taratura.js`: morbido sull'acqua 0,3 m davanti al compagno
  (6,5-9 m/s, errore ×0,6) nella circolazione tranquilla con la linea libera; teso come prima con l'uomo in più, ultimi 8 s, oltre
  8 m, cambio di lato, transizione (passatore a oltre 10 m dalla porta), avversario entro 0,9 m dalla linea, compagno libero in
  posizione di tiro (entro 6,5 m, nessuno entro 1,5 m). Al centroboa marcato: in acqua davanti a lui con la velocità del morbido;
  a quello libero in mano (v0.55). `tests/finta-v055.mjs`: la scena del tiro al volo ora ha il ricevente libero. `ball.tipoPassaggio` dice il tipo del passaggio in volo.
- `humanPassTarget`: conta la direzione (`MIRA_PASSAGGIO`, esposto anche in `window.__pallanuoto.prova`); tolta la precedenza al
  centroboa (`BOA_PREFERITO`): su 379 scene vere il 31% dei passaggi gli arrivava senza volerlo. Il PASSA neutro (chiamate,
  tagliante, scelta assistita) non cambia.
- `aiutoGuida` in `src/controllo.js`: con la levetta ancora nella direzione di mira (`ball.levettaMira`) chi riceve va incontro
  alla palla; va anche sul morbido caduto appena fuori portata.
- Prova nuova `npm run passaggi` (anche nella CI); sonda `npm run sonda-tipi-passaggio`; la sonda dei tiri conta il gesto
  (`window.__logTiri` ha `g` e `boa`). Equilibrio della partita uguale alla v0.77 (16 partite). [Rapporto](versioni/v079-passaggi.md).

---

# Passaggio WATERPOLO7 — v0.78 comandi e interfaccia (Claude Code)

Base `main` `7527d46` (PR #68 unita). Ramo `claude/gracious-rubin-rcvklk`, versione 0.78.0. Ale ha mandato 13 punti dopo la v0.77;
questa versione fa solo i due sull'interfaccia: la partita non cambia (posizioni identiche nelle immagini della verifica).
- PASSA → CONTRASTA con la palla agli avversari: classe `in-difesa` sul body (`src/hud.js`); in `index.html` le parti
  `.et-passa/.et-contrasta` e `.ic-passa/.ic-contrasta`; stesso comando di prima.
- Colori dei tasti con la variabile `--tb-c` per `data-b` (`src/stile.css`): TIRO #ff8a1f, PASSA #6d86ff, CONTRASTA #ff7cc8,
  PALOMB. #c7a0ff, SPRINT #4fe393, CAMBIA #e9eef5; oro, rosso e ciano restano riservati come prima.
- Energia: `#stamNome` (`#stamNumero` + `#stamCognome`) al posto di `.energia-label`; riquadro su telefono 170 px (iPhone piccoli 152).
- Prova nuova `npm run comandi-interfaccia`, anche nella CI.
- Riferimenti delle immagini rifatti sulla macchina di Claude Code: il gioco usa i caratteri di sistema (`system-ui`), diversi tra
  le due macchine, quindi in locale le immagini possono differire solo per il tipo di carattere. Guardare le posizioni.
- Misura di partenza v0.77 (16 partite ITA–HUN, `npm run taratura -- --partite=16`): 20,5 gol e 42,3 tiri per squadra, 48,3% in
  gol; gol per tipo: perimetro 28%, centroboa 27%, entrata 20%, superiorità 17%, rigore 8%; controfughe 2,9 a partita (v0.67: 1,5).
- Prossime versioni di Claude Code, nell'ordine: passaggi, tiri, cambi di marcatura, cambi volanti, time-out, rigore, finte, rose.
  [Rapporto](versioni/v078-comandi-interfaccia.md).

---

# Passaggio WATERPOLO7 — v0.77 avvio della finta

Base main `7218d09`, PR67 unita e CI45246753540 verde. Ramo `codex/v077-avvio-finta`, workspace `/workspace/pallanuoto-v077`, versione0.77.0. Prima di proseguire riallineare main/PR/CI/diff; preservare Claude e i worktree precedenti. Nessun merge/deploy.

Il nuovo video mostra un tratto iniziale ancora accelerato. Ora raccordo dalla posa realmente disegnata in acqua alla posa caricata Plask in0,70s, prima finta sovrapposta; gerarchia locale coerente anche su dita/polso. **Decisione superata:** non riprodurre più il prefisso registrato5,9s in0,5s prima delle finte. Originale e dati415pose/52ossa integri, rilascio registrato conservato; percorso CPU/diretto precedente invariato. Non ripristinare la vecchia compressione per sostenere che tutta la preparazione venga attraversata nella tenuta.

Nessun cambio a GLB/rig/pesi/viso/nuoto. Controlli, massimo0,9s, prima finta0,45s e cadenza0,16+0,18+0,36s conservati. Rilascio durante l’ingresso immediato; cache per atleta invalidata da identità/tempo, annullamento dall’ultima posa.

Test ora include primi1,2s e4rilasci a0,4s:24scene,120→0violazioni,48cicli/28rilasci PASS,8pose iniziali ispezionate, soglie invariate. [Rapporto](versioni/v077-avvio-finta.md), [prove con fasi/costi](verifiche/v077/README.md). Esito CI completa dell’ultimo SHA nella PR. Non dichiarare qualità professionale o FPS misurati su iPhone. Limiti <100call/<150000tri anche2cambi/replay,14corpi, logoC/camera unica/SPEED1/CAMBI basso44px e riflessoalta conservati. Nessun nuovo bilanciamento o prova facciale; sei gare standard solo nella CI finale, una Chromium pesante alla volta.

---

# Passaggio WATERPOLO7 — v0.76 finta fluida

Base main6b0d2b9, PR66 unita e CI45200501806 verde. Ramo `codex/v076-finta-fluida`, workspace `/workspace/pallanuoto-v076`, versione0.76.0. Prima di proseguire riallineare GitHub e diff; preservare Claude. Nessun merge/deploy.

Corretti finta troppo rapida e avvitamento dei video: recupero visuale completo, tempi minimi0,16+0,18+0,36s e ripetizione dopo la chiusura. Plask rimane base continua durante la tenuta; braccio dominante additivo, torace limitato0,10rad, dita solidali. Non cambiare GLB/rig/pesi/volto/nuoto o clip integrale di Ale. Massimo0,9s e tiro al rilascio anche nel recupero conservati.

24scene/48cicli:120→0violazioni,24rilasci reali; dati/fasi e8pose nel [rapporto](versioni/v076-finta-fluida.md) e nelle [verifiche](verifiche/v076/README.md). Esito CI e SHA finale nella PR. Non vendere i test come qualità professionale o FPS di un iPhone. Meno100call/150000tri anche2cambi/replay,14corpi; logoC/camera unica/SPEED1/CAMBI basso e riflessoalta conservati. Nessuna nuova taratura estesa, nessun lavoro sul viso. Sei gare standard nella sola CI finale, una Chromium pesante alla volta.

---

# Passaggio WATERPOLO7 — v0.75 tiro continuo, scatto e boa

Base main1ec69ca(PR65 unita, CI45058084563 verde), ramo `codex/v075-tiro-fintee-anello`, worktree `/workspace/pallanuoto-v075`, versione0.75.0. Prima di altro lavoro riallineare main/PR/CI e diff; preservare tutto. Non fare merge/deploy. La PR riporta lo SHA e l’esito finale; non riaprire il vecchio lavoro v068–v074.

TIRO tocco/rilascio=polso; tenuta=preparazione e finte continue, massimo0,9s e tiro al rilascio anche dalla propria finta. Un solo contesto per touch/tastiera/controller e annullamenti robusti; anello oro/PRONTO senza barra di potenza. Controfuga speciale e rigori conservati. Alla boa gesto secondo assetto, anche su ricezione; TAGLIO tolto dal touch, chiamate A/B/C conservate. Scatto: più veloce disponibile al centro della porta; GK laterale prima del via e rientro nuotato. Nessun bonus o teletrasporto dopo il via; controllo umano prioritario. Rubata da slancio: corretto il bersaglio vecchio che causava subito sfondamento, senza immunità ai falli.

**Nuoto e modello invariati**: la foto a L segnalata da Ale era un errore del test (60passi fisici e un solo aggiornamento del rig). Corretto il test e rifatte le foto; non alterare il crawl per replicare quella cattura sbagliata. GLB SHA2568fd658a8… invariato; clip Plask completa415pose/52ossa, volto/rig/pesi conservati. Nessuna nuova prova facciale.

PrimaCI45069119661 sullo SHA b5aae8d:6partite PASS, poi arresto sul vecchio assert del controllato al kickoff in entrate-integrazione. Corretto soltanto il test, regressione locale PASS; runtime invariato. Nuova CI completa necessaria per terminare i passi saltati; l’idea di un solo giro standard è superata da questo arresto. Esito finale nella PR.

SecondaCI45070404033: integrazionePASS,6gare identiche108gol/257tiri; poi errore del foglio inferiorità (ctrl3 residuo anche in autoplay annullava la carica). Corretta solo fixture con selezionato nullo e precondizione carica effettiva. Runtime invariato; coda9passi locale prima della CI finale per evitare altri controlli saltati. La PR riporta la CI finale, le due precedenti non sono verdi.

Coda locale8/9PASS: Pausa nel test cronaca era visibile, ma locator.tap attendeva la stabilità sul RAF finto. Corretto solo test con visibilità/hit espliciti e tocco touchscreen reale; bloccoA ripristinato, nessun force/clickJS. Riprova completa cronaca PASS; con gli8PASS precedenti, tutti9i controlli della coda sono verificati. Lint/diff-check PASS, runtime sempre invariato. CI completa finale nelle verifiche/PR.

Leggere [CLAUDE.md](../CLAUDE.md), [rapporto](versioni/v075-tiro-scatto-boa.md), [verifiche](verifiche/v075/README.md) e [decisioni superate](decisioni-superate.md). Misure con fase esplicita: non attribuire il primo13/13 o le foto precedenti al codice finale. Sei partite soltanto nella CI; confronto locale0partite. Una sola Chromium pesante. Limiti iPhone<100call/<150000tri sempre,14corpi completi, logoC, camera/SPEED1, CAMBI centro basso44px, riflessoalta. Restano giudizio di Ale, iPhone fisico e bilanciamento generale già aperto. Nessun nuovo sviluppo artistico in questa consegna.

---

# Passaggio WATERPOLO7 — v0.74 tiro Plask, modello invariato

Base main `9e95c00` (PR64 unita, CI45014844635 verde), ramo `codex/v074-tiro-plask`, worktree `/workspace/pallanuoto-v074`. Versione0.74.0. Prima di altro lavoro riallineare main/PR/CI e diff; preservare Claude. Esito CI finale e SHA nella PR, nessun merge/deploy.

**Ultima istruzione di Ale:** il modello è già corretto e non va stravolto. Correggere la mano rovesciata applicando bene le pose; il viso si vedrà dopo. Questo supera il vecchio incarico di aggiungere ossa a viso/piedi. Non riaprire il prototipo facciale `/workspace/pallanuoto-v073`, non toccare mesh/rig/pesi/proporzioni. GLB runtime SHA256 `8fd658a8a89ad0dd242100133daf920eb6cfa492af8f39e95f6ff92124ba6745`, identico alla v0.73.

Il tiro fornito da Ale è trasferito su tutte le52ossa corrispondenti, incluse30falangi/caviglie/punte;415pose dall’inizio animato1/60s alla fine6,917s. Solo Tpose artificiale a0 esclusa; traslazione radice adattata alla vasca, nessun salto/spostamento sul campo. Controller solo visuale dopo `muoviCorpo` e mani. Calibrazione anatomica/rest, D/S senza scala negativa, tempi dei comandi conservati. Tiro standard caricato/torsione; gesti rapidi/speciali non convertiti. Tre ossa del braccio destro raccordate5,9–6,1s per perdita tracking fuori dal video; non inventare distacco o fattore slowmotion. OriginaleSHA41c8bebc… e videoSHAfc44fb47… nei dati generati. Originale integrale sul [ramo di consegna](https://github.com/alessandrofarre1-wq/pallanuoto-3d/tree/655a30fa6236de6edc78190134b6b2e812370b86/animazioni/tiro-plask-01); video locale, non pubblicato.

PrimaCI45053104867 sullo SHA02d0a0d:34comandiPASS,FAILgomito in carica(142,42°). Corretta soltanto l’ancora `loadEnd`5,8→5,9s della stessa clip; prova gestiPASS109,94°D/S, assert55–115°/polso/torsione conservati. Nessuna modifica al rig. Esiti finali nellaPR.

La mano alzata dell’esultanza usa ora il palmo trasversale davanti e polso quasi neutro. Test60campioni/due direzioni, foto confrontate; nessuna modifica al file della mano. Tutte le giunture/palla del motore conservate: confronto fisico4casiD/S×dueversi identico,rilascio175,031ms,errore0. Prove, foto e numeri finali con fase in [rapporto](versioni/v074-tiro-plask.md) e [verifiche](verifiche/v074/README.md). Non attribuire al finale i numeri dei prototipi parziali o quelli che usavano solo2,117s: superati.

Vincoli invariati: iPhone<100draw/<150000tri anche2cambi/replay,14corpi completi; logoC,cameraunica,SPEED1,controlli/carica0,9s/rilascio,riflessoalta,CAMBI basso centro44px. Non fare nuove partite di bilancio: modifica visuale verificata con tracce fisiche accoppiate. Sei partite standard una volta nellaCI completa finale; localeprove mirate/verifica immagini0partite/aspetto. Una solaChrome pesante. Nessuna nuova prova o modifica facciale. Restano giudizio di Ale sulla naturalezza, iPhone fisico e bilanciamento già aperto.

---

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
