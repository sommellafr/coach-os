// Eseguibile con browser_run_code_unsafe (filename assoluto). Usa un contesto
// isolato e lo chiude al termine: non legge né cancella dati del profilo utente.
async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Europe/Berlin' });
  const p = await context.newPage();
  const errors = [];
  p.on('pageerror', error => errors.push(error.message));
  p.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const checks = [];
  const check = (condition, label) => { if (!condition) throw Error(label); checks.push(label); };
  const raw = () => p.evaluate(() => localStorage.getItem('coach_os_v1'));
  const state = async () => JSON.parse(await raw());
  const goDate = date => p.locator('#selected-date').fill(date);
  const fillResults = async (kg, reps = 10) => {
    await p.getByRole('spinbutton', { name: 'Panca Piana, serie 1, risultato kg', exact: true }).fill(String(kg));
    await p.getByRole('spinbutton', { name: 'Panca Piana, serie 1, risultato rip.', exact: true }).fill(String(reps));
  };
  try {
    await p.goto('http://127.0.0.1:5173');
    await p.getByRole('heading', { name: 'Un giorno alla volta.' }).waitFor();
    check(await p.locator('#selected-date').inputValue() === '2026-10-29', 'Data odierna locale');
    await p.getByRole('button', { name: 'Le mie schede', exact: true }).click();
    await p.getByRole('spinbutton', { name: 'Panca Piana, serie 1, target kg', exact: true }).fill('40');
    await p.getByRole('spinbutton', { name: 'Panca Piana, serie 1, target rip.', exact: true }).fill('10');
    await p.getByRole('button', { name: 'Salva scheda', exact: true }).click();
    check((await state()).templates[0].exercises[0].sets[0].kg === 40, 'Template configurato e persistito');
    await p.getByRole('button', { name: 'Calendario', exact: true }).click();
    for (const [date, kg] of [['2026-10-19', 39], ['2026-10-26', 42]]) {
      await goDate(date);
      await p.locator('#plan-choice').selectOption('template-1');
      await p.getByRole('button', { name: 'Salva piano', exact: true }).click();
      await p.getByRole('button', { name: 'Inizia seduta', exact: true }).click();
      await fillResults(kg);
      await p.locator('#session-status').selectOption('completed');
      await p.getByRole('button', { name: 'Salva seduta', exact: true }).click();
    }
    await p.reload();
    await goDate('2026-10-19');
    check(await p.getByRole('spinbutton', { name: 'Panca Piana, serie 1, risultato kg', exact: true }).inputValue() === '39', 'Primo lunedì conservato dopo reload');
    await goDate('2026-10-26');
    check(await p.getByRole('spinbutton', { name: 'Panca Piana, serie 1, risultato kg', exact: true }).inputValue() === '42', 'Secondo lunedì indipendente');
    await goDate('2026-10-19');
    const originalId = (await state()).days['2026-10-19'].sessions[0].id;
    await fillResults(40);
    await p.getByRole('button', { name: 'Salva seduta', exact: true }).click();
    check((await state()).days['2026-10-19'].sessions.length === 1 && (await state()).days['2026-10-19'].sessions[0].id === originalId, 'Correzione senza duplicazione');
    await p.locator('#move-date').fill('2026-10-20');
    await p.getByRole('button', { name: 'Sposta', exact: true }).click();
    check((await state()).days['2026-10-19'].assignment === null && (await state()).days['2026-10-19'].sessions[0].exercises[0].results[0].kg === 40 && (await state()).days['2026-10-20'].assignment.template.id === 'template-1', 'Spostamento del solo piano');
    await p.getByRole('button', { name: 'Le mie schede', exact: true }).click();
    await p.getByRole('spinbutton', { name: 'Panca Piana, serie 1, target kg', exact: true }).fill('80');
    await p.getByRole('button', { name: 'Salva scheda', exact: true }).click();
    check((await state()).days['2026-10-19'].sessions[0].exercises[0].sets[0].kg === 40 && (await state()).days['2026-10-20'].assignment.template.exercises[0].sets[0].kg === 40, 'Modifica scheda preserva target e piano storico');
    await p.getByRole('button', { name: 'Oggi', exact: true }).first().click();
    await goDate('2026-10-19');
    await p.locator('#day-notes').fill('Nota da conservare');
    await fillResults(41);
    p.once('dialog', dialog => dialog.dismiss());
    await p.getByRole('button', { name: 'Salva seduta', exact: true }).click();
    check(await p.locator('#day-notes').inputValue() === 'Nota da conservare' && (await state()).days['2026-10-19'].sessions[0].exercises[0].results[0].kg === 40, 'Protezione modifiche in altri moduli: annullamento');
    p.once('dialog', dialog => dialog.accept());
    await p.getByRole('button', { name: 'Salva seduta', exact: true }).click();
    check((await state()).days['2026-10-19'].sessions[0].exercises[0].results[0].kg === 41, 'Salvataggio dopo conferma abbandono altri moduli');
    // Fallimento storage simulato solo in questo contesto di test.
    await p.evaluate(() => { window.qaSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function() { throw new DOMException('Quota test', 'QuotaExceededError'); }; });
    const beforeQuota = await raw();
    await fillResults(45);
    await p.getByRole('button', { name: 'Salva seduta', exact: true }).click();
    check((await p.locator('#notice').textContent()).includes('Salvataggio non riuscito') && await raw() === beforeQuota && await p.getByRole('spinbutton', { name: 'Panca Piana, serie 1, risultato kg', exact: true }).inputValue() === '45', 'Quota esaurita: errore visibile, archivio intatto e modulo recuperabile');
    await p.evaluate(() => { Storage.prototype.setItem = window.qaSetItem; delete window.qaSetItem; });
    await p.getByRole('button', { name: 'Salva seduta', exact: true }).click();
    await p.getByRole('button', { name: 'Profilo e dati', exact: true }).click();
    const backup = await raw();
    const beforeMalformed = await raw();
    await p.locator('#import-file').setInputFiles({ name: 'malformato.json', mimeType: 'application/json', buffer: Buffer.from('{oops') });
    check((await p.locator('#notice').textContent()).includes('Importazione rifiutata') && await raw() === beforeMalformed, 'Import malformato non distruttivo');
    await p.locator('#import-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
    await p.getByRole('button', { name: 'Crea copia e ripristina', exact: true }).click();
    check(JSON.stringify((await state()).days) === JSON.stringify(JSON.parse(backup).days), 'Ripristino via interfaccia equivalente');
    check(await p.evaluate(() => Object.keys(localStorage).some(k => k.startsWith('coach_os_backup_') && localStorage.getItem(k).includes('2026-10-19'))), 'Copia automatica del contenuto precedente');
    const downloadPromise = p.waitForEvent('download');
    await p.getByRole('button', { name: 'Esporta backup JSON', exact: true }).click();
    const download = await downloadPromise;
    check(download.suggestedFilename() === 'coach-os-2026-10-29.json', 'Download backup JSON');
    await download.delete();
    // Cardio usa i minuti e non ripetizioni.
    await p.getByRole('button', { name: 'Le mie schede', exact: true }).click();
    await p.getByRole('button', { name: 'Cardio 1', exact: true }).click();
    await p.locator('#exercise-name').fill('Cyclette');
    await p.locator('#exercise-mode').selectOption('cardio');
    await p.getByRole('button', { name: '+ Aggiungi al modulo', exact: true }).click();
    await p.getByRole('spinbutton', { name: 'Cyclette, serie 1, target min', exact: true }).fill('20');
    await p.getByRole('button', { name: 'Salva scheda', exact: true }).click();
    check((await state()).templates[3].exercises.find(e=>e.name==='Cyclette').sets[0].minutes === 20 && (await state()).templates[3].exercises.find(e=>e.name==='Cyclette').sets[0].reps === null, 'Cardio in minuti');
    await p.getByRole('button', { name: 'Calendario', exact: true }).click();
    await goDate('2026-12-31');
    await p.locator('.monthly-disclosure > summary').click();
    await p.getByRole('button', { name: 'Mese successivo', exact: true }).click();
    check(await p.locator('#selected-date').inputValue() === '2027-01-01', 'Navigazione cambio anno nel browser');
    await goDate('2199-12-31');
    check(await p.locator('#main h1').textContent() === 'Il tuo calendario.', 'Limite superiore calendario senza crash');
    await goDate('2026-10-19');
    await p.setViewportSize({ width: 390, height: 844 });
    check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile 390px senza overflow della pagina');
    check(await p.evaluate(() => [...document.querySelectorAll('input,select,textarea')].every(el => el.labels?.length || el.getAttribute('aria-label'))), 'Campi del diario con etichetta accessibile');
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.screenshot({ path: 'C:/Users/francesco.sommella/Progetti VS/CoachOS_Codex/test-results/mobile.png', fullPage: true });
    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.getByRole('button', { name: 'Oggi', exact: true }).first().click();
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.screenshot({ path: 'C:/Users/francesco.sommella/Progetti VS/CoachOS_Codex/test-results/desktop.png', fullPage: true });
    check(errors.length === 0, `Nessun errore JavaScript o console: ${errors.join('; ')}`);
    return { passed: checks.length, checks, errors };
  } finally { await context.close(); }
}
