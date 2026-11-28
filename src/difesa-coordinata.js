// Una consegna è uno scambio di responsabilità, non un richiamo di tutti sulla palla.
import { clamp, dist } from './costanti.js';
import { ball, ctrl, game, other, ownGoalX } from './stato.js';
import { DIFESA_COORDINATA as C, RIENTRO_SCAMBI as R } from './taratura.js';

export function coordinaDifesa(t,{uomoDi,centro,palla,trans,rallenta,leggiCentro,cambio,aiuti}){
  const att=other(t),gx=ownGoalX(t),prof=p=>(p.x-gx)*t.dir;
  const distanzaPorta=p=>Math.hypot(prof(p),p.z);
  const disponibile=p=>p&&!p.isGK&&!p.excluded&&!p.uscendo;
  const raddoppio=t.doubleP&&game.time<t.doubleUntil&&ball.holder?.team===att;
  const riservato=p=>p===ctrl||raddoppio&&p===t.doubleP;
  const automatico=p=>disponibile(p)&&!riservato(p)&&game.time>=(p.stunUntil||0);
  if(game.possTeam!==att||t.players.some(p=>p.excluded)||att.players.some(p=>p.excluded)){
    t.difesaCoordinata=null;t.aiutoStato=t.adattamentoEntrata=null;return;
  }
  uomoDi(t.players[1]);
  let s=t.difesaCoordinata;
  if(!s||s.mappa!==t.accoppiamenti||s.possT!==game.possT||s.dir!==t.dir||game.time<s.tempo){
    s=t.difesaCoordinata={mappa:t.accoppiamenti,possT:game.possT,dir:t.dir,tempo:game.time,dopo:0,tenute:new Map()};
    t.aiutoStato=t.adattamentoEntrata=null;
  }
  s.tempo=game.time;
  const costo=(d,q)=>dist(d,q)+R.dietro*Math.max(0,prof(d)-prof(q));
  const peso=q=>1+clamp((8-distanzaPorta(q))/4,0,1)+(q===palla?1:0)+(q===centro?.5:0);
  const minacciato=q=>{
    const d=t.players.find(p=>disponibile(p)&&uomoDi(p)===q);
    if(!d)return null;
    const perso=prof(d)>prof(q)+C.battuto&&dist(d,q)>C.vicino||dist(d,q)>(prof(q)<5?C.libero:C.lontano);
    return perso?d:null;
  };
  const pericoli=att.players.filter(q=>disponibile(q)&&prof(q)>0&&
    (trans?q!==palla&&prof(q)<Math.abs(ball.x-gx)+R.davanti:prof(q)<C.zona))
    .filter(minacciato).sort((a,b)=>peso(b)-peso(a)||prof(a)-prof(b));
  let consegnato=false;
  if(game.time>=s.dopo){
    s.dopo=game.time+R.ogni;
    for(const q of pericoli){
      const a=minacciato(q);
      if(!a||riservato(a)||a.uscendo||trans&&a===rallenta||game.time<(s.tenute.get(a)||0))continue;
      let scelta=null,migliore=0;
      for(const b of t.players){
        if(!automatico(b)||b===a||b===rallenta&&trans||game.time<(s.tenute.get(b)||0))continue;
        const u=uomoDi(b);
        if(!disponibile(u)||u===q||cambio(b)||dist(b,q)>(trans?C.rientro:C.prende)||prof(b)>prof(q)+C.davanti)continue;
        // Non risolvere il primo duello creando un'occasione ancora più grave.
        // Conta dove può arrivare il cedente, non soltanto la vicinanza dell'aiutante.
        const urgente=prof(u)<C.zona||u===palla;
        if(urgente&&(!automatico(a)||dist(a,u)>C.copre||prof(a)>prof(u)+C.copreDietro))continue;
        const vantaggio=costo(a,q)-costo(b,q);
        if(vantaggio<(trans?R.guadagno:C.guadagno))continue;
        const guadagno=peso(q)*vantaggio+peso(u)*(costo(b,u)-costo(a,u));
        if(guadagno>C.saldo&&guadagno>migliore){scelta={a,b,q,u};migliore=guadagno;}
      }
      if(!scelta)continue;
      const {b,u}=scelta;
      t.accoppiamenti.uomini[b.i]=q;t.accoppiamenti.uomini[a.i]=u;
      for(const [d,nuovo]of [[a,u],[b,q]]){
        // Il ritardo del vecchio uomo non deve trascinare il difensore nella
        // direzione opposta dopo la consegna. Le coordinate del corpo non cambiano.
        d.lagX=nuovo.x;d.lagZ=nuovo.z;s.tenute.set(d,game.time+R.tieni);d.scambiatoFino=game.time+R.tieni;
      }
      t.scambio={a,b,fino:game.time+R.tieni,dopo:s.dopo};t.scambi=(t.scambi||0)+1;
      if(trans)t.scambiRientro=(t.scambiRientro||0)+1;
      t.aiutoStato=t.adattamentoEntrata=null;consegnato=true;break;
    }
  }
  if(trans||raddoppio){t.aiutoStato=t.adattamentoEntrata=null;return;}
  // Un cambio volante ha già liberato un difensore per la copertura centrale.
  // Non aggiungere un secondo aiuto sottraendolo a un attaccante presente.
  if(t.players.some(p=>automatico(p)&&cambio(p))){t.aiutoStato=t.adattamentoEntrata=null;return;}
  const urgente=pericoli.find(q=>prof(q)<C.aiutoZona&&minacciato(q));
  let q=urgente;
  if(!q&&!consegnato&&palla&&palla!==centro&&disponibile(centro)&&prof(centro)<4.6&&prof(palla)<8){
    const d=t.players.find(p=>disponibile(p)&&uomoDi(p)===centro);
    if(leggiCentro(centro,d,palla).ricevibile)q=centro;
  }
  if(!q||!palla||palla.isGK){t.aiutoStato=t.adattamentoEntrata=null;return;}
  const sicuro=b=>{
    const u=uomoDi(b);
    if(game.time<(s.tenute.get(b)||0))return false;
    if(!urgente&&aiuti&&!aiuti.includes(b.i))return false;
    if(!automatico(b)||u===q||u===palla||u===centro||!disponibile(u)||dist(u,palla)<C.latoDebole)return false;
    if(distanzaPorta(u)<C.proteggi)return false;
    // Il tiro lontano scelto dalla zona può essere concesso; una minaccia ai
    // due metri non si abbandona mai. La semplice vicinanza di un compagno
    // impegnato su un altro uomo non equivale a una consegna.
    const alaDebole=urgente&&!u.cut&&Math.abs(u.z)>C.alaLarga&&dist(u,palla)>C.pallaLontana;
    return distanzaPorta(u)>=C.esterno||alaDebole||(u===t.lasciato&&(t.defPlay===1||t.defPlay===3));
  };
  let aiuto=t.aiutoStato;
  if(!aiuto||aiuto.q!==q||game.time>aiuto.fino||!sicuro(aiuto.p)){
    const candidati=t.players.filter(sicuro).filter(p=>dist(p,q)<C.raggioAiuto).sort((a,b)=>dist(a,q)-dist(b,q));
    const p=candidati[0];aiuto=t.aiutoStato=p?{p,q,fino:game.time+C.tieniAiuto}:null;
  }
  if(!aiuto){t.adattamentoEntrata=null;return;}
  const tipo=urgente?(prof(q)<3.8?'raddoppio':'M'):'linea';
  aiuto.tipo=tipo;
  t.adattamentoEntrata=urgente?{tipo,entrante:q,aiutante:aiuto.p,fino:aiuto.fino}:null;
}

// Anche durante un fallo ordinario gli altri atleti si muovono: ricalcolare
// il bersaglio dalle coordinate attuali, senza nuove consegne per ogni chiamante.
export function bersaglioAiuto(t,aiuto,palla){
  const q=aiuto.q,gx=ownGoalX(t);
  if(aiuto.tipo==='raddoppio'){
    const dx=gx-q.x,dz=-q.z,l=Math.hypot(dx,dz)||1;
    return {x:q.x+dx/l*.8,z:q.z+dz/l*.8,sprint:true};
  }
  const k=aiuto.tipo==='M'?.32:.38,x=q.x+(palla.x-q.x)*k,z=q.z+(palla.z-q.z)*k;
  return {x:gx+t.dir*clamp((x-gx)*t.dir,2.2,6.5),z:clamp(z,-5.5,5.5),sprint:true};
}
