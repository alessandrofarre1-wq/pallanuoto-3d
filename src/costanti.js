// Costanti di gioco, impostazioni scelte dal menu e piccole funzioni matematiche
// ================= COSTANTI =================
export const G = 9.8;          // gravità
export const HL = 12.5;        // metà lunghezza campo: 25 m tra le linee di porta (art. 1.2)
export const HW = 10;          // metà larghezza campo (20 m)
export const GW = 1.5;         // metà larghezza porta (3 m)
export const GH = 0.9;         // altezza traversa sull'acqua
export const VIS = 1.45;        // scala visiva dei giocatori
export const BRV = 0.15;       // raggio visivo della palla
export const SHOT_CLOCK = 28, SHOT_RESET = 18, EXCL_TIME = 18;  // artt. 4.1.1, 8.12, 9.3
export const ROLES = ['Portiere','Centroboa','Ala destra','Ala sinistra','Mezzo destro','Mezzo sinistro','Punto'];
// posizioni d'attacco: [distanza dalla porta avversaria, spostamento laterale (+ = destra)]
// arco (semicerchio 3-3) con il centroboa al centro, sui 2 metri
// le ali stanno dentro i 2 metri ma fuori dall'area di porta (che arriva a 2 m oltre i pali): lì possono ricevere e tirare
export const FORM = [null,[2.6,0],[1.7,6.2],[1.7,-6.2],[5.8,4.6],[5.8,-4.6],[7.5,0]];
// Uomo in più: 4-2. Quattro sulla linea dei 2 metri (due esterni larghi, due vicino ai pali, uno per palo: centroboa e punto,
// appena fuori dall'area di porta) e due fuori, a 5 metri (i mezzi).
export const FORM_UP = [null,[2.1,1.75],[2.0,5.4],[2.0,-5.4],[5.2,2.5],[5.2,-2.5],[2.1,-1.75]];
// Uomo in meno, posizione di partenza: [distanza dalla propria porta, spostamento laterale]. Tre sulla linea dei 2 metri, ciascuno
// in mezzo tra due dei quattro attaccanti; due davanti ai pali, a metà tra gli attaccanti ai 2 metri e quelli a 5.
export const DEF_DOWN = [[1.8,0],[3.6,1.6],[3.6,-1.6],[1.9,3.55],[1.9,-3.55]];
export const ATK = ['Arco','Entrata','Incrocio','Palla al boa'], DEFN = ['A uomo','Zona','Pressing','Zona a M'];
// marcature a uomo per zona di campo: ogni difensore prende l'attaccante che gioca dal suo lato;
// il punto marca il centroboa (e viceversa)
export const MARK = [0,6,3,2,5,4,1];
export const KICK_Z = [0,2.5,7.5,-7.5,5,-5,-2.5];   // corsia di ogni ruolo allo sprint iniziale
export let PERIOD_LEN = 180, DIFF_I = 1;
// Ritmo unico, misurato in tempo reale (decisione di Ale, 14/11/2026).
export const SPEED=1;
export const DIFF = () => [0.7,1,1.3][DIFF_I];
export const DIFF_GK = () => [0.8,1,1.12][DIFF_I];

// il caso del gioco; la verifica automatica può sostituirlo con uno ripetibile (window.__rnd)
export const rnd = window.__rnd || Math.random;
// caso SOLO per la grafica (schiuma, spruzzi, pubblico): separato da quello del gioco, così cambiare un effetto non cambia mai
// le partite. Seme fisso (sempre gli stessi disegni); i test possono sostituirlo con window.__rndGrafica.
export const rndGrafica = window.__rndGrafica || (()=>{ let a=0x5EED7; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; })();
export const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
export const dist = (a,b) => Math.hypot(a.x-b.x, a.z-b.z);
export function gauss(){ let u=0,v=0; while(!u)u=rnd(); while(!v)v=rnd(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
export function setPeriodLen(v){ PERIOD_LEN=v; }
export function setDiff(v){ DIFF_I=v; }
// Severità dell'arbitro, scelta a inizio partita: sposta il confine tra contatto lecito, fallo ed espulsione, soprattutto ai 2 metri.
// 0,65 = permissivo (lascia giocare), 1 = normale, 1,4 = fiscale
export let ARBITRO=1;
export function setArbitro(v){ ARBITRO=v; }
// Tempo per passare dal nuoto alla posizione verticale (secondi); per distendersi ci vuole un decimo in più. Scelto da Ale: 0,25.
export const ALZATA=0.25;
