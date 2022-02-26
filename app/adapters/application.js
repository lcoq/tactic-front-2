import JSONAPIAdapter from '@ember-data/adapter/json-api';
import { service } from '@ember/service';

export default class ApplicationAdapter extends JSONAPIAdapter {
  @service authentication;

  get headers() {
    const headers = {};
    const token = this.authentication.token;
    if (token) headers['Authorization'] = token;
    return headers;
  }

  host = 'http://localhost:3000';
}
