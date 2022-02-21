import Service from '@ember/service';
import { service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { observer, computed } from '@ember/object';
import PromiseProxyObject from '../models/promise-proxy-object';
import { action } from '@ember/object';

export default class UserSummaryService extends Service {
  @service store;
  @service authentication;

  @reads('authentication.userId') currentUserId = null;

  @reads('_weekEntries.content') weekEntries;
  @reads('_monthEntries.content') monthEntries;

  _forceReload = null;

  @computed('currentUserId', '_forceReload')
  get _monthEntries() {
    return this._queryWithFilter('current-month');
  }

  @computed('currentUserId', '_forceReload')
  get _weekEntries() {
    return this._queryWithFilter('current-week');
  }

  @action reload() {
    this.notifyPropertyChange('_forceReload');
  }

  _queryWithFilter(name) {
    if (!this.currentUserId) return;
    const promise = this.store.query('entry', {
      filter: {
        [name]: 1,
        'user-id': [this.currentUserId],
      },
    });
    return PromiseProxyObject.create({ promise });
  }
}
