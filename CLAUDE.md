# WATERPOLO 7 (pallanuoto-3d) — memoria del progetto

Gioco di pallanuoto 3D nel browser, «una sorta di FIFA per la pallanuoto», giocato soprattutto da iPhone in orizzontale con i
comandi touch (anche tastiera e controller). Proprietario: Ale, ex nuotatore agonista, non programmatore: spiega le scelte in
italiano semplice, senza gergo tecnico; risposte brevi con cosa è cambiato e cosa provare; chiedi conferma prima di cambiamenti
grossi di direzione. Gli screenshot e i video di Ale sono la verità.

Questa memoria contiene solo regole e decisioni **in vigore** (versione di lavoro: v0.87). Il resto è in `docs/`:
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
  `--porta=` per girare in sottofondo), sonde in `strumenti/` (`sonda-tiri` anche per gesto, `sonda-tipi-passaggio`, `sonda-azioni`, `sonda-superiorita`, `sonda-entrate`, `sonda-scatti`,
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
- Energia del selezionato: «#N Cognome», barra e percentuale sempre visibili durante il gioco (v0.78, richiesta di Ale; riquadro su telefono 170 px, iPhone piccoli 152); posto/ruolo e statistiche restano temporanei. Vale in attacco e difesa, senza mostrare un pannello grande permanente.
- Replay del gol: 7,6 s saltabili (1,2 s diretta + 5,2 s replay + 1,2 s ripresa), motore fermo durante la clip; camera che gira di
  circa 35° attorno all'azione e scende, poi taglio con lampo sul primo piano a pelo d'acqua del marcatore che esulta (si alza e
  agita il pugno; 1,15 s registrati dopo la rete, 38% del replay; niente primo piano se è appena stato sostituito). Prova
  `npm run replay`. La camera misura il raggio grafico effettivo, mantiene almeno4pxCSS in azione e il viso del primo piano almeno2× rispetto all’azione, dentro la fascia libera. La scala cartoon comune di palla e corpi viene dalle proporzioni, non dal test del replay; FOV/orbita conservati.
- Menu: home con logo C «Flusso», Partita veloce, Mondiali, Europei, Comandi, Informazioni; Squadre (formazione dei 7, strategie
  prepartita: sei preset e una personale, schemi dell'uomo in più) → Impostazioni (durata, difficoltà, arbitro) → Gioca.
### Comandi
- Touch: levetta a sinistra; TIRO toccato e rilasciato = tiro rapido di polso, meno potente; tenuto = preparazione e finte continue, potenza massima in0,9s, tiro al rilascio anche durante la propria finta. Nessun tiro automatico normale e nessun minigioco di precisione. L’anello del selezionato diventa oro chiaro e il tasto indica PRONTO; nessuna barra sopra l’atleta o barra di potenza. Mira, stanchezza, pressione e abilità restano determinanti.
- PASSA; con la palla agli avversari lo stesso tasto diventa CONTRASTA (v0.78: scritta, icona a mano, rosa, «3° = fallo»): 1-2 tocchi in 1,5 s disturbano, il terzo ravvicinato è fallo. Tasti colorati per funzione su bordo e icona (TIRO arancione, PASSA blu, CONTRASTA rosa, PALOMB. viola, SPRINT verde, CAMBIA bianco), lontani da oro/rosso/ciano; premuto e azioni richieste restano oro; prova `npm run comandi-interfaccia`. SPRINT a tocchi, CAMBIA al più vicino alla palla. TAGLIO tolto dal touch su richiesta di Ale; chiamate A/B/C conservate. T.O. e pausa conservati. TIRO durante un passaggio in arrivo conserva il tiro al volo; alla boa spalle alla porta sceglie beduina/sciarpa dalla situazione. Procedura dei rigori conservata.
- Scelta del tiro e palombella v0.88 (Ale: «puoi anche togliere il tasto della palomba»; `controfuga.js`, `PALOMBELLA`, `SPECIALI`): dentro l'area (6 m) TIRO sceglie da solo il tipo di tiro: palombella con il portiere fuori dai pali (oltre 1,3 m dalla linea o 2,2 m di lato), se il tiratore non è di spalle; nella controfuga vera (v0.81, entro 9 s dal recupero, `QTE.eta`) colonnello con energia almeno 0,6 e schizzo almeno 0,35, solo con Precisione almeno 70; altrimenti il tiro normale (tocco = polso, tenuto = tiro potente e teso). La scritta sotto TIRO dice quale. Fuori area il tasto PALOMB. compare solo come tasto a comparsa (1,2 s, poi 2 s di pausa) con il portiere fuori dai pali e il tiratore in buona posizione (entro 10 m, entro 0,6 rad dal centro della porta, nessun avversario entro 1,6 m): premuto subito fa la palombella, non è detto che sia gol. Niente più tasto a comparsa per schizzo e colonnello. Stesse regole per il computer (fuori area 1,4 volte al secondo con l'occasione, più spesso con Visione alta; niente più palombelle a caso). Prova `npm run palombella`, sonda `npm run sonda-palombella`.
- Tastiera: frecce; Spazio/K stessa tenuta-finte-rilascio (K anche al volo in arrivo, Spazio tenuto prima della presa non tira da solo); D passaggio al rilascio/contrasto; L palombella (solo quando compare); Shift sprint a tocchi; C cambia; F comando avanzato taglio/girata/raddoppio conservato; Q/W/E o1/2/3 schemi,4 boa, T time-out,B cambio consigliato,P/Esc pausa. Controller con la stessa logica. Annullamenti per pausa/blur/touchcancel/perdita possesso o controllo; un tasto fisicamente ancora premuto dopo reset deve prima essere rilasciato.
### Nuoto e corpo (indicazioni di Ale, ex nuotatore)
- Tiro standard caricato/torsione v0.74: pose Plask di Ale trasferite sull’intera catena di52ossa, modello/rig/pesi invariati. Tutti gli altri gesti restano procedurali. Stile libero a testa alta, mai rana o stella; chi
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
- Centroboa con la palla (v0.81, Ale: «poche beduine»; `CENTRO_PALLA`): con il marcatore dietro o al fianco entro 1,8 m (la lotta)
  resta di spalle alla porta, anche quello del computer mentre scivola, e il suo tiro è una beduina o una sciarpa; si gira con la
  girata, nuotando o se il marcatore è davanti (anticipo) o lontano. Vale per le due squadre.
- Due modi di passare (v0.79, Ale; `tipoPassaggio`, `PASSAGGI`): morbido sull'acqua 0,3 m davanti al compagno (6,5-9 m/s, errore
  ×0,6) nella circolazione tranquilla con la linea libera; alto e teso alla mano (11-15,5 m/s) con l'uomo in più, negli ultimi 8 s,
  oltre 8 m, cambiando lato, in transizione, con un avversario vicino alla linea e al compagno libero in posizione di tiro. Presa alla mano (0,55 m, portiere 0,9 m); errore
  verosimile, mai grossi sbagli su passaggi semplici; al centroboa marcato la palla arriva morbida in acqua davanti a lui, a quello
  libero in mano; mai al proprio portiere in attacco. PASSA con la levetta va al compagno puntato (conta la direzione, `MIRA_PASSAGGIO`; niente precedenza
  al centroboa); con la levetta ancora nella direzione di mira chi riceve va incontro alla palla. Prova `npm run passaggi`. Nel passaggio di lato
  busto e testa girano verso il compagno e la mano non passa davanti al viso; chi riceve guarda la palla (solo disegno).
- Raccordi visuali v0.70 (`grafica/gesto-vista.js`): carica già raggiunta conservata, ingresso/uscita dalla posa precedente, curva continua al rilascio e filtro graduale. Stato solo visuale per atleta; giunture fisiche, punto/tempi del lancio e carica0,9s conservati. Nessuna nuova geometria.
- Chi nuota con la palla davanti alla testa, prima di tirare, passare o fintare la pesca dall'acqua e la porta di lato all'altezza
  della spalla (solo disegno, dentro i tempi del gesto).
- Avvio finta v0.77: tenuta umana dalla posa realmente in acqua alla posa caricata Plask in 0,70 s, con rotazioni locali e prima finta sovrapposta. Non comprimere l’intero prefisso registrato in 0,5 s. Originale/dati Plask integri, parte di rilascio conservata; tiri diretti/CPU sul percorso precedente. Cache invalidata con identità/tempo; annullamento dall’ultima posa. Solo disegno, controlli e tempi fisici invariati.
- Finte v0.76: almeno 0,16 s preparazione + 0,18 s accenno + 0,36 s recupero, ripetizione dopo il recupero. Durante la tenuta la base Plask resta continua, braccio additivo e torace limitato a 0,10 rad; niente spegnimento/riaccensione di tutto il corpo. Dita solidali alla mano. Massimo 0,9 s e rilascio durante finta/recupero conservati; sei stili personali (larga, a raffica, di polso, mezza, di bomba, di spalla) con un piccolo vantaggio sul
  seguito tipico; la finta di lato sposta difensore e portiere.
- Finte v0.85 (Ale: «vicino alla porta troppo veloci, vanno rallentate»; «avanti e indietro ma, più frequentemente, da destra verso
  sinistra; stretti e veloci o più ampi e lenti; braccio teso o piegato»): dopo ogni finta il gesto successivo (finta, tiro o passaggio)
  parte a braccio tornato carico più 0,2 s (`FINTA_RITMO`, video di Varga), per il computer e per la tenuta di TIRO; il rilascio di
  TIRO tira sempre subito. Verso, larghezza e braccio dal marchio di fabbrica del giocatore (v0.87, sotto); con la levetta il palo lo
  sceglie il giocatore. Larghezza (`FINTA_AMPIEZZA`) più stretta davanti alla porta: la stretta ha i tempi minimi della v0.76, l'ampia è
  più lenta in andata e ritorno (`a.recupero`). Braccio teso o piegato solo nel disegno (`FINTA_FORMA`). Prova `npm run finte`, sonda
  `npm run sonda-finte`, foglio `npm run finte-forme`; nelle prove e negli strumenti `window.__formaFinta` fissa larghezza, braccio e
  lato (0 avanti e indietro, 1 attraverso il corpo, −1 verso l'esterno).
- Finte v0.87 (Ale: «se la palla sta dietro la testa il palmo deve essere rivolto verso l'alto, come un vassoio; se la finta supera la
  testa e va in avanti si ruota il polso e il palmo va verso il basso con la palla attaccata»; «da destra verso sinistra e da sinistra
  verso destra, oppure avanti e indietro, per tutte le finte; sotto porta un po' più veloci»; «la finta è quasi un marchio di fabbrica
  dei giocatori»). MANO (solo disegno, `grafica/mano-finta.js`, `MANO_FINTA`): il palmo segue la mano rispetto alla testa, al cielo
  dietro, in avanti sopra (la palla tenuta della v0.55 resta com'era), in giù davanti con la palla attaccata sotto; vale per la finta
  del computer, per la palla tenuta e per la tenuta di TIRO e la carica del tiro (la posa Plask si corregge di 0,8 verso questo palmo).
  La palla disegnata sta sempre sul palmo. La finta del computer va avanti e torna alla carica, dove il braccio resta fino al gesto dopo
  (`p.fintaPronto`); la finta ampia della tenuta arriva al gesto intero del disegno (braccio 0,8 + 0,2 × larghezza). MARCHIO DI
  FABBRICA (`firmaFinta`, `versoFinta`, `FINTA_FIRMA`): dal suo id ogni giocatore ha un verso preferito (da destra verso sinistra 50
  giocatori su 100, avanti e indietro 30, da sinistra verso destra 20; ogni finta nel suo verso 70 volte su 100), la sua larghezza
  (stile ± 0,25; a ogni finta ± 0,1) e il suo braccio (85 volte su 100). Stile e marchio non dipendono dal numero di calottina. La
  scheda del giocatore mostra «Finta larga · da destra a sinistra · braccio teso». Prova `npm run finte-mano`, foglio `npm run
  finte-mano-foglio`.
- Portiere: segue il passaggio, para in base a posizione, Riflessi, stanchezza, sorpresa e muro; para meno dopo un cambio di lato,
  in superiorità, dopo una finta o su tiri vicini; mentre l'avversario carica sale a braccia larghe (solo disegno). Uscita v0.88
  (`USCITA_PORTIERE`): nella controfuga avversaria (nessun difensore davanti a chi porta palla, entro 9 s dal recupero e 9 m dalla
  porta) esce dai pali verso la palla di 1 m più 1,4 m × Uscita (la statistica, da 40 a 99), mai a meno di 1,6 m da chi porta palla;
  così lascia lo spazio alla palombella. Prima stava sempre a 0,7 m dalla linea.
- Portiere v0.71: il sorteggio decide il tentativo, non una presa senza contatto. Sagoma numerica condivisa con il disegno, sweep3D e reazione/velocità delle mani limitate; corpo/testa respingono, le prese ravvicinate richiedono la mano e sono rare. Stesse regole per le due squadre. Proporzioni v0.72: campo25×20m, porta3×0,90m e palla22,12cm nello stesso mondo. Scala delle giuntureVIS1,45→1,10: modello base2,547→1,932m in bind, profili individuali conservati. Sagoma/mani del portiere, palla sul palmo, ombra e contatto acqua seguono il corpo. Il punto fisico di lancio segue necessariamente la nuova altezza; tempi e velocità del tiro conservati.
- Traiettorie v0.71: palombella più tesa (CPU dopo una finta, nessun nuovo obbligo umano); forte alto verso le quadrelle con rotazione da tiro, mirino nominale coerente e suono sordo solo su urto reale palo/traversa. Rimbalzo mirato prima del portiere dalla fisica dell’acqua, solo con distanza/spazio adatti. Parametri in `TRAIETTORIE_TIRO`. Il corpo del portiere segue la stessa lettura delle mani, anche sui tiri deviati ancora in arrivo; aspetta la propria reazione e non anticipa il lato vero. Fattore rigore0,41→0,7 per la sola lettura, non per assegnare una parata:188/240gol nel controllo,78,3%; coefficienti globali di precisione/potenza conservati.
- Tiro classico v0.72: gambe asimmetriche con perno controlaterale e dominante arretrata, anche che anticipano il braccio, core e mano libera (spazzata→trazione), gomito alto. Solo disegno su ossa esistenti; posa fisica, polso/frusta e tempi conservati. Fonte Solum2008 nel rapporto; non è un riferimento regolamentare.
- Tiro Plask v0.74: `grafica/tiro-plask-vista` applica solo disegno dopo `muoviCorpo`/mani; piedi/punte e dita inclusi, assi calibrati, mancino speculare senza scala negativa. Originale6,917s integro nel ramo di consegna; i dati comprendono tutta la sequenza1/60–6,917s, esclusa solo la Tpose artificiale a0;415pose/52ossa. Dalla v0.77 nella tenuta umana si raccorda la posa in acqua alla carica senza attraversare accelerato il prefisso; parte registrata di rilascio conservata, percorso CPU/diretto precedente invariato. Solo tre ossa del braccio raccordate5,9–6,1s dove la mano esce dal video; rilascio originale non misurabile. Tempi fisici e carica0,9s conservati. Esultanza: palmo davanti e polso quasi neutro, nessun cambio al modello. Volto rimandato da Ale. Dettagli nel rapporto v0.74. Dalla v0.87 nella tenuta e nella carica il palmo della posa si corregge verso la regola della mano (finte v0.87).
### Attacco del computer
- Circolazione: palla in mano 0,4-0,7 s sul perimetro (`CIRCOLAZIONE`); costruzione di 18 s prima di cercare il tiro da libero,
  anche nella ripartenza alla pari (il tiro subito dopo la ricezione è sicuro solo nella controfuga con l'uomo in più); palla al
  centroboa nei duelli marginali dopo la costruzione (vantaggio che cresce dai 3 ai 9 s, `CENTRO_ATTESA`, più un vantaggio per l'ingresso classico con il marcatore dietro o al fianco, v0.81); una boa chiaramente libera con corridoio sicuro può essere servita subito (`SERVIZIO_BOA`); tiro subito dopo una ricezione libera
  deciso una volta (circa 1 su 3 in parità); le occasioni chiare (ricezione entro 5 m, di fronte alla porta, nessuno entro 2 m, linea
  libera) si tirano sempre, a qualunque secondo, anche in superiorità (v0.81, Ale; `OCCASIONE_CHIARA`); pazienza fino a fine azione
  (tiro di fine azione negli ultimi 4,5 s, `FINE_AZIONE`).
- Centroboa del computer nella lotta (v0.81, `CENTRO_PALLA`): ogni 0,45-0,85 s, dopo 0,4 s beduina o sciarpa (30%), dopo 0,6 s
  girata (15%), dopo 1,8 s scarico; girato verso la porta con il marcatore ancora nella lotta aspetta 0,45 s prima di tirare (se il
  marcatore rientra si torna alla lotta); girato e libero tira subito (decisione v0.69 conservata).
- Chiamate manuali v0.70: A3→2→5, B3→4→1 (mano/abilità adeguate), C2al palo, una per possesso. Il taglio parte al rilascio reale dell’appoggio; perdita/espulsione/scadenza annullano. Nessun cambio dello schema persistente o controllo forzato. PASSA neutro cerca appoggio chiamato, tagliante pronto, poi scelta assistita; una direzione manuale conserva la precedenza. Portiere, aiuti, linea2m e rischio reale restano nel servizio alla boa.
- La squadra sale per corsie, scaglionata per ruolo: nessuno va tutto sulla palla (richiesta di Ale).
- Recupero dopo slancio manuale: se il contrasto cambia possessore, si rilegge il comando umano invece di continuare verso il vecchio portatore; niente sfondamento causato da quel bersaglio ormai superato, nessuna immunità generale ai falli.
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
- Scambi nei rientri (v0.80, Ale: «ognuno guarda solo il proprio giocatore e nascono controfughe che non esisterebbero»;
  `scambiRientro`, `RIENTRO_SCAMBI`): con la palla a più di 9,2 m dalla porta, l'attaccante più avanti lo prende il difensore meglio
  piazzato se il suo marcatore è stato superato; chi scambia tiene l'uomo 2,5 s; il difensore comandato non prende uomini nuovi.
  Prova `npm run cambi-marcatura`, sonda `npm run sonda-rientri`.
- Accoppiamenti iniziali da `MARK`, con il marcatore specialista sul centro effettivo; consegne per identità conservate finché si riorganizza la difesa, senza ritorno automatico dopo5s in gioco vivo. Quando le regole ricollocano le squadre dopo gol/time-out o a inizio tempo, si ricostruiscono posti, marcature, riferimenti e memoria del cambio; nessun reset sui recuperi vivi. Pressing, zona e M scelgono chi lasciare sul perimetro usando i posti attuali. Un aiuto tardivo sul taglio può coprire temporaneamente a M o raddoppiare, conservando la scelta persistente del giocatore.
- Cambio volante AVVERSARIO (`difesa-cambi.js`): il difensore non segue l’uscente verso la panchina. Copre palla-centroboa/porta; due coperture si dividono centro e lato debole. Il sostituto si marca quando è davvero rientrato nella zona d’attacco (entro10,5m dalla porta), anche dopo la fine del percorso visuale. Pressing ripreso se selezionato, zona conservata; mai spostamenti del difensore comandato dal giocatore.
- Muro: braccio dalla parte del palo coperto in parità; con l'uomo in meno braccio a specchio del braccio di tiro e centrale tra i
  pali sul palo lungo; contro il 3-3 i due davanti ai pali stanno a metà tra il loro tiratore e il 6 e saltano su chi ha palla.
### Regole (World Aquatics 18 febbraio 2026; FIN 2026-27 non importato)
- Inizio di ogni tempo: scatta il giocatore di movimento disponibile con Velocità più alta, davanti al centro della propria porta; portiere temporaneamente laterale, rientro nuotato dal fischio. Countdown immobile, nessun bonus alle statistiche; input e CAMBIA del giocatore prevalgono sullo scatto assistito. Espulsioni e cambi reali conservati.
- Espulsione tra i tempi: residuo conservato, pozzetto durante lo scatto; tempo effettivo dal primo tocco. Fallo ordinario: fermi solo autore/vittima, tagli e controllo degli altri continuano; fallo in attacco cambia subito il possesso. Rigore su fallo effettivo entro6m e gol probabile; ricevere davanti al marcatore non basta. Tiro giàiniziato ostacolato da dietro: attenderne l’esito, senza cancellarlo alla fine del periodo.
- Campo 25 m, porta 3 × 0,90 m; linee 2, 5 e 6 m. Possesso 28 s, 18 s dopo espulsione, angolo, rigore senza cambio o rimbalzo
  ripreso dall'attacco; dopo un tiro respinto il cronometro resta fermo finché qualcuno riprende palla. Espulsione 18 s (rientro
  anticipato su gol o palla riconquistata), terzo fallo grave = fuori per il resto della partita (entra un sostituto); cambi
  illimitati.
- Rigore v0.84 (Ale; `RIGORE_TIRO`, `controfalloRigore`): la palla parte dall'acqua e il movimento è continuo: fermo a braccio carico
  oltre 0,5 s = controfallo, palla al portiere avversario (nella serie finale rigore sbagliato). Posizione iniziale v0.88 (Ale: «palla
  in acqua e braccio dietro la schiena con mano o sopra la palla o sotto»; `RIGORE_VISTA`, solo disegno): la palla galleggia dietro,
  dalla parte del braccio che tira, il braccio teso dietro la schiena con la mano sopra (60 giocatori su 100, abitudine fissa dall'id)
  o sotto la palla; la carica la porta su in un solo movimento fino al braccio caricato.
- Rigore dai 5 m con gli altri sulla linea dei 6 ad almeno 3 m dal tiratore; tiro libero: dentro i 6 m si passa, fuori si può
  tirare subito; area di porta (2 m, fino a 2 m oltre i pali): attaccante dentro l'area davanti alla linea della palla = fallo.
  I compagni che entrano troppo presto sotto i2m rientrano nuotando (v0.68), senza correzioni istantanee delle coordinate; il controllo di permanenza irregolare vale per tutti.
  Fuori dal fondo: angolo se tocca per ultimo il portiere o se lancia la squadra che difende; tiro murato da un difensore di
  movimento = rimessa del portiere; fuori di lato = tiro libero agli avversari di chi ha toccato per ultimo. Nessun tempo per
  superare la metà campo; passare indietro e al portiere è permesso; fallo per chi rinuncia apposta al possesso. Time-out 2 a
  squadra, solo in possesso, ripresa da metà campo; rigori finali nei tornei.
- Time-out v0.83 (Ale; `schieraTimeout`, `TIMEOUT`): alla ripresa la palla è al portiere a metà campo (nella propria metà), i compagni
  sono schierati ai posti d'attacco nella metà campo avversaria e i difensori sul loro uomo; il portiere passa al compagno libero e
  torna in porta nuotando. Il computer lo chiama dopo un break di tre gol subiti, dopo tre espulsioni in 2 minuti, all'inizio del 7
  contro 6, quando è stanco e nell'ultimo minuto e mezzo pari o sotto di un gol appena ripresa la palla.
- Arbitro: espulsioni dalla lotta al centro (crescono con l'azione; quota misurata nella sezione Stato), contrasto a tre livelli, sfondamento, vantaggio
  in controfuga, simulazione e interferenza sul tiro libero. Il semplice anticipo battuto al centroboa non è un fallo.
- Espulso che nuota al pozzetto e rientra solo da lì; cambio dal pozzetto senza «cinque»; cambi volanti con il cinque, immediati
  dopo gol, time-out e tra i tempi; il computer cambia chi scende sotto il 34%; consigli di cambio mai in difesa né nei primi 90 s.
- Cambi volanti v0.82 (Ale; `PANCHINA`, regole 2025 art. 18): zona dei cambi a 11 m dalla propria linea di porta, vicino alla metà
  campo; si cambia solo in transizione (palla da meno di 7 s o nella propria metà), mai ad attacco impostato né in difesa, per il
  giocatore e per il computer (che aspetta in coda); il sostituto appena entrato riceve la palla solo a 10,5 m dalla porta
  d'attacco (`sostitutoLontano`); a gioco fermo con i cambi liberi il computer cambia subito fino a due giocatori sotto il 45%.
### Grafica
- Un solo modello (il pallanuotista del concept di Ale, v2 con espressioni), colorato per squadra; aspetto dal database (pelle,
  capelli, barba, altezza, corporatura); calottine: squadra del giocatore bianca, computer blu scuro, portieri rossi; costumi con
  bandiera; numero sulla cuffia; niente loghi o stemmi.
- Acqua unica disegnata, colori sott’acqua per profondità, contatti e scie dal movimento vero; qualità automatica che abbassa e recupera la risoluzione; riflesso completo solo in qualità alta. Arena v0.68: sedute/pensilina/corrimani, panchine attrezzate, tavolo e ufficiali3D, porte con pontoni/giunti e rete leggibile anche da lontano. Un atlante1024² e le stesse6mesh statiche;8296tri CPU(+212). Acqua, camera e corpi conservati. Fotografie confrontabili e dati nel rapporto.
### Squadre, tornei, valutazioni
- 24 nazionali; giocatori veri dal database di Ale (`npm run rose-db`, metodo in `docs/riferimenti/valutazioni.md`), nomi veri
  autorizzati; statistiche 40-99 che cambiano davvero le prestazioni. Rose v0.86 (Ale): tutti i convocati della nazionale in almeno un
  torneo del database (nessuno escluso per ritiro), doppioni uniti; in partita 14 (regole World Aquatics 2026: 12 di movimento e 2
  portieri) scelti dal gioco: titolari i più forti nel ruolo, in panchina una riserva per ogni posto (`listaPartita`, anche secondi
  ruoli); nella schermata Squadre tutti i disponibili, scambio panchina ↔ altri, «Scelta automatica»; formazione e lista ricordate per
  nazionale (per id). Tornei: 15 convocati proposti dal gioco e scelti prima della prima partita (2-3 portieri), a ogni partita i 14 tra
  i convocati. Prova `npm run rose`.
- Valutazione della squadra v0.88 (Ale: «le valutazioni delle squadre dipendono dai giocatori che le compongono»; `ratingLista`): media
  dei 14 della partita come scendono in acqua, i 7 titolari con la valutazione nel loro posto e peso doppio; scegliere tra più giocatori
  non dà mai una squadra peggiore. Le valutazioni dei giocatori sono quelle del database (tolto il riporto al ranking della v0.86); il
  ranking (`forza`) resta per le fasce e le partite simulate dei tornei. Nella partita singola si sceglie la rosa (`ROSE_TORNEI`,
  `roseTornei`): tutti i disponibili o i convocati della Coppa del Mondo 2026, degli Europei 2026 o dei Mondiali 2025 (se ce ne sono
  almeno 9 con un portiere), ognuna con la sua valutazione; la scheda della squadra e il confronto usano la valutazione.
- Mondiali (24 disponibili, 16 estratte per fasce, la scelta di Ale sempre dentro) ed Europei (16), campagna salvata tra le gare,
  bacheca e premiazione.

## Stato v0.87 — finte: mano e marchio di fabbrica (Claude Code)

v0.87 (dopo la PR #69 con le versioni v0.78-v0.86, unita in `main` e pubblicata): Ale, guardando il foglio delle forme della finta,
ha chiesto il palmo al cielo con la palla dietro la testa e in giù davanti, le finte nei due sensi o avanti e indietro per tutte le finte,
e la finta come marchio di fabbrica di ogni giocatore. Fatto (regole sopra, finte v0.87; [rapporto](docs/versioni/v087-finte-mano.md)):
palmo che segue la mano (solo disegno, partita identica), ritorno della finta alla carica, verso/larghezza/braccio di ogni giocatore
(nel complesso 49% da destra verso sinistra, 19% da sinistra verso destra, 32% avanti e indietro nella sonda), scheda con la finta;
equilibrio della partita invariato (gol 19,4, Italia 13,3 e Ungheria 25,5).

Prima (stessa giornata, PR #69): ramo ripartito da `main` v0.77 (Codex, PR #59-#68). Ale (24/11/2026) ha mandato 13 punti. Fatti:
v0.78 interfaccia (CONTRASTA in difesa, tasti colorati, energia con il cognome; [rapporto](docs/versioni/v078-comandi-interfaccia.md));
v0.79 passaggi (morbido o teso, compagno puntato, levetta tenuta; [rapporto](docs/versioni/v079-passaggi.md)); v0.80 scambi di
marcatura nei rientri (controfughe 2,5 → 1,9, gol 20,8 → 19,5, superiorità 47% → 42%; [rapporto](docs/versioni/v080-cambi-marcatura.md));
v0.81 tiri (tasto speciale solo in controfuga vera e tocco/tenuta, centroboa di spalle con beduina e sciarpa, occasioni chiare
tirate subito, più palla al centroboa; espulsioni 7,8 → 9,8, gol 19,5 → 19,3; sonda nuova `npm run sonda-centro`;
[rapporto](docs/versioni/v081-tiri.md)); v0.82 cambi volanti (solo in transizione, zona vicino alla metà campo, niente palla a chi è
appena entrato lontano, cambi liberi del computer a gioco fermo; sonda `npm run sonda-cambi`;
[rapporto](docs/versioni/v082-cambi-volanti.md)); v0.83 time-out (palla al portiere a metà campo, squadra già schierata in attacco,
time-out del computer per l'attacco finale; [rapporto](docs/versioni/v083-timeout.md)); v0.84 rigore (palla dall'acqua, fermo a
braccio carico = controfallo; [rapporto](docs/versioni/v084-rigore.md)); v0.85 finte (gesto dopo la finta a braccio tornato carico,
0,50 → 1,05 s; di lato da destra verso sinistra 65 volte su 100; strette e veloci o ampie e lente; braccio teso o piegato; equilibrio
della partita invariato; [rapporto](docs/versioni/v085-finte.md)); v0.86 rose (tutti i disponibili, 14 in partita scelti per ruolo,
15 convocati nei tornei; [rapporto](docs/versioni/v086-rose.md)). I 13 punti di Ale del 24/11 sono fatti. Nelle prove computer contro
computer l'Ungheria segna più del doppio dell'Italia: nel database le valutazioni medie sono 84 contro 76 (forza del ranking).
Prossimo: il bilanciamento (sotto). Da riprendere: centroboa libero o con il marcatore in anticipo che riceve girato e segna (difesa).

**Bilanciamento da rifare** (16 partite ITA–HUN sulla v0.87, `npm run taratura -- --partite=16`): 19,4 gol e 40,1 tiri per squadra
(veri 13,3 e 33; Italia 13,3, Ungheria 25,5), tiri in gol 48,4% (40%), espulsioni 10,8 (11; dal centro 57%, vero 66%), superiorità
47% (52%), parità: gol 22,6% delle azioni (6-19%), espulsione procurata 16,8% (22%), durata 13,1 s (21), azioni 74 (50); 5 voci su 15
a posto. Crescita per gradi: v0.67 13,7 gol e 33,5 tiri (16
partite); Codex misurava 16,1 e 41,4 nella v0.70 e 17,4 e 43,3 nella v0.71 (8 partite, passaggio di consegne v0.71); v0.77 20,5 e
42,3, v0.80 19,5 e 40,3, v0.81 19,3 e 41,4, v0.82 20,2 e 41,0, v0.83-v0.84 19,1 e 39,0, v0.85 19,3 e 39,3, v0.86 19,4 e 39,1 (16 partite).

Stato precedente (v0.77, Codex): avvio fluido della finta, [rapporto](docs/versioni/v077-avvio-finta.md).
