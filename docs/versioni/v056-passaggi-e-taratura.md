# v0.56 — Passaggi non calamitati e taratura

Richiesta di Ale (18/11/2026, dopo aver giocato la v0.55): «Va decisamente meglio, però i passaggi sembrano calamitati. Direi di
evitare questo effetto e inoltre tara il gioco come dicevi.»

## 1. Passaggi «calamitati»

### Misura prima di correggere
Nuova sonda `strumenti/sonda-passaggi.mjs` (partita vera computer contro computer, ITA–HUN, seme fisso). Per ogni passaggio
misura come finisce, quanto si sposta la palla DISEGNATA nel fotogramma della presa e nei 12 fotogrammi dopo, dove era la palla
rispetto a chi riceve e quanto il ricevente si muove in volo.

v0.55 (240 s di gioco, 124 passaggi):
- la palla veniva «presa» quando passava entro **0,85 m dal centro del corpo** di chi riceve;
- in quel fotogramma la palla disegnata **saltava in media di 0,97 m** verso la mano (90% dei casi fino a 1,53 m, massimo
  1,87 m): era questo lo scatto che sembra una calamita;
- 121 passaggi su 122 presi avevano uno scatto oltre 0,4 m.

### Correzione
- **Presa alla mano** (`fisica.js`, `PRESA`): la palla si prende solo quando passa entro **0,5 m** dal corpo (braccio teso
  verso la palla) e sotto 1,5 m d'altezza. Si controlla tutto il tratto percorso nel fotogramma, così un passaggio veloce non
  «salta» il ricevente. Il passaggio che passa più lontano non si ferma: va avanti, cade in acqua e diventa una palla vagante.
- **Raccordo della presa** (`grafica/render.js`, `RACCORDO_PRESA` 0,12 s): la palla disegnata non salta nella mano, ci arriva
  con continuità da dove è stata presa (anche sugli intercetti). Solo disegno.
- **Braccia senza scatti** (`grafica/pose.js`, `BRACCIA_SMUSSO`): alcune pose aggiunte solo nel disegno (palla protetta, palla in
  acqua del centroboa con il difensore dietro, accompagnamento) cambiavano di colpo; la palla in mano saltava fino a 1,46 m in un
  fotogramma subito dopo la presa del centroboa. Ora gomiti e mani disegnati seguono la posa con un breve smussamento (14/s,
  40/s durante un gesto). Prova `aspetto --confronta`: partita identica.

### Dopo (480 s di gioco, 233 passaggi)
- scatto della palla disegnata nel fotogramma della presa: **0,21 m in media, massimo 0,26** (è il normale avanzamento della
  palla in volo in un fotogramma);
- passo più lungo nei 0,2 s dopo la presa: media 0,19 m, massimo 0,82 m (prima 1,46), solo durante il gesto rapido di un nuovo passaggio. Lo smussamento non vale in nuotata (la bracciata del crawl resta intera: prova `gesti`).

### Non fatto
- Nelle partite computer contro computer quasi tutti i passaggi arrivano (il ricevente va dove arriva la palla); quelli che
  passano oltre il braccio finiscono in acqua ma sono rari. Con il giocatore umano che muove il ricevente altrove ora la palla
  può sfuggire: da provare sul telefono.

## 2. Taratura

Riferimenti per squadra: Mondiali 2025 (13,3 gol, 33 tiri, 40%, 11 espulsioni, 1,8 rigori), Euro League (circa 50 azioni),
Mondiali 2009 in parità (palla persa circa 20%, durata circa 21 s).

### Cosa è cambiato
- `bilancio` stampa ora anche dopo quanti secondi finisce l'azione per ogni esito (`r.durate` in `statistiche.js`). Misura:
  i tiri in parità arrivavano già dopo circa 20 s (come nelle partite vere); erano espulsioni (10,6 s), palle perse (9 s) e falli
  in attacco (13 s) ad arrivare troppo presto.
- **Lotta al centro che cresce con l'azione** (`lotta.js`, `LOTTA_FASE`): nei primi 5 s di un'azione in parità espulsioni e
  falli al centro sono al 20%, crescono fino al pieno a 16 s. Con `ESPULSIONI.centro` 7 → 5,6 (`regole.js`).
- **Costruzione** (`ia.js`, `COSTRUZIONE`): nei primi 7 s di un'azione in parità il computer non tira al volo e cerca meno il tiro
  «da libero» (resta il tiro con nessun difensore davanti e quello entro 4,5 m). `PAZIENZA` 23+4 s → 24+3 s.
- **Passaggio sotto pressione** (`tiri.js`, `ERRORE_PASSAGGIO`): errore ×1,5 di base, fino a ×3,5 con un avversario addosso,
  +60% da distesi. Porta più intercetti e palle perse.

### Bilancio (8 partite ITA–HUN, per squadra)

| | v0.55 | v0.56 | partite vere |
|---|---|---|---|
| gol | 17,1 | 14,1 | 13,3 |
| tiri | 48,6 | 43,1 | 33 |
| tiri in gol | 35,3% | 32,8% | 40% |
| espulsioni | 14,5 | 11,4 | 11 |
| rigori | 1,9 | 1,9 | 1,8 |
| superiorità trasformate | 41,4% | 43,4% | 52% |
| intercetti | 3,3 | 4,3 | |
| azioni | 77,3 | 75,2 | circa 50 |
| parità: palla persa | 5,9% | 16,5% | circa 20% |
| parità: espulsione procurata | 24,3% | 17,9% | circa 22% |
| parità: fallo in attacco | 12,8% | 10,5% | circa 15% |
| parità: durata media | — | 13,5 s | circa 21 s |

Passi intermedi misurati: solo presa alla mano = gioco quasi uguale alla v0.55 (16,7 gol, 47,7 tiri, 14,1 espulsioni,
palla persa 9,1%); più errore sotto pressione = palla persa 15%, espulsioni 12,7.

### Non riuscito
- Le azioni restano 75 (contro 50) e durano 13,5 s (contro 21): palle perse ed espulsioni si sono spostate di 1-2 s, non di più.
  Per allungare davvero l'azione serve rivedere come si arriva in attacco (nuoto e circolazione), non solo l'arbitro.
- I tiri in gol sono scesi al 32,8% (obiettivo 40%): con più pazienza aumentano i tiri forzati a fine azione.
- Rigori segnati 67,7% (riferimento 75-80%): oscilla molto su 15 rigori.

## Prove
- `tests/sezione2.mjs`: la prova «il computer in difesa mette sotto pressione chi ha palla» si giocava a metà campo, dove la
  difesa rientra e il marcatore arriva o no addosso a seconda del caso (8-13 volte su 30 anche nella v0.55, soglia 9). Ora la
  scena è a 7 m dalla porta e l'attaccante tiene la palla: 24/30 (v0.55 nella stessa scena 26/30). Soglia invariata.
