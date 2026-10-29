# Recupero ricettario

1. Leggere `data/recipe-sources.json`: contiene tutte le 31 immagini rinominate e la corrispondenza originale.
2. Aprire ciascuna immagine con strumenti visivi; eventuale OCR è un ausilio da verificare sulle immagini.
3. Stabilire se contiene una ricetta, più ricette o una continuazione; collegare tutte le fonti e deduplicare soltanto dopo confronto.
4. Trascrivere titolo, ingredienti, dosi, unità, porzioni, nutrizione e istruzioni originali. Registrare campi incerti e mancanti.
5. Aggiungere una guida numerata comprensibile, distinguendo istruzioni lette dalla fonte e integrazioni redazionali. Non attribuire alla fonte temperature o tempi inventati.
6. Calcolare nutrienti soltanto con quantità e fonti adeguate: distinguere valori originali, calcolati e stimati, e crudo/cotto. Nessuna stima silenziosa.
7. Popolare `data/recipes.json` con record verificati. Aggiornare lo stato fonti e i collegamenti recipe_ids.
8. Verificare copertura completa delle 31 fonti prima di dichiarare il ricettario finito.

## Record proposto
id, title, category, servings, ingredients[{ingredientId, label, quantity, unit, preparationState}], sourceSteps[], guideSteps[{text, provenance}], prepMinutes, cookMinutes, nutritionPerServing{kcal, proteinG, carbsG, fatG, source, method}, sourceIds[], reviewStatus, uncertainties[]. Usare null per quantità mancanti, non zero.

## Stato del pacchetto originale
Le immagini sono incluse e verificate come file leggibili; i loro contenuti non sono ancora stati letti, interpretati o trascritti. Il contenitore ricette è volutamente vuoto. Le 10 ricette del prototipo restano solo nel sorgente di riferimento e non sono certificate rispetto alle immagini.

## Esito implementato il 29 ottobre 2026

Tutte le 31 immagini aperte e lette visivamente. Catalogo di 34 ricette con quantità/unità, resa quando presente, procedimenti visibili e guide numerate con provenienza per passaggio, nutrienti dichiarati e dubbi. Le cinque piadine della SRC-02 sono ricette distinte; le crêpes di SRC-07/SRC-16 sono un solo record. La continuazione del riso in SRC-03 non diventa una ricetta aggiuntiva. Immagini e metadati originali conservati.

Il generatore `scripts/build-recipe-catalog.mjs` contiene i dati manualmente recuperati e rigenera catalogo, stato delle fonti e `docs/RECIPE_REVIEW.md`, senza modificare le immagini. `src/recipes.js` gestisce lettura, validazione, ricerca, dosi e presentazione. I valori mancanti non sono stimati; i totali nutrizionali sono solo moltiplicazioni dichiarate della fonte quando base/resa sono esplicite, e sono disattivati per macro incoerenti. Nessuna integrazione automatica nel diario pasti.
