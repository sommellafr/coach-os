// Quantità reali e movimenti espliciti; le prenotazioni sono sempre derivate.
export const normalizeIngredient=value=>String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('it').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
export function normalizePreparation(value) {
  const text=normalizeIngredient(value);
  for(const [key,aliases] of Object.entries({cotto:['cotto','cotta','cotti','cotte'],crudo:['crudo','cruda','crudi','crude'],secco:['secco','secca','secchi','secche'],sgocciolato:['sgocciolato','sgocciolata','sgocciolati','sgocciolate'],scolato:['scolato','scolata','scolati','scolate']})) if(aliases.includes(text)) return key;
  return text||'non specificato';
}
export const ingredientKey=(label,unit,preparationState='non specificato')=>JSON.stringify([normalizeIngredient(label),unit,normalizePreparation(preparationState)]);
const validQuantity=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1e9;
const validText=(value,max=160)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
export function validatePantry(state) {
  if(state.pantry!==undefined) {
    if(!Array.isArray(state.pantry)||state.pantry.length>2000) throw Error('Dispensa non valida.');
    const keys=new Set(),ids=new Set();
    for(const entry of state.pantry) {
      const key=ingredientKey(entry?.label,entry?.unit,entry?.preparationState);
      if(!entry||!validText(entry.id,80)||!/^[a-zA-Z0-9_-]+$/.test(entry.id)||ids.has(entry.id)||!validText(entry.label)||!['g','ml'].includes(entry.unit)||!validText(entry.preparationState,80)||!validQuantity(entry.quantity)||!(entry.packSize===null||(validQuantity(entry.packSize)&&entry.packSize>0))||keys.has(key)) throw Error('Voce della dispensa non valida o duplicata.');
      keys.add(key);ids.add(entry.id);
    }
  }
  if(state.pantryMovements!==undefined) {
    if(!Array.isArray(state.pantryMovements)||state.pantryMovements.length>5000) throw Error('Movimenti della dispensa non validi.');
    const ids=new Set(),activeMeals=new Set();
    for(const move of state.pantryMovements) {
      if(!move||!validText(move.id,80)||!/^[a-zA-Z0-9_-]+$/.test(move.id)||ids.has(move.id)||!['cook','purchase'].includes(move.kind)||!validText(move.at,40)||!Number.isFinite(Date.parse(move.at))||typeof move.reversed!=='boolean'||!Array.isArray(move.items)||!move.items.length||move.items.length>100) throw Error('Movimento della dispensa non valido.');
      ids.add(move.id);
      if(move.kind==='cook') {
        if(!validText(move.mealId,80)||!validText(move.title)) throw Error('Origine dello scarico non valida.');
        if(!move.reversed&&activeMeals.has(move.mealId)) throw Error('Pasto scaricato due volte dalla dispensa.');
        if(!move.reversed) activeMeals.add(move.mealId);
      }
      if(move.untracked!==undefined&&(!Array.isArray(move.untracked)||move.untracked.length>100||move.untracked.some(label=>!validText(label)))) throw Error('Ingredienti non scaricati non validi.');
      const keys=new Set();
      for(const item of move.items) {
        const key=ingredientKey(item?.label,item?.unit,item?.preparationState);
        if(!item||!validText(item.label)||!['g','ml'].includes(item.unit)||!validText(item.preparationState,80)||!validQuantity(item.quantity)||item.quantity<=0||keys.has(key)) throw Error('Quantità del movimento non valida.');
        keys.add(key);
      }
    }
  }
}
export function pantryEntry(state,row) {
  const key=ingredientKey(row.label,row.unit,row.preparationState);
  return state.pantry?.find(entry=>ingredientKey(entry.label,entry.unit,entry.preparationState)===key)||null;
}
export function setPantryStock(state,{label,unit,preparationState='non specificato',quantity,packSize=null}) {
  const entry={id:pantryEntry(state,{label,unit,preparationState})?.id||crypto.randomUUID(),label:label.trim(),unit,preparationState:normalizePreparation(preparationState),quantity,packSize};
  const next={pantry:[entry]};validatePantry(next);
  state.pantry??=[];
  const index=state.pantry.findIndex(old=>old.id===entry.id);
  if(index===-1&&state.pantry.length>=2000) throw Error('Limite di voci in dispensa raggiunto.');
  if(index===-1) state.pantry.push(entry);else state.pantry[index]=entry;
  return entry.id;
}
export function cookedMovement(state,mealId) {return state.pantryMovements?.find(move=>move.kind==='cook'&&!move.reversed&&move.mealId===mealId)||null;}
function movement(state,kind,items,extra={}) {
  const move={id:crypto.randomUUID(),at:new Date().toISOString(),kind,items:structuredClone(items),reversed:false,...extra};
  validatePantry({pantryMovements:[move]});
  if((state.pantryMovements?.length||0)>=5000) throw Error('Limite movimenti raggiunto: esporta il backup.');
  return move;
}
export function purchasePack(state,row,packSize,count=1) {
  if(!['g','ml'].includes(row.unit)||!validQuantity(packSize)||packSize<=0||!Number.isInteger(count)||count<1||count>10000) throw Error('Indica formato e numero di confezioni validi.');
  const current=pantryEntry(state,row),quantity=packSize*count;
  const move=movement(state,'purchase',[{label:row.label,unit:row.unit,preparationState:row.preparationState,quantity}]);
  setPantryStock(state,{...row,quantity:(current?.quantity||0)+quantity,packSize});
  state.pantryMovements??=[];state.pantryMovements.push(move);
  return move.id;
}
export function consumePantry(state,meal,items) {
  if(cookedMovement(state,meal.id)) throw Error('Questo pasto è già stato scaricato dalla dispensa.');
  const known=items.filter(item=>!item.needsReview&&item.min!==null&&item.min===item.max);
  const untracked=items.filter(item=>!known.includes(item)).map(item=>item.label);
  const deductions=known.map(row=>({label:row.label,unit:row.unit,preparationState:row.preparationState,quantity:row.max})).filter(row=>row.quantity>0);
  if(!deductions.length) throw Error('Conferma almeno un peso esatto prima di scaricare la dispensa.');
  const move=movement(state,'cook',deductions,{mealId:meal.id,title:meal.snapshot.title,untracked});
  for(const item of deductions) if((pantryEntry(state,item)?.quantity||0)+1e-8<item.quantity) throw Error(`Scorta insufficiente: ${item.label}. Registra prima l’acquisto o correggi la quantità presente.`);
  for(const item of deductions) {const stock=pantryEntry(state,item);stock.quantity=Math.max(0,stock.quantity-item.quantity);}
  state.pantryMovements??=[];state.pantryMovements.push(move);
  return move.id;
}
export function undoPantryMovement(state,id) {
  const move=state.pantryMovements?.find(entry=>entry.id===id);
  if(!move||move.reversed) throw Error('Movimento già annullato o non disponibile.');
  // Annullare un acquisto non deve portare la scorta sotto zero.
  for(const item of move.items) if(move.kind==='purchase'&&(pantryEntry(state,item)?.quantity||0)+1e-8<item.quantity) throw Error('Acquisto già utilizzato: annulla prima gli scarichi o correggi le scorte.');
  const changes=move.items.map(item=>{const stock=pantryEntry(state,item);return {...item,id:stock?.id||crypto.randomUUID(),quantity:Math.max(0,(stock?.quantity||0)+(move.kind==='cook'?item.quantity:-item.quantity)),packSize:stock?.packSize??null};});
  validatePantry({pantry:changes});
  const extra=changes.filter(item=>!pantryEntry(state,item)).length;
  if((state.pantry?.length||0)+extra>2000) throw Error('Limite di voci in dispensa raggiunto.');
  for(const item of changes) setPantryStock(state,item);
  move.reversed=true;
}
