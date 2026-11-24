# v0.79 — Passaggi: morbido sull'acqua o alto e teso, e il compagno che punti

## Richiesta
Ale (24/11/2026), punti 1 e 2 della lista:
- «Troppi passaggi sbagliati».
- «I passaggi possono essere di due modi: o morbido sull'acqua vicino al compagno (di solito quando il ritmo è più rilassato sul
  perimetro o quando la si passa al centro boa) oppure alto e teso (di solito durante l'uomo in più o quando si palleggia prima
  della chiusura dell'azione o per cambiare velocemente area del campo)».

## Cosa dicevano le misure
1. **Passaggi del computer**: quasi mai sbagliati. Sonda nuova `npm run sonda-tipi-passaggio`, 2 partite computer contro
   computer: 98,7% presi dal compagno, 1,3% presi da un avversario. Tutti alti e tesi, anche quelli corti e tranquilli.
2. **Passaggi del giocatore**: il problema è la scelta del compagno.
   - Su 379 scene vere d'attacco schierato, puntando con la levetta un compagno con ±10° di errore, la palla andava proprio a lui
     solo nel **54%** dei casi.
   - Nel **31%** dei passaggi andava al centroboa senza volerlo: dalla v0.55 il centroboa aveva la precedenza quando la levetta
     era entro 60° dalla direzione della porta. In più un compagno più vicino o con la linea libera vinceva su quello puntato
     fino a 25-30° di differenza.
3. **Levetta tenuta**: appena passi, il comando va a chi riceve. Se tieni ancora la levetta nella direzione in cui hai mirato, chi
   riceve nuotava in quella direzione, allontanandosi dalla palla. Prova con la tastiera, 40 passaggi: palla presa 32 volte con la
   levetta tenuta e 35 con la levetta lasciata.

## Cosa cambia
1. **Due modi di passare** (`tipoPassaggio` in `src/tiri.js`, numeri in `PASSAGGI` di `src/taratura.js`):
   - **morbido**: più lento (6,5-9 m/s secondo il Passaggio), cade sull'acqua 0,3 m davanti al compagno, con un errore più
     piccolo (×0,6). Si usa nella circolazione tranquilla con la linea libera;
   - **alto e teso**: quello di prima, 11-15,5 m/s alla mano alzata. Si usa con l'uomo in più, negli ultimi 8 s del possesso, oltre
     8 m, cambiando lato, in transizione (oltre 10 m dalla porta), con un avversario entro 0,9 m dalla linea e al compagno libero in
     posizione di tiro (entro 6,5 m dalla porta, nessuno entro 1,5 m): gli arriva in mano e può tirare subito, anche al volo. Così
     resta la regola della v0.55: al centroboa che si è liberato la palla arriva alta, in mano;
   - **al centroboa marcato**: in acqua davanti a lui come prima, ma con la velocità del morbido.

   Vale per il computer e per il giocatore: decide la situazione.
2. **Il compagno che punti** (`humanPassTarget`, numeri in `MIRA_PASSAGGIO`): conta la direzione della levetta. Distanza e linea
   libera non spostano più la scelta e il centroboa non ha più la precedenza: si serve puntandolo. Quando due compagni sono quasi in
   fila decide il più allineato. Con la levetta al centro resta il passaggio assistito di prima.
3. **Levetta tenuta dopo il passaggio** (`aiutoGuida` in `src/controllo.js`): se resti con la levetta nella direzione usata per
   mirare, chi riceve va lo stesso incontro alla palla; basta spostarla altrove per guidarlo. Se il passaggio morbido cade
   sull'acqua appena fuori portata, chi doveva riceverlo va a prenderlo.

## Le misure dopo
| misura | v0.77-0.78 | v0.79 |
|---|---|---|
| compagno puntato che riceve (379 scene, ±10°) | 54,0% | 78,7% |
| passaggi finiti al centroboa senza volerlo | 31% | 6% |
| quando non ci sono due compagni in fila | 64,4% | 93,9% |
| passaggi del computer presi dal compagno (2 partite) | 98,7% | 98,6% |
| passaggi morbidi | — | 22% (presi 99,5%, volo 0,42 s contro 0,29 s del teso) |

Gli altri regolaggi provati sulla scelta del compagno (stesse 379 scene): precedenza al centroboa entro 35° → 63,5%; entro 20° con
un premio piccolo → 68,8%; anche con distanza e linea libera ridotte → 72,2%. Tenuta solo la direzione (78,7%).

**Gioco contro realtà** (16 partite ITA–HUN): equilibrio uguale a prima, entro le oscillazioni del caso. Gol 20,5 → 20,8 a squadra,
tiri 42,3 → 41,3, palla persa in parità 17,3% → 16,0%, superiorità 42,0% → 47,1%. I gol troppo alti (veri 13,3) dipendono da
altro: marcature e tiri (versioni successive). Misura sulla build del primo giro: quella finale cambia la scelta del compagno
(solo per il giocatore), l'aiuto a chi riceve (solo per il giocatore) e la regola della transizione (posizione di chi passa invece
di quella della palla, che chi passa ha in mano).

## Misura nuova per la versione dei tiri
La sonda dei tiri (`node strumenti/sonda-tiri.mjs`) ora conta anche il gesto. Sulla v0.78, 4 partite computer contro computer:
- tiro classico 75%, polso 13%, torsione 9%, palombella 2%;
- colonnello 2 e schizzo 1 su 329 tiri;
- 96 tiri del centroboa (29%), nessuna beduina e nessuna sciarpa.

Gli schizzi e i colonnelli che vede Ale nascono quindi dal tasto TIRO che si accende ogni volta che nuota verso la porta senza
difensori davanti.

## Prova nuova: `npm run passaggi`
Dodici controlli:
- **tipo di passaggio**: morbido nella circolazione tranquilla e al centroboa marcato; teso con l'uomo in più, negli ultimi
  secondi, nel cambio di lato lungo, con un avversario sulla linea e al compagno libero in posizione di tiro;
- **levetta**: puntando ciascun compagno con ±7° riceve quello puntato; puntando l'ala con il centroboa a 34° riceve l'ala;
- **levetta tenuta**: palla presa 8 volte su 8 e chi riceve non si allontana dal punto d'arrivo.

## Verifiche
- **`npm run lint`**: PASS.
- **`npm run prove`**: primo giro fermato da un FAIL di `finta` (prova della v0.55):
  - «passaggio teso»: la scena era una circolazione tranquilla con la linea libera, quindi ora un passaggio morbido;
  - «al centroboa libero arriva alta, in mano»: l'avevo rotto io, mandando morbido anche al centroboa liberato.

  Rimessa la regola della v0.55 per il centroboa libero; la scena del tiro al volo ora ha il ricevente libero vicino alla porta
  (passaggio teso). Secondo giro: **61 PASS, 0 FAIL** su 61 passi in 15,2 minuti; `passaggi` 12 controlli; gambe fuori
  dall'acqua 0 su 8.850, 0 su 3.864, 0 su 1.174.
- **`npm run verifica -- --partite=0`**: diversa la foto «azione» (33,7% dei punti). Nello stesso istante c'è un passaggio morbido
  in volo e la partita prosegue un po' diversamente; grafica normale. Le foto iPhone sono identiche; il menu è dentro la
  tolleranza (scritta della versione). Riferimenti aggiornati con `--partite=0`; verifica ripetuta: superata, cinque immagini
  identiche.
- **`npm run aspetto -- --no-build --solo-foto`**: «Tutto a posto»; viste iPhone 56 oggetti disegnati e 131.872 triangoli.

## Decisioni superate
- Passaggi sempre alti e tesi (v0.55) → due modi: morbido sull'acqua vicino al compagno o alto e teso, secondo la situazione.
- Palla al centroboa marcato in acqua a 0,8 volte la velocità del passaggio teso → con la velocità del morbido.
- Scelta del compagno con la levetta: direzione ×4, distanza −0,07 al metro, +0,5 con la linea libera e precedenza al centroboa
  (+1,2 entro 60° verso la porta, v0.55) → conta la direzione (×10), la distanza solo per gli spareggi (−0,01), niente premi.
- Con la levetta tenuta chi riceve nuotava nella direzione della levetta → va incontro alla palla finché la levetta resta nella
  direzione usata per mirare.

## Non fatto
- Il gesto del passaggio morbido è lo stesso del teso: cambia la traiettoria della palla, non il braccio.
- Con due compagni quasi in fila la scelta dipende da quanto è precisa la mira (55% nelle scene ambigue).
- Giudizio di Ale giocando: se i passaggi sbagliati erano anche altro, servono un video o un esempio.
