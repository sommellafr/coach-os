import test from 'node:test';
import assert from 'node:assert/strict';
import {suggestedPlanningDate,localDate} from '../src/domain.js';
import {freshState,weekDates} from '../src/domain.js';
import {renderWeeklyPlanner} from '../src/planner-ui.js';

test('giorno proposto locale: oggi fino alle 20:59:59, domani dalle 21:00',()=>{
  assert.equal(suggestedPlanningDate(new Date(2026,9,30,20,59,59)),'2026-10-30');
  assert.equal(suggestedPlanningDate(new Date(2026,9,30,21,0,0)),'2026-10-31');
  assert.equal(suggestedPlanningDate(new Date(2026,9,31,0,0,0)),'2026-10-31');
  assert.equal(localDate(new Date(2026,9,30,23,59)),'2026-10-30');
});
test('proposta dopo le 21 attraversa domenica, mese, anno, bisestile e cambio ora senza UTC',()=>{
  for(const [year,month,day,expected] of [[2026,10,1,'2026-11-02'],[2026,9,31,'2026-11-01'],[2026,11,31,'2027-01-01'],[2028,1,28,'2028-02-29'],[2026,9,24,'2026-10-25'],[2026,2,28,'2026-03-29']]) {
    assert.equal(suggestedPlanningDate(new Date(year,month,day,21)),expected);
  }
});
test('proposta al limite del calendario resta valida; orologio non valido rifiutato',()=>{
  assert.equal(suggestedPlanningDate(new Date(2199,11,31,23)),'2199-12-31');
  assert.throws(()=>suggestedPlanningDate(new Date(NaN)));
  assert.throws(()=>suggestedPlanningDate(new Date(2200,0,1,10)));
});
test('selettore settimanale mantiene sette date complete e mostra i giorni vuoti senza inventare pasti',()=>{
  const state=freshState(),dates=weekDates('2026-10-30');const before=structuredClone(state);
  const html=renderWeeklyPlanner({state,date:'2026-10-30',catalog:{recipes:[]}});
  const navigation=html.match(/class="planner-days"[\s\S]*?<\/div>/)[0];
  for(const date of dates) assert.ok(navigation.includes(`data-date="${date}"`));
  assert.equal((navigation.match(/<small>0 ricette<\/small>/g)||[]).length,7);
  assert.equal((navigation.match(/aria-pressed="true"/g)||[]).length,1);
  assert.ok(navigation.includes('2026'));
  assert.deepEqual(state,before);
});
