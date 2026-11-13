# Come calcolare le valutazioni dei giocatori reali

## DALLA v0.34: database di Ale (13 novembre 2026) — metodo in uso
Fonte: `waterpolo_database` mandato da Ale (World Aquatics, Microplus, Omega): convocazioni, mano dominante, altezza, nascita e statistiche dei tornei con la nazionale (Mondiali Singapore 2025, Europei Belgrado 2026, Coppa del Mondo 2026 divisioni 1-2 e finali). Nel repository c'è solo l'estratto delle 16 nazionali del gioco (`dati-sorgente/database-giocatori.json`); il calcolo si rifà con `node strumenti/rose-dal-database.mjs dati-sorgente/database-giocatori.json` (o con il file completo `waterpolo.json`) e scrive `src/dati/rose-db.json`, che il gioco legge (`rosa` in `src/dati/rose.js`).

1. **Rosa**: la convocazione più recente con almeno 13 giocatori; 2 portieri (i più impiegati) e gli 11 giocatori di movimento con più minuti. Numeri di calottina, ruolo, mano, altezza e nascita veri (Cina: numeri mancanti, assegnati in ordine; cognomi uguali nella stessa squadra con l'iniziale o il nome).
2. **Ruolo nel gioco**: Goalkeeper → portiere; Centre Forward → centroboa; Centre Back/Defender/Point → punto (nel gioco è il marcatore del centroboa); Right/Left Wing → ala destra/sinistra; Wing e Driver → ala o mezzo, lato secondo la mano (mancino a destra).
3. **Titolari**: il miglior portiere e, posto per posto, il più forte del ruolo giusto (poi del ruolo più simile). Ale li cambia nella schermata Squadre.
4. **Forza della squadra**: resta quella del ranking (`squadre.json`, media da circa 57 a 80). Le statistiche dei tornei decidono chi è più forte DENTRO la squadra: ogni voce viene ricentrata sulla media della squadra, così il bilanciamento tra nazionali non cambia.
5. **Dati → statistiche** (per 32 minuti, confrontati con la media di tutti i giocatori di movimento delle 16 nazionali; chi ha giocato poco viene tirato verso la media in proporzione ai minuti):
   - Precisione = percentuale al tiro (con 12 tiri «di prudenza» alla media);
   - Potenza = gol e tiri a partita; Visione = assist; Passaggio = assist meno palle perse;
   - Difesa = palle rubate e tiri murati; Disciplina = espulsioni commesse («18C» al centro + «18F» in campo, o le sigle CP/FP/DS/M6/CS del rapporto dei Mondiali) e falli da rigore («P»);
   - Velocità = gol in controfuga e sprint vinti; Resistenza = minuti giocati a partita;
   - Forza = gol dal centro e altezza (centroboa e difensori), solo altezza per gli altri;
   - Portieri: Riflessi e Posizione = percentuale di parate (20 tiri «di prudenza»); Rigori = parate sui rigori; Uscita = parate in controfuga.
   - Verificato sui dati: «18C» è più alto per i difensori del centroboa (2,3 ogni 32 minuti) che per i centroboa (1,1): sono espulsioni COMMESSE, al centro e in campo.
6. **Età** e capitano come sotto (punto 5).
7. **Mano**: dal database (13 mancini su 208; 26 sconosciute = destra). Correzioni in `src/dati/mancini.json` (chiave «ITA-7»).
8. **Limiti** (dal README del database): sono osservazioni, non misure ufficiali di bravura; non ci sono velocità di nuoto o di tiro individuali né passaggi riusciti; dati dei club non collegati. Nel gioco sono STIME, correggibili.
9. Correzioni dei nomi (indicate da Ale) in `NOMI_CORRETTI` nello strumento: «KARLO Babic» della fonte è Karlo Babić (Croazia, n. 8).

---

## Metodo precedente (v0.16-v0.33, rose generate): resta come riferimento


Dati di partenza: `src/dati/rose-reali.json` (rose vere, ruolo, età, club, premi, statistiche dei tornei) e `src/dati/squadre.json` (forza delle squadre).
Non esistono statistiche pubbliche complete per ogni giocatore: le valutazioni sono STIME costruite con questo metodo, trasparente e modificabile. Ale può correggere a mano qualunque giocatore (file di correzioni, vedi in fondo).

## 1. Media della squadra
- Parte da `forza` in `squadre.json` (classifica Mondiali 2025).
- Per le 8 europee, correggere con la classifica degli Europei di Belgrado 2026 (`europei2026Classifica`: SRB, HUN, GRE, ITA, ESP, CRO, MNE, ROU): media tra le due posizioni.
- Le migliori squadre hanno media OVR intorno a 82, le più deboli intorno a 62.

## 2. Ruolo
- `ruolo` da Wikipedia: portiere, centroboa, difensore (marcatore del centroboa), esterno (perimetro). Per le squadre non europee c'è solo portiere/movimento: assegnare i ruoli in modo plausibile (2 centroboa, 2-3 difensori, il resto esterni) e segnarli come "ruolo stimato".
- I ruoli di Wikipedia vanno verificati: alcuni tiratori dal perimetro risultano "centroboa". Ale conferma o corregge.
- Profili per ruolo come da specifica in CLAUDE.md (centroboa forte e lento, esterni veloci e precisi, difensori con Difesa e Forza alte, portieri con le statistiche da portiere).

## 3. Riconoscimenti (bonus sulla valutazione complessiva, OVR)
- MVP di un torneo: +10. Miglior portiere: +8. All-star: +7 (portiere all-star: +6).
- Capocannoniere: +6. Tra i migliori marcatori: +3/+5.
- Capitano: +2 (soprattutto Visione e Disciplina).
- Club di vertice europeo (Pro Recco, Atlètic-Barceloneta, FTC-Telekom, Olympiacos, Novi Beograd, Radnički Kragujevac, Jadran Herceg Novi, Marseille, Brescia, Jadran Split, Mladost, Panathinaikos): +2.
- Se un giocatore ha più bonus, sommarli ma senza superare 94 di OVR.

## 4. Statistiche dei tornei → singole statistiche
- Percentuale al tiro: 58% o più → Precisione +8; 45-57% → +4; sotto 42% → -2.
- Tanti tiri e tanti gol (tra i migliori marcatori) → Potenza e Visione in attacco più alte.
- Portiere premiato → Riflessi e Posizionamento alti.

## 5. Età (dalla data di nascita, riferita a novembre 2026)
- Fino a 21 anni: Velocità +2, Visione -4, Disciplina -3.
- 22-30: picco, nessuna correzione.
- 31-34: Velocità -3, Resistenza -2, Visione +3.
- 35 e oltre: Velocità -6, Resistenza -4, Visione +5, Disciplina +2.

## 6. Mano
- Sconosciuta per tutti (`mano: null`): per ora tutti destri, tranne quelli che Ale indicherà come mancini. I mancini vanno sul lato destro (ala destra, mezzo destro).

## 7. Correzioni di Ale
- File `src/dati/correzioni.json`: per ogni giocatore Ale può fissare ruolo, mano, numero o singole statistiche; le correzioni vincono sempre sul calcolo.

## 8. Volti e corporatura (niente foto)
- NON si usano foto dei giocatori reali e non si cerca di renderli somiglianti: le immagini delle persone reali non si archiviano né si copiano nel gioco.
- Ogni giocatore ha un aspetto FISSO e suo, scelto una volta per tutte dal suo nome (stesso nome → sempre stessa pelle, stessa faccia tra quelle disponibili, stessa barba, stessa corporatura) e identico nella grafica realistica e in quella cartoon.
- Corporatura dal ruolo: centroboa e difensori la più robusta, esterni la più asciutta.

## Fonti
- Rose Mondiali 2025: https://en.wikipedia.org/wiki/Water_polo_at_the_2025_World_Aquatics_Championships_%E2%80%93_Men%27s_team_rosters
- Mondiali 2025 (classifica, marcatori, premi): https://en.wikipedia.org/wiki/Water_polo_at_the_2025_World_Aquatics_Championships_%E2%80%93_Men%27s_tournament
- Rose Europei 2026: https://en.wikipedia.org/wiki/2026_Men%27s_European_Water_Polo_Championship_squads
- Europei 2026 (classifica, marcatori, all-star): https://en.wikipedia.org/wiki/2026_Men%27s_European_Water_Polo_Championship
