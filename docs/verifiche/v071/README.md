# Verifiche v0.71

Diagnostiche archiviate durante lo sviluppo di portiere, palla, stamina e traiettorie. Il [rapporto](../../versioni/v071-portiere-tiri-stamina.md) distingue le diagnostiche iniziali dalla chiusura sul codice finale; [provenienza.json](provenienza.json) riporta origine, SHA-256 e limiti delle misure.

| File | Contenuto e limite |
|---|---|
| [contatto-nodi.log](contatto-nodi.log) | Quattro prove Node eseguite in sequenza per l'archiviazione:51scene di sweep, profilo26sfere/mano6,8586m/s, presa e deviazione; tutti con uscita0. Nessun browser. |
| [portiere-prima-estratto.json](portiere-prima-estratto.json), [portiere-dopo-estratto.json](portiere-dopo-estratto.json) | Aggregati320tiri per fase,38scene mirate e tracce dei due casi contatto/linea nello stesso fotogramma. Omesse le320tracce individuali e le misure accessorie; originali e hash dichiarati. Traiettorie imposte, primo esito, non bilancio di partite. |
| [proporzioni-prima.json](proporzioni-prima.json) | Copia integrale della diagnosi iniziale: quattro pose statiche di Nicosia, porta3×0,90m, palla fisica22,12cm/visiva39cm. Altri giocatori nascosti. |
| [dimensioni-palla.json](dimensioni-palla.json), [log](dimensioni-palla.log) | Copie integrali: quattro scene D/S667/844px,22,12cm, render con fisica invariata.63calls/143000tri è il carico di queste scene statiche, non il massimo finale. |
| [stamina.json](stamina.json), [log](stamina.log) | Copie integrali:60stati HUD,0errori,0%compreso; cambio automatico73% nel log separato. |
| [traiettorie.log](traiettorie.log) | Copia integrale:22scene/42voli Rapier nei due versi, vecchia/nuova formula nella medesima prova senza browser. Include `doShoot`, CPU e comando umano. |

I file browser originali non contengono data, comando o SHA dei sorgenti incorporati. La provenienza conserva ciò che è disponibile senza attribuire loro il commit finale. I comandi portiere sono quelli comunicati dall'esecutore. PNG selezionate di contatto/varchi/stamina/replay e confronto iPhone in `docs/immagini/v071/`; gli originali restano nelle cartelle `/tmp` dichiarate.

## Chiusura

- `contatto-nodi-finale.log`:5suite Node, lettura corpo/braccia inclusa;50bersagli e limite mani.
- `dati-tesi.log`/`rigori-finale.json`:188/240rigori,78,3%,240lanci reali.
- `statistiche.log`: tiro standard0,7, campioni accoppiati, rapporto2,25, assert conservati.
- `replay.log`/`replay-misure.json`:18scene/558frame,palla≥4,20pxCSS,primo piano≥2×,foto vere ispezionate;48/146426,14corpi.
- `aspetto.log`, `immersione.json`, `costi-aspetto.txt`: completo PASS; gambe0/7502,0/5300,0/1198;iPhone56/142102 e55/142100. Le altre4viste ravvicinate usano profilo desktop, non sono limiti iPhone.
- `fluidita.log`: due cambi, massimi61/145944 su844px e60/145942 su667px, DPR1,5. Non sono FPS su hardware Apple.
- `bilancio-prima.*`/`bilancio-finale.*`:8+8gare480s/stessi semi, finale4/15voci; limiti nel rapporto. `bilancio-candidato-iniziale.*` è una fase precedente, non il finale.
- `prove-primo-giro.log`:48/51,tre regressioni poi corrette; esiti successivi nei log dedicati e CI intera dello SHA finale nellaPR.
- `verifica-prima-riferimenti.log`, `ispezione-riferimenti.*`, `verifica-finale.log`:5confronti ispezionati,solo2–5aggiornati,verifica bloccante indipendente PASS(menu0,01%,3identici,orizzontale0,00%entro tolleranza).
- `sorgenti-finali.json`:SHA256 dei sorgenti congelati prima del collaudo finale. Test legacy aggiornati e fonti dei log in `provenienza.json`.

Il foglio tiro opzionale è stato interrotto dopo rendering software troppo costoso; nessun PASS attribuito a quel comando. Sei fotogrammi del replay reale sono stati ispezionati e due sono archiviati in `docs/immagini/v071/`. Resta da leggere la CI INTERA dello SHA finale nellaPR; restano fuori da queste prove iPhone fisico, giudizio di Ale e bilanciamento generale. Nessuna deroga ai limiti e nessuna nuova prova facciale.
