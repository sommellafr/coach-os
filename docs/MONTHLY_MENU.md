# Menu mensile e gestione pasti · 0.8.0

Quarto passo alimentare concordato, anticipato rispetto alle nuove schede e alla Fat Bank. Generazione locale, senza AI o API a pagamento. Non è un calcolatore del fabbisogno personale o una prescrizione clinica.

## Percorso principale

**Pasti → Crea menu del mese** apre tre schermate:

1. Mese, kcal giornaliere scelte dall'utente e peso. Obiettivo proteico iniziale `peso × 1,5 g`, modificabile in una sezione apribile. Nessun valore di kcal viene imposto al primo uso. Gli ultimi obiettivi si riusano.
2. Cinque o sei giorni della settimana, con uno o due liberi. Esclusioni di ingredienti/ricette facoltative. Si possono completare le ricette con frutta e contorni dichiarati.
3. Anteprima dei tre pasti per giorno, valori stimati e scostamenti. Si può bloccare un piatto, cambiarne uno o rigenerare solo i non bloccati. Conferma finale e backup prima del salvataggio.

Dopo il salvataggio si apre il primo giorno pianificato nella settimana corretta. **Vedi menu del mese** riapre l'intero mese con un tocco, anche per consultare un mese passato; questa vista non genera piatti o salva dati. **Crea o completa il mese** torna alla procedura per riempire caselle vuote. I pasti già salvati sono protetti; per modificarli usare il calendario o rimuovere le voci interessate prima di rigenerare.

Le date sono civili locali. Mesi di 28/29/30/31 giorni e limite 2199 gestiti senza ricavare il giorno da ISO UTC. Nel mese corrente non si propongono giorni precedenti: dalle 21 si parte da domani, coerentemente con il planner. Nessuna nuova proposta sui giorni liberi; i pasti eventualmente già presenti rimangono consultabili e non vengono cancellati.

## Obiettivi e scelta dei piatti

Il target kcal riguarda ciascun giorno pianificato, non una media che nasconde scostamenti. Si cerca una combinazione entro **±5%** delle kcal e con proteine almeno pari all'obiettivo impostato. Non si modifica automaticamente il target e non si generano due pranzi o due cene per far quadrare i numeri: ogni nuova casella contiene una ricetta per una persona.

La priorità va alle combinazioni che rispettano entrambi gli obiettivi. All'interno di queste, si penalizzano ripetizioni delle stesse ricette e delle fonti principali negli ultimi sei giorni pianificati, stesso piatto nel giorno precedente e stessa fonte tra pranzo e cena. Pranzo e cena nuovi devono avere ricette diverse. La rigenerazione cambia il criterio di spareggio; non promette combinazioni sempre diverse quando il catalogo è ristretto. Gli esiti sono spiegabili e non dipendono da un servizio esterno.

Fonti principali riconoscibili: pesce, pollo/tacchino, carne rossa/salumi, legumi, uova e latticini/altre fonti. Riepilogo delle categorie e delle ricette distinte visibile, senza presentarlo come prova di adeguatezza nutrizionale. La varietà è una preferenza implementativa ispirata al principio di combinare alimenti diversi delle [indicazioni CREA](https://sapermangiare.an.crea.gov.it/557/9-varia-la-tua-alimentazione-come-e-perch.html); i pesi del punteggio non sono una regola scientifica validata.

Con l'opzione contorni attiva, se una colazione ha meno di 100 g di frutta della lista riconosciuta si aggiungono 150 g di mela, pera o arancia. Se un piatto salato ha meno di 100 g di verdure riconosciute, escluse le patate da questo conteggio, si aggiunge un contorno da 100 g di pomodoro, carota o lattuga. Le quantità sono proposte redazionali modificabili disattivando l'opzione o cambiando piatto, non porzioni cliniche validate. Non sono spuntini automatici: fanno parte dei tre pasti e dei loro totali. Nessuna garanzia su micronutrienti, fibra totale, distribuzione dei grassi o copertura di tutte le raccomandazioni alimentari. Frutta/contorni compaiono per nome e quantità sia prima sia dopo il salvataggio.

Se non esiste una combinazione che soddisfa gli obiettivi, si mostra la più vicina con lo scostamento e l'eventuale carenza di proteine. Il riepilogo indica quanti giorni richiedono una revisione. L'utente può modificarli o salvare consapevolmente l'anteprima; non vengono inventate kcal/proteine mancanti o dichiarati successi falsi. Con esclusioni che non lasciano ricette per tutti e tre i pasti, si chiede di rivedere le scelte senza modificare il diario.

I limiti numerici degli input sono vincoli applicativi, non soglie nutrizionali approvate. 1.600 kcal e 80 kg sono soltanto dati sintetici nei test, non valori consigliati o precompilati per ogni persona. Il coefficiente 1,5 g/kg è la preferenza richiesta dall'utente, non un fabbisogno universale.

## Filtri e qualità dei dati

Si usano solo ricette con tutti e quattro i macro stimabili, energia positiva e controlli importanti risolti. I cinque casi contrassegnati nella 0.7.0 rimangono esclusi finché l'utente non verifica e conferma la propria versione. Le ricette non usate e i motivi sono consultabili nell'anteprima.

Le esclusioni operano sulle nuove proposte con metadati dei profili effettivamente usati, anche quando l'ingrediente è secondario (per esempio il brodo di pollo conta come carne). Pesto, salse e prodotti di riferimento vengono classificati conservativamente dove riconosciuti. Non si certifica l'assenza di allergeni o contaminazioni: etichette e formulazioni reali vanno controllate. I filtri non cambiano i piatti già conservati, cosa dichiarata nell'interfaccia. Non si sostituiscono automaticamente prodotti vegetali o "senza" con valori non verificati.

I nuovi tre profili USDA di mela, pera e arancia provengono dallo stesso archivio SR Legacy documentato nella 0.7.0. `src/nutrition-data.js` contiene ora 108 profili; la mappatura delle 34 ricette e dei 164 ingredienti originali non cambia. Builder riproducibile e nessuna richiesta di rete durante la generazione.

## Pasti già presenti e consuntivi

Una casella già pianificata o con alimenti consumati è protetta. Piatti esistenti, note e allenamenti non vengono sostituiti. Nel confronto giornaliero il consuntivo del pasto ha priorità sul suo piano, senza sommare entrambi. Gli Extra già mangiati sono inclusi e dichiarati nel totale. Dati incompleti di una casella protetta rendono incompleto il riepilogo; non equivalgono a zero. Per vecchi piani senza snapshot della stima non si ricavano automaticamente nuovi valori dagli ingredienti e non si certifica il raggiungimento dei target.

Il confronto delle ricette pianificate è per una persona: eventuali porzioni per ospiti aumentano la preparazione e la spesa, non la quota giornaliera attribuita alla persona. I consumati, invece, usano le quantità effettivamente registrate. Pianificazione, acquisto, preparazione e consumo restano eventi distinti: il generatore non scala scorte né aggiunge calorie consumate o Fat Bank.

## Dosi, spesa e conservazione

I nuovi menu conservano:

- Snapshot della ricetta originale, intatto.
- `nutritionEstimate` con dosi mangiate, nutrienti, fonti ed eventuali aggiunte.
- `referenceIngredients` per una persona, usati anche dalla spesa e dalle prenotazioni della dispensa. Stati crudo/cotto/secco/sgocciolato distinti; g/ml, con conversioni di volume soltanto dai riferimenti dichiarati. Parte edibile e confezione effettiva possono differire: verificare i pesi reali. Nessuna conversione implicita da riso cotto a secco.
- `menuPlan` con identificativo di generazione, mese e obiettivi numerici originali, per non riscrivere il passato quando cambiano le preferenze.

Per panature confermate si distingue peso mangiato e quantità da predisporre, usando il rapporto esplicitato della versione di riferimento. Le aggiunte sono in spesa con la stessa unità e quantità del menu. I pesi medi rimangono stimati, non marcati come misurati dall'utente. I formati di acquisto e la sottrazione delle scorte continuano a usare le regole esistenti.

Cambiare le preferenze nutrizionali nel ricettario non altera i menu già salvati. Nella modifica di un piatto mensile, categoria del pasto e numero di commensali restano modificabili; le dosi di riferimento e la relativa stima rimangono allineate. Per una nuova composizione occorre scegliere un'altra ricetta/proposta. Le vecchie ricette manuali senza `referenceIngredients` mantengono il comportamento precedente.

Preferenze opzionali in `monthlyMenuPreferences` e `monthlyMenus`, validate e incluse nei backup. Nessuna migrazione distruttiva e nessun cambiamento di schema obbligatorio per leggere i vecchi backup. Si rivaluta la revisione prima di applicare l'anteprima; dati modificati nel frattempo o da un'altra scheda impediscono scritture parziali. La scrittura è unica per tutto il mese, con backup preventivo. Se la copia o il salvataggio fallisce, l'anteprima resta disponibile e i byte precedenti restano intatti.

## Cancellazione controllata

**Pasti → Gestisci pasti salvati** consente settimana della data, mese o tutti i pasti. Si vede prima il numero di voci coinvolte. Per impostazione iniziale si eliminano soltanto i pianificati; cancellare anche i mangiati richiede una scelta distinta. È disponibile il download del backup prima della conferma e viene comunque conservata una copia locale dal repository.

Note, assegnazioni, sedute, prodotti, abituali, obiettivi salvati e dispensa restano. Cancellare un piatto già preparato non ripristina scorte realmente consumate e non rimuove i movimenti: gli scarichi si annullano separatamente in Dispensa. Le prenotazioni derivate dai piani si ricalcolano. Recupero tramite import del backup da Profilo e dati, con le protezioni esistenti. Non è una cancellazione dei dati del browser.

## Verifiche

102 test automatici del progetto, con casi nuovi su mesi/bisestili/limiti, soglia serale, 5/6 giorni, obiettivi possibili e incompatibili, varietà, esclusioni, piatti protetti, consuntivi ed Extra senza doppi conteggi, dati mancanti, blocchi, sostituzioni, dosi g/ml, panatura, spesa, cancellazioni con movimenti/scorte conservati, roundtrip e fallimento backup/quota.

48 controlli Chromium in contesto isolato, ripetuti sulla build sotto `/coach-os/`: flusso completo in tre schermate, ritorno indietro, anteprima senza scritture, conferma, riapertura del mese con un tocco, protezione dei menu, dosi della spesa, backup scaricabile, cancellazioni distinte, limiti dichiarati, 5/6 giorni e assenza di overflow a 320/390/844/1440 px. Regressioni: 111 controlli mobile e 59 sulle stime nutrizionali. Ispezione visiva mobile eseguita. Nessun dato privato letto o cancellato.

I dati sintetici 1.600 kcal, 80 kg e cinque giorni in novembre 2026 generano 63 nuove ricette su 21 giorni; il caso di prova rientra negli obiettivi. Non è una promessa per ogni combinazione di ricette, esclusioni o target. Telefono fisico, Safari, allergeni dei prodotti acquistati e adeguatezza clinica del menu non verificati. Nessuna Fat Bank o nuova scheda Total Body attivata da questa fase.
