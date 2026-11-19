# v0.60 — Taratura: dove si accorcia l'azione

Ale: «per me puoi fare il tuning».

## Misura prima di correggere
Nuova sonda `strumenti/sonda-azioni.mjs`: partite computer contro computer; per ogni azione misura quando la palla arriva per la
prima volta entro 10 m dalla porta avversaria e come finisce (esito letto da `ultimaAzioneChiusa` in `statistiche.js`, solo lettura).
Sulla v0.59 (3 partite):
- in parità l'attacco arriva in zona dopo **5,6 s** (la ripartenza veloce della v0.57 non è la causa principale);
- poi l'attacco schierato dura solo **10,5 s**;
- un terzo delle azioni finisce entro 10 s: 51 con un tiro, 27 con un'espulsione, 21 con la palla persa. I tiri rapidi sono
  quasi tutti occasioni vere (rigori, tiri vicinissimi, nessun difensore davanti), quindi restano.

## Cosa cambia
- `COSTRUZIONE.secondi` 11 → 15 (`ia.js`): circa 5,5 s di transizione più 9,5 s di attacco schierato prima di cercare il tiro da
  libero, salvo vicinissimo alla porta. `TIRO_LIBERATO.parita` 0,4 → 0,3.
- `LOTTA_FASE` 8-20 → 10-24 s (`lotta.js`): la lotta al centro diventa dura più avanti nell'azione; `ESPULSIONI.centro` 5,6 → 6,5
  (`regole.js`) per tenere le espulsioni come nei Mondiali.
- `INTERCETTO` {base 0,09 → 0,12, passaggio lungo 0,3 → 0,36} (`fisica.js`): i difensori leggono un po' meglio i passaggi. Come
  chiesto da Ale, la palla persa nasce dalla difesa e non da passaggi semplici sbagliati.
- Superiorità: `PARATA_SUP` 0,2 → 0,3 (`fisica.js`, il portiere para un po' meno con la difesa in cinque) e
  `TIRO_LIBERATO.superiorita` 0,85 → 1 (il tiro al volo dopo il cambio di lato torna sempre, come nel video della finale).

## Bilancio (8 partite ITA–HUN, per squadra)
| | v0.59 | v0.60 | reale |
|---|---|---|---|
| tiri | 44,6 | 44,1 | 33 |
| gol | 14,4 | 14,9 | 13,3 |
| tiri in gol | 32,3% | 33,9% | 40% |
| espulsioni | 11,7 | 11,1 | 11 |
| superiorità trasformate | 36,4% | 41,2% | 52% |
| intercetti | 4,4 | 6,3 | — |
| parità: palla persa | 9,1% | 11,1% | circa 20% |
| parità: durata | 14,3 s | 14,5 s | circa 21 s (Mondiali 2009, con 30 s di possesso) |
| azioni | 70,8 | 69,6 | circa 50 |

Tra due giri da 8 partite c'è qualche punto di variazione. Durante la taratura sono stati provati anche passi intermedi (per esempio
azioni 65,8 e tiri 42,7 prima di alzare le espulsioni, che allungano di nuovo il numero di azioni con le superiorità).

## Verifiche sul codice finale
- `npm run lint` PASS; tutti i 34 passi della CI in locale PASS.
- `npm run verifica`: sei partite arrivate alla fine, 65 gol su 218 tiri (30%); cinque immagini nella tolleranza, riferimenti
  invariati.
- `npm run aspetto` PASS: 0 gambe fuori dall'acqua; viste iPhone 56 oggetti / 141.794 triangoli.

## Non fatto
- La durata media in parità resta 14,5 s: le azioni hanno due gruppi (molte finiscono entro 10 s, molte arrivano a 20-25 s). Le
  brevi sono in buona parte giuste (rigori, tiri vicinissimi, espulsioni e palle perse); per allungare davvero la media va
  ripensato il ritmo dell'attacco schierato, che oggi gira palla in fretta e poi tira a fine azione.
- Tiri 44 contro 33; palle perse 11% contro 20%; superiorità 41% contro 52%.
- Riordino del progetto: proposta in `docs/proposte/riordino.md`, da approvare.
