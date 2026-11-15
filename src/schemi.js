// Strategie dell'allenatore: dati condivisi da editor e IA, senza dipendenze dalla scena.
import { FORM, FORM_UP } from './costanti.js';

const KEY='pallanuoto-schema-v041';
const clone = value => JSON.parse(JSON.stringify(value));
const base = FORM.slice(1).map(p=>[...p]), up=FORM_UP.slice(1).map(p=>[...p]);
export const PERIMETRO=Object.freeze([2,4,6,5,3]);
export const SCHEMI_PRESET=[
  {id:'arco',nome:'Arco e appoggi',descrizione:'Circolazione tra vicini, centro quando si libera e difesa in pressing.',attacco:clone(base),superiorita:clone(up),difesa:2,aiuti:[4,5],entrata:0,passaggi:'vicini'},
  {id:'entrata',nome:'Entrata e copertura',descrizione:'Il mezzo destro entra nello spazio; un compagno rimane alto a coprire.',attacco:clone(base),superiorita:clone(up),difesa:2,aiuti:[4,5],entrata:4,passaggi:'equilibrati'},
  {id:'incrocio',nome:'Incrocio dei mezzi',descrizione:'I mezzi scambiano lato; entra il mezzo sinistro con un compagno alto in copertura.',attacco:base.map((p,i)=>[p[0],i===3||i===4?-p[1]:p[1]]),superiorita:clone(up),difesa:2,aiuti:[4,5],entrata:5,passaggi:'equilibrati'},
  {id:'boa',nome:'Centro e scarico',descrizione:'Spazio al centroboa, servizio soltanto davanti alla marcatura e scarico se chiuso.',attacco:base.map((p,i)=>i===0?[2.6,0]:[Math.min(10,p[0]*1.08),p[1]*1.1]),superiorita:clone(up),difesa:1,aiuti:[4,5],entrata:0,passaggi:'equilibrati'},
  {id:'pali',nome:'Pali in movimento',descrizione:'Appoggi rapidi e pali scaglionati: la conclusione dipende dalla risposta della difesa.',attacco:clone(base),superiorita:clone(up),difesa:3,aiuti:[2,3,4,5],entrata:0,passaggi:'rapidi'}
];

function posizioni(value){
  if(!Array.isArray(value)||value.length!==6) return null;
  const result=[];
  for(const p of value){
    if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)) return null;
    const z=Math.max(-8.8,Math.min(8.8,p[1]));
    // Posizioni iniziali fuori dall'area di porta. L'IA può poi avanzare dietro la palla.
    const d=Math.max(Math.abs(z)<3.58?2.1:1,Math.min(10,p[0]));
    result.push([Math.round(d*100)/100,Math.round(z*100)/100]);
  }
  return result;
}
export function validaSchema(input){
  if(!input||typeof input!=='object') return null;
  const attacco=posizioni(input.attacco),superiorita=posizioni(input.superiorita);
  if(!attacco||!superiorita||!Number.isInteger(input.difesa)||input.difesa<0||input.difesa>3||
    !Number.isInteger(input.entrata)||input.entrata<0||input.entrata>6||
    !['vicini','equilibrati','rapidi'].includes(input.passaggi)||!Array.isArray(input.aiuti)||
    !input.aiuti.every(i=>Number.isInteger(i)&&i>=1&&i<=6)) return null;
  const nome=typeof input.nome==='string'?input.nome.trim().slice(0,40):'';
  if(!nome) return null;
  return {id:typeof input.id==='string'?input.id.slice(0,40):'personale',nome,
    descrizione:typeof input.descrizione==='string'?input.descrizione.slice(0,240):'',
    attacco,superiorita,difesa:input.difesa,aiuti:[...new Set(input.aiuti)],entrata:input.entrata,passaggi:input.passaggi};
}
export function copiaSchema(idOrSchema='arco'){
  const source=typeof idOrSchema==='string'?SCHEMI_PRESET.find(s=>s.id===idOrSchema):idOrSchema;
  return source?validaSchema(source):null;
}
export function caricaSchema(){
  try{ const s=validaSchema(JSON.parse(localStorage.getItem(KEY))); if(s) return s; }catch{ /* storage non disponibile */ }
  return copiaSchema('arco');
}
export function salvaSchema(schema){
  const s=validaSchema(schema); if(!s) return false;
  try{ localStorage.setItem(KEY,JSON.stringify(s)); return true; }catch{ return false; }
}
export function applicaSchema(team,schema){
  const s=validaSchema(schema); if(!team||!s) return false;
  team.schema=s; team.atkPlay=s.id==='boa'?3:s.id==='incrocio'?2:s.entrata?1:0; team.defPlay=s.difesa;
  team.cross=s.id==='incrocio'; team.schemaStato=null; team.aiutoStato=null; team.copertura=null; team.postiAssegnati=null; team.postiT=-1;
  for(const p of team.players||[]){ p.cut=null; p.appoggio=null; }
  return true;
}
export const schemaSquadra = team => team.schema||SCHEMI_PRESET[0];
// L'arco è aperto: le due ali non sono vicine passando attraverso la porta.
export function viciniPerimetro(a,b,superiorita=false){
  const ordine=superiorita?[2,4,5,3]:PERIMETRO;
  const ia=ordine.indexOf(a),ib=ordine.indexOf(b);
  return ia>=0&&ib>=0&&Math.abs(ia-ib)===1;
}
