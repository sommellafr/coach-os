import { scaleRecipe } from './recipes.js';

export const MEAL_SLOTS = { breakfast: 'Colazione', lunch: 'Pranzo', dinner: 'Cena' };
const validNumber = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const fields = ['kcal', 'proteinG', 'carbsG', 'fatG'];
const assert = (condition, message) => { if (!condition) throw Error(message); };
const validText = (value, max = 4000) => typeof value === 'string' && value.length <= max;
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
export function validateBatchPortions(value) {
  assert(Number.isInteger(value) && value >= 1 && value <= 1000, 'Indica quante porzioni producono tutte le dosi originali (intero da 1 a 1000).');
  return value;
}
export function createMeal(recipe, slot, batchPortions) {
  assert(Object.hasOwn(MEAL_SLOTS, slot), 'Pasto non valido.');
  validateBatchPortions(batchPortions);
  // Snapshot degli ingredienti originali, non un riferimento al catalogo vivo.
  const snapshot = structuredClone({
    id: recipe.id, version: recipe.version, title: recipe.title,
    sourceIds: recipe.sourceIds, yield: recipe.yield, ingredients: recipe.ingredients,
    nutrition: recipe.nutrition, uncertainties: recipe.uncertainties,
  });
  const meal = { id: crypto.randomUUID(), slot, status: 'planned', quantity: 1, batchPortions, snapshot };
  validateMeals([meal]);
  return meal;
}
export function portionForMeal(meal) {
  const scaled = scaleRecipe(meal.snapshot, 1 / meal.batchPortions);
  return { ingredients: scaled.recipe.ingredients, nutrition: scaled.nutritionTotal };
}
export function validateMeals(meals, ids = new Set()) {
  assert(Array.isArray(meals) && meals.length <= 60, 'Pasti del giorno non validi (massimo 60 ricette).');
  for (const meal of meals) {
    assert(meal && validId(meal.id) && !ids.has(meal.id) && Object.hasOwn(MEAL_SLOTS, meal.slot), 'Pasto non valido o identificativo duplicato.');
    ids.add(meal.id);
    assert(meal.status === 'planned' && meal.quantity === 1, 'Questa versione supporta pasti pianificati in dose singola.');
    validateBatchPortions(meal.batchPortions);
    const s = meal.snapshot;
    assert(s && validId(s.id) && Number.isSafeInteger(s.version) && s.version > 0 && validText(s.title,160) && s.title.trim(), 'Snapshot ricetta non valido.');
    assert(s.yield && (s.yield.quantity === null || (validNumber(s.yield.quantity) && s.yield.quantity > 0)) && (s.yield.unit === null || validText(s.yield.unit,80)), 'Resa della ricetta non valida.');
    assert(Array.isArray(s.sourceIds) && s.sourceIds.length > 0 && s.sourceIds.length <= 31 && s.sourceIds.every(id=>/^SRC-\d{2}$/.test(id)), 'Fonti del pasto non valide.');
    assert(Array.isArray(s.uncertainties) && s.uncertainties.length <= 100 && s.uncertainties.every(u=>validText(u)), 'Note del pasto non valide.');
    assert(Array.isArray(s.ingredients) && s.ingredients.length > 0 && s.ingredients.length <= 100, 'Ingredienti del pasto non validi.');
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
