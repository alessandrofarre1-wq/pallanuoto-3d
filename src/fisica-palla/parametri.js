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
  // ---------- acqua (regole fisse di oggi, da sostituire nel passo 3) ----------
  quotaAcqua:      { valore: 0.15,   unita: 'm',     tipo: 'da calibrare', fonte: 'BRV: sotto questa quota del centro la palla è «in acqua»' },
  quotaGalleggia:  { valore: 0.05,   unita: 'm',     tipo: 'da calibrare', fonte: 'de Mestre 2004 dà 0,074 m (3,7 cm sott\'acqua con a = 0,11 m)' },
  spintaMax:       { valore: 2.5,    unita: 'g',     tipo: 'da calibrare', fonte: 'nessuna: limite della molla che fa galleggiare' },
  frenoOrizz:      { valore: 1.6,    unita: '1/s',   tipo: 'da calibrare', fonte: 'nessuna' },
  frenoVert:       { valore: 7,      unita: '1/s',   tipo: 'da calibrare', fonte: 'nessuna' },
  frenoRot:        { valore: 3,      unita: '1/s',   tipo: 'da calibrare', fonte: 'Truscott e Techet 2009: la rotazione si spegne in circa 0,3 s sott\'acqua (palla da biliardo)' },
  schizzoVelMin:   { valore: 8.5,    unita: 'm/s',   tipo: 'da calibrare', fonte: 'nessuna' },
  schizzoAngMax:   { valore: 21,     unita: '°',     tipo: 'da calibrare', fonte: 'nessuna; de Mestre misura un rimbalzo a 30°; θc = 18°/√SG (Johnson e Reid 1975, Hurd 2019, Lyu 2021) darebbe circa 66° per SG 0,075, fuori dal campo verificato' },
  schizzoVert:     { valore: 0.55,   unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  schizzoOrizz:    { valore: 0.84,   unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  schizzoRot:      { valore: 0.5,    unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  tonfoOrizz:      { valore: 0.45,   unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  tonfoVert:       { valore: 0.35,   unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  // ---------- porte e corpi ----------
  raggioPalo:      { valore: 0.04,   unita: 'm',     tipo: 'da calibrare', fonte: 'nessuna' },
  rimbalzoPalo:    { valore: 0.62,   unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  attritoPalo:     { valore: 0.3,    unita: '-',     tipo: 'da calibrare', fonte: 'nessuna; con l\'attrito della palla (0,5) all\'interno del palo la palla perde quasi tutta la velocità in avanti (da tarare, passo 5)' },
  profRete:        { valore: 0.8,    unita: 'm',     tipo: 'da calibrare', fonte: 'il regolamento chiede almeno 0,30 m' },
  rimbalzoRete:    { valore: 0.02,   unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  raggioCorpo:     { valore: 0.2,    unita: 'm',     tipo: 'da calibrare', fonte: 'nessuna' },
  quotaCorpo:      { valore: 0.12,   unita: 'm',     tipo: 'da calibrare', fonte: 'nessuna' },
  rimbalzoCorpo:   { valore: 0.35,   unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  attritoCorpo:    { valore: 0.4,    unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
};

export const PROPOSTI = {
  pressione:    { valore: 55,     unita: 'kPa',    tipo: 'misurato',     fonte: 'World Aquatics 20.4.3.3: 7,5–8,5 psi', intervallo: [52, 59] },
  densitaAcqua: { valore: 997,    unita: 'kg/m³',  tipo: 'derivato',     fonte: 'acqua a 25–28 °C (regola: almeno 26 °C)', intervallo: [995, 998] },
  cdAcqua:      { valore: 0.47,   unita: '-',      tipo: 'letteratura',  fonte: 'de Mestre 2004; 0,4 per sfera immersa (Truscott e Techet, Mayme e Mungan)', intervallo: [0.4, 0.5] },
  clSuCdAcqua:  { valore: 2,      unita: '-',      tipo: 'da calibrare', fonte: 'de Mestre 2004, tabella 1', intervallo: [1, 2.4] },
  // forma alternativa della spinta dell'acqua da confrontare in calibrazione: F = ½ ρw |U|² Sw sin(α + β) (Rosellini; Belden 2016; Hurd 2019)
  massaAggiunta:{ valore: 0.5,    unita: '-',      tipo: 'da calibrare', fonte: 'Truscott e Techet 2009', intervallo: [0.2, 0.5] },
  tempoRotAcqua:{ valore: 0.3,    unita: 's',      tipo: 'letteratura',  fonte: 'Truscott e Techet 2009 (palla da biliardo, S > 0,5)', intervallo: [0.2, 0.4] },
};

// valore semplice di un parametro in uso
export const P = Object.fromEntries(Object.entries(IN_USO).map(([k, v]) => [k, v.valore]));
