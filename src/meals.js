import { scaleRecipe } from './recipes.js';
import { metricIngredient, validateMetricOverrides } from './metric.js';
import { cookedMovement } from './pantry.js';

export const MEAL_SLOTS = { breakfast: 'Colazione', lunch: 'Pranzo', dinner: 'Cena' };
// Unità organizzative della fonte, non porzioni nutrizionali prescritte.
// Strisce, bocconcini e polpette non equivalgono automaticamente a pasti.
export function mealBatchYield(recipe) {
  return ['porzioni','burrito','bicchieri','tortine','piadine','contenitori'].includes(recipe.yield.unit) ? recipe.yield.quantity : null;
}
const validNumber = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const fields = ['kcal', 'proteinG', 'carbsG', 'fatG'];
const assert = (condition, message) => { if (!condition) throw Error(message); };
const validText = (value, max = 4000) => typeof value === 'string' && value.length <= max;
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
export function validateBatchPortions(value) {
  assert(Number.isInteger(value) && value >= 1 && value <= 1000, 'Indica quante porzioni producono tutte le dosi originali (intero da 1 a 1000).');
  return value;
}
export function validatePeople(value) {
  assert(Number.isInteger(value)&&value>=1&&value<=20,'Indica da 1 a 20 persone. Una porzione per persona.');
  return value;
}
export function createMeal(recipe, slot, batchPortions, {people=1,metricOverrides=[]}={}) {
  assert(Object.hasOwn(MEAL_SLOTS, slot), 'Pasto non valido.');
  validateBatchPortions(batchPortions);
  // Snapshot degli ingredienti originali, non un riferimento al catalogo vivo.
  const snapshot = structuredClone({
    id: recipe.id, version: recipe.version, title: recipe.title,
    sourceIds: recipe.sourceIds, yield: recipe.yield, ingredients: recipe.ingredients,
    nutrition: recipe.nutrition, uncertainties: recipe.uncertainties,
  });
  const meal = { id: crypto.randomUUID(), slot, status: 'planned', quantity: 1, batchPortions, snapshot, people:validatePeople(people), metricOverrides:structuredClone(metricOverrides) };
  validateMeals([meal]);
  return meal;
}
export function portionForMeal(meal) {
  const scaled = scaleRecipe(meal.snapshot, (meal.people??1) / meal.batchPortions);
  return { ingredients: scaled.recipe.ingredients, nutrition: scaled.nutritionTotal };
}
export function metricPortionForMeal(meal) {
  const ingredients=meal.snapshot.ingredients.map((item,index)=>metricIngredient(item,meal.metricOverrides?.find(entry=>entry.index===index)));
  const scaled=scaleRecipe({...meal.snapshot,ingredients},(meal.people??1)/meal.batchPortions);
  return {ingredients:scaled.recipe.ingredients,nutrition:scaled.nutritionTotal};
}
export function portionIssues(state,dates) {
  return dates.flatMap(date=>(state.days[date]?.meals||[]).filter(meal=>!cookedMovement(state,meal.id)&&mealBatchYield(meal.snapshot)!==null&&meal.batchPortions!==mealBatchYield(meal.snapshot)).map(meal=>({date,mealId:meal.id,title:meal.snapshot.title,before:meal.batchPortions,after:mealBatchYield(meal.snapshot)})));
}
export function correctPortions(state,dates) {
  const issues=portionIssues(state,dates);
  issues.forEach(issue=>validateBatchPortions(issue.after));
  for(const issue of issues) state.days[issue.date].meals.find(meal=>meal.id===issue.mealId).batchPortions=validateBatchPortions(issue.after);
  return issues.length;
}
export function validateMeals(meals, ids = new Set()) {
  assert(Array.isArray(meals) && meals.length <= 60, 'Pasti del giorno non validi (massimo 60 ricette).');
  for (const meal of meals) {
    assert(meal && validId(meal.id) && !ids.has(meal.id) && Object.hasOwn(MEAL_SLOTS, meal.slot), 'Pasto non valido o identificativo duplicato.');
    ids.add(meal.id);
    assert(meal.status === 'planned' && meal.quantity === 1, 'Questa versione supporta pasti pianificati in dose singola.');
    validateBatchPortions(meal.batchPortions);
    if(meal.people!==undefined) validatePeople(meal.people);
    const s = meal.snapshot;
    assert(s && validId(s.id) && Number.isSafeInteger(s.version) && s.version > 0 && validText(s.title,160) && s.title.trim(), 'Snapshot ricetta non valido.');
    assert(s.yield && (s.yield.quantity === null || (validNumber(s.yield.quantity) && s.yield.quantity > 0)) && (s.yield.unit === null || validText(s.yield.unit,80)), 'Resa della ricetta non valida.');
    assert(Array.isArray(s.sourceIds) && s.sourceIds.length > 0 && s.sourceIds.length <= 31 && s.sourceIds.every(id=>/^SRC-\d{2}$/.test(id)), 'Fonti del pasto non valide.');
    assert(Array.isArray(s.uncertainties) && s.uncertainties.length <= 100 && s.uncertainties.every(u=>validText(u)), 'Note del pasto non valide.');
    assert(Array.isArray(s.ingredients) && s.ingredients.length > 0 && s.ingredients.length <= 100, 'Ingredienti del pasto non validi.');
    if(meal.metricOverrides!==undefined) validateMetricOverrides(meal.metricOverrides,s.ingredients.length);
    for (const item of s.ingredients) {
      assert(item && validText(item.label,160) && item.label.trim() && validText(item.note) && validText(item.preparationState,80) && typeof item.optional === 'boolean', 'Ingrediente del pasto non valido.');
      assert(item.quantity === null || validNumber(item.quantity), 'Quantità ingrediente non valida.');
      assert(item.unit === null || validText(item.unit,80), 'Unità ingrediente non valida.');
      if (item.quantityRange) assert(item.quantity === null && validNumber(item.quantityRange.min) && validNumber(item.quantityRange.max) && item.quantityRange.min <= item.quantityRange.max, 'Intervallo ingrediente non valido.');
    }
    const n = s.nutrition;
    if (n !== null) {
      assert(n && ['batch','unit','serving','unspecified'].includes(n.basis) && n.provenance === 'source' && validText(n.verification,80) && validText(n.note), 'Nutrienti del pasto non validi.');
      assert(fields.every(field=>n[field] === null || validNumber(n[field])), 'Valori nutrizionali del pasto non validi.');
    }
  }
}
