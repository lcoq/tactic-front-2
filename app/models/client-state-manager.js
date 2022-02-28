import MutableRecordStateManagerModel from './mutable-record-state-manager';
import { isEmpty } from '@ember/utils';

export default class ClientStateManagerModel extends MutableRecordStateManagerModel {
  get client() {
    return this.source;
  }

  checkValid(client) {
    return !isEmpty(client.name);
  }
}
