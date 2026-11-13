# Corpi e acqua — eventi, gocce, bicicletta, portiere

Rapporto completo (fonti, stato, proposta, criteri): https://claude.ai/artifact/1k9M3FJbkdVyGzd7ihFWLz. Approvato da Ale il 13/11/2026 («manda avanti tutto»).

## Fatto (13 novembre 2026)
- **Caso separato** (`rndGrafica` in `costanti.js`): tutta la grafica usa un generatore suo; gli effetti non cambiano più le partite.
- **Eventi corpo-acqua** (`src/grafica/acqua-eventi.js`): `evento(tipo, x, y, z, intensità, dx, dz, radente)`. Tipi: `bracciata` (mano che rientra in acqua, `pose.js`), `appoggio` (braccio libero nel tiro), `elevazione` e `ricaduta` (velocità del petto sopra 0,9 m/s in su o in giù), `lotta` (ogni 0,35 s durante la lotta al centro), `parata` (palla vicina al portiere che si è allungato, nel punto della mano), `palla` (impatto o schizzo, da `fisica.js` → `render.js`). La bicicletta non fa gocce (è sott'acqua).
- **Regole di visibilità** (`LIMITI`): entro 0,6 m dalla palla gli effetti scendono fino al 30%; con 5 o più giocatori entro 3 m dalla palla gli effetti secondari si dimezzano (palla e parata no); al massimo 96 gocce attive e 24 per evento; gocce da 3,5 a 8 cm, opacità 0,5, vita 0,8 s.
- **Gocce in rilievo**: un solo oggetto disegnato (InstancedMesh, pool fisso, nessuna allocazione per fotogramma), dischi rivolti alla telecamera con volo balistico; quando ricadono, una volta su tre lasciano una piccola increspatura (catena spruzzo → schiuma, Chentanez e Müller 2010).
- **Scie a distanza percorsa** (ogni 0,28 m, non più ogni 0,09 s); tolta l'increspatura «davanti» a tempo (resta l'onda di prua del contatto) e le 4 macchie casuali dopo il tiro (ora c'è la ricaduta).
- **Contatto da fermi più calmo**: le increspature che si allargano attorno al corpo compaiono solo quando ci si muove o ci si alza; da fermi resta il bordo.
- **Bicicletta** (`corpo.js`): spinta in fuori più rapida del rientro (fase deformata), anca più flessa e aperta quando serve più spinta (Oliveira 2015), piede quasi orizzontale che si inclina nella spinta in fuori (Kawai 2026).
- **Portiere** (`pose.js`): mani fino a 1,5 m (Zinner 2015: 1,56 ± 0,09 m); parata alta a due braccia per palle sopra 1 m anche un po' laterali.
- `npm run acqua-effetti` (`tests/acqua-effetti.mjs`): 10 scene di una partita vera (fermo, nuoto lento, sprint, cambio di direzione, elevazione, ricaduta, parata, contrasto, tiro a schizzo, azione affollata) con la telecamera di gioco; misura quanto della palla e della testa del giocatore resta visibile confrontando lo stesso fotogramma con e senza effetti (soglie 90% e 80%), gocce attive, oggetti e triangoli. Risultato: palla 100% in tutte, testa ≥ 95%, al massimo 70 gocce, 135 mila triangoli; 89–90 oggetti disegnati, ma 99 nelle prime 4 scene (primi secondi della partita, sprint iniziale): la causa non è stata ancora cercata.
- Partita simulata identica prima e dopo (`npm run aspetto -- --confronta=`), gambe mai sopra l'acqua.

## Da fare
- Nuoto: andature più distinte (lenta, veloce, sprint) oltre al ritmo; stati del portiere più ricchi (recupero dedicato).
- Prova facoltativa: piccola griglia d'onde attorno all'azione (equazione delle onde 2D), solo se gli anelli non bastano.
- Taratura di opacità, dimensioni e durate sugli screenshot di Ale da iPhone.
