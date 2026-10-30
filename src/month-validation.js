export const MONTH_EXCLUSIONS={meat:'Carne',fish:'Pesce',dairy:'Latticini',eggs:'Uova',nuts:'Frutta a guscio e arachidi',gluten:'Ingredienti con glutine'};
export const WEEKDAY_NAMES=['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
const assert=(v,m)=>{if(!v)throw Error(m);};
export function validateMonthPreferences(p){
  assert(p&&typeof p.month==='string'&&/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(p.month),'Scegli un mese valido.');
  assert(Number.isFinite(p.kcal)&&p.kcal>0&&p.kcal<=10000,'Inserisci le kcal giornaliere obiettivo (fino a 10000).');
  assert(Number.isFinite(p.weight)&&p.weight>0&&p.weight<=500,'Inserisci il peso in kg (fino a 500).');
  assert(Number.isFinite(p.proteinPerKg)&&p.proteinPerKg>0&&p.proteinPerKg<=5,'Inserisci il coefficiente proteico (maggiore di zero, fino a 5 g/kg).');
  assert(Array.isArray(p.weekdays)&&[5,6].includes(p.weekdays.length)&&new Set(p.weekdays).size===p.weekdays.length&&p.weekdays.every(n=>Number.isInteger(n)&&n>=0&&n<=6),'Scegli esattamente 5 o 6 giorni della settimana.');
  assert(Array.isArray(p.excludedGroups)&&new Set(p.excludedGroups).size===p.excludedGroups.length&&p.excludedGroups.every(k=>Object.hasOwn(MONTH_EXCLUSIONS,k)),'Esclusioni alimentari non valide.');
  assert(Array.isArray(p.excludedRecipes)&&p.excludedRecipes.length<=200&&new Set(p.excludedRecipes).size===p.excludedRecipes.length&&p.excludedRecipes.every(k=>typeof k==='string'&&/^[a-z0-9-]{1,80}$/.test(k)),'Esclusioni ricette non valide.');
  assert(typeof p.sides==='boolean','Preferenza contorni non valida.');return p;
}
export function validateMonthlyState(state){
  if(state.monthlyMenuPreferences!==undefined)validateMonthPreferences(state.monthlyMenuPreferences);
  if(state.monthlyMenus!==undefined){
    assert(state.monthlyMenus&&typeof state.monthlyMenus==='object'&&!Array.isArray(state.monthlyMenus)&&Object.keys(state.monthlyMenus).length<=3600,'Archivio menu mensili non valido.');
    for(const [month,p] of Object.entries(state.monthlyMenus)){validateMonthPreferences(p);assert(p.month===month,'Mese del piano non coerente.');}
  }
}
