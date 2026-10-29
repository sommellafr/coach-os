import { cp, mkdir, readFile, writeFile, lstat, rm, realpath } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { createHash } from 'node:crypto';

const root = await realpath(resolve(import.meta.dirname,'..'));
const output = resolve(root,'dist');
// La sola cartella rigenerabile è <progetto>/dist; rifiutare collegamenti.
if(dirname(output)!==root || basename(output)!=='dist') throw Error('Destinazione build non sicura.');
const existing=await lstat(output).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
if(existing?.isSymbolicLink()) throw Error('dist è un collegamento: build annullata senza rimuoverlo.');
const manifest=JSON.parse(await readFile(resolve(root,'data/recipe-sources.json'),'utf8'));
if(manifest.sources.length!==31) throw Error('Manifest fonti incompleto.');
for(const source of manifest.sources) {
  const file=resolve(root,source.file);
  if(dirname(file)!==resolve(root,'assets/recipes') || !/^recipe-source-\d{2}\.jpeg$/.test(basename(file))) throw Error('Percorso fonte inatteso.');
  if((await lstat(file)).isSymbolicLink()) throw Error('Una fonte è un collegamento, build annullata.');
  const sha=createHash('sha256').update(await readFile(file)).digest('hex');
  if(sha!==source.sha256) throw Error(`Integrità fonte non valida: ${source.source_id}`);
}
await rm(output,{recursive:true,force:true});
await mkdir(output);
for(const name of ['index.html','src','assets','data/recipes.json','data/recipe-sources.json']) {
  await mkdir(dirname(resolve(output,name)),{recursive:true});
  await cp(resolve(root,name),resolve(output,name),{recursive:true,dereference:false,filter:async file=>{
    if((await lstat(file)).isSymbolicLink()) throw Error('Collegamenti non ammessi nel sito.');
    return true;
  }});
}
await writeFile(resolve(output,'.nojekyll'),'');
console.log('Build pronta in dist/: app, catalogo e immagini. Nessun diario del browser viene letto.');
