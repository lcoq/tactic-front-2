import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action, computed } from '@ember/object';

export default class LoginController extends Controller {
  @service store;
  @service authentication;
  @service router;

  @computed('model.[]')
  get errorByUserId() {
    const error = {};
    this.model.forEach((user) => {
      error[user.id] = false;
    });
    return error;
  }

  @action logIn(userId, password) {
    const user = this.model.findBy('id', userId);
    this.store
      .createRecord('session', { user: user, password: password })
      .save()
      .then((session) => {
        this.authentication.authenticate(session);
        this.router.transitionTo('index');
      })
      .catch(() => {
        this.set(`errorByUserId.${user.id}`, true);
      });
  }

  @action clearError(userId) {
    this.set(`errorByUserId.${userId}`, false);
  }
}
