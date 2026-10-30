import { localDate,isDate,dateObject,weekDates } from './domain.js';
import { MEAL_SLOTS,createMeal } from './meals.js';
import { cookedMovement } from './pantry.js';
import { nutritionForItems } from './foods.js';
import { estimateForRecipe } from './nutrition-ui.js';
import { snapshotEstimate,NUTRITION_FIELDS,nutritionDensity } from './recipe-nutrition.js';
import { NUTRITION_DATA } from './nutrition-data.js';
import { servingBasis } from './single-serving.js';
import { recipeMatchesMeal } from './recipe-tags.js';
import { validateMonthPreferences } from './month-validation.js';
const slots=Object.keys(MEAL_SLOTS),assert=(v,m)=>{if(!v)throw Error(m);};
const groups={meat:['beef95','beef93','ham','chicken','chicken-cooked','turkey','turkey-sliced','broth'],fish:['salmon','tuna'],dairy:['cheddar-free','mozzarella-free','mozzarella','cream-cheese','cottage','feta','blue-cheese','parmesan','yogurt','yogurt-vanilla','milk','philadelphia-protein','light-cheese','mozzarella-light','protein-cream','cheese-sauce','pesto','ranch'],eggs:['egg','egg-white'],nuts:['peanut-butter','almond-butter','hazelnuts','peanuts','cashews','pesto','protein-cream'],gluten:['flour','pasta','couscous','tortilla','piadina','bread','oats','soy','taco','enchilada'],legumes:['chickpeas','beans','lentils','chickpea-flour']};
const vegetables=['broccoli','potato','potato-cooked','radicchio','tomato','zucchini','onion','carrot','celery','lettuce','arugula','green-beans','pumpkin','scallion'];
const fruits=['apple','pear','orange','banana'];
function mainGroup(rows){const g=candidateGroups(rows);return g.includes('fish')?'fish':rows.some(r=>r.included&&r.grams>0&&['chicken','chicken-cooked','turkey','turkey-sliced'].includes(r.profileId))?'poultry':rows.some(r=>r.included&&r.grams>0&&['beef95','beef93','ham'].includes(r.profileId))?'meat':g.includes('legumes')?'legumes':g.includes('eggs')?'eggs':'dairy-other';}
const hash=v=>[...String(v)].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,17);
export function monthDates(month){
  assert(/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(month),'Mese non valido.');const [y,m]=month.split('-').map(Number),count=new Date(y,m,0,12).getDate();
  return Array.from({length:count},(_,i)=>`${month}-${String(i+1).padStart(2,'0')}`);
}
export function candidateGroups(rows){return Object.keys(groups).filter(g=>rows.some(r=>r.included&&r.grams>0&&groups[g].includes(r.profileId)));}
function addSide(estimate,profileId,grams,label){
  const profile=NUTRITION_DATA.profiles[profileId];estimate.rows.push({index:estimate.rows.length,label,profileId,profile,grams,included:true,estimated:true,notes:['Aggiunta redazionale del menu, distinta dalla ricetta originale. Peso della parte edibile.'],nutrients:structuredClone(profile.nutrients),source:profile.source});
  for(const k of NUTRITION_FIELDS)estimate.nutrients[k]+=profile.nutrients[k]*grams/100;
}
export function buildCandidates(catalog,state,prefs,date,seed=0){
  validateMonthPreferences(prefs);const excluded=[],result=[];
  for(const recipe of catalog.recipes){
    if(prefs.excludedRecipes.includes(recipe.id)){excluded.push({id:recipe.id,title:recipe.title,reason:'Esclusa da te'});continue;}
    const estimate=estimateForRecipe(recipe,state);
    if(!estimate.plannerReady){excluded.push({id:recipe.id,title:recipe.title,reason:estimate.needsReview?'Scelte nutrizionali da controllare nel ricettario':'Stima incompleta'});continue;}
    const groupList=candidateGroups(estimate.rows);
    if(prefs.excludedGroups.some(g=>groupList.includes(g))){excluded.push({id:recipe.id,title:recipe.title,reason:'Esclusioni alimentari'});continue;}
    const breakfast=recipeMatchesMeal(recipe,'breakfast'),added=[];
    if(prefs.sides){
      if(breakfast&&estimate.rows.filter(r=>r.included&&fruits.includes(r.profileId)).reduce((n,r)=>n+r.grams,0)<100){
        const choices=['apple','pear','orange'],key=choices[hash(`${date}-${recipe.id}-${seed}`)%choices.length];addSide(estimate,key,150,NUTRITION_DATA.profiles[key].label);added.push(`${NUTRITION_DATA.profiles[key].label} 150 g`);
      }
      if(!breakfast&&estimate.rows.filter(r=>r.included&&vegetables.includes(r.profileId)&&!['potato','potato-cooked'].includes(r.profileId)).reduce((n,r)=>n+r.grams,0)<100){
        const choices=['tomato','carrot','lettuce'],key=choices[hash(`${date}-${recipe.id}-${seed}`)%choices.length];addSide(estimate,key,100,`${NUTRITION_DATA.profiles[key].label} · contorno`);added.push(`${NUTRITION_DATA.profiles[key].label} 100 g`);
      }
    }
    const main=mainGroup(estimate.rows);
    result.push({id:recipe.id,title:recipe.title,nutrients:estimate.nutrients,estimate,groups:groupList,main,added,slots:slots.filter(s=>recipeMatchesMeal(recipe,s))});
  }
  return {candidates:result,excluded};
}
function sumNutrition(items){return Object.fromEntries(NUTRITION_FIELDS.map(k=>[k,items.length&&items.every(n=>n?.[k]!==null&&n?.[k]!==undefined)?items.reduce((sum,n)=>sum+n[k],0):null]));}
function existingCell(state,date,slot){
  const meals=(state.days[date]?.meals||[]).filter(m=>m.slot===slot),consumed=(state.days[date]?.foodEntries||[]).filter(m=>m.slot===slot);
  if(!meals.length&&!consumed.length)return null;
  // Il consuntivo ha priorità nel confronto giornaliero, senza sommare anche il piano.
  const n=consumed.length?nutritionForItems(consumed.flatMap(m=>m.items)):sumNutrition(meals.map(m=>m.nutritionEstimate?.nutrients));
  return {kind:'existing',locked:true,title:(consumed.length?consumed.map(m=>m.name):meals.map(m=>m.snapshot.title)).join(' + '),nutrients:n,mealIds:meals.map(m=>m.id),recipeIds:meals.map(m=>m.snapshot.id),mains:meals.filter(m=>m.nutritionEstimate).map(m=>mainGroup(m.nutritionEstimate.rows)),added:consumed.length?[]:meals.flatMap(m=>(m.nutritionEstimate?.rows||[]).filter(r=>r.index>=m.snapshot.ingredients.length&&r.included).map(r=>`${r.label} ${Math.round(r.grams)} g`)),consumed:consumed.length>0,candidate:null};
}
function existingExtras(state,date){const meals=(state.days[date]?.foodEntries||[]).filter(m=>m.slot==='extra');return meals.length?nutritionForItems(meals.flatMap(m=>m.items)):null;}
export function dayReport(day,prefs){
  const entries=slots.map(s=>day.cells[s]).filter(Boolean),n=sumNutrition([...entries.map(c=>c.nutrients),...(day.extraNutrition?[day.extraNutrition]:[])]),proteinTarget=prefs.weight*prefs.proteinPerKg;
  return {nutrients:n,complete:entries.length===3&&NUTRITION_FIELDS.every(k=>n[k]!==null),kcalMatch:n.kcal!==null&&Math.abs(n.kcal-prefs.kcal)<=prefs.kcal*.05+1e-6,proteinMatch:n.proteinG!==null&&n.proteinG+1e-6>=proteinTarget,delta:n.kcal===null?null:n.kcal-prefs.kcal,proteinTarget};
}
function chooseDay(pool,prefs,fixed,history,date,seed,avoid={},extraNutrition=null){
  const options=slots.map(slot=>fixed[slot]?[fixed[slot]]:pool.filter(c=>c.slots.includes(slot)&&c.id!==avoid[slot]).map(candidate=>({kind:'generated',locked:false,title:candidate.title,nutrients:candidate.nutrients,candidate})));
  assert(options.every(a=>a.length),'Non ci sono ricette sufficienti per i tre pasti con queste esclusioni.');
  const recent=history.slice(-6),usage={},mainUsage={};
  for(const d of recent)for(const s of slots){const cell=d.cells[s],c=cell?.candidate;for(const id of c?[c.id]:cell?.recipeIds||[])usage[id]=(usage[id]||0)+1;if(s!=='breakfast')for(const group of c?[c.main]:cell?.mains||[])mainUsage[group]=(mainUsage[group]||0)+1;}
  let best=null,bestScore=Infinity;const unknown=Object.values(fixed).some(c=>c.nutrients.kcal===null||c.nutrients.proteinG===null)||(extraNutrition&&(extraNutrition.kcal===null||extraNutrition.proteinG===null)),newSlots=slots.filter(s=>!fixed[s]).length;
  for(const b of options[0])for(const l of options[1])for(const d of options[2]){
    if(l.candidate&&d.candidate&&l.candidate.id===d.candidate.id)continue;
    const cells={breakfast:b,lunch:l,dinner:d},report=dayReport({cells,extraNutrition},prefs);
    const evaluated=unknown?slots.filter(s=>!fixed[s]).map(s=>cells[s].nutrients):[report.nutrients],total=unknown?sumNutrition(evaluated):report.nutrients;
    const target=unknown?prefs.kcal*newSlots/3:prefs.kcal,proteinTarget=unknown?prefs.weight*prefs.proteinPerKg*newSlots/3:prefs.weight*prefs.proteinPerKg;
    const energyError=total.kcal===null?1:Math.abs(total.kcal-target)/Math.max(target,1),proteinError=total.proteinG===null?1:Math.max(0,proteinTarget-total.proteinG)/Math.max(proteinTarget,1);
    const feasible=energyError<=.05&&proteinError<=1e-8;
    let score=(feasible?0:10000)+energyError*200+proteinError*600;
    for(const s of slots)if(!fixed[s]&&cells[s].candidate){const c=cells[s].candidate;score+=(usage[c.id]||0)*9;if(s!=='breakfast')score+=(mainUsage[c.main]||0)*2;
      if(recent.at(-1)&&slots.some(prev=>recent.at(-1).cells[prev]?.candidate?.id===c.id))score+=12;
    }
    if(l.candidate&&d.candidate&&l.candidate.main===d.candidate.main)score+=9;
    score+=(hash(`${seed}|${date}|${b.candidate?.id}|${l.candidate?.id}|${d.candidate?.id}`)%100)/100;
    if(score<bestScore){bestScore=score;best=cells;}
  }
  assert(best,'Non è possibile ottenere tre pasti distinti: riduci le esclusioni.');return best;
}
export function generateMonth(catalog,state,prefs,{today=localDate(),startDate=today,seed=0,previous=null}={}){
  validateMonthPreferences(prefs);assert(isDate(today)&&isDate(startDate)&&startDate>=today&&prefs.month>=today.slice(0,7),'Scegli il mese corrente o uno futuro.');
  const days=[],excluded=buildCandidates(catalog,state,prefs,`${prefs.month}-01`,seed).excluded;
  for(const date of monthDates(prefs.month)){
    const past=date<startDate,free=!prefs.weekdays.includes(dateObject(date).getDay()),cells={};
    for(const slot of slots){const existing=existingCell(state,date,slot),old=previous?.days.find(d=>d.date===date)?.cells[slot];if(existing)cells[slot]=existing;else if(old?.kind==='generated'&&old.locked)cells[slot]=structuredClone(old);}
    const extraNutrition=existingExtras(state,date);
    if(!past&&!free){const {candidates}=buildCandidates(catalog,state,prefs,date,seed);const selected=chooseDay(candidates,prefs,cells,days.filter(d=>!d.free&&!d.past),date,seed,{},extraNutrition);Object.assign(cells,selected);}
    days.push({date,past,free,cells,extraNutrition});
  }
  return {prefs:structuredClone(prefs),days,excluded,baseRevision:state.revision,seed};
}
export function replaceMonthMeal(draft,catalog,state,date,slot){
  const day=draft.days.find(d=>d.date===date);assert(day&&!day.free&&!day.past&&day.cells[slot]?.kind==='generated','Questo pasto è già salvato: modificalo dal calendario.');
  const fixed=Object.fromEntries(slots.filter(s=>s!==slot).map(s=>[s,day.cells[s]]));const {candidates}=buildCandidates(catalog,state,draft.prefs,date,draft.seed);
  const selected=chooseDay(candidates,draft.prefs,fixed,draft.days.filter(d=>d.date<date&&!d.free&&!d.past),date,draft.seed+1,{[slot]:day.cells[slot].candidate.id},day.extraNutrition);
  day.cells[slot]={...selected[slot],locked:true};return day;
}
export function monthSummary(draft){
  const active=draft.days.filter(d=>!d.free&&!d.past),reports=active.map(d=>dayReport(d,draft.prefs));
  return {days:active.length,newMeals:active.reduce((n,d)=>n+slots.filter(s=>d.cells[s]?.kind==='generated').length,0),savedMeals:draft.days.reduce((n,d)=>n+slots.reduce((sum,s)=>sum+(d.cells[s]?.mealIds?.length||0),0),0),matched:reports.filter(r=>r.complete&&r.kcalMatch&&r.proteinMatch).length,unknown:reports.filter(r=>!r.complete).length,groups:[...new Set(draft.days.flatMap(d=>['lunch','dinner'].flatMap(s=>d.cells[s]?.candidate?[d.cells[s].candidate.main]:d.cells[s]?.mains||[])))],distinct:new Set(draft.days.flatMap(d=>slots.flatMap(s=>d.cells[s]?.candidate?[d.cells[s].candidate.id]:d.cells[s]?.recipeIds||[]))).size};
}
export function savedMonth(state,prefs){validateMonthPreferences(prefs);return {prefs:structuredClone(prefs),days:monthDates(prefs.month).map(date=>({date,past:false,free:!prefs.weekdays.includes(dateObject(date).getDay()),extraNutrition:existingExtras(state,date),cells:Object.fromEntries(slots.map(s=>[s,existingCell(state,date,s)]).filter(([,cell])=>cell))})),excluded:[],baseRevision:state.revision,seed:0,readOnly:true};}
export function referenceIngredients(recipe,estimate){
  return estimate.rows.filter(r=>r.included&&r.grams>0).map(r=>{
    const original=recipe.ingredients[r.index],special=recipe.id==='pollo-miele-aglio'&&[5,6].includes(r.index),ratio=special?(r.index===5?2:100/52):1;
    const profile=NUTRITION_DATA.profiles[r.profileId];
    let preparationState=['rice','pasta','lentils','couscous'].includes(r.profileId)?'secco':['rice-cooked','potato-cooked','chicken-cooked','chickpeas'].includes(r.profileId)?'cotto':r.profileId==='beans'||r.profileId==='tuna'?'sgocciolato':['chicken','beef95','beef93','turkey',...fruits,...vegetables].includes(r.profileId)?'crudo':original?.preparationState||'non specificato';
    const rename=!original||original.ingredientId==='mollica-di-pane-bagnata-in-acqua'||original.ingredientId==='tortilla-a-calorie-ridotte'||original.ingredientId==='mozzarella-proteica'||r.profileId!==NUTRITION_DATA.mapping[original?.ingredientId];
    const density=profile.sourceId==='173647'?1:nutritionDensity(profile),liquid=original&&['ml','l','cl'].includes(original.unit)&&density!==null;
    return {label:rename?profile.label:r.label,quantity:r.grams*ratio/(liquid?density:1),unit:liquid?'ml':'g',preparationState,optional:false,note:`Dose di riferimento del menu. ${profile.label}. ${special?'Quantità predisposta per panare; i nutrienti considerano solo la quota aderente.':''}`};
  });
}
export function applyMonth(state,draft,catalog){
  assert(!draft.readOnly,'Questa è la vista dei pasti salvati, non una nuova proposta.');
  assert(state.revision===draft.baseRevision,'I dati sono cambiati: rigenera l’anteprima prima di salvare.');validateMonthPreferences(draft.prefs);
  const additions=[];const planId=crypto.randomUUID();
  for(const day of draft.days.filter(d=>!d.past&&!d.free))for(const slot of slots){
    const cell=day.cells[slot];if(cell?.kind!=='generated')continue;
    assert(!existingCell(state,day.date,slot),'Un pasto è già presente: rigenera l’anteprima.');
    assert((state.days[day.date]?.meals?.length||0)+additions.filter(a=>a.date===day.date).length<60,'Troppi pasti in una giornata.');
    const recipe=catalog.recipes.find(r=>r.id===cell.candidate.id);assert(recipe,'Ricetta non disponibile.');
    const m=createMeal(recipe,slot,servingBasis(recipe).count,{nutritionEstimate:snapshotEstimate(cell.candidate.estimate)});
    m.referenceIngredients=referenceIngredients(recipe,cell.candidate.estimate);m.menuPlan={version:1,id:planId,month:draft.prefs.month,kcalTarget:draft.prefs.kcal,proteinTarget:draft.prefs.weight*draft.prefs.proteinPerKg};
    additions.push({date:day.date,meal:m});
  }
  assert(additions.length,'Non ci sono nuovi pasti da salvare: quelli già presenti sono stati conservati.');
  for(const a of additions){state.days[a.date]??={date:a.date,assignment:null,sessions:[],notes:''};state.days[a.date].meals??=[];state.days[a.date].meals.push(a.meal);}
  state.monthlyMenuPreferences=structuredClone(draft.prefs);state.monthlyMenus??={};state.monthlyMenus[draft.prefs.month]=structuredClone(draft.prefs);return additions.length;
}
export function removalPreview(state,scope,date,includeConsumed=false){
  assert(['week','month','all'].includes(scope)&&isDate(date),'Intervallo non valido.');const dates=Object.keys(state.days).filter(d=>scope==='all'||(scope==='month'?d.slice(0,7)===date.slice(0,7):weekDates(date).includes(d)));
  const planned=dates.flatMap(d=>state.days[d].meals||[]),consumed=includeConsumed?dates.flatMap(d=>state.days[d].foodEntries||[]):[];
  return {dates,planned:planned.length,consumed:consumed.length,cooked:planned.filter(m=>cookedMovement(state,m.id)).length,total:planned.length+consumed.length};
}
export function removeMeals(state,scope,date,includeConsumed=false){
  const preview=removalPreview(state,scope,date,includeConsumed);for(const d of preview.dates){if(state.days[d].meals)state.days[d].meals=[];if(includeConsumed&&state.days[d].foodEntries)state.days[d].foodEntries=[];}return preview.total;
}
