import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,parseBackup,validateState,dayStatus} from '../src/domain.js';
import {Repository,STORAGE_KEY} from '../src/storage.js';
import {nutritionForItems,saveFoodMeal,validateProduct,foodNumber} from '../src/foods.js';
import {productFromOFF,lookupBarcode,cleanBarcode} from '../src/food-lookup.js';
const product=(name,nutrients={kcal:200,proteinG:20,carbsG:0,fatG:12})=>({id:crypto.randomUUID(),name,brand:'',barcode:null,unit:'g',source:'manual',favorite:false,nutrients});
const meal=()=>({id:crypto.randomUUID(),date:'2026-10-30',slot:'lunch',status:'consumed',name:'Piadina libera',items:[{product:product('Salmone'),amount:100},{product:product('Robiola',{kcal:300,proteinG:10,carbsG:4,fatG:27}),amount:50},{product:product('Piadina',{kcal:330,proteinG:8,carbsG:55,fatG:9}),amount:100},{product:product('Olio',{kcal:900,proteinG:0,carbsG:0,fatG:100}),amount:5}]});
test('pasto composto somma quantità effettive e mantiene zero distinto da sconosciuto',()=>{
  const m=meal();assert.deepEqual(nutritionForItems(m.items),{kcal:725,proteinG:33,carbsG:57,fatG:39.5});
  m.items[0].product.nutrients.proteinG=null;assert.equal(nutritionForItems(m.items).proteinG,null);assert.equal(nutritionForItems(m.items).kcal,725);
  assert.equal(foodNumber('1,5'),1.5);assert.equal(foodNumber(''),null);assert.throws(()=>foodNumber('-1'));
});
test('salvataggio e correzione stabili, prodotti recenti, abituali e snapshot indipendenti',()=>{
  const s=freshState(),m=meal();saveFoodMeal(s,m,{habitual:true});assert.equal(s.days[m.date].foodEntries.length,1);assert.equal(s.foodProducts.length,4);assert.equal(s.foodProducts[0].usualAmount,100);
  assert.equal(dayStatus(s.days[m.date]),'Alimenti registrati');
  s.foodProducts[0].nutrients.kcal=999;assert.equal(s.days[m.date].foodEntries[0].items[0].product.nutrients.kcal,200);
  m.items[0].amount=50;saveFoodMeal(s,m);assert.equal(s.days[m.date].foodEntries.length,1);assert.equal(s.habitualMeals[0].items[0].amount,100);assert.equal(s.days[m.date].foodEntries[0].items[0].amount,50);assert.equal(s.days[m.date].meals,undefined);assert.equal(s.pantry,undefined);
});
test('vecchi backup compatibili e nuovi roundtrip; importi malformati e duplicati rifiutati',()=>{
  const s=freshState();assert.deepEqual(parseBackup(JSON.stringify(s)),s);saveFoodMeal(s,meal());assert.deepEqual(parseBackup(JSON.stringify(s)),s);
  const bad=structuredClone(s);bad.days['2026-10-30'].foodEntries.push(structuredClone(bad.days['2026-10-30'].foodEntries[0]));assert.throws(()=>validateState(bad));
  const p=product('x');p.nutrients.fatG=101;assert.throws(()=>validateProduct(p));p.nutrients={kcal:null,proteinG:null,carbsG:null,fatG:null};assert.throws(()=>validateProduct(p));
});
test('quota e conflitti non salvano falsi pasti, ripristino crea backup esatto',()=>{
  const values=new Map();let fail=false;const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('Quota');values.set(k,v);}};
  const r=new Repository(storage);r.update(s=>saveFoodMeal(s,meal()));const before=r.raw;fail=true;assert.throws(()=>r.update(s=>saveFoodMeal(s,meal())));assert.equal(r.raw,before);assert.equal(values.get(STORAGE_KEY),before);
  fail=false;const raw=r.export();r.restore(raw);assert.ok([...values.entries()].some(([k,v])=>k.startsWith('coach_os_backup_')&&v===before));
  values.set(STORAGE_KEY,'changed');assert.throws(()=>r.update(s=>saveFoodMeal(s,meal())),/altra scheda/);
});
test('Open Food Facts usa valori per 100, converte kJ espliciti e conserva campi mancanti',()=>{
  const p=productFromOFF({product_name:'Latte',nutrition_data_per:'100ml',nutriments:{'energy-kj_100g':418.4,proteins_100g:3,fat_100g:0}},'12345678');assert.equal(p.unit,'ml');assert.ok(Math.abs(p.nutrients.kcal-100)<1e-9);assert.equal(p.nutrients.carbsG,null);assert.equal(p.nutrients.fatG,0);
  const partial=productFromOFF({product_name:'x',nutriments:{energy_100g:1234}},'12345678');assert.equal(partial.nutrients.kcal,null);assert.throws(()=>cleanBarcode('https://bad.example/'));assert.equal(cleanBarcode('1234 5678'),'12345678');
});
test('lookup locale offline, richiesta filtrata senza dati personali, cache e errori recuperabili',async()=>{
  const p=product('Locale');p.barcode='12345678';assert.equal((await lookupBarcode(p.barcode,{products:[p],fetcher:()=>{throw Error('rete');}})).name,'Locale');
  let calls=0;const fetcher=async(url,options)=>{calls++;assert.match(url.pathname,/api\/v3\/product/);assert.equal(options.credentials,'omit');assert.ok(!url.search.includes('amount'));return {ok:true,json:async()=>({product:{product_name:'Test',nutriments:{'energy-kcal_100g':120,proteins_100g:3,carbohydrates_100g:15,fat_100g:5}}})};};
  await lookupBarcode('1234567890123',{fetcher});await lookupBarcode('1234567890123',{fetcher});assert.equal(calls,1);
  await assert.rejects(lookupBarcode('87654321',{fetcher:async()=>({status:404})}),/non trovato/);
  await assert.rejects(lookupBarcode('87654322',{fetcher:async()=>({status:429})}),/Limite/);
  await assert.rejects(lookupBarcode('87654323',{fetcher:async()=>{throw Error('offline');}}),/connessione/);
});
