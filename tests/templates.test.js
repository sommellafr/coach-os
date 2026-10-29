import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, createTemplate, validateState, assign, startSession } from '../src/domain.js';
import { historicalTemplates, seedUntouchedTemplates } from '../src/presets.js';
import { Repository, STORAGE_KEY, BACKUP_PREFIX } from '../src/storage.js';

class MemoryStorage {
  data = new Map(); fail = '';
  get length() {return this.data.size;}
  key(i) {return [...this.data.keys()][i]??null;}
  getItem(k) {return this.data.get(k)??null;}
  setItem(k,v) {if(this.fail==='all' || this.fail==='backup'&&k.startsWith(BACKUP_PREFIX)) throw Error('Quota'); this.data.set(k,v);}
}
const blankOldState = () => ({schemaVersion:1,revision:7,updatedAt:null,templates:historicalTemplates().map(t=>({id:t.id,title:t.title,version:1,exercises:[]})),days:{}});
test('cinque schede preimpostate contengono solo i dati noti della V21, senza inventare risultati',()=>{
  const s=freshState(); validateState(s);
  assert.deepEqual(s.templates.map(t=>t.exercises.map(e=>e.name)),[['Panca Piana','Rematore','Trazioni'],['Squat','Military'],['Stacco','Dips'],['Tapis Roulant'],['Tapis Roulant']]);
  assert.equal(s.templates[0].exercises[0].sets.length,3);
  assert.equal(s.templates[0].exercises[0].sets[0].reps,10);
  assert.equal(s.templates[0].exercises[2].sets[0].reps,8);
  assert.equal(s.templates[3].exercises[0].sets[0].minutes,60);
  assert.equal(s.templates[0].exercises[0].sets[0].kg,null);
  assert.equal(s.templates[0].exercises[0].legacyReference.kg,50);
  assert.deepEqual(s.days,{});
});
test('aggiunta e duplicazione con nome libero e ID stabile, limiti e nomi duplicati',()=>{
  const s=freshState(); const id=createTemplate(s,'Petto e tricipiti','template-1');
  const template=s.templates.find(t=>t.id===id); assert.equal(template.exercises.length,3);
  template.exercises[0].sets[0].kg=39;
  assert.equal(s.templates[0].exercises[0].sets[0].kg,null);
  assert.throws(()=>createTemplate(s,' petto E TRICIPITI '),/già/);
  assert.throws(()=>createTemplate(s,''));
  assert.throws(()=>createTemplate(s,'A','id-mancante'));
  const emptyId=createTemplate(s,'Gambe'); assert.equal(s.templates.find(t=>t.id===emptyId).exercises.length,0);
  const libraryId=createTemplate(s,'Richiamo schiena','v21:template-1'); assert.equal(s.templates.find(t=>t.id===libraryId).exercises.length,3);
  validateState(s);
});
test('nuove schede selezionabili per data; rinomina e modifiche non cambiano piani o sedute',()=>{
  const s=freshState(); const id=createTemplate(s,'Petto','template-1'); assign(s,'2026-10-19',id); startSession(s,'2026-10-19');
  s.templates.find(t=>t.id===id).title='Petto nuovo'; s.templates.find(t=>t.id===id).exercises[0].sets[0].reps=15;
  assert.equal(s.days['2026-10-19'].assignment.template.title,'Petto');
  assert.equal(s.days['2026-10-19'].sessions[0].title,'Petto');
  assert.equal(s.days['2026-10-19'].sessions[0].exercises[0].sets[0].reps,10);
});
test('aggiornamento esclusivamente dei contenitori originali mai modificati, idempotente',()=>{
  const old=blankOldState(); old.templates[1].version=2; old.templates[2].title='La mia scheda';
  const result=seedUntouchedTemplates(old);
  assert.equal(result.changed,true); assert.equal(result.state.templates[0].exercises.length,3);
  assert.equal(result.state.templates[1].exercises.length,0); assert.equal(result.state.templates[2].title,'La mia scheda');
  assert.equal(old.templates[0].exercises.length,0);
  assert.equal(seedUntouchedTemplates(result.state).changed,false);
});
test('vecchio archivio: backup esatto prima di popolare schede e storico lasciato intatto',()=>{
  const store=new MemoryStorage(); const old=blankOldState();
  old.days['2026-10-19']={date:'2026-10-19',assignment:null,sessions:[],notes:'Nota personale'};
  const raw=JSON.stringify(old); store.setItem(STORAGE_KEY,raw); store.setItem('coach_v21','legacy intatto');
  const repo=new Repository(store);
  assert.equal(repo.state.templates[0].exercises.length,3); assert.equal(repo.backups()[0].raw,raw);
  assert.deepEqual(repo.state.days,old.days); assert.equal(store.getItem('coach_v21'),'legacy intatto');
  const reopened=new Repository(store); assert.equal(reopened.backups().length,1);
});
test('se il backup automatico fallisce, contenitori e byte precedenti rimangono intatti',()=>{
  const store=new MemoryStorage(); const raw=JSON.stringify(blankOldState()); store.setItem(STORAGE_KEY,raw); store.fail='backup';
  const repo=new Repository(store);
  assert.equal(repo.state.templates[0].exercises.length,0); assert.equal(store.getItem(STORAGE_KEY),raw);
  assert.ok(repo.error.includes('non riuscito'));
});
test('ripristino di backup con contenitori vecchi: popolamento protetto dalla copia precedente',()=>{
  const store=new MemoryStorage(); const repo=new Repository(store); repo.commit(freshState());
  const before=repo.raw; const key=repo.restore(JSON.stringify(blankOldState()));
  assert.equal(store.getItem(key),before); assert.equal(repo.state.templates[0].exercises.length,3);
});
