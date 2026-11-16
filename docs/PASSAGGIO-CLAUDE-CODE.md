# Passaggio corrente — WATERPOLO 7 v0.48

```text
Continua alessandrofarre1-wq/pallanuoto-3d, branch
codex/v048-replay-regia-leggibile, versione 0.48.
Prima controlla main, PR recenti, stato locale, CLAUDE.md e CI:
Claude e Codex lavorano in parallelo. Non duplicare modifiche.
Base 933654b dopo PR #43 v0.47; conservati nuoto v0.45 e IA/regole v0.46.
Leggi docs/verifiche-v048.md e docs/misure-replay-v048.json.

Ale autorizza un replay più ambizioso sul riferimento FIFA e insiste sulla
comprensibilità. Implementati 0,6 s diretta + 5,2 s replay saltabile + 1,2 s
rimessa. Motore congelato solo con archivio valido; fine e Salta attraversano
una volta sola il residuo dello stop originale. Nessun recupero, cambio,
cronometro, gol o statistica aggiuntivi. Risultato e premiazione aspettano
la fine della clip; gestita la rotazione anche nel ramo finale.

Fonte vera fino a 3 s: arrivo del passaggio, ricezione, alzata, rilascio,
rete e reazione. Camera FERMA durante ricezione e intero volo; avvicinamento
morbido solo dopo il gol, stesso lato e orientamento. Fit prospettico sui
punti critici e margini DOM/notch. Rallenty legato a rilascio/rete.
Identità registrata: niente primo piano della riserva appena subentrata.
Pose.js aggiunge una piccola esultanza vera (mano su dopo rete), registrata.

Arena: cimasa con spessore/smusso e due tribune basse alle testate;
stessa mesh/atlante 1024, 388→552 triangoli (+164). Pareti 4→1 mesh,
48 triangoli invariati. I 14 corpi in campo restano completi.
Sei foto vere in docs/immagini/v048-replay-regia-* e tavola
v048-replay-sequenza.jpg: stessa beduina fisica, tre momenti, due telefoni.

npm run replay usa tests/replay-v048.mjs, che sostituisce il test v047.
PASS locale: 558 fotogrammi, 18 sequenze, due direzioni, tiri da fuori/ala/
palombella, 844×390 e667×300, anche margini 44/44/21. Punti critici liberi
dalle scritte; palla minima 5,46 px CSS. Replay con due comparse: max
49 chiamate/146360 triangoli. Diretta con due cambi: max62/147652 su
entrambe le viste. Buffer34episodi: max16676528 byte contati,19 texture
finali (tetto32),≤106campioni. La fixture dell'ala inizialmente trovava
una parata vera: portiere posizionato dal lato opposto per isolare la camera;
gol sempre fisico e assert invariati. Non alterare l'IA per far passare test.

Prima della PR: lint, verifica, aspetto e CI INTERA verde sull'ultimo SHA.
Sei gare in CI una sola volta; per sole PNG verifica --partite=0, con
ispezione prima di aggiornare i riferimenti. Esiti/link definitivi nella PR.
Non dichiarare PASS una prova soltanto avviata.
PLAYWRIGHT_BROWSERS_PATH=/tmp/pallanuoto-browsers nel workspace cloud.
Conserva <100 chiamate/<150000 triangoli su iPhone ANCHE con due cambi,
14 corpi interi, cartoon, SPEED1, sprint a tocchi, riflesso solo alta,
MAX0,9s/tiro al rilascio, logo C e CAMBI in basso.

NON FATTO: telecronaca, barra oscillante, bonus/Sfide/progressione,
replay manuale/serie rigori, tribune animate, nuovi GLB, arena fotorealistica.
Nessuna misura FPS su iPhone fisico. Non ampliare lo scopo senza richiesta.
Nessun merge/deploy. Ogni PR aggiorna CLAUDE con versione/file/misure/non fatto
ed evidenzia decisioni superate. Preserva lavoro locale e di Claude.
```

## Archivio v0.41 e precedenti

Il testo seguente è storico, superato dal passaggio corrente sopra.

```text
Continua alessandrofarre1-wq/pallanuoto-3d, branch
codex/v041-tecnica-schemi-centroboa e relativa PR in bozza.
Leggi CLAUDE.md, docs/verifiche-v041.md e docs/tecnica-v041.md.
Non chiedere ad Ale di rispiegare. Non duplicare la v0.40 già su main.

Implementato e verificato con scene mirate: centroboa geometrico,
anticipo/girata fisici senza rigori gratuiti, passaggi adiacenti e skip
condizionati al vantaggio/rischio, pali mobili, aiuti con ritorno, una
entrata con copertura, cinque preset ed editor prepartita reale.
La nuova pausa spiega con nove carte SVG cosa fanno attacco e difesa,
richiama il piano personale, mostra ruoli/compiti e Riprendi resta visibile.
Il codice è già sul branch; non ripartire da una proposta.

DA CHIUDERE prima di rendere pronta la PR:
1. CI checkpoint43686710038 fallisce sezione3: centrale destro, difensore
   a1.71m dove l'assert richiede<1.3m. Indaga tests/sezione3.mjs e
   anticipo/markTarget/postura; correggi la causa senza indebolire la prova.
2. npm run verifica ha concluso tutte6gare,74gol/260tiri(28%), ma fallisce
   tre riferimenti grafici vecchi(1.67%,8.42%,7.56%). Ispeziona gli screenshot
   e aggiorna solo quelli corretti: npm run verifica:aggiorna -- --partite=0,
   poi npm run verifica -- --partite=0. Non rifare6gare per soliPNG.
3. Controlla TUTTA la CI sull'ultimo SHA, comprese fasi successive a
   sezione3. Documenta risultati veri in rapporto/CLAUDE/descrizione PR.
   La bozza non è pronta da unire finché resta un errore.

GiàPASS: lint0warning, aspetto completo(0gambefuoriacqua), centroboa,
tattica, gameplay v0.40 con assert invariati, strategie incluso pausa,
sezione4 e UI tre taglieiPhone. Dettagli e numeri nel rapporto.
Browser cloud: PLAYWRIGHT_BROWSERS_PATH=/tmp/pallanuoto-browsers.

Vincoli: versione0.41 nella STESSA PR; ogni nuovaPR+.01; aggiornaCLAUDE
con file/misure/nonfatto e segnala decisioni cambiate. iPhone SEMPRE
<100drawcall e<150000tri anche duecambi: misurati max69/148734.
Nessuna deroga.14corpi completi,cartoon,camera unica,SPEED1,sprinta tocchi,
riflesso soloalta,ombraespulso,palla senza contorno,MAX0.9s e tiroalrilascio,
CAMBI basso centro44px. Nessuna promessa60FPS suApplefisico.
RegolamentoWA18feb2026: non fondere FINottobre e manuali storici30/20/5.

Limiti onesti: un solo slotpersonale; no sequenzearbitrarie multi-fase,
arbitraggio contatti semplificato, no vero7movimentisti. Le campagne
salvano fra gare; uscire durante la gara la fa ricominciare con avviso.
Non fare merge/deploy senza istruzione di Ale.
Salva e spingi i blocchi verificabili prima di una nuova prova lunga.
```

## Storico v0.40

La v0.40 implementa i tornei nel gioco. Il precedente passaggio v0.39, che li descriveva come proposte, è sostituito da questo documento.

```text
Continua alessandrofarre1-wq/pallanuoto-3d per Ale. Leggi prima lo stato
più recente in CLAUDE.md e docs/verifiche-v040.md. Controlla stato remoto,
branch codex/v040-tornei-menu-gameplay e relativa PR prima di lavorare:
potrebbe essere già stata unita. Non duplicare il lavoro e non pubblicare
direttamente su main. Non chiedere ad Ale di rispiegare queste richieste.

Già implementato nella v0.40:
- Partita singola, Mondiali e Europei dalla nuova home.
- Tornei: nazionale, sorteggio per fasce salvato, calendario, classifiche WA,
  simulazioni delle altre gare, eliminazione e bronzo opzionale.
- Mondiali: formula Singapore 2025, vincitrice in 6/7 gare; Europei: formula
  Belgrado 2026, seconda fase con scontri fra qualificate riportati,
  semifinali/finale senza quarti, vincitrice in 8 gare.
- Otto nuove rose ufficiali (nomi/cuffie/ruoli generali/mano).
  Forza, rating e assegnazione ai sette posti sono stime dichiarate.
  Le sedici rose precedenti sono identiche; generatore riproducibile 24 rose.
- Rigori finali giocabili nei tornei: cinque tiratori, anticipo, oltranza,
  comando TIRO e fisica veri, gol separati dal risultato regolamentare.
- Home/pausa/tattiche/centro torneo, coppe distinte, medaglie, cerimonia
  illustrata saltabile e bacheca con percorsi persistenti.
- Campagna salvata FRA le gare. Uscendo a metà gara la conferma avverte
  che la gara ricomincia: NON c'è ripresa esatta della palla a metà azione.
- Buffer passaggio/palombella negli ultimi 200 ms del gesto, destinatario
  umano stabile, appoggi brevi dei compagni e AI rapida sui vantaggi reali.
- Arena leggera: porte 3x0,90 m/pali 80 mm/rete profonda 0,80 m dal
  riferimento di Ale, gradoni/pubblico/accessi/panchine/bordo e corde.
  Il GLB originale resta conservato, non caricato nella partita.

Vincoli invariabili di Ale:
- Ogni PR aumenta la versione di 0.01 e aggiorna CLAUDE.md: cambiamenti,
  file, numeri realmente misurati, cosa non è fatto. Segnala ogni decisione
  precedente modificata.
- iPhone SEMPRE meno di 100 chiamate e 150.000 triangoli, anche durante
  due cambi simultanei. Nessuna deroga autorizzata.
- Prima della PR: npm run lint, npm run verifica, npm run aspetto;
  risultati effettivi nella descrizione, mai chiamare PASS una prova fallita.
- Stile cartoon, camera unica, SPEED=1; sprint a tocchi è una decisione
  di Ale, non cambiarlo di nascosto. Riflesso completo solo alta,
  ombra dell'espulso presente, palla senza cerchio nero, tiro al rilascio.
- CAMBI resta basso centro, fondo trasparente, area di tocco 44 px.
- Prova cambi all'equilibrio con scene e semi ripetibili. I test automatici
  non dimostrano piacere di gioco o 60 FPS su iPhone fisico.

Non rifare analisi già implementate come se fossero ancora da iniziare.
Parti dai risultati in docs/verifiche-v040.md e dai feedback reali di Ale.
Lavori successivi eventuali: bilanciamento dopo prova su iPhone, salvataggio
preciso dentro la gara, cerimonia con corpi 3D, scelta manuale ordine dei
rigoristi e portiere. Questi ultimi non sono già realizzati.

Sviluppa per blocchi concreti; salva, committa e spingi il branch prima
di un nuovo blocco lungo. Non promettere durate o crediti residui che
non puoi osservare. Nessun merge/deploy senza istruzione di Ale.
```

Punti di ingresso: `tornei.js` (campagna), `menu.js` (flusso e storage), `rigoriFinali.js`/`regole.js`/`partita.js` (serie), `grafica/arena.js` (ambiente), `controllo.js`/`ia.js`/`tiri.js` (gameplay), tutti in `src/`. La bozza HTML v0.39 è storica; la home vera è in `index.html`/`src/stile.css`.
