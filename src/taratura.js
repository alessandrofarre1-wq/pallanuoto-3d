// ================= TARATURA: I NUMERI DEL BILANCIAMENTO IN UN POSTO SOLO (v0.62) =================
// Qui stanno i numeri che decidono QUANTO succede in partita (quanto si tira, quante espulsioni, quante palle perse, quanto dura
// un'azione), ognuno con il motivo e la versione in cui è cambiato; in fondo (REALE) le misure delle partite vere a cui puntiamo.
// I moduli del gioco li importano da qui e li riesportano con lo stesso nome (ia.js, fisica.js, lotta.js, regole.js, tiri.js,
// partita.js, finte.js, panchina.js): cambiare un valore qui fa esattamente quello che faceva prima nel modulo d'origine.
// Come si lavora: (1) misurare con `npm run taratura` (8 partite ITA–HUN: gioco contro realtà, con i numeri da guardare per ogni
// voce); (2) cambiare un numero alla volta, scrivendo accanto com'era e perché; (3) misurare di nuovo con
// `npm run taratura -- --confronta=prima.json` (tra due giri da 8 partite c'è qualche punto di variazione); (4) segnare il
// cambio in docs/decisioni-superate.md.
// Restano nei loro moduli i numeri di posizione e di geometria (posti, corsie, distanze: TRE_TRE, INFERIORITA, CONTRO in ia.js),
// quelli dei gesti (grafica/pose.js, finte.js) e quelli della palla (fisica-palla/parametri.js, con le fonti).
// Questo file non importa niente, così si legge anche da Node (strumenti/taratura.mjs).

// ---------- ATTACCO DEL COMPUTER (ia.js) ----------
// CIRCOLAZIONE: secondi di palla in mano sul perimetro prima di passare, [minimo, variazione casuale], per ritmo della squadra
// («rapidi», «equilibrati», «vicini») e in superiorità. Reale 0,6-1 s (finale olimpica Parigi 2024, video di Ale).
// v0.61: prima 0,55+0,5 / 0,8+0,4 / 1,1+0,7 / 1,3+0,9. v0.64: rapidi 0,4+0,25 → 0,32+0,18, equilibrati 0,55+0,4 → 0,4+0,3,
// vicini 0,7+0,45 → 0,55+0,35 (palla in mano prima del passaggio 1,07 → 1,01 s).
export const CIRCOLAZIONE={ superiorita:[0.4,0.35], rapidi:[0.32,0.18], equilibrati:[0.4,0.3], vicini:[0.55,0.35] };
// COSTRUZIONE (v0.56): nelle partite vere un'azione in parità dura circa 21 s (Mondiali 2009) e se ne giocano circa 50 a partita
// (Euro League). Nei primi COSTRUZIONE.secondi di un'azione in parità non si tira al volo e il tiro «da libero» si cerca meno
// (COSTRUZIONE.libero) oltre COSTRUZIONE.vicino metri dalla porta; restano il tiro senza difensori davanti e quello vicinissimo.
// v0.59: 7 → 11 s; v0.60: 11 → 15 s (circa 5,5 s di transizione + 9,5 s di attacco schierato); v0.64: 15 → 18 s, e vale anche
// nella ripartenza alla pari (prima la ripartenza la toglieva per 12 s: tiri «da libero» a 11 s di media).
export const COSTRUZIONE={ secondi:18, libero:0.3, vicino:4.5 };
// TIRO SUBITO DOPO LA RICEZIONE (v0.59): si decide una volta per ricezione; in parità si tira subito in TIRO_LIBERATO.parita casi,
// altrimenti si continua a far girare palla; in superiorità TIRO_LIBERATO.superiorita; quick = quota delle superiorità in cui si
// cerca il tiro nei primi 3 s. v0.60: parità 0,4 → 0,3, superiorità 0,85 → 1.
export const TIRO_LIBERATO={ parita:0.3, superiorita:1, quick:0.3 };
// OCCASIONE CHIARA (v0.81, Ale: «le occasioni chiare, passaggio con l'uomo davanti alla porta, si tirano indipendentemente dai
// secondi trascorsi»): chi riceve un passaggio entro «distanza» m dalla porta, con apertura almeno «angolo» (distanza dalla linea di
// porta divisa per la distanza dalla porta: 1 = di fronte), nessun avversario entro «spazio» m e la traiettoria libera («corridoio»),
// tira subito, entro «entro» s dalla ricezione: anche nei primi 18 s (COSTRUZIONE) e in superiorità. Prima tirava subito solo una
// volta su tre (TIRO_LIBERATO.parita) e, nei primi 18 s, solo entro 4,5 m.
export const OCCASIONE_CHIARA={ distanza:5, angolo:0.7, spazio:2, corridoio:0.7, entro:0.6 };
// TIRI SPECIALI IN CONTROFUGA (v0.31, prima scritti in controfuga.js): tasto a comparsa per il giocatore e scelta del computer.
// durata e pausa del tasto (s); sotto «vicino» m colonnello, sopra schizzo; tra «min» e «max» m dalla porta; il computer arriva fino a
// «maxComputer». v0.81 (Ale: «troppi tiri a schizzo e colonnello»): solo nella controfuga vera, entro «eta» s dal recupero della
// palla. Prima bastava nuotare verso la porta senza nessuno davanti, anche a metà dell'attacco schierato.
export const QTE={ durata:1.4, pausa:2.5, vicino:5.5, min:2.5, max:8, maxComputer:6.5, eta:9 };
// v0.88 (Ale: «se è in controfuga può scegliere anche lo schizzo (se non è troppo stanco e se ha qualità nel gioco) o il colonnello (se è
// meno stanco e qualità nel gioco)»): niente più tasto a comparsa per schizzo e colonnello. Dentro l'area (PALOMBELLA.area), nella
// controfuga vera, il tocco di TIRO li sceglie da solo: colonnello con energia almeno «colonnello», schizzo con energia almeno «schizzo»,
// se la Precisione è almeno «qualita»; altrimenti il polso. Tenuto resta il tiro normale (v0.81). Il computer, con la stessa occasione,
// sceglie lo speciale «computer» volte su uno quando tira (come la v0.81 nel tiro subito dopo la ricezione), altrimenti il tiro classico.
// Prima: colonnello sotto QTE.vicino m, schizzo sopra, fino a QTE.max m, per tutti.
export const SPECIALI=Object.freeze({ colonnello:0.6, schizzo:0.35, qualita:70, computer:0.35 });
// PALOMBELLA (v0.88, Ale: «puoi anche togliere il tasto della palomba»). Il portiere è «fuori dai pali» oltre «portiereFuori» m dalla
// sua linea di porta (di norma sta a 0,7 m) o oltre «fuoriLato» m di lato dal centro della porta, oppure se non c'è. Dentro «area» m
// dalla porta la palombella è un tipo di tiro: TIRO la sceglie da solo quando il portiere è fuori dai pali. Fuori area compare il tasto
// PALOMBELLA se il portiere è fuori dai pali e il tiratore è in buona posizione: entro «max» m, non oltre «angolo» rad dal centro della
// porta, nessun avversario entro «libero» m; dura «durata» s, poi «pausa» s prima di ricomparire. Il computer la tira con la stessa
// occasione, ogni secondo con probabilità «computer». Non è detto che sia gol: precisione, distanza e rientro del portiere decidono.
// La palombella è un gesto di misura (tiri.js doShoot): errore di lato × «errore», in lunghezza × «errore» con il fattore «erroreAlto» al
// posto di 0,35 del tiro teso; la Precisione del tiratore lo riduce come per gli altri tiri.
export const PALOMBELLA=Object.freeze({ area:6, max:10, angolo:0.6, libero:1.6, durata:1.2, pausa:2, portiereFuori:1.3, fuoriLato:2.2, computer:1.4,
  errore:1.5, erroreAlto:1.2 });
// USCITA DEL PORTIERE (v0.88): quando chi porta palla è libero verso la porta (nessun difensore di movimento alla sua altezza o più
// avanti, fino a «dietro» m indietro, entro «corridoio» m dalla linea palla-porta: controfuga, entrata, difensore battuto che insegue)
// ed è entro «da» m dalla porta, il portiere esce dai pali verso la palla per chiudere l'angolo: base + extra × Uscita (statistica del
// portiere da 40 a 99, prima mai usata) metri dalla linea di porta, mai più vicino di «distanza» m a chi porta palla. Prima restava
// sempre a 0,7 m dalla linea.
export const USCITA_PORTIERE=Object.freeze({ da:9, base:1.0, extra:1.4, distanza:1.6, corridoio:2, dietro:0.5 });
// PAZIENZA in parità: secondi di possesso (su 28) prima di cominciare a cercare il tiro anche senza occasioni, e secondi per
// arrivare alla piena voglia di tirare. v0.64: [24, 3] → [25, 2,5].
export const PAZIENZA=[25,2.5];
// FINE_AZIONE (v0.64, prima scritti in ia.js): negli ultimi «secondi» del possesso si tira con probabilità «voglia» a ogni decisione,
// negli ultimi «ultimi» secondi con probabilità «ultima» (qualunque sia l'occasione). v0.64: secondi 6 → 4,5.
export const FINE_AZIONE={ secondi:4.5, voglia:0.35, ultimi:2.5, ultima:0.9 };
// SUPERIORITÀ del computer (v0.58): pronta = secondi prima di cercare il tiro; dopoCambio = per quanti secondi dopo un passaggio
// che ha cambiato lato si tira subito (da cambioDa secondi in poi); libero = da quando si tira se davvero liberi; attesa/rampa = la
// voglia di tirare cresce da «attesa» ad «attesa + rampa» secondi. Reale: 52% di superiorità trasformate (Mondiali 2025).
// v0.58: pronta 5 → 7 s, voglia da 5-9 a 9-13 s; v0.59: pronta 9 s, voglia da 8 a 12 s.
// v0.65 (`strumenti/sonda-superiorita.mjs`): i tiri dei primi 10 s andavano in gol il 60-65% delle volte, quelli dopo i 10 s il
// 30% (difesa e portiere ormai piazzati) → pronta 9 → 7 s; le ali sui 2 metri facevano quasi metà dei tiri con il 27% di gol (i
// tiri frontali il 57%) → sotto «stretto» di apertura (distanza dalla linea di porta divisa per la distanza dalla porta: 1 = di
// fronte, 0,35 = ala sui 2 metri) non si tira al volo e la voglia si moltiplica per «strettoVoglia»: la palla va a chi vede più porta.
export const SUPERIORITA={ pronta:7, dopoCambio:1.6, cambioDa:3, libero:8, attesa:8, rampa:4, stretto:0.5, strettoVoglia:0.25 };
// RIPARTENZA con la palla a un giocatore di movimento (v0.58): d3 = dove va il 3 (metri dalla porta avversaria); arrivato = sotto
// questa distanza dal posto non si scatta più; transizione = finché la palla è oltre questi metri dalla porta avversaria i
// compagni vanno dritti ai loro posti d'attacco scattando (fuori dalla controfuga organizzata).
export const RIPARTENZA={ d3:7.0, arrivato:2.5, transizione:10 };
// SCATTI (v0.67, punto 5 di Ale: «il computer scatta troppo e si stanca»; `strumenti/sonda-scatti.mjs`): dopo ogni cambio di
// possesso partono tutti subito (richiesta della v0.54), ma scatta solo chi serve (scelta di Ale, 20/11/2026). Prima i giocatori
// di movimento scattavano per il 27% del tempo, due scatti su tre nelle transizioni (ripartenza e rientro), e passavano il 37% del
// tempo sotto la soglia dei cambi: in partita.js chi aveva il posto a più di 4 m scattava comunque fino a stamina 0,35.
// ripartenza = in ripartenza scatta chi non è più di questi metri dietro al difensore più vicino (rispetto alla porta avversaria) o
// non ha nessun difensore entro «spazio» metri; gli altri nuotano senza scatto. rientro = in rientro scatta chi ha il suo uomo più
// vicino alla propria porta di lui (o meno di questi metri dietro), o che gli è scappato.
// Prove su 16 partite: −0,5 / 4 m: controfughe da 3,5 a 0,9 a partita (reale circa 2); 0 / 3 m: 1,5 a partita.
export const SCATTI={ ripartenza:0, spazio:3, rientro:0 };
// CENTRO_ATTESA (v0.64): in parità la palla entra al centroboa dopo la costruzione: il vantaggio di passarla al centro cresce da
// «da» ad «a» secondi d'azione (prima c'era subito, e l'azione finiva presto con espulsione, girata o fallo). v0.81 (Ale: «pochi
// passaggi al centroboa»): da 7-15 a 3-9 s; «ingresso» = vantaggio in più per l'ingresso classico, con il marcatore dietro o al
// fianco (palla in acqua davanti al centroboa, poi lotta): prima la palla gli arrivava quasi solo da libero o con il marcatore
// davanti, e lui si girava e tirava.
export const CENTRO_ATTESA={ da:3, a:9, ingresso:1.2 };
// CENTROBOA CON LA PALLA (v0.81, Ale: «poche beduine e pochi passaggi al centroboa»). Studio su 11 partite d'élite maschili (7 di
// campionato italiano, 4 di Champions League; «Elite water polo: a technical and tactical analysis of the centre forward role»): delle
// azioni del centroboa, gol 6,7%, tiro senza gol 7,2%, espulsione procurata 41,4%, fallo in attacco 17,9%, palla rubata 16,6%,
// passaggio sbagliato al centro 10,1%; il centroboa procura il 67,6% delle espulsioni. Prima della v0.81 il centroboa con la palla si
// girava da solo verso la porta appena il marcatore non gli stava proprio dietro, e tirava di fronte (nessuna beduina).
// addosso = entro questi metri (la distanza della lotta) il marcatore al fianco o dietro non lo lascia girare: tiene la palla di
// spalle alla porta (con 1,3 m bastava che il marcatore si staccasse di poco perché si girasse da solo e tirasse); ogni
// decisione (0,45-0,85 s), dopo «tiroDa» s di lotta tira di beduina o di sciarpa con probabilità «tiro», dopo «girataDa» s prova a
// girarsi nuotando attorno al marcatore con probabilità «girata», dopo «scarico» s scarica al perimetro. girarsi = secondi di palla
// in mano prima del tiro quando riceve già girato verso la porta con il marcatore ancora nella lotta (prima 0,12 s: tirava subito).
export const CENTRO_PALLA={ addosso:1.8, tiroDa:0.4, tiro:0.3, girataDa:0.6, girata:0.15, scarico:1.8, girarsi:0.45 };
// ENTRATA, il taglio verso la porta (v0.66, punto 4 di Ale: «gol su entrata quasi zero»; `strumenti/sonda-entrate.mjs`): il
// computer non entrava mai (giocava sempre l'«Arco», che non ha tagliante) e, con lo schema «Entrata», a chi entrava la palla
// arrivava appena partito, a 7,7 m dalla porta, e il taglio finiva lì (una entrata su 25 finiva con un tiro).
// azione = quota delle azioni in parità in cui il computer manda in entrata un mezzo (Pos. 2 o 3; prove: 0,35 → 24% dei gol su
// entrata; 0,15 → 7%, ma espulsioni da 10,5 a 9,2 e superiorità dal 46 al 40% su 16 partite; 0,08 → 6%, il resto come prima);
// ogni = secondi tra due entrate
// della stessa squadra (prima 7: 81 entrate a partita con lo schema «Entrata»); vicino = metri dalla porta entro cui chi entra
// riceve, se ha almeno «vantaggio» metri sul difensore più vicino (che gli resta alle spalle) o almeno «libero» metri di spazio;
// tiro = secondi dalla ricezione in cui tira subito.
export const ENTRATA={ azione:0.08, ogni:12, vicino:5, vantaggio:1.0, libero:2.0, tiro:1.2 };

// Entrate reattive v0.68: indicazioni tecniche di Ale (20/11/2026), passaggio al vicino e taglio 3→5/1,
// 2 al palo e mezze entrate solo con la testa avanti. Metri e secondi; nessuna probabilità di gol/fallo aggiunta.
// Lato a mano sfavorevole: coppia mancina oppure media velocità/precisione/forza almeno 84.
// I tempi generali COSTRUZIONE/PAZIENZA e la quota ENTRATA.azione restano invariati.
// SCHEMI CONTRO IL PRESSING (v0.90, Ale; entrate.js `schemaDovuto`): il computer chiama sempre uno schema contro il pressing in parità,
// al massimo «massimo» per possesso; un secondo «intervallo» s dopo l'inizio del primo, solo con almeno «tempo» s di possesso ancora. Il
// passaggio che avvia lo schema va anche a un compagno marcato, purché la linea sia sicura (rischio di intercetto sotto «rischio») e il
// portatore non sia oltre «profondita» m dalla porta; se dopo «attesa» s lo schema con il passaggio non è partito, entra il mezzo del
// lato debole.
export const SCHEMI_PRESSING=Object.freeze({ massimo:2, intervallo:7, tempo:9, rischio:0.3, profondita:10, attesa:2.5 });
export const ENTRATE_REATTIVE={ pressing:1.55, attacco:8.5, appoggio:6.8, fondo:2.35, palo:1.7,
  diagonale:4.6, corridoio:2.7, alaSale:3.25, stringe:2.05, testa:0.65, manoAbile:84,
  durata:6.4, attesaAppoggio:2.8, centro:4.3, difensoreForte:80, divario:8,
  // Una risposta alla circolazione contro pressing, senza interrompere la ripartenza al primo tocco.
  // Margine per arresto/arrivo: il corpo si ferma poco prima dell'obiettivo (12 cm),
  // senza restare appena fuori dai 5 m richiesti per decidere il passaggio.
  circolazione:6, passaggi:2, mezzaMetri:1.4, mezzaMin:0.6, mezzaMargine:0.2 };

// Servizio alla boa v0.70: qualifiche geometriche del gioco, non dati di frequenza
// reale. Nessun bonus nuovo al gol: si riusano i punteggi del passaggio già libero.
// Il portiere resta un rischio sulla presa: raggio PRESA.portiere + margine, poi
// proiezione della sua velocità verso la boa sul tempo di volo (massimo 0,8 m).
export const SERVIZIO_BOA={ passaggio:8.5, porta:6, spazio:2.1, fronte:.65,
  corridoio:.55, rischio:.18, dietroNonCopre:.25, areaLaterale:3.58, lineaPalla:.05,
  portiereMargine:.35, portiereAnticipo:.8, voloMinimo:.25 };

// ---------- PASSAGGI, INTERCETTI E PALLE PERSE (fisica.js, tiri.js) ----------
// INTERCETTO: probabilità che un difensore sulla linea legga il passaggio (base, più «lungo» per i passaggi che volano a lungo).
// Reale: palla persa in circa il 20% delle azioni in parità (Mondiali 2009). v0.60: 0,09/0,3 → 0,12/0,36; v0.64: base 0,12 → 0,14.
export const INTERCETTO={ base:0.14, lungo:0.36 };
// ERRORE_PASSAGGIO (v0.57, Ale: «sono aumentati a dismisura i passaggi sbagliati, anche semplici: qui c'è il meglio del meglio;
// l'errore può capitare ma deve essere verosimile»): base 1,5 → 1,0, pressione 2,5 → 0,8, disteso 0,6 → 0,3; errore limitato a
// «limite» deviazioni tipiche.
export const ERRORE_PASSAGGIO={ base:1.0, pressione:0.8, disteso:0.3, limite:2 };
// SCAMBI NEI RIENTRI (v0.80, Ale: «non funzionano molto i cambi di marcatura in difesa. Sembra che ogni giocatore guardi solo il
// proprio giocatore. Così facendo però si generano diverse controfughe che in realtà non esisterebbero»). Mentre la difesa rientra
// (palla a più di «schierata» m dalla propria porta, come in inRientro; più vicino la difesa è schierata e scambia sui tagli,
// cambioMarcatura), ogni «ogni» secondi: gli attaccanti più avanti della palla (fino a «davanti» m
// dietro di lei) li prende, dal più vicino alla porta, il difensore meglio piazzato: costo = distanza + «dietro» per ogni metro in cui
// il difensore è più lontano dalla porta di lui. Si scambia solo se il marcatore è stato superato (più lontano dalla porta del suo
// uomo di oltre «battuto» m, o a più di «lontano» m da lui) e costa almeno «guadagno» più del migliore; chi ha appena scambiato
// tiene il nuovo uomo per «tieni» secondi (senza queste due regole, 381-650 scambi a squadra per partita: avanti e indietro). Il
// difensore comandato dal giocatore e chi rallenta il portatore non prendono un uomo nuovo (ma il loro può prenderlo un compagno).
export const RIENTRO_SCAMBI={ ogni:0.3, schierata:9.2, davanti:1, dietro:2, battuto:1.5, lontano:5, guadagno:3, tieni:2.5 };
// PASSAGGI (v0.79, Ale: «i passaggi possono essere di due modi: o morbido sull'acqua vicino al compagno (di solito quando il ritmo
// è più rilassato sul perimetro o quando la si passa al centro boa) oppure alto e teso (di solito durante l'uomo in più o quando si
// palleggia prima della chiusura dell'azione o per cambiare velocemente area del campo)»).
// MORBIDO: velocità morbido[0] + morbido[1]×Passaggio m/s, arriva sull'acqua (altezza) «davanti» m dal compagno verso chi passa,
// errore × «errore» (corto e lento: più facile da mettere giusto). TESO: quello di prima, 11-15,5 m/s alla mano alzata.
// Si passa teso con l'uomo in più, negli ultimi «ultimi» secondi del possesso, oltre «lungo» m, cambiando lato (oltre «lato» m
// di differenza), in transizione (chi passa a più di «transizione» m dalla porta avversaria), con un avversario entro «corridoio»
// m dalla linea del passaggio e al compagno libero in posizione di tiro (entro «tiro» m dalla porta, nessun avversario entro
// «libero» m: la palla gli arriva in mano e può tirare subito, anche al volo; vale anche per il centroboa che si è liberato, v0.55).
// Al centroboa marcato il passaggio resta in acqua davanti a lui, con la velocità del morbido.
export const PASSAGGI={ morbido:[6.5,2.5], altezza:0.12, davanti:0.3, errore:0.6, ultimi:8, lungo:8, lato:6, transizione:10, corridoio:0.9, tiro:6.5, libero:1.5 };
// PRESA del passaggio: distanza orizzontale massima dal corpo (braccio teso verso la palla) e altezza massima della palla.
// v0.56: alla mano 0,5 m (prima 0,85 m dal centro del corpo); v0.57: 0,5 → 0,55, il portiere arriva più lontano (due mani, tuffo).
export const PRESA={ raggio:0.55, portiere:0.9, alto:1.5 };

// ---------- PORTIERE (fisica.js) ----------
// PARATA_SUP: in superiorità il portiere para meno, la difesa in cinque lascia più spazio. Reale: 52% di superiorità trasformate
// (Mondiali 2025). v0.60: 0,2 → 0,3 (prima il gioco era al 32-40%). v0.65: 0,3 → 0,38 (sonda della superiorità: sui tiri nello
// specchio con l'uomo in più il portiere ne parava il 47%; provato anche 0,46, ma il portiere parava solo l'11% dei tiri).
export const PARATA_SUP=0.38;
// STATISTICHE IN PARTITA (v0.89, riequilibrio; Ale: «una volta fatto queste modifiche puoi anche riequilibrare le partite»): gli effetti
// continui delle voci SENZA un effetto minimo nella specifica di Ale (v0.16) usano la statistica pesata attorno a «riferimento»:
// riferimento + (statistica − riferimento) × peso. Sono Riflessi, Posizione e Uscita del portiere, Difesa, Passaggio, Forza,
// Resistenza, Disciplina e Visione: quanto para ed esce il portiere, quanto difende, passa e lotta, quanto resiste, quanto è
// disciplinato, quanto sceglie bene. Velocità, Precisione e Potenza restano piene (specifica: tra un 90 e un 60 +15-20% di velocità in
// sprint, circa il doppio dei tiri nello specchio, palla da circa 20 a 25 m/s; prova `npm run statistiche`). Le soglie (chi può fare
// cosa), le scelte tra compagni, le schede e le valutazioni usano le statistiche vere. Con peso 1 tutto come prima. Perché: le differenze
// tra le squadre si sommavano in tutte le voci (l'Ungheria è circa +8 in ognuna rispetto all'Italia) e nelle 16 partite della v0.88
// l'Ungheria vinceva sempre segnando il doppio (26,5 a 13,4); tra due squadre vicine nel ranking le partite vere finiscono più spesso
// con pochi gol di scarto.
export const STAT_PARTITA=Object.freeze({ riferimento:75, peso:0.6 });
export const pesata=v=>STAT_PARTITA.riferimento+(v-STAT_PARTITA.riferimento)*STAT_PARTITA.peso;
// MIRA (tiri.js): errore di mira secondo la Precisione: base + ((90 − Precisione)/30)^curva × scala sotto 90, base − (Precisione −
// 90)/9 × sopra oltre 90; «globale» moltiplica l'errore di tutti i tiri. Fino alla v0.88: base 0,18, scala 1,55, curva 1,6, globale 1
// (l'errore di un 75 era il doppio di quello di un 83 e 85 tiri su 100 arrivavano in porta, nelle partite vere circa 2 su 3).
// v0.89: curva piatta tra 75 e 90 (un 75 sbaglia 1,24 volte un 83) e ripida sotto 70, così resta la specifica di Ale (Precisione 90
// contro 60: circa il doppio dei tiri nello specchio, `npm run statistiche`); oltre 90 l'errore scende fino a 0,15 a 99 (nel database
// nessun giocatore di movimento supera 89: conta per le prove e per le correzioni a mano).
export const MIRA={ base:0.52, scala:1.45, curva:3.2, sopra:0.37, globale:1.3 };

// ---------- ARBITRO (regole.js, lotta.js, partita.js) ----------
// ESPULSIONI (indicazione di Ale, 13/11/2026: circa il 70% dalla lotta tra centroboa e marcatore, il resto da falli tattici o
// interventi irruenti): moltiplicatori della probabilità di espulsione nella lotta al centro e negli altri contrasti. Reale: circa
// 11 espulsioni per squadra a partita, 66% dal centroboa (Mondiali 2025). v0.56: centro 7 → 5,6; v0.60: 5,6 → 6,5; v0.64: centro
// 6,5 → 9 (la lotta piena arriva ancora più tardi), contrasto 0,24 → 0,21.
export const ESPULSIONI={ centro:9, contrasto:0.21 };
// LOTTA_FASE (v0.56): nei primi secondi di un'azione in parità la squadra si sta schierando e il centroboa non ha preso posizione:
// espulsioni e falli al centro partono da «minimo» e arrivano al pieno tra «da» e «a» secondi d'azione.
// v0.59: 5-16 → 8-20 s; v0.60: 10-24 s (espulsioni procurate a 11,8 s di media); v0.64: minimo 0,15 → 0,1, pieno tra 12 e 26 s.
export const LOTTA_FASE={ minimo:0.1, da:12, a:26 };
// CENTRO_SENZA_PALLA (v0.45): lotta al centro mentre il centroboa non ha la palla, probabilità al secondo: espulsione = trattenere
// o affondare chi non ha palla; inArrivo = affondarlo mentre il passaggio gli arriva; fallo = fallo semplice (tiro libero);
// contro = spinta all'indietro del centroboa (fallo in attacco). v0.64: contro 0,05 → 0,12 (falli in attacco 8,5% → 14%, reale 15%).
export const CENTRO_SENZA_PALLA={ espulsione:0.07, inArrivo:0.9, fallo:0.18, contro:0.12 };
// LOTTA_PALLA (v0.64, prima scritti in lotta.js): lotta al centro con la palla al centroboa, probabilità al secondo (per la fase
// della lotta e l'aggressività del difensore): espulsione + vantaggio × lettura della posizione; fallo semplice; contro + spinta ×
// svantaggio = fallo in attacco del centroboa; ruba + spinta × svantaggio = palla rubata dal difensore. v0.64: contro 0,14 → 0,45,
// ruba 0,08 → 0,14.
export const LOTTA_PALLA={ espulsione:0.42, vantaggio:0.5, fallo:0.5, contro:0.45, controSpinta:0.3, ruba:0.14, rubaSpinta:0.25 };
// ARBITRI (v0.45, manuale arbitri FINA 2019-21 adattato al regolamento World Aquatics 2026): palleggio = probabilità di espulsione
// per il fallo su chi palleggia; interferenza = per chi resta entro 1 m da chi batte il tiro libero. v0.64: palleggio 0,35 → 0,28.
export const ARBITRI={ palleggio:0.28, interferenza:0.45 };
// ANTICIPO BATTUTO al centroboa (v0.55, Ale: «se la palla dovesse passare e arrivare davanti al centroboa sarebbe rigore»): entro
// «distanza» metri dalla porta rigore in ANTICIPO.rigore casi, poi espulsione in ANTICIPO.espulsione casi, altrimenti palla libera.
export const ANTICIPO={ rigore:0.45, espulsione:0.35, distanza:5 };
// RIGORI (v0.64, prima scritti in regole.js): probabilità di rigore per un fallo grave su chi sta per segnare entro i 6 m (dietro =
// fallo da dietro, altri = di lato o davanti, voluto = fallo voluto). Reale: 1,8 rigori per squadra a partita (Mondiali 2025).
// v0.64: 0,6/0,35/0,6 → 0,45/0,25/0,5 (con l'attacco più paziente i falli vicino alla porta erano saliti a 3,7 rigori a partita).
export const RIGORI={ dietro:0.45, altri:0.25, voluto:0.5 };
// CONTR_AI: contrasto del computer (sezione 2): ritmo = tentativi al secondo, insiste = moltiplicatore dopo un tocco recente,
// fallo + indisciplina × (1 − Disciplina) = probabilità di arrivare al terzo tocco ravvicinato, che è fallo.
export const CONTR_AI={ ritmo:1.5, insiste:2.0, fallo:0.2, indisciplina:0.4 };

// ---------- FINTE (finte.js) ----------
// FIRMA (scelta di Ale: «piccolo vantaggio»): chiudere la finta con il suo seguito tipico entro FIRMA.entro secondi spiazza un po'
// di più portiere e difensori (sorpresa del tiro, passaggio più difficile da intercettare: × intercetto).
export const FIRMA=Object.freeze({ entro:1.6, sorpresa:0.08, intercetto:0.7 });
// FINTA DI LATO (v0.59, dal video di Dénes Varga; Ale: «sposta sia il difensore che il portiere»): per «durata» secondi chi abbocca
// sposta il braccio da quella parte (muro × lontano sul lato opposto, × vicino sullo stesso); il portiere si sposta di «portiere»
// metri verso quel palo e para meno sul lato opposto (parataLontano) e un po' di più sullo stesso (parataVicino); gesto =
// rotazione del braccio di lato (solo disegno).
// Il verso di ogni finta (di lato nei due sensi o avanti e indietro) lo decide il marchio di fabbrica del giocatore (FINTA_FIRMA, v0.87;
// prima, v0.85, FINTA_LATO.quota: di lato 65 volte su 100 e sempre da destra verso sinistra). Con la levetta il giocatore sceglie il palo.
export const FINTA_LATO={ durata:1.1, portiere:0.45, lontano:0.4, vicino:1.15, parataLontano:0.35, parataVicino:0.08, gesto:0.5 };
// MARCHIO DI FABBRICA DELLA FINTA (v0.87, Ale: «la finta è quasi un marchio di fabbrica dei giocatori (ognuno ce l'ha diversa)»; «le
// finte possono essere da destra verso sinistra e da sinistra verso destra, oppure in avanti e poi indietro, con movimenti più veloci o
// più lenti e con il braccio teso o piegato», per tutte le finte). Oltre allo stile (finte.js) ogni giocatore ha la sua finta, sempre la
// stessa (dal suo id, senza il caso del gioco):
//  - verso preferito, scelto con i pesi «versi»: traverso = di lato da destra verso sinistra, attraverso il corpo (per un mancino da
//    sinistra verso destra), il più frequente; fuori = di lato dall'altra parte, verso l'esterno; avanti = avanti e indietro. Ogni finta
//    va nel suo verso «verso» volte su 100, le altre negli altri due con gli stessi pesi. Nel complesso circa 45 finte su 100 da destra
//    verso sinistra, 23 da sinistra verso destra e 32 avanti e indietro;
//  - larghezza sua (stretta e veloce o ampia e lenta): quella dello stile ± «larghezza»; a ogni finta ± varia/2 (FINTA_AMPIEZZA: sotto
//    porta più stretta, cioè più veloce);
//  - braccio teso o piegato suo, «braccio» volte su 100 (solo disegno).
// Non ci sono misure reali: sono le indicazioni di Ale.
export const FINTA_FIRMA=Object.freeze({ versi:{ traverso:0.5, avanti:0.3, fuori:0.2 }, verso:0.7, larghezza:0.25, braccio:0.85 });
// AMPIEZZA DELLE FINTE (v0.85, Ale: «in generale può essere fatta con movimenti stretti e veloci o più ampi e lenti»). A ogni finta la
// larghezza (0 stretta, 1 ampia) = quella del giocatore (v0.87, FINTA_FIRMA; v0.85: la tendenza dello stile) ± varia/2 (v0.85: 0,5);
// entro «vicino» metri dalla porta più stretta di «stretta» (da 2 m prima; Ale: «sotto porta hai meno tempo, di solito sono un po' più
// veloci che da fuori area»). Stretta = veloce: i tempi minimi della v0.76 (FINTA_MOVIMENTO:
// preparazione 0,16 s, accenno 0,18 s, ritorno 0,36 s); ampia = lenta: fino a «preparazione», «accenno» e «ritorno» secondi in più.
export const FINTA_AMPIEZZA={ varia:0.2, vicino:6, stretta:0.25, preparazione:0.10, accenno:0.10, ritorno:0.12 };
// RITMO DELLE FINTE (v0.85, Ale: «davanti alla porta finta veloce ma non troppo»; «ora quelle vicino alla porta sono troppo veloci,
// vanno rallentate»). Video di Dénes Varga (v0.58): finta larga circa 0,6 s tra andata e ritorno, tiro circa 0,2 s dopo la ricarica.
// Prima il computer partiva con il gesto successivo (quasi sempre un passaggio) a metà del ritorno del braccio: 0,50 s in media
// dall'inizio della finta, ritorno interrotto 82 volte su 100 tra 5 e 7 m (sonda-finte, 4 partite). Ora dopo ogni finta il braccio
// torna alla carica (FINTA_MOVIMENTO.recupero, 0,36 s) e resta carico ancora «attesa» secondi prima del gesto successivo (finta,
// tiro o passaggio), per il computer e per il giocatore che tiene TIRO (prima 0,12 s). Il rilascio di TIRO tira sempre subito.
export const FINTA_RITMO={ attesa:0.2 };

// ---------- FATICA E CAMBI (fisica.js, panchina.js) ----------
// STANCO = quota della velocità che resta a stamina zero (−18%), CON_PALLA = velocità con la palla (−7%), SPRINT_CONSUMO = fatica
// al secondo in sprint. v0.54: stanchezza −40% → −18%, con la palla −15% → −7%; consumo +6,5% per restare «visibilmente stanchi»
// dopo 7 vasche.
export const STANCO=0.82, CON_PALLA=0.93, SPRINT_CONSUMO=0.0098;
// PRESSING_CONSUMO = fatica al secondo di chi difende a pressing (in più di scatti e contatti; partita.js, prima scritto nel codice).
// v0.67: 0,012 → 0,008 (sonda degli scatti: anche con meno scatti i giocatori passavano un quarto del tempo sotto la soglia dei cambi).
export const PRESSING_CONSUMO=0.008;
// RIGORE (v0.84, Ale: «la palla deve partire dall'acqua e il movimento deve essere continuo, altrimenti controfallo»): chi tira il
// rigore e resta fermo a braccio caricato (carica piena) per più di «fermo» secondi commette controfallo: palla al portiere (nella
// serie finale il rigore è sbagliato). Prima si poteva tenere la carica fino a 7 s.
export const RIGORE_TIRO={ fermo:0.5 };
// SCHIERAMENTO DEL RIGORE (v0.90, Ale; regole.js setupPenalty): vicino al tiratore, sulla linea dei 6 metri, «difensori» difensori e al
// massimo «attaccanti» attaccanti; gli altri a coppie affiancate a metà campo, a «meta» m dalla linea di metà campo nella metà di chi
// tira, su corsie fino a «larghezza» m dal centro. Prima tutti sulla linea dei 6 metri.
export const RIGORE_SCHIERA=Object.freeze({ difensori:2, attaccanti:2, meta:0.6, larghezza:6 });
// TIME-OUT (v0.83, Ale: «chiamato quando si subisce un break, o negli ultimi minuti per preparare un attacco; i giocatori si
// schierano nella metà campo avversaria; l'arbitro dà la palla al portiere a metà campo, che la passa al compagno libero e torna in
// porta nuotando»). finale = negli ultimi «finale» secondi dell'ultimo tempo il computer pari o sotto di un gol chiama il time-out
// per preparare l'attacco, appena riprende la palla (entro «eta» secondi dal recupero); recupero = energia recuperata nel minuto di
// time-out. Il break (tre gol di fila subiti) c'era già (regole.js).
export const TIMEOUT={ finale:90, eta:4, recupero:0.4 };
// PANCHINA (v0.32): recupero = stamina recuperata al secondo in panchina; stanco/fresco = soglie del consiglio di cambio;
// controllo = ogni quanti secondi il computer guarda la panchina; pausaComputer = secondi minimi tra due cambi del computer;
// stancoComputer = sotto questa stamina il computer cambia; stancoPozzetto = soglia del cambio dal pozzetto; velBordo, cinque,
// distZona = velocità lungo il bordo, durata del «cinque», distanza dalla zona dei cambi.
// v0.82 (Ale: «cambi volanti: non quando l'attacco è già impostato; il sostituto deve entrare da metà campo con il cinque; niente
// passaggi a un giocatore appena entrato a 20 m»; regole World Aquatics del 25/6/2025, art. 18: la zona dei cambi volanti va dalla
// linea di porta davanti alla panchina alla metà campo): distZona 3,2 → 11 m (1,5 m prima della metà campo); ingresso = dove compare
// il sostituto, a metri dalla propria linea di porta (prima sulla linea di porta); transizione = un cambio volante comincia solo nei
// primi «transizione» secondi del possesso o con la palla nella propria metà, mai ad attacco impostato né in difesa (prima il
// computer cambiava in qualunque momento: sulla v0.81, 4 partite, metà dei cambi cominciavano in difesa e il 29% ad attacco
// impostato); appena = per questi secondi dopo il cinque il sostituto riceve la palla solo quando è a «zona» m dalla porta
// d'attacco (sulla v0.81 6 passaggi di 12-24 m su 66 a chi era appena entrato, a 20-24 m dalla porta). stancoLibero/liberiMax: a
// gioco fermo con i cambi liberi (dopo un gol, nel time-out, tra i tempi) il computer cambia subito chi è sotto «stancoLibero», fino a
// «liberiMax» giocatori (prima uno alla volta, come i volanti: con i volanti solo in transizione i cambi scendevano da 24 a 11 per
// squadra a partita e i giocatori restavano più spesso sotto il 20% di energia).
export const PANCHINA = { recupero: 0.025, stanco: 0.42, fresco: 0.7, controllo: 2, pausaComputer: 55, stancoComputer: 0.34, stancoPozzetto: 0.8, velBordo: 0.9, cinque: 0.5, distZona: 11, ingresso: 8.5, transizione: 7, appena: 10, zona: 10.5, stancoLibero: 0.45, liberiMax: 2 };

// ---------- LA REALTÀ A CUI PUNTIAMO (per squadra a partita) ----------
// voce = come la stampa `npm run taratura`; dato = dove sta nel riassunto di tests/bilancio.mjs (--salva); reale = riferimento
// (un numero o un intervallo); banda = intervallo che consideriamo a posto; numeri = i numeri qui sopra che la spostano di più.
// Fonti: Results Report dei Mondiali 2025 (World Aquatics, uomini); Lupo, Condello, Tessitore 2012 (Mondiali 2009); Lupo et al.
// 2012 (Euro League: circa 50 azioni, 37 in parità, 2 controfughe, 11 superiorità); video di Ale della finale olimpica Parigi 2024
// (v0.58-v0.61). Le azioni dei Mondiali 2009 duravano circa 21 s con 30 s di possesso (oggi 28); per le espulsioni dalla lotta al
// centro Ale indica circa il 70%.
// (/*#__PURE__*/: il gioco non la usa, così non finisce nel pacchetto che si scarica sull'iPhone)
export const REALE=/*#__PURE__*/Object.freeze([
  { voce:'tiri', dato:'tiri', reale:33, banda:[29,37], fonte:'Mondiali 2025', numeri:['COSTRUZIONE','TIRO_LIBERATO','FINE_AZIONE','PAZIENZA','SUPERIORITA'] },
  { voce:'gol', dato:'gol', reale:13.3, banda:[11,15.5], fonte:'Mondiali 2025', numeri:['PARATA_SUP','TIRO_LIBERATO','COSTRUZIONE'] },
  { voce:'tiri in gol', dato:'conversione', unita:'%', reale:40, banda:[36,44], fonte:'Mondiali 2025', numeri:['COSTRUZIONE','PARATA_SUP','TIRO_LIBERATO'] },
  { voce:'espulsioni', dato:'espulsioni', reale:11, banda:[9.5,12.5], fonte:'Mondiali 2025', numeri:['ESPULSIONI','LOTTA_FASE','CENTRO_SENZA_PALLA','CONTR_AI'] },
  { voce:'espulsioni dalla lotta al centro', dato:'espCentro', unita:'%', reale:66, banda:[60,75], fonte:'Mondiali 2025', numeri:['ESPULSIONI','LOTTA_FASE','CENTRO_SENZA_PALLA'] },
  { voce:'superiorità trasformate', dato:'superioritaTrasformate', unita:'%', reale:52, banda:[45,58], fonte:'Mondiali 2025', numeri:['SUPERIORITA','PARATA_SUP','TIRO_LIBERATO'] },
  { voce:'rigori', dato:'rigori', reale:1.8, banda:[1,2.5], fonte:'Mondiali 2025', numeri:['RIGORI','ANTICIPO'] },
  { voce:'azioni a partita', dato:'azioniTotali', reale:50, banda:[45,56], fonte:'Euro League', numeri:['FINE_AZIONE','CENTRO_ATTESA','LOTTA_FASE','RIPARTENZA'] },
  { voce:'parità: durata dell\'azione', dato:'azioni.parita.durata', unita:'s', reale:21, banda:[18,24], fonte:'Mondiali 2009', numeri:['FINE_AZIONE','CENTRO_ATTESA','LOTTA_FASE','RIPARTENZA'] },
  { voce:'parità: gol', dato:'azioni.parita.gol', unita:'%', reale:[6,19], banda:[6,19], fonte:'Mondiali 2009', numeri:['COSTRUZIONE','TIRO_LIBERATO'] },
  { voce:'parità: tiro sbagliato', dato:'azioni.parita.tiro', unita:'%', reale:32, banda:[27,37], fonte:'Mondiali 2009', numeri:['COSTRUZIONE','TIRO_LIBERATO','PAZIENZA'] },
  { voce:'parità: palla persa', dato:'azioni.parita.persa', unita:'%', reale:20, banda:[15,25], fonte:'Mondiali 2009', numeri:['INTERCETTO','LOTTA_PALLA','ERRORE_PASSAGGIO'] },
  { voce:'parità: fallo in attacco', dato:'azioni.parita.falloAttacco', unita:'%', reale:15, banda:[10,20], fonte:'Mondiali 2009', numeri:['LOTTA_PALLA','CENTRO_SENZA_PALLA','LOTTA_FASE'] },
  { voce:'parità: espulsione procurata', dato:'azioni.parita.espulsione', unita:'%', reale:22, banda:[17,27], fonte:'Mondiali 2009', numeri:['ESPULSIONI','LOTTA_FASE','CENTRO_SENZA_PALLA'] },
  { voce:'palla in mano prima del passaggio', dato:'manoPassaggio', unita:'s', reale:[0.6,1], banda:[0.6,1], fonte:'finale olimpica Parigi 2024 (video di Ale)', numeri:['CIRCOLAZIONE'] },
]);
// v0.71: tempi e presa del portiere; il contatto effettivo resta geometrico.
// Calibrazione di gioco: reazione e velocità limitano il tuffo, non garantiscono
// l'arrivo sulla palla. La palla ha raggio regolamentare in fisica-palla/parametri.
export const PARATA_PORTIERE = {
  reazioneMin: 0.08,
  reazioneRiflessi: 0.10,
  reazioneStanchezza: 0.03,
  velocitaMano: 7,
  durataMinima: 0.05,
  presaLenta: 0.5,
  presaVeloce: 0.04,
  velocitaLenta: 10,
  velocitaVeloce: 22,
  distanzaRavvicinata: 5.5,
  tempoRavvicinato: 0.32,
  presaRavvicinata: 0.05,
  recupero: 0.28,
  restituzione: 0.3,
  // Prima0,41 assegnava direttamente la parata. Ora è solo la lettura giusta:
  // servono anche reazione, portata e impatto. Con0,41:210/240rigori in gol.
  letturaRigore: 0.7,
};

// v0.71: profili di tiro richiesti da Ale. Palombella prima 4,5+d*0,15 m/s
// (8m: 1,40s/picco3,17m); ora circa 1,02s/picco2,08m con il medesimo spin.
// Quadrella nominale dentro il centro-palla utile della porta (±1,389m/0,789m);
// l'errore personale si aggiunge dopo, senza cambiare Precisione o Potenza.
// Rimbalzo: primo contatto 0,8–1,5m prima del portiere; risalita dalle forze
// di de Mestre già in palla.js, senza impulsi. Valori da calibrare nel gioco.
export const TRAIETTORIE_TIRO={
  palombellaVelocita:7.8,palombellaMin:0.7,palombellaMax:1.15,
  forteDa:0.8,quadrellaZ:1.12,quadrellaLarghezza:0.18,quadrellaY:0.66,quadrellaAltezza:0.10,
  rimbalzoDistanzaMin:6,rimbalzoPrimaPortiere:1.2,rimbalzoPrimaMin:0.9,rimbalzoPrimaPendenza:0.15,rimbalzoTrattoMin:2.2,
  rimbalzoImmersione:0.02,portiereDallaPorta:0.7,
};
