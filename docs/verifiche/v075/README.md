# Verifiche v0.75

Base main1ec69ca(PR65); versione0.75.0. La CI della PR è la fonte finale sullo SHA pubblicato. Non confondere le fasi qui sotto e non attribuire al codice finale le vecchie foto dello scatto.

## Prima serie locale

[prove-prima-serie.log](prove-prima-serie.log):13/13PASS in6min, inclusi tiro visuale/registrato, rig mani, gameplay, espulsioni, nuoto coerente, gioco fermo, orientamento, replay, sezioni2/4 e aspetto gioco. Prima delle ultime modifiche boa/rubata. [Aspetto](aspetto-prima-serie.log):0/7707gambe verticali fuori acqua,0/5075in nuotata,0/1218intermedie. Non è una taratura finale.

Prove separate già PASS: [desktop](desktop.log), [finte](finta.log), [home](home.log), [regia tiro](regia-tiro.log). Regia aggiornata per misurare il tempo dopo una presa reale e le ossa reali del braccio; nessuna soglia rilassata. Vecchio power e flag tiroVista non più presenti, assert sui nuovi segnali reali.

## Codice finale

Comando: input touch attendibile (CDP), tastiera e GamepadAPI simulata; nessuna scrittura diretta di inp/keys. Polso, finte con braccio/busto in movimento, tiro unico al rilascio, annullamenti e geometrie della boa. Scatto: quattro tempi×due direzioni, esclusioni residue, cambio reale nel countdown, input/CAMBIA e prima presa fisica.

[Comando finale](tiro-comando.log) PASS:64scelte su16assetti D/S×due porte, indipendenti dal contatore;6ricezioni reali con un solo lancio ciascuna (4dopo presa,2al volo), beduina e sciarpa entrambe. [Misure](tiro-misure.json): tre finte durante la tenuta nei quattro canali; movimento braccio1,645–2,482rad/core0,279–0,428rad dopo PRONTO. Due cambi simultanei e anello: massimo68chiamate/139200triangoli nelle due taglie e camera larga,14atleti completi+2comparse.

Foto UI [667](../../immagini/v075/ui-tenuta-pronta-667.png) e [844](../../immagini/v075/ui-tenuta-pronta-844.png) ispezionate: TIRO PRONTO, anello, energia e CAMBI leggibili, TAGLIO e power assenti. Sono il canvas TV fermato con HUD reale sovrapposto, non un filmato continuo; i comandi vengono provati sul ciclo completo. Foto e dati finali conservati in questa cartella e in `docs/immagini/v075/`; nessuna misura di FPS hardware. Sei partite standard una sola volta nella CI, confronto immagini locale con0partite. Nessuna prova del volto. Il test dello scatto ora aggiorna il rig a ogni passo: le foto precedenti a1s con corpo a L sono invalide e non si allegano.

Limiti vincolanti: meno100chiamate e meno150000triangoli,14corpi completi, anche due cambi/replay. Runtime GLB SHA2568fd658a8a89ad0dd242100133daf920eb6cfa492af8f39e95f6ff92124ba6745 invariato.

[Scatto finale](scatto-misure.json) PASS:8scene,4tempi e2direzioni; prima presa4,05s, passo massimo5,03cm, nessun cambio delle statistiche e14corpi. Foto countdown/crawl1s nei due versi in `docs/immagini/v075`, tutte ispezionate dopo la correzione del test: torso e gambe allineati nel nuoto; posa verticale prima del via. Non modificato il nuoto runtime.

Rubata: [prima del fix](rubata-prima.json) il percorso reale dello slancio produceva stop/sfondamento e restituiva il possesso. La stessa scena nel dato finale resta in play, cronometro avanti1/60s, recuperante con palla e possesso, nessuna ripresa pendente. Un solo contrasto pulito; niente giveBall imposto al recuperante nel test, niente immunità aggiunta.

Lint finale e `git diff --check`: PASS. Provenienza dei file runtime in [provenienza.json](provenienza.json); nessun riferimento a una CI del codice non committato.

## Confronto immagini finale

`verifica --partite=0`: [primo confronto](verifica-prima-riferimenti.log) FAIL su4riferimenti della v074; menu entro tolleranza0,01%. Tutti5confronti ispezionati. Nuovo scatto cambia occupanti e sviluppo reale dell’azione:7,14%sprint,47,09%azione,33,17%iPhone piccolo,36,28%orizzontale. TAGLIO assente e nuova istruzione polso corretti. Aggiornati solo2/3/4/5 con gli scatti appena ispezionati, menu conservato; [hash e fase](riferimenti.json). Non si chiama retroattivamente PASS questo giro locale e non si ripetono le simulazioni: la CI finale esegue le6partite e rilegge i riferimenti. Browser locale di sistema tramite shim di cache, nessuna modifica alle dipendenze o al browserCI.

[Aspetto foto finale](aspetto-foto.log):6/6viste PASS e ispezionate, [costi](aspetto-costi.txt). iPhone844/667:56chiamate e131872triangoli; massima vista vicina146138triangoli. Immagini in `docs/immagini/v075/aspetto`. È la metà foto finale, distinta dalla partita/gambe della prima serie; il gioco/gambe finale viene ripetuto una volta nella CI completa.

[Regressione v046](v046.log): PASS sul codice finale, includendo letto geometrico della spalla invece della vecchia rovesciata ogni4tiri; schemi/minuti invariati. Nessuna soglia di sicurezza o qualità abbassata. La CI include59comandi npm e rende disponibili anche i risultati dei sei incontri standard e del replay sullo SHA finale.

## Prima CI e aggiornamento del test d’inizio tempo

[CI45069119661](https://github.com/alessandrofarre1-wq/pallanuoto-3d/actions/runs/45069119661), SHA b5aae8d:6partite completate,108gol/257tiri, verifica PASS con5avvisi immagini non bloccanti (font server; scarti1,04–5,64%). Non sono dati di taratura. Poi FAIL in entrate-integrazione: il vecchio assert conservava il controllato precedente anche al kickoff. Il nuovo requisito seleziona invece lo scattista più veloce. Nel setup tutti hanno Velocità90, quindi indice1; aggiornata questa attesa precisa, conservati tutti gli assert di schema/difesa/riposizionamento e il controllo manuale nelle altre riprese. [Estratto CI](ci-prima-serie.log), [regressione locale dopo fix](entrate-integrazione.log) PASS.

Nessuna modifica runtime dopo quella CI: corretto soltanto il test e documentata la fase. Il fallimento interrompe gli altri passi: serve quindi una nuova CI intera sull’ultimo SHA, che ripete anche il suo giro standard; nessuna simulazione aggiuntiva locale. La precedente previsione di un unico giro CI è superata da questo arresto del test. Risultato finale nella PR.
