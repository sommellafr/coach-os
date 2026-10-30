import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshState,parseBackup,validateState,assign} from '../src/domain.js';
import {generateMonth,monthSummary,monthDates,applyMonth,buildCandidates,dayReport,replaceMonthMeal,removeMeals,removalPreview,savedMonth,referenceIngredients} from '../src/month-menu.js';
import {setPantryStock,consumePantry} from '../src/pantry.js';
import {createMeal,metricPortionForMeal} from '../src/meals.js';
import {estimateForRecipe} from '../src/nutrition-ui.js';
import {snapshotEstimate} from '../src/recipe-nutrition.js';
import {shoppingForWeek} from '../src/shopping.js';
import {saveFoodMeal} from '../src/foods.js';
import {Repository,STORAGE_KEY} from '../src/storage.js';
const catalog=JSON.parse(readFileSync(new URL('../data/recipes.json',import.meta.url),'utf8'));
const prefs=()=>({month:'2026-11',kcal:1600,weight:80,proteinPerKg:1.5,weekdays:[1,2,3,4,5],excludedGroups:[],excludedRecipes:[],sides:true});
const options={today:'2026-10-30'};
test('mese con date civili, bisestili e limiti; 5/6 giorni e passato escluso',()=>{
  assert.equal(monthDates('2028-02').length,29);assert.equal(monthDates('2027-02').length,28);assert.equal(monthDates('2199-12').at(-1),'2199-12-31');
  const s=freshState(),p=prefs(),d=generateMonth(catalog,s,p,options);assert.equal(monthSummary(d).days,21);assert.equal(monthSummary(d).newMeals,63);assert.ok(d.days.filter(x=>x.free).every(x=>!Object.keys(x.cells).length));
  p.weekdays.push(6);const six=generateMonth(catalog,s,p,options);assert.equal(monthSummary(six).days,25);
  const current=generateMonth(catalog,s,{...prefs(),month:'2026-10'},{today:'2026-10-30'});assert.equal(monthSummary(current).days,1);assert.ok(current.days.filter(x=>x.past).every(x=>!Object.keys(x.cells).length));
  const after21=generateMonth(catalog,s,{...prefs(),month:'2026-10'},{today:'2026-10-30',startDate:'2026-10-31'});assert.equal(monthSummary(after21).newMeals,0);
});
test('target kcal/proteine e varietà senza moltiplicare i pranzi',()=>{
  const p=prefs(),d=generateMonth(catalog,freshState(),p,options),summary=monthSummary(d);assert.equal(summary.matched,summary.days);assert.ok(summary.distinct>=10);assert.ok(summary.groups.includes('fish')&&summary.groups.includes('legumes'));
  for(const day of d.days.filter(x=>!x.free)){const r=dayReport(day,p);assert.ok(Math.abs(r.nutrients.kcal-1600)<=80);assert.ok(r.nutrients.proteinG>=120);assert.notEqual(day.cells.lunch.candidate.id,day.cells.dinner.candidate.id);}
  const impossible=generateMonth(catalog,freshState(),{...p,kcal:500,weight:150},options);assert.equal(monthSummary(impossible).matched,0);
});
test('esclusioni rigide per nuove proposte, ricette incomplete fuori e nessuna soluzione gestita',()=>{
  const p={...prefs(),excludedGroups:['meat','fish'],excludedRecipes:['pasta-greca']};const pool=buildCandidates(catalog,freshState(),p,'2026-11-02');assert.ok(pool.candidates.length);assert.ok(pool.candidates.every(c=>!c.groups.includes('meat')&&!c.groups.includes('fish')&&c.id!=='pasta-greca'));assert.ok(pool.excluded.some(r=>r.reason.includes('controllare')));
  assert.ok(!pool.candidates.some(c=>c.id==='risotto-zucca')); // Il riferimento scelto contiene brodo di pollo.
  assert.throws(()=>generateMonth(catalog,freshState(),{...prefs(),excludedRecipes:catalog.recipes.map(r=>r.id)},options),/sufficienti/);
  assert.throws(()=>generateMonth(catalog,freshState(),{...prefs(),weekdays:[1,2]},options),/5 o 6/);
});
test('pasti e allenamenti esistenti preservati, consuntivo non sommato due volte',()=>{
  const s=freshState(),r=catalog.recipes.find(r=>r.id==='pancake-banana');assign(s,'2026-11-02','template-1');s.days['2026-11-02'].notes='Conservare';
  const old=createMeal(r,'breakfast',1,{people:2,nutritionEstimate:snapshotEstimate(estimateForRecipe(r))});s.days['2026-11-02'].meals=[old];const original=JSON.stringify(s.days['2026-11-02']);
  const draft=generateMonth(catalog,s,prefs(),options);assert.equal(draft.days.find(d=>d.date==='2026-11-02').cells.breakfast.nutrients.kcal,358);assert.equal(monthSummary(draft).newMeals,62);applyMonth(s,draft,catalog);assert.equal(JSON.stringify(s.days['2026-11-02'].meals[0]),JSON.stringify(old));assert.equal(s.days['2026-11-02'].notes,'Conservare');assert.equal(s.days['2026-11-02'].assignment.template.id,'template-1');assert.ok(original);
  const product={id:'manual-food',name:'Pasto',brand:'',unit:'g',barcode:null,source:'manual',favorite:false,nutrients:{kcal:400,proteinG:25,carbsG:50,fatG:10}};
  saveFoodMeal(s,{id:'consumed',date:'2026-11-02',slot:'lunch',name:'Mangiato',status:'consumed',items:[{product,amount:100}]});
  const again=generateMonth(catalog,s,prefs(),options);assert.equal(again.days.find(d=>d.date==='2026-11-02').cells.lunch.nutrients.kcal,400);assert.equal(monthSummary(again).newMeals,0);
  const beforeExtra=dayReport(again.days.find(d=>d.date==='2026-11-02'),prefs()).nutrients.kcal;
  saveFoodMeal(s,{id:'extra',date:'2026-11-02',slot:'extra',name:'Extra',status:'consumed',items:[{product,amount:50}]});
  const withExtra=savedMonth(s,prefs());assert.equal(dayReport(withExtra.days.find(d=>d.date==='2026-11-02'),prefs()).nutrients.kcal,beforeExtra+200);
});
test('pasto conservato senza stima non equivale a zero né a obiettivo raggiunto',()=>{
  const s=freshState(),r=catalog.recipes[0];s.days['2026-11-02']={date:'2026-11-02',assignment:null,sessions:[],notes:'',meals:[createMeal(r,'lunch',10)]};
  const d=generateMonth(catalog,s,prefs(),options),report=dayReport(d.days.find(d=>d.date==='2026-11-02'),d.prefs);assert.equal(report.complete,false);assert.equal(report.nutrients.kcal,null);assert.equal(report.kcalMatch,false);
});
test('blocchi e sostituzione non alterano altri piatti e si ricalcolano i totali',()=>{
  const s=freshState(),d=generateMonth(catalog,s,prefs(),options),day=d.days.find(d=>!d.free);day.cells.breakfast.locked=true;const b=JSON.stringify(day.cells.breakfast),l=day.cells.lunch.candidate.id;
  const regenerated=generateMonth(catalog,s,prefs(),{...options,seed:2,previous:d});assert.equal(JSON.stringify(regenerated.days.find(x=>x.date===day.date).cells.breakfast),b);
  replaceMonthMeal(d,catalog,s,day.date,'lunch');assert.notEqual(day.cells.lunch.candidate.id,l);assert.equal(day.cells.lunch.locked,true);assert.equal(JSON.stringify(day.cells.breakfast),b);
});
test('dosi generate e stima condividono riferimenti, spesa in g/ml e nessun consumo implicito',()=>{
  const s=freshState(),d=generateMonth(catalog,s,prefs(),options);applyMonth(s,d,catalog);validateState(s);const meals=Object.values(s.days).flatMap(d=>d.meals||[]);assert.ok(meals.every(m=>m.people===1&&m.referenceIngredients?.length&&m.nutritionEstimate));assert.equal(s.pantry,undefined);assert.ok(Object.values(s.days).every(d=>!d.foodEntries));
  for(const m of meals)assert.ok(metricPortionForMeal(m).ingredients.every(i=>i.quantity>0&&['g','ml'].includes(i.unit)));
  const report=shoppingForWeek(s,'2026-11-02',{fromDate:'2026-10-30'});assert.ok(report.ingredients.length);assert.ok(report.ingredients.every(r=>!r.unknownCount));assert.ok(report.ingredients.some(r=>r.notes.some(n=>n.includes('Dose di riferimento'))));
  const before=JSON.stringify(meals[0].nutritionEstimate);s.recipeNutritionSettings=[];assert.equal(JSON.stringify(meals[0].nutritionEstimate),before);assert.deepEqual(parseBackup(JSON.stringify(s)),s);
  const view=savedMonth(s,prefs());assert.equal(monthSummary(view).savedMeals,63);assert.ok(monthSummary(view).distinct>=10);assert.throws(()=>applyMonth(s,view,catalog),/vista/);
  const milkRecipe=catalog.recipes.find(r=>r.id==='bicchierini-avena'),refs=referenceIngredients(milkRecipe,estimateForRecipe(milkRecipe));assert.equal(refs.find(i=>i.label==='Latte o bevanda vegetale').unit,'ml');
  const coated=catalog.recipes.find(r=>r.id==='pollo-miele-aglio'),coating=estimateForRecipe(coated);assert.equal(referenceIngredients(coated,coating).find(i=>i.label==='Farina').quantity,50);assert.equal(coating.rows[5].grams,25);
});
test('cancellazioni per ambito conservano note, sedute e diario salvo scelta esplicita',()=>{
  const s=freshState();applyMonth(s,generateMonth(catalog,s,prefs(),options),catalog);s.days['2026-11-02'].notes='Intatte';setPantryStock(s,{label:'Farina',unit:'g',preparationState:'non specificato',quantity:1000,packSize:1000});consumePantry(s,s.days['2026-11-02'].meals[0],[{label:'Farina',unit:'g',preparationState:'non specificato',min:50,max:50}],[]);const raw=JSON.stringify(s.pantry),moves=JSON.stringify(s.pantryMovements);
  assert.equal(removalPreview(s,'week','2026-11-02').planned,15);assert.equal(removeMeals(s,'week','2026-11-02'),15);assert.equal(s.days['2026-11-02'].notes,'Intatte');assert.equal(JSON.stringify(s.pantry),raw);assert.equal(removalPreview(s,'month','2026-11-02').planned,48);assert.equal(removeMeals(s,'all','2026-11-02'),48);
  assert.ok(Object.values(s.days).every(d=>!d.meals.length));validateState(s);
  assert.equal(JSON.stringify(s.pantryMovements),moves);assert.equal(JSON.stringify(s.pantry),raw);
});
test('anteprima obsoleta e quota impediscono scritture parziali; backup vecchio compatibile',()=>{
  const s=freshState(),d=generateMonth(catalog,s,prefs(),options);s.revision=1;assert.throws(()=>applyMonth(s,d,catalog),/cambiati/);assert.equal(Object.keys(s.days).length,0);
  const values=new Map();let fail=false;const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('quota');values.set(k,v);}};const r=new Repository(storage);r.update(()=>{});const preview=generateMonth(catalog,r.state,prefs(),options),before=r.raw;fail=true;assert.throws(()=>r.update(s=>applyMonth(s,preview,catalog),{backup:true}));assert.equal(r.raw,before);assert.equal(values.get(STORAGE_KEY),before);assert.deepEqual(parseBackup(JSON.stringify(freshState())),freshState());
});
