import { clone, localDate, isDate, dateObject, addDays, weekDates, formatDate, uid, newExercise, numberOrNull, assign, applyStandardWeek, moveAssignment, startSession, dayStatus, parseBackup, createTemplate, suggestedPlanningDate } from './domain.js';
import { Repository, STORAGE_KEY } from './storage.js';
import { loadCatalog, renderRecipeLibrary } from './recipes.js';
import { icon } from './ui.js';
import { recipeMatchesMeal } from './recipe-tags.js';
import { servingBasis, singleServingRecipe } from './single-serving.js';
import { createMeal, validateBatchPortions, validatePeople, portionIssues, correctPortions, mealBatchYield } from './meals.js';
import { pickerPortionSetup, readMetricFields, portionPreview } from './portion-ui.js';
import { renderMeals } from './meal-ui.js';
import { templateWorkspace } from './templates-ui.js';
import { renderWeeklyPlanner, renderMealPicker, pickerRecipeResults } from './planner-ui.js';
import { shoppingForWeek, shoppingText, mealShoppingRows } from './shopping.js';
import { setPantryStock, pantryEntry, purchasePack, consumePantry, undoPantryMovement, cookedMovement } from './pantry.js';
import { metricIngredient } from './metric.js';
import { planRecipeOnDates, copyMenuWeek } from './planner.js';

let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { throw Error('Accesso al browser negato.'); } }; }
const repo = new Repository(storage);
let selectedDate = localDate();
let plannerDate = null;
let plannerDateAutomatic = true;
let view = 'today';
let selectedTemplate = repo.state.templates[0]?.id;
let activeSession = null;
let templateDraft = null;
let sessionDraft = null;
let dirty = false;
const dirtyForms = new Set();
let pendingImport = null;
let recipeCatalog = null;
let recipeLoadError = '';
let recipeLoading = false;
let recipeQuery = '';
let recipeCategory = '';
let recipeMealSlot = '';
let selectedRecipe = null;
let recipeMultiplier = 1;
let plannerTab = 'menu';
let mealPicker = null;
const main = document.querySelector('#main');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const safe = escape;
const num = value => value === null ? '—' : escape(value);
const dateInput = (id, value, extra = '') => `<input type="date" id="${id}" min="1900-01-01" max="2199-12-31" value="${value}" ${extra}>`;
const statusClass = day => day?.sessions.some(s => s.status === 'draft') ? 'draft' : day?.sessions.some(s => s.status === 'completed') ? 'complete' : day?.assignment || day?.meals?.length ? 'planned' : 'empty';
const assignmentName = day => day?.assignment?.template?.title || ({ rest: 'Riposo', free: 'Attività libera' }[day?.assignment?.kind]) || (day?.meals?.length ? `${day.meals.length} ricette in menu` : 'Nessun piano');
function notify(message, error = false) {
  const notice = document.querySelector('#notice');
  notice.className = `notice ${error ? 'error' : 'success'}`;
  notice.textContent = message;
  const close=document.createElement('button');
  close.type='button'; close.className='notice-close'; close.dataset.action='dismiss-notice';
  close.setAttribute('aria-label','Chiudi messaggio'); close.textContent='×';
  notice.append(close);
  notice.setAttribute('role', error ? 'alert' : 'status');
}
function discard() {
  if (dirty && !window.confirm('Ci sono modifiche non salvate. Vuoi abbandonarle?')) return false;
  dirty = false;
  dirtyForms.clear();
  templateDraft = null;
  sessionDraft = null;
  return true;
}
function save(operation, message = 'Dati salvati su questo browser.', options={}) {
  try {
    const result = repo.update(operation,options);
    dirty = false;
    dirtyForms.clear();
    templateDraft = null;
    sessionDraft = null;
    render();
    notify(message);
    return { result };
  } catch (error) { notify(`Salvataggio non riuscito. ${error.message} Le modifiche nel modulo restano disponibili.`, true); return null; }
}
function pageHeading(eyebrow, title, subtitle, action = '') {
  return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="muted">${subtitle}</p></div>${action}</div>`;
}
function choiceOptions(value) {
  return `<option value="">Nessun piano</option>${repo.state.templates.map(t => `<option value="${t.id}" ${value === t.id ? 'selected' : ''}>${safe(t.title)}</option>`).join('')}<option value="rest" ${value === 'rest' ? 'selected' : ''}>Riposo</option><option value="free" ${value === 'free' ? 'selected' : ''}>Attività libera</option>`;
}
function renderWeek() {
  const dates = weekDates(selectedDate);
  return `<section class="week-panel" aria-label="Settimana selezionata"><div class="section-line"><h2>La tua settimana</h2><div class="inline"><button class="icon-button" data-action="week-prev" aria-label="Settimana precedente">←</button><span class="small">${formatDate(dates[0], { day: 'numeric', month: 'short', year: 'numeric' })} — ${formatDate(dates.at(-1), { day: 'numeric', month: 'short', year: 'numeric' })}</span><button class="icon-button" data-action="week-next" aria-label="Settimana successiva">→</button></div></div><div class="week-grid">${dates.map(date => {
    const day = repo.state.days[date];
    return `<button class="day-card ${date === selectedDate ? 'selected' : ''}" data-date="${date}" aria-pressed="${date === selectedDate}" aria-label="${formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${assignmentName(day)}, ${dayStatus(day)}"><span class="day-weekday">${formatDate(date, { weekday: 'short' })}${date === localDate() ? ' · oggi' : ''}</span><strong>${date.slice(-2)}</strong><span class="day-program">${safe(assignmentName(day))}</span><span class="day-state ${statusClass(day)}">${dayStatus(day)}</span></button>`;
  }).join('')}</div></section>`;
}
function renderCalendar() {
  const current = dateObject(selectedDate);
  const first = new Date(current.getFullYear(), current.getMonth(), 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
  return `<section class="panel month"><div class="section-line"><h2>${formatDate(selectedDate, { month: 'long', year: 'numeric' })}</h2><div class="inline"><button class="icon-button" data-action="month-prev" aria-label="Mese precedente">←</button><button class="icon-button" data-action="month-next" aria-label="Mese successivo">→</button></div></div><div class="month-grid">${['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => `<span class="month-weekday">${d}</span>`).join('')}${'<span></span>'.repeat(offset)}${Array.from({ length: days }, (_, i) => {
    const date = `${selectedDate.slice(0, 7)}-${String(i + 1).padStart(2, '0')}`;
    const day = repo.state.days[date];
    return `<button data-date="${date}" class="month-day ${date === selectedDate ? 'selected' : ''}" aria-pressed="${date === selectedDate}" aria-label="${formatDate(date)}, ${dayStatus(day)}"><strong>${i + 1}</strong><span class="calendar-dot ${statusClass(day)}"></span><span class="month-program">${safe(assignmentName(day))}</span></button>`;
  }).join('')}</div><p class="hint">Seleziona una data per consultare, pianificare o correggere. Una data vuota non è una seduta saltata.</p></section>`;
}
function renderDay() {
  const day = repo.state.days[selectedDate];
  const assignment = day?.assignment;
  const choice = assignment?.template?.id || assignment?.kind || '';
  return `<section class="panel agenda"><div class="section-line"><p class="eyebrow">IL GIORNO SELEZIONATO</p><span class="pill ${statusClass(day)}">${dayStatus(day)}</span></div><h2>${formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' })}</h2><p class="muted small">${selectedDate}</p><form id="plan-form"><label for="plan-choice">Allenamento in programma</label><select id="plan-choice" name="choice">${choiceOptions(choice)}</select><button type="submit" class="primary full">Salva piano</button></form>${assignment?.status === 'skipped' ? '<p class="hint">Hai indicato esplicitamente il piano come saltato. Salva il piano per ripianificarlo.</p>' : ''}<div class="agenda-actions">${assignment && assignment.status === 'planned' ? `<form id="move-form"><label for="move-date">Sposta soltanto il piano al</label><div class="inline">${dateInput('move-date', '', 'required aria-label="Data di destinazione del piano"')}<button type="submit" class="secondary">Sposta</button></div></form><button class="text-button" data-action="skip-plan">Segna piano come saltato</button>` : ''}<button class="text-button" data-action="standard">Applica settimana standard</button><p class="hint">Lun · Mer · Ven: Total Body 1/2/3<br>Mar · Gio: Cardio 1/2. Weekend: riposo.<br>Riempie solo date senza piano e senza sedute.</p></div><div class="divider"></div><form id="day-notes-form"><label for="day-notes">Note del giorno</label><textarea id="day-notes" maxlength="4000" rows="3" placeholder="Come ti senti? Cosa vuoi ricordare?">${safe(day?.notes || '')}</textarea><button class="secondary" type="submit">Salva note</button></form></section>`;
}
function setFields(exercise, i, kind, editable = true) {
  const rows = kind === 'result' ? exercise.results : exercise.sets;
  return rows.map((set, j) => `<div class="set-row ${exercise.mode === 'cardio' ? 'cardio' : ''}"><span class="set-index">${j + 1}</span>${(exercise.mode === 'cardio' ? ['minutes'] : ['kg', 'reps']).map(field => {
    const name = `${kind}-${i}-${j}-${field}`;
    const label = field === 'kg' ? 'kg' : field === 'reps' ? 'rip.' : 'min';
    return editable ? `<label class="numeric-label"><span class="sr-only">${safe(exercise.name)}, serie ${j + 1}, ${kind === 'result' ? 'risultato' : 'target'} ${label}</span><input name="${name}" type="number" inputmode="decimal" min="0" max="${field === 'kg' ? 1500 : field === 'reps' ? 1000 : 1440}" step="${field === 'reps' ? 1 : 'any'}" value="${set[field] ?? ''}" placeholder="—" aria-label="${safe(exercise.name)}, serie ${j + 1}, ${kind === 'result' ? 'risultato' : 'target'} ${label}"><span aria-hidden="true">${label}</span></label>` : `<span class="target-value">${num(set[field])}<small> ${label}</small></span>`;
  }).join('')}</div>`).join('');
}
function addExerciseForm() {
  return `<div class="exercise-add"><h3>Aggiungi un esercizio</h3><div class="add-grid"><label>Nome<input id="exercise-name" maxlength="160" placeholder="Es. Rematore"></label><label>Tipo<select id="exercise-mode"><option value="strength">Pesi / corpo libero</option><option value="cardio">Cardio, in minuti</option></select></label><label>Attrezzatura / convenzione<input id="exercise-equipment" maxlength="160" placeholder="Es. manubrio singolo, kg"></label></div><button type="button" class="secondary" data-action="add-exercise">+ Aggiungi al modulo</button><p class="hint">Imposta tu esercizi e target. Nessun carico o programma è prescritto dall’app.</p></div>`;
}
function renderWorkout() {
  const day = repo.state.days[selectedDate];
  const sessions = day?.sessions || [];
  let session = sessionDraft || sessions.find(s => s.id === activeSession) || sessions.at(-1);
  activeSession = session?.id ?? null;
  const canStart = selectedDate <= localDate() && day?.assignment?.status === 'planned' && day.assignment.kind !== 'rest' && !sessions.some(s => s.status === 'draft');
  const header = `<div class="section-line"><div><p class="eyebrow">ALLENAMENTO</p><h2>Il tuo diario di seduta</h2></div><span class="outline-icon">${icon('dumbbell')}</span></div>`;
  if (!session) return `<section class="panel workout">${header}<div class="empty-state"><div class="empty-symbol">${icon('dumbbell')}</div><h3>${selectedDate > localDate() ? 'Prepara la prossima seduta' : 'Ogni serie ha la sua storia'}</h3><p>${day?.assignment?.kind === 'rest' ? 'Hai programmato riposo. Puoi scegliere un’altra attività dal piano.' : 'Scegli una scheda nel piano, poi avvia la seduta per registrare i risultati.'}</p>${canStart ? '<button class="primary" data-action="start-session">Inizia seduta</button>' : ''}<button class="text-button" data-view="templates">Configura le mie schede →</button></div><div class="info-note">Target e risultati sono distinti. Le basi V21 sono preimpostate: puoi personalizzarle, creare altre schede o aggiungere esercizi durante la seduta.</div></section>`;
  return `<section class="panel workout">${header}<div class="session-switch">${sessions.map(s => `<button class="secondary ${s.id === session.id ? 'chosen' : ''}" data-session="${s.id}">${safe(s.title)} · ${s.status === 'completed' ? 'Completata' : 'Bozza'}</button>`).join('')}</div><form id="session-form"><div class="section-line"><h3>${safe(session.title)}</h3><span class="pill ${session.status === 'completed' ? 'complete' : 'draft'}">${session.status === 'completed' ? 'Completata' : 'Bozza'}</span></div><p class="hint">Target copiati all’avvio · versione ${session.templateVersion}. Le modifiche alla scheda non cambiano questa seduta. Il trattino indica un dato mancante; 0 è un valore esplicito.</p>${session.exercises.map((e, i) => `<article class="exercise"><div class="section-line"><div><h3>${safe(e.name)}</h3><p class="hint">${safe(e.equipment) || 'Attrezzatura non specificata'} · ${e.mode === 'cardio' ? 'Cardio' : 'Pesi / corpo libero'}</p></div><button type="button" class="text-button" data-action="add-set" data-index="${i}">+ Serie</button></div><div class="sets-columns"><div><h4>Target</h4>${setFields(e, i, 'target', false)}</div><div><h4>Risultato effettivo</h4>${setFields(e, i, 'result')}</div></div></article>`).join('')}${addExerciseForm()}<div class="add-grid"><label>Durata effettiva (min)<input type="number" id="session-duration" min="0" max="1440" step="any" value="${session.durationMinutes ?? ''}" placeholder="Non registrata"></label><label>Stato della seduta<select id="session-status"><option value="draft" ${session.status === 'draft' ? 'selected' : ''}>Bozza / parziale</option><option value="completed" ${session.status === 'completed' ? 'selected' : ''}>Completata</option></select></label></div><label for="session-notes">Note della seduta</label><textarea id="session-notes" maxlength="4000" rows="2">${safe(session.notes)}</textarea><div class="save-line"><button class="primary" type="submit">Salva seduta</button><span class="hint">Per completare: almeno un risultato o una durata positiva. I campi mancanti restano mancanti.</span></div></form>${canStart ? '<button class="text-button" data-action="start-session">+ Un’altra seduta in questa data</button>' : ''}</section>`;
}
function renderMenu() {
  return `${pageHeading('DALLA CUCINA ALLA SPESA', 'Menu e spesa.', 'Scegli colazione, pranzo e cena. Dalle 21:00 proponiamo domani; le date scelte da te restano selezionate.')}<div class="day-toolbar"><div class="date-picker"><label for="selected-date">Settimana della data</label>${dateInput('selected-date',selectedDate)}<button class="secondary" data-action="today">Giorno proposto</button></div></div>${renderWeeklyPlanner({state:repo.state,date:selectedDate,tab:plannerTab,catalog:recipeCatalog,error:recipeLoadError})}${plannerTab==='menu' ? renderMeals({state:repo.state,date:selectedDate,day:repo.state.days[selectedDate],catalog:recipeCatalog,error:recipeLoadError,editable:true}) : ''}`;
}
function mealShortcut() {
  const report=shoppingForWeek(repo.state,localDate());
  return `<section class="meal-shortcut" aria-label="Organizza menu e spesa"><div><p class="eyebrow">COSA MANGIAMO QUESTA SETTIMANA?</p><h2>Prima scegli i pasti, poi fai la spesa.</h2><p>${report.filledSlots} pasti con ricette questa settimana. Puoi iniziare anche da un solo pasto.</p></div><div class="inline"><button class="primary" data-view="menu" data-open-planner="menu">${icon('plate')} Scegli i pasti</button><button class="secondary" data-view="menu" data-open-planner="shopping">${icon('cart')} Lista della spesa</button><button class="secondary" data-view="menu" data-open-planner="pantry">${icon('leaf')} Dispensa</button></div></section>`;
}
function renderToday() {
  const completed = Object.values(repo.state.days).flatMap(d => d.sessions).filter(s => s.status === 'completed').length;
  const drafts = Object.values(repo.state.days).flatMap(d => d.sessions).filter(s => s.status === 'draft').length;
  const plans = Object.values(repo.state.days).filter(d => d.assignment?.status === 'planned' && d.assignment.kind !== 'rest' && d.date >= localDate()).length;
  const heading = pageHeading(view === 'calendar' ? 'ORGANIZZA IL TUO TEMPO' : 'IL TUO BENESSERE, OGNI GIORNO', view === 'calendar' ? 'Il tuo calendario.' : 'Un giorno alla volta.', view === 'calendar' ? 'Colazione, pranzo e cena. Il menu diventa la tua lista della spesa.' : 'Pianifica con libert\u00e0. Registra quello che fai davvero.');
  const today = repo.state.days[localDate()];
  const meals = renderMeals({state:repo.state,date:selectedDate,day:repo.state.days[selectedDate],catalog:recipeCatalog,error:recipeLoadError,editable:view==='calendar'});
  const hero = view === 'today' ? `<section class="today-hero"><div class="hero-copy"><span class="hero-label">${icon('spark')} IL TUO PROSSIMO PASSO</span><h2>Trova il tuo ritmo.<br><span>Allenamento e cucina, al ritmo tuo.</span></h2><p>Organizza quello che vuoi fare.<br>Ritrova quello che hai fatto davvero.</p><div class="hero-actions"><button class="primary" data-view="calendar">Pianifica la settimana ${icon('arrow')}</button><button class="hero-link" data-view="recipes">Esplora le ricette ${icon('arrowUp')}</button></div></div><div class="hero-visual" aria-hidden="true"><span class="hero-orbit hero-orbit-one"></span><span class="hero-orbit hero-orbit-two"></span><div class="hero-emblem">${icon('dumbbell')}</div><div class="hero-float float-top">${icon('leaf')} Mangia con gusto</div><div class="hero-float float-bottom">${icon('check')} Segui il tuo ritmo</div></div><div class="hero-day"><span class="hero-day-icon">${icon('calendar')}</span><div><span>${formatDate(localDate(),{weekday:'long',day:'numeric',month:'long'})}</span><strong>${safe(assignmentName(today))}</strong></div><span class="hero-day-status">${dayStatus(today)}</span></div></section>` : '';
  return `${heading}${hero}${view==='today' ? mealShortcut() : ''}<div class="stats"><div><span class="stat-icon">${icon('check')}</span><div><strong>${completed}</strong><span>Sedute completate · archivio</span></div></div><div><span class="stat-icon blue">${icon('calendar')}</span><div><strong>${plans}</strong><span>Allenamenti pianificati da oggi</span></div></div><div><span class="stat-icon amber">${icon('clock')}</span><div><strong>${drafts}</strong><span>Sedute in bozza · archivio</span></div></div></div><div class="day-toolbar"><div><span class="toolbar-icon">${icon('calendar')}</span><span>La tua agenda</span></div><div class="date-picker"><label for="selected-date">Vai alla data</label>${dateInput('selected-date', selectedDate)}<button class="secondary" data-action="today">${view==='calendar'?'Giorno proposto':'Oggi'}</button></div></div>${view === 'calendar' ? renderWeeklyPlanner({state:repo.state,date:selectedDate,tab:plannerTab,catalog:recipeCatalog,error:recipeLoadError}) : renderWeek()}${view === 'calendar' ? `<details class="monthly-disclosure"><summary>Apri calendario mensile</summary>${renderCalendar()}</details>${meals}` : ''}<div class="day-layout">${renderDay()}${renderWorkout()}</div>${view === 'today' ? meals : ''}<details class="next-phase"><summary>Cosa arriverà in Coach OS ${icon('arrow')}</summary><p>Diario alimentare, energia e peso, andamento delle prestazioni.</p><span class="hint">Non ancora disponibili. Nessuna stima scientifica attiva in questa versione.</span></details>`;
}
function getTemplateDraft() {
  if (!templateDraft) templateDraft = clone(repo.state.templates.find(t => t.id === selectedTemplate));
  return templateDraft;
}
function renderTemplates() {
  const template = getTemplateDraft();
  return `${pageHeading('IL TUO PROGRAMMA', 'Le mie schede.', 'Le basi della V21, i tuoi esercizi e tutto lo spazio per nuove schede.')}${templateWorkspace({templates:repo.state.templates,selectedId:selectedTemplate,template,fields:setFields,addForm:addExerciseForm})}`;
}
function download(raw, name, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([raw], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function summary(state) {
  return `${state.templates.length} schede, ${Object.keys(state.days).length} date, ${Object.values(state.days).reduce((n, d) => n + d.sessions.length, 0)} sedute, ${Object.values(state.days).reduce((n,d)=>n+(d.meals?.length || 0),0)} ricette pianificate`;
}
function renderData() {
  let backups = [];
  let legacy = false;
  try { backups = repo.backups(); legacy = storage.getItem('coach_v21') !== null; } catch { /* errore già visibile, nessuna cancellazione */ }
  return `${pageHeading('IL CONTROLLO È TUO', 'Profilo e dati.', 'Archivio locale, backup leggibili e ripristino con copia di sicurezza.')}<div class="data-grid"><section class="panel"><p class="eyebrow">ARCHIVIO DEL BROWSER</p><h2>I tuoi dati, al sicuro con te.</h2><p>${summary(repo.state)}</p><p class="hint">Formato ${repo.state.schemaVersion} · revisione ${repo.state.revision}<br>${repo.state.updatedAt ? `Ultimo salvataggio: ${safe(new Date(repo.state.updatedAt).toLocaleString('it-IT'))}` : 'Nessun salvataggio effettuato.'}</p><button class="primary" data-action="export">Esporta backup JSON</button><p class="hint">Conserva una copia fuori dal browser. Cambiare browser, indirizzo o porta apre un archivio diverso. La navigazione privata può eliminare i dati alla chiusura.</p>${repo.raw !== null ? '<button class="text-button" data-action="export-raw">Scarica anche il contenuto locale originale</button>' : ''}${legacy ? '<div class="info-note">Rilevato un archivio V21. È intatto nella chiave coach_v21. Importazione legacy non ancora disponibile: non vengono inventate date o prestazioni.</div><button class="secondary" data-action="export-legacy">Esporta archivio V21 originale</button>' : ''}</section><section class="panel"><p class="eyebrow">RIPRISTINO</p><h2>Importa un backup.</h2><label for="import-file">File JSON di Coach OS, formato 1</label><input type="file" id="import-file" accept=".json,application/json"><p class="hint">Il file viene validato prima di qualsiasi modifica. Il ripristino sostituisce l’archivio corrente e conserva prima una copia locale dello stato precedente. Se la copia non riesce, il ripristino viene annullato.</p>${pendingImport ? `<div class="import-preview"><strong>Backup valido</strong><p>${summary(pendingImport.state)}</p><p class="hint">Attuale: ${summary(repo.state)}. Non è un’unione: verrà sostituito l’intero archivio.</p><button class="primary" data-action="restore">Crea copia e ripristina</button><button class="text-button" data-action="cancel-import">Annulla</button></div>` : ''}</section></div><section class="panel"><h2>Copie di sicurezza</h2>${backups.length ? `<p class="hint">Conservate sullo stesso browser. Scaricale per avere una copia esterna.</p>${backups.map((b, i) => `<div class="backup-line"><span>Copia di sicurezza ${i + 1} · ${safe(b.key.slice(-8))}</span><button class="secondary" data-backup="${safe(b.key)}">Scarica JSON</button></div>`).join('')}` : '<p class="muted">Nessuna copia automatica presente.</p>'}</section><section class="panel"><h2>Profilo personale</h2><p class="muted">La configurazione di dati personali, obiettivi e macro arriverà con le fasi alimentazione ed energia. Nessun valore storico è stato usato come dato attuale.</p></section>`;
}
function render() {
  if(['calendar','menu'].includes(view)) plannerDate=selectedDate;
  document.querySelectorAll('nav [data-view]').forEach(button => {
    button.classList.toggle('active', button.dataset.view === view);
    if (button.dataset.view === view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  document.querySelector('#current-section').textContent = ({today:'Oggi',calendar:'Calendario',menu:'Menu e spesa',templates:'Le mie schede',recipes:'Ricettario',data:'Profilo e dati'})[view];
  document.body.dataset.view = view;
  main.innerHTML = view === 'menu' ? renderMenu() : view === 'recipes' ? renderRecipeLibrary({catalog:recipeCatalog,error:recipeLoadError,query:recipeQuery,category:recipeCategory,mealSlot:recipeMealSlot,selectedId:selectedRecipe,multiplier:recipeMultiplier}) : view === 'templates' ? renderTemplates() : view === 'data' ? renderData() : renderToday();
  revealSelectedDay();
  if (['recipes','calendar','menu'].includes(view) && !recipeCatalog && !recipeLoadError && !recipeLoading) fetchRecipes();
}
function revealSelectedDay() {
  for(const selector of ['.weekly-menu-grid','.week-grid']) {
    const grid=main.querySelector(selector),day=grid?.querySelector('.selected');
    if(grid&&day&&grid.scrollWidth>grid.clientWidth) grid.scrollLeft+=day.getBoundingClientRect().left-grid.getBoundingClientRect().left;
  }
}
function syncPlanningDate() {
  if(!plannerDateAutomatic||dirty||document.querySelector('#meal-picker').open) return;
  const proposed=suggestedPlanningDate();
  if(plannerDate===proposed) return;
  plannerDate=proposed;
  if(['calendar','menu'].includes(view)) {selectedDate=proposed;render();}
}
let planningDateTimer;
function schedulePlanningDateCheck() {
  window.clearTimeout(planningDateTimer);
  syncPlanningDate();
  const now=new Date(),next=new Date(now);
  next.setHours(21,0,0,0);
  if(next<=now) next.setDate(next.getDate()+1);
  planningDateTimer=window.setTimeout(schedulePlanningDateCheck,next.getTime()-now.getTime());
}
async function fetchRecipes() {
  if (recipeLoading) return;
  recipeLoading = true;
  try { recipeCatalog = await loadCatalog(); recipeLoadError = ''; }
  catch (error) { recipeLoadError = error.message; }
  finally {
    recipeLoading = false;
    if (view === 'recipes') render();
    else if (view === 'menu') render();
    else if (view === 'calendar') {
      const section = main.querySelector('#meal-section');
      if (section) section.outerHTML = renderMeals({state:repo.state,date:selectedDate,day:repo.state.days[selectedDate],catalog:recipeCatalog,error:recipeLoadError,editable:true});
      refreshPlanner();
    }
  }
}
function refreshPlanner() {
  const section=main.querySelector('#weekly-planner');
  if(section) section.outerHTML=renderWeeklyPlanner({state:repo.state,date:selectedDate,tab:plannerTab,catalog:recipeCatalog,error:recipeLoadError});
  revealSelectedDay();
}
function currentShopping() {
  const week=weekDates(selectedDate)[0];
  const preferences=repo.state.shoppingWeeks?.[week] || {checked:[],includeOptional:false};
  return {report:shoppingForWeek(repo.state,selectedDate,{includeOptional:preferences.includeOptional}),preferences};
}
function openMealPicker(date,slot) {
  if(!recipeCatalog || !discard()) return;
  selectedDate=date;plannerDateAutomatic=false;
  render();
  mealPicker={date,slot,recipeId:''};
  const dialog=document.querySelector('#meal-picker');
  dialog.innerHTML=renderMealPicker({date,slot,catalog:recipeCatalog});
  dialog.showModal();
  dialog.querySelector('#planner-search').focus();
}
function readSets(exercises, kind) {
  exercises.forEach((e, i) => {
    const sets = kind === 'result' ? e.results : e.sets;
    sets.forEach((set, j) => {
      for (const field of e.mode === 'cardio' ? ['minutes'] : ['kg', 'reps']) {
        const input = main.querySelector(`[name="${kind}-${i}-${j}-${field}"]`);
        if (input) {
          if (input.validity.badInput) throw Error('Inserisci un numero valido.');
          set[field] = numberOrNull(input.value, field);
        }
      }
    });
  });
}
function readDraft() {
  if (view === 'templates') {
    const draft = getTemplateDraft();
    draft.title = main.querySelector('#template-title').value;
    readSets(draft.exercises, 'target');
    return draft;
  }
  sessionDraft ??= clone(repo.state.days[selectedDate]?.sessions.find(s => s.id === activeSession));
  if (!sessionDraft) throw Error('Nessuna seduta selezionata.');
  readSets(sessionDraft.exercises, 'result');
  sessionDraft.durationMinutes = numberOrNull(main.querySelector('#session-duration').value, 'minutes');
  sessionDraft.status = main.querySelector('#session-status').value;
  sessionDraft.notes = main.querySelector('#session-notes').value;
  return sessionDraft;
}
function protectOtherForms(formId) {
  if ([...dirtyForms].some(id => id !== formId)) {
    if (!window.confirm('Altri moduli in questa pagina hanno modifiche non salvate. Proseguire e abbandonare quelle modifiche?')) return false;
    for (const id of [...dirtyForms]) if (id !== formId) dirtyForms.delete(id);
  }
  return true;
}
document.addEventListener('input', event => {
  const form = event.target.closest('form');
  if(form&&['calendar','menu'].includes(view)&&!['recipe-filter-form','recipe-scale-form'].includes(form.id)) plannerDateAutomatic=false;
  if (form && !['recipe-filter-form','recipe-scale-form'].includes(form.id)) { dirty = true; dirtyForms.add(form.id); }
  if(form?.id==='weekly-meal-form' && mealPicker?.recipeId && event.target.id!=='planner-search') {
    const recipe=recipeCatalog.recipes.find(r=>r.id===mealPicker.recipeId);
    const preview=document.querySelector('#portion-preview');
    if(preview) {try {preview.innerHTML=portionPreview(recipe,servingBasis(recipe).count,Number(form.querySelector('#planner-portions').value),readMetricFields(form,recipe));} catch {preview.textContent='Completa le misure con valori numerici validi.';}}
  }
  if(event.target.id==='planner-search') document.querySelector('#planner-results').innerHTML=pickerRecipeResults(recipeCatalog,event.target.value,mealPicker.recipeId,mealPicker.slot);
});
document.addEventListener('change', async event => {
  const target = event.target;
  if(target.name==='unit'&&target.form?.id==='pantry-stock-form') {
    const form=target.form,old=form.dataset.stockUnit||'g',next=target.value;
    const factors={g:1,kg:1000,ml:1,l:1000};
    if((['g','kg'].includes(old))===(['g','kg'].includes(next))) {
      for(const name of ['quantity','packSize']) if(form.elements[name].value.trim()) form.elements[name].value=Number((Number(form.elements[name].value)*factors[old]/factors[next]).toPrecision(12));
    } else {form.elements.quantity.value='';form.elements.packSize.value='';notify('Massa e volume sono diversi: indica la nuova quantità misurata.');}
    form.dataset.stockUnit=next;
    return;
  }
  if(target.dataset.shoppingIndex!==undefined || target.id==='include-shopping-optional') {
    if(!protectOtherForms('shopping')) {target.checked=!target.checked;return;}
    const {report,preferences}=currentShopping();
    const checked=new Set(preferences.checked);
    const index=Number(target.dataset.shoppingIndex);
    const isOptional=target.id==='include-shopping-optional';
    if(!isOptional) {
      const row=report.ingredients[index]; if(!row) return;
      if(target.checked) checked.add(row.signature); else checked.delete(row.signature);
    }
    const includeOptional=isOptional ? target.checked : preferences.includeOptional;
    const nextChecked=[...checked];
    const result=save(state=>{
      state.shoppingWeeks ??= {};
      state.shoppingWeeks[report.weekStart]={includeOptional,checked:nextChecked};
    },isOptional ? 'Lista aggiornata con la preferenza sui facoltativi.' : 'Spunta della lista salvata.');
    if(result) {
      const control=isOptional ? main.querySelector('#include-shopping-optional') : main.querySelector(`[data-shopping-index="${index}"]`);
      control?.focus({preventScroll:true});
    } else target.checked=!target.checked;
    return;
  }
  if (target.dataset.mealSelect) {
    const slot = target.dataset.mealSelect;
    const recipe = recipeCatalog?.recipes.find(r=>r.id===target.value);
    const batchYield=recipe?servingBasis(recipe).count:null;
    main.querySelector(`#meal-portions-${slot}`).value = batchYield ?? '';
    main.querySelector(`#meal-portions-${slot}`).readOnly = true;
    main.querySelector(`#meal-yield-${slot}`).textContent = batchYield!==null ? `Fonte: ${recipe.yield.quantity} ${recipe.yield.unit}. La divisione è automatica: una porzione per te. Per gli ospiti usa Preparo anche per altre persone.` : 'Indica quanti pasti ricavi da tutta la preparazione. Pezzi, strisce e polpette non equivalgono automaticamente a pasti; non viene assunto che il lotto sia per una persona.';
  }
  if (target.id === 'selected-date') {
    if (isDate(target.value) && discard()) { selectedDate = target.value; plannerDate=selectedDate; plannerDateAutomatic=false; activeSession = null; render(); }
    else target.value = selectedDate;
  }
  if (target.id === 'import-file' && target.files[0]) {
    try {
      if (target.files[0].size > 5_000_000) throw Error('File troppo grande (massimo 5 MB).');
      const raw = await target.files[0].text();
      pendingImport = { raw, state: parseBackup(raw) };
      render();
      notify('Backup valido. Controlla il riepilogo prima di ripristinare.');
    } catch (error) { pendingImport = null; render(); notify(`Importazione rifiutata. ${error.message}`, true); }
  }
});
document.addEventListener('submit', event => {
  event.preventDefault();
  if(event.target.id==='weekly-meal-form') {
    try {
      const recipe=recipeCatalog?.recipes.find(r=>r.id===mealPicker?.recipeId);
      if(!recipe || !recipeMatchesMeal(recipe,mealPicker.slot)) throw Error('Scegli una ricetta per questo pasto.');
      const portions=servingBasis(recipe).count;
      const people=validatePeople(Number(document.querySelector('#planner-portions').value));
      const metricOverrides=readMetricFields(event.target,recipe);
      const dates=[...event.target.querySelectorAll('input[name=dates]:checked')].map(input=>input.value);
      if(!dates.length) throw Error('Seleziona almeno un giorno.');
      const slot=mealPicker.slot; const targetDate=mealPicker.date;
      const saved=save(state=>planRecipeOnDates(state,recipe,slot,portions,dates,{people,metricOverrides}),`${dates.length} pasti salvati: una porzione per persona in ciascun giorno.`);
      if(saved) {
        document.querySelector('#meal-picker').close(); selectedDate=targetDate; render();
        main.querySelector(`[data-plan-date="${targetDate}"][data-plan-slot="${slot}"]`)?.focus({preventScroll:true});
      } else document.querySelector('#picker-error').textContent=document.querySelector('#notice').textContent;
    } catch(error) {document.querySelector('#picker-error').textContent=error.message;}
    return;
  }
  if (event.target.id === 'recipe-filter-form') {
    recipeQuery = main.querySelector('#recipe-search').value;
    recipeCategory = main.querySelector('#recipe-category').value;
    recipeMealSlot = main.querySelector('#recipe-meal').value;
    render(); return;
  }
  if (event.target.id === 'recipe-scale-form') {
    const value = Number(main.querySelector('#recipe-multiplier').value);
    if (!Number.isInteger(value) || value < 1 || value > 20) { notify('Indica da 1 a 20 porzioni.',true); return; }
    recipeMultiplier = value; render(); return;
  }
  if (!protectOtherForms(event.target.id)) return;
  try {
    if(event.target.id==='pantry-stock-form') {
      const form=event.target;
      const quantity=metricIngredient({quantity:Number(form.elements.quantity.value),unit:form.elements.unit.value});
      const pack=form.elements.packSize.value.trim()?metricIngredient({quantity:Number(form.elements.packSize.value),unit:form.elements.unit.value}).quantity:null;
      save(state=>setPantryStock(state,{label:form.elements.label.value,unit:quantity.unit,quantity:quantity.quantity,packSize:pack,preparationState:form.elements.preparationState.value}),'Scorta aggiornata. Menu e spesa ricalcolati.',{backup:true});return;
    }
    if(event.target.dataset.packageIndex!==undefined) {
      const row=currentShopping().report.ingredients[Number(event.target.dataset.packageIndex)];
      if(!row) throw Error('Voce della spesa non disponibile: ricarica la settimana.');
      const size=Number(event.target.elements.packSize.value);
      if(!Number.isFinite(size)||size<=0||size>1e9) throw Error('Indica il contenuto positivo di una confezione in g o ml.');
      if(event.submitter?.value==='purchase') {
        const count=Math.max(1,Math.ceil(row.shortage/size-1e-10));
        save(state=>purchasePack(state,row,size,count),`Acquisto registrato: ${count} confezioni aggiunte alla dispensa.`,{backup:true});
      } else save(state=>setPantryStock(state,{...row,quantity:pantryEntry(state,row)?.quantity||0,packSize:size}),'Formato salvato. Confezioni ricalcolate.');
      return;
    }
    if (event.target.dataset.mealSlot) {
      const recipe = recipeCatalog?.recipes.find(r=>r.id===event.target.elements.recipeId.value);
      if (!recipe || !recipeMatchesMeal(recipe,event.target.dataset.mealSlot)) throw Error('Scegli una ricetta disponibile per questo pasto.');
      const portions = servingBasis(recipe).count;
      const people=validatePeople(Number(event.target.elements.people.value));
      const previous=Object.values(repo.state.days).flatMap(day=>day.meals||[]).find(meal=>meal.snapshot.id===recipe.id&&meal.metricOverrides?.length&&JSON.stringify(meal.snapshot.ingredients)===JSON.stringify(recipe.ingredients));
      const meal = createMeal(recipe,event.target.dataset.mealSlot,portions,{people,metricOverrides:previous?.metricOverrides||[]});
      save(state=>{
        state.days[selectedDate] ??= {date:selectedDate,assignment:null,sessions:[],notes:''};
        state.days[selectedDate].meals ??= [];
        state.days[selectedDate].meals.push(meal);
      },'Una dose aggiunta al menu pianificato. Nessun consumo registrato.');
      return;
    }
    if (event.target.dataset.mealId) {
      const id = event.target.dataset.mealId;
      const portions = validateBatchPortions(Number(event.target.elements.batchPortions.value));
      const slot = event.target.elements.slot.value;
      const original=repo.state.days[selectedDate].meals.find(m=>m.id===id);
      if(cookedMovement(repo.state,id)) throw Error('Il pasto è già stato scaricato: annulla lo scarico prima di cambiarne dosi o ingredienti.');
      const people=validatePeople(Number(event.target.elements.people.value));
      const metricOverrides=readMetricFields(event.target,original.snapshot);
      const applyWeek=event.target.elements.applyWeekMeasures?.checked;
      save(state=>{
        const meal = state.days[selectedDate].meals.find(m=>m.id===id);
        meal.batchPortions = portions;
        meal.slot = slot;
        meal.people=people;
        meal.metricOverrides=metricOverrides;
        if(applyWeek) for(const date of weekDates(selectedDate)) for(const other of state.days[date]?.meals||[]) {
          if(other.snapshot.id===meal.snapshot.id&&JSON.stringify(other.snapshot.ingredients)===JSON.stringify(meal.snapshot.ingredients)) other.metricOverrides=clone(metricOverrides);
        }
      },'Pasto e misure aggiornati. Fonte originale conservata.',{backup:true});
      return;
    }
    switch (event.target.id) {
      case 'create-template-form': {
        const title = main.querySelector('#new-template-title').value;
        const base = main.querySelector('#new-template-base').value;
        const saved = save(state=>createTemplate(state,title,base),'Nuova scheda creata e salvata. Ora puoi personalizzarla.');
        if (saved) { selectedTemplate=saved.result; templateDraft=null; render(); }
        break;
      }
      case 'plan-form': {
        const choice = main.querySelector('#plan-choice').value;
        save(state => assign(state, selectedDate, choice), 'Piano salvato. Le sedute registrate restano invariate.'); break;
      }
      case 'move-form': {
        const destination = main.querySelector('#move-date').value;
        save(state => moveAssignment(state, selectedDate, destination), 'Piano spostato. I risultati restano nella data in cui li hai registrati.'); break;
      }
      case 'day-notes-form': {
        const notes = main.querySelector('#day-notes').value;
        save(state => { state.days[selectedDate] ??= { date: selectedDate, assignment: null, sessions: [], notes: '' }; state.days[selectedDate].notes = notes; }); break;
      }
      case 'template-form': {
        const template = clone(readDraft());
        template.title = main.querySelector('#template-title').value.trim();
        if (!template.title || template.title.length>160) throw Error('Nome scheda non valido.');
        if (repo.state.templates.some(t=>t.id!==template.id && t.title.trim().toLocaleLowerCase('it')===template.title.toLocaleLowerCase('it'))) throw Error('Esiste già una scheda con questo nome.');
        template.version++;
        save(state => { state.templates[state.templates.findIndex(t => t.id === template.id)] = template; }, 'Scheda salvata. Piani e target storici conservati.'); break;
      }
      case 'session-form': {
        const session = clone(readDraft());
        save(state => { const sessions = state.days[selectedDate].sessions; sessions[sessions.findIndex(s => s.id === session.id)] = session; }, 'Seduta salvata. Le correzioni aggiornano lo stesso record.'); break;
      }
    }
  } catch (error) { notify(error.message, true); }
});
document.addEventListener('click', event => {
  const button = event.target.closest('button, .brand');
  if (!button) return;
  try {
    if(button.dataset.planDate) {openMealPicker(button.dataset.planDate,button.dataset.planSlot);return;}
    if(button.dataset.pickRecipe) {
      const recipe=recipeCatalog.recipes.find(r=>r.id===button.dataset.pickRecipe);
      if(!recipe || !recipeMatchesMeal(recipe,mealPicker.slot)) return;
      mealPicker.recipeId=recipe.id;
      const dialog=document.querySelector('#meal-picker');
      dialog.querySelector('#picker-selection').hidden=false;
      const previous=Object.values(repo.state.days).flatMap(day=>day.meals||[]).find(meal=>meal.snapshot.id===recipe.id&&meal.metricOverrides?.length&&JSON.stringify(meal.snapshot.ingredients)===JSON.stringify(recipe.ingredients));
      dialog.querySelector('#picker-selection').innerHTML=pickerPortionSetup(recipe,previous?.metricOverrides||[]);
      dialog.querySelector('#save-weekly-meal').disabled=false;
      dialog.querySelectorAll('[data-pick-recipe]').forEach(b=>{b.classList.toggle('chosen',b.dataset.pickRecipe===recipe.id);b.setAttribute('aria-pressed',b.dataset.pickRecipe===recipe.id);});
      dialog.querySelector('#picker-error').textContent='';
      return;
    }
    if(button.dataset.editMenuDate) {
      if(!discard()) return;
      selectedDate=button.dataset.editMenuDate; plannerDateAutomatic=false; plannerTab='menu'; render();
      const form=main.querySelector(`#meal-form-${button.dataset.editMenuSlot}`);
      form?.closest('.meal-slot').scrollIntoView({block:'start',behavior:'instant'});
      if(button.dataset.mealId) {
        const edit=main.querySelector(`#meal-edit-${button.dataset.mealId}`);
        const detail=edit?.closest('details');if(detail) detail.open=true;
        const measures=edit?.querySelector('.metric-fields');if(measures) measures.open=true;
        edit?.scrollIntoView({block:'start',behavior:'instant'});
      }
      return;
    }
    if(button.dataset.plannerTab) {
      if(!discard()) return;
      plannerTab=button.dataset.plannerTab; render();
      main.querySelector('#weekly-planner')?.scrollIntoView({block:'start',behavior:'instant'});
      return;
    }
    if (button.dataset.view || button.classList.contains('brand')) {
      event.preventDefault();
      if (!discard()) return;
      view = button.dataset.view || 'today';
      if (button.dataset.openPlanner) plannerTab=button.dataset.openPlanner;
      if (['calendar','menu'].includes(view)) selectedDate=plannerDateAutomatic?suggestedPlanningDate():(plannerDate??suggestedPlanningDate());
      if (view === 'today') selectedDate = localDate();
      render(); main.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); return;
    }
    if (button.dataset.date) { if (discard()) { selectedDate = button.dataset.date; plannerDate=selectedDate; plannerDateAutomatic=false; activeSession = null; render(); } return; }
    if (button.dataset.template) { if (discard()) { selectedTemplate = button.dataset.template; render(); } return; }
    if (button.dataset.session) { if (discard()) { activeSession = button.dataset.session; render(); } return; }
    if (button.dataset.recipe) { selectedRecipe = button.dataset.recipe; recipeMultiplier = 1; render(); main.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); return; }
    if (button.dataset.mealRecipe) {
      if (!discard()) return;
      selectedRecipe = button.dataset.mealRecipe; recipeMultiplier = 1; view = 'recipes';
      render(); main.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); return;
    }
    if (button.dataset.backup) { download(storage.getItem(button.dataset.backup), `${button.dataset.backup}.json`); return; }
    if(button.dataset.stockRow!==undefined) {
      if(!discard()) return;
      const row=currentShopping().report.ingredients[Number(button.dataset.stockRow)];if(!row) return;
      const stock=pantryEntry(repo.state,row);plannerTab='pantry';render();
      const form=main.querySelector('#pantry-stock-form');
      form.elements.label.value=row.label;form.elements.unit.value=row.unit;form.elements.preparationState.value=row.preparationState;
      form.dataset.stockUnit=row.unit;
      form.elements.quantity.value=stock?.quantity||0;form.elements.packSize.value=stock?.packSize??row.packSize??'';
      form.scrollIntoView({block:'start',behavior:'instant'});form.elements.quantity.focus({preventScroll:true});return;
    }
    if(button.dataset.pantryEdit) {
      if(!discard()) return;
      const entry=repo.state.pantry?.find(item=>item.id===button.dataset.pantryEdit),form=main.querySelector('#pantry-stock-form');
      if(!entry||!form) return;
      for(const name of ['label','quantity','unit','preparationState','packSize']) form.elements[name].value=entry[name]??'';
      form.dataset.stockUnit=entry.unit;
      form.scrollIntoView({block:'start',behavior:'instant'});form.elements.quantity.focus({preventScroll:true});return;
    }
    if(button.dataset.pantryUndo) {
      if(!discard()||!window.confirm('Annullare questo movimento e aggiornare le scorte? La traccia resterà nello storico.')) return;
      save(state=>undoPantryMovement(state,button.dataset.pantryUndo),'Movimento annullato. Scorte e prenotazioni aggiornate.',{backup:true});return;
    }
    const action = button.dataset.action;
    if (!action) return;
    if(action==='cook-meal') {
      if(!discard()) return;
      const meal=repo.state.days[selectedDate]?.meals?.find(item=>item.id===button.dataset.mealId);
      if(!meal) throw Error('Pasto non disponibile.');
      const include=repo.state.shoppingWeeks?.[weekDates(selectedDate)[0]]?.includeOptional||false;
      const rows=mealShoppingRows(meal,selectedDate,include);
      const known=rows.filter(row=>!row.needsReview&&row.min===row.max),unknown=rows.filter(row=>!known.includes(row));
      const summary=known.map(row=>`${row.label}: ${row.max} ${row.unit}`).join('\n');
      if(!window.confirm(`Ho preparato ${meal.snapshot.title}.\n\nScarico dalla dispensa:\n${summary||'Nessun peso esatto disponibile.'}${unknown.length?`\n\nNon verranno scaricati perché senza quantità esatta: ${unknown.map(row=>row.label).join(', ')}.`:''}\n\nConfermare? L’operazione si può annullare dalla Dispensa.`)) return;
      save(state=>consumePantry(state,meal,rows),'Preparazione registrata. Scorte aggiornate; eventuali pesi incerti non sono stati scaricati.',{backup:true});return;
    }
    if(action==='correct-week-portions') {
      if(!discard()) return;
      const dates=weekDates(selectedDate);const issues=portionIssues(repo.state,dates);
      if(!issues.length) return;
      const preview=issues.map(issue=>`${issue.date} · ${issue.title}: da 1/${issue.before} a 1/${issue.after} della preparazione`).join('\n');
      if(!window.confirm(`${preview}\n\nCorreggere questi ${issues.length} pasti? Il numero di persone resta invariato. Prima del salvataggio sarà creata una copia di sicurezza.`)) return;
      save(state=>correctPortions(state,dates),'Porzioni corrette e spesa ricalcolata. Copia precedente disponibile in Profilo e dati.',{backup:true});return;
    }
    if(action==='dismiss-notice') {document.querySelector('#notice').replaceChildren();return;}
    if(action==='close-meal-picker') {document.querySelector('#meal-picker').close();return;}
    if(action==='copy-menu-week') {
      if(!discard()) return;
      const target=addDays(weekDates(selectedDate)[0],7);
      const saved=save(state=>copyMenuWeek(state,selectedDate,target),'Menu copiato soltanto nei pasti liberi della prossima settimana.');
      if(saved?.result) {selectedDate=target;plannerDateAutomatic=false;render();}
      else if(saved) notify('Nessuna aggiunta: i pasti della prossima settimana hanno già un menu.');
      return;
    }
    if(action==='download-shopping' || action==='copy-shopping') {
      const {report,preferences}=currentShopping(); const contents=shoppingText(report,preferences.checked);
      if(action==='download-shopping') download(contents,`coach-os-spesa-${report.weekStart}.txt`,'text/plain;charset=utf-8');
      else if(!navigator.clipboard) notify('La copia non è disponibile qui: usa Scarica lista .txt.',true);
      else navigator.clipboard.writeText(contents).then(()=>notify('Lista della spesa copiata.'),()=>notify('Copia non riuscita: usa Scarica lista .txt.',true));
      return;
    }
    if (action === 'remove-meal') {
      if (!discard() || !window.confirm('Rimuovere questa dose dal menu pianificato? Le altre ricette restano intatte.')) return;
      const id = button.dataset.mealId;
      save(state=>{ state.days[selectedDate].meals = state.days[selectedDate].meals.filter(m=>m.id!==id); },'Ricetta rimossa dal menu pianificato.');
      return;
    }
    if (action === 'focus-plan') {
      main.querySelector('#plan-choice')?.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
      main.querySelector('#plan-choice')?.focus({preventScroll:true}); return;
    }
    if (action === 'retry-recipes') {
      recipeLoadError = ''; fetchRecipes();
      if (view === 'recipes') render();
      else if (view === 'menu') render();
      else if (view === 'calendar') {
        main.querySelector('#meal-section').outerHTML = renderMeals({state:repo.state,date:selectedDate,day:repo.state.days[selectedDate],catalog:recipeCatalog,editable:true});
        refreshPlanner();
      }
      return;
    }
    if (action === 'recipe-back') { selectedRecipe = null; render(); return; }
    if (action === 'recipe-reset') { recipeQuery = ''; recipeCategory = ''; recipeMealSlot = ''; selectedRecipe = null; render(); return; }
    if (action === 'recipe-export') { download(JSON.stringify({...recipeCatalog,normalization:'single-portion',recipes:recipeCatalog.recipes.map(singleServingRecipe)},null,2),'coach-os-ricettario.json'); return; }
    if (['today', 'week-prev', 'week-next', 'month-prev', 'month-next'].includes(action)) {
      if (!discard()) return;
      if (action === 'today') {
        if(['calendar','menu'].includes(view)) {selectedDate=suggestedPlanningDate();plannerDateAutomatic=true;}
        else selectedDate=localDate();
      }
      else if (action.startsWith('week')) {selectedDate = addDays(selectedDate, action.endsWith('prev') ? -7 : 7);plannerDateAutomatic=false;}
      else { const d = dateObject(selectedDate); d.setDate(1); d.setMonth(d.getMonth() + (action.endsWith('prev') ? -1 : 1)); const next = localDate(d); if (!isDate(next)) throw Error('Limite calendario: 1900–2199.'); selectedDate = next; plannerDateAutomatic=false; }
      if(action!=='today'||['calendar','menu'].includes(view)) plannerDate=selectedDate;
      activeSession = null; render(); return;
    }
    if (action === 'export') { download(repo.export(), `coach-os-${localDate()}.json`); return; }
    if (action === 'export-raw') { download(repo.raw, `coach-os-originale-${localDate()}.json`); return; }
    if (action === 'export-legacy') { download(storage.getItem('coach_v21'), `coach-v21-originale-${localDate()}.json`); return; }
    if (action === 'cancel-import') { pendingImport = null; render(); return; }
    if (action === 'restore') {
      const key = repo.restore(pendingImport.raw);
      pendingImport = null; selectedTemplate = repo.state.templates[0]?.id; activeSession = null; sessionDraft = null; templateDraft = null; dirty = false;
      render(); notify(`Archivio ripristinato.${key ? ' Copia precedente disponibile qui sotto.' : ''}`); return;
    }
    if (action === 'add-exercise') {
      const formId = view === 'templates' ? 'template-form' : 'session-form';
      if (!protectOtherForms(formId)) return;
      const name = main.querySelector('#exercise-name').value;
      const mode = main.querySelector('#exercise-mode').value;
      const equipment = main.querySelector('#exercise-equipment').value;
      const exercise = newExercise(name, mode, equipment);
      const draft = readDraft();
      if (view !== 'templates') exercise.results = [{ kg: null, reps: null, minutes: null }];
      draft.exercises.push(exercise); dirty = true; dirtyForms.add(formId); render();
      notify('Esercizio aggiunto al modulo. Premi Salva per conservarlo.'); return;
    }
    if (['add-set', 'remove-set', 'remove-exercise'].includes(action)) {
      const formId = view === 'templates' ? 'template-form' : 'session-form';
      if (!protectOtherForms(formId)) return;
      const draft = readDraft(); const index = Number(button.dataset.index); const exercise = draft.exercises[index];
      if (action === 'add-set') {
        if (exercise.sets.length >= 30) throw Error('Massimo 30 serie per esercizio.');
        exercise.sets.push({ kg: null, reps: null, minutes: null });
        exercise.results?.push({ kg: null, reps: null, minutes: null });
      } else if (action === 'remove-set') exercise.sets.pop();
      else if (window.confirm('Rimuovere questo esercizio dalla scheda corrente? Le sedute salvate resteranno intatte.')) draft.exercises.splice(index, 1);
      dirty = true; dirtyForms.add(formId); render(); return;
    }
    if (!discard()) return;
    if (action === 'standard') save(state => applyStandardWeek(state, selectedDate), 'Settimana standard applicata alle date libere.');
    if (action === 'skip-plan') save(state => { state.days[selectedDate].assignment.status = 'skipped'; }, 'Piano segnato come saltato. Nessun risultato modificato.');
    if (action === 'start-session') {
      const saved = save(state => startSession(state, selectedDate), 'Seduta avviata e salvata in bozza.');
      if (saved) { activeSession = saved.result; render(); }
    }
  } catch (error) { notify(error.message, true); }
});
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
document.querySelector('#meal-picker').addEventListener('close',()=>{
  mealPicker=null; dirtyForms.delete('weekly-meal-form'); dirty=dirtyForms.size>0;
  revealSelectedDay();
});
window.addEventListener('focus',schedulePlanningDateCheck);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedulePlanningDateCheck();});
schedulePlanningDateCheck();
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY || event.key === null) notify('Archivio modificato da un’altra scheda. Copia eventuali campi non salvati, poi ricarica prima di salvare.', true);
});
document.querySelectorAll('nav [data-view]').forEach(button => {
  button.querySelector('.nav-icon').innerHTML = icon(({today:'home',calendar:'calendar',menu:'cart',templates:'dumbbell',recipes:'book',data:'data'})[button.dataset.view]);
  button.title = button.getAttribute('aria-label');
});
document.querySelector('.privacy-icon').innerHTML = icon('shield');
document.querySelector('#topbar-date').textContent = formatDate(localDate(),{day:'numeric',month:'short',year:'numeric'});
render();
if (repo.error) notify(repo.error + ' Apri Profilo e dati per scaricare l’originale o ripristinare un backup valido.', true);
