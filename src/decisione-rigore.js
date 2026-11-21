// WA 18.02.2026, Part Six, 11.1.1.1 e 11.1.1.4 (p.233).
// Lettura pura della situazione: nessun sorteggio e nessuna sanzione al ricevimento.
// La linea dei 6 m delimita l'area; i 5 m sono la posizione del tiro di rigore.
const no = motivo => ({ possibile:false, differito:false, motivo });
const gestiTiro = new Set(['shot','lob','beduina','sciarpa','rovesciata','polso','torsione','schizzo','colonnello']);

export function leggiRigore(d,c,{porta,palla,difendenti=[],fallo=true,soloPalla=false}={}){
  if(!fallo||soloPalla)return no('nessun fallo sul giocatore');
  if(!d||!c||!d.team||!c.team||d.team===c.team||d.excluded||d.uscendo||c.excluded||c.uscendo)
    return no('giocatori non coinvolti nel duello');
  if(!Number.isFinite(porta)||!Number.isFinite(c.x)||!Number.isFinite(c.z)||!Number.isFinite(d.x)||!Number.isFinite(d.z))
    return no('posizione non valida');
  if(!palla||palla.state!=='held'||palla.holder!==c)return no('nessun possesso dell’attaccante');
  if(c.freeThrow||c.act?.kind==='pass')return no('ripresa o passaggio, non occasione di tiro');
  const dir=Math.sign(porta)||c.team.dir,profC=(porta-c.x)*dir,profD=(porta-d.x)*dir;
  if(profC<0||profC>6||profD<0||profD>6)return no('contatto fuori dai 6 metri');
  const dx=d.x-c.x,dz=d.z-c.z,contatto=Math.hypot(dx,dz);
  if(contatto>1.35)return no('nessun contatto a portata');
  const gx=porta-c.x,gz=-c.z,distanza=Math.hypot(gx,gz);
  if(distanza<.01)return no('attaccante oltre la linea di porta');
  // Una posizione molto laterale non diventa un gol probabile solo perché è dentro i 6 m.
  if(Math.abs(gx)/distanza<.35)return no('angolo di tiro chiuso');
  const gk=difendenti.find(p=>p.isGK&&!p.excluded&&!p.uscendo),portaVuota=!gk||Math.abs(porta-gk.x)>2.2;
  const fronte=((c.fx||0)*gx+(c.fz||0)*gz)/distanza;
  if(fronte<.35&&!portaVuota)return no('attaccante non rivolto alla porta');
  // Un aiuto sulla linea va letto anche quando è lontano più di 1,6 m dal portatore.
  // Il portiere da solo non annulla una chiara occasione; si cercano i difensori di movimento.
  const corridoioLibero=tz=>{
    const vx=porta-c.x,vz=tz-c.z,l2=vx*vx+vz*vz;
    return !difendenti.some(q=>{
      if(q===d||q.isGK||q.excluded||q.uscendo)return false;
      const u=((q.x-c.x)*vx+(q.z-c.z)*vz)/l2;
      return u>0&&u<1&&Math.hypot(q.x-c.x-u*vx,q.z-c.z-u*vz)<.75;
    });
  };
  if(![-1.2,0,1.2].some(corridoioLibero))return no('difesa già sul corridoio di tiro');
  const dietro=contatto>.01&&(dx*(c.fx||0)+dz*(c.fz||0))/contatto<-.45;
  const inTiro=!!c.act&&!c.act.done&&gestiTiro.has(c.act.kind);
  return {possibile:true,differito:dietro&&fronte>.35&&inTiro,motivo:dietro&&inTiro?'tiro ostacolato da dietro':'gol probabile impedito'};
}
