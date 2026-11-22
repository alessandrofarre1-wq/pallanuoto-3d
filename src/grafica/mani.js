// Le falangi sono solo visuali: non cambiano la presa fisica, il lancio o il caso.
import * as THREE from 'three';

const DITA=['Thumb','Index','Middle','Ring','Pinky'];
const X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);
const rotazione=new THREE.Quaternion();
const riposo=[.10,.15,.07],coppa=[.08,.12,.05],presa=[.20,.28,.13],presaPollice=[.14,.20,.13];
const limita=x=>Math.max(0,Math.min(1,x));
const sfuma=x=>{x=limita(x);return x*x*(3-2*x);};

export function preparaMani(radice){
  const mani=[];
  for(const [lato,prefisso] of [['S','left'],['D','right']]){
    const dita=[];
    for(const nome of DITA){
      const ossa=[1,2,3].map(i=>radice.getObjectByName(prefisso+'Hand'+nome+i));
      if(ossa.some(o=>!o))return null;
      dita.push({nome,ossa,riposo:ossa.map(o=>o.quaternion.clone()),angoli:new Float32Array(3),opposizione:0});
    }
    mani.push({lato,dita,presa:0});
  }
  return mani;
}

export function aggiornaMani(mani,p,T,dt){
  if(!mani)return;
  const dominante=T.manoS?'S':'D';
  let tiene=T.ballHand?(1-limita(T.ballDavanti||0))*(1-limita(T.pescaPalla||0)):0;
  const atto=p.act;
  if(atto&&atto.kind!=='fake'){
    const frusta=atto.frusta||.09,progresso=(atto.t-atto.wind)/frusta;
    tiene*=1-sfuma((progresso-.78)/.30);
  }
  const k=1-Math.exp(-22*Math.max(0,dt));
  for(const mano of mani){
    const afferra=mano.lato===dominante?tiene:0;
    mano.presa=afferra;
    const aperta=!!(p.isGK&&p.parataIn)||!!T.alzato;
    for(const dito of mano.dita){
      const pollice=dito.nome==='Thumb';
      for(let i=0;i<3;i++){
        const libera=aperta?.015:T.swim?coppa[i]:riposo[i];
        const carica=pollice?presaPollice[i]:presa[i];
        const target=libera+(carica-libera)*afferra;
        dito.angoli[i]+=(target-dito.angoli[i])*k;
        dito.ossa[i].quaternion.copy(dito.riposo[i]).multiply(rotazione.setFromAxisAngle(X,dito.angoli[i]));
      }
      if(pollice){
        // Il primo asse del pollice attraversa la base tenar: opposizione
        // lieve verso le dita, speculare fra le due mani, senza torcere il palmo.
        const target=(mano.lato==='S'?-1:1)*.12*afferra;
        dito.opposizione+=(target-dito.opposizione)*k;
        dito.ossa[0].quaternion.multiply(rotazione.setFromAxisAngle(Z,dito.opposizione));
      }
    }
  }
}
