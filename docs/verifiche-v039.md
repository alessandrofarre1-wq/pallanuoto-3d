# Verifiche v0.39 — CAMBI e consegna

Eseguite il 14 novembre 2026, Chromium software con viste touch simulate. Non sono misure di FPS su iPhone fisico.

| Comando/controllo | Esito |
|---|---|
| `npm run lint` | PASS, 0 errori; warning preesistente `gx` inutilizzato in `src/lotta.js:40`. |
| `npm run verifica` | Sei partite terminate: senza comandi 0–11/0–8/0–5, con comandi casuali 0–11/0–11/1–13. Totale 60 gol su 224 tiri (27%). Primo comando FAIL solo sui quattro vecchi riferimenti grafici, perché CAMBI ha cambiato posizione e fondo. |
| Ispezione immagini e `npm run verifica:aggiorna -- --partite=0` | Guardati tutti i quattro confronti prima/dopo: scene coincidenti, CAMBI spostato come richiesto. Differenze iniziali 0,80%, 0,81%, 2,93%, 2,24%. Riferimenti aggiornati; home invariata. PASS. |
| `npm run verifica -- --partite=0` | PASS: 13 controlli qualità/ombra/riserva, cinque immagini identiche ai nuovi riferimenti, nessun errore di pagina. Le sei gare già eseguite non sono state ripetute dopo il solo aggiornamento dei riferimenti. |
| `npm run aspetto -- --no-build` | PASS: partita finita, 0 campioni con gambe fuori acqua su 4.646 verticali, 7.959 nuotata e 863 transizione. iPhone 844×390: 84 oggetti/141.658 triangoli; 667×375: 81/141.632. I primi piani diagnostici desktop sono 153.074–155.586 triangoli, già come v0.38 e fuori dalle viste specifiche iPhone. |
| `npm run hud -- --no-build` | Tre taglie iPhone × tre stati (normale, espulsione appena, countdown). Nessuna sovrapposizione; palla, giocatore controllato e porte liberi nelle nove scene. Copertura centrale 2% su SE, 0% sugli altri. |
| `node strumenti/misura-fluidita.mjs` | PASS. Su touch 844×390 e 667×375, DPR1,50: picco azione 93 oggetti/142.268 triangoli; due cambi simultanei 97/148.380. Entrambi strettamente sotto 100/150.000. Dati in `docs/misure-fluidita-v039.json`. |
| Controllo aggiuntivo layout CAMBI/lotta | 12 combinazioni di 667×320, 667×375, 844×390, 932×430 con safe area sinistra/destra/basso 0/0/0, 44/44/21, 59/0/21. Pulsante alto44px e centrato nell'area sicura; nessuna sovrapposizione con lotta o comandi, anche considerando 8px aggiuntivi di zona sensibile. Nomi ITA#9/HUN#9 nella barra lotta senza overflow. Risultati in `docs/misure-cambi-v039.json`. |
| Bozza di menu separata dal gioco | Home/torneo/pausa e interazioni dimostrative controllate a 320/736/1024px, senza errori JavaScript o overflow. Scelta modalità/nazionale, esempio di girone, tattica mantenuta cambiando pannello, salva/esci/riprendi nell'esempio. La copia HTML standalone è stata aperta nel browser e verificata anche senza runtime della conversazione. |

Il programma del gioco è cambiato soltanto negli stili di CAMBI e barra lotta, oltre al numero di versione. Nessuna modifica alla simulazione, all'AI o alla geometria. I risultati con tasti casuali non rappresentano la difficoltà o il divertimento percepiti da un giocatore reale: questi restano oggetto della prossima revisione con Ale.

Schermata reale: [CAMBI su iPhone SE](proposte/cambi-v039-iphone-se.png). Proposte separate: [tornei/menu/arena](proposte/tornei-menu-arena.md), [piano gameplay](gameplay-prossimi-passi.md), [passaggio a Claude Code](PASSAGGIO-CLAUDE-CODE.md).
