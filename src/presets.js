// Dati della V21, DB.workouts. Sono contenuti della scheda, non prestazioni
// eseguite o carichi attuali. I kg storici restano riferimenti separati.
const strength = (id, name, sets, reps, legacyKg) => ({
  id, name, mode: 'strength', equipment: 'Attrezzatura non specificata nella V21',
  sets: Array.from({length:sets},()=>({kg:null,reps,minutes:null})),
  legacyReference: { source:'V21', kg:legacyKg, note:'Valore presente nel prototipo, senza data né conferma come carico attuale.' },
});
const cardio = id => ({id,name:'Tapis Roulant',mode:'cardio',equipment:'Tapis roulant',sets:[{kg:null,reps:null,minutes:60}],legacyReference:{source:'V21',kg:null,note:'Durata di 60 minuti presente nel prototipo, modificabile.'}});
export function historicalTemplates() {
  return [
    {id:'template-1',title:'Total Body 1',version:1,exercises:[strength('v21-bench','Panca Piana',3,10,50),strength('v21-row','Rematore',3,10,40),strength('v21-pullup','Trazioni',3,8,0)],sourceNote:'Base V21: PESI A · petto/dorso. La fonte contiene questi tre esercizi; la denominazione Total Body è quella richiesta per il calendario.'},
    {id:'template-2',title:'Total Body 2',version:1,exercises:[strength('v21-squat','Squat',3,10,40),strength('v21-press','Military',3,10,30)],sourceNote:'Base V21: PESI B · gambe/spalle. La fonte contiene questi due esercizi, non una scheda Total Body completa.'},
    {id:'template-3',title:'Total Body 3',version:1,exercises:[strength('v21-deadlift','Stacco',3,8,60),strength('v21-dips','Dips',3,10,0)],sourceNote:'Base V21: PESI C · stacco e dips. Questi sono gli esercizi effettivamente disponibili nella fonte.'},
    {id:'template-4',title:'Cardio 1',version:1,exercises:[cardio('v21-treadmill')],sourceNote:'Base V21: tapis roulant, 1 blocco da 60 minuti. Durata storica modificabile, non un risultato registrato.'},
    {id:'template-5',title:'Cardio 2',version:1,exercises:[cardio('v21-treadmill')],sourceNote:'Base V21: seconda seduta cardio, anch’essa tapis roulant per 60 minuti. La fonte non contiene una variante differente.'},
  ].map(t=>({...t,origin:'v21'}));
}
export function seedUntouchedTemplates(state) {
  const next = structuredClone(state);
  let changed = false;
  const presets = historicalTemplates();
  for (let index=0;index<next.templates.length;index++) {
    const current = next.templates[index];
    const preset = presets.find(p=>p.id===current.id);
    if (preset && current.title===preset.title && current.version===1 && current.exercises.length===0 && !current.origin) {
      next.templates[index]={...current,...preset,version:current.version+1};
      changed=true;
    }
  }
  return {state:next,changed};
}
