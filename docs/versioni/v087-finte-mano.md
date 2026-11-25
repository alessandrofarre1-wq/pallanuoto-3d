# v0.87 — Finte: palmo in su dietro la testa e in giù davanti, finte nei due sensi, marchio di fabbrica di ogni giocatore

## Richiesta
Ale (24/11/2026), guardando il foglio delle forme della finta della v0.85 (`docs/immagini/v085-finte-forme.png`): «Da queste foto noto
un problema a meno che non stia capendo: se la palla sta dietro la testa il palmo della mano deve essere rivolto verso l'alto (come se il
giocatore tenesse la palla su un vassoio). Se la finta supera la testa e va in avanti l'unico modo per tenere la palla è ruotare il polso
e mettere il palmo della mano rivolto verso il basso con la palla attaccata». E: «il discorso che le finte possono essere da destra verso
sinistra e da sinistra verso destra, oppure in avanti e poi indietro. Con movimenti più veloci o più lenti e con il braccio teso o
piegato valgono non solo per le finte sotto porta ma per tutte le finte. Diciamo che se sei sotto porta probabilmente hai meno tempo
perché il rischio è che ti arrivi addosso l'uomo quindi, di solito sono un po' più veloci che da fuori area. La finta è quasi un marchio
di fabbrica dei giocatori (ognuno ce l'ha diversa)».

Nella v0.55 Ale aveva scritto «i giocatori tengono la palla come un vassoio»: era la palla tenuta sopra la testa, che da allora ha la
mano dietro la palla e il palmo in avanti. La regola di oggi riguarda la palla dietro la testa (carica) e davanti alla testa (finta):
la palla tenuta sopra la testa resta com'era.

## Cosa diceva il codice (misure prima)
Strumento nuovo `npm run finte-mano-foglio` (`strumenti/finte-mano-foglio.mjs`): segue la finta fotogramma per fotogramma, del
computer (quattro forme) e del giocatore che tiene TIRO (posa Plask), e misura dove sta la palla rispetto alla testa e da che parte
guarda il palmo (+1 al cielo, −1 in giù). Sulla v0.86:
- computer: con la palla dietro la testa il palmo era già abbastanza al cielo (in media da 0,48 a 0,77 secondo la forma); nel ritorno
  il palmo si girava in giù (fino a −0,68) anche con la palla sopra o dietro la testa, e il braccio tornava alla palla tenuta: a fine
  finta la palla stava davanti al viso, all'altezza della bocca, con la mano sopra (foto «ritorno» in `docs/immagini/v087-finte-mano.png`
  confrontate con la v0.86 nel paragrafo Misure);
- nella finta stretta a braccio dritto il palmo restava in avanti con la palla davanti al palmo, sopra la testa: è la foto «dritta ·
  stretta · braccio dritto» che Ale ha guardato;
- giocatore che tiene TIRO: in carica il palmo era a circa 33° sopra l'orizzonte (0,54); nella finta ampia la mano arrivava solo sopra
  la testa (1 cm davanti) e la palla restava davanti al palmo;
- verso: tutte le finte di lato andavano da destra verso sinistra (v0.85, 65 su 100), mai dall'altra parte; larghezza e braccio a caso a
  ogni finta, con la sola tendenza dello stile;
- lo stile della finta veniva da id, nome e numero di calottina: dalla v0.86 il numero cambia da una lista all'altra, e con lui poteva
  cambiare la finta di un giocatore.

## Cosa cambia
1. **Mano nella finta** (solo disegno; `src/grafica/mano-finta.js`, `MANO_FINTA`, `palmoFinta`): il palmo segue la mano rispetto alla
   testa, nel verso della finta. Dietro la testa (16 cm o più) palmo al cielo, «a vassoio», con il polso piegato all'indietro; sopra la
   testa palmo in avanti, dietro la palla (come la palla tenuta della v0.55); davanti alla testa (12 cm o più) polso girato e palmo in
   giù, con la palla attaccata sotto la mano. In mezzo il polso gira con continuità. La palla disegnata sta sempre sul lato del palmo.
2. **La finta va avanti e torna indietro** (solo disegno, `grafica/pose.js`): il braccio del computer rifà la strada al contrario fino
   alla carica e lì resta finché non parte il gesto dopo (`p.fintaPronto`, i tempi del gioco della v0.85). Prima tornava alla palla
   tenuta, con il palmo in giù e la palla davanti al viso. Il braccio di lato si sposta nella preparazione di ogni finta e torna al
   centro nel ritorno (prima dalla seconda finta partiva già girato, di colpo).
3. **Tenuta del giocatore** (solo disegno, `grafica/tiro-plask-vista.js`): nella tenuta di TIRO e nella carica del tiro il palmo della
   posa registrata si corregge (0,8) verso la stessa regola; ruota solo l'osso della mano, le dita lo seguono. La finta ampia porta il
   braccio fino al gesto intero del disegno (prima 0,8 per tutte), così la mano passa davanti alla testa e il palmo si gira in giù; la
   stretta resta com'era.
4. **Palla tenuta**: il palmo segue la mano disegnata anche quando torna sopra la testa dalla carica; ferma sopra la testa la mano è
   quella della v0.55.
5. **Marchio di fabbrica** (`FINTA_FIRMA` in `src/taratura.js`, `firmaFinta` e `versoFinta` in `src/finte.js`): oltre allo stile
   della v0.55, ogni giocatore ha la sua finta, sempre la stessa, ricavata dal suo id senza il caso del gioco:
   - un verso preferito: di lato da destra verso sinistra, attraverso il corpo (50 giocatori su 100; per un mancino al contrario), avanti
     e indietro (30), di lato da sinistra verso destra, verso l'esterno (20). Ogni finta va nel suo verso 70 volte su 100, le altre
     negli altri due: nel complesso circa 45 finte su 100 da destra verso sinistra, 23 da sinistra verso destra, 32 avanti e indietro;
   - una larghezza sua (stretta e veloce o ampia e lenta): quella dello stile ± 0,25; a ogni finta cambia poco (± 0,1, prima ± 0,25);
     sotto porta più stretta, cioè più veloce, come nella v0.85 (Ale: «di solito sono un po' più veloci che da fuori area»);
   - il braccio teso o piegato suo (85 finte su 100).
   Vale per tutte le finte, del computer e del giocatore (con la levetta inclinata il palo lo sceglie il giocatore). Stile e marchio
   dipendono solo dall'id, non più dal numero di calottina.
6. **Scheda del giocatore** (schermata Squadre, `menu.js`): «Finta di bomba · da destra a sinistra · braccio teso» (per un mancino il
   gesto attraverso il corpo va da sinistra a destra).

## Misure
### Mano (strumento `npm run finte-mano-foglio`; palmo +1 al cielo, −1 in giù)
Foglio `docs/immagini/v087-finte-mano.png` (sette finte di lato in sei momenti); prima e dopo in
`docs/immagini/v087-finte-mano-prima-dopo.png`.

| | v0.86 | v0.87 |
|---|---|---|
| computer, palla dietro la testa: palmo in media | 0,56-0,82 | 0,94-1,00 |
| computer, mano davanti alla testa (finta ampia a braccio dritto) | −0,72 | −0,67 |
| computer, fine della finta | palla davanti al viso, palmo in giù (−0,67) | palla 64 cm dietro la testa, palmo al cielo (1,00) |
| tenuta di TIRO, palla dietro la testa: palmo in media | 0,48-0,54 | 0,93-0,95 |
| tenuta di TIRO, finta ampia: la mano passa davanti alla testa di | 6 cm, palmo mai in giù | 11 cm, palmo in giù (−0,85) |
| palla attaccata: centro della palla dal palmo | 10,4-11 cm | 10,4-11 cm |

Le sole modifiche del disegno non cambiano la partita: `aspetto --confronta` tra la v0.86 e la build con mano, ritorno e tenuta nuovi
(prima del marchio di fabbrica) dà «partita simulata identica».

### Finte del computer (`npm run sonda-finte`, 2 partite ITA–HUN; v0.85: 4 partite)
| | v0.85 | v0.87 |
|---|---|---|
| finte per squadra a partita | 37,0 | 35,8 |
| dall'inizio della finta al gesto dopo (metà dei casi) | 1,05 s | 1,03 s |
| tra 5 e 7 m: ritorno del braccio interrotto | 4% | 6% |
| da destra verso sinistra / da sinistra verso destra / avanti e indietro | 65 / 0 / 35 (la regola) | 49 / 19 / 32 |
| nel verso più frequente del giocatore (chi ne fa almeno 6) | – | 73% (10 giocatori) |

### Gioco contro realtà (16 partite ITA–HUN, per squadra a partita)
| voce | v0.86 | v0.87 | reale |
|---|---|---|---|
| tiri | 39,1 | 40,1 | 33 |
| gol | 19,4 | 19,4 | 13,3 |
| gol dell'Italia / dell'Ungheria | 13,4 / 25,5 | 13,3 / 25,5 | |
| tiri in gol | 49,8% | 48,4% | 40% |
| espulsioni | 11,5 | 10,8 (a posto) | 11 |
| espulsioni dalla lotta al centro | 55,0% | 57,1% | 66% |
| superiorità trasformate | 45,8% | 47,0% (a posto) | 52% |
| rigori | 1,6 | 2,2 (a posto) | 1,8 |
| azioni a partita | 74,3 | 73,8 | 50 |
| parità: durata dell'azione | 12,9 s | 13,1 s | 21 s |
| parità: espulsione procurata | 18,3% | 16,8% | 22% |
| palla in mano prima del passaggio | 1,01 s | 1,01 s | 0,6-1 s |
| voci a posto | 6 su 15 | 5 su 15 | |

L'equilibrio non cambia: gol identici, le altre voci dentro le oscillazioni di 16 partite. L'espulsione procurata in parità (18,3% →
16,8%) esce dalla fascia per poco ed è la voce a posto in meno.

## Prove
- **Nuova `npm run finte-mano`** (`tests/finte-v087.mjs`, anche nella CI), tredici controlli: palla dietro la testa = palmo al cielo e
  mano davanti alla testa = palmo in giù, nella finta del computer e nella tenuta di TIRO; palla sempre attaccata al palmo; la finta del
  computer torna alla carica e lì resta nell'attesa; marchio di fabbrica uguale anche con un altro numero di calottina; versi preferiti e
  versi delle finte nelle proporzioni volute; finte diverse tra i giocatori; scheda con verso e braccio.
- **`npm run finta`** (v0.55): la tenuta di TIRO si guarda 4 s invece di 3 (con la larghezza del giocatore un ciclo dura da 0,9 a
  1,22 s); il controllo del lato diventa «di lato nei due sensi o avanti e indietro, più spesso nel verso del giocatore»; nella scena
  dell'anticipo battuto al centroboa niente lotta al centro dopo l'arrivo della palla (con un'altra sequenza del caso un'espulsione dalla
  lotta, regolare, era contata come sanzione per l'anticipo in 1 scena su 20).
- **`npm run finte`** (v0.85): il controllo del lato diventa «il verso del giocatore 70 volte su 100, gli altri due le altre volte».
- **`npm run traiettorie`** (v0.71 di Codex): il contesto ridotto ha anche `firmaFinta` e `versoFinta`.
- **`npm run desktop`** (v0.44 di Codex): Spazio tenuto 2,5 s invece di 2 s prima di contare due finte (vedi Verifiche).

## Verifiche
- **`npm run lint`**: PASS.
- **`npm run prove`**: 68 PASS e 1 FAIL su 69 passi in 15,8 minuti. Il passo fallito è `desktop` (v0.44 di Codex): «Spazio tenuto 2 s =
  almeno due finte»; con la larghezza del giocatore un ciclo di finta dura da 0,9 a 1,22 s e la seconda finta può arrivare a 2,12 s
  dalla pressione (0,9 s di carica più un ciclo). La prova ora tiene Spazio 2,5 s, come la prova touch `finta` tiene TIRO 4 s: poi PASS.
  Nella stessa build PASS anche `finte-mano` (13 controlli), `finta`, `finte`, `finta-fluida`, `traiettorie`, `tiro-registrato` e gli
  altri passi.
- **`npm run verifica -- --partite=0`**: «3-azione» diversa dal riferimento (16,77%) per la sola situazione di gioco: stesso momento
  (2:43, 6 contro 5, Alesiani espulso), giocatori e braccia spostati di poco perché cambiano le finte del computer; disegno, acqua e
  tabellone a posto. Controllata, riferimento aggiornato con `npm run verifica:aggiorna -- --partite=0` (le altre quattro, identiche o
  entro la tolleranza, lasciate com'erano); confronto ripetuto: «Verifica superata», cinque immagini identiche o entro la tolleranza.
- **`npm run aspetto -- --no-build --solo-foto`**: «Tutto a posto»; viste iPhone 56 oggetti disegnati e 131.872 triangoli, al massimo
  145.546 triangoli nelle sei viste.
- **Partita identica con le sole modifiche del disegno**: `aspetto --solo-gioco` tra la v0.86 e la build intermedia (mano, ritorno,
  tenuta): «partita simulata identica».

## Decisioni superate
- Palmo nella finta: in avanti e un po' in su durante la carica, in giù nel ritorno → segue la mano rispetto alla testa (al cielo dietro,
  in avanti sopra, in giù davanti con la palla attaccata).
- Ritorno della finta del computer alla palla tenuta → ritorno alla carica, dove il braccio resta fino al gesto dopo.
- Posa Plask della tenuta con il suo palmo (v0.74) → palmo corretto di 0,8 verso la regola della mano; finta ampia della tenuta fino
  al gesto intero del disegno (prima 0,8 per tutte, v0.76).
- Finte di lato sempre da destra verso sinistra, 65 volte su 100 (v0.85) → verso preferito di ogni giocatore, nei due sensi o avanti e
  indietro.
- Larghezza e braccio a caso a ogni finta con la tendenza dello stile (v0.85) → del giocatore, con poca variazione.
- Stile della finta da id, nome e numero (v0.55) → solo dall'id.

## Non fatto
- Il rilascio del tiro resta quello di prima (palmo verso la porta nell'accompagnamento, v0.55): la regola vale per la palla tenuta, la
  carica e la finta.
- Nella finta a braccio piegato con la carica molto arretrata (stile larga) la mano resta dietro la testa: il palmo resta al cielo per
  tutta la finta.
- Nessun dato reale sulla frequenza dei versi: i pesi vengono dalle indicazioni di Ale.
- Il giudizio sul movimento spetta ad Ale, giocando o guardando il foglio nuovo.
