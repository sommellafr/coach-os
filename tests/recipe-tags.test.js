import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RECIPE_MEAL_TAGS, RECIPE_MEAL_LABELS, recipeMealSlots } from '../src/recipe-tags.js';
import { filterRecipes, renderRecipeLibrary } from '../src/recipes.js';
import { renderMealPicker, pickerRecipeResults } from '../src/planner-ui.js';
import { renderMeals } from '../src/meal-ui.js';
import { createMeal, MEAL_SLOTS } from '../src/meals.js';
const catalog = JSON.parse(readFileSync(new URL('../data/recipes.json', import.meta.url), 'utf8'));
const recipe = id => catalog.recipes.find(r => r.id === id);

test('tutte le ricette hanno etichette pasto esplicite, senza ID orfani o modifiche alle fonti', () => {
  assert.deepEqual(Object.keys(RECIPE_MEAL_TAGS).sort(), catalog.recipes.map(r => r.id).sort());
  assert.deepEqual(RECIPE_MEAL_LABELS, MEAL_SLOTS);
  for (const r of catalog.recipes) {
    const slots = recipeMealSlots(r);
    assert.ok(slots.length > 0);
    assert.equal(new Set(slots).size, slots.length);
    assert.ok(slots.every(slot => Object.hasOwn(MEAL_SLOTS, slot)));
    assert.equal('mealSlots' in r, false);
  }
  assert.deepEqual(recipeMealSlots({ id: 'nuova-ricetta' }), []);
});

test('colazione esclude piatti salati; pranzo e cena condividono ricette e combinano ricerca e categoria', () => {
  const breakfast = filterRecipes(catalog.recipes, '', '', 'breakfast');
  assert.equal(breakfast.length, 7);
  assert.ok(breakfast.some(r => r.id === 'pancake-banana'));
  assert.ok(!breakfast.some(r => r.id === 'pasta-ragu'));
  for (const slot of ['lunch', 'dinner']) {
    assert.equal(filterRecipes(catalog.recipes, '', '', slot).length, 27);
    assert.ok(filterRecipes(catalog.recipes, 'pollo', 'Primi', slot).some(r => r.id === 'pasta-fredda-pollo'));
    assert.equal(filterRecipes(catalog.recipes, 'pancake', '', slot).length, 0);
  }
  assert.equal(filterRecipes(catalog.recipes, 'avena', '', 'breakfast')[0].id, 'bicchierini-avena');
  assert.equal(filterRecipes(catalog.recipes, '', '', 'invalid').length, 0);
  assert.equal(filterRecipes(catalog.recipes).length, 34);
});

test('selettori rapido e giornaliero applicano lo stesso pasto anche dopo una ricerca', () => {
  const picker = renderMealPicker({ date: '2026-11-02', slot: 'breakfast', catalog });
  assert.ok(picker.includes('data-pick-recipe="pancake-banana"'));
  assert.ok(!picker.includes('data-pick-recipe="pasta-ragu"'));
  assert.ok(!pickerRecipeResults(catalog, 'pollo', '', 'breakfast').includes('data-pick-recipe='));
  for (const slot of ['lunch', 'dinner']) {
    const results = pickerRecipeResults(catalog, '', '', slot);
    assert.ok(results.includes('data-pick-recipe="pasta-ragu"'));
    assert.ok(!results.includes('data-pick-recipe="pancake-banana"'));
  }
  const daily = renderMeals({ date: '2026-11-02', catalog, editable: true });
  for (const slot of Object.keys(MEAL_SLOTS)) {
    const options = daily.split(`id="meal-recipe-${slot}"`)[1].split('</select>')[0];
    for (const r of catalog.recipes) assert.equal(options.includes(`value="${r.id}"`), recipeMealSlots(r).includes(slot));
  }
});

test('ricettario mostra etichette e filtro pasto, senza nascondere dettagli o pasti salvati in passato', () => {
  const library = renderRecipeLibrary({ catalog, mealSlot: 'breakfast' });
  assert.ok(library.includes('id="recipe-meal"'));
  assert.ok(library.includes('data-recipe="pancake-banana"'));
  assert.ok(!library.includes('data-recipe="pasta-ragu"'));
  const detail = renderRecipeLibrary({ catalog, selectedId: 'pasta-ragu', mealSlot: 'breakfast' });
  assert.ok(detail.includes('recipe-meal-tag">Pranzo'));
  assert.ok(detail.includes('recipe-meal-tag">Cena'));
  const oldMeal = createMeal(recipe('pasta-ragu'), 'breakfast', 2);
  const before = structuredClone(oldMeal);
  assert.ok(renderMeals({ date: '2026-11-02', day: { meals: [oldMeal] }, catalog, editable: true }).includes('Pasta al ragù di manzo'));
  assert.deepEqual(oldMeal, before);
});
