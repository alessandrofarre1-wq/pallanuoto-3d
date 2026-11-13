// Bandiere delle 16 nazionali, disegnate in modo semplificato (solo forme e colori: niente stemmi né loghi), in SVG.
// Servono al menu e al tabellone; pesano pochi byte e non si scarica nessuna immagine.
const R = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const strisceO = (...c) => c.map((col, i) => R(0, i * 40 / c.length, 60, 40 / c.length + 0.3, col)).join('');
const strisceV = (...c) => c.map((col, i) => R(i * 60 / c.length, 0, 60 / c.length + 0.3, 40, col)).join('');
const stella = (cx, cy, r, c) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(2) + ' ' + (cy + rr * Math.sin(a)).toFixed(2); } return `<path d="${d}Z" fill="${c}"/>`; };
const DISEGNI = {
  ESP: () => R(0, 0, 60, 40, '#C60B1E') + R(0, 10, 60, 20, '#FFC400'),
  HUN: () => strisceO('#CE2939', '#FFFFFF', '#477050'),
  GRE: () => Array.from({ length: 9 }, (_, i) => R(0, i * 40 / 9, 60, 40 / 9 + 0.3, i % 2 ? '#FFFFFF' : '#0D5EAF')).join('') + R(0, 0, 22.2, 22.2, '#0D5EAF') + R(8.9, 0, 4.4, 22.2, '#FFFFFF') + R(0, 8.9, 22.2, 4.4, '#FFFFFF'),
  SRB: () => strisceO('#C6363C', '#0C4076', '#FFFFFF'),
  CRO: () => strisceO('#FF0000', '#FFFFFF', '#171796') + [0, 1, 2, 3].map(i => R(24 + (i % 2) * 6, 10 + Math.floor(i / 2) * 6, 6, 6, '#FF0000')).join('') + `<rect x="24" y="10" width="12" height="12" fill="none" stroke="#FF0000" stroke-width="1"/>`,
  MNE: () => R(0, 0, 60, 40, '#D4AF37') + R(2.5, 2.5, 55, 35, '#C40308'),
  ITA: () => strisceV('#009246', '#FFFFFF', '#CE2B37'),
  USA: () => Array.from({ length: 13 }, (_, i) => R(0, i * 40 / 13, 60, 40 / 13 + 0.3, i % 2 ? '#FFFFFF' : '#B22234')).join('') + R(0, 0, 26, 21.5, '#3C3B6E') + Array.from({ length: 12 }, (_, i) => `<circle cx="${3.5 + (i % 4) * 6.3}" cy="${4 + Math.floor(i / 4) * 6.5}" r="1.1" fill="#FFFFFF"/>`).join(''),
  JPN: () => R(0, 0, 60, 40, '#FFFFFF') + '<circle cx="30" cy="20" r="11.5" fill="#BC002D"/>',
  ROU: () => strisceV('#002B7F', '#FCD116', '#CE1126'),
  CAN: () => R(0, 0, 60, 40, '#FFFFFF') + R(0, 0, 15, 40, '#D80621') + R(45, 0, 15, 40, '#D80621') + '<path d="M30 9l2.4 4.6 3.6-1.4-1.2 6.4 4-3 .6 2.4 3.2-.6-1.6 4.4 1.6 1-6.8 5.2.8 2.8-5.6-1.2V34h-2v-4.4l-5.6 1.2.8-2.8-6.8-5.2 1.6-1-1.6-4.4 3.2.6.6-2.4 4 3-1.2-6.4 3.6 1.4z" fill="#D80621"/>',
  BRA: () => R(0, 0, 60, 40, '#009C3B') + '<path d="M30 5L54 20 30 35 6 20z" fill="#FFDF00"/><circle cx="30" cy="20" r="8.5" fill="#002776"/><path d="M22 18.5c5-1.6 11-1.2 16 1.6" stroke="#FFFFFF" stroke-width="1.4" fill="none"/>',
  AUS: () => R(0, 0, 60, 40, '#012169') + '<path d="M0 0L30 20M30 0L0 20" stroke="#FFFFFF" stroke-width="4"/><path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" stroke-width="1.6"/>' + R(12, 0, 6, 20, '#FFFFFF') + R(0, 7, 30, 6, '#FFFFFF') + R(13.2, 0, 3.6, 20, '#C8102E') + R(0, 8.2, 30, 3.6, '#C8102E') + stella(15, 30, 4.2, '#FFFFFF') + stella(45, 9, 2.4, '#FFFFFF') + stella(51, 17, 2.4, '#FFFFFF') + stella(45, 32, 2.4, '#FFFFFF') + stella(39, 19, 2.2, '#FFFFFF'),
  CHN: () => R(0, 0, 60, 40, '#EE1C25') + stella(11, 11, 6, '#FFFF00') + stella(21, 4.5, 1.9, '#FFFF00') + stella(25, 9, 1.9, '#FFFF00') + stella(25, 15, 1.9, '#FFFF00') + stella(21, 19, 1.9, '#FFFF00'),
  SGP: () => R(0, 0, 60, 40, '#FFFFFF') + R(0, 0, 60, 20, '#EF3340') + '<circle cx="12" cy="10" r="6" fill="#FFFFFF"/><circle cx="14.2" cy="10" r="5.6" fill="#EF3340"/>' + [[19, 6], [22.5, 8.6], [21.2, 12.6], [16.8, 12.6], [15.5, 8.6]].map(([x, y]) => stella(x, y, 1.3, '#FFFFFF')).join(''),
  RSA: () => R(0, 0, 60, 40, '#FFFFFF') + R(0, 0, 60, 13.3, '#E03C31') + R(0, 26.7, 60, 13.3, '#001489') + '<path d="M0 0L24 20 0 40" fill="#FFB81C"/><path d="M0 4.5L19 20 0 35.5" fill="#000000"/><path d="M13 13.3L24 20 13 26.7H60V13.3z" fill="#007749"/><path d="M0 -2L26 20 0 42" fill="none" stroke="#FFFFFF" stroke-width="0" />'
};
// bandiera come SVG pronto da inserire nella pagina (rapporto 3:2, angoli arrotondati, bordo sottile per i colori chiari)
let conta = 0;
export function bandiera(codice, cls = 'band') {
  const d = DISEGNI[codice]; if (!d) return `<span class="${cls}"></span>`;
  const id = `cb-${codice}-${++conta}`;      // nome interno unico per ogni bandiera disegnata
  return `<svg class="${cls}" viewBox="0 0 60 40" role="img" aria-label="${codice}"><clipPath id="${id}"><rect width="60" height="40" rx="5"/></clipPath><g clip-path="url(#${id})">${d()}</g><rect width="60" height="40" rx="5" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/></svg>`;
}
