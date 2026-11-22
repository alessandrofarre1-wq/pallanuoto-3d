// Ricostruisce solo mani/polsi: il viso e le 24 giunture del corpo restano quelli della v0.72.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mani-v073-'));
const candidato=path.join(temp,'mani.glb'),runtime=path.join(root,'src/grafica/modelli/pallanuotista.glb');
const esegui=(cmd,args)=>execFileSync(cmd,args,{cwd:root,stdio:'inherit'});
esegui(process.env.RIG_BLENDER||'blender',['-b','-t','2','--python','strumenti/blender/runtime-mani.py','--','--output',candidato]);
esegui(process.execPath,['strumenti/compatta-glb.mjs',candidato]);
fs.copyFileSync(candidato,runtime);
esegui(process.execPath,['strumenti/riserva-leggera.mjs']);
esegui(process.execPath,['tests/rig-mani-v073.mjs','--salva=modelli-sorgente/pallanuotista/v073/qa-rig-mani.json']);
