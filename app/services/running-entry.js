import Service, { service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import PromiseProxyObject from '../models/promise-proxy-object';

export default class RunningEntryService extends Service {
  @service store;
  @service authentication;

  @reads('entry.isStarted') isStarted;

  @computed('promise.isFulfilled')
  get entry() {
    if (this.promise && this.promise.isFulfilled) {
      return this.promise.content || this.store.createRecord('entry');
    }
  }
  set entry(newEntry) {
    return newEntry;
  };

  @computed('authentication.notAuthenticated')
  get promise() {
    if (this.authentication.notAuthenticated) return;
    const promise = this.store.queryRecord('entry', {
      filter: { running: 1 },
      include: 'project'
    });
    return PromiseProxyObject.create({ promise });
  }
}
