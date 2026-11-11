// Descrizione del modello usato per i giocatori: atleti costruiti dai dati liberi (CC0) di MakeHuman con
// strumenti/costruisci-atleta.mjs. Tre corporature (ognuna in due livelli di dettaglio) e cinque pelli con il volto.
// Per cambiare modello basta un file come questo: il resto del codice non dipende dal modello.
import misure from './misure.json';
const glb=import.meta.glob('./atleta-*.glb',{eager:true,query:'?url',import:'default'});
const jpg=import.meta.glob('./pelle-*.jpg',{eager:true,query:'?url',import:'default'});
const corporature={};
for(const nome in misure.corporature) corporature[nome]={ url:glb[`./atleta-${nome}.glb`], urlLontano:glb[`./atleta-${nome}-lontano.glb`], testa:misure.corporature[nome] };
export default {
  corporature,
  // ogni giocatore riceve una di queste pelli (e la corporatura che le corrisponde)
  pelli:misure.pelli.map(p=>({ corporatura:p.corporatura, url:jpg[`./pelle-${p.pelle}.jpg`] })),
  // il modello in posa di riposo guarda verso +Z, con Y in alto e la sinistra del corpo verso +X
  ossa:{ bacino:'pelvis', collo:'neck_01', testa:'head',
    bracD:'upperarm_r', avamD:'lowerarm_r', manoD:'hand_r', bracS:'upperarm_l', avamS:'lowerarm_l', manoS:'hand_l',
    cosciaD:'thigh_r', gambaD:'calf_r', piedeD:'foot_r', puntaD:'ball_r',
    cosciaS:'thigh_l', gambaS:'calf_l', piedeS:'foot_l', puntaS:'ball_l' },
  // ossa riportate ogni volta alla posa di riposo prima di essere mosse (schiena, clavicole)
  daAzzerare:['spine_01','spine_02','spine_03','clavicle_r','clavicle_l'],
  proporzione:1.0,                 // ritocco della grandezza rispetto alla larghezza delle spalle
};
