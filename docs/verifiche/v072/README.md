# Verifiche v0.72

Base main7827854, PR62 già unita. [Rapporto](../../versioni/v072-proporzioni-tiro-rimesse.md). Le misure vengono dalle prove eseguite sul ramo, non da FPS su un iPhone vero.

- `proporzioni.json`:4scene D/S,844/667px; diametro effettivo22,12cm, raycast sulle due porte3×0,90m, altezze bind dei14atleti1,860–1,981m; apertura mani del portiere difensivo1,215m nella preparazione campionata, non portata massima. Palla/testa0,786–0,788; appoggio sul palmo entro0,345mm. Costo di queste scene statiche63/142160, non un massimo complessivo.
- `tiro-prima.json`/`tiro-dopo.json`: copie delle misure4casi/24pose senza la lunga traccia per fotogramma. Originali `/tmp/v072-tiro-prima.json` e `dopo.json`; comando `node tests/tiro-fasi-v072.mjs --prima=7827854 --salva=... --foto=...`, seguito dalla fase finale con `--confronta=`. Entrambe le fasi usano **VIS1,10**; si sostituiscono soltanto pose/corpo. Traccia identica e SHA nel JSON, erroreJ/ballW0, callback1,175,031ms;18foto per fase, confronto ispezionato in `docs/immagini/v072/`. Non dimostra identità conVIS1,45, né certifica la fluidità attraverso sole foto.
- `rimesse.json`/`rimesse-prima.log`:56voli reali Rapier e riprese attraverso `partita.update`; stesso test sul precedente `regole.js` fallisce sulla prima GK-laterale. Sorgente precedente da `git show7827854:src/regole.js`.
- `portiere.json`:38scene mirate+4muri, aggregati320tiri a traiettoria imposta22m/s e simmetria160coppie. Non è un bilanciamento di partite; dati originali completi prodotti da `npm run portiere -- --salva=tests/screenshot/portiere-v071.json`, hash dichiarato. Scene su corpo respinte e varchi ancora liberi. Nelle traiettorie sopra le spalle a3m nessuna presa; le frequenze dipendono dalle fixture scelte.

`prove-primo-giro.log`:49/53PASS; quattro passi poi corretti/verificati nei log `gesti-fix`, `costumi-fix`, `sezione1-finale`, `rigori-finale`. Il timeout di sezione1 coincideva con una ricostruzione locale: nessun assert del gioco è stato cambiato. `traiettorie-finale.log` aggiunge il preset naturale sul rigore, conservando forza/spin/mira.

`fluidita.log` e `costumi-fix.log`: due cambi,844/667px,DPR1,5, massimo66/148150. `dimensioni-finali.log` e `proporzioni.json` sono dopo l’alleggerimento della decal cuffia. `tiro-finale.log`/`tiro-dopo.json` includono la carica anche−0,32 finale, distinta dal candidato precedente−0,46.

Esiti finali di aspetto e verifica bloccante, file/hash e CI dell’ultimo SHA sono dichiarati nel rapporto e nella PR. Le sei partite standard sono eseguite una sola volta nella CI finale. Nessuna nuova prova sulle espressioni del viso.


Chiusura locale: `aspetto-gioco-finale.log`/`immersione.json`/`aspetto-statistiche.json`: partita conclusa, gambe0/7684,0/5144,0/1200; `aspetto-foto.log`/`costi-aspetto.txt`: sei viste ispezionate, iPhone56/141336; le quattro ravvicinate sono desktop. `verifica-finale.log`: PASS indipendente con quattro riferimenti aggiornati dopo ispezione e soglia conservata(menu0,01%,tre identiche,piccolo0,00% entro tolleranza). `riprese-locali.json` conserva anche il primo confronto immaginiFAIL atteso prima di aggiornare i riferimenti; `chiusura-locale.json` conserva i duePASS finali.
