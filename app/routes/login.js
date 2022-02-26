import Route from '@ember/routing/route';
import { service } from '@ember/service';
import LoginUser from '../models/login-user';

export default class LoginRoute extends Route {
  @service store;

  model() {
    return this.store.query('user', {}).then((users) => {
      return users.map((user) => new LoginUser({ user }));
    });
  }
}
