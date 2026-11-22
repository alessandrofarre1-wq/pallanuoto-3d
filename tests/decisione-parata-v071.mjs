import assert from 'node:assert/strict';
import { probabilitaPresa, probabilitaTentativo } from '../src/decisione-parata.js';
const base={riflessi:.7,stamina:1,tempoVolo:.16,distanzaTiro:3,angolo:1,marcato:0,
  daFermo:false,dopoCambio:false,liberato:true,tipoTiro:'centro',parataSuperiorita:.1,
  zPalla:1.15,yPalla:.65,zPrima:0,vzPrima:0,forza:.42,lob:false,finta:0,schizzo:false,
  sorpresa:0,difficolta:1,rigore:false,fuoriPosto:0};
assert.ok(probabilitaTentativo(base)>0,'si può tentare una parata anche senza finta');
assert.ok(probabilitaTentativo({...base,finta:.25})<probabilitaTentativo(base),'la finta dà un vantaggio, senza essere un requisito');
assert.equal(probabilitaTentativo({...base,zPalla:4}),0,'nessuna portata illimitata');
for(const parte of ['torace','testa','braccio'])for(const velocita of [4,12,25]){
  assert.equal(probabilitaPresa({parte,velocita,distanza:2,tempoVolo:.15}),0,'colpire il corpo non dà una presa pulita');
}
for(const velocita of [10,14,20,25]){
  const vicino=probabilitaPresa({parte:'mano',velocita,distanza:3,tempoVolo:.2});
  assert.ok(vicino<=.05,'anche il tiro poco caricato da vicino viene perlopiù respinto');
  assert.ok(vicino<=probabilitaPresa({parte:'mano',velocita,distanza:8,tempoVolo:.6}));
}
assert.ok(probabilitaPresa({parte:'mano',velocita:24,distanza:8,tempoVolo:.6})<probabilitaPresa({parte:'mano',velocita:8,distanza:8,tempoVolo:.6}));
assert.equal(probabilitaTentativo(base),probabilitaTentativo({...base,zPalla:-base.zPalla,zPrima:-base.zPrima,vzPrima:-base.vzPrima}),'stesse regole sui due lati');
console.log('PASS decisione parata: finte facoltative, portata, respinte e prese ravvicinate');
