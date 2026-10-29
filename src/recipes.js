import { icon, recipeArt } from './ui.js';
import { recipeMatchesMeal, renderRecipeMealTags, RECIPE_MEAL_LABELS } from './recipe-tags.js';
import { metricIngredient } from './metric.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const format = value => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(value);
const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const nutrientFields = ['kcal', 'proteinG', 'carbsG', 'fatG'];
export function validateCatalog(catalog) {
  if (!catalog || catalog.catalogVersion !== 1 || !Array.isArray(catalog.recipes)) throw Error('Formato ricettario non supportato.');
  const ids = new Set();
  for (const recipe of catalog.recipes) {
    if (!recipe || !/^[a-z0-9-]+$/.test(recipe.id) || ids.has(recipe.id) || typeof recipe.title !== 'string' || !recipe.title.trim()) throw Error('Ricetta non valida o duplicata.');
    ids.add(recipe.id);
    if (!Array.isArray(recipe.sourceIds) || !recipe.sourceIds.length || !recipe.sourceIds.every(s => /^SRC-\d{2}$/.test(s))) throw Error('Provenienza ricetta non valida.');
    if (!recipe.yield || !(recipe.yield.quantity === null || (number(recipe.yield.quantity) && recipe.yield.quantity > 0))) throw Error('Resa non valida.');
    if (!Array.isArray(recipe.ingredients) || !recipe.ingredients.length || !Array.isArray(recipe.guideSteps) || !recipe.guideSteps.length || !Array.isArray(recipe.sourceSteps) || !Array.isArray(recipe.uncertainties)) throw Error('Contenuto ricetta incompleto.');
    for (const item of recipe.ingredients) {
      if (typeof item.label !== 'string' || !item.label.trim() || !(item.quantity === null || number(item.quantity)) || !(item.unit === null || typeof item.unit === 'string')) throw Error('Ingrediente non valido.');
      if (item.quantityRange && (!number(item.quantityRange.min) || !number(item.quantityRange.max) || item.quantityRange.min > item.quantityRange.max)) throw Error('Intervallo quantità non valido.');
    }
    if (recipe.guideSteps.some(s => !['source','editorial'].includes(s.provenance) || typeof s.text !== 'string' || !s.text.trim())) throw Error('Provenienza dei passaggi non valida.');
    const n = recipe.nutrition;
    if (n && (!['batch','unit','serving','unspecified'].includes(n.basis) || nutrientFields.some(f=>n[f] !== null && !number(n[f])))) throw Error('Nutrienti non validi.');
  }
  return catalog;
}
export async function loadCatalog(fetcher = fetch) {
  const response = await fetcher(new URL('../data/recipes.json',import.meta.url).href);
  if (!response.ok) throw Error(`Caricamento ricettario non riuscito (HTTP ${response.status}).`);
  return validateCatalog(await response.json());
}
const sourceImageUrl = id => new URL(`../assets/recipes/recipe-source-${id.slice(4)}.jpeg`,import.meta.url).href;
export function scaleRecipe(recipe, multiplier) {
  if (typeof multiplier !== 'number' || !Number.isFinite(multiplier) || multiplier <= 0 || multiplier > 20) throw Error('Il moltiplicatore deve essere maggiore di 0 e al massimo 20.');
  const copy = structuredClone(recipe);
  for (const item of copy.ingredients) {
    if (item.quantity !== null) item.quantity *= multiplier;
    if (item.quantityRange) { item.quantityRange.min *= multiplier; item.quantityRange.max *= multiplier; }
  }
  if (copy.yield.quantity !== null) copy.yield.quantity *= multiplier;
  // Il valore per unità resta costante. Il totale è derivabile soltanto se
  // la base è esplicita e la resa è nota. null non diventa mai zero.
  let total = null;
  const n = recipe.nutrition;
  if (n && n.verification !== 'incoerente' && n.basis !== 'unspecified') {
    const factor = n.basis === 'batch' ? multiplier : recipe.yield.quantity === null ? null : recipe.yield.quantity * multiplier;
    if (factor !== null) total = Object.fromEntries(nutrientFields.map(field => [field, n[field] === null ? null : n[field] * factor]));
  }
  return { recipe: copy, multiplier, nutritionTotal: total };
}
export function filterRecipes(recipes, query = '', category = '', mealSlot = '') {
  const normalize = text => text.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('it');
  const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return recipes.filter(r => recipeMatchesMeal(r, mealSlot) && (!category || r.category === category) && words.every(w => normalize(`${r.title} ${r.ingredients.map(i=>i.label).join(' ')}`).includes(w)));
}
function quantity(item) {
  item=metricIngredient(item);
  if(item.metricPending) return 'Peso/volume da confermare';
  const amount = item.quantityRange ? `${format(item.quantityRange.min)}–${format(item.quantityRange.max)}` : item.quantity === null ? 'Dose non indicata / q.b.' : format(item.quantity);
  return `${amount}${item.unit ? ` ${escape(item.unit)}` : ''}`;
}
function yieldLabel(recipe) { return recipe.yield.quantity === null ? 'Resa non indicata nella fonte' : `${format(recipe.yield.quantity)} ${escape(recipe.yield.unit)}`; }
function nutrientGrid(n) {
  return `<dl class="nutrient-grid">${[['kcal','kcal'],['proteinG','Proteine · g'],['carbsG','Carboidrati · g'],['fatG','Grassi · g']].map(([field,label])=>`<div><dt>${label}</dt><dd>${n[field] === null ? '—' : format(n[field])}</dd></div>`).join('')}</dl>`;
}
function renderRecipeCard(recipe) {
  return `<article class="panel recipe-card">${recipeArt(recipe.category)}<div class="recipe-card-content"><p class="eyebrow">${escape(recipe.category)}</p><h2>${escape(recipe.title)}</h2>${renderRecipeMealTags(recipe)}<p class="hint">${recipe.ingredients.length} ingredienti <span aria-hidden="true">·</span> ${yieldLabel(recipe)}</p><div class="recipe-card-bottom"><span class="pill ${recipe.reviewStatus === 'needs_clarification' ? 'draft' : ''}">${recipe.reviewStatus === 'needs_clarification' ? 'Dati da chiarire' : 'Fonte letta'}</span><button class="secondary" data-recipe="${recipe.id}" aria-label="Apri ${escape(recipe.title)}">Apri ricetta ${icon('arrow')}</button></div></div></article>`;
}
export function renderRecipeLibrary({ catalog, error = '', query = '', category = '', mealSlot = '', selectedId = null, multiplier = 1 }) {
  const heading = `<div class="page-heading"><div><p class="eyebrow">DALLE TUE 31 IMMAGINI</p><h1>Il tuo ricettario.</h1><p class="muted">Ingredienti, dosi e passaggi chiari, con la fonte sempre a portata di mano.</p></div></div>`;
  if (!catalog) return `${heading}<section class="panel">${error ? `<h2>Ricettario non disponibile</h2><p>${escape(error)}</p><button class="secondary" data-action="retry-recipes">Riprova</button>` : '<p role="status">Caricamento delle ricette…</p>'}</section>`;
  const selected = catalog.recipes.find(r=>r.id === selectedId);
  if (selected) {
    const scaled = scaleRecipe(selected, multiplier);
    const n = selected.nutrition;
    const basis = n ? ({batch:'intera ricetta originale',unit:'singola unità della resa',serving:'porzione dichiarata',unspecified:'base non specificata nella fonte'}[n.basis]) : '';
    return `${heading}<button class="text-button" data-action="recipe-back">← Torna alle ricette</button><article class="panel recipe-detail"><div class="section-line"><span class="eyebrow">${escape(selected.category)}</span><span class="pill ${selected.reviewStatus === 'needs_clarification' ? 'draft' : ''}">${selected.reviewStatus === 'needs_clarification' ? 'Dati da chiarire' : 'Fonte letta'}</span></div><div class="recipe-title-block"><div><h2>${escape(selected.title)}</h2>${renderRecipeMealTags(selected)}<span class="recipe-title-line">Da preparare, da gustare, da rifare.</span></div>${recipeArt(selected.category, true)}</div><p class="muted small">${escape(selected.author)} · Dosi originali: ${yieldLabel(selected)}</p><form id="recipe-scale-form" class="recipe-scale"><label for="recipe-multiplier">Moltiplica tutte le dosi<input id="recipe-multiplier" type="number" min="0.01" max="20" step="any" required value="${multiplier}" inputmode="decimal"></label><button type="submit" class="secondary">Aggiorna dosi</button><p class="hint">×${format(multiplier)} · ${yieldLabel(scaled.recipe)}. Le quantità non indicate restano sconosciute. I tempi non si moltiplicano.</p></form><div class="recipe-body"><section><h3>Ingredienti</h3><ul class="ingredients-list">${scaled.recipe.ingredients.map(item=>`<li><div><strong>${escape(item.label)}</strong>${item.optional ? '<span class="optional-label">Facoltativo</span>' : ''}<small>${escape(item.note)}${item.preparationState !== 'non specificato' ? ` · ${escape(item.preparationState)}` : ''}</small></div><span>${quantity(item)}</span></li>`).join('')}</ul><p class="hint">Le dosi si riferiscono all’intera preparazione selezionata. Cup, tbsp, tsp, oz e cucchiai sono mantenuti come nella fonte; nessuna conversione automatica in grammi. Le quantità numeriche delle note descrivono la fonte originale a ×1.</p></section><section><h3>Passo dopo passo</h3><p class="hint"><span class="step-origin source">Dalla fonte</span> Riformulazione fedele del testo visibile.<br><span class="step-origin editorial">Guida redazionale</span> Integrazione pratica, assente dall’immagine.</p><ol class="recipe-steps">${selected.guideSteps.map(s=>`<li><span class="step-origin ${s.provenance}">${s.provenance === 'source' ? 'Dalla fonte' : 'Guida redazionale'}</span><p>${escape(s.text)}</p></li>`).join('')}</ol>${multiplier !== 1 ? '<div class="info-note">I passaggi descrivono la preparazione originale a ×1. Per numero di pezzi e dosi usa i valori aggiornati nella lista ingredienti; non moltiplicare tempi o temperature.</div>' : ''}${selected.cooking.length ? `<div class="info-note"><strong>Cotture riportate nella fonte</strong><ul>${selected.cooking.map(c=>`<li>${escape(c.method)}: ${c.temperature} ${escape(c.unit)}, ${c.minutesRange ? c.minutesRange.join('–') : c.minutes} min${c.preheatMinutes ? `, preriscaldamento ${c.preheatMinutes} min` : ''}.</li>`).join('')}</ul><span>Tempi e temperature dichiarati, da adattare all’apparecchio. Nei testi italiani “gradi” è normalizzato in °C.</span></div>` : ''}${selected.restMinutes ? `<p class="hint">Riposo minimo indicato: ${selected.restMinutes} minuti. Non è il tempo totale.</p>` : ''}</section></div><section class="recipe-nutrition"><h3>Nutrienti dichiarati nella fonte</h3>${n ? `<p class="hint">Riferimento: ${basis}. ${escape(n.note)}<br>Stato: ${escape(n.verification)}. I valori non sono stati ricalcolati dagli ingredienti.</p>${nutrientGrid(n)}${scaled.nutritionTotal ? `<details><summary>Totale aritmetico per le dosi scelte · non verificato</summary><p class="hint">Moltiplicazione dei dati dichiarati, non nuova analisi nutrizionale. Non include aggiunte facoltative o alternative se la fonte non le comprende.</p>${nutrientGrid(scaled.nutritionTotal)}</details>` : '<p class="hint">Totale per le dosi scelte non calcolato: base sconosciuta o dati incoerenti.</p>'}` : '<p class="muted">Non disponibili nelle immagini. Nessuna stima aggiunta.</p>'}</section><section class="recipe-uncertainties"><h3>Informazioni mancanti e punti da chiarire</h3>${selected.uncertainties.length ? `<ul>${selected.uncertainties.map(u=>`<li>${escape(u)}</li>`).join('')}</ul>` : '<p class="muted">Nessuna incertezza specifica annotata; nutrienti e metodo non sono stati validati indipendentemente.</p>'}</section><details class="recipe-sources"><summary>Apri le immagini originali e il testo recuperato · ${selected.sourceIds.length} fonti</summary><p class="hint">Le immagini sono gli originali forniti. Il testo qui sotto riassume soltanto il procedimento visibile, senza la guida redazionale.</p>${selected.sourceSteps.length ? `<ul>${selected.sourceSteps.map(s=>`<li>${escape(s)}</li>`).join('')}</ul>` : '<p class="hint">Nessun procedimento completo scritto nella fonte. La guida sopra è redazionale.</p>'}<div class="source-images">${selected.sourceIds.map(id=>`<figure><a href="${escape(sourceImageUrl(id))}" target="_blank" rel="noopener">Apri ${id} a dimensione originale<img src="${escape(sourceImageUrl(id))}" loading="lazy" alt="Screenshot originale ${id} per ${escape(selected.title)}"></a><figcaption>${id} · ${escape(selected.author)}</figcaption></figure>`).join('')}</div></details></article>`;
  }
  const filtered = filterRecipes(catalog.recipes,query,category,mealSlot);
  const categories = [...new Set(catalog.recipes.map(r=>r.category))].sort();
  return `${heading}<div class="recipe-summary"><span class="collection-icon">${icon('book')}</span><div><strong>${catalog.recipes.length}</strong><span>ricette distinte</span></div><div><strong>${catalog.sourceCount}/${catalog.sourceCount}</strong><span>immagini lette</span></div><p>Il catalogo recupera tutte le fonti. Le informazioni mancanti e le aggiunte redazionali restano visibili in ogni ricetta.</p><button class="secondary" data-action="recipe-export">Scarica ricettario JSON</button></div><form id="recipe-filter-form" class="recipe-filters"><label for="recipe-search">Cerca per nome o ingrediente<input type="search" id="recipe-search" maxlength="100" value="${escape(query)}" placeholder="Es. pollo, avena, zucchine"></label><label for="recipe-category">Categoria<select id="recipe-category"><option value="">Tutte le categorie</option>${categories.map(c=>`<option ${c === category ? 'selected' : ''}>${escape(c)}</option>`).join('')}</select></label><label for="recipe-meal">Pasto<select id="recipe-meal"><option value="">Tutti i pasti</option>${Object.entries(RECIPE_MEAL_LABELS).map(([slot,label])=>`<option value="${slot}" ${slot===mealSlot ? 'selected' : ''}>${label}</option>`).join('')}</select></label><button type="submit" class="primary">Filtra ricette</button><button type="button" class="secondary" data-action="recipe-reset">Azzera filtri</button></form><p class="hint" role="status">${filtered.length} ricette visualizzate · categorie ed etichette dei pasti redazionali</p><div class="recipe-grid">${filtered.map(renderRecipeCard).join('')}</div>${!filtered.length ? '<section class="panel"><h2>Nessuna ricetta corrispondente</h2><p class="muted">Prova un ingrediente diverso o azzera i filtri.</p></section>' : ''}`;
}
