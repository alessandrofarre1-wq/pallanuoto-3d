# v0.76 — finta più lenta e ritorno continuo alla carica

Ale ha inviato tre video: accenno troppo veloce e scattoso, busto che si avvita alla fine. Base main `6b0d2b9` (PR66 unita, CI45200501806 verde); ramo `codex/v076-finta-fluida`, versione 0.76.0. Stato locale pulito e nessun lavoro successivo di Claude da sovrapporre.

## Causa e correzione

Il disegno scartava la finta appena eseguito l’effetto, senza mostrare i 0,36 s di recupero. Tornava alla torsione della carica in 0,08 s; inoltre il controller spegneva e riaccendeva la posa Plask. Non era un giro completo richiesto dalla direzione del giocatore: era il cambio di posa di tutto il corpo.

La finta ora ha almeno 0,16 s di preparazione, 0,18 s di accenno e 0,36 s di recupero: 0,70–0,74 s da fermo. La ripetizione aspetta che il recupero sia concluso. Questo modifica soltanto i tempi della finta, compreso il suo effetto: passaggi, polso e frusta del tiro normale conservano i valori precedenti.

Nella tenuta umana la posa Plask rimane la base continua: si sovrappongono tre ossa del braccio dominante e una rotazione del torace limitata a 0,10 rad. Anche e gambe conservano la carica della clip; dita solidali alla mano, senza perdere la presa. L’impulso parte da zero e torna a zero durante il recupero, quindi non si riaccende una posa diversa alla fine. I sei profili personali e il lato della finta rimangono riconoscibili nel movimento del braccio.

Il tasto rilasciato interrompe subito la propria finta e avvia il tiro, anche nel recupero. Carica massima a 0,9 s, movimento con la levetta, tocco rapido di polso e controlli precedenti conservati. Nessun intervento al modello, alla faccia, al rig o ai pesi; GLB SHA256 `8fd658a8a89ad0dd242100133daf920eb6cfa492af8f39e95f6ff92124ba6745` invariato. La clip Plask integrale del tiro normale resta quella di Ale.

## File e prove

`src/finta-movimento.js` centralizza tempi e impulso; `tiri.js` e `controllo.js` applicano tempi/cadenza. `grafica/gesto-vista.js` e `pose.js` conservano il recupero nel disegno senza cambiare le giunture fisiche per quel raccordo. `grafica/tiro-plask-vista.js` mantiene la base e sovrappone braccio/torace; le falangi seguono la stessa rotazione della mano. Nuovo test `finta-fluida-v076`, script npm e passo CI prima delle sei partite. Package e documentazione aggiornati.

[Misure reali e fonte](../verifiche/v076/README.md): 24 scene / 48 cicli, 120 violazioni prima e zero dopo; salto torso 0,552 → 0,00734 rad per frame, mano 0,198 → 0,07735 m. Tutti i 24 rilasci producono un solo tiro reale, sia durante l’accenno sia nel recupero. Otto pose ispezionate sul codice finale. Le prove successive e il risultato dell’intera CI sull’ultimo SHA sono nella PR; non attribuire al candidato una CI precedente.

Prove locali: prima serie mirata9/10PASS, poi comandi PASS con misura della catena completa anziché dell’ultima vertebra locale (soglie conservate); gameplay PASS con anticipo150ms sulla durata reale e finestra200ms invariata. Verifica immagini0partite PASS, tutti5confronti ispezionati, nessun riferimento cambiato. Aspetto completo PASS:0/8539verticali,0/4316nuoto,0/1229transizioni fuori acqua;6foto ispezionate, iPhone56/131872. Due cambi con anello68/139200,14corpi completi+2comparse. Nessuna simulazione delle sei gare duplicata in locale; CI completa finale nella PR.

PrimaCI45238473320 fermata prima delle partite sul test isolato traiettorie: aggiunta nel suo contesto la nuova costante dei tempi e usato il confine reale della finta invece del vecchio0,27s fisso, con assert aggiuntivo contro un effetto anticipato. Riprova traiettorie e lint PASS, runtime invariato. CI completa finale sullo SHA aggiornato nella PR.

## Limiti e non fatto

Nessuna geometria aggiunta; restano meno di 100 chiamate e 150.000 triangoli su iPhone, anche con due cambi e replay, e 14 corpi completi. Misure finali nel rapporto delle prove. Logo C, camera in diretta, velocità unica, CAMBI in basso e riflesso solo alta conservati. Nessuna nuova meccanica, nuova animazione del viso, modifica al nuoto o ritocco globale di precisione/potenza. Nessuna taratura estesa o FPS su iPhone fisico; giudizio di Ale sulla naturalezza ancora necessario. Nessun merge o deploy.
