import { NUTRITION_DATA } from './nutrition-data.js';
import { RECIPE_ASSUMPTIONS, PROXY_NOTES } from './nutrition-assumptions.js';
export const NUTRITION_FIELDS=['kcal','proteinG','carbsG','fatG'];
const finite=(v,max=1e7)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
const assert=(v,m)=>{if(!v)throw Error(m);};
export function validateNutritionSettings(settings){
  if(settings===undefined)return;
  assert(Array.isArray(settings)&&settings.length<=200,'Preferenze nutrizionali non valide.');const ids=new Set();
  for(const s of settings){
    assert(s&&typeof s.recipeId==='string'&&/^[a-z0-9-]{1,80}$/.test(s.recipeId)&&!ids.has(s.recipeId)&&typeof s.confirmed==='boolean'&&Array.isArray(s.rows)&&s.rows.length<=100,'Preferenze della ricetta non valide.');ids.add(s.recipeId);const indices=new Set();
    for(const row of s.rows){assert(Number.isInteger(row.index)&&row.index>=0&&row.index<100&&!indices.has(row.index)&&Object.hasOwn(NUTRITION_DATA.profiles,row.profileId)&&finite(row.grams)&&typeof row.included==='boolean','Peso o alimento di riferimento non valido.');indices.add(row.index);
      if(row.nutrients!==undefined){
        assert(row.nutrients&&NUTRITION_FIELDS.every(k=>row.nutrients[k]===null||finite(row.nutrients[k],k==='kcal'?1000:100)),'Valori per 100 g non validi.');
        const n=row.nutrients;assert(n.proteinG===null||n.carbsG===null||n.fatG===null||n.proteinG+n.carbsG+n.fatG<=105,'Controlla i macro: superano 100 g per 100 g di alimento.');
      }
    }
  }
}
function measure(profile,kind){
  const aliases={cup:/^cup(?:$|,| \()/i,tbsp:/^(tablespoon|tbsp)(?:$|,| \()/i,tsp:/^(tsp|teaspoon)(?:$|,| \()/i};
  const row=profile?.portions.find(p=>aliases[kind]?.test(p.modifier));return row?row.grams/row.amount:null;
}
export function nutritionDensity(profile){
  const cup=measure(profile,'cup');if(cup!==null)return cup/240;
  const spoon=measure(profile,'tbsp');if(spoon!==null)return spoon/15;
  const tsp=measure(profile,'tsp');return tsp===null?null:tsp/5;
}
function amountFor(item,profile,count){
  const key=item.ingredientId,q=item.quantityRange?(item.quantityRange.min+item.quantityRange.max)/2:item.quantity;
  const notes=[];let estimated=false;
  if(item.quantityRange){notes.push(`Usato il punto medio ${q} ${item.unit} dell’intervallo originale.`);estimated=true;}
  if(q!==null&&['g','kg','oz'].includes(item.unit))return {grams:q*(item.unit==='kg'?1000:item.unit==='oz'?28.349523125:1),notes,estimated};
  if(q!==null&&['ml','l','cl'].includes(item.unit)){
    const d=profile?.sourceId==='173647'?1:nutritionDensity(profile),volume=q*(item.unit==='l'?1000:item.unit==='cl'?10:1);
    if(d!==null){notes.push(`Volume convertito con densità di riferimento ${d.toFixed(3)} g/ml (misura USDA cup assunta da 240 ml).`);return {grams:volume*d,notes,estimated:true};}
    return {grams:null,notes:['Densità non disponibile: indicare il peso in grammi.'],estimated:true};
  }
  const unit={cucchiai:'tbsp',cucchiaini:'tsp',tbsp:'tbsp',tsp:'tsp',cup:'cup'}[item.unit];
  if(q!==null&&unit&&profile?.sourceId==='173647')return {grams:q*({cup:240,tbsp:15,tsp:5}[unit]),notes:['Misura domestica dell’acqua: cup 240 ml, cucchiaio 15 ml, cucchiaino 5 ml; densità 1 g/ml.'],estimated:true};
  if(q!==null&&unit){let weight=measure(profile,unit);if(weight===null&&unit!=='cup'){const cup=measure(profile,'cup');if(cup!==null)weight=cup/(unit==='tbsp'?16:48);}
    if(weight!==null){notes.push(`Misura domestica USDA di riferimento: ${weight.toFixed(2)} g per ${unit}, non peso misurato del prodotto.`);return {grams:q*weight,notes,estimated:true};}}
  const pieceWeights={'uovo':50,'banana-matura':118,'banane':118,'piadina':100,'tortilla':45,'tortilla-a-calorie-ridotte':45,'mozzarella-proteica':100,'gallette-di-riso':9,'zucchina':196,'cipolla-bianca':110,'cipolla-rossa':110,'pomodorini':17,'pomodoro-grande':182,'aglio-tritato':3,'peperoncino-chipotle-in-scatola':10,'basilico':0.5};
  if(q!==null&&pieceWeights[key]!==undefined){notes.push(`Peso di riferimento assunto: ${pieceWeights[key]} g per pezzo/parte edibile. Verifica confezione o bilancia.`);return {grams:q*pieceWeights[key],notes,estimated:true};}
  const defaults={'grasso-per-ungere-la-padella':2,'grasso-per-ungere-le-pirofile':2,'spray-per-cottura':2,'olio-extravergine-d-oliva':5,'aglio':3,'basilico':2,'cacao-amaro-per-guarnire':2,'prezzemolo':2,'erba-cipollina-fresca':1,'lime':10,'ghiaccio':0,'condimento-taco':2,'sale':0.5,'sale-fino':0.5,'sale-all-aglio':0.5,'sale-per-l-acqua-della-pasta':0.5,'pepe':0.1,'pepe-nero':0.1,'noce-moscata':0.1,'alloro':0.1,'spezie-per-la-farina':0.5};
  const herbs=['sage','oregano','thyme','mint','paprika','chili','curry','cumin','turmeric','garlic-powder','onion-powder'];
  const perServing=defaults[key]??(herbs.includes(NUTRITION_DATA.mapping[key])?0.5:null);
  if(perServing!==null){notes.push(`Dose redazionale: ${perServing} g per porzione, non dichiarata dalla fonte.`);return {grams:perServing*count,notes,estimated:true};}
  return {grams:null,notes:['Quantità non risolta: il nutriente resta sconosciuto.'],estimated:true};
}
export function estimateRecipe(recipe,count=1,{settings=null,multiplier=1,metricOverrides=[]}={}){
  assert(Number.isInteger(count)&&count>0&&count<=1000&&finite(multiplier,20)&&multiplier>0,'Porzioni della stima non valide.');
  if(settings)validateNutritionSettings([settings]);
  const config=RECIPE_ASSUMPTIONS[recipe.id]||{};
  const rows=recipe.ingredients.map((item,index)=>{
    const custom=settings?.rows.find(r=>r.index===index),rule=config.rows?.[index]||{};
    const profileId=custom?.profileId||rule.profileId||NUTRITION_DATA.mapping[item.ingredientId],profile=NUTRITION_DATA.profiles[profileId];
    let amount=amountFor(item,profile,count);const notes=[...amount.notes];
    if(rule.grams!==undefined){amount={grams:rule.grams,estimated:true};notes.push(rule.note||'Dose redazionale della versione di riferimento.');}
    else if(rule.note)notes.push(rule.note);
    if(PROXY_NOTES[item.ingredientId])notes.push(PROXY_NOTES[item.ingredientId]);
    const included=custom?.included??!item.optional;
    if(custom){amount.grams=custom.grams;notes.push('Quantità personale salvata per questa ricetta.');}
    const metric=metricOverrides.find(m=>m.index===index);
    if(metric){
      if(metric.unit==='g')amount.grams=metric.quantity;
      else if(metric.unit==='ml'){const d=profile?.sourceId==='173647'?1:nutritionDensity(profile);amount.grams=d===null?null:metric.quantity*d;}
      notes.push('Quantità fornita manualmente nel menu. Per la panatura verificare la sola quota mangiata.');
    }
    if(item.optional&&!included)notes.push('Facoltativo escluso; includilo se lo utilizzi.');
    const nutrients=custom?.nutrients??profile?.nutrients??Object.fromEntries(NUTRITION_FIELDS.map(k=>[k,null]));
    const grams=amount.grams===null?null:amount.grams/count*multiplier;
    return {index,label:item.label,profileId,profile:profile??null,grams,included,estimated:amount.estimated||!!custom,notes,nutrients:structuredClone(nutrients),source:custom?.nutrients?'Etichetta personale':profile?.source||'Mancante'};
  });
  const active=rows.filter(r=>r.included),nutrients=Object.fromEntries(NUTRITION_FIELDS.map(k=>[k,active.length&&active.every(r=>r.grams!==null&&r.nutrients[k]!==null)?active.reduce((sum,r)=>sum+r.grams*r.nutrients[k]/100,0):null]));
  const complete=NUTRITION_FIELDS.every(k=>nutrients[k]!==null),unmapped=active.filter(r=>!r.profile||r.grams===null);
  return {version:1,provenance:'estimated-ingredients',nutrients,rows,complete,needsReview:!!config.review&&!settings?.confirmed,plannerReady:complete&&nutrients.kcal>0&&(!config.review||!!settings?.confirmed),notes:config.notes||[],unmapped:unmapped.map(r=>r.label)};
}
export function snapshotEstimate(estimate){
  return {version:1,provenance:'estimated-ingredients',nutrients:structuredClone(estimate.nutrients),needsReview:estimate.needsReview,plannerReady:estimate.plannerReady,rows:estimate.rows.map(({profile,...r})=>({...structuredClone(r),reference:profile?{label:profile.label,url:profile.url,sourceId:profile.sourceId}:null}))};
}
export function validateEstimateSnapshot(value){
  assert(value&&value.version===1&&value.provenance==='estimated-ingredients'&&typeof value.needsReview==='boolean'&&typeof value.plannerReady==='boolean'&&value.nutrients&&NUTRITION_FIELDS.every(k=>value.nutrients[k]===null||finite(value.nutrients[k],1e9))&&Array.isArray(value.rows)&&value.rows.length<=100,'Stima nutrizionale del pasto non valida.');
  for(const r of value.rows)assert(r&&typeof r.label==='string'&&r.label.length<=160&&typeof r.included==='boolean'&&(r.grams===null||finite(r.grams))&&r.nutrients&&NUTRITION_FIELDS.every(k=>r.nutrients[k]===null||finite(r.nutrients[k],k==='kcal'?1000:100)),'Dettaglio della stima non valido.');
}
