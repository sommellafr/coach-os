import { clone, freshState, parseBackup, validateState } from './domain.js';
import { seedUntouchedTemplates } from './presets.js';

export const STORAGE_KEY = 'coach_os_v1';
export const BACKUP_PREFIX = 'coach_os_backup_';
// Un fallimento non aggiorna mai lo stato pubblicato alla UI.
export class Repository {
  constructor(storage) {
    this.storage = storage;
    this.raw = null;
    this.state = freshState();
    this.error = null;
    this.blocked = false;
    this.accessFailed = false;
    try {
      this.raw = storage.getItem(STORAGE_KEY);
      if (this.raw !== null) {
        this.state = parseBackup(this.raw);
        const seeded = seedUntouchedTemplates(this.state);
        if (seeded.changed) {
          try { this.commit(seeded.state,{backup:true}); }
          catch (error) { this.error = `Caricamento delle schede storiche non riuscito: ${error.message} Archivio precedente intatto; puoi ancora esportarlo.`; }
        }
      }
    } catch (error) {
      this.error = `Lettura non riuscita: ${error.message} Nessun dato è stato cancellato.`;
      this.blocked = true;
      this.accessFailed = this.raw === null;
    }
  }
  checkConcurrent() {
    if (this.storage.getItem(STORAGE_KEY) !== this.raw) throw Error('Dati modificati in un’altra scheda. Copia eventuali campi non salvati, poi ricarica la pagina prima di salvare.');
  }
  commit(next, { restore = false, backup = false } = {}) {
    if (this.accessFailed || (this.blocked && !restore)) throw Error('Salvataggio bloccato: recupera i dati da Profilo e dati.');
    const candidate = clone(validateState(next));
    candidate.revision = Math.max(this.state.revision, candidate.revision) + 1;
    candidate.updatedAt = new Date().toISOString();
    const raw = JSON.stringify(candidate);
    // Stesso limite del lettore: ogni salvataggio deve essere ripristinabile.
    parseBackup(raw);
    this.checkConcurrent();
    let backupKey = null;
    if ((restore || backup) && this.raw !== null) {
      backupKey = `${BACKUP_PREFIX}${crypto.randomUUID()}`;
      this.storage.setItem(backupKey, this.raw);
      if (this.storage.getItem(backupKey) !== this.raw) throw Error('Backup di sicurezza non riuscito. Ripristino annullato.');
    }
    this.storage.setItem(STORAGE_KEY, raw);
    this.raw = raw;
    this.state = candidate;
    this.error = null;
    this.blocked = false;
    return backupKey;
  }
  update(operation) {
    const next = clone(this.state);
    const result = operation(next);
    this.commit(next);
    return result;
  }
  restore(raw) { return this.commit(seedUntouchedTemplates(parseBackup(raw)).state, { restore: true }); }
  export() {
    if (this.blocked) throw Error('Archivio non leggibile: scarica il contenuto locale originale, se disponibile.');
    return JSON.stringify(this.state, null, 2);
  }
  backups() {
    const result = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(BACKUP_PREFIX)) result.push({ key, raw: this.storage.getItem(key) });
    }
    return result;
  }
}
