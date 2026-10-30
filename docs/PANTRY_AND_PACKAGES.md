# Porzioni singole e dispensa · 0.5.0

## Richiesta e comportamento

Le 34 ricette sono presentate per una porzione. Un solo campo chiede quante prepararne, da 1 a 20. Ingredienti, anteprima, spesa ed esportazione del ricettario usano la stessa base. Il burrito di manzo originale per dieci diventa una porzione con 170 g di manzo; due porzioni richiedono 340 g. Le istruzioni operative per i lotti sono adattate e marcate come redazionali. Tempi e temperature della fonte non vengono scalati aritmeticamente.

Il catalogo estratto, le 31 immagini e gli snapshot storici rimangono intatti. Le dosi originali e le relative note sono consultabili negli approfondimenti sulle fonti. Il numero del lotto originale rimane un dettaglio tecnico interno per leggere i vecchi dati, senza essere un campo visibile da compilare. Le misure manuali sono mostrate e richieste per una porzione, mantenendo compatibili i dati precedenti.

## Provenienza della porzione

`src/single-serving.js` usa la resa originale quando espressa come numero di porzioni. Per rese assenti o in pezzi adotta queste proposte redazionali, dichiarate nell'interfaccia:

| Ricetta (ID) | Porzioni ricavate dalla preparazione originale |
|---|---:|
| pollo-miele-aglio | 4 |
| banana-snack | 2 |
| polpette-tacchino | 2 |
| brownies | 8 |
| nuggets-pollo | 2 |
| piadina-salmone, piadina-caprese, piadina-veggie, piadina-tonno, piadina-pollo | 1 ciascuna |
| pancake-banana, crepes-cacao, cloud-bread, rotolo-patate, wrap-tonno-fagioli | 1 ciascuna |
| pasta-salmone, couscous-ceci, pasta-fredda-mare | 1 ciascuna |

Sono basi pratiche reversibili, non prescrizioni o porzioni nutrizionali validate. Eventuali snapshot importati con ID sconosciuto e senza resa usano una base redazionale di una porzione da verificare. I nutrienti sono riproporzionati solo dalla fonte quando la base lo consente; valori mancanti o incoerenti restano mancanti.

## Scorte, prenotazioni e acquisti

- **Dispensa** registra la quantità reale presente, con stato dell'ingrediente e formato abituale facoltativo. Sono accettati g/kg e ml/l, conservati internamente come g/ml. Cambiare tra massa e volume richiede una nuova misura.
- I menu da oggi in avanti generano prenotazioni senza modificare la quantità reale. La spesa di una settimana futura considera prima i piani delle settimane precedenti. Intervalli di quantità usano il limite superiore per la previsione.
- Fabbisogno mancante = massimo tra zero e fabbisogno più prenotazioni precedenti meno scorta. Numero confezioni = arrotondamento per eccesso del mancante diviso il formato. Avanzo previsto e scorta reale sono distinti.
- **Ho acquistato** aggiunge tutte le confezioni proposte. Il formato può essere corretto prima dell'azione. Non è un ordine online. Le vecchie spunte di acquisto non diventano scorte automaticamente.
- **Ho preparato** mostra e conferma gli scarichi; controlla tutte le scorte misurabili prima di scrivere e impedisce doppio scarico o valori negativi. Gli ingredienti privi di peso sono dichiarati non tracciati, anche nel movimento: la preparazione può quindi avere uno scarico parziale esplicitamente indicato. Per una contabilità completa occorre confermare tutti i pesi prima di preparare.
- Lo storico consente di annullare acquisti e preparazioni una volta. Un acquisto già utilizzato non può essere annullato se causerebbe scorte negative. Un pasto preparato va annullato prima di modificarlo. Rimuovere un piano non ripristina implicitamente ingredienti realmente utilizzati.

Le azioni scrivono con backup preventivo, validazione e gestione degli errori di salvataggio. Campi opzionali `pantry` e `pantryMovements` sono inclusi in export/ripristino; backup precedenti restano leggibili senza migrazione distruttiva. Nessun consumo alimentare o calorico viene dedotto dallo scarico della dispensa.

## Formati italiani e limiti

`src/packages.js` raccoglie esempi con collegamento alle fonti ufficiali dei produttori/rivenditori: farina 1 kg (Conad), pasta 500 g (Barilla), latte 1 l (Parmalat), farina di ceci 500 g, riso basmati 500 g e altri risi 1 kg, cous cous 500 g, yogurt 500 g, burro di arachidi 350 g, cacao 75 g (Conad), mozzarella light 125 g (Lidl). Alcuni esempi provengono da volantini anche storici: documentano un formato, senza garantire disponibilità attuale nel negozio dell'utente. Tutti i formati sono modificabili; per ingredienti senza riferimento si richiede quello della propria confezione.

Non sono minimi universali né un catalogo completo dei supermercati. Latte e bevande vegetali raggruppati nella ricetta condividono soltanto il formato proposto, non composizione o valori nutrizionali. Olio proposto in ml non copre una dose espressa in g. Cup, cucchiai, pezzi e quantità mancanti richiedono peso o volume reale: nessuna densità inventata. Stati crudo/cotto/secco/sgocciolato e nomi diversi restano separati; non si sommano automaticamente prodotti alternativi. Acqua di rubinetto è esclusa da acquisti e scarichi, brodo e altre alternative no. Facoltativi esclusi salvo scelta dell'utente.

## Verifiche

80 test automatici su fonti intatte, normalizzazione, confezioni, prenotazioni, settimane future, stock, annullamenti, unità, backup e quota storage. Browser Chromium in contesti isolati: 36 controlli sul ciclo completo, 85 sul ricettario, 111 mobile con touch simulato (320/360/390/430 px e 844×390), 18 sulla regola delle 21 e 57 sui sette giorni. I test storici su checkbox e lotto visibile sono superati dal nuovo flusso; non sono dichiarati come verifiche di questa versione. Nessun accesso o cancellazione del diario dell'utente. Telefono fisico, Safari e misure delle confezioni effettivamente possedute non verificati.
