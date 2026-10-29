// Solo conversioni dimensionali esatte. Cup, cucchiai e pezzi richiedono
// il peso/volume confermato dell'ingrediente: nessuna densità viene inventata.
const units = {
  g:['g',1], gr:['g',1], grammi:['g',1], kg:['g',1000], mg:['g',.001],
  oz:['g',28.349523125], lb:['g',453.59237], lbs:['g',453.59237],
  ml:['ml',1], cl:['ml',10], dl:['ml',100], l:['ml',1000], litri:['ml',1000],
};
const normalize = value => String(value??'').trim().toLowerCase();
export const isMetricConvertible = item => Object.hasOwn(units,normalize(item.unit));
const number = value => new Intl.NumberFormat('it-IT',{maximumFractionDigits:2}).format(value);
export function sourceAmount(item) {
  const amount=item.quantityRange ? `${number(item.quantityRange.min)}–${number(item.quantityRange.max)}` : item.quantity===null ? 'q.b. / quantità non indicata' : number(item.quantity);
  return `${amount}${item.unit ? ` ${item.unit}` : ''}`;
}
export function metricIngredient(item, override=null) {
  const result=structuredClone(item);
  if(override) {
    result.quantity=override.quantity;result.unit=override.unit;delete result.quantityRange;
    result.measurementOrigin='user';
    return result;
  }
  const conversion=Object.hasOwn(units,normalize(item.unit))?units[normalize(item.unit)]:null;
  if(conversion) {
    const [unit,factor]=conversion;
    result.unit=unit;
    if(result.quantity!==null) result.quantity*=factor;
    if(result.quantityRange) {result.quantityRange.min*=factor;result.quantityRange.max*=factor;}
    result.measurementOrigin=factor===1?'source':'exact-conversion';
  } else {
    result.originalAmount=sourceAmount(item);
    result.quantity=null;result.unit=null;delete result.quantityRange;
    result.metricPending=true;
  }
  return result;
}
export function validateMetricOverrides(overrides, ingredientCount) {
  if(!Array.isArray(overrides)||overrides.length>ingredientCount) throw Error('Misure degli ingredienti non valide.');
  const indices=new Set();
  for(const entry of overrides) {
    if(!entry||!Number.isInteger(entry.index)||entry.index<0||entry.index>=ingredientCount||indices.has(entry.index)||!['g','ml'].includes(entry.unit)||typeof entry.quantity!=='number'||!Number.isFinite(entry.quantity)||entry.quantity<=0||entry.quantity>1000000) throw Error('Indica un peso o volume positivo in g o ml, senza ingredienti duplicati.');
    indices.add(entry.index);
  }
  return overrides;
}
