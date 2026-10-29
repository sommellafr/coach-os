// Funzione per browser_run_code_unsafe, in un contesto isolato.
async (page) => {
  const context = await page.context().browser().newContext({viewport:{width:1440,height:1000},timezoneId:'Europe/Berlin'});
  const p = await context.newPage();
  const checks = []; const errors = [];
  const check = (value,label) => { if(!value) throw Error(label); checks.push(label); };
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error' && !m.text().includes('503')) errors.push(m.text());});
  try {
    await p.goto('http://127.0.0.1:5173');
    await p.getByRole('heading',{name:'Un giorno alla volta.'}).waitFor();
    const initialStorage = await p.evaluate(()=>JSON.stringify({...localStorage}));
    await p.route('**/data/recipes.json',route=>route.fulfill({status:503,body:'Non disponibile'}));
    await p.getByRole('button',{name:'Ricettario',exact:true}).click();
    await p.getByRole('heading',{name:'Ricettario non disponibile'}).waitFor();
    check((await p.locator('#main').textContent()).includes('503'),'Errore caricamento visibile');
    await p.unroute('**/data/recipes.json');
    await p.getByRole('button',{name:'Riprova',exact:true}).click();
    await p.locator('.recipe-card').first().waitFor();
    check(await p.locator('.recipe-card').count()===34,'34 ricette disponibili dopo Riprova');
    await p.screenshot({path:'C:/Users/francesco.sommella/Progetti VS/CoachOS_Codex/test-results/recipes-desktop.png',fullPage:true});
    const ids = await p.locator('[data-recipe]').evaluateAll(buttons=>buttons.map(b=>b.dataset.recipe));
    for(const id of ids) {
      await p.locator(`[data-recipe="${id}"]`).click();
      check(await p.getByRole('heading',{name:'Passo dopo passo',exact:true}).count()===1 && await p.locator('.recipe-steps li').count()>=2,`Guida e dettaglio ${id}`);
      await p.locator('.recipe-sources summary').click();
      check(await p.locator('.source-images a').count()>=1,`Fonte originale accessibile ${id}`);
      await p.getByRole('button',{name:'Torna alle ricette',exact:false}).click();
    }
    await p.locator('#recipe-search').fill('avena');
    await p.getByRole('button',{name:'Filtra ricette',exact:true}).click();
    check(await p.locator('.recipe-card').count()===1,'Ricerca per ingrediente');
    await p.getByRole('button',{name:'Azzera filtri',exact:true}).click();
    await p.locator('#recipe-category').selectOption({label:'Secondi'});
    await p.getByRole('button',{name:'Filtra ricette',exact:true}).click();
    check(await p.locator('.recipe-card').count()===3,'Filtro categoria');
    await p.getByRole('button',{name:'Azzera filtri',exact:true}).click();
    await p.locator('#recipe-search').fill('inesistente');
    await p.getByRole('button',{name:'Filtra ricette',exact:true}).click();
    check(await p.getByRole('heading',{name:'Nessuna ricetta corrispondente'}).count()===1,'Stato senza risultati');
    await p.getByRole('button',{name:'Azzera filtri',exact:true}).click();
    await p.locator('[data-recipe="pancake-banana"]').click();
    await p.locator('#recipe-multiplier').fill('2');
    await p.getByRole('button',{name:'Aggiorna dosi',exact:true}).click();
    check((await p.locator('.ingredients-list').textContent()).includes('80–100 g'),'Scala intervallo farina da 40–50 a 80–100 g');
    check((await p.locator('.ingredients-list').textContent()).includes('Peso/volume da confermare'),'Quantità mancanti restano mancanti');
    check((await p.locator('.recipe-nutrition').textContent()).includes('Nessuna stima aggiunta'),'Nutrienti assenti espliciti');
    await p.getByRole('button',{name:'Torna alle ricette',exact:false}).click();
    await p.locator('[data-recipe="piadine-zucchine"]').click();
    check((await p.locator('.recipe-nutrition').textContent()).includes('incoerente') && !(await p.locator('.recipe-nutrition').textContent()).includes('Totale aritmetico'),'Macro incoerenti visibili senza totale derivato');
    await p.setViewportSize({width:390,height:844});
    await p.evaluate(()=>window.scrollTo(0,0));
    check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Dettaglio mobile 390px senza overflow');
    check(!await p.locator('.sidebar-footer').isVisible(),'Informazioni desktop nascoste nella navigazione mobile');
    check(await p.evaluate(()=>[...document.querySelectorAll('input,select')].every(el=>el.labels?.length || el.getAttribute('aria-label'))),'Etichette accessibili dei controlli');
    await p.screenshot({path:'C:/Users/francesco.sommella/Progetti VS/CoachOS_Codex/test-results/recipe-mobile.png',fullPage:true});
    await p.setViewportSize({width:320,height:740});
    check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Dettaglio mobile 320px senza overflow');
    await p.getByRole('button',{name:'Torna alle ricette',exact:false}).click();
    check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Catalogo mobile 320px senza overflow');
    const downloadPromise = p.waitForEvent('download');
    await p.getByRole('button',{name:'Scarica ricettario JSON',exact:true}).click();
    const download = await downloadPromise; check(download.suggestedFilename()==='coach-os-ricettario.json','Esportazione catalogo'); await download.delete();
    check(await p.evaluate(()=>JSON.stringify({...localStorage}))===initialStorage,'Lettura ricettario non modifica o migra il diario');
    check(errors.length===0,`Zero errori imprevisti: ${errors.join('; ')}`);
    return {passed:checks.length,checks,errors};
  } finally {await context.close();}
}
