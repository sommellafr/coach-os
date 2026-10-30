// Strato di presentazione: le fonti originali e gli snapshot non si riscrivono.
import { scaleRecipe } from './recipes.js';
const editorial = Object.freeze({
  'pollo-miele-aglio':4,'banana-snack':2,'polpette-tacchino':2,'brownies':8,'nuggets-pollo':2,
  'piadina-salmone':1,'piadina-caprese':1,'piadina-veggie':1,'piadina-tonno':1,'piadina-pollo':1,
  'pancake-banana':1,'crepes-cacao':1,'cloud-bread':1,'rotolo-patate':1,'wrap-tonno-fagioli':1,
  'pasta-salmone':1,'couscous-ceci':1,'pasta-fredda-mare':1,
});
export function servingBasis(recipe) {
  if(Object.hasOwn(editorial,recipe.id)) return {count:editorial[recipe.id],provenance:'editorial'};
  if(Number.isInteger(recipe.yield?.quantity)&&recipe.yield.quantity>0) return {count:recipe.yield.quantity,provenance:'source'};
  return {count:1,provenance:'editorial',unreviewed:true};
}
const rewritten = {
  'burrito-manzo':{3:'Farcisci la tortilla con le dosi di riso, carne, cheddar e salsa nacho indicate per una porzione.'},
  'burrito-chipotle':{3:'Farcisci la tortilla con la dose di pollo e salsa, aggiungi mozzarella ed erba cipollina, ripiega i bordi e arrotola.'},
  'pollo-miele-aglio':{0:'Taglia la dose di petto di pollo in strisce sottili. Condisci anche la farina con le spezie indicate.'},
  'banana-snack':{0:'Taglia la dose di banana in pezzi della dimensione desiderata.'},
  'bicchierini-avena':{0:'Frulla le dosi di avena, yogurt e latte per una porzione e versa in un bicchiere.',3:'Completa con le guarnizioni nelle dosi indicate per la porzione.'},
  'tortine-formaggio':{1:'Versa il composto della porzione in una pirofila leggermente unta e adatta al tuo apparecchio.'},
  'brownies':{0:'Mescola le dosi della porzione fino a ottenere una pastella liscia. Usa un recipiente adatto alla quantità e al tuo apparecchio; lo stampo descritto dalla fonte riguarda il lotto originale.'},
  'wrap-tonno-fagioli':{2:'Farcisci le tortilla previste dalle dosi della porzione. Servi la verdura come accompagnamento oppure aggiungila al ripieno.'},
  'bowl-patate-manzo':{3:'Riunisci in una ciotola le dosi di patate, carne, ranch, salsa nacho e verdure della porzione.'},
  'piadine-ceci':{1:'Stendi l’impasto della porzione con un mattarello.'},
  'piadine-zucchine':{1:'Forma un disco su carta forno. La fonte indica 180 °C per 15 minuti: controlla la cottura in base allo spessore.'},
  'riso-pollo-broccoli':{4:'Riunisci le dosi di riso, broccoli e pollo della porzione in un contenitore.'},
  'polpette-tacchino':{1:'Forma piccole polpette con l’impasto della porzione; cerca dimensioni simili per una cottura uniforme.'},
  'pasta-lenticchie':{0:'Per le lenticchie secche la fonte indica 12 ore di ammollo. Come alternativa per questa porzione indica 200 g di lenticchie già cotte, da sostituire alle secche e non da sommare.'},
};
export function singleServingRecipe(original) {
  const basis=servingBasis(original),scaled=scaleRecipe(original,1/basis.count);
  const result=scaled.recipe;
  result.yield={quantity:1,unit:'porzione'};result.servings=1;
  result.portionBasis=basis;
  result.guideSteps=result.guideSteps.map((step,index)=>{
    const replacement=rewritten[original.id]?.[index];
    const text=replacement||step.text.replace(/e dividi in (?:due|tre|quattro|cinque|\d+) porzioni\.?/gi,'e servi la porzione.').replace(/dividi in (?:due|tre|quattro|cinque|\d+) porzioni\.?/gi,'Servi la porzione.');
    return {...step,text,provenance:replacement||text!==step.text?'editorial':step.provenance};
  });
  if(result.nutrition) {
    const totals=scaled.nutritionTotal;
    for(const field of ['kcal','proteinG','carbsG','fatG']) result.nutrition[field]=totals?.[field]??null;
    result.nutrition.basis='serving';
    result.nutrition.provenance='derived-source';
    result.nutrition.note='Riproporzionamento aritmetico della fonte per una porzione; nessuna stima dagli ingredienti. Se la base originale è ignota, i valori rimangono mancanti.';
  }
  return result;
}
