# Verifiche v0.74

Base main9e95c00 (PR64), versione0.74.0. Il finale contiene **415pose/52ossa**, tutta la sequenza animata esclusa la Tpose artificiale iniziale; GLB runtime identico alla base, nessuna modifica al volto. Hash di sorgenti/modello/video in [provenienza.json](provenienza.json). La CI dell’ultimo SHA pubblicato è indicata nella PR e verifica l’intera suite di56comandi, comprese le sei partite standard una sola volta.

## Esiti locali e fase

- Primo `prove --solo=lint,tiro-visuale,tiro-registrato,rig-mani,dimensioni-palla,gesti-fluidi,costumi,replay,desktop,aspetto`: **9/10PASS**, candidato con52ossa e sola finestra finale del clip. FAIL nella misura palla/testa proiettata sulloZ del campo: la testa ruotata includeva anche la profondità. Questa fase è superata; non venderla come finale. [Log](prove-candidato.log).
- Misura corretta negli assi anatomici della testa, in metri, senza modificare la mesh o abbassare gli assert0,7–1,0 /5mm. Dopo estensione a tutta la clip415pose: `prove --solo=lint,tiro-registrato,dimensioni-palla,replay,aspetto` **5/5PASS**, 4,5minuti. [Log finale](prove-finale.log). I controlli non coinvolti già superati restano distinti; non si dichiara un `prove` locale55/55.
- `tiro-registrato`: tutte le52ossa, sourceSHA corretto e GLB runtime invariato; caviglie/punte e palmi verificati nella mesh del rig D/S, interpolazione normalizzata. Esultanza:60campioni nei due sensi, normale palmo/frontale minima0,579→0,919, flessione polso5,73°→2,29°. [Log](tiro-registrato.log), [prima](esultanza-prima.json), [dopo](esultanza-dopo.json).
- Confronto fisico indipendente finale `tiro-fasi-v072 --confronta=prima.json`: **PASS**, D/S×due direzioni,24pose/18foto, callback una volta, rilascio175,031ms, erroreJ/ballW0. Traccia identica alla base, SHA2efc0a24… [Dati](fasi-prima-dopo.json). Il prototipo parziale e la finestra2,117s sono stati sostituiti: i fogli mostrano il finale415pose.
- Sequenza continua da `startAct`/`doShoot`:32render a circa30Hz nella scena isolata, carica, rilascio fisico e recupero. [Dati](sequenza.json), [filmato](../../filmati/v074-tiro-plask.mp4), [foglio](../../immagini/v074/sequenza-tiro.jpg) ispezionato per intero. Non è una partita CPU completa o una misura FPS su iPhone.
- `verifica --partite=0`: **PASS** bloccante, qualità13controlli, tornei17gruppi, cinque immagini0,01/0,44/0,33/0,31/0,25%. Confronti ispezionati, nessun riferimento aggiornato. [Log](verifica-immagini.log). Le sei partite standard sono riservate alla CI.
- Aspetto completo, due metà sulla stessa build: partita/gambe **PASS**, sei viste **PASS** e ispezionate. Gambe fuori0/7684 verticali,0/5144 nuoto,0/1200intermedie. [Immersione](immersione.json), [gioco](aspetto-gioco.log), [foto](aspetto-foto.log).

## Budget misurato

- Finale415pose, due iPhone844×390 e667×375 nell’aspetto: **56chiamate/131872triangoli**;14corpi presenti. Sei viste in `docs/immagini/v074/aspetto`.
- Replay sul finale415pose: **48chiamate/136482triangoli**,14corpi nei due schermi, memoria archivio22009580byte. Le18scene/558campioni di leggibilità passano. [Log finale](replay-finale.log).
- Proporzioni finale: palla22,12cm, porta3×0,90m, campo25×20m, contatto del palmo entro5mm,14corpi e meno100chiamate/150000triangoli. [Dati](dimensioni-palla.json).
- Due cambi: **66chiamate/138686triangoli** nella prova costumi del candidato; mesh/rig e scena di cambio invariati. [Log con fase esplicita](costumi-candidato.log). La CI intera ripete il caso sul finale; usare il suo risultato per lo SHA pubblicato, senza attribuire automaticamente al finale misure precedenti.

Nessun test o sviluppo facciale nuovo. Il giudizio sulla naturalezza resta ad Ale; i numeri non certificano qualità professionale o FPS di un telefono reale. Limiti, fonti e non fatto nel [rapporto](../../versioni/v074-tiro-plask.md).
