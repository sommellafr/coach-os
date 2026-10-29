import { weekDates, isDate, newDay } from './domain.js';
import { createMeal, MEAL_SLOTS } from './meals.js';

export function planRecipeOnDates(state, recipe, slot, portions, dates, options={}) {
  const unique = [...new Set(dates)];
  if(!unique.length || unique.length>7 || !unique.every(isDate) || !Object.hasOwn(MEAL_SLOTS,slot)) throw Error('Seleziona da 1 a 7 date valide e un pasto.');
  const week = weekDates(unique[0]);
  if(!unique.every(date=>week.includes(date))) throw Error('Seleziona le date nella stessa settimana.');
  // Validare tutte le destinazioni prima di aggiungere: nessuna applicazione
  // parziale, neppure chiamando il dominio fuori dal repository transazionale.
  const entries = unique.map(date=>{
    if((state.days[date]?.meals?.length || 0)>=60) throw Error('Una delle date ha già il numero massimo di ricette.');
    return {date,meal:createMeal(recipe,slot,portions,options)};
  });
  for(const {date,meal} of entries) {
    state.days[date] ??= newDay(date); state.days[date].meals ??= [];
    state.days[date].meals.push(meal);
  }
  return entries.length;
}
export function copyMenuWeek(state, sourceDate, destinationDate) {
  const source = weekDates(sourceDate); const target = weekDates(destinationDate);
  if(source[0]===target[0]) throw Error('Scegli una settimana diversa.');
  const additions = [];
  source.forEach((date,index)=>{
    if(!target[index]) return;
    for(const slot of Object.keys(MEAL_SLOTS)) {
      if(state.days[target[index]]?.meals?.some(m=>m.slot===slot)) continue;
      const meals = (state.days[date]?.meals || []).filter(m=>m.slot===slot&&m.status==='planned');
      for(const meal of meals) additions.push({date:target[index],meal:{...structuredClone(meal),id:crypto.randomUUID()}});
    }
  });
  for(const date of target) {
    if((state.days[date]?.meals?.length || 0)+additions.filter(a=>a.date===date).length>60) throw Error('Una delle date supererebbe il numero massimo di ricette.');
  }
  for(const {date,meal} of additions) {
    state.days[date] ??= newDay(date); state.days[date].meals ??= [];
    state.days[date].meals.push(meal);
  }
  return additions.length;
}
