# v0.67 — Il computer scatta troppo e si stanca

Ale, sui cinque punti di gioco, punto 5: «Il computer scatta troppo e si stanca».

Prima di cambiare gli ho chiesto come procedere, perché il cambio tocca la ripartenza, una sua richiesta della v0.54. La sua
scelta (20/11/2026): **«Partono tutti, scatta chi serve»**.
- Dopo ogni recupero tutti partono subito, come nella v0.54.
- Scatta solo chi può arrivare in vantaggio.
- In rientro scatta solo chi deve coprire un avversario in vantaggio.

## La sonda nuova: `strumenti/sonda-scatti.mjs`
Gioca partite computer contro computer (ITA–HUN, tempi da 8 minuti) e divide il tempo dei giocatori di movimento per situazione:
- con la palla;
- ripartenza dopo un recupero;
- transizione in attacco, con la palla a oltre 10 m dalla porta avversaria;
- attacco schierato ed entrata;
- rientro in difesa, con la palla a oltre 10 m dalla propria porta;
- difesa schierata;
- uomo in più o in meno.

Per ogni situazione dice quanto si scatta e quanto si sta in contatto con un avversario. In più conta il tempo sotto la soglia dei
cambi (stamina 0,34) e i cambi fatti dal computer.

Uso: `node strumenti/sonda-scatti.mjs --partite=3 --paralleli=3`.

## Cosa diceva la sonda (v0.66, 3 partite)
- **Scatti**: i giocatori di movimento scattavano per il **27% del tempo**. Due scatti su tre venivano dalle transizioni:
  - rientro in difesa: 36% di tutti gli scatti, in scatto il 63% del tempo;
  - ripartenza: 31%, in scatto il 65% del tempo.
- **Stanchezza**: sotto la soglia dei cambi per il **37% del tempo**; 69 cambi a partita, sommando le due squadre.
- **Contatto**: 15% del tempo.

## Le cause trovate nel codice
1. **Scatto automatico da lontano** (`partita.js`): chi aveva il suo posto a più di 4 m scattava comunque, finché la stamina non
   scendeva a 0,35 (la soglia dei cambi è 0,34). Il posto poteva anche dire di non scattare. Per questo il primo tentativo, che
   cambiava solo le regole dei posti, non spostava quasi nulla (giro s1).
2. **Ripartenza e rientro**:
   - nella controfuga organizzata le corsie erano sempre in scatto;
   - in transizione tutti scattavano verso il loro posto;
   - in rientro scattava chiunque fosse più di 0,8 m lontano dal suo posto, anche dall'altra metà campo.
3. **Pressing**: chi difende a pressing perdeva 0,012 di stamina al secondo, oltre a scatti e contatti (numero scritto nel codice).

## Cosa cambia
1. **In ripartenza partono tutti subito, ma scatta solo chi può guadagnare un vantaggio**: chi non è dietro al difensore più
   vicino, rispetto alla porta avversaria, o non ha nessun difensore entro 3 m (`SCATTI.ripartenza` 0, `SCATTI.spazio` 3). Gli
   altri nuotano senza scatto. Vale per le corsie della controfuga, per le aperture del portiere e per la transizione verso i posti
   d'attacco.
2. **In rientro scatta solo chi deve coprire**: chi ha il suo uomo più vicino alla propria porta di lui, o che gli è scappato
   (`SCATTI.rientro` 0). Chi va incontro al portatore per rallentarlo continua a scattare.
3. **Niente scatto automatico da lontano nelle transizioni**: il posto dice «nuota» e la regola dei 4 m di `partita.js` non vale.
   Fuori dalle transizioni resta com'era.
4. **«Incrocio dei lati»**: i due mezzi scattano solo finché non sono al loro posto (prima scattavano sempre).
5. **Meno fatica del pressing**: `PRESSING_CONSUMO` 0,012 → 0,008 al secondo, spostato nel pannello `src/taratura.js`.

## Le prove (sonda su 3 partite, taratura su 16)
| giro | cosa | in scatto | sotto la soglia | controfughe | superiorità |
|---|---|---|---|---|---|
| v0.66 | — | 27% | 37% | 3,5 | 46,2% |
| s1 | regole dei posti (1 m, 3 m, 1 m) | 26% | 34% | — | — |
| s2 | regole più strette (−0,5 m, 4 m, 0) | 26% | 37% | — | — |
| s3 | s2 + niente scatto automatico da lontano | 17% | 25% | 0,9 | 45,1% |
| s4 | s3 + pressing 0,008 | 18% | 8% | 0,6 | 42,8% |
| **s5** | **s4 con la ripartenza a 0 m e 3 m** | **20%** | **14%** | **1,5** | **40,3%** |
| s6 | s5 + occasioni con l'uomo in più dai 6 s | — | — | 1,3 | 41,6% |

Scelta: **s5**.
- La controfuga torna verso le 2 a partita delle partite vere: con s3 e s4 la ripartenza era troppo prudente.
- Il giro s6 non migliorava la superiorità oltre il caso: tenuti i 7 s della v0.65.

## Scatti per situazione (sonda, 3 partite)
| situazione | v0.66: in scatto | v0.67: in scatto |
|---|---|---|
| rientro in difesa | 63% | 39% |
| ripartenza | 65% | 23% |
| difesa schierata | 10% | 10% |
| attacco schierato | 6% | 9% |
| **tutti** | **27%** | **20%** |

Cambi a partita (le due squadre): 69 → 58. Tempo in contatto: 15%, come prima.

## Gioco contro realtà (16 partite ITA–HUN, per squadra a partita)
| voce | v0.66 | v0.67 | reale |
|---|---|---|---|
| tiri | 36,3 | 33,5 | 33 |
| gol | 13,8 | 13,7 | 13,3 |
| tiri in gol | 38,1% | 40,9% | 40% |
| espulsioni | 10,8 | 11,4 | 11 |
| espulsioni dalla lotta al centro | 74,0% | 62,2% | 66% |
| **superiorità trasformate** | **46,2%** | **40,3%** | **52%** |
| rigori | 1,8 | 2,0 | 1,8 |
| azioni a partita | 66,3 | 66,3 | 50 |
| parità: durata dell'azione | 15,1 s | 14,7 s | 21 s |
| parità: tiro sbagliato | 30,3% | 25,8% | 32% |
| parità: palla persa | 15,0% | 19,4% | 20% |
| parità: fallo in attacco | 15,0% | 12,8% | 15% |
| parità: espulsione procurata | 19,8% | 20,8% | 22% |
| palla in mano prima del passaggio | 1,01 s | 0,97 s | 0,6-1 s |
| controfughe a partita | 3,5 | 1,5 | circa 2 |
| falli fischiati (normali e in attacco) | 28,0 | 35,3 | — |
| palle rubate | 2,7 | 3,9 | — |
| intercetti | 6,7 | 8,1 | — |

**A posto 11 voci su 15** (v0.66: 12). Migliorano tiri, tiri in gol, palle perse e palla in mano. Peggiorano:
- **superiorità**: con i difensori meno stanchi l'uomo in meno difende meglio. Il 46% della v0.65 si reggeva anche su difese con
  l'uomo in meno sfinite;
- **tiro sbagliato in parità**: 25,8%.

Le azioni non si allungano: 14,7 s invece dei 21 reali.

**Più falli.** Con i difensori meno stanchi il computer contrasta di più: i falli fischiati salgono da 28 a 35 per squadra a
partita.
- Circa +3 vengono dal togliere lo scatto automatico (giro s3: 31,3), circa +5 dal pressing meno faticoso (giro s4: 36,6).
- Crescono anche palle rubate (2,7 → 3,9) e intercetti (6,7 → 8,1): per questo la palla persa in parità sale verso il 20% reale.
- Per i falli non ho trovato un riferimento reale affidabile. Nella v0.28 il gioco era tarato su circa 30 per squadra a partita.

## Verifiche
- **`npm run lint`**: PASS.
- **`npm run prove`**: primo giro 34 PASS e 2 FAIL; dopo aver corretto due scene di prova, secondo giro: **36 PASS, 0 FAIL**
  su 36 passi in 10,8 minuti.
  - **`inferiorita`** («palla a 3»: braccio di chi esce sul tiratore e posto del centrale sbagliati, dal giro s4). Nella scena un
    difensore toccava palla: per la regola 9.3c l'espulso rientra subito dal pozzetto e i difensori diventavano sei. Non è un
    errore del gioco: ora la scena tiene fuori l'espulso fino alla fine. Ho controllato anche il cambio dal pozzetto: chi entra
    resta espulso, come deve.
  - **`sezione2`** («il computer insiste fino al fallo di rado»: 18 scene con un fallo su 30, limite 15). La prova contava tutti
    i falli fischiati durante la scena: anche quelli degli altri difensori (per esempio nella lotta al centro), i falli in attacco
    e il fallo tattico della controfuga quando la palla cambiava squadra. Con sei semi diversi: v0.66 da 5 a 14 scene su 30
    (media 10), v0.67 da 6 a 17 (media 11). Il limite dipendeva dal caso.
  - Ora la prova conta solo i falli del difensore che contrasta chi ha palla, con l'azione già avviata: 1 scena su 30. Con sei
    semi: v0.66 da 2 a 5 (media 4), v0.67 da 1 a 13 (media 6,5). Il computer sbaglia di più, come in partita (vedi «Più falli»),
    ma resta sotto il limite.
- **`npm run verifica`**: sei partite arrivate alla fine, 53 gol su 176 tiri (v0.66: 57 su 181).
  - Le foto «azione» e iPhone erano diverse dai riferimenti (44%, 43%, 44% dei punti) perché la partita va diversamente: stesso
    istante, giocatori in altri posti.
  - Le ho guardate: grafica e interfaccia normali. Nelle foto iPhone gli ungheresi in ripartenza nuotano raccolti, senza scattare
    tutti.
  - Riferimenti aggiornati con `--partite=0` (anche il menu, per la scritta «v0.67»); verifica ripetuta: superata, cinque
    immagini uguali ai riferimenti.
- **`npm run aspetto`**: «Tutto a posto», 0 gambe fuori dall'acqua; viste iPhone 56 oggetti e 141.794 triangoli. Al primo giro
  era andato in tempo scaduto all'apertura della pagina, con la macchina occupata da altre prove; ripetuto da solo: passato.
- **Build provata**: identica byte per byte a quella misurata nelle 16 partite (giro s5); cambia solo la scritta della versione.

## Non fatto
- **Superiorità al 40%** (reale 52%): da ritarare ora che i difensori non sono più sfiniti.
- **Azioni corte**: le transizioni più lente non bastano. L'azione finisce presto per altre ragioni: palle perse, espulsioni,
  fallo in attacco.
- **Contatto**: costa 0,02 di stamina al secondo, più dello scatto. Non l'ho toccato.
- **Falli**: 35 per squadra a partita invece di circa 30. Prima di ritoccare il contrasto del computer serve un riferimento reale
  (o il giudizio di Ale giocando).
