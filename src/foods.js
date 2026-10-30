// Diario consumato separato dai menu ricetta pianificati. Valori congelati per voce.
export const NUTRIENTS = ['kcal','proteinG','carbsG','fatG'];
export const FOOD_SLOTS = {breakfast:'Colazione',lunch:'Pranzo',dinner:'Cena',extra:'Extra'};
const assert=(v,m)=>{if(!v)throw Error(m);};
const text=(v,n=160)=>typeof v==='string'&&v.trim().length>0&&v.length<=n;
const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v);
export function foodNumber(value,max=1000) {
  if(value===null||String(value).trim()==='')return null;
  const n=Number(String(value).replace(',','.'));
  assert(Number.isFinite(n)&&n>=0&&n<=max,'Quantità o valore nutrizionale non valido.');return n;
}
export function validateProduct(p) {
  assert(p&&id(p.id)&&text(p.name)&&typeof p.brand==='string'&&p.brand.length<=160&&['g','ml'].includes(p.unit),'Alimento non valido.');
  assert(p.barcode===null||/^\d{8,14}$/.test(p.barcode),'Codice a barre non valido.');
  assert(['manual','openfoodfacts'].includes(p.source)&&typeof p.favorite==='boolean','Provenienza alimento non valida.');
  if(p.usualAmount!==undefined)assert(typeof p.usualAmount==='number'&&p.usualAmount>0&&foodNumber(p.usualAmount,10000)===p.usualAmount,'Quantità abituale non valida.');
  assert(p.nutrients&&NUTRIENTS.every(k=>p.nutrients[k]===null||(typeof p.nutrients[k]==='number'&&foodNumber(p.nutrients[k],k==='kcal'?1000:100)===p.nutrients[k])),'Nutrienti non validi: usa valori per 100 g/ml.');
  assert(NUTRIENTS.some(k=>p.nutrients[k]!==null),'Inserisci almeno un valore nutrizionale; i mancanti restano sconosciuti.');
  assert(p.nutrients.proteinG===null||p.nutrients.carbsG===null||p.nutrients.fatG===null||p.nutrients.proteinG+p.nutrients.carbsG+p.nutrients.fatG<=105,'Controlla i macro: superano 100 g su 100 g/ml.');
  return p;
}
function validateItems(items) {
  assert(Array.isArray(items)&&items.length>0&&items.length<=50,'Aggiungi da 1 a 50 alimenti.');
  for(const item of items){validateProduct(item.product);assert(typeof item.amount==='number'&&foodNumber(item.amount,10000)===item.amount&&item.amount>0,'Indica una quantità maggiore di zero (massimo 10000 g/ml).');}
}
export function validateFoods(state) {
  for(const [key,max,validate] of [['foodProducts',1000,validateProduct],['habitualMeals',100,m=>{assert(m&&id(m.id)&&text(m.name),'Pasto abituale non valido.');validateItems(m.items);}]]) {
    if(state[key]===undefined)continue;
    assert(Array.isArray(state[key])&&state[key].length<=max,'Elenco alimentare troppo grande o non valido.');const ids=new Set();
    for(const entry of state[key]){validate(entry);assert(!ids.has(entry.id),'Identificativo alimentare duplicato.');ids.add(entry.id);}
  }
  const ids=new Set();
  for(const [date,day] of Object.entries(state.days||{}))if(day.foodEntries!==undefined){
    assert(Array.isArray(day.foodEntries)&&day.foodEntries.length<=60,'Troppe registrazioni alimentari nella giornata.');
    for(const meal of day.foodEntries){assert(meal&&id(meal.id)&&!ids.has(meal.id)&&meal.date===date&&meal.status==='consumed'&&Object.hasOwn(FOOD_SLOTS,meal.slot)&&text(meal.name),'Registrazione alimentare non valida.');ids.add(meal.id);validateItems(meal.items);}
  }
}
export function nutritionForItems(items) {
  return Object.fromEntries(NUTRIENTS.map(k=>[k,items.every(i=>i.product.nutrients[k]!==null)?items.reduce((n,i)=>n+i.product.nutrients[k]*i.amount/100,0):null]));
}
export function storeProduct(state,product) {
  validateProduct(product);state.foodProducts??=[];
  state.foodProducts=state.foodProducts.filter(p=>p.id!==product.id);state.foodProducts.unshift(structuredClone(product));
  assert(state.foodProducts.length<=1000,'Hai raggiunto 1000 prodotti personali.');
}
export function saveFoodMeal(state,meal,{habitual=false}={}) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(meal.date),'Data non valida.');validateItems(meal.items);
  const day=state.days[meal.date]??={date:meal.date,assignment:null,sessions:[],notes:''};day.foodEntries??=[];
  const existing=day.foodEntries.findIndex(m=>m.id===meal.id);
  if(existing>=0)day.foodEntries[existing]=structuredClone(meal);else day.foodEntries.push(structuredClone(meal));
  for(const item of [...meal.items].reverse())storeProduct(state,{...item.product,usualAmount:item.amount});
  if(habitual){state.habitualMeals??=[];state.habitualMeals.unshift({id:crypto.randomUUID(),name:meal.name,items:structuredClone(meal.items)});}
  validateFoods(state);
}
