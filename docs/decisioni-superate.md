# Decisioni superate

Ogni riga dice com'era prima e cosa vale dopo, dalla versione più recente. Le regole in vigore sono in `CLAUDE.md`; il contesto
completo di ogni versione è in `docs/storia.md` e, dalla v0.46, nei rapporti in `docs/versioni/`.

## v0.80
- Nei rientri nessuno scambio di marcatura (ognuno inseguiva il suo uomo, `cambioMarcatura` solo sui tagli dell'attacco schierato)
  → l'attaccante più avanti lo prende il difensore meglio piazzato quando il suo marcatore è stato superato (`RIENTRO_SCAMBI`).

## v0.79
- Passaggi sempre alti e tesi alla mano (v0.55) → due modi: morbido sull'acqua vicino al compagno (circolazione tranquilla con la
  linea libera) o alto e teso (uomo in più, ultimi 8 s, oltre 8 m, cambio di lato, transizione, avversario vicino alla linea,
  compagno libero in posizione di tiro). Resta della v0.55: al centroboa libero in mano, a quello marcato in acqua.
- Palla al centroboa marcato in acqua a 0,8 volte la velocità del teso → con la velocità del morbido.
- Scelta del compagno con la levetta: direzione ×4, distanza −0,07 al metro, +0,5 con la linea libera, precedenza al centroboa
  (+1,2 entro 60° verso la porta, v0.55) → conta la direzione; la distanza decide solo gli spareggi; nessun premio.
- Con la levetta tenuta dopo il passaggio chi riceve nuotava nella direzione della levetta → va incontro alla palla finché la
  levetta resta nella direzione usata per mirare.

## v0.78
- Tasto PASSA sempre uguale, con «contrasto» scritto in piccolo → con la palla agli avversari diventa CONTRASTA (scritta, icona,
  colore); con la palla nostra o libera resta PASSA, senza scritta sotto.
- Tasti bianchi (TIRO e PASSA chiari, gli altri scuri) → bordo e icona con un colore per funzione; l'oro resta per «premuto» e
  per le azioni richieste.
- Energia «Energia #N, barra, %» (su iPhone piccoli la scritta spariva) → «#N Cognome, barra, %»; riquadro su telefono 148 → 170 px
  (iPhone piccoli 118 → 152).

## v0.77

- Quasi5,9s di preparazione Plask compressi nei primi0,5s di tenuta → raccordo0,70s dalla posa reale in acqua alla posa caricata, prima finta sovrapposta. Le415pose originali non sono alterate, ma il prefisso non viene più interamente riprodotto durante la tenuta. Rilascio registrato e percorso CPU/diretto conservati.
- Ingresso dal procedurale corrente a ogni frame, in spazio mondo → posa precedente memorizzata e raccordo delle catene in spazio locale, comprese dita/polso; annullamento dall’ultima posa disegnata.
- Misure soltanto dopo piena carica → anche primi1,2s/73campioni, più4rilasci precoci a0,4s. Soglie precedenti conservate.
- Nessun cambio a modello/rig/pesi/viso/nuoto, controlli, tempi fisici, potenza o cadenza delle finte.

## v0.76

- Finta visibile soltanto fino a done → recupero completo nel disegno, ritorno alla stessa carica.
- Accenno in0,09s e preparazioni anche da0,04s → minimo0,16s di preparazione e0,18s di accenno;0,36s di recupero conservati, ripetizione successiva dopo la chiusura.
- Spegnimento Plask e ritorno alla carica di tutto il corpo → base registrata continua nella tenuta, movimento additivo del braccio e torace limitato. Falangi solidali alla mano.
- Nessun cambiamento a modello/rig/pesi/volto o clip integrale, massimo0,9s e tiro al rilascio anche durante il recupero restano in vigore.

## v0.75

- Tocco TIRO = finta e lunga attesa nella carica → tocco/rilascio = polso, tenuta = finte continue e preparazione, rilascio = tiro. Massimo0,9s conservato; nessuna precisione assegnata da una barra oscillante.
- Barra di potenza e percentuale → anello del selezionato e PRONTO nel tasto; stamina sempre visibile, niente indicatore sopra il tiratore.
- Scattista fissato per indice e portiere già in porta → più veloce disponibile al centro porta, portiere temporaneamente laterale e rientro nuotato. Nessun bonus o teletrasporto dopo il via.
- Beduina/sciarpa/rovesciata scelte contando i tiri precedenti → beduina o sciarpa secondo assetto e lato del marcatore; ricezione al volo usa la stessa lettura. Tiro frontale normale conservato.
- Dopo rubata nello slancio manuale il vettore continuava verso il vecchio possessore e poteva causare subito sfondamento → rilegge il comando umano quando cambia holder; regole generali conservate.
- TAGLIO nel touch → pulsante rimosso; chiamate A/B/C conservate. Nessun nuovo gesto dedicato aggiunto.
- Foto dello scatto con soli spostamenti aggiornati → rig aggiornato a ogni fotogramma anche nel test; catture precedenti a1s non valide per giudicare la postura. Animazione di nuoto runtime invariata.

## v0.74

- Solo animazioni procedurali → tiro standard caricato/torsione dalla registrazione Plask di Ale, su tutte le52ossa corrispondenti e sul modello esistente. Gli altri gesti restano procedurali. Il prototipo che trasferiva solo torso/braccia e quello che usava solo gli ultimi2,117s sono superati e non vengono pubblicati: si usano tutte le415pose animate, esclusa soltanto la Tpose artificiale a0.
- Richiesta precedente di aggiungere ossa a viso/piedi → ultima istruzione: conservare il modello, correggere l’applicazione delle pose e rimandare il volto. Nessuna mesh/skin/rig modificata; caviglie/punte già disponibili e ora animate dalla clip.
- Carica agganciata al campione5,8s ancora disteso(142,42° nella sonda) → carica a5,9s prima della frusta(109,94° nella sonda). Soglia55–115° e pose originali conservate; nuova regressione dell’ancora.
- Riferimento del palmo dell’esultanza quasi parallelo all’avambraccio alzato → riferimento frontale trasversale e polso quasi neutro. Correzione della posa, nessuna inversione del modello.
- Larghezza testa sulla proiezione delloZ del campo → larghezza negli assi anatomici, in metri, per non contare anche la profondità quando la testa gira. Soglie delle proporzioni e contatto palmo conservate.

Fonte, intervallo effettivamente usato e verifiche nel [rapporto v0.74](versioni/v074-tiro-plask.md).

## v0.73

- Mani unite senza falangi → mani anatomiche con 30 falangi e polso raccordato, derivate da fonte CC0; corpo, 24 rest e 18 morph del volto v0.72 conservati.
- Undici componenti per osso nel replay → per le nuove falangi si salvano quattro componenti di rotazione; posizione, scala e visibilità locali sono costanti. Durata, campionamento e limite di 24 MiB conservati.
- Test costumi legato a 9042/2800 triangoli esatti → confronto con la geometria ufficiale del GLB e della riserva, conservando i massimi storici 9042/2800, 69 chiamate/148.734 triangoli e 14 corpi completi.
- Ale ha fermato il tentativo facciale e poi chiesto di conservare mani, polsi e movimenti validi. Questa versione esclude ogni nuovo volto; nuoto e tiro già uniti nella v0.72 restano in vigore. Il GLB Plask rimane separato.

Dati finali e limiti nel [rapporto v0.73](versioni/v073-mani-polsi.md).

## v0.72
- Preset automatico quadrella alta anche su ogni rigore≥0,8 → sui rigori potenza e scelta di bersaglio vengono separate: distribuzione naturale alta/bassa/laterale, mirino coerente, precisione/velocità/lettura0,7 conservate. Il gigante precedente mascherava237/240gol con la scala corretta; test240rigori ripetuto con soglia70–86% invariata. In azione il forte alle quadrelle resta.
- Verifica visuale sempre con nuova simulazione completa → se `prove` ha appena validato gioco/gambe sulla stessa build, `aspetto --solo-foto` completa le sei viste senza ripetere quella partita. I due esiti restano separati nei log.
- V0.71 aveva lasciatoVIS1,45 sui corpi: il GLB in bind risultava2,547m, palla22,12cm e porta3m. Dopo la segnalazione di Ale sulle proporzioni complessive, VIS1,10 dà un adulto base1,932m, con le differenze individuali esistenti. Campo25×20m, porta3×0,90m e palla22,12cm restano nella stessa unità. Non viene ripristinata la sfera39cm. La decisione «VIS/punto di lancio assoluto invariati» è quindi superata: sagomaGK e p.ballW devono seguire la nuova altezza. Posa locale, comandi, tempi e velocità nominale del tiro conservati.
- Bicicletta simmetrica durante il classico e mano libera quasi statica → gambe asimmetriche, anche/core e appoggio attivo, solo animazione sulle24ossa esistenti. Nessuna conversioneFBX/Mixamo necessaria.
- Rimessa laterale dedotta da `lastTeam` (lanciatore) → ultimo tocco reale: dopoGK l’attacco conserva palla18s; sul fondo corner. Conservata l’eccezione WA12.3.1.1: tiro murato da un giocatore di movimento e uscito lateralmente va alla difesa28s; anche sul fondo rimessaGK.

Dati, verifica e parti escluse nel [rapporto v0.72](versioni/v072-proporzioni-tiro-rimesse.md).

## v0.71
- Replay verificato sul vecchio raggio0,195m → misura del raggio effettivo0,1106m; fit prospettico più vicino solo se serve a conservare4pxCSS, FOV/orbita conservati. Margine extra del primo piano eliminato, vincoli di viso/mani/pannelli conservati.
- Tuffo laterale sempre sul `crossZ` vero → corpo e braccia seguono la medesima lettura dopo il tempo di reazione, anche sulla deviazione ancora in arrivo; il recupero della respinta uscente resta libero.
- Fattore rigore0,41 che assegnava una parata → fattore0,7 per la sola lettura corretta, che può ancora fallire per tempo/portata:78,3%su240rigori. Nessun aumento globale di precisione/potenza.
- Parata assegnata al piano del portiere dopo un sorteggio, con corpo attraversabile se il tentativo falliva → la probabilità orienta il gesto, ma un intervento sulla palla richiede l'impatto3D con la sagoma; il corpo resta un ostacolo anche dopo un tentativo fallito. Sweep relativo palla/sagoma anche nello stesso fotogramma della linea di porta.
- Mani disegnate sempre sulla traiettoria, indipendentemente dal tempo disponibile → profilo condiviso con il contatto, reazione e velocità limitate, raccordo e recupero numerici indipendenti dal renderer.
- Tiro con potenza≤0,55: ogni parata assegnata diventava una presa → presa decisa separatamente dopo contatto con la mano; corpo/testa/braccio respingono. Le finte aiutano ma non diventano un requisito obbligatorio per il tiro umano.
- Palla fisica22,12cm ma sfera visuale39cm → sfera visuale22,12cm, palmo e galleggiamento allineati. `VIS=1,45`, `BRV=0,15` e punto fisico di lancio invariati; nessun ridimensionamento globale dei giocatori.
- V0.44: tutto il pannello del selezionato scompariva dopo3s → barra/percentuale/calotta dell'energia persistenti durante il gioco, anche in difesa e a0%; nome/ruolo restano temporanei.
- Palombella molto alta, forte alto con rotazione da palombella e tiro a rimbalzo mirato sulla linea di porta → palombella più tesa, forte con rotazione da tiro, bersaglio dell'acqua prima della posizione reale del portiere. La CPU prepara la palombella con una finta se manca; il comando umano conserva l'accesso diretto.

Prove, campione finale, fasi e limiti nel [rapporto v0.71](versioni/v071-portiere-tiri-stamina.md); esito CI dello SHA finale nella PR. Budget cambi/replay rispettati nei campioni, nessuna deroga ai limiti100chiamate/150000triangoli. Bilanciamento globale ancora aperto.

## v0.70
- Entrate in parità disponibili dal preset o dall’iniziativa automatica → anche chiamata touch durante l’azione dopo5,5s se la boa non è servibile; appoggio e servizio restano manuali, scelta persistente conservata.
- Bonus al centro ritardato anche su una boa chiaramente libera → occasione reale letta subito con marcatore, aiuti, portiere e corridoio; costruzione7–15s conservata nei duelli marginali. PASSA neutro assistito distinto dalla scelta CPU.
- Cambio automatico del controllo che annulla il taglio durante il passaggio → contesto conservato con levetta neutra fino alla presa; direzione manuale prioritaria.
- Solo disegno: carica del polso ripartiva da zero, curve separate arrestavano la mano al rilascio e filtro40→14 istantaneo → carica ereditata, raccordi della posa, tangente condivisa e filtro graduale. Nessun cambiamento a giunture fisiche, lancio o comandi speciali touch.

## v0.69
- Espulsione cancellata al kickoff → sanzione residua nel pozzetto; sei allo scatto, rientro legale su possesso o fine residuo. Cronometro prima del primo tocco → tempo effettivo dal tocco.
- Ricezione che batte l’anticipo premiata casualmente con rigore/espulsione → nessuna sanzione senza infrazione; criterio comune6m/gol probabile/contatto, tiro in corso differito fino all’esito.
- Boa fronteporta solo dopo una girata marcata dal codice → orientamento e linea di tiro reali, conclusione della CPU senza scarico casuale.
- V0.50: tutti fermi sul fallo → richiesta aggiornata di Ale21/11: fermi solo autore/vittima; gli altri proseguono, con cambio possesso/rientro sul fallo in attacco. Arresti generali restano per pause regolamentari.

## v0.68
- Chiusura21/11: mezza D avviata anche se lo scatto finisce fuori dalla ricezione → endpoint legale entro4,8m, margine20cm sotto la soglia5m, sempre0,6–1,4m; esterno sul punto anche senza rotazione → conserva lo spazio laterale. Nessun aumento di precisione/potenza o modifica della soglia di ricezione.
- Difensore che segue l’uscente e poi l’entrante fino al bordo → copertura temporanea palla-centro/porta finché il sostituto torna in zona d’attacco; schema selezionato conservato.
- Posto d’attacco legato all’indice del giocatore → occupanti per posto distinti da identità, calotta, mano e specialità; coperture e rientri dalle coordinate reali.
- Cambio di marcatura che scade dopo5s → accoppiamento conservato nel gioco vivo finché una consegna successiva lo modifica. Nei riposizionamenti già previsti dopo gol/time-out o a inizio tempo, mappe e riferimenti vengono ricostruiti; i recuperi vivi non li resettano. Il marcatore specialista prende il centro effettivo.
- Solo entrate occasionali generiche → anche passaggio vicino e taglio reattivo contro pressing con lettura di entrante/ala e mano di ricezione; A/B/C dopo 6 s e 2 passaggi, controfuga conservata ed eccezione sul fallo;12s fra quelle automatiche, comandi umani conservati.
- Compagno NPC spostato istantaneamente fuori dai2m → rientro tramite nuoto e controllo di permanenza comune al giocatore.
- Cinque preset → sei con Falso centro. La sua preparazione autonoma da un piano neutro non è implementata; CPU legge lo stato già presente.
- Arena leggera precedente → dettagli finanziati recuperando facce nascoste; stesse6mesh/atlante1024², +212tri CPU. Soglia alpha rete0,035→0,35 per evitare il pannello da lontano.

## v0.67
- Dopo ogni recupero scattavano tutti verso i posti d'attacco (v0.54, v0.58) → partono tutti subito, ma scatta solo chi può
  guadagnare un vantaggio: non è dietro al difensore più vicino o non ha nessuno entro 3 m (`SCATTI`, scelta di Ale «Partono tutti,
  scatta chi serve»).
- In rientro scattava chiunque fosse più di 0,8 m lontano dal suo posto → solo chi ha il suo uomo più vicino alla propria porta o
  che gli è scappato.
- Chi aveva il posto a più di 4 m scattava sempre, fino a stamina 0,35 (`partita.js`) → non più nelle transizioni.
- «Incrocio dei lati»: i due mezzi scattavano sempre → solo finché non sono al loro posto.
- Fatica del pressing 0,012 al secondo (scritta nel codice) → 0,008 (`PRESSING_CONSUMO`).

## v0.66
- Il computer non aveva uno schema d'attacco suo: giocava sempre l'«Arco», senza tagliante, e non entrava mai → nell'8% delle sue
  azioni in parità manda in entrata un mezzo, Pos. 2 o 3 (`ENTRATA.azione`); lo schema del giocatore resta quello scelto.
- Con lo schema «Entrata» o «Incrocio» un'entrata ogni 7 s (81 a partita) → al massimo una ogni 12 s (`ENTRATA.ogni`).
- A chi entrava si poteva passare in ogni momento: di solito gli arrivava appena partito, a 7,7 m dalla porta, e il taglio finiva
  lì → solo a meno di 5 m dalla porta e con almeno 1 m di vantaggio sul difensore o 2 m di spazio (`ENTRATA.vicino`, `vantaggio`,
  `libero`); in quel momento è il passaggio preferito. Chi riceve così tira subito (`ENTRATA.tiro`).
- Era «entrata» il tiro partito entro 3 s dall'inizio del taglio → il tiro di chi ha ricevuto tagliando, entro 2,5 s.
- Un'entrata in corso continuava anche con l'uomo in più o in meno → finisce subito: si va ai posti del 6 contro 5.

## v0.65
- Con l'uomo in più le occasioni chiare (tiro al volo, tiro da liberato) si prendevano dai 9 s (v0.59), prima solo subito dopo un
  cambio di lato → dai 7 s (`SUPERIORITA.pronta`): i tiri dei primi 10 s andavano in gol il 60-65% delle volte, quelli dopo il 30%.
- Con l'uomo in più poteva tirare al volo chiunque, anche l'ala sui 2 metri con poca porta (27% di gol) → sotto un'apertura di 0,5
  (distanza dalla linea di porta divisa per la distanza dalla porta) niente tiro al volo e voglia di tirare per 0,25
  (`SUPERIORITA.stretto`, `SUPERIORITA.strettoVoglia`): la palla va a chi vede più porta.
- Portiere in superiorità: `PARATA_SUP` 0,3 (v0.60) → 0,38.

## v0.64
- La ripartenza (fino a 12 s dopo ogni recupero) toglieva il freno della costruzione e chi riceveva libero entro 7 m tirava sempre
  → la costruzione vale anche nella ripartenza alla pari; il tiro subito dopo la ricezione è sicuro solo nella controfuga con l'uomo
  in più.
- Palla al centroboa con lo stesso vantaggio in tutta l'azione → in parità il vantaggio cresce dai 7 ai 15 s d'azione
  (`CENTRO_ATTESA`).
- Costruzione 15 s (v0.60) → 18 s; tiro di fine azione negli ultimi 6 s → 4,5 s; pazienza da 24 s → 25 s.
- Palla in mano sul perimetro 0,55-0,95 s (v0.61, stile equilibrato) → 0,4-0,7 s.
- Lotta al centro piena tra 10 e 24 s (v0.60) → tra 12 e 26 s; `ESPULSIONI.centro` 6,5 → 9, contrasto 0,24 → 0,21; espulsione per
  il fallo su chi palleggia 0,35 → 0,28.
- Falli in attacco del centroboa: con la palla 0,14 → 0,45, senza palla 0,05 → 0,12; palle rubate al centroboa 0,08 → 0,14;
  intercetto 0,12 → 0,14.
- Rigore per un fallo grave su chi sta per segnare: 0,6 da dietro e 0,35 negli altri casi → 0,45 e 0,25 (fallo voluto 0,6 → 0,5).
- Bacino disegnato nel tiro da fuori fino a 14 cm sotto il pelo (v0.61) → 16 cm (con le azioni nuove un campione di coscia usciva
  di 1 cm).

## v0.63
- Replay del gol di 7 s (0,6 s di diretta + 5,2 s di replay + 1,2 s di ripresa, v0.48) → 7,6 s (1,2 s di diretta + 5,2 + 1,2); dopo
  la rete si registrano 1,15 s (prima 0,56) e il primo piano di chi esulta occupa il 38% del replay (prima il 30%).
- Esultanza: solo il braccio alzato (v0.61) → chi ha segnato si alza con la bicicletta e agita il pugno.
- Passaggio di lato: busto quasi fermo e braccio che tornava dritto già nell'accompagnamento (l'avambraccio passava davanti al viso
  e la mano finiva sulla faccia) → busto e testa girano verso il compagno, il braccio lo segue fino al rientro, poi la mano rientra
  in acqua di lato.
- Chi nuota con la palla e tira, passa o finta: la palla saltava dall'acqua alla mano → la mano la pesca dall'acqua e la porta di
  lato all'altezza della spalla (al massimo 0,32 s, dentro i tempi del gesto).
- Chi riceve guardava dritto davanti a sé → gira la testa verso la palla in arrivo. Palombella: accompagnamento a braccio teso →
  gomito appena piegato.

## v0.62
- Memoria (`CLAUDE.md`, 213 KB) con tutta la storia di 61 versioni, decisioni superate comprese → memoria corta con le sole regole
  e decisioni in vigore; la storia in `docs/storia.md`, le decisioni cambiate qui.
- Tutti i documenti allo stesso livello in `docs/` → cartelle `versioni/`, `verifiche/`, `riferimenti/`, `proposte/`.
- Numeri del bilanciamento sparsi in otto moduli (`ia.js`, `fisica.js`, `lotta.js`, `regole.js`, `tiri.js`, `partita.js`,
  `finte.js`, `panchina.js`) → tutti in `src/taratura.js` con accanto i riferimenti reali (`npm run taratura`); il gioco è identico.
- Passi della CI lanciati a mano uno per uno → `npm run prove` (stessi passi, letti dal file della CI, con il riepilogo).
- Palla in mano prima del passaggio misurata solo con la sonda della v0.53 (ogni volta che la palla lascia la mano) → anche nel
  bilancio, solo sui passaggi dei giocatori di movimento a gioco in corso.

## v0.61
- Replay: camera ferma durante ricezione e volo, sempre con lo stesso orientamento, e solo un avvicinamento dopo la rete (v0.48) →
  camera che gira di circa 35° attorno all'azione e scende, poi taglio con lampo su un primo piano a pelo d'acqua di chi esulta.
- Bacino disegnato mai sopra 22 cm sotto il pelo dell'acqua per tutti (v0.22) → fino a 14 cm sotto nel tiro da fuori.
- Palla in mano sul perimetro 1,1-1,8 s con lo stile equilibrato (v0.53) → 0,55-0,95 s (tabella `CIRCOLAZIONE`).

## v0.60
- Costruzione dell'azione in parità 11 s (v0.59) → 15 s; tiro subito dopo la ricezione in parità 40% → 30%.
- Lotta al centro piena tra 8 e 20 s d'azione (v0.59) → tra 10 e 24 s; `ESPULSIONI.centro` 5,6 (v0.56) → 6,5.
- Intercetto: base 0,09 e passaggio lungo 0,3, scritti nel codice → 0,12 e 0,36 (`INTERCETTO`).
- Parata in superiorità −0,2 (nel codice) → −0,3 (`PARATA_SUP`); tiro al volo in superiorità 85% → sempre.

## v0.59
- Tiro subito a ogni ricezione libera → deciso una volta per ricezione (in parità circa una volta su tre).
- Finte tutte verso la porta → dalla seconda finta di lato, che sposta difensore e portiere.

## v0.58
- Superiorità del computer pronta a 5 s e voglia di tiro da 5 a 9 s → (poi v0.59) pronta a 9 s e voglia da 8 a 12 s.

## v0.57
- In inferiorità braccio del muro dalla parte del palo coperto (v0.30) → a specchio del braccio di tiro; il centrale tra i pali
  copre il palo lungo invece di spostarsi solo verso la palla.
- Passaggio fuori dal fondo ripreso dal proprio portiere se nessun difensore aveva toccato → conta l'ultimo lancio (angolo agli
  avversari se a lanciare è la squadra che difende quella porta).
- Tiro murato da un difensore e uscito dal fondo = angolo (v0.28) → rimessa del portiere (art. 13.1.2.2.3).
- In ripartenza nessuno più di 4-14 m davanti alla palla (v0.18) → i compagni scattano ai posti d'attacco.
- Errore dei passaggi sotto pressione della v0.56 (fino a ×3,5) → al massimo ×1,8 e mai oltre due volte l'errore tipico.

## v0.56
- Presa del passaggio entro 0,85 m dal centro del corpo → alla mano (0,55 m; portiere 0,9 m dalla v0.57).
- Espulsioni nella lotta al centro uguali in tutta l'azione → crescono con l'azione (`LOTTA_FASE`).

## v0.55
- Doppio tocco = finta e tocco = polso (v0.16/v0.29) → tocco = finta, tenuto breve (fino a 0,36 s) = polso, più a lungo = tiro
  caricato; tocco breve di Spazio = tiro (v0.45) → finta.
- Palmo sotto la palla (v0.31/v0.49) → mano dietro la palla, gomito in fuori.
- Corpo verticale dritto (v0.12-v0.53) → sempre inclinato a gioco in corso (dritto a gioco fermo).
- Braccia che arrivano esattamente alla mano della posa → braccia più distese («non cavallette»).
- Passaggio al centroboa sempre alla mano → in acqua davanti a lui se è marcato.

## v0.54
- Stanchezza fino a −40% della velocità (v0.16) → fino a −18%; con la palla −15% → −7%.
- Controfuga organizzata con probabilità diversa per nazionale (v0.46) → ripartenza sempre, dopo ogni recupero.

## v0.52
- La v0.51 attribuiva il corpo girato al contrario a Safari → la causa era il ripristino del replay.

## v0.50
- Carica e gesti non ancora rilasciati restavano sospesi al fischio (v0.49) → si annullano allo stop.
- Nomi mezzo/punto/ala nell'interfaccia → numerazione 1-6 distinta per parità e uomo in più.
- Controfuga anche senza andare verso la porta → richiede di avanzare verso la porta.

## v0.49
- Braccia orientate solo con le direzioni nominali → piegamento calcolato sulle lunghezze vere del modello; bacino solidale alle
  spalle → torsione distribuita sulla schiena; piega del polso fissa → per fase del gesto; gesto sospeso dopo il gol → recupero
  dei soli gesti già rilasciati.

## v0.48
- Attesa dopo il gol 3,8 s (v0.47) → 7 s saltabili (0,6 diretta + 5,2 replay + 1,2 ripresa); il motore resta fermo 3,8 s come da
  regolamento, il resto è solo presentazione.
- Camera del replay che ricalcolava il quadro sui giocatori vicini (v0.47) → quadro stabile (a sua volta superato nella v0.61).

## v0.46
- Fallo su chi palleggia valutato come un contrasto qualsiasi → espulsione probabile.
- Difensori del computer sempre a uomo → cambio di marcatura sulle entrate; quasi solo pressing → anche zona.

## v0.45
- Spostamento lento e scivoloso con curve ampie (v0.17) → controllo preciso con una piccola inerzia continua.
- Tastiera WASD, Spazio passa, Q cambia, E comando → frecce, Spazio tiro/finta, D passaggio, C cambia, Q/W/E schemi, F comando.
- Logo provvisorio con il 7 dorato → logo C «Flusso» scelto da Ale.

## v0.44
- Pali in superiorità sempre centroboa e punto con un solo 4-2 fisso → posti e pali dalla fase dello schema chiamato.
- Pulsante CAMBI sempre visibile (v0.39) → solo con un consiglio urgente o un cambio in corso.
- Pannello del giocatore sempre visibile e registro accanto alla pausa → pannello per 3 s dopo un cambio manuale e a inizio
  partita, registro dal menu di pausa.

## v0.42
- Cambio in coda possibile anche in difesa lontano dalla porta (v0.34) → mai mentre la squadra difende.

## v0.41
- Lotta al centro con barra di forza e SPRINT che aumentava un numero → lettura della linea di ricezione e movimento vero.
- Girata con esito casuale e rigore → aggiramento reale senza rigore regalato; beduina decisa dal ruolo → dalla posizione vera.
- Preferenza fissa per la diagonale lunga → scelta dalla geometria; tagli casuali → entrata coordinata; schemi fissi → preset e
  editor prepartita.

## v0.39
- Pulsante CAMBI a destra (v0.38) → in basso al centro.

## v0.38
- Più visuali e zoom → una sola regia da ripresa televisiva; scelta della velocità di gioco → ritmo unico (SPEED 1).
- Tabellone al centro → in alto a sinistra; nome dell'espulso che spariva dopo il primo avviso → nome e tempo sempre visibili.
- Palla con il contorno nero → senza; carica lunga con tiro automatico → tiro al rilascio.
- Riflesso dell'acqua sempre acceso (v0.37) → solo in qualità alta; qualità che poteva solo calare → recupero graduale.

## v0.34
- Barra dei cambi in gioco (v0.33) → sul pulsante CAMBI solo il cambio consigliato, che parte subito.
- Rose e nomi generati → rose vere dal database di Ale; pulsante Panchina finito per errore in home → nel menu di pausa.

## v0.33
- L'espulso spariva → nuota fino al pozzetto e rientra solo da lì.
- Sostituzioni solo prima della partita → soprattutto durante il gioco, illimitate.

## v0.31
- Tiro a schizzo che rimbalzava apposta prima della porta e colonnello automatico in nuotata → tiri di Ale con tasto a comparsa
  in controfuga.

## v0.30
- Contrasto a tocchi della v0.29 con pochissimi falli del computer → il terzo tocco è un fallo valutato come un contrasto vero.

## v0.29
- Contrasto «tenuto = fallo voluto» (v0.17) → tre livelli a tocchi (disturbo, disturbo, fallo).

## v0.24
- Partita in verticale e in orizzontale → solo in orizzontale; messaggi al centro dello schermo → notifiche ai margini.

## v0.22
- Due grafiche (Realistica e Cartoon) → solo Cartoon; acqua con riflesso e vista sott'acqua → un'acqua disegnata sola.

## v0.18 e prima
- «Alzata (prova)» nel menu → alzata fissa a 0,25 s (v0.18); alzata di mezzo secondo → 0,25 s (v0.17).
- Italia in blu comandata dal giocatore (scelta iniziale) → la squadra del giocatore in bianco, il computer in blu, portieri in
  rosso (v0.16); nomi inventati → nomi veri autorizzati da Ale (v0.16, rose vere dalla v0.34).
- Animazioni registrate Mixamo (v0.11) → tutti i movimenti costruiti sulle ossa (v0.12).
