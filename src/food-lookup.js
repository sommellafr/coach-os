// Richieste esplicite, nessun invio di diario, foto o quantità. Cache in memoria + prodotti salvati.
const cache=new Map();let requests=[];
export function cleanBarcode(value) {
  const code=String(value).replace(/[\s-]/g,'');
  if(!/^\d{8,14}$/.test(code))throw Error('Inserisci un codice numerico da 8 a 14 cifre.');return code;
}
const numeric=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
export function productFromOFF(product,code) {
  if(!product)throw Error('Prodotto non trovato. Puoi inserire i valori della confezione.');
  const n=product.nutriments||{};
  // Campi 100g normalizzati da OFF, anche per i prodotti la cui base è 100 ml.
  const nutrients={kcal:numeric(n['energy-kcal_100g']),proteinG:numeric(n.proteins_100g),carbsG:numeric(n.carbohydrates_100g),fatG:numeric(n.fat_100g)};
  if(nutrients.kcal===null&&numeric(n['energy-kj_100g'])!==null)nutrients.kcal=Number(n['energy-kj_100g'])/4.184;
  if(nutrients.kcal===null&&n.energy_unit==='kJ'&&numeric(n.energy_100g)!==null)nutrients.kcal=Number(n.energy_100g)/4.184;
  const base=product.nutrition_data_per;
  const liquid=base==='100ml'||(base==='serving'&&product.serving_quantity_unit==='ml')||(!base&&product.product_quantity_unit==='ml');
  return {id:`off-${code}`,name:String(product.product_name_it||product.product_name||'Prodotto da completare').slice(0,160),brand:String(product.brands||'').slice(0,160),barcode:code,unit:liquid?'ml':'g',source:'openfoodfacts',favorite:false,nutrients};
}
export async function lookupBarcode(value,{fetcher=fetch,signal,products=[]}={}) {
  const code=cleanBarcode(value),local=products.find(p=>p.barcode===code);
  if(local)return structuredClone(local);
  if(cache.has(code))return structuredClone(cache.get(code));
  requests=requests.filter(t=>Date.now()-t<60000);
  if(requests.length>=12)throw Error('Molte ricerche ravvicinate: attendi un minuto o inserisci l’etichetta.');
  requests.push(Date.now());
  const url=new URL(`https://world.openfoodfacts.org/api/v3/product/${code}`);
  url.searchParams.set('fields','code,product_name,product_name_it,brands,nutriments,nutrition_data_per,product_quantity_unit,serving_quantity_unit');
  url.searchParams.set('lc','it');url.searchParams.set('app_name','CoachOS');url.searchParams.set('app_version','0.8.0');
  url.searchParams.set('User-Agent','CoachOS/0.8.0 (https://github.com/sommellafr/coach-os)');
  let response;
  try{response=await fetcher(url,{signal,credentials:'omit',referrerPolicy:'no-referrer'});}catch(e){if(e.name==='AbortError')throw e;throw Error('Ricerca non disponibile: controlla la connessione o inserisci l’etichetta.');}
  if(response.status===404)throw Error('Prodotto non trovato. Inserisci i valori della confezione.');
  if(response.status===429)throw Error('Limite di ricerche raggiunto. Attendi un minuto o inserisci l’etichetta.');
  if(!response.ok)throw Error('Open Food Facts non disponibile. Puoi inserire l’etichetta.');
  const data=await response.json();if(!data.product||data.status===0)throw Error('Prodotto non trovato. Inserisci i valori della confezione.');
  const product=productFromOFF(data.product,code);cache.set(code,product);return structuredClone(product);
}
