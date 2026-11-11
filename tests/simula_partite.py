"""Gioca partite intere senza grafica (Three.js sostituito da un finto modulo) e stampa errori e statistiche.
Uso: python3 tests/simula_partite.py   (richiede playwright con chromium)"""
import asyncio, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        mock = (ROOT / 'tests' / 'mock-three.js').read_text()
        await pg.route('**/three.min.js', lambda r: r.fulfill(body=mock, content_type='application/javascript'))
        await pg.goto((ROOT / 'index.html').as_uri()); await pg.wait_for_timeout(300)
        await pg.click('#goBtn')
        res = await pg.evaluate('''() => {
          const c={}; showMsg=(t)=>{ const k=t.replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim().replace(/#\\d+.*/,'').slice(0,40); c[k]=(c[k]||0)+1; };
          let shots=0, goals=0; const oS=doShoot; doShoot=function(){ shots++; return oS.apply(this,arguments); };
          const oG=goalScored; goalScored=function(){ goals++; return oG.apply(this,arguments); };
          for(let i=0;i<60*60*14;i++){ update(1/60); if(game.state==='over')break; }
          return {punteggio:teams[0].score+'-'+teams[1].score, tiri:shots, gol:goals, eventi:c};
        }''')
        print(res); print('errori:', errs or 'nessuno'); await b.close()
asyncio.run(main())
