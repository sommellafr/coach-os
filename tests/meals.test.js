import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMeal, portionForMeal, validateBatchPortions } from '../src/meals.js';
import { freshState, newDay, validateState, parseBackup, assign } from '../src/domain.js';
import { Repository, STORAGE_KEY } from '../src/storage.js';
import { renderMeals } from '../src/meal-ui.js';

const catalog = JSON.parse(readFileSync(new URL('../data/recipes.json',import.meta.url),'utf8'));
const recipe = id => catalog.recipes.find(r=>r.id===id);
const stateWithMeal = () => {
  const s = freshState(); s.days['2026-10-29'] = newDay('2026-10-29');
  s.days['2026-10-29'].meals = [createMeal(recipe('pasta-fredda-pollo'),'lunch',2)];
  return s;
};
class MemoryStorage {
  data = new Map(); fail = false;
  get length() {return this.data.size;}
  key(i) {return [...this.data.keys()][i]??null;}
  getItem(k) {return this.data.get(k)??null;}
  setItem(k,v) {if(this.fail) throw Error('Quota'); this.data.set(k,v);}
}
test('dose singola da resa originale: pasta per due diventa 75 g, nutrizione dichiarata per una',()=>{
  const meal = createMeal(recipe('pasta-fredda-pollo'),'lunch',2);
  const portion = portionForMeal(meal);
  assert.equal(meal.quantity,1); assert.equal(meal.status,'planned');
  assert.equal(portion.ingredients[0].quantity,75);
  assert.equal(portion.ingredients.find(i=>i.label==='Petto di pollo').quantity,100);
  assert.equal(portion.nutrition.kcal,560); assert.equal(portion.nutrition.proteinG,40);
  assert.equal(portion.nutrition.carbsG,null);
});
test('resa mancante richiede input, non assume dosi per una persona',()=>{
  const r = recipe('pancake-banana'); assert.equal(r.yield.quantity,null);
  for(const invalid of [null,undefined,0,-1,2.5,1001,NaN,Infinity,'2']) assert.throws(()=>createMeal(r,'breakfast',invalid));
  const portion = portionForMeal(createMeal(r,'breakfast',2));
  assert.equal(portion.ingredients[0].quantity,0.5);
  assert.deepEqual(portion.ingredients[2].quantityRange,{min:20,max:25});
  assert.equal(portion.ingredients[3].quantity,null); assert.equal(portion.nutrition,null);
  assert.equal(validateBatchPortions(1),1);
});
test('snapshot congelato: modifica catalogo e porzioni non altera i pasti già pianificati',()=>{
  const r = structuredClone(recipe('pasta-fredda-pollo'));
  const meal = createMeal(r,'dinner',2); r.ingredients[0].quantity=900; r.nutrition.kcal=999; r.title='Nuova ricetta';
  assert.equal(portionForMeal(meal).ingredients[0].quantity,75);
  assert.equal(portionForMeal(meal).nutrition.kcal,560);
  assert.equal(meal.snapshot.title,'Pasta fredda con pollo e rucola');
  meal.batchPortions=4;
  assert.equal(portionForMeal(meal).ingredients[0].quantity,37.5);
  assert.equal(portionForMeal(meal).nutrition.kcal,280);
});
test('pasti su date distinte, correzione stabile e piano allenamento indipendente',()=>{
  const s = stateWithMeal(); s.days['2026-10-30']=newDay('2026-10-30');
  s.days['2026-10-30'].meals=[createMeal(recipe('pasta-ragu'),'dinner',3)];
  const originalId=s.days['2026-10-29'].meals[0].id;
  s.days['2026-10-29'].meals[0].slot='breakfast'; s.days['2026-10-29'].meals[0].batchPortions=4;
  assign(s,'2026-10-29','rest'); validateState(s);
  assert.equal(s.days['2026-10-29'].meals.length,1); assert.equal(s.days['2026-10-29'].meals[0].id,originalId);
  assert.equal(s.days['2026-10-30'].meals[0].slot,'dinner');
  assert.equal(s.days['2026-10-29'].assignment.kind,'rest');
});
test('nessuna migrazione distruttiva: backup vecchi senza meals e nuovi con pasti validi',()=>{
  const old=freshState(); old.days['2026-10-19']=newDay('2026-10-19');
  const raw=JSON.stringify(old); assert.equal(JSON.stringify(parseBackup(raw)),raw);
  assert.equal('meals' in parseBackup(raw).days['2026-10-19'],false);
  const s=stateWithMeal(); assert.deepEqual(parseBackup(JSON.stringify(s)),s);
});
test('pasti esportati e ripristinati, con backup dei byte prima del ripristino',()=>{
  const store = new MemoryStorage(); const repo = new Repository(store); repo.commit(stateWithMeal());
  const backup=repo.export(); const previous=repo.raw;
  const key=repo.restore(backup);
  assert.equal(store.getItem(key),previous);
  assert.deepEqual(new Repository(store).state.days,JSON.parse(backup).days);
  assert.equal(new Repository(store).state.days['2026-10-29'].meals[0].quantity,1);
});
test('fallimento salvataggio pasti non aggiorna stato né dati locali',()=>{
  const store=new MemoryStorage(); const repo=new Repository(store); repo.commit(stateWithMeal());
  const before=repo.raw; store.fail=true;
  assert.throws(()=>repo.update(s=>s.days['2026-10-29'].meals.push(createMeal(recipe('pasta-ragu'),'dinner',3))),/Quota/);
  assert.equal(store.getItem(STORAGE_KEY),before); assert.equal(repo.state.days['2026-10-29'].meals.length,1);
});
test('pasti importati non validi, duplicati, consumi impliciti e quantità negative respinti',()=>{
  for(const mutate of [
    m=>m.slot='snack',m=>m.status='consumed',m=>m.quantity=2,m=>m.batchPortions=0,
    m=>m.snapshot.ingredients[0].quantity=-1,m=>m.snapshot.nutrition.kcal='500',
  ]) {const s=stateWithMeal(); mutate(s.days['2026-10-29'].meals[0]); assert.throws(()=>validateState(s));}
  const duplicate=stateWithMeal(); duplicate.days['2026-10-30']=newDay('2026-10-30');
  duplicate.days['2026-10-30'].meals=structuredClone(duplicate.days['2026-10-29'].meals);
  assert.throws(()=>validateState(duplicate),/duplicato/);
});
test('nutrienti incoerenti o base ignota restano non calcolabili nella dose',()=>{
  assert.equal(portionForMeal(createMeal(recipe('piadine-zucchine'),'dinner',3)).nutrition,null);
  assert.equal(portionForMeal(createMeal(recipe('bowl-patate-manzo'),'lunch',4)).nutrition,null);
  const p=portionForMeal(createMeal(recipe('polpette-tacchino'),'dinner',11));
  assert.equal(p.nutrition.kcal,60); assert.equal(p.nutrition.carbsG,null);
});
test('interfaccia mostra tre pasti, una dose e pianificazione esplicita; niente pasto automatico',()=>{
  const html = renderMeals({date:'2026-10-29',day:stateWithMeal().days['2026-10-29'],catalog,editable:true});
  for(const name of ['Colazione','Pranzo','Cena','1 dose','solo pasti pianificati','Ingredienti della singola dose']) assert.ok(html.includes(name));
  assert.ok(html.includes('75 g'));
  assert.equal(renderMeals({date:'2026-10-29',editable:false}),'');
  assert.ok(renderMeals({date:'2026-10-29',editable:true,error:'Rete non disponibile'}).includes('Riprova'));
});
