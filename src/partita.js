// ================= CICLO DI GIOCO =================
import { bip, whistle } from './audio.js';
import { aiutoGuida, humanControl, updateCtrl } from './controllo.js';
import { DIFF, GW, PERIOD_LEN, clamp, dist, rnd } from './costanti.js';
import { movePlayer, separate, updateBall } from './fisica.js';
import { annuncia } from './cronaca.js';
import { aggiornaDifesa, aggiornaSchemi, pos01, rif01, aiCarrier, aiTarget, closestTo, steer, uomoDi } from './ia.js';
import { inp, pollInput, pressed, released } from './input.js';
import { fightOn, updateFight } from './lotta.js';
import { endMatch } from './menu.js';
import { areaFoul, avviaRigoriFinali, callPlay, concludiRigoreFinale, contrasto, deadBall, giveBall, kickoff, latoContrasto, pallaEsposta, preparaProssimoRigoreFinale, reenter, risolviRigoreDifferito, tackle, timeout } from './regole.js';
import { aggiornaScatto } from './espulsioni-tempi.js';
import { aggiornaAzione, annullaAzione, chiudiAzione, difensoriDavanti } from './statistiche.js';
import { allPlayers, ball, ctrl, game, goalX, other, setCtrl, teams } from './stato.js';
import { doShoot, startAct, updateActs, updateRecuperi } from './tiri.js';
import { aggiornaPanchina, obiettivoUscita } from './panchina.js';
import { obiettivoEspulso, obiettivoRientro, recuperoPozzetto } from './pozzetto.js';
import { aggiornaGiocoFermo } from './gioco-fermo.js';
import { CONTR_AI, PRESSING_CONSUMO } from './taratura.js';      // contrasto del computer (sezione 2) e fatica del pressing: numeri del bilanciamento
export { CONTR_AI, PRESSING_CONSUMO };
// Stessa risposta di nuoto e scivolamento nel gioco vivo e durante un tiro libero.
function muoviVerso(p,tg,dt){
  const dx=tg.x-p.x, dz=tg.z-p.z, d=Math.hypot(dx,dz);
  let mx=0,mz=0; if(d>0.12){ const s=Math.min(1,d/0.8); mx=dx/d*s; mz=dz/d*s; }
  if(d>1.0 && !tg.gk){ const st=steer(p,dx/d,dz/d,d); mx=st[0]; mz=st[1]; }
  // Anticipa l'arresto soltanto per la breve distanza di frenata effettiva.
  if(!tg.gk && !tg.sprint && d<Math.hypot(p.vx,p.vz)/8 && p.vx*dx+p.vz*dz>0){ mx=0; mz=0; }
  // SCIVOLAMENTO IN VERTICALE (v0.53, richiesta di Ale): gli spostamenti brevi si fanno restando dritti con la bicicletta,
  // in qualunque direzione, senza distendersi a crawl. Sotto 1,8 m si scivola, oltre 2,8 m si torna a nuotare (in mezzo resta la
  // scelta di prima, così non si alterna a ogni fotogramma). Ampiezza 0,48: sotto la soglia del nuoto di movePlayer (0,5).
  // chi difende su chi ha la palla non scivola: deve poter chiudere il tiro con la sua velocità piena
  const suPortatore=ball.holder&&ball.holder.team!==p.team&&uomoDi(p)===ball.holder;
  if(!tg.gk&&!tg.sprint&&!p.uscendo&&!p.excluded&&!suPortatore){
    if(d<1.8) p.scivolaAI=true; else if(d>2.8) p.scivolaAI=false;
    if(p.scivolaAI){ const k=Math.hypot(mx,mz); if(k>0.48){ mx*=0.48/k; mz*=0.48/k; } }
  } else p.scivolaAI=false;
  // v0.67: chi è lontano dal suo posto (oltre 4 m) scatta da solo, tranne nelle transizioni quando il posto dice «nuota» (SCATTI):
  // prima la regola dei 4 m faceva scattare tutti in ripartenza e in rientro fino a stamina 0,35, la soglia dei cambi
  const sprint = tg.gk ? false : ((tg.sprint && d>0.6) || (!tg.nuota && d>4 && p.stamina>0.35));
  if(tg.gk){ // spostamento laterale del portiere: di posizione (lento o svelto secondo Posizione) oppure in tuffo (Riflessi); stanco è più lento
    const fresco=0.75+0.25*p.stamina, sp=(tg.tuffo ? 1.6+2.2*rif01(p) : 1.1+1.3*pos01(p))*fresco; p.z+=clamp(tg.z-p.z,-sp*dt,sp*dt); mz=0;
  }
  movePlayer(p,mx,mz,sprint,dt);
}

function aggiornaMovimentiSuFallo(dt){
  const fermi=new Set(game.fermoFallo);
  aggiornaGiocoFermo(dt,false,game.fermoFallo);
  // Il cronometro è fermo, la lettura dei movimenti no: senza aggiornare i
  // riferimenti i marcatori inseguirebbero ancora le posizioni pre-fischio.
  for(const t of teams){t.postiT=t.rallT=t.centroT=-1;}
  for(const p of allPlayers){
    if(fermi.has(p)||p.excluded||game.time<p.stunUntil)continue;
    const a=uomoDi(p),k=Math.min(1,dt*(2+2*p.st.def*(p.team.human?1:DIFF()))*(p.team.defPlay===3?1.4:1));
    p.lagX+=(a.x-p.lagX)*k;p.lagZ+=(a.z-p.lagZ)*k;
  }
  for(const p of allPlayers){
    if(fermi.has(p))continue;
    if(p.excluded){
      const tg=obiettivoEspulso(p);
      if(tg)muoviVerso(p,tg,dt);
      else {movePlayer(p,0,0,false,dt);recuperoPozzetto(p,dt);}
      // Il pozzetto resta raggiungibile, ma la sanzione usa solo tempo effettivo.
      continue;
    }
    if(p===ctrl){
      const g=aiutoGuida(p,inp.x,inp.z);movePlayer(p,g[0],g[1],inp.sprint,dt);continue;
    }
    // Niente contrasti, passaggi o tiri nuovi prima della ripresa: continuano solo
    // il taglio/appoggio/rientro e la risposta alla nuova squadra in possesso.
    let tg=aiTarget(p);
    if(p.uscendo&&ball.holder!==p)tg=obiettivoUscita(p);
    tg=obiettivoRientro(p)||tg;
    if(tg)muoviVerso(p,tg,dt);else movePlayer(p,0,0,false,dt);
  }
  separate(fermi);
}

export function aggiornaRigoriFinali(dt){
  const serie=game.rigoriFinali;
  if(serie.fase==='attesa'){
    aggiornaGiocoFermo(dt);
    if(ball.state==='dead') updateBall(dt);
    serie.attesa-=dt;
    if(serie.attesa<=0){ if(serie.terminati) endMatch(); else preparaProssimoRigoreFinale(); }
    return;
  }
  const s=game.penalty;
  if(!s){ concludiRigoreFinale(false,'fuori'); return; }
  serie.tempoTiro+=dt; game.penT=serie.tempoTiro;
  updateActs(dt);
  if(serie.fase!=='tiro') return;
  // Solo il gesto e il volo della palla avanzano: cronometri, espulsioni, cambi e recupero restano fermi.
  for(const p of allPlayers){ p.vx=p.vz=0; p.oriz=Math.max(0,(p.oriz||0)-dt/0.25); }
  if(ball.holder===s){
    if(s.team.human&&!game.autoplay){
      setCtrl(s);
      if(inp.shoot){ s.charging=true; s.chargeT=Math.min(0.9,s.chargeT+dt); }
      if(!s.act&&s.charging&&released('shoot')){
        const pw=clamp(s.chargeT/0.9,0.5,1), az=Math.abs(inp.z)>0.3?inp.z:null;
        startAct(s,'shot',0,()=>doShoot(s,pw,false,az));
      }
      if((!s.act&&game.penT>=7)||game.penT>=7.5){ concludiRigoreFinale(false,'tempo'); return; }
    } else if(game.penT>1.3&&!s.act) startAct(s,'shot',0.3,()=>doShoot(s,0.8+rnd()*0.2,false,null));
  }
  updateBall(dt);
  if(serie.fase!=='tiro') return;
  // Lascia valido il palo-gol e una deviazione diretta in rete; chiude solo quando la palla torna verso il campo.
  if((ball.kind==='rebound'&&ball.vx*s.team.dir<0&&Math.abs(ball.x)<Math.abs(goalX(s.team))-0.2)||
    (ball.state==='free'&&Math.hypot(ball.vx,ball.vz)<1)||game.penT>=11)
    concludiRigoreFinale(false,ball.saveChecked?'parata':'fuori');
}
export function update(dt){
  pollInput();
  if(game.state==='menu'||game.state==='paused') return;
  risolviRigoreDifferito();
  if(game.state==='over'){ aggiornaGiocoFermo(dt); return; }
  if(game.rigoriFinali){ aggiornaRigoriFinali(dt); return; }
  if(game.state==='countdown'){
    aggiornaGiocoFermo(dt);
    game.timer-=dt;
    const n=Math.ceil(game.timer);
    if(n>0&&n!==game.contoVisto){ game.contoVisto=n; annuncia('conto',`${game.period}° tempo · ${n}`,{durata:0.9}); }
    aggiornaPanchina(dt,true);      // tra i tempi i cambi sono liberi
    if(game.timer<=0){ game.state='play'; game.contoVisto=0; whistle(0.5); annuncia('ripresa','Via!',{dettaglio:`inizio ${game.period}° tempo`,durata:1}); }
    return;
  }
  if(game.state==='stop'){
    if(game.fermoFallo?.length)aggiornaMovimentiSuFallo(dt);else aggiornaGiocoFermo(dt);
    if(ball.inRete) updateRecuperi(dt);
    aggiornaPanchina(dt,!!game.cambiLiberi);      // dopo un gol o nel time-out i cambi si fanno subito; su un fallo il cambio volante continua
    if(ball.state==='dead') updateBall(dt);
    game.timer-=dt;
    if(game.timer<=0){ const f=game.after; game.after=null; game.fermoFallo=null; game.state='play'; game.cambiLiberi=false; if(f) f(); }
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
        if(inp.shoot){ s.charging=true; s.chargeT=Math.min(0.9,s.chargeT+dt); }
        if(!s.act&&((s.charging&&released('shoot'))||game.penT>7)){
          const pw=clamp(s.chargeT/0.9,0.5,1), az=Math.abs(inp.z)>0.3?inp.z:null;
          startAct(s,'shot',0,()=>doShoot(s,pw,false,az));
        }
      } else if(game.penT>1.3&&!s.act) startAct(s,'shot',0.3,()=>doShoot(s,0.8+rnd()*0.2,false,null));
      updateBall(dt);
      return;
    }
  }
  if(!aggiornaScatto(dt))game.clock=Math.max(0,game.clock-dt);
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
    const a=uomoDi(p), k=Math.min(1,dt*(2+2*p.st.def*(p.team.human?1:DIFF()))*(p.team.defPlay===3?1.4:1));      // zona a M: scalate più rapide
    p.lagX+=(a.x-p.lagX)*k; p.lagZ+=(a.z-p.lagZ)*k;
  }
  // Un solo controller coordina entrata, liberazione dello spazio e copertura.
  for(const t of teams) aggiornaSchemi(t);
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
    // Chi taglia troppo presto sotto i 2 m rientra nuotando: nessuno spostamento
    // istantaneo dei compagni per correggere la posizione rispetto alla palla.
    if(!p.isGK&&!p.uscendo&&!game.penalty&&game.possTeam===p.team&&ball.state==='held'&&ball.holder!==p){
      const gx=goalX(p.team),qd=Math.abs(gx-p.x),bd=Math.abs(gx-ball.x);
      if(qd<2&&Math.abs(p.z)<GW+2&&qd<bd-0.3) tg={x:gx-p.team.dir*2.15,z:p.z,sprint:true};
    }
    if(!tg){ movePlayer(p,0,0,false,dt); continue; }
    muoviVerso(p,tg,dt);
    if(p.team.defPlay===2 && game.possTeam===other(p.team) && !p.isGK) p.stamina=Math.max(0,p.stamina-dt*PRESSING_CONSUMO);  // il pressing stanca (taratura.js)
    // pressing e contrasti dei difensori controllati dall'IA
    if(ball.holder && ball.holder.team!==p.team && !p.isGK && !ball.holder.isGK){
      if(fightOn(p,ball.holder)) continue;
      const marking = uomoDi(p)===ball.holder;
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
      q.areaT=(q.areaT||0)+dt;
      if(q.areaT>1.2){ q.areaT=0; areaFoul(q); return; }
    }
  }
  // palla tenuta: segue il giocatore
  updateBall(dt);
  if(game.state!=='play') return;
  aggiornaAzione(dt);
  // tempo per l'azione
  if(game.possTeam && game.shot<=0 && ball.state==='held'){
    chiudiAzione('tempo'); const opp=other(game.possTeam); whistle(0.4); bip(330,0.5,0.07); annuncia('possesso',"Tempo d'azione scaduto",{squadra:opp,dettaglio:`palla ${opp.short}`});
    const r=closestTo(opp,ball,false); ball.state='dead';
    deadBall(1.0,()=>giveBall(r));
  } else if(game.possTeam && game.shot<=0 && ball.state!=='flight'){
    game.shot=0;
  }
  // fine tempo
  // Il tiro partito in tempo e l'eventuale rigore differito devono avere un esito
  // prima della chiusura del periodo; il cronometro resta a zero.
  if(game.clock<=0 && game.state==='play'&&!game.rigoreDifferito&&
    !(ball.state==='flight'&&ball.daTiro)){
    game.clock=0; whistle(0.9); annullaAzione();      // l'azione interrotta dalla sirena non ha un esito
    if(game.period<4){
      annuncia('fine',`Fine ${game.period}° tempo`,{dettaglio:`${teams[0].short} ${teams[0].score} - ${teams[1].score} ${teams[1].short}`});
      ball.state='dead';
      deadBall(2.5,()=>{ game.period++; game.clock=PERIOD_LEN; kickoff(); });
    } else if(game.torneoMatch&&teams[0].score===teams[1].score) avviaRigoriFinali();
    else endMatch();
  }
}
