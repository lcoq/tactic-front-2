import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';

export default class LoginController extends Controller {
  @service store;
  @service authentication;
  @service router;

  @action logIn(userId, password) {
    const loginUser = this.model.findBy('id', userId);
    this.store
      .createRecord('session', { user: loginUser.user, password: password })
      .save({ adapterOptions: { include: 'user,user.configs' } })
      .then((session) => this.authentication.authenticate(session))
      .then(() => this.router.transitionTo('index'))
      .catch((error) => {
        console.log(error);
        loginUser.hasError = true;
      });
  }

  @action clearError(userId) {
    const loginUser = this.model.findBy('id', userId);
    loginUser.hasError = false;
  }
}
