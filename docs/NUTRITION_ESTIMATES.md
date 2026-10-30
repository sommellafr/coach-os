# Stime nutrizionali delle ricette · 0.7.0

Implementazione dello step 3 richiesto dall'utente, introdotta nella 0.7.0. Nella 0.8.0 il [menu mensile](MONTHLY_MENU.md) aggiunge obiettivi e dosi di riferimento congelate anche per la spesa dei pasti generati. Le correzioni nel solo ricettario non riscrivono la spesa dei pasti precedenti. La Fat Bank resta una fase successiva.

## Uso

Il ricettario mostra kcal e proteine stimate sulle schede. Aprendo una ricetta si vedono kcal, proteine, carboidrati e grassi per le porzioni scelte. **Controlla dosi, prodotti e fonti** apre le quantità per una porzione, i riferimenti alimentari e i collegamenti alle fonti. Le impostazioni avanzate restano chiuse nel percorso normale.

Si possono correggere i grammi, includere/escludere ingredienti facoltativi, scegliere un altro alimento di riferimento o inserire i propri valori per 100 g. Modificare un valore nutrizionale attiva l'etichetta personale. Il totale si aggiorna nell'anteprima; **Salva la mia versione** conserva le scelte con backup preventivo. **Ripristina riferimenti** torna alla versione base, senza modificare i pasti precedenti.

I pesi del calcolo sono di parte mangiata. Sono esplicitamente separati dalle quantità predisposte per cucinare o da comprare: per esempio la farina aderente alla panatura non coincide con tutta quella preparata. Questo modulo non modifica automaticamente dosi della spesa, scorte, ricette estratte o diario consumato. Il futuro generatore deve far coincidere la versione nutrizionale scelta con le quantità pratiche del piano prima di proporre acquisti; `plannerReady` da solo non certifica questa riconciliazione né l'equilibrio di una dieta.

## Copertura e provenienza

Le versioni di riferimento coprono tutte le **34 ricette e 164 identificativi ingrediente**, con **105 profili alimentari** nella base 0.7.0; la 0.8.0 aggiunge mela, pera e arancia per i completamenti dichiarati del menu (**108 profili**). I valori sono stime della versione descritta, non misure di quei piatti. Il riepilogo riproducibile è in [RECIPE_NUTRITION_AUDIT.md](RECIPE_NUTRITION_AUDIT.md).

La base principale è il [download ufficiale USDA FoodData Central SR Legacy CSV, aprile 2018](https://fdc.nal.usda.gov/download-datasets/), release storica finale scelta per copertura e riproducibilità. Non viene presentata come nuova analisi del 2026 o come etichetta attuale di ogni prodotto italiano. I riferimenti conservano FDC ID, descrizione originale, valori per 100 g, fibra, carboidrati totali, misure domestiche e link al record. [Descrizione delle tipologie USDA](https://fdc.nal.usda.gov/data-documentation/).

Per alcuni prodotti si usano etichette ufficiali consultate il 30 ottobre 2026:

- [Philadelphia Protein](https://www.philadelphia.eu/it/i-prodotti/philadelphia-protein/index.html).
- [Sottilette Light](https://www.sottilette.it/product/light/index.html).
- [Galbani La Leggera](https://www.galbani.it/prodotti/santa-lucia/mozzarella-leggera).
- [Piadina tradizionale Levoni, scheda tecnica](https://shop.levoni.it/media/catalog/attribute-data/piadina_levoni.pdf).
- [BioTechUSA Protein Cream bianca](https://shop.biotechusa.com/collections/losing-weight/products/protein-cream-400-g-white-chocolate-flavoured).
- [Sukrin eritritolo](https://sukrin.com/en/products/sukrin).

Sono prodotti di riferimento dichiarati, senza sostenere che fossero quelli delle immagini o quelli acquistati dall'utente. I prodotti possono cambiare formulazione; l'etichetta della confezione effettiva prevale. Non vengono copiati procedimenti esterni.

La distribuzione dell'app contiene solo il sottoinsieme necessario in `src/nutrition-data.js`. Il builder `scripts/build-nutrition-data.py` prende lo ZIP ufficiale come input, include l'hash SHA-256 dell'archivio e produce dati deterministici. Il pacchetto originale scaricato resta nei file di lavoro esclusi da Git. I dati USDA sono di pubblico dominio con attribuzione della fonte: [API Guide USDA](https://fdc.nal.usda.gov/api-guide/). Non sono necessarie API a pagamento, chiavi, richieste nutrizionali durante l'uso o un server aggiuntivo.

## Metodo di calcolo

Per ogni ingrediente: `grammi mangiati × nutriente per 100 g / 100`. Somma dei contributi della preparazione, divisione per il numero di porzioni di riferimento, moltiplicazione per quelle richieste. La base delle porzioni rimane quella esplicita o redazionale già descritta in PANTRY_AND_PACKAGES.md, non una prescrizione nutrizionale.

Quantità g/kg/oz sono convertite dimensionalmente. Gli intervalli usano il punto medio, esplicitato. Uova senza guscio, frutta sbucciata, tortilla e verdura a pezzi hanno pesi di riferimento dichiarati e modificabili. Le misure domestiche USDA rispettano anche il campo `amount`: un peso dichiarato per due cucchiai non viene interpretato come uno solo. Per volumi vengono usati pesi di riferimento delle misure domestiche, assumendo cup da 240 ml, cucchiaio da 15 ml e cucchiaino da 5 ml; la densità derivata è visibile nelle note. Non è una conversione esatta o una regola applicabile a tutti i prodotti. L'acqua usa 1 g/ml. Senza peso o riferimento disponibile il valore rimane sconosciuto.

I carboidrati USDA per differenza comprendono la fibra; dove disponibile, si sottrae la fibra per una stima dei carboidrati disponibili. Se manca la fibra si conserva il totale USDA, senza inventarla. Non è una garanzia di identità con tutte le definizioni delle etichette europee. [FAQ USDA](https://fdc.nal.usda.gov/faq/) e [metodi FAO](https://www.fao.org/4/y5022e/y5022e03.htm). Il dato originale e la fibra restano conservati nel riferimento.

Le kcal sono quelle della tabella/etichetta, non forzate a coincidere con `4×proteine + 4×carboidrati + 9×grassi`: fibra, alcol, polioli e fattori di calcolo possono produrre differenze. L'eritritolo mantiene i carboidrati/polioli e le kcal della sua etichetta; non viene automaticamente trattato come zucchero.

I facoltativi sono esclusi salvo scelta esplicita. Le alternative vengono scelte e documentate, non sommate: latte 1% nella ricetta latte/bevanda vegetale, zucchero nel brownie zucchero/eritritolo, lenticchie secche rispetto alle cotte, olio di cocco tra le alternative del brownie. Verdure miste e prodotti non identificati hanno alimenti rappresentativi segnalati; esempi: zucchine per verdure miste, riferimento 95/5 per manzo 96/4, tortilla standard per quella a calorie ridotte, formaggio erborinato generico per gorgonzola, etichetta proteica bianca per il bigusto non identificato.

Una dose importante assente, come olio o farcitura, non viene azzerata: la versione base assegna una quantità redazionale visibile. Le dosi per gli ingredienti nuovi non costituiscono testo estratto dalla fonte. Se l'utente cancella un macro personale, quel totale diventa sconosciuto; non viene sostituito con zero o con una somma parziale non dichiarata. Nessun ingrediente incluso significa stima non disponibile. Campi invalidi e somme di macro impossibili vengono respinti.

## Cinque ricette che richiedono un controllo importante

| Ricetta | Scelta della versione di riferimento |
|---|---|
| Burrito chipotle | Salsa senza unità assunta da 60 g per preparazione; scatola aggiuntiva trattata come alternativa al singolo peperoncino |
| Pollo miele/aglio | Farina e fecola conteggiate per la parte aderente stimata dalla nota della fonte, separate dalla quantità predisposta |
| Bowl patate/manzo | Ranch proteica non identificata: usato riferimento ranch a ridotto contenuto di grassi |
| Riso/pollo/broccoli | Riso considerato secco e barattolo cremoso da 200 g: può dare una porzione molto abbondante; confermare o correggere stato e dose |
| Polpette tacchino | 80 g di mollica bagnata rappresentati da 40 g di pane asciutto e 40 g d'acqua, da confermare |

Questi casi hanno `needsReview=true` e non sono automaticamente candidati al futuro generatore finché l'utente non conferma le scelte della propria versione. Restano visibili e modificabili. Anche gli altri riferimenti sono stime; `plannerReady` indica solo dati completi, energia positiva e superamento di questo controllo, non validazione clinica, allergeni, copertura di micronutrienti o appropriatezza della porzione.

## Conservazione dei dati

Le immagini e `data/recipes.json` rimangono intatti. I nutrienti dichiarati dalla fonte, anche quelli incoerenti o senza base esplicita, si consultano in una sezione distinta. Nessuna stima viene riscritta come estrazione originale.

Preferenze locali opzionali `recipeNutritionSettings`, validate e incluse in export/ripristino. I pesi personali sono conservati sulla base dell'intera preparazione per non dividere due volte; l'interfaccia mostra sempre una porzione. Nuovi menu conservano `nutritionEstimate` con valori e riferimenti congelati. Numero di persone applicato una sola volta. I menu precedenti senza questa proprietà restano identici e continuano a esporre i dati originali; una loro modifica esplicita ricalcola la stima corrente. Cambiare un riferimento non riscrive pasti già salvati o consumati. Le misure specifiche del menu hanno precedenza sui pesi generali della ricetta, con nota sulle panature.

Backup preventivo per personalizzazione e ripristino dei riferimenti. Se il salvataggio fallisce, i campi restano disponibili e i byte precedenti non cambiano. Non vengono cancellati dati del browser o trasformati piani in consumi. L'export del ricettario include le stime con provenienza distinta, mantenendo i dati originali.

## Verifiche

93 test automatici: tutti i riferimenti, copertura 34/164, formule /100, porzioni, crudo/cotto, misure domestiche con fattore `amount`, intervalli, quota aderente, facoltativi, mancanti, snapshot, vecchi/nuovi backup e quota storage. Browser Chromium isolato: 59 controlli nuovi, inclusi tutte le 34 schede, pesi, etichetta personale, macro ignoto, doppia porzione, ripristino, riso cotto, persistenza, menu precedenti intatti e layout 320/390/844/1440 px; ancora superati 85 controlli del ricettario e 36 di porzioni/dispensa. Nessun errore JavaScript nei contesti verificati; ispezione visiva mobile eseguita.

Non verificati il prodotto effettivamente acquistato, pesi realmente ingeriti, ritenzione dei nutrienti durante la cottura, confezioni individuali o analisi di laboratorio. Nessuna certificazione di adeguatezza nutrizionale del mese, che non viene ancora generato. Telefono fisico e Safari restano da provare.
