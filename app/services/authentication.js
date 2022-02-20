import Service from '@ember/service';
import { service } from '@ember/service';
import { computed, set } from '@ember/object';
import { not, notEmpty, reads } from '@ember/object/computed';
import { tracked } from '@glimmer/tracking';

export default class AuthenticationService extends Service {
  @service cookieStore;

  @tracked session;
  @tracked userId;

  @notEmpty('session') isAuthenticated;
  @not('isAuthenticated') notAuthenticated;

  @reads('session.name') sessionName;
  @notEmpty('token') isRecoverable;

  @computed
  get token() {
    return null;
  }
  set token(newToken) {
    if (newToken !== this.cookieStore.getCookie('token')) {
      this.cookieStore.setCookie('token', newToken);
    }
    return newToken;
  }

  init() {
    super.init(...arguments);
    this._retrieveToken();
  }

  authenticate(session) {
    this.session = session;
    this.token = session.token;
    this.userId = session.belongsTo('user').id();
  }

  _retrieveToken() {
    const token = this.cookieStore.getCookie('token');
    if (token) set(this, 'token', token);
  }
}
