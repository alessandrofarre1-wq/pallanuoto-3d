# WATERPOLO 7 (pallanuoto-3d) — memoria del progetto

Gioco di pallanuoto 3D nel browser, «una sorta di FIFA per la pallanuoto», giocato soprattutto da iPhone in orizzontale con i
comandi touch (anche tastiera e controller). Proprietario: Ale, ex nuotatore agonista, non programmatore: spiega le scelte in
italiano semplice, senza gergo tecnico; risposte brevi con cosa è cambiato e cosa provare; chiedi conferma prima di cambiamenti
grossi di direzione. Gli screenshot e i video di Ale sono la verità.

Questa memoria contiene solo regole e decisioni **in vigore** (versione di lavoro: v0.73). Il resto è in `docs/`:
- `docs/storia.md`: tutta la storia versione per versione (fino alla v0.61 il testo originale della vecchia memoria, 213 KB);
- `docs/decisioni-superate.md`: com'era e cosa vale ora, per ogni decisione cambiata;
- `docs/versioni/`: il rapporto di ogni versione; `docs/riferimenti/`: tattica, tecnica, fisica, valutazioni, ecc.;
- `docs/README.md`: l'indice; `docs/PASSAGGIO-CLAUDE-CODE.md` e `docs/PASSAGGIO-CODEX.md`: consegne tra Claude Code e Codex.

## Come lavorare
- **Prima di ogni sviluppo**: Ale lavora anche con Codex. Scaricare `main` e i rami `codex/*`, leggere le PR aperte e il codice
  ATTUALE dei file coinvolti; se il codice non corrisponde a questa memoria, dirlo ad Ale. Non rompere il lavoro di Codex.
- **Versioni e PR**: ogni PR alza la versione di 0,01 (`npm version 0.xx.0 --no-git-tag-version`: `package.json` e lock sono
  l'unica fonte, il gioco la mostra in home e in pausa) e ha il titolo «v0.xx: …». Ogni PR: rapporto in `docs/versioni/`, una voce
  in cima a «Versioni dopo il riordino» in `docs/storia.md` (richiesta di Ale, cambiamenti, file, numeri misurati, decisioni
  superate, verifiche, non fatto) e aggiornamento qui delle sezioni toccate; ogni decisione cambiata va segnalata nella PR e in
  `docs/decisioni-superate.md`.
- **Prima della PR**: `npm run lint`, `npm run prove` (gli stessi passi della CI in locale), `npm run verifica` (sei partite con
  il caso bloccato e cinque immagini: guardare sempre i confronti in `tests/screenshot/confronto/`; le sei partite si possono eseguire una sola volta nella CI finale, usando `--partite=0` per il confronto locale; aggiornare i riferimenti con
  `npm run verifica:aggiorna -- --partite=0` solo dopo averli controllati) e `npm run aspetto`. Se gioco/gambe sono già PASS nella stessa build con `prove`, `aspetto -- --no-build --solo-foto` completa le sei viste senza duplicare la partita. Nella descrizione gli esiti veri.
- **Limiti iPhone vincolanti**: meno di 100 oggetti disegnati e meno di 150.000 triangoli per fotogramma, anche durante cambi e
  replay. Se una modifica li supera, chiedere ad Ale prima di tenerla. Da qui non si misurano gli FPS di un iPhone vero: conta il
  contatore di Ale (`?fps` o menu Opzioni).
- **Caso**: nel gioco solo `rnd` (`costanti.js`); nella grafica `rndGrafica`; mai `Math.random`.
- **Solo disegno**: i ritocchi visivi vanno nello strato visuale (`posturaVista`, `articolaVista`, `p.Jv` in `grafica/pose.js`);
  le giunture del gioco `p.J` decidono `p.ballW`, il punto da cui parte la palla di chi la tiene. Per dimostrare che la partita
  non cambia: `node tests/aspetto.mjs <cartella> --dist=<build di prima> --salva=prima.json`, poi
  `npm run aspetto -- <cartella> --confronta=prima.json`.
- **Numeri**: quelli del bilanciamento stanno in `src/taratura.js` con il valore reale accanto (`npm run taratura` stampa gioco
  contro realtà); quelli della palla in `src/fisica-palla/parametri.js` con la fonte. Effetti d'acqua solo da `evento(...)` in
  `grafica/acqua-eventi.js` (con i `LIMITI`); ogni materiale che va in acqua passa da `sottAcqua()`.
- **Misurare prima di correggere**: `npm run taratura` (8 partite ITA–HUN tre alla volta, gioco contro realtà; `--salva=` e
  `--confronta=` per il prima e dopo), `npm run bilancio` (`--partite=8 --squadre=ITA,HUN --paralleli=3`, anche `--dist=` e
  `--porta=` per girare in sottofondo), sonde in `strumenti/` (`sonda-tiri`, `sonda-azioni`, `sonda-superiorita`, `sonda-entrate`, `sonda-scatti`,
  `misura-azione-v053`, `sonda-passaggi`, `sonda-ripartenza`, `foglio-tiro-v061`). Tra due giri da 8 partite c'è qualche punto di variazione:
  per decidere su differenze di pochi punti servono 16 partite (`--partite=16`) o più campioni (le sonde, `--squadre=ESP,HUN`). Per i movimenti
  `npm run primi-piani` (primi piani e sequenze), `npm run gesti`, `npm run gesti-foglio` (otto gesti da tre lati in sei momenti,
  con misure di gomiti, mani, gambe e compenetrazioni) e i fogli in `strumenti/` (`finte-foglio`, `lotta-foglio`).
- **Prove nel browser** (Playwright, Chromium senza scheda grafica): il `requestAnimationFrame` è finto, quindi ogni
  `waitForFunction` vuole `{timeout:60000,polling:100}`; con il tempo finto la cattura della pagina può bloccarsi: le foto si
  prendono dalla tela (`__ridisegna()` + `toDataURL`); un gol in una scena fa partire il replay che congela il gioco
  (`replay.interrompiReplay()`); per escludere i contrasti del computer azzerare `tackleCD` e `colpi`; se la difesa tocca palla
  l'espulso rientra subito dal pozzetto (9.3c): nelle scene con l'uomo in meno va tenuto fuori a ogni fotogramma; `cp -r dist
  cartella` su una cartella esistente copia dentro; un processo lanciato con `&` dentro un comando viene chiuso a fine comando
  (usare l'esecuzione in sottofondo dello strumento).
- **Video di Ale**: `ffprobe` per durata e risoluzione, `ffmpeg -vf "fps=4,crop=…,scale=…,tile=…"` in una cartella dello
  scratchpad, poi ingrandimenti a 8-15 fotogrammi al secondo dei momenti chiave; le registrazioni a 60 fps permettono di misurare
  tempi e velocità. YouTube da qui non si scarica: chiedere registrazioni dello schermo. WebFetch non raggiunge i siti delle
  regole, `curl` sì.
- **Ambiente**: npm funziona, cdnjs no; Blender si usa come modulo Python (`pip install bpy`) per i modelli
  (`strumenti/blender/`). Per le espressioni del viso Ale ha chiesto di non aggiungere né eseguire prove se non lo chiede lui.

## Mappa del codice (`src/`)
- Partita e regole: `partita.js` (ciclo di gioco), `regole.js` (falli, espulsioni, rigori, possesso, `giveBall`), `stato.js`,
  `costanti.js`, `statistiche.js` (contatori ed esiti delle azioni), `gioco-fermo.js`, `pozzetto.js`, `panchina.js`.
- Numeri del bilanciamento: `taratura.js` (con i riferimenti reali; `ia.js`, `fisica.js`, `lotta.js`, `regole.js`, `tiri.js`,
  `partita.js`, `finte.js` e `panchina.js` li importano e li riesportano con lo stesso nome).
- Movimento e palla: `fisica.js` (nuoto, parata, muro, intercetto, presa, uscite), `palla.js` (Rapier), `fisica-palla/`; `contatto-portiere.js`/`parata-portiere.js`/`decisione-parata.js` e `deviazione-tiro.js`; `profili-traiettorie.js`.
- Computer: `ia.js` (attacco `aiCarrier`, posti, marcature, difese, ripartenza), `entrate.js`, `chiamate-attacco.js`, `difesa-cambi.js`, `lotta.js` (centroboa), `centroboa.js`,
  `tiri.js` (gesti, tiri, passaggi), `finte.js`, `muro.js`, `controfuga.js`, `uomo-in-piu.js` e `schemi.js`.
- Comandi: `input.js`, `controllo.js`. Interfaccia: `hud.js`, `cronaca.js`, `menu.js`, `panchinaVista.js`, `tattiche-*.js`,
  `uomo-editor.js`, `replay*.js`, `tornei.js`, `rigoriFinali.js`, `index.html`, `stile.css`.
- Grafica (`grafica/`): `scena.js`, `pose.js` (giunture e gesti), `corpo.js` (ossa del modello), `modello.js`, `espressioni.js`,
  `replay.js` e `replay-camera.js`, `sottacqua.js`, `acqua-eventi.js`, `arena.js`, `costumi.js`, `render.js`, `qualita.js`.
- Dati: `dati/squadre.json`, `dati/rose-db.json` (da `npm run rose-db`), `dati/bandiere.js`.

## Decisioni in vigore
### Piattaforma, schermo, interfaccia
- Browser, grafica 3D solo Cartoon, avversario il computer, stile simulazione. Partita solo in orizzontale (in verticale «Ruota il
  dispositivo», gioco fermo); il menu si usa anche in verticale. Margini sicuri per notch e barre di Safari.
- Regia unica da ripresa TV (alta, di lato, verso la porta dove si gioca, più larga in ripartenza); ritmo unico (SPEED 1).
- HUD: tabellone in alto a sinistra con gli espulsi (nome e tempo) sotto; giocatore, schemi e cambi a destra; pannello del
  giocatore solo per 3 s dopo un cambio manuale e a inizio partita; CAMBI in basso al centro solo con un consiglio urgente o un
  cambio in corso (area di tocco 44 px); registro degli eventi dal menu di pausa; notifiche in stile telecronaca ai margini, mai al
  centro (`cronaca.js`); colori con significato fisso (oro = tu e azioni richieste, rosso = sanzioni e urgenza, ciano = servizio).
- Chiamate in parità: dopo5,5s dal possesso (compreso il viaggio), se la boa non è davvero servibile, scelte touch A/B/C in basso al centro. Una scelta le nasconde; area44px, CAMBI rapido conservato; pausa nasconde le proposte. Il testo indica appoggio e avanzamento; i passaggi restano manuali.
- Energia del selezionato: barra e percentuale sempre visibili durante il gioco; nome/ruolo restano temporanei. Vale in attacco e difesa, senza mostrare un pannello grande permanente.
- Replay del gol: 7,6 s saltabili (1,2 s diretta + 5,2 s replay + 1,2 s ripresa), motore fermo durante la clip; camera che gira di
  circa 35° attorno all'azione e scende, poi taglio con lampo sul primo piano a pelo d'acqua del marcatore che esulta (si alza e
  agita il pugno; 1,15 s registrati dopo la rete, 38% del replay; niente primo piano se è appena stato sostituito). Prova
  `npm run replay`. La camera misura il raggio grafico effettivo, mantiene almeno4pxCSS in azione e il viso del primo piano almeno2× rispetto all’azione, dentro la fascia libera. La scala cartoon comune di palla e corpi viene dalle proporzioni, non dal test del replay; FOV/orbita conservati.
- Menu: home con logo C «Flusso», Partita veloce, Mondiali, Europei, Comandi, Informazioni; Squadre (formazione dei 7, strategie
  prepartita: sei preset e una personale, schemi dell'uomo in più) → Impostazioni (durata, difficoltà, arbitro) → Gioca.
### Comandi
- Touch: levetta a sinistra; TIRO: tocco (< 0,16 s) = finta ripetibile, tenuto fino a 0,36 s = polso, più a lungo = tiro caricato
  (pieno in 0,9 s, parte al rilascio); un tocco mentre arriva un passaggio = tiro al volo. PASSA; in difesa = contrasto (1-2 tocchi
  in 1,5 s disturbano, il terzo ravvicinato è fallo). SPRINT a tocchi ripetuti. CAMBIA va al compagno più vicino alla palla.
  TAGLIO (taglio, girata, raddoppio), PALOMB. solo con la palla nostra, T.O., pausa. In controfuga TIRO si illumina: schizzo oltre
  5,5 m, colonnello più vicino. Con la levetta ferma il ricevente comandato va incontro alla palla; finta di lato con la levetta.
- Tastiera: frecce; Spazio (tocco = finta, tenuto = carica, rilascio = tiro); D passaggio (contrasto in difesa); K tiro e L
  palombella; Shift sprint a tocchi; C cambia; F taglio/girata/raddoppio; Q/W/E o 1/2/3 schemi, 4 schema «boa» (in
  superiorità torna al 4-2); T time-out; B cambio consigliato; P o Esc pausa. Controller con la stessa logica.
### Nuoto e corpo (indicazioni di Ale, ex nuotatore)
- Tutti i movimenti sono costruiti sulle ossa (niente animazioni registrate). Stile libero a testa alta, mai rana o stella; chi
  porta palla la spinge davanti alla testa. Da fermi acqua alle spalle, corpo comunque inclinato (bacino e gambe indietro, di più
  per chi marca; dritto a gioco fermo); in nuotata corpo orizzontale appena sotto la superficie con onda «a serpente».
- Alzata in 0,25 s, distensione poco di più, transizioni sempre continue; controllo preciso con una piccola inerzia; il corpo si
  piega nelle curve (testa e spalle guidano, bacino e gambe seguono); bicicletta da fermi; braccia morbide, mai «a cavalletta».
- Corpi e palla non si compenetrano; gambe mai fuori dall'acqua (bacino disegnato al massimo 22 cm sotto il pelo, 16 nel tiro da
  fuori). Stanchezza al massimo −18% di velocità, con la palla −7%; il pressing stanca 0,008 al secondo (`PRESSING_CONSUMO`).
### Gesti: tiro, passaggio, finta, portiere
- Tiro (tesi Patumi): 20-25 m/s al rilascio, frusta 166-189 ms, gomito 147-157°, il classico è il più preciso; nel tiro da fuori
  il corpo esce quasi fino ai fianchi (solo disegno). Palla tenuta alta, mano dietro la palla, gomito in fuori; rilascio come
  accompagnamento; con un avversario vicino si protegge la palla girando busto e testa; il centroboa marcato tiene la palla in acqua
  finché non fa un gesto. Mancini con i gesti allo specchio.
- Passaggi alti e tesi (11-15,5 m/s); presa alla mano (0,55 m, portiere 0,9 m); errore verosimile, mai grossi sbagli su passaggi
  semplici; al centroboa marcato la palla arriva in acqua davanti a lui; mai al proprio portiere in attacco. Nel passaggio di lato
  busto e testa girano verso il compagno e la mano non passa davanti al viso; chi riceve guarda la palla (solo disegno).
- Raccordi visuali v0.70 (`grafica/gesto-vista.js`): carica già raggiunta conservata, ingresso/uscita dalla posa precedente, curva continua al rilascio e filtro graduale. Stato solo visuale per atleta; giunture fisiche, punto/tempi del lancio e carica0,9s conservati. Nessuna nuova geometria.
- Chi nuota con la palla davanti alla testa, prima di tirare, passare o fintare la pesca dall'acqua e la porta di lato all'altezza
  della spalla (solo disegno, dentro i tempi del gesto).
- Finte: un tocco; sei stili personali (larga, a raffica, di polso, mezza, di bomba, di spalla) con un piccolo vantaggio sul
  seguito tipico; dalla seconda finta il braccio va di lato e sposta difensore e portiere.
- Portiere: segue il passaggio, para in base a posizione, Riflessi, stanchezza, sorpresa e muro; para meno dopo un cambio di lato,
  in superiorità, dopo una finta o su tiri vicini; mentre l'avversario carica sale a braccia larghe (solo disegno).
- Portiere v0.71: il sorteggio decide il tentativo, non una presa senza contatto. Sagoma numerica condivisa con il disegno, sweep3D e reazione/velocità delle mani limitate; corpo/testa respingono, le prese ravvicinate richiedono la mano e sono rare. Stesse regole per le due squadre. Proporzioni v0.72: campo25×20m, porta3×0,90m e palla22,12cm nello stesso mondo. Scala delle giuntureVIS1,45→1,10: modello base2,547→1,932m in bind, profili individuali conservati. Sagoma/mani del portiere, palla sul palmo, ombra e contatto acqua seguono il corpo. Il punto fisico di lancio segue necessariamente la nuova altezza; tempi e velocità del tiro conservati.
- Traiettorie v0.71: palombella più tesa (CPU dopo una finta, nessun nuovo obbligo umano); forte alto verso le quadrelle con rotazione da tiro, mirino nominale coerente e suono sordo solo su urto reale palo/traversa. Rimbalzo mirato prima del portiere dalla fisica dell’acqua, solo con distanza/spazio adatti. Parametri in `TRAIETTORIE_TIRO`. Il corpo del portiere segue la stessa lettura delle mani, anche sui tiri deviati ancora in arrivo; aspetta la propria reazione e non anticipa il lato vero. Fattore rigore0,41→0,7 per la sola lettura, non per assegnare una parata:188/240gol nel controllo,78,3%; coefficienti globali di precisione/potenza conservati.
- Tiro classico v0.72: gambe asimmetriche con perno controlaterale e dominante arretrata, anche che anticipano il braccio, core e mano libera (spazzata→trazione), gomito alto. Solo disegno su ossa esistenti; posa fisica, polso/frusta e tempi conservati. Fonte Solum2008 nel rapporto; non è un riferimento regolamentare.
### Attacco del computer
- Circolazione: palla in mano 0,4-0,7 s sul perimetro (`CIRCOLAZIONE`); costruzione di 18 s prima di cercare il tiro da libero,
  anche nella ripartenza alla pari (il tiro subito dopo la ricezione è sicuro solo nella controfuga con l'uomo in più); palla al
  centroboa nei duelli marginali dopo la costruzione (vantaggio che cresce dai 7 ai 15 s, `CENTRO_ATTESA`); una boa chiaramente libera con corridoio sicuro può essere servita subito (`SERVIZIO_BOA`); tiro subito dopo una ricezione libera
  deciso una volta (circa 1 su 3 in parità); pazienza fino a fine azione (tiro di fine azione negli ultimi 4,5 s, `FINE_AZIONE`).
- Chiamate manuali v0.70: A3→2→5, B3→4→1 (mano/abilità adeguate), C2al palo, una per possesso. Il taglio parte al rilascio reale dell’appoggio; perdita/espulsione/scadenza annullano. Nessun cambio dello schema persistente o controllo forzato. PASSA neutro cerca appoggio chiamato, tagliante pronto, poi scelta assistita; una direzione manuale conserva la precedenza. Portiere, aiuti, linea2m e rischio reale restano nel servizio alla boa.
- La squadra sale per corsie, scaglionata per ruolo: nessuno va tutto sulla palla (richiesta di Ale).
- Ripartenza dopo ogni recupero: partono tutti subito verso i posti, ma scatta solo chi può guadagnare un vantaggio (non è dietro
  al difensore più vicino o non ha nessuno entro 3 m); in rientro scatta solo chi ha il suo uomo più vicino alla porta (`SCATTI`,
  scelta di Ale v0.67); nelle transizioni niente scatto automatico da lontano; aperture del portiere («base» e «apertura2»);
  controfuga organizzata in corsie.
- Superiorità: schemi a fasi (libreria di 10, il giocatore ne sceglie 3; il computer usa i tre di partenza e «Uscita del 6»),
  «quick» in 3 superiorità su 10, tiro al volo dopo il cambio di lato; occasioni chiare dai 7 s (prima solo subito dopo un cambio
  di lato); chi vede poca porta (l'ala sui 2 metri) non tira al volo e passa a chi ne vede di più (`SUPERIORITA`).
- Entrate (`ENTRATA`): il computer, nell'8% delle azioni in parità, manda in entrata un mezzo (lo schema del giocatore resta il
  suo); al massimo un'entrata automatica ogni 12 s; a chi entra la palla arriva solo a meno di 5 m dalla porta e con almeno 1 m di vantaggio
  sul difensore (o 2 m di spazio), e chi riceve così tira subito; con l'uomo in più o in meno l'entrata finisce.
- Entrate reattive v0.68 (`entrate.js`): contro pressing stretto3→2→taglio verso5, specchio3→4→1 con mano/abilità adeguate,2 al palo e mezze entrate1/5 solo con testa avanti e marcatore vicino poco reattivo. Il taglio parte al rilascio reale dell’appoggio; il portatore sceglie fra entrante libero, ala che sale3,25m se il suo difensore stringe, oppure circolazione. A/B/C dopo almeno6s e2passaggi, senza interrompere la controfuga; dopo fallo recente si può partire subito. Resta pausa12s fra entrate automatiche; comandi manuali conservati. Vale anche dopo un fallo e la sua ripresa. Niente premio automatico al gol o al rigore.
- Atleta, posto e accoppiamento sono distinti: `occupantiAttacco`/`postoAttacco`, `centroAttacco`, `accoppiamenti.uomini`. Dopo il taglio si coprono i posti nuotando; alla perdita palla si rientra dalle coordinate raggiunte. Preset **Falso centro**: non specialista al centro, uscita per trascinare il marcatore forte, attesa del corridoio e subentro della boa vera. La CPU legge una disposizione/situazione già presente; non costruisce da zero la preparazione del falso centro. Lo schema salvato non cambia. HUD con posto attuale e #calotta distinta.
### Difesa
- Accoppiamenti iniziali da `MARK`, con il marcatore specialista sul centro effettivo; consegne per identità conservate finché si riorganizza la difesa, senza ritorno automatico dopo5s in gioco vivo. Quando le regole ricollocano le squadre dopo gol/time-out o a inizio tempo, si ricostruiscono posti, marcature, riferimenti e memoria del cambio; nessun reset sui recuperi vivi. Pressing, zona e M scelgono chi lasciare sul perimetro usando i posti attuali. Un aiuto tardivo sul taglio può coprire temporaneamente a M o raddoppiare, conservando la scelta persistente del giocatore.
- Cambio volante AVVERSARIO (`difesa-cambi.js`): il difensore non segue l’uscente verso la panchina. Copre palla-centroboa/porta; due coperture si dividono centro e lato debole. Il sostituto si marca quando è davvero rientrato nella zona d’attacco (entro10,5m dalla porta), anche dopo la fine del percorso visuale. Pressing ripreso se selezionato, zona conservata; mai spostamenti del difensore comandato dal giocatore.
- Muro: braccio dalla parte del palo coperto in parità; con l'uomo in meno braccio a specchio del braccio di tiro e centrale tra i
  pali sul palo lungo; contro il 3-3 i due davanti ai pali stanno a metà tra il loro tiratore e il 6 e saltano su chi ha palla.
### Regole (World Aquatics 18 febbraio 2026; FIN 2026-27 non importato)
- Espulsione tra i tempi: residuo conservato, pozzetto durante lo scatto; tempo effettivo dal primo tocco. Fallo ordinario: fermi solo autore/vittima, tagli e controllo degli altri continuano; fallo in attacco cambia subito il possesso. Rigore su fallo effettivo entro6m e gol probabile; ricevere davanti al marcatore non basta. Tiro giàiniziato ostacolato da dietro: attenderne l’esito, senza cancellarlo alla fine del periodo.
- Campo 25 m, porta 3 × 0,90 m; linee 2, 5 e 6 m. Possesso 28 s, 18 s dopo espulsione, angolo, rigore senza cambio o rimbalzo
  ripreso dall'attacco; dopo un tiro respinto il cronometro resta fermo finché qualcuno riprende palla. Espulsione 18 s (rientro
  anticipato su gol o palla riconquistata), terzo fallo grave = fuori per il resto della partita (entra un sostituto); cambi
  illimitati.
- Rigore dai 5 m con gli altri sulla linea dei 6 ad almeno 3 m dal tiratore; tiro libero: dentro i 6 m si passa, fuori si può
  tirare subito; area di porta (2 m, fino a 2 m oltre i pali): attaccante dentro l'area davanti alla linea della palla = fallo.
  I compagni che entrano troppo presto sotto i2m rientrano nuotando (v0.68), senza correzioni istantanee delle coordinate; il controllo di permanenza irregolare vale per tutti.
  Fuori dal fondo: angolo se tocca per ultimo il portiere o se lancia la squadra che difende; tiro murato da un difensore di
  movimento = rimessa del portiere; fuori di lato = tiro libero agli avversari di chi ha toccato per ultimo. Nessun tempo per
  superare la metà campo; passare indietro e al portiere è permesso; fallo per chi rinuncia apposta al possesso. Time-out 2 a
  squadra, solo in possesso, ripresa da metà campo; rigori finali nei tornei.
- Arbitro: espulsioni dalla lotta al centro (crescono con l'azione; quota misurata nella sezione Stato), contrasto a tre livelli, sfondamento, vantaggio
  in controfuga, simulazione e interferenza sul tiro libero. Il semplice anticipo battuto al centroboa non è un fallo.
- Espulso che nuota al pozzetto e rientra solo da lì; cambio dal pozzetto senza «cinque»; cambi volanti con il cinque, immediati
  dopo gol, time-out e tra i tempi; il computer cambia chi scende sotto il 34%; consigli di cambio mai in difesa né nei primi 90 s.
### Grafica
- Un solo modello (il pallanuotista del concept di Ale, v2 con espressioni), colorato per squadra; aspetto dal database (pelle,
  capelli, barba, altezza, corporatura); calottine: squadra del giocatore bianca, computer blu scuro, portieri rossi; costumi con
  bandiera; numero sulla cuffia; niente loghi o stemmi.
- Acqua unica disegnata, colori sott’acqua per profondità, contatti e scie dal movimento vero; qualità automatica che abbassa e recupera la risoluzione; riflesso completo solo in qualità alta. Arena v0.68: sedute/pensilina/corrimani, panchine attrezzate, tavolo e ufficiali3D, porte con pontoni/giunti e rete leggibile anche da lontano. Un atlante1024² e le stesse6mesh statiche;8296tri CPU(+212). Acqua, camera e corpi conservati. Fotografie confrontabili e dati nel rapporto.
### Squadre, tornei, valutazioni
- 24 nazionali; rose vere dal database di Ale (`npm run rose-db`, metodo in `docs/riferimenti/valutazioni.md`), nomi veri
  autorizzati; statistiche 40-99 che cambiano davvero le prestazioni; formazione ricordata per nazionale.
- Mondiali (24 disponibili, 16 estratte per fasce, la scelta di Ale sempre dentro) ed Europei (16), campagna salvata tra le gare,
  bacheca e premiazione.

## Stato v0.73 — mani e polsi

Base main `1452f1a` (PR #63 v0.72 unita, CI `45001334329` riuscita). Dopo aver fermato il tentativo sul volto, Ale ha chiesto di conservare mani, polsi e movimenti validi. Il ramo `codex/v073-mani-polsi` integra soltanto mani/polsi: volto, 18 morph e controller delle espressioni restano quelli pubblicati nella v0.72. Il prototipo facciale locale `/workspace/pallanuoto-v073` è sospeso e non fa parte della PR.

File: `grafica/mani`, collegamenti in `corpo`/`pose`, modello GLB/configurazione/riserva, registrazione delle nuove falangi in `grafica/replay`; builder, fonti CC0, prova indipendente del rig e adattamento del test costumi ai conteggi ufficiali. Modello con 54 joint (24 originali e 30 falangi), 8366 triangoli e 8599 vertici; un'unica primitiva/materiale. Le 24 rest e inversebind originali sono conservate. Cinque dita indipendenti, polso assottigliato e raccordato; marker di presa misurati. Controller soltanto visuale: nessuna modifica a `computePose`, `J`, `ballW`, regole o IA. Nuoto e tiro v0.72 restano in vigore.

Decisione cambiata: il modello del concept mantiene corpo e volto, ma usa ora mani anatomiche MakeHuman CC0. Il replay registra soltanto la rotazione delle nuove falangi, con posizione/scala/visibilità locali costanti, per conservare il limite storico di 24 MiB. Misura completa finale: replay 22.009.580 byte, massimo 49 chiamate/136.678 triangoli. Due cambi simultanei: 66 chiamate/138.686 triangoli, 14 corpi completi. Il GLB cresce da 1.101.624 a 4.523.896 byte: nessuna misura di caricamento su rete mobile. Locale: lint PASS; prove 54/54 PASS; verifica immagini finale PASS (partite=0); aspetto completo PASS in due parti sulla stessa build, sei viste ispezionate e gambe fuori 0/7684, 0/5144, 0/1200. Sei partite standard soltanto nella CI finale; esito dello SHA pubblicato nella PR. Numeri finali, file e provenienza nel [rapporto v0.73](docs/versioni/v073-mani-polsi.md).

Non fatto: nuovo volto/rig facciale (sospeso da Ale), clip Plask importate, FPS su iPhone fisico, nuova revisione generale dei movimenti o del bilanciamento. Il GLB Plask consegnato rimane separato. Nessun merge o deploy.

## Stato v0.72 — proporzioni, tiro e rimesse

Base main `7827854` (PR62 v0.71 unita, CI main verde44991043277). Richiesta nuova di Ale: palla piccola rispetto ai corpi, articolo sul tiro e rimessa laterale dopo deviazione del portiere. Nessun ritorno ai vecchi checkpoint.

File: `scala-grafica`/`costanti`, `grafica/dimensioni-palla`/`render`, `grafica/pose`/`corpo`/`tiro-vista`; `regole.sideOut`; prove di proporzioni, tiro e rimesse; package/lock/CI. Modello GLB esistente:24joints con skin e pesi su9023vertici; gomiti/polsi/bacino/gambe già presenti. Non serve conversioneFBX/Mixamo.

Decisioni cambiate esplicite: VIS1,45 (modello2,547m) →1,10 (base1,932m): si ridimensionano gli atleti rispetto al campo, non si ingrandisce la palla. Campo25×20m, porta3×0,90m, palla22,12cm conservati; sagomaGK, punti fisici di lancio e supporti visuali adeguati. La vecchia decisione di mantenere VIS e ballW assoluto è superata esplicitamente; computePose e durata/velocità del gesto restano invariati. Bicicletta simmetrica durante tiro classico → appoggio asimmetrico e catena anche/core. Rimessa laterale dedotta dal lanciatore → ultimo tocco reale, compresa eccezione del muro su tiro (WA12.3.1.1); dopo deviazioneGK l’attacco conserva palla18s. Fondo: corner dopoGK, rimessaGK dopo muro di movimento. Sui rigori la potenza non forza sempre la quadrella alta: bersagli naturali alti/bassi, mirino coerente, stessa precisione/velocità/lettura0,7. Dalla regressione237/240(98,8%) a190/240(79,17%) nel nuovo controllo reale; soglia70–86% conservata. In azione il forte resta alle quadrelle. Schema di partita, controlli e potenza/precisione globali conservati.

Misure finali:66chiamate/148150tri anche due cambi,14corpi completi; proporzioni statiche63/142160,22,12cm e porte3×0,90m; gambe0/7684,0/5144,0/1200; rigori190/240=79,17%, stessa precisione/potenza/lettura. Misure e verifiche della chiusura sono nel [rapporto v0.72](docs/versioni/v072-proporzioni-tiro-rimesse.md), con fase/provenienza dei dati; esito CI dell’ultimo SHA nella PR. La decal cuffia7×7 conserva il corpoGLB e risparmia60triangoli per atleta; precarica del torace29,46° dopo correzione rilevata dal test, soglia25° conservata. Non fatto: nuovi gesti speciali, bilanciamento generale già aperto nella v0.71, FPS su iPhone fisico e giudizio di Ale sulla naturalezza. Nessuna nuova prova facciale, nessun merge/deploy.

### Baseline unite
V0.70 (PR61, chiamate/boa/raccordi), v0.69 (PR60, regole e continuità sui falli) e v0.68 (PR59, cambi/entrate/arena) sono unite. Rapporti, risultati e limiti restano in `docs/versioni/v068-*`, `v069-*`, `v070-*` e nei rispettivi `docs/verifiche/`; non ripartire dai vecchi checkpoint. La v0.71 è unita con PR62; la v0.72 parte da main `7827854` e conserva quei sistemi. I nuovi tasti touch speciali sono ancora una proposta da discutere, non implementati.

## Numeri: gioco contro realtà — baseline v0.71
Questi sono dati storici della v0.71, non misure della nuova scala v0.72. Confronto finale8+8gare ITA–HUN, tempi480s/stessi semi: gol16,125→17,375,tiri41,375→43,250,conversione38,97→40,17%,parate17,500→19,188,rigori1,750→1,688. **Solo4/15voci in fascia contro5/15: bilanciamento aperto.** Superiorità40,32→32,09%;Italia11,750→10,625,Ungheria20,500→24,125: divario cresciuto, non nasconderlo con precisione/potenza. Azioni71,38, parità13,67s,mano1,012s,palla sola max0,0333s. Dati e limiti nel rapporto v0.71 e `bilancio-finale.json`. Il candidato precedente15,375gol/23,13%superiorità è superato e archiviato con fase distinta. Non sono una certificazione contro l’utente umano o tutte le nazionali.

## Cosa resta da fare
- GLB Plask separato con mani corrette consegnato. Ale ha poi autorizzato una derivazione leggera per il gioco: mani/polsi v0.73. Il successivo tentativo di rifare il volto è stato sospeso perché artisticamente inadeguato; nessun nuovo volto in questa PR.
- Gioco: conclusione in superiorità e divario ITA–HUN peggiorati nel campione v0.71 (numeri sopra), da diagnosticare con una sonda dedicata; azioni ancora corte (13,67s invece di21,71,38 invece di50): non dipende dagli scatti in ripartenza (v0.67), l'azione
  finisce presto per palle perse, espulsioni e falli; superiorità al 40% (reale 52%), da ritarare con i difensori meno stanchi
  (v0.67); il contatto costa 0,02 di stamina al secondo, più dello scatto; falli fischiati saliti a 35 per squadra a partita
  con i difensori meno stanchi (v0.66: 28; nella v0.28 circa 30): manca un riferimento reale; pali forse troppi (13% dei tiri con
  l'uomo in più, 9% in parità: mira a 0,85-1,23 m dal centro della porta); il blocco del compagno sul difensore di chi entra
  non riesce mai; difesa adattata agli schemi dell'uomo in più; aiuto al posto per i difensori comandati con l'uomo in meno;
  7 contro 6 chiamabile dal giocatore.
- Gesti: giudizio di Ale sui fogli della v0.63 (passaggio di lato, ricezione, pesca della palla, esultanza); muro e parata a
  braccio del tutto teso; corpo in nuotata con la palla forse troppo inclinato (da confrontare con un video).
- Riordino: prove con nomi per argomento (oggi si chiamano con la versione in cui sono nate); semplificare `aiCarrier`.
- Da Ale: prova su iPhone (FPS, sensazioni), giudizi sulla naturalezza, nuovi video, scelta dei tasti per comandi nuovi.

## Fonti
- Regolamento World Aquatics (febbraio 2026) e modifiche 2025; FIN 2025-26 come confronto; tesi Patumi (PoliTo) sul tiro; de
  Mestre 2004 sulla palla in acqua; Results Report dei Mondiali 2025; Lupo et al. (Mondiali 2009, Euro League); manuali FIN e USA
  Water Polo; wpdworld.com (`docs/riferimenti/tattica.md`, `tecnica.md`); riferimento visivo Water Polo Revolution
  (ericflorio.itch.io). Indirizzi completi nella storia.
