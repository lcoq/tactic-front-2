import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AccountRoute extends Route {
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
    return this.store.findRecord('user', this.authentication.userId, {
      include: 'configs',
      reload: true,
    });
  }

  _willTransition(transition) {
    if (transition.to.find((route) => route.name === this.routeName)) return;

    /* eslint-disable ember/no-controller-access-in-routes */
    /* see issue https://github.com/ember-learn/guides-source/issues/1590 */
    const controller = this.controller;

    if (controller.hasChanged) {
      controller.user.rollbackAttributes();
    }
  }
}
