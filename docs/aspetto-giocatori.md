# Aspetto dei giocatori dal database — audit e piano (13 novembre 2026)

Stato: **PIANO IN ATTESA DELL'OK DI ALE**. Nessuna modifica al codice finché non viene approvato.
Richiesta di Ale: varianti estetiche dello stesso pallanuotista (modello originale, niente personaggi nuovi), associate in modo
stabile ai giocatori del database, distinguendo i dati documentati da quelli generati per il disegno.

## 1. Cosa c'è oggi (audit)

### Dati
| Fonte | Cosa contiene | Chiave |
|---|---|---|
| `dati-sorgente/database-giocatori.json` (database di Ale, usato dal gioco dalla v0.34) | 386 giocatori, convocazioni, statistiche; **altezza** per 196 dei 208 giocatori in gioco; **peso: nessuno** | `player_id` (es. `p_00f62a22a816410f`): stabile, non dipende da numero o squadra. Nessun giocatore ha due nazionali |
| `src/dati/rose-db.json` (generato da `npm run rose-db`) | i 13 per nazionale usati in partita | **oggi non porta il `player_id`**: si perde nello strumento |
| File di Ale `waterpolo7_database_239_con_usa_foto.json` (zip del 13/11) | 239 schede «sovrapposte» alla vecchia `rose-reali.json`: altezza 122, peso 98, mano 96, **capelli e barba 60** (foto ufficiali ITA, ROU, CRO, USA, con fonte e confidenza), **occhi 0, carnagione 0** | `nazionale + nome` (nessun `player_id`) |

- Delle 208 schede in gioco solo **128** si ritrovano per nome nel file a 239 (le convocazioni sono diverse); i nomi da controllare sono già segnalati nel file (es. «Ben Liecht» / «Ben Liechty»).
- Il file a 239 contiene già un `aspettoRendering` generato, ma il suo seme usa `hash(nazionale + nome + versione)`: **cambiando nazionale cambierebbe l'aspetto** (contro il requisito 7). Quei valori generati non vanno usati; si usano solo i campi documentati.

### Modello e disegno
- In partita il gioco usa **un solo file**, `src/grafica/modelli/pallanuotista.glb` (circa 8.200 triangoli, una sola immagine 1024, 24 ossa), ricavato dallo scheletro definitivo. I tre `player_rig_LOD1/2/3.glb` di `modelli-sorgente/pallanuotista/` hanno **lo stesso scheletro e gli stessi dati per punto** (`_ZONA`, `_SCURO`), ma il gioco oggi non passa da uno all'altro. Tutto ciò che è proposto qui sotto lavora sui dati per punto e sulle ossa, quindi vale identico per il file del gioco e per i tre livelli.
- Un materiale clonato per giocatore (già oggi: nessun oggetto disegnato in più) con il colore modificato nel disegno (`corpo.js`, `attaccaFumetto`): squadra su cuffia e costume, **5 toni di pelle** (`TONI`).
- **Il tono di pelle di oggi NON è stabile**: il seme è `num + squadra*7` (`modello.js`), cioè dipende dal numero di calottina e da quale lato gioca la squadra. Con il cambio volante (`vesti`) il corpo in campo resta lo stesso, quindi chi entra prende il tono di chi esce.

### Cosa si può cambiare davvero (verificato sul file, non presunto)
| Caratteristica | Nel modello | Si può cambiare? | Come |
|---|---|---|---|
| Altezza | scheletro a 24 ossa, modello alto 1,80 m | Sì | scala del corpo (solo disegno) |
| Corporatura, spalle, busto, gambe | un solo guscio con muscoli in rilievo | Sì, con misura | gonfiare o sgonfiare la superficie lungo la sua direzione (solo nel disegno, esclusi testa, cuffia, mani e piedi) più una piccola scala delle clavicole e delle ossa lunghe |
| Colore dei capelli | **riccioli in rilievo fusi con la testa**, marcati da `_scuro` insieme alle sopracciglia (526 punti su 7.437) | Sì | colore nel disegno. Capelli e sopracciglia si separano per altezza: sopracciglia intorno a 1,60–1,62 m, riccioli sopra 1,63 m (misurato) |
| Taglio dei capelli | stessi riccioli, sotto la cuffia si vede solo la frangia | **Solo in parte** | si possono «accorciare» spingendo i riccioli dentro la cuffia (corti o rasati); NON si possono fare capelli lunghi o lisci senza modellarli |
| Barba | **non esiste** nel modello (niente geometria, niente colore) | Sì, disegnata | ombra sul mento e sulle guance calcolata nel disegno dalla posizione sul viso: «leggera», «corta», «piena» |
| Colore degli occhi | **dipinti** nell'immagine, non sono bulbi separati, piccoli e socchiusi | Tecnicamente sì, ma **invisibile in partita** (1–2 punti di schermo) | maschera dell'iride ricavata una volta dall'immagine; visibile solo nei primi piani |
| Pelle | colore dell'immagine moltiplicato per un tono | Sì (c'è già) | gamma di toni più fine e stabile |

## 2. Proposta: integrazione più semplice, senza duplicare i dati

1. **Identità**: `npm run rose-db` scrive anche `id` (= `player_id`) in ogni scheda di `rose-db.json`. È l'unica chiave dell'aspetto.
2. **Un solo file di dati documentati**: il file di Ale va in `dati-sorgente/aspetto-giocatori.json` così com'è (fonte). Lo strumento lo collega al `player_id` per nome normalizzato + nazionale + data di nascita, stampa i giocatori non trovati o dubbi, e mette in `rose-db.json` **solo i valori documentati** con la loro fonte (niente valori generati salvati nei file).
3. **Profilo calcolato nel gioco**: nuovo `src/aspetto.js` con `profiloVisivo(scheda)` → `PlayerAppearance` (vedi sotto). I valori mancanti si generano al momento dal seme `hash(player_id + "aspetto" + VERSIONE_ASPETTO)`: stesso giocatore = stesso aspetto in ogni partita, sessione e squadra; nessuna dipendenza da ordine di caricamento, numero di calottina o lato della vasca. Usa un generatore suo (come quello delle rose), **mai `rnd`**: la partita non può cambiare.
4. **Disegno**: `corpo.js` riceve il profilo e imposta solo valori del materiale e scale; lo stesso programma di disegno per tutti (nessuna variante che faccia ricompilare). Il cambio volante (`vesti`) applica il profilo di chi entra.
5. **Correzioni di Ale** (come `mancini.json`): un piccolo file per correggere a mano un attributo di un giocatore (es. pelle, capelli) marcato come `verified`.

```
PlayerAppearance {
  playerId, modelBaseId: 'pallanuotista-v1', appearanceVersion: 1,
  heightScale,            // 0,95–1,05
  bodyBuild,              // 'snello' | 'atletico' | 'robusto'
  skinTone, eyeColor, hairColor, hairStyle, beardStyle,
  sourceMetadata: { heightScale: { tipo:'verified', fonte:'roster wc2026', valore:198 }, bodyBuild: { tipo:'derived', da:['altezza','peso'] }, skinTone: { tipo:'generated' }, ... }
}
```

- `verified`: numero da una scheda ufficiale (altezza, peso) o osservazione da foto ufficiale con la sua confidenza (capelli, barba).
- `derived`: calcolato da dati verificati, solo per il disegno (corporatura dall'indice peso/altezza; scala dall'altezza).
- `generated`: scelto dal seme. Mai scritto nei file dei dati, mai mostrato come informazione sul giocatore.
- **Nessun effetto sul gioco**: l'aspetto non entra mai in statistiche, valutazioni o fisica (oggi Forza e Velocità non dipendono dall'altezza, e resta così).

### Regole di scelta
- **Altezza**: scala = 1 + (altezza − 192 cm) × 0,6 / 192, limitata a ±5% (un 2,05 m sembra più alto di un 1,85 m senza rompere pose e immersione). Se manca: generata attorno a 192 cm con poca varianza, uguale per tutte le nazionali (usare la media della squadra vorrebbe dire attribuire un tratto alla nazionalità).
- **Corporatura**: con peso e altezza → indice peso/altezza (pallanuotisti 25–30): sotto 25,5 snello, 25,5–28,5 atletico, sopra robusto. Senza peso: generata (25% snello, 50% atletico, 25% robusto).
- **Capelli e barba**: dal file (60 giocatori); per gli altri generati da una tavolozza neutra. Il taglio documentato si riduce a ciò che il modello sa fare: «corto» → riccioli accorciati, «medio mosso/liscio» → riccioli originali.
- **Occhi e pelle**: nessun dato documentato. Il file di Ale avverte di non dedurli da nazionalità o nome: quindi o si generano dal seme o si lascia un tono neutro (decisione di Ale, sotto).
- **Niente doppioni evidenti nella squadra**: dopo la generazione, nei 13 di ogni squadra (in ordine di `player_id`, non di caricamento) se due hanno la stessa combinazione pelle + capelli + barba + corporatura, al secondo si riestraggono SOLO i tratti generati con il seme successivo. I tratti documentati non si toccano mai.

## 3. Le 8 varianti di esempio
Stesso viso, stessa cuffia, stesso stile; cambiano solo i tratti della tabella.

| # | Nome | Altezza | Corporatura | Pelle | Capelli | Barba |
|---|---|---|---|---|---|---|
| 1 | Originale | 1,00 | atletico | chiara calda | ricci neri | nessuna |
| 2 | Il lungo | 1,05 | snello | chiara | corti castano chiaro | nessuna |
| 3 | Il centroboa | 1,03 | robusto | olivastra | corti castano scuro | corta |
| 4 | Il biondo | 0,98 | atletico | chiara rosata | corti biondi | nessuna |
| 5 | Il veterano | 1,01 | robusto | chiara | rasati grigio scuro | piena |
| 6 | Il ricciolo | 0,97 | snello | ambrata | ricci castani | leggera |
| 7 | Lo scuro | 1,02 | atletico | scura | ricci neri | corta |
| 8 | Il rosso | 0,99 | atletico | molto chiara | corti ramati | leggera |

Combinando i valori (3 corporature × 6–8 colori di capelli × 3 tagli × 4 barbe × 6–8 toni × altezze) le combinazioni diverse sono migliaia: in una squadra da 13 i doppioni si evitano sempre.

## 4. Costi su iPhone
| Voce | Costo |
|---|---|
| Oggetti disegnati | **0 in più** (il materiale è già uno per giocatore) |
| Triangoli | **0 in più** (stessa geometria) |
| Immagini | 0 in più; +1 piccola maschera (128 px, condivisa) solo se si fanno gli occhi |
| Programmi di disegno | 1, uguale per tutti (solo valori che cambiano, nessuna ricompilazione) |
| Calcolo | circa 15–25 operazioni in più per punto del corpo (gonfiaggio, accorciamento dei riccioli) e circa 10 per pixel della pelle (barba, colore dei capelli): stimato sotto il 3% del tempo di disegno, da confermare col contatore FPS di Ale |
| Memoria | trascurabile (un profilo da pochi numeri per giocatore) |
| Scaricamento | file dei dati circa +20 kB |

## 5. Rischi e come si controllano
- **Immersione e contatto con la palla**: con la scala dell'altezza le braccia arrivano un po' più lontano; la palla disegnata segue già la mano vera (`ballVistaW`) e la palla del gioco (`ballW`) non cambia. Controllo: `npm run aspetto -- --confronta=` (partita identica), conteggio delle gambe fuori dall'acqua, primi piani con la palla in mano per gli estremi (1,05 robusto e 0,95 snello).
- **Compenetrazioni**: gonfiaggio massimo circa 1,5 cm, escluse le zone di contatto (mani, testa, cuffia); controllo con i primi piani di lotta al centro e muro.
- **Capelli accorciati**: si spingono dentro la cuffia; da controllare che non spuntino buchi sulla fronte (screenshot del viso per ogni taglio).
- **Partite identiche**: tutto è solo disegno; la verifica deve dare le stesse 6 partite di oggi.

## 6. Decisioni che servono da Ale prima di partire
1. **Foto dei giocatori veri**: nella memoria del progetto c'è la regola «niente foto dei giocatori reali e niente somiglianza». Usare colore dei capelli e barba osservati dalle foto ufficiali cambia questa regola (il viso resta lo stesso per tutti, quindi non c'è somiglianza vera). Va bene?
2. **Pelle senza dati**: (a) tono generato dal seme, vario ma senza legame con la persona vera; oppure (b) tono neutro uguale per chi non ha il dato, finché non lo indichi tu nel file delle correzioni. Consiglio (a) con il file delle correzioni.
3. **Occhi**: invisibili in partita. Consiglio di salvare il dato e rimandare il disegno a quando ci saranno primi piani (menu, figurine).
4. **Ampiezza delle differenze**: altezza ±5% e corporatura ±1,5 cm vanno bene come partenza?

## 7. Passi dopo l'approvazione
1. v0.36: identità (`player_id` in `rose-db.json`), collegamento del file di Ale, `src/aspetto.js` con profilo e metadati, pelle stabile (corregge anche il tono che oggi dipende dal numero), altezza, corporatura, colore dei capelli, barba; cambio volante con l'aspetto di chi entra; prova automatica (stesso giocatore = stesso profilo in partite diverse e con l'altra squadra; nessun doppione evidente nella squadra; nessun valore generato nei file dei dati); foglio con le 8 varianti affiancate.
2. v0.37 (se approvato): tagli dei capelli (accorciamento dei riccioli) e, se richiesti, occhi per i primi piani.
