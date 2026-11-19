# v0.64 — Ritmo dell'attacco in parità, palle perse e falli in attacco

Ale, sulla lista dei prossimi punti, ha chiesto i cinque punti di gioco. Qui ci sono i primi due, che vanno insieme:
1. **ritmo dell'attacco in parità**: il computer tirava troppo presto invece di far girare palla;
2. **palle perse e falli in attacco**: erano troppo pochi rispetto alle partite vere.

Il metodo è quello del pannello nuovo: misuro con `npm run taratura` (8 partite ITA–HUN), cambio i numeri in `src/taratura.js`,
rimisuro. In tutto sei giri di prova.

## Cosa dicevano le misure
**Sonda dei tiri** (`strumenti/sonda-tiri.mjs`, v0.63):
- un tiro in parità su quattro arrivava a fine azione, al momento giusto (23 s);
- un altro 15% erano tiri «da libero» subito dopo una ricezione, a 11 s di media e più della metà entro 10 s;
- la causa: dopo ogni recupero la squadra resta in «ripartenza» fino a 12 s. In quei secondi il freno della costruzione non valeva
  e chi riceveva libero entro 7 m tirava sempre, anche alla pari (6 contro 6).

**Sonda delle azioni** (`strumenti/sonda-azioni.mjs`):
- in parità 5,3 s per arrivare in attacco e poi 10,5 s di attacco;
- un'azione su tre finiva prima dei 10 s: tiri anticipati, palle perse in ripartenza, espulsioni;
- appena la palla arrivava al centroboa, nei primi secondi partiva quasi sempre un'espulsione, una girata o un fallo.

## Cosa cambia
Nel codice:
- **Costruzione anche nella ripartenza alla pari** (`ia.js`): il tiro subito dopo la ricezione è sicuro solo nella controfuga
  vera, con l'uomo in più. Nella ripartenza 6 contro 6 valgono le regole della parità.
- **Palla al centroboa dopo la costruzione** (`tiri.js`, nuovo numero `CENTRO_ATTESA`): in parità il vantaggio di passare al centro
  cresce dai 7 ai 15 s d'azione; prima c'era da subito.
- **Numeri portati nel pannello** (prima erano scritti nel codice): tiro di fine azione (`FINE_AZIONE`), lotta al centro con la
  palla al centroboa (`LOTTA_PALLA`) e rigori (`RIGORI`).

Numeri cambiati in `src/taratura.js` (prima → dopo):

| numero | prima | dopo | perché |
|---|---|---|---|
| `COSTRUZIONE.secondi` | 15 | 18 | meno tiri presto |
| `FINE_AZIONE.secondi` | 6 | 4,5 | il tiro di fine azione arriva più tardi |
| `PAZIENZA` | 24, 3 | 25, 2,5 | idem |
| `CIRCOLAZIONE` (rapidi, equilibrati, vicini) | 0,4+0,25 / 0,55+0,4 / 0,7+0,45 | 0,32+0,18 / 0,4+0,3 / 0,55+0,35 | palla in mano più breve |
| `INTERCETTO.base` | 0,12 | 0,14 | più palle perse |
| `LOTTA_PALLA.contro` | 0,14 | 0,45 | più falli in attacco del centroboa |
| `LOTTA_PALLA.ruba` | 0,08 | 0,14 | più palle rubate al centroboa |
| `CENTRO_SENZA_PALLA.contro` | 0,05 | 0,12 | più falli in attacco senza palla |
| `LOTTA_FASE` | 0,15, 10-24 s | 0,1, 12-26 s | la lotta piena arriva più tardi |
| `ESPULSIONI` | centro 6,5, contrasto 0,24 | centro 9, contrasto 0,21 | totale circa 11, 66% dal centro |
| `ARBITRI.palleggio` | 0,35 | 0,28 | meno espulsioni sul palleggio in ripartenza |
| `RIGORI` | 0,6 / 0,35 / 0,6 | 0,45 / 0,25 / 0,5 | con l'attacco più paziente i rigori erano saliti a 3,7 |

Il pannello indica i numeri da guardare per ogni voce (`REALE`), ora anche quelli nuovi.

## Gioco contro realtà (8 partite ITA–HUN, per squadra a partita)
| voce | v0.63 | v0.64 | reale |
|---|---|---|---|
| tiri | 43,6 | 35,3 | 33 |
| gol | 15,3 | 12,9 | 13,3 |
| tiri in gol | 35,0% | 36,5% | 40% |
| espulsioni | 11,6 | 11,4 | 11 |
| espulsioni dalla lotta al centro | 74,7% | 66,5% | 66% |
| superiorità trasformate | 43,0% | 40,1% | 52% |
| rigori | 2,2 | 1,6 | 1,8 |
| azioni a partita | 70,0 | 66,3 | 50 |
| parità: durata dell'azione | 14,4 s | 15,4 s | 21 s |
| parità: tiro sbagliato | 38,0% | 28,8% | 32% |
| parità: palla persa | 11,7% | 16,3% | 20% |
| parità: fallo in attacco | 8,5% | 14,4% | 15% |
| parità: espulsione procurata | 20,1% | 20,6% | 22% |
| palla in mano prima del passaggio | 1,07 s | 1,01 s | 0,6-1 s |

**A posto 11 voci su 15** (erano 6).

Restano fuori:
- **superiorità**: è il punto 3. Con 8 partite varia di qualche punto: nei giri di prova è andata da 38% a 48%.
- **azioni a partita e durata**: migliorano poco. Il resto della differenza viene dalla ripartenza: dopo ogni recupero tutti
  scattano ai posti e la palla arriva in attacco in 5,5 s. Un'azione su tre finisce ancora prima dei 10 s (rimbalzi ripresi
  vicino alla porta, palle perse e falli in ripartenza, tiri senza difensori davanti). È lo stesso tema del punto 5 (il computer
  che scatta troppo).
- **palla in mano**: 1,01 s, al bordo della banda.

## Verifiche
- `npm run lint`: PASS.
- `npm run prove`: **36 PASS, 0 FAIL** su 36 passi in 8,7 minuti. Le dieci prove che dipendono dal computer (gioco, centroboa,
  tattica, strategie, sezioni 1-3, v046, statistiche, azione) erano passate già durante la taratura. Dopo il ritocco del bacino
  nel tiro da fuori ho ripetuto i sette passi legati al corpo (nuoto, nuoto coerente, orientamento, finta, gesti, replay,
  sezione 4): PASS.
- `npm run verifica`: sei partite arrivate alla fine, 49 gol su 195 tiri (prima 54 su 211: il gioco è cambiato). La foto «azione»
  mostra lo stesso istante di una partita andata diversamente (un fallo e un tiro libero, giocatori in altri posti). L'ho
  controllata e ho aggiornato i riferimenti con `--partite=0` (anche il menu, per la scritta «v0.64»); verifica ripetuta: superata.
- `npm run aspetto`: al primo giro una sola misura su 7.507 aveva la coscia 1 cm sopra l'acqua, durante un tiro da fuori: il
  bacino nel tiro da fuori ora sale al massimo fino a 16 cm sotto il pelo (prima 14). Al secondo giro 0 gambe fuori; viste iPhone
  56 oggetti e 141.794 triangoli.

## Non fatto
- La durata dell'azione resta lontana dai 21 s: va ripensata la ripartenza (insieme al punto 5).
- Superiorità sotto il 52%: punto 3, prossima versione.
