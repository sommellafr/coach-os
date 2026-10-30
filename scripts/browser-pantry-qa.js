// Prove isolate con confezioni/pesi sintetici: nessun dato dell'utente.
async(page)=>{
  const c=await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Berlin'});
  const p=await c.newPage();p.setDefaultTimeout(10000);
  const checks=[],errors=[],check=(v,label)=>{if(!v)throw Error(label);checks.push(label);};p.on('pageerror',e=>errors.push(e.message));
  const state=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('coach_os_v1')));
  const tab=name=>p.locator(`.planner-tabs [data-planner-tab=${name}]`).tap();
  const flourRow=()=>p.locator('.shopping-row').filter({has:p.getByRole('heading',{name:'Farina',exact:true})});
  const stockForm=()=>p.locator('#pantry-stock-form');
  const currentStock=async()=>(await state()).pantry.find(e=>e.label==='Farina').quantity;
  try {
    await p.clock.install({time:new Date('2026-10-30T12:00:00+01:00')});await p.goto('http://127.0.0.1:5173');
    await p.locator('nav [data-view=menu]').tap();await p.locator('[data-plan-date]:not([disabled])').first().waitFor();await p.locator('#selected-date').fill('2026-11-02');
    await p.locator('[data-plan-date="2026-11-02"][data-plan-slot=lunch]').tap();await p.locator('[data-pick-recipe=burrito-manzo]').tap();
    check(await p.locator('#planner-portions').inputValue()==='1'&&await p.locator('#planner-portions').getAttribute('readonly')===null,'Burrito: si sceglie una porzione, non dieci');
    check(await p.locator('#planner-people').count()===0,'Nessun secondo campo ambiguo per persone o lotto');
    check((await p.locator('#portion-preview').textContent()).includes('170 g'),'Ricetta burrito visibile già ricalcolata a 170 g di manzo');
    await p.locator('#planner-portions').fill('2');check((await p.locator('#portion-preview').textContent()).includes('340 g'),'Due porzioni moltiplicano una sola volta');await p.locator('#save-weekly-meal').tap();
    check((await state()).days['2026-11-02'].meals[0].people===2,'Due porzioni salvate separatamente dalla fonte');
    await p.locator('[data-plan-date="2026-11-02"][data-plan-slot=breakfast]').tap();await p.locator('[data-pick-recipe=pancake-banana]').tap();
    check(await p.locator('#planner-portions').inputValue()==='1','Anche le ricette senza resa originale partono da una porzione redazionale');
    await p.locator('#meal-picker .metric-fields summary').tap();await p.locator('#meal-picker [data-metric-index="2"] input').fill('50');await p.locator('#save-weekly-meal').tap();
    await tab('shopping');check((await flourRow().textContent()).includes('1 confezione da 1 kg'),'50 g necessari diventano una confezione da 1 kg');
    check((await flourRow().textContent()).includes('950 g'),'Avanzo previsto mostrato separatamente dal fabbisogno');
    await flourRow().getByRole('button',{name:'Registra quello che hai già',exact:true}).tap();
    check(await stockForm().locator('[name=label]').inputValue()==='Farina','Accesso diretto alla scorta con ingrediente corretto');
    await stockForm().locator('[name=unit]').selectOption('kg');check(await stockForm().locator('[name=packSize]').inputValue()==='1','Cambio in kg converte anche il formato della confezione');await stockForm().locator('[name=quantity]').fill('0.2');await stockForm().getByRole('button',{name:'Salva quantità presente',exact:true}).tap();
    check(await currentStock()===200,'Scorta reale registrata');
    check((await p.locator('.pantry-stock-card').textContent()).includes('50 g'),'Quantità riservata dal menu visibile');
    await tab('shopping');check((await flourRow().textContent()).includes('Hai già abbastanza'),'La dispensa evita un acquisto inutile');
    check(await flourRow().getByRole('button',{name:'Ho acquistato',exact:true}).count()===0,'Non viene proposto di comprare se le scorte bastano');
    await flourRow().getByRole('button',{name:'Registra quello che hai già',exact:true}).tap();await stockForm().locator('[name=quantity]').fill('0');await stockForm().getByRole('button',{name:'Salva quantità presente',exact:true}).tap();
    check((await p.locator('.pantry-stock-card').textContent()).includes('Esaurito'),'Scorta zero distinta da quantità soltanto riservata');
    await tab('shopping');await flourRow().getByRole('button',{name:'Ho acquistato',exact:true}).tap();check(await currentStock()===1000,'Ho acquistato carica la confezione intera in dispensa');
    await tab('menu');const pancake=()=>p.locator('.planned-meal').filter({has:p.getByRole('heading',{name:'Pancake banana e cioccolato',exact:true})});
    p.once('dialog',d=>d.accept());await pancake().getByRole('button',{name:'Ho preparato: scala dalla dispensa',exact:true}).tap();
    check(await currentStock()===950,'Ho preparato scarica 50 g effettivi, non la confezione');
    check((await state()).pantryMovements.at(-1).untracked.length>0,'Misure incerte non scaricate e dichiarate nel movimento');
    check(await pancake().getByRole('button',{name:'Ho preparato: scala dalla dispensa',exact:true}).count()===0,'Il pasto preparato non si scarica due volte');
    p.once('dialog',d=>d.accept());await pancake().getByRole('button',{name:'Annulla scarico',exact:true}).tap();check(await currentStock()===1000,'Annullamento ripristina esattamente 50 g');
    await tab('pantry');await p.locator('.pantry-stock-card').getByRole('button').tap();await stockForm().locator('[name=quantity]').fill('50');await stockForm().getByRole('button',{name:'Salva quantità presente',exact:true}).tap();
    check(await currentStock()===50,'Correggere il conteggio sostituisce la quantità, non la somma');
    check((await p.locator('.pantry-stock-card').textContent()).includes('Il menu userà tutta questa scorta'),'Avviso di esaurimento previsto prima di cucinare');
    await tab('menu');p.once('dialog',d=>d.accept());await pancake().getByRole('button',{name:'Ho preparato: scala dalla dispensa',exact:true}).tap();await tab('pantry');
    check(await currentStock()===0&&(await p.locator('.pantry-stock-card').textContent()).includes('Esaurito'),'Dopo la preparazione la farina risulta realmente finita');
    const before=await p.evaluate(()=>localStorage.getItem('coach_os_v1'));
    await p.evaluate(()=>{window.qaSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('Quota');};});
    await p.locator('.pantry-stock-card').getByRole('button').tap();await stockForm().locator('[name=quantity]').fill('100');await stockForm().getByRole('button',{name:'Salva quantità presente',exact:true}).tap();
    check(await p.evaluate(()=>localStorage.getItem('coach_os_v1'))===before&&await currentStock()===0,'Errore di salvataggio non inventa scorte');
    check((await p.locator('#notice').textContent()).includes('Salvataggio non riuscito'),'Errore di quota visibile');
    await p.evaluate(()=>{Storage.prototype.setItem=window.qaSetItem;});
    await stockForm().getByRole('button',{name:'Salva quantità presente',exact:true}).tap();check(await currentStock()===100,'Modulo recuperabile dopo errore');
    await p.reload();await p.locator('nav [data-view=menu]').tap();await tab('pantry');check(await currentStock()===100,'Scorte e movimenti persistono dopo riapertura');
    for(const width of [320,390,768,1440]) {
      await p.setViewportSize({width,height:1000});check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Dispensa senza overflow ${width}px`);
      await tab('shopping');check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Spesa confezioni senza overflow ${width}px`);await tab('pantry');
    }
    await p.setViewportSize({width:390,height:844});await p.screenshot({path:'C:/Users/francesco.sommella/Progetti VS/CoachOS_Codex/test-results/pantry-final-mobile.png'});
    check(errors.length===0,`Nessun errore JavaScript: ${errors.join('; ')}`);return {passed:checks.length,checks,errors};
  }finally{await c.close();}
}
