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

## Ripartenza: i compagni scattano ai loro posti
Ale: «quando prendo la palla per andare in attacco i miei compagni non possono stare fermi ad aspettarmi, devono nuotare il più
velocemente possibile per raggiungere le loro posizioni di attacco. Invece mi stanno intorno e mi portano addosso pure i loro
difensori».

Cause trovate nel codice (`ia.js`):
- **Ripartenza dopo il recupero** (v0.54): le posizioni del 2, del 3 e del 4 erano pensate per il portiere che lancia. Il 3 va
  incontro, il 2 e il 4 fanno da appoggio ai lati. Se la palla l'aveva un giocatore di movimento, gli stessi posti diventavano «3 m
  dietro» e «3 m davanti ai lati» di chi porta palla.
- **Fuori dalla ripartenza**: la vecchia regola «nessuno può stare troppo avanti rispetto a chi porta palla» teneva il punto
  all'altezza della palla e i mezzi a 4 m, e nessuno scattava.

Cosa cambia (misure in `RIPARTENZA`):
- con la palla a un giocatore di movimento, il 2 e il 4 vanno subito ai loro posti ai 5 m e il 3 a 7 m dalla porta avversaria;
  incontro e appoggio restano solo quando la palla ce l'ha il portiere;
- finché la palla è a più di 10 m dalla porta avversaria, i compagni vanno dritti al loro posto d'attacco e scattano finché ne sono
  a più di 2,5 m; il punto resta al massimo 8 m davanti alla palla, per lo scarico.

Misura con la nuova sonda `strumenti/sonda-ripartenza.mjs`: l'Italia comandata recupera palla a 4 m dalla propria porta e a metà
della propria metà, con la palla a tre giocatori diversi, poi nuota verso l'attacco per 6 s. Media su 63-68 campioni, prima → dopo:
- compagni che scattano: 2,78 → 3,92 su 5;
- compagni davanti a chi porta palla: 2,40 → 3,06 su 5;
- velocità media dei compagni: 1,74 → 2,13 m/s;
- compagni entro 3 m: 0,90 → 0,75. Chi resta vicino partiva accanto a chi porta palla e nuota nella stessa direzione.

## Regolamento: metà campo e passaggio al portiere
Domanda di Ale: «ci sono vincoli di tempo per superare la metà campo? Una volta superata, si può ancora passare la palla al
portiere, a meno che non la superi anche lui salendo in attacco?»

Controllato sul regolamento World Aquatics del 18 febbraio 2026 (estratto completo di 61 pagine) e sul riassunto delle modifiche
di giugno 2025:
- **nessun tempo limite** per superare la metà campo: c'è solo il tempo dell'azione (28 s, poi 18 s);
- **nessun divieto** di passare la palla indietro nella propria metà o al proprio portiere dopo aver superato la metà campo;
  il portiere può anche andare oltre la metà campo;
- c'è invece un fallo semplice per chi **rinuncia apposta al possesso** o butta via la palla (art. 8.2.4, regola 2025 che ha
  sostituito la vecchia «perdita di tempo»).

Quindi il gioco non cambia su questo punto. Nel gioco il passaggio al proprio portiere resta limitato a una scelta d'attacco
(v0.55: solo nella propria metà e solo se non c'è nessun altro).

Dallo stesso controllo è uscito un errore: un tiro deviato fuori dal fondo da un difensore di movimento (il muro) dava il tiro
d'angolo. Per l'art. 13.1.2.2.3 è invece **rimessa del portiere**: l'angolo spetta solo se tocca il portiere della difesa o se un
difensore la lancia lui oltre la linea (art. 14.1). Corretto in `fuoriDalFondo` (`ball.toccoPortiere`), con un controllo nuovo in
`sezione1`.

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
