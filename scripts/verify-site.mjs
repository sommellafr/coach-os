import { readFile, readdir, lstat } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'..','dist');
const files=[];
async function walk(directory) {
  for(const name of await readdir(directory)) {
    const path=resolve(directory,name);const info=await lstat(path);
    assert.ok(!info.isSymbolicLink(),'Nessun collegamento simbolico nel sito');
    if(info.isDirectory()) await walk(path); else files.push(relative(root,path).replaceAll('\\','/'));
  }
}
await walk(root);
assert.ok(files.includes('index.html')&&files.includes('.nojekyll'));
assert.ok(files.every(file=>file==='index.html'||file==='.nojekyll'||/^src\/[a-z-]+\.(js|css)$/.test(file)||/^assets\/favicon\.svg$/.test(file)||/^assets\/recipes\/recipe-source-\d{2}\.jpeg$/.test(file)||/^data\/(recipes|recipe-sources)\.json$/.test(file)), 'Il sito contiene solo i file previsti');
const origin='https://example.github.io';const base=`${origin}/coach-os/`;
for(const file of files.filter(file=>['.html','.js','.css'].includes(extname(file)))) {
  const contents=await readFile(resolve(root,file),'utf8');
  assert.ok(!/(?:href|src)=["']\/(?!\/)/.test(contents),`Percorso assoluto nel sito: ${file}`);
  const references=extname(file)==='.html' ? [...contents.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map(m=>m[1]) : extname(file)==='.js' ? [...contents.matchAll(/^\s*import\s+(?:.*?\s+from\s+)?['"]([^'"\n]+)['"]/gm)].map(m=>m[1]) : [];
  for(const reference of references) {
    if(reference.startsWith('#')) continue;
    const url=new URL(reference,new URL(file,base));
    assert.equal(url.origin,origin);assert.ok(url.pathname.startsWith('/coach-os/'),`Risorsa fuori dal repository: ${reference}`);
    assert.ok(files.includes(decodeURIComponent(url.pathname.slice('/coach-os/'.length))),`Risorsa mancante: ${reference}`);
  }
}
const manifest=JSON.parse(await readFile(resolve(root,'data/recipe-sources.json'),'utf8'));
for(const source of manifest.sources) assert.equal(createHash('sha256').update(await readFile(resolve(root,source.file))).digest('hex'),source.sha256);
const {loadCatalog,renderRecipeLibrary}=await import(pathToFileURL(resolve(root,'src/recipes.js')).href);
await loadCatalog(async url=>{assert.equal(new URL(url).href,pathToFileURL(resolve(root,'data/recipes.json')).href);return {ok:true,json:async()=>JSON.parse(await readFile(resolve(root,'data/recipes.json'),'utf8'))};});
const catalog=JSON.parse(await readFile(resolve(root,'data/recipes.json'),'utf8'));
const detail=renderRecipeLibrary({catalog,selectedId:catalog.recipes[0].id});
assert.ok(detail.includes(pathToFileURL(resolve(root,'assets/recipes/recipe-source-01.jpeg')).href),'Immagini risolte dalla posizione del modulo');
console.log(`OK: ${files.length} file del sito, percorsi sotto /coach-os/, 31 hash e caricamento catalogo verificati.`);
