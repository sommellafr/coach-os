import { weekDates, formatDate } from './domain.js';
import { portionForMeal } from './meals.js';

const normalize = text => String(text ?? '').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('it').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const units = {
  g:['g',1], gr:['g',1], grammi:['g',1], kg:['g',1000],
  ml:['ml',1], l:['ml',1000], litri:['ml',1000],
  pezzi:['pezzi',1], pezzo:['pezzi',1],
};
function preparation(value) {
  const normalized = normalize(value);
  if (['cotto','cotta','cotti','cotte'].includes(normalized)) return 'cotto';
  if (['crudo','cruda','crudi','crude'].includes(normalized)) return 'crudo';
  if (['secco','secca','secchi','secche'].includes(normalized)) return 'secco';
  if (['sgocciolato','sgocciolata','sgocciolati','sgocciolate'].includes(normalized)) return 'sgocciolato';
  if (['scolato','scolata','scolati','scolate'].includes(normalized)) return 'scolato';
  return normalized || 'non specificato';
}
const tidy = n => Number(n.toPrecision(12));
export function shoppingForWeek(state, date, {includeOptional = false} = {}) {
  const dates = weekDates(date);
  const rows = new Map();
  let mealCount = 0; let optionalCount = 0; let filledSlots = 0;
  for (const dayDate of dates) {
    const meals = (state.days[dayDate]?.meals || []).filter(m=>m.status==='planned');
    filledSlots += new Set(meals.map(m=>m.slot)).size;
    for (const meal of meals) {
      mealCount++;
      for (const item of portionForMeal(meal).ingredients) {
        if (item.optional) { optionalCount++; if(!includeOptional) continue; }
        const normalizedUnit = normalize(item.unit);
        const [unit, factor] = units[normalizedUnit] || [normalizedUnit || null, 1];
        const prep = preparation(item.preparationState);
        // Identità volutamente conservativa: niente equivalenze arbitrarie tra
        // alimenti, marche/varianti, densità, pesi crudi/cotti o unità ignote.
        const key = JSON.stringify([normalize(item.label),unit,prep]);
        if (!rows.has(key)) rows.set(key,{key,label:item.label,unit,preparationState:prep,min:0,max:0,knownCount:0,unknownCount:0,optionalOnly:true,notes:new Set(),uses:[]});
        const row = rows.get(key);
        row.optionalOnly &&= item.optional;
        if(item.note) row.notes.add(item.note);
        if(item.quantityRange) {
          row.min += item.quantityRange.min * factor; row.max += item.quantityRange.max * factor; row.knownCount++;
        } else if(item.quantity !== null) {
          row.min += item.quantity * factor; row.max += item.quantity * factor; row.knownCount++;
        } else row.unknownCount++;
        row.uses.push({date:dayDate,slot:meal.slot,title:meal.snapshot.title,mealId:meal.id});
      }
    }
  }
  const ingredients = [...rows.values()].map(row=>{
    row.min = row.knownCount ? tidy(row.min) : null;
    row.max = row.knownCount ? tidy(row.max) : null;
    row.notes = [...row.notes];
    // Cambiare il fabbisogno cambia la firma: una vecchia spunta non copre
    // automaticamente la nuova quantità. Giorni e ordine non la influenzano.
    row.signature = JSON.stringify([row.key,row.min,row.max,row.unknownCount]);
    row.needsReview = row.unknownCount>0 || row.unit===null;
    return row;
  }).sort((a,b)=>a.label.localeCompare(b.label,'it') || String(a.unit).localeCompare(String(b.unit)) || a.preparationState.localeCompare(b.preparationState));
  return {weekStart:dates[0],dates,mealCount,filledSlots,optionalCount,includeOptional,ingredients};
}
const number = value => new Intl.NumberFormat('it-IT',{maximumSignificantDigits:5}).format(value);
export function shoppingAmount(row) {
  const amount = row.min === null ? 'q.b. / dose da definire' : row.min === row.max ? number(row.min) : `${number(row.min)}–${number(row.max)}`;
  return `${amount}${row.min !== null ? ` ${row.unit || '(unità da chiarire)'}` : row.unit ? ` ${row.unit}` : ''}${row.min !== null && row.unknownCount ? ' + dosi non indicate' : ''}`;
}
export function shoppingText(report, checked = []) {
  const done = new Set(checked);
  return `COACH OS · LISTA DELLA SPESA\n${formatDate(report.dates[0])} — ${formatDate(report.dates.at(-1))}\n${report.mealCount} ricette in dose singola pianificate. Facoltativi ${report.includeOptional ? 'inclusi' : 'esclusi'}.\n\n${report.ingredients.map(row=>`${done.has(row.signature)?'[x]':'[ ]'} ${row.label}: ${shoppingAmount(row)}${row.preparationState!=='non specificato' ? ` · ${row.preparationState}` : ''}${row.needsReview ? ' · DA VALUTARE A MANO' : ''}`).join('\n')}\n\nQuantità dagli snapshot dei pasti. Solo g/kg e ml/l vengono convertiti; unità incompatibili e pesi crudi/cotti restano separati. Non include confezioni o sottrazione automatica della dispensa.\n`;
}
