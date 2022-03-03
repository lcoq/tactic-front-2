import { set } from '@ember/object';
import Service from '@ember/service';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import EventEmitter from 'eventemitter3';
import { isEmpty } from '@ember/utils';

export default class AuthenticationService extends Service {
  @service cookieStore;

  @tracked session;
  @tracked userId;
  @tracked token;

  get isAuthenticated() {
    return !isEmpty(this.session);
  }

  get notAuthenticated() {
    return !this.isAuthenticated;
  }

  get sessionName() {
    return this.session.name;
  }

  get isRecoverable() {
    return !isEmpty(this.token);
  }

  constructor() {
    super(...arguments);
    this.eventEmitter = new EventEmitter();
    this._retrieveToken();
  }

  authenticate(session) {
    this.session = session;
    this._setToken(session.token);
    set(this, 'userId', session.userId);
    this.eventEmitter.emit('authenticated');
  }

  _retrieveToken() {
    const token = this.cookieStore.getCookie('token');
    if (token) this._setToken(token);
  }

  _setToken(newToken) {
    if (newToken !== this.cookieStore.getCookie('token')) {
      this.cookieStore.setCookie('token', newToken);
    }
    this.token = newToken;
  }
}
