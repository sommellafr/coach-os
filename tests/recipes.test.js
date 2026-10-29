import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCatalog, loadCatalog, scaleRecipe, filterRecipes, renderRecipeLibrary } from '../src/recipes.js';
const catalog = JSON.parse(readFileSync(new URL('../data/recipes.json',import.meta.url),'utf8'));
const manifest = JSON.parse(readFileSync(new URL('../data/recipe-sources.json',import.meta.url),'utf8'));
const recipe = id => catalog.recipes.find(r=>r.id === id);
test('tutte le 31 fonti lette sono collegate alle 34 ricette, senza orfani o ID duplicati',()=>{
  validateCatalog(catalog);
  assert.equal(catalog.recipes.length,34);
  assert.equal(manifest.sources.length,31);
  for(const source of manifest.sources) {
    assert.equal(source.transcription_status,'visually_reviewed');
    assert.ok(source.recipe_ids.length > 0);
    for(const id of source.recipe_ids) assert.ok(recipe(id)?.sourceIds.includes(source.source_id));
  }
  for(const r of catalog.recipes) for(const id of r.sourceIds) assert.ok(manifest.sources.find(s=>s.source_id===id)?.recipe_ids.includes(r.id));
  assert.deepEqual(recipe('crepes-cacao').sourceIds,['SRC-07','SRC-16']);
  assert.equal(manifest.sources[1].recipe_ids.length,5);
  assert.ok(manifest.sources[3].recipe_ids.includes('pollo-miele-aglio'));
});
test('dosi doppie: quantità e resa raddoppiano senza cambiare origine, tempi, unità o dati mancanti',()=>{
  const original = recipe('pancake-banana'); const before = structuredClone(original);
  const scaled = scaleRecipe(original,2).recipe;
  assert.equal(scaled.ingredients[0].quantity,2);
  assert.deepEqual(scaled.ingredients[2].quantityRange,{min:80,max:100});
  assert.equal(scaled.ingredients[3].quantity,null);
  assert.equal(scaled.yield.quantity,null);
  assert.deepEqual(original,before);
  const muffins = scaleRecipe(recipe('tortine-formaggio'),2);
  assert.equal(muffins.recipe.yield.quantity,4);
  assert.equal(muffins.recipe.cookMinutes,20);
  assert.equal(muffins.recipe.nutrition.kcal,175);
  assert.equal(muffins.nutritionTotal.kcal,700);
  assert.equal(scaleRecipe(recipe('banana-snack'),2).recipe.ingredients[1].unit,'cup');
});
test('macro null rimangono null; base sconosciuta e dati incoerenti non producono totali',()=>{
  const r = scaleRecipe(recipe('polpette-tacchino'),2);
  assert.equal(r.nutritionTotal.kcal,1320);
  assert.equal(r.nutritionTotal.carbsG,null);
  assert.equal(r.nutritionTotal.fatG,null);
  assert.equal(scaleRecipe(recipe('burrito-chipotle'),2).nutritionTotal,null);
  assert.equal(scaleRecipe(recipe('piadine-zucchine'),2).nutritionTotal,null);
  assert.equal(scaleRecipe(recipe('pancake-banana'),2).nutritionTotal,null);
  assert.equal(scaleRecipe(recipe('crepes-cacao'),2).nutritionTotal.kcal,630);
  for(const factor of [0,-1,21,NaN,Infinity,'2']) assert.throws(()=>scaleRecipe(recipe('pancake-banana'),factor));
});
test('nessuna conversione inventata per dosi ambigue o cottura nuggets',()=>{
  const vino = recipe('risotto-radicchio').ingredients.find(i=>i.label==='Vino rosso');
  assert.equal(vino.quantity,100); assert.equal(vino.unit,null);
  const sauce = recipe('burrito-chipotle').ingredients.find(i=>i.label==='Salsa enchilada');
  assert.equal(sauce.quantity,0.25); assert.equal(sauce.unit,null);
  assert.equal(recipe('nuggets-pollo').cooking.length,0);
  assert.ok(recipe('nuggets-pollo').uncertainties.some(s=>s.includes('300 senza unità')));
  assert.equal(recipe('piadine-zucchine').nutrition.kcal,80);
  assert.equal(recipe('brownies').ingredients.find(i=>i.label==='Cacao amaro').quantity,130);
});
test('ricerca per parole, accenti e ingredienti con categoria',()=>{
  assert.equal(filterRecipes(catalog.recipes,'crepes').length,1);
  assert.ok(filterRecipes(catalog.recipes,'pollo','Secondi').length>=2);
  assert.equal(filterRecipes(catalog.recipes,'inesistente').length,0);
  assert.ok(filterRecipes(catalog.recipes,'avena').some(r=>r.id==='bicchierini-avena'));
});
test('guide per ogni ricetta: fonte/redazione esplicite, quantità ignote mai zero',()=>{
  for(const r of catalog.recipes) {
    assert.ok(r.guideSteps.length>=2);
    assert.ok(r.guideSteps.every(s=>['source','editorial'].includes(s.provenance)));
    assert.ok(r.ingredients.every(i=>i.quantity!==0));
    if(r.sourceSteps.length===0) assert.ok(r.guideSteps.every(s=>s.provenance==='editorial'));
    assert.ok(r.nutrition===null || r.nutrition.provenance==='source');
  }
});
test('errori caricamento gestiti; rendering escapato e dettagli accessibili',async()=>{
  await assert.rejects(()=>loadCatalog(async()=>({ok:false,status:503})),/503/);
  await assert.rejects(()=>loadCatalog(async()=>({ok:true,json:async()=>({})})),/Formato/);
  const loaded = await loadCatalog(async()=>({ok:true,json:async()=>catalog})); assert.equal(loaded.recipes.length,34);
  const malicious = structuredClone(catalog); malicious.recipes[0].title='<script>alert(1)</script>';
  const html = renderRecipeLibrary({catalog:malicious}); assert.ok(html.includes('&lt;script&gt;')); assert.ok(!html.includes('<script>'));
  const detail = renderRecipeLibrary({catalog,selectedId:'piadine-zucchine',multiplier:2});
  assert.ok(detail.includes('incoerente')); assert.ok(detail.includes('Apri SRC-17')); assert.ok(detail.includes('Passo dopo passo'));
  assert.ok(renderRecipeLibrary({catalog:null,error:'Errore di rete'}).includes('Riprova'));
});
