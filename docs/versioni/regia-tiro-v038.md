# Regia unica e potenza del tiro — v0.38

Scelte esplicite di Ale del 14 novembre 2026, dopo il video Croazia–Spagna.
La stessa PR v0.38 comprende anche le ottimizzazioni della fluidità.

## Regia e informazioni di partita

- Una sola telecamera laterale alta. Seguendo la palla verso le porte, il
  punto guardato avanza più della posizione della telecamera: si crea una
  diagonale graduale verso sinistra o destra, con orizzonte stabile. Restano
  gli allargamenti automatici nelle ripartenze e la compensazione dei comandi
  touch. Nessuna visuale alternativa da menu, tasto C o controller.
- Joystick, frecce e levetta seguono le direzioni sullo schermo anche con la
  nuova diagonale: la proiezione sul piano della piscina usa gli assi della
  telecamera. Nella prova, la direzione «destra» coincide con quella dello
  schermo (prodotto scalare 1), senza rotazione dell'orizzonte.
- Ritmo unico **SPEED=1**, non modificabile dalle vecchie preferenze salvate.
  Scompaiono Lento/Normale/Veloce e Vicina/Normale/Larga. Restano durata del
  tempo, difficoltà e arbitro. Una prova con vecchie preferenze impostate su
  Veloce/Vicina misura 1,000 s di gioco per 1 s simulato reale.
- Tabellone in alto a sinistra con squadre, risultato, periodo, tempo e
  possesso. Sotto, righe compatte con sigla della squadra, numero, nome
  dell'espulso e tempo rimanente. Il nome rimane per tutta l'espulsione.
  L'evidenza iniziale si attenua; i dettagli sul fallo restano nel registro.
- Nome del giocatore controllato e schemi in alto a destra, pulsante cambi
  sotto quel gruppo. Le notifiche evitano anche gli altri pannelli. Il menu
  squadre è corretto sui 320 px di altezza: la freccia del pulsante Continua
  aveva un'interlinea che lo portava 2 px fuori dallo schermo.

File: `index.html`, `src/menu.js`, `costanti.js`, `stato.js`, `partita.js`,
`input.js`, `hud.js`, `cronaca.js`, `stile.css`, `grafica/render.js` e `scena.js`.

## Palla, carica e gesto

- Rimosso il guscio nero attorno alla palla; texture gialla/blu e materiale
  bagnato restano. Si risparmiano un oggetto e 352 triangoli per disegno.
- Tenere TIRO carica la potenza in 0,9 s. Sul telefono compare una barra
  accanto al pulsante e la percentuale; al massimo scrive **MAX**, con un
  bordo oro e fondo scuro leggibile. Su tastiera resta anche la barra nel
  pannello del giocatore, con «MAX — rilascia».
- La carica si ferma al massimo e aspetta il rilascio. È tolto il tiro
  automatico dopo 1,4 s durante l'azione. Resta la salvaguardia già esistente
  del rigore dopo 7 s. Tocco breve, doppio tocco/finta e occasioni di schizzo
  e colonnello mantengono i loro comandi.
- Al rilascio parte il gesto; a potenza piena si accentuano busto e chiusura.
  Beduina, sciarpa, schizzo e colonnello ricevono accenti coerenti con il loro
  gesto. Il nome del tiro appare brevemente nel comando. L'accento usa una
  copia delle sole giunture disegnate: le giunture fisiche, le traiettorie,
  la mira e le probabilità non ricevono bonus. La palla visibile segue la
  mano disegnata durante l'accento.
- Nessuna pausa cinematografica, cambio di visuale o rallentamento: il tempo
  di partita e i comandi continuano. Non sono aggiunti oggetti WebGL per
  questi accenti. I nuovi aggiornamenti dell'interfaccia avvengono soltanto
  quando i valori cambiano.

File: `src/controllo.js`, `partita.js`, `tiri.js`, `hud.js`, `stile.css`,
`grafica/scena.js` e `grafica/pose.js`.

## Verifiche

`npm run regia-tiro -- --foto` controlla la rimozione delle scelte, le vecchie
preferenze, i due orientamenti della telecamera, l'orizzonte, la corrispondenza
fra input e schermo, il tabellone e il pulsante Continua su 667×320. Tiene
premuto per 2 s: la palla resta in mano a potenza massima; il rilascio avvia
un tiro con potenza 1. Verifica anche gli accenti dei quattro gesti. Le foto
sono salvate in `/tmp/pallanuoto-tiro-max.png` e `/tmp/pallanuoto-gesto-*.png`.

`npm run hud`, `menu`, `cronaca` e `primi-piani` coprono le schermate e i
movimenti; `lint`, `verifica` e `aspetto` restano le verifiche richieste da
Ale. I test del menu saltano soltanto i disegni intermedi mantenendo tutti
gli aggiornamenti della simulazione, come già fatto negli altri test del
progetto. Il test cronaca ora controlla esplicitamente che il nome persista.

Picchi misurati su entrambi iPhone 844×390 e 667×375, DPR 1,50:

| Situazione | Oggetti disegnati | Triangoli |
| --- | ---: | ---: |
| Azione | 93 | 142.268 |
| Due cambi simultanei | 97 | 148.380 |

Tracce aggiornate in `misure-fluidita-v038.json`. Le misure non stabiliscono
gli FPS di un iPhone fisico. Le viste desktop ravvicinate di debug hanno un
budget diverso dalle viste touch usate per il limite iPhone.

## Decisioni precedenti superate

Su richiesta di Ale: scelta della visuale e dello zoom → regia unica;
Lento/Normale/Veloce → ritmo unico; indicatore dell'espulso che perdeva il
nome → numero, nome e timer persistenti vicino al tabellone; contorno nero
→ palla senza guscio; tiro automatico dopo una carica lunga → tiro al rilascio.
L'accento del tiro è una scelta di disegno, non un nuovo bonus statistico.

Restano da provare fluidità, leggibilità e intensità dei gesti su iPhone
fisico. L'esultanza e il ritorno al centro analizzati nel video restano una
proposta successiva: i tempi dopo il gol non sono modificati qui.

Esiti finali: lint e 13 controlli di qualità PASS; regia/tiro, menu, cronaca,
HUD, primi piani e aspetto completati. Le sei partite della verifica completa
sono terminate (60 gol / 224 tiri). Dopo i cambi visivi voluti sono stati
controllati e aggiornati i cinque screenshot di riferimento; il confronto
finale separato, con `npm run verifica -- --partite=0`, è PASS su tutte e
cinque le immagini. I dettagli e i risultati del primo confronto con i vecchi
riferimenti rimangono registrati in CLAUDE.md.
