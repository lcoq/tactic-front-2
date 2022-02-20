import Service from '@ember/service';
import { service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { observer, computed } from '@ember/object';
import ArrayPromiseProxy from '../models/array-promise-proxy';

export default class UserSummaryService extends Service {
  @service store;
  @service authentication;

  @reads('authentication.userId') currentUserId = null;

  @computed('currentUserId', 'store')
  get weekEntries() {
    return this._queryWithFilter('current-week');
  }

  @computed('currentUserId', 'store')
  get monthEntries() {
    return this._queryWithFilter('current-month');
  }

  _queryWithFilter(name) {
    if (!this.currentUserId) return;
    const promise = this.store.query('entry', {
      filter: {
        [name]: 1,
        'user-id': [this.currentUserId],
      }
    }).catch((e) => { return []; });
    return ArrayPromiseProxy.create({ promise });
  }
}
