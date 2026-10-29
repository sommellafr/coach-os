import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshState,parseBackup} from '../src/domain.js';
import {createMeal,portionForMeal,metricPortionForMeal,portionIssues,correctPortions,validatePeople,mealBatchYield} from '../src/meals.js';
import {planRecipeOnDates} from '../src/planner.js';
import {shoppingForWeek,shoppingAmount} from '../src/shopping.js';
import {metricIngredient,validateMetricOverrides} from '../src/metric.js';
import {Repository,STORAGE_KEY} from '../src/storage.js';
import {pickerPortionSetup,portionPreview} from '../src/portion-ui.js';
const catalog=JSON.parse(readFileSync(new URL('../data/recipes.json',import.meta.url),'utf8'));
const recipe=id=>structuredClone(catalog.recipes.find(r=>r.id===id));
const dates=['2026-11-02','2026-11-03'];
function reportedMenu() {
  const state=freshState();
  planRecipeOnDates(state,recipe('burrito-manzo'),'lunch',1,[dates[0]]);
  planRecipeOnDates(state,recipe('burrito-chipotle'),'dinner',1,[dates[0]]);
  planRecipeOnDates(state,recipe('burrito-manzo'),'lunch',10,[dates[1]]);
  planRecipeOnDates(state,recipe('burrito-manzo'),'dinner',10,[dates[1]]);
  return state;
}
test('riproduce 2040 g manzo e 16 tortilla in due giorni; correzione esplicita porta il manzo a 510 g',()=>{
  const state=reportedMenu();const before=structuredClone(state);
  const raw=Object.values(state.days).flatMap(day=>day.meals.flatMap(meal=>portionForMeal(meal).ingredients));
  assert.equal(raw.filter(item=>item.label==='Tortilla a calorie ridotte').reduce((sum,item)=>sum+item.quantity,0),16);
  assert.equal(shoppingForWeek(state,dates[0]).ingredients.find(row=>row.label.startsWith('Macinato')).min,2040);
  assert.equal(portionIssues(state,dates).length,2);assert.deepEqual(state,before);
  assert.equal(correctPortions(state,dates),2);
  const report=shoppingForWeek(state,dates[0]);
  assert.equal(report.ingredients.find(row=>row.label.startsWith('Macinato')).min,510);
  assert.equal(report.ingredients.find(row=>row.label==='Petto di pollo').unit,'g');
  assert.ok(Math.abs(report.ingredients.find(row=>row.label==='Petto di pollo').min-170.09713875)<1e-8);
  assert.equal(report.ingredients.find(row=>row.label.startsWith('Tortilla')).min,null);
  assert.equal(correctPortions(state,dates),0);
  assert.deepEqual(state.days[dates[0]].meals.map(m=>m.id),before.days[dates[0]].meals.map(m=>m.id));
  assert.deepEqual(state.days[dates[0]].meals[0].snapshot,before.days[dates[0]].meals[0].snapshot);
});
test('due pasti per una persona usano due porzioni, ospiti espliciti moltiplicano solo il fabbisogno',()=>{
  const state=freshState();const r=recipe('burrito-manzo');
  planRecipeOnDates(state,r,'lunch',10,dates);
  assert.equal(shoppingForWeek(state,dates[0]).ingredients.find(row=>row.label.startsWith('Macinato')).min,340);
  state.days[dates[1]].meals[0].people=2;
  assert.equal(shoppingForWeek(state,dates[0]).ingredients.find(row=>row.label.startsWith('Macinato')).min,510);
  for(const invalid of [0,-1,1.5,21,'2',null,NaN]) assert.throws(()=>validatePeople(invalid));
  assert.equal(validatePeople(1),1);
});
test('conversioni esatte oz, kg, cl, l; cup e pezzi rimangono senza peso, mai zero',()=>{
  const base={quantity:24,unit:'oz',label:'Pollo',quantityRange:undefined};
  assert.equal(metricIngredient(base).quantity,680.388555);
  for(const [quantity,unit,want] of [[.5,'kg',500],[2,'cl',20],[.2,'l',200]]) assert.equal(metricIngredient({...base,quantity,unit}).quantity,want);
  for(const unit of ['cup','pezzi','tsp','scatola',null,'__proto__','constructor']) {
    const converted=metricIngredient({...base,unit});assert.equal(converted.quantity,null);assert.equal(converted.unit,null);assert.equal(converted.metricPending,true);
  }
  const range=metricIngredient({...base,quantity:null,quantityRange:{min:1,max:2}});
  assert.deepEqual(range.quantityRange,{min:28.349523125,max:56.69904625});
});
test('peso confermato della preparazione si divide una sola volta e conserva la fonte in cup',()=>{
  const r=recipe('burrito-chipotle');const index=r.ingredients.findIndex(item=>item.label==='Fiocchi di latte 0% grassi');
  const meal=createMeal(r,'lunch',4,{metricOverrides:[{index,quantity:240,unit:'g'}]});
  assert.equal(metricPortionForMeal(meal).ingredients[index].quantity,60);
  assert.equal(metricPortionForMeal(meal).ingredients[index].unit,'g');
  assert.equal(meal.snapshot.ingredients[index].quantity,1);assert.equal(meal.snapshot.ingredients[index].unit,'cup');
  meal.people=2;assert.equal(metricPortionForMeal(meal).ingredients[index].quantity,120);
  for(const entry of [{index,quantity:0,unit:'g'},{index,quantity:-1,unit:'g'},{index,quantity:NaN,unit:'g'},{index,quantity:1,unit:'cup'},{index:999,quantity:1,unit:'g'}]) assert.throws(()=>validateMetricOverrides([entry],r.ingredients.length));
  assert.throws(()=>validateMetricOverrides([{index,quantity:1,unit:'g'},{index,quantity:1,unit:'g'}],r.ingredients.length));
});
test('correzione con backup esatto; fallimento della copia non modifica le porzioni',()=>{
  class Store {data=new Map();failBackup=false;get length(){return this.data.size;}key(i){return [...this.data.keys()][i]??null;}getItem(k){return this.data.get(k)??null;}setItem(k,v){if(this.failBackup&&k!==STORAGE_KEY)throw Error('Quota backup');this.data.set(k,v);}}
  const store=new Store(),repo=new Repository(store);repo.commit(reportedMenu());const raw=repo.raw;
  store.failBackup=true;assert.throws(()=>repo.update(state=>correctPortions(state,dates),{backup:true}));assert.equal(store.getItem(STORAGE_KEY),raw);assert.equal(repo.raw,raw);
  store.failBackup=false;repo.update(state=>correctPortions(state,dates),{backup:true});
  assert.equal(repo.backups()[0].raw,raw);assert.equal(portionIssues(repo.state,dates).length,0);
});
test('vecchi backup senza misure o persone restano identici; nuovi dati validati nel roundtrip',()=>{
  const state=reportedMenu();const old=state.days[dates[0]].meals[0];delete old.people;delete old.metricOverrides;
  assert.deepEqual(parseBackup(JSON.stringify(state)),state);
  const meal=state.days[dates[1]].meals[0];meal.people=2;meal.metricOverrides=[{index:0,quantity:1500,unit:'g'}];
  assert.deepEqual(parseBackup(JSON.stringify(state)),state);
  meal.people=0;assert.throws(()=>parseBackup(JSON.stringify(state)));
});
test('resa mancante non viene dedotta, pasti fuori intervallo e spunte con nuovo fabbisogno preservati',()=>{
  const state=reportedMenu();planRecipeOnDates(state,recipe('pancake-banana'),'breakfast',1,[dates[0]]);
  planRecipeOnDates(state,recipe('burrito-manzo'),'lunch',1,['2026-11-09']);
  const before=shoppingForWeek(state,dates[0]).ingredients.find(row=>row.label.startsWith('Macinato'));
  correctPortions(state,dates);
  assert.equal(state.days['2026-11-09'].meals[0].batchPortions,1);
  assert.equal(state.days[dates[0]].meals.find(m=>m.slot==='breakfast').batchPortions,1);
  assert.notEqual(shoppingForWeek(state,dates[0]).ingredients.find(row=>row.label.startsWith('Macinato')).signature,before.signature);
  assert.ok(shoppingForWeek(state,dates[0]).ingredients.every(row=>row.unit===null||['g','ml'].includes(row.unit)));
  assert.ok(!shoppingAmount(shoppingForWeek(state,dates[0]).ingredients.find(row=>row.label.startsWith('Tortilla'))).includes('pezzi'));
});
test('UI separa resa bloccata e persone; anteprima burrito indica 170 g per una persona',()=>{
  const r=recipe('burrito-manzo'),html=pickerPortionSetup(r);
  assert.match(html,/id="planner-portions"[^>]*readonly[^>]*value="10"/);
  assert.match(html,/id="planner-people"[^>]*value="1"/);
  assert.ok(portionPreview(r,10,1).includes('170 g'));
  assert.ok(portionPreview(r,10,2).includes('340 g'));
  assert.ok(!pickerPortionSetup(recipe('pancake-banana')).includes('readonly'));
});
test('undici polpette o otto strisce non diventano automaticamente undici od otto pasti',()=>{
  for(const id of ['polpette-tacchino','pollo-miele-aglio','banana-snack']) {
    const r=recipe(id);assert.equal(mealBatchYield(r),null);
    const html=pickerPortionSetup(r);assert.ok(!html.includes('readonly'));
    assert.match(html,/id="planner-portions"[^>]*value=""/);
    assert.ok(html.includes('non equivale automaticamente a pasti'));
  }
});
