# Pallanuotista cartoon — report tecnico del modello 3D

Modello di partenza: `model.glb` generato da Ale con Hunyuan 3D Pro a partire dal concept (30 MB; NON è nel repository, lo conserva Ale).
Tutte le verifiche sono state eseguite davvero con Blender 5.3 senza interfaccia (modulo Python `bpy`); gli script sono in `strumenti/blender/`.
Data: 12 novembre 2026.

## Esito in breve
**Il modello è tecnicamente idoneo** a diventare un personaggio animabile nel gioco. Nessun problema bloccante.
Restano però **differenze di disegno rispetto al concept** (capelli sulla fronte, occhi socchiusi, sorriso fisso, cuffia) che Blender non può
correggere senza rimodellare: su queste decide Ale (vedi "Fedeltà al concept").

## Fase 1 — Analisi tecnica (numeri misurati)

| Voce | Risultato |
|---|---|
| Oggetti | 1 sola mesh, nessuno scheletro, nessuna animazione |
| Triangoli / punti | 100.000 triangoli, 60.754 punti nel file (49.992 dopo la saldatura delle cuciture) |
| Componenti scollegate | 772 nel file, ma sono solo le cuciture delle immagini: **dopo la saldatura è 1 unico guscio** |
| Buchi (spigoli di bordo) | 0 dopo la saldatura |
| Spigoli non manifold | 0 |
| Facce degeneri | 0 |
| Normali | coerenti e rivolte all'esterno (0 spigoli con verso incoerente, volume positivo) |
| Superfici sovrapposte | nessuna rilevata (guscio unico chiuso) |
| Posa | a "T", braccia orizzontali, gambe separate: la migliore per mettere lo scheletro |
| Dimensioni originali | alto 1,115 · largo 1,035 · profondo 0,245 (unità del generatore); portato a **1,80 m** |
| Materiali | 1 solo materiale PBR |
| Immagini | 3 da 4096×4096: colore, metallo+ruvidezza, rilievo (normal map) |
| Metallo / ruvidezza | metallo quasi zero (media 0,04), ruvidezza media 0,52: corretto per pelle e gomma |
| Coordinate delle immagini | 1 serie, generata in automatico: 772 isole piccole e disordinate |
| Dimensione del file | 30,3 MB (quasi tutto immagini) |

Dettagli completi in `analisi.json`, `saldata.json`, `dita.json`.

### Geometria reale o disegnata?
Render "solo geometria" (materiale grigio, senza immagini): `render/foglio-argilla.png`, `render/foglio-dettagli.png`.
- **Muscolatura: geometria vera** (pettorali, addominali, dorsali, deltoidi, quadricipiti, polpacci si vedono senza immagini).
- **Volto: geometria vera** (naso, bocca, zigomi, sopracciglia in rilievo, riccioli, paraorecchie, laccetti).
- La normal map è quasi piatta: aggiunge poco. Le luci e le ombre della pelle sono in gran parte **dipinte nell'immagine del colore**.
- Gli occhi sono dipinti sulla superficie (non sono bulbi separati); la bocca non ha interno.

### Mani e piedi
Misurato tagliando la mesh con piani e contando i contorni chiusi (`dita.json`), più i render `render/foglio-mani.png`.
- **Mani: 4 dita modellate ma unite tra loro** (un solo contorno chiuso dalla punta fino alle nocche), **pollice separato**.
  Le dita non si possono muovere una per una; la mano si muove come una paletta con il pollice.
- **Piedi: alluce separato, altre dita unite** (2 contorni per piede).

### Schiena, profilo, articolazioni
Ricostruiti correttamente: la schiena ha muscolatura propria (non è lo specchio del davanti), il profilo è pieno, spalle, gomiti, anche e
ginocchia sono volumi puliti. Gambe separate dal cavallo in giù (2 contorni sotto il 45% dell'altezza).

### Scheletro: prova fatta
`strumenti/blender/prova_scheletro.py`: ossatura umanoide di 19 ossa posata sulle misure del modello, pesi automatici di Blender, posa di prova.
- I pesi automatici **falliscono sul file così com'è** (per via delle cuciture) e **riescono dopo la saldatura**: 0 punti senza pesi.
- Nella posa di prova (`render/foglio-posa.png`) spalle, gomiti, anche e ginocchia si piegano senza strappi né buchi; testa e cuffia restano rigide.
- La posa è volutamente grezza (serve a provare la deformazione, non è un'animazione). Lo scheletro è PROVVISORIO.

## Fase 2 — Render di verifica
Materiali originali, luce neutra, proporzioni non toccate. In `render/`:
`1-fronte.png`, `2-profilo.png`, `3-schiena.png`, `4-tre-quarti.png`, `5-volto.png`, e il confronto `confronto-concept.png`.

### Fedeltà al concept
Uguale o molto vicino: corporatura atletica e muscolosa, proporzioni generali, pelle cartoon, cuffia blu con paraorecchie bianchi forati e
laccetti con fiocco, numero 7 sulla cuffia, costume a slip blu con il 7, stile "videogioco sportivo".

Diverso dal concept (differenze di disegno, non difetti tecnici):
1. **Capelli**: riccioli neri che escono dalla cuffia sulla fronte; nel concept non ci sono.
2. **Occhi**: socchiusi dal sorriso e piccoli; nel concept sono grandi e rotondi.
3. **Espressione**: sorriso largo e fisso a denti scoperti; nel concept il viso neutro è più composto e ci sono 4 espressioni.
4. **Cuffia**: più simile a un casco, di un blu più chiaro; il 7 è su un lato solo.
5. **Costume**: c'è il 7 ma non il disegno dell'onda.
6. **Mento e mascella** più lunghi e marcati che nel concept.

## Fase 3 — Problemi, classificazione e correzioni

### Bloccanti
Nessuno.

### Correggibili — già corretti (senza toccare il disegno)
| Problema | Soluzione applicata |
|---|---|
| 772 pezzi separati dalle cuciture (pesi automatici impossibili, ombreggiatura spezzata) | Punti saldati: guscio unico; coordinate delle immagini conservate |
| Scala e posizione arbitrarie | Altezza 1,80 m, piedi a quota zero, centrato, trasformazioni applicate |
| 30 MB e immagini 4096 (troppo per il telefono) | Immagini ridotte a 2048 / 1024 / 512 e salvate in JPEG |
| 100.000 triangoli per giocatore (14 giocatori = 1,4 milioni) | Quattro livelli di dettaglio (vedi sotto); le forme restano, muscoli non appiattiti |
| Calottina, costume e parti bianche non separabili (tutto un pezzo, una sola immagine) | "Zone" scritte su ogni punto (`_zona`, `_scuro`): permettono di cambiare i colori per giocatore. Provato in Three.js: `render/three-ricolorazione.png` |

### Correggibili — NON ancora fatti
| Problema | Soluzione possibile |
|---|---|
| Il numero 7 è dipinto nell'immagine (e leggermente in rilievo sul costume) | Coprirlo con il colore di fondo e mettere il numero come etichetta separata (piccola superficie con immagine propria) su cuffia e costume |
| Bordo blu sottile ai margini delle zone ricolorate | Allargare di poco la maschera o ridipingere l'immagine del colore nelle zone |
| Luci e ombre dipinte nel colore | Accettabile per lo stile cartoon; si può attenuare schiarendo le ombre nell'immagine |
| Occhi dipinti, bocca senza interno: niente battito di ciglia né espressioni | Servirebbe rimodellare il viso (non è una correzione, è un cambio di modello) |

### Accettabili
- Dita unite (pollice separato): nel gioco le mani si vedono da lontano e spesso sott'acqua; la mano a paletta va bene per nuoto, presa e tiro.
- Triangoli disposti in modo irregolare (non a "anelli" come farebbe un modellatore): a queste densità la deformazione è buona, come mostra la prova.
- Paraorecchie, laccetti e riccioli fusi con la testa: si muovono con la testa, come deve essere.
- Normal map quasi piatta e immagini con isole disordinate: nessun effetto visibile.

## Fase 4 — Decisione e file prodotti
Il modello supera i controlli: è stata preparata la versione ottimizzata per Three.js, **senza scheletro definitivo e senza animazioni**.
L'originale non è stato modificato.

| File | Triangoli | Immagini | Peso | Uso previsto |
|---|---|---|---|---|
| `player_base.blend` | 100.000 | 2048 | 13 MB | Sorgente Blender corretto (non nel repository: inviato ad Ale, si rigenera con `prepara.py`) |
| `player_base_LOD0.glb` | 100.000 | 2048 | 3,9 MB | Primi piani, menu, figurine (non nel repository: inviato ad Ale) |
| `player_base_LOD1.glb` | 30.000 | 1024 | 1,4 MB | Giocatore vicino alla telecamera |
| `player_base_LOD2.glb` | 12.000 | 1024 | 0,7 MB | Giocatori in partita |
| `player_base_LOD3.glb` | 5.000 | 512 | 0,3 MB | Giocatori lontani, vista sott'acqua (il viso si rovina: solo da lontano) |

Confronto visivo dei livelli: `render/foglio-lod.png`.

Verifica in Three.js r187 (la versione del gioco), `strumenti/prova-glb.mjs`: tutti e quattro i file si caricano senza errori né avvisi;
materiale PBR con colore, rilievo e ruvidezza; altezza 1,80, piedi a quota 0; dati per punto `position`, `normal`, `uv`, `_zona`, `_scuro`.

Nota sul peso in partita: il limite che ci siamo dati su iPhone è 150.000 triangoli a schermo. Con 14 giocatori da 12.000 sono 168.000
(solo corpi, senza vista sott'acqua): servirà usare il livello da 12.000 per chi è vicino e quello da 5.000 per gli altri, oppure alzare il limite
dopo una prova su iPhone.

### Dati del modello ottimizzato
- Unità: metri. Altezza 1,80. Origine tra i piedi, a quota zero.
- Orientamento nel `.glb`: Y in alto, il personaggio guarda verso +Z (come gli atleti attuali del gioco).
- Mesh: `Pallanuotista` (un solo oggetto). Materiale: `Material.001` (PBR, tre immagini). Il pallone NON è incluso.
- `_zona` (3 numeri per punto): calottina, costume, parti bianche (paraorecchie, laccetti, numeri). `_scuro` (1 numero): capelli e sopracciglia.

### Come rigenerare
```bash
python -m venv venv && venv/bin/pip install bpy          # Blender come modulo Python
venv/bin/python -I strumenti/blender/analisi.py model.glb analisi.json
venv/bin/python -I strumenti/blender/saldata.py model.glb saldata.json
venv/bin/python -I strumenti/blender/dita.py model.glb dita.json
venv/bin/python -I strumenti/blender/prepara.py model.glb cartella-uscita      # .blend + 4 file .glb
venv/bin/python -I strumenti/blender/render.py -- model.glb cartella-render    # MODO=argilla / MODO=zone per le varianti
venv/bin/python -I strumenti/blender/prova_scheletro.py cartella-uscita/player_base_LOD1.glb prova.blend
venv/bin/python -I strumenti/blender/scheletro.py cartella-uscita/player_base.blend cartella-rig              # scheletro definitivo: .blend + 4 file .glb
node strumenti/posa-glb.mjs cartella-rig/player_rig_LOD1.glb pose.png                                        # pose di prova in Three.js
node strumenti/prova-glb.mjs cartella-uscita/player_base_LOD2.glb prova.png   # controllo in Three.js
```

## Fase 5 — Scheletro definitivo (approvato da Ale il 12 novembre 2026)
Script: `strumenti/blender/scheletro.py`. File: `player_rig_LOD1.glb` (30.000 triangoli), `player_rig_LOD2.glb` (12.000), `player_rig_LOD3.glb` (5.000);
`player_rig.blend` e `player_rig_LOD0.glb` (100.000) inviati ad Ale, non nel repository. Misure delle giunture in `scheletro.json`.

- **24 ossa con gli stessi nomi e la stessa gerarchia degli atleti attuali del gioco**: `pelvis`, `spine_01`, `spine_02`, `spine_03`, `neck_01`, `head`,
  `clavicle_l/r`, `upperarm_l/r`, `lowerarm_l/r`, `hand_l/r`, `thigh_l/r`, `calf_l/r`, `foot_l/r`, `ball_l/r`, più `presa_l/r`.
- **Rotazioni di riposo nulle** (misurato in Three.js: 0°): è quello che si aspetta il codice del gioco, che orienta ogni osso verso la giuntura
  successiva. I movimenti procedurali (nuoto, bicicletta, rotazione del busto, piega della colonna) si applicano quindi senza adattamenti.
- **Pesi**: automatici di Blender calcolati su un'ossatura anatomica, poi rifiniti: testa rigida (cuffia, paraorecchie, riccioli e viso seguono solo
  la testa), lisciati, al massimo 4 ossa per punto, somma 1. Nessun punto senza pesi.
- **Punto di aggancio della palla**: ossa `presa_r` e `presa_l`, figlie delle mani, al centro del palmo. Con la mano in posa di riposo (palmo in
  giù) la palla va centrata un raggio sotto il palmo.
- **Clip dedicate in futuro**: lo scheletro è un normale scheletro umanoide in un `.glb`; tiro, passaggio, parata, blocco ed esultanza si possono
  aggiungere come animazioni registrate sugli stessi nomi di ossa, mescolate ai movimenti calcolati.

### Prova delle pose in Three.js r187, con la tecnica del gioco
`strumenti/posa-glb.mjs` (funzione `punta`, la stessa di `src/grafica/corpo.js`): `render/pose-scheletro.png` e `render/pose-scheletro-solo-geometria.png`.
Pose provate: riposo, galleggiamento a bicicletta, tiro (caricamento e rilascio), stile libero, parata del portiere. Nessun errore né avviso;
spalle, gomiti, anche e ginocchia si piegano senza strappi; testa e cuffia restano rigide.

Limiti noti dello scheletro:
- Le pose di prova sono indicative (le direzioni le ho scritte a mano): non sono le animazioni del gioco.
- L'orientamento del polso e la torsione dell'avambraccio non sono controllati dalla sola direzione dell'osso (vale anche per gli atleti attuali).
- Nessun osso per dita, viso o mascella: le dita sono unite e il viso è fisso.
- A 5.000 triangoli il viso si rovina: quel livello va usato solo da lontano.

## Cosa NON è stato fatto (in attesa dell'ok di Ale)
- Animazioni, espressioni, punto di aggancio della palla.
- Numero e colori per squadra dentro il gioco; pallone giallo e blu.
- Inserimento nel gioco.
