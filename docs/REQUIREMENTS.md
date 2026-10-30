# Requisiti ricostruiti
Fonti: sorgente V21 e quattro messaggi dell'utente, riportati in sintesi in USER_REQUESTS.md. Nessuna risposta di Gemini disponibile.

| ID | Requisito | Priorità |
|---|---|---|
| CAL-01 | Calendario con date reali, selezione oggi/passato/futuro e storico tra settimane | P0 |
| CAL-02 | Settimana standard lun-mer-ven Total Body, mar-gio cardio, modificabile | P0 |
| CAL-03 | Scegliere Total Body 1/2/3, Cardio 1/2 o riposo per qualsiasi data | P0 |
| CAL-04 | Spostare una seduta programmata mantenendo distinta la cronologia eseguita | P0 |
| CAL-05 | Conservare giorno selezionato e posizione dopo aggiunta di pasti; proporre domani dalle 21 locali, rispettando date scelte manualmente e data reale del diario | P0 |
| DAT-01 | Salvataggio e riapertura per data, correzione senza record duplicati | P0 |
| DAT-02 | Esportazione, ripristino, versione del formato, gestione errori di storage | P0 |
| DAT-03 | Import legacy eventuale senza attribuire dati non presenti | P1 |
| GYM-01 | Tre schede Total Body complete e due cardio, modificabili | P1 |
| GYM-02 | Target e risultati separati per esercizio e serie | P0 |
| GYM-03 | Visualizzare ultima prestazione comparabile indipendentemente dal giorno | P1 |
| GYM-04 | Suggerire prossimo carico con regola motivata, arrotondamento attrezzatura e override | P2 |
| GYM-05 | Benchmark con carico, ripetizioni, data e mesi di inattività | P2 |
| GYM-06 | Confronti settimanali di prestazione e stima forza, con dati insufficienti espliciti | P1 |
| GYM-07 | Rispetto target con percentuale raggiunta e delta firmato | P1 |
| NUT-01 | Recuperare tutte le ricette presenti nelle 31 immagini | P1 |
| NUT-02 | Ingredienti con unità e porzioni, procedimento numerato, tempi/temperature quando disponibili | P1 |
| NUT-03 | Diario pasti, quantità/porzioni modificabili, extra e correzioni | P1 |
| NUT-04 | Distinguere menu pianificato da alimenti effettivamente consumati | P1 |
| NUT-05 | Planner, lista spesa aggregata e sottrazione dispensa con unità compatibili | P1 |
| NUT-06 | Ricette per una porzione e numero da preparare; provenienza delle rese redazionali esplicita | P1 |
| NUT-07 | Acquisti in confezioni modificabili, scorte reali distinte dalle prenotazioni e scarichi annullabili | P1 |
| NUT-08 | Diario alimenti consumati: quantità g/ml, valori per 100, pasti composti, recenti/preferiti/abituali e snapshot storici | P1 |
| NUT-09 | Codici a barre con fotocamera e API gratuita; alternativa manuale, gestione dati incompleti e riuso prodotti salvati | P1 |
| ENE-01 | Revisione stima dispendio; attività pianificate diverse da completate | P1 |
| ENE-02 | Assunzione, dispendio e bilancio giornaliero/settimanale | P1 |
| ENE-03 | Contatore deficit cumulato stimato dall'inizio e confronto con obiettivo | P1 |
| ENE-04 | Peso misurato e andamento, senza equiparare stima energetica e kg realmente persi | P1 |
| UI-01 | Due monitor con grafici per data, periodo, dettaglio e copertura dati | P1 |
| UI-02 | Esperienza mobile accessibile e desktop responsive | P1 |

P0 = fondazione; P1 = esperienza principale; P2 = personalizzazione avanzata. Le priorità sono proposta di lavoro.

## Vincoli di continuità
Preservare profilo, macro, editing scheda, libreria esercizi, completamento, pasti/extra, storico, ricette, planner, spesa e dispensa come capacità prodotto. Non significa preservare le formule errate o la struttura monolitica del prototipo. Implementare ogni capacità in modo verificabile e dichiarare eventuali funzioni ancora non portate.
