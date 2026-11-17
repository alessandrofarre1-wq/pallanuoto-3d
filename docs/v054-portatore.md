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

---

# v0.54 (seconda parte): ripartenza subito dopo ogni recupero, con le due aperture di Ale

Indicazione di Ale (17/11/2026): «se un giocatore recupera palla, la squadra deve far partire subito il contropiede», con due schemi.

Numeri di posizione come nelle lavagne, guardando la porta avversaria: 1 destra vicino, 2 destra fuori, 3 centro, 4 sinistra fuori, 5 sinistra vicino, 6 centroboa.

## Prima
- La controfuga organizzata (v0.46) partiva solo in una parte dei recuperi: con probabilità 1 per Italia, Serbia e Australia, 0,5 per Spagna, Croazia e Ungheria, 0,8 per le altre (`STILE_VELOCE`).
- I posti si davano per vicinanza: i tre più vicini alla porta avversaria in prima linea, gli altri in seconda, senza guardare i numeri.

## Dopo (`regole.js`, `ia.js`)
- Ogni recupero a più di 13 m dalla porta avversaria fa partire la ripartenza, per tutte le squadre. Si sceglie a caso una delle due aperture.
- **Prima linea ai 2 metri** (`base`):
  - 1, 6 e 5 vanno subito ai 2 metri (destra, centro, sinistra);
  - 3 va incontro al portiere, a 6 m dalla propria porta, e riceve;
  - 2 e 4 fanno da appoggio davanti a lui, sui due lati;
  - quando il 3 ha la palla, 2 e 4 salgono 3 m davanti a lui.
- **Apertura del 2** (`apertura2`):
  - 2 scatta verso metà campo e riceve;
  - 1 lo supera e va ai 2 metri;
  - 6 va al centro ai 2 metri;
  - 4 e 5 vanno in posizione (sinistra fuori e sinistra vicino);
  - 3 arriva per ultimo dietro la palla e la gestisce con il 2.
- Il portiere aspetta il compagno designato e glielo passa appena è arrivato al suo posto (entro 2,5 m) e ha la linea libera.
  - Se il compagno resta coperto dopo 2,4 s (3,6 s nell'apertura del 2), sceglie il compagno libero migliore, di solito il 2 o il 4.
- In ripartenza la palla va avanti: chi la porta passa indietro solo se è pressato.
- La ripartenza dura al massimo 12 s (prima 9) o finché la palla arriva ai 5,5 m. Poi si passa all'attacco schierato.
- Se manca un giocatore (espulso o in uscita per un cambio) vale la regola di prima, con i posti dati per vicinanza.

## Misure
`node strumenti/sonda-aperture.mjs [--json=file]`: l'Ungheria attacca, il portiere italiano para, si guarda dove vanno i sei di movimento e a chi arriva il primo passaggio. Tre scene per schema:
- **Base**: primo passaggio al 3 dopo 1,6 s quando è libero, altrimenti al 4 dopo circa 3,5 s.
- **Apertura del 2**: primo passaggio al 2 dopo 3,5–4 s in due scene su tre; nella terza è arrivato al 6.
- La prima linea arriva tra 5 e 7 m dalla porta in 7 s, più lenta se si scontra con gli avversari che rientrano.

Disegno dall'alto: `docs/immagini/v054-aperture.png` (`node strumenti/disegna-aperture.mjs dati.json uscita.png`).

## Non fatto
- Il giocatore non può ancora scegliere l'apertura: per ora la sceglie il caso, anche per i compagni della sua squadra. Proposta: una voce nella strategia prepartita.
- Il 6 non «spinge» davvero il difensore: va al posto al centro dei 2 metri e la lotta parte da lì.
- Non c'è un'apertura dedicata quando a recuperare non è il portiere ma un giocatore di movimento: valgono gli stessi posti, e chi ha la palla risale come prima.
