# Passaggio a Claude Code — WATERPOLO 7

## Prompt pronto da copiare

```text
Continua il progetto GitHub alessandrofarre1-wq/pallanuoto-3d per Ale.
Leggi prima CLAUDE.md (soprattutto lo stato più recente), questo documento,
docs/gameplay-prossimi-passi.md e docs/proposte/tornei-menu-arena.md.
Non chiedere ad Ale di rispiegare il progetto o le richieste già documentate.
La bozza home/torneo/pausa è conservata anche in
docs/proposte/menu-concept.html, con tre anteprime PNG nella stessa cartella.

Prima di modificare file, controlla lo stato remoto e locale: la PR 33/v0.38
è già stata unita a main. La consegna successiva è sul branch
codex/v039-cambi-proposte-handoff; verifica se la sua PR è aperta o già unita.
Non duplicare le modifiche e non pubblicare direttamente su main.

Priorità di Ale: il gameplay è macchinoso e non invoglia a rigiocare.
Rivedere comandi, AI dei compagni senza palla e AI avversaria.
Parti dalle cinque ipotesi nel piano gameplay, riproducile e misura.
Proponi e realizza una prima iterazione circoscritta su risposta dei comandi
e linee di passaggio offerte dai compagni; confronta prima/dopo con stessi
semi e scene touch. Non cambiare tutta la simulazione in un colpo.
Non promettere che il problema del divertimento sia risolto da test automatici.

Fatto nella v0.39: CAMBI in basso al centro, fondo semitrasparente, area
di tocco 44px; barra lotta al centroboa alzata per non sovrapporsi.
La v0.39 NON implementa tornei, nuova home/pausa, arena o nuova AI:
queste parti sono proposte documentate da discutere, con priorità al gameplay.

Richieste e vincoli di Ale:
- A ogni PR alza la versione di 0.01 e aggiorna CLAUDE.md con versione,
  cambiamenti, file, numeri realmente misurati e ciò che non è fatto.
- iPhone: strettamente meno di 100 oggetti/chiamate e meno di 150.000
  triangoli, anche con due cambi simultanei. Ale ha rifiutato le deroghe.
  Se una soluzione supera i limiti, correggila; non consegnarla come conforme.
- Prima di aprire la PR esegui npm run lint, npm run verifica e
  npm run aspetto. Scrivi esiti effettivi e limiti nella descrizione.
  Non chiamare PASS una verifica fallita e non rigenerare screenshot alla cieca.
- Segnala esplicitamente ogni decisione di CLAUDE.md che proponi di cambiare.
- Mantieni ritmo unico SPEED=1 e camera televisiva unica: non ripristinare
  le scelte lenta/media/veloce o vicina/normale/larga.
- Riflesso completo solo in alta; ombra dell'espulso presente; palla senza
  cerchio nero; carica MAX a 0,9 s, tiro al rilascio e gesti potenti/speciali.
- Lo sprint a tocchi è una scelta precedente di Ale: una sua modifica va
  dichiarata esplicitamente. Non confondere 'più giocabile' con SPEED più alto.
- Gioco su iPhone in orizzontale; controlla Safari piccolo, safe area e comandi.

Proposte già verificate da conservare:
- Mondiali maschili: formula Singapore2025, 16 squadre/4 gironi;
  prime ai quarti, seconde-terze allo spareggio, poi quarti/semi/finale.
  Campione in 6 o 7 gare. Tutte le 16 squadre esistono nel gioco.
- Europei maschili: formula Belgrado2026, 16 squadre/4 gironi;
  prime3 → due gruppi da6 (A+C, B+D), riportando risultati soltanto fra
  qualificate; 3 nuove partite, prime2 alle semifinali, poi finale.
  Nessun quarto di finale; campione in8 gare. Mancano 8 rose nazionali.
- Scegli nazionale, sorteggio casuale per fasce ufficiali salvato una volta,
  giochi le tue gare e simuli le altre; uscita all'eliminazione, eventuale
  bronzo giocabile/simulabile. Servono serie di rigori e classifiche complete.
- Due coppe distinte, premiazione finale breve e saltabile, bacheca permanente.
- Home/pausa ispirate a EA SPORTS FC26 mantenendo identità WATERPOLO7.
  Salvataggio completo da pausa è lavoro nuovo, non confonderlo con pausa
  esistente. Nessuna promessa di ripresa esatta finché non implementata/testata.
- Arena: prima porte e corde, poi bordi e tribune su gradoni. Acqua già curata.
- La porta GLB inviata ha 46.086tri e3 texture4K: non inserirla originale.
  Richiede proporzioni corrette (vano3x0,90m, pali75–80mm) e ricostruzione
  leggera, obiettivo400–500tri/porta e texture≤1024 da verificare in scena.
  Due copie originali darebbero una stima di240.456tri totali, fuori limite.
  Il file originale è conservato in dati-sorgente/modelli/porta-fornita.glb,
  fuori dal caricamento del gioco; anteprima in docs/proposte/porta-riferimento.png.
  Non dipendere dai percorsi /tmp degli allegati di una sessione precedente.

Continuità: mantieni questo documento aggiornato con commit/branch/PR,
controlli completati e prossimo passo concreto. Se si avvicina il limite
di sessione, salva, committa e spingi il branch su GitHub prima di iniziare
un nuovo blocco. Dichiara prima il perimetro concreto della prossima PR;
non promettere durate o consumi di credito che non puoi osservare.
Consegna una PR e un passaggio riprendibile. Nessun merge o deploy senza
istruzione di Ale. Non inviare messaggi ad altre persone.
```

## Stato persistente della consegna

- Base: `origin/main` al commit `01a1265` (merge PR 33, v0.38).
- Branch: `codex/v039-cambi-proposte-handoff`, versione 0.39.0.
- Modifica al gioco: `src/stile.css`, posizione/trasparenza CAMBI e posizione barra lotta.
- Documenti: proposta completa con fonti ufficiali, analisi preliminare gameplay, questo prompt.
- Verifiche completate finora: lint (0 errori, warning gx preesistente); HUD su tre iPhone/tre scene; CAMBI+lotta su 12 combinazioni viewport/margini; budget 97 oggetti/148.380 triangoli con due cambi simultanei su due iPhone. Verifica completa e aspetto in corso; PR ancora da aprire dopo questi controlli.
- Non fatto: revisione effettiva gameplay/AI; tornei; rose mancanti; rigori finali; nuovi menu; salvataggi completi; premi; integrazione porta e arena; prova su iPhone fisico.
