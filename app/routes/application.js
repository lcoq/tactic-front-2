import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service store;
  @service authentication;

  beforeModel() {
    if (this.authentication.isRecoverable) {
      return this.store
        .queryRecord('session', { include: 'user,user.configs' })
        .then((session) => this.authentication.authenticate(session))
        .catch(() => {});
    }
  }
}
