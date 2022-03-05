import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { hash } from 'rsvp';

import NullClientModel from '../models/null-client';
import NullProjectModel from '../models/null-project';
import EntriesCommitter from '../models/entries-committer';

export default class ReviewsRoute extends Route {
  @service store;
  @service router;
  @service authentication;

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
    const usersPromise = this.store.query('user', {});

    const projectsPromise = this.store.query('project', {}).then((projects) => {
      return [new NullProjectModel(), ...projects.toArray()];
    });

    const clientsPromise = this.store.query('client', {}).then((clients) => {
      return [new NullClientModel(), ...clients.toArray()];
    });

    return hash({
      users: usersPromise,
      projects: projectsPromise,
      clients: clientsPromise,
    });
  }

  setupController(controller /*, model */) {
    super.setupController(...arguments);
    controller.initializeFilters();
    controller.loadEntries();
  }

  _willTransition(transition) {
    if (transition.to.find((route) => route.name === this.routeName)) return;

    /* eslint-disable ember/no-controller-access-in-routes */
    /* see issue https://github.com/ember-learn/guides-source/issues/1590 */
    const controller = this.controller;

    const entriesCommitter = new EntriesCommitter();
    entriesCommitter.addObjects(
      controller.entriesByClientAndProject.entries.mapBy('stateManager')
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
