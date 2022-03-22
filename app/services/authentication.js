import Service from '@ember/service';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import EventEmitter from 'eventemitter3';
import { isEmpty } from '@ember/utils';

export default class AuthenticationService extends Service {
  @service cookieStore;

  @tracked isAuthenticated = false;
  @tracked user = null;
  @tracked configs = null;
  @tracked token = null;

  get notAuthenticated() {
    return !this.isAuthenticated;
  }

  get isRecoverable() {
    return !isEmpty(this.token);
  }

  get userId() {
    return this.user?.id;
  }

  get userName() {
    return this.user?.name;
  }

  constructor() {
    super(...arguments);
    this.eventEmitter = new EventEmitter();
    this._retrieveToken();
  }

  async authenticate(session) {
    this.isAuthenticated = true;
    this.user = await session.user;
    this.configs = await this.user.configs;
    this._setToken(session.token);
    this.eventEmitter.emit('authenticated');
  }

  deauthenticate() {
    this.isAuthenticated = false;
    this.user = null;
    this.configs = null;
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
