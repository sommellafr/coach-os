# Roadmap e criteri di accettazione

## Fase 0 — recupero e impostazione
Conservare fonti, verificare baseline, scegliere stack essenziale, avviare Git. Proposta: TypeScript e componenti separati, persistenza locale versionata; framework e motore storage da scegliere in base al contesto. Nessun backend obbligatorio per la prima fase. Preparare comandi di installazione/avvio e stato implementazione.

## Fase 1 — calendario e dati (prima consegna funzionante)
Implementare date reali, scelta template, bozza/completamento e persistenza. Includere input serie con target/risultato separati, backup e ripristino. Layout iniziale usabile da telefono.
Verificare: registrare lunedì e lunedì successivo con valori diversi; ricaricare e ritrovarli; assegnare Total Body 1 a martedì senza cambiare la seduta storica; correggere il passato senza duplicare; gestire cambio mese/anno e fusi vicino a mezzanotte; fallimento storage segnalato senza falso successo; backup e ripristino equivalenti; import malformato non distruttivo.

## Fase 2 — schede e prestazioni
Completare tre Total Body e due cardio, previa definizione coerente degli esercizi; mostrare precedente seduta, delta e grafici per esercizio/settimana.
Verificare: 39 su target 40 a pari volume => 97,5% e −2,5%; target zero => non calcolabile; dato mancante distinto da zero; confronti separati per attrezzatura diversa; cardio in minuti, non reps; modifica template non altera target passati; settimana senza sedute non produce falso calo.

## Fase 3 — ricette e diario
Leggere tutte le 31 immagini, completare catalogo con provenienza, inserire porzioni, pasti consumati/pianificati ed extra editabili.
Verificare: ogni immagine ha esito di lettura, tutte le ricette distinte sono censite, unità e porzioni coerenti, ingredienti non leggibili segnalati, nessun dato inventato. Due porzioni raddoppiano quantità e nutrizione solo dove disponibili; un piano futuro non aggiunge calorie consumate; modifica ricetta non altera storico pasti.

## Fase 4 — energia e peso
Scegliere e documentare modello energetico; aggiungere due monitor navigabili, bilanci giornalieri/settimanali, cumulato e peso.
Verificare: dispendio 2400 e consumo 2000 => deficit +400; giorno successivo −200 => cumulato +200; giorno non registrato escluso con copertura visibile; seduta non svolta non aggiunge consumo consuntivo; nessun doppio conteggio; correzione passata aggiorna riepiloghi una volta; grafici allineati ai dati tabellari.

## Fase 5 — suggerimenti e planner completo
Benchmark, inattività, progressione spiegata e modificabile; lista spesa con dispensa, confezioni e unità.
Verificare: assenza benchmark non blocca diario; incremento compatibile con attrezzatura; seduta incompleta non produce aumento automatico; stesso ingrediente aggregato in unità compatibili; 500 g richiesti e 200 g disponibili => acquisto 300 g prima di arrotondamento confezioni.

## Fase 6 — consolidamento
Verifica mobile/desktop, accessibilità, documentazione uso, eventuale offline e sincronizzazione solo se concordati. Pubblicazione separata e richiesta esplicitamente dall'utente.

## Registro del lavoro
Codex deve creare docs/IMPLEMENTATION_STATUS.md con fase, funzioni completate, prove eseguite, limitazioni e prossimo passo. I documenti presenti nel pacchetto non certificano implementazioni future.
