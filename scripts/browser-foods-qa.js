// Dati sintetici in contesto isolato; nessuna lettura del diario dell'utente.
async(page)=>{
  const context=await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Berlin'});
  const p=await context.newPage();p.setDefaultTimeout(10000);const checks=[],errors=[];
  const check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};p.on('pageerror',e=>errors.push(e.message));
  const d=()=>p.locator('#food-dialog'),pf=()=>p.locator('#food-product-form');
  const state=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('coach_os_v1')));
  const open=async()=>{await p.locator('[data-food-open]').click();};
  const close=async()=>{p.once('dialog',x=>x.accept());await p.getByRole('button',{name:'Chiudi diario alimentare',exact:true}).click();};
  const manual=async(name,amount,values)=>{
    await p.getByRole('button',{name:'Inserisci etichetta',exact:true}).click();await pf().locator('[name=name]').fill(name);await pf().locator('[name=amount]').fill(String(amount));
    for(const [k,v] of Object.entries(values))await pf().locator(`[name=${k}]`).fill(String(v));
    await pf().getByRole('button',{name:'Aggiungi al pasto',exact:true}).click();
  };
  let requests=0;
  await p.route('https://world.openfoodfacts.org/**',async route=>{
    requests++;const code=new URL(route.request().url()).pathname.split('/').at(-1);
    if(code==='99999999')return route.fulfill({status:404,body:'{}'});
    if(code==='88888888')return route.abort();
    const product={product_name:'Robiola prova',brands:'Test',nutrition_data_per:'100g',nutriments:{'energy-kcal_100g':300,proteins_100g:10,carbohydrates_100g:4,fat_100g:27}};
    if(code==='77777777')delete product.nutriments.proteins_100g;
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:'success',product})});
  });
  try{
    await p.goto('http://127.0.0.1:5173');check(await p.locator('[data-food-open]').isVisible(),'Diario raggiungibile direttamente da Oggi');await open();
    await manual('Salmone',100,{kcal:200,proteinG:20,carbsG:0,fatG:12});await manual('Robiola',50,{kcal:300,proteinG:10,carbsG:4,fatG:27});await manual('Piadina',100,{kcal:330,proteinG:8,carbsG:55,fatG:9});await manual('Olio',5,{kcal:900,proteinG:0,carbsG:0,fatG:100});
    check((await p.locator('#food-basket').textContent()).includes('725 kcal'),'Quattro alimenti: 725 kcal calcolate dalle quantità reali');
    await p.locator('#food-meal-meta summary').click();await p.locator('#food-meal-form [name=name]').fill('Piadina libera');await p.locator('#food-meal-form [name=slot]').selectOption('lunch');await p.locator('#food-meal-form [name=habitual]').check();await p.locator('#food-save-meal').click();
    check(!await d().isVisible(),'Conferma finale chiude il pasto salvato');let s=await state();const date=Object.keys(s.days)[0];check(s.days[date].foodEntries[0].items.length===4,'Un solo pranzo con quattro alimenti');check(!s.days[date].meals&&!s.pantry,'Nessun piano ricetta o scarico scorte implicito');check(s.foodProducts.length===4&&s.habitualMeals.length===1,'Recenti e pasto abituale conservati');
    await p.locator('[data-food-edit]').click();await p.locator('[data-food-item="1"]').click();check(!await pf().locator('details').getAttribute('open'),'Dettagli nutrizionali chiusi quando già completi');await pf().locator('[name=amount]').fill('100');await pf().getByRole('button',{name:'Aggiorna alimento',exact:true}).click();await p.locator('#food-save-meal').click();s=await state();check(s.days[date].foodEntries.length===1&&s.days[date].foodEntries[0].items[1].amount===100,'Correzione aggiorna la registrazione senza duplicarla');
    await open();await p.locator('#food-search').fill('Robiola');await p.locator('[data-food-product]').click();check(await pf().locator('[name=amount]').inputValue()==='100','Quantità precedente già proposta');await pf().getByRole('button',{name:'Aggiungi al pasto',exact:true}).click();await close();
    await open();await p.locator('#food-habits summary').click();await p.locator('[data-food-habit]').click();check(await p.locator('#food-basket li').count()===4,'Pasto abituale riaggiunto con una scelta');check((await p.locator('#food-basket').textContent()).includes('725 kcal'),'Pasto abituale mantiene lo snapshot originale');await close();
    await open();await p.locator('#food-code-details summary').click();await p.locator('#food-barcode-form input').fill('12345678');await p.locator('#food-barcode-form button').click();await pf().waitFor();check(await pf().locator('[name=amount]').isVisible(),'Prodotto trovato mostra prima la quantità');await pf().locator('[name=amount]').fill('50');check((await p.locator('#food-product-preview').textContent()).includes('150'),'Anteprima macro proporzionale alla quantità');await pf().getByRole('button',{name:'Aggiungi al pasto',exact:true}).click();await p.locator('#food-save-meal').click();const beforeRequests=requests;
    await open();await p.locator('#food-code-details summary').click();await p.locator('#food-barcode-form input').fill('12345678');await p.locator('#food-barcode-form button').click();await pf().waitFor();check(requests===beforeRequests,'Codice già salvato riutilizzato senza rete');await close();
    await open();await p.locator('#food-code-details summary').click();await p.locator('#food-barcode-form input').fill('99999999');await p.locator('#food-barcode-form button').click();await p.getByText('Prodotto non trovato. Inserisci i valori della confezione.',{exact:true}).waitFor();check(await p.getByRole('button',{name:'Inserisci etichetta',exact:true}).isVisible(),'Codice sconosciuto recuperabile con etichetta');await p.locator('#food-barcode-form input').fill('88888888');await p.locator('#food-barcode-form button').click();await p.getByText('Ricerca non disponibile: controlla la connessione o inserisci l’etichetta.',{exact:true}).waitFor();check(true,'Errore rete spiegato senza perdere il pasto');
    await p.locator('#food-barcode-form input').fill('77777777');await p.locator('#food-barcode-form button').click();await pf().waitFor();check(await pf().locator('[name=proteinG]').inputValue()==='','Proteine assenti non diventano zero');check(await pf().locator('details').getAttribute('open')!==null,'Dati incompleti aperti per la correzione');await close();
    await open();await p.evaluate(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Denied','NotAllowedError');};});await p.getByRole('button',{name:'Scansiona codice a barre',exact:true}).click();await p.getByText('Accesso alla fotocamera negato. Puoi digitare il codice.',{exact:true}).waitFor();check(!await p.locator('#food-camera').isVisible(),'Fotocamera negata: alternativa manuale e pannello chiuso');
    // Genera un EAN-13 sintetico e lo invia come video: verifica la decodifica reale ZXing.
    await p.evaluate(()=>{
      const code='3017620422003',L=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'],G=['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'],parity=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
      let bits='101';for(let i=1;i<=6;i++)bits+=(parity[Number(code[0])][i-1]==='L'?L:G)[Number(code[i])];bits+='01010';for(let i=7;i<13;i++)bits+=L[Number(code[i])].replace(/[01]/g,c=>c==='0'?'1':'0');bits+='101';
      const canvas=document.createElement('canvas');canvas.width=480;canvas.height=240;const x=canvas.getContext('2d');const draw=()=>{x.fillStyle='white';x.fillRect(0,0,480,240);x.fillStyle='black';[...bits].forEach((v,i)=>{if(v==='1')x.fillRect(48+i*4,20,4,190);});};draw();window.qaDraw=setInterval(draw,70);window.qaStream=canvas.captureStream(15);navigator.mediaDevices.getUserMedia=async()=>window.qaStream;
    });
    await p.getByRole('button',{name:'Scansiona codice a barre',exact:true}).click();await pf().waitFor({timeout:15000});check(await pf().locator('[name=name]').inputValue()==='Robiola prova','EAN-13 decodificato da video e prodotto cercato');check(await p.evaluate(()=>qaStream.getTracks().every(t=>t.readyState==='ended')),'Tracce fotocamera chiuse dopo lettura');await close();
    await open();await manual('Prova quota',10,{kcal:100});const rawBefore=await p.evaluate(()=>localStorage.getItem('coach_os_v1'));await p.evaluate(()=>{window.qaSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('Quota');};});await p.locator('#food-save-meal').click();check(await d().isVisible()&&await p.locator('#food-basket li').count()===1,'Salvataggio fallito conserva il pasto compilato');check(await p.evaluate(()=>localStorage.getItem('coach_os_v1'))===rawBefore,'Quota non modifica i byte salvati');await p.evaluate(()=>Storage.prototype.setItem=window.qaSet);await p.locator('#food-save-meal').click();check(!await d().isVisible(),'Salvataggio recuperabile dopo errore');
    await p.reload();check(await p.locator('.food-entry').count()===3,'Diario disponibile dopo riapertura');await open();
    for(const [width,height] of [[320,740],[390,844],[844,390],[1440,1000]]){await p.setViewportSize({width,height});check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Pagina senza overflow ${width}`);check(await d().evaluate(el=>el.scrollWidth<=el.clientWidth+1),`Diario senza overflow ${width}`);}
    await p.setViewportSize({width:390,height:844});await p.screenshot({path:'C:/Users/francesco.sommella/Progetti VS/CoachOS_Codex/test-results/food-diary-mobile.png'});await close();
    check(errors.length===0,`Nessun errore JavaScript: ${errors.join('; ')}`);return {passed:checks.length,checks,requests,errors};
  }finally{await context.close();}
}
