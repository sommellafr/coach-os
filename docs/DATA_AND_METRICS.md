# Dati e indicatori — proposta tecnica
Non è uno schema già implementato né una validazione scientifica delle formule.

## Entità minime
- Profile: dati confermati, obiettivi, impostazioni e versioni con validità temporale.
- Exercise: id stabile, modalità carico (bilanciere totale/manubrio singolo/macchina/corpo libero/assistito), unità, attrezzatura e comparabilità.
- WorkoutTemplate e TemplateVersion: composizione, serie target, intervalli reps, recuperi; indipendenti dalle date.
- CalendarAssignment: data locale, template/versione, stato pianificato/eseguito/saltato/riposo, eventuale spostamento.
- WorkoutSession: id, data, target congelati all'inizio, stato bozza/completata, durata effettiva, note, esercizi svolti.
- SetResult: serie target ed effettiva, kg, reps, completamento, eventuale RIR/sforzo; riscaldamento separato dalle serie allenanti.
- MealEntry: data, pianificato/consumato, ricetta/versione o alimento libero, porzioni, snapshot nutrizionale e provenienza.
- DayRecord: data `YYYY-MM-DD`, completezza diario alimentare, attività, peso, snapshot del modello energetico; revisione e timestamp.
- Recipe: id, titolo, porzioni, ingredienti strutturati, passi, tempi, provenienza, nutrizione e qualità del dato.
- InventoryItem: ingrediente e quantità in unità normalizzata.

Conservare valori derivabili come snapshot solo quando serve riproducibilità, con versione del modello. Definire esplicitamente se si permettono più sedute nella stessa data; preferenza proposta: modello già capace di contenerle.

## Calendario
Data civile locale per il raggruppamento, timestamp separati per audit. Un lunedì di questa settimana e il successivo sono record diversi. Una giornata senza compilazione è mancante; una bozza è parziale. I piani futuri non alimentano consuntivi.

## Rispetto del target
A pari esercizio, serie e reps: raggiungimento = effettivo / target × 100; delta = (effettivo / target − 1) × 100. Esempio 39/40: 97,5%, delta −2,5%.
Target 0 o dato assente: non calcolabile. Non assegnare automaticamente zero a una serie non compilata. Se serie/reps differiscono, mostrare anche completamento e volume; non presentare il solo rapporto dei kg come risultato completo. Definire e documentare la ponderazione prima di introdurre un punteggio aggregato.

## Forza e prestazione
Tenere distinti carico a pari reps, volume e massimale stimato. Se si adotta una formula e1RM, documentarne formula, dominio e limiti con fonti primarie. Confrontare esercizi e condizioni comparabili, evitare corpo libero o assistito in formule inappropriate. Grafico per esercizio prima di un indice globale. Un eventuale indice globale usa esercizi di riferimento stabili, normalizzazione e copertura visibile, non somma grezza dei kg.

## Progressione
Input possibili: risultati ultime sedute, raggiungimento intervallo reps, sforzo dichiarato, incremento minimo attrezzatura, qualità/completamento. Suggerimento modificabile con motivazione, mai aumento garantito a calendario. Benchmark storico deve avere reps e data; 65 kg non specifica da solo un massimale. Il -30% dopo 4 mesi e 45,5 kg sono soltanto un esempio aritmetico, non un carico di lavoro approvato.

## Energia
Convenzione proposta: deficit = dispendio totale stimato − assunzione registrata, positivo se deficit, negativo se surplus. Mostrare chiaramente i segni. Il dispendio deve avere una sola convenzione coerente: evitare di sommare esercizio già incluso nel fattore di attività; distinguere calorie lorde e nette dell'attività e documentare la scelta.

Durata, tipo attività, peso corporeo e intensità sono input da considerare nella revisione; niente conversione diretta kg sollevati → kcal. Metodo definitivo da verificare con fonti primarie.

Cumulato = somma algebrica dei deficit dei soli giorni con diario dichiarato completo e stima disponibile; i surplus riducono il cumulato, non vengono scartati. Mostrare giorni inclusi/esclusi. Per i giorni parziali si può mostrare un bilancio provvisorio separato.

Il coefficiente storico 7700 kcal/kg non è una previsione certa del peso. Eventuale riferimento energetico obiettivo deve essere etichettato come approssimazione e mantenuto separato dal peso misurato e dalla sua tendenza. Non fissare soglie caloriche automatiche non validate.

## Nutrizione
Conservare quantità e unità, peso crudo/cotto, numero porzioni e fonte. Distinguere calorie/porzione e calorie/intera ricetta. Valori originali, calcolati e stimati vanno riconoscibili. Dato assente = null, non zero. Modificare una ricetta non deve cambiare retroattivamente i pasti consumati.
