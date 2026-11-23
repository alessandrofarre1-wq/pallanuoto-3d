# Verifiche v0.77

Base main `7218d09` (PR67 unita), CI45246753540 verde. Il [file di provenienza](provenienza.json) identifica il video di Ale (3,683s,548×532, circa60fps), modello e dati Plask invariati. Video originale locale, non ripubblicato.

## Confronto dell’avvio

Lo stesso test esteso gira prima sulla v0.76 e poi sulla v0.77: GamepadAPI, RAF/partita/updateRig reali, ossa del modello caricato.24scene,6stili×2mani×2direzioni.73campioni per scena da0 a1,2s, incluso il frame precedente alla pressione. Mantiene anche48cicli dopo piena carica,24rilasci durante frusta/recupero e controllo delle15falangi dominanti.

| Massimo per fotogramma nell’avvio | Prima | Dopo |
|---|---:|---:|
| Anca |0,59294rad|0,03798rad|
| Torso |1,00641rad|0,03170rad|
| Spostamento mano |0,41923m|0,07595m|
| Violazioni |120|0|

[Baseline](finta-prima.json), [finale](finta-dopo.json) e log omonimi. Le120violazioni sono tutte nell’avvio: cicli caricati e rilasci passavano anche prima. Soglie fissate prima della correzione, mai abbassate: anca/torso<0,12rad/frame e mano<0,16m/frame; picchi di braccio/avambraccio/polso entro max(0,15rad,1,5×picco dei cicli caricati). I massimi dell’intero avvio includono la prima finta sovrapposta: non confonderli con il solo ingresso prima dei0,45s.

Quattro rilasci precoci a0,4s,D/S×due direzioni: un solo tiro ciascuno, potenza0,4/0,9 e avvio immediato, senza attendere il raccordo0,70s.24rilasci carichi: un tiro reale per rilascio. Massimo0,9s, ripetizione e assenza di tiro automatico conservati. Zero errori browser.

[Otto pose](../../immagini/v077/) a0/0,1/0,2/0,35/0,5/0,7/0,9/1,15s, stessa camera3/4; tempi e stato in `pose.json`. Fisica e rig aggiornati a ogni frame, soltanto8disegni GPU. Ispezionate. Non misurano FPS su telefono o qualità professionale; nessuna prova sul viso.

## Regressioni locali

[Serie mirata](prove-esiti.json): **10/10 PASS**, 6,3 minuti, build e log `prove-*.log`: lint, tiro registrato, comandi, gameplay, gesti fluidi, finta, desktop, gesti, replay e aspetto gioco. Il nuovo test d’avvio è stato eseguito separatamente nel confronto sopra; non si dichiara un prove locale completo di60passi.

Aspetto gioco: gambe fuori acqua **0/8539 verticali,0/4316 nuoto,0/1229 transizioni**. [Comandi e foto GPU](comandi-foto.log), eseguiti poi con `--foto` per misurare anche i due cambi: touch reale/tastiera/controller e annullamenti PASS; massimo **68chiamate/139200triangoli**,14corpi completi+2comparse, anello attivo. [Misure](comandi-misure.json). Replay, nella serie mirata: massimo49chiamate/136678triangoli,14corpi.

[Verifica](verifica.log) con0partite PASS: cinque confronti ispezionati, menu0,01%, tre scatti identici e altri entro tolleranza (iPhone grande0,00% arrotondato). Nessun riferimento aggiornato. [Aspetto foto](aspetto-foto.log) completa6/6viste senza ripetere la simulazione; tutte ispezionate. [Costi](aspetto-costi.txt): iPhone56/131872, massimo ravvicinato146138triangoli. Le foto arena/UI non modificate restano locali; le8pose rilevanti sono pubblicate sopra.

La CI intera dell’ultimo SHA si legge nella PR. Nessun campione esteso di bilanciamento; sei gare standard soltanto nella CI finale. Una sola Chromium pesante per volta.
