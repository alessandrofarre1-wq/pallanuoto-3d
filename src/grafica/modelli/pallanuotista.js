// Personaggio dello stile Cartoon: il pallanuotista del concept di Ale, modellato da Hunyuan 3D Pro e preparato con Blender
// (strumenti/blender/: saldatura, scala 1,80 m, scheletro con gli stessi nomi degli atleti, versione da circa 8.200 triangoli).
// Report e sorgenti in modelli-sorgente/pallanuotista/.
import url from './pallanuotista.glb?url';
export default {
  url,
  // stesse ossa degli atleti (src/grafica/modelli/atleta.js): i movimenti del gioco valgono uguali
  ossa:{ bacino:'pelvis', collo:'neck_01', testa:'head',
    bracD:'upperarm_r', avamD:'lowerarm_r', manoD:'hand_r', bracS:'upperarm_l', avamS:'lowerarm_l', manoS:'hand_l',
    cosciaD:'thigh_r', gambaD:'calf_r', piedeD:'foot_r', puntaD:'ball_r',
    cosciaS:'thigh_l', gambaS:'calf_l', piedeS:'foot_l', puntaS:'ball_l' },
  daAzzerare:['spine_01','spine_02','spine_03','clavicle_r','clavicle_l'],
  proporzione:1.0,
  // dove sta il 7 dipinto sulla cuffia (misurato sul modello, metri, sistema del modello: Y su, +Z avanti, +X sua sinistra):
  // il numero vero di ogni giocatore viene messo lì, sui due lati
  cuffia:{ centro:[0.004,1.677,-0.063], lato:[0.82,0.52,0.22], larghezza:0.95, altezza:0.95 },
  // luminosità media del blu della cuffia e del costume nell'immagine (spazio lineare): serve a ricolorare mantenendo luci e ombre
  luceBlu:0.2,
};
