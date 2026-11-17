// Disegno dall'alto delle due aperture (v0.54) dai dati di sonda-aperture.mjs --json=...
// Uso: node strumenti/disegna-aperture.mjs dati.json uscita.png
import { chromium } from 'playwright';
import fs from 'node:fs';
const [dati,uscita]=process.argv.slice(2), R=JSON.parse(fs.readFileSync(dati,'utf8'));
const scelte=[R.find(r=>r.schema==='base'&&r.ricevente===3)||R[0], R.find(r=>r.schema==='apertura2'&&r.ricevente===2)||R[3]];
const S=26, W=25*S+40, H=17*S+70, X=d=>20+(25-d)*S, Y=z=>50+(8.5+z)*S;
const col={1:'#e6553a',2:'#f0a020',3:'#2a9d4b',4:'#3a7de6',5:'#9b4de0',6:'#d23c8c',0:'#c00'};
const pannello=r=>{
  const f=r.fotogrammi, ult=f[f.length-1];
  let g=`<rect x="20" y="50" width="${25*S}" height="${17*S}" fill="#5fb7d4" rx="4"/>`;
  for(const d of [2,5,6]){ g+=`<line x1="${X(d)}" y1="50" x2="${X(d)}" y2="${50+17*S}" stroke="${d===2?'#d33':d===5?'#ff0':'#fff'}" stroke-width="2" stroke-dasharray="${d===6?'6 4':''}"/>`; g+=`<line x1="${X(25-d)}" y1="50" x2="${X(25-d)}" y2="${50+17*S}" stroke="${d===2?'#d33':d===5?'#ff0':'#fff'}" stroke-width="1.2" opacity=".5"/>`; }
  g+=`<line x1="${X(12.5)}" y1="50" x2="${X(12.5)}" y2="${50+17*S}" stroke="#fff" stroke-width="1.5" opacity=".7"/>`;
  g+=`<rect x="${X(0)-4}" y="${Y(-1.5)}" width="8" height="${3*S}" fill="#fff"/><rect x="${X(25)-4}" y="${Y(-1.5)}" width="8" height="${3*S}" fill="#fff"/>`;
  for(const q of ult.hu) g+=`<circle cx="${X(q[0])}" cy="${Y(q[1])}" r="7" fill="#fff" stroke="#333" stroke-width="1.5"/>`;
  g+=`<polyline points="${f.map(k=>X(k.b[0])+','+Y(k.b[1])).join(' ')}" fill="none" stroke="#ffd400" stroke-width="3" stroke-dasharray="7 5"/>`;
  for(let i=0;i<7;i++){ const n=ult.it[i][0], pts=f.map(k=>X(k.it[i][1])+','+Y(k.it[i][2])).join(' ');
    g+=`<polyline points="${pts}" fill="none" stroke="${col[n]}" stroke-width="3" opacity=".9"/>`;
    const a=f[0].it[i], b=ult.it[i];
    g+=`<circle cx="${X(a[1])}" cy="${Y(a[2])}" r="5" fill="${col[n]}" opacity=".6"/>`;
    g+=`<circle cx="${X(b[1])}" cy="${Y(b[2])}" r="12" fill="${col[n]}" stroke="#123" stroke-width="2"/><text x="${X(b[1])}" y="${Y(b[2])+5}" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">${n||'P'}</text>`; }
  const tit=r.schema==='base'?'Prima linea ai 2 metri: 1, 6, 5 avanti; 3 riceve dal portiere, 2 e 4 appoggio':'Apertura del 2: il 2 riceve a metà campo, 1 lo supera, 6 al centro, 4 e 5 in posizione, ultimi 3 e 2';
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0b1d2b"/>
  <text x="20" y="22" fill="#fff" font-size="16" font-weight="700">${tit}</text>
  <text x="20" y="42" fill="#cde" font-size="12">Primo passaggio del portiere al ${r.ricevente} dopo ${r.tRic} s · 7 s di gioco · si attacca verso destra · bianchi = Ungheria a fine sequenza · giallo = palla</text>${g}</svg>`;
};
const html=`<body style="margin:0;background:#0b1d2b">${scelte.map(pannello).join('<br>')}</body>`;
const b=await chromium.launch(), p=await b.newPage({viewport:{width:W,height:H*2+10},deviceScaleFactor:2});
await p.setContent(html); await p.screenshot({path:uscita,fullPage:true}); await b.close();
console.log('scritto',uscita);
