# Prossime migliorie: meno tempo per registrare, più utilità

Piano del 30 ottobre 2026. Stato aggiornato: fasi 1 e 2 implementate nella 0.6.0 ([FOOD_DIARY.md](FOOD_DIARY.md)); fase 3 implementata nella 0.7.0 ([NUTRITION_ESTIMATES.md](NUTRITION_ESTIMATES.md)). Le fasi successive rimangono pianificate. Priorità alimentare concordata: nutrienti delle ricette, poi generatore mensile (fase 5 della tabella), anticipato rispetto alle nuove schede/Fat Bank. Gli obiettivi di usabilità sotto restano da misurare con utenti.

## Richieste confermate

- Usabilità immediata: l'app deve far risparmiare tempo anche quando crescono le funzioni.
- Tre schede Total Body complete; tapis roulant con velocità e pendenza oltre alla durata.
- Piano alimentare mensile: target kcal scelto, cinque o sei giorni pianificati e uno o due liberi; tre pasti al giorno, varietà e obiettivo proteico iniziale di 1,5 g/kg modificabile.
- Possibilità di eliminare tutti i pasti salvati, con controllo dell'ambito e protezione dei dati.
- Nutrienti stimabili dalle tabelle alimentari e da quantità medie documentate, senza presentarli come estratti dalle immagini.
- Alimenti singoli e pasti composti liberamente; scansione del codice a barre, quantità mangiata e inserimento manuale dei valori per 100 g/ml.
- Fat Bank in kg stimati, con deficit cumulato in kcal subito sotto; convenzione richiesta di 7.000 kcal per kg equivalente, distinta dal peso misurato.
- Nessuna API o servizio a pagamento.
- Esperienza unificata ispirata alla rapidità del diario alimentare di Yazio e del registro allenamenti di Hevy: grafici delle rilevazioni per esercizio, riepiloghi di progresso in home e kg/ripetizioni precedenti proposti per ridurre la digitazione. Sono riferimenti di esperienza richiesti, non integrazioni o copie di quelle applicazioni.

## Regole di esperienza proposte

La schermata Oggi privilegia tre azioni: aggiungere ciò che si è mangiato, aprire la seduta e consultare il prossimo pasto. Le etichette finali saranno verificate sul prototipo. Mantenere gli accessi esistenti e la data consultata; nessuna nuova destinazione principale per ogni funzione.

Configurazione progressiva: nessun questionario per iniziare a registrare un alimento. Peso, obiettivo e preferenze si chiedono quando servono per generare il piano o calcolare le stime. Non reinserire dati già confermati; aggiornarli senza riscrivere lo storico.

Per aggiungere un alimento: recenti/preferiti o scansione/ricerca → quantità → aggiungi. Più ingredienti restano nello stesso pasto in costruzione, con totale sempre visibile e una conferma finale. Tastiera numerica per i grammi, focus sul campo utile, nessun campo tecnico visibile. Funzioni alternative nello stesso selettore, senza tre procedure separate da imparare.

Riusare scelte: prodotti recenti, pasti abituali, copia da ieri, porzioni abituali modificabili. Un pasto pianificato può essere confermato come mangiato o sostituito con alimenti liberi. Sostituire non deve duplicare piano e consumo. Preparato, consumato e acquistato restano eventi diversi.

Mostrare subito totali e prossima azione; fonti, formule e dettagli della qualità sono apribili. Valori mancanti e stime restano riconoscibili anche nel riepilogo. Riservare conferme esplicite alle azioni che eliminano dati, cambiano molti giorni o scaricano scorte. Errori recuperabili senza perdere il modulo; annullamento dove possibile.

## Ordine di consegna e criteri di accettazione

| Fase | Risultato utilizzabile | Condizione per considerarla pronta |
|---|---|---|
| 1. Registrazione rapida | Alimenti per nome, prodotti personali, valori per 100 g/ml, quantità mangiata, pasto composto, recenti e abituali | Registrare 100 g salmone + 50 g robiola + 100 g piadina + 5 g olio nello stesso pranzo; correggere, riaprire ed esportare senza duplicati. Una registrazione non richiede il piano mensile |
| 2. Codice a barre | Fotocamera e ricerca gratuita Open Food Facts, alternativa con codice digitato e inserimento etichetta | Prodotto trovato, sconosciuto, incompleto, fotocamera negata e rete assente hanno percorsi recuperabili. Mostrare prodotto e valori prima della conferma. Ripetere un alimento già salvato senza nuova richiesta di rete |
| 3. Ricette e nutrienti | Mappatura ingredienti alle tabelle e alle etichette, stime per una porzione, pesi medi espliciti e modificabili | Audit di tutte le 34 ricette; ogni valore ha fonte, base e ipotesi. Quantità importanti mancanti non diventano zero. Test crudo/cotto, g/ml, opzionali, intervalli, dosi e pesi medi |
| 4. Allenamento | Nuove Total Body A/B/C e tapis roulant per blocchi di durata, velocità km/h e pendenza %; target e risultati separati | Schede adatte al contesto dichiarato e con alternative; preservare schede personali e storico. Registrare due blocchi cardio diversi, modificare e riaprire ritrovando tutti i parametri |
| 5. Mese alimentare | Procedura breve, proposta mensile, sostituzione singolo piatto, blocco preferiti e rigenerazione selettiva; spesa settimanale derivata | Cinque/sei giorni pianificati, giorni liberi scelti, mesi di diversa durata, target visibile, copertura nutrizionale e varietà verificabili. Nessuna sovrascrittura implicita dei pasti già salvati |
| 6. Fat Bank | Kg equivalenti stimati, kcal di deficit sotto, previsione separata dal bilancio registrato e peso misurato | Nessun doppio conteggio del movimento; allenamenti futuri nel solo previsto, giorni incompleti esclusi dal registrato con copertura visibile; surplus e correzioni aggiornano il cumulato una volta |

Ogni fase comprende un percorso mobile funzionante e verificato prima di passare alla successiva. Le soglie temporali sotto sono obiettivi di progetto, non risultati già misurati. Nelle fasi 1–3 privilegiare una base nutrizionale comune, così scansione, ricette e generatore riusano gli stessi calcoli.

## Piano mensile: impostare poco, correggere facilmente

Procedura proposta in tre schermate: 1) mese, kcal al giorno e peso se assente; 2) giorni pianificati/liberi e preferenze alimentari; 3) anteprima da confermare. Le preferenze già salvate non vanno reinserite. Allergie ed esclusioni devono essere rispettate; dati incerti non autorizzano a dichiarare un prodotto sicuro.

Kcal e proteine sono obiettivi espliciti, non valori garantiti. Il coefficiente di 1,5 g/kg è la preferenza iniziale richiesta, non una prescrizione universale. Le tolleranze del generatore vanno definite e mostrate in modo comprensibile; se non esiste una combinazione adeguata, mostrare lo scostamento senza fingere di aver raggiunto il target. Il valore di 1.600 kcal è un esempio dell'utente, non un target preimpostato o validato per tutti.

La selezione considera gruppi alimentari, fonti proteiche, presenza di frutta/verdura e ripetizioni nella settimana, non soltanto kcal. Nessuna promessa di completezza nutrizionale basata soltanto su calorie e proteine. Una porzione resta la base; adattamenti pratici degli ingredienti sono espliciti. Non generare automaticamente due pranzi completi per colmare un target. I giorni liberi sono senza proposta automatica, registrabili e privi di giudizi morali.

Anteprima prima di salvare; conservare i piatti esistenti come impostazione iniziale. Rigenerare solo le caselle richieste. Quando un alimento libero sostituisce un piano, aggiornare fabbisogno e prenotazioni senza dedurre automaticamente un acquisto o uno scarico reale.

Gestione pasti da un solo menu secondario: svuota settimana, mese o tutti i pasti. Anteprima con intervallo e numero di voci. Per impostazione iniziale eliminare i soli pianificati; includere i consumati richiede una scelta distinta e chiara. Backup scaricabile prima della cancellazione, operazione atomica, recupero tramite backup. Acquisti e scarichi della dispensa non sono cancellati implicitamente; se coinvolti, l'anteprima spiega cosa rimane e come annullare un movimento.

## Nutrienti e prodotti: qualità e disponibilità

Fonti candidate già individuate: [CREA](https://www.alimentinutrizione.it/), [USDA FoodData Central](https://fdc.nal.usda.gov/), etichette dei produttori e [Open Food Facts](https://openfoodfacts.github.io/documentation/docs/Product-Opener/v2/products/get-product-by-code/). Nessun servizio a pagamento o invio del diario a queste fonti. Prima dell'integrazione verificare licenze, attribuzione, limiti di richieste e uso dal dominio Pages; conservare provenienza e versione dei riferimenti.

Salvare una copia dei valori usati nella registrazione: una successiva correzione del prodotto non modifica i pasti storici. Campi nutrienti assenti restano sconosciuti, distinti da zero. Controllare base 100 g/100 ml/porzione, kcal rispetto a kJ e valori per alimento preparato. Per i prodotti specifici preferire l'etichetta corrispondente alla confezione; pesi medi e alimenti generici sono stime modificabili.

Scansione EAN/UPC come percorso principale; un QR generico può contenere solo un link e non garantisce dati nutrizionali. Lettura locale dell'immagine, richiesta di rete per il codice prodotto; fotocamera aperta solo su azione e chiusa all'uscita. Verificare una soluzione compatibile con Android e iPhone, senza affidarsi soltanto a BarcodeDetector nativo. Nessuna promessa di catalogo completo o funzionamento offline per prodotti mai cercati.

## Allenamento e Fat Bank: formule verificabili

### Registrare una seduta con pochi tocchi

Proposta di flusso: Oggi → Apri allenamento → riga con precedente, kg e ripetizioni proposti → conferma serie eseguita. Proporre l'ultima serie corrispondente dello stesso esercizio e della stessa attrezzatura, anziché duplicare indiscriminatamente la prima serie su tutte le righe. Se manca un precedente comparabile usare il target della scheda; senza target lasciare il campo vuoto. Distinguere carico totale del bilanciere, peso per manubrio, macchina, corpo libero e assistenza.

La precompilazione è una proposta, mai una prestazione già effettuata: serie nuove non completate, nessun punto sul grafico o caloria dal solo valore proposto. Mostrare data del precedente; un lungo intervallo senza sedute non rende il vecchio carico un suggerimento di ripresa validato. Consentire correzione immediata, aggiunta serie con valori proposti e annullamento. Completare una seduta non marca implicitamente tutte le serie come eseguite.

Aggiungi esercizio apre ricerca nello stesso contesto, con recenti/preferiti prima del catalogo. Se non c'è corrispondenza, creazione rapida: nome e modalità essenziale del carico; dettagli e muscoli facoltativi e modificabili. ID stabile per evitare che una rinomina spezzi il grafico. Le varianti con attrezzatura diversa non vengono fuse dal solo nome. Obiettivo di prova: aggiungere un esercizio esistente in massimo tre azioni esclusa la digitazione e confermare una serie invariata con un tocco. Cronometrare una seduta sintetica e verificare ripresa dopo riapertura.

### Grafici delle prestazioni e riepiloghi

Ogni esercizio ha storico per date reali con kg, ripetizioni e serie registrate. Grafico del carico nel tempo con dettaglio della rilevazione (esempio 40 kg × 10); filtri per periodo e ripetizioni, tabella accessibile e distinzione riscaldamento/serie allenanti. Se ci sono più serie nella giornata, dichiarare quale rappresenta il punto riassuntivo e rendere consultabili tutte le serie. Correzioni e rimozioni aggiornano lo storico senza duplicati; sedute future, proposte e serie non confermate non entrano nei grafici. Nessuna seduta mancante diventa un punto a zero.

Riepilogo home proposto: **Panca piana: +12,5% di carico a pari ripetizioni**, dettaglio **da 40 × 10 a 45 × 10**, periodo e date consultabili. Confronto iniziale/finale tra rilevazioni comparabili nel periodo, con criterio dichiarato e numero di sedute; record personale separato dalla variazione del mese. La permanenza a 40 kg produce punti allo stesso livello; una successiva rilevazione a 45 kg mostra l'aumento senza inventare progressioni nei giorni intermedi.

Se cambiano le ripetizioni mostrare i due risultati senza dichiarare automaticamente una percentuale di forza: 40 × 10 e 45 × 5 non autorizzano lo stesso riepilogo. Un futuro massimale stimato richiede modello validato, dominio applicabile e dicitura esplicita; nessun obbligo di provare massimali. Distinguere andamento del carico, volume e forza stimata.

Non usare **petto più potente del 10%** dai soli kg registrati: potenza e forza non sono la stessa misura e un esercizio coinvolge più muscoli. Per gruppo muscolare proporre frequenza e serie allenanti con copertura dei dati. Un eventuale indice di prestazione del gruppo è fase successiva: richiede esercizi stabili, metodo documentato, ponderazione e copertura; non è una media grezza delle percentuali né una somma di tonnellaggi. Non introdurre un indice generale di forza prima dei grafici per esercizio.

Proposta home compatta: una scheda di progresso utile con collegamento ai dettagli, senza un nuovo pannello per ogni muscolo. In assenza di dati comparabili mostrare **Registra altre sedute per confrontare i progressi**; una correzione al ribasso o un periodo senza allenamenti non produce messaggi di crescita inventati. Il riepilogo non sostituisce le azioni quotidiane.

Criteri di accettazione aggiuntivi: precompilazione senza consumo né risultati impliciti; conferma idempotente; rinomina con continuità storica; macchina e bilanciere separati; 40 × 10 → 45 × 10 = +12,5% di carico; ripetizioni diverse senza falsa equivalenza; target zero e dati mancanti non calcolabili; confronto mensile senza cherry-picking dei record; correzioni e backup riproducibili. Queste capacità entrano nella fase 4 insieme alle nuove schede, prima della Fat Bank.

Le nuove schede sono proposte separate dalle basi V21. Raccolta minima al primo utilizzo: palestra/casa, attrezzatura, esperienza, tempo e limitazioni. Si possono preparare alternative generali prima delle risposte, ma non dichiararle già personalizzate. Prima dei suggerimenti operativi validare selezione, volume, recuperi e progressione con [ACSM](https://acsm.org/resistance-training-guidelines-update-2026/). Nessun obbligo di test massimale.

Per il tapis roulant validare un modello che usi peso, velocità, pendenza e durata, con intervalli di applicabilità e gestione di cammino/corsa. Nessuna precisione individuale garantita; velocità o pendenza mancanti non diventano automaticamente zero. Per i pesi stimare a livello di seduta da durata e intensità, non dal tonnellaggio di esercizi diversi; validare i riferimenti nel [Compendium](https://pacompendium.com/).

Convenzione proposta: dispendio di base e attività quotidiana distinti dal contributo netto dell'allenamento, evitando doppio conteggio con il livello di attività del profilo. Scegliere e documentare il modello prima di renderlo operativo. Profilo e obiettivi hanno validità temporale: una modifica non deve riscrivere il bilancio passato.

Esempio Fat Bank confermato dall'utente: **Perdita di grasso stimata: 0,5 kg**, sotto **Da un deficit energetico cumulato di 3.500 kcal**, nota **Stima teorica, distinta dal peso misurato**. Coefficiente richiesto: 7.000 kcal/kg equivalente. È una convenzione visuale, non una conversione fisiologica esatta o una previsione certa: riferimento sui limiti dei modelli statici [Hall et al.](https://pubmed.ncbi.nlm.nih.gov/21872751/).

Il previsto deriva da menu e sedute pianificati; il bilancio registrato richiede pasti completi e dispendio stimabile, non la sola presenza di una voce. Consentire chiusura rapida del giorno e correzione. Escludere giorni liberi non registrati e dati mancanti; indicare giorni coperti su giorni del periodo. I surplus riducono il cumulato, senza azzeramenti che lo gonfiano: se il saldo complessivo è un surplus, cambiare la dicitura in equivalente di surplus. Stime mancanti non producono kg. Nessun suggerimento automatico di restrizioni per compensare un giorno libero.

## Criteri trasversali di usabilità e affidabilità

- Obiettivo: riaggiungere un alimento recente in massimo tre azioni, esclusa la digitazione della quantità; misurare separatamente il numero di tocchi e il tempo.
- Obiettivo: registrare un pasto abituale in meno di 15 secondi e comporre il pasto di quattro alimenti già conosciuti in meno di un minuto, dopo aver conosciuto il percorso. Cronometrare nel test, non dichiararlo raggiunto in anticipo.
- Generare il mese in tre schermate; aprire da Oggi la seduta o la spesa con un'azione. Nessun obbligo di usare tutte le funzioni per registrare un pranzo.
- Verifiche a 320/360/390/430 px e in orizzontale: assenza di overflow, tastiera che non copre conferma, controlli principali di almeno 44 px, etichette leggibili, focus e accessibilità da tastiera. Testare fotocamera su dispositivi reali dove disponibili, dichiarando i dispositivi non verificati.
- Non perdere data, scroll, ricerca o pasto in costruzione quando si torna indietro. Conferma visibile dopo il salvataggio, gestione esplicita di errore rete/storage e conflitti tra schede.
- Test significativi su calcoli, snapshot, quantità, date civili, giorni liberi, registrazioni incomplete, import/export, backup e compatibilità con lo stato 0.5.0. Nessuna cancellazione dei dati del browser per aggiornare l'app.
- Rilasci piccoli con verifica browser del percorso interessato e controllo di non aver aggiunto passaggi ai flussi già rapidi. Pubblicazione solo entro l'autorizzazione dell'utente; questo piano non avvia un deploy.

## Decisioni ancora da risolvere durante l'implementazione

Contesto delle schede personali; copertura effettiva di nutrienti e codici a barre; tolleranze e regole pratiche del generatore; modello energetico applicabile; compatibilità reale della fotocamera su iPhone. Questi punti non bloccano il disegno dei flussi e l'implementazione dei dati di base. Nessuna scelta implica costi.
