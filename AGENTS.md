# Istruzioni per Codex

## Obiettivo
Realizzare il sito personale descritto in VISION.md e docs/REQUIREMENTS.md. Il progetto iniziale è un prototipo storico, non una specifica scientifica approvata.

## Metodo
- Leggere prima README.md, VISION.md, requisiti, audit e decisioni aperte.
- Preservare `reference/coach-v21-original.md` e tutte le immagini; non modificare le fonti.
- Separare richieste esplicite, proposte implementative e ipotesi da verificare.
- Procedere per fasi funzionanti; aggiornare documentazione e stato del lavoro.
- Prendere autonomamente decisioni reversibili. Chiedere solo quando una scelta blocca realmente un risultato o coinvolge perdita di dati/costi/pubblicazione.
- Non rigenerare tutto il progetto a ogni richiesta: applicare modifiche mirate e verificare i flussi interessati.
- Non pubblicare il sito o attivare servizi a pagamento senza istruzione dell'utente.

## Dati
- Nessuna data del diario deve essere rappresentata solo dal giorno della settimana.
- Date civili locali `YYYY-MM-DD`, senza ricavare la giornata da `toISOString()` UTC.
- Conservare target e risultati separati, anche quando cambiano schede o profilo.
- Non cancellare dati del browser o migrare in modo distruttivo. Backup prima delle migrazioni.
- Lo storico V21 non contiene prestazioni: non inventarle. Record legacy con data ambigua vanno segnalati.
- Nessun giorno mancante va interpretato come zero assunzione o fallimento.

## Ricette
Leggere tutte le immagini. Tracciare provenienza e contenuti incerti. Non presentare aggiunte redazionali o stime nutrizionali come testo estratto. Non copiare procedimenti da siti esterni. Stile passo passo significa chiarezza operativa, non riproduzione di contenuti protetti.

## Calcoli
Distinguere rispetto del programma, volume e stima della forza. Non usare tonnellaggio di esercizi diversi come misura diretta della forza. Il -30% dopo quattro mesi è un esempio dell'utente, non una regola validata. Validare i modelli di progressione, detraining e dispendio con fonti primarie aggiornate prima di renderli suggerimenti operativi; documentare formule e limiti. Non richiedere prove massimali per usare l'app.

## Qualità
Validare input, gestire errori di salvataggio, backup, accessibilità e uso mobile. Eseguire test significativi su date, persistenza, calcoli, correzioni, import/export e migrazioni; verificare in browser i flussi principali. Dichiarare cosa è stato verificato e cosa no.
