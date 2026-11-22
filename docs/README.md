# Documenti di WATERPOLO 7

Versione corrente **v0.72**: [proporzioni, tiro e rimesse](versioni/v072-proporzioni-tiro-rimesse.md), [dati e verifiche](verifiche/v072/README.md), [confronto tiro](immagini/v072/tiro-prima-dopo.png).


| Dove | Cosa c'è |
|---|---|
| `../CLAUDE.md` | Memoria del progetto: regole di lavoro, decisioni **in vigore**, numeri attuali, cosa resta da fare. |
| `storia.md` | Tutta la storia, versione per versione (fino alla v0.61 il testo originale della vecchia memoria). |
| `decisioni-superate.md` | Le decisioni cambiate nel tempo: com'era e cosa vale ora. |
| `versioni/` | Rapporto di ogni versione dalla v0.46 (richiesta, cosa cambia, misure, verifiche, non fatto) e alcuni più vecchi. |
| `verifiche/` | Verifiche dettagliate v0.39-v0.50, i file di misura (`misure-*.json`) e misure/provenienza della v0.68–v0.71 in `v068/`, `v069/`, `v070/`, `v071/`. |
| `riferimenti/` | Conoscenze che valgono nel tempo: tattica, tecnica, fisica della palla, corpi e acqua, valutazioni dei giocatori, aspetto, uomo in più, priorità dell'interfaccia, arena, analisi di un video. |
| `proposte/` | Proposte e piani (riordino, menu e tornei, loghi, manuali e studi, prossimi passi del gioco, vecchie roadmap). |
| `PASSAGGIO-CLAUDE-CODE.md`, `PASSAGGIO-CODEX.md` | Passaggi di consegne tra Claude Code e Codex. |
| `immagini/`, `filmati/` | Fogli, foto e video prodotti dalle prove e dagli strumenti (molte prove scrivono qui: non spostare). |

I numeri del bilanciamento, con accanto i valori delle partite vere, sono nel codice in `../src/taratura.js` (`npm run taratura`
stampa gioco contro realtà).

Regola per i nuovi documenti: il rapporto di una versione va in `versioni/vXXX-argomento.md`; una conoscenza da riusare va in
`riferimenti/`; una proposta da approvare va in `proposte/`.

Chiusura v0.68: [ricezione della mezza entrata in quattro momenti](immagini/v068-mezza-entrata.md), [campione finale con semi e hash](verifiche/v068/bilancio-finale.json).

Correzioni v0.69 e verifiche con fase esplicita: [rapporto](versioni/v069-falli-e-riprese.md), [prove e provenienza](verifiche/v069/chiusura.json), [campione finale](verifiche/v069/bilancio-finale.json). PR60 unita; bilanciamento globale non concluso.

Lavoro v0.70: [chiamate, servizio boa e raccordi](versioni/v070-chiamate-servizio-gesti.md), [prove e provenienza](verifiche/v070/provenienza.json). Chiamate/servizio/gesti/replay/aspetto/budget PASS, UI e riferimenti ispezionati; verifica indipendente PASS; PR61 unita. SondaN1diagnostica, non bilanciamento generale. Nuovi gesti touch ancora proposta.

Chiusura v0.71: [portiere, proporzioni, tiri e stamina](versioni/v071-portiere-tiri-stamina.md), [prove](verifiche/v071/README.md), [provenienza](verifiche/v071/provenienza.json). Contatti/rigori/precisione/replay verificati, aspetto e budget iPhone rispettati; campione finale8+8 distinto dai candidati. Bilanciamento generale ancora aperto (4/15voci, divario/superiorità da rivedere); esito CI definitiva nella PR.
