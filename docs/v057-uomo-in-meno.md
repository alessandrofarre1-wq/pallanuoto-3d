# v0.57 — Difesa con l'uomo in meno: braccio a specchio e centrale tra i pali

Indicazione di Ale (18/11/2026): «sull'uomo in più il difensore che difende su 3 alza il braccio destro anziché quello sinistro.
In difesa sull'uomo in più l'uomo che difende sul 3 difende il suo palo con una posizione a specchio rispetto all'avversario,
mentre il difensore che sta tra i due pali a 2 metri difende il tiro incrociato, quindi copre quella porzione di porta lasciata
libera dal portiere. Chi sta tra i pali ha il ruolo più scomodo perché deve saltare da un palo all'altro (senza fare fallo):
- se ha la palla 1 deve stare sulle spalle del difensore del palo e difendere con il braccio il palo lungo, perché il portiere e
  il difensore di 1 coprono il palo corto;
- se ha la palla 2 copre il tiro incrociato, mentre il difensore di 1 si stringe perché 1 non ha più la palla e si mette a
  proteggere il palo;
- se ha la palla 3 è speculare a 2; se ha la palla 4 è speculare a 1.
Questa è la difesa di partenza: se l'attacco applica degli schemi bisogna cambiare difesa.»

Numerazione dell'uomo in più (v0.50), guardando la porta: 1 destra ai 2 m, 2 fuori palo destro ai 5 m, 3 fuori palo sinistro ai
5 m, 4 sinistra ai 2 m, 5 e 6 ai pali.

## Perché succedeva
Il braccio del muro seguiva sempre la regola della v0.30, valida in parità: braccio dalla parte del palo coperto. L'attaccante 3
sta davanti al palo sinistro, quindi il difensore alzava il braccio da quella parte, cioè il destro, davanti alla spalla che non
tira. Il centrale tra i pali si spostava soltanto verso il palo dalla parte della palla e non alzava il braccio.

## Cosa cambia
- **Braccio a specchio** (`muro.js`, `braccioMuro`): con l'uomo in meno chi esce sul tiratore alza il braccio opposto al suo
  braccio di tiro, proprio davanti alla palla (contro un destro il sinistro, contro un mancino il destro). In parità resta la
  regola v0.30.
- **Centrale tra i pali** (`ia.js`, `postiInferiorita`, misure in `INFERIORITA`):
  - palla a 1 o 4: sta sulle spalle del difensore del palo dalla parte della palla (1 m dal centro, 1,7 m dalla porta) e copre
    il palo lungo;
  - palla a 2 o 3: si mette sulla linea tra il tiratore e il palo lungo, a 2 m dalla porta, e copre l'incrociato.
  - alza il braccio dalla parte del palo lungo (`braccioVerso`, disegno in `grafica/pose.js`): a metà quando l'avversario ha la
    palla, in alto quando carica il tiro.
- **Difensore dell'esterno** (1 o 4): quando il suo uomo ha la palla esce su di lui, tra lui e il palo corto (che copre insieme
  al portiere); quando la palla è al 2 o al 3 si stringe verso il palo, di più se la palla è dalla sua parte.
- **Fisica** (`fisica.js`): il tiro che va dalla parte coperta dal centrale incontra il braccio già alto. Il muro riesce come
  quello sul palo corto (42% di base invece del 34% per il braccio alto in ritardo).

## Prova
Nuovo `npm run inferiorita` (`strumenti/inferiorita-foglio.mjs --prova`, nella CI). La difesa si schiera con la palla al 2, poi
la palla passa all'uomo del caso (1, 2, 3, 4), che carica il tiro. Per ogni caso controlla:
- chi esce sul tiratore alza il braccio a specchio;
- il centrale copre il palo lungo e alza il braccio da quella parte;
- con la palla a 1 o 4 il centrale sta dalla parte della palla; con la palla a 2 o 3 sta sulla linea dell'incrociato.

Risultato: 16 controlli su 16. Sulla build della v0.56 la stessa prova ne fallisce 13 su 16.
Foglio con le quattro situazioni viste da dietro la porta: `docs/immagini/v057-uomo-in-meno.png` (senza `--prova`).

## Correzioni dopo la prova di Ale sul telefono (stessa versione)
Ale: «il portiere ha la palla e il giocatore nuota dentro la porta; sono aumentati a dismisura i passaggi sbagliati, anche
semplici (qui c'è il meglio del meglio: l'errore può capitare ma deve essere verosimile); un mio passaggio al portiere è uscito
dal fondo e il gioco è ripreso con la palla al mio portiere, ma è cambio possesso».

- **Palla oltre la linea di fondo** (`fisica.js`): un passaggio o un rimbalzo che supera la linea di fondo è fuori subito. Prima
  solo i tiri erano controllati sulla linea: il passaggio restava «in volo» fino a 1,2 m oltre e i giocatori lo inseguivano dentro
  la porta.
- **Chi riprende** (`fuoriDalFondo`): tiro d'angolo agli avversari anche quando l'ultimo a lanciare la palla è la squadra che
  difende quella porta (prima solo se un difensore aveva murato). Il passaggio sbagliato verso il proprio portiere che esce dal
  fondo dà quindi l'angolo all'avversario. Due controlli nuovi in `npm run sezione1`: sulla v0.57 prima della correzione il primo
  falliva («Rimessa dal portiere → palla al portiere USA»), ora passano tutti e due.
- **Passaggi sbagliati** (`tiri.js`, `controllo.js`, `fisica.js`): l'errore aggiunto nella v0.56 era troppo forte. Ora vale ×1,0
  di base (era ×1,5), al massimo ×1,8 con un avversario addosso (era ×3,5), +30% da distesi (era +60%), e non supera mai due
  volte l'errore tipico, così gli sbagli grossi diventano rari. Il giocatore comandato che riceve, se la levetta è ferma, va da
  solo incontro alla palla, sul punto più vicino della sua traiettoria: con la presa alla mano chi restava fermo se la lasciava
  sfuggire. Il portiere prende la palla fino a 0,9 m (due mani), gli altri fino a 0,55 m (era 0,5).
- Misura (`strumenti/sonda-passaggi.mjs --umano`: Italia comandata con la levetta ferma, chi ha palla passa dopo 1,2 s; 300 s di
  gioco): prima 73 passaggi presi su 77, con 2 intercettati e 2 finiti in acqua; dopo 102 su 102.

## Effetto sul gioco (8 partite ITA–HUN, per squadra)
| | v0.56 | v0.57 senza le correzioni di Ale | v0.57 finale |
|---|---|---|---|
| superiorità trasformate | 43,4% | 35,4% | 46,6% (Mondiali 52%) |
| gol | 14,1 | 15,7 | 16,4 |
| tiri | 43,1 | 43,6 | 48,4 |
| tiri in gol | 32,8% | 36,0% | 34,0% |
| espulsioni | 11,4 | 10,9 | 11,1 |
| intercetti | 4,3 | 4,6 | 4,1 |
| azioni | 75,2 | 77,1 | 73,4 |
| parità: palla persa | 16,5% | 16,9% | 7,4% |

Con passaggi di nuovo precisi le palle perse in parità tornano basse (7,4% contro circa 20% delle partite vere) e i tiri risalgono
a 48. Va bene così: come dice Ale, la palla persa deve nascere dalla difesa (anticipo, intercetti, contrasti), non da passaggi
semplici sbagliati. Le partite cambiano dalla prima superiorità e dal primo passaggio in poi: tra una colonna e l'altra c'è anche
variazione casuale.

## Non fatto
- Palle perse in parità 7,4% (circa 20% nelle partite vere) e tiri 48 (33): servono più anticipi e intercetti della difesa, non
  passaggi sbagliati.
- La difesa contro gli schemi dell'uomo in più (rotazioni, cambi da 4-2 a 3-3) resta quella di prima, che scivola con la palla.
  La «difesa di partenza» è quella descritta da Ale; adattarla a ogni schema va progettato a parte.
- I difensori umani non hanno ancora un aiuto per il posto in inferiorità: lo fanno solo i difensori guidati dal computer.
