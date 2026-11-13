# Palla e acqua — ricerca, modello e piano

Rapporto completo (fonti, controllo della fisica attuale, modello matematico, parametri, test, rischi):
https://claude.ai/artifact/4H7yZMi99DmYJVPEvsKeWp (13 novembre 2026). Qui il riassunto che serve per lavorare.

## Fonti lette (12 su 12; ScienceDirect solo anteprima)
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
- Mandate da Ale come PDF (13/11/2026; i siti bloccavano la lettura automatica):
  - **Hurd et al. 2019** (Sci. Rep.): angolo critico **θc = 18°/√SG** (de Jonquières 1883); forza dell'acqua F = ½ ρw |U|² Sw sin(α + β) (Rosellini, Belden); «water walking» solo per sfere morbide (G/ρwU² < 0,02, β < 20°): non riguarda la palla gonfia (stima 0,14 a 20 m/s).
  - **Lyu, Yun e Wei 2021** (J. Marine Sci. Appl.): sfera d'acciaio da 7 mm a 57–59 m/s; confine v1 = 17,5·θ1 − 45,5; angolo massimo 6,5° (conferma θc = 18°/√SG); energia persa che cresce con l'angolo, oltre metà sopra 3°. Solo la forma vale per noi.
  - **Gabor et al. 2026** (Appl. Sci. 16, 6686): angolo di contatto molto diverso tra marche (Malmsten 135–155°, Mikasa Test Ball 111°, Mikasa 47–67° lungo i solchi, Kap 7 circa 58°). Niente rimbalzi né peso dell'acqua: solo ipotesi qualitative (i solchi rendono più casuale la palla dopo lo schizzo).
  - **Zhang, Ren e Zhao 2022** (Ocean Eng.): solo anteprima (testo a pagamento). La rotazione dà effetto Magnus anche nello schizzo; nessun numero.
- Per la palla da pallanuoto (SG 0,075) la formula darebbe θc ≈ 66°, ma è fuori dal campo verificato: conta il comportamento del modello di de Mestre, controllato con i test.

## Piano approvato (13 novembre 2026, «vai avanti»)
1. **FATTO** — Strumenti senza cambiare il gioco (sotto).
2. **FATTO** — Palla in aria: misure vere, inerzia del guscio, passo massimo 1/240 s, Cd e Magnus dai parametri, mira ricalibrata (sotto).
3. Palla in acqua: volume immerso, Archimede, resistenza e portanza della parte immersa, massa aggiunta; via le regole «schizzo» e «tonfo».
4. Rotazione in acqua. 5. Urti (pali, bordi della vasca, palla respinta da mani e portiere). 6. Effetti grafici dagli eventi fisici, con un generatore casuale solo per la grafica. 7. Tiro a schizzo e bilanciamento con i video.

## Passo 1 — cosa c'è
- `src/fisica-palla/parametri.js`: tutti i numeri della palla con unità, fonte, intervallo e tipo (misurato / derivato / letteratura / da calibrare). `IN_USO` = valori di oggi (letti da `palla.js` e `tiri.js`), `PROPOSTI` = nuovo modello, non ancora usati.
- `diagnosi` ed `energia` in `palla.js`: solo lettura (altezza, immersione e volume immerso, forze, freni, ultimo impatto con angolo ed energia prima/dopo).
- Pannello `?fisica` nell'indirizzo (`src/fisica-palla/pannello.js`), immagine `docs/immagini/pannello-fisica.png`.
- `npm run fisica-acqua` (`tests/fisica-acqua.mjs`, in Node senza browser, anche nei controlli automatici): gli 11 scenari del rapporto con i riferimenti, traiettorie in `tests/screenshot/fisica-acqua.svg`. Fallisce solo per comportamenti impossibili (numeri non validi, palla che attraversa palo o traversa, energia che cresce in aria, due giri uguali con risultati diversi).
- Partita simulata identica (`npm run aspetto -- --confronta=`), `fisica-palla` e `dati-tesi` superati.

## La palla di oggi misurata (passo 1)
| Scenario | Oggi | Riferimento |
|---|---|---|
| 1. Caduta da 1,5 m | arriva a 5,12 m/s, affonda 16,5 cm, non riesce («tonfo») | 5,34 m/s, 14 cm, esce a 1,4 m/s (de Mestre) |
| 2. Galleggia | 7,8 cm sott'acqua (raggio 0,12) | 3,7 cm (de Mestre) |
| 3. Spinta a 3 m/s | 1,85 m in 5 s | da video |
| 4. Palombella | 4,3 cm dal punto mirato | entro 5 cm ✓ |
| 5. Tiro teso (13,3 m/s, come nella tesi) | circa 12,1 m/s dopo 5 m (calcolato) | 12,2 ± 0,25 m/s (tesi Patumi) |
| 6. Radente 18 m/s, 10° | tre rimbalzi identici, tiene l'83% | 50–80% (da video) |
| 7. 30° (caso misurato) | «tonfo», non esce | esce a 6,6 / 1,8 m/s (de Mestre) |
| 8. Con rotazione | la rotazione non cambia l'uscita | in avanti > nessuna > indietro |
| 9. Palo | 31% dell'energia (atteso 37%), 0 attraversamenti su 1000 | rimbalzo² ± 5% |
| 10. Risale da −0,3 m | non esce, ferma dopo 1,3 s | risale e si ferma ✓ |
| 11. Energia persa e angolo (14 m/s) | 5°: 31%, 10°: 32%, da 20° non esce più | cresce con l'angolo (Lyu 2021) |
- Scarto tra 30, 60 e 120 passi al secondo: 0,7%.
- Trovato: a palla ferma in acqua la velocità verticale segnata resta 0,06 m/s (gravità di Rapier e galleggiamento si alternano a ogni passo); la palla però non si muove.

## Passo 2 — palla in aria (13 novembre 2026)
- Raggio della palla per gli urti 0,1106 m (era 0,12), massa 0,425 kg (era 0,43), inerzia di una palla cava 2/3·m·a² (era quella di una sfera piena, 2/5): `setAdditionalMassProperties` in `palla.js`, collisore a densità zero.
- Il fotogramma si divide in passi di al massimo 1/240 s (`passoMax`): a 60 fotogrammi al secondo sono 4 passi. Risultato uguale a 30, 60 e 120 fotogrammi al secondo (scarto 0,0%, prima 0,7%). La velocità «fantasma» della palla ferma scende da 0,061 a 0,015 m/s.
- Resistenza dell'aria calcolata da Cd = 0,42 (era 0,0245 1/m fisso, cioè circa 0,46): ricavato dalla tesi Patumi, che misura la velocità **in valore assoluto** (Tabelle 5.2–5.6). Nella stessa situazione della tesi (13,3 m/s da 1,2 m) la palla arriva a 12,20 m/s dopo 5 m (tesi 12,2). ATTENZIONE: guardando solo la velocità in avanti verrebbe Cd 0,32, ma la tesi riporta il modulo.
- Magnus da cMagnus = 0,75 (stesso effetto di prima). La mira (`velocitaDiLancio`) usa lo stesso passo del volo vero e tiene conto del calo della rotazione: palombella a 1,8 cm dal punto mirato (prima 4,3).
- `fisica-palla`: la prova «palo interno» ora controlla il passaggio della linea tra i pali (come decide il gol in partita). Trovato: dopo l'urto con l'interno del palo la palla perde quasi tutta la velocità in avanti e scivola lungo la linea (attrito palla–palo 0,4 in media): c'era già prima; da tarare nel passo 5.
- Partite di prova (`npm run verifica`): 63 gol su 211 tiri (30%), prima 69 su 217 (32%); nessun errore. `dati-tesi`, `statistiche`, `azione` superati.
- `npm run bilancio` (12 partite ITA–USA, 4×8 min, per squadra a partita), prima → dopo: gol 13,3 → 14,5; tiri 41,7 → 43,1; tiri in gol 31,9% → 33,6%; nello specchio 71,8% → 68,6%; parate 16,6 → 15,1; superiorità trasformate 32,6% → 36,9%; rigori segnati 78,8% → 71,4% (pochi rigori: poco significativo); vittorie 6–6 → 9–3. Con 12 partite differenze di questa misura stanno quasi tutte nel caso: il gioco resta nella stessa fascia.
