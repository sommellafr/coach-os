import { isMetricConvertible, sourceAmount, validateMetricOverrides, metricIngredient } from './metric.js';
import { servingBasis } from './single-serving.js';
import { estimateForRecipe, estimateSummary } from './nutrition-ui.js';
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export function metricFields(recipe, overrides=[]) {
  const items=recipe.ingredients.map((item,index)=>({item,index})).filter(({item,index})=>!isMetricConvertible(item)||item.quantity===null||overrides.some(entry=>entry.index===index));
  if(!items.length) return '';
  return `<details class="metric-fields"><summary>Pesi da confermare in g o ml · ${items.length} ingredienti</summary><p>Indica il peso o volume <strong>per una porzione</strong>, della ricetta. Puoi leggerlo sulla confezione o pesarlo. Lascia vuoto ciò che non conosci: nella spesa sarà da confermare.</p>${items.map(({item,index})=>{
    const saved=overrides.find(entry=>entry.index===index);
    return `<fieldset class="metric-field" data-metric-index="${index}"><legend>${safe(item.label)}</legend><p>Riferimento per 1 porzione: <strong>${safe(sourceAmount({...item,quantity:item.quantity===null?null:item.quantity/servingBasis(recipe).count,quantityRange:item.quantityRange?{min:item.quantityRange.min/servingBasis(recipe).count,max:item.quantityRange.max/servingBasis(recipe).count}:undefined}))}</strong></p><div class="inline"><label>Quantità per 1 porzione<input type="number" name="metric-quantity-${index}" min="0.001" max="1000000" step="any" inputmode="decimal" value="${saved?Number((saved.quantity/servingBasis(recipe).count).toPrecision(12)):''}" placeholder="Da confermare"></label><label>Unità<select name="metric-unit-${index}"><option value="g" ${saved?.unit!=='ml'?'selected':''}>g</option><option value="ml" ${saved?.unit==='ml'?'selected':''}>ml</option></select></label></div></fieldset>`;
  }).join('')}</details>`;
}
export function readMetricFields(form,recipe) {
  const entries=[...form.querySelectorAll('[data-metric-index]')].flatMap(field=>{
    const input=field.querySelector('input');
    if(input.validity.badInput) throw Error('Indica una misura numerica valida.');
    if(!input.value.trim()) return [];
    return [{index:Number(field.dataset.metricIndex),quantity:Number(input.value)*servingBasis(recipe).count,unit:field.querySelector('select').value}];
  });
  return validateMetricOverrides(entries,recipe.ingredients.length);
}
export function portionPreview(recipe,portions,people,overrides=[],state={}) {
  if(!Number.isInteger(portions)||portions<1||!Number.isInteger(people)||people<1) return '<p>Indica la resa della preparazione per vedere le quantità del pasto.</p>';
  return `${estimateSummary(estimateForRecipe(recipe,state,people,overrides))}<p><strong>Ingredienti per questo pasto · ${people} ${people===1?'persona':'persone'}</strong></p><ul>${recipe.ingredients.map((item,index)=>{
    const metric=metricIngredient(item,overrides.find(entry=>entry.index===index));
    if(metric.quantity!==null) metric.quantity*=people/portions;
    if(metric.quantityRange) {metric.quantityRange.min*=people/portions;metric.quantityRange.max*=people/portions;}
    return `<li>${safe(item.label)}: <strong>${metric.metricPending?'Peso/volume da confermare':safe(sourceAmount(metric))}</strong></li>`;
  }).join('')}</ul>`;
}
export function pickerPortionSetup(recipe,overrides=[],state={}) {
  const basis=servingBasis(recipe);
  return `<h3 id="picker-selected-title">${safe(recipe.title)}</h3><p class="portion-promise"><strong>Ricetta base: 1 porzione.</strong></p><label for="planner-portions">Quante porzioni vuoi preparare?<input type="number" id="planner-portions" min="1" max="20" step="1" required value="1" inputmode="numeric"></label><p class="hint">Una porzione per persona, in ciascun giorno selezionato.</p>${basis.provenance==='editorial'?'<p class="hint">Porzione pratica redazionale: la fonte non dichiarava un numero di pasti. Non equivale a una prescrizione nutrizionale.</p>':''}<div class="portion-preview" id="portion-preview">${portionPreview(recipe,basis.count,1,overrides,state)}</div>${metricFields(recipe,overrides)}`;
}
