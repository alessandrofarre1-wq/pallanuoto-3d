# Proposte dai manuali e dagli studi indicati da Ale (15/11/2026)

Solo proposte: **nessuna modifica al gioco** finché Ale non sceglie. Le regole del gioco restano quelle di World Aquatics del 18 febbraio 2026. I documenti sono in gran parte precedenti: dove usano regole superate lo segnalo.

## Cosa ho letto davvero

| Documento | Stato | Nota |
|---|---|---|
| USA Water Polo Coaching Manual (aggiornamento 2021, più recente del 2018) | letto: difesa, attacco, 6 contro 5, controfuga, portiere | il manuale 2018 è stato sostituito da questo |
| Nitzkowski, «Learning and Teaching the Basics» | letto: nuoto, gambe, presa della palla, palleggio e cambi di direzione, passaggio, tiro, portiere | il libretto scaricabile **non contiene** il capitolo sulla difesa: stairstepping, sloughing, foul and drop, gapping e time switching sono solo nominati |
| Swiss Aquatics, programma tecnico pallanuoto 2022 (italiano) | letto | è un elenco ordinato di tecniche e tattiche per età, senza le descrizioni; le schede con le descrizioni stanno su mobilesport.ch (sito non ancora consentito) |
| Manuale arbitri FINA 2019-2021 (luglio 2020) | letto: falli, espulsioni, rigori, centroboa | usa 30/20 secondi: oggi 28/18 |
| Lupo et al. 2012, J Sports Sci (centroboa, Euro League e serie italiane) | letto per intero (versione dell'Università di Torino) | |
| Lupo, Condello, Tessitore 2012, JSSM (Mondiali 2009, margini di vittoria) | letto per intero | partite con 30 s di possesso |
| Melchiorri et al. 2020 (minuti in acqua, Mondiali 2015 e 2017) | letto per intero | |
| Pereira et al. (velocità con e senza palla) | letto per intero | |
| Sanders (bicicletta, articolo di congresso con gli stessi dati del 1999) | letto per intero | l'articolo del 1999 sulla rivista è a pagamento |
| Fernandes et al. 2012 (tre stili di crawl) | solo il riassunto ufficiale | testo completo a pagamento |
| Canossa et al. 2009; Napolitano et al. 2013 | solo i riassunti | Redalyc e la rivista rispondono «vietato» ai download automatici: non ho forzato |
| Lupo et al. 2007 | solo il riassunto del congresso | |
| Dispense FIN | non pubbliche | |

## I numeri che contano per il gioco

**Come finisce un'azione in parità** (Mondiali 2009, squadre vincenti/perdenti):
- gol 6-19%; tiri parati o fuori circa 32%; espulsioni procurate circa 22%;
- palle perse circa 20%; falli in attacco circa 15%; rigori circa 2%.
- In pratica **solo 4 azioni in parità su 10 finiscono con un tiro**.

**Durata media delle azioni:** parità circa 21 s, controfuga circa 14 s, superiorità circa 15 s.

**Tipi di azione:**
- parità circa 70%;
- superiorità 16-22%;
- controfuga 9-13% per chi vince, 3-5% per chi perde;
- transizione 4-6%.

**Euro League, per squadra e per partita** (Lupo 2012):
- circa 50 possessi: 37 in parità, 2 in controfuga, 11 in superiorità;
- 8 gol, di cui 3 in parità, 1 in controfuga e 4 in superiorità;
- in parità circa 15 tiri;
- in parità 10 espulsioni o rigori procurati, **8 dal centroboa**.

**Chi chiude le azioni in parità:** il centroboa circa la metà (Mondiali 2009); in Euro League 17 azioni contro 24 dei giocatori di perimetro.

**Difese più usate in parità (Mondiali 2009):**
- pressing 40-60%;
- zona «1-2», cioè arretrare sul centro, 16-43%;
- zona «2-3-4» 14-25%;
- zona M 6-9%.

**Difesa con l'uomo in meno:** «a grappolo» 80-93%, «in anticipo» 7-20%.

**Attacco con l'uomo in più:** 4-2 circa 90%, 3-3 circa 10%.

**Tipi di tiro in parità:**
- tiro in nuotata/dopo l'entrata circa 40-55%;
- tiro libero dai 6 m circa 15%;
- dopo 1 finta circa 16%; dopo 2 finte circa 9%; dopo più di 2 finte circa 4%;
- rovesciata circa 5%; tiro dall'acqua circa 5%.

**Minuti in acqua (Mondiali 2015 e 2017):**
- in media 17,4 min su 32, da 2,3 a 31,6;
- centroboa e loro marcatori 16,3 min; gli altri 18,3.

**Nuoto:**
- velocità media su 15 m al massimo: 1,52 m/s senza palla, 1,48 m/s con la palla (giocatori di livello nazionale);
- con la palla la bracciata è più corta e **più frequente**;
- a testa alta il busto è più inclinato e i piedi più profondi.

**Bicicletta:** la sommità della testa resta tra 0,22 e 0,42 m sopra l'acqua. I più bravi muovono i piedi in cerchi ampi e rotondi, con molto movimento avanti-indietro. Il portiere tiene le ginocchia più alte.

**Il gioco oggi (v0.44, 8 partite ITA–HUN, per squadra):**
- circa 48 tiri, contro i 33 dei Mondiali 2025;
- quasi ogni azione finisce con un tiro;
- con la palla si nuota il 15% più lenti e le braccia girano più piano;
- lo sprint arriva a circa 2,6 m/s.

## Proposte (in ordine di utilità)

### 1. Contare come finisce ogni azione, poi tarare
Il problema aperto più vecchio è «troppi tiri».
- **Passo A:** aggiungere a `npm run bilancio` il conteggio per azione: gol, tiro sbagliato, palla persa, fallo in attacco, espulsione, rigore, tempo scaduto. Lo stesso per parità, controfuga e superiorità, con la durata media. Solo misura, il gioco non cambia.
- **Passo B:** tarare l'intelligenza del computer verso gli esiti reali:
  - il centroboa come «cacciatore di espulsioni»;
  - più palle perse e più falli in attacco;
  - meno tiri forzati quando non c'è un vantaggio.

Obiettivo: circa 50 possessi e 30-35 tiri per squadra.

### 2. Un arbitro più credibile (manuale FINA, adattato alle regole 2026)
Regole da aggiungere o rendere più chiare:
- **Vantaggio:** niente fischio se il fallo semplice toglierebbe il vantaggio a chi attacca.
- **Espulsione** quando il fallo distrugge la possibilità di tirare o di andare verso la porta:
  - trattenere, affondare o tirare indietro chi **non ha la palla**;
  - nuotare sulle gambe o sulle spalle di un avversario;
  - fallo tattico dopo il cambio di possesso.
- **Chi palleggia non «tiene» la palla:** un fallo su di lui in controfuga è espulsione.
- **Centroboa:**
  - fischio un attimo in ritardo per dargli la possibilità di tirare;
  - una spinta all'indietro oltre la linea delle spalle è fallo in attacco;
  - fallo semplice se non c'è minaccia o ci sono 2 o più difensori attorno.
- **Rigore** solo se l'attaccante è girato verso la porta o nuota verso la porta. Mai di schiena, tranne con il portiere fuori dalla porta.
- **Schizzo in faccia:** rigore dentro i 6 m su gol probabile, altrimenti espulsione.
- **Interferenza:** chi ha fatto fallo deve allontanarsi di circa 1 m prima di alzare il braccio; altrimenti è espulsione.
- **Espulsioni simultanee:** 18 s a tutti e due, il cronometro dell'azione non si azzera.
- **Simulazione:** fallo semplice; ripetuta, cartellino giallo alla squadra (nuovo nel gioco).

### 3. Le difese che si usano davvero
Oggi ci sono A uomo / Zona / Pressing / Zona a M. Proposta: **Pressing, Zona 1-2 (arretrare sul centro), Zona 2-3-4, Zona M**, con questi comportamenti:
- la difesa sceglie se pressare o andare a zona con la regola del manuale USA: «è più pericolosa l'occasione dietro di me (il centro) o quella davanti (il tiratore)?»;
- «pistoning» nella zona: chi ha l'uomo con la palla esce verso di lui, il compagno resta nella zona; poi si scambiano;
- cambio di marcatura su entrata e blocco («time switching»);
- con l'uomo in meno, scelta tra «a grappolo» e «in anticipo».

«Foul and drop» (fallo e arretrare) oggi è rischioso: un fallo fuori dai 6 m lascia il tiro diretto. Lo terrei solo dentro i 6 m.

### 4. Controfuga organizzata (manuale USA)
- Tre corsie (destra, centro, sinistra) e due linee (i primi tre, poi gli altri). Tre zone della vasca: si crea il vantaggio, lo si legge, lo si attacca. Il vantaggio si decide a metà vasca, non sotto porta.
- **Tre regole:**
  - palla pressata → i compagni si spostano verso la palla;
  - palla libera → si impegna il difensore e ci si allarga;
  - la difesa non si impegna → si accelera.
- La prima linea occupa i due lati sui 2 m e il centro; la seconda attacca il 2 contro 1 sui 5 m.
- **1 contro 0:** verso il palo del braccio forte, palla in mano dentro i 5 m, scivolamento laterale e finta al portiere.
- Senza vantaggio numerico ci si schiera subito in attacco prima che la difesa sia pronta.
- I mancini difendono a sinistra per ripartire sul loro lato buono.

Dovrebbe dare controfughe migliori ma più rare. Oggi il 11% dei tiri viene dalla controfuga; ai Mondiali 2025 il 3%.

### 5. Attacco in parità e uomo in più: nuove giocate
Parità:
- blocchi (3 per 2, 1 per 2, 2 per 1);
- entrata a triangolo, entrata incrociata, isolamento 2 contro 1;
- «due attacchi sulla palla»: uno dal lato della palla, uno dal lato opposto.

Uomo in più:
- **«il quick»**: attaccare nei primi secondi, prima che la difesa si organizzi;
- pali sempre in movimento;
- finte che servono a qualcosa (attirare un difensore, aprire una linea);
- rotazioni del manuale USA come nuovi schemi della libreria: «6 dentro, 5 largo, 4 centro, 1 in tasca», «3-3: 1 dentro, 2 giù».

Tiri:
- aggiungere la **rovesciata del centroboa**, che manca e vale circa il 5% dei tiri;
- finte brevi e non ritmate, come chiede Nitzkowski: il computer non dovrebbe fare sempre «finta, finta, tiro».

### 6. Nuoto e gesti più veri (da fare dopo l'unione del lavoro di Codex sul nuoto)
- **Con la palla:** bracciata più corta e **più frequente** (oggi è più lenta); perdita di velocità ridotta dal 15% a circa il 3-5%.
- **Velocità massima:** lo sprint a 2,6 m/s è molto sopra il 1,5 m/s misurato su 15 m. Proposta da misurare prima: sprint verso circa 2,0 m/s. È un cambio di sensazione forte, quindi decide Ale dopo una prova.
- **Bicicletta:**
  - testa fra 0,22 e 0,42 m sopra l'acqua, più alta per chi ha più Forza e Resistenza e più bassa da stanchi;
  - piedi in cerchi più ampi;
  - portiere con le ginocchia più alte.
- **Gesti nuovi o migliorati:**
  - giro sul dorso in controfuga per guardare il portiere che rilancia;
  - smarcamento a 90° (square out) e a uncino (hook);
  - partenza esplosiva di lato (forbice);
  - arresto con testa su e mani che spingono avanti;
  - presa della palla da sotto (palmo in su, pollice fuori, poi rotazione) e da sopra solo per la rovesciata del centroboa;
  - passaggio con la spalla opposta avanti e rotazione dei fianchi;
  - «lunge block» contro chi passa sul dorso.

### 7. Cambi e minuti in acqua
- Nella schermata Panchina: **minuti giocati** di ognuno.
- Il computer fa ruotare di più centroboa e marcatori del centro (circa 16 min contro 18), con una media vicina a 17 su 32.

### 8. Rispetto dello schema (Napolitano)
Gli schemi eseguiti bene rendono di più. Proposta:
- quanto un giocatore rispetta lo schema chiamato dipende da Visione e Disciplina;
- a fine azione si vede un breve «schema riuscito / saltato».

## Cosa NON vale più nei documenti
- 35 s (Nitzkowski) e 30/20 s (FINA 2019, Mondiali 2009): oggi 28/18.
- Rigore dai 4 m (Nitzkowski): oggi dai 5 m.
- Superiorità di 20 s: oggi 18 s.
- Impeding come fallo semplice: è espulsione da anni, e il manuale lo dice.
- Le dimensioni del campo (30 m per gli uomini) non cambiano il gioco: il gioco usa 25 m.

## Fonti ancora da aprire, se Ale vuole
Per ognuna serve l'ok ad aggiungere il sito alla rete dell'ambiente:
- le schede Swiss Aquatics su mobilesport.ch, sito `assets01.sdd1.ch`, con le descrizioni di:
  - «prendere fallo», «rientro in difesa», «nuotata laterale»;
  - «cambio da 1 a 5 su difesa sul centro», «entrata e pick and roll»;
  - «scivolamento con finta».
- Le parti sulla difesa di Nitzkowski su Water Polo Planet: oggi il sito non risponde.
