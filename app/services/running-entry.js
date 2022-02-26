import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class RunningEntryService extends Service {
  @service store;
  @service authentication;

  @tracked entry = null;

  constructor() {
    super(...arguments);
    if (this.authentication.isAuthenticated) {
      this.load();
    } else {
      this.authentication.eventEmitter.once('authenticated', this.load, this);
    }
  }

  load() {
    this.store
      .queryRecord('entry', {
        filter: { running: 1 },
        include: 'project',
      })
      .then((entry) => {
        this.entry = entry || this.store.createRecord('entry');
      });
  }

  get isStarted() {
    return this.entry ? this.entry.isStarted : null;
  }
}
