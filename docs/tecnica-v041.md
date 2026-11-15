# Tecnica di pallanuoto — ricerca per v0.41

Ricerca e controllo delle fonti: **15 novembre 2026**. Questo documento accompagna la revisione del gameplay: raccoglie materiale letto, interpretazioni per il gioco e criteri di verifica. Non certifica che i comportamenti descritti siano già implementati o che le prove proposte siano già passate. Le API di lettura del centroboa, gli schemi e l'editor sono in lavorazione; i loro dettagli vanno confrontati con il codice finale e con il rapporto delle verifiche della PR.

## Riferimento regolamentare scelto

Il riferimento del progetto rimane **World Aquatics, Competition Regulations, versione 18 febbraio 2026, Part Six: Water Polo Rules**, per il gioco dei tornei internazionali. Non si passa al regolamento FIN di ottobre 2026 e non si combinano le due versioni.

Il 15 novembre la [pagina ufficiale WA dei Competition Regulations](https://www.worldaquatics.com/rules/competition-regulations) elenca ancora febbraio 2026, aggiornato il 18.02.2026, fra i regolamenti correnti. Il documento aggiuntivo per il Water Polo 4×4 non sostituisce le regole del normale sette contro sette. Questa è una verifica datata della pubblicazione ufficiale, non una garanzia su futuri aggiornamenti. Il [PDF completo WA](https://resources.fina.org/fina/document/2026/02/18/e6815ecc-06d9-4f0b-98e9-4c441cf5e6a3/2026-02-18_World-Aquatics_CR-Final.pdf) contiene la Part Six da p.214; i numeri di pagina citati sotto sono quelli del documento, coincidenti con le pagine PDF.

## Fonti lette e limiti della lettura

| Fonte | Materiale effettivamente esaminato | Uso e limiti |
| --- | --- | --- |
| **F1 — Manuale didattico FIN, indicato dall'utente come 2010**, PDF fornito di 63 pagine | Lettura integrale del testo estratto, comprese introduzioni, didattica ed esercizi. Le sezioni sono attribuite nel documento ad Alessandro Campagna, Claudio Mistrangelo, Pino Porzio e Massimo Tafuro. | Fonte tecnica storica, non regolamento vigente. Il nome del file distribuito non prova da solo la data dell'edizione. Non è stato individuato un URL FIN primario che ospiti questa stessa copia. |
| **F2 — Claudio Mistrangelo, Pali in superiorità numerica, seconda puntata**, PDF fornito di 15 pagine e [articolo originale Rari Nantes Savona](https://www.rarinantes.sv.it/576/area-tecnica/pallanuoto-area-tecnica-pali-in-superiorita-numerica-seconda-puntata) | Lettura integrale del testo del PDF e riscontro della pagina originale, utile anche per il testo disturbato dai collegamenti del sito a p.12. | Fonte tecnica dell'autore, non norma. Il 15/11/26 nel piè di pagina è la data della stampa fornita: non viene presentato come data di pubblicazione dell'articolo. Le pp.14–15 sono soprattutto elementi del sito. |
| **F3 — WA 18.02.2026** | Controllo della pagina corrente e lettura degli articoli pertinenti nella Part Six e nelle definizioni. | Autorità normativa scelta. Non si dichiara una lettura integrale di tutte le discipline contenute nel voluminoso PDF. |
| **F4 — FIN 2026–2027** | [Indice ufficiale della stagione](https://www.federnuoto.it/home/pallanuoto/norme-e-documenti-pallanuoto/pallanuoto-norme-e-documenti-2026-2027.html), [Regolamento tecnico di 59 pagine](https://www.federnuoto.it/home/pallanuoto/norme-e-documenti-pallanuoto/pallanuoto-norme-e-documenti-2026-2027/11721-regolamento-tecnico-17/file.html), approvato con Del. Pres. 34 del 02.10.2026, e disposizioni pertinenti delle [Norme organizzative](https://www.federnuoto.it/home/pallanuoto/norme-e-documenti-pallanuoto/pallanuoto-norme-e-documenti-2026-2027/11722-norme-organizzative-generali-dei-campionati-di-pallanuoto-6/file.html). | Confronto aggiornato per evitare di scambiare FIN 2025–2026 per l'ultima pubblicazione italiana. Le differenze non sono adottate nel gioco. |
| **F5 — Reddit, u/broken_hand, Water Polo Basics, Part 6: Man Up** | Link dell'utente aperto con redirect riuscito; testo e commenti pertinenti visibili letti. [URL canonico](https://www.reddit.com/r/waterpolo/comments/lk63p/water_polo_basics_part_6_man_up/). La pagina indica 15 anni fa; non viene dedotta una data esatta. | Spunto didattico comunitario, non autorità normativa né dimostrazione quantitativa dell'efficacia di uno schema. |

La lettura testuale di F1 copre: presentazioni pp.2–3; esercitazioni con la palla pp.4–19; centroboa pp.20–38; difensore del centroboa pp.39–50; controfuga pp.51–63. La copertina prevalentemente grafica e le pagine di fotografie o schemi non diventano descrizioni complete tramite l'estrazione del testo.

Il controllo visivo collegiale ha esaminato le figure FIN alle **pp.6,14,25,30–31,43–45,56,59,61,63** e Rari alle **pp.2,5–8,11–13**. Si tratta di figure selezionate: non si dichiara di aver analizzato visivamente ogni pagina. I riscontri riguardano postura e orientamento, spostamento del centro rispetto al marcatore, provenienza degli aiuti difensivi, aperture, occupazione di prima e seconda linea e scelte dei pali. Le frecce dei diagrammi illustrano relazioni e direzioni, non traiettorie misurate o distanze da copiare in coordinate esatte. Il DVD e i filmati richiamati dal manuale non sono stati visionati in questa ricerca.

Per identificare le copie fornite, senza incorporarle nel caricamento del gioco:

| Copia | SHA-256 |
| --- | --- |
| `1-manualedidatticopallanuotofin-120921044252-phpapp01.pdf`, 1.223.930 byte | `aed0a0b4b40ad199fd65447e7c72e28d4156033e9e3cecc1df283a9433ba33f6` |
| `2-Pallanuoto-Area-Tecnica-Pali-in-superiorità-numerica-seconda-puntata-Rari.pdf`, 1.129.651 byte | `76ea47a0ba297a3bc85177062cf17ff0b1c20d60cc8eb66d39ca0bad884324d0` |

## Principi che orientano il gameplay

F1 propone di ricavare esercizi da situazioni di partita, variando progressivamente pressione e avversari. Postura, lettura, controllo della palla e lavoro delle gambe appartengono allo stesso gesto: un giocatore non diventa efficace soltanto perché raggiunge una coordinata. Il passaggio deve trovare un ricevente orientato e pronto; scivolamenti e stacchi brevi servono a conservare o aprire un vantaggio. F1 pp.5–19 offre esempi tecnici, non coefficienti numerici per velocità, precisione, consumo di energia o probabilità di rete.

F2 §3.2 distingue i principi dalle sequenze preparate: uno schema offre risposte a reazioni plausibili della difesa, ma il giocatore deve riconoscere una possibilità che lo schema non aveva previsto. Per il progetto questo porta a una priorità verificabile: una conclusione chiaramente libera deve poter interrompere una sequenza; un passaggio chiuso deve poter essere rinviato o sostituito. L'editor può descrivere intenzioni e occupazione degli spazi, senza promettere che gli avversari reagiscano sempre allo stesso modo.

La difesa deve contribuire alla situazione: pressing, aiuto a zona e anticipo modificano le possibilità dell'attacco. Una scelta offensiva non è convincente se funziona soltanto perché i difensori ignorano la palla o perché il portiere viene spostato artificialmente. La distinzione tra scelta, esecuzione e risultato consente di valutare anche un buon passaggio seguito da un tiro sbagliato.

## Numerazione: ruoli, posti e calotte

I numeri dei diagrammi non sono numeri di calotta. Nel codice esaminato `p.i` identifica il posto nel sette, mentre `p.num` identifica la calotta; gli indici JavaScript iniziano da zero. Destra e sinistra sono riferite all'attaccante che guarda la porta avversaria, non al bordo dello schermo. Nella formazione del gioco lo spostamento laterale positivo è il lato destro; il verso della squadra converte questo riferimento nelle coordinate della vasca.

| Posto nel gioco (`p.i`) | Ruolo nell'arco | Numero degli schemi FIN pp.43–45 | Rari/Dennerlein nella base 4–2 di p.2 |
| --- | --- | --- | --- |
| 0 | Portiere | Non confondere con il difensore centrale `−6` | Non incluso nei sei attaccanti |
| 1 | Centroboa | 6 | Palo destro, vecchio numero 6; chiamato **Palo 1** nel testo Rari |
| 2 | Ala destra | 1 | Esterno 1 |
| 3 | Ala sinistra | 5 | Esterno 5 |
| 4 | Mezzo destro | 2 | Esterno alto 2 |
| 5 | Mezzo sinistro | 4 | Esterno alto 4 |
| 6 | Punto | 3 | Palo sinistro, vecchio numero 3; chiamato **Palo 5** nel testo Rari |

La colonna Rari è la traduzione della disposizione base, non un vincolo universale sugli atleti che debbano occupare i pali. Negli schemi FIN i numeri preceduti da meno indicano i difensori corrispondenti. Un movimento dell'attaccante e un cambio di marcatura non devono rinumerare le calotte. F2 avverte espressamente che la terminologia dei pali varia fra scuole: la traduzione va dichiarata ogni volta che si confrontano figure o dati.

## Centroboa e suo marcatore

F1 pp.23–25 chiarisce che la posizione utile dipende dal difensore: con marcatura dietro, il centro può sfruttare profondità e protezione della palla; con marcatura laterale cerca il lato che offre ricezione e porta; contro anticipo completo può essere utile fermarsi a 3–4 m e liberare spazio davanti, anziché avanzare automaticamente fino ai 2 m. Queste sono relazioni tattiche, non ordini che garantiscono sempre la stessa distanza.

F1 pp.26–32 collega il lavoro del centro allo spostamento della palla degli esterni. Anticipo, stacco sul dorso, cambio lato e rotazione hanno senso rispetto a provenienza del passaggio e spazio disponibile. Nel gioco una lettura come `leggiCentro` dovrebbe quindi descrivere almeno posizione relativa, lato di ricezione e opportunità: il nome e l'interfaccia finale restano da verificare all'integrazione. Non basta assegnare al centro un bonus permanente per il suo ruolo.

I possibili sviluppi non sono soltanto tiro ed espulsione. F1 pp.33–37 include scarico rapido, attrazione dell'aiuto, tiro laterale, tiro frontale dopo rotazione e conclusioni spalle alla porta. L'orientamento prima della ricezione deve consentire una scelta coerente. Una sciarpa o beduina dovrebbe trovare un contesto riconoscibile; la ricerca non prescrive di alternarle meccanicamente a prescindere dal marcatore.

Per il difensore, F1 pp.41–50 e 59 insiste su anticipo, scivolamento, controllo contemporaneo di palla e avversario e capacità di passare alla controfuga. La postura orizzontale/obliqua è un'indicazione didattica specifica di quella fase: non viene convertita nel divieto assoluto di assumere una posizione verticale in ogni azione.

Le descrizioni storiche di braccia agganciate, appoggi e spinte non costituiscono autorizzazioni regolamentari. Il sigillo progettuale significa conquistare e mantenere una posizione attraverso orientamento e spazio; l'eventuale spinta, trattenuta o impedimento è un evento distinto. Vanno conservati margini per contrasto pulito, ricezione negata, scarico, errore offensivo e recupero: l'esito non deve essere espulsione automatica né caduta fittizia al minimo contatto.

## Perimetro e difesa collettiva

F1 pp.14–17 collega il passaggio alla minaccia di tiro e alla preparazione del ricevente: fronte porta, palla disponibile, tempi brevi e recupero dell'assetto quando il passaggio arriva male. Per il gioco questo suggerisce appoggi e scivolamenti brevi, capaci di aprire una linea senza trasformare ogni ricezione in una lunga sequenza di rotazione, finta e tiro obbligati.

Gli esterni devono dare una linea al centro e mantenere opzioni reciproche. Un movimento verso il portatore è utile se libera un passaggio o accompagna l'aiuto; diventa controproducente se più compagni occupano la stessa corsia. Le distanze minime e i pesi di scelta richiedono taratura nel gioco: nessuna delle fonti fornisce valori da presentare come misurati.

I diagrammi FIN pp.43–45 distinguono pressing e aiuti provenienti da posti diversi, oltre alla zona a M. La loro traduzione è una relazione fra chi aiuta, cosa copre e chi rimane attaccabile. Non basta cambiare il nome dello schema mantenendo tutti i difensori immobili. Anche il nome “Zona 2” della fonte deve essere accompagnato dalla posizione dell'aiuto: non indica un generico secondo livello di difficoltà.

## Uomo in più, pali e assetto 4–2

Nel 4–2 si contano quattro attaccanti nella prima linea e due esterni più alti. La stessa disposizione può comparire in una controfuga manovrata: F1 pp.54–63 e F2 trattano contesti collegati ma non identici. Una superiorità nata da ritardo di rientro non ha per questo un cronometro di espulsione.

F2 §§3.3–3.7 descrive pali sempre disponibili al passaggio, ricerca dello spazio verso la palla, limite imposto dal difensore successivo e profondità differenti per evitare che un solo avversario chiuda entrambe le ricezioni. Le figure alle pp.5–8 mostrano scelte concatenate: se il difensore esce sul palo si apre una possibilità esterna; se rimane chiuso può liberarsi il palo. Le pp.11–13 mostrano anche i limiti e le eccezioni: continuare lo spostamento verso un altro marcatore non conserva il vantaggio. La minaccia del tiratore esterno rende sensata la scelta difensiva.

Traduzione progettuale: mantenere due pali riconoscibili, evitare che si oscurino dalla visuale del passatore, collegare i loro piccoli movimenti alla palla e agli aiuti. Nessuna richiesta di mantenere sempre entrambi sulla stessa profondità, di avvicinarli senza limite al portatore o di forzare ogni passaggio sui 2 m. Ricezione e conclusione rapida devono restare possibilità, non risultati garantiti.

La difesa in inferiorità deve ripartire coperture e spostarsi con la palla, lasciando inevitabilmente una scelta all'attacco; braccio e portiere collaborano. Non si deriva da F2 un unico sistema difensivo obbligatorio. L'appoggio sul corpo di un avversario per elevarsi non viene assunto come gesto sempre lecito.

## Controfuga, copertura e portiere

F1 pp.52–63 distingue preparazione, acquisizione e conservazione del vantaggio, conclusione e copertura della ripartenza avversaria. La prima apertura allarga e facilita il trasporto della palla; la seconda può dare profondità. Il marcatore del centro può diventare un appoggio centrale. Le figure pp.56 e 59 rendono evidente che più corsie e linee di passaggio partecipano alla salita.

F1 pp.54,60–63 avverte anche del rischio di verticalizzare troppo presto o concludere senza copertura. Il giocatore largo e quello che arriva da dietro devono poter preparare la conclusione di un compagno, fermarsi o tornare. Un 5 contro 4 può trasformarsi in 4 contro 3 o 2 contro 1: l'IA deve leggere i giocatori effettivamente disponibili, non soltanto uno stato nominale di superiorità.

Il portiere partecipa con posizione, lettura dell'uscita e prima apertura. Un eventuale 7 contro 6 richiede di distinguere il portiere avanzato dal settimo giocatore di movimento: cambiare posizione non cambia il ruolo registrato. Gli schemi e l'editor non devono attribuire al giocatore di movimento i privilegi del portiere.

## Vincoli WA da conservare

Riferimenti alla [Part Six WA 18.02.2026](https://resources.fina.org/fina/document/2026/02/18/e6815ecc-06d9-4f0b-98e9-4c441cf5e6a3/2026-02-18_World-Aquatics_CR-Final.pdf). Le implicazioni per il progetto nella seconda colonna sono criteri da verificare.

| Norma, articolo e pagina | Criterio per questa revisione |
| --- | --- |
| Campo 25×20 m; area di porta 7,16×2 m —20.2,20.4 p.241 | Conservare riferimenti geometrici e cambio di lato. |
| Possesso 28 s; casi di 18 s —9 pp.228–229 | Espulsione: `max(18,residuo)`, distinto dal rimbalzo. |
| Esclusione 18 s e rientri anticipati —10.5.2 p.231 | Usare disponibili reali, compreso il rientro. |
| Spinta/slancio; impedimento senza palla tenuta —8.2.7 p.227;10.1.4 p.229 | Valutare l'azione; vicinanza e sigillo non bastano. |
| Palla interamente sott'acqua —8.2.10 p.227 | Distinguere palla e corpo immersi. |
| Fallo tattico —10.1.5 p.229 | Nessuna ricetta del fallo semplice automatico. |
| Vantaggio —3.5.7.2 p.217 | Non troncare un'opportunità utile. |
| Area 2 m —8.2.8 p.227 | Esterno all'area; linea della palla; uscita senza ritardo. |
| Libero —12.4–12.7 p.234 | Ripresa visibile, distanza 1 m, niente braccio anticipato. |
| Libero oltre 6 m —7.5–7.6 pp.225–226 | Controllare testa e palla; gestire l'uscita da dentro 6 m. |
| Tiro ostacolato da dietro dentro 6 m —11.1.1.4 p.233 | Distinguere contatto sulla palla ed esito del tiro. |
| Rigore 5 m —16.2–16.3 p.236 | Altri dietro/sulla linea dei 6 m e almeno 3 m dal tiratore. |
| Ruoli —2.3 p.214; privilegi —8.2.11 p.227 | Ruolo, sostituzione e zona restano distinti. |

## Cosa non importare dai materiali storici

| Passaggio storico | Adattamento necessario |
| --- | --- |
| F1 p.40: possesso 30 s, inferiorità 20 s; pp.22,40: diretto dai 5 m | Conservare 28/18 e il riferimento 6 m del libero; il rigore è un'altra ripresa. |
| F1 p.21: descrizione generale del fuorigioco ai 2 m | Non estendere il vincolo all'intera larghezza della vasca. |
| F1 pp.27–31,47,59,61: spinte, agganci, blocchi e dirottamenti | Conservare intenzione e geometria; nessuna licenza generale a trattenere, affondare o spostare un avversario senza palla. |
| F1 p.21: possibilità di guadagnare l'espulsione; p.9: critica all'autoaffondamento | Niente caduta simulata o premio automatico per abbandonare la palla. |
| F1 p.42: postura del difensore del centro descritta in termini assoluti | Contestualizzare alla fase di anticipo; non immobilizzare la postura per tutto l'incontro. |
| F2 §3.4: liberarsi dall'appoggio del difensore | Preferire smarcamento; non derivarne una spinta sempre ammessa. |
| F2 figure: posizione dei pali e limite dello spazio | Rispettare ricezione lecita e visibilità; non copiare punti o frecce come coordinate universali. |

## Confronto FIN ottobre 2026: differenze conosciute ed escluse

L'ultima pubblicazione italiana verificata è il [RTP FIN 2026–2027](https://www.federnuoto.it/home/pallanuoto/norme-e-documenti-pallanuoto/pallanuoto-norme-e-documenti-2026-2027/11721-regolamento-tecnico-17/file.html). Serve a documentare la scelta WA, non a cambiare le regole del gioco.

| FIN ottobre | Differenza pertinente e decisione |
| --- | --- |
| Appendice 1 §2.7 p.33;10.1.6 p.18;11.1.3 p.21 | Introduce l'area di porta estesa fino a 6 m e specifiche sanzioni sui falli del portiere dentro/fuori tale area. **Non adottate**: la relativa EGA non è presente nel riferimento WA scelto. |
|12.5 p.23 | Formula generale sul luogo della palla; non riporta il sottoparagrafo WA 12.5.1 sul libero alla linea dei 2 m con palla nell'area di porta. **Si mantiene WA**. |
|12.4.2 p.23 | Formulazione sul giocatore più vicino/pronto, rispetto all'articolazione WA 12.4.2 che contempla anche una specifica possibilità per il secondo più vicino in attacco/controfuga. **Si mantiene WA**. |

Non si presume che questo confronto esaurisca ogni differenza fra i due documenti. Il fatto che FIN sia stato pubblicato più tardi non lo rende automaticamente applicabile ai tornei internazionali del prototipo.

## Reddit: contenuto utile e attendibilità

Il collegamento fornito, `https://www.reddit.com/r/waterpolo/s/LYygVL5xEG`, è stato aperto e ha reindirizzato al [post canonico di u/broken_hand](https://www.reddit.com/r/waterpolo/comments/lk63p/water_polo_basics_part_6_man_up/). Il contenuto riguarda l'uomo in più, non una spiegazione specifica della lotta al centroboa.

Propone circolazione veloce, passaggio trasversale per spostare il portiere, assetti 2–4 e 3–3, rapida conclusione dei pali, uno-due con chi ha ottenuto l'espulsione e difesa a coperture condivise. Questi spunti sono compatibili con letture e disponibilità al passaggio, ma non dimostrano che ogni situazione abbia un uomo immediatamente raggiungibile. I diagrammi testuali sono deteriorati e l'etichetta 2–2 non coincide con 2–4: non sono usati per ricostruire coordinate.

I commenti visibili pertinenti riguardano soprattutto la didattica e le dimensioni della piscina; il confronto 30 m/25 yard è storico. Il suggerimento di commettere immediatamente un fallo semplice duro va filtrato attraverso la norma corrente sul fallo tattico. La preferenza per poche finte è un consiglio situazionale, non il divieto di usare una finta utile. Non sono stati aggirati accessi, autenticazioni o blocchi; non si dichiara di aver letto commenti nascosti dietro ulteriori caricamenti.

## Comportamenti attesi e prove da effettuare

Questa tabella definisce osservazioni controllabili. **Non è un rapporto di test eseguiti.** Una prova deve permettere di distinguere decisione corretta, esecuzione e risultato; quando si usa casualità servono semi e condizioni riproducibili. Tempi, distanze e soglie di accettazione del prototipo devono essere dichiarati nel rapporto d'integrazione, senza attribuirli ai manuali.

| Situazione preparata | Comportamento atteso | Prova da documentare |
| --- | --- | --- |
| Centro marcato dietro, di lato o tutto davanti | Cambiano posizione utile, lato di ricezione e scelta di conclusione/scarico. | Stessa palla, tre marcature; registrare intenzione e posizione del ricevente prima del passaggio. |
| Centro cambia lato e si apre una ricezione | L'esterno riconosce la nuova linea; il centro resta raggiungibile. | Scene speculari alle due porte; confrontare linea chiusa/aperta e destinazione effettiva. |
| Centro senza linea utile | Il portatore conserva un'altra opzione. | Nessun passaggio forzato soltanto perché lo schema si chiama “Palla al boa”. |
| Sigillo o anticipo senza infrazione osservata | Contatto e gara di posizione non producono sempre lo stesso fischio. | Separare movimento utile, spinta e impedimento; verificare che la revisione non introduca trattenute automaticamente lecite. |
| Due compagni del perimetro vicini | Aprono appoggi distinti e mantengono una minaccia coerente. | Tracciare corse, corsie e possibilità di ricezione; confrontare con appoggio vuoto. |
| Passaggio rapido dopo cambio lato | Il ricevente pronto può concludere o proseguire senza una sequenza obbligata di finte. | Conservare alternativa allo stesso gesto, misurare attesa e assetto prima del rilascio. |
| Difesa esce sul palo oppure rimane chiusa | Cambia la scelta fra palo, esterno e prosecuzione. | Riprodurre le due reazioni, senza spostare artificialmente il portiere per far riuscire il tiro. |
| Due pali oscurati dallo stesso difensore | Piccolo movimento di profondità/lato restituisce una linea utile. | Confrontare allineamento, visibilità dal passatore e limite del difensore successivo. |
| Ricevente largo entro 2 m ma fuori area; ricevente nell'area davanti/dietro palla | La scelta distingue i tre casi. | Verificare entrambe le direzioni d'attacco, anche dopo uno schema personalizzato. |
| Espulsione, rientro e cambio possesso | L'assetto reagisce ai giocatori disponibili. | 18 s e rientri anticipati; espulsione con residuo sopra/sotto 18 s; nessun terzo palo involontario. |
| Controfuga con prima/seconda apertura e con rischio di ripartenza | Corsie diverse; conclusione o appoggio secondo vantaggio e copertura. | Confrontare superiorità reale, numeri pari e compagno che arriva in ritardo. |
| Sequenza dell'editor con linea chiusa o tiro libero evidente | La lettura della situazione può sospendere la sequenza. | Verificare entrambe le alternative; nessun passaggio obbligato a giocatore escluso o uscente. |
| Ripresa da libero dentro/fuori 6 m | Restano i vincoli della ripresa e l'alternativa di uscire oltre 6 m. | Verificare API di lettura e schema senza modificare le regole di ammissibilità del tiro. |
| Portiere avanzato o sette giocatori di movimento | I ruoli rimangono espliciti e coerenti. | Controllare sostituzione/ruolo/privilegi; non equiparare il mero movimento al cambio di ruolo. |

## Lettura del codice prima dell'integrazione

La ricognizione in sola lettura ha incluso `src/regole.js` e i punti collegati di formazioni, collisioni e tiro. Gli identificativi `leggiCentro`, schemi ed editor sono riferimenti progettuali: nessun esito runtime della loro integrazione è attestato qui.

Nel codice esaminato `exclude` usa già il massimo fra residuo e reset; `giveBall` distingue cambio di possesso e ripresa dopo tiro. Sono comportamenti da preservare. Il confronto delle fonti non autorizza ad aggiungere EGA, cambiare tempi o rielaborare tutto il sistema di falli in questa revisione.

Sono emersi punti da tenere separati dalla nuova lettura tattica:

- `tackle`, ramo `o.voluto`, contempla ancora il fallo semplice come possibile esito di un'interruzione voluta. La nuova IA non deve ampliare questo comportamento né descriverlo come regola corrente sul fallo tattico.
- `sfondamento` è richiamato dal modello di collisione tramite velocità e orientamento. Una scelta di sigillo non deve richiamarlo soltanto perché due atleti sono vicini; la somiglianza con il basket nel commento non è una fonte WA.
- `foul` conserva un breve arresto del gioco e sposta il difensore. L'adeguatezza completa di distanza, braccio e rimessa visibile dipende anche dagli altri moduli: non viene dichiarata conforme senza una prova dedicata.
- Il blocco del tiro sotto pressione in `startAct` è una scelta del modello. Non va presentato come conseguenza normativa inevitabile di qualsiasi avvicinamento del difensore.

Questi rilievi delimitano il controllo di compatibilità: non costituiscono una richiesta di riscrivere falli, collisioni o portiere. Eventuali interventi ulteriori richiedono un problema concreto, una modifica circoscritta e una verifica propria. La PR dovrà indicare quali righe della matrice sono state effettivamente implementate e verificate, rimandando al relativo rapporto invece di trasformare questo documento di ricerca in un elenco di risultati presunti.
