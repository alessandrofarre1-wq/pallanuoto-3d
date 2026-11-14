// Corpo di tutti i giocatori (MODELLO v2, 14/11/2026): il pallanuotista generato da Ale dal suo concept in posa a T, preparato con Blender
// (strumenti/blender/prepara.py, scheletro.py, viso.py): stesse 24 ossa, zone dei colori, bocca apribile con cavità e denti, 18 forme
// del viso per le espressioni (src/grafica/espressioni.js). Prima: il modello generato con Hunyuan 3D Pro
// (strumenti/blender/: saldatura, scala 1,80 m, scheletro con le ossa che il gioco muove, versione da circa 8.200 triangoli).
// Report e sorgenti in modelli-sorgente/pallanuotista/.
import url from './pallanuotista.glb?url';
export default {
  url,
  // ossa mosse dal gioco (corpo.js), con i nomi che hanno nel modello
  ossa:{ bacino:'pelvis', collo:'neck_01', testa:'head',
    bracD:'upperarm_r', avamD:'lowerarm_r', manoD:'hand_r', bracS:'upperarm_l', avamS:'lowerarm_l', manoS:'hand_l',
    cosciaD:'thigh_r', gambaD:'calf_r', piedeD:'foot_r', puntaD:'ball_r',
    cosciaS:'thigh_l', gambaS:'calf_l', piedeS:'foot_l', puntaS:'ball_l' },
  daAzzerare:['spine_01','spine_02','spine_03','clavicle_r','clavicle_l'],
  proporzione:1.0,
  // dove sta il 7 dipinto sulla cuffia (misurato sul modello, metri, sistema del modello: Y su, +Z avanti, +X sua sinistra):
  // il numero vero di ogni giocatore viene messo lì, sui due lati
  cuffia:{ centro:[-0.004,1.673,-0.059], lato:[0.82,0.52,0.22], larghezza:0.95, altezza:0.95 },
  // luminosità media del blu della cuffia e del costume nell'immagine (spazio lineare): serve a ricolorare mantenendo luci e ombre
  luceBlu:0.13,
  // in posa a T i palmi guardano in avanti (+Z del modello)
  palmoRiposo:[0,0,1],
};
