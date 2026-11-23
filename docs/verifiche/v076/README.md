# Verifiche v0.76

Base main `6b0d2b9`, PR66 unita, CI45200501806 verde. Nessuna PR più recente aperta al riallineamento. Video originali di Ale analizzati tutti e tre: durate 4,250 / 3,545 / 3,033 s, circa 60 fps. Restano locali; nomi e hash in [provenienza](provenienza.json).

## Confronto della finta

Stesso test su baseline e candidato: controller reale simulato da GamepadAPI, intero ciclo RAF/partita/updateRig, ossa del GLB caricato. 6 stili × 2 mani × 2 direzioni = 24 scene, 48 cicli completi dopo la piena carica; 12 rilasci in frusta e 12 durante il recupero. Nessuna soglia abbassata dopo la misura.

| Misura | Prima | Dopo |
|---|---:|---:|
| Salto massimo anca per fotogramma | 0,286 rad | 0 |
| Salto massimo torso per fotogramma | 0,552 rad | 0,00734 rad |
| Spostamento massimo mano per fotogramma | 0,198 m | 0,07735 m |
| Percorso angolare torso per ciclo | 3,960 rad | 0,200 rad |
| Violazioni delle soglie di continuità | 120 | 0 |

[Baseline](finta-prima.json) e [finale](finta-dopo.json). Finale: 24 tiri reali, uno per rilascio; massima carica a 0,9 s e finte ripetute senza tiro automatico. Controllo aggiuntivo nel finale su 15 falangi: variazione locale massima 5,2e-8 rad rispetto alla presa, nessuna inversione. Il controllo delle dita non era presente nella misura baseline: non inventare un confronto prima/dopo sulle falangi.

[Otto pose reali](../../immagini/v076/) dello stesso ciclo, con tempi/done in `pose.json`, ispezionate: avvio, accenno, arresto, recupero e carica successiva. Ogni passo aggiorna fisica e rig; solo 8 disegni GPU. Le immagini non dimostrano da sole naturalezza professionale e non misurano FPS su iPhone fisico. Nessun nuovo lavoro o prova sul volto.

Le altre prove locali e la CI finale sono riportate con esiti reali nel rapporto e nella PR. Sei partite standard soltanto nella CI, confronto locale con `--partite=0`, una sola Chromium pesante alla volta. Nessun nuovo campione di bilanciamento generale.

## Regressioni locali

[Prima serie mirata](prove-prima-serie.log):9/10PASS, inclusi tiro Plask, nuovo test finta, gesti fluidi, finte, desktop, gesti, replay e aspetto gioco. FAIL solo nel test comandi: leggeva la rotazione locale dell’ultima vertebra, ignorando il movimento trasmesso dai suoi genitori. Corretta la misura nello spazio del giocatore per braccio e torso; soglie .04/.01 rad conservate. Riprova separata e misure GPU riportate qui, senza trasformare retroattivamente il9/10in un PASS completo.

Riprova [comandi finale](comandi-finale.log): PASS su touch/tastiera/controller, con le stesse soglie e gli annullamenti precedenti. Il primo giro resta9/10nel log, questa è la riprova separata. [Misure GPU e comandi](comandi-misure.json) sul codice finale, con due cambi simultanei e anello; nessuna nuova geometria. Aspetto gioco finale PASS:0/8539verticali,0/4316nuoto,0/1229transizioni fuori acqua. I conteggi diversi dalla v075 non vanno chiamati partita identica: sono cambiati i tempi della finta.

[Verifica immagini locale](verifica.log) con0partite: PASS. Menu scarto0,01%, altri4scatti identici. Nessun riferimento cambiato. Le sei partite sono lasciate alla CI finale.

[Gameplay e buffer finale](gameplay.log): PASS. Il tocco del test viene ora inviato150ms prima della fine effettiva della finta più lunga, dentro la stessa finestra di200ms; tutte le soglie, gli annullamenti e il rifiuto del tocco troppo anticipato sono conservati. Nessun buffer più permissivo.

[Aspetto foto](aspetto-foto.log):6/6PASS e ispezionate, insieme ai5confronti della verifica. iPhone844/667:56chiamate/131872triangoli; vista ravvicinata massima146138triangoli. [Costi](aspetto-costi.txt). Due cambi con anello: massimo68/139200,14atleti completi e2comparse. Nessun riferimento immagini modificato. Tutti i controlli coinvolti verificati, con la riprova comandi separata dal primo9/10; non si dichiara un prove locale completo60/60.
