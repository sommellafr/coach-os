// Smartphone in contesti isolati: nessun accesso al diario dell'utente.
async (page) => {
  const checks=[], errors=[];
  const check=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
  for(const [width,height] of [[320,740],[360,800],[390,844],[430,932],[844,390]]) {
    const context=await page.context().browser().newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2,timezoneId:'Europe/Berlin'});
    const p=await context.newPage();p.setDefaultTimeout(10000);
    p.on('pageerror',error=>errors.push(error.message));
    const fits=()=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
    const size=async(selector)=>p.locator(selector).evaluateAll(elements=>elements.every(el=>{const box=el.getBoundingClientRect();return box.width>=43.9&&box.height>=43.9;}));
    const tag=`${width}x${height}`;
    try {
      await p.goto('http://127.0.0.1:5173');
      check(await fits(),`Oggi senza overflow ${tag}`);
      check(await size('nav button'),`Sei destinazioni tattili >=44px ${tag}`);
      check(await p.locator('nav .nav-text').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=10),`Navigazione leggibile ${tag}`);
      check(await p.locator('nav .nav-short').evaluateAll(elements=>elements.every(el=>parseFloat(getComputedStyle(el).fontSize)<=12&&el.getBoundingClientRect().width<=el.closest('button').getBoundingClientRect().width)),`Etichette brevi dentro il pulsante ${tag}`);
      check(await p.locator('.sidebar').evaluate(el=>getComputedStyle(el).bottom!=='auto'&&el.getBoundingClientRect().width>200),`Navigazione inferiore anche in orizzontale ${tag}`);
      await p.getByRole('button',{name:'Scegli i pasti',exact:true}).tap();
      await p.locator('[data-plan-date]:not([disabled])').first().waitFor();
      await p.locator('#selected-date').fill('2026-11-02');
      check(await fits(),`Menu senza overflow della pagina ${tag}`);
      check(await size('.weekly-add,.planner-heading .icon-button,.planner-tabs>button'),`Controlli pasti e settimana >=44px ${tag}`);
      check(await p.locator('#selected-date').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16),`Data a 16px per evitare zoom automatico ${tag}`);
      check(await p.locator('#selected-date').evaluate(el=>el.getBoundingClientRect().width>=180),`Data completa senza campo compresso ${tag}`);
      const last=p.locator('[data-plan-date="2026-11-08"][data-plan-slot=breakfast]');
      await last.scrollIntoViewIfNeeded();await last.tap();
      check(await p.locator('#meal-picker').isVisible(),`Ultimo giorno raggiungibile con scorrimento ${tag}`);
      check(await p.locator('#meal-picker').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`Selettore senza overflow orizzontale ${tag}`);
      await p.locator('#planner-search').fill('avena');
      await p.locator('[data-pick-recipe=bicchierini-avena]').tap();
      check(await size('.picker-dates label,#save-weekly-meal'),`Giorni e conferma >=44px ${tag}`);
      await p.locator('#save-weekly-meal').scrollIntoViewIfNeeded();await p.locator('#save-weekly-meal').tap();
      check(!await p.locator('#meal-picker').isVisible(),`Salvataggio con touch anche in orizzontale ${tag}`);
      await p.locator('[data-planner-tab=shopping]').first().tap();
      check(await fits(),`Spesa senza overflow ${tag}`);
      check(await p.locator('.shopping-row').count()>0,`Ingredienti visibili con touch ${tag}`);
      await p.locator('[data-planner-tab=pantry]').first().tap();
      check(await fits(),`Dispensa senza overflow ${tag}`);
      check(await p.locator('#pantry-stock-form').isVisible(),`Scorte registrabili da smartphone ${tag}`);
      await p.locator('nav [data-view=recipes]').tap();
      check(await fits(),`Ricettario senza overflow ${tag}`);
      await p.locator('#recipe-meal').selectOption('breakfast');await p.getByRole('button',{name:'Filtra ricette',exact:true}).tap();
      check(await p.locator('.recipe-card').count()===7,`Filtro colazione utilizzabile ${tag}`);
      for(const view of ['calendar','templates','data']) {
        await p.locator(`nav [data-view=${view}]`).tap();
        check(await fits(),`${view} senza overflow ${tag}`);
      }
      await p.locator('nav [data-view=menu]').tap();
      await p.screenshot({path:`C:/Users/francesco.sommella/Progetti VS/CoachOS_Codex/test-results/mobile-${tag}.png`});
    } finally {await context.close();}
  }
  check(errors.length===0,`Nessun errore JavaScript: ${errors.join('; ')}`);
  return {passed:checks.length,checks,errors};
}
