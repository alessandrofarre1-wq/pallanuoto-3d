// Raccordi soltanto del disegno: nessuna lettura/scrittura di J, ballW o del motore.
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const u=clamp(x);return u*u*(3-2*u);};
export const GIUNTI_GESTO_VISTA=['hip','chest','head','sR','sL','eR','eL','hR','hL','kL','kR','fL','fR'];
// v0.90 (video di Ale: dopo la finta «parte quel movimento molto veloce che sembra quasi uno spasmo; o va rallentato o va tolto»):
// il raccordo tra due pose dura quanto serve a non superare «velocita» unità del corpo al secondo con la giuntura che si sposta di
// più (1 unità = VIS metri), fino a «massimo» secondi; l'ingresso in un gesto resta dentro la carica (prima dell'accenno della finta e
// della frusta del tiro). Prima era
// sempre 0,08 s anche quando il braccio passava dalla carica sopra la testa alla palla davanti in acqua (circa un metro).
export const RACCORDO_VISTA=Object.freeze({ velocita:3, massimo:0.4 });
const memorie=new WeakMap();
const vettori=()=>Object.fromEntries(GIUNTI_GESTO_VISTA.map(k=>[k,[0,0,0]]));
const copia=(a,b)=>{for(const k of GIUNTI_GESTO_VISTA)for(let i=0;i<3;i++)a[k][i]=b[k][i];};
// Una presa nuova cancella i vecchi recuperi; la finta mantiene invece la palla
// e deve disegnare anche il ritorno, senza saltare subito alla carica del tiro.
export const attoVista=(p,hold)=>hold&&p.act?.done&&p.act.kind!=='fake'?null:p.act;

// Le due cubiche condividono posizione e velocità al rilascio. Le tangenti sono
// limitate per evitare che l'accompagnamento superi i punti della traiettoria.
export function frustaVista(out,K,R,F,tempo,frusta,dopo=.198){
  const prima=tempo<=frusta, D=prima?frusta:dopo;
  const u=clamp(prima?tempo/frusta:(tempo-frusta)/dopo),u2=u*u,u3=u2*u;
  for(let i=0;i<3;i++){
    const v0=(R[i]-K[i])/frusta,v1=(F[i]-R[i])/dopo;
    const v=v0*v1>0?Math.sign(v0)*Math.min(Math.abs((v0+v1)/2),3*Math.min(Math.abs(v0),Math.abs(v1))):0;
    const A=prima?K[i]:R[i],B=prima?R[i]:F[i],m0=prima?0:v*D,m1=prima?v*D:0;
    out[i]=(2*u3-3*u2+1)*A+(u3-2*u2+u)*m0+(-2*u3+3*u2)*B+(u3-u2)*m1;
  }
  return out;
}
export function caricaVista(a,carica,ingresso=0){
  return a?a.wind>0?ingresso+(1-ingresso)*ease(a.t/a.wind):1:ease(carica/.5);
}
// Il guadagno non cambia a done: cresce all'ingresso e torna al valore di base
// durante tutta la chiusura già prevista dal gesto, senza aggiungere una molla.
export function smussoGestoVista(a,base=14,gesto=40){
  if(!a)return base;
  const entra=ease(a.t/.06),esce=1-ease((a.t-a.wind-a.frusta)/(a.recupero??.36));
  return base+(gesto-base)*entra*esce;
}
export function preparaGestoVista(p,a,hold,gameTime,dt,renderTime,resetForzato=false){
  let s=memorie.get(p);
  if(!s){
    s={ultima:vettori(),da:vettori(),valida:false,gesto:null,carica:0,caricaIngresso:0,
      raccordoT:1,raccordoD:0,tw:0,wr:0,wl:0,daTw:0,daWr:0,daWl:0,off:[0,0,0]};
    memorie.set(p,s);
  }
  // Il playback disegna soltanto le matrici: non tocca questa memoria live.
  // Un intervallo nel tempo reale, con game.time congelato, non la invalida.
  const reset=resetForzato||s.numero!==p.num||s.scheda!==p.scheda||gameTime<(s.gameTime??gameTime)||gameTime-(s.gameTime??gameTime)>.25||
    renderTime<(s.renderTime??renderTime)||
    Math.hypot(p.x-(s.x??p.x),p.z-(s.z??p.z))>2;
  // v0.90: la presa raccorda la posa di ricezione con quella della palla in mano (prima azzerava il raccordo: il corpo scattava e la
  // palla arrivava nella mano già alta in 0,12 s, «traslata»)
  const presaNuova=hold&&s.hold===false;
  const gesto=a||(p.charging?'carica':null);
  if(reset){s.valida=false;s.gesto=gesto;s.caricaIngresso=0;s.raccordoD=0;s.misuraRaccordo=false;}
  if(s.gesto!==gesto||presaNuova&&!reset){
    if(s.gesto!==gesto)s.caricaIngresso=s.carica;
    if(s.valida){
      copia(s.da,s.ultima);s.daTw=s.tw;s.daWr=s.wr;s.daWl=s.wl;s.raccordoT=0;
      // Il raccordo d'ingresso è finito prima dell'istante fisico di rilascio.
      s.raccordoD=a?Math.min(.08,Math.max(0,a.wind+a.frusta-a.t)*.55):.08;
      // un gesto: il raccordo più lungo resta dentro la carica (non smorza l'accenno della finta né la frusta del tiro)
      s.raccordoLimite=a?Math.min(Math.max(0,a.wind+a.frusta-a.t)*.55,Math.max(.08,Math.max(0,a.wind-a.t)*.8)):RACCORDO_VISTA.massimo;s.misuraRaccordo=true;
    }
    s.gesto=gesto;
  }else s.raccordoT+=Math.max(0,dt);
  s.carica=caricaVista(a,p.chargeT||0,a?s.caricaIngresso:0);
  s.numero=p.num;s.scheda=p.scheda;s.gameTime=gameTime;s.renderTime=renderTime;
  s.x=p.x;s.z=p.z;s.hold=hold;
  return s;
}
export function raccordaGestoVista(s,V,T){
  // al primo fotogramma del raccordo: quanto si sposta la giuntura che cambia di più tra la posa di prima e quella nuova
  if(s.misuraRaccordo){
    s.misuraRaccordo=false;
    if(s.valida&&s.raccordoD>0){ let d=0; for(const key of GIUNTI_GESTO_VISTA) d=Math.max(d,Math.hypot(V[key][0]-s.da[key][0],V[key][1]-s.da[key][1],V[key][2]-s.da[key][2]));
      s.raccordoD=Math.max(s.raccordoD,Math.min(s.raccordoLimite??s.raccordoD,RACCORDO_VISTA.massimo,d/RACCORDO_VISTA.velocita)); }
  }
  if(s.valida&&s.raccordoD>0&&s.raccordoT<s.raccordoD){
    const k=ease(s.raccordoT/s.raccordoD);
    for(const key of GIUNTI_GESTO_VISTA)for(let i=0;i<3;i++)V[key][i]=s.da[key][i]+(V[key][i]-s.da[key][i])*k;
    T.torsioneVista=s.daTw+((T.torsioneVista||0)-s.daTw)*k;
    T.polsoR=s.daWr+((T.polsoR||0)-s.daWr)*k;T.polsoL=s.daWl+((T.polsoL||0)-s.daWl)*k;
  }
  return V;
}
export function conservaGestoVista(s,V,T){
  copia(s.ultima,V);s.tw=T.torsioneVista||0;s.wr=T.polsoR||0;s.wl=T.polsoL||0;s.valida=true;
}
