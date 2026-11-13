# Palla e acqua — ricerca, modello e piano

Rapporto completo (fonti, controllo della fisica attuale, modello matematico, parametri, test, rischi):
https://claude.ai/artifact/4H7yZMi99DmYJVPEvsKeWp (13 novembre 2026). Qui il riassunto che serve per lavorare.

## Fonti lette (8 su 12)
- **World Aquatics, Competition Regulations 2025, art. 20.4.3**: massa 400–450 g; circonferenza 0,68–0,71 m (raggio 0,108–0,113 m); pressione **7,5–8,5 psi (circa 52–59 kPa)** per gli uomini.
- **de Mestre 2004, «Bouncing a water polo ball»** (atti 7M&CS, p. 143): la base del modello. Palla a = 0,11 m, m = 0,425 kg.
  - Galleggia con 3,7 cm sott'acqua (calotta sferica, verificato in vasca).
  - Caduta da 1,5 m: arriva a 5,34 m/s, il punto più basso affonda 14 cm, riesce a 1,4 m/s dopo 0,145 s (e = 0,26).
  - Equazione in acqua: z'' = g − K·z·z'² − B·z²(3a − z), K = π ρw a Cd/(4m) = 95,54, B = π ρw g/(3m) = 24172.
  - Impatto obliquo misurato (video a 25 fps): 10,7 avanti / 6,2 giù → 6,6 avanti / 1,8 su. Portanza CL/CD tra 1 e 2,4: nessun valore riproduce entrambe le velocità.
  - Rifatto al calcolatore il 13/11/2026: affonda 14,2 cm, esce a 1,50 m/s, contatto 0,146 s.
- **Belden et al. 2016** (PMC4743002): le sfere leggere ed elastiche rimbalzano ad angoli fino a circa 3 volte quelli delle sfere rigide.
- **Truscott e Techet 2009** (MIT): S = rΩ/V; CL fino a 0,46; Cd 0,4; massa aggiunta 0,2–0,5; la rotazione si spegne in circa 0,3 s sott'acqua.
- **NASA, Drag of a sphere** e **Mayme e Mungan 2025**: un tiro a 20 m/s è nella zona del crollo della resistenza (Reynolds ≈ 2,9·10⁵), quindi il Cd in aria è incerto (0,3–0,47).
- **Gabor et al. 2023** (PMC10142048): solo superficie della palla. ATTENZIONE: la pressione 90–97 kPa che riporta è sbagliata (vale il regolamento).
- **Rapier**, documentazione JavaScript: forze, impulsi, massa e inerzia esplicite, smorzamento, CCD.
- Bloccate dalla lettura automatica (non aggirate): MDPI 2026, Springer 2021, Scientific Reports 2019, ScienceDirect 2022. Ale le sta recuperando.

## Piano approvato (13 novembre 2026, «vai avanti»)
1. **FATTO** — Strumenti senza cambiare il gioco (sotto).
2. Palla in aria: raggio unico 0,1106 m, inerzia del guscio (2/3·m·a²), passo fisso 1/240 s, Cd e Magnus dai parametri, mira ricalibrata.
3. Palla in acqua: volume immerso, Archimede, resistenza e portanza della parte immersa, massa aggiunta; via le regole «schizzo» e «tonfo».
4. Rotazione in acqua. 5. Urti (pali, bordi della vasca, palla respinta da mani e portiere). 6. Effetti grafici dagli eventi fisici, con un generatore casuale solo per la grafica. 7. Tiro a schizzo e bilanciamento con i video.

## Passo 1 — cosa c'è
- `src/fisica-palla/parametri.js`: tutti i numeri della palla con unità, fonte, intervallo e tipo (misurato / derivato / letteratura / da calibrare). `IN_USO` = valori di oggi (letti da `palla.js` e `tiri.js`), `PROPOSTI` = nuovo modello, non ancora usati.
- `diagnosi` ed `energia` in `palla.js`: solo lettura (altezza, immersione e volume immerso, forze, freni, ultimo impatto con angolo ed energia prima/dopo).
- Pannello `?fisica` nell'indirizzo (`src/fisica-palla/pannello.js`), immagine `docs/immagini/pannello-fisica.png`.
- `npm run fisica-acqua` (`tests/fisica-acqua.mjs`, in Node senza browser, anche nei controlli automatici): i 10 scenari del rapporto con i riferimenti, traiettorie in `tests/screenshot/fisica-acqua.svg`. Fallisce solo per comportamenti impossibili (numeri non validi, palla che attraversa palo o traversa, energia che cresce in aria, due giri uguali con risultati diversi).
- Partita simulata identica (`npm run aspetto -- --confronta=`), `fisica-palla` e `dati-tesi` superati.

## La palla di oggi misurata (passo 1)
| Scenario | Oggi | Riferimento |
|---|---|---|
| 1. Caduta da 1,5 m | arriva a 5,12 m/s, affonda 16,5 cm, non riesce («tonfo») | 5,34 m/s, 14 cm, esce a 1,4 m/s (de Mestre) |
| 2. Galleggia | 7,8 cm sott'acqua (raggio 0,12) | 3,7 cm (de Mestre) |
| 3. Spinta a 3 m/s | 1,85 m in 5 s | da video |
| 4. Palombella | 4,3 cm dal punto mirato | entro 5 cm ✓ |
| 5. Tiro teso | 0,886 della velocità dopo 5 m | 0,917 ± 0,02 (tesi Patumi) |
| 6. Radente 18 m/s, 10° | tre rimbalzi identici, tiene l'83% | 50–80% (da video) |
| 7. 30° (caso misurato) | «tonfo», non esce | esce a 6,6 / 1,8 m/s (de Mestre) |
| 8. Con rotazione | la rotazione non cambia l'uscita | in avanti > nessuna > indietro |
| 9. Palo | 31% dell'energia (atteso 37%), 0 attraversamenti su 1000 | rimbalzo² ± 5% |
| 10. Risale da −0,3 m | non esce, ferma dopo 1,3 s | risale e si ferma ✓ |
- Scarto tra 30, 60 e 120 passi al secondo: 0,7%.
- Trovato: a palla ferma in acqua la velocità verticale segnata resta 0,06 m/s (gravità di Rapier e galleggiamento si alternano a ogni passo); la palla però non si muove.
