# Etichette delle ricette per pasto

Richiesta esplicita: assegnare Colazione, Pranzo e Cena alle ricette e mostrare nella scelta soltanto quelle del pasto selezionato.

Scelta implementativa: classificazione redazionale separata dalle trascrizioni e dalle categorie originali, in `src/recipe-tags.js`. Non cambia ingredienti, dosi, nutrienti o fonti. Le etichette servono a organizzare il menu; non affermano che una ricetta costituisca un pasto completo o nutrizionalmente adatto.

Classificazione iniziale reversibile:

| Etichette | Ricette |
| --- | --- |
| Colazione | Pancake banana e cioccolato; bocconcini di banana, arachidi e cioccolato; crêpes al cacao; cloud bread al cacao; bicchierini di avena, yogurt e cioccolato; tortine al formaggio e cacao; brownies al cacao |
| Pranzo e Cena | Tutte le altre 27 ricette: primi, secondi, piadine e piatti unici |

L'assegnazione dei singoli piatti è una proposta organizzativa, non testo estratto dalle immagini né preferenza personale già confermata. Pranzo e Cena condividono le ricette: nessuna distinzione nutrizionale o esclusione tra questi due pasti è stata dedotta. Una ricetta può avere più etichette.

Il filtro si applica al selettore settimanale, alla sua ricerca e ai menu giornalieri in Calendario e Menu e spesa. Il Ricettario completo mantiene tutte le ricette e aggiunge un filtro Pasto combinabile con ricerca e categoria; le etichette sono visibili sulle schede, nei dettagli e nel selettore.

Gli snapshot già salvati non vengono riclassificati, rimossi o migrati. Anche una ricetta storica pianificata in un pasto diverso rimane consultabile, correggibile e inclusa nella spesa. La modifica del pasto di una voce già salvata rimane libera. L'esportazione del catalogo conserva i dati delle fonti; le etichette redazionali rimangono nel modulo separato.

Una futura ricetta senza etichette resta nel ricettario completo e non viene assegnata implicitamente a un pasto. Il test di copertura segnala l'assenza, richiedendo una classificazione esplicita prima del rilascio. Nessuna migrazione del diario è necessaria.
