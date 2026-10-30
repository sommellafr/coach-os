import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {NUTRITION_DATA} from '../src/nutrition-data.js';
import {estimateRecipe,snapshotEstimate,validateNutritionSettings} from '../src/recipe-nutrition.js';
import {servingBasis} from '../src/single-serving.js';
import {freshState,parseBackup} from '../src/domain.js';
import {Repository,STORAGE_KEY} from '../src/storage.js';
import {createMeal,validateMeals} from '../src/meals.js';
const catalog=JSON.parse(readFileSync(new URL('../data/recipes.json',import.meta.url))).recipes;
const recipe=id=>catalog.find(r=>r.id===id);
const estimate=(id,options={})=>estimateRecipe(recipe(id),servingBasis(recipe(id)).count,options);
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-5,`${actual} != ${expected}`);
test('34 ricette complete, 164 ingredienti mappati e profili con riferimenti senza mutare fonti',()=>{
  const before=JSON.stringify(catalog);assert.equal(Object.keys(NUTRITION_DATA.mapping).length,164);
  for(const r of catalog){const e=estimate(r.id);assert.ok(e.complete,r.id);assert.equal(e.unmapped.length,0,r.id);assert.ok(e.nutrients.kcal>0&&e.nutrients.proteinG>0,r.id);for(const row of e.rows.filter(r=>r.included))assert.match(row.profile.url,/^https:\/\//);}
  assert.equal(JSON.stringify(catalog),before);assert.equal(NUTRITION_DATA.profiles.flour.nutrients.kcal,364);assert.equal(NUTRITION_DATA.profiles['philadelphia-protein'].nutrients.proteinG,11);
});
test('calcolo per ingrediente /100 e divisione porzioni una sola volta',()=>{
  const r={id:'test',ingredients:[{ingredientId:'farina',label:'Farina',quantity:100,unit:'g',optional:false}]};
  close(estimateRecipe(r).nutrients.kcal,364);close(estimateRecipe(r,2).nutrients.kcal,182);close(estimateRecipe(r,2,{multiplier:2}).nutrients.kcal,364);
  const one=estimate('burrito-manzo'),two=estimate('burrito-manzo',{multiplier:2});for(const k of ['kcal','proteinG','carbsG','fatG'])close(two.nutrients[k],one.nutrients[k]*2);close(one.rows[0].grams,170);
});
test('intervalli, pesi domestici USDA con amount, parte edibile e panatura separati dalla spesa',()=>{
  close(estimate('pancake-banana').rows[2].grams,45);close(estimate('pancake-banana').rows[0].grams,118);
  close(estimate('banana-snack').rows[1].grams,32.25); // cup 258 g / 4 / 2 porzioni
  const p=estimate('pollo-miele-aglio');close(p.rows[5].grams,25);assert.equal(recipe('pollo-miele-aglio').ingredients[5].quantity,200);assert.ok(p.needsReview);
  const r={id:'test',ingredients:[{ingredientId:'burro-di-arachidi',label:'Burro',quantity:1,unit:'tbsp',optional:false}]};close(estimateRecipe(r).rows[0].grams,16); // USDA amount=2, peso 32 g
});
test('crudo/cotto, alternative e dati incerti restano visibili e richiedono controllo',()=>{
  const dry=estimate('riso-pollo-broccoli'),settings={recipeId:'riso-pollo-broccoli',confirmed:true,rows:[{index:0,profileId:'rice-cooked',grams:1000,included:true}]};
  const cooked=estimate('riso-pollo-broccoli',{settings});assert.ok(dry.nutrients.kcal>cooked.nutrients.kcal);assert.equal(dry.plannerReady,false);assert.equal(cooked.plannerReady,true);
  const chipotle=estimate('burrito-chipotle');assert.equal(chipotle.rows[7].grams,0);assert.match(chipotle.rows[7].label,/Chipotle/);assert.ok(chipotle.rows[6].grams>0);assert.match(chipotle.rows[6].label,/Cipolla/);
  const bowl=estimate('bowl-patate-manzo');assert.equal(bowl.rows[8].label,'Cipollotto');assert.equal(bowl.rows[8].grams,5);assert.ok(bowl.rows[7].grams<1);
});
test('facoltativi su scelta e dati mancanti mai zero: un campo ignoto invalida quel totale',()=>{
  const base=estimate('pancake-banana'),settings={recipeId:'pancake-banana',confirmed:false,rows:[{index:3,profileId:'chocolate',grams:20,included:true}]};
  const chocolate=estimate('pancake-banana',{settings});close(chocolate.nutrients.kcal-base.nutrients.kcal,20*NUTRITION_DATA.profiles.chocolate.nutrients.kcal/100);
  settings.rows[0].nutrients={kcal:500,proteinG:null,carbsG:50,fatG:30};const partial=estimate('pancake-banana',{settings});assert.equal(partial.nutrients.proteinG,null);assert.equal(partial.complete,false);assert.ok(partial.nutrients.kcal>base.nutrients.kcal);
  const unknown=estimateRecipe({id:'unknown',ingredients:[{ingredientId:'missing',label:'Ignoto',quantity:null,unit:null,optional:false}]});assert.equal(unknown.nutrients.kcal,null);
  const empty=estimateRecipe({id:'empty',ingredients:[{ingredientId:'farina',label:'Farina',quantity:20,unit:'g',optional:true}]});assert.equal(empty.nutrients.kcal,null);assert.equal(empty.plannerReady,false);
});
test('snapshot e backup preservano stime passate quando cambiano le preferenze',()=>{
  const s=freshState(),r=recipe('pancake-banana'),first=snapshotEstimate(estimate(r.id));const m=createMeal(r,'breakfast',1,{nutritionEstimate:first});s.days['2026-10-30']={date:'2026-10-30',assignment:null,sessions:[],notes:'',meals:[m]};
  s.recipeNutritionSettings=[{recipeId:r.id,confirmed:true,rows:[{index:2,profileId:'flour',grams:90,included:true}]}];assert.notEqual(estimate(r.id,{settings:s.recipeNutritionSettings[0]}).nutrients.kcal,m.nutritionEstimate.nutrients.kcal);
  assert.deepEqual(parseBackup(JSON.stringify(s)),s);assert.deepEqual(m.nutritionEstimate,first);const legacy=freshState();assert.deepEqual(parseBackup(JSON.stringify(legacy)),legacy);
  const broken=structuredClone(m);broken.nutritionEstimate.nutrients.kcal=-1;assert.throws(()=>validateMeals([broken]));
});
test('preferenze non valide respinte e quota/backup falliti non cambiano i dati salvati',()=>{
  assert.throws(()=>validateNutritionSettings([{recipeId:'x',confirmed:true,rows:[{index:0,profileId:'flour',grams:-1,included:true}]}]));
  const values=new Map();let fail=false;const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('quota');values.set(k,v);}};const r=new Repository(storage);r.update(()=>{});const before=r.raw;fail=true;
  assert.throws(()=>r.update(s=>{s.recipeNutritionSettings=[{recipeId:'pancake-banana',confirmed:true,rows:[]}];},{backup:true}));assert.equal(r.raw,before);assert.equal(values.get(STORAGE_KEY),before);
});
