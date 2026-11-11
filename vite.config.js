import { defineConfig } from 'vite';
// base relativa: il gioco funziona sia su GitHub Pages (sottocartella) sia aperto da qualunque altro indirizzo
export default defineConfig({
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 6000 },
});
