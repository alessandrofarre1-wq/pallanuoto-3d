# WATERPOLO 7 (pallanuoto-3d) — memoria del progetto

Gioco di pallanuoto 3D nel browser, «una sorta di FIFA per la pallanuoto», giocato soprattutto da iPhone in orizzontale con i
comandi touch (anche tastiera e controller). Proprietario: Ale, ex nuotatore agonista, non programmatore: spiega le scelte in
italiano semplice, senza gergo tecnico; risposte brevi con cosa è cambiato e cosa provare; chiedi conferma prima di cambiamenti
grossi di direzione. Gli screenshot e i video di Ale sono la verità.

Questa memoria contiene solo regole e decisioni **in vigore** (versione attuale: v0.70). Il resto è in `docs/`:
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
  il caso bloccato e cinque immagini: guardare sempre i confronti in `tests/screenshot/confronto/`; aggiornare i riferimenti con
  `npm run verifica:aggiorna -- --partite=0` solo dopo averli controllati) e `npm run aspetto`. Nella descrizione gli esiti veri.
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
- Movimento e palla: `fisica.js` (nuoto, parata, muro, intercetto, presa, uscite), `palla.js` (Rapier), `fisica-palla/`.
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
- Replay del gol: 7,6 s saltabili (1,2 s diretta + 5,2 s replay + 1,2 s ripresa), motore fermo durante la clip; camera che gira di
  circa 35° attorno all'azione e scende, poi taglio con lampo sul primo piano a pelo d'acqua del marcatore che esulta (si alza e
  agita il pugno; 1,15 s registrati dopo la rete, 38% del replay; niente primo piano se è appena stato sostituito). Prova
  `npm run replay`.
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

## Stato v0.70
Implementati chiamate touch in azione, servizio alla boa chiaramente libera e raccordi soltanto visuali di tiro/passaggio. Rapporto `docs/versioni/v070-chiamate-servizio-gesti.md`; file e decisioni superate lì e in `docs/decisioni-superate.md`. Base di dipendenza v0.69 finale `ea469d2`, CI completa verde44906185448; ultimi aggiornamenti solo test/documenti, produzione invariata.

Prove browser concluse: sei scene A/B/C nei due versi, con scelta touch e due passaggi/presa reali; cinque annullamenti, controllo umano prioritario; quattro layout667/844 con margini0/47px ripetuti con HUD visibile PASS,44px senza sovrapposizione a CAMBI; foto ispezionate. Servizio boa:36scelte e quattro prese fisiche destro/mancino, rilascio0,18333s e presa0,5s. Dati/fase/hash in `docs/verifiche/v070/`: queste scene precedono l’ultimo percorso falloSenzaPalla ereditato dalla v0.69, che non coinvolgono. Gesti24casi a60Hz PASS con tracce fisiche identiche; salto ingresso mano polso0,12873→0m, tiro0,07051→0m, passaggio0,03696→0,01484m. Fixture isolata ispezionata, non partita intera né certificazione di naturalezza. Replay completo PASS,14corpi/picco48calls146426tri. Lint/build e regressioni9/9 PASS. Aspetto completo PASS gambe0/8282,0/4689,0/1113, iPhone55/142100. Due cambi PASS61/145944 (667px60/145942). SondaCPU N1:4×180s seed7919,ITA6–HUN8,508passaggi/37centro/36prese/9finestre(3prima6s), non confronto accoppiato o frequenza generale. Verifica immagini inizialeFAIL4/5, poi solo2riferimenti aggiornati dopo ispezione/confronto; ripetizione indipendente `verifica --partite=0` PASS(0,01/0,02/0,22%/identico/identico), Cronaca completa locale PASS dopo allineamento della fixture di rigore (contatto0,9m/vittima2,6m dalla porta, CPU isolata, assert conservati); prima CI070ba3e falliva su quella scena. CI070 intera sull’ultimo push ancora da verificare: non dichiarare pronta la PR né un nuovo bilanciamento generale.

Nuovi tasti touch per beduina/sciarpa/finte ancora proposta da discutere con Ale, non implementati. Restano giudizio di naturalezza/leggibilità e iPhone fisico; nessuna promessa di resa professionale. Nessun merge/deploy.

### Baseline v0.69
Correzioni regolamentari e prove mirate concluse in locale: espulsione residua attraverso intervallo/scatto (sei in campo; tempo dal primo tocco); rigori da contatto reale e occasione credibile entro6m, senza sanzione casuale all'anticipo battuto; tiro/rigore differito conservati alla sirena; boa CPU già fronteporta conclude in parità; fallo ordinario ferma solo autore/vittima, mentre gli altri proseguono e reagiscono alle posizioni aggiornate. Su fallo in attacco possesso/rientro cambiano subito. Arresto generale per gol/rigori/time-out/intervalli. File e decisioni superate nel rapporto `docs/versioni/v069-falli-e-riprese.md`.

Verifiche locali: mirate6/6, guardia fine-periodo3/3, regressioni12/14 al primo giro (due fallimenti risolti/verificati), ripetizione lint/tattica/replay3/3 e lint/tattica/gioco-fermo3/3 PASS; dopo l’ultimo allineamento di `falloSenzaPalla`, lint/gioco-fermo2/2 PASS con nuovo caso di cambio possesso e rientro. Le misure generali seguenti precedono quest’ultimo percorso (geometria invariata). Aspetto completo PASS: gambe0/8286,0/4686,0/1112; iPhone55calls/142100tri. Due cambi: picco61calls/145944tri nelle scene campionate. Replay prima dell'ultimo ritocco alle marcature:48/146426,14corpi. Verifica `--partite=0` PASS: cinque confronti ispezionati, scarto≤0,02%, nessun riferimento aggiornato; sei partite demandate alla CI finale sul commit pubblicato, ancora da verificare. Dati/hash/fasi in `docs/verifiche/v069/`.

Campione8gare ITA–HUN prima dell’ultimo allineamento di `falloSenzaPalla`:15,125gol/40,75tiri per squadra; rigori1,4375, espulsioni8,4375 (52,59%dal centro), superiorità37,04%, azioni69,25, parità14,09s. Solo6/15voci in fascia contro13/15della v0.68: le correzioni non certificano il bilanciamento globale; tiri alti, espulsioni/superiorità basse e azioni corte restano da rivedere. Nessun ritocco a potenza/precisione o probabilità globali per nascondere questi esiti. Prova su iPhone fisico e giudizio di Ale restano necessari.

Le richieste su chiamate touch, servizio alla boa e raccordi visuali passano al rapporto v0.70; i nuovi comandi touch dei tiri speciali restano una proposta. Nessun merge/deploy.

### Baseline v0.68
Chiusura21/11: i due blocchi della bozza PR59 sono corretti e misurati; esito CI sull'ultimo commit nella PR. Difesa dei cambi25scene e filmato reale24s:0s oltre metà contro46,85s prima. Arena6mesh/1024²,8296tri CPU; picco iPhone con due cambi64calls/148852tri, replay49/146682,14corpi. Aspetto finale PASS: gambe0/7123,0/5180,0/1179; iPhone56/142116.
Entrate:18scene ciclo reale,4D nei due versi/manoD-S con servizio/presa/tiro autonomi,2rinunce,8reset e2qualifiche PASS. D0,6–1,4m solo se l'endpoint legale arriva entro4,8m (20cm di margine d'arresto rispetto ai5m della ricezione); da ala larga si continua la circolazione, l'esterno conserva il suo spazio. Chiusura locale5/5mirate +isolate/integrazione/aspetto/verifica immagini PASS. Campione finale8gare: 14,56 gol / 35,44 tiri per squadra; conversione 41,09%, superiorità 48,28%, rigori 1,62; 13/15 voci in fascia. Non sono gli8incontri con mezze lunghe della prima diagnosi:16,875gol/39,31tiri e6/15voci. Dati/hash/limiti nel rapporto `docs/versioni/v068-cambi-entrate-arena.md`; fotografie `docs/immagini/v068-mezza-entrata.md`.
Restano azioni troppo numerose/corte, preparazione autonoma completa del falso centro, prova su iPhone fisico e giudizio artistico di Ale. Decisioni superate esplicite: inseguimento del cambio, posti fissi per indice, consegna annullata dopo5s, teletrasporto NPC sotto2m, cinque preset; inoltre taglioD sterile e copertura centrale superflua. Nessun merge/deploy. La tabella sotto conserva la baseline v0.67 di Claude su16partite, distinta dal nuovo campione.

## Numeri: gioco contro realtà
16 partite ITA–HUN, per squadra, v0.67 (`npm run taratura -- --partite=16`: con 8 partite il caso sposta le voci di qualche punto).
Riferimenti: Mondiali 2025, Mondiali 2009, Euro League, video della finale olimpica. La tabella completa (15 voci, con lo stato e i
numeri da guardare) la stampa `npm run taratura`.

| | gioco | reale |
|---|---|---|
| tiri | 33,5 | 33 |
| gol | 13,7 | 13,3 |
| tiri in gol | 40,9% | 40% |
| espulsioni | 11,4 | 11 (66% dal centroboa; in gioco 62%) |
| superiorità trasformate | 40,3% | 52% |
| rigori | 2,0 | 1,8 |
| azioni a partita | 66 | circa 50 |
| azione in parità: durata | 14,7 s | circa 21 s (con 30 s di possesso) |
| azione in parità: tiro sbagliato | 25,8% | circa 32% |
| azione in parità: palla persa | 19,4% | circa 20% |
| azione in parità: fallo in attacco | 12,8% | circa 15% |
| gol su entrata | 7,1% dei gol | pochi (in calo nel 2025) |
| controfughe | 1,5 a partita | circa 2 (Euro League) |
| tempo in scatto / sotto la soglia dei cambi | 20% / 14% | — |
| palla in mano prima del passaggio | 0,97 s | 0,6-1 s (finale olimpica) |

## Cosa resta da fare
- Gioco: azioni ancora corte (15 s invece di 21, 66 invece di 50): non dipende dagli scatti in ripartenza (v0.67), l'azione
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
