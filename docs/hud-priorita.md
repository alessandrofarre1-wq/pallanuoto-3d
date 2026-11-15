# Cosa si vede in partita e quando (v0.44)

Richiesta di Ale (15/11/2026): «decidere se in certe condizioni alcune informazioni debbano sparire per dare spazio ad altre» e «sintetizzare i concetti conservandone il senso». Regola di base, già fissata nella v0.25: la partita (palla, giocatori, porte) ha sempre la precedenza; ai margini si vede solo ciò che serve **adesso**.

## Regole

1. **Sempre visibili** solo: tabellone (punteggio, tempo, tempo per l'azione), freccia sul giocatore controllato, comandi.
2. **Quando serve**: un elemento compare solo se il giocatore può farci qualcosa adesso, e sparisce appena non serve più.
3. **Testi brevi**: in partita si usano sigle (al massimo circa 10 caratteri per voce); la spiegazione completa sta nei menu (pausa, sezioni della squadra) o nel suggerimento al passaggio del mouse.
4. **Niente movimento inutile**: un indicatore che resta a schermo non si ridisegna da capo; cambiano solo i numeri e le barre.

## Elementi

| Elemento | Quando si vede | Priorità | Testo massimo |
|---|---|---|---|
| Tabellone | sempre | 1 | sigle squadre, punteggio, tempo, 28 |
| Notifiche (gol, rigore, time-out…) | per 2-3 s dopo l'evento, si riducono a una riga se la palla è vicina | 2 | titolo + una riga |
| Espulsione | linguetta sotto la squadra: aperta 2,6 s, poi chiusa «#7 0:12» con barra; «6 c 5» nel tabellone | 2 | «#num nome tempo» |
| Barra dell'uomo in più (v0.44) | si apre da sola a ogni superiorità; se non scegli niente si richiude dopo 5 s di gioco; dopo la scelta resta chiusa | 2 | «6c5 · 3-3›4-2 2/2» |
| Pulsante CAMBI (v0.44) | **solo** quando un cambio serve davvero (giocatore sotto il 50% di stamina o con 2 falli gravi, e può uscire adesso) o mentre un cambio è in corso | 3 | «Rossi → Bianchi» |
| Barra della lotta al centro (v0.44) | solo se riguarda te: controlli il centroboa o il suo marcatore, oppure la tua squadra attacca e il centroboa è tuo | 3 | sigle e numeri |
| Barra degli schemi (parità) | sempre; chiusa mostra solo lo schema in uso (ATT o DIF), aperta con un tocco | 4 | «ATT: Arco ▾» |
| PALOMB. | solo con la palla nostra | 3 | — |
| T.O. | sempre | 3 | — |
| Registro degli eventi | solo dal menu di pausa | — | — |
| Pannello del giocatore | 3 s dopo un cambio con CAMBIA e a inizio partita | 4 | numero, nome, barra |
| Carica del tiro | solo mentre carichi | 2 | percentuale / MAX |

## Cambiato nella v0.44

- **Espulsione che sfarfallava**: il riquadro veniva ricostruito da capo circa 20 volte al secondo (a ogni aggiornamento della barra del tempo). Ora si crea una volta sola e si aggiornano solo il tempo e la barra (`aggiornaStato` in `src/cronaca.js`; prova in `npm run cronaca`).
- **CAMBI**: prima era sempre a schermo in basso al centro, anche vuoto o con proposte non urgenti. Ora compare solo con un consiglio urgente o durante un cambio (`#tCambi` in `src/stile.css`). Le proposte non urgenti («partita storta», «in panchina c'è chi rende di più») restano nella schermata «Cambi e panchina» della pausa; il tasto B continua a far partire il consiglio del momento.
- **Uomo in più**: sigle al posto dei nomi lunghi («3-3›4-2» invece di «3-3 che diventa 4-2»), fase scritta «2/2», «4 Base» per il 4-2 della strategia, annuncio «6c5: sigla». Per gli schemi propri si può scegliere la sigla nell'editor (campo «Sigla in partita», 10 caratteri); senza sigla si usa l'inizio del nome. La barra si richiude da sola dopo 5 s se non si sceglie.
- **Lotta al centro**: la barra non compare più per lotte che non riguardano il giocatore (per esempio quando l'avversario attacca e tu controlli un'ala lontana).

## Decise da Ale (15/11/2026) e fatte

- **Pannello del giocatore**: si vede per 3 s quando cambi giocatore con CAMBIA e nei primi 3 s di partita, poi resta solo la freccia sopra la testa. I cambi automatici (passaggio al compagno con la palla, compagno più vicino in difesa) non lo riaccendono, altrimenti in difesa resterebbe sempre acceso. Con tastiera e mouse resta anche mentre carichi il tiro (c'è la barra della potenza). `hud.js` (classe `vis` su `#player`), `ultimoCambioManuale` in `controllo.js`.
- **PALOMB.**: visibile solo quando la tua squadra ha la palla (classe `nostra-palla` sul body).
- **Registro degli eventi**: tolto il pulsante a schermo; si apre dal menu di pausa («Eventi della partita»); chiudendolo si torna alla pausa. **Il T.O. resta sempre a schermo** (scelta di Ale).
- **Barra degli schemi**: resta sempre visibile e cambia contenuto in attacco (ATT) e in difesa (DIF); in superiorità mostra gli schemi dell'uomo in più. Era già così: nessuna modifica.

Misura (`npm run hud`, gioco normale): elementi a schermo da 13 a 10; interfaccia sul 18% dello schermo su iPhone SE (prima 21%), 14% su iPhone 15 (prima 17%), 12% su Pro Max (prima 14%).
