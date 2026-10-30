// Formati di riferimento verificati, non minimi universali né prezzi.
export const PACKAGE_REFERENCES = Object.freeze([
  {labels:['Farina'],unit:'g',size:1000,label:'1 kg',url:'https://spesaonline.conad.it/p/conad-farina-di-grano-tenero-tipo-00-1-kg--130591'},
  {labels:['Pasta'],unit:'g',size:500,label:'500 g',url:'https://www.barilla.com/it-it/prodotti/pasta/i-classici/spaghetti-n-5'},
  {labels:['Latte o bevanda vegetale'],unit:'ml',size:1000,label:'1 litro',url:'https://shop.parmalat.it/'},
  {labels:['Farina di ceci'],unit:'g',size:500,label:'500 g',url:'https://www.conad.it/assets/common/volantini/cad/vbassi/bassi%20fissi%20fino%20al%2031%20agosto.pdf'},
  {labels:['Riso basmati'],unit:'g',size:500,label:'500 g',url:'https://www.conad.it/assets/common/volantini/cad/v20262/20262606PSUPERSUD-C.pdf'},
  {labels:['Riso bianco','Riso da risotto','Riso Vialone Nano o Carnaroli'],unit:'g',size:1000,label:'1 kg',url:'https://www.conad.it/assets/common/volantini/cad/vbassi/bassi%20fissi%20fino%20al%2031%20agosto.pdf'},
  {labels:['Cous cous'],unit:'g',size:500,label:'500 g',url:'https://www.conad.it/assets/common/volantini/cad/vbassi/bassi%20fissi%20fino%20al%2031%20agosto.pdf'},
  {labels:['Mozzarella light'],unit:'g',size:125,label:'125 g',url:'https://www.lidl.it/p/latteria-mozzarella-light/p11145531'},
  {labels:['Yogurt greco bianco magro'],unit:'g',size:500,label:'500 g',url:'https://www.conad.it/assets/common/volantini/cno/v20262/20262604PCONADTOSCANA.pdf'},
  {labels:['Burro di arachidi 100%'],unit:'g',size:350,label:'350 g',url:'https://www.conad.it/assets/common/volantini/cad/v20262/20262606PSUPERSUD-C.pdf'},
  {labels:['Olio extravergine d’oliva'],unit:'ml',size:1000,label:'1 litro',url:'https://www.conad.it/assets/common/volantini/cad/v20262/20262606PSUPERSUD-C.pdf'},
  {labels:['Cacao amaro','Cacao amaro per guarnire'],unit:'g',size:75,label:'75 g',url:'https://www.conad.it/assets/common/volantini/pac/v2025-/2025-22-Conad-Calabria.pdf'},
]);
export function suggestedPackage(label,unit) {
  return PACKAGE_REFERENCES.find(entry=>entry.unit===unit&&entry.labels.some(name=>name.toLocaleLowerCase('it')===label.toLocaleLowerCase('it')))||null;
}
export function packLabel(quantity,unit) {
  const number=value=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:3}).format(value);
  return unit==='g'&&quantity>=1000?`${number(quantity/1000)} kg`:unit==='ml'&&quantity>=1000?`${number(quantity/1000)} l`:`${number(quantity)} ${unit}`;
}
