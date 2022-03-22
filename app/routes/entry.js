import Route from '@ember/routing/route';
import { service } from '@ember/service';

import StateManagerListCommitter from '../models/state-manager-list-committer';

export default class EntryRoute extends Route {
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

  model(params) {
    return this.store.findRecord('entry', params.id, { reload: true });
  }

  _willTransition(transition) {
    if (transition.to.find((route) => route.name === this.routeName)) return;

    /* eslint-disable ember/no-controller-access-in-routes */
    /* see issue https://github.com/ember-learn/guides-source/issues/1590 */
    const controller = this.controller;

    const committer = new StateManagerListCommitter();
    committer.addObject(controller.entry.stateManager);

    if (!committer.isClear) {
      transition.abort();
      committer.commit().then(
        () => transition.retry(),
        () => this._alertCommitError()
      );
    }
  }

  _alertCommitError() {
    return alert(
      'The edit cannot be saved, please review your changes or try again.'
    );
  }
}
