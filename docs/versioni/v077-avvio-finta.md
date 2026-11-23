# v0.77 — ingresso fluido nella finta

Il nuovo video di Ale mostra un avvio molto rapido prima delle finte più lente. Base main `7218d09`, PR67 unita e CI45246753540 verde; ramo `codex/v077-avvio-finta`, versione0.77.0. Verificati main, PR recenti e diff; nessun lavoro di Claude sovrapposto.

## Causa e correzione

La v0.76 aveva corretto ripetizione e recupero ma continuava a comprimere quasi5,9s della preparazione Plask nei primi0,5s; la base entrava inoltre in0,1s. Il test precedente misurava i cicli dopo la piena carica e non vedeva questo difetto iniziale.

Durante la tenuta umana il disegno parte ora dalla posa davvero mostrata in acqua e raggiunge gradualmente la posa caricata di Plask in0,70s. La prima finta si sovrappone al raccordo, senza un cambio di animazione: stesso gesto additivo della v0.76, stessa cadenza. Le rotazioni si raccordano nella gerarchia locale delle ossa, così dita e polso seguono i genitori. Uscita/annullamento partono dall’ultima posa mostrata; cache invalidata al cambio d’identità o salto di tempo.

**Decisione superata:** nella tenuta non si riproduce più accelerato l’intero prefisso della clip prima della prima finta. Il file originale, le415pose/52ossa e i dati generati sono integri; la posa caricata e la parte registrata di rilascio/recupero rimangono utilizzate. I tiri diretti/CPU conservano il percorso precedente. Non dichiarare quindi “tutta la preparazione registrata riprodotta durante la tenuta”.

Nessuna modifica a GLB/rig/pesi/viso/nuoto. Modello SHA256 `8fd658a8a89ad0dd242100133daf920eb6cfa492af8f39e95f6ff92124ba6745`. Controlli, massimo0,9s, prima finta0,45s e tempi0,16+0,18+0,36s invariati. Rilasciare prima dei0,70s avvia comunque subito il tiro, con la potenza fisica maturata.

## File e prove

Produzione: `src/finta-movimento.js` aggiunge soltanto la durata dell’ingresso visuale; `src/grafica/tiro-plask-vista.js` conserva la posa reale e raccorda le catene locali. Nessun nuovo oggetto disegnato. Il test esistente `tests/finta-fluida-v076.mjs` ora include i primi1,2s a60Hz e quattro rilasci a0,4s; mantiene48cicli e24rilasci precedenti. Package e documentazione aggiornati.

Stesso test prima/dopo:24scene (6stili×2mani×2direzioni),120violazioni d’avvio→0. Salto massimo/frame: anca0,593→0,038rad, torso1,006→0,032rad, mano0,419→0,076m. Nessuna soglia abbassata. Otto pose dalla prima pressione a1,15s ispezionate, stessa camera. Questo verifica il raccordo, non certifica qualità professionale o FPS su iPhone fisico.

[Misure, immagini, fasi ed esiti locali](../verifiche/v077/README.md). Locale: 10/10 prove mirate PASS, nuovo test d’avvio separato PASS; verifica0partite e5confronti ispezionati PASS, aspetto completo PASS (0/8539,0/4316,0/1229 gambe fuori acqua;6viste ispezionate). Due cambi/anello68call/139200tri; replay49/136678; massimo ravvicinato146138tri. Nessun riferimento modificato. Le sei partite standard vengono eseguite una sola volta nella CI completa finale; esito e SHA nella PR. Non attribuire una CI precedente a questa versione.

## Non fatto

Nessun nuovo gesto, modello, volto, rig, interfaccia o bilanciamento generale; nessuna modifica a tiro fisico, precisione/potenza, regole o tattiche. Conservati14corpi, logoC, camera diretta, SPEED1, CAMBI basso centro44px e riflesso solo alta. Limiti iPhone <100chiamate/<150000triangoli anche cambi/replay. Naturalezza da confermare giocando con Ale; nessun merge/deploy.
