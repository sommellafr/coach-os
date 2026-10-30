# Coach OS — diario personale

Piano delle prossime migliorie: [registrazione rapida, prodotti, schede, menu mensile e Fat Bank](docs/NEXT_IMPROVEMENTS.md). Priorità: risparmiare tempo nell'uso quotidiano. Le prime due fasi sono implementate nella 0.6.0; le successive restano pianificate.

## Pronto per GitHub e GitHub Pages

Guida completa con i comandi per Windows: **[Pubblicare su GitHub Pages](docs/GITHUB_PAGES.md)**.

Sono inclusi controlli automatici su push/PR e un workflow di pubblicazione **manuale**. `npm.cmd run build` prepara `dist/`; `npm.cmd run verify:site` ne controlla risorse e integrità. `npm.cmd run preview` apre una prova sotto `http://127.0.0.1:5180/coach-os/`, come un sito di progetto GitHub Pages. Nessuna installazione di dipendenze necessaria.

Prima del passaggio dal sito locale a quello GitHub, esportare il diario da **Profilo e dati** e ripristinarlo nel nuovo indirizzo. GitHub ospita l'app; il diario rimane nel browser e non si sincronizza tra dispositivi. Sito pubblicato su GitHub Pages: https://sommellafr.github.io/coach-os/.

## Versione 0.5.0 · porzioni, confezioni e dispensa

**Novità 0.6.0:** da **Oggi → Aggiungi pasto** registri alimenti singoli, quantità in g/ml e pasti composti, con totali kcal e macro. Recenti, preferiti e pasti abituali evitano di riscrivere i valori. Puoi scansionare il codice a barre o digitarlo per cercare gratuitamente su Open Food Facts; in alternativa inserisci i valori dell'etichetta per 100 g/ml. La ricerca per nome riguarda i tuoi alimenti salvati. È disponibile anche nel Calendario per la data consultata. Diario consumato distinto dai menu pianificati e dalla dispensa. Dettagli, licenze e limiti: [Diario alimentare](docs/FOOD_DIARY.md).

Tutte le 34 ricette si aprono con le dosi per **1 porzione**. Nel calendario scegli soltanto **Quante porzioni vuoi preparare?**, da 1 a 20; per esempio il burrito parte da 170 g di manzo, due porzioni da 340 g. Le rese assenti o espresse in pezzi hanno una base redazionale dichiarata, modificabile in futuro: non sono porzioni nutrizionali validate.

In **Pasti → Lista della spesa** trovi fabbisogno, scorte e confezioni da acquistare: 50 g di farina possono richiedere una confezione da 1 kg. Il formato è modificabile; i riferimenti italiani sono esempi documentati, non minimi universali. **Ho acquistato** carica le confezioni nella dispensa. In **Pasti → Dispensa** registri ciò che hai davvero e consulti quantità riservate e previsione di esaurimento. **Ho preparato** sul piatto scala gli ingredienti misurabili, con conferma e annullamento. Pianificare un pasto riserva gli ingredienti senza consumarli.

I pesi inseriti manualmente sono ora **per una porzione**. Cup, pezzi e quantità ambigue richiedono una misura reale in g/ml; non si inventano densità. Le fonti, gli snapshot e i menu salvati restano conservati. Eventuali vecchie divisioni discordanti si correggono con anteprima e backup. Dettagli, provenienza, casi limite e verifiche: [Porzioni e dispensa](docs/PANTRY_AND_PACKAGES.md).

Le sezioni sulle versioni 0.4 sotto sono storico: i vecchi campi sul lotto e la lista a spunte sono sostituiti da questo flusso.

**Correzione 0.4.2 — giorno del calendario:** dopo scelta, salvataggio o annullamento di una ricetta, il calendario mantiene il giorno da cui sei partito e lo riporta in vista, anche se hai aggiunto il piatto a più giorni. Lo stesso giorno resta selezionato passando tra Pasti, Calendario, Spesa e Oggi nella sessione. All'apertura il giorno proposto è oggi fino alle 20:59 e domani dalle 21:00, nell'ora locale del dispositivo. Una data scelta manualmente rimane ferma; **Giorno proposto** riattiva la regola automatica. La schermata Oggi e le registrazioni conservano la data civile reale. La scelta della giornata non viene salvata nel diario o imposta alle voci già registrate.

**Correzione 0.4.3 — tutti i giorni raggiungibili:** sopra il menu è disponibile **Scegli il giorno · tutta la settimana**, con sette pulsanti e il numero di ricette pianificate per ciascuna data. Sul telefono sono disposti su due righe, senza scorrimento orizzontale. Tocca lunedì, martedì o un altro giorno per aprirlo, mantenendo il giorno selezionato quando torni dalla scelta di una ricetta. Il contatore riguarda le ricette pianificate, non alimenti consumati. Nessun pasto viene copiato o modificato automaticamente. La guida ai pasti è apribile; la griglia resta scorribile in entrambe le direzioni.

**Correzione 0.4.1 — porzioni e pesi:** ogni pasto parte da una porzione per te. La divisione di una ricetta con resa nota è automatica; gli ospiti si impostano separatamente in **Preparo anche per altre persone**. Se avevi inserito 1 al posto delle porzioni dell'intera preparazione, in Menu e spesa compare **Correggi le porzioni di questa settimana**, con riepilogo e backup prima della conferma. Le rese in pezzi/strisce/polpette richiedono invece il numero di pasti ricavati.

La spesa usa **g o ml**. Oz di massa vengono convertite esattamente; cup, cucchiai, pezzi e dosi senza peso compaiono in **Pesi e volumi da confermare**. Premi **Conferma peso o volume** e indica il totale della voce della preparazione originale, da bilancia o confezione: non viene inventato un peso. Puoi applicare la misura alle altre occorrenze settimanali della stessa ricetta. Regole, limiti e casi verificati: [docs/PORTIONS_AND_METRIC.md](docs/PORTIONS_AND_METRIC.md).

## Versione locale 0.4 · pianifica la settimana e prepara la spesa

**Accesso rapido aggiornato:** aprire **Menu e spesa** dalla navigazione, oppure **Scegli i pasti** / **Lista della spesa** in Oggi. La pagina dedicata mostra il menu e gli ingredienti della settimana senza i moduli di allenamento. La guida in tre passaggi spiega scelta delle ricette, ripetizione su più giorni e spesa. Calendario conserva gli stessi dati e gli accessi già presenti.

**Ricette per pasto:** scegliendo Colazione si vedono soltanto le ricette etichettate Colazione; Pranzo e Cena mostrano quelle con la rispettiva etichetta. Il filtro vale nel selettore settimanale, nella ricerca per ingrediente e nei menu del singolo giorno. Nel Ricettario sono visibili le etichette ed è disponibile il filtro **Pasto**. Classificazione redazionale iniziale: 7 ricette Colazione e 27 Pranzo + Cena; non è una prescrizione nutrizionale. Dettagli in [docs/RECIPE_MEAL_TAGS.md](docs/RECIPE_MEAL_TAGS.md). I pasti già salvati rimangono consultabili anche quando non corrispondono alle nuove etichette.

**Smartphone:** navigazione inferiore con nomi brevi (Oggi, Agenda, Pasti, Schede, Ricette, Dati), controlli principali dei pasti e della spesa da almeno 44 px, data leggibile e selettore ricette utilizzabile anche in orizzontale. Verificato con touch simulato a 320/360/390/430 px e 844×390, non su telefono fisico o Safari. Dettagli e limiti in [docs/MOBILE_VALIDATION.md](docs/MOBILE_VALIDATION.md).

Il percorso principale è **Calendario → Menu settimanale → Lista della spesa**. Da Oggi, **Pianifica la settimana** apre direttamente il calendario. I sette giorni mostrano colazione, pranzo e cena insieme; sul telefono il menu scorre orizzontalmente. Il calendario mensile rimane disponibile in una sezione apribile.

1. Tocca **Scegli ricetta** nella casella del pasto e del giorno.
2. Cerca per nome o ingrediente, scegli il piatto e conferma per quante porzioni dividere le dosi originali. Se la fonte non indica la resa, inseriscila tu.
3. Se vuoi ripetere il piatto, seleziona anche gli altri giorni e salva una dose per giorno con una sola azione.
4. Apri **Lista della spesa**: gli ingredienti vengono aggregati dalle singole dosi effettivamente pianificate. Puoi includere i facoltativi, spuntare gli acquisti e copiare o scaricare la lista in testo.
5. Per riusare le scelte, **Riusa menu la prossima settimana** copia soltanto nei pasti ancora vuoti, senza sovrascrivere menu o allenamenti esistenti.

Grammi/kg e ml/l vengono uniti; unità incompatibili e pesi crudi/cotti restano separati. Le quantità mancanti e i q.b. sono in **dosi da valutare a mano**. Una correzione del menu ricalcola la lista; se cambia il fabbisogno di una voce, la vecchia spunta non copre automaticamente la nuova quantità. Spunte e preferenza sui facoltativi sono salvate per settimana e incluse nei backup. Nessuna conversione di densità, costo, arrotondamento confezioni o sottrazione automatica della dispensa è applicata.

Dettagli delle regole: [docs/SHOPPING_RULES.md](docs/SHOPPING_RULES.md).

Calendario con date reali, diario per serie con target e risultati distinti, menu per colazione/pranzo/cena in dose singola, note, spostamento piani, salvataggio locale, backup e ripristino. Interfaccia scura rinnovata con icone SVG locali, accessi rapidi e navigazione mobile flottante.

**Schede pronte dalla V21:** Total Body 1 (panca, rematore, trazioni), Total Body 2 (squat, military), Total Body 3 (stacco, dips), Cardio 1/2 (tapis roulant, 60 min in entrambi i giorni della fonte). Serie, ripetizioni e durata sono recuperate dal prototipo e modificabili; i carichi storici sono riferimenti separati, i target kg sono da impostare. Sono le composizioni disponibili nella fonte, non tre programmi Total Body completi e validati. Non sono state inventate sedute eseguite o esercizi di versioni non disponibili.

In **Le mie schede** puoi creare schede con un nome libero, partire da zero o duplicare una scheda esistente/una base V21. Puoi rinominarle, aggiungere/rimuovere esercizi e modificare le serie. Le trovi subito nella scelta del calendario. Gli eventuali contenitori originali mai modificati delle versioni 0.1/0.2 sono popolati automaticamente solo dopo una copia di sicurezza esatta; schede personalizzate e storico restano intatti. Copie scaricabili in **Profilo e dati**.

**Ricettario disponibile:** lette tutte le 31 immagini, recuperate 34 ricette distinte, accorpato il duplicato delle crêpes. Aprire **Ricettario**, cercare un ingrediente o una categoria e aprire una ricetta. Ogni scheda mostra dosi modificabili, passaggi numerati con provenienza, nutrienti dichiarati quando disponibili, informazioni mancanti e immagini originali. Il moltiplicatore cambia le dosi dell'intera preparazione; quantità sconosciute e tempi rimangono tali. I passaggi e le note numeriche descrivono la preparazione originale a ×1.

Le aggiunte redazionali sono esplicite. I nutrienti non sono stati verificati o inventati: base ignota e valori incoerenti impediscono il totale derivato. Le 34 ricette sono anche scaricabili in JSON. Inventario delle fonti e dubbi: [docs/RECIPE_REVIEW.md](docs/RECIPE_REVIEW.md).

### Avvio su Windows

Richiede Node.js 22.8 o successivo (verificato con 24.21). Da PowerShell nella cartella del progetto:

```powershell
npm.cmd run dev
```

Aprire **http://127.0.0.1:5173** nel browser. Arrestare con `Ctrl+C`. Non serve `npm install`: non ci sono dipendenze. Usare `npm.cmd` evita il blocco degli script PowerShell `npm.ps1`; non serve cambiare le policy del PC. Alternativa: `node scripts/serve.mjs`.

```powershell
npm.cmd test
npm.cmd run check
python scripts/verify_pack.py
```

### Primo utilizzo

1. Aprire **Le mie schede**, scegliere una base V21 oppure creare una scheda personale, adattare i target e salvare.
2. In **Calendario** scegliere una data e un piano, oppure applicare la settimana standard alle date libere.
3. Avviare la seduta, compilare i risultati effettivi e salvare come bozza o completata. Si può correggere il passato. Nel futuro si pianifica soltanto.
4. **Sposta** cambia soltanto la data del piano. Le sedute e le note rimangono nella data originale. Un piano già presente nella destinazione impedisce la sovrascrittura.
5. Esportare regolarmente da **Profilo e dati**. Il ripristino mostra un riepilogo e conserva una copia precedente sul browser prima di sostituire l'archivio.

### Menu in dose singola

In **Calendario**, selezionare una data e scendere a **La giornata a tavola**. Nei tre spazi Colazione, Pranzo e Cena scegliere la ricetta. Il numero di porzioni delle dosi originali viene proposto dalla resa della fonte, quando presente, ed è modificabile; se manca va specificato prima di aggiungere il piatto. Per esempio, 150 g di pasta per due diventano 75 g nella dose salvata. Le unità di resa (burrito, strisce, bicchieri) sono mostrate: si può ridefinire per quanti pasti dividere la preparazione.

Ogni aggiunta salva una sola dose. Si possono aggiungere più ricette nello stesso pasto, correggere la divisione delle dosi, spostare tra i tre pasti o rimuovere una voce. Ingredienti e nutrienti originali sono conservati come snapshot; modificare il catalogo non riscrive il menu. I dati mancanti restano mancanti. Tempi e temperature non si dividono. I pasti sono **pianificati**, anche per date future; non vengono contati come alimenti consumati. Le voci della data si vedono anche in Oggi. Backup/ripristino includono i menu.

I dati rimangono nel browser usato e nell'indirizzo esatto `http://127.0.0.1:5173`: `localhost`, un'altra porta o un altro browser hanno archivi diversi. Non aprire `index.html` direttamente con `file://`. Non è ancora prevista sincronizzazione con il telefono o tra dispositivi. Il server di sviluppo accetta soltanto connessioni da questo PC.

La chiave storica `coach_v21` non viene modificata: se presente può essere esportata nel formato originale. Non viene migrata automaticamente. I backup di formato sconosciuto vengono rifiutati senza modificare i dati. Le copie di sicurezza locali non sostituiscono un file esportato.

Restano conferma dei pasti effettivamente consumati ed extra, profilo e obiettivi attuali, monitor energia/peso e prestazioni, dispensa e confezioni, benchmark e suggerimenti con formule da validare. Planner settimanale e lista della spesa sono disponibili. Nessuna formula storica è stata riattivata. Nessuna pubblicazione eseguita.

Stato, prove e prossimo passo: [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md). Struttura tecnica: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Pacchetto di partenza originale

Preparato il 29 ottobre 2026. Lingua prodotto e documentazione: italiano.

## Avvio
1. Estrarre questo ZIP in una cartella personale e aprire `CoachOS_Codex` in VS Code.
2. Aprire Codex e incollare `START_HERE.md`.
3. Leggere `VISION.md`, `AGENTS.md` e i documenti in `docs/`.
4. Creare un repository Git locale e un commit iniziale prima di modificare i file.

Il pacchetto iniziale era una consegna di analisi, senza una nuova app. La versione ora implementata è descritta sopra. `reference/coach-v21-normalized.html` rimane una copia ripulita del prototipo, non una release corretta.

## Contenuto
- `VISION.md`: visione del sito, utenti, esperienza, direzione visiva e ambizione.
- `START_HERE.md`: messaggio operativo da incollare in Codex.
- `AGENTS.md`: regole per lavorare sul progetto e proteggere dati e funzioni.
- `docs/REQUIREMENTS.md`: requisiti ricostruiti dai quattro messaggi.
- `docs/BASELINE_AUDIT.md`: stato del sorgente e difetti rilevati.
- `docs/DATA_AND_METRICS.md`: modello dati e definizioni dei monitor.
- `docs/ROADMAP_AND_ACCEPTANCE.md`: fasi e scenari di verifica.
- `docs/OPEN_DECISIONS.md`: punti aperti e proposte provvisorie.
- `docs/USER_REQUESTS.md`: contenuto dei quattro messaggi storici, sintetizzato fedelmente.
- `docs/RECIPE_WORKFLOW.md`: lettura delle immagini e gestione delle ricette.
- `reference/`: originale immutato e copia con escape Markdown rimossi.
- `assets/recipes/`: tutte le 31 immagini originali, rinominate senza spazi.
- `data/recipe-sources.json`: provenienza, dimensioni, hash, esiti di lettura e collegamenti delle immagini.
- `data/recipes.json`: catalogo delle 34 ricette recuperate dalle fonti nella versione 0.2.
- `scripts/verify_pack.py`: verifica integrità delle immagini e presenza dei documenti.
- `docs/VALIDATION.md`: verifiche eseguite sul pacchetto.

## Limiti noti
Non sono disponibili le risposte di Gemini né versioni successive alla V21. Non sono disponibili esportazioni dei vecchi dati del browser. Non sono stati verificati o aggiornati i dati personali dell'utente. Nel pacchetto originale le immagini non erano state trascritte; nella versione 0.2 la lettura è completata e le informazioni mancanti sono esplicite.
