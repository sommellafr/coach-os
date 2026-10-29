# Porzioni personali e unità metriche — correzione 0.4.1

## Richiesta esplicita

Un pasto rappresenta una porzione per una persona; eventuali ospiti sono una scelta separata. La spesa deve usare g o ml, senza cup, oz o pezzi nei totali principali. Correggere il caso segnalato di circa 2 kg di manzo e 16 tortilla per due giorni.

## Difetto e riproduzione

Il vecchio campo «porzioni nelle dosi originali» poteva essere interpretato come numero di persone. Impostarlo a 1 per una ricetta da 10 burrito salvava un'intera preparazione come una dose. L'aggregazione era coerente con quel dato, ma l'interfaccia permetteva l'equivoco.

Riproduzione sintetica, non lettura del diario privato: un burrito di manzo con divisore 1, due con divisore 10 e un burrito di pollo con divisore 1 producono esattamente 2040 g di manzo e 16 tortilla. Correggendo i due divisori discordanti a 10 e 4, le tre porzioni di manzo richiedono 510 g; la porzione di pollo circa 170,1 g. Il peso delle tortilla non è nella fonte e non viene dedotto.

## Scelte implementative

- Porzioni personali per voce: `people`, intero 1–20, predefinito 1. Significa una porzione per persona per ciascun giorno selezionato. `batchPortions` rimane il divisore della preparazione originale, mai il numero di commensali. Il campo storico `quantity` rimane 1 per compatibilità.
- Resa organizzativa nota: la divisione viene proposta e bloccata per porzioni, burrito, bicchieri, tortine, piadine e contenitori. L'interfaccia esplicita il numero e l'unità della fonte; è una convenzione pratica, non una prescrizione di porzione nutrizionale.
- Strisce, polpette e pezzi non diventano automaticamente pasti: ad esempio 11 polpette non significano 11 pranzi. In questi casi, e quando la resa manca, l'utente deve indicare quante porzioni ricava dall'intera preparazione. Nessuna quantità viene inventata per risolvere questa lacuna.
- Formula: ingredienti originali × persone / porzioni della preparazione. Per una persona resta una sola porzione; la scelta di più giorni ripete la porzione, senza ripetere l'intero lotto.
- Anteprima nel selettore: ingredienti del pasto e aggiornamento quando cambiano persone, resa da definire o misure. Nei menu le etichette mostrano le porzioni effettive.

## Conversioni e misure mancanti

Il modulo `src/metric.js` normalizza g/kg/mg e ml/cl/dl/l. Converte le once di massa (oz, non fl oz) e le libbre con fattori esatti: 28,349523125 g/oz e 453,59237 g/lb. Fonte primaria: [NIST, Handbook 44, Appendice C](https://www.nist.gov/system/files/documents/2024/01/14/NIST%20HB%2044%202024%20Appendix%20C%20General%20Tables%20of%20Units%20of%20Measurement.pdf). Nessuna conversione massa/volume o crudo/cotto.

Cup, tsp/tbsp, cucchiai, pezzi, scatole e unità assenti non hanno un peso universale. Vengono mostrati come «Peso/volume da confermare» nella sezione aperta della spesa, non come zeri o quantità metriche stimate. La lista rimane esplicitamente incompleta. I dati originari sono disponibili nei dettagli; fonti, note e JSON del catalogo non vengono alterati.

L'utente può confermare in g o ml il totale della singola voce **nell'intera preparazione originale**, usando bilancia o confezione: ad esempio il peso complessivo delle dieci tortilla previste nella fonte, non il peso di un singolo pasto. Il valore viene poi diviso una sola volta. Nessun valore predefinito è attribuito a tortilla, banana, uovo o cup di latticini.

Le misure vengono conservate separatamente come `metricOverrides: [{index,quantity,unit}]` sul pasto. L'indice identifica l'ingrediente nello snapshot immutabile; unità g/ml, quantità positiva finita e indici unici sono validati anche durante l'import. Non cambiano gli ingredienti della fonte né ricalcolano nutrienti dal peso.

Un comando esplicito può applicare le misure anche alle altre occorrenze settimanali della stessa ricetta con ingredienti originali identici; rimane disattivato per default. Nuove scelte possono riutilizzare misure già confermate per gli stessi ingredienti: sono sempre visibili e modificabili. Il sistema non assume equivalenze tra marche o ingredienti diversi.

## Correzione del menu esistente e dati

Nessuna migrazione automatica. Un avviso elenca le voci con resa organizzativa nota e divisore discordante. «Correggi le porzioni di questa settimana» mostra date, ricette e divisori prima/dopo; occorre confermare. La scrittura crea prima un backup esatto dei byte nel browser. Se il backup fallisce, non cambia nulla. Persone, ID, snapshot, allenamenti e altre settimane rimangono invariati. Le rese ambigue o mancanti non vengono corrette automaticamente.

Anche le modifiche manuali di porzioni/misure hanno una copia preventiva. La spesa si ricalcola dallo stato; le spunte per quantità vecchie non coprono il nuovo fabbisogno. I backup vecchi senza `people` o `metricOverrides` restano leggibili con la semantica originale. I nuovi dati sono inclusi nell'export/import senza cambiare schemaVersion.

## Verifiche

63 test automatici del progetto, con nove casi nuovi per riproduzione numerica, correzioni, ospiti, conversioni, misure confermate, validazione/import, backup prima della modifica, quota e rese in pezzi. Browser Chromium isolato: 21 controlli sulla correzione e sulle misure, 106 smartphone con touch simulato, 48 del planner, 45 di pasti/schede e 85 del ricettario. I dati numerici delle prove di pesatura sono sintetici, non consigli sui prodotti reali. Nessun accesso al diario dell'utente.

Restano non verificati telefono fisico, Safari, bilancia/confezioni reali. L'app non può conoscere un peso che manca nelle fonti e che non è stato confermato. Le misure mancanti non sono nascoste.
