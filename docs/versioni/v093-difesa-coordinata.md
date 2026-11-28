# v0.93 — difesa coordinata e consegne coperte

Ale segnala disordine dopo gli interventi all’IA: chi scappa deve essere preso da un compagno meglio piazzato, mentre il difensore superato copre l’altro uomo. La difesa deve scegliere quando aiutare e conservare la forma. Base main `3e04bb5`, PR75 v0.92 unita e CI46124432130 verde; nessuna PR più recente aperta al riallineamento. Ramo `codex/v093-difesa-coordinata`, versione 0.93.0. Preservati lavoro Claude su attacco, transizioni e superiorità e tutti i worktree precedenti.

## Difetti riscontrati

Il cambio sui tagli sceglieva il compagno vicino all’entrante senza verificare la seconda consegna, anche sottraendolo alla boa. Vicino alla porta non interveniva su uno sfuggito senza `cut`. Più difensori potevano abbassarsi autonomamente sul centro e sommare quell’aiuto a quello dedicato. Nei rientri poteva cambiare la consegna del giocatore controllato come cedente; un uscente poteva essere scelto per rallentare il portatore. Inoltre chi seguiva un attaccante in nuotata poteva restare nella bicicletta a mezza velocità perché il bersaglio era vicino.

## Cosa cambia

Un coordinatore per squadra (`difesa-coordinata.js`) valuta entrambe le nuove responsabilità. Scambia solo se il marcatore è stato superato o è realmente lontano, un compagno è dalla parte utile della porta e il cedente può coprire il nuovo uomo pericoloso. Guadagno complessivo, disponibilità reale e permanenza di 2,5 s impediscono scambi ripetuti senza vantaggio. Niente cambio di coordinate: si aggiorna anche il riferimento della nuova identità, così il ritardo del vecchio uomo non trascina nella direzione sbagliata. Controllato, raddoppiante manuale e chi rallenta il portatore sono riservati ai propri compiti.

Un solo aiutante automatico; niente secondo aiuto sopra un raddoppio manuale o la copertura di un cambio volante. Non considera “copertura” un compagno soltanto perché passa vicino. Aiuti dal perimetro lontano o dall’ala larga sul lato debole quando c’è un pericolo urgente, conservando palla, boa e tiratori vicini. Distanza reale dalla porta: un’ala a due metri ma larga sei non equivale a un attaccante frontale. Le scelte pressing/zona/M restano selezionate; l’aiuto è temporaneo e il bersaglio segue le posizioni attuali anche durante un fallo ordinario.

Rientro e profondità della M seguono il posto dell’avversario effettivamente marcato, non il vecchio indice del difensore. Chi rallenta il portatore mantiene brevemente il compito, senza uscenti. Su un attaccante che nuota verso la porta il marcatore usa il nuoto normale e può recuperare in sprint se superato: nessun bonus alle velocità, nessuna corsa di tutti sulla palla. Lo scivolamento tranquillo resta.

## File e verifiche

Produzione: nuovo `src/difesa-coordinata.js`, `ia.js`, `taratura.js` (soglie tattiche dichiarate, non dati regolamentari), reset in `entrate.js`; in `partita.js` solo il commento del flag già esistente. Nuovo test e sonda; package/lock e CI aggiornati. Nessuna modifica a modelli, animazioni, fisica della palla, regole, controlli o parametri globali di precisione/potenza.

[Verifiche, fasi e misure](../verifiche/v093/README.md). Il test su 56 situazioni reali del coordinatore, due direzioni, mani D/S e pressing/zona/M passa da 10/56 nella baseline a 56/56 nella correzione. Comprende due pericoli contemporanei, protezione del secondo uomo e controllo umano. Le entrate A/B/C/D vengono provate anche nel ciclo completo con ricezione e difensori mobili.

Fixture legacy corrette conservando tutti gli assert: l’aiuto autorizzato parte dal controller di squadra e da un appoggio davvero lasciabile; la consegna positiva ha anche il secondo uomo raggiungibile. Nel caso di testa avanti il marcatore parte 2,25 m dietro invece di 1,25, poiché ora nuota realmente e poteva recuperare durante il passaggio iniziale. Caso di copertura completa e assert che esclude il ritorno B conservati. Test attacco: RAF e rig sempre aggiornati, soli disegni GPU inutilizzati disattivati; nessun controllo tolto.

Nel campione accoppiato2+2gare a180s/tempo: minacce libere50,92%→43,99%, gruppi di almeno3difensori118,50→63,45s, almeno3sulla palla32,07→19,10s. Gol totali25→25,tiri59→57. Sono dati diagnostici; nel seme33 gli abbandoni aumentano, non ogni misura migliora. Quattro foto di una consegna vera: dopo3s entrambi i nuovi uomini coperti entro2m dalla parte della porta.

Confronti visivi locali: prima verifica0partite FAIL,5immagini ispezionate; riferimenti conservati dopo blocco dell’approvazione automatica. Main originale nello stesso ambiente mostra già5avvisi, compresi gli stessi scarti menu/scatto. Nessuna tolleranza cambiata; confronto completo e limiti nelle verifiche. CI finale nella PR.

Aspetto completo PASS: gambe0/7389,0/5182,0/1373,sei viste ispezionate; iPhone54/131674, massimo ravvicinato145544. Due cambi e comandi PASS,68/139200 con14corpi completi+2comparse. Modello e UI invariati. Le sei gare standard e il replay finale sono nella CI completa; esito dell’ultimo SHA nella PR.

PrimaCI46131051913 (SHA1931bfc):23comandiPASS, sei gare83gol/222tiri, poi FAILchiamate-attacco. Corretta soltanto la fixture con vantaggio iniziale2,25m anche per le chiamate: prova completaPASS, assert invariati, codice del gioco identico. Avviata coda locale52passi saltati e CI completa definitiva; esiti nella PR, nessun primoCI spacciato per verde.

## Limiti

Il confronto di due partite per versione è diagnostico e non risolve il bilanciamento generale già aperto in v0.92. Nessuna nuova tattica di attacco, interfaccia, resa del volto o aumento delle velocità; non si garantisce che ogni entrata venga fermata. Limiti iPhone <100 chiamate e <150000 triangoli, anche cambi/replay, 14 corpi completi. Gli esiti misurati e la CI dell’ultimo SHA sono nel rapporto delle verifiche e nella PR. Nessun merge/deploy.
