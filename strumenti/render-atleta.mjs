// Render di un modello di atleta in posa neutra (fronte, fianco, schiena, viso), per controllarlo a occhio e confrontarlo con un
// riferimento. Uso: node strumenti/render-atleta.mjs <cartella con atleta-X.glb, pelle-*.jpg, misure.json> <uscita.png>
//   [--corpo=k] [--pelle=k-young_caucasian_male] [--num=7] [--calottina=#1d3f9f] [--costume=#1d3f9f] [--morph=nome:1,nome:0.5]
import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const QUI = path.dirname(fileURLToPath(import.meta.url));
const [CARTELLA, USCITA] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const opz = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const corpo = opz('corpo', 'k'), misure = JSON.parse(fs.readFileSync(path.join(CARTELLA, 'misure.json'), 'utf8'));
const pelle = opz('pelle', misure.pelli.find(p => p.corporatura === corpo).pelle);
const server = await createServer({ root: path.join(QUI, 'converti'), logLevel: 'warn', server: { port: 4195, host: '127.0.0.1', fs: { allow: [path.join(QUI, '..')] } } });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 1600, height: 900 } });
pg.on('pageerror', e => console.error('errore nella pagina:', e.message)); pg.on('console', m => { if (m.type() === 'error') console.error(m.text().slice(0, 300)); });
await pg.goto(server.resolvedUrls.local[0] + 'vedi.html'); await pg.waitForFunction('window.pronto', null, { polling: 100 });
const morph = Object.fromEntries(opz('morph', '').split(',').filter(Boolean).map(x => { const [k, v] = x.split(':'); return [k, +v || 1]; }));
const info = await pg.evaluate(a => window.mostra(a), { glb: fs.readFileSync(path.join(CARTELLA, `atleta-${corpo}.glb`)).toString('base64'), pelle: fs.readFileSync(path.join(CARTELLA, `pelle-${pelle}.jpg`)).toString('base64'),
  misure: misure.corporature[corpo], num: +opz('num', 7), largo: 1600, alto: 900, morph,
  colori: { calottina: opz('calottina', '#1d3f9f'), costume: opz('costume', '#1d3f9f'), paraorecchie: '#f4f4f0', testo: '#ffffff' } });
await pg.locator('#c').screenshot({ path: USCITA });
console.log(`${path.basename(USCITA)}: ${Math.round(info.triangoli)} triangoli${info.morph.length ? ', espressioni: ' + info.morph.join(', ') : ''}`);
await browser.close(); await server.close();
