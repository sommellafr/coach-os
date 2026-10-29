# Verifiche del pacchetto

- 31 file immagine presenti e aperti/verificati con Pillow; contenuti culinari non ancora letti.
- Hash SHA-256 di ogni immagine uguale ai byte nello ZIP originale.
- Copia del Markdown originale identica byte per byte alla fonte.
- Normalizzazione degli escape Markdown e degli spazi non separabili nella copia HTML; nessuna modifica funzionale intenzionale.
- Sintassi dei 2 script inline della copia HTML verificata con `node --check`: superata.
- Verifica integrità pacchetto con `python scripts/verify_pack.py`: superata alla preparazione.
- Archivio ZIP verificato per integrità e presenza delle fonti.

Non eseguiti: avvio browser, flussi UI, accuratezza nutrizionale, validazione scientifica delle formule o implementazione delle nuove funzioni. Questi controlli spettano alle fasi di sviluppo.

## Sviluppo del 29 ottobre 2026 — fase 1

La sezione precedente documenta soltanto il pacchetto originale. Sono ora disponibili 15 test automatici su dominio/persistenza e 20 controlli browser, tutti superati. Verificati anche sintassi dei moduli, risposta HTTP 200, layout desktop/mobile e integrità delle 31 immagini. Dettagli e limiti in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md). Accuratezza nutrizionale, modelli scientifici e lettura delle immagini rimangono da affrontare nelle rispettive fasi.

## Versione 0.2 — ricettario

Lette tutte le 31 immagini, recuperate 34 ricette distinte: esito e lacune in [RECIPE_REVIEW.md](RECIPE_REVIEW.md). Suite aggiornata: 22 test automatici superati, 85 controlli browser ricettario e 20 controlli browser del diario superati. Provati anche errore HTTP/retry, ricerca e categorie, tutte le guide/fonti, dosi doppie e intervalli, null, totali non calcolabili, export, layout 320/390 px, non alterazione dei dati locali e integrità degli originali. Accuratezza nutrizionale indipendente, prove reali in cucina, telefono fisico, altri browser e screen reader non verificati. Nessuna validazione scientifica avanzata introdotta.

## Versione 0.3 — grafica, menu per data, schede preimpostate e personali

39 test automatici superati; 45 nuovi controlli browser su menu e schede, più i 20 del diario e gli 85 del ricettario ancora superati. `scripts/browser-planning-qa.js` verifica le cinque basi, carichi storici separati, dosi singole in tre pasti, resa assente, correzioni, rimozioni, quota, ricarica, ripristino, snapshot, nuove schede/nomi e tutte le schermate a 1440/768/390/320 px. Gli esercizi dello script di regressione del diario sono stati adattati alle basi ora preimpostate, conservando i medesimi scenari di salvataggio/correzione.

Provato con unit test l'aggiornamento conservativo dei contenitori vuoti, con backup esatto precedente, fallimento della copia e idempotenza; le schede personalizzate rimangono intatte. Controllati sintassi dei nove moduli, integrità delle 31 immagini e nessuna modifica a reference o ai dati ricette. Screenshot desktop/mobile locali in test-results/, esclusi dal repository. Nessuna prova di prestazioni fisiche reali, accuratezza nutrizionale, dispositivi reali o accessibilità con screen reader.

## Versione 0.4 — planner settimanale e spesa

50 test automatici superati; 48 nuovi controlli browser in `scripts/browser-weekly-qa.js`, più i 150 controlli precedenti del diario, del ricettario e della pianificazione/schede. Verificati selezione rapida, ricerca, ripetizione su più giorni, dose mancante, copia della settimana, aggregazione da dosi singole, correzioni/rimozioni, persistenza spunte, invalidazione della spunta al cambio quantità, facoltativi, file TXT con contenuto, copia con clipboard simulata, errore di quota e recupero visivo, annullamento senza dati e focus del dialog.

Verificati menu/spesa/dialog a 1440/768/390/320 px, nessun overflow della pagina e righe dei pasti allineate sul desktop. Il menu può scorrere orizzontalmente su schermi stretti. Invariati i limiti su dispositivi reali, altri browser, screen reader e copie su clipboard reale. Controllati sintassi dei 12 moduli e hash delle immagini. Nessun modello scientifico aggiunto.

## Preparazione GitHub Pages

50 test automatici ancora superati. Build in dist e verifica statica dei 51 file superate, compresi import/percorsi, catalogo e 31 hash. Sito provato servendo la sola build sotto /coach-os/ sulla porta 5180, senza fallback delle risorse alla radice: 10 controlli browser in scripts/browser-pages-qa.js superati, inclusi salvataggio menu, spesa, schede, immagine originale HTTP 200 e mobile. Workflow preparati secondo le fonti ufficiali ma non eseguiti su GitHub; nessuna pubblicazione remota dichiarata come verificata.
