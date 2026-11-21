# v0.70 — chiamate in azione, servizio alla boa e raccordi dei gesti

Richiesta di Ale: più occasioni per servire il centroboa, nuove entrate chiamabili durante l'azione e tiro/passaggio meno scattosi. Versione `0.70.0`, branch `codex/v070-chiamate-gesti`. Dipende dalle correzioni regolamentari v0.69; il riallineamento al suo commit finale precede la consegna. **Stato: implementato, verifiche nel browser in corso; nessun esito completo o PR pronta ancora dichiarato.**

## Cosa cambia

- **La chiamata avviene durante il possesso.** Dopo 5,5 s dall'inizio dell'azione, compreso il viaggio verso la porta, in parità e se la boa non è davvero servibile compaiono in basso al centro fino a tre scelte: `3 → 5`, `3 → 1`, `2 al palo`. Lo specchio `3 → 1` richiede mano/abilità adeguate. Contro pressing si presentano prima i tagli, contro zona il palo: è un ordine di proposta, non una promessa di riuscita. Tocco da almeno 44 px; CAMBI conserva la sua posizione e l'apertura della panchina nasconde le proposte.
- **Il tocco sceglie il movimento, i passaggi restano del giocatore.** Le scelte scompaiono subito; un breve testo indica chi servire e quale appoggio eseguire. Il taglio parte al rilascio reale dell'appoggio, poi si può cercare l'entrante o continuare la circolazione. Una chiamata per possesso; annullamento su perdita, espulsione, cambio periodo o scadenza. Nessun cambio permanente dello schema o della difesa, nessun riposizionamento istantaneo. Durante un passaggio a un tagliante, il cambio automatico del controllo conserva il contesto dell'entrata con levetta neutra; una direzione manuale prevale subito.
- **La boa chiaramente libera può essere servita subito.** La scelta distingue il marcatore reale, gli aiuti e il portiere: distanza del portiere dalla boa e marcatura di movimento non sono la stessa cosa. Corridoio, rischio d'intercetto, linea dei 2 m, orientamento, vantaggio e portiere in uscita restano vincolanti. Il PASSA neutro cerca prima l'appoggio chiamato, poi il tagliante pronto e infine la scelta assistita. La levetta direzionale conserva il comando del destinatario. Le occasioni chiare non aspettano il bonus CPU dei 7–15 s; i duelli marginali conservano la costruzione. Nessun aumento globale di precisione, potenza o probabilità di gol.
- **Raccordi soltanto visuali di tiro e passaggio.** Il polso riparte dalla carica già raggiunta; ingresso e uscita raccordano la posa precedente. La traiettoria mano-carica → rilascio → accompagnamento usa cubiche Hermite con posizione e velocità condivise al rilascio, entro gli ancoraggi. Il filtro delle braccia torna gradualmente al valore di base. Memoria visuale separata per atleta, ripulita su identità/ricollocamento; il replay conserva il mondo live. Nessuna modifica a `p.J`, `p.ballW`, tempi fisici, callback di lancio, carica massima 0,9 s o rilascio. Nessuna nuova geometria.

## File

Chiamate: nuovi `src/chiamate-attacco.js` e `tests/chiamate-attacco-v070.mjs`; modifiche a `src/entrate.js`, `src/controllo.js`, `src/hud.js`, `src/input.js`, `index.html`, `src/stile.css`.

Servizio: `src/tiri.js`, soglie in `SERVIZIO_BOA` di `src/taratura.js`; nuovi `tests/servizio-boa-v070.mjs` e `strumenti/sonda-boa-v070.mjs`.

Disegno: `src/grafica/pose.js`, nuovi `src/grafica/gesto-vista.js` e `tests/gesti-v070.mjs`. Versione/script in `package.json` e lock; tre passi dedicati nella CI `pages.yml`.

## Verifiche e misure

Da completare con gli esiti reali sul codice finale, senza confondere prove isolate, campione giocato e CI:

- Chiamate: A/B/C nei due versi con tocco, appoggio, ritorno e ricezione fisici; tempi, rinunce, controllo umano, reset, due dimensioni e margini sicuri. Test in corso.
- Boa: 36 scelte geometriche e quattro ricezioni fisiche destro/mancino, con marcatura, aiuto e portiere. Test in corso. La sonda distingue occasioni, decisioni e servizi effettivi; non misura ancora una frequenza generale conclusiva.
- Gesti: helper sulle curve, carica, filtro e reset; 24 sequenze reali prima/dopo con confronto di giunture fisiche, punto di lancio e callback. Test nel browser e ispezione delle immagini ancora da concludere. La parte fisica `//<POSE>` conserva lo SHA-256 `bd1833d84ab7553fcfcf95d21c20c619fdaafab91eb657405ce7b51a6e17c231`; questo controllo da solo non dimostra la qualità percepita.
- Prima della PR: lint, regressioni appropriate, replay, verifica e aspetto, confronto visivo e budget iPhone anche nei cambi. I limiti restano **meno di 100 chiamate e meno di 150.000 triangoli**, 14 corpi completi. Nessuna misura di FPS su iPhone fisico disponibile qui.

## Decisioni superate e non fatto

Le entrate in parità non sono più accessibili soltanto tramite scelta prima della partita o iniziativa automatica: ora si possono chiamare nel possesso. La lettura di una boa chiaramente libera non usa il ritardo di costruzione CPU come veto; i casi marginali lo conservano. Nel solo disegno sono superati il ritorno a carica zero del polso, i due arresti separati al rilascio e il salto del filtro `40 → 14`. Le correzioni v0.69 a espulsioni, rigori e falli sono la base, non nuovi risultati v0.70.

**Nuovi comandi touch per beduina/sciarpa/finte: proposta, non implementati.** L'idea da discutere con Ale è mostrare al massimo due gesti contestuali nello spazio dei comandi, da caricare e rilasciare direttamente; palombella sempre richiamabile e più evidente quando il portiere sale. Nessuna combinazione simultanea aggiunta. Le analisi originali sono in `docs/proposte/v070-chiamate-attacco.md` e `docs/proposte/v070-gesti-touch-e-raccordi.md`: documentano la fase di proposta e non sostituiscono lo stato di questo rapporto.

Restano il giudizio di Ale su leggibilità e naturalezza, la prova sul telefono e il bilanciamento generale non concluso dalla v0.69. Questi raccordi non sono una revisione completa di beduina, sciarpa, palombella, parata e nuoto con palla mediante tutti i fogli a tre lati. Nessun gol o rigore garantito, nessuna certificazione di resa professionale, nessun merge o deploy.
