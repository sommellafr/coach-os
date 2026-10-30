import {FOOD_SLOTS,NUTRIENTS,nutritionForItems,foodNumber,validateProduct,saveFoodMeal} from './foods.js';
import {lookupBarcode,cleanBarcode} from './food-lookup.js';
import {createScanner} from './barcode-scanner.js';
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const fmt=v=>v===null?'da completare':new Intl.NumberFormat('it-IT',{maximumFractionDigits:1}).format(v);
const labels={kcal:'kcal',proteinG:'Proteine',carbsG:'Carboidrati',fatG:'Grassi'};
function totals(items){const n=nutritionForItems(items);return `<span>${fmt(n.kcal)} kcal</span><span>P ${fmt(n.proteinG)} g</span><span>C ${fmt(n.carbsG)} g</span><span>G ${fmt(n.fatG)} g</span>`;}
const attribution='<p class="hint">Prodotti da <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a> · banca dati ODbL. Verifica l’etichetta: i dati possono essere incompleti. Le immagini della fotocamera restano sul dispositivo; la ricerca invia solo il codice prodotto.</p>';
export function renderFoodDiary(state,date){
  const entries=state.days[date]?.foodEntries||[],items=entries.flatMap(m=>m.items);
  return `<section class="panel food-diary" aria-label="Diario alimentare"><div class="section-line"><div><p class="eyebrow">QUELLO CHE HAI MANGIATO</p><h2>Il tuo diario alimentare</h2><p class="hint">${safe(date)} · distinto dal menu da preparare</p></div><button class="primary" data-food-open="${date}">+ Aggiungi pasto</button></div>${entries.length?`<div class="food-totals">${totals(items)}</div><p class="hint">Totale degli alimenti registrati; non indica che la giornata sia completa.</p>`:'<p>Una ricetta diversa oggi? Aggiungi gli alimenti e indica quanto ne hai mangiato.</p>'}${entries.map(m=>`<article class="food-entry"><div class="section-line"><strong>${safe(m.name)}</strong><span>${FOOD_SLOTS[m.slot]}</span></div><div class="food-totals">${totals(m.items)}</div><p>${m.items.map(i=>`${safe(i.product.name)} · ${fmt(i.amount)} ${i.product.unit}`).join(' · ')}</p><details><summary>Valori e provenienza</summary>${m.items.map(i=>`<p>${safe(i.product.name)}: ${fmt(i.product.nutrients.kcal)} kcal / 100 ${i.product.unit} - ${i.product.source==='openfoodfacts'?`<a href="https://world.openfoodfacts.org/product/${i.product.barcode}" target="_blank" rel="noopener">Open Food Facts</a>`:'valori inseriti dall’utente'}</p>`).join('')}</details><button class="secondary" data-food-edit="${m.id}" data-food-date="${date}">Modifica</button> <button class="text-button danger" data-food-remove="${m.id}" data-food-date="${date}">Rimuovi</button></article>`).join('')}<p class="hint">Il diario non modifica automaticamente le scorte. Obiettivi e Fat Bank arriveranno nelle prossime fasi.</p></section>`;
}
export function setupFoodDiary({state,commit,validDate,today,beforeOpen}){
  const dialog=document.createElement('dialog');dialog.id='food-dialog';dialog.setAttribute('aria-labelledby','food-dialog-title');document.body.append(dialog);
  const scanner=createScanner();let draft=null,selected=null,editingItem=-1,modified=false,request=null,lookupId=0,pendingBarcode=null;
  function message(text){const el=dialog.querySelector('#food-message');if(el)el.textContent=text;}
  function cancelNetwork(){lookupId++;request?.abort();request=null;}
  function stopCamera(){scanner.stop();const el=dialog.querySelector('#food-camera');if(el)el.hidden=true;}
  function close(){if(modified&&!confirm('Abbandonare questo pasto non salvato?'))return;modified=false;dialog.close();}
  function results(query=''){
    const q=query.trim().toLocaleLowerCase('it');const products=(state().foodProducts||[]).filter(p=>`${p.name} ${p.brand}`.toLocaleLowerCase('it').includes(q)).sort((a,b)=>Number(b.favorite)-Number(a.favorite)).slice(0,30);
    dialog.querySelector('#food-results').innerHTML=products.length?products.map(p=>`<button type="button" class="food-product" data-food-product="${p.id}"><strong>${p.favorite?'★ ':''}${safe(p.name)}</strong><span>${safe(p.brand)} · ${fmt(p.nutrients.kcal)} kcal / 100 ${p.unit}</span></button>`).join(''):'<p class="hint">Nessun prodotto salvato. Scansiona la confezione o inserisci l’etichetta.</p>';
  }
  function render(){
    dialog.innerHTML=`<div class="section-line food-dialog-heading"><h2 id="food-dialog-title">Cosa hai mangiato?</h2><button type="button" class="secondary" data-food-action="close" aria-label="Chiudi diario alimentare">✕</button></div><p id="food-message" role="status" aria-live="polite"></p><form id="food-meal-form"><details id="food-meal-meta"><summary>${FOOD_SLOTS[draft.slot]} ${draft.date} - cambia pasto o data</summary><div class="food-grid"><label>Data<input name="date" type="date" min="1900-01-01" max="${today()}" required value="${draft.date}"></label><label>Pasto<select name="slot">${Object.entries(FOOD_SLOTS).map(([k,v])=>`<option value="${k}" ${k===draft.slot?'selected':''}>${v}</option>`).join('')}</select></label></div><label>Nome del pasto<input name="name" maxlength="160" required value="${safe(draft.name)}" placeholder="Es. Piadina al salmone"></label></details><div id="food-basket"></div><div class="food-save"><label class="food-check"><input type="checkbox" name="habitual">Salva anche tra i pasti abituali</label><button class="primary full" id="food-save-meal" type="submit">Salva pasto mangiato</button></div></form><div class="divider"></div><div id="food-picker"><h3>Aggiungi un alimento</h3><div class="inline"><button type="button" class="secondary" data-food-action="scan">Scansiona codice a barre</button><button type="button" class="secondary" data-food-action="manual">Inserisci etichetta</button></div><section id="food-camera" hidden><video id="food-video" muted playsinline autoplay></video><p class="hint">Inquadra le barre e i numeri sulla confezione.</p><button type="button" class="secondary" data-food-action="stop-camera">Ferma fotocamera</button></section><details id="food-code-details"><summary>Digita il codice a barre</summary><form id="food-barcode-form"><label>Codice a barre<div class="inline"><input name="barcode" inputmode="numeric" pattern="[0-9 -]{8,20}" maxlength="20" placeholder="Oppure digita il codice" required><button type="submit" class="secondary">Cerca codice</button></div></label></form></details><label>Cerca nei tuoi alimenti<input id="food-search" type="search" placeholder="Nome o marca"></label><div id="food-results"></div>${attribution}</div><section id="food-product-editor" hidden></section><details id="food-habits"><summary>I tuoi pasti abituali</summary>${(state().habitualMeals||[]).map(m=>`<div class="inline"><button type="button" class="secondary" data-food-habit="${m.id}">${safe(m.name)}</button><button type="button" class="text-button" data-food-delete-habit="${m.id}" aria-label="Elimina pasto abituale ${safe(m.name)}">Rimuovi preferito</button></div>`).join('')||'<p class="hint">Salva un pasto abituale per riaggiungerlo senza ricomporlo.</p>'}</details>`;
    results();basket();
  }
  function basket(){dialog.querySelector('#food-basket').innerHTML=draft.items.length?`<ul class="food-basket">${draft.items.map((i,index)=>`<li><span><strong>${safe(i.product.name)}</strong> · ${fmt(i.amount)} ${i.product.unit}</span><div><button type="button" class="text-button" data-food-item="${index}">Modifica</button><button type="button" class="text-button" data-food-drop="${index}" aria-label="Rimuovi ${safe(i.product.name)}">✕</button></div></li>`).join('')}</ul><div class="food-totals" aria-live="polite">${totals(draft.items)}</div>`:'<p class="hint">Aggiungi uno o più alimenti qui sotto, poi salva il pasto.</p>';dialog.querySelector('#food-save-meal').disabled=!draft.items.length;dialog.querySelector('.food-save').hidden=!draft.items.length;}
  function editProduct(product,index=-1,amount=product.usualAmount||100){
    stopCamera();selected=structuredClone(product);editingItem=index;const el=dialog.querySelector('#food-product-editor');
    dialog.querySelector('#food-picker').hidden=true;el.hidden=false;
    el.innerHTML=`<form id="food-product-form"><h3>${safe(product.name)||'Nuovo alimento'}${product.brand?` <small>${safe(product.brand)}</small>`:''}</h3><div class="food-grid"><label>Quantità mangiata<input name="amount" inputmode="decimal" type="number" min="0.001" max="10000" step="any" value="${amount}" required></label><label>Unità dei valori e della quantità<select name="unit"><option value="g" ${product.unit==='g'?'selected':''}>g · valori per 100 g</option><option value="ml" ${product.unit==='ml'?'selected':''}>ml · valori per 100 ml</option></select></label></div><details ${!product.name||NUTRIENTS.some(k=>product.nutrients[k]===null)?'open':''}><summary>Valori e dettagli del prodotto</summary><label>Nome alimento<input name="name" maxlength="160" required value="${safe(product.name)}"></label><label>Marca (facoltativa)<input name="brand" maxlength="160" value="${safe(product.brand)}"></label><p class="hint">${product.source==='openfoodfacts'?'Dati Open Food Facts: verifica prodotto, unità e valori con la confezione.':'Inserisci i valori dell’etichetta per 100 g o 100 ml.'} Un campo vuoto significa valore sconosciuto, non zero.</p><div class="food-grid">${NUTRIENTS.map(k=>`<label>${labels[k]} per 100 g/ml<input name="${k}" type="number" inputmode="decimal" min="0" max="${k==='kcal'?1000:100}" step="any" value="${product.nutrients[k]??''}"></label>`).join('')}</div><label class="food-check"><input name="favorite" type="checkbox" ${product.favorite?'checked':''}>Preferito</label></details><p id="food-product-preview" class="food-totals" aria-live="polite"></p><div class="inline"><button type="submit" class="primary">${index>=0?'Aggiorna alimento':'Aggiungi al pasto'}</button><button type="button" class="secondary" data-food-action="back">Annulla alimento</button></div></form>`;
    const input=el.querySelector('[name=amount]');input.focus();input.select();el.scrollIntoView({block:'nearest'});preview();
  }
  function readProduct(form){return {...selected,name:form.elements.name.value.trim(),brand:form.elements.brand.value.trim(),unit:form.elements.unit.value,favorite:form.elements.favorite.checked,nutrients:Object.fromEntries(NUTRIENTS.map(k=>[k,foodNumber(form.elements[k].value,k==='kcal'?1000:100)]))};}
  function preview(){try{const f=dialog.querySelector('#food-product-form');dialog.querySelector('#food-product-preview').innerHTML=totals([{product:readProduct(f),amount:foodNumber(f.elements.amount.value,10000)||0}]);}catch{}}
  async function lookup(code){
    cancelNetwork();stopCamera();pendingBarcode=cleanBarcode(code);const ticket=lookupId,controller=new AbortController();request=controller;const timer=setTimeout(()=>controller.abort(),12000);message('Ricerca prodotto…');
    try{const p=await lookupBarcode(code,{products:state().foodProducts,signal:controller.signal});if(ticket!==lookupId||!dialog.open)return;message('Prodotto trovato: controlla i valori e indica la quantità.');editProduct(p);}
    catch(e){if(ticket===lookupId&&dialog.open){message(e.name==='AbortError'?'Ricerca scaduta. Riprova o inserisci l’etichetta.':e.message);dialog.querySelector('#food-picker').hidden=false;}}
    finally{clearTimeout(timer);}
  }
  function open(date,meal){
    if(!beforeOpen())return;cancelNetwork();stopCamera();
    const now=new Date().getHours();draft=meal?structuredClone(meal):{id:crypto.randomUUID(),date:date>today()?today():date,slot:now<11?'breakfast':now<17?'lunch':'dinner',status:'consumed',name:'Pasto libero',items:[]};modified=false;selected=null;pendingBarcode=null;render();dialog.showModal();dialog.scrollTop=0;if(date>today())message('Il diario registra pasti mangiati: data impostata a oggi.');dialog.querySelector('#food-search').focus({preventScroll:true});
  }
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||dialog.contains(b))return;
    if(b.dataset.foodOpen)open(b.dataset.foodOpen);
    if(b.dataset.foodEdit){const m=state().days[b.dataset.foodDate]?.foodEntries?.find(m=>m.id===b.dataset.foodEdit);if(m)open(b.dataset.foodDate,m);}
    if(b.dataset.foodRemove&&confirm('Rimuovere questa registrazione alimentare? Prima viene creata una copia di sicurezza.'))commit(s=>{s.days[b.dataset.foodDate].foodEntries=s.days[b.dataset.foodDate].foodEntries.filter(m=>m.id!==b.dataset.foodRemove);},'Registrazione rimossa.',{backup:true});
  });
  dialog.addEventListener('input',e=>{e.stopPropagation();if(e.target.id==='food-search'){results(e.target.value);return;}modified=true;if(e.target.closest('#food-product-form'))preview();});
  dialog.addEventListener('change',e=>{e.stopPropagation();modified=true;if(e.target.closest('#food-product-form'))preview();});
  dialog.addEventListener('submit',event=>{
    event.preventDefault();event.stopPropagation();const f=event.target;
    try{
      if(f.id==='food-barcode-form'){lookup(cleanBarcode(f.elements.barcode.value));return;}
      if(f.id==='food-product-form'){
        let p=validateProduct(readProduct(f));if(JSON.stringify(p.nutrients)!==JSON.stringify(selected.nutrients))p={...p,source:'manual'};const amount=foodNumber(f.elements.amount.value,10000);if(!amount||amount<=0)throw Error('Indica quanto ne hai mangiato.');
        const item={product:p,amount};if(editingItem>=0)draft.items[editingItem]=item;else draft.items.push(item);
        modified=true;dialog.querySelector('#food-product-editor').hidden=true;dialog.querySelector('#food-picker').hidden=false;selected=null;basket();message('Alimento aggiunto. Puoi aggiungerne un altro o salvare il pasto.');dialog.querySelector('#food-search').focus({preventScroll:true});return;
      }
      if(f.id==='food-meal-form'){
        if(!validDate(f.elements.date.value)||f.elements.date.value>today())throw Error('Scegli oggi o una data passata per ciò che hai mangiato.');
        if(selected)throw Error('Aggiungi l’alimento in compilazione al pasto oppure torna agli alimenti.');
        const meal={...draft,date:f.elements.date.value,slot:f.elements.slot.value,name:f.elements.name.value.trim()};
        // Editing changes the date only within the same atomic operation.
        const ok=commit(s=>{if(meal.date!==draft.date&&s.days[draft.date]?.foodEntries)s.days[draft.date].foodEntries=s.days[draft.date].foodEntries.filter(m=>m.id!==draft.id);saveFoodMeal(s,meal,{habitual:f.elements.habitual.checked});},'Pasto mangiato salvato.');
        if(ok){modified=false;dialog.close();}else message('Salvataggio non riuscito. Il pasto resta qui: riprova dopo aver risolto il problema indicato.');
      }
    }catch(e){message(e.message);}
  });
  dialog.addEventListener('click',async event=>{
    const b=event.target.closest('button');if(!b)return;
    try{
      const action=b.dataset.foodAction;
      if(action==='close')close();
      if(action==='back'){selected=null;dialog.querySelector('#food-product-editor').hidden=true;dialog.querySelector('#food-picker').hidden=false;}
      if(action==='manual'){cancelNetwork();editProduct({id:crypto.randomUUID(),name:'',brand:'',barcode:pendingBarcode,source:'manual',unit:'g',favorite:false,nutrients:Object.fromEntries(NUTRIENTS.map(k=>[k,null]))});dialog.querySelector('#food-product-form [name=name]').focus();}
      if(action==='scan'){cancelNetwork();dialog.querySelector('#food-camera').hidden=false;message('Consenti la fotocamera per leggere il codice a barre.');await scanner.start(dialog.querySelector('#food-video'),code=>lookup(code));}
      if(action==='stop-camera')stopCamera();
      if(b.dataset.foodProduct){cancelNetwork();editProduct(state().foodProducts.find(p=>p.id===b.dataset.foodProduct));}
      if(b.dataset.foodItem!==undefined){const i=Number(b.dataset.foodItem);editProduct(draft.items[i].product,i,draft.items[i].amount);}
      if(b.dataset.foodDrop!==undefined){draft.items.splice(Number(b.dataset.foodDrop),1);modified=true;basket();}
      if(b.dataset.foodHabit){const m=state().habitualMeals.find(m=>m.id===b.dataset.foodHabit);if(!draft.items.length&&dialog.querySelector('#food-meal-form [name=name]').value==='Pasto libero'){draft.name=m.name;dialog.querySelector('#food-meal-form [name=name]').value=m.name;}draft.items.push(...structuredClone(m.items));modified=true;basket();message('Pasto abituale aggiunto. Controlla le quantità e salva.');}
      if(b.dataset.foodDeleteHabit&&confirm('Rimuovere questo pasto dai preferiti? I pasti mangiati restano nello storico.')){const ok=commit(s=>{s.habitualMeals=s.habitualMeals.filter(m=>m.id!==b.dataset.foodDeleteHabit);},'Pasto abituale rimosso.');if(ok)b.parentElement.remove();}
    }catch(e){stopCamera();message(e.message);}
  });
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('close',()=>{cancelNetwork();stopCamera();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();});
  window.addEventListener('pagehide',()=>{cancelNetwork();stopCamera();});
  window.addEventListener('beforeunload',e=>{if(dialog.open&&modified){e.preventDefault();e.returnValue='';}});
}
