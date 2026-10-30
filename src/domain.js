import { validateMeals } from './meals.js';
import { validatePantry } from './pantry.js';
import { validateFoods } from './foods.js';
import { historicalTemplates } from './presets.js';
// Date civili locali per il diario; i timestamp ISO servono soltanto per l'audit.
export const SCHEMA_VERSION = 1;
export const clone = value => structuredClone(value);
export const uid = () => crypto.randomUUID();
const fail = message => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value, max = 160) => typeof value === 'string' && value.length <= max;
const id = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function isDate(value) {
  if (typeof value !== 'string' || !/^(19|20|21)\d{2}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const d = new Date(year, month - 1, day, 12);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}
export function dateObject(value) {
  assert(isDate(value), 'Data non valida (1900–2199).');
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
export function addDays(value, amount) {
  const d = dateObject(value);
  d.setDate(d.getDate() + amount);
  const result = localDate(d);
  assert(isDate(result), 'Data fuori intervallo (1900–2199).');
  return result;
}
export function suggestedPlanningDate(now = new Date()) {
  assert(now instanceof Date && Number.isFinite(now.getTime()), 'Ora locale non valida.');
  const today=localDate(now);
  assert(isDate(today),'Data fuori intervallo (1900–2199).');
  return now.getHours()>=21 && today<'2199-12-31' ? addDays(today,1) : today;
}
export function weekDates(value) {
  const d = dateObject(value);
  const monday = addDays(value, -((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = dateObject(monday);
    day.setDate(day.getDate() + i);
    return localDate(day);
  }).filter(isDate);
}
export const formatDate = (value, options = { day: 'numeric', month: 'long', year: 'numeric' }) => dateObject(value).toLocaleDateString('it-IT', options);
export function freshState() {
  return {
    schemaVersion: SCHEMA_VERSION, revision: 0, updatedAt: null,
    templates: historicalTemplates(),
    days: {},
  };
}
export const newDay = date => ({ date, assignment: null, sessions: [], notes: '' });
export function newExercise(name, mode = 'strength', equipment = '') {
  assert(text(name) && name.trim(), 'Inserisci il nome dell’esercizio.');
  return { id: uid(), name: name.trim(), mode, equipment, sets: [{ kg: null, reps: null, minutes: null }] };
}
export function numberOrNull(value, field) {
  if (String(value).trim() === '') return null;
  const number = Number(String(value).replace(',', '.'));
  const max = field === 'kg' ? 1500 : field === 'reps' ? 1000 : 1440;
  assert(Number.isFinite(number) && number >= 0 && number <= max && (field !== 'reps' || Number.isInteger(number)), `Valore ${field} non valido (0–${max}${field === 'reps' ? ', intero' : ''}).`);
  return number;
}
function validateSet(set, mode) {
  assert(isObject(set), 'Serie non valida.');
  for (const field of ['kg', 'reps', 'minutes']) {
    assert(set[field] === null || (typeof set[field] === 'number' && numberOrNull(set[field], field) === set[field]), 'Valori della serie non validi.');
  }
  assert(mode === 'cardio' ? set.kg === null && set.reps === null : set.minutes === null, 'Unità incompatibili con il tipo di esercizio.');
}
function validateExercises(exercises, results = false) {
  assert(Array.isArray(exercises) && exercises.length <= 100, 'Elenco esercizi non valido.');
  const ids = new Set();
  for (const exercise of exercises) {
    assert(isObject(exercise) && id(exercise.id) && !ids.has(exercise.id) && text(exercise.name) && exercise.name.trim() && text(exercise.equipment), 'Esercizio non valido o duplicato.');
    ids.add(exercise.id);
    assert(['strength', 'cardio'].includes(exercise.mode), 'Tipo di esercizio non valido.');
    if (exercise.legacyReference !== undefined) {
      const ref = exercise.legacyReference;
      assert(isObject(ref) && ref.source==='V21' && text(ref.note,2000) && (ref.kg===null || (typeof ref.kg==='number' && numberOrNull(ref.kg,'kg')===ref.kg)), 'Riferimento storico non valido.');
    }
    assert(Array.isArray(exercise.sets) && exercise.sets.length > 0 && exercise.sets.length <= 30, 'Numero serie non valido (1–30).');
    exercise.sets.forEach(set => validateSet(set, exercise.mode));
    if (results) {
      assert(Array.isArray(exercise.results) && exercise.results.length === exercise.sets.length, 'Risultati e target non allineati.');
      exercise.results.forEach(set => validateSet(set, exercise.mode));
    }
  }
}
function validateTemplate(template) {
  assert(isObject(template) && id(template.id) && text(template.title) && template.title.trim() && Number.isSafeInteger(template.version) && template.version > 0, 'Scheda non valida.');
  validateExercises(template.exercises);
  if (template.sourceNote !== undefined) assert(text(template.sourceNote,2000), 'Nota scheda non valida.');
  if (template.origin !== undefined) assert(['v21','custom'].includes(template.origin), 'Origine scheda non valida.');
}
export function createTemplate(state, title, copyFromId = '') {
  assert(text(title) && title.trim(), 'Dai un nome alla nuova scheda.');
  assert(state.templates.length < 100, 'Massimo 100 schede nel catalogo personale.');
  const normalized = title.trim().toLocaleLowerCase('it');
  assert(!state.templates.some(t=>t.title.trim().toLocaleLowerCase('it')===normalized), 'Esiste già una scheda con questo nome.');
  const base = copyFromId.startsWith('v21:') ? historicalTemplates().find(t=>t.id===copyFromId.slice(4)) : copyFromId ? state.templates.find(t=>t.id===copyFromId) : null;
  assert(!copyFromId || base, 'Scheda di partenza non disponibile.');
  const template = {id:uid(),title:title.trim(),version:1,origin:'custom',exercises:base ? clone(base.exercises) : []};
  state.templates.push(template);
  return template.id;
}
export function validateState(state) {
  assert(isObject(state) && state.schemaVersion === SCHEMA_VERSION, 'Versione backup non supportata. Nessuna migrazione automatica disponibile.');
  validatePantry(state);
  validateFoods(state);
  assert(Number.isSafeInteger(state.revision) && state.revision >= 0, 'Revisione non valida.');
  assert(state.updatedAt === null || (text(state.updatedAt, 40) && Number.isFinite(Date.parse(state.updatedAt))), 'Timestamp non valido.');
  assert(Array.isArray(state.templates) && state.templates.length <= 100, 'Schede non valide.');
  const templateIds = new Set();
  for (const template of state.templates) {
    validateTemplate(template);
    assert(!templateIds.has(template.id), 'Identificativo scheda duplicato.');
    templateIds.add(template.id);
  }
  assert(isObject(state.days) && Object.keys(state.days).length <= 20000, 'Diario non valido o troppo grande.');
  const sessionIds = new Set();
  const mealIds = new Set();
  if (state.shoppingWeeks !== undefined) {
    assert(isObject(state.shoppingWeeks) && Object.keys(state.shoppingWeeks).length<=16000, 'Preferenze della spesa non valide.');
    for(const [week,settings] of Object.entries(state.shoppingWeeks)) {
      assert(isDate(week) && dateObject(week).getDay()===1 && isObject(settings) && typeof settings.includeOptional==='boolean', 'Settimana della spesa non valida.');
      assert(Array.isArray(settings.checked) && settings.checked.length<=5000 && settings.checked.every(key=>text(key,1500)) && new Set(settings.checked).size===settings.checked.length, 'Spunte della spesa non valide.');
    }
  }
  for (const [date, day] of Object.entries(state.days)) {
    assert(isDate(date) && isObject(day) && day.date === date && text(day.notes, 4000), 'Data o note del diario non valide.');
    if (day.meals !== undefined) validateMeals(day.meals, mealIds);
    if (day.assignment !== null) {
      const a = day.assignment;
      assert(isObject(a) && ['workout', 'rest', 'free'].includes(a.kind) && ['planned', 'skipped'].includes(a.status), 'Piano non valido.');
      if (a.kind === 'workout') validateTemplate(a.template);
      else assert(a.template === null, 'Piano non valido.');
    }
    assert(Array.isArray(day.sessions) && day.sessions.length <= 20, 'Sedute non valide.');
    for (const session of day.sessions) {
      assert(isObject(session) && id(session.id) && !sessionIds.has(session.id) && session.date === date && text(session.title) && session.title.trim() && text(session.notes, 4000), 'Seduta non valida o duplicata.');
      sessionIds.add(session.id);
      assert(['draft', 'completed'].includes(session.status), 'Stato seduta non valido.');
      assert(session.templateId === null || id(session.templateId), 'Origine scheda non valida.');
      assert(Number.isSafeInteger(session.templateVersion) && session.templateVersion >= 0, 'Versione scheda seduta non valida.');
      assert(session.durationMinutes === null || (typeof session.durationMinutes === 'number' && numberOrNull(session.durationMinutes, 'minutes') === session.durationMinutes), 'Durata non valida.');
      validateExercises(session.exercises, true);
      if (session.status === 'completed') assert(hasResult(session), 'Una seduta completata richiede almeno un risultato o una durata positiva.');
    }
  }
  return state;
}
export function parseBackup(raw) {
  assert(typeof raw === 'string' && raw.length <= 5_000_000, 'Backup troppo grande (massimo 5 MB di testo).');
  let value;
  try { value = JSON.parse(raw); } catch { fail('Il file non è JSON valido. I dati attuali sono intatti.'); }
  // Rifiutare chiavi pericolose anche in metadati non utilizzati.
  const inspect = object => {
    if (!object || typeof object !== 'object') return;
    for (const [key, child] of Object.entries(object)) {
      assert(!['__proto__', 'prototype', 'constructor'].includes(key), 'Chiave non consentita nel backup.');
      inspect(child);
    }
  };
  inspect(value);
  return validateState(value);
}
export function assign(state, date, choice) {
  assert(isDate(date), 'Data non valida.');
  const day = state.days[date] ??= newDay(date);
  if (choice === '') day.assignment = null;
  else if (['rest', 'free'].includes(choice)) day.assignment = { kind: choice, status: 'planned', template: null };
  else {
    const template = state.templates.find(t => t.id === choice);
    assert(template, 'Scheda non disponibile.');
    day.assignment = { kind: 'workout', status: 'planned', template: clone(template) };
  }
}
export function applyStandardWeek(state, date) {
  const choices = ['template-1', 'template-4', 'template-2', 'template-5', 'template-3', 'rest', 'rest'];
  weekDates(date).forEach((day, i) => {
    if (!state.days[day]?.assignment && !state.days[day]?.sessions.length) assign(state, day, choices[i]);
  });
}
export function moveAssignment(state, from, to) {
  assert(isDate(from) && isDate(to) && from !== to, 'Scegli una data diversa e valida.');
  const source = state.days[from];
  assert(source?.assignment && source.assignment.status === 'planned', 'Nessun piano da spostare.');
  assert(!state.days[to]?.assignment, 'La data di destinazione ha già un piano. Modificalo prima di spostare.');
  const destination = state.days[to] ??= newDay(to);
  destination.assignment = source.assignment;
  source.assignment = null;
}
export function startSession(state, date) {
  assert(isDate(date), 'Data non valida.');
  assert(date <= localDate(), 'Puoi pianificare il futuro; i risultati si registrano da oggi al passato.');
  const day = state.days[date];
  assert(day?.assignment && day.assignment.kind !== 'rest' && day.assignment.status === 'planned', 'Scegli una scheda o un’attività libera prima di iniziare.');
  assert(!day.sessions.some(s => s.status === 'draft'), 'Completa o correggi prima la bozza esistente.');
  const template = day.assignment.template;
  const session = {
    id: uid(), date, title: template?.title || 'Attività libera', templateId: template?.id ?? null, templateVersion: template?.version ?? 0,
    status: 'draft', durationMinutes: null, notes: '',
    exercises: (template?.exercises || []).map(e => ({ ...clone(e), results: e.sets.map(() => ({ kg: null, reps: null, minutes: null })) })),
  };
  day.sessions.push(session);
  return session.id;
}
export function hasResult(session) {
  return session.durationMinutes > 0 || session.exercises.some(e => e.results.some(s => e.mode === 'cardio' ? s.minutes > 0 : s.reps > 0));
}
export function dayStatus(day) {
  if (!day) return 'Non registrato';
  if (day.sessions.some(s => s.status === 'draft')) return 'Bozza';
  if (day.sessions.some(s => s.status === 'completed')) return 'Completato';
  if (day.assignment?.status === 'skipped') return 'Saltato';
  if (day.assignment?.kind === 'rest') return 'Riposo pianificato';
  if (day.foodEntries?.length) return 'Alimenti registrati';
  return day.assignment || day.meals?.length ? 'Pianificato' : 'Non registrato';
}
