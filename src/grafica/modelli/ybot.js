// Descrizione del modello usato per i giocatori. Per cambiare modello (es. un atleta fatto con MakeHuman) basta un file
// come questo: indirizzi dei due livelli di dettaglio, nomi delle ossa e poche misure. Il resto del codice non cambia.
import url from './giocatore.glb?url';
import urlLontano from './giocatore-lontano.glb?url';
const o=n=>'mixamorig'+n;
export default {
  url, urlLontano,
  // il modello in posa di riposo guarda verso +Z, con Y in alto
  ossa:{ bacino:o('Hips'), collo:o('Neck'), testa:o('Head'),
    bracD:o('RightArm'), avamD:o('RightForeArm'), manoD:o('RightHand'), bracS:o('LeftArm'), avamS:o('LeftForeArm'), manoS:o('LeftHand'),
    cosciaD:o('RightUpLeg'), gambaD:o('RightLeg'), piedeD:o('RightFoot'), puntaD:o('RightToeBase'),
    cosciaS:o('LeftUpLeg'), gambaS:o('LeftLeg'), piedeS:o('LeftFoot'), puntaS:o('LeftToeBase') },
  // ossa riportate ogni volta alla posa di riposo prima di essere mosse (schiena, clavicole)
  daAzzerare:[o('Spine'),o('Spine1'),o('Spine2'),o('RightShoulder'),o('LeftShoulder')],
  proporzione:1.0,                 // ritocco della grandezza rispetto alla larghezza delle spalle
  costume:[0.455,0.582],           // fascia del costume, come frazione dell'altezza del corpo in posa di riposo
  calottina:{ raggio:11.9, su:9.5, avanti:2.2, paraorecchie:[11.2,-3.2,0.5] },   // rispetto all'osso della testa, nelle unità del modello
};
