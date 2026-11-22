# v0.71 — portiere, proporzioni, tiri e stamina

Base main `dbf20b6` (v0.70, PR60/61 unite da Ale), ramo `codex/v071-portiere-palla`, versione `0.71.0`.
**Verifiche locali chiuse; CI finale e link della PR nella consegna. Nessun merge o deploy.**
Le prove mirate concluse sono distinte dai controlli finali mancanti. Dati selezionati e limiti in [verifiche v0.71](../verifiche/v071/README.md), con [provenienza e SHA-256](../verifiche/v071/provenienza.json).

## Richiesta e diagnosi

Correggere il portiere attraversabile e le prese troppo facili sui tiri vicini; verificare proporzioni di porta, palla e portiere; rendere sempre leggibile la stamina del selezionato; migliorare palombella, tiro forte alto e rimbalzo prima del portiere.

Sui tiri i collisori ordinari del portiere erano disabilitati. Il sorteggio della parata e il controllo della palla alla fine del fotogramma potevano quindi dare un gol anche attraverso il corpo; la mano disegnata raggiungeva il bersaglio indipendentemente dalla reazione. Con potenza≤0,55, ogni parata assegnata diventava una presa.

La [diagnosi sulle quattro pose reali di Nicosia](../verifiche/v071/proporzioni-prima.json) ha confermato l'apertura della porta di **3×0,90m** e una palla fisica di **22,12cm**, ma disegnata di **39cm**. Nel portiere pronto la sommità della calottina è a0,660m dall'acqua e i palmi distano1,380m; nella preparazione0,772m e1,706m. Sono misure statiche di un atleta del rig cartoon, con gli altri nascosti: non un confronto antropometrico completo. Non è stato necessario ridimensionare tutti i giocatori.

## Cosa cambia

- **Contatto del portiere.** Un profilo numerico condiviso con il disegno descrive corpo, testa, braccia e mani. Lo sweep3D considera lo spostamento della palla e della sagoma fra due fotogrammi, anche quando contatto e linea di porta cadono nello stesso passo. Il sorteggio orienta il tentativo: serve comunque un impatto per intervenire sulla palla.
- **Gesto e presa.** Reazione e velocità delle mani sono limitate; un tentativo tardivo non porta istantaneamente le mani sulla traiettoria. Corpo, testa e braccia respingono; la presa richiede la mano e una decisione separata, anche sui tiri poco caricati. Da vicino una presa rapida è rara; una deviazione obliqua può proseguire verso la porta e diventare gol. Raccordi e recupero usano lo stato numerico, senza dipendere dal renderer. La regola vale per entrambe le squadre, anche con portiere controllato dall'utente.
- **Palla.** Diametro disegnato22,12cm come la sfera fisica; palmo e quota di galleggiamento allineati. `VIS=1,45` e `BRV=0,15` restano invariati, così come il punto fisico di lancio. La variazione riguarda la sfera disegnata e i suoi raccordi.
- **Stamina.** Barra, percentuale e calotta del selezionato restano visibili in gioco, sia in attacco sia in difesa e anche a0%. Nome e ruolo restano temporanei; non viene mantenuto aperto tutto il pannello grande.
- **Tiri.** Palombella più tesa; la CPU la prepara con una finta se non l'ha già fatta. Il comando umano resta disponibile senza un nuovo obbligo di finta. Il forte alto usa la rotazione da tiro e una mira nominale alla quadrella; il tiro a rimbalzo cerca il contatto con l'acqua prima della posizione reale del portiere. Il suono di palo/traversa nasce dall'urto fisico.

File principali: nuovi `src/contatto-portiere.js`, `parata-portiere.js`, `decisione-parata.js`, `deviazione-tiro.js`, `profili-traiettorie.js`, `grafica/dimensioni-palla.js`; aggiornati `fisica.js`, `regole.js`, `tiri.js`, `ia.js`, `taratura.js`, `audio.js`, `grafica/pose.js`, `grafica/render.js`, `grafica/scena.js`, HUD/CSS/HTML. Versione in `package.json`/lock, script e otto prove dedicate in `tests/*v071.mjs`.

## Risultati mirati conclusi

### Contatto e gesto del portiere

[Quattro prove Node](../verifiche/v071/contatto-nodi.log) **PASS4/4**:51scene di sweep, profilo con26sfere, reazione, portata, raccordi, recupero, decisione della presa e deviazione. Verificati entrambi i versi,30/60/120Hz e indipendenza dal disegno. Velocità massima misurata delle mani sui50bersagli con portiere fermo, compresi busto e IK: **6,8586m/s**, sotto il limite7m/s.

Nel ciclo reale del browser, [prima](../verifiche/v071/portiere-prima-estratto.json) e [dopo](../verifiche/v071/portiere-dopo-estratto.json):

- **14/14** traiettorie contro la sagoma prima erano gol e ora producono una respinta; i contatti rilevati in questo gruppo sono sulla testa, anche nei casi denominati «torace» dalla fixture. Due scene coprono contatto e linea nello stesso fotogramma.
- **24/24** traiettorie nei varchi laterali o sopra le spalle restano gol: non viene aggiunto un muro invisibile.
- Sono inclusi entrambi i lati e30/60/120Hz. Le immagini mirate sono state ispezionate dall'esecutore: contatto sul volto e varchi liberi coerenti.

Il campione aggiuntivo usa **320 tiri a traiettoria imposta dopo `doShoot`, sempre a22m/s**, con portiere neutro controllato, difficoltà media e abilità delle squadre normalizzate. La potenza cambia i metadati del tiro, non la velocità imposta. Si misura il **primo esito**, quindi una respinta può ancora entrare in seguito. I dati riguardano corsie alte/laterali controllate: **non sono percentuali di gol o prese nelle partite, né un risultato di bilanciamento**.

| Distanza e potenza | Prese prima | Prese dopo |
|---|---:|---:|
| 3m,0,42 | 50/80 | 0/80 |
| 3m,0,90 | 12/80 | 0/80 |
| 8m,0,42 | 80/80 | 6/80 |
| 8m,0,90 | 28/80 | 6/80 |

**160 coppie speculari, zero esiti diversi** nel prima e nel dopo. Le traiettorie individuali complete restano nei file originali in `/tmp`; nell'archivio sono conservati aggregati,38scene mirate e le tracce dei due casi nello stesso fotogramma, con hash dei dati originali.

Il [controllo finale nel ciclo RAF](../verifiche/v071/portiere-finale-estratto.json) ha ripetuto38scene/320tiri e aggiunto **quattro muri veri** (striscio/pieno nei due versi):2deviazioni di striscio proseguono fino a un gol registrato;2colpi pieni tornano in campo. Non vengono attribuite parate al portiere per questi tocchi del difensore. La scena prepara il piazzamento e forza la scelta del muro, poi non corregge più la velocità: segue il risultato fisico, con il portiere spostato lateralmente per isolare il difensore. Non è una garanzia di gol su un muro né una misura del bilancio.

Il replay misura ora il raggio reale della mesh, anziché il vecchio0,195m. Per mantenere4pixelCSS reali della palla, la camera si avvicina solo quando necessario interpolando verso il fit prospettico minimo della medesima scena: stesso campo visibile, FOV/orbita invariati e nessun ingrandimento della sfera. Il primo piano usa il fit di viso/mani senza il vecchio margine extra, con2% di sicurezza oltre la fascia già protetta dai pannelli. Verifica completa e numeri finali sotto.

Immagini ispezionate: [contatto](../immagini/v071/portiere-contatto.png), [varco sopra la spalla](../immagini/v071/portiere-varco.png), [energia su667px](../immagini/v071/stamina-667.png). Sono scene controllate; non sostituiscono una verifica estetica su una partita intera.

### Dimensioni della palla e HUD

[Dimensioni della palla](../verifiche/v071/dimensioni-palla.json), **PASS quattro scene** con mano destra/sinistra a667×375 e844×390: diametro22,12cm,6,64–7,30pixelCSS, errore massimo rispetto al raggio palmo0,423mm. La prova confronta anche stato fisico e cronometri, invariati dal render. Le immagini sono state ispezionate dal coordinatore; la fixture dispone i giocatori artificialmente, non è una sequenza di partita.

Queste quattro scene statiche disegnano14corpi con63chiamate e143000triangoli. **Non è il massimo finale della versione e non copre il budget durante cambi o replay.** Restano vincolanti meno di100chiamate e meno di150000triangoli per fotogramma, senza deroghe.

[Stamina](../verifiche/v071/stamina.json) e [registro](../verifiche/v071/stamina.log), **PASS60stati, zero errori**: attacco/difesa;0/45/100%; dettagli visibili o scaduti dopo3s;667/844px con margini sicuri0/47px, più desktop1280px. Barra e testo restano visibili anche a0%, nessuna sovrapposizione rilevata. Il registro verifica inoltre l'aggiornamento al cambio automatico con73%; questo controllo aggiuntivo non è una delle60righe JSON. Immagini ispezionate dal coordinatore.

### Traiettorie

[Prova con la fisica Rapier](../verifiche/v071/traiettorie.log), **PASS22scene/42voli**, nei due versi. Confronta vecchia e nuova formula nella stessa esecuzione senza browser; non è il confronto di due build complete. Include rotazione, mira, reset degli stati di `doShoot`, finta preparatoria CPU e comando umano.

| Caso nominale | Prima | Dopo |
|---|---:|---:|
| Palombella da8m, tempo alla porta | 1,396s | 1,021s |
| Palombella da8m, picco sopra l'acqua | 3,168m | 2,076m |
| Rimbalzo da8m, portiere a10,9m: punto d'impatto | 1,434m dietro il portiere | 1,248m prima del portiere |

Le scene di rimbalzo coprono6/8/10m e due posizioni del portiere; la palla arriva al portiere già in risalita. Il forte nominale da8m arriva alla porta in0,350s, a21,22m/s, sotto la traversa. Il log non certifica naturalezza di una partita intera né ascolto del suono del legno su iPhone.

## Diagnosi del primo candidato: otto gare prima e otto dopo

Stesse coppie ITA–HUN, quattro tempi da480s, semi7919×1..8, una gara alla volta. Il prima usa la build v0.70 conservata con sorgenti identici a main `dbf20b6`; il dopo usa il primo candidato v0.71, prima della correzione della lettura sbagliata del portiere. Registri e dati in [prima](../verifiche/v071/bilancio-prima.json), [dopo](../verifiche/v071/bilancio-candidato-iniziale.json) e nei rispettivi `.log`. Tutte le16gare arrivano alla fine, nessun errore della pagina; palla sola massimo0,0333s in entrambe le fasi.

| Per squadra a gara | v0.70 | Primo candidato |
|---|---:|---:|
| Gol | 16,125 | 15,375 |
| Tiri | 41,375 | 41,375 |
| Conversione tiri | 38,97% | 37,16% |
| Parate registrate | 17,50 | 20,6875 |
| Rigori | 1,75 | 1,125 |
| Superiorità trasformate | 40,32% | 23,13% |
| Gol Italia / Ungheria | 11,75 /20,50 | 9,25 /21,50 |

**Il bilanciamento generale non è risolto:5/15voci in fascia in entrambe le fasi.** In questo campione la superiorità peggiora e il divario ITA–HUN cresce; azioni e tiri restano troppi, le azioni in parità troppo corte. Non sono stati nascosti questi esiti con un aumento globale di precisione/potenza o con una riduzione dei volumi corporei. Il cambiamento dell'esito fisico e del numero di sorteggi modifica poi l'intera sequenza delle gare: questi otto semi non misurano una probabilità universale né isolano da soli ogni causa tattica. La taratura della conclusione in superiorità e la lettura degli spazi del portiere restano da approfondire con un campione dedicato; questa PR corregge i contatti e i profili richiesti, non certifica il bilanciamento globale.

## Primo giro completo e correzioni di chiusura

`npm run prove`:48PASS/3FAIL su51passi. Fallimenti sul primo candidato: rapporto primo piano/azione del replay con la nuova palombella; rigori27,5% (66/240), troppo spesso intercettati anche dopo una lettura sbagliata; rapporto Precisione90/60 pari2,43, con due campioni casuali differenti. Gli altri48passi sono conclusi, compresi espulsioni/rigori reali, servizio boa, entrate/cambi, nuoto/gesti, sezioni1–6 e UI. Non sono un PASS sul codice corretto successivamente.

Correzioni: primo piano più stretto conservando il fit testa/mani; il tentativo sbagliato va sul lato letto male e lo conserva durante lo scivolamento. Anche il corpo aspetta la reazione e segue lo stesso bersaglio: il vecchio `gkTarget` continuava sempre verso il vero `crossZ`, vanificando la lettura sbagliata delle braccia. Tiri e deviazioni ancora in arrivo hanno precedenza sull'inseguimento della palla vagante; respinte uscenti e passaggi conservati.

Rigori: dopo aver eliminato il tuffo corporeo sempre corretto, il vecchio fattore0,41 (assegnazione della parata) dava210/240gol. Ora la probabilità riguarda solo la lettura giusta e serve comunque un impatto raggiungibile: `PARATA_PORTIERE.letturaRigore=0,7` produce **188/240gol,78,3%**, con22,7±0,7m/s e170ms. È una decisione cambiata esplicitamente, limitata ai rigori; non sono cambiati i coefficienti globali di precisione/potenza. [Esito](../verifiche/v071/dati-tesi.log).

Il test delle statistiche confronta ora gli stessi errori casuali a Precisione60/75/90 e un tiro classico a carica0,7. Da0,8 il nuovo tiro alto alla quadrella aggiunge il bordo della traversa, quindi non è più il tiro standard precedente: la quadrella ha la propria prova geometrica. Assert1,7–2,4 e1500tiri per abilità conservati. Esito **93,5%contro41,5%, rapporto2,25** (75:62,5%). Nessuna modifica a `mira`, `errBase` o `sforzo`. [Esito](../verifiche/v071/statistiche.log). Il nuovo test Node copre entrambe le letture su50bersagli, sotto7m/s, più lato sbagliato congelato. La chiusura successiva deve verificare questi casi e rifare il campione del dopo: **i numeri della tabella precedente non sono misure del codice finale**.

## Chiusura locale sul codice finale

Verifiche chiuse prima della PR: `npm run lint` PASS; primo `npm run prove`48/51 (tre regressioni diagnosticate e corrette), successiva ripresa4/5 più replay completo finale PASS, `dati-tesi` e `statistiche` PASS con assert conservati. La CI completa sull’ultimo SHA è riportata nella descrizione della PR, senza attribuire questi log a un commit successivo non provato.

`npm run verifica -- --partite=0` iniziale: qualità e17gruppi tornei PASS,4riferimenti fuori tolleranza. Tutti5confronti ispezionati, solo2–5aggiornati; menu invariato. [Ispezione e SHA](../verifiche/v071/ispezione-riferimenti.md). **Verifica indipendente bloccante PASS:** menu0,01%, 3identici, orizzontale0,00%entro tolleranza. Le sei partite della verifica standard si eseguono una sola volta nella CI finale, senza duplicarle qui.

`npm run aspetto -- --no-build` completo PASS: gambe fuori vert 0/7502, oriz 0/5300, intermedio 0/1198. Costi delle sei viste in [costi-aspetto.txt](../verifiche/v071/costi-aspetto.txt). Due cambi: massimo **61chiamate/145944triangoli**, entrambe le taglie iPhone. Replay **48/146426,14corpi**;18scene/558fotogrammi, palla≥4,20pxCSS reali, passo camera≤1,38m e viso primo piano≥2×. Restano rispettati<100/<150000nelle scene campionate, senza deroghe. Non sono FPS di un iPhone fisico.

### Campione finale, distinto dal candidato iniziale

[Otto gare v0.70](../verifiche/v071/bilancio-prima.json) contro [otto gare finali v0.71](../verifiche/v071/bilancio-finale.json), stessi semi e tempi480s. Una sola istanza Chromium: nel finale due pagine indipendenti con disegno disattivato, opzione prevista da `bilancio.mjs`; non cambia i semi o le formule. Tutte16gare concluse, nessun errore e palla sola massimo0,0333s.

| Per squadra a gara | v0.70 | v0.71 finale |
|---|---:|---:|
| Gol | 16,125 | 17,375 |
| Tiri | 41,375 | 43,250 |
| Conversione | 38,97% | 40,17% |
| Parate | 17,500 | 19,188 |
| Rigori | 1,750 | 1,688 |
| Superiorità trasformate | 40,32% | 32,09% |
| Gol Italia /Ungheria | 11,750/20,500 | 10,625/24,125 |

**Bilanciamento generale ancora aperto:4/15voci in fascia, prima5/15.** Superiorità sotto riferimento e peggiore del prima; aumenta il divario ITA–HUN e i gol salgono. Azioni71,38/squadra, durata parità13,67s: restano troppo numerose/corte. Questi limiti vanno mantenuti anche nella PR e nel passaggio, non nascosti con una modifica globale alla precisione o potenza. Il candidato iniziale15,375gol/23,13%superiorità sopra è una fase superata. Il campione finale non certifica da solo il comportamento contro un giocatore umano o tutte le nazionali.

Il foglio del tiro opzionale è stato interrotto durante il rendering software, senza modificare il codice o gli esiti delle prove necessarie. Sono disponibili sei fotogrammi del replay reale già ispezionati; due immagini da667px sono in [azione](../immagini/v071/replay-azione-667.png) e [primo piano](../immagini/v071/replay-primo-piano-667.png), ispezionate sia dall’esecutore sia dal coordinatore.

## Decisioni superate e limiti

Le modifiche sono registrate anche in [decisioni superate](../decisioni-superate.md): esito assegnato al piano del portiere → tentativo orientato dalla probabilità e impatto necessario; mani sempre sul bersaglio → reazione/velocità limitate; presa automatica sui tiri con potenza≤0,55 già parati → decisione separata al contatto con la mano; palla disegnata39cm →22,12cm; scomparsa dell'intero pannello dopo3s → stamina compatta persistente. Superati anche palombella molto alta, rimbalzo cercato sulla linea di porta e rotazione da palombella sul forte alto.

Non è stato aumentato globalmente precisione o potenza per mascherare il problema; non sono cambiati `VIS`/`BRV` e i limiti iPhone. Non vengono aggiunte nuove prove delle espressioni facciali. Bilanciamento generale, misura su iPhone fisico e giudizio di Ale restano aperti: le prove geometriche e i casi controllati non bastano a dichiarare risolta la resa professionale.
