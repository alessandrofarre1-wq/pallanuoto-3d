// Catena del tiro classico soltanto nel disegno. Le fasi sono frazioni della
// frusta fisica già scelta dal motore; non aggiungono tempi al rilascio.
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const u=clamp(x);return u*u*(3-2*u);};
const CAMPI=['peso','bacino','gambe','crunch','anticipo','spinta','sweep','pull','gomito','trasferimento'];
const valori=()=>Object.fromEntries(CAMPI.map(k=>[k,0]));
export function catenaTiroVista(out,carica,volo,chiude,lato=1,oriz=0){
  const peso=clamp(carica)*(1-ease(chiude))*(1-ease(oriz));
  const anticipo=ease(volo/.54),spinta=ease(volo/.48);
  out.peso=peso;
  // Le spalle caricano a -.84: il bacino meno ruotato mantiene circa 30°
  // di separazione elastica, poi parte prima del torace durante la frusta.
  out.bacino=(-.32*(1-anticipo)+.34*anticipo)*peso*lato;
  out.gambe=out.bacino*.85;
  out.crunch=.10*ease((volo-.28)/.72)*peso;
  out.anticipo=anticipo;
  out.spinta=spinta;
  out.sweep=peso*(1-anticipo);
  out.pull=peso*anticipo;
  out.gomito=peso*(1-ease(volo));
  out.trasferimento=(-.025+.055*spinta)*peso;
  return out;
}
// Stesso raccordo breve del gesto: una carica già iniziata passa all'atto senza
// azzerare anche e gambe. La memoria resta live durante il playback del replay,
// che registra e ripristina le trasformazioni delle ossa, non queste fasi.
export function raccordaCatenaTiroVista(s,attiva,carica,volo,chiude,lato,oriz){
  const c=s.catenaTiro||(s.catenaTiro={out:valori(),da:valori(),gesto:null,attiva:false,inizio:0,durata:0});
  if(!s.valida)c.durata=0;
  if(c.gesto!==s.gesto||c.attiva!==attiva){
    for(const k of CAMPI)c.da[k]=c.out[k];
    c.inizio=s.renderTime;
    c.durata=s.valida?(s.raccordoD||.08):0;
    c.gesto=s.gesto;c.attiva=attiva;
  }
  catenaTiroVista(c.out,attiva?carica:0,volo,chiude,lato,oriz);
  if(c.durata>0){
    const k=ease((s.renderTime-c.inizio)/c.durata);
    for(const key of CAMPI)c.out[key]=c.da[key]+(c.out[key]-c.da[key])*k;
    if(k===1)c.durata=0;
  }
  return c.out;
}
