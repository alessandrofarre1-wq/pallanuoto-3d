// Serie finale separata dal punteggio dei quattro tempi. Stato composto solo da dati JSON.
// World Aquatics, appendice 3: cinque tiri alternati, chiusura anticipata e poi oltranza.
export function creaSerieRigori(tiratori, prima = 0) {
  if (!Array.isArray(tiratori) || tiratori.length !== 2 || tiratori.some(s => !Array.isArray(s) || !s.length))
    throw new Error('Occorre almeno un tiratore eleggibile per squadra');
  return {
    gol: [0, 0], battuti: [0, 0], tiratori: tiratori.map(s => s.slice(0, 5).map(p => ({ num: p.num, nome: p.nome || p.name || '' }))),
    tentativi: [], primo: prima === 1 ? 1 : 0, turno: prima === 1 ? 1 : 0,
    vincitore: null, terminati: false, fase: 'attesa', attesa: 2, tempoTiro: 0, tiro: null,
  };
}

export function preparaRigoreFinale(serie) {
  if (serie.terminati || serie.fase !== 'attesa') return null;
  const squadra = serie.turno, indice = serie.battuti[squadra];
  const p = serie.tiratori[squadra][indice % serie.tiratori[squadra].length];
  serie.tiro = { squadra, indice: indice + 1, num: p.num, nome: p.nome };
  serie.fase = 'tiro'; serie.tempoTiro = 0;
  return serie.tiro;
}

export function registraRigoreFinale(serie, gol, esito = gol ? 'gol' : 'fuori') {
  if (serie.terminati || serie.fase !== 'tiro' || !serie.tiro) return false;
  const squadra = serie.tiro.squadra;
  serie.tentativi.push({ ...serie.tiro, gol: !!gol, esito });
  serie.battuti[squadra]++; if (gol) serie.gol[squadra]++;
  const [a, b] = serie.battuti, [ga, gb] = serie.gol;
  if (a <= 5 && b <= 5) {
    if (ga > gb + 5 - b) serie.vincitore = 0;
    else if (gb > ga + 5 - a) serie.vincitore = 1;
  }
  if (a >= 5 && b >= 5 && a === b && ga !== gb) serie.vincitore = ga > gb ? 0 : 1;
  serie.terminati = serie.vincitore !== null;
  serie.turno = 1 - squadra; serie.fase = 'attesa'; serie.attesa = 1.8; serie.tiro = null;
  return true;
}
