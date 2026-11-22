# Sorgenti mani runtime v0.73

Le mani sono derivate dalla topologia umana hm08 di MakeHuman (CC0), non dalle sfere e capsule della prima consegna Plask. La provenienza, il commit upstream e gli SHA256 sono in `makehuman/PROVENIENZA.json`; le licenze degli asset sono incluse. Nessun codice AGPL MakeHuman è utilizzato.

Il file immutabile `pallanuotista-v072.glb` è l’input del gioco v0.72, SHA256 `7a04a40e9a257cd4c724edabf7b0278eeb4f261a4d6bcc85da0289b0e8892b28`.

Rigenerare il modello runtime completo con Blender 4.3.2 e dipendenze npm installate:

```sh
node strumenti/rigenera-mani-v073.mjs
```

La pipeline crea una base temporanea, compatta i buffer conservando esattamente i dati usati, installa il GLB e rigenera gli indici di riserva. Verifica poi il rig con `tests/rig-mani-v073.mjs`. Il volto, le18morph e le24giunture originali restano quelli della v0.72. Il tentativo di rig facciale è stato sospeso da Ale ed è escluso da questo ramo.

Il builder basso livello `runtime-mani.py` accetta `--target-triangles`, `--output`, `--report`, `--atlas` dopo `--`; per produrre candidati usare sempre `--output`.

## Modello mani misurato

- 8366 triangoli e 8599 vertici: 650 circa per mano, con tre falangi per ciascuna delle cinque dita.
- 54 joint della skin: 24 originali intatti più 30 falangi. Due nuovi marker `palmo_l/r` esterni alla skin, senza modificare i 24 rest originali.
- Un’unica primitiva e un unico materiale. Atlante 2048×1024: metà sinistra identica pixel per pixel all’immagine originale; metà destra per mani e raccordi.
- Altezza e estremi verticali originali conservati. 18 morph e 4 maschere shader conservati nel modello runtime; nessuna patch del volto viene applicata.
- Semplificazione del corpo mediante sola lista indici, con vertici dei morph facciali e articolazioni protetti. Nessun corpo è rimosso.
- Raccordi dei polsi ricuciti seguendo il bordo geometrico: nessun triangolo nullo e nessuna differenza di pesi fra duplicati UV. Il modello non supera i contratti 9042 triangoli / 9023 vertici.

`runtime-mani.json` descrive il contenitore del builder prima della compattazione; `qa-rig-mani.json` descrive l’asset compatto. Include assi, teste/code, marker, errore di semplificazione e SHA effettivo. Il polso/contatto palla vanno verificati nelle vere pose del motore; il conteggio geometrico non dimostra da solo qualità o fluidità su iPhone.
