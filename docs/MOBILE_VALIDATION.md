# Verifica smartphone — 29 ottobre 2026

Richiesta esplicita: assicurare l'ottimizzazione smartphone prima del deploy.

Durante l'ispezione sono emersi etichette troppo piccole nelle sei destinazioni della navigazione, comandi da 30–41 px e un campo data che si comprimeva. Risolti in `src/mobile.css`, mantenendo le etichette complete come nomi accessibili.

Modifiche:

- Navigazione inferiore: Oggi, Agenda, Pasti, Schede, Ricette, Dati; testo 10 px, area di tocco di almeno 44 px per destinazione. Etichette complete per tecnologie assistive e desktop.
- Controlli principali di pasti e spesa alti almeno 44 px, compresi cambio settimana, aggiunta ricetta, giorni ripetuti, spunta acquisti ed esportazione. Non è una dichiarazione che ogni singolo controllo del sito abbia tali dimensioni.
- Campo data a 16 px e larghezza verificata di almeno 180 px; layout su una colonna negli schermi più stretti. Il formato mostrato dal controllo nativo dipende dalla lingua del browser, mentre il valore resta YYYY-MM-DD.
- Navigazione mobile anche su dispositivi touch in orizzontale fino a 1000 px e 500 px di altezza. Titolo e footer del selettore non sono fissi in altezza ridotta, così non coprono i campi e il salvataggio.
- Viewport esteso e spazi riservati alle aree sicure del dispositivo, senza disabilitare lo zoom. Scorrimento orizzontale intenzionale nel menu dei sette giorni, senza overflow dell'intera pagina.

`scripts/browser-mobile-qa.js`: **106 controlli superati**, in contesti Chromium separati con touch e viewport mobile, scala 2 e fuso Europe/Berlin.

| Formato CSS | Orientamento |
| --- | --- |
| 320×740 | Verticale compatto |
| 360×800 | Verticale |
| 390×844 | Verticale |
| 430×932 | Verticale ampio |
| 844×390 | Orizzontale |

Per ogni formato: tutte le sei pagine senza overflow globale, navigazione inferiore, etichette dentro i pulsanti, dimensioni dei comandi, data non compressa, raggiungimento dell'ultimo giorno, scelta di una colazione filtrata, selezione ricetta, salvataggio tramite tap, lista della spesa, spunta acquisto, filtro Pasto del ricettario. Nessun errore JavaScript. Screenshot in test-results, esclusi da Git; ispezione visiva eseguita.

Ancora superati i 48 controlli browser del percorso settimanale, inclusi correzioni, persistenza, copia settimana, quota simulata, focus del dialog, esportazione e layout desktop/tablet. Suite del progetto: 54 test automatici superati, oltre a sintassi, build, verifica risorse e hash delle 31 immagini.

Limiti: non verificati Safari/WebKit, telefono fisico, tastiera virtuale reale, barre dinamiche del browser, notch reale, screen reader o modalità testo ingrandito del sistema. La prova touch simulata non certifica tutti questi comportamenti. Nessun diario reale è stato cancellato o utilizzato nelle prove.
