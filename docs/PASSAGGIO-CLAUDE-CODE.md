# Passaggio a Claude Code — WATERPOLO 7 v0.40

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
