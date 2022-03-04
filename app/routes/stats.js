import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { hash } from 'rsvp';

import NullClientModel from '../models/null-client';
import NullProjectModel from '../models/null-project';

export default class StatsRoute extends Route {
  @service store;
  @service router;
  @service authentication;

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
    controller.load();
  }
}
