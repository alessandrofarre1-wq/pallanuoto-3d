# Verifiche v0.73 — mani e polsi

Base main `1452f1ab52e95a80dfb2c0d33156a49a7d4a5d43`, PR #63 unita. Ramo `codex/v073-mani-polsi`. Questa cartella riguarda l'integrazione delle mani; nessun nuovo volto è stato applicato o valutato.

## Asset finale

GLB runtime SHA256 `8fd658a8a89ad0dd242100133daf920eb6cfa492af8f39e95f6ff92124ba6745`: 8366 triangoli, 8599 vertici, 54 joint. Una primitiva e un materiale. `rig-mani.json` e relativo log vengono dalla prova indipendente sul file finale. Le 24 rest originali e le 18 morph sono conservate; dita pesate separatamente, controller solo sulle rotazioni.

`raccordo-polsi.json` si riferisce al contenitore del builder prima della compattazione (SHA `6eef1439…`). La compattazione elimina dati inutilizzati, senza cambiare quelli referenziati; `compattazione.json` registra le dimensioni prima/dopo. `riserva.json` documenta gli indici rigenerati per lo stesso asset. Due fotografie del modello finale e i limiti dell'ispezione sono in `ispezione-mani.json`.

## Esecuzione finale

`prove.log`: **54 PASS, 0 FAIL**, 22,7 minuti sul codice finale; include lint, rig, palla, costumi, replay, nuoto/gesti, gioco/gambe e tutte le altre regressioni della CI, esclusa `verifica`. `aspetto-gioco.log`/`immersione.json`: partita conclusa, gambe fuori 0/7684, 0/5144, 0/1200. `verifica.log`: PASS finale con `--partite=0`, qualità e 17 gruppi dei tornei superati, cinque confronti immagini entro tolleranza. Il primo giro (`verifica-prima-riferimento.log`) aveva un solo scarto, 0,58% nella scena azione; tutti i confronti sono stati ispezionati e solo il riferimento 3 aggiornato. SHA prima/dopo e soglia invariata in `riferimento-immagini.json`. Le sei partite standard vengono eseguite soltanto dalla CI finale.

`aspetto-foto.log` e `aspetto-costi.txt`: sei fotografie sulla stessa build del controllo gioco/gambe, tutte ispezionate; entrambe le viste iPhone 56 chiamate/131.872 triangoli. `costumi.json`: 24 bandiere, 14 corpi, due riserve simultanee su 844/667; massimo 66 chiamate/138.686 triangoli, zero errori pagina/WebGL/shader. `replay.log`: massimo 22.009.580 byte, 49 chiamate/136.678 triangoli, 18 scene/558 campioni di leggibilità passati.

`palla.json`/`palla.log`: quattro scene finali, mani destra e sinistra su 844/667, proporzioni e contatto del palmo verificati. I file qui conservati si riferiscono al modello finale; le misure dei candidati preliminari sono escluse.

La CI dell'ultimo SHA pubblicato è la fonte dell'esito completo: vedere il collegamento nella PR. Non attribuire al file finale gli eventuali esiti di un candidato precedente. Nessun merge o deploy.

## Limiti

Meno di 100 chiamate e meno di 150.000 triangoli su iPhone, inclusi due cambi e replay, con 14 corpi completi. Le prove browser usano rendering software: non misurano gli FPS di un iPhone fisico e non certificano una resa artistica professionale.
