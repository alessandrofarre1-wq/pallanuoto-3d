import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
// versione del prototipo: una sola, quella di package.json; si alza a ogni pull request e il gioco la mostra in home e in pausa
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
// base relativa: il gioco funziona sia su GitHub Pages (sottocartella) sia aperto da qualunque altro indirizzo
export default defineConfig({
  base: './',
  define: { __VERSIONE__: JSON.stringify(version.replace(/\.0$/, '')) },
  build: { outDir: 'dist', chunkSizeWarningLimit: 6000 },
});
