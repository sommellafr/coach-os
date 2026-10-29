# Caricare Coach OS su GitHub e pubblicare il sito

## Cosa è già pronto

- Repository Git locale con checkpoint e cronologia, ancora senza repository remoto collegato.
- Verifiche automatiche su ogni push/PR, su Windows e Linux con Node 24.
- Workflow Pages pronto, avviato **manualmente**: caricare il codice non pubblica automaticamente il sito.
- Build statica in `dist/`, con i soli file dell'app, catalogo e immagini; reference, documentazione, test e file di lavoro non sono pubblicati come sito.
- Percorsi compatibili sia con un dominio principale sia con `https://UTENTE.github.io/NOME-REPOSITORY/`.
- Nessuna dipendenza npm da installare, backend, chiave API o secret personale da configurare.

Il workflow segue la [documentazione ufficiale GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), verificata il 29 ottobre 2026. Il deploy usa il token automatico di GitHub con permessi limitati al job di pubblicazione.

## 1. Creare il repository

Su GitHub creare un repository vuoto, ad esempio `coach-os`. Non aggiungere README, licenza o .gitignore sul sito: sono già nel progetto. Non è necessario che il repository si chiami esattamente coach-os.

Scegliere la visibilità desiderata. [GitHub Pages è disponibile con GitHub Free per repository pubblici; per repository privati dipende dal piano](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages). Questa preparazione non attiva abbonamenti. Codice, ricette e immagini saranno accessibili secondo la visibilità del repository e del sito; non sono stati assegnati diritti o una licenza open source alle immagini di terzi.

## 2. Caricare il codice dal PC

In PowerShell, nella cartella del progetto, sostituire UTENTE e NOME-REPOSITORY con quelli scelti:

```powershell
git remote add origin https://github.com/UTENTE/NOME-REPOSITORY.git
git push -u origin HEAD
```

Il branch locale attuale è `master`; il workflow usa il branch predefinito del repository, quindi non è obbligatorio rinominarlo. Se si preferisce `main`, prima del push si può eseguire `git branch -m main`. Nessun force-push necessario.

Autenticarsi tramite la finestra Git Credential Manager di GitHub quando richiesta. Non inserire token nel codice o nell'URL del remote. Se `origin` esiste già, controllarlo con `git remote -v` e usare `git remote set-url origin ...` solo quando è il repository desiderato.

Alternativa senza terminale: GitHub Desktop → **Add existing repository**, selezionare questa cartella e pubblicarla sul proprio account. Lo ZIP `releases/coach-os-github.zip` contiene il sorgente senza cronologia ed è un'ulteriore alternativa per il caricamento manuale; l'import della cartella Git conserva invece i checkpoint.

## 3. Abilitare Pages

Nel repository GitHub:

1. **Settings → Pages**.
2. In **Build and deployment → Source**, scegliere **GitHub Actions**.
3. In **Actions**, aprire **Pubblica sito su GitHub Pages**.
4. Fare **Run workflow** sul branch predefinito (`master` o `main`).
5. Attendere i job build/deploy verdi. Il job deploy restituisce il link del sito, anche in **Settings → Pages**.

Indirizzo usuale: `https://UTENTE.github.io/NOME-REPOSITORY/`. La barra finale è prevista per il caricamento delle risorse relative. Il workflow è eseguito soltanto dal branch predefinito. Per eventuali regole dell'ambiente `github-pages`, autorizzare quel branch nelle impostazioni del repository.

Per gli aggiornamenti futuri: commit, push e poi **Run workflow**. I controlli partono automaticamente sui push; la pubblicazione rimane una scelta esplicita. I controlli falliti impediscono il deploy.

## 4. Verifica locale della versione da pubblicare

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run build
npm.cmd run verify:site
npm.cmd run preview
```

Aprire `http://127.0.0.1:5180/coach-os/`. Questa anteprima serve proprio la cartella dist sotto un percorso come quello di GitHub Pages. Il sito continua a funzionare anche con altri nomi di repository, senza cambiare codice.

La build verifica gli hash delle 31 immagini, rigenera soltanto la cartella dist e non legge localStorage. `verify:site` controlla risorse, moduli, catalogo, immagini e contenuto della cartella pubblicata. Non servono npm install o un package-lock perché non ci sono dipendenze.

Per rigenerare anche lo ZIP del sito, dopo build e verifica eseguire `python scripts/package-site.py`: il risultato è `releases/coach-os-site.zip`, con index.html direttamente alla radice. Lo ZIP dei sorgenti si rigenera con `git archive --format=zip --output=releases/coach-os-github.zip HEAD`, dopo aver salvato i cambiamenti in un commit. Gli ZIP non vanno aggiunti al repository.

## 5. Portare i propri dati sul sito

1. Nell'app locale già usata, **Profilo e dati → Esporta backup JSON**.
2. Aprire il nuovo indirizzo GitHub Pages nel browser desiderato.
3. **Profilo e dati → Importa un backup** e controllare il riepilogo.
4. Ripristinare: l'app conserva una copia locale dello stato precedente alla sostituzione.

La pubblicazione trasferisce l'app, non il diario del browser. Il sito GitHub parte con le schede preimpostate finché non si ripristina il backup. Anche sul sito i dati rimangono nel browser: telefono e PC non si sincronizzano automaticamente. Non caricare i backup personali nel repository; i nomi di backup generati dall'app sono esclusi dal .gitignore.

GitHub Pages usa un'origine diversa da `127.0.0.1`, perciò richiede questo trasferimento esplicito. Siti diversi dello stesso account sotto `UTENTE.github.io` condividono l'origine del browser: usare una sola installazione Coach OS per quell'origine, oppure un dominio separato per ambienti indipendenti. Non è stata cambiata la chiave dei dati esistenti.

## Problemi frequenti

- **Configure Pages restituisce 404:** verificare Settings → Pages → Source → GitHub Actions, poi rilanciare il workflow.
- **Workflow non visibile:** deve essere presente sul branch predefinito e GitHub Actions deve essere abilitato per il repository.
- **Pagina vuota o ricette non caricate:** verificare l'URL completo con nome repository e barra finale, quindi controllare l'esito build/deploy. Non pubblicare direttamente l'intero repository: il workflow carica dist.
- **Dati vuoti sul telefono:** è un archivio browser distinto; usare export/ripristino.
- **Push rifiutato perché il remoto contiene già file:** non usare force-push; scegliere un repository vuoto oppure integrare consapevolmente la cronologia esistente.

## Stato di questa preparazione

Le verifiche locali e in browser sono descritte in IMPLEMENTATION_STATUS.md. Le esecuzioni GitHub Actions e la pubblicazione effettiva richiedono il repository remoto e non sono state eseguite durante questa preparazione.
