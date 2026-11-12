# Come calcolare le valutazioni dei giocatori reali

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
