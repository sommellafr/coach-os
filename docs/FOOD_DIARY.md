# Diario alimentare rapido e codici a barre · 0.6.0

Implementa le prime due fasi di NEXT_IMPROVEMENTS.md. Le altre fasi rimangono pianificate.

## Percorso quotidiano

Da **Oggi → Aggiungi pasto**, oppure dal diario della data in Calendario, scegli un alimento già salvato, scansioni un codice a barre o inserisci l'etichetta. Indica i g/ml mangiati e aggiungi gli altri alimenti. Il riepilogo mostra kcal, proteine, carboidrati e grassi; una conferma finale salva il pasto consumato. Data, categoria e nome sono in una sezione apribile per non rallentare il percorso abituale.

Recenti e preferiti sono cercabili per nome/marca; la ricerca testuale riguarda i propri prodotti salvati, non l'intero catalogo alimentare online. Un alimento nuovo senza confezione si inserisce manualmente; il catalogo generico con tabelle alimentari fa parte della fase successiva. I preferiti hanno priorità, la quantità dell'ultimo utilizzo viene riproposta ed è modificabile. Per prodotti completi basta cambiare la quantità: valori e dettagli sono apribili. Un pasto può essere salvato tra gli abituali e riaggiunto senza ricomporlo, con un nuovo identificativo di registrazione. Correzioni dei prodotti non riscrivono i pasti storici o le copie abituali.

Le voci consumate si correggono e rimuovono dal diario; la rimozione crea prima un backup. Non vengono dedotti consumo da un menu pianificato, acquisto o scarico della dispensa. In questa fase non è ancora disponibile la conversione di una ricetta pianificata in pasto consumato, il calcolo degli obiettivi o la Fat Bank. Un totale registrato non significa giornata completa. L'app non elimina il piano ricetta quando si aggiunge un pasto libero.

## Valori e unità

Inserire valori per 100 g oppure 100 ml e quantità consumata nella stessa unità. Ogni nutriente si calcola con `valore_per_100 × quantità / 100`. Esempio sintetico di test (non tabella alimentare): salmone 100 g, robiola 50 g, piadina 100 g e olio 5 g producono 725 kcal con i valori fittizi del test. Non presentarli come valori reali di quei prodotti.

Un nutriente mancante resta `null`, distinto da zero; il relativo totale è indicato da completare, senza sommare soltanto la parte conosciuta e chiamarla totale. Input negativi, non finiti e fuori intervallo sono rifiutati. Il diario ammette oggi e date passate; gli alimenti consumati non vengono registrati nel futuro. I campi per 100 g/ml non stimano densità o pesi medi.

Le registrazioni conservano snapshot di nome, marca, quantità, unità, nutrienti, codice e provenienza. I valori modificati rispetto a Open Food Facts sono marcati manuali. Export e ripristino includono i campi opzionali `foodProducts`, `habitualMeals` e `days[date].foodEntries`. I backup precedenti sono compatibili, senza migrazioni distruttive. Limiti: 1000 prodotti, 100 pasti abituali, 60 registrazioni per data, 50 alimenti per registrazione; rimane il limite generale di 5 MB del backup. Salvataggio atomico e conflitti tra schede sono gestiti dal repository esistente. In caso di errore, il modulo resta aperto; i contenuti non salvati non persistono dopo chiusura/ricaricamento confermati.

## Servizi gratuiti e libreria locale

Ricerca per codice con API v3 di [Open Food Facts](https://openfoodfacts.github.io/openfoodfacts-server/api/): nessuna chiave o servizio a pagamento. La richiesta è esplicita, con soli campi prodotto necessari e identificazione applicazione in query per l'accesso browser; non invia pasti, grammi, diario o foto. Come ogni accesso diretto, il servizio riceve l'indirizzo IP. Nessuna scrittura verso Open Food Facts. I risultati possono essere mancanti o errati: l'utente verifica e corregge l'etichetta. È prevista conversione da kJ a kcal solo quando l'unità è esplicita, senza indovinare la base da campi generici.

Cache della sessione e riuso dei prodotti salvati evitano nuove richieste per codici già conosciuti. Protezione locale: massimo 12 richieste/minuto per sessione contro il limite documentato di 15 letture prodotto/minuto/IP; schede o dispositivi sulla stessa rete condividono il limite del servizio. Timeout, rete assente, risposta 404/429 e indisponibilità mostrano un'alternativa manuale. Una scheda manuale creata dopo un codice non trovato conserva quel codice per il riuso. Non viene promessa disponibilità del servizio o copertura di tutti i prodotti. Non è una PWA offline: i prodotti salvati si riusano senza rete quando l'app è caricata, ma il caricamento iniziale del sito richiede le risorse.

Attribuzione Open Food Facts visibile nell'interfaccia e provenienza conservata per prodotto. Dati soggetti a [ODbL](https://opendatacommons.org/licenses/odbl/1-0/) e contenuti a [Database Contents License](https://opendatacommons.org/licenses/dbcl/1-0/); rispettare attribuzione e condizioni di condivisione in eventuali distribuzioni di raccolte derivate. Non viene distribuito un catalogo Open Food Facts nel sito. Verificare con il servizio le procedure di registrazione dell'app prima di estendere l'uso pubblico: il sito personale non invia form o messaggi per conto dell'utente.

Scanner EAN-13/EAN-8/UPC-A/UPC-E con ZXing JS Library 0.21.3, incluso localmente, senza CDN durante l'uso. Fonte: [zxing-js/library](https://github.com/zxing-js/library), distribuzione npm `@zxing/library@0.21.3`. Licenza Apache-2.0 in `src/barcode-license.txt`. SHA-256 di `src/barcode-vendor.js`: `d7cc8f69dd70bdcf3ac00c9ae572bf2acb9f4132ba379c72df842e4db918652d`, verificato nella build. Il bundle viene caricato solo avviando la scansione. Non dipende da BarcodeDetector nativo e non invia le immagini. QR generici non vengono interpretati come valori nutrizionali.

Fotocamera su richiesta in HTTPS/localhost, preferenza per quella posteriore, video inline. Tracce chiuse dopo lettura, arresto, chiusura dialog, pagina nascosta o uscita. Gestito anche il permesso accordato dopo la chiusura: lo stream tardivo viene fermato. Alternativa sempre disponibile: digitare il codice o inserire l'etichetta.

## Verifiche e limiti

86 test automatici del progetto, inclusi nuovi casi su somme, mancanti, snapshot, correzioni, compatibilità, backup, quota e lookup. Browser Chromium isolato: 34 controlli del diario e scanner, 111 controlli mobile esistenti ancora superati. Decoder realmente esercitato con un EAN-13 sintetico trasmesso come stream video; verificati arresto tracce, permesso negato e stream tardivo. Risposte OFF trovate/mancanti/incomplete ed errori rete simulati; una richiesta al server ufficiale di staging ha verificato schema v3 e CORS dal browser. Nessun dato privato letto o rimosso. Aspetto mobile ispezionato.

Restano da verificare scansioni con confezioni e fotocamera fisica, Safari/iPhone e condizioni di luce reali. I tempi obiettivo di 15 secondi per un abituale e un minuto per quattro alimenti non sono ancora certificati da prove con utenti. Il successo della decodifica sintetica non equivale a verifica su tutti i telefoni.
