import JSONAPIAdapter from '@ember-data/adapter/json-api';
import { service } from '@ember/service';

import ENV from '../config/environment';

export default class ApplicationAdapter extends JSONAPIAdapter {
  @service authentication;

  get headers() {
    const headers = {};
    const token = this.authentication.token;
    if (token) headers['Authorization'] = token;
    return headers;
  }

  host = ENV.APP.host;
}
