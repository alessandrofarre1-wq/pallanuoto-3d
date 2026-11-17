# v0.54: il giocatore con la palla che nuota non è più «quasi fermo»

Segnalazione di Ale (17/11/2026): «Il giocatore con la palla che nuota risulta lentissimo. Praticamente è quasi fermo».

## Misura prima della correzione
`node strumenti/sonda-portatore.mjs`: partita vera ITA–HUN, il giocatore comandato con la palla viene spinto verso la porta avversaria (levetta piena, senza sprint) e si registra la velocità a ogni fotogramma con tutto ciò che può frenarlo.

- Velocità media 0,7–0,8 m/s, massima 0,82 m/s (1,27 solo in un possesso con il giocatore riposato).
- Nessun gesto, carica o girata attivi: era nuoto pulito, disteso.
- Stamina del giocatore: 0,03–0,35. `node strumenti/sonda-stamina.mjs`: i compagni guidati dal computer scattano circa il 40% del tempo e arrivano a 0–5% di stamina già dopo 60–100 s.
- Il difensore che insegue scatta a 2,5 m/s.

Cause, in `movePlayer` (`fisica.js`):
1. la stanchezza moltiplicava la velocità per `0,6 + 0,4 × stamina`: a stamina zero il 60%;
2. con la palla un altro 85%.

Quindi il portatore stanco andava al 51% della nuotata normale, cioè a un terzo del difensore in sprint.

## Correzione
| Costante | Prima | Dopo |
|---|---|---|
| `STANCO` (velocità a stamina zero) | 0,60 | 0,82 |
| `CON_PALLA` | 0,85 | 0,93 |
| `SPRINT_CONSUMO` (stamina al secondo in sprint) | 0,0092 | 0,0098 |

Il consumo dello sprint sale un poco perché chi è stanco ora va più veloce, finisce prima le vasche e la prova «dopo 7 vasche di sprint visibilmente stanco» (barra sotto il 40%) dava 43%: ora 39%.

## Dopo
- Portatore in partita: media 1,0–1,4 m/s, massima 1,33–1,51 m/s.
- Da fresco: 1,51 m/s con la palla, 1,62 senza, 2,67 in sprint (gli ultimi due invariati).

Bilancio, 8 partite ITA–HUN, per squadra a partita:

| | v0.53 | v0.54 | Mondiali 2025 |
|---|---|---|---|
| Gol | 15,0 | 15,4 | 13,3 |
| Tiri | 45,4 | 43,7 | 33 |
| Tiri in gol | 33,0% | 35,3% | 40% |
| Espulsioni | 11,9 | 15,0 | 11 |
| Rigori | 0,4 | 1,4 | 1,8 |
| Azioni | 71 | 75,5 | circa 50 (Euro League) |

## Non fatto
- Quando il portatore nuota addosso a un difensore piazzato davanti si ferma quasi del tutto per circa un secondo (0,01–0,4 m/s): è il «non si passa attraverso l'uomo», ma va giudicato giocando.
- Il computer scatta molto, circa il 40% del tempo: è la ragione per cui i compagni arrivano stanchi.
- Espulsioni salite a 15 per squadra.
