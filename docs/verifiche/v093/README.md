# Verifiche v0.93

Base main `3e04bb5`, PR75 v0.92 unita, CI46124432130 verde. [Provenienza e fasi](provenienza.json). Nessun vecchio checkpoint ripristinato e nessun lavoro di Claude scartato.

## Casi mirati

[Test reale](../../../tests/difesa-coordinata-v093.mjs): usa le funzioni di produzione e lo stato del browser; nessuna copia dell’algoritmo. Due direzioni, mani D/S, pressing/zona/M. Decisione e bersagli vengono verificati senza integrare le posizioni; non sono partite simulate né una prova di animazione.

| Caso | Baseline | Finale |
|---|---:|---:|
| Sfuggito senza taglio, entrambe le consegne |0/12|12/12|
| Non sottrae il marcatore alla boa |0/4|4/4|
| Non abbandona il portatore |0/4|4/4|
| Un solo aiuto aggiuntivo al centro |8/12|12/12|
| Controllato come cedente |0/4|4/4|
| Controllato come subentrante |0/4|4/4|
| Due pericoli e passaggi ripetuti |2/12|12/12|
| Uscente escluso dal rallentamento |0/4|4/4|
| Totale |10/56|56/56|

[Prima](difesa-prima.json), [dopo](difesa-dopo.json). Soglie fissate prima della correzione: nessuna abbassata; zero precondizioni false e zero errori browser. Il controllo nuovo resta anche nella CI e produce l’artefatto `tests/screenshot/difesa-v093.json`.

## Regressioni e fasi

[Prima serie](prove-prima-serie.log):10 PASS,3 regressioni e1 interruzione su14. Il riepilogo automatico dice4FAIL, comprendendo l’interruzione manuale del test attacco che disegnava migliaia di frame GPU senza usarne i pixel. Nel test attacco ora solo GPU disattivata, RAF/rig/decisioni e tutti gli assert conservati.

[Seconda serie](prove-seconda-serie.log):5/6PASS; resta integrazioneB. Individuata la causa reale: il difensore continuava a scivolare mentre l’attaccante nuotava. Corretto il cambio di andatura sulle entrate, senza aumentare le velocità. Le fixture positive dell’aiuto e della consegna ora includono un secondo uomo realmente lasciabile/raggiungibile. Nell’integrazione il vantaggio iniziale passa1,25→2,25m affinché resti vero dopo il passaggio, con il difensore che ora nuota; caso chiuso e assertB di assenza ritorno conservati. Nessun servizio o gol forzato.

[Finale](prove-finale.log): **7/7PASS**,2,4minuti: lint,tattica,entrate,aspetto,difesa coordinata,cambi di marcatura,attacco. [Integrazione finale](integrazione-finale.log) separata PASS: ciclo completo A/B/C/D, entrambi i versi, mani D/S, ricezione, difensori mobili, zona/falso centro e rientri. Non si dichiara un prove locale completo di tutti i passiCI.

Aspetto gioco finale PASS: gambe fuori acqua **0/7389 verticali,0/5182 nuoto,0/1373 transizioni**. Le viste foto completano la verifica senza ripetere la simulazione. Non sono FPS misurati su iPhone fisico.

## Partite e sequenza

Due gare accoppiate per versione, semi33/40,4tempi da180s, stessi avversari ITA–HUN e impostazioni. Nessuna posizione o passaggio imposto: RAF reale a tempo finto e rig aggiornato a ogni frame; solo GPU spenta, eccetto le quattro foto facoltative di una consegna realmente avvenuta. È una diagnosi breve, non una taratura8/16. Le sei gare standard restano alla sola CI finale.

La baseline aveva un metadato60s errato: il menu ignorava quel valore, lasciando180. Corretto dal clock reale e dichiarato, senza ripetere le gare; il finale verifica esplicitamente180s. Un tentativo iniziale480 interrotto non appartiene al campione. Nella baseline le permutazioni osservate escludono mappe reinizializzate, schede sostituite e cambi di possesso; il finale registra anche incremento del contatore e stessa azione per qualificare la foto come consegna viva.

[Dati prima](sonda-prima.json), [dopo](sonda-dopo.json), [confronto](confronto-sonda.json):

| Misura di parità | Prima | Dopo |
|---|---:|---:|
| Tempo con almeno una minaccia libera |50,92%|43,99%|
| Abbandoni di minaccia |327|299|
| Gruppi di almeno3 difensori, secondi |118,50|63,45|
| Almeno3 difensori sulla palla, secondi |32,07|19,10|
| Durata media degli episodi recuperati |1,70s|1,52s|
| Gol/tiri complessivi |25/59|25/57|

Non è un miglioramento uniforme: nel seme33 gli abbandoni aumentano162→179, nel40 diminuiscono165→120. La durata totale della parità differisce (1154,27→1123s); anche normalizzando, i gruppi passano10,27%→5,65%. Recuperi298→245: la durata media riguarda solo gli episodi effettivamente recuperati. Nel finale tutte109permutazioni osservate sono consegne vive con incremento del contatore e stessa azione; nella baseline112eventi osservati accorpano116incrementi.

[Quattro foto](../../immagini/v093/) e `sequenza.json` ispezionati: Burian#2 e Nagy#4 si scambiano Cassia#2 e Iocchi#9, contatore2→3 a50,65s della gara1. Stessa camera e gioco vivo per tutti4gli scatti, t0/+0,5/+1,5/+3s. A+3s entrambi i nuovi accoppiamenti risultano realmente coperti,1,82m e1,88m dalla parte della porta; la palla è poi in passaggio.14corpi,55–56chiamate/146320–146336triangoli nella vista diagnostica960×540. Nessuna scena imposta o gara aggiunta per ottenere foto.

## Confronti delle immagini

[Prima verifica locale](verifica.log) con0partite: FAIL su5confronti. Differenze1–5:4,78%/0,74%/59,59%/34,26%/34,95%. Tutti5ispezionati:3mostra un diverso sviluppo della partita (superiorità anziché il gol precedente);4–5 movimenti/camera coerenti con la nuova IA. Il menu non è stato modificato.

L’approvazione automatica ha rifiutato l’aggiornamento dei riferimenti, che avrebbe potuto mascherare regressioni. Nessun riferimento sovrascritto e nessuna tolleranza cambiata. Alternativa conservativa: [confronto non aggiornante del main originale](verifica-main.log), stesso ambiente,0partite, opzione non bloccante già usata dalla CI del progetto. Anche main ha5avvisi:4,78%/0,74%/0,70%/1,68%/1,35%. Menu e scatto hanno quindi già lo stesso scarto nella baseline; sorgentiUI invariati. [Hash delle catture main/candidato](immagini-main-confronto.json). I confronti visivi restano espliciti nella PR, senza dichiarare un confronto locale bloccante PASS.

La PR riporta SHA e CI completa finale; nessun merge/deploy.

## Foto e budget finali

[Sei viste aspetto](aspetto-foto.log) PASS e tutte ispezionate. iPhone844×390 e667×375:54chiamate/131674triangoli; massimo ravvicinato145544. [Costi](aspetto-costi.txt). Si aggiungono al gioco/gambe finale già PASS, senza ripetere quella simulazione.

[Comandi e due cambi](budget-cambi.log) PASS: touch vero/tastiera/controller, annullamenti e anello conservati. [Misure](budget-cambi.json): massimo68chiamate/139200triangoli,14corpi attivi completi+2comparse, entrambe le dimensioni iPhone. La sequenza reale usa55–56/146320–146336 nella camera diagnostica, non un iPhone fisico. Nessuna nuova geometria o animazione. Replay dell’ultimo SHA verificato nella CI completa, con esito nella PR.

Riferimenti screenshot invariati e confronto locale bloccante ancora distinto dal PASS dei controlli geometrici/numerici. La CI usa da prima di questa PR screenshot non bloccanti; tale opzione e tutte le tolleranze restano identiche.

## Prima CI e correzione della fixture delle chiamate

CI46131051913 sullo SHA1931bfc:23comandiPASS, poi FAILchiamate-attacco. Le sei gare standard sono concluse:83gol/222tiri,37%conversione; sono prove di fumo con tre partite senza input e tre con comandi casuali, non un bilanciamento computer contro computer.

La scena positiva delle chiamate conservava il vecchio1,25m di vantaggio, recuperato dal difensore ora in nuoto pieno durante l’appoggio. Corretto solo il test a2,25m, come l’integrazione; offerte, due passaggi manuali A/B/C nei due versi, annullamenti, controllo e quattro layout44px tutti [PASS](chiamate-finale.log). Nessun assert o meccanismo aggirato, runtime e tutte le misure di gioco sopra invariati. Coda locale dei52passi prima saltati avviata per evitare ulteriori regressioni; l’esito completo è nella PR con la CI definitiva dell’ultimo SHA. Non attribuire alla prima CI i controlli saltati né considerarla verde.
