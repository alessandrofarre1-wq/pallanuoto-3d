# WATERPOLO 7 — proposta tornei, menu e arena

Proposta del 14 novembre 2026 per Ale, raccolta nella PR v0.39 insieme al solo spostamento del pulsante CAMBI. Tornei, nuova home/pausa e nuova arena restano proposte da discutere. La bozza delle schermate usa dati di esempio: non rappresenta un torneo salvato realmente. Il modello della porta originale resta invariato.

**Direzione proposta.** Affiancare a Partita singola due campagne complete, Mondiali ed Europei, con le rispettive formule reali. Dare al gioco una presentazione sportiva più decisa e un ambiente da competizione internazionale, mantenendo stile cartoon e fluidità su iPhone.

## Le tre modalità

| Modalità | Struttura proposta | Gare della vincitrice |
|---|---|---:|
| Partita singola | Scegli nazionale e avversaria, gioca e consulta il risultato | 1 |
| Mondiali | Formula maschile Singapore 2025, con regole di partita attuali | 6 o 7 |
| Europei | Formula maschile Belgrado 2026, con regole di partita attuali | 8 |

I riferimenti alle edizioni indicano la formula e le partecipanti di partenza. Non sono una riproduzione dei risultati storici: ogni nuova campagna ha un nuovo sorteggio. Budapest 2027 conferma 16 squadre, ma il materiale verificato non basta a sostituire il formato documentato di Singapore con un nuovo tabellone.

**Mondiali.** Sedici nazionali in quattro gironi da quattro, tre partite per nazionale. Le prime accedono direttamente ai quarti. Seconde e terze giocano spareggi incrociati: 2A–3B, 3A–2B, 2C–3D, 3C–2D. Seguono quarti, semifinali e finale. Vincendo il girone bastano sei incontri per il titolo; passando dallo spareggio ne servono sette.

**Europei.** Sedici nazionali in quattro gironi da quattro. Passano le prime tre, che formano due gruppi da sei: E unisce A+C, F unisce B+D. Si conservano punti e gol degli incontri già disputati **contro le altre qualificate**; la partita contro la quarta iniziale non conta nella nuova classifica. Ogni nazionale gioca tre nuovi incontri contro le provenienti dall'altro girone, senza ripetere gli scontri già fatti. Le prime due di E e F giocano le semifinali incrociate, poi finale e bronzo. Non ci sono quarti di finale. Percorso del campione: 3+3+1+1 = otto gare.

## Sorteggio e svolgimento

Prima scegli la nazionale; poi viene eseguito un sorteggio casuale con una squadra per fascia in ogni girone. Userei le fasce ufficiali delle due edizioni come base, evitando gruppi del tutto casuali con tutte le favorite insieme.

| Fascia | Mondiali 2025 | Europei 2026 |
|---|---|---|
| 1 | Serbia, Croazia, USA, Spagna | Spagna, Croazia, Italia, Ungheria |
| 2 | Grecia, Ungheria, Italia, Brasile | Grecia, Montenegro, Serbia, Romania |
| 3 | Montenegro, Romania, Australia, Canada | Paesi Bassi, Slovacchia, Georgia, Francia |
| 4 | Giappone, Cina, Sudafrica, Singapore | Slovenia, Turchia, Malta, Israele |

Il sorteggio viene salvato all'avvio e resta identico rientrando nella campagna. Non aggiungerei vincoli continentali non documentati: ai Mondiali reali esistono anche gironi con tre europee.

- Giochi soltanto gli incontri della tua nazionale. Il computer simula gli altri, tenendo conto della forza delle squadre e di una componente casuale: una favorita può perdere, ma i punteggi devono restare plausibili.
- Dopo ogni giornata vedi risultati, classifica, prossima avversaria e situazione della qualificazione. Il percorso cambia correttamente tra Mondiali ed Europei.
- Ogni turno simulato viene registrato una sola volta insieme alla partita giocata. Ricaricare non risorteggia né risimula i risultati già consolidati.
- Quando esci dalla corsa al titolo, termina la campagna giocabile; i piazzamenti inferiori vengono simulati. Questo è un adattamento esplicito: le competizioni reali prevedono altri incontri di classificazione.
- Dopo una semifinale persa proporrei **Gioca per il bronzo / Simula il bronzo**. È l'unica partita aggiuntiva proposta dopo l'eliminazione dal titolo, perché assegna una medaglia.

Il motore delle classifiche deve applicare l'intera procedura World Aquatics per le parità, compresi gli scontri diretti. Le regole attuali prevedono 3 punti per vittoria nei tempi regolamentari, 2 per vittoria ai rigori, 1 per sconfitta ai rigori, 0 per sconfitta nei tempi regolamentari. I gol della serie di rigori non entrano in differenza reti. Queste sono le regole attuali del gioco: non vanno presentate come una ricostruzione integrale del regolamento storico del 2025.

**Due lavori necessari, già verificati nel progetto:** la serie di rigori finale non è ancora implementata; gli Europei richiedono otto nazionali oggi assenti anche dal database sorgente: Francia, Georgia, Paesi Bassi, Slovacchia, Slovenia, Turchia, Malta, Israele. Servono rose e valori verificati. Le sedici partecipanti ai Mondiali 2025 sono già presenti.

## Trofei e premiazione

Propongo due coppe originali riconoscibili: una mondiale con elemento sferico e onde, una europea più slanciata con due manici. Sono proposte di design; non le presenterei come repliche dei trofei ufficiali. Per l'Europeo è documentata l'assegnazione di una coppa incisa; per la premiazione mondiale sono documentati medaglie, inno e bandiere.

Alla vittoria finale: fischio conclusivo, reazione della squadra, breve inquadratura del capitano che solleva la coppa, squadra e medaglie, schermata CAMPIONI con il percorso completato. Sequenza di circa 8–12 secondi, sempre saltabile. Bacheca permanente con coppa, nazionale, competizione e riepilogo del torneo; bronzo e argento registrati come medaglie.

La cerimonia usa una scena dedicata: si libera la partita prima di caricare palco, coppa e gruppo in posa. Così la celebrazione può essere curata senza sommare oggetti e triangoli all'arena attiva. La sequenza non introduce rallentamenti durante le azioni di gioco.

## Home e centro torneo

Il riferimento è il linguaggio di EA SPORTS FC 26: titoli grandi, poche azioni ordinate, atleta in evidenza, competizione e prossima sfida immediatamente leggibili. Manteniamo WATERPOLO 7, l'atleta cartoon e l'identità acquatica.

La proposta usa blu notte e superfici chiare o scure secondo l'aspetto dell'interfaccia, un accento turchese per l'azione principale e oro riservato ai trofei. Titoli inclinati e compatti, etichette semplici, pannelli con poco rumore grafico. Nella bozza si possono provare colore delle azioni e angoli dei pannelli.

In home, se esiste una campagna, la prima azione è **Continua torneo**, con nazionale, fase e prossima avversaria. Subito sotto rimangono sempre visibili **Partita singola, Mondiali, Europei**. Seguono bacheca, comandi e opzioni. Propongo uno slot indipendente per ciascuna competizione: fare una partita singola non deve cancellare il torneo.

Il centro torneo riunisce prossima partita, classifica, calendario, risultati e percorso verso il titolo. Agli Europei mostra le due fasi a gironi; ai Mondiali mostra lo spareggio quando necessario e il tabellone dai quarti. Gli avversari futuri compaiono soltanto quando sono determinati.

La bozza navigabile contiene home, un esempio di centro Europei e pausa. Le schede modalità aprono la scelta della nazionale e un esempio locale di girone; non avviano una partita vera. L'esempio del centro torneo resta Italia–Montenegro, indipendente dal sorteggio dimostrativo.

## Pausa e salvataggi

La schermata deve mostrare sempre competizione, nazionali, risultato, tempo e cronometro. **Riprendi** è l'azione principale; seguono formazione e cambi, tattiche, comandi/opzioni, salva e torna alla home. Le impostazioni non reintroducono scelta di velocità o telecamera.

Durante la pausa devono fermarsi tempo di gioco, possesso, espulsioni, IA, fisica, consumo e recupero delle energie. Formazione e tattiche si preparano senza far avanzare la partita; i cambi richiesti si eseguono alla ripresa secondo le regole. Il gioco deve andare in pausa anche passando a un'altra app.

Propongo salvataggio automatico dopo ogni partita e un punto di ripresa al momento della pausa/uscita: **Salva e torna alla home** deve conservare la situazione effettiva della partita, non soltanto il risultato provvisorio. Il salvataggio completo deve comprendere tempi, possesso, palla, giocatori, espulsioni, cambi, sequenza casuale e stato del torneo. È lavoro nuovo, da verificare con uscita e ripresa reali; la semplice pausa già presente non equivale a questo salvataggio.

In Partita singola può esserci Ricomincia. Nei tornei proporrei Abbandona torneo come azione secondaria con conferma; eviterei un riavvio involontario che cancella il percorso. La home deve spiegare quale partita verrà ripresa.

## Arena: tribune, bordi e delimitazioni

Interverrei prima sugli elementi vicini al campo e più riconoscibili durante le riprese:

1. **Porte:** telaio bianco credibile, galleggianti leggibili, rete con profondità e leggera reazione al gol. Apertura e collisioni devono coincidere.
2. **Corde galleggianti:** dischi più riconoscibili, cavo continuo, attacchi e lieve oscillazione condivisa. Rossi fino a 2 m, gialli tra 2 e 6 m, verdi nel tratto centrale; riferimenti e pozzetto restano coerenti con il regolamento. È un miglioramento delle delimitazioni, senza rifare l'acqua.
3. **Bordo vasca:** griglia di drenaggio, fasce antiscivolo, scalette nelle posizioni compatibili con il campo, panchine, tavolo ufficiali e orologi del possesso. Dettagli utili a dare scala, senza invadere il passaggio degli arbitri o nascondere la palla.
4. **Tribune:** sostituire l'effetto di fondale piatto con gradoni, parapetti, accessi e pubblico disposto su più livelli. Le persone lontane restano immagini leggere con piccoli movimenti collettivi; niente migliaia di personaggi completi. Bandiere, colori del torneo e cartelloni completano il carattere da evento.

Userei inizialmente una sola arena curata, vestita in modo diverso per Mondiali ed Europei. Rimane la stessa visuale televisiva funzionale al gioco; elementi vicini alla telecamera devono sparire o abbassarsi quando coprono l'azione.

## Il modello della porta inviato

Il file GLB è valido e si apre correttamente. È conservato in `dati-sorgente/modelli/porta-fornita.glb`, fuori dal caricamento del gioco, con [anteprima](porta-riferimento.png). SHA-256: `fa629f86fb080701573d1ab321807a17ee646e3ad92b8905518e4adb015fcd75`. Contiene una mesh e un materiale, 42.395 vertici, **46.086 triangoli**, tre texture 4096×4096 e pesa **7.859.172 byte**. Le due porte possono condividere immagini e geometria, ma i triangoli vengono comunque disegnati due volte.

L'ingombro grezzo è X 0,5771 × Y 0,5954 × Z 0,9807, con larghezza lungo Z e fronte verso +X. Sono unità del modello, non metri certificati. Dalla geometria il vano fra i pali è stimato in circa 0,803 unità: una scala uniforme che lo portasse a 3 m darebbe profondità complessiva circa 2,16 m, altezza sopra i galleggianti nell'ordine di 1,8 m e pali circa 20 cm. Le misure del vano sono stime geometriche, ma bastano a escludere un semplice ingrandimento uniforme.

Il regolamento World Aquatics attuale prescrive **3 m interni tra i pali, 0,90 m tra acqua e sotto-traversa, sezione rettangolare di pali e traversa larga/alta 75–80 mm**, rete profonda almeno 0,30 m. La porta attuale del gioco usa 3×0,90 m, pali grafici da 8 cm e profondità 0,80 m: queste misure sono compatibili. I collisori arrotondati restano un'approssimazione fisica separata da validare.

**Proposta per usare il tuo modello:** conservarne l'aspetto generale, ricostruire telaio e galleggianti nelle proporzioni corrette, trasferire l'aspetto della rete su pochi piani e ridurre le immagini a massimo 1024. Obiettivo iniziale **400–500 triangoli per porta**, da verificare sull'intera scena e dalla telecamera di gioco. La rete deve restare leggibile, senza sfarfallio o trama troppo fitta su iPhone. Non è un asset già pronto o già integrato.

Il limite grafico vale anche durante due cambi simultanei. L'ultima misura v0.38 è **97 oggetti / 148.380 triangoli** nel caso peggiore verificato su viste touch: rispetto alle soglie nominali restano 3 chiamate e 1.620 triangoli, ma occorre rimanere strettamente sotto 100 e 150.000. Inserire due copie del GLB originale, sostituendo le vecchie superfici solide, darebbe una stima di **240.456 triangoli**. Questa è una stima, non una misura di integrazione.

Non propongo una deroga. La nuova arena dovrà sostituire o accorpare gli elementi esistenti, liberando spazio prima di aggiungere dettagli. Il guadagno visivo arriverà soprattutto da proporzioni, materiali, immagini e disposizione, con geometria concentrata dove si vede. Le misure esistenti sono conteggi in Chromium software, non una prova di FPS su iPhone fisico.

## Ordine di realizzazione proposto

1. **Prima il gameplay:** risposta dei comandi, compagni senza palla e AI avversaria. Ale segnala macchinosità e poca voglia di rigiocare: questa è la priorità, prima di aggiungere modalità. Vedi [piano gameplay](../gameplay-prossimi-passi.md).
2. Concordare questa struttura e il linguaggio di home/pausa.
3. Motore dei tornei, rigori finali, sorteggio, simulazioni, classifiche e salvataggi; partire dai Mondiali, che hanno già tutte le nazionali.
4. Europei con seconda fase, punti riportati e otto nuove rose verificate.
5. Bacheca e premiazione, con coppe distinte e sequenza saltabile.
6. Porta ottimizzata, corde, bordo vasca e tribune, misurando ogni sostituzione sul caso peggiore iPhone.

I tornei e i salvataggi estendono le funzionalità attuali. Questa proposta non cambia le decisioni di camera unica, ritmo unico, stile cartoon, riflesso completo solo in qualità alta e limiti grafici senza sforamenti. La v0.39 cambia esplicitamente la posizione di CAMBI: da destra a basso centro, su richiesta di Ale; la barra della lotta viene alzata per evitare sovrapposizioni. Nelle PR attuative: incremento di versione, aggiornamento CLAUDE.md con file/numeri/non fatto, segnalazione esplicita delle decisioni eventualmente superate, esecuzione di npm run lint, npm run verifica e npm run aspetto con risultati reali nella descrizione. Per lo stato effettivo delle verifiche v0.39 leggere CLAUDE.md e la descrizione della PR; questa proposta non sostituisce quei risultati.

## Fonti verificate

- [World Aquatics — guida ufficiale Singapore 2025, calendario, formula e premiazione](https://resources.fina.org/fina/document/2025/06/06/28239196-d917-41c7-bc4d-abf3480b9368/Singapore-WCH-2025-Team-Leaders-Guide-Water-Polo_v1.pdf).
- [World Aquatics — fasce Mondiali 2025](https://www.worldaquatics.com/news/4251706/water-polo-tournament-world-aquatics-championships-singapore-2025-qualified-nations).
- [World Aquatics — sorteggio effettivo Singapore 2025](https://www.worldaquatics.com/news/4261014/draw-results-revealed-for-singapore-2025-water-polo-tournaments).
- [European Aquatics — regolamento Europei 2026](https://europeanaquatics.org/wp-content/uploads/2025/09/EWPC-26-REGULATIONS-FINAL-UPDATE.pdf), §§2.4–2.8: formula, punti riportati, classificazioni e trofeo.
- [European Aquatics — bollettino e fasce Europei 2026](https://europeanaquatics.org/wp-content/uploads/2025/08/Information-Bulletin-EWPC-Men-Belgrade-2026.pdf).
- [European Aquatics — finale e premiazione Europei 2026](https://europeanaquatics.org/ewpc-2026/belgrade/belgrade-2026-serbia-crowned-european-champions-after-defensive-masterclass-against-hungary/).
- [World Aquatics — regolamento aggiornato febbraio 2026](https://resources.fina.org/fina/document/2026/02/18/e6815ecc-06d9-4f0b-98e9-4c441cf5e6a3/2026-02-18_World-Aquatics_CR-Final.pdf): Parte VI §21.6 (porte), §21.7 (delimitazioni), Appendice 8 (punteggi e parità).
- [World Aquatics — qualificazione Budapest 2027](https://resources.fina.org/fina/document/2026/10/20/cdd0488d-56db-43be-820f-2ad72028aeac/20260930-World-Aquatics-Championships-Budapest-2027-Water-Polo-Qualification-CLEAN.pdf).
- [European Aquatics — qualificazione Europei 2028](https://europeanaquatics.org/the-road-to-the-2028-european-water-polo-championships-begins-in-georgia/), non una nuova formula della fase finale.
- [EA SPORTS FC 26 — menu e tornei come riferimento di interfaccia](https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-fut-deep-dive).

Riferimenti locali esaminati: CLAUDE.md (stato v0.38), src/menu.js, src/dati/squadre.json, src/dati/rose-db.json, dati-sorgente/database-giocatori.json, src/grafica/scena.js e src/palla.js. Il modello è stato analizzato e fotografato in una scena separata.
