import Service from '@ember/service';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class UserSummaryService extends Service {
  @service store;
  @service authentication;

  @tracked weekEntries = [];
  @tracked monthEntries = [];

  get currentUserId() {
    return this.authentication.userId;
  }

  @action async reload() {
    this.weekEntries = await this._query('current-week');
    this.monthEntries = await this._query('current-month');
  }

  constructor() {
    super(...arguments);
    if (this.authentication.isAuthenticated) {
      this.reload();
    }
    this.authentication.eventEmitter.on('authenticated', this.reload, this);
  }

  _query(name) {
    return this.store.query('entry', {
      filter: {
        [name]: 1,
        'user-id': [this.currentUserId],
      },
    });
  }
}
