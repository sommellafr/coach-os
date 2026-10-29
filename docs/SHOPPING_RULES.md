# Menu settimanale e lista della spesa

Versione 0.4.1, 29 ottobre 2026. Richiesta esplicita: pianificare i pasti della settimana e ricavarne la spesa con un'interfaccia agevole. La correzione delle porzioni e delle unità è descritta in [PORTIONS_AND_METRIC.md](PORTIONS_AND_METRIC.md).

## Flusso

Il calendario apre una vista di sette giorni con tre pasti per data: Colazione, Pranzo e Cena. Ogni casella permette una ricerca per titolo/ingrediente in un selettore nativo modale con focus confinato e chiusura tramite Escape. Una ricetta si aggiunge come singola dose, anche a più giorni selezionati della stessa settimana. Gli altri pasti non vengono modificati. Il modulo dettagliato per giorno rimane disponibile per correzioni e rimozioni; il calendario mensile è secondario e apribile.

Riutilizzare una settimana crea nuove voci con ID distinti e snapshot degli ingredienti conservati. Soltanto i pasti completamente vuoti nella destinazione ricevono copie; se un pranzo ha già una ricetta, tutte le ricette di quel pranzo sono preservate e non vengono aggiunte copie. Nessun piano di allenamento o nota è spostato. La copia è idempotente sui pasti già popolati. Se una destinazione non è valida o supera i limiti, l'operazione non viene applicata parzialmente.

## Calcolo della lista

- Periodo: settimana civile locale lunedì–domenica della data selezionata, comprese settimane a cavallo di mese/anno. All'estremo 2199 il periodo è limitato alle date supportate.
- Inclusione: soltanto voci planned delle date della settimana; ingredienti originali × persone / batchPortions. Le persone sono una per default; gli ospiti sono espliciti. La resa organizzativa nota è bloccata nella scelta, le rese in pezzi/strisce/polpette richiedono il numero di pasti. I giorni senza menu non producono ingredienti né un fallimento.
- Identità: nome dell'ingrediente normalizzato per accenti, maiuscole e spazi, unità e stato di preparazione. Non si assumono equivalenze tra alimenti, marche, varianti o nomi diversi. I nomi originali sono mostrati.
- Conversioni: kg/mg → g, l/dl/cl → ml, oz di massa/lb → g con fattori esatti. Totali principali soltanto g e ml. Cup, tbsp, tsp, cucchiai, pezzi e altre unità senza misura metrica sono da confermare, senza conversioni arbitrarie o stime di densità. Misure confermate dall'utente possono completare il dato conservando lo snapshot originale.
- Stato: crudo, cotto, secco, sgocciolato, scolato e non specificato sono distinti. Le flessioni di uno stesso stato sono normalizzate. Non si converte un peso cotto in crudo.
- Intervalli: vengono sommati separatamente minimi e massimi. Non viene scelto un valore medio o massimo arbitrario.
- Mancanti: null resta sconosciuto. Se una voce ha quantità note e altre mancanti nella stessa unità, viene mostrato il subtotale noto più un'indicazione delle dosi assenti. Se manca l'unità, non viene inventata. Queste voci sono nella sezione da valutare a mano, non nascoste dal file esportato.
- Facoltativi: esclusi per default; un controllo esplicito li include soltanto nella spesa. Questo non modifica gli snapshot o i nutrienti dei pasti.
- Correzioni: la lista viene sempre derivata dallo stato corrente. Non è un archivio di somme da aggiornare per delta: modificare o cancellare un pasto non duplica quantità.

Esempio verificato: pasta 150 g per due porzioni, pianificata per una persona in due giorni, richiede 75 + 75 = 150 g. Aggiungendo esplicitamente un ospite a uno dei pasti, il totale diventa 150 + 75 = 225 g. Cancellando l'altro pasto rimangono 150 g. I vecchi divisori personalizzati non vengono riscritti alla lettura; le correzioni della settimana richiedono riepilogo, conferma e backup preventivo.

## Spunte e persistenza

Campo opzionale del formato 1: shoppingWeeks[YYYY-MM-DD del lunedì] contiene includeOptional e checked. La firma di una voce comprende identità, quantità minima/massima e numero di contributi sconosciuti. Una spunta è applicabile soltanto alla stessa quantità della stessa settimana; cambiando il fabbisogno non viene trasferita automaticamente. Non è un dato di consumo, né uno stato della dispensa.

La lista calcolata non viene salvata duplicando gli ingredienti: si salvano soltanto preferenze e spunte. Backup/ripristino includono questi campi. I vecchi backup rimangono validi senza migrazioni. Un errore di scrittura ripristina la spunta visiva, mantiene i byte precedenti e mostra un messaggio.

L'esportazione TXT comprende periodo, quantità, unità, spunte, facoltativi e dosi da chiarire. La copia negli appunti è su azione dell'utente; se non è disponibile il browser può scaricare il file. Le prove usano una clipboard simulata, senza alterare gli appunti personali.

## Limiti

Nessun prezzo, confezione, disponibilità di negozio, equivalenza tra varianti o sottrazione parziale della dispensa. Non vengono aggiunti alimenti o nutrienti assenti dalle fonti. Le note originali, le alternative e gli usi per data/ricetta si consultano nei dettagli di ogni voce. Il piano alimentare resta pianificato; non certifica cosa è stato effettivamente consumato.
