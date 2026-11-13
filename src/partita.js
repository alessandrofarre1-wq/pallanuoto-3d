// ================= CICLO DI GIOCO =================
import { bip, whistle } from './audio.js';
import { aiutoGuida, humanControl, updateCtrl } from './controllo.js';
import { DIFF, GW, MARK, PERIOD_LEN, clamp, dist, rnd } from './costanti.js';
import { movePlayer, separate, updateBall } from './fisica.js';
import { annuncia } from './cronaca.js';
import { aggiornaDifesa, pos01, rif01, aiCarrier, aiTarget, closestTo, manUp, startCut, steer } from './ia.js';
import { inp, pollInput, pressed, released } from './input.js';
import { fightOn, updateFight } from './lotta.js';
import { endMatch } from './menu.js';
import { areaFoul, callPlay, contrasto, deadBall, giveBall, kickoff, latoContrasto, pallaEsposta, reenter, tackle, timeout } from './regole.js';
import { difensoriDavanti } from './statistiche.js';
import { allPlayers, ball, ctrl, game, goalX, other, setCtrl, teams } from './stato.js';
import { doShoot, startAct, updateActs } from './tiri.js';
import { aggiornaPanchina, obiettivoUscita } from './panchina.js';
import { obiettivoEspulso, obiettivoRientro, recuperoPozzetto } from './pozzetto.js';
export const CONTR_AI={ ritmo:1.5, insiste:2.0, fallo:0.2, indisciplina:0.4 };      // contrasto del computer (sezione 2)
export function update(dt){
  pollInput();
  if(pressed('cam')) game.camMode=1-game.camMode;
  if(game.state==='menu'||game.state==='paused'||game.state==='over') return;
  if(game.state==='countdown'){
    game.timer-=dt;
    const n=Math.ceil(game.timer);
    if(n>0&&n!==game.contoVisto){ game.contoVisto=n; annuncia('conto',`${game.period}° tempo · ${n}`,{durata:0.9}); }
    aggiornaPanchina(dt,true);      // tra i tempi i cambi sono liberi
    if(game.timer<=0){ game.state='play'; game.contoVisto=0; whistle(0.5); annuncia('ripresa','Via!',{dettaglio:`inizio ${game.period}° tempo`,durata:1}); }
    return;
  }
  if(game.state==='stop'){
    aggiornaPanchina(dt,!!game.cambiLiberi);      // dopo un gol o nel time-out i cambi si fanno subito; su un fallo il cambio volante continua
    for(const p of allPlayers){ p.vx*=0.9; p.vz*=0.9; }
    if(ball.state==='dead') updateBall(dt);
    game.timer-=dt;
    if(game.timer<=0){ const f=game.after; game.after=null; game.state='play'; game.cambiLiberi=false; if(f) f(); }
    return;
  }
  // --- gioco attivo ---
  game.time+=dt;
  for(let i=0;i<4;i++) if(pressed('p'+(i+1))) callPlay(i);
  updateActs(dt);
  if(game.state!=='play') return;
  if(game.penalty){
    const s=game.penalty;
    if(ball.holder!==s) game.penalty=null;
    else {
      game.penT+=dt;
      for(const p of allPlayers) if(!p.excluded) movePlayer(p,0,0,false,dt);
      if(s.team.human){
        setCtrl(s);
        if(inp.shoot){ s.charging=true; s.chargeT+=dt; }
        if(!s.act&&((s.charging&&(released('shoot')||s.chargeT>1.4))||game.penT>7)){
          const pw=clamp(s.chargeT/0.9,0.5,1), az=Math.abs(inp.z)>0.3?inp.z:null;
          startAct(s,'shot',0,()=>doShoot(s,pw,false,az));
        }
      } else if(game.penT>1.3&&!s.act) startAct(s,'shot',0.3,()=>doShoot(s,0.8+rnd()*0.2,false,null));
      updateBall(dt);
      return;
    }
  }
  game.clock-=dt;
  if(game.possTeam && !ball.afterShot) game.shot-=dt;     // dopo un tiro respinto il cronometro riparte solo quando qualcuno riprende palla
  if(pressed('to')) { timeout(teams[0]); if(game.state!=='play') return; }
  // rientro espulsi
  // espulsi: nuotano al pozzetto, lì recuperano; rientrano solo dal pozzetto (fine del tempo o palla riconquistata)
  for(const p of allPlayers) if(p.excluded){
    const o=obiettivoEspulso(p);
    if(o){ const dx=o.x-p.x, dz=o.z-p.z, d=Math.hypot(dx,dz)||1; movePlayer(p,dx/d,dz/d,o.sprint,dt); }
    else { movePlayer(p,0,0,false,dt); p.fx=0; p.fz=1; recuperoPozzetto(p,dt); }
    if(p.alPozzetto && (game.time>=p.exclUntil || p.puoRientrare)){ const presto=game.time<p.exclUntil; reenter(p); annuncia('info','Rientro',{p,dettaglio:presto?'palla riconquistata':'fine espulsione'}); }
  }
  // ritardo di reazione dei marcatori
  for(const p of allPlayers){
    if(p.excluded||game.time<p.stunUntil) continue;      // chi ha abboccato a una finta resta indietro
    const a=other(p.team).players[MARK[p.i]], k=Math.min(1,dt*(2+2*p.st.def*(p.team.human?1:DIFF()))*(p.team.defPlay===3?1.4:1));      // zona a M: scalate più rapide
    p.lagX+=(a.x-p.lagX)*k; p.lagZ+=(a.z-p.lagZ)*k;
  }
  // entrate (tagli) della squadra in attacco
  for(const t of teams){
    const h=ball.holder;
    // palla all'ala: il mezzo dello stesso lato (il "2") attacca lo spazio lasciato dal suo marcatore che si è abbassato
    if(game.possTeam===t&&h&&h.team===t&&(h.i===2||h.i===3)&&t.alaConPalla!==h){ t.alaConPalla=h; const m=t.players[h.i+2]; if(m!==ctrl&&!m.excluded&&!m.cut&&!manUp(t)) startCut(m); }
    if(h&&h.team===t&&h.i!==2&&h.i!==3) t.alaConPalla=null;
    if(game.possTeam!==t||!h||h.team!==t||h.isGK||t.atkPlay===3||manUp(t)) continue;
    if(Math.abs(goalX(t)-h.x)>10||game.time<t.nextDrive) continue;
    let b=null,bd=-1;
    for(const q of t.players){ if(q.i<4||q.excluded||q===h||q===ctrl||q.cut) continue; const d=dist(q,ball); if(d>bd){bd=d;b=q;} }
    if(b) startCut(b);
    t.nextDrive=game.time+(t.atkPlay===1?4.5:10+rnd()*5);
  }
  for(const t of teams) aggiornaDifesa(t,dt);
  aggiornaPanchina(dt);      // stamina delle riserve e cambi volanti (panchina.js)
  updateCtrl();
  for(const p of allPlayers){
    if(p.excluded) continue;
    p.tackleCD-=dt;
    if(p===ctrl){
      humanControl(p,dt);
      if(game.state!=='play') return;
      const h=ball.holder;
      if(p.lunge>game.time && h && h.team!==p.team){
        const dx=h.x-p.x, dz=h.z-p.z, d=Math.hypot(dx,dz)||1;
        if(d<=1.3){ p.lunge=0; contrasto(p,h); if(game.state!=='play') return; }
        movePlayer(p,dx/d,dz/d,true,dt);
      } else { p.lunge=0; const g=aiutoGuida(p,inp.x,inp.z); movePlayer(p,g[0],g[1],inp.sprint,dt); }
      continue;
    }
    let tg;
    if(ball.holder===p && !p.team.human){ aiCarrier(p,dt); tg=p.target; }
    else tg=aiTarget(p);
    if(ball.holder===p && p.team.human && p!==ctrl){ aiCarrier(p,dt); tg=p.target; }
    if(p.uscendo && ball.holder!==p) tg=obiettivoUscita(p);      // cambio volante: va alla zona dei cambi
    { const r=obiettivoRientro(p); if(r) tg=r; }      // appena rientrato dal pozzetto: controfuga o difesa sul portatore
    if(!tg){ movePlayer(p,0,0,false,dt); continue; }
    const dx=tg.x-p.x, dz=tg.z-p.z, d=Math.hypot(dx,dz);
    let mx=0,mz=0; if(d>0.12){ const s=Math.min(1,d/0.8); mx=dx/d*s; mz=dz/d*s; }
    if(d>1.0 && !tg.gk){ const st=steer(p,dx/d,dz/d,d); mx=st[0]; mz=st[1]; }
    // il corpo scivola: chi sta arrivando al suo posto smette di nuotare in anticipo e si lascia portare
    if(!tg.gk && !tg.sprint && d<Math.hypot(p.vx,p.vz)/1.5 && p.vx*dx+p.vz*dz>0){ mx=0; mz=0; }
    const sprint = tg.gk ? false : ((tg.sprint && d>0.6) || (d>4 && p.stamina>0.35));
    if(tg.gk){ // spostamento laterale del portiere: di posizione (lento o svelto secondo Posizione) oppure in tuffo (Riflessi); stanco è più lento
      const fresco=0.75+0.25*p.stamina, sp=(tg.tuffo ? 1.6+2.2*rif01(p) : 1.1+1.3*pos01(p))*fresco; p.z+=clamp(tg.z-p.z,-sp*dt,sp*dt); mz=0;
    }
    movePlayer(p,mx,mz,sprint,dt);
    if(p.team.defPlay===2 && game.possTeam===other(p.team) && !p.isGK) p.stamina=Math.max(0,p.stamina-dt*0.012);  // il pressing stanca
    // pressing e contrasti dei difensori controllati dall'IA
    if(ball.holder && ball.holder.team!==p.team && !p.isGK && !ball.holder.isGK){
      if(fightOn(p,ball.holder)) continue;
      const marking = other(p.team).players[MARK[p.i]]===ball.holder;
      if((marking||dist(p,ball.holder)<0.9) && dist(p,ball.holder)<1.0){
        // il computer difende con la stessa logica: prova a rubare quando la palla è esposta e non arriva da dietro; chi ha poca
        // Disciplina ci prova anche quando non dovrebbe; in controfuga, superato, spende il fallo per fermare l'azione
        const c=ball.holder, lato=latoContrasto(p,c), palla=pallaEsposta(c), dis=(p.s.dis-40)/59;
        const fuga=game.time-(game.possT||0)<11 && difensoriDavanti(c)<=1 && Math.abs(goalX(c.team)-c.x)>6.5;
        if(fuga && rnd()<dt*(1.2+1.2*(p.s.dif-40)/59)) tackle(p,c,{voluto:true,origine:'fuga'});
        else {
          const voglia=(lato==='dietro'?0.25+0.9*(1-dis):1)*(palla==='alzata'?0.3+0.8*(1-dis):palla==='palleggio'?1.4:1);
          // stessa regola del giocatore: disturbo a tocchi; il terzo tocco ravvicinato è fallo, e il computer insiste di rado
          // (di più chi ha poca Disciplina)
          const recenti=(p.colpi||[]).filter(t=>game.time-t<1.5).length;
          // (tarato sulla v0.28: circa 30 falli e 12-13 espulsioni per squadra a partita, come prima del contrasto a tocchi)
          if(rnd()<dt*CONTR_AI.ritmo*(recenti>=1?CONTR_AI.insiste:1)*voglia*(p.team.defPlay===2?1.2:1) && (recenti<2 || rnd()<CONTR_AI.fallo+CONTR_AI.indisciplina*(1-dis))) contrasto(p,c);
        }
      }
      if(game.state!=='play') return;
    }
  }
  // chi è sotto pressione si gira a proteggere la palla: di spalle al difensore (corpo tra palla e avversario)
  { const h=ball.holder;
    if(h && h.pressatoUntil>game.time && h.pressatoDa && Math.hypot(h.vx,h.vz)<1.0){
      const d=h.pressatoDa, ax=h.x-d.x, az=h.z-d.z, l=Math.hypot(ax,az)||1, k=Math.min(1,dt*6);
      h.fx+=(ax/l-h.fx)*k; h.fz+=(az/l-h.fz)*k; const m=Math.hypot(h.fx,h.fz)||1; h.fx/=m; h.fz/=m;
    } }
  separate();
  updateFight(dt);
  if(game.state!=='play') return;
  // area di porta (art. 8.2.8): dalla linea di porta ai 2 metri, fino a 2 m oltre ciascun palo. La regola vale SOLO qui dentro:
  // un'ala fuori dall'area ma dentro i 2 metri può ricevere e tirare.
  for(const t of teams){
    if(game.possTeam!==t) continue;
    const gx=goalX(t), bd=Math.abs(gx-ball.x);
    for(const q of t.players){
      const qd=Math.abs(gx-q.x);
      if(q.excluded||q.isGK||ball.holder===q||ball.state==='flight'||!(qd<2&&Math.abs(q.z)<GW+2&&qd<bd-0.3)){ q.areaT=0; continue; }
      if(q!==ctrl){ q.x=gx-t.dir*2.05; q.areaT=0; continue; }      // i compagni gestiti dal computer ne restano fuori
      q.areaT=(q.areaT||0)+dt;
      if(q.areaT>1.2){ q.areaT=0; areaFoul(q); return; }
    }
  }
  // palla tenuta: segue il giocatore
  updateBall(dt);
  if(game.state!=='play') return;
  // tempo per l'azione
  if(game.possTeam && game.shot<=0 && ball.state==='held'){
    const opp=other(game.possTeam); whistle(0.4); bip(330,0.5,0.07); annuncia('possesso',"Tempo d'azione scaduto",{squadra:opp,dettaglio:`palla ${opp.short}`});
    const r=closestTo(opp,ball,false); ball.state='dead';
    deadBall(1.0,()=>giveBall(r));
  } else if(game.possTeam && game.shot<=0 && ball.state!=='flight'){
    game.shot=0;
  }
  // fine tempo
  if(game.clock<=0 && game.state==='play'){
    game.clock=0; whistle(0.9);
    if(game.period<4){
      annuncia('fine',`Fine ${game.period}° tempo`,{dettaglio:`${teams[0].short} ${teams[0].score} - ${teams[1].score} ${teams[1].short}`});
      ball.state='dead';
      deadBall(2.5,()=>{ game.period++; game.clock=PERIOD_LEN; kickoff(); });
    } else endMatch();
  }
}
