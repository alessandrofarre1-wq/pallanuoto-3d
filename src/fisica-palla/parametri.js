// Parametri della fisica della palla, in un posto solo, con unità, fonte, intervallo e tipo.
// Rapporto completo (fonti, modello, piano): docs/fisica-palla.md.
//
// tipo:  'misurato'     = viene da una misura o da una regola ufficiale
//        'derivato'     = calcolato da valori misurati
//        'letteratura'  = valore tipico pubblicato per una sfera, non misurato sulla nostra palla
//        'da calibrare' = nessuna fonte: scelto a occhio o da fissare con prove e video
//
// IN_USO sono i valori che il gioco usa oggi (dal passo 2 la palla in aria usa le misure vere).
// PROPOSTI sono i valori del nuovo modello (passi 3-5): documentati qui, non ancora usati.

export const IN_USO = {
  // ---------- palla ----------
  // passo 2 (13/11/2026): misure vere della palla (prima: raggio 0,12 m, massa 0,43 kg, inerzia di sfera piena)
  raggioUrti:      { valore: 0.1106, unita: 'm',     tipo: 'derivato',     fonte: 'circonferenza 0,68–0,71 m (World Aquatics 20.4.3.3)', intervallo: [0.108, 0.113] },
  massa:           { valore: 0.425,  unita: 'kg',    tipo: 'misurato',     fonte: 'World Aquatics 20.4.3.2: 400–450 g', intervallo: [0.4, 0.45] },
  inerzia:         { valore: 2 / 3,  unita: 'm·a²',  tipo: 'derivato',     fonte: 'palla cava: guscio sottile (spessore non noto); sfera piena = 0,4', intervallo: [0.4, 2 / 3] },
  passoMax:        { valore: 1 / 240, unita: 's',    tipo: 'derivato',     fonte: 'passo massimo del calcolo della palla (prima: uno per fotogramma, 1/60 s)' },
  rimbalzo:        { valore: 0.6,    unita: '-',     tipo: 'da calibrare', fonte: 'nessuna', intervallo: [0.4, 0.7] },
  attrito:         { valore: 0.5,    unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  smorzaRotAria:   { valore: 0.4,    unita: '1/s',   tipo: 'da calibrare', fonte: 'nessuna (smorzamento angolare di Rapier)' },
  // ---------- aria ----------
  // resistenza dell'aria: accelerazione = ρa·Cd·π·a²/(2m) · |v|·v (prima: 0,0245 1/m fisso, cioè Cd ≈ 0,46)
  densitaAria:     { valore: 1.2,    unita: 'kg/m³', tipo: 'derivato',     fonte: 'aria a 20–30 °C', intervallo: [1.15, 1.25] },
  cdAria:          { valore: 0.42,   unita: '-',     tipo: 'derivato',     fonte: 'tesi Patumi: velocità in valore assoluto da 13,3 a 12,2 m/s in 5 m (partenza a 1,2 m, 3,4° in su), palla vera; dati di 3 atlete, rumorosi. 0,47 sfera liscia (de Mestre); tiri vicini al crollo della resistenza (NASA)', intervallo: [0.3, 0.47] },
  // effetto Magnus: CL = cMagnus·S con S = aω/v (Bearman e Harvey, citati da Truscott e Techet 2009); 0,75 = valore della v0.14
  cMagnus:         { valore: 0.75,   unita: '-',     tipo: 'da calibrare', fonte: 'nessuna misura sulla palla da pallanuoto', intervallo: [0.5, 1] },
  giriPassaggio:   { valore: 9,      unita: 'rad/s', tipo: 'da calibrare', fonte: 'nessuna misura' },
  giriTiro:        { valore: 20,     unita: 'rad/s', tipo: 'da calibrare', fonte: 'nessuna misura' },
  giriPalombella:  { valore: 34,     unita: 'rad/s', tipo: 'da calibrare', fonte: 'nessuna misura' },
  // ---------- acqua (passo 3, 13/11/2026): forze sulla parte immersa, de Mestre 2004; via le regole fisse «schizzo»/«tonfo» ----------
  densitaAcqua:    { valore: 997,    unita: 'kg/m³', tipo: 'derivato',     fonte: 'acqua a 25–28 °C (regola: almeno 26 °C)', intervallo: [995, 998] },
  cdAcqua:         { valore: 0.47,   unita: '-',     tipo: 'letteratura',  fonte: 'de Mestre 2004 (con la superficie bagnata 2πah e Cd/4); 0,4 per sfera immersa (Truscott e Techet, Mayme e Mungan)', intervallo: [0.4, 0.5] },
  clSuCdAcqua:     { valore: 2,      unita: '-',     tipo: 'da calibrare', fonte: 'de Mestre 2004, tabella 1: con 2 torna la velocità orizzontale di uscita misurata', intervallo: [1, 2.4] },
  portanzaInUscita:{ valore: 0.2,    unita: '-',     tipo: 'da calibrare', fonte: 'tarato (13/11/2026) sulle misure di de Mestre 2004: caduta 13,2 cm e 1,32 m/s (misura 14 cm, 1,4), obliquo 6,22/1,44 m/s (misura 6,6/1,8)', intervallo: [0.1, 1] },
  massaAggiunta:   { valore: 0,      unita: '-',     tipo: 'da calibrare', fonte: 'tarato su de Mestre 2004 (che non la usa e verifica la profondità in vasca); con 0,5 (Truscott e Techet, sfera immersa) la palla affonderebbe 34 cm', intervallo: [0, 0.5] },
  frenoLineare:    { valore: 0.6,    unita: '1/s',   tipo: 'da calibrare', fonte: 'nessuna: freno per le velocità basse (onde e superficie), tutta immersa; termine lineare come in Mayme e Mungan 2025' },
  attritoRotAcqua: { valore: 20,      unita: '1/s',   tipo: 'da calibrare', fonte: 'passo 4: attrito tra il fondo della palla e l\'acqua (strisciamento), pesato da quanto la palla è immersa; nessuna misura, solo l\'ordine dell\'effetto (Truscott e Techet 2009; Zhang 2022, anteprima)' },
  tempoRotAcqua:   { valore: 0.3,    unita: 's',     tipo: 'letteratura',  fonte: 'Truscott e Techet 2009 (palla da biliardo, S > 0,5)', intervallo: [0.2, 0.4] },
  // ---------- porte e corpi ----------
  raggioPalo:      { valore: 0.04,   unita: 'm',     tipo: 'da calibrare', fonte: 'nessuna' },
  rimbalzoPalo:    { valore: 0.62,   unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  attritoPalo:     { valore: 0.1,    unita: '-',     tipo: 'da calibrare', fonte: 'passo 5: il più basso tra palla e palo (prima 0,4 in media: dall\'interno del palo la palla perdeva quasi tutta la velocità in avanti); palo liscio verniciato, nessuna misura' },
  profRete:        { valore: 0.8,    unita: 'm',     tipo: 'da calibrare', fonte: 'il regolamento chiede almeno 0,30 m' },
  rimbalzoRete:    { valore: 0.02,   unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  vascaX:          { valore: 15,     unita: 'm',     tipo: 'derivato',     fonte: 'mezza lunghezza della vasca disegnata (scena.js, PX)' },
  vascaZ:          { valore: 12.5,   unita: 'm',     tipo: 'derivato',     fonte: 'mezza larghezza della vasca disegnata (scena.js, PZ)' },
  rimbalzoBordo:   { valore: 0.4,    unita: '-',     tipo: 'da calibrare', fonte: 'nessuna: parete della vasca' },
  raggioCorpo:     { valore: 0.2,    unita: 'm',     tipo: 'da calibrare', fonte: 'nessuna' },
  quotaCorpo:      { valore: 0.12,   unita: 'm',     tipo: 'da calibrare', fonte: 'nessuna' },
  rimbalzoCorpo:   { valore: 0.35,   unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  attritoCorpo:    { valore: 0.4,    unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
};

export const PROPOSTI = {
  pressione:    { valore: 55,     unita: 'kPa',    tipo: 'misurato',     fonte: 'World Aquatics 20.4.3.3: 7,5–8,5 psi', intervallo: [52, 59] },
};

// valore semplice di un parametro in uso
export const P = Object.fromEntries(Object.entries(IN_USO).map(([k, v]) => [k, v.valore]));
