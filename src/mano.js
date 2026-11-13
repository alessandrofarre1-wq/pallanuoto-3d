// Icona della mano per i mancini (sezione 4): una mano sinistra aperta con la «S», nella rosa e nel pannello del giocatore.
// Disegno semplice in SVG, colore del testo intorno (currentColor).
export const ICONA_MANCINO = '<svg class="manc" viewBox="0 0 24 24" width="1em" height="1em" aria-label="mancino" role="img">'
  + '<title>Mancino</title><path fill="currentColor" d="M15.5 21H10c-1.7 0-3.2-1-3.9-2.6L3.4 12c-.3-.8.4-1.6 1.2-1.3.5.2.9.6 1.1 1.1L7 14V5.5a1.25 1.25 0 0 1 2.5 0V11h.5V3.75a1.25 1.25 0 0 1 2.5 0V11h.5V4.75a1.25 1.25 0 0 1 2.5 0V11h.5V7.25a1.25 1.25 0 0 1 2.5 0V16c0 2.8-2.2 5-4.5 5z" transform="matrix(-1 0 0 1 24 0)"/>'
  + '<text x="12" y="18.2" text-anchor="middle" font-size="7" font-weight="900" fill="#0b1e3a" font-family="system-ui,sans-serif">S</text></svg>';
export const iconaMano = mano => mano === 'S' ? ICONA_MANCINO : '';
