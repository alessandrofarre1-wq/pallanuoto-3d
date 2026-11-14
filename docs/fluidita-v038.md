# v0.38 — grafica e regolarità dei fotogrammi

La qualità automatica ora misura finestre di un secondo: riduce la risoluzione
se per due finestre consecutive la media supera 19 ms oppure oltre il 10% dei
fotogrammi dura più di 22 ms. Un singolo scatto non basta. Passi di DPR da 0,125,
minimo 1 (o il valore iniziale se inferiore); dopo 12 secondi stabili recupera
un passo fino al valore iniziale. Menu, pausa, orientamento verticale in partita
e ritorno dall'altra app azzerano la misura. Si misura il tempo reale, prima
del limite usato dalla simulazione.

Il riflesso dell'acqua rimane attivo: si adatta la risoluzione senza eliminare
illuminazione, modelli, normali, onde o effetti. La simulazione e i comandi non
cambiano. I vettori temporanei delle braccia vengono riutilizzati per ridurre
le allocazioni durante l'animazione, mantenendo gli stessi calcoli.

Verifica automatica: `npm run qualita` (regolarità, scatti isolati e ripetuti,
limiti, recupero, menu, ritorno dall'app). Build e lint. Le soglie sono iniziali:
la misura su un iPhone reale resta necessaria per valutare il compromesso
visivo e gli scatti; i test sintetici non dimostrano 60 fps sul dispositivo.
