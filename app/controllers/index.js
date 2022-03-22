import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import { resolve, reject } from 'rsvp';
import RunningEntryStateManager from '../models/running-entry-state-manager';
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';

export default class IndexController extends Controller {
  @service store;
  @service userSummary;
  @service runningEntry;

  waitingEntries = [];

  get entryList() {
    return this.model.entryList;
  }

  get newEntry() {
    return this.runningEntry.entry;
  }
  set newEntry(newEntry) {
    this.runningEntry.entry = newEntry;
  }

  _newEntryStateManagerCache = createCache(() => {
    return new RunningEntryStateManager({ source: this.newEntry });
  });

  get newEntryStateManager() {
    return getValue(this._newEntryStateManagerCache);
  }

  get newEntryIsSaveErrored() {
    return this.newEntryStateManager.isSaveErrored;
  }

  get newEntryIsPendingSave() {
    return this.newEntryStateManager.isPendingSave;
  }

  @action willUpdateEntry(entry) {
    this.waitingEntries.pushObject(entry);
  }

  @action didUpdateEntry(entry) {
    this.waitingEntries.removeObject(entry);
    this._reloadOrScheduleUserSummary();
  }

  @action willDeleteEntry(entry) {
    this.waitingEntries.pushObject(entry);
  }

  @action didDeleteEntry(entry) {
    this.waitingEntries.removeObject(entry);
    this._reloadOrScheduleUserSummary();
  }

  @action didRevertEntry(entry) {
    this.waitingEntries.removeObject(entry);
    if (this.waitingEntries.length === 0 && this.shouldUpdateSummary) {
      this._reloadUserSummary();
    }
  }

  @action restartEntry(entry) {
    const before = this.newEntry.isStarted ? this._stopNewEntry() : resolve();
    before.finally(() => {
      this._buildNewEntry({ title: entry.title, project: entry.project });
      this.startTimer();
    });
  }

  @action startTimer() {
    this._saveEntryStoppedOnlyLocally().then(
      () => this.newEntryStateManager.send('start'),
      () => this.newEntryStateManager.send('startWithSaveError')
    );
  }

  @action stopTimer() {
    this._stopNewEntry().finally(() => {
      this._buildNewEntry();
    });
  }

  @action setProjectOnNewEntry(project) {
    const entry = this.newEntry;
    const stateManager = this.newEntryStateManager;
    const setProject = () => {
      entry.project = project;
      this.didUpdateNewEntry();
    };
    if (entry.isSaving) {
      stateManager.once('didSave', setProject, this);
    } else {
      setProject();
    }
  }

  @action didUpdateNewEntry() {
    this._saveEntryStoppedOnlyLocally().then(() =>
      this.newEntryStateManager.send('update')
    );
  }

  @action forceSaveNewEntry() {
    this._saveEntryStoppedOnlyLocally().then(() =>
      this.newEntryStateManager.send('forceSave')
    );
  }

  @action retrySaveNewEntry() {
    this._saveEntryStoppedOnlyLocally().then(() =>
      this.newEntryStateManager.send('retry')
    );
  }

  @action searchProjects(query) {
    if (isEmpty(query)) {
      return resolve();
    }
    return this.store.query('project', { filter: { query: query } });
  }

  _stopNewEntry() {
    const stateManager = this.newEntryStateManager;
    const entry = this.newEntry;
    return stateManager
      .send('stop')
      .then(
        () => {
          this._reloadOrScheduleUserSummary();
        },
        () => {
          if (stateManager.isSaveErrored) {
            if (this._isStoppedOnlyLocally(entry)) {
              this._entryStoppedOnlyLocally = entry;
            }
            // TODO move new entry state manager logic to the entry state manager ?
            entry.stateManager.transitionTo('saveError');
          }
          return reject();
        }
      )
      .finally(() => {
        this.entryList.addEntry(entry);
      });
  }

  _buildNewEntry(attributes) {
    const entry = this.store.createRecord('entry', attributes ?? {});
    this.newEntry = entry;
  }

  /* We need to save the entry that is still running in the server before saving
     new running entry because there can't be 2 running entries server-side at
     the same time. */
  _saveEntryStoppedOnlyLocally() {
    const entryStoppedOnlyLocally = this._entryStoppedOnlyLocally;
    if (!entryStoppedOnlyLocally) return resolve();

    /* avoid saving tries on each character typed */
    const debounce = 1.5 * 1000;
    const newTime = new Date().getTime();
    if (newTime - this._lastRetrySaveEntryStoppedOnlyLocallyTime < debounce) {
      return this._retrySaveEntryStoppedOnlyLocallyPromise;
    }
    this._lastRetrySaveEntryStoppedOnlyLocallyTime = newTime;

    /* ensure previous `retry` is done in order to avoid send `retry` on PendingSave state */
    this._retrySaveEntryStoppedOnlyLocallyPromise =
      this._retrySaveEntryStoppedOnlyLocallyPromise
        .then(null, () => {
          return entryStoppedOnlyLocally.stateManager.send('retry');
        })
        .then(() => {
          this._entryStoppedOnlyLocally = null;
          this._retrySaveEntryStoppedOnlyLocallyPromise = reject();
          return resolve();
        });
    return this._retrySaveEntryStoppedOnlyLocallyPromise;
  }

  _entryStoppedOnlyLocally = null;
  _lastRetrySaveEntryStoppedOnlyLocallyTime = 0;
  _retrySaveEntryStoppedOnlyLocallyPromise = reject();

  _reloadOrScheduleUserSummary() {
    if (this.waitingEntries.length === 0) {
      this._reloadUserSummary();
    } else {
      this._scheduleReloadUserSummary();
    }
  }

  _reloadUserSummary() {
    this.shouldUpdateSummary = false;
    this.userSummary.reload();
  }

  _scheduleReloadUserSummary() {
    this.shouldUpdateSummary = true;
  }

  _isStoppedOnlyLocally(entry) {
    const changedAttributes = entry.changedAttributes();
    return (
      changedAttributes.stoppedAt && changedAttributes.stoppedAt[0] === null
    );
  }
}
