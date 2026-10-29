# Visione del sito Coach OS

## Scopo
Creare un sito personale utilizzabile ogni giorno per organizzare allenamento e alimentazione e capire se si sta progredendo. L'utente deve poter rispondere a tre domande: cosa faccio oggi, cosa ho fatto realmente, come sta cambiando il mio andamento.

## Destinatario e contesto
Prima versione per un singolo utente, con uso prevalente da telefono in palestra, in cucina e a fine giornata. Il progetto deve poter evolvere senza perdere lo storico. Dati personali e obiettivi vanno confermati all'avvio; non precompilare valori presi da conversazioni passate come se fossero attuali.

## Esperienza desiderata
All'apertura si vede la data odierna, il riepilogo e le azioni del giorno. Il calendario consente di consultare il passato e pianificare il futuro. L'allenamento si sceglie tra Total Body 1/2/3, Cardio 1/2, riposo e attività libera. La settimana standard lun-mer-ven pesi, mar-gio cardio è una preselezione modificabile: saltare un giorno non obbliga a perdere o sovrascrivere una scheda.

Durante la seduta, l'utente vede target, ultima prestazione comparabile e campi per registrare ogni serie. A fine seduta conosce lo scostamento dal programma e, quando esistono dati sufficienti, la variazione della prestazione. Il suggerimento per la seduta seguente è spiegato e modificabile.

I pasti possono essere pianificati e poi confermati come consumati. Le ricette devono contenere quantità, porzioni e procedimenti numerati comprensibili anche a chi cucina poco. Le 31 immagini fornite sono le fonti da recuperare integralmente: il numero effettivo di ricette si determina dopo lettura e deduplicazione.

## Due monitor principali
1. Energia e peso: assunzione, dispendio stimato, bilancio giornaliero, riepilogo settimanale, deficit cumulato stimato e peso misurato.
2. Allenamento e forza: risultati per esercizio, rispetto dei target, confronto con precedenti sedute e andamento settimanale con copertura dei dati visibile.

Il prodotto deve far capire la differenza tra misura registrata, stima e suggerimento. Un giorno senza dati non equivale a zero calorie assunte o a un allenamento fallito.

## Architettura delle schermate proposta
- Oggi: data, stato registrazione, allenamento, pasti, riepilogo.
- Calendario: consultazione e pianificazione, stato completo/parziale.
- Allenamento: scelta scheda, registrazione serie, precedente seduta, riepilogo.
- Alimentazione: diario pasti, ricettario, porzioni, extra, planner, spesa e dispensa.
- Progressi: due viste distinte Energia e Forza, filtri temporali.
- Profilo e dati: obiettivi, benchmark, preferenze, esportazione e ripristino.
Questa navigazione è una proposta di progetto, da adattare durante la prima implementazione.

## Direzione visiva
Conservare la riconoscibilità del prototipo: base scura blu/antracite, testo leggibile, blu per azioni, verde per completamento, colori coerenti per macro. Ridurre bordi, abbreviazioni e testi minuscoli. Schermate ordinate, pulsanti comodi da toccare, nessuna dipendenza dal solo colore. Layout mobile a colonna e spazio più ampio su desktop. Grafici con tooltip e tabella accessibile dei valori.

Preferire termini neutrali: “Extra” al posto di “Sgarro”, senza teschi o valutazioni morali sul cibo. Evidenziare i progressi con numeri e contesto, senza promettere risultati fisici certi.

## Principi
- Salvataggio affidabile prima delle funzioni avanzate.
- Modifiche e correzioni del passato senza duplicazioni.
- Obiettivi e risultati separati.
- Progressione spiegabile, mai incremento obbligatorio ogni settimana.
- Trasparenza su formule, fonti e informazioni mancanti.
- Dati esportabili e controllo dell'utente.

## Perimetro iniziale
Sito responsive personale, calendario, schede spostabili, diario per serie, pasti, ricettario completo, storico, due monitor, backup e ripristino.

## Evoluzioni successive
Installabilità e offline, sincronizzazione tra dispositivi, eventuale accesso personale, integrazione con dispositivi. Sono evoluzioni da progettare: non sono già disponibili e non richiedono servizi a pagamento nella prima versione.

## Fuori perimetro iniziale
Social, classifiche, abbonamenti, marketplace, coach AI via API a pagamento, prescrizioni cliniche, perdita di peso garantita e condivisione pubblica dei dati personali.

## Come capire se funziona
L'utente registra una seduta da telefono senza ambiguità, ritrova i dati dopo la riapertura, può spostare una scheda e confrontare settimane diverse; una correzione aggiorna i grafici una sola volta. Il ricettario è riconducibile alle fonti e il bilancio calorico dichiara la qualità della registrazione.
