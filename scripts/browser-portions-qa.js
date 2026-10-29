// Riproduzione isolata del menu segnalato e della correzione con backup.
async(page)=>{
  const context=await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Berlin'});
  const p=await context.newPage();p.setDefaultTimeout(10000);
  const checks=[],errors=[],check=(v,label)=>{if(!v)throw Error(label);checks.push(label);};
  p.on('pageerror',e=>errors.push(e.message));
  const state=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('coach_os_v1')));
  const shopping=()=>p.locator('[data-planner-tab=shopping]').first().click();
  try {
    await p.goto('http://127.0.0.1:5173');
    await p.evaluate(async()=>{
      const {freshState}=await import('/src/domain.js');const {planRecipeOnDates}=await import('/src/planner.js');
      const {Repository}=await import('/src/storage.js');const catalog=await(await fetch('/data/recipes.json')).json();
      const r=id=>catalog.recipes.find(r=>r.id===id);const s=freshState();
      planRecipeOnDates(s,r('burrito-manzo'),'lunch',1,['2026-11-02']);
      planRecipeOnDates(s,r('burrito-chipotle'),'dinner',1,['2026-11-02']);
      planRecipeOnDates(s,r('burrito-manzo'),'lunch',10,['2026-11-03']);
      planRecipeOnDates(s,r('burrito-manzo'),'dinner',10,['2026-11-03']);
      new Repository(localStorage).commit(s);
    });
    await p.reload();await p.locator('nav [data-view=menu]').tap();await p.locator('#meal-form-lunch').waitFor();await p.locator('#selected-date').fill('2026-11-02');await shopping();
    const beef=()=>p.locator('.shopping-row').filter({has:p.getByRole('checkbox',{name:'Segna Macinato magro di manzo 96/4 come acquistato',exact:true})});
    check((await beef().locator('b').textContent())==='2040 g','Riprodotti 2040 g di manzo');
    check(await p.locator('.portion-review').isVisible(),'Segnalazione divisioni discordanti visibile');
    const raw=await p.evaluate(()=>localStorage.getItem('coach_os_v1'));
    p.once('dialog',d=>d.dismiss());await p.locator('[data-action=correct-week-portions]').tap();
    check(await p.evaluate(()=>localStorage.getItem('coach_os_v1'))===raw,'Annullamento correzione conserva il menu');
    p.once('dialog',d=>d.accept());await p.locator('[data-action=correct-week-portions]').tap();
    check((await beef().locator('b').textContent())==='510 g','Correzione di due pasti porta il manzo a 510 g');
    check(await p.evaluate(raw=>Object.keys(localStorage).some(k=>k.startsWith('coach_os_backup_')&&localStorage.getItem(k)===raw),raw),'Backup esatto prima della correzione');
    check(await p.locator('.portion-review').count()===0,'Avviso sparisce dopo correzione');
    const tortilla=p.locator('.shopping-row').filter({has:p.getByRole('checkbox',{name:'Segna Tortilla a calorie ridotte come acquistato',exact:true})});
    check((await tortilla.locator('b').textContent()).includes('da confermare'),'Tortilla senza peso non mostrate come 16 pezzi');
    check(await p.locator('.shopping-uncertain').getAttribute('open')!==null,'Misure mancanti visibili senza aprire sezioni');
    await tortilla.getByRole('button',{name:'Conferma peso o volume',exact:true}).tap();
    const edit=p.locator('.meal-edit-form').first();
    check(await edit.locator('.metric-fields').getAttribute('open')!==null,'Accesso dalla spesa apre la misura del pasto');
    // Dato sintetico di test: dieci tortilla pesate complessivamente 450 g.
    const metric=edit.locator('[data-metric-index]').filter({has:p.getByText('Tortilla a calorie ridotte',{exact:true})});
    await metric.locator('input').fill('450');await edit.locator('[name=applyWeekMeasures]').check();
    await edit.getByRole('button',{name:'Aggiorna dose',exact:true}).tap();await shopping();
    check((await tortilla.locator('b').allTextContents()).join(' · ').includes('135 g')&&(await tortilla.locator('b').allTextContents()).some(text=>text.includes('da confermare')),'Peso misurato applicato ai tre burrito di manzo, chipotle resta da confermare');
    const s=await state();check(s.days['2026-11-03'].meals.every(m=>m.metricOverrides?.some(e=>e.quantity===450)),'Pesi propagati solo alle occorrenze confermate della ricetta');
    await p.locator('[data-planner-tab=menu]').first().tap();
    await p.locator('[data-plan-date="2026-11-04"][data-plan-slot=lunch]').tap();await p.locator('[data-pick-recipe=burrito-manzo]').tap();
    check(await p.locator('#planner-portions').inputValue()==='10'&&await p.locator('#planner-portions').getAttribute('readonly')!==null,'Divisione nota bloccata a dieci, distinta dalle persone');
    check(await p.locator('#planner-people').inputValue()==='1','Una persona proposta per default');
    await p.locator('.portion-preview summary').tap();
    check((await p.locator('#portion-preview').textContent()).includes('170 g'),'Anteprima esplicita di 170 g di manzo per il pasto');
    check((await p.locator('#portion-preview').textContent()).includes('45 g'),'Misura confermata riutilizzata nella nuova scelta');
    await p.locator('#meal-picker .people-choice summary').tap();await p.locator('#planner-people').fill('2');
    check((await p.locator('#portion-preview').textContent()).includes('340 g'),'Ospite esplicito aggiorna anteprima a due porzioni');
    await p.locator('#save-weekly-meal').tap();
    check((await state()).days['2026-11-04'].meals[0].people===2,'Ospite salvato separatamente dalla divisione');
    await shopping();check((await beef().locator('b').textContent())==='850 g','Spesa include le due porzioni aggiunte una sola volta');
    await p.reload();await p.locator('nav [data-view=menu]').tap();await p.locator('#selected-date').fill('2026-11-02');await shopping();
    check((await beef().locator('b').textContent())==='850 g','Correzioni e misure persistono dopo ricarica');
    check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Nuova spesa senza overflow mobile');
    await p.screenshot({path:'C:/Users/francesco.sommella/Progetti VS/CoachOS_Codex/test-results/portions-shopping-mobile.png'});
    check(errors.length===0,`Nessun errore JavaScript: ${errors.join('; ')}`);
    return {passed:checks.length,checks,errors};
  } finally {await context.close();}
}
