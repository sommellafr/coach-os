# Stato implementazione

Aggiornato il 30 ottobre 2026. Versione 0.4.2: continuità del giorno nel calendario e proposta del giorno successivo dalle 21. Restano planner e spesa, porzioni personali, schede V21/personali e ricettario. Il sito è pubblicato su GitHub Pages; nessun servizio a pagamento attivato.

## Giorno selezionato e soglia delle 21 — 0.4.2

- Richiesta: al ritorno dalla scelta di un piatto mantenere il giorno in cui si sta lavorando, senza tornare al lunedì; dopo le 21 proporre il giorno successivo.
- Cause: il rendering ricreava la griglia con scroll orizzontale a zero; il salvataggio su più date selezionava la prima data spuntata. Ora la data di apertura del selettore è conservata anche se vengono selezionati giorni precedenti, e le griglie vengono riallineate alla data selezionata dopo rendering, caricamento ricette e chiusura del dialog.
- Il planner conserva una data di navigazione separata da Oggi nella sessione. All'apertura, fino alle 20:59 propone oggi; dalle 21:00 propone domani secondo l'ora locale, con passaggi settimana/mese/anno e cambio ora basati su date civili. Il limite 2199 resta rispettato. Nessuna derivazione della giornata da ISO UTC.
- La soglia viene verificata con timer alle 21 e al ritorno alla finestra. Se l'utente sceglie una data o sta compilando un modulo, la scelta resta ferma; nessuno spostamento automatico durante un dialog. Giorno proposto riattiva la proposta. Oggi, date delle sedute e vincoli sui risultati futuri continuano a usare la giornata reale.
- Nessuna modifica al formato, alle voci salvate, alle porzioni o alla spesa. La selezione è stato di navigazione della sessione, non persistenza o migrazione dei dati.
- Verifiche: 66 test automatici (3 nuovi per soglia 21, limiti, domenica/mese/anno/bisestile/DST); 18 controlli browser con orologio controllato su data e scroll, salvataggio multiplo, annullamento, navigazione, cambio alle 21 e protezione del lavoro in corso. Ancora superati 48 controlli settimanali e 106 smartphone con touch simulato. Restano non verificati dispositivo fisico e Safari.
- La release 0.4.1 f79d2f9 è stata pubblicata con workflow 40970309174 riuscito; questo aggiornamento è preparato per la pubblicazione successiva.

## Correzione porzioni e spesa metrica — 0.4.1

- Richiesta: una porzione per persona, ospiti separati, totali in grammi/ml. Riprodotto il menu sintetico che genera 2040 g di manzo e 16 tortilla: il divisore 1 era interpretabile come persone, ma rappresentava l'intera preparazione.
- Resa nota bloccata nel selettore e nel modulo giornaliero; persone 1 per default, ospiti su scelta esplicita; anteprima delle quantità del pasto. Rese in strisce, pezzi e polpette richiedono il numero di pasti, senza equiparare un pezzo a un pranzo.
- Conversioni esatte in g/ml, incluse oz di massa; cup, pezzi e quantità senza peso rimangono da confermare. Misure da confezione/bilancia inseribili e riutilizzabili separatamente dagli snapshot. Nessuna densità o peso standard inventato. Dettagli e fonte primaria in PORTIONS_AND_METRIC.md.
- Correzione esplicita delle divisioni discordanti della settimana con anteprima e backup esatto prima della scrittura. Nessuna migrazione o modifica implicita dei pasti già salvati. Compatibilità con backup vecchi e validazione dei nuovi campi.
- Verifiche: 63 test automatici; 21 controlli browser sulla riproduzione/correzione e sui pesi, 106 mobile, 48 planner, 45 pasti/schede e 85 ricettario. Sintassi, build, risorse e hash originali verificati. Non verificati telefono fisico/Safari e pesi di prodotti reali.
- La release precedente ac9ee42 è stata pubblicata su GitHub Pages con workflow 40967399932 concluso con successo; questa correzione è preparata e verificata per l'aggiornamento successivo.

## Accesso diretto a menu e spesa — 29 ottobre 2026

- Richiesta: trovare la selezione di colazione, pranzo e cena e la spesa derivata; rendere più semplice il percorso settimanale.
- Implementazione reversibile: voce **Menu e spesa**, pulsanti **Scegli i pasti** e **Lista della spesa** in Oggi, pagina dedicata senza moduli allenamento, icona carrello e guida in tre passaggi. L'accesso dalla home usa la settimana corrente; la navigazione conserva la settimana consultata. Su mobile è esplicito lo scorrimento dei sette giorni.
- Nessun cambiamento al formato dati, alle quantità, alle fonti o alle regole della spesa. Restano ricerca per ingrediente, selezione di più giorni, dosi singole, copia nei pasti liberi e lista spuntabile/scaricabile; nessun acquisto online.
- Verifiche: sintassi, suite automatica, build, verifica risorse e hash delle 31 immagini superati. Browser Chromium isolato: 48 controlli del flusso settimanale esistente e 16 sul nuovo accesso (salvataggio pasto, spesa, spunta, collegamenti dalla home, navigazione e assenza overflow a 1440/768/390/320 px). Nessun errore JavaScript. Ispezione visiva mobile eseguita; non verificati telefono fisico e screen reader.
- L'utente riferisce di aver pubblicato la versione precedente su GitHub Pages. Queste modifiche sono locali e non sono state pubblicate né inviate al repository remoto.

## Etichette Colazione / Pranzo / Cena — 29 ottobre 2026

- Richiesta esplicita: etichettare le ricette per pasto e filtrare automaticamente la scelta.
- Copertura completa delle 34 ricette con metadati redazionali separati in `src/recipe-tags.js`: 7 Colazione, 27 Pranzo e Cena. Assegnazione iniziale reversibile, documentata in RECIPE_MEAL_TAGS.md; non è testo estratto o valutazione nutrizionale.
- Filtro coerente nel selettore settimanale, durante la ricerca e nei select giornalieri. Badge visibili in ricettario, dettaglio e selettore; nuovo filtro Pasto combinabile con categoria e ricerca. Reset ripristina tutti i filtri.
- Nessuna modifica alle fonti, al catalogo estratto o ai pasti già salvati. Le assegnazioni storiche fuori etichetta restano consultabili e incluse nella spesa; nessuna migrazione.
- Verifiche: 54 test automatici del progetto superati (4 nuovi su copertura etichette, filtri combinati, selettori coerenti e conservazione storico), sintassi, build e verify:site (52 file), integrità delle 31 immagini. Chromium isolato: 30 controlli nuovi su tutti i pasti, ricerca vuota/coerente, salvataggio, spesa, persistenza, badge, reset e layout ricettario 1440/768/390/320 px; ancora superati i 48 controlli del flusso settimanale. Nessun errore JavaScript. Ispezione visiva mobile; telefono fisico e screen reader non verificati.
- Modifiche solo locali: nessun push o deploy effettuato.

## Smartphone prima del deploy — 29 ottobre 2026

- Richiesta: aggiornare GitHub e fare deploy, verificando prima l'esperienza smartphone.
- Sistemati nomi della navigazione mobile, controlli principali pasti/spesa da almeno 44 px, data a 16 px non compressa, aree sicure e selettore utilizzabile in orizzontale. Dettagli in MOBILE_VALIDATION.md e verifiche ripetibili in scripts/browser-mobile-qa.js.
- Superati 106 controlli browser con touch simulato in cinque formati verticali/orizzontali, 48 del flusso settimanale e 54 test del progetto. Rimangono non verificati telefono fisico e Safari; nessuna certificazione di compatibilità universale.
- La cronologia remota main è stata letta e confrontata con la baseline locale, senza cambiare sorgenti storiche e immagini. L'accesso GitHub disponibile è di sola lettura sul repository: push e deploy richiedono il collegamento di un account autorizzato. Nessun deploy di questo aggiornamento eseguito.

## Preparazione GitHub / GitHub Pages

- Richiesta: preparare tutto per caricare e lanciare il progetto su GitHub. Repository locale pronto, nessun remote ancora collegato e nessun push/deploy effettuato.
- Percorsi HTML relativi e catalogo/immagini risolti dalla posizione del modulo: supportati dominio principale e sottocartella del repository, senza nome GitHub codificato nell'app. Chiavi e dati del browser invariati.
- Build senza dipendenze in dist, con app/catalogo/immagini e verifica hash delle 31 fonti. Esclusi dal sito documentazione, reference, test, Git e file di lavoro. Originali preservati nel repository e attributi Git per mantenere i byte anche nei cloni Windows.
- Workflow Verifiche su push/PR, Node 24 su Windows/Linux; workflow Pages soltanto manuale e dal branch predefinito, con test/build prima del deploy e permessi di scrittura soltanto nel job deploy. Nessuna chiave API personale o servizio a pagamento configurato.
- Guida docs/GITHUB_PAGES.md: creazione repository vuoto, push, Settings Pages, Run workflow, aggiornamenti e trasferimento del diario tramite export/ripristino. ZIP sorgenti e ZIP statico generati in releases, esclusi da Git. Nessuna licenza open source assegnata alle fonti di terzi.
- Verifiche locali: 50 test automatici superati, sintassi dei moduli/script, build e verify:site superati (51 file, import/risorse/catalogo sotto il prefisso e hash immagini). Browser della build sotto /coach-os/: 10 controlli su caricamento, menu salvabile, spesa, schede, immagine originale, mobile, assenza di fallback alla radice e zero errori console.
- Non verificati: esecuzione effettiva su runner GitHub e deployment remoto, che richiedono la creazione/connessione del repository. Le versioni delle Actions e la configurazione sono state confrontate con documentazione e sorgenti ufficiali GitHub.

## Versione 0.4 — settimana e spesa

- Il calendario mette al centro il menu di sette giorni con Colazione/Pranzo/Cena, date reali, scelta rapida tramite ricerca per nome/ingrediente e selettore modale accessibile. Calendario mensile secondario apribile, dettagli per giorno e allenamenti mantenuti. Oggi offre l'accesso Pianifica la settimana.
- Aggiunta della stessa dose a più giorni in un unico salvataggio atomico; resa richiesta dove assente. Copia alla settimana successiva solo per pasti liberi, con ID indipendenti, snapshot congelati e nessuna sovrascrittura di pasti, note o allenamenti.
- Lista della spesa derivata dai pasti salvati della settimana: ingredienti sommati, g/kg e ml/l normalizzati, unità incompatibili e stati crudo/cotto distinti, intervalli preservati, null mai trasformati in zero. Facoltativi esclusi per default e includibili esplicitamente; q.b. e dosi mancanti separati e inclusi nel testo esportato. Regole in SHOPPING_RULES.md.
- Spunte persistenti per settimana, valide soltanto per il medesimo fabbisogno; copia negli appunti e download TXT. Errori di salvataggio senza falsa spunta o modifica dell'archivio. Messaggi chiudibili. Preferenze/spunte in campo opzionale shoppingWeeks del formato 1, con validazione e backup/ripristino; nessuna migrazione necessaria.
- Grafica verificata a 1440/768/390/320 px: griglia desktop con righe pasti allineate, menu a scorrimento orizzontale su mobile, tab menu/spesa, controlli del selettore e focus confinato; Escape annulla senza salvare.
- Verifiche: **50 test automatici superati** (11 nuovi su aggregazione, unità/stati, intervalli/mancanti, facoltativi, firme delle spunte, ripetizione/copia, cambio anno e persistenza). **48 controlli browser nuovi** in browser-weekly-qa.js; ancora superati 20 del diario, 45 di menu/schede e 85 del ricettario. La prova del calendario mensile ora lo apre esplicitamente. Nessun errore JS imprevisto. Immagini/reference/dati ricette conservati e hash verificati.

Restano dispensa e confezioni, consumi effettivi/extra, profilo/obiettivi, monitor e confronti delle prestazioni, benchmark e progressione. Non verificati dispositivi fisici, altri browser, screen reader reale o prove pratiche della spesa; la copia negli appunti è verificata con simulazione, il file TXT con contenuto scaricato reale nel contesto isolato.

## Versione 0.3 — richieste successive

- Grafica: tema scuro blu/antracite, accenti azzurro e lime, SVG locali, nuovo marchio, schermata Oggi con azioni rapide, schede ricette illustrate per categoria, controlli e navigazione mobile flottante. Nessuna foto generata né illustrazione presentata come fotografia della ricetta. Struttura e dati restano separati dal nuovo tema `src/app-theme.css`.
- Calendario: sezioni Colazione, Pranzo e Cena per data, anche futura, con una dose per ricetta. Resa conosciuta proposta, resa assente richiesta all'utente. Più ricette per pasto, correzione delle dosi e del pasto sullo stesso ID, rimozione mirata, riepilogo di menu nelle celle del calendario e consultazione in Oggi.
- Ingredienti e resa/nutrienti originali conservati in snapshot; divisione delle quantità e degli intervalli senza trasformare null in zero. Nutrienti derivati solo quando base/resa sono esplicite e non incoerenti, sempre dichiarati non verificati. Tutti i pasti restano pianificati: non sono calorie effettivamente assunte. Lo spostamento dell'allenamento non sposta i pasti.
- Schede già pronte: contenuti reali di `DB.workouts` V21. TB1: Panca Piana 3×10, Rematore 3×10, Trazioni 3×8; TB2: Squat 3×10, Military 3×10; TB3: Stacco 3×8, Dips 3×10; Cardio 1/2: Tapis Roulant 1×60 min in entrambi i casi. Non si inventano esercizi per trasformarle in programmi Total Body scientificamente completi. Carichi V21 mostrati come riferimenti storici separati, non risultati o target attuali confermati.
- Creazione di altre schede con nome libero, vuote oppure duplicate dalle proprie schede/dalle basi V21; rinomina, aggiunta esercizi/serie, persistenza e selezione in calendario. Piani e sedute già avviati conservano i propri snapshot di titolo e target.
- Aggiornamento dei soli contenitori originali mai modificati (ID/nome standard, versione 1, nessun esercizio e nessuna origine), con backup dei byte prima della scrittura. Se il backup fallisce, nulla viene sostituito. Schede già personalizzate, diario e chiave V21 preservati. Nessuna riscrittura automatica dei piani già assegnati; per adottare una scheda aggiornata va riassegnata.
- Compatibilità: `meals` è un campo opzionale del formato 1; i backup precedenti rimangono leggibili e quelli nuovi includono i menu. La compilazione del menu non cambia il significato delle registrazioni di allenamento.
- Verifiche: **39 test automatici superati** (10 nuovi per menu e 7 per schede/backup). Browser: **45 controlli** nuovi su pasti, correzioni, riapertura, quota simulata, ripristino, creazione/rinomina/uso schede e tutte e cinque le schermate a 1440/768/390/320 px; ancora superati i **20** controlli del diario e gli **85** del ricettario. Zero errori JS imprevisti. Le prove usano contesti isolati e dati sintetici, senza cancellare dati del profilo utente.
- Verificati sintassi, integrità dei 31 originali e invariabilità di reference/data ricette. Ispezione visiva desktop e mobile; focus visibile, etichette e reduced motion mantenuti. Non verificati su dispositivo fisico o screen reader reale; non è una certificazione WCAG.

### Cosa manca adesso

La lista della spesa è stata aggiunta nella versione 0.4. Restano pasti consumati ed extra; profilo/obiettivi attuali; ultima prestazione comparabile, delta e grafici; monitor energia/peso e forza; dispensa/confezioni; benchmark e progressione con fonti scientifiche validate. Le informazioni disponibili non contengono altre versioni delle schede o un registro di allenamenti effettivamente svolti: non è possibile ricostruirli dalla V21.

## Ricettario completato nella versione 0.2

- Aperte e lette visivamente tutte le **31 immagini**, senza modificare gli originali. Recuperate **34 ricette distinte**, con cinque varianti dalla SRC-02 e un solo record per le crêpes duplicate SRC-07/SRC-16. Inventario completo in [RECIPE_REVIEW.md](RECIPE_REVIEW.md).
- Ingredienti con quantità, unità, intervalli, stato crudo/cotto quando dichiarato, facoltativi e resa disponibile. Dosi sconosciute conservate come null. Nessuna conversione arbitraria di cup/cucchiai in grammi, nessun nutriente inventato.
- Guida numerata per ogni ricetta: ogni passo distingue riformulazione del testo visibile e integrazione redazionale. Procedimento estratto e immagini originali consultabili nella scheda.
- Nutrienti riportati come dichiarazioni non verificate. Base non esplicitata: nessuna inferenza per porzione. Macro incoerenti delle piadine di zucchine preservati e segnalati; totale derivato disattivato. Parametro “300 gradi” dei nuggets mantenuto nei dubbi e non utilizzato come temperatura operativa.
- Nuova voce Ricettario: ricerca per ingredienti/nome, categorie, stato senza risultati, dettagli, moltiplicatore dosi, download JSON. Il moltiplicatore cambia quantità e resa; non cambia tempi e temperature né riempie i mancanti.
- Catalogo statico separato dal diario: nessuna modifica ai dati del browser o migrazione. Consultare una ricetta non significa consumarla e non produce calorie registrate.
- Verifiche aggiornate: **22 test automatici superati** (15 precedenti + 7 su catalogo, copertura, dosi, nutrienti, casi ambigui, ricerca e caricamento); **85 controlli browser ricettario superati**, inclusa apertura di tutte le 34 guide e fonti, retry dopo HTTP 503, filtri, moltiplicazione dosi, macro incoerenti, export e layout 320/390 px; **20 controlli browser del diario** ancora superati.
- Ispezione visiva desktop 1440 px e mobile 390 px; corretto un elemento informativo desktop che appariva sovrapposto nella navigazione mobile. Zero errori console imprevisti. Screenshot ricettario in test-results/, esclusi da Git.
- `python scripts/verify_pack.py`: 31 immagini con hash integri, tutte con esito di lettura e collegamenti; 34 ricette. Fonti V21 e immagini senza differenze Git. I metadati originali delle immagini sono conservati; sono aggiornati soltanto esito di lettura e collegamenti.
- Riproducibilità: `node scripts/build-recipe-catalog.mjs` rigenera i dati e l'audit dalle trascrizioni manuali; non riscrive le immagini.

La lettura delle fonti è completa; ciò non equivale a validazione nutrizionale o prova pratica delle ricette. Restano esplicite le lacune presenti nelle immagini. Il menu pianificato è stato aggiunto nella versione 0.3; consumi, extra, spesa e dispensa restano da implementare.

## Fondazione completata nella versione 0.1

- Letti START_HERE, README, VISION, AGENTS e tutti i documenti iniziali in docs; riscontrati nel prototipo storage per giorno numerico, risultati non separati e formule storiche non utilizzabili come specifica approvata.
- Repository Git locale; checkpoint del pacchetto originale `3b6ff9b`, prima di modificare il progetto. Originale V21, copia normalizzata e immagini conservati.
- Sito responsive locale senza framework, dipendenze, CDN o font esterni. Scelta implementativa motivata in ARCHITECTURE.md.
- Calendario mensile e settimanale con date locali complete; selezione oggi/passato/futuro, cambi mese e anno, intervallo 1900–2199.
- Cinque contenitori Total Body 1/2/3 e Cardio 1/2 editabili; esercizi e serie configurabili, target facoltativi, attrezzatura annotabile. Nessun programma o carico personale inventato.
- Piano per data, riposo e attività libera; preselezione standard applicabile esplicitamente solo alle date libere; stato saltato esplicito. Spostamento piano senza spostare risultati e senza sovrascrivere piani nella destinazione.
- Sedute bozza/completate, risultati per serie separati dai target, pesi in kg/ripetizioni e cardio in minuti. Note, durata effettiva, più sedute per data, correzioni sullo stesso record. Risultati futuri bloccati.
- Target e piani fotografano la versione della scheda; le modifiche al template non riscrivono lo storico.
- Salvataggio locale versionato, validazione, errori visibili, protezione modifiche non salvate e conflitti tra schede del browser. Archivio V21 lasciato intatto.
- Export JSON, anteprima import validato, ripristino esplicito con copia preventiva esatta dell'archivio corrente, download delle copie e dei byte originali. Recupero da contenuto corrotto senza cancellarlo.

## Verifiche della versione 0.1 (storiche)

- `npm.cmd test`: **15 test superati**. Date bisestili, cambio mese/anno e DST, limiti calendario, mezzanotte locale in Europe/Berlin, America/Los_Angeles e Pacific/Kiritimati; due lunedì indipendenti, riapertura e correzione senza duplicati; piano spostato e snapshot immutati; idempotenza settimana standard; null distinto da zero; più sedute, cardio e input invalidi; storage negato/quota; concorrenza; backup/ripristino e fallimento prima/dopo la copia; contenuto corrotto; import invalido e versioni non supportate.
- Browser Chromium, contesto isolato con fuso Europe/Berlin: **20 controlli superati**, descritti in `scripts/browser-qa.js`. Configurazione scheda, due lunedì 19/26 ottobre con 39/42 kg (dati sintetici esclusivamente di test), riapertura, correzione, spostamento piano, congelamento target, protezione di altri moduli sporchi, quota simulata, import malformato, ripristino e copia preventiva, download, cardio, cambio anno, estremo 2199, mobile senza overflow, etichette accessibili, zero errori console/JavaScript.
- Risolto durante QA un errore sul riepilogo della settimana finale del 2199 (settimana incompleta al limite del calendario).
- Ispezione visiva desktop 1440 px e mobile 390 px. Screenshot locali in `test-results/` (esclusi da Git).
- Server locale: risposta HTTP 200. Controlli sintattici dei moduli con Node.
- `python scripts/verify_pack.py`: 31 immagini con hash originali integri e documenti presenti. Confronto Git delle fonti preservate.

## Ancora da completare / non verificato

- Fase 2: le schede storiche sono ora preimpostate; restano completamento di programmi Total Body coerenti con vincoli attuali, ultima prestazione comparabile, rispetto target e grafici settimanali. Il recupero della V21 non è una validazione scientifica.
- Fase 3: ricettario e menu pianificato in dose singola per data disponibili; restano consumo effettivo, extra e relativo diario. Nessun consumo dedotto dalla pianificazione.
- Fasi 4/5: profilo e obiettivi attuali, macro, monitor energia/peso e forza/prestazioni, modelli scientifici da validare con fonti primarie prima dell'uso, benchmark, progressione, dispensa e confezioni. Planner settimanale e spesa aggregata disponibili dalla versione 0.4.
- Nessuna migrazione legacy automatica o trasformazione dello storico V21 in prestazioni. Versioni future del backup non supportate.
- Nessun test su telefono fisico, Safari/Firefox, screen reader reale, modalità privata o quota reale satura. Etichette, focus visibile, skip link, stati testuali, rispetto reduced motion e layout responsive presenti; non è una certificazione completa WCAG.
- Nessuna garanzia di persistenza se si cancellano i dati del browser. Nessuna sincronizzazione tra dispositivi, hosting o modalità offline/installabile.

## Prossimo passo

Per completare il flusso alimentazione: dispensa con sottrazione in unità compatibili e confezioni; conferma dei pasti consumati, extra e copertura del diario. Sul versante allenamento: ultima prestazione comparabile, raggiungimento target e grafici per esercizio. Le formule avanzate rimangono disattivate fino alla verifica delle fonti.
