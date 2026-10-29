// Tutti i giorni accessibili anche quando la griglia parte dal venerdì.
async(page)=>{
  const checks=[],errors=[],check=(v,label)=>{if(!v)throw Error(label);checks.push(label);};
  for(const width of [320,390,768,1440]) {
    const c=await page.context().browser().newContext({viewport:{width,height:1000},timezoneId:'Europe/Berlin'});
    const p=await c.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
    try {
      await p.clock.install({time:new Date('2026-10-30T12:00:00+01:00')});
      await p.goto('http://127.0.0.1:5173');
      await p.evaluate(async()=>{
        const {freshState,weekDates}=await import('/src/domain.js');const {planRecipeOnDates}=await import('/src/planner.js');const {Repository}=await import('/src/storage.js');
        const catalog=await(await fetch('/data/recipes.json')).json();const s=freshState();
        planRecipeOnDates(s,catalog.recipes.find(r=>r.id==='pasta-fredda-pollo'),'lunch',2,weekDates('2026-10-30'));
        new Repository(localStorage).commit(s);
      });
      await p.reload();await p.locator('nav [data-view=menu]').click();await p.locator('.planner-days').waitFor();
      const raw=await p.evaluate(()=>localStorage.getItem('coach_os_v1'));
      check(await p.locator('#selected-date').inputValue()==='2026-10-30',`Ingresso dal venerdì ${width}px`);
      check(await p.locator('.planner-days button').count()===7,`Tutti i sette giorni disponibili ${width}px`);
      await p.locator('.planner-days').scrollIntoViewIfNeeded();
      check(await p.locator('.planner-days button').evaluateAll(elements=>elements.every(e=>{const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth+1&&b.width>=44&&b.height>=44;})),`Giorni visibili senza scorrimento orizzontale e comodi da toccare ${width}px`);
      check((await p.locator('.planner-days small').allTextContents()).every(text=>text==='1 ricetta'),`Conteggi dei pasti salvati per giorno ${width}px`);
      for(const date of ['2026-10-26','2026-10-28','2026-10-30','2026-11-01']) {
        await p.locator(`.planner-days [data-date="${date}"]`).click();
        check(await p.locator('#selected-date').inputValue()===date&&await p.locator(`.weekly-menu-day.selected [data-date="${date}"]`).count()===1,`Apre ${date} dal selettore ${width}px`);
        check(await p.locator(`.weekly-dish[data-edit-menu-date="${date}"]`).count()===1,`Ricetta del giorno presente ${date} ${width}px`);
      }
      check(await p.evaluate(()=>localStorage.getItem('coach_os_v1'))===raw,`Navigazione non modifica né cancella il menu ${width}px`);
      check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Nessun overflow della pagina ${width}px`);
      if(width===390) {await p.locator('.planner-days').scrollIntoViewIfNeeded();await p.screenshot({path:'C:/Users/francesco.sommella/Progetti VS/CoachOS_Codex/test-results/all-week-days-mobile.png'});}
    } finally {await c.close();}
  }
  check(errors.length===0,`Nessun errore JavaScript: ${errors.join('; ')}`);
  return {passed:checks.length,checks,errors};
}
