# Audit V21
Analisi statica del sorgente; nessuna verifica dell'interfaccia eseguita su questa baseline.

## Presente
HTML monolitico, Tailwind e icone via CDN, profilo, target macro, 7 pulsanti settimanali, schede modificabili, pasti e extra, 10 ricette, planner/spesa, dispensa JSON, localStorage `coach_v21`, archivio sintetico.

## Difetti e lacune
- Le chiavi 1..7 riutilizzano gli stessi giorni ogni settimana; data iniziale 1 (lunedì), non rilevata dalla data corrente.
- Schede: lunedì panca/rematore/trazioni, mercoledì squat/military, venerdì stacco/dips. Non sono tre Total Body completi.
- Nessun campo distinto kg target, nessun benchmark o progressione, nessuna registrazione per singola serie.
- Modificare un valore della scheda sovrascrive il solo valore disponibile, senza conservare target e risultato.
- Archivio: solo data locale generata al click, kcal assunte, nome seduta o riposo/saltato. Non conserva dettagli, né dispendio, né versione degli obiettivi. Non impedisce duplicati.
- Archiviazione azzera pasti, extra e completamento del giorno numerico; i carichi rimangono senza contesto temporale.
- Riposo programmato e allenamento saltato sono confusi.
- Calorie pesi = somma serie × ripetizioni × coefficiente; carico ignorato, nessuna durata o intensità. Venerdì 10,5 kcal, arrotondate a 11. Cardio usa lo stesso campo reps per minuti.
- Stima allenamento mostrata anche prima del completamento e non archiviata nel bilancio.
- Nessun grafico o contatore deficit cumulato.
- Ricette con istruzioni minime, ingredienti e macro da riconciliare con le immagini. Nessuna provenienza.
- Selezione pasto interpretata direttamente come consumo; solo una ricetta per categoria e nessuna porzione variabile.
- Extra non mostrati come lista modificabile nel diario.
- Dispensa caricabile ma non sottratta dalla lista spesa; catalogo confezioni parziale, unità spesso perse nella visualizzazione.
- Profilo senza validazioni; campi non ripopolati all'apertura; `months=0` causa divisione per zero. Formula metabolica usa +5 e fattore 1,35 fissi. Floor 1400 non validato.
- Cambiare profilo non crea uno snapshot storico delle assunzioni.
- JSON locale letto senza gestione di contenuto corrotto; nessun export/import, schema o migrazione.
- Dipendenze esterne: la baseline non garantisce funzionamento offline.
- Documento caricato contiene escape Markdown; copia normalizzata rimossa solo da escape e spazi non separabili, senza correzioni funzionali.

## Incertezza storica
Il terzo messaggio parla di kg goal presente solo il venerdì. Non compare un campo dedicato in questa V21: quel messaggio potrebbe riferirsi a una versione successiva non disponibile. Non dedurre che la V21 rappresenti lo stato finale raggiunto con Gemini.
