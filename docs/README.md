# Documenti di WATERPOLO 7

| Dove | Cosa c'è |
|---|---|
| `../CLAUDE.md` | Memoria del progetto: regole di lavoro, decisioni **in vigore**, numeri attuali, cosa resta da fare. |
| `storia.md` | Tutta la storia, versione per versione (fino alla v0.61 il testo originale della vecchia memoria). |
| `decisioni-superate.md` | Le decisioni cambiate nel tempo: com'era e cosa vale ora. |
| `versioni/` | Rapporto di ogni versione dalla v0.46 (richiesta, cosa cambia, misure, verifiche, non fatto) e alcuni più vecchi. |
| `verifiche/` | Verifiche dettagliate v0.39-v0.50 e i file di misura (`misure-*.json`). |
| `riferimenti/` | Conoscenze che valgono nel tempo: tattica, tecnica, fisica della palla, corpi e acqua, valutazioni dei giocatori, aspetto, uomo in più, priorità dell'interfaccia, arena, analisi di un video. |
| `proposte/` | Proposte e piani (riordino, menu e tornei, loghi, manuali e studi, prossimi passi del gioco, vecchie roadmap). |
| `PASSAGGIO-CLAUDE-CODE.md`, `PASSAGGIO-CODEX.md` | Passaggi di consegne tra Claude Code e Codex. |
| `immagini/`, `filmati/` | Fogli, foto e video prodotti dalle prove e dagli strumenti (molte prove scrivono qui: non spostare). |

I numeri del bilanciamento, con accanto i valori delle partite vere, sono nel codice in `../src/taratura.js` (`npm run taratura`
stampa gioco contro realtà).

Regola per i nuovi documenti: il rapporto di una versione va in `versioni/vXXX-argomento.md`; una conoscenza da riusare va in
`riferimenti/`; una proposta da approvare va in `proposte/`.
