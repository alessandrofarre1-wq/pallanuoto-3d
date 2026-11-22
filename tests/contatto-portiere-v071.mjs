// Geometria del contatto: non decide se il portiere riesce a raggiungere il tiro.
import assert from 'node:assert/strict';
import { contattoPortiere } from '../src/contatto-portiere.js';

const rb=.1106,sfera=(x,y,z,raggio,parte='torace')=>({centro:[x,y,z],raggio,parte});
const vicino=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-8,`${msg}: ${a} / ${b}`);
let casi=0;
const prova=(nome,fn)=>{fn();casi++;};
const sagoma=(x,dir)=>[
  sfera(x,.43,0,.23),sfera(x,.92,0,.19,'testa'),
  sfera(x+dir*.05,.62,.55,.07,'braccio'),sfera(x+dir*.05,.62,-.55,.07,'braccio'),
  sfera(x+dir*.12,.70,.80,.085,'mano'),sfera(x+dir*.12,.70,-.80,.085,'mano')
];

for(const dir of [1,-1]){
  const gx=12.1*dir,S=sagoma(gx,dir),tiro=(y,z)=>contattoPortiere([gx-dir,y,z],[gx+dir,y,z],rb,S,S);
  for(const [y,z,parte] of [[.43,0,'torace'],[.92,0,'testa'],[.62,.55,'braccio'],[.70,-.8,'mano']])
    prova(`${parte}, verso ${dir}`,()=>{const h=tiro(y,z);assert.equal(h?.parte,parte);assert.ok(h.t>0&&h.t<1);vicino(Math.hypot(...h.normale),1,'normale unitaria');});
  for(const [nome,y,z] of [['lato libero',.43,1.18],['sopra la testa',1.32,0],['spazio sopra la spalla',.82,.40]])
    prova(`${nome}, verso ${dir}`,()=>assert.equal(tiro(y,z),null));
  for(const velocita of [25,30])for(const fps of [30,60,120])
    prova(`tiro ${velocita}m/s ${fps}Hz, verso ${dir}`,()=>{
      let da=[gx-dir*.55,.43,0],impatto=null;
      for(let f=0;f<10&&!impatto;f++){
        const a=[da[0]+dir*velocita/fps,da[1],da[2]],h=contattoPortiere(da,a,rb,S,S);
        if(h)impatto={...h,tempo:(f+h.t)/fps};da=a;
      }
      assert.equal(impatto?.parte,'torace');
      vicino(impatto.tempo,(.55-.23-rb)/velocita,'istante indipendente dal fotogramma');
      vicino(impatto.punto[0],gx-dir*(.23+rb),'centro palla sul contatto anteriore');
      vicino(impatto.normale[0],-dir,'normale contraria al tiro');
      if(fps===30&&velocita===30){
        const fine=gx-dir*.55+dir*velocita/fps,porta=12.5*dir;
        assert.ok((fine-porta)*dir>0,'il tratto intero supererebbe anche la linea di porta');
        assert.ok((impatto.punto[0]-porta)*dir<0,'l’urto avviene prima del gol');
      }
    });
}

prova('sfera che attraversa un tiro',()=>{
  const a=[-1,.4,0],b=[1,.4,0],S0=[sfera(0,.4,.3,.23)],S1=[sfera(0,.4,-.3,.23)];
  const h=contattoPortiere(a,b,rb,S0,S1);assert.ok(h&&h.t>0&&h.t<.5);
  vicino(Math.hypot(h.punto[0],0,h.punto[2]-(.3-.6*h.t)),.23+rb,'posizione relativa all’urto');
});
prova('portiere che si allontana alla velocità della palla',()=>{
  assert.equal(contattoPortiere([-1,.4,0],[1,.4,0],rb,[sfera(0,.4,0,.23)],[sfera(2,.4,0,.23)]),null);
});
prova('sfera mobile contro palla ferma',()=>{
  const h=contattoPortiere([0,.4,0],[0,.4,0],rb,[sfera(-1,.4,0,.23)],[sfera(1,.4,0,.23)]);
  vicino(h.t,(1-.23-rb)/2,'ingresso relativo');assert.deepEqual(h.punto,[0,.4,0]);vicino(h.normale[0],1,'normale mobile');
});
prova('raggio interpolato durante il passo',()=>{
  const h=contattoPortiere([1,0,0],[-1,0,0],.1,[sfera(0,0,0,.2)],[sfera(0,0,0,.3)]);
  vicino(h.t,.7/2.1,'raggio crescente');
});
prova('vince il primo urto, non il primo indice',()=>{
  const S=[sfera(.2,.4,0,.23),sfera(-.3,.4,0,.085,'mano')];
  const h=contattoPortiere([-1,.4,0],[1,.4,0],rb,S,S);assert.equal(h.indice,1);assert.equal(h.parte,'mano');
});
prova('parità deterministica per indice',()=>{
  const S=[sfera(0,.4,0,.23),sfera(0,.4,0,.23,'testa')];
  assert.equal(contattoPortiere([-1,.4,0],[1,.4,0],rb,S,S).indice,0);
});
const S=[sfera(0,0,0,.23)],r=.23+rb;
for(const [nome,da,a,atteso] of [
  ['superficie entrante',[-r,0,0],[0,0,0],0],
  ['superficie uscente',[-r,0,0],[-1,0,0],null],
  ['penetrazione entrante',[-.2,0,0],[.1,0,0],0],
  ['penetrazione uscente',[-.2,0,0],[-.6,0,0],null],
  ['palla ferma dentro',[-.2,0,0],[-.2,0,0],null],
  ['partenza dal centro verso fuori',[0,0,0],[.5,0,0],null],
  ['tangenza iniziale uscente',[0,r,0],[1,r,0],null],
  ['contatto esatto alla fine',[-1,0,0],[-r,0,0],1]
])prova(nome,()=>{const h=contattoPortiere(da,a,rb,S,S);if(atteso===null)assert.equal(h,null);else vicino(h.t,atteso,nome);});
prova('un rimbalzo uscente non ripete il contatto t0',()=>{
  const h=contattoPortiere([-.2,0,0],[.1,0,0],rb,S,S);assert.equal(h.t,0);
  assert.equal(contattoPortiere(h.punto,[-.6,0,0],rb,S,S),null);
});
prova('tangenza intermedia e tiro appena più alto',()=>{
  const h=contattoPortiere([-1,r,0],[1,r,0],rb,S,S);vicino(h.t,.5,'tangenza');
  assert.equal(contattoPortiere([-1,r+.00001,0],[1,r+.00001,0],rb,S,S),null);
});
prova('linearità quadratica degenere',()=>{
  const h=contattoPortiere([1,0,0],[.9,0,0],.1,[sfera(0,0,0,.2)],[sfera(0,0,0,.3)]);
  assert.equal(h,null);
  const entra=contattoPortiere([1,0,0],[0,0,0],.1,[sfera(0,0,0,.2)],[sfera(0,0,0,1.2)]);
  vicino(entra.t,.35,'ingresso nella soluzione lineare');
});
for(const dir of [1,-1])for(const fps of [30,60,120])prova(`sfera mobile a${fps}Hz, verso${dir}`,()=>{
  const da=[-.55*dir,.43,0],fine=[da[0]+25*dir,da[1],da[2]];
  const sf=t=>[sfera(.3*dir*t,.43,.1+.8*t,.23)];
  const intero=contattoPortiere(da,fine,rb,sf(0),sf(1));assert.ok(intero);
  let trovato=null;
  for(let f=0;f<8&&!trovato;f++){
    const prima=[da[0]+25*dir*f/fps,.43,0],dopo=[da[0]+25*dir*(f+1)/fps,.43,0];
    const h=contattoPortiere(prima,dopo,rb,sf(f/fps),sf((f+1)/fps));
    if(h)trovato={...h,tempo:(f+h.t)/fps};
  }
  assert.ok(trovato);vicino(trovato.tempo,intero.t,'stesso impatto relativo tra frequenze');
  for(let i=0;i<3;i++)vicino(trovato.punto[i],intero.punto[i],'stesso punto relativo');
});
prova('sfere assenti, nuove e rimosse',()=>{
  assert.equal(contattoPortiere([-1,0,0],[1,0,0],rb,[],[]),null);
  assert.equal(contattoPortiere([-1,0,0],[1,0,0],rb,S,[]),null);
  assert.ok(contattoPortiere([-1,0,0],[1,0,0],rb,[],S));
});
prova('input immutabili, ripetizioni identiche',()=>{
  const da=Object.freeze([-1,0,0]),a=Object.freeze([1,0,0]);
  const s=Object.freeze({centro:Object.freeze([0,0,0]),raggio:.23,parte:'torace'}),L=Object.freeze([s]);
  const h=contattoPortiere(da,a,rb,L,L);
  for(let i=0;i<20;i++)assert.deepEqual(contattoPortiere(da,a,rb,L,L),h);
});
console.log(`PASS contatto portiere v0.71: ${casi} scene, sweep3D relativo, 30/60/120Hz, lati liberi e nessun riurto uscente`);
