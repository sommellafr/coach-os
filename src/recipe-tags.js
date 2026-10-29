// Etichette redazionali per organizzare il menu, non indicazioni nutrizionali
// né testo estratto dalle immagini. Un piatto può appartenere a più pasti.
export const RECIPE_MEAL_LABELS = Object.freeze({ breakfast: 'Colazione', lunch: 'Pranzo', dinner: 'Cena' });
const breakfast = Object.freeze(['breakfast']);
const mainMeals = Object.freeze(['lunch', 'dinner']);
export const RECIPE_MEAL_TAGS = Object.freeze(Object.fromEntries([
  ...[
    'pancake-banana', 'banana-snack', 'crepes-cacao', 'cloud-bread',
    'bicchierini-avena', 'tortine-formaggio', 'brownies',
  ].map(id => [id, breakfast]),
  ...[
    'burrito-manzo', 'burrito-chipotle', 'pollo-miele-aglio',
    'piadina-salmone', 'piadina-caprese', 'piadina-veggie', 'piadina-tonno', 'piadina-pollo',
    'rotolo-patate', 'wrap-tonno-fagioli', 'bowl-patate-manzo', 'piadine-ceci', 'piadine-zucchine',
    'riso-pollo-broccoli', 'nuggets-pollo', 'pasta-salmone', 'polpette-tacchino',
    'pasta-lenticchie', 'couscous-ceci', 'risotto-radicchio', 'pasta-ragu', 'risotto-zucca',
    'pasta-fredda-pollo', 'pasta-fredda-avocado', 'pasta-greca',
    'pasta-pomodoro-mozzarella', 'pasta-fredda-mare',
  ].map(id => [id, mainMeals]),
]));
export function recipeMealSlots(recipe) {
  return Object.hasOwn(RECIPE_MEAL_TAGS, recipe.id) ? RECIPE_MEAL_TAGS[recipe.id] : [];
}
export function recipeMatchesMeal(recipe, slot = '') {
  return !slot || recipeMealSlots(recipe).includes(slot);
}
export function renderRecipeMealTags(recipe) {
  return `<span class="recipe-meal-tags" aria-label="Pasti della ricetta">${recipeMealSlots(recipe).map(slot => `<span class="recipe-meal-tag">${RECIPE_MEAL_LABELS[slot]}</span>`).join('')}</span>`;
}
