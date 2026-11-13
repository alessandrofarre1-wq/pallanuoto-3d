// Parametri della fisica della palla, in un posto solo, con unità, fonte, intervallo e tipo.
// Rapporto completo (fonti, modello, piano): docs/fisica-palla.md.
//
// tipo:  'misurato'     = viene da una misura o da una regola ufficiale
//        'derivato'     = calcolato da valori misurati
//        'letteratura'  = valore tipico pubblicato per una sfera, non misurato sulla nostra palla
//        'da calibrare' = nessuna fonte: scelto a occhio o da fissare con prove e video
//
// IN_USO sono i valori che il gioco usa OGGI (passo 1 del piano: nessun cambiamento di gioco).
// PROPOSTI sono i valori del nuovo modello (passi 2-5): documentati qui, non ancora usati.

export const IN_USO = {
  // ---------- palla ----------
  raggioUrti:      { valore: 0.12,   unita: 'm',     tipo: 'da calibrare', fonte: 'scelto nella v0.14; il regolamento dà 0,108–0,113 m', intervallo: [0.108, 0.113] },
  massa:           { valore: 0.43,   unita: 'kg',    tipo: 'misurato',     fonte: 'World Aquatics 20.4.3.2: 400–450 g', intervallo: [0.4, 0.45] },
  rimbalzo:        { valore: 0.6,    unita: '-',     tipo: 'da calibrare', fonte: 'nessuna', intervallo: [0.4, 0.7] },
  attrito:         { valore: 0.5,    unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  smorzaRotAria:   { valore: 0.4,    unita: '1/s',   tipo: 'da calibrare', fonte: 'nessuna (smorzamento angolare di Rapier)' },
  // ---------- aria ----------
  // ARIA = ρa·Cd·π·a² / (2m): con ρa 1,2 kg/m³, a 0,1106 m, m 0,425 kg corrisponde a Cd ≈ 0,46
  aria:            { valore: 0.0245, unita: '1/m',   tipo: 'da calibrare', fonte: 'tarato sulla tesi Patumi (13,3 → 12,2 m/s in 5 m), che però darebbe circa 0,017 (Cd ≈ 0,32)' },
  // EFFETTO·(ω×v) = accelerazione di Magnus; corrisponde a CL ≈ 0,76·S con S = aω/v
  effetto:         { valore: 0.0045, unita: 'm',     tipo: 'da calibrare', fonte: 'CL proporzionale a S (Bearman e Harvey, citati da Truscott e Techet 2009)' },
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
  attritoPalo:     { valore: 0.3,    unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  profRete:        { valore: 0.8,    unita: 'm',     tipo: 'da calibrare', fonte: 'il regolamento chiede almeno 0,30 m' },
  rimbalzoRete:    { valore: 0.02,   unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  raggioCorpo:     { valore: 0.2,    unita: 'm',     tipo: 'da calibrare', fonte: 'nessuna' },
  quotaCorpo:      { valore: 0.12,   unita: 'm',     tipo: 'da calibrare', fonte: 'nessuna' },
  rimbalzoCorpo:   { valore: 0.35,   unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
  attritoCorpo:    { valore: 0.4,    unita: '-',     tipo: 'da calibrare', fonte: 'nessuna' },
};

export const PROPOSTI = {
  massa:        { valore: 0.425,  unita: 'kg',     tipo: 'misurato',     fonte: 'World Aquatics 20.4.3.2', intervallo: [0.4, 0.45] },
  raggio:       { valore: 0.1106, unita: 'm',      tipo: 'derivato',     fonte: 'circonferenza 0,68–0,71 m (World Aquatics 20.4.3.3)', intervallo: [0.108, 0.113] },
  inerzia:      { valore: 2 / 3,  unita: 'm·a²',   tipo: 'derivato',     fonte: 'palla cava: guscio sottile (spessore non noto)', intervallo: [0.4, 2 / 3] },
  pressione:    { valore: 55,     unita: 'kPa',    tipo: 'misurato',     fonte: 'World Aquatics 20.4.3.3: 7,5–8,5 psi', intervallo: [52, 59] },
  densitaAria:  { valore: 1.2,    unita: 'kg/m³',  tipo: 'derivato',     fonte: 'aria a 20–30 °C', intervallo: [1.15, 1.25] },
  densitaAcqua: { valore: 997,    unita: 'kg/m³',  tipo: 'derivato',     fonte: 'acqua a 25–28 °C (regola: almeno 26 °C)', intervallo: [995, 998] },
  cdAria:       { valore: 0.4,    unita: '-',      tipo: 'da calibrare', fonte: '0,47 (de Mestre); circa 0,32 dalla tesi Patumi; tiri vicini al crollo della resistenza (NASA)', intervallo: [0.3, 0.47] },
  cMagnus:      { valore: 0.75,   unita: '-',      tipo: 'da calibrare', fonte: 'CL = c·S (Bearman e Harvey, citati da Truscott e Techet)', intervallo: [0.5, 1] },
  cdAcqua:      { valore: 0.47,   unita: '-',      tipo: 'letteratura',  fonte: 'de Mestre 2004; 0,4 per sfera immersa (Truscott e Techet, Mayme e Mungan)', intervallo: [0.4, 0.5] },
  clSuCdAcqua:  { valore: 2,      unita: '-',      tipo: 'da calibrare', fonte: 'de Mestre 2004, tabella 1', intervallo: [1, 2.4] },
  // forma alternativa della spinta dell'acqua da confrontare in calibrazione: F = ½ ρw |U|² Sw sin(α + β) (Rosellini; Belden 2016; Hurd 2019)
  massaAggiunta:{ valore: 0.5,    unita: '-',      tipo: 'da calibrare', fonte: 'Truscott e Techet 2009', intervallo: [0.2, 0.5] },
  tempoRotAcqua:{ valore: 0.3,    unita: 's',      tipo: 'letteratura',  fonte: 'Truscott e Techet 2009 (palla da biliardo, S > 0,5)', intervallo: [0.2, 0.4] },
  passo:        { valore: 1 / 240, unita: 's',     tipo: 'derivato',     fonte: 'stabilità del calcolo all\'impatto' },
};

// valore semplice di un parametro in uso
export const P = Object.fromEntries(Object.entries(IN_USO).map(([k, v]) => [k, v.valore]));
