import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NotFoundRoute extends Route {
  @service router;
  @service authentication;

  beforeModel() {
    if (this.authentication.notAuthenticated) {
      this.router.transitionTo('login');
    }
  }
}
