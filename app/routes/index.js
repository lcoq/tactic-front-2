import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { hash } from 'rsvp';

import EntryGroupByDayList from '../models/entry-group-by-day-list';
import EntriesCommitter from '../models/entries-committer';

export default class IndexRoute extends Route {
  @service store;
  @service router;
  @service authentication;
  @service runningEntry;

  activate() {
    super.activate(...arguments);
    this.router.on('routeWillChange', this, this._willTransition);
  }

  deactivate() {
    super.deactivate(...arguments);
    this.router.off('routeWillChange', this, this._willTransition);
  }

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

  _willTransition(transition) {
    if (transition.to.find((route) => route.name === this.routeName)) return;

    /* eslint-disable ember/no-controller-access-in-routes */
    /* see issue https://github.com/ember-learn/guides-source/issues/1590 */
    const controller = this.controller;

    const entriesCommitter = new EntriesCommitter();
    entriesCommitter.addObject(controller.newEntryStateManager);
    entriesCommitter.addObjects(
      controller.entryList.entries.mapBy('stateManager')
    );

    if (!entriesCommitter.isClear) {
      transition.abort();
      entriesCommitter.commit().then(
        () => transition.retry(),
        () =>
          alert(
            'Some edits cannot be saved, please review your changes or try again.'
          )
      );
    }
  }
}
