import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AccountRoute extends Route {
  @service store;
  @service router;
  @service authentication;

  beforeModel() {
    if (this.authentication.notAuthenticated) {
      this.router.transitionTo('login');
    }
  }

  model() {
    return this.store.findRecord('user', this.authentication.userId, {
      reload: true,
    });
  }
}
