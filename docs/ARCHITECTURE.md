# Architettura di Coach OS

## Decisione implementativa reversibile

Moduli JavaScript nativi, senza framework o dipendenze. La proposta iniziale TypeScript non era un requisito approvato: per la fondazione locale è stata preferita una soluzione senza compilazione né installazione. La separazione tra dominio, persistenza e interfaccia permette una futura introduzione di TypeScript o componenti senza riscrivere il formato dei dati.

- `index.html`: struttura, navigazione e accesso al contenuto.
- `src/styles.css`: stile scuro, layout desktop e navigazione mobile.
- `src/domain.js`: date, schema, validazione, piani e sedute; nessun accesso al DOM o storage.
- `src/storage.js`: repository locale, concorrenza, backup e ripristino.
- `src/app.js`: moduli, calendario, editor schede e diario.
- `src/recipes.js`: caricamento e validazione del catalogo statico, ricerca, moltiplicazione dosi, interfaccia con provenienza e incertezze.
- `src/ui.js` e `src/app-theme.css`: icone/illustrazioni SVG locali e tema visivo della versione 0.3, sovrapposto agli stili strutturali. Nessuna dipendenza di rete.
- `src/meals.js` e `src/meal-ui.js`: snapshot ricette, dose singola, validazione e menu pianificato per data.
- `src/metric.js` e `src/portion-ui.js`: conversioni metriche esatte, misure confermate separate dalla fonte, divisione della preparazione distinta dalle persone, anteprima e moduli dei pesi. Nessuna densità implicita o migrazione automatica delle porzioni.
- `src/presets.js` e `src/templates-ui.js`: basi storiche V21, aggiornamento conservativo dei contenitori e gestione di nuove schede personali.
- `src/planner.js`, `src/planner-ui.js`, `src/planner.css`: operazioni atomiche sul menu settimanale, selettore ricette e interfaccia menu/spesa.
- `src/shopping.js`: aggregazione conservativa da snapshot, conversioni di unità esplicite, firme delle spunte ed esportazione in testo.
- `scripts/build-recipe-catalog.mjs`: dati trascritti manualmente dalle immagini e generazione riproducibile del catalogo e dell'audit delle fonti.
- `scripts/serve.mjs`: server di sviluppo solo su loopback, senza servizi esterni.
- `tests/domain.test.js`: test nativi Node, senza processi figli.
- `scripts/browser-qa.js`: funzione Playwright per lo strumento browser; contesto isolato, non dipende dal profilo personale. Usa la data della consegna 2026-10-29 e percorsi locali per gli screenshot; per riutilizzarla altrove aggiornare questi riferimenti.

## Archivio

Chiave `coach_os_v1`, formato `schemaVersion: 1`, revisione e timestamp di audit. Nessuna migrazione nella prima versione. `coach_v21` rimane intatta e separata. `updatedAt` può usare UTC: non è una chiave del diario. Le date civili si costruiscono con anno/mese/giorno locali, senza `toISOString()`.

`templates` conserva cinque schede editabili, ciascuna con ID e versione corrente. Non si tratta ancora di tre programmi Total Body completi approvati. Le modalità iniziali sono pesi/corpo libero (kg e ripetizioni) e cardio (minuti). Il campo attrezzatura/convenzione esplicita il significato del carico; gli esercizi hanno ID stabili. Le convenzioni non alimentano ancora confronti o formule.

`days[YYYY-MM-DD]` contiene piano, note e un array di sedute. Il piano conserva una copia della versione della scheda al momento dell'assegnazione. La seduta conserva un'ulteriore copia indipendente dei target e un array di risultati separati per serie, inizialmente null. Una modifica della scheda non altera piani o sedute esistenti. Per aggiornare il piano si riassegna la scheda. Le correzioni usano l'ID della seduta, senza appendere duplicati. Più sedute per data sono supportate; una sola bozza aperta per data.

Una seduta completata richiede almeno un risultato positivo (ripetizioni o minuti) oppure una durata positiva. Non implica che tutti i target siano raggiunti né che tutti i campi siano compilati: i mancanti restano null. La bozza resta uno stato distinto. Riposo è un piano; saltato è una scelta esplicita. Un giorno privo di dati non genera risultati nulli, calorie o fallimenti.

## Affidabilità

Prima di ogni scrittura: copia dello stato, validazione, controllo che i byte dello storage non siano cambiati da un'altra scheda, serializzazione e scrittura. Lo stato visibile viene aggiornato soltanto dopo il successo di `setItem`. Gli errori mantengono il modulo compilato e non mostrano falso successo. Le modifiche non salvate sono protette durante navigazione, chiusura e salvataggio di altri moduli.

L'import legge e valida un file di massimo 5 MB, mostra il riepilogo, poi sostituisce l'intero archivio su azione esplicita. Prima scrive una copia esatta dei byte attuali in `coach_os_backup_<uuid>` e ne verifica la lettura. Se la copia o la successiva scrittura falliscono, lo stato precedente rimane. Le copie sono scaricabili e non vengono cancellate automaticamente. I ripristini possono esaurire la quota del browser: in tal caso esportare i dati e mantenere l'archivio corrente.

JSON corrotto: scritture ordinarie bloccate, byte originali scaricabili, recupero consentito solo da backup valido con copia preventiva anche del contenuto corrotto. Accesso storage negato: nessuna persistenza promessa. Versioni sconosciute, date impossibili, quantità fuori intervallo, ID duplicati e strutture incoerenti vengono rifiutati. Una futura migrazione dovrà essere esplicita e con backup, senza dedurre prestazioni dalla V21.

## Limiti intenzionali

Nessun backend, accesso personale, sincronizzazione, garanzia offline/installabilità, stima forza, progressione o dispendio. Il server locale non espone l'app in LAN. L'esportazione è il modo previsto per trasferire dati.

## Ricettario aggiunto nella versione 0.2

Catalogo statico `data/recipes.json`: 34 ricette da tutte le 31 immagini lette, con ID e versione, ingredienti, quantità singole o intervalli, resa, guide e fonti. La navigazione nel ricettario non scrive nel diario, non cambia lo schema del browser e non richiede migrazioni. Catalogo e stato fonti sono file del progetto, indipendenti dai dati personali esportati. Le dosi selezionate e i filtri sono temporanei; nessun pasto viene registrato automaticamente.

I nutrienti rimangono dichiarazioni delle fonti. Se la base è ignota o i macro sono incoerenti, non viene derivato un totale. Null non viene mai convertito in zero. I moltiplicatori aggiornano ingredienti e resa; note e passaggi sono esplicitamente riferiti a ×1, tempi e temperature non si moltiplicano. Collegamenti bidirezionali fonte/ricetta e recupero completo sono verificati da test e audit in RECIPE_REVIEW.md.

## Menu e schede nella versione 0.3

Estensione compatibile del formato 1: `days[date].meals` è opzionale. Ogni voce contiene ID, slot breakfast/lunch/dinner, stato planned, quantità 1, numero di porzioni dell'intera ricetta e snapshot originale (ingredienti, resa, nutrienti, fonti, dubbi). I backup precedenti senza meals sono validi. Non viene creata una registrazione di consumo.

La dose è la quantità originale divisa per batchPortions, intero 1–1000. I valori assenti restano null e gli intervalli vengono divisi su entrambi gli estremi. I nutrienti derivati usano la stessa regola aritmetica del ricettario, con base esplicita e dati non incoerenti: per dati per unità si ricostruisce il totale usando la resa originale e poi si divide per le porzioni scelte. Non vengono assegnate kcal zero a pasti senza macro. Ogni voce può essere corretta conservando ID e snapshot; il carico del catalogo aggiorna soltanto il blocco menu, preservando eventuali altri moduli compilati.

Le basi V21 hanno ID stabili, serie/reps/minuti originari e campo `legacyReference` per i carichi presenti nel prototipo. I kg target sono null finché impostati dall'utente. Non si deduce un benchmark o una performance datata. Per il nuovo archivio i cinque template sono già popolati. Per un archivio esistente si aggiornano soltanto i contenitori standard mai modificati; prima viene scritto e verificato un backup esatto dei byte correnti. Se non riesce, l'archivio rimane intatto e l'errore è visibile. Nessun'altra scheda, piano o seduta viene aggiornato automaticamente. La stessa regola si applica ripristinando un vecchio backup con contenitori originali.

Le schede personali si creano vuote o duplicando schede correnti/basi V21, con ID indipendente e nome libero univoco senza distinzione di maiuscole. Rinomina e salvataggio incrementano la versione; i vecchi snapshot non cambiano. Nomi dei cinque ID standard possono essere modificati senza interrompere la preselezione settimanale, che usa gli ID.

## Planner e spesa nella versione 0.4

I sette giorni non introducono un secondo archivio di menu: la vista usa sempre days[date].meals. Pianificazione multipla e copia di settimana validano tutte le destinazioni prima delle modifiche e passano attraverso il repository transazionale. La copia salta i pasti già popolati, mantiene gli snapshot e genera nuovi ID. Il caricamento asincrono del catalogo aggiorna soltanto il planner e la sezione menu, preservando gli altri moduli compilati.

Il calcolo della spesa è puro e derivato dalla settimana locale. La chiave di aggregazione comprende nome normalizzato, unità e stato crudo/cotto; sono convertiti soltanto g/kg e ml/l e alias espliciti. Gli intervalli si sommano per estremi e null rimane assente. Ogni riga traccia gli usi per data/pasto/ricetta e le note originali. Dati dubbi e facoltativi sono gestiti esplicitamente. Dettagli in SHOPPING_RULES.md.

Campo opzionale shoppingWeeks[weekStart] nel formato 1: includeOptional booleano e checked (firme di righe). Ogni firma include quantità ed eventuali dosi sconosciute; se il fabbisogno cambia, una spunta della quantità precedente non si applica. Queste preferenze sono validate e incluse nell'export del repository; l'aggregazione non scrive né migra dati alla consultazione. La lista stessa non viene duplicata nello storage. Non è una dispensa e non modifica consumi o nutrienti.

Il selettore usa dialog nativo con etichette, ricerca filtrata, giorni selezionabili, focus confinato e annullamento tramite Escape. Le spunte hanno etichette e stato accessibili. L'esportazione TXT rimane disponibile anche se la clipboard non è utilizzabile.

## Distribuzione statica

scripts/build-site.mjs prepara dist con una lista esplicita di cartelle/file dell'app e verifica gli hash delle immagini prima di copiare. La sola cartella rigenerata è dist dentro il progetto; collegamenti simbolici sono rifiutati. scripts/verify-site.mjs verifica la lista dei file pubblicabili, riferimenti HTML/import, catalogo e immagini. Gli URL delle fonti e del catalogo dipendono da import.meta.url, perciò non richiedono un base path compilato.

Il server locale supporta --dist, --base /coach-os/ e --port 5180 per provare la build sotto lo stesso tipo di percorso usato da GitHub Pages. .github/workflows/checks.yml controlla push/PR; pages.yml pubblica soltanto su workflow_dispatch dal branch predefinito. I runner e il deploy remoti rimangono da provare sul repository GitHub reale. Nessun dato locale del browser fa parte della build.
