// Come si vede ciò che sta sott'acqua. L'acqua (scena.js) è un velo leggero sulla superficie: non sa cosa c'è sotto, quindi
// da sola darebbe lo stesso colore a una mano appena immersa e al fondo della vasca. Qui ogni materiale che entra in acqua
// (corpi, palla, fondo, pareti, porte, corde) si colora da sé secondo la PROFONDITÀ del punto disegnato:
//  - appena sotto la superficie il colore resta quasi quello vero (volti, costumi e calottine si riconoscono);
//  - più si scende, più il colore si attenua verso il blu dell'acqua (le gambe stanno chiaramente "dentro");
//  - il passaggio fuori/dentro è una fascia morbida che ondeggia, con una linea chiara di acqua bagnata sul corpo;
//  - sui corpi i punti sott'acqua ondeggiano di poco, come visti attraverso l'acqua mossa.
// Tutto avviene nel disegno di ciascun oggetto: nessun passaggio di disegno in più.
export const tempoAcqua={ value:0 };

// funzioni comuni (GLSL): pMondo = punto nel mondo, y = 0 è la superficie
const COMUNE=`
uniform float uTempoAcqua;
varying vec3 vPosAcqua;
float pelo(vec2 xz){ return 0.012*sin(xz.x*6.3+uTempoAcqua*2.6)*sin(xz.y*5.1-uTempoAcqua*2.1); }      // la superficie ondeggia appena
`;
const VERTICE=`
vec3 ondeggia(vec3 p, float forza){
  float d=clamp(-p.y-0.05,0.0,0.6)/0.6*forza;      // più è profondo più si sposta, fino a pochi centimetri
  p.x+=d*0.022*sin(p.z*4.1+uTempoAcqua*2.3+p.y*3.0);
  p.z+=d*0.022*sin(p.x*3.7-uTempoAcqua*2.0+p.y*2.0);
  return p;
}`;
const FRAMMENTO=`
vec3 sottAcqua(vec3 c, vec3 p, float bagnato, float luci){
  float y=p.y-pelo(p.xz);
  float dentro=smoothstep(0.012,-0.05,y);                                  // fascia morbida fuori -> dentro
  float prof=max(0.0,-y);
  float k=dentro*(0.10+0.62*(1.0-exp(-prof*1.1)));                         // quanto prende il colore dell'acqua
  vec3 acqua=vec3(0.008,0.17,0.35)*(0.8+0.35*exp(-prof*0.8));              // blu dell'acqua (lineare): più chiaro vicino alla superficie
  // più si scende, meno contrasto: il colore si appiattisce verso la sua luminosità media prima di sfumare nel blu
  c=mix(c,vec3(dot(c,vec3(0.3,0.55,0.15))),dentro*0.35*(1.0-exp(-prof*1.6)));
  vec3 r=mix(c*mix(vec3(1.0),vec3(0.90,0.97,1.0),dentro),acqua,k);
  // luce che tremola sotto la superficie: reticolo morbido e irregolare che si muove piano (sui corpi si spegne in profondità,
  // sul fondo resta: sono i giochi di luce della piscina, in versione disegnata e leggera)
  vec2 q=p.xz*1.35+vec2(sin(p.z*0.9+uTempoAcqua*0.6),sin(p.x*0.8-uTempoAcqua*0.5))*0.9;
  float tremo=abs(sin(q.x+uTempoAcqua*0.9)+sin(q.y*1.13-uTempoAcqua*0.7)+sin((q.x+q.y)*0.71+uTempoAcqua*0.5));
  r*=1.0+luci*dentro*(1.0-smoothstep(0.0,0.55,tremo));
  // linea chiara dove il corpo esce dall'acqua (pelle bagnata)
  float riga=1.0-smoothstep(0.0,0.028,abs(y+0.006));
  r+=vec3(0.55,0.75,0.85)*riga*0.32*bagnato;
  return r;
}`;

// mat.onBeforeCompile già usato (es. corpi ricolorati): si concatena
// opz.ondeggia = 1 per i corpi (molti punti), 0 per oggetti semplici; opz.bagnato = 1 dove serve la linea d'acqua sulla pelle;
// opz.luci = forza dei giochi di luce sul fondo (formula GLSL: di base si spengono scendendo)
export function sottAcqua(mat,opz={}){
  const prima=mat.onBeforeCompile, ond=(opz.ondeggia||0).toFixed(2), bag=(opz.bagnato||0).toFixed(2), luci=opz.luci||'0.12*exp(-prof*1.6)';
  mat.onBeforeCompile=(sh,r)=>{
    if(prima) prima(sh,r);
    sh.uniforms.uTempoAcqua=tempoAcqua;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+COMUNE+VERTICE)
      .replace('#include <project_vertex>',`
        vec4 mvPosition=vec4(transformed,1.0);
        #ifdef USE_INSTANCING
          mvPosition=instanceMatrix*mvPosition;
        #endif
        vec4 pMondo=modelMatrix*mvPosition;
        pMondo.xyz=ondeggia(pMondo.xyz,${ond});
        vPosAcqua=pMondo.xyz;
        mvPosition=viewMatrix*pMondo;
        gl_Position=projectionMatrix*mvPosition;`);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+COMUNE+FRAMMENTO)
      .replace('#include <opaque_fragment>',`{ float prof=max(0.0,-vPosAcqua.y); outgoingLight=sottAcqua(outgoingLight,vPosAcqua,${bag},${luci}); }\n#include <opaque_fragment>`);
  };
  mat.customProgramCacheKey=()=>'sottAcqua'+ond+bag+luci+(opz.chiave||'');
  return mat;
}
