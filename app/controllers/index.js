import Controller from '@ember/controller';
import { action, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import { resolve, reject } from 'rsvp';
import RunningEntryStateManager from '../models/running-entry-state-manager';
import { set } from '@ember/object';

export default class IndexController extends Controller {
  @service store;
  @service userSummary;

  waitingEntries = [];

  @reads('model.newEntry') newEntry;
  @reads('model.entryList') entryList;

  @computed('newEntry')
  get newEntryStateManager() {
    return new RunningEntryStateManager({ source: this.newEntry });
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
    this.newEntryStateManager.send('start');
    this._updateIcon('started');
  }

  @action stopTimer() {
    this._stopNewEntry().finally(() => {
      this._buildNewEntry();
      this._updateIcon('stopped');
    });
  }

  @action setProjectOnNewEntry(project) {
    const entry = this.newEntry;
    const stateManager = this.newEntryStateManager;
    const setProject = () => {
      entry.project = project;
      this.didUpdateNewEntry();
    }
    if (entry.isSaving) {
      stateManager.once('didSave', setProject, this);
    } else {
      setProject();
    }
  }

  @action didUpdateNewEntry() {
    this.newEntryStateManager.send('update');
  }

  @action retrySaveNewEntry() {
    // TODO
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
      .then(() => {
        this._reloadOrScheduleUserSummary();
      }, () => {
        if (stateManager.isSaveErrored) {
          // TODO move new entry state manager logic to the entry state manager ?
          entry.stateManager.transitionTo('saveError');
        }
        return reject();
      })
      .finally(() => {
        this.entryList.addEntry(entry);
      });
  }

  _updateIcon(name) {
    // TODO
  }

  _buildNewEntry(attributes) {
    const entry = this.store.createRecord('entry', attributes ?? {});
    set(this, 'model.newEntry', entry);
  }

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

}
