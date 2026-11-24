// FINTE PERSONALI (v0.55, idea di Ale: «la finta è il gesto distintivo di un giocatore; riconoscevo i miei compagni dalla finta
// e dalla padronanza del polso»). Ogni giocatore ha una finta sua, sempre la stessa, scelta dai suoi dati: niente caso del gioco
// (si ricava dal nome e dalle statistiche), quindi resta uguale da una partita all'altra e nei cambi.
// - alza: quanto si alza il busto in finta (m, solo disegno); wind: durata del gesto di finta (s); vista: dove va la mano in finta (solo disegno, sistema del giocatore, come CARICA_VISTA);
//   torsione: quanto ruota il busto (negativo = da destra verso sinistra); pausa: attesa tra una finta e la mossa dopo (computer);
//   max: quante finte di fila fa il computer; seguito: come la chiude di solito; scarico: quanto spesso il computer scarica dopo.
// - largo, piegato (v0.85, Ale: «finte larghe o strette, braccio piegato o dritto»; solo disegno, grafica/pose.js FINTA_FORMA): la
//   tendenza dello stile, poi ogni finta cambia un po'. largo 0 = stretta, 1 = larga; piegato = quante finte su cento a braccio
//   piegato (si muove l'avambraccio, la mano resta vicino alla testa) invece che a braccio dritto verso la porta.
// FIRMA (scelta di Ale: «piccolo vantaggio»): chiudere la finta con il suo seguito entro FIRMA.entro secondi spiazza un po' di più
// portiere e difensori (sorpresa del tiro, oppure passaggio più difficile da intercettare). Numeri FIRMA e FINTA_LATO in taratura.js.
import { game } from './stato.js';
import { FINTA_AMPIEZZA, FINTA_LATO, FINTA_RITMO, FIRMA } from './taratura.js';      // numeri del bilanciamento
export { FINTA_AMPIEZZA, FINTA_LATO, FINTA_RITMO, FIRMA };
export const FINTE=Object.freeze({
  larga:  { alza:0.03, nome:'larga',      wind:0.20, largo:0.85, piegato:0.1, vista:[-0.50,0.50,0.22], torsione:1.25, pausa:[0.5,0.8],  max:2, seguito:'shot',  scarico:0.3,
            descr:'lenta e larga, braccio teso, poi tiro forte' },
  raffica:{ alza:0, nome:'a raffica',  wind:0.04, largo:0.2, piegato:0.5, vista:[-0.08,0.40,0.10], torsione:0.40, pausa:[0.12,0.25], max:3, seguito:'polso', scarico:0.3,
            descr:'strette e frequenti, poi tiro di polso secco' },
  polso:  { alza:0.01, nome:'di polso',   wind:0.09, largo:0.4, piegato:0.75, vista:[-0.16,0.38,-0.08], torsione:-0.9, pausa:[0.25,0.45], max:2, seguito:'polso', scarico:0.25,
            descr:'da destra a sinistra, poi il polso la manda dall’altra parte' },
  mezza:  { alza:0.11, nome:'mezza finta',wind:0.05, largo:0.35, piegato:0.4, vista:[-0.06,0.46,0.06], torsione:0.45, pausa:[0.08,0.18], max:1, seguito:'shot',  scarico:0.2,
            descr:'si alza, accenno breve e sparo immediato' },
  bomba:  { alza:0.06, nome:'di bomba',   wind:0.17, largo:0.75, piegato:0.15, vista:[-0.42,0.34,0.14], torsione:1.35, pausa:[0.35,0.6], max:2, seguito:'lob',   scarico:0.25,
            descr:'carica da tiro potente, poi palombella' },
  spalla: { alza:0, nome:'di spalla',  wind:0.06, largo:0.25, piegato:0.85, vista:[0.02,0.40,0.12], torsione:0.75, pausa:[0.2,0.4],  max:2, seguito:'pass',  scarico:0.75,
            descr:'solo spalla e testa, poi scarico al compagno' },
});
const v01=(s,k)=>Math.max(0,((s?.[k]??60)-40)/59);
const hash=str=>{ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return ((h>>>0)%100000)/100000; };
// pesi dalle statistiche: chi ha Potenza fa più spesso la larga o la bomba, chi ha Precisione il polso, chi è veloce la raffica,
// chi ha Passaggio e Visione la finta di spalla; poi un numero fisso ricavato dal nome sceglie tra i pesi
export function stileFinta(g){
  if(!g) return 'larga';
  if(g.finta) return g.finta;
  const s=g.s, pot=v01(s,'pot'), pre=v01(s,'pre'), vel=v01(s,'vel'), pas=(v01(s,'pas')+v01(s,'vis'))/2;
  const pesi={ larga:0.15+pot*pot, bomba:0.12+0.8*pot*pas, polso:0.15+pre*pre, raffica:0.12+vel*vel, mezza:0.12+0.7*pot*pre, spalla:0.12+pas*pas };
  const tot=Object.values(pesi).reduce((a,b)=>a+b,0); let r=hash(String(g.id??'')+'|'+(g.nome||'')+'|'+(g.num||''))*tot;
  for(const [k,w] of Object.entries(pesi)){ if((r-=w)<=0) return (g.finta=k); }
  return (g.finta='larga');
}
export const fintaDi=p=>FINTE[stileFinta(p?.scheda)]||FINTE.larga;
// chiusura della finta: il seguito tipico entro FIRMA.entro secondi
export function firma(p,seguito){ return game.time-(p.ultimaFintaT??-9)<FIRMA.entro && fintaDi(p).seguito===seguito; }

// FINTA DI LATO (v0.59, dal video di Dénes Varga: la seconda finta va verso un palo e poi il tiro sul lato opposto; Ale: «sposta sia
// il difensore che il portiere»). La prima finta resta dritta; dalla seconda la finta ha un lato (segno della z del mondo, cioè un
// palo). Chi abbocca non resta fermo: sposta il braccio da quella parte (muro × lontano sul lato opposto, × vicino sullo stesso) e
// il portiere si sposta davvero verso quel palo di «portiere» metri; per «durata» secondi para meno sul lato opposto (parataLontano)
// e un po' di più sullo stesso (parataVicino). Il giocatore sceglie il lato con la levetta; senza levetta (e per il computer) i lati
// si alternano, il primo a caso. Numeri FINTA_LATO in taratura.js.
export const fintaLatoAttiva=q=>q?.fintaLato&&game.time<q.fintaLato.fino?q.fintaLato.lato:0;
