import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { hash } from 'rsvp';
import EntryGroupByDayList from '../models/entry-group-by-day-list';

export default class IndexRoute extends Route {
  @service store;
  @service router;
  @service authentication;
  @service runningEntry;

  beforeModel() {
    if (this.authentication.notAuthenticated) {
      this.router.transitionTo('login');
    }
  }

  model() {
    const entryListPromise = this.store
      .query('entry', { include: 'project' })
      .then(
        (entries) => new EntryGroupByDayList({ entries: entries.toArray() })
      );

    return hash({
      entryList: entryListPromise,
      _runningEntry: this.runningEntry.promise,
    });
  }
}
