// QA della cartella dist servita sotto il percorso di un repository Pages.
async (page) => {
  const c=await page.context().browser().newContext({viewport:{width:1440,height:1000},timezoneId:'Europe/Berlin'});
  const p=await c.newPage();const checks=[];const errors=[];
  const check=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  try {
    const response=await p.goto('http://127.0.0.1:5180/coach-os/');
    check(response.status()===200,'Build HTTP 200 sotto il prefisso repository');
    check(await p.getByRole('heading',{name:'Un giorno alla volta.',exact:true}).count()===1,'Moduli e stile della pagina caricati');
    await p.getByRole('button',{name:'Pianifica la settimana',exact:true}).click();
    await p.locator('#meal-form-lunch').waitFor();await p.locator('#selected-date').fill('2026-11-02');
    await p.locator('[data-plan-date="2026-11-02"][data-plan-slot=lunch]').click();
    await p.locator('[data-pick-recipe=pasta-fredda-pollo]').click();await p.locator('#save-weekly-meal').click();
    check(await p.locator('.weekly-dish').count()===1,'Catalogo e menu salvabili nella build Pages');
    await p.locator('#weekly-planner [data-planner-tab=shopping]').first().click();
    const pasta=p.locator('.shopping-row').filter({has:p.getByRole('heading',{name:'Pasta',exact:true})});
    check((await pasta.locator('.shopping-demand').textContent()).includes('75 g'),'Spesa calcolata dalle dosi della build');
    check((await pasta.textContent()).includes('500 g'),'Confezioni disponibili nella build Pages');
    await p.getByRole('button',{name:'Le mie schede',exact:true}).click();
    check(await p.locator('.template-editor .exercise').count()===3,'Schede preimpostate nella build');
    await p.getByRole('button',{name:'Ricettario',exact:true}).click();await p.locator('[data-recipe="burrito-manzo"]').click();
    await p.locator('.recipe-sources summary').click();
    const url=await p.locator('.source-images img').first().getAttribute('src');
    check(url.startsWith('http://127.0.0.1:5180/coach-os/assets/'),'Immagini risolte sotto il prefisso repository');
    check((await p.request.get(url)).status()===200,'Screenshot originale HTTP 200');
    await p.setViewportSize({width:390,height:844});
    check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Build mobile senza overflow');
    check((await p.request.get('http://127.0.0.1:5180/data/recipes.json')).status()===404,'Nessun fallback alla radice del dominio');
    check(errors.length===0,'Nessun errore JavaScript o risorsa mancante');
    return {passed:checks.length,checks,errors};
  } finally {await c.close();}
}
