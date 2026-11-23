// Scelta e schieramento dello scatto: soltanto dati, senza assegnare il possesso
// né modificare velocità o stamina. Il nuotatore resta lo stesso dopo il via.
export function scegliScattista(t){
  let migliore=null,miglioreVel=-Infinity;
  for(const p of t.players){
    if(p.isGK||p.excluded||p.uscendo)continue;
    const vel=Number.isFinite(p.s?.vel)?p.s.vel:0;
    if(!migliore||vel>miglioreVel||(vel===miglioreVel&&p.i<migliore.i)){
      migliore=p;miglioreVel=vel;
    }
  }
  return migliore;
}

export function formazioneScatto(t,lineaPorta,corsie){
  const nuotatore=scegliScattista(t);
  const atleti=t.players.map(p=>({p,scheda:p.scheda,num:p.num,vel:p.s?.vel,excluded:p.excluded,uscendo:p.uscendo}));
  const posizioni=t.players.filter(p=>!p.excluded).map(p=>({p,
    // Appena dentro la linea: la fisica non deve correggere la x al primo passo.
    x:lineaPorta+t.dir*(p.isGK?.7:.3),
    // Portiere fuori dai pali e fra due corsie, senza occupare la via centrale.
    z:(p.isGK?3.75:p===nuotatore?0:corsie[p.i])*t.dir}));
  return {nuotatore,atleti,posizioni,dir:t.dir,lineaPorta};
}

export function stessaFormazioneScatto(a,b){
  return !!a&&a.dir===b.dir&&a.lineaPorta===b.lineaPorta&&a.nuotatore===b.nuotatore&&a.atleti.length===b.atleti.length&&a.atleti.every((v,i)=>{
    const q=b.atleti[i];
    return v.p===q.p&&v.scheda===q.scheda&&v.num===q.num&&v.vel===q.vel&&v.excluded===q.excluded&&v.uscendo===q.uscendo;
  });
}
