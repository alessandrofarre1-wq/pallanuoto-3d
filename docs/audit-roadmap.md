# WATERPOLO 7 — Audit tecnico e roadmap (proposta, da approvare)

Data: 12 novembre 2026 · Codice analizzato: branch `claude/gracious-rubin-rcvklk` (v0.25 + menu WATERPOLO 7).
Stato: **solo analisi**. Nessuna riga del gioco è stata cambiata per questo rapporto. Si implementa solo dopo l'ok di Ale.

## 0. Come leggere questo rapporto e limiti della verifica

- **[CODICE]** = verificato leggendo il codice (con file e funzione).
- **[LOCALE]** = verificato sulla documentazione installata con il progetto (Rapier 0.21 in `node_modules`, Three.js 0.187) o sui documenti già raccolti nel repository (`docs/tattica.md`, `docs/tecnica.md`, dati della tesi Patumi in `CLAUDE.md`).
- **[DA VERIFICARE]** = dato da fonte esterna che in questa sessione NON è stato possibile leggere: l'ambiente cloud blocca `pubmed.ncbi.nlm.nih.gov`, `pmc.ncbi.nlm.nih.gov`, `wwpra.org`, `rapier.rs` e `www.worldaquatics.com` (errore di rete «host non risolto»). Per verificarli serve aggiungere questi indirizzi alle impostazioni di rete dell'ambiente. **Nessun valore scientifico di quelle fonti è riportato qui come certo.**
- **[PROPOSTA]** = cosa suggerisco di fare.
- **[IPOTESI]** = causa probabile, da confermare con una misura.
- **[DA CALIBRARE]** = parametro da regolare guardando video reali o partite simulate.

## 1. Stato attuale (verificato nel codice)

### 1.1 Palla e fisica — `src/palla.js`, `src/fisica.js`
- [CODICE] Unità coerenti: metri, secondi, chilogrammi; gravità `G=9.8` (`costanti.js`).
- [CODICE] Rapier 0.21: un corpo dinamico per la palla con **CCD attivo** (`setCcdEnabled(true)`), sfera di raggio `RAGGIO=0.12` m, massa `0.43` kg, rimbalzo (restitution) 0,6, attrito 0,5; pali e traversa capsule di 4 cm (restitution 0,62); rete come tre scatole sottili con restitution 0,02 e regola di combinazione `Min` (la palla si ferma).
- [CODICE] Aria: resistenza quadratica `-ARIA·|v|·v` con `ARIA=0.0245` (tarata sulla tesi Patumi: 13,3 → 12,2 m/s in 5 m) ed effetto Magnus semplificato `EFFETTO·(ω×v)` con `EFFETTO=0.0045`. `velocitaDiLancio` corregge la partenza simulando il volo, così tiri e passaggi arrivano dove si mira.
- [CODICE] Acqua (`passoPalla`): non è simulata da Rapier. Quando il centro scende sotto `BRV` si applicano a mano: galleggiamento lineare verso la quota `QUOTA_GALLEGGIA=0.05` (palla «un terzo sott'acqua»), smorzamenti esponenziali (orizzontale 1,6/s, verticale 7/s, rotazione 3/s). All'impatto dall'aria: **schizzo** se velocità orizzontale > 8,5 m/s e angolo < 21° (rimbalzo con 55% della velocità verticale, 84% dell'orizzontale), altrimenti **tonfo** (45% / 35%).
- [CODICE] I corpi dei giocatori in Rapier sono sfere cinematiche di 0,2 m all'altezza della testa, attive **solo per la palla vagante**.
- [CODICE] Parata, muro e intercetto **non sono urti fisici**: sono decisi con probabilità in `updateBall` (`fisica.js`, blocchi «parata», «muro», `letto`), poi la palla respinta riparte con velocità impostate a mano (es. muro: `vx*=-0.2`, `vy=1+rnd()*1.5`).
- [CODICE] Gol e fuori si decidono dal passaggio vero della linea (`lineaDiPorta`); dopo il gol `ball.inRete` smorza la palla nella rete.
- [CODICE] Passo di simulazione: `main.js` divide il fotogramma in passi da massimo 0,02 s; a 60 fps un passo è 1/60 s. Un tiro a 25 m/s percorre ~0,42 m per passo: senza CCD attraverserebbe un palo da 8 cm; con il CCD attivo è coperto [LOCALE: `RigidBodyDesc.setCcdEnabled`, Rapier 0.21; esiste anche la «soft CCD» per oggetti moderatamente veloci].
- [CODICE] Mano → volo: la palla parte da `p.ballW` (giunture di `pose.js`); il disegno usa `p.ballVistaW` (mano vera del personaggio). La continuità mano/volo è quindi garantita nel gioco ma **può esserci un piccolo salto visivo** al rilascio tra la mano disegnata e il punto di partenza reale.

### 1.2 Tiri, passaggi, ricezione — `src/tiri.js`, `src/controllo.js`
- [CODICE] Velocità massima del tiro `vMax=(22.8+(pot-75)·0.16)` m/s, ridotta per tiri non classici (`doShoot`); tempo di frustata 166–189 ms (`startAct`), gomito al rilascio 147°–157° (`pose.js`): tutti dalla tesi Patumi [LOCALE].
- [CODICE] Errore di mira (`situazioneTiro`, `mira`): cresce con distanza oltre 7 m, marcatura, stanchezza; precisione indipendente dalla potenza (dato della tesi).
- [CODICE] Varianti: polso, finta, torsione, al volo, palombella, beduina, sciarpa, colonnello.

### 1.3 Movimento e animazioni — `src/fisica.js` (`movePlayer`), `src/grafica/pose.js`, `src/grafica/corpo.js`
- [CODICE] Movimento scivoloso con curve ampie e alzata in 0,25 s (`ALZATA`), legato al corpo da `p.oriz`.
- [CODICE] Corpo disegnato con la postura inclinata in nuotata (`posturaVista`), immersione per profondità (`sottacqua.js`), ginocchia e bacino tenuti sotto la superficie (`sottoIlPelo`).
- [CODICE] Scala visiva dei giocatori `VIS=1.45` (`costanti.js`) e palla disegnata 1,3 volte più grande: **i corpi sono disegnati il 45% più grandi del vero** rispetto alle distanze di gioco.

### 1.4 IA — `src/ia.js`
- [CODICE] Posizioni d'attacco da tabelle (`FORM`, `FORM_UP`), salita scaglionata per corsie (`attackTarget`), marcatura per ruolo (`MARK`, `markTarget`) a 0,8–1,0 m dal proprio uomo sul lato porta, zona e zona a M con il «lasciato» (`chiLasciare`), rientro difensivo (`rientro`), palla vagante (`chiVaSullaPalla`), uomo in più/meno (`postiInferiorita`).
- [CODICE] Separazione (`steer`): solo tra **compagni**, raggio 1,6 m, peso 0,5; dagli **avversari** solo aggiramento di chi sta sulla traiettoria. Il contatto corpo a corpo esiste solo come rallentamento (`contactT` in `fisica.js`).
- [CODICE] `scegliDifesa()` restituisce sempre 2 (pressing); la zona arriva a metà azione (`aggiornaDifesa`).

### 1.5 Regole e cronometri — `src/regole.js`, `src/partita.js`, `src/costanti.js`
- [CODICE] Campo 25 m, porta 3×0,9 m, possesso 28 s, 18 s dopo espulsione/angolo/rimbalzo ripreso, espulsione 18 s con rientro anticipato, terzo fallo grave = cambio, rigore dai 5 m con gli altri sulla linea dei 6, area dei 2 m, tiro libero dentro/fuori dai 6, time-out 2 a squadra.
- [CODICE] Il tempo di gioco scorre solo in `play` (le interruzioni `stop` lo fermano); il possesso si ferma dopo un tiro respinto finché qualcuno riprende palla.
- [CODICE] Arbitraggio a probabilità (`tackle`, `ARBITRO`), tre livelli.
- [DA VERIFICARE] Allineamento puntuale con il testo World Aquatics di febbraio 2026 e con le modifiche 2025 riassunte dalla WWPRA: non leggibili da qui. Il repository le aveva già usate come fonte nelle sessioni precedenti (vedi «Fonti indicate da Ale» in `CLAUDE.md`), ma questo rapporto non le ha ricontrollate.

### 1.6 Telecamera, comandi, HUD, prestazioni
- [CODICE] Telecamera laterale con inseguimento morbido (`render.js`, `lerp` 2,5–3/s), zoom dal menu (`CAM_ZOOM`), allargamento nelle ripartenze (`camLargo`).
- [CODICE] Solo orizzontale in partita; HUD ai margini (v0.24–v0.25); comandi touch ridisegnati (v0.25).
- [CODICE] Qualità adattiva: solo risoluzione (`main.js`). Misura sul computer di prova con schermo da iPhone: 88 oggetti disegnati, 135 mila triangoli. **FPS su iPhone vero non misurati** (serve il contatore FPS sul telefono di Ale).

## 2. Problemi verificati e impatto

| # | Problema | Verifica | Impatto |
|---|---|---|---|
| P1 | Parata, muro e intercetto decisi a probabilità, non dalla geometria di braccia e mani | [CODICE] `updateBall` | Esiti a volte incoerenti con ciò che si vede (palla «parata» lontano dalle mani, muro senza contatto); difficile calibrare con video |
| P2 | Galleggiamento e attrito dell'acqua costruiti a mano (lineari ed esponenziali), non in funzione del volume immerso | [CODICE] `passoPalla` | Comportamento credibile ma non fisico; quota di galleggiamento («un terzo sotto») [IPOTESI] più bassa di quella di una palla vera, che con massa e raggio regolamentari galleggerebbe più alta |
| P3 | Schizzo sull'acqua a soglia fissa (8,5 m/s, 21°) con coefficienti fissi | [CODICE] | Rimbalzi radenti tutti uguali; nessuna dipendenza continua da angolo e velocità |
| P4 | Raggio di collisione 0,12 m e massa 0,43 kg: valori plausibili ma non confrontati con il regolamento in questa sessione | [CODICE] + [DA VERIFICARE] | Piccolo effetto su pali e traversa |
| P5 | Affollamento davanti alla porta | [CODICE] + [IPOTESI] | Leggibilità dell'azione; vedi §4 |
| P6 | Corpi disegnati 1,45 volte più grandi del vero | [CODICE] `VIS` | [IPOTESI] Contribuisce molto alla sensazione di affollamento e copre le linee di passaggio |
| P7 | Nessuna separazione tra avversari salvo l'aggiramento sulla traiettoria; nessun «ingombro» fisico tra giocatori | [CODICE] `steer` | Corpi che si compenetrano nelle mischie |
| P8 | Possibile salto visivo della palla al rilascio (mano disegnata ≠ punto di partenza) | [CODICE] | Estetico, visibile nei primi piani |
| P9 | La difesa del computer parte sempre in pressing (`scegliDifesa` fisso) | [CODICE] | Varietà tattica limitata |
| P10 | Tiri e gol per squadra ancora sopra una partita vera (42 tiri contro circa 28; già annotato in `CLAUDE.md`) | [LOCALE] | Ritmo poco realistico |
| P11 | FPS e consumo su iPhone non misurati da qui | — | Rischio non quantificato |

## 3. Evidenze scientifiche e normative applicabili

- [LOCALE] Tesi Patumi (PoliTo): velocità al rilascio dei professionisti 22,8 ± 2,4 m/s; perdita in aria da 13,3 a 12,2 m/s in 5 m (atlete); tempo di frustata 166–189 ms; gomito 147°–157°; rigori segnati 80,1% negli studi citati; precisione non correlata alla forza. Già applicati e misurati da `npm run dati-tesi`.
- [DA VERIFICARE] Melchiorri et al. (PubMed 22212254) e lo studio sui livelli competitivi (PubMed 25369278): velocità di tiro e cinematica per livello. Da usare per **calibrare** la distribuzione delle velocità per bravura e i tempi di caricamento, non come valori fissi.
- [DA VERIFICARE] Studio PMC10142048 sulle proprietà della palla in partita (superficie, presa, assorbimento d'acqua): utile per massa, attrito e rotazione, se riporta valori misurati.
- [DA VERIFICARE] World Aquatics, febbraio 2026, e riepilogo WWPRA 2025: confronto articolo per articolo con §1.5.
- [LOCALE] Rapier: il CCD si abilita per corpo (`setCcdEnabled`); la «soft CCD» (`setSoftCcdPrediction`) è pensata per oggetti sottili e moderatamente veloci e, con valori grandi, pesa sul broad-phase; restitution in [0,1] con regola di combinazione tra i due corpi (`setRestitutionCombineRule`).
- [LOCALE] Tattica e tecnica moderne (`docs/tattica.md`, `docs/tecnica.md`): più lotta ai 2 metri e gol dal perimetro con le regole attuali; tempi in verticale e in orizzontale; posizionamento del portiere con il passaggio.

## 4. Affollamento davanti alla porta: cause

- [CODICE] Le posizioni d'attacco sono tutte entro ~8 m dalla porta (`FORM`: boa 2,6 m, ali 1,7 m dalla linea di porta a ±6,2 m di lato, mezzi 5,8 m a ±4,6, punto 7,5 m), più sette difensori a 0,8–1 m dai loro uomini sul lato porta, più il portiere: 13 corpi in circa 8×13 m.
- [CODICE] La zona a M e il rientro stringono i difensori al centro; nella zona il marcatore del boa sta tra palla e boa.
- [CODICE] La separazione vale solo tra compagni: attaccante e difensore possono sovrapporsi.
- [IPOTESI] La scala visiva 1,45 rende i corpi grandi quasi una volta e mezza il vero: a parità di distanze, la mischia sembra molto più fitta. **Prima di toccare l'IA va misurato quanto pesa questo fattore** (screenshot con `VIS` a 1,0–1,2 a parità di partita simulata: la scala è solo disegno, il gioco non cambia).
- [IPOTESI] La telecamera laterale alta schiaccia la profondità: i giocatori sul lato lontano si sovrappongono a quelli vicini.
- Da NON fare: allontanare tutti artificialmente. La lotta per la posizione ai 2 metri è reale; serve spaziatura corretta sul perimetro e linee di passaggio libere, non distanze finte.

## 5. Soluzioni proposte, complessità, rischi, priorità

| ID | Proposta | Priorità | Complessità | Rischi |
|---|---|---|---|---|
| A1 | **Misurare la scala visiva**: confrontare `VIS` 1,45 / 1,25 / 1,1 con screenshot a telecamera fissa (solo disegno) | **P0** | bassa | Corpi più piccoli = meno riconoscibili su schermi piccoli: decide Ale guardando |
| A2 | **Strumento di leggibilità**: in `tests/hud.mjs`, misurare quanta parte di palla, porta e linee di passaggio è coperta da corpi (non solo dall'HUD) | **P0** | media | Nessuno sul gioco |
| A3 | **Ingombro tra avversari** in `steer`: separazione morbida anche tra avversari fuori dalla lotta e dai contatti voluti (marcatura del boa esclusa) | P1 | media | Cambia il gioco: ribilanciare marcature e contrasti; partite simulate diverse |
| A4 | **Spaziatura d'attacco**: ali più larghe e meno dentro i 2 m, punto e mezzi sul perimetro con linee di passaggio libere (controllo: nessun compagno sulla linea palla–compagno) | P1 | media | Cambia la conversione dei tiri: va rimisurata con `npm run bilancio` |
| A5 | **Varietà difensiva del computer**: `scegliDifesa` in base al punteggio, alla forza del boa e al tempo (oggi fisso al pressing) | P2 | bassa | Bilanciamento |
| B1 | **Galleggiamento dal volume immerso** (calotta sferica) con densità dell'acqua e massa della palla; resistenza idrodinamica proporzionale a v² con area immersa | P1 | media | Partite simulate diverse; parametri [DA CALIBRARE] |
| B2 | **Rimbalzo radente continuo**: coefficiente di schizzo funzione di angolo e velocità, invece della soglia fissa | P1 | bassa | Da calibrare con video di tiri a schizzo |
| B3 | **Parata e muro geometrici**: collider cinematici per mani e avambracci del portiere e del braccio alzato del difensore (pochi capsule mossi dalle giunture), con la probabilità che resta solo come «riflesso» del portiere | P1 | **alta** | Cambia molto il gioco (conversione, parate); costo CPU contenuto ma da misurare; serve una sessione dedicata |
| B4 | **Continuità mano–volo**: far partire la palla dalla mano disegnata o raccordare il disegno nei primi 50 ms | P2 | bassa | Toccando `ballW` cambiano le partite simulate: preferire il raccordo solo visivo |
| B5 | **Valori regolamentari della palla** (massa, circonferenza) dopo la verifica delle fonti | P2 | bassa | Piccolo |
| C1 | **Verifica regole 2026** articolo per articolo e test automatici per ogni regola toccata (come `npm run azione`) | P1 | media | Richiede l'accesso alle fonti |
| D1 | **Misura FPS su iPhone** con il contatore (Ale) e prova lunga di 10 minuti | **P0** | nessuna (da Ale) | — |
| D2 | **Frame pacing**: passo fisso di simulazione (es. 1/60 s con accumulatore) invece di passi variabili, per una fisica ripetibile anche se il telefono rallenta | P2 | media | Cambia leggermente le partite simulate |
| E1 | **Assistenza alla mira** facoltativa su touch (aggancio al palo più vicino all'intenzione) | P2 | media | Rende il tiro più facile: va bilanciato |

## 6. Piano in PR piccole e indipendenti (ordine proposto)

1. **PR «Misure di leggibilità»** (A1 + A2): solo strumenti e screenshot, nessun cambiamento al gioco. Esito: decisione di Ale sulla scala visiva.
2. **PR «Scala visiva»** (solo se Ale la sceglie): `VIS` e palla, con `npm run aspetto` che dimostra il gioco identico.
3. **PR «Galleggiamento e acqua della palla»** (B1 + B2): `palla.js`, prove in `npm run fisica-palla` (galleggiamento a riposo, rimbalzo radente a 3 angoli, smorzamento).
4. **PR «Spaziatura e ingombri»** (A3 + A4): `ia.js`, con `npm run bilancio` prima/dopo.
5. **PR «Parata e muro geometrici»** (B3): sessione dedicata; prova con tiri ripetuti allo stesso punto.
6. **PR «Regole 2026»** (C1): dopo l'accesso alle fonti.
7. **PR «Passo fisso»** (D2) e **«Assistenza alla mira»** (E1): facoltative.

## 7. Test automatici e verifiche manuali

- Esistenti da tenere verdi: `lint`, `verifica`, `fisica-palla`, `dati-tesi`, `statistiche`, `azione`, `aspetto`, `cronaca`, `hud`, `menu`.
- Nuovi proposti:
  - `fisica-palla`: galleggiamento a riposo (quota del centro), tempo per fermarsi in acqua da 3 m/s, schizzo a 10°/20°/30° e 15/20/25 m/s, palla che non attraversa mai pali e traversa a 30 m/s (CCD).
  - `parate` (con B3): 200 tiri allo stesso angolo con il portiere fermo; la palla toccata deve passare vicino a mani o braccia.
  - `leggibilita` (A2): percentuale di palla e porta visibili nei fotogrammi di una partita simulata; numero medio di corpi sovrapposti davanti alla porta.
  - `bilancio`: tiri, gol, parate, espulsioni per squadra prima/dopo ogni PR di IA o fisica.
- Manuali (Ale su iPhone): FPS con il contatore; prova di 10 minuti (calore, batteria); lettura dell'azione davanti alla porta; sensazione del «peso» della palla dopo B1/B2.

## 8. Parametri da calibrare con video reali

- Rimbalzo radente: velocità e angolo minimi per lo schizzo, frazione di velocità conservata.
- Galleggiamento: quanto la palla affonda ferma; quanto oscilla dopo un tonfo.
- Smorzamento in acqua: distanza percorsa da una palla lasciata a 2–3 m/s.
- Distribuzione delle velocità di tiro per livello (dopo la verifica degli studi indicati).
- Tempi di reazione del portiere e distanza a cui arriva la mano (per B3).
- Spaziatura in attacco: distanze tipiche tra i sei attaccanti e tra boa e marcatore (da riprese dall'alto).
- Scala visiva: dimensione dei corpi a schermo rispetto alla porta (3 m).

## 9. Cosa serve da Ale

1. Approvare (o cambiare) le priorità e l'ordine delle PR del §6.
2. Per verificare le fonti: aggiungere all'ambiente cloud gli indirizzi `pubmed.ncbi.nlm.nih.gov`, `pmc.ncbi.nlm.nih.gov`, `wwpra.org`, `rapier.rs`, `www.worldaquatics.com` (oppure mandare in chat i PDF).
3. Misura FPS su iPhone con il contatore (D1).
4. Se possibile, 2–3 video di riferimento: tiri a schizzo, palla che galleggia, azione davanti alla porta ripresa dall'alto.
