# v0.40 — implementazione delle richieste rimaste nella proposta

Ale ha chiarito che la v0.39 aveva consegnato soprattutto documenti, mentre si aspettava cambiamenti nel gioco. La v0.40 porta nel gioco i seguenti blocchi; questo documento è il punto di ripresa durante il lavoro, non una dichiarazione di completamento.

Branch: `codex/v040-tornei-menu-gameplay`, base `0998d89` (PR34/v0.39 già unita). **Implementazione completata e verifiche chiuse**: il rapporto definitivo è [verifiche-v040.md](verifiche-v040.md), il passaggio aggiornato è [PASSAGGIO-CLAUDE-CODE.md](PASSAGGIO-CLAUDE-CODE.md). Le voci sotto descrivono la ripartizione iniziale del lavoro, superata dai risultati del rapporto.

- Motore Mondiali/Europei, sorteggio, calendario, classifiche, simulazioni e salvataggio della campagna: in implementazione in `src/tornei.js`.
- Home, scelta modalità/nazionale, centro torneo, pausa, fine, coppe/bacheca e premiazione integrate: in implementazione in `src/menu.js`, `index.html`, `src/stile.css`.
- Otto rose europee mancanti: trovata fonte ufficiale Microplus del 9 gennaio 2026 con numeri, ruoli e mano; integrazione in corso. Valori di gioco dichiarati stimati.
- Serie di rigori giocabile a parità dopo il quarto tempo dei tornei: in implementazione in `src/rigoriFinali.js`, `regole.js`, `partita.js`; gol separati dal punteggio regolamentare.
- Risposta dei comandi, scelta del destinatario e movimento senza palla: primi interventi scritti in `controllo.js`, `ia.js`, `tiri.js`, verifiche mirate in preparazione.
- Porte, corde, bordo e tribune: ricostruzione leggera in corso, mantenendo acqua e corpi. Limiti invariabili anche durante due cambi: strettamente meno di100 chiamate e150.000 triangoli.

La campagna viene salvata fra le partite; uscire durante una gara deve avvertire chiaramente se la gara riparte dall'inizio. La ripresa esatta a metà azione non va dichiarata disponibile senza implementarla e verificarla.

Prima della PR: aggiornare CLAUDE.md con file, numeri misurati e limiti effettivi; eseguire lint, verifica e aspetto; controllare i percorsi dei due tornei, il reload, le serie di rigori, l'HUD iPhone e il picco durante i cambi. Nessun merge/deploy autorizzato. Questo stato sarà sostituito dai risultati effettivi prima della consegna.
