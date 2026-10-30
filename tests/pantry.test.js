import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshState,parseBackup} from '../src/domain.js';
import {planRecipeOnDates} from '../src/planner.js';
import {shoppingForWeek,mealShoppingRows,pantryReservations} from '../src/shopping.js';
import {setPantryStock,purchasePack,consumePantry,undoPantryMovement,cookedMovement,validatePantry,ingredientKey} from '../src/pantry.js';
import {Repository,STORAGE_KEY} from '../src/storage.js';
import {singleServingRecipe,servingBasis} from '../src/single-serving.js';
import {pickerPortionSetup} from '../src/portion-ui.js';
const catalog=JSON.parse(readFileSync(new URL('../data/recipes.json',import.meta.url),'utf8'));
const date='2026-11-02';
function flourRecipe(amount=50,unit='g',preparationState='non specificato') {
  const recipe=structuredClone(catalog.recipes.find(r=>r.id==='pancake-banana'));
  recipe.ingredients=[{ingredientId:'farina',label:'Farina',quantity:amount,unit,preparationState,optional:false,note:''}];
  return recipe;
}
function planned(amount=50,people=1) {const state=freshState();planRecipeOnDates(state,flourRecipe(amount),'breakfast',1,[date],{people});return state;}
const report=state=>shoppingForWeek(state,date,{fromDate:date});
const row=state=>report(state).ingredients[0];
const meal=state=>state.days[date].meals[0];
const stock=(state,quantity,packSize=1000)=>setPantryStock(state,{label:'Farina',unit:'g',quantity,packSize});

test('tutte le 34 ricette sono per una porzione, con provenienza e fonti originali immutate',()=>{
  const before=JSON.stringify(catalog);
  for(const original of catalog.recipes) {
    const normalized=singleServingRecipe(original),basis=servingBasis(original);
    assert.equal(normalized.yield.quantity,1);assert.equal(normalized.yield.unit,'porzione');
    assert.equal(normalized.servings,1);
    assert.ok(['source','editorial'].includes(basis.provenance));
    for(let i=0;i<original.ingredients.length;i++) if(original.ingredients[i].quantity!==null) assert.ok(Math.abs(normalized.ingredients[i].quantity-original.ingredients[i].quantity/basis.count)<1e-9);
    assert.deepEqual(normalized.sourceIds,original.sourceIds);assert.deepEqual(normalized.sourceSteps,original.sourceSteps);
  }
  assert.equal(JSON.stringify(catalog),before);
});
test('burrito da dieci diventa una porzione da 170 g, campo principale uno modificabile a due',()=>{
  const r=catalog.recipes.find(r=>r.id==='burrito-manzo'),normalized=singleServingRecipe(r);
  assert.equal(normalized.ingredients[0].quantity,170);
  assert.ok(!normalized.guideSteps.some(step=>step.text.includes('le 10 tortilla')));
  const html=pickerPortionSetup(r);assert.match(html,/id="planner-portions"[^>]*value="1"/);assert.ok(!html.includes('readonly'));
  const state=freshState();planRecipeOnDates(state,r,'lunch',servingBasis(r).count,[date],{people:2});
  assert.equal(report(state).ingredients.find(item=>item.label.startsWith('Macinato')).min,340);
});
test('50 g di farina significano una confezione da 1 kg e avanzo previsto 950 g',()=>{
  const state=planned(),item=row(state);
  assert.equal(item.min,50);assert.equal(item.shortage,50);assert.equal(item.packSize,1000);assert.equal(item.packCount,1);assert.equal(item.buyQuantity,1000);assert.equal(item.expectedLeftover,950);
  assert.equal(state.pantry,undefined);
});
test('dispensa copre il menu; prenotazioni aumentano ma non consumano scorte',()=>{
  const state=planned();stock(state,200);
  const before=JSON.stringify(state);assert.equal(row(state).shortage,0);assert.equal(JSON.stringify(state),before);
  const key=ingredientKey('Farina','g');assert.equal(pantryReservations(state,date).get(key).max,50);
  planRecipeOnDates(state,flourRecipe(180),'lunch',1,['2026-11-03']);
  assert.equal(state.pantry[0].quantity,200);assert.equal(pantryReservations(state,date).get(key).max,230);assert.equal(row(state).shortage,30);
  state.days['2026-11-03'].meals=[];assert.equal(row(state).shortage,0);assert.equal(state.pantry[0].quantity,200);
});
test('arrotondamento confezioni e formato personale non comprano grammi sfusi',()=>{
  const state=planned(1050);assert.equal(row(state).packCount,2);
  stock(state,100,500);assert.equal(row(state).shortage,950);assert.equal(row(state).packCount,2);assert.equal(row(state).buyQuantity,1000);assert.equal(row(state).expectedLeftover,50);
});
test('piani di settimane precedenti prenotano le scorte prima della settimana successiva',()=>{
  const state=planned(50);stock(state,0,50);
  planRecipeOnDates(state,flourRecipe(60),'lunch',1,['2026-11-09']);
  const next=shoppingForWeek(state,'2026-11-09',{fromDate:date}).ingredients[0];
  assert.equal(next.reservedEarlier,50);assert.equal(next.shortage,110);assert.equal(next.packCount,3);assert.equal(next.expectedLeftover,40);
});
test('Ho acquistato carica confezioni; Ho preparato scarica una sola volta; annullamento reversibile',()=>{
  const state=planned();purchasePack(state,row(state),1000,1);
  assert.equal(state.pantry[0].quantity,1000);assert.equal(row(state).shortage,0);
  const id=consumePantry(state,meal(state),mealShoppingRows(meal(state),date));
  assert.equal(state.pantry[0].quantity,950);assert.ok(cookedMovement(state,meal(state).id));assert.equal(report(state).ingredients.length,0);
  const snapshot=JSON.stringify(state);assert.throws(()=>consumePantry(state,meal(state),mealShoppingRows(meal(state),date)));assert.equal(JSON.stringify(state),snapshot);
  undoPantryMovement(state,id);assert.equal(state.pantry[0].quantity,1000);assert.equal(row(state).min,50);
  assert.throws(()=>undoPantryMovement(state,id));
});
test('stock insufficiente non crea scarichi parziali o quantità negative',()=>{
  const state=planned();stock(state,40);const before=JSON.stringify(state);
  assert.throws(()=>consumePantry(state,meal(state),mealShoppingRows(meal(state),date)),/insufficiente/);
  assert.equal(JSON.stringify(state),before);
});
test('unità e crudo/cotto non vengono mescolati nella sottrazione',()=>{
  const state=planned();setPantryStock(state,{label:'Farina',unit:'ml',quantity:1000,packSize:1000});setPantryStock(state,{label:'Farina',unit:'g',preparationState:'cotto',quantity:1000,packSize:1000});
  assert.equal(row(state).onHand,0);assert.equal(row(state).shortage,50);
});
test('misure mancanti non sono inventate: scarico parziale esplicito nello storico',()=>{
  const state=planned();const m=meal(state);m.snapshot.ingredients.push({...m.snapshot.ingredients[0],label:'Sale',quantity:null,unit:null});stock(state,100);
  consumePantry(state,m,mealShoppingRows(m,date));
  assert.equal(state.pantry[0].quantity,50);assert.deepEqual(state.pantryMovements[0].untracked,['Sale']);
});
test('annullare acquisti già consumati richiede prima ripristinare gli scarichi',()=>{
  const state=planned();const purchase=purchasePack(state,row(state),1000,1);
  const cook=consumePantry(state,meal(state),mealShoppingRows(meal(state),date));
  const before=JSON.stringify(state);assert.throws(()=>undoPantryMovement(state,purchase));assert.equal(JSON.stringify(state),before);
  undoPantryMovement(state,cook);undoPantryMovement(state,purchase);assert.equal(state.pantry[0].quantity,0);
});
test('backup vecchi compatibili, nuovi campi validati e movimenti duplicati rifiutati',()=>{
  const state=planned(),legacy=JSON.stringify(state);assert.deepEqual(parseBackup(legacy),state);
  purchasePack(state,row(state),1000,1);consumePantry(state,meal(state),mealShoppingRows(meal(state),date));
  assert.deepEqual(parseBackup(JSON.stringify(state)),state);
  for(const bad of [-1,NaN,Infinity]) assert.throws(()=>setPantryStock(freshState(),{label:'Farina',unit:'g',quantity:bad,packSize:1000}));
  const duplicate=structuredClone(state);duplicate.pantryMovements.push({...duplicate.pantryMovements.at(-1),id:'another-move'});assert.throws(()=>parseBackup(JSON.stringify(duplicate)),/due volte/);
  const wrong=structuredClone(state);wrong.pantry[0].unit='cup';assert.throws(()=>parseBackup(JSON.stringify(wrong)));
});
test('quota e backup fallito lasciano scorte, diario e movimenti identici',()=>{
  class Store {data=new Map();fail=false;get length(){return this.data.size;}key(i){return [...this.data.keys()][i]??null;}getItem(k){return this.data.get(k)??null;}setItem(k,v){if(this.fail)throw Error('Quota');this.data.set(k,v);}}
  const store=new Store(),repo=new Repository(store);repo.commit(planned());const raw=repo.raw;
  store.fail=true;assert.throws(()=>repo.update(state=>purchasePack(state,row(state),1000,1),{backup:true}));assert.equal(repo.raw,raw);assert.equal(store.getItem(STORAGE_KEY),raw);
  store.fail=false;repo.update(state=>purchasePack(state,row(state),1000,1),{backup:true});assert.equal(repo.backups()[0].raw,raw);
});
