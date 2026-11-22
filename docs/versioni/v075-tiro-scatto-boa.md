# v0.75 — tiro continuo, scatto e boa

Base `main`1ec69ca31adf7f072101edee8407ef399f7eb629 (PR65 unita, CI45058084563 verde), ramo `codex/v075-tiro-fintee-anello`. Versione0.75.0. Nessun merge o deploy. Il riallineamento GitHub non ha trovato nuove PR aperte o interventi da sovrapporre.

## Richieste e comportamento

TIRO toccato/rilasciato dà un polso rapido e meno potente (.42). Tenendolo si prepara il gesto, si continua a muovere l’atleta e si finta; potenza massima dopo0,9s e disponibile fino al rilascio. Il rilascio interrompe la propria finta e avvia un solo tiro. Mira, pressione, abilità e stanchezza restano nel calcolo: nessuna barra oscillante o bonus di tempismo. L’anello del selezionato diventa progressivamente oro chiaro; al massimo il tasto dice PRONTO. Tolte barre/percentuale di potenza, stamina conservata.

Touch, Spazio/K e controller condividono il comando. Pausa, blur, annullamento touch, cambio di atleta/identità o perdita del possesso annullano una tenuta vecchia; il controller ancora premuto dopo un reset deve tornare neutro. PASSA e PALOMB. possono sostituire la tenuta. Restano la procedura dei rigori e il QTE di controfuga già esistenti; il tiro al volo durante un passaggio conserva il proprio comando.

A ogni tempo scatta il più veloce disponibile (Velocità della scheda, senza bonus), centrato davanti alla propria porta. Il portiere attende lateralmente fuori dai pali e rientra nuotando al via. Nessuno si sposta nel countdown; cambi reali aggiornano lo scattista prima del fischio. Input manuale e CAMBIA prevalgono sull’avvio assistito. Espulsioni residue e cronometro effettivo dal primo tocco conservati.

Alla boa spalle alla porta, TIRO sceglie beduina/sciarpa dall’assetto e dalla copertura della spalla dominante, anche quando il comando è dato in arrivo sul passaggio. Non alterna più i gesti contando i tiri precedenti. Se la boa è già frontale rimane il tiro frontale; nessun gol o vantaggio garantito. TAGLIO rimosso dai pulsanti touch: le chiamate A/B/C e il comando avanzato su tastiera/controller rimangono.

Dopo una rubata pulita tramite slancio manuale il gioco prosegue con il recuperante. Difetto riprodotto prima del fix: il movimento usava ancora il vecchio portatore come bersaglio, provocava subito sfondamento e stop. Ora, se il contrasto cambia il possessore, il movimento rilegge il comando umano; nessuna immunità ai falli, nessun azzeramento artificiale delle velocità o cambio alle regole generali.

## Modello e foto del nuoto

GLB runtime SHA256 `8fd658a8a89ad0dd242100133daf920eb6cfa492af8f39e95f6ff92124ba6745` invariato, così come clip Plask415pose/52ossa, mesh, pesi, rig e volto. Nessuna prova facciale. Nessuna modifica al nuoto.

La foto a1s dello scatto segnalata da Ale era errata: il test faceva60passi della partita e un solo aggiornamento del rig. Torso ancora nella transizione verticale e gambe già orizzontali producevano l’apparenza a L. Corretto solo il test aggiornando anche il disegno delle ossa a ogni passo, senza disegnare GPU60volte; vecchie foto non valide come prova del nuoto. Le nuove catture sono indicate nelle verifiche.

## File

- `src/tiro-comando.js`, `controllo.js`, `input.js`, `regole.js`: tenuta condivisa, finte, rilascio, annullamenti e notifiche continue ridotte.
- `src/grafica/render.js`, `hud.js`, `stile.css`, `index.html`: anello, PRONTO, rimozione barre e TAGLIO, istruzioni.
- `src/scatto-inizio.js`, `regole.js`, `ia.js`, `partita.js`: scelta atleta e schieramento prima del via, rientro fisico del portiere e controllo umano.
- `src/tiri.js`: scelta del gesto alla boa.
- `tests/tiro-comando-v075.mjs`, `scatto-inizio-v075.mjs`, prove desktop/finta/home/regia/v046, `package*.json`, CI e documentazione.

## Misure e verifiche

Vedere [registri e misure](../verifiche/v075/README.md): le fasi precedenti e finali sono distinte. Prima serie locale13/13PASS (6min) comprende tiro registrato, rig, gameplay, espulsioni, nuoto, fermi, orientamento, replay, sezioni2/4 e aspetto gioco. Gambe fuori acqua0/7707 verticali,0/5075 in nuotata,0/1218 transizione; misure precedenti alle ultime correzioni boa/rubata, non campione finale di bilanciamento.

Prima misura del comando: dopo PRONTO il braccio si muove1,645–2,482rad e il busto0,279–0,428rad nei quattro canali, tre finte osservate; nessun tiro durante la tenuta. Due cambi simultanei più anello, due tagli iPhone: massimo68chiamate/139200triangoli anche allargando la camera per includere entrambe le comparse;14atleti completi e2comparse. Sono misure Chromium, non FPS di un iPhone fisico. Il comando finale conferma questi stessi massimi,64scelte geometriche indipendenti dal contatore e6ricezioni reali, incluse2al volo; foto UI667/844 ispezionate.

Otto scatti reali (quattro tempi×due direzioni), presa a4,05s, massimo spostamento per passo5,03cm, nessun bonus alle statistiche e nessun teletrasporto. Sterzata umana0,57m e cambio del controllato rispettati; sanzioni/cronometro fermi fino al tocco. Sei partite standard soltanto nella CI finale, confronto immagini locale con `--partite=0`; nessun giro aggiuntivo di taratura. La PR riporta SHA, esito CI completo e link; CI verde sullo SHA finale necessaria per il merge.

Aspetto foto finale6/6PASS e ispezionato: iPhone56chiamate/131872triangoli, vista ravvicinata massima146138triangoli. Primo confronto locale immagini0partite:4differenze attese dopo il nuovo scatto e i nuovi comandi (7,14/47,09/33,17/36,28%);5confronti ispezionati e aggiornati solo i4riferimenti cambiati. Il giro rimane etichettato FAIL prima dei nuovi riferimenti, senza dichiararlo PASS retroattivamente. Non ripetuto il disegno locale delle stesse5immagini per risparmiare: la CI completa finale rilegge i riferimenti. Regressione v046 finale PASS, inclusa la scelta geometrica al centro.

## Decisioni superate e non fatto

Superati tocco=finta, attesa statica della carica, barra di potenza, scattista fisso e alternanza contata dei tiri di schiena. Nessuna nuova animazione o rifacimento dell’atleta/arena, nessun intervento al volto, nessun bilanciamento generale. Giudizio sulla naturalezza e prestazioni sul telefono reale restano ad Ale. Nessuna nuova meccanica aggiunta per sostituire TAGLIO.
