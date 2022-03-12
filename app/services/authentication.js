import Service from '@ember/service';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import EventEmitter from 'eventemitter3';
import { isEmpty } from '@ember/utils';

export default class AuthenticationService extends Service {
  @service cookieStore;

  @tracked isAuthenticated = false;
  @tracked userName = null;
  @tracked userId = null;
  @tracked token = null;

  get notAuthenticated() {
    return !this.isAuthenticated;
  }

  get sessionName() {
    return this.userName;
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
    this.isAuthenticated = true;
    this.userName = session.name;
    this.userId = session.userId;
    this._setToken(session.token);
    this.eventEmitter.emit('authenticated');
  }

  deauthenticate() {
    this.isAuthenticated = false;
    this.userName = null;
    this.userId = null;
    this._setToken(null);
    this.eventEmitter.emit('deauthenticated');
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
