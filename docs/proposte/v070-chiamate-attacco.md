# Proposta v0.70 — chiamate in azione e servizio alla boa

Analisi statica del codice corrente (branch v0.69 in lavorazione). Nessun test/browser o modifica di produzione eseguiti.

## Gap verificati nel codice

1. `regole.callPlay()` seleziona soltanto i quattro preset Arco/Entrata/Incrocio/Boa. Non seleziona le giocate A, B, C della v0.68 né una sequenza esplicita di Falso centro.
2. In `entrate.js`, `valida()` rifiuta la squadra umana (salvo il preset Falso centro); `preparaEntrata()` e `registraPassaggioEntrata()` rifiutano anche `p===ctrl`. Il secondo controllo avviene dentro `doPass()` PRIMA di `launch()` e PRIMA di `setCtrl(m)`: eliminare soltanto il primo divieto non basta. Occorre un percorso di chiamata autorizzata che consenta il rilascio del portatore comandato.
3. HUD `#tac` è in alto a destra e mostra i quattro preset (oppure i tre schemi del 6c5). Non esiste la comparsa a 5–6 s per le chiamate in parità. Gli input toccano soltanto `callPlay(i)`.

## Minimo funzionale proposto

Nuovo `src/chiamate-attacco.js` per definizioni, offerta HUD e intenzione del possesso; evitare di trasformare una giocata in un cambio permanente di preset.

API consigliate:
- `opzioniChiamata(t)`: fino a tre chiamate sensate per la situazione e la mano dei giocatori, con id/testo/motivo. Non fingere tre opzioni valide se la terza non è attuabile.
- `chiamaAttacco(t,id)`: valida parità, possesso, atleti, nuova chiamata; salva `t.chiamataAttacco={id,possT,t0,fase:'attesa-appoggio'}`. Non cambia coordinate, identità, `schema`, `defPlay` o `atkPlay`.
- `statoChiamata(t)`: stato piccolo per HUD (offerta/in attesa/in esecuzione), legato a `game.possT`; pulizia su possesso perso, nuova disposizione, espulsione o invalidità dell'atleta.

Il nuovo modulo può importare `occupanteAttacco`, `centroAttacco`, `difensoreEntrata`, `latoTecnico`; `entrate.js` legge il contratto `t.chiamataAttacco` senza importare il modulo, evitando un ulteriore ciclo di import.

In `entrate.js`, estendere `valida/preparaEntrata/registraPassaggioEntrata` per un'intenzione umana esplicita. Per il percorso chiamato bypassare soltanto automaticità/pressing casuale e permettere `p===ctrl`; conservare parità, effettivo possesso, campo, atleta disponibile e linea di passaggio. L'intenzione resta in attesa del passaggio GIUSTO, e il taglio inizia esclusivamente nel vero `registraPassaggioEntrata(p,m)`. Riutilizzare `inizia()` e `targetEntrata()` per scalate e coperture già implementate.

Sequenza:
1. Dopo 5–6 s da `game.possT`, compreso lo spostamento verso la porta, offrire le chiamate se il centro non è servibile dal portatore attuale. Non usare il tempo dal momento in cui tutti arrivano ai posti.
2. Il tocco salva la chiamata e chiude subito le scelte. La squadra conserva appoggi e costruisce i presupposti della giocata.
3. Appena il portatore previsto esegue il passaggio al vicino previsto, parte il taglio. Nessun passaggio forzato attraverso un marcatore.
4. Il secondo servizio resta una lettura di entrante/ala salita/linea chiusa. Se la difesa chiude, normale circolazione o scarico: la chiamata non garantisce né un tiro né un gol.

Controllo umano: il minimo più sicuro è che il giocatore mantenga il controllo del passaggio; la chiamata dispone la squadra e attende il suo rilascio. Se si vuole che il tocco esegua anche l'appoggio iniziale, deve essere una semantica dichiarata del comando e limitata al caso in cui il portatore controllato sia già l'esecutore previsto; evitare che la chiamata sequestri per secondi la palla a chi sta usando la levetta. Non automatizzare una catena intera di passaggi.

## Tre scelte comprensibili

Le giocate già eseguibili sono `3→5` (A), `3→1` (B), `2 al palo` (C). I numeri sono POSIZIONI, non calotte; risolvere gli occupanti attuali e non usare direttamente `players[3]`.

- Pressing stretto: A/C, oppure B quando la coppia mancina o atleticamente/tecnicamente adatta supera `latoTecnico()`.
- Zona/M/raddoppio: non etichettare A/B/C come “adatte” se il corridoio è già presidiato. Si può offrire una circolazione/cambio lato per spostare la zona, ma oggi manca una sua sequenza esplicita; occorre implementarla oppure dichiararla futura. Il Falso centro attuale legge soltanto una disposizione già presente: non va venduto come nuova chiamata completa da un normale Arco.
- Mezze entrate D: opportunistiche sulla testa davanti; conservarle come risposta alla situazione, senza spacciarle per uno scatto sempre disponibile.

UI: nuova riga DOM basso-centro, area di tocco almeno44px, etichette brevi `3→5`, `3→1`, `2 al palo` con nome accessibile esteso. Su667px ci sono circa227px fra i comandi laterali: tre pulsanti possono stare solo con testi brevi. Non sovrapporre `#tCambi` (bottom8px,height44): quando CAMBI è visibile, riga chiamate sopra (circa60px) e sospendere il pannello `#fight` nella stessa zona. Se `#cambiBox.on` è aperto, sospendere temporaneamente la riga. Dopo la scelta, ritorna il campo libero e lo stato può usare la pillola ATT già esistente.

File di integrazione: nuovo modulo, `entrate.js`, `hud.js`, `input.js`, `index.html`, `stile.css`; `regole.js` solo per ponte di input/chiama e reset. Conservare il percorso del6c5 e i controlli desktop esistenti.

## Perché la boa può ricevere poco: fatti, non ancora frequenze misurate

- `attesaCentro()` in `tiri.js` azzera il bonus al centro fino al7°s e lo porta al pieno soltanto al15°s. Il bonus del vicino invece è subito1,25–2,4. Un'apertura buona nei primi5–6s può quindi essere ignorata prima che la difesa si riposizioni.
- La boa deve passare contemporaneamente `leggiCentro(...).ricevibile`, `laneClear(...,.55)` e `passLaneRisk<=.3`. Sono tre verifiche diverse, non dimostrano da sole un bug: non vanno semplicemente rimosse.
- `bestPassTarget()` usa per `leggiCentro` il difensore di movimento PIÙ VICINO, mentre il duello/centroTarget usa il marcatore effettivo `difensoreCentro()`. Verificare i casi di aiuto/raddoppio: la marcatura e il corridoio sono concetti diversi; la minaccia degli altri deve restare in lane/risk.
- `openness()` include il portiere; questo comprime il punteggio del centro ravvicinato anche se il marcatore è battuto. Non escludere però indiscriminatamente un portiere capace di intercettare una palla vicina: separare la distanza del marcatore dal rischio del servizio.
- Fatto importante per TOUCH: `humanPassTarget()` con levetta neutra ritorna `bestPassTarget(p,false)`, quindi eredita anche la pazienza dell'IA7→15s. Il comando PASSA del giocatore non dovrebbe essere frenato da una scelta temporale dell'allenatore CPU. Con levetta versoporta esiste già BOA_PREFERITO, ma richiede mescolare nuoto e mira del passaggio.

Correzione mirata da misurare: distinguere “boa davvero liberata e servibile adesso” da “duello marginale”. La prima merita un servizio anche prima del7°s; la seconda conserva pazienza e rischio. Per il PASSA neutro umano usare una scelta assistita senza il ritardo strategico CPU, mantenendo linea/rischio e priorità dei compagni vicini se il centro è coperto. Non aumentare precisione, potenza o passaggi obbligati.

Misure necessarie in una sola serie di partite: opportunità boa servibili, scelte di servizio, passaggi effettivi alla boa e ricezioni; distribuire per età del possesso(0–6/6–15/15+s), pressing/zona/M, mano e fonte umano/CPU. Separare esito tecnico(persa/presa/tiro/scarico) da semplice conteggio dei gol. `strumenti/sonda-passaggi.mjs` già osserva i passaggi, ma non riassume questa opportunità tattica: estendere quella sonda anziché lanciare una nuova taratura cieca.

Prove v0.70: scelta touch dopo5–6s, nessuna comparsa seboa già aperta, chiusura immediata al tap; chiamata vera con portatore umano e partenza SOLO al rilascio; lineup/mani nei due versi; difesa chiusa→circolazione; perdita palla/reset/paritàcambiata annullano; nessun cambio del preset/difesa persistente;667/844safeinsets senza sovrapporre CAMBI/comandi. Nessun nuovo oggetto3D richiesto.
