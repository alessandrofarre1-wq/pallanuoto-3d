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
// v0.61: prima 0,55+0,5 / 0,8+0,4 / 1,1+0,7 / 1,3+0,9.
export const CIRCOLAZIONE={ superiorita:[0.4,0.35], rapidi:[0.4,0.25], equilibrati:[0.55,0.4], vicini:[0.7,0.45] };
// COSTRUZIONE (v0.56): nelle partite vere un'azione in parità dura circa 21 s (Mondiali 2009) e se ne giocano circa 50 a partita
// (Euro League). Nei primi COSTRUZIONE.secondi di un'azione in parità non si tira al volo e il tiro «da libero» si cerca meno
// (COSTRUZIONE.libero) oltre COSTRUZIONE.vicino metri dalla porta; restano il tiro senza difensori davanti e quello vicinissimo.
// v0.59: 7 → 11 s; v0.60: 11 → 15 s (circa 5,5 s di transizione + 9,5 s di attacco schierato).
export const COSTRUZIONE={ secondi:15, libero:0.3, vicino:4.5 };
// TIRO SUBITO DOPO LA RICEZIONE (v0.59): si decide una volta per ricezione; in parità si tira subito in TIRO_LIBERATO.parita casi,
// altrimenti si continua a far girare palla; in superiorità TIRO_LIBERATO.superiorita; quick = quota delle superiorità in cui si
// cerca il tiro nei primi 3 s. v0.60: parità 0,4 → 0,3, superiorità 0,85 → 1.
export const TIRO_LIBERATO={ parita:0.3, superiorita:1, quick:0.3 };
// PAZIENZA in parità: secondi di possesso (su 28) prima di cominciare a cercare il tiro anche senza occasioni, e secondi per
// arrivare alla piena voglia di tirare.
export const PAZIENZA=[24,3];
// SUPERIORITÀ del computer (v0.58): pronta = secondi prima di cercare il tiro; dopoCambio = per quanti secondi dopo un passaggio
// che ha cambiato lato si tira subito (da cambioDa secondi in poi); libero = da quando si tira se davvero liberi; attesa/rampa = la
// voglia di tirare cresce da «attesa» ad «attesa + rampa» secondi. Reale: 52% di superiorità trasformate (Mondiali 2025).
// v0.58: pronta 5 → 7 s, voglia da 5-9 a 9-13 s; v0.59: pronta 9 s, voglia da 8 a 12 s.
export const SUPERIORITA={ pronta:9, dopoCambio:1.6, cambioDa:3, libero:8, attesa:8, rampa:4 };
// RIPARTENZA con la palla a un giocatore di movimento (v0.58): d3 = dove va il 3 (metri dalla porta avversaria); arrivato = sotto
// questa distanza dal posto non si scatta più; transizione = finché la palla è oltre questi metri dalla porta avversaria i
// compagni vanno dritti ai loro posti d'attacco scattando (fuori dalla controfuga organizzata).
export const RIPARTENZA={ d3:7.0, arrivato:2.5, transizione:10 };

// ---------- PASSAGGI, INTERCETTI E PALLE PERSE (fisica.js, tiri.js) ----------
// INTERCETTO: probabilità che un difensore sulla linea legga il passaggio (base, più «lungo» per i passaggi che volano a lungo).
// Reale: palla persa in circa il 20% delle azioni in parità (Mondiali 2009). v0.60: 0,09/0,3 → 0,12/0,36.
export const INTERCETTO={ base:0.12, lungo:0.36 };
// ERRORE_PASSAGGIO (v0.57, Ale: «sono aumentati a dismisura i passaggi sbagliati, anche semplici: qui c'è il meglio del meglio;
// l'errore può capitare ma deve essere verosimile»): base 1,5 → 1,0, pressione 2,5 → 0,8, disteso 0,6 → 0,3; errore limitato a
// «limite» deviazioni tipiche.
export const ERRORE_PASSAGGIO={ base:1.0, pressione:0.8, disteso:0.3, limite:2 };
// PRESA del passaggio: distanza orizzontale massima dal corpo (braccio teso verso la palla) e altezza massima della palla.
// v0.56: alla mano 0,5 m (prima 0,85 m dal centro del corpo); v0.57: 0,5 → 0,55, il portiere arriva più lontano (due mani, tuffo).
export const PRESA={ raggio:0.55, portiere:0.9, alto:1.5 };

// ---------- PORTIERE (fisica.js) ----------
// PARATA_SUP: in superiorità il portiere para meno, la difesa in cinque lascia più spazio. Reale: 52% di superiorità trasformate
// (Mondiali 2025). v0.60: 0,2 → 0,3 (prima il gioco era al 32-40%).
export const PARATA_SUP=0.3;

// ---------- ARBITRO (regole.js, lotta.js, partita.js) ----------
// ESPULSIONI (indicazione di Ale, 13/11/2026: circa il 70% dalla lotta tra centroboa e marcatore, il resto da falli tattici o
// interventi irruenti): moltiplicatori della probabilità di espulsione nella lotta al centro e negli altri contrasti. Reale: circa
// 11 espulsioni per squadra a partita, 66% dal centroboa (Mondiali 2025). v0.56: centro 7 → 5,6; v0.60: 5,6 → 6,5.
export const ESPULSIONI={ centro:6.5, contrasto:0.24 };
// LOTTA_FASE (v0.56): nei primi secondi di un'azione in parità la squadra si sta schierando e il centroboa non ha preso posizione:
// espulsioni e falli al centro partono da «minimo» e arrivano al pieno tra «da» e «a» secondi d'azione.
// v0.59: 5-16 → 8-20 s; v0.60: 10-24 s (espulsioni procurate a 11,8 s di media).
export const LOTTA_FASE={ minimo:0.15, da:10, a:24 };
// CENTRO_SENZA_PALLA (v0.45): lotta al centro mentre il centroboa non ha la palla, probabilità al secondo: espulsione = trattenere
// o affondare chi non ha palla; inArrivo = affondarlo mentre il passaggio gli arriva; fallo = fallo semplice (tiro libero);
// contro = spinta all'indietro del centroboa (fallo in attacco).
export const CENTRO_SENZA_PALLA={ espulsione:0.07, inArrivo:0.9, fallo:0.18, contro:0.05 };
// ARBITRI (v0.45, manuale arbitri FINA 2019-21 adattato al regolamento World Aquatics 2026): palleggio = probabilità di espulsione
// per il fallo su chi palleggia; interferenza = per chi resta entro 1 m da chi batte il tiro libero.
export const ARBITRI={ palleggio:0.35, interferenza:0.45 };
// ANTICIPO BATTUTO al centroboa (v0.55, Ale: «se la palla dovesse passare e arrivare davanti al centroboa sarebbe rigore»): entro
// «distanza» metri dalla porta rigore in ANTICIPO.rigore casi, poi espulsione in ANTICIPO.espulsione casi, altrimenti palla libera.
export const ANTICIPO={ rigore:0.45, espulsione:0.35, distanza:5 };
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
export const FINTA_LATO={ durata:1.1, portiere:0.45, lontano:0.4, vicino:1.15, parataLontano:0.35, parataVicino:0.08, gesto:0.5 };

// ---------- FATICA E CAMBI (fisica.js, panchina.js) ----------
// STANCO = quota della velocità che resta a stamina zero (−18%), CON_PALLA = velocità con la palla (−7%), SPRINT_CONSUMO = fatica
// al secondo in sprint. v0.54: stanchezza −40% → −18%, con la palla −15% → −7%; consumo +6,5% per restare «visibilmente stanchi»
// dopo 7 vasche.
export const STANCO=0.82, CON_PALLA=0.93, SPRINT_CONSUMO=0.0098;
// PANCHINA (v0.32): recupero = stamina recuperata al secondo in panchina; stanco/fresco = soglie del consiglio di cambio;
// controllo = ogni quanti secondi il computer guarda la panchina; pausaComputer = secondi minimi tra due cambi del computer;
// stancoComputer = sotto questa stamina il computer cambia; stancoPozzetto = soglia del cambio dal pozzetto; velBordo, cinque,
// distZona = velocità lungo il bordo, durata del «cinque», distanza dalla zona dei cambi.
export const PANCHINA = { recupero: 0.025, stanco: 0.42, fresco: 0.7, controllo: 2, pausaComputer: 55, stancoComputer: 0.34, stancoPozzetto: 0.8, velBordo: 0.9, cinque: 0.5, distZona: 3.2 };

// ---------- LA REALTÀ A CUI PUNTIAMO (per squadra a partita) ----------
// voce = come la stampa `npm run taratura`; dato = dove sta nel riassunto di tests/bilancio.mjs (--salva); reale = riferimento
// (un numero o un intervallo); banda = intervallo che consideriamo a posto; numeri = i numeri qui sopra che la spostano di più.
// Fonti: Results Report dei Mondiali 2025 (World Aquatics, uomini); Lupo, Condello, Tessitore 2012 (Mondiali 2009); Lupo et al.
// 2012 (Euro League: circa 50 azioni, 37 in parità, 2 controfughe, 11 superiorità); video di Ale della finale olimpica Parigi 2024
// (v0.58-v0.61). Le azioni dei Mondiali 2009 duravano circa 21 s con 30 s di possesso (oggi 28); per le espulsioni dalla lotta al
// centro Ale indica circa il 70%.
// (/*#__PURE__*/: il gioco non la usa, così non finisce nel pacchetto che si scarica sull'iPhone)
export const REALE=/*#__PURE__*/Object.freeze([
  { voce:'tiri', dato:'tiri', reale:33, banda:[29,37], fonte:'Mondiali 2025', numeri:['COSTRUZIONE','TIRO_LIBERATO','PAZIENZA','SUPERIORITA'] },
  { voce:'gol', dato:'gol', reale:13.3, banda:[11,15.5], fonte:'Mondiali 2025', numeri:['PARATA_SUP','TIRO_LIBERATO','COSTRUZIONE'] },
  { voce:'tiri in gol', dato:'conversione', unita:'%', reale:40, banda:[36,44], fonte:'Mondiali 2025', numeri:['COSTRUZIONE','PARATA_SUP','TIRO_LIBERATO'] },
  { voce:'espulsioni', dato:'espulsioni', reale:11, banda:[9.5,12.5], fonte:'Mondiali 2025', numeri:['ESPULSIONI','LOTTA_FASE','CENTRO_SENZA_PALLA','CONTR_AI'] },
  { voce:'espulsioni dalla lotta al centro', dato:'espCentro', unita:'%', reale:66, banda:[60,75], fonte:'Mondiali 2025', numeri:['ESPULSIONI','LOTTA_FASE','CENTRO_SENZA_PALLA'] },
  { voce:'superiorità trasformate', dato:'superioritaTrasformate', unita:'%', reale:52, banda:[45,58], fonte:'Mondiali 2025', numeri:['SUPERIORITA','PARATA_SUP','TIRO_LIBERATO'] },
  { voce:'rigori', dato:'rigori', reale:1.8, banda:[1,2.5], fonte:'Mondiali 2025', numeri:['ANTICIPO','CENTRO_SENZA_PALLA','ESPULSIONI'] },
  { voce:'azioni a partita', dato:'azioniTotali', reale:50, banda:[45,56], fonte:'Euro League', numeri:['COSTRUZIONE','PAZIENZA','LOTTA_FASE'] },
  { voce:'parità: durata dell\'azione', dato:'azioni.parita.durata', unita:'s', reale:21, banda:[18,24], fonte:'Mondiali 2009', numeri:['COSTRUZIONE','PAZIENZA','LOTTA_FASE','CIRCOLAZIONE'] },
  { voce:'parità: gol', dato:'azioni.parita.gol', unita:'%', reale:[6,19], banda:[6,19], fonte:'Mondiali 2009', numeri:['COSTRUZIONE','TIRO_LIBERATO'] },
  { voce:'parità: tiro sbagliato', dato:'azioni.parita.tiro', unita:'%', reale:32, banda:[27,37], fonte:'Mondiali 2009', numeri:['COSTRUZIONE','TIRO_LIBERATO','PAZIENZA'] },
  { voce:'parità: palla persa', dato:'azioni.parita.persa', unita:'%', reale:20, banda:[15,25], fonte:'Mondiali 2009', numeri:['INTERCETTO','ERRORE_PASSAGGIO','PRESA'] },
  { voce:'parità: fallo in attacco', dato:'azioni.parita.falloAttacco', unita:'%', reale:15, banda:[10,20], fonte:'Mondiali 2009', numeri:['CENTRO_SENZA_PALLA','LOTTA_FASE'] },
  { voce:'parità: espulsione procurata', dato:'azioni.parita.espulsione', unita:'%', reale:22, banda:[17,27], fonte:'Mondiali 2009', numeri:['ESPULSIONI','LOTTA_FASE','CENTRO_SENZA_PALLA'] },
  { voce:'palla in mano prima del passaggio', dato:'manoPassaggio', unita:'s', reale:[0.6,1], banda:[0.6,1], fonte:'finale olimpica Parigi 2024 (video di Ale)', numeri:['CIRCOLAZIONE'] },
]);
