import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { freshState, newDay, validateState, parseBackup, assign } from '../src/domain.js';
import { createMeal } from '../src/meals.js';
import { shoppingForWeek, shoppingText, shoppingAmount } from '../src/shopping.js';
import { copyMenuWeek, planRecipeOnDates } from '../src/planner.js';
import { Repository, STORAGE_KEY } from '../src/storage.js';

const catalog=JSON.parse(readFileSync(new URL('../data/recipes.json',import.meta.url),'utf8'));
const recipe=id=>structuredClone(catalog.recipes.find(r=>r.id===id));
const item=(quantity,unit='g',extra={})=>({ingredientId:'pasta',label:'Pasta',quantity,unit,preparationState:'non specificato',optional:false,note:'',...extra});
function synthetic(ingredients) {const r=recipe('pasta-fredda-pollo');r.ingredients=ingredients;r.yield={quantity:1,unit:'porzioni'};return r;}
const add=(state,date,ingredients,slot='lunch')=>{
  state.days[date]??=newDay(date);state.days[date].meals??=[];
  state.days[date].meals.push(createMeal(synthetic(ingredients),slot,1));
};
test('spesa settimanale usa solo i pasti salvati della settimana e le singole dosi',()=>{
  const s=freshState(); planRecipeOnDates(s,recipe('pasta-fredda-pollo'),'lunch',2,['2026-11-02','2026-11-04']);
  planRecipeOnDates(s,recipe('pasta-ragu'),'dinner',3,['2026-11-09']);
  const report=shoppingForWeek(s,'2026-11-05');
  assert.equal(report.mealCount,2);assert.equal(report.filledSlots,2);assert.equal(report.weekStart,'2026-11-02');
  assert.equal(report.ingredients.find(r=>r.label==='Pasta').min,150);
  assert.equal(report.ingredients.find(r=>r.label==='Petto di pollo').min,200);
  assert.equal(shoppingForWeek(s,'2026-11-09').ingredients.find(r=>r.label==='Pasta').min,100);
});
test('unità compatibili g/kg e ml/l sommate, senza sommare massa e volume',()=>{
  const s=freshState();add(s,'2026-11-02',[item(0.5,'kg'),item(100,'g'),item(0.25,'l'),item(50,'ml')]);
  const rows=shoppingForWeek(s,'2026-11-02').ingredients;
  assert.equal(rows.length,2);assert.equal(rows.find(r=>r.unit==='g').min,600);assert.equal(rows.find(r=>r.unit==='ml').min,300);
});
test('nessuna conversione arbitraria per cup, cucchiai, pezzi e crudo/cotto',()=>{
  const s=freshState();add(s,'2026-11-02',[item(1,'cup'),item(1,'cucchiai'),item(1,'pezzo'),item(2,'pezzi'),item(20,'g',{preparationState:'crudo'}),item(30,'g',{preparationState:'cotto'}),item(40,'g')]);
  const rows=shoppingForWeek(s,'2026-11-02').ingredients;
  assert.equal(rows.length,6);assert.equal(rows.find(r=>r.unit==='pezzi').min,3);
  assert.equal(rows.filter(r=>r.unit==='g').length,3);
  assert.equal(rows.find(r=>r.unit==='cup').min,1);
});
test('intervalli sommati sui due estremi, ignoti mai trasformati in zero',()=>{
  const s=freshState();add(s,'2026-11-02',[item(null,'g',{quantityRange:{min:40,max:50}}),item(10,'g'),item(null,'g')]);
  const row=shoppingForWeek(s,'2026-11-02').ingredients[0];
  assert.equal(row.min,50);assert.equal(row.max,60);assert.equal(row.unknownCount,1);assert.equal(row.needsReview,true);
  assert.ok(shoppingAmount(row).includes('50–60 g + dosi non indicate'));
  const u=freshState();add(u,'2026-11-02',[item(null,null)]);
  assert.equal(shoppingForWeek(u,'2026-11-02').ingredients[0].min,null);
  assert.ok(shoppingText(shoppingForWeek(u,'2026-11-02')).includes('DA VALUTARE A MANO'));
});
test('facoltativi esclusi per default e inclusi soltanto su scelta, senza cambiare il piano',()=>{
  const s=freshState();add(s,'2026-11-02',[item(100),item(20,'g',{optional:true})]);
  const before=structuredClone(s);
  assert.equal(shoppingForWeek(s,'2026-11-02').ingredients[0].min,100);
  assert.equal(shoppingForWeek(s,'2026-11-02',{includeOptional:true}).ingredients[0].min,120);
  assert.deepEqual(s,before);
});
test('modifica/rimozione pasti aggiorna la lista una sola volta; firma cambia con il fabbisogno',()=>{
  const s=freshState();planRecipeOnDates(s,recipe('pasta-fredda-pollo'),'lunch',2,['2026-11-02']);
  const before=shoppingForWeek(s,'2026-11-02').ingredients.find(r=>r.label==='Pasta');
  s.days['2026-11-02'].meals[0].batchPortions=4;
  const after=shoppingForWeek(s,'2026-11-02').ingredients.find(r=>r.label==='Pasta');
  assert.equal(after.min,37.5);assert.notEqual(after.signature,before.signature);
  s.days['2026-11-02'].meals=[];assert.equal(shoppingForWeek(s,'2026-11-02').ingredients.length,0);
});
test('ripetizione ricetta su più date atomica e ID diversi; nessuna registrazione di consumo',()=>{
  const s=freshState();const count=planRecipeOnDates(s,recipe('pasta-fredda-pollo'),'lunch',2,['2026-11-02','2026-11-02','2026-11-04']);
  assert.equal(count,2);assert.notEqual(s.days['2026-11-02'].meals[0].id,s.days['2026-11-04'].meals[0].id);
  assert.equal(s.days['2026-11-02'].meals[0].status,'planned');
  const before=structuredClone(s);
  assert.throws(()=>planRecipeOnDates(s,recipe('pasta-ragu'),'lunch',3,['2026-11-02','2026-11-09']));assert.deepEqual(s,before);
  assert.throws(()=>planRecipeOnDates(s,recipe('pasta-ragu'),'snack',3,['2026-11-02']));assert.deepEqual(s,before);
});
test('copia settimana riempie soltanto i pasti vuoti preservando quelli scelti, note e allenamenti',()=>{
  const s=freshState();planRecipeOnDates(s,recipe('pasta-fredda-pollo'),'lunch',2,['2026-11-02','2026-11-04']);
  planRecipeOnDates(s,recipe('risotto-zucca'),'dinner',2,['2026-11-02']);
  planRecipeOnDates(s,recipe('pasta-ragu'),'lunch',3,['2026-11-09']);
  assign(s,'2026-11-09','template-1');s.days['2026-11-09'].notes='Nota mia';
  const original=structuredClone(s.days['2026-11-09']);
  assert.equal(copyMenuWeek(s,'2026-11-02','2026-11-09'),2);
  assert.deepEqual(s.days['2026-11-09'].assignment,original.assignment);assert.equal(s.days['2026-11-09'].notes,'Nota mia');
  assert.equal(s.days['2026-11-09'].meals.find(m=>m.slot==='lunch').snapshot.id,'pasta-ragu');
  assert.notEqual(s.days['2026-11-11'].meals[0].id,s.days['2026-11-04'].meals[0].id);
  assert.deepEqual(s.days['2026-11-11'].meals[0].snapshot,s.days['2026-11-04'].meals[0].snapshot);
  assert.equal(copyMenuWeek(s,'2026-11-02','2026-11-09'),0);
  validateState(s);
});
test('cambio anno e settimane diverse hanno liste e spunte indipendenti',()=>{
  const s=freshState();add(s,'2026-12-31',[item(100)]);add(s,'2027-01-01',[item(50)]);add(s,'2027-01-04',[item(40)]);
  const a=shoppingForWeek(s,'2027-01-01');const b=shoppingForWeek(s,'2027-01-04');
  assert.equal(a.weekStart,'2026-12-28');assert.equal(a.ingredients[0].min,150);assert.equal(b.ingredients[0].min,40);
  s.shoppingWeeks={[a.weekStart]:{checked:[a.ingredients[0].signature],includeOptional:false}};
  validateState(s);assert.deepEqual(parseBackup(JSON.stringify(s)).shoppingWeeks,s.shoppingWeeks);
  assert.equal(shoppingForWeek(s,'2199-12-31').dates.at(-1),'2199-12-31');
});
test('preferenze spesa validate e import vecchio compatibile',()=>{
  const old=freshState();assert.equal('shoppingWeeks' in parseBackup(JSON.stringify(old)),false);
  for(const settings of [null,{'2026-11-03':{checked:[],includeOptional:false}},{'2026-11-02':{checked:[42],includeOptional:false}},{'2026-11-02':{checked:['a','a'],includeOptional:false}}]) {
    const s=freshState();s.shoppingWeeks=settings;assert.throws(()=>validateState(s));
  }
});
test('spunte e menu si esportano, ripristinano e non producono falso successo su quota',()=>{
  class Store {data=new Map();fail=false;get length(){return this.data.size;}key(i){return [...this.data.keys()][i]??null;}getItem(k){return this.data.get(k)??null;}setItem(k,v){if(this.fail)throw Error('Quota');this.data.set(k,v);}}
  const store=new Store();const repo=new Repository(store);const s=freshState();add(s,'2026-11-02',[item(100)]);
  const report=shoppingForWeek(s,'2026-11-02');s.shoppingWeeks={[report.weekStart]:{checked:[report.ingredients[0].signature],includeOptional:true}};
  repo.commit(s);const exported=repo.export();repo.restore(exported);assert.deepEqual(new Repository(store).state.shoppingWeeks,s.shoppingWeeks);
  const raw=store.getItem(STORAGE_KEY);store.fail=true;
  assert.throws(()=>repo.update(d=>{d.shoppingWeeks[report.weekStart].checked=[];}),/Quota/);assert.equal(store.getItem(STORAGE_KEY),raw);
  assert.ok(shoppingText(report,s.shoppingWeeks[report.weekStart].checked).includes('[x] Pasta: 100 g'));
});
