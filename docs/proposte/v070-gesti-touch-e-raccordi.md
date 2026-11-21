# v0.70 — gesti touch e continuità visiva (proposta, nessuna implementazione)

Analisi in sola lettura del branch `codex/v069-falli-riprese`. Nessun browser, nuovo test o modifica produttiva. Le osservazioni sotto vengono dal codice: non sono misure di FPS o una certificazione di naturalezza.

## Perché si possono percepire come una molla

1. **La posa caricata non diventa la posa iniziale del nuovo gesto.** `tiri.js:35` sostituisce `p.charging` con un nuovo `p.act(t=0)` e azzera `chargeT`. In `pose.js:464`, se il gesto ha `wind>0`, `carica` riparte da zero. Il caso concreto è il rilascio touch fra0,16 e0,36s: `controllo.js:145–149` passa dalla carica di tiro al polso con wind0,04s. Anche una finta dopo carica può ricominciare da un'altra posa. La mano è filtrata, ma busto/spalle/polso cambiano invece di proseguire dal punto raggiunto. Il tiro lungo con wind0 non ha questo reset specifico: non va modificato indiscriminatamente.
2. **Il braccio viene frenato al rilascio, poi rilanciato nell'accompagnamento.** `pose.js:465–467,508–510` costruisce K→R e R→accompagnamento con due smoothstep distinti: la velocità relativa della mano va a zero aR, poi deve accelerare di nuovo. Il movimento globale include inoltre il calo del busto, quindi non è una singola frustata continua. Il problema non si risolve semplicemente rallentando tutto.
3. **Il filtro cambia velocità proprio al rilascio e non copre tutta la catena.** `pose.js:607` usa40/s mentre `act&&!done`, poi14/s: a60Hz significa circa49% contro21% dell'errore recuperato per fotogramma. Le mani/gomiti diventano più lente al cambio di stato; torsione delle spalle/busto e flessione del polso sono applicate direttamente (`pose.js:480–491,535`, `corpo.js:301–308`). Si può quindi vedere una mano smussata su un busto che cambia assetto bruscamente.
4. **La fine è governata dal gesto fisico, non dalla continuità visuale.** `updateActs` elimina `p.act`0,36s dopo il rilascio (`tiri.js:45`); passaggio/palombella hanno un rientro verso `FINE_LEGGERO`, poi tornano al gesto di base. Manca una transizione esplicita che conservi anche la velocità visuale della mano/busto entrando o uscendo dal gesto.

## Correzione visuale minima proposta

- Non toccare `computePose`, `p.J`, `p.ballW`, `startAct/updateActs`, callback, fisica della palla, tempi di carica0,9s e rilascio. Intervenire dopo il calcolo della posa fisica, in `articolaVista/updateRig`.
- Helper isolato, ad esempio `campionaGestoVista(tipo,tempi,posaIngresso,out)`, con curve cubiche Hermite per mano, gomito/polso e torsione. Carica e rientro partono dalla posa visuale realmente raggiunta; K→R e R→accompagnamento condividono una tangente non nulla aR. Resta identica l'ancora di rilascioR e il relativo istante; il braccio continua oltreR senza arrestarsi e ripartire.
- Il raccordo d'ingresso deve tenere conto della posa caricata precedente, non ripartire daHOLD. Stato solo visuale preallocato per giocatore, niente nuove mesh/materiali o allocazioni massive a ogni frame. Un breve raccordo d'uscita può continuare anche quando `p.act` è stato eliminato, senza far partire callback né anticipare un nuovo comando.
- Eliminare il salto40→14 nel filtro delle braccia proprio a`done`: se serve ancora un filtro, far variare il guadagno con continuità e insieme alla fase visuale. Non aggiungere una seconda molla al movimento già raccordato.
- Se si introduce memoria visuale, gestire replay/ripristino, collocamenti e cambio di identità nello stesso corpo; nessuna posa vecchia trascinata nel giocatore subentrato.

## Gesti touch: perché oggi sono difficili da richiamare

`shotKind` (`tiri.js:111–124`) sceglie beduina/sciarpa/rovesciata in base a distanza, spalle e contatore dei tiri: l'utente non può scegliere esplicitamente beduina o sciarpa. La torsione touch (`controllo.js:151–155`) richiede cambiare lato con la levetta mentre si carica, oppure tenere anche SPRINT. È proprio una combinazione poco leggibile su uno schermo senza sensibilità tattile.

Proposta da concordare con Ale, usando lo spazio dei comandi esistenti e mostrando al massimo due scelte pertinenti:
- Boa di spalle con palla controllata: BEDUINA / SCIARPA; pressione sul gesto scelto per caricare, rilascio per eseguirlo. Non un piccolo selettore da colpire durante una seconda combinazione. La girata resta una scelta distinta, non un tiro speciale automatico.
- Palombella: mantenerla richiamabile anche senza suggerimento, ma renderla evidente quando il portiere sale o esce; mai nasconderla solo perché l'IA non la consiglierebbe.
- Finte: un tocco e feedback visibile del busto/portiere; il tiro successivo resta controllato. La torsione può avere una chiamata contestuale esplicita al posto della combinazione con SPRINT/levetta. Le opzioni non devono cambiare sotto il dito durante una pressione.
- Tenere distinti input touch, tastiera e controller: gli attuali comandi desktop concordati non hanno bisogno di essere riscritti.

## Come verificare quando si implementa

Una sola istanza Chromium. Confronto PRIMA/DOPO sullo stesso seme e sulle stesse sequenze di comandi: statistiche, p.J/ballW al lancio, istante di rilascio e traiettoria identici. Filmato o foglio a tre lati di passaggio avanti/laterale, tiro dopo carica breve/lunga, finta→tiro, destro/mancino; includere almeno una vera circolazione giocata, non solo pose ferme. Misurare spostamento e velocità visuale di mano/gomito/busto prima, durante e dopo il rilascio, senza imporre uno zero alla velocità nel puntoR. Controllare allineamento palla-palmo e assenza di scatti nuovi dopo presa/replay/cambio.

Ripetere budget iPhone (<100chiamate/<150000triangoli con14corpi e due cambi); il cambiamento non aggiunge geometria, ma va controllato il costo CPU e non soltanto il numero di triangoli. Non scrivere nuove prove delle espressioni facciali.
