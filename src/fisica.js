// ================= FISICA GIOCATORI =================
import { rif01, setteControSei } from './ia.js';
import { registraIntercetto, registraParata } from './statistiche.js';
import { whistle } from './audio.js';
import { ALZATA, ARBITRO, BRV, DIFF, DIFF_GK, GH, GW, HL, HW, clamp, dist, rnd } from './costanti.js';
import { annuncia } from './cronaca.js';
import { QUOTA_GALLEGGIA, passoPalla } from './palla.js';
import { blockR } from './ia.js';
import { cornerThrow, giveBall, goalScored, goalThrow, sfondamento, sideOut } from './regole.js';
import { active, allPlayers, ball, fight, game, goalX, other, ownGoalX, teams } from './stato.js';
import { diSchiena, shotKind } from './tiri.js';
export function movePlayer(p,dx,dz,sprint,dt){
  const mag=Math.hypot(dx,dz), moving=mag>0.05, swimming=mag>0.5;
  const hold=ball.holder===p, sp=Math.hypot(p.vx,p.vz);
  // Velocità: tra 60 e 90 di Velocità ci sono circa il 19% di differenza
  let base=1.45*1.08*(0.82+(p.s.vel-40)/59*0.36);    // andatura normale ~1.6 m/s
  const canSprint=sprint&&p.stamina>0.05&&swimming;
  if(canSprint) base*=1.65;                          // sprint ~2.6 m/s da fresco
  p.sprinting=canSprint;
  base*=0.6+0.4*p.stamina;
  if(hold) base*=0.85;
  if(p.charging||(p.act&&!p.act.done&&p.act.kind!=='colonnello'&&p.act.kind!=='schizzo')) base*=0.35;
  // Corpo verticale ↔ orizzontale: il passaggio è rapido e frequentissimo (ci si alza per ricevere, passare, tirare, guardare,
  // e si riparte subito): circa un quarto di secondo per alzarsi, un decimo in più per distendersi.
  // Lo SPOSTAMENTO invece è lento e scivoloso: il corpo porta con sé la velocità anche quando smette di nuotare o si alza.
  const lunging=p.lunge>game.time;
  // muro (sezione 3): l'avversario vicino carica il tiro → ci si alza in verticale e lo si guarda in faccia, braccio alto
  const hm=ball.holder, muroOra=!p.isGK&&hm&&hm.team!==p.team&&Math.hypot(hm.x-p.x,hm.z-p.z)<2&&(hm.charging||(hm.act&&!hm.act.done&&hm.act.kind!=='pass'&&hm.act.kind!=='fake'));
  const gesto=p.charging||(p.act&&!p.act.done&&p.act.kind!=='colonnello')||muroOra;
  // chi sta per ricevere un passaggio si alza un attimo prima che la palla arrivi (e continua a scivolare)
  const riceve=ball.state==='flight'&&ball.kind==='pass'&&ball.target===p&&Math.hypot(ball.tx-ball.x,ball.tz-ball.z)<Math.hypot(ball.vx,ball.vz)*0.3;
  // inversione: per tornare indietro non si fa una curva a U distesi, ci si alza, si gira sul posto e si riparte
  const cosGiro=swimming?(p.fx*dx+p.fz*dz)/mag:1;
  if(swimming&&!p.isGK&&!lunging){ if(cosGiro<-0.25) p.perno=true; else if(cosGiro>0.45) p.perno=false; } else p.perno=false;
  const vuoleNuoto=swimming && !gesto && !riceve && !p.perno;
  p.oriz=clamp((p.oriz||0)+(vuoleNuoto?dt/(ALZATA+0.1):-dt/ALZATA),0,1);
  // da verticale si riparte subito, ma finché il corpo non è disteso non si spinge a piena forza
  if(swimming) base*=0.62+0.38*p.oriz;
  if(game.time<p.stunUntil) base*=0.15;
  p.contactT=(p.contactT||0)-dt;
  if(p.contactT>0) base*=0.55;                       // corpo a corpo: si fatica ad avanzare
  if(lunging) base*=1.35;
  // disteso si spinge nella direzione del corpo (e il corpo gira piano: curve ampie); in verticale ci si sposta con le gambe
  // in qualsiasi direzione
  let ux=dx, uz=dz;
  if(swimming && !p.isGK && !lunging){
    const o=p.oriz; ux=dx/mag*(1-o)+p.fx*o; uz=dz/mag*(1-o)+p.fz*o;
    const ul=Math.hypot(ux,uz)||1, af=0.3+0.7*Math.max(0,cosGiro); ux=ux/ul*mag*af; uz=uz/ul*mag*af;
  }
  const tvx=ux*base, tvz=uz*base, tsp=Math.hypot(tvx,tvz);
  // l'acqua: si accelera in modo progressivo; smettendo di nuotare si scivola e si rallenta piano (meno attrito da distesi,
  // di più in verticale); si frena davvero solo remando contro
  let ritmo;
  if(!moving) ritmo=0.8+0.6*(1-p.oriz);
  else if(sp>0.3 && (p.vx*dx+p.vz*dz)<-0.3*sp*mag) ritmo=2.4;
  else ritmo=tsp>sp?1.5:1.25;
  if(game.time<p.stunUntil||p.contactT>0) ritmo=Math.max(ritmo,2.6);
  if(p.isGK) ritmo=Math.max(ritmo,2.2);            // il portiere si muove di gambe, a scatti brevi
  const a=Math.min(1,dt*ritmo);
  p.vx+=(tvx-p.vx)*a; p.vz+=(tvz-p.vz)*a;
  // Resistenza: un giocatore medio è visibilmente stanco dopo 6-7 vasche di sprint di fila (docs/tecnica.md);
  // chi ha più Resistenza si stanca meno e recupera prima
  const fRes=(p.s.res-40)/59;
  if(canSprint) p.stamina-=dt*0.0092*(1.6-fRes); else p.stamina+=dt*(moving?0.006:0.02)*(0.6+0.8*fRes);
  if(p.contactT>0) p.stamina-=dt*0.02;
  p.stamina=clamp(p.stamina,0,1);
  p.x+=p.vx*dt; p.z+=p.vz*dt;
  p.x=clamp(p.x,-HL+0.25,HL-0.25); p.z=clamp(p.z,-HW+0.25,HW-0.25);
  if(p.isGK && !setteControSei(p.team)){ const og=ownGoalX(p.team); p.x = p.team.dir>0 ? clamp(p.x,og+0.3,0) : clamp(p.x,0,og-0.3); }      // il portiere resta nella sua metà, tranne nel 7 contro 6
  let tfx=p.fx, tfz=p.fz;
  if(p.act&&p.act.aim){ tfx=p.act.aim[0]-p.x; tfz=p.act.aim[1]-p.z; }
  else if(p.turnedUntil>game.time){ tfx=goalX(p.team)-p.x; tfz=-p.z; }
  else if(p.charging){ tfx=goalX(p.team)-p.x; tfz=-p.z; if(diSchiena(shotKind(p))){ tfx=-tfx; tfz=-tfz; } }
  else if(muroOra){ tfx=hm.x-p.x; tfz=hm.z-p.z; }
  else if(swimming && !(p.isGK&&ball.state!=='held'&&!sprint)){ tfx=dx; tfz=dz; }
  else if(hold){
    tfx=goalX(p.team)-p.x; tfz=-p.z;
    if(p.i===1 && Math.hypot(tfx,tfz)<4.5 && game.penalty!==p){ tfx=-tfx; tfz=-tfz; }   // il centroboa lavora spalle alla porta
  }
  else { tfx=ball.x-p.x; tfz=ball.z-p.z; }
  // il corpo gira a velocità limitata: in verticale ci si gira in fretta sul posto, distesi si curva largo
  const ang=Math.atan2(p.fz,p.fx), dest=Math.atan2(tfz,tfx);
  let diff=dest-ang; while(diff>Math.PI) diff-=2*Math.PI; while(diff<-Math.PI) diff+=2*Math.PI;
  const o=p.oriz||0, veloce=clamp(sp/1.4,0,1);
  const omega=(p.act?16:(7.5-4.4*o*veloce))*dt;                 // radianti: ~430°/s in verticale, ~180°/s in piena nuotata
  const giro=clamp(diff*Math.min(1,dt*(p.act?14:9)),-omega,omega), na=ang+giro;
  p.fx=Math.cos(na); p.fz=Math.sin(na);
}
export function separate(){
  const ps=allPlayers.filter(active);
  for(let i=0;i<ps.length;i++) for(let j=i+1;j<ps.length;j++){
    // distanza minima tra due corpi: tra avversari c'è contatto, tra compagni un po' di spazio in più (meno ammassi)
    const a=ps[i], b=ps[j], opp=a.team!==b.team, R=opp?0.8:0.75;
    const dx=b.x-a.x, dz=b.z-a.z, d=Math.hypot(dx,dz);
    if(d>=R||d<0.0001) continue;
    const nx=dx/d, nz=dz/d, push=(R-d)/2;
    a.x-=nx*push; a.z-=nz*push; b.x+=nx*push; b.z+=nz*push;
    if(opp){   // un avversario davanti fa resistenza: si perde la velocità verso di lui e si deve girargli attorno
      // chi ha la palla e nuota dritto addosso al difensore fa fallo in attacco (sfondamento); si decide una volta per contatto
      if(game.state==='play'&&(ball.holder===a||ball.holder===b)&&!(fight.active&&(fight.boa===a||fight.boa===b))){
        const c=ball.holder, d=c===a?b:a, sx=c===a?nx:-nx, sz=c===a?nz:-nz;      // (sx,sz): da chi ha palla verso il difensore
        if(!(c.sfondaT>game.time)&&!c.act&&!d.isGK){
          c.sfondaT=game.time+1.2;
          const vc=c.vx*sx+c.vz*sz, vd=-(d.vx*sx+d.vz*sz), fronte=c.fx*sx+c.fz*sz;
          // conta la velocità verso il difensore, il fatto di guardarlo in faccia e che il difensore non gli venga addosso
          const p=clamp((vc-0.9)/1.3,0,1)*clamp((fronte-0.6)/0.3,0,1)*(vd>0.4?0.3:1)*0.55*ARBITRO;
          if(p>0&&rnd()<p){ sfondamento(c,d); return; }
        }
      }
      const va=a.vx*nx+a.vz*nz; if(va>0){ a.vx-=nx*va*0.9; a.vz-=nz*va*0.9; }
      const vb=-(b.vx*nx+b.vz*nz); if(vb>0){ b.vx+=nx*vb*0.9; b.vz+=nz*vb*0.9; }
      a.contactT=b.contactT=0.25;
    }
  }
}

// ================= PALLA =================
// La palla si muove con la fisica di palla.js; qui si applicano le regole: parata, muro, intercetto, ricezione, gol, fuori.
const _giocatori=[];
function passo(dt,corpiAttivi){
  // i corpi dei giocatori fanno rimbalzare solo la palla vagante (su tiri e passaggi decidono parata, muro e intercetto)
  for(let i=0;i<allPlayers.length;i++){ const p=allPlayers[i], g=_giocatori[i]||(_giocatori[i]={x:0,z:0,attivo:false});
    g.x=p.x; g.z=p.z; g.attivo=corpiAttivi&&!p.excluded&&p!==ball.shooter&&p!==ball.ignora; }
  const e=passoPalla(ball,dt,_giocatori);
  if(e.acqua) ball.spruzzo={ forza:e.acqua.forza, schizzo:e.acqua.tipo==='schizzo'||e.acqua.radente };      // lo disegna render.js
  return e;
}
// palla uscita dalla linea di fondo (art. 12-13): tiro d'angolo se l'ha toccata per ultimo un difensore (portiere compreso),
// altrimenti rimessa del portiere
function fuoriDalFondo(att){
  const def=other(att);
  if(ball.toccoDifesa===def) cornerThrow(att); else goalThrow(def,'Fuori! Rimessa dal portiere');
}
// la palla ha passato la linea di porta in questo passo? (px = posizione prima del passo)
function lineaDiPorta(px){
  for(const t of teams){
    const gx=goalX(t);
    if((px-gx)*(ball.x-gx)>0 || px===ball.x || Math.abs(px)>HL) continue;      // conta solo se arriva dal campo
    const dentro=Math.abs(ball.z)<GW+0.04 && ball.y<GH+0.04 && ball.y>-0.3;
    return { att:t, dentro };
  }
  return null;
}
export function updateBall(dt){
  if(ball.state==='held'){
    const p=ball.holder; ball.holdTime+=dt; ball.x=p.x; ball.z=p.z; ball.y=BRV;
    ball.vx=ball.vy=ball.vz=0; ball.wx=ball.wy=ball.wz=0; ball.inRete=false;
    return;
  }
  if(ball.state==='dead'){
    // dopo il gol la palla finisce davvero in fondo alla rete, che la smorza
    if(ball.inRete){ const f=Math.exp(-3*dt); ball.vx*=f; ball.vz*=f; passo(dt,false); return; }
    // palla uscita: finisce il suo volo (pareti della vasca comprese) finché il gioco riparte
    if(ball.inUscita){ passo(dt,false); return; }
    ball.x+=ball.vx*dt; ball.z+=ball.vz*dt; ball.vx*=Math.exp(-2*dt); ball.vz*=Math.exp(-2*dt);
    ball.y+=(QUOTA_GALLEGGIA-ball.y)*Math.min(1,dt*6); return;      // palla ferma: galleggia
  }
  ball.pickupCD-=dt;
  if(ball.state==='flight'){
    const px=ball.x;
    const e=passo(dt,ball.kind==='rebound'); ball.flightT+=dt;
    // pali e traversa: l'urto è vero, qui si annuncia soltanto
    if(ball.daTiro){
      const legno=e.urti.find(u=>u==='palo'||u==='traversa');
      if(legno && Math.abs(Math.abs(ball.x)-HL)<0.5){ ball.kind='rebound'; ball.afterShot=true; annuncia('legno',legno==='palo'?'Palo!':'Traversa!',{p:ball.shooter}); }
    }
    if(ball.kind==='shot'){
      const att=ball.shooter.team, def=other(att), gk=def.players[0];
      // parata
      if(!ball.saveChecked && (px-gk.x)*(ball.x-gk.x)<=0){
        ball.saveChecked=true;
        // Parata. Conta soprattutto la POSIZIONE al momento del tiro: quanto la palla passa lontano da dove stava il portiere,
        // tolto il pezzo che copre senza tuffarsi (braccia). Il tuffo (Riflessi) recupera solo una parte del resto; la stanchezza pesa.
        const R=rif01(gk), fresco=0.8+0.2*gk.stamina, braccia=0.7;
        // tiro da lontano: il portiere ha più tempo, arriva più lontano e para molto di più (da oltre 8-9 metri quasi sempre);
        // da poco angolo vede poca porta da coprire
        const tempo=clamp((ball.flightT-0.28)/0.3,0,1), dT=ball.distTiro||6, ang=ball.angoloTiro==null?1:ball.angoloTiro;
        const facile=0.3*tempo+Math.max(0,dT-7.5)*0.2+Math.max(0,0.6-ang)*0.8+0.1*(ball.marcato||0)+(ball.daFermo?0.1:0)-(ball.dopoCambio?0.16:0)-(ball.liberato?0.05:0)-(ball.tipoTiro==='superiorita'?0.2:0);
        const lontano=Math.max(0,Math.abs(ball.z-ball.gkZ0)-braccia), reach=(0.5+0.8*R)*fresco+0.7*tempo+Math.max(0,dT-7.5)*0.3;
        gk.stamina=Math.max(0,gk.stamina-0.035*(1.5-(gk.s.res-40)/59));          // ogni salto costa
        // tiro da vicino: la palla arriva in meno di un quarto di secondo e il portiere non fa in tempo a reagire
        const vicino=clamp((0.26-ball.flightT)/0.26,0,1)*0.42;
        if(lontano<reach && ball.y<1.9){
          let prob=(1.07-0.30*ball.shotPower*(1.25-0.5*R)-lontano*(0.7-0.3*R)-(ball.lob?0.2:0)-(gk.fakedUntil>game.time?0.25:0)-(ball.skipped?0.12:0)-(ball.sorpresa||0)-vicino+facile)*fresco*(def.human?1:DIFF_GK())
            *(ball.rigore?0.41:1);      // sul rigore il portiere para molto meno: negli studi citati dalla tesi ne entra l'80%
          if(rnd()<prob){
            whistle(0.12); const r=rnd(); ball.afterShot=true; registraParata(att,def);
            if(ball.shotPower>0.55&&r<0.25){
              // deviata in angolo: il portiere la alza sopra la traversa; uscirà dal fondo toccata per ultimo da lui (tiro d'angolo)
              const gx=ownGoalX(def), dx=Math.max(0.25,Math.abs(gx-ball.x)), vxs=3.2, t=dx/vxs, y0=Math.max(0.3,ball.y);
              ball.kind='rebound'; ball.toccoDifesa=def; ball.ignora=gk; ball.vx=Math.sign(gx-ball.x||1)*vxs; ball.vz=ball.vz*0.15+(rnd()-0.5)*1.5;
              ball.vy=(GH+0.45-y0+4.9*t*t)/t; ball.wx*=0.3; ball.wz*=0.3; ball.pickupCD=9;
              annuncia('parata','Parata!',{p:gk,dettaglio:"deviata in angolo"});
            }
            else if(ball.shotPower>0.7&&r<0.65){
              // respinta: la palla schizza via dalle mani del portiere, verso il campo e verso l'alto
              ball.kind='rebound'; ball.toccoDifesa=def; ball.ignora=gk; ball.vx=-ball.vx*0.22; ball.vz=ball.vz*0.3+(rnd()-0.5)*4; ball.vy=1.5+rnd()*2; ball.wx*=0.3; ball.wz*=0.3; ball.pickupCD=0.25;
              annuncia('parata','Parata!',{p:gk,dettaglio:'respinta'});
            } else { giveBall(gk); annuncia('parata','Parata!',{p:gk}); }
            return;
          }
        }
      }
    }
    // linea di porta: gol se passa tra i pali e sotto la traversa (anche dopo aver toccato un legno), altrimenti fuori
    if(ball.daTiro){
      const l=lineaDiPorta(px);
      if(l){
        if(l.dentro){ ball.inRete=true; goalScored(l.att); return; }
        fuoriDalFondo(l.att); return;
      }
    }
    // intercetti, muri e ricezione
    if(ball.y<1.35){
      for(const p of allPlayers){
        if(p.excluded) continue;
        const hd=Math.hypot(p.x-ball.x,p.z-ball.z);
        if(p.team!==ball.lastTeam && !p.isGK && game.time>=p.stunUntil && hd<blockR(p) && (ball.kind!=='pass'||!ball.target||hd<Math.hypot(ball.target.x-ball.x,ball.target.z-ball.z)) && ball.flightT>0.12 && !ball.intercept.has(p)){
          ball.intercept.add(p);
          // il muro copre un palo (muro.js: primo palo se il tiratore è di lato, lato del braccio di tiro se è centrale)
          // e lascia l'altro al portiere
          const primoPalo=ball.kind==='shot'&&ball.shooter&&Math.sign(ball.crossZ||0)===(ball.paloCoperto||0);
          // sulle diagonali (palo lontano) serve il braccio alto al momento giusto: dipende dalla Difesa; una finta appena
          // riuscita lo abbassa per un attimo; il polso non dà il tempo di alzarlo; chi tira più alto passa sopra
          const dif01=(p.s.dif-40)/59, braccioAlto=0.2+0.7*dif01;
          const finta=ball.shooter&&ball.shooter.fakeUntil>game.time?0.45:1;
          const muro=(primoPalo?0.42:0.34*braccioAlto)*finta*(1-2*(ball.sorpresa||0))*(1.3-0.6*(ball.elevazione||0.5));
          // intercetto: è da qui che nasce la maggior parte delle palle rubate. Un passaggio lungo e lento dà il tempo di leggerlo;
          // conta la Difesa di chi anticipa contro il Passaggio di chi l'ha fatto
          const letto=0.06+0.26*clamp((ball.flightT-0.2)/0.7,0,1)+(ball.shooter?(p.s.dif-ball.shooter.s.pas)/59*0.12:0);
          const pr=(ball.kind==='shot'?muro:clamp(letto,0.04,0.5))*(0.6+0.6*p.st.def)*(p.team.human?1:DIFF());
          if(rnd()<pr){
            if(ball.kind==='shot'){
              // muro: la palla rimbalza sul braccio alzato e resta in gioco
              ball.kind='rebound'; ball.toccoDifesa=p.team; ball.ignora=p; ball.vx*=-0.2; ball.vz=ball.vz*0.3+(rnd()-0.5)*3; ball.vy=1+rnd()*1.5; ball.wx*=0.3; ball.wz*=0.3; ball.pickupCD=0.2; annuncia('parata','Muro!',{p}); ball.afterShot=true;
            }
            else { registraIntercetto(p.team); giveBall(p); annuncia('possesso','Intercetto!',{p}); }
            return;
          }
        }
        if(ball.kind==='pass' && p===ball.target && hd<0.85 && ball.flightT>0.15){ giveBall(p); return; }
      }
    }
    // acqua (palla.js calcola le forze; qui solo la regola): la palla che esce dall'acqua dopo averla toccata ha fatto uno
    // schizzo e resta in volo (il portiere la legge peggio); quella che resta in acqua e rallenta diventa vagante
    if(e.acqua && e.acqua.tipo==='schizzo'){ if((ball.schizzi=(ball.schizzi||0)+1)<=2 && ball.kind==='shot') ball.skipped=true; }
    else if(e.inAcqua && ball.vy<=0.5 && ball.flightT>0.1 && Math.hypot(ball.vx,ball.vz)<4){ ball.state='free'; ball.pickupCD=0.1; }
    if(ball.state==='flight' && Math.abs(ball.z)>HW+0.2){ sideOut(); return; }
    if(ball.state==='flight' && Math.abs(ball.x)>HL+1.2){ ball.state='free'; ball.vx*=0.2; ball.vz*=0.2; }
  }
  if(ball.state==='free'){
    const px=ball.x;
    passo(dt,true);
    if(Math.abs(ball.z)>HW+0.2){ sideOut(); return; }
    // una palla vagante che rotola in porta dopo un tiro è gol; se esce dal fondo è rimessa
    if(ball.daTiro){ const l=lineaDiPorta(px); if(l&&l.dentro){ ball.inRete=true; goalScored(l.att); return; } }
    if(Math.abs(ball.x)>HL){
      const defT=teams.find(t=>Math.sign(ownGoalX(t))===Math.sign(ball.x));
      fuoriDalFondo(other(defT)); return;
    }
    if(ball.pickupCD<=0){
      let best=null,bd=1e9;
      for(const p of allPlayers){ if(p.excluded||game.time<p.stunUntil) continue; const d=dist(p,ball); const r=p.isGK?0.95:0.6; if(d<r&&d<bd){bd=d;best=p;} }
      if(best) giveBall(best);
    }
  }
}
