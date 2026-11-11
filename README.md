# Pallanuoto 3D

Gioco di pallanuoto 3D nel browser: Italia contro Ungheria, regole World Aquatics 2026, schemi, lotta al centro, tastiera, controller e comandi touch.

**Gioca:** https://alessandrofarre1-wq.github.io/pallanuoto-3d/ (si aggiorna da solo a ogni modifica del ramo `main`).

## Come è fatto

| Cartella / file | Contenuto |
|---|---|
| `index.html` | la pagina: menu, tabellone, pulsanti touch |
| `src/main.js` | avvio e ciclo di gioco |
| `src/regole.js`, `src/partita.js`, `src/lotta.js` | regole, fasi della partita, lotta al centro |
| `src/fisica.js`, `src/tiri.js` | movimento in acqua, palla, passaggi e tiri |
| `src/ia.js` | intelligenza dei giocatori del computer |
| `src/grafica/` | scena 3D, acqua, modello dei giocatori, pose, telecamera |
| `src/input.js`, `src/controllo.js` | tastiera, controller, touch e comandi del giocatore |
| `src/hud.js`, `src/menu.js`, `src/audio.js`, `src/stile.css` | tabellone, menu, fischio, aspetto |
| `src/costanti.js`, `src/stato.js`, `src/giocatori.js` | misure del campo, stato della partita, squadre |
| `legacy/` | la v0.9 in un solo file (con la sua vecchia libreria Three.js), tenuta come termine di paragone |
| `tests/verifica.mjs` | verifica automatica: partite simulate + screenshot |
| `CLAUDE.md` | memoria del progetto per Claude Code |

## Comandi

```bash
npm install          # la prima volta
npm run dev          # gioca in locale mentre si modifica
npm run build        # costruisce la versione da pubblicare (cartella dist/)
npm run lint         # controlla che non ci siano nomi sbagliati nel codice
npm run verifica     # partite simulate + screenshot confrontati con il riferimento
```

`npm run verifica` gioca partite intere a velocità accelerata con il caso "bloccato" e controlla che siano identiche a quelle della v0.9, poi scatta 5 screenshot (menu, sprint iniziale, azione, iPhone verticale e orizzontale) e li confronta con quelli in `tests/screenshot/riferimento/`. Le immagini affiancate prima/dopo finiscono in `tests/screenshot/confronto/`. Quando un cambiamento d'aspetto è voluto: `npm run verifica:aggiorna`.

## Pubblicazione

GitHub Actions (`.github/workflows/pages.yml`) costruisce, verifica e pubblica su GitHub Pages a ogni modifica di `main`. Serve una sola impostazione nel repository: **Settings → Pages → Source: GitHub Actions**.
