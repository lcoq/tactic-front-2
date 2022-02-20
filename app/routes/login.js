import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class LoginRoute extends Route {
  @service store;

  model() {
    return this.store.query('user', {});
  }
}
