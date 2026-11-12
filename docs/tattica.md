# Tattica di pallanuoto per il gioco

Appunti raccolti da Waterpolo Development World (wpdworld.com) l'11 novembre 2026, riscritti come regole di gioco.
Servono a IA, schemi e bilanciamento. Fonti in fondo; i testi originali non sono riportati.

## 1. Posizioni (numerazione usata da allenatori e telecronisti)
- Arco d'attacco numerato 1-5, più il centroboa (6). 1 e 5 sono le ali (all'altezza dei 2 metri), 2 e 4 i mezzi, 3 il punto.
  Nel gioco: 1 = ala destra, 2 = mezzo destro, 3 = punto, 4 = mezzo sinistro, 5 = ala sinistra, 6 = centroboa (verificare il lato con Ale).
- I difensori prendono il numero dell'attaccante che marcano, con il segno meno: -1, -2, … Il marcatore del centroboa è il "-6" (da noi il punto, array MARK).

## 2. Com'è la pallanuoto con le regole attuali (campo 25 m, possesso 28", superiorità 18")
Analisi delle gare a eliminazione dei Mondiali di Singapore 2025 rispetto a Fukuoka 2023:
- Più tiri, più gol e soprattutto più espulsioni.
- Aumentano i gol dal perimetro contro la difesa schierata e quelli in superiorità numerica.
- Diminuiscono i gol in controfuga, in entrata, su tiro diretto dai 6 metri e del centroboa.
- Il centroboa segna meno, ma l'aumento delle espulsioni viene tutto dai falli gravi fischiati ai 2 metri: gioco più statico e di contatto, con battaglie di posizione intorno al centroboa.
- Le squadre puntano su attacchi posizionali costruiti per guadagnare espulsioni.
Conseguenze per il gioco:
- La lotta al centro deve produrre soprattutto espulsioni, meno gol diretti del centroboa.
- La superiorità numerica è il momento decisivo della partita: va curata (schemi 4-2 e 3-3, passaggi rapidi, tiro al volo).
- Le controfughe esistono ma sono meno frequenti di una volta; gli attacchi a difesa schierata sono la norma.

## 3. Numeri di riferimento per il bilanciamento (referti di serie A1 2025-26 e nazionale)
- Superiorità numeriche per squadra a partita: tipicamente tra 7 e 13; trasformate in gol dal 30% al 60% circa (es. 7/12, 5/12, 5/10, 2/7, 6/13).
- Rigori: in genere 1-2 per squadra a partita, a volte di più.
- Con un pressing aggressivo una squadra può concedere moltissime espulsioni (12 nei primi 16' in una gara del Settebello; 19 più 2 rigori contro la Slovacchia agli Europei 2026).
- Il "metro" dell'arbitro cambia da partita a partita: alcune gare sono più fiscali, altre lasciano giocare più duro ai 2 metri.
Proposte: misurare queste grandezze nelle partite simulate (espulsioni per squadra, % superiorità, rigori); aggiungere un parametro di severità dell'arbitro scelto a inizio partita, che sposta il confine tra contatto lecito, fallo ed espulsione.

## 4. Difesa
- Pressing (marcatura a uomo aggressiva, muovendosi intorno all'avversario per rubare palla) come difesa di base.
- Zona come alternativa: quando il pressing va in difficoltà, verso la fine dell'azione avversaria, o per limitare i passaggi al centroboa forte.
- Zona a M: braccia alte, scalate rapide, taglia fuori i centroboa e favorisce la ripartenza in controfuga.
- Pressing e zona si alternano durante la stessa partita per togliere tempo ai registi avversari.
- Palla all'ala (1 o 5): il -1 cambia posizione e il -2 si abbassa molto per impedire il passaggio dall'ala al centroboa; così il 2 può avvicinarsi alla porta.
- Scelta sulle ali: o si pressano (rischiando il tiro da 1 o 5), o si lasciano tirare da lì, dove si vede meno porta.
- Il marcatore del centroboa deve spingerlo lontano dalla porta: se perde il duello, l'avversario tira da vicino.
- Quando la marcatura a uomo viene battuta, conta la reazione in inferiorità (uomo in meno).
- Come si difende oggi (indicazione di Ale, novembre 2026): di base pressing, uomo contro uomo. Nella seconda parte dell'azione, soprattutto se il marcatore del centroboa è in difficoltà (non è più davanti al centroboa ma gli è finito alle spalle), la difesa passa a zona a M o a un'altra zona.
- CHI LASCIARE TIRARE: la zona si costruisce decidendo a chi concedere il tiro. Si lascia tirare da 1 (ala destra) se in quel momento l'avversario non ha un mancino in quella posizione (un destro da lì ha poco angolo); si lascia tirare da 2 o da un altro posto se lì c'è un giocatore scarso al tiro o che di solito non tira. Il marcatore del giocatore "lasciato" si stacca verso il centro e resta staccato anche quando quello riceve palla; gli altri restano più vicini al proprio uomo.
  Nel gioco (v0.18): `chiLasciare` in `src/ia.js` sceglie il giocatore di perimetro con il valore più basso di (Potenza + Precisione) / 2, corretto per la mano rispetto al lato (destro sul lato destro: meno pericoloso, soprattutto da ala; mancino sul lato destro: più pericoloso; il contrario a sinistra) e un po' ridotto per le ali, che vedono meno porta. Il computer lo fa da solo quando passa a zona; il giocatore lo ottiene chiamando Zona o Zona a M dalla barra degli schemi.
Proposte per l'IA: aggiungere la "Zona a M" agli schemi difensivi; scelta automatica della difesa in base all'avversario (centroboa forte → zona/M; tiratori forti dal perimetro → pressing); il -2 che si abbassa quando la palla va in 1; parametro "aggressività del pressing" legato a Disciplina e al rischio di espulsioni.

## 5. Attacco
- Con l'area di porta le ali (1 e 5) contano di più: possono ricevere già dentro i 2 metri se sono fuori dall'area di porta, guadagnando un tempo di gioco, soprattutto in superiorità.
- Il tiro dalle ali è diverso (porta più chiusa dalle braccia vicine): serve un tiro specifico da 1 e 5, più difficile.
- Il centroboa si serve più facilmente dalle ali; se prende posizione rivolto verso 1 o 5, la seconda linea della difesa deve abbassarsi e si libera spazio per 2 e 4.
- Contro il pressing: sempre "carichi sulle gambe" e movimenti in entrata che servono a creare il tiro, non solo a servire il centroboa.
- Più duelli uno contro uno con le regole nuove: servono esplosività e capacità di andare al tiro dopo il palleggio.
- Fine partita: 7 contro 6 con il portiere avanzato in attacco per creare superiorità, di solito dopo un time-out.
Proposte per l'IA: schema "palla all'ala e servizio al centroboa"; attaccante in 2 che attacca lo spazio quando il -2 si abbassa; 7 contro 6 con portiere avanzato nell'ultimo minuto se si è sotto di un gol; time-out per preparare l'ultima azione.

## 6. Tecnica di tiro (esempi dai migliori tiratori)
- Più finte ampie mantenendo le gambe stabili, poi tiro di potenza.
- Tiro di polso che parte senza caricare, cambiando direzione e togliendo il tempo al portiere.
- Elevazione che supera il braccio alto del difensore.
- Torsione del busto che lascia pensare al primo palo, poi chiusura in diagonale con il polso.
- In superiorità: movimento corale, elevazione di tutti i tiratori, spostamento delle gambe senza palla, tiro al volo.
Proposte: tiro di polso rapido (poco caricamento, meno potenza, più sorpresa per il portiere); finta che sposta il portiere verso un palo; tiro al volo su passaggio in superiorità; peso maggiore dell'elevazione (gambe, Forza, Resistenza) nella precisione sopra il muro.

## 7. Portiere
- Sui passaggi da 2 a 5 o da 4 a 1 il portiere deve coprire una diagonale lunga: è il momento in cui è più vulnerabile.
- Il portiere lancia le controfughe con passaggi lunghi.
- Può avanzare in attacco per il 7 contro 6.

## 8. Allenatore e time-out
- Il time-out serve anche a ridare calma dopo una serie di espulsioni subite e a chiedere più attenzione in marcatura.
Proposta: l'IA chiama il time-out dopo un parziale negativo o una serie di espulsioni, non solo per stanchezza.

## Fonti
- Nuove regole: più lotta ai 2 metri e gol dal perimetro, crollano le reti "dinamiche" (analisi di Giannouris, Singapore 2025): https://www.wpdworld.com/area-tecnica/nuove-regole-piu-lotta-2-metri-gol-perimetro-crollano-reti-dinamiche/
- Di Cecca: "Ali più importanti con le nuove regole": https://www.wpdworld.com/news/cecca-ali-piu-importanti-le-nuove-regole/
- Tempestini: "Azzurrini a un buon livello, ma l'uno contro uno va migliorato": https://www.wpdworld.com/news/tempestini-azzurrini-un-buon-livello-luno-uno-va-migliorato/
- Settebello di misura sulla Spagna (pressing e zona a M): https://www.wpdworld.com/news/amichevole-settebello-spagna-napoli/
- World Cup: Settebello–Stati Uniti (pressing ed espulsioni): https://www.wpdworld.com/news/world-cup-2a-giornata-settebello-stati-uniti/
- Europei 2026: Settebello–Slovacchia e Grecia–Settebello: https://www.wpdworld.com/news/europei-belgrado-2026-4a-giornata-settebello-slovacchia/ e https://www.wpdworld.com/news/europei-belgrado-2026-10a-giornata-grecia-settebello/
- Da dove nasce la capacità di tiro? (Cufino): https://www.wpdworld.com/area-tecnica/nasce-la-capacita-tiro/
- Portiere in attacco: ecco come cambia la pallanuoto: https://www.wpdworld.com/area-tecnica/portiere-attacco-cambia-la-pallanuoto/
- Referti A1 2025-26 (superiorità e rigori): Pro Recco–Trieste, Telimar–Quinto, Trieste–SIS Roma, Plebiscito–Trieste su wpdworld.com
- Non letti (non raggiungibili da qui): pagine 2 e 3 della categoria Tattica, le puntate di "Tecnicamente" (sono soprattutto video) e il PDF con i numeri completi dello studio di Giannouris.
