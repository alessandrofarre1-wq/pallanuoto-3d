// Misura la regolarità, non soltanto la media: pochi frame da 30 ms
// sono già visibili durante un'azione. Nessuna allocazione per fotogramma.
export function creaQualitaAdattiva(massimo){
  let tempo=0, fotogrammi=0, lenti=0, somma=0, finestreLente=0, stabili=0;
  function reset(){ tempo=0; fotogrammi=0; lenti=0; somma=0; finestreLente=0; stabili=0; }
  function aggiorna(ms,attiva,attuale){
    // Menu, pausa e ritorni dall'altra app non devono decidere la qualità.
    if(!attiva || ms<=0 || ms>250){ reset(); return attuale; }
    tempo+=ms; somma+=ms; fotogrammi++;
    if(ms>22) lenti++;
    if(tempo<1000) return attuale;
    const lento=somma/fotogrammi>19 || lenti/fotogrammi>0.1;
    const stabile=somma/fotogrammi<17.5 && lenti/fotogrammi<0.02;
    finestreLente=lento?finestreLente+1:0;
    stabili=stabile?stabili+tempo:0;
    tempo=0; somma=0; fotogrammi=0; lenti=0;
    if(finestreLente>=2){ finestreLente=0; stabili=0; return Math.max(Math.min(1,massimo),attuale-0.125); }
    // Recupero più prudente della riduzione, per evitare continui cambi.
    if(stabili>=12000){ stabili=0; return Math.min(massimo,attuale+0.125); }
    return attuale;
  }
  return { aggiorna, reset };
}
