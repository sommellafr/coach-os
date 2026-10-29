import { isMetricConvertible, sourceAmount, validateMetricOverrides, metricIngredient } from './metric.js';
import { mealBatchYield } from './meals.js';
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export function metricFields(recipe, overrides=[]) {
  const items=recipe.ingredients.map((item,index)=>({item,index})).filter(({item,index})=>!isMetricConvertible(item)||overrides.some(entry=>entry.index===index));
  if(!items.length) return '';
  return `<details class="metric-fields"><summary>Pesi da confermare in g o ml · ${items.length} ingredienti</summary><p>Indica il peso o volume <strong>totale della voce nella preparazione originale</strong>, prima della divisione in porzioni. Puoi leggerlo sulla confezione o pesarlo. Lascia vuoto ciò che non conosci: nella spesa sarà da confermare.</p>${items.map(({item,index})=>{
    const saved=overrides.find(entry=>entry.index===index);
    return `<fieldset class="metric-field" data-metric-index="${index}"><legend>${safe(item.label)}</legend><p>Fonte, intera preparazione: <strong>${safe(sourceAmount(item))}</strong></p><div class="inline"><label>Totale misurato<input type="number" name="metric-quantity-${index}" min="0.001" max="1000000" step="any" inputmode="decimal" value="${saved?.quantity??''}" placeholder="Da confermare"></label><label>Unità<select name="metric-unit-${index}"><option value="g" ${saved?.unit!=='ml'?'selected':''}>g</option><option value="ml" ${saved?.unit==='ml'?'selected':''}>ml</option></select></label></div></fieldset>`;
  }).join('')}</details>`;
}
export function readMetricFields(form,recipe) {
  const entries=[...form.querySelectorAll('[data-metric-index]')].flatMap(field=>{
    const input=field.querySelector('input');
    if(input.validity.badInput) throw Error('Indica una misura numerica valida.');
    if(!input.value.trim()) return [];
    return [{index:Number(field.dataset.metricIndex),quantity:Number(input.value),unit:field.querySelector('select').value}];
  });
  return validateMetricOverrides(entries,recipe.ingredients.length);
}
export function portionPreview(recipe,portions,people,overrides=[]) {
  if(!Number.isInteger(portions)||portions<1||!Number.isInteger(people)||people<1) return '<p>Indica la resa della preparazione per vedere le quantità del pasto.</p>';
  return `<p><strong>Ingredienti per questo pasto · ${people} ${people===1?'persona':'persone'}</strong></p><ul>${recipe.ingredients.map((item,index)=>{
    const metric=metricIngredient(item,overrides.find(entry=>entry.index===index));
    if(metric.quantity!==null) metric.quantity*=people/portions;
    if(metric.quantityRange) {metric.quantityRange.min*=people/portions;metric.quantityRange.max*=people/portions;}
    return `<li>${safe(item.label)}: <strong>${metric.metricPending?'Peso/volume da confermare':safe(sourceAmount(metric))}</strong></li>`;
  }).join('')}</ul>`;
}
export function pickerPortionSetup(recipe,overrides=[]) {
  const batchYield=mealBatchYield(recipe);
  const known=batchYield!==null;
  return `<h3 id="picker-selected-title">${safe(recipe.title)}</h3><p class="portion-promise"><strong>Il tuo pasto: 1 porzione per te.</strong></p><label for="planner-portions">${known?'Divisione automatica della preparazione':'Quante porzioni ottieni da tutta questa preparazione?'}<input type="number" id="planner-portions" min="1" max="1000" step="1" required ${known?'readonly':''} value="${batchYield??''}" inputmode="numeric"></label><p id="picker-yield-note" class="hint">${known?`La fonte prepara ${safe(recipe.yield.quantity)} ${safe(recipe.yield.unit)}. Per il tuo pasto usiamo 1/${recipe.yield.quantity} degli ingredienti.`:`Serve il numero di pasti ricavati dall’intera preparazione, non il numero di persone a tavola. ${recipe.yield.quantity!==null?`La fonte indica ${safe(recipe.yield.quantity)} ${safe(recipe.yield.unit)}: questo numero non equivale automaticamente a pasti.`:'La resa manca nella fonte.'}`}</p><details class="people-choice"><summary>Preparo anche per altre persone</summary><label for="planner-people">Persone a tavola<input id="planner-people" type="number" min="1" max="20" step="1" required value="1" inputmode="numeric"></label><p>Una porzione per persona, per ciascun giorno scelto. Non cambia la divisione della ricetta originale.</p></details>${metricFields(recipe,overrides)}<details class="portion-preview"><summary>Vedi gli ingredienti del tuo pasto</summary><div id="portion-preview">${portionPreview(recipe,batchYield,1,overrides)}</div></details>`;
}
