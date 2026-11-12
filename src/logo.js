// Logo di WATERPOLO 7 (PROPOSTA, da approvare da Ale): scritta sportiva inclinata, un grande 7 dorato come segno distintivo
// con il pallone giallo e blu appoggiato in cima e un'onda sotto. Tutto in SVG: nitido su ogni schermo, pochi byte, nessun
// carattere da scaricare (usa quello di sistema, SF su iPhone). Le scritte hanno la larghezza fissata (textLength), così il
// disegno resta uguale con qualunque carattere.
let n=0;
// ogni copia del logo ha nomi interni propri (una copia nascosta non deve togliere i colori alle altre)
export const LOGO = () => { const k=++n; return `<svg class="logo" viewBox="0 0 400 168" role="img" aria-label="WATERPOLO 7">
  <defs>
    <linearGradient id="lg-oro${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset=".55" stop-color="#ffc93c"/><stop offset="1" stop-color="#f29b0c"/></linearGradient>
    <linearGradient id="lg-onda${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5cc8ff" stop-opacity="0"/><stop offset=".25" stop-color="#5cc8ff"/><stop offset="1" stop-color="#1d6fe0"/></linearGradient>
  </defs>
  <path d="M8 120c40-22 90-26 150-10s118 18 168-6" fill="none" stroke="url(#lg-onda${k})" stroke-width="9" stroke-linecap="round"/>
  <path d="M30 134c36-12 80-13 128-2" fill="none" stroke="#5cc8ff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>
  <g transform="skewX(-10)">
    <text x="30" y="104" textLength="270" lengthAdjust="spacingAndGlyphs" font-family="system-ui,-apple-system,'SF Pro Display','Segoe UI',Roboto,sans-serif" font-weight="900" font-size="56"
      fill="#ffffff" stroke="#0a2448" stroke-width="7" stroke-linejoin="round" paint-order="stroke">WATERPOLO</text>
    <text x="318" y="130" textLength="66" lengthAdjust="spacingAndGlyphs" font-family="system-ui,-apple-system,'SF Pro Display','Segoe UI',Roboto,sans-serif" font-weight="900" font-size="132"
      fill="url(#lg-oro${k})" stroke="#0a2448" stroke-width="8" stroke-linejoin="round" paint-order="stroke">7</text>
  </g>
  <g transform="translate(345 26)">
    <circle r="17" fill="#ffd23f" stroke="#0a2448" stroke-width="3.5"/>
    <path d="M-15 -7c10 5 20 5 30 0M-15 7c10-5 20-5 30 0" stroke="#1d4fd6" stroke-width="5" fill="none"/>
    <circle r="17" fill="none" stroke="#0a2448" stroke-width="3.5"/>
  </g>
  <text x="200" y="160" text-anchor="middle" textLength="186" lengthAdjust="spacingAndGlyphs" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="13" letter-spacing="5" fill="#cfe6ff">THE GAME OF SEVEN</text>
  <path d="M62 156h34M304 156h34" stroke="#ffc93c" stroke-width="2.5" stroke-linecap="round"/>
</svg>`; };
