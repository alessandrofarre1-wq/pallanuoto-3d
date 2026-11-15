# v0.46: il gioco tarato sui manuali e sugli studi

Richiesta di Ale (15/11/2026): «porta avanti tutto ma escludi il nuoto», che farà Codex. Le proposte sono in `docs/proposte/manuali-e-studi.md`. Regole di riferimento: World Aquatics 18 febbraio 2026; i documenti più vecchi sono stati adattati, per esempio 28/18 s al posto di 30/20 s.

## 1. Come finisce ogni azione (misura)
`src/statistiche.js` conta ogni possesso e il suo esito. Si apre e si chiude con:
- `apriAzione` e `chiudiAzione`, chiamate da `giveBall`, `registraTiro`, `exclude`, `penalty`, `sfondamento`, `areaFoul` e `offFoul`, e dallo scadere del tempo in `partita.js`;
- `aggiornaAzione`, a ogni fotogramma;
- alla sirena l'azione in corso viene annullata (`annullaAzione`).

Gli esiti possibili:
- gol;
- tiro sbagliato;
- palla persa;
- fallo in attacco;
- espulsione procurata;
- rigore;
- tempo scaduto.

I tipi di azione:
- **superiorità:** l'avversario ha un espulso quando l'azione inizia;
- **controfuga:** nei primi 11 s c'è un vero vantaggio numerico entro 9 m dalla porta (`vantaggioNumerico`);
- **parità:** tutto il resto.

`npm run bilancio` stampa esiti, durate, numero di azioni e quanto tempo è usata ogni difesa, accanto ai numeri di riferimento:
- Mondiali 2009 (Lupo, Condello, Tessitore 2012);
- Euro League (Lupo et al. 2012).

## 2. Arbitro (manuale arbitri FINA 2019-21)
- **Lotta al centro senza palla** (`lottaSenzaPalla` in `lotta.js`, valori in `CENTRO_SENZA_PALLA`):
  - il centroboa procura espulsioni anche prima di ricevere: chi lo trattiene quando ha preso posizione viene espulso;
  - chi lo affonda mentre il passaggio sta arrivando viene espulso con maggiore probabilità;
  - sono possibili anche un fallo semplice e il contro-fallo del centroboa.
- **Espulsioni simultanee** (`simultanea`): circa 1,5% delle espulsioni al centro. Sono 18 s a tutti e due, il tempo dell'azione non si azzera, la palla resta a chi la aveva.
- **Simulazione** (`simulazione`):
  - la prima volta è fallo contro chi simula;
  - la seconda volta cartellino giallo alla squadra;
  - dopo il giallo, chi simula viene espulso.
- **Fallo su chi palleggia:** chi palleggia non «tiene» la palla (WP 22.8). Chi lo ferma con un fallo viene espulso (`ARBITRI.palleggio`); in controfuga l'origine registrata è «fuga».
- **Regola del vantaggio** (`foul`): in controfuga, con al massimo un difensore davanti, il fallo semplice non ferma il gioco.
- **Rigore:** solo se l'attaccante è rivolto alla porta o nuota verso la porta. Di schiena si dà solo con il portiere fuori dalla porta.
- **Interferenza** (`controllaInterferenza`): chi ha fatto fallo e resta entro 1 m da chi batte il tiro libero viene espulso. I difensori del computer si tengono a 1,35 m.
- **Blocco irregolare:** chi blocca trattenendo il difensore commette fallo in attacco (`falloSenzaPalla`).

## 3. Difese
- **Zona-pressing** (Botonis 2015; manuale USA): nel pressing chi è lontano dalla palla si abbassa sul centroboa se il centroboa è libero, e torna sul suo uomo quando la palla si avvicina.
- **Cambio di marcatura sulle entrate** (`cambioMarcatura`, `uomoDi`): chi è stato battuto da un'entrata scambia l'uomo con il compagno che sta davanti. Mai con il marcatore del centroboa.
- **Uomo in meno:** «a grappolo» come prima, oppure «in anticipo». Il computer sceglie l'anticipo una volta su sei (Mondiali 2009: grappolo 80-93%).
- **Scelta della difesa del computer:** passa più spesso a zona nella seconda parte dell'azione; la zona a M solo contro un centroboa forte, e non sempre.

## 4. Controfuga organizzata (manuale USA)
`contropiede`, `contropiedeTarget` e `contropiedePortatore` in `ia.js`:
- **Tre corsie e due linee:** la prima linea sale sui due lati e al centro, la seconda sui 5 m.
- **Tre regole del vantaggio** per chi porta palla:
  - palla pressata → i compagni si spostano verso la palla;
  - palla libera → ci si allarga;
  - difesa che non si impegna → si accelera.
- **1 contro 0:** verso il palo del braccio forte, poi finta al portiere e scivolamento verso l'altro palo.
- **Non sbilanciarsi:** al tiro, il punto e i mezzi cominciano a rientrare.
- **Stile per nazionale** (`STILE_VELOCE`, Canossa e Lupo 2022): Italia, Serbia e Australia lanciano sempre la controfuga organizzata; Spagna, Croazia e Ungheria una volta su due; le altre nazionali 4 volte su 5.

## 5. Attacco
- **Blocco sull'entrata:** il compagno più vicino al difensore di chi entra va a bloccarlo.
- **Il «quick»:** nei primi 3 s della superiorità, chi è davvero libero vicino alla porta tira subito. Poi si fa girare palla, perché nelle partite vere la superiorità dura circa 15 s.
- **Finte:** una o due, con tempi diversi (Nitzkowski; Mondiali 2009: dopo 1 finta il 16% dei tiri, dopo 2 finte il 9%).
- **Due schemi nuovi dell'uomo in più** dal manuale USA: «Rotazione con la tasca» e «3-3 con l'entrata dell'ala». La libreria passa a 9 schemi.
- **Rovesciata del centroboa** (gesto nuovo in `pose.js`): un tiro su quattro quando il centroboa è di spalle.
- **Rispetto dello schema** (Napolitano 2013): chi ha meno Visione e Disciplina parte fino a 1,6 s in ritardo verso il posto della nuova fase. Alla fine della superiorità il giocatore vede «schema eseguito» oppure «fasi saltate».

## 6. Tiro e portiere (Berlino 2018)
- Il computer tira basso, con rimbalzo davanti alla porta, una volta su cinque in parità.
- Oltre l'80% della forza la mira peggiora un poco: fino a +35% di errore al massimo.
- Il portiere para meno se al momento del tiro era fuori posto o si stava spostando dalla parte opposta.

## 7. Cambi
- **Minuti in acqua** per ogni giocatore, mostrati nella schermata Panchina.
- Il computer cambia prima il centroboa e il suo marcatore (soglia di stamina più alta di 0,1).

## Misure (8 partite ITA–HUN, 4×8 min, per squadra a partita)
Prima = v0.44 misurata con il contatore nuovo (gioco identico alla v0.44). Dopo = v0.46 (lavoro sui manuali, prima dell'unione con la v0.45 di Codex).

| Voce | Prima | Dopo | Riferimento vero |
|---|---|---|---|
| Gol | 16,0 | 16,8 | 13,3 (Mondiali 2025) |
| Tiri | 48,6 | 45,9 | 33 (Mondiali 2025) |
| Tiri in gol | 32,9% | 36,6% | 40% |
| Espulsioni | 5,4 | 12,3 | 11 |
| Superiorità trasformate | 47,7% | 44,9% | 52% |
| Azioni | 64,9 | 69,8 | circa 50 (Euro League) |
| Controfughe con vantaggio numerico | 24 (vecchia regola, contava anche le transizioni) | 2,1 | circa 2 (Euro League); 9-13% delle azioni per chi vince (Mondiali 2009) |
| Durata della superiorità | 2,9 s | 6,9 s | circa 15 s (Mondiali 2009) |
| Difese in parità (tempo) | pressing 88%, zona 1%, zona M 12% | pressing 68%, zona 26%, zona M 5% | pressing 40-60%, zone 30-65%, zona M 6-9% |

Come finisce un'azione in parità:

| Esito | Prima | Dopo | Mondiali 2009 |
|---|---|---|---|
| Gol | 20% | 19% | 6-19% |
| Tiro sbagliato | 48% | 39% | circa 32% |
| Palla persa | 15% | 8% | circa 20% |
| Fallo in attacco | 1% | 10% | circa 15% |
| Espulsione procurata | 10% | 21% | circa 22% |
| Rigore | 4% | 1% | circa 2% |

**Ancora lontani dai riferimenti:**
- troppi tiri e troppe azioni: le azioni in parità durano 14,7 s contro circa 20;
- poche palle perse;
- superiorità ancora corte.

`npm run verifica`: sei partite arrivate alla fine, 62 gol su 248 tiri (25%).

## Prove
- `npm run v046` (`tests/v046.mjs`, anche in CI): esiti delle azioni, palleggio, vantaggio, interferenza, simultanee, simulazione, cambio di marcatura, controfuga, 9 schemi, rovesciata, minuti.
- `npm run uomo`: invariata, tutte le prove superate.

## Non fatto
- Nuoto e bicicletta: li fa Codex; li riprendo dopo.
- Difesa «in anticipo» e stile per nazionale scelti dal giocatore: oggi li sceglie solo il computer.
- Il tiro con rimbalzo e la rovesciata non hanno un comando dedicato per il giocatore.
- Le schede svizzere con le descrizioni (mobilesport) non sono ancora state lette.
