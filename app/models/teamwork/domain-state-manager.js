import MutableRecordStateManagerModel from '../mutable-record-state-manager';
import { isEmpty } from '@ember/utils';

export default class TeamworkDomainStateManagerModel extends MutableRecordStateManagerModel {
  get domain() {
    return this.source;
  }

  checkValid(domain) {
    return !isEmpty(domain.name) && !isEmpty(domain.token);
  }
}
