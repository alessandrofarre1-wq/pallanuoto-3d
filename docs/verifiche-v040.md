# Verifiche v0.40

Questa consegna introduce funzionalità nel gioco. La PR comprende tornei, menu e pausa integrati, rigori, rose, gameplay e arena. Le misure sono ottenute in Chromium software: non sono FPS su un iPhone fisico.

| Controllo | Esito e limiti |
|---|---|
| `npm run lint` | PASS, 0 errori; solo warning preesistente `gx` in `lotta.js`. |
| `npm run verifica` completo | 17 gruppi test tornei e 13 controlli qualità superati. Sei gare terminate: senza comandi 0–11/0–9/0–10; con tasti casuali 0–18/1–14/0–20. 83 gol su 264 tiri, 31%. Primo esito FAIL sui cinque vecchi riferimenti (99,35%, 3,99%, 3,89%, 3,57%, 3,30%): home, arena e movimento sono cambiati. |
| Aggiornamento dei riferimenti | Ispezionate home, campo, porte e confronti; `npm run verifica:aggiorna -- --partite=0` PASS. `npm run verifica -- --partite=0` PASS: tutti i 17 gruppi tornei, 13 controlli qualità e cinque immagini identiche. Sei gare complete già eseguite, non ripetute per il solo aggiornamento dei riferimenti. |
| `npm run aspetto -- --no-build` | PASS: gara finita, nessuna gamba sopra l'acqua nei 3.834 campioni verticali, 8.590 in nuotata e 960 transizione. Touch 844×390 e 667×375: 62 chiamate/142.316 triangoli nelle due scene. Primi piani diagnostici desktop fino a 154.792, fuori dalle viste specifiche iPhone. |
| `node tests/tornei.mjs` | PASS, 17 gruppi. Titolo in 6/7/8 gare; tutti i punti di eliminazione; punti riportati Europei; classifiche WA; 32 combinazioni nazionale/formato; salvataggio JSON; seme, risultati e consultazione senza duplicazioni. Incroci Mondiali verificati sul calendario ufficiale. |
| `npm run tornei-menu -- --no-build --foto` | PASS. Mondiali salvati e ripresi dopo reload; pausa congela tempi ed energie; uscita avverte; otto gare Europei con Francia fino al titolo; premiazione saltabile; bacheca persistente; slot indipendenti; singola non cancella i tornei. I risultati sono imposti a fine quarto tempo per verificare l'integrazione, non per simulare una partita sportiva completa. |
| `npm run rigori-finali` | PASS: cinque tiratori distinti, chiusura anticipata, oltranza con pari opportunità, ordine/JSON; carica-rilascio e volo reali, gol/parata/timeout, pausa, cronometri fermi e fine serie. Risultato regolamentare separato. Verificata anche rimozione delle finte/pressioni residue senza ricaricare la stamina. |
| `npm run gameplay` | PASS. Passaggio e palombella anticipati eseguiti una sola volta al primo frame consentito; cancellazioni, libero nei 6 m e pressione rispettati. Destinatario umano unico in 200 richieste identiche. Linea di passaggio aperta dopo 1,283 s, spostamento max 1,167 m, distanza minima compagni 2,911 m. Quattro opportunità AI: da 650 ms a 17 ms nelle scene sintetiche. |
| Menu preesistenti e nuovi | `npm run menu -- --no-build --solo-controlli`: 57/57 su 393×852, 852×393 e 667×320, nessun errore JS. Controllati singola, scelte, ritorno, impostazioni, pausa/comandi e ripresa. |
| Budget iPhone con due cambi | Controllo dedicato `strumenti/misura-fluidita.mjs --foto`: massimo osservato 67 chiamate/148.430 triangoli su entrambe le viste 844×390 e 667×375, DPR1,50. Azione 63/142.318. Dati in `docs/misure-fluidita-v040.json`. Nessuna deroga. |
| Rigenerazione dati | Output temporaneo dal database più supplemento ufficiale: 24 rose/312 schede identiche al risultato inserito. Le sedici rose precedenti e i loro metadati sono rimasti identici alla v0.39. |

**Decisioni modificate esplicitamente:** la singola modalità si estende a tre; home/pausa ridisegnate; formazione statica senza palla sostituita da piccoli appoggi situazionali; attese AI ridotte solo davanti a un vantaggio concreto. Camera unica, ritmo, sprint a tocchi, regole, probabilità del portiere, acqua e corpi restano quelli già concordati. I vecchi test che isolano l'AI impostano anche `reazioneT` insieme a `decideT`; gli assert non sono stati indeboliti.

**Limiti effettivi:** il salvataggio è fra gare; uscire da una gara la fa ricominciare, con avviso esplicito. La cerimonia usa immagini e SVG, non corpi 3D nuovi. L'ordine dei cinque rigoristi è automatico e non esiste una scelta manuale del portiere. Forza/rating e assegnazione dei sette posti delle otto nuove rose sono stime, mentre nomi/numeri/ruoli generali/mano hanno fonte ufficiale. Mancano prova e giudizio di Ale su iPhone fisico: la sensazione di gioco non è certificata dai test.

## Correzione del controllo GitHub sezione4

La prima pipeline sul commit `1b79f72` si è fermata a sezione4: tutte le prove precedenti, inclusi tornei e rigori, erano passate. L'unico controllo fallito contava 0 schizzi/0 colonnelli in una partita libera di 500 s, che non garantiva occasioni eleggibili.

È stata corretta anche la scelta di gioco: la ricezione con tiro rapido considerava soltanto i tiri ordinari, riducendo la finestra del tentativo speciale per fotogramma. Ora la decisione rapida può scegliere uno speciale lecito con peso 35%, mantenendo risposta immediata, tiro classico e limite computer di 6,5 m. Non sono modificati probabilità del portiere, gesto o forza del tiro.

Il controllo verifica direttamente la decisione del portatore nelle due controfughe, il tiro classico alternativo e il divieto con distanza eccessiva, difensore davanti, tiro libero interno o pressione. Restano tutte le prove precedenti di mano, gesto, comando umano e tasto a comparsa. Il test è verificato anche contro il codice precedente per dimostrare che individua il difetto; il risultato della pipeline completa verrà registrato nella PR.
