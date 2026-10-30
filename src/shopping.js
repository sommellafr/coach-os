import { weekDates, formatDate, localDate } from './domain.js';
import { metricPortionForMeal } from './meals.js';
import { ingredientKey, normalizeIngredient, normalizePreparation, pantryEntry, cookedMovement } from './pantry.js';
import { suggestedPackage, packLabel } from './packages.js';

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
export function shoppingForWeek(state, date, {includeOptional = false,inventory=true,fromDate=localDate()} = {}) {
  const dates = weekDates(date);
  const rows = new Map();
  let mealCount = 0; let optionalCount = 0; let filledSlots = 0;
  for (const dayDate of dates) {
    const meals = (state.days[dayDate]?.meals || []).filter(m=>m.status==='planned');
    filledSlots += new Set(meals.map(m=>m.slot)).size;
    for (const meal of meals) {
      if(cookedMovement(state,meal.id)) continue;
      mealCount++;
      for (const [ingredientIndex,item] of metricPortionForMeal(meal).ingredients.entries()) {
        if (item.optional) { optionalCount++; if(!includeOptional) continue; }
        const normalizedUnit = normalize(item.unit);
        const [unit, factor] = units[normalizedUnit] || [normalizedUnit || null, 1];
        const prep = preparation(item.preparationState);
        // Identità volutamente conservativa: niente equivalenze arbitrarie tra
        // alimenti, marche/varianti, densità, pesi crudi/cotti o unità ignote.
        const key = ingredientKey(item.label,unit,prep);
        if (!rows.has(key)) rows.set(key,{key,label:item.label,unit,preparationState:prep,min:0,max:0,knownCount:0,unknownCount:0,optionalOnly:true,notes:new Set(),uses:[]});
        const row = rows.get(key);
        row.optionalOnly &&= item.optional;
        if(item.note) row.notes.add(item.note);
        if(item.metricPending) row.notes.add(`Da pesare in g o ml. Nella preparazione originale: ${item.originalAmount}.`);
        if(item.measurementOrigin==='user') row.notes.add('Peso/volume confermato dall’utente, conservato separatamente dalla fonte.');
        if(item.quantityRange) {
          row.min += item.quantityRange.min * factor; row.max += item.quantityRange.max * factor; row.knownCount++;
        } else if(item.quantity !== null) {
          row.min += item.quantity * factor; row.max += item.quantity * factor; row.knownCount++;
        } else row.unknownCount++;
        row.uses.push({date:dayDate,slot:meal.slot,title:meal.snapshot.title,mealId:meal.id,ingredientIndex});
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
  if(inventory) {
    const earlier={};
    for(const [day,record] of Object.entries(state.days)) {
      if(day<fromDate||day>=dates[0]) continue;
      const include=state.shoppingWeeks?.[weekDates(day)[0]]?.includeOptional||false;
      for(const meal of record.meals||[]) {
        if(cookedMovement(state,meal.id)) continue;
        for(const item of metricPortionForMeal(meal).ingredients) {
          if(item.optional&&!include) continue;
          const key=ingredientKey(item.label,item.unit,item.preparationState);
          earlier[key]=(earlier[key]||0)+(item.quantityRange?.max??item.quantity??0);
        }
      }
    }
    for(const row of ingredients) {
      const stock=pantryEntry(state,row),pack=suggestedPackage(row.label,row.unit);
      row.onHand=stock?.quantity||0;row.reservedEarlier=earlier[row.key]||0;
      row.available=Math.max(0,row.onHand-row.reservedEarlier);
      row.tapWater=['acqua','acqua tiepida','acqua bollente','acqua per la salsa'].includes(normalizeIngredient(row.label));
      row.shortage=row.max===null?null:row.tapWater?0:(row.max+row.reservedEarlier-row.onHand<1e-8?0:tidy(row.max+row.reservedEarlier-row.onHand));
      row.packSize=stock?.packSize??pack?.size??null;
      row.packReference=stock?.packSize?null:pack;
      row.packCount=row.shortage===null||!row.packSize?null:row.shortage>0?Math.max(1,Math.ceil(row.shortage/row.packSize-1e-10)):0;
      row.buyQuantity=row.packCount===null?null:tidy(row.packCount*row.packSize);
      row.expectedLeftover=row.buyQuantity===null?null:tidy(row.onHand+row.buyQuantity-row.reservedEarlier-row.max);
    }
  }
  return {weekStart:dates[0],dates,mealCount,filledSlots,optionalCount,includeOptional,ingredients};
}
export function mealShoppingRows(meal,date,includeOptional=false) {
  return shoppingForWeek({days:{[date]:{meals:[meal]}}},date,{includeOptional,inventory:false}).ingredients.filter(row=>!['acqua','acqua tiepida','acqua bollente','acqua per la salsa'].includes(normalizeIngredient(row.label)));
}
export function pantryReservations(state,fromDate=localDate()) {
  const days=Object.fromEntries(Object.entries(state.days).filter(([date])=>date>=fromDate));
  const weeks=[...new Set(Object.keys(days).map(date=>weekDates(date)[0]))],result=new Map();
  for(const week of weeks) {
    const report=shoppingForWeek({...state,days},week,{includeOptional:state.shoppingWeeks?.[week]?.includeOptional||false,inventory:false});
    for(const row of report.ingredients) {
      if(!result.has(row.key))result.set(row.key,{...row,min:0,max:0,unknownCount:0});
      const total=result.get(row.key);total.min+=row.min??0;total.max+=row.max??0;total.unknownCount+=row.unknownCount;
    }
  }
  return result;
}
const number = value => new Intl.NumberFormat('it-IT',{maximumSignificantDigits:5}).format(value);
export function shoppingAmount(row) {
  const amount = row.min === null ? 'Peso/volume da confermare' : row.min === row.max ? number(row.min) : `${number(row.min)}–${number(row.max)}`;
  return `${amount}${row.min !== null ? ` ${row.unit || '(unità da chiarire)'}` : row.unit ? ` ${row.unit}` : ''}${row.min !== null && row.unknownCount ? ' + dosi non indicate' : ''}`;
}
export function shoppingText(report, checked = []) {
  const done = new Set(checked);
  return `COACH OS · LISTA DELLA SPESA\n${formatDate(report.dates[0])} — ${formatDate(report.dates.at(-1))}\n${report.mealCount} piatti da preparare. Facoltativi ${report.includeOptional?'inclusi':'esclusi'}.\n\n${report.ingredients.map(row=>`${row.label}: servono ${shoppingAmount(row)}${row.tapWater?' · acqua di rubinetto, esclusa dagli acquisti':row.shortage===0?' · coperto dalla dispensa':row.packCount!==null&&row.packCount!==undefined?` · compra ${row.packCount} confezioni da ${packLabel(row.packSize,row.unit)} (${packLabel(row.buyQuantity,row.unit)})`:' · formato/peso da confermare'}${row.needsReview?' · DATI INCOMPLETI':''}`).join('\n')}\n\nScorte sottratte senza cambiarle: i piani riservano, Ho preparato scarica. Ho acquistato carica confezioni reali. Formati modificabili, non minimi universali.\n`;
}
