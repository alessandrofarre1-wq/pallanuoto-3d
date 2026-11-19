# Proposta: mettere ordine (v0.60, 19/11/2026)

Ale: «se pensi che il gioco sia una cozzaglia di versioni forse è meglio che pensi a un modo per mettere ordine».

## Com'è oggi (misurato)
- **CLAUDE.md**: 207 KB, 530 righe molto lunghe. Ogni sessione (Claude e Codex) lo legge tutto: dentro c'è la storia di 60 versioni,
  con decisioni prese e poi superate mescolate a quelle in vigore. È il punto più disordinato e quello che costa di più.
- **docs/**: 35 documenti allo stesso livello: rapporti di versione (`v053-…`, `v059-…`), verifiche (`verifiche-v039…v050`),
  riferimenti stabili (`tattica.md`, `tecnica.md`, `fisica-palla.md`), passaggi tra Claude e Codex, proposte.
- **Numeri della taratura** sparsi in 8 file (`ia.js`, `fisica.js`, `regole.js`, `tiri.js`, `lotta.js`, `finte.js`, …): circa 40
  costanti con nomi diversi. Per capire «quanto pesa» una scelta bisogna sapere dove cercare.
- **Prove**: 49 prove, 26 strumenti, 60 comandi `npm run`, 37 passi nella CI (circa un'ora). I nomi seguono la versione in cui sono
  nate (`gameplay-v040`, `finta-v055`, `replay-v048`, `v046`), non quello che controllano.
- **Codice**: `ia.js` (58 KB) e `grafica/pose.js` (48 KB) sono cresciuti a strati, con commenti «v0.xx» a ogni ritocco (94 nel
  codice). Funziona e le prove passano, ma la decisione del computer con la palla (`aiCarrier`) ha ormai una decina di strade.

## Proposta, in tre passi (dal meno rischioso)
1. **Memoria e documenti** (nessun effetto sul gioco):
   - CLAUDE.md corto (circa 15 KB): cos'è il gioco, regole di lavoro, decisioni IN VIGORE divise per argomento (comandi, nuoto,
     tiro, difesa, uomo in più, HUD, grafica, limiti iPhone), numeri attuali contro i numeri veri, cosa resta da fare;
   - storia completa spostata in `docs/storia.md` (una voce per versione, come oggi, senza perdere nulla) e le decisioni superate in
     `docs/decisioni-superate.md`;
   - `docs/` in cartelle: `versioni/`, `verifiche/`, `riferimenti/` (tattica, tecnica, fisica, valutazioni), `proposte/`.
2. **Un solo pannello della taratura** (il gioco resta identico, da dimostrare con le partite simulate uguali prima e dopo):
   `src/taratura.js` raccoglie tutti i numeri del bilanciamento con, accanto, il valore reale di riferimento; `npm run taratura`
   gioca le partite di prova e stampa una tabella «gioco contro realtà» (tiri, gol, espulsioni, superiorità, palle perse, durate).
3. **Prove con nomi per argomento** e un comando unico `npm run prove` che esegue in locale gli stessi passi della CI con il
   riepilogo PASS/FAIL. Più avanti, con calma e una parte per volta: riscrivere `aiCarrier` in poche scelte chiare (tirare,
   passare, fintare, aspettare) con le prove a fare da rete.

Consiglio di fare subito i passi 1 e 2 (una PR ciascuno), il 3 dopo.
