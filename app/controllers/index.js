import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import { resolve } from 'rsvp';

export default class IndexController extends Controller {
  @service store;
  @service userSummary;

  waitingEntries = [];

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
    // TODO
  }

  @action searchProjects(query) {
    if (isEmpty(query)) {
      return resolve();
    }
    return this.store.query('project', { filter: { query: query } });
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
