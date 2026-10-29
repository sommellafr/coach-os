import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, localDate, isDate, addDays, weekDates, newExercise, assign, applyStandardWeek, moveAssignment, startSession, validateState, parseBackup, numberOrNull, dayStatus } from '../src/domain.js';
import { Repository, STORAGE_KEY, BACKUP_PREFIX } from '../src/storage.js';

class MemoryStorage {
  values = new Map();
  fail = null;
  get length() { return this.values.size; }
  key(i) { return [...this.values.keys()][i] ?? null; }
  getItem(key) { if (this.fail === 'read') throw Error('Accesso negato'); return this.values.get(key) ?? null; }
  setItem(key, value) {
    if (this.fail === 'all' || (this.fail === 'current' && key === STORAGE_KEY) || (this.fail === 'backup' && key.startsWith(BACKUP_PREFIX))) throw Error('Quota esaurita');
    this.values.set(key, value);
  }
}
function fixture() {
  const state = freshState();
  const exercise = newExercise('Panca', 'strength', 'bilanciere totale');
  exercise.sets[0] = { kg: 40, reps: 10, minutes: null };
  state.templates[0].exercises = [exercise];
  return state;
}
function sessionOn(state, date, kg) {
  assign(state, date, 'template-1');
  const id = startSession(state, date);
  const session = state.days[date].sessions.find(s => s.id === id);
  session.exercises[0].results[0] = { kg, reps: 10, minutes: null };
  session.status = 'completed';
  return session;
}
test('date civili, bisestili, cambi mese/anno e limiti calendario', () => {
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2025-02-28', 1), '2025-03-01');
  assert.equal(addDays('2025-12-31', 1), '2026-01-01');
  assert.equal(addDays('2026-03-29', 1), '2026-03-30');
  for (const value of ['2026-02-29', '2026-02-31', '2026-13-01', '2026-1-01', '__proto__', '2200-01-01', null]) assert.equal(isDate(value), false);
  assert.equal(weekDates('2026-01-01')[0], '2025-12-29');
  assert.equal(weekDates('2199-12-31').at(-1), '2199-12-31');
  assert.equal(weekDates('1900-01-01')[0], '1900-01-01');
  assert.throws(() => addDays('1900-01-01', -1));
});
test('la giornata locale non segue UTC a mezzanotte, in più fusi e durante DST', () => {
  const originalTimezone = process.env.TZ;
  try {
  for (const [tz, expected] of [['Europe/Berlin', '2026-10-29'], ['America/Los_Angeles', '2026-10-28'], ['Pacific/Kiritimati', '2026-10-29']]) {
    process.env.TZ = tz;
    assert.equal(localDate(new Date('2026-10-28T23:30:00Z')), expected);
    assert.equal(addDays('2026-03-29', 1), '2026-03-30');
  }
  } finally { if (originalTimezone === undefined) delete process.env.TZ; else process.env.TZ = originalTimezone; }
});
test('due lunedì distinti, riapertura e correzione senza duplicati', () => {
  const store = new MemoryStorage(); const repo = new Repository(store);
  repo.commit(fixture());
  repo.update(s => { sessionOn(s, '2026-10-19', 39); sessionOn(s, '2026-10-26', 42); });
  const reopened = new Repository(store);
  assert.equal(reopened.state.days['2026-10-19'].sessions[0].exercises[0].results[0].kg, 39);
  assert.equal(reopened.state.days['2026-10-26'].sessions[0].exercises[0].results[0].kg, 42);
  const id = reopened.state.days['2026-10-19'].sessions[0].id;
  reopened.update(s => { s.days['2026-10-19'].sessions[0].exercises[0].results[0].kg = 40; });
  assert.equal(reopened.state.days['2026-10-19'].sessions.length, 1);
  assert.equal(reopened.state.days['2026-10-19'].sessions[0].id, id);
  assert.equal(reopened.state.days['2026-10-26'].sessions[0].exercises[0].results[0].kg, 42);
});
test('spostare un piano conserva sedute, note, destinazione e target storici', () => {
  const state = fixture(); const original = structuredClone(sessionOn(state, '2026-10-19', 39));
  moveAssignment(state, '2026-10-19', '2026-10-20');
  assert.deepEqual(state.days['2026-10-19'].sessions[0], original);
  assert.equal(state.days['2026-10-19'].assignment, null);
  assert.equal(state.days['2026-10-20'].assignment.template.id, 'template-1');
  assign(state, '2026-10-21', 'rest');
  assert.throws(() => moveAssignment(state, '2026-10-20', '2026-10-21'), /già un piano/);
  state.templates[0].exercises[0].sets[0].kg = 80;
  state.templates[0].version++;
  assert.equal(state.days['2026-10-20'].assignment.template.exercises[0].sets[0].kg, 40);
  assert.equal(state.days['2026-10-19'].sessions[0].exercises[0].sets[0].kg, 40);
});
test('settimana standard esplicita e idempotente non sovrascrive piani o risultati', () => {
  const state = fixture(); sessionOn(state, '2026-10-19', 39); assign(state, '2026-10-20', 'rest');
  const first = structuredClone(state.days['2026-10-19']);
  applyStandardWeek(state, '2026-10-21');
  assert.deepEqual(state.days['2026-10-19'], first);
  assert.equal(state.days['2026-10-20'].assignment.kind, 'rest');
  assert.equal(state.days['2026-10-21'].assignment.template.id, 'template-2');
  const snapshot = structuredClone(state); applyStandardWeek(state, '2026-10-21'); assert.deepEqual(state, snapshot);
});
test('dati mancanti, zero, bozza, riposo e saltato sono stati diversi', () => {
  const state = fixture(); assign(state, '2026-10-19', 'template-1'); startSession(state, '2026-10-19');
  const day = state.days['2026-10-19'];
  assert.equal(dayStatus(undefined), 'Non registrato');
  assert.equal(dayStatus(day), 'Bozza');
  assert.equal(day.sessions[0].exercises[0].results[0].kg, null);
  assert.equal(numberOrNull('', 'kg'), null);
  assert.equal(numberOrNull('0', 'kg'), 0);
  assert.equal(numberOrNull('2,5', 'kg'), 2.5);
  day.sessions[0].status = 'completed'; assert.throws(() => validateState(state), /almeno un risultato/);
  day.sessions[0].durationMinutes = 20; validateState(state);
  assert.equal(dayStatus(day), 'Completato');
  assign(state, '2026-10-20', 'rest'); assert.equal(dayStatus(state.days['2026-10-20']), 'Riposo pianificato');
  state.days['2026-10-20'].assignment.status = 'skipped'; assert.equal(dayStatus(state.days['2026-10-20']), 'Saltato');
});
test('più sedute indipendenti; nessuna registrazione futura né doppia bozza', () => {
  const state = fixture(); assign(state, '2026-10-19', 'template-1'); startSession(state, '2026-10-19');
  assert.throws(() => startSession(state, '2026-10-19'), /bozza/);
  state.days['2026-10-19'].sessions[0].status = 'completed'; state.days['2026-10-19'].sessions[0].durationMinutes = 20;
  startSession(state, '2026-10-19'); assert.equal(state.days['2026-10-19'].sessions.length, 2);
  assign(state, '2199-01-01', 'free'); assert.throws(() => startSession(state, '2199-01-01'), /futuro/);
});
test('cardio con minuti separati; input invalidi e incoerenze respinti', () => {
  const state = freshState(); const e = newExercise('Cyclette', 'cardio'); e.sets[0].minutes = 20;
  state.templates[3].exercises.push(e); validateState(state);
  e.sets[0].reps = 20; assert.throws(() => validateState(state), /Unità incompatibili/);
  for (const input of ['NaN', '-1', 'Infinity', '1501']) assert.throws(() => numberOrNull(input, 'kg'));
  assert.throws(() => numberOrNull('2.5', 'reps'));
});
test('quota e accesso negato: nessun falso salvataggio, stato e byte precedenti intatti', () => {
  const store = new MemoryStorage(); const repo = new Repository(store); repo.commit(fixture());
  const raw = repo.raw; const before = structuredClone(repo.state); store.fail = 'all';
  assert.throws(() => repo.update(s => assign(s, '2026-10-19', 'rest')), /Quota/);
  assert.deepEqual(repo.state, before); assert.equal(store.getItem(STORAGE_KEY), raw);
  store.fail = 'read'; const denied = new Repository(store); assert.equal(denied.blocked, true);
  assert.throws(() => denied.update(s => assign(s, '2026-10-19', 'rest')), /bloccato/);
});
test('conflitto tra schede non sovrascrive dati salvati altrove', () => {
  const store = new MemoryStorage(); const one = new Repository(store); const two = new Repository(store);
  one.update(s => assign(s, '2026-10-19', 'rest'));
  assert.throws(() => two.update(s => assign(s, '2026-10-20', 'free')), /altra scheda/);
  assert.equal(new Repository(store).state.days['2026-10-19'].assignment.kind, 'rest');
  assert.equal(new Repository(store).state.days['2026-10-20'], undefined);
});
test('export/ripristino equivalenti con copia esatta prima della sostituzione e V21 intatto', () => {
  const store = new MemoryStorage(); store.setItem('coach_v21', '{"legacy":true}');
  const repo = new Repository(store); repo.commit(fixture());
  repo.update(s => sessionOn(s, '2026-10-19', 39));
  const backup = repo.export(); const expected = structuredClone(repo.state);
  repo.update(s => assign(s, '2026-10-20', 'rest')); const previous = repo.raw;
  const key = repo.restore(backup);
  assert.equal(store.getItem(key), previous);
  assert.deepEqual(repo.state.days, expected.days); assert.deepEqual(repo.state.templates, expected.templates);
  assert.equal(store.getItem('coach_v21'), '{"legacy":true}');
  assert.deepEqual(new Repository(store).state, repo.state);
});
test('ripristino fallito prima/dopo copia non perde lo stato precedente', () => {
  for (const failure of ['backup', 'current']) {
    const store = new MemoryStorage(); const repo = new Repository(store); repo.commit(fixture());
    const raw = repo.raw; const before = structuredClone(repo.state); store.fail = failure;
    assert.throws(() => repo.restore(JSON.stringify(freshState())), /Quota/);
    assert.equal(repo.raw, raw); assert.equal(store.getItem(STORAGE_KEY), raw); assert.deepEqual(repo.state, before);
    if (failure === 'current') assert.equal(repo.backups()[0].raw, raw);
  }
});
test('contenuto corrotto protetto; recupero con backup raw prima del ripristino', () => {
  const store = new MemoryStorage(); store.setItem(STORAGE_KEY, '{corrotto');
  const repo = new Repository(store); assert.equal(repo.blocked, true); assert.equal(repo.raw, '{corrotto');
  assert.throws(() => repo.export(), /non leggibile/);
  assert.throws(() => repo.commit(freshState()), /bloccato/);
  const key = repo.restore(JSON.stringify(freshState())); assert.equal(store.getItem(key), '{corrotto'); assert.equal(repo.blocked, false);
});
test('import malformato, versione sconosciuta, duplicati e chiavi pericolose non modificano lo storage', () => {
  const store = new MemoryStorage(); const repo = new Repository(store); repo.commit(fixture()); const raw = repo.raw;
  const duplicate = fixture(); sessionOn(duplicate, '2026-10-19', 39); duplicate.days['2026-10-19'].sessions.push(structuredClone(duplicate.days['2026-10-19'].sessions[0]));
  const invalid = fixture(); invalid.days['2026-02-31'] = { date: '2026-02-31', assignment: null, sessions: [], notes: '' };
  const badNumber = fixture(); badNumber.templates[0].exercises[0].sets[0].kg = '40';
  for (const input of ['{', 'null', '{"schemaVersion":2}', '{"__proto__":{}}', JSON.stringify(duplicate), JSON.stringify(invalid), JSON.stringify(badNumber), ' '.repeat(5_000_001)]) {
    assert.throws(() => repo.restore(input)); assert.equal(store.getItem(STORAGE_KEY), raw); assert.equal(repo.backups().length, 0);
  }
});
test('roundtrip parser e rifiuto schemi storici senza migrazioni implicite', () => {
  const state = fixture(); sessionOn(state, '2026-10-19', 39);
  assert.deepEqual(parseBackup(JSON.stringify(state)), state);
  assert.throws(() => parseBackup('{"day":1,"session":{}}'), /Versione/);
  assert.equal(localDate(new Date(2026, 9, 29, 0, 1)), '2026-10-29');
});
