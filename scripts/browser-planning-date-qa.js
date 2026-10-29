// Data e orologio controllati, contesti isolati e nessun diario reale.
async(page)=>{
  const checks=[],errors=[],check=(v,s)=>{if(!v)throw Error(s);checks.push(s);};
  const c=await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Berlin'});
  const p=await c.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
  const selected=()=>p.locator('#selected-date').inputValue();
  const visibleDay=()=>p.locator('.weekly-menu-day.selected').evaluate(day=>{const a=day.getBoundingClientRect(),g=day.parentElement.getBoundingClientRect();return a.left>=g.left-1&&a.right<=g.right+1;});
  try {
    await p.clock.install({time:new Date('2026-10-30T20:59:00+01:00')});
    await p.goto('http://127.0.0.1:5173');await p.locator('nav [data-view=menu]').tap();
    await p.locator('[data-plan-date]:not([disabled])').first().waitFor();
    check(await selected()==='2026-10-30','Alle 20:59 il planner propone oggi');
    check(await visibleDay(),'Venerdì visibile senza scorrere dal lunedì');
    await p.clock.runFor(60000);
    check(await selected()==='2026-10-31','Passaggio alle 21 propone domani se non si sta modificando');
    check(await visibleDay(),'Sabato proposto viene portato in vista');
    await p.locator('#selected-date').fill('2026-11-04');
    await p.locator('[data-plan-date="2026-11-04"][data-plan-slot=lunch]').tap();
    await p.locator('[data-pick-recipe=pasta-fredda-pollo]').tap();
    await p.locator('#weekly-meal-form input[value="2026-11-02"]').check();
    await p.locator('#save-weekly-meal').tap();
    check(await selected()==='2026-11-04','Aggiunta su lunedì e mercoledì conserva il mercoledì di partenza');
    check(await visibleDay(),'Dopo il salvataggio il giorno di partenza resta in vista');
    check(await p.evaluate(()=>JSON.parse(localStorage.getItem('coach_os_v1')).days['2026-11-02'].meals.length===1),'Lunedì aggiuntivo salvato senza diventare il giorno selezionato');
    await p.locator('[data-plan-date="2026-11-04"][data-plan-slot=dinner]').tap();
    await p.getByRole('button',{name:'Chiudi scelta ricetta',exact:true}).tap();
    check(await selected()==='2026-11-04'&&await visibleDay(),'Annullamento conserva giorno e scorrimento');
    await p.locator('nav [data-view=today]').tap();
    check(await selected()==='2026-10-30','Oggi continua a mostrare la data civile reale dopo le 21');
    await p.locator('nav [data-view=calendar]').tap();
    check(await selected()==='2026-11-04'&&await visibleDay(),'Ritorno da Oggi al calendario conserva la data scelta');
    await p.locator('[data-planner-tab=shopping]').first().tap();await p.locator('[data-planner-tab=menu]').first().tap();
    check(await selected()==='2026-11-04'&&await visibleDay(),'Ritorno dalla spesa conserva il giorno e la posizione');
    await p.clock.runFor(60000);check(await selected()==='2026-11-04','Orologio non sovrascrive la scelta manuale');
    await p.locator('[data-action=today]').tap();check(await selected()==='2026-10-31','Giorno proposto ripristina domani dopo le 21');
    await p.clock.setFixedTime(new Date('2026-11-01T21:00:00+01:00'));await p.evaluate(()=>window.dispatchEvent(new Event('focus')));
    check(await selected()==='2026-11-02','Domenica sera apre lunedì della settimana successiva');
    check(await p.locator('[data-plan-date="2026-11-02"]').count()===3,'Cambio settimana allineato alla data proposta');
    await p.locator('[data-plan-date="2026-11-02"][data-plan-slot=breakfast]').tap();
    await p.clock.setFixedTime(new Date('2026-11-02T21:01:00+01:00'));await p.evaluate(()=>window.dispatchEvent(new Event('focus')));
    check(await selected()==='2026-11-02','Selettore aperto protetto dal cambio automatico');
    await p.getByRole('button',{name:'Chiudi scelta ricetta',exact:true}).tap();
    check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Layout mobile senza overflow');
    check(errors.length===0,`Nessun errore JavaScript: ${errors.join('; ')}`);
    return {passed:checks.length,checks,errors};
  } finally {await c.close();}
}
