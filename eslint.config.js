import globals from 'globals';
// Controllo minimo: nessun nome non definito (import dimenticati) e nessun import inutile
export default [
  { files: ['src/**/*.js'], languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.browser },
    rules: { 'no-undef': 'error', 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] } },
  { files: ['tests/**/*.mjs', 'strumenti/**/*.mjs', 'strumenti/**/*.js', '*.js'], languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
    rules: { 'no-undef': 'error' } },
];
